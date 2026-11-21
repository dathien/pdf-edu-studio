import React, { useRef, useState } from 'react';
import { FileText, Home, Plus, X, AlertTriangle } from 'lucide-react';
import { useStudioStore } from '../stores/useStudioStore';
import { openFilesInStudio, quickSavePdf } from '../services/documentActions';

export const DocumentTabs: React.FC = () => {
  const documents = useStudioStore((s) => s.documents);
  const activeDocId = useStudioStore((s) => s.activeDocId);
  const setActiveDoc = useStudioStore((s) => s.setActiveDoc);
  const closeDocument = useStudioStore((s) => s.closeDocument);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [confirmCloseId, setConfirmCloseId] = useState<string | null>(null);

  const handleRequestClose = (e: React.MouseEvent, id: string, isDirty: boolean) => {
    e.stopPropagation();
    if (isDirty) {
      setConfirmCloseId(id);
    } else {
      closeDocument(id);
    }
  };

  const docToClose = documents.find((d) => d.id === confirmCloseId);

  return (
    <>
      <div className="no-print h-10 bg-[#E6F1EF] border-b border-teal-900/15 flex items-center px-2 gap-1 overflow-x-auto shrink-0 select-none">
        {/* Home / Welcome screen button */}
        <button
          type="button"
          onClick={() => setActiveDoc(null)}
          className={`flex items-center gap-1.5 px-3 h-8 rounded-t-md text-[14.5px] font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
            activeDocId === null
              ? 'bg-white text-[#087F70] border border-b-0 border-teal-900/15 shadow-xs'
              : 'text-slate-700 hover:bg-white/60'
          }`}
        >
          <Home className="w-4 h-4 shrink-0" />
          <span>Trang chủ</span>
        </button>

        {/* Open Document Tabs */}
        {documents.map((doc) => {
          const isActive = doc.id === activeDocId;
          return (
            <div
              key={doc.id}
              onClick={() => setActiveDoc(doc.id)}
              className={`group flex items-center gap-2 pl-3 pr-2 h-8 rounded-t-md max-w-[240px] text-[14.5px] cursor-pointer transition-colors shrink-0 ${
                isActive
                  ? 'bg-white text-[#164E63] font-semibold border border-b-0 border-teal-900/15 shadow-xs'
                  : 'bg-[#d8eae7]/70 text-slate-700 hover:bg-white/75'
              }`}
              title={`${doc.title} (${doc.pages.length} trang)`}
            >
              <FileText className="w-4 h-4 text-[#087F70] shrink-0" />
              <span className="truncate">{doc.title}</span>
              {doc.isDirty && (
                <span className="text-[#DC2626] font-bold shrink-0" title="Có thay đổi chưa lưu ra tệp PDF">
                  *
                </span>
              )}
              <button
                type="button"
                onClick={(e) => handleRequestClose(e, doc.id, doc.isDirty)}
                className="p-0.5 rounded hover:bg-slate-200/80 text-slate-500 hover:text-slate-900 shrink-0 cursor-pointer"
                title="Đóng tài liệu"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}

        {/* Add / Open PDF Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1 px-2.5 h-8 rounded-md text-[#087F70] hover:bg-white/70 text-[14px] font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer"
          title="Mở thêm tệp PDF (*.pdf)"
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span>Mở tệp</span>
        </button>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={(e) => {
            if (e.target.files) {
              openFilesInStudio(e.target.files);
              e.target.value = '';
            }
          }}
        />
      </div>

      {/* Unsaved Changes Confirmation Dialog (never uses window.confirm) */}
      {docToClose && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="p-5 flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-[18px] font-bold text-slate-900">Tài liệu có thay đổi chưa lưu</h3>
                <p className="text-[15px] text-slate-600 leading-relaxed">
                  Tài liệu <strong>{docToClose.title}</strong> đã được chỉnh sửa. Thầy/cô muốn lưu thành tệp PDF mới trước khi đóng không?
                </p>
              </div>
            </div>
            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmCloseId(null)}
                className="px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-medium text-[14.5px] cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => {
                  closeDocument(docToClose.id);
                  setConfirmCloseId(null);
                }}
                className="px-3.5 py-2 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-[#DC2626] font-semibold text-[14.5px] cursor-pointer"
              >
                Đóng không lưu
              </button>
              <button
                type="button"
                onClick={async () => {
                  await quickSavePdf(docToClose, true);
                  closeDocument(docToClose.id);
                  setConfirmCloseId(null);
                }}
                className="px-4 py-2 rounded-lg bg-[#087F70] hover:bg-[#06695d] text-white font-semibold text-[14.5px] cursor-pointer"
              >
                Lưu PDF mới & Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
