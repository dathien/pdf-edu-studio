import React from 'react';
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Home,
  RefreshCw,
  RotateCcw,
} from 'lucide-react';

interface FeatureErrorBoundaryProps {
  featureName?: string;
  errorMessage?: string;
  compact?: boolean;
  onGoHome?: () => void;
  onRetry?: () => void;
  children: React.ReactNode | ((retryNonce: number) => React.ReactNode);
}

interface FeatureErrorBoundaryState {
  hasError: boolean;
  resetKey: number;
  retryCount: number;
  showDetails: boolean;
  copied: boolean;
  safeSummary: string;
  isAssetMismatch: boolean;
}

const MAX_RETRIES = 3;

function sanitizeErrorSummary(error: Error | null, featureName?: string): {
  summary: string;
  isAssetMismatch: boolean;
} {
  const rawMsg = error?.message || 'Lỗi không xác định khi tải mô-đun';
  // Strip any URLs or file paths so we never expose internals in the UI
  const cleanedMsg = rawMsg
    .replace(/https?:\/\/[^\s)]+/gi, '[tài nguyên ứng dụng]')
    .replace(/\/[a-zA-Z0-9._/-]+\.(m?js|tsx?|css)/g, '[mô-đun]');

  const isAssetMismatch =
    /failed to fetch dynamically imported module|loading chunk|importing a module script failed/i.test(
      rawMsg
    );

  const lines = [
    `Ứng dụng: PDF EDU STUDIO`,
    `Phân hệ: ${featureName || 'Chức năng hệ thống'}`,
    `Loại lỗi: ${error?.name || 'Error'}`,
    `Mô tả tóm tắt: ${cleanedMsg.slice(0, 260)}`,
    `Thời điểm: ${new Date().toLocaleString('vi-VN')}`,
    `Trạng thái mạng: ${typeof navigator !== 'undefined' && navigator.onLine ? 'Trực tuyến' : 'Ngoại tuyến'}`,
  ];

  return { summary: lines.join('\n'), isAssetMismatch };
}

/**
 * Isolated React Error Boundary preventing any subsystem failure (PDF Viewer,
 * MathLive, Diagram Library, Dynamic Geometry, OCR, Grading, or Root UI)
 * from causing a blank white screen.
 *
 * Features:
 * - Real retry with retry cap (prevents infinite loops)
 * - Friendly short Vietnamese message (never dumps raw stack trace)
 * - 4 actions: Thử lại, Quay về trang chủ, Xem chi tiết lỗi (collapsed), Sao chép thông tin lỗi
 * - Safe reload suggestion if build chunk assets changed
 */
export class FeatureErrorBoundary extends React.Component<
  FeatureErrorBoundaryProps,
  FeatureErrorBoundaryState
> {
  constructor(props: FeatureErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      resetKey: 0,
      retryCount: 0,
      showDetails: false,
      copied: false,
      safeSummary: '',
      isAssetMismatch: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<FeatureErrorBoundaryState> {
    const { summary, isAssetMismatch } = sanitizeErrorSummary(error);
    return {
      hasError: true,
      safeSummary: summary,
      isAssetMismatch,
    };
  }

  componentDidCatch(error: Error): void {
    const { summary, isAssetMismatch } = sanitizeErrorSummary(error, this.props.featureName);
    this.setState({ safeSummary: summary, isAssetMismatch });
  }

  private handleRetry = () => {
    this.setState((prev) => ({
      hasError: false,
      resetKey: prev.resetKey + 1,
      retryCount: prev.retryCount + 1,
      showDetails: false,
    }));
    this.props.onRetry?.();
  };

  private handleSafeReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  private handleGoHome = () => {
    this.setState((prev) => ({
      hasError: false,
      resetKey: prev.resetKey + 1,
      retryCount: 0,
      showDetails: false,
    }));
    if (this.props.onGoHome) {
      this.props.onGoHome();
    } else if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  private handleCopyDetails = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(this.state.safeSummary);
        this.setState({ copied: true });
        setTimeout(() => this.setState({ copied: false }), 2400);
      }
    } catch {
      // Clipboard unavailable
    }
  };

  render() {
    if (this.state.hasError) {
      const { featureName, errorMessage, compact } = this.props;
      const { retryCount, showDetails, copied, safeSummary, isAssetMismatch } = this.state;
      const exhaustedRetries = retryCount >= MAX_RETRIES;

      return (
        <div
          className={`flex-1 flex items-center justify-center bg-[#F4F8F7] text-[#1F2937] ${
            compact ? 'p-3.5' : 'p-6 min-h-[260px]'
          }`}
          role="alert"
        >
          <div
            className={`bg-white rounded-2xl border border-slate-200 shadow-sm text-center w-full ${
              compact ? 'p-4 max-w-sm' : 'p-6 max-w-lg'
            }`}
          >
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>

            {featureName && (
              <div className="text-[13.5px] font-semibold text-[#087F70] mb-1">
                {featureName}
              </div>
            )}

            <p className="text-[16px] font-semibold text-slate-900 leading-snug">
              {errorMessage || 'Không thể tải chức năng này. Vui lòng thử lại.'}
            </p>

            {(isAssetMismatch || exhaustedRetries) && (
              <p className="mt-2 text-[14px] text-slate-600 leading-relaxed">
                {isAssetMismatch
                  ? 'Ứng dụng vừa được cập nhật phiên bản mới. Thầy/cô vui lòng tải lại trang để đồng bộ tài nguyên.'
                  : 'Đã thử tải lại nhiều lần nhưng vẫn gặp sự cố. Thầy/cô có thể tải lại trang (bản nháp cục bộ vẫn được giữ an toàn).'}
              </p>
            )}

            {/* Primary & Secondary Action Buttons */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              {!exhaustedRetries ? (
                <button
                  type="button"
                  onClick={this.handleRetry}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#087F70] hover:bg-[#06695d] text-white font-semibold text-[14.5px] cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Thử lại</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={this.handleSafeReload}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#087F70] hover:bg-[#06695d] text-white font-semibold text-[14.5px] cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Tải lại trang an toàn</span>
                </button>
              )}

              <button
                type="button"
                onClick={this.handleGoHome}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-[14.5px] cursor-pointer"
              >
                <Home className="w-4 h-4 text-[#164E63]" />
                <span>Quay về trang chủ</span>
              </button>
            </div>

            {/* Diagnostic Toggle & Safe Copy (Collapsed by default) */}
            <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-center gap-3 text-[13.5px]">
              <button
                type="button"
                onClick={() => this.setState((s) => ({ showDetails: !s.showDetails }))}
                className="inline-flex items-center gap-1 text-slate-600 hover:text-[#164E63] font-medium cursor-pointer"
              >
                {showDetails ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
                <span>Xem chi tiết lỗi</span>
              </button>

              <button
                type="button"
                onClick={this.handleCopyDetails}
                className="inline-flex items-center gap-1 text-[#087F70] hover:text-[#06695d] font-medium cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Đã sao chép thông tin' : 'Sao chép thông tin lỗi'}</span>
              </button>
            </div>

            {showDetails && (
              <div className="mt-3 text-left bg-slate-50 border border-slate-200 rounded-xl p-3 text-[12.5px] text-slate-700 font-mono whitespace-pre-wrap break-words">
                {safeSummary}
                <div className="mt-2 pt-2 border-t border-slate-200 font-sans text-[12px] text-slate-500">
                  Thông tin chẩn đoán trên không chứa nội dung tài liệu hay dữ liệu học sinh.
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    const content =
      typeof this.props.children === 'function'
        ? this.props.children(this.state.resetKey)
        : this.props.children;

    return <React.Fragment key={this.state.resetKey}>{content}</React.Fragment>;
  }
}
