/**
 * Ca vàng kỳ 2026 cho câu hỏi (1) và (3), từ docs/research/thue-tncn-2026.md.
 * KHÔNG được đổi kết quả của file này; nếu phải đổi thì đó là sửa sai (xem CLAUDE.md).
 */
import { describe, expect, it } from 'vitest';
import { compareScenarios, findLevers, savingFor, type LeverId } from '../../src/lib/core/levers';
import { decideObligation, factsFromCase, type TriageAnswers } from '../../src/lib/core/obligation';
import { assess } from '../../src/lib/core/settlement';
import { vn2026 } from '../../src/lib/rules/vn-2026';
import { monthly, source, taxCase, TR } from './helpers';

const rb = vn2026;
const NO: TriageAnswers = {
	firstResidentYearBy12Months: false,
	untaxedForeignIncome: false,
	wantsHardshipRelief: false,
	employedAtSettlement: true,
	onlyInsurancePayouts: false
};

describe('vn-2026: có phải tự quyết toán không', () => {
	it('hai nơi lương, thiếu 11,4 triệu: bước 7, bắt buộc tự quyết toán, hạn chưa công bố', () => {
		const c = taxCase(2026, [
			source({ id: 'A', claimsPersonalDeduction: true, payments: monthly(2026, 30 * TR) }),
			source({ id: 'B', payments: monthly(2026, 20 * TR) })
		]);
		const f = factsFromCase(rb, c, NO);
		expect(decideObligation(rb, f).verdict).toBe('NEEDS_DELTA');
		const self = assess(rb, c, { filing: 'SELF', includeCasual: true }, { practice: 'NONE' });
		const r = decideObligation(rb, f, self.delta);
		expect(r.step).toBe(7);
		expect(r.verdict).toBe('MUST_SELF_SETTLE');
		expect(r.amounts.delta).toBe(11_400_000);
		expect(r.deadline?.date).toBeNull();
		expect(r.flags.some((x) => x.kind === 'PARAM' && x.openIssues.includes('oi-13'))).toBe(true);
	});

	it('một nơi, đang làm: bước 5, ủy quyền được', () => {
		const c = taxCase(2026, [source({ id: 'A', claimsPersonalDeduction: true, payments: monthly(2026, 25 * TR) })]);
		const r = decideObligation(rb, factsFromCase(rb, c, NO));
		expect([r.step, r.verdict, r.canAuthorize]).toEqual([5, 'MAY_AUTHORIZE', true]);
	});

	it('một nơi cộng vãng lai bình quân 15 triệu/tháng: bước 6; 15 triệu + 1 đ/tháng: bước 7', () => {
		const A = source({ id: 'A', claimsPersonalDeduction: true, payments: monthly(2026, 25 * TR) });
		const at = (gross: number) =>
			decideObligation(rb, factsFromCase(rb, taxCase(2026, [A, source({ id: 'V', contractMonths: null, payments: [{ date: '2026-08-01', gross }] })]), NO));
		expect(at(180 * TR).step).toBe(6);
		expect(at(180 * TR + 12).step).toBe(7);
	});

	it('có chi phí y tế: bước 4, phải tự quyết toán', () => {
		const c = taxCase(2026, [source({ id: 'A', claimsPersonalDeduction: true, payments: monthly(2026, 25 * TR) })], {
			claims: { medical: 5 * TR }
		});
		const r = decideObligation(rb, factsFromCase(rb, c, NO));
		expect([r.step, r.verdict, r.canAuthorize]).toEqual([4, 'MUST_SELF_SETTLE', false]);
	});

	it('người nước ngoài kết thúc hợp đồng 20/11/2026: hạn 04/01/2027 (45 ngày)', () => {
		const c = taxCase(2026, [source({ id: 'A', claimsPersonalDeduction: true, payments: monthly(2026, 25 * TR) })]);
		const r = decideObligation(rb, factsFromCase(rb, c, { ...NO, foreignerContractEnd: '2026-11-20' }));
		expect([r.step, r.deadline?.date]).toEqual([1, '2027-01-04']);
	});

	it('Δ nộp thêm 50.000 đ: miễn; 50.001 đ: bắt buộc; nộp thừa 50.000 đ: bù trừ kỳ sau', () => {
		const c = taxCase(2026, [source({ id: 'A', payments: monthly(2026, 25 * TR) }), source({ id: 'B', payments: monthly(2026, 1 * TR) })]);
		const f = factsFromCase(rb, c, NO);
		const d = (amount: number) =>
			({ amount, direction: amount > 0 ? 'PAY' : 'REFUND', withinSmallThreshold: Math.abs(amount) <= 50_000, smallThreshold: 50_000 }) as const;
		expect(decideObligation(rb, f, d(50_000)).verdict).toBe('EXEMPT_SMALL_DELTA');
		expect(decideObligation(rb, f, d(50_000)).notes.join()).toContain('điểm mở 3');
		expect(decideObligation(rb, f, d(50_001)).verdict).toBe('MUST_SELF_SETTLE');
		expect(decideObligation(rb, f, d(-50_000)).summary).toContain('bù trừ');
	});
});

describe('vn-2026: đòn bẩy giảm thuế', () => {
	// TNTT năm 600 triệu, giữa bậc 20% (360–720): khớp cột 20% của bảng trong nghiên cứu.
	const c = taxCase(2026, [source({ id: 'A', claimsPersonalDeduction: true, payments: monthly(2026, 65_500_000) })]);
	const self = assess(rb, c, { filing: 'SELF', includeCasual: true });
	const levers = Object.fromEntries(findLevers(rb, c, self).map((l) => [l.id, l])) as Record<LeverId, ReturnType<typeof findLevers>[number]>;

	it('TNTT 600 triệu', () => expect(self.assessableIncome).toBe(600 * TR));

	it.each([
		['DEPENDENT', 74_400_000, 14_880_000],
		['VOLUNTARY_PENSION', 36_000_000, 7_200_000],
		['MEDICAL', 23_000_000, 4_600_000],
		['EDUCATION', 24_000_000, 4_800_000],
		['MEAL_ALLOWANCE', 7_200_000, 1_440_000]
	] as const)('%s: trần %d đ, tiết kiệm %d đ', (id, room, saving) => {
		expect(levers[id].room).toBe(room);
		expect(levers[id].saving).toBe(saving);
	});

	it('từ thiện không có trần: 200.000 đ cho mỗi 1 triệu, gắn cờ điểm mở 9', () => {
		expect([levers.CHARITY.room, levers.CHARITY.saving, levers.CHARITY.per]).toEqual([null, 200_000, 1_000_000]);
		expect(levers.CHARITY.flags.some((f) => f.kind === 'PARAM' && f.openIssues.includes('oi-9'))).toBe(true);
	});

	it('vượt ranh giới bậc: TNTT 174 triệu, thêm người phụ thuộc tiết kiệm 6,42 triệu, không phải 7,44', () => {
		expect(savingFor(rb, 174 * TR, 74_400_000)).toBe(6_420_000);
	});

	it('giảm trừ không tạo số hoàn vượt quá thuế: tiết kiệm ≤ thuế năm', () => {
		expect(savingFor(rb, 10 * TR, 74_400_000)).toBe(500_000);
	});

	it('đã dùng một phần trần thì chỉ còn phần trống', () => {
		const c2 = { ...c, claims: { medical: 20 * TR, voluntaryPension: 30 * TR } };
		const l = findLevers(rb, c2, assess(rb, c2, { filing: 'SELF', includeCasual: true }));
		expect(l.find((x) => x.id === 'MEDICAL')!.room).toBe(3 * TR);
		expect(l.find((x) => x.id === 'VOLUNTARY_PENSION')!.room).toBe(6 * TR);
	});
});

describe('vn-2026: so sánh ủy quyền và tự quyết toán', () => {
	it('chi y tế 30 triệu, giáo dục 10 triệu: tự quyết toán hoàn thêm 3,3 triệu', () => {
		const c = taxCase(2026, [source({ id: 'A', claimsPersonalDeduction: true, payments: monthly(2026, 40 * TR) })], {
			claims: { medical: 30 * TR, education: 10 * TR }
		});
		const r = compareScenarios(rb, c, 'A', { practice: 'NONE' });
		expect(r.selfAdvantage).toBe(3_300_000);
		expect(r.self.delta.amount).toBe(-3_300_000);
		expect(r.authorized!.delta.amount).toBe(0);
		// Mặc định giả định T1–T6 theo biểu 7 bậc: TN 24,5 tr/tháng bị khấu trừ dư 1,3 tr × 6.
		const d = compareScenarios(rb, c, 'A');
		expect(d.authorized!.delta.amount).toBe(-7_800_000);
		expect(d.self.delta.amount).toBe(-11_100_000);
		expect(d.selfAdvantage).toBe(3_300_000);
	});
});
