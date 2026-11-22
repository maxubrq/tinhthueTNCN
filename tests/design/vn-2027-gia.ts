/**
 * Rulebook GIẢ cho kỳ 2027: phép thử thiết kế (CLAUDE.md, bước 5). KHÔNG phải luật.
 * Không đưa vào src/lib/rules và RULEBOOKS.
 *
 * Mục tiêu: chứng minh thêm một năm luật chỉ cần thêm dữ liệu, không sửa dòng nào trong
 * core. So với 2026, file này đổi:
 *  1. Biểu tháng sang 4 bậc giả: ≤ 20 tr 5%; 20–50 tr 15%; 50–120 tr 25%; > 120 tr 35%.
 *  2. Ngưỡng khấu trừ 10% đổi GIỮA NĂM: 5 triệu đến 30/6/2027, 8 triệu từ 01/7/2027.
 *  3. Giảm trừ bản thân giả 17 triệu/tháng.
 */
import { defineRulebook, SCHEMA_VERSION } from '../../src/lib/rules/schema';
import { vn2026 } from '../../src/lib/rules/vn-2026';

const fake = [{ source: 'research' as const, locator: 'Số giả cho phép thử thiết kế' }] as const;

export const vn2027Gia = defineRulebook({
	...vn2026,
	id: 'vn-2027-gia',
	taxYear: 2027,
	knownAsOf: '2027-01-01',
	changelog: [{ revision: 1, date: '2027-01-01', reason: 'Rulebook giả cho phép thử thiết kế.' }],
	openIssues: vn2026.openIssues,
	sources: vn2026.sources,

	schedules: {
		...vn2026.schedules,
		monthly: {
			axis: 'TAX_PERIOD',
			value: {
				brackets: [
					{ upTo: 20_000_000, rate: 500 },
					{ upTo: 50_000_000, rate: 1_500 },
					{ upTo: 120_000_000, rate: 2_500 },
					{ upTo: null, rate: 3_500 }
				]
			},
			sourceRefs: fake,
			status: 'VERIFIED'
		}
	},

	employmentIncome: {
		...vn2026.employmentIncome,
		mealAllowance: {
			axis: 'EVENT_DATE',
			segments: [{ from: '2027-01-01', to: '2027-12-31', value: { kind: 'MONTHLY_CAP', monthlyCap: 1_200_000 }, sourceRefs: fake, status: 'VERIFIED' }]
		}
	},

	insurance: {
		employeeRates: {
			axis: 'EVENT_DATE',
			segments: [{ from: '2027-01-01', to: '2027-12-31', value: { social: 800, health: 150, unemployment: 100 }, sourceRefs: fake, status: 'VERIFIED' }]
		},
		socialHealthMonthlyCap: {
			axis: 'EVENT_DATE',
			segments: [{ from: '2027-01-01', to: '2027-12-31', value: 50_600_000, sourceRefs: fake, status: 'VERIFIED' }]
		},
		unemploymentMonthlyCap: {
			axis: 'EVENT_DATE',
			segments: [
				{ from: '2027-01-01', to: '2027-12-31', value: { I: 106_200_000, II: 94_600_000, III: 82_800_000, IV: 74_000_000 }, sourceRefs: fake, status: 'VERIFIED' }
			]
		}
	},

	deductions: {
		...vn2026.deductions,
		taxpayerMonthly: { axis: 'TAX_PERIOD', value: 17_000_000, sourceRefs: fake, status: 'VERIFIED' },
		dependentRegistrationDeadline: { axis: 'TAX_PERIOD', value: '2027-12-31', sourceRefs: fake, status: 'VERIFIED' }
	},

	withholding: {
		...vn2026.withholding,
		flatRate: {
			axis: 'EVENT_DATE',
			segments: [{ from: '2027-01-01', to: '2027-12-31', value: 1_000, sourceRefs: fake, status: 'VERIFIED' }]
		},
		flatRateMinPayment: {
			axis: 'EVENT_DATE',
			segments: [
				{ from: '2027-01-01', to: '2027-06-30', value: 5_000_000, sourceRefs: fake, status: 'VERIFIED' },
				{ from: '2027-07-01', to: '2027-12-31', value: 8_000_000, sourceRefs: fake, status: 'VERIFIED' }
			]
		}
	},

	settlement: {
		...vn2026.settlement,
		organizationDeadline: { axis: 'TAX_PERIOD', value: { rule: 'Giả.', date: '2028-03-31' }, sourceRefs: fake, status: 'VERIFIED' }
	},

	withholdingPractices: []
});
