import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Check,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import {
  QUESTION_TYPE_META,
  type InteractiveQuestion,
  type InteractiveQuestionType,
  type MatchingPair,
  type TeacherQuestionKey,
} from '../../types/interactive';

interface TeacherQuestionInspectorProps {
  question: InteractiveQuestion;
  answerKey: TeacherQuestionKey | undefined;
  examMode: 'exam' | 'practice';
  onUpdateQuestion: (patch: Partial<InteractiveQuestion>) => void;
  onChangeQuestionType: (nextType: InteractiveQuestionType) => void;
  onUpdateKey: (nextKey: TeacherQuestionKey) => void;
  onDeleteQuestion: () => void;
  onSaveAndClose?: () => void;
  onCancel?: () => void;
}

const ALL_TYPES = Object.keys(QUESTION_TYPE_META) as InteractiveQuestionType[];
const QUICK_POINT_PRESETS = [0.5, 1, 2, 3];

export const TeacherQuestionInspector: React.FC<TeacherQuestionInspectorProps> = ({
  question,
  answerKey,
  examMode,
  onUpdateQuestion,
  onChangeQuestionType,
  onUpdateKey,
  onDeleteQuestion,
  onSaveAndClose,
  onCancel,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const key: TeacherQuestionKey = answerKey || { questionId: question.id };

  const patchKey = (patch: Partial<TeacherQuestionKey>) => {
    onUpdateKey({
      ...key,
      questionId: question.id,
      ...patch,
    });
  };

  // Gentle position/size nudges without exposing pixel coordinates to teachers
  const nudgeRegion = (dx: number, dy: number, dw: number, dh: number) => {
    const r = question.region;
    const estPageW = r.nx && r.nx > 0 ? r.x / r.nx : 595;
    const estPageH = r.ny && r.ny > 0 ? r.y / r.ny : 842;
    const nextW = Math.max(160, Math.min(Math.round(estPageW - 24), Math.round(r.width + dw)));
    const nextH = Math.max(68, Math.min(Math.round(estPageH - 40), Math.round(r.height + dh)));
    const nextX = Math.max(10, Math.min(Math.round(estPageW - nextW - 10), Math.round(r.x + dx)));
    const nextY = Math.max(10, Math.min(Math.round(estPageH - nextH - 10), Math.round(r.y + dy)));
    onUpdateQuestion({
      region: {
        ...r,
        x: nextX,
        y: nextY,
        width: nextW,
        height: nextH,
        nx: Number((nextX / estPageW).toFixed(4)),
        ny: Number((nextY / estPageH).toFixed(4)),
        nw: Number((nextW / estPageW).toFixed(4)),
        nh: Number((nextH / estPageH).toFixed(4)),
      },
    });
  };

  const handleSave = () => {
    onUpdateQuestion({
      teacherApproved: true,
      needsReview: false,
    });
    onSaveAndClose?.();
  };

  return (
    <div className="flex flex-col h-full bg-white text-[16px] text-slate-900">
      {/* Top Bar: Back + Question Name */}
      <div className="p-4 border-b border-slate-200 bg-[#F4F8F7] space-y-2.5 shrink-0">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-2 text-[16px] font-bold text-[#164E63] hover:text-[#087F70] min-h-[36px] cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Quay lại danh sách câu hỏi</span>
          </button>
        )}
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-[14.5px] font-semibold text-[#087F70]">
              Trang {question.sourcePdfPageNumber || question.region.pageIndex + 1}
              {question.printedPageLabel &&
              question.printedPageLabel !==
                String(question.sourcePdfPageNumber || question.region.pageIndex + 1)
                ? ` (Trang in ${question.printedPageLabel})`
                : ''}
            </div>
            <h3 className="text-[20px] font-bold text-[#164E63] leading-snug">
              Sửa {question.code}
            </h3>
          </div>
          {question.teacherApproved ? (
            <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900 text-[14px] font-bold">
              Đã kiểm tra
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-950 text-[14px] font-bold">
              Cần kiểm tra
            </span>
          )}
        </div>
      </div>

      {/* Main Scrollable Form */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {question.detectionNote && (
          <div className="rounded-xl bg-amber-50 border border-amber-300 px-3.5 py-3 text-[15.5px] text-amber-950 flex items-start gap-2.5 leading-relaxed">
            <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <span>{question.detectionNote}</span>
          </div>
        )}

        {/* 1. Loại câu hỏi */}
        <label className="block space-y-1.5">
          <span className="block text-[16px] font-bold text-[#164E63]">1. Loại câu hỏi</span>
          <select
            value={question.type}
            onChange={(e) => onChangeQuestionType(e.target.value as InteractiveQuestionType)}
            className="w-full min-h-[46px] rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-[16px] font-semibold text-[#164E63] focus:border-[#087F70] outline-none"
          >
            {ALL_TYPES.map((t) => (
              <option key={t} value={t}>
                {QUESTION_TYPE_META[t].label}
              </option>
            ))}
          </select>
        </label>

        {/* 2. Đáp án đúng */}
        <div className="space-y-3 pt-1">
          <div className="text-[16px] font-bold text-[#164E63]">2. Đáp án đúng</div>
          <p className="text-[14.5px] text-slate-600 -mt-1.5">
            Đáp án chỉ lưu cho giáo viên chấm bài, không hiển thị cho học sinh.
          </p>

          {/* 1. MCQ Single */}
          {question.type === 'mcq' && (
            <div className="space-y-2.5">
              {(question.mcqOptions || []).map((opt, idx) => {
                const isSelected = key.mcqCorrectId === opt.id;
                return (
                  <div
                    key={opt.id}
                    className={`flex items-center gap-2.5 rounded-xl border p-2.5 ${
                      isSelected
                        ? 'border-[#087F70] bg-teal-50/70'
                        : 'border-slate-200 bg-slate-50/60'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`mcq-key-${question.id}`}
                      checked={isSelected}
                      onChange={() => patchKey({ mcqCorrectId: opt.id })}
                      className="accent-[#087F70] w-5 h-5 cursor-pointer shrink-0"
                      title={`Chọn ${opt.label} làm đáp án đúng`}
                    />
                    <span className="font-bold text-[#164E63] text-[16px] w-6 shrink-0">
                      {opt.label}.
                    </span>
                    <input
                      type="text"
                      value={opt.text}
                      onChange={(e) => {
                        const next = [...(question.mcqOptions || [])];
                        next[idx] = { ...opt, text: e.target.value };
                        onUpdateQuestion({ mcqOptions: next });
                      }}
                      className="flex-1 min-h-[40px] rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[16px]"
                      placeholder={`Nội dung đáp án ${opt.label}`}
                    />
                  </div>
                );
              })}
            </div>
          )}

          {/* 2. MCQ Multi */}
          {question.type === 'mcq_multi' && (
            <div className="space-y-2.5">
              {(question.mcqOptions || []).map((opt, idx) => {
                const checked = (key.mcqMultiCorrectIds || []).includes(opt.id);
                return (
                  <div
                    key={opt.id}
                    className={`flex items-center gap-2.5 rounded-xl border p-2.5 ${
                      checked
                        ? 'border-[#087F70] bg-teal-50/70'
                        : 'border-slate-200 bg-slate-50/60'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        const prev = key.mcqMultiCorrectIds || [];
                        const next = e.target.checked
                          ? [...prev, opt.id]
                          : prev.filter((id) => id !== opt.id);
                        patchKey({ mcqMultiCorrectIds: next });
                      }}
                      className="accent-[#087F70] w-5 h-5 cursor-pointer shrink-0"
                    />
                    <span className="font-bold text-[#164E63] text-[16px] w-6 shrink-0">
                      {opt.label}.
                    </span>
                    <input
                      type="text"
                      value={opt.text}
                      onChange={(e) => {
                        const next = [...(question.mcqOptions || [])];
                        next[idx] = { ...opt, text: e.target.value };
                        onUpdateQuestion({ mcqOptions: next });
                      }}
                      className="flex-1 min-h-[40px] rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[16px]"
                    />
                  </div>
                );
              })}
            </div>
          )}

          {/* 3. True / False */}
          {question.type === 'tf' && (
            <div className="space-y-2.5">
              {(question.tfStatements || []).map((st, idx) => {
                const curKey = key.tfCorrectMap?.[st.id];
                return (
                  <div
                    key={st.id}
                    className="space-y-2 rounded-xl bg-slate-50 border border-slate-200 p-3"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="font-bold text-[#164E63] text-[16px]">{st.label}</span>
                      <div className="flex items-center gap-2">
                        {(['T', 'F'] as const).map((v) => (
                          <button
                            key={v}
                            type="button"
                            onClick={() =>
                              patchKey({
                                tfCorrectMap: { ...(key.tfCorrectMap || {}), [st.id]: v },
                              })
                            }
                            className={`px-3.5 min-h-[40px] rounded-lg text-[15.5px] font-bold border cursor-pointer ${
                              curKey === v
                                ? 'bg-[#087F70] border-[#087F70] text-white'
                                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {v === 'T' ? 'Đúng' : 'Sai'}
                          </button>
                        ))}
                      </div>
                    </div>
                    <input
                      type="text"
                      value={st.text}
                      onChange={(e) => {
                        const next = [...(question.tfStatements || [])];
                        next[idx] = { ...st, text: e.target.value };
                        onUpdateQuestion({ tfStatements: next });
                      }}
                      className="w-full min-h-[42px] rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[16px]"
                    />
                  </div>
                );
              })}
            </div>
          )}

          {/* 4. SHORT */}
          {question.type === 'short' && (
            <div className="space-y-2.5">
              <label className="block space-y-1">
                <span className="text-[15.5px] font-semibold text-slate-800">
                  Các câu trả lời đúng (cách nhau bằng dấu ;)
                </span>
                <input
                  type="text"
                  value={(key.shortAccepted || []).join('; ')}
                  onChange={(e) =>
                    patchKey({
                      shortAccepted: e.target.value
                        .split(';')
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder="Ví dụ: 2; 2.0; 2,0"
                  className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3 py-2 text-[16px]"
                />
              </label>
            </div>
          )}

          {/* 5. NUMBER */}
          {question.type === 'number' && (
            <div className="space-y-2.5">
              <label className="block space-y-1">
                <span className="text-[15.5px] font-semibold text-slate-800">Đáp số đúng</span>
                <input
                  type="number"
                  step="any"
                  value={typeof key.numberTarget === 'number' ? key.numberTarget : ''}
                  onChange={(e) =>
                    patchKey({
                      numberTarget: e.target.value === '' ? undefined : Number(e.target.value),
                    })
                  }
                  placeholder="Ví dụ: 12.5"
                  className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3 py-2 text-[16px]"
                />
              </label>
            </div>
          )}

          {/* 6. FILL BLANK */}
          {question.type === 'fill_blank' && (
            <div className="space-y-2.5">
              {(question.fillBlanks || []).map((slot, idx) => (
                <div
                  key={slot.id}
                  className="rounded-xl bg-slate-50 border border-slate-200 p-3 space-y-2"
                >
                  <div className="text-[15px] font-bold text-[#164E63]">Ô trống số {idx + 1}</div>
                  <input
                    type="text"
                    value={(key.fillBlankAccepted?.[slot.id] || []).join('; ')}
                    onChange={(e) =>
                      patchKey({
                        fillBlankAccepted: {
                          ...(key.fillBlankAccepted || {}),
                          [slot.id]: e.target.value
                            .split(';')
                            .map((s) => s.trim())
                            .filter(Boolean),
                        },
                      })
                    }
                    placeholder="Nhập đáp án đúng (cách nhau bằng dấu ;)"
                    className="w-full min-h-[42px] rounded-lg border border-teal-400 bg-white px-3 py-1.5 text-[16px]"
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  const newId = `b-${Date.now().toString(36)}`;
                  onUpdateQuestion({
                    fillBlanks: [
                      ...(question.fillBlanks || []),
                      { id: newId, prefix: 'Điền vào:', suffix: '', placeholder: '...' },
                    ],
                  });
                }}
                className="inline-flex items-center gap-1.5 px-3.5 min-h-[44px] rounded-xl border border-slate-300 bg-white hover:bg-teal-50 text-[15.5px] font-semibold text-[#164E63] cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm chỗ trống</span>
              </button>
            </div>
          )}

          {/* 7. MATCHING */}
          {question.type === 'matching' && question.matching && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    onUpdateQuestion({ matching: { ...question.matching!, mode: 'line' } })
                  }
                  className={`px-3 min-h-[44px] rounded-xl border text-[15.5px] font-bold cursor-pointer ${
                    question.matching.mode === 'line'
                      ? 'bg-[#087F70] border-[#087F70] text-white'
                      : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  Vẽ đường nối
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateQuestion({ matching: { ...question.matching!, mode: 'drag' } })
                  }
                  className={`px-3 min-h-[44px] rounded-xl border text-[15.5px] font-bold cursor-pointer ${
                    question.matching.mode === 'drag'
                      ? 'bg-[#087F70] border-[#087F70] text-white'
                      : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  Kéo thả ghép đôi
                </button>
              </div>

              {question.matching.itemsA.map((itemA, idx) => {
                const currentPair = (key.matchingCorrectPairs || []).find(
                  (p) => p.fromId === itemA.id
                );
                return (
                  <div
                    key={itemA.id}
                    className="rounded-xl bg-slate-50 border border-slate-200 p-3 space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#087F70] text-[16px]">{idx + 1}.</span>
                      <input
                        type="text"
                        value={itemA.label}
                        onChange={(e) => {
                          const nextA = [...question.matching!.itemsA];
                          nextA[idx] = { ...itemA, label: e.target.value };
                          onUpdateQuestion({ matching: { ...question.matching!, itemsA: nextA } });
                        }}
                        className="flex-1 min-h-[40px] rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[15.5px]"
                        placeholder="Nội dung cột A"
                      />
                    </div>
                    <select
                      value={currentPair?.toId || ''}
                      onChange={(e) => {
                        const toId = e.target.value;
                        const filtered: MatchingPair[] = (key.matchingCorrectPairs || []).filter(
                          (p) => p.fromId !== itemA.id
                        );
                        if (toId) filtered.push({ fromId: itemA.id, toId });
                        patchKey({ matchingCorrectPairs: filtered });
                      }}
                      className="w-full min-h-[42px] rounded-lg border border-teal-400 bg-white px-3 py-1.5 text-[15.5px]"
                    >
                      <option value="">-- Chọn đáp án nối ở Cột B --</option>
                      {question.matching!.itemsB.map((b, bIdx) => (
                        <option key={b.id} value={b.id}>
                          {String.fromCharCode(65 + bIdx)}. {b.label}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })}

              <button
                type="button"
                onClick={() => {
                  const n = question.matching!.itemsA.length + 1;
                  const aId = `ma-${Date.now().toString(36)}-${n}`;
                  const bId = `mb-${Date.now().toString(36)}-${n}`;
                  onUpdateQuestion({
                    matching: {
                      ...question.matching!,
                      itemsA: [...question.matching!.itemsA, { id: aId, label: `Mục A${n}` }],
                      itemsB: [...question.matching!.itemsB, { id: bId, label: `Mục B${n}` }],
                    },
                  });
                  patchKey({
                    matchingCorrectPairs: [
                      ...(key.matchingCorrectPairs || []),
                      { fromId: aId, toId: bId },
                    ],
                  });
                }}
                className="inline-flex items-center gap-1.5 px-3.5 min-h-[44px] rounded-xl border border-slate-300 bg-white hover:bg-teal-50 text-[15.5px] font-semibold text-[#164E63] cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm cặp ghép đôi</span>
              </button>

              <div className="space-y-2 pt-1">
                <div className="font-bold text-[#164E63] text-[15.5px]">Nội dung Cột B</div>
                {question.matching.itemsB.map((itemB, idx) => (
                  <div key={itemB.id} className="flex items-center gap-2">
                    <span className="font-bold text-[#164E63] w-6">
                      {String.fromCharCode(65 + idx)}.
                    </span>
                    <input
                      type="text"
                      value={itemB.label}
                      onChange={(e) => {
                        const nextB = [...question.matching!.itemsB];
                        nextB[idx] = { ...itemB, label: e.target.value };
                        onUpdateQuestion({ matching: { ...question.matching!, itemsB: nextB } });
                      }}
                      className="flex-1 min-h-[40px] rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[15.5px]"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 8. ORDERING */}
          {question.type === 'ordering' && (
            <div className="space-y-2.5">
              {(question.orderingItems || []).map((item, idx) => (
                <div key={item.id} className="flex items-center gap-2">
                  <span className="text-[15.5px] font-bold text-[#164E63] w-7">#{idx + 1}</span>
                  <input
                    type="text"
                    value={item.text}
                    onChange={(e) => {
                      const next = [...(question.orderingItems || [])];
                      next[idx] = { ...item, text: e.target.value };
                      onUpdateQuestion({ orderingItems: next });
                    }}
                    className="flex-1 min-h-[42px] rounded-lg border border-slate-300 px-3 py-1.5 text-[16px]"
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  patchKey({
                    orderingCorrectIds: (question.orderingItems || []).map((i) => i.id),
                  })
                }
                className="w-full min-h-[44px] px-3.5 rounded-xl border border-[#087F70] text-[#087F70] bg-teal-50 hover:bg-teal-100 text-[15.5px] font-bold cursor-pointer"
              >
                Đặt thứ tự trên làm đáp án đúng
              </button>
            </div>
          )}

          {/* MANUAL / RUBRIC NOTE */}
          {(question.type === 'essay' ||
            question.type === 'formula' ||
            question.type === 'drawing' ||
            question.type === 'diagram_label' ||
            question.type === 'reading' ||
            question.type === 'attachment') && (
            <div className="space-y-2.5">
              <div className="rounded-xl bg-[#F4F8F7] border border-teal-200 px-3.5 py-2.5 text-[15px] text-[#164E63] leading-relaxed">
                Dạng câu hỏi này do <strong>thầy cô chấm trực tiếp</strong> sau khi học sinh nộp bài.
              </div>
              <label className="block space-y-1.5">
                <span className="text-[15.5px] font-semibold text-slate-800">
                  Gợi ý đáp án để thầy cô chấm nhanh (không bắt buộc)
                </span>
                <textarea
                  rows={3}
                  value={key.referenceNote || ''}
                  onChange={(e) => patchKey({ referenceNote: e.target.value })}
                  placeholder="Nhập ý chính hoặc biểu điểm..."
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-[16px]"
                />
              </label>
            </div>
          )}
        </div>

        {/* 3. Điểm */}
        <div className="space-y-2 pt-3 border-t border-slate-200">
          <label className="block text-[16px] font-bold text-[#164E63]">3. Điểm của câu này</label>
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="number"
              min={0.25}
              step={0.25}
              value={question.maxPoints}
              onChange={(e) =>
                onUpdateQuestion({ maxPoints: Math.max(0.25, Number(e.target.value) || 1) })
              }
              className="w-28 min-h-[44px] rounded-xl border border-slate-300 px-3 py-2 text-[17px] font-bold text-[#164E63]"
            />
            <span className="text-[16px] text-slate-700 font-medium">điểm</span>
            <div className="flex items-center gap-1.5 ml-auto">
              {QUICK_POINT_PRESETS.map((pt) => (
                <button
                  key={pt}
                  type="button"
                  onClick={() => onUpdateQuestion({ maxPoints: pt })}
                  className={`px-2.5 min-h-[38px] rounded-lg border text-[14.5px] font-bold cursor-pointer ${
                    question.maxPoints === pt
                      ? 'bg-[#164E63] border-[#164E63] text-white'
                      : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {pt}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 4. Vị trí trả lời (không cần nhập tọa độ!) */}
        <div className="space-y-2.5 pt-3 border-t border-slate-200">
          <div className="text-[16px] font-bold text-[#164E63]">4. Vị trí chỗ trả lời trên PDF</div>
          <p className="text-[14.5px] text-slate-600 -mt-1">
            Thầy cô có thể kéo trực tiếp khung trên trang PDF, hoặc nhấn các nút dưới đây để dịch chuyển nhẹ:
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => nudgeRegion(0, -18, 0, 0)}
              className="inline-flex items-center justify-center gap-1.5 min-h-[44px] rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-[15.5px] font-semibold text-slate-800 cursor-pointer"
            >
              <ArrowUp className="w-4 h-4 text-[#087F70]" />
              <span>Dịch lên</span>
            </button>
            <button
              type="button"
              onClick={() => nudgeRegion(0, 18, 0, 0)}
              className="inline-flex items-center justify-center gap-1.5 min-h-[44px] rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-[15.5px] font-semibold text-slate-800 cursor-pointer"
            >
              <ArrowDown className="w-4 h-4 text-[#087F70]" />
              <span>Dịch xuống</span>
            </button>
            <button
              type="button"
              onClick={() => nudgeRegion(-18, 0, 0, 0)}
              className="inline-flex items-center justify-center gap-1.5 min-h-[44px] rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-[15.5px] font-semibold text-slate-800 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-[#087F70]" />
              <span>Sang trái</span>
            </button>
            <button
              type="button"
              onClick={() => nudgeRegion(18, 0, 0, 0)}
              className="inline-flex items-center justify-center gap-1.5 min-h-[44px] rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-[15.5px] font-semibold text-slate-800 cursor-pointer"
            >
              <ArrowRight className="w-4 h-4 text-[#087F70]" />
              <span>Sang phải</span>
            </button>
            <button
              type="button"
              onClick={() => nudgeRegion(0, 0, 28, 20)}
              className="inline-flex items-center justify-center gap-1.5 min-h-[44px] rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-[15.5px] font-semibold text-slate-800 cursor-pointer"
            >
              <Maximize2 className="w-4 h-4 text-[#087F70]" />
              <span>Khung lớn hơn</span>
            </button>
            <button
              type="button"
              onClick={() => nudgeRegion(0, 0, -28, -20)}
              className="inline-flex items-center justify-center gap-1.5 min-h-[44px] rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-[15.5px] font-semibold text-slate-800 cursor-pointer"
            >
              <Minimize2 className="w-4 h-4 text-[#087F70]" />
              <span>Khung nhỏ hơn</span>
            </button>
          </div>
        </div>

        {/* Collapsible Advanced Options (kept completely out of the way by default) */}
        <div className="pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className="w-full flex items-center justify-between min-h-[44px] px-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[15.5px] font-bold text-[#164E63] cursor-pointer"
          >
            <span>Tùy chọn nâng cao</span>
            {showAdvanced ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>

          {showAdvanced && (
            <div className="mt-3 space-y-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
              <label className="block space-y-1">
                <span className="text-[15px] font-semibold text-slate-700">Tên câu (ví dụ: Câu 1)</span>
                <input
                  type="text"
                  value={question.code}
                  onChange={(e) => onUpdateQuestion({ code: e.target.value })}
                  className="w-full min-h-[42px] rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[15.5px]"
                />
              </label>

              <label className="block space-y-1">
                <span className="text-[15px] font-semibold text-slate-700">Tiêu đề ngắn</span>
                <input
                  type="text"
                  value={question.title}
                  onChange={(e) => onUpdateQuestion({ title: e.target.value })}
                  className="w-full min-h-[42px] rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[15.5px]"
                />
              </label>

              <label className="block space-y-1">
                <span className="text-[15px] font-semibold text-slate-700">Hướng dẫn hiển thị cho học sinh</span>
                <textarea
                  rows={2}
                  value={question.prompt}
                  onChange={(e) => onUpdateQuestion({ prompt: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[15.5px]"
                />
              </label>

              {question.type === 'mcq_multi' && (
                <label className="block space-y-1">
                  <span className="text-[15px] font-semibold text-slate-700">Cách tính điểm nhiều đáp án</span>
                  <select
                    value={key.mcqMultiScoring || 'exact'}
                    onChange={(e) =>
                      patchKey({ mcqMultiScoring: e.target.value as 'exact' | 'partial' })
                    }
                    className="w-full min-h-[42px] rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[15.5px]"
                  >
                    <option value="exact">Đúng đủ tất cả mới tính trọn điểm</option>
                    <option value="partial">Tính điểm từng phần</option>
                  </select>
                </label>
              )}

              {question.type === 'tf' && (
                <label className="block space-y-1">
                  <span className="text-[15px] font-semibold text-slate-700">Cách tính điểm Đúng / Sai</span>
                  <select
                    value={key.tfScoringMode || 'equal'}
                    onChange={(e) =>
                      patchKey({ tfScoringMode: e.target.value as 'thpt_4' | 'equal' | 'custom' })
                    }
                    className="w-full min-h-[42px] rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[15.5px]"
                  >
                    <option value="equal">Chia đều điểm cho từng ý</option>
                    <option value="thpt_4">Thang điểm THPT 4 ý (10% / 25% / 50% / 100%)</option>
                    <option value="custom">Tự nhập điểm riêng từng ý</option>
                  </select>
                </label>
              )}

              {question.type === 'short' && (
                <label className="block space-y-1">
                  <span className="text-[15px] font-semibold text-slate-700">Đơn vị (không bắt buộc)</span>
                  <input
                    type="text"
                    value={question.shortUnit || ''}
                    onChange={(e) => onUpdateQuestion({ shortUnit: e.target.value })}
                    placeholder="Ví dụ: m/s², %, cm..."
                    className="w-full min-h-[42px] rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[15.5px]"
                  />
                </label>
              )}

              {question.type === 'number' && (
                <div className="grid grid-cols-2 gap-2.5">
                  <label className="space-y-1">
                    <span className="text-[15px] font-semibold text-slate-700">Sai số (±)</span>
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={key.numberTolerance ?? 0.01}
                      onChange={(e) =>
                        patchKey({ numberTolerance: Math.max(0, Number(e.target.value) || 0) })
                      }
                      className="w-full min-h-[42px] rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[15.5px]"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-[15px] font-semibold text-slate-700">Đơn vị</span>
                    <input
                      type="text"
                      value={question.numberUnit || ''}
                      onChange={(e) => onUpdateQuestion({ numberUnit: e.target.value })}
                      placeholder="cm², %..."
                      className="w-full min-h-[42px] rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[15.5px]"
                    />
                  </label>
                </div>
              )}

              {question.type === 'matching' && question.matching && (
                <div className="space-y-2 text-[15.5px]">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={question.matching.allowManyToOne}
                      onChange={(e) =>
                        onUpdateQuestion({
                          matching: { ...question.matching!, allowManyToOne: e.target.checked },
                        })
                      }
                      className="accent-[#087F70] w-5 h-5"
                    />
                    <span>Cho phép nối nhiều mục vào 1 đáp án</span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={question.matching.shuffleB}
                      onChange={(e) =>
                        onUpdateQuestion({
                          matching: { ...question.matching!, shuffleB: e.target.checked },
                        })
                      }
                      className="accent-[#087F70] w-5 h-5"
                    />
                    <span>Trộn thứ tự Cột B khi học sinh làm bài</span>
                  </label>
                  {examMode === 'practice' && (
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={question.matching.practiceFeedback}
                        onChange={(e) =>
                          onUpdateQuestion({
                            matching: {
                              ...question.matching!,
                              practiceFeedback: e.target.checked,
                            },
                          })
                        }
                        className="accent-[#087F70] w-5 h-5"
                      />
                      <span>Báo đúng/sai ngay khi học sinh luyện tập</span>
                    </label>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Delete with confirmation guard */}
        <div className="pt-3 border-t border-slate-200">
          {!confirmDelete ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="w-full inline-flex items-center justify-center gap-2 min-h-[44px] rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-[15.5px] cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Xóa câu hỏi này</span>
            </button>
          ) : (
            <div className="rounded-xl bg-red-50 border-2 border-red-300 p-3.5 space-y-2.5">
              <div className="text-[15.5px] font-bold text-red-900">
                Thầy cô có chắc muốn xóa {question.code} không?
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={onDeleteQuestion}
                  className="min-h-[44px] rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-[15.5px] cursor-pointer"
                >
                  Đúng, xóa câu này
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="min-h-[44px] rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-bold text-[15.5px] cursor-pointer"
                >
                  Giữ lại
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sticky Footer: Lưu & Hủy */}
      <div className="p-4 border-t border-slate-200 bg-[#F4F8F7] grid grid-cols-2 gap-2.5 shrink-0">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center justify-center gap-1.5 min-h-[48px] rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-bold text-[16px] cursor-pointer"
          >
            <X className="w-5 h-5" />
            <span>Hủy</span>
          </button>
        )}
        <button
          type="button"
          onClick={handleSave}
          className={`${
            onCancel ? '' : 'col-span-2'
          } inline-flex items-center justify-center gap-1.5 min-h-[48px] rounded-xl bg-[#087F70] hover:bg-[#06695d] text-white font-bold text-[16px] cursor-pointer shadow-2xs`}
        >
          <Check className="w-5 h-5" />
          <span>Lưu</span>
        </button>
      </div>
    </div>
  );
};
