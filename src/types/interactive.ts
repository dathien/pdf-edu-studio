import type { GradeLevel, SubjectCategory } from './studio';

export type InteractiveSubTab = 'author' | 'solve' | 'saved' | 'grade' | 'guide';

/**
 * All 12 interactive worksheet question types supported by PDF EDU STUDIO.
 */
export type InteractiveQuestionType =
  | 'mcq'
  | 'tf'
  | 'short'
  | 'fill_blank'
  | 'essay'
  | 'matching'
  | 'ordering'
  | 'reading'
  | 'formula'
  | 'drawing'
  | 'diagram_label'
  | 'attachment';

export const QUESTION_TYPE_META: Record<
  InteractiveQuestionType,
  {
    label: string;
    shortLabel: string;
    autoGradable: 'auto' | 'partial' | 'manual';
    defaultWidth: number;
    defaultHeight: number;
    description: string;
  }
> = {
  mcq: {
    label: 'Trắc nghiệm nhiều lựa chọn',
    shortLabel: 'Trắc nghiệm',
    autoGradable: 'auto',
    defaultWidth: 260,
    defaultHeight: 82,
    description: 'Chọn 1 đáp án đúng trong các phương án A, B, C, D.',
  },
  tf: {
    label: 'Đúng / Sai từng ý',
    shortLabel: 'Đúng/Sai',
    autoGradable: 'auto',
    defaultWidth: 320,
    defaultHeight: 136,
    description: 'Đánh dấu Đúng hoặc Sai cho từng mệnh đề a), b), c), d).',
  },
  short: {
    label: 'Trả lời ngắn',
    shortLabel: 'Trả lời ngắn',
    autoGradable: 'auto',
    defaultWidth: 260,
    defaultHeight: 74,
    description: 'Nhập đáp số ngắn hoặc cụm từ ngắn (tự chuẩn hóa chữ/số).',
  },
  fill_blank: {
    label: 'Điền khuyết',
    shortLabel: 'Điền khuyết',
    autoGradable: 'auto',
    defaultWidth: 360,
    defaultHeight: 112,
    description: 'Điền từ, hệ số hoặc giá trị còn thiếu vào các ô trống.',
  },
  essay: {
    label: 'Tự luận',
    shortLabel: 'Tự luận',
    autoGradable: 'manual',
    defaultWidth: 460,
    defaultHeight: 150,
    description: 'Học sinh trình bày bài giải chi tiết; giáo viên chấm thủ công.',
  },
  matching: {
    label: 'Ghép đôi (Vẽ đường nối / Kéo thả)',
    shortLabel: 'Ghép đôi',
    autoGradable: 'auto',
    defaultWidth: 480,
    defaultHeight: 230,
    description: 'Nối cặp giữa cột A và cột B bằng đường nối SVG hoặc kéo thả thẻ.',
  },
  ordering: {
    label: 'Sắp xếp trình tự',
    shortLabel: 'Sắp xếp',
    autoGradable: 'auto',
    defaultWidth: 400,
    defaultHeight: 195,
    description: 'Sắp xếp các bước thuật toán, quy trình hoặc mốc sự kiện đúng thứ tự.',
  },
  reading: {
    label: 'Đọc hiểu & câu hỏi con',
    shortLabel: 'Đọc hiểu',
    autoGradable: 'partial',
    defaultWidth: 460,
    defaultHeight: 215,
    description: 'Tư liệu/đoạn đọc kèm các câu hỏi con trắc nghiệm hoặc trả lời ngắn.',
  },
  formula: {
    label: 'Nhập công thức khoa học',
    shortLabel: 'Công thức',
    autoGradable: 'manual',
    defaultWidth: 340,
    defaultHeight: 122,
    description: 'Nhập biểu thức Toán/Lí/Hóa bằng LaTeX và xem hiển thị vector trực tiếp.',
  },
  drawing: {
    label: 'Vẽ hình / Viết tay',
    shortLabel: 'Vẽ / Viết tay',
    autoGradable: 'manual',
    defaultWidth: 440,
    defaultHeight: 190,
    description: 'Vẽ hình minh họa, đồ thị hoặc viết tay trực tiếp trên khung PDF.',
  },
  diagram_label: {
    label: 'Chú thích hình / bản đồ / sơ đồ',
    shortLabel: 'Chú thích hình',
    autoGradable: 'manual',
    defaultWidth: 380,
    defaultHeight: 155,
    description: 'Điền tên bộ phận, địa danh hoặc chú thích gắn tại các vị trí trên hình.',
  },
  attachment: {
    label: 'Bài thực hành & tệp đính kèm',
    shortLabel: 'Đính kèm SP',
    autoGradable: 'manual',
    defaultWidth: 380,
    defaultHeight: 118,
    description: 'Đính kèm ảnh sản phẩm, tệp mã nguồn, PDF hoặc bảng số liệu thực hành.',
  },
};

/**
 * Region anchored strictly in PDF page points (matching page.getViewport({ scale: 1 })).
 * Guarantees zero shift across zoom, scroll, and viewport resize.
 */
export interface PdfRegion {
  pageIndex: number; // 0-based PDF page index
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface MatchingItem {
  id: string; // Stable ID — never use screen pixel positions as answer keys
  label: string;
  latex?: string;
  subLabel?: string;
  imageDataUrl?: string;
}

export interface MatchingPair {
  fromId: string; // Item ID in Group A
  toId: string; // Item ID in Group B
}

export type MatchingMode = 'line' | 'drag';

export interface MatchingConfig {
  mode: MatchingMode;
  allowManyToOne: boolean;
  shuffleB: boolean;
  practiceFeedback: boolean; // Off by default in exam mode
  columnATitle: string;
  columnBTitle: string;
  itemsA: MatchingItem[];
  itemsB: MatchingItem[];
}

export interface TfStatement {
  id: string;
  label: string; // e.g., "a)", "b)"
  text: string;
}

export interface FillBlankSlot {
  id: string;
  prefix: string;
  suffix: string;
  placeholder?: string;
}

export interface OrderingItem {
  id: string;
  text: string;
}

export interface ReadingSubQuestion {
  id: string;
  prompt: string;
  kind: 'mcq' | 'short';
  options?: string[];
}

export interface DiagramLabelPin {
  id: string;
  code: string; // e.g. "(1)", "(2)"
  rx: number; // normalized 0..1 inside region width
  ry: number; // normalized 0..1 inside region height
  hint?: string;
}

/**
 * Student-safe interactive question definition.
 * STRICT RULE: Contains ZERO teacher answer keys.
 */
export interface InteractiveQuestion {
  id: string;
  code: string; // e.g. "Câu 1", "Bài 2"
  title: string;
  prompt: string;
  type: InteractiveQuestionType;
  maxPoints: number;
  required: boolean;
  region: PdfRegion;

  // Type-specific student-facing configs (no answer keys here)
  mcqOptions?: Array<{ id: string; label: string; text: string }>;
  tfStatements?: TfStatement[];
  shortPlaceholder?: string;
  shortUnit?: string;
  fillBlanks?: FillBlankSlot[];
  essayPlaceholder?: string;
  matching?: MatchingConfig;
  orderingItems?: OrderingItem[];
  readingPassage?: string;
  readingSubQuestions?: ReadingSubQuestion[];
  formulaPlaceholder?: string;
  diagramPins?: DiagramLabelPin[];
  attachmentAcceptHint?: string;
}

/**
 * Strictly separated Teacher Answer Key (NEVER packaged inside student .pdfedu files).
 */
export interface TeacherQuestionKey {
  questionId: string;
  mcqCorrectId?: string;
  tfCorrectMap?: Record<string, 'T' | 'F'>;
  shortAccepted?: string[]; // normalized alternatives e.g. ["12.5", "12,5"]
  fillBlankAccepted?: Record<string, string[]>; // slotId -> accepted strings
  matchingCorrectPairs?: MatchingPair[]; // verified strictly by stable item IDs
  orderingCorrectIds?: string[]; // ordered stable item IDs
  readingSubKeys?: Record<string, string[]>; // subQId -> accepted option/text
  referenceNote?: string; // Teacher grading rubric note for essay/formula/drawing/diagram/attachment
}

export type TeacherAnswerKeyMap = Record<string, TeacherQuestionKey>;

export interface InteractiveWorksheet {
  worksheetId: string;
  schemaVersion: 2;
  title: string;
  subject: SubjectCategory;
  subjectLabel: string;
  grade: GradeLevel;
  description: string;
  teacherName: string;
  durationMinutes?: number;
  examMode: 'exam' | 'practice';
  createdAt: number;
  updatedAt: number;
  questions: InteractiveQuestion[];
}

export interface DrawingStroke {
  id: string;
  color: string;
  width: number;
  points: Array<{ x: number; y: number }>; // logical coords inside drawing region viewBox
}

export interface StudentAttachmentMeta {
  id: string;
  fileName: string;
  mimeType: string;
  size: number;
  dataUrl: string; // stored safely as base64 data URL in IndexedDB, exported as binary entry in .pdfedu ZIP
  addedAt: number;
}

/**
 * Student answer for one interactive question.
 * STRICT RULE: Contains ZERO trusted score fields.
 */
export interface StudentQuestionAnswer {
  questionId: string;
  updatedAt: number;
  mcqSelectedId?: string;
  tfAnswers?: Record<string, 'T' | 'F' | ''>;
  shortText?: string;
  fillBlankAnswers?: Record<string, string>;
  essayText?: string;
  /** Matching answers stored strictly by stable item IDs (works identically for line & drag modes) */
  matchingPairs?: MatchingPair[];
  /** Ordering stored strictly by stable item ID sequence */
  orderingIds?: string[];
  readingAnswers?: Record<string, string>;
  formulaLatex?: string;
  drawingStrokes?: DrawingStroke[];
  diagramLabels?: Record<string, string>;
  attachments?: StudentAttachmentMeta[];
}

export type StudentAnswerMap = Record<string, StudentQuestionAnswer>;

export interface StudentProfileInfo {
  studentName: string;
  className: string;
  studentCode: string;
}

export interface StudentSubmissionPayload {
  packageKind: 'interactive-submission';
  schemaVersion: 2;
  submissionId: string;
  worksheetId: string;
  worksheetTitle: string;
  student: StudentProfileInfo;
  startedAt: number;
  submittedAt: number;
  answers: StudentAnswerMap;
}

export type DraftStatus = 'in_progress' | 'completed';

export interface InteractiveDraftRecord {
  id: string;
  worksheetId: string;
  customTitle: string;
  worksheet: InteractiveWorksheet;
  pdfBytes: Uint8Array;
  student: StudentProfileInfo;
  answers: StudentAnswerMap;
  status: DraftStatus;
  createdAt: number;
  updatedAt: number;
  sourceLabel?: string;
}

export interface TeacherWorksheetRecord {
  worksheetId: string;
  worksheet: InteractiveWorksheet;
  answerKeys: TeacherAnswerKeyMap;
  pdfBytes: Uint8Array;
  createdAt: number;
  updatedAt: number;
}

export interface QuestionGradingDetail {
  questionId: string;
  maxPoints: number;
  autoPoints: number | null; // null when manual-only
  earnedPoints: number | null; // final teacher-confirmed or auto-computed points
  mode: 'auto' | 'manual';
  matchedPairsCount?: number;
  totalExpectedPairs?: number;
  pairOverrides?: Record<string, number>; // key `${fromId}->${toId}` -> custom points
  teacherNote?: string;
}

export type SubmissionGradeStatus = 'ungraded' | 'in_progress' | 'graded';

export interface GradedSubmissionRecord {
  submissionId: string;
  worksheetId: string;
  worksheetTitle: string;
  fileName: string;
  student: StudentProfileInfo;
  submittedAt: number;
  importedAt: number;
  answers: StudentAnswerMap;
  pdfBytes: Uint8Array;
  worksheetSnapshot?: InteractiveWorksheet;
  gradingDetails: Record<string, QuestionGradingDetail>;
  totalScore: number;
  maxScore: number;
  teacherComment: string;
  status: SubmissionGradeStatus;
  updatedAt: number;
}

export interface InteractivePackageIntegrity {
  algorithm: 'SHA-256' | 'FNV1A-FALLBACK';
  digest: string;
  generatedAt: number;
  entries: string[];
}
