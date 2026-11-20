import React, { Suspense, useRef } from 'react';
import {
  CheckSquare,
  Compass,
  FilePlus2,
  GripVertical,
  HelpCircle,
  Loader2,
  ShieldAlert,
  Sigma,
  Sliders,
  X,
} from 'lucide-react';
import { useStudioStore, type RightPanelMode } from '../stores/useStudioStore';
import type { StudioDocument } from '../types/studio';
import { FeatureErrorBoundary } from './FeatureErrorBoundary';
import { createRetryableLazy } from '../utils/lazyWithRetry';
import { createNewBlankDocument } from '../services/documentActions';
import type { GuideGroupId } from '../features/help/guideData';

const PropertiesPanel = createRetryableLazy(() =>
  import('../features/pdf-editor/PropertiesPanel').then((m) => ({
    default: m.PropertiesPanel,
  }))
);
const FormulaPanel = createRetryableLazy(() =>
  import('../features/formula-editor/FormulaPanel').then((m) => ({
    default: m.FormulaPanel,
  }))
);
const DiagramLibraryPanel = createRetryableLazy(() =>
  import('../features/geometry-library/DiagramLibraryPanel').then((m) => ({
    default: m.DiagramLibraryPanel,
  }))
);
const GradingPanel = createRetryableLazy(() =>
  import('../features/grading/GradingPanel').then((m) => ({
    default: m.GradingPanel,
  }))
);
const SecurityPanel = createRetryableLazy(() =>
  import('../features/redaction/SecurityPanel').then((m) => ({
    default: m.SecurityPanel,
  }))
);

interface RightSidebarShellProps {
  doc?: StudioDocument | null;
}

const PANEL_TABS: Array<{
  id: RightPanelMode;
  label: string;
  guideGroupId: GuideGroupId;
  guideFeatureId: string;
  icon: React.ReactNode;
}> = [
  {
    id: 'properties',
    label: 'Thuộc tính',
    guideGroupId: 'edit-content',
    guideFeatureId: 'sua-chu-truc-tiep',
    icon: <Sliders className="w-[18px] h-[18px]" />,
  },
  {
    id: 'formula',
    label: 'Công thức',
    guideGroupId: 'formulas',
    guideFeatureId: 'chen-sua-cong-thuc',
    icon: <Sigma className="w-[18px] h-[18px]" />,
  },
  {
    id: 'diagrams',
    label: 'Hình vẽ',
    guideGroupId: 'diagrams-graphs',
    guideFeatureId: 'thu-vien-hinh',
    icon: <Compass className="w-[18px] h-[18px]" />,
  },
  {
    id: 'grading',
    label: 'Chấm bài',
    guideGroupId: 'grading',
    guideFeatureId: 'cham-tu-luan',
    icon: <CheckSquare className="w-[18px] h-[18px]" />,
  },
  {
    id: 'security',
    label: 'Bảo mật',
    guideGroupId: 'security-offline',
    guideFeatureId: 'xoa-vinh-vien',
    icon: <ShieldAlert className="w-[18px] h-[18px]" />,
  },
];

const PanelLoadingFallback: React.FC = () => (
  <div className="p-6 flex items-center justify-center gap-2 text-[14.5px] font-medium text-slate-600">
    <Loader2 className="w-4 h-4 animate-spin text-[#087F70]" />
    <span>Đang tải bảng công cụ...</span>
  </div>
);

const NoDocPanelPrompt: React.FC<{ panelTitle: string }> = ({ panelTitle }) => (
  <div className="p-5 text-center space-y-3 text-[15px] text-slate-700">
    <div className="font-bold text-[#164E63]">{panelTitle}</div>
    <p className="text-[14px] text-slate-600 leading-relaxed">
      Vui lòng mở một tệp PDF, chọn một tài liệu mẫu hoặc tạo trang A4 trống để sử dụng chức năng này.
    </p>
    <button
      type="button"
      onClick={() => createNewBlankDocument(1, 'Tài liệu mới')}
      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#087F70] hover:bg-[#06695d] text-white font-semibold text-[14px] cursor-pointer"
    >
      <FilePlus2 className="w-4 h-4" />
      <span>Tạo trang A4 trống</span>
    </button>
  </div>
);

export const RightSidebarShell: React.FC<RightSidebarShellProps> = ({ doc }) => {
  const rightPanelMode = useStudioStore((s) => s.rightPanelMode);
  const setRightPanelMode = useStudioStore((s) => s.setRightPanelMode);
  const rightSidebarWidth = useStudioStore((s) => s.rightSidebarWidth);
  const setRightSidebarWidth = useStudioStore((s) => s.setRightSidebarWidth);
  const toggleRightSidebar = useStudioStore((s) => s.toggleRightSidebar);
  const setActiveDoc = useStudioStore((s) => s.setActiveDoc);
  const openGuide = useStudioStore((s) => s.openGuide);

  const dragStateRef = useRef<{ startX: number; startW: number } | null>(null);

  const handleGoHome = () => setActiveDoc(null);

  const handleResizeStart = (e: React.PointerEvent) => {
    e.preventDefault();
    dragStateRef.current = { startX: e.clientX, startW: rightSidebarWidth };
    const onMove = (ev: PointerEvent) => {
      if (!dragStateRef.current) return;
      const delta = dragStateRef.current.startX - ev.clientX;
      setRightSidebarWidth(dragStateRef.current.startW + delta);
    };
    const onUp = () => {
      dragStateRef.current = null;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const activeTabMeta = PANEL_TABS.find((t) => t.id === rightPanelMode) || PANEL_TABS[0];

  return (
    <aside
      data-tour="right-sidebar"
      style={{ width: rightSidebarWidth }}
      className="no-print relative bg-white border-l border-slate-200 flex flex-col shrink-0 overflow-hidden"
    >
      {/* Left-edge drag resize handle */}
      <div
        onPointerDown={handleResizeStart}
        title="Kéo sang trái/phải để thay đổi độ rộng bảng chức năng"
        className="absolute left-0 top-0 bottom-0 w-2 -ml-1 z-20 cursor-col-resize group flex items-center justify-center hover:bg-[#087F70]/15 transition-colors"
      >
        <GripVertical className="w-3 h-3 text-slate-300 group-hover:text-[#087F70]" />
      </div>

      {/* Compact Icon + Label Panel Switcher + Contextual Help */}
      <div className="flex items-center border-b border-slate-200 bg-[#FAFCFB] px-1.5 pt-1.5 gap-0.5 shrink-0">
        {PANEL_TABS.map((t) => {
          const active = rightPanelMode === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setRightPanelMode(t.id)}
              title={t.label}
              className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 px-1 rounded-t-md text-[12px] font-semibold border-b-2 transition-colors cursor-pointer ${
                active
                  ? 'border-[#087F70] text-[#087F70] bg-white'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.icon}
              <span className="truncate max-w-full">{t.label}</span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => openGuide(activeTabMeta.guideGroupId, activeTabMeta.guideFeatureId)}
          title={`Hướng dẫn: ${activeTabMeta.label}`}
          className="p-1.5 mb-1 rounded hover:bg-[#E6F1EF] text-[#087F70] cursor-pointer shrink-0"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={toggleRightSidebar}
          title="Thu gọn bảng bên phải"
          className="p-1.5 mb-1 rounded hover:bg-slate-200/70 text-slate-500 cursor-pointer shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Scrollable Active Panel Body with Independent Retryable Error Boundaries */}
      <div className="flex-1 overflow-y-auto">
        <Suspense fallback={<PanelLoadingFallback />}>
          {rightPanelMode === 'properties' && (
            <FeatureErrorBoundary
              featureName="Trình chỉnh sửa PDF"
              compact
              onGoHome={handleGoHome}
            >
              {(retryNonce) =>
                doc ? (
                  <PropertiesPanel doc={doc} retryNonce={retryNonce} />
                ) : (
                  <NoDocPanelPrompt panelTitle="Thuộc tính đối tượng" />
                )
              }
            </FeatureErrorBoundary>
          )}
          {rightPanelMode === 'formula' && (
            <FeatureErrorBoundary
              featureName="Soạn thảo công thức MathLive"
              compact
              onGoHome={handleGoHome}
            >
              {(retryNonce) =>
                doc ? (
                  <FormulaPanel doc={doc} retryNonce={retryNonce} />
                ) : (
                  <NoDocPanelPrompt panelTitle="Soạn công thức MathLive" />
                )
              }
            </FeatureErrorBoundary>
          )}
          {rightPanelMode === 'diagrams' && (
            <FeatureErrorBoundary
              featureName="Thư viện hình vẽ khoa học"
              errorMessage="Không thể tải thư viện hình vẽ."
              compact
              onGoHome={handleGoHome}
            >
              {(retryNonce) => <DiagramLibraryPanel doc={doc} retryNonce={retryNonce} />}
            </FeatureErrorBoundary>
          )}
          {rightPanelMode === 'grading' && (
            <FeatureErrorBoundary
              featureName="Hệ thống chấm bài"
              compact
              onGoHome={handleGoHome}
            >
              {(retryNonce) =>
                doc ? (
                  <GradingPanel doc={doc} retryNonce={retryNonce} />
                ) : (
                  <NoDocPanelPrompt panelTitle="Chấm bài tự luận & trắc nghiệm" />
                )
              }
            </FeatureErrorBoundary>
          )}
          {rightPanelMode === 'security' && (
            <FeatureErrorBoundary
              featureName="Bảo mật & Xóa vĩnh viễn"
              compact
              onGoHome={handleGoHome}
            >
              {(retryNonce) =>
                doc ? (
                  <SecurityPanel doc={doc} retryNonce={retryNonce} />
                ) : (
                  <NoDocPanelPrompt panelTitle="Bảo mật & Xóa vĩnh viễn" />
                )
              }
            </FeatureErrorBoundary>
          )}
        </Suspense>
      </div>
    </aside>
  );
};
