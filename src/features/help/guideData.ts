export type GuideGroupId =
  | 'open-save-print'
  | 'edit-content'
  | 'formulas'
  | 'diagrams-graphs'
  | 'grading'
  | 'annotate-sign'
  | 'page-tools'
  | 'security-offline';

export type GuideIllustrationKey =
  | 'open-save-pdf'
  | 'print-present'
  | 'edit-text-before-after'
  | 'add-text-image'
  | 'find-replace'
  | 'formula-mathlive'
  | 'formula-science'
  | 'diagram-library'
  | 'dynamic-geometry-2d'
  | 'function-graph'
  | 'solid-3d'
  | 'grading-essay'
  | 'grading-total-comment'
  | 'grading-mcq'
  | 'grading-export-excel'
  | 'annotate-pen-note'
  | 'signature-insert'
  | 'page-organize'
  | 'page-merge-split'
  | 'page-crop'
  | 'watermark-pagenum'
  | 'images-to-pdf'
  | 'page-compress'
  | 'ocr-scan'
  | 'redaction-before-after'
  | 'pwa-offline'
  | 'backup-restore';

export interface GuideFeature {
  id: string;
  groupId: GuideGroupId;
  title: string;
  purpose: string;
  toolLocation: string;
  steps: string[];
  illustrationKey: GuideIllustrationKey;
  illustrationCaption: string;
  note?: string;
  keywords: string[];
}

export interface GuideGroup {
  id: GuideGroupId;
  title: string;
  summary: string;
  features: GuideFeature[];
}

export const GUIDE_GROUPS: GuideGroup[] = [
  // 1. MỞ, LƯU VÀ IN PDF
  {
    id: 'open-save-print',
    title: 'Mở, lưu và in PDF',
    summary: 'Mở tệp, mở nhiều tài liệu, lưu PDF, lưu dự án, xuất ảnh và in ấn.',
    features: [
      {
        id: 'mo-va-tao-pdf',
        groupId: 'open-save-print',
        title: 'Mở tệp PDF, mở nhiều tài liệu và tạo PDF trống',
        purpose: 'Mở nhanh một hoặc nhiều tài liệu PDF để làm việc song song theo thẻ, hoặc tạo trang giấy A4 trống.',
        toolLocation: 'Trang chủ (ô Kéo thả tệp PDF, nút Mở tệp PDF, Mở nhiều tệp, Tạo PDF mới) hoặc thẻ Tệp → Mở tệp PDF.',
        steps: [
          'Chọn thẻ Tệp → Mở tệp PDF (hoặc nhấn Ctrl + O). Thầy cô cũng có thể kéo thả trực tiếp tệp PDF vào màn hình Trang chủ.',
          'Chọn một hoặc nhiều tệp PDF (*.pdf) từ máy tính rồi nhấn Open.',
          'Mỗi tài liệu sẽ mở thành một thẻ riêng trên thanh tài liệu phía trên để chuyển qua lại nhanh.',
          'Nếu muốn soạn mới hoàn toàn, chọn Tệp → Tạo PDF trống để tạo sẵn trang khổ A4.',
        ],
        illustrationKey: 'open-save-pdf',
        illustrationCaption: 'Mở tệp PDF, chuyển thẻ tài liệu và lưu kết quả an toàn',
        note: 'Tệp gốc trên máy tính luôn được giữ nguyên. Mọi thao tác xử lý diễn ra cục bộ trên thiết bị.',
        keywords: ['mo pdf', 'mo tep', 'mo nhieu tep', 'tao pdf trong', 'keo tha', 'the tai lieu'],
      },
      {
        id: 'luu-pdf-va-du-an',
        groupId: 'open-save-print',
        title: 'Lưu thành PDF mới và lưu PDF chỉnh sửa tiếp',
        purpose: 'Xuất tệp PDF hoàn chỉnh để in hoặc gửi học sinh, hoặc lưu tệp PDF chuẩn kèm dữ liệu chỉnh sửa tiếp nhúng bên trong để hôm sau mở lại sửa công thức và điểm số.',
        toolLocation: 'Nút Lưu PDF ở góc phải thanh công cụ, hoặc thẻ Tệp → Lưu PDF mới / Lưu PDF sửa tiếp.',
        steps: [
          'Sau khi chỉnh sửa xong, nhấn nút Lưu PDF (hoặc Ctrl + S) để tải xuống tệp PDF mới.',
          'Nếu muốn giữ lại toàn bộ công thức MathLive, hình vẽ và bảng điểm để lần sau chỉnh tiếp, chọn Tệp → Lưu PDF sửa tiếp (hoặc Ctrl + Shift + S).',
          'Kiểm tra tệp .pdf vừa tải về trong thư mục Tải xuống (Downloads) của máy tính.',
        ],
        illustrationKey: 'open-save-pdf',
        illustrationCaption: 'Lưu PDF chuẩn để in ấn, gửi học sinh hoặc mở lại chỉnh sửa tiếp trong PDF EDU STUDIO',
        note: 'Cả hai tùy chọn đều xuất ra tệp .pdf chuẩn đọc được trên mọi trình xem PDF thông thường.',
        keywords: ['luu pdf', 'luu pdf sua tiep', 'ctrl s', 'tai xuong'],
      },
      {
        id: 'xuat-anh-in-trinh-chieu',
        groupId: 'open-save-print',
        title: 'Xuất ảnh từng trang, in tài liệu và trình chiếu',
        purpose: 'Xuất từng trang PDF thành ảnh PNG/JPG sắc nét để gửi nhóm lớp, in trực tiếp ra giấy hoặc phóng toàn màn hình khi giảng bài.',
        toolLocation: 'Thẻ Tệp → Xuất PDF / Ảnh, In tài liệu (Ctrl + P); thẻ Hiển thị → Trình chiếu.',
        steps: [
          'Để xuất ảnh từng trang: chọn Tệp → Xuất PDF / Ảnh → chọn xuất định dạng ảnh PNG/JPG và độ phân giải → nhấn Xuất.',
          'Để in tài liệu: chọn Tệp → In tài liệu (hoặc Ctrl + P), chọn tùy chọn kèm chú thích/chấm bài rồi nhấn In.',
          'Để trình chiếu trên máy chiếu hoặc tivi lớp học: chọn thẻ Hiển thị → Trình chiếu.',
          'Nhấn phím Esc để thoát chế độ trình chiếu và quay lại giao diện chỉnh sửa.',
        ],
        illustrationKey: 'print-present',
        illustrationCaption: 'Xuất PDF/Ảnh, In tài liệu và chế độ Trình chiếu toàn màn hình',
        note: 'Trong cửa sổ in của trình duyệt, chọn khổ giấy A4 và tỷ lệ 100% để bản in đúng kích thước đề thi.',
        keywords: ['in', 'in tai lieu', 'xuat anh', 'png', 'jpg', 'trinh chieu', 'toan man hinh'],
      },
    ],
  },

  // 2. CHỈNH SỬA NỘI DUNG
  {
    id: 'edit-content',
    title: 'Chỉnh sửa nội dung',
    summary: 'Sửa chữ trực tiếp, thêm chữ, tìm kiếm, thay thế, chỉnh phông chữ và cỡ chữ.',
    features: [
      {
        id: 'sua-chu-truc-tiep',
        groupId: 'edit-content',
        title: 'Sửa chữ gốc trong PDF',
        purpose: 'Thay đổi trực tiếp nội dung văn bản có thể chỉnh sửa trong tài liệu PDF như tên lớp, thời gian làm bài hoặc câu hỏi.',
        toolLocation: 'Thẻ Chỉnh sửa → Sửa chữ gốc (E). Chỉnh kiểu chữ và cỡ chữ tại cột Thuộc tính bên phải.',
        steps: [
          'Mở tài liệu PDF cần chỉnh sửa.',
          'Chọn thẻ Chỉnh sửa → Sửa chữ gốc (hoặc nhấn phím E).',
          'Nhấp vào dòng chữ có khung nét đứt màu xanh trên trang PDF để tạo hộp chỉnh sửa đè khớp vị trí cũ.',
          'Nhấp đúp vào hộp chữ vừa tạo, nhập nội dung mới (ví dụ đổi Lớp 10A1 thành Lớp 10A2).',
          'Điều chỉnh phông chữ, cỡ chữ, in đậm hoặc màu chữ ở cột Thuộc tính bên phải rồi nhấn Lưu PDF.',
        ],
        illustrationKey: 'edit-text-before-after',
        illustrationCaption: 'Trước và sau khi sửa trực tiếp dòng chữ "Lớp 10A1" thành "Lớp 10A2" trên đề thi PDF',
        note: 'PDF dạng ảnh scan không có lớp văn bản gốc sẽ hiện thanh gợi ý Chạy OCR nhận dạng ở đầu trang.',
        keywords: ['sua chu', 'sua van ban', 'sua de', 'sua lop', 'chinh sua truc tiep'],
      },
      {
        id: 'them-chu-chinh-font',
        groupId: 'edit-content',
        title: 'Thêm văn bản mới, chỉnh phông chữ, cỡ chữ và căn chỉnh',
        purpose: 'Chèn thêm tiêu đề, hướng dẫn làm bài hoặc nội dung mới vào bất kỳ vị trí nào trên trang với đầy đủ dấu tiếng Việt.',
        toolLocation: 'Thẻ Chỉnh sửa → Thêm văn bản (T) và cột Thuộc tính bên phải.',
        steps: [
          'Chọn thẻ Chỉnh sửa → Thêm văn bản (hoặc nhấn phím T).',
          'Nhấp vào vị trí muốn đặt chữ trên trang PDF.',
          'Nhấp đúp vào khung chữ để gõ nội dung tiếng Việt.',
          'Ở cột Thuộc tính bên phải, chọn phông chữ (DejaVu Sans / DejaVu Serif), cỡ chữ, đậm/nghiêng/gạch chân, màu chữ và căn lề.',
          'Dùng công cụ Chọn (Q) để kéo di chuyển hoặc giữ Shift chọn nhiều khung để căn thẳng hàng.',
        ],
        illustrationKey: 'add-text-image',
        illustrationCaption: 'Thêm hộp văn bản tiếng Việt và tùy chỉnh phông chữ, cỡ chữ ở cột Thuộc tính',
        note: 'Nhấn Ctrl + Z nếu muốn hoàn tác ngay thao tác vừa làm.',
        keywords: ['them chu', 'them van ban', 'phong chu', 'font', 'co chu', 'can chinh'],
      },
      {
        id: 'tim-kiem-thay-the',
        groupId: 'edit-content',
        title: 'Tìm kiếm và thay thế văn bản',
        purpose: 'Tìm nhanh vị trí từ khóa trong tài liệu nhiều trang và thay thế đồng loạt nội dung cần đổi.',
        toolLocation: 'Thẻ Chỉnh sửa → Tìm & Thay thế (hoặc phím tắt Ctrl + F / Ctrl + H).',
        steps: [
          'Chọn thẻ Chỉnh sửa → Tìm & Thay thế (hoặc nhấn Ctrl + F).',
          'Nhập từ khóa cần tìm vào ô Tìm kiếm để xem danh sách các trang xuất hiện.',
          'Nhấp vào một kết quả để chuyển thẳng đến đúng trang đó.',
          'Nhập nội dung mới vào ô Thay thế bằng rồi chọn thay thế từng vị trí hoặc thay thế tất cả.',
        ],
        illustrationKey: 'find-replace',
        illustrationCaption: 'Tìm kiếm nhanh theo trang và thay thế văn bản trong PDF',
        note: 'Với PDF dạng ảnh scan, cần chạy OCR nhận dạng văn bản trước khi tìm kiếm.',
        keywords: ['tim kiem', 'thay the', 'ctrl f', 'ctrl h', 'tim chu'],
      },
    ],
  },

  // 3. CÔNG THỨC KHOA HỌC
  {
    id: 'formulas',
    title: 'Công thức khoa học',
    summary: 'Chèn và chỉnh sửa công thức bằng MathLive, phân số, căn thức, số mũ, vectơ và ký hiệu khoa học.',
    features: [
      {
        id: 'chen-sua-cong-thuc',
        groupId: 'formulas',
        title: 'Chèn và chỉnh sửa công thức bằng MathLive',
        purpose: 'Soạn thảo công thức trực quan không cần nhớ mã LaTeX và chèn dạng vector sắc nét vào trang PDF.',
        toolLocation: 'Thẻ Công thức → Soạn công thức MathLive (M) — mở bảng Công thức ở cột bên phải.',
        steps: [
          'Chọn thẻ Công thức → Soạn công thức MathLive (hoặc nhấn phím M).',
          'Nhấp vào khung nhập công thức ở cột bên phải rồi bấm các nút ký hiệu (phân số, căn thức, lũy thừa, tích phân...) hoặc chọn mẫu có sẵn.',
          'Dùng phím mũi tên trái/phải để di chuyển giữa tử số, mẫu số và các thành phần công thức.',
          'Chọn màu chữ và cỡ chữ phù hợp rồi nhấn Chèn vào trang PDF.',
          'Kéo công thức đến vị trí mong muốn. Khi cần sửa lại, nhấp đúp trực tiếp vào công thức trên trang PDF rồi nhấn Cập nhật công thức.',
        ],
        illustrationKey: 'formula-mathlive',
        illustrationCaption: 'Soạn công thức trực quan bằng MathLive và nhấp đúp sửa lại trực tiếp trên PDF',
        note: 'Giáo viên quen dùng LaTeX hoặc Typst có thể bật chế độ xem mã hoặc thẻ Typst ngay trong cùng bảng Công thức.',
        keywords: ['cong thuc', 'mathlive', 'phan so', 'can thuc', 'tich phan', 'latex', 'typst'],
      },
      {
        id: 'ky-hieu-khoa-hoc',
        groupId: 'formulas',
        title: 'Ký hiệu và mẫu công thức cho Toán, Vật lí, Hóa học, Sinh học, Tin học',
        purpose: 'Chèn nhanh vectơ, số mũ, chỉ số dưới, phương trình hóa học thuận nghịch, ký hiệu Hy Lạp và biểu thức thuật toán.',
        toolLocation: 'Cột Công thức bên phải → 5 thẻ môn học: Toán | Vật lí | Hóa học | Sinh học | Tin học.',
        steps: [
          'Mở bảng Công thức ở cột bên phải (nhấn phím M).',
          'Chọn thẻ môn học tương ứng: Toán, Vật lí, Hóa học, Sinh học hoặc Tin học.',
          'Nhấn vào ký hiệu đặc thù (như chỉ số dưới H₂SO₄, mũi tên thuận nghịch ⇌, vectơ lực, Ω, Δ, O(n log n)) hoặc chọn một mẫu có sẵn.',
          'Sửa các hệ số, đại lượng trong khung nhập rồi nhấn Chèn vào trang PDF.',
        ],
        illustrationKey: 'formula-science',
        illustrationCaption: 'Chọn thẻ môn học để chèn nhanh ký hiệu và phương trình khoa học chuẩn',
        note: 'Công thức được xuất dưới dạng vector SVG nên khi phóng to hay in ra giấy đều sắc nét.',
        keywords: ['vat li', 'hoa hoc', 'sinh hoc', 'tin hoc', 'so mu', 'chi so duoi', 'vecto', 'phuong trinh hoa hoc'],
      },
    ],
  },

  // 4. HÌNH VẼ VÀ ĐỒ THỊ
  {
    id: 'diagrams-graphs',
    title: 'Hình vẽ và đồ thị',
    summary: 'Thư viện hình mẫu, hình học động 2D, hình học không gian 3D, đồ thị hàm số, chèn ảnh và hình cơ bản.',
    features: [
      {
        id: 'thu-vien-hinh',
        groupId: 'diagrams-graphs',
        title: 'Chèn hình từ thư viện hình mẫu khoa học',
        purpose: 'Chèn nhanh hình học phẳng, hình không gian, sơ đồ mạch điện và dụng cụ thí nghiệm hóa học chuẩn giáo dục.',
        toolLocation: 'Thẻ Hình vẽ → Thư viện hình mẫu (cột Hình vẽ bên phải).',
        steps: [
          'Chọn thẻ Hình vẽ → Thư viện hình mẫu.',
          'Lọc theo môn (Tất cả / Toán / Vật lí / Hóa học) hoặc nhập từ khóa tìm kiếm (tam giác, chóp, mạch điện, buret...).',
          'Tùy chỉnh bật/tắt nhãn chữ, độ dày nét và màu nét phía trên lưới hình.',
          'Nhấp vào hình cần dùng để chèn ngay vào trang PDF, sau đó kéo di chuyển hoặc kéo góc để thay đổi kích thước.',
        ],
        illustrationKey: 'diagram-library',
        illustrationCaption: 'Tìm kiếm, lọc môn học và nhấp 1 lần để chèn hình vector vào trang PDF',
        note: 'Thầy cô có thể xem trước toàn bộ các mẫu hình trong thư viện ngay cả khi chưa mở tệp PDF.',
        keywords: ['thu vien hinh', 'hinh ve', 'mach dien', 'buret', 'hinh mau'],
      },
      {
        id: 'hinh-hoc-2d',
        groupId: 'diagrams-graphs',
        title: 'Vẽ hình học động 2D',
        purpose: 'Dựng tam giác, trung điểm, đường cao, trung tuyến, đường vuông góc và đường tròn theo đúng quan hệ hình học.',
        toolLocation: 'Thẻ Hình vẽ → Hình động 2D.',
        steps: [
          'Chọn thẻ Hình vẽ → Hình động 2D.',
          'Chọn công cụ dựng ở thanh trên (Điểm, Đoạn thẳng, Tam giác, Trung điểm, Đường cao/Vuông góc, Đường tròn).',
          'Nhấp lên vùng vẽ để dựng hình; dùng công cụ Chọn kéo đỉnh để kiểm tra các đường phụ tự cập nhật chính xác.',
          'Nhấn Chèn vào trang PDF (hoặc Lưu vào thư viện cá nhân để dùng lại cho đề sau).',
        ],
        illustrationKey: 'dynamic-geometry-2d',
        illustrationCaption: 'Dựng tam giác ABC với trung tuyến AM, đường cao AH và chèn vào trang PDF',
        note: 'Có thể tắt lưới ô vuông trước khi chèn để hình trên đề thi sạch đẹp như sách giáo khoa.',
        keywords: ['hinh hoc 2d', 'hinh hoc dong', 've tam giac', 'duong cao', 'trung tuyen', 'duong tron'],
      },
      {
        id: 'do-thi-ham-so',
        groupId: 'diagrams-graphs',
        title: 'Vẽ đồ thị hàm số',
        purpose: 'Tự động vẽ đồ thị hàm số trên hệ trục tọa độ Oxy có chia vạch, mũi tên trục và đường cong mượt.',
        toolLocation: 'Thẻ Hình vẽ → Đồ thị hàm số.',
        steps: [
          'Chọn thẻ Hình vẽ → Đồ thị hàm số.',
          'Nhập biểu thức hàm số (ví dụ: x^2 - 2*x + 1) hoặc chọn mẫu hàm số có sẵn.',
          'Chỉnh miền hiển thị trục Ox, Oy và màu sắc đường cong (có thể thêm nhiều hàm trên cùng hệ trục).',
          'Nhấn Chèn đồ thị vào PDF.',
        ],
        illustrationKey: 'function-graph',
        illustrationCaption: 'Nhập biểu thức y = x² - 2x + 1 để vẽ hệ trục Oxy và chèn vào đề thi',
        note: 'Dùng dấu * cho phép nhân (2*x), dấu ^ cho lũy thừa (x^2) và dấu chấm cho số thập phân (0.5*x).',
        keywords: ['do thi', 'ham so', 'parabol', 'oxy', 've do thi'],
      },
      {
        id: 'hinh-hoc-3d',
        groupId: 'diagrams-graphs',
        title: 'Vẽ hình học không gian 3D',
        purpose: 'Tạo hình chóp, lăng trụ, hình hộp, nón, trụ, cầu với góc xoay tùy chỉnh và tự phân biệt nét liền – nét đứt cạnh khuất.',
        toolLocation: 'Thẻ Hình vẽ → Hình không gian 3D.',
        steps: [
          'Chọn thẻ Hình vẽ → Hình không gian 3D.',
          'Chọn loại khối cần vẽ (chóp S.ABCD, chóp tam giác, lăng trụ, nón, trụ, cầu...).',
          'Kéo chuột hoặc chỉnh thanh xoay góc để chọn góc nhìn rõ ràng, không trùng đỉnh.',
          'Bật tùy chọn nét đứt cho cạnh khuất và tên đỉnh, sau đó nhấn Chèn hình chiếu vào PDF.',
        ],
        illustrationKey: 'solid-3d',
        illustrationCaption: 'Xoay góc nhìn hình chóp S.ABCD có nét đứt cạnh khuất trước khi chèn vào PDF',
        keywords: ['hinh 3d', 'khong gian', 'hinh chop', 'lang tru', 'hinh non', 'net dut'],
      },
      {
        id: 'chen-anh-hinh-co-ban',
        groupId: 'diagrams-graphs',
        title: 'Chèn ảnh từ máy tính và vẽ hình cơ bản',
        purpose: 'Chèn ảnh minh họa/logo từ máy tính và vẽ khung chữ nhật, hình tròn, đoạn thẳng, mũi tên, hộp chú thích hoặc bảng.',
        toolLocation: 'Thẻ Chỉnh sửa → Chèn ảnh; thẻ Hình vẽ → Chữ nhật, Mũi tên và menu Hình cơ bản khác.',
        steps: [
          'Để chèn ảnh: chọn Chỉnh sửa → Chèn ảnh rồi chọn tệp .png, .jpg, .webp hoặc .svg từ máy tính.',
          'Để vẽ hình cơ bản: chọn thẻ Hình vẽ → chọn Chữ nhật, Mũi tên hoặc mở Hình cơ bản khác (Hình tròn, Đoạn thẳng, Hộp chú thích, Bảng).',
          'Nhấn giữ và kéo trên trang PDF để tạo hình theo kích thước mong muốn.',
          'Chỉnh màu viền, màu nền và độ dày nét ở cột Thuộc tính bên phải.',
        ],
        illustrationKey: 'add-text-image',
        illustrationCaption: 'Chèn hình ảnh từ máy tính hoặc vẽ khung, mũi tên, bảng và chỉnh thuộc tính',
        keywords: ['chen anh', 'logo', 'hinh chu nhat', 'hinh tron', 'mui ten', 'bang'],
      },
    ],
  },

  // 5. CHẤM BÀI HỌC SINH
  {
    id: 'grading',
    title: 'Chấm bài học sinh',
    summary: 'Đánh dấu đúng sai, ghi điểm từng câu, cộng tổng điểm, nhận xét, đóng khung điểm và xuất bảng điểm.',
    features: [
      {
        id: 'cham-tu-luan',
        groupId: 'grading',
        title: 'Đánh dấu đúng sai và gắn điểm từng câu',
        purpose: 'Chấm bài trực tiếp lên PDF bằng bút đỏ, dấu chấm nhanh và nhãn điểm đồng bộ tự động với bảng điểm.',
        toolLocation: 'Thẻ Chấm bài → Bút chấm đỏ, Đóng dấu chấm, Gắn điểm câu và Bảng chấm điểm (G).',
        steps: [
          'Mở bài làm học sinh rồi chọn thẻ Chấm bài (hoặc nhấn phím G) để mở bảng Chấm bài ở cột bên phải.',
          'Nhập tên học sinh, lớp và kiểm tra thang điểm tối đa của từng câu.',
          'Dùng Bút chấm đỏ để gạch lỗi hoặc chọn Đóng dấu chấm (✓ Đúng, ✗ Sai, ½ Đúng một phần...) rồi nhấp lên bài làm.',
          'Chọn Gắn điểm câu, chọn câu tương ứng ở cột bên phải và nhấp lên trang PDF để đặt nhãn điểm.',
          'Khi chỉnh sửa điểm ở bảng bên phải, nhãn điểm trên trang PDF và tổng điểm sẽ tự động cập nhật đồng bộ.',
        ],
        illustrationKey: 'grading-essay',
        illustrationCaption: 'Chấm bài bằng bút đỏ, dấu chấm và nhãn điểm đồng bộ 2 chiều với bảng chấm bài',
        note: 'Mỗi câu chỉ gắn một nhãn điểm duy nhất để tránh cộng trùng điểm.',
        keywords: ['cham bai', 'but do', 'dau cham', 'gan diem', 'tu luan', 'thang 10'],
      },
      {
        id: 'tong-diem-nhan-xet',
        groupId: 'grading',
        title: 'Cộng tổng điểm, nhận xét nhanh và đóng khung tổng điểm',
        purpose: 'Tự động tính tổng điểm có tùy chọn làm tròn, chèn lời phê nhanh và đóng khung tổng điểm màu đỏ lên trang đầu bài làm.',
        toolLocation: 'Cột Chấm bài bên phải (mục Điểm số & Nhận xét) hoặc thẻ Chấm bài → Thêm công cụ.',
        steps: [
          'Trong cột Chấm bài bên phải, chọn quy tắc làm tròn điểm (Giữ nguyên / 0,25 / 0,5 / 0,1).',
          'Chuyển sang thẻ nhỏ Nhận xét để chọn câu nhận xét mẫu (hoặc thêm mẫu mới) và chèn lên trang PDF.',
          'Nhấn Đóng khung tổng điểm lên trang (hoặc Chấm bài → Thêm công cụ → Đóng khung tổng điểm tự động).',
          'Kéo khung tổng điểm màu đỏ đến vị trí thoáng ở đầu trang bài làm.',
        ],
        illustrationKey: 'grading-total-comment',
        illustrationCaption: 'Khung tổng điểm tự động đồng bộ và mẫu nhận xét nhanh',
        note: 'Nếu thầy cô điều chỉnh lại điểm một câu bất kỳ, con số trong khung tổng điểm tự cập nhật ngay lập tức.',
        keywords: ['tong diem', 'lam tron', 'khung diem', 'nhan xet', 'loi phe'],
      },
      {
        id: 'cham-trac-nghiem',
        groupId: 'grading',
        title: 'Chấm câu trắc nghiệm, Đúng/Sai và Trả lời ngắn',
        purpose: 'Hỗ trợ chấm câu trắc nghiệm A/B/C/D, câu Đúng/Sai 4 ý và câu Trả lời ngắn ngay trong cùng bảng điểm.',
        toolLocation: 'Cột Chấm bài bên phải → danh sách câu hỏi và đáp án.',
        steps: [
          'Mở bảng Chấm bài (phím G) ở cột bên phải.',
          'Chọn loại câu hỏi phù hợp (Tự luận, Trắc nghiệm nhiều lựa chọn, Đúng/Sai 4 ý hoặc Trả lời ngắn).',
          'Nhập đáp án đúng chuẩn và phương án học sinh đã làm để hệ thống tự đối chiếu và tính điểm.',
          'Dùng Đóng dấu chấm để đánh dấu ✓ / ✗ nhanh trên phiếu bài làm.',
        ],
        illustrationKey: 'grading-mcq',
        illustrationCaption: 'Đối chiếu đáp án trắc nghiệm nhiều lựa chọn, Đúng/Sai 4 ý và Trả lời ngắn',
        keywords: ['trac nghiem', 'dung sai', 'tra loi ngan', 'dap an'],
      },
      {
        id: 'xuat-bang-diem',
        groupId: 'grading',
        title: 'Lưu bài chấm và xuất bảng điểm Excel / CSV',
        purpose: 'Lưu kết quả từng bài vào sổ điểm cục bộ và xuất bảng điểm tổng hợp ra tệp Excel (.xlsx) hoặc CSV.',
        toolLocation: 'Cột Chấm bài bên phải → nút Lưu vào bảng điểm & thẻ Sổ điểm; thẻ Chấm bài → Xuất Excel.',
        steps: [
          'Sau khi chấm xong một bài, nhấn Lưu vào bảng điểm ở cột Chấm bài bên phải.',
          'Nhấn Lưu PDF (Ctrl + S) để tải bản bài làm đã chấm gửi trả học sinh.',
          'Chuyển sang thẻ Sổ điểm ở cột bên phải để xem danh sách bài đã chấm của lớp.',
          'Nhấn Xuất Excel (hoặc Xuất CSV) để tải bảng điểm tổng hợp có đầy đủ họ tên, lớp, điểm và nhận xét.',
        ],
        illustrationKey: 'grading-export-excel',
        illustrationCaption: 'Lưu kết quả chấm vào Sổ điểm cục bộ và xuất bảng điểm Excel (.xlsx)',
        note: 'Cần nhấn Lưu vào bảng điểm cho ít nhất một bài chấm trước khi xuất tệp Excel.',
        keywords: ['excel', 'xlsx', 'csv', 'bang diem', 'so diem', 'xuat diem'],
      },
    ],
  },

  // 6. CHÚ THÍCH VÀ CHỮ KÝ
  {
    id: 'annotate-sign',
    title: 'Chú thích và chữ ký',
    summary: 'Bút viết, bút dạ quang, tô sáng, gạch chân, gạch ngang, ghi chú nổi và chữ ký hình ảnh.',
    features: [
      {
        id: 'but-highlight-gach-chan',
        groupId: 'annotate-sign',
        title: 'Bút viết tay, bút dạ quang, tô sáng, gạch chân, gạch ngang và ghi chú',
        purpose: 'Đánh dấu ý trọng tâm khi giảng bài, viết trực tiếp lên PDF và dán ghi chú nhắc nhở mà không làm hỏng tài liệu gốc.',
        toolLocation: 'Thẻ Chú thích → Bút vẽ tay (P), Bút dạ quang, Tẩy nét vẽ, Ghi chú nổi và menu Thêm công cụ (Tô sáng vùng chữ, Gạch chân, Gạch ngang).',
        steps: [
          'Chọn thẻ Chú thích trên thanh công cụ.',
          'Chọn Bút vẽ tay (P) hoặc Bút dạ quang rồi kéo chuột/bút cảm ứng trực tiếp lên trang. Đổi màu và độ dày nét ở cột Thuộc tính bên phải.',
          'Để đánh dấu vùng chữ gọn gàng: mở menu Thêm công cụ → chọn Tô sáng vùng chữ, Gạch chân hoặc Gạch ngang rồi kéo phủ đoạn cần đánh dấu.',
          'Để đặt ghi chú: chọn Ghi chú nổi → nhấp vào lề trang → nhấp đúp vào ô ghi chú để nhập nội dung.',
          'Nếu muốn xóa nét vẽ hoặc chú thích, chọn Tẩy nét vẽ rồi nhấp lên đối tượng cần xóa.',
        ],
        illustrationKey: 'annotate-pen-note',
        illustrationCaption: 'Dùng bút vẽ tay, tô sáng vùng chữ và đặt ghi chú nổi trên trang PDF',
        note: 'Công cụ Tẩy nét vẽ chỉ xóa nét vẽ tay, chú thích và dấu chấm — không xóa nội dung PDF gốc.',
        keywords: ['but viet', 'but ve', 'da quang', 'highlight', 'to sang', 'gach chan', 'gach ngang', 'ghi chu', 'tay'],
      },
      {
        id: 'tao-chen-chu-ky',
        groupId: 'annotate-sign',
        title: 'Tạo và chèn chữ ký hình ảnh',
        purpose: 'Ký tên trực tiếp, tải ảnh chữ ký chụp từ giấy (tự lọc nền trắng) hoặc tạo chữ ký từ họ tên để ký duyệt giáo án và bảng điểm.',
        toolLocation: 'Thẻ Chú thích → Chữ ký hình ảnh.',
        steps: [
          'Chọn thẻ Chú thích → Chữ ký hình ảnh.',
          'Tạo chữ ký bằng một trong 3 cách: Ký trực tiếp lên khung vẽ, Tải ảnh chữ ký từ máy (tự làm trong suốt nền), hoặc Nhập họ tên.',
          'Chọn màu mực chữ ký (xanh, đen hoặc đỏ) rồi nhấn Lưu vào danh sách chữ ký nếu muốn dùng lại.',
          'Nhấn Chèn vào trang PDF, kéo chữ ký đến vị trí ký tên và chỉnh kích thước cho vừa mắt.',
        ],
        illustrationKey: 'signature-insert',
        illustrationCaption: 'Ký trực tiếp hoặc lọc nền ảnh chữ ký rồi đặt vào cuối tài liệu',
        note: 'Đây là chữ ký hình ảnh lưu cục bộ trên máy tính, không phải chữ ký số USB Token.',
        keywords: ['chu ky', 'ky ten', 'chen chu ky', 'ky duyet', 'giao an'],
      },
    ],
  },

  // 7. XỬ LÝ TRANG PDF
  {
    id: 'page-tools',
    title: 'Xử lý trang PDF',
    summary: 'Ghép, tách, trích xuất, xoay, xóa, thêm trang, sắp xếp trang, cắt lề, đánh số trang và nén PDF.',
    features: [
      {
        id: 'sap-xep-xoay-trang',
        groupId: 'page-tools',
        title: 'Xoay, xóa, sắp xếp, nhân bản và thêm trang trắng',
        purpose: 'Chỉnh lại chiều trang bị xoay ngược, đổi thứ tự trang, xóa trang thừa hoặc thêm trang giấy trắng A4.',
        toolLocation: 'Thẻ Trang PDF → Sắp xếp & Xoay trang (thẻ Quản lý trang).',
        steps: [
          'Chọn thẻ Trang PDF → Sắp xếp & Xoay trang.',
          'Dùng nút mũi tên Lên / Xuống để đổi vị trí trang.',
          'Nhấn Xoay 90° để chỉnh trang bị ngang/ngược, Nhân bản để sao chép trang, hoặc Thùng rác để xóa trang thừa.',
          'Nhấn Thêm trang trắng A4 nếu cần bổ sung giấy trống ở cuối tài liệu.',
          'Đóng hộp thoại rồi nhấn Lưu PDF để xuất bản mới.',
        ],
        illustrationKey: 'page-organize',
        illustrationCaption: 'Sắp xếp thứ tự, xoay 90°, xóa trang thừa và thêm trang trắng A4',
        note: 'Có thể nhấn Ctrl + Z để hoàn tác nếu xóa hoặc đổi nhầm thứ tự trang.',
        keywords: ['xoay trang', 'xoa trang', 'sap xep trang', 'them trang trang', 'nhan ban trang'],
      },
      {
        id: 'ghep-tach-pdf',
        groupId: 'page-tools',
        title: 'Ghép nhiều PDF và tách / trích xuất trang',
        purpose: 'Gộp nhiều tệp PDF thành một tệp duy nhất, hoặc tách riêng khoảng trang (ví dụ tách Đề và Đáp án).',
        toolLocation: 'Thẻ Trang PDF → Ghép PDF hoặc Tách PDF.',
        steps: [
          'Để ghép PDF: chọn Trang PDF → Ghép PDF → chọn từ 2 tệp PDF trở lên → sắp xếp thứ tự → nhấn Ghép thành 1 tệp PDF.',
          'Để tách/trích xuất trang: mở tệp PDF → chọn Trang PDF → Tách PDF.',
          'Chọn kiểu tách theo khoảng trang (ví dụ: 1-2, 3-4), tách từng trang lẻ hoặc tách trang chẵn/lẻ.',
          'Nhấn Thực hiện tách PDF để tải về tệp .pdf mới (hoặc tệp .zip nếu tách thành nhiều tệp).',
        ],
        illustrationKey: 'page-merge-split',
        illustrationCaption: 'Ghép nhiều tệp PDF hoặc tách riêng từng khoảng trang theo nhu cầu',
        keywords: ['ghep pdf', 'gop pdf', 'tach pdf', 'trich xuat trang', 'khoang trang'],
      },
      {
        id: 'cat-le-crop',
        groupId: 'page-tools',
        title: 'Cắt lề trang PDF (Crop)',
        purpose: 'Loại bỏ viền đen hoặc khoảng trắng thừa xung quanh trang tài liệu scan để bản in gọn đẹp hơn.',
        toolLocation: 'Thẻ Trang PDF → Thêm công cụ → Cắt lề trang (Crop).',
        steps: [
          'Chọn thẻ Trang PDF → Thêm công cụ → Cắt lề trang (Crop).',
          'Nhập thông số cắt cho 4 cạnh: Trên, Dưới, Trái, Phải.',
          'Chọn áp dụng cho Trang hiện tại hoặc Tất cả các trang rồi nhấn Áp dụng cắt lề.',
          'Quan sát khung nét đứt xem trước trên trang PDF rồi nhấn Lưu PDF.',
        ],
        illustrationKey: 'page-crop',
        illustrationCaption: 'Cắt gọn 4 lề thừa và xem trước trực tiếp khung cắt trên trang PDF',
        note: 'Cắt lề chỉ ẩn phần mép hiển thị, không dùng để che thông tin mật (xem Xóa nội dung vĩnh viễn ở nhóm Bảo mật).',
        keywords: ['cat le', 'crop', 'vien den', 'can le'],
      },
      {
        id: 'danh-so-trang',
        groupId: 'page-tools',
        title: 'Đánh số trang tự động',
        purpose: 'Tự động gắn số trang (như Trang 1 / 4) vào đầu trang hoặc chân trang cho toàn bộ tài liệu.',
        toolLocation: 'Thẻ Bảo mật → Đánh số trang (cột Bảo mật bên phải).',
        steps: [
          'Chọn thẻ Bảo mật → Đánh số trang.',
          'Bật công tắc Đánh số trang tự động trong cột bên phải.',
          'Chọn vị trí (Đầu trang / Chân trang), căn lề (Trái / Giữa / Phải), số bắt đầu và kiểu hiển thị.',
          'Kiểm tra xem trước trực tiếp trên trang rồi nhấn Lưu PDF.',
        ],
        illustrationKey: 'watermark-pagenum',
        illustrationCaption: 'Thiết lập vị trí và định dạng đánh số trang tự động ở đầu hoặc chân trang',
        keywords: ['danh so trang', 'so trang', 'chan trang', 'dau trang'],
      },
      {
        id: 'anh-thanh-pdf-nen-pdf',
        groupId: 'page-tools',
        title: 'Chuyển ảnh thành PDF và nén giảm dung lượng PDF',
        purpose: 'Gom nhiều ảnh chụp bài làm thành 1 tệp PDF chuẩn A4, hoặc nén nhẹ tệp PDF nặng để gửi nhanh qua Zalo/Email.',
        toolLocation: 'Thẻ Trang PDF → Ảnh → PDF và Thêm công cụ → Nén giảm dung lượng PDF.',
        steps: [
          'Chuyển ảnh thành PDF: chọn Trang PDF → Ảnh → PDF → chọn các tệp ảnh → chọn khổ giấy A4/A5, hướng giấy và lề → nhấn Tạo tệp PDF từ hình ảnh.',
          'Nén giảm dung lượng: mở tệp PDF cần nén → chọn Trang PDF → Thêm công cụ → Nén giảm dung lượng PDF.',
          'Chọn mức nén (Chất lượng cao, Cân bằng hoặc Nhỏ gọn tối đa) rồi nhấn Thực hiện nén PDF.',
          'Xem dung lượng trước và sau khi nén rồi tải tệp PDF đã nén.',
        ],
        illustrationKey: 'images-to-pdf',
        illustrationCaption: 'Chuyển nhiều ảnh chụp thành một tệp PDF A4 hoặc nén gọn tệp nặng',
        note: 'Mức Cân bằng phù hợp nhất cho tài liệu giảng dạy có cả chữ và hình minh họa.',
        keywords: ['anh thanh pdf', 'jpg sang pdf', 'nen pdf', 'giam dung luong', 'gui zalo'],
      },
    ],
  },

  // 8. BẢO MẬT VÀ SỬ DỤNG OFFLINE
  {
    id: 'security-offline',
    title: 'Bảo mật và sử dụng offline',
    summary: 'OCR, dấu chìm (Watermark), xóa nội dung vĩnh viễn, cài đặt offline, sao lưu và khôi phục dữ liệu.',
    features: [
      {
        id: 'nhan-dang-ocr',
        groupId: 'security-offline',
        title: 'Nhận dạng văn bản từ PDF ảnh scan (OCR)',
        purpose: 'Trích xuất chữ tiếng Việt từ tài liệu PDF dạng ảnh chụp hoặc scan ngay trên trình duyệt để sao chép hoặc chỉnh sửa.',
        toolLocation: 'Thẻ Chỉnh sửa → Thêm công cụ → OCR nhận dạng chữ tiếng Việt.',
        steps: [
          'Mở tài liệu PDF dạng ảnh scan rồi chọn Chỉnh sửa → Thêm công cụ → OCR nhận dạng chữ tiếng Việt.',
          'Chọn trang cần nhận dạng và ngôn ngữ Tiếng Việt + Tiếng Anh.',
          'Nếu trang bị nghiêng hoặc mờ, kéo thanh Chỉnh thẳng trang, bật Đen trắng và tăng nhẹ Độ tương phản.',
          'Nhấn Bắt đầu nhận dạng OCR và chờ hoàn tất.',
          'Kiểm tra văn bản ở khung bên phải rồi chọn Sao chép, Tải .txt hoặc Chèn văn bản lên trang PDF.',
        ],
        illustrationKey: 'ocr-scan',
        illustrationCaption: 'Chỉnh thẳng trang, tăng tương phản và nhận dạng chữ tiếng Việt cục bộ',
        note: 'Lần chạy OCR đầu tiên cần có mạng một lần để trình duyệt tải gói ngôn ngữ tiếng Việt về máy.',
        keywords: ['ocr', 'pdf scan', 'nhan dang chu', 'anh scan', 'nghieng trang'],
      },
      {
        id: 'dau-chim-watermark',
        groupId: 'security-offline',
        title: 'Chèn dấu chìm (Watermark)',
        purpose: 'Gắn dòng chữ chìm (như ĐỀ THAM KHẢO, tên giáo viên) hoặc logo mờ lên nền trang PDF.',
        toolLocation: 'Thẻ Bảo mật → Dấu chìm (Watermark).',
        steps: [
          'Chọn thẻ Bảo mật → Dấu chìm (Watermark) để mở cột Bảo mật bên phải.',
          'Bật công tắc Hiển thị dấu chìm rồi nhập nội dung chữ hoặc chọn ảnh logo.',
          'Tùy chỉnh góc xoay, vị trí, phạm vi áp dụng và kéo Độ mờ khoảng 12%–20% để không che chữ đề.',
          'Nhấn Lưu PDF để nhúng dấu chìm vào tệp xuất ra.',
        ],
        illustrationKey: 'watermark-pagenum',
        illustrationCaption: 'Bật dấu chìm chữ mờ hoặc logo trường và xem trước trực tiếp trên trang',
        keywords: ['watermark', 'dau chim', 'ban quyen', 'logo mo'],
      },
      {
        id: 'xoa-vinh-vien',
        groupId: 'security-offline',
        title: 'Xóa nội dung nhạy cảm vĩnh viễn (Redaction) và xóa siêu dữ liệu',
        purpose: 'Xóa triệt để thông tin học sinh, số điện thoại hoặc đáp án sao cho không thể bôi đen, sao chép hay tìm kiếm lại.',
        toolLocation: 'Thẻ Bảo mật → Khoanh vùng xóa vĩnh viễn và nút Áp dụng xóa vĩnh viễn ở cột bên phải.',
        steps: [
          'Chọn thẻ Bảo mật → Khoanh vùng xóa vĩnh viễn.',
          'Nhấn giữ và kéo khung bao phủ kín vùng chữ hoặc hình cần xóa triệt để.',
          'Kiểm tra danh sách vùng đã khoanh ở cột Bảo mật bên phải.',
          'Nhấn Áp dụng xóa vĩnh viễn: hệ thống sẽ dựng phẳng các trang đã khoanh, xóa lớp chữ bên dưới, xóa metadata và tải bản PDF sạch.',
        ],
        illustrationKey: 'redaction-before-after',
        illustrationCaption: 'Trước và sau khi Áp dụng xóa vĩnh viễn: không thể sao chép hay Ctrl+F tìm lại',
        note: 'Có thể bật thêm Chế độ tài liệu mật ở cột Bảo mật để không tự lưu bản nháp vào trình duyệt.',
        keywords: ['xoa vinh vien', 'redaction', 'che thong tin', 'metadata', 'bao mat', 'an dap an'],
      },
      {
        id: 'cai-dat-offline',
        groupId: 'security-offline',
        title: 'Cài đặt ứng dụng trên macOS, Windows và sử dụng ngoại tuyến (Offline)',
        purpose: 'Cài PDF EDU STUDIO lên máy Mac (Dock / Launchpad), Windows hoặc iPhone/iPad để mở như ứng dụng độc lập và làm việc ngay cả khi mất mạng.',
        toolLocation: 'Thanh tiêu đề trên cùng → nút Cài PDF EDU STUDIO / Hướng dẫn cài trên Mac / Xem cách cài đặt.',
        steps: [
          'Trên Safari macOS (macOS Sonoma / Safari 17+): chọn menu File → Add to Dock → xác nhận tên PDF EDU STUDIO rồi mở từ Dock hoặc Launchpad. Nếu Safari cũ chưa có Add to Dock, hãy mở ứng dụng bằng Chrome hoặc Microsoft Edge.',
          'Trên Google Chrome hoặc Microsoft Edge (macOS / Windows): nhấn nút Cài PDF EDU STUDIO khi trình duyệt hỗ trợ lời nhắc trực tiếp, hoặc dùng biểu tượng Cài đặt ứng dụng ở góc phải thanh địa chỉ / menu trình duyệt.',
          'Trên Safari (iPhone / iPad): nhấn Chia sẻ (Share) → Thêm vào Màn hình chính (Add to Home Screen) → Thêm.',
          'Quan sát chỉ báo trên thanh tiêu đề: khi hiện Sẵn sàng offline nghĩa là đã lưu đủ tệp lõi, PDF Worker, MathLive và font tiếng Việt cho lần mở không có mạng tiếp theo.',
        ],
        illustrationKey: 'pwa-offline',
        illustrationCaption: 'Cài đặt ứng dụng đúng cơ chế theo từng trình duyệt (Safari macOS, Chrome, Edge) và kiểm tra trạng thái ngoại tuyến',
        note: 'Các tính năng cục bộ (mở/sửa/chấm PDF, công thức MathLive, thư viện hình vẽ, tài liệu mẫu 8 môn) hoạt động offline sau lần tải đầu trên bản HTTPS; gói ngôn ngữ OCR cần mạng ở lần tải đầu nếu chưa lưu sẵn.',
        keywords: ['offline', 'cai offline', 'ngoai tuyen', 'pwa', 'mat mang', 'chrome', 'edge', 'safari', 'macos', 'mac', 'dock'],
      },
      {
        id: 'sao-luu-khoi-phuc',
        groupId: 'security-offline',
        title: 'Sao lưu, khôi phục dữ liệu cá nhân và xóa dữ liệu máy dùng chung',
        purpose: 'Xuất chữ ký, hình vẽ cá nhân, mẫu nhận xét và sổ điểm sang tệp .json để dự phòng, hoặc xóa sạch dấu vết khi dùng máy chung.',
        toolLocation: 'Thanh tiêu đề trên cùng → nút Thiết lập.',
        steps: [
          'Nhấn nút Thiết lập ở góc trên bên phải thanh tiêu đề.',
          'Nhấn Xuất tệp sao lưu dữ liệu (.json) để lưu tệp dự phòng cất vào USB hoặc máy cá nhân (lưu ý: đây là tệp sao lưu dữ liệu, không phải bộ cài đặt ứng dụng).',
          'Khi cần mang sang máy tính khác: vào Thiết lập → Khôi phục từ tệp sao lưu → chọn tệp .json đã lưu.',
          'Nếu đang làm việc trên máy dùng chung ở trường, nhấn Xóa toàn bộ dữ liệu cá nhân (Máy dùng chung) sau khi đã lưu xong tệp cần thiết.',
        ],
        illustrationKey: 'backup-restore',
        illustrationCaption: 'Sao lưu dữ liệu cá nhân ra tệp .json và dọn sạch an toàn trên máy dùng chung',
        note: 'Xóa lịch sử/dữ liệu duyệt web của trình duyệt sẽ xóa dữ liệu cục bộ; nên sao lưu tệp .json định kỳ.',
        keywords: ['sao luu', 'khoi phuc', 'json', 'may dung chung', 'xoa du lieu', 'thiet lap'],
      },
    ],
  },
];

export const ALL_GUIDE_FEATURES: GuideFeature[] = GUIDE_GROUPS.flatMap((g) => g.features);

export function findGuideGroup(groupId?: string): GuideGroup {
  return GUIDE_GROUPS.find((g) => g.id === groupId) || GUIDE_GROUPS[0];
}

export function findGuideFeature(featureId?: string): GuideFeature | undefined {
  if (!featureId) return undefined;
  return ALL_GUIDE_FEATURES.find((f) => f.id === featureId);
}

export function normalizeVietnameseText(input: string): string {
  return (input || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/\s+/g, ' ')
    .trim();
}

export function searchGuideFeatures(query: string): GuideFeature[] {
  const norm = normalizeVietnameseText(query);
  if (!norm) return [];
  const tokens = norm.split(' ').filter(Boolean);

  return ALL_GUIDE_FEATURES.filter((feat) => {
    const group = GUIDE_GROUPS.find((g) => g.id === feat.groupId);
    const haystack = normalizeVietnameseText(
      [
        group?.title || '',
        feat.title,
        feat.purpose,
        feat.toolLocation,
        feat.note || '',
        ...feat.keywords,
        ...feat.steps,
      ].join(' ')
    );
    return tokens.every((tok) => haystack.includes(tok));
  });
}
