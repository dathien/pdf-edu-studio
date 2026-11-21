import { create } from 'zustand';
import type {
  ActiveTool,
  GradedPaperRecord,
  GradingSession,
  PageNumberConfig,
  PageTransform,
  RecentDocumentMeta,
  RibbonTabId,
  SavedCommentTemplate,
  SavedSignature,
  StudioDocument,
  StudioObject,
  SubjectCategory,
  ViewMode,
  WatermarkConfig,
  CustomShapeItem,
} from '../types/studio';
import { createDefaultGradingSession, computeGradingSummary } from '../engines/grading/gradingEngine';
import { storageService } from '../services/storageService';
import type { GuideGroupId } from '../features/help/guideData';
import type { InteractiveSubTab } from '../types/interactive';

export type ActiveModal =
  | null
  | 'help'
  | 'page-tools'
  | 'ocr'
  | 'dynamic-2d'
  | 'function-graph'
  | 'solid-3d'
  | 'signature'
  | 'find-replace'
  | 'export'
  | 'print'
  | 'settings';

export type RightPanelMode = 'properties' | 'formula' | 'diagrams' | 'grading' | 'security';

interface ToastNotification {
  id: string;
  message: string;
  tone: 'success' | 'info' | 'warning' | 'error';
}

export interface PdfErrorState {
  title: string;
  message: string;
  detail?: string;
  onRetry?: () => void;
}

interface StudioState {
  documents: StudioDocument[];
  activeDocId: string | null;
  ribbonTab: RibbonTabId;
  activeTool: ActiveTool;
  selectedObjectIds: string[];
  rightPanelMode: RightPanelMode;
  leftSidebarOpen: boolean;
  rightSidebarOpen: boolean;
  leftSidebarWidth: number;
  rightSidebarWidth: number;
  isFullscreen: boolean;
  activeModal: ActiveModal;
  editingFormulaObjectId: string | null;
  guideView: { open: boolean; groupId: GuideGroupId; featureId?: string };
  interactiveView: { open: boolean; tab: InteractiveSubTab; pendingPackageFile: File | null };

  // Tool presets
  penColor: string;
  penWidth: number;
  penOpacity: number;
  activeStampCode: string;
  activeStampLabel: string;
  activeStampColor: string;
  activeQuestionIdForScore: string;
  defaultTextColor: string;
  defaultTextSize: number;

  // Local IndexedDB libraries
  recentDocs: RecentDocumentMeta[];
  savedSignatures: SavedSignature[];
  customShapes: CustomShapeItem[];
  commentTemplates: SavedCommentTemplate[];
  gradedPapers: GradedPaperRecord[];

  // Clipboard, Toasts & PDF Error Dialog
  clipboardObjects: StudioObject[];
  toasts: ToastNotification[];
  busyMessage: string | null;
  pdfError: PdfErrorState | null;

  // Actions
  initLocalLibraries: () => Promise<void>;
  notify: (message: string, tone?: ToastNotification['tone']) => void;
  dismissToast: (id: string) => void;
  setBusy: (message: string | null) => void;
  setPdfError: (err: PdfErrorState | null) => void;

  setRibbonTab: (tab: RibbonTabId) => void;
  setActiveTool: (tool: ActiveTool) => void;
  setRightPanelMode: (mode: RightPanelMode) => void;
  toggleLeftSidebar: () => void;
  toggleRightSidebar: () => void;
  setLeftSidebarWidth: (w: number) => void;
  setRightSidebarWidth: (w: number) => void;
  setActiveModal: (modal: ActiveModal) => void;
  setEditingFormulaObjectId: (id: string | null) => void;
  setIsFullscreen: (v: boolean) => void;
  openGuide: (groupId?: GuideGroupId, featureId?: string) => void;
  closeGuide: () => void;
  openInteractive: (tab?: InteractiveSubTab, pendingFile?: File | null) => void;
  setInteractiveTab: (tab: InteractiveSubTab) => void;
  closeInteractive: () => void;
  clearPendingInteractiveFile: () => void;

  setPenConfig: (patch: Partial<{ penColor: string; penWidth: number; penOpacity: number }>) => void;
  setStampPreset: (code: string, label: string, color: string) => void;
  setActiveQuestionIdForScore: (qId: string) => void;

  // Document lifecycle
  openDocument: (params: {
    id?: string;
    title: string;
    fileName: string;
    pdfBytes: Uint8Array;
    pages: PageTransform[];
    objects?: StudioObject[];
    grading?: GradingSession;
    watermark?: WatermarkConfig;
    pageNumbers?: PageNumberConfig;
    subjectHint?: SubjectCategory;
    isConfidential?: boolean;
  }) => string;
  setActiveDoc: (id: string | null) => void;
  closeDocument: (id: string) => void;
  setDocZoom: (zoom: number) => void;
  setDocViewMode: (mode: ViewMode) => void;
  setCurrentPageIndex: (idx: number) => void;
  setDocConfidential: (val: boolean) => void;
  markDocSaved: (docId?: string) => void;

  // Objects & Undo/Redo
  selectObjects: (ids: string[]) => void;
  addObject: (obj: StudioObject, recordHistory?: boolean) => void;
  updateObject: (id: string, patch: Partial<StudioObject>, recordHistory?: boolean) => void;
  deleteObjects: (ids: string[]) => void;
  duplicateSelected: () => void;
  copySelected: () => void;
  pasteClipboard: () => void;
  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;
  alignSelected: (alignment: 'left' | 'center' | 'right' | 'top' | 'bottom') => void;
  groupSelected: () => void;
  ungroupSelected: () => void;

  // Page transforms
  updatePages: (pages: PageTransform[], newPdfBytes?: Uint8Array) => void;
  updateWatermark: (patch: Partial<WatermarkConfig>) => void;
  updatePageNumbers: (patch: Partial<PageNumberConfig>) => void;

  // Grading (synced bidirectionally with grading-score objects)
  updateGradingSession: (updater: (g: GradingSession) => GradingSession, recordHistory?: boolean) => void;
  setQuestionScoreSynced: (questionId: string, newScore: number | null) => void;
  saveCurrentPaperToGradebook: () => Promise<void>;

  // History
  undo: () => void;
  redo: () => void;

  // Libraries
  addSavedSignature: (sig: SavedSignature) => Promise<void>;
  removeSavedSignature: (id: string) => Promise<void>;
  addCustomShape: (item: CustomShapeItem) => Promise<void>;
  removeCustomShape: (id: string) => Promise<void>;
  addCommentTemplate: (tpl: SavedCommentTemplate) => Promise<void>;
  removeCommentTemplate: (id: string) => Promise<void>;
  removeRecentDoc: (id: string) => Promise<void>;
  clearPersonalData: () => Promise<void>;
}

const DEFAULT_WATERMARK: WatermarkConfig = {
  enabled: false,
  kind: 'text',
  text: 'TÀI LIỆU GIẢNG DẠY',
  fontSize: 42,
  rotation: 38,
  opacity: 0.16,
  color: '#087F70',
  position: 'center',
  scope: 'all',
};

const DEFAULT_PAGE_NUMBERS: PageNumberConfig = {
  enabled: false,
  position: 'footer',
  align: 'center',
  startNumber: 1,
  fontSize: 11,
  color: '#4B5563',
  format: 'vietnamese',
};

function pushHistory(doc: StudioDocument): StudioDocument {
  const snap = {
    pages: structuredClone(doc.pages),
    objects: structuredClone(doc.objects),
    grading: structuredClone(doc.grading),
  };
  const trimmed = doc.history.slice(0, doc.historyIndex + 1);
  const nextHistory = [...trimmed, snap].slice(-40);
  return {
    ...doc,
    history: nextHistory,
    historyIndex: nextHistory.length - 1,
    isDirty: true,
  };
}

let draftSaveTimer: number | null = null;
function scheduleDraftSave(doc: StudioDocument | undefined) {
  if (!doc || doc.isConfidential) return;
  if (draftSaveTimer) window.clearTimeout(draftSaveTimer);
  draftSaveTimer = window.setTimeout(() => {
    storageService.saveDraft(doc).catch(() => {});
  }, 1400);
}

export const useStudioStore = create<StudioState>((set, get) => ({
  documents: [],
  activeDocId: null,
  ribbonTab: 'edit',
  activeTool: 'select',
  selectedObjectIds: [],
  rightPanelMode: 'properties',
  leftSidebarOpen: true,
  rightSidebarOpen: true,
  leftSidebarWidth: 210,
  rightSidebarWidth: 330,
  isFullscreen: false,
  activeModal: null,
  editingFormulaObjectId: null,
  guideView: { open: false, groupId: 'open-save-print', featureId: 'mo-va-tao-pdf' },
  interactiveView: { open: false, tab: 'solve', pendingPackageFile: null },

  penColor: '#DC2626',
  penWidth: 2.5,
  penOpacity: 1,
  activeStampCode: 'correct-mark',
  activeStampLabel: '✓ Đúng',
  activeStampColor: '#059669',
  activeQuestionIdForScore: 'q1',
  defaultTextColor: '#1F2937',
  defaultTextSize: 13,

  recentDocs: [],
  savedSignatures: [],
  customShapes: [],
  commentTemplates: [],
  gradedPapers: [],

  clipboardObjects: [],
  toasts: [],
  busyMessage: null,
  pdfError: null,

  async initLocalLibraries() {
    try {
      const [recentDocs, savedSignatures, customShapes, commentTemplates, gradedPapers] =
        await Promise.all([
          storageService.listRecentDocs(),
          storageService.listSignatures(),
          storageService.listCustomShapes(),
          storageService.listComments(),
          storageService.listGradedPapers(),
        ]);
      set({ recentDocs, savedSignatures, customShapes, commentTemplates, gradedPapers });
    } catch {
      // IndexedDB unavailable in restricted mode
    }
  },

  notify(message, tone = 'info') {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
    set((s) => ({ toasts: [...s.toasts.slice(-3), { id, message, tone }] }));
    window.setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 3600);
  },

  dismissToast(id) {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
  },

  setBusy(message) {
    set({ busyMessage: message });
  },

  setPdfError(err) {
    set({ pdfError: err });
  },

  setRibbonTab(tab) {
    const updates: Partial<StudioState> = { ribbonTab: tab };
    if (tab === 'formula') {
      updates.rightPanelMode = 'formula';
      updates.rightSidebarOpen = true;
    } else if (tab === 'draw') {
      updates.rightPanelMode = 'diagrams';
      updates.rightSidebarOpen = true;
    } else if (tab === 'grade') {
      updates.rightPanelMode = 'grading';
      updates.rightSidebarOpen = true;
    } else if (tab === 'security') {
      updates.rightPanelMode = 'security';
      updates.rightSidebarOpen = true;
    }
    set(updates);
  },

  setActiveTool(tool) {
    set({ activeTool: tool });
  },

  setRightPanelMode(mode) {
    set({ rightPanelMode: mode, rightSidebarOpen: true });
  },

  toggleLeftSidebar() {
    set((s) => ({ leftSidebarOpen: !s.leftSidebarOpen }));
  },

  toggleRightSidebar() {
    set((s) => ({ rightSidebarOpen: !s.rightSidebarOpen }));
  },

  setLeftSidebarWidth(w) {
    set({ leftSidebarWidth: Math.max(160, Math.min(340, w)) });
  },

  setRightSidebarWidth(w) {
    set({ rightSidebarWidth: Math.max(270, Math.min(480, w)) });
  },

  setActiveModal(modal) {
    set({ activeModal: modal });
  },

  setEditingFormulaObjectId(id) {
    set({ editingFormulaObjectId: id, rightPanelMode: 'formula', rightSidebarOpen: true });
  },

  setIsFullscreen(v) {
    set({ isFullscreen: v });
  },

  openGuide(groupId, featureId) {
    set((s) => ({
      activeModal: null,
      interactiveView: { ...s.interactiveView, open: false },
      guideView: {
        open: true,
        groupId: groupId || s.guideView.groupId || 'open-save-print',
        featureId: groupId ? featureId : featureId ?? s.guideView.featureId,
      },
    }));
  },

  closeGuide() {
    set((s) => ({
      guideView: { ...s.guideView, open: false },
    }));
  },

  openInteractive(tab, pendingFile = null) {
    set((s) => ({
      activeModal: null,
      guideView: { ...s.guideView, open: false },
      interactiveView: {
        open: true,
        tab: tab || s.interactiveView.tab || 'solve',
        pendingPackageFile: pendingFile ?? s.interactiveView.pendingPackageFile,
      },
    }));
  },

  setInteractiveTab(tab) {
    set((s) => ({
      interactiveView: { ...s.interactiveView, open: true, tab },
    }));
  },

  closeInteractive() {
    set((s) => ({
      interactiveView: { ...s.interactiveView, open: false },
    }));
  },

  clearPendingInteractiveFile() {
    set((s) => ({
      interactiveView: { ...s.interactiveView, pendingPackageFile: null },
    }));
  },

  setPenConfig(patch) {
    set(patch);
  },

  setStampPreset(code, label, color) {
    set({ activeStampCode: code, activeStampLabel: label, activeStampColor: color, activeTool: 'grade-stamp' });
  },

  setActiveQuestionIdForScore(qId) {
    set({ activeQuestionIdForScore: qId, activeTool: 'grade-score' });
  },

  openDocument(params) {
    const id = params.id || `doc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const grading = params.grading || createDefaultGradingSession(params.title);
    const objects = params.objects || [];
    const initialSnap = {
      pages: structuredClone(params.pages),
      objects: structuredClone(objects),
      grading: structuredClone(grading),
    };
    const newDoc: StudioDocument = {
      id,
      title: params.title,
      fileName: params.fileName,
      originalPdfBytes: new Uint8Array(params.pdfBytes),
      currentPdfBytes: new Uint8Array(params.pdfBytes),
      pages: params.pages,
      objects,
      grading,
      watermark: params.watermark || { ...DEFAULT_WATERMARK },
      pageNumbers: params.pageNumbers || { ...DEFAULT_PAGE_NUMBERS },
      subjectHint: params.subjectHint || 'general',
      zoom: 1.0,
      viewMode: 'continuous',
      currentPageIndex: 0,
      isDirty: false,
      isConfidential: params.isConfidential ?? false,
      history: [initialSnap],
      historyIndex: 0,
    };

    set((s) => {
      const existing = s.documents.find((d) => d.id === id);
      if (existing) {
        return { activeDocId: id, selectedObjectIds: [] };
      }
      return {
        documents: [...s.documents, newDoc],
        activeDocId: id,
        selectedObjectIds: [],
      };
    });

    scheduleDraftSave(newDoc);
    get().initLocalLibraries();
    return id;
  },

  setActiveDoc(id) {
    set({ activeDocId: id, selectedObjectIds: [], editingFormulaObjectId: null });
  },

  closeDocument(id) {
    set((s) => {
      const nextDocs = s.documents.filter((d) => d.id !== id);
      const nextActive =
        s.activeDocId === id ? (nextDocs.length > 0 ? nextDocs[nextDocs.length - 1].id : null) : s.activeDocId;
      return {
        documents: nextDocs,
        activeDocId: nextActive,
        selectedObjectIds: [],
        editingFormulaObjectId: null,
      };
    });
  },

  setDocZoom(zoom) {
    const clamped = Math.max(0.25, Math.min(5.0, Math.round(zoom * 100) / 100));
    set((s) => ({
      documents: s.documents.map((d) => (d.id === s.activeDocId ? { ...d, zoom: clamped } : d)),
    }));
  },

  setDocViewMode(mode) {
    set((s) => ({
      documents: s.documents.map((d) => (d.id === s.activeDocId ? { ...d, viewMode: mode } : d)),
    }));
  },

  setCurrentPageIndex(idx) {
    set((s) => ({
      documents: s.documents.map((d) => {
        if (d.id !== s.activeDocId) return d;
        const safe = Math.max(0, Math.min(d.pages.length - 1, idx));
        return { ...d, currentPageIndex: safe };
      }),
    }));
  },

  setDocConfidential(val) {
    set((s) => ({
      documents: s.documents.map((d) => (d.id === s.activeDocId ? { ...d, isConfidential: val } : d)),
    }));
  },

  markDocSaved(docId) {
    const targetId = docId || get().activeDocId;
    set((s) => ({
      documents: s.documents.map((d) =>
        d.id === targetId ? { ...d, isDirty: false, savedAt: Date.now() } : d
      ),
    }));
  },

  selectObjects(ids) {
    if (ids.length === 1) {
      const state = get();
      const doc = state.documents.find((d) => d.id === state.activeDocId);
      const target = doc?.objects.find((o) => o.id === ids[0]);
      if (target) {
        let nextMode: RightPanelMode = 'properties';
        if (target.type === 'formula') nextMode = 'formula';
        else if (target.type === 'diagram') nextMode = 'properties';
        else if (
          target.type === 'grading-score' ||
          target.type === 'grading-stamp' ||
          target.type === 'grading-comment' ||
          target.type === 'grading-total'
        ) {
          nextMode = 'grading';
        } else if (target.type === 'redaction') {
          nextMode = 'security';
        }
        set({ selectedObjectIds: ids, rightPanelMode: nextMode });
        return;
      }
    }
    set({ selectedObjectIds: ids });
  },

  addObject(obj, recordHistory = true) {
    let updatedDoc: StudioDocument | undefined;
    set((s) => ({
      documents: s.documents.map((d) => {
        if (d.id !== s.activeDocId) return d;
        const maxZ = d.objects.reduce((m, o) => Math.max(m, o.zIndex), 0);
        const withZ = { ...obj, zIndex: maxZ + 1 };
        let nextObjects = [...d.objects, withZ];
        let nextGrading = d.grading;

        // If placing a grading-score badge linked to a question, replace any previous badge for the SAME questionId to prevent double-counting!
        if (withZ.type === 'grading-score') {
          nextObjects = [...d.objects.filter((o) => !(o.type === 'grading-score' && o.questionId === withZ.questionId)), withZ];
          nextGrading = {
            ...d.grading,
            status: d.grading.status === 'ungraded' ? 'in_progress' : d.grading.status,
            questions: d.grading.questions.map((q) =>
              q.id === withZ.questionId ? { ...q, earnedScore: Math.min(q.maxScore, withZ.score) } : q
            ),
          };
        }

        const nextDoc = { ...d, objects: nextObjects, grading: nextGrading, isDirty: true };
        updatedDoc = recordHistory ? pushHistory(nextDoc) : nextDoc;
        return updatedDoc;
      }),
      selectedObjectIds: [obj.id],
    }));
    scheduleDraftSave(updatedDoc);
  },

  updateObject(id, patch, recordHistory = true) {
    let updatedDoc: StudioDocument | undefined;
    set((s) => ({
      documents: s.documents.map((d) => {
        if (d.id !== s.activeDocId) return d;
        let nextGrading = d.grading;
        const nextObjects = d.objects.map((o) => {
          if (o.id !== id) return o;
          const updated = { ...o, ...patch } as StudioObject;
          if (updated.type === 'grading-score') {
            nextGrading = {
              ...d.grading,
              questions: d.grading.questions.map((q) =>
                q.id === updated.questionId
                  ? { ...q, earnedScore: Math.min(q.maxScore, Math.max(0, updated.score)) }
                  : q
              ),
            };
          }
          return updated;
        });
        const nextDoc = { ...d, objects: nextObjects, grading: nextGrading, isDirty: true };
        updatedDoc = recordHistory ? pushHistory(nextDoc) : nextDoc;
        return updatedDoc;
      }),
    }));
    scheduleDraftSave(updatedDoc);
  },

  deleteObjects(ids) {
    if (ids.length === 0) return;
    const idSet = new Set(ids);
    let updatedDoc: StudioDocument | undefined;
    set((s) => ({
      documents: s.documents.map((d) => {
        if (d.id !== s.activeDocId) return d;
        const removedScores = d.objects.filter(
          (o): o is Extract<StudioObject, { type: 'grading-score' }> =>
            idSet.has(o.id) && o.type === 'grading-score'
        );
        let nextGrading = d.grading;
        if (removedScores.length > 0) {
          const removedQIds = new Set(removedScores.map((r) => r.questionId));
          nextGrading = {
            ...d.grading,
            questions: d.grading.questions.map((q) =>
              removedQIds.has(q.id) ? { ...q, earnedScore: null } : q
            ),
          };
        }
        const nextDoc = {
          ...d,
          objects: d.objects.filter((o) => !idSet.has(o.id) || o.locked),
          grading: nextGrading,
          isDirty: true,
        };
        updatedDoc = pushHistory(nextDoc);
        return updatedDoc;
      }),
      selectedObjectIds: [],
    }));
    scheduleDraftSave(updatedDoc);
  },

  duplicateSelected() {
    const state = get();
    const doc = state.documents.find((d) => d.id === state.activeDocId);
    if (!doc || state.selectedObjectIds.length === 0) return;
    const sel = doc.objects.filter((o) => state.selectedObjectIds.includes(o.id) && o.type !== 'grading-score');
    if (sel.length === 0) return;
    const newIds: string[] = [];
    const copies = sel.map((o, idx) => {
      const nid = `obj-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 5)}`;
      newIds.push(nid);
      return { ...structuredClone(o), id: nid, x: o.x + 18, y: o.y + 18, locked: false };
    });
    let updatedDoc: StudioDocument | undefined;
    set((s) => ({
      documents: s.documents.map((d) => {
        if (d.id !== s.activeDocId) return d;
        const maxZ = d.objects.reduce((m, o) => Math.max(m, o.zIndex), 0);
        const stamped = copies.map((c, i) => ({ ...c, zIndex: maxZ + i + 1 }));
        updatedDoc = pushHistory({ ...d, objects: [...d.objects, ...stamped], isDirty: true });
        return updatedDoc;
      }),
      selectedObjectIds: newIds,
    }));
    scheduleDraftSave(updatedDoc);
  },

  copySelected() {
    const state = get();
    const doc = state.documents.find((d) => d.id === state.activeDocId);
    if (!doc) return;
    const sel = doc.objects.filter((o) => state.selectedObjectIds.includes(o.id));
    if (sel.length > 0) {
      set({ clipboardObjects: structuredClone(sel) });
      get().notify(`Đã sao chép ${sel.length} đối tượng`, 'info');
    }
  },

  pasteClipboard() {
    const state = get();
    const doc = state.documents.find((d) => d.id === state.activeDocId);
    if (!doc || state.clipboardObjects.length === 0) return;
    const currentPage = doc.pages[doc.currentPageIndex];
    if (!currentPage) return;
    const newIds: string[] = [];
    const pasted = state.clipboardObjects.map((o, idx) => {
      const nid = `obj-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 5)}`;
      newIds.push(nid);
      return {
        ...structuredClone(o),
        id: nid,
        pageId: currentPage.id,
        x: o.x + 20,
        y: o.y + 20,
        locked: false,
      };
    });
    let updatedDoc: StudioDocument | undefined;
    set((s) => ({
      documents: s.documents.map((d) => {
        if (d.id !== s.activeDocId) return d;
        const maxZ = d.objects.reduce((m, o) => Math.max(m, o.zIndex), 0);
        const withZ = pasted.map((p, i) => ({ ...p, zIndex: maxZ + i + 1 }));
        updatedDoc = pushHistory({ ...d, objects: [...d.objects, ...withZ], isDirty: true });
        return updatedDoc;
      }),
      selectedObjectIds: newIds,
    }));
    scheduleDraftSave(updatedDoc);
  },

  bringToFront(id) {
    set((s) => ({
      documents: s.documents.map((d) => {
        if (d.id !== s.activeDocId) return d;
        const maxZ = d.objects.reduce((m, o) => Math.max(m, o.zIndex), 0);
        return pushHistory({
          ...d,
          objects: d.objects.map((o) => (o.id === id ? { ...o, zIndex: maxZ + 1 } : o)),
        });
      }),
    }));
  },

  sendToBack(id) {
    set((s) => ({
      documents: s.documents.map((d) => {
        if (d.id !== s.activeDocId) return d;
        const minZ = d.objects.reduce((m, o) => Math.min(m, o.zIndex), 1);
        return pushHistory({
          ...d,
          objects: d.objects.map((o) => (o.id === id ? { ...o, zIndex: minZ - 1 } : o)),
        });
      }),
    }));
  },

  alignSelected(alignment) {
    const state = get();
    const doc = state.documents.find((d) => d.id === state.activeDocId);
    if (!doc || state.selectedObjectIds.length < 2) return;
    const sel = doc.objects.filter((o) => state.selectedObjectIds.includes(o.id) && !o.locked);
    if (sel.length < 2) return;

    const minX = Math.min(...sel.map((o) => o.x));
    const maxRight = Math.max(...sel.map((o) => o.x + o.width));
    const midX = (minX + maxRight) / 2;
    const minY = Math.min(...sel.map((o) => o.y));
    const maxBottom = Math.max(...sel.map((o) => o.y + o.height));

    set((s) => ({
      documents: s.documents.map((d) => {
        if (d.id !== s.activeDocId) return d;
        return pushHistory({
          ...d,
          objects: d.objects.map((o) => {
            if (!state.selectedObjectIds.includes(o.id) || o.locked) return o;
            if (alignment === 'left') return { ...o, x: minX };
            if (alignment === 'right') return { ...o, x: maxRight - o.width };
            if (alignment === 'center') return { ...o, x: midX - o.width / 2 };
            if (alignment === 'top') return { ...o, y: minY };
            if (alignment === 'bottom') return { ...o, y: maxBottom - o.height };
            return o;
          }),
        });
      }),
    }));
  },

  groupSelected() {
    const state = get();
    if (state.selectedObjectIds.length < 2) return;
    const gid = `grp-${Date.now()}`;
    set((s) => ({
      documents: s.documents.map((d) => {
        if (d.id !== s.activeDocId) return d;
        return pushHistory({
          ...d,
          objects: d.objects.map((o) =>
            state.selectedObjectIds.includes(o.id) ? { ...o, groupId: gid } : o
          ),
        });
      }),
    }));
    get().notify('Đã nhóm các đối tượng đã chọn', 'success');
  },

  ungroupSelected() {
    const state = get();
    set((s) => ({
      documents: s.documents.map((d) => {
        if (d.id !== s.activeDocId) return d;
        return pushHistory({
          ...d,
          objects: d.objects.map((o) =>
            state.selectedObjectIds.includes(o.id) ? { ...o, groupId: undefined } : o
          ),
        });
      }),
    }));
    get().notify('Đã bỏ nhóm đối tượng', 'info');
  },

  updatePages(pages, newPdfBytes) {
    let updatedDoc: StudioDocument | undefined;
    set((s) => ({
      documents: s.documents.map((d) => {
        if (d.id !== s.activeDocId) return d;
        const validIds = new Set(pages.map((p) => p.id));
        const nextDoc = {
          ...d,
          pages,
          currentPdfBytes: newPdfBytes ? new Uint8Array(newPdfBytes) : d.currentPdfBytes,
          objects: d.objects.filter((o) => validIds.has(o.pageId)),
          currentPageIndex: Math.min(d.currentPageIndex, Math.max(0, pages.length - 1)),
          isDirty: true,
        };
        updatedDoc = pushHistory(nextDoc);
        return updatedDoc;
      }),
    }));
    scheduleDraftSave(updatedDoc);
  },

  updateWatermark(patch) {
    set((s) => ({
      documents: s.documents.map((d) =>
        d.id === s.activeDocId ? { ...d, watermark: { ...d.watermark, ...patch }, isDirty: true } : d
      ),
    }));
  },

  updatePageNumbers(patch) {
    set((s) => ({
      documents: s.documents.map((d) =>
        d.id === s.activeDocId ? { ...d, pageNumbers: { ...d.pageNumbers, ...patch }, isDirty: true } : d
      ),
    }));
  },

  updateGradingSession(updater, recordHistory = true) {
    let updatedDoc: StudioDocument | undefined;
    set((s) => ({
      documents: s.documents.map((d) => {
        if (d.id !== s.activeDocId) return d;
        const nextGrading = updater(d.grading);
        // Keep placed grading-score objects synced with question table
        const qMap = new Map(nextGrading.questions.map((q) => [q.id, q]));
        const nextObjects = d.objects.map((o) => {
          if (o.type !== 'grading-score') return o;
          const q = qMap.get(o.questionId);
          if (!q) return o;
          return {
            ...o,
            questionLabel: q.label,
            maxScore: q.maxScore,
            score: q.earnedScore ?? o.score,
          };
        });
        const nextDoc = { ...d, grading: nextGrading, objects: nextObjects, isDirty: true };
        updatedDoc = recordHistory ? pushHistory(nextDoc) : nextDoc;
        return updatedDoc;
      }),
    }));
    scheduleDraftSave(updatedDoc);
  },

  setQuestionScoreSynced(questionId, newScore) {
    get().updateGradingSession((g) => ({
      ...g,
      status: g.status === 'ungraded' ? 'in_progress' : g.status,
      questions: g.questions.map((q) =>
        q.id === questionId
          ? { ...q, earnedScore: newScore === null ? null : Math.min(q.maxScore, Math.max(0, newScore)) }
          : q
      ),
    }));
  },

  async saveCurrentPaperToGradebook() {
    const state = get();
    const doc = state.documents.find((d) => d.id === state.activeDocId);
    if (!doc) return;
    const summary = computeGradingSummary(doc.grading);
    const rec: GradedPaperRecord = {
      id: doc.grading.id,
      docId: doc.id,
      examTitle: doc.grading.examTitle || doc.title,
      subject: doc.grading.subject || 'Chung',
      className: doc.grading.className || '',
      studentName: doc.grading.studentName || 'Chưa nhập tên',
      studentCode: doc.grading.studentCode || '',
      rawScore: summary.rawTotal,
      finalScore: summary.finalScore,
      scaleMax: summary.scaleMax,
      comment: doc.grading.teacherComment,
      status: doc.grading.status,
      updatedAt: Date.now(),
    };
    await storageService.saveGradedPaper(rec);
    const gradedPapers = await storageService.listGradedPapers();
    set({ gradedPapers });
    get().notify('Đã lưu kết quả chấm bài vào bảng điểm cục bộ', 'success');
  },

  undo() {
    set((s) => ({
      documents: s.documents.map((d) => {
        if (d.id !== s.activeDocId || d.historyIndex <= 0) return d;
        const prevIdx = d.historyIndex - 1;
        const snap = d.history[prevIdx];
        return {
          ...d,
          pages: structuredClone(snap.pages),
          objects: structuredClone(snap.objects),
          grading: structuredClone(snap.grading),
          historyIndex: prevIdx,
          isDirty: true,
        };
      }),
      selectedObjectIds: [],
    }));
  },

  redo() {
    set((s) => ({
      documents: s.documents.map((d) => {
        if (d.id !== s.activeDocId || d.historyIndex >= d.history.length - 1) return d;
        const nextIdx = d.historyIndex + 1;
        const snap = d.history[nextIdx];
        return {
          ...d,
          pages: structuredClone(snap.pages),
          objects: structuredClone(snap.objects),
          grading: structuredClone(snap.grading),
          historyIndex: nextIdx,
          isDirty: true,
        };
      }),
      selectedObjectIds: [],
    }));
  },

  async addSavedSignature(sig) {
    await storageService.saveSignature(sig);
    set({ savedSignatures: await storageService.listSignatures() });
  },

  async removeSavedSignature(id) {
    await storageService.deleteSignature(id);
    set({ savedSignatures: await storageService.listSignatures() });
  },

  async addCustomShape(item) {
    await storageService.saveCustomShape(item);
    set({ customShapes: await storageService.listCustomShapes() });
    get().notify(`Đã lưu "${item.title}" vào thư viện cá nhân`, 'success');
  },

  async removeCustomShape(id) {
    await storageService.deleteCustomShape(id);
    set({ customShapes: await storageService.listCustomShapes() });
  },

  async addCommentTemplate(tpl) {
    await storageService.saveComment(tpl);
    set({ commentTemplates: await storageService.listComments() });
  },

  async removeCommentTemplate(id) {
    await storageService.deleteComment(id);
    set({ commentTemplates: await storageService.listComments() });
  },

  async removeRecentDoc(id) {
    await storageService.deleteRecentDoc(id);
    set({ recentDocs: await storageService.listRecentDocs() });
  },

  async clearPersonalData() {
    await storageService.clearAllPersonalData();
    set({ recentDocs: [], savedSignatures: [], customShapes: [], gradedPapers: [] });
    get().notify('Đã xóa toàn bộ dữ liệu cá nhân lưu cục bộ trên trình duyệt', 'info');
  },
}));
