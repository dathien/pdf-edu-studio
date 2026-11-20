import type { PDFDocumentLoadingTask, PDFDocumentProxy } from 'pdfjs-dist';

type PdfjsModule = typeof import('pdfjs-dist/legacy/build/pdf.mjs');

/**
 * Resolve the static local PDF.js Worker asset bundled in `public/workers/pdf.worker.min.mjs`.
 * Automatically synced from the exact installed `pdfjs-dist` version via `scripts/copy-pdf-worker.mjs`.
 *
 * Never relies on `/node_modules/...`, `?import` URLs, or external CDNs.
 */
function resolvePdfWorkerUrl(): string {
  const rawBase = (import.meta as { env?: { BASE_URL?: string } }).env?.BASE_URL || '/';
  const normalizedBase = rawBase.endsWith('/') ? rawBase : `${rawBase}/`;
  return `${normalizedBase}workers/pdf.worker.min.mjs`;
}

export const PDF_WORKER_URL = resolvePdfWorkerUrl();

let pdfjsPromise: Promise<PdfjsModule> | null = null;

/**
 * Lazy-initialize PDF.js (cross-browser legacy build with full ES polyfills)
 * and bind the matching local static Worker URL on first PDF action.
 *
 * Guarantees PDF.js is NEVER loaded or executed during initial UI startup.
 */
export async function getPdfjsLib(): Promise<PdfjsModule> {
  if (!pdfjsPromise) {
    pdfjsPromise = import('pdfjs-dist/legacy/build/pdf.mjs')
      .then((mod) => {
        if (mod.GlobalWorkerOptions.workerSrc !== PDF_WORKER_URL) {
          mod.GlobalWorkerOptions.workerSrc = PDF_WORKER_URL;
        }
        return mod;
      })
      .catch((err) => {
        // Allow future retries if a transient network/module load error occurs
        pdfjsPromise = null;
        throw err;
      });
  }
  return pdfjsPromise;
}

export type { PDFDocumentProxy, PDFDocumentLoadingTask };
