/**
 * Validator dữ liệu Rulebook: những gì kiểu TS không kiểm được (I3, I5, I6).
 *  - Mọi tham số theo ngày phủ kín 01/01–31/12 của kỳ, liền nhau, không chồng lấn.
 *  - Mọi số tiền là số nguyên đồng không âm; mọi tỷ lệ là số nguyên phần vạn 0–10.000.
 *  - Bậc tăng dần, thuế suất không giảm.
 *  - Giả định thực hành nằm trong kỳ và không chồng nhau.
 */
import type { DateParam, IsoDate, ProgressiveSchedule, Rulebook } from '../rules/schema';
import { InvalidRulebookError } from './errors';
import { materializeAnnual } from './schedule';

const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isValidIsoDate(s: string): s is IsoDate {
	const m = ISO.exec(s);
	if (!m) return false;
	const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
	return d.getUTCFullYear() === +m[1] && d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3];
}

export function nextDay(date: IsoDate): IsoDate {
	const m = ISO.exec(date)!;
	const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3] + 1));
	return d.toISOString().slice(0, 10) as IsoDate;
}

function money(p: string[], where: string, x: unknown) {
	if (typeof x !== 'number' || !Number.isSafeInteger(x) || x < 0) p.push(`${where}: tiền phải là số nguyên đồng không âm (${String(x)}).`);
}

function bps(p: string[], where: string, x: unknown) {
	if (typeof x !== 'number' || !Number.isSafeInteger(x) || x < 0 || x > 10_000) p.push(`${where}: tỷ lệ phải là số nguyên phần vạn 0–10.000 (${String(x)}).`);
}

function schedule(p: string[], where: string, s: ProgressiveSchedule) {
	let prevUpper = 0;
	let prevRate = -1;
	s.brackets.forEach((b, i) => {
		const w = `${where}.brackets[${i}]`;
		bps(p, w, b.rate);
		if (b.rate < prevRate) p.push(`${w}: thuế suất giảm so với bậc trước.`);
		prevRate = b.rate;
		if (b.upTo !== null) {
			money(p, w, b.upTo);
			if (b.upTo <= prevUpper) p.push(`${w}: cận trên phải tăng dần.`);
			prevUpper = b.upTo;
		} else if (i !== s.brackets.length - 1) {
			p.push(`${w}: chỉ bậc cuối được không có cận trên.`);
		}
	});
}

function coverage<V>(
	p: string[],
	where: string,
	param: DateParam<V, string, string>,
	year: number,
	check: (w: string, v: V) => void
) {
	let expected = `${year}-01-01` as IsoDate;
	param.segments.forEach((s, i) => {
		const w = `${where}.segments[${i}]`;
		if (!isValidIsoDate(s.from) || !isValidIsoDate(s.to)) {
			p.push(`${w}: ngày không hợp lệ.`);
			return;
		}
		if (s.from !== expected) p.push(`${w}: bắt đầu ${s.from}, phải là ${expected} (khoảng trống hoặc chồng lấn).`);
		if (s.to < s.from) p.push(`${w}: kết thúc trước khi bắt đầu.`);
		check(w, s.value);
		expected = nextDay(s.to);
	});
	if (expected !== `${year + 1}-01-01`) p.push(`${where}: không phủ tới ${year}-12-31.`);
}

export function rulebookProblems(rb: Rulebook): string[] {
	const p: string[] = [];
	const y = rb.taxYear;
	const m = (w: string) => (v: unknown) => money(p, w, v);

	if (!Number.isSafeInteger(y)) p.push('taxYear phải là số nguyên.');
	if (!/^[a-z]{2}-\d{4}/.test(rb.id)) p.push(`id "${rb.id}" không đúng dạng "xx-YYYY…".`);
	if (rb.changelog.length > 0 && rb.changelog[rb.changelog.length - 1].revision !== rb.revision) {
		p.push('revision phải bằng revision cuối của changelog.');
	}

	schedule(p, 'schedules.monthly', rb.schedules.monthly.value);
	const annual = rb.schedules.annual.value;
	if (annual.kind === 'EXPLICIT') schedule(p, 'schedules.annual', annual.schedule);
	else schedule(p, 'schedules.annual(×12)', materializeAnnual(annual, rb.schedules.monthly.value));

	for (const k of ['monthlyTax', 'annualTax'] as const) {
		const r = rb.rounding.value[k];
		if (!Number.isSafeInteger(r.toMultipleOf) || r.toMultipleOf <= 0) p.push(`rounding.${k}: bội số không hợp lệ.`);
	}

	const e = rb.employmentIncome;
	coverage(p, 'employmentIncome.mealAllowance', e.mealAllowance, y, (w, v) => {
		if (v.kind === 'MONTHLY_CAP') money(p, w, v.monthlyCap);
	});
	bps(p, 'employmentIncome.housingInclusionCap', e.housingInclusionCap.value);

	const ins = rb.insurance;
	coverage(p, 'insurance.employeeRates', ins.employeeRates, y, (w, v) => {
		bps(p, `${w}.social`, v.social);
		bps(p, `${w}.health`, v.health);
		bps(p, `${w}.unemployment`, v.unemployment);
	});
	coverage(p, 'insurance.socialHealthMonthlyCap', ins.socialHealthMonthlyCap, y, (w, v) => money(p, w, v));
	coverage(p, 'insurance.unemploymentMonthlyCap', ins.unemploymentMonthlyCap, y, (w, v) => {
		for (const r of ['I', 'II', 'III', 'IV'] as const) money(p, `${w}.${r}`, v[r]);
	});

	const d = rb.deductions;
	m('deductions.taxpayerMonthly')(d.taxpayerMonthly.value);
	m('deductions.dependentMonthly')(d.dependentMonthly.value);
	m('deductions.dependentIncomeMonthlyLimit')(d.dependentIncomeMonthlyLimit.value);
	if (!isValidIsoDate(d.dependentRegistrationDeadline.value)) p.push('deductions.dependentRegistrationDeadline: ngày không hợp lệ.');
	m('deductions.voluntaryPension.monthlyCap')(d.voluntaryPension.value.monthlyCap);
	for (const k of ['medical', 'education', 'charity'] as const) {
		const v = d[k].value;
		if (v && v.annualCap !== null) m(`deductions.${k}.annualCap`)(v.annualCap);
	}

	const wh = rb.withholding;
	if (!Number.isSafeInteger(wh.progressiveMinContractMonths.value) || wh.progressiveMinContractMonths.value < 1) {
		p.push('withholding.progressiveMinContractMonths phải là số nguyên dương.');
	}
	coverage(p, 'withholding.flatRate', wh.flatRate, y, (w, v) => bps(p, w, v));
	coverage(p, 'withholding.flatRateMinPayment', wh.flatRateMinPayment, y, (w, v) => money(p, w, v));

	bps(p, 'nonResident.employmentRate', rb.nonResident.employmentRate.value);

	const s = rb.settlement;
	m('settlement.smallDeltaThreshold')(s.smallDeltaThreshold.value);
	m('settlement.casualIncomeMonthlyAverageCap')(s.casualIncomeMonthlyAverageCap.value);
	for (const k of ['individualDeadline', 'organizationDeadline'] as const) {
		const dl = s[k];
		if (dl.value.date !== null && !isValidIsoDate(dl.value.date)) p.push(`settlement.${k}: ngày không hợp lệ.`);
		if (dl.value.date === null && dl.status === 'VERIFIED') p.push(`settlement.${k}: chưa có ngày thì không thể VERIFIED.`);
	}

	const practices = [...rb.withholdingPractices].sort((a, b) => (a.from < b.from ? -1 : 1));
	practices.forEach((pr, i) => {
		const w = `withholdingPractices[${pr.id}]`;
		if (!pr.from.startsWith(`${y}-`) || !pr.to.startsWith(`${y}-`) || pr.to < pr.from) p.push(`${w}: phải nằm trong kỳ ${y}.`);
		if (i > 0 && pr.from <= practices[i - 1].to) p.push(`${w}: chồng lấn với ${practices[i - 1].id}.`);
		schedule(p, `${w}.monthlySchedule`, pr.monthlySchedule);
		m(`${w}.taxpayerMonthly`)(pr.taxpayerMonthly);
		m(`${w}.dependentMonthly`)(pr.dependentMonthly);
	});

	const refs = new Set(Object.keys(rb.sources));
	const issues = new Set(Object.keys(rb.openIssues));
	walkProvenance(rb, (where, prov) => {
		for (const r of prov.sourceRefs) if (!refs.has(r.source)) p.push(`${where}: nguồn "${r.source}" chưa khai.`);
		for (const o of prov.openIssues ?? []) if (!issues.has(o)) p.push(`${where}: điểm mở "${o}" chưa khai.`);
	});

	return p;
}

interface ProvLike {
	sourceRefs: readonly { source: string }[];
	openIssues?: readonly string[];
	status: string;
}

/** Duyệt mọi chỗ có provenance trong Rulebook (phòng trường hợp dữ liệu không đi qua defineRulebook). */
function walkProvenance(node: unknown, visit: (where: string, p: ProvLike) => void, where = '') {
	if (node === null || typeof node !== 'object') return;
	const o = node as Record<string, unknown>;
	if (Array.isArray(o.sourceRefs) && typeof o.status === 'string') visit(where, o as unknown as ProvLike);
	for (const [k, v] of Object.entries(o)) {
		if (k === 'sources' || k === 'openIssues' || k === 'sourceRefs') continue;
		walkProvenance(v, visit, where ? `${where}.${k}` : k);
	}
}

export function assertValidRulebook(rb: Rulebook): void {
	const problems = rulebookProblems(rb);
	if (problems.length > 0) throw new InvalidRulebookError(rb.id, problems);
}
