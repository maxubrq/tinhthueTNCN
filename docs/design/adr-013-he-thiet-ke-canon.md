# ADR-013: Hệ thiết kế Canon (Modern Swiss) cho trang

**Trạng thái:** Đã chấp nhận, 22/11/2026. **Người quyết:** chủ dự án. **Cửa:** hai chiều (chỉ tầng UI).

## Bối cảnh
- **Việc chính của trang:** cho bạn biết quyết toán thuế năm nay bạn phải làm gì.
- **Người đọc:** người làm công ăn lương, tới từ tìm kiếm trong mùa quyết toán, đọc trên điện thoại, mở vài lần mỗi năm.
- Trang phải sống nhiều năm, nên giao diện phải bền hơn mốt.

## Quyết định
- **Token** trong `src/lib/styles/canon.css`, import một lần ở `+layout.svelte`. Component đọc bằng `var(--canon-x, dự-phòng)`. Không component nào tự đặt giá trị chưa có trong token.
- **Lưới:** 4 cột trên điện thoại, 12 cột trên desktop (từ 64rem). Khoảng giữa cột bằng một dòng chữ thân; mọi khoảng cách là bội của ⅓, 1, 2 hoặc 4 dòng.
- **Chữ:** chỉ hai cỡ, chữ thân 17→20 px (leading 1,45) và chữ trưng bày gấp đôi. Một họ chữ sans có dấu tiếng Việt chuẩn.
- **Màu:** mực, giấy, chữ phụ, và một màu đỏ tín hiệu, dùng cho số mục, con số kết quả, cờ ※ và viền focus. Chế độ tối chỉ đổi giá trị màu.
- **Bố cục:**
  - Desktop: Kết luận dính ở cột 1–4; các mục nhập và chi tiết ở cột 5–12.
  - Điện thoại: Kết luận nằm ngay sau phần nhập, và một thanh dính ở đáy hiện Δ kèm liên kết `#ket-luan` (neo này không mang số tiền).
- **Chuyển động:** không có hoạt hình vào khung; chữ hiện ngay. Chỉ có hiệu ứng đổi trạng thái 100 ms trên nút chọn.
- **Component** (`src/lib/components/`), mỗi cái không quá 6 prop thiết kế: `AmountField`, `Choice`, `Money`, `Section`, `Timeline`.
- **Dòng thời gian** (bổ sung 22/11/2026): chủ dự án muốn các khoản lương dễ phân biệt hơn. Không thêm màu. Khoảng lương phân biệt bằng sắc độ mực và xám xen kẽ; khoản trả một lần là ●, khoản trả sau khi nghỉ việc là ○. Màu tín hiệu đánh dấu tháng làm cùng lúc ở nhiều nơi, vì đó là chỗ app phải hỏi. Bảng HTML thật, mỗi ô có chữ ẩn cho trình đọc màn hình.

## Phương án đã bỏ
- **Mỗi khoản lương một màu:** 4–5 màu làm màu tín hiệu mất nghĩa, và người mù màu không phân biệt được. Thay bằng sắc độ và dấu trong dòng thời gian. Chủ dự án vẫn có thể chọn lại.
- **Luồng nhiều bước (wizard):** kết luận chỉ hiện ở bước cuối, nên mất phép so sánh "ủy quyền hay tự quyết toán" ngay khi gõ, vốn là khoảnh khắc chính (kiến trúc v0, mục 2).
- **Kết luận ở cuối trang trên mọi màn hình:** ở 1440×723 px, con số rơi xuống dưới màn hình đầu.
- **Thư viện UI có sẵn:** thêm phụ thuộc, nhiều cỡ chữ và màu ngoài hệ, khó giữ quy tắc hai cỡ chữ và một màu tín hiệu.

## Hệ quả
- Font chưa tự host: trang dùng Be Vietnam Pro hoặc Inter nếu máy có sẵn, không có thì dùng font hệ thống. Tự host `@fontsource/be-vietnam-pro` là việc còn mở.
- Cờ ※ dày khi nhiều tham số còn `INFERRED`. Cách giảm là xác minh tham số, không phải giấu cờ.
- Đã kiểm thật trên Chrome ở 1440 px và 500 px, và trong iframe rộng 390 px: chân trang không bị thanh dính che, không cuộn ngang, dòng thời gian vừa khít. Chưa kiểm trên điện thoại thật.
- Thanh dính ở đáy: trang đo chiều cao thật của thanh và chừa đúng chừng đó cộng hai dòng ở chân trang; thanh tránh vùng thanh điều hướng của iPhone (`viewport-fit=cover`, `safe-area-inset`).
