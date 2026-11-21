import type { GradingSession, StudioObject, SubjectCategory } from '../types/studio';
import { createStructuredSamplePdf, type StructuredSamplePdfSpec } from './pdfSampleLayout';
import { getDiagramByKey } from '../engines/geometry/diagramLibrary';
import { createDefaultGradingSession } from '../engines/grading/gradingEngine';

export interface SocialEngSamplePayload {
  pdfBytes: Uint8Array;
  initialObjects: (firstPageId: string) => StudioObject[];
  grading?: GradingSession;
}

function makeDiagramObject(
  id: string,
  diagramKey: string,
  subject: SubjectCategory,
  pageId: string,
  x: number,
  y: number,
  width: number,
  height: number,
  zIndex = 2
): StudioObject[] {
  const diag = getDiagramByKey(diagramKey);
  if (!diag) return [];
  return [
    {
      id,
      type: 'diagram',
      pageId,
      x,
      y,
      width,
      height,
      rotation: 0,
      zIndex,
      opacity: 1,
      title: diag.title,
      diagramKey: diag.key,
      subject,
      svgMarkup: diag.render({ strokeColor: '#164E63', strokeWidth: 1.6, labels: [] }),
      strokeColor: '#164E63',
      strokeWidth: 1.6,
      strokeStyle: 'solid',
      labels: [],
      sourceKind: 'library',
    },
  ];
}

function buildRubricSession(
  title: string,
  subject: string,
  className: string,
  criteria: Array<{ id: string; label: string; maxScore: number }>
): GradingSession {
  const session = createDefaultGradingSession(title, subject);
  session.className = className;
  session.mode = 'essay';
  session.scaleMax = criteria.reduce((sum, c) => sum + c.maxScore, 0);
  session.questions = criteria.map((c) => ({
    id: c.id,
    label: c.label,
    maxScore: c.maxScore,
    earnedScore: null,
    subParts: [],
  }));
  return session;
}

function buildMcqSession(
  title: string,
  subject: string,
  className: string,
  items: Array<{ number: number; kind: 'abcd' | 'tf4' | 'short'; answerKey: string; maxScore: number }>
): GradingSession {
  const session = createDefaultGradingSession(title, subject);
  session.className = className;
  session.mode = 'mcq';
  session.scaleMax = Math.round(items.reduce((s, i) => s + i.maxScore, 0) * 100) / 100;
  session.mcqItems = items.map((it, idx) => ({
    id: `m-${idx + 1}`,
    number: it.number,
    kind: it.kind,
    answerKey: it.answerKey,
    studentAnswer: '',
    maxScore: it.maxScore,
  }));
  return session;
}

async function buildFromSpec(
  spec: StructuredSamplePdfSpec,
  initialObjects: (firstPageId: string) => StudioObject[] = () => [],
  grading?: GradingSession
): Promise<SocialEngSamplePayload> {
  const pdfBytes = await createStructuredSamplePdf(spec);
  return { pdfBytes, initialObjects, grading };
}

export async function generateSocialEngSampleDocument(
  sampleId: string
): Promise<SocialEngSamplePayload | null> {
  // =========================================================================
  // ĐỊA LÍ (8 DẠNG BÀI)
  // =========================================================================

  if (sampleId === 'sample-geo-01-mcq') {
    const grading = buildMcqSession(
      'Phiếu trắc nghiệm Địa lí 10',
      'Địa lí',
      '10A1',
      [
        { number: 1, kind: 'abcd', answerKey: 'A', maxScore: 1 },
        { number: 2, kind: 'abcd', answerKey: 'C', maxScore: 1 },
        { number: 3, kind: 'abcd', answerKey: 'B', maxScore: 1 },
        { number: 4, kind: 'abcd', answerKey: 'D', maxScore: 1 },
        { number: 5, kind: 'abcd', answerKey: 'B', maxScore: 1 },
        { number: 6, kind: 'abcd', answerKey: 'A', maxScore: 1 },
        { number: 7, kind: 'abcd', answerKey: 'C', maxScore: 1 },
        { number: 8, kind: 'abcd', answerKey: 'D', maxScore: 1 },
        { number: 9, kind: 'abcd', answerKey: 'A', maxScore: 1 },
        { number: 10, kind: 'abcd', answerKey: 'B', maxScore: 1 },
      ]
    );
    return buildFromSpec(
      {
        subjectLabel: 'Địa lí',
        gradeLabel: 'Lớp 10',
        docTypeLabel: 'Phiếu bài tập · Trắc nghiệm',
        title: 'PHIẾU TRẮC NGHIỆM KIẾN THỨC ĐỊA LÍ ĐẠI CƯƠNG',
        subtitle: 'Chủ đề: Trái Đất, Khí quyển, Thủy quyển và Địa lí dân cư  |  Thời gian: 25 phút  |  Thang điểm: 10',
        blocks: [
          { kind: 'heading', text: 'I. CÂU HỎI TRẮC NGHIỆM NHIỀU LỰA CHỌN (10 câu × 1,0 điểm)' },
          {
            kind: 'lines',
            lines: [
              'Câu 1 (Nhận biết). Bề mặt Trái Đất được chia thành bao nhiêu múi giờ chính?',
              '   A. 24 múi giờ     B. 12 múi giờ     C. 36 múi giờ     D. 18 múi giờ',
              'Câu 2 (Nhận biết). Tầng khí quyển tập trung khoảng 80% khối lượng không khí và nơi diễn ra các hiện tượng thời tiết là:',
              '   A. Tầng bình lưu     B. Tầng giữa     C. Tầng đối lưu     D. Tầng nhiệt',
              'Câu 3 (Nhận biết). Nhân tố nào đóng vai trò chủ yếu tạo nên sóng biển thông thường?',
              '   A. Thủy triều     B. Gió     C. Động đất ngầm     D. Dòng biển',
              'Câu 4 (Thông hiểu). Ở bán cầu Bắc, dưới tác động của lực Cô-ri-ô-lít, vật chuyển động theo hướng kinh tuyến bị lệch về phía:',
              '   A. Bên trái     B. Hướng Tây     C. Hướng Nam     D. Bên phải theo hướng chuyển động',
              'Câu 5 (Thông hiểu). Khu vực nào trên Trái Đất thường có lượng mưa trung bình năm lớn nhất?',
              '   A. Vùng chí tuyến     B. Vùng xích đạo     C. Vùng cực     D. Vùng cận cực',
              'Câu 6 (Thông hiểu). Cơ cấu dân số theo tuổi và giới tính thuộc nhóm cơ cấu dân số nào?',
              '   A. Cơ cấu sinh học     B. Cơ cấu xã hội     C. Cơ cấu kinh tế     D. Cơ cấu lãnh thổ',
              'Câu 7 (Thông hiểu). Hiện tượng thủy triều lớn nhất (triều cường) xảy ra khi Mặt Trăng, Trái Đất và Mặt Trời ở vị trí:',
              '   A. Vuông góc     B. Tạo góc 45°     C. Thẳng hàng     D. Tạo góc 60°',
              'Câu 8 (Vận dụng). Khi giờ GMT (múi giờ 0) là 12 giờ cùng ngày, giờ tại Hà Nội (múi giờ +7) là:',
              '   A. 5 giờ     B. 17 giờ     C. 18 giờ     D. 19 giờ',
              'Câu 9 (Vận dụng). Độ mặn trung bình của nước biển và đại dương đạt giá trị cao nhất ở vĩ độ nào sau đây?',
              '   A. Vùng chí tuyến     B. Vùng xích đạo     C. Vùng ôn đới     D. Vùng cực',
              'Câu 10 (Vận dụng). Gia tăng dân số thực tế của một quốc gia được xác định bằng tổng của:',
              '   A. Tỉ suất sinh thô và tỉ suất tử thô          B. Gia tăng tự nhiên và gia tăng cơ học',
              '   C. Tỉ suất nhập cư và tỉ suất sinh thô        D. Mật độ dân số và tỉ lệ dân thành thị',
            ],
          },
          { kind: 'pageBreak' },
          { kind: 'heading', text: 'II. ĐÁP ÁN VÀ GIẢI THÍCH NGẮN DÀNH CHO GIÁO VIÊN' },
          {
            kind: 'table',
            headers: ['Câu', 'Đáp án', 'Mức độ', 'Ghi chú kiến thức trọng tâm'],
            colWeights: [1, 1.1, 1.5, 5.4],
            rows: [
              ['1', 'A', 'Nhận biết', 'Trái Đất tự quay 360° trong 24 giờ nên chia thành 24 múi giờ, mỗi múi rộng 15° kinh tuyến.'],
              ['2', 'C', 'Nhận biết', 'Tầng đối lưu nằm sát mặt đất, tập trung hơi nước, mây, mưa và các hiện tượng thời tiết.'],
              ['3', 'B', 'Nhận biết', 'Gió truyền động năng cho lớp nước mặt, là nguyên nhân chủ yếu sinh ra sóng biển.'],
              ['4', 'D', 'Thông hiểu', 'Theo lực Cô-ri-ô-lít: bán cầu Bắc lệch phải, bán cầu Nam lệch trái theo hướng chuyển động.'],
              ['5', 'B', 'Thông hiểu', 'Vùng xích đạo có áp thấp thường xuyên, nhiệt độ cao, bốc hơi mạnh nên mưa rất nhiều.'],
              ['6', 'A', 'Thông hiểu', 'Cơ cấu sinh học gồm cơ cấu theo giới tính và cơ cấu theo nhóm tuổi.'],
              ['7', 'C', 'Thông hiểu', 'Khi Mặt Trăng – Trái Đất – Mặt Trời thẳng hàng (ngày trăng tròn, không trăng), lực hút cộng hưởng gây triều cường.'],
              ['8', 'D', 'Vận dụng', 'Hà Nội ở múi giờ +7 (đông hơn GMT): 12 + 7 = 19 giờ cùng ngày.'],
              ['9', 'A', 'Vận dụng', 'Vùng chí tuyến ít mưa, nhiệt độ cao, độ bốc hơi lớn nên độ mặn trung bình cao nhất (~36,8‰).'],
              ['10', 'B', 'Vận dụng', 'Gia tăng dân số thực tế = Tỉ suất gia tăng tự nhiên + Tỉ suất gia tăng cơ học (xuất/nhập cư).'],
            ],
          },
          {
            kind: 'callout',
            title: 'Gợi ý sử dụng trong PDF EDU STUDIO',
            text: 'Giáo viên có thể dùng tab Chấm bài -> Bảng chấm điểm (chế độ Trắc nghiệm) để nhập đáp án bài làm học sinh và tự động tính tổng điểm.',
            tone: 'teal',
          },
        ],
      },
      () => [],
      grading
    );
  }

  if (sampleId === 'sample-geo-02-tf-data') {
    const grading = buildMcqSession(
      'Bài tập Đúng/Sai dựa trên dữ liệu — Địa lí 12',
      'Địa lí',
      '12A1',
      [
        { number: 1, kind: 'tf4', answerKey: 'Đ-Đ-S-Đ', maxScore: 1 },
        { number: 2, kind: 'tf4', answerKey: 'Đ-S-Đ-Đ', maxScore: 1 },
        { number: 3, kind: 'tf4', answerKey: 'S-Đ-Đ-S', maxScore: 1 },
      ]
    );
    return buildFromSpec(
      {
        subjectLabel: 'Địa lí',
        gradeLabel: 'Lớp 12',
        docTypeLabel: 'Phiếu bài tập · Đúng/Sai 4 ý',
        title: 'BÀI TẬP ĐÚNG / SAI DỰA TRÊN DỮ LIỆU ĐỊA LÍ (THPT 2025)',
        subtitle: 'Chủ đề: Khí hậu nhiệt đới ẩm gió mùa và Chuyển dịch cơ cấu kinh tế  |  Quy tắc: 0,1 – 0,25 – 0,5 – 1,0 điểm/câu',
        blocks: [
          {
            kind: 'callout',
            title: 'Lưu ý minh bạch về nguồn dữ liệu thực hành',
            text: 'Các bảng số liệu trạm khí tượng và khu vực kinh tế trong phiếu này là SỐ LIỆU GIẢ ĐỊNH được biên soạn chuẩn tỉ lệ để rèn kỹ năng đọc dữ liệu địa lí, không thay thế Niên giám Thống kê chính thức.',
            tone: 'amber',
          },
          { kind: 'heading', text: 'Câu 1. Cho bảng số liệu nhiệt độ trung bình của hai trạm khí tượng giả định (°C):' },
          {
            kind: 'table',
            headers: ['Trạm (Số liệu giả định)', 'Tháng 1', 'Tháng 4', 'Tháng 7', 'Tháng 10', 'TB năm'],
            colWeights: [2.6, 1, 1, 1, 1, 1.2],
            rows: [
              ['Trạm X (vĩ độ cao hơn)', '16,5', '23,8', '29,2', '24,6', '23,5'],
              ['Trạm Y (vĩ độ thấp hơn)', '25,8', '28,9', '27,6', '27,1', '27,3'],
            ],
          },
          {
            kind: 'lines',
            lines: [
              '   a) Biên độ nhiệt năm của Trạm X lớn hơn Trạm Y.                               [ Đ / S ]',
              '   b) Trạm Y có nhiệt độ trung bình năm cao hơn và ổn định hơn Trạm X.             [ Đ / S ]',
              '   c) Tháng có nhiệt độ thấp nhất ở Trạm X cao hơn 20°C.                           [ Đ / S ]',
              '   d) Sự khác biệt nhiệt độ tháng 1 giữa hai trạm phản ánh ảnh hưởng của gió mùa Đông Bắc và vĩ độ. [ Đ / S ]',
            ],
          },
          { kind: 'heading', text: 'Câu 2. Cho bảng cơ cấu GDP theo khu vực kinh tế của Vùng M (Số liệu giả định, %):' },
          {
            kind: 'table',
            headers: ['Khu vực kinh tế (Số liệu giả định)', 'Năm 2015', 'Năm 2020', 'Năm 2024'],
            colWeights: [3.4, 1.2, 1.2, 1.2],
            rows: [
              ['Nông – Lâm – Thủy sản', '21,0', '16,5', '13,2'],
              ['Công nghiệp – Xây dựng', '35,0', '37,5', '39,3'],
              ['Dịch vụ', '44,0', '46,0', '47,5'],
            ],
          },
          {
            kind: 'lines',
            lines: [
              '   a) Tỉ trọng khu vực Nông – Lâm – Thủy sản giảm liên tục giai đoạn 2015–2024.    [ Đ / S ]',
              '   b) Năm 2024, Công nghiệp – Xây dựng chiếm tỉ trọng cao nhất trong cơ cấu GDP.  [ Đ / S ]',
              '   c) Khu vực Dịch vụ luôn chiếm tỉ trọng cao nhất trong cả ba năm.                [ Đ / S ]',
              '   d) Xu hướng chuyển dịch trên phù hợp với quá trình công nghiệp hóa, hiện đại hóa. [ Đ / S ]',
            ],
          },
          { kind: 'heading', text: 'Câu 3. Cho thông tin về sử dụng tài nguyên nước và phát triển thủy điện ở miền núi:' },
          {
            kind: 'lines',
            lines: [
              '   a) Sông ngòi miền núi có độ dốc nhỏ nên không thuận lợi xây dựng thủy điện.     [ Đ / S ]',
              '   b) Chế độ nước sông theo mùa làm sản lượng thủy điện biến động giữa mùa lũ và mùa cạn. [ Đ / S ]',
              '   c) Bảo vệ rừng đầu nguồn giúp điều tiết dòng chảy và giảm bồi lắng lòng hồ.     [ Đ / S ]',
              '   d) Phát triển thủy điện không ảnh hưởng gì tới hệ sinh thái hạ lưu sông.        [ Đ / S ]',
            ],
          },
          { kind: 'pageBreak' },
          { kind: 'heading', text: 'HƯỚNG DẪN CHẤM VÀ GIẢI THÍCH (ĐỊA LÍ 12 — ĐÚNG/SAI 4 Ý)' },
          {
            kind: 'table',
            headers: ['Câu', 'Đáp án (a-b-c-d)', 'Giải thích chi tiết dựa trên bảng dữ liệu'],
            colWeights: [0.9, 1.7, 5.4],
            rows: [
              [
                'Câu 1',
                'Đ – Đ – S – Đ',
                'a) Đúng: Biên độ X = 29,2 - 16,5 = 12,7°C > Biên độ Y = 28,9 - 25,8 = 3,1°C. b) Đúng: TB năm Y (27,3°C) > X (23,5°C). c) Sai: Tháng 1 của X là 16,5°C < 20°C. d) Đúng: Vĩ độ cao hơn chịu tác động mạnh của gió mùa Đông Bắc làm hạ nhiệt mùa đông.',
              ],
              [
                'Câu 2',
                'Đ – S – Đ – Đ',
                'a) Đúng: Giảm từ 21,0% xuống 16,5% rồi 13,2%. b) Sai: Dịch vụ cao nhất (47,5% > 39,3%). c) Đúng: 44,0% → 46,0% → 47,5%. d) Đúng: Giảm tỉ trọng nông nghiệp, tăng công nghiệp và dịch vụ.',
              ],
              [
                'Câu 3',
                'S – Đ – Đ – S',
                'a) Sai: Sông miền núi có độ dốc lớn, trữ năng thủy điện dồi dào. b) Đúng: Mùa khô thiếu nước, mùa lũ dồi dào. c) Đúng: Rừng giữ nước, chống xói mòn. d) Sai: Thủy điện tác động đến phù sa, dòng chảy và sinh thái hạ lưu nếu không điều tiết hợp lý.',
              ],
            ],
          },
        ],
      },
      () => [],
      grading
    );
  }

  if (sampleId === 'sample-geo-03-calc') {
    const grading = buildRubricSession('Bài tập tính toán Địa lí 10', 'Địa lí', '10A2', [
      { id: 'geo-c1', label: 'Bài 1 (Mật độ dân số)', maxScore: 2 },
      { id: 'geo-c2', label: 'Bài 2 (Gia tăng tự nhiên)', maxScore: 2 },
      { id: 'geo-c3', label: 'Bài 3 (Năng suất lúa)', maxScore: 2 },
      { id: 'geo-c4', label: 'Bài 4 (Tỉ trọng GDP)', maxScore: 2 },
      { id: 'geo-c5', label: 'Bài 5 (Cán cân XNK)', maxScore: 2 },
    ]);
    return buildFromSpec(
      {
        subjectLabel: 'Địa lí',
        gradeLabel: 'Lớp 10',
        docTypeLabel: 'Phiếu bài tập · Tính toán',
        title: 'BÀI TẬP TÍNH TOÁN ĐỊA LÍ (CÓ CÔNG THỨC & ĐƠN VỊ CHUẨN)',
        subtitle: 'Các số liệu trong đề là số liệu giả định phục vụ thực hành kỹ năng tính toán và quy đổi đơn vị.',
        blocks: [
          { kind: 'heading', text: 'I. HỆ THỐNG BÀI TẬP TÍNH TOÁN (5 bài × 2,0 điểm)' },
          {
            kind: 'lines',
            lines: [
              'Bài 1 (Mật độ dân số): Tỉnh A (số liệu giả định) có diện tích tự nhiên 4.250 km² và dân số trung bình 1.275.000 người. Tính mật độ dân số của tỉnh A (đơn vị: người/km²).',
              '',
              'Bài 2 (Tỉ suất gia tăng dân số tự nhiên): Quốc gia B (số liệu giả định) năm 2024 có tỉ suất sinh thô 16,2‰ và tỉ suất tử thô 6,4‰. Tính tỉ suất gia tăng dân số tự nhiên (đơn vị: %).',
              '',
              'Bài 3 (Năng suất cây trồng): Vùng C (số liệu giả định) gieo trồng 320 nghìn ha lúa và thu hoạch được 1.984 nghìn tấn thóc. Tính năng suất lúa trung bình (đơn vị: tạ/ha).',
              '',
              'Bài 4 (Cơ cấu tỉ trọng): Năm 2024, tổng giá trị sản xuất nông nghiệp vùng D (số liệu giả định) đạt 85.000 tỉ đồng, trong đó trồng trọt đạt 54.400 tỉ đồng. Tính tỉ trọng ngành trồng trọt (%).',
              '',
              'Bài 5 (Cán cân xuất nhập khẩu): Quốc gia E (số liệu giả định) có kim ngạch xuất khẩu 248,5 tỉ USD và nhập khẩu 231,2 tỉ USD. Tính tổng kim ngạch và cán cân xuất nhập khẩu; cho biết xuất siêu hay nhập siêu.',
            ],
          },
          { kind: 'writingLines', title: 'Phần trình bày lời giải của học sinh (ghi rõ công thức, phép tính và đơn vị):', count: 8 },
          { kind: 'pageBreak' },
          { kind: 'heading', text: 'II. ĐÁP ÁN, CÔNG THỨC VÀ QUY ĐỔI ĐƠN VỊ' },
          {
            kind: 'table',
            headers: ['Bài', 'Công thức chuẩn', 'Phép tính & Kết quả'],
            colWeights: [0.9, 2.8, 4.3],
            rows: [
              ['Bài 1', 'Mật độ = Dân số / Diện tích (người/km²)', '1.275.000 / 4.250 = 300 người/km².'],
              ['Bài 2', 'Tg = (S - T) / 10 (%)', '(16,2 - 6,4) / 10 = 9,8 / 10 = 0,98% (hay 9,8‰).'],
              ['Bài 3', 'Năng suất = (Sản lượng × 10) / Diện tích (tạ/ha)', '1 tấn = 10 tạ → (1.984 × 10) / 320 = 62,0 tạ/ha.'],
              ['Bài 4', 'Tỉ trọng = (Thành phần / Tổng) × 100%', '(54.400 / 85.000) × 100% = 64,0%.'],
              ['Bài 5', 'Tổng = XK + NK; Cán cân = XK - NK', 'Tổng = 479,7 tỉ USD; Cán cân = +17,3 tỉ USD → Xuất siêu 17,3 tỉ USD.'],
            ],
          },
          {
            kind: 'callout',
            title: 'Lưu ý chấm bài',
            text: 'Thiếu hoặc sai đơn vị trừ 0,25 điểm/bài (đặc biệt lưu ý quy đổi ‰ sang % ở Bài 2 và tấn sang tạ ở Bài 3).',
            tone: 'teal',
          },
        ],
      },
      () => [],
      grading
    );
  }

  if (sampleId === 'sample-geo-04-map') {
    return buildFromSpec(
      {
        subjectLabel: 'Địa lí',
        gradeLabel: 'Lớp 10',
        docTypeLabel: 'Phiếu thực hành · Bản đồ',
        title: 'PHIẾU THỰC HÀNH ĐỌC VÀ KHAI THÁC BẢN ĐỒ (LƯỢC ĐỒ SƠ PHÁC)',
        subtitle: 'Kỹ năng xác định phương hướng, đọc hệ thống ký hiệu, tính khoảng cách theo tỉ lệ bản đồ.',
        blocks: [
          {
            kind: 'callout',
            title: 'Ghi chú học liệu bản đồ',
            text: 'Hình bên dưới là LƯỢC ĐỒ SƠ PHÁC học tập kỹ năng đọc ký hiệu, phương hướng và tỉ lệ (đối tượng vector có thể di chuyển, phóng to hoặc gắn thêm nhãn trong trình biên tập). Không thay thế bản đồ hành chính chính thức.',
            tone: 'amber',
          },
          { kind: 'spacer', height: 225 },
          { kind: 'heading', text: 'CÂU HỎI THỰC HÀNH KHAI THÁC LƯỢC ĐỒ' },
          {
            kind: 'lines',
            lines: [
              'Câu 1 (Ký hiệu bản đồ): Quan sát bảng Chú giải và cho biết các đối tượng Đỉnh núi, Hệ thống sông, Trung tâm đô thị và Vùng đồng bằng thuộc nhóm phương pháp biểu hiện nào (ký hiệu điểm, đường hay diện tích)?',
              'Câu 2 (Phương hướng): Căn cứ vào mũi tên chỉ hướng Bắc (B), xác định hướng chảy chính của dòng sông trên lược đồ và vị trí tương đối của Cảng biển B so với Đô thị A.',
              'Câu 3 (Tỉ lệ bản đồ): Với tỉ lệ 1 : 1.000.000, nếu khoảng cách đo được trên bản đồ từ Đô thị A đến Cảng biển B là 4,5 cm thì khoảng cách thực tế theo đường chim bay là bao nhiêu km?',
              'Câu 4 (Phân tích phân bố): Nhận xét mối liên hệ giữa vị trí phân bố của Đô thị A, Cảng biển B với địa hình đồng bằng và hệ thống sông.',
            ],
          },
          { kind: 'writingLines', title: 'Ghi chép câu trả lời:', count: 4 },
          { kind: 'pageBreak' },
          { kind: 'heading', text: 'GỢI Ý ĐÁP ÁN THỰC HÀNH ĐỌC BẢN ĐỒ' },
          {
            kind: 'lines',
            lines: [
              '1. Phương pháp biểu hiện:',
              '   - Ký hiệu điểm: Đỉnh núi, Trung tâm đô thị, Cảng biển.',
              '   - Ký hiệu đường: Hệ thống sông.',
              '   - Ký hiệu diện tích (nền chất lượng): Vùng đồng bằng.',
              '2. Phương hướng:',
              '   - Dòng sông chảy chủ yếu theo hướng Tây Bắc → Đông Nam ra phía biển.',
              '   - Cảng biển B nằm ở phía Đông Nam của Đô thị A.',
              '3. Tính khoảng cách thực tế theo tỉ lệ 1 : 1.000.000:',
              '   - 1 cm trên bản đồ ứng với 1.000.000 cm = 10 km ngoài thực tế.',
              '   - Khoảng cách thực tế = 4,5 × 10 = 45 km.',
              '4. Mối liên hệ phân bố:',
              '   - Đô thị A nằm trên vùng đồng bằng bằng phẳng, ven sông thuận lợi cấp nước và giao thông đường thủy; Cảng biển B nằm ở cửa sông ven biển thuận lợi giao thương hàng hải.',
            ],
          },
        ],
      },
      (pageId) =>
        makeDiagramObject('geo4-map', 'geo-map-legend-compass', 'geography', pageId, 76, 178, 442, 240, 2)
    );
  }

  if (sampleId === 'sample-geo-05-chart-analysis') {
    return buildFromSpec(
      {
        subjectLabel: 'Địa lí',
        gradeLabel: 'Lớp 12',
        docTypeLabel: 'Phiếu bài tập · Phân tích biểu đồ',
        title: 'BÀI TẬP PHÂN TÍCH BIỂU ĐỒ SẢN LƯỢNG VÀ BIỂU ĐỒ KHÍ HẬU',
        subtitle: 'Sử dụng số liệu giả định có đầy đủ tên biểu đồ, trục tọa độ, đơn vị, số liệu và chú giải.',
        blocks: [
          { kind: 'heading', text: 'Bài 1. Quan sát Biểu đồ cột sản lượng lương thực Vùng A (2020–2024, số liệu giả định):' },
          { kind: 'spacer', height: 222 },
          {
            kind: 'lines',
            lines: [
              'a) Tính mức tăng tuyệt đối (nghìn tấn) và tốc độ tăng (%) sản lượng lương thực năm 2024 so với năm 2020.',
              'b) Nhận xét xu hướng biến động sản lượng lương thực giai đoạn 2020–2024 và nêu 2 yếu tố có thể góp phần thúc đẩy sản lượng tăng.',
            ],
          },
          { kind: 'heading', text: 'Bài 2. Quan sát Biểu đồ nhiệt độ và lượng mưa trạm mẫu (số liệu giả định) bên trang 2 hoặc chèn từ thanh công cụ Địa lí:' },
          {
            kind: 'lines',
            lines: [
              'a) Xác định tháng có nhiệt độ cao nhất, tháng có nhiệt độ thấp nhất và các tháng có lượng mưa lớn nhất trong năm.',
              'b) Rút ra đặc điểm nổi bật về chế độ nhiệt và chế độ mưa của trạm khí tượng mẫu này.',
            ],
          },
          { kind: 'writingLines', title: 'Nhận xét của học sinh:', count: 5 },
          { kind: 'pageBreak' },
          { kind: 'heading', text: 'HƯỚNG DẪN PHÂN TÍCH BIỂU ĐỒ & ĐÁP ÁN' },
          {
            kind: 'lines',
            lines: [
              'Bài 1 (Biểu đồ cột sản lượng lương thực Vùng A — Số liệu giả định):',
              '   - Sản lượng tăng liên tục qua các năm: 420 (2020) → 460 (2021) → 490 (2022) → 540 (2023) → 580 nghìn tấn (2024).',
              '   - Mức tăng tuyệt đối (2020–2024): 580 - 420 = +160 nghìn tấn.',
              '   - Tốc độ tăng: (580 / 420) × 100% ≈ 138,1% (tăng 38,1%, gấp khoảng 1,38 lần).',
              '   - Nguyên nhân có thể: ứng dụng giống năng suất cao, thâm canh, cải thiện hệ thống thủy lợi và cơ giới hóa.',
              '',
              'Bài 2 (Biểu đồ nhiệt độ – lượng mưa trạm mẫu — Số liệu giả định):',
              '   - Nhiệt độ cao nhất vào tháng 7 (~29,5°C), thấp nhất vào tháng 1 (~17°C), biên độ nhiệt năm ~12,5°C.',
              '   - Mưa tập trung rõ rệt từ tháng 5 đến tháng 10 (cao nhất tháng 7–8 trên 290–310 mm), mùa khô từ tháng 11 đến tháng 4.',
              '   - Kết luận: Đặc trưng rõ nét của khí hậu nhiệt đới ẩm gió mùa có mùa đông lạnh và phân hóa mùa mưa – mùa khô.',
            ],
          },
        ],
      },
      (pageId) =>
        makeDiagramObject('geo5-bar', 'geo-bar-chart-gdp', 'geography', pageId, 86, 165, 420, 238, 2)
    );
  }

  if (sampleId === 'sample-geo-06-table-data') {
    return buildFromSpec({
      subjectLabel: 'Địa lí',
      gradeLabel: 'Lớp 11',
      docTypeLabel: 'Phiếu bài tập · Bảng số liệu',
      title: 'BÀI TẬP XỬ LÝ BẢNG SỐ LIỆU KINH TẾ – XÃ HỘI',
      subtitle: 'Kỹ năng tính tốc độ tăng trưởng (lấy năm gốc = 100%), cơ cấu (%) và rút ra nhận xét định lượng.',
      blocks: [
        {
          kind: 'callout',
          title: 'Nguồn dữ liệu thực hành',
          text: 'Bảng số liệu dưới đây sử dụng SỐ LIỆU GIẢ ĐỊNH nhằm rèn luyện công thức xử lý bảng số liệu Địa lí lớp 11.',
          tone: 'amber',
        },
        { kind: 'heading', text: 'Bảng 1. Giá trị sản xuất một số ngành kinh tế của Khu vực K giai đoạn 2018 – 2024 (Số liệu giả định, tỉ USD)' },
        {
          kind: 'table',
          headers: ['Ngành kinh tế', '2018', '2020', '2022', '2024'],
          colWeights: [3.2, 1.2, 1.2, 1.2, 1.2],
          rows: [
            ['Nông nghiệp', '40,0', '42,0', '44,0', '46,0'],
            ['Công nghiệp', '120,0', '138,0', '156,0', '180,0'],
            ['Dịch vụ', '140,0', '168,0', '196,0', '224,0'],
            ['Tổng số', '300,0', '348,0', '396,0', '450,0'],
          ],
        },
        { kind: 'heading', text: 'Yêu cầu thực hiện:' },
        {
          kind: 'lines',
          lines: [
            '1. Tính tốc độ tăng trưởng (%) của từng ngành giai đoạn 2018–2024 (lấy năm 2018 = 100%).',
            '2. Tính cơ cấu (%) giá trị sản xuất theo ngành năm 2018 và năm 2024; lập bảng số liệu đã xử lý.',
            '3. Nhận xét tốc độ tăng trưởng và sự chuyển dịch cơ cấu kinh tế của Khu vực K.',
          ],
        },
        { kind: 'writingLines', title: 'Khung tính toán & lập bảng của học sinh:', count: 9 },
        { kind: 'pageBreak' },
        { kind: 'heading', text: 'ĐÁP ÁN XỬ LÝ BẢNG SỐ LIỆU' },
        {
          kind: 'table',
          headers: ['Ngành kinh tế', 'Tốc độ tăng 2024 (2018=100%)', 'Cơ cấu 2018 (%)', 'Cơ cấu 2024 (%)', 'Thay đổi cơ cấu'],
          colWeights: [2.2, 2.0, 1.3, 1.3, 1.4],
          rows: [
            ['Nông nghiệp', '115,0%', '13,3%', '10,2%', 'Giảm 3,1%'],
            ['Công nghiệp', '150,0%', '40,0%', '40,0%', 'Ổn định (0,0%)'],
            ['Dịch vụ', '160,0%', '46,7%', '49,8%', 'Tăng 3,1%'],
            ['Tổng số', '150,0%', '100,0%', '100,0%', '—'],
          ],
        },
        {
          kind: 'lines',
          lines: [
            'Nhận xét trọng tâm:',
            '- Tổng giá trị sản xuất tăng liên tục từ 300,0 lên 450,0 tỉ USD (đạt 150,0%, tăng thêm 150 tỉ USD).',
            '- Dịch vụ có tốc độ tăng trưởng nhanh nhất (160,0%), tiếp theo là Công nghiệp (150,0%), Nông nghiệp tăng chậm nhất (115,0%).',
            '- Cơ cấu kinh tế chuyển dịch theo hướng giảm tỉ trọng Nông nghiệp (từ 13,3% xuống 10,2%), tăng tỉ trọng Dịch vụ (từ 46,7% lên 49,8%), Công nghiệp giữ tỉ trọng cao và ổn định (40,0%).',
          ],
        },
      ],
    });
  }

  if (sampleId === 'sample-geo-07-phenomenon') {
    const grading = buildRubricSession('Giải thích hiện tượng Địa lí 12', 'Địa lí', '12A3', [
      { id: 'gp1', label: 'Câu 1 (Mưa gió mùa)', maxScore: 3.5 },
      { id: 'gp2', label: 'Câu 2 (Phân hóa đai cao)', maxScore: 3.5 },
      { id: 'gp3', label: 'Câu 3 (Phân bố công nghiệp)', maxScore: 3.0 },
    ]);
    return buildFromSpec(
      {
        subjectLabel: 'Địa lí',
        gradeLabel: 'Lớp 12',
        docTypeLabel: 'Phiếu học tập · Giải thích hiện tượng',
        title: 'PHIẾU HỌC TẬP NHẬN XÉT VÀ GIẢI THÍCH HIỆN TƯỢNG ĐỊA LÍ',
        subtitle: 'Rèn kỹ năng lập luận nhân quả: Nêu hiện tượng → Trình bày nguyên nhân tự nhiên/kinh tế → Kết luận.',
        blocks: [
          { kind: 'heading', text: 'Câu 1 (3,5 điểm). Giải thích sự phân mùa mưa – khô ở nước ta' },
          {
            kind: 'lines',
            lines: [
              'Vì sao lượng mưa ở nước ta phân bố không đều giữa các mùa và có sự khác biệt về mùa mưa giữa Nam Bộ – Tây Nguyên với duyên hải Trung Bộ?',
            ],
          },
          { kind: 'writingLines', count: 5 },
          { kind: 'heading', text: 'Câu 2 (3,5 điểm). Giải thích sự phân hóa thiên nhiên theo độ cao' },
          {
            kind: 'lines',
            lines: [
              'Trình bày nguyên nhân dẫn đến sự hình thành ba đai cao thiên nhiên ở nước ta (nhiệt đới gió mùa, cận nhiệt đới gió mùa trên núi và ôn đới gió mùa trên núi).',
            ],
          },
          { kind: 'writingLines', count: 5 },
          { kind: 'heading', text: 'Câu 3 (3,0 điểm). Nhận xét và giải thích phân bố công nghiệp' },
          {
            kind: 'lines',
            lines: [
              'Giải thích vì sao các trung tâm công nghiệp lớn thường tập trung ở các vùng đồng bằng châu thổ và khu vực ven biển có hạ tầng giao thông phát triển.',
            ],
          },
          { kind: 'writingLines', count: 4 },
          { kind: 'pageBreak' },
          { kind: 'heading', text: 'HƯỚNG DẪN CHẤM VÀ CÁC Ý TRỌNG TÂM' },
          {
            kind: 'lines',
            lines: [
              'Câu 1 (3,5 điểm):',
              '  - Do hoạt động luân phiên của gió mùa kết hợp với địa hình và dải hội tụ nhiệt đới.',
              '  - Nam Bộ và Tây Nguyên: mùa mưa (tháng 5–10) do gió mùa Tây Nam ẩm; mùa khô (tháng 11–4) do Tín phong bán cầu Bắc khô nóng.',
              '  - Duyên hải Trung Bộ: mưa lệch về thu đông (tháng 9–12) do gió Đông Bắc từ biển thổi vào gặp bức chắn địa hình Trường Sơn kết hợp bão và dải hội tụ nhiệt đới.',
              '',
              'Câu 2 (3,5 điểm):',
              '  - Nguyên nhân chính là sự thay đổi nhiệt độ và độ ẩm theo độ cao địa hình (trung bình lên cao 100 m nhiệt độ giảm khoảng 0,6°C).',
              '  - Địa hình nước ta có nhiều dãy núi cao (đặc biệt dãy Hoàng Liên Sơn cao trên 2.600 m), tạo đủ điều kiện hình thành cả 3 đai cao với sự thay đổi tương ứng về đất và sinh vật.',
              '',
              'Câu 3 (3,0 điểm):',
              '  - Vị trí địa lí thuận lợi giao thương trong nước và quốc tế (cảng biển, sân bay, đường bộ).',
              '  - Nguồn lao động dồi dào, có trình độ; thị trường tiêu thụ tại chỗ lớn; kết cấu hạ tầng đồng bộ và thu hút vốn đầu tư mạnh.',
            ],
          },
        ],
      },
      () => [],
      grading
    );
  }

  if (sampleId === 'sample-geo-08-draw-chart') {
    return buildFromSpec(
      {
        subjectLabel: 'Địa lí',
        gradeLabel: 'Lớp 11',
        docTypeLabel: 'Phiếu thực hành · Vẽ biểu đồ',
        title: 'PHIẾU THỰC HÀNH VẼ BIỂU ĐỒ ĐỊA LÍ',
        subtitle: 'Xác định dạng biểu đồ phù hợp, vẽ trực tiếp trên khung tọa độ vector và viết nhận xét.',
        blocks: [
          {
            kind: 'callout',
            title: 'Số liệu giả định thực hành vẽ biểu đồ',
            text: 'Cho bảng cơ cấu GDP theo khu vực kinh tế của Vùng P năm 2024 (Số liệu giả định, đơn vị: %): Nông – Lâm – Thủy sản: 15% | Công nghiệp – Xây dựng: 38% | Dịch vụ: 47% (Tổng: 100%).',
            tone: 'amber',
          },
          { kind: 'heading', text: 'Nhiệm vụ thực hành:' },
          {
            kind: 'lines',
            lines: [
              '1. Lựa chọn dạng biểu đồ thích hợp nhất để thể hiện cơ cấu GDP của Vùng P năm 2024 (và giải thích ngắn gọn lý do chọn).',
              '2. Sử dụng khung lưới tọa độ bên dưới (hoặc chèn mẫu Biểu đồ tròn/cột từ thanh công cụ Địa lí) để hoàn thiện biểu đồ đảm bảo đủ 5 yếu tố: Tên biểu đồ, Tỉ lệ chính xác, Số liệu, Đơn vị và Chú giải.',
              '3. Viết 2–3 câu nhận xét về cơ cấu kinh tế của Vùng P.',
            ],
          },
          { kind: 'spacer', height: 222 },
          { kind: 'writingLines', title: 'Lý do chọn biểu đồ và nhận xét của học sinh:', count: 4 },
          { kind: 'pageBreak' },
          { kind: 'heading', text: 'TIÊU CHÍ CHẤM BIỂU ĐỒ ĐỊA LÍ (THANG 10 ĐIỂM)' },
          {
            kind: 'table',
            headers: ['Tiêu chí đánh giá', 'Điểm tối đa', 'Yêu cầu đạt chuẩn'],
            colWeights: [2.4, 1.2, 4.4],
            rows: [
              ['1. Chọn đúng dạng biểu đồ', '2,0', 'Biểu đồ tròn thể hiện cơ cấu (%) tại 1 mốc thời gian (năm 2024).'],
              ['2. Tính chính xác góc quạt', '2,5', '15% = 54°; 38% = 136,8°; 47% = 169,2° (tổng 360°, vẽ thuận chiều kim đồng hồ từ tia 12 giờ).'],
              ['3. Đủ yếu tố trình bày', '2,5', 'Có tên biểu đồ rõ ràng, ghi đủ số liệu (%) trong/cạnh quạt, bảng chú giải rõ, đơn vị và nguồn (Số liệu giả định).'],
              ['4. Nhận xét đúng trọng tâm', '3,0', 'Nêu được Dịch vụ chiếm tỉ trọng lớn nhất (47%), tiếp đến Công nghiệp – Xây dựng (38%), Nông – Lâm – Thủy sản thấp nhất (15%).'],
            ],
          },
        ],
      },
      (pageId) =>
        makeDiagramObject('geo8-grid', 'geo-blank-chart-grid', 'geography', pageId, 82, 272, 430, 224, 2)
    );
  }

  // =========================================================================
  // LỊCH SỬ (8 DẠNG BÀI)
  // =========================================================================

  if (sampleId === 'sample-his-01-mcq') {
    const grading = buildMcqSession(
      'Đề trắc nghiệm Lịch sử 12',
      'Lịch sử',
      '12A2',
      [
        { number: 1, kind: 'abcd', answerKey: 'B', maxScore: 1 },
        { number: 2, kind: 'abcd', answerKey: 'A', maxScore: 1 },
        { number: 3, kind: 'abcd', answerKey: 'C', maxScore: 1 },
        { number: 4, kind: 'abcd', answerKey: 'D', maxScore: 1 },
        { number: 5, kind: 'abcd', answerKey: 'A', maxScore: 1 },
        { number: 6, kind: 'abcd', answerKey: 'C', maxScore: 1 },
        { number: 7, kind: 'abcd', answerKey: 'B', maxScore: 1 },
        { number: 8, kind: 'abcd', answerKey: 'D', maxScore: 1 },
        { number: 9, kind: 'abcd', answerKey: 'A', maxScore: 1 },
        { number: 10, kind: 'abcd', answerKey: 'C', maxScore: 1 },
      ]
    );
    return buildFromSpec(
      {
        subjectLabel: 'Lịch sử',
        gradeLabel: 'Lớp 12',
        docTypeLabel: 'Đề kiểm tra · Trắc nghiệm',
        title: 'ĐỀ TRẮC NGHIỆM LỊCH SỬ VIỆT NAM (1945–1986) & THẾ GIỚI',
        subtitle: 'Thời gian: 25 phút  |  10 câu trắc nghiệm chuẩn kiến thức THPT kèm đáp án xác thực.',
        blocks: [
          { kind: 'heading', text: 'I. CÂU HỎI TRẮC NGHIỆM (10 câu × 1,0 điểm)' },
          {
            kind: 'lines',
            lines: [
              'Câu 1. Tổ chức Liên hợp quốc chính thức được thành lập vào ngày tháng năm nào?',
              '   A. 2/9/1945     B. 24/10/1945     C. 19/12/1946     D. 8/8/1967',
              'Câu 2. Ngày 2/9/1945, tại Quảng trường Ba Đình (Hà Nội), Chủ tịch Hồ Chí Minh đã đọc văn kiện nào?',
              '   A. Tuyên ngôn Độc lập                  B. Lời kêu gọi toàn quốc kháng chiến',
              '   C. Chính cương vắn tắt                 D. Cương lĩnh xây dựng đất nước',
              'Câu 3. Hiệp hội các quốc gia Đông Nam Á (ASEAN) được thành lập ngày 8/8/1967 tại thành phố nào?',
              '   A. Hà Nội     B. Ma-ni-la     C. Băng Cốc     D. Gia-các-ta',
              'Câu 4. Chiến dịch Điện Biên Phủ năm 1954 kết thúc thắng lợi hoàn toàn vào ngày nào?',
              '   A. 13/3/1954     B. 30/3/1954     C. 1/5/1954     D. 7/5/1954',
              'Câu 5. Hiệp định Giơ-ne-vơ về chấm dứt chiến tranh, lập lại hòa bình ở Đông Dương được ký kết vào thời gian nào?',
              '   A. 21/7/1954     B. 27/1/1973     C. 6/3/1946     D. 14/9/1946',
              'Câu 6. Phong trào "Đồng khởi" (1959–1960) nổ ra tiêu biểu và giành thắng lợi lớn nhất tại tỉnh nào?',
              '   A. Quảng Trị     B. Tây Ninh     C. Bến Tre     D. Cà Mau',
              'Câu 7. Hiệp định Pa-ri về chấm dứt chiến tranh, lập lại hòa bình ở Việt Nam được ký vào ngày nào?',
              '   A. 30/4/1975     B. 27/1/1973     C. 18/12/1972     D. 2/7/1976',
              'Câu 8. Chiến dịch Hồ Chí Minh lịch sử kết thúc toàn thắng vào trưa ngày nào?',
              '   A. 10/3/1975     B. 29/3/1975     C. 26/4/1975     D. 30/4/1975',
              'Câu 9. Đường lối Đổi mới đất nước được Đảng Cộng sản Việt Nam đề ra tại Đại hội đại biểu toàn quốc lần thứ mấy?',
              '   A. Đại hội VI (12/1986)     B. Đại hội IV (1976)     C. Đại hội V (1982)     D. Đại hội VII (1991)',
              'Câu 10. Việt Nam chính thức gia nhập Hiệp hội các quốc gia Đông Nam Á (ASEAN) vào năm nào?',
              '   A. 1986     B. 1991     C. 1995     D. 2007',
            ],
          },
          { kind: 'pageBreak' },
          { kind: 'heading', text: 'II. ĐÁP ÁN CHUẨN XÁC THỰC' },
          {
            kind: 'table',
            headers: ['Câu', 'Đáp án', 'Mốc thời gian & Sự kiện chuẩn xác'],
            colWeights: [1, 1.2, 5.8],
            rows: [
              ['1', 'B', '24/10/1945: Hiến chương Liên hợp quốc chính thức có hiệu lực (Ngày Liên hợp quốc).'],
              ['2', 'A', '2/9/1945: Tuyên ngôn Độc lập khai sinh nước Việt Nam Dân chủ Cộng hòa.'],
              ['3', 'C', '8/8/1967: 5 nước (In-đô-nê-xi-a, Ma-lai-xi-a, Phi-líp-pin, Xin-ga-po, Thái Lan) ký Tuyên bố Băng Cốc lập ASEAN.'],
              ['4', 'D', '17h30 ngày 7/5/1954: Tướng Đờ Ca-xtơ-ri và Bộ Tham mưu tập đoàn cứ điểm Điện Biên Phủ đầu hàng.'],
              ['5', 'A', '21/7/1954: Ký kết Hiệp định Giơ-ne-vơ về Đông Dương.'],
              ['6', 'C', '17/1/1960: Đồng khởi Bến Tre (Mỏ Cày) lan rộng khắp Nam Bộ, Tây Nguyên và Trung Trung Bộ.'],
              ['7', 'B', '27/1/1973: Hiệp định Pa-ri được ký kết, Mỹ rút quân viễn chinh khỏi miền Nam Việt Nam.'],
              ['8', 'D', '11h30 ngày 30/4/1975: Cờ giải phóng tung bay trên Dinh Độc Lập, hoàn thành giải phóng miền Nam.'],
              ['9', 'A', 'Tháng 12/1986: Đại hội VI đề ra đường lối Đổi mới toàn diện, trọng tâm là đổi mới kinh tế.'],
              ['10', 'C', '28/7/1995: Việt Nam trở thành thành viên chính thức thứ 7 của ASEAN.'],
            ],
          },
        ],
      },
      () => [],
      grading
    );
  }

  if (sampleId === 'sample-his-02-tf-source') {
    const grading = buildMcqSession(
      'Bài tập Đúng/Sai dựa trên tư liệu Lịch sử 12',
      'Lịch sử',
      '12A2',
      [
        { number: 1, kind: 'tf4', answerKey: 'Đ-Đ-S-Đ', maxScore: 1 },
        { number: 2, kind: 'tf4', answerKey: 'Đ-S-Đ-Đ', maxScore: 1 },
      ]
    );
    return buildFromSpec(
      {
        subjectLabel: 'Lịch sử',
        gradeLabel: 'Lớp 12',
        docTypeLabel: 'Phiếu bài tập · Đúng/Sai tư liệu',
        title: 'BÀI TẬP ĐÚNG / SAI DỰA TRÊN TƯ LIỆU LỊCH SỬ',
        subtitle: 'Chủ đề: Cách mạng tháng Tám năm 1945 và Tuyên ngôn Độc lập (2/9/1945).',
        blocks: [
          {
            kind: 'quote',
            title: 'Tư liệu 1 — Đoạn trích Tuyên ngôn Độc lập (2/9/1945)',
            lines: [
              '“Nước Việt Nam có quyền hưởng tự do và độc lập, và sự thật đã thành một nước tự do độc lập. Toàn thể dân tộc Việt Nam quyết đem tất cả tinh thần và lực lượng, tính mạng và của cải để giữ vững quyền tự do, độc lập ấy.”',
            ],
            source: 'Nguồn: Hồ Chí Minh Toàn tập, Tập 4, NXB Chính trị quốc gia Sự thật (Tuyên ngôn Độc lập ngày 2/9/1945).',
          },
          { kind: 'heading', text: 'Câu 1. Đọc Tư liệu 1 và xác định Đúng (Đ) hoặc Sai (S) cho từng nhận định sau:' },
          {
            kind: 'lines',
            lines: [
              '   a) Đoạn trích khẳng định cơ sở pháp lý và thực tiễn về quyền tự do, độc lập của dân tộc Việt Nam. [ Đ / S ]',
              '   b) Văn kiện thể hiện ý chí quyết tâm bảo vệ nền độc lập của toàn thể dân tộc Việt Nam.            [ Đ / S ]',
              '   c) Tuyên ngôn Độc lập được công bố sau khi Chiến dịch Điện Biên Phủ giành thắng lợi.              [ Đ / S ]',
              '   d) Sự kiện ngày 2/9/1945 đánh dấu sự ra đời của nước Việt Nam Dân chủ Cộng hòa.                   [ Đ / S ]',
            ],
          },
          {
            kind: 'quote',
            title: 'Tư liệu 2 — Chủ trương của Hội nghị Ban Chấp hành Trung ương Đảng lần thứ 8 (5/1941)',
            lines: [
              'Hội nghị Trung ương 8 họp tại Pác Bó (Cao Bằng) do Nguyễn Ái Quốc chủ trì xác định nhiệm vụ hàng đầu của cách mạng lúc này là giải phóng dân tộc, quyết định thành lập Mặt trận Việt Nam Độc lập Đồng minh (Việt Minh) để đoàn kết rộng rãi mọi tầng lớp nhân dân.',
            ],
            source: 'Nguồn: Văn kiện Đảng Toàn tập, Tập 7 (Nghị quyết Hội nghị Trung ương 8, tháng 5/1941).',
          },
          { kind: 'heading', text: 'Câu 2. Dựa trên Tư liệu 2 và kiến thức đã học, xác định Đúng (Đ) hoặc Sai (S):' },
          {
            kind: 'lines',
            lines: [
              '   a) Hội nghị Trung ương 8 (5/1941) đặt nhiệm vụ giải phóng dân tộc lên hàng đầu.                 [ Đ / S ]',
              '   b) Mặt trận Việt Minh chỉ kết nạp công nhân và nông dân, không mở rộng tới tầng lớp khác.       [ Đ / S ]',
              '   c) Hội nghị diễn ra tại Pác Bó (Cao Bằng) dưới sự chủ trì của Nguyễn Ái Quốc.                   [ Đ / S ]',
              '   d) Đường lối của Hội nghị Trung ương 8 tạo nền tảng quyết định cho thắng lợi Cách mạng tháng Tám 1945. [ Đ / S ]',
            ],
          },
          { kind: 'pageBreak' },
          { kind: 'heading', text: 'ĐÁP ÁN VÀ PHÂN TÍCH TƯ LIỆU' },
          {
            kind: 'table',
            headers: ['Câu', 'Đáp án', 'Phân tích kiểm chứng'],
            colWeights: [1, 1.6, 5.4],
            rows: [
              [
                'Câu 1',
                'Đ – Đ – S – Đ',
                'a) Đúng: Câu văn nêu rõ quyền hưởng tự do, độc lập và thực tế đã giành được độc lập. b) Đúng: “quyết đem tất cả tinh thần và lực lượng...”. c) Sai: Tuyên ngôn đọc ngày 2/9/1945, trước Điện Biên Phủ (1954) gần 9 năm. d) Đúng.',
              ],
              [
                'Câu 2',
                'Đ – S – Đ – Đ',
                'a) Đúng: Chuyển hướng chiến lược đặt giải phóng dân tộc lên trên hết. b) Sai: Việt Minh tập hợp rộng rãi mọi giới đồng bào yêu nước (công, nông, trí thức, tiểu tư sản, tư sản dân tộc, địa chủ yêu nước). c) Đúng. d) Đúng.',
              ],
            ],
          },
        ],
      },
      () => [],
      grading
    );
  }

  if (sampleId === 'sample-his-03-source-analysis') {
    return buildFromSpec(
      {
        subjectLabel: 'Lịch sử',
        gradeLabel: 'Lớp 10',
        docTypeLabel: 'Phiếu học tập · Khai thác tư liệu',
        title: 'PHIẾU KHAI THÁC TƯ LIỆU LỊCH SỬ: CHIẾU DỜI ĐÔ (1010)',
        subtitle: 'Tác giả: Vua Lý Thái Tổ (Lý Công Uẩn)  |  Kỹ năng đọc hiểu văn bản lịch sử trung đại.',
        blocks: [
          {
            kind: 'quote',
            title: 'Đoạn trích Chiếu dời đô (Thiên đô chiếu, năm 1010)',
            lines: [
              '“Huống gì thành Đại La, kinh đô cũ của Cao Vương: ở vào nơi trung tâm trời đất; được cái thế rồng cuộn hổ ngồi. Đã đúng ngôi nam bắc đông tây; lại tiện hướng nhìn sông dựa núi. Địa thế rộng mà bằng; đất đai cao mà thoáng. Dân cư khỏi chịu cảnh khốn khổ ngập lụt; muôn vật cũng rất mực phong phú tốt tươi. Xem khắp đất Việt ta, chỉ nơi này là thắng địa. Thật là chốn tụ hội trọng yếu của bốn phương đất nước; cũng là kinh đô bậc nhất của đế vương muôn đời.”',
            ],
            source: 'Nguồn: Đại Việt sử ký toàn thư, Tập I (Bản dịch Viện Khoa học Xã hội Việt Nam, NXB Khoa học xã hội).',
          },
          { kind: 'heading', text: 'HỆ THỐNG CÂU HỎI KHAI THÁC TƯ LIỆU' },
          {
            kind: 'lines',
            lines: [
              'Câu 1 (Nhận biết): Chiếu dời đô được ban hành vào năm nào? Trước khi dời về Đại La (đổi tên là Thăng Long), kinh đô của nước Đại Cồ Việt đóng ở đâu?',
              'Câu 2 (Thông hiểu): Trong đoạn trích trên, vua Lý Công Uẩn nêu những ưu thế nổi bật nào về vị trí địa lí, địa hình và đời sống dân cư của thành Đại La?',
              'Câu 3 (Vận dụng): Phân tích ý nghĩa lịch sử của quyết định dời đô từ Hoa Lư ra Thăng Long (1010) đối với sự phát triển lâu dài của quốc gia Đại Việt.',
            ],
          },
          { kind: 'writingLines', title: 'Phần trình bày của học sinh:', count: 9 },
          { kind: 'pageBreak' },
          { kind: 'heading', text: 'GỢI Ý ĐÁP ÁN KHAI THÁC TƯ LIỆU' },
          {
            kind: 'lines',
            lines: [
              'Câu 1:',
              '  - Chiếu dời đô ban hành năm 1010 (mùa thu năm Canh Tuất, Thuận Thiên nguyên niên).',
              '  - Kinh đô trước đó đóng tại Hoa Lư (Ninh Bình) từ thời Đinh – Tiền Lê.',
              '',
              'Câu 2 (Ưu thế của Đại La theo tư liệu):',
              '  - Vị trí trung tâm đất nước (“nơi trung tâm trời đất”, “chốn tụ hội trọng yếu của bốn phương”).',
              '  - Địa hình thuận lợi: “rộng mà bằng, cao mà thoáng”, tránh ngập lụt, giao thông thủy bộ thuận tiện (“nhìn sông dựa núi”).',
              '  - Kinh tế – dân sinh trù phú (“muôn vật rất mực phong phú tốt tươi”).',
              '',
              'Câu 3 (Ý nghĩa lịch sử):',
              '  - Khẳng định tầm nhìn chiến lược và thế chủ động của quốc gia độc lập: chuyển từ thế phòng thủ núi hiểm (Hoa Lư) sang thế mở rộng phát triển kinh tế, văn hóa, giao lưu toàn quốc (Thăng Long).',
              '  - Mở ra kỷ nguyên phát triển rực rỡ của văn minh Đại Việt dưới các triều đại Lý – Trần – Lê sơ và đặt nền móng cho Thủ đô Hà Nội nghìn năm văn hiến.',
            ],
          },
        ],
      }
    );
  }

  if (sampleId === 'sample-his-04-timeline') {
    return buildFromSpec(
      {
        subjectLabel: 'Lịch sử',
        gradeLabel: 'Lớp 12',
        docTypeLabel: 'Phiếu thực hành · Dòng thời gian',
        title: 'PHIẾU THỰC HÀNH DÒNG THỜI GIAN LỊCH SỬ VIỆT NAM (1930 – 1986)',
        subtitle: 'Trục thời gian vector chỉnh sửa được kèm bảng hoàn thiện bối cảnh và ý nghĩa các mốc lớn.',
        blocks: [
          { kind: 'heading', text: 'I. QUAN SÁT TRỤC THỜI GIAN 5 MỐC LỊCH SỬ TIÊU BIỂU' },
          { kind: 'spacer', height: 208 },
          { kind: 'heading', text: 'II. BÀI TẬP HOÀN THIỆN BẢNG TÓM TẮT CÁC MỐC LỊCH SỬ' },
          {
            kind: 'table',
            headers: ['Mốc thời gian', 'Tên sự kiện chính', 'Kết quả / Ý nghĩa lịch sử cốt lõi (Học sinh điền)'],
            colWeights: [1.3, 2.2, 4.5],
            rows: [
              ['3/2/1930', 'Thành lập Đảng Cộng sản Việt Nam', '....................................................................................'],
              ['2/9/1945', 'Cách mạng tháng Tám & Tuyên ngôn Độc lập', '....................................................................................'],
              ['7/5/1954', 'Chiến thắng Điện Biên Phủ', '....................................................................................'],
              ['30/4/1975', 'Giải phóng miền Nam, thống nhất đất nước', '....................................................................................'],
              ['12/1986', 'Đại hội VI — Mở đầu công cuộc Đổi mới', '....................................................................................'],
            ],
          },
          {
            kind: 'lines',
            lines: [
              'Câu hỏi mở rộng: Em hãy bổ sung thêm 2 mốc sự kiện quan trọng khác trong giai đoạn 1945–1995 (ví dụ: 19/12/1946, 27/1/1973 hoặc 28/7/1995) trực tiếp lên trục thời gian bằng công cụ Ghi chú / Thêm văn bản.',
            ],
          },
          { kind: 'pageBreak' },
          { kind: 'heading', text: 'III. ĐÁP ÁN CHUẨN CHO 5 MỐC LỊCH SỬ' },
          {
            kind: 'table',
            headers: ['Mốc', 'Ý nghĩa lịch sử cốt lõi'],
            colWeights: [1.4, 6.6],
            rows: [
              ['1930', 'Chấm dứt khủng hoảng về đường lối cứu nước và giai cấp lãnh đạo; mở ra bước ngoặt vĩ đại của cách mạng Việt Nam.'],
              ['1945', 'Lật đổ ách thống trị thực dân, phát xít và chế độ phong kiến; lập ra nước Việt Nam Dân chủ Cộng hòa.'],
              ['1954', 'Đập tan tập đoàn cứ điểm mạnh nhất Đông Dương, quyết định việc ký Hiệp định Giơ-ne-vơ, kết thúc kháng chiến chống Pháp.'],
              ['1975', 'Kết thúc thắng lợi cuộc kháng chiến chống Mỹ, cứu nước; hoàn thành thống nhất đất nước về mặt lãnh thổ.'],
              ['1986', 'Khởi xướng đường lối Đổi mới toàn diện, chuyển sang kinh tế hàng hóa nhiều thành phần định hướng XHCN, mở cửa hội nhập quốc tế.'],
            ],
          },
        ],
      },
      (pageId) =>
        makeDiagramObject('his4-tl', 'his-timeline-horizontal', 'history', pageId, 74, 168, 446, 200, 2)
    );
  }

  if (sampleId === 'sample-his-05-ordering') {
    return buildFromSpec({
      subjectLabel: 'Lịch sử',
      gradeLabel: 'Lớp 11',
      docTypeLabel: 'Phiếu bài tập · Sắp xếp sự kiện',
      title: 'BÀI TẬP SẮP XẾP SỰ KIỆN LỊCH SỬ THEO TRÌNH TỰ THỜI GIAN',
      subtitle: 'Rèn kỹ năng nắm vững tiến trình lịch sử dân tộc từ thế kỷ X đến thế kỷ XX.',
      blocks: [
        { kind: 'heading', text: 'Chuỗi 1. Các thắng lợi tiêu biểu trong lịch sử chống ngoại xâm thế kỷ X – XVIII' },
        {
          kind: 'lines',
          lines: [
            'Hãy sắp xếp các sự kiện sau theo đúng thứ tự từ sớm nhất đến muộn nhất (ghi mã chữ cái và năm):',
            '   A. Chiến thắng Ngọc Hồi – Đống Đa (Quang Trung đại phá quân Thanh).',
            '   B. Chiến thắng Bạch Đằng của Ngô Quyền đánh bại quân Nam Hán.',
            '   C. Chiến thắng Chi Lăng – Xương Giang trong khởi nghĩa Lam Sơn.',
            '   D. Chiến thắng Bạch Đằng lần thứ ba của quân dân nhà Trần trước quân Nguyên.',
            '   E. Phòng tuyến sông Như Nguyệt của Lý Thường Kiệt chống quân Tống.',
            '   Thứ tự đúng:  [ ... ] → [ ... ] → [ ... ] → [ ... ] → [ ... ]',
          ],
        },
        { kind: 'heading', text: 'Chuỗi 2. Tiến trình cách mạng Việt Nam giai đoạn 1930 – 1954' },
        {
          kind: 'lines',
          lines: [
            '   A. Toàn quốc kháng chiến chống thực dân Pháp bùng nổ.',
            '   B. Chiến dịch Biên giới Thu – Đông giành quyền chủ động trên chiến trường chính Bắc Bộ.',
            '   C. Hội nghị hợp nhất thành lập Đảng Cộng sản Việt Nam.',
            '   D. Tổng khởi nghĩa Cách mạng tháng Tám thắng lợi.',
            '   E. Chiến thắng lịch sử Điện Biên Phủ.',
            '   Thứ tự đúng:  [ ... ] → [ ... ] → [ ... ] → [ ... ] → [ ... ]',
          ],
        },
        { kind: 'heading', text: 'Chuỗi 3. Các dấu mốc lớn giai đoạn 1954 – 1995' },
        {
          kind: 'lines',
          lines: [
            '   A. Việt Nam chính thức gia nhập ASEAN.',
            '   B. Ký Hiệp định Pa-ri về chấm dứt chiến tranh, lập lại hòa bình ở Việt Nam.',
            '   C. Đại hội VI đề ra đường lối Đổi mới.',
            '   D. Phong trào Đồng khởi ở miền Nam.',
            '   E. Chiến dịch Hồ Chí Minh toàn thắng.',
            '   Thứ tự đúng:  [ ... ] → [ ... ] → [ ... ] → [ ... ] → [ ... ]',
          ],
        },
        { kind: 'pageBreak' },
        { kind: 'heading', text: 'ĐÁP ÁN SẮP XẾP SỰ KIỆN CHUẨN XÁC' },
        {
          kind: 'table',
          headers: ['Chuỗi', 'Thứ tự đúng', 'Mốc năm xác thực'],
          colWeights: [1.1, 2.2, 4.7],
          rows: [
            ['Chuỗi 1', 'B → E → D → C → A', 'B (938) → E (1077) → D (1288) → C (1427) → A (1789).'],
            ['Chuỗi 2', 'C → D → A → B → E', 'C (1930) → D (8/1945) → A (19/12/1946) → B (1950) → E (7/5/1954).'],
            ['Chuỗi 3', 'D → B → E → C → A', 'D (1959–1960) → B (27/1/1973) → E (30/4/1975) → C (12/1986) → A (28/7/1995).'],
          ],
        },
      ],
    });
  }

  if (sampleId === 'sample-his-06-comparison') {
    return buildFromSpec({
      subjectLabel: 'Lịch sử',
      gradeLabel: 'Lớp 12',
      docTypeLabel: 'Phiếu học tập · So sánh',
      title: 'PHIẾU SO SÁNH: KHÁNG CHIẾN CHỐNG PHÁP (1945–1954) VÀ CHỐNG MỸ (1954–1975)',
      subtitle: 'Kỹ năng lập bảng đối chiếu tiêu chí và rút ra điểm tương đồng – khác biệt giữa hai giai đoạn.',
      blocks: [
        { kind: 'heading', text: 'I. HOÀN THIỆN BẢNG SO SÁNH HAI CUỘC KHÁNG CHIẾN' },
        {
          kind: 'table',
          headers: ['Tiêu chí so sánh', 'Kháng chiến chống Pháp (1945–1954)', 'Kháng chiến chống Mỹ (1954–1975)'],
          colWeights: [2.0, 3.0, 3.0],
          rows: [
            ['Bối cảnh quốc tế & trong nước', 'Mới giành độc lập, đối mặt thù trong giặc ngoài; Chiến tranh Lạnh bắt đầu.', 'Đất nước tạm thời bị chia cắt thành hai miền với hai chế độ chính trị khác nhau.'],
            ['Nhiệm vụ chiến lược', '...........................................................', '...........................................................'],
            ['Đường lối kháng chiến', 'Toàn dân, toàn diện, trường kỳ, tự lực cánh sinh và tranh thủ ủng hộ quốc tế.', '...........................................................'],
            ['Chiến thắng quân sự quyết định', '...........................................................', '...........................................................'],
            ['Hiệp định ngoại giao tiêu biểu', '...........................................................', '...........................................................'],
          ],
        },
        { kind: 'heading', text: 'II. CÂU HỎI TỔNG HỢP' },
        {
          kind: 'lines',
          lines: [
            '1. Nêu ít nhất 2 điểm tương đồng cơ bản giữa hai cuộc kháng chiến (về tính chất, lực lượng và sự lãnh đạo).',
            '2. Nêu điểm khác biệt lớn nhất về đặc điểm tình hình đất nước khi tiến hành hai cuộc kháng chiến.',
          ],
        },
        { kind: 'writingLines', count: 6 },
        { kind: 'pageBreak' },
        { kind: 'heading', text: 'GỢI Ý ĐÁP ÁN SO SÁNH' },
        {
          kind: 'table',
          headers: ['Tiêu chí', 'Kháng chiến chống Pháp (1945–1954)', 'Kháng chiến chống Mỹ (1954–1975)'],
          colWeights: [1.8, 3.1, 3.1],
          rows: [
            ['Nhiệm vụ chiến lược', 'Vừa kháng chiến bảo vệ nền độc lập vừa kiến quốc xây dựng chế độ mới.', 'Tiến hành đồng thời hai nhiệm vụ: xây dựng CNXH ở miền Bắc và cách mạng dân tộc dân chủ ở miền Nam, thống nhất Tổ quốc.'],
            ['Chiến thắng quyết định', 'Chiến dịch Điện Biên Phủ (7/5/1954).', 'Tổng tiến công và nổi dậy mùa Xuân 1975, đỉnh cao là Chiến dịch Hồ Chí Minh (30/4/1975).'],
            ['Hiệp định ngoại giao', 'Hiệp định Giơ-ne-vơ (21/7/1954).', 'Hiệp định Pa-ri (27/1/1973).'],
          ],
        },
        {
          kind: 'lines',
          lines: [
            '- Điểm tương đồng: Đều là chiến tranh giải phóng và bảo vệ Tổ quốc chính nghĩa dưới sự lãnh đạo của Đảng, phát huy sức mạnh đại đoàn kết toàn dân và kết hợp đấu tranh quân sự – chính trị – ngoại giao.',
            '- Điểm khác biệt nổi bật: Giai đoạn 1954–1975 diễn ra trong điều kiện đất nước tạm chia hai miền, miền Bắc trở thành hậu phương lớn chi viện cho tiền tuyến lớn miền Nam.',
          ],
        },
      ],
    });
  }

  if (sampleId === 'sample-his-07-essay') {
    const grading = buildRubricSession('Đề tự luận Lịch sử 12', 'Lịch sử', '12A1', [
      { id: 'he1', label: 'Câu 1: Chính xác mốc & sự kiện', maxScore: 2.0 },
      { id: 'he2', label: 'Câu 1: Phân tích ý nghĩa ĐBP 1954', maxScore: 3.0 },
      { id: 'he3', label: 'Câu 2: Bối cảnh & nội dung Đổi mới', maxScore: 2.5 },
      { id: 'he4', label: 'Câu 2: Thành tựu & bài học kinh nghiệm', maxScore: 2.5 },
    ]);
    return buildFromSpec(
      {
        subjectLabel: 'Lịch sử',
        gradeLabel: 'Lớp 12',
        docTypeLabel: 'Đề kiểm tra · Tự luận phân tích',
        title: 'ĐỀ TỰ LUẬN PHÂN TÍCH LỊCH SỬ: ĐIỆN BIÊN PHỦ (1954) & ĐỔI MỚI (1986)',
        subtitle: 'Thời gian: 45 phút  |  Kèm sơ đồ tư duy phân tích sự kiện và thang chấm điểm thủ công 4 tiêu chí.',
        blocks: [
          { kind: 'heading', text: 'Sơ đồ gợi ý cấu trúc lập luận bài tự luận lịch sử:' },
          { kind: 'spacer', height: 158 },
          { kind: 'heading', text: 'Câu 1 (5,0 điểm). Phân tích ý nghĩa lịch sử của Chiến thắng Điện Biên Phủ (7/5/1954)' },
          {
            kind: 'lines',
            lines: [
              'Trình bày khái quát hoàn cảnh mở Chiến dịch Điện Biên Phủ (13/3 – 7/5/1954), phương châm tác chiến “đánh chắc, tiến chắc” và phân tích ý nghĩa lịch sử của chiến thắng này đối với Việt Nam và phong trào giải phóng dân tộc trên thế giới.',
            ],
          },
          { kind: 'writingLines', count: 5 },
          { kind: 'heading', text: 'Câu 2 (5,0 điểm). Phân tích bối cảnh và thành tựu bước đầu của Công cuộc Đổi mới (từ năm 1986)' },
          {
            kind: 'lines',
            lines: [
              'Vì sao Đại hội VI (12/1986) quyết định tiến hành Đổi mới đất nước? Phân tích trọng tâm đổi mới kinh tế và rút ra một bài học kinh nghiệm có giá trị đến ngày nay.',
            ],
          },
          { kind: 'writingLines', count: 5 },
          { kind: 'pageBreak' },
          { kind: 'heading', text: 'HƯỚNG DẪN CHẤM TỰ LUẬN LỊCH SỬ (THANG 10 ĐIỂM)' },
          {
            kind: 'table',
            headers: ['Tiêu chí chấm', 'Điểm', 'Yêu cầu kiến thức và lập luận'],
            colWeights: [2.2, 0.9, 4.9],
            rows: [
              ['Câu 1 – Bối cảnh & mốc', '2,0', 'Nêu đúng Kế hoạch Na-va của Pháp – Mỹ, thời gian 56 ngày đêm (13/3 – 7/5/1954), chuyển phương châm từ “đánh nhanh thắng nhanh” sang “đánh chắc, tiến chắc”.'],
              ['Câu 1 – Phân tích ý nghĩa', '3,0', 'Đập tan kế hoạch Na-va, xoay chuyển cục diện chiến tranh, tạo cơ sở ký Hiệp định Giơ-ne-vơ (21/7/1954); cổ vũ mạnh mẽ phong trào giải phóng dân tộc ở châu Á, châu Phi, Mỹ La-tinh.'],
              ['Câu 2 – Bối cảnh & nội dung', '2,5', 'Nêu đúng khủng hoảng kinh tế – xã hội đầu thập niên 1980 và tác động quốc tế; đổi mới toàn diện, đồng bộ, lấy đổi mới kinh tế làm trọng tâm (xóa bỏ bao cấp, phát triển kinh tế nhiều thành phần).'],
              ['Câu 2 – Thành tựu & bài học', '2,5', 'Đất nước từng bước thoát khủng hoảng, tự túc và xuất khẩu gạo (từ 1989), mở rộng quan hệ đối ngoại; bài học: tôn trọng quy luật khách quan, lấy dân làm gốc, kết hợp sức mạnh dân tộc và thời đại.'],
            ],
          },
        ],
      },
      (pageId) =>
        makeDiagramObject('his7-flow', 'his-cause-effect-flow', 'history', pageId, 78, 152, 438, 154, 2),
      grading
    );
  }

  if (sampleId === 'sample-his-08-application') {
    return buildFromSpec({
      subjectLabel: 'Lịch sử',
      gradeLabel: 'Lớp 10',
      docTypeLabel: 'Phiếu học tập · Vận dụng',
      title: 'PHIẾU HỌC TẬP VẬN DỤNG: BẢO TỒN DI SẢN VĂN HÓA VIỆT NAM',
      subtitle: 'Chủ đề Lịch sử 10: Sử học với công tác bảo tồn và phát huy giá trị di sản văn hóa được UNESCO ghi danh.',
      blocks: [
        { kind: 'heading', text: 'I. BẢNG THÔNG TIN MỘT SỐ DI SẢN THẾ GIỚI TIÊU BIỂU CỦA VIỆT NAM (UNESCO)' },
        {
          kind: 'table',
          headers: ['Tên di sản', 'Địa phương', 'Năm ghi danh', 'Loại hình di sản'],
          colWeights: [2.8, 1.9, 1.2, 2.1],
          rows: [
            ['Quần thể di tích Cố đô Huế', 'Thừa Thiên Huế (TP. Huế)', '1993', 'Di sản văn hóa thế giới'],
            ['Vịnh Hạ Long (mở rộng Quần đảo Cát Bà 2023)', 'Quảng Ninh – Hải Phòng', '1994', 'Di sản thiên nhiên thế giới'],
            ['Đô thị cổ Hội An', 'Quảng Nam', '1999', 'Di sản văn hóa thế giới'],
            ['Khu đền tháp Mỹ Sơn', 'Quảng Nam', '1999', 'Di sản văn hóa thế giới'],
            ['Hoàng thành Thăng Long', 'Hà Nội', '2010', 'Di sản văn hóa thế giới'],
            ['Quần thể danh thắng Tràng An', 'Ninh Bình', '2014', 'Di sản hỗn hợp (Văn hóa & Thiên nhiên)'],
          ],
        },
        { kind: 'heading', text: 'II. NHIỆM VỤ VẬN DỤNG THỰC TIỄN' },
        {
          kind: 'lines',
          lines: [
            '1. Chọn 01 di sản trong bảng trên (hoặc một di tích lịch sử tại địa phương em) và giới thiệu ngắn gọn giá trị lịch sử – văn hóa nổi bật của di sản đó.',
            '2. Phân tích mối quan hệ hai chiều giữa bảo tồn di sản và phát triển du lịch bền vững.',
            '3. Đề xuất 3 hành động cụ thể, khả thi mà học sinh THPT có thể thực hiện để góp phần quảng bá và giữ gìn di sản văn hóa địa phương.',
          ],
        },
        { kind: 'writingLines', title: 'Đề xuất và trình bày của học sinh:', count: 7 },
        { kind: 'pageBreak' },
        { kind: 'heading', text: 'HƯỚNG DẪN ĐÁNH GIÁ PHIẾU VẬN DỤNG' },
        {
          kind: 'lines',
          lines: [
            '- Tiêu chí 1 (3,0 điểm): Xác định chính xác thông tin di sản (tên gọi, địa điểm, giá trị lịch sử – kiến trúc – văn hóa tiêu biểu).',
            '- Tiêu chí 2 (3,5 điểm): Làm rõ được du lịch tạo nguồn lực tài chính và lan tỏa giá trị di sản; ngược lại, bảo tồn nguyên gốc giữ sức hút lâu dài cho du lịch (tránh thương mại hóa quá mức, xâm hại di tích).',
            '- Tiêu chí 3 (3,5 điểm): Đề xuất ít nhất 3 hành động thiết thực cho học sinh (giữ vệ sinh môi trường di tích, tìm hiểu và giới thiệu thông tin chính xác trên mạng xã hội, tham gia câu lạc bộ lịch sử/tình nguyện viên thuyết minh).',
          ],
        },
      ],
    });
  }

  // =========================================================================
  // TIẾNG ANH (11 DẠNG BÀI)
  // =========================================================================

  if (sampleId === 'sample-eng-01-mcq') {
    const grading = buildMcqSession(
      'English 12 Multiple-Choice Test',
      'Tiếng Anh',
      '12A1',
      [
        { number: 1, kind: 'abcd', answerKey: 'C', maxScore: 1 },
        { number: 2, kind: 'abcd', answerKey: 'B', maxScore: 1 },
        { number: 3, kind: 'abcd', answerKey: 'D', maxScore: 1 },
        { number: 4, kind: 'abcd', answerKey: 'A', maxScore: 1 },
        { number: 5, kind: 'abcd', answerKey: 'B', maxScore: 1 },
        { number: 6, kind: 'abcd', answerKey: 'C', maxScore: 1 },
        { number: 7, kind: 'abcd', answerKey: 'A', maxScore: 1 },
        { number: 8, kind: 'abcd', answerKey: 'D', maxScore: 1 },
        { number: 9, kind: 'abcd', answerKey: 'B', maxScore: 1 },
        { number: 10, kind: 'abcd', answerKey: 'C', maxScore: 1 },
      ]
    );
    return buildFromSpec(
      {
        subjectLabel: 'Tiếng Anh',
        gradeLabel: 'Lớp 12',
        docTypeLabel: 'Đề kiểm tra · Multiple-choice',
        title: 'ENGLISH MULTIPLE-CHOICE TEST: PHONETICS, GRAMMAR & COMMUNICATION',
        subtitle: 'Time allowed: 20 minutes  |  10 standard high-school questions with complete Answer Key.',
        blocks: [
          { kind: 'heading', text: 'I. PRONUNCIATION & WORD STRESS (Questions 1–2)' },
          {
            kind: 'lines',
            lines: [
              '1. Choose the word whose underlined "-ed" ending is pronounced differently:',
              '   A. worked          B. watched          C. played          D. stopped',
              '2. Choose the word that differs from the other three in the position of primary stress:',
              '   A. heritage        B. volunteer        C. educate         D. habitat',
            ],
          },
          { kind: 'heading', text: 'II. GRAMMAR, VOCABULARY & COMMUNICATION (Questions 3–10)' },
          {
            kind: 'lines',
            lines: [
              '3. While the students ______ their science project, the power suddenly went out.',
              '   A. discuss         B. discussed        C. have discussed  D. were discussing',
              '4. Solar panels ______ on the roof of our school library last summer.',
              '   A. were installed  B. installed        C. are installing  D. have installed',
              '5. The more trees we plant in urban areas, ______ the air quality becomes.',
              '   A. good            B. the better       C. best            D. more better',
              '6. Nam decided to ______ a gap year to gain practical experience before university.',
              '   A. make            B. do               C. take            D. get',
              '7. She passed the entrance exam with flying colours, ______ made her parents very proud.',
              '   A. which           B. that             C. who             D. what',
              '8. If Linh ______ earlier, she would not have missed the morning bus.',
              '   A. leaves          B. left             C. has left        D. had left',
              '9. Minh: "Would you mind turning down the volume a bit?" — Hoa: "______."',
              '   A. Yes, I would    B. Not at all       C. You are welcome D. Never mind',
              '10. Critical thinking is an essential skill that helps learners ______ reliable information online.',
              '   A. ignore          B. refuse           C. evaluate        D. complain',
            ],
          },
          { kind: 'pageBreak' },
          { kind: 'heading', text: 'ANSWER KEY & BRIEF EXPLANATIONS' },
          {
            kind: 'table',
            headers: ['Q', 'Key', 'Explanation'],
            colWeights: [0.8, 1.0, 6.2],
            rows: [
              ['1', 'C', 'played (/d/) vs worked, watched, stopped (/t/).'],
              ['2', 'B', 'volunTEER (stress on 3rd syllable) vs HERitage, EDucate, HABitat (1st syllable).'],
              ['3', 'D', 'Past continuous ("were discussing") for an action in progress interrupted by past simple.'],
              ['4', 'A', 'Past simple passive ("were installed") with "last summer".'],
              ['5', 'B', 'Double comparative structure: The + comparative..., the + comparative...'],
              ['6', 'C', 'Collocation: "take a gap year".'],
              ['7', 'A', 'Non-defining relative pronoun "which" referring to the entire preceding clause.'],
              ['8', 'D', 'Third conditional: If + S + had + V3/ed, S + would (not) have + V3/ed.'],
              ['9', 'B', '"Not at all" is the polite negative response agreeing to a "Would you mind...?" request.'],
              ['10', 'C', 'Vocabulary in context: "evaluate reliable information" (đánh giá thông tin đáng tin cậy).'],
            ],
          },
        ],
      },
      () => [],
      grading
    );
  }

  if (sampleId === 'sample-eng-02-vocab-grammar') {
    return buildFromSpec({
      subjectLabel: 'Tiếng Anh',
      gradeLabel: 'Lớp 10',
      docTypeLabel: 'Phiếu bài tập · Vocabulary & Grammar',
      title: 'VOCABULARY & GRAMMAR WORKSHEET: PROTECTING THE ENVIRONMENT',
      subtitle: 'Grade 10  |  Focus: Topic Vocabulary, Verb Tenses, Passive Voice and Relative Clauses.',
      blocks: [
        { kind: 'heading', text: 'Part A. Complete the sentences using the correct word from the box' },
        {
          kind: 'callout',
          title: 'Word Bank',
          text: 'renewable   |   biodiversity   |   carbon footprint   |   recycle   |   conservation',
          tone: 'teal',
        },
        {
          kind: 'lines',
          lines: [
            '1. Switching to ________________ energy sources such as wind and solar helps reduce air pollution.',
            '2. Walking or cycling to school is a simple way for students to lower their ________________.',
            '3. National parks play a crucial role in protecting wildlife and preserving ________________.',
            '4. Every classroom should have separate bins so students can ________________ paper and plastic.',
            '5. Local youth clubs organized a beach clean-up to raise awareness of marine ________________.',
          ],
        },
        { kind: 'heading', text: 'Part B. Put the verbs in brackets into the correct tense or passive form' },
        {
          kind: 'lines',
          lines: [
            '6. Our school (launch) ________________ a "Green Campus" campaign since September.',
            '7. Thousands of reusable water bottles (distribute) ________________ to freshmen last week.',
            '8. If households (sort) ________________ their waste properly, recycling becomes much easier.',
            '9. Look at those dark clouds! It (rain) ________________ heavily in a few minutes.',
            '10. The volunteers (plant) ________________ 200 saplings along the river when the reporter arrived.',
          ],
        },
        { kind: 'heading', text: 'Part C. Fill in each blank with a suitable relative pronoun (who, which, whose, where)' },
        {
          kind: 'lines',
          lines: [
            '11. The scientist ________ gave a talk on climate change works at Hanoi University.',
            '12. That is the community garden ________ local residents grow organic vegetables.',
            '13. Plastic bags, ________ take hundreds of years to decompose, should be replaced by cloth bags.',
            '14. We interviewed a student ________ eco-friendly project won first prize.',
          ],
        },
        { kind: 'pageBreak' },
        { kind: 'heading', text: 'ANSWER KEY — VOCABULARY & GRAMMAR (GRADE 10)' },
        {
          kind: 'table',
          headers: ['Part', 'Item & Correct Answer'],
          colWeights: [1.6, 6.4],
          rows: [
            ['Part A (Vocab)', '1. renewable   |   2. carbon footprint   |   3. biodiversity   |   4. recycle   |   5. conservation'],
            ['Part B (Verbs)', '6. has launched   |   7. were distributed   |   8. sort   |   9. is going to rain   |   10. were planting'],
            ['Part C (Relative)', '11. who   |   12. where   |   13. which   |   14. whose'],
          ],
        },
      ],
    });
  }

  if (sampleId === 'sample-eng-03-gap-fill') {
    return buildFromSpec({
      subjectLabel: 'Tiếng Anh',
      gradeLabel: 'Lớp 11',
      docTypeLabel: 'Phiếu bài tập · Gap-filling',
      title: 'GAP-FILLING WORKSHEET: SMART AND SUSTAINABLE CITIES',
      subtitle: 'Grade 11  |  Guided Cloze Passage (Word Bank) + Open Cloze Practice.',
      blocks: [
        { kind: 'heading', text: 'Task 1. Read the passage and fill in each numbered blank (1–6) with ONE word from the box' },
        {
          kind: 'callout',
          title: 'Word Bank (1 extra word is not needed)',
          text: 'efficient   |   sensors   |   emissions   |   public   |   parks   |   residents   |   crowded',
          tone: 'teal',
        },
        {
          kind: 'lines',
          lines: [
            'As urban populations continue to grow, city planners are rethinking how modern cities should work. A sustainable city aims to improve the quality of life for its (1) ____________ while minimizing damage to the environment. First, reliable (2) ____________ transport—such as electric buses and metro lines—encourages people to leave private cars at home, significantly cutting greenhouse gas (3) ____________. Second, digital (4) ____________ placed along streets can monitor air quality, traffic flow, and energy use in real time, making city services far more (5) ____________. Finally, rooftop gardens and green (6) ____________ cool down busy neighbourhoods and provide welcoming spaces for families to relax.',
          ],
        },
        { kind: 'heading', text: 'Task 2. Open Cloze — Fill in each blank (7–10) with ONE suitable grammatical word' },
        {
          kind: 'lines',
          lines: [
            '7. Smart streetlights automatically adjust their brightness depending ________ how much traffic is on the road.',
            '8. Not ________ do green buildings save electricity, but they also create healthier indoor spaces.',
            '9. Cycling lanes are designed ________ that commuters can travel safely without sharing lanes with trucks.',
            '10. Citizens are encouraged to take part ________ local planning meetings to share their ideas.',
          ],
        },
        { kind: 'pageBreak' },
        { kind: 'heading', text: 'ANSWER KEY — GAP-FILLING EXERCISES' },
        {
          kind: 'table',
          headers: ['Blank', 'Correct Word', 'Grammar / Collocation Note'],
          colWeights: [1.0, 1.8, 5.2],
          rows: [
            ['(1)', 'residents', 'Plural noun meaning people who live in a city.'],
            ['(2)', 'public', 'Collocation: "public transport" (giao thông công cộng).'],
            ['(3)', 'emissions', 'Collocation: "greenhouse gas emissions" (khí thải nhà kính).'],
            ['(4)', 'sensors', 'Plural noun agreeing with "digital ... monitor".'],
            ['(5)', 'efficient', 'Adjective after "far more" describing city services.'],
            ['(6)', 'parks', 'Plural noun parallel with "rooftop gardens". ("crowded" is the distractor).'],
            ['(7)', 'on', 'Preposition phrase: "depending on".'],
            ['(8)', 'only', 'Correlative inversion: "Not only do ... but ... also".'],
            ['(9)', 'so', 'Purpose clause conjunction: "so that".'],
            ['(10)', 'in', 'Phrasal verb: "take part in" (tham gia vào).'],
          ],
        },
      ],
    });
  }

  if (sampleId === 'sample-eng-04-reading') {
    return buildFromSpec({
      subjectLabel: 'Tiếng Anh',
      gradeLabel: 'Lớp 12',
      docTypeLabel: 'Phiếu bài tập · Reading comprehension',
      title: 'READING COMPREHENSION: DIGITAL LITERACY AND LIFELONG LEARNING',
      subtitle: 'Grade 12  |  Passage + 6 comprehension questions (Main Idea, Detail, Reference, Vocabulary, Inference).',
      blocks: [
        { kind: 'heading', text: 'Read the following passage carefully and answer questions 1–6.' },
        {
          kind: 'lines',
          lines: [
            '[1] In the twenty-first century, education no longer ends when students graduate from high school or university. Rapid changes in science, technology, and the labour market mean that workers must continuously update their skills throughout life. This ongoing process, known as lifelong learning, helps individuals stay adaptable, confident, and engaged in their communities.',
            '',
            '[2] Digital technology has dramatically widened access to learning resources. Free online courses, open digital libraries, and interactive simulations allow learners in remote regions to study subjects that were once available only in major cities. However, having access to information is not the same as knowing how to learn effectively. Learners also need digital literacy—the ability to locate, evaluate, and responsibly use online information.',
            '',
            '[3] Without digital literacy, students can easily be misled by inaccurate articles or distracted by constant notifications. Teachers therefore play a vital role beyond delivering textbook facts: they guide learners to verify sources, ask critical questions, and balance screen-based study with face-to-face discussion. When technology is paired with thoughtful guidance, lifelong learning becomes both accessible and meaningful.',
          ],
        },
        { kind: 'heading', text: 'COMPREHENSION QUESTIONS' },
        {
          kind: 'lines',
          lines: [
            '1. What is the main idea of the passage?',
            '   A. University degrees are no longer useful today.',
            '   B. Lifelong learning requires both digital access and strong digital literacy.',
            '   C. Online courses will completely replace classroom teachers.',
            '   D. Students in cities learn faster than students in remote areas.',
            '2. According to paragraph 2, which benefit of digital technology is mentioned?',
            '   A. It reduces the cost of building schools.          B. It eliminates all distractions during study.',
            '   C. It widens access to resources for remote learners. D. It guarantees high exam scores.',
            '3. The word "they" in paragraph 3 refers to ______.     A. students   B. articles   C. teachers   D. facts',
            '4. The word "verify" in paragraph 3 is closest in meaning to ______.  A. check accuracy   B. delete   C. memorize   D. ignore',
            '5. (Short answer) List TWO skills included in digital literacy mentioned in paragraph 2.',
            '6. (Inference) Why does the author believe teachers remain essential even when online resources are free?',
          ],
        },
        { kind: 'pageBreak' },
        { kind: 'heading', text: 'ANSWER KEY — READING COMPREHENSION' },
        {
          kind: 'lines',
          lines: [
            '1. B — The passage explains why lifelong learning matters and emphasizes combining digital access with digital literacy and teacher guidance.',
            '2. C — Paragraph 2 states that online courses and digital libraries allow learners in remote regions to study subjects previously available only in major cities.',
            '3. C — "Teachers therefore play a vital role...: they guide learners..."',
            '4. A — "verify sources" means to check whether sources are accurate and trustworthy.',
            '5. Any two of: locating, evaluating, and responsibly using online information.',
            '6. Because learners need human guidance to verify sources, think critically, avoid misinformation/distractions, and engage in face-to-face discussion.',
          ],
        },
      ],
    });
  }

  if (sampleId === 'sample-eng-05-transformation') {
    return buildFromSpec({
      subjectLabel: 'Tiếng Anh',
      gradeLabel: 'Lớp 11',
      docTypeLabel: 'Phiếu bài tập · Sentence transformation',
      title: 'SENTENCE TRANSFORMATION WORKSHEET: HIGH-SCHOOL GRAMMAR',
      subtitle: 'Grade 11  |  Rewrite each sentence so that it keeps the same meaning as the original.',
      blocks: [
        { kind: 'heading', text: 'Rewrite the following sentences using the prompts given (10 items × 1.0 point)' },
        {
          kind: 'lines',
          lines: [
            '1. They started building the new community library three years ago.',
            '   → They have _______________________________________________________________________.',
            '2. "I will send you the geography slides tonight," Lan told Minh.',
            '   → Lan told Minh ____________________________________________________________________.',
            '3. People speak English in more than fifty countries around the world.',
            '   → English __________________________________________________________________________.',
            '4. Because the weather was stormy, the outdoor field trip was postponed.',
            '   → Because of _______________________________________________________________________.',
            '5. I do not have a spare charger, so I cannot lend you one right now.',
            '   → If I _____________________________________________________________________________.',
            '6. Although the exam was challenging, most students completed it on time.',
            '   → In spite of ______________________________________________________________________.',
            '7. This is the most informative documentary I have ever watched.',
            '   → I have never _____________________________________________________________________.',
            '8. She rarely forgets to double-check her essay before submitting it.',
            '   → Rarely ___________________________________________________________________________.',
            '9. It is necessary for teenagers to get at least eight hours of sleep.',
            '   → Teenagers ought __________________________________________________________________.',
            '10. The student finished the experiment. Then he wrote a detailed lab report.',
            '   → Having ___________________________________________________________________________.',
          ],
        },
        { kind: 'pageBreak' },
        { kind: 'heading', text: 'ANSWER KEY — SENTENCE TRANSFORMATION' },
        {
          kind: 'lines',
          lines: [
            '1. They have been building / have built the new community library for three years.',
            '2. Lan told Minh (that) she would send him the geography slides that night.',
            '3. English is spoken in more than fifty countries around the world.',
            '4. Because of the stormy weather, the outdoor field trip was postponed.',
            '5. If I had a spare charger, I could / would lend you one right now.',
            '6. In spite of the challenging exam / the fact that the exam was challenging, most students completed it on time.',
            '7. I have never watched a more informative documentary (than this one) / such an informative documentary.',
            '8. Rarely does she forget to double-check her essay before submitting it.',
            '9. Teenagers ought to get at least eight hours of sleep.',
            '10. Having finished the experiment, the student wrote a detailed lab report.',
          ],
        },
      ],
    });
  }

  if (sampleId === 'sample-eng-06-error-correction') {
    return buildFromSpec({
      subjectLabel: 'Tiếng Anh',
      gradeLabel: 'Lớp 10',
      docTypeLabel: 'Phiếu bài tập · Error correction',
      title: 'ERROR CORRECTION WORKSHEET: COMMON GRAMMAR & USAGE MISTAKES',
      subtitle: 'Grade 10  |  Each sentence contains ONE error in [A], [B], [C], or [D]. Identify and correct it.',
      blocks: [
        { kind: 'heading', text: 'Find the mistake in each sentence and write the correction on the right' },
        {
          kind: 'lines',
          lines: [
            '1. Neither the teacher [A] nor the students [B] was [C] aware of the schedule change [D].       → ____________',
            '2. She enjoys [A] to read [B] historical novels in her free time [C] every weekend [D].        → ____________',
            '3. Despite of [A] the heavy rain [B], the charity run [C] attracted over 300 participants [D]. → ____________',
            '4. My brother gave me [A] many useful [B] advices [C] before my job interview [D].             → ____________',
            '5. The museum [A] which we visited it [B] last Sunday [C] houses ancient bronze drums [D].     → ____________',
            '6. If you heat [A] ice to 0°C, it [B] melted [C] into liquid water [D].                        → ____________',
            '7. Look at [A] the news! The team [B] have won [C] the national robotics prize yesterday [D].  → ____________',
            '8. This smartphone is [A] much more cheaper [B] than [C] the model released last year [D].     → ____________',
            '9. Every students [A] in the laboratory [B] must wear [C] protective goggles [D].              → ____________',
            '10. He spoke [A] so quiet [B] that nobody in the back row [C] could hear him clearly [D].      → ____________',
          ],
        },
        { kind: 'pageBreak' },
        { kind: 'heading', text: 'ANSWER KEY — ERROR CORRECTION' },
        {
          kind: 'table',
          headers: ['Item', 'Error', 'Correction', 'Grammar Rule'],
          colWeights: [0.8, 1.0, 2.2, 4.0],
          rows: [
            ['1', 'C', 'were', 'With "neither ... nor", the verb agrees with the nearer subject ("the students").'],
            ['2', 'B', 'reading', '"enjoy" is followed by a gerund (V-ing).'],
            ['3', 'A', 'Despite / In spite of', '"Despite" is never followed by "of".'],
            ['4', 'C', 'advice (much useful advice)', '"advice" is an uncountable noun (also change "many" → "much").'],
            ['5', 'B', 'which we visited', 'Do not repeat the object pronoun "it" in a relative clause.'],
            ['6', 'C', 'melts', 'Zero conditional (scientific fact) uses present simple in both clauses.'],
            ['7', 'C', 'won', 'Past simple ("won") is required with definite past time "yesterday".'],
            ['8', 'B', 'much cheaper', 'Avoid double comparatives ("more cheaper" is incorrect).'],
            ['9', 'A', 'Every student', '"Every" is followed by a singular countable noun.'],
            ['10', 'B', 'so quietly', 'Use an adverb ("quietly") to modify the verb "spoke".'],
          ],
        },
      ],
    });
  }

  if (sampleId === 'sample-eng-07-word-formation') {
    return buildFromSpec({
      subjectLabel: 'Tiếng Anh',
      gradeLabel: 'Lớp 11',
      docTypeLabel: 'Phiếu bài tập · Word formation',
      title: 'WORD FORMATION WORKSHEET: PREFIXES, SUFFIXES & PARTS OF SPEECH',
      subtitle: 'Grade 11  |  Give the correct form of the word in CAPITALS to complete each sentence.',
      blocks: [
        { kind: 'heading', text: 'Part A. Sentence-level Word Formation (Items 1–8)' },
        {
          kind: 'lines',
          lines: [
            '1. Regular exercise brings both physical and mental ________________ to teenagers.       (BENEFICIAL)',
            '2. The school organized a science fair to encourage students\' ________________.          (CREATE)',
            '3. Leaving tap water running while brushing teeth is an ________________ habit.          (RESPONSIBLE)',
            '4. Clear ________________ between team members helped the project finish early.          (COMMUNICATE)',
            '5. Hoi An Ancient Town is ________________ known for its lantern-lit streets.            (WORLD)',
            '6. The municipality plans to ________________ the main road before the new school year.  (WIDE)',
            '7. Volunteers worked ________________ all afternoon to clean up the local park.          (TIRE)',
            '8. Renewable energy offers a ________________ solution to rising electricity demand.     (SUSTAIN)',
          ],
        },
        { kind: 'heading', text: 'Part B. Contextual Mini-Paragraph (Items 9–10)' },
        {
          kind: 'lines',
          lines: [
            'Learning a foreign language opens doors to cultural (9) ________________ (UNDERSTAND) and global friendship. Students who practise daily notice a steady (10) ________________ (IMPROVE) in both fluency and confidence.',
          ],
        },
        { kind: 'pageBreak' },
        { kind: 'heading', text: 'ANSWER KEY — WORD FORMATION' },
        {
          kind: 'table',
          headers: ['#', 'Root Word', 'Correct Form', 'Part of Speech'],
          colWeights: [0.7, 2.0, 2.3, 3.0],
          rows: [
            ['1', 'BENEFICIAL', 'benefits', 'Plural noun'],
            ['2', 'CREATE', 'creativity', 'Abstract noun (after possessive)'],
            ['3', 'RESPONSIBLE', 'irresponsible', 'Negative adjective (prefix ir-)'],
            ['4', 'COMMUNICATE', 'communication', 'Noun (subject of sentence)'],
            ['5', 'WORLD', 'worldwide', 'Adverb modifying "known"'],
            ['6', 'WIDE', 'widen', 'Verb (after "plans to")'],
            ['7', 'TIRE', 'tirelessly', 'Adverb modifying "worked"'],
            ['8', 'SUSTAIN', 'sustainable', 'Adjective modifying "solution"'],
            ['9', 'UNDERSTAND', 'understanding', 'Noun ("cultural understanding")'],
            ['10', 'IMPROVE', 'improvement', 'Singular noun ("a steady improvement")'],
          ],
        },
      ],
    });
  }

  if (sampleId === 'sample-eng-08-matching') {
    return buildFromSpec({
      subjectLabel: 'Tiếng Anh',
      gradeLabel: 'Lớp 10',
      docTypeLabel: 'Phiếu bài tập · Matching',
      title: 'MATCHING EXERCISES: DEFINITIONS, COLLOCATIONS & EXCHANGES',
      subtitle: 'Grade 10  |  Three structured matching tasks ready for classroom or PDF annotation practice.',
      blocks: [
        { kind: 'heading', text: 'Task 1. Match each vocabulary item (1–5) with its correct definition (A–E)' },
        {
          kind: 'table',
          headers: ['Column A (Word)', 'Match', 'Column B (Definition)'],
          colWeights: [2.2, 1.0, 4.8],
          rows: [
            ['1. volunteer (n)', '1 – ___', 'A. Traditional buildings, art, and customs passed down through generations.'],
            ['2. heritage (n)', '2 – ___', 'B. A person who freely offers to help a community without being paid.'],
            ['3. innovation (n)', '3 – ___', 'C. Able to continue over a long period without harming the environment.'],
            ['4. sustainable (adj)', '4 – ___', 'D. The introduction of new ideas, methods, or useful inventions.'],
            ['5. scholarship (n)', '5 – ___', 'E. Financial support awarded to a student based on academic merit or need.'],
          ],
        },
        { kind: 'heading', text: 'Task 2. Match the verbs (6–9) with the nouns (A–D) to form natural collocations' },
        {
          kind: 'table',
          headers: ['Verb', 'Match', 'Noun Phrase'],
          colWeights: [2.0, 1.0, 5.0],
          rows: [
            ['6. raise', '6 – ___', 'A. a positive impact on the community'],
            ['7. make', '7 – ___', 'B. public awareness of water conservation'],
            ['8. conduct', '8 – ___', 'C. an active role in group discussions'],
            ['9. play', '9 – ___', 'D. a survey on students\' reading habits'],
          ],
        },
        { kind: 'pageBreak' },
        { kind: 'heading', text: 'ANSWER KEY — MATCHING EXERCISES' },
        {
          kind: 'lines',
          lines: [
            'Task 1 (Definitions):  1 – B   |   2 – A   |   3 – D   |   4 – C   |   5 – E',
            'Task 2 (Collocations): 6 – B (raise public awareness)  |  7 – A (make a positive impact)  |  8 – D (conduct a survey)  |  9 – C (play an active role)',
          ],
        },
      ],
    });
  }

  if (sampleId === 'sample-eng-09-writing') {
    const grading = buildRubricSession('English 12 Writing Task (Manual Rubric)', 'Tiếng Anh', '12A1', [
      { id: 'ew-tr', label: 'Task Response / Content', maxScore: 2.5 },
      { id: 'ew-cc', label: 'Coherence & Cohesion', maxScore: 2.5 },
      { id: 'ew-lr', label: 'Lexical Resource', maxScore: 2.5 },
      { id: 'ew-ga', label: 'Grammatical Range & Accuracy', maxScore: 2.5 },
    ]);
    return buildFromSpec(
      {
        subjectLabel: 'Tiếng Anh',
        gradeLabel: 'Lớp 12',
        docTypeLabel: 'Phiếu luyện kỹ năng · Writing',
        title: 'ENGLISH WRITING TASK SHEET: OPINION ESSAY & TEACHER RUBRIC',
        subtitle: 'Grade 12  |  Word count: 150–180 words  |  Teacher manual scoring across 4 standard criteria.',
        blocks: [
          { kind: 'heading', text: 'WRITING PROMPT' },
          {
            kind: 'callout',
            title: 'Topic: Balanced Use of Digital Devices in High School',
            text: 'Write an essay (150–180 words) expressing your opinion on the following statement: "Digital devices such as tablets and laptops can improve high-school learning if students use them with clear study rules." Give at least TWO supporting reasons and specific examples.',
            tone: 'teal',
          },
          { kind: 'heading', text: 'SUGGESTED OUTLINE' },
          {
            kind: 'lines',
            lines: [
              '• Introduction: Paraphrase the topic and state your clear opinion (thesis statement).',
              '• Body Paragraph 1: First benefit (e.g., fast access to diagrams, dictionaries, and interactive simulations) + example.',
              '• Body Paragraph 2: Importance of clear study rules (avoiding distractions, protecting eyesight) + example.',
              '• Conclusion: Summarize your main points and give a brief recommendation.',
            ],
          },
          { kind: 'writingLines', title: 'STUDENT WRITING SPACE:', count: 11 },
          { kind: 'pageBreak' },
          { kind: 'heading', text: 'TEACHER MANUAL SCORING RUBRIC & FEEDBACK GUIDE (10 POINTS)' },
          {
            kind: 'table',
            headers: ['Criterion', 'Max', 'Band Descriptors for Teacher Manual Assessment'],
            colWeights: [2.2, 0.8, 5.0],
            rows: [
              ['1. Task Response', '2.5', 'Addresses the prompt directly, states a clear stance, provides 2 well-developed reasons & relevant examples within 150–180 words.'],
              ['2. Coherence & Cohesion', '2.5', 'Clear paragraphing (Intro – Body – Conclusion); smooth linking devices (Furthermore, However, In conclusion) without overuse.'],
              ['3. Lexical Resource', '2.5', 'Accurate topic vocabulary (digital literacy, distraction, academic focus, screen time); accurate spelling and collocations.'],
              ['4. Grammatical Range & Accuracy', '2.5', 'Varied simple, compound, and complex sentences; minimal errors in tenses, subject-verb agreement, and punctuation.'],
            ],
          },
          {
            kind: 'callout',
            title: 'Manual Grading Note',
            text: 'PDF EDU STUDIO supports teachers in annotating student essays, applying stamps, and scoring each criterion manually in the Grading Panel (no automated essay scoring).',
            tone: 'slate',
          },
        ],
      },
      (pageId) =>
        makeDiagramObject('eng9-rubric', 'eng-writing-rubric', 'english', pageId, 355, 622, 200, 118, 2),
      grading
    );
  }

  if (sampleId === 'sample-eng-10-listening') {
    return buildFromSpec({
      subjectLabel: 'Tiếng Anh',
      gradeLabel: 'Lớp 11',
      docTypeLabel: 'Phiếu luyện kỹ năng · Listening',
      title: 'LISTENING WORKSHEET: COMMUNITY VOLUNTEER DAY',
      subtitle: 'Grade 11  |  Includes Pre-Listening, Note Completion, True/False & Teacher Audio Script (Page 2).',
      blocks: [
        {
          kind: 'callout',
          title: 'Audio Resource Notice (Transparent Teacher Setup)',
          text: 'This printable PDF worksheet does not bundle a built-in MP3 audio file. Teachers may read the verified Teacher Audio Script aloud on Page 2, play their own classroom audio recording, or insert a real audio URL / QR link box using the English toolbar ("Liên kết âm thanh").',
          tone: 'amber',
        },
        { kind: 'heading', text: 'Part 1. Pre-Listening Discussion (2 minutes)' },
        {
          kind: 'lines',
          lines: [
            'Have you ever joined a community clean-up or book-donation event? What skills can students learn from volunteering?',
          ],
        },
        { kind: 'heading', text: 'Part 2. Listen and complete the event notes (NO MORE THAN TWO WORDS AND/OR A NUMBER)' },
        {
          kind: 'table',
          headers: ['Event Detail', 'Student Notes'],
          colWeights: [2.6, 5.4],
          rows: [
            ['Event Name', 'Green Saturday Community Day'],
            ['Date & Meeting Time', 'Saturday, October 18 at (1) ________________ a.m.'],
            ['Meeting Location', 'Main gate of (2) ________________ Park'],
            ['Main Activities', 'Planting trees, sorting recyclables, and donating (3) ________________'],
            ['Items to Bring', 'A reusable water bottle, sun hat, and (4) ________________'],
            ['Contact Person', 'Ms. Mai — Youth Club Coordinator (Room (5) ________________)'],
          ],
        },
        { kind: 'heading', text: 'Part 3. Listen again and decide whether each statement is True (T) or False (F)' },
        {
          kind: 'lines',
          lines: [
            '6. Only Grade 12 students are allowed to register for the volunteer event.           [ T / F ]',
            '7. The school canteen will provide free lunch boxes for all volunteers at noon.     [ T / F ]',
            '8. Volunteers will receive a participation certificate for their community record.   [ T / F ]',
          ],
        },
        { kind: 'pageBreak' },
        { kind: 'heading', text: 'TEACHER AUDIO SCRIPT (READ TWICE AT NATURAL PACE)' },
        {
          kind: 'quote',
          title: 'School Announcement — Green Saturday Community Day (~120 words)',
          lines: [
            '“Good morning, everyone. This is Ms. Mai from the School Youth Club with an announcement about our upcoming Green Saturday Community Day. The event takes place on Saturday, October 18. All volunteers should gather at 7:30 a.m. at the main gate of Hoa Binh Park. During the morning, student teams will plant young trees along the walking path, sort recyclable bottles, and collect donated textbooks for primary schools in highland districts. Students from Grades 10, 11, and 12 are all welcome to sign up. Please remember to bring a reusable water bottle, a sun hat, and gardening gloves. Free lunch boxes will be provided at noon, and every participant will receive a certificate. Sign up at Room 204 before Thursday!”',
          ],
          source: 'Teacher Script — Original instructional dialogue for classroom listening practice.',
        },
        { kind: 'heading', text: 'ANSWER KEY' },
        {
          kind: 'lines',
          lines: [
            'Part 2: (1) 7:30   |   (2) Hoa Binh   |   (3) textbooks   |   (4) gardening gloves   |   (5) 204',
            'Part 3: 6. False (Grades 10, 11, and 12 are all welcome)   |   7. True   |   8. True',
          ],
        },
      ],
    });
  }

  if (sampleId === 'sample-eng-11-speaking') {
    const grading = buildRubricSession('English 12 Speaking Assessment (Manual Rubric)', 'Tiếng Anh', '12A2', [
      { id: 'es-fc', label: 'Fluency & Coherence', maxScore: 2.5 },
      { id: 'es-pr', label: 'Pronunciation & Intonation', maxScore: 2.5 },
      { id: 'es-lr', label: 'Lexical Resource', maxScore: 2.5 },
      { id: 'es-gr', label: 'Grammatical Range & Accuracy', maxScore: 2.5 },
    ]);
    return buildFromSpec(
      {
        subjectLabel: 'Tiếng Anh',
        gradeLabel: 'Lớp 12',
        docTypeLabel: 'Phiếu luyện kỹ năng · Speaking',
        title: 'ENGLISH SPEAKING TASK SHEET: CUE CARD & MANUAL RUBRIC',
        subtitle: 'Grade 12  |  1-minute preparation · 2-minute individual talk · 2-minute teacher Q&A.',
        blocks: [
          { kind: 'heading', text: 'Part 1. Individual Long Turn — Student Cue Card' },
          {
            kind: 'callout',
            title: 'TOPIC: Describe a practical green habit that you or your family practise',
            text: 'You should say: (1) what the green habit is; (2) when and how you started doing it; (3) how it benefits your family or the environment; and explain why you think other teenagers should adopt this habit.',
            tone: 'teal',
          },
          { kind: 'heading', text: 'Part 2. Follow-Up Discussion Questions (Teacher – Student Interaction)' },
          {
            kind: 'lines',
            lines: [
              '1. What makes it difficult for some people to maintain eco-friendly habits every day?',
              '2. How can schools encourage students to save electricity and reduce plastic waste?',
              '3. Do you think environmental protection depends more on individuals or on governments? Why?',
            ],
          },
          { kind: 'writingLines', title: 'Student 1-Minute Preparation Notes (Keywords only):', count: 4 },
          { kind: 'spacer', height: 148 },
          { kind: 'pageBreak' },
          { kind: 'heading', text: 'TEACHER MANUAL SPEAKING RUBRIC (10 POINTS)' },
          {
            kind: 'table',
            headers: ['Criterion', 'Max', 'Observable Performance Indicators (Teacher Manual Assessment)'],
            colWeights: [2.2, 0.8, 5.0],
            rows: [
              ['1. Fluency & Coherence', '2.5', 'Speaks smoothly with minimal hesitation; connects ideas clearly using discourse markers (First of all, In addition, As a result).'],
              ['2. Pronunciation & Intonation', '2.5', 'Clear word endings, accurate word stress, natural sentence rhythm and understandable intonation.'],
              ['3. Lexical Resource', '2.5', 'Uses appropriate topic vocabulary (reusable, reduce waste, energy-saving, eco-friendly) and paraphrases effectively.'],
              ['4. Grammatical Range & Accuracy', '2.5', 'Combines simple and complex structures accurately (conditionals, relative clauses, modal verbs) with few slips.'],
            ],
          },
          {
            kind: 'callout',
            title: 'Manual Grading Note',
            text: 'Speaking tasks are assessed directly by the teacher in class using the 4 criteria above in the Grading Panel. This tool does not perform automated speech scoring.',
            tone: 'slate',
          },
        ],
      },
      (pageId) =>
        makeDiagramObject('eng11-feedback', 'eng-teacher-feedback', 'english', pageId, 86, 616, 420, 134, 2),
      grading
    );
  }

  // =========================================================================
  // ADDITIONAL 2 GEOGRAPHY SAMPLES (sample-geo-09-short, sample-geo-10-essay)
  // =========================================================================
  if (sampleId === 'sample-geo-09-short') {
    const grading = buildMcqSession('Phiếu trả lời ngắn Địa lí 12 – Số liệu giả định', 'Địa lí', '12A1', [
      { number: 1, kind: 'short', answerKey: '65', maxScore: 2.5 },
      { number: 2, kind: 'short', answerKey: '18,6', maxScore: 2.5 },
      { number: 3, kind: 'short', answerKey: '26', maxScore: 2.5 },
      { number: 4, kind: 'short', answerKey: '125', maxScore: 2.5 },
    ]);
    return buildFromSpec(
      {
        subjectLabel: 'Địa lí',
        gradeLabel: 'Lớp 12',
        docTypeLabel: 'Phiếu bài tập · Trả lời ngắn',
        title: 'BÀI TẬP TRẢ LỜI NGẮN ĐỊA LÍ 12: TÍNH TOÁN CHỈ TIÊU TỰ NHIÊN & KINH TẾ',
        subtitle: 'Định dạng THPT 2025  |  Sử dụng Số liệu giả định minh họa kỹ năng tính toán địa lí.',
        blocks: [
          {
            kind: 'callout',
            title: 'Lưu ý số liệu',
            text: 'Toàn bộ số liệu trong phiếu dưới đây là Số liệu giả định nhằm rèn luyện kỹ năng tính biên độ nhiệt, năng suất cây trồng, cán cân xuất nhập khẩu và tốc độ tăng trưởng theo định dạng trả lời ngắn.',
            tone: 'amber',
          },
          { kind: 'heading', text: 'Tính và ghi kết quả làm tròn theo yêu cầu của từng câu' },
          {
            kind: 'lines',
            lines: [
              'Câu 1 (Số liệu giả định). Một vùng sản xuất có diện tích gieo trồng lúa năm 2024 là 400 nghìn ha và sản lượng lúa đạt 2 600 nghìn tấn. Tính năng suất lúa của vùng theo đơn vị tạ/ha (làm tròn đến hàng đơn vị).',
              '   Đáp số: ________________ tạ/ha',
              'Câu 2 (Số liệu giả định). Tại một trạm khí tượng vùng núi, nhiệt độ trung bình tháng nóng nhất (tháng 7) là 29,4°C và tháng lạnh nhất (tháng 1) là 10,8°C. Tính biên độ nhiệt độ năm của trạm đó (đơn vị °C, làm tròn 1 chữ số thập phân).',
              '   Đáp số: ________________ °C',
              'Câu 3 (Số liệu giả định). Năm 2024, một địa phương có kim ngạch xuất khẩu đạt 148 tỉ USD và kim ngạch nhập khẩu đạt 122 tỉ USD. Tính cán cân xuất nhập khẩu của địa phương đó (đơn vị tỉ USD).',
              '   Đáp số: ________________ tỉ USD',
              'Câu 4 (Số liệu giả định). Sản lượng điện của một khu vực tăng từ 200 tỉ kWh (năm gốc 2020 = 100%) lên 250 tỉ kWh (năm 2024). Tính chỉ số tốc độ tăng trưởng sản lượng điện năm 2024 so với năm 2020 (đơn vị %).',
              '   Đáp số: ________________ %',
            ],
          },
          { kind: 'pageBreak' },
          { kind: 'heading', text: 'ĐÁP ÁN & CÔNG THỨC KIỂM CHỨNG' },
          {
            kind: 'table',
            headers: ['Câu', 'Đáp số', 'Công thức & Phép tính'],
            colWeights: [0.9, 1.3, 5.8],
            rows: [
              ['Câu 1', '65', '1 tấn = 10 tạ → Năng suất = (2600 × 10) / 400 = 26 000 / 400 = 65 tạ/ha.'],
              ['Câu 2', '18,6', 'Biên độ nhiệt năm = T_max − T_min = 29,4 − 10,8 = 18,6°C.'],
              ['Câu 3', '26', 'Cán cân XNK = Xuất khẩu − Nhập khẩu = 148 − 122 = +26 tỉ USD (xuất siêu).'],
              ['Câu 4', '125', 'Tốc độ tăng trưởng = (250 / 200) × 100% = 125%.'],
            ],
          },
        ],
      },
      () => [],
      grading
    );
  }

  if (sampleId === 'sample-geo-10-essay') {
    const grading = buildRubricSession('Đề tự luận Địa lí 12 – Kinh tế biển & Nông nghiệp', 'Địa lí', '12A2', [
      { id: 'g10-1', label: 'Câu 1: Tiềm năng và giải pháp kinh tế biển đảo', maxScore: 5.0 },
      { id: 'g10-2', label: 'Câu 2: Phát triển nông nghiệp xanh, bền vững', maxScore: 5.0 },
    ]);
    return buildFromSpec(
      {
        subjectLabel: 'Địa lí',
        gradeLabel: 'Lớp 12',
        docTypeLabel: 'Đề kiểm tra · Tự luận',
        title: 'ĐỀ TỰ LUẬN ĐỊA LÍ 12: KINH TẾ BIỂN ĐẢO & NÔNG NGHIỆP BỀN VỮNG',
        subtitle: 'Thời gian: 45 phút  |  Thang điểm: 10,0  |  Kèm khung chấm tự luận cho giáo viên.',
        blocks: [
          { kind: 'heading', text: 'Câu 1 (5,0 điểm). Phát triển tổng hợp kinh tế biển gắn với bảo vệ chủ quyền' },
          {
            kind: 'lines',
            lines: [
              'a) Trình bày 4 ngành kinh tế biển chủ lực của nước ta (khai thác – nuôi trồng thủy sản, giao thông vận tải biển, du lịch biển đảo, năng lượng và tài nguyên biển).',
              'b) Giải thích vì sao phát triển kinh tế biển nước ta phải đi đôi với bảo vệ môi trường biển và giữ vững chủ quyền, quyền chủ quyền trên Biển Đông.',
            ],
          },
          { kind: 'heading', text: 'Câu 2 (5,0 điểm). Chuyển đổi sang nông nghiệp xanh và thích ứng biến đổi khí hậu' },
          {
            kind: 'lines',
            lines: [
              'a) Nêu những thách thức chính của biến đổi khí hậu (xâm nhập mặn, hạn hán, bão lũ cực đoan) đối với sản xuất nông nghiệp ở Đồng bằng sông Cửu Long.',
              'b) Đề xuất 3 giải pháp thực tiễn nhằm phát triển nông nghiệp sinh thái, nâng cao giá trị gia tăng cho nông sản vùng đồng bằng.',
            ],
          },
          { kind: 'writingLines', title: 'Khung nhận xét của giáo viên:', count: 5 },
          { kind: 'pageBreak' },
          { kind: 'heading', text: 'HƯỚNG DẪN CHẤM TỰ LUẬN ĐỊA LÍ 12 (10,0 ĐIỂM)' },
          {
            kind: 'table',
            headers: ['Câu', 'Điểm', 'Yêu cầu nội dung chính'],
            colWeights: [1.0, 1.0, 6.0],
            rows: [
              ['Câu 1', '5,0', 'a) Nêu đúng đặc điểm và vai trò 4 nhóm ngành kinh tế biển chủ lực (3,0đ).\nb) Môi trường biển dễ bị tổn thương (rác thải nhựa, khai thác tận diệt); hệ thống đảo và vùng biển có ý nghĩa chiến lược về quốc phòng – an ninh và tuyến hàng hải quốc tế (2,0đ).'],
              ['Câu 2', '5,0', 'a) Xâm nhập mặn sâu vào nội đồng mùa khô, sụt lún đất, sạt lở bờ sông/bờ biển, thay đổi chế độ dòng chảy sông Mê Kông (2,5đ).\nb) Chuyển đổi cơ cấu giống chịu mặn/chịu hạn; ứng dụng nông nghiệp thông minh – tưới tiết kiệm; xây dựng chuỗi liên kết chế biến sâu, truy xuất nguồn gốc và bảo vệ rừng ngập mặn ven biển (2,5đ).'],
            ],
          },
        ],
      },
      () => [],
      grading
    );
  }

  // =========================================================================
  // ADDITIONAL 2 HISTORY SAMPLES (sample-his-09-short, sample-his-10-cause-effect)
  // =========================================================================
  if (sampleId === 'sample-his-09-short') {
    const grading = buildMcqSession('Phiếu trả lời ngắn Lịch sử 12 – Mốc sự kiện xác thực', 'Lịch sử', '12A1', [
      { number: 1, kind: 'short', answerKey: '1945', maxScore: 2.5 },
      { number: 2, kind: 'short', answerKey: '1954', maxScore: 2.5 },
      { number: 3, kind: 'short', answerKey: '1975', maxScore: 2.5 },
      { number: 4, kind: 'short', answerKey: '1986', maxScore: 2.5 },
    ]);
    return buildFromSpec(
      {
        subjectLabel: 'Lịch sử',
        gradeLabel: 'Lớp 12',
        docTypeLabel: 'Phiếu bài tập · Trả lời ngắn',
        title: 'BÀI TẬP TRẢ LỜI NGẮN LỊCH SỬ 12: CÁC MỐC SỰ KIỆN TRỌNG ĐẠI VIỆT NAM',
        subtitle: 'Môn Lịch sử lớp 12  |  Xác định chính xác mốc năm và văn kiện lịch sử xác thực.',
        blocks: [
          { kind: 'heading', text: 'Điền mốc năm (4 chữ số) tương ứng với mỗi sự kiện lịch sử dưới đây' },
          {
            kind: 'lines',
            lines: [
              'Câu 1. Chủ tịch Hồ Chí Minh đọc bản Tuyên ngôn Độc lập tại Quảng trường Ba Đình (Hà Nội), khai sinh nước Việt Nam Dân chủ Cộng hòa vào ngày 2 tháng 9 năm nào?',
              '   Đáp số: Năm ________________',
              'Câu 2. Chiến thắng lịch sử Điện Biên Phủ ("lừng lẫy năm châu, chấn động địa cầu") kết thúc thắng lợi vào ngày 7 tháng 5 năm nào?',
              '   Đáp số: Năm ________________',
              'Câu 3. Chiến dịch Hồ Chí Minh toàn thắng vào ngày 30 tháng 4 năm nào, giải phóng hoàn toàn miền Nam, thống nhất đất nước?',
              '   Đáp số: Năm ________________',
              'Câu 4. Đại hội đại biểu toàn quốc lần thứ VI của Đảng Cộng sản Việt Nam đề ra đường lối Đổi mới toàn diện đất nước vào tháng 12 năm nào?',
              '   Đáp số: Năm ________________',
            ],
          },
          { kind: 'heading', text: 'Phần mở rộng: Nối nhanh sự kiện với ý nghĩa lịch sử' },
          {
            kind: 'lines',
            lines: [
              'Giáo viên có thể dùng công cụ Vẽ đường nối hoặc Chú thích trực tiếp trên PDF để yêu cầu học sinh trình bày ý nghĩa của từng mốc 1945, 1954, 1975, 1986.',
            ],
          },
          { kind: 'pageBreak' },
          { kind: 'heading', text: 'ĐÁP ÁN XÁC THỰC' },
          {
            kind: 'table',
            headers: ['Câu', 'Mốc năm', 'Ý nghĩa lịch sử cốt lõi'],
            colWeights: [0.9, 1.3, 5.8],
            rows: [
              ['Câu 1', '1945', 'Mở ra kỉ nguyên độc lập, tự do của dân tộc Việt Nam; nhân dân từ thân phận nô lệ trở thành người làm chủ đất nước.'],
              ['Câu 2', '1954', 'Đập tan kế hoạch Nava, tạo cơ sở quyết định dẫn tới kí kết Hiệp định Giơ-ne-vơ chấm dứt chiến tranh xâm lược của thực dân Pháp ở Đông Dương.'],
              ['Câu 3', '1975', 'Kết thúc thắng lợi cuộc kháng chiến chống Mỹ, cứu nước, hoàn thành cách mạng dân tộc dân chủ nhân dân trong cả nước.'],
              ['Câu 4', '1986', 'Khởi xướng công cuộc Đổi mới, đưa đất nước từng bước thoát khỏi khủng hoảng kinh tế – xã hội và hội nhập quốc tế.'],
            ],
          },
        ],
      },
      () => [],
      grading
    );
  }

  if (sampleId === 'sample-his-10-cause-effect') {
    return buildFromSpec({
      subjectLabel: 'Lịch sử',
      gradeLabel: 'Lớp 11',
      docTypeLabel: 'Phiếu học tập · Nguyên nhân – Kết quả',
      title: 'PHIẾU PHÂN TÍCH NGUYÊN NHÂN – KẾT QUẢ: CẢI CÁCH & BẢO VỆ TỔ QUỐC',
      subtitle: 'Môn Lịch sử lớp 11  |  Rèn kỹ năng lập chuỗi nhân – quả trong phân tích sự kiện lịch sử Việt Nam.',
      blocks: [
        { kind: 'heading', text: 'Nhiệm vụ 1. Hoàn thiện bảng Nguyên nhân – Diễn biến chính – Kết quả' },
        {
          kind: 'table',
          headers: ['Sự kiện lịch sử', 'Nguyên nhân / Bối cảnh', 'Kết quả & Ý nghĩa lịch sử'],
          colWeights: [2.2, 2.8, 3.0],
          rows: [
            ['Chiến thắng Bạch Đằng năm 938 (Ngô Quyền)', 'Quân Nam Hán kéo sang xâm lược; Ngô Quyền chủ động bày trận địa cọc ngầm trên sông Bạch Đằng.', '______________________________________\n______________________________________'],
            ['Cuộc cải cách hành chính của vua Lê Thánh Tông (thế kỉ XV)', 'Yêu cầu khắc phục tình trạng phân quyền, quan liêu và tăng cường hiệu lực bộ máy nhà nước quân chủ.', '______________________________________\n______________________________________'],
            ['Cuộc cải cách của vua Minh Mạng (nửa đầu thế kỉ XIX)', 'Đất nước thống nhất rộng lớn từ Bắc chí Nam, cần thống nhất đơn vị hành chính và luật pháp.', '______________________________________\n______________________________________'],
          ],
        },
        { kind: 'heading', text: 'Nhiệm vụ 2. Câu hỏi liên hệ bài học lịch sử' },
        {
          kind: 'lines',
          lines: [
            'Từ các cuộc cải cách hành chính thời Lê Thánh Tông và Minh Mạng, hãy rút ra 2 bài học kinh nghiệm có giá trị tham khảo đối với công tác quản lí hành chính và tuyển chọn nhân tài ngày nay.',
          ],
        },
        { kind: 'pageBreak' },
        { kind: 'heading', text: 'GỢI Ý ĐÁP ÁN PHÂN TÍCH NHÂN – QUẢ' },
        {
          kind: 'table',
          headers: ['Sự kiện', 'Kết quả & Ý nghĩa chính'],
          colWeights: [2.2, 5.8],
          rows: [
            ['Bạch Đằng (938)', 'Đập tan hoàn toàn ý chí xâm lược của quân Nam Hán, chấm dứt hơn 1000 năm Bắc thuộc, mở ra thời kì độc lập tự chủ lâu dài của dân tộc Việt Nam.'],
            ['Cải cách Lê Thánh Tông', 'Xây dựng bộ máy nhà nước quân chủ trung ương tập quyền hoàn chỉnh (6 bộ, 13 đạo thừa tuyên, Quốc triều hình luật – Luật Hồng Đức), đưa Đại Việt đạt thời kì phát triển thịnh đạt.'],
            ['Cải cách Minh Mạng', 'Thành lập Nội các, Cơ mật viện, chia cả nước thành 30 tỉnh và 1 phủ Thừa Thiên (1831–1832), đặt nền móng quan trọng cho hệ thống đơn vị hành chính cấp tỉnh hiện đại.'],
          ],
        },
        {
          kind: 'lines',
          lines: [
            'Bài học liên hệ: (1) Tinh gọn bộ máy, phân định rõ chức năng nhiệm vụ và cơ chế giám sát lẫn nhau để hạn chế tham nhũng; (2) Coi trọng khoa cử, tuyển chọn nhân tài dựa trên năng lực thực chất và đạo đức công vụ.',
          ],
        },
      ],
    });
  }

  // =========================================================================
  // ADDITIONAL 1 ENGLISH SAMPLE (sample-eng-12-cloze-reading)
  // =========================================================================
  if (sampleId === 'sample-eng-12-cloze-reading') {
    const grading = buildMcqSession('English 12 Cloze Test & Functional Language', 'Tiếng Anh', '12A1', [
      { number: 1, kind: 'abcd', answerKey: 'B', maxScore: 1 },
      { number: 2, kind: 'abcd', answerKey: 'C', maxScore: 1 },
      { number: 3, kind: 'abcd', answerKey: 'A', maxScore: 1 },
      { number: 4, kind: 'abcd', answerKey: 'D', maxScore: 1 },
      { number: 5, kind: 'abcd', answerKey: 'B', maxScore: 1 },
      { number: 6, kind: 'abcd', answerKey: 'C', maxScore: 1 },
      { number: 7, kind: 'abcd', answerKey: 'A', maxScore: 1 },
      { number: 8, kind: 'abcd', answerKey: 'D', maxScore: 1 },
    ]);
    return buildFromSpec(
      {
        subjectLabel: 'Tiếng Anh',
        gradeLabel: 'Lớp 12',
        docTypeLabel: 'Đề kiểm tra · Cloze & Communication',
        title: 'ENGLISH 12 PRACTICE: GUIDED CLOZE TEST & FUNCTIONAL LANGUAGE',
        subtitle: 'Grade 12  |  School Leaflet Cloze Passage (5 items) + Real-life Communication & Arrangement (3 items).',
        blocks: [
          { kind: 'heading', text: 'Part 1. Read the school notice and choose the best option (A, B, C, or D) for blanks 1–5' },
          {
            kind: 'quote',
            title: 'ANNUAL HIGH-SCHOOL SCIENCE & GREEN INNOVATION FAIR',
            lines: [
              'Are you passionate about protecting our planet? Our school is proud to host the Annual Green Innovation Fair next Friday. Students from all grades are encouraged to (1) ________ practical projects ranging from solar-powered chargers to biodegradable packaging. All prototypes must be registered with the Science Department (2) ________ Monday afternoon so that exhibition tables can be arranged properly. Visitors will have the opportunity to vote for the most (3) ________ design. In addition, local engineers will give a short talk on careers in renewable energy, (4) ________ is especially helpful for Grade 12 students choosing university majors. Don\'t miss this chance to turn your creative ideas (5) ________ real-world solutions!',
            ],
            source: 'Original instructional leaflet text for Grade 12 English practice.',
          },
          {
            kind: 'lines',
            lines: [
              '1. A. make up        B. put forward        C. take off           D. look after',
              '2. A. during         B. since              C. by                 D. while',
              '3. A. sustainable    B. sustain            C. sustainably        D. sustainability',
              '4. A. that           B. who                C. where              D. which',
              '5. A. from           B. into               C. over               D. under',
            ],
          },
          { kind: 'heading', text: 'Part 2. Functional Language & Dialogue Arrangement (Items 6–8)' },
          {
            kind: 'lines',
            lines: [
              '6. Minh: "Would you mind showing me how to insert a formula in this worksheet?" — Hoa: "________"',
              '   A. Yes, I would mind.   B. Never mind at all.   C. Not at all! Let me show you.   D. I\'m afraid so.',
              '7. Choose the correct order to form a natural exchange:',
              '   (a) Sure, I\'ll share my notes right after class.   (b) Hi Nam, did you catch the deadline for the essay?',
              '   (c) Thanks a lot! That really helps.               (d) Yes, it\'s due next Wednesday at 5 p.m.',
              '   A. b – d – a – c        B. d – b – c – a        C. b – a – d – c                  D. a – b – d – c',
              '8. Which closing is most appropriate for a formal application email to a scholarship committee?',
              '   A. See ya soon!         B. Cheers, buddy!       C. Catch you later,               D. Yours sincerely,',
            ],
          },
          { kind: 'pageBreak' },
          { kind: 'heading', text: 'ANSWER KEY & EXPLANATIONS' },
          {
            kind: 'table',
            headers: ['Item', 'Key', 'Explanation'],
            colWeights: [0.9, 0.9, 6.2],
            rows: [
              ['1', 'B', '"put forward" = propose / present an idea or project.'],
              ['2', 'C', '"by Monday afternoon" indicates a deadline (no later than).'],
              ['3', 'A', 'Adjective "sustainable" is needed before the noun "design".'],
              ['4', 'D', 'Non-defining relative pronoun "which" refers to the whole previous clause.'],
              ['5', 'B', 'Collocation: "turn A into B" (transform ideas into solutions).'],
              ['6', 'C', '"Not at all!" politely agrees to a "Would you mind...?" request.'],
              ['7', 'A', 'Logical flow: Question (b) → Answer (d) → Offer notes (a) → Thanks (c).'],
              ['8', 'D', '"Yours sincerely," is standard formal email closing.'],
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
