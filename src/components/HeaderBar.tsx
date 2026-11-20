import React, { useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  CloudDownload,
  CloudOff,
  Download,
  Loader2,
  RefreshCw,
  Settings,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useStudioStore } from '../stores/useStudioStore';
import type { OfflineReadiness } from '../hooks/usePWAInstall';

interface HeaderBarProps {
  pwa: {
    isInstallable: boolean;
    isInstalled: boolean;
    isIOS: boolean;
    isOnline: boolean;
    offlineStatus: OfflineReadiness;
    offlineDetail: string;
    install: () => Promise<boolean>;
    applyUpdate: () => void;
    prefetchOfflineAssets: () => Promise<boolean>;
  };
}

export const HeaderBar: React.FC<HeaderBarProps> = ({ pwa }) => {
  const setActiveModal = useStudioStore((s) => s.setActiveModal);
  const openGuide = useStudioStore((s) => s.openGuide);
  const closeGuide = useStudioStore((s) => s.closeGuide);
  const guideOpen = useStudioStore((s) => s.guideView.open);
  const notify = useStudioStore((s) => s.notify);
  const [showInstallGuide, setShowInstallGuide] = useState(false);

  const handleInstallClick = async () => {
    if (pwa.isInstallable) {
      const ok = await pwa.install();
      if (ok) {
        notify('Đã cài đặt PDF EDU STUDIO để sử dụng ngoại tuyến.', 'success');
      }
    } else {
      setShowInstallGuide(true);
    }
  };

  return (
    <>
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
              <span className="hidden 2xl:inline text-[14.5px] text-teal-100/90 font-normal whitespace-nowrap">
                Chỉnh sửa – Soạn thảo – Chấm bài thông minh
              </span>
            </div>
          </div>
        </div>

        {/* Right Utility Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Local Privacy indicator */}
          <div
            className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/10 text-[14px] text-teal-50 whitespace-nowrap shrink-0"
            title="Mọi tài liệu PDF và dữ liệu học sinh được xử lý 100% trên thiết bị, không gửi lên máy chủ."
          >
            <ShieldCheck className="w-4 h-4 text-emerald-300 shrink-0" />
            <span>Xử lý cục bộ</span>
          </div>

          {/* Honest 4-State Offline Readiness Indicator */}
          {!pwa.isOnline ? (
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/20 border border-amber-300/40 text-amber-100 text-[14px] whitespace-nowrap shrink-0"
              title="Thiết bị đang không có kết nối mạng. Các tính năng cục bộ vẫn tiếp tục hoạt động."
            >
              <CloudOff className="w-4 h-4 shrink-0" />
              <span>Đang dùng offline</span>
            </div>
          ) : pwa.offlineStatus === 'update-available' ? (
            <button
              type="button"
              onClick={pwa.applyUpdate}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-[14px] whitespace-nowrap shrink-0 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 shrink-0" />
              <span>Cập nhật bản mới</span>
            </button>
          ) : pwa.offlineStatus === 'ready' ? (
            <div
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-100 text-[14px] whitespace-nowrap shrink-0"
              title={pwa.offlineDetail}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
              <span>Sẵn sàng offline</span>
            </div>
          ) : pwa.offlineStatus === 'preparing' ? (
            <div
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/10 text-teal-100 text-[14px] whitespace-nowrap shrink-0"
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
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/25 hover:bg-amber-500/35 border border-amber-300/40 text-amber-100 text-[14px] whitespace-nowrap shrink-0 cursor-pointer"
            >
              <CloudDownload className="w-4 h-4 shrink-0" />
              <span>Cần tải bổ sung tài nguyên</span>
            </button>
          ) : (
            <div
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/10 text-slate-200 text-[13.5px] whitespace-nowrap shrink-0"
              title={pwa.offlineDetail}
            >
              <AlertCircle className="w-4 h-4 text-slate-300 shrink-0" />
              <span>Chưa thể xác nhận offline</span>
            </div>
          )}

          {/* Install PWA button */}
          {!pwa.isInstalled && (
            <button
              type="button"
              onClick={handleInstallClick}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#087F70] hover:bg-[#099180] text-white font-semibold text-[14.5px] whitespace-nowrap shrink-0 transition-colors border border-teal-400/30 cursor-pointer"
            >
              <Download className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">Cài app offline</span>
            </button>
          )}

          {/* Dedicated User Guide Center (renamed from "Trợ giúp") */}
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
            <span>Hướng dẫn sử dụng</span>
          </button>

          {/* Settings */}
          <button
            type="button"
            onClick={() => setActiveModal('settings')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[15px] font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer"
            title="Cài đặt & Dữ liệu cục bộ"
          >
            <Settings className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Cài đặt</span>
          </button>
        </div>
      </header>

      {/* Manual Install Guide Modal for iOS / browsers without native prompt */}
      {showInstallGuide && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="bg-[#164E63] text-white px-5 py-4 flex items-center justify-between">
              <h3 className="text-[19px] font-bold">Cài đặt PDF EDU STUDIO dùng ngoại tuyến</h3>
              <button
                type="button"
                onClick={() => setShowInstallGuide(false)}
                className="p-1 rounded-md hover:bg-white/15 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4 text-[15.5px] text-slate-700 leading-relaxed">
              {pwa.isIOS ? (
                <div className="space-y-2">
                  <p className="font-semibold text-slate-900">Trên iPhone / iPad (Safari):</p>
                  <ol className="list-decimal pl-5 space-y-1.5">
                    <li>Nhấn vào biểu tượng <strong>Chia sẻ (Share)</strong> ở thanh dưới của Safari.</li>
                    <li>Cuộn xuống và chọn <strong>Thêm vào Màn hình chính (Add to Home Screen)</strong>.</li>
                    <li>Nhấn <strong>Thêm (Add)</strong> để hoàn tất cài đặt.</li>
                  </ol>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="font-semibold text-slate-900">Trên Chrome / Edge / Cốc Cốc (Máy tính):</p>
                  <ol className="list-decimal pl-5 space-y-1.5">
                    <li>Nhìn sang góc phải thanh địa chỉ trình duyệt, tìm biểu tượng <strong>Cài đặt ứng dụng</strong> (hình màn hình có mũi tên tải xuống).</li>
                    <li>Hoặc mở menu <strong>⋮</strong> ở góc trên bên phải → chọn <strong>Lưu và chia sẻ / Ứng dụng</strong> → <strong>Cài đặt PDF EDU STUDIO</strong>.</li>
                    <li>Sau khi cài đặt, thầy/cô có thể mở ứng dụng ngay từ màn hình Desktop và làm việc ngay cả khi mất mạng.</li>
                  </ol>
                </div>
              )}
              <div className="bg-[#F4F8F7] border border-teal-200/70 rounded-lg p-3.5 text-[14.5px] text-slate-700">
                <strong>Lưu ý:</strong> Toàn bộ tệp PDF, bảng điểm và chữ ký được lưu cục bộ trên trình duyệt của thiết bị này.
              </div>
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowInstallGuide(false);
                    openGuide('security-offline', 'cai-dat-offline');
                  }}
                  className="text-[14.5px] font-semibold text-[#087F70] hover:underline cursor-pointer"
                >
                  Xem hướng dẫn cài đặt offline →
                </button>
                <button
                  type="button"
                  onClick={() => setShowInstallGuide(false)}
                  className="px-4 py-2 rounded-lg bg-[#087F70] hover:bg-[#06695d] text-white font-semibold cursor-pointer"
                >
                  Đã hiểu
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
