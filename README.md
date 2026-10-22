# HỆ THỐNG PWA THEO DÕI & THỐNG KÊ CUỘC THI TRỰC TUYẾN
> **Dành cho các trường học quy mô ~100 Cán bộ, Giáo viên, Nhân viên**  
> Tích hợp: **PWA Di Động** + **Firebase Realtime Database** + **Google Drive Tự Động Phân Thư Mục Cá Nhân**

---

## 🌟 TÍNH NĂNG NỔI BẬT

1. **Giáo Viên Cài Đặt App Trực Tiếp Lên Điện Thoại (PWA):**
   - Hỗ trợ cả iPhone (iOS Safari) và Android (Chrome).
   - Có biểu tượng riêng trên màn hình chính, mở toàn màn hình như ứng dụng chuyên nghiệp.
2. **Đăng Nhập Bằng Gmail 1 Lần Duy Nhất (Single Sign-On):**
   - Không cần nhớ mật khẩu hay mã PIN.
   - Lần đầu tiên, giáo viên chọn tên mình trong danh sách 97 CB-GV để liên kết.
   - Từ lần thứ 2 trở đi, mở app là tự động nhận diện danh tính.
3. **Bộ Nén Ảnh Canvas Client-Side:**
   - Ảnh chụp màn hình từ điện thoại dung lượng 4–8MB được nén ngay trên máy xuống còn ~150KB–250KB.
   - Tiết kiệm 95% dung lượng lưu trữ, nộp cực nhanh kể cả khi mạng 4G yếu.
4. **Google Drive Tự Động Phân Loại Theo Từng Giáo Viên:**
   - Trong Google Drive của trường, mỗi giáo viên có một thư mục riêng: `STT - HỌ VÀ TÊN` (ví dụ: `01 - NGÔ THỊ LIỀN`).
   - Ảnh minh chứng tự động lưu đúng vào thư mục của giáo viên đó, tên file có ngày giờ và tên cuộc thi.
5. **Bảng Điều Hành Quản Trị Viên Thời Gian Thực (Live Dashboard):**
   - Ma trận 97 GV $\times$ Các cuộc thi (tự động nhảy tích xanh ngay khi GV nộp bài mà không cần F5).
   - Nút **"Đôn đốc Zalo 1-Chạm"**: Tự động gom danh sách giáo viên chưa nộp để gửi vào nhóm Zalo trường.
   - Nút **"Xuất Báo Cáo Excel"**: Xuất file `.xlsx` chuẩn mẫu ngành giáo dục kèm đường dẫn xem ảnh minh chứng.

---

## 🚀 HƯỚNG DẪN VẬN HÀNH DÀNH CHO NHÀ TRƯỜNG

### BƯỚC 1: KHỞI ĐỘNG ỨNG DỤNG TRÊN MÁY TÍNH QUẢN TRỊ
1. Nhấp đúp vào tệp `CHAY_UNG_DUNG.bat`.
2. Trình duyệt sẽ tự động mở trang web quản trị tại: `http://localhost:3008`.
3. Để giáo viên trong trường dùng điện thoại truy cập qua mạng Wi-Fi nội bộ, nhìn vào cửa sổ màu đen để lấy địa chỉ IP (ví dụ: `http://192.168.1.10:3008`).

---

### BƯỚC 2: THIẾT LẬP CẦU NỐI GOOGLE DRIVE (CHỈ MẤT 1 PHÚT)
1. Dùng tài khoản Google của nhà trường (hoặc tài khoản quản trị), truy cập: [https://script.google.com/](https://script.google.com/).
2. Nhấn **"Dự án mới" (New project)**.
3. Sao chép toàn bộ mã nguồn trong tệp `google_apps_script/Code.gs` và dán vào trình soạn thảo.
4. Nhấn **"Triển khai" (Deploy)** $\rightarrow$ **"Tùy chọn triển khai mới" (New deployment)**:
   - Loại: **Ứng dụng web (Web app)**.
   - Thực thi dưới dạng: **Tôi (tài khoản Google của bạn)**.
   - Ai có quyền truy cập: **Bất kỳ ai (Anyone)**.
5. Nhấn **"Triển khai"** và sao chép đường dẫn **URL ứng dụng web** (có dạng `https://script.google.com/macros/s/AKfy.../exec`).
6. Mở App $\rightarrow$ Nhấn nút biểu tượng bánh răng **⚙️ (Cài đặt)** ở góc trên bên phải $\rightarrow$ Dán URL vừa sao chép vào ô **"Google Apps Script Web App URL"** $\rightarrow$ Nhấn **"Lưu Thiết Lập"**.
7. *(Tùy chọn)*: Nhấn nút **"Khởi Tạo 97 Thư Mục Trên Google Drive"** để hệ thống tự tạo sẵn 97 thư mục ngăn nắp trên Drive của trường.

---

### BƯỚC 3: THIẾT LẬP FIREBASE (THỐNG KÊ REALTIME & GOOGLE SIGN-IN)
1. Truy cập [https://console.firebase.google.com/](https://console.firebase.google.com/) $\rightarrow$ Tạo dự án mới miễn phí.
2. Vào mục **Authentication** $\rightarrow$ **Sign-in method** $\rightarrow$ Bật **Google**.
3. Vào mục **Realtime Database** $\rightarrow$ Nhấn **Create Database** (chọn khu vực Singapore hoặc US).
4. Vào **Project Settings (Cài đặt dự án)** $\rightarrow$ Cuộn xuống mục **Your apps** $\rightarrow$ Thêm Web App (`</>`) để lấy mã cấu hình:
   - `apiKey`
   - `databaseURL`
   - `projectId`
5. Dán các thông số này vào mục **⚙️ Cài đặt** của Ứng dụng.

*(Lưu ý: Ứng dụng đã tích hợp sẵn chế độ Offline/Local Fallback, nếu chưa nhập key Firebase thì hệ thống vẫn hoạt động đầy đủ trên trình duyệt!)*

---

### BƯỚC 4: HƯỚNG DẪN GIÁO VIÊN SỬ DỤNG TRÊN ĐIỆN THOẠI
1. Giáo viên mở đường link ứng dụng trên điện thoại (gửi qua Zalo).
2. Nhấn nút **"Cài đặt App"** (trên Android) hoặc bấm **Chia sẻ $\rightarrow$ Thêm vào Màn hình chính** (trên iPhone).
3. Bấm **"Đăng nhập Google"** và chọn tên mình lần đầu tiên.
4. Khi thi xong cuộc thi tìm hiểu trực tuyến, chụp ảnh màn hình kết quả $\rightarrow$ Mở App $\rightarrow$ Chạm chọn ảnh $\rightarrow$ Bấm **"GỬI MINH CHỨNG LÊN GOOGLE DRIVE TRƯỜNG"**.
5. Nhận thông báo tích xanh thành công ngay lập tức!

---

### BƯỚC 5: HƯỚNG DẪN BẢNG QUẢN TRỊ DÀNH CHO BAN GIÁM HIỆU
1. Nhấp sang Tab **"📊 Bảng Quản Trị & Thống Kê"** (Mã PIN quản trị mặc định: `2026`).
2. Xem tỷ lệ hoàn thành, bảng ma trận danh sách 97 thầy cô.
3. Bấm nút **"📢 Đôn Đốc Zalo 1-Chạm"** để sao chép danh sách những người chưa nộp và dán thẳng vào Zalo trường.
4. Bấm nút **"📥 Xuất Báo Cáo Excel"** để tải file Excel tổng hợp nộp cấp trên bất cứ lúc nào.
5. Bấm nút **"➕ Thêm Cuộc Thi"** khi có công văn phát động cuộc thi mới.

---

*Hệ thống được phát triển chuyên biệt theo dữ liệu thực tế và quy chuẩn vận hành của các trường học Việt Nam.*
