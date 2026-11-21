import {
  buildMcqSession,
  buildRubricSession,
  buildStructuredPayload,
  makeDiagramObj,
  makeFormulaObj,
  type StructuredSamplePayload,
} from './sampleBuilderHelpers';

/**
 * 12 new THPT Chemistry sample PDFs (Grades 10, 11, 12) bringing Hóa học from 2 -> 14 samples.
 */
export async function generateChemistryExtraSample(
  sampleId: string
): Promise<StructuredSamplePayload | null> {
  if (sampleId === 'sample-chem-03-mcq') {
    const grading = buildMcqSession('Đề trắc nghiệm Hóa học 10', 'Hóa học', '10A1', [
      { number: 1, kind: 'abcd', answerKey: 'C', maxScore: 1 },
      { number: 2, kind: 'abcd', answerKey: 'A', maxScore: 1 },
      { number: 3, kind: 'abcd', answerKey: 'B', maxScore: 1 },
      { number: 4, kind: 'abcd', answerKey: 'D', maxScore: 1 },
      { number: 5, kind: 'abcd', answerKey: 'A', maxScore: 1 },
      { number: 6, kind: 'abcd', answerKey: 'C', maxScore: 1 },
      { number: 7, kind: 'abcd', answerKey: 'B', maxScore: 1 },
      { number: 8, kind: 'abcd', answerKey: 'D', maxScore: 1 },
      { number: 9, kind: 'abcd', answerKey: 'A', maxScore: 1 },
      { number: 10, kind: 'abcd', answerKey: 'B', maxScore: 1 },
    ]);
    return buildStructuredPayload(
      {
        subjectLabel: 'Hóa học',
        gradeLabel: 'Lớp 10',
        docTypeLabel: 'Đề kiểm tra · Trắc nghiệm',
        title: 'ĐỀ TRẮC NGHIỆM HÓA HỌC 10: NGUYÊN TỬ, BẢNG TUẦN HOÀN & LIÊN KẾT',
        subtitle: 'Thời gian: 25 phút  |  10 câu trắc nghiệm chuẩn kiến thức GDPT 2018 kèm đáp án.',
        blocks: [
          { kind: 'heading', text: 'I. CÂU HỎI TRẮC NGHIỆM (10 câu × 1,0 điểm)' },
          {
            kind: 'lines',
            lines: [
              'Câu 1. Hạt nhân nguyên tử được cấu tạo từ hai loại hạt cơ bản nào?',
              '   A. Proton và electron   B. Neutron và electron   C. Proton và neutron   D. Chỉ có proton',
              'Câu 2. Nguyên tử Sodium (Na, Z = 11) có cấu hình electron lớp ngoài cùng là:',
              '   A. 3s¹     B. 3s²     C. 2p⁶     D. 3s²3p¹',
              'Câu 3. Số thứ tự chu kì trong bảng tuần hoàn bằng số lượng nào sau đây của nguyên tử?',
              '   A. Electron hóa trị     B. Lớp electron     C. Số neutron     D. Số khối',
              'Câu 4. Trong một chu kì, theo chiều tăng điện tích hạt nhân (từ trái sang phải), tính kim loại của các nguyên tố biến đổi như thế nào?',
              '   A. Tăng dần     B. Không đổi     C. Tăng rồi giảm     D. Giảm dần',
              'Câu 5. Liên kết hóa học trong tinh thể NaCl thuộc loại liên kết nào?',
              '   A. Liên kết ion     B. Liên kết cộng hóa trị không cực     C. Liên kết hydrogen     D. Liên kết kim loại',
              'Câu 6. Số oxi hóa của lưu huỳnh (S) trong phân tử H₂SO₄ là:',
              '   A. +2     B. +4     C. +6     D. -2',
              'Câu 7. Phản ứng hóa học giải phóng nhiệt năng ra môi trường xung quanh có giá trị ΔrH°₂₉₈:',
              '   A. > 0 (thu nhiệt)     B. < 0 (tỏa nhiệt)     C. = 0     D. Không xác định',
              'Câu 8. Yếu tố nào KHÔNG làm thay đổi tốc độ phản ứng hóa học?',
              '   A. Nồng độ chất phản ứng   B. Nhiệt độ   C. Chất xúc tác   D. Màu sắc bình chứa',
              'Câu 9. Đơn chất halogen nào tồn tại ở thể lỏng ở điều kiện thường?',
              '   A. Br₂     B. F₂     C. Cl₂     D. I₂',
              'Câu 10. Nguyên tố Chlorine (Cl, Z = 17) thuộc nhóm nào trong bảng tuần hoàn?',
              '   A. Nhóm VIA     B. Nhóm VIIA     C. Nhóm IA     D. Nhóm VA',
            ],
          },
          { kind: 'pageBreak' },
          { kind: 'heading', text: 'II. ĐÁP ÁN HÓA HỌC 10' },
          {
            kind: 'table',
            headers: ['Câu', 'Đáp án', 'Giải thích ngắn'],
            colWeights: [1, 1.2, 5.8],
            rows: [
              ['1', 'C', 'Hạt nhân gồm proton (mang điện dương) và neutron (không mang điện).'],
              ['2', 'A', 'Na (Z=11): 1s²2s²2p⁶3s¹ ⇒ lớp ngoài cùng 3s¹.'],
              ['3', 'B', 'Số thứ tự chu kì = số lớp electron.'],
              ['4', 'D', 'Trong một chu kì, bán kính giảm dần ⇒ khả năng nhường e giảm ⇒ tính kim loại giảm.'],
              ['5', 'A', 'NaCl hình thành bởi lực hút tĩnh điện giữa Na⁺ và Cl⁻.'],
              ['6', 'C', '2(+1) + x + 4(-2) = 0 ⇒ x = +6.'],
              ['7', 'B', 'Phản ứng tỏa nhiệt có ΔrH° < 0.'],
              ['8', 'D', '5 yếu tố ảnh hưởng tốc độ: nồng độ, áp suất (khí), nhiệt độ, diện tích bề mặt, xúc tác.'],
              ['9', 'A', 'F₂, Cl₂ là khí; Br₂ là chất lỏng nâu đỏ; I₂ là chất rắn tím đen.'],
              ['10', 'B', 'Cl (Z=17): [Ne]3s²3p⁵ có 7 electron hóa trị ⇒ nhóm VIIA.'],
            ],
          },
        ],
      },
      () => [],
      grading
    );
  }

  if (sampleId === 'sample-chem-04-tf4') {
    const grading = buildMcqSession('Phiếu Đúng/Sai 4 ý Hóa học 12', 'Hóa học', '12A1', [
      { number: 1, kind: 'tf4', answerKey: 'Đ-Đ-S-Đ', maxScore: 1 },
      { number: 2, kind: 'tf4', answerKey: 'Đ-S-Đ-Đ', maxScore: 1 },
    ]);
    return buildStructuredPayload(
      {
        subjectLabel: 'Hóa học',
        gradeLabel: 'Lớp 12',
        docTypeLabel: 'Phiếu bài tập · Đúng/Sai 4 ý',
        title: 'BÀI TẬP ĐÚNG / SAI 4 Ý HÓA HỌC 12: ESTER, CARBOHYDRATE & PIN ĐIỆN',
        subtitle: 'Định dạng THPT 2025  |  Phản ứng xà phòng hóa, tính chất glucose và pin Galvani Zn–Cu.',
        blocks: [
          { kind: 'heading', text: 'Câu 1. Cho ester ethyl acetate có công thức cấu tạo CH₃COOC₂H₅ (M = 88 g/mol).' },
          {
            kind: 'lines',
            lines: [
              '   a) Ethyl acetate được điều chế từ acetic acid và ethanol có xúc tác H₂SO₄ đặc.    [ Đ / S ]',
              '   b) Đun nóng CH₃COOC₂H₅ với dung dịch NaOH dư thu được CH₃COONa và C₂H₅OH.         [ Đ / S ]',
              '   c) Ethyl acetate tan vô hạn trong nước và có nhiệt độ sôi cao hơn acetic acid.    [ Đ / S ]',
              '   d) Thủy phân hoàn toàn 8,8 g CH₃COOC₂H₅ bằng NaOH dư thu được 8,2 g muối khan.    [ Đ / S ]',
            ],
          },
          { kind: 'heading', text: 'Câu 2. Xét pin Galvani Zn–Cu ở điều kiện chuẩn với E°(Zn²⁺/Zn) = -0,76 V và E°(Cu²⁺/Cu) = +0,34 V.' },
          {
            kind: 'lines',
            lines: [
              '   a) Điện cực kẽm (Zn) đóng vai trò là cực âm (anode), nơi xảy ra quá trình oxi hóa. [ Đ / S ]',
              '   b) Electron di chuyển ở mạch ngoài từ điện cực đồng (Cu) sang điện cực kẽm (Zn).   [ Đ / S ]',
              '   c) Sức điện động chuẩn của pin Galvani Zn–Cu là E°_pin = 1,10 V.                   [ Đ / S ]',
              '   d) Trong quá trình pin hoạt động, khối lượng thanh Zn giảm và khối lượng thanh Cu tăng. [ Đ / S ]',
            ],
          },
          { kind: 'pageBreak' },
          { kind: 'heading', text: 'ĐÁP ÁN HÓA HỌC 12 — ĐÚNG / SAI 4 Ý' },
          {
            kind: 'table',
            headers: ['Câu', 'Đáp án', 'Phân tích & Phép tính kiểm chứng'],
            colWeights: [1, 1.7, 5.3],
            rows: [
              [
                'Câu 1',
                'Đ – Đ – S – Đ',
                'a) Đúng: CH₃COOH + C₂H₅OH ⇌ CH₃COOC₂H₅ + H₂O. b) Đúng. c) Sai: Ester ít tan trong nước và nhiệt độ sôi thấp hơn acid tương ứng do không tạo liên kết hydrogen giữa các phân tử ester. d) Đúng: n = 8,8/88 = 0,1 mol ⇒ m(CH₃COONa) = 0,1·82 = 8,2 g.',
              ],
              [
                'Câu 2',
                'Đ – S – Đ – Đ',
                'a) Đúng: E°(Zn²⁺/Zn) < E°(Cu²⁺/Cu) nên Zn là anode (Zn → Zn²⁺ + 2e). b) Sai: Electron đi từ cực âm (Zn) sang cực dương (Cu). c) Đúng: E°_pin = +0,34 - (-0,76) = 1,10 V. d) Đúng.',
              ],
            ],
          },
        ],
      },
      () => [],
      grading
    );
  }

  if (sampleId === 'sample-chem-05-short') {
    const grading = buildMcqSession('Phiếu Trả lời ngắn Hóa học 12', 'Hóa học', '12A2', [
      { number: 1, kind: 'short', answerKey: '18', maxScore: 2 },
      { number: 2, kind: 'short', answerKey: '10.8', maxScore: 2 },
      { number: 3, kind: 'short', answerKey: '80', maxScore: 2 },
      { number: 4, kind: 'short', answerKey: '0.15', maxScore: 2 },
      { number: 5, kind: 'short', answerKey: '2', maxScore: 2 },
    ]);
    return buildStructuredPayload(
      {
        subjectLabel: 'Hóa học',
        gradeLabel: 'Lớp 12',
        docTypeLabel: 'Phiếu bài tập · Trả lời ngắn',
        title: 'PHIẾU BÀI TẬP TRẢ LỜI NGẮN HÓA HỌC 12 (THPT 2025)',
        subtitle: '5 câu tính nhanh khối lượng, hiệu suất, nồng độ và pH kèm đơn vị chuẩn.',
        blocks: [
          { kind: 'heading', text: 'I. CÂU HỎI TRẢ LỜI NGẮN (5 câu × 2,0 điểm)' },
          {
            kind: 'lines',
            lines: [
              'Câu 1. Khối lượng phân tử (amu) của phân tử nước H₂O là bao nhiêu (H = 1, O = 16)?',
              '   Đáp số: ....................... (amu)',
              '',
              'Câu 2. Cho 9,0 g glucose (C₆H₁₂O₆, M = 180) phản ứng hoàn toàn với thuốc thử Tollens dư. Tính khối lượng kim loại bạc (Ag, M = 108) tạo thành (g).',
              '   Đáp số: ....................... (g)',
              '',
              'Câu 3. Đun 6,0 g acetic acid (0,1 mol) với ethanol dư có xúc tác H₂SO₄ đặc thu được 7,04 g ethyl acetate (M = 88). Tính hiệu suất phản ứng ester hóa (%).',
              '   Đáp số: ....................... (%)',
              '',
              'Câu 4. Chuẩn độ 10,0 mL dung dịch HCl chưa biết nồng độ cần vừa đủ 15,0 mL dung dịch NaOH 0,10 M. Tính nồng độ mol của dung dịch HCl (M).',
              '   Đáp số: ....................... (M)',
              '',
              'Câu 5. Tính giá trị pH của dung dịch HCl có nồng độ 0,01 M ở 25°C.',
              '   Đáp số: .......................',
            ],
          },
          { kind: 'pageBreak' },
          { kind: 'heading', text: 'II. ĐÁP ÁN CHI TIẾT' },
          {
            kind: 'table',
            headers: ['Câu', 'Đáp số', 'Phép tính kiểm chứng'],
            colWeights: [1, 1.6, 5.4],
            rows: [
              ['1', '18 amu', 'M(H₂O) = 2·1 + 16 = 18 amu.'],
              ['2', '10,8 g', 'n(glucose) = 9/180 = 0,05 mol ⇒ n(Ag) = 2·0,05 = 0,1 mol ⇒ m(Ag) = 0,1·108 = 10,8 g.'],
              ['3', '80 %', 'n(ester lí thuyết) = 0,1 mol (8,8 g); H = (7,04 / 8,8) × 100% = 80%.'],
              ['4', '0,15 M', 'C(HCl)·10 = 0,10·15 ⇒ C(HCl) = 0,15 M.'],
              ['5', '2', '[H⁺] = 0,01 = 10⁻² M ⇒ pH = -lg(10⁻²) = 2.'],
            ],
          },
        ],
      },
      () => [],
      grading
    );
  }

  if (sampleId === 'sample-chem-06-essay') {
    const grading = buildRubricSession('Đề tự luận Hóa học 11', 'Hóa học', '11A2', [
      { id: 'ce1', label: 'Câu 1 (Chuỗi phản ứng Nitrogen)', maxScore: 4 },
      { id: 'ce2', label: 'Câu 2 (Nhận biết ion & muối)', maxScore: 3 },
      { id: 'ce3', label: 'Câu 3 (Hữu cơ đại cương)', maxScore: 3 },
    ]);
    return buildStructuredPayload(
      {
        subjectLabel: 'Hóa học',
        gradeLabel: 'Lớp 11',
        docTypeLabel: 'Đề kiểm tra · Tự luận',
        title: 'ĐỀ TỰ LUẬN HÓA HỌC 11: NITROGEN – SULFUR & HỮU CƠ ĐẠI CƯƠNG',
        subtitle: 'Thời gian: 45 phút  |  Viết phương trình cân bằng chính xác, giải thích hiện tượng và tính công thức phân tử.',
        blocks: [
          { kind: 'heading', text: 'Câu 1 (4,0 điểm). Hoàn thành sơ đồ chuyển hóa các hợp chất của Nitrogen (ghi rõ điều kiện):' },
          {
            kind: 'lines',
            lines: [
              '   N₂ —(1)→ NH₃ —(2)→ NO —(3)→ NO₂ —(4)→ HNO₃',
            ],
          },
          { kind: 'heading', text: 'Câu 2 (3,0 điểm). Phân biệt dung dịch bằng phương pháp hóa học' },
          {
            kind: 'lines',
            lines: [
              'Chỉ dùng thêm một thuốc thử thích hợp (ví dụ dung dịch Ba(OH)₂), hãy nêu cách nhận biết 3 dung dịch không màu đựng trong 3 lọ mất nhãn: NH₄Cl, (NH₄)₂SO₄ và Na₂SO₄. Viết phương trình hóa học minh họa.',
            ],
          },
          { kind: 'heading', text: 'Câu 3 (3,0 điểm). Lập công thức phân tử hợp chất hữu cơ' },
          {
            kind: 'lines',
            lines: [
              'Phân tích nguyên tố một hợp chất hữu cơ X cho kết quả: 52,17% C; 13,04% H; 34,79% O theo khối lượng. Biết phân tử khối của X xác định từ phổ khối lượng MS là M = 46. Xác định công thức phân tử của X.',
            ],
          },
          { kind: 'writingLines', title: 'Phần bài làm của học sinh:', count: 6 },
          { kind: 'pageBreak' },
          { kind: 'heading', text: 'ĐÁP ÁN & THANG ĐIỂM TỰ LUẬN HÓA 11' },
          {
            kind: 'lines',
            lines: [
              'Câu 1 (mỗi phương trình đúng & cân bằng 1,0 điểm):',
              '  (1) N₂ + 3H₂ ⇌ 2NH₃ (t°, p, xúc tác Fe).',
              '  (2) 4NH₃ + 5O₂ → 4NO + 6H₂O (850°C, xúc tác Pt).',
              '  (3) 2NO + O₂ → 2NO₂ (nhiệt độ thường).',
              '  (4) 4NO₂ + O₂ + 2H₂O → 4HNO₃.',
              'Câu 2 (dùng dung dịch Ba(OH)₂ đun nhẹ):',
              '  - Chỉ có khí mùi khai NH₃ bay ra: NH₄Cl (2NH₄Cl + Ba(OH)₂ → BaCl₂ + 2NH₃↑ + 2H₂O).',
              '  - Vừa có khí mùi khai NH₃ vừa có kết tủa trắng BaSO₄: (NH₄)₂SO₄.',
              '  - Chỉ có kết tủa trắng BaSO₄: Na₂SO₄.',
              'Câu 3: Tỉ lệ C : H : O = (52,17/12) : (13,04/1) : (34,79/16) = 4,347 : 13,04 : 2,174 = 2 : 6 : 1.',
              '  CTĐGN: C₂H₆O (M = 46) ⇒ Công thức phân tử của X là C₂H₆O.',
            ],
          },
        ],
      },
      () => [],
      grading
    );
  }

  if (sampleId === 'sample-chem-07-atom') {
    return buildStructuredPayload({
      subjectLabel: 'Hóa học',
      gradeLabel: 'Lớp 10',
      docTypeLabel: 'Phiếu bài tập · Cấu tạo nguyên tử',
      title: 'PHIẾU BÀI TẬP CẤU TẠO NGUYÊN TỬ, ĐỒNG VỊ & CẤU HÌNH ELECTRON',
      subtitle: 'Lớp 10  |  Tính số hạt p, n, e; nguyên tử khối trung bình và viết cấu hình electron theo phân lớp.',
      blocks: [
        { kind: 'heading', text: 'Bài 1 (3,0 điểm). Xác định thành phần nguyên tử' },
        {
          kind: 'lines',
          lines: [
            'Hoàn thiện bảng thông tin các nguyên tử sau (điền số p, n, e và số khối A):',
          ],
        },
        {
          kind: 'table',
          headers: ['Kí hiệu nguyên tử', 'Số proton (Z)', 'Số neutron (N)', 'Số electron', 'Số khối (A)'],
          colWeights: [1.8, 1.4, 1.4, 1.4, 1.4],
          rows: [
            ['²³₁₁Na', '...', '...', '...', '...'],
            ['³⁵₁₇Cl', '...', '...', '...', '...'],
            ['⁵⁶₂₆Fe', '...', '...', '...', '...'],
          ],
        },
        { kind: 'heading', text: 'Bài 2 (3,5 điểm). Nguyên tử khối trung bình từ phổ khối lượng' },
        {
          kind: 'lines',
          lines: [
            'Trong tự nhiên, nguyên tố Chlorine (Cl) có hai đồng vị bền là ³⁵Cl chiếm 75,77% và ³⁷Cl chiếm 24,23% về số nguyên tử. Tính nguyên tử khối trung bình của Chlorine (làm tròn 2 chữ số thập phân).',
          ],
        },
        { kind: 'heading', text: 'Bài 3 (3,5 điểm). Viết cấu hình electron & dự đoán tính chất' },
        {
          kind: 'lines',
          lines: [
            'Viết cấu hình electron đầy đủ của các nguyên tử: O (Z = 8), Mg (Z = 12), Al (Z = 13), Ar (Z = 18). Cho biết mỗi nguyên tố là kim loại, phi kim hay khí hiếm.',
          ],
        },
        { kind: 'writingLines', count: 5 },
        { kind: 'pageBreak' },
        { kind: 'heading', text: 'ĐÁP ÁN CẤU TẠO NGUYÊN TỬ 10' },
        {
          kind: 'lines',
          lines: [
            'Bài 1:',
            '  - ²³₁₁Na: p = 11, n = 12, e = 11, A = 23.',
            '  - ³⁵₁₇Cl: p = 17, n = 18, e = 17, A = 35.',
            '  - ⁵⁶₂₆Fe: p = 26, n = 30, e = 26, A = 56.',
            'Bài 2: Ā(Cl) = (35 × 75,77 + 37 × 24,23) / 100 = (2651,95 + 896,51) / 100 = 35,4846 ≈ 35,48.',
            'Bài 3:',
            '  - O (Z=8): 1s²2s²2p⁴ (6 e ngoài cùng → phi kim).',
            '  - Mg (Z=12): 1s²2s²2p⁶3s² (2 e ngoài cùng → kim loại).',
            '  - Al (Z=13): 1s²2s²2p⁶3s²3p¹ (3 e ngoài cùng → kim loại).',
            '  - Ar (Z=18): 1s²2s²2p⁶3s²3p⁶ (8 e ngoài cùng → khí hiếm).',
          ],
        },
      ],
    });
  }

  if (sampleId === 'sample-chem-08-periodic') {
    return buildStructuredPayload({
      subjectLabel: 'Hóa học',
      gradeLabel: 'Lớp 10',
      docTypeLabel: 'Phiếu học tập · Bảng tuần hoàn',
      title: 'PHIẾU HỌC TẬP BẢNG TUẦN HOÀN & XU HƯỚNG BIẾN ĐỔI TÍNH CHẤT',
      subtitle: 'Lớp 10  |  Xác định vị trí nguyên tố, so sánh bán kính nguyên tử, độ âm điện và tính acid – base của hydroxide.',
      blocks: [
        { kind: 'heading', text: 'Bài 1 (4,0 điểm). Xác định vị trí trong bảng tuần hoàn từ Z' },
        {
          kind: 'lines',
          lines: [
            'Cho các nguyên tố: Na (Z = 11), Mg (Z = 12), Al (Z = 13), Si (Z = 14), P (Z = 15), S (Z = 16), Cl (Z = 17).',
            'a) Xác định số chu kì và số nhóm A của mỗi nguyên tố trên.',
            'b) Sắp xếp các nguyên tố trên theo chiều GIẢM DẦN bán kính nguyên tử và TĂNG DẦN độ âm điện.',
          ],
        },
        { kind: 'heading', text: 'Bài 2 (3,0 điểm). So sánh tính kim loại và tính base của hydroxide' },
        {
          kind: 'lines',
          lines: [
            'Sắp xếp các hydroxide sau theo chiều GIẢM DẦN tính base và giải thích: NaOH, Mg(OH)₂, Al(OH)₃.',
          ],
        },
        { kind: 'heading', text: 'Bài 3 (3,0 điểm). Công thức oxide cao nhất & hợp chất khí với hydrogen' },
        {
          kind: 'lines',
          lines: [
            'Nguyên tố R thuộc nhóm VIA trong bảng tuần hoàn. Viết công thức oxide cao nhất và công thức hợp chất khí với hydrogen của R. Biết trong oxide cao nhất, oxygen chiếm 60% về khối lượng, xác định tên nguyên tố R.',
          ],
        },
        { kind: 'writingLines', count: 6 },
        { kind: 'pageBreak' },
        { kind: 'heading', text: 'ĐÁP ÁN BẢNG TUẦN HOÀN LỚP 10' },
        {
          kind: 'lines',
          lines: [
            'Bài 1: Cả 7 nguyên tố đều thuộc Chu kì 3, lần lượt các nhóm IA → VIIA.',
            '  - Bán kính nguyên tử giảm dần: Na > Mg > Al > Si > P > S > Cl.',
            '  - Độ âm điện tăng dần: Na < Mg < Al < Si < P < S < Cl.',
            'Bài 2: Tính base giảm dần: NaOH > Mg(OH)₂ > Al(OH)₃ (do cùng chu kì 3, từ trái sang phải tính kim loại giảm dần; Al(OH)₃ là hydroxide lưỡng tính).',
            'Bài 3: R thuộc nhóm VIA ⇒ oxide cao nhất là RO₃, hợp chất khí với H là H₂R.',
            '  %O = (48 / (M_R + 48)) × 100% = 60% ⇒ M_R = 32 ⇒ R là Sulfur (S, lưu huỳnh).',
          ],
        },
      ],
    });
  }

  if (sampleId === 'sample-chem-09-bonding') {
    return buildStructuredPayload({
      subjectLabel: 'Hóa học',
      gradeLabel: 'Lớp 10',
      docTypeLabel: 'Phiếu học tập · Liên kết hóa học',
      title: 'PHIẾU HỌC TẬP LIÊN KẾT HÓA HỌC, CÔNG THỨC LEWIS & LIÊN KẾT HYDROGEN',
      subtitle: 'Lớp 10  |  Quy tắc octet, phân loại liên kết theo hiệu độ âm điện và giải thích nhiệt độ sôi.',
      blocks: [
        { kind: 'heading', text: 'Bài 1 (4,0 điểm). Phân loại liên kết theo hiệu độ âm điện (Δχ)' },
        {
          kind: 'lines',
          lines: [
            'Cho giá trị độ âm điện (Pauling): H = 2,20; C = 2,55; N = 3,04; O = 3,44; Na = 0,93; Cl = 3,16.',
            'Tính Δχ và cho biết loại liên kết (ion, cộng hóa trị có cực hay không cực) trong các phân tử: Cl₂, HCl, H₂O, NaCl, CH₄.',
          ],
        },
        { kind: 'heading', text: 'Bài 2 (3,0 điểm). Viết công thức electron và công thức Lewis' },
        {
          kind: 'lines',
          lines: [
            'Biểu diễn công thức Lewis (thể hiện cặp electron chung và cặp electron riêng) cho các phân tử: H₂O, NH₃, CO₂ và N₂.',
          ],
        },
        { kind: 'heading', text: 'Bài 3 (3,0 điểm). Giải thích ảnh hưởng của liên kết hydrogen' },
        {
          kind: 'lines',
          lines: [
            'Vì sao nước (H₂O, M = 18) có nhiệt độ sôi 100°C, cao hơn rất nhiều so với H₂S (M = 34, sôi ở -60,7°C) dù phân tử khối nhỏ hơn?',
          ],
        },
        { kind: 'writingLines', count: 6 },
        { kind: 'pageBreak' },
        { kind: 'heading', text: 'ĐÁP ÁN LIÊN KẾT HÓA HỌC 10' },
        {
          kind: 'lines',
          lines: [
            'Bài 1 (Quy ước: Δχ < 0,4: CHT không cực; 0,4 ≤ Δχ < 1,7: CHT có cực; Δχ ≥ 1,7: ion):',
            '  - Cl₂: Δχ = 0 → CHT không cực.   - CH₄: Δχ = 0,35 → CHT không cực.',
            '  - HCl: Δχ = 0,96 → CHT có cực.   - H₂O: Δχ = 1,24 → CHT có cực.',
            '  - NaCl: Δχ = 2,23 → Liên kết ion.',
            'Bài 2: H–O–H (O còn 2 cặp e riêng); NH₃ (3 liên kết đơn N–H, N còn 1 cặp e riêng); O=C=O (mỗi O còn 2 cặp e riêng); N≡N (mỗi N còn 1 cặp e riêng).',
            'Bài 3: Giữa các phân tử H₂O hình thành liên kết hydrogen liên phân tử bền vững (do O có độ âm điện lớn, kích thước nhỏ và còn cặp e riêng), làm tăng mạnh nhiệt độ sôi so với H₂S (không tạo liên kết hydrogen).',
          ],
        },
      ],
    });
  }

  if (sampleId === 'sample-chem-10-redox') {
    return buildStructuredPayload({
      subjectLabel: 'Hóa học',
      gradeLabel: 'Lớp 10',
      docTypeLabel: 'Phiếu bài tập · Oxi hóa – Khử',
      title: 'PHIẾU BÀI TẬP PHẢN ỨNG OXI HÓA – KHỬ (THĂNG BẰNG ELECTRON)',
      subtitle: 'Lớp 10  |  Xác định số oxi hóa, chất khử, chất oxi hóa và cân bằng phương trình chính xác.',
      blocks: [
        { kind: 'heading', text: 'Bài 1 (3,0 điểm). Xác định số oxi hóa của nguyên tố gạch chân/được nêu' },
        {
          kind: 'lines',
          lines: [
            'Xác định số oxi hóa của: N trong NH₃, NO₂, HNO₃; Mn trong MnO₂, KMnO₄; Cr trong K₂Cr₂O₇.',
          ],
        },
        { kind: 'heading', text: 'Bài 2 (7,0 điểm). Cân bằng các phản ứng oxi hóa – khử sau theo phương pháp thăng bằng electron' },
        {
          kind: 'lines',
          lines: [
            '(Chỉ rõ chất khử, chất oxi hóa và quá trình nhường/nhận electron cho từng phản ứng):',
            'a) Fe + Cl₂ —(t°)→ FeCl₃',
            'b) Cu + HNO₃ (loãng) → Cu(NO₃)₂ + NO↑ + H₂O',
            'c) Fe + H₂SO₄ (đặc, nóng) → Fe₂(SO₄)₃ + SO₂↑ + H₂O',
            'd) KMnO₄ + HCl (đặc) → KCl + MnCl₂ + Cl₂↑ + H₂O',
          ],
        },
        { kind: 'writingLines', title: 'Trình bày quá trình thăng bằng electron:', count: 7 },
        { kind: 'pageBreak' },
        { kind: 'heading', text: 'ĐÁP ÁN CÂN BẰNG OXI HÓA – KHỬ' },
        {
          kind: 'lines',
          lines: [
            'Bài 1: N: -3 (NH₃), +4 (NO₂), +5 (HNO₃);  Mn: +4 (MnO₂), +7 (KMnO₄);  Cr: +6 (K₂Cr₂O₇).',
            'Bài 2 (Các phương trình đã cân bằng chính xác):',
            '  a) 2Fe + 3Cl₂ —(t°)→ 2FeCl₃   (Fe: chất khử, Cl₂: chất oxi hóa).',
            '  b) 3Cu + 8HNO₃ → 3Cu(NO₃)₂ + 2NO↑ + 4H₂O   (Cu: chất khử, HNO₃: chất oxi hóa).',
            '  c) 2Fe + 6H₂SO₄ (đặc, nóng) → Fe₂(SO₄)₃ + 3SO₂↑ + 6H₂O   (Fe: chất khử, H₂SO₄: chất oxi hóa).',
            '  d) 2KMnO₄ + 16HCl → 2KCl + 2MnCl₂ + 5Cl₂↑ + 8H₂O   (HCl: chất khử, KMnO₄: chất oxi hóa).',
          ],
        },
      ],
    });
  }

  if (sampleId === 'sample-chem-11-stoichiometry') {
    return buildStructuredPayload({
      subjectLabel: 'Hóa học',
      gradeLabel: 'Lớp 11',
      docTypeLabel: 'Phiếu bài tập · Tính toán hóa học',
      title: 'PHIẾU BÀI TẬP TÍNH TOÁN HÓA HỌC (SỐ MOL, NỒNG ĐỘ & HIỆU SUẤT)',
      subtitle: 'Lớp 11  |  Áp dụng thể tích mol khí ở đkc (24,79 L/mol ở 25°C, 1 bar) theo chuẩn GDPT 2018.',
      blocks: [
        { kind: 'heading', text: 'Bài 1 (3,5 điểm). Kim loại tác dụng với dung dịch acid loãng' },
        {
          kind: 'lines',
          lines: [
            'Cho 6,5 g kẽm (Zn = 65) tác dụng hoàn toàn với 200 mL dung dịch HCl vừa đủ.',
            'a) Viết phương trình hóa học và tính thể tích khí H₂ thu được ở đkc (25°C, 1 bar: 1 mol khí = 24,79 L).',
            'b) Tính nồng độ mol của dung dịch HCl đã dùng và khối lượng muối ZnCl₂ tạo thành.',
          ],
        },
        { kind: 'heading', text: 'Bài 2 (3,5 điểm). Bài toán hỗn hợp hai kim loại' },
        {
          kind: 'lines',
          lines: [
            'Hòa tan hoàn toàn 5,1 g hỗn hợp gồm Mg (M = 24) và Al (M = 27) bằng dung dịch H₂SO₄ loãng dư thu được 0,25 mol khí H₂. Tính phần trăm khối lượng của mỗi kim loại trong hỗn hợp ban đầu.',
          ],
        },
        { kind: 'heading', text: 'Bài 3 (3,0 điểm). Bài toán có hiệu suất phản ứng' },
        {
          kind: 'lines',
          lines: [
            'Tổng hợp ammonia theo phản ứng: N₂ + 3H₂ ⇌ 2NH₃ từ 1,0 mol N₂ và 4,0 mol H₂. Biết hiệu suất phản ứng đạt 25%, tính số mol NH₃ thu được.',
          ],
        },
        { kind: 'writingLines', count: 5 },
        { kind: 'pageBreak' },
        { kind: 'heading', text: 'ĐÁP ÁN TÍNH TOÁN HÓA HỌC 11' },
        {
          kind: 'lines',
          lines: [
            'Bài 1: Zn + 2HCl → ZnCl₂ + H₂↑;  n(Zn) = 6,5 / 65 = 0,1 mol.',
            '  a) n(H₂) = 0,1 mol ⇒ V(H₂) = 0,1 × 24,79 = 2,479 lít.',
            '  b) n(HCl) = 0,2 mol ⇒ C_M(HCl) = 0,2 / 0,2 = 1,0 M;  m(ZnCl₂) = 0,1 × 136 = 13,6 g.',
            'Bài 2: Đặt n(Mg) = x, n(Al) = y ⇒ 24x + 27y = 5,1 và x + 1,5y = 0,25.',
            '  Giải hệ: x = 0,1 mol (m_Mg = 2,4 g) và y = 0,1 mol (m_Al = 2,7 g).',
            '  %m(Mg) = (2,4/5,1)×100% ≈ 47,06%;  %m(Al) ≈ 52,94%.',
            'Bài 3: So tỉ lệ 1/1 < 4/3 nên hiệu suất tính theo N₂. n(NH₃) = 2 × 1,0 × 25% = 0,5 mol.',
          ],
        },
      ],
    });
  }

  if (sampleId === 'sample-chem-12-equilibrium') {
    return buildStructuredPayload(
      {
        subjectLabel: 'Hóa học',
        gradeLabel: 'Lớp 11',
        docTypeLabel: 'Phiếu bài tập · Cân bằng hóa học',
        title: 'PHIẾU BÀI TẬP CÂN BẰNG HÓA HỌC, HẰNG SỐ Kc & NGUYÊN LÍ LE CHATELIER',
        subtitle: 'Lớp 11  |  Tính hằng số cân bằng Kc, dự đoán chiều chuyển dịch cân bằng và tính pH dung dịch.',
        blocks: [
          { kind: 'heading', text: 'Bài 1 (4,0 điểm). Tính hằng số cân bằng Kc' },
          {
            kind: 'lines',
            lines: [
              'Xét phản ứng thuận nghịch trong bình kín dung tích 1 lít ở nhiệt độ không đổi:',
            ],
          },
          { kind: 'spacer', height: 48 },
          {
            kind: 'lines',
            lines: [
              'Ban đầu nạp vào bình 1,0 mol H₂ và 1,0 mol I₂. Khi hệ đạt trạng thái cân bằng, nồng độ HI đo được là 1,6 M. Tính nồng độ cân bằng của H₂, I₂ và hằng số cân bằng Kc.',
            ],
          },
          { kind: 'heading', text: 'Bài 2 (3,0 điểm). Vận dụng nguyên lí chuyển dịch cân bằng Le Chatelier' },
          {
            kind: 'lines',
            lines: [
              'Cho cân bằng: 2SO₂(g) + O₂(g) ⇌ 2SO₃(g) với ΔrH°₂₉₈ = -198 kJ (tỏa nhiệt). Cho biết cân bằng chuyển dịch theo chiều nào khi: (a) tăng nồng độ O₂; (b) tăng áp suất chung của hệ; (c) tăng nhiệt độ.',
            ],
          },
          { kind: 'heading', text: 'Bài 3 (3,0 điểm). Tính pH của dung dịch acid mạnh và base mạnh' },
          {
            kind: 'lines',
            lines: [
              'Tính pH của: (a) dung dịch HNO₃ 0,001 M; (b) dung dịch NaOH 0,01 M ở 25°C.',
            ],
          },
          { kind: 'writingLines', count: 4 },
          { kind: 'pageBreak' },
          { kind: 'heading', text: 'ĐÁP ÁN CÂN BẰNG HÓA HỌC 11' },
          {
            kind: 'lines',
            lines: [
              'Bài 1: Tại cân bằng [HI] = 1,6 M ⇒ lượng H₂ và I₂ đã phản ứng là 1,6/2 = 0,8 M.',
              '  [H₂]_cb = 1,0 - 0,8 = 0,2 M;  [I₂]_cb = 1,0 - 0,8 = 0,2 M.',
              '  Kc = [HI]² / ([H₂]·[I₂]) = (1,6)² / (0,2 · 0,2) = 2,56 / 0,04 = 64.',
              'Bài 2: (a) Tăng [O₂] → chiều thuận; (b) Tăng áp suất (3 mol khí → 2 mol khí) → chiều thuận; (c) Tăng nhiệt độ → chiều nghịch (thu nhiệt).',
              'Bài 3: (a) [H⁺] = 10⁻³ M ⇒ pH = 3.  (b) [OH⁻] = 10⁻² M ⇒ pOH = 2 ⇒ pH = 14 - 2 = 12.',
            ],
          },
        ],
      },
      (pageId) => [
        makeFormulaObj('c12-f1', '\\text{H}_2(g) + \\text{I}_2(g) \\rightleftharpoons 2\\text{HI}(g),\\quad K_c = \\frac{[\\text{HI}]^2}{[\\text{H}_2][\\text{I}_2]}', pageId, 64, 184, '#087F70', 16),
      ]
    );
  }

  if (sampleId === 'sample-chem-13-structural') {
    return buildStructuredPayload({
      subjectLabel: 'Hóa học',
      gradeLabel: 'Lớp 11',
      docTypeLabel: 'Phiếu học tập · Công thức cấu tạo',
      title: 'PHIẾU HỌC TẬP CÔNG THỨC CẤU TẠO, ĐỒNG PHÂN & DANH PHÁP IUPAC',
      subtitle: 'Lớp 11  |  Viết đồng phân mạch carbon, đồng phân vị trí nhóm chức và gọi tên chuẩn IUPAC.',
      blocks: [
        { kind: 'heading', text: 'Bài 1 (3,5 điểm). Viết công thức cấu tạo thu gọn & gọi tên IUPAC các đồng phân của Alkane C₅H₁₂' },
        { kind: 'writingLines', count: 4 },
        { kind: 'heading', text: 'Bài 2 (3,5 điểm). Đồng phân cấu tạo và đồng phân hình học của Alkene C₄H₈' },
        {
          kind: 'lines',
          lines: [
            'Viết tất cả các đồng phân alkene mạch hở ứng với công thức C₄H₈, gọi tên thay thế (IUPAC) và chỉ rõ đồng phân nào có đồng phân hình học cis – trans.',
          ],
        },
        { kind: 'writingLines', count: 4 },
        { kind: 'heading', text: 'Bài 3 (3,0 điểm). Đồng phân Alcohol C₃H₈O & bậc của alcohol' },
        {
          kind: 'lines',
          lines: [
            'Viết công thức cấu tạo, gọi tên thay thế và xác định bậc của các alcohol có công thức phân tử C₃H₈O.',
          ],
        },
        { kind: 'writingLines', count: 3 },
        { kind: 'pageBreak' },
        { kind: 'heading', text: 'ĐÁP ÁN CÔNG THỨC CẤU TẠO & DANH PHÁP IUPAC' },
        {
          kind: 'table',
          headers: ['Công thức PT', 'Công thức cấu tạo thu gọn', 'Tên thay thế (IUPAC) & Ghi chú'],
          colWeights: [1.3, 3.2, 3.5],
          rows: [
            ['C₅H₁₂ (1)', 'CH₃–CH₂–CH₂–CH₂–CH₃', 'pentane'],
            ['C₅H₁₂ (2)', 'CH₃–CH(CH₃)–CH₂–CH₃', '2-methylbutane'],
            ['C₅H₁₂ (3)', 'C(CH₃)₄', '2,2-dimethylpropane'],
            ['C₄H₈ (1)', 'CH₂=CH–CH₂–CH₃', 'but-1-ene (không có cis–trans)'],
            ['C₄H₈ (2)', 'CH₃–CH=CH–CH₃', 'but-2-ene (có đồng phân hình học cis-but-2-ene và trans-but-2-ene)'],
            ['C₄H₈ (3)', 'CH₂=C(CH₃)–CH₃', '2-methylpropene'],
            ['C₃H₈O (1)', 'CH₃–CH₂–CH₂–OH', 'propan-1-ol (alcohol bậc I)'],
            ['C₃H₈O (2)', 'CH₃–CH(OH)–CH₃', 'propan-2-ol (alcohol bậc II)'],
          ],
        },
      ],
    });
  }

  if (sampleId === 'sample-chem-14-graph') {
    return buildStructuredPayload(
      {
        subjectLabel: 'Hóa học',
        gradeLabel: 'Lớp 10',
        docTypeLabel: 'Phiếu học tập · Đồ thị Hóa học',
        title: 'PHIẾU BÀI TẬP ĐỒ THỊ BIẾN THIÊN NĂNG LƯỢNG & TỐC ĐỘ PHẢN ỨNG',
        subtitle: 'Lớp 10  |  Đọc biểu đồ năng lượng phản ứng tỏa nhiệt/thu nhiệt và vai trò của chất xúc tác.',
        blocks: [
          { kind: 'heading', text: 'Quan sát biểu đồ năng lượng theo tiến trình phản ứng bên dưới:' },
          { kind: 'spacer', height: 215 },
          { kind: 'heading', text: 'Câu hỏi khai thác đồ thị:' },
          {
            kind: 'lines',
            lines: [
              '1) Dựa vào mức năng lượng của Chất đầu và Sản phẩm trên đồ thị, cho biết đây là phản ứng TỎA NHIỆT hay THU NHIỆT? Giải thích dấu của ΔrH°.',
              '2) So sánh năng lượng hoạt hóa Ea của đường không xúc tác (nét liền) và đường có xúc tác (nét đứt).',
              '3) Chất xúc tác có làm thay đổi biến thiên enthalpy ΔrH° của phản ứng hay không? Vì sao?',
              '4) Cho bảng số liệu giả định phân hủy H₂O₂: nồng độ H₂O₂ giảm từ 0,80 M xuống 0,40 M sau 200 giây. Tính tốc độ trung bình của phản ứng theo H₂O₂ (đơn vị: M/s).',
            ],
          },
          { kind: 'writingLines', count: 4 },
          { kind: 'pageBreak' },
          { kind: 'heading', text: 'ĐÁP ÁN ĐỒ THỊ NĂNG LƯỢNG & TỐC ĐỘ PHẢN ỨNG' },
          {
            kind: 'lines',
            lines: [
              '1) Mức năng lượng của Sản phẩm thấp hơn Chất đầu ⇒ Hệ giải phóng nhiệt ra môi trường ⇒ Phản ứng TỎA NHIỆT (ΔrH° = E_sp - E_cđ < 0).',
              '2) Đường có xúc tác có đỉnh năng lượng thấp hơn ⇒ Chất xúc tác tạo ra con đường phản ứng mới có năng lượng hoạt hóa Ea nhỏ hơn, giúp tốc độ phản ứng tăng lên.',
              '3) Không. Vì ΔrH° chỉ phụ thuộc vào trạng thái đầu và trạng thái cuối (năng lượng chất đầu và sản phẩm giữ nguyên).',
              '4) Tốc độ trung bình v̄ = -ΔC / Δt = (0,80 - 0,40) / 200 = 0,40 / 200 = 2,0·10⁻³ M/s (0,002 M/s).',
            ],
          },
        ],
      },
      (pageId) =>
        makeDiagramObj('c14-ene', 'chem-energy-profile', 'chemistry', pageId, 82, 160, 430, 210, 2)
    );
  }

  return null;
}
