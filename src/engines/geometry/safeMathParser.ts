/**
 * Safe recursive-descent mathematical expression parser & evaluator.
 * ZERO eval() / new Function() usage. Supports implicit multiplication, functions, constants, and parameters.
 */

type TokenType = 'num' | 'id' | 'op' | 'lparen' | 'rparen' | 'comma' | 'eof';

interface Token {
  type: TokenType;
  value: string;
}

const FUNCTIONS: Record<string, (x: number) => number> = {
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  cot: (x) => 1 / Math.tan(x),
  asin: Math.asin,
  acos: Math.acos,
  atan: Math.atan,
  sqrt: Math.sqrt,
  cbrt: Math.cbrt,
  abs: Math.abs,
  ln: Math.log,
  log: Math.log10,
  log2: Math.log2,
  exp: Math.exp,
  floor: Math.floor,
  ceil: Math.ceil,
  round: Math.round,
  sinh: Math.sinh,
  cosh: Math.cosh,
  tanh: Math.tanh,
};

function tokenize(input: string): Token[] {
  const s = input
    .replace(/,/g, '.')
    .replace(/π/g, 'pi')
    .replace(/×/g, '*')
    .replace(/·/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-');

  const raw: Token[] = [];
  let i = 0;
  while (i < s.length) {
    const ch = s[i];
    if (/\s/.test(ch)) {
      i++;
      continue;
    }
    if (/[0-9.]/.test(ch)) {
      let num = '';
      while (i < s.length && /[0-9.]/.test(s[i])) {
        num += s[i++];
      }
      raw.push({ type: 'num', value: num });
      continue;
    }
    if (/[a-zA-Z_]/.test(ch)) {
      let id = '';
      while (i < s.length && /[a-zA-Z0-9_]/.test(s[i])) {
        id += s[i++];
      }
      raw.push({ type: 'id', value: id.toLowerCase() });
      continue;
    }
    if ('+-*/^'.includes(ch)) {
      raw.push({ type: 'op', value: ch });
      i++;
      continue;
    }
    if (ch === '(') {
      raw.push({ type: 'lparen', value: '(' });
      i++;
      continue;
    }
    if (ch === ')') {
      raw.push({ type: 'rparen', value: ')' });
      i++;
      continue;
    }
    i++;
  }

  // Insert implicit multiplication: 2x, 2(x+1), (x+1)(x-1), x(x+1), 2sin(x)
  const tokens: Token[] = [];
  for (let idx = 0; idx < raw.length; idx++) {
    const cur = raw[idx];
    tokens.push(cur);
    const next = raw[idx + 1];
    if (!next) continue;
    const curEndsAtom =
      cur.type === 'num' ||
      cur.type === 'rparen' ||
      (cur.type === 'id' && !(cur.value in FUNCTIONS));
    const nextStartsAtom = next.type === 'id' || next.type === 'lparen' || next.type === 'num';
    if (curEndsAtom && nextStartsAtom) {
      tokens.push({ type: 'op', value: '*' });
    }
  }
  tokens.push({ type: 'eof', value: '' });
  return tokens;
}

type AstNode =
  | { kind: 'num'; value: number }
  | { kind: 'var'; name: string }
  | { kind: 'unary'; op: '+' | '-'; expr: AstNode }
  | { kind: 'binary'; op: '+' | '-' | '*' | '/' | '^'; left: AstNode; right: AstNode }
  | { kind: 'call'; fn: string; arg: AstNode };

export type CompiledExpr = (vars: Record<string, number>) => number;

export function compileMathExpression(expression: string): {
  fn: CompiledExpr | null;
  error?: string;
} {
  if (!expression.trim()) return { fn: null, error: 'Biểu thức trống' };
  const tokens = tokenize(expression);
  let pos = 0;

  const peek = () => tokens[pos];
  const consume = () => tokens[pos++];

  function parseAddSub(): AstNode {
    let left = parseMulDiv();
    while (peek().type === 'op' && (peek().value === '+' || peek().value === '-')) {
      const op = consume().value as '+' | '-';
      const right = parseMulDiv();
      left = { kind: 'binary', op, left, right };
    }
    return left;
  }

  function parseMulDiv(): AstNode {
    let left = parseUnary();
    while (peek().type === 'op' && (peek().value === '*' || peek().value === '/')) {
      const op = consume().value as '*' | '/';
      const right = parseUnary();
      left = { kind: 'binary', op, left, right };
    }
    return left;
  }

  function parseUnary(): AstNode {
    if (peek().type === 'op' && (peek().value === '+' || peek().value === '-')) {
      const op = consume().value as '+' | '-';
      return { kind: 'unary', op, expr: parseUnary() };
    }
    return parsePower();
  }

  function parsePower(): AstNode {
    let base = parsePrimary();
    if (peek().type === 'op' && peek().value === '^') {
      consume();
      const exp = parseUnary();
      base = { kind: 'binary', op: '^', left: base, right: exp };
    }
    return base;
  }

  function parsePrimary(): AstNode {
    const t = peek();
    if (t.type === 'num') {
      consume();
      const val = Number(t.value);
      if (Number.isNaN(val)) throw new Error(`Số không hợp lệ: ${t.value}`);
      return { kind: 'num', value: val };
    }
    if (t.type === 'id') {
      consume();
      if (t.value in FUNCTIONS) {
        if (peek().type === 'lparen') {
          consume();
          const arg = parseAddSub();
          if (peek().type !== 'rparen') throw new Error('Thiếu dấu ngoặc đóng )');
          consume();
          return { kind: 'call', fn: t.value, arg };
        }
        const arg = parseUnary();
        return { kind: 'call', fn: t.value, arg };
      }
      if (t.value === 'pi') return { kind: 'num', value: Math.PI };
      if (t.value === 'e') return { kind: 'num', value: Math.E };
      return { kind: 'var', name: t.value };
    }
    if (t.type === 'lparen') {
      consume();
      const expr = parseAddSub();
      if (peek().type !== 'rparen') throw new Error('Thiếu dấu ngoặc đóng )');
      consume();
      return expr;
    }
    throw new Error(`Ký hiệu không hợp lệ gần "${t.value || 'cuối biểu thức'}"`);
  }

  try {
    const ast = parseAddSub();
    if (peek().type !== 'eof') {
      return { fn: null, error: `Ký hiệu dư thừa: "${peek().value}"` };
    }

    const evaluate = (node: AstNode, vars: Record<string, number>): number => {
      switch (node.kind) {
        case 'num':
          return node.value;
        case 'var':
          return vars[node.name] ?? Number.NaN;
        case 'unary': {
          const v = evaluate(node.expr, vars);
          return node.op === '-' ? -v : v;
        }
        case 'binary': {
          const l = evaluate(node.left, vars);
          const r = evaluate(node.right, vars);
          switch (node.op) {
            case '+':
              return l + r;
            case '-':
              return l - r;
            case '*':
              return l * r;
            case '/':
              return Math.abs(r) < 1e-12 ? Number.NaN : l / r;
            case '^':
              return Math.pow(l, r);
          }
          break;
        }
        case 'call': {
          const arg = evaluate(node.arg, vars);
          const f = FUNCTIONS[node.fn];
          return f ? f(arg) : Number.NaN;
        }
      }
      return Number.NaN;
    };

    return { fn: (vars) => evaluate(ast, vars) };
  } catch (err) {
    return { fn: null, error: err instanceof Error ? err.message : 'Biểu thức không hợp lệ' };
  }
}

export interface GraphFunctionSpec {
  id: string;
  expression: string;
  color: string;
  visible: boolean;
  inequality?: 'none' | 'gt' | 'lt';
}

export interface GraphBuildOptions {
  functions: GraphFunctionSpec[];
  params: Record<string, number>;
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  showGrid: boolean;
  showExtrema: boolean;
  showAsymptotes: boolean;
  showIntersections: boolean;
  width?: number;
  height?: number;
}

export interface GraphBuildResult {
  svgMarkup: string;
  extrema: Array<{ expr: string; x: number; y: number; kind: 'max' | 'min' }>;
  intersections: Array<{ x: number; y: number }>;
  asymptotesX: number[];
}

export function buildFunctionGraphSvg(opts: GraphBuildOptions): GraphBuildResult {
  const W = opts.width ?? 460;
  const H = opts.height ?? 340;
  const pad = 34;
  const plotW = W - pad * 2;
  const plotH = H - pad * 2;

  const toSx = (x: number) => pad + ((x - opts.xMin) / (opts.xMax - opts.xMin)) * plotW;
  const toSy = (y: number) => pad + ((opts.yMax - y) / (opts.yMax - opts.yMin)) * plotH;

  const parts: string[] = [];
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`
  );
  parts.push(`<defs><clipPath id="graph-clip"><rect x="${pad}" y="${pad}" width="${plotW}" height="${plotH}"/></clipPath></defs>`);
  parts.push(`<rect x="0" y="0" width="${W}" height="${H}" fill="#FFFFFF"/>`);

  // Grid lines
  if (opts.showGrid) {
    const xStep = Math.max(0.5, Math.ceil((opts.xMax - opts.xMin) / 10));
    const yStep = Math.max(0.5, Math.ceil((opts.yMax - opts.yMin) / 8));
    for (let x = Math.ceil(opts.xMin / xStep) * xStep; x <= opts.xMax; x += xStep) {
      const sx = toSx(x);
      parts.push(`<line x1="${sx.toFixed(1)}" y1="${pad}" x2="${sx.toFixed(1)}" y2="${H - pad}" stroke="#E2E8F0" stroke-width="0.9"/>`);
    }
    for (let y = Math.ceil(opts.yMin / yStep) * yStep; y <= opts.yMax; y += yStep) {
      const sy = toSy(y);
      parts.push(`<line x1="${pad}" y1="${sy.toFixed(1)}" x2="${W - pad}" y2="${sy.toFixed(1)}" stroke="#E2E8F0" stroke-width="0.9"/>`);
    }
  }

  // Axes
  const ox = toSx(0);
  const oy = toSy(0);
  const clampedOx = Math.max(pad, Math.min(W - pad, ox));
  const clampedOy = Math.max(pad, Math.min(H - pad, oy));

  // X-axis & arrow
  parts.push(`<line x1="${pad}" y1="${clampedOy.toFixed(1)}" x2="${W - pad + 10}" y2="${clampedOy.toFixed(1)}" stroke="#1F2937" stroke-width="1.5"/>`);
  parts.push(`<polygon points="${W - pad + 12},${clampedOy.toFixed(1)} ${W - pad + 4},${(clampedOy - 4).toFixed(1)} ${W - pad + 4},${(clampedOy + 4).toFixed(1)}" fill="#1F2937"/>`);
  parts.push(`<text x="${W - pad + 15}" y="${(clampedOy + 4).toFixed(1)}" font-family="DejaVu Serif, serif" font-style="italic" font-size="13" fill="#1F2937">x</text>`);

  // Y-axis & arrow
  parts.push(`<line x1="${clampedOx.toFixed(1)}" y1="${H - pad}" x2="${clampedOx.toFixed(1)}" y2="${pad - 10}" stroke="#1F2937" stroke-width="1.5"/>`);
  parts.push(`<polygon points="${clampedOx.toFixed(1)},${pad - 12} ${(clampedOx - 4).toFixed(1)},${pad - 4} ${(clampedOx + 4).toFixed(1)},${pad - 4}" fill="#1F2937"/>`);
  parts.push(`<text x="${(clampedOx + 7).toFixed(1)}" y="${pad - 6}" font-family="DejaVu Serif, serif" font-style="italic" font-size="13" fill="#1F2937">y</text>`);

  // Tick numbers
  const xTickStep = Math.max(1, Math.ceil((opts.xMax - opts.xMin) / 10));
  for (let x = Math.ceil(opts.xMin / xTickStep) * xTickStep; x <= opts.xMax; x += xTickStep) {
    if (Math.abs(x) < 1e-6) continue;
    const sx = toSx(x);
    parts.push(`<line x1="${sx.toFixed(1)}" y1="${(clampedOy - 3).toFixed(1)}" x2="${sx.toFixed(1)}" y2="${(clampedOy + 3).toFixed(1)}" stroke="#1F2937" stroke-width="1"/>`);
    parts.push(`<text x="${sx.toFixed(1)}" y="${(clampedOy + 15).toFixed(1)}" text-anchor="middle" font-family="DejaVu Sans, sans-serif" font-size="10" fill="#4B5563">${x}</text>`);
  }
  const yTickStep = Math.max(1, Math.ceil((opts.yMax - opts.yMin) / 8));
  for (let y = Math.ceil(opts.yMin / yTickStep) * yTickStep; y <= opts.yMax; y += yTickStep) {
    if (Math.abs(y) < 1e-6) continue;
    const sy = toSy(y);
    parts.push(`<line x1="${(clampedOx - 3).toFixed(1)}" y1="${sy.toFixed(1)}" x2="${(clampedOx + 3).toFixed(1)}" y2="${sy.toFixed(1)}" stroke="#1F2937" stroke-width="1"/>`);
    parts.push(`<text x="${(clampedOx - 7).toFixed(1)}" y="${(sy + 3.5).toFixed(1)}" text-anchor="end" font-family="DejaVu Sans, sans-serif" font-size="10" fill="#4B5563">${y}</text>`);
  }
  if (ox >= pad && ox <= W - pad && oy >= pad && oy <= H - pad) {
    parts.push(`<text x="${(ox - 10).toFixed(1)}" y="${(oy + 14).toFixed(1)}" font-family="DejaVu Serif, serif" font-style="italic" font-size="11" fill="#1F2937">O</text>`);
  }

  const samples = 520;
  const dx = (opts.xMax - opts.xMin) / samples;
  const ySpan = opts.yMax - opts.yMin;
  const extrema: GraphBuildResult['extrema'] = [];
  const asymptotesX: number[] = [];
  const intersections: GraphBuildResult['intersections'] = [];

  const compiledList: Array<{ spec: GraphFunctionSpec; fn: CompiledExpr; ys: number[] }> = [];

  parts.push('<g clip-path="url(#graph-clip)">');

  for (const spec of opts.functions) {
    if (!spec.visible || !spec.expression.trim()) continue;
    const compiled = compileMathExpression(spec.expression);
    if (!compiled.fn) continue;
    const fn = compiled.fn;

    const ys: number[] = [];
    const xs: number[] = [];
    for (let i = 0; i <= samples; i++) {
      const x = opts.xMin + i * dx;
      xs.push(x);
      const y = fn({ ...opts.params, x });
      ys.push(Number.isFinite(y) ? y : Number.NaN);
    }
    compiledList.push({ spec, fn, ys });

    // Inequality shading if enabled
    if (spec.inequality && spec.inequality !== 'none') {
      const targetY = spec.inequality === 'gt' ? pad : H - pad;
      let polyPts: string[] = [];
      for (let i = 0; i <= samples; i++) {
        const y = ys[i];
        if (!Number.isFinite(y) || Math.abs(y) > ySpan * 4) {
          if (polyPts.length > 2) {
            const firstX = polyPts[0].split(',')[0];
            const lastX = polyPts[polyPts.length - 1].split(',')[0];
            parts.push(
              `<polygon points="${firstX},${targetY} ${polyPts.join(' ')} ${lastX},${targetY}" fill="${spec.color}" fill-opacity="0.16"/>`
            );
          }
          polyPts = [];
          continue;
        }
        polyPts.push(`${toSx(xs[i]).toFixed(1)},${toSy(y).toFixed(1)}`);
      }
      if (polyPts.length > 2) {
        const firstX = polyPts[0].split(',')[0];
        const lastX = polyPts[polyPts.length - 1].split(',')[0];
        parts.push(
          `<polygon points="${firstX},${targetY} ${polyPts.join(' ')} ${lastX},${targetY}" fill="${spec.color}" fill-opacity="0.16"/>`
        );
      }
    }

    // Plot curve segments cleanly — NEVER connect across discontinuities or vertical asymptotes!
    let pathD = '';
    let drawing = false;
    let prevY = Number.NaN;

    for (let i = 0; i <= samples; i++) {
      const x = xs[i];
      const y = ys[i];
      const outOfBounds = !Number.isFinite(y) || y < opts.yMin - ySpan * 2.5 || y > opts.yMax + ySpan * 2.5;
      const hugeJump = Number.isFinite(prevY) && Number.isFinite(y) && Math.abs(y - prevY) > ySpan * 0.9;

      if (hugeJump && opts.showAsymptotes) {
        const asymX = Math.round((x - dx / 2) * 20) / 20;
        if (!asymptotesX.some((ax) => Math.abs(ax - asymX) < dx * 3)) {
          asymptotesX.push(asymX);
        }
      }

      if (outOfBounds || hugeJump) {
        drawing = false;
        prevY = Number.NaN;
        continue;
      }

      const sx = toSx(x).toFixed(2);
      const sy = toSy(y).toFixed(2);
      if (!drawing) {
        pathD += `M ${sx} ${sy} `;
        drawing = true;
      } else {
        pathD += `L ${sx} ${sy} `;
      }
      prevY = y;
    }

    if (pathD) {
      parts.push(`<path d="${pathD.trim()}" fill="none" stroke="${spec.color}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`);
    }

    // Detect local extrema safely
    if (opts.showExtrema) {
      for (let i = 2; i < samples - 2; i++) {
        const y0 = ys[i - 1];
        const y1 = ys[i];
        const y2 = ys[i + 1];
        if (!Number.isFinite(y0) || !Number.isFinite(y1) || !Number.isFinite(y2)) continue;
        if (Math.abs(y1 - y0) > ySpan * 0.3 || Math.abs(y2 - y1) > ySpan * 0.3) continue;
        if (y1 >= opts.yMin && y1 <= opts.yMax) {
          const isMax = y1 > y0 && y1 > y2;
          const isMin = y1 < y0 && y1 < y2;
          if (isMax || isMin) {
            const ex = Math.round(xs[i] * 100) / 100;
            const ey = Math.round(y1 * 100) / 100;
            if (!extrema.some((e) => Math.abs(e.x - ex) < dx * 4 && Math.abs(e.y - ey) < ySpan * 0.05)) {
              extrema.push({ expr: spec.expression, x: ex, y: ey, kind: isMax ? 'max' : 'min' });
              parts.push(`<circle cx="${toSx(ex).toFixed(1)}" cy="${toSy(ey).toFixed(1)}" r="3.6" fill="#FFFFFF" stroke="${spec.color}" stroke-width="2"/>`);
            }
          }
        }
      }
    }
  }

  // Draw detected vertical asymptotes as dashed lines
  if (opts.showAsymptotes) {
    for (const ax of asymptotesX) {
      const sx = toSx(ax);
      parts.push(`<line x1="${sx.toFixed(1)}" y1="${pad}" x2="${sx.toFixed(1)}" y2="${H - pad}" stroke="#DC2626" stroke-width="1.2" stroke-dasharray="5 4"/>`);
    }
  }

  // Detect intersections between pairs of plotted functions
  if (opts.showIntersections && compiledList.length >= 2) {
    for (let a = 0; a < compiledList.length; a++) {
      for (let b = a + 1; b < compiledList.length; b++) {
        const ya = compiledList[a].ys;
        const yb = compiledList[b].ys;
        for (let i = 1; i <= samples; i++) {
          const d0 = ya[i - 1] - yb[i - 1];
          const d1 = ya[i] - yb[i];
          if (!Number.isFinite(d0) || !Number.isFinite(d1)) continue;
          if (Math.abs(d1 - d0) > ySpan * 0.5) continue;
          if ((d0 <= 0 && d1 >= 0) || (d0 >= 0 && d1 <= 0)) {
            const t = Math.abs(d1 - d0) > 1e-9 ? -d0 / (d1 - d0) : 0.5;
            const ix = opts.xMin + (i - 1 + t) * dx;
            const iy = ya[i - 1] + t * (ya[i] - ya[i - 1]);
            if (iy >= opts.yMin && iy <= opts.yMax) {
              const rx = Math.round(ix * 100) / 100;
              const ry = Math.round(iy * 100) / 100;
              if (!intersections.some((p) => Math.abs(p.x - rx) < dx * 3)) {
                intersections.push({ x: rx, y: ry });
                parts.push(`<circle cx="${toSx(rx).toFixed(1)}" cy="${toSy(ry).toFixed(1)}" r="4" fill="#DC2626" stroke="#FFFFFF" stroke-width="1.5"/>`);
              }
            }
          }
        }
      }
    }
  }

  parts.push('</g>');
  parts.push(`<rect x="${pad}" y="${pad}" width="${plotW}" height="${plotH}" fill="none" stroke="#CBD5E1" stroke-width="1"/>`);
  parts.push('</svg>');

  return {
    svgMarkup: parts.join(''),
    extrema,
    intersections,
    asymptotesX,
  };
}
