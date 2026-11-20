import React, { useState } from 'react';
import {
  Award,
  CheckCircle2,
  FileSpreadsheet,
  Plus,
  Save,
  Stamp,
  Trash2,
  Download,
  Target,
} from 'lucide-react';
import {
  computeGradingSummary,
  evaluateMcqItem,
  exportGradebookToCsv,
  exportGradebookToExcel,
  formatScoreVi,
  GRADING_STAMP_PRESETS,
} from '../../engines/grading/gradingEngine';
import { useStudioStore } from '../../stores/useStudioStore';
import type { RoundingMode, StudioDocument } from '../../types/studio';

interface GradingPanelProps {
  doc: StudioDocument;
}

export const GradingPanel: React.FC<GradingPanelProps> = ({ doc }) => {
  const updateGradingSession = useStudioStore((s) => s.updateGradingSession);
  const setQuestionScoreSynced = useStudioStore((s) => s.setQuestionScoreSynced);
  const saveCurrentPaperToGradebook = useStudioStore((s) => s.saveCurrentPaperToGradebook);
  const setStampPreset = useStudioStore((s) => s.setStampPreset);
  const activeStampCode = useStudioStore((s) => s.activeStampCode);
  const setActiveQuestionIdForScore = useStudioStore((s) => s.setActiveQuestionIdForScore);
  const addObject = useStudioStore((s) => s.addObject);
  const commentTemplates = useStudioStore((s) => s.commentTemplates);
  const addCommentTemplate = useStudioStore((s) => s.addCommentTemplate);
  const gradedPapers = useStudioStore((s) => s.gradedPapers);
  const notify = useStudioStore((s) => s.notify);

  const [subTab, setSubTab] = useState<'scores' | 'stamps' | 'comments' | 'gradebook'>('scores');
  const [customStampText, setCustomStampText] = useState('');
  const [customStampColor, setCustomStampColor] = useState('#DC2626');
  const [newCommentText, setNewCommentText] = useState('');
  const [gradebookFilter, setGradebookFilter] = useState<'all' | 'graded' | 'in_progress' | 'ungraded'>('all');

  const g = doc.grading;
  const summary = computeGradingSummary(g);

  const insertTotalStamp = () => {
    const page = doc.pages[doc.currentPageIndex];
    if (!page) return;
    addObject({
      id: `total-${Date.now()}`,
      type: 'grading-total',
      pageId: page.id,
      x: Math.max(40, page.width - 230),
      y: 44,
      width: 195,
      height: 76,
      rotation: 0,
      zIndex: 35,
      opacity: 1,
      template: 'with-comment',
      color: '#DC2626',
    });
    notify('Đã đóng khung tổng điểm tự động lên trang PDF', 'success');
  };

  const insertCommentOnPage = (text: string) => {
    const page = doc.pages[doc.currentPageIndex];
    if (!page) return;
    addObject({
      id: `gcmt-${Date.now()}`,
      type: 'grading-comment',
      pageId: page.id,
      x: 56,
      y: 130,
      width: 240,
      height: 48,
      rotation: 0,
      zIndex: 32,
      opacity: 1,
      text,
      color: '#DC2626',
      fontSize: 11,
    });
    updateGradingSession((prev) => ({
      ...prev,
      teacherComment: prev.teacherComment ? `${prev.teacherComment} ${text}` : text,
    }));
    notify('Đã chèn nhận xét lên trang PDF', 'success');
  };

  const addQuestion = () => {
    const nextNum = g.questions.length + 1;
    updateGradingSession((prev) => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          id: `q-${Date.now()}`,
          label: `Câu ${nextNum}`,
          maxScore: 1,
          earnedScore: null,
          subParts: [],
        },
      ],
    }));
  };

  const addMcqRow = (kind: 'abcd' | 'tf4' | 'short') => {
    const nextNum = g.mcqItems.length + 1;
    updateGradingSession((prev) => ({
      ...prev,
      mcqItems: [
        ...prev.mcqItems,
        {
          id: `m-${Date.now()}`,
          number: nextNum,
          kind,
          answerKey: kind === 'abcd' ? 'A' : kind === 'tf4' ? 'Đ-S-Đ-Đ' : '0',
          studentAnswer: '',
          maxScore: kind === 'tf4' ? 1.0 : kind === 'short' ? 0.5 : 0.25,
        },
      ],
    }));
  };

  const filteredGradebook =
    gradebookFilter === 'all'
      ? gradedPapers
      : gradedPapers.filter((p) => p.status === gradebookFilter);

  return (
    <div className="p-3.5 space-y-3.5 text-[14px] text-slate-800">
      {/* Live Score Summary Banner */}
      <div className="rounded-xl bg-red-50 border border-red-200 p-3.5 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-[12.5px] font-semibold text-red-700">Tổng điểm hiện tại</div>
            <div className="text-[24px] font-extrabold text-[#DC2626] tabular-nums leading-tight">
              {formatScoreVi(summary.finalScore)} / {formatScoreVi(summary.scaleMax)}
            </div>
            {summary.rawTotal !== summary.finalScore && (
              <div className="text-[12px] text-slate-600 tabular-nums">
                Điểm gốc: {formatScoreVi(summary.rawTotal)} (đã làm tròn {g.roundingMode})
              </div>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <button
              type="button"
              onClick={insertTotalStamp}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#DC2626] hover:bg-red-700 text-white font-semibold text-[13px] whitespace-nowrap cursor-pointer"
            >
              <Award className="w-4 h-4" />
              <span>Đóng tổng điểm</span>
            </button>
            <button
              type="button"
              onClick={saveCurrentPaperToGradebook}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-red-300 hover:bg-red-100 text-[#DC2626] font-semibold text-[13px] whitespace-nowrap cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Lưu bảng điểm</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sub-navigation */}
      <div className="grid grid-cols-4 gap-1 rounded-lg bg-slate-100 p-1 text-[13px] font-semibold">
        {(
          [
            ['scores', 'Chấm điểm'],
            ['stamps', 'Dấu chấm'],
            ['comments', 'Nhận xét'],
            ['gradebook', `Sổ (${gradedPapers.length})`],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setSubTab(id)}
            className={`py-1.5 rounded-md cursor-pointer transition-colors ${
              subTab === id ? 'bg-white text-[#164E63] shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* TAB 1: SCORES (Metadata + Essay + MCQ/TF4/Short) */}
      {subTab === 'scores' && (
        <div className="space-y-3.5">
          {/* Student & Exam Metadata */}
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="Họ tên học sinh"
              value={g.studentName}
              onChange={(e) =>
                updateGradingSession((prev) => ({ ...prev, studentName: e.target.value }), false)
              }
              className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-[13.5px]"
            />
            <input
              type="text"
              placeholder="Lớp (VD: 12A1)"
              value={g.className}
              onChange={(e) =>
                updateGradingSession((prev) => ({ ...prev, className: e.target.value }), false)
              }
              className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-[13.5px]"
            />
            <input
              type="text"
              placeholder="Số báo danh"
              value={g.studentCode}
              onChange={(e) =>
                updateGradingSession((prev) => ({ ...prev, studentCode: e.target.value }), false)
              }
              className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-[13.5px]"
            />
            <select
              value={g.status}
              onChange={(e) =>
                updateGradingSession((prev) => ({
                  ...prev,
                  status: e.target.value as 'ungraded' | 'in_progress' | 'graded',
                }))
              }
              className="rounded-lg border border-slate-300 px-2 py-1.5 text-[13.5px]"
            >
              <option value="ungraded">Chưa chấm</option>
              <option value="in_progress">Đang chấm</option>
              <option value="graded">Đã chấm xong</option>
            </select>
          </div>

          {/* Grading Mode & Rounding */}
          <div className="grid grid-cols-3 gap-2">
            <label className="space-y-0.5">
              <span className="text-[12px] text-slate-500">Hình thức</span>
              <select
                value={g.mode}
                onChange={(e) =>
                  updateGradingSession((prev) => ({
                    ...prev,
                    mode: e.target.value as 'essay' | 'mcq' | 'mixed',
                  }))
                }
                className="w-full rounded border border-slate-300 px-1.5 py-1 text-[13px]"
              >
                <option value="essay">Tự luận</option>
                <option value="mcq">Trắc nghiệm</option>
                <option value="mixed">Kết hợp</option>
              </select>
            </label>
            <label className="space-y-0.5">
              <span className="text-[12px] text-slate-500">Thang điểm</span>
              <input
                type="number"
                min={1}
                max={100}
                value={g.scaleMax}
                onChange={(e) =>
                  updateGradingSession((prev) => ({ ...prev, scaleMax: Math.max(1, Number(e.target.value)) }))
                }
                className="w-full rounded border border-slate-300 px-2 py-1 text-[13px] tabular-nums"
              />
            </label>
            <label className="space-y-0.5">
              <span className="text-[12px] text-slate-500">Làm tròn</span>
              <select
                value={g.roundingMode}
                onChange={(e) =>
                  updateGradingSession((prev) => ({
                    ...prev,
                    roundingMode: e.target.value as RoundingMode,
                  }))
                }
                className="w-full rounded border border-slate-300 px-1.5 py-1 text-[13px]"
              >
                <option value="none">Không làm tròn</option>
                <option value="0.1">0,1 điểm</option>
                <option value="0.25">0,25 điểm</option>
                <option value="0.5">0,5 điểm</option>
                <option value="1">Số nguyên</option>
              </select>
            </label>
          </div>

          {/* Essay Questions Table */}
          {(g.mode === 'essay' || g.mode === 'mixed') && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#164E63]">Phần Tự luận ({formatScoreVi(summary.essayRaw)}/{formatScoreVi(summary.essayMax)})</span>
                <button
                  type="button"
                  onClick={addQuestion}
                  className="flex items-center gap-1 px-2 py-1 rounded bg-[#E6F1EF] hover:bg-[#087F70] text-[#164E63] hover:text-white text-[12.5px] font-semibold cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Thêm câu
                </button>
              </div>
              <div className="space-y-1.5">
                {g.questions.map((q) => (
                  <div
                    key={q.id}
                    className="rounded-lg border border-slate-200 bg-white p-2 flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveQuestionIdForScore(q.id);
                          notify(`Nhấn vào trang PDF để gắn ô điểm cho ${q.label}`, 'info');
                        }}
                        title="Gắn ô điểm câu này lên trang PDF (đồng bộ hai chiều)"
                        className="p-1 rounded bg-red-50 hover:bg-red-100 text-[#DC2626] shrink-0 cursor-pointer"
                      >
                        <Target className="w-3.5 h-3.5" />
                      </button>
                      <input
                        type="text"
                        value={q.label}
                        onChange={(e) =>
                          updateGradingSession(
                            (prev) => ({
                              ...prev,
                              questions: prev.questions.map((item) =>
                                item.id === q.id ? { ...item, label: e.target.value } : item
                              ),
                            }),
                            false
                          )
                        }
                        className="w-16 font-semibold text-slate-800 border-b border-transparent focus:border-[#087F70] outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <input
                        type="number"
                        step={0.25}
                        min={0}
                        max={q.maxScore}
                        placeholder="—"
                        value={q.earnedScore === null ? '' : q.earnedScore}
                        onChange={(e) => {
                          const raw = e.target.value;
                          setQuestionScoreSynced(q.id, raw === '' ? null : Number(raw));
                        }}
                        className="w-16 text-center rounded border border-red-300 bg-red-50/40 font-bold text-[#DC2626] px-1 py-0.5 tabular-nums"
                      />
                      <span className="text-slate-400">/</span>
                      <input
                        type="number"
                        step={0.25}
                        min={0.25}
                        value={q.maxScore}
                        onChange={(e) =>
                          updateGradingSession((prev) => ({
                            ...prev,
                            questions: prev.questions.map((item) =>
                              item.id === q.id
                                ? { ...item, maxScore: Math.max(0.25, Number(e.target.value)) }
                                : item
                            ),
                          }))
                        }
                        className="w-14 text-center rounded border border-slate-200 px-1 py-0.5 text-slate-600 tabular-nums"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          updateGradingSession((prev) => ({
                            ...prev,
                            questions: prev.questions.filter((item) => item.id !== q.id),
                          }))
                        }
                        className="p-1 text-slate-400 hover:text-[#DC2626] cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MCQ / THPT 2025 4-Statement TF4 / Short Answer */}
          {(g.mode === 'mcq' || g.mode === 'mixed') && (
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between flex-wrap gap-1">
                <span className="font-bold text-[#164E63]">
                  Trắc nghiệm ({formatScoreVi(summary.mcqRaw)}/{formatScoreVi(summary.mcqMax)})
                </span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => addMcqRow('abcd')}
                    className="px-2 py-0.5 rounded bg-slate-100 hover:bg-[#E6F1EF] text-[12px] font-semibold cursor-pointer"
                  >
                    + ABCD
                  </button>
                  <button
                    type="button"
                    onClick={() => addMcqRow('tf4')}
                    className="px-2 py-0.5 rounded bg-slate-100 hover:bg-[#E6F1EF] text-[12px] font-semibold cursor-pointer"
                  >
                    + Đ/S 4 ý
                  </button>
                  <button
                    type="button"
                    onClick={() => addMcqRow('short')}
                    className="px-2 py-0.5 rounded bg-slate-100 hover:bg-[#E6F1EF] text-[12px] font-semibold cursor-pointer"
                  >
                    + Trả lời ngắn
                  </button>
                </div>
              </div>

              {/* Editable THPT 2025 TF4 Rule */}
              <div className="rounded-lg bg-[#F4F8F7] border border-teal-200/70 p-2 text-[12px] space-y-1">
                <div className="font-semibold text-[#164E63]">Quy tắc điểm Đúng/Sai 4 ý (THPT 2025):</div>
                <div className="grid grid-cols-4 gap-1">
                  {(
                    [
                      ['c1', '1 ý'],
                      ['c2', '2 ý'],
                      ['c3', '3 ý'],
                      ['c4', '4 ý'],
                    ] as const
                  ).map(([k, lbl]) => (
                    <label key={k} className="flex flex-col items-center">
                      <span className="text-slate-500">{lbl}</span>
                      <input
                        type="number"
                        step={0.05}
                        value={g.tf4Rule[k]}
                        onChange={(e) =>
                          updateGradingSession((prev) => ({
                            ...prev,
                            tf4Rule: { ...prev.tf4Rule, [k]: Number(e.target.value) },
                          }))
                        }
                        className="w-full text-center border border-slate-300 rounded bg-white py-0.5 tabular-nums"
                      />
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5 max-h-64 overflow-y-auto pr-0.5">
                {g.mcqItems.map((m) => {
                  const earned = evaluateMcqItem(m, g.tf4Rule);
                  return (
                    <div
                      key={m.id}
                      className="rounded-lg border border-slate-200 bg-white p-2 flex items-center justify-between gap-1.5 text-[13px]"
                    >
                      <span className="font-semibold text-slate-600 w-10 shrink-0">
                        C{m.number}
                        <span className="block text-[10px] text-slate-400">
                          {m.kind === 'abcd' ? 'ABCD' : m.kind === 'tf4' ? 'Đ/S' : 'TLN'}
                        </span>
                      </span>
                      <input
                        type="text"
                        placeholder="Đáp án"
                        value={m.answerKey}
                        onChange={(e) =>
                          updateGradingSession(
                            (prev) => ({
                              ...prev,
                              mcqItems: prev.mcqItems.map((item) =>
                                item.id === m.id ? { ...item, answerKey: e.target.value } : item
                              ),
                            }),
                            false
                          )
                        }
                        title="Đáp án chuẩn của giáo viên"
                        className="w-18 rounded border border-slate-200 px-1.5 py-1 text-center font-mono text-[12.5px] bg-slate-50"
                      />
                      <input
                        type="text"
                        placeholder="Bài HS"
                        value={m.studentAnswer}
                        onChange={(e) =>
                          updateGradingSession(
                            (prev) => ({
                              ...prev,
                              mcqItems: prev.mcqItems.map((item) =>
                                item.id === m.id ? { ...item, studentAnswer: e.target.value } : item
                              ),
                            }),
                            false
                          )
                        }
                        title="Đáp án bài làm của học sinh"
                        className="w-18 rounded border border-teal-300 px-1.5 py-1 text-center font-mono text-[12.5px] font-semibold"
                      />
                      <span
                        className={`w-11 text-right font-bold tabular-nums ${
                          earned > 0 ? 'text-emerald-700' : 'text-slate-400'
                        }`}
                      >
                        +{formatScoreVi(earned)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Teacher Summary Comment */}
          <label className="block space-y-1">
            <span className="text-[13px] font-semibold text-slate-600">Nhận xét chung của giáo viên</span>
            <textarea
              rows={2}
              value={g.teacherComment}
              onChange={(e) =>
                updateGradingSession((prev) => ({ ...prev, teacherComment: e.target.value }), false)
              }
              placeholder="Nhập lời phê hoặc chọn từ mục Nhận xét..."
              className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-[13.5px]"
            />
          </label>
        </div>
      )}

      {/* TAB 2: GRADING STAMPS */}
      {subTab === 'stamps' && (
        <div className="space-y-3">
          <div className="text-[13.5px] text-slate-600">
            Chọn dấu chấm bên dưới rồi nhấn lên vị trí bất kỳ trên bài làm học sinh.
          </div>
          <div className="grid grid-cols-2 gap-2">
            {GRADING_STAMP_PRESETS.map((st) => (
              <button
                key={st.code}
                type="button"
                onClick={() => setStampPreset(st.code, st.label, st.defaultColor)}
                style={{ borderColor: st.defaultColor, color: st.defaultColor }}
                className={`px-2.5 py-2 rounded-lg border-2 font-bold text-[13.5px] text-center cursor-pointer transition-all ${
                  activeStampCode === st.code ? 'bg-red-50 ring-2 ring-[#087F70]' : 'bg-white hover:bg-slate-50'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-200 space-y-2">
            <div className="font-semibold text-[#164E63] flex items-center gap-1.5">
              <Stamp className="w-4 h-4" />
              <span>Tạo dấu chấm riêng</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={customStampText}
                onChange={(e) => setCustomStampText(e.target.value)}
                placeholder="VD: Rất sáng tạo!"
                className="flex-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-[13.5px]"
              />
              <input
                type="color"
                value={customStampColor}
                onChange={(e) => setCustomStampColor(e.target.value)}
                className="w-9 h-9 rounded border border-slate-300 cursor-pointer"
              />
            </div>
            <button
              type="button"
              disabled={!customStampText.trim()}
              onClick={() => {
                setStampPreset(`custom-${Date.now()}`, customStampText.trim(), customStampColor);
                notify(`Đã chọn dấu "${customStampText.trim()}". Nhấn lên trang PDF để đóng dấu.`, 'success');
              }}
              className="w-full py-2 rounded-lg bg-[#087F70] hover:bg-[#06695d] text-white font-semibold disabled:opacity-40 cursor-pointer"
            >
              Dùng dấu tùy chỉnh này
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: COMMENT LIBRARY */}
      {subTab === 'comments' && (
        <div className="space-y-3">
          <div className="text-[13.5px] text-slate-600">
            Nhấn vào mẫu nhận xét để dán ngay lên bài làm PDF và cập nhật vào sổ điểm.
          </div>
          <div className="space-y-1.5 max-h-72 overflow-y-auto">
            {commentTemplates.map((tpl) => (
              <button
                key={tpl.id}
                type="button"
                onClick={() => insertCommentOnPage(tpl.text)}
                className="w-full text-left p-2.5 rounded-lg border border-slate-200 bg-white hover:border-[#087F70] hover:bg-[#F4F8F7] transition-colors cursor-pointer"
              >
                <div className="text-[11.5px] font-bold text-[#087F70]">{tpl.category}</div>
                <div className="text-[13.5px] text-slate-800">{tpl.text}</div>
              </button>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-200 space-y-2">
            <input
              type="text"
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              placeholder="Thêm mẫu lời phê mới của thầy/cô..."
              className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-[13.5px]"
            />
            <button
              type="button"
              disabled={!newCommentText.trim()}
              onClick={async () => {
                await addCommentTemplate({
                  id: `cmt-${Date.now()}`,
                  category: 'Cá nhân',
                  text: newCommentText.trim(),
                });
                setNewCommentText('');
                notify('Đã lưu mẫu nhận xét mới', 'success');
              }}
              className="w-full py-1.5 rounded-lg bg-[#E6F1EF] hover:bg-[#087F70] text-[#164E63] hover:text-white font-semibold disabled:opacity-40 cursor-pointer"
            >
              + Lưu mẫu nhận xét
            </button>
          </div>
        </div>
      )}

      {/* TAB 4: GRADEBOOK & EXCEL/CSV EXPORT */}
      {subTab === 'gradebook' && (
        <div className="space-y-3">
          <div className="flex gap-1.5">
            <button
              type="button"
              disabled={gradedPapers.length === 0}
              onClick={() => {
                exportGradebookToExcel(gradedPapers);
                notify('Đã xuất bảng điểm Excel (.xlsx)', 'success');
              }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-[13px] disabled:opacity-40 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Xuất Excel</span>
            </button>
            <button
              type="button"
              disabled={gradedPapers.length === 0}
              onClick={() => {
                exportGradebookToCsv(gradedPapers);
                notify('Đã xuất bảng điểm CSV (UTF-8)', 'success');
              }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 font-semibold text-[13px] disabled:opacity-40 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Xuất CSV</span>
            </button>
          </div>

          <div className="flex gap-1">
            {(
              [
                ['all', 'Tất cả'],
                ['graded', 'Đã chấm'],
                ['in_progress', 'Đang chấm'],
              ] as const
            ).map(([id, lbl]) => (
              <button
                key={id}
                type="button"
                onClick={() => setGradebookFilter(id)}
                className={`px-2 py-1 rounded text-[12.5px] font-semibold cursor-pointer ${
                  gradebookFilter === id ? 'bg-[#164E63] text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {lbl}
              </button>
            ))}
          </div>

          {filteredGradebook.length === 0 ? (
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-3.5 text-slate-600 text-[13.5px]">
              Chưa có bài chấm nào được lưu. Nhấn <strong>Lưu bảng điểm</strong> sau khi chấm xong mỗi học sinh.
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {filteredGradebook.map((rec) => (
                <div
                  key={rec.id}
                  className="rounded-lg border border-slate-200 bg-white p-2.5 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 truncate">{rec.studentName}</div>
                    <div className="text-[12px] text-slate-500 truncate">
                      {rec.className || '—'} · {rec.examTitle}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[16px] font-extrabold text-[#DC2626] tabular-nums">
                      {formatScoreVi(rec.finalScore)}/{rec.scaleMax}
                    </div>
                    {rec.status === 'graded' && (
                      <div className="text-[11px] text-emerald-700 flex items-center justify-end gap-0.5">
                        <CheckCircle2 className="w-3 h-3" /> Đã chấm
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
