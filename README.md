# PDF EDU STUDIO

**Chỉnh sửa – Soạn thảo – Chấm bài thông minh**

Công cụ xử lý PDF chuyên biệt dành cho giáo dục, hỗ trợ chỉnh sửa văn bản, chèn công thức khoa học, vẽ hình minh họa, chú thích, chấm bài và quản lý tài liệu PDF trên cùng một nền tảng.

## Tính năng chính

- **Đọc & Chỉnh sửa PDF tiếng Việt**: Sửa chữ trực tiếp trên văn bản gốc (kèm phát hiện trang scan), thêm văn bản Unicode (nhúng sẵn font DejaVuSans/DejaVuSerif), tìm kiếm & thay thế, chèn hình ảnh, bảng biểu, ghi chú và chữ ký hình ảnh.
- **Soạn công thức khoa học (MathLive + MathJax SVG + Typst)**: Trình soạn trực quan không cần nhớ mã LaTeX, hỗ trợ Toán, Vật lí, Hóa học, Sinh học, Tin học và cú pháp Typst, xuất đường nét vector sắc nét vào PDF.
- **Thư viện hình vẽ khoa học & Xưởng vẽ tương tác**:
  - Thư viện hình minh họa vector Toán, Vật lí, Hóa học có nhãn chống đè cạnh.
  - **Hình học động 2D**: Dựng hình phụ thuộc kéo thả trực tiếp.
  - **Đồ thị hàm số**: Bộ phân tích toán học an toàn, hỗ trợ tham số và xử lý tiệm cận.
  - **Hình học không gian 3D (Three.js)**: Hỗ trợ xoay góc nhìn, mặt phẳng cắt và xuất hình chiếu vector 2D nét liền/nét đứt vào PDF.
- **Chấm bài & Quản lý bảng điểm**:
  - Hỗ trợ giáo viên chấm bài thủ công trực tiếp trên PDF (bút đỏ, đóng dấu đúng/sai, ghi điểm từng câu, nhận xét nhanh, khung tổng điểm đồng bộ) cùng bảng đối chiếu đáp án trắc nghiệm (ABCD, Đúng/Sai 4 ý, Trả lời ngắn).
  - Lưu kết quả chấm bài cục bộ trên trình duyệt (IndexedDB) và xuất bảng điểm định dạng Excel (`.xlsx`) / CSV.
- **Quản lý trang & Bảo mật tài liệu**: Ghép PDF, Tách PDF (ZIP), Cắt lề (CropBox), Nén PDF, Chuyển ảnh thành PDF (A4/A5/2-up), Xóa vĩnh viễn nội dung (Redaction), Xóa Metadata, Dấu chìm (Watermark), Đánh số trang và Chế độ Đề mật không lưu nháp.
- **Nhận dạng văn bản OCR (Tesseract.js)**: Tiền xử lý chỉnh thẳng trang, tăng tương phản, đen trắng và nhận dạng tiếng Việt + tiếng Anh ngay trên trình duyệt.
- **Thư viện tài liệu mẫu tích hợp sẵn** & hỗ trợ cài đặt **PWA** để làm việc ngoại tuyến sau khi trình duyệt đã tải đủ tài nguyên đệm.

## Chạy cục bộ & Triển khai

```bash
bun install
bun run dev
```

Build sản phẩm (tương thích Vercel / GitHub Pages, đầu ra tại thư mục `dist`):

```bash
bun run build
```

## Bản quyền

Copyright © 2026 – Phát triển bởi Thầy Hồ Nguyễn Đa Thiện.
Xem chi tiết giấy phép mã nguồn mở và các thư viện bên thứ ba tại tệp `LICENSE`.
