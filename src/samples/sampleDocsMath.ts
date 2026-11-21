import {
  buildMcqSession,
  buildRubricSession,
  buildStructuredPayload,
  makeDiagramObj,
  makeFormulaObj,
  type StructuredSamplePayload,
} from './sampleBuilderHelpers';

/**
 * 13 new THPT Mathematics sample PDFs (Grades 10, 11, 12) bringing Toán from 5 -> 18 samples.
 * Every sample has verified math solutions, complete Page 2 Answer Key / Rubric,
 * and editable MathLive / SVG diagrams where appropriate.
 */
export async function generateMathExtraSample(
  sampleId: string
): Promise<StructuredSamplePayload | null> {
  if (sampleId === 'sample-math-06-tf4') {
    const grading = buildMcqSession('Phiếu Đúng/Sai 4 ý Toán 12', 'Toán', '12A1', [
      { number: 1, kind: 'tf4', answerKey: 'Đ-S-Đ-Đ', maxScore: 1 },
      { number: 2, kind: 'tf4', answerKey: 'Đ-Đ-S-Đ', maxScore: 1 },
      { number: 3, kind: 'tf4', answerKey: 'S-Đ-Đ-Đ', maxScore: 1 },
    ]);
    return buildStructuredPayload(
      {
        subjectLabel: 'Toán',
        gradeLabel: 'Lớp 12',
        docTypeLabel: 'Phiếu bài tập · Đúng/Sai 4 ý',
        title: 'PHIẾU BÀI TẬP ĐÚNG / SAI 4 Ý TOÁN 12 (ĐỊNH DẠNG THPT 2025)',
        subtitle: 'Chủ đề: Khảo sát hàm số, Nguyên hàm – Tích phân và Hình học Oxyz  |  Quy tắc: 0,1 – 0,25 – 0,5 – 1,0 điểm/câu',
        blocks: [
          { kind: 'heading', text: 'Câu 1. Cho hàm số f(x) = x³ - 3x² + 2 trên tập số thực R.' },
          {
            kind: 'lines',
            lines: [
              '   a) Đạo hàm của hàm số là f\'(x) = 3x² - 6x.                                      [ Đ / S ]',
              '   b) Hàm số đồng biến trên khoảng (0; 2).                                         [ Đ / S ]',
              '   c) Hàm số đạt cực đại tại x = 0 với giá trị cực đại y_CĐ = 2.                   [ Đ / S ]',
              '   d) Giá trị nhỏ nhất của hàm số trên đoạn [-1; 3] bằng -2.                       [ Đ / S ]',
            ],
          },
          { kind: 'heading', text: 'Câu 2. Cho hàm số g(x) = 2x + cos(x) và F(x) là một nguyên hàm thỏa F(0) = 1.' },
          {
            kind: 'lines',
            lines: [
              '   a) Họ tất cả các nguyên hàm của g(x) là x² + sin(x) + C.                        [ Đ / S ]',
              '   b) F(x) = x² + sin(x) + 1.                                                      [ Đ / S ]',
              '   c) Tích phân của g(x) trên đoạn [0; π] bằng π² + 2.                             [ Đ / S ]',
              '   d) F(π/2) = π²/4 + 2.                                                           [ Đ / S ]',
            ],
          },
          { kind: 'heading', text: 'Câu 3. Trong không gian Oxyz, cho điểm A(1; -2; 3) và mặt phẳng (P): 2x - y + 2z - 1 = 0.' },
          {
            kind: 'lines',
            lines: [
              '   a) Điểm A(1; -2; 3) thuộc mặt phẳng (P).                                        [ Đ / S ]',
              '   b) Một vectơ pháp tuyến của (P) là n = (2; -1; 2) có độ dài bằng 3.             [ Đ / S ]',
              '   c) Khoảng cách từ A đến (P) bằng 3.                                             [ Đ / S ]',
              '   d) Mặt cầu tâm A tiếp xúc với (P) có bán kính R = 3.                            [ Đ / S ]',
            ],
          },
          { kind: 'pageBreak' },
          { kind: 'heading', text: 'ĐÁP ÁN VÀ LỜI GIẢI CHI TIẾT' },
          {
            kind: 'table',
            headers: ['Câu', 'Đáp án (a-b-c-d)', 'Kiểm chứng tính toán'],
            colWeights: [1, 1.8, 5.2],
            rows: [
              [
                'Câu 1',
                'Đ – S – Đ – Đ',
                'a) Đúng: f\'(x) = 3x² - 6x = 3x(x - 2). b) Sai: trên (0; 2), f\'(x) < 0 nên hàm nghịch biến. c) Đúng: f(0) = 2. d) Đúng: f(-1) = -2, f(0) = 2, f(2) = -2, f(3) = 2 → min = -2.',
              ],
              [
                'Câu 2',
                'Đ – Đ – S – Đ',
                'a) Đúng. b) Đúng: F(0) = 0 + 0 + C = 1 → C = 1. c) Sai: [x² + sin(x)] từ 0 đến π = (π² + 0) - 0 = π². d) Đúng: (π/2)² + sin(π/2) + 1 = π²/4 + 2.',
              ],
              [
                'Câu 3',
                'S – Đ – Đ – Đ',
                'a) Sai: 2(1) - (-2) + 2(3) - 1 = 9 ≠ 0. b) Đúng: |n| = √(4+1+4) = 3. c) Đúng: d(A,(P)) = |9|/3 = 3. d) Đúng: R = d(A,(P)) = 3.',
              ],
            ],
          },
        ],
      },
      () => [],
      grading
    );
  }

  if (sampleId === 'sample-math-07-short') {
    const grading = buildMcqSession('Phiếu Trả lời ngắn Toán 12', 'Toán', '12A2', [
      { number: 1, kind: 'short', answerKey: '9', maxScore: 2 },
      { number: 2, kind: 'short', answerKey: '4.5', maxScore: 2 },
      { number: 3, kind: 'short', answerKey: '2500', maxScore: 2 },
      { number: 4, kind: 'short', answerKey: '6', maxScore: 2 },
      { number: 5, kind: 'short', answerKey: '0.6', maxScore: 2 },
    ]);
    return buildStructuredPayload(
      {
        subjectLabel: 'Toán',
        gradeLabel: 'Lớp 12',
        docTypeLabel: 'Phiếu bài tập · Trả lời ngắn',
        title: 'PHIẾU BÀI TẬP TRẢ LỜI NGẮN TOÁN 12 (THPT 2025)',
        subtitle: '5 câu trả lời ngắn (ghi kết quả số chính xác kèm đơn vị nếu có)  |  Thang điểm: 10',
        blocks: [
          { kind: 'heading', text: 'I. CÂU HỎI TRẢ LỜI NGẮN (5 câu × 2,0 điểm)' },
          {
            kind: 'lines',
            lines: [
              'Câu 1. Tìm giá trị lớn nhất của hàm số y = -x² + 6x trên đoạn [0; 5].',
              '   Đáp số: .......................',
              '',
              'Câu 2. Tính diện tích hình phẳng giới hạn bởi parabol y = x² và đường thẳng y = 3x.',
              '   Đáp số: ....................... (đvdt)',
              '',
              'Câu 3. Một người dùng 200 m lưới rào quanh một khu vườn hình chữ nhật. Diện tích lớn nhất có thể rào được là bao nhiêu m²?',
              '   Đáp số: ....................... (m²)',
              '',
              'Câu 4. Cho khối chóp tam giác có diện tích đáy B = 9 cm² và chiều cao h = 2 cm. Tính thể tích khối chóp (cm³).',
              '   Đáp số: ....................... (cm³)',
              '',
              'Câu 5. Trong một lớp học có 20 học sinh, trong đó 12 bạn thích môn Toán. Chọn ngẫu nhiên 1 bạn, tính xác suất để bạn đó thích môn Toán (viết dạng số thập phân).',
              '   Đáp số: .......................',
            ],
          },
          { kind: 'pageBreak' },
          { kind: 'heading', text: 'II. ĐÁP ÁN & HƯỚNG DẪN TÍNH NHANH' },
          {
            kind: 'table',
            headers: ['Câu', 'Đáp số', 'Lời giải tóm tắt'],
            colWeights: [1, 1.6, 5.4],
            rows: [
              ['1', '9', 'y\' = -2x + 6 = 0 ⇔ x = 3 ∈ [0; 5]; y(0)=0, y(3)=9, y(5)=5 → max = 9.'],
              ['2', '4,5 (9/2)', 'Giao điểm x = 0, x = 3. S = ∫₀³ (3x - x²) dx = [3x²/2 - x³/3]₀³ = 27/2 - 9 = 4,5.'],
              ['3', '2500 m²', 'Chu vi 2(a + b) = 200 ⇒ a + b = 100. Theo BĐT AM-GM: ab ≤ ((a+b)/2)² = 50² = 2500 m².'],
              ['4', '6 cm³', 'V = (1/3)·B·h = (1/3)·9·2 = 6 cm³.'],
              ['5', '0,6', 'P = 12 / 20 = 3 / 5 = 0,6.'],
            ],
          },
        ],
      },
      () => [],
      grading
    );
  }

  if (sampleId === 'sample-math-08-algebra') {
    return buildStructuredPayload(
      {
        subjectLabel: 'Toán',
        gradeLabel: 'Lớp 10',
        docTypeLabel: 'Phiếu bài tập · Đại số',
        title: 'PHIẾU BÀI TẬP BIỂU THỨC ĐẠI SỐ & TAM THỨC BẬC HAI',
        subtitle: 'Lớp 10  |  Rút gọn biểu thức hữu tỉ, xét dấu tam thức bậc hai và điều kiện có nghiệm.',
        blocks: [
          { kind: 'heading', text: 'Bài 1. Rút gọn biểu thức đại số (với x ≥ 0, x ≠ 4):' },
          { kind: 'spacer', height: 52 },
          {
            kind: 'lines',
            lines: [
              'a) Rút gọn biểu thức P(x).',
              'b) Tìm tất cả giá trị của x để P(x) = 3.',
            ],
          },
          { kind: 'heading', text: 'Bài 2. Xét dấu các tam thức bậc hai sau:' },
          {
            kind: 'lines',
            lines: [
              'a) f(x) = x² - 5x + 6.',
              'b) g(x) = -2x² + 4x - 2.',
              'c) Tìm tham số m để h(x) = x² - 2(m - 1)x + m² - 3 > 0 với mọi x ∈ R.',
            ],
          },
          { kind: 'writingLines', title: 'Phần trình bày lời giải của học sinh:', count: 9 },
          { kind: 'pageBreak' },
          { kind: 'heading', text: 'ĐÁP ÁN VÀ HƯỚNG DẪN CHẤM' },
          {
            kind: 'lines',
            lines: [
              'Bài 1:',
              '  a) P(x) = (x - 4) / (√x - 2) = (√x - 2)(√x + 2) / (√x - 2) = √x + 2 (với x ≥ 0, x ≠ 4).',
              '  b) P(x) = 3 ⇔ √x + 2 = 3 ⇔ √x = 1 ⇔ x = 1 (thỏa mãn điều kiện).',
              '',
              'Bài 2:',
              '  a) f(x) = 0 ⇔ x = 2 hoặc x = 3. Vì a = 1 > 0: f(x) > 0 trên (-∞; 2) ∪ (3; +∞); f(x) < 0 trên (2; 3).',
              '  b) g(x) = -2(x - 1)² ≤ 0 với mọi x ∈ R; g(x) = 0 ⇔ x = 1.',
              '  c) h(x) > 0 ∀x ∈ R ⇔ a = 1 > 0 và Δ\' = (m - 1)² - (m² - 3) < 0 ⇔ -2m + 4 < 0 ⇔ m > 2.',
            ],
          },
        ],
      },
      (pageId) => [
        makeFormulaObj('m8-f1', 'P(x) = \\frac{x - 4}{\\sqrt{x} - 2}', pageId, 68, 174, '#164E63', 17),
      ]
    );
  }

  if (sampleId === 'sample-math-09-eq-ineq') {
    return buildStructuredPayload({
      subjectLabel: 'Toán',
      gradeLabel: 'Lớp 10',
      docTypeLabel: 'Phiếu bài tập · Phương trình & BPT',
      title: 'PHIẾU BÀI TẬP PHƯƠNG TRÌNH & BẤT PHƯƠNG TRÌNH',
      subtitle: 'Lớp 10  |  Phương trình quy về bậc hai chứa căn và bất phương trình bậc hai một ẩn.',
      blocks: [
        { kind: 'heading', text: 'Phần 1. Giải các bất phương trình bậc hai sau (4,0 điểm):' },
        {
          kind: 'lines',
          lines: [
            '1) x² - 7x + 10 ≤ 0.',
            '2) -x² + 4x + 5 > 0.',
          ],
        },
        { kind: 'heading', text: 'Phần 2. Giải các phương trình chứa căn thức (4,0 điểm):' },
        {
          kind: 'lines',
          lines: [
            '3) √(2x² - 3x + 1) = √(x² + x - 2).',
            '4) √(3x² - 5x + 2) = x - 1.',
          ],
        },
        { kind: 'heading', text: 'Phần 3. Hệ bất phương trình bậc nhất hai ẩn (2,0 điểm):' },
        {
          kind: 'lines',
          lines: [
            '5) Tìm giá trị lớn nhất của biểu thức F(x; y) = 3x + 2y trên miền nghiệm của hệ: x ≥ 0; y ≥ 0; x + y ≤ 4.',
          ],
        },
        { kind: 'writingLines', title: 'Trình bày bài làm:', count: 7 },
        { kind: 'pageBreak' },
        { kind: 'heading', text: 'ĐÁP ÁN CHI TIẾT' },
        {
          kind: 'lines',
          lines: [
            '1) Nghiệm x = 2, x = 5 ⇒ Tập nghiệm S = [2; 5].',
            '2) Nghiệm x = -1, x = 5 (a = -1 < 0) ⇒ Tập nghiệm S = (-1; 5).',
            '3) Bình phương hai vế: 2x² - 3x + 1 = x² + x - 2 ⇔ x² - 4x + 3 = 0 ⇔ x = 1 hoặc x = 3.',
            '   Thử lại vào x² + x - 2 ≥ 0: x = 1 cho 0 ≥ 0 (nhận); x = 3 cho 10 ≥ 0 (nhận). Vậy S = {1; 3}.',
            '4) Điều kiện x - 1 ≥ 0 ⇔ x ≥ 1. Bình phương: 3x² - 5x + 2 = x² - 2x + 1 ⇔ 2x² - 3x + 1 = 0 ⇔ x = 1 (nhận) hoặc x = 1/2 (loại). Vậy S = {1}.',
            '5) Miền nghiệm là tam giác có các đỉnh O(0;0), A(4;0), B(0;4). F(0;0)=0, F(4;0)=12, F(0;4)=8 ⇒ max F = 12 tại (4; 0).',
          ],
        },
      ],
    });
  }

  if (sampleId === 'sample-math-10-trig') {
    return buildStructuredPayload(
      {
        subjectLabel: 'Toán',
        gradeLabel: 'Lớp 11',
        docTypeLabel: 'Phiếu bài tập · Lượng giác',
        title: 'PHIẾU BÀI TẬP LƯỢNG GIÁC & PHƯƠNG TRÌNH LƯỢNG GIÁC',
        subtitle: 'Lớp 11  |  Công thức cộng, công thức nhân đôi và giải phương trình lượng giác cơ bản.',
        blocks: [
          { kind: 'heading', text: 'Câu 1 (2,5 điểm). Tính giá trị lượng giác' },
          {
            kind: 'lines',
            lines: [
              'Cho sin(α) = 3/5 với π/2 < α < π. Tính cos(α), tan(α) và sin(2α).',
            ],
          },
          { kind: 'heading', text: 'Câu 2 (2,5 điểm). Rút gọn biểu thức lượng giác:' },
          { kind: 'spacer', height: 48 },
          { kind: 'heading', text: 'Câu 3 (5,0 điểm). Giải các phương trình lượng giác sau:' },
          {
            kind: 'lines',
            lines: [
              'a) 2sin(x) - √3 = 0.',
              'b) cos(2x - π/3) = 1/2.',
              'c) Tìm số nghiệm của phương trình sin(x) = 1/2 trên đoạn [0; 2π].',
            ],
          },
          { kind: 'writingLines', title: 'Bài làm của học sinh:', count: 7 },
          { kind: 'pageBreak' },
          { kind: 'heading', text: 'ĐÁP ÁN LƯỢNG GIÁC 11' },
          {
            kind: 'lines',
            lines: [
              'Câu 1: Vì π/2 < α < π nên cos(α) < 0 ⇒ cos(α) = -√(1 - 9/25) = -4/5.',
              '  tan(α) = sin(α)/cos(α) = -3/4;   sin(2α) = 2·sin(α)·cos(α) = 2·(3/5)·(-4/5) = -24/25.',
              'Câu 2: A = sin(2x) / (2cos(x)) = (2sin(x)cos(x)) / (2cos(x)) = sin(x) (với cos(x) ≠ 0).',
              'Câu 3:',
              '  a) sin(x) = √3/2 ⇔ x = π/3 + k2π hoặc x = 2π/3 + k2π (k ∈ Z).',
              '  b) 2x - π/3 = ±π/3 + k2π ⇔ x = π/3 + kπ hoặc x = kπ (k ∈ Z).',
              '  c) Trên [0; 2π], sin(x) = 1/2 có 2 nghiệm là x = π/6 và x = 5π/6.',
            ],
          },
        ],
      },
      (pageId) => [
        makeFormulaObj('m10-f1', 'A = \\frac{\\sin 2x}{2\\cos x}', pageId, 68, 224, '#087F70', 17),
      ]
    );
  }

  if (sampleId === 'sample-math-11-vector') {
    return buildStructuredPayload(
      {
        subjectLabel: 'Toán',
        gradeLabel: 'Lớp 10',
        docTypeLabel: 'Phiếu bài tập · Vectơ',
        title: 'PHIẾU BÀI TẬP VECTƠ VÀ TÍCH VÔ HƯỚNG TRONG MẶT PHẲNG',
        subtitle: 'Lớp 10  |  Quy tắc cộng, trung điểm, trọng tâm và tích vô hướng hai vectơ.',
        blocks: [
          { kind: 'heading', text: 'Bài 1 (3,0 điểm). Chứng minh đẳng thức vectơ' },
          {
            kind: 'lines',
            lines: [
              'Cho hình bình hành ABCD tâm O. Gọi M, N lần lượt là trung điểm của AB và CD.',
              'a) Chứng minh: vec(AB) + vec(AD) = vec(AC) và vec(OA) + vec(OB) + vec(OC) + vec(OD) = vec(0).',
              'b) Chứng minh: vec(AN) + vec(CM) = vec(0).',
            ],
          },
          { kind: 'heading', text: 'Bài 2 (4,0 điểm). Tọa độ và tích vô hướng của hai vectơ' },
          {
            kind: 'lines',
            lines: [
              'Trong mặt phẳng Oxy, cho vec(u) = (2; -1) và vec(v) = (1; 3).',
              'a) Tính tọa độ của vec(w) = 2·vec(u) + vec(v) và độ dài |vec(u)|, |vec(v)|.',
              'b) Tính tích vô hướng vec(u)·vec(v) và côsin góc giữa hai vectơ vec(u), vec(v).',
            ],
          },
          { kind: 'heading', text: 'Bài 3 (3,0 điểm). Ứng dụng thực tế — Tổng hợp lực' },
          {
            kind: 'lines',
            lines: [
              'Hai lực F₁ và F₂ cùng tác dụng vào một vật tại điểm O có độ lớn |F₁| = 30 N, |F₂| = 40 N và vuông góc với nhau. Tính độ lớn hợp lực F = F₁ + F₂.',
            ],
          },
          { kind: 'writingLines', count: 5 },
          { kind: 'pageBreak' },
          { kind: 'heading', text: 'ĐÁP ÁN BÀI TẬP VECTƠ LỚP 10' },
          {
            kind: 'lines',
            lines: [
              'Bài 1: O là trung điểm của AC và BD nên vec(OA)+vec(OC)=vec(0) và vec(OB)+vec(OD)=vec(0). Tứ giác AMCN là hình bình hành nên vec(AN) = vec(MC) = -vec(CM) ⇒ vec(AN) + vec(CM) = vec(0).',
              'Bài 2:',
              '  a) vec(w) = (5; 1);  |vec(u)| = √(4 + 1) = √5;  |vec(v)| = √(1 + 9) = √10.',
              '  b) vec(u)·vec(v) = 2·1 + (-1)·3 = -1;  cos(u, v) = -1 / (√5·√10) = -1 / (5√2) = -√2 / 10.',
              'Bài 3: Vì F₁ ⊥ F₂ nên |F| = √(30² + 40²) = √2500 = 50 N.',
            ],
          },
        ],
      }
    );
  }

  if (sampleId === 'sample-math-12-oxy') {
    return buildStructuredPayload({
      subjectLabel: 'Toán',
      gradeLabel: 'Lớp 10',
      docTypeLabel: 'Phiếu bài tập · Tọa độ Oxy',
      title: 'PHIẾU BÀI TẬP PHƯƠNG PHÁP TỌA ĐỘ TRONG MẶT PHẲNG Oxy',
      subtitle: 'Lớp 10  |  Phương trình đường thẳng, khoảng cách từ điểm đến đường thẳng và phương trình đường tròn.',
      blocks: [
        { kind: 'heading', text: 'Bài 1 (4,0 điểm). Phương trình đường thẳng và khoảng cách' },
        {
          kind: 'lines',
          lines: [
            'Trong mặt phẳng Oxy, cho tam giác ABC có A(1; 2), B(4; 6), C(-2; 6).',
            'a) Viết phương trình tổng quát của đường thẳng AB.',
            'b) Tính khoảng cách từ điểm C đến đường thẳng AB và suy ra diện tích tam giác ABC.',
          ],
        },
        { kind: 'heading', text: 'Bài 2 (4,0 điểm). Phương trình đường tròn và tiếp tuyến' },
        {
          kind: 'lines',
          lines: [
            'Cho đường tròn (C): (x - 2)² + (y + 1)² = 25.',
            'a) Xác định tọa độ tâm I và bán kính R của (C).',
            'b) Chứng minh điểm M(5; 3) thuộc (C) và viết phương trình tiếp tuyến của (C) tại M.',
          ],
        },
        { kind: 'heading', text: 'Bài 3 (2,0 điểm). Đường tròn đi qua ba điểm' },
        {
          kind: 'lines',
          lines: [
            'Viết phương trình đường tròn có đường kính là đoạn thẳng PQ với P(0; 2) và Q(4; 6).',
          ],
        },
        { kind: 'writingLines', count: 6 },
        { kind: 'pageBreak' },
        { kind: 'heading', text: 'ĐÁP ÁN TỌA ĐỘ MẶT PHẲNG Oxy' },
        {
          kind: 'lines',
          lines: [
            'Bài 1:',
            '  a) vec(AB) = (3; 4) ⇒ VTPT n = (4; -3). Đường thẳng AB: 4(x - 1) - 3(y - 2) = 0 ⇔ 4x - 3y + 2 = 0.',
            '  b) d(C, AB) = |4(-2) - 3(6) + 2| / √(4² + (-3)²) = |-24| / 5 = 24/5 = 4,8.',
            '     Độ dài AB = √(3² + 4²) = 5 ⇒ S_ABC = (1/2)·5·(24/5) = 12 (đvdt).',
            'Bài 2:',
            '  a) Tâm I(2; -1), bán kính R = 5.',
            '  b) (5 - 2)² + (3 + 1)² = 9 + 16 = 25 ⇒ M ∈ (C). VTPT tiếp tuyến vec(IM) = (3; 4) ⇒ 3(x - 5) + 4(y - 3) = 0 ⇔ 3x + 4y - 27 = 0.',
            'Bài 3: Tâm trung điểm J(2; 4), R = PQ/2 = √(16+16)/2 = 2√2 ⇒ (x - 2)² + (y - 4)² = 8.',
          ],
        },
      ],
    });
  }

  if (sampleId === 'sample-math-13-plane-geom') {
    return buildStructuredPayload(
      {
        subjectLabel: 'Toán',
        gradeLabel: 'Lớp 10',
        docTypeLabel: 'Phiếu bài tập · Hình học phẳng',
        title: 'PHIẾU BÀI TẬP HÌNH HỌC PHẲNG: HỆ THỨC LƯỢNG TRONG TAM GIÁC',
        subtitle: 'Lớp 10  |  Định lí Côsin, Định lí Sin, công thức Hê-rông và đo đạc khoảng cách thực tế.',
        blocks: [
          { kind: 'heading', text: 'Bài 1 (4,0 điểm). Giải tam giác bằng Định lí Côsin và Định lí Sin' },
          {
            kind: 'lines',
            lines: [
              'Cho tam giác ABC có AB = 5 cm, AC = 8 cm và góc A = 60°.',
              'a) Tính độ dài cạnh BC.',
              'b) Tính diện tích S của tam giác ABC và bán kính R của đường tròn ngoại tiếp tam giác ABC.',
            ],
          },
          { kind: 'spacer', height: 172 },
          { kind: 'heading', text: 'Bài 2 (3,0 điểm). Công thức Hê-rông' },
          {
            kind: 'lines',
            lines: [
              'Một mảnh đất hình tam giác có độ dài ba cạnh lần lượt là 13 m, 14 m và 15 m. Tính diện tích mảnh đất và độ dài đường cao ứng với cạnh dài 14 m.',
            ],
          },
          { kind: 'heading', text: 'Bài 3 (3,0 điểm). Bài toán đo đạc thực tiễn' },
          {
            kind: 'lines',
            lines: [
              'Từ một điểm A ở mặt đất, người ta đo góc nâng đến đỉnh C của một cột cờ là 30°; đi thẳng tiến lại gần chân cột cờ B thêm 20 m đến điểm D thì góc nâng là 60°. Tính chiều cao h = BC của cột cờ (làm tròn đến 0,1 m).',
            ],
          },
          { kind: 'pageBreak' },
          { kind: 'heading', text: 'ĐÁP ÁN HÌNH HỌC PHẲNG 10' },
          {
            kind: 'lines',
            lines: [
              'Bài 1:',
              '  a) BC² = AB² + AC² - 2·AB·AC·cos(60°) = 25 + 64 - 2·5·8·(1/2) = 49 ⇒ BC = 7 cm.',
              '  b) S = (1/2)·5·8·sin(60°) = 10√3 cm²;   R = BC / (2sin 60°) = 7 / √3 = 7√3/3 cm.',
              'Bài 2:',
              '  Nửa chu vi p = (13 + 14 + 15)/2 = 21 m. S = √(21·8·7·6) = √7056 = 84 m².',
              '  Đường cao ứng với cạnh 14 m: h = 2S / 14 = 168 / 14 = 12 m.',
              'Bài 3:',
              '  Trong ΔACD có góc D ngoài = 60° = 30° + góc ACD ⇒ góc ACD = 30° ⇒ ΔACD cân tại D ⇒ CD = AD = 20 m.',
              '  Trong ΔBCD vuông tại B: h = CD·sin(60°) = 20·(√3/2) = 10√3 ≈ 17,3 m.',
            ],
          },
        ],
      },
      (pageId) =>
        makeDiagramObj('m13-tri', 'math-triangle-general', 'math', pageId, 185, 226, 225, 160, 2)
    );
  }

  if (sampleId === 'sample-math-14-oxyz') {
    return buildStructuredPayload({
      subjectLabel: 'Toán',
      gradeLabel: 'Lớp 12',
      docTypeLabel: 'Phiếu bài tập · Tọa độ Oxyz',
      title: 'PHIẾU BÀI TẬP HÌNH HỌC TỌA ĐỘ KHÔNG GIAN Oxyz',
      subtitle: 'Lớp 12  |  Phương trình mặt phẳng, đường thẳng, mặt cầu và góc – khoảng cách trong Oxyz.',
      blocks: [
        { kind: 'heading', text: 'Bài 1 (3,5 điểm). Phương trình mặt phẳng đi qua ba điểm' },
        {
          kind: 'lines',
          lines: [
            'Trong không gian Oxyz, cho ba điểm A(2; 0; 0), B(0; 3; 0), C(0; 0; 6).',
            'a) Viết phương trình mặt phẳng (ABC) dưới dạng đoạn chắn và dạng tổng quát.',
            'b) Tính khoảng cách từ gốc tọa độ O(0; 0; 0) đến mặt phẳng (ABC).',
          ],
        },
        { kind: 'heading', text: 'Bài 2 (3,5 điểm). Đường thẳng và giao điểm với mặt phẳng' },
        {
          kind: 'lines',
          lines: [
            'Cho đường thẳng d: x = 1 + t; y = 2 - t; z = 3 + 2t và mặt phẳng (P): x + 2y - z + 4 = 0.',
            'a) Tìm tọa độ giao điểm M của đường thẳng d và mặt phẳng (P).',
            'b) Tính sin của góc giữa đường thẳng d và mặt phẳng (P).',
          ],
        },
        { kind: 'heading', text: 'Bài 3 (3,0 điểm). Phương trình mặt cầu' },
        {
          kind: 'lines',
          lines: [
            'Viết phương trình mặt cầu (S) có tâm I(1; -2; 3) và đi qua điểm K(3; 0; 2).',
          ],
        },
        { kind: 'writingLines', count: 6 },
        { kind: 'pageBreak' },
        { kind: 'heading', text: 'ĐÁP ÁN HÌNH HỌC KHÔNG GIAN Oxyz' },
        {
          kind: 'lines',
          lines: [
            'Bài 1:',
            '  a) Phương trình đoạn chắn: x/2 + y/3 + z/6 = 1 ⇔ 3x + 2y + z - 6 = 0.',
            '  b) d(O, (ABC)) = |-6| / √(3² + 2² + 1²) = 6 / √14 = 3√14 / 7.',
            'Bài 2:',
            '  a) Thay d vào (P): (1 + t) + 2(2 - t) - (3 + 2t) + 4 = 0 ⇔ 6 - 3t = 0 ⇔ t = 2 ⇒ M(3; 0; 7).',
            '  b) u_d = (1; -1; 2), n_P = (1; 2; -1). sin(d,(P)) = |1 - 2 - 2| / (√6 · √6) = 3 / 6 = 1/2 (góc 30°).',
            'Bài 3:',
            '  R = IK = √((3-1)² + (0+2)² + (2-3)²) = √(4 + 4 + 1) = 3 ⇒ (S): (x - 1)² + (y + 2)² + (z - 3)² = 9.',
          ],
        },
      ],
    });
  }

  if (sampleId === 'sample-math-15-statistics') {
    return buildStructuredPayload({
      subjectLabel: 'Toán',
      gradeLabel: 'Lớp 11',
      docTypeLabel: 'Phiếu bài tập · Thống kê',
      title: 'PHIẾU BÀI TẬP THỐNG KÊ: MẪU SỐ LIỆU GHÉP NHÓM',
      subtitle: 'Lớp 11  |  Tính số trung bình, trung vị và tứ phân vị từ bảng tần số ghép nhóm (Số liệu giả định).',
      blocks: [
        {
          kind: 'callout',
          title: 'Nguồn dữ liệu thực hành',
          text: 'Bảng thời gian tự học của 40 học sinh dưới đây là SỐ LIỆU GIẢ ĐỊNH dùng để thực hành tính các số đặc trưng đo xu thế trung tâm.',
          tone: 'amber',
        },
        { kind: 'heading', text: 'Bảng tần số ghép nhóm thời gian tự học mỗi ngày của 40 học sinh (đơn vị: phút):' },
        {
          kind: 'table',
          headers: ['Nhóm thời gian (phút)', '[30; 50)', '[50; 70)', '[70; 90)', '[90; 110)', '[110; 130)'],
          colWeights: [2.4, 1.1, 1.1, 1.1, 1.1, 1.2],
          rows: [
            ['Giá trị đại diện c_i', '40', '60', '80', '100', '120'],
            ['Số học sinh (n_i)', '4', '10', '14', '8', '4'],
          ],
        },
        { kind: 'heading', text: 'Yêu cầu thực hiện:' },
        {
          kind: 'lines',
          lines: [
            '1) (3,0 điểm) Tính số trung bình cộng (x̄) của mẫu số liệu ghép nhóm trên.',
            '2) (3,5 điểm) Xác định nhóm chứa trung vị (M_e) và tính giá trị trung vị M_e (làm tròn 2 chữ số thập phân).',
            '3) (3,5 điểm) Tìm tứ phân vị thứ nhất Q₁ và tứ phân vị thứ ba Q₃ của mẫu số liệu.',
          ],
        },
        { kind: 'writingLines', title: 'Phần trình bày lời giải:', count: 7 },
        { kind: 'pageBreak' },
        { kind: 'heading', text: 'ĐÁP ÁN BÀI TẬP THỐNG KÊ 11' },
        {
          kind: 'lines',
          lines: [
            '1) Số trung bình cộng:',
            '   x̄ = (4·40 + 10·60 + 14·80 + 8·100 + 4·120) / 40 = (160 + 600 + 1120 + 800 + 480) / 40 = 3160 / 40 = 79 (phút).',
            '',
            '2) Trung vị M_e (cỡ mẫu n = 40 ⇒ n/2 = 20):',
            '   Tần số tích lũy: nhóm 1 là 4; nhóm 2 là 14; nhóm 3 là 28 ⇒ Nhóm chứa trung vị là [70; 90).',
            '   M_e = 70 + ((20 - 14) / 14) · 20 = 70 + 120/14 ≈ 78,57 (phút).',
            '',
            '3) Tứ phân vị Q₁ (n/4 = 10) và Q₃ (3n/4 = 30):',
            '   - Q₁ thuộc nhóm [50; 70): Q₁ = 50 + ((10 - 4) / 10) · 20 = 50 + 12 = 62 (phút).',
            '   - Q₃ thuộc nhóm [90; 110): Q₃ = 90 + ((30 - 28) / 8) · 20 = 90 + 5 = 95 (phút).',
          ],
        },
      ],
    });
  }

  if (sampleId === 'sample-math-16-probability') {
    return buildStructuredPayload({
      subjectLabel: 'Toán',
      gradeLabel: 'Lớp 11',
      docTypeLabel: 'Phiếu bài tập · Xác suất',
      title: 'PHIẾU BÀI TẬP XÁC SUẤT: QUY TẮC CỘNG, NHÂN & BIẾN CỐ ĐỘC LẬP',
      subtitle: 'Lớp 11  |  Biến cố hợp, biến cố giao, biến cố xung khắc và xác suất thực tế.',
      blocks: [
        { kind: 'heading', text: 'Bài 1 (3,0 điểm). Quy tắc cộng xác suất' },
        {
          kind: 'lines',
          lines: [
            'Gieo một con xúc xắc cân đối và đồng chất một lần. Gọi A là biến cố "xuất hiện mặt chẵn", B là biến cố "xuất hiện mặt chia hết cho 3". Tính P(A), P(B), P(A ∩ B) và P(A ∪ B).',
          ],
        },
        { kind: 'heading', text: 'Bài 2 (3,5 điểm). Hai biến cố độc lập' },
        {
          kind: 'lines',
          lines: [
            'Hai xạ thủ An và Bình độc lập cùng bắn vào bia. Xác suất bắn trúng đích của An là 0,8 và của Bình là 0,7. Tính xác suất để:',
            'a) Cả hai người đều bắn trúng đích.',
            'b) Có ít nhất một người bắn trúng đích.',
            'c) Đúng một người bắn trúng đích.',
          ],
        },
        { kind: 'heading', text: 'Bài 3 (3,5 điểm). Chọn ngẫu nhiên kết hợp tổ hợp' },
        {
          kind: 'lines',
          lines: [
            'Một hộp có 6 viên bi đỏ và 4 viên bi xanh. Lấy ngẫu nhiên đồng thời 3 viên bi. Tính xác suất để 3 viên bi lấy ra có đủ cả hai màu.',
          ],
        },
        { kind: 'writingLines', count: 6 },
        { kind: 'pageBreak' },
        { kind: 'heading', text: 'ĐÁP ÁN BÀI TẬP XÁC SUẤT 11' },
        {
          kind: 'lines',
          lines: [
            'Bài 1: A = {2, 4, 6} ⇒ P(A) = 3/6 = 1/2;  B = {3, 6} ⇒ P(B) = 2/6 = 1/3;  A ∩ B = {6} ⇒ P(A ∩ B) = 1/6.',
            '  P(A ∪ B) = P(A) + P(B) - P(A ∩ B) = 1/2 + 1/3 - 1/6 = 4/6 = 2/3.',
            'Bài 2:',
            '  a) P(A ∩ B) = 0,8 · 0,7 = 0,56.',
            '  b) P(ít nhất 1 trúng) = 1 - (1 - 0,8)(1 - 0,7) = 1 - 0,2·0,3 = 0,94.',
            '  c) P(đúng 1 trúng) = 0,8·0,3 + 0,2·0,7 = 0,24 + 0,14 = 0,38.',
            'Bài 3: n(Ω) = C(10, 3) = 120. Biến cố đối "chỉ có 1 màu": C(6, 3) + C(4, 3) = 20 + 4 = 24.',
            '  Xác suất cần tìm: P = 1 - 24/120 = 96/120 = 4/5 = 0,8.',
          ],
        },
      ],
    });
  }

  if (sampleId === 'sample-math-17-variation') {
    return buildStructuredPayload(
      {
        subjectLabel: 'Toán',
        gradeLabel: 'Lớp 12',
        docTypeLabel: 'Phiếu học tập · Bảng biến thiên',
        title: 'PHIẾU HỌC TẬP LẬP BẢNG BIẾN THIÊN, TIỆM CẬN & CỰC TRỊ',
        subtitle: 'Lớp 12  |  Phân tích chiều biến thiên hàm bậc ba, hàm phân thức hữu tỉ và biện luận số nghiệm.',
        blocks: [
          { kind: 'heading', text: 'Hoạt động 1. Quan sát mẫu bảng biến thiên vector và hoàn thiện khảo sát' },
          { kind: 'spacer', height: 170 },
          { kind: 'heading', text: 'Bài 1 (5,0 điểm). Khảo sát hàm phân thức y = (2x - 1) / (x - 1)' },
          {
            kind: 'lines',
            lines: [
              'a) Tìm tập xác định, tiệm cận đứng và tiệm cận ngang của đồ thị hàm số.',
              'b) Tính đạo hàm y\', lập bảng biến thiên và kết luận các khoảng đơn điệu của hàm số.',
            ],
          },
          { kind: 'heading', text: 'Bài 2 (5,0 điểm). Biện luận số nghiệm bằng bảng biến thiên' },
          {
            kind: 'lines',
            lines: [
              'Cho hàm số y = x³ - 3x + 1. Lập bảng biến thiên và tìm tất cả giá trị thực của tham số m để phương trình x³ - 3x + 1 = m có đúng 3 nghiệm thực phân biệt.',
            ],
          },
          { kind: 'writingLines', count: 4 },
          { kind: 'pageBreak' },
          { kind: 'heading', text: 'ĐÁP ÁN BẢNG BIẾN THIÊN & TIỆM CẬN' },
          {
            kind: 'lines',
            lines: [
              'Bài 1:',
              '  a) TXĐ: D = R \\ {1}. Tiệm cận đứng: x = 1; Tiệm cận ngang: y = 2.',
              '  b) y\' = -1 / (x - 1)² < 0 với mọi x ≠ 1 ⇒ Hàm số nghịch biến trên (-∞; 1) và (1; +∞), không có cực trị.',
              'Bài 2:',
              '  y\' = 3x² - 3 = 0 ⇔ x = -1 hoặc x = 1.',
              '  Cực đại y_CĐ = y(-1) = 3; Cực tiểu y_CT = y(1) = -1.',
              '  Phương trình x³ - 3x + 1 = m có 3 nghiệm phân biệt ⇔ -1 < m < 3.',
            ],
          },
        ],
      },
      (pageId) =>
        makeDiagramObj('m17-bbt', 'math-sign-table', 'math', pageId, 165, 162, 265, 158, 2)
    );
  }

  if (sampleId === 'sample-math-18-realworld') {
    const grading = buildRubricSession('Bài tập Toán thực tiễn 12', 'Toán', '12A1', [
      { id: 'mr1', label: 'Bài 1 (Tối ưu hộp không nắp)', maxScore: 3.5 },
      { id: 'mr2', label: 'Bài 2 (Lãi suất kép ngân hàng)', maxScore: 3.5 },
      { id: 'mr3', label: 'Bài 3 (Chi phí sản xuất tối ưu)', maxScore: 3.0 },
    ]);
    return buildStructuredPayload(
      {
        subjectLabel: 'Toán',
        gradeLabel: 'Lớp 12',
        docTypeLabel: 'Phiếu học tập · Toán thực tiễn',
        title: 'PHIẾU BÀI TẬP TOÁN THỰC TIỄN & MÔ HÌNH HÓA (TỐI ƯU – TÀI CHÍNH)',
        subtitle: 'Lớp 12  |  Ứng dụng đạo hàm tìm giá trị lớn nhất/nhỏ nhất và công thức lãi kép.',
        blocks: [
          { kind: 'heading', text: 'Bài 1 (3,5 điểm). Tối ưu thể tích hộp carton' },
          {
            kind: 'lines',
            lines: [
              'Từ một tấm bìa hình vuông cạnh 12 cm, người ta cắt ở bốn góc bốn hình vuông bằng nhau cạnh x (cm) rồi gập lên tạo thành chiếc hộp hình hộp chữ nhật không nắp. Tìm x để thể tích chiếc hộp lớn nhất và tính thể tích lớn nhất đó.',
            ],
          },
          { kind: 'heading', text: 'Bài 2 (3,5 điểm). Bài toán lãi suất kép' },
          {
            kind: 'lines',
            lines: [
              'Một giáo viên gửi tiết kiệm 100 triệu đồng với lãi suất kép 6%/năm (giả định lãi suất không đổi). Hỏi sau 5 năm, tổng số tiền cả gốc lẫn lãi thu được là bao nhiêu triệu đồng (làm tròn đến 0,01 triệu đồng)?',
            ],
          },
          { kind: 'heading', text: 'Bài 3 (3,0 điểm). Tối ưu chi phí trung bình' },
          {
            kind: 'lines',
            lines: [
              'Một xưởng nhỏ sản xuất x sản phẩm mỗi ngày (x > 0) với tổng chi phí mô phỏng C(x) = x² + 40x + 400 (nghìn đồng). Tìm số sản phẩm x mỗi ngày để chi phí trung bình c(x) = C(x)/x đạt giá trị nhỏ nhất.',
            ],
          },
          { kind: 'writingLines', title: 'Phần trình bày lời giải:', count: 6 },
          { kind: 'pageBreak' },
          { kind: 'heading', text: 'ĐÁP ÁN & THANG ĐIỂM TOÁN THỰC TIỄN' },
          {
            kind: 'lines',
            lines: [
              'Bài 1 (3,5 điểm): Điều kiện 0 < x < 6. V(x) = x(12 - 2x)² = 4x³ - 48x² + 144x.',
              '  V\'(x) = 12x² - 96x + 144 = 0 ⇔ x = 2 (nhận) hoặc x = 6 (loại).',
              '  Lập BBT ⇒ V đạt cực đại tại x = 2 cm, với V_max = 2 · (12 - 4)² = 128 cm³.',
              'Bài 2 (3,5 điểm): Công thức lãi kép A = P(1 + r)^n = 100 · (1,06)^5 ≈ 133,82 triệu đồng.',
              'Bài 3 (3,0 điểm): c(x) = x + 40 + 400/x. Theo BĐT AM-GM: x + 400/x ≥ 2√400 = 40 ⇒ c(x) ≥ 80 nghìn đồng.',
              '  Dấu "=" xảy ra khi x = 400/x ⇔ x = 20 sản phẩm/ngày.',
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
