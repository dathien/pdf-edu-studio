import { PDFDocument } from 'pdf-lib';
import { openPdfDocument } from '../../engines/pdf/pdfEngine';
import { getPdfjsLib } from '../../engines/pdf/pdfjsConfig';
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

export interface PdfGeomBox {
  x: number;
  y: number; // top-down PDF points
  width: number;
  height: number;
}

export interface PdfGeomLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface ExtractedPageGeometry {
  /** Small vector squares (7..28pt) drawn on the PDF page — real checkboxes! */
  checkboxes: PdfGeomBox[];
  /** Horizontal vector lines (writing lines, inline blanks, table borders) */
  horizontalLines: PdfGeomLine[];
  /** Vertical vector lines (table column dividers) */
  verticalLines: PdfGeomLine[];
  /** Larger vector boxes/cards/table cells (matching cards, frames) */
  boxes: PdfGeomBox[];
  /** Embedded illustration/image bounding boxes on the page */
  images: PdfGeomBox[];
}

export interface ExtractedPageInput {
  pageIndex: number;
  sourcePdfPageNumber: number;
  printedPageLabel?: string;
  width: number;
  height: number;
  textItemCount: number;
  lines: TextLineBlock[];
  geometry?: ExtractedPageGeometry;
  usedOcr?: boolean;
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

// ============================================================================
// VIETNAMESE UNICODE NORMALIZATION & GAP-AWARE LINE RECONSTRUCTION
// ============================================================================

const PUA_CHECKBOX_RE = /[\uF06F\uF071\uF0A8\uF0FE\u25A1\u25A2\u25FB\u25FD\u274F\u2751\u2610\u2611\u2612]/g;

export function cleanPdfTokenText(raw: string): string {
  return raw
    .normalize('NFC')
    .replace(/[\u00A0\u2007\u202F]/g, ' ')
    .replace(/[\u200B\u200C\u200D\u00AD\uFEFF]/g, '')
    .replace(PUA_CHECKBOX_RE, '☐');
}

export function foldVietnamese(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function isLineAllCaps(text: string): boolean {
  const letters = text.replace(/[^A-Za-zÀ-ỹ]/g, '');
  if (letters.length < 3) return false;
  return letters === letters.toUpperCase();
}

function clampNorm(v: number, min = 0.01, max = 0.99): number {
  return Number(Math.max(min, Math.min(max, v)).toFixed(4));
}

/**
 * Reconstructs natural Vietnamese words from PDF.js text items by measuring actual
 * horizontal PDF-point gaps instead of blindly inserting spaces between split glyphs.
 * Fixes split diacritics/kerning like ["Đ", "ánh", " d", "ấu"] -> "Đánh dấu" and ["A", "."] -> "A.".
 */
export function joinLineItemsWithGap(items: TextLineItem[]): string {
  if (items.length === 0) return '';
  let out = items[0].str;
  for (let i = 1; i < items.length; i++) {
    const prev = items[i - 1];
    const cur = items[i];
    const gap = cur.x - (prev.x + prev.width);
    const refSize = Math.min(prev.height, cur.height) || 11;
    const prevEndsSpace = /\s$/.test(out);
    const curStartsSpace = /^\s/.test(cur.str);
    const curStartsClosingPunct = /^[\.,;:!\?\)\]\}]/.test(cur.str);
    const prevEndsOpenPunct = /[\(\[\{]$/.test(out);

    if (prevEndsSpace || curStartsSpace) {
      out += cur.str;
    } else if (curStartsClosingPunct && gap <= refSize * 0.35) {
      out += cur.str;
    } else if (prevEndsOpenPunct && gap <= refSize * 0.35) {
      out += cur.str;
    } else if (gap > Math.max(1.15, refSize * 0.145)) {
      out += ' ' + cur.str;
    } else if (/[,;:?!\)]$/.test(out) && /^[A-Za-zÀ-ỹ0-9☐□▢◯○]/.test(cur.str) && gap > 0.35) {
      out += ' ' + cur.str;
    } else if (/^[☐□▢◯○]$/.test(out.slice(-1)) || /^[☐□▢◯○]/.test(cur.str)) {
      out += ' ' + cur.str;
    } else {
      out += cur.str;
    }
  }
  return out.replace(/\s+/g, ' ').trim();
}

function mergeLeftNumberBadges(lines: TextLineBlock[], pageWidth: number): TextLineBlock[] {
  if (lines.length < 2) return lines;
  const merged: TextLineBlock[] = [];
  let i = 0;
  while (i < lines.length) {
    const cur = lines[i];
    const next = lines[i + 1];
    const curTrim = cur.text.trim();
    const isShortQuestionBadge =
      cur.x < pageWidth * 0.22 &&
      cur.width < 68 &&
      /^(?:(?:C[âa]u|B[àa]i)\s*)?\d{1,2}[\.\):]?$/i.test(curTrim);

    if (
      isShortQuestionBadge &&
      next &&
      next.x > cur.x + Math.min(cur.width, 10) &&
      Math.abs((cur.y + cur.height / 2) - (next.y + next.height / 2)) <= Math.max(13, cur.height * 0.85)
    ) {
      const combinedItems = [...cur.items, ...next.items].sort((a, b) => a.x - b.x);
      const minX = Math.min(cur.x, next.x);
      const maxX = Math.max(cur.x + cur.width, next.x + next.width);
      const minY = Math.min(cur.y, next.y);
      const maxBottom = Math.max(cur.y + cur.height, next.y + next.height);
      const text = joinLineItemsWithGap(combinedItems);
      const width = Math.max(10, maxX - minX);
      const centerDist = Math.abs(minX + width / 2 - pageWidth / 2);
      merged.push({
        text,
        x: minX,
        y: minY,
        width,
        height: Math.max(10, maxBottom - minY),
        fontSize: Math.max(cur.fontSize, next.fontSize),
        isCentered: centerDist < pageWidth * 0.14 && width < pageWidth * 0.78,
        isAllCaps: isLineAllCaps(text),
        items: combinedItems,
      });
      i += 2;
      continue;
    }
    merged.push(cur);
    i += 1;
  }
  return merged;
}

export function groupTextItemsIntoLines(
  rawItems: Array<{ str: string; transform: number[]; width?: number; height?: number }>,
  pageHeight: number,
  pageWidth = 595
): TextLineBlock[] {
  const positioned = rawItems
    .filter((it) => typeof it.str === 'string' && cleanPdfTokenText(it.str).trim().length > 0)
    .map((it) => {
      const cleaned = cleanPdfTokenText(it.str);
      const x = Number(it.transform?.[4] || 0);
      const yBottom = Number(it.transform?.[5] || 0);
      const scaleY = Math.hypot(Number(it.transform?.[2] || 0), Number(it.transform?.[3] || 0));
      const h = Math.max(8, Math.abs(Number(it.height || scaleY || 11)));
      const w = Math.max(2, Number(it.width || cleaned.length * h * 0.45));
      const yTop = Math.max(0, pageHeight - yBottom - h);
      return { str: cleaned, x, y: yTop, width: w, height: h };
    })
    .sort((a, b) => (Math.abs(a.y - b.y) > 5.5 ? a.y - b.y : a.x - b.x));

  const lines: TextLineBlock[] = [];
  for (const item of positioned) {
    const last = lines[lines.length - 1];
    const yTol = Math.min(8.5, Math.max(5, Math.min(last?.height || 11, item.height) * 0.58));
    if (last && Math.abs(last.y - item.y) <= yTol) {
      last.items.push(item);
      last.items.sort((a, b) => a.x - b.x);
      last.text = joinLineItemsWithGap(last.items);
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
  return mergeLeftNumberBadges(lines, pageWidth);
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
  /(?:^|[\s,.;:!?])(tinh|giai|tim|chung\s+minh|noi|chon|dien|khoanh|viet|ve|hay|em\s+hay|danh\s+dau|sap\s+xep|xac\s+dinh|ghep|neu|ke|mo\s+ta|quan\s+sat|tra\s+loi|hoan\s+thanh|to\s+mau)(?=$|[\s,.;:!?])/i;

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

  const restFolded = foldVietnamese(rest);

  // 1. Standalone "Bài 1" / "BÀI 1" with no exercise body -> ALWAYS a lesson heading!
  if (rest.length === 0) return true;

  // 2. If the page also uses "Câu 1", "Câu 2", ... then "Bài N" is the lesson title
  if (pageHasExplicitCau) return true;

  // 3. Large font or centered title or ALL CAPS title -> lesson heading
  if (ln.fontSize >= medianFont * 1.18 || ln.isCentered || ln.isAllCaps) return true;

  // 4. Appears in upper 25% of page and followed by an ALL-CAPS/large subtitle, or has no exercise verb
  if (ln.y < pageHeight * 0.25 && (!EXERCISE_VERB_RE.test(restFolded) || (nextLine && nextLine.isAllCaps))) {
    return true;
  }

  // 5. Short title without exercise action verbs (e.g. "Bài 1. Thông tin và quyết định")
  if (rest.length <= 75 && !EXERCISE_VERB_RE.test(restFolded) && !/\?/.test(rest)) {
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
  unclassifiedReason?: string;
  suggestedTypes?: InteractiveQuestionType[];
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

function findStemEndIndex(lines: TextLineBlock[], clusterCheckboxes: PdfGeomBox[] = []): number {
  if (lines.length <= 1) return 0;
  let endIdx = 0;
  for (let i = 1; i < lines.length; i++) {
    const t = lines[i].text.trim();
    const tf = foldVietnamese(t);
    const prevText = lines[i - 1].text.trim();
    // Stop stem before a line aligned with a vector checkbox (option row!)
    const lineMidY = lines[i].y + lines[i].height / 2;
    const hasAlignedCheckbox = clusterCheckboxes.some(
      (cb) => Math.abs(cb.y + cb.height / 2 - lineMidY) <= Math.max(10, lines[i].height * 0.75)
    );
    if (hasAlignedCheckbox) {
      break;
    }
    // If previous line ended with ':' and there are multiple body lines below, stem has ended
    if (prevText.endsWith(':') && lines.length >= 3) {
      break;
    }
    // Stop stem before options, sub-items, checkboxes, tables, or blank lines
    if (
      /^(?:[A-D][\.\)]|\d+[\)\.]|[a-d][\)\.]|[☐□▢◯○]|\[ ?\]|\( ?\)|cot\s*[ab12]|stt\b|noi\s+dung\b|phat\s+bieu\b|thong\s+tin\b|quyet\s+dinh\b)/i.test(
        tf
      ) ||
      /^(?:[A-D][\.\)]|\d+[\)\.]|[a-d][\)\.]|[☐□▢◯○]|\[ ?\]|\( ?\))/.test(t) ||
      BLANK_WRITING_LINE_RE.test(t) ||
      (/(?:^|[\s/|(\[])(?:dung|d)(?=$|[\s/|)\]])/i.test(tf) &&
        /(?:^|[\s/|(\[])(?:sai|s)(?=$|[\s/|)\]])/i.test(tf) &&
        t.length < 56)
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
      if (maxGap > 58) break;
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
      if (gap >= 22 && mid >= pageWidth * 0.25 && mid <= pageWidth * 0.75) {
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
  pageHeight: number,
  clusterImages: PdfGeomBox[],
  clusterBoxes: PdfGeomBox[]
): { itemsA: MatchingItem[]; itemsB: MatchingItem[]; hasFullAnchors: boolean } {
  const splitX = findBestColumnSplitX(bodyLines, pageWidth);
  const leftRows: Array<{ text: string; minX: number; maxX: number; topY: number; bottomY: number }> = [];
  const rightRows: Array<{ text: string; minX: number; maxX: number; topY: number; bottomY: number }> = [];

  for (const ln of bodyLines) {
    if (BLANK_WRITING_LINE_RE.test(ln.text)) continue;
    const leftItems = ln.items.filter((it) => it.x + it.width * 0.35 < splitX);
    const rightItems = ln.items.filter((it) => it.x + it.width * 0.35 >= splitX);

    const leftStr = joinLineItemsWithGap(leftItems);
    const rightStr = joinLineItemsWithGap(rightItems);
    const leftFold = foldVietnamese(leftStr);
    const rightFold = foldVietnamese(rightStr);

    const bothColsPresent = Boolean(leftStr) && Boolean(rightStr);

    if (
      leftStr &&
      !/^(?:cot\s*(?:a|1|trai|ben\s*trai)|thong\s+tin\s*$|tinh\s+huong\s*$|cot\s+thong\s+tin\s*$)/i.test(leftFold)
    ) {
      const minX = Math.min(...leftItems.map((i) => i.x));
      const maxX = Math.max(...leftItems.map((i) => i.x + i.width));
      const prev = leftRows[leftRows.length - 1];
      const startsNewItem = SUB_ITEM_MARKER_RE.test(leftStr);
      const yGap = prev ? ln.y - prev.bottomY : 999;
      const looksLikeWrappedContinuation =
        Boolean(prev) &&
        !startsNewItem &&
        ((!bothColsPresent && yGap <= 16) ||
          (bothColsPresent && (yGap <= 5 || /^[a-zà-ỹ]/.test(leftStr))));
      if (prev && looksLikeWrappedContinuation) {
        prev.text = `${prev.text} ${leftStr}`.trim();
        prev.maxX = Math.max(prev.maxX, maxX);
        prev.bottomY = Math.max(prev.bottomY, ln.y + ln.height);
      } else {
        leftRows.push({ text: leftStr, minX, maxX, topY: ln.y, bottomY: ln.y + ln.height });
      }
    }

    if (
      rightStr &&
      !/^(?:cot\s*(?:b|2|phai|ben\s*phai)|quyet\s+dinh\s*$|ket\s+qua\s*$|cot\s+quyet\s+dinh\s*$)/i.test(rightFold)
    ) {
      const minX = Math.min(...rightItems.map((i) => i.x));
      const maxX = Math.max(...rightItems.map((i) => i.x + i.width));
      const prev = rightRows[rightRows.length - 1];
      const startsNewItem = SUB_ITEM_MARKER_RE.test(rightStr);
      const yGap = prev ? ln.y - prev.bottomY : 999;
      const looksLikeWrappedContinuation =
        Boolean(prev) &&
        !startsNewItem &&
        ((!bothColsPresent && yGap <= 16) ||
          (bothColsPresent && (yGap <= 5 || /^[a-zà-ỹ]/.test(rightStr))));
      if (prev && looksLikeWrappedContinuation) {
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
      nx: clampNorm(leftPortX / pageWidth, 0.14, 0.56),
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

  // Case 1: Both text columns found
  if (itemsA.length >= 2 && itemsB.length >= 2) {
    return { itemsA, itemsB, hasFullAnchors: true };
  }

  // Case 2: Left column has text (>= 2), right column has PDF images or vector cards!
  if (itemsA.length >= 2 && itemsB.length < 2) {
    const rightObjects = [...clusterImages, ...clusterBoxes]
      .filter((b) => b.x + b.width * 0.3 >= splitX && b.width >= 30 && b.height >= 16)
      .sort((a, b) => a.y - b.y);
    // Deduplicate overlapping right boxes/images
    const dedupRight: PdfGeomBox[] = [];
    for (const obj of rightObjects) {
      if (!dedupRight.some((d) => Math.abs(d.y - obj.y) < 18)) {
        dedupRight.push(obj);
      }
    }

    if (dedupRight.length >= 2) {
      const rightFromGeom: MatchingItem[] = dedupRight.slice(0, 8).map((box, idx) => ({
        id: `det-b-${idx + 1}`,
        label: `Hình / Mục ${String.fromCharCode(65 + idx)}`,
        anchor: {
          nx: clampNorm(Math.max(splitX + 6, box.x - 6) / pageWidth, 0.46, 0.88),
          ny: clampNorm((box.y + box.height / 2) / pageHeight),
        },
      }));
      return { itemsA, itemsB: rightFromGeom, hasFullAnchors: true };
    }

    // Fallback when right column is pure rasterized illustrations inside a single image
    const synthesizedB: MatchingItem[] = itemsA.map((a, idx) => ({
      id: `det-b-${idx + 1}`,
      label: `Hình / Mục ${String.fromCharCode(65 + idx)}`,
      anchor: {
        nx: clampNorm(Math.max(0.62, (splitX + 24) / pageWidth), 0.54, 0.84),
        ny: a.anchor!.ny,
      },
    }));
    return { itemsA, itemsB: synthesizedB, hasFullAnchors: true };
  }

  // Case 3: Pure vector cards / images on left & right columns (e.g., matching images with images or cards)
  const allCards = [...clusterImages, ...clusterBoxes]
    .filter((b) => b.width >= 36 && b.height >= 18 && b.width < pageWidth * 0.6)
    .sort((a, b) => a.y - b.y);
  const leftCards = allCards.filter((b) => b.x + b.width / 2 < pageWidth * 0.48);
  const rightCards = allCards.filter((b) => b.x + b.width / 2 >= pageWidth * 0.52);
  if (leftCards.length >= 2 && rightCards.length >= 2) {
    const geomA: MatchingItem[] = leftCards.slice(0, 8).map((box, idx) => ({
      id: `det-a-${idx + 1}`,
      label: `Mục ${idx + 1}`,
      anchor: {
        nx: clampNorm((box.x + box.width + 6) / pageWidth, 0.15, 0.54),
        ny: clampNorm((box.y + box.height / 2) / pageHeight),
      },
    }));
    const geomB: MatchingItem[] = rightCards.slice(0, 8).map((box, idx) => ({
      id: `det-b-${idx + 1}`,
      label: `Mục ${String.fromCharCode(65 + idx)}`,
      anchor: {
        nx: clampNorm((box.x - 6) / pageWidth, 0.46, 0.88),
        ny: clampNorm((box.y + box.height / 2) / pageHeight),
      },
    }));
    return { itemsA: geomA, itemsB: geomB, hasFullAnchors: true };
  }

  // Case 4: Horizontal 2-row matching (top row items matched down to bottom row items!)
  if (bodyLines.length >= 2) {
    const topLine = bodyLines[0];
    const bottomLine = bodyLines[bodyLines.length - 1];
    if (
      topLine !== bottomLine &&
      topLine.items.length >= 2 &&
      bottomLine.items.length >= 2 &&
      bottomLine.y - topLine.y >= 34
    ) {
      const topSegments = splitLineIntoHorizontalCells(topLine, 26);
      const bottomSegments = splitLineIntoHorizontalCells(bottomLine, 26);
      if (topSegments.length >= 2 && bottomSegments.length >= 2) {
        const rowA: MatchingItem[] = topSegments.slice(0, 6).map((seg, idx) => ({
          id: `det-a-${idx + 1}`,
          label: seg.text,
          anchor: {
            nx: clampNorm((seg.x + seg.width / 2) / pageWidth, 0.08, 0.92),
            ny: clampNorm((topLine.y + topLine.height + 8) / pageHeight),
          },
        }));
        const rowB: MatchingItem[] = bottomSegments.slice(0, 6).map((seg, idx) => ({
          id: `det-b-${idx + 1}`,
          label: seg.text,
          anchor: {
            nx: clampNorm((seg.x + seg.width / 2) / pageWidth, 0.08, 0.92),
            ny: clampNorm((bottomLine.y - 8) / pageHeight),
          },
        }));
        return { itemsA: rowA, itemsB: rowB, hasFullAnchors: true };
      }
    }
  }

  return {
    itemsA,
    itemsB,
    hasFullAnchors: false,
  };
}

function splitLineIntoHorizontalCells(
  ln: TextLineBlock,
  minGap: number
): Array<{ text: string; x: number; width: number }> {
  if (ln.items.length === 0) return [];
  const groups: TextLineItem[][] = [[ln.items[0]]];
  for (let i = 1; i < ln.items.length; i++) {
    const prev = ln.items[i - 1];
    const cur = ln.items[i];
    if (cur.x - (prev.x + prev.width) >= minGap) {
      groups.push([cur]);
    } else {
      groups[groups.length - 1].push(cur);
    }
  }
  return groups
    .map((g) => {
      const minX = Math.min(...g.map((i) => i.x));
      const maxX = Math.max(...g.map((i) => i.x + i.width));
      return { text: joinLineItemsWithGap(g), x: minX, width: maxX - minX };
    })
    .filter((s) => s.text.length > 0);
}

function extractMcqOptionsWithAnchors(
  cluster: QuestionCluster,
  stemEndIdx: number,
  pageWidth: number,
  pageHeight: number,
  clusterCheckboxes: PdfGeomBox[]
): Array<{ id: string; label: string; text: string; anchor?: PdfPointAnchor }> {
  const options: Array<{ id: string; label: string; text: string; anchor?: PdfPointAnchor }> = [];
  const bodyLines = cluster.lines.slice(stemEndIdx + 1);
  const scanLines = bodyLines.length > 0 ? bodyLines : cluster.lines;

  // Pattern A: Explicit A. / B. / C. / D. or A) / B) / C) / D) (supports 1, 2, or 4 options on same line)
  for (const ln of scanLines) {
    const matches = [
      ...ln.text.matchAll(
        /(?:^|\s)([☐□▢◯○]\s*)?([A-D])[\.\)]\s*([^\n]+?)(?=(?:\s+[☐□▢◯○]?\s*[A-D][\.\)]\s)|$)/g
      ),
    ];
    if (matches.length > 0) {
      for (const m of matches) {
        const letter = m[2].toUpperCase();
        const optText = m[3].replace(/^[☐□▢◯○]\s*/, '').trim();
        const tokenItem = ln.items.find((it) =>
          new RegExp(`^(?:[☐□▢◯○]\\s*)?${letter}[\\.\\)]?$`).test(it.str.trim()) ||
          new RegExp(`^(?:[☐□▢◯○]\\s*)?${letter}[\\.\\)]`).test(it.str.trim())
        );
        // Check if there is an actual PDF vector checkbox right before this option!
        const lnMidY = ln.y + ln.height / 2;
        const nearCb = clusterCheckboxes.find(
          (cb) =>
            Math.abs(cb.y + cb.height / 2 - lnMidY) <= 14 &&
            tokenItem &&
            cb.x <= tokenItem.x + 8 &&
            tokenItem.x - (cb.x + cb.width) <= 28
        );
        const anchorX = nearCb
          ? nearCb.x + nearCb.width / 2
          : tokenItem
            ? Math.max(14, tokenItem.x - 16)
            : Math.max(14, ln.x - 16);
        const anchorY = nearCb ? nearCb.y + nearCb.height / 2 : lnMidY;
        if (!options.some((o) => o.id === letter)) {
          options.push({
            id: letter,
            label: letter,
            text: optText || `Phương án ${letter}`,
            anchor: {
              nx: clampNorm(anchorX / pageWidth, 0.02, 0.95),
              ny: clampNorm(anchorY / pageHeight),
            },
          });
        }
      }
    }
  }

  if (options.length >= 2) {
    return options.slice(0, 6);
  }

  // Pattern B: Unicode / PUA Checkbox symbols (☐, □, ▢, ◯, ○, [ ], ( )) — supports 1 or 2 columns per line!
  const cbOptions: Array<{ id: string; label: string; text: string; anchor?: PdfPointAnchor }> = [];
  for (const ln of bodyLines) {
    const cells = splitLineIntoHorizontalCells(ln, 24);
    for (const cell of cells) {
      const m = cell.text.match(/^([☐□▢◯○]|\[ ?\]|\( ?\))\s*(.+)$/);
      if (m) {
        const idx = cbOptions.length;
        const letter = String.fromCharCode(65 + idx);
        const anchorX = cell.x + 7;
        cbOptions.push({
          id: letter,
          label: letter,
          text: m[2].trim(),
          anchor: {
            nx: clampNorm(anchorX / pageWidth, 0.02, 0.95),
            ny: clampNorm((ln.y + ln.height / 2) / pageHeight),
          },
        });
      }
    }
  }
  if (cbOptions.length >= 2) {
    return cbOptions.slice(0, 6);
  }

  // Pattern C: REAL PDF VECTOR CHECKBOXES (extracted via PDF.js getOperatorList!)
  // Pairs each drawn square with its adjacent option text line — even when PDF has NO "A./B./C." or "☐" text!
  if (clusterCheckboxes.length >= 2 && clusterCheckboxes.length <= 8) {
    // Check if checkboxes are NOT a 2-column Đúng/Sai table on the right side
    const rightSideCbs = clusterCheckboxes.filter((cb) => cb.x > pageWidth * 0.62);
    const isLikelyTfRightTable = rightSideCbs.length >= 4 && rightSideCbs.length === clusterCheckboxes.length;
    if (!isLikelyTfRightTable) {
      const sortedCbs = [...clusterCheckboxes].sort((a, b) =>
        Math.abs(a.y - b.y) > 10 ? a.y - b.y : a.x - b.x
      );
      const vecOpts: Array<{ id: string; label: string; text: string; anchor?: PdfPointAnchor }> = [];
      for (let i = 0; i < sortedCbs.length; i++) {
        const cb = sortedCbs[i];
        const cbMidY = cb.y + cb.height / 2;
        const cbRight = cb.x + cb.width;
        // Find option text directly to the right of this checkbox (or right below it)
        const matchingLine = bodyLines.find(
          (ln) =>
            Math.abs((ln.y + ln.height / 2) - cbMidY) <= 14 &&
            ln.items.some((it) => it.x >= cbRight - 6)
        );
        let optText = '';
        if (matchingLine) {
          const rightItems = matchingLine.items.filter(
            (it) => it.x >= cbRight - 6 && it.x < cbRight + pageWidth * 0.55
          );
          optText = joinLineItemsWithGap(rightItems).replace(/^[A-D][\.\)]\s*/, '').trim();
        }
        const letter = String.fromCharCode(65 + i);
        vecOpts.push({
          id: letter,
          label: letter,
          text: optText || `Phương án ${letter}`,
          anchor: {
            nx: clampNorm((cb.x + cb.width / 2) / pageWidth, 0.02, 0.96),
            ny: clampNorm(cbMidY / pageHeight),
          },
        });
      }
      if (vecOpts.length >= 2) {
        return vecOpts.slice(0, 6);
      }
    }
  }

  // Pattern D: Prompt explicitly asks to select/tick/circle an option AND clean body lines exist
  // (handles PDFs where empty squares were rasterized into a background image)
  const foldedAll = foldVietnamese(cluster.fullText);
  if (
    /(o\s+trong|o\s+vuong|danh\s+dau|tich\s+vao|khoanh\s+(?:tron|vao)|chon\s+(?:dap\s+an|phuong\s+an|cau\s+tra\s+loi|y\s+dung|chu\s+cai)|to\s+mau\s+vao\s+o)/i.test(
      foldedAll
    ) &&
    bodyLines.length >= 2
  ) {
    const cleanRows = bodyLines.filter(
      (l) => l.text.trim().length >= 2 && !BLANK_WRITING_LINE_RE.test(l.text)
    );
    // Merge wrapped lines if a row is indented further right than the typical option start X
    const minBodyX = Math.min(...cleanRows.map((r) => r.x));
    const mergedOptionRows: TextLineBlock[] = [];
    for (const row of cleanRows) {
      const prev = mergedOptionRows[mergedOptionRows.length - 1];
      const isContinuation =
        prev &&
        row.y - (prev.y + prev.height) <= 12 &&
        row.x > minBodyX + 12 &&
        !/^[•\-–—A-Da-d1-6][\.\)\s]/.test(row.text);
      if (isContinuation) {
        prev.text = `${prev.text} ${row.text}`.trim();
        prev.height = row.y + row.height - prev.y;
      } else {
        mergedOptionRows.push({ ...row });
      }
    }
    if (mergedOptionRows.length >= 2 && mergedOptionRows.length <= 6) {
      return mergedOptionRows.map((ln, idx) => {
        const letter = String.fromCharCode(65 + idx);
        const anchorX = Math.max(16, ln.x - 18);
        return {
          id: letter,
          label: letter,
          text: ln.text.replace(/^[•\-–—]\s*/, '').trim(),
          anchor: {
            nx: clampNorm(anchorX / pageWidth, 0.02, 0.95),
            ny: clampNorm((ln.y + ln.height / 2) / pageHeight),
          },
        };
      });
    }
  }

  return [];
}

function suggestTypesForUnclassified(
  folded: string,
  bodyLines: TextLineBlock[],
  clusterCheckboxes: PdfGeomBox[],
  clusterImages: PdfGeomBox[]
): { reason: string; suggested: InteractiveQuestionType[] } {
  const suggested: InteractiveQuestionType[] = [];
  if (clusterCheckboxes.length > 0 || bodyLines.length >= 3) {
    suggested.push('mcq');
  }
  if (clusterImages.length >= 2) {
    suggested.push('matching', 'diagram_label');
  }
  if (/\?/.test(folded) || bodyLines.length <= 1) {
    suggested.push('short', 'essay');
  }
  // Ensure 3 distinct helpful suggestions
  for (const fallback of ['mcq', 'matching', 'tf', 'essay', 'short'] as InteractiveQuestionType[]) {
    if (suggested.length >= 3) break;
    if (!suggested.includes(fallback)) suggested.push(fallback);
  }

  let reason =
    'Đề bài không ghi rõ lệnh chọn, nối, điền hay viết và không có ô chọn/dòng kẻ tương ứng trên PDF.';
  if (bodyLines.length === 0) {
    reason =
      'Chỉ đọc được 1 dòng tiêu đề câu hỏi (chưa thấy phương án, bảng hoặc khoảng dòng trả lời đi kèm).';
  } else if (clusterImages.length > 0) {
    reason =
      'Câu hỏi có hình minh họa đi kèm nhưng chưa có từ khóa nêu rõ yêu cầu (chọn, nối, chú thích hay viết).';
  }

  return { reason, suggested: suggested.slice(0, 3) };
}

function classifyQuestionCluster(
  cluster: QuestionCluster,
  pageWidth: number,
  pageHeight: number,
  nextClusterStartY: number,
  geometry?: ExtractedPageGeometry
): ClassificationOutput {
  const text = cluster.fullText;
  const folded = foldVietnamese(text);
  // Slice PDF vector & image geometry belonging strictly to this question's vertical band first
  const bandTop = Math.max(0, cluster.startY - 6);
  const bandBottom = Math.min(pageHeight, nextClusterStartY - 2);
  const clusterCheckboxes = (geometry?.checkboxes || []).filter(
    (b) => b.y + b.height / 2 >= bandTop && b.y + b.height / 2 <= bandBottom
  );
  const clusterHlines = (geometry?.horizontalLines || []).filter(
    (l) => l.y1 >= bandTop && l.y1 <= bandBottom
  );
  const clusterBoxes = (geometry?.boxes || []).filter(
    (b) => b.y + b.height / 2 >= bandTop && b.y + b.height / 2 <= bandBottom
  );
  const clusterImages = (geometry?.images || []).filter(
    (b) => b.y + b.height / 2 >= bandTop && b.y + b.height / 2 <= bandBottom
  );

  const stemEndIdx = findStemEndIndex(cluster.lines, clusterCheckboxes);
  const stemText = cluster.lines
    .slice(0, stemEndIdx + 1)
    .map((l) => l.text)
    .join(' ');
  const stemFolded = foldVietnamese(stemText);
  const bodyLines = cluster.lines.slice(stemEndIdx + 1);
  const nonBlankLines = cluster.lines.filter((l) => !BLANK_WRITING_LINE_RE.test(l.text));
  const contentBottomY =
    nonBlankLines.length > 0
      ? Math.max(...nonBlankLines.map((l) => l.y + l.height))
      : cluster.endY;
  const subItems = extractSubItemsFromCluster(cluster.lines);

  // --------------------------------------------------------------------------
  // 1. MATCHING (HIGH PRIORITY — "Hãy nối", "Em hãy nối", "Nối mỗi ... với ...", "Ghép đôi")
  // --------------------------------------------------------------------------
  const isMatchingPrompt =
    /(hay\s+noi|em\s+hay\s+noi|noi\s+.{0,60}\s+voi|noi\s+(?:cot|moi|cac|thong\s+tin|hinh|y|tu|cap|o|cau|tranh|anh)|ghep\s*doi|ghep\s*noi|ghep\s+moi|ke\s+duong\s+noi|ve\s+duong\s+noi|keo\s+tha|cot\s*(?:a|1|trai|ben\s*trai).{0,40}cot\s*(?:b|2|phai|ben\s*phai)|match\s+)/i.test(
      folded
    );

  if (isMatchingPrompt) {
    const isDrag = /(keo\s+tha|drag\s*(?:and|&)\s*drop)/i.test(folded);
    const { itemsA, itemsB, hasFullAnchors } = extractMatchingColumns(
      bodyLines.length > 0 ? bodyLines : cluster.lines.slice(1),
      pageWidth,
      pageHeight,
      clusterImages,
      clusterBoxes
    );

    if (hasFullAnchors && !isDrag) {
      return {
        type: 'matching',
        classificationStatus: 'classified',
        overlayMode: 'anchored',
        matchingMode: 'line',
        needsReview: true,
        detectionNote: `Nhận diện đúng dạng Nối cột (${itemsA.length} mục bên trái · ${itemsB.length} mục bên phải). Học sinh vẽ đường nối trực tiếp trên trang PDF; thầy cô hãy chọn cặp đáp án đúng.`,
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
  // 2. TRUE / FALSE (Đúng / Sai — header columns OR 2 right-aligned vector checkbox columns)
  // --------------------------------------------------------------------------
  const tfHeaderLine = cluster.lines.find((l) => {
    const hasTrue = l.items.some((it) => /^(?:dung|d|đ)$/i.test(foldVietnamese(it.str)));
    const hasFalse = l.items.some((it) => /^(?:sai|s)$/i.test(foldVietnamese(it.str)));
    return hasTrue && hasFalse;
  });

  // Also detect 2 right-aligned vertical columns of vector checkboxes!
  const rightCbs = clusterCheckboxes.filter((cb) => cb.x > pageWidth * 0.58);
  const tfColClusters: number[] = [];
  for (const cb of rightCbs) {
    const cx = cb.x + cb.width / 2;
    if (!tfColClusters.some((x) => Math.abs(x - cx) < 18)) {
      tfColClusters.push(cx);
    }
  }
  tfColClusters.sort((a, b) => a - b);
  const hasTwoRightCheckboxColumns = tfColClusters.length === 2 && rightCbs.length >= 4;

  const isExplicitChoiceStem =
    /(dap\s+an\s+dung|phuong\s+an\s+dung|cau\s+tra\s+loi\s+dung|y\s+dung\s+nhat|chon\s+(?:mot|1|cac|tat\s+ca)\s+(?:dap\s+an|phuong\s+an))/i.test(
      stemFolded
    );

  const isTfPrompt =
    /(dung\s*[/\-–]\s*sai|dung\s+(?:hay|hoac)\s+sai|chon\s+d\s+(?:hoac|hay)\s+s|bang\s+dung|danh\s+dau.{0,40}dung.{0,20}sai|ghi\s+d.{0,25}s|dien\s+d.{0,25}s|dung\s*\(\s*d\s*\)|sai\s*\(\s*s\s*\)|nhan\s+dinh.{0,25}dung.{0,25}sai|true\s*[/\-]\s*false)/i.test(
      folded
    ) ||
    Boolean(tfHeaderLine) ||
    hasTwoRightCheckboxColumns ||
    (!isExplicitChoiceStem &&
      /(?:^|[\s/|(\[.,;:])dung(?=$|[\s/|)\].:,;])/i.test(stemFolded) &&
      /(?:^|[\s/|(\[.,;:])sai(?=$|[\s/|)\].:,;])/i.test(stemFolded));

  if (isTfPrompt) {
    let trueNx = 0.78;
    let falseNx = 0.89;
    let hasTableColumns = false;
    let headerIndex = stemEndIdx;

    if (tfHeaderLine) {
      const idx = cluster.lines.indexOf(tfHeaderLine);
      if (idx > 0) headerIndex = idx;
      const trueItem = tfHeaderLine.items.find((it) => /^(?:dung|d)$/i.test(foldVietnamese(it.str)));
      const falseItem = tfHeaderLine.items.find((it) => /^(?:sai|s)$/i.test(foldVietnamese(it.str)));
      if (trueItem && falseItem) {
        trueNx = clampNorm((trueItem.x + trueItem.width / 2) / pageWidth, 0.52, 0.94);
        falseNx = clampNorm((falseItem.x + falseItem.width / 2) / pageWidth, 0.6, 0.97);
        hasTableColumns = Math.abs(falseNx - trueNx) >= 0.04;
      }
    } else if (hasTwoRightCheckboxColumns) {
      trueNx = clampNorm(tfColClusters[0] / pageWidth, 0.52, 0.94);
      falseNx = clampNorm(tfColClusters[1] / pageWidth, 0.6, 0.97);
      hasTableColumns = Math.abs(falseNx - trueNx) >= 0.04;
    }

    const rowCandidates = cluster.lines.slice(headerIndex + 1);
    const stmts: TfStatement[] = [];
    for (const ln of rowCandidates) {
      if (BLANK_WRITING_LINE_RE.test(ln.text)) continue;
      const lnFold = foldVietnamese(ln.text);
      if (/^(?:stt|noi\s+dung|phat\s+bieu|nhan\s+dinh|cau|dung|sai|d|s|\s)+$/i.test(lnFold)) continue;

      const prefixed = ln.text.match(/^([a-dA-D]|[1-6])[\)\.]\s*(.+)$/);
      const leftItems = hasTableColumns
        ? ln.items.filter((it) => it.x < Math.min(trueNx, falseNx) * pageWidth - 12)
        : ln.items;
      const leftOnlyText = joinLineItemsWithGap(leftItems)
        .replace(/(?:^|\s)(?:đúng|sai|đ|s|☐|□)\s*$/gi, '')
        .trim();

      if (prefixed) {
        const cleanBody = leftOnlyText
          .replace(/^([a-dA-D]|[1-6])[\)\.]\s*/, '')
          .trim();
        // Snap rowAnchor Y to actual vector checkbox row if available
        const nearCb = rightCbs.find((cb) => Math.abs((cb.y + cb.height / 2) - (ln.y + ln.height / 2)) <= 14);
        const anchorY = nearCb ? nearCb.y + nearCb.height / 2 : ln.y + ln.height / 2;
        stmts.push({
          id: `tf-${stmts.length + 1}`,
          label: `${prefixed[1].toLowerCase()})`,
          text: cleanBody || prefixed[2].trim(),
          rowAnchor: hasTableColumns
            ? {
                ny: clampNorm(anchorY / pageHeight),
                trueNx,
                falseNx,
                rowNh: clampNorm(Math.max(18, ln.height + 6) / pageHeight, 0.02, 0.08),
              }
            : undefined,
        });
      } else if (hasTableColumns && leftOnlyText.length >= 5) {
        // Check if this is a wrapped continuation of the previous statement (no checkbox on this line)
        const prev = stmts[stmts.length - 1];
        const hasCbOnThisLine = rightCbs.some(
          (cb) => Math.abs((cb.y + cb.height / 2) - (ln.y + ln.height / 2)) <= 12
        );
        if (prev && prev.rowAnchor && !hasCbOnThisLine && (ln.y / pageHeight) - prev.rowAnchor.ny < 0.028) {
          prev.text = `${prev.text} ${leftOnlyText}`.trim();
        } else {
          const letter = String.fromCharCode(97 + stmts.length);
          const nearCb = rightCbs.find((cb) => Math.abs((cb.y + cb.height / 2) - (ln.y + ln.height / 2)) <= 14);
          const anchorY = nearCb ? nearCb.y + nearCb.height / 2 : ln.y + ln.height / 2;
          stmts.push({
            id: `tf-${stmts.length + 1}`,
            label: `${letter})`,
            text: leftOnlyText,
            rowAnchor: {
              ny: clampNorm(anchorY / pageHeight),
              trueNx,
              falseNx,
              rowNh: clampNorm(Math.max(18, ln.height + 6) / pageHeight, 0.02, 0.08),
            },
          });
        }
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
  if (/(sap\s+xep.{0,30}thu\s+tu|sap\s+xep.{0,30}trinh\s+tu|dung\s+thu\s+tu|thu\s+tu\s+cac\s+buoc|put.{0,20}in\s+order)/i.test(folded)) {
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
  // 4. MULTIPLE CHOICE (Single Choice vs Multi-Select — text + Unicode + PDF Vector Checkboxes!)
  // --------------------------------------------------------------------------
  const extractedOptions = extractMcqOptionsWithAnchors(
    cluster,
    stemEndIdx,
    pageWidth,
    pageHeight,
    clusterCheckboxes
  );
  const isMcqPrompt =
    /(danh\s+dau.{0,28}(?:o\s+trong|o\s+vuong|dap\s+an|cau\s+tra\s+loi|phuong\s+an|chu\s+cai)|danh\s+dau\s*(?:[✓✔×x✗]|tich|\(\s*[✓✔x]\s*\))|tich\s+vao\s+o|to\s+mau\s+vao\s+o|khoanh\s+(?:tron|vao\s+chu|vao\s+dap\s+an)|chon\s+(?:dap\s+an|phuong\s+an|cau\s+tra\s+loi|y|chu\s+cai)|em\s+hay\s+chon|hay\s+chon|trac\s+nghiem)/i.test(
      folded
    );
  const isExplicitMultiChoice =
    /(chon\s+(?:cac|nhung|tat\s+ca)|nhieu\s+(?:dap\s+an|phuong\s+an)|cac\s+(?:dap\s+an|phuong\s+an|cau\s+tra\s+loi|y)\s+dung|nhung\s+(?:dap\s+an|phuong\s+an|y)\s+dung|tat\s+ca\s+cac\s+phuong\s+an|select\s+all|chon\s+[23]\s+)/i.test(
      folded
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
        ? `Nhận diện câu ${mcqType === 'mcq_multi' ? 'Chọn nhiều đáp án' : 'Chọn một đáp án'} (${finalOpts.length} phương án) và gắn ô chọn trực tiếp tại phương án trên PDF. Thầy cô hãy chọn đáp án đúng.`
        : `Nhận diện câu ${mcqType === 'mcq_multi' ? 'Chọn nhiều đáp án' : 'Chọn một đáp án'}. Thầy cô hãy kiểm tra phương án và chọn đáp án đúng.`,
      extractedOptions: finalOpts,
      contentBottomY,
    };
  }

  // --------------------------------------------------------------------------
  // 5. FILL-IN-THE-BLANK (Inline text blanks OR inline PDF vector underlines)
  // --------------------------------------------------------------------------
  const inlineBlankLines = cluster.lines.filter(
    (l) => !BLANK_WRITING_LINE_RE.test(l.text) && /(?:_{3,}|\.{4,}|…{2,})/.test(l.text)
  );
  // Also detect inline vector horizontal underlines sitting on the same baseline as a text line
  const inlineVectorBlanks: Array<{ ln: TextLineBlock; hline: PdfGeomLine }> = [];
  for (const hline of clusterHlines) {
    const segW = Math.abs(hline.x2 - hline.x1);
    if (segW < 32 || segW > pageWidth * 0.55) continue;
    const hostLn = cluster.lines.find(
      (ln) =>
        Math.abs(hline.y1 - (ln.y + ln.height)) <= 7 &&
        ln.text.trim().length >= 8 &&
        !BLANK_WRITING_LINE_RE.test(ln.text)
    );
    if (hostLn) {
      inlineVectorBlanks.push({ ln: hostLn, hline });
    }
  }

  const isFillPrompt =
    /(dien\s+vao\s+cho|dien\s+tu|dien\s+cum\s+tu|dien\s+so|dien\s+he\s+so|dien\s+khuyet|dien\s+thong\s+tin|dien\s+noi\s+dung|dien\s+tiep|viet\s+vao\s+cho\s+cham|hoan\s+thanh\s+(?:cau|doan|bang)|fill\s+in\s+the\s+blank)/i.test(
      folded
    );

  if (isFillPrompt || inlineBlankLines.length > 0 || inlineVectorBlanks.length > 0) {
    const slots: FillBlankSlot[] = [];
    inlineBlankLines.slice(0, 6).forEach((ln, idx) => {
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

    if (slots.length === 0 && inlineVectorBlanks.length > 0) {
      inlineVectorBlanks.slice(0, 6).forEach(({ ln, hline }, idx) => {
        const x1 = Math.min(hline.x1, hline.x2);
        const w = Math.max(54, Math.abs(hline.x2 - hline.x1));
        slots.push({
          id: `fb-${idx + 1}`,
          prefix: ln.text.slice(0, 40),
          suffix: '',
          anchor: {
            nx: clampNorm(x1 / pageWidth, 0.03, 0.85),
            ny: clampNorm((ln.y + ln.height / 2) / pageHeight),
            nw: clampNorm(w / pageWidth, 0.08, 0.42),
            nh: clampNorm(Math.max(18, ln.height + 6) / pageHeight, 0.02, 0.06),
          },
        });
      });
    }

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
  if (/(chu\s+thich|dien\s+ten\s+bo\s+phan|so\s+do\s+sau|ban\s+do|luoc\s+do|ghi\s+ten\s+cac\s+bo\s+phan)/i.test(folded)) {
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
  if (/(viet\s+cong\s+thuc|bieu\s+thuc|dao\s+ham|tich\s+phan|phuong\s+trinh\s+hoa\s+hoc)/i.test(folded)) {
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
  if (/(ve\s+hinh|ve\s+do\s+thi|ve\s+bieu\s+do|phac\s+thao|bieu\s+dien\s+hinh|ve\s+so\s+do)/i.test(folded)) {
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
  if (/(doc\s+doan|doc\s+tu\s+lieu|read\s+the\s+passage|read\s+the\s+text)/i.test(folded)) {
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
  if (/(tinh\s+gia\s+tri|ket\s+qua\s+bang|bao\s+nhieu\s+%|nhap\s+so|don\s+vi\s*[:(])/i.test(folded)) {
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
  if (/(dinh\s+kem|nop\s+tep|chup\s+anh\s+san\s+pham|ma\s+nguon|file\s+thuc\s+hanh)/i.test(folded)) {
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
  if (/(ghi\s+ten|ke\s+ten|viet\s+ten|cho\s+biet\s+ten|tra\s+loi\s+ngan)/i.test(folded)) {
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
  // 13. ESSAY — ONLY WITH EXPLICIT WRITING SIGNALS OR >= 2 TEXT/VECTOR WRITING LINES!
  // --------------------------------------------------------------------------
  const blankTextLineCount = cluster.lines.filter((l) => BLANK_WRITING_LINE_RE.test(l.text)).length;
  const standaloneVectorWritingLines = clusterHlines.filter(
    (l) => Math.abs(l.x2 - l.x1) >= pageWidth * 0.35 && l.y1 > cluster.startY + 14
  ).length;
  const totalWritingLines = Math.max(blankTextLineCount, standaloneVectorWritingLines);

  const hasExplicitEssaySignal =
    /(trinh\s+bay|giai\s+thich|phan\s+tich|vi\s+sao|tai\s+sao|theo\s+em|em\s+hay\s+(?:viet|neu|ke|cho\s+biet|mo\s+ta|nhan\s+xet|tra\s+loi|chia\s+se)|viet\s+cau\s+tra\s+loi|em\s+se\s+lam\s+gi|em\s+quyet\s+dinh|quyet\s+dinh\s+cua\s+em|hay\s+(?:neu|ke|viet|cho\s+biet|tra\s+loi|mo\s+ta|nhan\s+xet)|neu\s+vi\s+du|cho\s+vi\s+du|so\s+sanh|chung\s+minh|tu\s+luan|tra\s+loi\s+cau\s+hoi|neu\s+y\s+kien|em\s+hoc\s+duoc|rut\s+ra\s+ket\s+luan)/i.test(
      folded
    ) || totalWritingLines >= 2;

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
  // 14. UNCLASSIFIED — NEVER DEFAULT TO GIANT ESSAY BOX; PROVIDE CLEAR REASON + 1-CLICK SUGGESTIONS!
  // --------------------------------------------------------------------------
  const { reason, suggested } = suggestTypesForUnclassified(
    folded,
    bodyLines,
    clusterCheckboxes,
    clusterImages
  );

  return {
    type: suggested[0] || 'short',
    classificationStatus: 'unclassified',
    unclassifiedReason: reason,
    suggestedTypes: suggested,
    overlayMode: 'drawer_button',
    needsReview: true,
    detectionNote: `${reason} Thầy cô chọn nhanh 1 dạng bài đề xuất ở danh sách bên trái.`,
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
    let lastBareNum = 0;
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

      // Bare "1.", "2.", "3."... main question support for workbooks without "Câu N" prefix:
      // - NO explicit "Câu N" exists on the page,
      // - Starts near left margin (x < pw * 0.24),
      // - Monotonically increasing question number (1, 2, 3...) — NOT sub-items like "1)", "2)"!
      // - Has an instruction/exercise verb, question mark, OR full sentence (>= 22 chars)
      // - NOT inside an active matching/TF body where 1., 2. are short sub-items
      let bareNumMatch: RegExpMatchArray | null = null;
      if (!explicitMatch && !baiMatch && !pageHasExplicitCau && ln.x < pw * 0.24) {
        const m = trimmed.match(/^(\d{1,2})\.\s+(.{10,})$/);
        if (m) {
          const numVal = Number(m[1]);
          const bodyFold = foldVietnamese(m[2]);
          const prevCluster = clusters[clusters.length - 1];
          const prevIsMatchingOrTf =
            prevCluster &&
            /(hay\s+noi|noi\s+.{0,40}\s+voi|ghep\s+doi|dung\s*[/\-]\s*sai|dung\s+hay\s+sai)/i.test(
              foldVietnamese(prevCluster.lines[0]?.text || '')
            );
          const hasActionOrQuestion =
            EXERCISE_VERB_RE.test(bodyFold) || /\?|:/.test(m[2]) || m[2].length >= 26;
          const isMonotonic =
            (lastBareNum === 0 && numVal >= 1 && numVal <= 20) ||
            (lastBareNum > 0 && numVal > lastBareNum && numVal <= lastBareNum + 3);
          const hasVerticalGap =
            !prevCluster || ln.y - prevCluster.endY >= 10 || EXERCISE_VERB_RE.test(bodyFold);

          if (isMonotonic && hasActionOrQuestion && hasVerticalGap && !(prevIsMatchingOrTf && !EXERCISE_VERB_RE.test(bodyFold))) {
            bareNumMatch = m;
            lastBareNum = numVal;
          }
        }
      }

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
      const cls = classifyQuestionCluster(cl, pw, ph, nextClusterStartY, pageData.geometry);
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
        .replace(/^\d{1,2}\.\s+/, '')
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
        unclassifiedReason: cls.unclassifiedReason,
        suggestedTypes: cls.suggestedTypes,
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

// ============================================================================
// PDF.JS VECTOR GEOMETRY & EMBEDDED IMAGE EXTRACTOR (getOperatorList)
// ============================================================================

function multiplyMatrix2D(m1: number[], m2: number[]): number[] {
  return [
    m1[0] * m2[0] + m1[2] * m2[1],
    m1[1] * m2[0] + m1[3] * m2[1],
    m1[0] * m2[2] + m1[2] * m2[3],
    m1[1] * m2[2] + m1[3] * m2[3],
    m1[0] * m2[4] + m1[2] * m2[5] + m1[4],
    m1[1] * m2[4] + m1[3] * m2[5] + m1[5],
  ];
}

function applyMatrixPoint(m: number[], x: number, y: number): { x: number; y: number } {
  return {
    x: m[0] * x + m[2] * y + m[4],
    y: m[1] * x + m[3] * y + m[5],
  };
}

function classifyVectorRect(
  x: number,
  y: number,
  w: number,
  h: number,
  pageWidth: number,
  pageHeight: number,
  geom: ExtractedPageGeometry
) {
  if (w <= 0.5 || h <= 0.5) return;
  if (w > pageWidth * 0.94 && h > pageHeight * 0.9) return; // Ignore full-page border/background

  // Thin horizontal filled rectangle -> horizontal line
  if (w >= 32 && h <= 3.5) {
    geom.horizontalLines.push({ x1: x, y1: y + h / 2, x2: x + w, y2: y + h / 2 });
    return;
  }
  // Thin vertical filled rectangle -> vertical divider
  if (h >= 24 && w <= 3.5) {
    geom.verticalLines.push({ x1: x + w / 2, y1: y, x2: x + w / 2, y2: y + h });
    return;
  }
  // Vector checkbox square (7..28pt, roughly square)
  const ratio = w / h;
  if (w >= 7 && w <= 28 && h >= 7 && h <= 28 && ratio >= 0.68 && ratio <= 1.45) {
    const dup = geom.checkboxes.some(
      (c) => Math.abs(c.x - x) < 5 && Math.abs(c.y - y) < 5
    );
    if (!dup) geom.checkboxes.push({ x, y, width: w, height: h });
    return;
  }
  // Card / Table cell box
  if (w >= 44 && h >= 16) {
    const dup = geom.boxes.some(
      (b) => Math.abs(b.x - x) < 6 && Math.abs(b.y - y) < 6 && Math.abs(b.width - w) < 8
    );
    if (!dup) geom.boxes.push({ x, y, width: w, height: h });
  }
}

async function extractPageGeometry(
  page: { getOperatorList: () => Promise<{ fnArray: number[]; argsArray: unknown[] }> },
  vp: { transform: number[]; width: number; height: number }
): Promise<ExtractedPageGeometry> {
  const geom: ExtractedPageGeometry = {
    checkboxes: [],
    horizontalLines: [],
    verticalLines: [],
    boxes: [],
    images: [],
  };

  try {
    const pdfjsLib = await getPdfjsLib();
    const OPS = pdfjsLib.OPS;
    const opList = await page.getOperatorList();
    let ctm = [...vp.transform];
    const stack: number[][] = [];

    const recordTransformedRect = (rx: number, ry: number, rw: number, rh: number) => {
      const p1 = applyMatrixPoint(ctm, rx, ry);
      const p2 = applyMatrixPoint(ctm, rx + rw, ry);
      const p3 = applyMatrixPoint(ctm, rx, ry + rh);
      const p4 = applyMatrixPoint(ctm, rx + rw, ry + rh);
      const minX = Math.min(p1.x, p2.x, p3.x, p4.x);
      const maxX = Math.max(p1.x, p2.x, p3.x, p4.x);
      const minY = Math.min(p1.y, p2.y, p3.y, p4.y);
      const maxY = Math.max(p1.y, p2.y, p3.y, p4.y);
      classifyVectorRect(minX, minY, maxX - minX, maxY - minY, vp.width, vp.height, geom);
    };

    const recordSegment = (ax: number, ay: number, bx: number, by: number) => {
      const p1 = applyMatrixPoint(ctm, ax, ay);
      const p2 = applyMatrixPoint(ctm, bx, by);
      const dx = Math.abs(p2.x - p1.x);
      const dy = Math.abs(p2.y - p1.y);
      if (dx >= 32 && dy <= 3.5) {
        geom.horizontalLines.push({
          x1: Math.min(p1.x, p2.x),
          y1: (p1.y + p2.y) / 2,
          x2: Math.max(p1.x, p2.x),
          y2: (p1.y + p2.y) / 2,
        });
      } else if (dy >= 24 && dx <= 3.5) {
        geom.verticalLines.push({
          x1: (p1.x + p2.x) / 2,
          y1: Math.min(p1.y, p2.y),
          x2: (p1.x + p2.x) / 2,
          y2: Math.max(p1.y, p2.y),
        });
      }
    };

    for (let i = 0; i < opList.fnArray.length; i++) {
      const fn = opList.fnArray[i];
      const args = opList.argsArray[i] as unknown[];

      if (fn === OPS.save) {
        stack.push([...ctm]);
      } else if (fn === OPS.restore) {
        ctm = stack.pop() || [...vp.transform];
      } else if (fn === OPS.transform && Array.isArray(args) && args.length >= 6) {
        ctm = multiplyMatrix2D(ctm, args as number[]);
      } else if (fn === OPS.rectangle && Array.isArray(args) && args.length >= 4) {
        recordTransformedRect(Number(args[0]), Number(args[1]), Number(args[2]), Number(args[3]));
      } else if (fn === OPS.constructPath && Array.isArray(args) && args.length >= 2) {
        const ops = args[0] as number[];
        const coords = args[1] as number[];
        if (Array.isArray(ops) && Array.isArray(coords)) {
          let ci = 0;
          let curX = 0;
          let curY = 0;
          let startX = 0;
          let startY = 0;
          let pathPts: Array<{ x: number; y: number }> = [];

          const flushPathPoly = () => {
            if (pathPts.length >= 4 && pathPts.length <= 10) {
              const xs = pathPts.map((p) => p.x);
              const ys = pathPts.map((p) => p.y);
              const minX = Math.min(...xs);
              const maxX = Math.max(...xs);
              const minY = Math.min(...ys);
              const maxY = Math.max(...ys);
              classifyVectorRect(minX, minY, maxX - minX, maxY - minY, vp.width, vp.height, geom);
            }
            pathPts = [];
          };

          for (const subOp of ops) {
            if (subOp === OPS.moveTo) {
              flushPathPoly();
              curX = coords[ci++] || 0;
              curY = coords[ci++] || 0;
              startX = curX;
              startY = curY;
              pathPts.push(applyMatrixPoint(ctm, curX, curY));
            } else if (subOp === OPS.lineTo) {
              const nx = coords[ci++] || 0;
              const ny = coords[ci++] || 0;
              recordSegment(curX, curY, nx, ny);
              curX = nx;
              curY = ny;
              pathPts.push(applyMatrixPoint(ctm, curX, curY));
            } else if (subOp === OPS.curveTo) {
              ci += 4;
              const nx = coords[ci++] || 0;
              const ny = coords[ci++] || 0;
              curX = nx;
              curY = ny;
              pathPts.push(applyMatrixPoint(ctm, curX, curY));
            } else if (subOp === OPS.curveTo2 || subOp === OPS.curveTo3) {
              ci += 2;
              const nx = coords[ci++] || 0;
              const ny = coords[ci++] || 0;
              curX = nx;
              curY = ny;
              pathPts.push(applyMatrixPoint(ctm, curX, curY));
            } else if (subOp === OPS.closePath) {
              recordSegment(curX, curY, startX, startY);
              flushPathPoly();
            } else if (subOp === OPS.rectangle) {
              const rx = coords[ci++] || 0;
              const ry = coords[ci++] || 0;
              const rw = coords[ci++] || 0;
              const rh = coords[ci++] || 0;
              recordTransformedRect(rx, ry, rw, rh);
            }
          }
          flushPathPoly();
        }
      } else if (
        fn === OPS.paintImageXObject ||
        fn === OPS.paintInlineImageXObject ||
        fn === OPS.paintImageMaskXObject
      ) {
        // In PDF, images are painted inside the unit square [0, 0] -> [1, 1] transformed by CTM
        const p1 = applyMatrixPoint(ctm, 0, 0);
        const p2 = applyMatrixPoint(ctm, 1, 0);
        const p3 = applyMatrixPoint(ctm, 0, 1);
        const p4 = applyMatrixPoint(ctm, 1, 1);
        const minX = Math.min(p1.x, p2.x, p3.x, p4.x);
        const maxX = Math.max(p1.x, p2.x, p3.x, p4.x);
        const minY = Math.min(p1.y, p2.y, p3.y, p4.y);
        const maxY = Math.max(p1.y, p2.y, p3.y, p4.y);
        const w = maxX - minX;
        const h = maxY - minY;
        if (w >= 26 && h >= 26 && !(w > vp.width * 0.88 && h > vp.height * 0.85)) {
          const dup = geom.images.some(
            (im) => Math.abs(im.x - minX) < 8 && Math.abs(im.y - minY) < 8
          );
          if (!dup) geom.images.push({ x: minX, y: minY, width: w, height: h });
        }
      }
    }
  } catch {
    // Graceful fallback: text analysis continues even if operator list has unsupported ops
  }

  return geom;
}

/**
 * Local browser-only OCR fallback (using existing tesseract.js) for scanned/image-only PDF pages.
 * Converts Tesseract line/word bounding boxes directly into PDF-point TextLineBlocks.
 */
async function runLocalOcrOnPdfPage(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  page: any,
  pageWidth: number,
  pageHeight: number
): Promise<TextLineBlock[]> {
  if (typeof document === 'undefined') return [];
  const scale = 2.0;
  const vp = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(vp.width);
  canvas.height = Math.round(vp.height);
  const ctx = canvas.getContext('2d');
  if (!ctx) return [];
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: ctx, viewport: vp, canvas }).promise;

  const { createWorker } = await import('tesseract.js');
  const worker = await createWorker('vie+eng', 1);
  try {
    const { data } = await worker.recognize(canvas);
    const ocrLines: TextLineBlock[] = [];
    const rawLines = (data as unknown as {
      lines?: Array<{
        text: string;
        bbox: { x0: number; y0: number; x1: number; y1: number };
        words?: Array<{ text: string; bbox: { x0: number; y0: number; x1: number; y1: number } }>;
      }>;
    }).lines;

    if (Array.isArray(rawLines) && rawLines.length > 0) {
      for (const ln of rawLines) {
        const cleaned = cleanPdfTokenText(ln.text || '').trim();
        if (!cleaned) continue;
        const x = (ln.bbox?.x0 || 0) / scale;
        const y = (ln.bbox?.y0 || 0) / scale;
        const w = Math.max(8, ((ln.bbox?.x1 || 0) - (ln.bbox?.x0 || 0)) / scale);
        const h = Math.max(8, ((ln.bbox?.y1 || 0) - (ln.bbox?.y0 || 0)) / scale);
        const items: TextLineItem[] =
          Array.isArray(ln.words) && ln.words.length > 0
            ? ln.words
                .map((wd) => ({
                  str: cleanPdfTokenText(wd.text || '').trim(),
                  x: (wd.bbox?.x0 || 0) / scale,
                  y: (wd.bbox?.y0 || 0) / scale,
                  width: Math.max(4, ((wd.bbox?.x1 || 0) - (wd.bbox?.x0 || 0)) / scale),
                  height: Math.max(8, ((wd.bbox?.y1 || 0) - (wd.bbox?.y0 || 0)) / scale),
                }))
                .filter((it) => it.str.length > 0)
            : [{ str: cleaned, x, y, width: w, height: h }];

        const centerDist = Math.abs(x + w / 2 - pageWidth / 2);
        ocrLines.push({
          text: cleaned,
          x,
          y,
          width: w,
          height: h,
          fontSize: h,
          isCentered: centerDist < pageWidth * 0.14 && w < pageWidth * 0.78,
          isAllCaps: isLineAllCaps(cleaned),
          items,
        });
      }
    }
    return mergeLeftNumberBadges(
      ocrLines.sort((a, b) => (Math.abs(a.y - b.y) > 6 ? a.y - b.y : a.x - b.x)),
      pageWidth
    );
  } finally {
    await worker.terminate().catch(() => {});
  }
}

/**
 * Analyzes an active PDF using PDF.js text layer + vector/image geometry (+ local OCR fallback on scanned pages)
 * to detect lesson titles, printed vs PDF page numbers, and interactive question regions.
 * STRICT RULE: Never modifies original PDF text and never fabricates/guesses answer keys.
 */
export async function detectQuestionsFromPdfPages(
  pdfBytes: Uint8Array,
  options?: {
    sourcePdfPages?: number[];
    printedPageOffset?: number | null;
    enableOcrFallback?: boolean;
    onProgress?: (statusText: string) => void;
  }
): Promise<PdfDetectionResult> {
  const handle = await openPdfDocument(pdfBytes);
  const enableOcr = options?.enableOcrFallback !== false;

  try {
    const totalPages = handle.proxy.numPages;
    const extractedPages: ExtractedPageInput[] = [];
    const ocrUsedPages: number[] = [];

    for (let i = 0; i < totalPages; i++) {
      const sourcePdfNum = options?.sourcePdfPages?.[i] ?? i + 1;
      options?.onProgress?.(`Đang phân tích trang ${i + 1}/${totalPages} (đọc chữ, ô chọn, bảng biểu)...`);

      const page = await handle.proxy.getPage(i + 1);
      const vp = page.getViewport({ scale: 1 });
      const [textContent, geometry] = await Promise.all([
        page.getTextContent(),
        extractPageGeometry(page, vp),
      ]);

      const rawItems = (textContent.items || []) as Array<{
        str?: string;
        transform?: number[];
        width?: number;
        height?: number;
      }>;
      const validItems = rawItems.filter(
        (it): it is { str: string; transform: number[]; width?: number; height?: number } =>
          typeof it.str === 'string' && Array.isArray(it.transform) && cleanPdfTokenText(it.str).trim().length > 0
      );

      let lines = groupTextItemsIntoLines(validItems, vp.height, vp.width);
      let effectiveTextCount = validItems.length;
      let usedOcr = false;

      // Local OCR fallback when a page is scanned / image-only (< 6 text items) in browser
      if (effectiveTextCount < 6 && enableOcr && typeof document !== 'undefined') {
        try {
          options?.onProgress?.(
            `Trang ${sourcePdfNum} là trang ảnh — đang đọc chữ bằng OCR cục bộ...`
          );
          const ocrLines = await runLocalOcrOnPdfPage(page, vp.width, vp.height);
          if (ocrLines.length >= 2) {
            lines = ocrLines;
            effectiveTextCount = ocrLines.reduce((s, l) => s + l.items.length, 0);
            usedOcr = true;
            ocrUsedPages.push(sourcePdfNum);
          }
        } catch {
          // Offline without cached tessdata or OCR failure -> continue gracefully as scan
        }
      }

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
        textItemCount: effectiveTextCount,
        lines,
        geometry,
        usedOcr,
      });
    }

    const result = analyzeExtractedPagesForQuestions(extractedPages);
    if (ocrUsedPages.length > 0) {
      result.notes.unshift(
        `Đã tự động đọc chữ bằng OCR cục bộ trên trang ảnh ${ocrUsedPages.join(', ')}. Thầy cô nên xem lướt nhanh các câu hỏi vừa nhận diện.`
      );
    }
    return result;
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
