/**
 * Thu nhập chịu thuế (TNCT, `taxableIncome`) từ tiền lương, tiền công, gom theo nguồn
 * và tháng chi trả. Mỗi tháng của mỗi nguồn là đơn vị mà doanh nghiệp khấu trừ, nên
 * cũng là đơn vị áp các trần theo tháng (tiền ăn, tiền nhà).
 *
 * Chỉ dành cho tiền lương, tiền công. Thu nhập chịu thuế suất toàn phần (đầu tư, chuyển
 * nhượng, trúng thưởng…) không có đường vào module này (I8).
 */
import type { IsoDate, Rulebook } from '../rules/schema';
import { monthOf, type IncomeSource, type TaxYearCase } from './case';
import { employeeInsurance } from './insurance';
import { applyRate, MECHANISM_ROUNDING, minMoney, sum, type Money } from './money';
import { resolveByDate, resolveByPeriod } from './resolve';
import type { ParamUse } from './trace';

/** Cách doanh nghiệp phải khấu trừ nguồn này theo luật. */
export type WithholdingRegime = 'PROGRESSIVE' | 'FLAT';

export function regimeOf(rb: Rulebook, source: IncomeSource): { regime: WithholdingRegime; use: ParamUse } {
	const min = resolveByPeriod('withholding.progressiveMinContractMonths', rb.withholding.progressiveMinContractMonths);
	const regime = source.contractMonths !== null && source.contractMonths >= min.value ? 'PROGRESSIVE' : 'FLAT';
	return { regime, use: min.use };
}

export interface SourceMonth {
	readonly sourceIndex: number;
	readonly sourceId: string;
	readonly month: number;
	/** Nhóm các lần chi trả sau khi nghỉ việc, tách khỏi lương thường trong cùng tháng. */
	readonly afterTermination: boolean;
	readonly paymentIndexes: readonly number[];
	readonly lastDate: IsoDate;
	readonly gross: Money;
	readonly mealExempt: Money;
	readonly overtimeExempt: Money;
	readonly otherExempt: Money;
	/** Phần tiền nhà tính vào TNCT, sau khi áp trần tỷ lệ. */
	readonly housingIncluded: Money;
	readonly taxableIncome: Money;
	readonly insurance: Money;
	readonly uses: readonly ParamUse[];
}

export function sourceMonths(rb: Rulebook, c: TaxYearCase): SourceMonth[] {
	const out: SourceMonth[] = [];
	const overtimeRule = resolveByPeriod('employmentIncome.overtime', rb.employmentIncome.overtime);
	const housingCap = resolveByPeriod('employmentIncome.housingInclusionCap', rb.employmentIncome.housingInclusionCap);

	c.incomeSources.forEach((source, sourceIndex) => {
		// Nhóm theo (tháng, sau-khi-nghỉ): lần chi sau khi nghỉ khấu trừ theo cách khác lương thường.
		const groups = new Map<string, { month: number; after: boolean; idx: number[] }>();
		source.payments.forEach((p, j) => {
			const m = monthOf(p.date);
			const after = p.paidAfterTermination === true;
			const k = `${String(m).padStart(2, '0')}|${after ? 1 : 0}`;
			const g = groups.get(k) ?? { month: m, after, idx: [] };
			g.idx.push(j);
			groups.set(k, g);
		});
		for (const key of [...groups.keys()].sort()) {
			const { month, after, idx: raw } = groups.get(key)!;
			const idx = raw.sort((a, b) => (source.payments[a].date < source.payments[b].date ? -1 : 1));
			const uses: ParamUse[] = [];
			let mealCapUsed = 0;
			const meal: Money[] = [];
			const overtime: Money[] = [];
			const other: Money[] = [];
			const housing: Money[] = [];
			const insurance: Money[] = [];
			for (const j of idx) {
				const p = source.payments[j];
				if (p.mealAllowanceCash) {
					const rule = resolveByDate('employmentIncome.mealAllowance', rb.employmentIncome.mealAllowance, p.date);
					uses.push(rule.use);
					if (rule.value.kind === 'MONTHLY_CAP') {
						const e = minMoney(p.mealAllowanceCash, Math.max(0, rule.value.monthlyCap - mealCapUsed));
						mealCapUsed += e;
						meal.push(e);
					} else {
						meal.push(p.mealExemptByPolicy ?? 0);
					}
				}
				if (p.overtime) {
					uses.push(overtimeRule.use);
					overtime.push(overtimeRule.value === 'FULL_WITHIN_LEGAL_LIMIT' ? p.overtime.total : p.overtime.premium);
				}
				other.push(p.otherExempt ?? 0);
				housing.push(p.housing ?? 0);
				const ins = employeeInsurance(rb, p.date, p.insurance);
				uses.push(...ins.uses);
				insurance.push(ins.amount);
			}
			const gross = sum(idx.map((j) => source.payments[j].gross));
			const mealExempt = sum(meal);
			const overtimeExempt = sum(overtime);
			const otherExempt = sum(other);
			const withoutHousing = gross - mealExempt - overtimeExempt - otherExempt;
			const housingTotal = sum(housing);
			let housingIncluded = 0;
			if (housingTotal > 0) {
				uses.push(housingCap.use);
				housingIncluded = minMoney(housingTotal, applyRate(withoutHousing, housingCap.value, MECHANISM_ROUNDING));
			}
			out.push({
				sourceIndex,
				sourceId: source.id,
				month,
				afterTermination: after,
				paymentIndexes: idx,
				lastDate: source.payments[idx[idx.length - 1]].date,
				gross,
				mealExempt,
				overtimeExempt,
				otherExempt,
				housingIncluded,
				taxableIncome: withoutHousing + housingIncluded,
				insurance: sum(insurance),
				uses
			});
		}
	});
	return out;
}
