import { PDFDocument, rgb } from 'pdf-lib';
import type { GradingSession, StudioObject } from '../types/studio';
import { embedStudioFonts } from '../engines/pdf/pdfEngine';
import { compileLatexToSvg } from '../engines/mathematics/formulaEngine';
import { getDiagramByKey } from '../engines/geometry/diagramLibrary';
import { createDefaultGradingSession } from '../engines/grading/gradingEngine';
import { SAMPLE_DOCUMENTS, type SampleDocDescriptor } from './sampleCatalog';
import { generateSocialEngSampleDocument } from './sampleDocsSocialEng';

export { SAMPLE_DOCUMENTS };
export type { SampleDocDescriptor };

interface SampleBuildPayload {
  pdfBytes: Uint8Array;
  initialObjects: (firstPageId: string) => StudioObject[];
  grading?: GradingSession;
}

async function createTextExamPdf(
  headerTitle: string,
  subHeader: string,
  sections: Array<{ heading: string; lines: string[] }>,
  footerNote = 'Tài liệu mẫu – PDF EDU STUDIO.'
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const fonts = await embedStudioFonts(pdf);
  const page = pdf.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();

  // Header bar accent line
  page.drawRectangle({ x: 42, y: height - 56, width: width - 84, height: 2.2, color: rgb(0.03, 0.5, 0.44) });
  page.drawText('TÀI LIỆU MẪU — PDF EDU STUDIO', {
    x: 42,
    y: height - 46,
    size: 9.5,
    font: fonts.sansBold,
    color: rgb(0.03, 0.5, 0.44),
  });

  // Main title
  page.drawText(headerTitle, {
    x: 42,
    y: height - 86,
    size: 16,
    font: fonts.sansBold,
    color: rgb(0.09, 0.31, 0.39),
  });
  page.drawText(subHeader, {
    x: 42,
    y: height - 106,
    size: 10.5,
    font: fonts.sans,
    color: rgb(0.32, 0.37, 0.42),
  });

  let y = height - 138;
  for (const sec of sections) {
    if (y < 90) break;
    page.drawText(sec.heading, {
      x: 42,
      y,
      size: 12,
      font: fonts.sansBold,
      color: rgb(0.12, 0.16, 0.22),
    });
    y -= 20;
    for (const line of sec.lines) {
      if (y < 76) break;
      page.drawText(line, {
        x: 50,
        y,
        size: 11,
        font: fonts.serif,
        color: rgb(0.14, 0.17, 0.22),
      });
      y -= 18;
    }
    y -= 10;
  }

  // Footer
  page.drawLine({
    start: { x: 42, y: 48 },
    end: { x: width - 42, y: 48 },
    thickness: 0.7,
    color: rgb(0.8, 0.85, 0.84),
  });
  page.drawText(footerNote, {
    x: 42,
    y: 32,
    size: 8.5,
    font: fonts.sans,
    color: rgb(0.45, 0.5, 0.54),
  });

  pdf.setTitle(headerTitle);
  pdf.setCreator('PDF EDU STUDIO');
  return pdf.save();
}

/** Build a genuine slightly-tilted scanned image PDF (zero text layer) to test OCR + deskew/contrast */
async function createScannedOcrSamplePdf(): Promise<Uint8Array> {
  const canvas = document.createElement('canvas');
  canvas.width = 1240;
  canvas.height = 1754;
  const ctx = canvas.getContext('2d')!;

  // Slight warm paper tint like a real scanner
  ctx.fillStyle = '#F7F6F1';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle scan grain
  ctx.fillStyle = 'rgba(0,0,0,0.03)';
  for (let i = 0; i < 600; i++) {
    ctx.fillRect((i * 79) % 1240, (i * 137) % 1754, 2, 2);
  }

  // Apply gentle 1.6-degree tilt to mimic real document scan
  ctx.save();
  ctx.translate(620, 877);
  ctx.rotate((1.6 * Math.PI) / 180);
  ctx.translate(-620, -877);

  ctx.fillStyle = '#1E293B';
  ctx.font = 'bold 34px "Be Vietnam Pro", Arial, sans-serif';
  ctx.fillText('PHIẾU ĐỌC HIỂU MẪU (BẢN SCAN OCR)', 96, 170);

  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(96, 194);
  ctx.lineTo(1120, 194);
  ctx.stroke();

  const lines = [
    'Tài liệu mẫu – PDF EDU STUDIO (không chứa dữ liệu thật).',
    '',
    'BÀI 1. ĐỌC HIỂU VĂN BẢN KHOA HỌC',
    'Nước tinh khiết sôi ở nhiệt độ 100 độ C tại áp suất khí quyển tiêu chuẩn.',
    'Trong quá trình quang hợp, cây xanh hấp thụ khí cacbonic và nước dưới tác',
    'dụng của ánh sáng mặt trời để tạo ra chất hữu cơ và giải phóng khí oxi.',
    '',
    'BÀI 2. BÀI TẬP VẬN DỤNG',
    'Câu 1: Một vật chuyển động thẳng đều với vận tốc 15 m/s trong 20 giây.',
    'Tính quãng đường vật đi được trong khoảng thời gian trên.',
    '',
    'Câu 2: Trình bày vai trò của nước đối với sự sống của sinh vật trên Trái Đất.',
    'Gợi ý: Giáo viên có thể dùng công cụ OCR trong thanh Công cụ để nhận dạng',
    'toàn bộ văn bản tiếng Việt trên trang ảnh scan này mà không cần Internet.',
  ];

  ctx.font = '26px "Be Vietnam Pro", Arial, sans-serif';
  let y = 270;
  for (const line of lines) {
    if (line.startsWith('BÀI ')) {
      ctx.font = 'bold 28px "Be Vietnam Pro", Arial, sans-serif';
    } else {
      ctx.font = '25px "Be Vietnam Pro", Arial, sans-serif';
    }
    ctx.fillText(line, 96, y);
    y += 52;
  }
  ctx.restore();

  const blob = await new Promise<Blob | null>((res) =>
    canvas.toBlob((b) => res(b), 'image/jpeg', 0.86)
  );
  let jpgBytes: Uint8Array;
  if (blob) {
    jpgBytes = new Uint8Array(await blob.arrayBuffer());
  } else {
    const dataUrl = canvas.toDataURL('image/jpeg', 0.86);
    const base64 = dataUrl.split(',')[1] || '';
    const bin = atob(base64);
    jpgBytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) {
      jpgBytes[i] = bin.charCodeAt(i);
    }
  }

  const pdf = await PDFDocument.create();
  const img = await pdf.embedJpg(jpgBytes);
  const page = pdf.addPage([595.28, 841.89]);
  page.drawImage(img, { x: 0, y: 0, width: 595.28, height: 841.89 });
  pdf.setTitle('Tài liệu scan mẫu OCR');
  return pdf.save();
}

export async function generateSampleDocument(sampleId: string): Promise<SampleBuildPayload> {
  if (
    sampleId.startsWith('sample-geo-') ||
    sampleId.startsWith('sample-his-') ||
    sampleId.startsWith('sample-eng-')
  ) {
    const built = await generateSocialEngSampleDocument(sampleId);
    if (built) return built;
  }

  if (sampleId === 'sample-12-scan-ocr') {
    const pdfBytes = await createScannedOcrSamplePdf();
    return { pdfBytes, initialObjects: () => [] };
  }

  if (sampleId === 'sample-01-math-mcq') {
    const pdfBytes = await createTextExamPdf(
      'ĐỀ KIỂM TRA TOÁN THPT – TRẮC NGHIỆM (MẪU)',
      'Thời gian làm bài: 45 phút  |  Họ và tên: Học sinh mẫu A  |  Lớp: 12A1',
      [
        {
          heading: 'PHẦN I. Trắc nghiệm nhiều lựa chọn (mỗi câu 0,25 điểm)',
          lines: [
            'Câu 1. Đạo hàm của hàm số y = x³ - 3x² + 2 là:',
            '   A. y\' = 3x² - 6x     B. y\' = 3x² - 3x     C. y\' = x² - 6x     D. y\' = 3x² + 6x',
            'Câu 2. Giá trị lớn nhất của hàm số y = -x² + 4x + 1 trên tập số thực là:',
            '   A. 3                 B. 5                 C. 4                 D. 1',
            'Câu 3. Trong không gian Oxyz, vectơ pháp tuyến của mặt phẳng 2x - y + 3z - 5 = 0 là:',
            '   A. (2; 1; 3)         B. (2; -1; -5)       C. (2; -1; 3)        D. (-1; 3; -5)',
            'Câu 4. Nghiệm của phương trình log₂(x - 1) = 3 là:',
            '   A. x = 7             B. x = 8             C. x = 10            D. x = 9',
          ],
        },
        {
          heading: 'PHẦN II. Trắc nghiệm Đúng / Sai 4 ý (Quy tắc THPT 2025: 0,1 – 0,25 – 0,5 – 1,0 điểm)',
          lines: [
            'Câu 5. Cho hàm số f(x) = x³ - 3x + 2. Xét tính đúng sai của các mệnh đề sau:',
            '   a) f\'(x) = 3x² - 3 với mọi x thuộc R.                              [ Đ / S ]',
            '   b) Hàm số đồng biến trên khoảng (-1; 1).                          [ Đ / S ]',
            '   c) Giá trị cực đại của hàm số bằng 4.                             [ Đ / S ]',
            '   d) Đồ thị hàm số đi qua điểm M(1; 0).                             [ Đ / S ]',
          ],
        },
        {
          heading: 'PHẦN III. Trả lời ngắn (0,5 điểm)',
          lines: [
            'Câu 6. Tính diện tích hình phẳng giới hạn bởi y = x² và đường thẳng y = 3x.',
            '   Đáp số: .......................',
          ],
        },
      ]
    );
    const grading = createDefaultGradingSession('Đề kiểm tra Toán THPT – Trắc nghiệm', 'Toán học');
    grading.mode = 'mcq';
    grading.studentName = 'Học sinh mẫu A';
    grading.studentCode = 'SBD001';
    return { pdfBytes, initialObjects: () => [], grading };
  }

  if (sampleId === 'sample-02-math-essay') {
    const pdfBytes = await createTextExamPdf(
      'ĐỀ KIỂM TRA TOÁN THPT – TỰ LUẬN (MẪU)',
      'Thời gian: 60 phút  |  Thang điểm: 10,0  |  Tài liệu mẫu',
      [
        {
          heading: 'Câu 1 (2,0 điểm). Khảo sát sự biến thiên của hàm số',
          lines: [
            'Tìm các khoảng đơn điệu và điểm cực trị của hàm số y = x³ - 3x² + 4.',
          ],
        },
        {
          heading: 'Câu 2 (2,0 điểm). Giải phương trình mũ và lôgarit',
          lines: [
            'Giải phương trình: 4ˣ - 5·2ˣ + 4 = 0 và kiểm tra nghiệm tìm được.',
          ],
        },
        {
          heading: 'Câu 3 (2,0 điểm). Nguyên hàm và tích phân',
          lines: [
            'Tính tích phân xác định I của hàm số f(x) = 2x + sin(x) trên đoạn [0; π].',
          ],
        },
        {
          heading: 'Câu 4 (2,0 điểm). Hình học không gian',
          lines: [
            'Cho hình chóp S.ABCD có đáy ABCD là hình vuông cạnh a, SA vuông góc với đáy',
            'và SA = a√3. Tính thể tích khối chóp S.ABCD và góc giữa SC với mặt phẳng (ABCD).',
          ],
        },
        {
          heading: 'Câu 5 (2,0 điểm). Xác suất cổ điển',
          lines: [
            'Một hộp có 5 bi xanh và 4 bi đỏ. Chọn ngẫu nhiên 3 viên bi. Tính xác suất để',
            'trong 3 viên bi lấy ra có ít nhất 2 viên bi màu xanh.',
          ],
        },
      ]
    );
    return { pdfBytes, initialObjects: () => [] };
  }

  if (sampleId === 'sample-03-math-space') {
    const pdfBytes = await createTextExamPdf(
      'ĐỀ TOÁN CÔNG THỨC & HÌNH HỌC KHÔNG GIAN (MẪU)',
      'Nhấp đúp vào công thức để sửa bằng MathLive; chọn hình vẽ để đổi nhãn hoặc màu nét.',
      [
        {
          heading: 'Bài 1. Hình chóp tứ giác S.ABCD có SA ⊥ (ABCD)',
          lines: [
            'Cho hình chóp S.ABCD có đáy là hình vuông cạnh a = 2 cm, cạnh bên SA vuông góc',
            'với mặt phẳng đáy. Biết góc giữa đường thẳng SC và mặt phẳng (ABCD) bằng 45 độ.',
            'a) Chứng minh rằng mặt phẳng (SBC) vuông góc với mặt phẳng (SAB).',
            'b) Tính khoảng cách từ điểm A đến mặt phẳng (SBD) theo công thức dưới đây:',
          ],
        },
        {
          heading: 'Bài 2. Thể tích và khoảng cách trong không gian Oxyz',
          lines: [
            'Áp dụng công thức tính thể tích khối chóp và khoảng cách từ điểm đến mặt phẳng:',
          ],
        },
      ]
    );
    const f1 = compileLatexToSvg('V_{S.ABCD} = \\frac{1}{3} S_{ABCD} \\cdot SA = \\frac{1}{3} a^2 h', '#164E63', 18);
    const f2 = compileLatexToSvg('d(A, (SBD)) = \\frac{1}{\\sqrt{\\frac{1}{SA^2} + \\frac{1}{AB^2} + \\frac{1}{AD^2}}}', '#087F70', 18);
    const diag = getDiagramByKey('math-3d-pyramid-sa-perp');
    return {
      pdfBytes,
      initialObjects: (pageId) => [
        {
          id: 's3-f1',
          type: 'formula',
          pageId,
          x: 64,
          y: 356,
          width: f1.widthPx,
          height: f1.heightPx,
          rotation: 0,
          zIndex: 1,
          opacity: 1,
          latex: 'V_{S.ABCD} = \\frac{1}{3} S_{ABCD} \\cdot SA = \\frac{1}{3} a^2 h',
          svgMarkup: f1.svgMarkup,
          color: '#164E63',
          fontSize: 18,
        },
        {
          id: 's3-f2',
          type: 'formula',
          pageId,
          x: 64,
          y: 420,
          width: f2.widthPx,
          height: f2.heightPx,
          rotation: 0,
          zIndex: 2,
          opacity: 1,
          latex: 'd(A, (SBD)) = \\frac{1}{\\sqrt{\\frac{1}{SA^2} + \\frac{1}{AB^2} + \\frac{1}{AD^2}}}',
          svgMarkup: f2.svgMarkup,
          color: '#087F70',
          fontSize: 18,
        },
        ...(diag
          ? [
              {
                id: 's3-d1',
                type: 'diagram' as const,
                pageId,
                x: 310,
                y: 480,
                width: 220,
                height: 170,
                rotation: 0,
                zIndex: 3,
                opacity: 1,
                title: diag.title,
                diagramKey: diag.key,
                subject: 'math' as const,
                svgMarkup: diag.render(),
                strokeColor: '#164E63',
                strokeWidth: 1.8,
                strokeStyle: 'solid' as const,
                labels: [],
                sourceKind: 'library' as const,
              },
            ]
          : []),
      ],
    };
  }

  if (sampleId === 'sample-04-math-graph') {
    const pdfBytes = await createTextExamPdf(
      'PHIẾU BÀI TẬP TOÁN: KHẢO SÁT & ĐỒ THỊ HÀM SỐ (MẪU)',
      'Môn Toán lớp 12  |  Giáo viên có thể mở trình Vẽ Đồ Thị để thay đổi hàm số trực tiếp.',
      [
        {
          heading: 'Hoạt động 1. Quan sát đồ thị hàm bậc ba y = x³ - 3x',
          lines: [
            'a) Xác định tọa độ điểm cực đại và điểm cực tiểu từ đồ thị bên dưới.',
            'b) Dựa vào bảng biến thiên, tìm số nghiệm của phương trình x³ - 3x = m theo m.',
          ],
        },
        {
          heading: 'Hoạt động 2. So sánh với đồ thị hàm parabol y = ax² + bx + c',
          lines: [
            'Xác định trục đối xứng, đỉnh parabol và giao điểm với trục hoành Ox.',
          ],
        },
      ]
    );
    const d1 = getDiagramByKey('math-graph-cubic');
    const d2 = getDiagramByKey('math-sign-table');
    return {
      pdfBytes,
      initialObjects: (pageId) => [
        ...(d1
          ? [
              {
                id: 's4-d1',
                type: 'diagram' as const,
                pageId,
                x: 56,
                y: 340,
                width: 230,
                height: 178,
                rotation: 0,
                zIndex: 1,
                opacity: 1,
                title: d1.title,
                diagramKey: d1.key,
                subject: 'math' as const,
                svgMarkup: d1.render(),
                strokeColor: '#164E63',
                strokeWidth: 1.8,
                strokeStyle: 'solid' as const,
                labels: [],
                sourceKind: 'library' as const,
              },
            ]
          : []),
        ...(d2
          ? [
              {
                id: 's4-d2',
                type: 'diagram' as const,
                pageId,
                x: 310,
                y: 340,
                width: 230,
                height: 178,
                rotation: 0,
                zIndex: 2,
                opacity: 1,
                title: d2.title,
                diagramKey: d2.key,
                subject: 'math' as const,
                svgMarkup: d2.render(),
                strokeColor: '#164E63',
                strokeWidth: 1.8,
                strokeStyle: 'solid' as const,
                labels: [],
                sourceKind: 'library' as const,
              },
            ]
          : []),
      ],
    };
  }

  if (sampleId === 'sample-05-phys-formula') {
    const pdfBytes = await createTextExamPdf(
      'ĐỀ KIỂM TRA VẬT LÍ THPT – DAO ĐỘNG & ĐIỆN XOAY CHIỀU (MẪU)',
      'Thời gian: 45 phút  |  Công thức được biểu diễn dưới dạng vector sắc nét.',
      [
        {
          heading: 'Câu 1. Dao động điều hòa của con lắc lò xo',
          lines: [
            'Một chất điểm dao động điều hòa với phương trình li độ và chu kỳ như công thức dưới:',
            'Cho biết biên độ A = 4 cm, tần số góc ω = 2π rad/s. Tính vận tốc cực đại của vật.',
          ],
        },
        {
          heading: 'Câu 2. Mạch điện xoay chiều R, L, C mắc nối tiếp',
          lines: [
            'Đặt điện áp xoay chiều u = 220√2 cos(100πt) V vào hai đầu đoạn mạch gồm',
            'R = 100 Ω, Z_L = 200 Ω, Z_C = 100 Ω. Tính tổng trở Z và cường độ dòng điện hiệu dụng I.',
          ],
        },
      ]
    );
    const f1 = compileLatexToSvg('x = A\\cos(\\omega t + \\varphi),\\quad T = \\frac{2\\pi}{\\omega}', '#164E63', 18);
    const f2 = compileLatexToSvg('Z = \\sqrt{R^2 + (Z_L - Z_C)^2},\\quad I = \\frac{U}{Z}', '#087F70', 18);
    return {
      pdfBytes,
      initialObjects: (pageId) => [
        {
          id: 's5-f1',
          type: 'formula',
          pageId,
          x: 68,
          y: 345,
          width: f1.widthPx,
          height: f1.heightPx,
          rotation: 0,
          zIndex: 1,
          opacity: 1,
          latex: 'x = A\\cos(\\omega t + \\varphi),\\quad T = \\frac{2\\pi}{\\omega}',
          svgMarkup: f1.svgMarkup,
          color: '#164E63',
          fontSize: 18,
        },
        {
          id: 's5-f2',
          type: 'formula',
          pageId,
          x: 68,
          y: 410,
          width: f2.widthPx,
          height: f2.heightPx,
          rotation: 0,
          zIndex: 2,
          opacity: 1,
          latex: 'Z = \\sqrt{R^2 + (Z_L - Z_C)^2},\\quad I = \\frac{U}{Z}',
          svgMarkup: f2.svgMarkup,
          color: '#087F70',
          fontSize: 18,
        },
      ],
    };
  }

  if (sampleId === 'sample-06-phys-circuit') {
    const pdfBytes = await createTextExamPdf(
      'PHIẾU BÀI TẬP VẬT LÍ: MẠCH ĐIỆN & CƠ HỌC (MẪU)',
      'Sơ đồ mạch điện và mặt phẳng nghiêng đều là đối tượng vector có thể chỉnh nhãn & kích thước.',
      [
        {
          heading: 'Bài 1. Mạch điện mắc nối tiếp R₁ và R₂',
          lines: [
            'Cho mạch điện có suất điện động E = 12 V, r = 1 Ω, R₁ = 5 Ω, R₂ = 6 Ω.',
            'Tính cường độ dòng điện trong mạch và hiệu điện thế giữa hai đầu mỗi điện trở.',
          ],
        },
        {
          heading: 'Bài 2. Phân tích lực trên mặt phẳng nghiêng',
          lines: [
            'Một vật khối lượng m = 2 kg trượt không ma sát trên mặt phẳng nghiêng góc α = 30°.',
            'Xác định độ lớn phản lực N và gia tốc trượt của vật (lấy g = 9,8 m/s²).',
          ],
        },
      ]
    );
    const d1 = getDiagramByKey('phys-circuit-series');
    const d2 = getDiagramByKey('phys-inclined-plane');
    return {
      pdfBytes,
      initialObjects: (pageId) => [
        ...(d1
          ? [
              {
                id: 's6-d1',
                type: 'diagram' as const,
                pageId,
                x: 56,
                y: 350,
                width: 230,
                height: 178,
                rotation: 0,
                zIndex: 1,
                opacity: 1,
                title: d1.title,
                diagramKey: d1.key,
                subject: 'physics' as const,
                svgMarkup: d1.render(),
                strokeColor: '#164E63',
                strokeWidth: 1.8,
                strokeStyle: 'solid' as const,
                labels: [],
                sourceKind: 'library' as const,
              },
            ]
          : []),
        ...(d2
          ? [
              {
                id: 's6-d2',
                type: 'diagram' as const,
                pageId,
                x: 310,
                y: 350,
                width: 230,
                height: 178,
                rotation: 0,
                zIndex: 2,
                opacity: 1,
                title: d2.title,
                diagramKey: d2.key,
                subject: 'physics' as const,
                svgMarkup: d2.render(),
                strokeColor: '#164E63',
                strokeWidth: 1.8,
                strokeStyle: 'solid' as const,
                labels: [],
                sourceKind: 'library' as const,
              },
            ]
          : []),
      ],
    };
  }

  if (sampleId === 'sample-07-chem-eq') {
    const pdfBytes = await createTextExamPdf(
      'ĐỀ KIỂM TRA HÓA HỌC – PHƯƠNG TRÌNH & CÂN BẰNG (MẪU)',
      'Môn Hóa học lớp 11  |  Phương trình phản ứng thuận nghịch và phương trình ion.',
      [
        {
          heading: 'Câu 1. Cân bằng tổng hợp amoniac (Quy trình Haber)',
          lines: [
            'Viết biểu thức hằng số cân bằng Kc và dự đoán chiều chuyển dịch cân bằng khi tăng áp suất:',
          ],
        },
        {
          heading: 'Câu 2. Phản ứng trao đổi ion trong dung dịch nước',
          lines: [
            'Trộn dung dịch BaCl₂ với dung dịch Na₂SO₄ dư. Viết phương trình ion rút gọn và tính',
            'khối lượng kết tủa thu được khi cho 0,1 mol ion Ba²⁺ phản ứng hoàn toàn.',
          ],
        },
      ]
    );
    const f1 = compileLatexToSvg('\\text{N}_2(g) + 3\\text{H}_2(g) \\xrightleftharpoons{t^\\circ, p, \\text{xt}} 2\\text{NH}_3(g)', '#164E63', 18);
    const f2 = compileLatexToSvg('\\text{Ba}^{2+} + \\text{SO}_4^{2-} \\longrightarrow \\text{BaSO}_4 \\downarrow', '#087F70', 18);
    return {
      pdfBytes,
      initialObjects: (pageId) => [
        {
          id: 's7-f1',
          type: 'formula',
          pageId,
          x: 64,
          y: 345,
          width: f1.widthPx,
          height: f1.heightPx,
          rotation: 0,
          zIndex: 1,
          opacity: 1,
          latex: '\\text{N}_2(g) + 3\\text{H}_2(g) \\xrightleftharpoons{t^\\circ, p, \\text{xt}} 2\\text{NH}_3(g)',
          svgMarkup: f1.svgMarkup,
          color: '#164E63',
          fontSize: 18,
        },
        {
          id: 's7-f2',
          type: 'formula',
          pageId,
          x: 64,
          y: 412,
          width: f2.widthPx,
          height: f2.heightPx,
          rotation: 0,
          zIndex: 2,
          opacity: 1,
          latex: '\\text{Ba}^{2+} + \\text{SO}_4^{2-} \\longrightarrow \\text{BaSO}_4 \\downarrow',
          svgMarkup: f2.svgMarkup,
          color: '#087F70',
          fontSize: 18,
        },
      ],
    };
  }

  if (sampleId === 'sample-08-chem-lab') {
    const pdfBytes = await createTextExamPdf(
      'PHIẾU THÍ NGHIỆM HÓA HỌC: CHUẨN ĐỘ AXIT – BAZƠ (MẪU)',
      'Hướng dẫn lắp ráp dụng cụ thí nghiệm và ghi nhận kết quả chuẩn độ.',
      [
        {
          heading: '1. Chuẩn bị hóa chất và dụng cụ',
          lines: [
            '- Dung dịch NaOH 0,10 M chứa trong buret; dung dịch HCl chưa biết nồng độ (10,0 mL)',
            '  chứa trong bình tam giác có nhỏ thêm 2 giọt chất chỉ thị phenolphtalein.',
          ],
        },
        {
          heading: '2. Tiến hành thí nghiệm và ghi số liệu',
          lines: [
            '- Mở khóa buret nhỏ từ từ dung dịch NaOH vào bình tam giác, lắc đều đến khi xuất hiện',
            '  màu hồng nhạt bền trong 30 giây thì dừng lại, đọc thể tích V trên buret.',
          ],
        },
      ]
    );
    const d1 = getDiagramByKey('chem-titration');
    const d2 = getDiagramByKey('chem-gas-collection');
    return {
      pdfBytes,
      initialObjects: (pageId) => [
        ...(d1
          ? [
              {
                id: 's8-d1',
                type: 'diagram' as const,
                pageId,
                x: 56,
                y: 350,
                width: 230,
                height: 178,
                rotation: 0,
                zIndex: 1,
                opacity: 1,
                title: d1.title,
                diagramKey: d1.key,
                subject: 'chemistry' as const,
                svgMarkup: d1.render(),
                strokeColor: '#164E63',
                strokeWidth: 1.8,
                strokeStyle: 'solid' as const,
                labels: [],
                sourceKind: 'library' as const,
              },
            ]
          : []),
        ...(d2
          ? [
              {
                id: 's8-d2',
                type: 'diagram' as const,
                pageId,
                x: 310,
                y: 350,
                width: 230,
                height: 178,
                rotation: 0,
                zIndex: 2,
                opacity: 1,
                title: d2.title,
                diagramKey: d2.key,
                subject: 'chemistry' as const,
                svgMarkup: d2.render(),
                strokeColor: '#164E63',
                strokeWidth: 1.8,
                strokeStyle: 'solid' as const,
                labels: [],
                sourceKind: 'library' as const,
              },
            ]
          : []),
      ],
    };
  }

  if (sampleId === 'sample-09-bio') {
    const pdfBytes = await createTextExamPdf(
      'PHIẾU HỌC TẬP SINH HỌC: QUANG HỢP & DI TRUYỀN (MẪU)',
      'Môn Sinh học THPT  |  Tài liệu mẫu có công thức và bài tập di truyền.',
      [
        {
          heading: 'Phần 1. Phương trình tổng quát quang hợp ở thực vật',
          lines: [
            'Hoàn thiện các yếu tố đầu vào, sản phẩm tạo thành và vai trò của pha sáng, pha tối.',
          ],
        },
        {
          heading: 'Phần 2. Bài tập cấu trúc DNA và sơ đồ lai Mendel',
          lines: [
            'Một phân tử DNA có tổng số 3000 nucleotide, trong đó số nucleotide loại A chiếm 20%.',
            'Tính số nucleotide mỗi loại (A, T, G, X), chiều dài đoạn gen L và số liên kết hiđrô H.',
          ],
        },
      ]
    );
    const f1 = compileLatexToSvg('6\\text{CO}_2 + 12\\text{H}_2\\text{O} \\xrightarrow{\\text{Ánh sáng}} \\text{C}_6\\text{H}_{12}\\text{O}_6 + 6\\text{O}_2\\uparrow + 6\\text{H}_2\\text{O}', '#087F70', 16);
    const f2 = compileLatexToSvg('N = 2A + 2G = 3000,\\quad H = 2A + 3G', '#164E63', 17);
    return {
      pdfBytes,
      initialObjects: (pageId) => [
        {
          id: 's9-f1',
          type: 'formula',
          pageId,
          x: 52,
          y: 345,
          width: Math.min(480, f1.widthPx),
          height: f1.heightPx,
          rotation: 0,
          zIndex: 1,
          opacity: 1,
          latex: '6\\text{CO}_2 + 12\\text{H}_2\\text{O} \\xrightarrow{\\text{Ánh sáng}} \\text{C}_6\\text{H}_{12}\\text{O}_6 + 6\\text{O}_2\\uparrow + 6\\text{H}_2\\text{O}',
          svgMarkup: f1.svgMarkup,
          color: '#087F70',
          fontSize: 16,
        },
        {
          id: 's9-f2',
          type: 'formula',
          pageId,
          x: 64,
          y: 416,
          width: f2.widthPx,
          height: f2.heightPx,
          rotation: 0,
          zIndex: 2,
          opacity: 1,
          latex: 'N = 2A + 2G = 3000,\\quad H = 2A + 3G',
          svgMarkup: f2.svgMarkup,
          color: '#164E63',
          fontSize: 17,
        },
      ],
    };
  }

  if (sampleId === 'sample-10-cs') {
    const pdfBytes = await createTextExamPdf(
      'PHIẾU HỌC TẬP TIN HỌC: LOGIC BOOLEAN & THUẬT TOÁN (MẪU)',
      'Môn Tin học THPT  |  Biểu diễn logic mệnh đề, hệ nhị phân và đánh giá độ phức tạp.',
      [
        {
          heading: 'Câu 1. Biểu diễn số nguyên dương trong hệ nhị phân',
          lines: [
            'Chuyển đổi các số thập phân 13 và 45 sang hệ đếm nhị phân cơ số 2.',
          ],
        },
        {
          heading: 'Câu 2. Biến đổi biểu thức logic theo định luật De Morgan',
          lines: [
            'Lập bảng chân trị kiểm chứng hai đẳng thức logic dưới đây:',
          ],
        },
        {
          heading: 'Câu 3. Đánh giá độ phức tạp thuật toán sắp xếp trộn (Merge Sort)',
          lines: [
            'Giải thích vì sao thời gian thực thi của Merge Sort có bậc O(n log₂ n).',
          ],
        },
      ]
    );
    const f1 = compileLatexToSvg('\\overline{A \\land B} = \\overline{A} \\lor \\overline{B},\\quad T(n) = \\mathcal{O}(n \\log_2 n)', '#164E63', 18);
    return {
      pdfBytes,
      initialObjects: (pageId) => [
        {
          id: 's10-f1',
          type: 'formula',
          pageId,
          x: 64,
          y: 390,
          width: f1.widthPx,
          height: f1.heightPx,
          rotation: 0,
          zIndex: 1,
          opacity: 1,
          latex: '\\overline{A \\land B} = \\overline{A} \\lor \\overline{B},\\quad T(n) = \\mathcal{O}(n \\log_2 n)',
          svgMarkup: f1.svgMarkup,
          color: '#164E63',
          fontSize: 18,
        },
      ],
    };
  }

  // sample-11-student-grade: Student essay paper ready for teacher grading!
  const pdfBytes = await createTextExamPdf(
    'BÀI LÀM KIỂM TRA TOÁN 45 PHÚT (BÀI LÀM MẪU)',
    'Họ và tên: Học sinh mẫu B  |  SBD: HS-012  |  Lớp: 12A1  |  Bài làm mẫu',
    [
      {
        heading: 'Câu 1 (2,0 điểm): Giải phương trình x² - 5x + 6 = 0',
        lines: [
          'Bài làm: Ta có biệt thức Δ = (-5)² - 4·1·6 = 25 - 24 = 1 > 0.',
          'Phương trình có hai nghiệm phân biệt: x₁ = (5 + 1)/2 = 3 và x₂ = (5 - 1)/2 = 2.',
          'Vậy tập nghiệm của phương trình là S = {2; 3}.',
        ],
      },
      {
        heading: 'Câu 2 (2,0 điểm): Tính đạo hàm của hàm số y = x³ - 4x² + 5x - 1',
        lines: [
          'Bài làm: y\' = 3x² - 8x + 5.',
          'Tại x = 1, ta có y\'(1) = 3 - 8 + 5 = 0.',
        ],
      },
      {
        heading: 'Câu 3 (2,0 điểm): Tính tích phân từ 0 đến 2 của (3x² + 2x) dx',
        lines: [
          'Bài làm: Nguyên hàm của 3x² + 2x là x³ + x².',
          'Thay cận: (2³ + 2²) - (0 + 0) = 8 + 4 = 10.   [Lưu ý: Học sinh tính nhầm 8+4=10!]',
        ],
      },
      {
        heading: 'Câu 4 (2,0 điểm): Tính thể tích hình lập phương có cạnh a = 3 cm',
        lines: [
          'Bài làm: V = a³ = 3³ = 27.   [Lưu ý: Học sinh quên ghi đơn vị cm³]',
        ],
      },
      {
        heading: 'Câu 5 (2,0 điểm): Tính khoảng cách giữa hai điểm A(1; 2) và B(4; 6)',
        lines: [
          'Bài làm: AB = √[(4 - 1)² + (6 - 2)²] = √(9 + 16) = √25 = 5.',
        ],
      },
    ]
  );

  const grading = createDefaultGradingSession('Kiểm tra Toán 45 phút (Tài liệu mẫu)', 'Toán học');
  grading.studentName = 'Học sinh mẫu B';
  grading.studentCode = 'HS-012';
  grading.className = '12A1';
  grading.status = 'in_progress';
  grading.questions[0].earnedScore = 2;
  grading.questions[1].earnedScore = 2;
  grading.questions[2].earnedScore = 1.5;
  grading.questions[3].earnedScore = 1.75;
  grading.questions[4].earnedScore = 2;
  grading.teacherComment = 'Nắm vững phương pháp, cần cẩn thận hơn ở bước tính cộng và ghi đủ đơn vị.';

  return {
    pdfBytes,
    grading,
    initialObjects: (pageId) => [
      {
        id: 'sg-1',
        type: 'grading-score',
        pageId,
        x: 448,
        y: 136,
        width: 105,
        height: 26,
        rotation: 0,
        zIndex: 1,
        opacity: 1,
        questionId: 'q1',
        questionLabel: 'Câu 1',
        score: 2,
        maxScore: 2,
        color: '#DC2626',
      },
      {
        id: 'sg-tot',
        type: 'grading-total',
        pageId,
        x: 380,
        y: 66,
        width: 174,
        height: 58,
        rotation: 0,
        zIndex: 2,
        opacity: 1,
        template: 'with-comment',
        color: '#DC2626',
      },
    ],
  };
}
