/**
 * Biểu lũy tiến từng phần (I6).
 *
 * Thuế được tính bằng cách cộng từng phần, trên BigInt, rồi làm tròn MỘT lần. Công thức
 * rút gọn "thuế suất × TN − số trừ" chỉ để hiển thị và để test; số trừ được SUY RA từ
 * các bậc, không bao giờ nhập tay.
 */
import type { AnnualSchedule, Bps, ProgressiveSchedule, Rulebook, RoundingRule } from '../rules/schema';
import { assertMoney, BPS_DENOMINATOR, fromBpsNumerator, toMoney, type Money } from './money';
import { resolveByPeriod, type Resolved } from './resolve';

/** Thuế thô theo đơn vị "đồng × phần vạn", chưa làm tròn. TN ≤ 0 thì thuế 0. */
export function taxNumerator(schedule: ProgressiveSchedule, income: Money): bigint {
	assertMoney(income, 'Thu nhập tính thuế');
	if (income <= 0) return 0n;
	const x = BigInt(income);
	let lower = 0n;
	let total = 0n;
	for (const b of schedule.brackets) {
		const upper = b.upTo === null ? null : BigInt(b.upTo);
		const top = upper === null || x < upper ? x : upper;
		if (top > lower) total += (top - lower) * BigInt(b.rate);
		if (upper === null || x <= upper) break;
		lower = upper;
	}
	return total;
}

export function progressiveTax(schedule: ProgressiveSchedule, income: Money, rounding: RoundingRule): Money {
	return fromBpsNumerator(taxNumerator(schedule, income), rounding);
}

/** Thuế suất của bậc chứa TN (cận trên bao gồm). TN ≤ 0 thì trả thuế suất bậc 1. */
export function marginalRate(schedule: ProgressiveSchedule, income: Money): Bps {
	for (const b of schedule.brackets) if (b.upTo === null || income <= b.upTo) return b.rate;
	throw new Error('Biểu không có bậc cuối.');
}

export interface QuickRow {
	/** Cận dưới (không bao gồm). */
	readonly from: Money;
	/** Cận trên (bao gồm); `null` ở bậc cuối. */
	readonly upTo: Money | null;
	readonly rate: Bps;
	/** Số trừ của công thức rút gọn: thuế = rate × TN − subtract. Suy ra từ các bậc. */
	readonly subtract: Money;
}

/**
 * Bảng công thức rút gọn, suy ra từ các bậc:
 * subtract_i = Σ_{j<i} (độ rộng bậc j) × (rate_i − rate_j).
 * Ném lỗi nếu số trừ không là số nguyên đồng (biểu như vậy không hiển thị được gọn).
 */
export function quickTable(schedule: ProgressiveSchedule): QuickRow[] {
	const rows: QuickRow[] = [];
	const widths: { width: bigint; rate: bigint }[] = [];
	let lower = 0n;
	for (const b of schedule.brackets) {
		const rate = BigInt(b.rate);
		let num = 0n;
		for (const w of widths) num += w.width * (rate - w.rate);
		if (num % BPS_DENOMINATOR !== 0n) throw new RangeError('Số trừ của biểu không là số nguyên đồng.');
		rows.push({
			from: toMoney(lower),
			upTo: b.upTo,
			rate: b.rate,
			subtract: toMoney(num / BPS_DENOMINATOR)
		});
		if (b.upTo !== null) {
			widths.push({ width: BigInt(b.upTo) - lower, rate });
			lower = BigInt(b.upTo);
		}
	}
	return rows;
}

/** Nhân mọi cận trên với `factor` (biểu tháng × 12 = biểu năm). */
export function scaleSchedule(schedule: ProgressiveSchedule, factor: number): ProgressiveSchedule {
	if (!Number.isSafeInteger(factor) || factor <= 0) throw new RangeError(`Hệ số không hợp lệ: ${factor}`);
	const brackets = schedule.brackets.map((b) =>
		b.upTo === null ? { upTo: null, rate: b.rate } : { upTo: toMoney(BigInt(b.upTo) * BigInt(factor)), rate: b.rate }
	);
	return { brackets: brackets as unknown as ProgressiveSchedule['brackets'] };
}

export function materializeAnnual(annual: AnnualSchedule, monthly: ProgressiveSchedule): ProgressiveSchedule {
	return annual.kind === 'MONTHLY_TIMES_12' ? scaleSchedule(monthly, 12) : annual.schedule;
}

/** Biểu năm dùng khi quyết toán, kèm dấu vết của cả biểu tháng và quy tắc năm. */
export function annualScheduleOf(rb: Rulebook): Resolved<ProgressiveSchedule> & { readonly uses: Resolved<unknown>['use'][] } {
	const monthly = resolveByPeriod('schedules.monthly', rb.schedules.monthly);
	const annual = resolveByPeriod('schedules.annual', rb.schedules.annual);
	const value = materializeAnnual(annual.value, monthly.value);
	return { value, use: annual.use, uses: annual.value.kind === 'MONTHLY_TIMES_12' ? [monthly.use, annual.use] : [annual.use] };
}
