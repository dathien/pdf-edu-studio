import * as XLSX from 'xlsx';
import type {
  GradedPaperRecord,
  GradingQuestion,
  GradingSession,
  McqItem,
  RoundingMode,
  Tf4ScoringRule,
} from '../../types/studio';

const SCALE = 10000;

/** Decimal-safe addition using integer scaling to prevent JS IEEE-754 drift */
export function addDec(a: number, b: number): number {
  return (Math.round(a * SCALE) + Math.round(b * SCALE)) / SCALE;
}

export function sumDec(values: number[]): number {
  let total = 0;
  for (const v of values) {
    if (Number.isFinite(v)) {
      total += Math.round(v * SCALE);
    }
  }
  return total / SCALE;
}

export function clampScore(val: number, maxScore: number): number {
  const safe = Number.isFinite(val) ? val : 0;
  if (safe < 0) return 0;
  if (safe > maxScore) return maxScore;
  return Math.round(safe * SCALE) / SCALE;
}

export function formatScoreVi(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  return rounded.toFixed(2).replace(/\.?0+$/, '').replace('.', ',');
}

export function applyRounding(rawScore: number, mode: RoundingMode): number {
  const safe = Math.max(0, rawScore);
  switch (mode) {
    case 'none':
      return Math.round(safe * 1000) / 1000;
    case '0.1':
      return Math.round(safe * 10) / 10;
    case '0.25':
      return Math.round(safe * 4) / 4;
    case '0.5':
      return Math.round(safe * 2) / 2;
    case '1':
      return Math.round(safe);
    default:
      return safe;
  }
}

export const DEFAULT_TF4_RULE: Tf4ScoringRule = {
  c0: 0,
  c1: 0.1,
  c2: 0.25,
  c3: 0.5,
  c4: 1.0,
};

/** Evaluate a single MCQ item based on verified answer key (never guesses keys) */
export function evaluateMcqItem(item: McqItem, tf4Rule: Tf4ScoringRule): number {
  const key = item.answerKey.trim().toUpperCase();
  const ans = item.studentAnswer.trim().toUpperCase();
  if (!key || !ans) return 0;

  if (item.kind === 'abcd') {
    return key === ans ? item.maxScore : 0;
  }

  if (item.kind === 'tf4') {
    const normalize = (s: string) =>
      s
        .replace(/[^ĐDSFT]/g, '')
        .replace(/T/g, 'Đ')
        .replace(/D/g, 'Đ')
        .replace(/F/g, 'S')
        .split('')
        .slice(0, 4);
    const kArr = normalize(key);
    const aArr = normalize(ans);
    if (kArr.length === 0) return 0;
    let correctCount = 0;
    for (let i = 0; i < Math.min(kArr.length, aArr.length, 4); i++) {
      if (kArr[i] === aArr[i]) correctCount++;
    }
    const baseByCount = [tf4Rule.c0, tf4Rule.c1, tf4Rule.c2, tf4Rule.c3, tf4Rule.c4][correctCount] ?? 0;
    // Scale proportionally if teacher configured custom maxScore != 1.0
    const ratio = tf4Rule.c4 > 0 ? item.maxScore / tf4Rule.c4 : 1;
    return Math.round(baseByCount * ratio * SCALE) / SCALE;
  }

  // Short answer: compare normalized numeric or trimmed string
  const numKey = Number(key.replace(',', '.'));
  const numAns = Number(ans.replace(',', '.'));
  if (!Number.isNaN(numKey) && !Number.isNaN(numAns)) {
    return Math.abs(numKey - numAns) < 1e-6 ? item.maxScore : 0;
  }
  return key === ans ? item.maxScore : 0;
}

export function getQuestionEarnedScore(q: GradingQuestion): number {
  if (q.subParts.length > 0) {
    const subTotal = sumDec(q.subParts.map((sp) => sp.earnedScore ?? 0));
    return clampScore(subTotal, q.maxScore);
  }
  return clampScore(q.earnedScore ?? 0, q.maxScore);
}

export interface GradingSummary {
  essayRaw: number;
  essayMax: number;
  mcqRaw: number;
  mcqMax: number;
  rawTotal: number;
  finalScore: number;
  scaleMax: number;
  answeredCount: number;
  totalItems: number;
}

export function computeGradingSummary(session: GradingSession): GradingSummary {
  const essayRaw = sumDec(session.questions.map((q) => getQuestionEarnedScore(q)));
  const essayMax = sumDec(session.questions.map((q) => q.maxScore));

  const mcqRaw = sumDec(session.mcqItems.map((m) => evaluateMcqItem(m, session.tf4Rule)));
  const mcqMax = sumDec(session.mcqItems.map((m) => m.maxScore));

  let rawTotal = 0;
  if (session.mode === 'essay') rawTotal = essayRaw;
  else if (session.mode === 'mcq') rawTotal = mcqRaw;
  else rawTotal = addDec(essayRaw, mcqRaw);

  rawTotal = clampScore(rawTotal, session.scaleMax);
  const finalScore = clampScore(applyRounding(rawTotal, session.roundingMode), session.scaleMax);

  const answeredEssay = session.questions.filter(
    (q) => q.earnedScore !== null || q.subParts.some((sp) => sp.earnedScore !== null)
  ).length;
  const answeredMcq = session.mcqItems.filter((m) => m.studentAnswer.trim() !== '').length;

  return {
    essayRaw,
    essayMax,
    mcqRaw,
    mcqMax,
    rawTotal,
    finalScore,
    scaleMax: session.scaleMax,
    answeredCount:
      session.mode === 'essay'
        ? answeredEssay
        : session.mode === 'mcq'
          ? answeredMcq
          : answeredEssay + answeredMcq,
    totalItems:
      session.mode === 'essay'
        ? session.questions.length
        : session.mode === 'mcq'
          ? session.mcqItems.length
          : session.questions.length + session.mcqItems.length,
  };
}

export function createDefaultGradingSession(title = 'Bài kiểm tra mới', subject = 'Toán học'): GradingSession {
  const today = new Date().toISOString().slice(0, 10);
  return {
    id: `grade-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    examTitle: title,
    subject,
    className: '12A1',
    studentName: '',
    studentCode: '',
    gradedDate: today,
    scaleMax: 10,
    mode: 'essay',
    questions: [
      { id: 'q1', label: 'Câu 1', maxScore: 2, earnedScore: null, subParts: [] },
      { id: 'q2', label: 'Câu 2', maxScore: 2, earnedScore: null, subParts: [] },
      { id: 'q3', label: 'Câu 3', maxScore: 2, earnedScore: null, subParts: [] },
      { id: 'q4', label: 'Câu 4', maxScore: 2, earnedScore: null, subParts: [] },
      { id: 'q5', label: 'Câu 5', maxScore: 2, earnedScore: null, subParts: [] },
    ],
    mcqItems: [
      { id: 'm1', number: 1, kind: 'abcd', answerKey: 'A', studentAnswer: '', maxScore: 0.25 },
      { id: 'm2', number: 2, kind: 'abcd', answerKey: 'B', studentAnswer: '', maxScore: 0.25 },
      { id: 'm3', number: 3, kind: 'abcd', answerKey: 'C', studentAnswer: '', maxScore: 0.25 },
      { id: 'm4', number: 4, kind: 'abcd', answerKey: 'D', studentAnswer: '', maxScore: 0.25 },
      { id: 'm5', number: 5, kind: 'tf4', answerKey: 'Đ-S-Đ-Đ', studentAnswer: '', maxScore: 1.0 },
      { id: 'm6', number: 6, kind: 'short', answerKey: '4,5', studentAnswer: '', maxScore: 0.5 },
    ],
    tf4Rule: { ...DEFAULT_TF4_RULE },
    roundingMode: 'none',
    teacherComment: '',
    status: 'ungraded',
  };
}

export interface GradingStampPreset {
  code: string;
  label: string;
  defaultColor: string;
  symbol?: string;
}

export const GRADING_STAMP_PRESETS: GradingStampPreset[] = [
  { code: 'correct-mark', label: '✓ Đúng', symbol: '✓', defaultColor: '#059669' },
  { code: 'wrong-mark', label: '✗ Sai', symbol: '✗', defaultColor: '#DC2626' },
  { code: 'partial-mark', label: '½ Đúng một phần', symbol: '½', defaultColor: '#D97706' },
  { code: 'text-correct', label: 'Đúng', defaultColor: '#059669' },
  { code: 'text-wrong', label: 'Sai', defaultColor: '#DC2626' },
  { code: 'review', label: 'Cần xem lại', defaultColor: '#D97706' },
  { code: 'missing-idea', label: 'Thiếu ý', defaultColor: '#DC2626' },
  { code: 'missing-unit', label: 'Thiếu đơn vị', defaultColor: '#DC2626' },
  { code: 'wrong-formula', label: 'Sai công thức', defaultColor: '#DC2626' },
  { code: 'wrong-result', label: 'Sai kết quả', defaultColor: '#DC2626' },
  { code: 'good-format', label: 'Trình bày tốt', defaultColor: '#087F70' },
  { code: 'improved', label: 'Có tiến bộ', defaultColor: '#087F70' },
  { code: 'add-more', label: 'Cần bổ sung', defaultColor: '#D97706' },
  // Subject-specific stamps for Geography, History, and English
  { code: 'geo-data-ok', label: 'Đúng số liệu', defaultColor: '#059669' },
  { code: 'geo-chart-miss', label: 'Thiếu tên/đơn vị biểu đồ', defaultColor: '#DC2626' },
  { code: 'his-date-ok', label: 'Đúng mốc lịch sử', defaultColor: '#059669' },
  { code: 'his-cite-source', label: 'Cần dẫn tư liệu', defaultColor: '#D97706' },
  { code: 'eng-good-grammar', label: 'Good grammar', defaultColor: '#059669' },
  { code: 'eng-check-spelling', label: 'Check spelling', defaultColor: '#DC2626' },
  { code: 'eng-cohesion', label: 'Good cohesion', defaultColor: '#087F70' },
];

export interface SubjectRubricPreset {
  id: string;
  label: string;
  subject: string;
  scaleMax: number;
  criteria: Array<{ label: string; maxScore: number }>;
}

/**
 * Manual teacher rubric presets aligned to THPT Geography, History, and English assessment criteria.
 * All scores are entered manually by the teacher.
 */
export const SUBJECT_RUBRIC_PRESETS: SubjectRubricPreset[] = [
  {
    id: 'eng-writing',
    label: 'Tiếng Anh – Writing (4 tiêu chí)',
    subject: 'Tiếng Anh',
    scaleMax: 10,
    criteria: [
      { label: 'Task Response', maxScore: 2.5 },
      { label: 'Coherence & Cohesion', maxScore: 2.5 },
      { label: 'Lexical Resource', maxScore: 2.5 },
      { label: 'Grammar Accuracy', maxScore: 2.5 },
    ],
  },
  {
    id: 'eng-speaking',
    label: 'Tiếng Anh – Speaking (4 tiêu chí)',
    subject: 'Tiếng Anh',
    scaleMax: 10,
    criteria: [
      { label: 'Fluency & Coherence', maxScore: 2.5 },
      { label: 'Pronunciation', maxScore: 2.5 },
      { label: 'Lexical Resource', maxScore: 2.5 },
      { label: 'Grammar Accuracy', maxScore: 2.5 },
    ],
  },
  {
    id: 'geo-analysis',
    label: 'Địa lí – Tính toán, Biểu đồ & Giải thích',
    subject: 'Địa lí',
    scaleMax: 10,
    criteria: [
      { label: 'Công thức & Tính toán', maxScore: 3 },
      { label: 'Biểu đồ / Bản đồ & Đơn vị', maxScore: 3 },
      { label: 'Nhận xét & Giải thích', maxScore: 4 },
    ],
  },
  {
    id: 'his-essay',
    label: 'Lịch sử – Tư liệu & Tự luận phân tích',
    subject: 'Lịch sử',
    scaleMax: 10,
    criteria: [
      { label: 'Chính xác mốc & sự kiện', maxScore: 3 },
      { label: 'Khai thác tư liệu', maxScore: 3 },
      { label: 'Phân tích & Đánh giá', maxScore: 4 },
    ],
  },
];

export function exportGradebookToExcel(records: GradedPaperRecord[], fileName = 'Bang_diem_PDF_EDU_STUDIO.xlsx'): void {
  const rows = records.map((r, index) => ({
    STT: index + 1,
    'Số báo danh': r.studentCode || '—',
    'Họ và tên học sinh': r.studentName || 'Chưa nhập tên',
    Lớp: r.className || '—',
    'Tên bài kiểm tra': r.examTitle,
    'Môn học': r.subject,
    'Điểm gốc': r.rawScore,
    'Điểm sau làm tròn': r.finalScore,
    'Thang điểm': r.scaleMax,
    'Trạng thái':
      r.status === 'graded' ? 'Đã chấm' : r.status === 'in_progress' ? 'Đang chấm' : 'Chưa chấm',
    'Nhận xét của giáo viên': r.comment || '',
    'Thời gian cập nhật': new Date(r.updatedAt).toLocaleString('vi-VN'),
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet['!cols'] = [
    { wch: 6 },
    { wch: 14 },
    { wch: 24 },
    { wch: 10 },
    { wch: 28 },
    { wch: 14 },
    { wch: 12 },
    { wch: 16 },
    { wch: 12 },
    { wch: 14 },
    { wch: 36 },
    { wch: 20 },
  ];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Bảng điểm');
  XLSX.writeFile(workbook, fileName);
}

export function exportGradebookToCsv(records: GradedPaperRecord[], fileName = 'Bang_diem_PDF_EDU_STUDIO.csv'): void {
  const header = [
    'STT',
    'Số báo danh',
    'Họ và tên học sinh',
    'Lớp',
    'Tên bài kiểm tra',
    'Môn học',
    'Điểm gốc',
    'Điểm sau làm tròn',
    'Thang điểm',
    'Trạng thái',
    'Nhận xét',
  ];
  const escapeCsv = (val: string | number) => {
    const s = String(val ?? '');
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const lines = [
    header.map(escapeCsv).join(','),
    ...records.map((r, idx) =>
      [
        idx + 1,
        r.studentCode || '',
        r.studentName || '',
        r.className || '',
        r.examTitle,
        r.subject,
        r.rawScore,
        r.finalScore,
        r.scaleMax,
        r.status === 'graded' ? 'Đã chấm' : r.status === 'in_progress' ? 'Đang chấm' : 'Chưa chấm',
        r.comment || '',
      ]
        .map(escapeCsv)
        .join(',')
    ),
  ];
  // UTF-8 BOM so Excel opens Vietnamese characters cleanly
  const blob = new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
