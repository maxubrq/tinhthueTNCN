/**
 * Δ quyết toán (`SettlementDelta`) cho một kịch bản.
 *
 *   Δ = Biểu_năm(TNTT_năm) − Σ số đã khấu trừ của các nguồn được gộp
 *   TNTT_năm = max(0, Σ TNCT − Σ bảo hiểm − giảm trừ)
 *
 * Kết quả = f(hồ sơ, Rulebook, kịch bản, lựa chọn giả định) (I1). Mỗi con số là một
 * `Line` có dấu vết và cờ (I13, I14). Δ âm là được hoàn; số hoàn không bao giờ vượt quá
 * số đã khấu trừ vì thuế năm ≥ 0 (I7).
 *
 * Chưa hỗ trợ: thuế đã nộp ở nước ngoài, năm cư trú đầu tiên theo 12 tháng liên tục.
 */
import type { Rulebook } from '../rules/schema';
import { assertScenarioFits, assertValidCase, type Scenario, type TaxYearCase } from './case';
import { annualDeductions, type DeductionItem } from './deductions';
import { InvalidCaseError } from './errors';
import { regimeOf, sourceMonths, type SourceMonth, type WithholdingRegime } from './income';
import { fromBpsNumerator, maxMoney, sum, type Money } from './money';
import { resolveByPeriod } from './resolve';
import { annualScheduleOf, marginalRate, progressiveTax } from './schedule';
import { mergeFlags, Trace, type Flag, type Line, type Warning } from './trace';
import { assertValidRulebook } from './validate';
import { simulateWithholding, type PracticeChoice } from './withholding';

export const ENGINE_VERSION = '0.1.0';

export interface AssessOptions {
	/** Giả định thực hành khi mô phỏng số đã khấu trừ. Mặc định 'DEFAULT' (điểm mở 5). */
	readonly practice?: PracticeChoice;
}

export type DeltaDirection = 'PAY' | 'REFUND' | 'NONE';

export interface SettlementDelta {
	/** Dương: phải nộp thêm. Âm: được hoàn. */
	readonly amount: Money;
	readonly direction: DeltaDirection;
	/**
	 * |Δ| ≤ ngưỡng (50.000 đ). Phải nộp thêm thì được miễn nộp; nộp thừa thì bù trừ kỳ
	 * sau, không hoàn. Năm 2026 có thể vẫn phải nộp hồ sơ (điểm mở 3).
	 */
	readonly withinSmallThreshold: boolean;
	readonly smallThreshold: Money;
}

export interface WithheldBySource {
	readonly sourceId: string;
	readonly regime: WithholdingRegime;
	readonly amount: Money;
	readonly provenance: 'USER' | 'SIMULATED';
	readonly practiceIds: readonly string[];
}

export interface Assessment {
	readonly rulebookId: string;
	readonly rulebookRevision: number;
	readonly engineVersion: string;
	readonly taxPeriod: number;
	readonly residency: TaxYearCase['residency'];
	readonly scenario: Scenario;
	readonly includedSourceIds: readonly string[];
	readonly taxableIncome: Money;
	readonly insurance: Money;
	readonly deductions: Money;
	readonly assessableIncome: Money;
	readonly annualTax: Money;
	/** Thuế suất biên ở TNTT năm (phần vạn). */
	readonly marginalRate: number;
	readonly withheld: Money;
	readonly withheldBySource: readonly WithheldBySource[];
	readonly delta: SettlementDelta;
	readonly lines: readonly Line[];
	/** Hợp của cờ trên mọi dòng. */
	readonly flags: readonly Flag[];
	readonly warnings: readonly Warning[];
}

export function assess(rb: Rulebook, c: TaxYearCase, scenario: Scenario, options: AssessOptions = {}): Assessment {
	assertValidRulebook(rb);
	if (c.taxPeriod !== rb.taxYear) {
		throw new InvalidCaseError([`Hồ sơ kỳ ${c.taxPeriod} nhưng Rulebook là kỳ ${rb.taxYear} (${rb.id}).`]);
	}
	assertValidCase(c);
	assertScenarioFits(c, scenario);

	const practice = options.practice ?? 'DEFAULT';
	const months = sourceMonths(rb, c);
	const trace = new Trace();
	const warnings: Warning[] = [];

	const regimes = c.incomeSources.map((s) => regimeOf(rb, s));
	const casualAverage = casualWarning(rb, months, regimes, scenario, warnings);

	const included = c.incomeSources
		.map((s, i) => ({ s, i, regime: regimes[i].regime }))
		.filter(({ s, regime }) =>
			scenario.filing === 'AUTHORIZED'
				? s.id === scenario.sourceId
				: regime === 'PROGRESSIVE' || scenario.includeCasual
		);
	if (scenario.filing === 'AUTHORIZED' && included[0]?.regime === 'FLAT') {
		warnings.push({
			code: 'AUTHORIZED_SOURCE_NOT_PROGRESSIVE',
			message: 'Nơi này không ký hợp đồng từ 3 tháng với bạn, nên không nhận ủy quyền quyết toán được.'
		});
	}

	if (c.residency === 'NON_RESIDENT') {
		return nonResident(rb, c, scenario, months, included, trace, warnings, practice);
	}

	// 1. Thu nhập chịu thuế và bảo hiểm theo nguồn
	const taxableIds: string[] = [];
	const insuranceIds: string[] = [];
	for (const { s, i } of included) {
		const sm = months.filter((m) => m.sourceIndex === i);
		const uses = sm.flatMap((m) => m.uses);
		trace.add({
			id: `source:${s.id}:taxable`,
			label: `Thu nhập chịu thuế ở ${s.name}`,
			amount: sum(sm.map((m) => m.taxableIncome)),
			inputs: paymentInputs(i, sm, ['gross', 'mealAllowanceCash', 'mealExemptByPolicy', 'overtime', 'otherExempt', 'housing']),
			params: uses.filter((u) => !u.key.startsWith('insurance.'))
		});
		trace.add({
			id: `source:${s.id}:insurance`,
			label: `Bảo hiểm bắt buộc ở ${s.name}`,
			amount: sum(sm.map((m) => m.insurance)),
			inputs: paymentInputs(i, sm, ['insurance']),
			params: uses.filter((u) => u.key.startsWith('insurance.'))
		});
		taxableIds.push(`source:${s.id}:taxable`);
		insuranceIds.push(`source:${s.id}:insurance`);
	}
	const taxable = trace.add({
		id: 'taxableIncome',
		label: 'Tổng thu nhập chịu thuế',
		amount: sum(taxableIds.map((id) => trace.get(id).amount)),
		dependsOn: taxableIds
	});
	const insurance = trace.add({
		id: 'insurance',
		label: 'Tổng bảo hiểm bắt buộc',
		amount: sum(insuranceIds.map((id) => trace.get(id).amount)),
		dependsOn: insuranceIds
	});

	// 2. Giảm trừ
	const monthsWithIncome = new Set(months.filter((m) => included.some((x) => x.i === m.sourceIndex)).map((m) => m.month)).size;
	const ded = annualDeductions(rb, c, scenario, monthsWithIncome);
	warnings.push(...ded.warnings);
	const dedLine = (id: string, label: string, item: DeductionItem) =>
		trace.add({ id: `deduction:${id}`, label, amount: item.amount, inputs: item.inputs, params: item.uses, note: item.note });
	const dedLines = [
		dedLine('taxpayer', `Giảm trừ bản thân (${ded.taxpayer.months} tháng)`, ded.taxpayer),
		dedLine('dependents', `Giảm trừ người phụ thuộc (tổng ${ded.dependents.counted.reduce((a, x) => a + x.months, 0)} tháng)`, ded.dependents),
		dedLine('pension', 'Hưu trí tự nguyện, bảo hiểm nhân thọ', ded.pension),
		dedLine('medical', 'Chi phí y tế', ded.medical),
		dedLine('education', 'Chi phí giáo dục', ded.education),
		dedLine('charity', 'Từ thiện, nhân đạo, khuyến học', ded.charity)
	];
	const deductions = trace.add({
		id: 'deductions',
		label: 'Tổng giảm trừ',
		amount: sum(dedLines.map((l) => l.amount)),
		dependsOn: dedLines.map((l) => l.id)
	});

	// 3. Thu nhập tính thuế và thuế năm
	const assessable = trace.add({
		id: 'assessableIncome',
		label: 'Thu nhập tính thuế năm',
		amount: maxMoney(0, taxable.amount - insurance.amount - deductions.amount),
		dependsOn: [taxable.id, insurance.id, deductions.id],
		note: 'Giảm trừ lớn hơn thu nhập thì lấy bằng 0.'
	});
	const schedule = annualScheduleOf(rb);
	const rounding = resolveByPeriod('rounding', rb.rounding);
	const annualTax = trace.add({
		id: 'annualTax',
		label: 'Thuế TNCN cả năm theo biểu',
		amount: progressiveTax(schedule.value, assessable.amount, rounding.value.annualTax),
		params: [...schedule.uses, rounding.use],
		dependsOn: [assessable.id]
	});

	// 4. Đã khấu trừ, Δ
	const withheld = withheldLines(rb, c, months, included, trace, practice);
	return finish(rb, c, scenario, included, trace, warnings, {
		taxable: taxable.amount,
		insurance: insurance.amount,
		deductions: deductions.amount,
		assessable: assessable.amount,
		annualTax,
		marginal: marginalRate(schedule.value, assessable.amount),
		withheld,
		casualAverage
	});
}

type Included = { s: TaxYearCase['incomeSources'][number]; i: number; regime: WithholdingRegime }[];

function paymentInputs(i: number, sm: readonly SourceMonth[], fields: readonly string[]): string[] {
	return sm.flatMap((m) => m.paymentIndexes.flatMap((j) => fields.map((f) => `incomeSources[${i}].payments[${j}].${f}`)));
}

function casualWarning(
	rb: Rulebook,
	months: readonly SourceMonth[],
	regimes: readonly { regime: WithholdingRegime }[],
	scenario: Scenario,
	warnings: Warning[]
): Money {
	const casualTotal = sum(
		months.filter((m) => regimes[m.sourceIndex].regime === 'FLAT' && !m.afterTermination).map((m) => m.taxableIncome)
	);
	if (casualTotal === 0) return 0;
	const cap = resolveByPeriod('settlement.casualIncomeMonthlyAverageCap', rb.settlement.casualIncomeMonthlyAverageCap);
	const average = Math.floor(casualTotal / 12);
	const excluded = scenario.filing === 'AUTHORIZED' || !scenario.includeCasual;
	if (excluded && average > cap.value) {
		warnings.push({
			code: 'CASUAL_OVER_CAP_EXCLUDED',
			message: 'Thu nhập vãng lai bình quân mỗi tháng của bạn vượt ngưỡng, nên luật buộc bạn tự quyết toán và gộp khoản này. Kết quả này chưa gộp, chỉ để so sánh.',
			openIssues: cap.use.openIssues
		});
	} else if (scenario.filing === 'SELF' && !scenario.includeCasual) {
		warnings.push({
			code: 'CASUAL_EXCLUDED',
			message: 'Kết quả này không gộp thu nhập vãng lai: bỏ cả khoản thu nhập lẫn 10% đã khấu trừ ở những nơi đó.',
			openIssues: ['oi-16']
		});
	}
	return average;
}

function withheldLines(
	rb: Rulebook,
	c: TaxYearCase,
	months: readonly SourceMonth[],
	included: Included,
	trace: Trace,
	practice: PracticeChoice
): WithheldBySource[] {
	return included.map(({ s, i, regime }) => {
		const id = `source:${s.id}:withheld`;
		if (s.withheld) {
			trace.add({
				id,
				label: `Thuế ${s.name} đã khấu trừ`,
				amount: s.withheld.amount,
				inputs: [`incomeSources[${i}].withheld.amount`]
			});
			return { sourceId: s.id, regime, amount: s.withheld.amount, provenance: 'USER', practiceIds: [] };
		}
		const sim = simulateWithholding(rb, c, months, i, practice);
		trace.add({
			id,
			label: `Thuế ${s.name} đã khấu trừ (app ước tính)`,
			amount: sim.amount,
			inputs: paymentInputs(i, months.filter((m) => m.sourceIndex === i), ['gross']),
			params: sim.uses,
			dependsOn: [`source:${s.id}:taxable`],
			extraFlags: [{ kind: 'SIMULATED', sourceId: s.id, practiceIds: sim.practiceIds }]
		});
		return { sourceId: s.id, regime, amount: sim.amount, provenance: 'SIMULATED', practiceIds: sim.practiceIds };
	});
}

function finish(
	rb: Rulebook,
	c: TaxYearCase,
	scenario: Scenario,
	included: Included,
	trace: Trace,
	warnings: Warning[],
	t: {
		taxable: Money;
		insurance: Money;
		deductions: Money;
		assessable: Money;
		annualTax: Line;
		marginal: number;
		withheld: WithheldBySource[];
		casualAverage: Money;
	}
): Assessment {
	const withheldIds = t.withheld.map((w) => `source:${w.sourceId}:withheld`);
	const withheld = trace.add({
		id: 'withheld',
		label: 'Tổng đã khấu trừ',
		amount: sum(t.withheld.map((w) => w.amount)),
		dependsOn: withheldIds
	});
	const threshold = resolveByPeriod('settlement.smallDeltaThreshold', rb.settlement.smallDeltaThreshold);
	const amount = t.annualTax.amount - withheld.amount;
	const deltaLine = trace.add({
		id: 'delta',
		label: amount > 0 ? 'Phải nộp thêm' : amount < 0 ? 'Được hoàn' : 'Không chênh lệch',
		amount,
		params: amount !== 0 && Math.abs(amount) <= threshold.value ? [threshold.use] : [],
		dependsOn: [t.annualTax.id, withheld.id]
	});
	const lines = trace.lines();
	return {
		rulebookId: rb.id,
		rulebookRevision: rb.revision,
		engineVersion: ENGINE_VERSION,
		taxPeriod: c.taxPeriod,
		residency: c.residency,
		scenario,
		includedSourceIds: included.map((x) => x.s.id),
		taxableIncome: t.taxable,
		insurance: t.insurance,
		deductions: t.deductions,
		assessableIncome: t.assessable,
		annualTax: t.annualTax.amount,
		marginalRate: t.marginal,
		withheld: withheld.amount,
		withheldBySource: t.withheld,
		delta: {
			amount,
			direction: amount > 0 ? 'PAY' : amount < 0 ? 'REFUND' : 'NONE',
			withinSmallThreshold: amount !== 0 && Math.abs(amount) <= threshold.value,
			smallThreshold: threshold.value
		},
		lines,
		flags: mergeFlags(deltaLine.flags, ...lines.map((l) => l.flags)),
		warnings
	};
}

/** Người không cư trú: thuế suất cố định trên tổng TNCT, không có giảm trừ, không vào biểu (I8). */
function nonResident(
	rb: Rulebook,
	c: TaxYearCase,
	scenario: Scenario,
	months: readonly SourceMonth[],
	included: Included,
	trace: Trace,
	warnings: Warning[],
	practice: PracticeChoice
): Assessment {
	const ids: string[] = [];
	for (const { s, i } of included) {
		const sm = months.filter((m) => m.sourceIndex === i);
		trace.add({
			id: `source:${s.id}:taxable`,
			label: `Thu nhập chịu thuế ở ${s.name}`,
			amount: sum(sm.map((m) => m.taxableIncome)),
			inputs: paymentInputs(i, sm, ['gross']),
			params: sm.flatMap((m) => m.uses).filter((u) => !u.key.startsWith('insurance.'))
		});
		ids.push(`source:${s.id}:taxable`);
	}
	const taxable = trace.add({
		id: 'taxableIncome',
		label: 'Tổng thu nhập chịu thuế',
		amount: sum(ids.map((id) => trace.get(id).amount)),
		dependsOn: ids
	});
	const rate = resolveByPeriod('nonResident.employmentRate', rb.nonResident.employmentRate);
	const rounding = resolveByPeriod('rounding', rb.rounding);
	const annualTax = trace.add({
		id: 'annualTax',
		label: 'Thuế TNCN của người không cư trú (thuế suất cố định)',
		amount: fromBpsNumerator(BigInt(taxable.amount) * BigInt(rate.value), rounding.value.annualTax),
		params: [rate.use, rounding.use],
		dependsOn: [taxable.id],
		note: 'Người không cư trú không được giảm trừ gia cảnh, bảo hiểm hay bất kỳ khoản nào khác.'
	});
	warnings.push({ code: 'NON_RESIDENT', message: 'App chưa tính đầy đủ cho người không cư trú; hãy coi con số là tham khảo.' });
	const withheld = withheldLines(rb, c, months, included, trace, practice);
	return finish(rb, c, scenario, included, trace, warnings, {
		taxable: taxable.amount,
		insurance: 0,
		deductions: 0,
		assessable: taxable.amount,
		annualTax,
		marginal: rate.value,
		withheld,
		casualAverage: 0
	});
}
