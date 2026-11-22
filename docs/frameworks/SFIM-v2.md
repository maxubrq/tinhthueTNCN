# SFIM v2.0 — Stratified Feature Impact Model

**Phân tầng tác động của tính năng theo vị trí trú ngụ của giá trị.**

Từ điều kiện chính danh để tồn tại, tới sự tái cấu trúc khung tham chiếu của cả một thị trường.

*Bao gồm và mở rộng Kano (1984). Bảy tầng T0–T6, mỗi tầng có trục âm đối xứng.*

---

## 0. v2.0 khác v1.0 ở đâu

v1.0 là một **phân loại**. v2.0 là một **tiêu chuẩn sản xuất**: nó phải trả lời được câu hỏi "tuần tới làm gì" chứ không chỉ "cái này thuộc loại nào". Chín thay đổi:

| # | Thay đổi | Lý do |
|---|---|---|
| 1 | **Trục phân tầng được định nghĩa lại:** không phải thang bậc theo độ lớn, mà là *bán kính tác động* — vị trí giá trị trú ngụ | v1.0 trộn hai tiêu chí: T1–T3 phân loại theo hình dạng phản ứng thỏa mãn, T4–T6 theo vị trí xảy ra thay đổi. Hai trục khác nhau xếp thành một thang là lỗi kiến trúc |
| 2 | **Thêm T0 — Mandated** | Có một lớp yêu cầu sinh ra từ mệnh lệnh pháp lý, không từ kỳ vọng thị trường. Hình dạng giống T1 nhưng cơ chế, đường cong và logic đầu tư đều khác |
| 3 | **Trục âm trở thành cấu trúc ngang hàng, không phải edge case** | Mỗi tầng có một mặt tối riêng với cơ chế riêng. v1.0 chỉ có "T6 âm" |
| 4 | **T5 định nghĩa lại: độc lập bối cảnh, không phải bất khả đảo ngược** | "Không thể đảo ngược" không kiểm chứng được và không đúng thực nghiệm. "Độc lập bối cảnh" chặt hơn và test được trong 90 ngày |
| 5 | **T4 có cơ chế mới: vách pha loãng** | v1.0 nói T4 suy giảm thành T3. Sai cơ chế: tính năng bản sắc bị pha loãng rồi đi qua 0 thành âm, không mờ dần |
| 6 | **T6 chuyển từ nhãn hồi cứu sang dự đoán tiền đăng ký** | Test "sau 3–5 năm" không dùng được để ra quyết định hôm nay và đảm bảo mọi ca được kể lại đều là ca thắng |
| 7 | **Mỗi tầng có điều kiện LOẠI TRỪ, không chỉ điều kiện nhận diện** | Nếu mọi tính năng đều có thể được kể thành T4 hoặc T5, nhãn dán vô nghĩa |
| 8 | **Mọi test là test hành vi hoặc test can thiệp. Không có test bảng hỏi** | Phần đáng tin của Kano là lý thuyết bất đối xứng; phần đáng ngờ là công cụ khảo sát. v2.0 kế thừa cái thứ nhất, bỏ cái thứ hai |
| 9 | **Thêm quy trình thiết kế và thang trưởng thành** | Một khung phân loại chỉ đáng giá nếu nhãn dán thay đổi hành động tiếp theo |

**Quy tắc thay thế:** mọi ví dụ trong v1.0 phải được chạy lại qua điều kiện loại trừ của v2.0. Một số sẽ rớt tầng. Đó là mục đích.

---

## 1. Năm tiên đề

Framework đứng trên năm mệnh đề. Nếu bạn không đồng ý với một trong năm, phần còn lại không áp dụng cho bạn.

**A1 — Tầng là cơ chế, không phải độ lớn.**
Một T1 xuất sắc vẫn là T1. Một T6 tồi vẫn là T6. Tầng mô tả *giá trị được tạo ra bằng cách nào*, không mô tả *giá trị lớn bao nhiêu*. Hệ quả trực tiếp: thứ tự T0→T6 không phải thứ tự ưu tiên. Phần lớn giá trị trong phần lớn sản phẩm được tạo ra ở T1 và T2.

**A2 — Tầng được xác định bởi vị trí giá trị trú ngụ, không bởi tính năng.**
Cùng một tính năng, hai bối cảnh, hai tầng. Giao hàng hai ngày là T2 ở Amazon, T3 ở một tiệm sách địa phương, T1 ở thị trường mà mọi đối thủ đều làm được. Câu hỏi luôn là: *giá trị này đang nằm ở đâu — trong phiên sử dụng, trong con người, trong đời sống, hay trong thị trường?*

**A3 — Mọi tầng đều có mặt âm, và mặt âm tuân theo cùng cơ chế.**
Nếu T5 là thay đổi schema độc lập bối cảnh, thì T5 âm cũng độc lập bối cảnh: bạn không gỡ cài đặt được một năng lực đã teo. Đây là lý do trách nhiệm tăng theo bán kính tác động, không phải một lời khuyên đạo đức thêm vào.

**A4 — Không có test bảng hỏi.**
Người ta không biết mình sẽ thích gì, không nhớ đúng mình đã cảm thấy gì, và trả lời khác khi được hỏi khác. Mọi test trong v2.0 là quan sát hành vi, can thiệp có đối chứng, hoặc dự đoán được niêm phong.

**A5 — Một nhãn tầng chỉ hợp lệ nếu nó dẫn tới hành động khác.**
Nếu "T3" và "T4" dẫn tới cùng một việc phải làm tuần sau, sự phân biệt đó là trang trí. Mỗi tầng trong v2.0 phải có bộ đo riêng và playbook riêng, hoặc bị gộp.

---

## 2. Trục phân tầng: bán kính tác động

Đây là phần tái cấu trúc quan trọng nhất của v2.0.

v1.0 ngầm gợi ý một thang bậc từ tầm thường tới vĩ đại. Điều đó vừa sai vừa nguy hiểm — nó khiến team họp về "làm sao có T6" trong khi thanh toán đang lỗi.

Trục đúng là **bán kính**: giá trị trú ngụ ở đâu, và ai bị thay đổi.

```
T0  ├─ Giá trị trú ở: quyền được tồn tại
    │  Chủ thể bị thay đổi: không ai. Đây là điều kiện, không phải giá trị
    │
T1  ├─ Giá trị trú ở: phiên sử dụng
T2  │  Chủ thể bị thay đổi: trạng thái của phiên
T3  │
    │─────────── ranh giới Kano ───────────
    │
T4  ├─ Giá trị trú ở: tự sự bản thân người dùng
    │  Chủ thể bị thay đổi: cách người dùng hiểu về chính họ
    │
T5  ├─ Giá trị trú ở: kho hành vi, bên ngoài sản phẩm
    │  Chủ thể bị thay đổi: người dùng làm gì khi không có bạn
    │
T6  └─ Giá trị trú ở: khung tham chiếu của thị trường
       Chủ thể bị thay đổi: đối thủ, người mua, và tiêu chí so sánh
```

**Đọc thang này đúng cách:** không phải "tốt dần" mà là "**bán kính rộng dần, và trách nhiệm nặng dần**".

Ba hệ quả vận hành:

1. **T0 và T1 là điều kiện chặn, không phải hạng mục cạnh tranh ngân sách.** Một T1 hỏng vô hiệu hóa toàn bộ các tầng trên: không ai gắn bản sắc vào sản phẩm không đăng nhập được.
2. **Càng lên cao, càng khó đảo ngược sai lầm.** Sửa T2 sai mất một sprint. Sửa T4 sai mất niềm tin. Sửa T5 sai thì không sửa được.
3. **Càng lên cao, càng ít thiết kế được trực tiếp.** T1–T3 thiết kế được. T4 thiết kế ngược từ câu hỏi bản sắc. T5 thiết kế ngược từ job ngoài sản phẩm. T6 không thiết kế — chỉ nhận diện và dồn nhanh.

---

## 3. Bảy tầng

Mỗi tầng có đúng tám trường. Nếu một trường trống, tầng đó chưa được hiểu đủ.

---

### T0 — MANDATED · Ngưỡng chính danh

> **Định nghĩa.** Yêu cầu sinh ra từ mệnh lệnh bên ngoài — pháp lý, quy định, chuẩn bắt buộc — mà việc không đáp ứng dẫn tới mất quyền hoạt động, không phải mất sự hài lòng.

**Cơ chế.** Giấy phép hoạt động. Ngưỡng do cơ quan thứ ba định nghĩa, không do người dùng định nghĩa, và không thương lượng được bằng nghiên cứu người dùng.

**Điều kiện nhận diện.**
- Có một ngày tháng cụ thể trong văn bản
- Hậu quả khi thiếu là phạt, cấm bán, hoặc mất giấy phép — không phải churn
- Đường cong là hàm bậc thang, không phải dốc dần
- Không tồn tại khái niệm "đủ tốt"; chỉ có đạt hoặc không đạt

**Điều kiện LOẠI TRỪ.** Nếu ngưỡng do kỳ vọng thị trường tạo ra chứ không do văn bản bắt buộc → đó là T1, không phải T0. Nếu bạn có thể chọn không làm và chỉ chịu hậu quả cạnh tranh → T1.

**Test (≤90 ngày).** Kiểm toán tuân thủ theo từng điều khoản, đối chiếu với deadline. Kết quả nhị phân, không có thang điểm.

**Mặt âm — T0⁻: Tuân thủ hình thức.** Đáp ứng chữ nghĩa trong khi phá vỡ mục đích. Banner cookie thiết kế để người dùng bấm "đồng ý tất cả". Nhãn AI đặt ở nơi không ai nhìn. T0⁻ đạt tuân thủ pháp lý và tích lũy nợ tin cậy — và cơ quan quản lý sẽ đóng khe hở đó ở vòng sau, với chi phí cao hơn.

**Chiến lược đầu tư.** Nhị phân, theo deadline, tách hoàn toàn khỏi roadmap sản phẩm. Không bao giờ để T0 cạnh tranh nguồn lực với tính năng — nó không cùng loại. Có một chủ sở hữu có tên và một lịch riêng.

**Sai lầm thường gặp.** Xếp T0 vào backlog sản phẩm và để nó thua các tính năng "có tác động cao hơn". Đây là lỗi phân loại có giá bằng phần trăm doanh thu.

**Ví dụ.** Nghĩa vụ minh bạch AI (chatbot phải cho biết là AI, nội dung tổng hợp phải đánh dấu máy-đọc-được) · Xuất dữ liệu theo GDPR · Tiếp cận WCAG trong khu vực công · An toàn thực phẩm · Khả năng tương tác ngân hàng mở.

---

### T1 — THRESHOLD · Ngưỡng tham gia

> **Định nghĩa.** Sự vắng mặt tạo bất mãn; sự hiện diện không được chú ý. Điều kiện tối thiểu để tham gia thị trường, không tạo lợi thế.

**Cơ chế.** Bất đối xứng tiêu cực. Hệ nhận thức xử lý sự thiếu hụt mạnh hơn sự đầy đủ — thiếu tạo tín hiệu, đủ tạo im lặng.

**Điều kiện nhận diện.**
- Không xuất hiện trong đánh giá tích cực
- Xuất hiện trong khiếu nại khi thiếu
- Mọi đối thủ đều có
- Người dùng bối rối trước câu hỏi "bạn muốn nó tốt hơn 20% không?"

**Điều kiện LOẠI TRỪ.** Nếu gỡ đi trong một holdout 2 tuần mà tỷ lệ khiếu nại không tăng có ý nghĩa → **không phải T1**. Đây là test đắt giá nhất trong tầng này: phần lớn những gì team gọi là "must-have" không qua được nó, và mỗi cái không qua là nguồn lực được giải phóng.

**Test (≤90 ngày).** Holdout gỡ tính năng ở 1–2% người dùng, 14 ngày. Đo tỷ lệ khiếu nại trên 1.000 phiên và tỷ lệ hoàn thành tác vụ so với nhóm đối chứng.

**Mặt âm — T1⁻: Nền tảng hỏng có chủ đích.** Làm suy giảm chức năng cơ bản để ép nâng cấp, khi giới hạn không phản ánh chi phí thật. Khác biệt với phân tầng giá lành mạnh: phân tầng lành mạnh giới hạn *quy mô*; T1⁻ giới hạn *tính khả dụng*.

**Chiến lược đầu tư.** Đầu tư đủ để không bị khiếu nại, rồi dừng. Chuyển sang giám sát bằng SLA thay vì chu kỳ roadmap. Vượt ngưỡng T1 không sinh ra thỏa mãn — chỉ sinh ra chi phí bảo trì.

**Sai lầm thường gặp.** Đánh bóng T1 vì nó dễ đo và dễ hoàn thành, trong khi T1 đã ở trên ngưỡng từ lâu.

**Ví dụ.** Đăng nhập hoạt động · Nút quay lại · Lịch sử đơn hàng · Thanh toán không mất tiền · Dữ liệu không mất.

---

### T2 — PROPORTIONAL · Tỉ lệ thuận

> **Định nghĩa.** Giá trị cảm nhận tăng gần như tuyến tính theo chất lượng hoặc số lượng, trong một khoảng cảm nhận được, cho tới điểm bão hòa.

**Cơ chế.** Tích lũy hiệu dụng tuyến tính, **bị chặn bởi ngưỡng phân biệt**. Đây là bổ sung của v2.0: T2 không tuyến tính vô hạn. Nó tuyến tính trong vùng mà cải thiện vượt ngưỡng cảm nhận, và bằng 0 ở dưới ngưỡng đó — bất kể bạn đo được bao nhiêu phần trăm trong phòng thí nghiệm.

**Điều kiện nhận diện.**
- Xuất hiện trong so sánh trực tiếp với đối thủ
- Người dùng nói được mức độ họ muốn ("pin gấp đôi")
- Benchmark là ngôn ngữ tự nhiên trong ngành

**Điều kiện LOẠI TRỪ.** Nếu mức cải thiện dự kiến **nhỏ hơn JND** (ngưỡng phân biệt được) → cải thiện đó không tạo giá trị T2 nào, chỉ tạo một dòng trong release note. Nếu đã vượt điểm bão hòa của ngành → đó là T1, nhiều hơn không còn tốt hơn.

**Test (≤90 ngày).** **Đo JND bằng thử nghiệm bậc thang:** cho người dùng cặp phiên bản chênh x%, giảm dần x, tìm giá trị nhỏ nhất mà 75% phát hiện được khác biệt. Đây là công cụ từ tâm vật lý học mà ngành sản phẩm hầu như không dùng, và nó cắt bỏ một lượng lớn công việc vô ích.

**Quy tắc phát hành T2:** *nếu Δ dự kiến < JND, đừng ship riêng. Gộp lại tới khi vượt JND rồi phát hành một lần.*

**Mặt âm — T2⁻: Chạy đua vô nghĩa.** Cải thiện dưới JND nhưng vẫn truyền thông như khác biệt. Megapixel, hertz, số tham số. T2⁻ không lừa được người dùng lâu, nhưng nó lừa được chính tổ chức — đội ngũ kiệt sức vì "cải tiến liên tục" mà không ai nhận ra.

**Chiến lược đầu tư.** Xác định ngưỡng "đủ tốt" của ngành, vượt qua nó, rồi ngừng cạnh tranh ở đó. Không cần dẫn đầu mọi T2. Trong bối cảnh năng lực nền đang được bán như tiện ích, giả định mặc định nên là: **đầu tư T2 khấu hao theo quý, không theo năm.**

**Sai lầm thường gặp.** Coi T2 là nơi an toàn để cạnh tranh vì nó đo được. Nó đo được chính vì đối thủ cũng đo được.

**Ví dụ.** Tốc độ phản hồi · Dung lượng pin · Độ chính xác gợi ý · Độ phủ dữ liệu · Thời gian xử lý hỗ trợ.

---

### T3 — DELIGHT · Bất ngờ tích cực

> **Định nghĩa.** Tạo cảm xúc tích cực không dự đoán được khi có mặt; không gây bất mãn khi vắng mặt. Giá trị nằm ở độ lệch so với kỳ vọng, không ở chức năng.

**Cơ chế.** Vi phạm kỳ vọng theo hướng tích cực. Hiệu ứng suy yếu khi kỳ vọng tự điều chỉnh lên — **đây là quy luật, không phải lỗi thực thi**.

**Điều kiện nhận diện.**
- Chia sẻ tự nguyện, ngôn ngữ ngạc nhiên
- Ảnh chụp màn hình lan truyền
- Đối thủ chưa có

**Điều kiện LOẠI TRỪ.** Nếu nội dung chia sẻ nói về **người dùng** chứ không về **sản phẩm** → đó là T4. Nếu hiệu ứng không suy giảm sau 2 quý mà không có cơ chế biến thiên nào → phân loại lại; có thể nó đã là T2 hoặc T4.

**Test (≤90 ngày).** Tỷ lệ chia sẻ không được nhắc, đo ở tuần 1, 12, 26. Khớp hàm mũ để lấy **nửa đời của tỷ lệ chia sẻ**. Half-life là chỉ số quản trị chính của T3, không phải mức đỉnh.

**Mặt âm — T3⁻: Dark delight.** Phần thưởng biến thiên khai thác hệ dopamine mà không tạo giá trị tương ứng. Loot box, kéo-để-làm-mới, thông báo giả khẩn cấp. **Test phân biệt:** nếu người dùng biết trước chính xác cơ chế xác suất, họ có vẫn muốn nó không? Bất ngờ lành mạnh sống sót qua sự minh bạch; T3⁻ thì không.

**Chiến lược đầu tư.** Quản lý như **danh mục có lịch đáo hạn**, không như tính năng. Mỗi T3 có shelf-life; vấn đề không phải giữ một T3 sống mãi mà là luôn có T3 mới. Cơ chế chống thích nghi: **cấu trúc chứa sự bất định, không phải nội dung chứa sự bất định** — hộp đăng ký hàng tháng, sự kiện giới hạn thời gian, xoay vòng theo mùa.

**Sai lầm thường gặp.** Đầu tư một lần rất lớn vào một T3 và coi đó là tài sản vĩnh viễn. Nó là tài sản khấu hao nhanh.

**Ví dụ.** Giao hàng sớm hơn cam kết kèm chi tiết cá nhân · Gợi ý đúng lúc mà người dùng không biết mình cần · Easter egg ẩn · Xử lý ngoại lệ vượt kỳ vọng khi có sự cố.

---

### T4 — SYMBOLIC · Bản sắc

> **Định nghĩa.** Đóng góp vào tự sự bản thân, bản sắc xã hội, hoặc tín hiệu địa vị của người dùng. Giá trị nằm ở điều tính năng **nói lên người dùng là ai**, không ở điều nó làm.

**Cơ chế.** Tín hiệu bản sắc — ra ngoài (báo hiệu cho người khác) và vào trong (tự chứng minh cho chính mình). Hai chiều này độc lập: đồ thị đóng góp trên hồ sơ lập trình viên có giá trị ngay cả khi không ai xem, vì nó là bằng chứng người ta dùng để suy luận về chính mình.

**Điều kiện nhận diện.**
- Nội dung chia sẻ nói về bản thân, không về sản phẩm
- Tính năng xuất hiện trong tiểu sử, hồ sơ, giới thiệu
- Cộng đồng hình thành quanh bản sắc chung, không quanh sản phẩm
- Người dùng cá nhân hóa và chia sẻ *phiên bản của họ*

**Điều kiện LOẠI TRỪ — ba cái, đều cứng.**
1. **Loại trừ theo miền.** Bản sắc có tính miền. Người ta phân kỳ trong các lĩnh vực mang tính bản sắc (âm nhạc, kiểu tóc, nghề nghiệp) nhưng không phân kỳ ở lĩnh vực chức năng trung tính (ba lô, ổ cắm điện). Nếu tính năng nằm ở miền phi-bản-sắc → không phải T4, bất kể bạn thiết kế thế nào.
2. **Loại trừ theo tính đồng nhất.** Nếu mọi người dùng nhận kết quả giống nhau → không phải T4. Huy hiệu trao cho tất cả không phải bản sắc; đó là trang trí. **Test:** nếu người dùng biết ai cũng có cái này, họ có vẫn chia sẻ không?
3. **Loại trừ theo quyền tác giả.** Nếu tự sự do hệ thống sinh ra chứ không do dữ liệu của người dùng quyết định → đó là **T4⁻**, không phải T4.

**Test (≤90 ngày).**
- **Tỷ lệ tự quy chiếu:** phân tích nội dung chia sẻ công khai, đo tỷ lệ chú thích dùng đại từ ngôi thứ nhất so với tên sản phẩm. Trên 60% → T4 xác nhận.
- **Dilution Index** = (tỷ lệ chia sẻ tự nguyện) ÷ (tỷ lệ thâm nhập trong nhóm tham chiếu của người dùng), theo dõi hàng quý.

**Cơ chế riêng của T4 — VÁCH PHA LOÃNG.**

Đây là điểm v1.0 sai và v2.0 sửa. v1.0 nói T4 suy giảm thành T3 khi bị thương phẩm hóa. Cơ chế thật khác hẳn:

> Tín hiệu bản sắc mất giá trị không bằng cách mờ dần, mà bằng cách **bị pha loãng rồi bị chủ động ruồng bỏ**. Khi nhóm ngoài không mong muốn nhận nuôi tín hiệu, giá trị không tiến về 0 — nó **đi qua 0 và thành âm**, vì tiếp tục dùng sẽ báo hiệu một bản sắc mà người dùng không muốn.

Đường cong T4 không phải dốc xuống. Nó là mỏm đá.

Điều này giải thích những thứ Kano không giải thích được: tại sao tính năng bản sắc chết đột ngột thay vì mờ dần; tại sao "ai cũng có" độc hại với T4 theo cách không độc hại với T2; tại sao cộng đồng sớm rời nền tảng đúng vào lúc nó phổ cập.

**Đối sách — quy mô không pha loãng T4 nếu tín hiệu đủ nhiều chiều.**

Pha loãng xảy ra khi tín hiệu là **nhị phân** (huy hiệu có/không). Nó không xảy ra khi tín hiệu là **vector**. Một bản tổng kết cá nhân với sáu chiều dữ liệu cho mỗi người một tổ hợp gần như duy nhất — 200 triệu người cùng chia sẻ trong 24 giờ mà tín hiệu vẫn không bị pha loãng, vì không ai chia sẻ *cùng một tín hiệu*.

**Quy tắc thiết kế T4:** *chuyển tín hiệu từ nhị phân sang vector trước khi thâm nhập vượt 20% nhóm tham chiếu.*

**Mặt âm — T4⁻: Bản sắc áp đặt.** Sản phẩm kể cho người dùng nghe họ là ai thay vì phản chiếu họ thật sự là ai. Cơ chế gây hại: một tự sự sai về bản thân không chỉ vô dụng, nó **làm ô nhiễm bằng chứng mà người ta dùng để tự suy luận về chính mình**. Đây là lý do ngưỡng chịu lỗi ở T4 thấp hơn hẳn mọi tầng khác.

> **Hệ quả cứng:** ở T4, độ chính xác không phải chỉ số chất lượng — nó là **điều kiện tồn tại của tầng**. Một T4 sai 10% không phải T4 kém 10%. Nó là T4⁻.

Cảnh báo đo lường: ở một cú hỏng T4, **chỉ số tiếp cận vẫn tăng**. Reach không phát hiện được hỏng hóc T4. Chỉ tỷ lệ tự quy chiếu và sắc thái nội dung chia sẻ mới bắt được.

**Chiến lược đầu tư.** Thiết kế ngược từ câu hỏi *"nhóm người dùng này muốn được nhìn nhận là ai?"* — không phải *"họ muốn làm gì?"*. Sau đó: dữ liệu thô để người dùng tự diễn giải luôn thắng kết luận do hệ thống sinh ra.

**Ví dụ.** Bản tổng kết cá nhân dựa trên hành vi thật · Đồ thị đóng góp của lập trình viên · Thành tích thể thao có thứ hạng thật · Vòng hoạt động sức khỏe · Danh hiệu chủ nhà đạt được bằng hiệu suất thật.

---

### T5 — TRANSFORMATIVE · Chuyển hóa

> **Định nghĩa.** Thay đổi schema hành vi của người dùng theo cách **độc lập bối cảnh**: hành vi mới tồn tại ngay cả khi tín hiệu của sản phẩm biến mất, vì schema đã chuyển giao khỏi sản phẩm.

**Cơ chế.** Thay thế hoặc nâng cấp mô hình tư duy chi phối hành vi tự động. Đây là thay đổi ở tầng kiến trúc nhận thức, không phải tầng sở thích.

**Điều kiện nhận diện.**
- Ngôn ngữ "hồi chưa có" / "từ khi có"
- Thay đổi hành vi đo được **bên ngoài** sản phẩm
- Người dùng cũ tự phát hướng dẫn người dùng mới
- Người dùng mang hành vi sang sản phẩm khác khi đổi nền tảng

**Điều kiện LOẠI TRỪ — đây là test quan trọng nhất trong cả framework.**

> **TEST GỠ SẢN PHẨM.** Chọn ngẫu nhiên một cohort có bồi thường. Tước quyền truy cập tính năng trong 30 ngày. Đo hành vi mục tiêu **ở ngoài sản phẩm** tại ngày 30 và ngày 90, bằng công cụ đo độc lập.
>
> Giữ ≥70% baseline ở ngày 90 → **T5 xác nhận.**
> Sập về baseline → **không phải T5.** Đó là hệ thống cue–reward vận hành tốt, tức là T3 được lặp lại có kỷ luật, hoặc là sự phụ thuộc.

Test này có răng thật. Nó loại rất nhiều thứ đang tự nhận là T5:

- **Chuỗi ngày liên tiếp (streak) không phải T5.** Gỡ app, cue biến mất, hành vi sập. Nó là T3 vận hành có kỷ luật với cơ chế biến thiên. (v1.0 xếp nhầm cái này — v2.0 sửa.)
- **Nhắc nhở không phải T5.** Cùng lý do.
- **Tự động lưu là T5.** Bề mặt là T1 tầm thường, không ai khen. Nhưng người quen tự động lưu, khi dùng phần mềm không có nó, **vẫn không bấm lưu**, và mất dữ liệu. Schema đã đổi độc lập bối cảnh. Đây là bằng chứng sạch nhất cho định nghĩa mới — và đồng thời là bằng chứng cho T5⁻.

**Mặt âm — T5⁻: Thoái kỹ năng.** Schema bị *thay thế* thay vì được *nâng cấp*; năng lực nền teo đi. Và vì T5 độc lập bối cảnh, **T5⁻ cũng độc lập bối cảnh: không gỡ cài đặt được một năng lực đã mất.**

Đây là trung tâm đạo đức của framework:

> Mỗi lần bạn thiết kế T5, bạn đang chọn một năng lực để thay thế. Câu hỏi thiết kế đúng không phải *"chúng ta trao cho người dùng năng lực gì"* mà là *"chúng ta lấy đi năng lực gì, và họ có đồng ý với giao dịch đó nếu được hỏi rõ ràng."*

**Phân biệt thay thế và nâng cấp** — đây là đòn bẩy thiết kế lớn nhất ở T5:

| | Thay thế schema | Nâng cấp schema |
|---|---|---|
| Cơ chế | Hệ thống làm thay công việc nhận thức | Hệ thống làm thay phần cơ học, giải phóng năng lực cho tầng cao hơn |
| Kết quả | Năng lực nền teo | Năng lực nền chuyển lên mức trừu tượng cao hơn |
| Ví dụ | Máy tính bỏ túi và tính nhẩm | Bảng tính và tư duy mô hình hóa |
| Test | Gỡ công cụ → người dùng bất lực | Gỡ công cụ → người dùng chậm hơn nhưng vẫn làm được, và tư duy ở mức cao hơn trước |

**Chiến lược đầu tư.** Không thiết kế được bằng cách hỏi "người dùng muốn tính năng gì". Quy trình bốn bước ở mục 9.3.

**Ví dụ.** Điều hướng bằng bản đồ số (T5 rõ, kèm T5⁻ về định hướng không gian) · Tự động lưu · Tìm kiếm toàn văn thay cho việc ghi nhớ vị trí tài liệu · Bảng tính · Một hệ thống review nội bộ đủ tốt đến mức nhân viên mang cách tư duy đó sang công ty khác.

---

### T6 — PARADIGMATIC · Dịch chuyển khung

> **Định nghĩa.** Dịch chuyển chính khung tham chiếu cạnh tranh, khiến hệ thống giá trị hiện hành trở nên không liên quan. Không cải thiện sản phẩm trong danh mục — định nghĩa lại danh mục.

**Cơ chế.** Phá vỡ mô hình tư duy mà cả người mua lẫn đối thủ dùng để đánh giá. Dấu hiệu đặc trưng: **một câu hỏi so sánh ngừng được hỏi.**

**Điều kiện nhận diện.**
- Đối thủ buộc phải sửa lộ trình sản phẩm
- Báo chí ngành bắt đầu dùng thuộc tính này làm trục so sánh mặc định
- Các câu hỏi so sánh cũ biến mất khỏi hội thoại bán hàng

**Điều kiện LOẠI TRỪ.** Nếu đối thủ có thể sao chép trong một chu kỳ phát hành mà không phải đổi kiến trúc hoặc mô hình kinh doanh → **không phải T6, đó là T3**. Rất viral không có nghĩa là paradigmatic.

**Test — PHIẾU TIỀN ĐĂNG KÝ.**

v1.0 dùng test hồi cứu 3–5 năm. Test đó không giúp gì cho quyết định hôm nay và đảm bảo mọi ca được kể lại đều là ca thắng. Thay bằng:

> Để tuyên bố một tính năng là T6, viết ra **trước khi ra mắt**, có ngày tháng và tên cụ thể:
>
> 1. **Ba số đo cạnh tranh** sẽ trở nên vô nghĩa — và ai đang dùng chúng hôm nay (tên ấn phẩm, tên bảng so sánh cụ thể)
> 2. **Hai đối thủ có tên** buộc phải đưa hạng mục tương đương vào lộ trình, kèm **quý dự đoán**
> 3. **Một câu hỏi so sánh** người mua đang hỏi hôm nay và sẽ ngừng hỏi
>
> Niêm phong. Mở sau 18 tháng. Sai ≥2/3 → đó là T3, và quản lý như T3 từ đó.

**Bối cảnh cần biết khi dùng T6.** Nền lý thuyết của tầng này (disruption) đã bị kiểm tra thực nghiệm: trong một khảo sát 79 chuyên gia trên 77 ca mà chính tác giả lý thuyết tuyển chọn làm ví dụ, chỉ 7 ca — 9% — chứa đủ bốn yếu tố cốt lõi. Kết luận đúng không phải vứt bỏ lý thuyết mà là: **T6 nếu không tiền đăng ký thì chỉ là một nhãn kể chuyện hậu nghiệm.** Con số 9% nên được ghi nhớ mỗi lần ai đó trong phòng họp nói "cái này sẽ là T6".

**Mặt âm — T6⁻: Chuẩn mực xấu toàn ngành.** Thiết lập baseline mà mọi đối thủ buộc phải theo kể cả khi ai cũng biết nó có hại. Kỳ thị xã hội gắn vào một giao thức nhắn tin; mô hình tương tác vô hạn; cơ chế may rủi trong sản phẩm cho trẻ em. T6⁻ kết thúc bằng quy định — nên nhận diện T6⁻ của đối thủ sớm là công cụ quản trị rủi ro pháp lý, không chỉ đạo đức.

**Chiến lược đầu tư.** T6 không có ngân sách. Nó có **năng lực nhận diện** (mục 10.6). Bốn cơ chế cụ thể thay cho lời khuyên "hãy nhạy bén".

**Ví dụ.** Một kho ứng dụng biến câu hỏi "máy nào có bàn phím tốt nhất" thành vô nghĩa · Phát trực tuyến xóa bỏ toàn bộ đề xuất giá trị của cửa hàng cho thuê băng đĩa · Giao thông thời gian thực biến bản đồ tĩnh thành không đủ.

---

## 4. Trục âm — cấu trúc đầy đủ

v1.0 xử lý cái này như edge case. v2.0 coi nó ngang hàng, vì nó là nơi framework tạo ra trách nhiệm chứ không chỉ tạo ra chiến lược.

| Tầng | Mặt âm | Cơ chế gây hại | Test phát hiện |
|---|---|---|---|
| T0⁻ | Tuân thủ hình thức | Đạt chữ nghĩa, phá vỡ mục đích | Người dùng có đạt được điều quy định nhằm bảo vệ không? |
| T1⁻ | Nền tảng hỏng có chủ đích | Giới hạn tính khả dụng không phản ánh chi phí thật | Giới hạn này có tương ứng chi phí biên nào không? |
| T2⁻ | Chạy đua vô nghĩa | Cải thiện dưới JND nhưng truyền thông như khác biệt | Δ có vượt JND đo được không? |
| T3⁻ | Dark delight | Khai thác phần thưởng biến thiên không tạo giá trị tương ứng | Nếu người dùng biết chính xác cơ chế xác suất, họ có vẫn muốn không? |
| T4⁻ | Bản sắc áp đặt | Làm ô nhiễm bằng chứng người dùng dùng để tự hiểu mình | Tự sự này do dữ liệu của họ quyết định hay do mô hình của ta quyết định? |
| T5⁻ | Thoái kỹ năng | Thay thế schema thay vì nâng cấp; **không đảo ngược được** | Gỡ công cụ → bất lực, hay chậm hơn nhưng vẫn làm được? |
| T6⁻ | Chuẩn mực xấu toàn ngành | Ép cả ngành theo một baseline có hại | Nếu mọi đối thủ đều làm, kết quả tổng cho người dùng tốt hơn hay tệ hơn? |

**Quy tắc trách nhiệm theo bán kính:** mức độ thẩm định phải tăng theo tầng, vì khả năng sửa sai giảm theo tầng.

- T0–T2: kiểm tra chất lượng thông thường
- T3: kiểm tra một câu — cơ chế này có sống sót qua sự minh bạch không?
- T4: **bắt buộc có kiểm toán quyền tác giả** trước khi phát hành
- T5: **bắt buộc có kiểm toán thoái kỹ năng** trước khi phát hành, ghi ra bằng văn bản năng lực nào sẽ teo
- T6: bắt buộc có phân tích T6⁻ — điều gì xảy ra nếu toàn ngành buộc phải theo

---

## 5. Động lực học: tầng không đứng yên

### 5.1 Bảng di chuyển

| Từ | Sang | Điều kiện | Tốc độ điển hình | Cảnh báo sớm |
|---|---|---|---|---|
| T3 | T1 | Đối thủ sao chép, kỳ vọng tăng | 2–8 quý | Half-life chia sẻ giảm dưới 2 quý |
| T2 | T1 | Ngưỡng "đủ tốt" của ngành dâng lên | 1–4 quý khi năng lực nền bị thương phẩm hóa | Δ so với đối thủ rơi xuống dưới JND |
| T6 | T1 | Toàn ngành áp dụng | 3–5 năm | Thuộc tính xuất hiện trong bảng so sánh mặc định của bên thứ ba |
| T4 | **âm** | **Vách pha loãng** — nhóm ngoài không mong muốn nhận nuôi tín hiệu | Đột ngột, một đến hai quý | Dilution Index giảm 2 quý liên tiếp trong khi thâm nhập tăng |
| T4 | **âm** | Mất quyền tác giả — tự sự do hệ thống sinh thay vì do dữ liệu người dùng | Một chu kỳ phát hành | Reach giữ nguyên nhưng sắc thái chia sẻ đảo sang chế giễu |
| T5 | không di chuyển | Schema đã chuyển giao độc lập bối cảnh | — | T5 không mất, nhưng **nền tảng mang nó thì đổi được**: người dùng mang chuyển hóa sang sản phẩm khác |
| T1 | T5 | Tính năng nền tảng âm thầm viết lại schema | Nhiều năm, không ai để ý | Test gỡ sản phẩm cho kết quả bất ngờ cao |

**Hai mục in đậm là bổ sung của v2.0.** T4 không đi xuống T3 — nó đi qua 0. Và T1 có thể nhảy thẳng lên T5 mà không ai nhận ra, đó là lý do nên chạy test gỡ sản phẩm định kỳ ngay cả với những thứ trông tầm thường.

### 5.2 Tính năng vận hành ở nhiều tầng

Không phải lỗi phân loại — là dấu hiệu tính năng mạnh. Quy tắc xử lý:

> **Phân loại theo tầng cao nhất khi ra chiến lược. Thiết kế và đo lường cho từng tầng riêng biệt. Kiểm toán rủi ro theo tầng cao nhất.**

Ví dụ: một bản tổng kết cá nhân cuối năm có thể là T3 (bất ngờ) + T4 (bản sắc) + T6 (ép cả ngành làm theo). Chiến lược quản lý nó như T6. Nhưng chỉ số theo dõi hàng tuần là chỉ số T4 (tỷ lệ tự quy chiếu, Dilution Index), vì đó là tầng dễ vỡ nhất — và khi nó vỡ, chỉ số T6 và T3 vẫn đẹp.

**Quy tắc kèm theo:** *tầng dễ vỡ nhất quyết định bộ chỉ số vận hành, không phải tầng cao nhất.*

---

## 6. Bộ đo

Toàn bộ là test hành vi hoặc can thiệp. Không có bảng hỏi thỏa mãn.

| Tầng | Chỉ số dẫn | Phương pháp | Ngưỡng quyết định |
|---|---|---|---|
| T0 | Khoảng cách tới deadline × mức hoàn thành theo từng điều khoản | Kiểm toán tuân thủ | Nhị phân |
| T1 | Khiếu nại / 1.000 phiên; tỷ lệ hoàn thành tác vụ | **Holdout gỡ tính năng**, 1–2%, 14 ngày | Khiếu nại tăng có ý nghĩa → T1 thật. Không đổi → cân nhắc cắt |
| T2 | **JND** | Thử nghiệm bậc thang tìm Δ nhỏ nhất mà 75% phát hiện | Δ dự kiến < JND → không ship riêng |
| T3 | **Half-life của tỷ lệ chia sẻ** | Đo tuần 1 / 12 / 26, khớp hàm mũ | < 2 quý → cần cơ chế biến thiên |
| T4 | **Tỷ lệ tự quy chiếu** + **Dilution Index** | Phân tích ngôn ngữ nội dung chia sẻ công khai; theo dõi hàng quý | Tự quy chiếu > 60% → T4 thật. DI giảm 2 quý → kích hoạt đối sách |
| T5 | **Test gỡ sản phẩm 30/90 ngày** | Cohort ngẫu nhiên có bồi thường, đo bằng công cụ độc lập, đo hành vi ngoài sản phẩm | Giữ ≥70% baseline ngày 90 → T5 |
| T6 | **Phiếu tiền đăng ký** | Niêm phong trước ra mắt, mở sau 18 tháng | Sai ≥2/3 → hạ về T3 |

**Ba chỉ số phản-chỉ-báo cần theo dõi riêng** — những thứ trông tốt trong khi tầng đang hỏng:

1. **Reach ở T4.** Tiếp cận có thể đạt kỷ lục đúng vào chu kỳ mà tính năng bản sắc hỏng nặng nhất.
2. **Engagement ở T3⁻.** Dark delight tối ưu engagement rất tốt. Engagement cao không phân biệt được T3 và T3⁻.
3. **Năng suất ở T5⁻.** Thoái kỹ năng luôn xuất hiện lần đầu dưới dạng tăng năng suất. Chỉ số năng suất không phát hiện được nó; chỉ test gỡ sản phẩm mới phát hiện.

---

## 7. Quy tắc phân bổ nguồn lực

Đây là chỗ A5 được thực thi: nhãn tầng phải đổi cách tiêu tiền.

**QT-1 — Trần T0/T1.**
> Không phân bổ nguồn lực cho T4–T6 khi bất kỳ T0 nào chưa đạt hoặc bất kỳ T1 nào ở dưới ngưỡng. Đây là ràng buộc cứng, không phải ưu tiên có thể thương lượng.

**QT-2 — Sàn T1.**
> Không đầu tư vượt ngưỡng T1 sau khi đã đạt ngưỡng. Chuyển sang giám sát SLA. Mọi giờ công vượt trần T1 là giờ công bị lấy từ tầng khác.

**QT-3 — Cổng JND cho T2.**
> Không phát hành cải thiện T2 dưới ngưỡng JND. Gộp tới khi vượt.

**QT-4 — Phân bổ mặc định.**
> 70% cho T0–T2 · 20% cho T3–T4 · 10% cho đặt cược T5 · T6 không có ngân sách, có cơ chế nhận diện.
>
> Hiệu chỉnh theo giai đoạn: sản phẩm mới dồn T1–T2; sản phẩm trưởng thành trong thị trường bão hòa dịch sang T4–T5; sản phẩm trong ngành đang bị thương phẩm hóa năng lực nền phải dịch mạnh sang T5 vì T2 hết giá trị phòng thủ.

**QT-5 — Cổng kiểm toán.**
> Không phát hành T4 mà không có kiểm toán quyền tác giả. Không phát hành T5 mà không có kiểm toán thoái kỹ năng bằng văn bản.

**QT-6 — Danh mục T3.**
> Duy trì tối thiểu ba T3 ở các giai đoạn shelf-life khác nhau. T3 được quản lý như danh mục có lịch đáo hạn, không như tính năng.

---

## 8. Điều kiện biên và quy tắc phân xử

Khi hai người trong phòng phân loại khác nhau, dùng thứ tự này. Dừng ở test đầu tiên cho kết quả rõ.

**T1 ↔ T2.** Hỏi "bạn muốn nó tốt hơn 20% không?" — hiểu ngay và trả lời có → T2. Bối rối ("tốt hơn nghĩa là sao?") → T1.

**T2 ↔ T3.** Nếu bạn công bố trước "chúng tôi sẽ cải thiện X", người dùng có kỳ vọng nó không? Có → T2. Nếu ngay cả khi được báo trước vẫn tạo ngạc nhiên → T3.

**T3 ↔ T4.** Nội dung chia sẻ nói về **sản phẩm** hay về **người chia sẻ**? Đây là câu hỏi phân xử duy nhất cần thiết, và nó đo được bằng phân tích ngôn ngữ chứ không cần tranh luận.

Bảng đối chiếu:

| Chiều | T3 | T4 |
|---|---|---|
| Đối tượng của phản ứng | Sản phẩm | Bản thân người dùng |
| Nội dung chia sẻ | "Cái này hay quá" | "Đây là tôi" |
| Cảm xúc | Ngạc nhiên → vui → quên | Nhận diện → gắn bó → lặp lại |
| Shelf life | Ngắn, decay theo kỳ vọng | Dài, nhưng có vách pha loãng |
| Rủi ro | Suy giảm thành T1 | **Đi qua 0 thành âm** |
| Câu hỏi thiết kế | "Làm sao tạo bất ngờ?" | "Người dùng muốn là ai?" |
| Chế độ hỏng | Nhạt dần | Vỡ đột ngột |

**T4 ↔ T5.** Khi người dùng **không** dùng sản phẩm, đời sống họ có khác không? Chỉ khác *bên trong* sản phẩm → T4. Khác *bên ngoài* → T5. Xác nhận bằng test gỡ sản phẩm.

**T5 ↔ T6.** T5 thay đổi đời sống của từng người dùng. T6 thay đổi kỳ vọng của cả thị trường với một danh mục. Xác nhận bằng phiếu tiền đăng ký.

**T1 ↔ T5 (ca nhảy cấp).** Hỏi: *"bạn làm gì khác vì có tính năng này?"* Nếu câu trả lời là hành vi bên ngoài sản phẩm → T5, dù bề mặt trông như T1. Chạy test gỡ sản phẩm định kỳ với các tính năng nền tảng cũ — đây là nơi những T5 chưa được nhận diện đang ẩn.

---

## 9. Quy trình thiết kế — dùng SFIM để tạo ra, không chỉ để phân loại

Đây là phần v1.0 không có, và là phần biến framework thành tiêu chuẩn sản xuất.

### 9.1 Trình tự dựng một sản phẩm từ con số không

1. **Lập bản đồ T0.** Trước mọi thứ khác. Liệt kê mọi nghĩa vụ bắt buộc kèm ngày tháng, gán một chủ sở hữu có tên, đặt ra ngoài roadmap. Nếu bỏ qua bước này, bạn sẽ phát hiện nó ở thời điểm đắt nhất.
2. **Xác định ngưỡng T1 của ngành, không phải của bạn.** T1 là do thị trường định nghĩa. Khảo sát đối thủ và khiếu nại công khai của họ, không khảo sát người dùng của mình.
3. **Chọn đúng một T2 để dẫn đầu.** Một, không phải tất cả. Đo JND của nó trước khi cam kết nguồn lực — nếu ngành đã vượt ngưỡng bão hòa ở chiều đó, chọn chiều khác.
4. **Trả lời câu hỏi bản sắc trước khi thiết kế T3.** *"Nhóm người dùng này muốn được nhìn nhận là ai?"* Câu trả lời định hình mọi T3 và T4 sau đó. Nếu chưa trả lời được, T3 của bạn sẽ là hiệu ứng rời rạc, không tích lũy thành gì.
5. **Lập bản đồ job ngoài sản phẩm cho T5.** Hỏi về đời sống, không hỏi về sản phẩm.
6. **Chỉ sau khi 1–5 xong**, mới dựng roadmap. Roadmap là kết quả của bản đồ tầng, không phải ngược lại.

### 9.2 Thiết kế T4 — năm bước

1. **Câu hỏi nền:** nhóm này muốn được nhìn nhận là ai? Viết ra dưới dạng câu người dùng thật sẽ nói, không phải persona marketing.
2. **Kiểm tra miền:** lĩnh vực này có mang tính bản sắc không, hay là miền chức năng trung tính? Nếu trung tính, dừng lại — không có T4 ở đây, và cố ép sẽ ra huy hiệu vô nghĩa.
3. **Thiết kế tín hiệu dạng vector, không dạng nhị phân.** Tối thiểu ba chiều dữ liệu độc lập để mỗi người dùng nhận một tổ hợp gần như duy nhất.
4. **Kiểm toán quyền tác giả.** Với mỗi thành phần của tự sự, trả lời: điều này do dữ liệu của họ quyết định, hay do mô hình của ta quyết định? Mọi thành phần thuộc loại thứ hai là rủi ro T4⁻.
5. **Thiết kế ngữ cảnh chia sẻ.** Họ chia sẻ ở đâu, cho ai, kèm câu gì? Nếu bạn không thiết kế điều này, nền tảng xã hội sẽ thiết kế nó thay bạn và thường theo hướng làm giảm tính tự quy chiếu.

### 9.3 Thiết kế T5 — bốn bước, bắt buộc theo thứ tự

1. **Job mapping ngoài sản phẩm.** Công việc nào trong đời sống người dùng đang được làm kém hiệu quả, hoặc không được làm? Hỏi về đời sống. Nếu câu trả lời có tên sản phẩm của bạn trong đó, bạn đang hỏi sai.
2. **Viết ra schema mục tiêu thành một câu:** *"Hiện tại người dùng nghĩ X. Sau tính năng này họ sẽ nghĩ Y."* Nếu không viết được thành một câu, bạn chưa có T5 — bạn có một T2 được kỳ vọng quá mức.
3. **Kiểm toán thoái kỹ năng.** Năng lực nào sẽ teo? Ghi ra bằng văn bản. Rồi hỏi: có cách nào **nâng cấp** schema thay vì **thay thế** nó không? Nếu có, chọn cách đó — nó cho cùng giá trị T5 mà không kèm T5⁻.
4. **Tiền đăng ký ngưỡng test gỡ sản phẩm** trước khi phát hành. Viết ra bạn kỳ vọng giữ bao nhiêu phần trăm baseline ở ngày 90.

### 9.4 Kiểm tra T6 — bốn câu hỏi

1. **Phản ứng đối thủ:** họ buộc phải đổi lộ trình, hay có thể phớt lờ?
2. **Lớp tham chiếu:** tính năng này có làm một số đo cạnh tranh cũ trở nên không liên quan không?
3. **Dịch chuyển baseline:** sau 3–5 năm nó có thành T1 cho toàn ngành không?
4. **Tạo danh mục:** đây là sản phẩm tốt hơn trong danh mục cũ, hay là danh mục mới?

Nếu bất kỳ câu nào trả lời "không chắc" → chưa phải T6. Điền phiếu tiền đăng ký hoặc phân loại lại thành T3.

---

## 10. Playbook chẩn đoán

### 10.1 T0 trượt deadline
Tách khỏi roadmap ngay, gán chủ sở hữu có thẩm quyền dừng phát hành, đặt lịch riêng. Nếu T0 đang cạnh tranh nguồn lực với tính năng, vấn đề là cấu trúc quản trị chứ không phải nguồn lực.

### 10.2 T1 hỏng
Chạy holdout để xác nhận cái nào là T1 thật — nhiều thứ team tưởng là T1 thì không ai để ý khi gỡ. Sửa tới ngưỡng, dừng, chuyển sang SLA.

### 10.3 T2 lãng phí
Triệu chứng: release note dài, chỉ số không đổi, đội ngũ mệt. Chẩn đoán: đo JND — gần như luôn là cải thiện dưới ngưỡng phân biệt. Can thiệp: gộp tới khi vượt JND, hoặc chuyển nguồn lực sang tầng khác. Trong ngành đang bị thương phẩm hóa, mặc định nên là chuyển.

### 10.4 T3 hết hạn
Half-life dưới 2 quý là hành vi bình thường của T3, không phải lỗi. Lỗi là không có danh mục. Can thiệp: cơ chế biến thiên ở tầng **cấu trúc** (lịch, xoay vòng, giới hạn thời gian), không ở tầng nội dung.

### 10.5 T4 hỏng — hai chế độ khác nhau, đừng nhầm

**Chế độ A: pha loãng.** Dilution Index giảm hai quý liên tiếp trong khi thâm nhập tăng.
→ Can thiệp: tăng số chiều của tín hiệu. Chuyển từ nhị phân sang vector. Cửa sổ hành động là một đến hai quý trước vách.

**Chế độ B: mất quyền tác giả.** Reach giữ hoặc tăng nhưng sắc thái chia sẻ đảo sang chế giễu; tỷ lệ tự quy chiếu giảm.
→ Chẩn đoán: kiểm tra ai đang quyết định tự sự — dữ liệu của họ hay mô hình của bạn.
→ Can thiệp: **trả lại quyền tác giả**. Ưu tiên dữ liệu thô người dùng tự diễn giải hơn kết luận do hệ thống sinh ra. Đây là can thiệp duy nhất hiệu quả; thêm tính năng không sửa được T4⁻.

### 10.6 T6 — bốn cơ chế nhận diện

Thay cho lời khuyên "hãy nhạy bén":

1. **Nhật ký câu hỏi mua hàng.** Ghi lại hàng quý: khách hàng đang hỏi những câu so sánh nào. T6 xuất hiện dưới dạng **một câu hỏi ngừng được hỏi**. Đây là tín hiệu dẫn tốt nhất và gần như không tổ chức nào theo dõi.
2. **Phiếu tiền đăng ký** cho mọi đề xuất T6.
3. **Giám sát ngôn ngữ benchmark của bên thứ ba.** Khi báo chí ngành dùng một thuộc tính làm trục so sánh mặc định, khung đã dịch chuyển.
4. **Quyền dồn nhanh.** Cơ chế cho phép dồn nguồn lực trong một quý mà không cần chu kỳ lập kế hoạch năm. T6 không mất giá trị vì bạn nhận ra muộn — nó mất giá trị vì bạn phản ứng chậm sau khi nhận ra.

---

## 11. Thang trưởng thành S0–S4

Đánh giá mức độ một tổ chức đang thực sự vận hành SFIM, không phải mức độ họ biết về nó.

| Mức | Tên | Đặc điểm |
|---|---|---|
| **S0** | Không phân tầng | Mọi tính năng cạnh tranh trong một backlog phẳng. Ưu tiên theo tiếng nói to nhất. T0 nằm chung với việc đổi màu nút |
| **S1** | Phân loại | Team phân loại được tính năng theo tầng và đồng thuận được. Nhưng phân loại không đổi cách tiêu tiền |
| **S2** | Phân bổ | Nhãn tầng thực sự đổi phân bổ nguồn lực. Trần T0/T1 được tôn trọng. T3 được quản lý như danh mục |
| **S3** | Đo lường | Mỗi tầng có bộ đo riêng đang chạy. JND được đo trước khi ship T2. Test gỡ sản phẩm chạy ít nhất một lần mỗi năm. Dilution Index có trên dashboard |
| **S4** | Trách nhiệm | Kiểm toán quyền tác giả và kiểm toán thoái kỹ năng là cổng phát hành bắt buộc. Phiếu tiền đăng ký T6 được niêm phong và mở. Tổ chức đã từng **hủy** một tính năng vì kết quả kiểm toán trục âm |

**Test S4 duy nhất đáng tin:** tổ chức đã bao giờ hủy một tính năng có chỉ số tốt vì nó là T4⁻ hoặc T5⁻ chưa? Nếu chưa, chưa phải S4 — dù có đủ tài liệu.

Phần lớn tổ chức dừng ở S1 và tưởng mình ở S3. Khoảng cách S1→S2 là khoảng cách khó nhất, vì nó đòi hỏi từ chối công việc chứ không chỉ phân loại công việc.

---

## 12. Phiên bản vận hành — thẻ một trang

Sáu tầng dùng để phân tích. Team hàng tuần dùng ba câu hỏi:

> **1. Không có nó, người dùng có phàn nàn không?**
> → Có, và họ bối rối trước "tốt hơn 20%" → **T1**. Đầu tư tới ngưỡng rồi dừng.
> → Có, và họ hiểu ngay "tốt hơn 20%" → **T2**. Đo JND trước khi ship.
>
> **2. Khi chia sẻ, họ nói về sản phẩm hay về chính họ?**
> → Về sản phẩm → **T3**. Quản lý như danh mục có lịch đáo hạn.
> → Về chính họ → **T4**. Kiểm toán quyền tác giả, theo dõi Dilution Index.
>
> **3. Gỡ sản phẩm 30 ngày, đời sống họ ngoài sản phẩm có khác không?**
> → Không → không phải T5, dù trông giống.
> → Có, và giữ ở ngày 90 → **T5**. Kiểm toán thoái kỹ năng bắt buộc.

T0 không nằm trong ba câu hỏi vì nó không phải quyết định sản phẩm — nó là ràng buộc bên ngoài, có lịch riêng và chủ sở hữu riêng.

T6 không nằm trong ba câu hỏi vì nó không phải quyết định hàng tuần. Khi ai đó nói "cái này có thể là T6", câu trả lời là: *điền phiếu tiền đăng ký.*

---

## 13. Áp dụng ngoài phần mềm

SFIM áp dụng cho mọi hệ thống có người dùng. Bốn ví dụ triển khai đủ sâu để dùng được.

### Giáo dục
| Tầng | Ví dụ |
|---|---|
| T0 | Chuẩn an toàn, kiểm định |
| T1 | Giáo viên có mặt, tài liệu tới tay, phòng học dùng được |
| T2 | Tỷ lệ học sinh/giáo viên, giờ giảng, điểm số |
| T3 | Một thí nghiệm gây kinh ngạc, một buổi học đáng nhớ |
| T4 | "Tôi là người học được toán" — sự tự nhận diện năng lực |
| T5 | Năng lực đọc hiểu độc lập tồn tại sau khi rời trường |
| T6 | Sự tồn tại của chương trình chung khiến gia sư tư thành bổ sung chứ không phải thay thế |

**Chỗ phân bổ sai điển hình:** toàn bộ hệ đo lường nằm ở T2 (điểm số), giá trị thật nằm ở T4–T5, và T1 thì dưới ngưỡng. Vi phạm trực tiếp QT-1.
**T5⁻ cần theo dõi:** công cụ hỗ trợ viết thay thế năng lực cấu trúc lập luận thay vì nâng cấp nó.

### Y tế
T1 là hồ sơ không mất, thuốc đúng, vô trùng. T2 là thời gian chờ, tỷ lệ biến chứng. **T4 là "tôi là người kiểm soát được bệnh của mình"** — khác biệt giữa bệnh nhân tuân thủ và bệnh nhân bỏ cuộc phần lớn nằm ở tầng này, và gần như không hệ thống thanh toán nào trả tiền cho nó. **T5 là thay đổi hành vi tồn tại ngoài phòng khám** — nơi quyết định phần lớn kết quả bệnh mạn tính.

### Hạ tầng đô thị
Vỉa hè đi bộ được là T1. Giao thông công cộng đúng giờ là T2. **T5 là khi một hệ thống vận tải đủ tốt thay đổi bản đồ nhận thức về thành phố** — người ta bắt đầu nghĩ khoảng cách bằng số ga thay vì bằng phút di chuyển cá nhân; kiểm chứng được bằng chính test độc lập bối cảnh. **T6 là khi thành phố đạt ngưỡng đi bộ được và câu hỏi "chỗ đó có chỗ đậu xe không" ngừng được hỏi.**

### Hệ thống nội bộ tổ chức
T1 là công cụ chạy, quyền truy cập đúng. **T4 là "ở đây, người như tôi được coi trọng"** — văn hóa vận hành đúng như một tính năng T4, và nó có vách pha loãng riêng: khi tín hiệu thuộc về ("chúng ta là công ty của những người X") bị nhóm không phù hợp nhận nuôi, nhân sự cốt lõi rời đi đột ngột chứ không giảm dần. **T5 là khi một quy trình review đủ tốt đến mức nhân viên mang cách tư duy đó sang công ty khác.** Đây là định nghĩa chặt và kiểm chứng được của "văn hóa tốt".

---

## 14. Bộ prompt

### 14.1 System prompt — SFIM v2.0

```
You are a product design advisor using SFIM v2.0 (Stratified Feature Impact Model).

SFIM classifies features by WHERE VALUE RESIDES — the radius of impact — not by
magnitude. The order T0→T6 is radius, not priority. Most value in most products
is created at T1 and T2.

SEVEN TIERS

T0 MANDATED — Legitimacy floor
  Value resides in: the right to operate
  Definition: External mandate (law, regulation, binding standard). Failure means
    loss of licence to operate, not loss of satisfaction.
  Mechanism: Compliance. Step function at a fixed date. No "good enough."
  Exclusion: If the threshold comes from market expectation rather than binding
    text, it's T1.
  Test: Compliance audit against each clause. Binary.
  Negative T0⁻: Malicious compliance — meeting the letter, breaking the purpose.

T1 THRESHOLD — Entry condition
  Value resides in: the session
  Definition: Absence causes dissatisfaction; presence goes unnoticed.
  Mechanism: Negative asymmetry.
  Exclusion: If removing it in a 2-week holdout does not significantly raise
    complaint rate, it is NOT T1.
  Test: Feature-removal holdout, 1-2% of users, 14 days.
  Negative T1⁻: Deliberately degraded basics to force upgrade.

T2 PROPORTIONAL — Linear value
  Value resides in: the session
  Definition: Value scales with quality, WITHIN the perceivable range, up to
    saturation.
  Mechanism: Linear utility, bounded by the just-noticeable difference (JND).
  Exclusion: If planned improvement < JND, it creates NO T2 value. If the industry
    is past saturation on that dimension, it's T1.
  Test: Staircase experiment — find the smallest delta 75% of users can detect.
  Rule: If delta < JND, do not ship it alone. Batch until it exceeds JND.
  Negative T2⁻: Spec racing below the perception threshold.

T3 DELIGHT — Expectation violation
  Value resides in: the session
  Definition: Unexpected positive emotion when present; no dissatisfaction absent.
  Mechanism: Positive expectation violation. Decay is a law, not a defect.
  Exclusion: If shared content is about the USER rather than the PRODUCT, it's T4.
  Test: Half-life of unprompted share rate (measure weeks 1, 12, 26).
  Negative T3⁻: Dark delight — variable reward exploiting the dopamine system.
    Discriminator: if users knew the exact probability mechanics, would they still
    want it? Healthy surprise survives transparency; T3⁻ does not.

T4 SYMBOLIC — Identity
  Value resides in: the user's self-narrative
  Definition: Value is what the feature SAYS ABOUT THE USER, not what it does.
  Mechanism: Identity signaling, outward and inward (self-signaling).
  Exclusions (three, all hard):
    (a) Domain: identity is domain-specific. Functionally neutral domains cannot
        carry T4 no matter the design.
    (b) Uniformity: if every user gets the same result, it's not T4.
    (c) Authorship: if the narrative is system-generated rather than determined by
        the user's own data, it is T4⁻, not T4.
  Test: Self-reference ratio in shared content (>60% first-person → T4).
    Plus Dilution Index = share rate ÷ penetration within reference group.
  DILUTION CLIFF: identity features do not fade into T3. They get diluted, then
    ACTIVELY ABANDONED — value passes through zero into negative, because
    continuing to use signals an unwanted identity. The curve is a cliff, not a
    slope. Countermeasure: make the signal a VECTOR, not a binary. Scale does not
    dilute a signal with enough dimensions.
  Negative T4⁻: Imposed identity. The product tells users who they are instead of
    reflecting who they are. Harm mechanism: a false self-narrative contaminates
    the evidence people use to infer things about themselves.
  CRITICAL: at T4, accuracy is not a quality metric — it is the tier's condition of
    existence. A T4 that is 10% wrong is not 10% worse. It is T4⁻.
  WARNING: reach RISES during a T4 failure. Reach cannot detect T4 breakage.

T5 TRANSFORMATIVE — Behavior
  Value resides in: the user's behavioral repertoire, outside the product
  Definition: CONTEXT-INDEPENDENT schema change — the behavior persists when the
    product's cues disappear, because the schema transferred off the product.
    (NOT "irreversible" — that is untestable and empirically false.)
  Mechanism: Behavioral schema replacement or upgrade.
  Exclusion / primary test — PRODUCT-REMOVAL TEST: randomized compensated cohort,
    access revoked 30 days, measure the target behavior OUTSIDE the product at
    day 30 and day 90 with independent instrumentation. Holds ≥70% of baseline at
    day 90 → T5. Collapses → NOT T5 (it is a well-run cue-reward system, i.e.
    disciplined T3, or dependency).
    Streaks and reminders FAIL this test. Autosave PASSES it.
  Negative T5⁻: Deskilling. Because T5 is context-independent, so is T5⁻ — an
    atrophied capability cannot be uninstalled.
  Design lever: REPLACE vs UPGRADE the schema. Replacement atrophies the base
    capability; upgrade moves it to a higher level of abstraction. Always ask
    whether the same value can be delivered by upgrading instead of replacing.

T6 PARADIGMATIC — Market frame
  Value resides in: the market's reference class
  Definition: Shifts the competitive frame itself. Signature symptom: a comparison
    question STOPS BEING ASKED.
  Exclusion: If a competitor can copy it within one release cycle without changing
    architecture or business model, it is T3, not T6.
  Test — PRE-REGISTERED CARD, written BEFORE launch, sealed, opened at 18 months:
    (1) three competitive metrics that will become meaningless, and who uses them
        today, by name;
    (2) two named competitors forced to add an equivalent, with predicted quarter;
    (3) one comparison question buyers ask today and will stop asking.
    Wrong on ≥2 of 3 → it was T3.
  Context: in an empirical survey of 79 experts across the 77 cases the disruption
    literature itself selected as exemplars, only 9% contained all four core
    elements. Without pre-registration, T6 is a retrospective narrative label.
  Negative T6⁻: Bad industry-wide norm — a baseline all competitors must adopt even
    when known to be harmful. T6⁻ typically ends in regulation.

OPERATING RULES
- Tier = mechanism and radius, NOT magnitude. An excellent T1 is still T1.
- Tier is determined by context, not by the feature. The same feature can be T1,
  T2 or T3 in different markets.
- Tiers are not mutually exclusive. Classify by the highest tier for strategy;
  design and measure each tier separately; audit risk at the highest tier. But the
  MOST FRAGILE tier determines the operational metric set.
- Migration is downward over time, with two exceptions: T4 can go NEGATIVE via the
  dilution cliff; T5 does not migrate (though its carrier platform can change).
- Ceiling rule: no resources to T4–T6 while any T0 is unmet or any T1 is below
  threshold.
- No satisfaction-survey tests. Behavioral observation, controlled intervention, or
  sealed prediction only.
- A tier label is only valid if it changes next week's action. If two tiers lead to
  the same action, the distinction is decorative.
- EVERY tier has a negative mirror. Scrutiny must rise with radius, because
  reversibility falls with radius. T4 requires an authorship audit before release;
  T5 requires a written deskilling audit before release.

When analyzing a feature, always state: (1) the tier, (2) the mechanism explaining
why, (3) one exclusion condition you checked, (4) one diagnostic test that would
confirm within 90 days, (5) the relevant negative-axis risk.
```

### 14.2 Prompt phân loại nhanh
```
Phân loại [TÍNH NĂNG] trong [SẢN PHẨM] theo SFIM v2.0. Trả lời đúng năm mục:
(1) Tầng, (2) Cơ chế tại sao là tầng đó, (3) Một điều kiện loại trừ bạn đã kiểm và
kết quả, (4) Một test xác nhận làm được trong 90 ngày, (5) Rủi ro trục âm tương ứng.
Nếu không đủ dữ liệu cho mục (3), nói rõ cần dữ liệu gì thay vì đoán.
```

### 14.3 Prompt audit toàn bộ danh mục
```
Đây là danh sách tính năng của [SẢN PHẨM]: [LIỆT KÊ].
1. Phân tầng từng tính năng theo SFIM v2.0, kèm điều kiện loại trừ đã kiểm.
2. Kiểm tra QT-1: có T0 nào chưa đạt hoặc T1 nào dưới ngưỡng không? Nếu có, dừng
   phân tích các tầng trên và nói rõ.
3. Xác định tính năng đang được đầu tư vượt tầng thực tế của nó.
4. Xác định tầng nào đang trống.
5. Xác định tính năng nào đang tự nhận là T5 nhưng sẽ trượt test gỡ sản phẩm.
6. Với mỗi T4, đánh giá rủi ro vách pha loãng: tín hiệu là nhị phân hay vector?
7. Đề xuất phân bổ lại nguồn lực theo QT-4.
```

### 14.4 Prompt kiểm toán trục âm
```
Chạy kiểm toán trục âm SFIM v2.0 cho [TÍNH NĂNG / SẢN PHẨM].
Với mỗi tầng mà tính năng này chạm tới, áp test phát hiện tương ứng:
- T3⁻: nếu người dùng biết chính xác cơ chế xác suất, họ có vẫn muốn không?
- T4⁻: tự sự này do dữ liệu của họ quyết định hay do mô hình của ta quyết định?
- T5⁻: gỡ công cụ đi, người dùng bất lực hay chỉ chậm hơn? Năng lực nào sẽ teo?
- T6⁻: nếu mọi đối thủ đều buộc phải làm theo, kết quả tổng cho người dùng tốt hơn
  hay tệ hơn?
Với mỗi rủi ro phát hiện được: nêu can thiệp cụ thể, không nêu nguyên tắc chung.
Nếu có rủi ro T5⁻, bắt buộc đề xuất một phiên bản NÂNG CẤP schema thay vì THAY THẾ.
```

### 14.5 Prompt thiết kế T5
```
Dẫn tôi qua quy trình thiết kế T5 cho [NHÓM NGƯỜI DÙNG], theo đúng thứ tự:
1. JOB MAPPING NGOÀI SẢN PHẨM: công việc nào trong đời sống họ đang làm kém hiệu quả
   hoặc không làm? Không nhắc tên sản phẩm nào trong câu trả lời.
2. SCHEMA MỤC TIÊU, một câu: "Hiện tại họ nghĩ X. Sau tính năng này họ nghĩ Y."
3. KIỂM TOÁN THOÁI KỸ NĂNG: năng lực nào sẽ teo? Có cách nâng cấp schema thay vì
   thay thế không?
4. NGƯỠNG TEST GỠ SẢN PHẨM: tôi nên kỳ vọng giữ bao nhiêu % baseline ở ngày 90, và
   đo bằng công cụ gì ngoài sản phẩm?
Nếu bước 2 không viết được thành một câu, nói thẳng rằng đây chưa phải T5.
```

---

## 15. Giới hạn đã biết của v2.0

Ghi ra để người dùng framework không bị bất ngờ, và để v3.0 có việc làm.

1. **Ngưỡng 70% ở ngày 90 trong test gỡ sản phẩm là quy ước, chưa được hiệu chuẩn thực nghiệm.** Nó đủ nghiêm để loại streak và đủ lỏng để giữ tự động lưu, nhưng con số chính xác cần dữ liệu theo ngành.
2. **Ngưỡng 60% tự quy chiếu cho T4 cũng là quy ước.** Nó dựa trên nguyên tắc phân biệt (chia sẻ về mình hay về sản phẩm), không dựa trên chuẩn đã công bố.
3. **Test gỡ sản phẩm có vấn đề đạo đức khi tính năng có giá trị thật.** Cần bồi thường, đồng thuận, và không áp dụng cho tính năng liên quan sức khỏe hay an toàn. Với những trường hợp đó, dùng dữ liệu tự nhiên (người dùng rời đi tự nguyện) thay cho can thiệp.
4. **Vách pha loãng được suy ra từ nghiên cứu về tín hiệu bản sắc trong tiêu dùng, chưa được kiểm chứng trực tiếp trên tính năng phần mềm.** Cơ chế vững; độ lớn và tốc độ thì chưa.
5. **T6 vẫn hiếm tới mức khó học từ dữ liệu.** Phiếu tiền đăng ký cải thiện kỷ luật nhận thức nhưng không tăng tỷ lệ trúng.
6. **JND dễ đo cho thuộc tính đơn chiều (tốc độ, độ trễ), khó đo cho thuộc tính đa chiều (chất lượng câu trả lời).** Với thuộc tính đa chiều, dùng so sánh cặp mù thay cho thang bậc.
7. **Framework giả định có người dùng phân biệt được và có khả năng hành động.** Trong các hệ thống mà người dùng không được chọn (dịch vụ công độc quyền, phần mềm nội bộ bắt buộc), cơ chế T1–T3 vẫn đúng nhưng tín hiệu phản hồi biến mất, nên phải thay bằng đo hành vi trực tiếp.

---

## 16. Quick reference

| Tầng | Giá trị trú ở | Test quyết định | Mặt âm | Di chuyển |
|---|---|---|---|---|
| **T0** Mandated | Quyền tồn tại | Kiểm toán tuân thủ, nhị phân | Tuân thủ hình thức | Không |
| **T1** Threshold | Phiên | Holdout gỡ 14 ngày | Nền tảng hỏng có chủ đích | Dừng tại T1 |
| **T2** Proportional | Phiên | JND — Δ nhỏ nhất 75% phát hiện | Chạy đua vô nghĩa | → T1 |
| **T3** Delight | Phiên | Half-life tỷ lệ chia sẻ | Dark delight | → T1 |
| **T4** Symbolic | Tự sự bản thân | Tự quy chiếu >60% + Dilution Index | Bản sắc áp đặt | → **âm** (vách) |
| **T5** Transformative | Hành vi ngoài sản phẩm | Gỡ sản phẩm 30/90, giữ ≥70% | Thoái kỹ năng | Không |
| **T6** Paradigmatic | Khung thị trường | Phiếu tiền đăng ký, mở sau 18 tháng | Chuẩn mực xấu | → T1 toàn ngành |

**Định nghĩa nén cho system prompt:**

```
SFIM v2.0 — 7 tiers by RADIUS of impact, not magnitude.
T0 Mandated: external mandate; step function at a date; licence to operate.
T1 Threshold: absence → dissatisfaction, presence → unnoticed. Test: removal holdout.
T2 Proportional: linear within perceivable range. Below JND = zero value.
T3 Delight: expectation violation. Decays by law. Manage as portfolio.
T4 Symbolic: value = what it says about the user. DILUTION CLIFF — goes negative,
   not down. Accuracy is existential, not a quality metric.
T5 Transformative: CONTEXT-INDEPENDENT schema change. Test: product-removal 30/90,
   hold ≥70%. Streaks fail. Autosave passes. Negative = deskilling, irreversible.
T6 Paradigmatic: shifts the reference class; a comparison question stops being
   asked. Test: pre-registered card, sealed, opened at 18 months.
Rules: tier = mechanism + radius, not magnitude · context determines tier, not the
feature · every tier has a negative mirror · scrutiny rises with radius because
reversibility falls · no resources above T1 while T0/T1 unmet · no satisfaction
surveys · a label is valid only if it changes next week's action · most fragile
tier sets the operational metrics.
```

---

*SFIM v2.0. Trục âm, điều kiện loại trừ, và bộ đo hành vi là phần bắt buộc, không phải phụ lục. Một tính năng chưa qua điều kiện loại trừ thì chưa được phân tầng — nó mới chỉ được đặt tên.*
