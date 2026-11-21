import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
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
  PenTool,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  Upload,
} from 'lucide-react';
import { useStudioStore } from '../../stores/useStudioStore';
import { InteractivePdfCanvas } from './InteractivePdfCanvas';
import { TeacherQuestionInspector } from './TeacherQuestionInspector';
import { InteractiveGuidePanel } from './InteractiveGuidePanel';
import {
  autoGradeSubmission,
  buildInteractiveGradebookBuffer,
  exportStudentSubmissionPackage,
  exportStudentWorksheetPackage,
  exportTeacherMasterPackage,
  fetchWorksheetFromUrl,
  parseInteractivePackage,
  renderInteractiveAnswersToPdf,
  sanitizeWorksheetForStudent,
  triggerInteractiveDownload,
} from './interactiveEngine';
import { interactiveStorage } from './interactiveStorage';
import {
  buildInteractiveSubjectTemplate,
  INTERACTIVE_SUBJECT_TEMPLATES,
} from './interactiveTemplates';
import {
  QUESTION_TYPE_META,
  type GradedSubmissionRecord,
  type InteractiveDraftRecord,
  type InteractiveQuestion,
  type InteractiveQuestionType,
  type InteractiveSubTab,
  type InteractiveWorksheet,
  type QuestionGradingDetail,
  type StudentAnswerMap,
  type StudentProfileInfo,
  type StudentQuestionAnswer,
  type TeacherAnswerKeyMap,
  type TeacherQuestionKey,
  type TeacherWorksheetRecord,
} from '../../types/interactive';
import type { GradeLevel, SubjectCategory } from '../../types/studio';

interface InteractiveWorksheetHubProps {
  retryNonce?: number;
}

const ALL_QUESTION_TYPES: InteractiveQuestionType[] = [
  'mcq',
  'tf',
  'short',
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

function createDefaultQuestion(
  type: InteractiveQuestionType,
  index: number,
  pageIndex: number,
  x: number,
  y: number
): { question: InteractiveQuestion; key: TeacherQuestionKey } {
  const id = `q-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`;
  const meta = QUESTION_TYPE_META[type];
  const base: InteractiveQuestion = {
    id,
    code: `Câu ${index}`,
    title: meta.label,
    prompt: `Hoàn thành yêu cầu ${meta.shortLabel.toLowerCase()} dưới đây.`,
    type,
    maxPoints: 2,
    required: true,
    region: {
      pageIndex,
      x: Math.max(16, Math.min(595 - meta.defaultWidth - 16, x)),
      y: Math.max(24, Math.min(841 - meta.defaultHeight - 24, y)),
      width: meta.defaultWidth,
      height: meta.defaultHeight,
    },
  };
  const key: TeacherQuestionKey = { questionId: id };

  switch (type) {
    case 'mcq':
      base.mcqOptions = [
        { id: 'A', label: 'A', text: 'Phương án A' },
        { id: 'B', label: 'B', text: 'Phương án B' },
        { id: 'C', label: 'C', text: 'Phương án C' },
        { id: 'D', label: 'D', text: 'Phương án D' },
      ];
      key.mcqCorrectId = 'A';
      break;
    case 'tf':
      base.tfStatements = [
        { id: 's1', label: 'a)', text: 'Phát biểu a' },
        { id: 's2', label: 'b)', text: 'Phát biểu b' },
        { id: 's3', label: 'c)', text: 'Phát biểu c' },
        { id: 's4', label: 'd)', text: 'Phát biểu d' },
      ];
      key.tfCorrectMap = { s1: 'T', s2: 'F', s3: 'T', s4: 'F' };
      break;
    case 'short':
      base.shortPlaceholder = 'Nhập câu trả lời ngắn...';
      key.shortAccepted = ['Đáp án mẫu'];
      break;
    case 'fill_blank':
      base.fillBlanks = [
        { id: 'b1', prefix: 'Nội dung trước', suffix: 'nội dung sau.', placeholder: 'điền từ' },
        { id: 'b2', prefix: 'Giá trị cần tìm là', suffix: '', placeholder: 'điền số' },
      ];
      key.fillBlankAccepted = { b1: ['từ khóa'], b2: ['10'] };
      break;
    case 'essay':
      base.essayPlaceholder = 'Nhập lời giải chi tiết...';
      key.referenceNote = 'Giáo viên chấm thủ công theo biểu điểm chi tiết.';
      break;
    case 'matching': {
      const a1 = `${id}-a1`;
      const a2 = `${id}-a2`;
      const a3 = `${id}-a3`;
      const b1 = `${id}-b1`;
      const b2 = `${id}-b2`;
      const b3 = `${id}-b3`;
      base.matching = {
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
      base.orderingItems = [
        { id: o2, text: 'Bước thứ hai' },
        { id: o1, text: 'Bước đầu tiên' },
        { id: o3, text: 'Bước cuối cùng' },
      ];
      key.orderingCorrectIds = [o1, o2, o3];
      break;
    }
    case 'reading':
      base.readingPassage = 'Đoạn tư liệu hoặc bài đọc minh họa...';
      base.readingSubQuestions = [
        { id: 'rs1', prompt: '1. Ý chính của đoạn tư liệu là gì?', kind: 'mcq', options: ['Phương án 1', 'Phương án 2'] },
        { id: 'rs2', prompt: '2. Tìm một từ khóa quan trọng trong đoạn đọc:', kind: 'short' },
      ];
      key.readingSubKeys = { rs1: ['Phương án 1'], rs2: ['tư liệu'] };
      break;
    case 'formula':
      base.formulaPlaceholder = 'Nhập công thức LaTeX (ví dụ: E = mc^2)';
      key.referenceNote = 'Giáo viên đối chiếu biểu thức khoa học tương đương.';
      break;
    case 'drawing':
      key.referenceNote = 'Giáo viên kiểm tra hình vẽ / chữ viết tay trực tiếp.';
      break;
    case 'diagram_label':
      base.diagramPins = [
        { id: 'p1', code: '(1)', rx: 0.25, ry: 0.35, hint: 'Vị trí 1' },
        { id: 'p2', code: '(2)', rx: 0.7, ry: 0.5, hint: 'Vị trí 2' },
      ];
      key.referenceNote = '(1) Thành phần 1; (2) Thành phần 2.';
      break;
    case 'attachment':
      base.attachmentAcceptHint = 'Hỗ trợ ảnh, PDF, mã nguồn .py/.sql/.txt (tối đa 8 MB/tệp)';
      key.referenceNote = 'Giáo viên tải và đánh giá tệp sản phẩm đính kèm.';
      break;
  }

  return { question: base, key };
}

function isQuestionAnswered(q: InteractiveQuestion, ans?: StudentQuestionAnswer): boolean {
  if (!ans) return false;
  switch (q.type) {
    case 'mcq':
      return Boolean(ans.mcqSelectedId);
    case 'tf':
      return Object.values(ans.tfAnswers || {}).some((v) => v === 'T' || v === 'F');
    case 'short':
      return Boolean(ans.shortText?.trim());
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

  // ---- SHARED INDEXEDDB LISTS ----
  const [teacherWorksheets, setTeacherWorksheets] = useState<TeacherWorksheetRecord[]>([]);
  const [savedDrafts, setSavedDrafts] = useState<InteractiveDraftRecord[]>([]);
  const [submissions, setSubmissions] = useState<GradedSubmissionRecord[]>([]);
  const [storageUsage, setStorageUsage] = useState<{ usedMB: number; quotaMB: number } | null>(null);
  const [quotaBanner, setQuotaBanner] = useState<string | null>(null);

  // ---- TAB 1: AUTHORING STATE ----
  const [authorWorksheet, setAuthorWorksheet] = useState<InteractiveWorksheet | null>(null);
  const [authorKeys, setAuthorKeys] = useState<TeacherAnswerKeyMap>({});
  const [authorPdfBytes, setAuthorPdfBytes] = useState<Uint8Array | null>(null);
  const [selectedAuthorQId, setSelectedAuthorQId] = useState<string | null>(null);
  const [placingType, setPlacingType] = useState<InteractiveQuestionType | null>(null);
  const [authorPreviewStudent, setAuthorPreviewStudent] = useState(false);
  const [authorPreviewAnswers, setAuthorPreviewAnswers] = useState<StudentAnswerMap>({});

  // ---- TAB 2: STUDENT SOLVING STATE ----
  const [solveDraftId, setSolveDraftId] = useState<string | null>(null);
  const [solveWorksheet, setSolveWorksheet] = useState<InteractiveWorksheet | null>(null);
  const [solvePdfBytes, setSolvePdfBytes] = useState<Uint8Array | null>(null);
  const [solveAnswers, setSolveAnswers] = useState<StudentAnswerMap>({});
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
  const [confirmResetSolve, setConfirmResetSolve] = useState(false);
  const [solveTemplateKeysForPractice, setSolveTemplateKeysForPractice] = useState<TeacherAnswerKeyMap | undefined>(undefined);

  // ---- TAB 3: SAVED DRAFTS STATE ----
  const [renamingDraftId, setRenamingDraftId] = useState<string | null>(null);
  const [renameText, setRenameText] = useState('');
  const [confirmDeleteDraftId, setConfirmDeleteDraftId] = useState<string | null>(null);

  // ---- TAB 4: GRADING STATE ----
  const [gradeWorksheetId, setGradeWorksheetId] = useState<string>('');
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [selectedGradeQId, setSelectedGradeQId] = useState<string | null>(null);
  const [importReport, setImportReport] = useState<{
    imported: number;
    skipped: string[];
    duplicateGraded: Array<{ fileName: string; existing: GradedSubmissionRecord; incoming: GradedSubmissionRecord }>;
  } | null>(null);

  const authorPdfInputRef = useRef<HTMLInputElement>(null);
  const authorMasterInputRef = useRef<HTMLInputElement>(null);
  const solvePackageInputRef = useRef<HTMLInputElement>(null);
  const gradeSubmissionsInputRef = useRef<HTMLInputElement>(null);
  const gradeMasterInputRef = useRef<HTMLInputElement>(null);

  const refreshLocalLists = useCallback(async () => {
    const [tws, drafts, subs, est] = await Promise.all([
      interactiveStorage.listTeacherWorksheets(),
      interactiveStorage.listStudentDrafts(),
      interactiveStorage.listSubmissions(),
      interactiveStorage.estimateStorageUsage(),
    ]);
    setTeacherWorksheets(tws);
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

  // Handle pending .pdfedu file routed from Welcome Screen / Ctrl+O
  const handleExternalPackageFile = useCallback(
    async (file: File) => {
      try {
        const parsed = await parseInteractivePackage(file, file.name);
        if (parsed.kind === 'worksheet') {
          const newDraftId = `draft-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
          setSolveDraftId(newDraftId);
          setSolveWorksheet(parsed.worksheet);
          setSolvePdfBytes(parsed.pdfBytes);
          setSolveAnswers({});
          setSolveStartedAt(Date.now());
          setSolveTemplateKeysForPractice(undefined);
          setInteractiveTab('solve');
          notify(`Đã mở bài tập "${parsed.worksheet.title}" (đã xác minh toàn vẹn).`, 'success');
        } else if (parsed.kind === 'teacher-master') {
          setAuthorWorksheet(parsed.worksheet);
          setAuthorKeys(parsed.answerKeys);
          setAuthorPdfBytes(parsed.pdfBytes);
          setSelectedAuthorQId(parsed.worksheet.questions[0]?.id || null);
          await interactiveStorage.saveTeacherWorksheet({
            worksheetId: parsed.worksheet.worksheetId,
            worksheet: parsed.worksheet,
            answerKeys: parsed.answerKeys,
            pdfBytes: parsed.pdfBytes,
            createdAt: parsed.worksheet.createdAt,
            updatedAt: Date.now(),
          });
          await refreshLocalLists();
          setInteractiveTab('author');
          notify(`Đã nạp bản gốc giáo viên "${parsed.worksheet.title}".`, 'success');
        } else if (parsed.kind === 'submission') {
          setInteractiveTab('grade');
          await importStudentSubmissionFiles([file]);
        }
      } catch (err) {
        notify(err instanceof Error ? err.message : 'Không thể đọc gói .pdfedu.', 'error');
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [notify, refreshLocalLists, setInteractiveTab]
  );

  useEffect(() => {
    if (interactiveView.pendingPackageFile) {
      const f = interactiveView.pendingPackageFile;
      clearPendingInteractiveFile();
      handleExternalPackageFile(f);
    }
  }, [interactiveView.pendingPackageFile, clearPendingInteractiveFile, handleExternalPackageFile]);

  // =========================================================================
  // AUTHORING ACTIONS
  // =========================================================================

  const loadTemplateIntoAuthor = async (templateId: string) => {
    try {
      const built = await buildInteractiveSubjectTemplate(templateId);
      setAuthorWorksheet(built.worksheet);
      setAuthorKeys(built.answerKeys);
      setAuthorPdfBytes(built.pdfBytes);
      setSelectedAuthorQId(built.worksheet.questions[0]?.id || null);
      setAuthorPreviewStudent(false);
      setAuthorPreviewAnswers({});
      setPlacingType(null);
      notify(`Đã nạp mẫu tương tác "${built.worksheet.title}".`, 'success');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Không thể tạo mẫu bài tập.', 'error');
    }
  };

  const createAuthorFromPdfBytes = (title: string, bytes: Uint8Array, subject: SubjectCategory = 'general') => {
    const now = Date.now();
    const ws: InteractiveWorksheet = {
      worksheetId: `ws-${now.toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
      schemaVersion: 2,
      title,
      subject,
      subjectLabel: 'Tổng hợp',
      grade: 11,
      description: 'Bài tập PDF tương tác tạo từ tài liệu PDF gốc.',
      teacherName: 'Giáo viên',
      durationMinutes: 30,
      examMode: 'exam',
      createdAt: now,
      updatedAt: now,
      questions: [],
    };
    setAuthorWorksheet(ws);
    setAuthorKeys({});
    setAuthorPdfBytes(bytes);
    setSelectedAuthorQId(null);
    setAuthorPreviewStudent(false);
    setPlacingType(null);
    notify(`Đã nạp PDF "${title}". Chọn loại câu hỏi bên trái rồi nhấp lên trang PDF để đặt vùng trả lời.`, 'success');
  };

  const handleUploadAuthorPdf = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      createAuthorFromPdfBytes(file.name.replace(/\.pdf$/i, ''), bytes);
    } catch {
      notify('Không thể đọc tệp PDF vừa chọn.', 'error');
    }
  };

  const handlePlaceQuestionAtPoint = (pageIndex: number, pdfX: number, pdfY: number) => {
    if (!authorWorksheet || !placingType) return;
    const { question, key } = createDefaultQuestion(
      placingType,
      authorWorksheet.questions.length + 1,
      pageIndex,
      pdfX,
      pdfY
    );
    setAuthorWorksheet({
      ...authorWorksheet,
      updatedAt: Date.now(),
      questions: [...authorWorksheet.questions, question],
    });
    setAuthorKeys({ ...authorKeys, [question.id]: key });
    setSelectedAuthorQId(question.id);
    setPlacingType(null);
  };

  const updateAuthorQuestion = (qId: string, patch: Partial<InteractiveQuestion>) => {
    if (!authorWorksheet) return;
    setAuthorWorksheet({
      ...authorWorksheet,
      updatedAt: Date.now(),
      questions: authorWorksheet.questions.map((q) => (q.id === qId ? { ...q, ...patch } : q)),
    });
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
    if (selectedAuthorQId === qId) setSelectedAuthorQId(null);
  };

  const saveTeacherMasterLocally = async (): Promise<boolean> => {
    if (!authorWorksheet || !authorPdfBytes) return false;
    const res = await interactiveStorage.saveTeacherWorksheet({
      worksheetId: authorWorksheet.worksheetId,
      worksheet: authorWorksheet,
      answerKeys: authorKeys,
      pdfBytes: authorPdfBytes,
      createdAt: authorWorksheet.createdAt,
      updatedAt: Date.now(),
    });
    if (!res.ok) {
      if (res.quotaExceeded) setQuotaBanner(res.errorMessage || 'Bộ nhớ cục bộ đã đầy.');
      notify(res.errorMessage || 'Không thể lưu bản gốc giáo viên.', 'error');
      return false;
    }
    setQuotaBanner(null);
    setGradeWorksheetId(authorWorksheet.worksheetId);
    await refreshLocalLists();
    notify('Đã lưu bản gốc đề + đáp án giáo viên vào bộ nhớ cục bộ.', 'success');
    return true;
  };

  const handleExportStudentPackage = async () => {
    if (!authorWorksheet || !authorPdfBytes) return;
    if (authorWorksheet.questions.length === 0) {
      notify('Vui lòng đặt ít nhất 1 vùng câu hỏi tương tác trước khi xuất bài tập.', 'warning');
      return;
    }
    try {
      // Save teacher key locally automatically so teacher can always grade returned papers later
      await saveTeacherMasterLocally();
      const bytes = await exportStudentWorksheetPackage(authorWorksheet, authorPdfBytes);
      const safeName = authorWorksheet.title.replace(/[^a-zA-Z0-9\u00C0-\u024F\u1E00-\u1EFF_-]+/g, '_').slice(0, 60);
      triggerInteractiveDownload(bytes, `${safeName}_bai_tap_HS.pdfedu`, 'application/octet-stream');
      notify('Đã xuất gói bài tập .pdfedu cho học sinh (đã loại bỏ hoàn toàn đáp án giáo viên).', 'success');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Không thể xuất gói bài tập.', 'error');
    }
  };

  const handleExportTeacherBackup = async () => {
    if (!authorWorksheet || !authorPdfBytes) return;
    try {
      const bytes = await exportTeacherMasterPackage(authorWorksheet, authorKeys, authorPdfBytes);
      const safeName = authorWorksheet.title.replace(/[^a-zA-Z0-9\u00C0-\u024F\u1E00-\u1EFF_-]+/g, '_').slice(0, 60);
      triggerInteractiveDownload(bytes, `${safeName}_ban_goc_GV.pdfedu`, 'application/octet-stream');
      notify('Đã xuất tệp sao lưu bản gốc giáo viên (kèm đáp án).', 'success');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Không thể xuất bản gốc giáo viên.', 'error');
    }
  };

  // =========================================================================
  // STUDENT SOLVING & AUTO-SAVE ACTIONS
  // =========================================================================

  const loadTemplateIntoSolve = async (templateId: string) => {
    try {
      const built = await buildInteractiveSubjectTemplate(templateId);
      const safeWs = sanitizeWorksheetForStudent(built.worksheet);
      // Save teacher master copy too so teacher can immediately test grading flow on the same machine!
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
    [solveWorksheet, solvePdfBytes, solveDraftId, solveStudent, solveAnswers, solveStartedAt, notify, refreshLocalLists]
  );

  // Debounced auto-save every 2s whenever answers or student profile change
  useEffect(() => {
    if (!solveWorksheet || !solvePdfBytes) return;
    if (Object.keys(solveAnswers).length === 0 && !solveStudent.studentName.trim()) return;
    const timer = setTimeout(() => {
      persistCurrentSolveDraft(undefined, true);
    }, 1800);
    return () => clearTimeout(timer);
  }, [solveAnswers, solveStudent, solveWorksheet, solvePdfBytes, persistCurrentSolveDraft]);

  const handleLoadOnlineUrl = async () => {
    try {
      const parsed = await fetchWorksheetFromUrl(onlineUrlInput);
      if (parsed.kind !== 'worksheet') {
        notify('Liên kết này không phải gói bài tập tương tác dành cho học sinh.', 'warning');
        return;
      }
      setSolveDraftId(`draft-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);
      setSolveWorksheet(parsed.worksheet);
      setSolvePdfBytes(parsed.pdfBytes);
      setSolveAnswers({});
      setSolveStartedAt(Date.now());
      setOnlineUrlInput('');
      notify(`Đã tải bài tập trực tuyến "${parsed.worksheet.title}" (có thể tiếp tục làm offline).`, 'success');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Không thể tải bài tập từ URL.', 'error');
    }
  };

  const handleExportSubmissionPackage = async () => {
    if (!solveWorksheet || !solvePdfBytes) return;
    if (!solveStudent.studentName.trim()) {
      notify('Vui lòng nhập Họ và tên học sinh trước khi xuất tệp nộp bài.', 'warning');
      return;
    }
    try {
      await persistCurrentSolveDraft('completed', true);
      const { bytes } = await exportStudentSubmissionPackage({
        worksheet: solveWorksheet,
        student: solveStudent,
        answers: solveAnswers,
        pdfBytes: solvePdfBytes,
        startedAt: solveStartedAt,
        includeRenderedPdf: true,
      });
      const safeStu = solveStudent.studentName
        .trim()
        .replace(/[^a-zA-Z0-9\u00C0-\u024F\u1E00-\u1EFF_-]+/g, '_')
        .slice(0, 40);
      const safeClass = (solveStudent.className || 'Lop').replace(/[^a-zA-Z0-9_-]+/g, '_');
      triggerInteractiveDownload(bytes, `BaiNop_${safeClass}_${safeStu}.pdfedu`, 'application/octet-stream');
      notify('Đã xuất tệp bài nộp .pdfedu (đã gắn mã kiểm tra toàn vẹn). Hãy gửi tệp này cho giáo viên.', 'success');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Không thể xuất tệp bài nộp.', 'error');
    }
  };

  const handleExportStudentVisualPdf = async () => {
    if (!solveWorksheet || !solvePdfBytes) return;
    try {
      const bytes = await renderInteractiveAnswersToPdf({
        pdfBytes: solvePdfBytes,
        worksheet: solveWorksheet,
        student: solveStudent,
        answers: solveAnswers,
      });
      const safeStu = (solveStudent.studentName || 'HocSinh')
        .replace(/[^a-zA-Z0-9\u00C0-\u024F\u1E00-\u1EFF_-]+/g, '_')
        .slice(0, 40);
      triggerInteractiveDownload(bytes, `BaiLam_${safeStu}.pdf`, 'application/pdf');
      notify('Đã xuất tệp PDF bài làm (kèm đường nối ghép đôi, thẻ kéo thả và câu trả lời).', 'success');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Không thể xuất PDF bài làm.', 'error');
    }
  };

  const openSavedDraft = (draft: InteractiveDraftRecord) => {
    setSolveDraftId(draft.id);
    setSolveWorksheet(draft.worksheet);
    setSolvePdfBytes(draft.pdfBytes);
    setSolveStudent(draft.student);
    setSolveAnswers(draft.answers);
    setSolveStartedAt(draft.createdAt);
    setSolveSavedStatus('saved');
    setSolveLastSavedAt(draft.updatedAt);
    setInteractiveTab('solve');
    notify(`Đã mở lại bài "${draft.customTitle}" với đầy đủ câu trả lời đã lưu.`, 'success');
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
        if (parsed.kind !== 'submission') {
          skipped.push(`${file.name}: Không phải tệp bài nộp học sinh (.pdfedu).`);
          continue;
        }
        const sub = parsed.submission;
        const matchedMaster =
          allMasters.find((m) => m.worksheetId === sub.worksheetId) || activeTeacherMaster;
        const worksheetRef = matchedMaster?.worksheet || parsed.worksheetSnapshot;

        if (!worksheetRef) {
          skipped.push(`${file.name}: Không tìm thấy cấu trúc đề bài tương ứng.`);
          continue;
        }

        if (activeTeacherMaster && sub.worksheetId !== activeTeacherMaster.worksheetId && !allMasters.some((m) => m.worksheetId === sub.worksheetId)) {
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
          pdfBytes: parsed.pdfBytes,
          worksheetSnapshot: worksheetRef,
          gradingDetails: graded.gradingDetails,
          totalScore: graded.totalScore,
          maxScore: graded.maxScore,
          teacherComment: '',
          status: graded.hasManualPending ? 'in_progress' : 'graded',
          updatedAt: Date.now(),
        };

        // Check duplicate by submissionId or same student + worksheet
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
        skipped.push(`${file.name}: ${err instanceof Error ? err.message : 'Tệp không hợp lệ.'}`);
      }
    }

    setImportReport({ imported, skipped, duplicateGraded });
    await refreshLocalLists();
    if (firstWorksheetId && !gradeWorksheetId) setGradeWorksheetId(firstWorksheetId);
    if (firstImportedId) setSelectedSubmissionId(firstImportedId);
    if (imported > 0) {
      notify(`Đã nhập thành công ${imported} bài nộp học sinh và chấm tự động phần khách quan.`, 'success');
    } else if (skipped.length > 0) {
      notify(`Có ${skipped.length} tệp không nhập được. Xem chi tiết thông báo.`, 'warning');
    }
  };

  const updateActiveSubmissionGrade = async (
    updater: (rec: GradedSubmissionRecord) => GradedSubmissionRecord
  ) => {
    if (!activeSubmission) return;
    const updated = updater(activeSubmission);
    // Recompute total score strictly from gradingDetails
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
    setSubmissions((prev) => prev.map((s) => (s.submissionId === finalRec.submissionId ? finalRec : s)));
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
      triggerInteractiveDownload(bytes, `TraBai_${safeStu}_${activeSubmission.totalScore}d.pdf`, 'application/pdf');
      notify('Đã xuất PDF trả bài có kèm đáp án, đường nối, điểm số và nhận xét giáo viên.', 'success');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Không thể xuất PDF trả bài.', 'error');
    }
  };

  const handleExportGradebookExcel = () => {
    const ws =
      activeTeacherMaster?.worksheet || filteredSubmissions[0]?.worksheetSnapshot;
    if (!ws || filteredSubmissions.length === 0) {
      notify('Chưa có bài nộp nào để xuất bảng điểm Excel.', 'warning');
      return;
    }
    try {
      const buf = buildInteractiveGradebookBuffer(ws, filteredSubmissions);
      const safeTitle = ws.title.replace(/[^a-zA-Z0-9\u00C0-\u024F\u1E00-\u1EFF_-]+/g, '_').slice(0, 45);
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

  // Computed solve progress
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

  const gradingWorksheet =
    activeTeacherMaster?.worksheet || activeSubmission?.worksheetSnapshot || null;

  const SUB_TABS: Array<{ id: InteractiveSubTab; label: string; icon: React.ReactNode; badge?: number }> = [
    { id: 'author', label: 'Tạo bài tập', icon: <PenTool className="w-4 h-4" /> },
    { id: 'solve', label: 'Làm bài', icon: <Edit3 className="w-4 h-4" /> },
    { id: 'saved', label: 'Bài đã lưu', icon: <HardDrive className="w-4 h-4" />, badge: savedDrafts.length },
    { id: 'grade', label: 'Nhận và chấm bài', icon: <GraduationCap className="w-4 h-4" />, badge: submissions.length },
    { id: 'guide', label: 'Hướng dẫn sử dụng', icon: <BookOpen className="w-4 h-4" /> },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0 min-w-0 bg-[#F4F8F7] text-[#1F2937]">
      {/* Top Integrated Workspace Navigation Bar */}
      <div className="bg-white border-b border-slate-200 px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap shrink-0">
        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={closeInteractive}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-[#164E63] font-semibold text-[15px] cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại Studio</span>
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
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[15px] font-semibold transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#087F70] text-white shadow-2xs'
                      : 'bg-slate-100/80 text-slate-700 hover:bg-[#E6F1EF] hover:text-[#164E63]'
                  }`}
                >
                  {t.icon}
                  <span>{t.label}</span>
                  {typeof t.badge === 'number' && t.badge > 0 && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[12.5px] font-bold ${
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

        <div className="text-[14px] text-slate-600 hidden xl:block">
          Bài tập PDF tương tác Online/Offline · Xử lý 100% cục bộ
        </div>
      </div>

      {/* Quota Warning Banner (if IndexedDB quota is exceeded) */}
      {quotaBanner && (
        <div className="bg-amber-50 border-b border-amber-300 px-4 py-2.5 flex items-center justify-between gap-3 text-[15px] text-amber-950 shrink-0">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <span>{quotaBanner}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {solveWorksheet && (
              <button
                type="button"
                onClick={handleExportSubmissionPackage}
                className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-[14px] cursor-pointer"
              >
                Tải sao lưu .pdfedu ngay
              </button>
            )}
            <button
              type="button"
              onClick={() => setQuotaBanner(null)}
              className="px-2 py-1 rounded hover:bg-amber-200/60 text-[14px] font-semibold cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* ===================================================================
          AREA 1: TẠO BÀI TẬP (TEACHER AUTHORING)
      =================================================================== */}
      {tab === 'author' && (
        <div className="flex-1 flex min-h-0 min-w-0">
          {/* Left Palette: Source PDF + 12 Question Types + 8 Subject Templates */}
          <aside className="w-76 bg-white border-r border-slate-200 flex flex-col min-h-0 overflow-y-auto shrink-0 p-3.5 space-y-4">
            <div className="space-y-2">
              <div className="text-[15px] font-bold text-[#164E63]">1. Nguồn tài liệu PDF</div>
              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={() => authorPdfInputRef.current?.click()}
                  className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[#087F70] hover:bg-[#06695d] text-white font-semibold text-[14.5px] cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>Tải PDF từ máy tính</span>
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
                    className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-[#087F70] bg-[#E6F1EF] hover:bg-teal-100 text-[#164E63] font-semibold text-[14px] cursor-pointer"
                  >
                    <FileText className="w-4 h-4 shrink-0" />
                    <span className="truncate">Dùng PDF đang mở trong Studio</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => authorMasterInputRef.current?.click()}
                  className="inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-[14px] cursor-pointer"
                >
                  <FolderOpen className="w-4 h-4" />
                  <span>Mở bản gốc GV (.pdfedu)</span>
                </button>
              </div>
            </div>

            {/* 8 THPT Subject Templates */}
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <div className="text-[14.5px] font-bold text-[#164E63]">
                Hoặc dùng mẫu 8 môn THPT
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {INTERACTIVE_SUBJECT_TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => loadTemplateIntoAuthor(tpl.id)}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-[#F4F8F7] hover:border-[#087F70] hover:bg-teal-50 text-left transition-colors cursor-pointer"
                    title={tpl.subtitle}
                  >
                    <div className="text-[14px] font-bold text-[#164E63]">{tpl.subjectLabel}</div>
                    <div className="text-[12px] text-slate-600">Lớp {tpl.grade}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 12 Interactive Question Types Palette */}
            {authorWorksheet && (
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <div className="text-[14.5px] font-bold text-[#164E63]">
                  2. Đặt vùng câu hỏi (12 dạng)
                </div>
                <p className="text-[13px] text-slate-600">
                  Chọn 1 dạng câu hỏi rồi nhấp lên trang PDF để đặt vùng trả lời.
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
                        className={`flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg border text-left text-[14px] font-semibold transition-colors cursor-pointer ${
                          active
                            ? 'bg-[#087F70] border-[#087F70] text-white'
                            : 'bg-white border-slate-200 text-slate-800 hover:border-[#087F70] hover:bg-teal-50/40'
                        }`}
                      >
                        <span className="flex items-center gap-1.5 truncate">
                          <Plus className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{meta.shortLabel}</span>
                        </span>
                        <span
                          className={`text-[11.5px] px-1.5 py-0.5 rounded shrink-0 ${
                            active
                              ? 'bg-white/20 text-white'
                              : meta.autoGradable === 'manual'
                                ? 'bg-amber-50 text-amber-800'
                                : 'bg-teal-50 text-[#087F70]'
                          }`}
                        >
                          {meta.autoGradable === 'manual' ? 'Chấm tay' : 'Tự chấm'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </aside>

          {/* Center PDF Canvas + Author Action Header */}
          <div className="flex-1 flex flex-col min-w-0 min-h-0">
            {authorWorksheet && (
              <div className="bg-white border-b border-slate-200 px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap shrink-0">
                <div className="flex items-center gap-2.5 flex-1 min-w-[240px]">
                  <input
                    type="text"
                    value={authorWorksheet.title}
                    onChange={(e) =>
                      setAuthorWorksheet({ ...authorWorksheet, title: e.target.value })
                    }
                    className="flex-1 min-w-[200px] rounded-lg border border-slate-300 px-3 py-1.5 text-[15px] font-bold text-[#164E63] focus:border-[#087F70] outline-none"
                    placeholder="Tên bài tập PDF tương tác..."
                  />
                  <select
                    value={authorWorksheet.examMode}
                    onChange={(e) =>
                      setAuthorWorksheet({
                        ...authorWorksheet,
                        examMode: e.target.value as 'exam' | 'practice',
                      })
                    }
                    className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-[14px] font-semibold text-slate-700"
                    title="Chế độ làm bài"
                  >
                    <option value="exam">Chế độ Kiểm tra</option>
                    <option value="practice">Chế độ Luyện tập</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthorPreviewStudent((v) => !v);
                      setPlacingType(null);
                    }}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[14.5px] font-semibold cursor-pointer ${
                      authorPreviewStudent
                        ? 'bg-[#164E63] border-[#164E63] text-white'
                        : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <Eye className="w-4 h-4" />
                    <span>{authorPreviewStudent ? 'Thoát xem thử HS' : 'Xem thử vai HS'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={saveTeacherMasterLocally}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-[#164E63] font-semibold text-[14.5px] cursor-pointer"
                  >
                    <Save className="w-4 h-4 text-[#087F70]" />
                    <span>Lưu bản gốc GV</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleExportTeacherBackup}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-[14.5px] cursor-pointer"
                    title="Xuất bản sao lưu đề + đáp án riêng của giáo viên"
                  >
                    <Download className="w-4 h-4" />
                    <span>Sao lưu GV</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleExportStudentPackage}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#087F70] hover:bg-[#06695d] text-white font-semibold text-[14.5px] cursor-pointer shadow-2xs"
                  >
                    <FileDown className="w-4 h-4" />
                    <span>Xuất bài tập HS (.pdfedu)</span>
                  </button>
                </div>
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
                  ? QUESTION_TYPE_META[placingType].label
                  : null
              }
              onSelectQuestion={(id) => setSelectedAuthorQId(id)}
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

          {/* Right Inspector: Selected Question Properties & Answer Key */}
          {!authorPreviewStudent && (
            <aside className="w-88 bg-white border-l border-slate-200 overflow-y-auto shrink-0">
              {selectedAuthorQuestion && authorWorksheet ? (
                <TeacherQuestionInspector
                  question={selectedAuthorQuestion}
                  answerKey={authorKeys[selectedAuthorQuestion.id]}
                  examMode={authorWorksheet.examMode}
                  onUpdateQuestion={(patch) =>
                    updateAuthorQuestion(selectedAuthorQuestion.id, patch)
                  }
                  onUpdateKey={(nextKey) =>
                    setAuthorKeys((prev) => ({
                      ...prev,
                      [selectedAuthorQuestion.id]: nextKey,
                    }))
                  }
                  onDeleteQuestion={() => deleteAuthorQuestion(selectedAuthorQuestion.id)}
                />
              ) : (
                <div className="p-5 space-y-4 text-[14.5px] text-slate-600">
                  <div className="font-bold text-[#164E63] text-[16px]">
                    Thuộc tính & Đáp án câu hỏi
                  </div>
                  <p className="leading-relaxed">
                    Nhấp chọn một vùng câu hỏi trên trang PDF để chỉnh sửa nội dung, chuyển chế độ <strong>Vẽ đường nối / Kéo thả</strong> và cài đặt đáp án chuẩn của giáo viên.
                  </p>
                  {authorWorksheet && authorWorksheet.questions.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-slate-200">
                      <div className="font-semibold text-slate-700">
                        Danh sách câu hỏi ({authorWorksheet.questions.length})
                      </div>
                      {authorWorksheet.questions.map((q) => (
                        <button
                          key={q.id}
                          type="button"
                          onClick={() => setSelectedAuthorQId(q.id)}
                          className="w-full text-left px-3 py-2 rounded-lg border border-slate-200 hover:border-[#087F70] hover:bg-teal-50/40 flex items-center justify-between gap-2 cursor-pointer"
                        >
                          <span className="font-semibold text-[#164E63] truncate">
                            {q.code}: {q.title}
                          </span>
                          <span className="text-[13px] text-slate-500 shrink-0">
                            {q.maxPoints}đ
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </aside>
          )}
        </div>
      )}

      {/* ===================================================================
          AREA 2: LÀM BÀI (STUDENT INTERACTIVE WORKSPACE — ONLINE / OFFLINE)
      =================================================================== */}
      {tab === 'solve' && (
        <div className="flex-1 flex flex-col min-h-0 min-w-0">
          {!solveWorksheet ? (
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-5xl mx-auto space-y-6">
                <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-2xs space-y-4">
                  <h2 className="text-[21px] font-bold text-[#164E63]">
                    Mở bài tập PDF tương tác để làm bài (Online hoặc Offline)
                  </h2>
                  <p className="text-[15.5px] text-slate-600">
                    Mở tệp bài tập <strong>.pdfedu</strong> do giáo viên gửi, tải từ đường dẫn trực tuyến hợp lệ, hoặc chọn 1 trong 8 phiếu bài tập mẫu THPT bên dưới để thực hành ngay.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="rounded-xl border-2 border-dashed border-[#087F70]/50 bg-[#F4F8F7] p-5 space-y-3">
                      <div className="text-[16px] font-bold text-[#164E63] flex items-center gap-2">
                        <FolderOpen className="w-5 h-5 text-[#087F70]" />
                        <span>Mở tệp bài tập từ máy tính (Offline)</span>
                      </div>
                      <p className="text-[14.5px] text-slate-600">
                        Hỗ trợ gói bài tập <strong>.pdfedu</strong> hoạt động đầy đủ khi không có Internet.
                      </p>
                      <button
                        type="button"
                        onClick={() => solvePackageInputRef.current?.click()}
                        className="px-4 py-2 rounded-lg bg-[#087F70] hover:bg-[#06695d] text-white font-semibold text-[15px] cursor-pointer"
                      >
                        Chọn tệp .pdfedu từ máy
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
                          placeholder="https://.../bai_tap.pdfedu"
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
                          setConfirmResetSolve(false);
                          notify('Đã đặt lại toàn bộ câu trả lời.', 'info');
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
                    onClick={handleExportStudentVisualPdf}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#164E63] bg-white hover:bg-slate-50 text-[#164E63] font-semibold text-[14.5px] cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Xuất PDF bài làm</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportSubmissionPackage}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#087F70] hover:bg-[#06695d] text-white font-semibold text-[14.5px] cursor-pointer shadow-2xs"
                  >
                    <FileDown className="w-4 h-4" />
                    <span>Xuất bài nộp (.pdfedu)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSolveWorksheet(null);
                      setSolvePdfBytes(null);
                    }}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-[14px] text-slate-600 cursor-pointer"
                  >
                    Chọn bài khác
                  </button>
                </div>
              </div>

              <InteractivePdfCanvas
                pdfBytes={solvePdfBytes}
                questions={visibleSolveQuestions}
                mode="solve"
                examMode={solveWorksheet.examMode}
                answers={solveAnswers}
                teacherKeys={solveTemplateKeysForPractice}
                onChangeAnswer={(qId, next) =>
                  setSolveAnswers((prev) => ({ ...prev, [qId]: next }))
                }
              />
            </>
          )}
        </div>
      )}

      {/* ===================================================================
          AREA 3: BÀI ĐÃ LƯU (INDEXEDDB DRAFTS & COMPLETED ATTEMPTS)
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
                  Mở lại bài đang làm dở hoặc đã hoàn thành với đầy đủ câu trả lời, đường nối, thẻ kéo thả và nét vẽ.
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
                  Vào mục <strong>Làm bài</strong> để mở tệp .pdfedu hoặc phiếu mẫu 8 môn THPT. Mọi tiến độ sẽ tự động lưu tại đây.
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
                            Đã làm:{' '}
                            <strong className="text-[#087F70]">
                              {answeredCount}/{draft.worksheet.questions.length} câu
                            </strong>
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
                              pdfBytes: draft.pdfBytes,
                              startedAt: draft.createdAt,
                              includeRenderedPdf: false,
                            });
                            triggerInteractiveDownload(
                              bytes,
                              `SaoLuu_${draft.customTitle.slice(0, 35)}.pdfedu`,
                              'application/octet-stream'
                            );
                            notify('Đã tải bản sao lưu .pdfedu về máy tính.', 'success');
                          }}
                          className="px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-teal-50 text-[#164E63] font-semibold text-[14px] cursor-pointer"
                          title="Xuất bản sao lưu .pdfedu"
                        >
                          Sao lưu
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
          AREA 4: NHẬN VÀ CHẤM BÀI (TEACHER BATCH IMPORT, VISUAL GRADING, PDF & EXCEL)
      =================================================================== */}
      {tab === 'grade' && (
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
                  + Nạp tệp bản gốc GV (.pdfedu)
                </button>
              </div>

              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => gradeSubmissionsInputRef.current?.click()}
                  className="w-full inline-flex items-center justify-center gap-2 py-2 rounded-lg bg-[#087F70] hover:bg-[#06695d] text-white font-semibold text-[14.5px] cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>Nhập nhiều bài nộp HS (.pdfedu)</span>
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
                  Chưa có bài nộp học sinh nào. Nhấn nút phía trên để nhập 1 hoặc nhiều tệp .pdfedu.
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
                      {activeSubmission.student.className ? ` · Lớp ${activeSubmission.student.className}` : ''}
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
                          notify('Cần nạp bản gốc đáp án giáo viên để chạy tự chấm lại.', 'warning');
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
                        notify('Đã đối chiếu lại đáp án khách quan từ khóa gốc giáo viên.', 'success');
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
                  teacherKeys={activeTeacherMaster?.answerKeys}
                  gradingDetails={activeSubmission.gradingDetails}
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
                    Chọn một bài nộp của học sinh ở danh sách bên trái để xem câu trả lời, đường nối ghép đôi, thẻ kéo thả, hình vẽ và nhập điểm / nhận xét.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel: Per-Question Score & Teacher Comment Sheet */}
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
                      onClick={() => setSelectedGradeQId(q.id)}
                      className={`rounded-xl border p-3 space-y-2 transition-colors ${
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
                          onChange={(e) => {
                            const raw = e.target.value;
                            const val =
                              raw === ''
                                ? null
                                : Math.max(0, Math.min(q.maxPoints, Number(raw)));
                            updateActiveSubmissionGrade((rec) => ({
                              ...rec,
                              gradingDetails: {
                                ...rec.gradingDetails,
                                [q.id]: { ...detail, earnedPoints: val },
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

      {/* ===================================================================
          AREA 5: HƯỚNG DẪN SỬ DỤNG
      =================================================================== */}
      {tab === 'guide' && <InteractiveGuidePanel />}

      {/* Hidden File Pickers */}
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
        accept=".pdfedu"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleExternalPackageFile(f);
          e.target.value = '';
        }}
      />
      <input
        ref={solvePackageInputRef}
        type="file"
        accept=".pdfedu"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleExternalPackageFile(f);
          e.target.value = '';
        }}
      />
      <input
        ref={gradeSubmissionsInputRef}
        type="file"
        multiple
        accept=".pdfedu"
        className="hidden"
        onChange={(e) => {
          if (e.target.files) importStudentSubmissionFiles(e.target.files);
          e.target.value = '';
        }}
      />
      <input
        ref={gradeMasterInputRef}
        type="file"
        accept=".pdfedu"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleExternalPackageFile(f);
          e.target.value = '';
        }}
      />
    </div>
  );
};
