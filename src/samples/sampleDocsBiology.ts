import {
  buildMcqSession,
  buildRubricSession,
  buildStructuredPayload,
  makeDiagramObj,
  makeFormulaObj,
  type StructuredSamplePayload,
} from './sampleBuilderHelpers';

/**
 * 11 additional authentic THPT Biology sample documents (Grades 10, 11, 12)
 * covering MCQ, True/False 4-item, Short Answer, Essay, Cell Diagram Labeling,
 * Mitosis/Meiosis & Transport, Photosynthesis/Respiration, Genetics Crosses,
 * Ecosystem Food Web, Data/Graph Analysis, and Lab Report.
 */
export async function generateBiologyExtraSample(
  sampleId: string
): Promise<StructuredSamplePayload | null> {
  // 1. Trắc nghiệm Sinh học 10: Tế bào & Chuyển hóa năng lượng
  if (sampleId === 'sample-bio-02-mcq') {
    const grading = buildMcqSession('Đề trắc nghiệm Sinh học 10 – Tế bào & Enzyme', 'Sinh học', '10A1', [
      { number: 1, kind: 'abcd', answerKey: 'C', maxScore: 1 },
      { number: 2, kind: 'abcd', answerKey: 'B', maxScore: 1 },
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
        subjectLabel: 'Sinh học',
        gradeLabel: 'Lớp 10',
        docTypeLabel: 'Đề kiểm tra · Trắc nghiệm',
        title: 'ĐỀ TRẮC NGHIỆM SINH HỌC 10: CẤU TRÚC TẾ BÀO & CHUYỂN HÓA NĂNG LƯỢNG',
        subtitle: 'Môn Sinh học lớp 10 (GDPT 2018)  |  10 câu trắc nghiệm nhiều lựa chọn kèm đáp án và giải thích.',
        blocks: [
          { kind: 'heading', text: 'Chọn một phương án trả lời đúng nhất cho mỗi câu hỏi sau' },
          {
            kind: 'lines',
            lines: [
              'Câu 1. Thành phần chính cấu tạo nên khung cấu trúc cơ bản của màng sinh chất là:',
              '   A. Cellulose và pectin    B. Tinh bột và lipid    C. Lớp kép phospholipid và protein    D. DNA và histone',
              'Câu 2. Bào quan nào giữ vai trò chủ yếu trong quá trình hô hấp tế bào tạo phần lớn ATP ở tế bào nhân thực?',
              '   A. Ribosome               B. Ti thể               C. Bộ máy Golgi                      D. Peroxisome',
              'Câu 3. Điểm khác biệt cơ bản giữa tế bào nhân sơ (vi khuẩn) và tế bào nhân thực là tế bào nhân sơ:',
              '   A. Chưa có màng nhân và các bào quan có màng bao bọc     B. Không có màng sinh chất',
              '   C. Không có ribosome                                     D. Không chứa vật chất di truyền DNA',
              'Câu 4. Đại phân tử sinh học được cấu tạo theo nguyên tắc đa phân từ các đơn phân amino acid là:',
              '   A. Phospholipid           B. Glycogen             C. Cellulose                         D. Protein',
              'Câu 5. Trong phân tử ATP (Adenosine triphosphate), năng lượng tập trung chủ yếu ở:',
              '   A. Liên kết glycosidic    B. Hai liên kết cao năng giữa các nhóm phosphate    C. Đường ribose    D. Bazơ adenine',
              'Câu 6. Enzyme xúc tác cho phản ứng sinh hóa trong tế bào bằng cách:',
              '   A. Cung cấp trực tiếp nhiệt năng cho cơ chất             B. Bị biến đổi vĩnh viễn sau phản ứng',
              '   C. Làm giảm năng lượng hoạt hóa của phản ứng             D. Làm thay đổi chiều cân bằng hóa học',
              'Câu 7. Quá trình vận chuyển nước qua màng bán thấm từ nơi có thế nước cao sang nơi có thế nước thấp gọi là:',
              '   A. Thẩm thấu              B. Vận chuyển chủ động  C. Xuất bào                          D. Nhập bào',
              'Câu 8. Bào quan thực hiện chức năng tổng hợp chuỗi polypeptide dựa trên thông tin của mRNA là:',
              '   A. Lysosome               B. Trung thể            C. Không bào                         D. Ribosome',
              'Câu 9. Khi đặt tế bào hồng cầu người vào dung dịch ưu trương (nồng độ muối cao hơn dịch nội bào), tế bào sẽ:',
              '   A. Trương nước và vỡ ra   B. Mất nước và co nhăn lại    C. Giữ nguyên thể tích    D. Phân chia nhanh hơn',
              'Câu 10. Chu trình Krebs trong hô hấp hiếu khí diễn ra ở vị trí nào của ti thể?',
              '   A. Màng ngoài ti thể      B. Tế bào chất          C. Chất nền ti thể (matrix)          D. Khoang gian màng',
            ],
          },
          { kind: 'pageBreak' },
          { kind: 'heading', text: 'ĐÁP ÁN & GIẢI THÍCH NGẮN GỌN' },
          {
            kind: 'table',
            headers: ['Câu', 'Đáp án', 'Cơ sở sinh học'],
            colWeights: [0.8, 1.0, 6.2],
            rows: [
              ['1', 'C', 'Mô hình khảm lỏng (Singer – Nicolson): màng sinh chất gồm lớp kép phospholipid khảm các phân tử protein.'],
              ['2', 'B', 'Ti thể thực hiện chu trình Krebs và chuỗi chuyền electron tạo phần lớn ATP cho tế bào nhân thực.'],
              ['3', 'A', 'Tế bào nhân sơ có vùng nhân (không có màng nhân) và không có hệ thống bào quan có màng.'],
              ['4', 'D', 'Protein là polymer sinh học cấu tạo từ các đơn phân amino acid nối với nhau bằng liên kết peptide.'],
              ['5', 'B', 'Phân tử ATP chứa 2 liên kết phosphate cao năng dễ thủy phân giải phóng năng lượng.'],
              ['6', 'C', 'Enzyme hạ thấp năng lượng hoạt hóa của phản ứng và được hoàn nguyên sau xúc tác.'],
              ['7', 'A', 'Thẩm thấu là sự khuếch tán của các phân tử nước qua màng bán thấm theo chiều gradient thế nước.'],
              ['8', 'D', 'Ribosome là nơi diễn ra quá trình dịch mã tổng hợp chuỗi polypeptide từ mRNA.'],
              ['9', 'B', 'Trong môi trường ưu trương, nước thoát ra ngoài làm tế bào động vật bị mất nước và co nhăn.'],
              ['10', 'C', 'Đường phân ở tế bào chất; chu trình Krebs ở chất nền ti thể; chuỗi chuyền electron ở màng trong ti thể.'],
            ],
          },
        ],
      },
      () => [],
      grading
    );
  }

  // 2. Đúng/Sai 4 ý Sinh học 12: Di truyền phân tử & Đột biến gen
  if (sampleId === 'sample-bio-03-tf4') {
    const grading = buildMcqSession('Phiếu Đúng/Sai 4 ý Sinh học 12 – Di truyền phân tử', 'Sinh học', '12A1', [
      { number: 1, kind: 'tf4', answerKey: 'ĐSĐĐ', maxScore: 1 },
      { number: 2, kind: 'tf4', answerKey: 'ĐĐSĐ', maxScore: 1 },
      { number: 3, kind: 'tf4', answerKey: 'SĐĐS', maxScore: 1 },
    ]);
    return buildStructuredPayload(
      {
        subjectLabel: 'Sinh học',
        gradeLabel: 'Lớp 12',
        docTypeLabel: 'Phiếu bài tập · Đúng/Sai 4 ý',
        title: 'BÀI TẬP ĐÚNG/SAI 4 Ý SINH HỌC 12: TÁI BẢN DNA, PHIÊN MÃ & ĐỘT BIẾN GEN',
        subtitle: 'Định dạng THPT 2025 (0,1 – 0,25 – 0,5 – 1,0 điểm/câu)  |  Mức độ Thông hiểu – Vận dụng.',
        blocks: [
          { kind: 'heading', text: 'Câu 1. Cơ chế tái bản DNA và nguyên tắc bổ sung' },
          {
            kind: 'lines',
            lines: [
              'Trong quá trình nhân đôi của phân tử DNA kép ở sinh vật nhân thực:',
              '   a) Enzyme DNA polymerase chỉ tổng hợp mạch mới theo chiều 5\' → 3\'.                     [ Đ / S ]',
              '   b) Cả hai mạch mới đều được tổng hợp liên tục cùng chiều tháo xoắn của chạc chữ Y.     [ Đ / S ]',
              '   c) Nguyên tắc bán bảo toàn giúp mỗi phân tử DNA con gồm một mạch cũ và một mạch mới.   [ Đ / S ]',
              '   d) Các đoạn Okazaki trên mạch tổng hợp gián đoạn được nối lại nhờ enzyme DNA ligase.   [ Đ / S ]',
            ],
          },
          { kind: 'heading', text: 'Câu 2. Phiên mã, mã di truyền và dịch mã' },
          {
            kind: 'lines',
            lines: [
              'Một đoạn mạch khuôn của gen cấu trúc có trình tự 3\' – TAC GGA TTC ATC – 5\'. Biết codon 5\'-AUG-3\' mã hóa Met, 5\'-CCU-3\' mã hóa Pro, 5\'-AAG-3\' mã hóa Lys, 5\'-UAG-3\' là mã kết thúc:',
              '   a) Trình tự đoạn mRNA tương ứng là 5\' – AUG CCU AAG UAG – 3\'.                         [ Đ / S ]',
              '   b) Đoạn mRNA trên mang thông tin quy định tổng hợp 3 amino acid (kể cả Met mở đầu).    [ Đ / S ]',
              '   c) Phân tử tRNA vận chuyển Pro có bộ ba đối mã (anticodon) là 3\' – CCU – 5\'.           [ Đ / S ]',
              '   d) Mã di truyền có tính thoái hóa vì nhiều bộ ba khác nhau có thể cùng mã hóa một amino acid. [ Đ / S ]',
            ],
          },
          { kind: 'heading', text: 'Câu 3. Đột biến điểm trên gen cấu trúc' },
          {
            kind: 'lines',
            lines: [
              'Xét một đột biến điểm xảy ra trong vùng mã hóa của một gen cấu trúc ở vi khuẩn:',
              '   a) Mọi đột biến thay thế một cặp nucleotide đều làm thay đổi trình tự amino acid của protein. [ Đ / S ]',
              '   b) Đột biến mất hoặc thêm 1 cặp nucleotide có thể gây dịch khung đọc từ vị trí đột biến trở đi. [ Đ / S ]',
              '   c) Đột biến thay thế một cặp A–T bằng một cặp G–C làm tăng 1 liên kết hiđrô của gen.  [ Đ / S ]',
              '   d) Đột biến gen phát sinh ở tế bào sinh dưỡng (xôma) của động vật luôn di truyền qua sinh sản hữu tính. [ Đ / S ]',
            ],
          },
          { kind: 'pageBreak' },
          { kind: 'heading', text: 'ĐÁP ÁN & PHÂN TÍCH CHI TIẾT' },
          {
            kind: 'table',
            headers: ['Câu', 'Đáp án', 'Giải thích'],
            colWeights: [0.8, 1.4, 5.8],
            rows: [
              ['Câu 1', 'a-Đ, b-S, c-Đ, d-Đ', 'b) Sai vì chỉ mạch dẫn đầu tổng hợp liên tục, mạch ra chậm tổng hợp gián đoạn thành các đoạn Okazaki.'],
              ['Câu 2', 'a-Đ, b-Đ, c-S, d-Đ', 'mRNA 5\'-AUG CCU AAG UAG-3\' gồm Met-Pro-Lys và kết thúc ở UAG (3 aa). c) Sai vì anticodon bổ sung với 5\'-CCU-3\' là 3\'-GGA-5\'.'],
              ['Câu 3', 'a-S, b-Đ, c-Đ, d-S', 'a) Sai do tính thoái hóa của mã di truyền (đột biến đồng nghĩa). d) Sai vì đột biến xôma không truyền qua giao tử.'],
            ],
          },
        ],
      },
      () => [],
      grading
    );
  }

  // 3. Trả lời ngắn Sinh học 12: Tính toán DNA, mRNA & Xác suất di truyền
  if (sampleId === 'sample-bio-04-short') {
    const grading = buildMcqSession('Phiếu trả lời ngắn Sinh học 12 – DNA & Xác suất', 'Sinh học', '12A2', [
      { number: 1, kind: 'short', answerKey: '408', maxScore: 2.5 },
      { number: 2, kind: 'short', answerKey: '3120', maxScore: 2.5 },
      { number: 3, kind: 'short', answerKey: '398', maxScore: 2.5 },
      { number: 4, kind: 'short', answerKey: '0,1875', maxScore: 2.5 },
    ]);
    return buildStructuredPayload(
      {
        subjectLabel: 'Sinh học',
        gradeLabel: 'Lớp 12',
        docTypeLabel: 'Phiếu bài tập · Trả lời ngắn',
        title: 'BÀI TẬP TRẢ LỜI NGẮN SINH HỌC 12: CẤU TRÚC DNA & XÁC SUẤT DI TRUYỀN',
        subtitle: 'Môn Sinh học lớp 12  |  4 bài toán định lượng có kết quả số chính xác để điền vào phiếu trả lời ngắn.',
        blocks: [
          { kind: 'heading', text: 'Tính và ghi kết quả số vào ô trống' },
          {
            kind: 'lines',
            lines: [
              'Câu 1. Một đoạn gen cấu trúc có tổng số N = 2400 nucleotide (mỗi chu kì xoắn dài 3,4 nm gồm 10 cặp nucleotide). Tính chiều dài L của đoạn gen theo đơn vị nanomet (nm).',
              '   Đáp số: L = ________________ nm',
              'Câu 2. Trong đoạn gen ở Câu 1, số nucleotide loại A chiếm 20% tổng số nucleotide của gen. Tính tổng số liên kết hiđrô (H) của đoạn gen đó.',
              '   Đáp số: H = ________________ liên kết hiđrô',
              'Câu 3. Phân tử mRNA trưởng thành được phiên mã từ đoạn gen trên (không chứa intron, có 1 bộ ba mở đầu AUG và 1 bộ ba kết thúc) tham gia dịch mã tạo chuỗi polypeptide hoàn chỉnh (đã cắt bỏ amino acid mở đầu Met). Chuỗi polypeptide hoàn chỉnh có bao nhiêu amino acid?',
              '   Đáp số: ________________ amino acid',
              'Câu 4. Ở đậu Hà Lan, hai cặp gen A/a và B/b phân li độc lập, trội hoàn toàn. Thực hiện phép lai P: AaBb × Aabb. Tính xác suất thu được cá thể ở F₁ có kiểu hình mang một tính trạng trội và một tính trạng lặn (ghi dạng số thập phân).',
              '   Đáp số: ________________',
            ],
          },
          { kind: 'spacer', height: 76 },
          { kind: 'pageBreak' },
          { kind: 'heading', text: 'ĐÁP ÁN & CÁCH TÍNH KIỂM CHỨNG' },
          {
            kind: 'table',
            headers: ['Câu', 'Đáp số', 'Các bước tính'],
            colWeights: [0.9, 1.3, 5.8],
            rows: [
              ['Câu 1', '408', 'L = (N / 2) × 0,34 nm = 1200 × 0,34 = 408 nm.'],
              ['Câu 2', '3120', 'A = T = 20% × 2400 = 480; G = C = 30% × 2400 = 720. H = 2A + 3G = 2(480) + 3(720) = 960 + 2160 = 3120.'],
              ['Câu 3', '398', 'Số bộ ba trên mRNA = (N/2)/3 = 1200/3 = 400 bộ ba. Số aa chuỗi hoàn chỉnh = 400 − 2 = 398 (trừ 1 mã kết thúc và 1 Met mở đầu).'],
              ['Câu 4', '0,50 (hoặc 0,5)', 'Kiểm chứng lại phép lai AaBb × Aabb: Aa×Aa → 3/4 A- : 1/4 aa; Bb×bb → 1/2 B- : 1/2 bb. Một trội một lặn = P(A-bb) + P(aaB-) = (3/4)(1/2) + (1/4)(1/2) = 3/8 + 1/8 = 4/8 = 0,5. (Lưu ý: P(A-B-) = 3/8 = 0,375; P(aabb) = 1/8 = 0,125).'],
            ],
          },
        ],
      },
      (pageId) => [
        makeFormulaObj('bio4-f1', 'L = \\frac{N}{2} \\cdot 0{,}34\\,\\text{nm},\\quad H = 2A + 3G', pageId, 56, 610, '#164E63', 16),
      ],
      {
        ...grading,
        mcqItems: grading.mcqItems.map((it) => (it.number === 4 ? { ...it, answerKey: '0,5' } : it)),
      }
    );
  }

  // 4. Tự luận Sinh học 11: Trao đổi nước, Tuần hoàn & Cảm ứng
  if (sampleId === 'sample-bio-05-essay') {
    const grading = buildRubricSession('Đề tự luận Sinh học 11 – Sinh lí cơ thể', 'Sinh học', '11A1', [
      { id: 'b5-q1', label: 'Câu 1: Động lực dòng mạch gỗ & thoát hơi nước', maxScore: 3.5 },
      { id: 'b5-q2', label: 'Câu 2: So sánh tuần hoàn đơn và tuần hoàn kép', maxScore: 3.5 },
      { id: 'b5-q3', label: 'Câu 3: Cơ chế truyền tin qua synapse hóa học', maxScore: 3.0 },
    ]);
    return buildStructuredPayload(
      {
        subjectLabel: 'Sinh học',
        gradeLabel: 'Lớp 11',
        docTypeLabel: 'Đề kiểm tra · Tự luận',
        title: 'ĐỀ TỰ LUẬN SINH HỌC 11: TRAO ĐỔI CHẤT, TUẦN HOÀN & CẢM ỨNG',
        subtitle: 'Thời gian: 45 phút  |  Thang điểm: 10,0  |  Kèm biểu điểm chấm tự luận cho giáo viên.',
        blocks: [
          { kind: 'heading', text: 'Câu 1 (3,5 điểm). Vận chuyển nước ở thực vật' },
          {
            kind: 'lines',
            lines: [
              'a) Nêu ba động lực chính giúp vận chuyển dòng nước và ion khoáng trong mạch gỗ từ rễ lên lá ở cây thân gỗ cao hàng chục mét.',
              'b) Giải thích vì sao khi bứng cây đi trồng ở nơi mới, người làm vườn thường tỉa bớt lá và tưới ẩm cho đất xung quanh rễ.',
            ],
          },
          { kind: 'heading', text: 'Câu 2 (3,5 điểm). Hệ tuần hoàn ở động vật' },
          {
            kind: 'lines',
            lines: [
              'a) So sánh hệ tuần hoàn đơn (ở cá xương) và hệ tuần hoàn kép (ở thú) về số vòng tuần hoàn, cấu tạo tim và áp lực máu đi nuôi cơ thể.',
              'b) Nêu 2 biện pháp khoa học giúp bảo vệ hệ tim mạch ở lứa tuổi học sinh THPT.',
            ],
          },
          { kind: 'heading', text: 'Câu 3 (3,0 điểm). Dẫn truyền xung thần kinh qua synapse hóa học' },
          {
            kind: 'lines',
            lines: [
              'Trình bày diễn biến cơ bản của quá trình truyền tin qua synapse hóa học và giải thích tại sao xung thần kinh chỉ truyền theo một chiều từ màng trước sang màng sau synapse.',
            ],
          },
          { kind: 'writingLines', title: 'Khung ghi nhận xét của giáo viên:', count: 4 },
          { kind: 'pageBreak' },
          { kind: 'heading', text: 'HƯỚNG DẪN CHẤM & THANG ĐIỂM (10,0 ĐIỂM)' },
          {
            kind: 'table',
            headers: ['Câu', 'Điểm', 'Yêu cầu nội dung chính'],
            colWeights: [1.0, 1.0, 6.0],
            rows: [
              ['Câu 1', '3,5', 'a) Lực đẩy của áp suất rễ; lực hút do thoát hơi nước ở lá (động lực đầu trên); lực liên kết giữa các phân tử nước với nhau và với thành mạch gỗ (2,0đ).\nb) Tỉa bớt lá làm giảm diện tích thoát hơi nước khi hệ rễ vừa bị đứt lông hút chưa hấp thụ nước kịp, tránh héo cây (1,5đ).'],
              ['Câu 2', '3,5', 'a) Cá: 1 vòng tuần hoàn, tim 2 ngăn (1 tâm nhĩ, 1 tâm thất), máu qua mang giảm áp lực. Thú: 2 vòng tuần hoàn (nhỏ qua phổi, lớn nuôi cơ thể), tim 4 ngăn hoàn chỉnh, máu giàu O₂ được bơm đi với áp lực cao (2,5đ).\nb) Vận động đều đặn, ăn giảm mặn/chất béo bão hòa, không hút thuốc lá, ngủ đủ giấc (1,0đ).'],
              ['Câu 3', '3,0', 'Diễn biến: Xung tới chùy synapse → mở kênh Ca²⁺ → bóng chứa chất truyền tin (acetylcholine...) vỡ giải phóng vào khe synapse → gắn thụ thể màng sau → mở kênh ion gây điện thế hoạt động (2,0đ).\nMột chiều vì chỉ màng trước có bóng chứa chất trung gian hóa học và chỉ màng sau có thụ thể đặc hiệu (1,0đ).'],
            ],
          },
        ],
      },
      () => [],
      grading
    );
  }

  // 5. Bài tập chú thích hình tế bào nhân thực (Sinh 10) + bio-eukaryotic-cell
  if (sampleId === 'sample-bio-06-label-diagram') {
    return buildStructuredPayload(
      {
        subjectLabel: 'Sinh học',
        gradeLabel: 'Lớp 10',
        docTypeLabel: 'Phiếu học tập · Chú thích hình',
        title: 'PHIẾU CHÚ THÍCH HÌNH SINH HỌC 10: CẤU TRÚC TẾ BÀO NHÂN THỰC',
        subtitle: 'Môn Sinh học lớp 10  |  Kèm sơ đồ tế bào nhân thực vector có thể chỉnh nhãn trực tiếp trên trang PDF.',
        blocks: [
          { kind: 'heading', text: 'Nhiệm vụ 1. Quan sát sơ đồ tế bào nhân thực dưới đây và điền tên bào quan (1 → 6)' },
          { kind: 'spacer', height: 220 },
          { kind: 'heading', text: 'Nhiệm vụ 2. Hoàn thành bảng tên và chức năng chính của từng bào quan' },
          {
            kind: 'table',
            headers: ['Kí hiệu', 'Tên bào quan', 'Chức năng chính trong tế bào'],
            colWeights: [1.0, 2.4, 4.6],
            rows: [
              ['(1)', '______________________', '____________________________________________________________'],
              ['(2)', '______________________', '____________________________________________________________'],
              ['(3)', '______________________', '____________________________________________________________'],
              ['(4)', '______________________', '____________________________________________________________'],
              ['(5)', '______________________', '____________________________________________________________'],
              ['(6)', '______________________', '____________________________________________________________'],
            ],
          },
          { kind: 'pageBreak' },
          { kind: 'heading', text: 'ĐÁP ÁN CHÚ THÍCH HÌNH TẾ BÀO NHÂN THỰC' },
          {
            kind: 'table',
            headers: ['Kí hiệu', 'Tên bào quan', 'Chức năng sinh học chính'],
            colWeights: [1.0, 2.4, 4.6],
            rows: [
              ['(1)', 'Màng sinh chất', 'Bao bọc tế bào, kiểm soát trao đổi chất có chọn lọc và tiếp nhận tín hiệu.'],
              ['(2)', 'Nhân tế bào (nhân con)', 'Chứa vật chất di truyền DNA, điều khiển mọi hoạt động sống của tế bào.'],
              ['(3)', 'Lưới nội chất', 'Tổng hợp protein (lưới nội chất hạt) và tổng hợp lipid, khử độc (lưới nội chất trơn).'],
              ['(4)', 'Ti thể', 'Hô hấp tế bào hiếu khí, chuyển hóa năng lượng trong chất hữu cơ thành ATP.'],
              ['(5)', 'Bộ máy Golgi', 'Chế biến, lắp ráp, đóng gói và phân phối sản phẩm protein, lipid tới nơi cần thiết.'],
              ['(6)', 'Ribosome', 'Bào quan không màng thực hiện dịch mã tổng hợp chuỗi polypeptide.'],
            ],
          },
        ],
      },
      (pageId) =>
        makeDiagramObj('bio6-cell', 'bio-eukaryotic-cell', 'biology', pageId, 118, 178, 355, 212, 2)
    );
  }

  // 6. Tế bào: Nguyên phân, Giảm phân & Vận chuyển qua màng (Sinh 10)
  if (sampleId === 'sample-bio-07-cell') {
    return buildStructuredPayload({
      subjectLabel: 'Sinh học',
      gradeLabel: 'Lớp 10',
      docTypeLabel: 'Phiếu bài tập · Tế bào học',
      title: 'PHIẾU BÀI TẬP SINH HỌC 10: CHU KÌ TẾ BÀO, NGUYÊN PHÂN & GIẢM PHÂN',
      subtitle: 'Môn Sinh học lớp 10  |  So sánh diễn biến nhiễm sắc thể và bài tập tính số tế bào con, giao tử.',
      blocks: [
        { kind: 'heading', text: 'Bài 1. Bảng so sánh Nguyên phân và Giảm phân (điền thông tin còn thiếu)' },
        {
          kind: 'table',
          headers: ['Tiêu chí so sánh', 'Nguyên phân', 'Giảm phân'],
          colWeights: [2.4, 2.8, 2.8],
          rows: [
            ['Loại tế bào thực hiện', 'Tế bào sinh dưỡng & sinh dục sơ khai', '______________________________'],
            ['Số lần nhân đôi DNA / Số lần phân bào', '1 lần nhân đôi / 1 lần phân bào', '______________________________'],
            ['Hiện tượng trao đổi chéo NST', 'Không xảy ra', '______________________________'],
            ['Kết quả từ 1 tế bào mẹ (2n)', '2 tế bào con có bộ NST (2n)', '______________________________'],
          ],
        },
        { kind: 'heading', text: 'Bài 2. Bài tập định lượng về bộ nhiễm sắc thể' },
        {
          kind: 'lines',
          lines: [
            'Ở ruồi giấm (Drosophila melanogaster) có bộ nhiễm sắc thể lưỡng bội 2n = 8.',
            'a) Một tế bào sinh dưỡng của ruồi giấm nguyên phân liên tiếp 4 lần. Tính số tế bào con tạo thành và tổng số NST đơn có trong tất cả các tế bào con.',
            'b) Ở kì giữa của nguyên phân, trong một tế bào ruồi giấm có bao nhiêu NST kép và bao nhiêu chromatid?',
            'c) Nếu 5 tế bào sinh tinh của ruồi giấm tiến hành giảm phân bình thường thì tạo ra bao nhiêu tinh trùng? Mỗi tinh trùng chứa bao nhiêu NST?',
          ],
        },
        { kind: 'pageBreak' },
        { kind: 'heading', text: 'ĐÁP ÁN & HƯỚNG DẪN GIẢI' },
        {
          kind: 'lines',
          lines: [
            'Bài 1:',
            '  • Loại tế bào giảm phân: Tế bào sinh dục chín (tế bào sinh giao tử).',
            '  • Số lần nhân đôi / phân bào: 1 lần nhân đôi DNA / 2 lần phân bào liên tiếp (Giảm phân I và II).',
            '  • Trao đổi chéo: Có thể xảy ra giữa 2 chromatid khác nguồn trong cặp tương đồng ở kì đầu I.',
            '  • Kết quả: 4 tế bào con đơn bội (n) có vật chất di truyền đa dạng.',
            'Bài 2 (2n = 8):',
            '  a) Số tế bào con sau 4 lần nguyên phân: 2⁴ = 16 tế bào. Tổng số NST trong các tế bào con: 16 × 8 = 128 NST.',
            '  b) Ở kì giữa nguyên phân: có 2n = 8 NST kép và 4n = 16 chromatid.',
            '  c) 1 tế bào sinh tinh giảm phân tạo 4 tinh trùng → 5 tế bào sinh tinh tạo 5 × 4 = 20 tinh trùng; mỗi tinh trùng có n = 4 NST.',
          ],
        },
      ],
    });
  }

  // 7. Quá trình sinh học: Quang hợp C3/C4/CAM & Hô hấp thực vật (Sinh 11)
  if (sampleId === 'sample-bio-08-process') {
    return buildStructuredPayload(
      {
        subjectLabel: 'Sinh học',
        gradeLabel: 'Lớp 11',
        docTypeLabel: 'Phiếu học tập · Quá trình sinh học',
        title: 'PHIẾU QUÁ TRÌNH SINH HỌC 11: QUANG HỢP (C₃, C₄, CAM) & HÔ HẤP',
        subtitle: 'Môn Sinh học lớp 11  |  Phân tích pha sáng – pha tối và sự thích nghi của các nhóm thực vật.',
        blocks: [
          { kind: 'heading', text: 'Phần 1. Hoàn thiện sơ đồ mối quan hệ giữa Pha sáng và Pha tối quang hợp' },
          {
            kind: 'table',
            headers: ['Đặc điểm', 'Pha sáng', 'Pha tối (Chu trình Calvin)'],
            colWeights: [2.2, 2.9, 2.9],
            rows: [
              ['Vị trí diễn ra trong lục lạp', 'Màng thylakoid', 'Chất nền (stroma)'],
              ['Nguyên liệu chính', 'H₂O, ánh sáng, ADP, NADP⁺', 'CO₂, ATP, NADPH'],
              ['Sản phẩm tạo thành', 'O₂, ATP, NADPH', 'Đường (C₆H₁₂O₆), ADP, NADP⁺'],
            ],
          },
          { kind: 'heading', text: 'Phần 2. Câu hỏi phân tích quá trình sinh học' },
          {
            kind: 'lines',
            lines: [
              '1. Phân biệt thời điểm mở khí khổng và cố định CO₂ sơ cấp giữa thực vật C₃ (lúa), C₄ (ngô, mía) và CAM (dứa, xương rồng).',
              '2. Tại sao thực vật C₄ thường có năng suất sinh học cao hơn thực vật C₃ ở vùng nhiệt đới ánh sáng mạnh và nhiệt độ cao?',
              '3. Trình bày vai trò của bảo quản nông sản ở nhiệt độ thấp và nồng độ CO₂ hợp lí đối với cường độ hô hấp của hạt, quả.',
            ],
          },
          { kind: 'spacer', height: 64 },
          { kind: 'pageBreak' },
          { kind: 'heading', text: 'GỢI Ý TRẢ LỜI CHUYÊN MÔN' },
          {
            kind: 'lines',
            lines: [
              '1. So sánh C₃ – C₄ – CAM:',
              '  • C₃: Khí khổng mở ban ngày, cố định CO₂ một lần qua chu trình Calvin (sản phẩm đầu tiên 3-PGA có 3C).',
              '  • C₄: Khí khổng mở ban ngày, cố định CO₂ tách biệt về không gian (tế bào thịt lá tạo OAA 4C → tế bào bao bó mạch chạy Calvin).',
              '  • CAM: Khí khổng mở ban đêm để cố định CO₂ thành acid malic tích trữ trong không bào; ban ngày đóng khí khổng giảm mất nước và chạy chu trình Calvin.',
              '2. Thực vật C₄ không có hô hấp sáng (hoặc rất yếu), điểm bão hòa ánh sáng cao, nhu cầu nước thấp hơn nên hiệu suất quang hợp cao hơn ở vùng nóng nắng.',
              '3. Hạ nhiệt độ hợp lí (không gây đóng băng) và tăng nhẹ CO₂ / giảm O₂ làm giảm cường độ hô hấp hiếu khí, hạn chế tiêu hao chất hữu cơ dự trữ và kéo dài thời gian bảo quản.',
            ],
          },
        ],
      },
      (pageId) => [
        makeFormulaObj(
          'bio8-f1',
          '\\text{C}_6\\text{H}_{12}\\text{O}_6 + 6\\text{O}_2 \\longrightarrow 6\\text{CO}_2 + 6\\text{H}_2\\text{O} + Q\\,(\\text{ATP + nhiệt})',
          pageId,
          56,
          628,
          '#087F70',
          15
        ),
      ]
    );
  }

  // 8. Sơ đồ lai & Quy luật di truyền (Sinh 12)
  if (sampleId === 'sample-bio-09-cross-diagram') {
    return buildStructuredPayload({
      subjectLabel: 'Sinh học',
      gradeLabel: 'Lớp 12',
      docTypeLabel: 'Phiếu bài tập · Sơ đồ lai',
      title: 'BÀI TẬP SƠ ĐỒ LAI SINH HỌC 12: PHÂN LI ĐỘC LẬP & LIÊN KẾT GEN',
      subtitle: 'Môn Sinh học lớp 12  |  Lập sơ đồ lai, biện luận quy luật di truyền và kiểm chứng tỉ lệ kiểu hình.',
      blocks: [
        { kind: 'heading', text: 'Bài 1. Quy luật phân li độc lập của Mendel' },
        {
          kind: 'lines',
          lines: [
            'Ở đậu Hà Lan, alen A quy định hạt vàng trội hoàn toàn so với alen a quy định hạt xanh; alen B quy định hạt trơn trội hoàn toàn so với alen b quy định hạt nhăn. Hai cặp gen nằm trên hai cặp NST thường khác nhau.',
            'a) Viết sơ đồ lai từ P thuần chủng hạt vàng, trơn (AABB) × hạt xanh, nhăn (aabb) đến F₂.',
            'b) Xác định tỉ lệ kiểu gen đồng hợp hai cặp gen và tỉ lệ kiểu hình hạt vàng, nhăn ở F₂.',
          ],
        },
        { kind: 'heading', text: 'Bài 2. Phân biệt phân li độc lập và liên kết gen hoàn toàn' },
        {
          kind: 'lines',
          lines: [
            'Thực hiện phép lai phân tích cơ thể dị hợp hai cặp gen (Aa, Bb) với cơ thể đồng hợp lặn (aa, bb):',
            '  • Trường hợp 1: Đời con Fa thu được tỉ lệ 1 : 1 : 1 : 1.',
            '  • Trường hợp 2: Đời con Fa thu được tỉ lệ 1 : 1.',
            'Hãy biện luận quy luật di truyền chi phối và viết sơ đồ lai minh họa cho từng trường hợp.',
          ],
        },
        { kind: 'writingLines', title: 'Khung viết sơ đồ lai của học sinh:', count: 6 },
        { kind: 'pageBreak' },
        { kind: 'heading', text: 'ĐÁP ÁN & SƠ ĐỒ LAI MẪU' },
        {
          kind: 'lines',
          lines: [
            'Bài 1:',
            '  • P: AABB (vàng, trơn) × aabb (xanh, nhăn) → Gp: AB ; ab → F₁: 100% AaBb (vàng, trơn).',
            '  • F₁ × F₁: AaBb × AaBb → F₂ có 16 tổ hợp, 9 kiểu gen, 4 kiểu hình tỉ lệ 9 vàng-trơn : 3 vàng-nhăn : 3 xanh-trơn : 1 xanh-nhăn.',
            '  • Tỉ lệ đồng hợp 2 cặp gen (AABB, AAbb, aaBB, aabb) = 4/16 = 1/4 = 25%.',
            '  • Tỉ lệ kiểu hình hạt vàng, nhăn (A-bb) = 3/16 = 18,75%.',
            'Bài 2:',
            '  • Trường hợp 1 (Fa 1:1:1:1): Cơ thể dị hợp cho 4 loại giao tử bằng nhau (AB = Ab = aB = ab = 1/4) → hai gen phân li độc lập.',
            '  • Trường hợp 2 (Fa 1:1): Cơ thể dị hợp chỉ cho 2 loại giao tử bằng nhau → hai gen liên kết hoàn toàn trên 1 NST (kiểu gen AB/ab cho 1AB:1ab hoặc Ab/aB cho 1Ab:1aB).',
          ],
        },
      ],
    });
  }

  // 9. Hệ sinh thái, chuỗi & lưới thức ăn (Sinh 12) + bio-food-web
  if (sampleId === 'sample-bio-10-ecosystem') {
    return buildStructuredPayload(
      {
        subjectLabel: 'Sinh học',
        gradeLabel: 'Lớp 12',
        docTypeLabel: 'Phiếu học tập · Sinh thái học',
        title: 'PHIẾU BÀI TẬP SINH HỌC 12: HỆ SINH THÁI, LƯỚI THỨC ĂN & DÒNG NĂNG LƯỢNG',
        subtitle: 'Môn Sinh học lớp 12  |  Kèm sơ đồ lưới thức ăn hệ sinh thái đồng cỏ vector chỉnh sửa được.',
        blocks: [
          { kind: 'heading', text: 'Quan sát sơ đồ lưới thức ăn hệ sinh thái đồng cỏ sau:' },
          { kind: 'spacer', height: 196 },
          { kind: 'heading', text: 'Câu hỏi phân tích lưới thức ăn và hiệu suất sinh thái' },
          {
            kind: 'lines',
            lines: [
              '1. Liệt kê tất cả các chuỗi thức ăn có trong lưới thức ăn trên. Chuỗi dài nhất có bao nhiêu mắt xích?',
              '2. Xác định sinh vật sản xuất và bậc dinh dưỡng của Rắn trong các chuỗi thức ăn khác nhau.',
              '3. Nếu quần thể Châu chấu bị suy giảm đột ngột do sử dụng thuốc trừ sâu quá mức, những loài nào trong lưới thức ăn chịu ảnh hưởng trực tiếp? Giải thích.',
              '4. (Số liệu giả định) Biết năng lượng tích lũy ở sinh vật sản xuất (Cỏ) là 1 000 000 kcal và hiệu suất sinh thái giữa hai bậc dinh dưỡng kế tiếp đều bằng 10%. Tính năng lượng tích lũy ở bậc dinh dưỡng cấp 3 (Rắn trong chuỗi Cỏ → Thỏ → Rắn).',
            ],
          },
          { kind: 'pageBreak' },
          { kind: 'heading', text: 'ĐÁP ÁN CHI TIẾT' },
          {
            kind: 'lines',
            lines: [
              '1. Các chuỗi thức ăn chính (4 chuỗi):',
              '   (1) Cỏ → Châu chấu → Ếch → Rắn → Đại bàng (5 mắt xích — dài nhất)',
              '   (2) Cỏ → Châu chấu → Chim ăn sâu → Đại bàng (4 mắt xích)',
              '   (3) Cỏ → Thỏ → Rắn → Đại bàng (4 mắt xích)',
              '   (4) Cỏ → Thỏ → Đại bàng (3 mắt xích)',
              '2. Sinh vật sản xuất: Cỏ (bậc dinh dưỡng cấp 1). Rắn vừa thuộc bậc dinh dưỡng cấp 3 (chuỗi Cỏ → Thỏ → Rắn) vừa thuộc bậc dinh dưỡng cấp 4 (chuỗi Cỏ → Châu chấu → Ếch → Rắn).',
              '3. Khi Châu chấu giảm mạnh: Ếch và Chim ăn sâu thiếu nguồn thức ăn trực tiếp nên giảm số lượng; Cỏ giảm áp lực bị ăn; Đại bàng và Rắn tăng áp lực săn bắt lên Thỏ.',
              '4. Bậc 1 (Cỏ) = 1 000 000 kcal → Bậc 2 (Thỏ) = 10% × 1 000 000 = 100 000 kcal → Bậc 3 (Rắn) = 10% × 100 000 = 10 000 kcal.',
            ],
          },
        ],
      },
      (pageId) =>
        makeDiagramObj('bio10-web', 'bio-food-web', 'biology', pageId, 95, 178, 405, 192, 2)
    );
  }

  // 10. Bảng số liệu & Đồ thị cường độ quang hợp (Sinh 11) + bio-photosynthesis-graph
  if (sampleId === 'sample-bio-11-data-graph') {
    return buildStructuredPayload(
      {
        subjectLabel: 'Sinh học',
        gradeLabel: 'Lớp 11',
        docTypeLabel: 'Phiếu bài tập · Số liệu & Đồ thị',
        title: 'PHÂN TÍCH BẢNG SỐ LIỆU & ĐỒ THỊ QUANG HỢP THEO ÁNH SÁNG (SINH 11)',
        subtitle: 'Môn Sinh học lớp 11  |  Số liệu thực hành giả định phục vụ rèn kỹ năng đọc đồ thị sinh học.',
        blocks: [
          {
            kind: 'callout',
            title: 'Lưu ý số liệu minh họa',
            text: 'Bảng số liệu và đồ thị dưới đây là Số liệu giả định (mô phỏng quy luật điểm bù và điểm bão hòa ánh sáng giữa cây ưa sáng và cây ưa bóng trong chương trình Sinh học 11).',
            tone: 'amber',
          },
          {
            kind: 'table',
            headers: ['Cường độ ánh sáng (klux)', '0', '2', '5', '15', '30', '45'],
            colWeights: [2.6, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9],
            rows: [
              ['Cường độ QH thực – Cây ưa sáng (mg CO₂/dm²·h)', '-2,0', '0,0', '6,5', '16,0', '22,0', '22,0'],
              ['Cường độ QH thực – Cây ưa bóng (mg CO₂/dm²·h)', '-0,8', '2,5', '6,0', '9,0', '9,0', '8,5'],
            ],
          },
          { kind: 'spacer', height: 185 },
          { kind: 'heading', text: 'Câu hỏi khai thác bảng số liệu và đồ thị' },
          {
            kind: 'lines',
            lines: [
              '1. Tại cường độ ánh sáng = 0 klux, vì sao giá trị quang hợp thực của cả hai loài đều mang dấu âm? Giá trị đó phản ánh đại lượng sinh lí nào?',
              '2. Xác định điểm bù ánh sáng của cây ưa sáng và điểm bão hòa ánh sáng của từng loài từ bảng số liệu giả định trên.',
              '3. Từ kết quả phân tích, hãy đề xuất ứng dụng thực tiễn trong trồng xen canh cây trồng nông nghiệp.',
            ],
          },
          { kind: 'pageBreak' },
          { kind: 'heading', text: 'ĐÁP ÁN PHÂN TÍCH ĐỒ THỊ' },
          {
            kind: 'lines',
            lines: [
              '1. Khi ánh sáng = 0 klux, cây không quang hợp mà chỉ hô hấp thải CO₂ nên trao đổi CO₂ thực có giá trị âm; độ lớn (2,0 và 0,8 mg CO₂/dm²·h) chính là cường độ hô hấp trong tối.',
              '2. Theo bảng số liệu giả định:',
              '   • Điểm bù ánh sáng (QH thực = 0): Cây ưa sáng là 2 klux; cây ưa bóng thấp hơn (< 2 klux, khoảng 0,5–0,8 klux).',
              '   • Điểm bão hòa ánh sáng (cường độ QH đạt cực đại ổn định): Cây ưa sáng là 30 klux (đạt 22,0); cây ưa bóng là 15 klux (đạt 9,0).',
              '3. Ứng dụng: Trồng xen cây ưa bóng (lá lốt, gừng, cà phê tán thấp) dưới tán cây ưa sáng (cây ăn quả, cây lâm nghiệp) để tận dụng hiệu quả nguồn ánh sáng và đất canh tác.',
            ],
          },
        ],
      },
      (pageId) =>
        makeDiagramObj('bio11-graph', 'bio-photosynthesis-graph', 'biology', pageId, 118, 340, 355, 180, 2)
    );
  }

  // 11. Báo cáo thực hành thí nghiệm: Co và phản co nguyên sinh (Sinh 10)
  if (sampleId === 'sample-bio-12-lab-report') {
    const grading = buildRubricSession('Báo cáo thực hành Sinh học 10 – Co nguyên sinh', 'Sinh học', '10A2', [
      { id: 'bl-1', label: 'Tiêu bản hiển vi & mô tả hiện tượng', maxScore: 3.5 },
      { id: 'bl-2', label: 'Giải thích cơ chế thẩm thấu chính xác', maxScore: 4.0 },
      { id: 'bl-3', label: 'Trả lời câu hỏi ứng dụng thực tiễn', maxScore: 2.5 },
    ]);
    return buildStructuredPayload(
      {
        subjectLabel: 'Sinh học',
        gradeLabel: 'Lớp 10',
        docTypeLabel: 'Phiếu thí nghiệm · Thực hành',
        title: 'PHIẾU BÁO CÁO THỰC HÀNH SINH 10: CO VÀ PHẢN CO NGUYÊN SINH',
        subtitle: 'Môn Sinh học lớp 10  |  Quan sát tế bào biểu bì vảy hành tím dưới kính hiển vi quang học.',
        blocks: [
          { kind: 'heading', text: '1. Mục tiêu, dụng cụ và mẫu vật' },
          {
            kind: 'lines',
            lines: [
              '• Mục tiêu: Quan sát hiện tượng co nguyên sinh và phản co nguyên sinh ở tế bào thực vật, từ đó hiểu cơ chế vận chuyển nước qua màng sinh chất.',
              '• Mẫu vật & hóa chất: Vảy củ hành tím tươi, nước cất, dung dịch muối ăn (NaCl) hoặc đường sucrose 10%.',
              '• Dụng cụ: Kính hiển vi quang học, lam kính, lamen, kim mũi mác, ống nhỏ giọt, giấy thấm.',
            ],
          },
          { kind: 'heading', text: '2. Các bước tiến hành & Bảng ghi nhận kết quả quan sát' },
          {
            kind: 'table',
            headers: ['Bước thí nghiệm', 'Môi trường nhỏ vào tiêu bản', 'Hiện tượng quan sát được (học sinh điền)'],
            colWeights: [1.8, 2.4, 3.8],
            rows: [
              ['Bước 1: Tiêu bản đối chứng', '1 giọt nước cất', '__________________________________________'],
              ['Bước 2: Gây co nguyên sinh', 'Dung dịch NaCl 10% (rút nước cất bằng giấy thấm)', '__________________________________________'],
              ['Bước 3: Gây phản co nguyên sinh', 'Nhỏ lại nước cất (rút dung dịch muối)', '__________________________________________'],
            ],
          },
          { kind: 'heading', text: '3. Câu hỏi thảo luận báo cáo thực hành' },
          {
            kind: 'lines',
            lines: [
              'a) Vì sao nên chọn lớp biểu bì vảy hành tím thay vì biểu bì không màu để quan sát?',
              'b) Giải thích nguyên nhân gây ra hiện tượng co nguyên sinh ở Bước 2 và phản co nguyên sinh ở Bước 3.',
              'c) Liên hệ thực tiễn: Tại sao khi bón phân đạm/muối khoáng quá liều cho cây trồng, cây lại bị héo lá?',
            ],
          },
          { kind: 'pageBreak' },
          { kind: 'heading', text: 'HƯỚNG DẪN ĐÁNH GIÁ BÁO CÁO THỰC HÀNH (10,0 ĐIỂM)' },
          {
            kind: 'lines',
            lines: [
              '• Bước 1 (Nước cất): Tế bào trương nước, không bào màu tím lớn ép sát thành tế bào.',
              '• Bước 2 (NaCl 10% — ưu trương): Nước thẩm thấu từ tế bào ra ngoài → khối nguyên sinh chất co lại, tách rời khỏi thành tế bào (co nguyên sinh), màu tím đậm hơn và thu gọn.',
              '• Bước 3 (Nước cất — nhược trương): Nước thẩm thấu trở lại vào tế bào → nguyên sinh chất giãn ra áp sát thành tế bào như ban đầu (phản co nguyên sinh — chứng tỏ tế bào còn sống).',
              '• Trả lời câu hỏi:',
              '  a) Biểu bì hành tím có sắc tố anthocyanin màu tím trong không bào nên dễ phân biệt rõ ranh giới khối nguyên sinh chất với thành tế bào mà không cần nhuộm.',
              '  c) Bón phân quá đặc làm dung dịch đất trở thành môi trường ưu trương → rễ không hút được nước thậm chí mất nước → tế bào mất sức trương gây héo cây.',
            ],
          },
        ],
      },
      () => [],
      grading
    );
  }

  return null;
}
