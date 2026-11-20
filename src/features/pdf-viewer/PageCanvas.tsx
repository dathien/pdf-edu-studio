import React, { useEffect, useRef, useState } from 'react';
import type { PDFDocumentProxy } from '../../engines/pdf/pdfjsConfig';
import { ScanText } from 'lucide-react';
import type {
  ExtractedTextBlock,
  PageAnalysis,
  PageTransform,
  StudioDocument,
  StudioObject,
} from '../../types/studio';
import { extractPageTextBlocks } from '../../engines/pdf/pdfEngine';
import { useStudioStore } from '../../stores/useStudioStore';
import { ObjectLayerItem } from './ObjectLayerItem';

interface PageCanvasProps {
  doc: StudioDocument;
  pageMeta: PageTransform;
  pageIndex: number;
  pdfProxy: PDFDocumentProxy | null;
  onBecomeVisible?: (idx: number) => void;
}

export const PageCanvas: React.FC<PageCanvasProps> = ({
  doc,
  pageMeta,
  pageIndex,
  pdfProxy,
  onBecomeVisible,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isVisible, setIsVisible] = useState(pageIndex < 3);

  const activeTool = useStudioStore((s) => s.activeTool);
  const selectedObjectIds = useStudioStore((s) => s.selectedObjectIds);
  const selectObjects = useStudioStore((s) => s.selectObjects);
  const addObject = useStudioStore((s) => s.addObject);
  const deleteObjects = useStudioStore((s) => s.deleteObjects);
  const setActiveTool = useStudioStore((s) => s.setActiveTool);
  const setActiveModal = useStudioStore((s) => s.setActiveModal);
  const setRightPanelMode = useStudioStore((s) => s.setRightPanelMode);
  const penColor = useStudioStore((s) => s.penColor);
  const penWidth = useStudioStore((s) => s.penWidth);
  const penOpacity = useStudioStore((s) => s.penOpacity);
  const activeStampCode = useStudioStore((s) => s.activeStampCode);
  const activeStampLabel = useStudioStore((s) => s.activeStampLabel);
  const activeStampColor = useStudioStore((s) => s.activeStampColor);
  const activeQuestionIdForScore = useStudioStore((s) => s.activeQuestionIdForScore);
  const defaultTextColor = useStudioStore((s) => s.defaultTextColor);
  const defaultTextSize = useStudioStore((s) => s.defaultTextSize);
  const notify = useStudioStore((s) => s.notify);

  const [textBlocks, setTextBlocks] = useState<ExtractedTextBlock[]>([]);
  const [pageAnalysis, setPageAnalysis] = useState<PageAnalysis | null>(null);
  const [draftInkPoints, setDraftInkPoints] = useState<Array<{ x: number; y: number }>>([]);
  const [dragBox, setDragBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  const zoom = doc.zoom;
  const isRotated90 = pageMeta.rotation === 90 || pageMeta.rotation === 270;
  const baseWidth = isRotated90 ? pageMeta.height : pageMeta.width;
  const baseHeight = isRotated90 ? pageMeta.width : pageMeta.height;
  const viewWidth = baseWidth * zoom;
  const viewHeight = baseHeight * zoom;

  // Lazy visibility observer
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setIsVisible(true);
            if (entry.intersectionRatio > 0.35 && onBecomeVisible) {
              onBecomeVisible(pageIndex);
            }
          }
        }
      },
      { rootMargin: '240px 0px', threshold: [0.01, 0.4] }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [pageIndex, onBecomeVisible]);

  const activeRenderTaskRef = useRef<{ cancel: () => void; promise: Promise<void> } | null>(null);

  // Render PDF.js page onto crisp HiDPI canvas (strictly serialized per canvas)
  useEffect(() => {
    if (!isVisible) return;
    let cancelled = false;

    const renderPage = async () => {
      // Cancel and wait for any in-flight render task on this canvas before starting a new one
      if (activeRenderTaskRef.current) {
        const prevTask = activeRenderTaskRef.current;
        activeRenderTaskRef.current = null;
        try {
          prevTask.cancel();
          await prevTask.promise;
        } catch {
          // Expected RenderingCancelledException
        }
      }
      if (cancelled) return;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5);

      if (pageMeta.sourcePageIndex < 0 || !pdfProxy) {
        canvas.width = Math.round(viewWidth * dpr);
        canvas.height = Math.round(viewHeight * dpr);
        canvas.style.width = `${viewWidth}px`;
        canvas.style.height = `${viewHeight}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, viewWidth, viewHeight);
        return;
      }

      try {
        const page = await pdfProxy.getPage(pageMeta.sourcePageIndex + 1);
        if (cancelled || !canvasRef.current) return;
        const vp = page.getViewport({ scale: zoom * dpr, rotation: pageMeta.rotation });
        canvas.width = Math.round(vp.width);
        canvas.height = Math.round(vp.height);
        canvas.style.width = `${viewWidth}px`;
        canvas.style.height = `${viewHeight}px`;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const task = page.render({ canvasContext: ctx, viewport: vp, canvas });
        activeRenderTaskRef.current = task;
        await task.promise;
        if (activeRenderTaskRef.current === task) {
          activeRenderTaskRef.current = null;
        }
      } catch {
        // Ignore cancellation or destroyed proxy transition
      }
    };

    renderPage();
    return () => {
      cancelled = true;
      if (activeRenderTaskRef.current) {
        try {
          activeRenderTaskRef.current.cancel();
        } catch {
          // Ignore already completed task
        }
      }
    };
  }, [isVisible, pdfProxy, pageMeta.sourcePageIndex, pageMeta.rotation, zoom, viewWidth, viewHeight]);

  // Extract editable original PDF text blocks when in edit-text mode
  useEffect(() => {
    if (activeTool !== 'edit-text' || !isVisible || !pdfProxy || pageMeta.sourcePageIndex < 0) {
      return;
    }
    let cancelled = false;
    extractPageTextBlocks(pdfProxy, pageMeta.sourcePageIndex)
      .then((blocks) => {
        if (!cancelled) {
          setTextBlocks(blocks);
          setPageAnalysis(
            blocks.length === 0
              ? {
                  pageIndex: pageMeta.sourcePageIndex,
                  kind: 'scanned-image',
                  textCount: 0,
                  note: 'Trang không có lớp văn bản gốc.',
                }
              : {
                  pageIndex: pageMeta.sourcePageIndex,
                  kind: 'text-editable',
                  textCount: blocks.length,
                  note: 'Có thể sửa văn bản trực tiếp.',
                }
          );
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [activeTool, isVisible, pdfProxy, pageMeta.sourcePageIndex]);

  const toPdfPoint = (clientX: number, clientY: number) => {
    const rect = containerRef.current!.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(baseWidth, (clientX - rect.left) / zoom)),
      y: Math.max(0, Math.min(baseHeight, (clientY - rect.top) / zoom)),
    };
  };

  const handleStagePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    if (activeTool === 'hand') return;

    if (activeTool === 'select' || activeTool === 'edit-text' || activeTool === 'eraser') {
      selectObjects([]);
      return;
    }

    const pt = toPdfPoint(e.clientX, e.clientY);

    // Freehand pen / highlighter drawing
    if (activeTool === 'pen' || activeTool === 'highlighter') {
      const pts: Array<{ x: number; y: number }> = [pt];
      setDraftInkPoints(pts);

      const onMove = (ev: PointerEvent) => {
        const nextPt = toPdfPoint(ev.clientX, ev.clientY);
        const last = pts[pts.length - 1];
        if (Math.hypot(nextPt.x - last.x, nextPt.y - last.y) >= 1.8) {
          pts.push(nextPt);
          setDraftInkPoints([...pts]);
        }
      };
      const onUp = () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        setDraftInkPoints([]);
        if (pts.length < 2) return;
        const minX = Math.min(...pts.map((p) => p.x));
        const minY = Math.min(...pts.map((p) => p.y));
        const maxX = Math.max(...pts.map((p) => p.x));
        const maxY = Math.max(...pts.map((p) => p.y));
        addObject({
          id: `ink-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
          type: 'ink',
          pageId: pageMeta.id,
          x: Math.round(minX),
          y: Math.round(minY),
          width: Math.max(8, Math.round(maxX - minX)),
          height: Math.max(8, Math.round(maxY - minY)),
          rotation: 0,
          zIndex: 20,
          opacity: activeTool === 'highlighter' ? 0.38 : penOpacity,
          tool: activeTool,
          color: activeTool === 'highlighter' ? '#FACC15' : penColor,
          strokeWidth: activeTool === 'highlighter' ? Math.max(12, penWidth * 4) : penWidth,
          points: pts.map((p) => ({ x: +(p.x - minX).toFixed(1), y: +(p.y - minY).toFixed(1) })),
        });
      };
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      return;
    }

    // Drag-to-size tools (shapes, highlight/underline/strike, redaction)
    const isDragCreate =
      activeTool.startsWith('shape-') ||
      activeTool === 'text-highlight' ||
      activeTool === 'text-underline' ||
      activeTool === 'text-strike' ||
      activeTool === 'redact';

    if (isDragCreate) {
      const startPt = pt;
      let currentBox = { x: startPt.x, y: startPt.y, w: 0, h: 0 };
      setDragBox(currentBox);

      const onMove = (ev: PointerEvent) => {
        const cur = toPdfPoint(ev.clientX, ev.clientY);
        currentBox = {
          x: Math.min(startPt.x, cur.x),
          y: Math.min(startPt.y, cur.y),
          w: Math.abs(cur.x - startPt.x),
          h: Math.abs(cur.y - startPt.y),
        };
        setDragBox(currentBox);
      };
      const onUp = () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        setDragBox(null);

        const w = Math.max(currentBox.w < 10 ? 110 : currentBox.w, 24);
        const h = Math.max(
          currentBox.h < 10
            ? activeTool === 'text-highlight' || activeTool === 'text-underline' || activeTool === 'text-strike'
              ? 18
              : activeTool === 'shape-line' || activeTool === 'shape-arrow' || activeTool === 'shape-dashed'
                ? 24
                : 72
            : currentBox.h,
          14
        );
        const id = `obj-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;

        if (activeTool === 'redact') {
          addObject({
            id,
            type: 'redaction',
            pageId: pageMeta.id,
            x: Math.round(currentBox.x),
            y: Math.round(currentBox.y),
            width: Math.round(w),
            height: Math.round(h),
            rotation: 0,
            zIndex: 50,
            opacity: 1,
            fillColor: '#000000',
            applied: false,
          });
          notify('Đã khoanh vùng xóa vĩnh viễn. Nhấn "Áp dụng xóa vĩnh viễn" ở cột Bảo mật để xóa triệt để.', 'info');
          return;
        }

        if (activeTool === 'text-highlight' || activeTool === 'text-underline' || activeTool === 'text-strike') {
          const kind =
            activeTool === 'text-highlight'
              ? 'highlight'
              : activeTool === 'text-underline'
                ? 'underline'
                : 'strikethrough';
          addObject({
            id,
            type: 'annotation',
            pageId: pageMeta.id,
            x: Math.round(currentBox.x),
            y: Math.round(currentBox.y),
            width: Math.round(w),
            height: Math.round(h),
            rotation: 0,
            zIndex: 15,
            opacity: 1,
            kind,
            color: kind === 'highlight' ? '#FDE047' : '#DC2626',
          });
          return;
        }

        if (activeTool.startsWith('shape-')) {
          const shapeKind = activeTool.replace('shape-', '') as Extract<
            StudioObject,
            { type: 'shape' }
          >['shapeKind'];
          addObject({
            id,
            type: 'shape',
            pageId: pageMeta.id,
            x: Math.round(currentBox.x),
            y: Math.round(currentBox.y),
            width: shapeKind === 'square' || shapeKind === 'circle' ? Math.round(Math.max(w, h)) : Math.round(w),
            height: shapeKind === 'square' || shapeKind === 'circle' ? Math.round(Math.max(w, h)) : Math.round(h),
            rotation: 0,
            zIndex: 15,
            opacity: 1,
            shapeKind,
            strokeColor: '#087F70',
            fillColor: shapeKind === 'callout' ? '#FEF9C3' : 'transparent',
            strokeWidth: 1.8,
            strokeStyle: shapeKind === 'dashed' ? 'dashed' : 'solid',
            text: shapeKind === 'callout' ? 'Nháy đúp để nhập ghi chú...' : undefined,
            tableRows:
              shapeKind === 'table'
                ? [
                    ['Cột 1', 'Cột 2', 'Cột 3'],
                    ['Dữ liệu 1', 'Dữ liệu 2', 'Dữ liệu 3'],
                  ]
                : undefined,
          });
          setActiveTool('select');
        }
      };
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      return;
    }

    // Single-click placement tools
    const id = `obj-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;

    if (activeTool === 'add-text') {
      addObject({
        id,
        type: 'text',
        pageId: pageMeta.id,
        x: Math.round(pt.x),
        y: Math.round(pt.y),
        width: 220,
        height: 36,
        rotation: 0,
        zIndex: 20,
        opacity: 1,
        content: 'Nháy đúp để nhập văn bản tiếng Việt',
        fontFamily: 'DejaVuSans',
        fontSize: defaultTextSize,
        bold: false,
        italic: false,
        underline: false,
        strikethrough: false,
        color: defaultTextColor,
        align: 'left',
        lineHeight: 1.35,
        letterSpacing: 0,
      });
      setActiveTool('select');
      return;
    }

    if (activeTool === 'formula') {
      setRightPanelMode('formula');
      notify('Nhập công thức ở khung MathLive bên phải rồi nhấn "Chèn vào trang PDF".', 'info');
      return;
    }

    if (activeTool === 'note') {
      addObject({
        id,
        type: 'annotation',
        pageId: pageMeta.id,
        x: Math.round(pt.x),
        y: Math.round(pt.y),
        width: 170,
        height: 76,
        rotation: 0,
        zIndex: 25,
        opacity: 1,
        kind: 'note',
        color: '#F59E0B',
        noteText: 'Nháy đúp để nhập ghi chú...',
      });
      setActiveTool('select');
      return;
    }

    if (activeTool === 'grade-stamp') {
      addObject({
        id,
        type: 'grading-stamp',
        pageId: pageMeta.id,
        x: Math.round(pt.x - 45),
        y: Math.round(pt.y - 14),
        width: Math.max(76, activeStampLabel.length * 8.5 + 18),
        height: 28,
        rotation: 0,
        zIndex: 30,
        opacity: 1,
        stampCode: activeStampCode,
        label: activeStampLabel,
        color: activeStampColor,
        fontSize: 12,
      });
      return;
    }

    if (activeTool === 'grade-score') {
      const q =
        doc.grading.questions.find((item) => item.id === activeQuestionIdForScore) ||
        doc.grading.questions[0];
      if (!q) return;
      const scoreVal = q.earnedScore !== null ? q.earnedScore : q.maxScore;
      addObject({
        id,
        type: 'grading-score',
        pageId: pageMeta.id,
        x: Math.round(pt.x - 55),
        y: Math.round(pt.y - 14),
        width: 132,
        height: 28,
        rotation: 0,
        zIndex: 32,
        opacity: 1,
        questionId: q.id,
        questionLabel: q.label,
        score: scoreVal,
        maxScore: q.maxScore,
        color: '#DC2626',
      });
      notify(`Đã gắn điểm ${q.label} (đồng bộ với bảng điểm).`, 'success');
      return;
    }

    if (activeTool === 'grade-comment') {
      addObject({
        id,
        type: 'grading-comment',
        pageId: pageMeta.id,
        x: Math.round(pt.x),
        y: Math.round(pt.y),
        width: 210,
        height: 46,
        rotation: 0,
        zIndex: 30,
        opacity: 1,
        text: 'Nhận xét: Trình bày rõ ràng, cần kiểm tra lại bước cuối.',
        color: '#DC2626',
        fontSize: 11,
      });
      setActiveTool('select');
      return;
    }

    if (activeTool === 'grade-total') {
      addObject({
        id,
        type: 'grading-total',
        pageId: pageMeta.id,
        x: Math.round(pt.x - 85),
        y: Math.round(pt.y - 32),
        width: 190,
        height: 74,
        rotation: 0,
        zIndex: 35,
        opacity: 1,
        template: 'with-comment',
        color: '#DC2626',
      });
      setActiveTool('select');
      notify('Đã chèn khung tổng điểm tự động đồng bộ.', 'success');
    }
  };

  const handleSelectObject = (e: React.MouseEvent, id: string) => {
    const obj = doc.objects.find((o) => o.id === id);
    if (obj?.groupId) {
      const grouped = doc.objects.filter((o) => o.groupId === obj.groupId).map((o) => o.id);
      selectObjects(grouped);
      return;
    }
    if (e.shiftKey) {
      if (selectedObjectIds.includes(id)) {
        selectObjects(selectedObjectIds.filter((x) => x !== id));
      } else {
        selectObjects([...selectedObjectIds, id]);
      }
    } else {
      selectObjects([id]);
    }
  };

  const handleEraserHit = (id: string) => {
    const target = doc.objects.find((o) => o.id === id);
    if (!target) return;
    if (target.type === 'ink' || target.type === 'annotation' || target.type === 'grading-stamp') {
      deleteObjects([id]);
    } else {
      notify('Công cụ Tẩy chỉ xóa nét vẽ tay, chú thích và dấu chấm (không xóa nội dung gốc).', 'info');
    }
  };

  const handleEditOriginalBlock = (block: ExtractedTextBlock) => {
    addObject({
      id: `edit-txt-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      type: 'text',
      pageId: pageMeta.id,
      x: Math.round(block.x),
      y: Math.round(block.y),
      width: Math.max(80, Math.round(block.width + 24)),
      height: Math.max(18, Math.round(block.height + 6)),
      rotation: 0,
      zIndex: 25,
      opacity: 1,
      content: block.text,
      fontFamily: block.fontName.toLowerCase().includes('serif') ? 'DejaVuSerif' : 'DejaVuSans',
      fontSize: Math.max(8, Math.round(block.fontSize)),
      bold: block.fontName.toLowerCase().includes('bold'),
      italic: block.fontName.toLowerCase().includes('italic'),
      underline: false,
      strikethrough: false,
      color: '#1F2937',
      align: 'left',
      lineHeight: 1.25,
      letterSpacing: 0,
      replacesOriginalRect: {
        x: block.x,
        y: block.y,
        width: block.width,
        height: block.height,
        originalText: block.text,
      },
    });
    setActiveTool('select');
    notify('Đã tạo lớp sửa chữ đè lên dòng gốc. Nháy đúp để sửa nội dung.', 'success');
  };

  const pageObjects = doc.objects
    .filter((o) => o.pageId === pageMeta.id)
    .sort((a, b) => a.zIndex - b.zIndex);

  const crop = pageMeta.crop;
  const pageNumLabel = (() => {
    if (!doc.pageNumbers.enabled) return null;
    const n = doc.pageNumbers.startNumber + pageIndex;
    const total = doc.pages.length;
    if (doc.pageNumbers.format === 'number') return `${n}`;
    if (doc.pageNumbers.format === 'page-of-total') return `${n} / ${total}`;
    return `Trang ${n} / ${total}`;
  })();

  const wmPosClass =
    doc.watermark.position === 'top-left'
      ? 'items-start justify-start p-8'
      : doc.watermark.position === 'top-right'
        ? 'items-start justify-end p-8'
        : doc.watermark.position === 'bottom-left'
          ? 'items-end justify-start p-8'
          : doc.watermark.position === 'bottom-right'
            ? 'items-end justify-end p-8'
            : 'items-center justify-center';

  return (
    <div className="pdf-page-shell flex flex-col items-center">
      {/* Notice banner when edit-text encounters a scanned / image-only PDF page */}
      {activeTool === 'edit-text' && pageAnalysis && pageAnalysis.kind === 'scanned-image' && (
        <div className="no-print mb-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 text-[13.5px] flex items-center gap-3 max-w-full">
          <span>
            <strong>Trang {pageIndex + 1} là ảnh scan:</strong> Không có lớp văn bản gốc để sửa trực tiếp.
          </span>
          <button
            type="button"
            onClick={() => setActiveModal('ocr')}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#087F70] text-white font-semibold text-[13px] whitespace-nowrap cursor-pointer"
          >
            <ScanText className="w-3.5 h-3.5" />
            <span>Chạy OCR nhận dạng</span>
          </button>
        </div>
      )}

      <div
        ref={containerRef}
        onPointerDown={handleStagePointerDown}
        style={{
          width: viewWidth,
          height: viewHeight,
          cursor:
            activeTool === 'hand'
              ? 'grab'
              : activeTool === 'pen' || activeTool === 'highlighter' || activeTool === 'redact'
                ? 'crosshair'
                : activeTool === 'select'
                  ? 'default'
                  : 'crosshair',
        }}
        className="relative bg-white shadow-md border border-slate-300/80 overflow-hidden shrink-0"
      >
        {/* Base PDF Canvas */}
        <canvas ref={canvasRef} className="block pointer-events-none" />

        {/* CropBox preview shading (visual reminder that CropBox hides margins, not deletes) */}
        {crop && (crop.top > 0 || crop.bottom > 0 || crop.left > 0 || crop.right > 0) && (
          <div className="no-print pointer-events-none absolute inset-0 z-10">
            <div
              className="absolute inset-x-0 top-0 bg-slate-900/20 border-b border-dashed border-[#087F70]"
              style={{ height: crop.top * zoom }}
            />
            <div
              className="absolute inset-x-0 bottom-0 bg-slate-900/20 border-t border-dashed border-[#087F70]"
              style={{ height: crop.bottom * zoom }}
            />
            <div
              className="absolute inset-y-0 left-0 bg-slate-900/20 border-r border-dashed border-[#087F70]"
              style={{ width: crop.left * zoom }}
            />
            <div
              className="absolute inset-y-0 right-0 bg-slate-900/20 border-l border-dashed border-[#087F70]"
              style={{ width: crop.right * zoom }}
            />
          </div>
        )}

        {/* Watermark Live Overlay */}
        {doc.watermark.enabled &&
          (doc.watermark.scope === 'all' || pageIndex === doc.currentPageIndex) && (
            <div className={`pointer-events-none absolute inset-0 z-5 flex ${wmPosClass} overflow-hidden`}>
              {doc.watermark.kind === 'image' && doc.watermark.imageDataUrl ? (
                <img
                  src={doc.watermark.imageDataUrl}
                  alt="Watermark"
                  style={{
                    opacity: doc.watermark.opacity,
                    transform: `rotate(${-doc.watermark.rotation}deg)`,
                    maxWidth: '50%',
                  }}
                />
              ) : (
                <span
                  style={{
                    color: doc.watermark.color,
                    opacity: doc.watermark.opacity,
                    fontSize: doc.watermark.fontSize * zoom,
                    transform: `rotate(${-doc.watermark.rotation}deg)`,
                  }}
                  className="font-bold whitespace-nowrap select-none"
                >
                  {doc.watermark.text}
                </span>
              )}
            </div>
          )}

        {/* Page Number Live Overlay */}
        {pageNumLabel && (
          <div
            className="pointer-events-none absolute inset-x-6 z-5 flex"
            style={{
              top: doc.pageNumbers.position === 'header' ? 14 * zoom : undefined,
              bottom: doc.pageNumbers.position === 'footer' ? 14 * zoom : undefined,
              justifyContent:
                doc.pageNumbers.align === 'left'
                  ? 'flex-start'
                  : doc.pageNumbers.align === 'right'
                    ? 'flex-end'
                    : 'center',
              color: doc.pageNumbers.color,
              fontSize: doc.pageNumbers.fontSize * zoom,
            }}
          >
            {pageNumLabel}
          </div>
        )}

        {/* Editable Original Text Outlines when edit-text tool is active */}
        {activeTool === 'edit-text' &&
          textBlocks.map((blk) => (
            <div
              key={blk.id}
              onClick={(e) => {
                e.stopPropagation();
                handleEditOriginalBlock(blk);
              }}
              style={{
                left: blk.x * zoom,
                top: blk.y * zoom,
                width: Math.max(24, blk.width * zoom),
                height: Math.max(12, blk.height * zoom),
              }}
              title={`Nhấn để sửa dòng chữ gốc: "${blk.text}"`}
              className="no-print absolute z-15 border border-dashed border-[#087F70]/70 hover:bg-[#087F70]/15 hover:border-[#087F70] cursor-text transition-colors"
            />
          ))}

        {/* Unified Studio Objects Layer */}
        {pageObjects.map((obj) => (
          <ObjectLayerItem
            key={obj.id}
            obj={obj}
            zoom={zoom}
            selected={selectedObjectIds.includes(obj.id)}
            grading={doc.grading}
            onSelect={handleSelectObject}
            onEraserHit={handleEraserHit}
            isEraserActive={activeTool === 'eraser'}
          />
        ))}

        {/* Live Draft Ink Path */}
        {draftInkPoints.length >= 2 && (
          <svg
            viewBox={`0 0 ${baseWidth} ${baseHeight}`}
            className="pointer-events-none absolute inset-0 w-full h-full z-40"
          >
            <path
              d={draftInkPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')}
              fill="none"
              stroke={activeTool === 'highlighter' ? '#FACC15' : penColor}
              strokeWidth={activeTool === 'highlighter' ? Math.max(12, penWidth * 4) : penWidth}
              strokeOpacity={activeTool === 'highlighter' ? 0.38 : penOpacity}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}

        {/* Live Drag Box Preview */}
        {dragBox && (
          <div
            style={{
              left: dragBox.x * zoom,
              top: dragBox.y * zoom,
              width: dragBox.w * zoom,
              height: dragBox.h * zoom,
            }}
            className={`no-print pointer-events-none absolute z-45 border-2 border-dashed ${
              activeTool === 'redact'
                ? 'border-[#DC2626] bg-red-500/25'
                : 'border-[#087F70] bg-teal-500/15'
            }`}
          />
        )}
      </div>

      <div className="no-print mt-1.5 text-[12.5px] text-slate-500 tabular-nums">
        Trang {pageIndex + 1} / {doc.pages.length}
      </div>
    </div>
  );
};
