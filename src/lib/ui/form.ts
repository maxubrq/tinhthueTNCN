/**
 * Mô hình form của trang và lớp chống hỏng (kien-truc-v0 §3.2): chuyển câu trả lời của
 * người dùng thành `TaxYearCase` chuẩn trước khi đưa vào core. Module này không suy diễn
 * luật; mọi số tiền đã là số nguyên đồng (đơn vị nghìn, triệu chỉ sống trong ô nhập).
 */
import type { Claims, Dependent, IncomeSource, Payment, TaxYearCase } from '../core/case';
import type { TriageAnswers } from '../core/obligation';
import type { PracticeChoice } from '../core/withholding';
import type { IsoDate, WageRegion } from '../rules/schema';

export type InsuranceMode = 'GROSS' | 'OTHER' | 'NONE';

export interface SourceForm {
	key: string;
	name: string;
	/** LONG: hợp đồng từ 3 tháng. SHORT: dưới 3 tháng hoặc không có hợp đồng. */
	contract: 'LONG' | 'SHORT';
	/** Thu nhập chịu thuế mỗi tháng, trước bảo hiểm. */
	monthly: number | null;
	fromMonth: number;
	toMonth: number;
	insurance: InsuranceMode;
	insuranceSalary: number | null;
	region: WageRegion;
	bonus: number | null;
	bonusMonth: number;
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
	version: 1;
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

export function newSource(key: string, name: string): SourceForm {
	return {
		key,
		name,
		contract: 'LONG',
		monthly: null,
		fromMonth: 1,
		toMonth: 12,
		insurance: 'GROSS',
		insuranceSalary: null,
		region: 'I',
		bonus: null,
		bonusMonth: 12,
		withheld: null
	};
}

export function newDependent(key: string, n: number): DependentForm {
	return { key, name: `Người phụ thuộc ${n}`, fromMonth: 1, toMonth: 12, registeredInTime: true };
}

export function defaultForm(taxYear: number): FormState {
	return {
		version: 1,
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

const mm = (m: number) => String(m).padStart(2, '0');

function payments(year: number, s: SourceForm): Payment[] {
	const out: Payment[] = [];
	if (s.monthly !== null && s.monthly > 0) {
		const lo = Math.min(s.fromMonth, s.toMonth);
		const hi = Math.max(s.fromMonth, s.toMonth);
		for (let m = lo; m <= hi; m++) {
			const salary = s.insurance === 'GROSS' ? s.monthly : s.insurance === 'OTHER' ? (s.insuranceSalary ?? 0) : 0;
			out.push({
				date: `${year}-${mm(m)}-25` as IsoDate,
				gross: s.monthly,
				insurance: salary > 0 ? { kind: 'SALARY', salary, region: s.region } : undefined
			});
		}
	}
	if (s.bonus !== null && s.bonus > 0) {
		out.push({ date: `${year}-${mm(s.bonusMonth)}-26` as IsoDate, gross: s.bonus });
	}
	return out;
}

/** Nguồn có ít nhất một khoản chi trả. Nguồn trống không đi vào core. */
export function activeSources(f: FormState): SourceForm[] {
	return f.sources.filter((s) => (s.monthly ?? 0) > 0 || (s.bonus ?? 0) > 0);
}

export function toCase(f: FormState): TaxYearCase {
	const y = f.taxYear;
	const incomeSources: IncomeSource[] = activeSources(f).map((s) => ({
		id: s.key,
		name: s.name.trim() || 'Nơi trả thu nhập',
		contractMonths: s.contract === 'LONG' ? 12 : null,
		claimsPersonalDeduction: f.personalSourceKey === s.key,
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
