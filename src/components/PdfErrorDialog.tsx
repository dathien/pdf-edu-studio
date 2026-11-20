import React, { useState } from 'react';
import { AlertCircle, ChevronDown, ChevronUp, FolderOpen, RotateCcw, X } from 'lucide-react';
import { useStudioStore } from '../stores/useStudioStore';

interface PdfErrorDialogProps {
  onOpenOtherDocument: () => void;
}

export const PdfErrorDialog: React.FC<PdfErrorDialogProps> = ({ onOpenOtherDocument }) => {
  const pdfError = useStudioStore((s) => s.pdfError);
  const setPdfError = useStudioStore((s) => s.setPdfError);
  const [showDetail, setShowDetail] = useState(false);

  if (!pdfError) return null;

  const handleClose = () => {
    setShowDetail(false);
    setPdfError(null);
  };

  const handleRetry = () => {
    const retryFn = pdfError.onRetry;
    setShowDetail(false);
    setPdfError(null);
    if (retryFn) {
      retryFn();
    }
  };

  const handleOpenOther = () => {
    setShowDetail(false);
    setPdfError(null);
    onOpenOtherDocument();
  };

  return (
    <div
      className="no-print fixed inset-0 z-70 bg-slate-900/55 flex items-center justify-center p-4"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="pdf-error-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 bg-red-50 border-b border-red-100 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-100 text-[#DC2626] flex items-center justify-center shrink-0 mt-0.5">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 id="pdf-error-title" className="text-[17px] font-bold text-slate-900">
                {pdfError.title || 'Không thể mở tài liệu PDF'}
              </h2>
              <p className="text-[14.5px] text-slate-700 mt-1 leading-relaxed">
                {pdfError.message || 'Không thể mở tài liệu PDF. Vui lòng thử lại.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-red-100/70 shrink-0 cursor-pointer"
            aria-label="Đóng thông báo lỗi"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body & Collapsible Technical Detail */}
        <div className="px-5 py-4 space-y-4">
          {pdfError.detail && (
            <div>
              <button
                type="button"
                onClick={() => setShowDetail((v) => !v)}
                className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-slate-600 hover:text-[#164E63] cursor-pointer"
              >
                {showDetail ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
                <span>Xem chi tiết lỗi</span>
              </button>
              {showDetail && (
                <div className="mt-2 p-3 rounded-lg bg-slate-50 border border-slate-200 text-[12.5px] font-mono text-slate-700 break-words max-h-36 overflow-y-auto">
                  {pdfError.detail}
                </div>
              )}
            </div>
          )}

          {/* Primary Actions */}
          <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={handleOpenOther}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-[14px] cursor-pointer"
            >
              <FolderOpen className="w-4 h-4 text-[#087F70]" />
              <span>Mở tài liệu khác</span>
            </button>
            {pdfError.onRetry && (
              <button
                type="button"
                onClick={handleRetry}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#087F70] hover:bg-[#06695d] text-white font-semibold text-[14px] cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Thử lại</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
