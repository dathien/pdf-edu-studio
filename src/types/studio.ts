export type RibbonTabId =
  | 'file'
  | 'edit'
  | 'formula'
  | 'draw'
  | 'annotate'
  | 'grade'
  | 'pages'
  | 'security'
  | 'view';

export type ActiveTool =
  | 'select'
  | 'hand'
  | 'edit-text'
  | 'add-text'
  | 'formula'
  | 'pen'
  | 'highlighter'
  | 'eraser'
  | 'text-highlight'
  | 'text-underline'
  | 'text-strike'
  | 'note'
  | 'shape-rect'
  | 'shape-square'
  | 'shape-circle'
  | 'shape-ellipse'
  | 'shape-line'
  | 'shape-arrow'
  | 'shape-dashed'
  | 'shape-callout'
  | 'shape-table'
  | 'grade-stamp'
  | 'grade-score'
  | 'grade-comment'
  | 'grade-total'
  | 'signature'
  | 'redact';

export type SubjectCategory =
  | 'math'
  | 'physics'
  | 'chemistry'
  | 'biology'
  | 'cs'
  | 'geography'
  | 'history'
  | 'english'
  | 'general';

export type GradeLevel = 10 | 11 | 12;

export type ViewMode = 'continuous' | 'single' | 'two-page';

export interface PageCrop {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface PageTransform {
  id: string;
  sourcePageIndex: number; // -1 for inserted blank page
  width: number; // PDF points (e.g., 595.28 for A4)
  height: number; // PDF points (e.g., 841.89 for A4)
  rotation: 0 | 90 | 180 | 270;
  crop?: PageCrop;
}

export interface ExtractedTextBlock {
  id: string;
  pageIndex: number;
  text: string;
  x: number; // PDF points from left
  y: number; // PDF points from top (canvas coordinate space at scale 1)
  width: number;
  height: number;
  fontSize: number;
  fontName: string;
}

export interface PageAnalysis {
  pageIndex: number;
  kind: 'text-editable' | 'embedded-font' | 'vector-outlined' | 'scanned-image';
  textCount: number;
  note: string;
}

export interface DiagramLabelOverride {
  id: string;
  text: string;
  dx: number;
  dy: number;
}

export interface BaseStudioObject {
  id: string;
  pageId: string;
  x: number; // PDF pt from top-left
  y: number;
  width: number;
  height: number;
  rotation: number; // degrees
  zIndex: number;
  opacity: number; // 0..1
  locked?: boolean;
  groupId?: string;
}

export interface TextStudioObject extends BaseStudioObject {
  type: 'text';
  content: string;
  fontFamily: 'DejaVuSans' | 'DejaVuSerif';
  fontSize: number;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikethrough: boolean;
  color: string;
  align: 'left' | 'center' | 'right';
  lineHeight: number;
  letterSpacing: number;
  backgroundColor?: string;
  /** If editing an existing text block from the original PDF */
  replacesOriginalRect?: { x: number; y: number; width: number; height: number; originalText: string };
}

export interface FormulaStudioObject extends BaseStudioObject {
  type: 'formula';
  latex: string;
  typst?: string;
  svgMarkup: string;
  color: string;
  fontSize: number;
}

export interface DiagramStudioObject extends BaseStudioObject {
  type: 'diagram';
  title: string;
  diagramKey?: string;
  subject: SubjectCategory;
  svgMarkup: string;
  strokeColor: string;
  strokeWidth: number;
  strokeStyle: 'solid' | 'dashed';
  labels: DiagramLabelOverride[];
  sourceKind: 'library' | 'dynamic-2d' | 'graph' | 'solid-3d';
  sourceData?: Record<string, unknown>;
}

export interface ImageStudioObject extends BaseStudioObject {
  type: 'image';
  dataUrl: string;
  mimeType: string;
  keepAspect: boolean;
  isSvg?: boolean;
  crop?: { x: number; y: number; w: number; h: number };
}

export interface ShapeStudioObject extends BaseStudioObject {
  type: 'shape';
  shapeKind:
    | 'rect'
    | 'square'
    | 'circle'
    | 'ellipse'
    | 'line'
    | 'arrow'
    | 'dashed'
    | 'callout'
    | 'table';
  strokeColor: string;
  fillColor: string;
  strokeWidth: number;
  strokeStyle: 'solid' | 'dashed';
  text?: string;
  tableRows?: string[][];
}

export interface InkStudioObject extends BaseStudioObject {
  type: 'ink';
  tool: 'pen' | 'highlighter';
  color: string;
  strokeWidth: number;
  points: Array<{ x: number; y: number }>; // normalized relative to object x,y
}

export interface AnnotationStudioObject extends BaseStudioObject {
  type: 'annotation';
  kind: 'highlight' | 'underline' | 'strikethrough' | 'note';
  color: string;
  noteText?: string;
}

export interface GradingStampObject extends BaseStudioObject {
  type: 'grading-stamp';
  stampCode: string;
  label: string;
  color: string;
  fontSize: number;
}

export interface GradingScoreObject extends BaseStudioObject {
  type: 'grading-score';
  questionId: string;
  questionLabel: string;
  score: number;
  maxScore: number;
  color: string;
}

export interface GradingTotalObject extends BaseStudioObject {
  type: 'grading-total';
  template: 'full' | 'short' | 'box' | 'with-comment';
  color: string;
}

export interface GradingCommentObject extends BaseStudioObject {
  type: 'grading-comment';
  text: string;
  color: string;
  fontSize: number;
}

export interface SignatureStudioObject extends BaseStudioObject {
  type: 'signature';
  dataUrl: string;
  signerLabel: string;
}

export interface RedactionStudioObject extends BaseStudioObject {
  type: 'redaction';
  fillColor: string;
  applied: boolean;
  label?: string;
}

export type StudioObject =
  | TextStudioObject
  | FormulaStudioObject
  | DiagramStudioObject
  | ImageStudioObject
  | ShapeStudioObject
  | InkStudioObject
  | AnnotationStudioObject
  | GradingStampObject
  | GradingScoreObject
  | GradingTotalObject
  | GradingCommentObject
  | SignatureStudioObject
  | RedactionStudioObject;

export interface GradingSubPart {
  id: string;
  label: string;
  maxScore: number;
  earnedScore: number | null;
}

export interface GradingQuestion {
  id: string;
  label: string;
  maxScore: number;
  earnedScore: number | null;
  subParts: GradingSubPart[];
  note?: string;
}

export interface McqItem {
  id: string;
  number: number;
  kind: 'abcd' | 'tf4' | 'short';
  answerKey: string; // e.g., "A", "Đ-S-Đ-Đ", "12.5"
  studentAnswer: string;
  maxScore: number;
  confidence?: number; // 0..1 when scanned
  needsReview?: boolean;
}

export interface Tf4ScoringRule {
  c0: number;
  c1: number;
  c2: number;
  c3: number;
  c4: number;
}

export type RoundingMode = 'none' | '0.1' | '0.25' | '0.5' | '1';

export type GradingStatus = 'ungraded' | 'in_progress' | 'graded';

export interface GradingSession {
  id: string;
  examTitle: string;
  subject: string;
  className: string;
  studentName: string;
  studentCode: string;
  gradedDate: string;
  scaleMax: number;
  mode: 'essay' | 'mcq' | 'mixed';
  questions: GradingQuestion[];
  mcqItems: McqItem[];
  tf4Rule: Tf4ScoringRule;
  roundingMode: RoundingMode;
  teacherComment: string;
  status: GradingStatus;
}

export interface WatermarkConfig {
  enabled: boolean;
  kind: 'text' | 'image';
  text: string;
  imageDataUrl?: string;
  fontSize: number;
  rotation: number;
  opacity: number;
  color: string;
  position: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  scope: 'all' | 'current';
}

export interface PageNumberConfig {
  enabled: boolean;
  position: 'header' | 'footer';
  align: 'left' | 'center' | 'right';
  startNumber: number;
  fontSize: number;
  color: string;
  format: 'number' | 'page-of-total' | 'vietnamese';
}

export interface HistorySnapshot {
  pages: PageTransform[];
  objects: StudioObject[];
  grading: GradingSession;
}

export interface StudioDocument {
  id: string;
  title: string;
  fileName: string;
  originalPdfBytes: Uint8Array;
  currentPdfBytes: Uint8Array;
  pages: PageTransform[];
  objects: StudioObject[];
  grading: GradingSession;
  watermark: WatermarkConfig;
  pageNumbers: PageNumberConfig;
  subjectHint: SubjectCategory;
  zoom: number; // 0.25 .. 5.0
  viewMode: ViewMode;
  currentPageIndex: number;
  isDirty: boolean;
  isConfidential: boolean;
  savedAt?: number;
  history: HistorySnapshot[];
  historyIndex: number;
}

export interface SavedSignature {
  id: string;
  name: string;
  dataUrl: string;
  createdAt: number;
}

export interface CustomShapeItem {
  id: string;
  title: string;
  subject: SubjectCategory;
  svgMarkup: string;
  createdAt: number;
}

export interface SavedCommentTemplate {
  id: string;
  category: string;
  text: string;
}

export interface RecentDocumentMeta {
  id: string;
  title: string;
  fileName: string;
  pageCount: number;
  updatedAt: number;
  subjectHint: SubjectCategory;
  scoreSummary?: string;
}

export interface GradedPaperRecord {
  id: string;
  docId: string;
  examTitle: string;
  subject: string;
  className: string;
  studentName: string;
  studentCode: string;
  rawScore: number;
  finalScore: number;
  scaleMax: number;
  comment: string;
  status: GradingStatus;
  updatedAt: number;
}
