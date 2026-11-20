# PDF EDU STUDIO

**Chỉnh sửa – Soạn thảo – Chấm bài thông minh**

Ứng dụng web & PWA giáo dục toàn diện dành cho giáo viên, học sinh, giảng viên và sinh viên Việt Nam. Xử lý 100% cục bộ ngay trên thiết bị, không yêu cầu đăng nhập, không cần API key, hỗ trợ hoạt động cả online và offline.

## Tính năng chính

- **Đọc & Chỉnh sửa PDF tiếng Việt**: Sửa chữ trực tiếp trên văn bản gốc (kèm phát hiện trang scan), thêm văn bản Unicode (nhúng sẵn font DejaVuSans/DejaVuSerif), tìm kiếm & thay thế, chèn hình ảnh, bảng biểu, ghi chú, chữ ký hình ảnh.
- **Soạn công thức 5 môn học (MathLive + MathJax SVG + Typst)**: Trình soạn trực quan không cần nhớ mã LaTeX, hỗ trợ Toán, Vật lí, Hóa học, Sinh học, Tin học và cú pháp Typst, xuất đường nét vector sắc nét vào PDF.
- **Thư viện 120 hình vẽ khoa học + 3 Xưởng vẽ tương tác**:
  - 120 mẫu hình vector Toán, Vật lí, Hóa học có nhãn thông minh chống đè cạnh.
  - **Xưởng Hình học động 2D** (dựng hình phụ thuộc kéo thả trực tiếp).
  - **Xưởng Đồ thị hàm số** (bộ phân tích toán học an toàn không dùng `eval`, thanh trượt tham số `a, b, c`, tự động xử lý tiệm cận).
  - **Xưởng Hình học không gian 3D (Three.js)** hỗ trợ xoay góc nhìn, mặt phẳng cắt và xuất hình chiếu vector 2D nét liền/nét đứt vào PDF.
- **Chấm bài thông minh & Xuất Excel**:
  - Chấm tự luận, trắc nghiệm ABCD, Đúng/Sai 4 ý chuẩn THPT 2025 (tùy biến thang điểm), Trả lời ngắn.
  - Đóng dấu chấm đỏ, gắn ô điểm câu đồng bộ hai chiều với bảng điểm, khung tổng điểm tự cập nhật.
  - Sổ điểm cục bộ (IndexedDB) & Xuất Excel `.xlsx` / CSV (UTF-8 BOM).
- **Quản lý trang & Bảo mật đề thi**: Ghép PDF, Tách PDF (ZIP), Cắt lề (CropBox), Nén PDF 3 mức, Chuyển ảnh thành PDF (A4/A5/2-up), Xóa vĩnh viễn nội dung bảo mật (Redaction dựng lại trang phẳng + xác minh không còn văn bản ẩn), Xóa Metadata, Dấu chìm (Watermark), Đánh số trang, Chế độ Đề mật không lưu nháp.
- **OCR cục bộ (Tesseract.js)**: Tiền xử lý chỉnh nghiêng (Deskew), tương phản, đen trắng và nhận dạng tiếng Việt + tiếng Anh ngay trên trình duyệt.
- **12 Tài liệu thực hành mẫu** tích hợp sẵn & **PWA Offline**.

## Chạy cục bộ & Triển khai

```bash
npm install
npm run dev
```

Build sản phẩm (sẵn sàng triển khai lên Vercel / GitHub Pages):

```bash
npm run build
```

## Bản quyền

Copyright © 2026 – Phát triển bởi Thầy Hồ Nguyễn Đa Thiện.
Xem chi tiết giấy phép mã nguồn mở và các thư viện bên thứ ba tại tệp `LICENSE`.
