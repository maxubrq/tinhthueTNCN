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
	/** Số nơi trả lương có hợp đồng từ 3 tháng, có lương thường trong kỳ. */
	readonly progressiveEmployers: number;
	/** Số nơi chỉ trả khoản sau khi bạn đã nghỉ việc, không có lương thường trong kỳ (điểm mở 18). */
	readonly postTerminationOnlyEmployers: number;
	/** Bình quân tháng của các khoản đó. */
	readonly postTerminationOnlyMonthlyAverage: Money;
	/** Thu nhập vãng lai đã khấu trừ thuế suất cố định, bình quân tháng. */
	readonly casualMonthlyAverage: Money;
	/** Đã khai y tế, giáo dục hoặc từ thiện (chỉ trừ được khi tự quyết toán). */
	readonly hasSelfOnlyClaims: boolean;
}

export function factsFromCase(rb: Rulebook, c: TaxYearCase, answers: TriageAnswers): ObligationFacts {
	const months = sourceMonths(rb, c);
	let progressiveEmployers = 0;
	let postOnly = 0;
	let postOnlyIncome = 0;
	let casual = 0;
	c.incomeSources.forEach((s, i) => {
		const own = months.filter((m) => m.sourceIndex === i);
		if (own.length === 0) return;
		const income = own.reduce((a, m) => a + m.taxableIncome, 0);
		if (regimeOf(rb, s).regime !== 'PROGRESSIVE') casual += income;
		else if (own.every((m) => m.afterTermination)) {
			postOnly++;
			postOnlyIncome += income;
		} else progressiveEmployers++;
	});
	const cl = c.claims;
	return {
		...answers,
		residency: c.residency,
		progressiveEmployers,
		postTerminationOnlyEmployers: postOnly,
		postTerminationOnlyMonthlyAverage: Math.floor(postOnlyIncome / 12),
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
	// Điểm mở 18: nơi chỉ trả khoản sau khi nghỉ việc tính là nơi trả lương hay là vãng lai.
	const extraUses: ParamUse[] = [];
	let employers = f.progressiveEmployers;
	let casualAvg = f.casualMonthlyAverage;
	if (f.postTerminationOnlyEmployers > 0) {
		const post = resolveByPeriod(
			'settlement.postTerminationPaymentCountsAsEmployer',
			rb.settlement.postTerminationPaymentCountsAsEmployer
		);
		extraUses.push(post.use);
		if (post.value) employers += f.postTerminationOnlyEmployers;
		else casualAvg += f.postTerminationOnlyMonthlyAverage;
	}
	const office =
		employers >= 2
			? 'Cơ quan thuế quản lý nơi trả thu nhập lớn nhất cho bạn trong năm.'
			: 'Cơ quan thuế nơi bạn đã trực tiếp khai thuế trong năm; nếu chưa từng tự khai, là cơ quan thuế quản lý nơi trả lương cho bạn.';
	// Bước 7: gọi đúng tên lý do khiến bạn không ủy quyền được.
	const why: string[] = [];
	if (employers >= 2) why.push(`bạn nhận lương từ ${employers} nơi`);
	else if (employers === 1 && !f.employedAtSettlement) why.push('bạn không còn làm ở nơi trả lương lúc quyết toán');
	if (casualAvg > casualCap.value) why.push('thu nhập vãng lai bình quân mỗi tháng vượt ngưỡng');
	const because = why.length ? `Vì ${why.join(' và ')} nên không ủy quyền được. ` : '';

	const done = (r: Draft): ObligationResult => {
		const params = [...(r.params ?? []), ...extraUses];
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
			summary: `Người không cư trú nộp ${rate.value / 100}% trên toàn bộ tiền lương làm việc tại Việt Nam, không được giảm trừ và không tính theo biểu lũy tiến.`,
			deadline: null,
			params: [rate.use],
			supported: false,
			notes: ['App chưa tính đầy đủ cho người không cư trú; hãy coi con số là tham khảo.']
		});
	}

	// Bước 1
	if (f.foreignerContractEnd) {
		const days = resolveByPeriod('settlement.foreignerExitDeadlineDays', rb.settlement.foreignerExitDeadlineDays);
		return done({
			step: 1,
			verdict: 'MUST_SELF_SETTLE',
			canAuthorize: false,
			summary: `Người nước ngoài thôi làm việc tại Việt Nam phải tự quyết toán, chậm nhất ${days.value} ngày sau khi hợp đồng kết thúc.`,
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
			summary: 'Năm cư trú đầu tiên tính theo 12 tháng liên tục thì bạn phải tự quyết toán.',
			deadline: { date: null, rule: 'Ngày cuối tháng thứ 4 kể từ khi tròn 12 tháng cư trú.' },
			filingOffice: office,
			supported: false,
			notes: ['App chưa tính được số chênh lệch khi năm tính thuế không trùng năm dương lịch.']
		});
	}

	// Bước 3
	if (f.untaxedForeignIncome) {
		return done({
			step: 3,
			verdict: 'MUST_SELF_SETTLE',
			canAuthorize: false,
			summary: 'Bạn có tiền lương, tiền công từ nước ngoài hoặc từ tổ chức quốc tế chưa bị khấu trừ thuế, nên phải tự quyết toán.',
			deadline: selfDeadline,
			filingOffice: office,
			params: [individual.use],
			supported: false,
			notes: ['App chưa tính phần thu nhập này và phần thuế đã nộp ở nước ngoài.']
		});
	}

	// Bước 4
	if (f.wantsHardshipRelief || f.hasSelfOnlyClaims) {
		return done({
			step: 4,
			verdict: 'MUST_SELF_SETTLE',
			canAuthorize: false,
			summary: f.hasSelfOnlyClaims
				? 'Bạn đã khai chi phí y tế, giáo dục hoặc từ thiện. Các khoản này chỉ được trừ khi tự quyết toán; muốn trừ thì bạn không ủy quyền được.'
				: 'Muốn xin giảm thuế vì thiên tai hay bệnh hiểm nghèo, bạn phải tự quyết toán; việc này không ủy quyền được.',
			deadline: selfDeadline,
			filingOffice: office,
			params: [individual.use],
			notes: f.hasSelfOnlyClaims
				? ['Bỏ các khoản này thì bạn vẫn ủy quyền được. Hãy so hai con số bên dưới rồi chọn.']
				: []
		});
	}

	const sole = employers === 1 && f.employedAtSettlement;

	// Bước 5
	if (sole && casualAvg === 0) {
		return done({
			step: 5,
			verdict: 'MAY_AUTHORIZE',
			canAuthorize: true,
			summary: `Bạn nhận lương ở một nơi, hợp đồng từ ${minContract.value} tháng và vẫn đang làm ở đó, nên có thể nhờ nơi này quyết toán thay.`,
			deadline: null,
			params: [minContract.use],
			notes: ['Ủy quyền là quyền của bạn, không phải nghĩa vụ. Tự quyết toán có lợi hơn thì bạn vẫn tự làm được.']
		});
	}

	// Bước 6
	if (sole && casualAvg <= casualCap.value) {
		return done({
			step: 6,
			verdict: 'MAY_AUTHORIZE',
			canAuthorize: true,
			summary: 'Bạn nhận lương ở một nơi và có thêm thu nhập vãng lai đã bị khấu trừ 10%, bình quân mỗi tháng không vượt ngưỡng. Bạn vẫn ủy quyền được.',
			amounts: { casualMonthlyAverage: casualAvg, casualCap: casualCap.value },
			deadline: null,
			params: [minContract.use, casualCap.use],
			notes: ['Muốn gộp thu nhập vãng lai để tính lại thuế thì bạn phải tự quyết toán.']
		});
	}

	// Bước 8 (xét trước bước 7, xem đầu file)
	if (f.onlyInsurancePayouts && employers === 0) {
		const ins = resolveByPeriod('settlement.insurancePayoutOnlyExempt', rb.settlement.insurancePayoutOnlyExempt);
		if (ins.value) {
			return done({
				step: 8,
				verdict: 'NOT_REQUIRED',
				canAuthorize: false,
				summary: 'Thu nhập duy nhất của bạn là khoản chi trả bảo hiểm đã bị khấu trừ 10%, nên bạn không phải quyết toán.',
				deadline: null,
				params: [ins.use]
			});
		}
	}

	if (employers === 0 && casualAvg === 0) {
		return done({
			step: 7,
			verdict: 'NOT_REQUIRED',
			canAuthorize: false,
			summary: 'Bạn chưa có thu nhập từ tiền lương, tiền công trong năm, nên không có gì để quyết toán.',
			deadline: null
		});
	}

	// Bước 7
	if (!delta) {
		return done({
			step: 7,
			verdict: 'NEEDS_DELTA',
			canAuthorize: false,
			summary: `${because}Cần tính số chênh lệch để biết bạn có phải quyết toán không.`,
			deadline: null,
			params: [casualCap.use]
		});
	}
	const threshold = resolveByPeriod('settlement.smallDeltaThreshold', rb.settlement.smallDeltaThreshold);
	const smallNotes = threshold.use.openIssues.includes('oi-3')
		? ['Năm nay có thể bạn vẫn phải nộp hồ sơ quyết toán, dù được miễn nộp tiền. Cơ quan thuế chưa hướng dẫn rõ điểm này.']
		: [];
	if (delta.direction === 'PAY' && delta.amount > threshold.value) {
		return done({
			step: 7,
			verdict: 'MUST_SELF_SETTLE',
			canAuthorize: false,
			summary: `${because}Số thuế còn thiếu vượt mức được miễn, nên bạn phải tự quyết toán và nộp phần thiếu.`,
			amounts: { delta: delta.amount, smallThreshold: threshold.value },
			deadline: selfDeadline,
			filingOffice: office,
			params: [threshold.use, individual.use],
			notes: ['Nộp muộn thì mỗi ngày phải trả thêm 0,03% trên số thuế nộp muộn, và có thể bị phạt vì nộp hồ sơ muộn.']
		});
	}
	if (delta.direction === 'PAY') {
		return done({
			step: 7,
			verdict: 'EXEMPT_SMALL_DELTA',
			canAuthorize: false,
			summary: `${because}Số thuế còn thiếu không vượt mức được miễn, nên bạn không phải nộp.`,
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
				? `${because}Số nộp thừa nhỏ, không đủ mức để hoàn, nên được trừ vào số thuế kỳ sau.`
				: `${because}Bạn đã nộp thừa. Muốn lấy lại tiền thì tự quyết toán và đề nghị hoàn.`,
			amounts: { delta: delta.amount, smallThreshold: threshold.value },
			deadline: selfDeadline,
			filingOffice: office,
			params: [threshold.use, individual.use],
			notes: ['Nộp hồ sơ đề nghị hoàn sau hạn thì không bị phạt.']
		});
	}
	return done({
		step: 7,
		verdict: 'NOT_REQUIRED',
		canAuthorize: false,
		summary: 'Số đã khấu trừ bằng đúng số thuế cả năm, nên bạn không phải quyết toán.',
		deadline: null
	});
}
