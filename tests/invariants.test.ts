/**
 * Bất biến chạy trên MỌI Rulebook trong RULEBOOKS (I3, I6, I7, I1, I8, I9).
 * Property test dùng PRNG có seed cố định để tái lập được, không cần thư viện ngoài.
 */
import { describe, expect, it } from 'vitest';
import type { TaxYearCase } from '../src/lib/core/case';
import { UncoveredDateError, UnsupportedPeriodError } from '../src/lib/core/errors';
import { resolveByDate, selectRulebook } from '../src/lib/core/resolve';
import { annualScheduleOf, marginalRate, progressiveTax, quickTable, taxNumerator } from '../src/lib/core/schedule';
import { assess, type SettlementDelta } from '../src/lib/core/settlement';
import { decideObligation, type ObligationFacts, type Verdict } from '../src/lib/core/obligation';
import { rulebookProblems } from '../src/lib/core/validate';
import { RULEBOOKS } from '../src/lib/rules';
import type { IsoDate, ProgressiveSchedule } from '../src/lib/rules/schema';

function prng(seed: number) {
	let s = seed >>> 0;
	return () => {
		s = (s + 0x6d2b79f5) >>> 0;
		let t = s;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

const ROUND = { mode: 'HALF_UP', toMultipleOf: 1 } as const;

function schedulesOf(rb: (typeof RULEBOOKS)[number]): [string, ProgressiveSchedule][] {
	return [
		['monthly', rb.schedules.monthly.value],
		['annual', annualScheduleOf(rb).value],
		...rb.withholdingPractices.map((p) => [`practice ${p.id}`, p.monthlySchedule] as [string, ProgressiveSchedule])
	];
}

describe.each(RULEBOOKS.map((rb) => [rb.id, rb] as const))('%s', (_id, rb) => {
	it('I3, I5: validator không báo lỗi', () => {
		expect(rulebookProblems(rb)).toEqual([]);
	});

	it('I3: ngày ngoài kỳ thì ném lỗi, không fallback', () => {
		expect(() =>
			resolveByDate('withholding.flatRate', rb.withholding.flatRate, `${rb.taxYear + 1}-01-01` as IsoDate)
		).toThrow(UncoveredDateError);
	});

	describe.each(schedulesOf(rb))('I6: biểu %s', (_name, schedule) => {
		const rand = prng(rb.taxYear);
		const top = (schedule.brackets.at(-2)?.upTo ?? 100_000_000) * 2;
		const samples = Array.from({ length: 2_000 }, () => Math.floor(rand() * top));
		const boundaries = schedule.brackets.flatMap((b) => (b.upTo === null ? [] : [b.upTo - 1, b.upTo, b.upTo + 1]));

		it('công thức rút gọn (số trừ suy ra) khớp cộng từng phần ở mọi điểm', () => {
			const rows = quickTable(schedule);
			for (const x of [...samples, ...boundaries]) {
				if (x <= 0) continue;
				const row = rows.find((r) => r.upTo === null || x <= r.upTo)!;
				expect(BigInt(row.rate) * BigInt(x) - BigInt(row.subtract) * 10_000n).toBe(taxNumerator(schedule, x));
			}
		});

		it('liên tục tại ranh giới: hai công thức kề nhau cho cùng số thuế', () => {
			const rows = quickTable(schedule);
			for (let i = 0; i + 1 < rows.length; i++) {
				const x = BigInt(rows[i].upTo!);
				expect(BigInt(rows[i].rate) * x - BigInt(rows[i].subtract) * 10_000n).toBe(
					BigInt(rows[i + 1].rate) * x - BigInt(rows[i + 1].subtract) * 10_000n
				);
			}
		});

		it('đơn điệu: thuế không giảm khi thu nhập tăng, và không vượt thuế suất biên', () => {
			const xs = [...samples, ...boundaries].filter((x) => x >= 0).sort((a, b) => a - b);
			for (let i = 1; i < xs.length; i++) {
				expect(taxNumerator(schedule, xs[i])).toBeGreaterThanOrEqual(taxNumerator(schedule, xs[i - 1]));
				const dx = BigInt(xs[i] - xs[i - 1]);
				expect(taxNumerator(schedule, xs[i]) - taxNumerator(schedule, xs[i - 1])).toBeLessThanOrEqual(
					dx * BigInt(marginalRate(schedule, xs[i]))
				);
			}
		});
	});

	it('I7, I1: Δ khép kín, số hoàn ≤ số đã khấu trừ, TNTT ≥ 0, tái lập', () => {
		const rand = prng(rb.taxYear * 7);
		const y = rb.taxYear;
		for (let n = 0; n < 200; n++) {
			const nSources = 1 + Math.floor(rand() * 3);
			const c: TaxYearCase = {
				taxPeriod: y,
				residency: 'RESIDENT',
				dependents: rand() < 0.5 ? [] : [{ id: 'd', name: 'Con', fromMonth: 1, toMonth: 12, registeredOn: `${y}-01-15` }],
				claims: { medical: Math.floor(rand() * 40e6), voluntaryPension: Math.floor(rand() * 50e6) },
				incomeSources: Array.from({ length: nSources }, (_, k) => ({
					id: `s${k}`,
					name: `Nơi ${k}`,
					contractMonths: rand() < 0.7 ? 12 : null,
					claimsPersonalDeduction: k === 0,
					withheld: rand() < 0.3 ? { amount: Math.floor(rand() * 100e6), provenance: 'USER' as const } : undefined,
					payments: Array.from({ length: 1 + Math.floor(rand() * 12) }, (_, m) => ({
						date: `${y}-${String(m + 1).padStart(2, '0')}-20` as IsoDate,
						gross: Math.floor(rand() * 150e6),
						insurance: { kind: 'SALARY' as const, salary: Math.floor(rand() * 80e6), region: 'I' as const }
					}))
				}))
			};
			for (const s of [
				{ filing: 'SELF', includeCasual: true },
				{ filing: 'SELF', includeCasual: false },
				{ filing: 'AUTHORIZED', sourceId: 's0' }
			] as const) {
				const r = assess(rb, c, s);
				expect(r.assessableIncome).toBeGreaterThanOrEqual(0);
				expect(r.delta.amount).toBe(r.annualTax - r.withheld);
				expect(-r.delta.amount).toBeLessThanOrEqual(r.withheld);
				expect(r.lines.every((l) => Number.isSafeInteger(l.amount))).toBe(true);
				expect(r.rulebookId).toBe(rb.id);
				expect(assess(rb, c, s)).toEqual(r);
				// I9: y tế chỉ trừ khi tự quyết toán
				if (s.filing === 'AUTHORIZED') expect(r.lines.find((l) => l.id === 'deduction:medical')!.amount).toBe(0);
			}
		}
	});

	it('I8: người không cư trú không có giảm trừ và không vào biểu lũy tiến', () => {
		const c: TaxYearCase = {
			taxPeriod: rb.taxYear,
			residency: 'NON_RESIDENT',
			dependents: [{ id: 'd', name: 'Con', fromMonth: 1, toMonth: 12, registeredOn: `${rb.taxYear}-01-15` }],
			claims: { medical: 20e6 },
			incomeSources: [
				{
					id: 'A',
					name: 'A',
					contractMonths: 12,
					claimsPersonalDeduction: true,
					payments: [{ date: `${rb.taxYear}-03-01`, gross: 100e6 }]
				}
			]
		};
		const r = assess(rb, c, { filing: 'SELF', includeCasual: true });
		expect(r.deductions).toBe(0);
		expect(r.annualTax).toBe(progressiveTax({ brackets: [{ upTo: null, rate: rb.nonResident.employmentRate.value }] }, 100e6, ROUND));
	});
});

describe.each(RULEBOOKS.map((rb) => [rb.id, rb] as const))('%s: I12 bảng quyết định', (_id, rb) => {
	it('mọi tổ hợp dữ kiện cho đúng một kết luận hợp lệ, tất định', () => {
		const cap = rb.settlement.casualIncomeMonthlyAverageCap.value;
		const deltas: (SettlementDelta | undefined)[] = [undefined, ...[1e6, 50_000, 0, -50_000, -1e6].map(
			(amount) => ({ amount, direction: amount > 0 ? 'PAY' : amount < 0 ? 'REFUND' : 'NONE', withinSmallThreshold: amount !== 0 && Math.abs(amount) <= 50_000, smallThreshold: 50_000 }) as const
		)];
		const valid: Verdict[] = ['NOT_IN_PROGRESSIVE_FLOW', 'MUST_SELF_SETTLE', 'MAY_AUTHORIZE', 'EXEMPT_SMALL_DELTA', 'MAY_SELF_SETTLE_FOR_REFUND', 'NOT_REQUIRED', 'NEEDS_DELTA'];
		const bools = [false, true];
		let n = 0;
		for (const residency of ['RESIDENT', 'NON_RESIDENT'] as const)
			for (const foreigner of bools)
				for (const firstYear of bools)
					for (const foreign of bools)
						for (const relief of bools)
							for (const claims of bools)
								for (const employed of bools)
									for (const insOnly of bools)
										for (const employers of [0, 1, 2])
											for (const casual of [0, cap, cap + 1])
											for (const postOnly of [0, 1])
												for (const delta of deltas) {
													const f: ObligationFacts = {
														residency,
														foreignerContractEnd: foreigner ? `${rb.taxYear}-06-30` : undefined,
														firstResidentYearBy12Months: firstYear,
														untaxedForeignIncome: foreign,
														wantsHardshipRelief: relief,
														hasSelfOnlyClaims: claims,
														employedAtSettlement: employed,
														onlyInsurancePayouts: insOnly,
														progressiveEmployers: employers,
														casualMonthlyAverage: casual,
														postTerminationOnlyEmployers: postOnly,
														postTerminationOnlyMonthlyAverage: postOnly ? 2_000_000 : 0
													};
													const r = decideObligation(rb, f, delta);
													expect(valid).toContain(r.verdict);
													expect(r.step).toBeGreaterThanOrEqual(0);
													expect(r.step).toBeLessThanOrEqual(8);
													expect(decideObligation(rb, f, delta)).toEqual(r);
													if (r.canAuthorize) expect(r.verdict).toBe('MAY_AUTHORIZE');
													if (r.verdict === 'NEEDS_DELTA') expect(delta).toBeUndefined();
													n++;
												}
		expect(n).toBe(2 * 2 ** 7 * 3 * 3 * 2 * 6);
	});
});

describe('chọn Rulebook', () => {
	it('kỳ không có Rulebook thì ném lỗi, không dùng luật mới nhất', () => {
		expect(() => selectRulebook(RULEBOOKS, 2024)).toThrow(UnsupportedPeriodError);
		expect(() => selectRulebook(RULEBOOKS, 2027)).toThrow(UnsupportedPeriodError);
		expect(selectRulebook(RULEBOOKS, 2026).id).toBe('vn-2026');
	});

	it('hồ sơ khác kỳ với Rulebook thì ném lỗi', () => {
		const c: TaxYearCase = { taxPeriod: 2025, residency: 'RESIDENT', incomeSources: [], dependents: [], claims: {} };
		expect(() => assess(selectRulebook(RULEBOOKS, 2026), c, { filing: 'SELF', includeCasual: true })).toThrow();
	});
});
