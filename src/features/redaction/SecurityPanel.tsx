import React, { useState } from 'react';
import {
  CheckCircle2,
  Droplets,
  EyeOff,
  Hash,
  Lock,
  ShieldAlert,
  Trash2,
} from 'lucide-react';
import { exportDocumentToPdf, inspectPdfBytes, triggerDownload } from '../../engines/pdf/pdfEngine';
import { useStudioStore } from '../../stores/useStudioStore';
import type { StudioDocument, StudioObject } from '../../types/studio';

interface SecurityPanelProps {
  doc: StudioDocument;
}

export const SecurityPanel: React.FC<SecurityPanelProps> = ({ doc }) => {
  const setActiveTool = useStudioStore((s) => s.setActiveTool);
  const deleteObjects = useStudioStore((s) => s.deleteObjects);
  const updatePages = useStudioStore((s) => s.updatePages);
  const updateWatermark = useStudioStore((s) => s.updateWatermark);
  const updatePageNumbers = useStudioStore((s) => s.updatePageNumbers);
  const setDocConfidential = useStudioStore((s) => s.setDocConfidential);
  const setBusy = useStudioStore((s) => s.setBusy);
  const notify = useStudioStore((s) => s.notify);

  const [lastVerifiedClean, setLastVerifiedClean] = useState<boolean | null>(null);

  const redactions = doc.objects.filter(
    (o): o is Extract<StudioObject, { type: 'redaction' }> => o.type === 'redaction'
  );

  const handleApplyPermanentRedaction = async () => {
    if (redactions.length === 0) {
      notify('Chưa có vùng xóa vĩnh viễn nào được khoanh trên tài liệu.', 'warning');
      return;
    }
    setBusy('Đang dựng lại trang PDF và xóa triệt để dữ liệu dưới vùng che...');
    try {
      const result = await exportDocumentToPdf(doc, {
        applyRedactions: true,
        sanitizeMetadata: true,
        includeAnnotations: true,
      });
      const inspected = await inspectPdfBytes(result.bytes);
      updatePages(inspected.pages, result.bytes);
      // Clear applied redaction objects since they are now permanently burned into the rebuilt pages
      deleteObjects(redactions.map((r) => r.id));
      setLastVerifiedClean(result.redactionVerifiedClean);
      triggerDownload(
        new Blob([new Uint8Array(result.bytes)], { type: 'application/pdf' }),
        `${doc.fileName.replace(/\.pdf$/i, '')}_da_xoa_bao_mat.pdf`
      );
      notify(
        result.redactionVerifiedClean
          ? `Đã áp dụng xóa vĩnh viễn trên ${result.redactedPagesCount} trang và xác minh không còn chữ tìm kiếm được.`
          : `Đã áp dụng xóa vĩnh viễn trên ${result.redactedPagesCount} trang và tải xuống bản PDF mới.`,
        'success'
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Lỗi xử lý xóa bảo mật';
      notify(`Không thể áp dụng xóa vĩnh viễn: ${msg}`, 'error');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="p-4 space-y-5 text-[14px] text-slate-800">
      {/* 1. True Permanent Redaction */}
      <section className="space-y-2.5 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-2 font-bold text-[#DC2626] text-[15px]">
          <EyeOff className="w-5 h-5" />
          <span>Xóa vĩnh viễn nội dung (Redaction)</span>
        </div>
        <p className="text-[13.5px] text-slate-600 leading-relaxed">
          Khác với che hộp màu thông thường, chức năng này dựng lại hoàn toàn các trang có vùng khoanh ở dạng ảnh phẳng độ phân giải cao và xóa sạch lớp văn bản bên dưới để không thể sao chép hay tìm kiếm lại.
        </p>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTool('redact')}
            className="flex-1 py-2 rounded-lg border-2 border-[#DC2626] text-[#DC2626] hover:bg-red-50 font-semibold cursor-pointer"
          >
            + Khoanh vùng xóa
          </button>
          <button
            type="button"
            disabled={redactions.length === 0}
            onClick={handleApplyPermanentRedaction}
            className="flex-1 py-2 rounded-lg bg-[#DC2626] hover:bg-red-700 text-white font-semibold disabled:opacity-40 cursor-pointer"
          >
            Áp dụng xóa ({redactions.length})
          </button>
        </div>

        {lastVerifiedClean && (
          <div className="flex items-center gap-1.5 text-[13px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1.5">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Đã xác minh: Trang sau khi xóa không còn lớp văn bản ẩn.</span>
          </div>
        )}

        {redactions.length > 0 && (
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {redactions.map((r, i) => (
              <div
                key={r.id}
                className="flex items-center justify-between px-2.5 py-1.5 rounded bg-red-50/70 border border-red-200 text-[13px]"
              >
                <span>
                  Vùng xóa #{i + 1} ({r.width}×{r.height} pt)
                </span>
                <button
                  type="button"
                  onClick={() => deleteObjects([r.id])}
                  className="text-slate-500 hover:text-[#DC2626] cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 2. Confidential Exam Mode & Metadata */}
      <section className="space-y-2.5 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-2 font-bold text-[#164E63] text-[15px]">
          <ShieldAlert className="w-5 h-5 text-[#087F70]" />
          <span>Bảo mật đề thi & Metadata</span>
        </div>
        <label className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer">
          <input
            type="checkbox"
            checked={doc.isConfidential}
            onChange={(e) => setDocConfidential(e.target.checked)}
            className="mt-1 accent-[#087F70] w-4 h-4"
          />
          <div className="text-[13.5px]">
            <div className="font-semibold text-slate-900 flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-amber-600" />
              <span>Chế độ đề thi mật (không lưu nháp)</span>
            </div>
            <div className="text-slate-600 text-[12.5px]">
              Tạm dừng tự động lưu bản nháp vào IndexedDB trên máy tính dùng chung.
            </div>
          </div>
        </label>
        <p className="text-[12.5px] text-slate-500">
          Khi xuất PDF từ hộp thoại <strong>Xuất PDF</strong>, thầy/cô có thể bật tùy chọn <strong>Xóa thông tin tác giả & Metadata</strong>.
        </p>
      </section>

      {/* 3. Watermark */}
      <section className="space-y-2.5 pb-4 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-[#164E63] text-[15px]">
            <Droplets className="w-5 h-5 text-[#087F70]" />
            <span>Dấu chìm (Watermark)</span>
          </div>
          <input
            type="checkbox"
            checked={doc.watermark.enabled}
            onChange={(e) => updateWatermark({ enabled: e.target.checked })}
            className="accent-[#087F70] w-4 h-4 cursor-pointer"
          />
        </div>

        {doc.watermark.enabled && (
          <div className="space-y-2.5">
            <input
              type="text"
              value={doc.watermark.text}
              onChange={(e) => updateWatermark({ text: e.target.value })}
              placeholder="Nội dung dấu chìm (VD: ĐỀ THAM KHẢO)"
              className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-[13.5px]"
            />
            <div className="grid grid-cols-2 gap-2">
              <label className="space-y-0.5">
                <span className="text-[12.5px] text-slate-500">Cỡ chữ ({doc.watermark.fontSize})</span>
                <input
                  type="range"
                  min={16}
                  max={72}
                  value={doc.watermark.fontSize}
                  onChange={(e) => updateWatermark({ fontSize: Number(e.target.value) })}
                  className="w-full accent-[#087F70]"
                />
              </label>
              <label className="space-y-0.5">
                <span className="text-[12.5px] text-slate-500">Góc xoay ({doc.watermark.rotation}°)</span>
                <input
                  type="range"
                  min={-90}
                  max={90}
                  value={doc.watermark.rotation}
                  onChange={(e) => updateWatermark({ rotation: Number(e.target.value) })}
                  className="w-full accent-[#087F70]"
                />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-2 items-center">
              <label className="space-y-0.5">
                <span className="text-[12.5px] text-slate-500">Độ mờ ({Math.round(doc.watermark.opacity * 100)}%)</span>
                <input
                  type="range"
                  min={0.05}
                  max={0.5}
                  step={0.02}
                  value={doc.watermark.opacity}
                  onChange={(e) => updateWatermark({ opacity: Number(e.target.value) })}
                  className="w-full accent-[#087F70]"
                />
              </label>
              <div className="flex items-center justify-between">
                <span className="text-[12.5px] text-slate-500">Màu sắc</span>
                <input
                  type="color"
                  value={doc.watermark.color}
                  onChange={(e) => updateWatermark({ color: e.target.value })}
                  className="w-8 h-7 rounded border border-slate-300 cursor-pointer"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={doc.watermark.position}
                onChange={(e) =>
                  updateWatermark({
                    position: e.target.value as StudioDocument['watermark']['position'],
                  })
                }
                className="rounded border border-slate-300 px-2 py-1 text-[13px]"
              >
                <option value="center">Chính giữa</option>
                <option value="top-left">Góc trên trái</option>
                <option value="top-right">Góc trên phải</option>
                <option value="bottom-left">Góc dưới trái</option>
                <option value="bottom-right">Góc dưới phải</option>
              </select>
              <select
                value={doc.watermark.scope}
                onChange={(e) =>
                  updateWatermark({ scope: e.target.value as 'all' | 'current' })
                }
                className="rounded border border-slate-300 px-2 py-1 text-[13px]"
              >
                <option value="all">Toàn bộ trang</option>
                <option value="current">Chỉ trang hiện tại</option>
              </select>
            </div>
          </div>
        )}
      </section>

      {/* 4. Page Numbers */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-[#164E63] text-[15px]">
            <Hash className="w-5 h-5 text-[#087F70]" />
            <span>Đánh số trang tự động</span>
          </div>
          <input
            type="checkbox"
            checked={doc.pageNumbers.enabled}
            onChange={(e) => updatePageNumbers({ enabled: e.target.checked })}
            className="accent-[#087F70] w-4 h-4 cursor-pointer"
          />
        </div>

        {doc.pageNumbers.enabled && (
          <div className="grid grid-cols-2 gap-2">
            <select
              value={doc.pageNumbers.position}
              onChange={(e) =>
                updatePageNumbers({ position: e.target.value as 'header' | 'footer' })
              }
              className="rounded border border-slate-300 px-2 py-1.5 text-[13px]"
            >
              <option value="footer">Chân trang (Footer)</option>
              <option value="header">Đầu trang (Header)</option>
            </select>
            <select
              value={doc.pageNumbers.align}
              onChange={(e) =>
                updatePageNumbers({ align: e.target.value as 'left' | 'center' | 'right' })
              }
              className="rounded border border-slate-300 px-2 py-1.5 text-[13px]"
            >
              <option value="left">Căn trái</option>
              <option value="center">Căn giữa</option>
              <option value="right">Căn phải</option>
            </select>
            <select
              value={doc.pageNumbers.format}
              onChange={(e) =>
                updatePageNumbers({
                  format: e.target.value as 'number' | 'page-of-total' | 'vietnamese',
                })
              }
              className="rounded border border-slate-300 px-2 py-1.5 text-[13px]"
            >
              <option value="vietnamese">Trang 1 / N</option>
              <option value="page-of-total">1 / N</option>
              <option value="number">1, 2, 3...</option>
            </select>
            <label className="flex items-center gap-1.5 text-[13px]">
              <span className="text-slate-600">Bắt đầu:</span>
              <input
                type="number"
                min={1}
                value={doc.pageNumbers.startNumber}
                onChange={(e) =>
                  updatePageNumbers({ startNumber: Math.max(1, Number(e.target.value)) })
                }
                className="w-14 rounded border border-slate-300 px-1.5 py-1 text-center tabular-nums"
              />
            </label>
          </div>
        )}
      </section>
    </div>
  );
};
