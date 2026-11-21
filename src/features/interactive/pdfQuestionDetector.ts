import { PDFDocument } from 'pdf-lib';
import { openPdfDocument } from '../../engines/pdf/pdfEngine';
import {
  QUESTION_TYPE_META,
  type InteractiveQuestion,
  type InteractiveQuestionType,
  type MatchingItem,
  type TeacherAnswerKeyMap,
} from '../../types/interactive';

export interface TextLineBlock {
  text: string;
  x: number;
  y: number; // top-down PDF points
  width: number;
  height: number;
  items: Array<{ str: string; x: number; y: number; width: number }>;
}

export interface PageInspectionSummary {
  pdfPageNumber: number; // 1-based page number inside the PDF file
  printedPageLabel?: string; // Printed page number found in page header/footer
  width: number;
  height: number;
  textItemCount: number;
  isLikelyScan: boolean;
  detectedHeading?: string;
}

export interface PdfDetectionResult {
  lessonTitle?: string;
  pageSummaries: PageInspectionSummary[];
  scannedPageNumbers: number[]; // 1-based page numbers with minimal text layer
  questions: InteractiveQuestion[];
  /** Empty key placeholders ONLY — NEVER guesses correct answers automatically */
  emptyAnswerKeys: TeacherAnswerKeyMap;
  notes: string[];
}

export interface PageSelectionValidationResult {
  valid: boolean;
  pages: number[];
  summaryText: string;
  errorMessage?: string;
}

/**
 * Formats 1-based page numbers into warm, readable Vietnamese for teachers.
 * Example: [2, 3] -> "Từ trang 2 đến trang 3"; [2] -> "Trang 2";
 * [2, 3, 7, 8, 9] -> "Từ trang 2 đến trang 3, từ trang 7 đến trang 9".
 */
export function formatSelectedPagesVi(pages: number[]): string {
  if (!pages || pages.length === 0) return 'Chưa chọn trang nào';
  const sorted = Array.from(new Set(pages)).sort((a, b) => a - b);
  const ranges: Array<{ start: number; end: number }> = [];
  for (const p of sorted) {
    const last = ranges[ranges.length - 1];
    if (last && p === last.end + 1) {
      last.end = p;
    } else {
      ranges.push({ start: p, end: p });
    }
  }
  return ranges
    .map((r, idx) => {
      if (r.start === r.end) {
        return idx === 0 ? `Trang ${r.start}` : `trang ${r.start}`;
      }
      return idx === 0
        ? `Từ trang ${r.start} đến trang ${r.end}`
        : `từ trang ${r.start} đến trang ${r.end}`;
    })
    .join(', ');
}

/**
 * Strict, teacher-friendly validation of page selection specifications.
 * Returns actionable plain-Vietnamese errors when numbers are out of range or malformed.
 */
export function validatePageSelectionSpec(
  spec: string,
  totalPages: number
): PageSelectionValidationResult {
  const maxPage = Math.max(1, Math.floor(totalPages));
  const raw = spec.trim();
  if (!raw || /^(all|tất cả|tat ca|\*)$/i.test(raw)) {
    const allPages = Array.from({ length: maxPage }, (_, i) => i + 1);
    return {
      valid: true,
      pages: allPages,
      summaryText:
        maxPage === 1 ? 'Trang 1' : `Toàn bộ tài liệu (Từ trang 1 đến trang ${maxPage})`,
    };
  }

  const set = new Set<number>();
  const parts = raw
    .split(/[;,]+/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return {
      valid: false,
      pages: [],
      summaryText: '',
      errorMessage: `Tài liệu có ${maxPage} trang. Thầy cô vui lòng chọn trang từ 1 đến ${maxPage}.`,
    };
  }

  for (const p of parts) {
    const rangeMatch = p.match(/^(\d+)\s*[-–—]\s*(\d+)$/);
    if (rangeMatch) {
      const a = Number(rangeMatch[1]);
      const b = Number(rangeMatch[2]);
      if (a < 1 || b < 1 || a > maxPage || b > maxPage) {
        return {
          valid: false,
          pages: [],
          summaryText: '',
          errorMessage: `Tài liệu có ${maxPage} trang. Thầy cô vui lòng chọn trang từ 1 đến ${maxPage}.`,
        };
      }
      if (a > b) {
        return {
          valid: false,
          pages: [],
          summaryText: '',
          errorMessage: `Trang bắt đầu (${a}) đang lớn hơn trang kết thúc (${b}). Thầy cô hãy nhập lại, ví dụ: ${b}-${a}.`,
        };
      }
      for (let i = a; i <= b; i++) set.add(i);
      continue;
    }

    if (/^\d+$/.test(p)) {
      const num = Number(p);
      if (num < 1 || num > maxPage) {
        return {
          valid: false,
          pages: [],
          summaryText: '',
          errorMessage: `Tài liệu có ${maxPage} trang. Thầy cô vui lòng chọn trang từ 1 đến ${maxPage}.`,
        };
      }
      set.add(num);
      continue;
    }

    return {
      valid: false,
      pages: [],
      summaryText: '',
      errorMessage:
        'Cách nhập số trang chưa đúng. Thầy cô hãy nhập 1 trang (ví dụ: 2), khoảng trang (ví dụ: 2-3) hoặc nhiều trang (ví dụ: 2, 3, 7-9).',
    };
  }

  const pages = Array.from(set).sort((a, b) => a - b);
  return {
    valid: pages.length > 0,
    pages,
    summaryText: formatSelectedPagesVi(pages),
    errorMessage:
      pages.length === 0
        ? `Tài liệu có ${maxPage} trang. Thầy cô vui lòng chọn trang từ 1 đến ${maxPage}.`
        : undefined,
  };
}

/**
 * Parses flexible page specifications:
 * - "all" or "" -> all pages [1..totalPages]
 * - "2" -> [2]
 * - "2-4" -> [2, 3, 4]
 * - "2, 3, 7-9" -> [2, 3, 7, 8, 9]
 */
export function parsePageSelectionSpec(spec: string, totalPages: number): number[] {
  const checked = validatePageSelectionSpec(spec, totalPages);
  if (checked.valid) return checked.pages;
  const cleaned = spec.trim().toLowerCase();
  if (!cleaned || cleaned === 'all' || cleaned === 'tất cả') {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const set = new Set<number>();
  const parts = cleaned.split(/[;,]+/);
  for (const part of parts) {
    const p = part.trim();
    if (!p) continue;
    const rangeMatch = p.match(/^(\d+)\s*[-–]\s*(\d+)$/);
    if (rangeMatch) {
      const a = Math.max(1, Math.min(totalPages, Number(rangeMatch[1])));
      const b = Math.max(1, Math.min(totalPages, Number(rangeMatch[2])));
      const [start, end] = a <= b ? [a, b] : [b, a];
      for (let i = start; i <= end; i++) set.add(i);
    } else if (/^\d+$/.test(p)) {
      const num = Number(p);
      if (num >= 1 && num <= totalPages) set.add(num);
    }
  }
  return Array.from(set).sort((a, b) => a - b);
}

/**
 * Extracts only the selected 1-based PDF pages into a clean PDF preserving 100% original content,
 * vector graphics, tables, images, and layout.
 */
export async function extractSelectedPagesPdf(
  sourcePdfBytes: Uint8Array,
  selectedPdfPages1Based: number[]
): Promise<Uint8Array> {
  const srcDoc = await PDFDocument.load(sourcePdfBytes, { ignoreEncryption: true });
  const total = srcDoc.getPageCount();
  const validIndices = selectedPdfPages1Based
    .map((n) => n - 1)
    .filter((idx) => idx >= 0 && idx < total);

  if (validIndices.length === 0) {
    throw new Error('Không có trang PDF hợp lệ nào được chọn.');
  }
  if (validIndices.length === total && validIndices.every((v, i) => v === i)) {
    return sourcePdfBytes;
  }

  const outDoc = await PDFDocument.create();
  const copied = await outDoc.copyPages(srcDoc, validIndices);
  for (const page of copied) {
    outDoc.addPage(page);
  }
  return outDoc.save();
}

function groupTextItemsIntoLines(
  rawItems: Array<{ str: string; transform: number[]; width?: number; height?: number }>,
  pageHeight: number
): TextLineBlock[] {
  const positioned = rawItems
    .filter((it) => typeof it.str === 'string' && it.str.trim().length > 0)
    .map((it) => {
      const x = Number(it.transform?.[4] || 0);
      const yBottom = Number(it.transform?.[5] || 0);
      const h = Math.max(8, Math.abs(Number(it.height || it.transform?.[3] || 11)));
      const w = Math.max(4, Number(it.width || it.str.length * h * 0.5));
      const yTop = Math.max(0, pageHeight - yBottom - h);
      return { str: it.str, x, y: yTop, width: w, height: h };
    })
    .sort((a, b) => (Math.abs(a.y - b.y) > 6 ? a.y - b.y : a.x - b.x));

  const lines: TextLineBlock[] = [];
  for (const item of positioned) {
    const last = lines[lines.length - 1];
    if (last && Math.abs(last.y - item.y) <= 7) {
      last.items.push({ str: item.str, x: item.x, y: item.y, width: item.width });
      last.items.sort((a, b) => a.x - b.x);
      last.text = last.items.map((i) => i.str).join(' ').replace(/\s+/g, ' ').trim();
      const minX = Math.min(...last.items.map((i) => i.x));
      const maxX = Math.max(...last.items.map((i) => i.x + i.width));
      last.x = minX;
      last.width = Math.max(10, maxX - minX);
      last.height = Math.max(last.height, item.height);
    } else {
      lines.push({
        text: item.str.trim(),
        x: item.x,
        y: item.y,
        width: item.width,
        height: item.height,
        items: [{ str: item.str, x: item.x, y: item.y, width: item.width }],
      });
    }
  }
  return lines;
}

function detectPrintedPageNumber(lines: TextLineBlock[], pageHeight: number): string | undefined {
  // Check top 9% or bottom 10% for standalone page numbers (e.g. "4", "Trang 4", "- 4 -")
  const candidates = lines.filter(
    (l) => l.y < pageHeight * 0.09 || l.y > pageHeight * 0.88
  );
  for (const c of candidates) {
    const m = c.text.match(/^(?:trang\s+|page\s+|[-–—]\s*)?(\d{1,3})(?:\s*[-–—])?$/i);
    if (m) return m[1];
  }
  return undefined;
}

interface QuestionCluster {
  code: string;
  startY: number;
  endY: number;
  lines: TextLineBlock[];
  fullText: string;
}

const QUESTION_START_RE =
  /^(?:C[âa]u\s*\d+[a-z]?|B[àa]i\s*(?:t[ậa]p\s*)?\d+[a-z]?|Ho[ạa]t\s*[đd][ộo]ng\s*\d+|Luy[ệe]n\s*t[ậa]p\s*\d+|V[ậa]n\s*d[ụu]ng\s*\d+|Task\s*\d+|Question\s*\d+|\d+\s*[\.\)])(?:\s*[:\.\-–)]|\s|$)/i;

const LESSON_HEADING_RE =
  /^(?:B[àa]i\s+\d+\s*[:\.\-–]|Ch[ủu]\s*[đd][ềe]\s*\d+|Ch[ươu][ơo]ng\s+\d+|PH[ẦA]N\s+[IVX\d]+|PHI[ẾE]U\s+B[ÀA]I\s+T[ẬA]P)/i;

function classifyQuestionCluster(
  cluster: QuestionCluster,
  pageWidth: number
): {
  type: InteractiveQuestionType;
  matchingMode?: 'line' | 'drag';
  needsReview: boolean;
  detectionNote: string;
  extractedOptions?: Array<{ id: string; label: string; text: string }>;
  extractedTfStatements?: Array<{ id: string; label: string; text: string }>;
  extractedMatching?: { itemsA: MatchingItem[]; itemsB: MatchingItem[] };
  extractedOrdering?: Array<{ id: string; text: string }>;
  extractedFillBlanks?: Array<{ id: string; prefix: string; suffix: string }>;
} {
  const text = cluster.fullText;
  const lower = text.toLowerCase();

  // 1. True / False table or Đ/S statements
  if (
    /(đúng\s*[/\-–]\s*sai|đúng\s+hay\s+sai|chọn\s+đ\s+hoặc\s+s|bảng\s+đúng|đánh\s+dấu.*đúng.*sai|true\s*[/\-]\s*false)/i.test(
      lower
    ) ||
    (/\bđúng\b/i.test(lower) && /\bsai\b/i.test(lower))
  ) {
    const stmts: Array<{ id: string; label: string; text: string }> = [];
    for (const ln of cluster.lines.slice(1)) {
      const m = ln.text.match(/^([a-dA-D]|[1-4])[\)\.]\s*(.+)$/);
      if (m) {
        stmts.push({
          id: `tf-${stmts.length + 1}`,
          label: `${m[1].toLowerCase()})`,
          text: m[2].replace(/\b(đúng|sai|đ|s)\b\s*$/gi, '').trim(),
        });
      }
    }
    if (stmts.length === 0) {
      stmts.push(
        { id: 'tf-1', label: 'a)', text: 'Ý a (giáo viên kiểm tra nội dung trên PDF)' },
        { id: 'tf-2', label: 'b)', text: 'Ý b (giáo viên kiểm tra nội dung trên PDF)' },
        { id: 'tf-3', label: 'c)', text: 'Ý c (giáo viên kiểm tra nội dung trên PDF)' },
        { id: 'tf-4', label: 'd)', text: 'Ý d (giáo viên kiểm tra nội dung trên PDF)' }
      );
    }
    return {
      type: 'tf',
      needsReview: stmts.length < 2,
      detectionNote: 'Ứng dụng nhận ra câu hỏi Đúng – Sai. Thầy cô hãy kiểm tra lại các ý và chọn đáp án đúng.',
      extractedTfStatements: stmts,
    };
  }

  // 2. Matching (Line-connecting default OR Drag-and-drop)
  if (
    /(ghép\s*đôi|ghép\s*nối|nối\s+cột|nối\s+mỗi|nối\s+các|vẽ\s+đường\s+nối|kéo\s+thả|cột\s*a.*cột\s*b|match\s+)/i.test(
      lower
    )
  ) {
    const isDrag = /(kéo\s+thả|drag\s*(and|&)\s*drop)/i.test(lower);
    const midX = pageWidth * 0.48;
    const itemsA: MatchingItem[] = [];
    const itemsB: MatchingItem[] = [];

    for (const ln of cluster.lines.slice(1)) {
      // Split left vs right column items on same horizontal row
      const leftStr = ln.items
        .filter((it) => it.x < midX)
        .map((it) => it.str)
        .join(' ')
        .trim();
      const rightStr = ln.items
        .filter((it) => it.x >= midX)
        .map((it) => it.str)
        .join(' ')
        .trim();
      if (leftStr && !/^cột\s*a/i.test(leftStr)) {
        itemsA.push({
          id: `det-a-${itemsA.length + 1}`,
          label: leftStr.replace(/^[\dA-Za-z]+[\.\)]\s*/, '').trim() || leftStr,
        });
      }
      if (rightStr && !/^cột\s*b/i.test(rightStr)) {
        itemsB.push({
          id: `det-b-${itemsB.length + 1}`,
          label: rightStr.replace(/^[\dA-Za-z]+[\.\)]\s*/, '').trim() || rightStr,
        });
      }
    }

    if (itemsA.length < 2 || itemsB.length < 2) {
      return {
        type: 'matching',
        matchingMode: isDrag ? 'drag' : 'line',
        needsReview: true,
        detectionNote:
          'Ứng dụng nhận ra câu hỏi Ghép đôi. Thầy cô hãy kiểm tra lại các mục ở Cột A, Cột B và chọn cặp nối đúng.',
        extractedMatching: {
          itemsA:
            itemsA.length >= 2
              ? itemsA
              : [
                  { id: 'det-a-1', label: 'Mục A1' },
                  { id: 'det-a-2', label: 'Mục A2' },
                  { id: 'det-a-3', label: 'Mục A3' },
                ],
          itemsB:
            itemsB.length >= 2
              ? itemsB
              : [
                  { id: 'det-b-1', label: 'Mục B1' },
                  { id: 'det-b-2', label: 'Mục B2' },
                  { id: 'det-b-3', label: 'Mục B3' },
                ],
        },
      };
    }

    return {
      type: 'matching',
      matchingMode: isDrag ? 'drag' : 'line',
      needsReview: true,
      detectionNote: `Ứng dụng tìm thấy ${itemsA.length} mục ở Cột A và ${itemsB.length} mục ở Cột B. Thầy cô hãy kiểm tra và chọn cặp nối đúng.`,
      extractedMatching: { itemsA, itemsB },
    };
  }

  // 3. Ordering
  if (/(sắp\s+xếp.*thứ\s+tự|sắp\s+xếp.*trình\s+tự|đúng\s+thứ\s+tự|put.*in\s+order)/i.test(lower)) {
    const items = cluster.lines
      .slice(1)
      .filter((l) => l.text.length > 3)
      .slice(0, 6)
      .map((l, idx) => ({ id: `ord-${idx + 1}`, text: l.text.replace(/^[\(\[]?[a-z\d]+[\)\]\.]\s*/i, '') }));
    return {
      type: 'ordering',
      needsReview: true,
      detectionNote: 'Ứng dụng nhận ra câu hỏi Sắp xếp thứ tự. Thầy cô hãy kiểm tra lại các bước và thứ tự đúng.',
      extractedOrdering:
        items.length >= 2
          ? items
          : [
              { id: 'ord-1', text: 'Bước 1 (kiểm tra trên PDF)' },
              { id: 'ord-2', text: 'Bước 2 (kiểm tra trên PDF)' },
              { id: 'ord-3', text: 'Bước 3 (kiểm tra trên PDF)' },
            ],
    };
  }

  // 4. Multiple-choice (Single vs Multi-select checkboxes)
  const hasCheckbox = /[☐□▢◯○]|\[ ?\]|\( ?\)|chọn\s+các\s+đáp\s+án|nhiều\s+đáp\s+án|tất\s+cả\s+các\s+phương\s+án/i.test(text);
  const optMatches = [...text.matchAll(/(?:^|\s)([A-D])[\.\)]\s*([^\nA-D]{1,120})/g)];
  if (optMatches.length >= 2 || /(khoanh\s+tròn|chọn\s+đáp\s+án|chọn\s+chữ\s+cái|đánh\s+dấu\s+x|tích\s+vào\s+ô)/i.test(lower)) {
    const opts =
      optMatches.length >= 2
        ? optMatches.slice(0, 4).map((m) => ({
            id: m[1].toUpperCase(),
            label: m[1].toUpperCase(),
            text: m[2].trim(),
          }))
        : [
            { id: 'A', label: 'A', text: 'Phương án A' },
            { id: 'B', label: 'B', text: 'Phương án B' },
            { id: 'C', label: 'C', text: 'Phương án C' },
            { id: 'D', label: 'D', text: 'Phương án D' },
          ];
    return {
      type: hasCheckbox ? 'mcq_multi' : 'mcq',
      needsReview: optMatches.length < 3,
      detectionNote: hasCheckbox
        ? 'Ứng dụng nhận ra câu hỏi chọn nhiều đáp án. Thầy cô hãy chọn các đáp án đúng.'
        : 'Ứng dụng nhận ra câu trắc nghiệm A, B, C, D. Thầy cô hãy chọn đáp án đúng.',
      extractedOptions: opts,
    };
  }

  // 5. Fill-in-the-blank
  if (/(điền\s+vào\s+chỗ|điền\s+từ|điền\s+số|điền\s+hệ\s+số|điền\s+khuyết|fill\s+in\s+the\s+blank|_{3,}|\.{5,}|…{2,})/i.test(lower)) {
    const slots: Array<{ id: string; prefix: string; suffix: string }> = [];
    const blankLines = cluster.lines.filter((l) => /_{3,}|\.{4,}|…{2,}/.test(l.text));
    blankLines.slice(0, 4).forEach((ln, idx) => {
      const parts = ln.text.split(/_{3,}|\.{4,}|…{2,}/);
      slots.push({
        id: `fb-${idx + 1}`,
        prefix: (parts[0] || '').trim().slice(-45),
        suffix: (parts[1] || '').trim().slice(0, 45),
      });
    });
    if (slots.length === 0) {
      slots.push({ id: 'fb-1', prefix: 'Chỗ trống 1:', suffix: '' });
    }
    return {
      type: 'fill_blank',
      needsReview: true,
      detectionNote: 'Ứng dụng nhận ra câu hỏi Điền vào chỗ trống. Thầy cô hãy nhập đáp án đúng cho từng ô.',
      extractedFillBlanks: slots,
    };
  }

  // 6. Diagram labeling
  if (/(chú\s+thích|điền\s+tên\s+bộ\s+phận|sơ\s+đồ\s+sau|bản\s+đồ|lược\s+đồ)/i.test(lower)) {
    return {
      type: 'diagram_label',
      needsReview: true,
      detectionNote: 'Ứng dụng nhận ra câu hỏi Chú thích hình hoặc sơ đồ. Thầy cô hãy kiểm tra lại vị trí trả lời.',
    };
  }

  // 7. Formula input
  if (/(viết\s+công\s+thức|biểu\s+thức|đạo\s+hàm|tích\s+phân|phương\s+trình\s+hóa\s+học)/i.test(lower)) {
    return {
      type: 'formula',
      needsReview: true,
      detectionNote: 'Ứng dụng nhận ra câu hỏi Nhập công thức (giáo viên chấm điểm sau khi học sinh nộp bài).',
    };
  }

  // 8. Drawing / Handwriting
  if (/(vẽ\s+hình|vẽ\s+đồ\s+thị|vẽ\s+biểu\s+đồ|phác\s+thảo|biểu\s+diễn\s+hình)/i.test(lower)) {
    return {
      type: 'drawing',
      needsReview: true,
      detectionNote: 'Ứng dụng nhận ra câu hỏi Vẽ hình hoặc viết tay. Thầy cô hãy kiểm tra lại khung vẽ.',
    };
  }

  // 9. Reading comprehension
  if (/(đọc\s+đoạn|đọc\s+tư\s+liệu|read\s+the\s+passage|read\s+the\s+text)/i.test(lower)) {
    return {
      type: 'reading',
      needsReview: true,
      detectionNote: 'Ứng dụng nhận ra bài Đọc hiểu. Thầy cô hãy kiểm tra lại các câu hỏi con và đáp án.',
    };
  }

  // 10. Numeric calculation
  if (/(tính\s+giá\s+trị|kết\s+quả\s+bằng|bao\s+nhiêu\s+%|nhập\s+số|đơn\s+vị\s*[:(])/i.test(lower)) {
    return {
      type: 'number',
      needsReview: true,
      detectionNote: 'Ứng dụng nhận ra câu hỏi Nhập số. Thầy cô hãy nhập đáp số đúng.',
    };
  }

  // 11. Practical attachment
  if (/(đính\s+kèm|nộp\s+tệp|chụp\s+ảnh\s+sản\s+phẩm|mã\s+nguồn|file\s+thực\s+hành)/i.test(lower)) {
    return {
      type: 'attachment',
      needsReview: true,
      detectionNote: 'Ứng dụng nhận ra bài thực hành cho phép học sinh gửi kèm ảnh hoặc tệp.',
    };
  }

  // 12. Default: Essay (tự luận / trả lời mở)
  return {
    type: 'essay',
    needsReview: true,
    detectionNote: 'Ứng dụng tạm đặt khung Tự luận để học sinh viết câu trả lời. Thầy cô có thể đổi loại câu hỏi nếu cần.',
  };
}

/**
 * Analyzes an active PDF using PDF.js text layer to detect lesson titles, printed vs PDF page numbers,
 * scanned pages, and interactive question regions with normalized PDF-page coordinates.
 * STRICT RULE: Never modifies original PDF text and never fabricates/guesses answer keys.
 */
export async function detectQuestionsFromPdfPages(
  pdfBytes: Uint8Array,
  options?: {
    sourcePdfPages?: number[];
    printedPageOffset?: number | null;
  }
): Promise<PdfDetectionResult> {
  const handle = await openPdfDocument(pdfBytes);
  const pageSummaries: PageInspectionSummary[] = [];
  const scannedPageNumbers: number[] = [];
  const detectedQuestions: InteractiveQuestion[] = [];
  const emptyAnswerKeys: TeacherAnswerKeyMap = {};
  const notes: string[] = [];
  let lessonTitle: string | undefined;

  try {
    const totalPages = handle.proxy.numPages;

    for (let i = 0; i < totalPages; i++) {
      const page = await handle.proxy.getPage(i + 1);
      const vp = page.getViewport({ scale: 1 });
      const textContent = await page.getTextContent();
      const rawItems = (textContent.items || []) as Array<{
        str?: string;
        transform?: number[];
        width?: number;
        height?: number;
      }>;
      const validItems = rawItems.filter(
        (it): it is { str: string; transform: number[]; width?: number; height?: number } =>
          typeof it.str === 'string' && Array.isArray(it.transform) && it.str.trim().length > 0
      );

      const sourcePdfNum = options?.sourcePdfPages?.[i] ?? i + 1;
      const isLikelyScan = validItems.length < 6;
      const lines = groupTextItemsIntoLines(validItems, vp.height);

      const detectedPrinted = detectPrintedPageNumber(lines, vp.height);
      const printedPageLabel =
        typeof options?.printedPageOffset === 'number'
          ? String(sourcePdfNum + options.printedPageOffset)
          : detectedPrinted;

      let detectedHeading: string | undefined;
      for (const ln of lines.slice(0, 6)) {
        if (LESSON_HEADING_RE.test(ln.text)) {
          detectedHeading = ln.text;
          if (!lessonTitle) lessonTitle = ln.text;
          break;
        }
      }

      pageSummaries.push({
        pdfPageNumber: sourcePdfNum,
        printedPageLabel,
        width: vp.width,
        height: vp.height,
        textItemCount: validItems.length,
        isLikelyScan,
        detectedHeading,
      });

      if (isLikelyScan) {
        scannedPageNumbers.push(sourcePdfNum);
        continue;
      }

      // Partition text lines into question clusters
      const clusters: QuestionCluster[] = [];
      for (const ln of lines) {
        // Skip header/footer page numbers
        if (ln.y < vp.height * 0.05 || ln.y > vp.height * 0.94) continue;
        const qMatch = ln.text.match(QUESTION_START_RE);
        if (qMatch && !LESSON_HEADING_RE.test(ln.text)) {
          clusters.push({
            code: qMatch[0].replace(/[:\.\-–\)]+$/, '').trim(),
            startY: ln.y,
            endY: ln.y + ln.height,
            lines: [ln],
            fullText: ln.text,
          });
        } else if (clusters.length > 0) {
          const cur = clusters[clusters.length - 1];
          cur.lines.push(ln);
          cur.endY = Math.max(cur.endY, ln.y + ln.height);
          cur.fullText = `${cur.fullText}\n${ln.text}`;
        }
      }

      // Build non-overlapping answer regions positioned neatly right below each question stem
      clusters.forEach((cl, idx) => {
        const cls = classifyQuestionCluster(cl, vp.width);
        const meta = QUESTION_TYPE_META[cls.type];
        const nextClusterStartY = clusters[idx + 1]?.startY ?? vp.height - 36;

        // Place answer box neatly below the question prompt (never covering the prompt line!)
        const stemLineBottom = cl.lines[0].y + cl.lines[0].height + 8;
        const availableH = Math.max(76, nextClusterStartY - stemLineBottom - 10);
        const boxW = Math.min(Math.round(vp.width - 72), Math.max(meta.defaultWidth, 420));
        const boxH = Math.min(Math.max(meta.defaultHeight, 92), Math.max(92, Math.round(availableH)));
        const boxX = 36;
        const boxY = Math.min(Math.round(vp.height - boxH - 24), Math.round(stemLineBottom));

        const qId = `det-p${i + 1}-q${idx + 1}-${Math.random().toString(36).slice(2, 5)}`;
        const firstLineClean = cl.lines[0].text
          .replace(QUESTION_START_RE, '')
          .replace(/^[:\.\-–\s]+/, '')
          .trim();

        const question: InteractiveQuestion = {
          id: qId,
          code: cl.code || `Câu ${detectedQuestions.length + 1}`,
          title: firstLineClean.slice(0, 72) || meta.label,
          prompt: firstLineClean || `Hoàn thành ${cl.code} theo đề bài trên trang PDF.`,
          type: cls.type,
          maxPoints: 2,
          required: true,
          needsReview: cls.needsReview,
          detectionNote: cls.detectionNote,
          teacherApproved: false,
          sourcePdfPageNumber: sourcePdfNum,
          printedPageLabel,
          region: {
            pageIndex: i,
            x: boxX,
            y: Math.max(24, boxY),
            width: boxW,
            height: boxH,
            nx: Number((boxX / vp.width).toFixed(4)),
            ny: Number((Math.max(24, boxY) / vp.height).toFixed(4)),
            nw: Number((boxW / vp.width).toFixed(4)),
            nh: Number((boxH / vp.height).toFixed(4)),
          },
        };

        if (cls.type === 'mcq' || cls.type === 'mcq_multi') {
          question.mcqOptions = cls.extractedOptions;
        } else if (cls.type === 'tf') {
          question.tfStatements = cls.extractedTfStatements;
        } else if (cls.type === 'matching') {
          question.matching = {
            mode: cls.matchingMode || 'line',
            allowManyToOne: false,
            shuffleB: false,
            practiceFeedback: false,
            columnATitle: 'Cột A',
            columnBTitle: 'Cột B',
            itemsA: cls.extractedMatching?.itemsA || [],
            itemsB: cls.extractedMatching?.itemsB || [],
          };
        } else if (cls.type === 'ordering') {
          question.orderingItems = cls.extractedOrdering;
        } else if (cls.type === 'fill_blank') {
          question.fillBlanks = cls.extractedFillBlanks;
        } else if (cls.type === 'essay') {
          question.essayPlaceholder = 'Nhập bài làm tự luận tại đây...';
        } else if (cls.type === 'short') {
          question.shortPlaceholder = 'Nhập câu trả lời ngắn...';
        } else if (cls.type === 'number') {
          question.numberPlaceholder = 'Nhập kết quả số...';
        } else if (cls.type === 'formula') {
          question.formulaPlaceholder = 'Nhập công thức khoa học...';
        } else if (cls.type === 'diagram_label') {
          question.diagramPins = [
            { id: 'pin-1', code: '(1)', rx: 0.25, ry: 0.35, hint: 'Chú thích vị trí (1)' },
            { id: 'pin-2', code: '(2)', rx: 0.72, ry: 0.5, hint: 'Chú thích vị trí (2)' },
          ];
        } else if (cls.type === 'reading') {
          question.readingPassage = cl.fullText.slice(0, 420);
          question.readingSubQuestions = [
            { id: 'rs-1', prompt: 'Câu hỏi con 1 (giáo viên rà soát):', kind: 'short' },
          ];
        } else if (cls.type === 'attachment') {
          question.attachmentAcceptHint = 'Hỗ trợ ảnh, PDF, mã nguồn .py/.sql/.txt (tối đa 8 MB/tệp)';
        }

        detectedQuestions.push(question);
        // Empty answer key placeholder — NEVER guesses correct answers automatically!
        emptyAnswerKeys[qId] = { questionId: qId };
      });
    }

    if (scannedPageNumbers.length > 0) {
      notes.push(
        scannedPageNumbers.length === totalPages
          ? 'Ứng dụng chưa tìm được tất cả chỗ trả lời vì tài liệu này là trang hình ảnh. Thầy cô có thể bổ sung trực tiếp bằng nút Thêm câu hỏi.'
          : `Một số trang là hình ảnh (Trang ${scannedPageNumbers.join(', ')}) nên ứng dụng chưa tìm được hết chỗ trả lời. Thầy cô có thể bổ sung bằng nút Thêm câu hỏi.`
      );
    }
    if (detectedQuestions.length === 0) {
      notes.push(
        'Ứng dụng chưa tìm được chỗ trả lời trong các trang này. Thầy cô có thể bổ sung bằng nút Thêm câu hỏi rồi nhấn trực tiếp lên trang PDF.'
      );
    } else {
      notes.push(
        `Đã tìm thấy ${detectedQuestions.length} câu hỏi. Thầy cô hãy kiểm tra trước khi giao bài.`
      );
    }

    return {
      lessonTitle,
      pageSummaries,
      scannedPageNumbers,
      questions: detectedQuestions,
      emptyAnswerKeys,
      notes,
    };
  } finally {
    await handle.destroy().catch(() => {});
  }
}

/**
 * Inspects page count & quick text/printed-page metadata of an uploaded PDF before page extraction.
 */
export async function inspectPdfForPageSelection(pdfBytes: Uint8Array): Promise<{
  totalPages: number;
  pages: Array<{
    pdfPageNumber: number;
    printedPageLabel?: string;
    heading?: string;
    isLikelyScan: boolean;
  }>;
}> {
  const handle = await openPdfDocument(pdfBytes);
  try {
    const totalPages = handle.proxy.numPages;
    const pages: Array<{
      pdfPageNumber: number;
      printedPageLabel?: string;
      heading?: string;
      isLikelyScan: boolean;
    }> = [];
    // Inspect up to 80 pages quickly (text layer extraction is fast and local)
    const limit = Math.min(totalPages, 80);
    for (let i = 1; i <= limit; i++) {
      const p = await handle.proxy.getPage(i);
      const vp = p.getViewport({ scale: 1 });
      const tc = await p.getTextContent();
      const validItems = ((tc.items || []) as Array<{
        str?: string;
        transform?: number[];
        width?: number;
        height?: number;
      }>).filter(
        (it): it is { str: string; transform: number[]; width?: number; height?: number } =>
          typeof it.str === 'string' && Array.isArray(it.transform) && it.str.trim().length > 0
      );
      const lines = groupTextItemsIntoLines(validItems, vp.height);
      const printedPageLabel = detectPrintedPageNumber(lines, vp.height);
      const heading = lines.slice(0, 5).find((l) => LESSON_HEADING_RE.test(l.text))?.text;
      pages.push({
        pdfPageNumber: i,
        printedPageLabel,
        heading,
        isLikelyScan: validItems.length < 6,
      });
    }
    return { totalPages, pages };
  } finally {
    await handle.destroy().catch(() => {});
  }
}
