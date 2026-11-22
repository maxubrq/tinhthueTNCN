/**
 * Hồ sơ năm thuế (`TaxYearCase`): dữ kiện người dùng khai, đã chuẩn hóa. UI chuyển câu
 * trả lời thành kiểu này trước khi đưa vào core (lớp chống hỏng, kien-truc-v0 §3.2).
 * Mọi số tiền là số nguyên đồng. Core không suy diễn luật từ hồ sơ.
 */
import type { IsoDate, WageRegion } from '../rules/schema';
import { InvalidCaseError } from './errors';
import { isMoney, type Money } from './money';
import { isValidIsoDate } from './validate';

export type Residency = 'RESIDENT' | 'NON_RESIDENT';

/** Bảo hiểm bắt buộc phần người lao động của một lần chi trả. */
export type InsuranceInput =
	/** Số đã trừ trên phiếu lương. */
	| { readonly kind: 'AMOUNT'; readonly amount: Money }
	/** Lương đóng bảo hiểm; app áp tỷ lệ và trần theo ngày chi trả. */
	| { readonly kind: 'SALARY'; readonly salary: Money; readonly region: WageRegion };

/** Một lần nhận tiền (`Payment`). Thu nhập xác định tại ngày chi trả. */
export interface Payment {
	readonly date: IsoDate;
	/** Tổng tiền trả cho người lao động lần này: lương, thưởng, phụ cấp, tiền ăn bằng tiền, làm thêm giờ. */
	readonly gross: Money;
	/** Phần trong `gross` là tiền ăn ca bằng tiền. */
	readonly mealAllowanceCash?: Money;
	/** Phần tiền ăn được miễn theo quy chế; chỉ dùng khi luật kỳ đó để theo quy chế (điểm mở 12). */
	readonly mealExemptByPolicy?: Money;
	/** Phần trong `gross` là tiền làm thêm giờ, làm đêm; `premium` là phần cao hơn giờ thường. */
	readonly overtime?: { readonly total: Money; readonly premium: Money };
	/** Khoản miễn khác theo quy chế nằm trong `gross` (điện thoại, công tác phí, thôi việc…; điểm mở 10). */
	readonly otherExempt?: Money;
	/** Tiền nhà doanh nghiệp trả thay, KHÔNG nằm trong `gross`. */
	readonly housing?: Money;
	readonly insurance?: InsuranceInput;
}

/** Số đã khấu trừ do người dùng khai, ví dụ từ chứng từ khấu trừ hoặc eTax (I11). */
export interface WithheldAmount {
	readonly amount: Money;
	readonly provenance: 'USER';
}

/** Nguồn trả thu nhập (`IncomeSource`). */
export interface IncomeSource {
	readonly id: string;
	readonly name: string;
	/** Thời hạn hợp đồng (tháng); `null` = không có hợp đồng. */
	readonly contractMonths: number | null;
	/** Người nộp thuế đăng ký giảm trừ gia cảnh ở nguồn này (tối đa một nguồn). */
	readonly claimsPersonalDeduction: boolean;
	readonly payments: readonly Payment[];
	/** Tổng đã khấu trừ cả năm. Không có thì app mô phỏng và gắn nhãn SIMULATED. */
	readonly withheld?: WithheldAmount;
}

export interface Dependent {
	readonly id: string;
	readonly name: string;
	/** Tháng bắt đầu và kết thúc được tính giảm trừ, 1–12, bao gồm cả hai đầu. */
	readonly fromMonth: number;
	readonly toMonth: number;
	/** Ngày đăng ký người phụ thuộc. */
	readonly registeredOn: IsoDate;
	/** Thu nhập bình quân tháng của người phụ thuộc từ mọi nguồn. */
	readonly monthlyIncome?: Money;
	readonly hasPension?: boolean;
}

/** Khoản người dùng đã chi trong năm (tổng năm). */
export interface Claims {
	readonly voluntaryPension?: Money;
	readonly lifeInsurance?: Money;
	readonly medical?: Money;
	readonly education?: Money;
	readonly charity?: Money;
}

export interface TaxYearCase {
	/** Kỳ tính thuế (`TaxPeriod`): năm dương lịch. */
	readonly taxPeriod: number;
	readonly residency: Residency;
	readonly incomeSources: readonly IncomeSource[];
	readonly dependents: readonly Dependent[];
	readonly claims: Claims;
}

/** Kịch bản (`Scenario`, ADR-007): ủy quyền cho một nơi, hay tự quyết toán. */
export type Scenario =
	| { readonly filing: 'AUTHORIZED'; readonly sourceId: string }
	| { readonly filing: 'SELF'; readonly includeCasual: boolean };

export function monthOf(date: IsoDate): number {
	return Number(date.slice(5, 7));
}

export function caseProblems(c: TaxYearCase): string[] {
	const p: string[] = [];
	const money = (where: string, x: unknown, optional = true) => {
		if (x === undefined && optional) return;
		if (!isMoney(x) || x < 0) p.push(`${where}: phải là số nguyên đồng không âm (${String(x)}).`);
	};
	if (!Number.isSafeInteger(c.taxPeriod)) p.push('taxPeriod phải là năm.');
	const ids = new Set<string>();
	let claimers = 0;
	c.incomeSources.forEach((s, i) => {
		const w = `incomeSources[${i}]`;
		if (ids.has(s.id)) p.push(`${w}: id "${s.id}" bị trùng.`);
		ids.add(s.id);
		if (s.contractMonths !== null && (!Number.isSafeInteger(s.contractMonths) || s.contractMonths < 0)) {
			p.push(`${w}.contractMonths: phải là số tháng nguyên không âm hoặc null.`);
		}
		if (s.claimsPersonalDeduction) claimers++;
		if (s.withheld) money(`${w}.withheld.amount`, s.withheld.amount, false);
		s.payments.forEach((pay, j) => {
			const pw = `${w}.payments[${j}]`;
			if (!isValidIsoDate(pay.date) || !pay.date.startsWith(`${c.taxPeriod}-`)) {
				p.push(`${pw}.date: phải là ngày hợp lệ trong kỳ ${c.taxPeriod} (${pay.date}).`);
			}
			money(`${pw}.gross`, pay.gross, false);
			money(`${pw}.mealAllowanceCash`, pay.mealAllowanceCash);
			money(`${pw}.mealExemptByPolicy`, pay.mealExemptByPolicy);
			money(`${pw}.otherExempt`, pay.otherExempt);
			money(`${pw}.housing`, pay.housing);
			if (pay.overtime) {
				money(`${pw}.overtime.total`, pay.overtime.total, false);
				money(`${pw}.overtime.premium`, pay.overtime.premium, false);
				if (pay.overtime.premium > pay.overtime.total) p.push(`${pw}.overtime: phần chênh lệch lớn hơn tổng.`);
			}
			if ((pay.mealExemptByPolicy ?? 0) > (pay.mealAllowanceCash ?? 0)) {
				p.push(`${pw}: phần tiền ăn được miễn lớn hơn tiền ăn.`);
			}
			const inGross = (pay.mealAllowanceCash ?? 0) + (pay.overtime?.total ?? 0) + (pay.otherExempt ?? 0);
			if (inGross > pay.gross) p.push(`${pw}: tiền ăn + làm thêm giờ + khoản miễn khác vượt quá gross.`);
			if (pay.insurance?.kind === 'AMOUNT') money(`${pw}.insurance.amount`, pay.insurance.amount, false);
			if (pay.insurance?.kind === 'SALARY') money(`${pw}.insurance.salary`, pay.insurance.salary, false);
		});
	});
	if (claimers > 1) p.push('Chỉ được đăng ký giảm trừ gia cảnh ở một nơi trả thu nhập.');
	const depIds = new Set<string>();
	c.dependents.forEach((d, i) => {
		const w = `dependents[${i}]`;
		if (depIds.has(d.id)) p.push(`${w}: id "${d.id}" bị trùng.`);
		depIds.add(d.id);
		const okMonth = (m: number) => Number.isSafeInteger(m) && m >= 1 && m <= 12;
		if (!okMonth(d.fromMonth) || !okMonth(d.toMonth) || d.fromMonth > d.toMonth) p.push(`${w}: tháng phải trong 1–12 và từ ≤ đến.`);
		if (!isValidIsoDate(d.registeredOn)) p.push(`${w}.registeredOn: ngày không hợp lệ.`);
		money(`${w}.monthlyIncome`, d.monthlyIncome);
	});
	for (const k of ['voluntaryPension', 'lifeInsurance', 'medical', 'education', 'charity'] as const) {
		money(`claims.${k}`, c.claims[k]);
	}
	return p;
}

export function assertValidCase(c: TaxYearCase): void {
	const problems = caseProblems(c);
	if (problems.length > 0) throw new InvalidCaseError(problems);
}

export function assertScenarioFits(c: TaxYearCase, s: Scenario): void {
	if (s.filing === 'AUTHORIZED' && !c.incomeSources.some((x) => x.id === s.sourceId)) {
		throw new InvalidCaseError([`Kịch bản ủy quyền trỏ tới nguồn không có: "${s.sourceId}".`]);
	}
}
