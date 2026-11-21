import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, FileText, Loader2, X, ZoomIn, ZoomOut } from 'lucide-react';
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
  onCancelPlacing?: () => void;
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
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-2 text-[15px] font-semibold text-slate-700">
        <span className="px-3 py-1 rounded-lg bg-white border border-slate-300 text-[#164E63]">
          Trang {sourcePdfPageNum ?? dim.pageIndex + 1}
        </span>
        {printedPageLabel && printedPageLabel !== String(sourcePdfPageNum ?? dim.pageIndex + 1) && (
          <span className="px-3 py-1 rounded-lg bg-[#E6F1EF] border border-teal-200 text-[#087F70]">
            Số trang in trên giấy: {printedPageLabel}
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
  onCancelPlacing,
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
      <div className="px-4 py-2.5 bg-white border-b border-slate-200 flex items-center justify-between gap-3 flex-wrap shrink-0">
        <div className="flex items-center gap-2.5 text-[16px] font-medium text-slate-800 flex-wrap">
          {placingTypeLabel ? (
            <div className="flex items-center gap-2.5 flex-wrap px-3.5 py-2 rounded-xl bg-teal-50 border-2 border-[#087F70] text-[#164E63] font-semibold">
              <span>
                Nhấn vào vị trí cần trả lời trên trang PDF để thêm: <strong>{placingTypeLabel}</strong>
              </span>
              {onCancelPlacing && (
                <button
                  type="button"
                  onClick={onCancelPlacing}
                  className="inline-flex items-center gap-1 px-3 py-1.5 min-h-[38px] rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 text-[15px] font-bold cursor-pointer"
                >
                  <X className="w-4 h-4" />
                  <span>Hủy</span>
                </button>
              )}
            </div>
          ) : pageDims.length > 0 ? (
            mode === 'author' && questions.length === 0 ? (
              <span className="text-slate-700 font-semibold">
                {pageDims.length} trang · Chưa tạo bài tập. Thầy cô hãy nhấn <strong>Tạo bài tập tự động</strong>.
              </span>
            ) : (
              <span className="text-[#164E63] font-semibold">
                Đang hiển thị {pageDims.length} trang · {questions.length} câu hỏi
              </span>
            )
          ) : (
            <span className="text-slate-600">Chưa mở tài liệu PDF</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0.65, Math.round((z - 0.15) * 100) / 100))}
            className="inline-flex items-center gap-1.5 px-3 min-h-[44px] rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-[15px] font-semibold cursor-pointer"
            title="Thu nhỏ trang PDF"
          >
            <ZoomOut className="w-4 h-4" />
            <span className="hidden sm:inline">Thu nhỏ</span>
          </button>
          <span className="min-w-[60px] text-center text-[16px] font-bold text-[#164E63] tabular-nums">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(1.85, Math.round((z + 0.15) * 100) / 100))}
            className="inline-flex items-center gap-1.5 px-3 min-h-[44px] rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-[15px] font-semibold cursor-pointer"
            title="Phóng to trang PDF"
          >
            <ZoomIn className="w-4 h-4" />
            <span className="hidden sm:inline">Phóng to</span>
          </button>
          <button
            type="button"
            onClick={() => setZoom(1.15)}
            className="px-3 min-h-[44px] rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-[15px] font-semibold text-slate-800 cursor-pointer"
          >
            Vừa mắt
          </button>
        </div>
      </div>

      {/* Scrollable Multi-Page PDF Viewport */}
      <div ref={scrollContainerRef} className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="bg-white rounded-xl px-6 py-5 shadow-md flex items-center gap-3 text-[17px] font-semibold text-[#164E63]">
              <Loader2 className="w-6 h-6 animate-spin text-[#087F70]" />
              <span>Đang mở tài liệu PDF. Thầy cô vui lòng chờ...</span>
            </div>
          </div>
        ) : error ? (
          <div className="max-w-lg mx-auto mt-12 bg-white rounded-2xl border border-red-200 p-6 text-center space-y-3">
            <AlertCircle className="w-9 h-9 text-red-600 mx-auto" />
            <div className="text-[19px] font-bold text-red-700">Không thể hiển thị tài liệu PDF</div>
            <p className="text-[16px] text-slate-700 leading-relaxed">{error}</p>
          </div>
        ) : !handle ? (
          <div className="h-full flex items-center justify-center">
            <div className="max-w-md bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3 shadow-2xs">
              <FileText className="w-11 h-11 text-[#087F70] mx-auto" />
              <div className="text-[20px] font-bold text-[#164E63]">
                Chưa có tài liệu PDF nào đang mở
              </div>
              <p className="text-[16px] text-slate-700 leading-relaxed">
                Thầy cô hãy nhấn nút <strong>Tải PDF</strong> ở khung bên trái để chọn tài liệu từ máy tính.
              </p>
            </div>
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
