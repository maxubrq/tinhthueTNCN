/**
 * Ca vàng kỳ 2026, lấy từ docs/research/thue-tncn-2026.md. Mọi số tính bằng đồng.
 * KHÔNG được đổi kết quả của file này; nếu phải đổi thì đó là sửa sai (xem CLAUDE.md).
 *
 * Các ví dụ của nghiên cứu cho "thu nhập" là số SAU bảo hiểm, nên hồ sơ ở đây không khai
 * bảo hiểm. Các ví dụ cũng giả định doanh nghiệp khấu trừ theo biểu 5 bậc cả năm, nên mô
 * phỏng chạy với `practice: 'NONE'`.
 */
import { describe, expect, it } from 'vitest';
import { assess } from '../../src/lib/core/settlement';
import { progressiveTax, quickTable, annualScheduleOf } from '../../src/lib/core/schedule';
import { vn2026 } from '../../src/lib/rules/vn-2026';
import { monthly, source, taxCase, TR } from './helpers';

const rb = vn2026;
const ROUND = { mode: 'HALF_UP', toMultipleOf: 1 } as const;
const law = rb.schedules.monthly.value;
const old = rb.withholdingPractices[0].monthlySchedule;

describe('vn-2026: hai nơi trả lương', () => {
	const A = source({ id: 'A', claimsPersonalDeduction: true, payments: monthly(2026, 30 * TR) });

	it('B khấu trừ lũy tiến không giảm trừ: thiếu 11,4 triệu', () => {
		const B = source({ id: 'B', payments: monthly(2026, 20 * TR) });
		const r = assess(rb, taxCase(2026, [A, B]), { filing: 'SELF', includeCasual: true }, { practice: 'NONE' });
		expect(r.withheldBySource.map((w) => w.amount)).toEqual([11_400_000, 18_000_000]);
		expect(r.assessableIncome).toBe(414 * TR);
		expect(r.annualTax).toBe(40_800_000);
		expect(r.delta.amount).toBe(11_400_000);
		expect(r.delta.direction).toBe('PAY');
	});

	it('B khấu trừ 10%: thiếu 5,4 triệu', () => {
		const B = source({ id: 'B', contractMonths: null, payments: monthly(2026, 20 * TR) });
		const r = assess(rb, taxCase(2026, [A, B]), { filing: 'SELF', includeCasual: true }, { practice: 'NONE' });
		expect(r.withheldBySource.map((w) => w.amount)).toEqual([11_400_000, 24_000_000]);
		expect(r.delta.amount).toBe(5_400_000);
	});

	it('số người dùng nhập cho cùng kết quả và không gắn cờ SIMULATED', () => {
		const A2 = { ...A, withheld: { amount: 11_400_000, provenance: 'USER' as const } };
		const B = source({ id: 'B', payments: monthly(2026, 20 * TR), withheld: { amount: 18_000_000, provenance: 'USER' } });
		const r = assess(rb, taxCase(2026, [A2, B]), { filing: 'SELF', includeCasual: true });
		expect(r.delta.amount).toBe(11_400_000);
		expect(r.withheldBySource.every((w) => w.provenance === 'USER')).toBe(true);
		expect(r.flags.some((f) => f.kind === 'SIMULATED')).toBe(false);
	});
});

describe('vn-2026: thưởng dồn tháng 12', () => {
	// TN 9,5 triệu/tháng ⇒ TNCT sau bảo hiểm 25 triệu/tháng.
	const pays = [...monthly(2026, 25 * TR), { date: '2026-12-26' as const, gross: 50 * TR }];
	const c = taxCase(2026, [source({ id: 'A', claimsPersonalDeduction: true, payments: pays })]);

	it('khấu trừ 13,625 triệu, thuế năm 10,4 triệu, được hoàn khoảng 3,2 triệu', () => {
		const r = assess(rb, c, { filing: 'AUTHORIZED', sourceId: 'A' }, { practice: 'NONE' });
		expect(r.withheld).toBe(13_625_000);
		expect(r.assessableIncome).toBe(164 * TR);
		expect(r.annualTax).toBe(10_400_000);
		expect(r.delta.amount).toBe(-3_225_000);
		expect(r.delta.direction).toBe('REFUND');
	});

	it('giả định T1–T6 theo biểu 7 bậc: hoàn thêm 6 × (0,7 − 0,475) = 1,35 triệu, có cờ', () => {
		const r = assess(rb, c, { filing: 'AUTHORIZED', sourceId: 'A' });
		expect(r.withheld).toBe(13_625_000 + 1_350_000);
		expect(r.delta.amount).toBe(-4_575_000);
		const w = r.lines.find((l) => l.id === 'source:A:withheld')!;
		expect(w.flags).toContainEqual({ kind: 'SIMULATED', sourceId: 'A', practiceIds: ['vn-2026-h1-bieu-7-bac'] });
		expect(w.flags.some((f) => f.kind === 'PARAM' && f.openIssues.includes('oi-5'))).toBe(true);
	});
});

describe('vn-2026: chênh lệch biểu 7 bậc và 5 bậc theo tháng', () => {
	it.each([
		[10, 250_000],
		[20, 850_000],
		[40, 2_250_000],
		[80, 3_650_000],
		[101, 4_650_000],
		[500, 4_650_000]
	])('TN %d triệu: chênh %d đ', (tn, diff) => {
		expect(progressiveTax(old, tn * TR, ROUND) - progressiveTax(law, tn * TR, ROUND)).toBe(diff);
	});
});

describe('vn-2026: ranh giới bậc', () => {
	it.each([
		[30, 2_500_000],
		[60, 8_500_000],
		[100, 20_500_000]
	])('TN %d triệu/tháng: thuế %d đ', (tn, tax) => {
		expect(progressiveTax(law, tn * TR, ROUND)).toBe(tax);
	});

	it('số trừ suy ra từ các bậc: 0 / 0,5 / 3,5 / 9,5 / 14,5 triệu (tháng); 0 / 6 / 42 / 114 / 174 triệu (năm)', () => {
		expect(quickTable(law).map((r) => r.subtract)).toEqual([0, 500_000, 3_500_000, 9_500_000, 14_500_000]);
		const annual = annualScheduleOf(rb).value;
		expect(annual.brackets.map((b) => b.upTo)).toEqual([120 * TR, 360 * TR, 720 * TR, 1_200 * TR, null]);
		expect(quickTable(annual).map((r) => r.subtract)).toEqual([0, 6 * TR, 42 * TR, 114 * TR, 174 * TR]);
	});
});

describe('vn-2026: thuế cả năm, không người phụ thuộc', () => {
	it.each([
		[30, 11_400_000],
		[50, 40_800_000]
	])('thu nhập sau bảo hiểm %d triệu/tháng: thuế năm %d đ', (tn, tax) => {
		const c = taxCase(2026, [source({ id: 'A', claimsPersonalDeduction: true, payments: monthly(2026, tn * TR) })]);
		const r = assess(rb, c, { filing: 'AUTHORIZED', sourceId: 'A' });
		expect(r.annualTax).toBe(tax);
	});

	it('thuế năm gắn cờ biểu năm = tháng × 12 (điểm mở 6)', () => {
		const c = taxCase(2026, [source({ id: 'A', claimsPersonalDeduction: true, payments: monthly(2026, 30 * TR) })]);
		const line = assess(rb, c, { filing: 'AUTHORIZED', sourceId: 'A' }).lines.find((l) => l.id === 'annualTax')!;
		expect(line.flags.some((f) => f.kind === 'PARAM' && f.paramKey === 'schedules.annual' && f.openIssues.includes('oi-6'))).toBe(true);
	});
});

describe('vn-2026: tham số theo ngày chi trả', () => {
	it('trần BHXH, BHYT 46,8 triệu đến T6, 50,6 triệu từ T7', () => {
		const ins = { kind: 'SALARY', salary: 60 * TR, region: 'I' } as const;
		const c = taxCase(2026, [
			source({
				id: 'A',
				payments: [
					{ date: '2026-06-25', gross: 60 * TR, insurance: ins },
					{ date: '2026-07-25', gross: 60 * TR, insurance: ins }
				]
			})
		]);
		const r = assess(rb, c, { filing: 'AUTHORIZED', sourceId: 'A' });
		// T6: 46,8 × 9,5% + 60 × 1% = 4.446.000 + 600.000; T7: 50,6 × 9,5% + 600.000
		expect(r.insurance).toBe(4_446_000 + 600_000 + 4_807_000 + 600_000);
	});

	it('tiền ăn: T6 theo quy chế, từ T7 miễn tối đa 1,2 triệu/tháng', () => {
		const c = taxCase(2026, [
			source({
				id: 'A',
				payments: [
					{ date: '2026-06-25', gross: 20 * TR, mealAllowanceCash: 2 * TR, mealExemptByPolicy: 730_000 },
					{ date: '2026-07-25', gross: 20 * TR, mealAllowanceCash: 2 * TR, mealExemptByPolicy: 730_000 }
				]
			})
		]);
		const r = assess(rb, c, { filing: 'AUTHORIZED', sourceId: 'A' });
		expect(r.taxableIncome).toBe(40 * TR - 730_000 - 1_200_000);
	});

	it('ngưỡng khấu trừ 10%: 2 triệu trước 01/7, 5 triệu từ 01/7', () => {
		const B = source({
			id: 'B',
			contractMonths: null,
			payments: [
				{ date: '2026-06-30', gross: 3 * TR },
				{ date: '2026-07-01', gross: 3 * TR }
			]
		});
		const r = assess(rb, taxCase(2026, [B]), { filing: 'SELF', includeCasual: true });
		expect(r.withheld).toBe(300_000);
	});
});

describe('vn-2026: kịch bản', () => {
	const c = taxCase(
		2026,
		[source({ id: 'A', claimsPersonalDeduction: true, payments: monthly(2026, 40 * TR) })],
		{ claims: { medical: 30 * TR, education: 10 * TR } }
	);

	it('y tế, giáo dục chỉ trừ khi tự quyết toán; y tế áp trần 23 triệu', () => {
		const auth = assess(rb, c, { filing: 'AUTHORIZED', sourceId: 'A' });
		const self = assess(rb, c, { filing: 'SELF', includeCasual: false });
		expect(auth.deductions).toBe(186 * TR);
		expect(self.deductions).toBe(186 * TR + 23 * TR + 10 * TR);
		expect(auth.warnings.map((w) => w.code)).toContain('MEDICAL_SELF_ONLY');
		// 294 triệu ở bậc 10%: tiết kiệm 33 triệu × 10%
		expect(auth.annualTax - self.annualTax).toBe(3_300_000);
	});
});
