# ADR-009: Đơn vị nhập và hiển thị tiền

**Trạng thái:** Đã chấp nhận, 22/11/2026. **Cửa:** hai chiều (chỉ ở tầng UI).

## Quyết định
- Trang chỉ dùng VND. Có ba đơn vị: đồng, nghìn đồng, triệu đồng.
- **Nhập:** mỗi ô chọn đơn vị độc lập, mặc định là nghìn. Số chữ số lẻ tối đa: đồng 0, nghìn 3, triệu 6. Như vậy mọi đơn vị đều biểu diễn được tới từng đồng.
- **Core chỉ nhận số nguyên đồng.** Đơn vị không đi vào `src/lib/core`.
- **Kết quả:** chọn được đơn vị, mặc định là triệu. Số chữ số lẻ khi hiển thị: triệu 1, nghìn 1, đồng 0.

## Bất biến (cài trong `src/lib/ui/amount.ts`)
- **U1.** Parse không dùng phép nhân số thực mà dùng BigInt trên chuỗi. Lý do: trong JS, `1.005 * 1000 = 1004.9999999999999`.
- **U2.** Đổi đơn vị của một ô là đổi cách hiển thị cùng một số đồng. Ví dụ 30.000 nghìn đổi sang triệu thì hiện 30.
- **U3.** Chỉ làm tròn ở bước hiển thị, từng số độc lập. Tổng luôn tính từ số đồng chính xác. Không chỉnh các dòng để cộng khớp tổng. Thay vào đó, ghi chú "số đã làm tròn" và cho chạm vào để xem số chính xác.
- **U4.** Số khác 0 không bao giờ hiện thành "0,0". Ví dụ Δ = 40.000 đ nằm dưới ngưỡng 50.000 đ, nếu hiện "0,0 triệu" thì người dùng sẽ hiểu là bằng 0. Hàm trả "< 0,1" và cờ `tooSmall` để UI chuyển dòng đó sang đơn vị nghìn.

## Quy ước số kiểu Việt Nam
- Dấu phẩy là phần lẻ, dấu chấm phân cách nghìn.
- Chuỗi dạng "1.500" (đúng nhóm 3 chữ số) luôn được đọc là 1500. Chuỗi dạng "12.5" được đọc là 12,5.
- Quy ước này có thể gây nhầm gấp 1.000 lần. Lưới an toàn là **cạnh mỗi ô luôn hiện "= … đ"**.
- Nhận được chuỗi dán từ phiếu lương, ví dụ "30.000.000 đ" hay "VND".

## Làm tròn
- Hiển thị: làm tròn nửa xa số 0, đối xứng cho số âm.
- Làm tròn **theo luật** (ví dụ thuế tháng tới đồng) là chuyện khác. Đó là tham số của Rulebook và nằm trong core. Không dùng chung hai loại làm tròn.
