/**
 * Lỗi của core. Core không bao giờ đoán thay người dùng hay thay luật: thiếu Rulebook,
 * ngày không có tham số, hồ sơ sai đều ném lỗi có tên (I3, "không fallback ngầm").
 */

/** Không có Rulebook cho kỳ tính thuế được hỏi. */
export class UnsupportedPeriodError extends Error {
	constructor(
		readonly taxPeriod: number,
		readonly supported: readonly number[]
	) {
		super(
			`Chưa có Rulebook cho kỳ tính thuế ${taxPeriod}. Các kỳ được hỗ trợ: ${supported.join(', ') || '(không có)'}.`
		);
		this.name = 'UnsupportedPeriodError';
	}
}

/** Tham số theo ngày không có đoạn hiệu lực nào chứa ngày được hỏi. */
export class UncoveredDateError extends Error {
	constructor(
		readonly paramKey: string,
		readonly date: string
	) {
		super(`Tham số "${paramKey}" không có giá trị cho ngày ${date}.`);
		this.name = 'UncoveredDateError';
	}
}

/** Rulebook vi phạm bất biến dữ liệu (I3, I5, I6). */
export class InvalidRulebookError extends Error {
	constructor(
		readonly rulebookId: string,
		readonly problems: readonly string[]
	) {
		super(`Rulebook ${rulebookId} không hợp lệ:\n- ${problems.join('\n- ')}`);
		this.name = 'InvalidRulebookError';
	}
}

/** Hồ sơ năm thuế không hợp lệ: tiền không nguyên, ngày ngoài kỳ, tham chiếu sai… */
export class InvalidCaseError extends Error {
	constructor(readonly problems: readonly string[]) {
		super(`Hồ sơ không hợp lệ:\n- ${problems.join('\n- ')}`);
		this.name = 'InvalidCaseError';
	}
}
