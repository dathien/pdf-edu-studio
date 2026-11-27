import { getPdfjsLib, type PDFDocumentProxy } from './pdfjsConfig';
import {
  destroyPdfProxy,
  loadPdf,
  openPdfDocument,
  type LoadedPdfHandle,
  type PdfInput,
} from './pdfLoader';
import {
  PDFDocument,
  StandardFonts,
  degrees,
  rgb,
  type PDFFont,
  type PDFPage,
  LineCapStyle,
} from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import {
  PDF_EMBED_NAMES,
  attachEmbeddedFilesToPdf,
  readPdfEmbeddedFiles,
  validatePdfHeaderBytes,
} from './pdfEmbeddedData';
import type {
  ExtractedTextBlock,
  PageAnalysis,
  PageTransform,
  StudioDocument,
  StudioObject,
} from '../../types/studio';
import { computeGradingSummary, formatScoreVi } from '../grading/gradingEngine';

import { sanitizeSvgMarkup } from '../../utils/svgSanitizer';

export { destroyPdfProxy, loadPdf, openPdfDocument, sanitizeSvgMarkup };
export type { LoadedPdfHandle, PdfInput, PDFDocumentProxy };

interface FontBytesCache {
  sans: Uint8Array;
  sansBold: Uint8Array;
  serif: Uint8Array;
  serifBold: Uint8Array;
}

let cachedFonts: FontBytesCache | null = null;

async function loadVietnameseFontBytes(): Promise<FontBytesCache | null> {
  if (cachedFonts) return cachedFonts;
  try {
    const [sans, sansBold, serif, serifBold] = await Promise.all([
      fetch('/fonts/DejaVuSans.ttf').then((r) => (r.ok ? r.arrayBuffer() : Promise.reject())),
      fetch('/fonts/DejaVuSans-Bold.ttf').then((r) => (r.ok ? r.arrayBuffer() : Promise.reject())),
      fetch('/fonts/DejaVuSerif.ttf').then((r) => (r.ok ? r.arrayBuffer() : Promise.reject())),
      fetch('/fonts/DejaVuSerif-Bold.ttf').then((r) => (r.ok ? r.arrayBuffer() : Promise.reject())),
    ]);
    cachedFonts = {
      sans: new Uint8Array(sans),
      sansBold: new Uint8Array(sansBold),
      serif: new Uint8Array(serif),
      serifBold: new Uint8Array(serifBold),
    };
    return cachedFonts;
  } catch {
    return null;
  }
}

export async function embedStudioFonts(pdfDoc: PDFDocument): Promise<{
  sans: PDFFont;
  sansBold: PDFFont;
  serif: PDFFont;
  serifBold: PDFFont;
}> {
  pdfDoc.registerFontkit(fontkit);
  const bytes = await loadVietnameseFontBytes();
  if (bytes) {
    const [sans, sansBold, serif, serifBold] = await Promise.all([
      pdfDoc.embedFont(bytes.sans, { subset: true }),
      pdfDoc.embedFont(bytes.sansBold, { subset: true }),
      pdfDoc.embedFont(bytes.serif, { subset: true }),
      pdfDoc.embedFont(bytes.serifBold, { subset: true }),
    ]);
    return { sans, sansBold, serif, serifBold };
  }
  const [sans, sansBold, serif, serifBold] = await Promise.all([
    pdfDoc.embedFont(StandardFonts.Helvetica),
    pdfDoc.embedFont(StandardFonts.HelveticaBold),
    pdfDoc.embedFont(StandardFonts.TimesRoman),
    pdfDoc.embedFont(StandardFonts.TimesRomanBold),
  ]);
  return { sans, sansBold, serif, serifBold };
}

function hexToRgb(hex: string) {
  const clean = (hex || '#1F2937').replace('#', '').trim();
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean.padEnd(6, '0');
  const num = parseInt(full.slice(0, 6), 16);
  if (Number.isNaN(num)) return rgb(0.12, 0.16, 0.22);
  return rgb(((num >> 16) & 255) / 255, ((num >> 8) & 255) / 255, (num & 255) / 255);
}



/** Load PDF document safely via the shared PDF.js loader service */
export async function loadPdfProxy(input: PdfInput): Promise<PDFDocumentProxy> {
  return loadPdf(input);
}

/** Extract page dimensions & analyze whether pages are text-editable vs scanned */
export async function inspectPdfBytes(input: PdfInput): Promise<{
  pages: PageTransform[];
  analyses: PageAnalysis[];
}> {
  const handle = await openPdfDocument(input);
  try {
    const { proxy } = handle;
    const pages: PageTransform[] = [];
    const analyses: PageAnalysis[] = [];

    for (let i = 1; i <= proxy.numPages; i++) {
      const page = await proxy.getPage(i);
      const vp = page.getViewport({ scale: 1 });
      pages.push({
        id: `page-${i}-${Math.random().toString(36).slice(2, 6)}`,
        sourcePageIndex: i - 1,
        width: vp.width,
        height: vp.height,
        rotation: 0,
      });

      const textContent = await page.getTextContent();
      const itemCount = textContent.items.filter(
        (it) => 'str' in it && typeof it.str === 'string' && it.str.trim().length > 0
      ).length;

      if (itemCount === 0) {
        analyses.push({
          pageIndex: i - 1,
          kind: 'scanned-image',
          textCount: 0,
          note: 'Trang không có lớp văn bản (PDF scan hoặc chữ đã chuyển thành đường nét). Nên dùng OCR hoặc thêm khối chữ mới.',
        });
      } else {
        analyses.push({
          pageIndex: i - 1,
          kind: 'text-editable',
          textCount: itemCount,
          note: 'Hỗ trợ nhận diện dòng chữ và biên tập vùng văn bản trực tiếp.',
        });
      }
    }

    return { pages, analyses };
  } finally {
    await handle.destroy();
  }
}

/** Extract positioned text blocks for direct inline text editing and full-document search */
export async function extractPageTextBlocks(
  proxy: PDFDocumentProxy,
  sourcePageIndex: number
): Promise<ExtractedTextBlock[]> {
  if (sourcePageIndex < 0 || sourcePageIndex >= proxy.numPages) return [];
  const pdfjsLib = await getPdfjsLib();
  const page = await proxy.getPage(sourcePageIndex + 1);
  const vp = page.getViewport({ scale: 1 });
  const content = await page.getTextContent();

  // Group adjacent text items on the same horizontal line into natural editable lines
  const rawItems: Array<{
    text: string;
    x: number;
    y: number;
    width: number;
    height: number;
    fontSize: number;
    fontName: string;
  }> = [];

  for (const item of content.items) {
    if (!('str' in item) || !item.str.trim()) continue;
    const tx = pdfjsLib.Util.transform(vp.transform, item.transform);
    const fontSize = Math.max(8, Math.hypot(tx[0], tx[1]));
    const x = tx[4];
    const y = tx[5] - fontSize * 0.85;
    const width = Math.max(10, item.width);
    const height = Math.max(fontSize * 1.15, item.height || fontSize * 1.15);
    rawItems.push({
      text: item.str,
      x,
      y,
      width,
      height,
      fontSize,
      fontName: item.fontName || 'DejaVuSans',
    });
  }

  rawItems.sort((a, b) => (Math.abs(a.y - b.y) > 4 ? a.y - b.y : a.x - b.x));

  const merged: ExtractedTextBlock[] = [];
  for (const item of rawItems) {
    const prev = merged[merged.length - 1];
    if (
      prev &&
      Math.abs(prev.y - item.y) < Math.max(4, prev.fontSize * 0.45) &&
      item.x - (prev.x + prev.width) < prev.fontSize * 1.4 &&
      item.x >= prev.x - 4
    ) {
      const gap = item.x - (prev.x + prev.width);
      prev.text += (gap > prev.fontSize * 0.2 ? ' ' : '') + item.text;
      prev.width = Math.max(prev.width, item.x + item.width - prev.x);
      prev.height = Math.max(prev.height, item.height);
    } else {
      merged.push({
        id: `txt-${sourcePageIndex}-${merged.length}`,
        pageIndex: sourcePageIndex,
        ...item,
      });
    }
  }

  return merged;
}

/**
 * Draw standalone pure SVG markup (MathJax vector formulas & scientific vector diagrams)
 * as genuine PDF vector primitives (paths, lines, circles, ellipses, rects, polygons, text)
 * rather than blurry raster PNGs!
 */
function drawSvgVectorToPdfPage(
  pdfPage: PDFPage,
  svgMarkup: string,
  boxX: number,
  boxYTop: number,
  boxW: number,
  boxH: number,
  pageHeight: number,
  fonts: { sans: PDFFont; serif: PDFFont },
  opacity = 1
) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgMarkup, 'image/svg+xml');
  const svgEl = doc.querySelector('svg');
  if (!svgEl) return;

  const vbAttr = svgEl.getAttribute('viewBox');
  let vbX = 0;
  let vbY = 0;
  let vbW = parseFloat(svgEl.getAttribute('width') || '200') || 200;
  let vbH = parseFloat(svgEl.getAttribute('height') || '100') || 100;
  if (vbAttr) {
    const parts = vbAttr.trim().split(/[\s,]+/).map(Number);
    if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
      [vbX, vbY, vbW, vbH] = parts;
    }
  }

  const scaleX = boxW / vbW;
  const scaleY = boxH / vbH;
  const uniformScale = Math.min(scaleX, scaleY);
  const offsetX = boxX + (boxW - vbW * uniformScale) / 2;
  const offsetYTop = boxYTop + (boxH - vbH * uniformScale) / 2;

  // Map SVG coordinate (sx, sy) with optional ancestor transform matrix [a,b,c,d,e,f] to PDF coordinates (bottom-left origin)
  type Mat = [number, number, number, number, number, number];
  const mulMat = (m1: Mat, m2: Mat): Mat => [
    m1[0] * m2[0] + m1[2] * m2[1],
    m1[1] * m2[0] + m1[3] * m2[1],
    m1[0] * m2[2] + m1[2] * m2[3],
    m1[1] * m2[2] + m1[3] * m2[3],
    m1[0] * m2[4] + m1[2] * m2[5] + m1[4],
    m1[1] * m2[4] + m1[3] * m2[5] + m1[5],
  ];

  const parseTransform = (attr: string | null): Mat => {
    let m: Mat = [1, 0, 0, 1, 0, 0];
    if (!attr) return m;
    const regex = /(translate|scale|rotate|matrix)\(([^)]+)\)/g;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(attr)) !== null) {
      const fn = match[1];
      const vals = match[2].trim().split(/[\s,]+/).map(Number);
      if (fn === 'translate') {
        m = mulMat(m, [1, 0, 0, 1, vals[0] || 0, vals[1] || 0]);
      } else if (fn === 'scale') {
        const sx = vals[0] ?? 1;
        const sy = vals[1] ?? sx;
        m = mulMat(m, [sx, 0, 0, sy, 0, 0]);
      } else if (fn === 'rotate') {
        const rad = ((vals[0] || 0) * Math.PI) / 180;
        const c = Math.cos(rad);
        const s = Math.sin(rad);
        m = mulMat(m, [c, s, -s, c, 0, 0]);
      } else if (fn === 'matrix' && vals.length === 6) {
        m = mulMat(m, vals as Mat);
      }
    }
    return m;
  };

  const mapPt = (x: number, y: number, m: Mat) => {
    const tx = m[0] * x + m[2] * y + m[4];
    const ty = m[1] * x + m[3] * y + m[5];
    const px = offsetX + (tx - vbX) * uniformScale;
    const pyTop = offsetYTop + (ty - vbY) * uniformScale;
    return { x: px, y: pageHeight - pyTop };
  };

  const rootFill = svgEl.getAttribute('fill') || '#1F2937';
  const rootStroke = svgEl.getAttribute('stroke') || 'none';

  const walk = (el: Element, ctm: Mat, inheritedFill: string, inheritedStroke: string) => {
    const tag = el.tagName.toLowerCase();
    if (tag === 'defs' || tag === 'clippath' || tag === 'title' || tag === 'desc') return;

    const localM = parseTransform(el.getAttribute('transform'));
    const nextM = mulMat(ctm, localM);
    const fill = el.getAttribute('fill') || inheritedFill;
    const stroke = el.getAttribute('stroke') || inheritedStroke;
    const strokeWidth = (parseFloat(el.getAttribute('stroke-width') || '1') || 1) * uniformScale * Math.abs(nextM[0]);
    const dashAttr = el.getAttribute('stroke-dasharray');
    const dashArray = dashAttr
      ? dashAttr.trim().split(/[\s,]+/).map((n) => Math.max(1, parseFloat(n) * uniformScale))
      : undefined;
    const fillOp = (parseFloat(el.getAttribute('fill-opacity') || '1') || 1) * opacity;

    if (tag === 'line') {
      const p1 = mapPt(parseFloat(el.getAttribute('x1') || '0'), parseFloat(el.getAttribute('y1') || '0'), nextM);
      const p2 = mapPt(parseFloat(el.getAttribute('x2') || '0'), parseFloat(el.getAttribute('y2') || '0'), nextM);
      if (stroke && stroke !== 'none') {
        pdfPage.drawLine({
          start: p1,
          end: p2,
          thickness: Math.max(0.4, strokeWidth),
          color: hexToRgb(stroke),
          opacity,
          dashArray,
        });
      }
    } else if (tag === 'rect') {
      const rx = parseFloat(el.getAttribute('x') || '0');
      const ry = parseFloat(el.getAttribute('y') || '0');
      const rw = parseFloat(el.getAttribute('width') || '0');
      const rh = parseFloat(el.getAttribute('height') || '0');
      // Skip opaque full-canvas white backdrop inside diagram SVGs when exporting over PDF
      if (rx === 0 && ry === 0 && Math.abs(rw - vbW) < 2 && Math.abs(rh - vbH) < 2 && fill.toUpperCase() === '#FFFFFF') {
        // Keep transparent over PDF page
      } else if (rw > 0 && rh > 0) {
        const pTopLeft = mapPt(rx, ry, nextM);
        const pBotRight = mapPt(rx + rw, ry + rh, nextM);
        const w = Math.abs(pBotRight.x - pTopLeft.x);
        const h = Math.abs(pTopLeft.y - pBotRight.y);
        pdfPage.drawRectangle({
          x: Math.min(pTopLeft.x, pBotRight.x),
          y: Math.min(pTopLeft.y, pBotRight.y),
          width: w,
          height: h,
          color: fill && fill !== 'none' ? hexToRgb(fill) : undefined,
          opacity: fill && fill !== 'none' ? fillOp : undefined,
          borderColor: stroke && stroke !== 'none' ? hexToRgb(stroke) : undefined,
          borderWidth: stroke && stroke !== 'none' ? Math.max(0.4, strokeWidth) : 0,
          borderOpacity: opacity,
          borderDashArray: dashArray,
        });
      }
    } else if (tag === 'circle') {
      const cx = parseFloat(el.getAttribute('cx') || '0');
      const cy = parseFloat(el.getAttribute('cy') || '0');
      const r = parseFloat(el.getAttribute('r') || '0') * uniformScale * Math.abs(nextM[0]);
      const p = mapPt(cx, cy, nextM);
      if (r > 0) {
        pdfPage.drawCircle({
          x: p.x,
          y: p.y,
          size: r,
          color: fill && fill !== 'none' ? hexToRgb(fill) : undefined,
          opacity: fill && fill !== 'none' ? fillOp : undefined,
          borderColor: stroke && stroke !== 'none' ? hexToRgb(stroke) : undefined,
          borderWidth: stroke && stroke !== 'none' ? Math.max(0.4, strokeWidth) : 0,
          borderOpacity: opacity,
        });
      }
    } else if (tag === 'ellipse') {
      const cx = parseFloat(el.getAttribute('cx') || '0');
      const cy = parseFloat(el.getAttribute('cy') || '0');
      const rx = parseFloat(el.getAttribute('rx') || '0') * uniformScale * Math.abs(nextM[0]);
      const ry = parseFloat(el.getAttribute('ry') || '0') * uniformScale * Math.abs(nextM[3]);
      const p = mapPt(cx, cy, nextM);
      if (rx > 0 && ry > 0) {
        pdfPage.drawEllipse({
          x: p.x,
          y: p.y,
          xScale: rx,
          yScale: ry,
          color: fill && fill !== 'none' ? hexToRgb(fill) : undefined,
          opacity: fill && fill !== 'none' ? fillOp : undefined,
          borderColor: stroke && stroke !== 'none' ? hexToRgb(stroke) : undefined,
          borderWidth: stroke && stroke !== 'none' ? Math.max(0.4, strokeWidth) : 0,
          borderOpacity: opacity,
        });
      }
    } else if (tag === 'polygon' || tag === 'polyline') {
      const ptsAttr = (el.getAttribute('points') || '').trim();
      const nums = ptsAttr.split(/[\s,]+/).map(Number);
      if (nums.length >= 4) {
        let d = `M ${nums[0]} ${nums[1]}`;
        for (let i = 2; i < nums.length - 1; i += 2) {
          d += ` L ${nums[i]} ${nums[i + 1]}`;
        }
        if (tag === 'polygon') d += ' Z';
        const origin = mapPt(0, 0, nextM);
        try {
          pdfPage.drawSvgPath(d, {
            x: origin.x,
            y: origin.y,
            scale: uniformScale * Math.abs(nextM[0]),
            color: fill && fill !== 'none' ? hexToRgb(fill) : undefined,
            opacity: fill && fill !== 'none' ? fillOp : undefined,
            borderColor: stroke && stroke !== 'none' ? hexToRgb(stroke) : undefined,
            borderWidth: stroke && stroke !== 'none' ? Math.max(0.4, strokeWidth) : 0,
            borderOpacity: opacity,
          });
        } catch {
          // Skip malformed polygon
        }
      }
    } else if (tag === 'path') {
      const d = el.getAttribute('d');
      if (d) {
        // MathJax flips Y with scale(1, -1) on its root <g>. Handle both positive and flipped-Y CTMs cleanly!
        const origin = mapPt(0, 0, nextM);
        const sx = nextM[0] * uniformScale;
        const sy = nextM[3] * uniformScale;
        // pdf-lib drawSvgPath expects standard SVG Y-down coordinates and flips them automatically!
        // If MathJax already has scale(1, -1) (sy < 0), flip path Y back or draw with transformed coordinates.
        try {
          if (sy >= 0) {
            pdfPage.drawSvgPath(d, {
              x: origin.x,
              y: origin.y,
              scale: Math.abs(sx),
              color: fill && fill !== 'none' ? hexToRgb(fill) : undefined,
              opacity: fill && fill !== 'none' ? fillOp : undefined,
              borderColor: stroke && stroke !== 'none' && stroke !== fill ? hexToRgb(stroke) : undefined,
              borderWidth: stroke && stroke !== 'none' && stroke !== fill ? Math.max(0.4, strokeWidth) : 0,
              borderOpacity: opacity,
              borderDashArray: dashArray,
            });
          } else {
            // Flip all Y coordinates in simple M/L/C/Q/V/H/Z MathJax glyph path so pdf-lib draws right-side up!
            const flippedD = flipSvgPathY(d);
            pdfPage.drawSvgPath(flippedD, {
              x: origin.x,
              y: origin.y,
              scale: Math.abs(sx),
              color: fill && fill !== 'none' ? hexToRgb(fill) : undefined,
              opacity: fill && fill !== 'none' ? fillOp : undefined,
            });
          }
        } catch {
          // Graceful skip if exotic arc command fails
        }
      }
    } else if (tag === 'text') {
      const textStr = (el.textContent || '').trim();
      if (textStr) {
        const x = parseFloat(el.getAttribute('x') || '0');
        const y = parseFloat(el.getAttribute('y') || '0');
        const fs = Math.max(6, (parseFloat(el.getAttribute('font-size') || '12') || 12) * uniformScale);
        const p = mapPt(x, y, nextM);
        const font = (el.getAttribute('font-family') || '').toLowerCase().includes('serif') ? fonts.serif : fonts.sans;
        const anchor = el.getAttribute('text-anchor');
        let drawX = p.x;
        try {
          const tw = font.widthOfTextAtSize(textStr, fs);
          if (anchor === 'middle') drawX -= tw / 2;
          else if (anchor === 'end') drawX -= tw;
          pdfPage.drawText(textStr, {
            x: drawX,
            y: p.y,
            size: fs,
            font,
            color: hexToRgb(fill && fill !== 'none' ? fill : '#1F2937'),
            opacity,
          });
        } catch {
          // Skip unencodable glyph safely
        }
      }
    }

    for (const child of Array.from(el.children)) {
      walk(child, nextM, fill, stroke);
    }
  };

  walk(svgEl, [1, 0, 0, 1, 0, 0], rootFill, rootStroke);
}

/** Negate Y coordinates inside MathJax glyph path commands (which are rendered in Y-up font coordinates) */
function flipSvgPathY(d: string): string {
  const tokens = d.match(/[a-zA-Z]|[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/g);
  if (!tokens) return d;
  const out: string[] = [];
  let cmd = '';
  let idx = 0;
  let argPos = 0;

  while (idx < tokens.length) {
    const tk = tokens[idx];
    if (/^[a-zA-Z]$/.test(tk)) {
      cmd = tk;
      argPos = 0;
      out.push(tk);
      idx++;
      continue;
    }
    const val = parseFloat(tk);
    const upper = cmd.toUpperCase();
    let flip = false;
    if (upper === 'V') flip = true;
    else if (upper === 'H') flip = false;
    else if (upper === 'A') {
      // A rx ry x-axis-rotation large-arc-flag sweep-flag x y
      const mod = argPos % 7;
      if (mod === 4) {
        // Flip sweep flag
        out.push(val ? '0' : '1');
        argPos++;
        idx++;
        continue;
      }
      if (mod === 6) flip = true;
    } else {
      // M, L, T, C, S, Q — odd argPos are Y coordinates
      if (argPos % 2 === 1) flip = true;
    }
    out.push(flip ? String(-val) : tk);
    argPos++;
    idx++;
  }
  return out.join(' ');
}

function wrapTextLines(text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] {
  const paragraphs = text.split('\n');
  const lines: string[] = [];
  for (const para of paragraphs) {
    if (!para.trim()) {
      lines.push('');
      continue;
    }
    const words = para.split(/\s+/);
    let current = '';
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      let w = 0;
      try {
        w = font.widthOfTextAtSize(candidate, fontSize);
      } catch {
        w = candidate.length * fontSize * 0.55;
      }
      if (w > maxWidth && current) {
        lines.push(current);
        current = word;
      } else {
        current = candidate;
      }
    }
    if (current) lines.push(current);
  }
  return lines;
}

/**
 * Render a PDF page + destructive redaction boxes onto an offscreen canvas and return PNG bytes.
 * Guarantees 100% permanent removal of sensitive text/images/vectors from redacted pages!
 */
async function rasterizeRedactedPage(
  sourceBytes: Uint8Array,
  sourcePageIndex: number,
  pageWidth: number,
  pageHeight: number,
  redactions: Array<{ x: number; y: number; width: number; height: number; fillColor: string }>
): Promise<Uint8Array> {
  const scale = 2.0; // 144 DPI crisp print quality
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(pageWidth * scale);
  canvas.height = Math.round(pageHeight * scale);
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (sourcePageIndex >= 0) {
    const handle = await openPdfDocument(sourceBytes);
    try {
      const page = await handle.proxy.getPage(sourcePageIndex + 1);
      const viewport = page.getViewport({ scale });
      await page.render({ canvasContext: ctx, viewport, canvas }).promise;
    } finally {
      await handle.destroy();
    }
  }

  // Permanently overwrite sensitive regions on the pixel buffer
  for (const r of redactions) {
    ctx.fillStyle = r.fillColor || '#000000';
    ctx.fillRect(r.x * scale, r.y * scale, r.width * scale, r.height * scale);
  }

  const blob: Blob = await new Promise((resolve) => canvas.toBlob((b) => resolve(b!), 'image/png'));
  return new Uint8Array(await blob.arrayBuffer());
}

export interface ExportPdfOptions {
  sanitizeMetadata?: boolean;
  includeAnnotations?: boolean;
  applyRedactions?: boolean;
  compressionLevel?: 'quality' | 'balanced' | 'compact';
}

export interface ExportPdfResult {
  bytes: Uint8Array;
  redactedPagesCount: number;
  redactionVerifiedClean: boolean;
}

/**
 * Export full StudioDocument into a brand-new standard PDF file:
 * - Preserves original PDF untouched
 * - Keeps formulas & scientific diagrams as real PDF vectors
 * - Embeds Vietnamese Unicode TTF fonts
 * - Applies true destructive redaction (non-incremental fresh rebuild + post-export text check)
 * - Supports page reordering, rotation, crop, page numbers, watermark, and metadata sanitization
 */
export async function exportDocumentToPdf(
  doc: StudioDocument,
  options: ExportPdfOptions = {}
): Promise<ExportPdfResult> {
  const includeAnnotations = options.includeAnnotations ?? true;
  const sourcePdf = await PDFDocument.load(doc.currentPdfBytes, { ignoreEncryption: true });
  const outPdf = await PDFDocument.create();
  const fonts = await embedStudioFonts(outPdf);
  const summary = computeGradingSummary(doc.grading);

  let redactedPagesCount = 0;

  for (let pIdx = 0; pIdx < doc.pages.length; pIdx++) {
    const pageMeta = doc.pages[pIdx];
    const pageObjects = doc.objects
      .filter((o) => o.pageId === pageMeta.id)
      .sort((a, b) => a.zIndex - b.zIndex);

    const redactions = pageObjects.filter(
      (o): o is Extract<StudioObject, { type: 'redaction' }> =>
        o.type === 'redaction' && (options.applyRedactions || o.applied)
    );

    let pdfPage: PDFPage;

    if (redactions.length > 0) {
      // True destructive redaction: flatten page with sensitive pixels permanently overwritten
      const pngBytes = await rasterizeRedactedPage(
        doc.currentPdfBytes,
        pageMeta.sourcePageIndex,
        pageMeta.width,
        pageMeta.height,
        redactions
      );
      pdfPage = outPdf.addPage([pageMeta.width, pageMeta.height]);
      const img = await outPdf.embedPng(pngBytes);
      pdfPage.drawImage(img, { x: 0, y: 0, width: pageMeta.width, height: pageMeta.height });
      redactedPagesCount++;
    } else if (pageMeta.sourcePageIndex >= 0 && pageMeta.sourcePageIndex < sourcePdf.getPageCount()) {
      const [copied] = await outPdf.copyPages(sourcePdf, [pageMeta.sourcePageIndex]);
      pdfPage = outPdf.addPage(copied);
    } else {
      pdfPage = outPdf.addPage([pageMeta.width, pageMeta.height]);
    }

    if (pageMeta.rotation) {
      const existingRot = pdfPage.getRotation().angle;
      pdfPage.setRotation(degrees((existingRot + pageMeta.rotation) % 360));
    }

    if (pageMeta.crop) {
      const { top, right, bottom, left } = pageMeta.crop;
      const w = Math.max(50, pageMeta.width - left - right);
      const h = Math.max(50, pageMeta.height - top - bottom);
      pdfPage.setCropBox(left, bottom, w, h);
    }

    const pageH = pdfPage.getHeight();
    const pageW = pdfPage.getWidth();

    // Watermark
    if (
      doc.watermark.enabled &&
      (doc.watermark.scope === 'all' || pIdx === doc.currentPageIndex)
    ) {
      if (doc.watermark.kind === 'text' && doc.watermark.text.trim()) {
        const fs = doc.watermark.fontSize;
        const tw = fonts.sansBold.widthOfTextAtSize(doc.watermark.text, fs);
        let wx = (pageW - tw) / 2;
        let wy = pageH / 2;
        if (doc.watermark.position === 'top-left') { wx = 40; wy = pageH - 60; }
        else if (doc.watermark.position === 'top-right') { wx = pageW - tw - 40; wy = pageH - 60; }
        else if (doc.watermark.position === 'bottom-left') { wx = 40; wy = 50; }
        else if (doc.watermark.position === 'bottom-right') { wx = pageW - tw - 40; wy = 50; }

        pdfPage.drawText(doc.watermark.text, {
          x: wx,
          y: wy,
          size: fs,
          font: fonts.sansBold,
          color: hexToRgb(doc.watermark.color),
          opacity: doc.watermark.opacity,
          rotate: degrees(doc.watermark.rotation),
        });
      }
    }

    // Draw all non-redaction studio objects onto the page
    for (const obj of pageObjects) {
      if (obj.type === 'redaction') continue;
      if (!includeAnnotations && (obj.type === 'ink' || obj.type === 'annotation')) continue;

      if (obj.type === 'text') {
        const font =
          obj.fontFamily === 'DejaVuSerif'
            ? obj.bold
              ? fonts.serifBold
              : fonts.serif
            : obj.bold
              ? fonts.sansBold
              : fonts.sans;

        if (obj.replacesOriginalRect) {
          // Cover original line box cleanly with background before drawing reconstructed Vietnamese text
          pdfPage.drawRectangle({
            x: obj.replacesOriginalRect.x - 1,
            y: pageH - (obj.replacesOriginalRect.y + obj.replacesOriginalRect.height) - 1,
            width: Math.max(obj.replacesOriginalRect.width, obj.width) + 3,
            height: obj.replacesOriginalRect.height + 3,
            color: rgb(1, 1, 1),
          });
        } else if (obj.backgroundColor && obj.backgroundColor !== 'transparent') {
          pdfPage.drawRectangle({
            x: obj.x,
            y: pageH - (obj.y + obj.height),
            width: obj.width,
            height: obj.height,
            color: hexToRgb(obj.backgroundColor),
            opacity: obj.opacity,
          });
        }

        const lines = wrapTextLines(obj.content, font, obj.fontSize, Math.max(40, obj.width));
        const lh = obj.fontSize * (obj.lineHeight || 1.3);
        lines.forEach((line, idx) => {
          const ly = pageH - obj.y - obj.fontSize - idx * lh;
          let lx = obj.x + 2;
          if (obj.align !== 'left') {
            const lw = font.widthOfTextAtSize(line, obj.fontSize);
            if (obj.align === 'center') lx = obj.x + (obj.width - lw) / 2;
            if (obj.align === 'right') lx = obj.x + obj.width - lw - 2;
          }
          if (line) {
            pdfPage.drawText(line, {
              x: lx,
              y: ly,
              size: obj.fontSize,
              font,
              color: hexToRgb(obj.color),
              opacity: obj.opacity,
            });
            if (obj.underline) {
              const lw = font.widthOfTextAtSize(line, obj.fontSize);
              pdfPage.drawLine({
                start: { x: lx, y: ly - 2 },
                end: { x: lx + lw, y: ly - 2 },
                thickness: 0.8,
                color: hexToRgb(obj.color),
              });
            }
            if (obj.strikethrough) {
              const lw = font.widthOfTextAtSize(line, obj.fontSize);
              pdfPage.drawLine({
                start: { x: lx, y: ly + obj.fontSize * 0.35 },
                end: { x: lx + lw, y: ly + obj.fontSize * 0.35 },
                thickness: 0.8,
                color: hexToRgb(obj.color),
              });
            }
          }
        });
      } else if (obj.type === 'formula' || obj.type === 'diagram') {
        drawSvgVectorToPdfPage(
          pdfPage,
          obj.svgMarkup,
          obj.x,
          obj.y,
          obj.width,
          obj.height,
          pageH,
          fonts,
          obj.opacity
        );
      } else if (obj.type === 'image' || obj.type === 'signature') {
        try {
          const dataUrl = obj.dataUrl;
          if (dataUrl.startsWith('data:image/svg+xml')) {
            const decoded = decodeURIComponent(dataUrl.split(',')[1] || '');
            drawSvgVectorToPdfPage(pdfPage, decoded, obj.x, obj.y, obj.width, obj.height, pageH, fonts, obj.opacity);
          } else {
            const resp = await fetch(dataUrl);
            const buf = await resp.arrayBuffer();
            const isJpg = dataUrl.includes('image/jpeg') || dataUrl.includes('image/jpg');
            const embedded = isJpg ? await outPdf.embedJpg(buf) : await outPdf.embedPng(buf);
            pdfPage.drawImage(embedded, {
              x: obj.x,
              y: pageH - obj.y - obj.height,
              width: obj.width,
              height: obj.height,
              opacity: obj.opacity,
              rotate: degrees(-obj.rotation),
            });
          }
        } catch {
          // Skip broken image gracefully
        }
      } else if (obj.type === 'shape') {
        const py = pageH - obj.y - obj.height;
        const borderColor = hexToRgb(obj.strokeColor);
        const fillColor = obj.fillColor && obj.fillColor !== 'transparent' ? hexToRgb(obj.fillColor) : undefined;
        const dashArray = obj.strokeStyle === 'dashed' || obj.shapeKind === 'dashed' ? [6, 4] : undefined;

        if (obj.shapeKind === 'rect' || obj.shapeKind === 'square' || obj.shapeKind === 'callout') {
          pdfPage.drawRectangle({
            x: obj.x,
            y: py,
            width: obj.width,
            height: obj.height,
            color: fillColor,
            opacity: fillColor ? obj.opacity : undefined,
            borderColor,
            borderWidth: obj.strokeWidth,
            borderOpacity: obj.opacity,
            borderDashArray: dashArray,
          });
          if (obj.text) {
            pdfPage.drawText(obj.text, {
              x: obj.x + 6,
              y: py + obj.height - 16,
              size: 11,
              font: fonts.sans,
              color: borderColor,
            });
          }
        } else if (obj.shapeKind === 'circle' || obj.shapeKind === 'ellipse') {
          pdfPage.drawEllipse({
            x: obj.x + obj.width / 2,
            y: py + obj.height / 2,
            xScale: obj.width / 2,
            yScale: obj.height / 2,
            color: fillColor,
            opacity: fillColor ? obj.opacity : undefined,
            borderColor,
            borderWidth: obj.strokeWidth,
            borderOpacity: obj.opacity,
          });
        } else if (obj.shapeKind === 'line' || obj.shapeKind === 'dashed' || obj.shapeKind === 'arrow') {
          const sx = obj.x;
          const sy = pageH - obj.y - obj.height / 2;
          const ex = obj.x + obj.width;
          const ey = sy;
          pdfPage.drawLine({
            start: { x: sx, y: sy },
            end: { x: ex, y: ey },
            thickness: obj.strokeWidth,
            color: borderColor,
            opacity: obj.opacity,
            dashArray,
          });
          if (obj.shapeKind === 'arrow') {
            pdfPage.drawLine({ start: { x: ex - 8, y: ey + 5 }, end: { x: ex, y: ey }, thickness: obj.strokeWidth, color: borderColor });
            pdfPage.drawLine({ start: { x: ex - 8, y: ey - 5 }, end: { x: ex, y: ey }, thickness: obj.strokeWidth, color: borderColor });
          }
        } else if (obj.shapeKind === 'table' && obj.tableRows) {
          const rows = obj.tableRows.length || 1;
          const cols = obj.tableRows[0]?.length || 1;
          const cellW = obj.width / cols;
          const cellH = obj.height / rows;
          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
              const cx = obj.x + c * cellW;
              const cy = pageH - obj.y - (r + 1) * cellH;
              pdfPage.drawRectangle({
                x: cx,
                y: cy,
                width: cellW,
                height: cellH,
                borderColor,
                borderWidth: 0.8,
                color: r === 0 ? rgb(0.95, 0.98, 0.97) : undefined,
              });
              const val = obj.tableRows[r]?.[c] || '';
              if (val) {
                pdfPage.drawText(val.slice(0, 24), {
                  x: cx + 4,
                  y: cy + cellH / 2 - 4,
                  size: 10,
                  font: r === 0 ? fonts.sansBold : fonts.sans,
                  color: rgb(0.12, 0.16, 0.22),
                });
              }
            }
          }
        }
      } else if (obj.type === 'ink' && obj.points.length >= 2) {
        const col = hexToRgb(obj.color);
        const op = obj.tool === 'highlighter' ? Math.min(0.35, obj.opacity) : obj.opacity;
        for (let i = 1; i < obj.points.length; i++) {
          const p0 = obj.points[i - 1];
          const p1 = obj.points[i];
          pdfPage.drawLine({
            start: { x: obj.x + p0.x, y: pageH - (obj.y + p0.y) },
            end: { x: obj.x + p1.x, y: pageH - (obj.y + p1.y) },
            thickness: obj.strokeWidth,
            color: col,
            opacity: op,
            lineCap: LineCapStyle.Round,
          });
        }
      } else if (obj.type === 'annotation') {
        const py = pageH - obj.y - obj.height;
        const col = hexToRgb(obj.color);
        if (obj.kind === 'highlight') {
          pdfPage.drawRectangle({ x: obj.x, y: py, width: obj.width, height: obj.height, color: col, opacity: 0.32 });
        } else if (obj.kind === 'underline') {
          pdfPage.drawLine({ start: { x: obj.x, y: py + 2 }, end: { x: obj.x + obj.width, y: py + 2 }, thickness: 1.6, color: col });
        } else if (obj.kind === 'strikethrough') {
          pdfPage.drawLine({ start: { x: obj.x, y: py + obj.height / 2 }, end: { x: obj.x + obj.width, y: py + obj.height / 2 }, thickness: 1.5, color: col });
        } else if (obj.kind === 'note') {
          pdfPage.drawRectangle({ x: obj.x, y: py, width: obj.width, height: obj.height, color: rgb(1, 0.97, 0.8), borderColor: col, borderWidth: 1 });
          const noteLines = wrapTextLines(obj.noteText || 'Ghi chú', fonts.sans, 9.5, obj.width - 10);
          noteLines.slice(0, 6).forEach((ln, idx) => {
            pdfPage.drawText(ln, { x: obj.x + 5, y: py + obj.height - 13 - idx * 12, size: 9.5, font: fonts.sans, color: rgb(0.2, 0.2, 0.2) });
          });
        }
      } else if (obj.type === 'grading-stamp') {
        const py = pageH - obj.y - obj.height;
        const col = hexToRgb(obj.color);
        pdfPage.drawText(obj.label, {
          x: obj.x + 6,
          y: py + obj.height / 2 - obj.fontSize * 0.35,
          size: obj.fontSize,
          font: fonts.sansBold,
          color: col,
        });
      } else if (obj.type === 'grading-score') {
        const py = pageH - obj.y - obj.height;
        const col = hexToRgb(obj.color);
        const labelStr = obj.questionId.startsWith("quick-") ? `${obj.score > 0 ? "+" : ""}${formatScoreVi(obj.score)}` : `${obj.questionLabel}: ${formatScoreVi(obj.score)}/${formatScoreVi(obj.maxScore)}`;
        pdfPage.drawText(labelStr, {
          x: obj.x + 7,
          y: py + obj.height / 2 - 4.5,
          size: 11,
          font: fonts.sansBold,
          color: col,
        });
      } else if (obj.type === 'grading-total') {
        const py = pageH - obj.y - obj.height;
        const col = hexToRgb(obj.color);
        pdfPage.drawRectangle({
          x: obj.x,
          y: py,
          width: obj.width,
          height: obj.height,
          borderColor: col,
          borderWidth: 2,
          color: rgb(1, 0.97, 0.97),
          opacity: 0,
          borderOpacity: 1,
        });
        const scoreText =
          obj.template === 'short'
            ? `Điểm: ${formatScoreVi(summary.finalScore)}`
            : `Tổng điểm: ${formatScoreVi(summary.finalScore)} / ${formatScoreVi(summary.scaleMax)}`;
        pdfPage.drawText(scoreText, {
          x: obj.x + 10,
          y: py + obj.height - 22,
          size: 14,
          font: fonts.sansBold,
          color: col,
        });
        if (obj.template === 'with-comment' && doc.grading.teacherComment) {
          const cLines = wrapTextLines(doc.grading.teacherComment, fonts.sans, 9.5, obj.width - 18);
          cLines.slice(0, 3).forEach((ln, idx) => {
            pdfPage.drawText(ln, {
              x: obj.x + 10,
              y: py + obj.height - 38 - idx * 12,
              size: 9.5,
              font: fonts.sans,
              color: rgb(0.2, 0.2, 0.2),
            });
          });
        }
      } else if (obj.type === 'grading-comment') {
        const py = pageH - obj.y - obj.height;
        const col = hexToRgb(obj.color);
        pdfPage.drawRectangle({
          x: obj.x,
          y: py,
          width: obj.width,
          height: obj.height,
          borderColor: col,
          borderWidth: 1,
          color: rgb(1, 0.98, 0.98),
        });
        const lines = wrapTextLines(obj.text, fonts.sans, obj.fontSize, obj.width - 12);
        lines.slice(0, 5).forEach((ln, idx) => {
          pdfPage.drawText(ln, {
            x: obj.x + 6,
            y: py + obj.height - obj.fontSize - 4 - idx * (obj.fontSize * 1.3),
            size: obj.fontSize,
            font: fonts.sans,
            color: col,
          });
        });
      }
    }

    // Page numbers
    if (doc.pageNumbers.enabled) {
      const num = doc.pageNumbers.startNumber + pIdx;
      const total = doc.pageNumbers.startNumber + doc.pages.length - 1;
      const label =
        doc.pageNumbers.format === 'number'
          ? `${num}`
          : doc.pageNumbers.format === 'page-of-total'
            ? `${num} / ${total}`
            : `Trang ${num} / ${total}`;
      const fs = doc.pageNumbers.fontSize;
      const tw = fonts.sans.widthOfTextAtSize(label, fs);
      const nx =
        doc.pageNumbers.align === 'left'
          ? 36
          : doc.pageNumbers.align === 'right'
            ? pageW - tw - 36
            : (pageW - tw) / 2;
      const ny = doc.pageNumbers.position === 'header' ? pageH - 26 : 18;
      pdfPage.drawText(label, {
        x: nx,
        y: ny,
        size: fs,
        font: fonts.sans,
        color: hexToRgb(doc.pageNumbers.color),
      });
    }
  }

  // Metadata sanitization (non-incremental clean rewrite)
  if (options.sanitizeMetadata) {
    outPdf.setTitle('');
    outPdf.setAuthor('');
    outPdf.setSubject('');
    outPdf.setKeywords([]);
    outPdf.setProducer('');
    outPdf.setCreator('');
  } else {
    outPdf.setTitle(doc.title);
    outPdf.setCreator('PDF EDU STUDIO');
  }

  const outBytes = await outPdf.save({ useObjectStreams: options.compressionLevel !== 'quality' });

  // Verify post-export that redacted pages contain zero searchable text
  let redactionVerifiedClean = true;
  if (redactedPagesCount > 0) {
    let checkHandle: LoadedPdfHandle | null = null;
    try {
      checkHandle = await openPdfDocument(outBytes);
      for (let i = 0; i < doc.pages.length; i++) {
        const hasRed = doc.objects.some(
          (o) => o.pageId === doc.pages[i].id && o.type === 'redaction' && (options.applyRedactions || o.applied)
        );
        if (hasRed) {
          const pg = await checkHandle.proxy.getPage(i + 1);
          const tc = await pg.getTextContent();
          if (tc.items.length > 0) redactionVerifiedClean = false;
        }
      }
    } catch {
      redactionVerifiedClean = false;
    } finally {
      if (checkHandle) await checkHandle.destroy();
    }
  }

  return { bytes: outBytes, redactedPagesCount, redactionVerifiedClean };
}

/** Create a brand-new blank A4 PDF */
export async function createBlankPdf(pageCount = 1, title = 'Tài liệu mới'): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  for (let i = 0; i < pageCount; i++) {
    pdf.addPage([595.28, 841.89]); // A4
  }
  pdf.setTitle(title);
  pdf.setCreator('PDF EDU STUDIO');
  return pdf.save();
}

/** Merge multiple PDF byte arrays with optional page subsets */
export async function mergePdfFiles(
  inputs: Array<{ bytes: Uint8Array; pageIndices?: number[] }>
): Promise<Uint8Array> {
  const out = await PDFDocument.create();
  for (const item of inputs) {
    const src = await PDFDocument.load(item.bytes, { ignoreEncryption: true });
    const indices =
      item.pageIndices && item.pageIndices.length > 0
        ? item.pageIndices.filter((idx) => idx >= 0 && idx < src.getPageCount())
        : src.getPageIndices();
    const copied = await out.copyPages(src, indices);
    copied.forEach((p) => out.addPage(p));
  }
  return out.save();
}

/** Split a PDF by explicit page index groups (returns array of PDF byte arrays) */
export async function splitPdfByGroups(
  sourceBytes: Uint8Array,
  groups: number[][]
): Promise<Uint8Array[]> {
  const src = await PDFDocument.load(sourceBytes, { ignoreEncryption: true });
  const results: Uint8Array[] = [];
  for (const group of groups) {
    const valid = group.filter((i) => i >= 0 && i < src.getPageCount());
    if (valid.length === 0) continue;
    const out = await PDFDocument.create();
    const copied = await out.copyPages(src, valid);
    copied.forEach((p) => out.addPage(p));
    results.push(await out.save());
  }
  return results;
}

/** Convert images (PNG/JPEG/WebP) into a PDF with A4/A5/2-up layout options */
export async function convertImagesToPdf(
  files: Array<{ name: string; dataUrl: string }>,
  options: {
    paper: 'A4' | 'A5';
    orientation: 'portrait' | 'landscape';
    marginPt: number;
    twoUpA5OnA4?: boolean;
  }
): Promise<Uint8Array> {
  const out = await PDFDocument.create();
  const baseW = options.paper === 'A4' ? 595.28 : 419.53;
  const baseH = options.paper === 'A4' ? 841.89 : 595.28;
  const pageW = options.twoUpA5OnA4
    ? 841.89
    : options.orientation === 'portrait'
      ? baseW
      : baseH;
  const pageH = options.twoUpA5OnA4
    ? 595.28
    : options.orientation === 'portrait'
      ? baseH
      : baseW;

  // Normalize WebP or any image onto PNG/JPEG bytes via canvas if needed
  const toEmbeddableImage = async (dataUrl: string) => {
    if (dataUrl.startsWith('data:image/jpeg') || dataUrl.startsWith('data:image/jpg')) {
      const buf = await (await fetch(dataUrl)).arrayBuffer();
      return out.embedJpg(buf);
    }
    if (dataUrl.startsWith('data:image/png')) {
      const buf = await (await fetch(dataUrl)).arrayBuffer();
      return out.embedPng(buf);
    }
    // Convert WebP to PNG safely on device
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = dataUrl;
    });
    const c = document.createElement('canvas');
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    c.getContext('2d')!.drawImage(img, 0, 0);
    const pngUrl = c.toDataURL('image/png');
    const buf = await (await fetch(pngUrl)).arrayBuffer();
    return out.embedPng(buf);
  };

  const m = options.marginPt;
  if (options.twoUpA5OnA4) {
    for (let i = 0; i < files.length; i += 2) {
      const page = out.addPage([pageW, pageH]);
      const slotW = (pageW - m * 3) / 2;
      const slotH = pageH - m * 2;
      for (let s = 0; s < 2; s++) {
        const f = files[i + s];
        if (!f) continue;
        const img = await toEmbeddableImage(f.dataUrl);
        const scale = Math.min(slotW / img.width, slotH / img.height);
        const dw = img.width * scale;
        const dh = img.height * scale;
        const sx = m + s * (slotW + m) + (slotW - dw) / 2;
        const sy = m + (slotH - dh) / 2;
        page.drawImage(img, { x: sx, y: sy, width: dw, height: dh });
      }
    }
  } else {
    for (const f of files) {
      const page = out.addPage([pageW, pageH]);
      const img = await toEmbeddableImage(f.dataUrl);
      const availW = pageW - m * 2;
      const availH = pageH - m * 2;
      const scale = Math.min(availW / img.width, availH / img.height);
      const dw = img.width * scale;
      const dh = img.height * scale;
      page.drawImage(img, {
        x: (pageW - dw) / 2,
        y: (pageH - dh) / 2,
        width: dw,
        height: dh,
      });
    }
  }

  return out.save();
}

/** Compress PDF at 3 honest levels, returning actual before/after byte sizes */
export async function compressPdfReal(
  sourceBytes: Uint8Array,
  level: 'quality' | 'balanced' | 'compact'
): Promise<{ bytes: Uint8Array; beforeSize: number; afterSize: number; reduced: boolean }> {
  const beforeSize = sourceBytes.byteLength;
  if (level === 'quality') {
    const src = await PDFDocument.load(sourceBytes, { ignoreEncryption: true });
    const out = await PDFDocument.create();
    const pages = await out.copyPages(src, src.getPageIndices());
    pages.forEach((p) => out.addPage(p));
    const bytes = await out.save({ useObjectStreams: true });
    return { bytes, beforeSize, afterSize: bytes.byteLength, reduced: bytes.byteLength < beforeSize };
  }

  // Balanced / Compact: re-encode pages at controlled JPEG quality to achieve real file-size reduction on image-heavy PDFs
  const scale = level === 'balanced' ? 1.5 : 1.1;
  const quality = level === 'balanced' ? 0.78 : 0.56;
  const proxy = await loadPdfProxy(sourceBytes);
  const out = await PDFDocument.create();

  for (let i = 1; i <= proxy.numPages; i++) {
    const page = await proxy.getPage(i);
    const vp1 = page.getViewport({ scale: 1 });
    const vp = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(vp.width);
    canvas.height = Math.round(vp.height);
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, viewport: vp, canvas }).promise;
    const blob: Blob = await new Promise((res) => canvas.toBlob((b) => res(b!), 'image/jpeg', quality));
    const jpgBytes = new Uint8Array(await blob.arrayBuffer());
    const img = await out.embedJpg(jpgBytes);
    const outPage = out.addPage([vp1.width, vp1.height]);
    outPage.drawImage(img, { x: 0, y: 0, width: vp1.width, height: vp1.height });
  }
  await destroyPdfProxy(proxy);

  const bytes = await out.save({ useObjectStreams: true });
  return {
    bytes,
    beforeSize,
    afterSize: bytes.byteLength,
    reduced: bytes.byteLength < beforeSize,
  };
}

/** Export selected PDF pages to PNG/JPEG images (single file or ZIP archive) */
export async function exportPagesToImages(
  pdfBytes: Uint8Array,
  pageIndices: number[],
  format: 'png' | 'jpeg',
  dpiScale = 2
): Promise<Array<{ name: string; blob: Blob }>> {
  const proxy = await loadPdfProxy(pdfBytes);
  const results: Array<{ name: string; blob: Blob }> = [];
  for (const idx of pageIndices) {
    if (idx < 0 || idx >= proxy.numPages) continue;
    const page = await proxy.getPage(idx + 1);
    const vp = page.getViewport({ scale: dpiScale });
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(vp.width);
    canvas.height = Math.round(vp.height);
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, viewport: vp, canvas }).promise;
    const mime = format === 'png' ? 'image/png' : 'image/jpeg';
    const blob: Blob = await new Promise((res) => canvas.toBlob((b) => res(b!), mime, 0.92));
    results.push({ name: `trang_${idx + 1}.${format === 'png' ? 'png' : 'jpg'}`, blob });
  }
  await destroyPdfProxy(proxy);
  return results;
}

/**
 * Save a standard .pdf file that BOTH renders all visual edits (text, vector formulas, diagrams,
 * grading stamps/scores) in every normal PDF viewer AND embeds structured Studio state via
 * standard ISO 32000-1 /Names/EmbeddedFiles so PDF EDU STUDIO can reopen and re-edit objects cleanly.
 */
export async function saveEditableStudioPdf(doc: StudioDocument): Promise<Uint8Array> {
  const exported = await exportDocumentToPdf(doc, {
    includeAnnotations: true,
    applyRedactions: false,
    sanitizeMetadata: false,
  });

  const manifest = {
    schemaVersion: 2,
    app: 'PDF EDU STUDIO',
    savedAt: new Date().toISOString(),
    title: doc.title,
    fileName: doc.fileName.toLowerCase().endsWith('.pdf') ? doc.fileName : `${doc.fileName}.pdf`,
    subjectHint: doc.subjectHint,
    pages: doc.pages,
    objects: doc.objects,
    grading: doc.grading,
    watermark: doc.watermark,
    pageNumbers: doc.pageNumbers,
  };

  return attachEmbeddedFilesToPdf(exported.bytes, [
    {
      name: PDF_EMBED_NAMES.CLEAN_SOURCE_PDF,
      bytes: doc.currentPdfBytes,
      mimeType: 'application/pdf',
      description: 'PDF EDU STUDIO clean base document for re-editing',
    },
    {
      name: PDF_EMBED_NAMES.STUDIO_STATE,
      bytes: new TextEncoder().encode(JSON.stringify(manifest)),
      mimeType: 'application/json',
      description: 'PDF EDU STUDIO editable objects and grading state',
    },
  ]);
}

/**
 * Attempt to restore structured PDF EDU STUDIO state from a standard .pdf file.
 * Returns null honestly if the PDF is a plain PDF without embedded Studio state.
 */
export async function loadEditableStudioPdf(
  pdfBytes: Uint8Array,
  fallbackFileName = 'tai_lieu.pdf'
): Promise<{
  title: string;
  fileName: string;
  pdfBytes: Uint8Array;
  pages: StudioDocument['pages'];
  objects: StudioDocument['objects'];
  grading: StudioDocument['grading'];
  watermark: StudioDocument['watermark'];
  pageNumbers: StudioDocument['pageNumbers'];
  subjectHint: StudioDocument['subjectHint'];
} | null> {
  if (!validatePdfHeaderBytes(pdfBytes)) return null;
  const embedded = await readPdfEmbeddedFiles(pdfBytes);
  const stateBytes = embedded[PDF_EMBED_NAMES.STUDIO_STATE];
  if (!stateBytes) return null;

  try {
    const data = JSON.parse(new TextDecoder().decode(stateBytes));
    const cleanBaseBytes = embedded[PDF_EMBED_NAMES.CLEAN_SOURCE_PDF];
    const restoredBasePdf =
      cleanBaseBytes && validatePdfHeaderBytes(cleanBaseBytes) ? cleanBaseBytes : pdfBytes;

    return {
      title: String(data.title || fallbackFileName.replace(/\.pdf$/i, '')),
      fileName: String(data.fileName || fallbackFileName),
      pdfBytes: restoredBasePdf,
      pages: Array.isArray(data.pages) ? data.pages : [],
      objects: Array.isArray(data.objects) ? data.objects : [],
      grading: data.grading,
      watermark: data.watermark,
      pageNumbers: data.pageNumbers,
      subjectHint: data.subjectHint || 'general',
    };
  } catch {
    return null;
  }
}

export function triggerDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
