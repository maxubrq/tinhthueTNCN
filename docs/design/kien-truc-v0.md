# Kiến trúc app thuế TNCN, bản v0: DDD, invariants, ADR đầu tiên

> **Lưu ý:** ADR-003 và mục C4 của bản này đã bị thay bởi `adr-008-mot-trang-svelte.md`: một trang Svelte tĩnh, không registry, không Rule Studio. Phần DDD, invariants và các ADR khác vẫn còn hiệu lực.

Người viết: PE (chiến lược và cửa một chiều), S (bounded context, ADR), P (sản phẩm, hành trình, cổng). Đầu vào: `docs/research/thue-tncn-2026.md`, Tiêu chuẩn A v2, SFIM v2.

## Kết luận
App là **một lõi tính thuần chạy trên máy người dùng, đọc một Rulebook dạng dữ liệu có phiên bản, với ngày hiệu lực theo hai trục**. Luật năm sau là một file dữ liệu mới cộng ca vàng. Không phải sửa code, trừ khi luật thêm một *loại cơ chế* chưa từng có. Mọi con số trả ra truy được về input, về phiên bản Rulebook và về điều khoản.

## 1. Chẩn đoán (PE)
Thách thức không nằm ở công thức. Thách thức là **luật thay đổi theo nhiều trục thời gian cùng lúc, và nhiều tham số còn ở trạng thái "suy luận" hoặc "chờ xác minh"**. Năm 2026 có đủ ba kiểu thay đổi:
1. **Hồi tố theo kỳ tính thuế.** Biểu 5 bậc và giảm trừ 15,5/6,2 triệu áp cho cả năm 2026, dù luật chỉ có hiệu lực từ 01/7.
2. **Đổi giữa năm theo ngày chi trả.** Ngưỡng khấu trừ 10% từ 2 lên 5 triệu, tiền ăn 1,2 triệu, trần BHXH từ 46,8 lên 50,6 triệu, ngưỡng 10 lên 20 triệu cho trúng thưởng và bản quyền.
3. **Biết luật muộn hơn hiệu lực của luật.** NĐ 253 ban hành 30/6/2026 cho kỳ bắt đầu 01/01/2026. Công văn quyết toán 2026 thường ra trong tháng 1–3/2027.

Thêm một tầng: **thực hành của doanh nghiệp khác với luật.** Ví dụ, doanh nghiệp có thể đã khấu trừ T1–T6/2026 theo biểu cũ. Δ = luật − thực hành. Trộn hai thứ này thì app sai mà không ai thấy.

**Chính sách dẫn đường:**
- Luật là dữ liệu, cơ chế là code.
- Luật, dữ kiện của người dùng và thực hành của doanh nghiệp là ba nguồn tách biệt. Số đã khấu trừ có giá trị mặc định gắn nhãn rõ, kèm hướng dẫn tra trên eTax.
- Local-first.

**Mục tiêu gần đầu tiên:** core cùng Rulebook 2025 và 2026 qua 100% ca vàng. Sau đó, phép thử là viết được Rulebook 2027 mà không sửa code.

## 2. Sản phẩm (P)
**Ý định một câu:** Người làm công ăn lương biết chính xác mình phải làm gì với quyết toán năm nay và được hoàn hay phải nộp bao nhiêu, kèm căn cứ.

**Cổng:**
- G1: đạt.
- G2: phải chốt mô hình doanh thu trước khi làm phần kiếm tiền. Không nhận hoa hồng từ dịch vụ quyết toán hay bảo hiểm nhân thọ. Nếu có phí thì là phí cố định, không lấy phần trăm số được hoàn.
- T0: app không khai thay người nộp thuế. Mọi kết quả ghi là "ước tính có căn cứ", kèm phiên bản Rulebook.

**Persona chính (giả thuyết, khoảng 70% là giả định):** "Người đổi việc giữa năm": có lương từ hai nơi, không biết mình phải tự quyết toán, lo bị phạt.

**Persona phụ:** người ủy quyền cho công ty nhưng sẽ có lợi hơn nếu tự quyết toán, nhờ giảm trừ y tế và giáo dục.

**Không phục vụ ở v1:** hộ kinh doanh, người không cư trú, người chuyển nhượng vốn.

**Hành trình:**
1. Trả lời 3–5 câu phân luồng.
2. Nhận kết luận: ủy quyền, tự quyết toán, hay không cần quyết toán, kèm căn cứ.
3. Nhập nguồn thu nhập và số đã khấu trừ.
4. Xem Δ ở cả hai kịch bản ủy quyền và tự quyết toán.
5. Xem các đòn bẩy giảm thuế.
6. Xem hạn nộp, nơi nộp, mẫu biểu.

**Khoảnh khắc yếu nhất dự kiến:** bước 3, câu hỏi "Công ty đã khấu trừ bao nhiêu?". Phải đạt mức A2 ở bước này trước khi làm bất kỳ khoảnh khắc đặc trưng nào.

**SFIM:**
- T1: con số đúng, có căn cứ, có hạn nộp.
- T2 dẫn đầu: thời gian từ lúc mở trang đến lúc có một câu trả lời đủ tin để hành động.
- T3 (khoảnh khắc đỉnh): màn so sánh "ủy quyền thì hoàn X, tự quyết toán thì hoàn Y".

## 3. Domain-Driven Design (S)

### 3.1 Ngôn ngữ chung
Dùng đúng các tên này trong code, UI và log.

| Thuật ngữ | Nghĩa | Tên trong code |
|---|---|---|
| Kỳ tính thuế | Năm dương lịch, hoặc 12 tháng liên tục ở năm cư trú đầu tiên | `TaxPeriod` |
| Nguồn trả thu nhập | Tổ chức hoặc cá nhân chi trả, kèm loại hợp đồng | `IncomeSource` |
| Khoản chi trả | Một lần nhận tiền, có ngày chi trả | `Payment` |
| TNCT / TNTT | Thu nhập chịu thuế / thu nhập tính thuế | `taxableIncome` / `assessableIncome` |
| Giảm trừ | Gia cảnh, bảo hiểm, hưu trí tự nguyện, y tế, giáo dục, từ thiện | `Deduction` |
| Biểu lũy tiến | Bậc và thuế suất | `ProgressiveSchedule` |
| Số đã khấu trừ | Dữ kiện do người dùng khai, không phải kết quả tính | `WithheldAmount` |
| Thực hành khấu trừ | Giả định về cách doanh nghiệp đã khấu trừ | `WithholdingPractice` |
| Δ quyết toán | Thuế cả năm − số đã khấu trừ − số được trừ ở nước ngoài | `SettlementDelta` |
| Bộ quy tắc | Gói dữ liệu luật | `Rulebook` |
| Điểm mở | Chỗ luật chưa rõ, có chính sách xử lý | `OpenIssue` |
| Kịch bản | Ủy quyền hay tự quyết toán; có gộp vãng lai hay không | `Scenario` |

### 3.2 Bounded context
Trong bản một trang, mỗi context là một module của cùng một codebase.

| Context | Trách nhiệm | Không làm |
|---|---|---|
| Pháp quy (`rules/`) | Tham số có hiệu lực, biểu thuế, bảng quyết định, đòn bẩy, điểm mở, nguồn | Không tính toán |
| Tính thuế (`core/`) | Phân loại thu nhập, bảo hiểm, giảm trừ, biểu thuế, mô phỏng khấu trừ tháng, Δ năm, dấu vết | Không lưu dữ liệu, không gọi mạng |
| Nghĩa vụ (`core/obligation.ts`) | Có phải tự quyết toán không, hạn nộp, nơi nộp, mẫu biểu, khung phạt | Không tự tính Δ |
| Tối ưu (`core/levers.ts`) | Tiết kiệm chính xác = thuế(TN) − thuế(TN − x); cảnh báo thủ thuật rủi ro | Không gợi ý sản phẩm tài chính cụ thể |
| Hồ sơ năm thuế (UI) | Thu thập dữ kiện, hỏi mỗi thứ một lần, lưu cục bộ, xuất và xóa | Không suy diễn luật |

Lớp chống hỏng: UI chuyển câu trả lời thành một `TaxYearCase` chuẩn trước khi đưa vào core.

### 3.3 Aggregate và value object
- **`Rulebook`**: `id`, `schemaVersion`, `knownAsOf`, `supersedes`, `sources[]`, `parameters[]`, `schedules[]`, `decisionTables[]`, `levers[]`, `openIssues[]`.
- **`Parameter`**: `key`, `axis` (`TAX_PERIOD` | `EVENT_DATE`), `segments[{validFrom, validTo, value, unit, sourceRefs[], status: VERIFIED | INFERRED | PENDING}]`.
- **`ProgressiveSchedule`**: `brackets[{upper, rate}]`, `period`. Hằng số trừ được suy ra từ các bậc.
- **`DecisionTable`**: danh sách quy tắc có thứ tự, lấy quy tắc khớp đầu tiên.
- **`TaxYearCase`**: `taxPeriod`, `residency`, `incomeSources[{type, contractMonths, payments[{date, gross, allowances, withheld}]}]`, `dependents[{registeredAt, months}]`, `claims[]`, `practiceAssumptions[]`.
- **`Assessment`**: `rulebookId`, `engineVersion`, `scenario`, `lines[]`, `delta`, `flags[]`, `trace`.
- **`Money`**: số nguyên đồng.

## 4. Invariants

| # | Invariant | Cơ chế thi hành |
|---|---|---|
| I1 | Tái lập: cùng input thì cùng output đến từng đồng; kết quả lưu `rulebookId` | Core thuần; snapshot test |
| I2 | Rulebook đã phát hành không bị sửa âm thầm; sửa sai thì ghi lý do | Ca vàng của năm cũ khóa kết quả |
| I3 | Không có khoảng trống, không chồng lấn, không fallback ngầm | Validator; ném `UnsupportedPeriod` |
| I4 | Tra đúng trục thời gian | Hai hàm tách biệt `resolveByPeriod` và `resolveByDate` |
| I5 | Tiền là số nguyên đồng; làm tròn ở điểm đã khai | Kiểu `Money` |
| I6 | Biểu liên tục, bậc tăng dần, thuế đơn điệu tăng; biểu năm = biểu tháng × 12 có gắn cờ | Property test |
| I7 | Δ khép kín; số hoàn ≤ thuế đã nộp; TNTT ≥ 0 | Property test |
| I8 | Thu nhập chịu thuế suất toàn phần không vào biểu lũy tiến; người không cư trú không có giảm trừ | Tagged union; hàm riêng cho từng nhánh |
| I9 | Y tế, giáo dục, từ thiện chỉ áp khi tự quyết toán | `Scenario` là tham số bắt buộc |
| I10 | Mỗi người phụ thuộc chỉ tính cho một người nộp thuế mỗi tháng, và phải đăng ký đúng hạn | Validator cùng cảnh báo |
| I11 | Luật khác thực hành: `provenance: USER \| SIMULATED` | Kiểu dữ liệu |
| I12 | Bảng quyết định đầy đủ và tất định | Liệt kê tổ hợp |
| I13 | Mọi con số có dấu vết | `trace` là trường bắt buộc |
| I14 | Kết quả dựa trên tham số chưa xác minh phải hiện cờ | Lan truyền cờ |
| I15 | Dữ liệu không rời máy; xóa được bằng một chạm | Không có backend |
| I16 | Luật đổi thì không âm thầm đổi kết quả đã lưu; hiện phần chênh lệch | So `rulebookId` |
| I17 | Một nơi trả lương là một công ty, dù nhập bao nhiêu khoảng lương hay khoản trả một lần (thêm 22/11/2026, ADR-011) | Property test trong `src/lib/ui/form.test.ts` |

## 5. ADR

- **ADR-001 Luật là dữ liệu; cơ chế là tập primitive có kiểu.**
  - Phương án đã bỏ: hằng số trong code (mỗi năm phải release, không có nguồn); DSL hoặc rules engine tổng quát (không validate được, Rulebook thành code không ai review nổi).
- **ADR-002 Hai trục hiệu lực, cộng `knownAsOf`.**
  - Phương án đã bỏ: khóa theo năm (không biểu diễn được ngưỡng 5 triệu từ 01/7/2026); một trục `validFrom` (không biểu diễn được hồi tố về 01/01).
- **ADR-003** đã bị thay bởi ADR-008.
- **ADR-004 Tiền là số nguyên đồng; làm tròn là tham số của Rulebook.** Ngoại lệ có chủ đích cho ba bước cơ chế: xem ADR-010 mục 2.
- **ADR-005 Ca vàng và validator là cổng merge bắt buộc.** Ca của năm cũ chạy lại mãi mãi.
- **ADR-006 Luật, dữ kiện, thực hành tách nhau; điểm mở là thực thể hạng nhất.** Ví dụ điểm mở #5 có nút chọn "T1–T6 theo biểu 7 bậc / 5 bậc / nhập số thực tế".
- **ADR-007 Kịch bản là hạng nhất:** luôn tính song song ủy quyền và tự quyết toán, gộp và không gộp vãng lai. Khoản trả sau khi nghỉ việc luôn được gộp (ADR-011).
- ADR-008 trở đi nằm ở các file `docs/design/adr-0xx-*.md`.
