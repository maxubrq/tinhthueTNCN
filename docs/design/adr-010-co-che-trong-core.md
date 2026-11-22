# ADR-010: Những gì core giữ trong code, không đưa vào Rulebook

**Trạng thái:** Đã chấp nhận, 22/11/2026. **Người quyết:** chủ dự án. **Cửa:** hai chiều. Chuyển một mục sang Rulebook chỉ cần thêm trường vào schema và sửa core một lần.

## Bối cảnh
ADR-001 nói luật là dữ liệu, cơ chế là code. Khi viết core, có ba chỗ ranh giới giữa luật và cơ chế không hiển nhiên. Ghi lại để năm sau không phải đoán lại.

## Quyết định

### 1. Bảng quyết định "có phải tự quyết toán không": thứ tự trong code, ngưỡng trong dữ liệu
- `core/obligation.ts` giữ các bước 0–8 của bảng trong nghiên cứu, lấy quy tắc khớp đầu tiên (I12).
- Mọi ngưỡng và hạn đọc từ Rulebook: `casualIncomeMonthlyAverageCap`, `smallDeltaThreshold`, `individualDeadline`, `foreignerExitDeadlineDays`, `insurancePayoutOnlyExempt`, `postTerminationPaymentCountsAsEmployer`.
- **Bước 8 được xét trước bước 7.** Người chỉ có khoản chi trả bảo hiểm thì không khớp mô tả của bước 7, nhưng nếu duyệt đúng thứ tự trong nghiên cứu thì họ sẽ rơi vào nhánh "còn lại" của bước 7.
- Phương án đã bỏ: biểu diễn bảng quyết định thành dữ liệu (danh sách điều kiện và kết quả). Bỏ vì mới có hai năm luật, và hai năm dùng chung một cấu trúc bảng. Một DSL điều kiện là cơ chế khó review hơn chính đoạn code nó thay thế (ADR-001).
- **Điều kiện xem lại:** năm luật nào thêm, bỏ hay đổi thứ tự một bước thì chuyển bảng sang dữ liệu.

### 2. Làm tròn ở các bước cơ chế: hằng số `MECHANISM_ROUNDING`
- ADR-004 nói quy tắc làm tròn là tham số của Rulebook. Rulebook hiện chỉ có quy tắc cho thuế tháng và thuế năm (`rounding`, đang là `INFERRED`).
- Ba bước khác làm tròn tới đồng, nửa xa số 0, bằng hằng số trong `core/money.ts`: từng khoản bảo hiểm, phần tiền nhà tính thuế, số khấu trừ 10%. Sai lệch tối đa 1 đồng mỗi lần.
- Đây là **lệch có chủ đích so với ADR-004**. Lý do: nghiên cứu không nêu quy tắc làm tròn cho ba bước này, và thêm ba trường `PENDING` vào schema chỉ thêm cờ mà không thêm thông tin.
- **Điều kiện xem lại:** khi có văn bản quy định cách làm tròn một trong ba bước này, thêm trường vào `RoundingRule` của schema rồi bỏ hằng số.

### 3. Cách khấu trừ xét theo từng lần chi trả
- Một nơi có hợp đồng từ 3 tháng thì khấu trừ lũy tiến. Riêng lần chi có `Payment.paidAfterTermination` thì khấu trừ thuế suất cố định, dùng `withholding.flatRate` và `flatRateMinPayment` đã có.
- Không thêm tham số luật cho quy tắc này. Nghiên cứu nêu nó như một quy tắc khấu trừ chung: "khoản chi sau khi nghỉ việc: khấu trừ 10%".

## Hệ quả
- `vn-2027.ts` giả trong `tests/design/` chạy được mà không sửa core (phép thử của ADR-001).
- Ba mục trên là chỗ đầu tiên cần xem khi luật năm mới đổi cơ chế chứ không chỉ đổi số.
