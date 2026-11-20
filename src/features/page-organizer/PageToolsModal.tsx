import React, { useState } from 'react';
import JSZip from 'jszip';
import {
  ArrowDown,
  ArrowUp,
  Copy,
  Crop,
  FileArchive,
  FileImage,
  FilePlus2,
  HelpCircle,
  Merge,
  RotateCw,
  Scissors,
  Trash2,
  X,
} from 'lucide-react';
import {
  compressPdfReal,
  convertImagesToPdf,
  inspectPdfBytes,
  mergePdfFiles,
  splitPdfByGroups,
  triggerDownload,
} from '../../engines/pdf/pdfEngine';
import { useStudioStore } from '../../stores/useStudioStore';
import type { PageTransform } from '../../types/studio';

interface PageToolsModalProps {
  onClose: () => void;
}

type ToolTab = 'organize' | 'merge' | 'split' | 'crop' | 'compress' | 'images';

function formatKb(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export const PageToolsModal: React.FC<PageToolsModalProps> = ({ onClose }) => {
  const documents = useStudioStore((s) => s.documents);
  const activeDocId = useStudioStore((s) => s.activeDocId);
  const updatePages = useStudioStore((s) => s.updatePages);
  const openDocument = useStudioStore((s) => s.openDocument);
  const setBusy = useStudioStore((s) => s.setBusy);
  const notify = useStudioStore((s) => s.notify);
  const openGuide = useStudioStore((s) => s.openGuide);

  const activeDoc = documents.find((d) => d.id === activeDocId) || null;
  const [tab, setTab] = useState<ToolTab>(activeDoc ? 'organize' : 'merge');

  // Merge state
  const [mergeList, setMergeList] = useState<Array<{ name: string; bytes: Uint8Array; pages: number }>>([]);
  // Split state
  const [splitMode, setSplitMode] = useState<'single' | 'range' | 'oddeven'>('range');
  const [splitRangeText, setSplitRangeText] = useState('1-1');
  // Crop state
  const [cropTop, setCropTop] = useState(0);
  const [cropRight, setCropRight] = useState(0);
  const [cropBottom, setCropBottom] = useState(0);
  const [cropLeft, setCropLeft] = useState(0);
  const [cropScope, setCropScope] = useState<'current' | 'all'>('all');
  // Compress state
  const [compressLevel, setCompressLevel] = useState<'quality' | 'balanced' | 'compact'>('balanced');
  const [compressResult, setCompressResult] = useState<{
    bytes: Uint8Array;
    beforeSize: number;
    afterSize: number;
    reduced: boolean;
  } | null>(null);
  // Images to PDF state
  const [imgFiles, setImgFiles] = useState<Array<{ name: string; dataUrl: string }>>([]);
  const [paperSize, setPaperSize] = useState<'A4' | 'A5'>('A4');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [marginPt, setMarginPt] = useState(24);
  const [twoUp, setTwoUp] = useState(false);

  const movePage = (idx: number, dir: -1 | 1) => {
    if (!activeDoc) return;
    const target = idx + dir;
    if (target < 0 || target >= activeDoc.pages.length) return;
    const next = [...activeDoc.pages];
    [next[idx], next[target]] = [next[target], next[idx]];
    updatePages(next);
  };

  const addBlankPage = () => {
    if (!activeDoc) return;
    const blank: PageTransform = {
      id: `p-blank-${Date.now()}`,
      sourcePageIndex: -1,
      width: 595.28,
      height: 841.89,
      rotation: 0,
    };
    updatePages([...activeDoc.pages, blank]);
    notify('Đã thêm 1 trang trắng khổ A4 vào cuối tài liệu', 'success');
  };

  const handleAddMergeFiles = async (files: FileList | null) => {
    if (!files) return;
    const added: Array<{ name: string; bytes: Uint8Array; pages: number }> = [];
    for (const f of Array.from(files)) {
      const bytes = new Uint8Array(await f.arrayBuffer());
      const info = await inspectPdfBytes(bytes);
      added.push({ name: f.name, bytes, pages: info.pages.length });
    }
    setMergeList((prev) => [...prev, ...added]);
  };

  const handleRunMerge = async () => {
    if (mergeList.length < 2) {
      notify('Vui lòng chọn ít nhất 2 tệp PDF để ghép.', 'warning');
      return;
    }
    setBusy('Đang ghép các tệp PDF trên thiết bị...');
    try {
      const mergedBytes = await mergePdfFiles(mergeList.map((m) => ({ bytes: m.bytes })));
      const inspected = await inspectPdfBytes(mergedBytes);
      openDocument({
        title: `PDF ghép (${inspected.pages.length} trang)`,
        fileName: 'Tai_lieu_ghep.pdf',
        pdfBytes: mergedBytes,
        pages: inspected.pages,
      });
      notify(`Đã ghép thành công ${mergeList.length} tệp thành ${inspected.pages.length} trang.`, 'success');
      onClose();
    } finally {
      setBusy(null);
    }
  };

  const handleRunSplit = async () => {
    if (!activeDoc) return;
    const total = activeDoc.pages.length;
    let groups: number[][] = [];
    if (splitMode === 'single') {
      groups = Array.from({ length: total }, (_, i) => [i]);
    } else if (splitMode === 'oddeven') {
      const odd = [];
      const even = [];
      for (let i = 0; i < total; i++) {
        if ((i + 1) % 2 === 1) odd.push(i);
        else even.push(i);
      }
      groups = [odd, even].filter((g) => g.length > 0);
    } else {
      const parts = splitRangeText.split(',').map((s) => s.trim()).filter(Boolean);
      for (const part of parts) {
        if (part.includes('-')) {
          const [aStr, bStr] = part.split('-');
          const a = Math.max(1, parseInt(aStr, 10) || 1);
          const b = Math.min(total, parseInt(bStr, 10) || total);
          const g: number[] = [];
          for (let p = Math.min(a, b); p <= Math.max(a, b); p++) g.push(p - 1);
          if (g.length > 0) groups.push(g);
        } else {
          const p = parseInt(part, 10);
          if (p >= 1 && p <= total) groups.push([p - 1]);
        }
      }
    }
    if (groups.length === 0) {
      notify('Khoảng trang không hợp lệ. Ví dụ: 1-2, 3-4', 'warning');
      return;
    }

    setBusy('Đang tách tệp PDF...');
    try {
      const outputs = await splitPdfByGroups(activeDoc.currentPdfBytes, groups);
      if (outputs.length === 1) {
        triggerDownload(new Blob([new Uint8Array(outputs[0])], { type: 'application/pdf' }), `${activeDoc.title}_tach.pdf`);
      } else {
        const zip = new JSZip();
        outputs.forEach((b, i) => zip.file(`${activeDoc.title}_phan_${i + 1}.pdf`, b));
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        triggerDownload(zipBlob, `${activeDoc.title}_da_tach.zip`);
      }
      notify(`Đã tách thành ${outputs.length} tệp PDF và tải xuống.`, 'success');
    } finally {
      setBusy(null);
    }
  };

  const handleApplyCrop = () => {
    if (!activeDoc) return;
    const next = activeDoc.pages.map((p, idx) => {
      if (cropScope === 'current' && idx !== activeDoc.currentPageIndex) return p;
      return { ...p, crop: { top: cropTop, right: cropRight, bottom: cropBottom, left: cropLeft } };
    });
    updatePages(next);
    notify('Đã áp dụng cắt lề (CropBox). Lưu ý: cắt lề chỉ ẩn phần viền hiển thị, không thay thế Xóa vĩnh viễn.', 'success');
    onClose();
  };

  const handleRunCompress = async () => {
    if (!activeDoc) return;
    setBusy('Đang nén tệp PDF trên thiết bị...');
    try {
      const res = await compressPdfReal(activeDoc.currentPdfBytes, compressLevel);
      setCompressResult(res);
    } finally {
      setBusy(null);
    }
  };

  const handleAddImages = async (files: FileList | null) => {
    if (!files) return;
    const next: Array<{ name: string; dataUrl: string }> = [];
    for (const f of Array.from(files)) {
      const dataUrl = await new Promise<string>((res) => {
        const r = new FileReader();
        r.onload = () => res(String(r.result));
        r.readAsDataURL(f);
      });
      next.push({ name: f.name, dataUrl });
    }
    setImgFiles((prev) => [...prev, ...next]);
  };

  const handleConvertImages = async () => {
    if (imgFiles.length === 0) return;
    setBusy('Đang tạo PDF từ danh sách hình ảnh...');
    try {
      const bytes = await convertImagesToPdf(imgFiles, {
        paper: paperSize,
        orientation,
        marginPt,
        twoUpA5OnA4: twoUp,
      });
      const inspected = await inspectPdfBytes(bytes);
      openDocument({
        title: `PDF từ ${imgFiles.length} ảnh`,
        fileName: 'Anh_chuyen_PDF.pdf',
        pdfBytes: bytes,
        pages: inspected.pages,
      });
      notify(`Đã chuyển ${imgFiles.length} ảnh thành PDF (${inspected.pages.length} trang).`, 'success');
      onClose();
    } finally {
      setBusy(null);
    }
  };

  const TABS: Array<{ id: ToolTab; label: string; icon: React.ReactNode; needsDoc?: boolean }> = [
    { id: 'organize', label: 'Quản lý trang', icon: <Copy className="w-4 h-4" />, needsDoc: true },
    { id: 'merge', label: 'Ghép PDF', icon: <Merge className="w-4 h-4" /> },
    { id: 'split', label: 'Tách PDF', icon: <Scissors className="w-4 h-4" />, needsDoc: true },
    { id: 'crop', label: 'Cắt lề', icon: <Crop className="w-4 h-4" />, needsDoc: true },
    { id: 'compress', label: 'Nén PDF', icon: <FileArchive className="w-4 h-4" />, needsDoc: true },
    { id: 'images', label: 'Ảnh → PDF', icon: <FileImage className="w-4 h-4" /> },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        <div className="bg-[#164E63] text-white px-5 py-3.5 flex items-center justify-between gap-2">
          <h2 className="text-[19px] font-bold">Công cụ Trang PDF (Xử lý cục bộ)</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                openGuide(
                  'page-tools',
                  tab === 'merge' || tab === 'split'
                    ? 'ghep-tach-pdf'
                    : tab === 'crop'
                      ? 'cat-le-crop'
                      : tab === 'compress' || tab === 'images'
                        ? 'anh-thanh-pdf-nen-pdf'
                        : 'sap-xep-xoay-trang'
                );
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-[14px] font-semibold cursor-pointer"
            >
              <HelpCircle className="w-4 h-4" />
              <span>Hướng dẫn</span>
            </button>
            <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/15 cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="flex border-b border-slate-200 bg-[#FAFCFB] px-3 pt-2 gap-1 overflow-x-auto">
          {TABS.map((t) => {
            const disabled = t.needsDoc && !activeDoc;
            return (
              <button
                key={t.id}
                type="button"
                disabled={disabled}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-t-lg text-[14.5px] font-semibold border-b-2 whitespace-nowrap cursor-pointer disabled:opacity-40 ${
                  tab === t.id
                    ? 'border-[#087F70] text-[#087F70] bg-white'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                {t.icon}
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 text-[14.5px] text-slate-800">
          {tab === 'organize' && activeDoc && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#164E63]">
                  Tổng cộng {activeDoc.pages.length} trang trong "{activeDoc.title}"
                </span>
                <button
                  type="button"
                  onClick={addBlankPage}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#087F70] hover:bg-[#06695d] text-white font-semibold text-[14px] cursor-pointer"
                >
                  <FilePlus2 className="w-4 h-4" /> Thêm trang trắng A4
                </button>
              </div>
              <div className="space-y-2">
                {activeDoc.pages.map((p, idx) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/70"
                  >
                    <div className="font-semibold">
                      Trang {idx + 1}{' '}
                      <span className="text-[13px] font-normal text-slate-500">
                        ({Math.round(p.width)}×{Math.round(p.height)} pt · Xoay {p.rotation}°
                        {p.sourcePageIndex < 0 ? ' · Trang trống mới' : ''})
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => movePage(idx, -1)}
                        className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-35 cursor-pointer"
                        title="Di chuyển lên"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === activeDoc.pages.length - 1}
                        onClick={() => movePage(idx, 1)}
                        className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-35 cursor-pointer"
                        title="Di chuyển xuống"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updatePages(
                            activeDoc.pages.map((pg, i) =>
                              i === idx ? { ...pg, rotation: (((pg.rotation + 90) % 360) as 0 | 90 | 180 | 270) } : pg
                            )
                          )
                        }
                        className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 cursor-pointer"
                        title="Xoay 90°"
                      >
                        <RotateCw className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        disabled={activeDoc.pages.length <= 1}
                        onClick={() => updatePages(activeDoc.pages.filter((_, i) => i !== idx))}
                        className="p-1.5 rounded border border-red-200 bg-white text-[#DC2626] hover:bg-red-50 disabled:opacity-35 cursor-pointer"
                        title="Xóa trang"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'merge' && (
            <div className="space-y-4">
              <p className="text-slate-600">Chọn nhiều tệp PDF từ máy tính, sắp xếp thứ tự rồi ghép thành một tài liệu PDF duy nhất.</p>
              <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#E6F1EF] hover:bg-teal-100 text-[#164E63] font-semibold cursor-pointer">
                <FilePlus2 className="w-4 h-4" />
                <span>Chọn thêm tệp PDF...</span>
                <input
                  type="file"
                  multiple
                  accept=".pdf,application/pdf"
                  className="hidden"
                  onChange={(e) => handleAddMergeFiles(e.target.files)}
                />
              </label>

              {mergeList.length > 0 && (
                <div className="space-y-2">
                  {mergeList.map((m, idx) => (
                    <div key={`${m.name}-${idx}`} className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white">
                      <div>
                        <span className="font-semibold">{idx + 1}. {m.name}</span>
                        <span className="ml-2 text-[13px] text-slate-500">({m.pages} trang)</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setMergeList((prev) => prev.filter((_, i) => i !== idx))}
                        className="p-1 text-slate-400 hover:text-[#DC2626] cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={handleRunMerge}
                    className="px-5 py-2.5 rounded-lg bg-[#087F70] hover:bg-[#06695d] text-white font-semibold cursor-pointer"
                  >
                    Ghép {mergeList.length} tệp và mở ngay
                  </button>
                </div>
              )}
            </div>
          )}

          {tab === 'split' && activeDoc && (
            <div className="space-y-4">
              <div className="font-bold text-[#164E63]">
                Tách "{activeDoc.title}" ({activeDoc.pages.length} trang)
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" checked={splitMode === 'range'} onChange={() => setSplitMode('range')} className="accent-[#087F70]" />
                  <span>Tách theo khoảng trang (VD: 1-2, 3-5)</span>
                </label>
                {splitMode === 'range' && (
                  <input
                    type="text"
                    value={splitRangeText}
                    onChange={(e) => setSplitRangeText(e.target.value)}
                    placeholder="1-2, 3-4"
                    className="w-full max-w-md rounded-lg border border-slate-300 px-3 py-2 font-mono"
                  />
                )}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" checked={splitMode === 'single'} onChange={() => setSplitMode('single')} className="accent-[#087F70]" />
                  <span>Tách từng trang thành các tệp PDF riêng (đóng gói ZIP)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" checked={splitMode === 'oddeven'} onChange={() => setSplitMode('oddeven')} className="accent-[#087F70]" />
                  <span>Tách thành 2 tệp: Trang lẻ và Trang chẵn</span>
                </label>
              </div>
              <button
                type="button"
                onClick={handleRunSplit}
                className="px-5 py-2.5 rounded-lg bg-[#087F70] hover:bg-[#06695d] text-white font-semibold cursor-pointer"
              >
                Thực hiện tách & Tải xuống
              </button>
            </div>
          )}

          {tab === 'crop' && activeDoc && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[13.5px]">
                <strong>Lưu ý trung thực:</strong> Cắt lề (CropBox) chỉ thu gọn khung hiển thị/in ấn, không xóa vĩnh viễn dữ liệu ngoài khung. Để xóa dữ liệu bảo mật, hãy dùng <strong>Xóa vĩnh viễn (Redaction)</strong> ở mục Bảo mật.
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <label className="space-y-1">
                  <span className="text-[13px] text-slate-600">Lề trên (pt)</span>
                  <input type="number" min={0} max={200} value={cropTop} onChange={(e) => setCropTop(Number(e.target.value))} className="w-full rounded border border-slate-300 px-2.5 py-1.5 tabular-nums" />
                </label>
                <label className="space-y-1">
                  <span className="text-[13px] text-slate-600">Lề dưới (pt)</span>
                  <input type="number" min={0} max={200} value={cropBottom} onChange={(e) => setCropBottom(Number(e.target.value))} className="w-full rounded border border-slate-300 px-2.5 py-1.5 tabular-nums" />
                </label>
                <label className="space-y-1">
                  <span className="text-[13px] text-slate-600">Lề trái (pt)</span>
                  <input type="number" min={0} max={200} value={cropLeft} onChange={(e) => setCropLeft(Number(e.target.value))} className="w-full rounded border border-slate-300 px-2.5 py-1.5 tabular-nums" />
                </label>
                <label className="space-y-1">
                  <span className="text-[13px] text-slate-600">Lề phải (pt)</span>
                  <input type="number" min={0} max={200} value={cropRight} onChange={(e) => setCropRight(Number(e.target.value))} className="w-full rounded border border-slate-300 px-2.5 py-1.5 tabular-nums" />
                </label>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="radio" checked={cropScope === 'all'} onChange={() => setCropScope('all')} className="accent-[#087F70]" />
                  <span>Áp dụng toàn bộ tài liệu</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="radio" checked={cropScope === 'current'} onChange={() => setCropScope('current')} className="accent-[#087F70]" />
                  <span>Chỉ trang hiện tại (Trang {activeDoc.currentPageIndex + 1})</span>
                </label>
              </div>
              <button
                type="button"
                onClick={handleApplyCrop}
                className="px-5 py-2.5 rounded-lg bg-[#087F70] hover:bg-[#06695d] text-white font-semibold cursor-pointer"
              >
                Áp dụng cắt lề
              </button>
            </div>
          )}

          {tab === 'compress' && activeDoc && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(
                  [
                    ['quality', 'Chất lượng cao', 'Tối ưu luồng đối tượng PDF, giữ nguyên chữ vector.'],
                    ['balanced', 'Cân bằng (Khuyên dùng)', 'Tái mã hóa ảnh ở 150% độ phân giải, giảm dung lượng tốt.'],
                    ['compact', 'Nhỏ gọn (Gửi nhanh)', 'Nén mạnh để gửi Zalo/Email nhanh cho phụ huynh & học sinh.'],
                  ] as const
                ).map(([lvl, title, desc]) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setCompressLevel(lvl)}
                    className={`p-3.5 rounded-xl border-2 text-left cursor-pointer ${
                      compressLevel === lvl ? 'border-[#087F70] bg-[#F4F8F7]' : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-bold text-[#164E63]">{title}</div>
                    <div className="text-[13px] text-slate-600 mt-1">{desc}</div>
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={handleRunCompress}
                className="px-5 py-2.5 rounded-lg bg-[#087F70] hover:bg-[#06695d] text-white font-semibold cursor-pointer"
              >
                Chạy nén PDF & Kiểm tra dung lượng thực tế
              </button>

              {compressResult && (
                <div className="p-4 rounded-xl bg-[#F4F8F7] border border-teal-200 space-y-2">
                  <div className="font-bold text-[#164E63]">Kết quả nén thực tế:</div>
                  <div className="flex gap-6 tabular-nums">
                    <span>Trước khi nén: <strong>{formatKb(compressResult.beforeSize)}</strong></span>
                    <span>Sau khi nén: <strong>{formatKb(compressResult.afterSize)}</strong></span>
                  </div>
                  {!compressResult.reduced && (
                    <p className="text-[13px] text-amber-800">
                      Tệp PDF gốc đã rất nhẹ (chủ yếu là văn bản), nén thêm không giảm dung lượng. Thầy/cô nên giữ bản gốc.
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      triggerDownload(
                        new Blob([new Uint8Array(compressResult.bytes)], { type: 'application/pdf' }),
                        `${activeDoc.title}_nen.pdf`
                      )
                    }
                    className="px-4 py-2 rounded-lg bg-[#164E63] hover:bg-[#087F70] text-white font-semibold cursor-pointer"
                  >
                    Tải xuống bản PDF đã nén
                  </button>
                </div>
              )}
            </div>
          )}

          {tab === 'images' && (
            <div className="space-y-4">
              <p className="text-slate-600">
                Chọn nhiều ảnh chụp bài làm hoặc trang sách (PNG, JPEG, WebP) để tạo tệp PDF chuẩn A4, A5 hoặc ghép 2 trang A5 trên 1 tờ A4 ngang.
              </p>
              <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#E6F1EF] hover:bg-teal-100 text-[#164E63] font-semibold cursor-pointer">
                <FileImage className="w-4 h-4" />
                <span>Chọn hình ảnh...</span>
                <input
                  type="file"
                  multiple
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => handleAddImages(e.target.files)}
                />
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <label className="space-y-1">
                  <span className="text-[13px] text-slate-600">Khổ giấy</span>
                  <select value={paperSize} onChange={(e) => setPaperSize(e.target.value as 'A4' | 'A5')} className="w-full rounded border border-slate-300 px-2 py-1.5">
                    <option value="A4">A4 chuẩn</option>
                    <option value="A5">A5</option>
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="text-[13px] text-slate-600">Hướng giấy</span>
                  <select value={orientation} onChange={(e) => setOrientation(e.target.value as 'portrait' | 'landscape')} className="w-full rounded border border-slate-300 px-2 py-1.5">
                    <option value="portrait">Dọc</option>
                    <option value="landscape">Ngang</option>
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="text-[13px] text-slate-600">Lề ({marginPt} pt)</span>
                  <input type="number" min={0} max={72} value={marginPt} onChange={(e) => setMarginPt(Number(e.target.value))} className="w-full rounded border border-slate-300 px-2 py-1.5 tabular-nums" />
                </label>
                <label className="flex items-center gap-2 pt-5 cursor-pointer">
                  <input type="checkbox" checked={twoUp} onChange={(e) => setTwoUp(e.target.checked)} className="accent-[#087F70]" />
                  <span className="text-[13.5px]">2 ảnh A5 / A4</span>
                </label>
              </div>

              {imgFiles.length > 0 && (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {imgFiles.map((img, i) => (
                      <div key={`${img.name}-${i}`} className="relative rounded-lg border border-slate-200 p-1 bg-slate-50">
                        <img src={img.dataUrl} alt={img.name} className="w-full h-24 object-cover rounded" />
                        <button
                          type="button"
                          onClick={() => setImgFiles((prev) => prev.filter((_, idx) => idx !== i))}
                          className="absolute top-1.5 right-1.5 p-1 rounded-full bg-white/90 text-[#DC2626] shadow cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={handleConvertImages}
                    className="px-5 py-2.5 rounded-lg bg-[#087F70] hover:bg-[#06695d] text-white font-semibold cursor-pointer"
                  >
                    Tạo PDF từ {imgFiles.length} ảnh & Mở ngay
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
