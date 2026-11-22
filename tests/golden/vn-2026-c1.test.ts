/**
 * Ca vàng c1, đổi việc giữa năm có ESOP (kỳ 2026). Số do core tính, đã tính tay đối chiếu
 * và được chủ dự án duyệt ngày 22/11/2026. Không lấy từ docs/research, nên mọi thay đổi
 * về sau là sửa sai và phải ghi lý do (CLAUDE.md).
 *
 * Hồ sơ:
 *  - Công ty A: hợp đồng từ 3 tháng, lương 44 tr/tháng T1–T7, đóng bảo hiểm trên lương,
 *    đăng ký giảm trừ gia cảnh ở A. Tháng 11 A trả thêm một khoản sau khi đã nghỉ (ESOP),
 *    khấu trừ 10%.
 *  - Trợ cấp thất nghiệp T8–T11: không chịu thuế, không nằm trong hồ sơ.
 *  - Công ty B: hợp đồng từ 3 tháng, lương 60 tr tháng 12, KHÔNG trừ giảm trừ gia cảnh ở B.
 *    Đây là giả định của ca này. Mặc định của form (làm lần lượt thì B có trừ) cho hoàn
 *    9.109.300 đ; xem ADR-011, phần bổ sung, và src/lib/ui/form.test.ts.
 *
 * Tính tay (không ESOP, biểu mới): bảo hiểm 4,62 × 7 + 5,407 = 37,747 tr; TNTT 368 − 37,747
 * − 186 = 144,253 tr; thuế 10% × 144,253 − 6 = 8,4253 tr; A khấu trừ 1,888 × 7 = 13,216 tr;
 * B khấu trừ 20% × 54,593 − 3,5 = 7,4186 tr; Δ = −12,2093 tr.
 */
import { describe, expect, it } from 'vitest';
import type { IncomeSource, Payment, TaxYearCase } from '../../src/lib/core/case';
import { decideObligation, factsFromCase, type TriageAnswers } from '../../src/lib/core/obligation';
import { assess } from '../../src/lib/core/settlement';
import { vn2026 } from '../../src/lib/rules/vn-2026';
import type { IsoDate } from '../../src/lib/rules/schema';

const rb = vn2026;
const TR = 1_000_000;
const ins = (salary: number) => ({ kind: 'SALARY', salary, region: 'I' }) as const;
const salary = (months: number[], gross: number): Payment[] =>
	months.map((m) => ({ date: `2026-${String(m).padStart(2, '0')}-25` as IsoDate, gross, insurance: ins(gross) }));

function c1(esop: number): TaxYearCase {
	const A: IncomeSource = {
		id: 'A',
		name: 'Công ty A',
		contractMonths: 12,
		claimsPersonalDeduction: true,
		payments: [
			...salary([1, 2, 3, 4, 5, 6, 7], 44 * TR),
			...(esop ? [{ date: '2026-11-20' as IsoDate, gross: esop, paidAfterTermination: true }] : [])
		]
	};
	const B: IncomeSource = {
		id: 'B',
		name: 'Công ty B',
		contractMonths: 12,
		claimsPersonalDeduction: false,
		payments: salary([12], 60 * TR)
	};
	return { taxPeriod: 2026, residency: 'RESIDENT', incomeSources: [A, B], dependents: [], claims: {} };
}

const SELF = { filing: 'SELF', includeCasual: true } as const;
const ANSWERS: TriageAnswers = {
	firstResidentYearBy12Months: false,
	untaxedForeignIncome: false,
	wantsHardshipRelief: false,
	employedAtSettlement: true,
	onlyInsurancePayouts: false
};

describe('c1: đổi việc giữa năm có ESOP', () => {
	it('không ESOP, A khấu trừ theo biểu mới cả năm: hoàn 12.209.300 đ', () => {
		const r = assess(rb, c1(0), SELF, { practice: 'NONE' });
		expect(r.insurance).toBe(37_747_000);
		expect(r.assessableIncome).toBe(144_253_000);
		expect(r.annualTax).toBe(8_425_300);
		expect(r.withheldBySource.map((w) => w.amount)).toEqual([13_216_000, 7_418_600]);
		expect(r.delta.amount).toBe(-12_209_300);
	});

	it('không ESOP, A khấu trừ T1–T6 theo biểu 7 bậc cũ: hoàn 19.637.300 đ', () => {
		expect(assess(rb, c1(0), SELF).delta.amount).toBe(-19_637_300);
	});

	it('ESOP 100 tr khấu trừ 10%: TNTT ở bậc 10% nên Δ không đổi', () => {
		const r = assess(rb, c1(100 * TR), SELF, { practice: 'NONE' });
		expect(r.withheldBySource.map((w) => w.amount)).toEqual([23_216_000, 7_418_600]);
		expect(r.annualTax).toBe(18_425_300);
		expect(r.delta.amount).toBe(-12_209_300);
	});

	it('ESOP 300 tr: TNTT 444,253 tr qua bậc 20%, hoàn còn 3.784.000 đ', () => {
		const r = assess(rb, c1(300 * TR), SELF, { practice: 'NONE' });
		expect(r.annualTax).toBe(46_850_600);
		expect(r.delta.amount).toBe(-3_784_000);
	});

	it('khoản sau khi nghỉ luôn được gộp: chọn "không gộp vãng lai" cũng không bỏ nó ra', () => {
		const gop = assess(rb, c1(100 * TR), SELF, { practice: 'NONE' });
		const khong = assess(rb, c1(100 * TR), { filing: 'SELF', includeCasual: false }, { practice: 'NONE' });
		expect(khong.taxableIncome).toBe(gop.taxableIncome);
		expect(khong.delta.amount).toBe(gop.delta.amount);
	});

	it('hai nơi trả lương: bước 7, không ủy quyền được, nộp ở nơi trả nhiều nhất', () => {
		const c = c1(100 * TR);
		const r = decideObligation(rb, factsFromCase(rb, c, ANSWERS), assess(rb, c, SELF, { practice: 'NONE' }).delta);
		expect([r.step, r.verdict, r.canAuthorize]).toEqual([7, 'MAY_SELF_SETTLE_FOR_REFUND', false]);
		expect(r.summary).toContain('2 nơi');
		// A vẫn có lương thường trong năm, nên điểm mở 18 không dính vào.
		expect(r.flags.some((f) => f.kind === 'PARAM' && f.openIssues.includes('oi-18'))).toBe(false);
	});
});

describe('điểm mở 18: nơi chỉ trả khoản sau khi đã nghỉ việc', () => {
	// Nghỉ ở A từ năm trước; năm nay A chỉ trả một khoản 20 tr (đã khấu trừ 10%), làm cả năm ở B.
	const c: TaxYearCase = {
		taxPeriod: 2026,
		residency: 'RESIDENT',
		dependents: [],
		claims: {},
		incomeSources: [
			{
				id: 'A',
				name: 'Công ty A',
				contractMonths: 12,
				claimsPersonalDeduction: false,
				payments: [{ date: '2026-03-10', gross: 20 * TR, paidAfterTermination: true }]
			},
			{
				id: 'B',
				name: 'Công ty B',
				contractMonths: 12,
				claimsPersonalDeduction: true,
				payments: salary([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], 30 * TR)
			}
		]
	};

	it('chính sách tạm (b): A tính là một nơi trả lương, nên không ủy quyền được; có cờ', () => {
		const f = factsFromCase(rb, c, ANSWERS);
		expect([f.progressiveEmployers, f.postTerminationOnlyEmployers]).toEqual([1, 1]);
		const r = decideObligation(rb, f, assess(rb, c, SELF).delta);
		expect(r.step).toBe(7);
		expect(r.canAuthorize).toBe(false);
		expect(r.flags.some((x) => x.kind === 'PARAM' && x.openIssues.includes('oi-18'))).toBe(true);
	});

	it('nếu dữ liệu luật đổi sang (a): coi như vãng lai và ủy quyền được, không sửa core', () => {
		const rbA = {
			...rb,
			settlement: {
				...rb.settlement,
				postTerminationPaymentCountsAsEmployer: { ...rb.settlement.postTerminationPaymentCountsAsEmployer, value: false }
			}
		};
		const r = decideObligation(rbA, factsFromCase(rbA, c, ANSWERS));
		expect([r.step, r.verdict]).toEqual([6, 'MAY_AUTHORIZE']);
	});
});
