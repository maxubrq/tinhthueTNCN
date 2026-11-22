/**
 * Phép thử thiết kế: Rulebook giả 2027 chạy qua core mà không sửa core.
 * Số kỳ vọng tính tay từ biểu giả trong vn-2027-gia.ts.
 */
import { describe, expect, it } from 'vitest';
import { assess } from '../../src/lib/core/settlement';
import { progressiveTax, quickTable } from '../../src/lib/core/schedule';
import { selectRulebook } from '../../src/lib/core/resolve';
import { rulebookProblems } from '../../src/lib/core/validate';
import { RULEBOOKS } from '../../src/lib/rules';
import { vn2027Gia } from './vn-2027-gia';
import { monthly, source, taxCase, TR } from '../golden/helpers';

const ROUND = { mode: 'HALF_UP', toMultipleOf: 1 } as const;

describe('phép thử thiết kế: vn-2027 giả', () => {
	it('qua validator', () => {
		expect(rulebookProblems(vn2027Gia)).toEqual([]);
	});

	it('số trừ của biểu mới được suy ra, không cần nhập tay: 0 / 2 / 7 / 19 triệu', () => {
		// subtract_i = Σ_{j<i} độ rộng_j × (rate_i − rate_j)
		// 15%: 20×10% = 2; 25%: 20×20% + 30×10% = 7; 35%: 20×30% + 30×20% + 70×10% = 19
		expect(quickTable(vn2027Gia.schedules.monthly.value).map((r) => r.subtract)).toEqual([0, 2 * TR, 7 * TR, 19 * TR]);
		expect(progressiveTax(vn2027Gia.schedules.monthly.value, 50 * TR, ROUND)).toBe(5_500_000);
	});

	it('quyết toán năm dùng biểu và giảm trừ mới', () => {
		// 40 tr/tháng: TNTT = (40 − 17) × 12 = 276 tr; biểu năm ×12: 276 × 15% − 24 = 17,4 tr
		const c = taxCase(2027, [source({ id: 'A', claimsPersonalDeduction: true, payments: monthly(2027, 40 * TR) })]);
		const r = assess(vn2027Gia, c, { filing: 'AUTHORIZED', sourceId: 'A' });
		expect(r.rulebookId).toBe('vn-2027-gia');
		expect(r.assessableIncome).toBe(276 * TR);
		expect(r.annualTax).toBe(17_400_000);
		expect(r.delta.amount).toBe(0);
	});

	it('ngưỡng đổi giữa năm tra theo ngày chi trả', () => {
		const B = source({
			id: 'B',
			contractMonths: null,
			payments: [
				{ date: '2027-06-30', gross: 6 * TR },
				{ date: '2027-07-01', gross: 6 * TR }
			]
		});
		const r = assess(vn2027Gia, taxCase(2027, [B]), { filing: 'SELF', includeCasual: true });
		expect(r.withheld).toBe(600_000);
	});

	it('Rulebook giả không lọt vào danh sách phát hành', () => {
		expect(() => selectRulebook(RULEBOOKS, 2027)).toThrow();
	});
});
