/**
 * Mô hình form của trang và lớp chống hỏng (kien-truc-v0 §3.2): chuyển câu trả lời của
 * người dùng thành `TaxYearCase` chuẩn trước khi đưa vào core. Module này không suy diễn
 * luật; mọi số tiền đã là số nguyên đồng (đơn vị nghìn, triệu chỉ sống trong ô nhập).
 *
 * Bản 2: mỗi nơi trả lương có dòng thời gian riêng.
 *  - `periods`: các khoảng tháng có lương thường, mỗi khoảng một mức lương. Nghỉ thai sản
 *    là khoảng trống giữa hai khoảng; tăng lương là hai khoảng liền nhau.
 *  - `extras`: các khoản trả một lần (thưởng, ESOP), có cờ "trả sau khi đã nghỉ việc".
 * Bất biến I17: một nơi trả lương là một công ty, dù nhập bao nhiêu khoảng.
 */
import type { Claims, Dependent, IncomeSource, Payment, TaxYearCase } from '../core/case';
import type { TriageAnswers } from '../core/obligation';
import type { PracticeChoice } from '../core/withholding';
import type { IsoDate, WageRegion } from '../rules/schema';

export type InsuranceMode = 'GROSS' | 'OTHER' | 'NONE';

export interface PeriodForm {
	key: string;
	fromMonth: number;
	toMonth: number;
	/** Thu nhập chịu thuế mỗi tháng trong khoảng này, trước bảo hiểm. */
	monthly: number | null;
	insurance: InsuranceMode;
	insuranceSalary: number | null;
}

export interface ExtraForm {
	key: string;
	month: number;
	amount: number | null;
	/** Nơi này trả khoản này sau khi bạn đã nghỉ việc ở đó. */
	afterLeaving: boolean;
}

export interface SourceForm {
	key: string;
	name: string;
	/** LONG: hợp đồng từ 3 tháng. SHORT: dưới 3 tháng hoặc không có hợp đồng. */
	contract: 'LONG' | 'SHORT';
	periods: PeriodForm[];
	extras: ExtraForm[];
	region: WageRegion;
	/** Tổng đã khấu trừ cả năm, người dùng nhập. `null` = để app ước tính. */
	withheld: number | null;
}

export interface DependentForm {
	key: string;
	name: string;
	fromMonth: number;
	toMonth: number;
	registeredInTime: boolean;
}

export interface FormState {
	version: 2;
	taxYear: number;
	resident: boolean;
	special: {
		foreignerLeaving: boolean;
		foreignerContractEnd: string;
		firstResidentYear: boolean;
		foreignIncome: boolean;
		hardship: boolean;
		insuranceOnly: boolean;
	};
	sources: SourceForm[];
	/** Nơi đăng ký giảm trừ gia cảnh. */
	personalSourceKey: string | null;
	/** Nơi đang làm lúc quyết toán; `null` = đã nghỉ việc. */
	currentSourceKey: string | null;
	dependents: DependentForm[];
	claims: { voluntaryPension: number | null; lifeInsurance: number | null; medical: number | null; education: number | null; charity: number | null };
	practice: PracticeChoice;
	includeCasual: boolean;
	nextKey: number;
}

export function newPeriod(key: string, fromMonth = 1, toMonth = 12): PeriodForm {
	return { key, fromMonth, toMonth, monthly: null, insurance: 'GROSS', insuranceSalary: null };
}

export function newExtra(key: string, month = 12): ExtraForm {
	return { key, month, amount: null, afterLeaving: false };
}

export function newSource(key: string, name: string): SourceForm {
	return { key, name, contract: 'LONG', periods: [newPeriod(`${key}p1`)], extras: [], region: 'I', withheld: null };
}

export function newDependent(key: string, n: number): DependentForm {
	return { key, name: `Người phụ thuộc ${n}`, fromMonth: 1, toMonth: 12, registeredInTime: true };
}

export function defaultForm(taxYear: number): FormState {
	return {
		version: 2,
		taxYear,
		resident: true,
		special: {
			foreignerLeaving: false,
			foreignerContractEnd: '',
			firstResidentYear: false,
			foreignIncome: false,
			hardship: false,
			insuranceOnly: false
		},
		sources: [newSource('s1', 'Nơi làm chính')],
		personalSourceKey: 's1',
		currentSourceKey: 's1',
		dependents: [],
		claims: { voluntaryPension: null, lifeInsurance: null, medical: null, education: null, charity: null },
		practice: 'DEFAULT',
		includeCasual: true,
		nextKey: 2
	};
}

// ---------------------------------------------------------------------------
// Bản 1 (đã có người lưu trong localStorage): đọc được mãi mãi, chuyển sang bản 2.
// ---------------------------------------------------------------------------

export interface SourceFormV1 {
	key: string;
	name: string;
	contract: 'LONG' | 'SHORT';
	monthly: number | null;
	fromMonth: number;
	toMonth: number;
	insurance: InsuranceMode;
	insuranceSalary: number | null;
	region: WageRegion;
	bonus: number | null;
	bonusMonth: number;
	withheld: number | null;
}

export type FormStateV1 = Omit<FormState, 'version' | 'sources'> & { version: 1; sources: SourceFormV1[] };

export function migrateForm(f: FormStateV1 | FormState): FormState {
	if (f.version === 2) return f;
	return {
		...f,
		version: 2,
		sources: f.sources.map((s) => ({
			key: s.key,
			name: s.name,
			contract: s.contract,
			region: s.region,
			withheld: s.withheld,
			periods: [
				{
					key: `${s.key}p1`,
					fromMonth: s.fromMonth,
					toMonth: s.toMonth,
					monthly: s.monthly,
					insurance: s.insurance,
					insuranceSalary: s.insuranceSalary
				}
			],
			extras: s.bonus !== null && s.bonus > 0 ? [{ key: `${s.key}e1`, month: s.bonusMonth, amount: s.bonus, afterLeaving: false }] : []
		}))
	};
}

// ---------------------------------------------------------------------------
// Form → TaxYearCase
// ---------------------------------------------------------------------------

const mm = (m: number) => String(m).padStart(2, '0');
const span = (p: { fromMonth: number; toMonth: number }) => [Math.min(p.fromMonth, p.toMonth), Math.max(p.fromMonth, p.toMonth)];

function payments(year: number, s: SourceForm): Payment[] {
	const out: Payment[] = [];
	for (const p of s.periods) {
		if (p.monthly === null || p.monthly <= 0) continue;
		const [lo, hi] = span(p);
		const salary = p.insurance === 'GROSS' ? p.monthly : p.insurance === 'OTHER' ? (p.insuranceSalary ?? 0) : 0;
		for (let m = lo; m <= hi; m++) {
			out.push({
				date: `${year}-${mm(m)}-25` as IsoDate,
				gross: p.monthly,
				insurance: salary > 0 ? { kind: 'SALARY', salary, region: s.region } : undefined
			});
		}
	}
	for (const e of s.extras) {
		if (e.amount === null || e.amount <= 0) continue;
		out.push({
			date: `${year}-${mm(e.month)}-26` as IsoDate,
			gross: e.amount,
			paidAfterTermination: s.contract === 'LONG' && e.afterLeaving ? true : undefined
		});
	}
	return out.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

/** Nguồn có ít nhất một khoản chi trả. Nguồn trống không đi vào core. */
export function activeSources(f: FormState): SourceForm[] {
	return f.sources.filter(
		(s) => s.periods.some((p) => (p.monthly ?? 0) > 0) || s.extras.some((e) => (e.amount ?? 0) > 0)
	);
}

/** Lỗi mà người dùng tự sửa được trên form, viết cho người dùng đọc. */
export function formProblems(f: FormState): string[] {
	const out: string[] = [];
	for (const s of activeSources(f)) {
		const name = s.name.trim() || 'Nơi trả lương';
		const filled = s.periods.filter((p) => (p.monthly ?? 0) > 0).map(span).sort((a, b) => a[0] - b[0]);
		for (let i = 1; i < filled.length; i++) {
			if (filled[i][0] <= filled[i - 1][1]) {
				out.push(
					`${name}: khoảng tháng ${filled[i - 1][0]}–${filled[i - 1][1]} và ${filled[i][0]}–${filled[i][1]} trùng nhau. Mỗi tháng chỉ thuộc một khoảng lương.`
				);
			}
		}
		const lastSalary = filled.length ? filled[filled.length - 1][1] : 0;
		for (const e of s.extras) {
			if (s.contract === 'LONG' && e.afterLeaving && (e.amount ?? 0) > 0 && e.month < lastSalary) {
				out.push(
					`${name}: khoản trả sau khi nghỉ việc ở tháng ${e.month}, nhưng bạn vẫn nhận lương ở đây đến tháng ${lastSalary}.`
				);
			}
		}
	}
	return out;
}

export function toCase(f: FormState): TaxYearCase {
	const y = f.taxYear;
	const active = activeSources(f);
	const incomeSources: IncomeSource[] = active.map((s) => ({
		id: s.key,
		name: s.name.trim() || 'Nơi trả lương',
		contractMonths: s.contract === 'LONG' ? 12 : null,
		// Chỉ một nơi trả lương thì trang không hỏi: nơi đó trừ giảm trừ bản thân nếu hợp đồng từ 3 tháng.
		claimsPersonalDeduction: active.length === 1 ? s.contract === 'LONG' : f.personalSourceKey === s.key,
		payments: payments(y, s),
		withheld: s.withheld === null ? undefined : { amount: s.withheld, provenance: 'USER' }
	}));
	const dependents: Dependent[] = f.dependents.map((d) => ({
		id: d.key,
		name: d.name.trim() || 'Người phụ thuộc',
		fromMonth: Math.min(d.fromMonth, d.toMonth),
		toMonth: Math.max(d.fromMonth, d.toMonth),
		// Đúng hạn: coi như đăng ký từ đầu năm. Trễ hạn: một ngày sau hạn 31/12.
		registeredOn: (d.registeredInTime ? `${y}-01-01` : `${y + 1}-01-01`) as IsoDate
	}));
	const c = f.claims;
	const claims: Claims = {
		voluntaryPension: c.voluntaryPension ?? undefined,
		lifeInsurance: c.lifeInsurance ?? undefined,
		medical: c.medical ?? undefined,
		education: c.education ?? undefined,
		charity: c.charity ?? undefined
	};
	return { taxPeriod: y, residency: f.resident ? 'RESIDENT' : 'NON_RESIDENT', incomeSources, dependents, claims };
}

export function toAnswers(f: FormState): TriageAnswers {
	const sp = f.special;
	const end = sp.foreignerLeaving && /^\d{4}-\d{2}-\d{2}$/.test(sp.foreignerContractEnd) ? (sp.foreignerContractEnd as IsoDate) : undefined;
	const current = activeSources(f).find((s) => s.key === f.currentSourceKey);
	return {
		foreignerContractEnd: end,
		firstResidentYearBy12Months: sp.firstResidentYear,
		untaxedForeignIncome: sp.foreignIncome,
		wantsHardshipRelief: sp.hardship,
		employedAtSettlement: current !== undefined && current.contract === 'LONG',
		onlyInsurancePayouts: sp.insuranceOnly
	};
}

/** Nơi có thể ủy quyền quyết toán: nơi đang làm, hợp đồng từ 3 tháng. */
export function authorizedSourceKey(f: FormState): string | null {
	const s = activeSources(f).find((x) => x.key === f.currentSourceKey);
	return s && s.contract === 'LONG' ? s.key : null;
}
