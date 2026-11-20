import type { DiagramLabelOverride } from '../../types/studio';
import {
  renderSmartLabelsSvg,
  resolveSmartLabels,
  type SmartLabelAnchor,
  type SmartSegmentObstacle,
} from './labelLayout';

export interface DiagramRenderConfig {
  strokeColor?: string;
  strokeWidth?: number;
  strokeStyle?: 'solid' | 'dashed';
  labels?: DiagramLabelOverride[];
}

export interface ScientificDiagramItem {
  key: string;
  title: string;
  subject: 'math' | 'physics' | 'chemistry';
  group: string;
  defaultLabels: Array<{ id: string; text: string }>;
  render: (cfg?: DiagramRenderConfig) => string;
}

export interface GeomHelper {
  lines: Array<{
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    dashed?: boolean;
    color?: string;
    width?: number;
    arrow?: boolean;
  }>;
  circles: Array<{
    cx: number;
    cy: number;
    r: number;
    fill?: string;
    dashed?: boolean;
    color?: string;
    width?: number;
  }>;
  ellipses?: Array<{
    cx: number;
    cy: number;
    rx: number;
    ry: number;
    fill?: string;
    dashed?: boolean;
    color?: string;
  }>;
  polygons?: Array<{
    points: string;
    fill?: string;
    fillOpacity?: number;
    dashed?: boolean;
    color?: string;
  }>;
  paths?: Array<{
    d: string;
    fill?: string;
    fillOpacity?: number;
    dashed?: boolean;
    color?: string;
    width?: number;
  }>;
  rects?: Array<{
    x: number;
    y: number;
    w: number;
    h: number;
    rx?: number;
    fill?: string;
    color?: string;
  }>;
  points?: Array<{ x: number; y: number; r?: number; fill?: string }>;
  anchors: SmartLabelAnchor[];
  width?: number;
  height?: number;
}

export function buildGeomSvg(spec: GeomHelper, cfg: DiagramRenderConfig = {}): string {
  const W = spec.width ?? 220;
  const H = spec.height ?? 170;
  const stroke = cfg.strokeColor ?? '#164E63';
  const sw = cfg.strokeWidth ?? 1.8;
  const globalDash = cfg.strokeStyle === 'dashed' ? ' stroke-dasharray="6 4"' : '';

  const segs: SmartSegmentObstacle[] = spec.lines.map((l) => ({
    x1: l.x1,
    y1: l.y1,
    x2: l.x2,
    y2: l.y2,
  }));

  const parts: string[] = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`,
    `<rect x="0" y="0" width="${W}" height="${H}" fill="#FFFFFF"/>`,
  ];

  for (const p of spec.polygons ?? []) {
    const dash = p.dashed ? ' stroke-dasharray="5 4"' : globalDash;
    parts.push(
      `<polygon points="${p.points}" fill="${p.fill ?? 'none'}" fill-opacity="${p.fillOpacity ?? 1}" stroke="${p.color ?? stroke}" stroke-width="${sw}" stroke-linejoin="round"${dash}/>`
    );
  }
  for (const r of spec.rects ?? []) {
    parts.push(
      `<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" rx="${r.rx ?? 0}" fill="${r.fill ?? 'none'}" stroke="${r.color ?? stroke}" stroke-width="${sw}"${globalDash}/>`
    );
  }
  for (const c of spec.circles) {
    const dash = c.dashed ? ' stroke-dasharray="5 4"' : globalDash;
    parts.push(
      `<circle cx="${c.cx}" cy="${c.cy}" r="${c.r}" fill="${c.fill ?? 'none'}" stroke="${c.color ?? stroke}" stroke-width="${c.width ?? sw}"${dash}/>`
    );
  }
  for (const e of spec.ellipses ?? []) {
    const dash = e.dashed ? ' stroke-dasharray="5 4"' : globalDash;
    parts.push(
      `<ellipse cx="${e.cx}" cy="${e.cy}" rx="${e.rx}" ry="${e.ry}" fill="${e.fill ?? 'none'}" stroke="${e.color ?? stroke}" stroke-width="${sw}"${dash}/>`
    );
  }
  for (const p of spec.paths ?? []) {
    const dash = p.dashed ? ' stroke-dasharray="5 4"' : globalDash;
    parts.push(
      `<path d="${p.d}" fill="${p.fill ?? 'none'}" fill-opacity="${p.fillOpacity ?? 1}" stroke="${p.color ?? stroke}" stroke-width="${p.width ?? sw}" stroke-linecap="round" stroke-linejoin="round"${dash}/>`
    );
  }
  for (const l of spec.lines) {
    const col = l.color ?? stroke;
    const w = l.width ?? sw;
    const dash = l.dashed ? ' stroke-dasharray="5 4"' : globalDash;
    parts.push(
      `<line x1="${l.x1}" y1="${l.y1}" x2="${l.x2}" y2="${l.y2}" stroke="${col}" stroke-width="${w}" stroke-linecap="round"${dash}/>`
    );
    if (l.arrow) {
      const ang = Math.atan2(l.y2 - l.y1, l.x2 - l.x1);
      const sz = 7.5;
      const ax1 = l.x2 - sz * Math.cos(ang - 0.42);
      const ay1 = l.y2 - sz * Math.sin(ang - 0.42);
      const ax2 = l.x2 - sz * Math.cos(ang + 0.42);
      const ay2 = l.y2 - sz * Math.sin(ang + 0.42);
      parts.push(
        `<polygon points="${l.x2.toFixed(1)},${l.y2.toFixed(1)} ${ax1.toFixed(1)},${ay1.toFixed(1)} ${ax2.toFixed(1)},${ay2.toFixed(1)}" fill="${col}"/>`
      );
    }
  }
  for (const pt of spec.points ?? []) {
    parts.push(`<circle cx="${pt.x}" cy="${pt.y}" r="${pt.r ?? 2.8}" fill="${pt.fill ?? stroke}"/>`);
  }

  const placed = resolveSmartLabels(spec.anchors, segs, { width: W, height: H, padding: 12 }, cfg.labels);
  parts.push(renderSmartLabelsSvg(placed));
  parts.push('</svg>');
  return parts.join('');
}

export function makeItem(
  key: string,
  title: string,
  subject: 'math' | 'physics' | 'chemistry',
  group: string,
  factory: (cfg?: DiagramRenderConfig) => GeomHelper
): ScientificDiagramItem {
  const sample = factory({});
  return {
    key,
    title,
    subject,
    group,
    defaultLabels: sample.anchors.map((a) => ({ id: a.id, text: a.text })),
    render: (cfg) => buildGeomSvg(factory(cfg), cfg),
  };
}

export function plotCurvePath(
  fn: (x: number) => number,
  xMin: number,
  xMax: number,
  yMin: number,
  yMax: number,
  ox = 110,
  oy = 88,
  sx = 20,
  sy = 18
): string {
  const steps = 84;
  let d = '';
  let drawing = false;
  let prevY = Number.NaN;
  for (let i = 0; i <= steps; i++) {
    const x = xMin + (i / steps) * (xMax - xMin);
    const y = fn(x);
    if (
      !Number.isFinite(y) ||
      y < yMin ||
      y > yMax ||
      (Number.isFinite(prevY) && Math.abs(y - prevY) > (yMax - yMin) * 0.65)
    ) {
      drawing = false;
      prevY = Number.NaN;
      continue;
    }
    const px = ox + x * sx;
    const py = oy - y * sy;
    d += `${drawing ? 'L' : 'M'}${px.toFixed(1)},${py.toFixed(1)} `;
    drawing = true;
    prevY = y;
  }
  return d.trim();
}

export function oxyAxes(ox = 110, oy = 88): GeomHelper['lines'] {
  return [
    { x1: 20, y1: oy, x2: 202, y2: oy, color: '#64748B', width: 1.2, arrow: true },
    { x1: ox, y1: 156, x2: ox, y2: 14, color: '#64748B', width: 1.2, arrow: true },
  ];
}

export function regularPolygonPoints(cx: number, cy: number, r: number, sides: number, startAngle = -Math.PI / 2) {
  const pts: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < sides; i++) {
    const a = startAngle + (i * 2 * Math.PI) / sides;
    pts.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
  }
  return pts;
}
