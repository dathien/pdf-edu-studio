import { PDFDocument, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import { embedStudioFonts } from '../../engines/pdf/pdfEngine';
import type {
  InteractiveQuestion,
  InteractiveWorksheet,
  TeacherAnswerKeyMap,
} from '../../types/interactive';
import type { GradeLevel, SubjectCategory } from '../../types/studio';

export interface InteractiveTemplateMeta {
  id: string;
  subject: SubjectCategory;
  subjectLabel: string;
  grade: GradeLevel;
  title: string;
  subtitle: string;
  questionTypesSummary: string;
}

export const INTERACTIVE_SUBJECT_TEMPLATES: InteractiveTemplateMeta[] = [
  {
    id: 'tpl-math-12',
    subject: 'math',
    subjectLabel: 'Toán',
    grade: 12,
    title: 'Phiếu bài tập tương tác Toán 12: Hàm số, Đồ thị & Công thức',
    subtitle: 'Ghép đôi đường nối công thức – đồ thị, nhập công thức LaTeX, vẽ phác thảo đồ thị và trắc nghiệm.',
    questionTypesSummary: 'Ghép đôi (đường nối) · Công thức · Vẽ hình · Trắc nghiệm',
  },
  {
    id: 'tpl-physics-10',
    subject: 'physics',
    subjectLabel: 'Vật lí',
    grade: 10,
    title: 'Phiếu bài tập tương tác Vật lí 10: Đại lượng cơ học & Đồ thị v–t',
    subtitle: 'Nối đại lượng vật lí với đơn vị SI, trả lời ngắn từ đồ thị vận tốc – thời gian và bài tập tính toán.',
    questionTypesSummary: 'Ghép đôi (đường nối) · Trả lời ngắn · Đúng/Sai',
  },
  {
    id: 'tpl-chemistry-11',
    subject: 'chemistry',
    subjectLabel: 'Hóa học',
    grade: 11,
    title: 'Phiếu bài tập tương tác Hóa học 11: Công thức & Cân bằng phương trình',
    subtitle: 'Kéo thả tên chất vào công thức hóa học, điền hệ số cân bằng phương trình và câu hỏi Đúng/Sai từng ý.',
    questionTypesSummary: 'Ghép đôi (kéo thả) · Điền khuyết · Đúng/Sai',
  },
  {
    id: 'tpl-biology-10',
    subject: 'biology',
    subjectLabel: 'Sinh học',
    grade: 10,
    title: 'Phiếu bài tập tương tác Sinh học 10: Cấu trúc & Chức năng bào quan tế bào',
    subtitle: 'Vẽ đường nối bào quan với chức năng tương ứng và chú thích trực tiếp các thành phần trên sơ đồ tế bào.',
    questionTypesSummary: 'Ghép đôi (đường nối) · Chú thích sơ đồ · Tự luận ngắn',
  },
  {
    id: 'tpl-cs-11',
    subject: 'cs',
    subjectLabel: 'Tin học',
    grade: 11,
    title: 'Phiếu bài tập tương tác Tin học 11: Lệnh Python/SQL & Thuật toán tìm kiếm',
    subtitle: 'Nối lệnh Python/SQL với chức năng, sắp xếp thứ tự bước thuật toán tìm kiếm nhị phân và nộp tệp mã nguồn.',
    questionTypesSummary: 'Ghép đôi (đường nối) · Sắp xếp trình tự · Đính kèm tệp',
  },
  {
    id: 'tpl-geography-12',
    subject: 'geography',
    subjectLabel: 'Địa lí',
    grade: 12,
    title: 'Phiếu bài tập tương tác Địa lí 12: Nhận dạng biểu đồ & Phân tích số liệu',
    subtitle: 'Kéo thả đặc điểm vào loại biểu đồ phù hợp, đọc bảng số liệu giả định và nhận xét tự luận ngắn.',
    questionTypesSummary: 'Ghép đôi (kéo thả) · Trả lời ngắn · Tự luận',
  },
  {
    id: 'tpl-history-12',
    subject: 'history',
    subjectLabel: 'Lịch sử',
    grade: 12,
    title: 'Phiếu bài tập tương tác Lịch sử 12: Mốc sự kiện lịch sử Việt Nam 1945–1975',
    subtitle: 'Nối sự kiện lịch sử xác thực với mốc thời gian, sắp xếp trình tự thời gian và đọc hiểu tư liệu.',
    questionTypesSummary: 'Ghép đôi (đường nối) · Sắp xếp trình tự · Đọc hiểu',
  },
  {
    id: 'tpl-english-11',
    subject: 'english',
    subjectLabel: 'Tiếng Anh',
    grade: 11,
    title: 'Interactive Worksheet English 11: Environment & Sustainable Cities',
    subtitle: 'Nối từ vựng với nghĩa tiếng Việt, kéo thả cụm từ vào ngữ cảnh, điền khuyết và Reading Comprehension.',
    questionTypesSummary: 'Ghép đôi (đường nối & kéo thả) · Điền khuyết · Đọc hiểu',
  },
];

function safeAscii(font: PDFFont, text: string): string {
  try {
    font.encodeText(text);
    return text;
  } catch {
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .replace(/[^\x20-\x7E]/g, ' ');
  }
}

function drawHeadingBanner(
  page: PDFPage,
  fonts: { sans: PDFFont; sansBold: PDFFont },
  meta: InteractiveTemplateMeta,
  subtitleNote: string
) {
  const { width, height } = page.getSize();
  // Header accent strip
  page.drawRectangle({
    x: 34,
    y: height - 108,
    width: width - 68,
    height: 60,
    color: rgb(0.93, 0.97, 0.965),
    borderColor: rgb(0.09, 0.31, 0.39),
    borderWidth: 1,
  });
  page.drawText(
    safeAscii(fonts.sansBold, `BÀI TẬP PDF TƯƠNG TÁC · MÔN ${meta.subjectLabel.toUpperCase()} · LỚP ${meta.grade}`),
    { x: 44, y: height - 67, size: 10.5, font: fonts.sansBold, color: rgb(0.03, 0.5, 0.44) }
  );
  page.drawText(safeAscii(fonts.sansBold, meta.title.slice(0, 76)), {
    x: 44,
    y: height - 84,
    size: 12.5,
    font: fonts.sansBold,
    color: rgb(0.09, 0.31, 0.39),
  });
  page.drawText(safeAscii(fonts.sans, subtitleNote.slice(0, 102)), {
    x: 44,
    y: height - 99,
    size: 8.8,
    font: fonts.sans,
    color: rgb(0.28, 0.34, 0.41),
  });
}

function drawQuestionHeaderOnPdf(
  page: PDFPage,
  fonts: { sans: PDFFont; sansBold: PDFFont },
  q: InteractiveQuestion
) {
  const { height } = page.getSize();
  // Draw prompt header just above the interactive region (y is top-down)
  const labelY = height - (q.region.y - 6);
  page.drawText(safeAscii(fonts.sansBold, `${q.code} (${q.maxPoints} điểm): ${q.title}`), {
    x: q.region.x,
    y: Math.min(height - 122, labelY + 11),
    size: 10,
    font: fonts.sansBold,
    color: rgb(0.09, 0.31, 0.39),
  });
  page.drawText(safeAscii(fonts.sans, q.prompt.slice(0, 105)), {
    x: q.region.x,
    y: Math.min(height - 134, labelY),
    size: 8.6,
    font: fonts.sans,
    color: rgb(0.26, 0.33, 0.4),
  });
}

function drawPageFooter(page: PDFPage, font: PDFFont, pageNum: number, total: number) {
  const { width } = page.getSize();
  page.drawText(
    safeAscii(font, `PDF EDU STUDIO · Phiếu bài tập PDF tương tác · Trang ${pageNum}/${total}`),
    { x: 34, y: 18, size: 8, font, color: rgb(0.45, 0.5, 0.56) }
  );
  page.drawLine({
    start: { x: 34, y: 30 },
    end: { x: width - 34, y: 30 },
    thickness: 0.5,
    color: rgb(0.82, 0.86, 0.88),
  });
}

interface TemplateBlueprint {
  subtitleNote: string;
  pageCount: number;
  extraPdfArtwork?: (pages: PDFPage[], fonts: { sans: PDFFont; sansBold: PDFFont }) => void;
  questions: InteractiveQuestion[];
  answerKeys: TeacherAnswerKeyMap;
}

function getBlueprint(templateId: string): TemplateBlueprint {
  switch (templateId) {
    case 'tpl-math-12':
      return {
        subtitleNote: 'Hướng dẫn: Hoàn thành trực tiếp trên từng khung tương tác, nhấn Lưu bài và lưu thành tệp PDF (.pdf) khi nộp.',
        pageCount: 2,
        questions: [
          {
            id: 'q-math-1',
            code: 'Câu 1',
            title: 'Ghép đôi hàm số với đặc điểm đồ thị (Vẽ đường nối)',
            prompt: 'Kéo hoặc chạm để vẽ đường nối mỗi hàm số ở cột A với đặc điểm đồ thị đúng ở cột B.',
            type: 'matching',
            maxPoints: 3,
            required: true,
            region: { pageIndex: 0, x: 36, y: 156, width: 523, height: 242 },
            matching: {
              mode: 'line',
              allowManyToOne: false,
              shuffleB: true,
              practiceFeedback: false,
              columnATitle: 'Cột A — Công thức hàm số',
              columnBTitle: 'Cột B — Đặc điểm đồ thị',
              itemsA: [
                { id: 'm-a1', label: 'y = x³ - 3x', latex: 'y = x^3 - 3x' },
                { id: 'm-a2', label: 'y = (2x - 1)/(x - 1)', latex: 'y = \\frac{2x-1}{x-1}' },
                { id: 'm-a3', label: 'y = x⁴ - 2x²', latex: 'y = x^4 - 2x^2' },
              ],
              itemsB: [
                { id: 'm-b2', label: 'Có tiệm cận đứng x = 1 và tiệm cận ngang y = 2' },
                { id: 'm-b3', label: 'Đồ thị đối xứng qua trục Oy, có 3 điểm cực trị' },
                { id: 'm-b1', label: 'Có tâm đối xứng O(0;0), hai điểm cực trị x = ±1' },
              ],
            },
          },
          {
            id: 'q-math-2',
            code: 'Câu 2',
            title: 'Trắc nghiệm đạo hàm và cực trị',
            prompt: 'Hàm số y = x³ - 3x² + 2 đạt cực tiểu tại điểm nào sau đây?',
            type: 'mcq',
            maxPoints: 2,
            required: true,
            region: { pageIndex: 0, x: 36, y: 448, width: 523, height: 112 },
            mcqOptions: [
              { id: 'A', label: 'A', text: 'x = 0' },
              { id: 'B', label: 'B', text: 'x = 2' },
              { id: 'C', label: 'C', text: 'x = 1' },
              { id: 'D', label: 'D', text: 'x = -2' },
            ],
          },
          {
            id: 'q-math-3',
            code: 'Câu 3',
            title: 'Nhập công thức đạo hàm bậc nhất',
            prompt: 'Nhập biểu thức đạo hàm y\' của hàm số y = (2x + 1)/(x - 1) theo cú pháp LaTeX.',
            type: 'formula',
            maxPoints: 2.5,
            required: true,
            region: { pageIndex: 0, x: 36, y: 606, width: 523, height: 158 },
            formulaPlaceholder: "Ví dụ: y' = \\frac{-3}{(x-1)^2}",
          },
          {
            id: 'q-math-4',
            code: 'Câu 4',
            title: 'Vẽ phác thảo bảng biến thiên / đồ thị y = x³ - 3x',
            prompt: 'Dùng bút vẽ phác thảo nhánh đồ thị hàm số y = x³ - 3x đi qua cực đại (-1; 2) và cực tiểu (1; -2).',
            type: 'drawing',
            maxPoints: 2.5,
            required: true,
            region: { pageIndex: 1, x: 36, y: 150, width: 523, height: 280 },
          },
        ],
        answerKeys: {
          'q-math-1': {
            questionId: 'q-math-1',
            matchingCorrectPairs: [
              { fromId: 'm-a1', toId: 'm-b1' },
              { fromId: 'm-a2', toId: 'm-b2' },
              { fromId: 'm-a3', toId: 'm-b3' },
            ],
          },
          'q-math-2': { questionId: 'q-math-2', mcqCorrectId: 'B' },
          'q-math-3': {
            questionId: 'q-math-3',
            referenceNote: "Đáp án chuẩn: y' = -3 / (x - 1)^2 (GV kiểm tra biểu thức tương đương).",
          },
          'q-math-4': {
            questionId: 'q-math-4',
            referenceNote: 'Kiểm tra hình dạng chữ N, qua gốc O(0;0), CĐ(-1;2), CT(1;-2).',
          },
        },
      };

    case 'tpl-physics-10':
      return {
        subtitleNote: 'Cho đồ thị v–t của một vật chuyển động thẳng (số liệu giả định minh họa) bên dưới.',
        pageCount: 1,
        extraPdfArtwork: (pages, fonts) => {
          const p = pages[0];
          const { height } = p.getSize();
          // Draw a neat synthetic v-t graph box on page 1 (y top-down 398..506)
          const gx = 40;
          const gyBottom = height - 512;
          p.drawRectangle({
            x: gx,
            y: gyBottom,
            width: 515,
            height: 102,
            color: rgb(0.985, 0.992, 0.995),
            borderColor: rgb(0.75, 0.83, 0.87),
            borderWidth: 0.8,
          });
          p.drawText(
            safeAscii(fonts.sansBold, 'Biểu đồ v(t) [Số liệu giả định]: t = 0s -> v = 2 m/s; t = 4s -> v = 10 m/s; t = 8s -> v = 10 m/s'),
            { x: gx + 10, y: gyBottom + 84, size: 8.5, font: fonts.sansBold, color: rgb(0.09, 0.31, 0.39) }
          );
          // Axes
          const ox = gx + 48;
          const oy = gyBottom + 20;
          p.drawLine({ start: { x: ox, y: oy }, end: { x: ox + 210, y: oy }, thickness: 1, color: rgb(0.2, 0.25, 0.3) });
          p.drawLine({ start: { x: ox, y: oy }, end: { x: ox, y: oy + 56 }, thickness: 1, color: rgb(0.2, 0.25, 0.3) });
          // Graph segment (0,2)->(4,10)->(8,10)
          p.drawLine({ start: { x: ox, y: oy + 10 }, end: { x: ox + 90, y: oy + 48 }, thickness: 2, color: rgb(0.03, 0.5, 0.44) });
          p.drawLine({ start: { x: ox + 90, y: oy + 48 }, end: { x: ox + 180, y: oy + 48 }, thickness: 2, color: rgb(0.03, 0.5, 0.44) });
          p.drawText('t (s)', { x: ox + 215, y: oy - 3, size: 8, font: fonts.sans, color: rgb(0.2, 0.25, 0.3) });
          p.drawText('v (m/s)', { x: ox - 36, y: oy + 50, size: 8, font: fonts.sans, color: rgb(0.2, 0.25, 0.3) });
          p.drawText('0          4          8', { x: ox - 3, y: oy - 11, size: 8, font: fonts.sans, color: rgb(0.25, 0.3, 0.35) });
        },
        questions: [
          {
            id: 'q-phy-1',
            code: 'Câu 1',
            title: 'Ghép đại lượng vật lí với đơn vị SI (Vẽ đường nối)',
            prompt: 'Vẽ đường nối mỗi đại lượng vật lí ở cột A với đơn vị chuẩn SI ở cột B.',
            type: 'matching',
            maxPoints: 4,
            required: true,
            region: { pageIndex: 0, x: 36, y: 154, width: 523, height: 236 },
            matching: {
              mode: 'line',
              allowManyToOne: false,
              shuffleB: true,
              practiceFeedback: false,
              columnATitle: 'Cột A — Đại lượng',
              columnBTitle: 'Cột B — Đơn vị SI',
              itemsA: [
                { id: 'p-a1', label: 'Gia tốc (a)' },
                { id: 'p-a2', label: 'Lực tác dụng (F)' },
                { id: 'p-a3', label: 'Công cơ học (A)' },
                { id: 'p-a4', label: 'Công suất (P)' },
              ],
              itemsB: [
                { id: 'p-b3', label: 'Jun (J)' },
                { id: 'p-b1', label: 'm/s²' },
                { id: 'p-b4', label: 'Oát (W)' },
                { id: 'p-b2', label: 'Niutơn (N)' },
              ],
            },
          },
          {
            id: 'q-phy-2',
            code: 'Câu 2',
            title: 'Tính gia tốc từ đồ thị v–t (0s → 4s)',
            prompt: 'Dựa vào đồ thị v–t ở trên, tính độ lớn gia tốc a trong khoảng thời gian từ t = 0s đến t = 4s.',
            type: 'short',
            maxPoints: 3,
            required: true,
            region: { pageIndex: 0, x: 36, y: 550, width: 523, height: 78 },
            shortPlaceholder: 'Nhập giá trị số (ví dụ: 2)',
            shortUnit: 'm/s²',
          },
          {
            id: 'q-phy-3',
            code: 'Câu 3',
            title: 'Nhận định Đúng / Sai về chuyển động trên đồ thị',
            prompt: 'Đánh dấu Đúng (Đ) hoặc Sai (S) cho từng mệnh đề dựa trên đồ thị v–t.',
            type: 'tf',
            maxPoints: 3,
            required: true,
            region: { pageIndex: 0, x: 36, y: 664, width: 523, height: 138 },
            tfStatements: [
              { id: 's1', label: 'a)', text: 'Từ 0s đến 4s, vật chuyển động thẳng nhanh dần đều.' },
              { id: 's2', label: 'b)', text: 'Từ 4s đến 8s, vật đứng yên không chuyển động.' },
              { id: 's3', label: 'c)', text: 'Quãng đường đi được trong 4s đầu là 24 m.' },
              { id: 's4', label: 'd)', text: 'Tổng quãng đường vật đi được trong 8s là 64 m.' },
            ],
          },
        ],
        answerKeys: {
          'q-phy-1': {
            questionId: 'q-phy-1',
            matchingCorrectPairs: [
              { fromId: 'p-a1', toId: 'p-b1' },
              { fromId: 'p-a2', toId: 'p-b2' },
              { fromId: 'p-a3', toId: 'p-b3' },
              { fromId: 'p-a4', toId: 'p-b4' },
            ],
          },
          'q-phy-2': { questionId: 'q-phy-2', shortAccepted: ['2', '2.0', '2,0'] },
          'q-phy-3': {
            questionId: 'q-phy-3',
            tfCorrectMap: { s1: 'T', s2: 'F', s3: 'T', s4: 'T' },
          },
        },
      };

    case 'tpl-chemistry-11':
      return {
        subtitleNote: 'Thực hành ghép chất – công thức bằng kéo thả, cân bằng phương trình và nhận định Đúng/Sai.',
        pageCount: 1,
        questions: [
          {
            id: 'q-chem-1',
            code: 'Câu 1',
            title: 'Ghép tên chất với công thức hóa học (Kéo thả)',
            prompt: 'Kéo thả (hoặc chạm chọn) thẻ công thức đúng vào từng ô tên chất tương ứng.',
            type: 'matching',
            maxPoints: 4,
            required: true,
            region: { pageIndex: 0, x: 36, y: 156, width: 523, height: 248 },
            matching: {
              mode: 'drag',
              allowManyToOne: false,
              shuffleB: true,
              practiceFeedback: false,
              columnATitle: 'Tên chất hóa học',
              columnBTitle: 'Thẻ công thức hóa học',
              itemsA: [
                { id: 'c-a1', label: 'Amoniac' },
                { id: 'c-a2', label: 'Axit sunfuric' },
                { id: 'c-a3', label: 'Lưu huỳnh đioxit' },
                { id: 'c-a4', label: 'Natri hiđroxit' },
              ],
              itemsB: [
                { id: 'c-b2', label: 'H₂SO₄' },
                { id: 'c-b4', label: 'NaOH' },
                { id: 'c-b1', label: 'NH₃' },
                { id: 'c-b3', label: 'SO₂' },
              ],
            },
          },
          {
            id: 'q-chem-2',
            code: 'Câu 2',
            title: 'Điền hệ số cân bằng phương trình hóa học',
            prompt: 'Điền hệ số nguyên tối giản thích hợp vào các ô trống trong phản ứng tổng hợp amoniac và phản ứng axit-bazơ.',
            type: 'fill_blank',
            maxPoints: 3,
            required: true,
            region: { pageIndex: 0, x: 36, y: 446, width: 523, height: 142 },
            fillBlanks: [
              { id: 'b1', prefix: 'N₂ +', suffix: 'H₂ ⇌', placeholder: 'hệ số H₂' },
              { id: 'b2', prefix: '→ tạo ra', suffix: 'NH₃', placeholder: 'hệ số NH₃' },
              { id: 'b3', prefix: 'H₂SO₄ +', suffix: 'NaOH → Na₂SO₄ + 2H₂O', placeholder: 'hệ số NaOH' },
            ],
          },
          {
            id: 'q-chem-3',
            code: 'Câu 3',
            title: 'Đánh giá Đúng / Sai về cân bằng hóa học',
            prompt: 'Chọn Đúng (Đ) hoặc Sai (S) cho các phát biểu về trạng thái cân bằng hóa học.',
            type: 'tf',
            maxPoints: 3,
            required: true,
            region: { pageIndex: 0, x: 36, y: 632, width: 523, height: 142 },
            tfStatements: [
              { id: 't1', label: 'a)', text: 'Cân bằng hóa học là cân bằng động (v_thuận = v_nghịch ≠ 0).' },
              { id: 't2', label: 'b)', text: 'Chất xúc tác làm chuyển dịch cân bằng về phía tạo sản phẩm.' },
              { id: 't3', label: 'c)', text: 'Tăng áp suất làm cân bằng N₂ + 3H₂ ⇌ 2NH₃ chuyển dịch theo chiều thuận.' },
              { id: 't4', label: 'd)', text: 'Ở trạng thái cân bằng, nồng độ các chất không đổi theo thời gian.' },
            ],
          },
        ],
        answerKeys: {
          'q-chem-1': {
            questionId: 'q-chem-1',
            matchingCorrectPairs: [
              { fromId: 'c-a1', toId: 'c-b1' },
              { fromId: 'c-a2', toId: 'c-b2' },
              { fromId: 'c-a3', toId: 'c-b3' },
              { fromId: 'c-a4', toId: 'c-b4' },
            ],
          },
          'q-chem-2': {
            questionId: 'q-chem-2',
            fillBlankAccepted: { b1: ['3'], b2: ['2'], b3: ['2'] },
          },
          'q-chem-3': {
            questionId: 'q-chem-3',
            tfCorrectMap: { t1: 'T', t2: 'F', t3: 'T', t4: 'T' },
          },
        },
      };

    case 'tpl-biology-10':
      return {
        subtitleNote: 'Nối bào quan với chức năng, chú thích vị trí trên sơ đồ tế bào và trả lời câu hỏi ứng dụng.',
        pageCount: 1,
        questions: [
          {
            id: 'q-bio-1',
            code: 'Câu 1',
            title: 'Nối bào quan tế bào với chức năng (Vẽ đường nối)',
            prompt: 'Vẽ đường nối mỗi bào quan ở cột A với chức năng sinh học chính xác ở cột B.',
            type: 'matching',
            maxPoints: 4,
            required: true,
            region: { pageIndex: 0, x: 36, y: 156, width: 523, height: 238 },
            matching: {
              mode: 'line',
              allowManyToOne: false,
              shuffleB: true,
              practiceFeedback: false,
              columnATitle: 'Cột A — Bào quan',
              columnBTitle: 'Cột B — Chức năng chính',
              itemsA: [
                { id: 'bio-a1', label: 'Ti thể' },
                { id: 'bio-a2', label: 'Ribôxôm' },
                { id: 'bio-a3', label: 'Lục lạp' },
                { id: 'bio-a4', label: 'Bộ máy Gôngi' },
              ],
              itemsB: [
                { id: 'bio-b2', label: 'Tổng hợp prôtêin cho tế bào' },
                { id: 'bio-b4', label: 'Đóng gói và phân phối sản phẩm tế bào' },
                { id: 'bio-b1', label: 'Hô hấp tế bào, tạo năng lượng ATP' },
                { id: 'bio-b3', label: 'Quang hợp chuyển hóa quang năng ở thực vật' },
              ],
            },
          },
          {
            id: 'q-bio-2',
            code: 'Câu 2',
            title: 'Chú thích các thành phần cơ bản của tế bào nhân thực',
            prompt: 'Điền tên thành phần tương ứng với từng vị trí đánh số trên khung sơ đồ tế bào.',
            type: 'diagram_label',
            maxPoints: 3,
            required: true,
            region: { pageIndex: 0, x: 36, y: 438, width: 523, height: 162 },
            diagramPins: [
              { id: 'pin1', code: '(1)', rx: 0.18, ry: 0.28, hint: 'Lớp bao bọc ngoài kiểm soát trao đổi chất' },
              { id: 'pin2', code: '(2)', rx: 0.5, ry: 0.45, hint: 'Trung tâm chứa vật chất di truyền ADN' },
              { id: 'pin3', code: '(3)', rx: 0.82, ry: 0.35, hint: 'Bào quan cung cấp ATP dạng hạt đậu' },
            ],
          },
          {
            id: 'q-bio-3',
            code: 'Câu 3',
            title: 'Giải thích ứng dụng thực tế (Tự luận ngắn)',
            prompt: 'Vì sao tế bào cơ tim của người có số lượng ti thể rất lớn so với tế bào biểu bì?',
            type: 'essay',
            maxPoints: 3,
            required: true,
            region: { pageIndex: 0, x: 36, y: 642, width: 523, height: 146 },
            essayPlaceholder: 'Trình bày câu giải thích ngắn gọn (3–5 dòng)...',
          },
        ],
        answerKeys: {
          'q-bio-1': {
            questionId: 'q-bio-1',
            matchingCorrectPairs: [
              { fromId: 'bio-a1', toId: 'bio-b1' },
              { fromId: 'bio-a2', toId: 'bio-b2' },
              { fromId: 'bio-a3', toId: 'bio-b3' },
              { fromId: 'bio-a4', toId: 'bio-b4' },
            ],
          },
          'q-bio-2': {
            questionId: 'q-bio-2',
            referenceNote: '(1) Màng sinh chất; (2) Nhân tế bào; (3) Ti thể.',
          },
          'q-bio-3': {
            questionId: 'q-bio-3',
            referenceNote: 'Cơ tim co bóp liên tục suốt đời -> nhu cầu ATP rất cao -> cần nhiều ti thể để hô hấp tế bào.',
          },
        },
      };

    case 'tpl-cs-11':
      return {
        subtitleNote: 'Kết hợp ghép lệnh Python/SQL, sắp xếp thuật toán tìm kiếm nhị phân và đính kèm mã nguồn thực hành.',
        pageCount: 1,
        questions: [
          {
            id: 'q-cs-1',
            code: 'Câu 1',
            title: 'Ghép lệnh Python / SQL với chức năng (Vẽ đường nối)',
            prompt: 'Vẽ đường nối mỗi câu lệnh ở cột A với tác dụng tương ứng ở cột B.',
            type: 'matching',
            maxPoints: 4,
            required: true,
            region: { pageIndex: 0, x: 36, y: 154, width: 523, height: 226 },
            matching: {
              mode: 'line',
              allowManyToOne: false,
              shuffleB: true,
              practiceFeedback: false,
              columnATitle: 'Cột A — Lệnh Python / SQL',
              columnBTitle: 'Cột B — Chức năng',
              itemsA: [
                { id: 'cs-a1', label: 'SELECT ... WHERE' },
                { id: 'cs-a2', label: 'ORDER BY diem DESC' },
                { id: 'cs-a3', label: 'def binary_search(a, x):' },
                { id: 'cs-a4', label: 'len(ds)' },
              ],
              itemsB: [
                { id: 'cs-b3', label: 'Khai báo hàm tìm kiếm trong Python' },
                { id: 'cs-b4', label: 'Trả về số phần tử của danh sách' },
                { id: 'cs-b1', label: 'Truy vấn các bản ghi thỏa điều kiện lọc' },
                { id: 'cs-b2', label: 'Sắp xếp kết quả giảm dần theo cột điểm' },
              ],
            },
          },
          {
            id: 'q-cs-2',
            code: 'Câu 2',
            title: 'Sắp xếp đúng trình tự thuật toán tìm kiếm nhị phân',
            prompt: 'Sắp xếp 4 bước sau thành trình tự thực hiện chuẩn của tìm kiếm nhị phân trên mảng tăng dần.',
            type: 'ordering',
            maxPoints: 3,
            required: true,
            region: { pageIndex: 0, x: 36, y: 422, width: 523, height: 196 },
            orderingItems: [
              { id: 'ord-3', text: 'So sánh giá trị khóa K với phần tử giữa A[mid]' },
              { id: 'ord-1', text: 'Khởi tạo chỉ số đầu left = 0 và cuối right = n - 1' },
              { id: 'ord-4', text: 'Thu hẹp nửa trái hoặc nửa phải cho đến khi tìm thấy hoặc left > right' },
              { id: 'ord-2', text: 'Tính chỉ số giữa mid = (left + right) // 2' },
            ],
          },
          {
            id: 'q-cs-3',
            code: 'Câu 3',
            title: 'Nộp tệp chương trình thực hành Python/SQL',
            prompt: 'Đính kèm tệp mã nguồn .py hoặc .sql (hoặc ảnh chụp màn hình chạy chương trình).',
            type: 'attachment',
            maxPoints: 3,
            required: false,
            region: { pageIndex: 0, x: 36, y: 658, width: 523, height: 128 },
            attachmentAcceptHint: 'Hỗ trợ: .py, .sql, .txt, .png, .jpg, .pdf (tối đa 8 MB/tệp)',
          },
        ],
        answerKeys: {
          'q-cs-1': {
            questionId: 'q-cs-1',
            matchingCorrectPairs: [
              { fromId: 'cs-a1', toId: 'cs-b1' },
              { fromId: 'cs-a2', toId: 'cs-b2' },
              { fromId: 'cs-a3', toId: 'cs-b3' },
              { fromId: 'cs-a4', toId: 'cs-b4' },
            ],
          },
          'q-cs-2': {
            questionId: 'q-cs-2',
            orderingCorrectIds: ['ord-1', 'ord-2', 'ord-3', 'ord-4'],
          },
          'q-cs-3': {
            questionId: 'q-cs-3',
            referenceNote: 'Kiểm tra mã nguồn chạy đúng test case và trình bày rõ ràng.',
          },
        },
      };

    case 'tpl-geography-12':
      return {
        subtitleNote: 'Bảng số liệu minh họa (Số liệu giả định phục vụ kỹ năng Địa lí): Sản lượng điện 2020 = 240 tỉ kWh; 2024 = 300 tỉ kWh.',
        pageCount: 1,
        questions: [
          {
            id: 'q-geo-1',
            code: 'Câu 1',
            title: 'Ghép loại biểu đồ Địa lí với yêu cầu thể hiện (Kéo thả)',
            prompt: 'Kéo thả loại biểu đồ phù hợp vào từng yêu cầu xử lí số liệu Địa lí.',
            type: 'matching',
            maxPoints: 4,
            required: true,
            region: { pageIndex: 0, x: 36, y: 156, width: 523, height: 248 },
            matching: {
              mode: 'drag',
              allowManyToOne: false,
              shuffleB: true,
              practiceFeedback: false,
              columnATitle: 'Yêu cầu đề bài Địa lí',
              columnBTitle: 'Loại biểu đồ thích hợp',
              itemsA: [
                { id: 'g-a1', label: 'Cơ cấu ngành kinh tế tại 2 năm' },
                { id: 'g-a2', label: 'Chuyển dịch cơ cấu qua 5 năm liên tiếp' },
                { id: 'g-a3', label: 'Tốc độ tăng trưởng (%) nhiều sản phẩm' },
                { id: 'g-a4', label: 'So sánh sản lượng tuyệt đối các vùng' },
              ],
              itemsB: [
                { id: 'g-b3', label: 'Biểu đồ đường (lấy năm gốc = 100%)' },
                { id: 'g-b1', label: 'Biểu đồ tròn' },
                { id: 'g-b4', label: 'Biểu đồ cột' },
                { id: 'g-b2', label: 'Biểu đồ miền' },
              ],
            },
          },
          {
            id: 'q-geo-2',
            code: 'Câu 2',
            title: 'Tính tốc độ tăng trưởng từ bảng số liệu giả định',
            prompt: 'Từ số liệu giả định trên (2020: 240 tỉ kWh → 2024: 300 tỉ kWh), năm 2024 tăng bao nhiêu phần trăm so với 2020?',
            type: 'short',
            maxPoints: 3,
            required: true,
            region: { pageIndex: 0, x: 36, y: 446, width: 523, height: 82 },
            shortPlaceholder: 'Ví dụ: 25',
            shortUnit: '%',
          },
          {
            id: 'q-geo-3',
            code: 'Câu 3',
            title: 'Nhận xét xu hướng chuyển dịch cơ cấu năng lượng (Tự luận)',
            prompt: 'Nêu ngắn gọn 2 thuận lợi tự nhiên giúp phát triển năng lượng tái tạo (điện gió, điện mặt trời) ở Duyên hải Nam Trung Bộ.',
            type: 'essay',
            maxPoints: 3,
            required: true,
            region: { pageIndex: 0, x: 36, y: 572, width: 523, height: 188 },
            essayPlaceholder: 'Nhập nhận xét Địa lí của em...',
          },
        ],
        answerKeys: {
          'q-geo-1': {
            questionId: 'q-geo-1',
            matchingCorrectPairs: [
              { fromId: 'g-a1', toId: 'g-b1' },
              { fromId: 'g-a2', toId: 'g-b2' },
              { fromId: 'g-a3', toId: 'g-b3' },
              { fromId: 'g-a4', toId: 'g-b4' },
            ],
          },
          'q-geo-2': { questionId: 'q-geo-2', shortAccepted: ['25', '25%', '25.0'] },
          'q-geo-3': {
            questionId: 'q-geo-3',
            referenceNote: 'Nêu được: số giờ nắng cao quanh năm, bức xạ lớn; bờ biển dài nhiều gió mạnh ổn định.',
          },
        },
      };

    case 'tpl-history-12':
      return {
        subtitleNote: 'Các mốc lịch sử trong phiếu đều là sự kiện lịch sử xác thực giai đoạn 1945 – 1975.',
        pageCount: 1,
        questions: [
          {
            id: 'q-his-1',
            code: 'Câu 1',
            title: 'Nối sự kiện lịch sử với mốc thời gian xác thực (Vẽ đường nối)',
            prompt: 'Vẽ đường nối sự kiện lịch sử ở cột A với đúng mốc thời gian ở cột B.',
            type: 'matching',
            maxPoints: 4,
            required: true,
            region: { pageIndex: 0, x: 36, y: 152, width: 523, height: 228 },
            matching: {
              mode: 'line',
              allowManyToOne: false,
              shuffleB: true,
              practiceFeedback: false,
              columnATitle: 'Cột A — Sự kiện lịch sử',
              columnBTitle: 'Cột B — Mốc thời gian',
              itemsA: [
                { id: 'h-a1', label: 'Tuyên ngôn Độc lập khai sinh nước VNDCCH' },
                { id: 'h-a2', label: 'Chiến thắng lịch sử Điện Biên Phủ' },
                { id: 'h-a3', label: 'Ký Hiệp định Pa-ri về Việt Nam' },
                { id: 'h-a4', label: 'Giải phóng miền Nam, thống nhất đất nước' },
              ],
              itemsB: [
                { id: 'h-b2', label: '07/05/1954' },
                { id: 'h-b4', label: '30/04/1975' },
                { id: 'h-b1', label: '02/09/1945' },
                { id: 'h-b3', label: '27/01/1973' },
              ],
            },
          },
          {
            id: 'q-his-2',
            code: 'Câu 2',
            title: 'Sắp xếp các sự kiện theo đúng trình tự thời gian',
            prompt: 'Sắp xếp 4 sự kiện dưới đây từ sớm nhất đến muộn nhất.',
            type: 'ordering',
            maxPoints: 3,
            required: true,
            region: { pageIndex: 0, x: 36, y: 418, width: 523, height: 175 },
            orderingItems: [
              { id: 'ho-3', text: 'Chiến thắng Điện Biên Phủ (1954)' },
              { id: 'ho-1', text: 'Cách mạng tháng Tám thành công (1945)' },
              { id: 'ho-4', text: 'Chiến dịch Hồ Chí Minh toàn thắng (1975)' },
              { id: 'ho-2', text: 'Chiến dịch Biên giới Thu – Đông (1950)' },
            ],
          },
          {
            id: 'q-his-3',
            code: 'Câu 3',
            title: 'Đọc hiểu tư liệu lịch sử',
            prompt: 'Đọc đoạn tư liệu ngắn và trả lời 2 câu hỏi con bên dưới.',
            type: 'reading',
            maxPoints: 3,
            required: true,
            region: { pageIndex: 0, x: 36, y: 626, width: 523, height: 168 },
            readingPassage:
              'Chiến thắng Điện Biên Phủ ngày 7/5/1954 đã giáng đòn quyết định vào ý chí xâm lược của thực dân Pháp, tạo cơ sở trực tiếp cho việc ký kết Hiệp định Giơ-ne-vơ năm 1954 về chấm dứt chiến tranh, lập lại hòa bình ở Đông Dương.',
            readingSubQuestions: [
              {
                id: 'rs1',
                prompt: '1. Chiến thắng Điện Biên Phủ tạo cơ sở trực tiếp cho hiệp định nào?',
                kind: 'mcq',
                options: ['Hiệp định Giơ-ne-vơ', 'Hiệp định Pa-ri', 'Hiệp định Sơ bộ'],
              },
              {
                id: 'rs2',
                prompt: '2. Chiến thắng Điện Biên Phủ diễn ra vào năm nào?',
                kind: 'short',
              },
            ],
          },
        ],
        answerKeys: {
          'q-his-1': {
            questionId: 'q-his-1',
            matchingCorrectPairs: [
              { fromId: 'h-a1', toId: 'h-b1' },
              { fromId: 'h-a2', toId: 'h-b2' },
              { fromId: 'h-a3', toId: 'h-b3' },
              { fromId: 'h-a4', toId: 'h-b4' },
            ],
          },
          'q-his-2': {
            questionId: 'q-his-2',
            orderingCorrectIds: ['ho-1', 'ho-2', 'ho-3', 'ho-4'],
          },
          'q-his-3': {
            questionId: 'q-his-3',
            readingSubKeys: {
              rs1: ['Hiệp định Giơ-ne-vơ'],
              rs2: ['1954'],
            },
          },
        },
      };

    case 'tpl-english-11':
    default:
      return {
        subtitleNote: 'Complete vocabulary matching, gap-fill grammar, and reading comprehension directly on the PDF.',
        pageCount: 2,
        questions: [
          {
            id: 'q-eng-1',
            code: 'Task 1',
            title: 'Match vocabulary with Vietnamese meanings (Line Connecting)',
            prompt: 'Draw lines to connect each English term in Column A with its meaning in Column B.',
            type: 'matching',
            maxPoints: 3,
            required: true,
            region: { pageIndex: 0, x: 36, y: 156, width: 523, height: 234 },
            matching: {
              mode: 'line',
              allowManyToOne: false,
              shuffleB: true,
              practiceFeedback: false,
              columnATitle: 'Column A — Vocabulary',
              columnBTitle: 'Column B — Meaning',
              itemsA: [
                { id: 'e-a1', label: 'renewable energy' },
                { id: 'e-a2', label: 'carbon footprint' },
                { id: 'e-a3', label: 'public transport' },
                { id: 'e-a4', label: 'sustainable city' },
              ],
              itemsB: [
                { id: 'e-b2', label: 'dấu chân các-bon' },
                { id: 'e-b4', label: 'thành phố bền vững' },
                { id: 'e-b1', label: 'năng lượng tái tạo' },
                { id: 'e-b3', label: 'giao thông công cộng' },
              ],
            },
          },
          {
            id: 'q-eng-2',
            code: 'Task 2',
            title: 'Drag & drop words into context sentences',
            prompt: 'Drag each word card into the matching sentence blank.',
            type: 'matching',
            maxPoints: 3,
            required: true,
            region: { pageIndex: 0, x: 36, y: 432, width: 523, height: 222 },
            matching: {
              mode: 'drag',
              allowManyToOne: false,
              shuffleB: true,
              practiceFeedback: false,
              columnATitle: 'Sentence with blank',
              columnBTitle: 'Word Bank',
              itemsA: [
                { id: 'ed-a1', label: 'Solar panels help ___ electricity bills.' },
                { id: 'ed-a2', label: 'Cycling to school helps ___ the air.' },
                { id: 'ed-a3', label: 'Green roofs can ___ urban heat.' },
              ],
              itemsB: [
                { id: 'ed-b2', label: 'protect' },
                { id: 'ed-b3', label: 'absorb' },
                { id: 'ed-b1', label: 'reduce' },
              ],
            },
          },
          {
            id: 'q-eng-3',
            code: 'Task 3',
            title: 'Grammar Fill-in-the-blank',
            prompt: 'Fill in the correct verb form or preposition in each sentence.',
            type: 'fill_blank',
            maxPoints: 2,
            required: true,
            region: { pageIndex: 1, x: 36, y: 150, width: 523, height: 126 },
            fillBlanks: [
              { id: 'eb1', prefix: 'Smart sensors are used', suffix: 'monitor air quality.', placeholder: 'to / for' },
              { id: 'eb2', prefix: 'If cities plant more trees, temperatures', suffix: 'drop.', placeholder: 'will / did' },
            ],
          },
          {
            id: 'q-eng-4',
            code: 'Task 4',
            title: 'Reading Comprehension',
            prompt: 'Read the short passage and answer the 2 questions below.',
            type: 'reading',
            maxPoints: 2,
            required: true,
            region: { pageIndex: 1, x: 36, y: 318, width: 523, height: 210 },
            readingPassage:
              'Future sustainable cities will rely heavily on clean public transit, pedestrian zones, and solar-powered public buildings. By reducing private car usage, residents enjoy cleaner air and quieter neighborhoods.',
            readingSubQuestions: [
              {
                id: 'er1',
                prompt: '1. What is one benefit of reducing private car usage mentioned in the text?',
                kind: 'mcq',
                options: ['Cleaner air and quieter neighborhoods', 'Higher fuel consumption', 'More traffic jams'],
              },
              {
                id: 'er2',
                prompt: '2. Which energy source powers public buildings in the passage? (1 word)',
                kind: 'short',
              },
            ],
          },
        ],
        answerKeys: {
          'q-eng-1': {
            questionId: 'q-eng-1',
            matchingCorrectPairs: [
              { fromId: 'e-a1', toId: 'e-b1' },
              { fromId: 'e-a2', toId: 'e-b2' },
              { fromId: 'e-a3', toId: 'e-b3' },
              { fromId: 'e-a4', toId: 'e-b4' },
            ],
          },
          'q-eng-2': {
            questionId: 'q-eng-2',
            matchingCorrectPairs: [
              { fromId: 'ed-a1', toId: 'ed-b1' },
              { fromId: 'ed-a2', toId: 'ed-b2' },
              { fromId: 'ed-a3', toId: 'ed-b3' },
            ],
          },
          'q-eng-3': {
            questionId: 'q-eng-3',
            fillBlankAccepted: { eb1: ['to'], eb2: ['will'] },
          },
          'q-eng-4': {
            questionId: 'q-eng-4',
            readingSubKeys: {
              er1: ['Cleaner air and quieter neighborhoods'],
              er2: ['solar', 'solar-powered'],
            },
          },
        },
      };
  }
}

/**
 * Generates a real A4 PDF + structured InteractiveWorksheet + TeacherAnswerKeyMap for any of the 8 THPT subjects.
 */
export async function buildInteractiveSubjectTemplate(templateId: string): Promise<{
  worksheet: InteractiveWorksheet;
  answerKeys: TeacherAnswerKeyMap;
  pdfBytes: Uint8Array;
}> {
  const meta =
    INTERACTIVE_SUBJECT_TEMPLATES.find((t) => t.id === templateId) ||
    INTERACTIVE_SUBJECT_TEMPLATES[0];
  const bp = getBlueprint(meta.id);

  const pdfDoc = await PDFDocument.create();
  const fonts = await embedStudioFonts(pdfDoc);
  const pages: PDFPage[] = [];
  for (let i = 0; i < bp.pageCount; i++) {
    const p = pdfDoc.addPage([595.28, 841.89]); // Standard A4 in PDF points
    pages.push(p);
    if (i === 0) {
      drawHeadingBanner(p, fonts, meta, bp.subtitleNote);
    } else {
      p.drawText(safeAscii(fonts.sansBold, `${meta.title} (Trang ${i + 1})`), {
        x: 36,
        y: 808,
        size: 11,
        font: fonts.sansBold,
        color: rgb(0.09, 0.31, 0.39),
      });
    }
    drawPageFooter(p, fonts.sans, i + 1, bp.pageCount);
  }

  if (bp.extraPdfArtwork) {
    bp.extraPdfArtwork(pages, fonts);
  }

  for (const q of bp.questions) {
    const targetPage = pages[q.region.pageIndex] || pages[0];
    drawQuestionHeaderOnPdf(targetPage, fonts, q);
  }

  const pdfBytes = await pdfDoc.save();
  const now = Date.now();
  const worksheet: InteractiveWorksheet = {
    worksheetId: `ws-${meta.id}-${now.toString(36)}`,
    schemaVersion: 2,
    title: meta.title,
    subject: meta.subject,
    subjectLabel: meta.subjectLabel,
    grade: meta.grade,
    description: meta.subtitle,
    teacherName: 'Giáo viên bộ môn',
    durationMinutes: 30,
    examMode: 'exam',
    createdAt: now,
    updatedAt: now,
    questions: bp.questions,
  };

  return {
    worksheet,
    answerKeys: bp.answerKeys,
    pdfBytes,
  };
}
