import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  Download,
  Edit3,
  Eye,
  FileDown,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  Globe,
  GraduationCap,
  HardDrive,
  HelpCircle,
  Info,
  ListChecks,
  Loader2,
  PenTool,
  Plus,
  RotateCcw,
  Save,
  Send,
  Sparkles,
  Trash2,
  Upload,
  X,
  XCircle,
} from 'lucide-react';
import { useStudioStore } from '../../stores/useStudioStore';
import { InteractivePdfCanvas } from './InteractivePdfCanvas';
import { TeacherQuestionInspector } from './TeacherQuestionInspector';
import { InteractiveGuidePanel } from './InteractiveGuidePanel';
import { AssignmentManagerPanel } from './AssignmentManagerPanel';
import {
  autoGradeSubmission,
  buildInteractiveGradebookBuffer,
  exportStudentSubmissionPackage,
  exportStudentWorksheetPackage,
  exportTeacherMasterPackage,
  fetchWorksheetFromUrl,
  getOnlineBackendConfig,
  parseInteractivePackage,
  renderInteractiveAnswersToPdf,
  sanitizeWorksheetForStudent,
  triggerInteractiveDownload,
} from './interactiveEngine';
import { interactiveStorage } from './interactiveStorage';
import {
  detectQuestionsFromPdfPages,
  extractSelectedPagesPdf,
  formatSelectedPagesVi,
  inspectPdfForPageSelection,
  validatePageSelectionSpec,
} from './pdfQuestionDetector';
import {
  buildInteractiveSubjectTemplate,
  INTERACTIVE_SUBJECT_TEMPLATES,
} from './interactiveTemplates';
import {
  QUESTION_TYPE_META,
  type AssignmentRecord,
  type GradedSubmissionRecord,
  type InteractiveDraftRecord,
  type InteractiveQuestion,
  type InteractiveQuestionType,
  type InteractiveSubTab,
  type InteractiveWorksheet,
  type PlainPdfAnnotation,
  type QuestionGradingDetail,
  type StudentAnswerMap,
  type StudentProfileInfo,
  type StudentQuestionAnswer,
  type TeacherAnswerKeyMap,
  type TeacherQuestionKey,
  type TeacherWorksheetRecord,
  type WorksheetPageMapping,
} from '../../types/interactive';
import type { GradeLevel, SubjectCategory } from '../../types/studio';

interface InteractiveWorksheetHubProps {
  retryNonce?: number;
}

const ALL_QUESTION_TYPES: InteractiveQuestionType[] = [
  'mcq',
  'mcq_multi',
  'tf',
  'short',
  'number',
  'fill_blank',
  'essay',
  'matching',
  'ordering',
  'reading',
  'formula',
  'drawing',
  'diagram_label',
  'attachment',
];

const SUBJECT_OPTIONS: Array<{ value: SubjectCategory; label: string }> = [
  { value: 'math', label: 'Toán học' },
  { value: 'physics', label: 'Vật lí' },
  { value: 'chemistry', label: 'Hóa học' },
  { value: 'biology', label: 'Sinh học' },
  { value: 'cs', label: 'Tin học' },
  { value: 'geography', label: 'Địa lí' },
  { value: 'history', label: 'Lịch sử' },
  { value: 'english', label: 'Tiếng Anh' },
  { value: 'general', label: 'Tổng hợp' },
];

function populateTypeDefaults(
  base: InteractiveQuestion,
  type: InteractiveQuestionType
): { question: InteractiveQuestion; key: TeacherQuestionKey } {
  const id = base.id;
  const q: InteractiveQuestion = {
    id: base.id,
    code: base.code,
    title: base.title,
    prompt: base.prompt,
    type,
    maxPoints: base.maxPoints,
    required: base.required,
    needsReview: base.needsReview,
    detectionNote: base.detectionNote,
    teacherApproved: base.teacherApproved,
    sourcePdfPageNumber: base.sourcePdfPageNumber,
    printedPageLabel: base.printedPageLabel,
    region: base.region,
  };
  const key: TeacherQuestionKey = { questionId: id };

  switch (type) {
    case 'mcq':
      q.mcqOptions = base.mcqOptions?.length
        ? base.mcqOptions
        : [
            { id: 'A', label: 'A', text: 'Phương án A' },
            { id: 'B', label: 'B', text: 'Phương án B' },
            { id: 'C', label: 'C', text: 'Phương án C' },
            { id: 'D', label: 'D', text: 'Phương án D' },
          ];
      key.mcqCorrectId = 'A';
      break;
    case 'mcq_multi':
      q.mcqOptions = base.mcqOptions?.length
        ? base.mcqOptions
        : [
            { id: 'A', label: 'A', text: 'Phương án A' },
            { id: 'B', label: 'B', text: 'Phương án B' },
            { id: 'C', label: 'C', text: 'Phương án C' },
            { id: 'D', label: 'D', text: 'Phương án D' },
          ];
      key.mcqMultiCorrectIds = ['A', 'C'];
      key.mcqMultiScoring = 'partial';
      break;
    case 'tf':
      q.tfStatements = base.tfStatements?.length
        ? base.tfStatements
        : [
            { id: 's1', label: 'a)', text: 'Phát biểu a' },
            { id: 's2', label: 'b)', text: 'Phát biểu b' },
            { id: 's3', label: 'c)', text: 'Phát biểu c' },
            { id: 's4', label: 'd)', text: 'Phát biểu d' },
          ];
      key.tfCorrectMap = { s1: 'T', s2: 'F', s3: 'T', s4: 'F' };
      key.tfScoringMode = 'equal';
      break;
    case 'short':
      q.shortPlaceholder = 'Nhập câu trả lời ngắn...';
      key.shortAccepted = ['Đáp án mẫu'];
      break;
    case 'number':
      q.numberPlaceholder = 'Nhập giá trị số...';
      q.numberUnit = '';
      key.numberTarget = 0;
      key.numberTolerance = 0;
      break;
    case 'fill_blank':
      q.fillBlanks = base.fillBlanks?.length
        ? base.fillBlanks
        : [
            { id: 'b1', prefix: 'Nội dung trước', suffix: 'nội dung sau.', placeholder: 'điền từ' },
            { id: 'b2', prefix: 'Giá trị cần tìm là', suffix: '', placeholder: 'điền số' },
          ];
      key.fillBlankAccepted = { b1: ['từ khóa'], b2: ['10'] };
      break;
    case 'essay':
      q.essayPlaceholder = 'Nhập lời giải chi tiết...';
      key.referenceNote = 'Giáo viên chấm thủ công theo biểu điểm chi tiết.';
      break;
    case 'matching': {
      const a1 = `${id}-a1`;
      const a2 = `${id}-a2`;
      const a3 = `${id}-a3`;
      const b1 = `${id}-b1`;
      const b2 = `${id}-b2`;
      const b3 = `${id}-b3`;
      q.matching = base.matching || {
        mode: 'line',
        allowManyToOne: false,
        shuffleB: true,
        practiceFeedback: false,
        columnATitle: 'Cột A',
        columnBTitle: 'Cột B',
        itemsA: [
          { id: a1, label: 'Khái niệm 1' },
          { id: a2, label: 'Khái niệm 2' },
          { id: a3, label: 'Khái niệm 3' },
        ],
        itemsB: [
          { id: b2, label: 'Ý nghĩa tương ứng 2' },
          { id: b3, label: 'Ý nghĩa tương ứng 3' },
          { id: b1, label: 'Ý nghĩa tương ứng 1' },
        ],
      };
      key.matchingCorrectPairs = [
        { fromId: a1, toId: b1 },
        { fromId: a2, toId: b2 },
        { fromId: a3, toId: b3 },
      ];
      break;
    }
    case 'ordering': {
      const o1 = `${id}-o1`;
      const o2 = `${id}-o2`;
      const o3 = `${id}-o3`;
      q.orderingItems = base.orderingItems?.length
        ? base.orderingItems
        : [
            { id: o2, text: 'Bước thứ hai' },
            { id: o1, text: 'Bước đầu tiên' },
            { id: o3, text: 'Bước cuối cùng' },
          ];
      key.orderingCorrectIds = [o1, o2, o3];
      break;
    }
    case 'reading':
      q.readingPassage = base.readingPassage || 'Đoạn tư liệu hoặc bài đọc minh họa...';
      q.readingSubQuestions = base.readingSubQuestions?.length
        ? base.readingSubQuestions
        : [
            {
              id: 'rs1',
              prompt: '1. Ý chính của đoạn tư liệu là gì?',
              kind: 'mcq',
              options: ['Phương án 1', 'Phương án 2'],
            },
            {
              id: 'rs2',
              prompt: '2. Tìm một từ khóa quan trọng trong đoạn đọc:',
              kind: 'short',
            },
          ];
      key.readingSubKeys = { rs1: ['Phương án 1'], rs2: ['tư liệu'] };
      break;
    case 'formula':
      q.formulaPlaceholder = 'Nhập công thức khoa học (MathLive / LaTeX)';
      key.referenceNote = 'Giáo viên đối chiếu biểu thức khoa học tương đương.';
      break;
    case 'drawing':
      key.referenceNote = 'Giáo viên kiểm tra hình vẽ / chữ viết tay trực tiếp.';
      break;
    case 'diagram_label':
      q.diagramPins = base.diagramPins?.length
        ? base.diagramPins
        : [
            { id: 'p1', code: '(1)', rx: 0.25, ry: 0.35, hint: 'Vị trí 1' },
            { id: 'p2', code: '(2)', rx: 0.7, ry: 0.5, hint: 'Vị trí 2' },
          ];
      key.referenceNote = '(1) Thành phần 1; (2) Thành phần 2.';
      break;
    case 'attachment':
      q.attachmentAcceptHint = 'Hỗ trợ ảnh, PDF, mã nguồn .py/.sql/.txt (tối đa 8 MB/tệp)';
      key.referenceNote = 'Giáo viên tải và đánh giá tệp sản phẩm đính kèm.';
      break;
  }

  return { question: q, key };
}

function createDefaultQuestion(
  type: InteractiveQuestionType,
  index: number,
  pageIndex: number,
  x: number,
  y: number,
  sourcePdfPageNumber?: number,
  printedPageLabel?: string
): { question: InteractiveQuestion; key: TeacherQuestionKey } {
  const id = `q-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`;
  const meta = QUESTION_TYPE_META[type];
  const clampedX = Math.max(16, Math.min(595 - meta.defaultWidth - 16, x));
  const clampedY = Math.max(24, Math.min(841 - meta.defaultHeight - 24, y));
  const base: InteractiveQuestion = {
    id,
    code: `Câu ${index}`,
    title: meta.label,
    prompt: `Hoàn thành yêu cầu ${meta.shortLabel.toLowerCase()} dưới đây.`,
    type,
    maxPoints: 2,
    required: true,
    needsReview: false,
    teacherApproved: true,
    sourcePdfPageNumber: sourcePdfPageNumber ?? pageIndex + 1,
    printedPageLabel,
    region: {
      pageIndex,
      x: clampedX,
      y: clampedY,
      width: meta.defaultWidth,
      height: meta.defaultHeight,
      nx: Number((clampedX / 595).toFixed(4)),
      ny: Number((clampedY / 841).toFixed(4)),
      nw: Number((meta.defaultWidth / 595).toFixed(4)),
      nh: Number((meta.defaultHeight / 841).toFixed(4)),
    },
  };
  return populateTypeDefaults(base, type);
}

function isQuestionAnswered(q: InteractiveQuestion, ans?: StudentQuestionAnswer): boolean {
  if (!ans) return false;
  switch (q.type) {
    case 'mcq':
      return Boolean(ans.mcqSelectedId);
    case 'mcq_multi':
      return (ans.mcqMultiSelectedIds?.length || 0) > 0;
    case 'tf':
      return Object.values(ans.tfAnswers || {}).some((v) => v === 'T' || v === 'F');
    case 'short':
      return Boolean(ans.shortText?.trim());
    case 'number':
      return Boolean(ans.numberValue?.trim());
    case 'fill_blank':
      return Object.values(ans.fillBlankAnswers || {}).some((v) => v.trim().length > 0);
    case 'essay':
      return Boolean(ans.essayText?.trim());
    case 'matching':
      return (ans.matchingPairs?.length || 0) > 0;
    case 'ordering':
      return (ans.orderingIds?.length || 0) > 0;
    case 'reading':
      return Object.values(ans.readingAnswers || {}).some((v) => v.trim().length > 0);
    case 'formula':
      return Boolean(ans.formulaLatex?.trim());
    case 'drawing':
      return (ans.drawingStrokes?.length || 0) > 0;
    case 'diagram_label':
      return Object.values(ans.diagramLabels || {}).some((v) => v.trim().length > 0);
    case 'attachment':
      return (ans.attachments?.length || 0) > 0;
    default:
      return false;
  }
}

export const InteractiveWorksheetHub: React.FC<InteractiveWorksheetHubProps> = () => {
  const interactiveView = useStudioStore((s) => s.interactiveView);
  const setInteractiveTab = useStudioStore((s) => s.setInteractiveTab);
  const closeInteractive = useStudioStore((s) => s.closeInteractive);
  const clearPendingInteractiveFile = useStudioStore((s) => s.clearPendingInteractiveFile);
  const documents = useStudioStore((s) => s.documents);
  const activeDocId = useStudioStore((s) => s.activeDocId);
  const notify = useStudioStore((s) => s.notify);

  const activeStudioDoc = documents.find((d) => d.id === activeDocId) || null;
  const tab = interactiveView.tab;
  const onlineBackend = useMemo(() => getOnlineBackendConfig(), []);

  // ---- SHARED INDEXEDDB LISTS ----
  const [teacherWorksheets, setTeacherWorksheets] = useState<TeacherWorksheetRecord[]>([]);
  const [assignments, setAssignments] = useState<AssignmentRecord[]>([]);
  const [savedDrafts, setSavedDrafts] = useState<InteractiveDraftRecord[]>([]);
  const [submissions, setSubmissions] = useState<GradedSubmissionRecord[]>([]);
  const [storageUsage, setStorageUsage] = useState<{ usedMB: number; quotaMB: number } | null>(null);
  const [quotaBanner, setQuotaBanner] = useState<string | null>(null);

  // ---- TAB 1: AUTHORING & TEACHER REVIEW STATE (3-STEP GUIDED FLOW) ----
  const [authorWorksheet, setAuthorWorksheet] = useState<InteractiveWorksheet | null>(null);
  const [authorKeys, setAuthorKeys] = useState<TeacherAnswerKeyMap>({});
  const [authorPdfBytes, setAuthorPdfBytes] = useState<Uint8Array | null>(null);
  const [rawUploadedPdfBytes, setRawUploadedPdfBytes] = useState<Uint8Array | null>(null);
  const [rawPdfInfo, setRawPdfInfo] = useState<{
    totalPages: number;
    pages: Array<{
      pdfPageNumber: number;
      printedPageLabel?: string;
      heading?: string;
      isLikelyScan: boolean;
    }>;
  } | null>(null);
  const [authorStep, setAuthorStep] = useState<1 | 2 | 3>(1);
  const [pageSelectMode, setPageSelectMode] = useState<'all' | 'range' | 'custom'>('all');
  const [rangeStartPage, setRangeStartPage] = useState('1');
  const [rangeEndPage, setRangeEndPage] = useState('1');
  const [pageSpecInput, setPageSpecInput] = useState('all');
  const [appliedPageSpec, setAppliedPageSpec] = useState('all');
  const [firstPrintedPageInput, setFirstPrintedPageInput] = useState('');
  const [extractingPages, setExtractingPages] = useState(false);
  const [detectingQuestions, setDetectingQuestions] = useState(false);
  const [detectionNotes, setDetectionNotes] = useState<string[]>([]);
  const [selectedAuthorQId, setSelectedAuthorQId] = useState<string | null>(null);
  const [editingQuestionSnapshot, setEditingQuestionSnapshot] = useState<{
    question: InteractiveQuestion;
    key: TeacherQuestionKey | undefined;
  } | null>(null);
  const [authorScrollNonce, setAuthorScrollNonce] = useState(0);
  const [placingType, setPlacingType] = useState<InteractiveQuestionType | null>(null);
  const [showAddQuestionMenu, setShowAddQuestionMenu] = useState(false);
  const [showSampleDrawer, setShowSampleDrawer] = useState(false);
  const [showMoreSettings, setShowMoreSettings] = useState(false);
  const [confirmResetAuthor, setConfirmResetAuthor] = useState(false);
  const [authorActionAlert, setAuthorActionAlert] = useState<{
    title: string;
    detail: string;
    actionLabel: string;
    onAction: () => void;
  } | null>(null);
  const [authorAutoSavedAt, setAuthorAutoSavedAt] = useState<number | null>(null);
  const [justSavedStudentPdfName, setJustSavedStudentPdfName] = useState<string | null>(null);
  const [authorPreviewStudent, setAuthorPreviewStudent] = useState(false);
  const [authorPreviewAnswers, setAuthorPreviewAnswers] = useState<StudentAnswerMap>({});
  const pageSpecInputRef = useRef<HTMLInputElement>(null);

  // ---- TAB 3: STUDENT SOLVING STATE ----
  const [solveDraftId, setSolveDraftId] = useState<string | null>(null);
  const [solveWorksheet, setSolveWorksheet] = useState<InteractiveWorksheet | null>(null);
  const [solvePdfBytes, setSolvePdfBytes] = useState<Uint8Array | null>(null);
  const [solveAnswers, setSolveAnswers] = useState<StudentAnswerMap>({});
  const [solvePlainAnnotations, setSolvePlainAnnotations] = useState<PlainPdfAnnotation[]>([]);
  const [solveNoticeBanner, setSolveNoticeBanner] = useState<string | null>(null);
  const [solveStudent, setSolveStudent] = useState<StudentProfileInfo>({
    studentName: '',
    className: '',
    studentCode: '',
  });
  const [solveStartedAt, setSolveStartedAt] = useState<number>(Date.now());
  const [solveSavedStatus, setSolveSavedStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [solveLastSavedAt, setSolveLastSavedAt] = useState<number | null>(null);
  const [solveFilterUnanswered, setSolveFilterUnanswered] = useState(false);
  const [onlineUrlInput, setOnlineUrlInput] = useState('');
  const [loadingOnlineUrl, setLoadingOnlineUrl] = useState(false);
  const [confirmResetSolve, setConfirmResetSolve] = useState(false);
  const [solveTemplateKeysForPractice, setSolveTemplateKeysForPractice] = useState<TeacherAnswerKeyMap | undefined>(undefined);
  const autoLoadedUrlRef = useRef<string | null>(null);

  // ---- TAB 4: SAVED DRAFTS STATE ----
  const [renamingDraftId, setRenamingDraftId] = useState<string | null>(null);
  const [renameText, setRenameText] = useState('');
  const [confirmDeleteDraftId, setConfirmDeleteDraftId] = useState<string | null>(null);

  // ---- TAB 5: COLLECT & GRADE STATE ----
  const [gradeModeTab, setGradeModeTab] = useState<'offline' | 'online'>('offline');
  const [gradeWorksheetId, setGradeWorksheetId] = useState<string>('');
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [selectedGradeQId, setSelectedGradeQId] = useState<string | null>(null);
  const [gradeScrollNonce, setGradeScrollNonce] = useState(0);
  const [importReport, setImportReport] = useState<{
    imported: number;
    skipped: string[];
    duplicateGraded: Array<{
      fileName: string;
      existing: GradedSubmissionRecord;
      incoming: GradedSubmissionRecord;
    }>;
  } | null>(null);

  const authorPdfInputRef = useRef<HTMLInputElement>(null);
  const authorMasterInputRef = useRef<HTMLInputElement>(null);
  const solvePackageInputRef = useRef<HTMLInputElement>(null);
  const gradeSubmissionsInputRef = useRef<HTMLInputElement>(null);
  const gradeMasterInputRef = useRef<HTMLInputElement>(null);

  const refreshLocalLists = useCallback(async () => {
    const [tws, asgs, drafts, subs, est] = await Promise.all([
      interactiveStorage.listTeacherWorksheets(),
      interactiveStorage.listAssignments(),
      interactiveStorage.listStudentDrafts(),
      interactiveStorage.listSubmissions(),
      interactiveStorage.estimateStorageUsage(),
    ]);
    setTeacherWorksheets(tws);
    setAssignments(asgs);
    setSavedDrafts(drafts);
    setSubmissions(subs);
    setStorageUsage(est);
    if (!gradeWorksheetId && tws.length > 0) {
      setGradeWorksheetId(tws[0].worksheetId);
    }
  }, [gradeWorksheetId]);

  useEffect(() => {
    refreshLocalLists();
  }, [refreshLocalLists]);

  const openPlainPdfInSolve = useCallback(
    (fileName: string, pdfBytes: Uint8Array, corruptedMetadataNotice?: string) => {
      const cleanTitle = fileName.replace(/\.pdf$/i, '').trim() || 'Tài liệu PDF';
      const now = Date.now();
      const plainWorksheet: InteractiveWorksheet = {
        worksheetId: `plain-${now}-${Math.random().toString(36).slice(2, 6)}`,
        schemaVersion: 2,
        title: cleanTitle,
        subject: 'general',
        subjectLabel: 'Tổng hợp',
        grade: 12,
        description: 'Làm bài trực tiếp trên tài liệu PDF.',
        teacherName: '',
        examMode: 'practice',
        isPlainPdfMode: true,
        createdAt: now,
        updatedAt: now,
        questions: [],
      };
      setSolveDraftId(`draft-${now}-${Math.random().toString(36).slice(2, 6)}`);
      setSolveWorksheet(plainWorksheet);
      setSolvePdfBytes(pdfBytes);
      setSolveAnswers({});
      setSolvePlainAnnotations([]);
      setSolveStartedAt(now);
      setSolveSavedStatus('idle');
      setSolveLastSavedAt(null);
      setSolveFilterUnanswered(false);
      setSolveTemplateKeysForPractice(undefined);
      setSolveNoticeBanner(corruptedMetadataNotice || null);
      setInteractiveTab('solve');
      if (corruptedMetadataNotice) {
        notify(corruptedMetadataNotice, 'info');
      } else {
        notify(
          'Đã mở PDF. Em có thể sử dụng các công cụ để làm bài trực tiếp trên trang.',
          'info'
        );
      }
    },
    [notify, setInteractiveTab]
  );

  // Auto-load real Online share link (?worksheetUrl=...&code=...) when opened by student
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const worksheetUrl = params.get('worksheetUrl');
    const code = params.get('code');
    if (!worksheetUrl || autoLoadedUrlRef.current === worksheetUrl) return;
    autoLoadedUrlRef.current = worksheetUrl;
    setLoadingOnlineUrl(true);
    const urlFileName = decodeURIComponent(worksheetUrl.split('/').pop()?.split('?')[0] || 'bai_tap.pdf');
    fetchWorksheetFromUrl(worksheetUrl)
      .then((parsed) => {
        if (parsed.kind === 'worksheet') {
          setSolveDraftId(`draft-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);
          setSolveWorksheet(parsed.worksheet);
          setSolvePdfBytes(parsed.pdfBytes);
          setSolveAnswers({});
          setSolvePlainAnnotations([]);
          setSolveNoticeBanner(null);
          setSolveStartedAt(Date.now());
          setSolveTemplateKeysForPractice(undefined);
          setInteractiveTab('solve');
          notify(
            `Đã tải bài tập trực tuyến "${parsed.worksheet.title}"${code ? ` (Mã ${code})` : ''}.`,
            'success'
          );
          return;
        }
        if (parsed.kind === 'plain-pdf') {
          openPlainPdfInSolve(
            urlFileName,
            parsed.pdfBytes,
            parsed.metadataStatus === 'corrupted' ? parsed.warning : undefined
          );
          return;
        }
        if (parsed.kind === 'submission' && parsed.worksheetSnapshot) {
          setSolveDraftId(`draft-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);
          setSolveWorksheet(parsed.worksheetSnapshot);
          setSolvePdfBytes(parsed.pdfBytes);
          setSolveStudent(parsed.submission.student);
          setSolveAnswers(parsed.submission.answers);
          setSolvePlainAnnotations(parsed.submission.plainAnnotations || []);
          setSolveNoticeBanner(null);
          setSolveStartedAt(parsed.submission.startedAt || Date.now());
          setSolveTemplateKeysForPractice(undefined);
          setInteractiveTab('solve');
          notify(`Đã mở bài làm PDF "${parsed.worksheetSnapshot.title}".`, 'success');
          return;
        }
        notify('Liên kết không chứa tệp bài tập PDF phù hợp để làm bài.', 'warning');
      })
      .catch((err) => {
        notify(
          err instanceof Error
            ? `Không thể tải bài từ liên kết: ${err.message}`
            : 'Không thể tải bài tập từ liên kết trực tuyến.',
          'error'
        );
      })
      .finally(() => {
        setLoadingOnlineUrl(false);
      });
  }, [notify, openPlainPdfInSolve, setInteractiveTab]);

  // Handle .pdf file routed from Welcome Screen / Ctrl+O or selected inside Interactive Hub
  const handleExternalPackageFile = useCallback(
    async (file: File, preferredMode: 'auto' | 'solve' | 'author' | 'grade' = 'auto') => {
      try {
        const parsed = await parseInteractivePackage(file, file.name);
        if (parsed.kind === 'worksheet') {
          const newDraftId = `draft-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
          setSolveDraftId(newDraftId);
          setSolveWorksheet(parsed.worksheet);
          setSolvePdfBytes(parsed.pdfBytes);
          setSolveAnswers({});
          setSolvePlainAnnotations([]);
          setSolveNoticeBanner(null);
          setSolveStartedAt(Date.now());
          setSolveTemplateKeysForPractice(undefined);
          setInteractiveTab('solve');
          notify(`Đã mở bài tập PDF "${parsed.worksheet.title}" (đã xác minh toàn vẹn).`, 'success');
        } else if (parsed.kind === 'teacher-master') {
          await interactiveStorage.saveTeacherWorksheet({
            worksheetId: parsed.worksheet.worksheetId,
            worksheet: parsed.worksheet,
            answerKeys: parsed.answerKeys,
            pdfBytes: parsed.pdfBytes,
            createdAt: parsed.worksheet.createdAt,
            updatedAt: Date.now(),
          });
          await refreshLocalLists();
          if (preferredMode === 'grade') {
            setGradeWorksheetId(parsed.worksheet.worksheetId);
            setInteractiveTab('grade');
            notify(
              `Đã nạp đề gốc & đáp án giáo viên "${parsed.worksheet.title}" vào mục Chấm bài.`,
              'success'
            );
          } else {
            setAuthorWorksheet(parsed.worksheet);
            setAuthorKeys(parsed.answerKeys);
            setAuthorPdfBytes(parsed.pdfBytes);
            setRawUploadedPdfBytes(parsed.pdfBytes);
            setRawPdfInfo(null);
            setDetectionNotes([]);
            setSelectedAuthorQId(null);
            setEditingQuestionSnapshot(null);
            setAuthorStep(parsed.worksheet.questions.length > 0 ? 3 : 2);
            setInteractiveTab('author');
            notify(`Đã mở bản gốc giáo viên "${parsed.worksheet.title}".`, 'success');
          }
        } else if (parsed.kind === 'submission') {
          if (preferredMode === 'grade') {
            setInteractiveTab('grade');
            setGradeModeTab('offline');
            await importStudentSubmissionFiles([file]);
            return;
          }
          // Re-open student's saved PDF right into Làm bài with ALL answers & direct marks intact!
          const allMasters = await interactiveStorage.listTeacherWorksheets();
          const matchedMaster = allMasters.find(
            (m) => m.worksheetId === parsed.submission.worksheetId
          );
          const restoredWorksheet =
            parsed.worksheetSnapshot ||
            (matchedMaster ? sanitizeWorksheetForStudent(matchedMaster.worksheet) : null);

          if (!restoredWorksheet) {
            setInteractiveTab('grade');
            setGradeModeTab('offline');
            await importStudentSubmissionFiles([file]);
            return;
          }

          const newDraftId = `draft-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
          setSolveDraftId(newDraftId);
          setSolveWorksheet(restoredWorksheet);
          setSolvePdfBytes(parsed.pdfBytes);
          setSolveStudent(parsed.submission.student);
          setSolveAnswers(parsed.submission.answers);
          setSolvePlainAnnotations(parsed.submission.plainAnnotations || []);
          setSolveNoticeBanner(null);
          setSolveStartedAt(parsed.submission.startedAt || Date.now());
          setSolveTemplateKeysForPractice(undefined);
          setSolveSavedStatus('saved');
          setSolveLastSavedAt(parsed.submission.submittedAt || Date.now());
          setInteractiveTab('solve');
          notify(
            `Đã mở lại bài làm PDF "${restoredWorksheet.title}" với đầy đủ nội dung đã lưu (có thể tiếp tục chỉnh sửa).`,
            'success'
          );
        } else if (parsed.kind === 'plain-pdf') {
          if (preferredMode === 'grade') {
            setInteractiveTab('grade');
            setGradeModeTab('offline');
            await importStudentSubmissionFiles([file]);
            return;
          }
          // Open ANY valid plain PDF directly in Solve mode (no orange warning for ordinary PDFs!)
          openPlainPdfInSolve(
            file.name,
            parsed.pdfBytes,
            parsed.metadataStatus === 'corrupted' ? parsed.warning : undefined
          );
        }
      } catch (err) {
        notify(err instanceof Error ? err.message : 'Không thể đọc tệp PDF.', 'error');
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [notify, openPlainPdfInSolve, refreshLocalLists, setInteractiveTab]
  );

  useEffect(() => {
    if (interactiveView.pendingPackageFile) {
      const f = interactiveView.pendingPackageFile;
      clearPendingInteractiveFile();
      handleExternalPackageFile(f);
    }
  }, [interactiveView.pendingPackageFile, clearPendingInteractiveFile, handleExternalPackageFile]);

  // =========================================================================
  // AUTHORING, PAGE SELECTION & AUTO-DETECTION ACTIONS
  // =========================================================================

  const effectivePageSpec = useMemo(() => {
    if (pageSelectMode === 'all') return 'all';
    if (pageSelectMode === 'range') {
      const s = rangeStartPage.trim();
      const e = rangeEndPage.trim();
      if (!s && !e) return '';
      if (!e || s === e) return s;
      return `${s}-${e}`;
    }
    return pageSpecInput;
  }, [pageSelectMode, rangeStartPage, rangeEndPage, pageSpecInput]);

  const pageValidation = useMemo(() => {
    const total = rawPdfInfo?.totalPages || 1;
    return validatePageSelectionSpec(effectivePageSpec, total);
  }, [effectivePageSpec, rawPdfInfo]);

  const openQuestionForEdit = (qId: string | null) => {
    if (!qId || !authorWorksheet) {
      setSelectedAuthorQId(null);
      setEditingQuestionSnapshot(null);
      return;
    }
    const found = authorWorksheet.questions.find((item) => item.id === qId);
    if (!found) return;
    setSelectedAuthorQId(qId);
    setEditingQuestionSnapshot({
      question: JSON.parse(JSON.stringify(found)) as InteractiveQuestion,
      key: authorKeys[qId]
        ? (JSON.parse(JSON.stringify(authorKeys[qId])) as TeacherQuestionKey)
        : undefined,
    });
    setAuthorScrollNonce((n) => n + 1);
    setAuthorActionAlert(null);
  };

  const cancelQuestionEdit = () => {
    if (editingQuestionSnapshot && authorWorksheet) {
      const snap = editingQuestionSnapshot;
      setAuthorWorksheet({
        ...authorWorksheet,
        questions: authorWorksheet.questions.map((q) =>
          q.id === snap.question.id ? snap.question : q
        ),
      });
      setAuthorKeys((prev) => {
        const next = { ...prev };
        if (snap.key) next[snap.question.id] = snap.key;
        else delete next[snap.question.id];
        return next;
      });
    }
    setSelectedAuthorQId(null);
    setEditingQuestionSnapshot(null);
  };

  const loadTemplateIntoAuthor = async (templateId: string) => {
    try {
      const built = await buildInteractiveSubjectTemplate(templateId);
      setAuthorWorksheet(built.worksheet);
      setAuthorKeys(built.answerKeys);
      setAuthorPdfBytes(built.pdfBytes);
      setRawUploadedPdfBytes(built.pdfBytes);
      setRawPdfInfo(null);
      setDetectionNotes([]);
      setSelectedAuthorQId(null);
      setEditingQuestionSnapshot(null);
      setAuthorStep(3);
      setShowSampleDrawer(false);
      setAuthorPreviewStudent(false);
      setAuthorPreviewAnswers({});
      setPlacingType(null);
      setAuthorActionAlert(null);
      setJustSavedStudentPdfName(null);
      notify(`Đã mở bài mẫu "${built.worksheet.title}". Thầy cô có thể kiểm tra và chỉnh sửa ngay.`, 'success');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Không thể mở bài mẫu.', 'error');
    }
  };

  const createAuthorFromPdfBytes = async (
    title: string,
    bytes: Uint8Array,
    subject: SubjectCategory = 'general'
  ) => {
    const now = Date.now();
    const subjectLabel =
      SUBJECT_OPTIONS.find((s) => s.value === subject)?.label || 'Tổng hợp';
    let inspected: Awaited<ReturnType<typeof inspectPdfForPageSelection>> | null = null;
    try {
      inspected = await inspectPdfForPageSelection(bytes);
    } catch {
      inspected = null;
    }

    const totalPages = inspected?.totalPages || 1;
    const pageMapping: WorksheetPageMapping | undefined = inspected
      ? {
          sourcePdfPages: inspected.pages.map((p) => p.pdfPageNumber),
          printedPageLabels: inspected.pages.map((p) => p.printedPageLabel || ''),
          printedPageOffset: null,
        }
      : undefined;

    const ws: InteractiveWorksheet = {
      worksheetId: `ws-${now.toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
      schemaVersion: 2,
      title,
      subject,
      subjectLabel,
      grade: 11,
      description: 'Bài tập PDF tương tác tạo từ tài liệu PDF gốc.',
      teacherName: 'Giáo viên',
      durationMinutes: 30,
      examMode: 'exam',
      pageMapping,
      createdAt: now,
      updatedAt: now,
      questions: [],
    };
    setRawUploadedPdfBytes(bytes);
    setRawPdfInfo(inspected);
    if (totalPages > 6) {
      setPageSelectMode('range');
      setRangeStartPage('1');
      setRangeEndPage('2');
      setPageSpecInput('1-2');
    } else {
      setPageSelectMode('all');
      setRangeStartPage('1');
      setRangeEndPage(String(totalPages));
      setPageSpecInput('all');
    }
    setAppliedPageSpec('all');
    setFirstPrintedPageInput('');
    setAuthorWorksheet(ws);
    setAuthorKeys({});
    setAuthorPdfBytes(bytes);
    setDetectionNotes([]);
    setSelectedAuthorQId(null);
    setEditingQuestionSnapshot(null);
    setAuthorPreviewStudent(false);
    setPlacingType(null);
    setShowAddQuestionMenu(false);
    setAuthorActionAlert(null);
    setJustSavedStudentPdfName(null);
    setAuthorStep(1);
    notify(
      inspected
        ? `Đã tải tệp "${title}" (${totalPages} trang). Thầy cô hãy chọn trang cần giao rồi nhấn Tiếp tục.`
        : `Đã tải tệp "${title}". Thầy cô hãy nhấn Tiếp tục sang Bước 2 để tạo bài tập.`,
      'success'
    );
  };

  const handleUploadAuthorPdf = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      await createAuthorFromPdfBytes(file.name.replace(/\.pdf$/i, ''), bytes);
    } catch {
      notify(
        'Không thể mở tệp vừa chọn. Thầy cô vui lòng kiểm tra lại đây có phải tệp PDF (*.pdf) hợp lệ không.',
        'error'
      );
    }
  };

  const computePrintedOffset = (selectedPdfPages: number[]): number | null => {
    const raw = firstPrintedPageInput.trim();
    if (!raw || !/^\d+$/.test(raw) || selectedPdfPages.length === 0) return null;
    return Number(raw) - selectedPdfPages[0];
  };

  const handleExtractSelectedPages = async (specOverride?: string): Promise<boolean> => {
    if (!rawUploadedPdfBytes || !authorWorksheet) return false;
    const total = rawPdfInfo?.totalPages || 1;
    const spec = (specOverride ?? effectivePageSpec).trim();
    const validation = validatePageSelectionSpec(spec, total);
    if (!validation.valid) {
      notify(
        validation.errorMessage ||
          `Tài liệu có ${total} trang. Thầy cô vui lòng chọn trang từ 1 đến ${total}.`,
        'warning'
      );
      return false;
    }

    const chosen = validation.pages;
    setExtractingPages(true);
    try {
      const extractedBytes = await extractSelectedPagesPdf(rawUploadedPdfBytes, chosen);
      const offset = computePrintedOffset(chosen);
      const printedLabels = chosen.map((pdfNum) => {
        const meta = rawPdfInfo?.pages.find((p) => p.pdfPageNumber === pdfNum);
        return offset !== null ? String(pdfNum + offset) : meta?.printedPageLabel || '';
      });
      const pageMapping: WorksheetPageMapping = {
        sourcePdfPages: chosen,
        printedPageLabels: printedLabels,
        printedPageOffset: offset,
      };

      setAuthorPdfBytes(extractedBytes);
      setAuthorWorksheet({
        ...authorWorksheet,
        pageMapping,
        questions: [],
        updatedAt: Date.now(),
      });
      setAuthorKeys({});
      setSelectedAuthorQId(null);
      setEditingQuestionSnapshot(null);
      setDetectionNotes([]);
      setAppliedPageSpec(spec || 'all');
      setAuthorActionAlert(null);
      notify(`Đã chọn ${validation.summaryText} (${chosen.length} trang).`, 'success');
      return true;
    } catch (err) {
      notify(
        err instanceof Error ? err.message : 'Không thể lấy các trang vừa chọn. Thầy cô hãy thử lại.',
        'error'
      );
      return false;
    } finally {
      setExtractingPages(false);
    }
  };

  const handleContinueFromStep1 = async () => {
    if (!authorWorksheet || !authorPdfBytes) {
      notify('Thầy cô hãy nhấn Tải PDF để chọn tài liệu từ máy tính trước.', 'warning');
      return;
    }
    if (rawPdfInfo && rawPdfInfo.totalPages > 1) {
      if (!pageValidation.valid) {
        notify(
          pageValidation.errorMessage ||
            `Tài liệu có ${rawPdfInfo.totalPages} trang. Thầy cô vui lòng chọn trang từ 1 đến ${rawPdfInfo.totalPages}.`,
          'warning'
        );
        return;
      }
      const normalizedCurrent = effectivePageSpec.trim() || 'all';
      if (normalizedCurrent !== appliedPageSpec) {
        const ok = await handleExtractSelectedPages(normalizedCurrent);
        if (!ok) return;
      }
    }
    setAuthorStep(2);
    setAuthorActionAlert(null);
  };

  const handleRunPdfQuestionDetection = async () => {
    if (!authorPdfBytes || !authorWorksheet) return;
    setDetectingQuestions(true);
    setAuthorActionAlert(null);
    try {
      const sourcePdfPages = authorWorksheet.pageMapping?.sourcePdfPages;
      const offset = sourcePdfPages ? computePrintedOffset(sourcePdfPages) : null;
      const result = await detectQuestionsFromPdfPages(authorPdfBytes, {
        sourcePdfPages,
        printedPageOffset: offset,
      });

      const updatedMapping: WorksheetPageMapping = {
        sourcePdfPages: result.pageSummaries.map((s) => s.pdfPageNumber),
        printedPageLabels: result.pageSummaries.map((s) => s.printedPageLabel || ''),
        printedPageOffset: offset,
        lessonTitle: result.lessonTitle,
      };

      setAuthorWorksheet({
        ...authorWorksheet,
        title:
          result.lessonTitle && authorWorksheet.questions.length === 0
            ? `${authorWorksheet.title} — ${result.lessonTitle}`.slice(0, 96)
            : authorWorksheet.title,
        pageMapping: updatedMapping,
        questions: result.questions,
        updatedAt: Date.now(),
      });
      setAuthorKeys(result.emptyAnswerKeys);
      setDetectionNotes(result.notes);
      setSelectedAuthorQId(null);
      setEditingQuestionSnapshot(null);

      if (result.questions.length > 0) {
        setAuthorStep(3);
        notify(
          `Đã tìm thấy ${result.questions.length} câu hỏi. Thầy cô hãy kiểm tra trước khi giao bài.`,
          'success'
        );
      } else {
        setShowAddQuestionMenu(true);
        notify(
          'Ứng dụng chưa tìm được tất cả chỗ trả lời. Thầy cô có thể bổ sung bằng nút Thêm câu hỏi.',
          'info'
        );
      }
    } catch (err) {
      notify(
        err instanceof Error
          ? err.message
          : 'Không thể tự tìm câu hỏi trong tệp này. Thầy cô hãy nhấn nút Thêm câu hỏi để tự đánh dấu.',
        'error'
      );
    } finally {
      setDetectingQuestions(false);
    }
  };

  const handlePlaceQuestionAtPoint = (pageIndex: number, pdfX: number, pdfY: number) => {
    if (!authorWorksheet || !placingType) return;
    const sourcePdfNum = authorWorksheet.pageMapping?.sourcePdfPages?.[pageIndex] ?? pageIndex + 1;
    const printedLabel = authorWorksheet.pageMapping?.printedPageLabels?.[pageIndex] || undefined;
    const { question, key } = createDefaultQuestion(
      placingType,
      authorWorksheet.questions.length + 1,
      pageIndex,
      pdfX,
      pdfY,
      sourcePdfNum,
      printedLabel
    );
    const nextWs: InteractiveWorksheet = {
      ...authorWorksheet,
      updatedAt: Date.now(),
      questions: [...authorWorksheet.questions, question],
    };
    const nextKeys = { ...authorKeys, [question.id]: key };
    setAuthorWorksheet(nextWs);
    setAuthorKeys(nextKeys);
    setPlacingType(null);
    setShowAddQuestionMenu(false);
    setAuthorStep(3);
    setSelectedAuthorQId(question.id);
    setEditingQuestionSnapshot({
      question: JSON.parse(JSON.stringify(question)) as InteractiveQuestion,
      key: JSON.parse(JSON.stringify(key)) as TeacherQuestionKey,
    });
    setAuthorActionAlert(null);
    notify(`Đã thêm ${question.code}. Thầy cô có thể nhập đáp án và điểm rồi nhấn Lưu.`, 'success');
  };

  const updateAuthorQuestion = (qId: string, patch: Partial<InteractiveQuestion>) => {
    if (!authorWorksheet) return;
    setAuthorWorksheet({
      ...authorWorksheet,
      updatedAt: Date.now(),
      questions: authorWorksheet.questions.map((q) => (q.id === qId ? { ...q, ...patch } : q)),
    });
  };

  const handleChangeAuthorQuestionType = (qId: string, nextType: InteractiveQuestionType) => {
    if (!authorWorksheet) return;
    const existing = authorWorksheet.questions.find((q) => q.id === qId);
    if (!existing || existing.type === nextType) return;
    const { question: converted, key: freshKey } = populateTypeDefaults(existing, nextType);
    setAuthorWorksheet({
      ...authorWorksheet,
      updatedAt: Date.now(),
      questions: authorWorksheet.questions.map((q) => (q.id === qId ? converted : q)),
    });
    setAuthorKeys((prev) => ({
      ...prev,
      [qId]: freshKey,
    }));
    notify(`Đã đổi ${existing.code} sang dạng "${QUESTION_TYPE_META[nextType].shortLabel}".`, 'info');
  };

  const deleteAuthorQuestion = (qId: string) => {
    if (!authorWorksheet) return;
    setAuthorWorksheet({
      ...authorWorksheet,
      updatedAt: Date.now(),
      questions: authorWorksheet.questions.filter((q) => q.id !== qId),
    });
    const nextKeys = { ...authorKeys };
    delete nextKeys[qId];
    setAuthorKeys(nextKeys);
    if (selectedAuthorQId === qId) {
      setSelectedAuthorQId(null);
      setEditingQuestionSnapshot(null);
    }
    notify('Đã xóa câu hỏi.', 'info');
  };

  const approveAllAuthorQuestions = () => {
    if (!authorWorksheet) return;
    setAuthorWorksheet({
      ...authorWorksheet,
      updatedAt: Date.now(),
      questions: authorWorksheet.questions.map((q) => ({
        ...q,
        teacherApproved: true,
        needsReview: false,
      })),
    });
    setAuthorActionAlert(null);
    notify('Đã đánh dấu kiểm tra xong tất cả câu hỏi.', 'success');
  };

  const saveTeacherMasterLocally = useCallback(
    async (silent = false): Promise<boolean> => {
      if (!authorWorksheet || !authorPdfBytes) return false;
      const now = Date.now();
      const res = await interactiveStorage.saveTeacherWorksheet({
        worksheetId: authorWorksheet.worksheetId,
        worksheet: authorWorksheet,
        answerKeys: authorKeys,
        pdfBytes: authorPdfBytes,
        createdAt: authorWorksheet.createdAt,
        updatedAt: now,
      });
      if (!res.ok) {
        if (res.quotaExceeded) setQuotaBanner(res.errorMessage || 'Bộ nhớ cục bộ đã đầy.');
        if (!silent) notify(res.errorMessage || 'Không thể lưu bài tập vào máy.', 'error');
        return false;
      }
      setQuotaBanner(null);
      setAuthorAutoSavedAt(now);
      setGradeWorksheetId(authorWorksheet.worksheetId);
      await refreshLocalLists();
      if (!silent) notify('Đã lưu bài tập và đáp án giáo viên trên máy.', 'success');
      return true;
    },
    [authorWorksheet, authorPdfBytes, authorKeys, notify, refreshLocalLists]
  );

  // Automatic work-in-progress save for teachers (prevents accidental loss of edits)
  useEffect(() => {
    if (!authorWorksheet || !authorPdfBytes) return;
    if (authorWorksheet.questions.length === 0) return;
    const timer = setTimeout(() => {
      saveTeacherMasterLocally(true);
    }, 2200);
    return () => clearTimeout(timer);
  }, [authorWorksheet, authorKeys, authorPdfBytes, saveTeacherMasterLocally]);

  const handleProceedToAssign = async () => {
    if (!authorWorksheet || !authorPdfBytes) return;
    if (authorWorksheet.questions.length === 0) {
      setAuthorActionAlert({
        title: 'Chưa có câu hỏi để giao',
        detail: 'Bài tập hiện chưa có câu hỏi nào nên chưa thể giao cho học sinh. Thầy cô hãy tạo bài tập trước.',
        actionLabel: 'Tạo bài tập tự động ngay',
        onAction: () => {
          setAuthorStep(2);
          setAuthorActionAlert(null);
        },
      });
      notify('Chưa có câu hỏi để giao. Thầy cô hãy tạo bài tập trước.', 'warning');
      return;
    }
    const ok = await saveTeacherMasterLocally(true);
    if (ok) {
      setAuthorActionAlert(null);
      setInteractiveTab('assign');
      notify('Bài tập đã sẵn sàng trong mục Giao bài.', 'success');
    }
  };

  const handleExportStudentPackage = async () => {
    if (!authorWorksheet || !authorPdfBytes) return;
    if (authorWorksheet.questions.length === 0) {
      setAuthorActionAlert({
        title: 'Chưa có câu hỏi để lưu bài tập',
        detail: 'Thầy cô cần tạo ít nhất 1 câu hỏi trước khi lưu tệp PDF gửi cho học sinh.',
        actionLabel: 'Tạo bài tập tự động ngay',
        onAction: () => {
          setAuthorStep(2);
          setAuthorActionAlert(null);
        },
      });
      notify('Chưa có câu hỏi để giao. Thầy cô hãy tạo bài tập trước.', 'warning');
      return;
    }
    try {
      await saveTeacherMasterLocally(true);
      const bytes = await exportStudentWorksheetPackage(authorWorksheet, authorPdfBytes);
      const safeName = authorWorksheet.title
        .replace(/[^a-zA-Z0-9\u00C0-\u024F\u1E00-\u1EFF_-]+/g, '_')
        .slice(0, 60);
      const fileName = `${safeName}_BaiTap.pdf`;
      triggerInteractiveDownload(bytes, fileName, 'application/pdf');
      setJustSavedStudentPdfName(fileName);
      setAuthorActionAlert(null);
      notify(
        `Đã lưu tệp "${fileName}" về máy (đã tách sạch đáp án giáo viên). Thầy cô có thể gửi tệp này qua Zalo cho học sinh.`,
        'success'
      );
    } catch (err) {
      notify(
        err instanceof Error ? err.message : 'Không thể lưu tệp PDF bài tập. Thầy cô vui lòng thử lại.',
        'error'
      );
    }
  };

  const handleExportTeacherBackup = async () => {
    if (!authorWorksheet || !authorPdfBytes) return;
    try {
      const bytes = await exportTeacherMasterPackage(authorWorksheet, authorKeys, authorPdfBytes);
      const safeName = authorWorksheet.title
        .replace(/[^a-zA-Z0-9\u00C0-\u024F\u1E00-\u1EFF_-]+/g, '_')
        .slice(0, 60);
      triggerInteractiveDownload(bytes, `${safeName}_BanGocGV.pdf`, 'application/pdf');
      notify('Đã lưu tệp bản gốc giáo viên (có kèm đáp án riêng cho thầy cô).', 'success');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Không thể lưu bản gốc giáo viên.', 'error');
    }
  };

  // =========================================================================
  // STUDENT SOLVING & AUTO-SAVE ACTIONS
  // =========================================================================

  const loadTemplateIntoSolve = async (templateId: string) => {
    try {
      const built = await buildInteractiveSubjectTemplate(templateId);
      const safeWs = sanitizeWorksheetForStudent(built.worksheet);
      await interactiveStorage.saveTeacherWorksheet({
        worksheetId: built.worksheet.worksheetId,
        worksheet: built.worksheet,
        answerKeys: built.answerKeys,
        pdfBytes: built.pdfBytes,
        createdAt: built.worksheet.createdAt,
        updatedAt: Date.now(),
      });
      await refreshLocalLists();

      const newDraftId = `draft-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setSolveDraftId(newDraftId);
      setSolveWorksheet(safeWs);
      setSolvePdfBytes(built.pdfBytes);
      setSolveAnswers({});
      setSolvePlainAnnotations([]);
      setSolveNoticeBanner(null);
      setSolveStartedAt(Date.now());
      setSolveSavedStatus('idle');
      setSolveTemplateKeysForPractice(undefined);
      notify(`Đã mở phiếu bài tập "${safeWs.title}". Em có thể làm trực tiếp trên PDF.`, 'success');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Không thể mở phiếu bài tập mẫu.', 'error');
    }
  };

  const persistCurrentSolveDraft = useCallback(
    async (statusOverride?: 'in_progress' | 'completed', silent = false) => {
      if (!solveWorksheet || !solvePdfBytes) return false;
      const id = solveDraftId || `draft-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      if (!solveDraftId) setSolveDraftId(id);

      setSolveSavedStatus('saving');
      const existing = await interactiveStorage.getStudentDraft(id);
      const record: InteractiveDraftRecord = {
        id,
        worksheetId: solveWorksheet.worksheetId,
        customTitle: existing?.customTitle || solveWorksheet.title,
        worksheet: solveWorksheet,
        pdfBytes: solvePdfBytes,
        student: solveStudent,
        answers: solveAnswers,
        plainAnnotations: solvePlainAnnotations,
        status: statusOverride || existing?.status || 'in_progress',
        createdAt: existing?.createdAt || solveStartedAt,
        updatedAt: Date.now(),
      };
      const res = await interactiveStorage.saveStudentDraft(record);
      if (!res.ok) {
        setSolveSavedStatus('error');
        if (res.quotaExceeded) {
          setQuotaBanner(res.errorMessage || 'Bộ nhớ trình duyệt đã đầy.');
        }
        if (!silent) notify(res.errorMessage || 'Không thể lưu bài làm.', 'error');
        return false;
      }
      setQuotaBanner(null);
      setSolveSavedStatus('saved');
      setSolveLastSavedAt(Date.now());
      await refreshLocalLists();
      if (!silent) {
        notify(
          statusOverride === 'completed'
            ? 'Đã lưu bài làm với trạng thái Hoàn thành.'
            : 'Đã lưu bài làm vào mục "Bài đã lưu" trên thiết bị.',
          'success'
        );
      }
      return true;
    },
    [
      solveWorksheet,
      solvePdfBytes,
      solveDraftId,
      solveStudent,
      solveAnswers,
      solvePlainAnnotations,
      solveStartedAt,
      notify,
      refreshLocalLists,
    ]
  );

  // Debounced auto-save every 1.8s whenever answers, direct PDF annotations, or student profile change
  useEffect(() => {
    if (!solveWorksheet || !solvePdfBytes) return;
    if (
      Object.keys(solveAnswers).length === 0 &&
      solvePlainAnnotations.length === 0 &&
      !solveStudent.studentName.trim()
    ) {
      return;
    }
    const timer = setTimeout(() => {
      persistCurrentSolveDraft(undefined, true);
    }, 1800);
    return () => clearTimeout(timer);
  }, [
    solveAnswers,
    solvePlainAnnotations,
    solveStudent,
    solveWorksheet,
    solvePdfBytes,
    persistCurrentSolveDraft,
  ]);

  const handleLoadOnlineUrl = async () => {
    if (!onlineUrlInput.trim()) return;
    setLoadingOnlineUrl(true);
    try {
      const urlFileName = decodeURIComponent(
        onlineUrlInput.trim().split('/').pop()?.split('?')[0] || 'bai_tap.pdf'
      );
      const parsed = await fetchWorksheetFromUrl(onlineUrlInput);
      if (parsed.kind === 'worksheet') {
        setSolveDraftId(`draft-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);
        setSolveWorksheet(parsed.worksheet);
        setSolvePdfBytes(parsed.pdfBytes);
        setSolveAnswers({});
        setSolvePlainAnnotations([]);
        setSolveNoticeBanner(null);
        setSolveStartedAt(Date.now());
        setOnlineUrlInput('');
        notify(
          `Đã tải bài tập trực tuyến "${parsed.worksheet.title}" (có thể tiếp tục làm offline).`,
          'success'
        );
        return;
      }
      if (parsed.kind === 'plain-pdf') {
        setOnlineUrlInput('');
        openPlainPdfInSolve(
          urlFileName,
          parsed.pdfBytes,
          parsed.metadataStatus === 'corrupted' ? parsed.warning : undefined
        );
        return;
      }
      if (parsed.kind === 'submission' && parsed.worksheetSnapshot) {
        setSolveDraftId(`draft-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);
        setSolveWorksheet(parsed.worksheetSnapshot);
        setSolvePdfBytes(parsed.pdfBytes);
        setSolveStudent(parsed.submission.student);
        setSolveAnswers(parsed.submission.answers);
        setSolvePlainAnnotations(parsed.submission.plainAnnotations || []);
        setSolveNoticeBanner(null);
        setSolveStartedAt(parsed.submission.startedAt || Date.now());
        setOnlineUrlInput('');
        notify(`Đã mở lại bài làm PDF "${parsed.worksheetSnapshot.title}".`, 'success');
        return;
      }
      notify('Liên kết này không chứa tệp PDF phù hợp để học sinh làm bài.', 'warning');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Không thể tải bài tập từ URL.', 'error');
    } finally {
      setLoadingOnlineUrl(false);
    }
  };

  const handleExportSubmissionPackage = async () => {
    if (!solveWorksheet || !solvePdfBytes) return;
    const missingName = !solveStudent.studentName.trim();
    const effectiveStudent: StudentProfileInfo = {
      studentName: solveStudent.studentName.trim() || 'Học sinh',
      className: solveStudent.className.trim(),
      studentCode: solveStudent.studentCode.trim(),
    };
    try {
      await persistCurrentSolveDraft('completed', true);
      const { bytes } = await exportStudentSubmissionPackage({
        worksheet: solveWorksheet,
        student: effectiveStudent,
        answers: solveAnswers,
        plainAnnotations: solvePlainAnnotations,
        pdfBytes: solvePdfBytes,
        startedAt: solveStartedAt,
        includeRenderedPdf: true,
      });
      const safeStu = effectiveStudent.studentName
        .replace(/[^a-zA-Z0-9\u00C0-\u024F\u1E00-\u1EFF_-]+/g, '_')
        .slice(0, 40);
      const safeClass = (effectiveStudent.className || 'Lop').replace(/[^a-zA-Z0-9_-]+/g, '_');
      triggerInteractiveDownload(bytes, `BaiLam_${safeClass}_${safeStu}.pdf`, 'application/pdf');
      notify(
        missingName
          ? 'Đã lưu tệp PDF bài làm (.pdf). Nên điền Họ tên học sinh ở thanh trên trước khi gửi nộp cho giáo viên.'
          : 'Đã lưu tệp PDF bài làm (.pdf) hiển thị đầy đủ câu trả lời, dấu chọn, đường nối, nét viết tay và dữ liệu mở lại sửa tiếp. Gửi tệp PDF này cho giáo viên qua Zalo/Email.',
        'success'
      );
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Không thể lưu tệp PDF bài làm.', 'error');
    }
  };

  const handleSendActiveSolveToGrade = async () => {
    if (!solveWorksheet || !solvePdfBytes) return;
    try {
      const effectiveStudent: StudentProfileInfo = {
        studentName: solveStudent.studentName.trim() || 'Học sinh',
        className: solveStudent.className.trim(),
        studentCode: solveStudent.studentCode.trim(),
      };
      const { bytes } = await exportStudentSubmissionPackage({
        worksheet: solveWorksheet,
        student: effectiveStudent,
        answers: solveAnswers,
        plainAnnotations: solvePlainAnnotations,
        pdfBytes: solvePdfBytes,
        startedAt: solveStartedAt,
        includeRenderedPdf: true,
      });
      const safeName = `${effectiveStudent.studentName.replace(/[^a-zA-Z0-9\u00C0-\u024F\u1E00-\u1EFF_-]+/g, '_')}.pdf`;
      const syntheticFile = new File([new Uint8Array(bytes)], safeName, {
        type: 'application/pdf',
      });
      setInteractiveTab('grade');
      setGradeModeTab('offline');
      await importStudentSubmissionFiles([syntheticFile]);
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Không thể chuyển sang mục Chấm bài.', 'error');
    }
  };

  const openSavedDraft = (draft: InteractiveDraftRecord) => {
    setSolveDraftId(draft.id);
    setSolveWorksheet(draft.worksheet);
    setSolvePdfBytes(draft.pdfBytes);
    setSolveStudent(draft.student);
    setSolveAnswers(draft.answers);
    setSolvePlainAnnotations(draft.plainAnnotations || []);
    setSolveNoticeBanner(null);
    setSolveStartedAt(draft.createdAt);
    setSolveSavedStatus('saved');
    setSolveLastSavedAt(draft.updatedAt);
    setInteractiveTab('solve');
    notify(`Đã mở lại bài "${draft.customTitle}" với đầy đủ nội dung đã lưu.`, 'success');
  };

  // =========================================================================
  // TEACHER BATCH IMPORT & GRADING ACTIONS
  // =========================================================================

  const activeTeacherMaster = useMemo(
    () => teacherWorksheets.find((w) => w.worksheetId === gradeWorksheetId) || null,
    [teacherWorksheets, gradeWorksheetId]
  );

  const filteredSubmissions = useMemo(() => {
    if (!gradeWorksheetId) return submissions;
    return submissions.filter((s) => s.worksheetId === gradeWorksheetId);
  }, [submissions, gradeWorksheetId]);

  const activeSubmission = useMemo(
    () => submissions.find((s) => s.submissionId === selectedSubmissionId) || null,
    [submissions, selectedSubmissionId]
  );

  const importStudentSubmissionFiles = async (files: FileList | File[]) => {
    const fileArr = Array.from(files);
    if (fileArr.length === 0) return;

    let imported = 0;
    const skipped: string[] = [];
    const duplicateGraded: Array<{
      fileName: string;
      existing: GradedSubmissionRecord;
      incoming: GradedSubmissionRecord;
    }> = [];

    const allMasters = await interactiveStorage.listTeacherWorksheets();
    const existingSubs = await interactiveStorage.listSubmissions();
    let firstImportedId: string | null = null;
    let firstWorksheetId: string | null = null;

    for (const file of fileArr) {
      try {
        const parsed = await parseInteractivePackage(file, file.name);

        if (parsed.kind === 'plain-pdf') {
          // Honest handling: never fake auto-grading when embedded interactive data is absent.
          // Allow teacher to import visual PDF for manual viewing, scoring, commenting, and Return PDF / Excel export.
          const fallbackWsId = activeTeacherMaster?.worksheetId || `plain-pdf-${Date.now()}`;
          const fallbackWs: InteractiveWorksheet = activeTeacherMaster?.worksheet || {
            worksheetId: fallbackWsId,
            schemaVersion: 2,
            title: file.name.replace(/\.pdf$/i, ''),
            subject: 'general',
            subjectLabel: 'Tổng hợp',
            grade: 12,
            description: 'Tệp PDF thường (không có dữ liệu tương tác nhúng) — chấm thủ công.',
            teacherName: 'Giáo viên',
            examMode: 'exam',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            questions: [
              {
                id: 'manual-overall',
                code: 'Tổng bài',
                title: 'Chấm thủ công trực tiếp trên PDF',
                prompt:
                  'Tệp PDF không chứa dữ liệu tương tác nhúng; giáo viên xem trực tiếp bài hiển thị và nhập điểm thủ công.',
                type: 'essay',
                maxPoints: 10,
                required: true,
                region: { pageIndex: 0, x: 40, y: 100, width: 500, height: 120 },
              },
            ],
          };

          const manualDetails: Record<string, QuestionGradingDetail> = {};
          let maxScore = 0;
          for (const q of fallbackWs.questions) {
            maxScore += q.maxPoints;
            manualDetails[q.id] = {
              questionId: q.id,
              maxPoints: q.maxPoints,
              autoPoints: null,
              earnedPoints: null,
              mode: 'manual',
              markStatus: 'pending',
            };
          }

          const incomingPlain: GradedSubmissionRecord = {
            submissionId: `plain-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            worksheetId: fallbackWs.worksheetId,
            worksheetTitle: fallbackWs.title,
            fileName: file.name,
            student: {
              studentName: file.name.replace(/\.pdf$/i, '').slice(0, 80),
              className: activeTeacherMaster?.worksheet.className || '',
              studentCode: '',
            },
            submittedAt: file.lastModified || Date.now(),
            importedAt: Date.now(),
            answers: {},
            pdfBytes: parsed.pdfBytes,
            worksheetSnapshot: fallbackWs,
            gradingDetails: manualDetails,
            totalScore: 0,
            maxScore: Math.round(maxScore * 100) / 100,
            teacherComment:
              'Lưu ý: Tệp PDF này không chứa dữ liệu tương tác nhúng (PDF thông thường hoặc đã bị công cụ ngoài lược bỏ dữ liệu nhúng). Không tự động khôi phục câu trả lời; giáo viên xem trực tiếp trên PDF và chấm thủ công.',
            status: 'ungraded',
            updatedAt: Date.now(),
          };

          const saveRes = await interactiveStorage.saveSubmission(incomingPlain);
          if (!saveRes.ok) {
            if (saveRes.quotaExceeded)
              setQuotaBanner(saveRes.errorMessage || 'Bộ nhớ cục bộ đã đầy.');
            skipped.push(`${file.name}: ${saveRes.errorMessage}`);
            continue;
          }
          imported++;
          skipped.push(
            `${file.name}: Đã nhập ở chế độ CHẤM THỦ CÔNG (PDF không có dữ liệu tương tác nhúng).`
          );
          if (!firstImportedId) firstImportedId = incomingPlain.submissionId;
          if (!firstWorksheetId) firstWorksheetId = incomingPlain.worksheetId;
          continue;
        }

        if (parsed.kind !== 'submission') {
          skipped.push(
            `${file.name}: Đây là tệp đề bài tập hoặc bản gốc giáo viên, không phải bài làm học sinh (.pdf).`
          );
          continue;
        }
        const sub = parsed.submission;
        const matchedMaster =
          allMasters.find((m) => m.worksheetId === sub.worksheetId) || activeTeacherMaster;
        const rawWorksheetRef = matchedMaster?.worksheet || parsed.worksheetSnapshot;

        if (!rawWorksheetRef) {
          skipped.push(`${file.name}: Không tìm thấy cấu trúc đề bài tương ứng.`);
          continue;
        }

        const isPlainPdfSubmission =
          rawWorksheetRef.questions.length === 0 && Boolean(rawWorksheetRef.isPlainPdfMode || sub.plainAnnotations?.length);

        const worksheetRef: InteractiveWorksheet = isPlainPdfSubmission
          ? {
              ...rawWorksheetRef,
              questions: [
                {
                  id: 'manual-overall',
                  code: 'Tổng bài',
                  title: 'Chấm thủ công trực tiếp trên PDF',
                  prompt:
                    'Học sinh làm bài trực tiếp trên trang PDF. Giáo viên xem bài làm trên trang và nhập điểm, nhận xét.',
                  type: 'essay',
                  maxPoints: 10,
                  required: true,
                  region: { pageIndex: 0, x: 40, y: 100, width: 500, height: 120 },
                },
              ],
            }
          : rawWorksheetRef;

        if (
          activeTeacherMaster &&
          !isPlainPdfSubmission &&
          sub.worksheetId !== activeTeacherMaster.worksheetId &&
          !allMasters.some((m) => m.worksheetId === sub.worksheetId)
        ) {
          skipped.push(
            `${file.name}: Mã bài tập (${sub.worksheetId}) không khớp với đề đang chọn (${activeTeacherMaster.worksheetId}).`
          );
          continue;
        }

        const graded = autoGradeSubmission(
          worksheetRef,
          matchedMaster?.answerKeys || {},
          sub.answers
        );

        const incomingRecord: GradedSubmissionRecord = {
          submissionId: sub.submissionId,
          worksheetId: sub.worksheetId,
          worksheetTitle: sub.worksheetTitle,
          fileName: file.name,
          student: sub.student,
          submittedAt: sub.submittedAt,
          importedAt: Date.now(),
          answers: sub.answers,
          plainAnnotations: sub.plainAnnotations,
          pdfBytes: parsed.pdfBytes,
          worksheetSnapshot: worksheetRef,
          gradingDetails: graded.gradingDetails,
          totalScore: graded.totalScore,
          maxScore: graded.maxScore,
          teacherComment: '',
          status: graded.hasManualPending ? 'in_progress' : 'graded',
          updatedAt: Date.now(),
        };

        const duplicate = existingSubs.find(
          (e) =>
            e.submissionId === incomingRecord.submissionId ||
            (e.worksheetId === incomingRecord.worksheetId &&
              e.student.studentName.trim().toLowerCase() ===
                incomingRecord.student.studentName.trim().toLowerCase() &&
              e.student.className.trim().toLowerCase() ===
                incomingRecord.student.className.trim().toLowerCase())
        );

        if (duplicate && duplicate.status === 'graded') {
          duplicateGraded.push({
            fileName: file.name,
            existing: duplicate,
            incoming: incomingRecord,
          });
          continue;
        }

        const saveRes = await interactiveStorage.saveSubmission(incomingRecord);
        if (!saveRes.ok) {
          if (saveRes.quotaExceeded) setQuotaBanner(saveRes.errorMessage || 'Bộ nhớ cục bộ đã đầy.');
          skipped.push(`${file.name}: ${saveRes.errorMessage}`);
          continue;
        }
        imported++;
        if (!firstImportedId) firstImportedId = incomingRecord.submissionId;
        if (!firstWorksheetId) firstWorksheetId = incomingRecord.worksheetId;
      } catch (err) {
        skipped.push(`${file.name}: ${err instanceof Error ? err.message : 'Tệp PDF không hợp lệ.'}`);
      }
    }

    setImportReport({ imported, skipped, duplicateGraded });
    await refreshLocalLists();
    if (firstWorksheetId && !gradeWorksheetId) setGradeWorksheetId(firstWorksheetId);
    if (firstImportedId) setSelectedSubmissionId(firstImportedId);
    if (imported > 0) {
      notify(
        `Đã nhập thành công ${imported} bài nộp PDF của học sinh.`,
        'success'
      );
    } else if (skipped.length > 0) {
      notify(`Có ${skipped.length} tệp cần lưu ý. Xem chi tiết thông báo.`, 'warning');
    }
  };

  const updateActiveSubmissionGrade = async (
    updater: (rec: GradedSubmissionRecord) => GradedSubmissionRecord
  ) => {
    if (!activeSubmission) return;
    const updated = updater(activeSubmission);
    let sum = 0;
    let allFilled = true;
    for (const d of Object.values(updated.gradingDetails)) {
      if (typeof d.earnedPoints === 'number') {
        sum += d.earnedPoints;
      } else {
        allFilled = false;
      }
    }
    const finalRec: GradedSubmissionRecord = {
      ...updated,
      totalScore: Math.round(sum * 100) / 100,
      status: allFilled ? 'graded' : 'in_progress',
      updatedAt: Date.now(),
    };
    await interactiveStorage.saveSubmission(finalRec);
    setSubmissions((prev) =>
      prev.map((s) => (s.submissionId === finalRec.submissionId ? finalRec : s))
    );
  };

  const handleExportGradedReturnPdf = async () => {
    if (!activeSubmission) return;
    const ws = activeTeacherMaster?.worksheet || activeSubmission.worksheetSnapshot;
    if (!ws) return;
    try {
      const bytes = await renderInteractiveAnswersToPdf({
        pdfBytes: activeSubmission.pdfBytes,
        worksheet: ws,
        student: activeSubmission.student,
        answers: activeSubmission.answers,
        plainAnnotations: activeSubmission.plainAnnotations,
        grading: {
          gradingDetails: activeSubmission.gradingDetails,
          totalScore: activeSubmission.totalScore,
          maxScore: activeSubmission.maxScore,
          teacherComment: activeSubmission.teacherComment,
          answerKeys: activeTeacherMaster?.answerKeys,
        },
      });
      const safeStu = activeSubmission.student.studentName
        .replace(/[^a-zA-Z0-9\u00C0-\u024F\u1E00-\u1EFF_-]+/g, '_')
        .slice(0, 40);
      triggerInteractiveDownload(
        bytes,
        `TraBai_${safeStu}_${activeSubmission.totalScore}d.pdf`,
        'application/pdf'
      );
      notify(
        'Đã xuất PDF trả bài có kèm đáp án, đường nối, điểm số và nhận xét giáo viên.',
        'success'
      );
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Không thể xuất PDF trả bài.', 'error');
    }
  };

  const handleExportGradebookExcel = () => {
    const ws = activeTeacherMaster?.worksheet || filteredSubmissions[0]?.worksheetSnapshot;
    if (!ws || filteredSubmissions.length === 0) {
      notify('Chưa có bài nộp nào để xuất bảng điểm Excel.', 'warning');
      return;
    }
    try {
      const buf = buildInteractiveGradebookBuffer(ws, filteredSubmissions);
      const safeTitle = ws.title
        .replace(/[^a-zA-Z0-9\u00C0-\u024F\u1E00-\u1EFF_-]+/g, '_')
        .slice(0, 45);
      triggerInteractiveDownload(
        buf,
        `BangDiem_${safeTitle}.xlsx`,
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      notify(`Đã xuất bảng điểm Excel (.xlsx) cho ${filteredSubmissions.length} học sinh.`, 'success');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Không thể xuất bảng điểm Excel.', 'error');
    }
  };

  // Computed helpers
  const solveProgress = useMemo(() => {
    if (!solveWorksheet) return { done: 0, total: 0 };
    const total = solveWorksheet.questions.length;
    const done = solveWorksheet.questions.filter((q) =>
      isQuestionAnswered(q, solveAnswers[q.id])
    ).length;
    return { done, total };
  }, [solveWorksheet, solveAnswers]);

  const visibleSolveQuestions = useMemo(() => {
    if (!solveWorksheet) return [];
    if (!solveFilterUnanswered) return solveWorksheet.questions;
    return solveWorksheet.questions.filter((q) => !isQuestionAnswered(q, solveAnswers[q.id]));
  }, [solveWorksheet, solveAnswers, solveFilterUnanswered]);

  const selectedAuthorQuestion = useMemo(
    () => authorWorksheet?.questions.find((q) => q.id === selectedAuthorQId) || null,
    [authorWorksheet, selectedAuthorQId]
  );

  const authorReviewStats = useMemo(() => {
    const qs = authorWorksheet?.questions || [];
    const approved = qs.filter((q) => q.teacherApproved).length;
    const needsReview = qs.filter((q) => q.needsReview && !q.teacherApproved).length;
    return { total: qs.length, approved, needsReview };
  }, [authorWorksheet]);

  const gradingWorksheet =
    activeTeacherMaster?.worksheet || activeSubmission?.worksheetSnapshot || null;

  const detectedLessonShortcuts = useMemo(() => {
    if (!rawPdfInfo) return [];
    const lessons: Array<{ title: string; startPage: number; endPage: number }> = [];
    rawPdfInfo.pages.forEach((p) => {
      if (p.heading) {
        if (lessons.length > 0) {
          lessons[lessons.length - 1].endPage = Math.max(
            lessons[lessons.length - 1].startPage,
            p.pdfPageNumber - 1
          );
        }
        lessons.push({
          title: p.heading,
          startPage: p.pdfPageNumber,
          endPage: Math.min(rawPdfInfo.totalPages, p.pdfPageNumber + 2),
        });
      }
    });
    return lessons.slice(0, 12);
  }, [rawPdfInfo]);

  const authorSourcePages = useMemo(
    () => authorWorksheet?.pageMapping?.sourcePdfPages,
    [authorWorksheet]
  );
  const authorPrintedLabels = useMemo(
    () => authorWorksheet?.pageMapping?.printedPageLabels,
    [authorWorksheet]
  );

  const solveSourcePages = useMemo(
    () => solveWorksheet?.pageMapping?.sourcePdfPages,
    [solveWorksheet]
  );
  const solvePrintedLabels = useMemo(
    () => solveWorksheet?.pageMapping?.printedPageLabels,
    [solveWorksheet]
  );

  const SUB_TABS: Array<{
    id: InteractiveSubTab;
    label: string;
    icon: React.ReactNode;
    badge?: number;
  }> = [
    { id: 'author', label: 'Tạo bài tập', icon: <PenTool className="w-4 h-4" /> },
    { id: 'assign', label: 'Giao bài', icon: <Send className="w-4 h-4" />, badge: assignments.length },
    { id: 'solve', label: 'Làm bài', icon: <Edit3 className="w-4 h-4" /> },
    { id: 'saved', label: 'Bài đã lưu', icon: <HardDrive className="w-4 h-4" />, badge: savedDrafts.length },
    {
      id: 'grade',
      label: 'Thu bài & Chấm bài',
      icon: <GraduationCap className="w-4 h-4" />,
      badge: submissions.length,
    },
  ];

  // Single contextual guidance banner tailored strictly to the teacher's current state
  const contextualGuidance = useMemo(() => {
    if (!authorWorksheet || !authorPdfBytes) {
      return 'Thầy cô hãy nhấn Tải PDF để chọn tài liệu từ máy tính.';
    }
    if (authorStep === 1) {
      return 'Tài liệu đã sẵn sàng. Thầy cô hãy chọn trang cần giao.';
    }
    if (authorWorksheet.questions.length === 0) {
      return 'Nhấn Tạo bài tập tự động để ứng dụng tìm câu hỏi.';
    }
    if (authorReviewStats.approved < authorReviewStats.total) {
      return 'Thầy cô hãy kiểm tra các câu hỏi được đánh dấu trên PDF.';
    }
    return 'Bài tập đã sẵn sàng. Thầy cô có thể xem thử hoặc lưu PDF.';
  }, [authorWorksheet, authorPdfBytes, authorStep, authorReviewStats]);

  const currentShownPagesLabel = useMemo(() => {
    if (!authorWorksheet?.pageMapping?.sourcePdfPages?.length) return '';
    return formatSelectedPagesVi(authorWorksheet.pageMapping.sourcePdfPages);
  }, [authorWorksheet]);

  return (
    <div className="flex-1 flex flex-col min-h-0 min-w-0 bg-[#F4F8F7] text-[#0F172A]">
      {/* Top Integrated Workspace Navigation Bar */}
      <div className="bg-white border-b border-slate-200 px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap shrink-0">
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={closeInteractive}
            className="inline-flex items-center gap-2 px-3.5 min-h-[44px] rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-[#164E63] font-bold text-[15.5px] cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại</span>
          </button>

          <div className="h-6 w-px bg-slate-200 hidden sm:block" />

          <div className="flex items-center gap-1.5 flex-wrap">
            {SUB_TABS.map((t) => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setInteractiveTab(t.id)}
                  className={`inline-flex items-center gap-2 px-3.5 min-h-[44px] rounded-xl text-[15.5px] font-bold transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#087F70] text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-800 hover:bg-[#E6F1EF] hover:text-[#164E63]'
                  }`}
                >
                  {t.icon}
                  <span>{t.label}</span>
                  {typeof t.badge === 'number' && t.badge > 0 && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[13px] font-bold ${
                        active ? 'bg-white/25 text-white' : 'bg-[#164E63]/10 text-[#164E63]'
                      }`}
                    >
                      {t.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Prominent Dedicated User Guide Button */}
        <button
          type="button"
          onClick={() => setInteractiveTab('guide')}
          className={`inline-flex items-center gap-2 px-4 min-h-[44px] rounded-xl text-[16px] font-bold transition-colors cursor-pointer shrink-0 ${
            tab === 'guide'
              ? 'bg-[#164E63] text-white shadow-2xs'
              : 'bg-[#E6F1EF] hover:bg-teal-100 text-[#164E63] border border-[#087F70]/40'
          }`}
        >
          <BookOpen className="w-5 h-5" />
          <span>HƯỚNG DẪN SỬ DỤNG</span>
        </button>
      </div>

      {/* Quota Warning Banner (if IndexedDB quota is exceeded) */}
      {quotaBanner && (
        <div className="bg-amber-50 border-b border-amber-300 px-4 py-3 flex items-center justify-between gap-3 text-[16px] text-amber-950 shrink-0">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0" />
            <span>{quotaBanner}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {solveWorksheet && (
              <button
                type="button"
                onClick={handleExportSubmissionPackage}
                className="px-3.5 min-h-[44px] rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-[15px] cursor-pointer"
              >
                Tải sao lưu PDF ngay
              </button>
            )}
            <button
              type="button"
              onClick={() => setQuotaBanner(null)}
              className="px-3 min-h-[44px] rounded-xl hover:bg-amber-200/60 text-[15px] font-bold cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* ===================================================================
          AREA 1: TẠO BÀI TẬP — 3-STEP SENIOR-FRIENDLY GUIDED WORKSPACE
          Prioritizes a WIDE PDF viewport + AT MOST 1 clean left panel!
      =================================================================== */}
      {tab === 'author' && (
        <div className="flex-1 flex min-h-0 min-w-0">
          {/* Single Left Panel: Either Question Editor (when editing a question) OR 3-Step Guide */}
          {!authorPreviewStudent && (
            <aside className="w-[385px] xl:w-[415px] bg-white border-r border-slate-200 flex flex-col min-h-0 shrink-0">
              {selectedAuthorQuestion && authorWorksheet ? (
                <TeacherQuestionInspector
                  question={selectedAuthorQuestion}
                  answerKey={authorKeys[selectedAuthorQuestion.id]}
                  examMode={authorWorksheet.examMode}
                  onUpdateQuestion={(patch) =>
                    updateAuthorQuestion(selectedAuthorQuestion.id, patch)
                  }
                  onChangeQuestionType={(nextType) =>
                    handleChangeAuthorQuestionType(selectedAuthorQuestion.id, nextType)
                  }
                  onUpdateKey={(nextKey) =>
                    setAuthorKeys((prev) => ({
                      ...prev,
                      [selectedAuthorQuestion.id]: nextKey,
                    }))
                  }
                  onDeleteQuestion={() => deleteAuthorQuestion(selectedAuthorQuestion.id)}
                  onSaveAndClose={() => {
                    setSelectedAuthorQId(null);
                    setEditingQuestionSnapshot(null);
                    notify(`Đã lưu ${selectedAuthorQuestion.code}.`, 'success');
                  }}
                  onCancel={cancelQuestionEdit}
                />
              ) : (
                <>
                  {/* 3-Step Visual Progress Header */}
                  <div className="p-3.5 border-b border-slate-200 bg-[#F8FBFA] shrink-0 space-y-3">
                    <div className="grid grid-cols-3 gap-1.5">
                      {(
                        [
                          { step: 1 as const, label: '1. Chọn bài' },
                          { step: 2 as const, label: '2. Tạo bài' },
                          { step: 3 as const, label: '3. Kiểm tra' },
                        ] as const
                      ).map((item) => {
                        const isActive = authorStep === item.step;
                        const isDone =
                          (item.step === 1 && Boolean(authorPdfBytes)) ||
                          (item.step === 2 && (authorWorksheet?.questions.length || 0) > 0) ||
                          (item.step === 3 &&
                            authorReviewStats.total > 0 &&
                            authorReviewStats.approved === authorReviewStats.total);
                        const disabled = item.step > 1 && !authorPdfBytes;
                        return (
                          <button
                            key={item.step}
                            type="button"
                            disabled={disabled}
                            onClick={() => {
                              setAuthorStep(item.step);
                              setAuthorActionAlert(null);
                            }}
                            className={`min-h-[44px] px-2 rounded-xl text-[15px] font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed ${
                              isActive
                                ? 'bg-[#164E63] text-white shadow-2xs'
                                : isDone
                                  ? 'bg-[#E6F1EF] text-[#164E63] hover:bg-teal-100'
                                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            {isDone && !isActive && (
                              <Check className="w-4 h-4 text-[#087F70] shrink-0" />
                            )}
                            <span className="truncate">{item.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Single Contextual Guidance Banner */}
                    <div className="rounded-xl bg-[#E6F1EF] border border-teal-200 px-3.5 py-2.5 flex items-start gap-2.5 text-[16px] text-[#164E63] font-medium leading-snug">
                      <Info className="w-5 h-5 text-[#087F70] shrink-0 mt-0.5" />
                      <span>{contextualGuidance}</span>
                    </div>
                  </div>

                  {/* Scrollable Step Body */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-5 text-[16px]">
                    {/* ===================== STEP 1: CHỌN BÀI TẬP CẦN GIAO ===================== */}
                    {authorStep === 1 && (
                      <div className="space-y-5">
                        <div className="space-y-1.5">
                          <h2 className="text-[21px] font-bold text-[#164E63]">
                            1. Chọn bài tập cần giao
                          </h2>
                          <p className="text-[16px] text-slate-700 leading-relaxed">
                            Thầy cô tải tệp PDF lên, sau đó chọn những trang muốn giao cho học sinh.
                          </p>
                        </div>

                        {/* Primary Upload Action */}
                        <div className="space-y-2.5">
                          <button
                            type="button"
                            onClick={() => authorPdfInputRef.current?.click()}
                            className="w-full inline-flex items-center justify-center gap-2.5 min-h-[52px] px-4 rounded-xl bg-[#087F70] hover:bg-[#06695d] text-white font-bold text-[17px] cursor-pointer shadow-2xs"
                          >
                            <Upload className="w-5 h-5" />
                            <span>{authorPdfBytes ? 'Chọn tệp PDF khác' : 'Tải PDF'}</span>
                          </button>

                          {activeStudioDoc && (
                            <button
                              type="button"
                              onClick={() =>
                                createAuthorFromPdfBytes(
                                  activeStudioDoc.title,
                                  activeStudioDoc.currentPdfBytes,
                                  activeStudioDoc.subjectHint
                                )
                              }
                              className="w-full inline-flex items-center justify-center gap-2 min-h-[46px] px-4 rounded-xl border border-[#087F70] bg-[#F4F8F7] hover:bg-teal-50 text-[#164E63] font-bold text-[16px] cursor-pointer"
                            >
                              <FileText className="w-5 h-5 shrink-0 text-[#087F70]" />
                              <span className="truncate">Dùng tài liệu PDF đang mở</span>
                            </button>
                          )}
                        </div>

                        {/* Resume Auto-Saved Teacher Work-In-Progress */}
                        {!authorPdfBytes && teacherWorksheets.length > 0 && (
                          <div className="rounded-xl border border-teal-200 bg-[#F4F8F7] p-4 space-y-2.5">
                            <div className="text-[16px] font-bold text-[#164E63]">
                              Tiếp tục bài tập đang soạn
                            </div>
                            <div className="space-y-2">
                              {teacherWorksheets.slice(0, 3).map((tw) => (
                                <button
                                  key={tw.worksheetId}
                                  type="button"
                                  onClick={() => {
                                    setAuthorWorksheet(tw.worksheet);
                                    setAuthorKeys(tw.answerKeys);
                                    setAuthorPdfBytes(tw.pdfBytes);
                                    setRawUploadedPdfBytes(tw.pdfBytes);
                                    setRawPdfInfo(null);
                                    setSelectedAuthorQId(null);
                                    setEditingQuestionSnapshot(null);
                                    setAuthorStep(tw.worksheet.questions.length > 0 ? 3 : 2);
                                    notify(`Đã mở lại bài tập "${tw.worksheet.title}".`, 'success');
                                  }}
                                  className="w-full text-left rounded-xl bg-white border border-slate-200 hover:border-[#087F70] p-3 cursor-pointer space-y-0.5"
                                >
                                  <div className="text-[16px] font-bold text-[#164E63] truncate">
                                    {tw.worksheet.title}
                                  </div>
                                  <div className="text-[14.5px] text-slate-600">
                                    {tw.worksheet.questions.length} câu hỏi · Lưu lúc{' '}
                                    {new Date(tw.updatedAt).toLocaleTimeString('vi-VN', {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Page Selection Card (when PDF loaded) */}
                        {authorWorksheet && authorPdfBytes && (
                          <div className="rounded-xl border border-slate-200 bg-[#F8FBFA] p-4 space-y-4">
                            <div className="space-y-1">
                              <div className="text-[17px] font-bold text-[#164E63]">
                                Chọn trang cần giao
                              </div>
                              <div className="text-[15.5px] text-slate-700">
                                Tài liệu: <strong>{authorWorksheet.title}</strong>
                                {rawPdfInfo ? ` (${rawPdfInfo.totalPages} trang)` : ''}
                              </div>
                            </div>

                            {rawPdfInfo && rawPdfInfo.totalPages > 1 ? (
                              <>
                                {/* Simple 3-Mode Selector */}
                                <div className="grid grid-cols-3 gap-1.5">
                                  {(
                                    [
                                      { id: 'all' as const, label: 'Tất cả' },
                                      { id: 'range' as const, label: 'Từ ... đến ...' },
                                      { id: 'custom' as const, label: 'Nhập tự do' },
                                    ] as const
                                  ).map((m) => (
                                    <button
                                      key={m.id}
                                      type="button"
                                      onClick={() => setPageSelectMode(m.id)}
                                      className={`min-h-[44px] px-2 rounded-xl border text-[15px] font-bold cursor-pointer ${
                                        pageSelectMode === m.id
                                          ? 'bg-[#164E63] border-[#164E63] text-white'
                                          : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'
                                      }`}
                                    >
                                      {m.label}
                                    </button>
                                  ))}
                                </div>

                                {pageSelectMode === 'range' && (
                                  <div className="grid grid-cols-2 gap-3">
                                    <label className="space-y-1">
                                      <span className="block text-[15.5px] font-semibold text-slate-800">
                                        Từ trang
                                      </span>
                                      <input
                                        ref={pageSpecInputRef}
                                        type="number"
                                        min={1}
                                        max={rawPdfInfo.totalPages}
                                        value={rangeStartPage}
                                        onChange={(e) => setRangeStartPage(e.target.value)}
                                        className="w-full min-h-[46px] rounded-xl border border-slate-300 bg-white px-3.5 text-[17px] font-bold text-[#164E63]"
                                      />
                                    </label>
                                    <label className="space-y-1">
                                      <span className="block text-[15.5px] font-semibold text-slate-800">
                                        Đến trang
                                      </span>
                                      <input
                                        type="number"
                                        min={1}
                                        max={rawPdfInfo.totalPages}
                                        value={rangeEndPage}
                                        onChange={(e) => setRangeEndPage(e.target.value)}
                                        className="w-full min-h-[46px] rounded-xl border border-slate-300 bg-white px-3.5 text-[17px] font-bold text-[#164E63]"
                                      />
                                    </label>
                                  </div>
                                )}

                                {pageSelectMode === 'custom' && (
                                  <label className="block space-y-1.5">
                                    <span className="block text-[15.5px] font-semibold text-slate-800">
                                      Nhập các trang muốn chọn (ví dụ: 2 hoặc 2-3 hoặc 2, 3, 7-9)
                                    </span>
                                    <input
                                      ref={pageSpecInputRef}
                                      type="text"
                                      value={pageSpecInput}
                                      onChange={(e) => setPageSpecInput(e.target.value)}
                                      placeholder="Ví dụ: 2-3 hoặc 2, 3, 7-9"
                                      className="w-full min-h-[46px] rounded-xl border border-slate-300 bg-white px-3.5 text-[16.5px] font-semibold text-[#164E63]"
                                    />
                                  </label>
                                )}

                                {/* Detected Lesson Shortcuts */}
                                {detectedLessonShortcuts.length > 0 && (
                                  <label className="block space-y-1.5">
                                    <span className="block text-[15.5px] font-semibold text-slate-800">
                                      Hoặc chọn nhanh theo bài học
                                    </span>
                                    <select
                                      defaultValue=""
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        if (!val) return;
                                        const parts = val.split('-');
                                        setPageSelectMode('range');
                                        setRangeStartPage(parts[0]);
                                        setRangeEndPage(parts[1] || parts[0]);
                                        setPageSpecInput(val);
                                        handleExtractSelectedPages(val);
                                        e.target.value = '';
                                      }}
                                      className="w-full min-h-[46px] rounded-xl border border-slate-300 bg-white px-3 text-[15.5px] text-slate-800"
                                    >
                                      <option value="">-- Chọn nhanh bài học trong tài liệu --</option>
                                      {detectedLessonShortcuts.map((ls, idx) => {
                                        const spec =
                                          ls.startPage === ls.endPage
                                            ? `${ls.startPage}`
                                            : `${ls.startPage}-${ls.endPage}`;
                                        return (
                                          <option key={idx} value={spec}>
                                            Trang {spec}: {ls.title.slice(0, 42)}
                                          </option>
                                        );
                                      })}
                                    </select>
                                  </label>
                                )}

                                {/* Friendly Preview OR Actionable Error */}
                                {pageValidation.valid ? (
                                  <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-3.5 py-2.5 text-[15.5px] text-emerald-950 font-semibold flex items-center justify-between gap-2 flex-wrap">
                                    <span>
                                      Đang chọn: {pageValidation.summaryText} ({pageValidation.pages.length}{' '}
                                      trang)
                                    </span>
                                    {effectivePageSpec.trim() !== appliedPageSpec && (
                                      <button
                                        type="button"
                                        disabled={extractingPages}
                                        onClick={() => handleExtractSelectedPages()}
                                        className="px-3 min-h-[38px] rounded-lg bg-white border border-emerald-400 hover:bg-emerald-100 text-emerald-900 text-[14.5px] font-bold cursor-pointer"
                                      >
                                        Xem ngay các trang này
                                      </button>
                                    )}
                                  </div>
                                ) : (
                                  <div className="rounded-xl bg-red-50 border border-red-300 p-3.5 space-y-2.5 text-[15.5px] text-red-900">
                                    <div className="font-bold flex items-start gap-2">
                                      <AlertTriangle className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
                                      <span>{pageValidation.errorMessage}</span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setPageSelectMode('range');
                                        setRangeStartPage('1');
                                        setRangeEndPage(String(Math.min(2, rawPdfInfo.totalPages)));
                                        setPageSpecInput(`1-${Math.min(2, rawPdfInfo.totalPages)}`);
                                      }}
                                      className="px-3.5 min-h-[42px] rounded-lg bg-white border border-red-300 hover:bg-red-100 text-red-800 font-bold text-[15px] cursor-pointer"
                                    >
                                      Đặt lại trang hợp lệ (1–{Math.min(2, rawPdfInfo.totalPages)})
                                    </button>
                                  </div>
                                )}
                              </>
                            ) : (
                              <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-3.5 py-2.5 text-[15.5px] text-emerald-950 font-semibold">
                                Tài liệu có 1 trang và đã sẵn sàng để tạo bài tập.
                              </div>
                            )}

                            <button
                              type="button"
                              disabled={extractingPages || !pageValidation.valid}
                              onClick={handleContinueFromStep1}
                              className="w-full inline-flex items-center justify-center gap-2 min-h-[50px] px-4 rounded-xl bg-[#164E63] hover:bg-[#113d4d] disabled:opacity-45 text-white font-bold text-[16.5px] cursor-pointer shadow-2xs"
                            >
                              {extractingPages ? (
                                <>
                                  <Loader2 className="w-5 h-5 animate-spin" />
                                  <span>Đang chuẩn bị các trang đã chọn...</span>
                                </>
                              ) : (
                                <>
                                  <span>Tiếp tục sang Bước 2</span>
                                  <ArrowRight className="w-5 h-5" />
                                </>
                              )}
                            </button>
                          </div>
                        )}

                        {/* Collapsible Templates & Teacher Master File */}
                        <div className="pt-2 border-t border-slate-200">
                          <button
                            type="button"
                            onClick={() => setShowSampleDrawer((v) => !v)}
                            className="w-full flex items-center justify-between min-h-[44px] px-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[15.5px] font-bold text-[#164E63] cursor-pointer"
                          >
                            <span>Mở bài mẫu có sẵn hoặc bản gốc GV</span>
                            {showSampleDrawer ? (
                              <ChevronUp className="w-5 h-5" />
                            ) : (
                              <ChevronDown className="w-5 h-5" />
                            )}
                          </button>

                          {showSampleDrawer && (
                            <div className="mt-3 space-y-3">
                              <button
                                type="button"
                                onClick={() => authorMasterInputRef.current?.click()}
                                className="w-full inline-flex items-center justify-center gap-2 min-h-[46px] px-3.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-[#164E63] font-bold text-[15.5px] cursor-pointer"
                              >
                                <FolderOpen className="w-5 h-5 text-[#087F70]" />
                                <span>Mở tệp bản gốc giáo viên (.pdf)</span>
                              </button>
                              <div className="text-[15px] font-bold text-slate-700">
                                Hoặc chọn nhanh 1 bài mẫu 8 môn THPT:
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                {INTERACTIVE_SUBJECT_TEMPLATES.map((tpl) => (
                                  <button
                                    key={tpl.id}
                                    type="button"
                                    onClick={() => loadTemplateIntoAuthor(tpl.id)}
                                    className="p-3 min-h-[54px] rounded-xl border border-slate-200 bg-[#F4F8F7] hover:border-[#087F70] hover:bg-teal-50 text-left cursor-pointer"
                                  >
                                    <div className="text-[15.5px] font-bold text-[#164E63]">
                                      {tpl.subjectLabel}
                                    </div>
                                    <div className="text-[14px] text-slate-600">Lớp {tpl.grade}</div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* ===================== STEP 2: TẠO BÀI TẬP ===================== */}
                    {authorStep === 2 && authorWorksheet && (
                      <div className="space-y-5">
                        <div className="space-y-1.5">
                          <h2 className="text-[21px] font-bold text-[#164E63]">2. Tạo bài tập</h2>
                          <p className="text-[16px] text-slate-700 leading-relaxed">
                            Nhấn nút bên dưới. Ứng dụng sẽ tìm câu hỏi và những vị trí học sinh cần trả lời.
                          </p>
                        </div>

                        {currentShownPagesLabel && (
                          <div className="rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-[15.5px] text-slate-700">
                            Phạm vi đang làm: <strong className="text-[#164E63]">{currentShownPagesLabel}</strong>
                          </div>
                        )}

                        {/* Big Single Primary Action Button */}
                        <button
                          type="button"
                          disabled={detectingQuestions || !authorPdfBytes}
                          onClick={handleRunPdfQuestionDetection}
                          className="w-full inline-flex items-center justify-center gap-2.5 min-h-[56px] px-4 rounded-xl bg-[#087F70] hover:bg-[#06695d] disabled:opacity-55 text-white font-bold text-[17px] cursor-pointer shadow-sm"
                        >
                          {detectingQuestions ? (
                            <>
                              <Loader2 className="w-6 h-6 animate-spin" />
                              <span>Đang tìm câu hỏi...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-6 h-6" />
                              <span>TẠO BÀI TẬP TỰ ĐỘNG</span>
                            </>
                          )}
                        </button>

                        {detectingQuestions && (
                          <div className="rounded-xl bg-teal-50 border border-teal-200 p-4 text-[16px] text-[#164E63] font-medium">
                            Đang tìm câu hỏi trong tài liệu. Thầy cô vui lòng chờ...
                          </div>
                        )}

                        {/* Honest Detection Result Notes */}
                        {detectionNotes.length > 0 && !detectingQuestions && (
                          <div className="rounded-xl bg-amber-50 border border-amber-300 p-4 space-y-2 text-[15.5px] text-amber-950 leading-relaxed">
                            {detectionNotes.map((n, idx) => (
                              <div key={idx} className="flex items-start gap-2">
                                <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                                <span>{n}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Clean + THÊM CÂU HỎI Menu (all 14 question types tucked cleanly inside) */}
                        <div className="pt-3 border-t border-slate-200 space-y-3">
                          <div className="text-[15.5px] text-slate-700">
                            Hoặc thầy cô tự thêm từng câu hỏi trực tiếp lên trang PDF:
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowAddQuestionMenu((v) => !v)}
                            className="w-full inline-flex items-center justify-center gap-2 min-h-[48px] px-4 rounded-xl border-2 border-[#164E63] bg-white hover:bg-[#E6F1EF] text-[#164E63] font-bold text-[16px] cursor-pointer"
                          >
                            <Plus className="w-5 h-5" />
                            <span>+ THÊM CÂU HỎI</span>
                          </button>

                          {showAddQuestionMenu && (
                            <div className="rounded-xl border border-slate-200 bg-[#F8FBFA] p-3 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[15.5px] font-bold text-[#164E63]">
                                  Chọn loại câu hỏi (14 dạng)
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setShowAddQuestionMenu(false);
                                    setPlacingType(null);
                                  }}
                                  className="px-2.5 py-1 rounded-lg text-[14.5px] font-bold text-slate-700 hover:bg-slate-200 cursor-pointer"
                                >
                                  Đóng
                                </button>
                              </div>
                              <p className="text-[14.5px] text-slate-700">
                                Chọn 1 dạng bên dưới rồi nhấn vào vị trí cần trả lời trên trang PDF bên phải:
                              </p>
                              <div className="grid grid-cols-1 gap-1.5">
                                {ALL_QUESTION_TYPES.map((qType) => {
                                  const meta = QUESTION_TYPE_META[qType];
                                  const active = placingType === qType;
                                  return (
                                    <button
                                      key={qType}
                                      type="button"
                                      onClick={() => setPlacingType(active ? null : qType)}
                                      className={`flex items-center justify-between gap-2 px-3.5 min-h-[44px] rounded-xl border text-left text-[15.5px] font-semibold transition-colors cursor-pointer ${
                                        active
                                          ? 'bg-[#087F70] border-[#087F70] text-white'
                                          : 'bg-white border-slate-200 text-slate-900 hover:border-[#087F70] hover:bg-teal-50/50'
                                      }`}
                                    >
                                      <span>{meta.shortLabel}</span>
                                      <span
                                        className={`text-[13.5px] px-2 py-0.5 rounded-md font-bold shrink-0 ${
                                          active
                                            ? 'bg-white/20 text-white'
                                            : meta.autoGradable === 'manual'
                                              ? 'bg-amber-50 text-amber-900'
                                              : 'bg-teal-50 text-[#087F70]'
                                        }`}
                                      >
                                        {meta.autoGradable === 'manual' ? 'GV chấm' : 'Chấm nhanh'}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Step 2 Navigation */}
                        <div className="pt-3 border-t border-slate-200 grid grid-cols-2 gap-2.5">
                          <button
                            type="button"
                            onClick={() => setAuthorStep(1)}
                            className="inline-flex items-center justify-center gap-1.5 min-h-[48px] px-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-bold text-[15.5px] cursor-pointer"
                          >
                            <ArrowLeft className="w-4 h-4" />
                            <span>Quay lại Bước 1</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setAuthorStep(3)}
                            className="inline-flex items-center justify-center gap-1.5 min-h-[48px] px-3 rounded-xl bg-[#164E63] hover:bg-[#113d4d] text-white font-bold text-[15.5px] cursor-pointer"
                          >
                            <span>Sang Bước 3</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* ===================== STEP 3: KIỂM TRA VÀ GIAO BÀI ===================== */}
                    {authorStep === 3 && authorWorksheet && (
                      <div className="space-y-5">
                        <div className="space-y-1.5">
                          <h2 className="text-[21px] font-bold text-[#164E63]">
                            3. Kiểm tra và giao bài
                          </h2>
                          <p className="text-[16px] text-slate-700 leading-relaxed">
                            Thầy cô xem lại các câu hỏi. Nếu đúng, hãy lưu PDF để gửi cho học sinh.
                          </p>
                        </div>

                        {/* Worksheet Title */}
                        <label className="block space-y-1.5">
                          <span className="block text-[15.5px] font-bold text-[#164E63]">
                            Tên bài tập
                          </span>
                          <input
                            type="text"
                            value={authorWorksheet.title}
                            onChange={(e) =>
                              setAuthorWorksheet({ ...authorWorksheet, title: e.target.value })
                            }
                            placeholder="Nhập tên bài tập..."
                            className="w-full min-h-[46px] rounded-xl border border-slate-300 bg-white px-3.5 text-[16px] font-bold text-[#164E63] focus:border-[#087F70] outline-none"
                          />
                        </label>

                        {/* Actionable Alert Banner (if teacher clicks Save/Assign before questions exist) */}
                        {authorActionAlert && (
                          <div className="rounded-xl bg-amber-50 border-2 border-amber-400 p-4 space-y-2.5 text-[15.5px] text-amber-950">
                            <div className="font-bold flex items-start gap-2">
                              <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                              <span>{authorActionAlert.title}</span>
                            </div>
                            <p className="leading-relaxed">{authorActionAlert.detail}</p>
                            <button
                              type="button"
                              onClick={authorActionAlert.onAction}
                              className="w-full min-h-[44px] rounded-xl bg-[#087F70] hover:bg-[#06695d] text-white font-bold text-[15.5px] cursor-pointer"
                            >
                              {authorActionAlert.actionLabel}
                            </button>
                          </div>
                        )}

                        {/* Post-Save Confirmation & Short Zalo Reminder */}
                        {justSavedStudentPdfName && (
                          <div className="rounded-xl bg-emerald-50 border border-emerald-300 p-4 space-y-1.5 text-[15.5px] text-emerald-950">
                            <div className="font-bold flex items-center gap-2">
                              <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
                              <span>Đã lưu tệp PDF bài tập thành công!</span>
                            </div>
                            <p className="leading-relaxed">
                              Tên tệp: <strong>{justSavedStudentPdfName}</strong>. Thầy cô hãy mở Zalo lớp → nhấn kẹp giấy <strong>Gửi tệp</strong> để gửi cho học sinh.
                            </p>
                          </div>
                        )}

                        {/* Primary 4 Action Buttons (min 48px, never crowded) */}
                        <div className="space-y-2.5">
                          <div className="grid grid-cols-2 gap-2.5">
                            <button
                              type="button"
                              onClick={() => {
                                setAuthorPreviewStudent(true);
                                setPlacingType(null);
                              }}
                              className="inline-flex items-center justify-center gap-2 min-h-[48px] px-3 rounded-xl border-2 border-[#164E63] bg-white hover:bg-[#E6F1EF] text-[#164E63] font-bold text-[15.5px] cursor-pointer"
                            >
                              <Eye className="w-5 h-5" />
                              <span>Xem thử bài tập</span>
                            </button>
                            <button
                              type="button"
                              disabled={authorWorksheet.questions.length === 0}
                              onClick={() => {
                                const firstUnchecked =
                                  authorWorksheet.questions.find((q) => !q.teacherApproved) ||
                                  authorWorksheet.questions[0];
                                if (firstUnchecked) openQuestionForEdit(firstUnchecked.id);
                              }}
                              className="inline-flex items-center justify-center gap-2 min-h-[48px] px-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-45 text-slate-800 font-bold text-[15.5px] cursor-pointer"
                            >
                              <Edit3 className="w-5 h-5 text-[#087F70]" />
                              <span>Sửa câu hỏi</span>
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={handleExportStudentPackage}
                            className="w-full inline-flex items-center justify-center gap-2 min-h-[52px] px-4 rounded-xl bg-[#087F70] hover:bg-[#06695d] text-white font-bold text-[17px] cursor-pointer shadow-sm"
                          >
                            <FileDown className="w-5 h-5" />
                            <span>Lưu PDF</span>
                          </button>

                          <button
                            type="button"
                            onClick={handleProceedToAssign}
                            className="w-full inline-flex items-center justify-center gap-2 min-h-[48px] px-4 rounded-xl bg-[#164E63] hover:bg-[#113d4d] text-white font-bold text-[16px] cursor-pointer"
                          >
                            <Send className="w-5 h-5" />
                            <span>Giao bài</span>
                          </button>
                        </div>

                        {/* Question Review List */}
                        <div className="pt-3 border-t border-slate-200 space-y-3">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="text-[17px] font-bold text-[#164E63] flex items-center gap-2">
                              <ListChecks className="w-5 h-5 text-[#087F70]" />
                              <span>Danh sách câu hỏi ({authorReviewStats.total})</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setShowAddQuestionMenu((v) => !v)}
                              className="inline-flex items-center gap-1.5 px-3 min-h-[40px] rounded-xl border border-[#087F70] bg-teal-50 hover:bg-teal-100 text-[#164E63] font-bold text-[14.5px] cursor-pointer"
                            >
                              <Plus className="w-4 h-4" />
                              <span>Thêm câu hỏi</span>
                            </button>
                          </div>

                          {showAddQuestionMenu && (
                            <div className="rounded-xl border border-slate-200 bg-[#F8FBFA] p-3 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[15px] font-bold text-[#164E63]">
                                  Chọn dạng câu hỏi rồi nhấn vào trang PDF:
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setShowAddQuestionMenu(false);
                                    setPlacingType(null);
                                  }}
                                  className="px-2 py-1 rounded-lg text-[14px] font-bold text-slate-700 hover:bg-slate-200 cursor-pointer"
                                >
                                  Đóng
                                </button>
                              </div>
                              <div className="grid grid-cols-1 gap-1.5 max-h-64 overflow-y-auto pr-1">
                                {ALL_QUESTION_TYPES.map((qType) => {
                                  const meta = QUESTION_TYPE_META[qType];
                                  const active = placingType === qType;
                                  return (
                                    <button
                                      key={qType}
                                      type="button"
                                      onClick={() => setPlacingType(active ? null : qType)}
                                      className={`flex items-center justify-between gap-2 px-3 min-h-[42px] rounded-lg border text-left text-[15px] font-semibold cursor-pointer ${
                                        active
                                          ? 'bg-[#087F70] border-[#087F70] text-white'
                                          : 'bg-white border-slate-200 text-slate-900 hover:border-[#087F70]'
                                      }`}
                                    >
                                      <span>{meta.shortLabel}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {authorReviewStats.total > 0 &&
                            authorReviewStats.approved < authorReviewStats.total && (
                              <button
                                type="button"
                                onClick={approveAllAuthorQuestions}
                                className="w-full min-h-[44px] px-3.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-900 font-bold text-[15px] cursor-pointer"
                              >
                                Đánh dấu đã kiểm tra tất cả ({authorReviewStats.total - authorReviewStats.approved} câu còn lại)
                              </button>
                            )}

                          {authorWorksheet.questions.length === 0 ? (
                            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-3 text-[15.5px] text-slate-700">
                              <p>Chưa tạo bài tập. Thầy cô hãy nhấn Tạo bài tập tự động.</p>
                              <button
                                type="button"
                                onClick={() => setAuthorStep(2)}
                                className="w-full min-h-[46px] rounded-xl bg-[#087F70] hover:bg-[#06695d] text-white font-bold text-[16px] cursor-pointer"
                              >
                                Quay lại Bước 2 để tạo bài tập
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {authorWorksheet.questions.map((q) => {
                                const needsCheck = !q.teacherApproved;
                                return (
                                  <button
                                    key={q.id}
                                    type="button"
                                    onClick={() => openQuestionForEdit(q.id)}
                                    className={`w-full text-left rounded-xl border p-3.5 transition-colors cursor-pointer space-y-1.5 ${
                                      needsCheck
                                        ? 'border-amber-300 bg-amber-50/40 hover:border-amber-500'
                                        : 'border-slate-200 bg-white hover:border-[#087F70]'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="font-bold text-[16px] text-[#164E63] truncate">
                                        {q.code} · {QUESTION_TYPE_META[q.type].shortLabel}
                                      </span>
                                      <span className="text-[15px] font-bold text-slate-700 shrink-0">
                                        {q.maxPoints} điểm
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between gap-2 text-[14.5px]">
                                      <span className="text-slate-600">
                                        Trang {q.sourcePdfPageNumber ?? q.region.pageIndex + 1} · Nhấn để sửa
                                      </span>
                                      {q.teacherApproved ? (
                                        <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-900 font-bold">
                                          Đã kiểm tra
                                        </span>
                                      ) : (
                                        <span className="px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-950 font-bold">
                                          Cần kiểm tra
                                        </span>
                                      )}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Collapsible Extra Settings + Auto-Save Status + Reset */}
                        <div className="pt-3 border-t border-slate-200 space-y-3">
                          {authorAutoSavedAt && (
                            <div className="text-[14.5px] text-slate-600 flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4 text-[#087F70]" />
                              <span>
                                Đã tự lưu trên máy lúc{' '}
                                {new Date(authorAutoSavedAt).toLocaleTimeString('vi-VN', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={() => setShowMoreSettings((v) => !v)}
                            className="w-full flex items-center justify-between min-h-[44px] px-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[15.5px] font-bold text-[#164E63] cursor-pointer"
                          >
                            <span>Cài đặt thêm (Môn, Lớp, Sao lưu GV)</span>
                            {showMoreSettings ? (
                              <ChevronUp className="w-5 h-5" />
                            ) : (
                              <ChevronDown className="w-5 h-5" />
                            )}
                          </button>

                          {showMoreSettings && (
                            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-3">
                              <div className="grid grid-cols-2 gap-2.5">
                                <label className="space-y-1">
                                  <span className="block text-[14.5px] font-semibold text-slate-700">
                                    Môn học
                                  </span>
                                  <select
                                    value={authorWorksheet.subject}
                                    onChange={(e) => {
                                      const val = e.target.value as SubjectCategory;
                                      const label =
                                        SUBJECT_OPTIONS.find((s) => s.value === val)?.label ||
                                        'Tổng hợp';
                                      setAuthorWorksheet({
                                        ...authorWorksheet,
                                        subject: val,
                                        subjectLabel: label,
                                      });
                                    }}
                                    className="w-full min-h-[42px] rounded-lg border border-slate-300 bg-white px-2.5 text-[15px]"
                                  >
                                    {SUBJECT_OPTIONS.map((opt) => (
                                      <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                      </option>
                                    ))}
                                  </select>
                                </label>
                                <label className="space-y-1">
                                  <span className="block text-[14.5px] font-semibold text-slate-700">
                                    Khối lớp
                                  </span>
                                  <select
                                    value={authorWorksheet.grade}
                                    onChange={(e) =>
                                      setAuthorWorksheet({
                                        ...authorWorksheet,
                                        grade: Number(e.target.value) as GradeLevel,
                                      })
                                    }
                                    className="w-full min-h-[42px] rounded-lg border border-slate-300 bg-white px-2.5 text-[15px]"
                                  >
                                    <option value={10}>Lớp 10</option>
                                    <option value={11}>Lớp 11</option>
                                    <option value={12}>Lớp 12</option>
                                  </select>
                                </label>
                              </div>

                              <div className="grid grid-cols-2 gap-2.5">
                                <label className="space-y-1">
                                  <span className="block text-[14.5px] font-semibold text-slate-700">
                                    Chế độ làm bài
                                  </span>
                                  <select
                                    value={authorWorksheet.examMode}
                                    onChange={(e) =>
                                      setAuthorWorksheet({
                                        ...authorWorksheet,
                                        examMode: e.target.value as 'exam' | 'practice',
                                      })
                                    }
                                    className="w-full min-h-[42px] rounded-lg border border-slate-300 bg-white px-2.5 text-[15px]"
                                  >
                                    <option value="exam">Kiểm tra</option>
                                    <option value="practice">Luyện tập</option>
                                  </select>
                                </label>
                                <label className="space-y-1">
                                  <span className="block text-[14.5px] font-semibold text-slate-700">
                                    Thời gian (phút)
                                  </span>
                                  <input
                                    type="number"
                                    min={5}
                                    max={180}
                                    value={authorWorksheet.durationMinutes}
                                    onChange={(e) =>
                                      setAuthorWorksheet({
                                        ...authorWorksheet,
                                        durationMinutes: Math.max(5, Number(e.target.value) || 30),
                                      })
                                    }
                                    className="w-full min-h-[42px] rounded-lg border border-slate-300 bg-white px-2.5 text-[15px]"
                                  />
                                </label>
                              </div>

                              <label className="block space-y-1">
                                <span className="block text-[14.5px] font-semibold text-slate-700">
                                  Lời dặn học sinh
                                </span>
                                <textarea
                                  rows={2}
                                  value={authorWorksheet.instructions || ''}
                                  onChange={(e) =>
                                    setAuthorWorksheet({
                                      ...authorWorksheet,
                                      instructions: e.target.value,
                                    })
                                  }
                                  placeholder="Ví dụ: Các em làm bài cẩn thận và gửi lại trước 20h..."
                                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[15px]"
                                />
                              </label>

                              <button
                                type="button"
                                onClick={handleExportTeacherBackup}
                                className="w-full inline-flex items-center justify-center gap-2 min-h-[44px] rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-[#164E63] font-bold text-[15px] cursor-pointer"
                              >
                                <Download className="w-4 h-4 text-[#087F70]" />
                                <span>Tải bản sao lưu riêng cho giáo viên (.pdf)</span>
                              </button>
                            </div>
                          )}

                          {/* Back to Step 2 & Safe Reset */}
                          <div className="flex items-center justify-between gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setAuthorStep(2)}
                              className="inline-flex items-center gap-1.5 px-3 min-h-[44px] rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-bold text-[15px] cursor-pointer"
                            >
                              <ArrowLeft className="w-4 h-4" />
                              <span>Quay lại Bước 2</span>
                            </button>

                            {!confirmResetAuthor ? (
                              <button
                                type="button"
                                onClick={() => setConfirmResetAuthor(true)}
                                className="inline-flex items-center gap-1.5 px-3 min-h-[44px] rounded-xl border border-slate-300 bg-white hover:bg-red-50 hover:text-red-700 text-slate-700 font-bold text-[15px] cursor-pointer"
                              >
                                <RotateCcw className="w-4 h-4" />
                                <span>Làm lại</span>
                              </button>
                            ) : (
                              <div className="flex items-center gap-1.5 bg-red-50 border border-red-300 rounded-xl p-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAuthorWorksheet({
                                      ...authorWorksheet,
                                      questions: [],
                                      updatedAt: Date.now(),
                                    });
                                    setAuthorKeys({});
                                    setSelectedAuthorQId(null);
                                    setEditingQuestionSnapshot(null);
                                    setConfirmResetAuthor(false);
                                    setAuthorStep(2);
                                    notify('Đã xóa danh sách câu hỏi để thầy cô tạo lại.', 'info');
                                  }}
                                  className="px-3 min-h-[38px] rounded-lg bg-red-600 text-white font-bold text-[14.5px] cursor-pointer"
                                >
                                  Xóa làm lại
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmResetAuthor(false)}
                                  className="px-3 min-h-[38px] rounded-lg bg-white border border-slate-300 text-slate-800 font-bold text-[14.5px] cursor-pointer"
                                >
                                  Hủy
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </aside>
          )}

          {/* Wide Right Area: Student Preview Banner (when active) + Spacious Multi-Page PDF Canvas */}
          <div className="flex-1 flex flex-col min-w-0 min-h-0">
            {authorPreviewStudent && (
              <div className="bg-[#164E63] text-white px-5 py-3 flex items-center justify-between gap-3 flex-wrap shrink-0">
                <div className="flex items-center gap-2.5 text-[17px] font-bold">
                  <Eye className="w-6 h-6 text-teal-300 shrink-0" />
                  <span>
                    Đang xem thử như học sinh — Thầy cô có thể bấm thử các câu hỏi trên trang PDF bên dưới.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setAuthorPreviewStudent(false)}
                  className="inline-flex items-center gap-2 px-5 min-h-[46px] rounded-xl bg-white hover:bg-teal-50 text-[#164E63] font-bold text-[16px] cursor-pointer shadow-sm"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span>QUAY LẠI CHỈNH SỬA</span>
                </button>
              </div>
            )}

            <InteractivePdfCanvas
              pdfBytes={authorPdfBytes}
              questions={authorWorksheet?.questions || []}
              mode={authorPreviewStudent ? 'solve' : 'author'}
              examMode={authorWorksheet?.examMode || 'exam'}
              selectedQuestionId={authorPreviewStudent ? null : selectedAuthorQId}
              answers={authorPreviewStudent ? authorPreviewAnswers : undefined}
              teacherKeys={
                authorPreviewStudent && authorWorksheet?.examMode === 'practice'
                  ? authorKeys
                  : undefined
              }
              placingTypeLabel={
                !authorPreviewStudent && placingType
                  ? QUESTION_TYPE_META[placingType].shortLabel
                  : null
              }
              sourcePdfPages={authorSourcePages}
              printedPageLabels={authorPrintedLabels}
              scrollToQuestionNonce={authorScrollNonce}
              onCancelPlacing={() => setPlacingType(null)}
              onSelectQuestion={(id) => openQuestionForEdit(id)}
              onPlaceAtPoint={handlePlaceQuestionAtPoint}
              onUpdateRegion={(qId, patch) => {
                const q = authorWorksheet?.questions.find((item) => item.id === qId);
                if (q) updateAuthorQuestion(qId, { region: { ...q.region, ...patch } });
              }}
              onDeleteQuestion={deleteAuthorQuestion}
              onChangeAnswer={(qId, next) =>
                setAuthorPreviewAnswers((prev) => ({ ...prev, [qId]: next }))
              }
            />
          </div>
        </div>
      )}

      {/* ===================================================================
          AREA 2: GIAO BÀI (OFFLINE PACKAGE & HONEST ONLINE SHARE + MANAGER)
      =================================================================== */}
      {tab === 'assign' && (
        <AssignmentManagerPanel
          teacherWorksheets={teacherWorksheets}
          assignments={assignments}
          submissions={submissions}
          onRefresh={refreshLocalLists}
          onOpenInAuthor={(tw) => {
            setAuthorWorksheet(tw.worksheet);
            setAuthorKeys(tw.answerKeys);
            setAuthorPdfBytes(tw.pdfBytes);
            setRawUploadedPdfBytes(tw.pdfBytes);
            setRawPdfInfo(null);
            setSelectedAuthorQId(null);
            setEditingQuestionSnapshot(null);
            setAuthorStep(tw.worksheet.questions.length > 0 ? 3 : 2);
            setInteractiveTab('author');
          }}
          onOpenInGrade={(wsId) => {
            setGradeWorksheetId(wsId);
            setGradeModeTab('offline');
            setInteractiveTab('grade');
          }}
          onNotify={notify}
        />
      )}

      {/* ===================================================================
          AREA 3: LÀM BÀI (SHARED ONLINE/OFFLINE STUDENT WORKSPACE)
      =================================================================== */}
      {tab === 'solve' && (
        <div className="flex-1 flex flex-col min-h-0 min-w-0">
          {loadingOnlineUrl ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="bg-white rounded-xl px-6 py-4 shadow-md flex items-center gap-3 text-[15.5px] font-semibold text-[#164E63]">
                <Loader2 className="w-5 h-5 animate-spin text-[#087F70]" />
                <span>Đang tải bài tập từ liên kết trực tuyến...</span>
              </div>
            </div>
          ) : !solveWorksheet ? (
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-5xl mx-auto space-y-6">
                <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-2xs space-y-4">
                  <h2 className="text-[21px] font-bold text-[#164E63]">
                    Mở bài tập PDF tương tác để làm bài (Online hoặc Offline)
                  </h2>
                  <p className="text-[15.5px] text-slate-600">
                    Mở bất kỳ tệp <strong>PDF (*.pdf)</strong> hợp lệ nào — gồm bài tập PDF tương tác giáo viên gửi, bài làm đã lưu, hoặc tài liệu PDF thông thường để làm bài trực tiếp ngay trên trang.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="rounded-xl border-2 border-dashed border-[#087F70]/50 bg-[#F4F8F7] p-5 space-y-3">
                      <div className="text-[16px] font-bold text-[#164E63] flex items-center gap-2">
                        <FolderOpen className="w-5 h-5 text-[#087F70]" />
                        <span>Mở tệp bài tập PDF từ máy tính (Offline)</span>
                      </div>
                      <p className="text-[14.5px] text-slate-600">
                        Chấp nhận mọi tệp <strong>PDF (*.pdf)</strong> hợp lệ (bài tập tương tác, bài làm đã lưu hoặc phiếu bài tập PDF thông thường) để làm trực tiếp ngay cả khi không có Internet.
                      </p>
                      <button
                        type="button"
                        onClick={() => solvePackageInputRef.current?.click()}
                        className="px-4 py-2 rounded-lg bg-[#087F70] hover:bg-[#06695d] text-white font-semibold text-[15px] cursor-pointer"
                      >
                        Chọn tệp PDF (*.pdf) từ máy
                      </button>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-5 space-y-3">
                      <div className="text-[16px] font-bold text-[#164E63] flex items-center gap-2">
                        <Globe className="w-5 h-5 text-[#087F70]" />
                        <span>Mở bài tập từ đường dẫn trực tuyến (Online)</span>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={onlineUrlInput}
                          onChange={(e) => setOnlineUrlInput(e.target.value)}
                          placeholder="https://.../bai_tap.pdf"
                          className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-[14.5px] focus:border-[#087F70] outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleLoadOnlineUrl}
                          className="px-4 py-2 rounded-lg bg-[#164E63] hover:bg-[#113d4d] text-white font-semibold text-[14.5px] cursor-pointer shrink-0"
                        >
                          Tải bài
                        </button>
                      </div>
                      <p className="text-[13.5px] text-slate-500">
                        Sau khi tải xong, hệ thống tự động lưu vào trình duyệt để tiếp tục làm kể cả khi mất mạng.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 8 Built-in Interactive Subject Worksheets Ready to Solve */}
                <div className="space-y-3">
                  <h3 className="text-[18px] font-bold text-[#164E63]">
                    8 Phiếu bài tập PDF tương tác mẫu theo 8 môn THPT
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                    {INTERACTIVE_SUBJECT_TEMPLATES.map((tpl) => (
                      <article
                        key={tpl.id}
                        className="rounded-xl bg-white border border-slate-200 hover:border-[#087F70] p-4 flex flex-col justify-between gap-3 transition-colors shadow-2xs"
                      >
                        <div className="space-y-1.5">
                          <div className="text-[14.5px] font-bold text-[#087F70]">
                            {tpl.subjectLabel} · Lớp {tpl.grade}
                          </div>
                          <h4 className="text-[15.5px] font-bold text-slate-900 leading-snug">
                            {tpl.title}
                          </h4>
                          <div className="text-[13px] font-medium text-[#164E63] bg-[#F4F8F7] rounded-md px-2 py-1">
                            {tpl.questionTypesSummary}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => loadTemplateIntoSolve(tpl.id)}
                          className="w-full py-2 rounded-lg bg-[#087F70] hover:bg-[#06695d] text-white font-semibold text-[15px] cursor-pointer"
                        >
                          Mở làm bài ngay
                        </button>
                      </article>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Student Top Control Bar (ZERO teacher keys/controls shown!) */}
              <div className="bg-white border-b border-slate-200 px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap shrink-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <input
                    type="text"
                    value={solveStudent.studentName}
                    onChange={(e) =>
                      setSolveStudent({ ...solveStudent, studentName: e.target.value })
                    }
                    placeholder="Họ và tên học sinh *"
                    className="w-48 rounded-lg border border-slate-300 px-3 py-1.5 text-[14.5px] font-medium focus:border-[#087F70] outline-none"
                  />
                  <input
                    type="text"
                    value={solveStudent.className}
                    onChange={(e) =>
                      setSolveStudent({ ...solveStudent, className: e.target.value })
                    }
                    placeholder="Lớp (VD: 12A1)"
                    className="w-32 rounded-lg border border-slate-300 px-2.5 py-1.5 text-[14.5px] focus:border-[#087F70] outline-none"
                  />
                  <input
                    type="text"
                    value={solveStudent.studentCode}
                    onChange={(e) =>
                      setSolveStudent({ ...solveStudent, studentCode: e.target.value })
                    }
                    placeholder="Mã HS"
                    className="w-24 rounded-lg border border-slate-300 px-2.5 py-1.5 text-[14.5px] focus:border-[#087F70] outline-none"
                  />

                  {solveProgress.total > 0 ? (
                    <>
                      <span className="px-3 py-1.5 rounded-lg bg-[#E6F1EF] text-[#164E63] text-[14px] font-bold">
                        Tiến độ: {solveProgress.done} / {solveProgress.total} câu
                      </span>

                      <button
                        type="button"
                        onClick={() => setSolveFilterUnanswered((v) => !v)}
                        className={`px-3 py-1.5 rounded-lg border text-[14px] font-semibold cursor-pointer ${
                          solveFilterUnanswered
                            ? 'bg-amber-100 border-amber-400 text-amber-900'
                            : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {solveFilterUnanswered ? 'Đang lọc: Chưa làm' : 'Lọc câu chưa làm'}
                      </button>
                    </>
                  ) : (
                    <span className="px-3 py-1.5 rounded-lg bg-[#E6F1EF] text-[#164E63] text-[14px] font-bold">
                      Làm trực tiếp · Đã ghi {solvePlainAnnotations.length} mục
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[13.5px] text-slate-500">
                    {solveSavedStatus === 'saving'
                      ? 'Đang tự lưu...'
                      : solveSavedStatus === 'saved' && solveLastSavedAt
                        ? `Đã lưu lúc ${new Date(solveLastSavedAt).toLocaleTimeString('vi-VN')}`
                        : ''}
                  </span>

                  <button
                    type="button"
                    onClick={() => persistCurrentSolveDraft('in_progress', false)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-[#164E63] font-semibold text-[14.5px] cursor-pointer"
                  >
                    <Save className="w-4 h-4 text-[#087F70]" />
                    <span>Lưu bài</span>
                  </button>

                  {!confirmResetSolve ? (
                    <button
                      type="button"
                      onClick={() => setConfirmResetSolve(true)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-red-50 hover:text-red-700 text-slate-700 font-semibold text-[14px] cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Làm lại</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-1 bg-red-50 border border-red-300 rounded-lg px-2 py-1 text-[13.5px]">
                      <span className="font-semibold text-red-800">Xóa hết bài đang làm?</span>
                      <button
                        type="button"
                        onClick={() => {
                          setSolveAnswers({});
                          setSolvePlainAnnotations([]);
                          setConfirmResetSolve(false);
                          notify('Đã đặt lại toàn bộ bài đang làm.', 'info');
                        }}
                        className="px-2 py-0.5 rounded bg-red-600 text-white font-semibold cursor-pointer"
                      >
                        Đồng ý
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmResetSolve(false)}
                        className="px-2 py-0.5 rounded bg-white border border-slate-300 text-slate-700 cursor-pointer"
                      >
                        Hủy
                      </button>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleExportSubmissionPackage}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#087F70] hover:bg-[#06695d] text-white font-semibold text-[14.5px] cursor-pointer shadow-2xs"
                    title="Lưu thành tệp PDF chuẩn hiển thị đầy đủ bài làm trên mọi trình đọc PDF và mở lại sửa tiếp hoặc nộp giáo viên"
                  >
                    <FileDown className="w-4 h-4" />
                    <span>Lưu thành PDF (.pdf)</span>
                  </button>

                  {(solveProgress.done > 0 || solvePlainAnnotations.length > 0) && (
                    <button
                      type="button"
                      onClick={handleSendActiveSolveToGrade}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#164E63] bg-white hover:bg-slate-50 text-[#164E63] font-semibold text-[13.5px] cursor-pointer"
                      title="Dành cho giáo viên: chuyển bài làm đang mở sang mục Thu bài & Chấm bài"
                    >
                      <ClipboardCheck className="w-4 h-4" />
                      <span>Chấm bài (GV)</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setSolveWorksheet(null);
                      setSolvePdfBytes(null);
                      setSolvePlainAnnotations([]);
                      setSolveNoticeBanner(null);
                    }}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-[14px] text-slate-600 cursor-pointer"
                  >
                    Chọn bài khác
                  </button>
                </div>
              </div>

              {/* Calm informational notice ONLY when a valid PDF had corrupted/unreadable embedded interactive metadata */}
              {solveNoticeBanner && (
                <div className="bg-sky-50 border-b border-sky-200 px-4 py-2 flex items-center justify-between gap-3 text-[14px] text-sky-900 shrink-0">
                  <span>{solveNoticeBanner}</span>
                  <button
                    type="button"
                    onClick={() => setSolveNoticeBanner(null)}
                    className="px-2 py-0.5 rounded bg-white border border-sky-200 text-sky-800 font-semibold text-[13px] hover:bg-sky-100 cursor-pointer shrink-0"
                  >
                    Đóng
                  </button>
                </div>
              )}

              {/* Teacher instructions & due date banner (if present) */}
              {(solveWorksheet.instructions || solveWorksheet.dueDate) && (
                <div className="bg-[#F4F8F7] border-b border-teal-200 px-4 py-2 flex items-center justify-between gap-3 flex-wrap text-[14px] text-[#164E63] shrink-0">
                  <div>
                    <strong>{solveWorksheet.title}</strong>
                    {solveWorksheet.instructions && (
                      <span className="text-slate-700"> — {solveWorksheet.instructions}</span>
                    )}
                  </div>
                  {solveWorksheet.dueDate && (
                    <span className="px-2.5 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-900 font-semibold text-[13px]">
                      Hạn nộp: {new Date(solveWorksheet.dueDate).toLocaleString('vi-VN')}
                    </span>
                  )}
                </div>
              )}

              <InteractivePdfCanvas
                pdfBytes={solvePdfBytes}
                questions={visibleSolveQuestions}
                mode="solve"
                examMode={solveWorksheet.examMode}
                answers={solveAnswers}
                teacherKeys={solveTemplateKeysForPractice}
                sourcePdfPages={solveSourcePages}
                printedPageLabels={solvePrintedLabels}
                enableDirectPdfTools={true}
                plainAnnotations={solvePlainAnnotations}
                onChangePlainAnnotations={setSolvePlainAnnotations}
                onChangeAnswer={(qId, next) =>
                  setSolveAnswers((prev) => ({ ...prev, [qId]: next }))
                }
              />
            </>
          )}
        </div>
      )}

      {/* ===================================================================
          AREA 4: BÀI ĐÃ LƯU (INDEXEDDB DRAFTS & COMPLETED ATTEMPTS)
      =================================================================== */}
      {tab === 'saved' && (
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-5xl mx-auto space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-[21px] font-bold text-[#164E63]">
                  Bài tập đã lưu trên thiết bị (IndexedDB Offline)
                </h2>
                <p className="text-[15px] text-slate-600">
                  Mở lại bài đang làm dở hoặc đã hoàn thành với đầy đủ câu trả lời, công thức, đường nối, thẻ kéo thả và nét vẽ.
                </p>
              </div>
              {storageUsage && (
                <div className="px-3.5 py-2 rounded-lg bg-white border border-slate-200 text-[14px] text-slate-700 shrink-0">
                  Bộ nhớ trình duyệt: <strong>{storageUsage.usedMB} MB</strong> / {storageUsage.quotaMB} MB
                </div>
              )}
            </div>

            {savedDrafts.length === 0 ? (
              <div className="rounded-2xl bg-white border border-slate-200 p-10 text-center space-y-3">
                <HardDrive className="w-10 h-10 text-slate-400 mx-auto" />
                <div className="text-[17px] font-bold text-slate-800">
                  Chưa có bài tập nào được lưu
                </div>
                <p className="text-[15px] text-slate-600">
                  Vào mục <strong>Làm bài</strong> để mở tệp PDF (*.pdf) hoặc phiếu mẫu 8 môn THPT. Mọi tiến độ sẽ tự động lưu tại đây.
                </p>
                <button
                  type="button"
                  onClick={() => setInteractiveTab('solve')}
                  className="px-4 py-2 rounded-lg bg-[#087F70] hover:bg-[#06695d] text-white font-semibold text-[15px] cursor-pointer"
                >
                  Đi tới mục Làm bài
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {savedDrafts.map((draft) => {
                  const answeredCount = draft.worksheet.questions.filter((q) =>
                    isQuestionAnswered(q, draft.answers[q.id])
                  ).length;
                  const isRenaming = renamingDraftId === draft.id;
                  const isConfirmDelete = confirmDeleteDraftId === draft.id;
                  return (
                    <article
                      key={draft.id}
                      className="rounded-xl bg-white border border-slate-200 p-4 flex flex-col justify-between gap-3.5 shadow-2xs"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-md text-[13px] font-bold ${
                              draft.status === 'completed'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {draft.status === 'completed' ? 'Đã hoàn thành' : 'Đang làm dở'}
                          </span>
                          <span className="text-[13.5px] text-slate-500">
                            Cập nhật: {new Date(draft.updatedAt).toLocaleString('vi-VN')}
                          </span>
                        </div>

                        {isRenaming ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={renameText}
                              onChange={(e) => setRenameText(e.target.value)}
                              className="flex-1 rounded-md border border-[#087F70] px-2.5 py-1 text-[15px] font-semibold"
                            />
                            <button
                              type="button"
                              onClick={async () => {
                                await interactiveStorage.renameStudentDraft(draft.id, renameText);
                                setRenamingDraftId(null);
                                await refreshLocalLists();
                              }}
                              className="px-2.5 py-1 rounded-md bg-[#087F70] text-white text-[14px] font-semibold cursor-pointer"
                            >
                              Lưu
                            </button>
                            <button
                              type="button"
                              onClick={() => setRenamingDraftId(null)}
                              className="px-2.5 py-1 rounded-md border border-slate-300 text-[14px] cursor-pointer"
                            >
                              Hủy
                            </button>
                          </div>
                        ) : (
                          <h3 className="text-[16.5px] font-bold text-[#164E63] leading-snug">
                            {draft.customTitle}
                          </h3>
                        )}

                        <div className="text-[14.5px] text-slate-600 flex flex-wrap gap-x-4 gap-y-1">
                          <span>
                            Học sinh: <strong>{draft.student.studentName || 'Chưa ghi tên'}</strong>
                          </span>
                          <span>
                            Lớp: <strong>{draft.student.className || '—'}</strong>
                          </span>
                          <span>
                            {draft.worksheet.questions.length > 0 ? (
                              <>
                                Đã làm:{' '}
                                <strong className="text-[#087F70]">
                                  {answeredCount}/{draft.worksheet.questions.length} câu
                                </strong>
                              </>
                            ) : (
                              <>
                                Đã ghi trực tiếp:{' '}
                                <strong className="text-[#087F70]">
                                  {draft.plainAnnotations?.length || 0} mục
                                </strong>
                              </>
                            )}
                          </span>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => openSavedDraft(draft)}
                          className="flex-1 min-w-[120px] px-3 py-2 rounded-lg bg-[#087F70] hover:bg-[#06695d] text-white font-semibold text-[14.5px] cursor-pointer"
                        >
                          Mở làm tiếp
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setRenamingDraftId(draft.id);
                            setRenameText(draft.customTitle);
                          }}
                          className="px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-[14px] cursor-pointer"
                        >
                          Đổi tên
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            const { bytes } = await exportStudentSubmissionPackage({
                              worksheet: draft.worksheet,
                              student: draft.student,
                              answers: draft.answers,
                              plainAnnotations: draft.plainAnnotations,
                              pdfBytes: draft.pdfBytes,
                              startedAt: draft.createdAt,
                              includeRenderedPdf: true,
                            });
                            const safeDraft = draft.customTitle
                              .replace(/[^a-zA-Z0-9\u00C0-\u024F\u1E00-\u1EFF_-]+/g, '_')
                              .slice(0, 35);
                            triggerInteractiveDownload(
                              bytes,
                              `SaoLuu_${safeDraft}.pdf`,
                              'application/pdf'
                            );
                            notify('Đã tải bản sao lưu PDF (.pdf) về máy tính.', 'success');
                          }}
                          className="px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-teal-50 text-[#164E63] font-semibold text-[14px] cursor-pointer"
                          title="Xuất bản sao lưu PDF (.pdf)"
                        >
                          Sao lưu PDF
                        </button>

                        {!isConfirmDelete ? (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteDraftId(draft.id)}
                            className="p-2 rounded-lg border border-slate-300 bg-white hover:bg-red-50 hover:text-red-600 text-slate-500 cursor-pointer"
                            title="Xóa bài đã lưu"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <div className="flex items-center gap-1 bg-red-50 border border-red-300 rounded-lg px-2 py-1 text-[13.5px]">
                            <button
                              type="button"
                              onClick={async () => {
                                await interactiveStorage.deleteStudentDraft(draft.id);
                                setConfirmDeleteDraftId(null);
                                await refreshLocalLists();
                                notify('Đã xóa bài đã lưu.', 'info');
                              }}
                              className="px-2 py-0.5 rounded bg-red-600 text-white font-semibold cursor-pointer"
                            >
                              Xác nhận xóa
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteDraftId(null)}
                              className="px-2 py-0.5 rounded bg-white border border-slate-300 cursor-pointer"
                            >
                              Hủy
                            </button>
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================
          AREA 5: THU BÀI & CHẤM BÀI (OFFLINE BATCH + HONEST ONLINE STATUS)
      =================================================================== */}
      {tab === 'grade' && (
        <div className="flex-1 flex flex-col min-h-0 min-w-0">
          {/* Sub-bar switching Thu bài Offline vs Thu bài Online */}
          <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setGradeModeTab('offline')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[14.5px] font-semibold cursor-pointer ${
                  gradeModeTab === 'offline'
                    ? 'bg-[#164E63] text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-[#E6F1EF]'
                }`}
              >
                <HardDrive className="w-4 h-4" />
                <span>Thu bài & Chấm bài Offline ({submissions.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setGradeModeTab('online')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[14.5px] font-semibold cursor-pointer ${
                  gradeModeTab === 'online'
                    ? 'bg-[#164E63] text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-[#E6F1EF]'
                }`}
              >
                <Globe className="w-4 h-4" />
                <span>Thu bài Online</span>
              </button>
            </div>
            <div className="text-[13.5px] text-slate-600 hidden md:block">
              Chấm tự động bằng đáp án gốc giáo viên · Không tin điểm học sinh tự gửi
            </div>
          </div>

          {gradeModeTab === 'online' ? (
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-3xl mx-auto rounded-2xl bg-white border border-slate-200 p-6 shadow-2xs space-y-4">
                <div className="flex items-center gap-2.5 text-[#164E63]">
                  <Globe className="w-6 h-6 text-[#087F70]" />
                  <h2 className="text-[20px] font-bold">Thu bài trực tuyến (Online)</h2>
                </div>
                {!onlineBackend.configured ? (
                  <div className="rounded-xl bg-amber-50 border border-amber-200 p-5 space-y-2.5 text-[15px] text-amber-950 leading-relaxed">
                    <div className="font-bold flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                      <span>Chưa cấu hình máy chủ (backend) tiếp nhận bài nộp trực tuyến</span>
                    </div>
                    <p>
                      Phiên bản hiện tại chạy hoàn toàn cục bộ trên trình duyệt (không kết nối Firebase hoặc máy chủ lưu trữ từ xa), do đó hệ thống <strong>không hiển thị số liệu giả</strong> và <strong>không mô phỏng việc thu bài Online</strong>.
                    </p>
                    <p>
                      Để thu bài ngay hôm nay, thầy/cô hãy nhận các tệp bài làm <strong>PDF (*.pdf)</strong> của học sinh (qua Zalo, Email, LMS hoặc USB) rồi chuyển sang thẻ <strong>Thu bài & Chấm bài Offline</strong> để nhập hàng loạt, chấm tự động + thủ công, xuất PDF trả bài và xuất bảng điểm Excel.
                    </p>
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => setGradeModeTab('offline')}
                        className="px-4 py-2 rounded-lg bg-[#087F70] hover:bg-[#06695d] text-white font-semibold text-[14.5px] cursor-pointer"
                      >
                        Chuyển sang Thu bài Offline ngay
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl bg-teal-50 border border-teal-200 p-4 text-[15px] text-[#164E63]">
                    Máy chủ thu bài Online đang trỏ tới: <code className="font-mono">{onlineBackend.endpointUrl}</code>.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex min-h-0 min-w-0">
              {/* Left Panel: Master Worksheet Selector + Batch Import + Student List */}
              <aside className="w-84 bg-white border-r border-slate-200 flex flex-col min-h-0 shrink-0">
                <div className="p-3.5 border-b border-slate-200 space-y-3">
                  <div className="space-y-1">
                    <label className="block text-[14px] font-bold text-[#164E63]">
                      1. Chọn đề gốc & đáp án giáo viên
                    </label>
                    <select
                      value={gradeWorksheetId}
                      onChange={(e) => {
                        setGradeWorksheetId(e.target.value);
                        setSelectedSubmissionId(null);
                      }}
                      className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-[14px] text-slate-800"
                    >
                      <option value="">-- Tất cả bài nộp ({submissions.length}) --</option>
                      {teacherWorksheets.map((tw) => (
                        <option key={tw.worksheetId} value={tw.worksheetId}>
                          {tw.worksheet.title}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => gradeMasterInputRef.current?.click()}
                      className="w-full py-1.5 rounded-lg border border-slate-300 bg-slate-50 hover:bg-teal-50 text-[#164E63] font-semibold text-[13.5px] cursor-pointer"
                    >
                      + Nạp tệp bản gốc GV (.pdf)
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    <button
                      type="button"
                      onClick={() => gradeSubmissionsInputRef.current?.click()}
                      className="w-full inline-flex items-center justify-center gap-2 py-2 rounded-lg bg-[#087F70] hover:bg-[#06695d] text-white font-semibold text-[14.5px] cursor-pointer"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Nhập nhiều bài nộp PDF (.pdf)</span>
                    </button>
                    <button
                      type="button"
                      disabled={filteredSubmissions.length === 0}
                      onClick={handleExportGradebookExcel}
                      className="w-full inline-flex items-center justify-center gap-2 py-2 rounded-lg border border-[#164E63] bg-white hover:bg-[#E6F1EF] disabled:opacity-45 text-[#164E63] font-semibold text-[14.5px] cursor-pointer"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-[#087F70]" />
                      <span>Xuất bảng điểm Excel (.xlsx)</span>
                    </button>
                  </div>
                </div>

                {/* Batch Import Warnings / Duplicate Protection */}
                {importReport &&
                  (importReport.skipped.length > 0 || importReport.duplicateGraded.length > 0) && (
                    <div className="p-3 bg-amber-50 border-b border-amber-200 space-y-2 text-[13.5px]">
                      {importReport.skipped.length > 0 && (
                        <div className="space-y-1 text-red-800">
                          <div className="font-bold">Tệp bị bỏ qua ({importReport.skipped.length}):</div>
                          {importReport.skipped.map((msg, i) => (
                            <div key={i} className="leading-snug">
                              • {msg}
                            </div>
                          ))}
                        </div>
                      )}
                      {importReport.duplicateGraded.map((dup) => (
                        <div
                          key={dup.fileName}
                          className="rounded-lg bg-white border border-amber-300 p-2 space-y-1.5"
                        >
                          <div className="font-bold text-amber-900">
                            Trùng bài đã chấm: {dup.incoming.student.studentName} ({dup.fileName})
                          </div>
                          <p className="text-[12.5px] text-slate-600">
                            Bài cũ đã được chấm ({dup.existing.totalScore}/{dup.existing.maxScore}đ). Hệ thống không tự ghi đè.
                          </p>
                          <button
                            type="button"
                            onClick={async () => {
                              await interactiveStorage.saveSubmission({
                                ...dup.incoming,
                                submissionId: dup.existing.submissionId,
                              });
                              setImportReport((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      duplicateGraded: prev.duplicateGraded.filter(
                                        (d) => d.fileName !== dup.fileName
                                      ),
                                    }
                                  : null
                              );
                              await refreshLocalLists();
                              notify('Đã cập nhật bài nộp theo xác nhận của giáo viên.', 'info');
                            }}
                            className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-700 text-white font-semibold text-[12.5px] cursor-pointer"
                          >
                            Xác nhận ghi đè bài cũ
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                {/* Imported Student Submissions List */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  <div className="text-[14px] font-bold text-slate-700">
                    Danh sách bài nộp ({filteredSubmissions.length})
                  </div>
                  {filteredSubmissions.length === 0 ? (
                    <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-[14px] text-slate-500 text-center">
                      Chưa có bài nộp học sinh nào. Nhấn nút phía trên để nhập 1 hoặc nhiều tệp PDF (*.pdf).
                    </div>
                  ) : (
                    filteredSubmissions.map((sub) => {
                      const isSel = sub.submissionId === selectedSubmissionId;
                      return (
                        <button
                          key={sub.submissionId}
                          type="button"
                          onClick={() => setSelectedSubmissionId(sub.submissionId)}
                          className={`w-full text-left rounded-xl border p-3 transition-colors cursor-pointer space-y-1 ${
                            isSel
                              ? 'border-[#087F70] bg-[#E6F1EF] shadow-2xs'
                              : 'border-slate-200 bg-white hover:border-[#087F70]/60'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-[#164E63] text-[15px] truncate">
                              {sub.student.studentName}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-red-50 border border-red-200 text-[#DC2626] font-bold text-[13.5px] shrink-0">
                              {sub.totalScore}/{sub.maxScore}đ
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[13px] text-slate-600">
                            <span>Lớp {sub.student.className || '—'}</span>
                            <span
                              className={`font-semibold ${
                                sub.status === 'graded' ? 'text-emerald-700' : 'text-amber-700'
                              }`}
                            >
                              {sub.status === 'graded' ? 'Đã chấm' : 'Cần chấm tay'}
                            </span>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </aside>

              {/* Center PDF Visual Review */}
              <div className="flex-1 flex flex-col min-w-0 min-h-0">
                {activeSubmission && gradingWorksheet ? (
                  <>
                    <div className="bg-white border-b border-slate-200 px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap shrink-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-[16px] font-bold text-[#164E63]">
                          {activeSubmission.student.studentName}
                          {activeSubmission.student.className
                            ? ` · Lớp ${activeSubmission.student.className}`
                            : ''}
                        </span>
                        <span className="px-3 py-1 rounded-lg bg-red-50 border border-red-200 text-[#DC2626] font-bold text-[15px]">
                          Tổng điểm: {activeSubmission.totalScore} / {activeSubmission.maxScore}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (!activeTeacherMaster) {
                              notify(
                                'Cần nạp bản gốc đáp án giáo viên để chạy tự chấm lại.',
                                'warning'
                              );
                              return;
                            }
                            const res = autoGradeSubmission(
                              gradingWorksheet,
                              activeTeacherMaster.answerKeys,
                              activeSubmission.answers,
                              activeSubmission.gradingDetails
                            );
                            updateActiveSubmissionGrade((rec) => ({
                              ...rec,
                              gradingDetails: res.gradingDetails,
                              totalScore: res.totalScore,
                              maxScore: res.maxScore,
                            }));
                            notify(
                              'Đã đối chiếu lại đáp án khách quan từ khóa gốc giáo viên.',
                              'success'
                            );
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-[#164E63] font-semibold text-[14px] cursor-pointer"
                        >
                          <ClipboardCheck className="w-4 h-4 text-[#087F70]" />
                          <span>Đối chiếu đáp án gốc</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleExportGradedReturnPdf}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#DC2626] hover:bg-[#b91c1c] text-white font-semibold text-[14.5px] cursor-pointer"
                        >
                          <FileDown className="w-4 h-4" />
                          <span>Xuất PDF trả bài</span>
                        </button>
                      </div>
                    </div>

                    <InteractivePdfCanvas
                      pdfBytes={activeSubmission.pdfBytes}
                      questions={gradingWorksheet.questions}
                      mode="grade"
                      examMode="exam"
                      selectedQuestionId={selectedGradeQId}
                      answers={activeSubmission.answers}
                      plainAnnotations={activeSubmission.plainAnnotations}
                      teacherKeys={activeTeacherMaster?.answerKeys}
                      gradingDetails={activeSubmission.gradingDetails}
                      sourcePdfPages={gradingWorksheet.pageMapping?.sourcePdfPages}
                      printedPageLabels={gradingWorksheet.pageMapping?.printedPageLabels}
                      scrollToQuestionNonce={gradeScrollNonce}
                      onSelectQuestion={(id) => setSelectedGradeQId(id)}
                    />
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center p-8 text-center">
                    <div className="max-w-md space-y-2.5 bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
                      <GraduationCap className="w-10 h-10 text-[#087F70] mx-auto" />
                      <h3 className="text-[18px] font-bold text-[#164E63]">
                        Chấm bài trực tiếp trên trang PDF
                      </h3>
                      <p className="text-[15px] text-slate-600 leading-relaxed">
                        Chọn một bài nộp của học sinh ở danh sách bên trái để xem câu trả lời, công thức, đường nối ghép đôi, thẻ kéo thả, hình vẽ và nhập điểm / nhận xét.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Panel: Per-Question Score, Quick Right/Wrong Marks & Teacher Comment Sheet */}
              {activeSubmission && gradingWorksheet && (
                <aside className="w-88 bg-white border-l border-slate-200 overflow-y-auto shrink-0 p-4 space-y-4">
                  <div className="font-bold text-[#164E63] text-[16px] pb-2 border-b border-slate-200">
                    Bảng chấm điểm chi tiết
                  </div>

                  <div className="space-y-3">
                    {gradingWorksheet.questions.map((q) => {
                      const detail: QuestionGradingDetail = activeSubmission.gradingDetails[q.id] || {
                        questionId: q.id,
                        maxPoints: q.maxPoints,
                        autoPoints: null,
                        earnedPoints: null,
                        mode: 'manual',
                      };
                      const key = activeTeacherMaster?.answerKeys[q.id];
                      return (
                        <div
                          key={q.id}
                          onClick={() => {
                            setSelectedGradeQId(q.id);
                            setGradeScrollNonce((n) => n + 1);
                          }}
                          className={`rounded-xl border p-3 space-y-2 transition-colors cursor-pointer ${
                            selectedGradeQId === q.id
                              ? 'border-[#DC2626] bg-red-50/30'
                              : 'border-slate-200 bg-slate-50/50'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="font-bold text-[#164E63] text-[14.5px]">
                              {q.code} · {QUESTION_TYPE_META[q.type].shortLabel}
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded text-[12px] font-semibold ${
                                detail.mode === 'auto'
                                  ? 'bg-teal-50 text-[#087F70]'
                                  : 'bg-amber-100 text-amber-900'
                              }`}
                            >
                              {detail.mode === 'auto' ? 'Tự chấm' : 'Chấm thủ công'}
                            </span>
                          </div>

                          {typeof detail.matchedPairsCount === 'number' && (
                            <div className="text-[13px] text-emerald-800 font-medium">
                              Khớp đúng {detail.matchedPairsCount}/{detail.totalExpectedPairs} cặp ghép đôi
                            </div>
                          )}

                          {key?.referenceNote && (
                            <div className="text-[12.5px] text-slate-600 bg-white rounded border border-slate-200 px-2 py-1">
                              <strong>Gợi ý GV:</strong> {key.referenceNote}
                            </div>
                          )}

                          {/* Quick Mark Đúng / Một phần / Sai buttons */}
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateActiveSubmissionGrade((rec) => ({
                                  ...rec,
                                  gradingDetails: {
                                    ...rec.gradingDetails,
                                    [q.id]: {
                                      ...detail,
                                      earnedPoints: q.maxPoints,
                                      markStatus: 'correct',
                                    },
                                  },
                                }));
                              }}
                              className={`flex-1 inline-flex items-center justify-center gap-1 py-1 rounded-md border text-[12.5px] font-bold cursor-pointer ${
                                detail.markStatus === 'correct'
                                  ? 'bg-emerald-600 border-emerald-600 text-white'
                                  : 'bg-white border-emerald-300 text-emerald-800 hover:bg-emerald-50'
                              }`}
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Đúng</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateActiveSubmissionGrade((rec) => ({
                                  ...rec,
                                  gradingDetails: {
                                    ...rec.gradingDetails,
                                    [q.id]: {
                                      ...detail,
                                      earnedPoints: Math.round((q.maxPoints / 2) * 100) / 100,
                                      markStatus: 'partial',
                                    },
                                  },
                                }));
                              }}
                              className={`flex-1 py-1 rounded-md border text-[12.5px] font-bold cursor-pointer ${
                                detail.markStatus === 'partial'
                                  ? 'bg-amber-600 border-amber-600 text-white'
                                  : 'bg-white border-amber-300 text-amber-800 hover:bg-amber-50'
                              }`}
                            >
                              Một phần
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateActiveSubmissionGrade((rec) => ({
                                  ...rec,
                                  gradingDetails: {
                                    ...rec.gradingDetails,
                                    [q.id]: {
                                      ...detail,
                                      earnedPoints: 0,
                                      markStatus: 'wrong',
                                    },
                                  },
                                }));
                              }}
                              className={`flex-1 inline-flex items-center justify-center gap-1 py-1 rounded-md border text-[12.5px] font-bold cursor-pointer ${
                                detail.markStatus === 'wrong'
                                  ? 'bg-red-600 border-red-600 text-white'
                                  : 'bg-white border-red-300 text-red-700 hover:bg-red-50'
                              }`}
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Sai</span>
                            </button>
                          </div>

                          <div className="flex items-center gap-2">
                            <label className="text-[13.5px] font-semibold text-slate-700 shrink-0">
                              Điểm đạt:
                            </label>
                            <input
                              type="number"
                              min={0}
                              max={q.maxPoints}
                              step={0.25}
                              value={detail.earnedPoints === null ? '' : detail.earnedPoints}
                              placeholder="Nhập điểm"
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => {
                                const raw = e.target.value;
                                const val =
                                  raw === ''
                                    ? null
                                    : Math.max(0, Math.min(q.maxPoints, Number(raw)));
                                const markStatus =
                                  val === null
                                    ? undefined
                                    : val >= q.maxPoints
                                      ? 'correct'
                                      : val <= 0
                                        ? 'wrong'
                                        : 'partial';
                                updateActiveSubmissionGrade((rec) => ({
                                  ...rec,
                                  gradingDetails: {
                                    ...rec.gradingDetails,
                                    [q.id]: { ...detail, earnedPoints: val, markStatus },
                                  },
                                }));
                              }}
                              className="w-24 rounded-md border border-slate-300 bg-white px-2 py-1 text-[14px] font-bold text-[#DC2626]"
                            />
                            <span className="text-[14px] text-slate-600">/ {q.maxPoints}đ</span>
                          </div>

                          <input
                            type="text"
                            value={detail.teacherNote || ''}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) =>
                              updateActiveSubmissionGrade((rec) => ({
                                ...rec,
                                gradingDetails: {
                                  ...rec.gradingDetails,
                                  [q.id]: { ...detail, teacherNote: e.target.value },
                                },
                              }))
                            }
                            placeholder="Ghi chú riêng cho câu này..."
                            className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1 text-[13.5px]"
                          />
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-3 border-t border-slate-200 space-y-2">
                    <label className="block text-[14.5px] font-bold text-[#164E63]">
                      Nhận xét chung của giáo viên
                    </label>
                    <textarea
                      rows={3}
                      value={activeSubmission.teacherComment}
                      onChange={(e) =>
                        updateActiveSubmissionGrade((rec) => ({
                          ...rec,
                          teacherComment: e.target.value,
                        }))
                      }
                      placeholder="Nhận xét về bài làm, điểm mạnh và phần cần cải thiện..."
                      className="w-full rounded-lg border border-slate-300 p-2.5 text-[14px]"
                    />
                    <div className="flex items-center gap-1.5 text-[13px] text-emerald-700 font-medium">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>Điểm và nhận xét tự động lưu cục bộ ngay khi nhập.</span>
                    </div>
                  </div>
                </aside>
              )}
            </div>
          )}
        </div>
      )}

      {/* ===================================================================
          AREA 6: HƯỚNG DẪN SỬ DỤNG
      =================================================================== */}
      {tab === 'guide' && <InteractiveGuidePanel />}

      {/* Hidden File Pickers — strictly standard PDF (*.pdf, application/pdf) */}
      <input
        ref={authorPdfInputRef}
        type="file"
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={(e) => {
          handleUploadAuthorPdf(e.target.files);
          e.target.value = '';
        }}
      />
      <input
        ref={authorMasterInputRef}
        type="file"
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleExternalPackageFile(f, 'author');
          e.target.value = '';
        }}
      />
      <input
        ref={solvePackageInputRef}
        type="file"
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleExternalPackageFile(f, 'solve');
          e.target.value = '';
        }}
      />
      <input
        ref={gradeSubmissionsInputRef}
        type="file"
        multiple
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={(e) => {
          if (e.target.files) importStudentSubmissionFiles(e.target.files);
          e.target.value = '';
        }}
      />
      <input
        ref={gradeMasterInputRef}
        type="file"
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleExternalPackageFile(f, 'grade');
          e.target.value = '';
        }}
      />
    </div>
  );
};
