import React, { useState } from 'react';
import {
  CheckCircle2,
  Database,
  Download,
  ShieldCheck,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import { triggerDownload } from '../../engines/pdf/pdfEngine';
import { useStudioStore } from '../../stores/useStudioStore';
import type { OfflineReadiness } from '../../hooks/usePWAInstall';

interface SettingsModalProps {
  offlineStatus: OfflineReadiness;
  offlineDetail?: string;
  onPrefetchOffline?: () => Promise<boolean>;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  offlineStatus,
  offlineDetail,
  onPrefetchOffline,
  onClose,
}) => {
  const recentDocs = useStudioStore((s) => s.recentDocs);
  const savedSignatures = useStudioStore((s) => s.savedSignatures);
  const customShapes = useStudioStore((s) => s.customShapes);
  const commentTemplates = useStudioStore((s) => s.commentTemplates);
  const gradedPapers = useStudioStore((s) => s.gradedPapers);
  const clearPersonalData = useStudioStore((s) => s.clearPersonalData);
  const initLocalLibraries = useStudioStore((s) => s.initLocalLibraries);
  const notify = useStudioStore((s) => s.notify);

  const [confirmClear, setConfirmClear] = useState(false);

  const handleBackupJson = () => {
    const payload = {
      app: 'PDF EDU STUDIO',
      exportedAt: new Date().toISOString(),
      savedSignatures,
      customShapes,
      commentTemplates,
      gradedPapers,
    };
    triggerDownload(
      new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }),
      `PDF_EDU_STUDIO_Sao_luu_${new Date().toISOString().slice(0, 10)}.json`
    );
    notify('Đã xuất tệp sao lưu thư viện cá nhân & sổ điểm (.json)', 'success');
  };

  const handleRestoreJson = async (files: FileList | null) => {
    const f = files?.[0];
    if (!f) return;
    try {
      const data = JSON.parse(await f.text());
      if (Array.isArray(data.savedSignatures)) {
        for (const s of data.savedSignatures) await storageService.saveSignature(s);
      }
      if (Array.isArray(data.customShapes)) {
        for (const cs of data.customShapes) await storageService.saveCustomShape(cs);
      }
      if (Array.isArray(data.commentTemplates)) {
        for (const c of data.commentTemplates) await storageService.saveComment(c);
      }
      if (Array.isArray(data.gradedPapers)) {
        for (const g of data.gradedPapers) await storageService.saveGradedPaper(g);
      }
      await initLocalLibraries();
      notify('Đã khôi phục thành công dữ liệu cá nhân từ tệp sao lưu!', 'success');
    } catch {
      notify('Tệp sao lưu JSON không hợp lệ.', 'error');
    }
  };

  const offlineLabel =
    offlineStatus === 'ready'
      ? 'Sẵn sàng offline (đã xác nhận đủ tệp lõi, PDF Worker và font tiếng Việt)'
      : offlineStatus === 'update-available'
        ? 'Có phiên bản mới sẵn sàng cập nhật'
        : offlineStatus === 'needs-assets'
          ? 'Cần tải bổ sung tài nguyên ngoại tuyến'
          : offlineStatus === 'preparing'
            ? 'Đang chuẩn bị offline...'
            : 'Chưa thể xác nhận offline';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200">
        <div className="bg-[#164E63] text-white px-5 py-3.5 flex items-center justify-between">
          <h2 className="text-[19px] font-bold">Cài đặt & Quản lý Dữ liệu Cục bộ</h2>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/15 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5 text-[15px] text-slate-800 max-h-[80vh] overflow-y-auto">
          {/* Privacy & Offline status */}
          <div className="p-4 rounded-xl bg-[#F4F8F7] border border-teal-200/80 space-y-2">
            <div className="flex items-center gap-2 font-bold text-[#164E63]">
              <ShieldCheck className="w-5 h-5 text-[#087F70]" />
              <span>Quyền riêng tư & Chế độ Ngoại tuyến</span>
            </div>
            <p className="text-slate-700 leading-relaxed text-[14.5px]">
              PDF EDU STUDIO xử lý toàn bộ tài liệu PDF, công thức, hình vẽ, OCR và bảng điểm học sinh ngay trên thiết bị của thầy/cô. Không yêu cầu đăng nhập, không cần API key và không tải nội dung đề thi lên máy chủ ngoài.
            </p>
            <div className="pt-1 space-y-1.5">
              <div
                className={`flex items-center gap-2 text-[14.5px] font-semibold ${
                  offlineStatus === 'ready'
                    ? 'text-emerald-700'
                    : offlineStatus === 'needs-assets'
                      ? 'text-amber-700'
                      : 'text-[#164E63]'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Trạng thái offline: {offlineLabel}</span>
              </div>
              {offlineDetail && (
                <p className="text-[13.5px] text-slate-600 leading-relaxed">{offlineDetail}</p>
              )}
              {offlineStatus === 'needs-assets' && onPrefetchOffline && (
                <button
                  type="button"
                  onClick={() => onPrefetchOffline()}
                  className="mt-1 px-3.5 py-1.5 rounded-lg bg-[#087F70] hover:bg-[#06695d] text-white text-[13.5px] font-semibold cursor-pointer"
                >
                  Tải bổ sung tài nguyên dùng offline ngay
                </button>
              )}
            </div>
          </div>

          {/* Local Storage Summary */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 font-bold text-[#164E63]">
              <Database className="w-5 h-5 text-[#087F70]" />
              <span>Dữ liệu đang lưu trên trình duyệt này (IndexedDB)</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                <div className="text-[20px] font-bold text-[#164E63] tabular-nums">{recentDocs.length}</div>
                <div className="text-[13px] text-slate-600">Tài liệu gần đây</div>
              </div>
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                <div className="text-[20px] font-bold text-[#164E63] tabular-nums">{gradedPapers.length}</div>
                <div className="text-[13px] text-slate-600">Bài trong sổ điểm</div>
              </div>
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                <div className="text-[20px] font-bold text-[#164E63] tabular-nums">{savedSignatures.length}</div>
                <div className="text-[13px] text-slate-600">Chữ ký hình ảnh</div>
              </div>
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                <div className="text-[20px] font-bold text-[#164E63] tabular-nums">{customShapes.length}</div>
                <div className="text-[13px] text-slate-600">Hình vẽ cá nhân</div>
              </div>
            </div>
            <p className="text-[13px] text-slate-500">
              Lưu ý: Dữ liệu cục bộ có thể bị xóa nếu người dùng xóa bộ nhớ trình duyệt (Clear site data). Thầy/cô nên xuất tệp sao lưu JSON định kỳ.
            </p>
          </div>

          {/* Backup & Restore */}
          <div className="flex flex-wrap gap-2.5 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={handleBackupJson}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#087F70] hover:bg-[#06695d] text-white font-semibold cursor-pointer"
            >
              <Download className="w-4 h-4" /> Sao lưu thư viện & Sổ điểm (.json)
            </button>
            <label className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 font-semibold cursor-pointer">
              <Upload className="w-4 h-4" /> Khôi phục từ tệp sao lưu
              <input type="file" accept=".json,application/json" className="hidden" onChange={(e) => handleRestoreJson(e.target.files)} />
            </label>
          </div>

          {/* Clear Personal Data */}
          <div className="pt-3 border-t border-slate-200">
            {!confirmClear ? (
              <button
                type="button"
                onClick={() => setConfirmClear(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-[#DC2626] font-semibold cursor-pointer"
              >
                <Trash2 className="w-4 h-4" /> Xóa toàn bộ dữ liệu cá nhân (Máy dùng chung)
              </button>
            ) : (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-300 space-y-2.5">
                <div className="font-bold text-[#DC2626]">
                  Xác nhận xóa toàn bộ bản nháp, chữ ký, hình cá nhân và sổ điểm trên máy tính này?
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      await clearPersonalData();
                      setConfirmClear(false);
                    }}
                    className="px-4 py-1.5 rounded-lg bg-[#DC2626] text-white font-semibold cursor-pointer"
                  >
                    Xóa ngay
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmClear(false)}
                    className="px-4 py-1.5 rounded-lg bg-white border border-slate-300 font-medium cursor-pointer"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-slate-100 text-center text-[13.5px] text-slate-500">
            Copyright © 2026 – Phát triển bởi Thầy Hồ Nguyễn Đa Thiện
          </div>
        </div>
      </div>
    </div>
  );
};
