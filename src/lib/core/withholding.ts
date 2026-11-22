/**
 * Mô phỏng số doanh nghiệp ĐÃ khấu trừ, chỉ dùng khi người dùng không nhập số thực tế
 * (ADR-006, I11). Kết quả luôn mang nhãn SIMULATED.
 *
 *  - Nguồn khấu trừ lũy tiến: theo từng tháng chi trả, biểu tháng, giảm trừ ở nơi người
 *    nộp thuế đăng ký. Nếu ngày chi trả nằm trong một giả định thực hành của Rulebook
 *    (ví dụ T1–T6/2026 theo biểu 7 bậc, điểm mở 5) và người dùng chọn 'DEFAULT', dùng
 *    biểu và mức giảm trừ của giả định đó.
 *  - Nguồn khấu trừ cố định, và mọi lần chi sau khi đã nghỉ việc: thuế suất cố định trên mỗi
 *    lần chi từ ngưỡng trở lên.
 *
 * Mô phỏng không trừ hưu trí tự nguyện theo tháng: số thực tế có thể thấp hơn.
 */
import type { IsoDate, Rulebook, WithholdingPractice } from '../rules/schema';
import { personalDeductionMonthsOf, type TaxYearCase } from './case';
import { regimeOf, type SourceMonth } from './income';
import { applyRate, MECHANISM_ROUNDING, sum, type Money } from './money';
import { resolveByDate, resolveByPeriod } from './resolve';
import { progressiveTax } from './schedule';
import type { ParamUse } from './trace';

/** 'DEFAULT' áp các giả định thực hành của Rulebook; 'NONE' mô phỏng đúng theo luật. */
export type PracticeChoice = 'DEFAULT' | 'NONE';

export interface SimulatedMonth {
	readonly month: number;
	readonly taxBase: Money;
	readonly amount: Money;
	readonly practiceId: string | null;
}

export interface SimulatedWithholding {
	readonly sourceId: string;
	readonly amount: Money;
	readonly months: readonly SimulatedMonth[];
	readonly practiceIds: readonly string[];
	readonly uses: readonly ParamUse[];
}

function practiceUse(p: WithholdingPractice<string, string>): ParamUse {
	return {
		key: `withholdingPractices[${p.id}]`,
		axis: 'EVENT_DATE',
		segment: { from: p.from, to: p.to },
		status: p.status,
		sourceRefs: p.sourceRefs,
		openIssues: p.openIssues ?? [],
		rationale: p.rationale
	};
}

function practiceAt(rb: Rulebook, date: IsoDate, choice: PracticeChoice) {
	if (choice === 'NONE') return undefined;
	return rb.withholdingPractices.find((p) => p.from <= date && date <= p.to);
}

export function simulateWithholding(
	rb: Rulebook,
	c: TaxYearCase,
	months: readonly SourceMonth[],
	sourceIndex: number,
	choice: PracticeChoice
): SimulatedWithholding {
	const source = c.incomeSources[sourceIndex];
	const { regime, use: regimeUse } = regimeOf(rb, source);
	const uses: ParamUse[] = [regimeUse];
	const out: SimulatedMonth[] = [];
	const rounding = resolveByPeriod('rounding', rb.rounding);
	uses.push(rounding.use);

	const lawSchedule = resolveByPeriod('schedules.monthly', rb.schedules.monthly);
	const lawTaxpayer = resolveByPeriod('deductions.taxpayerMonthly', rb.deductions.taxpayerMonthly);
	const lawDependent = resolveByPeriod('deductions.dependentMonthly', rb.deductions.dependentMonthly);
	const deductionMonths = personalDeductionMonthsOf(source);

	for (const sm of months.filter((m) => m.sourceIndex === sourceIndex)) {
		// Thuế suất cố định: nguồn không có hợp đồng từ 3 tháng, hoặc lần chi sau khi đã nghỉ việc.
		if (regime === 'FLAT' || sm.afterTermination) {
			let amount = 0;
			let base = 0;
			for (const j of sm.paymentIndexes) {
				const p = source.payments[j];
				const min = resolveByDate('withholding.flatRateMinPayment', rb.withholding.flatRateMinPayment, p.date);
				const rate = resolveByDate('withholding.flatRate', rb.withholding.flatRate, p.date);
				uses.push(min.use, rate.use);
				if (p.gross >= min.value) {
					base += p.gross;
					amount += applyRate(p.gross, rate.value, MECHANISM_ROUNDING);
				}
			}
			out.push({ month: sm.month, taxBase: base, amount, practiceId: null });
			continue;
		}

		const practice = practiceAt(rb, sm.lastDate, choice);
		let deduction = 0;
		if (deductionMonths.has(sm.month)) {
			const deps = c.dependents.filter(
				(d) => d.fromMonth <= sm.month && sm.month <= d.toMonth && d.registeredOn <= sm.lastDate
			).length;
			if (practice) {
				deduction = practice.taxpayerMonthly + deps * practice.dependentMonthly;
			} else {
				uses.push(lawTaxpayer.use);
				if (deps > 0) uses.push(lawDependent.use);
				deduction = lawTaxpayer.value + deps * lawDependent.value;
			}
		}
		if (practice) uses.push(practiceUse(practice));
		else uses.push(lawSchedule.use);
		const taxBase = Math.max(0, sm.taxableIncome - sm.insurance - deduction);
		const schedule = practice ? practice.monthlySchedule : lawSchedule.value;
		out.push({
			month: sm.month,
			taxBase,
			amount: progressiveTax(schedule, taxBase, rounding.value.monthlyTax),
			practiceId: practice?.id ?? null
		});
	}

	return {
		sourceId: source.id,
		amount: sum(out.map((m) => m.amount)),
		months: out,
		practiceIds: [...new Set(out.map((m) => m.practiceId).filter((x): x is string => x !== null))],
		uses
	};
}
