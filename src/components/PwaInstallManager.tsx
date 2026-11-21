import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Compass,
  Download,
  Info,
  Laptop,
  Loader2,
  Smartphone,
  X,
} from 'lucide-react';
import type { PwaInstallController } from '../hooks/usePWAInstall';
import { useStudioStore } from '../stores/useStudioStore';

interface PwaInstallManagerProps {
  pwa: PwaInstallController;
  variant: 'header-button' | 'inline-guide-panel' | 'settings-card';
  onNavigateToGuide?: () => void;
}

/**
 * Shared PWA installation manager for macOS Safari, Chrome, Edge, iOS Safari, and Desktop browsers.
 * - Never triggers manifest or JSON downloads.
 * - Never calls prompt() on null or on Safari.
 * - Never claims installation succeeded before browser emits 'appinstalled' or standalone mode.
 */
export const PwaInstallManager: React.FC<PwaInstallManagerProps> = ({
  pwa,
  variant,
  onNavigateToGuide,
}) => {
  const notify = useStudioStore((s) => s.notify);
  const openGuide = useStudioStore((s) => s.openGuide);

  const handleActionClick = async () => {
    if (pwa.installStatus === 'installed-standalone' || pwa.installStatus === 'prompting') {
      return;
    }

    if (pwa.installStatus === 'can-install' && pwa.hasNativePrompt && !pwa.isSafariMacOS) {
      const outcome = await pwa.install();
      if (outcome === 'accepted') {
        notify(
          'Bạn đã xác nhận lời nhắc cài đặt. Đang chờ trình duyệt hoàn tất cài PDF EDU STUDIO...',
          'info'
        );
      } else if (outcome === 'dismissed') {
        notify(
          'Bạn đã đóng hộp thoại cài đặt. Có thể mở lại bất cứ lúc nào từ menu trình duyệt.',
          'info'
        );
      } else {
        pwa.setInstallGuideOpen(true);
      }
      return;
    }

    // Safari macOS, Chrome/Edge without deferredPrompt, iOS Safari, or unsupported browsers:
    // Open the non-intrusive inline guide panel right inside the workspace.
    pwa.toggleInstallGuide();
  };

  const getPrimaryLabel = (): string => {
    if (pwa.installStatus === 'installed-standalone') {
      return 'Đang sử dụng ứng dụng đã cài';
    }
    if (pwa.installStatus === 'prompting') {
      return 'Đang mở hộp thoại cài đặt...';
    }
    if (pwa.installStatus === 'can-install') {
      return 'Cài PDF EDU STUDIO';
    }
    if (pwa.isSafariMacOS) {
      return 'Hướng dẫn cài trên Mac';
    }
    return 'Xem cách cài đặt';
  };

  // =========================================================================
  // 1. HEADER BAR BUTTON
  // =========================================================================
  if (variant === 'header-button') {
    if (pwa.installStatus === 'installed-standalone') {
      return (
        <div
          className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-300/35 text-emerald-100 text-[15px] font-medium whitespace-nowrap shrink-0"
          title="PDF EDU STUDIO đang chạy như ứng dụng độc lập đã cài đặt trên thiết bị."
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
          <span>Đang sử dụng ứng dụng đã cài</span>
        </div>
      );
    }

    const label = getPrimaryLabel();
    const isDirectInstall = pwa.installStatus === 'can-install';
    const isBusy = pwa.installStatus === 'prompting';

    return (
      <button
        type="button"
        disabled={isBusy}
        onClick={handleActionClick}
        aria-expanded={!isDirectInstall ? pwa.installGuideOpen : undefined}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-[15px] whitespace-nowrap shrink-0 transition-colors cursor-pointer disabled:opacity-75 ${
          isDirectInstall
            ? 'bg-[#087F70] hover:bg-[#099180] text-white border border-teal-400/35'
            : pwa.installGuideOpen
              ? 'bg-white text-[#164E63] border border-white'
              : 'bg-[#087F70] hover:bg-[#099180] text-white border border-teal-400/35'
        }`}
      >
        {isBusy ? (
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
        ) : isDirectInstall ? (
          <Download className="w-4 h-4 shrink-0" />
        ) : (
          <Laptop className="w-4 h-4 shrink-0" />
        )}
        <span>{label}</span>
      </button>
    );
  }

  // =========================================================================
  // Shared Guide Content (rendered inline in App or inside SettingsModal)
  // =========================================================================
  const renderBrowserInstructions = () => {
    const { env } = pwa;

    // Case A: Already installed / standalone
    if (pwa.installStatus === 'installed-standalone') {
      return (
        <div className="flex items-start gap-2.5 text-[15px] text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl p-3.5">
          <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold">Đang sử dụng ứng dụng đã cài</div>
            <p className="mt-1 text-slate-700 leading-relaxed">
              PDF EDU STUDIO đang hoạt động ở chế độ ứng dụng độc lập (standalone). Thầy/cô có thể mở trực tiếp từ Dock, Launchpad hoặc màn hình Desktop.
            </p>
          </div>
        </div>
      );
    }

    // Case B: Safari on macOS
    if (env.isSafariMacOS) {
      if (!env.safariSupportsAddToDock) {
        return (
          <div className="space-y-3 text-[15px] text-slate-800 leading-relaxed">
            <div className="flex items-start gap-2.5 rounded-xl bg-amber-50 border border-amber-200 p-3.5 text-amber-950">
              <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold">
                  Phiên bản Safari hiện tại{env.safariVersion ? ` (Safari ${env.safariVersion})` : ''} chưa hỗ trợ Add to Dock
                </div>
                <p className="mt-1">
                  Tính năng cài đặt ứng dụng web lên Dock của Safari yêu cầu <strong>macOS Sonoma (14) và Safari 17 trở lên</strong>.
                </p>
              </div>
            </div>
            <p className="font-semibold text-[#164E63]">
              Đề xuất để cài PDF EDU STUDIO trên máy Mac này:
            </p>
            <ol className="list-decimal pl-5 space-y-1.5">
              <li>
                Mở địa chỉ <strong>PDF EDU STUDIO</strong> bằng trình duyệt <strong>Google Chrome</strong> hoặc <strong>Microsoft Edge</strong> trên macOS.
              </li>
              <li>
                Nhấn nút <strong>Cài PDF EDU STUDIO</strong> trên thanh tiêu đề hoặc chọn biểu tượng cài đặt ở góc phải thanh địa chỉ.
              </li>
              <li>
                Hoặc nâng cấp macOS lên phiên bản có Safari 17+ để dùng tính năng <strong>File → Add to Dock</strong>.
              </li>
            </ol>
          </div>
        );
      }

      return (
        <div className="space-y-3 text-[15px] text-slate-800 leading-relaxed">
          <div className="flex items-center gap-2 font-bold text-[#164E63] text-[16px]">
            <Compass className="w-5 h-5 text-[#087F70] shrink-0" />
            <span>Hướng dẫn cài PDF EDU STUDIO trên máy Mac (Safari)</span>
          </div>
          <ol className="list-decimal pl-5 space-y-1.5">
            <li>Mở <strong>PDF EDU STUDIO</strong> bằng <strong>Safari</strong>.</li>
            <li>Trên thanh menu ở góc trên màn hình Mac, chọn <strong>File</strong> (hoặc <em>Tệp</em>).</li>
            <li>Chọn <strong>Add to Dock</strong> (hoặc <em>Thêm vào Dock</em>).</li>
            <li>Xác nhận tên ứng dụng (<strong>PDF EDU STUDIO</strong> / <strong>PDF Edu</strong>) rồi nhấn <strong>Add</strong>.</li>
            <li>Mở ứng dụng trực tiếp từ <strong>Dock</strong> hoặc <strong>Launchpad</strong>.</li>
          </ol>
          <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-[15px] text-slate-700">
            <strong>Lưu ý:</strong> Nếu trên thanh menu File không có mục <em>Add to Dock</em> (do phiên bản macOS/Safari cũ hơn bản 17), thầy/cô hãy mở <strong>PDF EDU STUDIO</strong> bằng <strong>Google Chrome</strong> hoặc <strong>Microsoft Edge</strong> để cài đặt.
          </div>
        </div>
      );
    }

    // Case C: Safari on iPhone / iPad
    if (env.isIOS) {
      return (
        <div className="space-y-2.5 text-[15px] text-slate-800 leading-relaxed">
          <div className="flex items-center gap-2 font-bold text-[#164E63] text-[16px]">
            <Smartphone className="w-5 h-5 text-[#087F70] shrink-0" />
            <span>Hướng dẫn cài PDF EDU STUDIO trên iPhone / iPad (Safari)</span>
          </div>
          <ol className="list-decimal pl-5 space-y-1.5">
            <li>Nhấn biểu tượng <strong>Chia sẻ (Share)</strong> trên thanh công cụ Safari.</li>
            <li>Cuộn xuống và chọn <strong>Thêm vào Màn hình chính (Add to Home Screen)</strong>.</li>
            <li>Xác nhận tên <strong>PDF Edu</strong> và nhấn <strong>Thêm (Add)</strong>.</li>
          </ol>
        </div>
      );
    }

    // Case D: Chrome / Edge (macOS or Windows/Linux)
    if (env.browserFamily === 'chrome' || env.browserFamily === 'edge') {
      const isEdge = env.browserFamily === 'edge';
      return (
        <div className="space-y-3 text-[15px] text-slate-800 leading-relaxed">
          <div className="flex items-center gap-2 font-bold text-[#164E63] text-[16px]">
            <Laptop className="w-5 h-5 text-[#087F70] shrink-0" />
            <span>
              Cách cài PDF EDU STUDIO trên {isEdge ? 'Microsoft Edge' : 'Google Chrome'}
              {env.isMacOS ? ' (macOS)' : ''}
            </span>
          </div>

          {pwa.promptAcceptedPending && (
            <div className="rounded-lg bg-teal-50 border border-teal-200 p-3 text-[#164E63] font-medium">
              Thầy/cô vừa chấp nhận hộp thoại cài đặt. Trạng thái sẽ tự cập nhật ngay khi trình duyệt hoàn tất cài ứng dụng.
            </div>
          )}

          {pwa.installStatus === 'can-install' ? (
            <div className="space-y-2">
              <p>
                Trình duyệt đã sẵn sàng cài đặt trực tiếp. Nhấn nút bên dưới để mở hộp thoại xác nhận của trình duyệt:
              </p>
              <button
                type="button"
                onClick={handleActionClick}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#087F70] hover:bg-[#06695d] text-white font-semibold text-[15px] cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Cài PDF EDU STUDIO</span>
              </button>
            </div>
          ) : isEdge ? (
            <ol className="list-decimal pl-5 space-y-1.5">
              <li>Nhìn sang góc phải thanh địa chỉ Microsoft Edge và nhấn biểu tượng <strong>Ứng dụng khả dụng / Cài đặt PDF EDU STUDIO</strong>.</li>
              <li>Hoặc mở menu <strong>⋯</strong> ở góc trên bên phải → chọn <strong>Ứng dụng (Apps)</strong> → <strong>Cài đặt trang web này dưới dạng ứng dụng</strong>.</li>
              <li>Xác nhận <strong>Cài đặt (Install)</strong> để đưa biểu tượng ứng dụng ra {env.isMacOS ? 'Dock / Launchpad' : 'màn hình Desktop'}.</li>
            </ol>
          ) : (
            <ol className="list-decimal pl-5 space-y-1.5">
              <li>Nhìn sang góc phải thanh địa chỉ Google Chrome và nhấn biểu tượng <strong>Cài đặt PDF EDU STUDIO</strong> (hình màn hình có mũi tên tải xuống).</li>
              <li>Hoặc mở menu <strong>⋮</strong> ở góc trên bên phải → chọn <strong>Truyền, lưu và chia sẻ (Cast, save, and share)</strong> → <strong>Cài đặt trang dưới dạng ứng dụng (Install page as app)</strong>.</li>
              <li>Xác nhận <strong>Cài đặt (Install)</strong> để mở ứng dụng từ {env.isMacOS ? 'Dock / Launchpad (Chrome Apps)' : 'Desktop / Start Menu'}.</li>
            </ol>
          )}

          <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-[15px] text-slate-700">
            <strong>Lưu ý:</strong> Nếu nút cài đặt tự động không xuất hiện (ví dụ đang mở cửa sổ ẩn danh hoặc ứng dụng đã được cài trước đó), hãy kiểm tra biểu tượng <em>Mở trong ứng dụng</em> ở góc phải thanh địa chỉ.
          </div>
        </div>
      );
    }

    // Case E: Unsupported browser (e.g. Firefox desktop or legacy browser)
    return (
      <div className="space-y-3 text-[15px] text-slate-800 leading-relaxed">
        <div className="flex items-start gap-2.5 rounded-xl bg-amber-50 border border-amber-200 p-3.5 text-amber-950">
          <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold">Trình duyệt hiện tại chưa hỗ trợ cài đặt ứng dụng web (PWA) trực tiếp</div>
            <p className="mt-1">
              Để cài đặt PDF EDU STUDIO làm ứng dụng độc lập lên {env.isMacOS ? 'máy Mac (Dock / Launchpad)' : 'máy tính'}, thầy/cô nên mở ứng dụng bằng:
            </p>
          </div>
        </div>
        <ul className="list-disc pl-5 space-y-1.5">
          {env.isMacOS && (
            <li>
              <strong>Safari (macOS Sonoma 14 / Safari 17 trở lên):</strong> chọn menu <strong>File → Add to Dock</strong>.
            </li>
          )}
          <li>
            <strong>Google Chrome</strong> hoặc <strong>Microsoft Edge:</strong> dùng nút <strong>Cài PDF EDU STUDIO</strong> hoặc menu cài đặt của trình duyệt.
          </li>
        </ul>
      </div>
    );
  };

  // =========================================================================
  // 2. INLINE WORKSPACE GUIDE PANEL (non-blocking, opens below HeaderBar)
  // =========================================================================
  if (variant === 'inline-guide-panel') {
    if (!pwa.installGuideOpen) return null;

    return (
      <section
        aria-label="Hướng dẫn cài đặt ứng dụng PDF EDU STUDIO"
        className="no-print bg-white border-b-2 border-[#087F70] shadow-md shrink-0"
      >
        <div className="max-w-5xl mx-auto px-5 py-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">{renderBrowserInstructions()}</div>
            <button
              type="button"
              onClick={() => pwa.setInstallGuideOpen(false)}
              className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 shrink-0 cursor-pointer"
              title="Đóng hướng dẫn cài đặt"
              aria-label="Đóng hướng dẫn cài đặt"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-slate-200 text-[15px]">
            <span className="text-slate-600">
              Hoạt động offline sau lần tải đầu (trên bản phát hành HTTPS): mở/chỉnh sửa/chấm bài PDF cục bộ, công thức MathLive, thư viện hình vẽ và 8 môn học THPT mẫu.
            </span>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  pwa.setInstallGuideOpen(false);
                  if (onNavigateToGuide) {
                    onNavigateToGuide();
                  } else {
                    openGuide('security-offline', 'cai-dat-offline');
                  }
                }}
                className="text-[15px] font-semibold text-[#087F70] hover:underline cursor-pointer"
              >
                Xem mục Hướng dẫn chi tiết →
              </button>
              <button
                type="button"
                onClick={() => pwa.setInstallGuideOpen(false)}
                className="px-4 py-1.5 rounded-lg bg-[#164E63] hover:bg-[#0f3a4a] text-white font-semibold text-[15px] cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // =========================================================================
  // 3. SETTINGS MODAL CARD (clearly separated from JSON Backup!)
  // =========================================================================
  return (
    <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3 text-[15px]">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 font-bold text-[#164E63] text-[16px]">
          <Laptop className="w-5 h-5 text-[#087F70]" />
          <span>Cài đặt ứng dụng lên máy tính / Mac (PWA)</span>
        </div>
        {pwa.installStatus !== 'installed-standalone' && (
          <button
            type="button"
            disabled={pwa.installStatus === 'prompting'}
            onClick={handleActionClick}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#087F70] hover:bg-[#06695d] text-white font-semibold text-[15px] cursor-pointer disabled:opacity-75"
          >
            {pwa.installStatus === 'prompting' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : pwa.installStatus === 'can-install' ? (
              <Download className="w-4 h-4" />
            ) : (
              <Laptop className="w-4 h-4" />
            )}
            <span>{getPrimaryLabel()}</span>
          </button>
        )}
      </div>

      {renderBrowserInstructions()}
    </div>
  );
};
