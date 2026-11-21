import {
  PDFArray,
  PDFDocument,
  PDFName,
  PDFRawStream,
  decodePDFRawStream,
  rgb,
  type PDFFont,
  type PDFPage,
} from 'pdf-lib';
import {
  embedStudioFonts,
  extractPageTextBlocks,
  openPdfDocument,
} from '../../engines/pdf/pdfEngine';
import { extractPageGeometry, type PdfGeomBox, type PdfGeomLine } from './pdfQuestionDetector';
import type {
  InteractiveQuestion,
  TeacherQuestionKey,
} from '../../types/interactive';

export interface PdfEditableTextBlock {
  id: string;
  kind: 'text';
  pageIndex: number;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  nx: number;
  ny: number;
  nw: number;
  nh: number;
  fontSize: number;
  fontName: string;
}

export interface PdfEditableTableCell {
  id: string;
  kind: 'table-cell';
  pageIndex: number;
  row: number;
  col: number;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  nx: number;
  ny: number;
  nw: number;
  nh: number;
  fontSize: number;
}

export interface PdfEditableImage {
  id: string;
  kind: 'image';
  pageIndex: number;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  nx: number;
  ny: number;
  nw: number;
  nh: number;
}

export type PdfEditableElement =
  | PdfEditableTextBlock
  | PdfEditableTableCell
  | PdfEditableImage;

export interface PageEditableElements {
  pageIndex: number;
  pageWidth: number;
  pageHeight: number;
  isScannedPage: boolean;
  hasEditableTextLayer: boolean;
  editabilitySummary: string;
  textBlocks: PdfEditableTextBlock[];
  tableCells: PdfEditableTableCell[];
  images: PdfEditableImage[];
}

export type PdfDirectEditMode = 'direct-stream' | 'visual-replacement';

export interface PdfDirectEditResult {
  pdfBytes: Uint8Array;
  mode: PdfDirectEditMode;
  message: string;
}

export interface TextEditRequest {
  pageIndex: number;
  /** Top-origin PDF points matching PDF.js viewport(scale=1) */
  rect: { x: number; y: number; width: number; height: number };
  originalText?: string;
  newText: string;
  fontSize?: number;
  bold?: boolean;
  colorHex?: string;
  /** Optional cell border preservation for table cell edits */
  preserveCellBorder?: boolean;
}

export interface ImageEditRequest {
  pageIndex: number;
  action: 'add' | 'replace';
  /** Top-origin PDF points for placement */
  rect: { x: number; y: number; width: number; height: number };
  /** Original image bounds to cleanly clear when replacing */
  clearRect?: { x: number; y: number; width: number; height: number };
  imageBytes: Uint8Array;
  mimeType: 'image/png' | 'image/jpeg';
}

export interface QuestionSyncResult {
  question: InteractiveQuestion;
  answerKey: TeacherQuestionKey | undefined;
  changed: boolean;
  syncWarning: string | null;
}

function clampNorm(val: number, min = 0, max = 1): number {
  return Number(Math.max(min, Math.min(max, val)).toFixed(4));
}

function parseHexRgb(hex?: string) {
  const clean = (hex || '#111827').replace('#', '').trim();
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean.padEnd(6, '0');
  const num = parseInt(full.slice(0, 6), 16);
  if (Number.isNaN(num)) return rgb(0.07, 0.09, 0.15);
  return rgb(((num >> 16) & 255) / 255, ((num >> 8) & 255) / 255, (num & 255) / 255);
}

/**
 * Reconstruct real table cells from PDF vector grid lines (horizontal + vertical lines)
 * or tiled vector cell rectangles, pairing each cell with the text blocks inside it.
 */
function detectTableCellsFromGeometry(
  pageIndex: number,
  pageWidth: number,
  pageHeight: number,
  hLines: PdfGeomLine[],
  vLines: PdfGeomLine[],
  boxes: PdfGeomBox[],
  textBlocks: PdfEditableTextBlock[]
): PdfEditableTableCell[] {
  const cells: PdfEditableTableCell[] = [];

  // Cluster coordinates within tolerance (4pt)
  const clusterCoords = (vals: number[], tol = 4): number[] => {
    const sorted = [...vals].sort((a, b) => a - b);
    const out: number[] = [];
    for (const v of sorted) {
      if (out.length === 0 || Math.abs(v - out[out.length - 1]) > tol) {
        out.push(v);
      } else {
        out[out.length - 1] = (out[out.length - 1] + v) / 2;
      }
    }
    return out;
  };

  // Strategy A: intersecting horizontal and vertical vector lines forming >= 2x2 grid
  const longHLines = hLines.filter((l) => Math.abs(l.x2 - l.x1) >= 60);
  const longVLines = vLines.filter((l) => Math.abs(l.y2 - l.y1) >= 24);

  if (longHLines.length >= 3 && longVLines.length >= 3) {
    const ys = clusterCoords(longHLines.map((l) => l.y1), 5);
    const xs = clusterCoords(longVLines.map((l) => l.x1), 5);

    if (ys.length >= 2 && xs.length >= 2) {
      for (let r = 0; r < ys.length - 1; r++) {
        const yTop = ys[r];
        const yBot = ys[r + 1];
        const h = yBot - yTop;
        if (h < 14 || h > pageHeight * 0.45) continue;

        for (let c = 0; c < xs.length - 1; c++) {
          const xLeft = xs[c];
          const xRight = xs[c + 1];
          const w = xRight - xLeft;
          if (w < 24 || w > pageWidth * 0.85) continue;

          // Verify at least top or bottom horizontal line spans this column AND left/right vertical line spans this row
          const hasHBorder = longHLines.some(
            (l) =>
              (Math.abs(l.y1 - yTop) <= 6 || Math.abs(l.y1 - yBot) <= 6) &&
              Math.min(l.x1, l.x2) <= xLeft + 8 &&
              Math.max(l.x1, l.x2) >= xRight - 8
          );
          const hasVBorder = longVLines.some(
            (l) =>
              (Math.abs(l.x1 - xLeft) <= 6 || Math.abs(l.x1 - xRight) <= 6) &&
              Math.min(l.y1, l.y2) <= yTop + 8 &&
              Math.max(l.y1, l.y2) >= yBot - 8
          );
          if (!hasHBorder || !hasVBorder) continue;

          const insideBlocks = textBlocks
            .filter((tb) => {
              const cx = tb.x + tb.width / 2;
              const cy = tb.y + tb.height / 2;
              return cx >= xLeft - 2 && cx <= xRight + 2 && cy >= yTop - 2 && cy <= yBot + 2;
            })
            .sort((a, b) => (Math.abs(a.y - b.y) > 4 ? a.y - b.y : a.x - b.x));

          cells.push({
            id: `cell-${pageIndex}-r${r}-c${c}`,
            kind: 'table-cell',
            pageIndex,
            row: r,
            col: c,
            text: insideBlocks.map((b) => b.text).join('\n').trim(),
            x: xLeft,
            y: yTop,
            width: w,
            height: h,
            nx: clampNorm(xLeft / pageWidth),
            ny: clampNorm(yTop / pageHeight),
            nw: clampNorm(w / pageWidth),
            nh: clampNorm(h / pageHeight),
            fontSize: insideBlocks[0]?.fontSize || 11,
          });
        }
      }
    }
  }

  // Strategy B: tiled vector cell rectangles (when PDF draws tables as separate stroked rectangles)
  if (cells.length === 0 && boxes.length >= 4) {
    const candidateBoxes = boxes.filter(
      (b) => b.width >= 30 && b.height >= 14 && b.width <= pageWidth * 0.75 && b.height <= pageHeight * 0.35
    );
    // Keep only boxes that share an edge with at least one other box (true grid cells, not standalone callout cards)
    const gridBoxes = candidateBoxes.filter((b) =>
      candidateBoxes.some(
        (other) =>
          other !== b &&
          ((Math.abs(other.x - (b.x + b.width)) <= 4 && Math.abs(other.y - b.y) <= 6) ||
            (Math.abs(b.x - (other.x + other.width)) <= 4 && Math.abs(other.y - b.y) <= 6) ||
            (Math.abs(other.y - (b.y + b.height)) <= 4 && Math.abs(other.x - b.x) <= 6) ||
            (Math.abs(b.y - (other.y + other.height)) <= 4 && Math.abs(other.x - b.x) <= 6))
      )
    );
    const sorted = [...gridBoxes].sort((a, b) =>
      Math.abs(a.y - b.y) > 8 ? a.y - b.y : a.x - b.x
    );
    const rowYs = clusterCoords(sorted.map((b) => b.y), 8);
    const colXs = clusterCoords(sorted.map((b) => b.x), 8);
    for (const b of sorted) {
      const r = Math.max(0, rowYs.findIndex((ry) => Math.abs(ry - b.y) <= 10));
      const c = Math.max(0, colXs.findIndex((cx) => Math.abs(cx - b.x) <= 10));
      const insideBlocks = textBlocks
        .filter((tb) => {
          const cx = tb.x + tb.width / 2;
          const cy = tb.y + tb.height / 2;
          return cx >= b.x - 2 && cx <= b.x + b.width + 2 && cy >= b.y - 2 && cy <= b.y + b.height + 2;
        })
        .sort((a, b2) => (Math.abs(a.y - b2.y) > 4 ? a.y - b2.y : a.x - b2.x));
      cells.push({
        id: `cell-${pageIndex}-b${cells.length}`,
        kind: 'table-cell',
        pageIndex,
        row: r,
        col: c,
        text: insideBlocks.map((blk) => blk.text).join('\n').trim(),
        x: b.x,
        y: b.y,
        width: b.width,
        height: b.height,
        nx: clampNorm(b.x / pageWidth),
        ny: clampNorm(b.y / pageHeight),
        nw: clampNorm(b.width / pageWidth),
        nh: clampNorm(b.height / pageHeight),
        fontSize: insideBlocks[0]?.fontSize || 11,
      });
    }
  }

  return cells;
}

/**
 * Inspects a single PDF page and extracts all directly selectable PDF elements:
 * text lines (via pdfEngine.extractPageTextBlocks), table cells (via vector grid geometry),
 * and embedded images (via PDF.js operator list).
 */
export async function inspectPageEditableElements(
  pdfBytes: Uint8Array,
  pageIndex: number
): Promise<PageEditableElements> {
  const handle = await openPdfDocument(pdfBytes);
  try {
    const safeIdx = Math.max(0, Math.min(handle.proxy.numPages - 1, pageIndex));
    const page = await handle.proxy.getPage(safeIdx + 1);
    const vp = page.getViewport({ scale: 1 });
    const pw = vp.width;
    const ph = vp.height;

    const rawBlocks = await extractPageTextBlocks(handle.proxy, safeIdx);
    const textBlocks: PdfEditableTextBlock[] = rawBlocks.map((b, idx) => ({
      id: `txt-${safeIdx}-${idx}`,
      kind: 'text',
      pageIndex: safeIdx,
      text: b.text,
      x: b.x,
      y: b.y,
      width: b.width,
      height: b.height,
      nx: clampNorm(b.x / pw),
      ny: clampNorm(b.y / ph),
      nw: clampNorm(b.width / pw),
      nh: clampNorm(b.height / ph),
      fontSize: b.fontSize,
      fontName: b.fontName,
    }));

    const geom = await extractPageGeometry(page, vp);
    const tableCells = detectTableCellsFromGeometry(
      safeIdx,
      pw,
      ph,
      geom.horizontalLines,
      geom.verticalLines,
      geom.boxes,
      textBlocks
    );

    const images: PdfEditableImage[] = geom.images
      .filter((im) => im.width >= 28 && im.height >= 28)
      .map((im, idx) => ({
        id: `img-${safeIdx}-${idx}`,
        kind: 'image',
        pageIndex: safeIdx,
        label: `Hình ${idx + 1} (${Math.round(im.width)}×${Math.round(im.height)})`,
        x: im.x,
        y: im.y,
        width: im.width,
        height: im.height,
        nx: clampNorm(im.x / pw),
        ny: clampNorm(im.y / ph),
        nw: clampNorm(im.width / pw),
        nh: clampNorm(im.height / ph),
      }));

    const isScannedPage = textBlocks.length < 2;
    const hasEditableTextLayer = !isScannedPage;
    const editabilitySummary = isScannedPage
      ? 'Trang này là trang ảnh/scan (không có lớp văn bản gốc). Khi chỉnh sửa chữ, ứng dụng sẽ đặt lớp nội dung thay thế lên đúng vị trí và lưu thẳng vào PDF.'
      : 'Trang có lớp văn bản PDF. Ứng dụng sẽ ưu tiên sửa trực tiếp dòng văn bản trong PDF; nếu dòng chữ dùng font mã hóa phức tạp sẽ thông báo rõ khi dùng lớp thay thế.';

    return {
      pageIndex: safeIdx,
      pageWidth: pw,
      pageHeight: ph,
      isScannedPage,
      hasEditableTextLayer,
      editabilitySummary,
      textBlocks,
      tableCells,
      images,
    };
  } finally {
    await handle.destroy().catch(() => {});
  }
}

/**
 * Inspects ALL pages of a PDF for direct editing (cached per pdfBytes in UI).
 */
export async function inspectAllPagesEditableElements(
  pdfBytes: Uint8Array
): Promise<PageEditableElements[]> {
  const handle = await openPdfDocument(pdfBytes);
  try {
    const out: PageEditableElements[] = [];
    for (let i = 0; i < handle.proxy.numPages; i++) {
      const page = await handle.proxy.getPage(i + 1);
      const vp = page.getViewport({ scale: 1 });
      const pw = vp.width;
      const ph = vp.height;

      const rawBlocks = await extractPageTextBlocks(handle.proxy, i);
      const textBlocks: PdfEditableTextBlock[] = rawBlocks.map((b, idx) => ({
        id: `txt-${i}-${idx}`,
        kind: 'text',
        pageIndex: i,
        text: b.text,
        x: b.x,
        y: b.y,
        width: b.width,
        height: b.height,
        nx: clampNorm(b.x / pw),
        ny: clampNorm(b.y / ph),
        nw: clampNorm(b.width / pw),
        nh: clampNorm(b.height / ph),
        fontSize: b.fontSize,
        fontName: b.fontName,
      }));

      const geom = await extractPageGeometry(page, vp);
      const tableCells = detectTableCellsFromGeometry(
        i,
        pw,
        ph,
        geom.horizontalLines,
        geom.verticalLines,
        geom.boxes,
        textBlocks
      );
      const images: PdfEditableImage[] = geom.images
        .filter((im) => im.width >= 28 && im.height >= 28)
        .map((im, idx) => ({
          id: `img-${i}-${idx}`,
          kind: 'image',
          pageIndex: i,
          label: `Hình ${idx + 1}`,
          x: im.x,
          y: im.y,
          width: im.width,
          height: im.height,
          nx: clampNorm(im.x / pw),
          ny: clampNorm(im.y / ph),
          nw: clampNorm(im.width / pw),
          nh: clampNorm(im.height / ph),
        }));

      const isScannedPage = textBlocks.length < 2;
      out.push({
        pageIndex: i,
        pageWidth: pw,
        pageHeight: ph,
        isScannedPage,
        hasEditableTextLayer: !isScannedPage,
        editabilitySummary: isScannedPage
          ? 'Trang này là trang ảnh/scan (không có lớp văn bản gốc). Khi sửa chữ, ứng dụng đặt lớp nội dung thay thế lên đúng vị trí và lưu thẳng vào PDF.'
          : 'Trang có lớp văn bản PDF. Ứng dụng ưu tiên sửa trực tiếp văn bản trong PDF và thông báo rõ nếu font gốc cần dùng lớp thay thế.',
        textBlocks,
        tableCells,
        images,
      });
    }
    return out;
  } finally {
    await handle.destroy().catch(() => {});
  }
}

/**
 * Attempts genuine PDF content-stream text-block stripping for BT ... ET blocks
 * whose positioned coordinates fall inside `targetRect` (top-origin PDF points).
 * Returns the number of text-drawing blocks genuinely removed from raw content streams.
 *
 * Strictly safe: only strips BT...ET blocks that have explicit Tm/Td coordinates
 * matching the target region and contain no graphics state push/pop imbalance.
 */
function tryStripTextOperatorsInRect(
  pdfDoc: PDFDocument,
  page: PDFPage,
  rect: { x: number; y: number; width: number; height: number },
  pageHeight: number
): number {
  let removedCount = 0;
  const contentsObj = page.node.get(PDFName.of('Contents'));
  if (!contentsObj) return 0;

  const streamRefs: PDFRawStream[] = [];
  const resolved = pdfDoc.context.lookup(contentsObj);
  if (resolved instanceof PDFRawStream) {
    streamRefs.push(resolved);
  } else if (resolved instanceof PDFArray) {
    for (let i = 0; i < resolved.size(); i++) {
      const item = pdfDoc.context.lookup(resolved.get(i));
      if (item instanceof PDFRawStream) {
        streamRefs.push(item);
      }
    }
  }

  const decoder = new TextDecoder('latin1');
  const encoder = new TextEncoder();

  // Target rectangle in PDF bottom-left coordinate space (with gentle tolerance for baseline offset)
  const targetLeft = rect.x - 10;
  const targetRight = rect.x + rect.width + 14;
  const targetTopPdfY = pageHeight - rect.y + 8;
  const targetBottomPdfY = pageHeight - (rect.y + rect.height) - 8;

  for (const rawStream of streamRefs) {
    let decodedBytes: Uint8Array;
    try {
      decodedBytes = decodePDFRawStream(rawStream).decode();
    } catch {
      continue;
    }
    const contentStr = decoder.decode(decodedBytes);
    if (!contentStr.includes('BT') || !contentStr.includes('ET')) continue;

    let streamChanged = false;
    const replaced = contentStr.replace(/\bBT\b([\s\S]*?)\bET\b/g, (fullBlock, inner: string) => {
      // Only consider blocks that actually draw text (Tj, TJ, ', ")
      if (!/(?:\bTj\b|\bTJ\b|['"])/.test(inner)) return fullBlock;

      // Track text coordinates from Tm or Td / TD inside this BT...ET block
      let tx = 0;
      let ty = 0;
      let hasPos = false;
      const tmRegex =
        /(-?\d*\.?\d+)\s+(-?\d*\.?\d+)\s+(-?\d*\.?\d+)\s+(-?\d*\.?\d+)\s+(-?\d*\.?\d+)\s+(-?\d*\.?\d+)\s+Tm\b/g;
      const tdRegex = /(-?\d*\.?\d+)\s+(-?\d*\.?\d+)\s+T[dD]\b/g;

      let anyHit = false;
      let allPosInside = true;
      let posCount = 0;

      // Scan Tm occurrences
      let m: RegExpExecArray | null;
      while ((m = tmRegex.exec(inner)) !== null) {
        tx = parseFloat(m[5]);
        ty = parseFloat(m[6]);
        hasPos = true;
        posCount++;
        const inside =
          tx >= targetLeft &&
          tx <= targetRight &&
          ty >= targetBottomPdfY &&
          ty <= targetTopPdfY;
        if (inside) anyHit = true;
        else allPosInside = false;
      }

      // Scan Td/TD occurrences (cumulative relative to last Tm or origin)
      while ((m = tdRegex.exec(inner)) !== null) {
        tx += parseFloat(m[1]);
        ty += parseFloat(m[2]);
        hasPos = true;
        posCount++;
        const inside =
          tx >= targetLeft &&
          tx <= targetRight &&
          ty >= targetBottomPdfY &&
          ty <= targetTopPdfY;
        if (inside) anyHit = true;
        else allPosInside = false;
      }

      // Remove whole BT...ET ONLY if ALL positioned runs in this block fall inside the target line rect
      // (so we never accidentally delete another line on the page!)
      if (hasPos && anyHit && allPosInside && posCount >= 1) {
        streamChanged = true;
        removedCount++;
        return '';
      }

      return fullBlock;
    });

    if (streamChanged) {
      // Replace the stream contents directly with uncompressed clean bytes & remove Filter
      const nextBytes = encoder.encode(replaced);
      const mutable = rawStream as unknown as {
        contents: Uint8Array;
        dict: {
          delete: (k: PDFName) => void;
          set: (k: PDFName, v: unknown) => void;
        };
      };
      mutable.contents = nextBytes;
      mutable.dict.delete(PDFName.of('Filter'));
      mutable.dict.delete(PDFName.of('DecodeParms'));
      mutable.dict.set(PDFName.of('Length'), pdfDoc.context.obj(nextBytes.length));
    }
  }

  return removedCount;
}

/**
 * Wraps Vietnamese text into lines fitting within `maxWidth` points using the embedded font.
 */
function wrapTextToWidth(
  text: string,
  font: PDFFont,
  fontSize: number,
  maxWidth: number
): string[] {
  const safeMax = Math.max(40, maxWidth);
  const paragraphs = text.replace(/\r\n/g, '\n').split('\n');
  const out: string[] = [];

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) {
      out.push('');
      continue;
    }
    const words = trimmed.split(/\s+/);
    let current = '';
    for (const w of words) {
      const candidate = current ? `${current} ${w}` : w;
      let width = 0;
      try {
        width = font.widthOfTextAtSize(candidate, fontSize);
      } catch {
        width = candidate.length * fontSize * 0.55;
      }
      if (width <= safeMax || !current) {
        current = candidate;
      } else {
        out.push(current);
        current = w;
      }
    }
    if (current) out.push(current);
  }

  return out;
}

/**
 * Strips accents ONLY as a last-resort fallback if a StandardFont (no UTF-8 TTF) is active
 * in a headless environment where /fonts/DejaVuSans.ttf cannot be fetched.
 */
function safeEncodeForFont(text: string, font: PDFFont, fontSize: number): string {
  try {
    font.widthOfTextAtSize(text, fontSize);
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

/**
 * Applies a real text edit to a PDF page:
 * 1. Attempts genuine content-stream BT...ET text stripping in the target rectangle.
 * 2. Draws the new UTF-8 Vietnamese text cleanly at the exact position.
 * 3. Honestly reports `mode: 'direct-stream'` ONLY when original PDF text operators were removed,
 *    and `mode: 'visual-replacement'` when a clean white mask was required (scans, CID/FormXObject text).
 */
export async function applyPdfTextEdit(
  pdfBytes: Uint8Array,
  request: TextEditRequest
): Promise<PdfDirectEditResult> {
  const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const pages = pdfDoc.getPages();
  const page = pages[request.pageIndex];
  if (!page) {
    throw new Error('Không tìm thấy trang PDF cần chỉnh sửa.');
  }

  const { width: pageWidth, height: pageHeight } = page.getSize();
  const fonts = await embedStudioFonts(pdfDoc);
  const activeFont = request.bold ? fonts.sansBold : fonts.sans;

  const removedOps = tryStripTextOperatorsInRect(pdfDoc, page, request.rect, pageHeight);
  const mode: PdfDirectEditMode = removedOps > 0 ? 'direct-stream' : 'visual-replacement';

  const padX = request.preserveCellBorder ? 3 : 2;
  const padY = request.preserveCellBorder ? 3 : 2;
  const drawLeft = Math.max(4, request.rect.x + padX);
  const maxWidth = Math.max(
    40,
    request.preserveCellBorder
      ? request.rect.width - padX * 2
      : Math.min(pageWidth - drawLeft - 14, Math.max(request.rect.width + 60, 180))
  );

  // If raw content-stream text could not be removed cleanly (e.g. scanned page, FormXObject, or multi-line single BT block),
  // paint a clean white background cover over the exact old rectangle and report visual-replacement honestly.
  if (mode === 'visual-replacement') {
    const coverX = request.preserveCellBorder ? request.rect.x + 1.2 : Math.max(2, request.rect.x - 2);
    const coverW = request.preserveCellBorder
      ? Math.max(8, request.rect.width - 2.4)
      : Math.min(pageWidth - coverX - 2, request.rect.width + 6);
    const coverH = request.preserveCellBorder
      ? Math.max(8, request.rect.height - 2.4)
      : Math.max(12, request.rect.height + 4);
    const coverTopY = request.preserveCellBorder ? request.rect.y + 1.2 : Math.max(2, request.rect.y - 2);
    const coverPdfY = pageHeight - coverTopY - coverH;

    page.drawRectangle({
      x: coverX,
      y: Math.max(0, coverPdfY),
      width: coverW,
      height: coverH,
      color: rgb(1, 1, 1),
    });
  }

  const cleanText = request.newText.trim();
  if (cleanText.length > 0) {
    const baseFontSize = Math.max(8, Math.min(26, request.fontSize || 11.5));
    const safeText = safeEncodeForFont(cleanText, activeFont, baseFontSize);
    const lines = wrapTextToWidth(safeText, activeFont, baseFontSize, maxWidth);
    const lineHeight = baseFontSize * 1.28;
    const textColor = parseHexRgb(request.colorHex);

    lines.forEach((line, idx) => {
      if (!line) return;
      const topY = request.rect.y + padY + idx * lineHeight;
      const baselinePdfY = pageHeight - topY - baseFontSize * 0.85;
      if (baselinePdfY < 6) return;
      if (request.preserveCellBorder && topY + baseFontSize * 0.6 > request.rect.y + request.rect.height) {
        return;
      }
      page.drawText(line, {
        x: drawLeft,
        y: baselinePdfY,
        size: baseFontSize,
        font: activeFont,
        color: textColor,
      });
    });
  }

  const nextBytes = await pdfDoc.save();
  return {
    pdfBytes: new Uint8Array(nextBytes),
    mode,
    message:
      mode === 'direct-stream'
        ? 'Đã sửa trực tiếp nội dung văn bản trong tệp PDF.'
        : 'Trang PDF này là ảnh scan hoặc dòng chữ gộp chung luồng font gốc — ứng dụng đã ghi nội dung mới bằng lớp thay thế sạch trực tiếp vào tệp PDF.',
  };
}

/**
 * Applies an edit strictly inside a detected PDF table cell while keeping cell borders intact.
 */
export async function applyPdfTableCellEdit(
  pdfBytes: Uint8Array,
  cell: PdfEditableTableCell,
  newText: string,
  options?: { fontSize?: number; bold?: boolean; colorHex?: string }
): Promise<PdfDirectEditResult> {
  return applyPdfTextEdit(pdfBytes, {
    pageIndex: cell.pageIndex,
    rect: { x: cell.x, y: cell.y, width: cell.width, height: cell.height },
    originalText: cell.text,
    newText,
    fontSize: options?.fontSize || Math.max(9, Math.min(13, cell.fontSize || 10.5)),
    bold: options?.bold,
    colorHex: options?.colorHex,
    preserveCellBorder: true,
  });
}

/**
 * Adds a new PNG/JPG image or replaces an existing image region directly inside the PDF bytes.
 */
export async function applyPdfImageEdit(
  pdfBytes: Uint8Array,
  request: ImageEditRequest
): Promise<PdfDirectEditResult> {
  const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const page = pdfDoc.getPages()[request.pageIndex];
  if (!page) {
    throw new Error('Không tìm thấy trang PDF cần chèn/thay hình ảnh.');
  }

  const { height: pageHeight } = page.getSize();
  const embedded =
    request.mimeType === 'image/png'
      ? await pdfDoc.embedPng(request.imageBytes)
      : await pdfDoc.embedJpg(request.imageBytes);

  if (request.action === 'replace' && request.clearRect) {
    const cr = request.clearRect;
    page.drawRectangle({
      x: Math.max(0, cr.x - 1),
      y: Math.max(0, pageHeight - cr.y - cr.height - 1),
      width: cr.width + 2,
      height: cr.height + 2,
      color: rgb(1, 1, 1),
    });
  }

  // Fit aspect ratio cleanly inside the target rectangle without stretching
  const imgDims = embedded.scale(1);
  const scale = Math.min(
    request.rect.width / Math.max(1, imgDims.width),
    request.rect.height / Math.max(1, imgDims.height)
  );
  const drawW = imgDims.width * scale;
  const drawH = imgDims.height * scale;
  const offsetX = request.rect.x + (request.rect.width - drawW) / 2;
  const offsetTopY = request.rect.y + (request.rect.height - drawH) / 2;
  const pdfY = Math.max(4, pageHeight - offsetTopY - drawH);

  page.drawImage(embedded, {
    x: offsetX,
    y: pdfY,
    width: drawW,
    height: drawH,
  });

  const nextBytes = await pdfDoc.save();
  return {
    pdfBytes: new Uint8Array(nextBytes),
    mode: request.action === 'add' ? 'direct-stream' : 'visual-replacement',
    message:
      request.action === 'add'
        ? 'Đã chèn hình ảnh mới trực tiếp vào trang PDF.'
        : 'Đã thay thế hình ảnh tại vị trí đã chọn và lưu trực tiếp vào tệp PDF.',
  };
}

function normText(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Synchronizes an interactive question and its teacher answer key after PDF content
 * or interactive option edits/deletions:
 * - Updates matching prompt/option/statement/matching labels when PDF text changed.
 * - Cleans up dangling IDs ONLY when an option/item was explicitly deleted.
 * - Emits a clear Vietnamese `syncWarning` whenever an edit affects an existing answer key,
 *   NEVER silently deleting the teacher's worksheet or answer keys!
 */
export function syncQuestionAndKeyAfterEdit(
  question: InteractiveQuestion,
  answerKey: TeacherQuestionKey | undefined,
  change:
    | {
        kind: 'pdf-text-edited';
        pageIndex: number;
        rect: { x: number; y: number; width: number; height: number };
        oldText: string;
        newText: string;
      }
    | {
        kind: 'option-deleted';
        optionId: string;
      }
    | {
        kind: 'option-text-edited';
        optionId: string;
        newText: string;
      }
    | {
        kind: 'matching-item-deleted';
        side: 'A' | 'B';
        itemId: string;
      }
    | {
        kind: 'tf-statement-deleted';
        statementId: string;
      }
): QuestionSyncResult {
  const nextQ: InteractiveQuestion = JSON.parse(JSON.stringify(question)) as InteractiveQuestion;
  const nextKey: TeacherQuestionKey | undefined = answerKey
    ? (JSON.parse(JSON.stringify(answerKey)) as TeacherQuestionKey)
    : undefined;
  let changed = false;
  const warnings: string[] = [];

  if (change.kind === 'pdf-text-edited') {
    if (nextQ.region.pageIndex !== change.pageIndex) {
      return { question: nextQ, answerKey: nextKey, changed: false, syncWarning: null };
    }
    const oldNorm = normText(change.oldText);
    const cleanNew = change.newText.trim();
    if (!oldNorm) {
      return { question: nextQ, answerKey: nextKey, changed: false, syncWarning: null };
    }

    // 1. Check if edited text matches part of question prompt/title
    if (normText(nextQ.prompt).includes(oldNorm) && oldNorm.length >= 6) {
      const idx = normText(nextQ.prompt).indexOf(oldNorm);
      if (idx >= 0) {
        // Safe replacement if exact substring exists, otherwise append/update prompt cleanly
        if (nextQ.prompt.includes(change.oldText.trim())) {
          nextQ.prompt = nextQ.prompt.replace(change.oldText.trim(), cleanNew);
        } else {
          nextQ.prompt = cleanNew;
        }
        nextQ.title = nextQ.prompt.slice(0, 88);
        changed = true;
      }
    }

    // 2. Check MCQ options
    if (nextQ.mcqOptions && nextQ.mcqOptions.length > 0) {
      for (const opt of nextQ.mcqOptions) {
        const optNorm = normText(opt.text);
        if (optNorm && (optNorm === oldNorm || oldNorm.includes(optNorm) || optNorm.includes(oldNorm))) {
          opt.text = cleanNew.replace(/^[A-Da-d][\.\)]\s*/, '').trim() || cleanNew;
          changed = true;
          const affectsKey =
            nextKey?.mcqCorrectId === opt.id ||
            (nextKey?.mcqMultiCorrectIds || []).includes(opt.id);
          if (affectsKey) {
            warnings.push(
              `Nội dung phương án ${opt.label} (đang được chọn làm đáp án đúng của ${nextQ.code}) vừa thay đổi. Thầy cô hãy kiểm tra lại đáp án đúng.`
            );
          }
        }
      }
    }

    // 3. Check True/False statements
    if (nextQ.tfStatements && nextQ.tfStatements.length > 0) {
      for (const st of nextQ.tfStatements) {
        const stNorm = normText(st.text);
        if (stNorm && (stNorm === oldNorm || oldNorm.includes(stNorm) || stNorm.includes(oldNorm))) {
          st.text = cleanNew.replace(/^[a-dA-D1-6][\.\)]\s*/, '').trim() || cleanNew;
          changed = true;
          if (nextKey?.tfCorrectMap?.[st.id]) {
            warnings.push(
              `Phát biểu ${st.label} của ${nextQ.code} vừa thay đổi nội dung. Thầy cô hãy kiểm tra lại đáp án Đúng/Sai.`
            );
          }
        }
      }
    }

    // 4. Check Matching items A / B
    if (nextQ.matching) {
      for (const itemA of nextQ.matching.itemsA) {
        const aNorm = normText(itemA.label);
        if (aNorm && (aNorm === oldNorm || oldNorm.includes(aNorm) || aNorm.includes(oldNorm))) {
          itemA.label = cleanNew;
          changed = true;
          if ((nextKey?.matchingCorrectPairs || []).some((p) => p.fromId === itemA.id)) {
            warnings.push(
              `Một mục bên trái của ${nextQ.code} vừa thay đổi. Thầy cô hãy kiểm tra lại cặp nối đúng.`
            );
          }
        }
      }
      for (const itemB of nextQ.matching.itemsB) {
        const bNorm = normText(itemB.label);
        if (bNorm && (bNorm === oldNorm || oldNorm.includes(bNorm) || bNorm.includes(oldNorm))) {
          itemB.label = cleanNew;
          changed = true;
          if ((nextKey?.matchingCorrectPairs || []).some((p) => p.toId === itemB.id)) {
            warnings.push(
              `Một mục bên phải của ${nextQ.code} vừa thay đổi. Thầy cô hãy kiểm tra lại cặp nối đúng.`
            );
          }
        }
      }
    }
  } else if (change.kind === 'option-deleted') {
    if (nextQ.mcqOptions) {
      const before = nextQ.mcqOptions.length;
      nextQ.mcqOptions = nextQ.mcqOptions.filter((o) => o.id !== change.optionId);
      if (nextQ.mcqOptions.length !== before) changed = true;
    }
    if (nextKey) {
      if (nextKey.mcqCorrectId === change.optionId) {
        nextKey.mcqCorrectId = undefined;
        warnings.push(
          `Phương án vừa xóa từng là đáp án đúng của ${nextQ.code}. Thầy cô hãy chọn lại đáp án đúng mới.`
        );
      }
      if (nextKey.mcqMultiCorrectIds?.includes(change.optionId)) {
        nextKey.mcqMultiCorrectIds = nextKey.mcqMultiCorrectIds.filter(
          (id) => id !== change.optionId
        );
        warnings.push(
          `Một phương án đúng của ${nextQ.code} đã bị xóa. Thầy cô hãy kiểm tra lại danh sách đáp án đúng.`
        );
      }
    }
  } else if (change.kind === 'option-text-edited') {
    const opt = nextQ.mcqOptions?.find((o) => o.id === change.optionId);
    if (opt && opt.text !== change.newText) {
      opt.text = change.newText;
      changed = true;
      const affectsKey =
        nextKey?.mcqCorrectId === opt.id ||
        (nextKey?.mcqMultiCorrectIds || []).includes(opt.id);
      if (affectsKey) {
        warnings.push(
          `Phương án ${opt.label} đang là đáp án đúng của ${nextQ.code} vừa được sửa chữ. Thầy cô hãy rà soát lại đáp án.`
        );
      }
    }
  } else if (change.kind === 'matching-item-deleted' && nextQ.matching) {
    if (change.side === 'A') {
      nextQ.matching.itemsA = nextQ.matching.itemsA.filter((i) => i.id !== change.itemId);
    } else {
      nextQ.matching.itemsB = nextQ.matching.itemsB.filter((i) => i.id !== change.itemId);
    }
    changed = true;
    if (nextKey?.matchingCorrectPairs) {
      const before = nextKey.matchingCorrectPairs.length;
      nextKey.matchingCorrectPairs = nextKey.matchingCorrectPairs.filter((p) =>
        change.side === 'A' ? p.fromId !== change.itemId : p.toId !== change.itemId
      );
      if (nextKey.matchingCorrectPairs.length !== before) {
        warnings.push(
          `Đã gỡ cặp nối liên quan đến mục vừa xóa trong ${nextQ.code}. Thầy cô hãy kiểm tra lại đáp án ghép đôi.`
        );
      }
    }
  } else if (change.kind === 'tf-statement-deleted' && nextQ.tfStatements) {
    nextQ.tfStatements = nextQ.tfStatements.filter((s) => s.id !== change.statementId);
    changed = true;
    if (nextKey?.tfCorrectMap && nextKey.tfCorrectMap[change.statementId]) {
      delete nextKey.tfCorrectMap[change.statementId];
      warnings.push(
        `Đã gỡ đáp án Đúng/Sai của phát biểu vừa xóa trong ${nextQ.code}.`
      );
    }
  }

  return {
    question: nextQ,
    answerKey: nextKey,
    changed,
    syncWarning: warnings.length > 0 ? warnings.join(' ') : null,
  };
}
