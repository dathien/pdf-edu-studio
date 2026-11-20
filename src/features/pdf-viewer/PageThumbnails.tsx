import React, { useEffect, useRef } from 'react';
import { Copy, RotateCw, Trash2, Settings2 } from 'lucide-react';
import type { PDFDocumentProxy } from '../../engines/pdf/pdfjsConfig';
import { useStudioStore } from '../../stores/useStudioStore';
import type { PageTransform, StudioDocument } from '../../types/studio';

interface ThumbCanvasProps {
  pdfProxy: PDFDocumentProxy | null;
  pageMeta: PageTransform;
}

const ThumbCanvas: React.FC<ThumbCanvasProps> = ({ pdfProxy, pageMeta }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;
    let renderTask: { cancel: () => void; promise: Promise<void> } | null = null;

    const draw = async () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      if (pageMeta.sourcePageIndex < 0 || !pdfProxy) {
        canvas.width = 120;
        canvas.height = Math.round((120 * pageMeta.height) / Math.max(1, pageMeta.width));
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#E2E8F0';
        ctx.strokeRect(0.5, 0.5, canvas.width - 1, canvas.height - 1);
        return;
      }

      try {
        const page = await pdfProxy.getPage(pageMeta.sourcePageIndex + 1);
        if (cancelled) return;
        const baseVp = page.getViewport({ scale: 1, rotation: pageMeta.rotation });
        const scale = 132 / Math.max(1, baseVp.width);
        const vp = page.getViewport({ scale, rotation: pageMeta.rotation });
        canvas.width = Math.round(vp.width);
        canvas.height = Math.round(vp.height);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        renderTask = page.render({ canvasContext: ctx, viewport: vp, canvas });
        await renderTask.promise;
      } catch {
        // Render cancelled or page changed
      }
    };

    draw();
    return () => {
      cancelled = true;
      renderTask?.cancel();
    };
  }, [pdfProxy, pageMeta.sourcePageIndex, pageMeta.rotation, pageMeta.width, pageMeta.height]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-auto block bg-white rounded border border-slate-200 shadow-2xs"
    />
  );
};

interface PageThumbnailsProps {
  doc: StudioDocument;
  pdfProxy: PDFDocumentProxy | null;
  onJumpToPage: (idx: number) => void;
}

export const PageThumbnails: React.FC<PageThumbnailsProps> = ({
  doc,
  pdfProxy,
  onJumpToPage,
}) => {
  const leftSidebarWidth = useStudioStore((s) => s.leftSidebarWidth);
  const updatePages = useStudioStore((s) => s.updatePages);
  const setActiveModal = useStudioStore((s) => s.setActiveModal);
  const notify = useStudioStore((s) => s.notify);

  const rotatePage = (idx: number) => {
    const next = doc.pages.map((p, i) =>
      i === idx ? { ...p, rotation: (((p.rotation + 90) % 360) as 0 | 90 | 180 | 270) } : p
    );
    updatePages(next);
  };

  const duplicatePage = (idx: number) => {
    const src = doc.pages[idx];
    const copy: PageTransform = {
      ...structuredClone(src),
      id: `p-copy-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    };
    const next = [...doc.pages.slice(0, idx + 1), copy, ...doc.pages.slice(idx + 1)];
    updatePages(next);
    notify(`Đã nhân bản trang ${idx + 1}`, 'success');
  };

  const deletePage = (idx: number) => {
    if (doc.pages.length <= 1) {
      notify('Tài liệu phải còn ít nhất 1 trang.', 'warning');
      return;
    }
    const next = doc.pages.filter((_, i) => i !== idx);
    updatePages(next);
    notify(`Đã xóa trang ${idx + 1}`, 'info');
  };

  return (
    <aside
      style={{ width: leftSidebarWidth }}
      className="no-print bg-white border-r border-slate-200 flex flex-col shrink-0 select-none overflow-hidden"
    >
      <div className="px-3 py-2.5 border-b border-slate-200 flex items-center justify-between">
        <span className="text-[14.5px] font-bold text-[#164E63]">
          Trang ({doc.pages.length})
        </span>
        <button
          type="button"
          onClick={() => setActiveModal('page-tools')}
          className="flex items-center gap-1 px-2 py-1 rounded-md text-[13px] font-medium text-[#087F70] hover:bg-[#E6F1EF] cursor-pointer"
          title="Mở công cụ quản lý, ghép, tách, cắt lề trang"
        >
          <Settings2 className="w-3.5 h-3.5" />
          <span>Quản lý</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {doc.pages.map((page, idx) => {
          const isCurrent = idx === doc.currentPageIndex;
          return (
            <div
              key={page.id}
              onClick={() => onJumpToPage(idx)}
              className={`group rounded-lg p-2 border-2 transition-colors cursor-pointer ${
                isCurrent
                  ? 'border-[#087F70] bg-[#E6F1EF]/60'
                  : 'border-transparent hover:border-slate-300 bg-slate-50/70'
              }`}
            >
              <ThumbCanvas pdfProxy={pdfProxy} pageMeta={page} />
              <div className="mt-1.5 flex items-center justify-between">
                <span className="text-[13.5px] font-semibold text-slate-700 tabular-nums">
                  Trang {idx + 1}
                </span>
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      rotatePage(idx);
                    }}
                    className="p-1 rounded hover:bg-white text-slate-600 cursor-pointer"
                    title="Xoay 90°"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      duplicatePage(idx);
                    }}
                    className="p-1 rounded hover:bg-white text-slate-600 cursor-pointer"
                    title="Nhân bản trang"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      deletePage(idx);
                    }}
                    className="p-1 rounded hover:bg-red-50 text-slate-500 hover:text-[#DC2626] cursor-pointer"
                    title="Xóa trang"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
};
