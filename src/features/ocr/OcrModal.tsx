import React, { useEffect, useRef, useState } from 'react';
import { createWorker, type Worker } from 'tesseract.js';
import { Check, Copy, Download, HelpCircle, Play, ScanText, Sigma, Square, X } from 'lucide-react';
import { openPdfDocument, triggerDownload } from '../../engines/pdf/pdfEngine';
import { useStudioStore } from '../../stores/useStudioStore';

interface OcrModalProps {
  onClose: () => void;
}

export const OcrModal: React.FC<OcrModalProps> = ({ onClose }) => {
  const documents = useStudioStore((s) => s.documents);
  const activeDocId = useStudioStore((s) => s.activeDocId);
  const addObject = useStudioStore((s) => s.addObject);
  const setRightPanelMode = useStudioStore((s) => s.setRightPanelMode);
  const notify = useStudioStore((s) => s.notify);
  const openGuide = useStudioStore((s) => s.openGuide);

  const doc = documents.find((d) => d.id === activeDocId) || null;
  const [targetPageIdx, setTargetPageIdx] = useState<number>(doc?.currentPageIndex ?? 0);
  const [deskewDeg, setDeskewDeg] = useState<number>(0);
  const [contrast, setContrast] = useState<number>(1.2);
  const [grayscale, setGrayscale] = useState<boolean>(true);
  const [language, setLanguage] = useState<'vie+eng' | 'vie' | 'eng'>('vie+eng');

  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusLabel, setStatusLabel] = useState('Sẵn sàng nhận dạng văn bản cục bộ trên trình duyệt');
  const [ocrText, setOcrText] = useState('');

  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const workerRef = useRef<Worker | null>(null);
  const cancelledRef = useRef(false);

  // Render preprocessed page preview
  useEffect(() => {
    if (!doc) return;
    const pageMeta = doc.pages[targetPageIdx];
    const canvas = previewCanvasRef.current;
    if (!pageMeta || !canvas || pageMeta.sourcePageIndex < 0) return;
    let aborted = false;

    const renderPreview = async () => {
      const handle = await openPdfDocument(doc.currentPdfBytes);
      let off: HTMLCanvasElement;
      try {
        if (aborted) return;
        const page = await handle.proxy.getPage(pageMeta.sourcePageIndex + 1);
        const vp = page.getViewport({ scale: 1.8, rotation: pageMeta.rotation });
        off = document.createElement('canvas');
        off.width = Math.round(vp.width);
        off.height = Math.round(vp.height);
        const octx = off.getContext('2d')!;
        octx.fillStyle = '#FFFFFF';
        octx.fillRect(0, 0, off.width, off.height);
        await page.render({ canvasContext: octx, viewport: vp, canvas: off }).promise;
      } finally {
        await handle.destroy();
      }
      if (aborted) return;

      canvas.width = off.width;
      canvas.height = off.height;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((deskewDeg * Math.PI) / 180);
      ctx.filter = `${grayscale ? 'grayscale(100%) ' : ''}contrast(${contrast})`;
      ctx.drawImage(off, -off.width / 2, -off.height / 2);
      ctx.restore();
    };

    renderPreview().catch(() => {});
    return () => {
      aborted = true;
    };
  }, [doc, targetPageIdx, deskewDeg, contrast, grayscale]);

  useEffect(() => {
    return () => {
      workerRef.current?.terminate().catch(() => {});
    };
  }, []);

  const handleRunOcr = async () => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    cancelledRef.current = false;
    setIsRunning(true);
    setProgress(5);
    setStatusLabel('Đang khởi tạo bộ máy OCR Tesseract cục bộ...');

    try {
      const worker = await createWorker(language, 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setStatusLabel('Đang nhận dạng chữ tiếng Việt...');
            setProgress(Math.round((m.progress || 0) * 100));
          } else if (m.status) {
            setStatusLabel(`Đang tải gói ngôn ngữ OCR (${Math.round((m.progress || 0) * 100)}%)...`);
          }
        },
      });
      workerRef.current = worker;
      if (cancelledRef.current) {
        await worker.terminate();
        return;
      }
      const { data } = await worker.recognize(canvas);
      if (!cancelledRef.current) {
        setOcrText(data.text.trim());
        setProgress(100);
        setStatusLabel('Đã hoàn tất nhận dạng OCR.');
      }
      await worker.terminate();
      workerRef.current = null;
    } catch (err) {
      if (!cancelledRef.current) {
        const msg = err instanceof Error ? err.message : 'Lỗi khởi chạy OCR';
        setStatusLabel(`Không thể chạy OCR: ${msg} (Nếu đang ngoại tuyến lần đầu, cần kết nối mạng 1 lần để trình duyệt lưu bộ dữ liệu tiếng Việt).`);
      }
    } finally {
      setIsRunning(false);
    }
  };

  const handleCancelOcr = async () => {
    cancelledRef.current = true;
    await workerRef.current?.terminate().catch(() => {});
    workerRef.current = null;
    setIsRunning(false);
    setStatusLabel('Đã hủy tác vụ OCR.');
  };

  const handleInsertTextLayer = () => {
    if (!doc || !ocrText.trim()) return;
    const page = doc.pages[targetPageIdx];
    if (!page) return;
    addObject({
      id: `ocr-txt-${Date.now()}`,
      type: 'text',
      pageId: page.id,
      x: 48,
      y: 80,
      width: Math.min(480, page.width - 96),
      height: Math.min(340, Math.max(80, ocrText.split('\n').length * 18)),
      rotation: 0,
      zIndex: 25,
      opacity: 1,
      content: ocrText,
      fontFamily: 'DejaVuSans',
      fontSize: 11.5,
      bold: false,
      italic: false,
      underline: false,
      strikethrough: false,
      color: '#1F2937',
      align: 'left',
      lineHeight: 1.35,
      letterSpacing: 0,
      backgroundColor: '#FFFFFF',
    });
    notify('Đã chèn văn bản nhận dạng OCR vào trang PDF', 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        <div className="bg-[#164E63] text-white px-5 py-3.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ScanText className="w-5 h-5" />
            <h2 className="text-[19px] font-bold">Nhận dạng văn bản OCR (Tesseract.js cục bộ)</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                openGuide('security-offline', 'nhan-dang-ocr');
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-[14px] font-semibold cursor-pointer"
            >
              <HelpCircle className="w-4 h-4" />
              <span>Hướng dẫn OCR</span>
            </button>
            <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/15 cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto grid grid-cols-1 lg:grid-cols-12 min-h-0">
          {/* Left: Preprocessing & Preview */}
          <div className="lg:col-span-6 p-4 border-r border-slate-200 bg-[#F4F8F7] flex flex-col gap-3">
            <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2.5 text-[13.5px]">
              <div className="grid grid-cols-2 gap-2">
                <label className="space-y-0.5">
                  <span className="text-slate-500">Trang nhận dạng</span>
                  <select
                    value={targetPageIdx}
                    onChange={(e) => setTargetPageIdx(Number(e.target.value))}
                    className="w-full rounded border border-slate-300 px-2 py-1"
                  >
                    {doc?.pages.map((_, idx) => (
                      <option key={idx} value={idx}>
                        Trang {idx + 1}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-0.5">
                  <span className="text-slate-500">Ngôn ngữ</span>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as 'vie+eng' | 'vie' | 'eng')}
                    className="w-full rounded border border-slate-300 px-2 py-1"
                  >
                    <option value="vie+eng">Tiếng Việt + Tiếng Anh</option>
                    <option value="vie">Chỉ Tiếng Việt</option>
                    <option value="eng">Chỉ Tiếng Anh</option>
                  </select>
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3 items-center">
                <label className="space-y-0.5">
                  <span className="text-slate-500">Chỉnh thẳng trang ({deskewDeg.toFixed(1)}°)</span>
                  <input
                    type="range"
                    min={-10}
                    max={10}
                    step={0.2}
                    value={deskewDeg}
                    onChange={(e) => setDeskewDeg(Number(e.target.value))}
                    className="w-full accent-[#087F70]"
                  />
                </label>
                <label className="space-y-0.5">
                  <span className="text-slate-500">Độ tương phản ({Math.round(contrast * 100)}%)</span>
                  <input
                    type="range"
                    min={0.8}
                    max={2.2}
                    step={0.1}
                    value={contrast}
                    onChange={(e) => setContrast(Number(e.target.value))}
                    className="w-full accent-[#087F70]"
                  />
                </label>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={grayscale} onChange={(e) => setGrayscale(e.target.checked)} className="accent-[#087F70]" />
                <span>Chuyển đen trắng khử nhiễu nền trước khi quét</span>
              </label>
            </div>

            <div className="flex-1 overflow-auto bg-white rounded-xl border border-slate-300 p-2 flex items-center justify-center">
              <canvas ref={previewCanvasRef} className="max-w-full max-h-[360px] object-contain" />
            </div>
          </div>

          {/* Right: Progress & Editable Result */}
          <div className="lg:col-span-6 p-4 flex flex-col gap-3 text-[14px]">
            <div className="flex items-center gap-2">
              {!isRunning ? (
                <button
                  type="button"
                  onClick={handleRunOcr}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#087F70] hover:bg-[#06695d] text-white font-semibold cursor-pointer"
                >
                  <Play className="w-4 h-4" /> Bắt đầu nhận dạng OCR
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleCancelOcr}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#DC2626] hover:bg-red-700 text-white font-semibold cursor-pointer"
                >
                  <Square className="w-4 h-4" /> Hủy bỏ
                </button>
              )}
              <span className="text-[13px] text-slate-600 flex-1 truncate">{statusLabel}</span>
            </div>

            {(isRunning || progress > 0) && (
              <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#087F70] transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}

            <textarea
              value={ocrText}
              onChange={(e) => setOcrText(e.target.value)}
              placeholder="Văn bản tiếng Việt nhận dạng được sẽ hiển thị tại đây. Thầy/cô có thể chỉnh sửa trực tiếp trước khi sao chép hoặc chèn vào PDF..."
              className="flex-1 min-h-[220px] rounded-xl border border-slate-300 p-3 text-[14.5px] leading-relaxed focus:border-[#087F70] outline-none"
            />

            <div className="p-2.5 rounded-lg bg-[#F4F8F7] border border-teal-200/80 text-[13px] text-slate-700 flex items-center justify-between gap-2">
              <span>Với công thức toán phức tạp trong ảnh scan, nên dựng lại bằng MathLive để đạt độ sắc nét vector.</span>
              <button
                type="button"
                onClick={() => {
                  setRightPanelMode('formula');
                  onClose();
                }}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-white border border-teal-300 text-[#087F70] font-semibold whitespace-nowrap cursor-pointer"
              >
                <Sigma className="w-3.5 h-3.5" /> Mở MathLive
              </button>
            </div>

            <div className="flex items-center justify-end gap-2 flex-wrap">
              <button
                type="button"
                disabled={!ocrText}
                onClick={() => {
                  navigator.clipboard?.writeText(ocrText);
                  notify('Đã sao chép văn bản OCR vào bộ nhớ tạm', 'success');
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 font-semibold disabled:opacity-40 cursor-pointer"
              >
                <Copy className="w-4 h-4" /> Sao chép
              </button>
              <button
                type="button"
                disabled={!ocrText}
                onClick={() =>
                  triggerDownload(new Blob([ocrText], { type: 'text/plain;charset=utf-8' }), 'ket_qua_OCR.txt')
                }
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 font-semibold disabled:opacity-40 cursor-pointer"
              >
                <Download className="w-4 h-4" /> Xuất TXT
              </button>
              <button
                type="button"
                disabled={!ocrText}
                onClick={handleInsertTextLayer}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#087F70] hover:bg-[#06695d] text-white font-semibold disabled:opacity-40 cursor-pointer"
              >
                <Check className="w-4 h-4" /> Chèn văn bản vào PDF
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
