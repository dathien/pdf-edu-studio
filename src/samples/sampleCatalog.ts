import type { SubjectCategory } from '../types/studio';

export interface SampleDocDescriptor {
  id: string;
  title: string;
  subtitle: string;
  subject: SubjectCategory;
  categoryLabel: string;
  isScannedSample?: boolean;
  isGradingSample?: boolean;
}

/**
 * Lightweight metadata catalog for the 12 built-in practice documents.
 * Kept strictly free of PDF.js, pdf-lib, and MathJax imports so the home screen
 * renders instantaneously without loading any heavy processing engine.
 */
export const SAMPLE_DOCUMENTS: SampleDocDescriptor[] = [
  {
    id: 'sample-01-math-mcq',
    title: 'Đề kiểm tra Toán THPT – Trắc nghiệm',
    subtitle: 'Cấu trúc trắc nghiệm nhiều lựa chọn, Đúng/Sai 4 ý (2025) và Trả lời ngắn.',
    subject: 'math',
    categoryLabel: 'Toán học · Trắc nghiệm',
  },
  {
    id: 'sample-02-math-essay',
    title: 'Đề kiểm tra Toán THPT – Tự luận',
    subtitle: '5 câu tự luận khảo sát hàm số, tích phân, xác suất có thang điểm 10.',
    subject: 'math',
    categoryLabel: 'Toán học · Tự luận',
  },
  {
    id: 'sample-03-math-space',
    title: 'Đề Toán có công thức và hình học không gian',
    subtitle: 'Bài toán hình chóp S.ABCD kèm công thức MathLive & hình chiếu vector chỉnh sửa được.',
    subject: 'math',
    categoryLabel: 'Toán học · Hình không gian',
  },
  {
    id: 'sample-04-math-graph',
    title: 'Phiếu bài tập Toán có đồ thị hàm số',
    subtitle: 'Khảo sát sự biến thiên, cực trị và đồ thị hàm bậc ba, parabol.',
    subject: 'math',
    categoryLabel: 'Toán học · Đồ thị',
  },
  {
    id: 'sample-05-phys-formula',
    title: 'Đề kiểm tra Vật lí có công thức',
    subtitle: 'Dao động điều hòa, mạch RLC xoay chiều kèm công thức vector chỉnh sửa được.',
    subject: 'physics',
    categoryLabel: 'Vật lí · Công thức',
  },
  {
    id: 'sample-06-phys-circuit',
    title: 'Phiếu bài tập Vật lí có sơ đồ mạch điện',
    subtitle: 'Phân tích mạch điện nối tiếp, song song và lực trên mặt phẳng nghiêng.',
    subject: 'physics',
    categoryLabel: 'Vật lí · Sơ đồ mạch',
  },
  {
    id: 'sample-07-chem-eq',
    title: 'Đề kiểm tra Hóa học có phương trình',
    subtitle: 'Cân bằng hóa học thuận nghịch, phản ứng ion rút gọn và tính pH.',
    subject: 'chemistry',
    categoryLabel: 'Hóa học · Phương trình',
  },
  {
    id: 'sample-08-chem-lab',
    title: 'Phiếu thí nghiệm Hóa học có hình dụng cụ',
    subtitle: 'Thí nghiệm chuẩn độ axit – bazơ với buret, bình tam giác và bộ thu khí.',
    subject: 'chemistry',
    categoryLabel: 'Hóa học · Thí nghiệm',
  },
  {
    id: 'sample-09-bio',
    title: 'Phiếu học tập Sinh học',
    subtitle: 'Quang hợp, cấu trúc DNA, sơ đồ lai và định luật di truyền.',
    subject: 'biology',
    categoryLabel: 'Sinh học · Học liệu',
  },
  {
    id: 'sample-10-cs',
    title: 'Phiếu học tập Tin học',
    subtitle: 'Biểu thức logic Boolean, hệ nhị phân và đánh giá độ phức tạp thuật toán.',
    subject: 'cs',
    categoryLabel: 'Tin học · Thuật toán',
  },
  {
    id: 'sample-11-student-grade',
    title: 'Bài làm học sinh mẫu (Chấm tự luận)',
    subtitle: 'Bài làm tự luận có sẵn nội dung để chấm điểm, ghi nhận xét và xuất bảng điểm.',
    subject: 'math',
    categoryLabel: 'Chấm bài · Tự luận',
    isGradingSample: true,
  },
  {
    id: 'sample-12-scan-ocr',
    title: 'Tài liệu scan mẫu (OCR)',
    subtitle: 'Trang ảnh scan tiếng Việt dùng cho xử lý ảnh và nhận dạng văn bản OCR cục bộ.',
    subject: 'general',
    categoryLabel: 'OCR · Tài liệu scan',
    isScannedSample: true,
  },
];
