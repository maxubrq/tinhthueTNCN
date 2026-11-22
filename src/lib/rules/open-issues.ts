/**
 * 17 điểm mở trong bảng "Điểm mở" của docs/research/thue-tncn-2026.md.
 * Mỗi Rulebook chọn những điểm áp cho kỳ của nó.
 */
import type { OpenIssue } from './schema';

export const OPEN_ISSUES = {
	'oi-1': { researchNo: 1, question: 'Ngưỡng hộ kinh doanh 1 tỷ (NĐ 141/2026) chưa đọc toàn văn.', policy: 'Tham số, PENDING.' },
	'oi-2': {
		researchNo: 2,
		question: 'Thu nhập tối đa 3 triệu/tháng của người phụ thuộc áp cả năm hay từ tháng 7; lương hưu có tính không.',
		policy: 'Áp cả năm; cảnh báo nếu người phụ thuộc có lương hưu.'
	},
	'oi-3': {
		researchNo: 3,
		question: 'Quy tắc 50.000 đ năm 2026: miễn nộp tiền, nhưng có thể vẫn phải nộp hồ sơ.',
		policy: 'Hiện cả hai ý.'
	},
	'oi-4': { researchNo: 4, question: 'Số hiệu mẫu biểu năm 2026.', policy: 'Không mã hóa cứng.' },
	'oi-5': {
		researchNo: 5,
		question: 'Biểu doanh nghiệp đã dùng để khấu trừ T1–T6/2026.',
		policy: 'Người dùng nhập số thực tế; mặc định giả định biểu 7 bậc với giảm trừ 15,5 triệu.'
	},
	'oi-6': { researchNo: 6, question: 'Biểu năm = biểu tháng × 12.', policy: 'Dùng, gắn cờ.' },
	'oi-7': {
		researchNo: 7,
		question: 'Đăng ký người phụ thuộc bổ sung khi quyết toán 2026.',
		policy: 'Không tính người đăng ký sau 31/12.'
	},
	'oi-8': { researchNo: 8, question: 'Y tế, giáo dục áp cả năm 2026 hay từ 01/7.', policy: 'Cả năm, gắn cờ.' },
	'oi-9': { researchNo: 9, question: 'Trần giảm trừ từ thiện.', policy: 'Không đặt trần, gắn cờ.' },
	'oi-10': {
		researchNo: 10,
		question: 'Trần phụ cấp điện thoại, công tác phí, đồng phục.',
		policy: 'Người dùng nhập phần miễn theo quy chế.'
	},
	'oi-11': { researchNo: 11, question: 'ESOP: NĐ 253 Điều 8.2i ghi khác với Big4.', policy: 'Theo Big4, gắn cờ.' },
	'oi-12': {
		researchNo: 12,
		question: 'Tiền ăn ca trước 01/7/2026: 730.000 đ hay theo quy chế.',
		policy: 'Theo quy chế: người dùng nhập phần miễn.'
	},
	'oi-13': { researchNo: 13, question: 'Hạn cá nhân quyết toán năm 2026.', policy: 'Chờ Cục Thuế công bố.' },
	'oi-14': { researchNo: 14, question: 'Trần BHTN, lương tối thiểu vùng theo tháng.', policy: 'Tham số.' },
	'oi-15': {
		researchNo: 15,
		question: 'Giảm trừ đủ 12 tháng cho người làm không đủ năm; người không cư trú.',
		policy: 'Mặc định 12 tháng, gắn cờ.'
	},
	'oi-16': {
		researchNo: 16,
		question: 'Tự quyết toán có bắt buộc gộp vãng lai bình quân ≤ 15 triệu/tháng không.',
		policy: 'Tính cả hai phương án.'
	},
	'oi-17': { researchNo: 17, question: 'Phạt cá nhân bằng 1/2 tổ chức; NĐ 310/2025.', policy: 'Hiện khung cao, ghi chú.' }
} as const satisfies Record<string, OpenIssue>;

export type OpenIssueId = keyof typeof OPEN_ISSUES;

export function pickOpenIssues<const K extends OpenIssueId>(...ids: K[]): { readonly [P in K]: OpenIssue } {
	const out: Partial<Record<K, OpenIssue>> = {};
	for (const id of ids) out[id] = OPEN_ISSUES[id];
	return out as { [P in K]: OpenIssue };
}
