import React, { Suspense, useCallback, useEffect, useRef } from 'react';
import { Loader2, X } from 'lucide-react';
import { HeaderBar } from './components/HeaderBar';
import { PwaInstallManager } from './components/PwaInstallManager';
import { DocumentTabs } from './components/DocumentTabs';
import { RibbonToolbar } from './components/RibbonToolbar';
import { StatusBar } from './components/StatusBar';
import { PdfErrorDialog } from './components/PdfErrorDialog';
import { FeatureErrorBoundary } from './components/FeatureErrorBoundary';
import { WelcomeScreen } from './features/welcome/WelcomeScreen';
import { useStudioStore } from './stores/useStudioStore';
import { usePWAInstall } from './hooks/usePWAInstall';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { openFilesInStudio } from './services/documentActions';
import { createRetryableLazy } from './utils/lazyWithRetry';

// Retryable lazy-loaded subsystems so initial startup stays ultra-light
// and clicking "Thử lại" genuinely clears any failed dynamic import cache
const PdfWorkspace = createRetryableLazy(() =>
  import('./features/pdf-viewer/PdfWorkspace').then((m) => ({
    default: m.PdfWorkspace,
  }))
);
const RightSidebarShell = createRetryableLazy(() =>
  import('./components/RightSidebarShell').then((m) => ({
    default: m.RightSidebarShell,
  }))
);
const UserGuidePage = createRetryableLazy(() =>
  import('./features/help/UserGuidePage').then((m) => ({
    default: m.UserGuidePage,
  }))
);
const InteractiveWorksheetHub = createRetryableLazy(() =>
  import('./features/interactive/InteractiveWorksheetHub').then((m) => ({
    default: m.InteractiveWorksheetHub,
  }))
);
const DynamicGeometryModal = createRetryableLazy(() =>
  import('./features/geometry-editor/DynamicGeometryModal').then((m) => ({
    default: m.DynamicGeometryModal,
  }))
);
const FunctionGraphModal = createRetryableLazy(() =>
  import('./features/geometry-editor/FunctionGraphModal').then((m) => ({
    default: m.FunctionGraphModal,
  }))
);
const Solid3DModal = createRetryableLazy(() =>
  import('./features/geometry-editor/Solid3DModal').then((m) => ({
    default: m.Solid3DModal,
  }))
);
const PageToolsModal = createRetryableLazy(() =>
  import('./features/page-organizer/PageToolsModal').then((m) => ({
    default: m.PageToolsModal,
  }))
);
const OcrModal = createRetryableLazy(() =>
  import('./features/ocr/OcrModal').then((m) => ({
    default: m.OcrModal,
  }))
);
const SignatureModal = createRetryableLazy(() =>
  import('./features/annotations/SignatureModal').then((m) => ({
    default: m.SignatureModal,
  }))
);
const FindReplaceModal = createRetryableLazy(() =>
  import('./features/pdf-editor/FindReplaceModal').then((m) => ({
    default: m.FindReplaceModal,
  }))
);
const ExportPrintModal = createRetryableLazy(() =>
  import('./features/export/ExportPrintModal').then((m) => ({
    default: m.ExportPrintModal,
  }))
);
const SettingsModal = createRetryableLazy(() =>
  import('./features/settings/SettingsModal').then((m) => ({
    default: m.SettingsModal,
  }))
);

export default function App() {
  const documents = useStudioStore((s) => s.documents);
  const activeDocId = useStudioStore((s) => s.activeDocId);
  const setActiveDoc = useStudioStore((s) => s.setActiveDoc);
  const rightSidebarOpen = useStudioStore((s) => s.rightSidebarOpen);
  const rightPanelMode = useStudioStore((s) => s.rightPanelMode);
  const isFullscreen = useStudioStore((s) => s.isFullscreen);
  const activeModal = useStudioStore((s) => s.activeModal);
  const setActiveModal = useStudioStore((s) => s.setActiveModal);
  const guideView = useStudioStore((s) => s.guideView);
  const openGuide = useStudioStore((s) => s.openGuide);
  const closeGuide = useStudioStore((s) => s.closeGuide);
  const interactiveView = useStudioStore((s) => s.interactiveView);
  const closeInteractive = useStudioStore((s) => s.closeInteractive);
  const toasts = useStudioStore((s) => s.toasts);
  const dismissToast = useStudioStore((s) => s.dismissToast);
  const busyMessage = useStudioStore((s) => s.busyMessage);
  const initLocalLibraries = useStudioStore((s) => s.initLocalLibraries);

  const pwa = usePWAInstall();
  const quickOpenInputRef = useRef<HTMLInputElement>(null);
  const fitHandlersRef = useRef<{ fitWidth: () => void; fitPage: () => void }>({
    fitWidth: () => {},
    fitPage: () => {},
  });

  useEffect(() => {
    initLocalLibraries();
  }, [initLocalLibraries]);

  // Redirect any legacy activeModal === 'help' trigger to the dedicated UserGuidePage
  useEffect(() => {
    if (activeModal === 'help') {
      openGuide('open-save-print', 'mo-va-tao-pdf');
    }
  }, [activeModal, openGuide]);

  const triggerOpenFile = useCallback(() => {
    quickOpenInputRef.current?.click();
  }, []);

  const returnHome = useCallback(() => {
    closeGuide();
    closeInteractive();
    setActiveModal(null);
    setActiveDoc(null);
  }, [closeGuide, closeInteractive, setActiveModal, setActiveDoc]);

  useKeyboardShortcuts(triggerOpenFile);

  const registerViewportFit = useCallback(
    (handlers: { fitWidth: () => void; fitPage: () => void }) => {
      fitHandlersRef.current = handlers;
    },
    []
  );

  const activeDoc = documents.find((d) => d.id === activeDocId) || null;
  const showStandaloneDiagramSidebar =
    !activeDoc && rightSidebarOpen && rightPanelMode === 'diagrams';

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-[#F4F8F7] text-[#1F2937]">
      {/* Top Application Chrome (hidden during Presentation Fullscreen) */}
      {!isFullscreen && (
        <>
          <HeaderBar pwa={pwa} />
          <PwaInstallManager pwa={pwa} variant="inline-guide-panel" />
          {!guideView.open && !interactiveView.open && (
            <>
              <DocumentTabs />
              <RibbonToolbar />
            </>
          )}
        </>
      )}

      {/* Dedicated Full-Page Teacher User Guide (mounted on demand, never destroys active PDF edits) */}
      {guideView.open && !isFullscreen && (
        <FeatureErrorBoundary featureName="Trang Hướng dẫn sử dụng" onGoHome={returnHome}>
          {(retryNonce) => (
            <Suspense
              fallback={
                <div className="flex-1 flex items-center justify-center bg-[#F4F8F7]">
                  <div className="bg-white rounded-xl px-5 py-3.5 shadow-md flex items-center gap-2.5 text-[15.5px] font-semibold text-[#164E63]">
                    <Loader2 className="w-5 h-5 animate-spin text-[#087F70]" />
                    <span>Đang mở Hướng dẫn sử dụng...</span>
                  </div>
                </div>
              }
            >
              <UserGuidePage retryNonce={retryNonce} />
            </Suspense>
          )}
        </FeatureErrorBoundary>
      )}

      {/* Integrated Interactive PDF Worksheet Subsystem (mounted on demand, preserves main PDF edits) */}
      {interactiveView.open && !isFullscreen && (
        <FeatureErrorBoundary featureName="Bài tập PDF tương tác" onGoHome={returnHome}>
          {(retryNonce) => (
            <Suspense
              fallback={
                <div className="flex-1 flex items-center justify-center bg-[#F4F8F7]">
                  <div className="bg-white rounded-xl px-5 py-3.5 shadow-md flex items-center gap-2.5 text-[15.5px] font-semibold text-[#164E63]">
                    <Loader2 className="w-5 h-5 animate-spin text-[#087F70]" />
                    <span>Đang mở phân hệ Bài tập PDF tương tác...</span>
                  </div>
                </div>
              }
            >
              <InteractiveWorksheetHub retryNonce={retryNonce} />
            </Suspense>
          )}
        </FeatureErrorBoundary>
      )}

      {/* Main Workspace Area — kept mounted via CSS hide when Guide/Interactive is open so zero unsaved work or scroll state is lost */}
      <div
        data-tour="workspace-main"
        className={`flex-1 flex min-h-0 min-w-0 overflow-hidden ${
          (guideView.open || interactiveView.open) && !isFullscreen ? 'hidden' : ''
        }`}
      >
        {activeDoc ? (
          <>
            <FeatureErrorBoundary
              featureName="Trình xem & biên tập PDF"
              errorMessage="Không thể mở tài liệu. Vui lòng thử lại."
              onGoHome={returnHome}
            >
              {(retryNonce) => (
                <Suspense
                  fallback={
                    <div className="flex-1 flex items-center justify-center bg-[#E8EFEF]">
                      <div className="bg-white rounded-xl px-5 py-3.5 shadow-md flex items-center gap-2.5 text-[15px] font-semibold text-[#164E63]">
                        <Loader2 className="w-5 h-5 animate-spin text-[#087F70]" />
                        <span>Đang tải không gian làm việc PDF...</span>
                      </div>
                    </div>
                  }
                >
                  <PdfWorkspace
                    doc={activeDoc}
                    onRegisterViewportFit={registerViewportFit}
                    retryNonce={retryNonce}
                  />
                </Suspense>
              )}
            </FeatureErrorBoundary>

            {rightSidebarOpen && !isFullscreen && (
              <FeatureErrorBoundary
                featureName="Bảng công cụ bên phải"
                compact
                onGoHome={returnHome}
              >
                {(retryNonce) => (
                  <Suspense fallback={null}>
                    <RightSidebarShell doc={activeDoc} retryNonce={retryNonce} />
                  </Suspense>
                )}
              </FeatureErrorBoundary>
            )}
          </>
        ) : (
          <>
            <FeatureErrorBoundary featureName="Trang chủ" onGoHome={returnHome}>
              <WelcomeScreen />
            </FeatureErrorBoundary>

            {/* Allow previewing 126-diagram library independently even without an open PDF */}
            {showStandaloneDiagramSidebar && !isFullscreen && (
              <FeatureErrorBoundary
                featureName="Thư viện hình vẽ khoa học"
                errorMessage="Không thể tải thư viện hình vẽ."
                compact
                onGoHome={returnHome}
              >
                {(retryNonce) => (
                  <Suspense fallback={null}>
                    <RightSidebarShell doc={null} retryNonce={retryNonce} />
                  </Suspense>
                )}
              </FeatureErrorBoundary>
            )}
          </>
        )}
      </div>

      {/* Bottom Status Bar */}
      {!isFullscreen && !guideView.open && !interactiveView.open && (
        <StatusBar
          onFitWidth={() => fitHandlersRef.current.fitWidth()}
          onFitPage={() => fitHandlersRef.current.fitPage()}
        />
      )}

      {/* Lazy Modals with Isolated Retryable Error Boundaries */}
      {activeModal && activeModal !== 'help' && (
        <FeatureErrorBoundary
          featureName="Công cụ mở rộng"
          onGoHome={() => {
            setActiveModal(null);
            setActiveDoc(null);
          }}
        >
          <Suspense
            fallback={
              <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center">
                <div className="bg-white rounded-xl px-5 py-4 shadow-xl flex items-center gap-3 text-[15px] font-semibold text-[#164E63]">
                  <Loader2 className="w-5 h-5 animate-spin text-[#087F70]" />
                  <span>Đang tải công cụ...</span>
                </div>
              </div>
            }
          >
            {activeModal === 'dynamic-2d' && (
              <FeatureErrorBoundary featureName="Hình học động 2D" onGoHome={returnHome}>
                {(retryNonce) => (
                  <DynamicGeometryModal
                    onClose={() => setActiveModal(null)}
                    retryNonce={retryNonce}
                  />
                )}
              </FeatureErrorBoundary>
            )}
            {activeModal === 'function-graph' && (
              <FeatureErrorBoundary featureName="Đồ thị hàm số" onGoHome={returnHome}>
                {(retryNonce) => (
                  <FunctionGraphModal
                    onClose={() => setActiveModal(null)}
                    retryNonce={retryNonce}
                  />
                )}
              </FeatureErrorBoundary>
            )}
            {activeModal === 'solid-3d' && (
              <FeatureErrorBoundary featureName="Hình học không gian 3D" onGoHome={returnHome}>
                {(retryNonce) => (
                  <Solid3DModal
                    onClose={() => setActiveModal(null)}
                    retryNonce={retryNonce}
                  />
                )}
              </FeatureErrorBoundary>
            )}
            {activeModal === 'page-tools' && (
              <FeatureErrorBoundary featureName="Quản lý trang PDF" onGoHome={returnHome}>
                {(retryNonce) => (
                  <PageToolsModal
                    onClose={() => setActiveModal(null)}
                    retryNonce={retryNonce}
                  />
                )}
              </FeatureErrorBoundary>
            )}
            {activeModal === 'ocr' && (
              <FeatureErrorBoundary featureName="Nhận dạng văn bản OCR" onGoHome={returnHome}>
                {(retryNonce) => (
                  <OcrModal onClose={() => setActiveModal(null)} retryNonce={retryNonce} />
                )}
              </FeatureErrorBoundary>
            )}
            {activeModal === 'signature' && (
              <FeatureErrorBoundary featureName="Chữ ký & Chú thích" onGoHome={returnHome}>
                {(retryNonce) => (
                  <SignatureModal
                    onClose={() => setActiveModal(null)}
                    retryNonce={retryNonce}
                  />
                )}
              </FeatureErrorBoundary>
            )}
            {activeModal === 'find-replace' && (
              <FeatureErrorBoundary featureName="Tìm kiếm & Thay thế" onGoHome={returnHome}>
                {(retryNonce) => (
                  <FindReplaceModal
                    onClose={() => setActiveModal(null)}
                    retryNonce={retryNonce}
                  />
                )}
              </FeatureErrorBoundary>
            )}
            {(activeModal === 'export' || activeModal === 'print') && (
              <FeatureErrorBoundary featureName="Xuất & In tài liệu" onGoHome={returnHome}>
                {(retryNonce) => (
                  <ExportPrintModal
                    initialMode={activeModal === 'print' ? 'print' : 'export'}
                    onClose={() => setActiveModal(null)}
                    retryNonce={retryNonce}
                  />
                )}
              </FeatureErrorBoundary>
            )}
            {activeModal === 'settings' && (
              <FeatureErrorBoundary featureName="Thiết lập hệ thống" onGoHome={returnHome}>
                {(retryNonce) => (
                  <SettingsModal
                    pwa={pwa}
                    onClose={() => setActiveModal(null)}
                    retryNonce={retryNonce}
                  />
                )}
              </FeatureErrorBoundary>
            )}
          </Suspense>
        </FeatureErrorBoundary>
      )}

      {/* Busy Processing Overlay */}
      {busyMessage && (
        <div className="no-print fixed inset-0 z-60 bg-slate-900/45 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl px-6 py-4 flex items-center gap-3 border border-slate-200 max-w-md">
            <Loader2 className="w-6 h-6 text-[#087F70] animate-spin shrink-0" />
            <span className="text-[15.5px] font-semibold text-[#164E63]">{busyMessage}</span>
          </div>
        </div>
      )}

      {/* Friendly PDF Error Dialog */}
      <PdfErrorDialog onOpenOtherDocument={triggerOpenFile} />

      {/* Toast Notifications */}
      <div className="no-print fixed bottom-12 right-4 z-55 flex flex-col gap-2 max-w-sm pointer-events-none">
        {toasts.map((t) => {
          const style =
            t.tone === 'success'
              ? 'bg-[#087F70] text-white'
              : t.tone === 'error'
                ? 'bg-[#DC2626] text-white'
                : t.tone === 'warning'
                  ? 'bg-amber-600 text-white'
                  : 'bg-[#164E63] text-white';
          return (
            <div
              key={t.id}
              className={`pointer-events-auto rounded-xl shadow-lg px-4 py-2.5 text-[14.5px] font-medium flex items-center justify-between gap-3 ${style}`}
            >
              <span>{t.message}</span>
              <button
                type="button"
                onClick={() => dismissToast(t.id)}
                className="p-0.5 rounded hover:bg-white/20 shrink-0 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Global Ctrl+O File Picker */}
      <input
        ref={quickOpenInputRef}
        type="file"
        multiple
        accept=".pdf,.pdfedu,application/pdf"
        className="hidden"
        onChange={(e) => {
          if (e.target.files) {
            openFilesInStudio(e.target.files);
            e.target.value = '';
          }
        }}
      />
    </div>
  );
}
