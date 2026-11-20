import React, { useMemo, useRef, useState } from 'react';
import { Check, Download, RotateCcw, Save, Trash2, X } from 'lucide-react';
import {
  renderSmartLabelsSvg,
  resolveSmartLabels,
  type SmartLabelAnchor,
  type SmartSegmentObstacle,
} from '../../engines/geometry/labelLayout';
import { triggerDownload } from '../../engines/pdf/pdfEngine';
import { useStudioStore } from '../../stores/useStudioStore';

type GeomTool =
  | 'move'
  | 'point'
  | 'segment'
  | 'line'
  | 'ray'
  | 'circle'
  | 'midpoint'
  | 'perp'
  | 'parallel'
  | 'polygon';

interface GeomPoint {
  id: string;
  label: string;
  x: number;
  y: number;
  kind: 'free' | 'midpoint';
  parents?: [string, string];
  labelDx?: number;
  labelDy?: number;
}

interface GeomShape {
  id: string;
  kind: 'segment' | 'line' | 'ray' | 'circle' | 'perp' | 'parallel' | 'polygon';
  pts: string[]; // point IDs
  color: string;
  dashed?: boolean;
}

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const BOARD_W = 640;
const BOARD_H = 420;

interface DynamicGeometryModalProps {
  onClose: () => void;
}

export const DynamicGeometryModal: React.FC<DynamicGeometryModalProps> = ({ onClose }) => {
  const documents = useStudioStore((s) => s.documents);
  const activeDocId = useStudioStore((s) => s.activeDocId);
  const addObject = useStudioStore((s) => s.addObject);
  const addCustomShape = useStudioStore((s) => s.addCustomShape);
  const notify = useStudioStore((s) => s.notify);

  const [tool, setTool] = useState<GeomTool>('move');
  const [strokeColor, setStrokeColor] = useState('#164E63');
  const [dashed, setDashed] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [showMeasures, setShowMeasures] = useState(true);
  const [pendingIds, setPendingIds] = useState<string[]>([]);
  const [draggingPtId, setDraggingPtId] = useState<string | null>(null);
  const [title, setTitle] = useState('Hình học phẳng 2D');

  const [points, setPoints] = useState<GeomPoint[]>([
    { id: 'pA', label: 'A', x: 290, y: 80, kind: 'free' },
    { id: 'pB', label: 'B', x: 140, y: 320, kind: 'free' },
    { id: 'pC', label: 'C', x: 480, y: 320, kind: 'free' },
    { id: 'pM', label: 'M', x: 310, y: 320, kind: 'midpoint', parents: ['pB', 'pC'] },
  ]);

  const [shapes, setShapes] = useState<GeomShape[]>([
    { id: 's1', kind: 'segment', pts: ['pA', 'pB'], color: '#164E63' },
    { id: 's2', kind: 'segment', pts: ['pB', 'pC'], color: '#164E63' },
    { id: 's3', kind: 'segment', pts: ['pC', 'pA'], color: '#164E63' },
    { id: 's4', kind: 'segment', pts: ['pA', 'pM'], color: '#087F70', dashed: true },
  ]);

  const svgRef = useRef<SVGSVGElement>(null);

  // Resolve live positions of dependent points (midpoints update automatically when dragging base points)
  const resolvedMap = useMemo(() => {
    const map = new Map<string, { x: number; y: number; pt: GeomPoint }>();
    for (const p of points) {
      map.set(p.id, { x: p.x, y: p.y, pt: p });
    }
    for (let pass = 0; pass < 3; pass++) {
      for (const p of points) {
        if (p.kind === 'midpoint' && p.parents) {
          const a = map.get(p.parents[0]);
          const b = map.get(p.parents[1]);
          if (a && b) {
            map.set(p.id, { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, pt: p });
          }
        }
      }
    }
    return map;
  }, [points]);

  const nextLabel = () => {
    const used = new Set(points.map((p) => p.label));
    for (const ch of LETTERS) {
      if (!used.has(ch)) return ch;
    }
    return `P${points.length + 1}`;
  };

  const getBoardCoords = (e: React.PointerEvent) => {
    const rect = svgRef.current!.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * BOARD_W;
    const y = ((e.clientY - rect.top) / rect.height) * BOARD_H;
    return { x: Math.round(x), y: Math.round(y) };
  };

  const findPointNear = (x: number, y: number): GeomPoint | null => {
    for (const p of points) {
      const pos = resolvedMap.get(p.id);
      if (pos && Math.hypot(pos.x - x, pos.y - y) < 14) return p;
    }
    return null;
  };

  const handleBoardPointerDown = (e: React.PointerEvent) => {
    const { x, y } = getBoardCoords(e);
    const hit = findPointNear(x, y);

    if (tool === 'move') {
      if (hit && hit.kind === 'free') {
        setDraggingPtId(hit.id);
      }
      return;
    }

    if (tool === 'point') {
      const np: GeomPoint = { id: `p-${Date.now()}`, label: nextLabel(), x, y, kind: 'free' };
      setPoints((prev) => [...prev, np]);
      return;
    }

    // Ensure a point exists at click location
    let targetId = hit?.id;
    if (!targetId) {
      const np: GeomPoint = { id: `p-${Date.now()}`, label: nextLabel(), x, y, kind: 'free' };
      setPoints((prev) => [...prev, np]);
      targetId = np.id;
    }

    const nextPending = [...pendingIds, targetId];

    if (tool === 'midpoint' && nextPending.length === 2) {
      const mid: GeomPoint = {
        id: `p-${Date.now()}-m`,
        label: nextLabel(),
        x,
        y,
        kind: 'midpoint',
        parents: [nextPending[0], nextPending[1]],
      };
      setPoints((prev) => [...prev, mid]);
      setPendingIds([]);
      return;
    }

    if (
      (tool === 'segment' || tool === 'line' || tool === 'ray' || tool === 'circle') &&
      nextPending.length === 2
    ) {
      setShapes((prev) => [
        ...prev,
        { id: `sh-${Date.now()}`, kind: tool, pts: nextPending, color: strokeColor, dashed },
      ]);
      setPendingIds([]);
      return;
    }

    if ((tool === 'perp' || tool === 'parallel') && nextPending.length === 3) {
      // pts[0] = point line passes through, pts[1]-pts[2] = reference direction
      setShapes((prev) => [
        ...prev,
        { id: `sh-${Date.now()}`, kind: tool, pts: nextPending, color: strokeColor, dashed },
      ]);
      setPendingIds([]);
      return;
    }

    if (tool === 'polygon') {
      if (nextPending.length >= 3 && targetId === nextPending[0]) {
        setShapes((prev) => [
          ...prev,
          { id: `sh-${Date.now()}`, kind: 'polygon', pts: pendingIds, color: strokeColor, dashed },
        ]);
        setPendingIds([]);
        return;
      }
    }

    setPendingIds(nextPending);
  };

  const handleBoardPointerMove = (e: React.PointerEvent) => {
    if (!draggingPtId) return;
    const { x, y } = getBoardCoords(e);
    setPoints((prev) =>
      prev.map((p) =>
        p.id === draggingPtId
          ? { ...p, x: Math.max(20, Math.min(BOARD_W - 20, x)), y: Math.max(20, Math.min(BOARD_H - 20, y)) }
          : p
      )
    );
  };

  // Compute vector geometry & Smart Label Layout
  const { elementsSvg, placedLabels } = useMemo(() => {
    const obstacles: SmartSegmentObstacle[] = [];
    const parts: string[] = [];

    for (const sh of shapes) {
      const dashAttr = sh.dashed ? ' stroke-dasharray="6 4"' : '';
      const getP = (id: string) => resolvedMap.get(id);

      if (sh.kind === 'segment') {
        const a = getP(sh.pts[0]);
        const b = getP(sh.pts[1]);
        if (!a || !b) continue;
        obstacles.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y });
        parts.push(
          `<line x1="${a.x.toFixed(1)}" y1="${a.y.toFixed(1)}" x2="${b.x.toFixed(1)}" y2="${b.y.toFixed(1)}" stroke="${sh.color}" stroke-width="2"${dashAttr}/>`
        );
        if (showMeasures) {
          const distCm = (Math.hypot(b.x - a.x, b.y - a.y) / 40).toFixed(1);
          const mx = (a.x + b.x) / 2;
          const my = (a.y + b.y) / 2 - 6;
          parts.push(
            `<text x="${mx.toFixed(1)}" y="${my.toFixed(1)}" font-size="11" fill="#475569" text-anchor="middle" stroke="#FFFFFF" stroke-width="3" paint-order="stroke">${distCm} cm</text>`
          );
        }
      } else if (sh.kind === 'line' || sh.kind === 'ray') {
        const a = getP(sh.pts[0]);
        const b = getP(sh.pts[1]);
        if (!a || !b) continue;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const len = Math.hypot(dx, dy) || 1;
        const ux = dx / len;
        const uy = dy / len;
        const x1 = sh.kind === 'ray' ? a.x : a.x - ux * 900;
        const y1 = sh.kind === 'ray' ? a.y : a.y - uy * 900;
        const x2 = a.x + ux * 900;
        const y2 = a.y + uy * 900;
        obstacles.push({ x1, y1, x2, y2 });
        parts.push(
          `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${sh.color}" stroke-width="1.8"${dashAttr}/>`
        );
      } else if (sh.kind === 'circle') {
        const c = getP(sh.pts[0]);
        const edge = getP(sh.pts[1]);
        if (!c || !edge) continue;
        const r = Math.hypot(edge.x - c.x, edge.y - c.y);
        parts.push(
          `<circle cx="${c.x.toFixed(1)}" cy="${c.y.toFixed(1)}" r="${r.toFixed(1)}" fill="none" stroke="${sh.color}" stroke-width="1.8"${dashAttr}/>`
        );
      } else if (sh.kind === 'perp' || sh.kind === 'parallel') {
        const p0 = getP(sh.pts[0]);
        const p1 = getP(sh.pts[1]);
        const p2 = getP(sh.pts[2]);
        if (!p0 || !p1 || !p2) continue;
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const len = Math.hypot(dx, dy) || 1;
        const ux = sh.kind === 'parallel' ? dx / len : -dy / len;
        const uy = sh.kind === 'parallel' ? dy / len : dx / len;
        const x1 = p0.x - ux * 900;
        const y1 = p0.y - uy * 900;
        const x2 = p0.x + ux * 900;
        const y2 = p0.y + uy * 900;
        obstacles.push({ x1, y1, x2, y2 });
        parts.push(
          `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${sh.color}" stroke-width="1.6"${dashAttr}/>`
        );
      } else if (sh.kind === 'polygon') {
        const coords = sh.pts.map((id) => getP(id)).filter(Boolean) as Array<{ x: number; y: number }>;
        if (coords.length < 3) continue;
        const ptsAttr = coords.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');
        parts.push(
          `<polygon points="${ptsAttr}" fill="#087F70" fill-opacity="0.1" stroke="${sh.color}" stroke-width="2"${dashAttr}/>`
        );
      }
    }

    // Points & Smart Labels
    const anchors: SmartLabelAnchor[] = [];
    for (const p of points) {
      const pos = resolvedMap.get(p.id);
      if (!pos) continue;
      parts.push(
        `<circle cx="${pos.x.toFixed(1)}" cy="${pos.y.toFixed(1)}" r="4.2" fill="${p.kind === 'midpoint' ? '#087F70' : '#164E63'}" stroke="#FFFFFF" stroke-width="1.4"/>`
      );
      anchors.push({
        id: p.id,
        text: p.label,
        x: pos.x,
        y: pos.y,
        fontSize: 14,
        color: '#164E63',
      });
    }

    const overrides = points
      .filter((p) => p.labelDx !== undefined || p.labelDy !== undefined)
      .map((p) => ({ id: p.id, text: p.label, dx: p.labelDx ?? 0, dy: p.labelDy ?? 0 }));

    const placed = resolveSmartLabels(
      anchors,
      obstacles,
      {
        width: BOARD_W,
        height: BOARD_H,
        padding: 14,
      },
      overrides
    );

    return { elementsSvg: parts.join(''), placedLabels: placed };
  }, [points, shapes, resolvedMap, showMeasures]);

  const buildStandaloneSvg = () => {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${BOARD_W} ${BOARD_H}" width="${BOARD_W}" height="${BOARD_H}"><rect width="${BOARD_W}" height="${BOARD_H}" fill="#FFFFFF"/>${elementsSvg}${renderSmartLabelsSvg(placedLabels)}</svg>`;
  };

  const handleInsertToPdf = () => {
    const doc = documents.find((d) => d.id === activeDocId);
    if (!doc) return;
    const page = doc.pages[doc.currentPageIndex];
    if (!page) return;
    addObject({
      id: `dyn2d-${Date.now()}`,
      type: 'diagram',
      pageId: page.id,
      x: 110,
      y: 160,
      width: 280,
      height: Math.round((280 * BOARD_H) / BOARD_W),
      rotation: 0,
      zIndex: 25,
      opacity: 1,
      title,
      subject: 'math',
      svgMarkup: buildStandaloneSvg(),
      strokeColor,
      strokeWidth: 2,
      strokeStyle: dashed ? 'dashed' : 'solid',
      labels: [],
      sourceKind: 'dynamic-2d',
    });
    notify('Đã chèn hình học 2D dạng vector SVG vào trang PDF', 'success');
    onClose();
  };

  const handleExportSvg = () => {
    const blob = new Blob([buildStandaloneSvg()], { type: 'image/svg+xml;charset=utf-8' });
    triggerDownload(blob, `${title.replace(/\s+/g, '_')}.svg`);
  };

  const handleSavePersonal = async () => {
    await addCustomShape({
      id: `cs-${Date.now()}`,
      title,
      subject: 'math',
      svgMarkup: buildStandaloneSvg(),
      createdAt: Date.now(),
    });
  };

  const TOOLS: Array<{ id: GeomTool; label: string; hint: string }> = [
    { id: 'move', label: 'Kéo điểm', hint: 'Kéo thả các đỉnh tự do — trung điểm và đoạn thẳng cập nhật tự động' },
    { id: 'point', label: 'Điểm', hint: 'Nhấn lên bảng để tạo điểm mới' },
    { id: 'segment', label: 'Đoạn thẳng', hint: 'Chọn 2 điểm để nối đoạn thẳng' },
    { id: 'line', label: 'Đường thẳng', hint: 'Chọn 2 điểm để dựng đường thẳng đi qua' },
    { id: 'ray', label: 'Tia', hint: 'Chọn điểm gốc rồi chọn điểm thứ hai' },
    { id: 'circle', label: 'Đường tròn', hint: 'Chọn tâm trước, sau đó chọn 1 điểm trên đường tròn' },
    { id: 'midpoint', label: 'Trung điểm', hint: 'Chọn 2 điểm để tạo trung điểm phụ thuộc động' },
    { id: 'perp', label: 'Vuông góc', hint: 'Chọn điểm đi qua, sau đó chọn 2 điểm của đường thẳng chuẩn' },
    { id: 'parallel', label: 'Song song', hint: 'Chọn điểm đi qua, sau đó chọn 2 điểm của đường thẳng chuẩn' },
    { id: 'polygon', label: 'Đa giác', hint: 'Chọn các đỉnh liên tiếp và nhấn lại đỉnh đầu tiên để khép kín' },
  ];

  const currentHint = TOOLS.find((t) => t.id === tool)?.hint || '';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Modal Header */}
        <div className="bg-[#164E63] text-white px-5 py-3.5 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-[19px] font-bold">Xưởng Hình học động 2D (Vector SVG)</h2>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-md bg-white/15 border border-white/25 px-2.5 py-1 text-[14px] text-white placeholder-white/70 outline-none"
            />
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/15 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Construction Toolbar */}
        <div className="px-4 py-2.5 bg-[#FAFCFB] border-b border-slate-200 flex items-center gap-1.5 flex-wrap">
          {TOOLS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setTool(t.id);
                setPendingIds([]);
              }}
              className={`px-3 py-1.5 rounded-lg text-[13.5px] font-semibold cursor-pointer transition-colors ${
                tool === t.id
                  ? 'bg-[#087F70] text-white'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-[#E6F1EF]'
              }`}
            >
              {t.label}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <label className="flex items-center gap-1 text-[13.5px] cursor-pointer">
              <input type="checkbox" checked={dashed} onChange={(e) => setDashed(e.target.checked)} className="accent-[#087F70]" />
              <span>Nét đứt</span>
            </label>
            <label className="flex items-center gap-1 text-[13.5px] cursor-pointer">
              <input type="checkbox" checked={showMeasures} onChange={(e) => setShowMeasures(e.target.checked)} className="accent-[#087F70]" />
              <span>Đo độ dài</span>
            </label>
            <label className="flex items-center gap-1 text-[13.5px] cursor-pointer">
              <input type="checkbox" checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)} className="accent-[#087F70]" />
              <span>Lưới</span>
            </label>
            <input
              type="color"
              value={strokeColor}
              onChange={(e) => setStrokeColor(e.target.value)}
              className="w-7 h-7 rounded border border-slate-300 cursor-pointer"
            />
          </div>
        </div>

        {/* Interactive Board */}
        <div className="flex-1 overflow-auto bg-[#F4F8F7] p-4 flex flex-col items-center justify-center gap-2">
          <div className="text-[13.5px] text-slate-600">{currentHint}</div>
          <svg
            ref={svgRef}
            viewBox={`0 0 ${BOARD_W} ${BOARD_H}`}
            onPointerDown={handleBoardPointerDown}
            onPointerMove={handleBoardPointerMove}
            onPointerUp={() => setDraggingPtId(null)}
            onPointerLeave={() => setDraggingPtId(null)}
            className="w-full max-w-[740px] bg-white rounded-xl border border-slate-300 shadow-sm cursor-crosshair select-none touch-none"
          >
            {showGrid && (
              <g stroke="#E2E8F0" strokeWidth="0.7">
                {Array.from({ length: 16 }, (_, i) => (
                  <line key={`vx-${i}`} x1={i * 40} y1={0} x2={i * 40} y2={BOARD_H} />
                ))}
                {Array.from({ length: 11 }, (_, i) => (
                  <line key={`hy-${i}`} x1={0} y1={i * 40} x2={BOARD_W} y2={i * 40} />
                ))}
              </g>
            )}
            <g dangerouslySetInnerHTML={{ __html: elementsSvg + renderSmartLabelsSvg(placedLabels) }} />
          </svg>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 bg-white border-t border-slate-200 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setPoints([]);
                setShapes([]);
                setPendingIds([]);
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-200 text-[#DC2626] hover:bg-red-50 text-[14px] font-medium cursor-pointer"
            >
              <Trash2 className="w-4 h-4" /> Xóa bảng
            </button>
            <button
              type="button"
              onClick={() =>
                setPoints((prev) => prev.map((p) => ({ ...p, labelDx: undefined, labelDy: undefined })))
              }
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-[14px] font-medium cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" /> Đặt lại nhãn
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportSvg}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-[14px] font-semibold cursor-pointer"
            >
              <Download className="w-4 h-4" /> Xuất SVG
            </button>
            <button
              type="button"
              onClick={handleSavePersonal}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#E6F1EF] hover:bg-teal-100 text-[#164E63] text-[14px] font-semibold cursor-pointer"
            >
              <Save className="w-4 h-4" /> Lưu cá nhân
            </button>
            <button
              type="button"
              onClick={handleInsertToPdf}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#087F70] hover:bg-[#06695d] text-white text-[14.5px] font-semibold cursor-pointer"
            >
              <Check className="w-4 h-4" /> Chèn vào PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
