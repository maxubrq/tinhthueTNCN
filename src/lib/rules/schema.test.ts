/**
 * Test của schema chủ yếu chạy lúc biên dịch: mỗi `@ts-expect-error` là một lỗi khai
 * báo mà schema PHẢI chặn. Nếu schema lỏng ra, `npm run check` sẽ báo
 * "Unused '@ts-expect-error' directive". Phần runtime chỉ để vitest có assertion.
 *
 * Số trong fixture là số mẫu để kiểm kiểu, KHÔNG phải dữ liệu luật.
 */
import { describe, expect, it } from 'vitest';
import {
	defineRulebook,
	SCHEMA_VERSION,
	type DateParam,
	type PeriodParam,
	type ProgressiveSchedule,
	type Rulebook
} from './schema';

const ref = [{ source: 'law' }] as const;

function fixture() {
	return defineRulebook({
		id: 'test-2099',
		revision: 1,
		schemaVersion: SCHEMA_VERSION,
		taxYear: 2099,
		knownAsOf: '2099-01-01',
		changelog: [],
		sources: {
			law: { kind: 'LAW', number: '1/2099/QH', title: 'Luật mẫu' }
		},
		openIssues: {
			'oi-1': { researchNo: 1, question: 'Câu hỏi mẫu', policy: 'Cách xử lý mẫu' }
		},
		schedules: {
			monthly: {
				axis: 'TAX_PERIOD',
				value: { brackets: [{ upTo: 10, rate: 500 }, { upTo: null, rate: 1_000 }] },
				sourceRefs: ref,
				status: 'VERIFIED'
			},
			annual: {
				axis: 'TAX_PERIOD',
				value: { kind: 'MONTHLY_TIMES_12' },
				sourceRefs: ref,
				status: 'INFERRED',
				rationale: 'Thông lệ',
				openIssues: ['oi-1']
			}
		},
		rounding: {
			axis: 'TAX_PERIOD',
			value: {
				monthlyTax: { mode: 'HALF_UP', toMultipleOf: 1 },
				annualTax: { mode: 'HALF_UP', toMultipleOf: 1 }
			},
			sourceRefs: ref,
			status: 'PENDING',
			rationale: 'Chưa thấy văn bản'
		},
		employmentIncome: {
			mealAllowance: {
				axis: 'EVENT_DATE',
				segments: [
					{ from: '2099-01-01', to: '2099-06-30', value: { kind: 'EMPLOYER_POLICY' }, sourceRefs: ref, status: 'VERIFIED' },
					{ from: '2099-07-01', to: '2099-12-31', value: { kind: 'MONTHLY_CAP', monthlyCap: 1 }, sourceRefs: ref, status: 'VERIFIED' }
				]
			},
			housingInclusionCap: { axis: 'TAX_PERIOD', value: 1_500, sourceRefs: ref, status: 'VERIFIED' },
			overtime: { axis: 'TAX_PERIOD', value: 'FULL_WITHIN_LEGAL_LIMIT', sourceRefs: ref, status: 'VERIFIED' }
		},
		insurance: {
			employeeRates: {
				axis: 'EVENT_DATE',
				segments: [
					{ from: '2099-01-01', to: '2099-12-31', value: { social: 800, health: 150, unemployment: 100 }, sourceRefs: ref, status: 'VERIFIED' }
				]
			},
			socialHealthMonthlyCap: {
				axis: 'EVENT_DATE',
				segments: [{ from: '2099-01-01', to: '2099-12-31', value: 1, sourceRefs: ref, status: 'VERIFIED' }]
			},
			unemploymentMonthlyCap: {
				axis: 'EVENT_DATE',
				segments: [
					{ from: '2099-01-01', to: '2099-12-31', value: { I: 4, II: 3, III: 2, IV: 1 }, sourceRefs: ref, status: 'VERIFIED' }
				]
			}
		},
		deductions: {
			taxpayerMonthly: { axis: 'TAX_PERIOD', value: 1, sourceRefs: ref, status: 'VERIFIED' },
			dependentMonthly: { axis: 'TAX_PERIOD', value: 1, sourceRefs: ref, status: 'VERIFIED' },
			taxpayerMonths: { axis: 'TAX_PERIOD', value: 'FULL_YEAR', sourceRefs: ref, status: 'VERIFIED' },
			dependentIncomeMonthlyLimit: { axis: 'TAX_PERIOD', value: 1, sourceRefs: ref, status: 'VERIFIED' },
			dependentRegistrationDeadline: { axis: 'TAX_PERIOD', value: '2099-12-31', sourceRefs: ref, status: 'VERIFIED' },
			voluntaryPension: {
				axis: 'TAX_PERIOD',
				value: { monthlyCap: 1, covers: ['VOLUNTARY_PENSION', 'LIFE_INSURANCE'] },
				sourceRefs: ref,
				status: 'VERIFIED'
			},
			medical: { axis: 'TAX_PERIOD', value: { annualCap: 1, selfSettlementOnly: true }, sourceRefs: ref, status: 'VERIFIED' },
			education: { axis: 'TAX_PERIOD', value: null, sourceRefs: ref, status: 'VERIFIED' },
			charity: { axis: 'TAX_PERIOD', value: { annualCap: null, selfSettlementOnly: true }, sourceRefs: ref, status: 'VERIFIED' }
		},
		withholding: {
			progressiveMinContractMonths: { axis: 'TAX_PERIOD', value: 3, sourceRefs: ref, status: 'VERIFIED' },
			flatRate: {
				axis: 'EVENT_DATE',
				segments: [{ from: '2099-01-01', to: '2099-12-31', value: 1_000, sourceRefs: ref, status: 'VERIFIED' }]
			},
			flatRateMinPayment: {
				axis: 'EVENT_DATE',
				segments: [{ from: '2099-01-01', to: '2099-12-31', value: 1, sourceRefs: ref, status: 'VERIFIED' }]
			}
		},
		nonResident: {
			employmentRate: { axis: 'TAX_PERIOD', value: 2_000, sourceRefs: ref, status: 'VERIFIED' }
		},
		settlement: {
			smallDeltaThreshold: { axis: 'TAX_PERIOD', value: 1, sourceRefs: ref, status: 'VERIFIED' },
			casualIncomeMonthlyAverageCap: { axis: 'TAX_PERIOD', value: 1, sourceRefs: ref, status: 'VERIFIED' },
			individualDeadline: {
				axis: 'TAX_PERIOD',
				value: { rule: 'Mẫu', date: null },
				sourceRefs: ref,
				status: 'PENDING',
				rationale: 'Chưa công bố'
			},
			organizationDeadline: {
				axis: 'TAX_PERIOD',
				value: { rule: 'Mẫu', date: '2100-03-31' },
				sourceRefs: ref,
				status: 'VERIFIED'
			},
			foreignerExitDeadlineDays: { axis: 'TAX_PERIOD', value: 45, sourceRefs: ref, status: 'VERIFIED' },
			insurancePayoutOnlyExempt: { axis: 'TAX_PERIOD', value: true, sourceRefs: ref, status: 'VERIFIED' },
			postTerminationPaymentCountsAsEmployer: { axis: 'TAX_PERIOD', value: true, sourceRefs: ref, status: 'VERIFIED' }
		},
		withholdingPractices: []
	});
}

type S = 'law';
type O = 'oi-1';

describe('schema Rulebook', () => {
	it('fixture đầy đủ thì biên dịch được', () => {
		const rb: Rulebook = fixture();
		expect(rb.schemaVersion).toBe(SCHEMA_VERSION);
	});

	it('INFERRED và PENDING bắt buộc có rationale', () => {
		// @ts-expect-error thiếu rationale
		const bad: PeriodParam<number, S, O> = { axis: 'TAX_PERIOD', value: 1, sourceRefs: ref, status: 'INFERRED' };
		const ok: PeriodParam<number, S, O> = { axis: 'TAX_PERIOD', value: 1, sourceRefs: ref, status: 'VERIFIED' };
		expect([bad, ok]).toHaveLength(2);
	});

	it('mọi giá trị phải có ít nhất một nguồn', () => {
		// @ts-expect-error sourceRefs rỗng
		const bad: PeriodParam<number, S, O> = { axis: 'TAX_PERIOD', value: 1, sourceRefs: [], status: 'VERIFIED' };
		expect(bad).toBeDefined();
	});

	it('trục hiệu lực cố định theo tham số, không tra nhầm được', () => {
		// @ts-expect-error tham số theo ngày không nhận dạng theo kỳ
		const bad: DateParam<number, S, O> = { axis: 'TAX_PERIOD', value: 1, sourceRefs: ref, status: 'VERIFIED' };
		// @ts-expect-error tham số theo ngày phải có ít nhất một đoạn
		const empty: DateParam<number, S, O> = { axis: 'EVENT_DATE', segments: [] };
		expect([bad, empty]).toHaveLength(2);
	});

	it('biểu lũy tiến: bậc cuối không có cận trên, bậc giữa phải có', () => {
		// @ts-expect-error bậc cuối phải là upTo: null
		const noTop: ProgressiveSchedule = { brackets: [{ upTo: 10, rate: 500 }] };
		// @ts-expect-error bậc giữa không được để trống cận trên
		const openMiddle: ProgressiveSchedule = { brackets: [{ upTo: null, rate: 500 }, { upTo: null, rate: 1_000 }] };
		const ok: ProgressiveSchedule = { brackets: [{ upTo: null, rate: 500 }] };
		expect([noTop, openMiddle, ok]).toHaveLength(3);
	});

	it('trỏ tới nguồn hoặc điểm mở chưa khai là lỗi biên dịch', () => {
		const base = fixture();
		const badSource = () =>
			defineRulebook({
				...base,
				nonResident: {
					// @ts-expect-error nguồn 'nd999' chưa khai trong sources
					employmentRate: { axis: 'TAX_PERIOD', value: 2_000, sourceRefs: [{ source: 'nd999' }], status: 'VERIFIED' }
				}
			});
		const badIssue = () =>
			defineRulebook({
				...base,
				nonResident: {
					employmentRate: {
						axis: 'TAX_PERIOD',
						value: 2_000,
						sourceRefs: ref,
						status: 'VERIFIED',
						// @ts-expect-error điểm mở 'oi-99' chưa khai trong openIssues
						openIssues: ['oi-99']
					}
				}
			});
		expect([badSource, badIssue]).toHaveLength(2);
	});
});
