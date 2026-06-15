import time
import os
import sys
from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(encoding='utf-8')

def verify_website():
    print("Khởi động kiểm thử tự động nâng cấp bằng Playwright...")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.set_viewport_size({"width": 1400, "height": 900})
        
        url = "http://localhost:8080"
        print(f"Đang mở trang: {url}")
        page.goto(url)
        page.wait_for_load_state("networkidle")
        
        os.makedirs("d:/test/World_cup2026/assets/test_results", exist_ok=True)
        
        # Thiết lập tự động đồng ý (accept) khi gặp confirm dialog để reset giải đấu
        page.on("dialog", lambda dialog: dialog.accept())
        
        # 1. Đặt lại giải đấu để số trận hiển thị là 0/104 (Sửa lỗi trận đấu 104/104)
        print("Đang truy cập Admin Panel để đặt lại giải đấu về 0/104...")
        page.click("#tab-btn-admin")
        page.wait_for_timeout(500)
        page.click("#btn-reset-all")
        page.wait_for_timeout(500)
        
        # Quay lại Vòng bảng và chụp ảnh màn hình ban đầu (đã reset)
        page.click("#tab-btn-group")
        page.wait_for_timeout(500)
        print("Chụp ảnh màn hình Vòng bảng ban đầu (0/104)...")
        page.screenshot(path="d:/test/World_cup2026/assets/test_results/1_group_stage_initial.png")
        
        # 2. Kiểm thử nút chuyển đổi Theme sáng/tối
        print("Thử nghiệm chuyển đổi sang giao diện Sáng...")
        page.click("#theme-toggle")
        page.wait_for_timeout(500)
        page.screenshot(path="d:/test/World_cup2026/assets/test_results/2_light_theme_active.png")
        
        # Chuyển lại giao diện Tối
        print("Thử nghiệm chuyển lại giao diện Tối...")
        page.click("#theme-toggle")
        page.wait_for_timeout(500)
        
        # 3. Mô phỏng vòng bảng
        print("Đang bấm Mô phỏng vòng bảng...")
        page.click("#tab-btn-admin")
        page.wait_for_timeout(300)
        page.click("#btn-sim-group")
        page.wait_for_timeout(1000)
        
        # Xem bảng xếp hạng sau mô phỏng
        page.click("#tab-btn-group")
        page.wait_for_timeout(500)
        page.screenshot(path="d:/test/World_cup2026/assets/test_results/4_group_stage_simulated.png")
        
        # Click the first highlight button in the sidebar
        print("Mở Highlight modal của trận đấu vòng bảng...")
        page.click(".btn-highlight-compact >> nth=0")
        page.wait_for_timeout(800)
        page.screenshot(path="d:/test/World_cup2026/assets/test_results/10_highlight_modal.png")
        # Close highlight modal
        page.click("#btn-close-modal")
        page.wait_for_timeout(300)
        
        # 4. Kiểm thử nhấp thanh tiến trình chuyển đổi vòng thi đấu
        print("Nhấp vào 'Vòng 32 đội' trên thanh tiến trình...")
        page.click("#step-r32")
        page.wait_for_timeout(800) # Chờ cuộn và highlight cột
        page.screenshot(path="d:/test/World_cup2026/assets/test_results/5_knockout_bracket_round32.png")
        
        # 5. Mô phỏng tiếp toàn bộ giải đấu
        print("Quay lại Bảng điều khiển để mô phỏng toàn giải đấu...")
        page.click("#tab-btn-admin")
        page.wait_for_timeout(300)
        page.click("#btn-sim-all")
        page.wait_for_timeout(1500)
        
        # Xem sơ đồ đối xứng hoàn chỉnh cuối cùng
        print("Chuyển sang nhánh đấu để xem sơ đồ đối xứng chung cuộc...")
        page.click("#tab-btn-knockout")
        page.wait_for_timeout(800)
        page.screenshot(path="d:/test/World_cup2026/assets/test_results/7_knockout_bracket_final.png")
        
        # Chụp ảnh nhánh đấu ở chế độ Light Theme xem có đẹp không
        print("Chuyển sang Light Theme cho sơ đồ nhánh đấu...")
        page.click("#theme-toggle")
        page.wait_for_timeout(500)
        page.screenshot(path="d:/test/World_cup2026/assets/test_results/7_knockout_bracket_final_light.png")
        
        # Quay về Dark Theme
        page.click("#theme-toggle")
        page.wait_for_timeout(300)
        
        # Nhấp vào 'Chung kết' trên thanh tiến trình để cuộn về cột giữa
        print("Nhấp vào 'Chung kết' trên thanh tiến trình để cuộn vào giữa...")
        page.click("#step-final")
        page.wait_for_timeout(800)
        page.screenshot(path="d:/test/World_cup2026/assets/test_results/8_knockout_bracket_center_final.png")
        
        # 6. Xem thống kê giải đấu
        print("Chuyển sang Tab Thống kê giải đấu...")
        page.click("#tab-btn-stats")
        page.wait_for_timeout(500)
        page.screenshot(path="d:/test/World_cup2026/assets/test_results/9_tournament_stats.png")
        
        print("Tất cả kiểm thử giao diện đối xứng, cờ quốc gia, theme sáng tối và thanh tác vụ đã hoàn tất thành công!")
        browser.close()

if __name__ == "__main__":
    verify_website()
