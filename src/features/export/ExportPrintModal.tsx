import React, { useState } from 'react';
import JSZip from 'jszip';
import {
  FileArchive,
  FileDown,
  FileImage,
  Printer,
  ShieldCheck,
  X,
} from 'lucide-react';
import {
  exportDocumentToPdf,
  exportPagesToImages,
  saveProjectBundle,
  triggerDownload,
} from '../../engines/pdf/pdfEngine';
import { useStudioStore } from '../../stores/useStudioStore';

interface ExportPrintModalProps {
  initialMode: 'export' | 'print';
  onClose: () => void;
}

export const ExportPrintModal: React.FC<ExportPrintModalProps> = ({ initialMode, onClose }) => {
  const documents = useStudioStore((s) => s.documents);
  const activeDocId = useStudioStore((s) => s.activeDocId);
  const markDocSaved = useStudioStore((s) => s.markDocSaved);
  const setBusy = useStudioStore((s) => s.setBusy);
  const notify = useStudioStore((s) => s.notify);

  const doc = documents.find((d) => d.id === activeDocId) || null;
  const [tab, setTab] = useState<'pdf' | 'project' | 'images' | 'print'>(
    initialMode === 'print' ? 'print' : 'pdf'
  );
  const [includeAnnotations, setIncludeAnnotations] = useState(true);
  const [applyRedactions, setApplyRedactions] = useState(true);
  const [sanitizeMetadata, setSanitizeMetadata] = useState(false);

  const [imgFormat, setImgFormat] = useState<'png' | 'jpeg'>('png');
  const [imgDpiScale, setImgDpiScale] = useState<number>(2);
  const [imgScope, setImgScope] = useState<'all' | 'current'>('all');

  if (!doc) return null;

  const baseName = doc.fileName.replace(/\.pdf$/i, '');

  const handleExportPdf = async () => {
    setBusy('Đang xuất tệp PDF mới (giữ nguyên tệp gốc)...');
    try {
      const res = await exportDocumentToPdf(doc, {
        includeAnnotations,
        applyRedactions,
        sanitizeMetadata,
      });
      const outName = `${baseName}_PDF_EDU_STUDIO.pdf`;
      triggerDownload(new Blob([new Uint8Array(res.bytes)], { type: 'application/pdf' }), outName);
      markDocSaved(doc.id);
      notify(`Đã xuất thành công "${outName}"`, 'success');
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Lỗi xuất PDF';
      notify(`Không thể xuất PDF: ${msg}`, 'error');
    } finally {
      setBusy(null);
    }
  };

  const handleSaveProject = async () => {
    setBusy('Đang đóng gói dự án .pdfedu...');
    try {
      const blob = await saveProjectBundle(doc);
      triggerDownload(blob, `${baseName}.pdfedu`);
      markDocSaved(doc.id);
      notify('Đã lưu dự án .pdfedu (có thể mở lại để chỉnh sửa mọi đối tượng)', 'success');
      onClose();
    } finally {
      setBusy(null);
    }
  };

  const handleExportImages = async () => {
    setBusy('Đang kết xuất các trang PDF ra hình ảnh...');
    try {
      const pdfRes = await exportDocumentToPdf(doc, {
        includeAnnotations,
        applyRedactions,
        sanitizeMetadata: false,
      });
      const indices =
        imgScope === 'current'
          ? [doc.currentPageIndex]
          : doc.pages.map((_, idx) => idx);
      const imgs = await exportPagesToImages(pdfRes.bytes, indices, imgFormat, imgDpiScale);
      if (imgs.length === 1) {
        triggerDownload(imgs[0].blob, `${baseName}_${imgs[0].name}`);
      } else {
        const zip = new JSZip();
        imgs.forEach((im) => zip.file(im.name, im.blob));
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        triggerDownload(zipBlob, `${baseName}_hinh_anh.zip`);
      }
      notify(`Đã xuất ${imgs.length} trang ra ảnh ${imgFormat.toUpperCase()}.`, 'success');
      onClose();
    } finally {
      setBusy(null);
    }
  };

  const handlePrint = () => {
    onClose();
    window.setTimeout(() => {
      window.print();
    }, 180);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200">
        <div className="bg-[#164E63] text-white px-5 py-3.5 flex items-center justify-between">
          <h2 className="text-[19px] font-bold">Xuất tài liệu & In ấn</h2>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/15 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex border-b border-slate-200 bg-[#FAFCFB] px-3 pt-2 gap-1 overflow-x-auto">
          {(
            [
              ['pdf', 'Xuất PDF chuẩn', <FileDown className="w-4 h-4" />],
              ['project', 'Dự án (.pdfedu)', <FileArchive className="w-4 h-4" />],
              ['images', 'Xuất ảnh PNG/JPG', <FileImage className="w-4 h-4" />],
              ['print', 'In sạch', <Printer className="w-4 h-4" />],
            ] as const
          ).map(([id, label, icon]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-t-lg text-[14px] font-semibold border-b-2 whitespace-nowrap cursor-pointer ${
                tab === id
                  ? 'border-[#087F70] text-[#087F70] bg-white'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              {icon}
              <span>{label}</span>
            </button>
          ))}
        </div>

        <div className="p-5 space-y-4 text-[14.5px] text-slate-800">
          {tab === 'pdf' && (
            <>
              <p className="text-slate-600">
                Xuất thành tệp PDF chuẩn mở được trên mọi máy tính, điện thoại và máy in. Tệp PDF gốc của thầy/cô luôn được bảo toàn nguyên vẹn.
              </p>
              <div className="space-y-2.5 p-4 rounded-xl bg-[#F4F8F7] border border-teal-200/70">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input type="checkbox" checked={includeAnnotations} onChange={(e) => setIncludeAnnotations(e.target.checked)} className="accent-[#087F70] w-4 h-4" />
                  <span>Bao gồm toàn bộ chữ, công thức vector, hình vẽ, dấu chấm và điểm số</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input type="checkbox" checked={applyRedactions} onChange={(e) => setApplyRedactions(e.target.checked)} className="accent-[#DC2626] w-4 h-4" />
                  <span>Áp dụng xóa vĩnh viễn các vùng đã khoanh bảo mật (Redaction)</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input type="checkbox" checked={sanitizeMetadata} onChange={(e) => setSanitizeMetadata(e.target.checked)} className="accent-[#087F70] w-4 h-4" />
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#087F70]" />
                    Xóa thông tin tác giả & Metadata nội bộ khỏi tệp xuất ra
                  </span>
                </label>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleExportPdf}
                  className="px-5 py-2.5 rounded-lg bg-[#087F70] hover:bg-[#06695d] text-white font-semibold cursor-pointer"
                >
                  Xuất & Tải tệp PDF mới
                </button>
              </div>
            </>
          )}

          {tab === 'project' && (
            <>
              <p className="text-slate-600 leading-relaxed">
                Định dạng dự án <strong>.pdfedu</strong> lưu trọn vẹn tệp PDF gốc cùng toàn bộ lớp đối tượng có thể chỉnh sửa lại (công thức MathLive, hình vector, bảng điểm chấm bài, dấu chấm). Thích hợp khi thầy/cô muốn lưu để hôm sau mở lên sửa tiếp hoặc chuyển sang máy tính khác.
              </p>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveProject}
                  className="px-5 py-2.5 rounded-lg bg-[#164E63] hover:bg-[#087F70] text-white font-semibold cursor-pointer"
                >
                  Lưu dự án {baseName}.pdfedu
                </button>
              </div>
            </>
          )}

          {tab === 'images' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className="space-y-1">
                  <span className="text-[13px] text-slate-600">Định dạng ảnh</span>
                  <select value={imgFormat} onChange={(e) => setImgFormat(e.target.value as 'png' | 'jpeg')} className="w-full rounded border border-slate-300 px-2.5 py-1.5">
                    <option value="png">PNG (Sắc nét, chữ rõ)</option>
                    <option value="jpeg">JPEG (Dung lượng nhẹ)</option>
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="text-[13px] text-slate-600">Độ phân giải</span>
                  <select value={imgDpiScale} onChange={(e) => setImgDpiScale(Number(e.target.value))} className="w-full rounded border border-slate-300 px-2.5 py-1.5">
                    <option value={1.5}>Tiêu chuẩn (~110 DPI)</option>
                    <option value={2}>Sắc nét (~150 DPI)</option>
                    <option value={3}>In ấn cao (~220 DPI)</option>
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="text-[13px] text-slate-600">Phạm vi</span>
                  <select value={imgScope} onChange={(e) => setImgScope(e.target.value as 'all' | 'current')} className="w-full rounded border border-slate-300 px-2.5 py-1.5">
                    <option value="all">Tất cả ({doc.pages.length} trang)</option>
                    <option value="current">Chỉ trang hiện tại</option>
                  </select>
                </label>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleExportImages}
                  className="px-5 py-2.5 rounded-lg bg-[#087F70] hover:bg-[#06695d] text-white font-semibold cursor-pointer"
                >
                  Xuất hình ảnh & Tải xuống
                </button>
              </div>
            </>
          )}

          {tab === 'print' && (
            <>
              <div className="p-4 rounded-xl bg-[#F4F8F7] border border-teal-200/70 space-y-2 text-[14px]">
                <div className="font-bold text-[#164E63]">Chế độ In sạch (Clean Print)</div>
                <p className="text-slate-700 leading-relaxed">
                  Khi nhấn In, hệ thống sẽ tự động ẩn toàn bộ thanh công cụ, khung chấm bài, danh sách trang và đường viền chọn — chỉ giữ lại nội dung trang tài liệu PDF kèm chữ, công thức, hình vẽ và dấu chấm điểm.
                </p>
                <p className="text-slate-600 text-[13.5px]">
                  Mẹo: Trong hộp thoại in của trình duyệt, chọn khổ giấy <strong>A4</strong> và bật <strong>Đồ họa nền (Background graphics)</strong> để in đủ màu dấu chấm và tô sáng.
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleExportPdf}
                  className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 font-semibold cursor-pointer"
                >
                  Hoặc tải PDF để in sau
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-[#087F70] hover:bg-[#06695d] text-white font-semibold cursor-pointer"
                >
                  <Printer className="w-4 h-4" /> Mở hộp thoại In ngay
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
