import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Lock,
  Maximize2,
  Minimize2,
  Minus,
  Plus,
  Unlock,
} from 'lucide-react';
import { useStudioStore } from '../stores/useStudioStore';

interface StatusBarProps {
  onFitWidth: () => void;
  onFitPage: () => void;
}

export const StatusBar: React.FC<StatusBarProps> = ({ onFitWidth, onFitPage }) => {
  const documents = useStudioStore((s) => s.documents);
  const activeDocId = useStudioStore((s) => s.activeDocId);
  const setDocZoom = useStudioStore((s) => s.setDocZoom);
  const setCurrentPageIndex = useStudioStore((s) => s.setCurrentPageIndex);
  const setDocConfidential = useStudioStore((s) => s.setDocConfidential);
  const isFullscreen = useStudioStore((s) => s.isFullscreen);
  const setIsFullscreen = useStudioStore((s) => s.setIsFullscreen);
  const notify = useStudioStore((s) => s.notify);

  const activeDoc = documents.find((d) => d.id === activeDocId) || null;

  return (
    <footer className="no-print h-10 bg-white border-t border-slate-200 px-3 flex items-center justify-between text-[13.5px] text-slate-600 shrink-0 select-none gap-3">
      {/* Left: Page Navigation & Confidential mode */}
      <div className="flex items-center gap-3 min-w-0">
        {activeDoc ? (
          <>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={activeDoc.currentPageIndex <= 0}
                onClick={() => setCurrentPageIndex(activeDoc.currentPageIndex - 1)}
                className="p-1 rounded hover:bg-slate-100 disabled:opacity-35 cursor-pointer"
                title="Trang trước"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="whitespace-nowrap font-medium text-slate-800 tabular-nums">
                Trang{' '}
                <input
                  type="number"
                  min={1}
                  max={activeDoc.pages.length}
                  value={activeDoc.currentPageIndex + 1}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    if (!Number.isNaN(v)) setCurrentPageIndex(v - 1);
                  }}
                  className="w-11 text-center border border-slate-300 rounded px-1 py-0.5 text-[13.5px] font-semibold text-[#164E63]"
                />{' '}
                / {activeDoc.pages.length}
              </span>
              <button
                type="button"
                disabled={activeDoc.currentPageIndex >= activeDoc.pages.length - 1}
                onClick={() => setCurrentPageIndex(activeDoc.currentPageIndex + 1)}
                className="p-1 rounded hover:bg-slate-100 disabled:opacity-35 cursor-pointer"
                title="Trang tiếp"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="hidden md:block w-px h-4 bg-slate-200" />

            <button
              type="button"
              onClick={() => {
                const next = !activeDoc.isConfidential;
                setDocConfidential(next);
                notify(
                  next
                    ? 'Đã bật chế độ Bảo mật đề thi: Không tự động lưu bản nháp vào trình duyệt.'
                    : 'Đã tắt chế độ Bảo mật: Bật lại tự lưu bản nháp cục bộ.',
                  'info'
                );
              }}
              className={`hidden md:flex items-center gap-1 px-2 py-0.5 rounded text-[13px] font-medium whitespace-nowrap cursor-pointer transition-colors ${
                activeDoc.isConfidential
                  ? 'bg-amber-100 text-amber-800'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
              title="Bật chế độ bảo mật để không lưu bản nháp tự động vào trình duyệt (dùng cho đề thi mật)."
            >
              {activeDoc.isConfidential ? (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Đề mật (không lưu nháp)</span>
                </>
              ) : (
                <>
                  <Unlock className="w-3.5 h-3.5" />
                  <span>{activeDoc.isDirty ? 'Chưa xuất PDF' : 'Đã đồng bộ cục bộ'}</span>
                </>
              )}
            </button>
          </>
        ) : (
          <span className="text-slate-500 whitespace-nowrap">
            Sẵn sàng mở tài liệu PDF ngay trên thiết bị
          </span>
        )}
      </div>

      {/* Center: Copyright Attribution */}
      <div className="hidden xl:block text-[13px] text-slate-500 whitespace-nowrap truncate">
        Copyright © 2026 – Phát triển bởi Thầy Hồ Nguyễn Đa Thiện
      </div>

      {/* Right: Zoom Controls */}
      <div className="flex items-center gap-1.5 shrink-0">
        {activeDoc && (
          <>
            <button
              type="button"
              onClick={onFitWidth}
              className="hidden sm:inline px-2 py-0.5 rounded hover:bg-slate-100 text-slate-700 font-medium whitespace-nowrap cursor-pointer"
            >
              Vừa chiều ngang
            </button>
            <button
              type="button"
              onClick={onFitPage}
              className="hidden sm:inline px-2 py-0.5 rounded hover:bg-slate-100 text-slate-700 font-medium whitespace-nowrap cursor-pointer"
            >
              Vừa trang
            </button>
            <button
              type="button"
              onClick={() => setDocZoom(activeDoc.zoom - 0.15)}
              className="p-1 rounded hover:bg-slate-100 cursor-pointer"
              title="Thu nhỏ"
            >
              <Minus className="w-4 h-4" />
            </button>
            <input
              type="range"
              min={25}
              max={300}
              step={5}
              value={Math.round(activeDoc.zoom * 100)}
              onChange={(e) => setDocZoom(Number(e.target.value) / 100)}
              className="w-20 accent-[#087F70] cursor-pointer"
              aria-label="Mức thu phóng"
            />
            <span className="w-11 text-right font-semibold text-slate-800 tabular-nums">
              {Math.round(activeDoc.zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setDocZoom(activeDoc.zoom + 0.15)}
              className="p-1 rounded hover:bg-slate-100 cursor-pointer"
              title="Phóng to"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1 rounded hover:bg-slate-100 text-slate-700 cursor-pointer"
              title={isFullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </>
        )}
      </div>
    </footer>
  );
};
