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
| `docs/research/thue-tncn-2026.md` | Nghiên cứu luật: tham số năm 2025 và 2026, bảng quyết định, công thức, 18 điểm mở. **Nguồn số liệu duy nhất cho Rulebook.** |
| `docs/design/kien-truc-v0.md` | DDD, ngôn ngữ chung, invariants I1–I17, ADR-001 đến ADR-007 |
| `docs/design/adr-008-mot-trang-svelte.md` | Rút gọn thành một trang Svelte tĩnh. **Thay ADR-003 và mục C4 của v0.** |
| `docs/design/adr-009-don-vi-tien.md` | Đơn vị nhập và hiển thị tiền |
| `docs/design/adr-010-co-che-trong-core.md` | Những gì core giữ trong code: thứ tự bảng quyết định, làm tròn cơ chế, khấu trừ theo từng lần chi |
| `docs/design/adr-011-dong-thoi-gian-noi-tra-luong.md` | Form bản 2: khoảng lương, khoản trả một lần, khoản trả sau khi nghỉ việc; chuyển hồ sơ đã lưu |
| `docs/design/adr-012-diem-mo-la-tham-so.md` | Cách hiểu tạm cho điểm mở pháp lý là tham số Rulebook có cờ |
| `docs/design/adr-013-he-thiet-ke-canon.md` | Hệ thiết kế Canon (Modern Swiss) cho trang |
| `docs/frameworks/` | Tiêu chuẩn A v2 và SFIM v2: chuẩn chất lượng của chủ dự án. Đặt hai file vào đây nếu thư mục còn trống. |

## Kiến trúc (tóm tắt ADR-008)

```
src/lib/core/        TS thuần, KHÔNG import Svelte, không gọi mạng, không đọc đồng hồ. Test bằng vitest.
                     money, resolve, schedule, insurance, income, deductions, withholding,
                     settlement (câu 2), obligation (câu 1), levers (câu 3), trace, validate, case, errors
src/lib/rules/       schema.ts, vn-2025.ts, vn-2026.ts, open-issues.ts, index.ts (RULEBOOKS)
src/lib/ui/          amount.ts (đơn vị tiền), form.ts (form → TaxYearCase), compute.ts, describe.ts, storage.ts
src/lib/components/  AmountField, Choice, Money, Section, Timeline (ADR-013)
src/lib/styles/      canon.css: token của hệ thiết kế
src/routes/+page.svelte   một trang: hoàn cảnh → thu nhập → giảm trừ; kết luận cập nhật khi gõ
tests/golden/        ca vàng theo từng Rulebook, và ca c1 (đổi việc có ESOP)
tests/design/        vn-2027 giả: phép thử "năm mới không sửa core". Không phát hành.
tests/invariants.test.ts   I3, I6, I7, I8, I9, I12 trên mọi Rulebook
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
- **Một nơi trả lương là một công ty (I17)**, dù nhập bao nhiêu khoảng lương. Khoản công ty trả sau khi đã nghỉ việc luôn được gộp, không tính là vãng lai.
- **Hồ sơ đã lưu luôn mở được.** Đổi hình dạng `FormState` thì tăng `version` và thêm bước trong `migrateForm`. Không xóa bước cũ.

## Thêm luật năm mới

Thêm `src/lib/rules/vn-YYYY.ts`, đưa vào `RULEBOOKS` trong `rules/index.ts`, viết ca vàng trong `tests/golden/`, rồi deploy. Mỗi tham số mới cần `sourceRefs` và `status: 'VERIFIED' | 'INFERRED' | 'PENDING'`. Mỗi tham số phải được khai lại cho năm mới, kể cả khi giá trị không đổi.

- Điểm mở mới: ghi vào bảng "Điểm mở" của `docs/research` trước, rồi vào `rules/open-issues.ts`. Nếu cách hiểu tạm làm đổi nhánh tính thì nó là một tham số Rulebook có cờ (ADR-012), không viết cứng trong core.
- Ca vàng lấy từ số tính tay. Nếu core cho ra khác, **dừng lại và báo chủ dự án** trước khi sửa test cho khớp. Ca vàng không lấy từ nghiên cứu (ví dụ c1) phải được chủ dự án duyệt số trước khi commit.
- Luật năm mới đổi cơ chế chứ không chỉ đổi số: xem trước ba mục trong ADR-010.

**Ca vàng của năm cũ không bao giờ được đổi kết quả.** Nếu phải đổi thì đó là sửa sai: ghi lý do vào commit message và vào `docs/design/`.

## Trạng thái (22/11/2026)

Đã xong: khung dự án; Rulebook 2025 và 2026; core trả lời cả ba câu hỏi; ca vàng (gồm c1); phép thử `vn-2027` giả; trang một màn theo ADR-013; form bản 2 theo ADR-011. Chưa deploy.

## Việc còn mở

1. **Giảm cờ bằng cách xác minh tham số:** quy tắc làm tròn (`INFERRED`), trần BHTN vùng II–IV và mọi tham số `PENDING` của năm 2025. Xác minh xong thì chuyển `VERIFIED`, tăng `revision` và ghi `changelog`.
2. **Theo dõi công văn quyết toán năm 2026** (thường ra tháng 1–3/2027): điểm mở 6, 8, 13, 18.
3. **Kiểm giao diện:** 375 px, chỉ dùng bàn phím, trình đọc màn hình. Tự host font `@fontsource/be-vietnam-pro`.
4. **Chưa hỗ trợ:** thuế đã nộp ở nước ngoài; năm cư trú đầu tiên theo 12 tháng liên tục; ESOP định giá theo NĐ 253; thu nhập kinh doanh (ngoài phạm vi v1); khung phạt nộp chậm (cần thêm bảng vào schema); mẫu biểu (điểm mở 4).

## Quy ước

- Tên miền dùng đúng ngôn ngữ chung trong `kien-truc-v0.md` mục 3.1: `TaxPeriod`, `IncomeSource`, `WithheldAmount`, `SettlementDelta`, `Rulebook`, `OpenIssue`, `Scenario`.
- Nhập số kiểu Việt Nam: dấu phẩy là phần lẻ, dấu chấm phân cách nghìn. Cạnh mỗi ô nhập luôn hiện "= … đ".
- Kết quả mặc định hiển thị theo triệu, 1 chữ số thập phân. Số khác 0 không bao giờ hiện thành "0,0".
- Alias `#lib` là subpath import trong `package.json`, ánh xạ nguyên đường dẫn: import module TS phải ghi đuôi, ví dụ `#lib/ui/form.ts`. `$lib` không dùng trong project này.
- Câu chữ gửi người dùng (kể cả `rationale` trong Rulebook và thông điệp của core) viết cho người dùng đọc: không dùng chữ nội bộ như "kỳ", "nguồn", "nghiên cứu", "điểm mở"; không em dash. Core không định dạng tiền; số tiền đi qua trường riêng để UI định dạng.
