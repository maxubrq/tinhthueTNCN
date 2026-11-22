/**
 * Rulebook kỳ tính thuế 2026. Nguồn số liệu: docs/research/thue-tncn-2026.md.
 *
 * Quy ước trạng thái:
 *  - VERIFIED: nghiên cứu nêu như sự kiện, có văn bản.
 *  - INFERRED: nghiên cứu ghi "suy luận", "suy ra", hoặc là thông lệ cũ chưa có văn bản 2026.
 *  - PENDING: nghiên cứu chưa có số; giá trị tạm, phải đối chiếu văn bản trước khi tin.
 *
 * Luật 109/2025 và NĐ 253/2026 hiệu lực 01/7/2026 nhưng áp cho cả kỳ 2026 (biểu thuế,
 * giảm trừ gia cảnh: trục TAX_PERIOD). Các ngưỡng đổi giữa năm theo ngày chi trả nằm ở
 * trục EVENT_DATE.
 */
import { defineRulebook, SCHEMA_VERSION } from './schema';
import { OPEN_ISSUES } from './open-issues';

const R = 'research' as const;
const ref = (source: 'research' | 'luat-109-2025' | 'nq-110-2025' | 'nd-253-2026' | 'tt-87-2026' | 'nd-252-2026' | 'nd-161-2026' | 'nd-293-2025', locator?: string) =>
	locator ? { source, locator } : { source };

export const vn2026 = defineRulebook({
	id: 'vn-2026',
	revision: 1,
	schemaVersion: SCHEMA_VERSION,
	taxYear: 2026,
	knownAsOf: '2026-11-21',
	changelog: [{ revision: 1, date: '2026-11-22', reason: 'Bản đầu, từ nghiên cứu ngày 21/11/2026.' }],

	sources: {
		research: {
			kind: 'RESEARCH',
			number: 'docs/research/thue-tncn-2026.md',
			title: 'Năm 2026 đổi luật thuế TNCN, nhiều người sẽ được hoàn (nghiên cứu 21/11/2026)'
		},
		'luat-109-2025': {
			kind: 'LAW',
			number: '109/2025/QH15',
			title: 'Luật Thuế thu nhập cá nhân',
			effectiveFrom: '2026-07-01'
		},
		'nq-110-2025': {
			kind: 'RESOLUTION',
			number: '110/2025/UBTVQH15',
			title: 'Nghị quyết về mức giảm trừ gia cảnh',
			effectiveFrom: '2026-01-01'
		},
		'nd-253-2026': {
			kind: 'DECREE',
			number: '253/2026/NĐ-CP',
			title: 'Nghị định quy định chi tiết Luật Thuế TNCN (thay NĐ 65/2013)',
			issuedOn: '2026-06-30',
			effectiveFrom: '2026-07-01'
		},
		'tt-87-2026': {
			kind: 'CIRCULAR',
			number: '87/2026/TT-BTC',
			title: 'Thông tư hướng dẫn thuế TNCN (thay TT 111/2013)',
			issuedOn: '2026-06-30',
			effectiveFrom: '2026-07-01'
		},
		'nd-252-2026': {
			kind: 'DECREE',
			number: '252/2026/NĐ-CP',
			title: 'Nghị định hướng dẫn Luật Quản lý thuế 108/2025 (thay NĐ 126/2020)',
			issuedOn: '2026-06-30',
			effectiveFrom: '2026-07-01'
		},
		'nd-161-2026': { kind: 'DECREE', number: '161/2026/NĐ-CP', title: 'Nghị định về mức tham chiếu (trần BHXH, BHYT)' },
		'nd-293-2025': { kind: 'DECREE', number: '293/2025/NĐ-CP', title: 'Nghị định về lương tối thiểu vùng' }
	},
	openIssues: OPEN_ISSUES,

	schedules: {
		monthly: {
			axis: 'TAX_PERIOD',
			value: {
				brackets: [
					{ upTo: 10_000_000, rate: 500 },
					{ upTo: 30_000_000, rate: 1_000 },
					{ upTo: 60_000_000, rate: 2_000 },
					{ upTo: 100_000_000, rate: 3_000 },
					{ upTo: null, rate: 3_500 }
				]
			},
			sourceRefs: [ref('luat-109-2025'), ref(R, 'Bảng tham số; Công thức lõi')],
			status: 'VERIFIED',
			note: 'Áp hồi tố cả kỳ 2026.'
		},
		annual: {
			axis: 'TAX_PERIOD',
			value: { kind: 'MONTHLY_TIMES_12' },
			sourceRefs: [ref(R, 'Công thức lõi: Biểu năm 2026')],
			status: 'INFERRED',
			rationale: 'Lấy biểu năm bằng biểu tháng nhân 12 là cách làm của các năm trước; văn bản năm 2026 chưa xác nhận.',
			openIssues: ['oi-6']
		}
	},

	rounding: {
		axis: 'TAX_PERIOD',
		value: {
			monthlyTax: { mode: 'HALF_UP', toMultipleOf: 1 },
			annualTax: { mode: 'HALF_UP', toMultipleOf: 1 }
		},
		sourceRefs: [ref(R)],
		status: 'INFERRED',
		rationale: 'Chưa thấy văn bản quy định cách làm tròn số thuế. App tạm làm tròn tới đồng, lệch tối đa 1 đồng.'
	},

	employmentIncome: {
		mealAllowance: {
			axis: 'EVENT_DATE',
			segments: [
				{
					from: '2026-01-01',
					to: '2026-06-30',
					value: { kind: 'EMPLOYER_POLICY' },
					sourceRefs: [ref(R, 'Nửa đầu năm 2026 là giai đoạn lai')],
					status: 'VERIFIED',
					openIssues: ['oi-12']
				},
				{
					from: '2026-07-01',
					to: '2026-12-31',
					value: { kind: 'MONTHLY_CAP', monthlyCap: 1_200_000 },
					sourceRefs: [ref('tt-87-2026'), ref(R, 'Trần và mức miễn cần mã hóa')],
					status: 'VERIFIED'
				}
			]
		},
		housingInclusionCap: {
			axis: 'TAX_PERIOD',
			value: 1_500,
			sourceRefs: [ref(R, 'Trần và mức miễn cần mã hóa')],
			status: 'VERIFIED'
		},
		overtime: {
			axis: 'TAX_PERIOD',
			value: 'FULL_WITHIN_LEGAL_LIMIT',
			sourceRefs: [ref('luat-109-2025'), ref(R, 'Bảng tham số')],
			status: 'VERIFIED'
		}
	},

	insurance: {
		employeeRates: {
			axis: 'EVENT_DATE',
			segments: [
				{
					from: '2026-01-01',
					to: '2026-12-31',
					value: { social: 800, health: 150, unemployment: 100 },
					sourceRefs: [ref(R, 'Bảo hiểm bắt buộc phần người lao động: 10,5%')],
					status: 'VERIFIED'
				}
			]
		},
		socialHealthMonthlyCap: {
			axis: 'EVENT_DATE',
			segments: [
				{
					from: '2026-01-01',
					to: '2026-06-30',
					value: 46_800_000,
					sourceRefs: [ref('nd-161-2026'), ref(R)],
					status: 'VERIFIED'
				},
				{
					from: '2026-07-01',
					to: '2026-12-31',
					value: 50_600_000,
					sourceRefs: [ref('nd-161-2026'), ref(R)],
					status: 'VERIFIED'
				}
			]
		},
		unemploymentMonthlyCap: {
			axis: 'EVENT_DATE',
			segments: [
				{
					from: '2026-01-01',
					to: '2026-12-31',
					value: { I: 106_200_000, II: 94_600_000, III: 82_800_000, IV: 74_000_000 },
					sourceRefs: [ref('nd-293-2025'), ref(R, 'Trần BHTN')],
					status: 'PENDING',
					rationale:
						'Trần bằng 20 lần lương tối thiểu vùng. Mức vùng I (106,2 triệu đồng) là số suy ra; mức vùng II đến IV (theo lương tối thiểu 4,73; 4,14; 3,70 triệu đồng) chưa được đối chiếu với Nghị định 293/2025.',
					openIssues: ['oi-14']
				}
			]
		}
	},

	deductions: {
		taxpayerMonthly: {
			axis: 'TAX_PERIOD',
			value: 15_500_000,
			sourceRefs: [ref('nq-110-2025'), ref(R, 'Bảng tham số')],
			status: 'VERIFIED'
		},
		dependentMonthly: {
			axis: 'TAX_PERIOD',
			value: 6_200_000,
			sourceRefs: [ref('nq-110-2025'), ref(R, 'Bảng tham số')],
			status: 'VERIFIED'
		},
		taxpayerMonths: {
			axis: 'TAX_PERIOD',
			value: 'FULL_YEAR',
			sourceRefs: [ref(R, 'Câu hỏi (2), ghi chú')],
			status: 'INFERRED',
			rationale: 'Người làm không đủ năm được giả định vẫn được giảm trừ bản thân đủ 12 tháng (186 triệu đồng). Văn bản chưa nói rõ điểm này.',
			openIssues: ['oi-15']
		},
		dependentIncomeMonthlyLimit: {
			axis: 'TAX_PERIOD',
			value: 3_000_000,
			sourceRefs: [ref('tt-87-2026'), ref(R, 'Người phụ thuộc')],
			status: 'INFERRED',
			rationale: 'Thông tư 87/2026 đặt mức 3 triệu đồng từ 1/7/2026. Chưa rõ nửa đầu năm áp mức nào; app áp mức này cho cả năm.',
			openIssues: ['oi-2']
		},
		dependentRegistrationDeadline: {
			axis: 'TAX_PERIOD',
			value: '2026-12-31',
			sourceRefs: [ref(R, 'Người phụ thuộc: hạn đăng ký')],
			status: 'VERIFIED',
			openIssues: ['oi-7']
		},
		voluntaryPension: {
			axis: 'TAX_PERIOD',
			value: { monthlyCap: 3_000_000, covers: ['VOLUNTARY_PENSION', 'LIFE_INSURANCE'] },
			sourceRefs: [ref('luat-109-2025'), ref(R, 'Bảng tham số')],
			status: 'VERIFIED'
		},
		medical: {
			axis: 'TAX_PERIOD',
			value: { annualCap: 23_000_000, selfSettlementOnly: true },
			sourceRefs: [ref('luat-109-2025'), ref(R, 'Bảng tham số')],
			status: 'INFERRED',
			rationale: 'Chưa rõ khoản này được trừ cho cả năm 2026 hay chỉ từ 1/7/2026; app tính cho cả năm.',
			openIssues: ['oi-8']
		},
		education: {
			axis: 'TAX_PERIOD',
			value: { annualCap: 24_000_000, selfSettlementOnly: true },
			sourceRefs: [ref('luat-109-2025'), ref(R, 'Bảng tham số')],
			status: 'INFERRED',
			rationale: 'Chưa rõ khoản này được trừ cho cả năm 2026 hay chỉ từ 1/7/2026; app tính cho cả năm.',
			openIssues: ['oi-8']
		},
		charity: {
			axis: 'TAX_PERIOD',
			value: { annualCap: null, selfSettlementOnly: true },
			sourceRefs: [ref(R, 'Câu hỏi (3): Từ thiện')],
			status: 'INFERRED',
			rationale: 'Văn bản chưa đặt mức trừ tối đa; app trừ đủ số bạn nhập.',
			openIssues: ['oi-9']
		}
	},

	withholding: {
		progressiveMinContractMonths: {
			axis: 'TAX_PERIOD',
			value: 3,
			sourceRefs: [ref('nd-253-2026', 'Điều 50.1'), ref(R, 'Doanh nghiệp khấu trừ thế nào')],
			status: 'VERIFIED'
		},
		flatRate: {
			axis: 'EVENT_DATE',
			segments: [
				{
					from: '2026-01-01',
					to: '2026-12-31',
					value: 1_000,
					sourceRefs: [ref(R, 'Doanh nghiệp khấu trừ thế nào')],
					status: 'VERIFIED'
				}
			]
		},
		flatRateMinPayment: {
			axis: 'EVENT_DATE',
			segments: [
				{
					from: '2026-01-01',
					to: '2026-06-30',
					value: 2_000_000,
					sourceRefs: [ref(R, 'Doanh nghiệp khấu trừ thế nào')],
					status: 'VERIFIED'
				},
				{
					from: '2026-07-01',
					to: '2026-12-31',
					value: 5_000_000,
					sourceRefs: [ref('nd-253-2026'), ref(R, 'Bảng tham số')],
					status: 'VERIFIED'
				}
			]
		}
	},

	nonResident: {
		employmentRate: {
			axis: 'TAX_PERIOD',
			value: 2_000,
			sourceRefs: [ref('nd-253-2026', 'Điều 4'), ref(R, 'Nghĩa vụ theo tình trạng cư trú')],
			status: 'VERIFIED'
		}
	},

	settlement: {
		smallDeltaThreshold: {
			axis: 'TAX_PERIOD',
			value: 50_000,
			sourceRefs: [ref('nd-252-2026'), ref(R, 'Câu hỏi (1), bước 7')],
			status: 'VERIFIED',
			openIssues: ['oi-3']
		},
		casualIncomeMonthlyAverageCap: {
			axis: 'TAX_PERIOD',
			value: 15_000_000,
			sourceRefs: [ref(R, 'Bảng tham số; Câu hỏi (1), bước 6')],
			status: 'VERIFIED',
			openIssues: ['oi-16']
		},
		individualDeadline: {
			axis: 'TAX_PERIOD',
			value: { rule: 'Ngày cuối tháng thứ 4 sau khi kết thúc năm; trùng ngày nghỉ thì lùi sang ngày làm việc kế tiếp.', date: null },
			sourceRefs: [ref('nd-252-2026'), ref(R, 'Hạn nộp')],
			status: 'PENDING',
			rationale: 'Ngày 30/4/2027 là ngày lễ nên hạn lùi sang ngày làm việc kế tiếp; Cục Thuế chưa công bố ngày cụ thể.',
			openIssues: ['oi-13']
		},
		organizationDeadline: {
			axis: 'TAX_PERIOD',
			value: { rule: 'Ngày cuối tháng thứ 3 sau khi kết thúc năm.', date: '2027-03-31' },
			sourceRefs: [ref('nd-252-2026'), ref(R, 'Hạn nộp')],
			status: 'VERIFIED'
		},
		foreignerExitDeadlineDays: {
			axis: 'TAX_PERIOD',
			value: 45,
			sourceRefs: [ref('nd-252-2026', 'Điều 10.5d'), ref(R, 'Câu hỏi (1), bước 1')],
			status: 'VERIFIED'
		},
		insurancePayoutOnlyExempt: {
			axis: 'TAX_PERIOD',
			value: true,
			sourceRefs: [ref(R, 'Câu hỏi (1), bước 8')],
			status: 'INFERRED',
			rationale: 'Quy định này có cho năm 2025; chưa thấy văn bản năm 2026 xác nhận.'
		},
		postTerminationPaymentCountsAsEmployer: {
			axis: 'TAX_PERIOD',
			value: true,
			sourceRefs: [ref(R, 'Điểm mở 18')],
			status: 'INFERRED',
			rationale:
				'Chưa rõ khoản công ty cũ trả sau khi bạn nghỉ việc có làm công ty đó thành một nơi trả lương khi xét ủy quyền không. App tính là có, để bạn không bị truy thu nếu cách hiểu này đúng.',
			openIssues: ['oi-18']
		}
	},

	withholdingPractices: [
		{
			id: 'vn-2026-h1-bieu-7-bac',
			label: 'tháng 1 đến tháng 6/2026, công ty khấu trừ theo biểu 7 bậc cũ, với mức giảm trừ mới 15,5 triệu đồng cho bản thân và 6,2 triệu đồng cho mỗi người phụ thuộc',
			from: '2026-01-01',
			to: '2026-06-30',
			monthlySchedule: {
				brackets: [
					{ upTo: 5_000_000, rate: 500 },
					{ upTo: 10_000_000, rate: 1_000 },
					{ upTo: 18_000_000, rate: 1_500 },
					{ upTo: 32_000_000, rate: 2_000 },
					{ upTo: 52_000_000, rate: 2_500 },
					{ upTo: 80_000_000, rate: 3_000 },
					{ upTo: null, rate: 3_500 }
				]
			},
			taxpayerMonthly: 15_500_000,
			dependentMonthly: 6_200_000,
			sourceRefs: [ref('nd-253-2026', 'Điều 70.2'), ref(R, 'Nửa đầu năm 2026 là giai đoạn lai')],
			status: 'INFERRED',
			rationale: 'Luật mới áp cho cả năm, nhưng nhiều công ty có lẽ vẫn khấu trừ tháng 1 đến tháng 6 theo biểu cũ và không tính lại. Nếu công ty đã tính lại, hoặc biết số thật, kết quả sẽ khác: hãy nhập số thật vào ô Thuế đã khấu trừ.',
			openIssues: ['oi-5']
		}
	]
});
