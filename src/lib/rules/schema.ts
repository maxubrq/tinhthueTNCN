/**
 * Kiểu Rulebook: gói dữ liệu luật thuế TNCN của MỘT kỳ tính thuế (năm dương lịch).
 *
 * Ranh giới (ADR-001, ADR-008): file này chỉ khai KIỂU. Không tính toán, không import
 * Svelte, không import core. Rulebook là object TS có kiểu để trình biên dịch kiểm
 * schema; những gì kiểu không kiểm được (số nguyên, phủ kín năm, bậc tăng dần) do
 * validator và property test đảm nhận (I3, I5, I6).
 *
 * Quy ước giá trị:
 *  - Tiền: `Dong`, số nguyên đồng (ADR-004). Khoản theo tháng ghi rõ trong tên trường.
 *  - Tỷ lệ: `Bps`, số nguyên phần vạn. 10_000 = 100%, 1_050 = 10,5%, 3 = 0,03%.
 *    Không dùng số thực cho tỷ lệ, để phép nhân tiền × tỷ lệ là phép tính nguyên.
 *  - Ngày: `IsoDate` dạng YYYY-MM-DD. Khoảng ngày bao gồm cả hai đầu.
 *
 * Hai trục hiệu lực (ADR-002, I4). Trục của mỗi tham số được CỐ ĐỊNH trong kiểu dưới
 * đây, để core không thể tra nhầm trục:
 *  - `PeriodParam`: một giá trị cho cả kỳ, tra theo kỳ tính thuế (áp hồi tố cả năm).
 *  - `DateParam`: các đoạn theo ngày chi trả / ngày phát sinh, phải phủ kín kỳ.
 * Luật năm sau đổi trục của một tham số là đổi cơ chế, nên phải sửa schema và core.
 */

/** Số nguyên đồng. */
export type Dong = number;
/** Số nguyên phần vạn: 10_000 = 100%. */
export type Bps = number;
/** Ngày dạng YYYY-MM-DD. */
export type IsoDate = `${number}-${number}-${number}`;

export const SCHEMA_VERSION = 1 as const;

// ---------------------------------------------------------------------------
// Nguồn, trạng thái, điểm mở
// ---------------------------------------------------------------------------

export type SourceKind =
	| 'LAW' // Luật
	| 'RESOLUTION' // Nghị quyết
	| 'DECREE' // Nghị định
	| 'CIRCULAR' // Thông tư
	| 'OFFICIAL_LETTER' // Công văn
	| 'RESEARCH'; // Ghi chú nghiên cứu nội bộ, cho số suy luận

export interface Source {
	readonly kind: SourceKind;
	/** Số hiệu, ví dụ "253/2026/NĐ-CP". */
	readonly number: string;
	readonly title: string;
	readonly issuedOn?: IsoDate;
	readonly effectiveFrom?: IsoDate;
	readonly url?: string;
}

export interface SourceRef<S extends string> {
	readonly source: S;
	/** Điều, khoản, điểm, ví dụ "Điều 70.2". */
	readonly locator?: string;
}

export type ParamStatus = 'VERIFIED' | 'INFERRED' | 'PENDING';

/**
 * Mỗi giá trị luật mang nguồn và trạng thái (I13, I14).
 * Giá trị INFERRED hoặc PENDING bắt buộc có `rationale` để người review biết vì sao.
 */
export type Provenance<S extends string, O extends string> = {
	readonly sourceRefs: readonly [SourceRef<S>, ...SourceRef<S>[]];
	/** Điểm mở liên quan. Core lan truyền cờ từ đây sang kết quả. */
	readonly openIssues?: readonly O[];
	readonly note?: string;
} & (
	| { readonly status: 'VERIFIED'; readonly rationale?: string }
	| { readonly status: 'INFERRED' | 'PENDING'; readonly rationale: string }
);

export interface OpenIssue {
	/** Số thứ tự trong bảng "Điểm mở" của docs/research. */
	readonly researchNo: number;
	readonly question: string;
	/** Cách app đang xử lý cho tới khi có văn bản. */
	readonly policy: string;
}

// ---------------------------------------------------------------------------
// Tham số theo hai trục
// ---------------------------------------------------------------------------

/** Tra theo kỳ tính thuế: một giá trị cho cả kỳ. */
export type PeriodParam<V, S extends string, O extends string> = {
	readonly axis: 'TAX_PERIOD';
	readonly value: V;
} & Provenance<S, O>;

/** Một đoạn hiệu lực theo ngày, bao gồm cả `from` và `to`. */
export type DateSegment<V, S extends string, O extends string> = {
	readonly from: IsoDate;
	readonly to: IsoDate;
	readonly value: V;
} & Provenance<S, O>;

/**
 * Tra theo ngày chi trả / ngày phát sinh. Các đoạn xếp tăng dần, liền nhau,
 * không chồng lấn, phủ kín 01/01 đến 31/12 của kỳ (I3, kiểm bằng validator).
 */
export interface DateParam<V, S extends string, O extends string> {
	readonly axis: 'EVENT_DATE';
	readonly segments: readonly [DateSegment<V, S, O>, ...DateSegment<V, S, O>[]];
}

// ---------------------------------------------------------------------------
// Giá trị có cấu trúc
// ---------------------------------------------------------------------------

export interface BoundedBracket {
	/** Cận trên của bậc (bao gồm), cùng đơn vị kỳ với biểu. */
	readonly upTo: Dong;
	readonly rate: Bps;
}

export interface TopBracket {
	readonly upTo: null;
	readonly rate: Bps;
}

/**
 * Biểu lũy tiến từng phần. Chỉ khai cận trên và thuế suất; hằng số trừ của công
 * thức rút gọn được core SUY RA từ các bậc, không bao giờ nhập tay (I6).
 * Bậc cuối không có cận trên.
 */
export interface ProgressiveSchedule {
	readonly brackets: readonly [...BoundedBracket[], TopBracket];
}

/**
 * Biểu năm dùng khi quyết toán. `MONTHLY_TIMES_12` là thông lệ cũ (điểm mở 6):
 * cận trên mỗi bậc = cận tháng × 12.
 */
export type AnnualSchedule =
	| { readonly kind: 'MONTHLY_TIMES_12' }
	| { readonly kind: 'EXPLICIT'; readonly schedule: ProgressiveSchedule };

export type RoundingMode = 'HALF_UP' | 'FLOOR' | 'CEIL';

export interface RoundingRule {
	readonly mode: RoundingMode;
	/** Làm tròn tới bội số này, ví dụ 1 (từng đồng) hoặc 1_000. */
	readonly toMultipleOf: Dong;
}

export interface InsuranceRates {
	/** BHXH phần người lao động. */
	readonly social: Bps;
	/** BHYT phần người lao động. */
	readonly health: Bps;
	/** BHTN phần người lao động. */
	readonly unemployment: Bps;
}

/** Vùng lương tối thiểu, quyết định trần BHTN. */
export type WageRegion = 'I' | 'II' | 'III' | 'IV';

export type PensionProduct = 'VOLUNTARY_PENSION' | 'LIFE_INSURANCE';

export interface VoluntaryPensionDeduction {
	readonly monthlyCap: Dong;
	/** Các sản phẩm cộng chung vào cùng một trần. */
	readonly covers: readonly [PensionProduct, ...PensionProduct[]];
}

/** Giảm trừ chỉ được trừ khi tự quyết toán (I9): y tế, giáo dục, từ thiện. */
export interface SelfSettlementDeduction {
	/** `null` = luật không đặt trần (điểm mở 9 với từ thiện). */
	readonly annualCap: Dong | null;
	readonly selfSettlementOnly: true;
}

/** Cách tính giảm trừ bản thân khi chỉ có thu nhập một phần năm (điểm mở 15). */
export type TaxpayerDeductionMonths = 'FULL_YEAR' | 'MONTHS_WITH_INCOME';

/** Phần tiền ăn ca bằng tiền được miễn. */
export type MealAllowanceExemption =
	| { readonly kind: 'MONTHLY_CAP'; readonly monthlyCap: Dong }
	/** Theo quy chế của đơn vị: người dùng nhập phần miễn (điểm mở 12). */
	| { readonly kind: 'EMPLOYER_POLICY' };

export type OvertimeExemption =
	/** Chỉ miễn phần trả cao hơn so với giờ làm bình thường. */
	| 'PREMIUM_ONLY'
	/** Miễn toàn bộ trong mức luật định. */
	| 'FULL_WITHIN_LEGAL_LIMIT';

export interface Deadline {
	/** Quy tắc theo văn bản, ví dụ "ngày cuối tháng thứ 4, lùi nếu trùng ngày nghỉ". */
	readonly rule: string;
	/** Ngày cụ thể đã công bố. `null` khi chưa có (đi kèm status PENDING). */
	readonly date: IsoDate | null;
}

/**
 * Giả định về cách doanh nghiệp ĐÃ khấu trừ (ADR-006). Đây là thực hành, không phải
 * luật: core chỉ dùng khi người dùng không nhập số thực tế, và gắn `provenance:
 * 'SIMULATED'` cho số mô phỏng ra (I11).
 */
export type WithholdingPractice<S extends string, O extends string> = {
	readonly id: string;
	readonly label: string;
	readonly from: IsoDate;
	readonly to: IsoDate;
	readonly monthlySchedule: ProgressiveSchedule;
	readonly taxpayerMonthly: Dong;
	readonly dependentMonthly: Dong;
} & Provenance<S, O>;

// ---------------------------------------------------------------------------
// Rulebook
// ---------------------------------------------------------------------------

export interface Rulebook<S extends string = string, O extends string = string> {
	/** Ví dụ "vn-2026". Kết quả tính mang id và revision này (I1). */
	readonly id: string;
	/** Tăng mỗi lần sửa sai dữ liệu đã phát hành; lý do ghi ở `changelog` (I2). */
	readonly revision: number;
	readonly schemaVersion: typeof SCHEMA_VERSION;
	/** Kỳ tính thuế: năm dương lịch. Năm cư trú đầu tiên theo 12 tháng liên tục chưa hỗ trợ. */
	readonly taxYear: number;
	/** Dữ liệu phản ánh văn bản đã biết tới ngày này (ADR-002). */
	readonly knownAsOf: IsoDate;
	readonly changelog: readonly { readonly revision: number; readonly date: IsoDate; readonly reason: string }[];

	readonly sources: { readonly [K in S]: Source };
	readonly openIssues: { readonly [K in O]: OpenIssue };

	readonly schedules: {
		readonly monthly: PeriodParam<ProgressiveSchedule, S, O>;
		readonly annual: PeriodParam<AnnualSchedule, S, O>;
	};

	readonly rounding: PeriodParam<
		{ readonly monthlyTax: RoundingRule; readonly annualTax: RoundingRule },
		S,
		O
	>;

	/** Tiền lương, tiền công: phần nào tính vào thu nhập chịu thuế. */
	readonly employmentIncome: {
		readonly mealAllowance: DateParam<MealAllowanceExemption, S, O>;
		/** Tiền nhà do doanh nghiệp trả tính tối đa tỷ lệ này trên TNCT chưa gồm tiền nhà. */
		readonly housingInclusionCap: PeriodParam<Bps, S, O>;
		readonly overtime: PeriodParam<OvertimeExemption, S, O>;
	};

	/** Bảo hiểm bắt buộc phần người lao động. Tra theo tháng đóng. */
	readonly insurance: {
		readonly employeeRates: DateParam<InsuranceRates, S, O>;
		/** Trần lương đóng BHXH và BHYT mỗi tháng. */
		readonly socialHealthMonthlyCap: DateParam<Dong, S, O>;
		/** Trần lương đóng BHTN mỗi tháng, theo vùng (điểm mở 14). */
		readonly unemploymentMonthlyCap: DateParam<{ readonly [R in WageRegion]: Dong }, S, O>;
	};

	readonly deductions: {
		readonly taxpayerMonthly: PeriodParam<Dong, S, O>;
		readonly dependentMonthly: PeriodParam<Dong, S, O>;
		readonly taxpayerMonths: PeriodParam<TaxpayerDeductionMonths, S, O>;
		/** Thu nhập tối đa mỗi tháng của người phụ thuộc, từ mọi nguồn. */
		readonly dependentIncomeMonthlyLimit: PeriodParam<Dong, S, O>;
		readonly dependentRegistrationDeadline: PeriodParam<IsoDate, S, O>;
		readonly voluntaryPension: PeriodParam<VoluntaryPensionDeduction, S, O>;
		/** `null` = kỳ này luật không có khoản giảm trừ đó. */
		readonly medical: PeriodParam<SelfSettlementDeduction | null, S, O>;
		readonly education: PeriodParam<SelfSettlementDeduction | null, S, O>;
		readonly charity: PeriodParam<SelfSettlementDeduction | null, S, O>;
	};

	/** Cách tổ chức trả thu nhập phải khấu trừ (luật, không phải thực hành). */
	readonly withholding: {
		/** Hợp đồng từ số tháng này trở lên thì khấu trừ theo biểu lũy tiến. */
		readonly progressiveMinContractMonths: PeriodParam<number, S, O>;
		readonly flatRate: DateParam<Bps, S, O>;
		/** Khấu trừ thuế suất cố định khi một lần chi từ mức này trở lên. */
		readonly flatRateMinPayment: DateParam<Dong, S, O>;
	};

	readonly nonResident: {
		/** Thuế suất trên tiền lương, tiền công; không có giảm trừ (I8). */
		readonly employmentRate: PeriodParam<Bps, S, O>;
	};

	readonly settlement: {
		/** Số phải nộp thêm không quá mức này thì được miễn; nộp thừa không quá mức này thì bù trừ kỳ sau. */
		readonly smallDeltaThreshold: PeriodParam<Dong, S, O>;
		/** Vãng lai đã khấu trừ, bình quân tháng không quá mức này thì vẫn ủy quyền được. */
		readonly casualIncomeMonthlyAverageCap: PeriodParam<Dong, S, O>;
		readonly individualDeadline: PeriodParam<Deadline, S, O>;
		readonly organizationDeadline: PeriodParam<Deadline, S, O>;
		/** Người nước ngoài kết thúc làm việc tại Việt Nam: hạn tự quyết toán, số ngày sau khi hợp đồng kết thúc. */
		readonly foreignerExitDeadlineDays: PeriodParam<number, S, O>;
		/** Chỉ có khoản chi trả bảo hiểm đã bị khấu trừ 10% thì không phải quyết toán. */
		readonly insurancePayoutOnlyExempt: PeriodParam<boolean, S, O>;
	};

	/** Giả định thực hành mặc định cho kỳ này (ví dụ điểm mở 5). Có thể rỗng. */
	readonly withholdingPractices: readonly WithholdingPractice<S, O>[];
}

/**
 * Khai một Rulebook. Hàm đồng nhất, chỉ để TS suy ra tập id nguồn và id điểm mở,
 * nhờ đó một `sourceRefs` hay `openIssues` trỏ tới id chưa khai sẽ là lỗi biên dịch,
 * báo ngay tại chỗ trỏ sai. Id chỉ được suy ra từ khóa của `sources` và `openIssues`;
 * mọi chỗ tham chiếu dùng `NoInfer` để không nới rộng được tập id.
 */
export function defineRulebook<const S extends string, const O extends string>(
	rulebook: Omit<Rulebook<NoInfer<S>, NoInfer<O>>, 'sources' | 'openIssues'> & {
		readonly sources: { readonly [K in S]: Source };
		readonly openIssues: { readonly [K in O]: OpenIssue };
	}
): Rulebook<S, O> {
	return rulebook;
}
