/**
 * Câu hỏi (3): giảm thuế hợp pháp được bằng cách nào, bao nhiêu.
 *
 * Tiết kiệm của một đòn bẩy = thuế(TN) − thuế(max(0, TN − x)), tính chính xác bằng biểu
 * năm, vì một khoản giảm trừ có thể kéo TN qua ranh giới bậc. `x` là phần còn trống so
 * với trần của Rulebook, sau khi trừ phần bạn đã dùng. Không gợi ý sản phẩm tài chính cụ
 * thể (kien-truc-v0 §3.2).
 */
import type { IsoDate, Rulebook } from '../rules/schema';
import type { TaxYearCase } from './case';
import { regimeOf, sourceMonths } from './income';
import { maxMoney, sum, toMoney, type Money } from './money';
import { resolveByDate, resolveByPeriod } from './resolve';
import { annualScheduleOf, progressiveTax } from './schedule';
import { assess, type Assessment, type AssessOptions } from './settlement';
import { flagsOf, mergeFlags, type Flag, type ParamUse } from './trace';

export type LeverId = 'DEPENDENT' | 'VOLUNTARY_PENSION' | 'MEDICAL' | 'EDUCATION' | 'MEAL_ALLOWANCE' | 'CHARITY';

export interface Lever {
	readonly id: LeverId;
	readonly label: string;
	/** Phần còn được dùng trong năm. `null` = luật không đặt trần. */
	readonly room: Money | null;
	/** Số thuế giảm được nếu dùng hết `room` (hoặc dùng `per` khi không có trần). */
	readonly saving: Money;
	/** Khi `room` là null: `saving` tính cho mỗi `per` đồng. */
	readonly per?: Money;
	readonly requiresSelfSettlement: boolean;
	readonly conditions: readonly string[];
	readonly params: readonly ParamUse[];
	readonly flags: readonly Flag[];
}

/** Thuế giảm được khi TNTT năm giảm `x`. */
export function savingFor(rb: Rulebook, assessableIncome: Money, x: Money): Money {
	const schedule = annualScheduleOf(rb).value;
	const r = resolveByPeriod('rounding', rb.rounding).value.annualTax;
	return progressiveTax(schedule, assessableIncome, r) - progressiveTax(schedule, maxMoney(0, assessableIncome - x), r);
}

function midMonth(year: number, month: number): IsoDate {
	return `${year}-${String(month).padStart(2, '0')}-15` as IsoDate;
}

/**
 * Các đòn bẩy cho một hồ sơ. `base` phải là kết quả kịch bản tự quyết toán, vì y tế và
 * giáo dục chỉ trừ được ở kịch bản đó.
 */
export function findLevers(rb: Rulebook, c: TaxYearCase, base: Assessment): Lever[] {
	if (base.scenario.filing !== 'SELF') throw new Error('findLevers cần kết quả kịch bản tự quyết toán.');
	if (base.rulebookId !== rb.id) throw new Error('Kết quả và Rulebook khác kỳ.');
	if (c.residency === 'NON_RESIDENT') return [];

	const tn = base.assessableIncome;
	const baseFlags = base.lines.find((l) => l.id === 'annualTax')?.flags ?? [];
	const used = (id: string) => base.lines.find((l) => l.id === `deduction:${id}`)?.amount ?? 0;
	const out: Lever[] = [];
	const push = (l: Omit<Lever, 'flags'>) => out.push({ ...l, flags: mergeFlags(flagsOf(l.params), baseFlags) });
	const d = rb.deductions;

	// Người phụ thuộc
	const dep = resolveByPeriod('deductions.dependentMonthly', d.dependentMonthly);
	const deadline = resolveByPeriod('deductions.dependentRegistrationDeadline', d.dependentRegistrationDeadline);
	const limit = resolveByPeriod('deductions.dependentIncomeMonthlyLimit', d.dependentIncomeMonthlyLimit);
	const depRoom = toMoney(BigInt(dep.value) * 12n);
	push({
		id: 'DEPENDENT',
		label: 'Đăng ký thêm một người phụ thuộc (cả năm)',
		room: depRoom,
		saving: savingFor(rb, tn, depRoom),
		requiresSelfSettlement: false,
		conditions: [
			`Đăng ký trước ${deadline.value}.`,
			`Thu nhập của người phụ thuộc không quá ${limit.value} đ/tháng từ mọi nguồn.`,
			'Mỗi người phụ thuộc chỉ được một người nộp thuế khai.'
		],
		params: [dep.use, deadline.use, limit.use]
	});

	// Hưu trí tự nguyện, BH nhân thọ
	const pen = resolveByPeriod('deductions.voluntaryPension', d.voluntaryPension);
	const penRoom = maxMoney(0, toMoney(BigInt(pen.value.monthlyCap) * 12n) - used('pension'));
	push({
		id: 'VOLUNTARY_PENSION',
		label: pen.value.covers.includes('LIFE_INSURANCE')
			? 'Hưu trí tự nguyện, bảo hiểm nhân thọ (cộng chung một trần)'
			: 'Hưu trí tự nguyện',
		room: penRoom,
		saving: savingFor(rb, tn, penRoom),
		requiresSelfSettlement: false,
		conditions: ['Gộp cả phần bạn và doanh nghiệp đóng.', 'Sản phẩm của doanh nghiệp được phép kinh doanh tại Việt Nam.'],
		params: [pen.use]
	});

	// Y tế, giáo dục
	for (const [key, id, label, cond] of [
		['medical', 'MEDICAL', 'Chi phí y tế', 'Hóa đơn đứng tên, chưa được bảo hiểm chi trả.'],
		['education', 'EDUCATION', 'Chi phí giáo dục', 'Hóa đơn đứng tên bạn hoặc người phụ thuộc.']
	] as const) {
		const r = resolveByPeriod(`deductions.${key}`, d[key]);
		if (r.value === null || r.value.annualCap === null) continue;
		const room = maxMoney(0, r.value.annualCap - used(key));
		push({
			id,
			label,
			room,
			saving: savingFor(rb, tn, room),
			requiresSelfSettlement: true,
			conditions: [cond, 'Chỉ trừ khi tự quyết toán.'],
			params: [r.use]
		});
	}

	// Từ thiện: không có trần, tính cho mỗi 1 triệu
	const ch = resolveByPeriod('deductions.charity', d.charity);
	if (ch.value !== null) {
		const per = 1_000_000;
		push({
			id: 'CHARITY',
			label: 'Từ thiện, nhân đạo, khuyến học',
			room: ch.value.annualCap === null ? null : maxMoney(0, ch.value.annualCap - used('charity')),
			saving: savingFor(rb, tn, per),
			per,
			requiresSelfSettlement: true,
			conditions: ['Qua tổ chức được phép, có chứng từ.', 'Chỉ trừ khi tự quyết toán.'],
			params: [ch.use]
		});
	}

	// Tiền ăn ca bằng tiền: chỉ các tháng có trần theo luật
	const months = sourceMonths(rb, c).filter((m) => regimeOf(rb, c.incomeSources[m.sourceIndex]).regime === 'PROGRESSIVE');
	if (months.length > 0) {
		const uses: ParamUse[] = [];
		let cap = 0;
		for (let m = 1; m <= 12; m++) {
			const r = resolveByDate('employmentIncome.mealAllowance', rb.employmentIncome.mealAllowance, midMonth(rb.taxYear, m));
			uses.push(r.use);
			if (r.value.kind !== 'MONTHLY_CAP') continue;
			const already = sum(months.filter((x) => x.month === m).map((x) => x.mealExempt));
			cap += maxMoney(0, r.value.monthlyCap - already);
		}
		if (cap > 0) {
			push({
				id: 'MEAL_ALLOWANCE',
				label: 'Trả một phần lương thành tiền ăn ca bằng tiền',
				room: cap,
				saving: savingFor(rb, tn, cap),
				requiresSelfSettlement: false,
				conditions: ['Phải ghi trong quy chế của doanh nghiệp; cần doanh nghiệp đồng ý.'],
				params: uses
			});
		}
	}

	return out;
}

export interface ScenarioComparison {
	readonly authorized: Assessment | null;
	readonly self: Assessment;
	/** Số hoàn thêm (dương) khi tự quyết toán so với ủy quyền. `null` nếu không ủy quyền được. */
	readonly selfAdvantage: Money | null;
}

/**
 * Khoảnh khắc đỉnh (kien-truc-v0 §2): "ủy quyền thì hoàn X, tự quyết toán thì hoàn Y".
 * `authorizedSourceId` là nơi đang làm lúc quyết toán; `null` khi không ủy quyền được.
 */
export function compareScenarios(
	rb: Rulebook,
	c: TaxYearCase,
	authorizedSourceId: string | null,
	options: AssessOptions & { readonly includeCasual?: boolean } = {}
): ScenarioComparison {
	const self = assess(rb, c, { filing: 'SELF', includeCasual: options.includeCasual ?? true }, options);
	if (authorizedSourceId === null) return { authorized: null, self, selfAdvantage: null };
	const authorized = assess(rb, c, { filing: 'AUTHORIZED', sourceId: authorizedSourceId }, options);
	return { authorized, self, selfAdvantage: authorized.delta.amount - self.delta.amount };
}

/** Thủ thuật rủi ro cần cảnh báo (docs/research, Câu hỏi (3)). */
export const RISKY_TRICKS = [
	{ code: 'DEPENDENT_OVER_INCOME', message: 'Khai người phụ thuộc có thu nhập vượt mức cho phép.' },
	{ code: 'DEPENDENT_DUPLICATED', message: 'Nhiều người cùng khai một người phụ thuộc.' },
	{ code: 'SPLIT_PAYMENTS', message: 'Chia nhỏ khoản chi dưới ngưỡng khấu trừ 10%: chỉ tránh được khấu trừ, không tránh được thuế.' },
	{ code: 'FALSE_COMMITMENT', message: 'Cam kết sai để không bị khấu trừ.' },
	{ code: 'INELIGIBLE_MEDICAL_EDUCATION', message: 'Khai chi phí y tế đã được bảo hiểm trả, hoặc học phí ở cơ sở nước ngoài.' },
	{ code: 'DISGUISED_SERVICE_CONTRACT', message: 'Dùng hợp đồng dịch vụ cho công việc toàn thời gian.' }
] as const;
