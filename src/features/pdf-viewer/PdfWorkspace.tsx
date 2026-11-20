import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Minimize2 } from 'lucide-react';
import type { PDFDocumentProxy } from '../../engines/pdf/pdfjsConfig';
import { openPdfDocument, type LoadedPdfHandle } from '../../engines/pdf/pdfLoader';
import { useStudioStore } from '../../stores/useStudioStore';
import { insertImageFileToActiveDoc, openFilesInStudio } from '../../services/documentActions';
import type { StudioDocument } from '../../types/studio';
import { PageThumbnails } from './PageThumbnails';
import { PageCanvas } from './PageCanvas';

interface PdfWorkspaceProps {
  doc: StudioDocument;
  onRegisterViewportFit: (handlers: { fitWidth: () => void; fitPage: () => void }) => void;
}

export const PdfWorkspace: React.FC<PdfWorkspaceProps> = ({ doc, onRegisterViewportFit }) => {
  const leftSidebarOpen = useStudioStore((s) => s.leftSidebarOpen);
  const activeTool = useStudioStore((s) => s.activeTool);
  const isFullscreen = useStudioStore((s) => s.isFullscreen);
  const setIsFullscreen = useStudioStore((s) => s.setIsFullscreen);
  const setCurrentPageIndex = useStudioStore((s) => s.setCurrentPageIndex);
  const setDocZoom = useStudioStore((s) => s.setDocZoom);
  const setPdfError = useStudioStore((s) => s.setPdfError);

  const [pdfProxy, setPdfProxy] = useState<PDFDocumentProxy | null>(null);
  const [reloadTick, setReloadTick] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Load PDF.js proxy via shared PDF Loader whenever currentPdfBytes changes
  useEffect(() => {
    let cancelled = false;
    let activeHandle: LoadedPdfHandle | null = null;
    setPdfProxy(null);

    openPdfDocument(doc.currentPdfBytes)
      .then((handle) => {
        if (cancelled) {
          handle.destroy();
          return;
        }
        activeHandle = handle;
        setPdfProxy(handle.proxy);
      })
      .catch((err) => {
        if (cancelled) return;
        const detail = err instanceof Error ? err.message : String(err);
        setPdfError({
          title: 'Không thể hiển thị tài liệu PDF',
          message: 'Không thể mở tài liệu PDF. Vui lòng thử lại.',
          detail,
          onRetry: () => setReloadTick((n) => n + 1),
        });
      });

    return () => {
      cancelled = true;
      if (activeHandle) {
        activeHandle.destroy();
      }
    };
  }, [doc.id, doc.currentPdfBytes, reloadTick, setPdfError]);

  // Register fit-width and fit-page helpers for StatusBar
  useEffect(() => {
    const fitWidth = () => {
      const container = scrollContainerRef.current;
      const p = doc.pages[doc.currentPageIndex] || doc.pages[0];
      if (!container || !p) return;
      const avail = container.clientWidth - 64;
      const targetW = doc.viewMode === 'two-page' ? p.width * 2 + 28 : p.width;
      setDocZoom(Math.max(0.35, Math.min(3, avail / Math.max(1, targetW))));
    };
    const fitPage = () => {
      const container = scrollContainerRef.current;
      const p = doc.pages[doc.currentPageIndex] || doc.pages[0];
      if (!container || !p) return;
      const availW = container.clientWidth - 64;
      const availH = container.clientHeight - 56;
      const scale = Math.min(availW / Math.max(1, p.width), availH / Math.max(1, p.height));
      setDocZoom(Math.max(0.35, Math.min(3, scale)));
    };
    onRegisterViewportFit({ fitWidth, fitPage });
  }, [doc.pages, doc.currentPageIndex, doc.viewMode, setDocZoom, onRegisterViewportFit]);

  // Support Ctrl+V pasting image directly onto PDF page
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            insertImageFileToActiveDoc(file);
            return;
          }
        }
      }
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, []);

  const handleJumpToPage = useCallback(
    (idx: number) => {
      setCurrentPageIndex(idx);
      const targetPage = doc.pages[idx];
      if (targetPage && doc.viewMode === 'continuous') {
        const el = pageRefs.current[targetPage.id];
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    },
    [doc.pages, doc.viewMode, setCurrentPageIndex]
  );

  // Hand tool drag-to-scroll
  const handleContainerPointerDown = (e: React.PointerEvent) => {
    if (activeTool !== 'hand') return;
    const container = scrollContainerRef.current;
    if (!container) return;
    const startX = e.clientX;
    const startY = e.clientY;
    const startScrollLeft = container.scrollLeft;
    const startScrollTop = container.scrollTop;

    const onMove = (ev: PointerEvent) => {
      container.scrollLeft = startScrollLeft - (ev.clientX - startX);
      container.scrollTop = startScrollTop - (ev.clientY - startY);
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      openFilesInStudio(e.dataTransfer.files);
    }
  };

  const pagesToRender = (() => {
    if (doc.viewMode === 'single') {
      const p = doc.pages[doc.currentPageIndex];
      return p ? [{ page: p, idx: doc.currentPageIndex }] : [];
    }
    if (doc.viewMode === 'two-page') {
      const start = doc.currentPageIndex - (doc.currentPageIndex % 2);
      const list = [];
      if (doc.pages[start]) list.push({ page: doc.pages[start], idx: start });
      if (doc.pages[start + 1]) list.push({ page: doc.pages[start + 1], idx: start + 1 });
      return list;
    }
    return doc.pages.map((page, idx) => ({ page, idx }));
  })();

  return (
    <div className="flex-1 flex min-w-0 min-h-0 overflow-hidden relative">
      {/* Left Thumbnail Sidebar (hidden in presentation fullscreen) */}
      {leftSidebarOpen && !isFullscreen && (
        <PageThumbnails doc={doc} pdfProxy={pdfProxy} onJumpToPage={handleJumpToPage} />
      )}

      {/* Main Scrollable Document Stage */}
      <div
        ref={scrollContainerRef}
        onPointerDown={handleContainerPointerDown}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className={`flex-1 overflow-auto bg-[#E8EFEF] p-6 relative ${
          activeTool === 'hand' ? 'cursor-grab active:cursor-grabbing' : ''
        }`}
      >
        {isFullscreen && (
          <button
            type="button"
            onClick={() => setIsFullscreen(false)}
            className="no-print fixed top-4 right-4 z-50 flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#164E63] hover:bg-[#087F70] text-white font-semibold text-[14px] shadow-lg cursor-pointer"
          >
            <Minimize2 className="w-4 h-4" />
            <span>Thoát trình chiếu (Esc)</span>
          </button>
        )}

        <div
          className={
            doc.viewMode === 'two-page'
              ? 'flex flex-wrap items-start justify-center gap-6 mx-auto'
              : 'flex flex-col items-center gap-6 mx-auto'
          }
        >
          {pagesToRender.map(({ page, idx }) => (
            <div
              key={page.id}
              ref={(el) => {
                pageRefs.current[page.id] = el;
              }}
            >
              <PageCanvas
                doc={doc}
                pageMeta={page}
                pageIndex={idx}
                pdfProxy={pdfProxy}
                onBecomeVisible={doc.viewMode === 'continuous' ? setCurrentPageIndex : undefined}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
