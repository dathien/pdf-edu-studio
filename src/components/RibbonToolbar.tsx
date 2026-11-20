import React, { useEffect, useRef, useState } from 'react';
import {
  AlignCenter,
  ArrowRight,
  Award,
  Box,
  Calculator,
  CheckSquare,
  ChevronDown,
  Circle,
  Columns2,
  Compass,
  Copy,
  Crop,
  Droplets,
  Edit3,
  Eraser,
  EyeOff,
  FileArchive,
  FileDown,
  FileImage,
  FilePlus2,
  FileSearch,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  Hand,
  Hash,
  HelpCircle,
  Highlighter,
  ImagePlus,
  Layers,
  LayoutGrid,
  LineChart,
  Maximize2,
  Merge,
  MessageSquarePlus,
  Minus,
  MousePointer2,
  PanelLeft,
  PanelRight,
  PenTool,
  Printer,
  Redo2,
  Save,
  ScanText,
  Scissors,
  Search,
  ShieldAlert,
  Sigma,
  Square,
  Stamp,
  StickyNote,
  Strikethrough,
  Table,
  Type,
  Underline,
  Undo2,
} from 'lucide-react';
import { useStudioStore } from '../stores/useStudioStore';
import type { ActiveTool, RibbonTabId } from '../types/studio';
import {
  createNewBlankDocument,
  insertImageFileToActiveDoc,
  openFilesInStudio,
  quickSavePdf,
  quickSaveProjectBundle,
} from '../services/documentActions';
import { exportGradebookToExcel } from '../engines/grading/gradingEngine';
import type { GuideGroupId } from '../features/help/guideData';

const RIBBON_TABS: Array<{
  id: RibbonTabId;
  label: string;
  guideGroupId: GuideGroupId;
  guideFeatureId: string;
}> = [
  { id: 'file', label: 'Tệp', guideGroupId: 'open-save-print', guideFeatureId: 'mo-va-tao-pdf' },
  { id: 'edit', label: 'Chỉnh sửa', guideGroupId: 'edit-content', guideFeatureId: 'sua-chu-truc-tiep' },
  { id: 'formula', label: 'Công thức', guideGroupId: 'formulas', guideFeatureId: 'chen-sua-cong-thuc' },
  { id: 'draw', label: 'Hình vẽ', guideGroupId: 'diagrams-graphs', guideFeatureId: 'thu-vien-hinh' },
  { id: 'annotate', label: 'Chú thích', guideGroupId: 'annotate-sign', guideFeatureId: 'but-highlight-gach-chan' },
  { id: 'grade', label: 'Chấm bài', guideGroupId: 'grading', guideFeatureId: 'cham-tu-luan' },
  { id: 'pages', label: 'Trang PDF', guideGroupId: 'page-tools', guideFeatureId: 'sap-xep-xoay-trang' },
  { id: 'security', label: 'Bảo mật', guideGroupId: 'security-offline', guideFeatureId: 'xoa-vinh-vien' },
  { id: 'view', label: 'Hiển thị', guideGroupId: 'open-save-print', guideFeatureId: 'xuat-anh-in-trinh-chieu' },
];

interface RibbonBtnProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  disabled?: boolean;
  danger?: boolean;
  onClick: () => void;
  title?: string;
}

const RibbonBtn: React.FC<RibbonBtnProps> = ({
  icon,
  label,
  active,
  disabled,
  danger,
  onClick,
  title,
}) => (
  <button
    type="button"
    disabled={disabled}
    onClick={onClick}
    title={title || label}
    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[15px] font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
      active
        ? 'bg-[#087F70] text-white shadow-xs'
        : danger
          ? 'text-[#DC2626] hover:bg-red-50'
          : 'text-slate-800 hover:bg-[#E6F1EF] hover:text-[#164E63]'
    }`}
  >
    <span className="shrink-0 flex items-center">{icon}</span>
    <span>{label}</span>
  </button>
);

const RibbonDivider: React.FC = () => (
  <div className="w-px h-7 bg-slate-200 mx-1 shrink-0" />
);

interface OverflowItem {
  label: string;
  icon: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}

const MoreToolsMenu: React.FC<{
  items: OverflowItem[];
  label?: string;
}> = ({ items, label = 'Thêm công cụ' }) => {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const anyActive = items.some((i) => i.active);

  return (
    <div ref={menuRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[15px] font-semibold whitespace-nowrap border transition-colors cursor-pointer ${
          anyActive || open
            ? 'bg-[#E6F1EF] border-[#087F70] text-[#087F70]'
            : 'bg-white border-slate-200 text-slate-700 hover:bg-[#E6F1EF] hover:text-[#164E63]'
        }`}
      >
        <span>{label}</span>
        <ChevronDown className="w-4 h-4" />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1.5 z-40 min-w-[230px] rounded-xl bg-white border border-slate-200 shadow-xl py-1.5">
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              disabled={item.disabled}
              onClick={() => {
                item.onClick();
                setOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-left text-[15px] font-medium transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                item.active
                  ? 'bg-[#087F70] text-white'
                  : 'text-slate-800 hover:bg-[#E6F1EF] hover:text-[#164E63]'
              }`}
            >
              <span className="shrink-0">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const RibbonToolbar: React.FC = () => {
  const ribbonTab = useStudioStore((s) => s.ribbonTab);
  const setRibbonTab = useStudioStore((s) => s.setRibbonTab);
  const activeTool = useStudioStore((s) => s.activeTool);
  const setActiveTool = useStudioStore((s) => s.setActiveTool);
  const setRightPanelMode = useStudioStore((s) => s.setRightPanelMode);
  const setActiveModal = useStudioStore((s) => s.setActiveModal);
  const openGuide = useStudioStore((s) => s.openGuide);
  const documents = useStudioStore((s) => s.documents);
  const activeDocId = useStudioStore((s) => s.activeDocId);
  const undo = useStudioStore((s) => s.undo);
  const redo = useStudioStore((s) => s.redo);
  const toggleLeftSidebar = useStudioStore((s) => s.toggleLeftSidebar);
  const toggleRightSidebar = useStudioStore((s) => s.toggleRightSidebar);
  const leftSidebarOpen = useStudioStore((s) => s.leftSidebarOpen);
  const rightSidebarOpen = useStudioStore((s) => s.rightSidebarOpen);
  const setDocViewMode = useStudioStore((s) => s.setDocViewMode);
  const setIsFullscreen = useStudioStore((s) => s.setIsFullscreen);
  const isFullscreen = useStudioStore((s) => s.isFullscreen);
  const gradedPapers = useStudioStore((s) => s.gradedPapers);
  const notify = useStudioStore((s) => s.notify);

  const openPdfRef = useRef<HTMLInputElement>(null);
  const insertImgRef = useRef<HTMLInputElement>(null);

  const activeDoc = documents.find((d) => d.id === activeDocId) || null;
  const canUndo = !!activeDoc && activeDoc.historyIndex > 0;
  const canRedo = !!activeDoc && activeDoc.historyIndex < activeDoc.history.length - 1;
  const currentTabMeta = RIBBON_TABS.find((t) => t.id === ribbonTab) || RIBBON_TABS[0];

  const pickTool = (tool: ActiveTool) => {
    setActiveTool(tool);
  };

  return (
    <div
      data-tour="ribbon-toolbar"
      className="no-print bg-white border-b border-slate-200 shrink-0 select-none"
    >
      {/* Row 1: Ribbon Tab Strip */}
      <div className="flex items-center px-3 pt-1 gap-1 border-b border-slate-100">
        <div className="flex items-center gap-0.5 flex-wrap">
          {RIBBON_TABS.map((t) => {
            const isCurrent = ribbonTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setRibbonTab(t.id)}
                className={`px-3 py-2 text-[15.5px] font-semibold whitespace-nowrap shrink-0 border-b-2 transition-colors cursor-pointer ${
                  isCurrent
                    ? 'border-[#087F70] text-[#087F70] bg-[#F4F8F7]/70 rounded-t-md'
                    : 'border-transparent text-slate-600 hover:text-[#164E63] hover:bg-slate-50 rounded-t-md'
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Always-accessible quick Undo / Redo / Save on right side of tab bar */}
        <div className="ml-auto flex items-center gap-1 pl-2 shrink-0">
          <button
            type="button"
            disabled={!canUndo}
            onClick={undo}
            title="Hoàn tác (Ctrl+Z)"
            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-700 disabled:opacity-35 cursor-pointer"
          >
            <Undo2 className="w-[22px] h-[22px]" />
          </button>
          <button
            type="button"
            disabled={!canRedo}
            onClick={redo}
            title="Làm lại (Ctrl+Shift+Z)"
            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-700 disabled:opacity-35 cursor-pointer"
          >
            <Redo2 className="w-[22px] h-[22px]" />
          </button>
          {activeDoc && (
            <button
              type="button"
              onClick={() => quickSavePdf(activeDoc, false)}
              title="Lưu nhanh ra tệp PDF mới (Ctrl+S)"
              className="flex items-center gap-1.5 ml-1 px-3 py-1.5 rounded-md bg-[#087F70] hover:bg-[#06695d] text-white text-[14.5px] font-semibold whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Save className="w-[18px] h-[18px]" />
              <span>Lưu PDF</span>
            </button>
          )}
        </div>
      </div>

      {/* Row 2: Active Tab Commands — Compact grouped layout with "Thêm công cụ" dropdown (zero horizontal scroll on laptops) */}
      <div className="min-h-[54px] px-3 py-1.5 flex items-center flex-wrap gap-1 bg-[#FAFCFB]">
        {ribbonTab === 'file' && (
          <>
            <RibbonBtn
              icon={<FolderOpen className="w-[22px] h-[22px] text-[#087F70]" />}
              label="Mở PDF / .pdfedu"
              onClick={() => openPdfRef.current?.click()}
            />
            <RibbonBtn
              icon={<FilePlus2 className="w-[22px] h-[22px] text-[#087F70]" />}
              label="Tạo PDF trống"
              onClick={() => createNewBlankDocument(1)}
            />
            <RibbonDivider />
            <RibbonBtn
              icon={<Save className="w-[22px] h-[22px] text-[#164E63]" />}
              label="Lưu PDF mới"
              disabled={!activeDoc}
              onClick={() => activeDoc && quickSavePdf(activeDoc, true)}
            />
            <RibbonBtn
              icon={<FileArchive className="w-[22px] h-[22px] text-[#164E63]" />}
              label="Lưu dự án (.pdfedu)"
              disabled={!activeDoc}
              onClick={() => activeDoc && quickSaveProjectBundle(activeDoc)}
            />
            <RibbonBtn
              icon={<FileDown className="w-[22px] h-[22px] text-[#087F70]" />}
              label="Xuất PDF / Ảnh"
              disabled={!activeDoc}
              onClick={() => setActiveModal('export')}
            />
            <RibbonBtn
              icon={<Printer className="w-[22px] h-[22px] text-slate-700" />}
              label="In tài liệu"
              disabled={!activeDoc}
              onClick={() => setActiveModal('print')}
            />
          </>
        )}

        {ribbonTab === 'edit' && (
          <>
            <RibbonBtn
              icon={<MousePointer2 className="w-[22px] h-[22px]" />}
              label="Chọn (Q)"
              active={activeTool === 'select'}
              onClick={() => pickTool('select')}
            />
            <RibbonBtn
              icon={<Hand className="w-[22px] h-[22px]" />}
              label="Kéo trang (W)"
              active={activeTool === 'hand'}
              onClick={() => pickTool('hand')}
            />
            <RibbonDivider />
            <RibbonBtn
              icon={<Edit3 className="w-[22px] h-[22px]" />}
              label="Sửa chữ gốc (E)"
              active={activeTool === 'edit-text'}
              disabled={!activeDoc}
              onClick={() => pickTool('edit-text')}
            />
            <RibbonBtn
              icon={<Type className="w-[22px] h-[22px]" />}
              label="Thêm văn bản (T)"
              active={activeTool === 'add-text'}
              disabled={!activeDoc}
              onClick={() => pickTool('add-text')}
            />
            <RibbonBtn
              icon={<ImagePlus className="w-[22px] h-[22px]" />}
              label="Chèn ảnh"
              disabled={!activeDoc}
              onClick={() => insertImgRef.current?.click()}
            />
            <RibbonDivider />
            <RibbonBtn
              icon={<Search className="w-[22px] h-[22px]" />}
              label="Tìm & Thay thế"
              disabled={!activeDoc}
              onClick={() => setActiveModal('find-replace')}
            />
            <MoreToolsMenu
              items={[
                {
                  label: 'OCR nhận dạng chữ tiếng Việt',
                  icon: <ScanText className="w-5 h-5 text-[#087F70]" />,
                  disabled: !activeDoc,
                  onClick: () => setActiveModal('ocr'),
                },
                {
                  label: 'Bảng thuộc tính đối tượng',
                  icon: <Layers className="w-5 h-5 text-[#164E63]" />,
                  onClick: () => setRightPanelMode('properties'),
                },
              ]}
            />
          </>
        )}

        {ribbonTab === 'formula' && (
          <>
            <RibbonBtn
              icon={<Sigma className="w-[22px] h-[22px]" />}
              label="Soạn công thức MathLive (M)"
              active={activeTool === 'formula'}
              disabled={!activeDoc}
              onClick={() => {
                pickTool('formula');
                setRightPanelMode('formula');
              }}
            />
            <RibbonBtn
              icon={<Calculator className="w-[22px] h-[22px] text-[#087F70]" />}
              label="Mở bảng ký hiệu 5 môn học"
              onClick={() => setRightPanelMode('formula')}
            />
            <RibbonDivider />
            <div className="hidden lg:block text-[14.5px] text-slate-600 px-2">
              Hỗ trợ Toán, Vật lí, Hóa học, Sinh học, Tin học & Typst — Xuất vector SVG sắc nét vào PDF
            </div>
          </>
        )}

        {ribbonTab === 'draw' && (
          <>
            <RibbonBtn
              icon={<LayoutGrid className="w-[22px] h-[22px] text-[#087F70]" />}
              label="Thư viện hình mẫu"
              onClick={() => setRightPanelMode('diagrams')}
            />
            <RibbonBtn
              icon={<Compass className="w-[22px] h-[22px] text-[#087F70]" />}
              label="Hình động 2D"
              disabled={!activeDoc}
              onClick={() => setActiveModal('dynamic-2d')}
            />
            <RibbonBtn
              icon={<LineChart className="w-[22px] h-[22px] text-[#087F70]" />}
              label="Đồ thị hàm số"
              disabled={!activeDoc}
              onClick={() => setActiveModal('function-graph')}
            />
            <RibbonBtn
              icon={<Box className="w-[22px] h-[22px] text-[#087F70]" />}
              label="Hình không gian 3D"
              disabled={!activeDoc}
              onClick={() => setActiveModal('solid-3d')}
            />
            <RibbonDivider />
            <RibbonBtn
              icon={<Square className="w-[20px] h-[20px]" />}
              label="Chữ nhật"
              active={activeTool === 'shape-rect'}
              disabled={!activeDoc}
              onClick={() => pickTool('shape-rect')}
            />
            <RibbonBtn
              icon={<ArrowRight className="w-[20px] h-[20px]" />}
              label="Mũi tên"
              active={activeTool === 'shape-arrow'}
              disabled={!activeDoc}
              onClick={() => pickTool('shape-arrow')}
            />
            <MoreToolsMenu
              label="Hình cơ bản khác"
              items={[
                {
                  label: 'Hình tròn / Elip',
                  icon: <Circle className="w-5 h-5" />,
                  active: activeTool === 'shape-circle',
                  disabled: !activeDoc,
                  onClick: () => pickTool('shape-circle'),
                },
                {
                  label: 'Đoạn thẳng',
                  icon: <Minus className="w-5 h-5" />,
                  active: activeTool === 'shape-line',
                  disabled: !activeDoc,
                  onClick: () => pickTool('shape-line'),
                },
                {
                  label: 'Hộp chú thích (Callout)',
                  icon: <MessageSquarePlus className="w-5 h-5" />,
                  active: activeTool === 'shape-callout',
                  disabled: !activeDoc,
                  onClick: () => pickTool('shape-callout'),
                },
                {
                  label: 'Chèn bảng dữ liệu',
                  icon: <Table className="w-5 h-5" />,
                  active: activeTool === 'shape-table',
                  disabled: !activeDoc,
                  onClick: () => pickTool('shape-table'),
                },
              ]}
            />
          </>
        )}

        {ribbonTab === 'annotate' && (
          <>
            <RibbonBtn
              icon={<PenTool className="w-[22px] h-[22px]" />}
              label="Bút vẽ tay (P)"
              active={activeTool === 'pen'}
              disabled={!activeDoc}
              onClick={() => pickTool('pen')}
            />
            <RibbonBtn
              icon={<Highlighter className="w-[22px] h-[22px] text-amber-500" />}
              label="Bút dạ quang"
              active={activeTool === 'highlighter'}
              disabled={!activeDoc}
              onClick={() => pickTool('highlighter')}
            />
            <RibbonBtn
              icon={<Eraser className="w-[22px] h-[22px]" />}
              label="Tẩy nét vẽ"
              active={activeTool === 'eraser'}
              disabled={!activeDoc}
              onClick={() => pickTool('eraser')}
            />
            <RibbonDivider />
            <RibbonBtn
              icon={<StickyNote className="w-[22px] h-[22px] text-amber-600" />}
              label="Ghi chú nổi"
              active={activeTool === 'note'}
              disabled={!activeDoc}
              onClick={() => pickTool('note')}
            />
            <RibbonBtn
              icon={<Edit3 className="w-[22px] h-[22px] text-[#164E63]" />}
              label="Chữ ký hình ảnh"
              disabled={!activeDoc}
              onClick={() => setActiveModal('signature')}
            />
            <MoreToolsMenu
              items={[
                {
                  label: 'Tô sáng vùng chữ (Highlight)',
                  icon: <Highlighter className="w-5 h-5 text-yellow-600" />,
                  active: activeTool === 'text-highlight',
                  disabled: !activeDoc,
                  onClick: () => pickTool('text-highlight'),
                },
                {
                  label: 'Gạch chân (Underline)',
                  icon: <Underline className="w-5 h-5" />,
                  active: activeTool === 'text-underline',
                  disabled: !activeDoc,
                  onClick: () => pickTool('text-underline'),
                },
                {
                  label: 'Gạch ngang (Strikethrough)',
                  icon: <Strikethrough className="w-5 h-5" />,
                  active: activeTool === 'text-strike',
                  disabled: !activeDoc,
                  onClick: () => pickTool('text-strike'),
                },
              ]}
            />
          </>
        )}

        {ribbonTab === 'grade' && (
          <>
            <RibbonBtn
              icon={<PenTool className="w-[22px] h-[22px] text-[#DC2626]" />}
              label="Bút chấm đỏ"
              active={activeTool === 'pen'}
              disabled={!activeDoc}
              onClick={() => {
                useStudioStore.getState().setPenConfig({ penColor: '#DC2626', penWidth: 2.5 });
                pickTool('pen');
              }}
            />
            <RibbonBtn
              icon={<Stamp className="w-[22px] h-[22px] text-[#DC2626]" />}
              label="Đóng dấu chấm"
              active={activeTool === 'grade-stamp'}
              disabled={!activeDoc}
              onClick={() => {
                pickTool('grade-stamp');
                setRightPanelMode('grading');
              }}
            />
            <RibbonBtn
              icon={<Award className="w-[22px] h-[22px] text-[#DC2626]" />}
              label="Gắn điểm câu"
              active={activeTool === 'grade-score'}
              disabled={!activeDoc}
              onClick={() => {
                pickTool('grade-score');
                setRightPanelMode('grading');
              }}
            />
            <RibbonBtn
              icon={<CheckSquare className="w-[22px] h-[22px] text-[#087F70]" />}
              label="Bảng chấm điểm (G)"
              onClick={() => setRightPanelMode('grading')}
            />
            <RibbonDivider />
            <RibbonBtn
              icon={<FileSpreadsheet className="w-[22px] h-[22px] text-emerald-700" />}
              label="Xuất Excel"
              onClick={() => {
                if (gradedPapers.length === 0) {
                  notify(
                    'Chưa có bài chấm nào trong bảng điểm. Hãy bấm "Lưu vào bảng điểm" ở khung Chấm bài.',
                    'info'
                  );
                  setRightPanelMode('grading');
                  return;
                }
                exportGradebookToExcel(gradedPapers);
                notify('Đã xuất bảng điểm Excel (.xlsx)', 'success');
              }}
            />
            <MoreToolsMenu
              items={[
                {
                  label: 'Chèn nhận xét nhanh lên trang',
                  icon: <MessageSquarePlus className="w-5 h-5 text-[#DC2626]" />,
                  active: activeTool === 'grade-comment',
                  disabled: !activeDoc,
                  onClick: () => {
                    pickTool('grade-comment');
                    setRightPanelMode('grading');
                  },
                },
                {
                  label: 'Đóng khung tổng điểm tự động',
                  icon: <Award className="w-5 h-5 text-[#DC2626]" />,
                  active: activeTool === 'grade-total',
                  disabled: !activeDoc,
                  onClick: () => {
                    pickTool('grade-total');
                    setRightPanelMode('grading');
                  },
                },
              ]}
            />
          </>
        )}

        {ribbonTab === 'pages' && (
          <>
            <RibbonBtn
              icon={<Copy className="w-[22px] h-[22px] text-[#087F70]" />}
              label="Sắp xếp & Xoay trang"
              disabled={!activeDoc}
              onClick={() => setActiveModal('page-tools')}
            />
            <RibbonBtn
              icon={<Merge className="w-[22px] h-[22px] text-[#087F70]" />}
              label="Ghép PDF"
              onClick={() => setActiveModal('page-tools')}
            />
            <RibbonBtn
              icon={<Scissors className="w-[22px] h-[22px] text-[#087F70]" />}
              label="Tách PDF"
              disabled={!activeDoc}
              onClick={() => setActiveModal('page-tools')}
            />
            <RibbonBtn
              icon={<FileImage className="w-[22px] h-[22px] text-[#087F70]" />}
              label="Ảnh → PDF"
              onClick={() => setActiveModal('page-tools')}
            />
            <MoreToolsMenu
              items={[
                {
                  label: 'Cắt lề trang (Crop)',
                  icon: <Crop className="w-5 h-5 text-[#087F70]" />,
                  disabled: !activeDoc,
                  onClick: () => setActiveModal('page-tools'),
                },
                {
                  label: 'Nén giảm dung lượng PDF',
                  icon: <FileArchive className="w-5 h-5 text-[#164E63]" />,
                  disabled: !activeDoc,
                  onClick: () => setActiveModal('page-tools'),
                },
              ]}
            />
          </>
        )}

        {ribbonTab === 'security' && (
          <>
            <RibbonBtn
              icon={<EyeOff className="w-[22px] h-[22px] text-[#DC2626]" />}
              label="Khoanh vùng xóa vĩnh viễn"
              active={activeTool === 'redact'}
              disabled={!activeDoc}
              danger
              onClick={() => {
                pickTool('redact');
                setRightPanelMode('security');
              }}
            />
            <RibbonBtn
              icon={<ShieldAlert className="w-[22px] h-[22px] text-[#164E63]" />}
              label="Xóa metadata & Bảo mật"
              onClick={() => setRightPanelMode('security')}
            />
            <RibbonDivider />
            <RibbonBtn
              icon={<Droplets className="w-[22px] h-[22px] text-[#087F70]" />}
              label="Dấu chìm (Watermark)"
              onClick={() => setRightPanelMode('security')}
            />
            <RibbonBtn
              icon={<Hash className="w-[22px] h-[22px] text-[#087F70]" />}
              label="Đánh số trang"
              onClick={() => setRightPanelMode('security')}
            />
          </>
        )}

        {ribbonTab === 'view' && (
          <>
            <RibbonBtn
              icon={<FileText className="w-[22px] h-[22px]" />}
              label="Cuộn liên tục"
              active={activeDoc?.viewMode === 'continuous'}
              disabled={!activeDoc}
              onClick={() => setDocViewMode('continuous')}
            />
            <RibbonBtn
              icon={<AlignCenter className="w-[22px] h-[22px]" />}
              label="Một trang"
              active={activeDoc?.viewMode === 'single'}
              disabled={!activeDoc}
              onClick={() => setDocViewMode('single')}
            />
            <RibbonBtn
              icon={<Columns2 className="w-[22px] h-[22px]" />}
              label="Hai trang"
              active={activeDoc?.viewMode === 'two-page'}
              disabled={!activeDoc}
              onClick={() => setDocViewMode('two-page')}
            />
            <RibbonDivider />
            <RibbonBtn
              icon={<Maximize2 className="w-[22px] h-[22px] text-[#087F70]" />}
              label={isFullscreen ? 'Thoát trình chiếu' : 'Trình chiếu'}
              active={isFullscreen}
              disabled={!activeDoc}
              onClick={() => setIsFullscreen(!isFullscreen)}
            />
            <MoreToolsMenu
              label="Bố cục & Tìm kiếm"
              items={[
                {
                  label: leftSidebarOpen ? 'Ẩn danh sách trang bên trái' : 'Hiện danh sách trang bên trái',
                  icon: <PanelLeft className="w-5 h-5" />,
                  active: leftSidebarOpen,
                  onClick: toggleLeftSidebar,
                },
                {
                  label: rightSidebarOpen ? 'Ẩn bảng chức năng bên phải' : 'Hiện bảng chức năng bên phải',
                  icon: <PanelRight className="w-5 h-5" />,
                  active: rightSidebarOpen,
                  onClick: toggleRightSidebar,
                },
                {
                  label: 'Tìm kiếm trong tài liệu (Ctrl+F)',
                  icon: <FileSearch className="w-5 h-5" />,
                  disabled: !activeDoc,
                  onClick: () => setActiveModal('find-replace'),
                },
              ]}
            />
          </>
        )}

        {/* Contextual Help Icon for the Active Ribbon Tab */}
        <button
          type="button"
          onClick={() => openGuide(currentTabMeta.guideGroupId, currentTabMeta.guideFeatureId)}
          title={`Hướng dẫn sử dụng nhóm "${currentTabMeta.label}"`}
          className="ml-auto inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[14.5px] font-semibold text-[#164E63] hover:bg-[#E6F1EF] transition-colors cursor-pointer shrink-0"
        >
          <HelpCircle className="w-[18px] h-[18px] text-[#087F70]" />
          <span className="hidden xl:inline">Cách dùng</span>
        </button>
      </div>

      {/* Hidden inputs for file actions */}
      <input
        ref={openPdfRef}
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
      <input
        ref={insertImgRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) {
            insertImageFileToActiveDoc(f);
            e.target.value = '';
          }
        }}
      />
    </div>
  );
};
