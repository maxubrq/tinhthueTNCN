/**
 * Money: số nguyên đồng (ADR-004, I5). Mọi phép nhân với tỷ lệ đi qua BigInt để
 * không có số thực ở bất kỳ bước nào; chỉ làm tròn ở điểm đã khai.
 */
import type { Bps, RoundingRule } from '../rules/schema';

/** Số nguyên đồng, `Number.isSafeInteger`. */
export type Money = number;

export const BPS_DENOMINATOR = 10_000n;

/**
 * Làm tròn dùng cho các bước CƠ CHẾ mà Rulebook chưa khai quy tắc (tiền bảo hiểm từng
 * khoản, phần tiền nhà tính thuế, khấu trừ 10%): tới đồng, nửa xa số 0. Sai lệch tối đa
 * 1 đồng mỗi lần. Nếu luật năm nào quy định khác thì phải đưa vào schema.
 */
export const MECHANISM_ROUNDING: RoundingRule = { mode: 'HALF_UP', toMultipleOf: 1 };

export function isMoney(x: unknown): x is Money {
	return typeof x === 'number' && Number.isSafeInteger(x);
}

export function assertMoney(x: unknown, what: string): asserts x is Money {
	if (!isMoney(x)) throw new RangeError(`${what} phải là số nguyên đồng, nhận được ${String(x)}.`);
}

export function toMoney(x: bigint, what = 'Kết quả'): Money {
	const n = Number(x);
	assertMoney(n, what);
	return n;
}

export function sum(xs: readonly Money[]): Money {
	let total = 0n;
	for (const x of xs) {
		assertMoney(x, 'Số hạng');
		total += BigInt(x);
	}
	return toMoney(total, 'Tổng');
}

export function minMoney(a: Money, b: Money): Money {
	return a < b ? a : b;
}

export function maxMoney(a: Money, b: Money): Money {
	return a > b ? a : b;
}

/** n / d làm tròn theo mode, d > 0. Tất cả trên BigInt. */
export function divRound(n: bigint, d: bigint, mode: RoundingRule['mode']): bigint {
	if (d <= 0n) throw new RangeError('Mẫu số phải dương.');
	const q = n / d; // cắt về 0
	const r = n % d;
	if (r === 0n) return q;
	switch (mode) {
		case 'FLOOR':
			return n < 0n ? q - 1n : q;
		case 'CEIL':
			return n > 0n ? q + 1n : q;
		case 'HALF_UP': {
			const twice = 2n * (r < 0n ? -r : r);
			if (twice >= d) return n < 0n ? q - 1n : q + 1n;
			return q;
		}
	}
}

/**
 * Đổi một tử số theo đơn vị "đồng × phần vạn" về đồng, làm tròn theo quy tắc.
 * Ví dụ thuế thô = Σ phần thu nhập × thuế suất (bps) → chia 10.000 một lần duy nhất.
 */
export function fromBpsNumerator(numerator: bigint, rule: RoundingRule): Money {
	if (!Number.isSafeInteger(rule.toMultipleOf) || rule.toMultipleOf <= 0) {
		throw new RangeError(`Bội số làm tròn không hợp lệ: ${rule.toMultipleOf}`);
	}
	const step = BigInt(rule.toMultipleOf);
	return toMoney(divRound(numerator, BPS_DENOMINATOR * step, rule.mode) * step);
}

/** amount × rate, làm tròn theo quy tắc. */
export function applyRate(amount: Money, rate: Bps, rule: RoundingRule): Money {
	assertMoney(amount, 'Số tiền');
	if (!Number.isSafeInteger(rate)) throw new RangeError(`Tỷ lệ phải là số nguyên phần vạn: ${rate}`);
	return fromBpsNumerator(BigInt(amount) * BigInt(rate), rule);
}
