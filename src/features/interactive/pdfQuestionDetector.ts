import { PDFDocument } from 'pdf-lib';
import { openPdfDocument } from '../../engines/pdf/pdfEngine';
import {
  QUESTION_TYPE_META,
  type FillBlankSlot,
  type InteractiveQuestion,
  type InteractiveQuestionType,
  type MatchingItem,
  type PdfPointAnchor,
  type PdfRegion,
  type TeacherAnswerKeyMap,
  type TfStatement,
} from '../../types/interactive';

export interface TextLineItem {
  str: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TextLineBlock {
  text: string;
  x: number;
  y: number; // top-down PDF points
  width: number;
  height: number;
  fontSize: number;
  isCentered: boolean;
  isAllCaps: boolean;
  items: TextLineItem[];
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
  /** Total main questions detected (classified + unclassified) */
  totalDetectedCount: number;
  /** Questions with a concrete interactive type ready for solving */
  interactiveReadyCount: number;
  /** Questions detected structurally but lacking enough evidence to classify automatically */
  unclassifiedCount: number;
}

export interface RedetectComparisonResult {
  mergedQuestions: InteractiveQuestion[];
  mergedKeys: TeacherAnswerKeyMap;
  preservedManualCount: number;
  replacedAutoCount: number;
  newCount: number;
  skippedDuplicateCount: number;
  lessonTitle?: string;
  pageSummaries: PageInspectionSummary[];
  notes: string[];
  totalDetectedCount: number;
  interactiveReadyCount: number;
  unclassifiedCount: number;
}

export interface PageSelectionValidationResult {
  valid: boolean;
  pages: number[];
  summaryText: string;
  errorMessage?: string;
}

export interface ExtractedPageInput {
  pageIndex: number;
  sourcePdfPageNumber: number;
  printedPageLabel?: string;
  width: number;
  height: number;
  textItemCount: number;
  lines: TextLineBlock[];
}

/**
 * Formats 1-based page numbers into warm, readable Vietnamese for teachers.
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
 * Extracts only the selected 1-based PDF pages into a clean PDF preserving 100% original content.
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

function isLineAllCaps(text: string): boolean {
  const letters = text.replace(/[^A-Za-zÀ-ỹ]/g, '');
  if (letters.length < 3) return false;
  return letters === letters.toUpperCase();
}

function clampNorm(v: number, min = 0.01, max = 0.99): number {
  return Number(Math.max(min, Math.min(max, v)).toFixed(4));
}

export function groupTextItemsIntoLines(
  rawItems: Array<{ str: string; transform: number[]; width?: number; height?: number }>,
  pageHeight: number,
  pageWidth = 595
): TextLineBlock[] {
  const positioned = rawItems
    .filter((it) => typeof it.str === 'string' && it.str.trim().length > 0)
    .map((it) => {
      const x = Number(it.transform?.[4] || 0);
      const yBottom = Number(it.transform?.[5] || 0);
      const scaleY = Math.hypot(Number(it.transform?.[2] || 0), Number(it.transform?.[3] || 0));
      const h = Math.max(8, Math.abs(Number(it.height || scaleY || 11)));
      const w = Math.max(4, Number(it.width || it.str.length * h * 0.48));
      const yTop = Math.max(0, pageHeight - yBottom - h);
      return { str: it.str, x, y: yTop, width: w, height: h };
    })
    .sort((a, b) => (Math.abs(a.y - b.y) > 5.5 ? a.y - b.y : a.x - b.x));

  const lines: TextLineBlock[] = [];
  for (const item of positioned) {
    const last = lines[lines.length - 1];
    const yTol = Math.min(8, Math.max(5, Math.min(last?.height || 11, item.height) * 0.55));
    if (last && Math.abs(last.y - item.y) <= yTol) {
      last.items.push(item);
      last.items.sort((a, b) => a.x - b.x);
      last.text = last.items.map((i) => i.str).join(' ').replace(/\s+/g, ' ').trim();
      const minX = Math.min(...last.items.map((i) => i.x));
      const maxX = Math.max(...last.items.map((i) => i.x + i.width));
      last.x = minX;
      last.width = Math.max(10, maxX - minX);
      last.height = Math.max(last.height, item.height);
      last.fontSize = Math.max(last.fontSize, item.height);
      const centerDist = Math.abs(minX + last.width / 2 - pageWidth / 2);
      last.isCentered = centerDist < pageWidth * 0.14 && last.width < pageWidth * 0.78;
      last.isAllCaps = isLineAllCaps(last.text);
    } else {
      const text = item.str.trim();
      const centerDist = Math.abs(item.x + item.width / 2 - pageWidth / 2);
      lines.push({
        text,
        x: item.x,
        y: item.y,
        width: item.width,
        height: item.height,
        fontSize: item.height,
        isCentered: centerDist < pageWidth * 0.14 && item.width < pageWidth * 0.78,
        isAllCaps: isLineAllCaps(text),
        items: [item],
      });
    }
  }
  return lines;
}

function detectPrintedPageNumber(lines: TextLineBlock[], pageHeight: number): string | undefined {
  const candidates = lines.filter((l) => l.y < pageHeight * 0.09 || l.y > pageHeight * 0.89);
  for (const c of candidates) {
    const m = c.text.match(/^(?:trang\s+|page\s+|[-–—]\s*)?(\d{1,3})(?:\s*[-–—])?$/i);
    if (m) return m[1];
  }
  return undefined;
}

// ============================================================================
// STRUCTURAL ELEMENT CLASSIFICATION (HEADINGS vs MAIN QUESTIONS vs SUB-ITEMS)
// ============================================================================

const STRONG_HEADING_RE =
  /^(?:Ch[ủu]\s*[đd][ềe]\s*[A-Z\d]+|Ch[ươu][ơo]ng\s+[IVX\d]+|PH[ẦA]N\s+[IVX\dA-Z]+|PHI[ẾE]U\s+B[ÀA]I\s+T[ẬA]P|V[ỞO]\s+B[ÀA]I\s+T[ẬA]P|TU[ẦA]N\s+\d+|CHUY[ÊE]N\s*[ĐD][ỀE]\s*\d+)/i;

const SECTION_HEADER_RE =
  /^(?:[IVX]+\.\s+[A-ZÀ-Ỹ\s]{3,}|[A-D]\.\s+(?:KH[ỞO]I\s*[ĐD][ỘO]NG|KH[ÁA]M\s+PH[ÁA]|LUY[ỆE]N\s+T[ẬA]P|V[ẬA]N\s+D[ỤU]NG|TR[ẮA]C\s+NGHI[ỆE]M|T[ỰƯ]\s+LU[ẬA]N|B[ÀA]I\s+T[ẬA]P)|H[ƯỚU][ỚO]NG\s+D[ẪA]N|Y[ÊE]U\s+C[ẦA]U\s+C[ẦA]N\s*[ĐD][ẠA]T)/i;

const EXPLICIT_MAIN_QUESTION_RE =
  /^(C[âa]u\s*\d+[a-z]?|B[àa]i\s*t[ậa]p\s*\d+[a-z]?|Ho[ạa]t\s*[đd][ộo]ng\s*\d+|Luy[ệe]n\s*t[ậa]p\s*\d+|V[ậa]n\s*d[ụu]ng\s*\d+|Task\s*\d+|Question\s*\d+|Exercise\s*\d+)(?:\s*[:\.\-–)]|\s|$)/i;

const BAI_NUMBER_RE = /^(B[àa]i\s+\d+[a-z]?)(?:\s*[:\.\-–)]|\s|$)/i;

const EXERCISE_VERB_RE =
  /\b(t[íi]nh|gi[ảa]i|t[ìi]m|ch[ứu]ng\s+minh|n[ốo]i|ch[ọo]n|[đd]i[ềe]n|khoanh|vi[ếe]t|v[ẽe]|h[ãa]y|em\s+h[ãa]y|[đd][áa]nh\s+d[ấa]u|s[ắa]p\s+x[ếe]p|x[áa]c\s+[đd][ịi]nh)\b/i;

const SUB_ITEM_MARKER_RE = /^(?:(\d{1,2})\s*[\)\.]|([a-hA-H])\s*[\)\.]|[•\-–—▪◦☐□▢◯○])/;

const BLANK_WRITING_LINE_RE = /^[\.\s_…\-–]{10,}$/;

function computeMedianFontSize(lines: TextLineBlock[]): number {
  if (lines.length === 0) return 11;
  const sizes = lines.map((l) => l.fontSize).sort((a, b) => a - b);
  return sizes[Math.floor(sizes.length / 2)] || 11;
}

function isBaiLineALessonHeading(
  ln: TextLineBlock,
  nextLine: TextLineBlock | undefined,
  pageHasExplicitCau: boolean,
  medianFont: number,
  pageHeight: number
): boolean {
  const trimmed = ln.text.trim();
  const match = trimmed.match(BAI_NUMBER_RE);
  if (!match) return false;

  const rest = trimmed
    .slice(match[0].length)
    .replace(/^[:\.\-–\s]+/, '')
    .trim();

  // 1. Standalone "Bài 1" / "BÀI 1" with no exercise body -> ALWAYS a lesson heading!
  if (rest.length === 0) return true;

  // 2. If the page also uses "Câu 1", "Câu 2", ... then "Bài N" is the lesson title
  if (pageHasExplicitCau) return true;

  // 3. Large font or centered title or ALL CAPS title -> lesson heading
  if (ln.fontSize >= medianFont * 1.18 || ln.isCentered || ln.isAllCaps) return true;

  // 4. Appears in upper 22% of page and followed by an ALL-CAPS/large subtitle, or has no exercise verb
  if (ln.y < pageHeight * 0.25 && (!EXERCISE_VERB_RE.test(rest) || (nextLine && nextLine.isAllCaps))) {
    return true;
  }

  // 5. Short title without exercise action verbs (e.g. "Bài 1. Thông tin và quyết định")
  if (rest.length <= 75 && !EXERCISE_VERB_RE.test(rest) && !/\?/.test(rest)) {
    return true;
  }

  return false;
}

interface QuestionCluster {
  code: string;
  normalizedCode: string;
  startY: number;
  endY: number;
  lines: TextLineBlock[];
  fullText: string;
  subItems: string[];
}

function normalizeQuestionCode(code: string): string {
  return code
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[:\.\-–\)]+$/g, '');
}

interface ClassificationOutput {
  type: InteractiveQuestionType;
  classificationStatus: 'classified' | 'unclassified';
  overlayMode: 'anchored' | 'box' | 'drawer_button';
  matchingMode?: 'line' | 'drag';
  needsReview: boolean;
  detectionNote: string;
  extractedOptions?: Array<{ id: string; label: string; text: string; anchor?: PdfPointAnchor }>;
  extractedTfStatements?: TfStatement[];
  extractedMatching?: { itemsA: MatchingItem[]; itemsB: MatchingItem[] };
  extractedOrdering?: Array<{ id: string; text: string }>;
  extractedFillBlanks?: FillBlankSlot[];
  subItems?: string[];
  contentBottomY: number;
}

function findStemEndIndex(lines: TextLineBlock[]): number {
  if (lines.length <= 1) return 0;
  let endIdx = 0;
  for (let i = 1; i < lines.length; i++) {
    const t = lines[i].text.trim();
    // Stop stem before options, sub-items, checkboxes, tables, or blank lines
    if (
      /^(?:[A-D][\.\)]|\d+[\)\.]|[a-d][\)\.]|[☐□▢◯○]|\[ ?\]|\( ?\)|c[ộo]t\s*[ab12]|st+t\b|n[ộo]i\s+dung\b|ph[áa]t\s+bi[ểe]u\b)/i.test(
        t
      ) ||
      BLANK_WRITING_LINE_RE.test(t) ||
      (/(?:^|[\s/|(\[])(?:đúng|đ)(?=$|[\s/|)\]])/i.test(t) &&
        /(?:^|[\s/|(\[])(?:sai|s)(?=$|[\s/|)\]])/i.test(t) &&
        t.length < 48)
    ) {
      break;
    }
    // Check if this line splits into 2 wide columns (matching/table body)
    if (lines[i].items.length >= 2) {
      let maxGap = 0;
      for (let k = 1; k < lines[i].items.length; k++) {
        const prev = lines[i].items[k - 1];
        const gap = lines[i].items[k].x - (prev.x + prev.width);
        if (gap > maxGap) maxGap = gap;
      }
      if (maxGap > 70) break;
    }
    // Only include wrapped stem lines right below previous stem line
    if (lines[i].y - (lines[i - 1].y + lines[i - 1].height) > 22) break;
    endIdx = i;
    if (endIdx >= 3) break;
  }
  return endIdx;
}

function extractSubItemsFromCluster(lines: TextLineBlock[]): string[] {
  const subs: string[] = [];
  for (const ln of lines.slice(1)) {
    const m = ln.text.match(/^(\d{1,2}\)|[a-d]\))\s*(.+)/i);
    if (m) {
      subs.push(`${m[1]} ${m[2].trim()}`.slice(0, 120));
    }
  }
  return subs;
}

function findBestColumnSplitX(bodyLines: TextLineBlock[], pageWidth: number): number {
  const gaps: Array<{ mid: number; width: number }> = [];
  for (const ln of bodyLines) {
    if (ln.items.length < 2) continue;
    for (let i = 1; i < ln.items.length; i++) {
      const prev = ln.items[i - 1];
      const cur = ln.items[i];
      const prevEnd = prev.x + prev.width;
      const gap = cur.x - prevEnd;
      const mid = (prevEnd + cur.x) / 2;
      if (gap >= 24 && mid >= pageWidth * 0.28 && mid <= pageWidth * 0.72) {
        gaps.push({ mid, width: gap });
      }
    }
  }
  if (gaps.length === 0) return pageWidth * 0.48;
  gaps.sort((a, b) => b.width - a.width);
  const top = gaps.slice(0, Math.min(5, gaps.length));
  return top.reduce((s, g) => s + g.mid, 0) / top.length;
}

function extractMatchingColumns(
  bodyLines: TextLineBlock[],
  pageWidth: number,
  pageHeight: number
): { itemsA: MatchingItem[]; itemsB: MatchingItem[]; hasFullAnchors: boolean } {
  const splitX = findBestColumnSplitX(bodyLines, pageWidth);
  const leftRows: Array<{ text: string; minX: number; maxX: number; topY: number; bottomY: number }> = [];
  const rightRows: Array<{ text: string; minX: number; maxX: number; topY: number; bottomY: number }> = [];

  for (const ln of bodyLines) {
    if (BLANK_WRITING_LINE_RE.test(ln.text)) continue;
    const leftItems = ln.items.filter((it) => it.x + it.width * 0.35 < splitX);
    const rightItems = ln.items.filter((it) => it.x + it.width * 0.35 >= splitX);

    const leftStr = leftItems.map((it) => it.str).join(' ').replace(/\s+/g, ' ').trim();
    const rightStr = rightItems.map((it) => it.str).join(' ').replace(/\s+/g, ' ').trim();

    if (leftStr && !/^(?:c[ộo]t\s*(?:a|1|tr[áa]i|b[êe]n\s*tr[áa]i)|th[ôo]ng\s+tin\s*$|t[ìi]nh\s+hu[ốo]ng\s*$)/i.test(leftStr)) {
      const minX = Math.min(...leftItems.map((i) => i.x));
      const maxX = Math.max(...leftItems.map((i) => i.x + i.width));
      const prev = leftRows[leftRows.length - 1];
      const startsNewItem = SUB_ITEM_MARKER_RE.test(leftStr);
      if (prev && !startsNewItem && ln.y - prev.bottomY <= 16) {
        prev.text = `${prev.text} ${leftStr}`.trim();
        prev.maxX = Math.max(prev.maxX, maxX);
        prev.bottomY = Math.max(prev.bottomY, ln.y + ln.height);
      } else {
        leftRows.push({ text: leftStr, minX, maxX, topY: ln.y, bottomY: ln.y + ln.height });
      }
    }

    if (rightStr && !/^(?:c[ộo]t\s*(?:b|2|ph[ảa]i|b[êe]n\s*ph[ảa]i)|quy[ếe]t\s+[đd][ịi]nh\s*$|k[ếe]t\s+qu[ảa]\s*$)/i.test(rightStr)) {
      const minX = Math.min(...rightItems.map((i) => i.x));
      const maxX = Math.max(...rightItems.map((i) => i.x + i.width));
      const prev = rightRows[rightRows.length - 1];
      const startsNewItem = SUB_ITEM_MARKER_RE.test(rightStr);
      if (prev && !startsNewItem && ln.y - prev.bottomY <= 16) {
        prev.text = `${prev.text} ${rightStr}`.trim();
        prev.minX = Math.min(prev.minX, minX);
        prev.maxX = Math.max(prev.maxX, maxX);
        prev.bottomY = Math.max(prev.bottomY, ln.y + ln.height);
      } else {
        rightRows.push({ text: rightStr, minX, maxX, topY: ln.y, bottomY: ln.y + ln.height });
      }
    }
  }

  // Align anchor X uniformly on the inner gap edges so connector lines are crisp and never cover text
  const leftPortX =
    leftRows.length > 0
      ? Math.min(splitX - 6, Math.max(...leftRows.map((r) => r.maxX)) + 8)
      : splitX - 24;
  const rightPortX =
    rightRows.length > 0
      ? Math.max(splitX + 6, Math.min(...rightRows.map((r) => r.minX)) - 8)
      : splitX + 24;

  const itemsA: MatchingItem[] = leftRows.map((r, idx) => ({
    id: `det-a-${idx + 1}`,
    label: r.text.replace(/^[\dA-Za-z]+[\.\)]\s*/, '').trim() || r.text,
    anchor: {
      nx: clampNorm(leftPortX / pageWidth, 0.15, 0.56),
      ny: clampNorm(((r.topY + r.bottomY) / 2) / pageHeight),
      nw: clampNorm((r.maxX - r.minX) / pageWidth, 0.05, 0.45),
      nh: clampNorm((r.bottomY - r.topY) / pageHeight, 0.02, 0.16),
    },
  }));

  const itemsB: MatchingItem[] = rightRows.map((r, idx) => ({
    id: `det-b-${idx + 1}`,
    label: r.text.replace(/^[\dA-Za-z]+[\.\)]\s*/, '').trim() || r.text,
    anchor: {
      nx: clampNorm(rightPortX / pageWidth, 0.44, 0.88),
      ny: clampNorm(((r.topY + r.bottomY) / 2) / pageHeight),
      nw: clampNorm((r.maxX - r.minX) / pageWidth, 0.05, 0.45),
      nh: clampNorm((r.bottomY - r.topY) / pageHeight, 0.02, 0.16),
    },
  }));

  // If left items exist (>= 2) but right column is illustrations/images (no text in right column),
  // keep it as anchored matching with editable right-side image ports!
  if (itemsA.length >= 2 && itemsB.length < 2) {
    const synthesizedB: MatchingItem[] = itemsA.map((a, idx) => ({
      id: `det-b-${idx + 1}`,
      label: `Hình / Mục ${String.fromCharCode(65 + idx)}`,
      anchor: {
        nx: clampNorm(Math.max(0.62, (splitX + 24) / pageWidth), 0.55, 0.82),
        ny: a.anchor!.ny,
      },
    }));
    return { itemsA, itemsB: synthesizedB, hasFullAnchors: true };
  }

  return {
    itemsA,
    itemsB,
    hasFullAnchors: itemsA.length >= 2 && itemsB.length >= 2,
  };
}

function extractMcqOptionsWithAnchors(
  cluster: QuestionCluster,
  stemEndIdx: number,
  pageWidth: number,
  pageHeight: number
): Array<{ id: string; label: string; text: string; anchor?: PdfPointAnchor }> {
  const options: Array<{ id: string; label: string; text: string; anchor?: PdfPointAnchor }> = [];
  const bodyLines = cluster.lines.slice(stemEndIdx + 1);
  const scanLines = bodyLines.length > 0 ? bodyLines : cluster.lines;

  // Pattern A: Explicit A. / B. / C. / D. or A) / B) / C) / D) (supports 1 or 2 options on same line)
  for (const ln of scanLines) {
    const matches = [...ln.text.matchAll(/(?:^|\s)([☐□▢◯○]\s*)?([A-D])[\.\)]\s*([^\n]+?)(?=(?:\s+[☐□▢◯○]?\s*[A-D][\.\)]\s)|$)/g)];
    if (matches.length > 0) {
      for (const m of matches) {
        const letter = m[2].toUpperCase();
        const optText = m[3].replace(/^[☐□▢◯○]\s*/, '').trim();
        // Find exact item X in line items
        const tokenItem = ln.items.find((it) =>
          new RegExp(`^(?:[☐□▢◯○]\\s*)?${letter}[\\.\\)]`).test(it.str.trim())
        );
        const anchorX = tokenItem ? Math.max(14, tokenItem.x - 16) : Math.max(14, ln.x - 16);
        if (!options.some((o) => o.id === letter)) {
          options.push({
            id: letter,
            label: letter,
            text: optText || `Phương án ${letter}`,
            anchor: {
              nx: clampNorm(anchorX / pageWidth, 0.02, 0.94),
              ny: clampNorm((ln.y + ln.height / 2) / pageHeight),
            },
          });
        }
      }
    }
  }

  if (options.length >= 2) {
    return options.slice(0, 6);
  }

  // Pattern B: Checkbox symbols (☐, □, ▢, ◯, ○, [ ], ( )) before option text
  const cbOptions: Array<{ id: string; label: string; text: string; anchor?: PdfPointAnchor }> = [];
  for (const ln of bodyLines) {
    const m = ln.text.match(/^([☐□▢◯○]|\[ ?\]|\( ?\))\s*(.+)$/);
    if (m) {
      const idx = cbOptions.length;
      const letter = String.fromCharCode(65 + idx);
      const firstItem = ln.items[0];
      const anchorX = firstItem ? firstItem.x + Math.min(8, firstItem.width / 2) : ln.x + 6;
      cbOptions.push({
        id: letter,
        label: letter,
        text: m[2].trim(),
        anchor: {
          nx: clampNorm(anchorX / pageWidth, 0.02, 0.94),
          ny: clampNorm((ln.y + ln.height / 2) / pageHeight),
        },
      });
    }
  }
  if (cbOptions.length >= 2) {
    return cbOptions.slice(0, 6);
  }

  // Pattern C: Prompt explicitly mentions checkbox/empty box ("ô trống trước câu trả lời đúng")
  // and PDF drew vector boxes (not text glyphs) right next to each option line!
  if (/(ô\s+trống|đánh\s+dấu|tích\s+vào|khoanh\s+vào)/i.test(cluster.fullText) && bodyLines.length >= 2) {
    const cleanRows = bodyLines.filter((l) => l.text.trim().length >= 2 && !BLANK_WRITING_LINE_RE.test(l.text));
    if (cleanRows.length >= 2 && cleanRows.length <= 6) {
      return cleanRows.map((ln, idx) => {
        const letter = String.fromCharCode(65 + idx);
        // Place clickable checkbox directly in front of the option text (where PDF's drawn square sits)
        const anchorX = Math.max(16, ln.x - 18);
        return {
          id: letter,
          label: letter,
          text: ln.text.replace(/^[•\-–—]\s*/, '').trim(),
          anchor: {
            nx: clampNorm(anchorX / pageWidth, 0.02, 0.94),
            ny: clampNorm((ln.y + ln.height / 2) / pageHeight),
          },
        };
      });
    }
  }

  return [];
}

function classifyQuestionCluster(
  cluster: QuestionCluster,
  pageWidth: number,
  pageHeight: number,
  nextClusterStartY: number
): ClassificationOutput {
  const text = cluster.fullText;
  const lower = text.toLowerCase();
  const stemEndIdx = findStemEndIndex(cluster.lines);
  const bodyLines = cluster.lines.slice(stemEndIdx + 1);
  const nonBlankLines = cluster.lines.filter((l) => !BLANK_WRITING_LINE_RE.test(l.text));
  const contentBottomY =
    nonBlankLines.length > 0
      ? Math.max(...nonBlankLines.map((l) => l.y + l.height))
      : cluster.endY;
  const subItems = extractSubItemsFromCluster(cluster.lines);

  // --------------------------------------------------------------------------
  // 1. MATCHING (HIGH PRIORITY — catches "Hãy nối", "Em hãy nối", "nối ... với ...", etc.)
  // --------------------------------------------------------------------------
  const isMatchingPrompt =
    /(h[ãa]y\s+n[ốo]i|em\s+h[ãa]y\s+n[ốo]i|n[ốo]i\s+.{0,48}\s+v[ớo]i|n[ốo]i\s+(?:c[ộo]t|m[ỗo]i|c[áa]c|th[ôo]ng\s+tin|h[ìi]nh|[ýy]|t[ừu]|c[ặa]p|[ôo]|c[âa]u)|gh[ée]p\s*[đd][ôo]i|gh[ée]p\s*n[ốo]i|v[ẽe]\s*[đd][ươu][ờo]ng\s*n[ốo]i|k[ée]o\s*th[ảa]|c[ộo]t\s*(?:a|1|tr[áa]i|b[êe]n\s*tr[áa]i).{0,32}c[ộo]t\s*(?:b|2|ph[ảa]i|b[êe]n\s*ph[ảa]i)|match\s+)/i.test(
      lower
    );

  if (isMatchingPrompt) {
    const isDrag = /(k[ée]o\s+th[ảa]|drag\s*(?:and|&)\s*drop)/i.test(lower);
    const { itemsA, itemsB, hasFullAnchors } = extractMatchingColumns(
      bodyLines.length > 0 ? bodyLines : cluster.lines.slice(1),
      pageWidth,
      pageHeight
    );

    if (hasFullAnchors && !isDrag) {
      return {
        type: 'matching',
        classificationStatus: 'classified',
        overlayMode: 'anchored',
        matchingMode: 'line',
        needsReview: true,
        detectionNote: `Nhận diện đúng dạng Ghép đôi (${itemsA.length} mục bên trái · ${itemsB.length} mục bên phải). Học sinh vẽ đường nối trực tiếp trên trang PDF; thầy cô hãy chọn cặp đáp án đúng.`,
        extractedMatching: { itemsA, itemsB },
        subItems: subItems.length > 0 ? subItems : undefined,
        contentBottomY,
      };
    }

    return {
      type: 'matching',
      classificationStatus: 'classified',
      overlayMode: 'box',
      matchingMode: isDrag ? 'drag' : 'line',
      needsReview: true,
      detectionNote:
        'Nhận diện đúng dạng Ghép đôi. Thầy cô hãy kiểm tra lại danh sách mục bên trái, bên phải và chọn cặp nối đúng.',
      extractedMatching: {
        itemsA:
          itemsA.length >= 2
            ? itemsA
            : [
                { id: 'det-a-1', label: 'Mục 1' },
                { id: 'det-a-2', label: 'Mục 2' },
                { id: 'det-a-3', label: 'Mục 3' },
              ],
        itemsB:
          itemsB.length >= 2
            ? itemsB
            : [
                { id: 'det-b-1', label: 'Mục A' },
                { id: 'det-b-2', label: 'Mục B' },
                { id: 'det-b-3', label: 'Mục C' },
              ],
      },
      subItems: subItems.length > 0 ? subItems : undefined,
      contentBottomY,
    };
  }

  // --------------------------------------------------------------------------
  // 2. TRUE / FALSE (Table with Đúng / Sai columns OR statement list)
  // --------------------------------------------------------------------------
  const tfHeaderLine = cluster.lines.find(
    (l) =>
      l.items.some((it) => /^(?:đúng|đ)$/i.test(it.str.trim())) &&
      l.items.some((it) => /^(?:sai|s)$/i.test(it.str.trim()))
  );
  const isTfPrompt =
    /(đúng\s*[/\-–]\s*sai|đúng\s+hay\s+sai|chọn\s+đ\s+hoặc\s+s|bảng\s+đúng|đánh\s+dấu.*đúng.*sai|ghi\s+đ.*s|điền\s+đ.*s|true\s*[/\-]\s*false)/i.test(
      lower
    ) ||
    Boolean(tfHeaderLine) ||
    (/(?:^|[\s/|(\[.,;:])đúng(?=$|[\s/|)\].:,;])/i.test(lower) &&
      /(?:^|[\s/|(\[.,;:])sai(?=$|[\s/|)\].:,;])/i.test(lower));

  if (isTfPrompt) {
    let trueNx = 0.78;
    let falseNx = 0.89;
    let hasTableColumns = false;
    let headerIndex = stemEndIdx;

    if (tfHeaderLine) {
      const idx = cluster.lines.indexOf(tfHeaderLine);
      if (idx > 0) headerIndex = idx;
      const trueItem = tfHeaderLine.items.find((it) => /^(?:đúng|đ)$/i.test(it.str.trim()));
      const falseItem = tfHeaderLine.items.find((it) => /^(?:sai|s)$/i.test(it.str.trim()));
      if (trueItem && falseItem) {
        trueNx = clampNorm((trueItem.x + trueItem.width / 2) / pageWidth, 0.55, 0.94);
        falseNx = clampNorm((falseItem.x + falseItem.width / 2) / pageWidth, 0.62, 0.97);
        hasTableColumns = Math.abs(falseNx - trueNx) >= 0.04;
      }
    }

    const rowCandidates = cluster.lines.slice(headerIndex + 1);
    const stmts: TfStatement[] = [];
    for (const ln of rowCandidates) {
      if (BLANK_WRITING_LINE_RE.test(ln.text)) continue;
      // Ignore repeated column header text
      if (/^(?:stt|nội dung|phát biểu|đúng|sai|đ|s|\s)+$/i.test(ln.text.trim())) continue;

      const prefixed = ln.text.match(/^([a-dA-D]|[1-6])[\)\.]\s*(.+)$/);
      const leftOnlyText = hasTableColumns
        ? ln.items
            .filter((it) => it.x < Math.min(trueNx, falseNx) * pageWidth - 12)
            .map((it) => it.str)
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim()
        : ln.text.replace(/\b(đúng|sai|đ|s|☐|□)\b\s*$/gi, '').trim();

      if (prefixed) {
        const cleanBody = leftOnlyText
          .replace(/^([a-dA-D]|[1-6])[\)\.]\s*/, '')
          .replace(/\b(đúng|sai|đ|s|☐|□)\b\s*$/gi, '')
          .trim();
        stmts.push({
          id: `tf-${stmts.length + 1}`,
          label: `${prefixed[1].toLowerCase()})`,
          text: cleanBody || prefixed[2].trim(),
          rowAnchor: hasTableColumns
            ? {
                ny: clampNorm((ln.y + ln.height / 2) / pageHeight),
                trueNx,
                falseNx,
                rowNh: clampNorm(Math.max(18, ln.height + 6) / pageHeight, 0.02, 0.08),
              }
            : undefined,
        });
      } else if (hasTableColumns && leftOnlyText.length >= 6) {
        const letter = String.fromCharCode(97 + stmts.length);
        stmts.push({
          id: `tf-${stmts.length + 1}`,
          label: `${letter})`,
          text: leftOnlyText,
          rowAnchor: {
            ny: clampNorm((ln.y + ln.height / 2) / pageHeight),
            trueNx,
            falseNx,
            rowNh: clampNorm(Math.max(18, ln.height + 6) / pageHeight, 0.02, 0.08),
          },
        });
      }
    }

    const useAnchored = hasTableColumns && stmts.length >= 2;
    if (stmts.length === 0) {
      stmts.push(
        { id: 'tf-1', label: 'a)', text: 'Ý a (giáo viên kiểm tra trên PDF)' },
        { id: 'tf-2', label: 'b)', text: 'Ý b (giáo viên kiểm tra trên PDF)' },
        { id: 'tf-3', label: 'c)', text: 'Ý c (giáo viên kiểm tra trên PDF)' },
        { id: 'tf-4', label: 'd)', text: 'Ý d (giáo viên kiểm tra trên PDF)' }
      );
    }

    return {
      type: 'tf',
      classificationStatus: 'classified',
      overlayMode: useAnchored ? 'anchored' : 'box',
      needsReview: true,
      detectionNote: useAnchored
        ? `Nhận diện bảng Đúng – Sai (${stmts.length} ý) và gắn nút chọn trực tiếp vào cột Đúng/Sai trên PDF. Thầy cô hãy chọn đáp án đúng.`
        : 'Nhận diện câu hỏi Đúng – Sai. Thầy cô hãy kiểm tra các ý và chọn đáp án đúng.',
      extractedTfStatements: stmts,
      subItems: subItems.length > 0 ? subItems : undefined,
      contentBottomY,
    };
  }

  // --------------------------------------------------------------------------
  // 3. ORDERING
  // --------------------------------------------------------------------------
  if (/(sắp\s+xếp.*thứ\s+tự|sắp\s+xếp.*trình\s+tự|đúng\s+thứ\s+tự|put.*in\s+order)/i.test(lower)) {
    const items = bodyLines
      .filter((l) => l.text.length > 3 && !BLANK_WRITING_LINE_RE.test(l.text))
      .slice(0, 6)
      .map((l, idx) => ({
        id: `ord-${idx + 1}`,
        text: l.text.replace(/^[\(\[]?[a-z\d]+[\)\]\.]\s*/i, '').trim(),
      }));
    return {
      type: 'ordering',
      classificationStatus: 'classified',
      overlayMode: 'box',
      needsReview: true,
      detectionNote:
        'Nhận diện câu hỏi Sắp xếp thứ tự. Thầy cô hãy kiểm tra lại các bước và thứ tự đúng.',
      extractedOrdering:
        items.length >= 2
          ? items
          : [
              { id: 'ord-1', text: 'Bước 1 (kiểm tra trên PDF)' },
              { id: 'ord-2', text: 'Bước 2 (kiểm tra trên PDF)' },
              { id: 'ord-3', text: 'Bước 3 (kiểm tra trên PDF)' },
            ],
      subItems: subItems.length > 0 ? subItems : undefined,
      contentBottomY,
    };
  }

  // --------------------------------------------------------------------------
  // 4. MULTIPLE CHOICE (Single Choice vs Multi-Select)
  // --------------------------------------------------------------------------
  const extractedOptions = extractMcqOptionsWithAnchors(cluster, stemEndIdx, pageWidth, pageHeight);
  const isMcqPrompt =
    /(đánh\s+dấu\s*(?:[✓✔×x✗]|vào\s+ô)|tích\s+vào\s+ô|khoanh\s+(?:tròn|vào\s+chữ)|chọn\s+(?:đáp\s+án|phương\s+án|câu\s+trả\s+lời)\s+đúng|chọn\s+chữ\s+cái|chọn\s+(?:các|những)\s+(?:đáp\s+án|phương\s+án|ý)|trắc\s+nghiệm)/i.test(
      lower
    );
  const isExplicitMultiChoice =
    /(chọn\s+(?:các|những|tất\s+cả)|nhiều\s+(?:đáp\s+án|phương\s+án)|các\s+(?:đáp\s+án|phương\s+án)\s+đúng|tất\s+cả\s+các\s+phương\s+án|select\s+all|chọn\s+2\s+|chọn\s+3\s+)/i.test(
      lower
    );

  if (extractedOptions.length >= 2 || isMcqPrompt) {
    const hasAnchors = extractedOptions.length >= 2 && extractedOptions.every((o) => Boolean(o.anchor));
    const finalOpts =
      extractedOptions.length >= 2
        ? extractedOptions
        : [
            { id: 'A', label: 'A', text: 'Phương án A' },
            { id: 'B', label: 'B', text: 'Phương án B' },
            { id: 'C', label: 'C', text: 'Phương án C' },
            { id: 'D', label: 'D', text: 'Phương án D' },
          ];
    const mcqType: InteractiveQuestionType = isExplicitMultiChoice ? 'mcq_multi' : 'mcq';

    return {
      type: mcqType,
      classificationStatus: 'classified',
      overlayMode: hasAnchors ? 'anchored' : 'box',
      needsReview: true,
      detectionNote: hasAnchors
        ? `Nhận diện câu ${mcqType === 'mcq_multi' ? 'Trắc nghiệm nhiều đáp án' : 'Trắc nghiệm một đáp án'} (${finalOpts.length} phương án) và gắn ô chọn trực tiếp tại phương án trên PDF. Thầy cô hãy chọn đáp án đúng.`
        : `Nhận diện câu ${mcqType === 'mcq_multi' ? 'Trắc nghiệm nhiều đáp án' : 'Trắc nghiệm một đáp án'}. Thầy cô hãy kiểm tra phương án và chọn đáp án đúng.`,
      extractedOptions: finalOpts,
      contentBottomY,
    };
  }

  // --------------------------------------------------------------------------
  // 5. FILL-IN-THE-BLANK (Inline blanks — NOT standalone essay writing lines!)
  // --------------------------------------------------------------------------
  const inlineBlankLines = cluster.lines.filter(
    (l) => !BLANK_WRITING_LINE_RE.test(l.text) && /(?:_{3,}|\.{4,}|…{2,})/.test(l.text)
  );
  const isFillPrompt =
    /(điền\s+vào\s+chỗ|điền\s+từ|điền\s+số|điền\s+hệ\s+số|điền\s+khuyết|hoàn\s+thành\s+(?:câu|đoạn)|fill\s+in\s+the\s+blank)/i.test(
      lower
    );

  if (isFillPrompt || inlineBlankLines.length > 0) {
    const slots: FillBlankSlot[] = [];
    inlineBlankLines.slice(0, 5).forEach((ln, idx) => {
      const m = ln.text.match(/^(.*?)(_{3,}|\.{4,}|…{2,})(.*)$/);
      const prefix = (m?.[1] || '').trim().slice(-45);
      const blankToken = m?.[2] || '.....';
      const suffix = (m?.[3] || '').trim().slice(0, 45);
      const blankItem = ln.items.find((it) => /(?:_{3,}|\.{4,}|…{2,})/.test(it.str));
      const approxRatio = ln.text.length > 0 ? Math.max(0, ln.text.indexOf(blankToken)) / ln.text.length : 0.4;
      const blankX = blankItem ? blankItem.x : ln.x + ln.width * approxRatio;
      const blankW = blankItem ? Math.max(54, blankItem.width) : Math.max(64, blankToken.length * 4.5);

      slots.push({
        id: `fb-${idx + 1}`,
        prefix,
        suffix,
        anchor: {
          nx: clampNorm(blankX / pageWidth, 0.03, 0.85),
          ny: clampNorm((ln.y + ln.height / 2) / pageHeight),
          nw: clampNorm(blankW / pageWidth, 0.08, 0.42),
          nh: clampNorm(Math.max(18, ln.height + 6) / pageHeight, 0.02, 0.06),
        },
      });
    });

    if (slots.length === 0) {
      slots.push({ id: 'fb-1', prefix: 'Chỗ trống 1:', suffix: '' });
    }
    const useAnchored = slots.length > 0 && slots.every((s) => Boolean(s.anchor));
    return {
      type: 'fill_blank',
      classificationStatus: 'classified',
      overlayMode: useAnchored ? 'anchored' : 'box',
      needsReview: true,
      detectionNote:
        'Nhận diện câu hỏi Điền vào chỗ trống. Thầy cô hãy nhập đáp án đúng cho từng ô trống.',
      extractedFillBlanks: slots,
      contentBottomY,
    };
  }

  // --------------------------------------------------------------------------
  // 6. DIAGRAM LABELING
  // --------------------------------------------------------------------------
  if (/(chú\s+thích|điền\s+tên\s+bộ\s+phận|sơ\s+đồ\s+sau|bản\s+đồ|lược\s+đồ)/i.test(lower)) {
    return {
      type: 'diagram_label',
      classificationStatus: 'classified',
      overlayMode: 'box',
      needsReview: true,
      detectionNote:
        'Nhận diện câu hỏi Chú thích hình hoặc sơ đồ. Thầy cô hãy kiểm tra lại các vị trí chú thích.',
      contentBottomY,
    };
  }

  // --------------------------------------------------------------------------
  // 7. FORMULA INPUT
  // --------------------------------------------------------------------------
  if (/(viết\s+công\s+thức|biểu\s+thức|đạo\s+hàm|tích\s+phân|phương\s+trình\s+hóa\s+học)/i.test(lower)) {
    return {
      type: 'formula',
      classificationStatus: 'classified',
      overlayMode: 'box',
      needsReview: true,
      detectionNote:
        'Nhận diện câu hỏi Nhập công thức (giáo viên chấm điểm sau khi học sinh nộp bài).',
      contentBottomY,
    };
  }

  // --------------------------------------------------------------------------
  // 8. DRAWING / HANDWRITING
  // --------------------------------------------------------------------------
  if (/(vẽ\s+hình|vẽ\s+đồ\s+thị|vẽ\s+biểu\s+đồ|phác\s+thảo|biểu\s+diễn\s+hình)/i.test(lower)) {
    return {
      type: 'drawing',
      classificationStatus: 'classified',
      overlayMode: 'box',
      needsReview: true,
      detectionNote:
        'Nhận diện câu hỏi Vẽ hình hoặc viết tay. Thầy cô hãy kiểm tra lại khung vẽ.',
      contentBottomY,
    };
  }

  // --------------------------------------------------------------------------
  // 9. READING COMPREHENSION
  // --------------------------------------------------------------------------
  if (/(đọc\s+đoạn|đọc\s+tư\s+liệu|read\s+the\s+passage|read\s+the\s+text)/i.test(lower)) {
    return {
      type: 'reading',
      classificationStatus: 'classified',
      overlayMode: 'box',
      needsReview: true,
      detectionNote:
        'Nhận diện bài Đọc hiểu. Thầy cô hãy kiểm tra lại các câu hỏi con và đáp án.',
      contentBottomY,
    };
  }

  // --------------------------------------------------------------------------
  // 10. NUMERIC CALCULATION
  // --------------------------------------------------------------------------
  if (/(tính\s+giá\s+trị|kết\s+quả\s+bằng|bao\s+nhiêu\s+%|nhập\s+số|đơn\s+vị\s*[:(])/i.test(lower)) {
    return {
      type: 'number',
      classificationStatus: 'classified',
      overlayMode: 'box',
      needsReview: true,
      detectionNote: 'Nhận diện câu hỏi Nhập số. Thầy cô hãy nhập đáp số đúng.',
      contentBottomY,
    };
  }

  // --------------------------------------------------------------------------
  // 11. PRACTICAL ATTACHMENT
  // --------------------------------------------------------------------------
  if (/(đính\s+kèm|nộp\s+tệp|chụp\s+ảnh\s+sản\s+phẩm|mã\s+nguồn|file\s+thực\s+hành)/i.test(lower)) {
    return {
      type: 'attachment',
      classificationStatus: 'classified',
      overlayMode: 'box',
      needsReview: true,
      detectionNote:
        'Nhận diện bài thực hành cho phép học sinh gửi kèm ảnh hoặc tệp.',
      contentBottomY,
    };
  }

  // --------------------------------------------------------------------------
  // 12. SHORT ANSWER (Explicit short single-fact prompt)
  // --------------------------------------------------------------------------
  if (/(ghi\s+tên|kể\s+tên|viết\s+tên|cho\s+biết\s+tên|trả\s+lời\s+ngắn)/i.test(lower)) {
    const availBlankH = nextClusterStartY - contentBottomY - 10;
    return {
      type: 'short',
      classificationStatus: 'classified',
      overlayMode: availBlankH >= 48 ? 'box' : 'drawer_button',
      needsReview: true,
      detectionNote:
        'Nhận diện câu hỏi Trả lời ngắn. Thầy cô hãy nhập đáp án chấp nhận nếu cần chấm nhanh.',
      contentBottomY,
    };
  }

  // --------------------------------------------------------------------------
  // 13. ESSAY — ONLY WITH EXPLICIT ESSAY SIGNALS OR BLANK WRITING LINES!
  // --------------------------------------------------------------------------
  const blankWritingLineCount = cluster.lines.filter((l) => BLANK_WRITING_LINE_RE.test(l.text)).length;
  const hasExplicitEssaySignal =
    /(tr[ìi]nh\s+b[àa]y|gi[ảa]i\s+th[íi]ch|ph[âa]n\s+t[íi]ch|v[ìi]\s+sao|t[ạa]i\s+sao|theo\s+em|em\s+h[ãa]y\s+(?:vi[ếe]t|n[êe]u|k[ểe]|cho\s+bi[ếe]t|m[ôo]\s+t[ảa]|nh[ậa]n\s+x[ée]t)|vi[ếe]t\s+c[âa]u\s+tr[ảa]\s+l[ờo]i|em\s+s[ẽe]\s+l[àa]m\s+g[ìi]|quy[ếe]t\s+[đd][ịi]nh|h[ãa]y\s+n[êe]u|h[ãa]y\s+k[ểe]|so\s+s[áa]nh|ch[ứu]ng\s+minh|t[ựư]\s+lu[ậa]n|tr[ảa]\s+l[ờo]i\s+c[âa]u\s+h[ỏo]i\s+sau)/i.test(
      lower
    ) || blankWritingLineCount >= 2;

  if (hasExplicitEssaySignal) {
    const availBlankH = nextClusterStartY - contentBottomY - 12;
    const useDrawerButton = availBlankH < 56;
    return {
      type: 'essay',
      classificationStatus: 'classified',
      overlayMode: useDrawerButton ? 'drawer_button' : 'box',
      needsReview: true,
      detectionNote: useDrawerButton
        ? 'Nhận diện câu Tự luận. Vì khoảng trống trên trang PDF hẹp, ứng dụng đặt nút "Viết câu trả lời" gọn gàng để không che chữ.'
        : 'Nhận diện câu Tự luận và đặt khung trả lời vào đúng khoảng trống bên dưới câu hỏi (không che chữ đề bài).',
      subItems: subItems.length > 0 ? subItems : undefined,
      contentBottomY,
    };
  }

  // --------------------------------------------------------------------------
  // 14. UNCLASSIFIED — NEVER DEFAULT TO GIANT ESSAY BOX!
  // --------------------------------------------------------------------------
  return {
    type: 'short',
    classificationStatus: 'unclassified',
    overlayMode: 'drawer_button',
    needsReview: true,
    detectionNote:
      'Chưa đủ căn cứ để phân loại tự động dạng câu hỏi này. Thầy cô hãy nhấn vào câu hỏi và chọn đúng 1 trong 14 dạng (ứng dụng không tự tạo khung Tự luận che trang).',
    subItems: subItems.length > 0 ? subItems : undefined,
    contentBottomY,
  };
}

/**
 * Post-processes detected questions on each page to guarantee:
 * - Zero duplicate questions on same page (by normalized code or vertical proximity)
 * - Every region stays strictly within PDF page boundaries
 * - Zero vertical overlap between box-mode answer regions (auto-trims or falls back to drawer_button)
 * - Normalized nx/ny/nw/nh coordinates are always accurately computed
 */
export function validateAndDeduplicateRegions(
  questions: InteractiveQuestion[],
  pageDims: Array<{ pageIndex: number; width: number; height: number }>
): InteractiveQuestion[] {
  const dimMap = new Map(pageDims.map((d) => [d.pageIndex, d]));
  const result: InteractiveQuestion[] = [];

  // Group by pageIndex
  const byPage = new Map<number, InteractiveQuestion[]>();
  for (const q of questions) {
    const arr = byPage.get(q.region.pageIndex) || [];
    arr.push(q);
    byPage.set(q.region.pageIndex, arr);
  }

  for (const [pageIdx, pageQs] of byPage.entries()) {
    const dim = dimMap.get(pageIdx) || { pageIndex: pageIdx, width: 595, height: 842 };
    const pw = dim.width;
    const ph = dim.height;

    // Sort top-to-bottom by questionBounds.y (or region.y)
    const sorted = [...pageQs].sort(
      (a, b) => (a.questionBounds?.y ?? a.region.y) - (b.questionBounds?.y ?? b.region.y)
    );

    // 1. Deduplicate by normalized code or near-identical top Y on same page
    const deduped: InteractiveQuestion[] = [];
    for (const q of sorted) {
      const qCodeNorm = normalizeQuestionCode(q.code);
      const qTop = q.questionBounds?.y ?? q.region.y;
      const dup = deduped.find((ex) => {
        const exCodeNorm = normalizeQuestionCode(ex.code);
        const exTop = ex.questionBounds?.y ?? ex.region.y;
        return (qCodeNorm && exCodeNorm && qCodeNorm === exCodeNorm) || Math.abs(qTop - exTop) < 18;
      });
      if (!dup) {
        deduped.push({ ...q, region: { ...q.region } });
      }
    }

    // 2. Clamp strictly inside page margins
    for (const q of deduped) {
      const r = q.region;
      const minW = q.overlayMode === 'drawer_button' ? 140 : 160;
      const minH = q.overlayMode === 'drawer_button' ? 32 : 48;
      r.width = Math.round(Math.max(minW, Math.min(pw - 32, r.width)));
      r.height = Math.round(Math.max(minH, Math.min(ph - 32, r.height)));
      r.x = Math.round(Math.max(16, Math.min(pw - r.width - 16, r.x)));
      r.y = Math.round(Math.max(16, Math.min(ph - r.height - 16, r.y)));
      r.nx = clampNorm(r.x / pw, 0, 0.96);
      r.ny = clampNorm(r.y / ph, 0, 0.96);
      r.nw = clampNorm(r.width / pw, 0.04, 0.96);
      r.nh = clampNorm(r.height / ph, 0.02, 0.96);
    }

    // 3. Enforce ZERO vertical overlap between 'box' regions on the same page
    const boxQs = deduped
      .filter((q) => q.overlayMode === 'box' && q.classificationStatus !== 'unclassified')
      .sort((a, b) => a.region.y - b.region.y);

    for (let i = 0; i < boxQs.length - 1; i++) {
      const cur = boxQs[i];
      const next = boxQs[i + 1];
      const curBottom = cur.region.y + cur.region.height;
      const nextTop = Math.min(next.region.y, next.questionBounds?.y ?? next.region.y);
      if (curBottom > nextTop - 6) {
        const maxAllowedH = Math.floor(nextTop - 8 - cur.region.y);
        if (maxAllowedH >= 48) {
          cur.region.height = maxAllowedH;
          cur.region.nh = clampNorm(cur.region.height / ph, 0.04, 0.94);
        } else {
          // Not enough blank room -> switch to compact non-overlapping drawer button
          cur.overlayMode = 'drawer_button';
          const btnX = Math.round(Math.max(16, pw - 210));
          const btnY = Math.round(Math.max(16, cur.questionBounds?.y ?? cur.region.y));
          cur.region.x = btnX;
          cur.region.y = btnY;
          cur.region.width = 186;
          cur.region.height = 34;
          cur.region.nx = clampNorm(btnX / pw, 0.04, 0.92);
          cur.region.ny = clampNorm(btnY / ph, 0.02, 0.94);
          cur.region.nw = clampNorm(186 / pw, 0.1, 0.5);
          cur.region.nh = clampNorm(34 / ph, 0.02, 0.1);
        }
      }
    }

    result.push(...deduped);
  }

  return result;
}

/**
 * Pure structural & semantic question detection over extracted PDF page text lines.
 * Used by detectQuestionsFromPdfPages() and unit/integration verification tests.
 */
export function analyzeExtractedPagesForQuestions(pages: ExtractedPageInput[]): PdfDetectionResult {
  const pageSummaries: PageInspectionSummary[] = [];
  const scannedPageNumbers: number[] = [];
  const rawQuestions: InteractiveQuestion[] = [];
  const emptyAnswerKeys: TeacherAnswerKeyMap = {};
  const notes: string[] = [];
  let lessonTitle: string | undefined;

  for (const pageData of pages) {
    const { pageIndex, sourcePdfPageNumber, printedPageLabel, width: pw, height: ph, textItemCount, lines } =
      pageData;
    const isLikelyScan = textItemCount < 6;
    const medianFont = computeMedianFontSize(lines);

    const contentLines = lines.filter((ln) => ln.y >= ph * 0.045 && ln.y <= ph * 0.945);
    const pageHasExplicitCau = contentLines.some((ln) => EXPLICIT_MAIN_QUESTION_RE.test(ln.text.trim()));

    // Detect lesson heading (including "Bài 1" + following ALL-CAPS subtitle like "THÔNG TIN VÀ QUYẾT ĐỊNH")
    let detectedHeading: string | undefined;
    const headingLineSet = new Set<TextLineBlock>();
    for (let li = 0; li < Math.min(8, contentLines.length); li++) {
      const ln = contentLines[li];
      const nextLn = contentLines[li + 1];
      if (
        STRONG_HEADING_RE.test(ln.text.trim()) ||
        isBaiLineALessonHeading(ln, nextLn, pageHasExplicitCau, medianFont, ph)
      ) {
        headingLineSet.add(ln);
        detectedHeading = ln.text.trim();
        // If immediately followed by an ALL-CAPS or large-font subtitle line (e.g. "THÔNG TIN VÀ QUYẾT ĐỊNH"), attach it!
        if (
          nextLn &&
          !EXPLICIT_MAIN_QUESTION_RE.test(nextLn.text.trim()) &&
          (nextLn.isAllCaps || nextLn.fontSize >= medianFont * 1.15 || nextLn.isCentered) &&
          nextLn.y - (ln.y + ln.height) <= 28
        ) {
          headingLineSet.add(nextLn);
          detectedHeading = `${detectedHeading} — ${nextLn.text.trim()}`;
        }
        if (!lessonTitle) lessonTitle = detectedHeading;
        break;
      }
    }

    pageSummaries.push({
      pdfPageNumber: sourcePdfPageNumber,
      printedPageLabel,
      width: pw,
      height: ph,
      textItemCount,
      isLikelyScan,
      detectedHeading,
    });

    if (isLikelyScan) {
      scannedPageNumbers.push(sourcePdfPageNumber);
      continue;
    }

    // Partition lines into main question clusters (NEVER splitting 1), 2), 3) sub-items or headings!)
    const clusters: QuestionCluster[] = [];
    for (let li = 0; li < contentLines.length; li++) {
      const ln = contentLines[li];
      const trimmed = ln.text.trim();
      if (!trimmed) continue;

      if (headingLineSet.has(ln)) continue;
      if (STRONG_HEADING_RE.test(trimmed) || SECTION_HEADER_RE.test(trimmed)) continue;

      // Check if this line starts a NEW main question
      const explicitMatch = trimmed.match(EXPLICIT_MAIN_QUESTION_RE);
      const baiMatch = !explicitMatch ? trimmed.match(BAI_NUMBER_RE) : null;
      const isBaiHeading =
        baiMatch &&
        isBaiLineALessonHeading(ln, contentLines[li + 1], pageHasExplicitCau, medianFont, ph);

      // Bare "1.", "2." is ONLY allowed as a main question when:
      // - NO explicit "Câu N" exists on the page,
      // - We are NOT inside an active cluster whose stem is matching/tf/ordering,
      // - It starts near the left margin (x < pw * 0.18) and has a full sentence (>= 28 chars or ends with ? / :).
      const bareNumMatch =
        !explicitMatch &&
        !baiMatch &&
        !pageHasExplicitCau &&
        clusters.length === 0 &&
        ln.x < pw * 0.18
          ? trimmed.match(/^(\d{1,2})\.\s+(.{24,})$/)
          : null;

      if (explicitMatch || (baiMatch && !isBaiHeading) || bareNumMatch) {
        const rawCode = explicitMatch
          ? explicitMatch[1]
          : baiMatch
            ? baiMatch[1]
            : `Câu ${bareNumMatch![1]}`;
        const cleanCode = rawCode.replace(/[:\.\-–\)]+$/, '').trim();
        clusters.push({
          code: cleanCode,
          normalizedCode: normalizeQuestionCode(cleanCode),
          startY: ln.y,
          endY: ln.y + ln.height,
          lines: [ln],
          fullText: trimmed,
          subItems: [],
        });
      } else if (clusters.length > 0) {
        // Attach sub-items 1), 2), 3), options A/B/C/D, table rows, and continuation lines to the active main question!
        const cur = clusters[clusters.length - 1];
        cur.lines.push(ln);
        cur.endY = Math.max(cur.endY, ln.y + ln.height);
        cur.fullText = `${cur.fullText}\n${trimmed}`;
      }
    }

    // Classify and compute non-covering regions for each cluster
    clusters.forEach((cl, idx) => {
      const nextClusterStartY = clusters[idx + 1]?.startY ?? ph - 32;
      const cls = classifyQuestionCluster(cl, pw, ph, nextClusterStartY);
      const meta = QUESTION_TYPE_META[cls.type];

      const minX = Math.min(...cl.lines.map((l) => l.x));
      const maxX = Math.max(...cl.lines.map((l) => l.x + l.width));
      const qBounds: PdfRegion = {
        pageIndex,
        x: Math.round(Math.max(16, minX)),
        y: Math.round(Math.max(16, cl.startY)),
        width: Math.round(Math.min(pw - 32, Math.max(160, maxX - minX))),
        height: Math.round(Math.max(20, cl.endY - cl.startY)),
        nx: clampNorm(Math.max(16, minX) / pw),
        ny: clampNorm(Math.max(16, cl.startY) / ph),
        nw: clampNorm(Math.min(pw - 32, Math.max(160, maxX - minX)) / pw),
        nh: clampNorm(Math.max(20, cl.endY - cl.startY) / ph),
      };

      let region: PdfRegion;
      if (cls.overlayMode === 'anchored') {
        // Anchored transparent overlay spans strictly the body of the question (never opaque over text!)
        const topY = Math.max(16, Math.round(cl.startY - 4));
        const bottomY = Math.min(ph - 20, Math.round(Math.max(cl.endY + 10, topY + 64)));
        const rX = 18;
        const rW = Math.round(pw - 36);
        const rH = Math.max(54, bottomY - topY);
        region = {
          pageIndex,
          x: rX,
          y: topY,
          width: rW,
          height: rH,
          nx: clampNorm(rX / pw),
          ny: clampNorm(topY / ph),
          nw: clampNorm(rW / pw),
          nh: clampNorm(rH / ph),
        };
      } else if (cls.overlayMode === 'drawer_button') {
        // Compact non-covering button placed neatly at the right edge of the question header line
        const btnW = 192;
        const btnH = 34;
        const btnX = Math.round(Math.max(18, pw - btnW - 20));
        const btnY = Math.round(Math.max(16, cl.startY - 2));
        region = {
          pageIndex,
          x: btnX,
          y: btnY,
          width: btnW,
          height: btnH,
          nx: clampNorm(btnX / pw),
          ny: clampNorm(btnY / ph),
          nw: clampNorm(btnW / pw),
          nh: clampNorm(btnH / ph),
        };
      } else {
        // Box mode: placed strictly INSIDE blank space below ALL prompt/content lines (never covering text!)
        const boxStartY = Math.round(cls.contentBottomY + 6);
        const availH = Math.floor(nextClusterStartY - boxStartY - 8);
        const boxX = 28;
        const boxW = Math.min(Math.round(pw - 56), Math.max(meta.defaultWidth, 380));
        if (availH < 48) {
          // Not enough blank room -> auto-switch to drawer button so PDF text is NEVER covered
          cls.overlayMode = 'drawer_button';
          const btnW = 192;
          const btnH = 34;
          const btnX = Math.round(Math.max(18, pw - btnW - 20));
          const btnY = Math.round(Math.max(16, cl.startY - 2));
          region = {
            pageIndex,
            x: btnX,
            y: btnY,
            width: btnW,
            height: btnH,
            nx: clampNorm(btnX / pw),
            ny: clampNorm(btnY / ph),
            nw: clampNorm(btnW / pw),
            nh: clampNorm(btnH / ph),
          };
        } else {
          const boxH = Math.min(Math.max(meta.defaultHeight, 76), availH);
          region = {
            pageIndex,
            x: boxX,
            y: boxStartY,
            width: boxW,
            height: boxH,
            nx: clampNorm(boxX / pw),
            ny: clampNorm(boxStartY / ph),
            nw: clampNorm(boxW / pw),
            nh: clampNorm(boxH / ph),
          };
        }
      }

      const qId = `det-p${pageIndex + 1}-q${idx + 1}-${Math.random().toString(36).slice(2, 6)}`;
      const firstLineClean = cl.lines[0].text
        .replace(EXPLICIT_MAIN_QUESTION_RE, '')
        .replace(BAI_NUMBER_RE, '')
        .replace(/^[:\.\-–\s]+/, '')
        .trim();

      const question: InteractiveQuestion = {
        id: qId,
        code: cl.code || `Câu ${rawQuestions.length + 1}`,
        title: firstLineClean.slice(0, 84) || meta.label,
        prompt: firstLineClean || `Hoàn thành ${cl.code} theo đề bài trên trang PDF.`,
        type: cls.type,
        maxPoints: 2,
        required: cls.classificationStatus === 'classified',
        needsReview: cls.needsReview,
        detectionNote: cls.detectionNote,
        teacherApproved: false,
        teacherModified: false,
        classificationStatus: cls.classificationStatus,
        overlayMode: cls.overlayMode,
        subItems: cls.subItems,
        questionBounds: qBounds,
        sourcePdfPageNumber,
        printedPageLabel,
        region,
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
          columnATitle: 'Cột trái',
          columnBTitle: 'Cột phải',
          itemsA: cls.extractedMatching?.itemsA || [],
          itemsB: cls.extractedMatching?.itemsB || [],
        };
      } else if (cls.type === 'ordering') {
        question.orderingItems = cls.extractedOrdering;
      } else if (cls.type === 'fill_blank') {
        question.fillBlanks = cls.extractedFillBlanks;
      } else if (cls.type === 'essay') {
        question.essayPlaceholder = 'Nhập câu trả lời của em tại đây...';
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

      rawQuestions.push(question);
    });
  }

  // Run final validation, deduplication, boundary clamping & anti-overlap check
  const finalQuestions = validateAndDeduplicateRegions(
    rawQuestions,
    pages.map((p) => ({ pageIndex: p.pageIndex, width: p.width, height: p.height }))
  );

  for (const q of finalQuestions) {
    emptyAnswerKeys[q.id] = { questionId: q.id };
  }

  const totalDetectedCount = finalQuestions.length;
  const unclassifiedCount = finalQuestions.filter(
    (q) => q.classificationStatus === 'unclassified'
  ).length;
  const interactiveReadyCount = totalDetectedCount - unclassifiedCount;

  if (scannedPageNumbers.length > 0) {
    notes.push(
      scannedPageNumbers.length === pages.length
        ? 'Tài liệu này là trang hình ảnh (scan) không có lớp văn bản nhúng. Thầy cô hãy nhấn "+ Thêm câu hỏi" để tự đặt đúng vị trí trên trang PDF.'
        : `Trang ${scannedPageNumbers.join(', ')} là trang hình ảnh nên không tự đọc được chữ. Thầy cô có thể bổ sung câu hỏi thủ công cho các trang đó.`
    );
  }
  if (totalDetectedCount === 0) {
    notes.push(
      'Ứng dụng chưa tìm thấy câu hỏi có lớp văn bản trong các trang này. Thầy cô hãy nhấn "+ Thêm câu hỏi" rồi nhấn trực tiếp lên trang PDF.'
    );
  } else if (unclassifiedCount > 0) {
    notes.push(
      `Nhận diện ${totalDetectedCount} câu hỏi chính (${interactiveReadyCount} câu đã phân loại sẵn sàng · ${unclassifiedCount} câu chưa xác định dạng — thầy cô hãy chọn dạng cho các câu này).`
    );
  } else {
    notes.push(
      `Nhận diện ${totalDetectedCount} câu hỏi chính (${interactiveReadyCount} câu tương tác sẵn sàng). Thầy cô hãy kiểm tra và chọn đáp án đúng trước khi giao bài.`
    );
  }

  return {
    lessonTitle,
    pageSummaries,
    scannedPageNumbers,
    questions: finalQuestions,
    emptyAnswerKeys,
    notes,
    totalDetectedCount,
    interactiveReadyCount,
    unclassifiedCount,
  };
}

/**
 * Safe re-detection merge comparator:
 * - Preserves ALL questions edited or approved by the teacher (`teacherModified || teacherApproved`)
 * - Replaces old unmodified auto-detected regions (NEVER duplicates or accumulates!)
 * - Skips newly detected regions that match a preserved question by (pageIndex, code) or vertical proximity
 */
export function compareDetectionForRedetect(
  existingQuestions: InteractiveQuestion[],
  existingKeys: TeacherAnswerKeyMap,
  newDetection: PdfDetectionResult
): RedetectComparisonResult {
  const preservedQuestions = existingQuestions.filter(
    (q) => Boolean(q.teacherModified || q.teacherApproved)
  );
  const replacedAutoCount = existingQuestions.length - preservedQuestions.length;

  const mergedQuestions: InteractiveQuestion[] = preservedQuestions.map((q) => ({ ...q }));
  const mergedKeys: TeacherAnswerKeyMap = {};
  for (const pq of preservedQuestions) {
    mergedKeys[pq.id] = existingKeys[pq.id]
      ? { ...existingKeys[pq.id] }
      : { questionId: pq.id };
  }

  let newCount = 0;
  let skippedDuplicateCount = 0;

  for (const cand of newDetection.questions) {
    const candCode = normalizeQuestionCode(cand.code);
    const candTop = cand.questionBounds?.y ?? cand.region.y;

    const conflictsWithPreserved = preservedQuestions.some((pq) => {
      if (pq.region.pageIndex !== cand.region.pageIndex) return false;
      const pqCode = normalizeQuestionCode(pq.code);
      const pqTop = pq.questionBounds?.y ?? pq.region.y;
      return (candCode && pqCode && candCode === pqCode) || Math.abs(candTop - pqTop) < 36;
    });

    if (conflictsWithPreserved) {
      skippedDuplicateCount++;
      continue;
    }

    mergedQuestions.push(cand);
    mergedKeys[cand.id] = newDetection.emptyAnswerKeys[cand.id] || { questionId: cand.id };
    newCount++;
  }

  // Sort merged questions cleanly by pageIndex, then vertical top coordinate
  mergedQuestions.sort((a, b) => {
    if (a.region.pageIndex !== b.region.pageIndex) {
      return a.region.pageIndex - b.region.pageIndex;
    }
    return (a.questionBounds?.y ?? a.region.y) - (b.questionBounds?.y ?? b.region.y);
  });

  const unclassifiedCount = mergedQuestions.filter(
    (q) => q.classificationStatus === 'unclassified'
  ).length;
  const interactiveReadyCount = mergedQuestions.length - unclassifiedCount;

  return {
    mergedQuestions,
    mergedKeys,
    preservedManualCount: preservedQuestions.length,
    replacedAutoCount,
    newCount,
    skippedDuplicateCount,
    lessonTitle: newDetection.lessonTitle,
    pageSummaries: newDetection.pageSummaries,
    notes: newDetection.notes,
    totalDetectedCount: mergedQuestions.length,
    interactiveReadyCount,
    unclassifiedCount,
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

  try {
    const totalPages = handle.proxy.numPages;
    const extractedPages: ExtractedPageInput[] = [];

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
      const lines = groupTextItemsIntoLines(validItems, vp.height, vp.width);
      const detectedPrinted = detectPrintedPageNumber(lines, vp.height);
      const printedPageLabel =
        typeof options?.printedPageOffset === 'number'
          ? String(sourcePdfNum + options.printedPageOffset)
          : detectedPrinted;

      extractedPages.push({
        pageIndex: i,
        sourcePdfPageNumber: sourcePdfNum,
        printedPageLabel,
        width: vp.width,
        height: vp.height,
        textItemCount: validItems.length,
        lines,
      });
    }

    return analyzeExtractedPagesForQuestions(extractedPages);
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
      const lines = groupTextItemsIntoLines(validItems, vp.height, vp.width);
      const printedPageLabel = detectPrintedPageNumber(lines, vp.height);
      const medianFont = computeMedianFontSize(lines);
      const pageHasExplicitCau = lines.some((l) => EXPLICIT_MAIN_QUESTION_RE.test(l.text.trim()));
      const headingIdx = lines
        .slice(0, 6)
        .findIndex(
          (l, idx) =>
            STRONG_HEADING_RE.test(l.text.trim()) ||
            isBaiLineALessonHeading(l, lines[idx + 1], pageHasExplicitCau, medianFont, vp.height)
        );
      let heading: string | undefined;
      if (headingIdx >= 0) {
        heading = lines[headingIdx].text.trim();
        const nextLn = lines[headingIdx + 1];
        if (nextLn && (nextLn.isAllCaps || nextLn.isCentered) && !EXPLICIT_MAIN_QUESTION_RE.test(nextLn.text.trim())) {
          heading = `${heading} — ${nextLn.text.trim()}`;
        }
      }
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
