import type { DiagramLabelOverride } from '../../types/studio';

export interface SmartLabelAnchor {
  id: string;
  text: string;
  x: number;
  y: number;
  /** Optional center of figure so label naturally repels outward */
  centroidX?: number;
  centroidY?: number;
  fontSize?: number;
  color?: string;
  italic?: boolean;
}

export interface SmartSegmentObstacle {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface PlacedLabel {
  id: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  color: string;
  italic: boolean;
}

function pointToSegmentDist(px: number, py: number, s: SmartSegmentObstacle): number {
  const vx = s.x2 - s.x1;
  const vy = s.y2 - s.y1;
  const wx = px - s.x1;
  const wy = py - s.y1;
  const lenSq = vx * vx + vy * vy;
  if (lenSq < 1e-6) return Math.hypot(px - s.x1, py - s.y1);
  const t = Math.max(0, Math.min(1, (wx * vx + wy * vy) / lenSq));
  return Math.hypot(px - (s.x1 + t * vx), py - (s.y1 + t * vy));
}

/**
 * Shared smart label layout engine used uniformly across the 100+ diagram library,
 * dynamic 2D geometry, function graphs, and 3D solid projections.
 * - Avoids overlapping other labels
 * - Avoids colliding with geometric edges
 * - Clamps strictly inside frame bounds with padding
 * - Supports manual user drag overrides & reset
 */
export function resolveSmartLabels(
  anchors: SmartLabelAnchor[],
  segments: SmartSegmentObstacle[],
  bounds: { width: number; height: number; padding?: number },
  overrides: DiagramLabelOverride[] = []
): PlacedLabel[] {
  const pad = bounds.padding ?? 14;
  const placed: PlacedLabel[] = [];
  const overrideMap = new Map(overrides.map((o) => [o.id, o]));

  // Compute global centroid if individual anchor centroid not specified
  const avgX = anchors.length > 0 ? anchors.reduce((s, a) => s + a.x, 0) / anchors.length : bounds.width / 2;
  const avgY = anchors.length > 0 ? anchors.reduce((s, a) => s + a.y, 0) / anchors.length : bounds.height / 2;

  for (const anchor of anchors) {
    const ov = overrideMap.get(anchor.id);
    const text = ov?.text !== undefined ? ov.text : anchor.text;
    const fontSize = anchor.fontSize ?? 13;
    const estW = Math.max(12, text.length * fontSize * 0.62);
    const estH = fontSize * 1.15;

    const cx = anchor.centroidX ?? avgX;
    const cy = anchor.centroidY ?? avgY;

    // Preferred outward direction from figure centroid
    let dirX = anchor.x - cx;
    let dirY = anchor.y - cy;
    const norm = Math.hypot(dirX, dirY);
    if (norm < 1e-3) {
      dirX = 0.7;
      dirY = -0.7;
    } else {
      dirX /= norm;
      dirY /= norm;
    }

    const baseRadius = 15;
    // Candidate angles around the preferred outward vector
    const baseAngle = Math.atan2(dirY, dirX);
    const candidateOffsets = [0, 0.45, -0.45, 0.9, -0.9, 1.4, -1.4, Math.PI];

    let bestX = anchor.x + dirX * baseRadius;
    let bestY = anchor.y + dirY * baseRadius;
    let bestPenalty = Number.POSITIVE_INFINITY;

    for (const dAng of candidateOffsets) {
      const ang = baseAngle + dAng;
      const candX = anchor.x + Math.cos(ang) * baseRadius;
      const candY = anchor.y + Math.sin(ang) * baseRadius;
      let penalty = Math.abs(dAng) * 4;

      // Penalize proximity to edges/segments
      for (const seg of segments) {
        const d = pointToSegmentDist(candX, candY, seg);
        if (d < 12) penalty += (12 - d) * 8;
      }

      // Penalize overlap with already placed labels
      for (const p of placed) {
        const overlapX = (estW + p.width) / 2 + 4 - Math.abs(candX - p.x);
        const overlapY = (estH + p.height) / 2 + 3 - Math.abs(candY - p.y);
        if (overlapX > 0 && overlapY > 0) {
          penalty += overlapX * overlapY * 5;
        }
      }

      // Penalize out of frame
      if (candX - estW / 2 < pad || candX + estW / 2 > bounds.width - pad) penalty += 200;
      if (candY - estH / 2 < pad || candY + estH / 2 > bounds.height - pad) penalty += 200;

      if (penalty < bestPenalty) {
        bestPenalty = penalty;
        bestX = candX;
        bestY = candY;
      }
    }

    // Apply manual drag offset if teacher moved label
    const finalX = Math.max(pad + estW / 2, Math.min(bounds.width - pad - estW / 2, bestX + (ov?.dx ?? 0)));
    const finalY = Math.max(pad + estH / 2, Math.min(bounds.height - pad - estH / 2, bestY + (ov?.dy ?? 0)));

    placed.push({
      id: anchor.id,
      text,
      x: finalX,
      y: finalY,
      width: estW,
      height: estH,
      fontSize,
      color: anchor.color ?? '#1F2937',
      italic: anchor.italic ?? true,
    });
  }

  return placed;
}

export function renderSmartLabelsSvg(labels: PlacedLabel[]): string {
  return labels
    .map((lb) => {
      const safe = lb.text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const style = lb.italic ? ' font-style="italic"' : '';
      return `<text data-label-id="${lb.id}" x="${lb.x.toFixed(1)}" y="${(lb.y + lb.fontSize * 0.35).toFixed(1)}" text-anchor="middle" font-family="DejaVu Serif, Georgia, serif"${style} font-size="${lb.fontSize}" fill="${lb.color}" stroke="#FFFFFF" stroke-width="3.2" paint-order="stroke">${safe}</text>`;
    })
    .join('');
}
