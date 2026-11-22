import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, RotateCcw, X, XCircle } from 'lucide-react';
import { compileLatexToSvg } from '../../engines/mathematics/formulaEngine';
import { safeSanitizeSvgMarkup } from '../../utils/svgSanitizer';
import type {
  MatchingConfig,
  MatchingItem,
  MatchingPair,
  TeacherQuestionKey,
} from '../../types/interactive';

interface MatchingWidgetProps {
  questionId: string;
  config: MatchingConfig;
  pairs: MatchingPair[];
  mode: 'author' | 'solve' | 'grade';
  examMode: 'exam' | 'practice';
  teacherKey?: TeacherQuestionKey;
  onChangePairs?: (next: MatchingPair[]) => void;
}

const LINE_COLORS = ['#087F70', '#1D4ED8', '#B45309', '#7E22CE', '#BE123C', '#15803D'];

const MathOrTextLabel: React.FC<{ item: MatchingItem }> = ({ item }) => {
  const svgHtml = useMemo(() => {
    if (!item.latex) return null;
    try {
      const compiled = compileLatexToSvg(item.latex, '#164E63');
      return safeSanitizeSvgMarkup(compiled.svgMarkup);
    } catch {
      return null;
    }
  }, [item.latex]);

  return (
    <div className="flex items-center gap-1.5 min-w-0">
      {item.imageDataUrl && (
        <img
          src={item.imageDataUrl}
          alt={item.label}
          className="w-7 h-7 rounded object-cover border border-slate-200 shrink-0"
        />
      )}
      {svgHtml ? (
        <span
          className="inline-flex items-center max-h-7 overflow-hidden [&>svg]:max-h-6 [&>svg]:w-auto"
          dangerouslySetInnerHTML={{ __html: svgHtml }}
        />
      ) : (
        <span className="leading-snug break-words">{item.label}</span>
      )}
    </div>
  );
};

interface PortPos {
  x: number;
  y: number;
}

export const MatchingWidget: React.FC<MatchingWidgetProps> = ({
  questionId,
  config,
  pairs,
  mode,
  examMode,
  teacherKey,
  onChangePairs,
}) => {
  const readOnly = mode !== 'solve';
  const showFeedback =
    mode === 'grade' ||
    (mode === 'solve' && examMode === 'practice' && config.practiceFeedback && Boolean(teacherKey));

  const correctSet = useMemo(() => {
    const s = new Set<string>();
    for (const p of teacherKey?.matchingCorrectPairs || []) {
      s.add(`${p.fromId}->${p.toId}`);
    }
    return s;
  }, [teacherKey]);

  const [selectedAId, setSelectedAId] = useState<string | null>(null);
  const [selectedBId, setSelectedBId] = useState<string | null>(null);

  // ---- LINE CONNECTING STATE ----
  const containerRef = useRef<HTMLDivElement>(null);
  const portARefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const portBRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [boxSize, setBoxSize] = useState<{ w: number; h: number }>({ w: 460, h: 180 });
  const [portsA, setPortsA] = useState<Record<string, PortPos>>({});
  const [portsB, setPortsB] = useState<Record<string, PortPos>>({});
  const [dragLine, setDragLine] = useState<{
    fromId: string;
    startX: number;
    startY: number;
    curX: number;
    curY: number;
  } | null>(null);

  // ---- DRAG-AND-DROP POINTER STATE ----
  const [draggingCard, setDraggingCard] = useState<{
    bId: string;
    label: string;
    clientX: number;
    clientY: number;
    hoverSlotAId: string | null;
  } | null>(null);

  const measurePorts = useCallback(() => {
    const root = containerRef.current;
    if (!root) return;
    const rect = root.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const nextA: Record<string, PortPos> = {};
    for (const item of config.itemsA) {
      const el = portARefs.current[item.id];
      if (!el) continue;
      const r = el.getBoundingClientRect();
      nextA[item.id] = {
        x: r.left - rect.left + r.width / 2,
        y: r.top - rect.top + r.height / 2,
      };
    }
    const nextB: Record<string, PortPos> = {};
    for (const item of config.itemsB) {
      const el = portBRefs.current[item.id];
      if (!el) continue;
      const r = el.getBoundingClientRect();
      nextB[item.id] = {
        x: r.left - rect.left + r.width / 2,
        y: r.top - rect.top + r.height / 2,
      };
    }
    setBoxSize({ w: rect.width, h: rect.height });
    setPortsA(nextA);
    setPortsB(nextB);
  }, [config.itemsA, config.itemsB]);

  useLayoutEffect(() => {
    measurePorts();
  }, [measurePorts, pairs, config.mode]);

  useEffect(() => {
    const root = containerRef.current;
    if (!root || typeof ResizeObserver === 'undefined') return;
    const obs = new ResizeObserver(() => measurePorts());
    obs.observe(root);
    return () => obs.disconnect();
  }, [measurePorts]);

  const connectPair = useCallback(
    (fromId: string, toId: string) => {
      if (readOnly || !onChangePairs) return;
      let next = [...pairs];
      // Remove exact duplicate if re-clicked
      const existingIdx = next.findIndex((p) => p.fromId === fromId && p.toId === toId);
      if (existingIdx >= 0) {
        next.splice(existingIdx, 1);
        onChangePairs(next);
        return;
      }
      // Enforce 1 connection per itemA (replace existing connection from this A)
      next = next.filter((p) => p.fromId !== fromId);
      // If 1-to-1, also detach any prior A linked to this B
      if (!config.allowManyToOne) {
        next = next.filter((p) => p.toId !== toId);
      }
      next.push({ fromId, toId });
      onChangePairs(next);
    },
    [readOnly, onChangePairs, pairs, config.allowManyToOne]
  );

  const removePair = useCallback(
    (fromId: string, toId: string) => {
      if (readOnly || !onChangePairs) return;
      onChangePairs(pairs.filter((p) => !(p.fromId === fromId && p.toId === toId)));
    },
    [readOnly, onChangePairs, pairs]
  );

  const resetAll = useCallback(() => {
    if (readOnly || !onChangePairs) return;
    setSelectedAId(null);
    setSelectedBId(null);
    onChangePairs([]);
  }, [readOnly, onChangePairs]);

  // Global pointer listeners for Line-Connecting Drag
  useEffect(() => {
    if (!dragLine) return;
    const handleMove = (e: PointerEvent) => {
      const root = containerRef.current;
      if (!root) return;
      const rect = root.getBoundingClientRect();
      setDragLine((prev) =>
        prev
          ? {
              ...prev,
              curX: e.clientX - rect.left,
              curY: e.clientY - rect.top,
            }
          : null
      );
    };
    const handleUp = (e: PointerEvent) => {
      const target = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
      const bNode = target?.closest?.(`[data-match-b-for="${questionId}"]`) as HTMLElement | null;
      const toId = bNode?.getAttribute('data-match-b-id');
      if (toId) {
        connectPair(dragLine.fromId, toId);
        setSelectedAId(null);
      }
      setDragLine(null);
    };
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleUp);
    };
  }, [dragLine, connectPair, questionId]);

  // Global pointer listeners for Drag-and-Drop Mode
  useEffect(() => {
    if (!draggingCard) return;
    const handleMove = (e: PointerEvent) => {
      const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
      const slot = el?.closest?.(`[data-drop-a-for="${questionId}"]`) as HTMLElement | null;
      const hoverSlotAId = slot?.getAttribute('data-drop-a-id') || null;
      setDraggingCard((prev) =>
        prev
          ? {
              ...prev,
              clientX: e.clientX,
              clientY: e.clientY,
              hoverSlotAId,
            }
          : null
      );
    };
    const handleUp = (e: PointerEvent) => {
      const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
      const slot = el?.closest?.(`[data-drop-a-for="${questionId}"]`) as HTMLElement | null;
      const slotAId = slot?.getAttribute('data-drop-a-id');
      if (slotAId) {
        connectPair(slotAId, draggingCard.bId);
        setSelectedBId(null);
      }
      setDraggingCard(null);
    };
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleUp);
    };
  }, [draggingCard, connectPair, questionId]);

  const itemBById = useMemo(() => {
    const m = new Map<string, MatchingItem>();
    for (const b of config.itemsB) m.set(b.id, b);
    return m;
  }, [config.itemsB]);

  const placedBIds = useMemo(() => new Set(pairs.map((p) => p.toId)), [pairs]);

  // =========================================================================
  // RENDER MODE 1: LINE-CONNECTING (DEFAULT)
  // =========================================================================
  if (config.mode === 'line') {
    return (
      <div className="space-y-2 select-none text-[16px] leading-normal">
        <div className="flex items-center justify-between gap-2 text-[16px] text-slate-600">
          <span>
            {readOnly
              ? `Chế độ vẽ đường nối · Đã nối ${pairs.length}/${config.itemsA.length} cặp`
              : 'Kéo từ chấm tròn cột A sang cột B (hoặc chạm A rồi chạm B). Nhấp vào dây để gỡ.'}
          </span>
          {!readOnly && pairs.length > 0 && (
            <button
              type="button"
              onClick={resetAll}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-medium cursor-pointer shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Làm lại</span>
            </button>
          )}
        </div>

        <div
          ref={containerRef}
          className="relative grid grid-cols-[1fr_68px_1fr] items-stretch gap-0 py-1"
        >
          {/* SVG Vector Overlay Layer */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible"
            viewBox={`0 0 ${Math.max(1, boxSize.w)} ${Math.max(1, boxSize.h)}`}
            preserveAspectRatio="none"
          >
            {pairs.map((pair, idx) => {
              const pA = portsA[pair.fromId];
              const pB = portsB[pair.toId];
              if (!pA || !pB) return null;
              const dx = Math.max(24, Math.abs(pB.x - pA.x) * 0.45);
              const d = `M ${pA.x} ${pA.y} C ${pA.x + dx} ${pA.y}, ${pB.x - dx} ${pB.y}, ${pB.x} ${pB.y}`;
              const isCorrect = showFeedback ? correctSet.has(`${pair.fromId}->${pair.toId}`) : null;
              const stroke =
                isCorrect === true
                  ? '#15803D'
                  : isCorrect === false
                    ? '#DC2626'
                    : LINE_COLORS[idx % LINE_COLORS.length];
              return (
                <g key={`${pair.fromId}-${pair.toId}`}>
                  {/* Wide transparent hit target for easy click-to-remove */}
                  {!readOnly && (
                    <path
                      d={d}
                      fill="none"
                      stroke="transparent"
                      strokeWidth={16}
                      className="pointer-events-auto cursor-pointer"
                      onClick={() => removePair(pair.fromId, pair.toId)}
                    >
                      <title>Nhấn để gỡ đường nối này</title>
                    </path>
                  )}
                  <path
                    d={d}
                    fill="none"
                    stroke={stroke}
                    strokeWidth={2.5}
                    strokeLinecap="round"
                  />
                  <circle cx={pA.x} cy={pA.y} r={4} fill={stroke} />
                  <circle cx={pB.x} cy={pB.y} r={4} fill={stroke} />
                </g>
              );
            })}

            {dragLine && (
              <path
                d={`M ${dragLine.startX} ${dragLine.startY} C ${dragLine.startX + 35} ${dragLine.startY}, ${dragLine.curX - 35} ${dragLine.curY}, ${dragLine.curX} ${dragLine.curY}`}
                fill="none"
                stroke="#087F70"
                strokeWidth={2.5}
                strokeDasharray="6 4"
                strokeLinecap="round"
              />
            )}
          </svg>

          {/* Column A */}
          <div className="space-y-1.5 z-20">
            <div className="text-[16px] font-bold text-[#164E63] px-1">
              {config.columnATitle || 'Cột A'}
            </div>
            {config.itemsA.map((item, idx) => {
              const linked = pairs.find((p) => p.fromId === item.id);
              const isSelected = selectedAId === item.id;
              const pairStatus =
                linked && showFeedback
                  ? correctSet.has(`${linked.fromId}->${linked.toId}`)
                    ? 'correct'
                    : 'wrong'
                  : null;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    if (readOnly) return;
                    setSelectedAId(isSelected ? null : item.id);
                  }}
                  className={`relative flex items-center justify-between gap-1.5 rounded-lg border px-2 py-1.5 text-[16px] transition-colors ${
                    readOnly ? 'cursor-default' : 'cursor-pointer'
                  } ${
                    pairStatus === 'correct'
                      ? 'bg-emerald-50 border-emerald-400 text-emerald-950'
                      : pairStatus === 'wrong'
                        ? 'bg-red-50 border-red-400 text-red-950'
                        : isSelected
                          ? 'bg-teal-50 border-[#087F70] ring-2 ring-[#087F70]/30'
                          : linked
                            ? 'bg-[#EEF6F5] border-[#087F70]/60'
                            : 'bg-white border-slate-300 hover:border-[#087F70]'
                  }`}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-bold text-[#087F70] shrink-0">{idx + 1}.</span>
                    <MathOrTextLabel item={item} />
                  </div>
                  <button
                    ref={(el) => {
                      portARefs.current[item.id] = el;
                    }}
                    type="button"
                    disabled={readOnly}
                    aria-label={`Điểm nối ${item.label}`}
                    onPointerDown={(e) => {
                      if (readOnly) return;
                      e.stopPropagation();
                      const pos = portsA[item.id];
                      if (!pos) return;
                      setSelectedAId(item.id);
                      setDragLine({
                        fromId: item.id,
                        startX: pos.x,
                        startY: pos.y,
                        curX: pos.x,
                        curY: pos.y,
                      });
                    }}
                    className={`w-4 h-4 rounded-full border-2 shrink-0 touch-none transition-transform ${
                      linked
                        ? 'bg-[#087F70] border-[#087F70]'
                        : isSelected
                          ? 'bg-amber-400 border-[#087F70] scale-110'
                          : 'bg-white border-[#164E63] hover:scale-110'
                    }`}
                  />
                </div>
              );
            })}
          </div>

          {/* Center SVG Channel Spacer */}
          <div aria-hidden="true" />

          {/* Column B */}
          <div className="space-y-1.5 z-20">
            <div className="text-[16px] font-bold text-[#164E63] px-1">
              {config.columnBTitle || 'Cột B'}
            </div>
            {config.itemsB.map((item, idx) => {
              const linked = pairs.some((p) => p.toId === item.id);
              const letter = String.fromCharCode(65 + idx);
              return (
                <div
                  key={item.id}
                  data-match-b-for={questionId}
                  data-match-b-id={item.id}
                  onClick={() => {
                    if (readOnly) return;
                    if (selectedAId) {
                      connectPair(selectedAId, item.id);
                      setSelectedAId(null);
                    }
                  }}
                  className={`relative flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-[16px] transition-colors ${
                    readOnly ? 'cursor-default' : 'cursor-pointer'
                  } ${
                    selectedAId
                      ? 'bg-white border-[#087F70]/70 hover:bg-teal-50'
                      : linked
                        ? 'bg-slate-50 border-slate-400'
                        : 'bg-white border-slate-300 hover:border-[#087F70]'
                  }`}
                >
                  <button
                    ref={(el) => {
                      portBRefs.current[item.id] = el;
                    }}
                    type="button"
                    disabled={readOnly}
                    aria-label={`Đích nối ${item.label}`}
                    className={`w-4 h-4 rounded-full border-2 shrink-0 ${
                      linked ? 'bg-[#1D4ED8] border-[#1D4ED8]' : 'bg-white border-[#1D4ED8]'
                    }`}
                  />
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-bold text-[#164E63] shrink-0">{letter}.</span>
                    <MathOrTextLabel item={item} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // RENDER MODE 2: DRAG-AND-DROP (POINTER EVENTS + TAP ACCESSIBILITY FALLBACK)
  // =========================================================================
  return (
    <div className="space-y-2 select-none">
      <div className="flex items-center justify-between gap-2 text-[16px] text-slate-600">
        <span>
          {readOnly
            ? `Chế độ kéo thả ghép đôi · Đã ghép ${pairs.length}/${config.itemsA.length}`
            : 'Kéo thả thẻ từ kho bên phải vào ô đích (hoặc chạm chọn thẻ rồi chạm vào ô đích).'}
        </span>
        {!readOnly && pairs.length > 0 && (
          <button
            type="button"
            onClick={resetAll}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-medium cursor-pointer shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Làm lại</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-[1.35fr_1fr] gap-2.5 items-start">
        {/* Drop Slots for Column A */}
        <div className="space-y-1.5">
          <div className="text-[16px] font-bold text-[#164E63]">
            {config.columnATitle || 'Các mục cần ghép'}
          </div>
          {config.itemsA.map((itemA, idx) => {
            const pair = pairs.find((p) => p.fromId === itemA.id);
            const placedItem = pair ? itemBById.get(pair.toId) : null;
            const isHover = draggingCard?.hoverSlotAId === itemA.id;
            const status =
              pair && showFeedback
                ? correctSet.has(`${pair.fromId}->${pair.toId}`)
                  ? 'correct'
                  : 'wrong'
                : null;
            return (
              <div
                key={itemA.id}
                data-drop-a-for={questionId}
                data-drop-a-id={itemA.id}
                onClick={() => {
                  if (readOnly) return;
                  if (selectedBId) {
                    connectPair(itemA.id, selectedBId);
                    setSelectedBId(null);
                  }
                }}
                className={`rounded-lg border p-1.5 transition-colors ${
                  isHover
                    ? 'border-[#087F70] bg-teal-50 ring-2 ring-[#087F70]/40'
                    : status === 'correct'
                      ? 'border-emerald-400 bg-emerald-50/70'
                      : status === 'wrong'
                        ? 'border-red-400 bg-red-50/70'
                        : selectedBId && !readOnly
                          ? 'border-dashed border-[#087F70] bg-teal-50/30 cursor-pointer'
                          : 'border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between gap-2 text-[16px]">
                  <div className="flex items-center gap-1 min-w-0 font-medium text-slate-800">
                    <span className="font-bold text-[#164E63] shrink-0">{idx + 1}.</span>
                    <MathOrTextLabel item={itemA} />
                  </div>
                  {status === 'correct' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                  {status === 'wrong' && <XCircle className="w-4 h-4 text-red-600 shrink-0" />}
                </div>
                <div className="mt-1">
                  {placedItem ? (
                    <div className="flex items-center justify-between gap-1.5 rounded-md bg-[#E6F1EF] border border-[#087F70] px-2 py-1 text-[16px] font-semibold text-[#164E63]">
                      <MathOrTextLabel item={placedItem} />
                      {!readOnly && pair && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removePair(pair.fromId, pair.toId);
                          }}
                          className="p-0.5 rounded hover:bg-white text-slate-600 hover:text-red-600 cursor-pointer shrink-0"
                          title="Trả thẻ về kho"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-2 py-1 text-[16px] text-slate-500">
                      {selectedBId && !readOnly ? 'Nhấn vào đây để thả thẻ đã chọn' : 'Ô thả thẻ đáp án'}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Draggable Card Bank (Column B) */}
        <div className="space-y-1.5">
          <div className="text-[16px] font-bold text-[#164E63]">
            {config.columnBTitle || 'Kho thẻ ghép'}
          </div>
          <div className="space-y-1.5 rounded-lg bg-slate-50/90 border border-slate-200 p-1.5">
            {config.itemsB.map((itemB) => {
              const isUsed = !config.allowManyToOne && placedBIds.has(itemB.id);
              const isSelected = selectedBId === itemB.id;
              return (
                <button
                  key={itemB.id}
                  type="button"
                  disabled={readOnly || isUsed}
                  onPointerDown={(e) => {
                    if (readOnly || isUsed) return;
                    if (e.button !== 0 && e.pointerType === 'mouse') return;
                    setDraggingCard({
                      bId: itemB.id,
                      label: itemB.label,
                      clientX: e.clientX,
                      clientY: e.clientY,
                      hoverSlotAId: null,
                    });
                  }}
                  onClick={() => {
                    if (readOnly || isUsed) return;
                    setSelectedBId(isSelected ? null : itemB.id);
                  }}
                  className={`w-full text-left rounded-md border px-2 py-1.5 text-[16px] font-medium touch-none transition-all ${
                    isUsed
                      ? 'bg-slate-100 border-slate-200 text-slate-400 line-through cursor-not-allowed'
                      : isSelected
                        ? 'bg-[#087F70] border-[#087F70] text-white shadow-sm cursor-pointer'
                        : 'bg-white border-slate-300 text-slate-800 hover:border-[#087F70] hover:bg-teal-50/50 cursor-grab active:cursor-grabbing'
                  }`}
                >
                  <MathOrTextLabel item={itemB} />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Floating Pointer-Event Drag Ghost */}
      {draggingCard && (
        <div
          className="fixed z-90 pointer-events-none px-3 py-1.5 rounded-lg bg-[#164E63] text-white text-[16px] font-semibold shadow-xl border border-teal-300"
          style={{
            left: draggingCard.clientX + 10,
            top: draggingCard.clientY + 10,
          }}
        >
          {draggingCard.label}
        </div>
      )}
    </div>
  );
};
