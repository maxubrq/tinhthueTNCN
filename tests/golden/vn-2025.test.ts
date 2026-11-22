/**
 * Ca vàng kỳ 2025, lấy từ docs/research/thue-tncn-2026.md. Mọi số tính bằng đồng.
 * KHÔNG được đổi kết quả của file này; nếu phải đổi thì đó là sửa sai (xem CLAUDE.md).
 */
import { describe, expect, it } from 'vitest';
import { assess } from '../../src/lib/core/settlement';
import { quickTable, annualScheduleOf } from '../../src/lib/core/schedule';
import { vn2025 } from '../../src/lib/rules/vn-2025';
import { monthly, source, taxCase, TR } from './helpers';

const rb = vn2025;

describe('vn-2025: thuế cả năm, không người phụ thuộc', () => {
	it.each([
		[30, 25_800_000],
		[50, 78_000_000]
	])('thu nhập sau bảo hiểm %d triệu/tháng: thuế năm %d đ', (tn, tax) => {
		const c = taxCase(2025, [source({ id: 'A', claimsPersonalDeduction: true, payments: monthly(2025, tn * TR) })]);
		const r = assess(rb, c, { filing: 'AUTHORIZED', sourceId: 'A' });
		expect(r.annualTax).toBe(tax);
		// Một nơi, khấu trừ đúng luật cả năm, lương đều: không chênh lệch.
		expect(r.delta.amount).toBe(0);
	});
});

describe('vn-2025: biểu 7 bậc', () => {
	it('số trừ suy ra từ các bậc khớp công thức rút gọn của nghiên cứu', () => {
		expect(quickTable(rb.schedules.monthly.value).map((r) => r.subtract)).toEqual([
			0, 250_000, 750_000, 1_650_000, 3_250_000, 5_850_000, 9_850_000
		]);
	});

	it('ranh giới năm 60 / 120 / 216 / 384 / 624 / 960 triệu', () => {
		expect(annualScheduleOf(rb).value.brackets.map((b) => b.upTo)).toEqual([
			60 * TR, 120 * TR, 216 * TR, 384 * TR, 624 * TR, 960 * TR, null
		]);
	});

	it('không có giảm trừ y tế, giáo dục trong kỳ 2025', () => {
		const c = taxCase(2025, [source({ id: 'A', claimsPersonalDeduction: true, payments: monthly(2025, 30 * TR) })], {
			claims: { medical: 10 * TR, education: 10 * TR }
		});
		const r = assess(rb, c, { filing: 'SELF', includeCasual: false });
		expect(r.deductions).toBe(132 * TR);
		expect(r.warnings.map((w) => w.code)).toEqual(expect.arrayContaining(['MEDICAL_NOT_IN_PERIOD', 'EDUCATION_NOT_IN_PERIOD']));
	});
});
