import React, { useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  FileDown,
  FolderOpen,
  GraduationCap,
  HardDrive,
  Link2,
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
                <span>Hướng dẫn sử dụng Bài tập PDF tương tác</span>
              </h2>
              <p className="text-[15.5px] text-slate-600 mt-1">
                Tra cứu nhanh quy trình tạo bài, làm bài online/offline, lưu bài về máy, nộp tệp .pdfedu và chấm bài trả kết quả.
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
                <span>Dành cho Giáo viên</span>
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
                <span>Dành cho Học sinh</span>
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
                <span>Tạo bài tập từ PDF có sẵn hoặc mẫu 8 môn học THPT</span>
              </h3>
              <p className="text-[15.5px] text-slate-700 leading-relaxed">
                Tại mục <strong>Tạo bài tập</strong>, thầy/cô tải tệp <strong>.pdf</strong> từ máy tính, chọn nhanh tài liệu đang mở trong PDF EDU STUDIO, hoặc mở 1 trong 8 phiếu mẫu chuẩn THPT (Toán, Vật lí, Hóa học, Sinh học, Tin học, Địa lí, Lịch sử, Tiếng Anh). Chọn loại câu hỏi ở cột trái rồi nhấp vào vị trí cần đặt trên trang PDF; kéo thanh tiêu đề để di chuyển hoặc góc dưới phải để đổi kích thước.
              </p>
            </div>

            <div className="rounded-xl bg-white border border-slate-200 p-5 space-y-2.5">
              <h3 className="text-[17px] font-bold text-[#164E63] flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-[#164E63] text-white text-[14px] flex items-center justify-center shrink-0">
                  2
                </span>
                <span>Tạo bài ghép đôi bằng vẽ đường nối hoặc kéo thả</span>
              </h3>
              <p className="text-[15.5px] text-slate-700 leading-relaxed">
                Chọn dạng <strong>Ghép đôi</strong>, tại bảng thuộc tính bên phải có thể chuyển qua lại giữa <strong>Vẽ đường nối</strong> (mặc định, học sinh kéo nối trực tiếp giữa cột A – cột B bằng nét vector SVG) và <strong>Kéo thả ghép đôi</strong>. Thiết lập đáp án đúng theo từng cặp mục ổn định. Nếu ở chế độ kiểm tra (<strong>Kiểm tra</strong>), tính năng báo đúng/sai tức thì luôn tắt.
              </p>
            </div>

            <div className="rounded-xl bg-white border border-slate-200 p-5 space-y-2.5">
              <h3 className="text-[17px] font-bold text-[#164E63] flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-[#164E63] text-white text-[14px] flex items-center justify-center shrink-0">
                  3
                </span>
                <span>Xuất gói bài tập .pdfedu giao cho học sinh (an toàn, không lộ đáp án)</span>
              </h3>
              <p className="text-[15.5px] text-slate-700 leading-relaxed">
                Nhấn <strong>Lưu bản gốc GV</strong> để lưu đề kèm đáp án vào bộ nhớ cục bộ của giáo viên, sau đó nhấn <strong>Xuất bài tập HS (.pdfedu)</strong> để gửi qua Zalo, Email, LMS hoặc USB. Hệ thống tự động loại bỏ hoàn toàn đáp án giáo viên khỏi tệp giao học sinh và đính kèm mã kiểm tra toàn vẹn SHA-256.
              </p>
            </div>

            <div className="rounded-xl bg-white border border-slate-200 p-5 space-y-2.5">
              <h3 className="text-[17px] font-bold text-[#164E63] flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-[#164E63] text-white text-[14px] flex items-center justify-center shrink-0">
                  4
                </span>
                <span>Nhận bài, chấm tự động khách quan + chấm tay tự luận, xuất PDF & Excel</span>
              </h3>
              <p className="text-[15.5px] text-slate-700 leading-relaxed">
                Chuyển sang mục <strong>Nhận và chấm bài</strong>, chọn đúng đề gốc của giáo viên rồi nhập cùng lúc nhiều tệp bài nộp <strong>.pdfedu</strong> của học sinh. Các câu trắc nghiệm, Đúng/Sai, trả lời ngắn, điền khuyết, ghép đôi và sắp xếp được chấm tự động theo đáp án gốc của giáo viên (không tin điểm tự khai từ tệp học sinh). Các câu tự luận, vẽ hình, công thức khoa học, chú thích sơ đồ và tệp đính kèm được giáo viên xem trực tiếp trên trang PDF để cho điểm và ghi nhận xét. Sau cùng nhấn <strong>Xuất PDF trả bài</strong> và <strong>Xuất bảng điểm Excel (.xlsx)</strong>.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl bg-white border border-slate-200 p-5 space-y-2.5">
              <h3 className="text-[17px] font-bold text-[#087F70] flex items-center gap-2">
                <FolderOpen className="w-5 h-5 shrink-0" />
                <span>Bước 1: Mở bài tập PDF tương tác (Online hoặc Offline)</span>
              </h3>
              <p className="text-[15.5px] text-slate-700 leading-relaxed">
                Tại mục <strong>Làm bài</strong>, em nhấn <strong>Mở tệp bài tập (.pdfedu)</strong> từ máy tính, hoặc dán đường dẫn bài tập trực tuyến (HTTPS) do giáo viên cung cấp. Nếu muốn thử ngay, em có thể chọn 1 trong 8 phiếu mẫu THPT có sẵn. Sau khi mở, bài tập chạy hoàn toàn trên máy kể cả khi mất mạng.
              </p>
            </div>

            <div className="rounded-xl bg-white border border-slate-200 p-5 space-y-2.5">
              <h3 className="text-[17px] font-bold text-[#087F70] flex items-center gap-2">
                <Link2 className="w-5 h-5 shrink-0" />
                <span>Bước 2: Làm bài trực tiếp — kể cả bài ghép đôi vẽ đường nối & kéo thả</span>
              </h3>
              <p className="text-[15.5px] text-slate-700 leading-relaxed">
                Nhập <strong>Họ và tên</strong>, <strong>Lớp</strong> ở thanh phía trên. Với câu <strong>Vẽ đường nối</strong>, kéo từ chấm tròn ở cột A sang cột B (hoặc chạm mục A rồi chạm mục B); nhấp vào đường nối để gỡ nếu muốn nối lại. Với câu <strong>Kéo thả</strong>, kéo thẻ từ kho bên phải vào ô đích (hoặc chạm thẻ rồi chạm ô đích).
              </p>
            </div>

            <div className="rounded-xl bg-white border border-slate-200 p-5 space-y-2.5">
              <h3 className="text-[17px] font-bold text-[#087F70] flex items-center gap-2">
                <HardDrive className="w-5 h-5 shrink-0" />
                <span>Bước 3: Lưu bài làm dở và mở lại bất cứ lúc nào</span>
              </h3>
              <p className="text-[15.5px] text-slate-700 leading-relaxed">
                Bài làm được tự động lưu định kỳ vào bộ nhớ trình duyệt (IndexedDB) và em có thể nhấn <strong>Lưu bài</strong> bất cứ lúc nào. Khi đóng trình duyệt và mở lại sau, vào mục <strong>Bài đã lưu</strong> để mở lại bài đang làm dở — mọi lựa chọn, đường nối, thẻ kéo thả, nét vẽ và công thức đều được khôi phục nguyên vẹn.
              </p>
            </div>

            <div className="rounded-xl bg-white border border-slate-200 p-5 space-y-2.5">
              <h3 className="text-[17px] font-bold text-[#087F70] flex items-center gap-2">
                <FileDown className="w-5 h-5 shrink-0" />
                <span>Bước 4: Xuất tệp bài làm để nộp cho giáo viên</span>
              </h3>
              <p className="text-[15.5px] text-slate-700 leading-relaxed">
                Khi làm xong, nhấn <strong>Xuất bài nộp (.pdfedu)</strong> để lưu tệp bài làm chuẩn gửi lại giáo viên chấm điểm. Em cũng có thể nhấn <strong>Xuất PDF bài làm</strong> để lưu bản PDF có hiển thị đầy đủ câu trả lời, đường nối và thẻ đã ghép để lưu trữ hoặc in ra giấy.
              </p>
            </div>
          </div>
        )}

        {/* Honest Security & Offline Capability Note */}
        <div className="rounded-xl bg-[#E6F1EF] border border-teal-200 p-5 flex items-start gap-3">
          <ShieldCheck className="w-6 h-6 text-[#087F70] shrink-0 mt-0.5" />
          <div className="space-y-1 text-[15px] text-[#164E63]">
            <div className="font-bold">Lưu ý kỹ thuật về dữ liệu cục bộ & nộp bài</div>
            <p className="leading-relaxed">
              Mọi thao tác tạo bài, làm bài, lưu nháp và chấm bài đều thực hiện 100% cục bộ trên trình duyệt, không thu thập dữ liệu học sinh lên máy chủ trung gian. Vì hệ thống không sử dụng máy chủ lưu trữ đám mây, học sinh hãy xuất tệp <strong>.pdfedu</strong> để nộp cho giáo viên qua kênh lớp học (LMS, Email, Zalo, USB) và lưu bản dự phòng khi làm bài dài.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[14.5px] text-slate-500 pb-6">
          <CheckCircle2 className="w-4 h-4 text-[#087F70] shrink-0" />
          <span>Hỗ trợ đầy đủ 12 dạng câu hỏi tương tác · Tọa độ khóa theo trang PDF, không lệch khi phóng to/thu nhỏ.</span>
        </div>
      </div>
    </div>
  );
};
