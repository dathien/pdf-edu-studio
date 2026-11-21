import {
  PDFArray,
  PDFDict,
  PDFDocument,
  PDFHexString,
  PDFName,
  PDFRawStream,
  PDFString,
  decodePDFRawStream,
} from 'pdf-lib';

/**
 * Standard ISO 32000-1 PDF Embedded File names stored inside /Catalog /Names /EmbeddedFiles.
 * Keeps every exported file a 100% valid standard .pdf (application/pdf) readable in all
 * normal PDF viewers (Chrome, Edge, Safari, Preview, Adobe Acrobat, Foxit, Zalo) while
 * preserving structured editable data when reopened in PDF EDU STUDIO.
 */
export const PDF_EMBED_NAMES = {
  WORKSHEET: 'pdf_edu_worksheet.json',
  TEACHER_MASTER: 'pdf_edu_teacher_master.json',
  SUBMISSION: 'pdf_edu_submission.json',
  WORKSHEET_SNAPSHOT: 'pdf_edu_worksheet_snapshot.json',
  CLEAN_SOURCE_PDF: 'pdf_edu_clean_source.pdf',
  INTEGRITY: 'pdf_edu_integrity.json',
  STUDIO_STATE: 'pdf_edu_studio_state.json',
  ATTACHMENT_PREFIX: 'pdf_edu_att_',
} as const;

const BLOCKED_EMBED_EXTENSIONS = new Set([
  'js',
  'mjs',
  'cjs',
  'ts',
  'html',
  'htm',
  'xhtml',
  'svg',
  'exe',
  'bat',
  'cmd',
  'sh',
  'ps1',
  'vbs',
  'com',
  'msi',
  'scr',
  'dll',
  'jar',
  'php',
  'pyw',
  'hta',
  'reg',
]);

export function validatePdfHeaderBytes(bytes: Uint8Array): boolean {
  if (bytes.byteLength < 8) return false;
  const head = new TextDecoder('ascii').decode(bytes.subarray(0, Math.min(1024, bytes.byteLength)));
  return head.includes('%PDF-');
}

export function isUnsafeEmbeddedFileName(name: string): boolean {
  if (!name || name.includes('..') || name.startsWith('/') || name.includes('\\')) {
    return true;
  }
  const ext = (name.split('.').pop() || '').toLowerCase();
  return BLOCKED_EMBED_EXTENSIONS.has(ext);
}

/**
 * Reads all standard PDF Embedded Files (/Catalog -> /Names -> /EmbeddedFiles).
 * Rejects path traversal or blocked executable/script embedded entries.
 */
export async function readPdfEmbeddedFiles(
  pdfBytes: Uint8Array
): Promise<Record<string, Uint8Array>> {
  const doc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const out: Record<string, Uint8Array> = {};

  const names = doc.catalog.lookupMaybe(PDFName.of('Names'), PDFDict);
  if (!names) return out;
  const embeddedFiles = names.lookupMaybe(PDFName.of('EmbeddedFiles'), PDFDict);
  if (!embeddedFiles) return out;

  const visitTree = (node: PDFDict) => {
    const kids = node.lookupMaybe(PDFName.of('Kids'), PDFArray);
    if (kids) {
      for (let i = 0; i < kids.size(); i++) {
        const kid = kids.lookupMaybe(i, PDFDict);
        if (kid) visitTree(kid);
      }
    }
    const pairs = node.lookupMaybe(PDFName.of('Names'), PDFArray);
    if (!pairs) return;
    for (let i = 0; i + 1 < pairs.size(); i += 2) {
      const keyObj = pairs.lookup(i);
      const spec = pairs.lookupMaybe(i + 1, PDFDict);
      if (!spec) continue;

      let fileName = '';
      const uf = spec.lookup(PDFName.of('UF'));
      const f = spec.lookup(PDFName.of('F'));
      const nameObj = uf || f || keyObj;
      if (nameObj instanceof PDFHexString || nameObj instanceof PDFString) {
        fileName = nameObj.decodeText();
      }
      if (!fileName) continue;

      if (isUnsafeEmbeddedFileName(fileName)) {
        const ext = (fileName.split('.').pop() || '').toLowerCase();
        throw new Error(
          `Tệp PDF chứa thành phần nhúng không an toàn hoặc bị chặn (.${ext || 'invalid'}).`
        );
      }

      const ef = spec.lookupMaybe(PDFName.of('EF'), PDFDict);
      if (!ef) continue;
      const stream = ef.lookup(PDFName.of('UF')) || ef.lookup(PDFName.of('F'));
      if (stream instanceof PDFRawStream) {
        out[fileName] = decodePDFRawStream(stream).decode();
      }
    }
  };

  visitTree(embeddedFiles);
  return out;
}

/**
 * Removes any previous /EmbeddedFiles dictionary from the PDF catalog before attaching
 * fresh metadata so repeated saves never accumulate stale embedded copies.
 */
export function clearPdfEmbeddedFiles(pdfDoc: PDFDocument): void {
  const names = pdfDoc.catalog.lookupMaybe(PDFName.of('Names'), PDFDict);
  if (names && names.has(PDFName.of('EmbeddedFiles'))) {
    names.delete(PDFName.of('EmbeddedFiles'));
  }
}

export interface PdfEmbeddedEntry {
  name: string;
  bytes: Uint8Array;
  mimeType: string;
  description?: string;
}

/**
 * Attaches structured metadata / clean source PDF inside a standard PDF via ISO 32000-1
 * /Names /EmbeddedFiles while preserving 100% compatibility with all standard PDF viewers.
 */
export async function attachEmbeddedFilesToPdf(
  pdfBytes: Uint8Array,
  entries: PdfEmbeddedEntry[]
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  clearPdfEmbeddedFiles(pdfDoc);
  for (const entry of entries) {
    if (isUnsafeEmbeddedFileName(entry.name)) {
      throw new Error(`Không được phép nhúng tệp có tên không an toàn: ${entry.name}`);
    }
    await pdfDoc.attach(entry.bytes, entry.name, {
      mimeType: entry.mimeType,
      description: entry.description || 'PDF EDU STUDIO structured compatibility data',
      creationDate: new Date(),
      modificationDate: new Date(),
    });
  }
  pdfDoc.setProducer('PDF EDU STUDIO');
  return pdfDoc.save();
}

/**
 * Returns a clean PDF copy without any PDF EDU STUDIO embedded data.
 */
export async function stripEmbeddedFilesFromPdfBytes(pdfBytes: Uint8Array): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  clearPdfEmbeddedFiles(pdfDoc);
  return pdfDoc.save();
}
