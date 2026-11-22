/**
 * Rulebook kỳ tính thuế 2025 (quyết toán nộp trong năm 2026). Nguồn số liệu:
 * docs/research/thue-tncn-2026.md, cột "Năm thuế 2025".
 *
 * Quy ước trạng thái giống vn-2026.ts. Lưu ý: nghiên cứu tập trung vào 2026, nên một số
 * tham số 2025 chỉ được nêu ở dạng chung (không gắn năm) hoặc không được nêu. Những
 * tham số đó là INFERRED hoặc PENDING kèm lý do, và sẽ hiện cờ trên kết quả.
 */
import { defineRulebook, SCHEMA_VERSION } from './schema';
import { pickOpenIssues } from './open-issues';

const R = 'research' as const;
type Src = 'research' | 'luat-tncn-2007' | 'tt-111-2013' | 'nd-126-2020' | 'cv-1296-2026';
const ref = (source: Src, locator?: string) => (locator ? { source, locator } : { source });

const SAME_RULE_2026 =
	'Nghiên cứu nêu quy tắc này ở dạng chung, không gắn năm; suy ra áp cho cả kỳ 2025.';

export const vn2025 = defineRulebook({
	id: 'vn-2025',
	revision: 1,
	schemaVersion: SCHEMA_VERSION,
	taxYear: 2025,
	knownAsOf: '2026-11-21',
	changelog: [{ revision: 1, date: '2026-11-22', reason: 'Bản đầu, từ nghiên cứu ngày 21/11/2026.' }],

	sources: {
		research: {
			kind: 'RESEARCH',
			number: 'docs/research/thue-tncn-2026.md',
			title: 'Năm 2026 đổi luật thuế TNCN, nhiều người sẽ được hoàn (nghiên cứu 21/11/2026)'
		},
		'luat-tncn-2007': {
			kind: 'LAW',
			number: '04/2007/QH12',
			title: 'Luật Thuế thu nhập cá nhân (sửa đổi bởi Luật 26/2012/QH13)'
		},
		'tt-111-2013': { kind: 'CIRCULAR', number: '111/2013/TT-BTC', title: 'Thông tư hướng dẫn thuế TNCN' },
		'nd-126-2020': { kind: 'DECREE', number: '126/2020/NĐ-CP', title: 'Nghị định hướng dẫn Luật Quản lý thuế' },
		'cv-1296-2026': {
			kind: 'OFFICIAL_LETTER',
			number: '1296/CT-NVT',
			title: 'Công văn hướng dẫn quyết toán thuế TNCN năm 2025',
			issuedOn: '2026-03-04'
		}
	},
	openIssues: pickOpenIssues('oi-9', 'oi-10', 'oi-12', 'oi-14', 'oi-15'),

	schedules: {
		monthly: {
			axis: 'TAX_PERIOD',
			value: {
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
			sourceRefs: [ref('luat-tncn-2007', 'Điều 22'), ref('tt-111-2013', 'Điều 7'), ref(R, 'Bảng tham số')],
			status: 'VERIFIED'
		},
		annual: {
			axis: 'TAX_PERIOD',
			value: { kind: 'MONTHLY_TIMES_12' },
			sourceRefs: [ref('tt-111-2013', 'Điều 7'), ref(R, 'Biểu 7 bậc năm 2025: ranh giới năm 60 / 120 / … / 960 triệu')],
			status: 'VERIFIED'
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
		rationale: 'Nghiên cứu chưa nêu quy tắc làm tròn số thuế; tạm làm tròn tới đồng, lệch tối đa 1 đ.'
	},

	employmentIncome: {
		mealAllowance: {
			axis: 'EVENT_DATE',
			segments: [
				{
					from: '2025-01-01',
					to: '2025-12-31',
					value: { kind: 'EMPLOYER_POLICY' },
					sourceRefs: [ref('tt-111-2013'), ref(R, 'Điểm mở 12')],
					status: 'INFERRED',
					rationale: 'Trần 1,2 triệu chỉ áp từ 01/7/2026; trước đó theo quy chế đơn vị (điểm mở 12).',
					openIssues: ['oi-12']
				}
			]
		},
		housingInclusionCap: {
			axis: 'TAX_PERIOD',
			value: 1_500,
			sourceRefs: [ref('tt-111-2013'), ref(R, 'Trần và mức miễn cần mã hóa')],
			status: 'INFERRED',
			rationale: SAME_RULE_2026
		},
		overtime: {
			axis: 'TAX_PERIOD',
			value: 'PREMIUM_ONLY',
			sourceRefs: [ref('tt-111-2013'), ref(R, 'Bảng tham số')],
			status: 'VERIFIED'
		}
	},

	insurance: {
		employeeRates: {
			axis: 'EVENT_DATE',
			segments: [
				{
					from: '2025-01-01',
					to: '2025-12-31',
					value: { social: 800, health: 150, unemployment: 100 },
					sourceRefs: [ref(R, 'Bảo hiểm bắt buộc phần người lao động: 10,5%')],
					status: 'INFERRED',
					rationale: 'Nghiên cứu nêu 10,5% trong phần năm 2026; tỷ lệ không đổi so với 2025.'
				}
			]
		},
		socialHealthMonthlyCap: {
			axis: 'EVENT_DATE',
			segments: [
				{
					from: '2025-01-01',
					to: '2025-12-31',
					value: 46_800_000,
					sourceRefs: [ref(R, 'Trần BHXH và BHYT')],
					status: 'INFERRED',
					rationale: 'Trần T1–T6/2026 là 46,8 triệu = 20 × 2,34 triệu; mức 2,34 triệu áp từ 01/7/2024, suy ra cho cả năm 2025.'
				}
			]
		},
		unemploymentMonthlyCap: {
			axis: 'EVENT_DATE',
			segments: [
				{
					from: '2025-01-01',
					to: '2025-12-31',
					value: { I: 99_200_000, II: 88_200_000, III: 77_200_000, IV: 69_000_000 },
					sourceRefs: [ref(R, 'Trần BHTN')],
					status: 'PENDING',
					rationale: '20 × lương tối thiểu vùng 2025 (4,96 / 4,41 / 3,86 / 3,45 triệu). Ngoài nghiên cứu; cần đối chiếu NĐ 74/2024.',
					openIssues: ['oi-14']
				}
			]
		}
	},

	deductions: {
		taxpayerMonthly: {
			axis: 'TAX_PERIOD',
			value: 11_000_000,
			sourceRefs: [ref(R, 'Bảng tham số')],
			status: 'VERIFIED'
		},
		dependentMonthly: {
			axis: 'TAX_PERIOD',
			value: 4_400_000,
			sourceRefs: [ref(R, 'Bảng tham số')],
			status: 'VERIFIED'
		},
		taxpayerMonths: {
			axis: 'TAX_PERIOD',
			value: 'FULL_YEAR',
			sourceRefs: [ref('tt-111-2013', 'Điều 9'), ref(R, 'Điểm mở 15')],
			status: 'INFERRED',
			rationale: 'Nghiên cứu chỉ nêu cho 2026 (suy luận); giả định cùng cách tính cho 2025.',
			openIssues: ['oi-15']
		},
		dependentIncomeMonthlyLimit: {
			axis: 'TAX_PERIOD',
			value: 1_000_000,
			sourceRefs: [ref('tt-111-2013', 'Điều 9')],
			status: 'PENDING',
			rationale: 'Ngoài nghiên cứu. Mức 1 triệu/tháng theo TT 111/2013; cần đối chiếu.'
		},
		dependentRegistrationDeadline: {
			axis: 'TAX_PERIOD',
			value: '2025-12-31',
			sourceRefs: [ref(R, 'Người phụ thuộc: hạn đăng ký')],
			status: 'INFERRED',
			rationale: SAME_RULE_2026
		},
		voluntaryPension: {
			axis: 'TAX_PERIOD',
			value: { monthlyCap: 1_000_000, covers: ['VOLUNTARY_PENSION'] },
			sourceRefs: [ref('tt-111-2013'), ref(R, 'Bảng tham số')],
			status: 'VERIFIED'
		},
		medical: {
			axis: 'TAX_PERIOD',
			value: null,
			sourceRefs: [ref(R, 'Bảng tham số: Giảm trừ y tế, giáo dục 2025 không có')],
			status: 'VERIFIED'
		},
		education: {
			axis: 'TAX_PERIOD',
			value: null,
			sourceRefs: [ref(R, 'Bảng tham số: Giảm trừ y tế, giáo dục 2025 không có')],
			status: 'VERIFIED'
		},
		charity: {
			axis: 'TAX_PERIOD',
			value: { annualCap: null, selfSettlementOnly: true },
			sourceRefs: [ref('tt-111-2013', 'Điều 9.2')],
			status: 'PENDING',
			rationale: 'Ngoài nghiên cứu. TT 111/2013 có giảm trừ từ thiện, nhân đạo, khuyến học; cần đối chiếu điều kiện.',
			openIssues: ['oi-9']
		}
	},

	withholding: {
		progressiveMinContractMonths: {
			axis: 'TAX_PERIOD',
			value: 3,
			sourceRefs: [ref('tt-111-2013', 'Điều 25'), ref(R, 'Doanh nghiệp khấu trừ thế nào')],
			status: 'INFERRED',
			rationale: SAME_RULE_2026
		},
		flatRate: {
			axis: 'EVENT_DATE',
			segments: [
				{
					from: '2025-01-01',
					to: '2025-12-31',
					value: 1_000,
					sourceRefs: [ref('tt-111-2013', 'Điều 25'), ref(R, 'Bảng tham số')],
					status: 'VERIFIED'
				}
			]
		},
		flatRateMinPayment: {
			axis: 'EVENT_DATE',
			segments: [
				{
					from: '2025-01-01',
					to: '2025-12-31',
					value: 2_000_000,
					sourceRefs: [ref('tt-111-2013', 'Điều 25'), ref(R, 'Bảng tham số')],
					status: 'VERIFIED'
				}
			]
		}
	},

	nonResident: {
		employmentRate: {
			axis: 'TAX_PERIOD',
			value: 2_000,
			sourceRefs: [ref('luat-tncn-2007'), ref(R, 'Nghĩa vụ theo tình trạng cư trú')],
			status: 'INFERRED',
			rationale: SAME_RULE_2026
		}
	},

	settlement: {
		smallDeltaThreshold: {
			axis: 'TAX_PERIOD',
			value: 50_000,
			sourceRefs: [ref('nd-126-2020'), ref(R, 'Câu hỏi (1), bước 7')],
			status: 'VERIFIED'
		},
		casualIncomeMonthlyAverageCap: {
			axis: 'TAX_PERIOD',
			value: 10_000_000,
			sourceRefs: [ref('cv-1296-2026'), ref(R, 'Bảng tham số')],
			status: 'VERIFIED'
		},
		individualDeadline: {
			axis: 'TAX_PERIOD',
			value: { rule: 'Ngày cuối tháng thứ 4 sau khi kết thúc năm; trùng ngày nghỉ thì lùi sang ngày làm việc kế tiếp.', date: '2026-05-02' },
			sourceRefs: [ref('cv-1296-2026'), ref(R, 'Bảng tham số')],
			status: 'VERIFIED'
		},
		organizationDeadline: {
			axis: 'TAX_PERIOD',
			value: { rule: 'Ngày cuối tháng thứ 3 sau khi kết thúc năm.', date: '2026-03-31' },
			sourceRefs: [ref('nd-126-2020'), ref(R, 'Hạn nộp')],
			status: 'VERIFIED'
		},
		foreignerExitDeadlineDays: {
			axis: 'TAX_PERIOD',
			value: 45,
			sourceRefs: [ref('nd-126-2020'), ref(R, 'Câu hỏi (1), bước 1')],
			status: 'INFERRED',
			rationale: 'Nghiên cứu trích NĐ 252/2026; mức 45 ngày suy ra cũng áp theo NĐ 126/2020 cho kỳ 2025.'
		},
		insurancePayoutOnlyExempt: {
			axis: 'TAX_PERIOD',
			value: true,
			sourceRefs: [ref(R, 'Câu hỏi (1), bước 8: quy định 2025')],
			status: 'VERIFIED'
		}
	},

	withholdingPractices: []
});
