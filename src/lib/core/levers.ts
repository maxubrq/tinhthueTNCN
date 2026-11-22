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
	/** Mức luật định đi kèm điều kiện, số nguyên đồng; UI tự định dạng. */
	readonly limits: readonly { readonly label: string; readonly amount: Money }[];
	readonly params: readonly ParamUse[];
	readonly flags: readonly Flag[];
}

/** Thuế giảm được khi TNTT năm giảm `x`. */
export function savingFor(rb: Rulebook, assessableIncome: Money, x: Money): Money {
	const schedule = annualScheduleOf(rb).value;
	const r = resolveByPeriod('rounding', rb.rounding).value.annualTax;
	return progressiveTax(schedule, assessableIncome, r) - progressiveTax(schedule, maxMoney(0, assessableIncome - x), r);
}

function viDate(d: IsoDate): string {
	const [y, m, day] = d.split('-');
	return `${day}/${m}/${y}`;
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
		conditions: [`Đăng ký chậm nhất ngày ${viDate(deadline.value)}.`, 'Mỗi người phụ thuộc chỉ được một người khai giảm trừ.'],
		limits: [{ label: 'Thu nhập của người phụ thuộc, tính bình quân mỗi tháng từ mọi nguồn', amount: limit.value }],
		params: [dep.use, deadline.use, limit.use]
	});

	// Hưu trí tự nguyện, BH nhân thọ
	const pen = resolveByPeriod('deductions.voluntaryPension', d.voluntaryPension);
	const penRoom = maxMoney(0, toMoney(BigInt(pen.value.monthlyCap) * 12n) - used('pension'));
	push({
		id: 'VOLUNTARY_PENSION',
		label: pen.value.covers.includes('LIFE_INSURANCE')
			? 'Hưu trí tự nguyện và bảo hiểm nhân thọ (chung một mức tối đa)'
			: 'Hưu trí tự nguyện',
		room: penRoom,
		saving: savingFor(rb, tn, penRoom),
		requiresSelfSettlement: false,
		conditions: ['Tính cả phần công ty đóng cho bạn.', 'Mua của công ty bảo hiểm hoặc quỹ hưu trí được phép hoạt động tại Việt Nam.'],
		limits: [],
		params: [pen.use]
	});

	// Y tế, giáo dục
	for (const [key, id, label, cond] of [
		['medical', 'MEDICAL', 'Chi phí y tế', 'Có hóa đơn đứng tên; phần bảo hiểm đã chi trả thì không được trừ.'],
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
			conditions: [cond],
			limits: [],
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
			conditions: ['Qua tổ chức được phép, có chứng từ.'],
			limits: [],
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
				label: 'Chuyển một phần lương thành phụ cấp tiền ăn ca',
				room: cap,
				saving: savingFor(rb, tn, cap),
				requiresSelfSettlement: false,
				conditions: ['Công ty phải đồng ý và ghi khoản này trong quy chế.'],
				limits: [],
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
	{ code: 'DEPENDENT_OVER_INCOME', message: 'Khai người phụ thuộc có thu nhập vượt mức luật cho phép.' },
	{ code: 'DEPENDENT_DUPLICATED', message: 'Nhiều người cùng khai một người phụ thuộc.' },
	{ code: 'SPLIT_PAYMENTS', message: 'Chia nhỏ khoản chi cho dưới ngưỡng khấu trừ 10%. Cách này chỉ tránh được khấu trừ, không tránh được thuế.' },
	{ code: 'FALSE_COMMITMENT', message: 'Ký cam kết không đúng sự thật để khỏi bị khấu trừ thuế.' },
	{ code: 'INELIGIBLE_MEDICAL_EDUCATION', message: 'Khai chi phí y tế mà bảo hiểm đã trả, hoặc học phí ở cơ sở nước ngoài.' },
	{ code: 'DISGUISED_SERVICE_CONTRACT', message: 'Ký hợp đồng dịch vụ cho một công việc thực chất là toàn thời gian.' }
] as const;
