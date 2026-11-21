import React, { useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  FileDown,
  FolderOpen,
  GraduationCap,
  HardDrive,
  Link2,
  ScanSearch,
  Send,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';

export const InteractiveGuidePanel: React.FC = () => {
  const [roleTab, setRoleTab] = useState<'teacher' | 'student'>('teacher');

  return (
    <div className="flex-1 overflow-y-auto bg-[#F4F8F7] p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-[21px] font-bold text-[#164E63] flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-[#087F70]" />
                <span>Hướng dẫn quy trình Bài tập PDF tương tác (6 khu vực)</span>
              </h2>
              <p className="text-[15.5px] text-slate-600 mt-1">
                Tải PDF → Chọn trang → Nhận diện câu hỏi → Giáo viên duyệt → Giao bài Online/Offline → Học sinh làm & nộp → Thu bài, chấm và trả kết quả.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setRoleTab('teacher')}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[15px] font-semibold cursor-pointer transition-colors ${
                  roleTab === 'teacher'
                    ? 'bg-[#164E63] text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-[#E6F1EF]'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                <span>Quy trình Giáo viên</span>
              </button>
              <button
                type="button"
                onClick={() => setRoleTab('student')}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[15px] font-semibold cursor-pointer transition-colors ${
                  roleTab === 'student'
                    ? 'bg-[#087F70] text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-[#E6F1EF]'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                <span>Quy trình Học sinh</span>
              </button>
            </div>
          </div>
        </div>

        {roleTab === 'teacher' ? (
          <div className="space-y-4">
            <div className="rounded-xl bg-white border border-slate-200 p-5 space-y-2.5">
              <h3 className="text-[17px] font-bold text-[#164E63] flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-[#164E63] text-white text-[14px] flex items-center justify-center shrink-0">
                  1
                </span>
                <span>Tải PDF, chọn trang bài học & phân biệt Trang PDF với Trang in</span>
              </h3>
              <p className="text-[15.5px] text-slate-700 leading-relaxed">
                Tại mục <strong>Tạo bài tập</strong>, tải tệp PDF nhiều trang từ máy tính (ví dụ vở bài tập 57 trang). Nhập phạm vi trang cần trích (1 trang như <code>2</code>, khoảng trang <code>2-3</code>, trang không liên tiếp <code>2, 3, 7-9</code>, hoặc toàn bộ). Hệ thống hiển thị tách biệt <strong>Trang PDF</strong> và <strong>Trang in trên tài liệu</strong> để tránh nhầm trang khi đặt vùng trả lời.
              </p>
            </div>

            <div className="rounded-xl bg-white border border-slate-200 p-5 space-y-2.5">
              <h3 className="text-[17px] font-bold text-[#164E63] flex items-center gap-2">
                <ScanSearch className="w-5 h-5 text-[#087F70] shrink-0" />
                <span>Bước 2: Nhấn "Nhận diện bài tập" và Giáo viên duyệt vùng</span>
              </h3>
              <p className="text-[15.5px] text-slate-700 leading-relaxed">
                Hệ thống đọc lớp văn bản PDF.js để đề xuất vùng trả lời cho 14 dạng câu hỏi (trắc nghiệm 1/nhiều đáp án, Đúng/Sai, ghép đôi vẽ đường nối/kéo thả, điền khuyết, nhập số, công thức MathLive, tự luận, vẽ hình...). Những vùng chưa chắc chắn được gắn nhãn <strong>Cần GV kiểm tra</strong>. Thầy/cô chọn từng câu ở cột trái (tự cuộn đến đúng vị trí trên PDF), kéo/đổi cỡ vùng, đổi loại câu hỏi nếu cần, nhập đáp án chuẩn + thang điểm và nhấn <strong>Xác nhận duyệt</strong>.
              </p>
            </div>

            <div className="rounded-xl bg-white border border-slate-200 p-5 space-y-2.5">
              <h3 className="text-[17px] font-bold text-[#164E63] flex items-center gap-2">
                <Send className="w-5 h-5 text-[#087F70] shrink-0" />
                <span>Bước 3: Giao bài Offline hoặc tạo liên kết Online tại mục "Giao bài"</span>
              </h3>
              <p className="text-[15.5px] text-slate-700 leading-relaxed">
                <strong>Offline:</strong> Xuất tệp <code>.pdfedu</code> (đã loại bỏ hoàn toàn đáp án giáo viên) gửi qua Zalo, Email, LMS hoặc USB.{' '}
                <strong>Online:</strong> Khi đặt tệp <code>.pdfedu</code> lên đường dẫn HTTPS hợp lệ, dán URL vào mục <strong>Giao bài → Online</strong> để sinh liên kết thật và mã bài cho học sinh mở trực tiếp. Danh sách <strong>Quản lý bài đã giao</strong> lưu lại lịch giao, hạn nộp và thống kê số bài nộp thật đã nhận.
              </p>
            </div>

            <div className="rounded-xl bg-white border border-slate-200 p-5 space-y-2.5">
              <h3 className="text-[17px] font-bold text-[#164E63] flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-[#164E63] text-white text-[14px] flex items-center justify-center shrink-0">
                  4
                </span>
                <span>Thu bài, chấm tự động + chấm thủ công, xuất PDF trả bài & Excel</span>
              </h3>
              <p className="text-[15.5px] text-slate-700 leading-relaxed">
                Tại mục <strong>Thu bài & Chấm bài</strong>, nhập cùng lúc nhiều tệp bài nộp <code>.pdfedu</code> của học sinh. Hệ thống kiểm tra tính toàn vẹn, phát hiện trùng lặp, không tự ghi đè bài đã chấm và chỉ chấm tự động theo đáp án gốc giáo viên (tự luận, vẽ hình, công thức phức tạp, tệp đính kèm do giáo viên chấm thủ công). Sau đó xuất <strong>PDF trả bài</strong> (hiển thị cả đường nối, thẻ kéo thả, điểm & nhận xét) và <strong>bảng điểm Excel (.xlsx)</strong>.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl bg-white border border-slate-200 p-5 space-y-2.5">
              <h3 className="text-[17px] font-bold text-[#087F70] flex items-center gap-2">
                <FolderOpen className="w-5 h-5 shrink-0" />
                <span>Bước 1: Mở bài tập từ tệp Offline (.pdfedu) hoặc liên kết Online</span>
              </h3>
              <p className="text-[15.5px] text-slate-700 leading-relaxed">
                Em mở tệp <code>.pdfedu</code> giáo viên gửi tại mục <strong>Làm bài</strong>, hoặc nhấn trực tiếp vào liên kết bài tập giáo viên chia sẻ. Sau khi tải về, em vẫn có thể tiếp tục làm bài ngay cả khi mất kết nối mạng.
              </p>
            </div>

            <div className="rounded-xl bg-white border border-slate-200 p-5 space-y-2.5">
              <h3 className="text-[17px] font-bold text-[#087F70] flex items-center gap-2">
                <Link2 className="w-5 h-5 shrink-0" />
                <span>Bước 2: Làm bài trực tiếp trên trang PDF (14 dạng tương tác)</span>
              </h3>
              <p className="text-[15.5px] text-slate-700 leading-relaxed">
                Nhập <strong>Họ và tên</strong>, <strong>Lớp</strong> ở thanh phía trên. Em có thể chọn 1 hoặc nhiều đáp án, đánh dấu Đúng/Sai, nhập số, gõ công thức bằng MathLive, vẽ tay, chú thích sơ đồ, nối cặp bằng đường nối SVG (kéo hoặc chạm A → B) hoặc kéo thả thẻ vào ô đích.
              </p>
            </div>

            <div className="rounded-xl bg-white border border-slate-200 p-5 space-y-2.5">
              <h3 className="text-[17px] font-bold text-[#087F70] flex items-center gap-2">
                <HardDrive className="w-5 h-5 shrink-0" />
                <span>Bước 3: Lưu bài vào thiết bị và mở lại từ "Bài đã lưu"</span>
              </h3>
              <p className="text-[15.5px] text-slate-700 leading-relaxed">
                Hệ thống tự động lưu vào IndexedDB và cho phép nhấn <strong>Lưu bài</strong> bất cứ lúc nào. Khi đóng và mở lại trình duyệt, vào mục <strong>Bài đã lưu</strong> để làm tiếp mà không mất đường nối, vị trí kéo thả, công thức hay nét vẽ.
              </p>
            </div>

            <div className="rounded-xl bg-white border border-slate-200 p-5 space-y-2.5">
              <h3 className="text-[17px] font-bold text-[#087F70] flex items-center gap-2">
                <FileDown className="w-5 h-5 shrink-0" />
                <span>Bước 4: Hoàn thành và xuất bài nộp cho giáo viên</span>
              </h3>
              <p className="text-[15.5px] text-slate-700 leading-relaxed">
                Nhấn <strong>Xuất bài nộp (.pdfedu)</strong> để tạo tệp nộp chuẩn gửi cho giáo viên chấm điểm, và có thể xuất thêm <strong>PDF bài làm</strong> để lưu trữ hoặc in ra giấy.
              </p>
            </div>
          </div>
        )}

        <div className="rounded-xl bg-[#E6F1EF] border border-teal-200 p-5 flex items-start gap-3">
          <ShieldCheck className="w-6 h-6 text-[#087F70] shrink-0 mt-0.5" />
          <div className="space-y-1 text-[15px] text-[#164E63]">
            <div className="font-bold">Cam kết minh bạch về Offline, Online & An toàn dữ liệu</div>
            <p className="leading-relaxed">
              Quy trình Offline xử lý 100% cục bộ không cần đăng nhập hay API trả phí, không lưu đáp án giáo viên trong tệp giao học sinh và không tin điểm tự khai trong bài nộp. Khi chưa kết nối máy chủ thu bài riêng, ứng dụng không giả lập nút nộp trực tuyến mà hướng dẫn học sinh xuất tệp <strong>.pdfedu</strong> gửi qua kênh lớp học.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[14.5px] text-slate-500 pb-6">
          <CheckCircle2 className="w-4 h-4 text-[#087F70] shrink-0" />
          <span>Hỗ trợ 14 dạng câu hỏi · Tự nhận diện PDF.js có giáo viên duyệt · Tọa độ chuẩn hóa theo trang PDF.</span>
        </div>
      </div>
    </div>
  );
};
