import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, Loader2, ZoomIn, ZoomOut } from 'lucide-react';
import { openPdfDocument, type LoadedPdfHandle } from '../../engines/pdf/pdfEngine';
import { QuestionRegionWidget } from './QuestionRegionWidget';
import type {
  InteractiveQuestion,
  QuestionGradingDetail,
  StudentAnswerMap,
  StudentQuestionAnswer,
  TeacherAnswerKeyMap,
} from '../../types/interactive';

interface PageDim {
  pageIndex: number;
  width: number;
  height: number;
}

interface InteractivePdfCanvasProps {
  pdfBytes: Uint8Array | null;
  questions: InteractiveQuestion[];
  mode: 'author' | 'solve' | 'grade';
  examMode: 'exam' | 'practice';
  selectedQuestionId?: string | null;
  answers?: StudentAnswerMap;
  teacherKeys?: TeacherAnswerKeyMap;
  gradingDetails?: Record<string, QuestionGradingDetail>;
  placingTypeLabel?: string | null;
  sourcePdfPages?: number[];
  printedPageLabels?: string[];
  scrollToQuestionNonce?: number;
  onSelectQuestion?: (id: string | null) => void;
  onPlaceAtPoint?: (pageIndex: number, pdfX: number, pdfY: number) => void;
  onUpdateRegion?: (qId: string, patch: Partial<InteractiveQuestion['region']>) => void;
  onDeleteQuestion?: (qId: string) => void;
  onChangeAnswer?: (qId: string, next: StudentQuestionAnswer) => void;
}

const SinglePdfPageCanvas: React.FC<{
  handle: LoadedPdfHandle;
  dim: PageDim;
  zoom: number;
  questions: InteractiveQuestion[];
  mode: 'author' | 'solve' | 'grade';
  examMode: 'exam' | 'practice';
  selectedQuestionId?: string | null;
  answers?: StudentAnswerMap;
  teacherKeys?: TeacherAnswerKeyMap;
  gradingDetails?: Record<string, QuestionGradingDetail>;
  placingActive: boolean;
  sourcePdfPageNum?: number;
  printedPageLabel?: string;
  onSelectQuestion?: (id: string | null) => void;
  onPlaceAtPoint?: (pageIndex: number, pdfX: number, pdfY: number) => void;
  onUpdateRegion?: (qId: string, patch: Partial<InteractiveQuestion['region']>) => void;
  onDeleteQuestion?: (qId: string) => void;
  onChangeAnswer?: (qId: string, next: StudentQuestionAnswer) => void;
}> = ({
  handle,
  dim,
  zoom,
  questions,
  mode,
  examMode,
  selectedQuestionId,
  answers,
  teacherKeys,
  gradingDetails,
  placingActive,
  sourcePdfPageNum,
  printedPageLabel,
  onSelectQuestion,
  onPlaceAtPoint,
  onUpdateRegion,
  onDeleteQuestion,
  onChangeAnswer,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let cancelled = false;
    let renderTask: { cancel: () => void; promise: Promise<void> } | null = null;

    const run = async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const page = await handle.proxy.getPage(dim.pageIndex + 1);
      if (cancelled) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const viewport = page.getViewport({ scale: zoom * dpr });
      canvas.width = Math.round(viewport.width);
      canvas.height = Math.round(viewport.height);
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      renderTask = page.render({ canvasContext: ctx, viewport, canvas });
      await renderTask.promise;
    };

    run().catch(() => {
      // Cancelled during zoom change or unmount
    });

    return () => {
      cancelled = true;
      try {
        renderTask?.cancel();
      } catch {
        // ignore cancel errors
      }
    };
  }, [handle, dim.pageIndex, zoom]);

  const cssW = Math.round(dim.width * zoom);
  const cssH = Math.round(dim.height * zoom);

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="flex items-center gap-2 text-[14px] font-semibold text-slate-700">
        <span className="px-2.5 py-0.5 rounded-md bg-white border border-slate-300 text-[#164E63]">
          Trang PDF {sourcePdfPageNum ?? dim.pageIndex + 1}
        </span>
        {printedPageLabel && (
          <span className="px-2.5 py-0.5 rounded-md bg-[#E6F1EF] border border-teal-200 text-[#087F70]">
            Trang in trên tài liệu: {printedPageLabel}
          </span>
        )}
      </div>
      <div
        style={{ width: `${cssW}px`, height: `${cssH}px` }}
        onClick={(e) => {
          if (mode === 'author' && placingActive && onPlaceAtPoint) {
            const rect = e.currentTarget.getBoundingClientRect();
            const pdfX = Math.max(12, Math.round((e.clientX - rect.left) / zoom));
            const pdfY = Math.max(12, Math.round((e.clientY - rect.top) / zoom));
            onPlaceAtPoint(dim.pageIndex, pdfX, pdfY);
          } else if (mode === 'author' && onSelectQuestion) {
            onSelectQuestion(null);
          }
        }}
        className={`relative bg-white shadow-md border border-slate-300 rounded-sm overflow-hidden ${
          placingActive ? 'cursor-crosshair ring-2 ring-[#087F70]' : ''
        }`}
      >
        <canvas
          ref={canvasRef}
          style={{ width: `${cssW}px`, height: `${cssH}px` }}
          className="block pointer-events-none select-none"
        />

        {/* PDF-Coordinate-Locked Interactive Overlay Layer */}
        <div className="absolute inset-0">
          {questions.map((q) => (
            <QuestionRegionWidget
              key={q.id}
              question={q}
              zoom={zoom}
              pageWidth={dim.width}
              pageHeight={dim.height}
              mode={mode}
              examMode={examMode}
              selected={selectedQuestionId === q.id}
              answer={answers?.[q.id]}
              teacherKey={teacherKeys?.[q.id]}
              gradingDetail={gradingDetails?.[q.id]}
              onSelect={() => onSelectQuestion?.(q.id)}
              onUpdateRegion={(patch) => onUpdateRegion?.(q.id, patch)}
              onDeleteQuestion={() => onDeleteQuestion?.(q.id)}
              onChangeAnswer={(next) => onChangeAnswer?.(q.id, next)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export const InteractivePdfCanvas: React.FC<InteractivePdfCanvasProps> = ({
  pdfBytes,
  questions,
  mode,
  examMode,
  selectedQuestionId,
  answers,
  teacherKeys,
  gradingDetails,
  placingTypeLabel,
  sourcePdfPages,
  printedPageLabels,
  scrollToQuestionNonce,
  onSelectQuestion,
  onPlaceAtPoint,
  onUpdateRegion,
  onDeleteQuestion,
  onChangeAnswer,
}) => {
  const [zoom, setZoom] = useState(1.15);
  const [handle, setHandle] = useState<LoadedPdfHandle | null>(null);
  const [pageDims, setPageDims] = useState<PageDim[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll smoothly to selected question when teacher clicks in Left Question List
  useEffect(() => {
    if (!selectedQuestionId || !scrollToQuestionNonce) return;
    const root = scrollContainerRef.current;
    if (!root) return;
    const target = root.querySelector(`[data-question-id="${CSS.escape(selectedQuestionId)}"]`);
    if (target && 'scrollIntoView' in target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    }
  }, [selectedQuestionId, scrollToQuestionNonce]);

  useEffect(() => {
    let active = true;
    let currentHandle: LoadedPdfHandle | null = null;

    if (!pdfBytes || pdfBytes.byteLength === 0) {
      setHandle(null);
      setPageDims([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    openPdfDocument(pdfBytes)
      .then(async (loaded) => {
        if (!active) {
          await loaded.destroy().catch(() => {});
          return;
        }
        currentHandle = loaded;
        const dims: PageDim[] = [];
        for (let i = 1; i <= loaded.proxy.numPages; i++) {
          const p = await loaded.proxy.getPage(i);
          const vp = p.getViewport({ scale: 1 });
          dims.push({ pageIndex: i - 1, width: vp.width, height: vp.height });
        }
        if (!active) return;
        setPageDims(dims);
        setHandle(loaded);
        setLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setLoading(false);
        setError(err instanceof Error ? err.message : 'Không thể hiển thị tài liệu PDF.');
      });

    return () => {
      active = false;
      currentHandle?.destroy().catch(() => {});
    };
  }, [pdfBytes]);

  return (
    <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-[#E6EFEF]">
      {/* Canvas Zoom & Placement Banner */}
      <div className="px-4 py-2 bg-white border-b border-slate-200 flex items-center justify-between gap-3 flex-wrap shrink-0">
        <div className="flex items-center gap-2 text-[14.5px] font-medium text-slate-700">
          {placingTypeLabel ? (
            <span className="px-3 py-1 rounded-lg bg-teal-50 border border-[#087F70] text-[#164E63] font-semibold">
              Nhấp vào vị trí bất kỳ trên trang PDF để đặt khung: {placingTypeLabel}
            </span>
          ) : (
            <span>
              {pageDims.length > 0
                ? `${pageDims.length} trang PDF · ${questions.length} vùng câu hỏi tương tác`
                : 'Chưa nạp tài liệu PDF'}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0.65, Math.round((z - 0.15) * 100) / 100))}
            className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 cursor-pointer"
            title="Thu nhỏ"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="min-w-[58px] text-center text-[14.5px] font-semibold text-[#164E63] tabular-nums">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(1.75, Math.round((z + 0.15) * 100) / 100))}
            className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 cursor-pointer"
            title="Phóng to"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setZoom(1.15)}
            className="px-2.5 py-1 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-[13.5px] font-semibold text-slate-700 cursor-pointer"
          >
            115%
          </button>
        </div>
      </div>

      {/* Scrollable Multi-Page PDF Viewport */}
      <div ref={scrollContainerRef} className="flex-1 overflow-auto p-5">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="bg-white rounded-xl px-5 py-4 shadow-md flex items-center gap-3 text-[15.5px] font-semibold text-[#164E63]">
              <Loader2 className="w-5 h-5 animate-spin text-[#087F70]" />
              <span>Đang tải các trang PDF...</span>
            </div>
          </div>
        ) : error ? (
          <div className="max-w-md mx-auto mt-12 bg-white rounded-xl border border-red-200 p-5 text-center space-y-2">
            <AlertCircle className="w-8 h-8 text-red-600 mx-auto" />
            <div className="text-[16px] font-bold text-red-700">Không thể hiển thị PDF</div>
            <p className="text-[14.5px] text-slate-600">{error}</p>
          </div>
        ) : !handle ? (
          <div className="h-full flex items-center justify-center text-slate-500 text-[15.5px]">
            Chọn tệp PDF hoặc mẫu môn học để bắt đầu.
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6 pb-10">
            {pageDims.map((dim) => (
              <SinglePdfPageCanvas
                key={dim.pageIndex}
                handle={handle}
                dim={dim}
                zoom={zoom}
                questions={questions.filter((q) => q.region.pageIndex === dim.pageIndex)}
                mode={mode}
                examMode={examMode}
                selectedQuestionId={selectedQuestionId}
                answers={answers}
                teacherKeys={teacherKeys}
                gradingDetails={gradingDetails}
                placingActive={Boolean(placingTypeLabel)}
                sourcePdfPageNum={sourcePdfPages?.[dim.pageIndex]}
                printedPageLabel={printedPageLabels?.[dim.pageIndex]}
                onSelectQuestion={onSelectQuestion}
                onPlaceAtPoint={onPlaceAtPoint}
                onUpdateRegion={onUpdateRegion}
                onDeleteQuestion={onDeleteQuestion}
                onChangeAnswer={onChangeAnswer}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
