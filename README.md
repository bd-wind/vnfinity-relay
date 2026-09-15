# HƯỚNG DẪN TRIỂN KHAI CLOUD RELAY TRÊN RENDER.COM

Server này dùng để chuyển tiếp tín hiệu TikTok Live trên đám mây, giúp máy dùng mạng FPT hoặc mạng bị chặn IP kết nối mượt mà 100%.

### CÁC BƯỚC THỰC HIỆN TRÊN RENDER (CHỈ MẤT 2 PHÚT):

1. **Đăng ký / Đăng nhập Render**:
   - Truy cập: https://dashboard.render.com
   - Đăng nhập bằng Google (chỉ 1 click là xong).

2. **Tạo Web Service mới**:
   - Bấm nút **New +** ở góc trên bên phải $\rightarrow$ Chọn **Web Service**.
   - Ở mục chọn mã nguồn:
     - Bạn có thể tải thư mục `vnfinity-relay` này lên tài khoản GitHub của bạn rồi liên kết với Render.
     - Hoặc kết nối kho GitHub chứa 2 file `package.json` và `server.js`.

3. **Cấu hình Web Service**:
   - **Name**: `vnfinity-relay` (hoặc tên tùy thích)
   - **Region**: Singapore hoặc Oregon (US)
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Instance Type**: Chọn **Free** ($0/tháng - 750 giờ miễn phí mỗi tháng).
   - Bấm **Create Web Service**.

4. **Lấy Link dán vào VNFINITY**:
   - Đợi khoảng 1 phút Render báo `Deploy live`.
   - Copy đường link của Render (dạng `https://vnfinity-relay-xxxx.onrender.com`).
   - Mở app VNFINITY $\rightarrow$ Dán vào ô **Render Relay URL** $\rightarrow$ Xong vĩnh viễn!
