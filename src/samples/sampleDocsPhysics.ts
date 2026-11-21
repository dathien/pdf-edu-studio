import {
  buildMcqSession,
  buildRubricSession,
  buildStructuredPayload,
  makeDiagramObj,
  makeFormulaObj,
  type StructuredSamplePayload,
} from './sampleBuilderHelpers';

/**
 * 12 new THPT Physics sample PDFs (Grades 10, 11, 12) bringing Vật lí from 2 -> 14 samples.
 */
export async function generatePhysicsExtraSample(
  sampleId: string
): Promise<StructuredSamplePayload | null> {
  if (sampleId === 'sample-phys-03-mcq') {
    const grading = buildMcqSession('Đề trắc nghiệm Vật lí 10', 'Vật lí', '10A1', [
      { number: 1, kind: 'abcd', answerKey: 'B', maxScore: 1 },
      { number: 2, kind: 'abcd', answerKey: 'C', maxScore: 1 },
      { number: 3, kind: 'abcd', answerKey: 'A', maxScore: 1 },
      { number: 4, kind: 'abcd', answerKey: 'D', maxScore: 1 },
      { number: 5, kind: 'abcd', answerKey: 'B', maxScore: 1 },
      { number: 6, kind: 'abcd', answerKey: 'A', maxScore: 1 },
      { number: 7, kind: 'abcd', answerKey: 'C', maxScore: 1 },
      { number: 8, kind: 'abcd', answerKey: 'D', maxScore: 1 },
      { number: 9, kind: 'abcd', answerKey: 'A', maxScore: 1 },
      { number: 10, kind: 'abcd', answerKey: 'C', maxScore: 1 },
    ]);
    return buildStructuredPayload(
      {
        subjectLabel: 'Vật lí',
        gradeLabel: 'Lớp 10',
        docTypeLabel: 'Đề kiểm tra · Trắc nghiệm',
        title: 'ĐỀ TRẮC NGHIỆM VẬT LÍ 10: ĐỘNG HỌC, LỰC & CÔNG SUẤT',
        subtitle: 'Thời gian: 25 phút  |  10 câu trắc nghiệm nhiều lựa chọn kèm đáp án và lời giải ngắn.',
        blocks: [
          { kind: 'heading', text: 'I. CÂU HỎI TRẮC NGHIỆM (10 câu × 1,0 điểm)' },
          {
            kind: 'lines',
            lines: [
              'Câu 1. Đại lượng nào sau đây là đại lượng vectơ?',
              '   A. Quãng đường đi được   B. Độ dịch chuyển   C. Tốc độ trung bình   D. Thời gian',
              'Câu 2. Đơn vị đo gia tốc trong hệ đơn vị đo lường quốc tế SI là:',
              '   A. m/s     B. km/h     C. m/s²     D. N/kg·s',
              'Câu 3. Theo định luật II Newton, gia tốc của một vật luôn cùng hướng với:',
              '   A. Hợp lực tác dụng lên vật   B. Vận tốc đầu   C. Lực ma sát   D. Trọng lực',
              'Câu 4. Một vật khối lượng 2 kg chịu hợp lực không đổi 6 N. Độ lớn gia tốc của vật là:',
              '   A. 12 m/s²     B. 4 m/s²     C. 0,33 m/s²     D. 3 m/s²',
              'Câu 5. Lực và phản lực theo định luật III Newton có đặc điểm nào sau đây?',
              '   A. Tác dụng lên cùng một vật                  B. Cùng phương, ngược chiều, cùng độ lớn',
              '   C. Triệt tiêu nhau hoàn toàn                  D. Không xuất hiện đồng thời',
              'Câu 6. Một vật rơi tự do từ độ cao h (g = 10 m/s²). Sau 2 giây, tốc độ của vật là:',
              '   A. 20 m/s     B. 10 m/s     C. 40 m/s     D. 5 m/s',
              'Câu 7. Đơn vị nào sau đây là đơn vị của công suất?',
              '   A. Jun (J)     B. Niutơn (N)     C. Oát (W)     D. Kg·m/s',
              'Câu 8. Động năng của một vật khối lượng m chuyển động với tốc độ v được tính bằng công thức:',
              '   A. W_đ = m·v     B. W_đ = m·v²     C. W_đ = 2·m·v²     D. W_đ = (1/2)·m·v²',
              'Câu 9. Khi kéo đều một vật trên mặt phẳng nằm ngang lực F = 50 N đi quãng đường 4 m theo hướng lực kéo, công của lực F là:',
              '   A. 200 J     B. 12,5 J     C. 54 J     D. 100 J',
              'Câu 10. Động lượng của một vật có khối lượng 3 kg đang chuyển động với tốc độ 4 m/s có độ lớn bằng:',
              '   A. 7 kg·m/s     B. 24 kg·m/s     C. 12 kg·m/s     D. 0,75 kg·m/s',
            ],
          },
          { kind: 'pageBreak' },
          { kind: 'heading', text: 'II. ĐÁP ÁN & GIẢI THÍCH NGẮN (VẬT LÍ 10)' },
          {
            kind: 'table',
            headers: ['Câu', 'Đáp án', 'Công thức / Giải thích'],
            colWeights: [1, 1.2, 5.8],
            rows: [
              ['1', 'B', 'Độ dịch chuyển là đại lượng vectơ nối vị trí đầu tới vị trí cuối.'],
              ['2', 'C', 'Gia tốc a = Δv / Δt có đơn vị SI là m/s².'],
              ['3', 'A', 'vec(a) = vec(F)/m nên vec(a) cùng hướng hợp lực vec(F).'],
              ['4', 'D', 'a = F / m = 6 / 2 = 3 m/s².'],
              ['5', 'B', 'Lực và phản lực đặt lên hai vật khác nhau, cùng phương, ngược chiều, cùng độ lớn.'],
              ['6', 'A', 'v = g·t = 10 · 2 = 20 m/s.'],
              ['7', 'C', 'Công suất P = A / t có đơn vị là W (1 W = 1 J/s).'],
              ['8', 'D', 'W_đ = (1/2)mv².'],
              ['9', 'A', 'A = F·s·cos(0°) = 50 · 4 = 200 J.'],
              ['10', 'C', 'p = m·v = 3 · 4 = 12 kg·m/s.'],
            ],
          },
        ],
      },
      () => [],
      grading
    );
  }

  if (sampleId === 'sample-phys-04-tf4') {
    const grading = buildMcqSession('Phiếu Đúng/Sai 4 ý Vật lí 12', 'Vật lí', '12A1', [
      { number: 1, kind: 'tf4', answerKey: 'Đ-Đ-S-Đ', maxScore: 1 },
      { number: 2, kind: 'tf4', answerKey: 'Đ-S-Đ-Đ', maxScore: 1 },
    ]);
    return buildStructuredPayload(
      {
        subjectLabel: 'Vật lí',
        gradeLabel: 'Lớp 12',
        docTypeLabel: 'Phiếu bài tập · Đúng/Sai 4 ý',
        title: 'BÀI TẬP ĐÚNG / SAI 4 Ý VẬT LÍ 12: NHIỆT HỌC & KHÍ LÍ TƯỞNG',
        subtitle: 'Định dạng THPT 2025  |  Nguyên lí I nhiệt động lực học, nhiệt lượng và phương trình trạng thái khí lí tưởng.',
        blocks: [
          { kind: 'heading', text: 'Câu 1. Đun nóng 2 kg nước từ 20°C lên 100°C bằng ấm điện (nhiệt dung riêng c = 4200 J/(kg·K), bỏ qua hao phí).' },
          {
            kind: 'lines',
            lines: [
              '   a) Độ tăng nhiệt độ của nước là ΔT = 80 K.                                        [ Đ / S ]',
              '   b) Nhiệt lượng nước thu vào để đạt 100°C là 672 kJ.                                [ Đ / S ]',
              '   c) Khi nước đang sôi ở 100°C dưới áp suất chuẩn, nhiệt độ nước tiếp tục tăng.     [ Đ / S ]',
              '   d) Nội năng của nước tăng lên nhờ quá trình truyền nhiệt.                         [ Đ / S ]',
            ],
          },
          { kind: 'heading', text: 'Câu 2. Một lượng khí lí tưởng trong xi-lanh ở trạng thái (1): p₁ = 2 atm, V₁ = 6 lít, T₁ = 300 K được nén đẳng nhiệt sang trạng thái (2) có V₂ = 3 lít.' },
          {
            kind: 'lines',
            lines: [
              '   a) Trong quá trình đẳng nhiệt, tích p·V của lượng khí không đổi (Định luật Boyle). [ Đ / S ]',
              '   b) Áp suất của khí ở trạng thái (2) là p₂ = 1 atm.                                 [ Đ / S ]',
              '   c) Mật độ phân tử khí ở trạng thái (2) tăng gấp đôi so với trạng thái (1).         [ Đ / S ]',
              '   d) Nếu tiếp tục đun nóng đẳng tích từ T₂ = 300 K lên T₃ = 450 K thì p₃ = 6 atm.    [ Đ / S ]',
            ],
          },
          { kind: 'pageBreak' },
          { kind: 'heading', text: 'ĐÁP ÁN & GIẢI THÍCH (VẬT LÍ 12)' },
          {
            kind: 'table',
            headers: ['Câu', 'Đáp án', 'Kiểm chứng chi tiết'],
            colWeights: [1, 1.7, 5.3],
            rows: [
              [
                'Câu 1',
                'Đ – Đ – S – Đ',
                'a) Đúng: Δt = 100 - 20 = 80°C = 80 K. b) Đúng: Q = m·c·ΔT = 2·4200·80 = 672.000 J = 672 kJ. c) Sai: Trong suốt quá trình sôi ở áp suất không đổi, nhiệt độ nước giữ nguyên 100°C. d) Đúng.',
              ],
              [
                'Câu 2',
                'Đ – S – Đ – Đ',
                'a) Đúng. b) Sai: p₁V₁ = p₂V₂ ⇒ p₂ = 2·6/3 = 4 atm. c) Đúng: Thể tích giảm một nửa nên mật độ tăng gấp đôi. d) Đúng: Đẳng tích p₃/T₃ = p₂/T₂ ⇒ p₃ = 4·(450/300) = 6 atm.',
              ],
            ],
          },
        ],
      },
      () => [],
      grading
    );
  }

  if (sampleId === 'sample-phys-05-short') {
    const grading = buildMcqSession('Phiếu Trả lời ngắn Vật lí 12', 'Vật lí', '12A2', [
      { number: 1, kind: 'short', answerKey: '0.4', maxScore: 2 },
      { number: 2, kind: 'short', answerKey: '0.2', maxScore: 2 },
      { number: 3, kind: 'short', answerKey: '50', maxScore: 2 },
      { number: 4, kind: 'short', answerKey: '12', maxScore: 2 },
      { number: 5, kind: 'short', answerKey: '25', maxScore: 2 },
    ]);
    return buildStructuredPayload(
      {
        subjectLabel: 'Vật lí',
        gradeLabel: 'Lớp 12',
        docTypeLabel: 'Phiếu bài tập · Trả lời ngắn',
        title: 'PHIẾU BÀI TẬP TRẢ LỜI NGẮN VẬT LÍ 12: TỪ TRƯỜNG & HẠT NHÂN',
        subtitle: '5 câu trả lời ngắn (ghi rõ giá trị số và đơn vị SI)  |  Thang điểm: 10',
        blocks: [
          { kind: 'heading', text: 'I. CÂU HỎI TRẢ LỜI NGẮN (5 câu × 2,0 điểm)' },
          {
            kind: 'lines',
            lines: [
              'Câu 1. Một đoạn dây dẫn dài l = 0,5 m mang dòng điện I = 4 A đặt vuông góc với cảm ứng từ đều B = 0,2 T. Tính độ lớn lực từ tác dụng lên đoạn dây (N).',
              '   Đáp số: ....................... (N)',
              '',
              'Câu 2. Từ thông qua một khung dây kín giảm đều từ 0,5 Wb xuống 0,1 Wb trong thời gian 2 s. Tính độ lớn suất điện động cảm ứng xuất hiện trong khung (V).',
              '   Đáp số: ....................... (V)',
              '',
              'Câu 3. Mạng điện xoay chiều dân dụng tại Việt Nam có tần số f = 50 Hz. Tính chu kì T (ms) hay số lần dòng điện đổi chiều trong 0,5 giây (ghi số chu kì trong 1 giây: Hz).',
              '   Đáp số: ....................... (Hz)',
              '',
              'Câu 4. Hạt nhân Carbon-12 (¹²₆C) có số nucleon (số khối A) bằng bao nhiêu?',
              '   Đáp số: .......................',
              '',
              'Câu 5. Một chất phóng xạ có chu kì bán rã T = 10 ngày. Sau 20 ngày, phần trăm số hạt nhân ban đầu còn lại là bao nhiêu %?',
              '   Đáp số: ....................... (%)',
            ],
          },
          { kind: 'pageBreak' },
          { kind: 'heading', text: 'II. ĐÁP ÁN CHI TIẾT' },
          {
            kind: 'table',
            headers: ['Câu', 'Đáp số', 'Công thức & Phép tính'],
            colWeights: [1, 1.6, 5.4],
            rows: [
              ['1', '0,4 N', 'F = B·I·l·sin(90°) = 0,2 · 4 · 0,5 = 0,4 N.'],
              ['2', '0,2 V', '|e_c| = |ΔΦ / Δt| = |0,1 - 0,5| / 2 = 0,2 V.'],
              ['3', '50 Hz', 'Tần số lưới điện dân dụng chuẩn ở Việt Nam là 50 Hz (T = 0,02 s = 20 ms).'],
              ['4', '12', 'Kí hiệu ¹²₆C gồm 6 proton và 6 neutron ⇒ tổng số nucleon A = 12.'],
              ['5', '25 %', 'Sau t = 20 ngày = 2T ⇒ N/N₀ = (1/2)² = 1/4 = 25%.'],
            ],
          },
        ],
      },
      () => [],
      grading
    );
  }

  if (sampleId === 'sample-phys-06-quant-essay') {
    const grading = buildRubricSession('Tự luận định lượng Vật lí 11', 'Vật lí', '11A1', [
      { id: 'pq1', label: 'Bài 1 (Dao động & Năng lượng)', maxScore: 5 },
      { id: 'pq2', label: 'Bài 2 (Truyền sóng cơ)', maxScore: 5 },
    ]);
    return buildStructuredPayload(
      {
        subjectLabel: 'Vật lí',
        gradeLabel: 'Lớp 11',
        docTypeLabel: 'Đề kiểm tra · Tự luận định lượng',
        title: 'ĐỀ TỰ LUẬN ĐỊNH LƯỢNG VẬT LÍ 11: DAO ĐỘNG & SÓNG',
        subtitle: 'Thời gian: 45 phút  |  Yêu cầu tóm tắt, viết công thức, thay số và ghi đủ đơn vị.',
        blocks: [
          { kind: 'heading', text: 'Bài 1 (5,0 điểm). Năng lượng con lắc lò xo dao động điều hòa' },
          {
            kind: 'lines',
            lines: [
              'Một con lắc lò xo gồm vật nhỏ khối lượng m = 200 g gắn vào lò xo có độ cứng k = 50 N/m dao động điều hòa trên phương ngang với biên độ A = 4 cm (bỏ qua ma sát).',
              'a) Tính tần số góc ω và chu kì dao động T của con lắc (lấy π ≈ 3,14).',
              'b) Tính cơ năng toàn phần W của con lắc và tốc độ cực đại v_max của vật.',
              'c) Tại li độ x = 2 cm, tính thế năng đàn hồi W_t và động năng W_đ của vật.',
            ],
          },
          { kind: 'heading', text: 'Bài 2 (5,0 điểm). Sóng cơ truyền trên mặt nước' },
          {
            kind: 'lines',
            lines: [
              'Một nguồn sóng dao động với tần số f = 20 Hz tạo ra sóng trên mặt nước có tốc độ truyền sóng v = 1,2 m/s.',
              'a) Tính bước sóng λ của sóng trên mặt nước (đơn vị: cm).',
              'b) Xác định khoảng cách ngắn nhất giữa hai điểm trên cùng phương truyền sóng dao động cùng pha và ngược pha.',
            ],
          },
          { kind: 'writingLines', title: 'Phần trình bày lời giải:', count: 7 },
          { kind: 'pageBreak' },
          { kind: 'heading', text: 'HƯỚNG DẪN CHẤM TỰ LUẬN ĐỊNH LƯỢNG' },
          {
            kind: 'lines',
            lines: [
              'Bài 1 (m = 0,2 kg; k = 50 N/m; A = 0,04 m):',
              '  a) ω = √(k/m) = √(50/0,2) = √250 ≈ 15,81 rad/s (hoặc 5√10 rad/s); T = 2π/ω ≈ 0,40 s. (1,5đ)',
              '  b) W = (1/2)kA² = 0,5 · 50 · (0,04)² = 0,04 J;  v_max = ωA ≈ 0,632 m/s = 63,2 cm/s. (2,0đ)',
              '  c) Tại x = 0,02 m: W_t = (1/2)kx² = 0,5·50·(0,02)² = 0,01 J; W_đ = W - W_t = 0,03 J. (1,5đ)',
              '',
              'Bài 2 (f = 20 Hz; v = 1,2 m/s):',
              '  a) λ = v / f = 1,2 / 20 = 0,06 m = 6 cm. (2,5đ)',
              '  b) Hai điểm gần nhất cùng pha cách nhau d₁ = λ = 6 cm; ngược pha cách nhau d₂ = λ/2 = 3 cm. (2,5đ)',
            ],
          },
        ],
      },
      () => [],
      grading
    );
  }

  if (sampleId === 'sample-phys-07-graph') {
    return buildStructuredPayload(
      {
        subjectLabel: 'Vật lí',
        gradeLabel: 'Lớp 10',
        docTypeLabel: 'Phiếu bài tập · Đồ thị Vật lí',
        title: 'PHIẾU BÀI TẬP ĐỌC VÀ PHÂN TÍCH ĐỒ THỊ VẬN TỐC – THỜI GIAN (v–t)',
        subtitle: 'Lớp 10  |  Tính gia tốc từ hệ số góc và tính độ dịch chuyển từ diện tích hình phẳng dưới đồ thị v–t.',
        blocks: [
          { kind: 'heading', text: 'Quan sát đồ thị v(t) của một ô tô chuyển động trên đường thẳng bên dưới:' },
          { kind: 'spacer', height: 215 },
          { kind: 'heading', text: 'Câu hỏi thực hành:' },
          {
            kind: 'lines',
            lines: [
              '1) Mô tả tính chất chuyển động của ô tô trên từng giai đoạn: OA (0–10 s), AB (10–25 s) và BC (25–30 s).',
              '2) Tính gia tốc của ô tô trên mỗi giai đoạn OA, AB và BC (ghi rõ dấu và đơn vị m/s²).',
              '3) Tính tổng độ dịch chuyển (quãng đường) ô tô đi được trong suốt 30 giây bằng diện tích hình thang OABC.',
              '4) Tính tốc độ trung bình của ô tô trên cả hành trình 30 giây.',
            ],
          },
          { kind: 'writingLines', count: 5 },
          { kind: 'pageBreak' },
          { kind: 'heading', text: 'ĐÁP ÁN PHÂN TÍCH ĐỒ THỊ v–t' },
          {
            kind: 'lines',
            lines: [
              '1) OA (0–10 s): Chuyển động thẳng nhanh dần đều từ 0 lên 20 m/s.',
              '   AB (10–25 s): Chuyển động thẳng đều với vận tốc không đổi 20 m/s.',
              '   BC (25–30 s): Chuyển động thẳng chậm dần đều từ 20 m/s về dừng hẳn (0 m/s).',
              '2) Gia tốc từng giai đoạn:',
              '   - a_OA = (20 - 0) / (10 - 0) = +2,0 m/s².',
              '   - a_AB = (20 - 20) / (25 - 10) = 0 m/s².',
              '   - a_BC = (0 - 20) / (30 - 25) = -4,0 m/s².',
              '3) Độ dịch chuyển d = diện tích hình thang OABC = (đáy nhỏ AB + đáy lớn OC) × chiều cao / 2 = (15 + 30) × 20 / 2 = 450 m.',
              '4) Tốc độ trung bình v_tb = 450 / 30 = 15 m/s.',
            ],
          },
        ],
      },
      (pageId) =>
        makeDiagramObj('p7-vt', 'phys-vt-graph', 'physics', pageId, 82, 160, 430, 210, 2)
    );
  }

  if (sampleId === 'sample-phys-08-kinematics') {
    return buildStructuredPayload(
      {
        subjectLabel: 'Vật lí',
        gradeLabel: 'Lớp 10',
        docTypeLabel: 'Phiếu bài tập · Chuyển động',
        title: 'PHIẾU BÀI TẬP CHUYỂN ĐỘNG BIẾN ĐỔI ĐỀU & CHUYỂN ĐỘNG NÉM NGANG',
        subtitle: 'Lớp 10  |  Áp dụng hệ phương trình động học và phân tích chuyển động hai chiều.',
        blocks: [
          { kind: 'heading', text: 'Công thức động học chuẩn (có thể nhấp đúp sửa bằng MathLive):' },
          { kind: 'spacer', height: 48 },
          { kind: 'heading', text: 'Bài 1 (5,0 điểm). Chuyển động thẳng biến đổi đều' },
          {
            kind: 'lines',
            lines: [
              'Một tàu hỏa đang chạy với tốc độ 72 km/h thì hãm phanh chuyển động thẳng chậm dần đều với gia tốc có độ lớn a = 0,5 m/s² cho đến khi dừng hẳn.',
              'a) Đổi vận tốc ban đầu sang đơn vị m/s và tính thời gian từ lúc hãm phanh đến khi tàu dừng hẳn.',
              'b) Tính quãng đường tàu đi được trong thời gian hãm phanh đó.',
            ],
          },
          { kind: 'heading', text: 'Bài 2 (5,0 điểm). Chuyển động ném ngang' },
          {
            kind: 'lines',
            lines: [
              'Từ độ cao h = 20 m so với mặt đất, một viên bi được ném theo phương ngang với vận tốc ban đầu v₀ = 15 m/s (lấy g = 10 m/s², bỏ qua sức cản không khí).',
              'a) Tính thời gian bay của viên bi từ lúc ném đến khi chạm đất.',
              'b) Tính tầm ném xa L của viên bi theo phương ngang và tốc độ của viên bi ngay trước khi chạm đất.',
            ],
          },
          { kind: 'writingLines', count: 5 },
          { kind: 'pageBreak' },
          { kind: 'heading', text: 'ĐÁP ÁN CHUYỂN ĐỘNG LỚP 10' },
          {
            kind: 'lines',
            lines: [
              'Bài 1: v₀ = 72 km/h = 20 m/s; a = -0,5 m/s²; v = 0.',
              '  a) t = (v - v₀)/a = (0 - 20)/(-0,5) = 40 s.',
              '  b) s = v₀t + (1/2)at² = 20·40 - 0,25·1600 = 400 m (hoặc v² - v₀² = 2as ⇒ s = 400 m).',
              'Bài 2: h = 20 m; v₀ = 15 m/s; g = 10 m/s².',
              '  a) t = √(2h/g) = √(40/10) = 2 s.',
              '  b) Tầm xa L = v₀·t = 15 · 2 = 30 m. Khi chạm đất: v_y = g·t = 20 m/s ⇒ v = √(v₀² + v_y²) = √(15² + 20²) = 25 m/s.',
            ],
          },
        ],
      },
      (pageId) => [
        makeFormulaObj('p8-f1', 'd = v_0 t + \\frac{1}{2}at^2,\\quad v^2 - v_0^2 = 2ad,\\quad L = v_0\\sqrt{\\frac{2h}{g}}', pageId, 58, 166, '#164E63', 15),
      ]
    );
  }

  if (sampleId === 'sample-phys-09-forces') {
    return buildStructuredPayload(
      {
        subjectLabel: 'Vật lí',
        gradeLabel: 'Lớp 10',
        docTypeLabel: 'Phiếu bài tập · Lực & Newton',
        title: 'PHIẾU BÀI TẬP LỰC, MA SÁT VÀ BA ĐỊNH LUẬT NEWTON',
        subtitle: 'Lớp 10  |  Phân tích vectơ lực, lực ma sát trượt và phương trình động lực học.',
        blocks: [
          { kind: 'heading', text: 'Bài 1 (5,0 điểm). Vật chuyển động có ma sát trên mặt phẳng ngang' },
          {
            kind: 'lines',
            lines: [
              'Một thùng gỗ khối lượng m = 5 kg đặt trên sàn ngang có hệ số ma sát trượt μ = 0,2. Tác dụng lực kéo nằm ngang F = 20 N vào thùng gỗ (lấy g = 10 m/s²).',
              'a) Tính độ lớn áp lực N và lực ma sát trượt F_ms tác dụng lên thùng gỗ.',
              'b) Tính gia tốc a của thùng gỗ và vận tốc của thùng sau 4 giây kể từ lúc đứng yên.',
            ],
          },
          { kind: 'heading', text: 'Bài 2 (5,0 điểm). Cân bằng vật rắn & Momen lực' },
          {
            kind: 'lines',
            lines: [
              'Một thanh cứng nhẹ dài 1,2 m có trục quay cố định tại O cách đầu A một đoạn OA = 0,4 m. Treo vật nặng P₁ = 30 N vào đầu A. Hỏi phải treo vật nặng P₂ bằng bao nhiêu N vào đầu B (OB = 0,8 m) để thanh nằm cân bằng ngang?',
            ],
          },
          { kind: 'spacer', height: 170 },
          { kind: 'pageBreak' },
          { kind: 'heading', text: 'ĐÁP ÁN LỰC & ĐỊNH LUẬT NEWTON' },
          {
            kind: 'lines',
            lines: [
              'Bài 1:',
              '  a) Trên mặt ngang: N = P = m·g = 5 · 10 = 50 N. Lực ma sát trượt F_ms = μ·N = 0,2 · 50 = 10 N.',
              '  b) Theo định luật II Newton: a = (F - F_ms) / m = (20 - 10) / 5 = 2 m/s². Sau 4 s: v = a·t = 8 m/s.',
              'Bài 2 (Quy tắc momen lực):',
              '  M₁ = M₂ ⇔ P₁ · OA = P₂ · OB ⇔ 30 · 0,4 = P₂ · 0,8 ⇒ P₂ = 12 / 0,8 = 15 N.',
            ],
          },
        ],
      },
      (pageId) =>
        makeDiagramObj('p9-inc', 'phys-inclined-plane', 'physics', pageId, 182, 412, 230, 162, 2)
    );
  }

  if (sampleId === 'sample-phys-10-energy') {
    return buildStructuredPayload({
      subjectLabel: 'Vật lí',
      gradeLabel: 'Lớp 10',
      docTypeLabel: 'Phiếu bài tập · Năng lượng',
      title: 'PHIẾU BÀI TẬP CÔNG, CÔNG SUẤT & BẢO TOÀN CƠ NĂNG',
      subtitle: 'Lớp 10  |  Tính công cơ học, động năng, thế năng trọng trường và định luật bảo toàn cơ năng.',
      blocks: [
        { kind: 'heading', text: 'Bài 1 (4,0 điểm). Công và công suất của cần trục' },
        {
          kind: 'lines',
          lines: [
            'Một cần trục nâng đều một khối bê tông có khối lượng m = 500 kg lên độ cao h = 12 m trong thời gian 20 giây (lấy g = 10 m/s²).',
            'a) Tính công tối thiểu mà cần trục đã thực hiện.',
            'b) Tính công suất có ích của cần trục (đơn vị: W và kW) và hiệu suất biết công suất tiêu thụ của động cơ là 4 kW.',
          ],
        },
        { kind: 'heading', text: 'Bài 2 (6,0 điểm). Định luật bảo toàn cơ năng' },
        {
          kind: 'lines',
          lines: [
            'Một vật khối lượng m = 0,5 kg được thả rơi tự do không vận tốc đầu từ độ cao h = 20 m so với mặt đất (chọn mốc thế năng tại mặt đất, g = 10 m/s², bỏ qua sức cản không khí).',
            'a) Tính cơ năng ban đầu của vật.',
            'b) Tính tốc độ của vật khi chạm đất.',
            'c) Ở độ cao nào thì động năng của vật bằng 3 lần thế năng?',
          ],
        },
        { kind: 'writingLines', title: 'Trình bày bài làm:', count: 7 },
        { kind: 'pageBreak' },
        { kind: 'heading', text: 'ĐÁP ÁN CÔNG & BẢO TOÀN CƠ NĂNG' },
        {
          kind: 'lines',
          lines: [
            'Bài 1:',
            '  a) A = P·h = m·g·h = 500 · 10 · 12 = 60.000 J = 60 kJ.',
            '  b) P_ích = A / t = 60.000 / 20 = 3.000 W = 3 kW. Hiệu suất H = (3 / 4) × 100% = 75%.',
            'Bài 2:',
            '  a) W = W_t0 = m·g·h = 0,5 · 10 · 20 = 100 J.',
            '  b) Chạm đất W_đ = W = 100 J ⇒ (1/2)mv² = 100 ⇒ v = √(2·100/0,5) = 20 m/s.',
            '  c) W = W_đ + W_t = 3W_t + W_t = 4W_t ⇒ W_t = W/4 = 25 J ⇒ z = 25 / (0,5·10) = 5 m.',
          ],
        },
      ],
    });
  }

  if (sampleId === 'sample-phys-11-waves') {
    return buildStructuredPayload(
      {
        subjectLabel: 'Vật lí',
        gradeLabel: 'Lớp 11',
        docTypeLabel: 'Phiếu bài tập · Sóng',
        title: 'PHIẾU BÀI TẬP SÓNG CƠ, GIAO THOA SÓNG & SÓNG DỪNG',
        subtitle: 'Lớp 11  |  Sóng dọc, sóng ngang, điều kiện giao thoa cực đại/cực tiểu và sóng dừng hai đầu cố định.',
        blocks: [
          { kind: 'heading', text: 'Bài 1 (5,0 điểm). Giao thoa hai nguồn sóng kết hợp cùng pha' },
          {
            kind: 'lines',
            lines: [
              'Trên mặt nước có hai nguồn sóng kết hợp S₁, S₂ dao động cùng pha với tần số f = 25 Hz. Tốc độ truyền sóng trên mặt nước là v = 50 cm/s.',
              'a) Tính bước sóng λ.',
              'b) Xét điểm M cách S₁ một đoạn d₁ = 12 cm và cách S₂ một đoạn d₂ = 16 cm. Điểm M dao động với biên độ cực đại hay cực tiểu? Thuộc bậc mấy?',
            ],
          },
          { kind: 'heading', text: 'Bài 2 (5,0 điểm). Sóng dừng trên dây đàn hồi hai đầu cố định' },
          {
            kind: 'lines',
            lines: [
              'Một sợi dây đàn hồi dài l = 90 cm hai đầu cố định. Khi rung với tần số f = 50 Hz, trên dây xuất hiện sóng dừng với 3 bó sóng (3 bụng sóng).',
              'a) Tính bước sóng λ và tốc độ truyền sóng v trên dây.',
              'b) Để trên dây có 5 bụng sóng (v giữ không đổi), cần điều chỉnh tần số rung tới giá trị nào?',
            ],
          },
          { kind: 'spacer', height: 48 },
          { kind: 'writingLines', count: 5 },
          { kind: 'pageBreak' },
          { kind: 'heading', text: 'ĐÁP ÁN SÓNG CƠ & SÓNG DỪNG 11' },
          {
            kind: 'lines',
            lines: [
              'Bài 1:',
              '  a) λ = v / f = 50 / 25 = 2 cm.',
              '  b) Hiệu đường đi Δd = d₂ - d₁ = 16 - 12 = 4 cm = 2λ (k = 2 nguyên) ⇒ M là điểm cực đại giao thoa bậc 2.',
              'Bài 2 (Điều kiện sóng dừng 2 đầu cố định: l = k·λ/2):',
              '  a) Với k = 3: 90 = 3·λ/2 ⇒ λ = 60 cm = 0,6 m. Tốc độ v = λ·f = 0,6 · 50 = 30 m/s.',
              '  b) Với k\' = 5: λ\' = 2l / 5 = 36 cm = 0,36 m ⇒ f\' = v / λ\' = 30 / 0,36 = 83,33 Hz (hay f\' = (5/3)·50 ≈ 83,3 Hz).',
            ],
          },
        ],
      },
      (pageId) => [
        makeFormulaObj('p11-f1', '\\lambda = \\frac{v}{f},\\quad d_2 - d_1 = k\\lambda,\\quad l = k\\frac{\\lambda}{2}', pageId, 64, 412, '#087F70', 16),
      ]
    );
  }

  if (sampleId === 'sample-phys-12-electrostatics') {
    return buildStructuredPayload({
      subjectLabel: 'Vật lí',
      gradeLabel: 'Lớp 11',
      docTypeLabel: 'Phiếu bài tập · Điện học',
      title: 'PHIẾU BÀI TẬP ĐIỆN HỌC: LỰC COULOMB, ĐIỆN TRƯỜNG & TỤ ĐIỆN',
      subtitle: 'Lớp 11  |  Hằng số điện k = 9·10⁹ N·m²/C²; bài tập điện tích điểm và năng lượng tụ điện.',
      blocks: [
        { kind: 'heading', text: 'Bài 1 (3,5 điểm). Định luật Coulomb' },
        {
          kind: 'lines',
          lines: [
            'Hai điện tích điểm q₁ = 4·10⁻⁶ C và q₂ = -2·10⁻⁶ C đặt cách nhau r = 0,3 m trong chân không (ε = 1).',
            'a) Hai điện tích hút nhau hay đẩy nhau? Tính độ lớn lực tương tác tĩnh điện giữa chúng.',
            'b) Nếu đặt hai điện tích đó vào trong dầu có hằng số điện môi ε = 2 (giữ nguyên khoảng cách r), lực tương tác thay đổi thế nào?',
          ],
        },
        { kind: 'heading', text: 'Bài 2 (3,5 điểm). Điện trường đều & Công lực điện' },
        {
          kind: 'lines',
          lines: [
            'Giữa hai bản kim loại phẳng song song cách nhau d = 2 cm có hiệu điện thế U = 100 V.',
            'a) Tính cường độ điện trường đều E giữa hai bản.',
            'b) Tính công lực điện khi dịch chuyển điện tích q = 2·10⁻⁶ C từ bản dương sang bản âm.',
          ],
        },
        { kind: 'heading', text: 'Bài 3 (3,0 điểm). Điện dung và năng lượng tụ điện' },
        {
          kind: 'lines',
          lines: [
            'Một tụ điện có điện dung C = 20 μF được tích điện dưới hiệu điện thế U = 50 V. Tính điện tích Q (mC) và năng lượng điện trường W (mJ) tích trữ trong tụ.',
          ],
        },
        { kind: 'writingLines', count: 4 },
        { kind: 'pageBreak' },
        { kind: 'heading', text: 'ĐÁP ÁN ĐIỆN HỌC LỚP 11' },
        {
          kind: 'lines',
          lines: [
            'Bài 1:',
            '  a) Trái dấu nên hút nhau. F = k|q₁q₂|/r² = 9·10⁹ · (4·10⁻⁶ · 2·10⁻⁶) / (0,3)² = 0,072 / 0,09 = 0,8 N.',
            '  b) Trong môi trường ε = 2, lực giảm 2 lần: F\' = 0,8 / 2 = 0,4 N.',
            'Bài 2:',
            '  a) E = U / d = 100 / 0,02 = 5.000 V/m.',
            '  b) A = q·U = 2·10⁻⁶ · 100 = 2·10⁻⁴ J = 0,2 mJ.',
            'Bài 3:',
            '  Q = C·U = 20·10⁻⁶ · 50 = 10⁻³ C = 1 mC. W = (1/2)CU² = 0,5 · 20·10⁻⁶ · 2500 = 0,025 J = 25 mJ.',
          ],
        },
      ],
    });
  }

  if (sampleId === 'sample-phys-13-thermal') {
    return buildStructuredPayload({
      subjectLabel: 'Vật lí',
      gradeLabel: 'Lớp 12',
      docTypeLabel: 'Phiếu học tập · Nhiệt học',
      title: 'PHIẾU HỌC TẬP NHIỆT HỌC: NỘI NĂNG, CHUYỂN THỂ & KHÍ LÍ TƯỞNG',
      subtitle: 'Lớp 12  |  Nguyên lí I nhiệt động lực học (ΔU = A + Q), nhiệt nóng chảy riêng và phương trình Clapeyron.',
      blocks: [
        { kind: 'heading', text: 'Bài 1 (3,0 điểm). Nguyên lí I Nhiệt động lực học' },
        {
          kind: 'lines',
          lines: [
            'Người ta thực hiện công A = 120 J để nén khí trong một xi-lanh. Trong quá trình đó, khí truyền ra môi trường xung quanh một nhiệt lượng 40 J. Tính độ biến thiên nội năng ΔU của khối khí và cho biết nội năng tăng hay giảm.',
          ],
        },
        { kind: 'heading', text: 'Bài 2 (3,5 điểm). Nhiệt lượng làm nóng chảy hoàn toàn nước đá' },
        {
          kind: 'lines',
          lines: [
            'Tính nhiệt lượng cần cung cấp để làm nóng chảy hoàn toàn 0,5 kg nước đá ở 0°C và đun nóng lượng nước thu được lên đến 20°C. Biết nhiệt nóng chảy riêng của nước đá λ = 3,34·10⁵ J/kg và nhiệt dung riêng của nước c = 4.200 J/(kg·K).',
          ],
        },
        { kind: 'heading', text: 'Bài 3 (3,5 điểm). Phương trình trạng thái khí lí tưởng (Clapeyron)' },
        {
          kind: 'lines',
          lines: [
            'Một bình kín thể tích V = 8,31 lít chứa n = 2 mol khí lí tưởng ở nhiệt độ 27°C (T = 300 K). Tính áp suất của khối khí trong bình (biết R = 8,31 J/(mol·K), 1 lít = 10⁻³ m³).',
          ],
        },
        { kind: 'writingLines', count: 5 },
        { kind: 'pageBreak' },
        { kind: 'heading', text: 'ĐÁP ÁN NHIỆT HỌC LỚP 12' },
        {
          kind: 'lines',
          lines: [
            'Bài 1: Khí nhận công ⇒ A = +120 J; khí tỏa nhiệt ⇒ Q = -40 J. ΔU = A + Q = 120 - 40 = +80 J (nội năng tăng thêm 80 J).',
            'Bài 2:',
            '  - Nhiệt nóng chảy ở 0°C: Q₁ = m·λ = 0,5 · 3,34·10⁵ = 167.000 J.',
            '  - Nhiệt đun nước từ 0°C lên 20°C: Q₂ = m·c·ΔT = 0,5 · 4200 · 20 = 42.000 J.',
            '  - Tổng nhiệt lượng Q = Q₁ + Q₂ = 209.000 J = 209 kJ.',
            'Bài 3: V = 8,31·10⁻³ m³. p = nRT / V = (2 · 8,31 · 300) / (8,31·10⁻³) = 6·10⁵ Pa (≈ 5,92 atm).',
          ],
        },
      ],
    });
  }

  if (sampleId === 'sample-phys-14-lab-data') {
    return buildStructuredPayload({
      subjectLabel: 'Vật lí',
      gradeLabel: 'Lớp 10',
      docTypeLabel: 'Phiếu thực hành · Thí nghiệm & Xử lí số liệu',
      title: 'PHIẾU THÍ NGHIỆM & XỬ LÍ SỐ LIỆU: ĐO GIA TỐC RƠI TỰ DO g',
      subtitle: 'Lớp 10  |  Tính giá trị trung bình, sai số tuyệt đối, sai số tỉ đối và viết kết quả phép đo.',
      blocks: [
        {
          kind: 'callout',
          title: 'Ghi chú số liệu thực hành',
          text: 'Bảng thời gian rơi của viên bi thép từ độ cao s = 0,800 ± 0,002 m (dụng cụ cổng quang điện) dưới đây là SỐ LIỆU THỰC HÀNH GIẢ ĐỊNH để rèn kỹ năng xử lí sai số.',
          tone: 'amber',
        },
        { kind: 'heading', text: 'Bảng 1. Kết quả đo thời gian rơi t (s) qua 5 lần đo (s = 0,800 m, sai số dụng cụ đồng hồ Δt_dc = 0,001 s):' },
        {
          kind: 'table',
          headers: ['Lần đo', '1', '2', '3', '4', '5'],
          colWeights: [1.8, 1.2, 1.2, 1.2, 1.2, 1.2],
          rows: [
            ['Thời gian t (s)', '0,402', '0,406', '0,404', '0,408', '0,400'],
            ['|t_i - t̄| (s)', '...', '...', '...', '...', '...'],
          ],
        },
        { kind: 'heading', text: 'Nhiệm vụ xử lí số liệu:' },
        {
          kind: 'lines',
          lines: [
            '1) Tính thời gian rơi trung bình t̄ và sai số ngẫu nhiên trung bình Δt̄.',
            '2) Tính sai số tuyệt đối Δt = Δt̄ + Δt_dc.',
            '3) Tính gia tốc rơi tự do trung bình ḡ = 2s / t̄² (m/s²).',
            '4) Tính sai số tỉ đối δg = Δs/s + 2·(Δt/t̄), suy ra Δg và viết kết quả cuối cùng g = ḡ ± Δg.',
          ],
        },
        { kind: 'writingLines', title: 'Phần tính toán & nhận xét thí nghiệm:', count: 6 },
        { kind: 'pageBreak' },
        { kind: 'heading', text: 'ĐÁP ÁN XỬ LÍ SỐ LIỆU THÍ NGHIỆM ĐO g' },
        {
          kind: 'lines',
          lines: [
            '1) t̄ = (0,402 + 0,406 + 0,404 + 0,408 + 0,400) / 5 = 2,020 / 5 = 0,404 s.',
            '   Các độ lệch |t_i - t̄|: 0,002; 0,002; 0,000; 0,004; 0,004 ⇒ Δt̄ = 0,012 / 5 = 0,0024 s.',
            '2) Sai số tuyệt đối thời gian: Δt = 0,0024 + 0,001 = 0,0034 s.',
            '3) Gia tốc trung bình: ḡ = (2 · 0,800) / (0,404)² = 1,600 / 0,163216 ≈ 9,80 m/s².',
            '4) Sai số tỉ đối: δg = 0,002/0,800 + 2·(0,0034/0,404) = 0,0025 + 0,0168 = 0,0193 (≈ 1,93%).',
            '   Sai số tuyệt đối: Δg = 0,0193 · 9,80 ≈ 0,19 m/s².',
            '   Kết quả phép đo: g = 9,80 ± 0,19 (m/s²).',
          ],
        },
      ],
    });
  }

  return null;
}
