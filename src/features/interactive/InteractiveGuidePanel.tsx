import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Edit3,
  Eye,
  FileDown,
  FileText,
  FolderOpen,
  HelpCircle,
  Send,
  ShieldCheck,
  Sparkles,
  Upload,
} from 'lucide-react';

interface GuideTopic {
  id: number;
  group: 'teacher' | 'student';
  title: string;
  purpose: string;
  steps: string[];
  expectedResult: string;
  troubleshooting: string[];
  visual: React.ReactNode;
}

const GUIDE_TOPICS: GuideTopic[] = [
  {
    id: 1,
    group: 'teacher',
    title: '1. Cách tải PDF lên',
    purpose: 'Đưa tài liệu đề kiểm tra, phiếu bài tập hoặc vở bài tập dạng PDF từ máy tính vào ứng dụng.',
    steps: [
      'Mở mục "Tạo bài tập" ở thanh trên cùng.',
      'Ở khung bên trái (Bước 1: Chọn bài tập cần giao), nhấn nút lớn màu xanh "Tải PDF".',
      'Chọn tệp PDF (*.pdf) trên máy tính rồi nhấn "Open" (Mở).',
    ],
    expectedResult:
      'Các trang của tài liệu PDF hiện lên rõ nét ở khung rộng bên phải và hiển thị tổng số trang của tài liệu.',
    troubleshooting: [
      'Nếu không thấy tệp cần tìm: kiểm tra xem tệp có đúng đuôi .pdf hay chưa (ứng dụng chỉ mở tệp PDF chuẩn).',
      'Nếu mở nhầm tệp: nhấn lại nút "Chọn tệp PDF khác" ngay tại Bước 1 để đổi tệp mới.',
    ],
    visual: (
      <div className="rounded-xl border border-slate-200 bg-[#F8FBFA] p-4 space-y-2.5">
        <div className="text-[14px] font-bold text-[#164E63]">Minh họa Bước 1 trên màn hình</div>
        <div className="rounded-xl bg-white border border-slate-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <div className="text-[16px] font-bold text-[#164E63]">1. Chọn bài tập cần giao</div>
            <div className="text-[14px] text-slate-600">
              Thầy cô tải tệp PDF lên, sau đó chọn những trang muốn giao cho học sinh.
            </div>
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#087F70] text-white font-bold text-[15px] shrink-0">
            <Upload className="w-4 h-4" />
            <span>Tải PDF</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 2,
    group: 'teacher',
    title: '2. Cách chọn trang',
    purpose:
      'Chỉ lấy đúng những trang bài tập cần giao cho học sinh (ví dụ trang 2 đến trang 3 của vở bài tập nhiều trang).',
    steps: [
      'Sau khi tải PDF, xem phần "Chọn trang cần giao" ở Bước 1.',
      'Chọn 1 trang (ví dụ nhập: 2), khoảng trang (ví dụ: Từ trang 2 đến trang 3) hoặc nhiều trang (ví dụ: 2, 3, 7-9).',
      'Xem dòng xác nhận bên dưới (ví dụ: "Đang chọn: Từ trang 2 đến trang 3").',
      'Nhấn nút "Tiếp tục sang Bước 2 →" để chỉ giữ lại đúng các trang đã chọn.',
    ],
    expectedResult:
      'Khung bên phải chỉ hiển thị đúng những trang thầy cô đã chọn, gọn gàng và dễ kiểm tra.',
    troubleshooting: [
      'Nếu thấy thông báo "Tài liệu có N trang. Thầy cô vui lòng chọn trang từ 1 đến N": hãy sửa lại số trang nhỏ hơn hoặc bằng tổng số trang.',
      'Nếu chọn nhầm trang: nhấn "Quay lại Bước 1" để chọn lại mà không cần tải lại tệp PDF.',
    ],
    visual: (
      <div className="rounded-xl border border-slate-200 bg-[#F8FBFA] p-4 space-y-2.5">
        <div className="text-[14px] font-bold text-[#164E63]">Minh họa chọn trang dễ hiểu</div>
        <div className="rounded-xl bg-white border border-slate-200 p-4 space-y-2">
          <div className="flex items-center gap-2 flex-wrap text-[15px]">
            <span className="font-semibold text-slate-700">Từ trang</span>
            <span className="px-3 py-1 rounded-lg border border-slate-300 bg-slate-50 font-bold text-[#164E63]">2</span>
            <span className="font-semibold text-slate-700">đến trang</span>
            <span className="px-3 py-1 rounded-lg border border-slate-300 bg-slate-50 font-bold text-[#164E63]">3</span>
          </div>
          <div className="text-[14.5px] font-semibold text-[#087F70]">
            Đang chọn: Từ trang 2 đến trang 3 (2 trang)
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 3,
    group: 'teacher',
    title: '3. Cách tạo bài tập tự động',
    purpose: 'Để ứng dụng tự tìm các câu hỏi và tạo sẵn khung trả lời cho học sinh trên trang PDF.',
    steps: [
      'Tại Bước 2 (Tạo bài tập), nhấn nút lớn "TẠO BÀI TẬP TỰ ĐỘNG".',
      'Chờ vài giây trong khi màn hình hiện dòng "Đang tìm câu hỏi trong tài liệu. Thầy cô vui lòng chờ...".',
      'Xem thông báo số câu hỏi ứng dụng tìm được.',
    ],
    expectedResult:
      'Trên trang PDF xuất hiện các khung trả lời tương ứng với từng câu hỏi (trắc nghiệm, Đúng/Sai, điền chỗ trống, nối cặp, tự luận...).',
    troubleshooting: [
      'Nếu tài liệu là ảnh chụp hoặc bản quét nên ứng dụng chưa tìm hết chỗ trả lời: nhấn nút "+ THÊM CÂU HỎI", chọn dạng câu hỏi rồi nhấn trực tiếp lên vị trí cần trả lời trên trang PDF.',
    ],
    visual: (
      <div className="rounded-xl border border-slate-200 bg-[#F8FBFA] p-4 space-y-2.5">
        <div className="text-[14px] font-bold text-[#164E63]">Minh họa Bước 2</div>
        <div className="rounded-xl bg-white border border-slate-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[15px] text-slate-700">
            Nhấn nút bên cạnh để ứng dụng tự tìm câu hỏi và vị trí trả lời trên các trang đã chọn.
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#164E63] text-white font-bold text-[15px] shrink-0">
            <Sparkles className="w-4 h-4" />
            <span>TẠO BÀI TẬP TỰ ĐỘNG</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 4,
    group: 'teacher',
    title: '4. Cách kiểm tra câu hỏi',
    purpose: 'Đảm bảo các khung trả lời đặt đúng vị trí, không che mất đề bài và đúng dạng câu hỏi.',
    steps: [
      'Chuyển sang Bước 3 (Kiểm tra và giao bài).',
      'Nhấn lần lượt vào từng câu trong danh sách ở khung bên trái — trang PDF sẽ tự cuộn tới đúng câu đó.',
      'Xem khung trả lời trên trang PDF có đúng vị trí chưa.',
      'Nếu mọi thứ đã đúng, nhấn "Lưu" ở cuối khung sửa để đánh dấu "Đã kiểm tra".',
    ],
    expectedResult: 'Các câu đã xem xong chuyển sang nhãn màu xanh "Đã kiểm tra".',
    troubleshooting: [
      'Nếu muốn duyệt nhanh toàn bộ sau khi đã nhìn tổng thể trên PDF: nhấn nút "Đánh dấu đã kiểm tra tất cả".',
    ],
    visual: (
      <div className="rounded-xl border border-slate-200 bg-[#F8FBFA] p-4 space-y-2">
        <div className="text-[14px] font-bold text-[#164E63]">Trạng thái kiểm tra rõ ràng</div>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-100 text-amber-950 text-[14.5px] font-bold">
            <AlertTriangle className="w-4 h-4" />
            <span>Cần kiểm tra</span>
          </span>
          <ArrowRight className="w-4 h-4 text-slate-400" />
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-900 text-[14.5px] font-bold">
            <CheckCircle2 className="w-4 h-4" />
            <span>Đã kiểm tra</span>
          </span>
        </div>
      </div>
    ),
  },
  {
    id: 5,
    group: 'teacher',
    title: '5. Cách sửa câu hỏi nhận diện sai',
    purpose: 'Đổi lại đúng dạng câu hỏi, chỉnh vị trí khung trả lời hoặc xóa câu thừa.',
    steps: [
      'Nhấn trực tiếp vào câu hỏi bị sai trên trang PDF (hoặc chọn câu đó trong danh sách bên trái).',
      'Tại mục "1. Loại câu hỏi", chọn lại đúng dạng trong 14 dạng (ví dụ đổi từ Tự luận sang Trắc nghiệm hoặc Ghép đôi).',
      'Tại mục "4. Vị trí chỗ trả lời trên PDF", nhấn các nút "Dịch lên", "Dịch xuống", "Khung lớn hơn" hoặc kéo khung trực tiếp trên PDF.',
      'Nhấn nút "Lưu" để giữ thay đổi, hoặc nhấn "Xóa câu hỏi này" nếu câu đó thừa.',
    ],
    expectedResult: 'Khung câu hỏi đổi sang đúng dạng mới và nằm ngay ngắn tại vị trí mong muốn.',
    troubleshooting: [
      'Nếu lỡ sửa nhầm: nhấn nút "Hủy" ở góc dưới bên trái để khôi phục lại như trước khi sửa.',
      'Nếu thiếu một câu chưa được tạo: nhấn "+ THÊM CÂU HỎI", chọn dạng câu rồi nhấn vào trang PDF.',
    ],
    visual: (
      <div className="rounded-xl border border-slate-200 bg-[#F8FBFA] p-4 space-y-2">
        <div className="text-[14px] font-bold text-[#164E63]">Khung sửa câu hỏi đơn giản</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[14px] font-semibold text-[#164E63]">
          <div className="rounded-lg bg-white border border-slate-200 px-3 py-2 text-center">1. Loại câu hỏi</div>
          <div className="rounded-lg bg-white border border-slate-200 px-3 py-2 text-center">2. Đáp án đúng</div>
          <div className="rounded-lg bg-white border border-slate-200 px-3 py-2 text-center">3. Điểm</div>
          <div className="rounded-lg bg-white border border-slate-200 px-3 py-2 text-center">4. Dịch vị trí</div>
        </div>
      </div>
    ),
  },
  {
    id: 6,
    group: 'teacher',
    title: '6. Cách nhập đáp án và điểm',
    purpose: 'Cài đặt đáp án chuẩn và số điểm cho từng câu để hệ thống hỗ trợ chấm nhanh sau khi thu bài.',
    steps: [
      'Nhấn vào câu hỏi cần nhập đáp án.',
      'Ở mục "2. Đáp án đúng", chọn đáp án đúng (với trắc nghiệm, Đúng/Sai, ghép đôi, điền chỗ trống). Với câu tự luận hoặc vẽ hình, thầy cô có thể ghi gợi ý chấm.',
      'Ở mục "3. Điểm của câu này", nhập số điểm (hoặc nhấn nhanh 0.5, 1, 2, 3).',
      'Nhấn "Lưu".',
    ],
    expectedResult:
      'Đáp án và điểm được lưu riêng cho giáo viên. Khi xuất PDF gửi học sinh, đáp án giáo viên sẽ KHÔNG bị lộ.',
    troubleshooting: [
      'Nếu chưa kịp nhập đáp án ngay: thầy cô vẫn có thể lưu PDF gửi học sinh trước, sau đó nhập đáp án khi chấm bài.',
    ],
    visual: (
      <div className="rounded-xl border border-slate-200 bg-[#F8FBFA] p-4 flex items-center gap-3 text-[15px] text-[#164E63]">
        <ShieldCheck className="w-6 h-6 text-[#087F70] shrink-0" />
        <span>
          <strong>An toàn đáp án:</strong> Tệp PDF gửi học sinh luôn được tách sạch đáp án giáo viên trước khi tải về máy.
        </span>
      </div>
    ),
  },
  {
    id: 7,
    group: 'teacher',
    title: '7. Cách xem thử như học sinh',
    purpose: 'Kiểm tra thực tế trải nghiệm làm bài của học sinh trước khi lưu và gửi bài.',
    steps: [
      'Tại Bước 3, nhấn nút "Xem thử bài tập".',
      'Thử bấm chọn đáp án, gõ chữ, vẽ đường nối hoặc kéo thả trực tiếp trên trang PDF giống như học sinh.',
      'Khi kiểm tra xong, nhấn nút lớn "QUAY LẠI CHỈNH SỬA" ở thanh trên cùng.',
    ],
    expectedResult:
      'Màn hình trở lại đúng giao diện soạn bài và giữ nguyên toàn bộ câu hỏi, đáp án thầy cô đã làm.',
    troubleshooting: [
      'Các câu trả lời thầy cô bấm thử trong chế độ Xem thử sẽ không lưu vào tệp bài tập gửi cho học sinh.',
    ],
    visual: (
      <div className="rounded-xl border border-slate-200 bg-[#F8FBFA] p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[15px] font-bold text-[#164E63]">
          <Eye className="w-5 h-5 text-[#087F70]" />
          <span>Đang xem thử như học sinh</span>
        </div>
        <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#164E63] text-white font-bold text-[14.5px]">
          <ArrowLeft className="w-4 h-4" />
          <span>QUAY LẠI CHỈNH SỬA</span>
        </div>
      </div>
    ),
  },
  {
    id: 8,
    group: 'teacher',
    title: '8. Cách lưu PDF bài tập',
    purpose: 'Lưu thành một tệp PDF (*.pdf) hoàn chỉnh trên máy tính để gửi cho học sinh.',
    steps: [
      'Tại Bước 3, kiểm tra lại tên bài tập ở ô trên cùng.',
      'Nhấn nút lớn màu xanh "Lưu PDF".',
      'Trình duyệt sẽ tải tệp PDF có tên dạng "TenBaiTap_BaiTap.pdf" vào thư mục Tải xuống (Downloads) của máy tính.',
    ],
    expectedResult:
      'Màn hình hiện thông báo lưu thành công và tệp PDF xuất hiện trong thư mục Tải xuống.',
    troubleshooting: [
      'Nếu ứng dụng báo "Chưa có câu hỏi để giao": nhấn nút "Tạo bài tập tự động" hoặc "+ THÊM CÂU HỎI" trước rồi nhấn Lưu PDF lại.',
    ],
    visual: (
      <div className="rounded-xl border border-slate-200 bg-[#F8FBFA] p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[15px] text-slate-700">
          <FileText className="w-5 h-5 text-[#087F70] shrink-0" />
          <span>Tệp tạo ra luôn là tệp <strong>PDF (*.pdf)</strong> chuẩn, không có đuôi lạ.</span>
        </div>
        <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#087F70] text-white font-bold text-[14.5px] shrink-0">
          <FileDown className="w-4 h-4" />
          <span>Lưu PDF</span>
        </div>
      </div>
    ),
  },
  {
    id: 9,
    group: 'teacher',
    title: '9. Cách gửi bài cho học sinh qua Zalo',
    purpose: 'Gửi đúng tệp PDF bài tập cho lớp qua nhóm Zalo mà không bị lỗi tệp.',
    steps: [
      'Mở nhóm lớp trên Zalo (trên máy tính hoặc điện thoại).',
      'Nhấn biểu tượng kẹp giấy "Gửi tệp" (File) trong khung chat Zalo.',
      'Chọn tệp PDF vừa lưu (thường nằm trong thư mục Tải xuống / Downloads, tên kết thúc bằng "_BaiTap.pdf").',
      'Nhấn Gửi và nhắn học sinh tải tệp PDF về rồi mở trong PDF EDU STUDIO.',
    ],
    expectedResult:
      'Tệp PDF xuất hiện trong nhóm Zalo dưới dạng tệp đính kèm PDF nguyên vẹn để học sinh tải về.',
    troubleshooting: [
      'Lưu ý quan trọng: luôn gửi bằng chức năng "Gửi tệp" (không chụp ảnh màn hình) để học sinh mở làm bài tương tác được.',
      'Ngoài ra thầy cô có thể nhấn "Giao bài" ở Bước 3 để ghi nhận lịch giao và hạn nộp cho lớp.',
    ],
    visual: (
      <div className="rounded-xl border border-slate-200 bg-[#F8FBFA] p-4 flex items-center gap-3 text-[15px] text-[#164E63]">
        <Send className="w-5 h-5 text-[#087F70] shrink-0" />
        <span>
          Zalo → Chọn nhóm lớp → Nhấn <strong>Gửi tệp (kẹp giấy)</strong> → Chọn tệp <strong>..._BaiTap.pdf</strong> → Gửi.
        </span>
      </div>
    ),
  },
  {
    id: 10,
    group: 'student',
    title: '10. Cách học sinh mở và làm bài',
    purpose: 'Giúp học sinh mở tệp PDF giáo viên gửi và làm bài trực tiếp (kể cả khi không có Internet).',
    steps: [
      'Học sinh tải tệp PDF giáo viên gửi trên Zalo về máy.',
      'Mở PDF EDU STUDIO, vào mục "Làm bài" ở thanh trên cùng.',
      'Nhấn "Chọn tệp PDF (*.pdf) từ máy" và chọn tệp bài tập vừa tải về.',
      'Điền Họ và tên, Lớp ở thanh trên rồi làm trực tiếp từng câu hỏi trên trang PDF.',
    ],
    expectedResult:
      'Các câu hỏi hiển thị đầy đủ để học sinh tích chọn, gõ câu trả lời, nối cặp hoặc vẽ hình trực tiếp.',
    troubleshooting: [
      'Nếu đang làm dở phải tắt máy: bài làm được tự động lưu ở mục "Bài đã lưu" để mở làm tiếp lần sau.',
    ],
    visual: (
      <div className="rounded-xl border border-slate-200 bg-[#F8FBFA] p-4 flex items-center gap-3 text-[15px] text-[#164E63]">
        <FolderOpen className="w-5 h-5 text-[#087F70] shrink-0" />
        <span>
          Vào mục <strong>Làm bài</strong> → Nhấn <strong>Chọn tệp PDF (*.pdf) từ máy</strong> → Điền tên và làm bài.
        </span>
      </div>
    ),
  },
  {
    id: 11,
    group: 'student',
    title: '11. Cách học sinh lưu và gửi lại PDF',
    purpose: 'Lưu bài làm thành tệp PDF chuẩn để gửi lại cho giáo viên chấm điểm.',
    steps: [
      'Sau khi làm xong bài, học sinh kiểm tra lại Họ và tên, Lớp ở thanh phía trên.',
      'Nhấn nút màu xanh "Lưu thành PDF (.pdf)".',
      'Ứng dụng tải về máy tệp PDF có tên dạng "BaiLam_Lop_HoTen.pdf".',
      'Học sinh gửi tệp PDF này lại cho giáo viên qua Zalo (chọn Gửi tệp) hoặc Email.',
    ],
    expectedResult:
      'Tệp PDF bài làm mở bằng bất kỳ trình xem PDF nào cũng thấy đầy đủ câu trả lời, dấu chọn, đường nối và hình vẽ.',
    troubleshooting: [
      'Nếu học sinh muốn sửa lại bài trước khi gửi: chỉ cần mở lại chính tệp PDF vừa lưu trong mục "Làm bài" để sửa tiếp.',
    ],
    visual: (
      <div className="rounded-xl border border-slate-200 bg-[#F8FBFA] p-4 flex items-center gap-3 text-[15px] text-[#164E63]">
        <Edit3 className="w-5 h-5 text-[#087F70] shrink-0" />
        <span>
          Làm xong → Nhấn <strong>Lưu thành PDF (.pdf)</strong> → Gửi tệp PDF đó cho giáo viên qua Zalo.
        </span>
      </div>
    ),
  },
  {
    id: 12,
    group: 'teacher',
    title: '12. Cách giáo viên mở bài, chấm và trả bài',
    purpose: 'Thu nhiều bài PDF của học sinh cùng lúc, chấm điểm, ghi nhận xét và xuất PDF trả bài cùng bảng điểm Excel.',
    steps: [
      'Tải các tệp PDF bài làm học sinh gửi trên Zalo vào một thư mục trên máy tính.',
      'Mở mục "Thu bài & Chấm bài" ở thanh trên cùng.',
      'Chọn đúng đề bài ở mục "1. Chọn đề gốc & đáp án giáo viên".',
      'Nhấn nút "Nhập nhiều bài nộp PDF (.pdf)" và chọn tất cả các tệp bài làm của học sinh.',
      'Xem điểm câu tự chấm, nhập điểm + nhận xét cho các câu tự luận/vẽ hình, rồi nhấn "Xuất PDF trả bài" hoặc "Xuất bảng điểm Excel (.xlsx)".',
    ],
    expectedResult:
      'Giáo viên có ngay tệp PDF trả bài (có điểm và nhận xét rõ ràng) để gửi lại học sinh, kèm bảng điểm Excel cho cả lớp.',
    troubleshooting: [
      'Nếu tệp PDF của học sinh bị ứng dụng ngoài nén lại làm mất dữ liệu chấm tự động: ứng dụng sẽ báo rõ và vẫn mở nguyên trang bài làm để thầy cô chấm thủ công bình thường.',
    ],
    visual: (
      <div className="rounded-xl border border-slate-200 bg-[#F8FBFA] p-4 flex items-center gap-3 text-[15px] text-[#164E63]">
        <ClipboardCheck className="w-5 h-5 text-[#087F70] shrink-0" />
        <span>
          <strong>Thu bài & Chấm bài</strong> → Nhập nhiều tệp PDF → Chấm & nhận xét → Xuất <strong>PDF trả bài</strong> & <strong>Excel</strong>.
        </span>
      </div>
    ),
  },
];

export const InteractiveGuidePanel: React.FC = () => {
  const [selectedId, setSelectedId] = useState<number>(1);
  const [filterGroup, setFilterGroup] = useState<'all' | 'teacher' | 'student'>('all');

  const filteredTopics = GUIDE_TOPICS.filter((t) =>
    filterGroup === 'all' ? true : t.group === filterGroup
  );
  const activeTopic =
    GUIDE_TOPICS.find((t) => t.id === selectedId) || filteredTopics[0] || GUIDE_TOPICS[0];

  const activeIdx = GUIDE_TOPICS.findIndex((t) => t.id === activeTopic.id);
  const prevTopic = activeIdx > 0 ? GUIDE_TOPICS[activeIdx - 1] : null;
  const nextTopic = activeIdx < GUIDE_TOPICS.length - 1 ? GUIDE_TOPICS[activeIdx + 1] : null;

  return (
    <div className="flex-1 overflow-y-auto bg-[#F4F8F7] p-5 md:p-6 text-[16px] text-slate-900">
      <div className="max-w-6xl mx-auto space-y-5">
        {/* Header Card */}
        <div className="rounded-2xl bg-white border border-slate-200 p-5 md:p-6 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <h2 className="text-[24px] font-bold text-[#164E63] flex items-center gap-2.5">
              <BookOpen className="w-7 h-7 text-[#087F70] shrink-0" />
              <span>Hướng dẫn sử dụng từng bước (12 mục dễ hiểu)</span>
            </h2>
            <p className="text-[16.5px] text-slate-700 leading-relaxed">
              Thầy cô chọn mục cần xem ở danh sách bên trái. Mỗi mục đều ghi rõ từng bước bấm nút, kết quả cần thấy và cách xử lý khi gặp lỗi.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <button
              type="button"
              onClick={() => setFilterGroup('all')}
              className={`px-4 min-h-[44px] rounded-xl text-[15.5px] font-bold cursor-pointer transition-colors ${
                filterGroup === 'all'
                  ? 'bg-[#164E63] text-white'
                  : 'bg-slate-100 text-slate-800 hover:bg-[#E6F1EF]'
              }`}
            >
              Tất cả (12)
            </button>
            <button
              type="button"
              onClick={() => {
                setFilterGroup('teacher');
                if (activeTopic.group !== 'teacher') setSelectedId(1);
              }}
              className={`px-4 min-h-[44px] rounded-xl text-[15.5px] font-bold cursor-pointer transition-colors ${
                filterGroup === 'teacher'
                  ? 'bg-[#164E63] text-white'
                  : 'bg-slate-100 text-slate-800 hover:bg-[#E6F1EF]'
              }`}
            >
              Dành cho Giáo viên (10)
            </button>
            <button
              type="button"
              onClick={() => {
                setFilterGroup('student');
                if (activeTopic.group !== 'student') setSelectedId(10);
              }}
              className={`px-4 min-h-[44px] rounded-xl text-[15.5px] font-bold cursor-pointer transition-colors ${
                filterGroup === 'student'
                  ? 'bg-[#087F70] text-white'
                  : 'bg-slate-100 text-slate-800 hover:bg-[#E6F1EF]'
              }`}
            >
              Dành cho Học sinh (2)
            </button>
          </div>
        </div>

        {/* 2-Column Reading Layout: TOC List + Clear Step-by-Step Detail */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left: 12-item Navigation */}
          <nav
            aria-label="Mục lục hướng dẫn sử dụng"
            className="lg:col-span-4 rounded-2xl bg-white border border-slate-200 p-3 shadow-2xs space-y-1.5"
          >
            {filteredTopics.map((topic) => {
              const active = topic.id === activeTopic.id;
              return (
                <button
                  key={topic.id}
                  type="button"
                  onClick={() => setSelectedId(topic.id)}
                  className={`w-full text-left px-3.5 py-3 min-h-[48px] rounded-xl font-semibold text-[16px] transition-colors cursor-pointer flex items-center justify-between gap-2 ${
                    active
                      ? 'bg-[#087F70] text-white shadow-2xs'
                      : 'bg-white text-slate-800 hover:bg-[#E6F1EF] hover:text-[#164E63]'
                  }`}
                >
                  <span className="leading-snug">{topic.title}</span>
                  <span
                    className={`text-[13px] px-2 py-0.5 rounded-md font-bold shrink-0 ${
                      active
                        ? 'bg-white/20 text-white'
                        : topic.group === 'student'
                          ? 'bg-teal-50 text-[#087F70]'
                          : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {topic.group === 'student' ? 'HS' : 'GV'}
                  </span>
                </button>
              );
            })}
          </nav>

          {/* Right: Active Guide Content */}
          <article className="lg:col-span-8 rounded-2xl bg-white border border-slate-200 p-6 md:p-7 shadow-2xs space-y-6">
            <div className="pb-4 border-b border-slate-200 space-y-2">
              <span
                className={`inline-block px-3 py-1 rounded-lg text-[14px] font-bold ${
                  activeTopic.group === 'student'
                    ? 'bg-teal-50 text-[#087F70]'
                    : 'bg-[#E6F1EF] text-[#164E63]'
                }`}
              >
                {activeTopic.group === 'student' ? 'Hướng dẫn cho Học sinh' : 'Hướng dẫn cho Giáo viên'}
              </span>
              <h3 className="text-[24px] font-bold text-[#164E63] leading-snug">
                {activeTopic.title}
              </h3>
            </div>

            {/* Mục đích */}
            <section className="space-y-1.5">
              <h4 className="text-[18px] font-bold text-[#164E63]">Mục đích</h4>
              <p className="text-[16.5px] text-slate-800 leading-relaxed">{activeTopic.purpose}</p>
            </section>

            {/* Minh họa giao diện */}
            {activeTopic.visual}

            {/* Các bước thực hiện */}
            <section className="space-y-2.5">
              <h4 className="text-[18px] font-bold text-[#164E63]">Các bước thực hiện</h4>
              <ol className="space-y-3">
                {activeTopic.steps.map((step, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 rounded-xl bg-[#F8FBFA] border border-slate-200 p-3.5"
                  >
                    <span className="w-8 h-8 rounded-full bg-[#164E63] text-white font-bold text-[15.5px] flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-[16.5px] text-slate-900 leading-relaxed pt-0.5">
                      {step}
                    </span>
                  </li>
                ))}
              </ol>
            </section>

            {/* Kết quả cần thấy */}
            <section className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 space-y-1.5">
              <h4 className="text-[17.5px] font-bold text-emerald-950 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
                <span>Kết quả cần thấy</span>
              </h4>
              <p className="text-[16px] text-emerald-950 leading-relaxed">
                {activeTopic.expectedResult}
              </p>
            </section>

            {/* Cách xử lý khi gặp lỗi */}
            <section className="rounded-xl bg-amber-50 border border-amber-200 p-4 space-y-2">
              <h4 className="text-[17.5px] font-bold text-amber-950 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-amber-700 shrink-0" />
                <span>Cách xử lý khi gặp lỗi</span>
              </h4>
              <ul className="space-y-1.5 list-disc pl-5 text-[16px] text-amber-950 leading-relaxed">
                {activeTopic.troubleshooting.map((tip, i) => (
                  <li key={i}>{tip}</li>
                ))}
              </ul>
            </section>

            {/* Previous / Next Navigation */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3 flex-wrap">
              {prevTopic ? (
                <button
                  type="button"
                  onClick={() => setSelectedId(prevTopic.id)}
                  className="inline-flex items-center gap-2 px-4 min-h-[46px] rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-[#164E63] font-bold text-[16px] cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Mục trước: {prevTopic.title}</span>
                </button>
              ) : (
                <div />
              )}
              {nextTopic && (
                <button
                  type="button"
                  onClick={() => setSelectedId(nextTopic.id)}
                  className="inline-flex items-center gap-2 px-4 min-h-[46px] rounded-xl bg-[#087F70] hover:bg-[#06695d] text-white font-bold text-[16px] cursor-pointer"
                >
                  <span>Mục tiếp theo: {nextTopic.title}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </article>
        </div>
      </div>
    </div>
  );
};
