import type { GradeLevel, SubjectCategory } from './studio';

/**
 * Six structured areas of the BÀI TẬP PDF subsystem.
 */
export type InteractiveSubTab = 'author' | 'assign' | 'solve' | 'saved' | 'grade' | 'guide';

/**
 * All 14 interactive worksheet question types supported by PDF EDU STUDIO.
 */
export type InteractiveQuestionType =
  | 'mcq'
  | 'mcq_multi'
  | 'tf'
  | 'short'
  | 'number'
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
    label: 'Trắc nghiệm một đáp án',
    shortLabel: 'Trắc nghiệm (1)',
    autoGradable: 'auto',
    defaultWidth: 320,
    defaultHeight: 96,
    description: 'Chọn 1 đáp án đúng duy nhất trong các phương án A, B, C, D.',
  },
  mcq_multi: {
    label: 'Trắc nghiệm nhiều đáp án',
    shortLabel: 'Nhiều đáp án',
    autoGradable: 'auto',
    defaultWidth: 340,
    defaultHeight: 112,
    description: 'Đánh dấu tất cả các ô phương án đúng (checkbox).',
  },
  tf: {
    label: 'Đúng / Sai từng ý',
    shortLabel: 'Đúng/Sai',
    autoGradable: 'auto',
    defaultWidth: 420,
    defaultHeight: 146,
    description: 'Đánh dấu Đúng hoặc Sai cho từng mệnh đề với thang điểm tùy chỉnh.',
  },
  short: {
    label: 'Trả lời ngắn',
    shortLabel: 'Trả lời ngắn',
    autoGradable: 'auto',
    defaultWidth: 320,
    defaultHeight: 80,
    description: 'Nhập cụm từ hoặc đáp án ngắn (tự chuẩn hóa chữ/khoảng trắng).',
  },
  number: {
    label: 'Ô nhập số',
    shortLabel: 'Nhập số',
    autoGradable: 'auto',
    defaultWidth: 280,
    defaultHeight: 80,
    description: 'Nhập giá trị số kèm đơn vị và sai số cho phép khi chấm tự động.',
  },
  fill_blank: {
    label: 'Điền khuyết',
    shortLabel: 'Điền khuyết',
    autoGradable: 'auto',
    defaultWidth: 420,
    defaultHeight: 122,
    description: 'Điền từ, hệ số hoặc giá trị còn thiếu vào các ô trống.',
  },
  essay: {
    label: 'Tự luận',
    shortLabel: 'Tự luận',
    autoGradable: 'manual',
    defaultWidth: 480,
    defaultHeight: 154,
    description: 'Học sinh trình bày bài giải chi tiết; giáo viên chấm thủ công.',
  },
  matching: {
    label: 'Ghép đôi (Đường nối / Kéo thả)',
    shortLabel: 'Ghép đôi',
    autoGradable: 'auto',
    defaultWidth: 500,
    defaultHeight: 236,
    description: 'Nối cặp giữa cột A và cột B bằng đường nối SVG hoặc kéo thả thẻ.',
  },
  ordering: {
    label: 'Sắp xếp trình tự',
    shortLabel: 'Sắp xếp',
    autoGradable: 'auto',
    defaultWidth: 440,
    defaultHeight: 196,
    description: 'Sắp xếp các bước thuật toán, quy trình hoặc mốc sự kiện đúng thứ tự.',
  },
  reading: {
    label: 'Đọc hiểu & câu hỏi con',
    shortLabel: 'Đọc hiểu',
    autoGradable: 'partial',
    defaultWidth: 480,
    defaultHeight: 218,
    description: 'Tư liệu/đoạn đọc kèm các câu hỏi con trắc nghiệm hoặc trả lời ngắn.',
  },
  formula: {
    label: 'Nhập công thức MathLive',
    shortLabel: 'Công thức',
    autoGradable: 'manual',
    defaultWidth: 420,
    defaultHeight: 146,
    description: 'Nhập biểu thức Toán/Lí/Hóa bằng trình soạn thảo MathLive trực quan và xem trước SVG.',
  },
  drawing: {
    label: 'Vẽ hình / Viết tay',
    shortLabel: 'Vẽ / Viết tay',
    autoGradable: 'manual',
    defaultWidth: 460,
    defaultHeight: 196,
    description: 'Vẽ hình minh họa, đồ thị hoặc viết tay trực tiếp trên khung PDF.',
  },
  diagram_label: {
    label: 'Chú thích hình / sơ đồ / bản đồ',
    shortLabel: 'Chú thích hình',
    autoGradable: 'manual',
    defaultWidth: 420,
    defaultHeight: 160,
    description: 'Điền tên bộ phận, địa danh hoặc chú thích gắn tại các vị trí trên hình.',
  },
  attachment: {
    label: 'Bài thực hành & tệp đính kèm',
    shortLabel: 'Đính kèm SP',
    autoGradable: 'manual',
    defaultWidth: 420,
    defaultHeight: 126,
    description: 'Đính kèm ảnh sản phẩm, tệp mã nguồn, PDF hoặc bảng số liệu thực hành.',
  },
};

/**
 * Region anchored strictly in PDF page coordinate space (PDF points + normalized 0..1 ratios).
 * Guarantees zero shift across zoom, scroll, screen sizes, and window resizing.
 */
export interface PdfRegion {
  pageIndex: number; // 0-based page index inside the active worksheet PDF
  x: number; // PDF points from left
  y: number; // PDF points from top
  width: number; // PDF points
  height: number; // PDF points
  /** Normalized 0..1 coordinates relative to PDF page size */
  nx?: number;
  ny?: number;
  nw?: number;
  nh?: number;
}

/**
 * Normalized 0..1 anchor in PDF page coordinates (top-left origin).
 * Ensures zero shift across zoom, scroll, and screen resolutions.
 */
export interface PdfPointAnchor {
  nx: number;
  ny: number;
  nw?: number;
  nh?: number;
}

export interface MatchingItem {
  id: string; // Stable ID — never use screen pixel positions as answer keys
  label: string;
  latex?: string;
  subLabel?: string;
  imageDataUrl?: string;
  /** Exact PDF anchor of this item's connection port when overlaid directly on the PDF */
  anchor?: PdfPointAnchor;
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
  /** Exact PDF column anchors for direct-on-PDF Đúng / Sai selection */
  rowAnchor?: {
    ny: number;
    trueNx: number;
    falseNx: number;
    rowNh?: number;
  };
}

export interface FillBlankSlot {
  id: string;
  prefix: string;
  suffix: string;
  placeholder?: string;
  anchor?: PdfPointAnchor;
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

  /** Auto-detection & teacher review metadata (not answer keys) */
  needsReview?: boolean;
  detectionNote?: string;
  teacherApproved?: boolean;
  /** Set true whenever the teacher manually edits or creates this question so re-detection preserves it */
  teacherModified?: boolean;
  /** Distinguishes verified classified questions from uncertain ones (never silently forced into Essay) */
  classificationStatus?: 'classified' | 'unclassified';
  /** Controls how the widget overlays the PDF so original text and images are never obscured */
  overlayMode?: 'anchored' | 'box' | 'drawer_button';
  /** Sub-items (e.g., 1), 2), 3)) attached to this main question rather than split into separate questions */
  subItems?: string[];
  /** Full bounding box of the detected question on the PDF page (for scrolling & subtle highlight) */
  questionBounds?: PdfRegion;
  sourcePdfPageNumber?: number; // 1-based original PDF page number
  printedPageLabel?: string; // Printed page number on the textbook/worksheet if detected

  // Type-specific student-facing configs (no answer keys here)
  mcqOptions?: Array<{ id: string; label: string; text: string; anchor?: PdfPointAnchor }>;
  tfStatements?: TfStatement[];
  shortPlaceholder?: string;
  shortUnit?: string;
  numberUnit?: string;
  numberPlaceholder?: string;
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
 * Strictly separated Teacher Answer Key (NEVER packaged inside student .pdf files).
 */
export interface TeacherQuestionKey {
  questionId: string;
  mcqCorrectId?: string;
  mcqMultiCorrectIds?: string[];
  mcqMultiScoring?: 'exact' | 'partial';
  tfCorrectMap?: Record<string, 'T' | 'F'>;
  /** Configurable TF scoring rule so not every TF question uses the same rubric */
  tfScoringMode?: 'thpt_4' | 'equal' | 'custom';
  tfItemPoints?: Record<string, number>;
  shortAccepted?: string[];
  numberTarget?: number;
  numberTolerance?: number; // e.g. 0.01
  fillBlankAccepted?: Record<string, string[]>;
  matchingCorrectPairs?: MatchingPair[];
  /** Optional custom points per matching pair key `${fromId}->${toId}` */
  matchingPairPoints?: Record<string, number>;
  orderingCorrectIds?: string[];
  readingSubKeys?: Record<string, string[]>;
  referenceNote?: string;
}

export type TeacherAnswerKeyMap = Record<string, TeacherQuestionKey>;

export interface WorksheetPageMapping {
  /** 1-based page numbers selected from the original uploaded PDF */
  sourcePdfPages: number[];
  /** Optional printed page numbers corresponding 1-to-1 with active worksheet pages */
  printedPageLabels?: string[];
  /** Optional offset: printedPage = sourcePdfPage + printedPageOffset */
  printedPageOffset?: number | null;
  lessonTitle?: string;
}

export interface InteractiveWorksheet {
  worksheetId: string;
  schemaVersion: 2;
  title: string;
  subject: SubjectCategory;
  subjectLabel: string;
  grade: GradeLevel;
  className?: string;
  description: string;
  instructions?: string;
  teacherName: string;
  durationMinutes?: number;
  dueDate?: string;
  examMode: 'exam' | 'practice';
  /** True when opened directly from an ordinary plain PDF without pre-authored question boxes */
  isPlainPdfMode?: boolean;
  pageMapping?: WorksheetPageMapping;
  createdAt: number;
  updatedAt: number;
  questions: InteractiveQuestion[];
}

export type PlainAnnotationKind = 'check' | 'text' | 'number' | 'line' | 'pen' | 'callout';

/**
 * Direct student answer/mark placed freely on any PDF page (normalized 0..1 page coordinates, top-left origin).
 */
export interface PlainPdfAnnotation {
  id: string;
  pageIndex: number;
  kind: PlainAnnotationKind;
  color: string;
  x: number;
  y: number;
  x2?: number;
  y2?: number;
  width?: number;
  markSymbol?: 'check' | 'cross' | 'circle';
  text?: string;
  strokeWidth?: number;
  points?: Array<{ x: number; y: number }>;
  createdAt: number;
}

export interface DrawingStroke {
  id: string;
  color: string;
  width: number;
  points: Array<{ x: number; y: number }>; // normalized 0..1 inside drawing canvas
}

export interface StudentAttachmentMeta {
  id: string;
  fileName: string;
  mimeType: string;
  size: number;
  dataUrl: string;
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
  mcqMultiSelectedIds?: string[];
  tfAnswers?: Record<string, 'T' | 'F' | ''>;
  shortText?: string;
  numberValue?: string;
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
  plainAnnotations?: PlainPdfAnnotation[];
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
  plainAnnotations?: PlainPdfAnnotation[];
  status: DraftStatus;
  createdAt: number;
  updatedAt: number;
  sourceLabel?: string;
  /** Online delivery metadata when opened from a shared URL */
  onlineSourceUrl?: string;
  assignmentCode?: string;
}

export interface TeacherWorksheetRecord {
  worksheetId: string;
  worksheet: InteractiveWorksheet;
  answerKeys: TeacherAnswerKeyMap;
  pdfBytes: Uint8Array;
  createdAt: number;
  updatedAt: number;
}

export type AssignmentDeliveryMode = 'offline' | 'online_link';

/**
 * Persisted record for "Quản lý bài đã giao" (Section XXI).
 */
export interface AssignmentRecord {
  assignmentId: string;
  assignmentCode: string; // e.g., "BT-TOAN12-4821"
  worksheetId: string;
  title: string;
  subjectLabel: string;
  grade: GradeLevel;
  className: string;
  instructions: string;
  startTime?: string;
  dueDate?: string;
  deliveryMode: AssignmentDeliveryMode;
  /** Only populated when teacher provides a real, accessible HTTPS/same-origin .pdf URL */
  hostedPackageUrl?: string;
  shareableLink?: string;
  status: 'active' | 'closed' | 'draft';
  createdAt: number;
  updatedAt: number;
}

export interface QuestionGradingDetail {
  questionId: string;
  maxPoints: number;
  autoPoints: number | null; // null when manual-only
  earnedPoints: number | null; // final teacher-confirmed or auto-computed points
  mode: 'auto' | 'manual';
  markStatus?: 'correct' | 'partial' | 'wrong' | 'pending';
  matchedPairsCount?: number;
  totalExpectedPairs?: number;
  pairOverrides?: Record<string, number>;
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
  plainAnnotations?: PlainPdfAnnotation[];
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
