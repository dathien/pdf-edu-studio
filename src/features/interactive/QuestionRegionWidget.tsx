import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MathfieldElement } from 'mathlive';
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Check,
  CheckCircle2,
  CheckSquare,
  Download,
  Eraser,
  GripVertical,
  Paperclip,
  PenLine,
  PenTool,
  RotateCcw,
  Square,
  Tag,
  Trash2,
  Undo2,
} from 'lucide-react';
import { compileLatexToSvg } from '../../engines/mathematics/formulaEngine';
import { safeSanitizeSvgMarkup } from '../../utils/svgSanitizer';
import {
  MAX_ATTACHMENTS_PER_QUESTION,
  validateAttachmentFile,
} from './interactiveEngine';
import { MatchingWidget } from './MatchingWidget';
import {
  QUESTION_TYPE_META,
  type DrawingStroke,
  type InteractiveQuestion,
  type QuestionGradingDetail,
  type StudentAttachmentMeta,
  type StudentQuestionAnswer,
  type TeacherQuestionKey,
} from '../../types/interactive';

// Ensure MathLive uses local bundled fonts (100% offline, zero external CDN requests)
if (typeof window !== 'undefined' && typeof MathfieldElement !== 'undefined') {
  MathfieldElement.fontsDirectory = '/mathlive/fonts';
  MathfieldElement.soundsDirectory = null;
}

interface QuestionRegionWidgetProps {
  question: InteractiveQuestion;
  zoom: number;
  pageWidth: number;
  pageHeight: number;
  mode: 'author' | 'solve' | 'grade';
  examMode: 'exam' | 'practice';
  selected?: boolean;
  answer?: StudentQuestionAnswer;
  teacherKey?: TeacherQuestionKey;
  gradingDetail?: QuestionGradingDetail;
  onSelect?: () => void;
  onUpdateRegion?: (patch: Partial<InteractiveQuestion['region']>) => void;
  onDeleteQuestion?: () => void;
  onChangeAnswer?: (next: StudentQuestionAnswer) => void;
  onOpenAnswerDrawer?: (questionId: string) => void;
}

const FORMULA_QUICK_SNIPPETS = [
  { label: 'Phân số', latex: '\\frac{a}{b}' },
  { label: 'Căn bậc 2', latex: '\\sqrt{x}' },
  { label: 'Lũy thừa', latex: 'x^{2}' },
  { label: 'Tích phân', latex: '\\int_{a}^{b} f(x)\\,dx' },
  { label: 'Vector', latex: '\\vec{F}' },
  { label: 'Mũi tên', latex: '\\rightarrow' },
];

const MathLiveFieldInput: React.FC<{
  value: string;
  readOnly: boolean;
  placeholder?: string;
  onChange: (latex: string) => void;
}> = ({ value, readOnly, placeholder, onChange }) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const mfRef = useRef<MathfieldElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || typeof window === 'undefined') return;
    let mf: MathfieldElement | null = null;
    try {
      mf = new MathfieldElement();
      mf.value = value || '';
      mf.readOnly = readOnly;
      mf.style.width = '100%';
      mf.style.minHeight = '38px';
      mf.style.fontSize = '16px';
      mf.style.padding = '4px 8px';
      mf.style.borderRadius = '8px';
      mf.style.border = '1px solid #CBD5E1';
      mf.style.backgroundColor = '#FFFFFF';
      const handleInput = () => {
        if (mf) onChange(mf.value);
      };
      mf.addEventListener('input', handleInput);
      host.innerHTML = '';
      host.appendChild(mf);
      mfRef.current = mf;
      return () => {
        mf?.removeEventListener('input', handleInput);
        if (host.contains(mf!)) host.removeChild(mf!);
        mfRef.current = null;
      };
    } catch {
      return undefined;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readOnly]);

  useEffect(() => {
    const mf = mfRef.current;
    if (mf && mf.value !== value) {
      mf.value = value || '';
    }
  }, [value]);

  return (
    <div className="space-y-1">
      <div ref={hostRef} aria-label={placeholder || 'Nhập công thức MathLive'} />
      <input
        type="text"
        readOnly={readOnly}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || 'Hoặc nhập LaTeX trực tiếp (ví dụ: \\frac{-b}{2a})'}
        className="w-full rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-[12.5px] text-slate-700 focus:border-[#087F70] outline-none"
      />
    </div>
  );
};

export const QuestionRegionWidget: React.FC<QuestionRegionWidgetProps> = ({
  question,
  zoom,
  pageWidth,
  pageHeight,
  mode,
  examMode,
  selected,
  answer,
  teacherKey,
  gradingDetail,
  onSelect,
  onUpdateRegion,
  onDeleteQuestion,
  onChangeAnswer,
  onOpenAnswerDrawer,
}) => {
  const readOnly = mode !== 'solve';
  const [penColor, setPenColor] = useState('#164E63');
  const [penWidth, setPenWidth] = useState(2.5);
  const [attError, setAttError] = useState<string | null>(null);
  const drawingSvgRef = useRef<SVGSVGElement>(null);
  const activeStrokeRef = useRef<DrawingStroke | null>(null);
  const [liveStroke, setLiveStroke] = useState<DrawingStroke | null>(null);
  // Anchored SVG matching state (click-to-connect & pointer-drag-to-connect)
  const [selectedMatchAId, setSelectedMatchAId] = useState<string | null>(null);
  const [dragMatchLine, setDragMatchLine] = useState<{
    fromId: string;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  } | null>(null);
  const anchoredOverlayRef = useRef<HTMLDivElement>(null);

  const patchAnswer = (patch: Partial<StudentQuestionAnswer>) => {
    if (readOnly || !onChangeAnswer) return;
    onChangeAnswer({
      questionId: question.id,
      ...(answer || {}),
      ...patch,
      updatedAt: Date.now(),
    });
  };

  // Resolve exact PDF-point coordinates from normalized ratios if available (screen/zoom invariant!)
  const resolvedX =
    typeof question.region.nx === 'number'
      ? question.region.nx * pageWidth
      : question.region.x;
  const resolvedY =
    typeof question.region.ny === 'number'
      ? question.region.ny * pageHeight
      : question.region.y;
  const resolvedW =
    typeof question.region.nw === 'number'
      ? question.region.nw * pageWidth
      : question.region.width;
  const resolvedH =
    typeof question.region.nh === 'number'
      ? question.region.nh * pageHeight
      : question.region.height;

  // ---- AUTHOR MODE: DRAG & RESIZE IN NORMALIZED + PDF-POINT COORDINATES ----
  const startMove = (e: React.PointerEvent) => {
    if (mode !== 'author' || !onUpdateRegion) return;
    e.stopPropagation();
    onSelect?.();
    const startClientX = e.clientX;
    const startClientY = e.clientY;
    const origX = resolvedX;
    const origY = resolvedY;

    const handleMove = (ev: PointerEvent) => {
      const dx = (ev.clientX - startClientX) / zoom;
      const dy = (ev.clientY - startClientY) / zoom;
      const nxPt = Math.max(8, Math.min(pageWidth - resolvedW - 8, Math.round(origX + dx)));
      const nyPt = Math.max(8, Math.min(pageHeight - resolvedH - 8, Math.round(origY + dy)));
      onUpdateRegion({
        x: nxPt,
        y: nyPt,
        nx: Number((nxPt / pageWidth).toFixed(4)),
        ny: Number((nyPt / pageHeight).toFixed(4)),
      });
    };
    const handleUp = () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
  };

  const startResize = (e: React.PointerEvent) => {
    if (mode !== 'author' || !onUpdateRegion) return;
    e.stopPropagation();
    onSelect?.();
    const startClientX = e.clientX;
    const startClientY = e.clientY;
    const origW = resolvedW;
    const origH = resolvedH;

    const handleMove = (ev: PointerEvent) => {
      const dw = (ev.clientX - startClientX) / zoom;
      const dh = (ev.clientY - startClientY) / zoom;
      const nwPt = Math.max(160, Math.min(pageWidth - resolvedX - 8, Math.round(origW + dw)));
      const nhPt = Math.max(64, Math.min(pageHeight - resolvedY - 8, Math.round(origH + dh)));
      onUpdateRegion({
        width: nwPt,
        height: nhPt,
        nw: Number((nwPt / pageWidth).toFixed(4)),
        nh: Number((nhPt / pageHeight).toFixed(4)),
      });
    };
    const handleUp = () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
  };

  // ---- FORMULA SVG PREVIEW ----
  const formulaPreviewSvg = useMemo(() => {
    if (question.type !== 'formula') return null;
    const latex = answer?.formulaLatex?.trim();
    if (!latex) return null;
    try {
      const res = compileLatexToSvg(latex, '#164E63');
      return safeSanitizeSvgMarkup(res.svgMarkup);
    } catch {
      return null;
    }
  }, [question.type, answer?.formulaLatex]);

  // ---- DRAWING CANVAS POINTER HANDLERS (NORMALIZED 0..1 COORDS) ----
  const toNormalizedPoint = (e: React.PointerEvent<SVGSVGElement>) => {
    const svg = drawingSvgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(1, (e.clientX - rect.left) / Math.max(1, rect.width))),
      y: Math.max(0, Math.min(1, (e.clientY - rect.top) / Math.max(1, rect.height))),
    };
  };

  const handleDrawDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (readOnly) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const pt = toNormalizedPoint(e);
    const stroke: DrawingStroke = {
      id: `st-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      color: penColor,
      width: penWidth,
      points: [pt],
    };
    activeStrokeRef.current = stroke;
    setLiveStroke(stroke);
  };

  const handleDrawMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!activeStrokeRef.current) return;
    const pt = toNormalizedPoint(e);
    const next = {
      ...activeStrokeRef.current,
      points: [...activeStrokeRef.current.points, pt],
    };
    activeStrokeRef.current = next;
    setLiveStroke(next);
  };

  const handleDrawUp = () => {
    if (!activeStrokeRef.current) return;
    const finished = activeStrokeRef.current;
    activeStrokeRef.current = null;
    setLiveStroke(null);
    if (finished.points.length >= 2) {
      patchAnswer({ drawingStrokes: [...(answer?.drawingStrokes || []), finished] });
    }
  };

  // ---- ATTACHMENT PICKER ----
  const handleAddAttachments = async (files: FileList | null) => {
    if (!files || readOnly) return;
    setAttError(null);
    const existing = answer?.attachments || [];
    const next = [...existing];

    for (const file of Array.from(files)) {
      if (next.length >= MAX_ATTACHMENTS_PER_QUESTION) {
        setAttError(`Mỗi câu hỏi tối đa ${MAX_ATTACHMENTS_PER_QUESTION} tệp đính kèm.`);
        break;
      }
      const check = validateAttachmentFile(file);
      if (!check.ok) {
        setAttError(check.error || 'Tệp không hợp lệ.');
        continue;
      }
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const item: StudentAttachmentMeta = {
        id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
        size: file.size,
        dataUrl,
        addedAt: Date.now(),
      };
      next.push(item);
    }
    patchAnswer({ attachments: next });
  };

  // ---- ORDERING HELPERS ----
  const currentOrderIds = useMemo(() => {
    const base = (question.orderingItems || []).map((i) => i.id);
    if (answer?.orderingIds && answer.orderingIds.length === base.length) {
      return answer.orderingIds;
    }
    return base;
  }, [question.orderingItems, answer?.orderingIds]);

  const moveOrderItem = (idx: number, delta: -1 | 1) => {
    if (readOnly) return;
    const target = idx + delta;
    if (target < 0 || target >= currentOrderIds.length) return;
    const next = [...currentOrderIds];
    [next[idx], next[target]] = [next[target], next[idx]];
    patchAnswer({ orderingIds: next });
  };

  const cssPageW = pageWidth * zoom;
  const cssPageH = pageHeight * zoom;

  const boxStyle: React.CSSProperties = {
    left: `${resolvedX * zoom}px`,
    top: `${resolvedY * zoom}px`,
    width: `${resolvedW * zoom}px`,
    minHeight: `${resolvedH * zoom}px`,
  };

  // ============================================================================
  // CASE 1: UNCLASSIFIED QUESTION (NEVER RENDERED IN SOLVE/PREVIEW; COMPACT MARKER IN AUTHOR)
  // ============================================================================
  if (question.classificationStatus === 'unclassified') {
    if (mode === 'solve') return null;
    return (
      <div
        data-question-id={question.id}
        style={{
          left: `${resolvedX * zoom}px`,
          top: `${resolvedY * zoom}px`,
        }}
        onClick={(e) => {
          e.stopPropagation();
          onSelect?.();
        }}
        className={`absolute z-30 inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[13px] font-bold shadow-xs cursor-pointer transition-all ${
          selected
            ? 'bg-amber-600 border-amber-700 text-white ring-2 ring-amber-300'
            : 'bg-amber-50/95 border-amber-500 text-amber-950 hover:bg-amber-100'
        }`}
        title="Câu hỏi chưa xác định dạng tự động — nhấn để chọn dạng phù hợp"
      >
        <Tag className="w-3.5 h-3.5 shrink-0" />
        <span>{question.code} · Chưa xác định dạng</span>
        {mode === 'author' && onDeleteQuestion && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteQuestion();
            }}
            className="ml-1 p-0.5 rounded hover:bg-red-100 hover:text-red-700 cursor-pointer"
            title="Xóa câu hỏi này"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  }

  // ============================================================================
  // CASE 2: COMPACT NON-COVERING DRAWER BUTTON (ESSAY / SHORT WHEN PDF IS TIGHT)
  // ============================================================================
  if (question.overlayMode === 'drawer_button') {
    const writtenText =
      question.type === 'essay'
        ? (answer?.essayText || '').trim()
        : question.type === 'short'
          ? (answer?.shortText || '').trim()
          : '';
    const hasWritten = writtenText.length > 0;

    return (
      <div
        data-question-id={question.id}
        style={{
          left: `${resolvedX * zoom}px`,
          top: `${resolvedY * zoom}px`,
        }}
        onPointerDown={mode === 'author' ? startMove : undefined}
        onClick={(e) => {
          e.stopPropagation();
          if (mode === 'solve') {
            onOpenAnswerDrawer?.(question.id);
          } else {
            onSelect?.();
          }
        }}
        className={`absolute z-30 inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 shadow-sm transition-all ${
          mode === 'author'
            ? selected
              ? 'bg-[#087F70] border-[#087F70] text-white ring-2 ring-teal-300 cursor-move'
              : 'bg-white/95 border-dashed border-[#087F70] text-[#164E63] hover:bg-teal-50 cursor-move'
            : mode === 'grade'
              ? selected
                ? 'bg-red-600 border-red-700 text-white ring-2 ring-red-200 cursor-pointer'
                : 'bg-red-50/95 border-red-400 text-red-900 cursor-pointer'
              : hasWritten
                ? 'bg-[#087F70] border-[#087F70] text-white hover:bg-[#06695d] cursor-pointer'
                : 'bg-white/96 border-[#087F70] text-[#164E63] hover:bg-[#E6F1EF] cursor-pointer'
        }`}
      >
        <PenLine className="w-4 h-4 shrink-0" />
        <span className="text-[13.5px] font-bold whitespace-nowrap">
          {mode === 'author'
            ? `${question.code} · Viết câu trả lời`
            : hasWritten
              ? `Sửa câu trả lời (${writtenText.slice(0, 18)}${writtenText.length > 18 ? '…' : ''})`
              : 'Viết câu trả lời'}
        </span>
        {mode === 'author' && onDeleteQuestion && (
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onDeleteQuestion();
            }}
            className="p-0.5 rounded hover:bg-red-100 hover:text-red-700 cursor-pointer"
            title="Xóa câu hỏi này"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  }

  // ============================================================================
  // CASE 3: TRANSPARENT PDF-ANCHORED OVERLAYS (MCQ, TF, MATCHING, FILL-BLANK)
  // NEVER COVERS ORIGINAL PDF TEXT OR ILLUSTRATIONS!
  // ============================================================================
  const canRenderAnchoredMcq =
    question.overlayMode === 'anchored' &&
    (question.type === 'mcq' || question.type === 'mcq_multi') &&
    (question.mcqOptions?.length || 0) >= 2 &&
    question.mcqOptions!.every((o) => Boolean(o.anchor));

  if (canRenderAnchoredMcq) {
    const isMulti = question.type === 'mcq_multi';
    const opts = question.mcqOptions || [];
    const hitSize = Math.max(24, Math.round(24 * zoom));
    return (
      <div
        data-question-id={question.id}
        className="absolute inset-0 pointer-events-none z-20"
      >
        {/* Minimal Author-only header badge at top-right of question */}
        {mode === 'author' && (
          <div
            style={{
              left: `${Math.min(cssPageW - 190, Math.max(8, (resolvedX + resolvedW - 185) * zoom))}px`,
              top: `${Math.max(4, resolvedY * zoom - 4)}px`,
            }}
            onClick={(e) => {
              e.stopPropagation();
              onSelect?.();
            }}
            className={`pointer-events-auto absolute inline-flex items-center gap-1.5 rounded-lg border px-2 py-0.5 text-[12.5px] font-bold shadow-2xs cursor-pointer ${
              selected
                ? 'bg-[#087F70] border-[#087F70] text-white'
                : 'bg-white/92 border-[#087F70]/70 text-[#164E63] hover:bg-teal-50'
            }`}
          >
            <span>
              {question.code} · {isMulti ? 'Nhiều đáp án' : 'Trắc nghiệm'}
            </span>
            {onDeleteQuestion && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteQuestion();
                }}
                className="p-0.5 rounded hover:bg-red-100 hover:text-red-700 cursor-pointer"
                title="Xóa câu hỏi này"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

        {/* Transparent clickable checkboxes anchored directly beside each option on the PDF */}
        {opts.map((opt) => {
          const anc = opt.anchor!;
          const cx = anc.nx * cssPageW;
          const cy = anc.ny * cssPageH;
          const checked = isMulti
            ? (answer?.mcqMultiSelectedIds || []).includes(opt.id)
            : answer?.mcqSelectedId === opt.id;
          const isCorrectKey =
            mode === 'grade' &&
            (isMulti
              ? (teacherKey?.mcqMultiCorrectIds || []).includes(opt.id)
              : teacherKey?.mcqCorrectId === opt.id);

          return (
            <button
              key={opt.id}
              type="button"
              style={{
                left: `${cx}px`,
                top: `${cy}px`,
                width: `${hitSize}px`,
                height: `${hitSize}px`,
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (mode === 'author' || mode === 'grade') {
                  onSelect?.();
                  return;
                }
                if (isMulti) {
                  const cur = answer?.mcqMultiSelectedIds || [];
                  const next = cur.includes(opt.id)
                    ? cur.filter((id) => id !== opt.id)
                    : [...cur, opt.id];
                  patchAnswer({ mcqMultiSelectedIds: next });
                } else {
                  patchAnswer({
                    mcqSelectedId: answer?.mcqSelectedId === opt.id ? undefined : opt.id,
                  });
                }
              }}
              aria-label={`${question.code} - Phương án ${opt.label}`}
              title={`${opt.label}. ${opt.text}`}
              className={`pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center transition-all ${
                isMulti ? 'rounded-md' : 'rounded-md'
              } ${
                readOnly ? 'cursor-pointer' : 'cursor-pointer hover:scale-110'
              } ${
                checked
                  ? 'bg-[#087F70] border-2 border-[#087F70] text-white shadow-xs'
                  : isCorrectKey
                    ? 'bg-emerald-100/90 border-2 border-emerald-600 text-emerald-800'
                    : mode === 'author'
                      ? selected
                        ? 'bg-teal-50/70 border-2 border-[#087F70] text-[#087F70]'
                        : 'bg-teal-50/40 border border-dashed border-[#087F70] text-[#164E63]'
                      : 'bg-white/35 border-2 border-[#164E63]/65 hover:border-[#087F70] hover:bg-teal-50/50 text-transparent'
              }`}
            >
              {checked ? (
                <Check className="w-4 h-4 stroke-[3]" />
              ) : isCorrectKey ? (
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              ) : mode === 'author' ? (
                <span className="text-[11px] font-bold">{opt.label}</span>
              ) : null}
            </button>
          );
        })}
      </div>
    );
  }

  const canRenderAnchoredTf =
    question.overlayMode === 'anchored' &&
    question.type === 'tf' &&
    (question.tfStatements?.length || 0) >= 2 &&
    question.tfStatements!.every((st) => Boolean(st.rowAnchor));

  if (canRenderAnchoredTf) {
    const stmts = question.tfStatements || [];
    const btnSize = Math.max(24, Math.round(24 * zoom));
    return (
      <div
        data-question-id={question.id}
        className="absolute inset-0 pointer-events-none z-20"
      >
        {mode === 'author' && (
          <div
            style={{
              left: `${Math.min(cssPageW - 185, Math.max(8, (resolvedX + resolvedW - 180) * zoom))}px`,
              top: `${Math.max(4, resolvedY * zoom - 4)}px`,
            }}
            onClick={(e) => {
              e.stopPropagation();
              onSelect?.();
            }}
            className={`pointer-events-auto absolute inline-flex items-center gap-1.5 rounded-lg border px-2 py-0.5 text-[12.5px] font-bold shadow-2xs cursor-pointer ${
              selected
                ? 'bg-[#087F70] border-[#087F70] text-white'
                : 'bg-white/92 border-[#087F70]/70 text-[#164E63] hover:bg-teal-50'
            }`}
          >
            <span>{question.code} · Đúng / Sai</span>
            {onDeleteQuestion && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteQuestion();
                }}
                className="p-0.5 rounded hover:bg-red-100 hover:text-red-700 cursor-pointer"
                title="Xóa câu hỏi này"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

        {stmts.map((st) => {
          const ra = st.rowAnchor!;
          const curVal = answer?.tfAnswers?.[st.id];
          const keyVal = mode === 'grade' ? teacherKey?.tfCorrectMap?.[st.id] : undefined;
          const cy = ra.ny * cssPageH;

          return (
            <React.Fragment key={st.id}>
              {(
                [
                  { val: 'T' as const, label: 'Đ', nx: ra.trueNx },
                  { val: 'F' as const, label: 'S', nx: ra.falseNx },
                ] as const
              ).map((col) => {
                const active = curVal === col.val;
                const isKey = keyVal === col.val;
                return (
                  <button
                    key={col.val}
                    type="button"
                    style={{
                      left: `${col.nx * cssPageW}px`,
                      top: `${cy}px`,
                      width: `${btnSize}px`,
                      height: `${btnSize}px`,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (mode === 'author' || mode === 'grade') {
                        onSelect?.();
                        return;
                      }
                      const nextMap = { ...(answer?.tfAnswers || {}) };
                      if (nextMap[st.id] === col.val) {
                        delete nextMap[st.id];
                      } else {
                        nextMap[st.id] = col.val;
                      }
                      patchAnswer({ tfAnswers: nextMap });
                    }}
                    title={`${st.label} ${col.val === 'T' ? 'Đúng' : 'Sai'}`}
                    className={`pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 rounded-md flex items-center justify-center text-[12px] font-black transition-all cursor-pointer ${
                      active
                        ? 'bg-[#087F70] border-2 border-[#087F70] text-white shadow-xs'
                        : isKey
                          ? 'bg-emerald-100 border-2 border-emerald-600 text-emerald-800'
                          : mode === 'author'
                            ? 'bg-teal-50/55 border border-dashed border-[#087F70] text-[#164E63]'
                            : 'bg-white/45 border border-[#164E63]/55 hover:border-[#087F70] hover:bg-teal-50/70 text-[#164E63]'
                    }`}
                  >
                    {active ? '✓' : col.label}
                  </button>
                );
              })}
            </React.Fragment>
          );
        })}
      </div>
    );
  }

  const canRenderAnchoredMatching =
    question.overlayMode === 'anchored' &&
    question.type === 'matching' &&
    question.matching?.mode === 'line' &&
    (question.matching.itemsA?.length || 0) >= 2 &&
    (question.matching.itemsB?.length || 0) >= 2 &&
    question.matching.itemsA.every((a) => Boolean(a.anchor)) &&
    question.matching.itemsB.every((b) => Boolean(b.anchor));

  if (canRenderAnchoredMatching && question.matching) {
    const itemsA = question.matching.itemsA;
    const itemsB = question.matching.itemsB;
    const pairs = answer?.matchingPairs || [];
    const allowMany = Boolean(question.matching.allowManyToOne);
    const keySet =
      mode === 'grade' && teacherKey?.matchingCorrectPairs
        ? new Set(teacherKey.matchingCorrectPairs.map((p) => `${p.fromId}->${p.toId}`))
        : null;
    const matchPalette = ['#087F70', '#164E63', '#2563EB', '#D97706', '#7C3AED', '#DC2626'];
    const portR = Math.max(9, Math.round(9 * zoom));

    const connectPair = (fromId: string, toId: string) => {
      if (readOnly) return;
      const filtered = allowMany
        ? pairs.filter((p) => !(p.fromId === fromId && p.toId === toId))
        : pairs.filter((p) => p.fromId !== fromId && p.toId !== toId);
      patchAnswer({ matchingPairs: [...filtered, { fromId, toId }] });
      setSelectedMatchAId(null);
    };

    const removePair = (fromId: string, toId: string) => {
      if (readOnly) return;
      patchAnswer({
        matchingPairs: pairs.filter((p) => !(p.fromId === fromId && p.toId === toId)),
      });
    };

    const startAnchoredDrag = (e: React.PointerEvent, fromId: string, x1: number, y1: number) => {
      if (readOnly) return;
      e.stopPropagation();
      setSelectedMatchAId(fromId);
      setDragMatchLine({ fromId, x1, y1, x2: x1, y2: y1 });

      const onMove = (ev: PointerEvent) => {
        const rect = anchoredOverlayRef.current?.getBoundingClientRect();
        if (!rect) return;
        setDragMatchLine((prev) =>
          prev
            ? {
                ...prev,
                x2: ev.clientX - rect.left,
                y2: ev.clientY - rect.top,
              }
            : null
        );
      };

      const onUp = (ev: PointerEvent) => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        const rect = anchoredOverlayRef.current?.getBoundingClientRect();
        setDragMatchLine(null);
        if (!rect) return;
        const dropX = ev.clientX - rect.left;
        const dropY = ev.clientY - rect.top;
        // Hit-test nearest right-side port within generous radius
        let bestB: string | null = null;
        let bestDist = Math.max(36, 36 * zoom);
        for (const itemB of itemsB) {
          const bx = itemB.anchor!.nx * cssPageW;
          const by = itemB.anchor!.ny * cssPageH;
          const d = Math.hypot(dropX - bx, dropY - by);
          if (d < bestDist) {
            bestDist = d;
            bestB = itemB.id;
          }
        }
        if (bestB) {
          connectPair(fromId, bestB);
        }
      };

      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    };

    return (
      <div
        ref={anchoredOverlayRef}
        data-question-id={question.id}
        className="absolute inset-0 pointer-events-none z-20"
      >
        {/* Transparent SVG Vector Connector Lines (Zoom-invariant PDF coordinates) */}
        <svg
          width={cssPageW}
          height={cssPageH}
          viewBox={`0 0 ${cssPageW} ${cssPageH}`}
          className="absolute inset-0 pointer-events-none"
        >
          {pairs.map((pair, idx) => {
            const itemA = itemsA.find((a) => a.id === pair.fromId);
            const itemB = itemsB.find((b) => b.id === pair.toId);
            if (!itemA?.anchor || !itemB?.anchor) return null;
            const x1 = itemA.anchor.nx * cssPageW;
            const y1 = itemA.anchor.ny * cssPageH;
            const x2 = itemB.anchor.nx * cssPageW;
            const y2 = itemB.anchor.ny * cssPageH;
            const isCorrect = keySet ? keySet.has(`${pair.fromId}->${pair.toId}`) : null;
            const strokeColor =
              isCorrect === true
                ? '#15803D'
                : isCorrect === false
                  ? '#DC2626'
                  : matchPalette[idx % matchPalette.length];
            return (
              <g key={`${pair.fromId}-${pair.toId}`}>
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={strokeColor}
                  strokeWidth={Math.max(2.6, 2.8 * zoom)}
                  strokeLinecap="round"
                />
                {!readOnly && (
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="transparent"
                    strokeWidth={14}
                    className="pointer-events-auto cursor-pointer"
                    onClick={(ev) => {
                      ev.stopPropagation();
                      removePair(pair.fromId, pair.toId);
                    }}
                  >
                    <title>Nhấn vào đường nối để xóa</title>
                  </line>
                )}
              </g>
            );
          })}

          {dragMatchLine && (
            <line
              x1={dragMatchLine.x1}
              y1={dragMatchLine.y1}
              x2={dragMatchLine.x2}
              y2={dragMatchLine.y2}
              stroke="#087F70"
              strokeWidth={Math.max(2.4, 2.6 * zoom)}
              strokeDasharray="6 4"
              strokeLinecap="round"
            />
          )}
        </svg>

        {/* Author badge OR Student compact Reset button (only when connections exist) */}
        {mode === 'author' ? (
          <div
            style={{
              left: `${Math.min(cssPageW - 195, Math.max(8, (resolvedX + resolvedW - 190) * zoom))}px`,
              top: `${Math.max(4, resolvedY * zoom - 4)}px`,
            }}
            onClick={(e) => {
              e.stopPropagation();
              onSelect?.();
            }}
            className={`pointer-events-auto absolute inline-flex items-center gap-1.5 rounded-lg border px-2 py-0.5 text-[12.5px] font-bold shadow-2xs cursor-pointer ${
              selected
                ? 'bg-[#087F70] border-[#087F70] text-white'
                : 'bg-white/92 border-[#087F70]/70 text-[#164E63] hover:bg-teal-50'
            }`}
          >
            <span>{question.code} · Ghép đôi trực tiếp</span>
            {onDeleteQuestion && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteQuestion();
                }}
                className="p-0.5 rounded hover:bg-red-100 hover:text-red-700 cursor-pointer"
                title="Xóa câu hỏi này"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        ) : (
          mode === 'solve' &&
          pairs.length > 0 && (
            <button
              type="button"
              style={{
                left: `${Math.min(cssPageW - 95, Math.max(8, (resolvedX + resolvedW - 90) * zoom))}px`,
                top: `${Math.max(4, resolvedY * zoom - 4)}px`,
              }}
              onClick={(e) => {
                e.stopPropagation();
                patchAnswer({ matchingPairs: [] });
                setSelectedMatchAId(null);
              }}
              className="pointer-events-auto absolute inline-flex items-center gap-1 rounded-lg bg-white/95 border border-slate-300 hover:border-red-400 hover:text-red-700 px-2 py-0.5 text-[12px] font-bold text-slate-700 shadow-2xs cursor-pointer"
              title="Xóa các đường nối của câu này để nối lại"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Làm lại</span>
            </button>
          )
        )}

        {/* Left column interactive ports (A) */}
        {itemsA.map((itemA, idx) => {
          const cx = itemA.anchor!.nx * cssPageW;
          const cy = itemA.anchor!.ny * cssPageH;
          const isSelectedA = selectedMatchAId === itemA.id;
          const isConnected = pairs.some((p) => p.fromId === itemA.id);
          return (
            <button
              key={itemA.id}
              type="button"
              style={{
                left: `${cx}px`,
                top: `${cy}px`,
                width: `${portR * 2}px`,
                height: `${portR * 2}px`,
              }}
              onPointerDown={(ev) => {
                if (mode === 'solve') startAnchoredDrag(ev, itemA.id, cx, cy);
              }}
              onClick={(ev) => {
                ev.stopPropagation();
                if (mode === 'author' || mode === 'grade') {
                  onSelect?.();
                  return;
                }
                setSelectedMatchAId((prev) => (prev === itemA.id ? null : itemA.id));
              }}
              title={`Kéo hoặc nhấn từ mục ${idx + 1} sang cột phải để nối`}
              className={`pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 flex items-center justify-center text-[10px] font-black transition-transform cursor-pointer ${
                isSelectedA
                  ? 'bg-[#087F70] border-white text-white ring-4 ring-teal-300/70 scale-125'
                  : isConnected
                    ? 'bg-[#087F70] border-white text-white shadow-xs'
                    : 'bg-white border-[#087F70] text-[#087F70] hover:scale-115 shadow-2xs'
              }`}
            >
              {idx + 1}
            </button>
          );
        })}

        {/* Right column interactive ports (B) */}
        {itemsB.map((itemB, idx) => {
          const cx = itemB.anchor!.nx * cssPageW;
          const cy = itemB.anchor!.ny * cssPageH;
          const isConnected = pairs.some((p) => p.toId === itemB.id);
          const letter = String.fromCharCode(65 + idx);
          return (
            <button
              key={itemB.id}
              type="button"
              style={{
                left: `${cx}px`,
                top: `${cy}px`,
                width: `${portR * 2}px`,
                height: `${portR * 2}px`,
              }}
              onClick={(ev) => {
                ev.stopPropagation();
                if (mode === 'author' || mode === 'grade') {
                  onSelect?.();
                  return;
                }
                if (selectedMatchAId) {
                  connectPair(selectedMatchAId, itemB.id);
                }
              }}
              title={
                selectedMatchAId
                  ? `Nhấn để nối vào mục ${letter}`
                  : `Điểm nối ${letter} (chọn điểm bên trái trước hoặc kéo đường nối tới đây)`
              }
              className={`pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 flex items-center justify-center text-[10px] font-black transition-transform cursor-pointer ${
                selectedMatchAId
                  ? 'bg-teal-50 border-[#087F70] text-[#164E63] ring-2 ring-teal-200 hover:scale-125'
                  : isConnected
                    ? 'bg-[#164E63] border-white text-white shadow-xs'
                    : 'bg-white border-[#164E63] text-[#164E63] hover:scale-115 shadow-2xs'
              }`}
            >
              {letter}
            </button>
          );
        })}
      </div>
    );
  }

  const canRenderAnchoredFillBlank =
    question.overlayMode === 'anchored' &&
    question.type === 'fill_blank' &&
    (question.fillBlanks?.length || 0) >= 1 &&
    question.fillBlanks!.every((s) => Boolean(s.anchor));

  if (canRenderAnchoredFillBlank) {
    const slots = question.fillBlanks || [];
    return (
      <div
        data-question-id={question.id}
        className="absolute inset-0 pointer-events-none z-20"
      >
        {mode === 'author' && (
          <div
            style={{
              left: `${Math.min(cssPageW - 180, Math.max(8, (resolvedX + resolvedW - 175) * zoom))}px`,
              top: `${Math.max(4, resolvedY * zoom - 4)}px`,
            }}
            onClick={(e) => {
              e.stopPropagation();
              onSelect?.();
            }}
            className={`pointer-events-auto absolute inline-flex items-center gap-1.5 rounded-lg border px-2 py-0.5 text-[12.5px] font-bold shadow-2xs cursor-pointer ${
              selected
                ? 'bg-[#087F70] border-[#087F70] text-white'
                : 'bg-white/92 border-[#087F70]/70 text-[#164E63]'
            }`}
          >
            <span>{question.code} · Điền chỗ trống</span>
            {onDeleteQuestion && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteQuestion();
                }}
                className="p-0.5 rounded hover:bg-red-100 hover:text-red-700 cursor-pointer"
                title="Xóa câu hỏi này"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

        {slots.map((slot) => {
          const anc = slot.anchor!;
          const left = anc.nx * cssPageW;
          const top = anc.ny * cssPageH;
          const w = Math.max(70, (anc.nw || 0.16) * cssPageW);
          return (
            <input
              key={slot.id}
              type="text"
              readOnly={readOnly}
              value={answer?.fillBlankAnswers?.[slot.id] || ''}
              onClick={(e) => {
                e.stopPropagation();
                if (mode === 'author' || mode === 'grade') onSelect?.();
              }}
              onChange={(e) =>
                patchAnswer({
                  fillBlankAnswers: {
                    ...(answer?.fillBlankAnswers || {}),
                    [slot.id]: e.target.value,
                  },
                })
              }
              placeholder={slot.placeholder || 'Nhập...'}
              style={{
                left: `${left}px`,
                top: `${top}px`,
                width: `${w}px`,
                fontSize: `${Math.max(12, Math.round(13 * zoom))}px`,
              }}
              className="pointer-events-auto absolute -translate-y-1/2 rounded-sm border-b-2 border-[#087F70] bg-white/85 px-1.5 py-0.5 font-semibold text-[#164E63] outline-none focus:bg-white focus:ring-2 focus:ring-teal-200"
            />
          );
        })}
      </div>
    );
  }

  // ============================================================================
  // CASE 4: STANDARD BOX OVERLAY (CLEAN STUDENT VIEW vs AUTHOR CONTROLS)
  // ============================================================================
  const borderClass =
    mode === 'author'
      ? selected
        ? 'border-2 border-[#087F70] ring-2 ring-[#087F70]/25 bg-white/95 shadow-md z-30'
        : question.needsReview && !question.teacherApproved
          ? 'border-2 border-dashed border-amber-500 bg-amber-50/55 hover:border-[#087F70] z-20'
          : 'border border-dashed border-[#164E63]/65 bg-white/82 hover:border-[#087F70] z-20'
      : mode === 'grade'
        ? selected
          ? 'border-2 border-[#DC2626] ring-2 ring-red-200 bg-white/97 shadow-md z-30'
          : 'border border-red-300 bg-white/94 z-20'
        : 'border border-[#087F70]/45 bg-white/90 shadow-2xs z-20 focus-within:border-[#087F70] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#087F70]/20';

  return (
    <div
      data-question-id={question.id}
      style={boxStyle}
      onClick={(e) => {
        if (mode === 'author' || mode === 'grade') {
          e.stopPropagation();
          onSelect?.();
        }
      }}
      className={`absolute rounded-xl overflow-hidden flex flex-col transition-shadow ${borderClass}`}
    >
      {/* Top Bar: Shown in Author/Grade mode; minimized or omitted for pure Essay/Short in Student Solve/Preview */}
      {(mode !== 'solve' || (question.type !== 'essay' && question.type !== 'short' && question.type !== 'number')) && (
        <div
          onPointerDown={mode === 'author' ? startMove : undefined}
          className={`px-2.5 py-1 flex items-center justify-between gap-2 text-[13.5px] font-semibold border-b ${
            mode === 'author'
              ? question.needsReview && !question.teacherApproved
                ? 'bg-amber-100/90 text-amber-950 border-amber-300 cursor-move select-none'
                : 'bg-[#E6F1EF]/95 text-[#164E63] border-teal-200 cursor-move select-none'
              : mode === 'grade'
                ? 'bg-red-50 text-[#991B1B] border-red-200 cursor-pointer'
                : 'bg-[#F4F8F7]/90 text-[#164E63] border-slate-200/80'
          }`}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            {mode === 'author' && <GripVertical className="w-4 h-4 text-[#087F70] shrink-0" />}
            <span className="truncate font-bold">
              {mode === 'solve'
                ? question.code
                : `${question.code} · ${QUESTION_TYPE_META[question.type].shortLabel}`}
            </span>
            {mode === 'author' && question.needsReview && !question.teacherApproved && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-600 text-white text-[11.5px] font-bold shrink-0">
                <AlertCircle className="w-3 h-3" />
                <span>Cần kiểm tra</span>
              </span>
            )}
            {mode === 'author' && question.teacherApproved && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-700 text-white text-[11.5px] font-bold shrink-0">
                <CheckCircle2 className="w-3 h-3" />
                <span>Đã kiểm tra</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {mode === 'grade' && gradingDetail ? (
              <span className="px-2 py-0.5 rounded bg-white border border-red-300 text-[#DC2626] font-bold text-[13px]">
                {typeof gradingDetail.earnedPoints === 'number'
                  ? `${gradingDetail.earnedPoints} / ${gradingDetail.maxPoints} điểm`
                  : `Chưa chấm / ${gradingDetail.maxPoints} điểm`}
              </span>
            ) : mode === 'author' ? (
              <span className="text-[12.5px] font-semibold text-slate-700">
                {question.maxPoints}đ
              </span>
            ) : null}
            {mode === 'author' && onDeleteQuestion && (
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteQuestion();
                }}
                className="p-1 rounded hover:bg-red-100 text-slate-600 hover:text-red-700 cursor-pointer"
                title="Xóa câu hỏi này"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Question Body (All 14 Distinct Interactive Types) */}
      <div className="p-2 flex-1 overflow-y-auto text-[14px] text-slate-800 space-y-2">
        {/* 1. MCQ Single Choice */}
        {question.type === 'mcq' && (
          <div className="grid grid-cols-2 gap-1.5">
            {(question.mcqOptions || []).map((opt) => {
              const checked = answer?.mcqSelectedId === opt.id;
              const isKey = mode === 'grade' && teacherKey?.mcqCorrectId === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  disabled={readOnly}
                  onClick={() => patchAnswer({ mcqSelectedId: opt.id })}
                  className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left text-[14px] transition-colors ${
                    readOnly ? 'cursor-default' : 'cursor-pointer'
                  } ${
                    isKey
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-semibold'
                      : checked
                        ? 'bg-[#087F70] border-[#087F70] text-white font-semibold'
                        : 'bg-white border-slate-300 hover:border-[#087F70]'
                  }`}
                >
                  <span className="font-bold shrink-0">{opt.label}.</span>
                  <span className="truncate">{opt.text}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* 2. MCQ Multiple Choice (Checkboxes) */}
        {question.type === 'mcq_multi' && (
          <div className="grid grid-cols-2 gap-1.5">
            {(question.mcqOptions || []).map((opt) => {
              const cur = answer?.mcqMultiSelectedIds || [];
              const checked = cur.includes(opt.id);
              const isKey =
                mode === 'grade' && (teacherKey?.mcqMultiCorrectIds || []).includes(opt.id);
              return (
                <button
                  key={opt.id}
                  type="button"
                  disabled={readOnly}
                  onClick={() => {
                    const next = checked
                      ? cur.filter((id) => id !== opt.id)
                      : [...cur, opt.id];
                    patchAnswer({ mcqMultiSelectedIds: next });
                  }}
                  className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left text-[14px] transition-colors ${
                    readOnly ? 'cursor-default' : 'cursor-pointer'
                  } ${
                    isKey
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-semibold'
                      : checked
                        ? 'bg-[#087F70] border-[#087F70] text-white font-semibold'
                        : 'bg-white border-slate-300 hover:border-[#087F70]'
                  }`}
                >
                  {checked ? (
                    <CheckSquare className="w-4 h-4 shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 shrink-0 opacity-60" />
                  )}
                  <span className="font-bold shrink-0">{opt.label}.</span>
                  <span className="truncate">{opt.text}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* 3. True / False per item */}
        {question.type === 'tf' && (
          <div className="space-y-1.5">
            {(question.tfStatements || []).map((st) => {
              const cur = answer?.tfAnswers?.[st.id] || '';
              const keyVal = mode === 'grade' ? teacherKey?.tfCorrectMap?.[st.id] : undefined;
              return (
                <div
                  key={st.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50/70 px-2 py-1"
                >
                  <span className="text-[13.5px] leading-snug">
                    <strong className="text-[#164E63]">{st.label}</strong> {st.text}
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    {(['T', 'F'] as const).map((val) => {
                      const active = cur === val;
                      const isCorrectKey = keyVal === val;
                      return (
                        <button
                          key={val}
                          type="button"
                          disabled={readOnly}
                          onClick={() =>
                            patchAnswer({
                              tfAnswers: { ...(answer?.tfAnswers || {}), [st.id]: val },
                            })
                          }
                          className={`px-2 py-0.5 rounded text-[13px] font-bold border ${
                            readOnly ? 'cursor-default' : 'cursor-pointer'
                          } ${
                            active
                              ? 'bg-[#087F70] border-[#087F70] text-white'
                              : isCorrectKey
                                ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                                : 'bg-white border-slate-300 text-slate-700 hover:border-[#087F70]'
                          }`}
                        >
                          {val === 'T' ? 'Đ' : 'S'}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 4. Short Answer */}
        {question.type === 'short' && (
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly={readOnly}
              value={answer?.shortText || ''}
              onChange={(e) => patchAnswer({ shortText: e.target.value })}
              placeholder={question.shortPlaceholder || 'Nhập câu trả lời ngắn...'}
              className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[14.5px] text-slate-900 focus:border-[#087F70] outline-none"
            />
            {question.shortUnit && (
              <span className="text-[14px] font-semibold text-[#164E63] shrink-0">
                {question.shortUnit}
              </span>
            )}
          </div>
        )}

        {/* 5. Numeric Input */}
        {question.type === 'number' && (
          <div className="flex items-center gap-2">
            <input
              type="text"
              inputMode="decimal"
              readOnly={readOnly}
              value={answer?.numberValue || ''}
              onChange={(e) => {
                const v = e.target.value;
                if (/^-?\d*[.,]?\d*$/.test(v)) {
                  patchAnswer({ numberValue: v });
                }
              }}
              placeholder={question.numberPlaceholder || 'Nhập giá trị số (VD: 12.5)'}
              className="w-44 rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-mono text-[15px] font-semibold text-[#164E63] focus:border-[#087F70] outline-none"
            />
            {question.numberUnit && (
              <span className="text-[14.5px] font-semibold text-[#164E63]">
                {question.numberUnit}
              </span>
            )}
          </div>
        )}

        {/* 6. Fill in the Blank */}
        {question.type === 'fill_blank' && (
          <div className="space-y-1.5">
            {(question.fillBlanks || []).map((slot) => (
              <div key={slot.id} className="flex flex-wrap items-center gap-1.5 text-[14px]">
                {slot.prefix && <span>{slot.prefix}</span>}
                <input
                  type="text"
                  readOnly={readOnly}
                  value={answer?.fillBlankAnswers?.[slot.id] || ''}
                  onChange={(e) =>
                    patchAnswer({
                      fillBlankAnswers: {
                        ...(answer?.fillBlankAnswers || {}),
                        [slot.id]: e.target.value,
                      },
                    })
                  }
                  placeholder={slot.placeholder || '...'}
                  className="w-28 rounded-md border border-[#087F70]/60 bg-white px-2 py-0.5 text-[14px] font-semibold text-[#164E63] focus:border-[#087F70] outline-none"
                />
                {slot.suffix && <span>{slot.suffix}</span>}
              </div>
            ))}
          </div>
        )}

        {/* 7. Essay */}
        {question.type === 'essay' && (
          <textarea
            readOnly={readOnly}
            rows={4}
            value={answer?.essayText || ''}
            onChange={(e) => patchAnswer({ essayText: e.target.value })}
            placeholder={question.essayPlaceholder || 'Nhập bài làm tự luận chi tiết tại đây...'}
            className="w-full h-full min-h-[82px] rounded-lg border border-slate-300 bg-white p-2 text-[14px] text-slate-900 focus:border-[#087F70] outline-none resize-none"
          />
        )}

        {/* 8. Matching (Line-Connecting OR Drag-and-Drop) */}
        {question.type === 'matching' && question.matching && (
          <MatchingWidget
            questionId={question.id}
            config={question.matching}
            pairs={answer?.matchingPairs || []}
            mode={mode}
            examMode={examMode}
            teacherKey={teacherKey}
            onChangePairs={(nextPairs) => patchAnswer({ matchingPairs: nextPairs })}
          />
        )}

        {/* 9. Ordering */}
        {question.type === 'ordering' && (
          <div className="space-y-1.5">
            {currentOrderIds.map((id, idx) => {
              const item = (question.orderingItems || []).find((i) => i.id === id);
              if (!item) return null;
              return (
                <div
                  key={id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[13.5px]"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-[#164E63] text-white text-[12px] font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="leading-snug">{item.text}</span>
                  </div>
                  {!readOnly && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => moveOrderItem(idx, -1)}
                        className="p-1 rounded border border-slate-300 bg-white hover:bg-teal-50 disabled:opacity-35 cursor-pointer"
                        title="Di chuyển lên"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === currentOrderIds.length - 1}
                        onClick={() => moveOrderItem(idx, 1)}
                        className="p-1 rounded border border-slate-300 bg-white hover:bg-teal-50 disabled:opacity-35 cursor-pointer"
                        title="Di chuyển xuống"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 10. Reading Comprehension */}
        {question.type === 'reading' && (
          <div className="space-y-2">
            {question.readingPassage && (
              <div className="rounded-lg bg-slate-50 border border-slate-200 p-2 text-[13px] leading-relaxed text-slate-700 italic">
                {question.readingPassage}
              </div>
            )}
            <div className="space-y-1.5">
              {(question.readingSubQuestions || []).map((sq) => {
                const val = answer?.readingAnswers?.[sq.id] || '';
                return (
                  <div key={sq.id} className="space-y-1">
                    <div className="text-[13px] font-semibold text-[#164E63]">{sq.prompt}</div>
                    {sq.kind === 'mcq' && sq.options ? (
                      <div className="flex flex-wrap gap-1.5">
                        {sq.options.map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            disabled={readOnly}
                            onClick={() =>
                              patchAnswer({
                                readingAnswers: { ...(answer?.readingAnswers || {}), [sq.id]: opt },
                              })
                            }
                            className={`px-2 py-1 rounded-md border text-[13px] ${
                              readOnly ? 'cursor-default' : 'cursor-pointer'
                            } ${
                              val === opt
                                ? 'bg-[#087F70] border-[#087F70] text-white font-semibold'
                                : 'bg-white border-slate-300 hover:border-[#087F70]'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <input
                        type="text"
                        readOnly={readOnly}
                        value={val}
                        onChange={(e) =>
                          patchAnswer({
                            readingAnswers: {
                              ...(answer?.readingAnswers || {}),
                              [sq.id]: e.target.value,
                            },
                          })
                        }
                        placeholder="Nhập câu trả lời..."
                        className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1 text-[13.5px] focus:border-[#087F70] outline-none"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 11. Scientific Formula (MathLive visual editor + LaTeX + SVG Preview) */}
        {question.type === 'formula' && (
          <div className="space-y-1.5">
            {!readOnly && (
              <div className="flex flex-wrap gap-1">
                {FORMULA_QUICK_SNIPPETS.map((sn) => (
                  <button
                    key={sn.label}
                    type="button"
                    onClick={() =>
                      patchAnswer({
                        formulaLatex: `${answer?.formulaLatex || ''}${answer?.formulaLatex ? ' ' : ''}${sn.latex}`,
                      })
                    }
                    className="px-2 py-0.5 rounded bg-slate-100 hover:bg-teal-50 border border-slate-200 text-[12px] font-medium text-[#164E63] cursor-pointer"
                  >
                    + {sn.label}
                  </button>
                ))}
              </div>
            )}
            <MathLiveFieldInput
              value={answer?.formulaLatex || ''}
              readOnly={readOnly}
              placeholder={question.formulaPlaceholder}
              onChange={(latex) => patchAnswer({ formulaLatex: latex })}
            />
            {formulaPreviewSvg && (
              <div className="min-h-[32px] rounded-lg border border-slate-200 bg-[#F8FBFA] px-2.5 py-1 flex items-center">
                <div
                  className="[&>svg]:max-h-8 [&>svg]:w-auto"
                  dangerouslySetInnerHTML={{ __html: formulaPreviewSvg }}
                />
              </div>
            )}
          </div>
        )}

        {/* 12. Freehand Drawing / Handwriting */}
        {question.type === 'drawing' && (
          <div className="space-y-1.5 h-full flex flex-col">
            {!readOnly && (
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <PenTool className="w-3.5 h-3.5 text-[#087F70]" />
                  {['#164E63', '#DC2626', '#1D4ED8', '#15803D', '#111827'].map((col) => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setPenColor(col)}
                      className={`w-4 h-4 rounded-full border-2 cursor-pointer ${
                        penColor === col ? 'border-amber-400 scale-115' : 'border-white shadow-2xs'
                      }`}
                      style={{ backgroundColor: col }}
                      title="Chọn màu bút"
                    />
                  ))}
                  <select
                    value={penWidth}
                    onChange={(e) => setPenWidth(Number(e.target.value))}
                    className="rounded border border-slate-300 bg-white px-1.5 py-0.5 text-[12px]"
                  >
                    <option value={1.8}>Mảnh</option>
                    <option value={2.5}>Vừa</option>
                    <option value={4}>Đậm</option>
                  </select>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      const prev = answer?.drawingStrokes || [];
                      if (prev.length > 0) patchAnswer({ drawingStrokes: prev.slice(0, -1) });
                    }}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-slate-300 bg-white hover:bg-slate-50 text-[12px] cursor-pointer"
                  >
                    <Undo2 className="w-3 h-3" />
                    <span>Hoàn tác</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => patchAnswer({ drawingStrokes: [] })}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-slate-300 bg-white hover:bg-red-50 hover:text-red-600 text-[12px] cursor-pointer"
                  >
                    <Eraser className="w-3 h-3" />
                    <span>Xóa hết</span>
                  </button>
                </div>
              </div>
            )}
            <svg
              ref={drawingSvgRef}
              viewBox="0 0 1000 500"
              preserveAspectRatio="none"
              onPointerDown={handleDrawDown}
              onPointerMove={handleDrawMove}
              onPointerUp={handleDrawUp}
              onPointerCancel={handleDrawUp}
              className={`w-full flex-1 min-h-[120px] rounded-lg border border-slate-300 bg-white touch-none ${
                readOnly ? 'cursor-default' : 'cursor-crosshair'
              }`}
            >
              <defs>
                <pattern id={`grid-${question.id}`} width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#E2E8F0" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="1000" height="500" fill={`url(#grid-${question.id})`} />
              {[...(answer?.drawingStrokes || []), ...(liveStroke ? [liveStroke] : [])].map((st) => (
                <polyline
                  key={st.id}
                  fill="none"
                  stroke={st.color}
                  strokeWidth={st.width * 2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={st.points.map((p) => `${(p.x * 1000).toFixed(1)},${(p.y * 500).toFixed(1)}`).join(' ')}
                />
              ))}
            </svg>
          </div>
        )}

        {/* 13. Diagram / Map / Image Labeling */}
        {question.type === 'diagram_label' && (
          <div className="space-y-1.5">
            {(question.diagramPins || []).map((pin) => (
              <div key={pin.id} className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-[#164E63] text-white text-[12.5px] font-bold shrink-0">
                  {pin.code}
                </span>
                <input
                  type="text"
                  readOnly={readOnly}
                  value={answer?.diagramLabels?.[pin.id] || ''}
                  onChange={(e) =>
                    patchAnswer({
                      diagramLabels: { ...(answer?.diagramLabels || {}), [pin.id]: e.target.value },
                    })
                  }
                  placeholder={pin.hint || 'Nhập tên bộ phận / chú thích...'}
                  className="flex-1 rounded-md border border-slate-300 bg-white px-2.5 py-1 text-[13.5px] focus:border-[#087F70] outline-none"
                />
              </div>
            ))}
          </div>
        )}

        {/* 14. Practical Attachment */}
        {question.type === 'attachment' && (
          <div className="space-y-1.5">
            {!readOnly && (
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-[#087F70] bg-teal-50/50 hover:bg-teal-50 text-[#164E63] font-semibold text-[13.5px] cursor-pointer">
                <Paperclip className="w-4 h-4 text-[#087F70]" />
                <span>Chọn tệp sản phẩm đính kèm</span>
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    handleAddAttachments(e.target.files);
                    e.target.value = '';
                  }}
                />
              </label>
            )}
            {question.attachmentAcceptHint && (
              <div className="text-[12.5px] text-slate-500">{question.attachmentAcceptHint}</div>
            )}
            {attError && <div className="text-[12.5px] text-red-600 font-medium">{attError}</div>}
            <div className="space-y-1">
              {(answer?.attachments || []).map((att) => (
                <div
                  key={att.id}
                  className="flex items-center justify-between gap-2 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-[13px]"
                >
                  <span className="truncate font-medium text-slate-800">
                    {att.fileName} ({Math.max(1, Math.round(att.size / 1024))} KB)
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    {att.dataUrl && (
                      <a
                        href={att.dataUrl}
                        download={att.fileName}
                        className="p-1 rounded hover:bg-white text-[#087F70]"
                        title="Tải tệp đính kèm"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {!readOnly && (
                      <button
                        type="button"
                        onClick={() =>
                          patchAnswer({
                            attachments: (answer?.attachments || []).filter((a) => a.id !== att.id),
                          })
                        }
                        className="p-1 rounded hover:bg-red-50 text-slate-500 hover:text-red-600 cursor-pointer"
                        title="Gỡ tệp"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Author Resize Handle (bottom-right) */}
      {mode === 'author' && (
        <div
          onPointerDown={startResize}
          title="Kéo để đổi kích thước khung câu hỏi"
          className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize bg-[#087F70]/25 hover:bg-[#087F70]/60 rounded-tl-md"
        />
      )}
    </div>
  );
};
