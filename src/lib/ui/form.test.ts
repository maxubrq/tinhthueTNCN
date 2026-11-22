/**
 * Đường đi qua UI phải cho cùng số với ca vàng của core: form → TaxYearCase → kết quả.
 */
import { describe, expect, it } from 'vitest';
import { compute } from './compute';
import {
	concurrentClaimer,
	concurrentMonths,
	defaultForm,
	monthRanges,
	migrateForm,
	newExtra,
	newPeriod,
	newSource,
	toCase,
	type FormState,
	type FormStateV1,
	type PeriodForm
} from './form';
import { factsFromCase } from '../core/obligation';
import { vn2026 } from '../rules/vn-2026';

const TR = 1_000_000;

function period(fromMonth: number, toMonth: number, monthly: number, insurance: PeriodForm['insurance'] = 'NONE'): PeriodForm {
	return { ...newPeriod(`p${fromMonth}`, fromMonth, toMonth), monthly, insurance };
}

function form(edit: (f: FormState) => void): FormState {
	const f = defaultForm(2026);
	f.sources[0].periods = [period(1, 12, 0)];
	f.practice = 'NONE';
	edit(f);
	return f;
}

function ok(f: FormState) {
	const r = compute(f);
	if (r.kind !== 'OK') throw new Error(`${r.kind}: ${'problems' in r ? r.problems.join('; ') : ''}`);
	return r;
}

describe('form → core', () => {
	it('form trống: trạng thái EMPTY, không ném lỗi', () => {
		expect(compute(defaultForm(2026)).kind).toBe('EMPTY');
	});

	it('kỳ không có luật: báo lỗi, không dùng luật mới nhất', () => {
		expect(compute(defaultForm(2031)).kind).toBe('ERROR');
	});

	it('hai nơi lương 30 + 20 triệu: phải tự quyết toán, nộp thêm 11,4 triệu', () => {
		const r = ok(
			form((f) => {
				f.sources[0].periods = [period(1, 12, 30 * TR)];
				f.sources.push({ ...newSource('s2', 'Nơi B'), periods: [period(1, 12, 20 * TR)] });
			})
		);
		expect(r.obligation.verdict).toBe('MUST_SELF_SETTLE');
		expect(r.comparison.self.delta.amount).toBe(11_400_000);
	});

	it('thưởng 50 triệu tháng 12: ủy quyền được, hoàn 3,225 triệu', () => {
		const r = ok(
			form((f) => {
				f.sources[0].periods = [period(1, 12, 25 * TR)];
				f.sources[0].extras = [{ ...newExtra('e1', 12), amount: 50 * TR }];
			})
		);
		expect(r.obligation.verdict).toBe('MAY_AUTHORIZE');
		expect(r.comparison.authorized?.delta.amount).toBe(-3_225_000);
	});

	it('bảo hiểm theo lương, người phụ thuộc trễ hạn bị loại', () => {
		const f = form((f) => {
			f.sources[0].periods = [period(1, 12, 30 * TR, 'GROSS')];
			f.dependents.push({ key: 'd1', name: 'Con', fromMonth: 1, toMonth: 12, registeredInTime: false });
		});
		expect(toCase(f).incomeSources[0].payments[0].insurance).toEqual({ kind: 'SALARY', salary: 30 * TR, region: 'I' });
		expect(ok(f).comparison.self.warnings.map((w) => w.code)).toContain('DEPENDENT_LATE_REGISTRATION');
	});
});

describe('dòng thời gian của một nơi trả lương', () => {
	it('nghỉ thai sản T3–T8: vẫn là một nơi trả lương, ủy quyền được (bước 5)', () => {
		const r = ok(
			form((f) => {
				f.sources[0].periods = [period(1, 2, 30 * TR), period(9, 12, 30 * TR)];
			})
		);
		expect([r.obligation.step, r.obligation.verdict]).toEqual([5, 'MAY_AUTHORIZE']);
		// 6 tháng làm việc nhưng giảm trừ bản thân đủ 12 tháng: được hoàn phần giảm trừ chưa dùng.
		expect(r.comparison.authorized?.delta.direction).toBe('REFUND');
	});

	it('chỉ một nơi trả lương: không hỏi nơi giảm trừ, nơi đó tự trừ khi hợp đồng từ 3 tháng', () => {
		const f = form((f) => {
			f.sources[0].periods = [period(1, 12, 25 * TR)];
			f.personalSourceKey = null; // giá trị cũ còn sót, trang không còn hỏi
		});
		expect(toCase(f).incomeSources[0].claimsPersonalDeduction).toBe(true);
		f.sources[0].contract = 'SHORT';
		expect(toCase(f).incomeSources[0].claimsPersonalDeduction).toBe(false);
	});

	it('tăng lương giữa năm: hai khoảng liền nhau, mỗi khoảng một mức lương', () => {
		const f = form((f) => {
			f.sources[0].periods = [period(1, 6, 20 * TR), period(7, 12, 30 * TR)];
		});
		expect(toCase(f).incomeSources[0].payments.map((p) => p.gross / TR)).toEqual([20, 20, 20, 20, 20, 20, 30, 30, 30, 30, 30, 30]);
		expect(ok(f).obligation.step).toBe(5);
	});

	it('khoảng tháng trùng nhau: báo lỗi người dùng sửa được, không tính', () => {
		const r = compute(
			form((f) => {
				f.sources[0].periods = [period(1, 6, 20 * TR), period(6, 12, 30 * TR)];
			})
		);
		expect(r.kind).toBe('ERROR');
		expect(r.kind === 'ERROR' && r.problems[0]).toContain('trùng nhau');
	});

	it('khoản trả sau khi nghỉ đặt trước tháng lương cuối: báo lỗi', () => {
		const r = compute(
			form((f) => {
				f.sources[0].periods = [period(1, 7, 44 * TR)];
				f.sources[0].extras = [{ key: 'e', month: 5, amount: 10 * TR, afterLeaving: true }];
			})
		);
		expect(r.kind).toBe('ERROR');
	});

	it('c1 qua form: làm lần lượt nên B trừ giảm trừ trong tháng 12, hoàn 9.109.300 đ', () => {
		// Ca vàng core c1 giả định B không trừ giảm trừ (hoàn 12.209.300 đ). Thực tế làm lần lượt thì
		// mỗi nơi trừ trong tháng của mình: B khấu trừ 20% × (60 − 5,407 − 15,5) − 3,5 = 4,3186 tr.
		const r = ok(
			form((f) => {
				f.sources[0] = {
					...newSource('A', 'Công ty A'),
					periods: [period(1, 7, 44 * TR, 'GROSS')],
					extras: [{ key: 'e', month: 11, amount: 100 * TR, afterLeaving: true }]
				};
				f.sources.push({ ...newSource('B', 'Công ty B'), periods: [period(12, 12, 60 * TR, 'GROSS')] });
				f.currentSourceKey = 'B';
			})
		);
		expect(r.comparison.self.withheldBySource.map((w) => w.amount)).toEqual([23_216_000, 4_318_600]);
		expect(r.comparison.self.delta.amount).toBe(-9_109_300);
		expect(r.obligation.step).toBe(7);
	});

	it('I17: chia các tháng của một nơi thành bao nhiêu khoảng cũng vẫn là một nơi trả lương', () => {
		let seed = 17;
		const rand = () => ((seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
		for (let n = 0; n < 200; n++) {
			const months = Array.from({ length: 12 }, (_, i) => i + 1).filter(() => rand() < 0.6);
			if (months.length === 0) continue;
			// Gom các tháng liên tiếp thành khoảng, rồi cắt ngẫu nhiên thêm.
			const periods: PeriodForm[] = [];
			for (const m of months) {
				const last = periods[periods.length - 1];
				if (last && last.toMonth === m - 1 && rand() < 0.7) last.toMonth = m;
				else periods.push(period(m, m, Math.floor(rand() * 80 + 5) * TR, rand() < 0.5 ? 'GROSS' : 'NONE'));
			}
			const f = form((f) => {
				f.sources[0].periods = periods;
			});
			const c = toCase(f);
			expect(c.incomeSources).toHaveLength(1);
			expect(c.incomeSources[0].payments).toHaveLength(months.length);
			expect(factsFromCase(vn2026, c, {
				firstResidentYearBy12Months: false,
				untaxedForeignIncome: false,
				wantsHardshipRelief: false,
				employedAtSettlement: true,
				onlyInsurancePayouts: false
			}).progressiveEmployers).toBe(1);
		}
	});
});

describe('giảm trừ bản thân theo tháng', () => {
	it('làm lần lượt A rồi B: không có tháng chung, không hỏi, mỗi nơi trừ trong tháng của mình', () => {
		const f = form((f) => {
			f.sources[0].periods = [period(1, 7, 30 * TR)];
			f.sources.push({ ...newSource('s2', 'B'), periods: [period(8, 12, 30 * TR)] });
			f.personalSourceKey = 's1';
		});
		expect(concurrentMonths(f).months).toEqual([]);
		const c = toCase(f);
		expect(c.incomeSources.map((s) => s.personalDeductionMonths)).toEqual([
			[1, 2, 3, 4, 5, 6, 7],
			[8, 9, 10, 11, 12]
		]);
	});

	it('làm cùng lúc cả năm: chỉ nơi được chọn trừ (ca vàng hai nơi lương vẫn nộp thêm 11,4 tr)', () => {
		const f = form((f) => {
			f.sources[0].periods = [period(1, 12, 30 * TR)];
			f.sources.push({ ...newSource('s2', 'B'), periods: [period(1, 12, 20 * TR)] });
		});
		expect(concurrentMonths(f).months).toHaveLength(12);
		expect(toCase(f).incomeSources.map((s) => s.personalDeductionMonths?.length)).toEqual([12, 0]);
		expect(ok(f).comparison.self.delta.amount).toBe(11_400_000);
	});

	it('chồng nhau vài tháng: chỉ hỏi cho tháng chung, tháng riêng vẫn tự trừ', () => {
		const f = form((f) => {
			f.sources[0].periods = [period(1, 8, 30 * TR)];
			f.sources.push({ ...newSource('s2', 'B'), periods: [period(6, 12, 30 * TR)] });
			f.personalSourceKey = 's2';
		});
		expect(monthRanges(concurrentMonths(f).months)).toBe('6–8');
		expect(toCase(f).incomeSources.map((s) => s.personalDeductionMonths)).toEqual([
			[1, 2, 3, 4, 5],
			[6, 7, 8, 9, 10, 11, 12]
		]);
	});

	it('lựa chọn cũ trỏ tới nơi không còn làm cùng lúc thì lấy nơi đầu tiên trong nhóm', () => {
		const f = form((f) => {
			f.sources[0].periods = [period(1, 12, 30 * TR)];
			f.sources.push({ ...newSource('s2', 'B'), periods: [period(1, 12, 20 * TR)] });
			f.personalSourceKey = 'khong-con';
		});
		expect(concurrentClaimer(f)).toBe('s1');
	});
});

describe('hồ sơ đã lưu bản 1', () => {
	const v1: FormStateV1 = {
		...defaultForm(2026),
		version: 1,
		sources: [
			{
				key: 's1',
				name: 'Công ty A',
				contract: 'LONG',
				monthly: 25 * TR,
				fromMonth: 1,
				toMonth: 12,
				insurance: 'GROSS',
				insuranceSalary: null,
				region: 'II',
				bonus: 50 * TR,
				bonusMonth: 12,
				withheld: 9 * TR
			}
		]
	};

	it('chuyển sang bản 2 mà không đổi hồ sơ gửi vào core', () => {
		const v2 = migrateForm(v1);
		expect(v2.version).toBe(2);
		const c = toCase(v2);
		expect(c.incomeSources[0].payments).toHaveLength(13);
		expect(c.incomeSources[0].payments[0].insurance).toEqual({ kind: 'SALARY', salary: 25 * TR, region: 'II' });
		expect(c.incomeSources[0].payments.at(-1)).toMatchObject({ date: '2026-12-26', gross: 50 * TR });
		expect(c.incomeSources[0].withheld?.amount).toBe(9 * TR);
	});

	it('bản 2 đi qua migrateForm không đổi', () => {
		const v2 = defaultForm(2026);
		expect(migrateForm(v2)).toBe(v2);
	});
});
