# Tiêu chuẩn A, phiên bản 2.0

Bản này giữ nguyên tinh thần của bản 1: chất lượng trải nghiệm là thuộc tính của hệ thống, không phải của cảm hứng, và nó đo được. Những thay đổi chính so với bản 1 nằm ở cuối tài liệu, mục 14.

---

## 0. Định nghĩa

Một sản phẩm đạt Tiêu chuẩn A khi người dùng **đạt được ý định của mình với ít nỗ lực, ít quyết định và ít lo lắng nhất có thể**, và điều đó không đạt được bằng cách đẩy nỗ lực, quyết định hay lo lắng sang một người khác.

Kèm theo sáu điều kiện:

- Người dùng không phải nhìn thấy hay gánh cấu trúc nội bộ của bên cung cấp.
- Người dùng không bị bất ngờ.
- Khi có sự cố, người dùng được đỡ lấy.
- Mọi chi tiết họ cảm nhận được đều là một quyết định có chủ đích.
- Chi phí của sự mượt mà được hệ thống hấp thụ, không được chuyển sang nhân viên vận hành, đối tác hay người dùng ở đầu kia.
- Chất lượng này được **tái tạo nhất quán nhờ hệ thống**, không nhờ một cá nhân xuất sắc hay nhờ may mắn.

Ba mở rộng về phạm vi:

- **"Sản phẩm"** là bất cứ thứ gì có người trải nghiệm: vật thể, phần mềm, dịch vụ, tài liệu, hợp đồng, API, quy trình nội bộ, chính sách.
- **"Người dùng"** gồm cả người dùng gián tiếp: developer tích hợp API, nhân viên vận hành, người nhận tiền, tài xế giao hàng, người thân giúp khôi phục tài khoản. Một sản phẩm đẹp với khách nhưng hành hạ người vận hành thì chưa đạt, vì hai lý do: sự hành hạ đó sớm muộn cũng lộ ra với khách, và vì họ cũng là người.
- **"Ít nỗ lực nhất"** không có nghĩa là không còn nỗ lực. Xem mục 4, phân loại ba loại ma sát.

---

## 1. Thuật ngữ

| Thuật ngữ | Nghĩa trong tiêu chuẩn |
|---|---|
| **Ý định** | Việc người dùng thực sự muốn hoàn thành, diễn đạt bằng ngôn ngữ của họ, không phải tên tính năng |
| **Hành trình** | Toàn bộ chuỗi từ lần đầu biết đến sản phẩm cho đến lúc rời bỏ, gồm cả đường thành công lẫn đường hỏng |
| **Khoảnh khắc** | Một đơn vị trong hành trình mà người dùng cảm nhận được: mở hộp, đăng ký, thanh toán, chờ, nhận kết quả, gặp lỗi, huỷ |
| **Đường nối** | Chỗ hai hệ thống, hai bộ phận hoặc hai kênh gặp nhau, và người dùng nhận ra điều đó |
| **Ma sát** | Mọi nỗ lực, chờ đợi, quyết định hay lo lắng phát sinh trên đường tới ý định |
| **Ma sát ngẫu nhiên** | Ma sát không phục vụ ai cả, chỉ là dấu vết của cách hệ thống được xây. Phải xoá |
| **Ma sát cấu thành** | Ma sát chính là giá trị: hiểu một khái niệm, cân nhắc một quyết định lớn. Phải giữ và phải thiết kế |
| **Ma sát bảo vệ** | Ma sát phục vụ một người khác hoặc phục vụ chính người dùng ở tương lai: chống gian lận, xác nhận hành động không đảo ngược. Phải giữ và phải giải thích |
| **Đường hỏng** | Hành trình khi có gì đó sai: mạng rớt, thanh toán treo, người dùng nhập nhầm, nhân viên vắng |
| **Khoảnh khắc đặc trưng** | 3 đến 5 khoảnh khắc được trau chuốt vượt mức cần thiết, định hình ký ức về sản phẩm |
| **Ngân sách** | Giới hạn định lượng cho một trải nghiệm: thời gian, số bước, số quyết định, sai số cho phép |
| **Lớp quyết định** | Thành phần hệ thống chi phối nhiều khoảnh khắc nhất |
| **Tải trọng nội bộ** | Lượng thao tác, phán đoán và trách nhiệm mà một cải tiến đặt lên người vận hành |

---

## 2. Cấu trúc: một cổng và ba tầng

- **Tầng 0, Cổng chính đáng:** hai điều kiện đạt hoặc không đạt. Không đạt thì không chấm tiếp.
- **Tầng 1, Kết quả:** những gì người dùng cảm nhận, gồm 15 tiêu chí chia thành 4 nhóm: Rõ, Nhẹ, Tin, Đẹp. Chỉ tầng này được chấm điểm.
- **Tầng 2, Thuộc tính hệ thống:** những gì phải được xây để tạo ra kết quả.
- **Tầng 3, Kỷ luật tổ chức:** những gì phải được duy trì để kết quả không xuống cấp.

Tầng 2 và 3 là bằng chứng rằng kết quả ở tầng 1 không phải ngẫu nhiên và sẽ không trôi đi sau vài bản phát hành.

---

## 3. Tầng 0: cổng chính đáng

Tiêu chuẩn A là một công cụ đo hiệu quả, và hiệu quả là trung tính. Một ứng dụng cá cược, một app vay nóng lãi suất ba con số, một game gacha nhắm vào trẻ em đều có thể đạt điểm cao trên cả 15 tiêu chí: ý định rõ, nỗ lực tối thiểu, phản hồi tức thì, không bất ngờ về phí, có khoảnh khắc đặc trưng. Ở những sản phẩm đó, sự mượt mà không phải bằng chứng của chất lượng, nó là bằng chứng của hiệu suất khai thác.

Vì vậy trước khi chấm, phải qua hai cổng:

**G1. Ý định đáng được phục vụ.** Ý định mà sản phẩm đáp ứng phải là thứ người dùng vẫn muốn khi họ tỉnh táo và biết đủ. Bài thử: nếu bạn giải thích đầy đủ cơ chế kiếm tiền và hệ quả dài hạn cho người dùng ngay trước khoảnh khắc cam kết, họ có vẫn tiếp tục không.

**G2. Không xung đột lợi ích theo cấu trúc.** Việc người dùng đạt được ý định và việc nhà cung cấp kiếm được tiền phải cùng chiều. Xung đột cấu trúc xuất hiện khi doanh thu tăng lúc người dùng thua, khi người trả tiền không phải người dùng, hoặc khi chỉ số tăng trưởng được tính bằng thời gian người dùng ở lại thay vì việc họ hoàn thành.

Khi G2 không đạt nhưng sản phẩm vẫn tồn tại, tiêu chuẩn vẫn dùng được, nhưng phải ghi rõ trong kết quả chấm: đây là điểm A có điều kiện, và mọi tiêu chí thuộc nhóm TIN phải bị hạ một bậc, vì niềm tin trong bối cảnh xung đột cấu trúc là thứ được vay chứ không phải được xây.

---

## 4. Ba loại ma sát

Bản 1 nói mọi ma sát phải chứng minh được lý do tồn tại. Đúng, nhưng chưa đủ, vì có ma sát chứng minh được và vẫn phải giữ. Trước khi cắt bất cứ bước nào, phân loại nó:

| Loại | Phục vụ ai | Hành động | Ví dụ |
|---|---|---|---|
| Ngẫu nhiên | Không ai | Xoá | Khai lại địa chỉ, nộp lại giấy tờ hệ thống đã có, chuyển phòng ban |
| Cấu thành | Chính người dùng, về lâu dài | Giữ, và thiết kế cho nó xứng đáng | Hiểu điều khoản vay trước khi ký, làm bài tập, so sánh phương án lớn |
| Bảo vệ | Người dùng ở tương lai, hoặc người khác | Giữ, và giải thích lý do ngay tại chỗ | Xác thực sinh trắc cho giao dịch lớn, xác nhận hành động không đảo ngược, kiểm tra chống gian lận |

Quy tắc đi kèm: **ma sát bảo vệ phải nói ra lý do của nó tại đúng khoảnh khắc nó xuất hiện.** Một bước xác thực thêm mà không giải thích là ma sát ngẫu nhiên dưới mắt người dùng, dù nó chính đáng dưới mắt bạn.

Quy tắc thứ hai: **ma sát cấu thành không được tối ưu biến mất.** Đây là ranh giới giữa làm cho việc khó trở nên dễ và làm cho người ta mất năng lực. Một công cụ giúp bạn viết nhanh hơn khác với một công cụ khiến bạn không còn viết được.

---

## 5. Luật xung đột

Mười lăm tiêu chí sẽ mâu thuẫn nhau trong gần như mọi quyết định thật. Không có luật xử lý xung đột thì tiêu chuẩn quay về gu cá nhân đúng ở chỗ nó hứa sẽ thay thế gu cá nhân.

Thứ tự dưới đây là **thứ tự từ vựng**: tiêu chí ở bậc trên không bao giờ được đánh đổi lấy tiêu chí ở bậc dưới. Chỉ được cân nhắc đánh đổi giữa các tiêu chí trong cùng một bậc.

| Bậc | Tiêu chí | Cách đọc |
|---|---|---|
| 1 | A8 an toàn và đảo ngược được, A7 được đỡ khi hỏng | Không bao giờ đổi khả năng hoàn tác lấy một bước ít hơn |
| 2 | A5 không bất ngờ, A11 tôn trọng, A13 kiểm chứng được | Không bao giờ giấu thông tin có hệ quả để làm luồng gọn hơn |
| 3 | A4 trạng thái rõ, A1 ý định rõ, A14 tiếp cận được | Không bao giờ đổi việc người dùng hiểu mình đang ở đâu lấy sự tinh gọn thị giác |
| 4 | A2 nỗ lực tối thiểu, A3 phản hồi trong ngưỡng, A6 đường nối ẩn, A15 không dịch chuyển ma sát | Bốn tiêu chí này thường xuyên đánh nhau và được phép thương lượng với nhau |
| 5 | A9 nhất quán, A12 bền theo thời gian | Khi một mẫu tương tác sai, sửa nó và trả giá di cư, đừng giữ cái sai vì nhất quán |
| 6 | A10 tay nghề có chủ đích | Chi vào đây sau cùng |

Thứ tự này cũng giải thích vì sao hầu hết sản phẩm hỏng ở bậc 1 và 2 trong khi chi tiền cho bậc 6.

---

## 6. Tầng 1: mười lăm tiêu chí kết quả

### Nhóm RÕ: người dùng luôn hiểu

**A1. Ý định rõ.** Sản phẩm làm một việc chính, và người dùng hiểu việc đó trong vài giây. Cơ chế: mọi quyết định thiết kế về sau đều cần một trọng tài; không có ý định rõ thì mọi tranh luận rơi về gu cá nhân và sản phẩm phình ra.
*Đo bằng:* ý định viết được trong một câu không cần chữ "và". Bài thử 5 giây: đưa người lạ xem rồi hỏi sản phẩm này để làm gì; họ phải trả lời đúng.
*Vi phạm điển hình:* trang chủ có 12 lối vào ngang hàng; tờ rơi phòng khám liệt kê 30 dịch vụ cùng cỡ chữ; một ô nhập trống không gợi ý được hệ thống làm được gì.

**A4. Trạng thái luôn rõ.** Ở bất kỳ thời điểm nào, người dùng biết bốn điều: mình đang ở đâu, việc gì đang xảy ra, tiếp theo là gì, còn bao lâu.
*Đo bằng:* dừng hành trình ở một điểm ngẫu nhiên và hỏi bốn câu trên. Mục tiêu là bốn câu trả lời đúng ở mọi điểm.
*Vi phạm điển hình:* vòng xoay tải không có mốc; trạng thái "đang xử lý" suốt ba ngày; đơn hàng biến mất giữa hai hệ thống vận chuyển; một tác tử tự động chạy sáu phút mà không nói nó đang làm bước nào.

**A9. Nhất quán.** Một giọng, một logic, một ngôn ngữ qua mọi điểm chạm. Học ở một chỗ thì dùng được ở mọi chỗ. Cơ chế: mỗi bất nhất buộc người dùng học lại, và học lại là ma sát nhận thức.
*Đo bằng:* cùng khái niệm thì cùng tên; cùng hành động thì cùng vị trí và cử chỉ; cùng loại lỗi thì cùng cách báo. Lập bảng thuật ngữ và hành động qua mọi kênh.
*Ngoại lệ có chủ đích:* với hệ thống có thành phần ngẫu nhiên, nhất quán không áp ở mức đầu ra mà ở mức hợp đồng: định dạng, giọng, ranh giới từ chối và cấu trúc phải ổn định kể cả khi nội dung thay đổi.
*Vi phạm điển hình:* app gọi là "ví", web gọi là "tài khoản", tổng đài gọi là "số dư khả dụng".

**A13. Kiểm chứng được.** Mọi khẳng định có hệ quả mà sản phẩm đưa ra đều truy được về nguồn, và hệ thống phân biệt rõ cái nó biết với cái nó suy đoán. Cơ chế: bất ngờ nghiêm trọng nhất không phải bất ngờ về giá mà là bất ngờ về sự thật. Một con số sai trong báo cáo, một điều khoản bị tóm tắt lệch, một câu trả lời tự tin mà sai đều phá niềm tin theo cách không sửa được bằng xin lỗi.
*Đo bằng:* tỷ lệ khẳng định quan trọng có nguồn truy được; tỷ lệ trường hợp hệ thống nói rõ nó không chắc thay vì đoán; thời gian để người dùng kiểm tra lại một con số do hệ thống đưa ra.
*Vi phạm điển hình:* dashboard hiện một con số không nói được nó tính từ đâu; trợ lý trả lời trôi chảy mà không phân biệt trích dẫn với suy diễn; hợp đồng tóm tắt bỏ mất điều kiện loại trừ.

**A14. Tiếp cận được.** Người khiếm thị, khiếm thính, hạn chế vận động, hạn chế nhận thức, người già và người ít quen công nghệ đều hoàn thành được hành trình chính. Cơ chế: khả năng tiếp cận là bài kiểm tra khắc nghiệt nhất cho chính A1, A4 và A9. Một giao diện mà trình đọc màn hình đi qua vẫn hiểu được trạng thái là một giao diện có trạng thái thật, không phải trạng thái được vẽ ra.
*Đo bằng:* hành trình chính hoàn thành được bằng bàn phím, bằng trình đọc màn hình, ở cỡ chữ 200%, và trong điều kiện tương phản thấp. Chuẩn kỹ thuật tham chiếu: WCAG 2.2 mức AA, và EN 301 549 nếu bán vào EU.
*Vi phạm điển hình:* nút chỉ phân biệt bằng màu; lỗi form chỉ báo bằng viền đỏ; video hướng dẫn không có phụ đề; thời gian chờ có giới hạn không thể kéo dài.

### Nhóm NHẸ: người dùng tốn ít công nhất

**A2. Nỗ lực tối thiểu.** Mọi bước, mọi quyết định, mọi thông tin phải nhập đều phải chứng minh được nó thuộc loại ma sát nào ở mục 4, và ma sát ngẫu nhiên phải bị xoá. Nguyên tắc con quan trọng nhất là **hỏi một lần**: thông tin đã có trong hệ thống thì không được hỏi lại. Estonia đưa nguyên tắc này vào luật hành chính; Việt Nam đưa vào Nghị định 320/2026/NĐ-CP, hiệu lực 28/9/2026, cấm yêu cầu nộp hoặc xuất trình bản giấy với giấy tờ đã có trên hệ thống.
*Đo bằng:* thời gian đến giá trị đầu tiên, số bước, số quyết định, số trường phải nhập, số lần hỏi lại thông tin (mục tiêu bằng 0). Ở khoảnh khắc chuyển tiếp, mục tiêu là 0 đến 1 bước.
*Vi phạm điển hình:* khai lại địa chỉ ở mỗi lần đặt hàng; nộp lại bản sao căn cước cho từng phòng ban.

**A3. Phản hồi trong ngưỡng.** Mọi hành động đều có phản hồi trong ngưỡng.

| Ngưỡng | Phần mềm, thiết bị | Dịch vụ có con người | Hệ thống có độ trễ sinh ra nội dung |
|---|---|---|---|
| 0,1 giây | Thao tác trực tiếp cảm thấy tức thì | Xác nhận "đã nhận yêu cầu" phải đến ngay | Trạng thái "đã nhận" phải hiện ngay |
| 1 giây | Giữ được mạch suy nghĩ | Người tiếp nhận đầu tiên phải trả lời được "ai lo việc này" | Ký tự đầu tiên phải xuất hiện trong 1 giây, không phải câu trả lời đầy đủ |
| 10 giây | Quá mức này phải có thanh tiến trình và cho phép làm việc khác | Việc không xong ngay phải có mốc cụ thể ("trước 17h thứ Năm"), không được là "sớm nhất có thể" | Quá mức này phải hiện bước đang chạy và cho phép dừng |

*Vi phạm điển hình:* gửi hồ sơ xong không nhận được gì; bấm nút không thấy thay đổi nên người dùng bấm lần hai.

**A6. Đường nối ẩn theo mặc định, truy được theo yêu cầu.** Người dùng không bao giờ phải gánh cấu trúc nội bộ của bạn để hoàn thành ý định, nhưng phải luôn truy được cấu trúc đó khi họ muốn hoặc khi có sự cố. Cơ chế gốc vẫn là **định luật Conway**: hệ thống phản chiếu cấu trúc giao tiếp của tổ chức làm ra nó, nên đường nối trong sản phẩm gần như luôn là đường nối trong tổ chức, và cách sửa nằm ở tổ chức chứ không ở giao diện.
Phần sửa so với bản 1: che hoàn toàn là sai. Người không hiểu cấu trúc bên trong là người bất lực nhất khi hệ thống hỏng, và ở nhiều lĩnh vực việc lộ ra là nghĩa vụ pháp lý: ai đang xử lý dữ liệu của tôi, tiền của tôi đang nằm ở đâu, nội dung này do máy tạo hay do người viết. Nguyên tắc đúng là **che mặc định, lộ theo yêu cầu, luôn lộ khi hỏng**.
*Đo bằng:* số lần người dùng bị chuyển người hoặc chuyển kênh; số lần phải kể lại vấn đề; số lần nghe "việc này không thuộc bộ phận tôi"; và ở chiều ngược lại, số bước để một người dùng muốn biết tìm được ai đang thực sự giữ việc của họ.
*Vi phạm điển hình:* bệnh viện bắt bệnh nhân tự mang kết quả từ tầng 2 lên tầng 5; app và web cùng một ngân hàng có hai logic khác nhau; và ở chiều ngược lại, một hệ thống không cho biết đơn hàng đang ở đơn vị vận chuyển nào khi nó đã trễ bốn ngày.

**A15. Không dịch chuyển ma sát.** Độ phức tạp của một hệ thống không biến mất, nó chỉ đổi chỗ (định luật bảo toàn độ phức tạp của Larry Tesler). Một cải tiến chỉ đạt chuẩn khi nó hấp thụ độ phức tạp vào hệ thống, không đẩy sang người vận hành, đối tác, tài xế hay người dùng ở đầu kia.
*Đo bằng:* **tỷ số dịch chuyển** = số thao tác hoặc phán đoán thêm ở phía vận hành chia cho số bước giảm ở phía khách. Mục tiêu nhỏ hơn 1, lý tưởng gần 0. Thêm: số ngoại lệ mà nhân viên phải xử lý thủ công mỗi 1.000 giao dịch, và tỷ lệ quyết định khó bị đẩy cho người ở vòng cuối mà không kèm quyền và thông tin để quyết.
*Vi phạm điển hình:* đặt hàng một chạm cho khách nhưng kho phải đối soát tay; huỷ đơn tức thì cho khách còn tài xế chịu phạt; tự động hoá 95% và để nhân viên hứng toàn bộ 5% khó nhất mà không tăng quyền hạn cho họ.

### Nhóm TIN: người dùng yên tâm giao phó

**A5. Không bất ngờ.** Giá, phí, thời gian, hậu quả đều được biết **trước khi** người dùng cam kết, và kết quả đúng như đã hứa.
*Đo bằng:* độ khớp giữa hứa và thực. Giá khớp 100%; thời gian nằm trong khung đã hứa ở tỷ lệ cao và được theo dõi. Thêm số khiếu nại loại "tôi không được báo trước".
*Chẩn đoán sâu hơn:* khi độ khớp thấp, dùng mô hình năm khoảng cách của Parasuraman để tìm khoảng cách nào đang hở: giữa kỳ vọng của khách và hiểu biết của bạn về kỳ vọng đó, giữa hiểu biết và đặc tả, giữa đặc tả và thực thi, giữa thực thi và truyền thông, giữa truyền thông và cảm nhận.
*Vi phạm điển hình:* phí hiện ở bước cuối; gia hạn tự động không báo trước; bảo hành bị từ chối vì một điều khoản ở trang 14.

**A7. Được đỡ khi hỏng.** Đường hỏng là công dân hạng nhất. Bốn yêu cầu theo thứ tự ưu tiên:

1. Hệ thống phát hiện lỗi **trước** người dùng.
2. Lỗi nào tự phục hồi được thì tự phục hồi.
3. Lỗi nào không tự phục hồi được thì phải nói rõ ba điều (chuyện gì xảy ra, tiền và dữ liệu của tôi có an toàn không, tôi làm gì tiếp), và người dùng không mất công, dữ liệu hay tiền.
4. Người được giao đỡ phải có **thẩm quyền** tương xứng với việc họ được giao. Đẩy một tình huống khó cho nhân viên tuyến đầu mà không cho họ quyền quyết và thông tin để quyết không phải là thiết kế đường hỏng, đó là chuyển trách nhiệm cho người ở vòng cuối.

Ritz-Carlton là ví dụ cho yêu cầu 4: nhân viên được tự quyết chi một khoản đáng kể để giải quyết sự cố cho khách mà không cần xin phép.
*Đo bằng:* tỷ lệ lỗi tự phục hồi; thời gian từ lúc lỗi xảy ra đến lúc giải quyết xong; số trường hợp mất dữ liệu hoặc tiền (mục tiêu bằng 0); tỷ lệ lớp lỗi có hành vi mặc định được thiết kế sẵn (mục tiêu 100%, xem B4).

**A8. An toàn và đảo ngược được.** Con đường đúng và an toàn phải là con đường dễ nhất. Hành động không thể đảo ngược phải được xác nhận một cách có ý nghĩa, tức là xác nhận nêu rõ hậu quả cụ thể. Mọi hành động khác phải có cách hoàn tác. Cơ chế: nếu thứ gì cũng hỏi "Bạn có chắc không?", người dùng bấm đồng ý theo phản xạ, và xác nhận mất tác dụng đúng ở chỗ cần nhất.
*Mở rộng cho hành động do hệ thống khởi xướng:* mọi hành động mà sản phẩm tự thực hiện thay người dùng (gửi đi, đặt lịch, chuyển tiền, sửa dữ liệu, gọi sang hệ thống khác) phải có nhật ký người dùng đọc được, có đường hoàn tác, và nếu không hoàn tác được thì phải có xác nhận của người trước khi thực hiện.
*Đo bằng:* tỷ lệ lỗi người dùng không đảo ngược được; bảo mật bật sẵn theo mặc định; số hộp xác nhận cho những hành động vốn đảo ngược được (mục tiêu bằng 0); tỷ lệ hành động tự động có nhật ký và có hoàn tác.

**A11. Tôn trọng.** Tôn trọng thời gian, sự chú ý, dữ liệu và trí tuệ của người dùng: không dùng mẫu thiết kế đánh lừa, không thu dữ liệu vượt mức cần, không làm phiền để tăng chỉ số tương tác.
*Đo bằng:* **đối xứng vào và ra**: số bước huỷ không được nhiều hơn số bước đăng ký, và đây là chỉ số nên cam kết công khai vì bên ngoài kiểm chứng được. Dữ liệu thu thập phải truy được về một nhu cầu của người dùng. Số thông báo không do người dùng yêu cầu phải có trần.
*Bối cảnh pháp lý:* Điều 25 Đạo luật Dịch vụ số của EU cấm giao diện đánh lừa; Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15 của Việt Nam, hiệu lực 1/1/2026, xác lập quyền được biết, quyền rút lại đồng ý và quyền yêu cầu xoá.

**A12. Bền theo thời gian.** Trải nghiệm ở tháng thứ 6 và năm thứ 3 vẫn tốt như ngày đầu. Không chậm dần khi dữ liệu tích luỹ, bản cập nhật không phá thói quen đã hình thành, chuyển sang thiết bị hay phiên bản mới không bắt làm lại từ đầu.
*Phần bổ sung quan trọng:* bản 1 giả định xuống cấp là do bất cẩn. Phần lớn xuống cấp trong các sản phẩm lớn là có chủ đích và có lợi nhuận: nền tảng tốt với người dùng để thu hút, rồi thu hồi giá trị. A12 chỉ đứng được khi có C8 chống lưng.
*Đo bằng:* hiệu năng khi dữ liệu gấp 10 lần; số bước để chuyển sang máy mới hoặc gói mới; số khiếu nại sau mỗi bản cập nhật; số lượng tính năng từng miễn phí nay bị tính tiền mà không tăng giá trị tương ứng; khả năng lấy toàn bộ dữ liệu ra ở định dạng dùng được.

### Nhóm ĐẸP: người dùng cảm được sự chăm chút

**A10. Tay nghề có chủ đích.** Mọi chi tiết cảm quan đều là một quyết định, không phải giá trị mặc định: hình, chữ, âm thanh, xúc giác, nhịp độ; với dịch vụ vật lý còn có ánh sáng, mùi, giọng nói, thứ tự các bước. Khoảnh khắc đặc trưng được trau chuốt vượt mức cần thiết. Tay nghề cũng phải có ở phần không ai nhìn thấy (mặt sau tủ, mã nguồn, luồng đối soát), vì chính những phần đó quyết định sản phẩm có bền và nhất quán hay không.
*Đo bằng:* ở khoảnh khắc đặc trưng, số chi tiết "chưa ai quyết định, đang để mặc định" phải bằng 0. Bài thử mù: người dùng phân biệt được phiên bản có trau chuốt với phiên bản không, và thích phiên bản trau chuốt.
*Giới hạn cần nói thẳng:* nhóm ĐẸP chỉ có một tiêu chí, và nó đứng cuối trong luật xung đột, là có chủ đích. Bằng chứng từ nghiên cứu dịch vụ quy mô lớn cho thấy giảm nỗ lực dự báo việc khách ở lại tốt hơn nhiều so với làm khách hài lòng vượt mong đợi. Tay nghề và khoảnh khắc đặc trưng không mua sự trung thành, chúng mua truyền miệng và mua giá bán. Đó là lý do chúng đáng chi, và cũng là lý do chúng phải chi sau cùng.

---

## 7. Tầng 2: tám thuộc tính hệ thống

**B1. Sở hữu lớp quyết định, ở một trong ba mức.** Lập bản đồ nối từng khoảnh khắc với thành phần chi phối nó. Lớp chi phối nhiều khoảnh khắc nhất cần được sở hữu ở mức cao nhất bạn với tới được:

| Mức | Nội dung | Khi nào dùng |
|---|---|---|
| S1 Tự làm | Kiểm soát toàn bộ | Khi lớp đó quyết định phần lớn trải nghiệm và bạn đủ nguồn lực |
| S2 Đặc tả và kiểm tra | Không tự làm nhưng tự viết spec chi tiết, có quyền kiểm tra chất lượng và có chế tài | Phần lớn trường hợp thực tế |
| S3 Cô lập ảnh hưởng | Không kiểm soát được, nên thiết kế để hỏng hóc của họ không thành hỏng hóc của bạn: tự truyền đạt trạng thái, tự đặt chính sách đền bù, tự có phương án hai | Công ty nhỏ, phụ thuộc sàn hoặc đối tác lớn |

Lớp quyết định khác nhau theo ngành: nhà hàng là bếp và hệ thống đặt bàn; giao hàng là chặng cuối; fintech là sổ cái và máy trạng thái giao dịch; phòng khám là hệ thống lịch hẹn và hồ sơ bệnh án.

**B2. Một nền chung, một nguồn sự thật duy nhất.** Danh tính, dữ liệu khách hàng, trạng thái đơn hàng và ngôn ngữ thiết kế dùng chung cho mọi kênh. Nếu hai kênh giữ hai bản dữ liệu riêng, đường nối là điều chắc chắn sẽ xảy ra.

**B3. Ngân sách định lượng.** Mọi tính từ trong spec ("nhanh", "dễ", "minh bạch") phải được dịch thành con số hoặc tiêu chí đạt/không đạt, và được đo tự động hoặc định kỳ. Trong phần mềm, cơ chế đã có tên và đã được kiểm chứng: SLI, SLO và error budget. Điểm cốt lõi của error budget đáng mượn cho mọi ngành: ngân sách sai sót được chi tiêu có ý thức, và khi hết ngân sách thì tính năng mới dừng lại cho tới khi chất lượng hồi phục.

**B4. Phân lớp lỗi và quy tắc bao trùm.** Bản 1 yêu cầu một ma trận đầy đủ với mọi ô được thiết kế. Trong hệ thống ghép chặt, số trạng thái hỏng tăng theo tổ hợp và liệt kê hết là bất khả thi, nên mục tiêu 100% ô sẽ bị bỏ ngay khi va vào thực tế. Thay bằng hai lớp:

1. **Hành vi mặc định cho từng lớp lỗi**, thiết kế một lần và dùng lại: hết thời gian chờ, phụ thuộc không phản hồi, dữ liệu mâu thuẫn, người dùng bỏ giữa chừng, thanh toán treo giữa hai hệ thống, nhân sự vắng mặt.
2. **Quy tắc bao trùm cho ô chưa biết:** không mất tiền, không mất dữ liệu, luôn có đường ra, luôn có người thật. Mọi trạng thái hỏng chưa được nghĩ tới đều phải rơi vào quy tắc này chứ không rơi vào màn hình trắng.

Cộng thêm: gây lỗi chủ động định kỳ để kiểm chứng, thay vì chờ lỗi đến.

**B5. Đo từ phía người dùng.** Đo cái người dùng cảm nhận: thời gian thực tế trên thiết bị của họ, thời gian chờ ở quầy, số lần gọi lại tổng đài. Không chỉ đo cái hệ thống báo cáo như uptime hay "đã xử lý".

**B6. Chuẩn được khoá lại.** Mỗi khi một thông số cho ra cảm giác đúng (độ cứng của animation, kịch bản xin lỗi, thời gian chờ tối đa), nó phải được ghi thành chuẩn chung (hệ thống thiết kế, SOP, thư viện dùng chung) để không ai phải đoán lại.

**B7. Chỉ số đi theo cặp.** Mọi chỉ số ở mục 9 đều bẻ được nếu đứng một mình. Vì vậy mỗi chỉ số tối ưu phải đi kèm một chỉ số bảo vệ đo từ phía người dùng, và chỉ số nào dùng để thưởng thì không được dùng để chẩn đoán.

| Chỉ số tối ưu | Cách bẻ | Chỉ số bảo vệ bắt buộc đi kèm |
|---|---|---|
| Tỷ lệ liên hệ hỗ trợ trên 1.000 giao dịch | Giấu nút liên hệ, chặn kênh | Số bước để gặp người thật; tỷ lệ giải quyết trọn vẹn trong 7 ngày |
| Thời gian đến giá trị đầu tiên | Định nghĩa lại "giá trị" thành hành động nông hơn | Tỷ lệ người dùng còn hoạt động sau 30 ngày |
| Tỷ lệ tự phục hồi | Phân loại lại lỗi thành hành vi bình thường | Số khiếu nại có từ khoá "không ai báo tôi" |
| Giải quyết ở điểm chạm đầu | Đóng ticket sớm | Tỷ lệ mở lại trong 14 ngày |

**B8. Lớp truy nguyên.** Hệ thống phải giữ được và hiển thị được: dữ liệu này đến từ đâu, con số này tính thế nào, hành động này do ai hoặc do cái gì khởi xướng và lúc nào. Đây là nền kỹ thuật cho A13 và cho vế "truy được theo yêu cầu" của A6. Không có lớp này thì cả hai tiêu chí đó chỉ là lời hứa.

---

## 8. Tầng 3: tám kỷ luật tổ chức

**C1. Một người chịu trách nhiệm trải nghiệm end-to-end, với ba quyền chứ không phải một.** Quyền chặn phát hành, **quyền ngân sách riêng để sửa ma sát**, và **quyền yêu cầu thay đổi ranh giới đội**. Lý do: quyền chặn là quyền phủ định, và một mình nó sẽ bị bào mòn vì người dùng nó luôn là người cản tiến độ. Quyền thứ ba là cách sửa Conway theo chiều ngược: thay vì chấp nhận sản phẩm phản chiếu tổ chức, sắp xếp tổ chức theo hình dạng hành trình mong muốn, tức là chia đội theo hành trình chứ không theo kênh hay theo lớp kỹ thuật.

**C2. Review trên sản phẩm thật, bởi chính người ra quyết định.** Người quyết định phải cầm thiết bị, dùng app, tự đi qua dịch vụ. Không review qua slide hay báo cáo.

**C3. Cổng chất lượng và quyền dừng dây chuyền.** Trong hệ thống sản xuất Toyota, bất kỳ công nhân nào thấy lỗi cũng được giật dây andon để dừng dây chuyền. Tương đương ở mọi ngành là tiêu chí chặn phát hành rõ ràng, và bất kỳ ai cũng có quyền kích hoạt.

**C4. Dùng chính sản phẩm của mình và ghi nhật ký ma sát liên tục.** Người làm sản phẩm phải là người dùng thường xuyên nhất của nó, và mọi ma sát họ gặp được ghi lại có hệ thống. Bổ sung: định kỳ đi qua hành trình trong điều kiện của người dùng khó nhất, không phải điều kiện của mình (máy cũ, mạng yếu, trình đọc màn hình, không có tài khoản nội bộ).

**C5. Tập trung.** Giữ danh mục nhỏ và viết memo "những gì chúng ta không làm". Cơ chế: n kênh tạo ra n(n−1)/2 cặp chuyển tiếp cần làm cho liền mạch; 4 kênh là 6 cặp, 8 kênh là 28 cặp. Bổ sung: tập trung cũng có nghĩa là chọn chỗ để dở một cách có chủ đích và nói ra, thay vì tốt đều ở mức tầm thường.

**C6. Vòng lặp 10 → 3 → 1, và tách họp mở với họp chốt.** Tạo nhiều phương án thật sự khác nhau trước khi hội tụ. Họp mở ý tưởng không phán xét; họp chốt thì quyết định và cắt.

**C7. Chuyên môn hạ nguồn vào từ đầu.** Sản xuất, vận hành, bảo mật, pháp lý, chăm sóc khách hàng, và khả năng tiếp cận tham gia từ giai đoạn concept. Phần lớn đường nối sinh ra từ một chuyên môn bị gọi vào quá muộn.

**C8. Ma sát có quyền phủ quyết tăng trưởng.** Không chỉ số tăng trưởng nào được phép thắng chỉ số ma sát trong cùng một chu kỳ. Cụ thể: mỗi thay đổi làm tăng doanh thu phải kèm phép đo tác động lên bộ chỉ số ma sát, và nếu ma sát tăng quá ngưỡng đã định thì thay đổi đó bị hoàn lại bất kể doanh thu. Đây là kỷ luật duy nhất chống được việc xuống cấp có chủ đích, và nó chỉ đứng được khi cấu trúc doanh thu đã qua cổng G2.

---

## 9. Bộ đo phổ quát

| Chỉ số | Định nghĩa | Hướng mục tiêu |
|---|---|---|
| Thời gian đến giá trị đầu tiên | Từ lần tiếp xúc đầu đến khi ý định được đáp ứng lần đầu | Giảm liên tục; đặt con số cụ thể theo ngành |
| Số bước ở mỗi khoảnh khắc chuyển tiếp | Thao tác cần để chuyển giữa kênh, thiết bị, giai đoạn | 0 đến 1 |
| Số quyết định | Lựa chọn người dùng buộc phải đưa ra | Chỉ giữ quyết định mà người dùng muốn tự đưa ra |
| Số lần hỏi lại thông tin | Thông tin đã có nhưng vẫn bị hỏi lại | 0 |
| Độ trễ phản hồi | Theo ba ngưỡng 0,1s / 1s / 10s, tính cả thời gian tới phản hồi đầu tiên | 100% hành động đạt ngưỡng |
| Độ khớp hứa và thực | Giá, thời gian, kết quả so với cam kết | Giá khớp 100%; thời gian trong khung hứa và được theo dõi |
| Giải quyết ở điểm chạm đầu | Tỷ lệ vấn đề xong mà không bị chuyển người hay kênh | Tăng liên tục; mục tiêu kể vấn đề một lần |
| Tỷ lệ tự phục hồi | Lỗi được xử lý mà người dùng không phải can thiệp | Tăng liên tục |
| Tỷ lệ liên hệ hỗ trợ trên 1.000 giao dịch | Chỉ số tổng hợp của mọi ma sát chưa sửa | Giảm theo quý |
| Đối xứng vào và ra | Số bước huỷ so với số bước đăng ký | Huỷ không nhiều bước hơn đăng ký |
| Độ bền | Hiệu năng khi dữ liệu gấp 10 lần; trải nghiệm sau 12 tháng | Không xuống cấp đo được |
| **Tỷ số dịch chuyển** | Thao tác thêm phía vận hành chia cho bước giảm phía khách | Nhỏ hơn 1 |
| **Tỷ lệ hoàn thành có hỗ trợ tiếp cận** | Hành trình chính hoàn thành được bằng bàn phím và trình đọc màn hình | 100% |
| **Tỷ lệ khẳng định truy được nguồn** | Trong các đầu ra có hệ quả | Tăng tới 100% cho nhóm có hệ quả cao |
| **Tỷ lệ hành động tự động có hoàn tác** | Hành động do hệ thống khởi xướng | 100% hoặc có xác nhận của người |

Tỷ lệ liên hệ hỗ trợ vẫn là chỉ số đáng chú ý nhất vì áp được cho mọi ngành: mỗi cuộc gọi là một chỗ sản phẩm chưa tự trả lời được, nên phân loại lý do liên hệ chính là bản đồ ma sát chính xác và miễn phí nhất bạn có. Nhưng nó chỉ dùng được khi đi kèm chỉ số bảo vệ ở B7.

---

## 10. Thang mức độ A0 đến A4

Điều kiện tiên quyết: đã qua cổng G1 và G2 ở mục 3.

| Mức | Tên | Điều kiện |
|---|---|---|
| **A0** | Chạy | Chức năng hoạt động khi mọi thứ thuận lợi |
| **A1** | Đúng | Đường thành công không có ma sát ngẫu nhiên lớn; phản hồi đạt ngưỡng; không bất ngờ về giá và thời gian |
| **A2** | Trơn | Các lớp lỗi chính có hành vi mặc định; trạng thái luôn rõ; nhất quán trong một kênh; hành trình chính tiếp cận được |
| **A3** | Liền mạch | Đường nối ẩn theo mặc định và truy được theo yêu cầu qua mọi kênh, thiết bị và bộ phận; phần lớn lỗi tự phục hồi; bền theo thời gian; tỷ số dịch chuyển nhỏ hơn 1; tầng 2 và 3 có bằng chứng |
| **A4** | Đặc trưng | Có ít nhất một khoảnh khắc đối thủ không tái tạo được vì nó dựa trên lớp quyết định bạn sở hữu; người dùng tự kể lại cho người khác; chất lượng vẫn giữ khi người dẫn dắt vắng mặt |

Ba quy tắc chấm điểm:

1. **Quy tắc điểm yếu nhất.** Mức của sản phẩm bằng mức của khoảnh khắc yếu nhất trên hành trình chính, không phải điểm trung bình. Một đường nối gãy đủ phá niềm tin vào toàn bộ hệ thống.
2. **Quy tắc đỉnh và kết.** Ký ức về một trải nghiệm bị chi phối bởi khoảnh khắc mạnh nhất và khoảnh khắc cuối cùng, nên khoảnh khắc đặc trưng nên gồm ít nhất một đỉnh và một kết. Lưu ý về độ chắc của bằng chứng: hiệu ứng đỉnh và kết được đo trong các thí nghiệm về trải nghiệm đau ngắn hạn, và việc ngoại suy sang quan hệ khách hàng nhiều năm là suy diễn hợp lý chứ chưa phải phát hiện đã được chứng minh. Dùng nó để chọn chỗ chi tiền, đừng dùng nó để thay thế việc nâng sàn.
3. **Quy tắc không dịch chuyển.** Không khoảnh khắc nào được tính là đã cải thiện nếu tỷ số dịch chuyển của nó lớn hơn 1. Mượt mà mua bằng lưng người khác không phải mượt mà, đó là kế toán.

**Apple-class, theo tiêu chuẩn này, là A3 trên toàn bộ hành trình chính cộng với A4 ở các khoảnh khắc đặc trưng.** Cần nói kèm một điều: mức đó ở Apple được chống lưng bởi tích hợp dọc và biên lợi nhuận cho phép tự làm gần như mọi lớp quyết định. Với tổ chức không có cấu trúc đó, đường tới A3 đi qua S2 và S3 ở B1, không đi qua S1.

---

## 11. Áp dụng qua các ngành

| Ngành | Ý định mẫu | Khoảnh khắc đặc trưng | Đường hỏng phải thiết kế | Đường nối hay lộ |
|---|---|---|---|---|
| Phần cứng tiêu dùng | "Dùng được ngay khi lấy ra khỏi hộp" | Mở hộp, ghép nối, tương tác chính | Pin cạn, mất kết nối, đổi máy | Thiết bị và app, app và cloud |
| Phần mềm, app | "Làm xong việc X trong một lần mở" | Lần dùng đầu, thao tác chính | Mất mạng, xung đột dữ liệu | Mobile và web, bản cũ và bản mới |
| Ngân hàng, thanh toán | "Luôn biết tiền mình đang ở đâu" | Chuyển tiền, xem số dư, nhận tiền | Tiền bị trừ nhưng chưa về, giao dịch treo | App và tổng đài, ngân hàng và đối tác |
| Bảo mật, danh tính | "An toàn mà không phải nghĩ" | Đăng nhập, xác thực | Mất thiết bị, khôi phục tài khoản | Bảo mật và hỗ trợ khách hàng |
| API, B2B | "Tích hợp chạy trong buổi chiều đầu tiên" | Đọc tài liệu, lần gọi đầu, lên production | Lỗi tích hợp, đổi phiên bản | Tài liệu và hành vi thực, sandbox và production |
| Sản phẩm có thành phần AI | "Giao việc và tin được kết quả" | Lần giao việc đầu, lúc nhận kết quả, lúc phát hiện sai | Kết quả sai mà trông đúng, tác tử làm quá phạm vi | Cái hệ thống biết và cái nó đoán |
| Y tế, phòng khám | "Được khám đúng, không phải chờ vô ích" | Đặt lịch, vào khám, nhận kết quả | Bác sĩ trễ, kết quả bất thường | Lễ tân, xét nghiệm, bác sĩ, nhà thuốc |
| Giáo dục | "Học được và biết mình đã tiến bộ" | Buổi đầu, lúc nhận phản hồi | Học viên tụt lại, bỏ lỡ buổi | Nền tảng học và giảng viên |
| Giao hàng, logistics | "Nhận đúng thứ, đúng lúc, không phải canh" | Đặt hàng, theo dõi, nhận hàng | Giao trễ, giao sai, đổi trả | Người bán, kho, đơn vị vận chuyển |
| Nhà hàng, khách sạn | "Được chăm sóc như khách quen" | Đến nơi, món đầu hoặc nhận phòng, lúc ra về | Hết món, đặt trùng, khách phàn nàn | Đặt chỗ online và quầy lễ tân |
| Dịch vụ công | "Làm thủ tục một lần, không phải đi lại" | Nộp hồ sơ, nhận kết quả | Thiếu giấy tờ, hồ sơ bị trả | Giữa các cơ quan với nhau |
| Bất động sản, xây dựng | "Nhận nhà đúng như đã hứa" | Ký hợp đồng, bàn giao | Chậm tiến độ, lỗi hoàn thiện | Sales, thi công, bảo hành |
| Nội bộ doanh nghiệp | "Nhân viên mới làm được việc từ tuần đầu" | Ngày đầu, tuần đầu | Thiếu quyền truy cập, người hướng dẫn vắng | HR, IT, quản lý trực tiếp |

Tiêu chuẩn cũng áp được cho đơn vị nhỏ hơn nhiều. **Một báo cáo** đạt chuẩn khi có kết luận ở câu đầu (A1), người đọc biết mình đang ở phần nào (A4), số liệu truy được nguồn (A13) và không có bất ngờ ẩn (A5). **Một cuộc họp** đạt chuẩn khi có một mục tiêu, người tham dự biết trước cần chuẩn bị gì, và kết thúc bằng quyết định có người chịu trách nhiệm. **Một hợp đồng** đạt chuẩn khi mọi hậu quả quan trọng được nói rõ trước chỗ ký. Chính khả năng áp xuống tận những đơn vị nhỏ như vậy làm cho chuẩn này thành thói quen chứ không chỉ là một dự án.

---

## 12. Quy trình kiểm định và trình tự sửa

### 12.1 Kiểm định

1. **Qua cổng.** Trả lời G1 và G2. Ghi kết quả vào báo cáo.
2. **Viết ý định một câu.**
3. **Vẽ hành trình end-to-end,** gồm đường hỏng, liệt kê mọi khoảnh khắc. Đánh dấu 3 đến 5 khoảnh khắc đặc trưng, trong đó ít nhất một đỉnh và một kết.
4. **Tự đi qua và đo** bằng bộ đo ở mục 9. Sau đó 5 người lạ làm lại, quan sát không can thiệp. Thêm một lượt bằng bàn phím và trình đọc màn hình, và một lượt trên máy yếu, mạng chậm.
5. **Phân loại ma sát** theo ba loại ở mục 4 trước khi quyết định cắt gì.
6. **Chấm 15 tiêu chí** theo thang A0 đến A4 cho từng khoảnh khắc. Mức của sản phẩm là điểm yếu nhất trên hành trình chính.
7. **Truy nguyên nhân gốc.** Với mỗi vi phạm, xác định thiếu thuộc tính nào ở tầng 2 hoặc kỷ luật nào ở tầng 3. Sửa tầng 1 mà không sửa tầng 2 và 3 thì lỗi quay lại.
8. **Lập kế hoạch sửa** theo trình tự ở 12.2, mỗi mục có người chịu trách nhiệm, hạn chót và chỉ số nghiệm thu kèm chỉ số bảo vệ. Kiểm định lại mỗi quý.

### 12.2 Trình tự sửa

Thang đo cho biết đang ở đâu; trình tự cho biết sửa gì trước khi ngân sách có hạn. Thứ tự này xếp theo tác động chia cho chi phí, và nó khớp với luật xung đột ở mục 5.

1. **Đường hỏng trên hành trình tiền và dữ liệu.** Mất niềm tin ở đây không hồi phục, và mỗi sự cố ở đây tốn nhiều chi phí hỗ trợ nhất. Đầu ra: hành vi mặc định cho từng lớp lỗi cộng quy tắc bao trùm.
2. **Trạng thái và mốc thời gian.** Rẻ, không cần đổi kiến trúc, giảm liên hệ hỗ trợ ngay. Thay mọi "sớm nhất có thể" bằng một mốc cụ thể, kể cả khi mốc đó xa.
3. **Hỏi một lần.** Kiểm kê mọi trường bị hỏi lại. Bước này thường lộ ra vấn đề B2.
4. **Từ vựng nhất quán.** Rẻ nhất trong danh sách: một bảng thuật ngữ, ép mọi kênh dùng chung. Không cần kỹ sư.
5. **Đối xứng vào ra và khả năng tiếp cận.** Hai thứ kiểm chứng được từ bên ngoài, nên đáng cam kết công khai.
6. **Khoảnh khắc đặc trưng.** Sau cùng, và chỉ khi sàn đã lên A2 trên toàn hành trình chính.

### 12.3 Chẩn đoán 30 ngày

| Tuần | Việc | Đầu ra |
|---|---|---|
| 1 | Phân loại 100% lý do liên hệ hỗ trợ trong 90 ngày gần nhất thành 20 nhóm | Bản đồ ma sát xếp theo tần suất nhân chi phí |
| 2 | Tự đi qua hành trình end-to-end, ghi hình, đo bằng đồng hồ | Danh sách khoảnh khắc kèm số đo thật |
| 3 | 5 người lạ làm lại; thêm lượt trình đọc màn hình và lượt máy yếu | Danh sách vi phạm theo tiêu chí |
| 4 | Truy nguyên nhân gốc xuống tầng 2 và 3, xếp theo 12.2 | Kế hoạch sửa có chủ sở hữu và chỉ số nghiệm thu |

---

## 13. Dấu hiệu chưa đạt chuẩn

Mười một phản mẫu, mỗi cái là triệu chứng của một cơ chế cụ thể:

- **Người dùng phải biết sơ đồ tổ chức của bạn.** Định luật Conway đang lộ ra. Sửa bằng C1 quyền thứ ba và B2.
- **Mã lỗi thay cho lời giải thích.** Đường hỏng chưa được thiết kế (A7, B4).
- **Thông tin quan trọng xuất hiện muộn.** Vi phạm A5, thường do bộ phận doanh thu được tối ưu tách khỏi trải nghiệm.
- **Chờ không có mốc.** Vi phạm A3 và A4, thường do không ai sở hữu trạng thái end-to-end.
- **Xác nhận ở mọi nơi** vì hệ thống không có cơ chế hoàn tác. Vi phạm A8.
- **Tối giản giả:** giấu tính năng vào menu sâu hơn thay vì loại bỏ quyết định khỏi tay người dùng (A2).
- **Đẹp ở đường thành công, thô ở mọi chỗ khác.** Tay nghề chỉ dồn vào phần dễ trình diễn.
- **Chất lượng phụ thuộc một người.** Tầng 3 chưa tồn tại.
- **Mượt với khách, khổ với nhân viên.** Vi phạm A15. Dấu hiệu nhận biết: mỗi cải tiến trải nghiệm đều kèm một file Excel mới ở phòng vận hành.
- **Hệ thống tự tin ở chỗ nó không nên tự tin.** Vi phạm A13. Dấu hiệu: không ai trong đội trả lời được con số này tính từ đâu.
- **Chỉ số đẹp lên trong khi người dùng phàn nàn nhiều hơn.** Chỉ số đang bị bẻ. Thiếu B7.

---

## 14. Tiêu chuẩn A không phải là gì

Tiêu chuẩn A **không phải phong cách tối giản**: một sản phẩm nhiều màu sắc, nhiều năng lượng vẫn đạt được nếu nó rõ, nhẹ, đáng tin và có chủ đích.

Nó **không đồng nghĩa với đắt**: phần lớn tiêu chí nằm ở thiết kế hành trình, trạng thái và đường hỏng, không nằm ở vật liệu.

Nó **không phải cầu toàn mọi thứ**: ngân sách trau chuốt dồn vào khoảnh khắc đặc trưng, phần còn lại cần đúng, nhất quán và không có ma sát ngẫu nhiên.

Nó **không có nghĩa là ít năng lực**: sản phẩm có thể rất sâu và mạnh, miễn độ phức tạp nằm bên trong hệ thống chứ không đẩy sang tay người dùng hay sang lưng người vận hành.

Nó **không phải là xoá mọi nỗ lực**. Nó tấn công ma sát ngẫu nhiên, giữ ma sát bảo vệ, và bảo vệ ma sát cấu thành. Một công cụ giúp bạn làm việc khó nhanh hơn đạt chuẩn; một công cụ khiến bạn không còn làm được việc đó nữa thì không, dù nó mượt hơn.

Nó **không phải là giấy chứng nhận đạo đức.** Một sản phẩm đạt A4 vẫn có thể gây hại. Đó là lý do cổng ở mục 3 đứng trước mọi điểm số, và đó cũng là lý do bảng điểm phải luôn ghi kèm kết quả của cổng đó.

---

## 15. Những gì đã đổi so với bản 1

| Thay đổi | Lý do |
|---|---|
| Thêm tầng 0, cổng G1 và G2 | Bản 1 trung tính về mục đích, nên có thể cấp điểm cao cho sản phẩm khai thác người dùng |
| Thêm luật xung đột (thứ tự từ vựng) | 15 tiêu chí mâu thuẫn nhau trong mọi quyết định thật; không có thứ tự thì tiêu chuẩn quay về gu cá nhân |
| Thêm phân loại ba loại ma sát | "Mọi ma sát phải chứng minh lý do tồn tại" đúng nhưng bỏ sót ma sát bảo vệ và ma sát cấu thành |
| Thêm A13 kiểm chứng được | Hệ thống sinh nội dung tạo ra dạng bất ngờ mới: bất ngờ về sự thật |
| Thêm A14 tiếp cận được | Bản 1 không có chữ nào về nhóm người dùng này, và đây đã là nghĩa vụ pháp lý ở EU từ 28/6/2025 |
| Thêm A15 không dịch chuyển ma sát, và tỷ số dịch chuyển | Định luật bảo toàn độ phức tạp: bản 1 có thể bị đạt bằng cách đẩy chi phí sang người vận hành |
| Sửa A6 thành che mặc định, lộ theo yêu cầu | Che hoàn toàn làm người dùng bất lực khi hỏng, và nhiều nơi luật buộc phải lộ |
| Mở rộng A8 sang hành động do hệ thống khởi xướng | Tác tử tự động thực hiện hành động thật cần nhật ký và hoàn tác |
| Mở rộng A7 thêm yêu cầu thứ tư về thẩm quyền | Giao việc khó cho người tuyến đầu mà không cho quyền là chuyển trách nhiệm, không phải thiết kế |
| Sửa B4 từ ma trận đầy đủ sang phân lớp cộng quy tắc bao trùm | Ma trận đầy đủ bất khả thi trong hệ thống ghép chặt, nên mục tiêu 100% ô sẽ bị bỏ |
| Tách B1 thành ba mức sở hữu S1, S2, S3 | Bản 1 ngầm giả định nguồn lực kiểu Apple |
| Thêm B7 chỉ số theo cặp | Gần như toàn bộ bộ đo ở bản 1 bẻ được nếu đứng một mình |
| Thêm B8 lớp truy nguyên | Nền kỹ thuật cho A13 và cho vế truy được của A6 |
| Nâng C1 từ một quyền lên ba quyền | Quyền chặn đứng một mình sẽ bị bào mòn; cần ngân sách và quyền đổi ranh giới đội |
| Thêm C8 ma sát có quyền phủ quyết tăng trưởng | A12 giả định xuống cấp do bất cẩn, trong khi phần lớn xuống cấp lớn là có chủ đích |
| Thêm quy tắc chấm điểm thứ ba, quy tắc không dịch chuyển | Để A15 có hiệu lực trong bảng điểm chứ không chỉ trong văn bản |
| Thêm mục 12.2 trình tự sửa | Thang đo cho biết đang ở đâu, không cho biết sửa gì trước |
| Ghi rõ giới hạn bằng chứng của quy tắc đỉnh và kết, và giới hạn của nhóm ĐẸP | Bằng chứng về nỗ lực mạnh hơn bằng chứng về sự vượt mong đợi; nói thẳng làm tiêu chuẩn đáng tin hơn |
