/**
 * Bảo hiểm bắt buộc phần người lao động. Tỷ lệ và trần tra theo NGÀY chi trả (trục
 * EVENT_DATE): trần BHXH đổi 46,8 → 50,6 triệu từ 01/7/2026. Báo chí hay bỏ qua trần;
 * app luôn áp trần.
 */
import type { IsoDate, Rulebook } from '../rules/schema';
import type { InsuranceInput } from './case';
import { applyRate, MECHANISM_ROUNDING, minMoney, sum, type Money } from './money';
import { resolveByDate } from './resolve';
import type { ParamUse } from './trace';

export interface InsuranceResult {
	readonly amount: Money;
	readonly uses: readonly ParamUse[];
}

export function employeeInsurance(rb: Rulebook, date: IsoDate, input: InsuranceInput | undefined): InsuranceResult {
	if (!input) return { amount: 0, uses: [] };
	if (input.kind === 'AMOUNT') return { amount: input.amount, uses: [] };

	const rates = resolveByDate('insurance.employeeRates', rb.insurance.employeeRates, date);
	const shCap = resolveByDate('insurance.socialHealthMonthlyCap', rb.insurance.socialHealthMonthlyCap, date);
	const uCap = resolveByDate('insurance.unemploymentMonthlyCap', rb.insurance.unemploymentMonthlyCap, date);

	const shBase = minMoney(input.salary, shCap.value);
	const uBase = minMoney(input.salary, uCap.value[input.region]);
	const amount = sum([
		applyRate(shBase, rates.value.social, MECHANISM_ROUNDING),
		applyRate(shBase, rates.value.health, MECHANISM_ROUNDING),
		applyRate(uBase, rates.value.unemployment, MECHANISM_ROUNDING)
	]);
	return { amount, uses: [rates.use, shCap.use, uCap.use] };
}
