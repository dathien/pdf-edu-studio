import {
  buildMcqSession,
  buildRubricSession,
  buildStructuredPayload,
  makeDiagramObj,
  type StructuredSamplePayload,
} from './sampleBuilderHelpers';

/**
 * 11 additional authentic THPT Computer Science (Tin học) sample documents (Grades 10, 11, 12)
 * covering MCQ, True/False 4-item, Short Answer, Essay/DB Design, Read Python Code,
 * Trace Output, Debug Code, Complete Code, Algorithm Flowchart, SQL Queries, and HTML/CSS.
 */
export async function generateCsExtraSample(
  sampleId: string
): Promise<StructuredSamplePayload | null> {
  // 1. Trắc nghiệm Tin học 10: Biểu diễn thông tin, Mạng & An toàn số
  if (sampleId === 'sample-cs-02-mcq') {
    const grading = buildMcqSession('Đề trắc nghiệm Tin học 10 – Thông tin & Mạng', 'Tin học', '10A1', [
      { number: 1, kind: 'abcd', answerKey: 'B', maxScore: 1 },
      { number: 2, kind: 'abcd', answerKey: 'C', maxScore: 1 },
      { number: 3, kind: 'abcd', answerKey: 'A', maxScore: 1 },
      { number: 4, kind: 'abcd', answerKey: 'D', maxScore: 1 },
      { number: 5, kind: 'abcd', answerKey: 'B', maxScore: 1 },
      { number: 6, kind: 'abcd', answerKey: 'C', maxScore: 1 },
      { number: 7, kind: 'abcd', answerKey: 'A', maxScore: 1 },
      { number: 8, kind: 'abcd', answerKey: 'D', maxScore: 1 },
      { number: 9, kind: 'abcd', answerKey: 'B', maxScore: 1 },
      { number: 10, kind: 'abcd', answerKey: 'C', maxScore: 1 },
    ]);
    return buildStructuredPayload(
      {
        subjectLabel: 'Tin học',
        gradeLabel: 'Lớp 10',
        docTypeLabel: 'Đề kiểm tra · Trắc nghiệm',
        title: 'ĐỀ TRẮC NGHIỆM TIN HỌC 10: BIỂU DIỄN DỮ LIỆU, MẠNG & AN TOÀN SỐ',
        subtitle: 'Môn Tin học lớp 10 (GDPT 2018)  |  10 câu trắc nghiệm nhiều lựa chọn kèm bảng đáp án.',
        blocks: [
          { kind: 'heading', text: 'Chọn một đáp án đúng nhất cho từng câu hỏi' },
          {
            kind: 'lines',
            lines: [
              'Câu 1. Đơn vị nhỏ nhất để đo lượng thông tin trong máy tính là:',
              '   A. Byte                 B. Bit                  C. Kilobyte             D. Word',
              'Câu 2. Bảng mã tiêu chuẩn hiện đại biểu diễn được hầu hết các ngôn ngữ trên thế giới (bao gồm tiếng Việt) là:',
              '   A. ASCII 7-bit          B. EBCDIC               C. Unicode (UTF-8)      D. Morse',
              'Câu 3. Số nguyên không âm 19 trong hệ thập phân được biểu diễn ở hệ nhị phân là:',
              '   A. 10011₂               B. 10101₂               C. 11001₂               D. 10001₂',
              'Câu 4. Thiết bị nào dùng để kết nối các mạng khác nhau và định tuyến gói tin dựa trên địa chỉ IP?',
              '   A. Hub                  B. Repeater             C. Switch tầng 2        D. Router (Bộ định tuyến)',
              'Câu 5. Trong các biện pháp sau, cách nào giúp bảo vệ tài khoản trực tuyến hiệu quả nhất?',
              '   A. Dùng cùng một mật khẩu ngắn cho mọi dịch vụ        B. Bật xác thực hai yếu tố (2FA) và dùng mật khẩu mạnh',
              '   C. Lưu mật khẩu trong tệp văn bản công khai           D. Nhấp vào mọi liên kết nhận thưởng qua tin nhắn',
              'Câu 6. Trong ảnh số màu RGB 24-bit, mỗi điểm ảnh (pixel) chiếm dung lượng bao nhiêu byte?',
              '   A. 1 byte               B. 2 byte               C. 3 byte               D. 24 byte',
              'Câu 7. Phần mềm mã nguồn mở (Open Source) có đặc điểm nổi bật là:',
              '   A. Công khai mã nguồn theo giấy phép cho phép nghiên cứu, sửa đổi và chia sẻ hợp pháp',
              '   B. Luôn không có bản quyền và không chịu bất kỳ điều khoản giấy phép nào',
              '   C. Chỉ chạy được trên hệ điều hành thương mại          D. Không thể cập nhật bảo mật',
              'Câu 8. Mô hình điện toán đám mây cung cấp phần mềm hoàn chỉnh chạy trực tiếp qua trình duyệt gọi là:',
              '   A. LAN                  B. BIOS                 C. DNS                  D. SaaS',
              'Câu 9. Phép toán logic (True and False) or (not False) cho kết quả là:',
              '   A. False                B. True                 C. None                 D. Lỗi cú pháp',
              'Câu 10. Hành vi sao chép nguyên văn bài viết của tác giả khác đưa vào báo cáo mà không trích dẫn nguồn vi phạm:',
              '   A. Quy tắc đặt tên tệp  B. Bảo mật tầng mạng    C. Bản quyền và đạo đức số    D. Chuẩn hóa dữ liệu',
            ],
          },
          { kind: 'pageBreak' },
          { kind: 'heading', text: 'ĐÁP ÁN & GIẢI THÍCH NGẮN' },
          {
            kind: 'table',
            headers: ['Câu', 'Đáp án', 'Giải thích'],
            colWeights: [0.8, 1.0, 6.2],
            rows: [
              ['1', 'B', '1 bit nhận một trong hai trạng thái 0 hoặc 1; 1 byte = 8 bit.'],
              ['2', 'C', 'Unicode (phổ biến với mã hóa UTF-8) hỗ trợ đầy đủ tiếng Việt và ký tự đa ngôn ngữ.'],
              ['3', 'A', '19 = 16 + 2 + 1 = 1·2⁴ + 0·2³ + 0·2² + 1·2¹ + 1·2⁰ = 10011₂.'],
              ['4', 'D', 'Router hoạt động ở tầng mạng (IP), chuyển tiếp gói tin giữa các mạng khác nhau.'],
              ['5', 'B', 'Mật khẩu mạnh kết hợp 2FA giảm tối đa nguy cơ bị chiếm đoạt tài khoản.'],
              ['6', 'C', '24 bit / 8 = 3 byte (1 byte cho mỗi kênh R, G, B).'],
              ['7', 'A', 'Phần mềm nguồn mở vẫn có giấy phép (MIT, GPL, Apache...) quy định quyền sử dụng và chia sẻ.'],
              ['8', 'D', 'SaaS (Software as a Service) cung cấp ứng dụng hoàn chỉnh qua Internet.'],
              ['9', 'B', '(True and False) = False; (not False) = True; False or True = True.'],
              ['10', 'C', 'Sao chép không ghi nguồn là hành vi đạo văn, vi phạm bản quyền và đạo đức trong môi trường số.'],
            ],
          },
        ],
      },
      () => [],
      grading
    );
  }

  // 2. Đúng/Sai 4 ý Tin học 12: Mạng máy tính TCP/IP & Trí tuệ nhân tạo
  if (sampleId === 'sample-cs-03-tf4') {
    const grading = buildMcqSession('Phiếu Đúng/Sai 4 ý Tin học 12 – Mạng & AI', 'Tin học', '12A1', [
      { number: 1, kind: 'tf4', answerKey: 'ĐSĐĐ', maxScore: 1 },
      { number: 2, kind: 'tf4', answerKey: 'ĐĐSĐ', maxScore: 1 },
      { number: 3, kind: 'tf4', answerKey: 'SĐĐĐ', maxScore: 1 },
    ]);
    return buildStructuredPayload(
      {
        subjectLabel: 'Tin học',
        gradeLabel: 'Lớp 12',
        docTypeLabel: 'Phiếu bài tập · Đúng/Sai 4 ý',
        title: 'BÀI TẬP ĐÚNG/SAI 4 Ý TIN HỌC 12: MẠNG TCP/IP, HTML & TRÍ TUỆ NHÂN TẠO',
        subtitle: 'Định dạng THPT 2025 (0,1 – 0,25 – 0,5 – 1,0 điểm/câu)  |  Tin học lớp 12.',
        blocks: [
          { kind: 'heading', text: 'Câu 1. Giao thức mạng TCP/IP và địa chỉ IP' },
          {
            kind: 'lines',
            lines: [
              'Trong mạng máy tính sử dụng bộ giao thức TCP/IP:',
              '   a) Giao thức IP chịu trách nhiệm đánh địa chỉ và định tuyến gói tin qua các mạng.        [ Đ / S ]',
              '   b) Một địa chỉ IPv4 tiêu chuẩn có độ dài 128 bit chia thành 8 nhóm số thập lục phân.     [ Đ / S ]',
              '   c) Giao thức TCP đảm bảo truyền dữ liệu tin cậy, kiểm tra lỗi và sắp xếp lại đúng thứ tự. [ Đ / S ]',
              '   d) Hệ thống DNS giúp phân giải tên miền dễ nhớ (vd: example.edu.vn) sang địa chỉ IP.     [ Đ / S ]',
            ],
          },
          { kind: 'heading', text: 'Câu 2. Thiết kế trang web với HTML5 và CSS' },
          {
            kind: 'lines',
            lines: [
              'Khi xây dựng trang web giới thiệu câu lạc bộ Tin học của trường:',
              '   a) Thuộc tính alt trong thẻ <img> giúp mô tả ảnh khi ảnh không tải được và hỗ trợ người khiếm thị. [ Đ / S ]',
              '   b) Liên kết tệp CSS ngoài bằng thẻ <link rel="stylesheet" href="style.css"> giúp tách biệt nội dung và trình bày. [ Đ / S ]',
              '   c) Bộ chọn CSS #menu áp dụng cho tất cả các phần tử có thuộc tính class="menu".          [ Đ / S ]',
              '   d) Thẻ <a> dùng thuộc tính href để chỉ định địa chỉ đích của siêu liên kết.              [ Đ / S ]',
            ],
          },
          { kind: 'heading', text: 'Câu 3. Ứng dụng và đạo đức Trí tuệ nhân tạo (AI)' },
          {
            kind: 'lines',
            lines: [
              'Về bản chất và ứng dụng của Trí tuệ nhân tạo hiện nay:',
              '   a) Mọi câu trả lời do mô hình ngôn ngữ lớn sinh ra đều luôn chính xác tuyệt đối, không cần kiểm chứng. [ Đ / S ]',
              '   b) AI có thể hỗ trợ nhận dạng chữ viết, dịch ngôn ngữ và phân tích dữ liệu nhanh chóng.  [ Đ / S ]',
              '   c) Sử dụng AI tạo hình ảnh/âm thanh giả mạo danh tính người khác để lừa đảo là hành vi vi phạm pháp luật và đạo đức. [ Đ / S ]',
              '   d) Khi sử dụng dữ liệu huấn luyện có thiên lệch, hệ thống AI có nguy cơ đưa ra kết quả thiếu công bằng. [ Đ / S ]',
            ],
          },
          { kind: 'pageBreak' },
          { kind: 'heading', text: 'ĐÁP ÁN & GIẢI THÍCH' },
          {
            kind: 'table',
            headers: ['Câu', 'Đáp án', 'Giải thích'],
            colWeights: [0.8, 1.4, 5.8],
            rows: [
              ['Câu 1', 'a-Đ, b-S, c-Đ, d-Đ', 'b) Sai vì IPv4 dài 32 bit (4 octet thập phân); IPv6 mới dài 128 bit.'],
              ['Câu 2', 'a-Đ, b-Đ, c-S, d-Đ', 'c) Sai vì #menu là bộ chọn theo id="menu"; bộ chọn theo class phải viết .menu.'],
              ['Câu 3', 'a-S, b-Đ, c-Đ, d-Đ', 'a) Sai vì mô hình AI có thể tạo thông tin sai lệch (ảo giác), luôn cần con người kiểm chứng.'],
            ],
          },
        ],
      },
      () => [],
      grading
    );
  }

  // 3. Trả lời ngắn Tin học 10: Hệ đếm & Dung lượng dữ liệu
  if (sampleId === 'sample-cs-04-short') {
    const grading = buildMcqSession('Phiếu trả lời ngắn Tin học 10 – Hệ đếm & Dung lượng', 'Tin học', '10A2', [
      { number: 1, kind: 'short', answerKey: '53', maxScore: 2.5 },
      { number: 2, kind: 'short', answerKey: '101101', maxScore: 2.5 },
      { number: 3, kind: 'short', answerKey: '2F', maxScore: 2.5 },
      { number: 4, kind: 'short', answerKey: '900', maxScore: 2.5 },
    ]);
    return buildStructuredPayload(
      {
        subjectLabel: 'Tin học',
        gradeLabel: 'Lớp 10',
        docTypeLabel: 'Phiếu bài tập · Trả lời ngắn',
        title: 'BÀI TẬP TRẢ LỜI NGẮN TIN HỌC 10: HỆ ĐẾM NHỊ PHÂN – HEX & DUNG LƯỢNG',
        subtitle: 'Môn Tin học lớp 10  |  4 bài toán chuyển đổi hệ đếm và tính dung lượng ảnh bitmap không nén.',
        blocks: [
          { kind: 'heading', text: 'Tính toán và ghi kết quả chính xác vào chỗ trống' },
          {
            kind: 'lines',
            lines: [
              'Câu 1. Đổi số nhị phân 110101₂ sang hệ thập phân (cơ số 10).',
              '   Đáp số: ________________',
              'Câu 2. Đổi số thập phân 45₁₀ sang hệ nhị phân (viết chuỗi bit không có số 0 thừa ở đầu).',
              '   Đáp số: ________________₂',
              'Câu 3. Đổi số thập phân 47₁₀ sang hệ thập lục phân (cơ số 16, dùng chữ in hoa A–F).',
              '   Đáp số: ________________₁₆',
              'Câu 4. Một ảnh bitmap màu RGB 24-bit (không nén) có độ phân giải 640 × 480 điểm ảnh. Tính dung lượng dữ liệu điểm ảnh theo đơn vị KB (quy ước 1 KB = 1024 byte).',
              '   Đáp số: ________________ KB',
            ],
          },
          { kind: 'pageBreak' },
          { kind: 'heading', text: 'ĐÁP ÁN & LỜI GIẢI CHI TIẾT' },
          {
            kind: 'table',
            headers: ['Câu', 'Đáp án', 'Cách tính'],
            colWeights: [0.9, 1.3, 5.8],
            rows: [
              ['Câu 1', '53', '110101₂ = 1·32 + 1·16 + 0·8 + 1·4 + 0·2 + 1·1 = 32 + 16 + 4 + 1 = 53.'],
              ['Câu 2', '101101', '45 = 32 + 8 + 4 + 1 = 1·2⁵ + 0·2⁴ + 1·2³ + 1·2² + 0·2¹ + 1·2⁰ = 101101₂.'],
              ['Câu 3', '2F', '47 = 2 × 16 + 15. Trong hệ 16, số 15 biểu diễn bằng ký tự F → 2F₁₆.'],
              ['Câu 4', '900', 'Dung lượng = 640 × 480 × 3 byte = 921 600 byte. Đổi sang KB: 921 600 / 1024 = 900 KB.'],
            ],
          },
        ],
      },
      () => [],
      grading
    );
  }

  // 4. Tự luận thiết kế CSDL quan hệ (Tin 11) + cs-er-diagram
  if (sampleId === 'sample-cs-05-essay') {
    const grading = buildRubricSession('Đề tự luận Tin học 11 – Thiết kế CSDL', 'Tin học', '11A1', [
      { id: 'cs5-1', label: 'Xác định đúng bảng, khóa chính và khóa ngoài', maxScore: 4.0 },
      { id: 'cs5-2', label: 'Giải thích ràng buộc toàn vẹn tham chiếu', maxScore: 3.0 },
      { id: 'cs5-3', label: 'Đề xuất bổ sung thuộc tính và chống dư thừa dữ liệu', maxScore: 3.0 },
    ]);
    return buildStructuredPayload(
      {
        subjectLabel: 'Tin học',
        gradeLabel: 'Lớp 11',
        docTypeLabel: 'Đề kiểm tra · Tự luận',
        title: 'ĐỀ TỰ LUẬN TIN HỌC 11: THIẾT KẾ CƠ SỞ DỮ LIỆU QUAN HỆ',
        subtitle: 'Môn Tin học lớp 11  |  Kèm sơ đồ liên kết 3 bảng LOP – HOCSINH – DIEM (vector chỉnh sửa được).',
        blocks: [
          { kind: 'heading', text: 'Quan sát sơ đồ mô hình dữ liệu quản lí điểm học sinh THPT' },
          { kind: 'spacer', height: 156 },
          { kind: 'heading', text: 'Yêu cầu phân tích và thiết kế (10,0 điểm)' },
          {
            kind: 'lines',
            lines: [
              'Câu 1 (4,0 điểm). Dựa vào sơ đồ trên, hãy xác định khóa chính (Primary Key) và khóa ngoài (Foreign Key) của từng bảng LOP, HOCSINH, DIEM. Cho biết ý nghĩa của quan hệ 1 – N giữa LOP và HOCSINH.',
              'Câu 2 (3,0 điểm). Giải thích điều gì sẽ xảy ra nếu ta cố gắng thêm một bản ghi vào bảng DIEM có MaHS chưa tồn tại trong bảng HOCSINH khi hệ quản trị CSDL đã thiết lập ràng buộc khóa ngoài.',
              'Câu 3 (3,0 điểm). Nếu lưu trực tiếp TenLop và GVCN lặp lại trong mọi dòng của bảng HOCSINH thay vì tách ra bảng LOP, sẽ phát sinh những bất cập nào khi giáo viên chủ nhiệm thay đổi?',
            ],
          },
          { kind: 'writingLines', title: 'Khung chấm và nhận xét của giáo viên:', count: 4 },
          { kind: 'pageBreak' },
          { kind: 'heading', text: 'HƯỚNG DẪN CHẤM (10,0 ĐIỂM)' },
          {
            kind: 'table',
            headers: ['Câu', 'Điểm', 'Yêu cầu đáp án'],
            colWeights: [1.0, 1.0, 6.0],
            rows: [
              ['Câu 1', '4,0', '• LOP: PK = MaLop.\n• HOCSINH: PK = MaHS, FK = MaLop tham chiếu LOP(MaLop).\n• DIEM: PK = MaDiem, FK = MaHS tham chiếu HOCSINH(MaHS).\n• Quan hệ 1–N: Một lớp có nhiều học sinh, nhưng mỗi học sinh chỉ thuộc một lớp duy nhất.'],
              ['Câu 2', '3,0', 'Hệ quản trị CSDL (DBMS) sẽ từ chối thao tác chèn và báo lỗi vi phạm toàn vẹn tham chiếu (Foreign Key Constraint), ngăn ngừa bản ghi điểm mồ côi không thuộc về học sinh nào.'],
              ['Câu 3', '3,0', 'Gây dư thừa dữ liệu (lặp TenLop, GVCN hàng chục lần) và dị thường cập nhật: khi đổi GVCN phải sửa ở toàn bộ dòng học sinh của lớp; nếu sửa sót sẽ gây mâu thuẫn dữ liệu.'],
            ],
          },
        ],
      },
      (pageId) => makeDiagramObj('cs5-er', 'cs-er-diagram', 'cs', pageId, 76, 178, 442, 150, 2),
      grading
    );
  }

  // 5. Đọc hiểu mã nguồn Python (Tin 10)
  if (sampleId === 'sample-cs-06-read-code') {
    return buildStructuredPayload({
      subjectLabel: 'Tin học',
      gradeLabel: 'Lớp 10',
      docTypeLabel: 'Phiếu bài tập · Đọc hiểu mã nguồn',
      title: 'PHIẾU ĐỌC HIỂU MÃ NGUỒN PYTHON (TIN HỌC 10)',
      subtitle: 'Môn Tin học lớp 10  |  Đọc hiểu vòng lặp, danh sách (list) và định nghĩa hàm Python.',
      blocks: [
        { kind: 'heading', text: 'Đoạn chương trình 1 — Xử lí danh sách điểm số' },
        {
          kind: 'code',
          title: 'Python 3 — phan_tich_diem.py',
          lines: [
            'def thong_ke(ds):',
            '    tong = 0',
            '    dem = 0',
            '    for x in ds:',
            '        if x >= 8.0:',
            '            tong += x',
            '            dem += 1',
            '    if dem == 0:',
            '        return 0.0',
            '    return round(tong / dem, 2)',
            '',
            'diem = [7.5, 8.0, 9.0, 6.5, 8.5]',
            'print("Ket qua:", thong_ke(diem))',
          ],
        },
        { kind: 'heading', text: 'Đoạn chương trình 2 — Đếm ký tự trong xâu' },
        {
          kind: 'code',
          title: 'Python 3 — dem_nguyen_am.py',
          lines: [
            's = "Tin hoc THPT"',
            'vowels = "aeiouAEIOU"',
            'c = 0',
            'for ch in s:',
            '    if ch in vowels:',
            '        c += 1',
            'print(c)',
          ],
        },
        { kind: 'heading', text: 'Câu hỏi đọc hiểu mã nguồn' },
        {
          kind: 'lines',
          lines: [
            '1. Cho biết chức năng của hàm thong_ke(ds) trong Đoạn chương trình 1.',
            '2. Tại sao cần câu lệnh điều kiện `if dem == 0: return 0.0` trước khi tính `tong / dem`?',
            '3. Cho biết giá trị chính xác được in ra màn hình của Đoạn chương trình 1 và Đoạn chương trình 2.',
          ],
        },
        { kind: 'pageBreak' },
        { kind: 'heading', text: 'ĐÁP ÁN ĐỌC HIỂU MÃ NGUỒN' },
        {
          kind: 'lines',
          lines: [
            '1. Hàm thong_ke(ds) tính trung bình cộng (làm tròn 2 chữ số thập phân) của các điểm lớn hơn hoặc bằng 8.0 trong danh sách ds.',
            '2. Kiểm tra `dem == 0` để tránh lỗi chia cho 0 (ZeroDivisionError) trong trường hợp danh sách không có điểm nào >= 8.0.',
            '3. Kết quả in ra:',
            '   • Đoạn 1: Các phần tử >= 8.0 là 8.0, 9.0, 8.5 → tong = 25.5, dem = 3 → 25.5 / 3 = 8.5. Màn hình in: Ket qua: 8.5',
            '   • Đoạn 2: Trong "Tin hoc THPT", các nguyên âm thuộc vowels là \'i\' và \'o\' → Màn hình in: 2',
          ],
        },
      ],
    });
  }

  // 6. Dự đoán kết quả thực thi & Trace bảng biến (Tin 10)
  if (sampleId === 'sample-cs-07-trace-output') {
    return buildStructuredPayload({
      subjectLabel: 'Tin học',
      gradeLabel: 'Lớp 10',
      docTypeLabel: 'Phiếu bài tập · Dự đoán kết quả',
      title: 'PHIẾU DỰ ĐOÁN KẾT QUẢ CHƯƠNG TRÌNH & BẢNG THEO DÕI BIẾN (TRACE)',
      subtitle: 'Môn Tin học lớp 10  |  Thực hiện từng bước (dry-run) trên giấy để kiểm tra tư duy thuật toán.',
      blocks: [
        { kind: 'heading', text: 'Bài 1. Lập bảng theo dõi biến và xác định kết quả in ra' },
        {
          kind: 'code',
          title: 'Python 3 — trace_while.py',
          lines: [
            'n = 2475',
            's = 0',
            'while n > 0:',
            '    d = n % 10',
            '    if d % 2 == 1:',
            '        s = s + d',
            '    n = n // 10',
            'print("s =", s)',
          ],
        },
        {
          kind: 'table',
          headers: ['Lần lặp', 'n trước lặp', 'd = n % 10', 'd lẻ? (Đ/S)', 's sau lặp', 'n = n // 10'],
          colWeights: [1.1, 1.4, 1.3, 1.4, 1.3, 1.5],
          rows: [
            ['1', '2475', '___', '___', '___', '___'],
            ['2', '___', '___', '___', '___', '___'],
            ['3', '___', '___', '___', '___', '___'],
            ['4', '___', '___', '___', '___', '___'],
          ],
        },
        { kind: 'heading', text: 'Bài 2. Dự đoán kết quả với vòng lặp for lồng nhau' },
        {
          kind: 'code',
          title: 'Python 3 — trace_for.py',
          lines: [
            'k = 0',
            'for i in range(1, 5):',
            '    for j in range(i, 5):',
            '        k += 1',
            'print("k =", k)',
          ],
        },
        { kind: 'pageBreak' },
        { kind: 'heading', text: 'ĐÁP ÁN BẢNG THEO DÕI BIẾN (TRACE)' },
        {
          kind: 'table',
          headers: ['Lần lặp', 'n trước lặp', 'd = n % 10', 'd lẻ?', 's sau lặp', 'n sau lặp'],
          colWeights: [1.1, 1.4, 1.3, 1.2, 1.4, 1.6],
          rows: [
            ['1', '2475', '5', 'Đúng', '5', '247'],
            ['2', '247', '7', 'Đúng', '12', '24'],
            ['3', '24', '4', 'Sai', '12', '2'],
            ['4', '2', '2', 'Sai', '12', '0 (dừng)'],
          ],
        },
        {
          kind: 'lines',
          lines: [
            '• Bài 1 in ra: s = 12 (tổng các chữ số lẻ của 2475 là 5 + 7 = 12).',
            '• Bài 2: Với i = 1 → j chạy 4 lần (1,2,3,4); i = 2 → 3 lần; i = 3 → 2 lần; i = 4 → 1 lần. Tổng k = 4 + 3 + 2 + 1 = 10. In ra: k = 10.',
          ],
        },
      ],
    });
  }

  // 7. Sửa lỗi chương trình Python (Debug — Tin 10)
  if (sampleId === 'sample-cs-08-debug') {
    return buildStructuredPayload({
      subjectLabel: 'Tin học',
      gradeLabel: 'Lớp 10',
      docTypeLabel: 'Phiếu thực hành · Sửa lỗi chương trình',
      title: 'PHIẾU THỰC HÀNH SỬA LỖI CHƯƠNG TRÌNH PYTHON (DEBUGGING)',
      subtitle: 'Môn Tin học lớp 10  |  Nhận diện và khắc phục lỗi cú pháp, lỗi chỉ số và lỗi logic thuật toán.',
      blocks: [
        { kind: 'heading', text: 'Chương trình có 4 lỗi cần phát hiện và sửa lại' },
        {
          kind: 'lines',
          lines: [
            'Đề bài: Viết hàm tim_max_chan(a) trả về số chẵn lớn nhất trong danh sách số nguyên dương a (nếu không có số chẵn trả về -1). Một học sinh viết đoạn mã sau và bị lỗi khi chạy:',
          ],
        },
        {
          kind: 'code',
          title: 'Python 3 — ma_nguon_co_loi.py (có đánh số dòng)',
          lines: [
            '1: def tim_max_chan(a)',
            '2:     m = 0',
            '3:     for i in range(1, len(a) + 1):',
            '4:         if a[i] % 2 = 0 and a[i] > m:',
            '5:             m = a[i]',
            '6:     if m == 0:',
            '7:         return -1',
            '8:     return m',
            '9: print(tim_max_chan([14, 7, 6, 9]))',
          ],
        },
        { kind: 'heading', text: 'Nhiệm vụ của học sinh' },
        {
          kind: 'table',
          headers: ['Dòng lỗi', 'Loại lỗi (Cú pháp / Thực thi / Logic)', 'Cách sửa chính xác'],
          colWeights: [1.2, 2.8, 4.0],
          rows: [
            ['Dòng ___', '___________________________', '____________________________________'],
            ['Dòng ___', '___________________________', '____________________________________'],
            ['Dòng ___', '___________________________', '____________________________________'],
            ['Dòng ___', '___________________________', '____________________________________'],
          ],
        },
        { kind: 'pageBreak' },
        { kind: 'heading', text: 'ĐÁP ÁN PHÂN TÍCH LỖI & MÃ NGUỒN ĐÚNG' },
        {
          kind: 'table',
          headers: ['Dòng', 'Loại lỗi', 'Phân tích & Cách sửa'],
          colWeights: [1.0, 2.0, 5.0],
          rows: [
            ['Dòng 1', 'Lỗi cú pháp', 'Thiếu dấu hai chấm `:` cuối dòng khai báo hàm → `def tim_max_chan(a):`.'],
            ['Dòng 3', 'Lỗi chỉ số (Runtime & Logic)', '`range(1, len(a) + 1)` bỏ sót phần tử đầu tiên `a[0]` (14) và gây IndexError khi `i == len(a)` → sửa thành `range(len(a))`.'],
            ['Dòng 4', 'Lỗi cú pháp', 'Dùng toán tử gán `=` thay vì so sánh bằng `==` → `if a[i] % 2 == 0 and a[i] > m:`.'],
            ['Dòng 2', 'Lưu ý mở rộng (Logic)', 'Với đề bài cho danh sách số nguyên dương thì `m = -1` an toàn hơn `m = 0` (tránh nhầm khi có số 0).'],
          ],
        },
        {
          kind: 'code',
          title: 'Mã nguồn sau khi sửa hoàn chỉnh (trả về 14)',
          lines: [
            'def tim_max_chan(a):',
            '    m = -1',
            '    for i in range(len(a)):',
            '        if a[i] % 2 == 0 and a[i] > m:',
            '            m = a[i]',
            '    return m',
            'print(tim_max_chan([14, 7, 6, 9]))  # Kết quả: 14',
          ],
        },
      ],
    });
  }

  // 8. Hoàn thiện mã nguồn Tìm kiếm nhị phân & Sắp xếp chọn (Tin 11)
  if (sampleId === 'sample-cs-09-complete-code') {
    return buildStructuredPayload({
      subjectLabel: 'Tin học',
      gradeLabel: 'Lớp 11',
      docTypeLabel: 'Phiếu thực hành · Hoàn thiện mã nguồn',
      title: 'PHIẾU HOÀN THIỆN MÃ NGUỒN TIN HỌC 11: TÌM KIẾM NHỊ PHÂN & SẮP XẾP',
      subtitle: 'Môn Tin học lớp 11  |  Điền các biểu thức còn thiếu vào thuật toán Tìm kiếm nhị phân và Sắp xếp chọn.',
      blocks: [
        { kind: 'heading', text: 'Bài 1. Hoàn thiện thuật toán Tìm kiếm nhị phân (Binary Search)' },
        {
          kind: 'lines',
          lines: [
            'Cho danh sách a đã sắp xếp tăng dần và giá trị cần tìm k. Điền các chỗ trống (1), (2), (3), (4):',
          ],
        },
        {
          kind: 'code',
          title: 'Python 3 — binary_search.py',
          lines: [
            'def binary_search(a, k):',
            '    left = 0',
            '    right = ___(1)___',
            '    while left <= right:',
            '        mid = ___(2)___',
            '        if a[mid] == k:',
            '            return mid',
            '        elif a[mid] < k:',
            '            left = ___(3)___',
            '        else:',
            '            right = ___(4)___',
            '    return -1',
          ],
        },
        { kind: 'heading', text: 'Bài 2. Hoàn thiện vòng lặp trong Sắp xếp chọn (Selection Sort tăng dần)' },
        {
          kind: 'code',
          title: 'Python 3 — selection_sort.py',
          lines: [
            'def selection_sort(a):',
            '    n = len(a)',
            '    for i in range(n - 1):',
            '        min_idx = i',
            '        for j in range(___(5)___, n):',
            '            if a[j] < a[min_idx]:',
            '                min_idx = ___(6)___',
            '        a[i], a[min_idx] = a[min_idx], a[i]',
          ],
        },
        { kind: 'pageBreak' },
        { kind: 'heading', text: 'ĐÁP ÁN HOÀN THIỆN MÃ NGUỒN & ĐỘ PHỨC TẠP' },
        {
          kind: 'table',
          headers: ['Vị trí', 'Biểu thức cần điền', 'Giải thích'],
          colWeights: [1.0, 2.2, 4.8],
          rows: [
            ['(1)', 'len(a) - 1', 'Chỉ số phần tử cuối cùng của danh sách a.'],
            ['(2)', '(left + right) // 2', 'Chia nguyên lấy chỉ số ở giữa đoạn tìm kiếm.'],
            ['(3)', 'mid + 1', 'Vì a[mid] < k nên bỏ nửa trái kể cả mid, tìm từ mid + 1.'],
            ['(4)', 'mid - 1', 'Vì a[mid] > k nên bỏ nửa phải kể cả mid, tìm đến mid - 1.'],
            ['(5)', 'i + 1', 'Tìm phần tử nhỏ nhất trong đoạn chưa sắp xếp từ i + 1 đến n - 1.'],
            ['(6)', 'j', 'Cập nhật vị trí chứa giá trị nhỏ nhất tìm thấy.'],
          ],
        },
        {
          kind: 'lines',
          lines: [
            'Đánh giá độ phức tạp thời gian: Tìm kiếm nhị phân có độ phức tạp O(log₂ n); Sắp xếp chọn có độ phức tạp O(n²).',
          ],
        },
      ],
    });
  }

  // 9. Thuật toán & Lưu đồ khối (Tin 10) + cs-flowchart-max
  if (sampleId === 'sample-cs-10-flowchart') {
    return buildStructuredPayload(
      {
        subjectLabel: 'Tin học',
        gradeLabel: 'Lớp 10',
        docTypeLabel: 'Phiếu học tập · Thuật toán & Lưu đồ',
        title: 'PHIẾU HỌC TẬP TIN HỌC 10: THUẬT TOÁN & LƯU ĐỒ KHỐI TÌM MAX(A, B)',
        subtitle: 'Môn Tin học lớp 10  |  Kèm sơ đồ lưu đồ khối chuẩn (bắt đầu, nhập, rẽ nhánh, kết quả) dạng vector.',
        blocks: [
          { kind: 'heading', text: 'Quan sát sơ đồ lưu đồ khối (Flowchart) bên dưới' },
          { kind: 'spacer', height: 222 },
          { kind: 'heading', text: 'Câu hỏi thực hành tư duy thuật toán' },
          {
            kind: 'lines',
            lines: [
              '1. Nêu ý nghĩa của các hình khối tiêu chuẩn trong lưu đồ trên: hình bầu dục (Oval), hình bình hành, hình thoi và hình chữ nhật.',
              '2. Chạy thử thuật toán theo lưu đồ với hai bộ dữ liệu đầu vào: (a = 12, b = 19) và (a = 25, b = 25). Ghi lại nhánh thực thi và giá trị max.',
              '3. Chuyển đổi lưu đồ khối trên thành đoạn chương trình hoàn chỉnh bằng ngôn ngữ Python.',
              '4. Mở rộng: Nêu ý tưởng sửa đổi lưu đồ để tìm giá trị lớn nhất trong 3 số a, b, c.',
            ],
          },
          { kind: 'pageBreak' },
          { kind: 'heading', text: 'ĐÁP ÁN THUẬT TOÁN & CHƯƠNG TRÌNH PYTHON' },
          {
            kind: 'lines',
            lines: [
              '1. Quy ước khối: Hình bầu dục = Bắt đầu / Kết thúc; Hình bình hành = Nhập / Xuất dữ liệu; Hình thoi = Kiểm tra điều kiện rẽ nhánh (Đúng/Sai); Hình chữ nhật = Thao tác xử lí / gán giá trị.',
              '2. Chạy thử:',
              '   • Với a = 12, b = 19: Điều kiện (a > b) là Sai → nhánh phải → max = 19 → Xuất 19.',
              '   • Với a = 25, b = 25: Điều kiện (a > b) là Sai → nhánh phải → max = 25 → Xuất 25 (kết quả vẫn đúng).',
            ],
          },
          {
            kind: 'code',
            title: '3. Cài đặt bằng Python 3',
            lines: [
              'a = float(input("Nhập a: "))',
              'b = float(input("Nhập b: "))',
              'if a > b:',
              '    m = a',
              'else:',
              '    m = b',
              'print("Giá trị lớn nhất:", m)',
            ],
          },
          {
            kind: 'lines',
            lines: [
              '4. Mở rộng 3 số a, b, c: Gán m = a; nếu b > m thì gán m = b; nếu c > m thì gán m = c; xuất m.',
            ],
          },
        ],
      },
      (pageId) =>
        makeDiagramObj('cs10-flow', 'cs-flowchart-max', 'cs', pageId, 130, 178, 332, 214, 2)
    );
  }

  // 10. Truy vấn SQL cơ bản (Tin 11)
  if (sampleId === 'sample-cs-11-sql') {
    return buildStructuredPayload({
      subjectLabel: 'Tin học',
      gradeLabel: 'Lớp 11',
      docTypeLabel: 'Phiếu thực hành · Truy vấn SQL',
      title: 'PHIẾU THỰC HÀNH TRUY VẤN SQL (TIN HỌC 11)',
      subtitle: 'Môn Tin học lớp 11  |  Thực hành SELECT, WHERE, ORDER BY, JOIN và hàm tổng hợp GROUP BY.',
      blocks: [
        { kind: 'heading', text: 'Lược đồ CSDL mẫu (Số liệu giả định phục vụ thực hành SQL)' },
        {
          kind: 'table',
          headers: ['Bảng', 'Các thuộc tính chính (Khóa chính gạch chân / ghi PK)'],
          colWeights: [1.8, 6.2],
          rows: [
            ['LOP', 'MaLop (PK), TenLop, Khoi'],
            ['HOCSINH', 'MaHS (PK), HoTen, NgaySinh, MaLop (FK)'],
            ['DIEM', 'MaDiem (PK), MaHS (FK), MonHoc, DiemTB'],
          ],
        },
        { kind: 'heading', text: 'Yêu cầu viết câu lệnh SQL chuẩn' },
        {
          kind: 'lines',
          lines: [
            'Câu 1. Liệt kê MaHS, HoTen của tất cả học sinh thuộc lớp có MaLop = \'11A1\', sắp xếp tăng dần theo HoTen.',
            'Câu 2. Liệt kê MaHS, MonHoc, DiemTB từ bảng DIEM đối với các bản ghi môn \'Tin học\' có DiemTB >= 8.0.',
            'Câu 3. Kết nối bảng HOCSINH và bảng DIEM để hiển thị HoTen, MonHoc, DiemTB của những học sinh đạt DiemTB >= 8.5, sắp xếp giảm dần theo DiemTB.',
            'Câu 4. Thống kê điểm trung bình môn theo từng MonHoc (hiển thị MonHoc và điểm trung bình làm tròn bằng hàm AVG).',
          ],
        },
        { kind: 'writingLines', title: 'Khung viết câu lệnh SQL của học sinh:', count: 6 },
        { kind: 'pageBreak' },
        { kind: 'heading', text: 'ĐÁP ÁN CÂU LỆNH SQL CHUẨN' },
        {
          kind: 'code',
          title: 'Lời giải SQL (Câu 1 – Câu 4)',
          lines: [
            '-- Câu 1:',
            'SELECT MaHS, HoTen',
            'FROM HOCSINH',
            "WHERE MaLop = '11A1'",
            'ORDER BY HoTen ASC;',
            '',
            '-- Câu 2:',
            'SELECT MaHS, MonHoc, DiemTB',
            'FROM DIEM',
            "WHERE MonHoc = 'Tin học' AND DiemTB >= 8.0;",
            '',
            '-- Câu 3:',
            'SELECT h.HoTen, d.MonHoc, d.DiemTB',
            'FROM HOCSINH h',
            'INNER JOIN DIEM d ON h.MaHS = d.MaHS',
            'WHERE d.DiemTB >= 8.5',
            'ORDER BY d.DiemTB DESC;',
            '',
            '-- Câu 4:',
            'SELECT MonHoc, AVG(DiemTB) AS DiemTB_Chung',
            'FROM DIEM',
            'GROUP BY MonHoc;',
          ],
        },
      ],
    });
  }

  // 11. Thực hành HTML & CSS (Tin 12)
  if (sampleId === 'sample-cs-12-html-css') {
    return buildStructuredPayload({
      subjectLabel: 'Tin học',
      gradeLabel: 'Lớp 12',
      docTypeLabel: 'Phiếu thực hành · HTML & CSS',
      title: 'PHIẾU THỰC HÀNH TIN HỌC 12: XÂY DỰNG BIỂU MẪU HTML & BỐ CỤC CSS',
      subtitle: 'Môn Tin học lớp 12  |  Tạo biểu mẫu đăng ký câu lạc bộ bằng HTML5 và định dạng bằng CSS.',
      blocks: [
        { kind: 'heading', text: 'Nhiệm vụ 1. Phân tích đoạn mã HTML5 biểu mẫu đăng ký CLB Tin học' },
        {
          kind: 'code',
          title: 'dang_ky_clb.html',
          lines: [
            '<form class="club-form">',
            '  <h2>Đăng ký Câu lạc bộ Tin học</h2>',
            '  <label for="hoten">Họ và tên:</label>',
            '  <input id="hoten" type="text" name="hoten" required>',
            '  <label for="khoi">Khối lớp:</label>',
            '  <select id="khoi" name="khoi">',
            '    <option value="10">Lớp 10</option>',
            '    <option value="11">Lớp 11</option>',
            '    <option value="12">Lớp 12</option>',
            '  </select>',
            '  <button type="submit">Gửi đăng ký</button>',
            '</form>',
          ],
        },
        { kind: 'heading', text: 'Nhiệm vụ 2. Viết quy tắc CSS đáp ứng các yêu cầu trình bày sau' },
        {
          kind: 'lines',
          lines: [
            '1. Cho lớp `.club-form` chiều rộng tối đa 420px, nền màu `#F8FAFC`, viền mảnh `1px solid #CBD5E1`, khoảng đệm trong `20px` và bo góc `10px`.',
            '2. Thiết lập chữ của tiêu đề `h2` bên trong `.club-form` có màu `#164E63` và cỡ chữ `20px`.',
            '3. Cho nút `button` nền màu `#087F70`, chữ màu trắng (`#FFFFFF`), đệm `10px 16px`, không viền, con trỏ chuột dạng bàn tay (`pointer`), và khi di chuột (`:hover`) đổi nền thành `#06695D`.',
            '4. Giải thích ý nghĩa của thuộc tính `for="hoten"` trên thẻ `<label>` và thuộc tính `required` trên thẻ `<input>`.',
          ],
        },
        { kind: 'pageBreak' },
        { kind: 'heading', text: 'ĐÁP ÁN CSS & GIẢI THÍCH HTML5' },
        {
          kind: 'code',
          title: 'style.css — Lời giải mẫu',
          lines: [
            '.club-form {',
            '  max-width: 420px;',
            '  background-color: #F8FAFC;',
            '  border: 1px solid #CBD5E1;',
            '  padding: 20px;',
            '  border-radius: 10px;',
            '}',
            '.club-form h2 {',
            '  color: #164E63;',
            '  font-size: 20px;',
            '}',
            '.club-form button {',
            '  background-color: #087F70;',
            '  color: #FFFFFF;',
            '  padding: 10px 16px;',
            '  border: none;',
            '  cursor: pointer;',
            '}',
            '.club-form button:hover {',
            '  background-color: #06695D;',
            '}',
          ],
        },
        {
          kind: 'lines',
          lines: [
            '4. Giải thích:',
            '  • `for="hoten"` liên kết nhãn `<label>` với ô nhập có `id="hoten"`: khi nhấp vào nhãn, con trỏ tự động đặt vào ô nhập và hỗ trợ trình đọc màn hình.',
            '  • `required` yêu cầu trình duyệt kiểm tra bắt buộc người dùng phải nhập dữ liệu trước khi gửi biểu mẫu.',
          ],
        },
      ],
    });
  }

  return null;
}
