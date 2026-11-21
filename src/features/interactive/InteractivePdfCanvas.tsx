import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckSquare,
  FileText,
  Hash,
  Loader2,
  MapPin,
  Minus,
  MousePointer2,
  PenTool,
  Trash2,
  Type,
  Undo2,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { openPdfDocument, type LoadedPdfHandle } from '../../engines/pdf/pdfEngine';
import { QuestionRegionWidget } from './QuestionRegionWidget';
import type {
  InteractiveQuestion,
  PlainAnnotationKind,
  PlainPdfAnnotation,
  QuestionGradingDetail,
  StudentAnswerMap,
  StudentQuestionAnswer,
  TeacherAnswerKeyMap,
} from '../../types/interactive';

interface PageDim {
  pageIndex: number;
  width: number;
  height: number;
}

type DirectPdfTool = 'select' | PlainAnnotationKind;

const DIRECT_INK_COLORS = [
  { hex: '#164E63', label: 'Xanh đậm' },
  { hex: '#087F70', label: 'Xanh ngọc' },
  { hex: '#DC2626', label: 'Đỏ' },
  { hex: '#0F172A', label: 'Đen' },
];

const DIRECT_TOOL_HINTS: Record<DirectPdfTool, string> = {
  select: 'Nhấn vào mục đã ghi để chỉnh sửa nội dung, kéo để di chuyển hoặc bấm dấu × để xóa.',
  check: 'Nhấn vào ô chọn hoặc đáp án trên trang PDF để đặt dấu đánh dấu.',
  text: 'Nhấn vào chỗ trống trên trang PDF để tạo khung nhập chữ / câu trả lời.',
  number: 'Nhấn vào vị trí cần điền số trên trang PDF để nhập giá trị số.',
  line: 'Nhấn giữ và kéo từ điểm bắt đầu đến điểm kết thúc để vẽ đường nối.',
  pen: 'Nhấn giữ và kéo chuột hoặc bút trực tiếp trên trang để viết tay.',
  callout: 'Nhấn vào vị trí trên hình minh họa để ghim và ghi chú thích.',
};

interface InteractivePdfCanvasProps {
  pdfBytes: Uint8Array | null;
  questions: InteractiveQuestion[];
  mode: 'author' | 'solve' | 'grade';
  examMode: 'exam' | 'practice';
  selectedQuestionId?: string | null;
  answers?: StudentAnswerMap;
  teacherKeys?: TeacherAnswerKeyMap;
  gradingDetails?: Record<string, QuestionGradingDetail>;
  placingTypeLabel?: string | null;
  sourcePdfPages?: number[];
  printedPageLabels?: string[];
  scrollToQuestionNonce?: number;
  plainAnnotations?: PlainPdfAnnotation[];
  enableDirectPdfTools?: boolean;
  onChangePlainAnnotations?: (next: PlainPdfAnnotation[]) => void;
  onCancelPlacing?: () => void;
  onSelectQuestion?: (id: string | null) => void;
  onPlaceAtPoint?: (pageIndex: number, pdfX: number, pdfY: number) => void;
  onUpdateRegion?: (qId: string, patch: Partial<InteractiveQuestion['region']>) => void;
  onDeleteQuestion?: (qId: string) => void;
  onChangeAnswer?: (qId: string, next: StudentQuestionAnswer) => void;
}

const SinglePdfPageCanvas: React.FC<{
  handle: LoadedPdfHandle;
  dim: PageDim;
  zoom: number;
  questions: InteractiveQuestion[];
  pageAnnotations: PlainPdfAnnotation[];
  mode: 'author' | 'solve' | 'grade';
  examMode: 'exam' | 'practice';
  selectedQuestionId?: string | null;
  answers?: StudentAnswerMap;
  teacherKeys?: TeacherAnswerKeyMap;
  gradingDetails?: Record<string, QuestionGradingDetail>;
  placingActive: boolean;
  directTool: DirectPdfTool;
  directColor: string;
  directMarkSymbol: 'check' | 'cross' | 'circle';
  selectedAnnotationId: string | null;
  sourcePdfPageNum?: number;
  printedPageLabel?: string;
  onSelectAnnotation?: (id: string | null) => void;
  onAddAnnotation?: (ann: PlainPdfAnnotation) => void;
  onUpdateAnnotation?: (id: string, patch: Partial<PlainPdfAnnotation>) => void;
  onDeleteAnnotation?: (id: string) => void;
  onSelectQuestion?: (id: string | null) => void;
  onPlaceAtPoint?: (pageIndex: number, pdfX: number, pdfY: number) => void;
  onUpdateRegion?: (qId: string, patch: Partial<InteractiveQuestion['region']>) => void;
  onDeleteQuestion?: (qId: string) => void;
  onChangeAnswer?: (qId: string, next: StudentQuestionAnswer) => void;
}> = ({
  handle,
  dim,
  zoom,
  questions,
  pageAnnotations,
  mode,
  examMode,
  selectedQuestionId,
  answers,
  teacherKeys,
  gradingDetails,
  placingActive,
  directTool,
  directColor,
  directMarkSymbol,
  selectedAnnotationId,
  sourcePdfPageNum,
  printedPageLabel,
  onSelectAnnotation,
  onAddAnnotation,
  onUpdateAnnotation,
  onDeleteAnnotation,
  onSelectQuestion,
  onPlaceAtPoint,
  onUpdateRegion,
  onDeleteQuestion,
  onChangeAnswer,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pageContainerRef = useRef<HTMLDivElement>(null);
  const [draftLine, setDraftLine] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const [draftPenPoints, setDraftPenPoints] = useState<Array<{ x: number; y: number }>>([]);
  const draggingAnnRef = useRef<{
    id: string;
    startClientX: number;
    startClientY: number;
    origX: number;
    origY: number;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    let renderTask: { cancel: () => void; promise: Promise<void> } | null = null;

    const run = async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const page = await handle.proxy.getPage(dim.pageIndex + 1);
      if (cancelled) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const viewport = page.getViewport({ scale: zoom * dpr });
      canvas.width = Math.round(viewport.width);
      canvas.height = Math.round(viewport.height);
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      renderTask = page.render({ canvasContext: ctx, viewport, canvas });
      await renderTask.promise;
    };

    run().catch(() => {
      // Cancelled during zoom change or unmount
    });

    return () => {
      cancelled = true;
      try {
        renderTask?.cancel();
      } catch {
        // ignore cancel errors
      }
    };
  }, [handle, dim.pageIndex, zoom]);

  const cssW = Math.round(dim.width * zoom);
  const cssH = Math.round(dim.height * zoom);
  const isDrawingDirect = mode === 'solve' && directTool !== 'select';

  const getNormalizedPoint = (clientX: number, clientY: number) => {
    const rect = pageContainerRef.current?.getBoundingClientRect();
    if (!rect || rect.width <= 0 || rect.height <= 0) return { x: 0, y: 0 };
    return {
      x: Math.max(0.01, Math.min(0.99, (clientX - rect.left) / rect.width)),
      y: Math.max(0.01, Math.min(0.99, (clientY - rect.top) / rect.height)),
    };
  };

  const handleOverlayPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (mode !== 'solve' || directTool === 'select' || !onAddAnnotation) return;
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.stopPropagation();
    const pt = getNormalizedPoint(e.clientX, e.clientY);

    if (directTool === 'line') {
      e.currentTarget.setPointerCapture(e.pointerId);
      setDraftLine({ x1: pt.x, y1: pt.y, x2: pt.x, y2: pt.y });
      return;
    }

    if (directTool === 'pen') {
      e.currentTarget.setPointerCapture(e.pointerId);
      setDraftPenPoints([pt]);
      return;
    }

    const id = `ann-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    if (directTool === 'check') {
      onAddAnnotation({
        id,
        pageIndex: dim.pageIndex,
        kind: 'check',
        color: directColor,
        x: pt.x,
        y: pt.y,
        markSymbol: directMarkSymbol,
        createdAt: Date.now(),
      });
      onSelectAnnotation?.(id);
      return;
    }

    if (directTool === 'text') {
      onAddAnnotation({
        id,
        pageIndex: dim.pageIndex,
        kind: 'text',
        color: directColor,
        x: Math.min(0.75, pt.x),
        y: Math.min(0.92, pt.y),
        width: 0.28,
        text: '',
        createdAt: Date.now(),
      });
      onSelectAnnotation?.(id);
      return;
    }

    if (directTool === 'number') {
      onAddAnnotation({
        id,
        pageIndex: dim.pageIndex,
        kind: 'number',
        color: directColor,
        x: Math.min(0.84, pt.x),
        y: Math.min(0.93, pt.y),
        width: 0.14,
        text: '',
        createdAt: Date.now(),
      });
      onSelectAnnotation?.(id);
      return;
    }

    if (directTool === 'callout') {
      onAddAnnotation({
        id,
        pageIndex: dim.pageIndex,
        kind: 'callout',
        color: directColor,
        x: pt.x,
        y: pt.y,
        text: '',
        createdAt: Date.now(),
      });
      onSelectAnnotation?.(id);
    }
  };

  const handleOverlayPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (draftLine) {
      const pt = getNormalizedPoint(e.clientX, e.clientY);
      setDraftLine((prev) => (prev ? { ...prev, x2: pt.x, y2: pt.y } : null));
      return;
    }
    if (draftPenPoints.length > 0) {
      const pt = getNormalizedPoint(e.clientX, e.clientY);
      setDraftPenPoints((prev) => {
        const last = prev[prev.length - 1];
        if (last && Math.hypot(pt.x - last.x, pt.y - last.y) < 0.004) return prev;
        return [...prev, pt];
      });
    }
  };

  const handleOverlayPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (draftLine && onAddAnnotation) {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
      const dist = Math.hypot(draftLine.x2 - draftLine.x1, draftLine.y2 - draftLine.y1);
      if (dist > 0.012) {
        const id = `ann-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        onAddAnnotation({
          id,
          pageIndex: dim.pageIndex,
          kind: 'line',
          color: directColor,
          x: draftLine.x1,
          y: draftLine.y1,
          x2: draftLine.x2,
          y2: draftLine.y2,
          strokeWidth: 2.8,
          createdAt: Date.now(),
        });
        onSelectAnnotation?.(id);
      }
      setDraftLine(null);
      return;
    }

    if (draftPenPoints.length > 0 && onAddAnnotation) {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
      if (draftPenPoints.length >= 2) {
        const id = `ann-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        onAddAnnotation({
          id,
          pageIndex: dim.pageIndex,
          kind: 'pen',
          color: directColor,
          x: draftPenPoints[0].x,
          y: draftPenPoints[0].y,
          strokeWidth: 2.6,
          points: draftPenPoints,
          createdAt: Date.now(),
        });
        onSelectAnnotation?.(id);
      }
      setDraftPenPoints([]);
    }
  };

  const startDragAnnotation = (e: React.PointerEvent, ann: PlainPdfAnnotation) => {
    if (mode !== 'solve') return;
    e.stopPropagation();
    onSelectAnnotation?.(ann.id);
    draggingAnnRef.current = {
      id: ann.id,
      startClientX: e.clientX,
      startClientY: e.clientY,
      origX: ann.x,
      origY: ann.y,
    };

    const onMove = (ev: PointerEvent) => {
      const drag = draggingAnnRef.current;
      const rect = pageContainerRef.current?.getBoundingClientRect();
      if (!drag || !rect || rect.width <= 0 || rect.height <= 0) return;
      const dx = (ev.clientX - drag.startClientX) / rect.width;
      const dy = (ev.clientY - drag.startClientY) / rect.height;
      onUpdateAnnotation?.(drag.id, {
        x: Math.max(0.01, Math.min(0.95, drag.origX + dx)),
        y: Math.max(0.01, Math.min(0.96, drag.origY + dy)),
      });
    };

    const onUp = () => {
      draggingAnnRef.current = null;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const vectorAnns = pageAnnotations.filter((a) => a.kind === 'line' || a.kind === 'pen');
  const boxAnns = pageAnnotations.filter((a) => a.kind !== 'line' && a.kind !== 'pen');

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-2 text-[15px] font-semibold text-slate-700">
        <span className="px-3 py-1 rounded-lg bg-white border border-slate-300 text-[#164E63]">
          Trang {sourcePdfPageNum ?? dim.pageIndex + 1}
        </span>
        {printedPageLabel && printedPageLabel !== String(sourcePdfPageNum ?? dim.pageIndex + 1) && (
          <span className="px-3 py-1 rounded-lg bg-[#E6F1EF] border border-teal-200 text-[#087F70]">
            Số trang in trên giấy: {printedPageLabel}
          </span>
        )}
      </div>
      <div
        ref={pageContainerRef}
        style={{ width: `${cssW}px`, height: `${cssH}px` }}
        onClick={(e) => {
          if (mode === 'author' && placingActive && onPlaceAtPoint) {
            const rect = e.currentTarget.getBoundingClientRect();
            const pdfX = Math.max(12, Math.round((e.clientX - rect.left) / zoom));
            const pdfY = Math.max(12, Math.round((e.clientY - rect.top) / zoom));
            onPlaceAtPoint(dim.pageIndex, pdfX, pdfY);
          } else if (mode === 'author' && onSelectQuestion) {
            onSelectQuestion(null);
          } else if (mode === 'solve' && directTool === 'select') {
            onSelectAnnotation?.(null);
          }
        }}
        className={`relative bg-white shadow-md border border-slate-300 rounded-sm overflow-hidden ${
          placingActive
            ? 'cursor-crosshair ring-2 ring-[#087F70]'
            : isDrawingDirect
              ? 'cursor-crosshair'
              : ''
        }`}
      >
        <canvas
          ref={canvasRef}
          style={{ width: `${cssW}px`, height: `${cssH}px` }}
          className="block pointer-events-none select-none"
        />

        {/* SVG Layer for Vector Connector Lines & Freehand Handwriting Strokes */}
        <svg
          width={cssW}
          height={cssH}
          viewBox={`0 0 ${cssW} ${cssH}`}
          className="absolute inset-0 pointer-events-none"
        >
          {vectorAnns.map((ann) => {
            const isSel = selectedAnnotationId === ann.id;
            if (ann.kind === 'line' && ann.x2 !== undefined && ann.y2 !== undefined) {
              const x1 = ann.x * cssW;
              const y1 = ann.y * cssH;
              const x2 = ann.x2 * cssW;
              const y2 = ann.y2 * cssH;
              return (
                <g key={ann.id}>
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={ann.color}
                    strokeWidth={Math.max(2, (ann.strokeWidth || 2.8) * zoom)}
                    strokeLinecap="round"
                  />
                  <circle cx={x1} cy={y1} r={4 * zoom} fill={ann.color} />
                  <circle cx={x2} cy={y2} r={4 * zoom} fill={ann.color} />
                  {mode === 'solve' && directTool === 'select' && (
                    <line
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke={isSel ? 'rgba(220,38,38,0.22)' : 'transparent'}
                      strokeWidth={14}
                      className="pointer-events-auto cursor-pointer"
                      onClick={(ev) => {
                        ev.stopPropagation();
                        onSelectAnnotation?.(ann.id);
                      }}
                    />
                  )}
                </g>
              );
            }
            if (ann.kind === 'pen' && ann.points && ann.points.length >= 2) {
              const d = ann.points
                .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${(p.x * cssW).toFixed(1)} ${(p.y * cssH).toFixed(1)}`)
                .join(' ');
              return (
                <g key={ann.id}>
                  <path
                    d={d}
                    fill="none"
                    stroke={ann.color}
                    strokeWidth={Math.max(1.8, (ann.strokeWidth || 2.6) * zoom)}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {mode === 'solve' && directTool === 'select' && (
                    <path
                      d={d}
                      fill="none"
                      stroke={isSel ? 'rgba(220,38,38,0.18)' : 'transparent'}
                      strokeWidth={14}
                      className="pointer-events-auto cursor-pointer"
                      onClick={(ev) => {
                        ev.stopPropagation();
                        onSelectAnnotation?.(ann.id);
                      }}
                    />
                  )}
                </g>
              );
            }
            return null;
          })}

          {/* Live Draft Line Preview */}
          {draftLine && (
            <g>
              <line
                x1={draftLine.x1 * cssW}
                y1={draftLine.y1 * cssH}
                x2={draftLine.x2 * cssW}
                y2={draftLine.y2 * cssH}
                stroke={directColor}
                strokeWidth={Math.max(2, 2.8 * zoom)}
                strokeDasharray="6 4"
                strokeLinecap="round"
              />
              <circle cx={draftLine.x1 * cssW} cy={draftLine.y1 * cssH} r={4 * zoom} fill={directColor} />
              <circle cx={draftLine.x2 * cssW} cy={draftLine.y2 * cssH} r={4 * zoom} fill={directColor} />
            </g>
          )}

          {/* Live Draft Pen Stroke Preview */}
          {draftPenPoints.length >= 2 && (
            <path
              d={draftPenPoints
                .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${(p.x * cssW).toFixed(1)} ${(p.y * cssH).toFixed(1)}`)
                .join(' ')}
              fill="none"
              stroke={directColor}
              strokeWidth={Math.max(1.8, 2.6 * zoom)}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </svg>

        {/* PDF-Coordinate-Locked Structured Question Regions */}
        <div className={`absolute inset-0 ${isDrawingDirect ? 'pointer-events-none' : ''}`}>
          {questions.map((q) => (
            <QuestionRegionWidget
              key={q.id}
              question={q}
              zoom={zoom}
              pageWidth={dim.width}
              pageHeight={dim.height}
              mode={mode}
              examMode={examMode}
              selected={selectedQuestionId === q.id}
              answer={answers?.[q.id]}
              teacherKey={teacherKeys?.[q.id]}
              gradingDetail={gradingDetails?.[q.id]}
              onSelect={() => onSelectQuestion?.(q.id)}
              onUpdateRegion={(patch) => onUpdateRegion?.(q.id, patch)}
              onDeleteQuestion={() => onDeleteQuestion?.(q.id)}
              onChangeAnswer={(next) => onChangeAnswer?.(q.id, next)}
            />
          ))}
        </div>

        {/* Direct Student Plain-PDF Annotations Layer (Check, Text, Number, Callout + Selected Line/Pen Delete Badge) */}
        <div className={`absolute inset-0 pointer-events-none ${isDrawingDirect ? '' : ''}`}>
          {mode === 'solve' &&
            directTool === 'select' &&
            vectorAnns.map((ann) => {
              if (selectedAnnotationId !== ann.id) return null;
              const cx =
                ann.kind === 'line' && ann.x2 !== undefined
                  ? ((ann.x + ann.x2) / 2) * cssW
                  : ann.x * cssW;
              const cy =
                ann.kind === 'line' && ann.y2 !== undefined
                  ? ((ann.y + ann.y2) / 2) * cssH
                  : ann.y * cssH;
              return (
                <button
                  key={`del-${ann.id}`}
                  type="button"
                  style={{ left: `${cx}px`, top: `${Math.max(14, cy - 18)}px` }}
                  onClick={(ev) => {
                    ev.stopPropagation();
                    onDeleteAnnotation?.(ann.id);
                  }}
                  className="pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-600 hover:bg-red-700 text-white text-[12px] font-bold shadow cursor-pointer"
                  title="Xóa nét đã chọn"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa</span>
                </button>
              );
            })}

          {boxAnns.map((ann) => {
            const left = ann.x * cssW;
            const top = ann.y * cssH;
            const isSel = selectedAnnotationId === ann.id;
            const editable = mode === 'solve';

            if (ann.kind === 'check') {
              const sym = ann.markSymbol || 'check';
              const glyph = sym === 'cross' ? '✗' : sym === 'circle' ? '○' : '✓';
              return (
                <div
                  key={ann.id}
                  style={{ left: `${left}px`, top: `${top}px`, color: ann.color }}
                  onPointerDown={(ev) => editable && directTool === 'select' && startDragAnnotation(ev, ann)}
                  onClick={(ev) => {
                    if (!editable) return;
                    ev.stopPropagation();
                    onSelectAnnotation?.(ann.id);
                  }}
                  className={`pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 select-none flex items-center justify-center rounded-full leading-none font-black ${
                    editable && directTool === 'select' ? 'cursor-move' : ''
                  } ${isSel ? 'ring-2 ring-[#087F70] bg-white/80' : ''}`}
                >
                  <span style={{ fontSize: `${Math.round(24 * zoom)}px` }}>{glyph}</span>
                  {editable && isSel && (
                    <button
                      type="button"
                      onClick={(ev) => {
                        ev.stopPropagation();
                        onDeleteAnnotation?.(ann.id);
                      }}
                      className="absolute -top-2.5 -right-2.5 w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center shadow cursor-pointer"
                      title="Xóa dấu chọn"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            }

            if (ann.kind === 'text' || ann.kind === 'number') {
              const boxW = Math.max(
                ann.kind === 'number' ? 76 : 150,
                Math.round((ann.width || (ann.kind === 'number' ? 0.14 : 0.28)) * cssW)
              );
              return (
                <div
                  key={ann.id}
                  style={{ left: `${left}px`, top: `${top}px`, width: `${boxW}px`, borderColor: ann.color }}
                  onClick={(ev) => {
                    if (!editable) return;
                    ev.stopPropagation();
                    onSelectAnnotation?.(ann.id);
                  }}
                  className={`pointer-events-auto absolute rounded-md border bg-white/92 shadow-xs transition-shadow ${
                    isSel ? 'ring-2 ring-[#087F70] z-20' : 'z-10'
                  }`}
                >
                  {editable && (
                    <div
                      onPointerDown={(ev) => startDragAnnotation(ev, ann)}
                      className="flex items-center justify-between px-1.5 py-0.5 bg-slate-50/90 border-b border-slate-200 rounded-t-md cursor-move"
                    >
                      <span className="text-[11px] font-bold text-slate-500">
                        {ann.kind === 'number' ? 'Số' : 'Trả lời'}
                      </span>
                      <button
                        type="button"
                        onClick={(ev) => {
                          ev.stopPropagation();
                          onDeleteAnnotation?.(ann.id);
                        }}
                        className="text-slate-400 hover:text-red-600 cursor-pointer"
                        title="Xóa ô này"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                  {editable ? (
                    ann.kind === 'number' ? (
                      <input
                        type="text"
                        inputMode="decimal"
                        autoFocus={isSel && !ann.text}
                        value={ann.text || ''}
                        onChange={(ev) => onUpdateAnnotation?.(ann.id, { text: ev.target.value })}
                        placeholder="Nhập số..."
                        style={{ color: ann.color, fontSize: `${Math.max(13, Math.round(13.5 * zoom))}px` }}
                        className="w-full px-2 py-1 bg-transparent font-bold outline-none"
                      />
                    ) : (
                      <textarea
                        rows={2}
                        autoFocus={isSel && !ann.text}
                        value={ann.text || ''}
                        onChange={(ev) => onUpdateAnnotation?.(ann.id, { text: ev.target.value })}
                        placeholder="Nhập câu trả lời..."
                        style={{ color: ann.color, fontSize: `${Math.max(13, Math.round(13 * zoom))}px` }}
                        className="w-full px-2 py-1 bg-transparent font-medium outline-none resize-y leading-snug"
                      />
                    )
                  ) : (
                    <div
                      style={{ color: ann.color, fontSize: `${Math.max(12, Math.round(12.5 * zoom))}px` }}
                      className="px-2 py-1 whitespace-pre-wrap break-words font-medium"
                    >
                      {ann.text || '—'}
                    </div>
                  )}
                </div>
              );
            }

            if (ann.kind === 'callout') {
              const flipLeft = ann.x > 0.7;
              return (
                <div
                  key={ann.id}
                  style={{ left: `${left}px`, top: `${top}px` }}
                  onClick={(ev) => {
                    if (!editable) return;
                    ev.stopPropagation();
                    onSelectAnnotation?.(ann.id);
                  }}
                  className={`pointer-events-auto absolute ${isSel ? 'z-20' : 'z-10'}`}
                >
                  <div
                    onPointerDown={(ev) => editable && startDragAnnotation(ev, ann)}
                    style={{ backgroundColor: ann.color }}
                    className="w-3.5 h-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow cursor-move"
                    title="Kéo để dời vị trí ghim chú thích"
                  />
                  <div
                    style={{ borderColor: ann.color }}
                    className={`absolute -top-3 ${
                      flipLeft ? 'right-3' : 'left-3'
                    } min-w-[140px] max-w-[220px] rounded-md border bg-amber-50/95 shadow-xs flex items-center gap-1 px-1.5 py-0.5 ${
                      isSel ? 'ring-2 ring-[#087F70]' : ''
                    }`}
                  >
                    {editable ? (
                      <input
                        type="text"
                        autoFocus={isSel && !ann.text}
                        value={ann.text || ''}
                        onChange={(ev) => onUpdateAnnotation?.(ann.id, { text: ev.target.value })}
                        placeholder="Chú thích hình..."
                        style={{ color: ann.color }}
                        className="w-full bg-transparent text-[13px] font-bold outline-none"
                      />
                    ) : (
                      <span style={{ color: ann.color }} className="text-[13px] font-bold">
                        {ann.text || 'Chú thích'}
                      </span>
                    )}
                    {editable && (
                      <button
                        type="button"
                        onClick={(ev) => {
                          ev.stopPropagation();
                          onDeleteAnnotation?.(ann.id);
                        }}
                        className="text-slate-400 hover:text-red-600 shrink-0 cursor-pointer"
                        title="Xóa chú thích"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            }

            return null;
          })}
        </div>

        {/* Active Direct Drawing Capture Surface (only captures events when a direct drawing/placing tool is selected) */}
        {isDrawingDirect && (
          <div
            onPointerDown={handleOverlayPointerDown}
            onPointerMove={handleOverlayPointerMove}
            onPointerUp={handleOverlayPointerUp}
            className="absolute inset-0 z-30 touch-none cursor-crosshair"
          />
        )}
      </div>
    </div>
  );
};

export const InteractivePdfCanvas: React.FC<InteractivePdfCanvasProps> = ({
  pdfBytes,
  questions,
  mode,
  examMode,
  selectedQuestionId,
  answers,
  teacherKeys,
  gradingDetails,
  placingTypeLabel,
  sourcePdfPages,
  printedPageLabels,
  scrollToQuestionNonce,
  plainAnnotations = [],
  enableDirectPdfTools = false,
  onChangePlainAnnotations,
  onCancelPlacing,
  onSelectQuestion,
  onPlaceAtPoint,
  onUpdateRegion,
  onDeleteQuestion,
  onChangeAnswer,
}) => {
  const [zoom, setZoom] = useState(1.15);
  const [handle, setHandle] = useState<LoadedPdfHandle | null>(null);
  const [pageDims, setPageDims] = useState<PageDim[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [directTool, setDirectTool] = useState<DirectPdfTool>('select');
  const [directColor, setDirectColor] = useState<string>('#164E63');
  const [directMarkSymbol, setDirectMarkSymbol] = useState<'check' | 'cross' | 'circle'>('check');
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
  const [showDirectToolsOnInteractive, setShowDirectToolsOnInteractive] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const isPlainMode = mode === 'solve' && questions.length === 0;
  const directToolbarVisible =
    mode === 'solve' && enableDirectPdfTools && (isPlainMode || showDirectToolsOnInteractive);

  // Reset active drawing tool when switching PDF documents
  useEffect(() => {
    setDirectTool('select');
    setSelectedAnnotationId(null);
  }, [pdfBytes]);

  // Auto-scroll smoothly to selected question when teacher clicks in Left Question List
  useEffect(() => {
    if (!selectedQuestionId || !scrollToQuestionNonce) return;
    const root = scrollContainerRef.current;
    if (!root) return;
    const target = root.querySelector(`[data-question-id="${CSS.escape(selectedQuestionId)}"]`);
    if (target && 'scrollIntoView' in target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    }
  }, [selectedQuestionId, scrollToQuestionNonce]);

  useEffect(() => {
    let active = true;
    let currentHandle: LoadedPdfHandle | null = null;

    if (!pdfBytes || pdfBytes.byteLength === 0) {
      setHandle(null);
      setPageDims([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    openPdfDocument(pdfBytes)
      .then(async (loaded) => {
        if (!active) {
          await loaded.destroy().catch(() => {});
          return;
        }
        currentHandle = loaded;
        const dims: PageDim[] = [];
        for (let i = 1; i <= loaded.proxy.numPages; i++) {
          const p = await loaded.proxy.getPage(i);
          const vp = p.getViewport({ scale: 1 });
          dims.push({ pageIndex: i - 1, width: vp.width, height: vp.height });
        }
        if (!active) return;
        setPageDims(dims);
        setHandle(loaded);
        setLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setLoading(false);
        setError(err instanceof Error ? err.message : 'Không thể hiển thị tài liệu PDF.');
      });

    return () => {
      active = false;
      currentHandle?.destroy().catch(() => {});
    };
  }, [pdfBytes]);

  const handleAddAnnotation = (ann: PlainPdfAnnotation) => {
    onChangePlainAnnotations?.([...plainAnnotations, ann]);
    // For text/number/callout, immediately switch back to select mode so the student can type comfortably
    if (ann.kind === 'text' || ann.kind === 'number' || ann.kind === 'callout') {
      setDirectTool('select');
    }
  };

  const handleUpdateAnnotation = (id: string, patch: Partial<PlainPdfAnnotation>) => {
    onChangePlainAnnotations?.(
      plainAnnotations.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
  };

  const handleDeleteAnnotation = (id: string) => {
    onChangePlainAnnotations?.(plainAnnotations.filter((item) => item.id !== id));
    if (selectedAnnotationId === id) setSelectedAnnotationId(null);
  };

  const handleUndoAnnotation = () => {
    if (plainAnnotations.length === 0) return;
    const removed = plainAnnotations[plainAnnotations.length - 1];
    onChangePlainAnnotations?.(plainAnnotations.slice(0, -1));
    if (selectedAnnotationId === removed.id) setSelectedAnnotationId(null);
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-[#E6EFEF]">
      {/* Canvas Zoom & Placement Banner */}
      <div className="px-4 py-2.5 bg-white border-b border-slate-200 flex items-center justify-between gap-3 flex-wrap shrink-0">
        <div className="flex items-center gap-2.5 text-[16px] font-medium text-slate-800 flex-wrap">
          {placingTypeLabel ? (
            <div className="flex items-center gap-2.5 flex-wrap px-3.5 py-2 rounded-xl bg-teal-50 border-2 border-[#087F70] text-[#164E63] font-semibold">
              <span>
                Nhấn vào vị trí cần trả lời trên trang PDF để thêm: <strong>{placingTypeLabel}</strong>
              </span>
              {onCancelPlacing && (
                <button
                  type="button"
                  onClick={onCancelPlacing}
                  className="inline-flex items-center gap-1 px-3 py-1.5 min-h-[38px] rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 text-[15px] font-bold cursor-pointer"
                >
                  <X className="w-4 h-4" />
                  <span>Hủy</span>
                </button>
              )}
            </div>
          ) : pageDims.length > 0 ? (
            mode === 'author' && questions.length === 0 ? (
              <span className="text-slate-700 font-semibold">
                {pageDims.length} trang · Chưa tạo bài tập. Thầy cô hãy nhấn <strong>Tạo bài tập tự động</strong>.
              </span>
            ) : isPlainMode ? (
              <span className="text-[#164E63] font-semibold">
                Đang hiển thị {pageDims.length} trang · Đã ghi {plainAnnotations.length} mục trên trang
              </span>
            ) : (
              <span className="text-[#164E63] font-semibold">
                Đang hiển thị {pageDims.length} trang · {questions.length} câu hỏi
                {plainAnnotations.length > 0 ? ` · ${plainAnnotations.length} ghi chú trực tiếp` : ''}
              </span>
            )
          ) : (
            <span className="text-slate-600">Chưa mở tài liệu PDF</span>
          )}

          {mode === 'solve' && enableDirectPdfTools && !isPlainMode && (
            <button
              type="button"
              onClick={() => {
                setShowDirectToolsOnInteractive((v) => {
                  if (v) setDirectTool('select');
                  return !v;
                });
              }}
              className={`inline-flex items-center gap-1.5 px-3 min-h-[38px] rounded-lg border text-[14px] font-semibold cursor-pointer ${
                showDirectToolsOnInteractive
                  ? 'bg-[#E6F1EF] border-[#087F70] text-[#164E63]'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <PenTool className="w-4 h-4 text-[#087F70]" />
              <span>{showDirectToolsOnInteractive ? 'Ẩn công cụ ghi trên trang' : 'Ghi trực tiếp trên trang'}</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0.65, Math.round((z - 0.15) * 100) / 100))}
            className="inline-flex items-center gap-1.5 px-3 min-h-[44px] rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-[15px] font-semibold cursor-pointer"
            title="Thu nhỏ trang PDF"
          >
            <ZoomOut className="w-4 h-4" />
            <span className="hidden sm:inline">Thu nhỏ</span>
          </button>
          <span className="min-w-[60px] text-center text-[16px] font-bold text-[#164E63] tabular-nums">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(1.85, Math.round((z + 0.15) * 100) / 100))}
            className="inline-flex items-center gap-1.5 px-3 min-h-[44px] rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-[15px] font-semibold cursor-pointer"
            title="Phóng to trang PDF"
          >
            <ZoomIn className="w-4 h-4" />
            <span className="hidden sm:inline">Phóng to</span>
          </button>
          <button
            type="button"
            onClick={() => setZoom(1.15)}
            className="px-3 min-h-[44px] rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-[15px] font-semibold text-slate-800 cursor-pointer"
          >
            Vừa mắt
          </button>
        </div>
      </div>

      {/* Direct Plain-PDF Solving Toolbar (Check, Text, Number, Line, Pen, Callout) */}
      {directToolbarVisible && handle && (
        <div className="px-4 py-2 bg-[#F8FBFA] border-b border-teal-200/80 space-y-1.5 shrink-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { id: 'select' as DirectPdfTool, label: 'Chọn / Sửa', icon: MousePointer2 },
                { id: 'check' as DirectPdfTool, label: 'Đánh dấu', icon: CheckSquare },
                { id: 'text' as DirectPdfTool, label: 'Nhập chữ', icon: Type },
                { id: 'number' as DirectPdfTool, label: 'Nhập số', icon: Hash },
                { id: 'line' as DirectPdfTool, label: 'Vẽ đường nối', icon: Minus },
                { id: 'pen' as DirectPdfTool, label: 'Viết tay', icon: PenTool },
                { id: 'callout' as DirectPdfTool, label: 'Chú thích hình', icon: MapPin },
              ].map((tool) => {
                const Icon = tool.icon;
                const active = directTool === tool.id;
                return (
                  <button
                    key={tool.id}
                    type="button"
                    onClick={() => setDirectTool(tool.id)}
                    className={`inline-flex items-center gap-1.5 px-3 min-h-[40px] rounded-lg border text-[14.5px] font-semibold transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#087F70] border-[#087F70] text-white shadow-2xs'
                        : 'bg-white border-slate-300 text-[#164E63] hover:bg-[#E6F1EF]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tool.label}</span>
                  </button>
                );
              })}

              {directTool === 'check' && (
                <div className="flex items-center gap-1 pl-1 border-l border-slate-300">
                  {[
                    { sym: 'check' as const, label: '✓ Đúng' },
                    { sym: 'cross' as const, label: '✗ Sai' },
                    { sym: 'circle' as const, label: '○ Khoanh' },
                  ].map((opt) => (
                    <button
                      key={opt.sym}
                      type="button"
                      onClick={() => setDirectMarkSymbol(opt.sym)}
                      className={`px-2.5 min-h-[36px] rounded-md border text-[14px] font-bold cursor-pointer ${
                        directMarkSymbol === opt.sym
                          ? 'bg-[#164E63] border-[#164E63] text-white'
                          : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white border border-slate-200">
                <span className="text-[13px] font-semibold text-slate-600">Màu mực:</span>
                {DIRECT_INK_COLORS.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    title={c.label}
                    onClick={() => setDirectColor(c.hex)}
                    style={{ backgroundColor: c.hex }}
                    className={`w-6 h-6 rounded-full cursor-pointer transition-transform ${
                      directColor === c.hex ? 'ring-2 ring-offset-2 ring-[#087F70] scale-110' : ''
                    }`}
                  />
                ))}
              </div>

              <button
                type="button"
                disabled={plainAnnotations.length === 0}
                onClick={handleUndoAnnotation}
                className="inline-flex items-center gap-1 px-3 min-h-[38px] rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-45 text-slate-700 text-[14px] font-semibold cursor-pointer"
                title="Hoàn tác mục vừa ghi"
              >
                <Undo2 className="w-4 h-4" />
                <span>Hoàn tác</span>
              </button>
            </div>
          </div>
          <div className="text-[13.5px] text-[#164E63] font-medium">
            {DIRECT_TOOL_HINTS[directTool]}
          </div>
        </div>
      )}

      {/* Scrollable Multi-Page PDF Viewport */}
      <div ref={scrollContainerRef} className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="bg-white rounded-xl px-6 py-5 shadow-md flex items-center gap-3 text-[17px] font-semibold text-[#164E63]">
              <Loader2 className="w-6 h-6 animate-spin text-[#087F70]" />
              <span>Đang mở tài liệu PDF. Vui lòng chờ...</span>
            </div>
          </div>
        ) : error ? (
          <div className="max-w-lg mx-auto mt-12 bg-white rounded-2xl border border-red-200 p-6 text-center space-y-3">
            <AlertCircle className="w-9 h-9 text-red-600 mx-auto" />
            <div className="text-[19px] font-bold text-red-700">Không thể hiển thị tài liệu PDF</div>
            <p className="text-[16px] text-slate-700 leading-relaxed">{error}</p>
          </div>
        ) : !handle ? (
          <div className="h-full flex items-center justify-center">
            <div className="max-w-md bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3 shadow-2xs">
              <FileText className="w-11 h-11 text-[#087F70] mx-auto" />
              <div className="text-[20px] font-bold text-[#164E63]">
                Chưa có tài liệu PDF nào đang mở
              </div>
              <p className="text-[16px] text-slate-700 leading-relaxed">
                Hãy nhấn nút <strong>Tải PDF</strong> để chọn tài liệu từ máy tính.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6 pb-10">
            {pageDims.map((dim) => (
              <SinglePdfPageCanvas
                key={dim.pageIndex}
                handle={handle}
                dim={dim}
                zoom={zoom}
                questions={questions.filter((q) => q.region.pageIndex === dim.pageIndex)}
                pageAnnotations={plainAnnotations.filter((a) => a.pageIndex === dim.pageIndex)}
                mode={mode}
                examMode={examMode}
                selectedQuestionId={selectedQuestionId}
                answers={answers}
                teacherKeys={teacherKeys}
                gradingDetails={gradingDetails}
                placingActive={Boolean(placingTypeLabel)}
                directTool={directToolbarVisible ? directTool : 'select'}
                directColor={directColor}
                directMarkSymbol={directMarkSymbol}
                selectedAnnotationId={selectedAnnotationId}
                sourcePdfPageNum={sourcePdfPages?.[dim.pageIndex]}
                printedPageLabel={printedPageLabels?.[dim.pageIndex]}
                onSelectAnnotation={setSelectedAnnotationId}
                onAddAnnotation={handleAddAnnotation}
                onUpdateAnnotation={handleUpdateAnnotation}
                onDeleteAnnotation={handleDeleteAnnotation}
                onSelectQuestion={onSelectQuestion}
                onPlaceAtPoint={onPlaceAtPoint}
                onUpdateRegion={onUpdateRegion}
                onDeleteQuestion={onDeleteQuestion}
                onChangeAnswer={onChangeAnswer}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
