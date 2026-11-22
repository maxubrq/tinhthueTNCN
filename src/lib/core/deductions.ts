/**
 * Giảm trừ năm khi quyết toán.
 *
 *  - Gia cảnh: bản thân (đủ 12 tháng hoặc theo tháng có thu nhập, theo Rulebook) và người
 *    phụ thuộc theo số tháng. Người phụ thuộc đăng ký sau hạn hoặc có thu nhập vượt mức
 *    bị loại, kèm cảnh báo (I10).
 *  - Hưu trí tự nguyện (và BH nhân thọ nếu Rulebook cho phép): trần tháng × 12.
 *  - Y tế, giáo dục, từ thiện: CHỈ trong kịch bản tự quyết toán (I9). Kịch bản là tham
 *    số bắt buộc nên không thể quên.
 */
import type { Rulebook, SelfSettlementDeduction } from '../rules/schema';
import type { Scenario, TaxYearCase } from './case';
import { minMoney, sum, toMoney, type Money } from './money';
import { resolveByPeriod } from './resolve';
import type { ParamUse, Warning } from './trace';

export interface DeductionItem {
	readonly amount: Money;
	readonly uses: readonly ParamUse[];
	readonly inputs: readonly string[];
	readonly note?: string;
}

export interface AnnualDeductions {
	readonly taxpayer: DeductionItem & { readonly months: number };
	readonly dependents: DeductionItem & { readonly counted: readonly { readonly id: string; readonly months: number }[] };
	readonly pension: DeductionItem;
	readonly medical: DeductionItem;
	readonly education: DeductionItem;
	readonly charity: DeductionItem;
	readonly warnings: readonly Warning[];
}

const NONE: DeductionItem = { amount: 0, uses: [], inputs: [] };

function selfOnly(
	key: 'medical' | 'education' | 'charity',
	rb: Rulebook,
	claimed: Money | undefined,
	scenario: Scenario,
	warnings: Warning[]
): DeductionItem {
	const r = resolveByPeriod(`deductions.${key}`, rb.deductions[key]);
	const rule: SelfSettlementDeduction | null = r.value;
	if (!claimed) return NONE;
	const input = `claims.${key}`;
	if (rule === null) {
		warnings.push({ code: `${key.toUpperCase()}_NOT_IN_PERIOD`, message: `Kỳ ${rb.taxYear} không có giảm trừ ${LABEL[key]}.`, inputs: [input] });
		return { amount: 0, uses: [r.use], inputs: [input] };
	}
	if (scenario.filing !== 'SELF') {
		warnings.push({
			code: `${key.toUpperCase()}_SELF_ONLY`,
			message: `Giảm trừ ${LABEL[key]} chỉ được trừ khi tự quyết toán; kịch bản ủy quyền không tính khoản này.`,
			inputs: [input]
		});
		return { amount: 0, uses: [r.use], inputs: [input] };
	}
	const amount = rule.annualCap === null ? claimed : minMoney(claimed, rule.annualCap);
	return { amount, uses: [r.use], inputs: [input] };
}

const LABEL = { medical: 'y tế', education: 'giáo dục', charity: 'từ thiện' } as const;

export function annualDeductions(
	rb: Rulebook,
	c: TaxYearCase,
	scenario: Scenario,
	monthsWithIncome: number
): AnnualDeductions {
	const warnings: Warning[] = [];
	const d = rb.deductions;

	// Bản thân
	const tpMonthly = resolveByPeriod('deductions.taxpayerMonthly', d.taxpayerMonthly);
	const tpMonths = resolveByPeriod('deductions.taxpayerMonths', d.taxpayerMonths);
	const months = tpMonths.value === 'FULL_YEAR' ? 12 : monthsWithIncome;
	const taxpayer = {
		amount: toMoney(BigInt(tpMonthly.value) * BigInt(months)),
		months,
		uses: [tpMonthly.use, tpMonths.use],
		inputs: []
	};

	// Người phụ thuộc
	const depMonthly = resolveByPeriod('deductions.dependentMonthly', d.dependentMonthly);
	const deadline = resolveByPeriod('deductions.dependentRegistrationDeadline', d.dependentRegistrationDeadline);
	const incomeLimit = resolveByPeriod('deductions.dependentIncomeMonthlyLimit', d.dependentIncomeMonthlyLimit);
	const counted: { id: string; months: number }[] = [];
	const depUses: ParamUse[] = [];
	const depInputs: string[] = [];
	c.dependents.forEach((dep, i) => {
		const w = `dependents[${i}]`;
		depUses.push(deadline.use);
		if (dep.registeredOn > deadline.value) {
			warnings.push({
				code: 'DEPENDENT_LATE_REGISTRATION',
				message: `${dep.name}: đăng ký ngày ${dep.registeredOn}, sau hạn ${deadline.value}, nên không được tính.`,
				inputs: [`${w}.registeredOn`],
				openIssues: deadline.use.openIssues
			});
			return;
		}
		if (dep.monthlyIncome !== undefined) {
			depUses.push(incomeLimit.use);
			if (dep.monthlyIncome > incomeLimit.value) {
				warnings.push({
					code: 'DEPENDENT_INCOME_OVER_LIMIT',
					message: `${dep.name}: thu nhập bình quân ${dep.monthlyIncome} đ/tháng vượt mức ${incomeLimit.value} đ, nên không được tính.`,
					inputs: [`${w}.monthlyIncome`],
					openIssues: incomeLimit.use.openIssues
				});
				return;
			}
		}
		if (dep.hasPension) {
			warnings.push({
				code: 'DEPENDENT_HAS_PENSION',
				message: `${dep.name}: có lương hưu. Chưa rõ lương hưu có tính vào mức thu nhập tối đa không; app đang vẫn tính.`,
				inputs: [`${w}.hasPension`],
				openIssues: ['oi-2']
			});
		}
		counted.push({ id: dep.id, months: dep.toMonth - dep.fromMonth + 1 });
		depInputs.push(`${w}.fromMonth`, `${w}.toMonth`);
	});
	const depMonths = counted.reduce((a, x) => a + x.months, 0);
	if (counted.length > 0) depUses.push(depMonthly.use);
	const dependents = {
		amount: toMoney(BigInt(depMonthly.value) * BigInt(depMonths)),
		counted,
		uses: depUses,
		inputs: depInputs
	};

	// Hưu trí tự nguyện, BH nhân thọ
	const pen = resolveByPeriod('deductions.voluntaryPension', d.voluntaryPension);
	const penInputs: string[] = [];
	const penClaims: Money[] = [];
	if (c.claims.voluntaryPension) {
		penInputs.push('claims.voluntaryPension');
		penClaims.push(c.claims.voluntaryPension);
	}
	if (c.claims.lifeInsurance) {
		penInputs.push('claims.lifeInsurance');
		if (pen.value.covers.includes('LIFE_INSURANCE')) penClaims.push(c.claims.lifeInsurance);
		else
			warnings.push({
				code: 'LIFE_INSURANCE_NOT_DEDUCTIBLE',
				message: `Kỳ ${rb.taxYear} chưa cho trừ bảo hiểm nhân thọ.`,
				inputs: ['claims.lifeInsurance']
			});
	}
	const pension: DeductionItem =
		penClaims.length === 0
			? NONE
			: { amount: minMoney(sum(penClaims), toMoney(BigInt(pen.value.monthlyCap) * 12n)), uses: [pen.use], inputs: penInputs };

	return {
		taxpayer,
		dependents,
		pension,
		medical: selfOnly('medical', rb, c.claims.medical, scenario, warnings),
		education: selfOnly('education', rb, c.claims.education, scenario, warnings),
		charity: selfOnly('charity', rb, c.claims.charity, scenario, warnings),
		warnings
	};
}
