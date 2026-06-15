# ☤ World Cup 2026 — Workspace Agent Instructions

Tài liệu này chứa các quy tắc phát triển, cấu trúc thư mục, quy định thẩm mỹ và quy trình kiểm thử dành cho các tác nhân AI (như Hermes Agent hoặc Antigravity) khi làm việc trên dự án này.

---

## 1. Tổng quan Dự án & Kiến trúc

Dự án này là ứng dụng web tương tác hiển thị thông tin, lịch thi đấu, sơ đồ đối xứng và bảng xếp hạng của giải đấu **FIFA World Cup 2026**.

### Sơ đồ cấu trúc file chính:
* [index.html](file:///d:/test/World_cup2026/index.html): File giao diện tĩnh chứa khung HTML của ứng dụng (4 Tab: Vòng bảng, Sơ đồ nhánh, Thống kê, Bảng điều khiển Admin).
* [styles.css](file:///d:/test/World_cup2026/styles.css): Hệ thống CSS chứa thiết lập giao diện tối (Dark Theme - mặc định) và giao diện sáng (Light Theme), kết hợp các biến màu sắc World Cup 2026.
* [app.js](file:///d:/test/World_cup2026/app.js): Chứa toàn bộ logic quản lý trạng thái (`state`), tính toán điểm số vòng bảng, phân phối nhánh đấu knockout, mô phỏng tự động và hiển thị dữ liệu.
* [verify_site.py](file:///d:/test/World_cup2026/verify_site.py): Bộ mã nguồn tự động hóa bằng Playwright để kiểm thử giao diện, mô phỏng các vòng đấu và chụp ảnh màn hình xác thực.
* [data.json](file:///d:/test/World_cup2026/data.json): Cơ sở dữ liệu của giải đấu (đội bóng, lịch thi đấu, trạng thái).

---

## 2. Tiêu chuẩn Thẩm mỹ & Thiết kế (Design Guidelines)

* **Bảng màu cầu vồng World Cup 2026**: Sử dụng bộ màu sắc lễ hội lấy cảm hứng từ branding WC2026:
  * `--wc-red: #e53935;` (Accent Đỏ)
  * `--wc-purple: #7c4dff;` (Accent Tím)
  * `--wc-blue: #536dfe;` (Accent Xanh dương)
  * `--wc-green: #00c853;` (Accent Xanh lá)
  * `--wc-lime: #c6ff00;` (Accent Vàng chanh)
  * `--wc-orange: #ff6d00;` (Accent Cam ấm)
  * `--wc-coral: #ff6f61;` (Accent Hồng san hô)
* **Giao diện tối (Dark Theme)**: Base màu navy/tím ấm (#0c0f1a, #141828) kết hợp phủ mờ glassmorphism và dải màu gradient cầu vồng cực kỳ nhẹ nhàng (opacity 2%).
* **Giao diện sáng (Light Theme)**: Nền xám trắng tinh khiết (#fafbff, #ffffff) kết hợp các điểm nhấn viền cầu vồng tinh tế ở status bar, tabs và các thẻ bảng đấu.
* **Viền giả lập (Border gradients)**: Đối với các góc bo (`border-radius`), không dùng `border-image` vì sẽ làm mất góc bo. Hãy sử dụng pseudo-element `::after` định vị tuyệt đối ở cạnh dưới để vẽ dải màu gradient cầu vồng.

---

## 3. Quy tắc ngôn ngữ tiếng Việt (Vietnamese Casing Rules)

* **Không viết hoa vô tội vạ**: Tuyệt đối tuân thủ quy tắc viết hoa trong tiếng Việt (chỉ viết hoa chữ cái đầu tiên của câu và danh từ riêng).
* **Tránh Title Case bừa bãi**: Ví dụ, dùng `Vòng 32 đội` thay vì `Vòng 32 Đội`, `Tranh hạng ba` thay vì `Tranh Hạng Ba`.

---

## 4. Quy trình Kiểm thử & Xác thực (TDD)

* **Máy chủ cục bộ**: Chạy máy chủ kiểm thử qua lệnh:
  ```powershell
  python -m http.server 8080
  ```
* **Chạy kiểm thử tự động**: Chạy file python kiểm thử Playwright để đảm bảo giao diện không bị lệch hoặc lỗi JavaScript:
  ```powershell
  python verify_site.py
  ```
* **Xác thực kết quả**: Kiểm tra các tệp ảnh chụp màn hình được sinh ra trong thư mục `assets/test_results/` (hoặc copy vào thư mục artifacts của agent để xem hình ảnh trực tiếp).

---

## 5. Tích hợp cùng Hermes Agent

* Khi chạy Hermes Agent tại thư mục này, agent sẽ tự động nạp file `AGENTS.md` này làm chỉ dẫn ngữ cảnh (`context_files`).
* Bạn có thể tạo các tác vụ lập lịch (cron) cho Hermes để tự động chạy `verify_site.py` hoặc cập nhật dữ liệu trận đấu thông qua script `update_data.py`.
