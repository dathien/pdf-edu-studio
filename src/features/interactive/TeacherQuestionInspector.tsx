import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import {
  QUESTION_TYPE_META,
  type InteractiveQuestion,
  type MatchingPair,
  type TeacherQuestionKey,
} from '../../types/interactive';

interface TeacherQuestionInspectorProps {
  question: InteractiveQuestion;
  answerKey: TeacherQuestionKey | undefined;
  examMode: 'exam' | 'practice';
  onUpdateQuestion: (patch: Partial<InteractiveQuestion>) => void;
  onUpdateKey: (nextKey: TeacherQuestionKey) => void;
  onDeleteQuestion: () => void;
}

export const TeacherQuestionInspector: React.FC<TeacherQuestionInspectorProps> = ({
  question,
  answerKey,
  examMode,
  onUpdateQuestion,
  onUpdateKey,
  onDeleteQuestion,
}) => {
  const key: TeacherQuestionKey = answerKey || { questionId: question.id };

  const patchKey = (patch: Partial<TeacherQuestionKey>) => {
    onUpdateKey({
      ...key,
      questionId: question.id,
      ...patch,
    });
  };

  return (
    <div className="p-4 space-y-4 text-[14.5px]">
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200">
        <div>
          <div className="text-[13px] font-semibold text-[#087F70]">
            {QUESTION_TYPE_META[question.type].label}
          </div>
          <div className="text-[16px] font-bold text-[#164E63]">{question.code}</div>
        </div>
        <button
          type="button"
          onClick={onDeleteQuestion}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 font-semibold text-[13.5px] cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
          <span>Xóa câu</span>
        </button>
      </div>

      {/* Common metadata */}
      <div className="grid grid-cols-2 gap-2.5">
        <label className="space-y-1">
          <span className="block text-[13.5px] font-semibold text-slate-700">Mã câu</span>
          <input
            type="text"
            value={question.code}
            onChange={(e) => onUpdateQuestion({ code: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-[14px]"
          />
        </label>
        <label className="space-y-1">
          <span className="block text-[13.5px] font-semibold text-slate-700">Điểm tối đa</span>
          <input
            type="number"
            min={0.25}
            step={0.25}
            value={question.maxPoints}
            onChange={(e) => onUpdateQuestion({ maxPoints: Math.max(0.25, Number(e.target.value) || 1) })}
            className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-[14px]"
          />
        </label>
      </div>

      <label className="block space-y-1">
        <span className="block text-[13.5px] font-semibold text-slate-700">Tiêu đề câu hỏi</span>
        <input
          type="text"
          value={question.title}
          onChange={(e) => onUpdateQuestion({ title: e.target.value })}
          className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-[14px]"
        />
      </label>

      <label className="block space-y-1">
        <span className="block text-[13.5px] font-semibold text-slate-700">Yêu cầu / Đề bài ngắn</span>
        <textarea
          rows={2}
          value={question.prompt}
          onChange={(e) => onUpdateQuestion({ prompt: e.target.value })}
          className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-[14px]"
        />
      </label>

      {/* TYPE-SPECIFIC CONFIG & TEACHER ANSWER KEY */}
      <div className="pt-2 border-t border-slate-200 space-y-3">
        <div className="text-[14px] font-bold text-[#164E63]">
          Cấu hình & Đáp án giáo viên (tách riêng khỏi tệp HS)
        </div>

        {/* MCQ */}
        {question.type === 'mcq' && (
          <div className="space-y-2">
            {(question.mcqOptions || []).map((opt, idx) => (
              <div key={opt.id} className="flex items-center gap-1.5">
                <input
                  type="radio"
                  name={`mcq-key-${question.id}`}
                  checked={key.mcqCorrectId === opt.id}
                  onChange={() => patchKey({ mcqCorrectId: opt.id })}
                  className="accent-[#087F70] w-4 h-4 cursor-pointer"
                  title="Chọn làm đáp án đúng"
                />
                <span className="font-bold text-[#164E63] w-5">{opt.label}.</span>
                <input
                  type="text"
                  value={opt.text}
                  onChange={(e) => {
                    const next = [...(question.mcqOptions || [])];
                    next[idx] = { ...opt, text: e.target.value };
                    onUpdateQuestion({ mcqOptions: next });
                  }}
                  className="flex-1 rounded-md border border-slate-300 px-2 py-1 text-[13.5px]"
                />
              </div>
            ))}
          </div>
        )}

        {/* TF */}
        {question.type === 'tf' && (
          <div className="space-y-2">
            {(question.tfStatements || []).map((st, idx) => {
              const curKey = key.tfCorrectMap?.[st.id] || 'T';
              return (
                <div key={st.id} className="space-y-1 rounded-lg bg-slate-50 border border-slate-200 p-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-[#164E63]">{st.label}</span>
                    <div className="flex items-center gap-1">
                      {(['T', 'F'] as const).map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() =>
                            patchKey({
                              tfCorrectMap: { ...(key.tfCorrectMap || {}), [st.id]: v },
                            })
                          }
                          className={`px-2 py-0.5 rounded text-[12.5px] font-bold border cursor-pointer ${
                            curKey === v
                              ? 'bg-[#087F70] border-[#087F70] text-white'
                              : 'bg-white border-slate-300 text-slate-700'
                          }`}
                        >
                          Đáp án: {v === 'T' ? 'Đúng' : 'Sai'}
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
                    className="w-full rounded border border-slate-300 bg-white px-2 py-1 text-[13.5px]"
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* SHORT */}
        {question.type === 'short' && (
          <div className="space-y-2">
            <label className="block space-y-1">
              <span className="text-[13.5px] font-medium text-slate-700">Đơn vị (tùy chọn)</span>
              <input
                type="text"
                value={question.shortUnit || ''}
                onChange={(e) => onUpdateQuestion({ shortUnit: e.target.value })}
                placeholder="Ví dụ: m/s², %, mol..."
                className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-[13.5px]"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-[13.5px] font-medium text-slate-700">
                Các đáp án chấp nhận (phân cách bằng dấu chấm phẩy ;)
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
                className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-[13.5px]"
              />
            </label>
          </div>
        )}

        {/* FILL BLANK */}
        {question.type === 'fill_blank' && (
          <div className="space-y-2">
            {(question.fillBlanks || []).map((slot, idx) => (
              <div key={slot.id} className="rounded-lg bg-slate-50 border border-slate-200 p-2 space-y-1.5">
                <div className="grid grid-cols-2 gap-1.5">
                  <input
                    type="text"
                    value={slot.prefix}
                    onChange={(e) => {
                      const next = [...(question.fillBlanks || [])];
                      next[idx] = { ...slot, prefix: e.target.value };
                      onUpdateQuestion({ fillBlanks: next });
                    }}
                    placeholder="Chữ trước ô trống"
                    className="rounded border border-slate-300 bg-white px-2 py-1 text-[13px]"
                  />
                  <input
                    type="text"
                    value={slot.suffix}
                    onChange={(e) => {
                      const next = [...(question.fillBlanks || [])];
                      next[idx] = { ...slot, suffix: e.target.value };
                      onUpdateQuestion({ fillBlanks: next });
                    }}
                    placeholder="Chữ sau ô trống"
                    className="rounded border border-slate-300 bg-white px-2 py-1 text-[13px]"
                  />
                </div>
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
                  placeholder="Đáp án đúng cho ô này (cách nhau bởi ;)"
                  className="w-full rounded border border-teal-300 bg-white px-2 py-1 text-[13px]"
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
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-slate-300 bg-white hover:bg-teal-50 text-[13px] font-semibold text-[#164E63] cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm ô điền khuyết</span>
            </button>
          </div>
        )}

        {/* MATCHING (LINE OR DRAG-DROP) */}
        {question.type === 'matching' && question.matching && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() =>
                  onUpdateQuestion({ matching: { ...question.matching!, mode: 'line' } })
                }
                className={`px-2.5 py-1.5 rounded-lg border text-[13.5px] font-semibold cursor-pointer ${
                  question.matching.mode === 'line'
                    ? 'bg-[#087F70] border-[#087F70] text-white'
                    : 'bg-white border-slate-300 text-slate-700'
                }`}
              >
                Vẽ đường nối
              </button>
              <button
                type="button"
                onClick={() =>
                  onUpdateQuestion({ matching: { ...question.matching!, mode: 'drag' } })
                }
                className={`px-2.5 py-1.5 rounded-lg border text-[13.5px] font-semibold cursor-pointer ${
                  question.matching.mode === 'drag'
                    ? 'bg-[#087F70] border-[#087F70] text-white'
                    : 'bg-white border-slate-300 text-slate-700'
                }`}
              >
                Kéo thả ghép đôi
              </button>
            </div>

            <div className="space-y-1.5 text-[13.5px]">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={question.matching.allowManyToOne}
                  onChange={(e) =>
                    onUpdateQuestion({
                      matching: { ...question.matching!, allowManyToOne: e.target.checked },
                    })
                  }
                  className="accent-[#087F70]"
                />
                <span>Cho phép ghép nhiều – một (nhiều mục A nối chung 1 mục B)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={question.matching.shuffleB}
                  onChange={(e) =>
                    onUpdateQuestion({
                      matching: { ...question.matching!, shuffleB: e.target.checked },
                    })
                  }
                  className="accent-[#087F70]"
                />
                <span>Cho phép trộn thứ tự cột B</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={examMode === 'exam'}
                  checked={examMode === 'practice' && question.matching.practiceFeedback}
                  onChange={(e) =>
                    onUpdateQuestion({
                      matching: { ...question.matching!, practiceFeedback: e.target.checked },
                    })
                  }
                  className="accent-[#087F70]"
                />
                <span className={examMode === 'exam' ? 'text-slate-400' : ''}>
                  Phản hồi đúng/sai tức thì (chỉ bật ở chế độ Luyện tập)
                </span>
              </label>
            </div>

            {/* Items A & Key Mapping */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#164E63]">Các cặp Cột A ↔ Đáp án Cột B</span>
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
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-slate-300 bg-white hover:bg-teal-50 text-[12.5px] font-semibold text-[#087F70] cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm cặp</span>
                </button>
              </div>

              {question.matching.itemsA.map((itemA, idx) => {
                const currentPair = (key.matchingCorrectPairs || []).find(
                  (p) => p.fromId === itemA.id
                );
                return (
                  <div
                    key={itemA.id}
                    className="rounded-lg bg-slate-50 border border-slate-200 p-2 space-y-1.5"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-[#087F70]">{idx + 1}.</span>
                      <input
                        type="text"
                        value={itemA.label}
                        onChange={(e) => {
                          const nextA = [...question.matching!.itemsA];
                          nextA[idx] = { ...itemA, label: e.target.value };
                          onUpdateQuestion({ matching: { ...question.matching!, itemsA: nextA } });
                        }}
                        className="flex-1 rounded border border-slate-300 bg-white px-2 py-1 text-[13px]"
                        placeholder="Nội dung cột A"
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[12.5px] font-semibold text-slate-600 shrink-0">
                        Đáp án đúng:
                      </span>
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
                        className="flex-1 rounded border border-teal-300 bg-white px-2 py-1 text-[13px]"
                      >
                        <option value="">-- Chọn mục cột B --</option>
                        {question.matching!.itemsB.map((b, bIdx) => (
                          <option key={b.id} value={b.id}>
                            {String.fromCharCode(65 + bIdx)}. {b.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })}

              <div className="space-y-1.5 pt-1">
                <span className="font-semibold text-[#164E63] text-[13.5px]">Nội dung Cột B</span>
                {question.matching.itemsB.map((itemB, idx) => (
                  <div key={itemB.id} className="flex items-center gap-1.5">
                    <span className="font-bold text-[#164E63] w-5">
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
                      className="flex-1 rounded border border-slate-300 bg-white px-2 py-1 text-[13px]"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ORDERING */}
        {question.type === 'ordering' && (
          <div className="space-y-2">
            {(question.orderingItems || []).map((item, idx) => (
              <div key={item.id} className="flex items-center gap-1.5">
                <span className="text-[12.5px] font-bold text-[#164E63] w-6">#{idx + 1}</span>
                <input
                  type="text"
                  value={item.text}
                  onChange={(e) => {
                    const next = [...(question.orderingItems || [])];
                    next[idx] = { ...item, text: e.target.value };
                    onUpdateQuestion({ orderingItems: next });
                  }}
                  className="flex-1 rounded border border-slate-300 px-2 py-1 text-[13px]"
                />
              </div>
            ))}
            <div className="text-[12.5px] text-slate-600">
              Thứ tự đúng (mã ổn định):{' '}
              <span className="font-mono text-[#087F70]">
                {(key.orderingCorrectIds || []).join(' → ') || 'Chưa thiết lập'}
              </span>
            </div>
          </div>
        )}

        {/* MANUAL / RUBRIC NOTE FOR ESSAY, FORMULA, DRAWING, DIAGRAM, ATTACHMENT */}
        {(question.type === 'essay' ||
          question.type === 'formula' ||
          question.type === 'drawing' ||
          question.type === 'diagram_label' ||
          question.type === 'attachment') && (
          <div className="space-y-1.5">
            <div className="rounded-lg bg-amber-50 border border-amber-200 px-2.5 py-1.5 text-[13px] text-amber-900">
              Dạng câu hỏi này được <strong>giáo viên chấm thủ công</strong> để đảm bảo chính xác chuyên môn.
            </div>
            <label className="block space-y-1">
              <span className="text-[13.5px] font-medium text-slate-700">
                Gợi ý đáp án / Biểu điểm dành riêng cho giáo viên
              </span>
              <textarea
                rows={3}
                value={key.referenceNote || ''}
                onChange={(e) => patchKey({ referenceNote: e.target.value })}
                placeholder="Nhập hướng dẫn chấm hoặc ý chính cần có..."
                className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-[13.5px]"
              />
            </label>
          </div>
        )}
      </div>
    </div>
  );
};
