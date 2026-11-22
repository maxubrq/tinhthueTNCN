# Trang tính thuế TNCN (Việt Nam)

Một trang web tĩnh viết bằng SvelteKit, giúp người làm công ăn lương trả lời ba câu hỏi:
1. Tôi có phải tự quyết toán không?
2. Tôi phải nộp bù hay được hoàn, khoảng bao nhiêu?
3. Tôi giảm thuế hợp pháp được bằng cách nào, giảm được bao nhiêu?

Trang phải dùng được cho nhiều năm, không chỉ năm 2026. Luật mỗi năm là **dữ liệu**, không phải code.

Giao tiếp với chủ dự án bằng tiếng Việt, xưng "mình", gọi "bạn". Nói thẳng về rủi ro và sai sót, nhưng luôn kèm cách sửa. Không khuyên hạ mục tiêu.

## Đọc trước khi làm

| File | Nội dung |
|---|---|
| `docs/research/thue-tncn-2026.md` | Nghiên cứu luật: tham số năm 2025 và 2026, bảng quyết định, công thức, 17 điểm mở. **Nguồn số liệu duy nhất cho Rulebook.** |
| `docs/design/kien-truc-v0.md` | DDD, ngôn ngữ chung, invariants I1–I16, ADR-001 đến ADR-007 |
| `docs/design/adr-008-mot-trang-svelte.md` | Rút gọn thành một trang Svelte tĩnh. **Thay ADR-003 và mục C4 của v0.** |
| `docs/design/adr-009-don-vi-tien.md` | Đơn vị nhập và hiển thị tiền |
| `docs/frameworks/` | Tiêu chuẩn A v2 và SFIM v2: chuẩn chất lượng của chủ dự án. Đặt hai file vào đây nếu thư mục còn trống. |

## Kiến trúc (tóm tắt ADR-008)

```
src/lib/core/    TS thuần, KHÔNG import Svelte, không gọi mạng, không đọc đồng hồ. Test bằng vitest.
src/lib/rules/   schema.ts + vn-2025.ts + vn-2026.ts (object TS có kiểu, không dùng JSON)
src/lib/ui/      amount.ts (đã xong): parse và format tiền theo đơn vị
src/routes/+page.svelte   một trang: phân luồng → nhập → kết quả
tests/golden/    ca vàng theo từng Rulebook
tests/invariants.test.ts
```
SvelteKit dùng `adapter-static`, prerender, không backend, không tài khoản.

## Bất biến không được phá

- **Tiền là số nguyên đồng** trong core (`Number.isSafeInteger`). Không dùng float cho tiền. Đơn vị nghìn và triệu chỉ tồn tại ở `src/lib/ui`.
- **Tái lập.** Kết quả = f(hồ sơ, Rulebook). Mỗi kết quả mang `rulebookId`.
- **Hai trục hiệu lực.** Mỗi tham số khai `axis: 'TAX_PERIOD' | 'EVENT_DATE'`.
  - Biểu thuế và giảm trừ gia cảnh 2026 tra theo kỳ (áp hồi tố cả năm).
  - Ngưỡng 5 triệu, tiền ăn 1,2 triệu, trần BHXH 46,8/50,6 triệu tra theo ngày chi trả.
- **Không fallback ngầm.** Kỳ không có Rulebook thì ném lỗi, không dùng luật mới nhất.
- **Biểu liên tục.** Hằng số trừ của công thức rút gọn được *suy ra* từ các bậc, không nhập tay. Property test kiểm tính liên tục và đơn điệu.
- **Thu nhập chịu thuế suất toàn phần không vào biểu lũy tiến.** Người không cư trú không có giảm trừ.
- **Y tế, giáo dục, từ thiện chỉ trừ trong kịch bản tự quyết toán.**
- **Luật khác thực hành.** Số đã khấu trừ là dữ kiện người dùng nhập (`provenance: 'USER'`). Nếu app mô phỏng thì gắn `'SIMULATED'` và hiện nhãn giả định.
- **Mọi con số có dấu vết** về input và điều khoản. Số nào dựa trên tham số `INFERRED` hoặc `PENDING` thì hiện cờ ngay cạnh con số.
- **Riêng tư.** Không đưa số tiền vào URL, query string hay analytics. Mặc định không lưu gì. Chỉ lưu localStorage khi người dùng bấm "Lưu trên máy này". Có nút xóa một chạm.

## Thêm luật năm mới

Thêm `src/lib/rules/vn-YYYY.ts` và ca vàng trong `tests/golden/`, rồi deploy. Mỗi tham số mới cần `sourceRefs` và `status: 'VERIFIED' | 'INFERRED' | 'PENDING'`.

**Ca vàng của năm cũ không bao giờ được đổi kết quả.** Nếu phải đổi thì đó là sửa sai: ghi lý do vào commit message và vào `docs/design/`.

## Việc tiếp theo, theo thứ tự

1. **Dựng khung dự án:** SvelteKit + TypeScript + `adapter-static` + vitest. Giữ nguyên `src/lib/ui/amount.ts` và test của nó (13 test, phải xanh).
2. **Viết `rules/schema.ts`,** rồi biểu diễn đầy đủ năm 2025 và 2026 từ `docs/research`.
3. **Viết core:** `money`, `resolve`, `schedule`, `insurance`, `deductions`, `settlement`.
4. **Viết ca vàng,** lấy từ nghiên cứu, mọi số tính bằng đồng:
   - Hai nơi lương 30 và 20 triệu/tháng, năm 2026: thiếu khoảng 11,4 triệu/năm. Nếu nơi B khấu trừ 10% thì thiếu khoảng 5,4 triệu.
   - TN 9,5 triệu/tháng, thêm thưởng 50 triệu vào tháng 12: được hoàn khoảng 3,2 triệu.
   - Chênh lệch biểu 7 bậc so với 5 bậc theo tháng: TN 10 → 0,25; TN 20 → 0,85; TN 40 → 2,25; TN 80 → 3,65; TN > 100 → 4,65 (triệu).
   - Ranh giới bậc 2026: TN 30 → thuế 2,5; TN 60 → 8,5; TN 100 → 20,5 (triệu/tháng).
   - Thu nhập sau bảo hiểm 30 triệu/tháng, không người phụ thuộc: năm 2025 khoảng 25,8 triệu, năm 2026 khoảng 11,4 triệu. Ở mức 50 triệu: 78 và 40,8 triệu.

   Các số "khoảng" là số tính tay. Nếu core cho ra khác, **dừng lại và báo chủ dự án** trước khi sửa test cho khớp.
5. **Phép thử thiết kế:** viết thử một `vn-2027.ts` giả (đổi biểu và một ngưỡng giữa năm) mà không sửa dòng code nào trong core.
6. Sau đó mới làm `obligation` (bảng quyết định), `levers`, rồi đến UI.

## Quy ước

- Tên miền dùng đúng ngôn ngữ chung trong `kien-truc-v0.md` mục 3.1: `TaxPeriod`, `IncomeSource`, `WithheldAmount`, `SettlementDelta`, `Rulebook`, `OpenIssue`, `Scenario`.
- Nhập số kiểu Việt Nam: dấu phẩy là phần lẻ, dấu chấm phân cách nghìn. Cạnh mỗi ô nhập luôn hiện "= … đ".
- Kết quả mặc định hiển thị theo triệu, 1 chữ số thập phân. Số khác 0 không bao giờ hiện thành "0,0".
