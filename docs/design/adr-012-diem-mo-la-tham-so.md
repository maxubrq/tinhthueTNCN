# ADR-012: Cách hiểu tạm cho một điểm mở pháp lý là tham số trong Rulebook

**Trạng thái:** Đã chấp nhận, 22/11/2026. **Người quyết:** chủ dự án. **Cửa:** hai chiều. Văn bản mới ra thì sửa một giá trị dữ liệu, không sửa core.

## Bối cảnh
ADR-006 coi điểm mở là thực thể hạng nhất. Phần lớn điểm mở trong nghiên cứu ảnh hưởng tới một **con số** (ví dụ biểu năm = biểu tháng × 12) và đã có chỗ trong Rulebook. Điểm mở 18 thì khác: nó ảnh hưởng tới một **nhánh của bảng quyết định**. Câu hỏi là: khoản công ty cũ trả sau khi nghỉ việc, đã khấu trừ 10%, có làm công ty cũ thành một nơi trả lương khi xét ủy quyền hay không.

Nếu viết cách hiểu tạm thẳng vào `obligation.ts` thì khi Cục Thuế ra công văn, phải sửa core. Điều đó trái ADR-001, và trái phép thử "năm mới không sửa core".

## Quyết định
- Mỗi cách hiểu tạm cho một điểm mở pháp lý mà làm đổi nhánh tính là **một tham số `PeriodParam` trong Rulebook**:
  - `status: 'INFERRED'` hoặc `'PENDING'`, kèm `rationale` viết cho người dùng đọc;
  - `openIssues` trỏ tới điểm mở, để core tự gắn cờ lên mọi kết quả dùng tham số đó (I14).
- Core đọc tham số và rẽ nhánh. Core có code cho **cả hai** cách hiểu, và có test cho cả hai.
- Điểm mở mới phải được ghi thêm vào bảng "Điểm mở" của `docs/research/thue-tncn-2026.md` trước (nguồn số liệu duy nhất), rồi mới vào `rules/open-issues.ts`.
- **Mặc định chọn cách hiểu thận trọng:** sai thì người dùng chỉ tốn thêm thủ tục, không bị truy thu.

Ví dụ đầu tiên: `settlement.postTerminationPaymentCountsAsEmployer = true` (điểm mở 18). Test "nếu dữ liệu luật đổi sang (a)" trong `tests/golden/vn-2026-c1.test.ts` chứng minh đổi giá trị này là đổi được kết luận, không sửa core.

## Phương án đã bỏ
- **Viết cứng cách hiểu tạm vào core, kèm comment:** công văn ra thì phải sửa core, và kết quả không tự gắn cờ.
- **Một cờ bật/tắt toàn cục ngoài Rulebook:** mất trục thời gian, vì mỗi năm thuế có thể có cách hiểu khác nhau.

## Hệ quả
- Mỗi tham số loại này thêm một cờ trên kết quả cho tới khi được xác minh. Như vậy là trung thực, nhưng cờ dày thì người đọc bỏ qua cờ. Văn bản ra thì chuyển ngay sang `VERIFIED`.
- Năm luật sau phải khai lại tham số này: bất biến "không fallback ngầm" không cho thừa kế giá trị từ năm trước.
