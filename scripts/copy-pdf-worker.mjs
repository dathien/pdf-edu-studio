import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const srcWorker = path.join(rootDir, 'node_modules', 'pdfjs-dist', 'legacy', 'build', 'pdf.worker.min.mjs');
const destDir = path.join(rootDir, 'public', 'workers');
const destWorker = path.join(destDir, 'pdf.worker.min.mjs');

if (!fs.existsSync(srcWorker)) {
  console.error(`[prepare:worker] Missing pdf.worker.min.mjs at ${srcWorker}`);
  process.exit(1);
}

fs.mkdirSync(destDir, { recursive: true });
fs.copyFileSync(srcWorker, destWorker);

const pkg = JSON.parse(
  fs.readFileSync(path.join(rootDir, 'node_modules', 'pdfjs-dist', 'package.json'), 'utf8')
);
const stat = fs.statSync(destWorker);
console.log(
  `[prepare:worker] Synced pdfjs-dist@${pkg.version} worker -> public/workers/pdf.worker.min.mjs (${Math.round(stat.size / 1024)} KB)`
);
