# ADR-008: Một trang Svelte tĩnh. Thay ADR-003 và mục C4 của `kien-truc-v0.md`

**Trạng thái:** Đã chấp nhận, 22/11/2026. **Người quyết:** chủ dự án. **Cửa:** hai chiều. Sau này vẫn thêm server được, vì lõi tính dùng chung một thư viện.

## Bối cảnh
Người dùng chỉ tính thuế một đến vài lần mỗi năm, phần lớn trong mùa quyết toán từ tháng 1 đến tháng 5. Họ tới từ tìm kiếm, ví dụ "quyết toán thuế TNCN 2026", và sẽ không cài app. Vì vậy app mobile, tài khoản, registry và Rule Studio đều là chi phí không phục vụ ai.

## Quyết định
Một site SvelteKit dùng `adapter-static`, prerender toàn bộ, không backend.

```
src/
  lib/
    core/            # TS thuần, KHÔNG import Svelte. Test bằng vitest.
      money.ts       # kiểu Money: số nguyên VND
      resolve.ts     # resolveByPeriod / resolveByDate
      schedule.ts    # biểu lũy tiến, bậc biên
      insurance.ts
      deductions.ts
      settlement.ts  # Δ, kịch bản ủy quyền và tự quyết toán
      obligation.ts  # bảng quyết định
      levers.ts
      trace.ts
    rules/
      schema.ts      # kiểu Rulebook
      vn-2025.ts     # Rulebook dạng object TS có kiểu, không dùng JSON
      vn-2026.ts
      index.ts       # danh sách kỳ được hỗ trợ
    ui/
      amount.ts      # nhập và hiển thị tiền theo đơn vị (ADR-009)
  routes/
    +page.svelte     # một trang: phân luồng → nhập → kết quả
tests/
  golden/            # ca vàng theo từng Rulebook
  invariants.test.ts # I3, I6, I7, I12 chạy trên mọi Rulebook
```

## Những gì bỏ khỏi v0
- Rulebook Registry, chữ ký số, manifest: Rulebook giờ phát hành cùng code trong một lần deploy.
- Gắn cờ năng lực engine (`requiredEngineCapabilities`): code và luật luôn khớp nhau vì đi chung một bản build.
- Rule Studio: thay bằng Git, pull request và CI. Mỗi PR đổi luật phải có ca vàng và nguồn trích dẫn, cộng một người review chuyên môn.
- App mobile, tài khoản, đồng bộ.

## Những gì giữ nguyên
- ADR-001: luật là dữ liệu. Đã đơn giản hóa: Rulebook giờ là object TS, nên trình biên dịch kiểm schema miễn phí.
- ADR-002: hai trục hiệu lực.
- ADR-004: tiền là số nguyên.
- ADR-005: ca vàng chặn merge.
- ADR-006: luật, dữ kiện và thực hành tách nhau; điểm mở là thực thể hạng nhất.
- ADR-007: so sánh kịch bản.
- Toàn bộ invariant I1 đến I15. I16 chỉ áp khi người dùng chủ động lưu hồ sơ.

## Hệ quả
- Schema Rulebook đổi từ cửa một chiều sang **cửa hai chiều**: không còn client bên ngoài phụ thuộc vào nó, nên refactor thoải mái.
- Lời hứa riêng tư được bảo đảm bằng kiến trúc, không phải bằng chính sách: không có server thì không có chỗ để dữ liệu rời đi.
- Còn đúng một cửa một chiều: **không bao giờ đưa số tiền vào URL hoặc analytics**. Lịch sử trình duyệt, referrer và công cụ đo lường đều có thể làm lộ thu nhập.
- Luật năm mới = thêm `vn-2027.ts` + ca vàng + một lần deploy.

## Lưu trữ
- Mặc định không lưu gì. Đóng tab là mất hồ sơ.
- Có nút "Lưu trên máy này" (localStorage) do người dùng chủ động bấm. Hồ sơ lưu kèm `rulebookId`; khi mở lại mà luật đã đổi thì hiện phần chênh lệch (I16).
- Có nút "Xóa" một chạm và nút xuất file JSON.
- Analytics: chỉ đếm sự kiện (đã xem kết quả, kịch bản nào), không gửi bất kỳ con số nào.
