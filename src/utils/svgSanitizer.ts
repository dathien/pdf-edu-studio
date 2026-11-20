/**
 * Pure, lightweight SVG sanitizer — decoupled from pdf-lib / pdfEngine
 * so DiagramLibraryPanel and FormulaPanel never drag heavy PDF export bundles.
 */

const FORBIDDEN_TAGS = 'script, foreignObject, iframe, object, embed, link';

export function sanitizeSvgMarkup(rawSvg: string): string {
  if (!rawSvg || typeof rawSvg !== 'string') {
    throw new Error('Nội dung SVG trống hoặc không hợp lệ.');
  }
  if (typeof DOMParser === 'undefined') {
    // SSR / Node fallback: strip script/event handlers safely via regex
    return rawSvg
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
      .replace(/\son[a-z]+\s*=\s*(['"])[\s\S]*?\1/gi, '');
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(rawSvg, 'image/svg+xml');
  const svg = doc.querySelector('svg');
  if (!svg) {
    throw new Error('Tệp SVG không hợp lệ.');
  }

  const forbidden = doc.querySelectorAll(FORBIDDEN_TAGS);
  forbidden.forEach((el) => el.remove());

  const walker = doc.createTreeWalker(svg, NodeFilter.SHOW_ELEMENT);
  let node = walker.nextNode() as Element | null;
  while (node) {
    for (const attr of Array.from(node.attributes)) {
      const name = attr.name.toLowerCase();
      const val = attr.value.trim().toLowerCase();
      if (
        name.startsWith('on') ||
        val.startsWith('javascript:') ||
        val.startsWith('data:text/html')
      ) {
        node.removeAttribute(attr.name);
      }
    }
    node = walker.nextNode() as Element | null;
  }

  return new XMLSerializer().serializeToString(svg);
}

/**
 * Safe variant for rendering thumbnails in lists/grids:
 * guarantees one malformed custom SVG can never crash the whole panel.
 */
export function safeSanitizeSvgMarkup(rawSvg: string): string {
  try {
    return sanitizeSvgMarkup(rawSvg);
  } catch {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80"><rect x="4" y="4" width="112" height="72" rx="6" fill="#F8FAFC" stroke="#CBD5E1" stroke-dasharray="4 3"/><text x="60" y="44" text-anchor="middle" font-size="11" fill="#64748B">Xem trước lỗi</text></svg>';
  }
}
