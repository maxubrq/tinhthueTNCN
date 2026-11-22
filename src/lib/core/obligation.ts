/**
 * Câu hỏi (1): có phải tự quyết toán không? Bảng quyết định của docs/research, mục
 * "Câu hỏi (1)", duyệt theo thứ tự, lấy quy tắc khớp ĐẦU TIÊN (I12: tất định, đầy đủ).
 *
 * Ngưỡng và hạn nộp tra từ Rulebook. Module này không tự tính Δ: bước 7 cần Δ thì nhận Δ
 * từ `settlement` (kịch bản tự quyết toán, có gộp vãng lai); thiếu Δ thì trả NEEDS_DELTA.
 *
 * Lệch so với thứ tự của nghiên cứu: bước 8 ("chỉ có khoản bảo hiểm đã khấu trừ 10%")
 * được xét TRƯỚC bước 7, vì người không có lương nào sẽ không khớp mô tả của bước 7
 * nhưng sẽ rơi vào "còn lại" nếu xét theo thứ tự đen.
 */
import type { IsoDate, Rulebook } from '../rules/schema';
import type { Residency, TaxYearCase } from './case';
import { regimeOf, sourceMonths } from './income';
import type { Money } from './money';
import { resolveByPeriod } from './resolve';
import type { SettlementDelta } from './settlement';
import { flagsOf, type Flag, type ParamUse } from './trace';

/** Câu trả lời phân luồng mà hồ sơ không suy ra được. */
export interface TriageAnswers {
	/** Người nước ngoài kết thúc làm việc tại Việt Nam trong kỳ: ngày hợp đồng kết thúc. */
	readonly foreignerContractEnd?: IsoDate;
	/** Năm cư trú đầu tiên tính theo 12 tháng liên tục (không theo năm dương lịch). */
	readonly firstResidentYearBy12Months: boolean;
	/** Có thu nhập từ nước ngoài hoặc tổ chức quốc tế chưa khấu trừ, và có phát sinh thuế. */
	readonly untaxedForeignIncome: boolean;
	/** Muốn giảm thuế do thiên tai, bệnh hiểm nghèo (Điều 40). */
	readonly wantsHardshipRelief: boolean;
	/** Lúc quyết toán vẫn đang làm ở nơi trả lương duy nhất. */
	readonly employedAtSettlement: boolean;
	/** Thu nhập duy nhất là khoản chi trả bảo hiểm đã bị khấu trừ 10%. */
	readonly onlyInsurancePayouts: boolean;
}

/** Dữ kiện mà bảng quyết định đọc. */
export interface ObligationFacts extends TriageAnswers {
	readonly residency: Residency;
	/** Số nơi trả lương có hợp đồng từ 3 tháng, có chi trả trong kỳ. */
	readonly progressiveEmployers: number;
	/** Thu nhập vãng lai đã khấu trừ thuế suất cố định, bình quân tháng. */
	readonly casualMonthlyAverage: Money;
	/** Đã khai y tế, giáo dục hoặc từ thiện (chỉ trừ được khi tự quyết toán). */
	readonly hasSelfOnlyClaims: boolean;
}

export function factsFromCase(rb: Rulebook, c: TaxYearCase, answers: TriageAnswers): ObligationFacts {
	const months = sourceMonths(rb, c);
	let progressiveEmployers = 0;
	let casual = 0;
	c.incomeSources.forEach((s, i) => {
		const own = months.filter((m) => m.sourceIndex === i);
		if (own.length === 0) return;
		if (regimeOf(rb, s).regime === 'PROGRESSIVE') progressiveEmployers++;
		else casual += own.reduce((a, m) => a + m.taxableIncome, 0);
	});
	const cl = c.claims;
	return {
		...answers,
		residency: c.residency,
		progressiveEmployers,
		casualMonthlyAverage: Math.floor(casual / 12),
		hasSelfOnlyClaims: Boolean(cl.medical || cl.education || cl.charity)
	};
}

export type Verdict =
	/** Không cư trú: đã chịu thuế suất cố định, không chạy luồng lũy tiến. */
	| 'NOT_IN_PROGRESSIVE_FLOW'
	| 'MUST_SELF_SETTLE'
	/** Được ủy quyền cho doanh nghiệp (vẫn có thể tự quyết toán nếu có lợi hơn). */
	| 'MAY_AUTHORIZE'
	/** Phải nộp thêm nhưng không quá ngưỡng: được miễn nộp. */
	| 'EXEMPT_SMALL_DELTA'
	/** Nộp thừa: tự quyết toán nếu muốn được hoàn. */
	| 'MAY_SELF_SETTLE_FOR_REFUND'
	| 'NOT_REQUIRED'
	/** Bước 7 cần Δ để kết luận. */
	| 'NEEDS_DELTA';

export interface ObligationResult {
	readonly rulebookId: string;
	/** Bước trong bảng của nghiên cứu (0–8). */
	readonly step: number;
	readonly verdict: Verdict;
	readonly canAuthorize: boolean;
	readonly summary: string;
	readonly notes: readonly string[];
	readonly deadline: { readonly date: IsoDate | null; readonly rule: string } | null;
	readonly filingOffice: string | null;
	/** Số tiền liên quan tới kết luận, số nguyên đồng; UI tự định dạng. */
	readonly amounts: Readonly<Record<string, Money>>;
	/** `false` khi app chưa tính được Δ cho trường hợp này (ví dụ năm cư trú đầu tiên). */
	readonly supported: boolean;
	readonly params: readonly ParamUse[];
	readonly flags: readonly Flag[];
}

function addDays(date: IsoDate, days: number): IsoDate {
	const [y, m, d] = date.split('-').map(Number);
	return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10) as IsoDate;
}

type Draft = Omit<ObligationResult, 'rulebookId' | 'flags' | 'params' | 'supported' | 'notes' | 'filingOffice' | 'amounts'> & {
	readonly params?: readonly ParamUse[];
	readonly supported?: boolean;
	readonly notes?: readonly string[];
	readonly filingOffice?: string | null;
	readonly amounts?: Readonly<Record<string, Money>>;
};

export function decideObligation(rb: Rulebook, f: ObligationFacts, delta?: SettlementDelta): ObligationResult {
	const individual = resolveByPeriod('settlement.individualDeadline', rb.settlement.individualDeadline);
	const casualCap = resolveByPeriod('settlement.casualIncomeMonthlyAverageCap', rb.settlement.casualIncomeMonthlyAverageCap);
	const minContract = resolveByPeriod('withholding.progressiveMinContractMonths', rb.withholding.progressiveMinContractMonths);
	const selfDeadline = { date: individual.value.date, rule: individual.value.rule };
	const office =
		f.progressiveEmployers >= 2
			? 'Cơ quan thuế quản lý tổ chức trả thu nhập lớn nhất trong năm.'
			: 'Cơ quan thuế nơi bạn đã trực tiếp khai thuế, hoặc quản lý nơi trả lương.';

	const done = (r: Draft): ObligationResult => {
		const params = [...(r.params ?? [])];
		return {
			rulebookId: rb.id,
			notes: [],
			filingOffice: null,
			amounts: {},
			supported: true,
			...r,
			params,
			flags: flagsOf(params)
		};
	};

	// Bước 0
	if (f.residency === 'NON_RESIDENT') {
		const rate = resolveByPeriod('nonResident.employmentRate', rb.nonResident.employmentRate);
		return done({
			step: 0,
			verdict: 'NOT_IN_PROGRESSIVE_FLOW',
			canAuthorize: false,
			summary: `Người không cư trú chịu ${rate.value / 100}% trên tổng tiền lương, không có giảm trừ, không quyết toán theo biểu lũy tiến.`,
			deadline: null,
			params: [rate.use],
			supported: false,
			notes: ['App chưa hỗ trợ đầy đủ người không cư trú.']
		});
	}

	// Bước 1
	if (f.foreignerContractEnd) {
		const days = resolveByPeriod('settlement.foreignerExitDeadlineDays', rb.settlement.foreignerExitDeadlineDays);
		return done({
			step: 1,
			verdict: 'MUST_SELF_SETTLE',
			canAuthorize: false,
			summary: `Người nước ngoài kết thúc làm việc tại Việt Nam phải tự quyết toán, chậm nhất ${days.value} ngày sau khi hợp đồng kết thúc.`,
			deadline: { date: addDays(f.foreignerContractEnd, days.value), rule: `${days.value} ngày sau ngày kết thúc hợp đồng.` },
			filingOffice: office,
			params: [days.use]
		});
	}

	// Bước 2
	if (f.firstResidentYearBy12Months) {
		return done({
			step: 2,
			verdict: 'MUST_SELF_SETTLE',
			canAuthorize: false,
			summary: 'Năm cư trú đầu tiên tính theo 12 tháng liên tục: bắt buộc tự quyết toán.',
			deadline: { date: null, rule: 'Ngày cuối tháng thứ 4 kể từ khi tròn 12 tháng cư trú.' },
			filingOffice: office,
			supported: false,
			notes: ['App chưa tính Δ cho kỳ tính thuế 12 tháng liên tục khác năm dương lịch.']
		});
	}

	// Bước 3
	if (f.untaxedForeignIncome) {
		return done({
			step: 3,
			verdict: 'MUST_SELF_SETTLE',
			canAuthorize: false,
			summary: 'Có thu nhập từ nước ngoài hoặc tổ chức quốc tế chưa khấu trừ và có phát sinh thuế: bắt buộc tự quyết toán.',
			deadline: selfDeadline,
			filingOffice: office,
			params: [individual.use],
			supported: false,
			notes: ['App chưa tính phần thu nhập và thuế đã nộp ở nước ngoài.']
		});
	}

	// Bước 4
	if (f.wantsHardshipRelief || f.hasSelfOnlyClaims) {
		return done({
			step: 4,
			verdict: 'MUST_SELF_SETTLE',
			canAuthorize: false,
			summary:
				'Muốn trừ y tế, giáo dục, từ thiện hoặc được giảm thuế do thiên tai, bệnh hiểm nghèo thì phải tự quyết toán; không ủy quyền được.',
			deadline: selfDeadline,
			filingOffice: office,
			params: [individual.use],
			notes: ['Đây là lựa chọn của bạn: so sánh số hoàn khi ủy quyền và khi tự quyết toán trước khi quyết định.']
		});
	}

	const sole = f.progressiveEmployers === 1 && f.employedAtSettlement;

	// Bước 5
	if (sole && f.casualMonthlyAverage === 0) {
		return done({
			step: 5,
			verdict: 'MAY_AUTHORIZE',
			canAuthorize: true,
			summary: `Một nơi trả lương, hợp đồng từ ${minContract.value} tháng, đang làm ở đó: ủy quyền cho doanh nghiệp quyết toán thay.`,
			deadline: null,
			params: [minContract.use],
			notes: ['Nếu tự quyết toán có lợi hơn (ví dụ trừ được y tế, giáo dục), bạn vẫn được tự quyết toán.']
		});
	}

	// Bước 6
	if (sole && f.casualMonthlyAverage <= casualCap.value) {
		return done({
			step: 6,
			verdict: 'MAY_AUTHORIZE',
			canAuthorize: true,
			summary: 'Một nơi trả lương, cộng vãng lai đã khấu trừ 10% bình quân tháng không quá ngưỡng: vẫn ủy quyền được.',
			amounts: { casualMonthlyAverage: f.casualMonthlyAverage, casualCap: casualCap.value },
			deadline: null,
			params: [minContract.use, casualCap.use],
			notes: ['Muốn gộp phần vãng lai vào quyết toán thì phải tự quyết toán.']
		});
	}

	// Bước 8 (xét trước bước 7, xem đầu file)
	if (f.onlyInsurancePayouts && f.progressiveEmployers === 0) {
		const ins = resolveByPeriod('settlement.insurancePayoutOnlyExempt', rb.settlement.insurancePayoutOnlyExempt);
		if (ins.value) {
			return done({
				step: 8,
				verdict: 'NOT_REQUIRED',
				canAuthorize: false,
				summary: 'Chỉ có khoản chi trả bảo hiểm đã bị khấu trừ 10%: không phải quyết toán.',
				deadline: null,
				params: [ins.use]
			});
		}
	}

	if (f.progressiveEmployers === 0 && f.casualMonthlyAverage === 0) {
		return done({
			step: 7,
			verdict: 'NOT_REQUIRED',
			canAuthorize: false,
			summary: 'Không có thu nhập từ tiền lương, tiền công trong kỳ: không có gì để quyết toán.',
			deadline: null
		});
	}

	// Bước 7
	if (!delta) {
		return done({
			step: 7,
			verdict: 'NEEDS_DELTA',
			canAuthorize: false,
			summary: 'Lương từ hai nơi trở lên, đã nghỉ việc, hoặc vãng lai vượt ngưỡng: cần tính số chênh lệch để biết có phải quyết toán.',
			deadline: null,
			params: [casualCap.use]
		});
	}
	const threshold = resolveByPeriod('settlement.smallDeltaThreshold', rb.settlement.smallDeltaThreshold);
	const smallNotes = threshold.use.openIssues.includes('oi-3')
		? ['Năm nay có thể vẫn phải nộp hồ sơ dù được miễn nộp tiền (điểm mở 3).']
		: [];
	if (delta.direction === 'PAY' && delta.amount > threshold.value) {
		return done({
			step: 7,
			verdict: 'MUST_SELF_SETTLE',
			canAuthorize: false,
			summary: 'Phải nộp thêm vượt ngưỡng miễn: bắt buộc tự quyết toán.',
			amounts: { delta: delta.amount, smallThreshold: threshold.value },
			deadline: selfDeadline,
			filingOffice: office,
			params: [threshold.use, individual.use],
			notes: ['Nộp chậm có tiền chậm nộp 0,03%/ngày trên số thuế chậm, và có thể bị phạt chậm nộp hồ sơ.']
		});
	}
	if (delta.direction === 'PAY') {
		return done({
			step: 7,
			verdict: 'EXEMPT_SMALL_DELTA',
			canAuthorize: false,
			summary: 'Phải nộp thêm nhưng không quá ngưỡng miễn: được miễn nộp.',
			amounts: { delta: delta.amount, smallThreshold: threshold.value },
			deadline: null,
			params: [threshold.use],
			notes: smallNotes
		});
	}
	if (delta.direction === 'REFUND') {
		const small = -delta.amount <= threshold.value;
		return done({
			step: 7,
			verdict: 'MAY_SELF_SETTLE_FOR_REFUND',
			canAuthorize: false,
			summary: small
				? 'Nộp thừa không quá ngưỡng: được bù trừ vào kỳ sau, không hoàn.'
				: 'Nộp thừa: tự quyết toán nếu muốn được hoàn.',
			amounts: { delta: delta.amount, smallThreshold: threshold.value },
			deadline: selfDeadline,
			filingOffice: office,
			params: [threshold.use, individual.use],
			notes: ['Nộp chậm hồ sơ đề nghị hoàn thì không bị phạt.']
		});
	}
	return done({
		step: 7,
		verdict: 'NOT_REQUIRED',
		canAuthorize: false,
		summary: 'Số đã khấu trừ bằng đúng số thuế cả năm: không phải quyết toán.',
		deadline: null
	});
}
