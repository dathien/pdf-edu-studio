import React from 'react';
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  CloudDownload,
  CloudOff,
  Loader2,
  RefreshCw,
  Settings,
  ShieldCheck,
} from 'lucide-react';
import { useStudioStore } from '../stores/useStudioStore';
import type { PwaInstallController } from '../hooks/usePWAInstall';
import { PwaInstallManager } from './PwaInstallManager';

interface HeaderBarProps {
  pwa: PwaInstallController;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({ pwa }) => {
  const setActiveModal = useStudioStore((s) => s.setActiveModal);
  const openGuide = useStudioStore((s) => s.openGuide);
  const closeGuide = useStudioStore((s) => s.closeGuide);
  const guideOpen = useStudioStore((s) => s.guideView.open);
  const interactiveOpen = useStudioStore((s) => s.interactiveView.open);
  const openInteractive = useStudioStore((s) => s.openInteractive);
  const closeInteractive = useStudioStore((s) => s.closeInteractive);

  return (
    <header
      data-tour="header-bar"
      className="no-print h-14 bg-[#164E63] text-white flex items-center justify-between px-4 border-b border-[#0f3a4a] shrink-0 select-none"
    >
      {/* Brand Identity */}
      <div className="flex items-center gap-3 min-w-0">
        <img
          src="/icons/icon.svg"
          alt="PDF EDU STUDIO"
          className="w-9 h-9 rounded-lg shadow-sm shrink-0 bg-white/10"
        />
        <div className="flex flex-col leading-tight min-w-0">
          <div className="flex items-center gap-2.5">
            <span className="text-[19px] font-bold tracking-tight whitespace-nowrap">
              PDF EDU STUDIO
            </span>
            <span className="hidden 2xl:inline text-[15px] text-teal-100/90 font-normal whitespace-nowrap">
              Chỉnh sửa – Soạn thảo – Chấm bài thông minh
            </span>
          </div>
        </div>
      </div>

      {/* Right Utility Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Local Privacy indicator */}
        <div
          className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/10 text-[15px] text-teal-50 whitespace-nowrap shrink-0"
          title="Mọi tài liệu PDF và dữ liệu học sinh được xử lý 100% trên thiết bị, không gửi lên máy chủ."
        >
          <ShieldCheck className="w-4 h-4 text-emerald-300 shrink-0" />
          <span>Xử lý cục bộ</span>
        </div>

        {/* Honest 4-State Offline Readiness Indicator */}
        {!pwa.isOnline ? (
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/20 border border-amber-300/40 text-amber-100 text-[15px] whitespace-nowrap shrink-0"
            title="Thiết bị đang không có kết nối mạng. Các tính năng cục bộ đã lưu bộ nhớ đệm vẫn tiếp tục hoạt động."
          >
            <CloudOff className="w-4 h-4 shrink-0" />
            <span>Đang dùng offline</span>
          </div>
        ) : pwa.offlineStatus === 'update-available' ? (
          <button
            type="button"
            onClick={pwa.applyUpdate}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-[15px] whitespace-nowrap shrink-0 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 shrink-0" />
            <span>Cập nhật bản mới</span>
          </button>
        ) : pwa.offlineStatus === 'ready' ? (
          <div
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-100 text-[15px] whitespace-nowrap shrink-0"
            title={pwa.offlineDetail}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
            <span>Sẵn sàng offline</span>
          </div>
        ) : pwa.offlineStatus === 'preparing' ? (
          <div
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/10 text-teal-100 text-[15px] whitespace-nowrap shrink-0"
            title={pwa.offlineDetail}
          >
            <Loader2 className="w-4 h-4 animate-spin text-teal-200 shrink-0" />
            <span>Đang chuẩn bị offline</span>
          </div>
        ) : pwa.offlineStatus === 'needs-assets' ? (
          <button
            type="button"
            onClick={() => pwa.prefetchOfflineAssets()}
            title={pwa.offlineDetail}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/25 hover:bg-amber-500/35 border border-amber-300/40 text-amber-100 text-[15px] whitespace-nowrap shrink-0 cursor-pointer"
          >
            <CloudDownload className="w-4 h-4 shrink-0" />
            <span>Cần tải bổ sung tài nguyên</span>
          </button>
        ) : (
          <div
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/10 text-slate-200 text-[15px] whitespace-nowrap shrink-0"
            title={pwa.offlineDetail}
          >
            <AlertCircle className="w-4 h-4 text-slate-300 shrink-0" />
            <span>Chưa thể xác nhận offline</span>
          </div>
        )}

        {/* Shared Browser-Aware PWA Install Action */}
        <PwaInstallManager pwa={pwa} variant="header-button" />

        {/* Interactive PDF Worksheets Entry */}
        <button
          type="button"
          onClick={() => (interactiveOpen ? closeInteractive() : openInteractive('solve'))}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[15px] font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
            interactiveOpen
              ? 'bg-white text-[#087F70]'
              : 'bg-[#087F70] hover:bg-[#0a9685] text-white border border-teal-400/40'
          }`}
          title="Mở phân hệ Bài tập PDF tương tác Online/Offline"
        >
          <ClipboardList className="w-4 h-4 shrink-0" />
          <span>Bài tập PDF</span>
        </button>

        {/* Dedicated User Guide Center */}
        <button
          type="button"
          data-tour="guide-btn"
          onClick={() => (guideOpen ? closeGuide() : openGuide())}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[15px] font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
            guideOpen
              ? 'bg-white text-[#164E63]'
              : 'bg-white/15 hover:bg-white/25 text-white'
          }`}
        >
          <BookOpen className="w-4 h-4 shrink-0" />
          <span className="hidden md:inline">Hướng dẫn sử dụng</span>
          <span className="md:hidden">Hướng dẫn</span>
        </button>

        {/* Settings / Local Data (clearly distinguished from PWA installation) */}
        <button
          type="button"
          onClick={() => setActiveModal('settings')}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[15px] font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer"
          title="Thiết lập & Quản lý dữ liệu cục bộ"
        >
          <Settings className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline">Thiết lập</span>
        </button>
      </div>
    </header>
  );
};
