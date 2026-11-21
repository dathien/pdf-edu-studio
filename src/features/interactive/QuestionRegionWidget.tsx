import React, { useMemo, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Download,
  Eraser,
  GripVertical,
  Paperclip,
  PenTool,
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
}

const FORMULA_QUICK_SNIPPETS = [
  { label: 'Phân số', latex: '\\frac{a}{b}' },
  { label: 'Căn bậc 2', latex: '\\sqrt{x}' },
  { label: 'Lũy thừa', latex: 'x^{2}' },
  { label: 'Tích phân', latex: '\\int_{a}^{b} f(x)\\,dx' },
  { label: 'Vector', latex: '\\vec{F}' },
  { label: 'Mũi tên', latex: '\\rightarrow' },
];

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
}) => {
  const readOnly = mode !== 'solve';
  const [penColor, setPenColor] = useState('#164E63');
  const [penWidth, setPenWidth] = useState(2.5);
  const [attError, setAttError] = useState<string | null>(null);
  const drawingSvgRef = useRef<SVGSVGElement>(null);
  const activeStrokeRef = useRef<DrawingStroke | null>(null);
  const [liveStroke, setLiveStroke] = useState<DrawingStroke | null>(null);

  const patchAnswer = (patch: Partial<StudentQuestionAnswer>) => {
    if (readOnly || !onChangeAnswer) return;
    onChangeAnswer({
      questionId: question.id,
      ...(answer || {}),
      ...patch,
      updatedAt: Date.now(),
    });
  };

  // ---- AUTHOR MODE: DRAG & RESIZE IN PDF-POINT COORDINATES ----
  const startMove = (e: React.PointerEvent) => {
    if (mode !== 'author' || !onUpdateRegion) return;
    e.stopPropagation();
    onSelect?.();
    const startClientX = e.clientX;
    const startClientY = e.clientY;
    const origX = question.region.x;
    const origY = question.region.y;

    const handleMove = (ev: PointerEvent) => {
      const dx = (ev.clientX - startClientX) / zoom;
      const dy = (ev.clientY - startClientY) / zoom;
      const nx = Math.max(8, Math.min(pageWidth - question.region.width - 8, Math.round(origX + dx)));
      const ny = Math.max(8, Math.min(pageHeight - question.region.height - 8, Math.round(origY + dy)));
      onUpdateRegion({ x: nx, y: ny });
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
    const origW = question.region.width;
    const origH = question.region.height;

    const handleMove = (ev: PointerEvent) => {
      const dw = (ev.clientX - startClientX) / zoom;
      const dh = (ev.clientY - startClientY) / zoom;
      const nw = Math.max(160, Math.min(pageWidth - question.region.x - 8, Math.round(origW + dw)));
      const nh = Math.max(64, Math.min(pageHeight - question.region.y - 8, Math.round(origH + dh)));
      onUpdateRegion({ width: nw, height: nh });
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

  // Keep inner content unscaled in logical PDF points and scale smoothly with CSS transform
  // OR render directly at zoomed size so text stays super crisp!
  // Rendering the box at exact PDF-point * zoom gives crystal-clear typography at every zoom level.
  const boxStyle: React.CSSProperties = {
    left: `${question.region.x * zoom}px`,
    top: `${question.region.y * zoom}px`,
    width: `${question.region.width * zoom}px`,
    minHeight: `${question.region.height * zoom}px`,
  };

  const borderClass =
    mode === 'author'
      ? selected
        ? 'border-2 border-[#087F70] ring-2 ring-[#087F70]/25 bg-white/96 shadow-md z-30'
        : 'border border-dashed border-[#164E63]/70 bg-white/92 hover:border-[#087F70] z-20'
      : mode === 'grade'
        ? selected
          ? 'border-2 border-[#DC2626] ring-2 ring-red-200 bg-white/97 shadow-md z-30'
          : 'border border-red-300 bg-white/94 z-20'
        : 'border border-[#087F70]/60 bg-white/96 shadow-xs z-20 focus-within:border-[#087F70] focus-within:ring-2 focus-within:ring-[#087F70]/20';

  return (
    <div
      style={boxStyle}
      onClick={(e) => {
        if (mode === 'author' || mode === 'grade') {
          e.stopPropagation();
          onSelect?.();
        }
      }}
      className={`absolute rounded-xl overflow-hidden flex flex-col transition-shadow ${borderClass}`}
    >
      {/* Top Bar */}
      <div
        onPointerDown={mode === 'author' ? startMove : undefined}
        className={`px-2.5 py-1 flex items-center justify-between gap-2 text-[13px] font-semibold border-b ${
          mode === 'author'
            ? 'bg-[#E6F1EF] text-[#164E63] border-teal-200 cursor-move select-none'
            : mode === 'grade'
              ? 'bg-red-50 text-[#991B1B] border-red-200 cursor-pointer'
              : 'bg-[#F4F8F7] text-[#164E63] border-slate-200'
        }`}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          {mode === 'author' && <GripVertical className="w-3.5 h-3.5 text-[#087F70] shrink-0" />}
          <span className="truncate">
            {question.code} · {QUESTION_TYPE_META[question.type].shortLabel}
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {mode === 'grade' && gradingDetail ? (
            <span className="px-2 py-0.5 rounded bg-white border border-red-300 text-[#DC2626] font-bold text-[12.5px]">
              {typeof gradingDetail.earnedPoints === 'number'
                ? `${gradingDetail.earnedPoints} / ${gradingDetail.maxPoints}đ`
                : `Chưa chấm / ${gradingDetail.maxPoints}đ`}
            </span>
          ) : (
            <span className="text-[12.5px] font-medium text-slate-600">
              {question.maxPoints}đ
            </span>
          )}
          {mode === 'author' && onDeleteQuestion && (
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onDeleteQuestion();
              }}
              className="p-0.5 rounded hover:bg-red-100 text-slate-500 hover:text-red-600 cursor-pointer"
              title="Xóa vùng câu hỏi"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Question Body (12 Distinct Interactive Types) */}
      <div className="p-2.5 flex-1 overflow-y-auto text-[14px] text-slate-800 space-y-2">
        {/* 1. MCQ */}
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

        {/* 2. True / False per item */}
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

        {/* 3. Short Answer */}
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

        {/* 4. Fill in the Blank */}
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

        {/* 5. Essay */}
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

        {/* 6. Matching (Line-Connecting OR Drag-and-Drop) */}
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

        {/* 7. Ordering */}
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

        {/* 8. Reading Comprehension */}
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

        {/* 9. Scientific Formula (LaTeX + Live SVG Vector Preview) */}
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
            <input
              type="text"
              readOnly={readOnly}
              value={answer?.formulaLatex || ''}
              onChange={(e) => patchAnswer({ formulaLatex: e.target.value })}
              placeholder={question.formulaPlaceholder || 'Nhập công thức LaTeX (ví dụ: \\frac{-b}{2a})'}
              className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-mono text-[13.5px] text-slate-900 focus:border-[#087F70] outline-none"
            />
            <div className="min-h-[38px] rounded-lg border border-slate-200 bg-[#F8FBFA] px-3 py-1.5 flex items-center">
              {formulaPreviewSvg ? (
                <div
                  className="[&>svg]:max-h-9 [&>svg]:w-auto"
                  dangerouslySetInnerHTML={{ __html: formulaPreviewSvg }}
                />
              ) : (
                <span className="text-[13px] text-slate-400">
                  Xem trước công thức khoa học vector sẽ hiển thị tại đây.
                </span>
              )}
            </div>
          </div>
        )}

        {/* 10. Freehand Drawing / Handwriting (Zoom-Invariant Normalized SVG) */}
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
              {/* Subtle grid lines */}
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

        {/* 11. Diagram / Map / Image Labeling */}
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

        {/* 12. Practical Attachment */}
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
