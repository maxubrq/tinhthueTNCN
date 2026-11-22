# ADR-011: Dòng thời gian của một nơi trả lương

**Trạng thái:** Đã chấp nhận, 22/11/2026. **Người quyết:** chủ dự án, sau review của S và PE. **Cửa:** một chiều với hồ sơ đã lưu trên máy người dùng; hai chiều với phần còn lại.

## Bối cảnh
Form bản 1 giả định: *một nơi trả lương = một hợp đồng liên tục, một mức lương, một cách khấu trừ*. Ba ca thật làm giả định này hỏng:
- **Nghỉ thai sản giữa năm** (đi làm T1–T2 và T9–T12): phải nhập công ty thành hai khối. App đếm thành hai nơi trả lương và kết luận sai "phải tự quyết toán", trong khi người này ủy quyền được.
- **Đổi việc có ESOP** (ca c1): công ty cũ trả ESOP sau khi đã nghỉ việc, khấu trừ 10%. Cách lách là tạo khối "vãng lai", nhưng khi đó app cho chọn "không gộp", trái luật.
- **Tăng lương giữa năm:** mỗi nơi chỉ có một mức lương.

Persona chính của kiến trúc v0 là *người đổi việc giữa năm*. Ca c1 nằm trên hành trình chính, không phải ca hiếm.

## Quyết định
- **Form bản 2** (`src/lib/ui/form.ts`): mỗi nơi trả lương có
  - `periods`: các khoảng tháng, mỗi khoảng một mức lương và một cách đóng bảo hiểm;
  - `extras`: các khoản trả một lần, mỗi khoản có tháng và cờ `afterLeaving`.
- **Core** thêm `Payment.paidAfterTermination`. Lần chi đó bị khấu trừ thuế suất cố định, nhưng vẫn là lương của nơi đó: luôn gộp khi quyết toán, không tính vào bình quân vãng lai (ADR-010 mục 3).
- **Bất biến I17:** một nơi trả lương là một công ty, dù nhập bao nhiêu khoảng. Kiểm bằng property test trong `src/lib/ui/form.test.ts`.
- **Hồ sơ đã lưu:** `FormState.version = 2`. Hàm `migrateForm` chuyển bản 1 sang bản 2 khi đọc. `storage.load()` phải chấp nhận bản 1 mãi mãi.
- **Lỗi người dùng tự sửa được** (`formProblems`): hai khoảng tháng trùng nhau; khoản "trả sau khi nghỉ" nằm trước tháng lương cuối. Trang hiện lỗi, không tính.

## Phương án đã bỏ
- **Hai bản vá riêng** (ô "tháng không nhận lương" và loại khối "khoản sau khi nghỉ"): phải đổi hình dạng hồ sơ đã lưu hai lần, và không sửa được ca tăng lương.
- **Khối "A (ESOP)" kiểu vãng lai:** tách một công ty thành hai danh tính (vi phạm B2 của Tiêu chuẩn A), và cho phép "không gộp".
- **Ô đánh dấu từng tháng không nhận lương:** gọn cho ca thai sản nhưng không chứa được mức lương khác nhau giữa các tháng.

## Hệ quả
- Ca vàng c1 mới (`tests/golden/vn-2026-c1.test.ts`), số được chủ dự án duyệt 22/11/2026: hoàn 12.209.300 đ (A khấu trừ theo biểu mới), 19.637.300 đ (T1–T6 theo biểu cũ).
- Đổi hình dạng `FormState` lần nữa thì tăng `version` và thêm bước chuyển. Không xóa bước chuyển cũ.
- Không làm (memo của PE): định giá ESOP theo NĐ 253 (thuế phát sinh khi bán cổ phiếu); thu nhập kinh doanh. Trang nhắc người dùng thay vì tính sai.
