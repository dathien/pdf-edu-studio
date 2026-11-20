import { mathjax } from 'mathjax-full/js/mathjax.js';
import { TeX } from 'mathjax-full/js/input/tex.js';
import { SVG } from 'mathjax-full/js/output/svg.js';
import { liteAdaptor } from 'mathjax-full/js/adaptors/liteAdaptor.js';
import { RegisterHTMLHandler } from 'mathjax-full/js/handlers/html.js';
import { AllPackages } from 'mathjax-full/js/input/tex/AllPackages.js';
import type { SubjectCategory } from '../../types/studio';

// Initialize offline client-side MathJax TeX -> Pure Vector SVG <path> engine (zero CDN, zero fonts needed!)
const adaptor = liteAdaptor();
RegisterHTMLHandler(adaptor);

const texInput = new TeX({
  packages: AllPackages,
});

// fontCache: 'none' outputs inline <path> glyphs directly — 100% self-contained vector SVG for PDF export!
const svgOutput = new SVG({
  fontCache: 'none',
});

const mjDocument = mathjax.document('', {
  InputJax: texInput,
  OutputJax: svgOutput,
});

export interface CompiledFormulaSvg {
  svgMarkup: string;
  widthPx: number;
  heightPx: number;
}

/**
 * Compile LaTeX formula into pure standalone vector SVG with glyph <path>s.
 * Crisp at infinite zoom, zero missing symbols (roots, overlines, vectors, matrices, chemistry).
 */
export function compileLatexToSvg(
  latex: string,
  color = '#1F2937',
  fontSizePx = 22
): CompiledFormulaSvg {
  const cleaned = (latex || '').trim() || 'x';
  try {
    const node = mjDocument.convert(cleaned, {
      display: true,
      em: fontSizePx,
      ex: fontSizePx * 0.48,
      containerWidth: 1200,
    });
    const innerHtml = adaptor.innerHTML(node);
    const svgMatch = innerHtml.match(/<svg[\s\S]*<\/svg>/i);
    if (!svgMatch) {
      throw new Error('Không thể tạo SVG công thức');
    }
    let svg = svgMatch[0];

    // Parse viewBox to compute crisp pixel dimensions scaled by fontSizePx
    const vbMatch = svg.match(/viewBox="([^"]+)"/);
    let widthPx = fontSizePx * 4;
    let heightPx = fontSizePx * 1.8;
    if (vbMatch) {
      const parts = vbMatch[1].trim().split(/\s+/).map(Number);
      if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
        // MathJax uses 1000 units per em
        const scale = fontSizePx / 1000;
        widthPx = Math.max(24, Math.ceil(parts[2] * scale) + 8);
        heightPx = Math.max(20, Math.ceil(parts[3] * scale) + 6);
      }
    }

    // Apply explicit color, width, height, and clean namespace for standalone PDF & DOM rendering
    svg = svg
      .replace(/width="[^"]*"/, `width="${widthPx}"`)
      .replace(/height="[^"]*"/, `height="${heightPx}"`)
      .replace(/style="[^"]*"/, '')
      .replace(/currentColor/g, color);

    if (!svg.includes('xmlns="http://www.w3.org/2000/svg"')) {
      svg = svg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    // Ensure root fill is applied to all vector paths
    svg = svg.replace('<svg ', `<svg fill="${color}" stroke="${color}" `);

    return { svgMarkup: svg, widthPx, heightPx };
  } catch {
    const escaped = cleaned.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const widthPx = Math.max(80, cleaned.length * (fontSizePx * 0.65));
    const heightPx = Math.ceil(fontSizePx * 1.6);
    const fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${widthPx}" height="${heightPx}" viewBox="0 0 ${widthPx} ${heightPx}"><text x="4" y="${fontSizePx}" font-family="DejaVu Serif, serif" font-size="${fontSizePx}" fill="${color}">${escaped}</text></svg>`;
    return { svgMarkup: fallbackSvg, widthPx, heightPx };
  }
}

/**
 * Compile Typst math syntax (e.g., frac(a, b), sqrt(x^2 + 1), sum_(i=1)^n, integral_0^pi, vec(a, b), mat(1, 2; 3, 4), arrow.r.l)
 * into clean LaTeX and then pure vector SVG so teachers can author in Typst mode offline!
 */
export function typstMathToLatex(typstInput: string): string {
  let s = typstInput.trim();
  // Strip outer $ if user typed $...$
  if (s.startsWith('$') && s.endsWith('$') && s.length >= 2) {
    s = s.slice(1, -1).trim();
  }

  // Convert Typst matrices: mat(a, b; c, d) -> \begin{pmatrix} a & b \\ c & d \end{pmatrix}
  s = s.replace(/mat\(([^()]+)\)/g, (_, inner: string) => {
    const rows = inner
      .split(';')
      .map((r) =>
        r
          .split(',')
          .map((c) => c.trim())
          .join(' & ')
      )
      .join(' \\\\ ');
    return `\\begin{pmatrix} ${rows} \\end{pmatrix}`;
  });

  // Convert Typst cases: cases(a, b) -> \begin{cases} a \\ b \end{cases}
  s = s.replace(/cases\(([^()]+)\)/g, (_, inner: string) => {
    const rows = inner
      .split(',')
      .map((r) => r.trim())
      .join(' \\\\ ');
    return `\\begin{cases} ${rows} \\end{cases}`;
  });

  // Convert Typst frac(num, den)
  for (let pass = 0; pass < 4; pass++) {
    s = s.replace(/frac\(([^,()]+),\s*([^()]+)\)/g, '\\frac{$1}{$2}');
    s = s.replace(/root\(([^,()]+),\s*([^()]+)\)/g, '\\sqrt[$1]{$2}');
    s = s.replace(/sqrt\(([^()]+)\)/g, '\\sqrt{$1}');
    s = s.replace(/vec\(([^()]+)\)/g, '\\vec{$1}');
    s = s.replace(/overline\(([^()]+)\)/g, '\\overline{$1}');
    s = s.replace(/hat\(([^()]+)\)/g, '\\hat{$1}');
    s = s.replace(/abs\(([^()]+)\)/g, '\\left|$1\\right|');
    s = s.replace(/dif\s+([a-zA-Z])/g, '\\,d$1');
  }

  // Convert Typst parenthesized sub/superscripts: _(i=1) -> _{i=1}, ^(n+1) -> ^{n+1}
  s = s.replace(/_\(([^()]+)\)/g, '_{$1}');
  s = s.replace(/\^\(([^()]+)\)/g, '^{$1}');

  // Convert Typst operators & symbols
  const replacements: Array<[RegExp, string]> = [
    [/\bintegral\b/g, '\\int'],
    [/\bsum\b/g, '\\sum'],
    [/\bproduct\b/g, '\\prod'],
    [/\blim\b/g, '\\lim'],
    [/\boo\b/g, '\\infty'],
    [/\binfinity\b/g, '\\infty'],
    [/\bplus\.minus\b/g, '\\pm'],
    [/\btimes\b/g, '\\times'],
    [/\bdot\b/g, '\\cdot'],
    [/\barrow\.r\.l\b/g, '\\rightleftharpoons'],
    [/\barrow\.r\b/g, '\\rightarrow'],
    [/\barrow\.l\b/g, '\\leftarrow'],
    [/\barrow\.t\b/g, '\\uparrow'],
    [/\barrow\.b\b/g, '\\downarrow'],
    [/\b=>\b|=>/g, '\\Rightarrow'],
    [/<=>/g, '\\Leftrightarrow'],
    [/->/g, '\\to'],
    [/!=/g, '\\neq'],
    [/<=/g, '\\le'],
    [/>=/g, '\\ge'],
    [/\balpha\b/g, '\\alpha'],
    [/\bbeta\b/g, '\\beta'],
    [/\bgamma\b/g, '\\gamma'],
    [/\bdelta\b/g, '\\delta'],
    [/\bDelta\b/g, '\\Delta'],
    [/\btheta\b/g, '\\theta'],
    [/\blambda\b/g, '\\lambda'],
    [/\bmu\b/g, '\\mu'],
    [/\bpi\b/g, '\\pi'],
    [/\bsigma\b/g, '\\sigma'],
    [/\bomega\b/g, '\\omega'],
    [/\bOmega\b/g, '\\Omega'],
    [/\bphi\b/g, '\\varphi'],
    [/\bforall\b/g, '\\forall'],
    [/\bexists\b/g, '\\exists'],
    [/\bin\b/g, '\\in'],
    [/\bsubset\b/g, '\\subset'],
    [/\bunion\b/g, '\\cup'],
    [/\bsect\b/g, '\\cap'],
    [/\bperp\b/g, '\\perp'],
    [/\bparallel\b/g, '\\parallel'],
    [/\bangle\b/g, '\\angle'],
    [/\bdegree\b/g, '^\\circ'],
    [/"([^"]+)"/g, '\\text{$1}'],
  ];

  for (const [re, rep] of replacements) {
    s = s.replace(re, rep);
  }

  // Handle simple a / b outside braces when surrounded by spaces
  s = s.replace(/([a-zA-Z0-9\\{}^_]+)\s+\/\s+([a-zA-Z0-9\\{}^_]+)/g, '\\frac{$1}{$2}');

  return s;
}

export function compileTypstToSvg(
  typstCode: string,
  color = '#1F2937',
  fontSizePx = 22
): { latex: string; svg: CompiledFormulaSvg } {
  const latex = typstMathToLatex(typstCode);
  return {
    latex,
    svg: compileLatexToSvg(latex, color, fontSizePx),
  };
}

export interface FormulaSymbolItem {
  label: string;
  latex: string;
  tooltip: string;
}

export interface FormulaTemplateItem {
  name: string;
  latex: string;
  typst?: string;
}

export const SUBJECT_SYMBOLS: Record<Exclude<SubjectCategory, 'general'>, FormulaSymbolItem[]> = {
  math: [
    { label: 'a/b', latex: '\\frac{#0}{#?}', tooltip: 'Phân số' },
    { label: '√x', latex: '\\sqrt{#0}', tooltip: 'Căn bậc hai' },
    { label: 'ⁿ√x', latex: '\\sqrt[#?]{#0}', tooltip: 'Căn bậc n' },
    { label: 'xⁿ', latex: '#0^{#?}', tooltip: 'Số mũ' },
    { label: 'xₙ', latex: '#0_{#?}', tooltip: 'Chỉ số dưới' },
    { label: '|x|', latex: '\\left|#0\\right|', tooltip: 'Giá trị tuyệt đối' },
    { label: 'lim', latex: '\\lim_{x \\to #0}', tooltip: 'Giới hạn' },
    { label: "f'(x)", latex: "f'(x) = \\frac{dy}{dx}", tooltip: 'Đạo hàm' },
    { label: '∫', latex: '\\int_{#?}^{#?} #0 \\, dx', tooltip: 'Tích phân' },
    { label: '∑', latex: '\\sum_{i=1}^{n} #0', tooltip: 'Tổng sigma' },
    { label: '∏', latex: '\\prod_{i=1}^{n} #0', tooltip: 'Tích' },
    { label: 'Mat', latex: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}', tooltip: 'Ma trận 2x2' },
    { label: 'Det', latex: '\\begin{vmatrix} a & b \\\\ c & d \\end{vmatrix}', tooltip: 'Định thức' },
    { label: 'Hệ PT', latex: '\\begin{cases} #0 \\\\ #? \\end{cases}', tooltip: 'Hệ phương trình' },
    { label: '→v', latex: '\\vec{#0}', tooltip: 'Vectơ' },
    { label: 'x̄', latex: '\\overline{#0}', tooltip: 'Dấu gạch trên' },
    { label: '∞', latex: '\\infty', tooltip: 'Vô cực' },
    { label: '±', latex: '\\pm', tooltip: 'Cộng trừ' },
    { label: '≤', latex: '\\le', tooltip: 'Nhỏ hơn hoặc bằng' },
    { label: '≥', latex: '\\ge', tooltip: 'Lớn hơn hoặc bằng' },
    { label: '≠', latex: '\\neq', tooltip: 'Khác' },
    { label: '∈', latex: '\\in', tooltip: 'Thuộc' },
    { label: '⊂', latex: '\\subset', tooltip: 'Tập con' },
    { label: '∪', latex: '\\cup', tooltip: 'Hợp' },
    { label: '∩', latex: '\\cap', tooltip: 'Giao' },
    { label: '∀', latex: '\\forall', tooltip: 'Với mọi' },
    { label: '∃', latex: '\\exists', tooltip: 'Tồn tại' },
    { label: '∠', latex: '\\widehat{ABC}', tooltip: 'Góc' },
    { label: '∥', latex: '\\parallel', tooltip: 'Song song' },
    { label: '⊥', latex: '\\perp', tooltip: 'Vuông góc' },
    { label: 'sin', latex: '\\sin(#0)', tooltip: 'Sin' },
    { label: 'cos', latex: '\\cos(#0)', tooltip: 'Cos' },
    { label: 'π', latex: '\\pi', tooltip: 'Pi' },
    { label: 'α', latex: '\\alpha', tooltip: 'Alpha' },
    { label: 'β', latex: '\\beta', tooltip: 'Beta' },
    { label: 'Δ', latex: '\\Delta', tooltip: 'Delta' },
  ],
  physics: [
    { label: 'F⃗', latex: '\\vec{F} = m\\vec{a}', tooltip: 'Định luật II Newton' },
    { label: 'v⃗', latex: '\\vec{v}', tooltip: 'Vectơ vận tốc' },
    { label: 'a⃗', latex: '\\vec{a}', tooltip: 'Vectơ gia tốc' },
    { label: 'p⃗', latex: '\\vec{p} = m\\vec{v}', tooltip: 'Động lượng' },
    { label: 'Ω', latex: '\\Omega', tooltip: 'Đơn vị Ohm' },
    { label: 'μ', latex: '\\mu', tooltip: 'Hệ số ma sát / micro' },
    { label: 'λ', latex: '\\lambda', tooltip: 'Bước sóng' },
    { label: 'ω', latex: '\\omega', tooltip: 'Tần số góc' },
    { label: 'φ', latex: '\\varphi', tooltip: 'Pha ban đầu' },
    { label: 'Φ', latex: '\\Phi', tooltip: 'Từ thông' },
    { label: 'ε', latex: '\\varepsilon', tooltip: 'Suất điện động / hằng số điện môi' },
    { label: 'ρ', latex: '\\rho', tooltip: 'Khối lượng riêng / điện trở suất' },
    { label: 'm/s²', latex: '\\text{ m/s}^2', tooltip: 'Đơn vị gia tốc' },
    { label: 'J', latex: '\\text{ J}', tooltip: 'Jun' },
    { label: 'W', latex: '\\text{ W}', tooltip: 'Oát' },
    { label: 'V', latex: '\\text{ V}', tooltip: 'Vôn' },
    { label: 'A', latex: '\\text{ A}', tooltip: 'Ampe' },
    { label: 'Hz', latex: '\\text{ Hz}', tooltip: 'Hertz' },
  ],
  chemistry: [
    { label: 'H₂O', latex: '\\text{H}_2\\text{O}', tooltip: 'Chỉ số phân tử' },
    { label: 'Ion⁺', latex: '\\text{Fe}^{3+}', tooltip: 'Điện tích ion dương' },
    { label: 'Ion⁻', latex: '\\text{SO}_4^{2-}', tooltip: 'Điện tích ion âm' },
    { label: 'Đồng vị', latex: '{}^{14}_{6}\\text{C}', tooltip: 'Ký hiệu đồng vị' },
    { label: '→', latex: '\\longrightarrow', tooltip: 'Mũi tên phản ứng' },
    { label: '⇌', latex: '\\rightleftharpoons', tooltip: 'Phản ứng thuận nghịch' },
    { label: 't°', latex: '\\xrightarrow{t^\\circ}', tooltip: 'Điều kiện nhiệt độ' },
    { label: 'xt,t°', latex: '\\xrightarrow{\\text{xt}, t^\\circ}', tooltip: 'Xúc tác, nhiệt độ' },
    { label: '↓', latex: '\\downarrow', tooltip: 'Kết tủa' },
    { label: '↑', latex: '\\uparrow', tooltip: 'Chất khí bay lên' },
    { label: 'ΔH', latex: '\\Delta_r H^\\circ_{298}', tooltip: 'Biến thiên enthalpy' },
    { label: 'pH', latex: '\\text{pH} = -\\lg[\\text{H}^+]', tooltip: 'Công thức pH' },
    { label: 'Cₘ', latex: 'C_M = \\frac{n}{V}', tooltip: 'Nồng độ mol' },
    { label: 'C%', latex: 'C\\% = \\frac{m_{ct}}{m_{dd}} \\cdot 100\\%', tooltip: 'Nồng độ phần trăm' },
  ],
  biology: [
    { label: 'P → F₁', latex: 'P : \\text{Aa} \\times \\text{Aa} \\longrightarrow F_1', tooltip: 'Sơ đồ lai' },
    { label: '♂', latex: '\\male', tooltip: 'Giới đực (hoặc dùng chữ Đực)' },
    { label: '♀', latex: '\\female', tooltip: 'Giới cái' },
    { label: 'A=T', latex: 'A = T,\\; G = X', tooltip: 'Nguyên tắc bổ sung DNA' },
    { label: 'N', latex: 'N = 2A + 2G', tooltip: 'Tổng số nucleotide' },
    { label: 'L_DNA', latex: 'L = \\frac{N}{2} \\cdot 3{,}4\\text{ \\AA}', tooltip: 'Chiều dài gen' },
    { label: 'H', latex: 'H = 2A + 3G', tooltip: 'Số liên kết hiđrô' },
    { label: 'ATP', latex: '\\text{ATP} \\longrightarrow \\text{ADP} + P_i + E', tooltip: 'Phân giải ATP' },
    { label: '2n', latex: '2n = 46', tooltip: 'Bộ NST lưỡng bội' },
  ],
  cs: [
    { label: 'AND', latex: 'A \\land B', tooltip: 'Phép hội AND' },
    { label: 'OR', latex: 'A \\lor B', tooltip: 'Phép tuyển OR' },
    { label: 'NOT', latex: '\\overline{A}', tooltip: 'Phủ định NOT' },
    { label: 'XOR', latex: 'A \\oplus B', tooltip: 'Phép XOR' },
    { label: '⇒', latex: 'P \\Rightarrow Q', tooltip: 'Kéo theo' },
    { label: '⇔', latex: 'P \\Leftrightarrow Q', tooltip: 'Tương đương' },
    { label: '(1010)₂', latex: '(1010)_2 = (10)_{10}', tooltip: 'Hệ nhị phân' },
    { label: 'log₂n', latex: '\\log_2 n', tooltip: 'Logarit cơ số 2' },
    { label: 'O(n log n)', latex: '\\mathcal{O}(n \\log n)', tooltip: 'Độ phức tạp thuật toán' },
    { label: 'Θ(n²)', latex: '\\Theta(n^2)', tooltip: 'Độ phức tạp Theta' },
    { label: 'mod', latex: 'a \\equiv b \\pmod{m}', tooltip: 'Đồng dư modulo' },
  ],
};

export const SUBJECT_TEMPLATES: Record<Exclude<SubjectCategory, 'general'>, FormulaTemplateItem[]> = {
  math: [
    {
      name: 'Nghiệm phương trình bậc hai',
      latex: 'x_{1,2} = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}',
      typst: 'x_(1,2) = frac(-b plus.minus sqrt(b^2 - 4 a c), 2a)',
    },
    {
      name: 'Tích phân xác định',
      latex: 'I = \\int_{0}^{\\pi} x \\sin x \\, dx = \\pi',
      typst: 'I = integral_0^pi x sin x dif x = pi',
    },
    {
      name: 'Hệ phương trình bậc nhất',
      latex: '\\begin{cases} 2x + 3y = 7 \\\\ x - y = 1 \\end{cases}',
      typst: 'cases(2x + 3y = 7, x - y = 1)',
    },
    {
      name: 'Phân số lồng nhau',
      latex: 'P = \\frac{1 + \\frac{1}{x}}{1 - \\frac{1}{x^2}} = \\frac{x}{x - 1}',
      typst: 'P = frac(1 + frac(1, x), 1 - frac(1, x^2))',
    },
    {
      name: 'Khoảng cách điểm đến mặt phẳng',
      latex: 'd(M, (P)) = \\frac{|Ax_0 + By_0 + Cz_0 + D|}{\\sqrt{A^2 + B^2 + C^2}}',
      typst: 'd(M, (P)) = frac(abs(A x_0 + B y_0 + C z_0 + D), sqrt(A^2 + B^2 + C^2))',
    },
    {
      name: 'Ma trận & định thức',
      latex: '\\det(A) = \\begin{vmatrix} a & b \\\\ c & d \\end{vmatrix} = ad - bc',
      typst: 'A = mat(a, b; c, d)',
    },
  ],
  physics: [
    {
      name: 'Dao động điều hòa',
      latex: 'x = A \\cos(\\omega t + \\varphi),\\quad T = \\frac{2\\pi}{\\omega}',
      typst: 'x = A cos(omega t + phi), T = frac(2 pi, omega)',
    },
    {
      name: 'Tổng trở mạch RLC',
      latex: 'Z = \\sqrt{R^2 + (Z_L - Z_C)^2},\\quad I = \\frac{U}{Z}',
      typst: 'Z = sqrt(R^2 + (Z_L - Z_C)^2)',
    },
    {
      name: 'Định luật Ohm toàn mạch',
      latex: 'I = \\frac{\\mathcal{E}}{R_N + r}',
      typst: 'I = frac(E, R_N + r)',
    },
    {
      name: 'Công thức thấu kính mỏng',
      latex: '\\frac{1}{f} = \\frac{1}{d} + \\frac{1}{d\'}',
      typst: 'frac(1, f) = frac(1, d) + frac(1, d\')',
    },
    {
      name: 'Động năng & thế năng',
      latex: 'W = W_d + W_t = \\frac{1}{2}mv^2 + mgh',
      typst: 'W = frac(1, 2) m v^2 + m g h',
    },
  ],
  chemistry: [
    {
      name: 'Phản ứng thuận nghịch tổng hợp NH₃',
      latex: '\\text{N}_2(g) + 3\\text{H}_2(g) \\xrightleftharpoons{t^\\circ, p, \\text{xt}} 2\\text{NH}_3(g)',
      typst: '"N"_2 + 3 "H"_2 arrow.r.l 2 "NH"_3',
    },
    {
      name: 'Phản ứng tạo kết tủa BaSO₄',
      latex: '\\text{Ba}^{2+} + \\text{SO}_4^{2-} \\longrightarrow \\text{BaSO}_4 \\downarrow',
      typst: '"Ba"^(2+) + "SO"_4^(2-) arrow.r "BaSO"_4 arrow.b',
    },
    {
      name: 'Phản ứng giải phóng khí H₂',
      latex: '\\text{Zn} + 2\\text{HCl} \\longrightarrow \\text{ZnCl}_2 + \\text{H}_2 \\uparrow',
      typst: '"Zn" + 2 "HCl" arrow.r "ZnCl"_2 + "H"_2 arrow.t',
    },
    {
      name: 'Hằng số cân bằng Kc',
      latex: 'K_C = \\frac{[\\text{C}]^c [\\text{D}]^d}{[\\text{A}]^a [\\text{B}]^b}',
      typst: 'K_C = frac([C]^c [D]^d, [A]^a [B]^b)',
    },
  ],
  biology: [
    {
      name: 'Phương trình quang hợp',
      latex: '6\\text{CO}_2 + 12\\text{H}_2\\text{O} \\xrightarrow{\\text{Ánh sáng, diệp lục}} \\text{C}_6\\text{H}_{12}\\text{O}_6 + 6\\text{O}_2 \\uparrow + 6\\text{H}_2\\text{O}',
      typst: '6 "CO"_2 + 12 "H"_2 "O" arrow.r "C"_6 "H"_12 "O"_6 + 6 "O"_2 arrow.t',
    },
    {
      name: 'Hô hấp tế bào',
      latex: '\\text{C}_6\\text{H}_{12}\\text{O}_6 + 6\\text{O}_2 \\longrightarrow 6\\text{CO}_2 + 6\\text{H}_2\\text{O} + Q\\,(\\text{ATP})',
      typst: '"C"_6 "H"_12 "O"_6 + 6 "O"_2 arrow.r 6 "CO"_2 + 6 "H"_2 "O" + "ATP"',
    },
    {
      name: 'Định luật Hardy–Weinberg',
      latex: 'p^2 \\text{AA} + 2pq \\text{Aa} + q^2 \\text{aa} = 1,\\quad p + q = 1',
      typst: 'p^2 "AA" + 2 p q "Aa" + q^2 "aa" = 1',
    },
  ],
  cs: [
    {
      name: 'Định luật De Morgan',
      latex: '\\overline{A \\land B} = \\overline{A} \\lor \\overline{B},\\quad \\overline{A \\lor B} = \\overline{A} \\land \\overline{B}',
      typst: 'overline(A and B) = overline(A) or overline(B)',
    },
    {
      name: 'Độ phức tạp sắp xếp trộn',
      latex: 'T(n) = 2T\\!\\left(\\frac{n}{2}\\right) + \\Theta(n) \\implies T(n) = \\Theta(n \\log_2 n)',
      typst: 'T(n) = 2 T(frac(n, 2)) + n',
    },
    {
      name: 'Chuyển đổi nhị phân sang thập phân',
      latex: '(1101)_2 = 1\\cdot 2^3 + 1\\cdot 2^2 + 0\\cdot 2^1 + 1\\cdot 2^0 = 13_{10}',
      typst: '(1101)_2 = 13_10',
    },
  ],
};
