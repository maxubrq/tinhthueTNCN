/**
 * Đường đi qua UI phải cho cùng số với ca vàng của core: form → TaxYearCase → kết quả.
 */
import { describe, expect, it } from 'vitest';
import { compute } from './compute';
import { defaultForm, newSource, toCase, type FormState } from './form';

const TR = 1_000_000;

function form(edit: (f: FormState) => void): FormState {
	const f = defaultForm(2026);
	f.sources[0].insurance = 'NONE';
	f.practice = 'NONE';
	edit(f);
	return f;
}

describe('form → core', () => {
	it('form trống: trạng thái EMPTY, không ném lỗi', () => {
		expect(compute(defaultForm(2026)).kind).toBe('EMPTY');
	});

	it('kỳ không có luật: báo lỗi, không dùng luật mới nhất', () => {
		const r = compute(defaultForm(2031));
		expect(r.kind).toBe('ERROR');
	});

	it('hai nơi lương 30 + 20 triệu: phải tự quyết toán, nộp thêm 11,4 triệu', () => {
		const f = form((f) => {
			f.sources[0].monthly = 30 * TR;
			f.sources.push({ ...newSource('s2', 'Nơi B'), monthly: 20 * TR, insurance: 'NONE' });
		});
		const r = compute(f);
		if (r.kind !== 'OK') throw new Error(r.kind);
		expect(r.obligation.verdict).toBe('MUST_SELF_SETTLE');
		expect(r.comparison.self.delta.amount).toBe(11_400_000);
	});

	it('thưởng 50 triệu tháng 12: ủy quyền được, hoàn 3,225 triệu', () => {
		const f = form((f) => {
			f.sources[0].monthly = 25 * TR;
			f.sources[0].bonus = 50 * TR;
		});
		const r = compute(f);
		if (r.kind !== 'OK') throw new Error(r.kind);
		expect(r.obligation.verdict).toBe('MAY_AUTHORIZE');
		expect(r.comparison.authorized?.delta.amount).toBe(-3_225_000);
	});

	it('bảo hiểm theo lương, người phụ thuộc trễ hạn bị loại', () => {
		const f = form((f) => {
			f.sources[0].monthly = 30 * TR;
			f.sources[0].insurance = 'GROSS';
			f.dependents.push({ key: 'd1', name: 'Con', fromMonth: 1, toMonth: 12, registeredInTime: false });
		});
		const c = toCase(f);
		expect(c.incomeSources[0].payments[0].insurance).toEqual({ kind: 'SALARY', salary: 30 * TR, region: 'I' });
		const r = compute(f);
		if (r.kind !== 'OK') throw new Error(r.kind);
		expect(r.comparison.self.warnings.map((w) => w.code)).toContain('DEPENDENT_LATE_REGISTRATION');
	});
});
