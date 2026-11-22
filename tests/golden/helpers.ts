import type { IncomeSource, Payment, TaxYearCase } from '../../src/lib/core/case';
import type { IsoDate } from '../../src/lib/rules/schema';

export const TR = 1_000_000;

/** 12 lần trả lương vào ngày 25 hằng tháng. */
export function monthly(year: number, gross: number, extra: Partial<Payment> = {}): Payment[] {
	return Array.from({ length: 12 }, (_, m) => ({
		date: `${year}-${String(m + 1).padStart(2, '0')}-25` as IsoDate,
		gross,
		...extra
	}));
}

export function source(partial: Partial<IncomeSource> & Pick<IncomeSource, 'id' | 'payments'>): IncomeSource {
	return { name: partial.id, contractMonths: 12, claimsPersonalDeduction: false, ...partial };
}

export function taxCase(year: number, incomeSources: IncomeSource[], extra: Partial<TaxYearCase> = {}): TaxYearCase {
	return { taxPeriod: year, residency: 'RESIDENT', incomeSources, dependents: [], claims: {}, ...extra };
}
