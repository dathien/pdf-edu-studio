import { PDFDocument, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import { embedStudioFonts } from '../engines/pdf/pdfEngine';

export type StructuredPdfBlock =
  | { kind: 'heading'; text: string }
  | { kind: 'lines'; lines: string[]; italic?: boolean; indent?: number }
  | { kind: 'quote'; title: string; lines: string[]; source: string }
  | { kind: 'callout'; title: string; text: string; tone?: 'teal' | 'amber' | 'slate' }
  | { kind: 'table'; headers: string[]; rows: string[][]; colWeights?: number[] }
  | { kind: 'writingLines'; count: number; title?: string }
  | { kind: 'code'; title?: string; lines: string[] }
  | { kind: 'spacer'; height: number }
  | { kind: 'pageBreak' };

export interface StructuredSamplePdfSpec {
  subjectLabel: string;
  gradeLabel: string;
  docTypeLabel: string;
  title: string;
  subtitle: string;
  blocks: StructuredPdfBlock[];
  footerNote?: string;
}

const A4_W = 595.28;
const A4_H = 841.89;
const MARGIN_X = 42;
const CONTENT_W = A4_W - MARGIN_X * 2;
const TOP_START_Y = A4_H - 52;
const BOTTOM_LIMIT_Y = 54;

function wrapText(text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] {
  const safeText = (text || '').replace(/\t/g, '   ');
  if (!safeText.trim()) return [''];
  const words = safeText.split(' ');
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, fontSize) <= maxWidth) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      // If a single long token exceeds maxWidth, slice it safely
      if (font.widthOfTextAtSize(word, fontSize) > maxWidth) {
        let chunk = '';
        for (const ch of word) {
          if (font.widthOfTextAtSize(chunk + ch, fontSize) <= maxWidth) {
            chunk += ch;
          } else {
            if (chunk) lines.push(chunk);
            chunk = ch;
          }
        }
        current = chunk;
      } else {
        current = word;
      }
    }
  }
  if (current) lines.push(current);
  return lines.length > 0 ? lines : [''];
}

export async function createStructuredSamplePdf(
  spec: StructuredSamplePdfSpec
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const fonts = await embedStudioFonts(pdf);

  const pages: PDFPage[] = [];
  let page = pdf.addPage([A4_W, A4_H]);
  pages.push(page);
  let y = TOP_START_Y;

  const startNewPage = () => {
    page = pdf.addPage([A4_W, A4_H]);
    pages.push(page);
    y = TOP_START_Y - 12;
    page.drawRectangle({
      x: MARGIN_X,
      y: A4_H - 42,
      width: CONTENT_W,
      height: 1.2,
      color: rgb(0.84, 0.89, 0.9),
    });
    page.drawText(
      `PDF EDU STUDIO  |  ${spec.subjectLabel.toUpperCase()} – ${spec.gradeLabel.toUpperCase()}  |  ${spec.docTypeLabel}`,
      {
        x: MARGIN_X,
        y: A4_H - 34,
        size: 8.5,
        font: fonts.sansBold,
        color: rgb(0.09, 0.31, 0.39),
      }
    );
    y = A4_H - 64;
  };

  const ensureSpace = (needed: number) => {
    if (y - needed < BOTTOM_LIMIT_Y) {
      startNewPage();
    }
  };

  // Page 1 header chrome
  page.drawRectangle({
    x: MARGIN_X,
    y: A4_H - 54,
    width: CONTENT_W,
    height: 2.2,
    color: rgb(0.03, 0.5, 0.44),
  });
  page.drawText(
    `TÀI LIỆU MẪU — PDF EDU STUDIO  |  MÔN ${spec.subjectLabel.toUpperCase()} · ${spec.gradeLabel.toUpperCase()} · ${spec.docTypeLabel.toUpperCase()}`,
    {
      x: MARGIN_X,
      y: A4_H - 44,
      size: 9,
      font: fonts.sansBold,
      color: rgb(0.03, 0.5, 0.44),
    }
  );

  y = A4_H - 78;
  for (const titleLine of wrapText(spec.title, fonts.sansBold, 14.5, CONTENT_W)) {
    page.drawText(titleLine, {
      x: MARGIN_X,
      y,
      size: 14.5,
      font: fonts.sansBold,
      color: rgb(0.09, 0.31, 0.39),
    });
    y -= 20;
  }

  for (const subLine of wrapText(spec.subtitle, fonts.sans, 9.8, CONTENT_W)) {
    page.drawText(subLine, {
      x: MARGIN_X,
      y,
      size: 9.8,
      font: fonts.sans,
      color: rgb(0.32, 0.38, 0.45),
    });
    y -= 14;
  }

  page.drawLine({
    start: { x: MARGIN_X, y: y + 4 },
    end: { x: A4_W - MARGIN_X, y: y + 4 },
    thickness: 0.8,
    color: rgb(0.82, 0.86, 0.88),
  });
  y -= 14;

  // Render structured blocks
  for (const block of spec.blocks) {
    if (block.kind === 'pageBreak') {
      startNewPage();
      continue;
    }

    if (block.kind === 'spacer') {
      ensureSpace(block.height);
      y -= block.height;
      continue;
    }

    if (block.kind === 'heading') {
      const wrapped = wrapText(block.text, fonts.sansBold, 11.2, CONTENT_W);
      ensureSpace(wrapped.length * 16 + 10);
      y -= 4;
      for (const ln of wrapped) {
        page.drawText(ln, {
          x: MARGIN_X,
          y,
          size: 11.2,
          font: fonts.sansBold,
          color: rgb(0.09, 0.31, 0.39),
        });
        y -= 16;
      }
      y -= 2;
      continue;
    }

    if (block.kind === 'lines') {
      const indent = block.indent ?? 0;
      const font = block.italic ? fonts.serif : fonts.sans;
      const fontSize = 10.2;
      for (const raw of block.lines) {
        if (!raw.trim()) {
          y -= 6;
          continue;
        }
        const wrapped = wrapText(raw, font, fontSize, CONTENT_W - indent);
        ensureSpace(wrapped.length * 14.5 + 3);
        for (const ln of wrapped) {
          page.drawText(ln, {
            x: MARGIN_X + indent,
            y,
            size: fontSize,
            font,
            color: rgb(0.12, 0.16, 0.22),
          });
          y -= 14.5;
        }
      }
      y -= 4;
      continue;
    }

    if (block.kind === 'quote') {
      const padX = 14;
      const innerW = CONTENT_W - padX * 2;
      const wrappedBody: string[] = [];
      for (const ln of block.lines) {
        wrappedBody.push(...wrapText(ln, fonts.serif, 10, innerW));
      }
      const wrappedSrc = wrapText(block.source, fonts.sansBold, 9.2, innerW);
      const boxH = 22 + wrappedBody.length * 14.5 + wrappedSrc.length * 13 + 14;
      ensureSpace(boxH + 8);

      const boxBottom = y - boxH + 10;
      page.drawRectangle({
        x: MARGIN_X,
        y: boxBottom,
        width: CONTENT_W,
        height: boxH,
        color: rgb(1, 0.985, 0.93),
        borderColor: rgb(0.85, 0.65, 0.2),
        borderWidth: 0.9,
      });
      page.drawRectangle({
        x: MARGIN_X,
        y: boxBottom,
        width: 4,
        height: boxH,
        color: rgb(0.75, 0.45, 0.08),
      });

      let ty = y - 6;
      page.drawText(block.title, {
        x: MARGIN_X + padX,
        y: ty,
        size: 10,
        font: fonts.sansBold,
        color: rgb(0.57, 0.25, 0.05),
      });
      ty -= 16;

      for (const ln of wrappedBody) {
        page.drawText(ln, {
          x: MARGIN_X + padX,
          y: ty,
          size: 10,
          font: fonts.serif,
          color: rgb(0.15, 0.18, 0.22),
        });
        ty -= 14.5;
      }

      ty -= 2;
      for (const sLn of wrappedSrc) {
        page.drawText(sLn, {
          x: MARGIN_X + padX,
          y: ty,
          size: 9.2,
          font: fonts.sansBold,
          color: rgb(0.47, 0.22, 0.06),
        });
        ty -= 13;
      }

      y = boxBottom - 12;
      continue;
    }

    if (block.kind === 'callout') {
      const padX = 12;
      const innerW = CONTENT_W - padX * 2;
      const wrapped = wrapText(block.text, fonts.sans, 9.6, innerW);
      const boxH = 20 + wrapped.length * 13.8 + 10;
      ensureSpace(boxH + 8);

      const palette =
        block.tone === 'amber'
          ? { bg: rgb(1, 0.98, 0.92), border: rgb(0.92, 0.72, 0.25), title: rgb(0.6, 0.3, 0.05) }
          : block.tone === 'slate'
            ? { bg: rgb(0.96, 0.97, 0.98), border: rgb(0.78, 0.82, 0.86), title: rgb(0.15, 0.22, 0.3) }
            : { bg: rgb(0.94, 0.98, 0.97), border: rgb(0.45, 0.78, 0.72), title: rgb(0.05, 0.42, 0.38) };

      const boxBottom = y - boxH + 10;
      page.drawRectangle({
        x: MARGIN_X,
        y: boxBottom,
        width: CONTENT_W,
        height: boxH,
        color: palette.bg,
        borderColor: palette.border,
        borderWidth: 0.9,
      });

      let ty = y - 5;
      page.drawText(block.title, {
        x: MARGIN_X + padX,
        y: ty,
        size: 9.8,
        font: fonts.sansBold,
        color: palette.title,
      });
      ty -= 14.5;
      for (const ln of wrapped) {
        page.drawText(ln, {
          x: MARGIN_X + padX,
          y: ty,
          size: 9.6,
          font: fonts.sans,
          color: rgb(0.18, 0.22, 0.28),
        });
        ty -= 13.8;
      }
      y = boxBottom - 10;
      continue;
    }

    if (block.kind === 'table') {
      const colCount = block.headers.length;
      const weights =
        block.colWeights && block.colWeights.length === colCount
          ? block.colWeights
          : Array.from({ length: colCount }, () => 1);
      const totalW = weights.reduce((a, b) => a + b, 0);
      const colWidths = weights.map((w) => (w / totalW) * CONTENT_W);
      const cellPad = 6;
      const fontSize = 9.2;
      const lineH = 12.6;

      const drawRow = (cells: string[], isHeader: boolean) => {
        const font = isHeader ? fonts.sansBold : fonts.sans;
        const wrappedCells = cells.map((cell, ci) =>
          wrapText(cell, font, fontSize, Math.max(24, colWidths[ci] - cellPad * 2))
        );
        const maxLines = Math.max(1, ...wrappedCells.map((w) => w.length));
        const rowH = maxLines * lineH + 9;
        ensureSpace(rowH + 4);

        const rowBottom = y - rowH + 10;
        let cx = MARGIN_X;
        for (let ci = 0; ci < colCount; ci++) {
          page.drawRectangle({
            x: cx,
            y: rowBottom,
            width: colWidths[ci],
            height: rowH,
            color: isHeader ? rgb(0.9, 0.95, 0.94) : rgb(1, 1, 1),
            borderColor: rgb(0.75, 0.81, 0.84),
            borderWidth: 0.7,
          });
          let ty = y - 2;
          for (const ln of wrappedCells[ci]) {
            page.drawText(ln, {
              x: cx + cellPad,
              y: ty,
              size: fontSize,
              font,
              color: isHeader ? rgb(0.09, 0.31, 0.39) : rgb(0.14, 0.18, 0.24),
            });
            ty -= lineH;
          }
          cx += colWidths[ci];
        }
        y = rowBottom - 10;
      };

      drawRow(block.headers, true);
      for (const row of block.rows) {
        drawRow(row, false);
      }
      y -= 4;
      continue;
    }

    if (block.kind === 'writingLines') {
      const needed = (block.title ? 18 : 0) + block.count * 20 + 8;
      ensureSpace(needed);
      if (block.title) {
        page.drawText(block.title, {
          x: MARGIN_X,
          y,
          size: 10,
          font: fonts.sansBold,
          color: rgb(0.09, 0.31, 0.39),
        });
        y -= 18;
      }
      for (let i = 0; i < block.count; i++) {
        page.drawLine({
          start: { x: MARGIN_X, y },
          end: { x: A4_W - MARGIN_X, y },
          thickness: 0.6,
          dashArray: [3, 3],
          color: rgb(0.7, 0.75, 0.8),
        });
        y -= 20;
      }
      y -= 4;
      continue;
    }

    if (block.kind === 'code') {
      const padX = 12;
      const innerW = CONTENT_W - padX * 2;
      const fontSize = 9.0;
      const lineH = 12.6;
      const wrappedLines: string[] = [];
      for (const rawLine of block.lines) {
        const leadingSpaces = rawLine.match(/^ +/)?.[0] || '';
        const trimmed = rawLine.slice(leadingSpaces.length);
        if (!trimmed) {
          wrappedLines.push('');
        } else {
          const chunks = wrapText(trimmed, fonts.sans, fontSize, Math.max(80, innerW - leadingSpaces.length * 4));
          chunks.forEach((ch, idx) => {
            wrappedLines.push((idx === 0 ? leadingSpaces : leadingSpaces + '  ') + ch);
          });
        }
      }
      const titleH = block.title ? 16 : 0;
      const boxH = titleH + wrappedLines.length * lineH + 14;
      ensureSpace(boxH + 8);

      const boxBottom = y - boxH + 10;
      page.drawRectangle({
        x: MARGIN_X,
        y: boxBottom,
        width: CONTENT_W,
        height: boxH,
        color: rgb(0.95, 0.97, 0.985),
        borderColor: rgb(0.72, 0.79, 0.85),
        borderWidth: 0.9,
      });
      page.drawRectangle({
        x: MARGIN_X,
        y: boxBottom,
        width: 3.5,
        height: boxH,
        color: rgb(0.09, 0.31, 0.39),
      });

      let ty = y - 4;
      if (block.title) {
        page.drawText(block.title, {
          x: MARGIN_X + padX,
          y: ty,
          size: 9.2,
          font: fonts.sansBold,
          color: rgb(0.09, 0.31, 0.39),
        });
        ty -= 16;
      }

      for (const ln of wrappedLines) {
        if (ln) {
          page.drawText(ln, {
            x: MARGIN_X + padX,
            y: ty,
            size: fontSize,
            font: fonts.sans,
            color: rgb(0.11, 0.16, 0.24),
          });
        }
        ty -= lineH;
      }
      y = boxBottom - 10;
    }
  }

  // Footers with real page numbers on all pages
  const totalPages = pages.length;
  const footerText = spec.footerNote || 'Tài liệu mẫu – PDF EDU STUDIO.';
  pages.forEach((p, idx) => {
    p.drawLine({
      start: { x: MARGIN_X, y: 40 },
      end: { x: A4_W - MARGIN_X, y: 40 },
      thickness: 0.6,
      color: rgb(0.84, 0.88, 0.9),
    });
    p.drawText(footerText, {
      x: MARGIN_X,
      y: 26,
      size: 8.4,
      font: fonts.sans,
      color: rgb(0.45, 0.5, 0.56),
    });
    const pageLabel = `Trang ${idx + 1} / ${totalPages}`;
    const labelW = fonts.sansBold.widthOfTextAtSize(pageLabel, 8.6);
    p.drawText(pageLabel, {
      x: A4_W - MARGIN_X - labelW,
      y: 26,
      size: 8.6,
      font: fonts.sansBold,
      color: rgb(0.09, 0.31, 0.39),
    });
  });

  pdf.setTitle(spec.title);
  pdf.setCreator('PDF EDU STUDIO');
  return pdf.save();
}
