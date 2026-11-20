import { getPdfjsLib, type PDFDocumentLoadingTask, type PDFDocumentProxy } from './pdfjsConfig';

export type PdfInput = File | Blob | ArrayBuffer | Uint8Array;

export interface LoadedPdfHandle {
  proxy: PDFDocumentProxy;
  task: PDFDocumentLoadingTask;
  destroy: () => Promise<void>;
}

/**
 * Convert any supported PDF source (File, Blob, ArrayBuffer, Uint8Array) into an isolated
 * Uint8Array copy so transferring the buffer to the PDF.js Worker never detaches caller memory.
 */
export async function toSafePdfBytes(input: PdfInput): Promise<Uint8Array> {
  let raw: Uint8Array;
  if (input instanceof Uint8Array) {
    raw = new Uint8Array(input.byteLength);
    raw.set(input);
  } else if (input instanceof ArrayBuffer) {
    raw = new Uint8Array(input.slice(0));
  } else if (typeof Blob !== 'undefined' && input instanceof Blob) {
    const buf = await input.arrayBuffer();
    raw = new Uint8Array(buf);
  } else {
    throw new Error('Nguồn dữ liệu PDF không hợp lệ.');
  }

  if (raw.byteLength < 8) {
    throw new Error('Tệp PDF trống hoặc bị lỗi cấu trúc.');
  }

  // Verify PDF header signature (%PDF-) within the first 1024 bytes per PDF specification
  const headerProbeLen = Math.min(raw.byteLength, 1024);
  let headerStr = '';
  for (let i = 0; i < headerProbeLen; i++) {
    headerStr += String.fromCharCode(raw[i]);
  }
  if (!headerStr.includes('%PDF-')) {
    throw new Error('Dữ liệu không đúng định dạng tệp PDF tiêu chuẩn.');
  }

  return raw;
}

/**
 * Safely release a PDF.js document proxy across pdfjs-dist versions without throwing.
 */
export async function destroyPdfProxy(
  proxy: PDFDocumentProxy | null | undefined
): Promise<void> {
  if (!proxy) return;
  try {
    const p = proxy as unknown as {
      destroy?: () => Promise<void>;
      cleanup?: () => Promise<void>;
    };
    if (typeof p.destroy === 'function') {
      await p.destroy();
    } else if (typeof p.cleanup === 'function') {
      await p.cleanup();
    }
  } catch {
    // Ignore teardown race errors during rapid tab switch or unmount
  }
}

/**
 * Safely cancel/destroy a PDF.js loading task.
 */
export async function destroyLoadingTask(
  task: PDFDocumentLoadingTask | null | undefined
): Promise<void> {
  if (!task) return;
  try {
    if (typeof task.destroy === 'function') {
      await task.destroy();
    }
  } catch {
    // Ignore already-destroyed task
  }
}

/**
 * Shared PDF loading service for the entire application:
 * - Lazy-loads PDF.js & Worker only when a PDF is actually opened
 * - Supports File, Blob, ArrayBuffer, and Uint8Array
 * - Always runs with the configured local PDF.js Worker
 * - Manages clean teardown of both loadingTask and PDFDocumentProxy
 */
export async function openPdfDocument(input: PdfInput): Promise<LoadedPdfHandle> {
  const [safeBytes, pdfjsLib] = await Promise.all([
    toSafePdfBytes(input),
    getPdfjsLib(),
  ]);
  const task = pdfjsLib.getDocument({
    data: safeBytes,
    useSystemFonts: true,
  }) as unknown as PDFDocumentLoadingTask;

  let proxy: PDFDocumentProxy;
  try {
    proxy = await task.promise;
  } catch (err) {
    await destroyLoadingTask(task);
    throw err;
  }

  let destroyed = false;
  const destroy = async () => {
    if (destroyed) return;
    destroyed = true;
    await destroyPdfProxy(proxy);
    await destroyLoadingTask(task);
  };

  return { proxy, task, destroy };
}

/**
 * Convenience loader returning a PDFDocumentProxy directly.
 * Callers must call `destroyPdfProxy(proxy)` when done.
 */
export async function loadPdf(input: PdfInput): Promise<PDFDocumentProxy> {
  const { proxy } = await openPdfDocument(input);
  return proxy;
}
