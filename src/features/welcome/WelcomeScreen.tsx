import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  Eye,
  FileImage,
  FilePlus2,
  FileText,
  Filter,
  FolderOpen,
  GraduationCap,
  HelpCircle,
  Loader2,
  Merge,
  RotateCcw,
  ScanText,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import {
  DOC_TYPE_OPTIONS,
  getExerciseFormatsForFilter,
  SAMPLE_DOCUMENTS,
  SUBJECT_CARDS_8,
  type SampleDocDescriptor,
} from '../../samples/sampleCatalog';
import { useStudioStore } from '../../stores/useStudioStore';
import {
  buildSamplePreviewBytes,
  createNewBlankDocument,
  downloadSampleAsNewPdf,
  openDraftById,
  openFilesInStudio,
  openSampleInStudio,
} from '../../services/documentActions';
import type { GradeLevel, SubjectCategory } from '../../types/studio';
import type { LoadedPdfHandle } from '../../engines/pdf/pdfEngine';

export const WelcomeScreen: React.FC = () => {
  const recentDocs = useStudioStore((s) => s.recentDocs);
  const removeRecentDoc = useStudioStore((s) => s.removeRecentDoc);
  const setActiveModal = useStudioStore((s) => s.setActiveModal);
  const openGuide = useStudioStore((s) => s.openGuide);

  const [subjectFilter, setSubjectFilter] = useState<'all' | SubjectCategory>('all');
  const [gradeFilter, setGradeFilter] = useState<'all' | GradeLevel>('all');
  const [docTypeFilter, setDocTypeFilter] = useState<string>('all');
  const [formatFilter, setFormatFilter] = useState<string>('all');
  const [isDragging, setIsDragging] = useState(false);

  // Inline real PDF preview state (no disruptive popup)
  const [previewSample, setPreviewSample] = useState<SampleDocDescriptor | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewPage, setPreviewPage] = useState(1);
  const [previewTotalPages, setPreviewTotalPages] = useState(1);
  const previewHandleRef = useRef<LoadedPdfHandle | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const previewPanelRef = useRef<HTMLDivElement>(null);

  const singleOpenRef = useRef<HTMLInputElement>(null);
  const multiOpenRef = useRef<HTMLInputElement>(null);

  const availableFormats = useMemo(
    () => getExerciseFormatsForFilter(subjectFilter),
    [subjectFilter]
  );

  useEffect(() => {
    if (formatFilter !== 'all' && !availableFormats.includes(formatFilter)) {
      setFormatFilter('all');
    }
  }, [availableFormats, formatFilter]);

  const subjectCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const s of SAMPLE_DOCUMENTS) {
      map[s.subject] = (map[s.subject] || 0) + 1;
    }
    return map;
  }, []);

  const filteredSamples = useMemo(() => {
    return SAMPLE_DOCUMENTS.filter((s) => {
      if (subjectFilter !== 'all' && s.subject !== subjectFilter) return false;
      if (gradeFilter !== 'all' && s.grade !== gradeFilter) return false;
      if (docTypeFilter !== 'all' && s.docType !== docTypeFilter) return false;
      if (formatFilter !== 'all' && s.exerciseFormat !== formatFilter) return false;
      return true;
    });
  }, [subjectFilter, gradeFilter, docTypeFilter, formatFilter]);

  const hasActiveFilters =
    subjectFilter !== 'all' ||
    gradeFilter !== 'all' ||
    docTypeFilter !== 'all' ||
    formatFilter !== 'all';

  const resetAllFilters = () => {
    setSubjectFilter('all');
    setGradeFilter('all');
    setDocTypeFilter('all');
    setFormatFilter('all');
  };

  useEffect(() => {
    return () => {
      previewHandleRef.current?.destroy().catch(() => {});
      previewHandleRef.current = null;
    };
  }, []);

  const renderPreviewPage = async (handle: LoadedPdfHandle, pageNumber: number) => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const page = await handle.proxy.getPage(pageNumber);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const targetCssWidth = Math.min(680, Math.max(320, (canvas.parentElement?.clientWidth || 640) - 24));
    const baseVp = page.getViewport({ scale: 1 });
    const cssScale = targetCssWidth / baseVp.width;
    const renderVp = page.getViewport({ scale: cssScale * dpr });

    canvas.width = Math.round(renderVp.width);
    canvas.height = Math.round(renderVp.height);
    canvas.style.width = `${Math.round(baseVp.width * cssScale)}px`;
    canvas.style.height = `${Math.round(baseVp.height * cssScale)}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, viewport: renderVp, canvas }).promise;
  };

  const openInlinePreview = async (sample: SampleDocDescriptor) => {
    setPreviewSample(sample);
    setPreviewLoading(true);
    setPreviewError(null);
    setPreviewPage(1);
    setPreviewTotalPages(sample.pageCount);

    setTimeout(() => {
      previewPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 60);

    try {
      await previewHandleRef.current?.destroy().catch(() => {});
      previewHandleRef.current = null;

      const [bytes, { openPdfDocument }] = await Promise.all([
        buildSamplePreviewBytes(sample.id),
        import('../../engines/pdf/pdfEngine'),
      ]);
      const handle = await openPdfDocument(bytes);
      previewHandleRef.current = handle;
      setPreviewTotalPages(handle.proxy.numPages);
      setPreviewLoading(false);
      requestAnimationFrame(() => {
        renderPreviewPage(handle, 1).catch((err) => {
          setPreviewError(err instanceof Error ? err.message : 'Không thể hiển thị trang xem trước.');
        });
      });
    } catch (err) {
      setPreviewLoading(false);
      setPreviewError(
        err instanceof Error ? err.message : 'Không thể tạo bản xem trước PDF cho tài liệu này.'
      );
    }
  };

  const changePreviewPage = async (nextPage: number) => {
    const handle = previewHandleRef.current;
    if (!handle || nextPage < 1 || nextPage > previewTotalPages) return;
    setPreviewPage(nextPage);
    try {
      await renderPreviewPage(handle, nextPage);
    } catch (err) {
      setPreviewError(err instanceof Error ? err.message : 'Không thể chuyển trang xem trước.');
    }
  };

  const closeInlinePreview = () => {
    previewHandleRef.current?.destroy().catch(() => {});
    previewHandleRef.current = null;
    setPreviewSample(null);
    setPreviewError(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      openFilesInStudio(e.dataTransfer.files);
    }
  };

  return (
    <div
      className="flex-1 overflow-y-auto bg-[#F4F8F7] text-[#1F2937]"
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <div className="max-w-7xl mx-auto px-5 py-7 space-y-8">
        {/* Hero Workspace Entry Banner */}
        <section
          className={`rounded-2xl bg-white border-2 transition-colors p-6 md:p-8 shadow-sm ${
            isDragging ? 'border-[#087F70] bg-teal-50/40' : 'border-slate-200/80'
          }`}
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-3">
                <img src="/icons/icon.svg" alt="" className="w-11 h-11 rounded-xl shrink-0" />
                <div>
                  <h1 className="text-[24px] font-bold text-[#164E63] tracking-tight leading-tight">
                    PDF EDU STUDIO
                  </h1>
                  <p className="text-[15.5px] font-medium text-[#087F70]">
                    Chỉnh sửa – Soạn thảo – Chấm bài thông minh
                  </p>
                </div>
              </div>
              <p className="text-[15.5px] text-slate-600 leading-relaxed pt-1">
                Công cụ xử lý PDF chuyên biệt dành cho giáo dục, hỗ trợ chỉnh sửa văn bản, chèn công thức khoa học, vẽ hình minh họa, chú thích, chấm bài và quản lý tài liệu PDF trên cùng một nền tảng.
              </p>
            </div>

            {/* Drag & Drop CTA Box */}
            <div
              onClick={() => singleOpenRef.current?.click()}
              className="lg:w-[340px] shrink-0 rounded-xl border-2 border-dashed border-[#087F70]/45 hover:border-[#087F70] bg-[#F4F8F7] hover:bg-teal-50/50 p-5 text-center cursor-pointer transition-colors"
            >
              <Upload className="w-8 h-8 text-[#087F70] mx-auto mb-2" />
              <div className="text-[16px] font-semibold text-[#164E63]">
                Kéo thả tệp PDF vào đây
              </div>
              <p className="text-[15px] text-slate-600 mt-1">
                Hỗ trợ tệp <strong>.pdf</strong> và dự án <strong>.pdfedu</strong>
              </p>
              <button
                type="button"
                className="mt-3 px-4 py-2 rounded-lg bg-[#087F70] hover:bg-[#06695d] text-white font-semibold text-[15px] cursor-pointer"
              >
                Chọn tệp từ máy tính
              </button>
            </div>
          </div>

          {/* 6 Quick-Action Tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-6 border-t border-slate-100">
            <button
              type="button"
              onClick={() => singleOpenRef.current?.click()}
              className="flex flex-col items-start gap-2 p-3.5 rounded-xl border border-slate-200 bg-white hover:border-[#087F70] hover:bg-[#F4F8F7] transition-all text-left cursor-pointer"
            >
              <FolderOpen className="w-6 h-6 text-[#087F70]" />
              <div>
                <div className="text-[15px] font-semibold text-slate-900">Mở tệp PDF</div>
                <div className="text-[14px] text-slate-500">Chỉnh sửa ngay</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => createNewBlankDocument(1, 'Đề kiểm tra mới')}
              className="flex flex-col items-start gap-2 p-3.5 rounded-xl border border-slate-200 bg-white hover:border-[#087F70] hover:bg-[#F4F8F7] transition-all text-left cursor-pointer"
            >
              <FilePlus2 className="w-6 h-6 text-[#087F70]" />
              <div>
                <div className="text-[15px] font-semibold text-slate-900">Tạo PDF mới</div>
                <div className="text-[14px] text-slate-500">Trang A4 trống</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => multiOpenRef.current?.click()}
              className="flex flex-col items-start gap-2 p-3.5 rounded-xl border border-slate-200 bg-white hover:border-[#087F70] hover:bg-[#F4F8F7] transition-all text-left cursor-pointer"
            >
              <Merge className="w-6 h-6 text-[#164E63]" />
              <div>
                <div className="text-[15px] font-semibold text-slate-900">Mở nhiều tệp</div>
                <div className="text-[14px] text-slate-500">Làm việc đa tab</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setActiveModal('page-tools')}
              className="flex flex-col items-start gap-2 p-3.5 rounded-xl border border-slate-200 bg-white hover:border-[#087F70] hover:bg-[#F4F8F7] transition-all text-left cursor-pointer"
            >
              <FileImage className="w-6 h-6 text-[#164E63]" />
              <div>
                <div className="text-[15px] font-semibold text-slate-900">Ghép / Ảnh → PDF</div>
                <div className="text-[14px] text-slate-500">Tách, ghép, nén</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => openSampleInStudio('sample-11-student-grade')}
              className="flex flex-col items-start gap-2 p-3.5 rounded-xl border border-red-200/80 bg-red-50/30 hover:border-[#DC2626] hover:bg-red-50/70 transition-all text-left cursor-pointer"
            >
              <GraduationCap className="w-6 h-6 text-[#DC2626]" />
              <div>
                <div className="text-[15px] font-semibold text-slate-900">Chấm bài PDF</div>
                <div className="text-[14px] text-slate-500">Mở bài làm mẫu</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => openGuide('open-save-print', 'mo-va-tao-pdf')}
              className="flex flex-col items-start gap-2 p-3.5 rounded-xl border border-teal-200 bg-teal-50/40 hover:border-[#087F70] hover:bg-teal-50 transition-all text-left cursor-pointer"
            >
              <HelpCircle className="w-6 h-6 text-[#087F70]" />
              <div>
                <div className="text-[15px] font-semibold text-slate-900">Hướng dẫn sử dụng</div>
                <div className="text-[14px] text-slate-600">Tra cứu theo công việc</div>
              </div>
            </button>
          </div>
        </section>

        {/* Recent Local Drafts */}
        {recentDocs.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-[18px] font-bold text-[#164E63] flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#087F70]" />
                <span>Tài liệu gần đây (Lưu cục bộ trên thiết bị)</span>
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {recentDocs.slice(0, 6).map((item) => (
                <div
                  key={item.id}
                  onClick={() => openDraftById(item.id)}
                  className="group bg-white rounded-xl border border-slate-200 hover:border-[#087F70] p-4 flex items-center justify-between gap-3 cursor-pointer transition-colors shadow-2xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-[#E6F1EF] text-[#087F70] flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[15px] font-semibold text-slate-900 truncate">
                        {item.title}
                      </div>
                      <div className="text-[14px] text-slate-500">
                        {item.pageCount} trang · {new Date(item.updatedAt).toLocaleDateString('vi-VN')}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeRecentDoc(item.id);
                    }}
                    className="p-1.5 rounded-md text-slate-400 hover:text-[#DC2626] hover:bg-red-50 opacity-70 group-hover:opacity-100 cursor-pointer"
                    title="Xóa khỏi danh sách gần đây"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Built-In Sample Document Library — 8 THPT Subjects */}
        <section className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div className="space-y-1">
              <h2 className="text-[20px] font-bold text-[#164E63] flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#087F70]" />
                <span>Thư viện tài liệu mẫu (8 môn học THPT)</span>
              </h2>
              <p className="text-[15px] text-slate-600">
                Chọn tài liệu mẫu để xem trước, mở thực hành chỉnh sửa, chèn công thức, hình vẽ, biểu đồ, chấm bài hoặc lưu thành tệp mới.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setSubjectFilter('all')}
                className={`px-3.5 py-2 rounded-lg text-[15px] font-semibold transition-colors cursor-pointer ${
                  subjectFilter === 'all'
                    ? 'bg-[#164E63] text-white'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-[#E6F1EF]'
                }`}
              >
                Tất cả ({SAMPLE_DOCUMENTS.length})
              </button>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-[15px] font-medium cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Đặt lại bộ lọc</span>
                </button>
              )}
            </div>
          </div>

          {/* 8 Uniform THPT Subject Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {SUBJECT_CARDS_8.map((card) => {
              const isSelected = subjectFilter === card.id;
              const count = subjectCounts[card.id] || 0;
              return (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => setSubjectFilter(isSelected ? 'all' : card.id)}
                  className={`rounded-xl border-2 p-3.5 text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                    isSelected
                      ? 'border-[#087F70] bg-[#E6F1EF]/70 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-[#087F70]/60 hover:bg-[#FAFCFB]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[16px] font-bold text-[#164E63]">{card.label}</span>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[13.5px] font-semibold ${card.accentBg} ${card.accentText}`}
                    >
                      {count} mẫu
                    </span>
                  </div>
                  <p className="text-[14.5px] text-slate-600 leading-snug line-clamp-2">
                    {card.shortDesc}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Multi-facet Filter Bar: Grade, Document Type, Exercise Format */}
          <div className="rounded-xl bg-white border border-slate-200 p-4 flex flex-col md:flex-row md:items-end gap-3">
            <div className="flex items-center gap-2 text-[#164E63] font-semibold text-[15px] md:pb-2 shrink-0">
              <Filter className="w-4 h-4 text-[#087F70]" />
              <span>Lọc tài liệu:</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
              <label className="space-y-1">
                <span className="block text-[14px] font-semibold text-slate-600">Khối lớp</span>
                <select
                  value={gradeFilter === 'all' ? 'all' : String(gradeFilter)}
                  onChange={(e) =>
                    setGradeFilter(e.target.value === 'all' ? 'all' : (Number(e.target.value) as GradeLevel))
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[15px] text-slate-800 focus:border-[#087F70] outline-none"
                >
                  <option value="all">Tất cả khối lớp (10, 11, 12)</option>
                  <option value="10">Lớp 10</option>
                  <option value="11">Lớp 11</option>
                  <option value="12">Lớp 12</option>
                </select>
              </label>

              <label className="space-y-1">
                <span className="block text-[14px] font-semibold text-slate-600">Loại tài liệu</span>
                <select
                  value={docTypeFilter}
                  onChange={(e) => setDocTypeFilter(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[15px] text-slate-800 focus:border-[#087F70] outline-none"
                >
                  <option value="all">Tất cả loại tài liệu</option>
                  {DOC_TYPE_OPTIONS.map((dt) => (
                    <option key={dt} value={dt}>
                      {dt}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1">
                <span className="block text-[14px] font-semibold text-slate-600">Dạng bài</span>
                <select
                  value={formatFilter}
                  onChange={(e) => setFormatFilter(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[15px] text-slate-800 focus:border-[#087F70] outline-none"
                >
                  <option value="all">Tất cả dạng bài</option>
                  {availableFormats.map((fmt) => (
                    <option key={fmt} value={fmt}>
                      {fmt}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="text-[14.5px] font-semibold text-slate-600 md:pb-2 shrink-0">
              Hiển thị <span className="text-[#087F70]">{filteredSamples.length}</span> / {SAMPLE_DOCUMENTS.length} tài liệu
            </div>
          </div>

          {/* Inline Real PDF Preview Panel (non-blocking, renders real PDF.js pages) */}
          {previewSample && (
            <div
              ref={previewPanelRef}
              className="rounded-2xl bg-white border-2 border-[#087F70] shadow-md overflow-hidden"
            >
              <div className="px-5 py-3.5 bg-[#E6F1EF] border-b border-teal-200 flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[14px] font-semibold text-[#087F70]">
                    Xem trước tài liệu PDF thật · {previewSample.subjectLabel} · Lớp {previewSample.grade} · {previewSample.exerciseFormat}
                  </div>
                  <h3 className="text-[17px] font-bold text-[#164E63] truncate">
                    {previewSample.title}
                  </h3>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => openSampleInStudio(previewSample.id)}
                    className="px-3.5 py-2 rounded-lg bg-[#087F70] hover:bg-[#06695d] text-white font-semibold text-[15px] cursor-pointer"
                  >
                    Mở thực hành
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadSampleAsNewPdf(previewSample.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-semibold text-[15px] cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-[#164E63]" />
                    <span>Lưu thành tệp mới</span>
                  </button>
                  <button
                    type="button"
                    onClick={closeInlinePreview}
                    className="p-2 rounded-lg bg-white border border-slate-300 hover:bg-red-50 hover:text-[#DC2626] text-slate-600 cursor-pointer"
                    title="Đóng xem trước"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-4 bg-slate-100/80 flex flex-col items-center gap-3">
                {previewLoading ? (
                  <div className="py-12 flex items-center gap-2.5 text-[#164E63] text-[15.5px] font-semibold">
                    <Loader2 className="w-5 h-5 animate-spin text-[#087F70]" />
                    <span>Đang tạo và hiển thị trang PDF thật...</span>
                  </div>
                ) : previewError ? (
                  <div className="py-8 text-center text-[#DC2626] text-[15px] font-medium">
                    {previewError}
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3 bg-white px-4 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
                      <button
                        type="button"
                        disabled={previewPage <= 1}
                        onClick={() => changePreviewPage(previewPage - 1)}
                        className="p-1 rounded hover:bg-slate-100 disabled:opacity-35 cursor-pointer"
                        title="Trang trước"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <span className="text-[15px] font-semibold text-slate-800 tabular-nums">
                        Trang {previewPage} / {previewTotalPages}
                      </span>
                      <button
                        type="button"
                        disabled={previewPage >= previewTotalPages}
                        onClick={() => changePreviewPage(previewPage + 1)}
                        className="p-1 rounded hover:bg-slate-100 disabled:opacity-35 cursor-pointer"
                        title="Trang sau"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="w-full flex justify-center overflow-x-auto pb-1">
                      <canvas
                        ref={previewCanvasRef}
                        className="bg-white rounded shadow-md border border-slate-300 max-w-full"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Sample Document Cards */}
          {filteredSamples.length === 0 ? (
            <div className="rounded-xl bg-white border border-slate-200 p-8 text-center space-y-3">
              <div className="text-[16px] font-semibold text-slate-700">
                Không có tài liệu mẫu nào khớp với bộ lọc hiện tại.
              </div>
              <button
                type="button"
                onClick={resetAllFilters}
                className="px-4 py-2 rounded-lg bg-[#087F70] hover:bg-[#06695d] text-white font-semibold text-[15px] cursor-pointer"
              >
                Hiển thị tất cả tài liệu
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSamples.map((sample) => (
                <article
                  key={sample.id}
                  className="bg-white rounded-xl border border-slate-200 hover:border-[#087F70] p-4 flex flex-col justify-between gap-3.5 shadow-2xs transition-all"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-[14.5px] font-bold text-[#087F70]">
                        {sample.subjectLabel} · Lớp {sample.grade}
                      </span>
                      <div className="flex items-center gap-1.5 text-[14px] font-semibold text-slate-600">
                        {sample.isGradingSample && (
                          <GraduationCap className="w-4 h-4 text-[#DC2626] shrink-0" />
                        )}
                        {sample.isScannedSample && (
                          <ScanText className="w-4 h-4 text-[#164E63] shrink-0" />
                        )}
                        <span>{sample.pageCount} trang PDF</span>
                      </div>
                    </div>

                    <h3 className="text-[16.5px] font-bold text-slate-900 leading-snug">
                      {sample.title}
                    </h3>

                    <div className="text-[14.5px] text-[#164E63] font-medium bg-[#F4F8F7] rounded-lg px-2.5 py-1.5 border border-slate-200/70">
                      <div>
                        <span className="text-slate-500">Loại tài liệu:</span> {sample.docType}
                      </div>
                      <div>
                        <span className="text-slate-500">Dạng bài:</span> {sample.exerciseFormat}
                      </div>
                    </div>

                    <p className="text-[15px] text-slate-600 leading-relaxed">
                      {sample.subtitle}
                    </p>
                  </div>

                  {/* 3 Required Working Buttons */}
                  <div className="pt-3 border-t border-slate-100 flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => openSampleInStudio(sample.id)}
                      className="flex-1 min-w-[120px] px-3 py-2 rounded-lg bg-[#087F70] hover:bg-[#06695d] text-white font-semibold text-[15px] transition-colors cursor-pointer text-center"
                    >
                      Mở thực hành
                    </button>
                    <button
                      type="button"
                      onClick={() => openInlinePreview(sample)}
                      className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-[#E6F1EF] hover:bg-[#164E63] text-[#164E63] hover:text-white font-semibold text-[15px] transition-colors cursor-pointer"
                      title="Xem trước trang PDF thật"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Xem trước</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadSampleAsNewPdf(sample.id)}
                      className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg border border-slate-300 bg-white hover:border-[#087F70] hover:text-[#087F70] text-slate-700 font-semibold text-[15px] transition-colors cursor-pointer"
                      title="Lưu bản sao thành tệp PDF mới"
                    >
                      <Download className="w-4 h-4" />
                      <span>Lưu tệp mới</span>
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Bottom Copyright */}
        <div className="pt-4 pb-6 border-t border-slate-200/80 text-center text-[15px] text-slate-500">
          Copyright © 2026 – Phát triển bởi Thầy Hồ Nguyễn Đa Thiện · Xử lý 100% cục bộ trên trình duyệt
        </div>
      </div>

      {/* Hidden inputs */}
      <input
        ref={singleOpenRef}
        type="file"
        accept=".pdf,.pdfedu,application/pdf"
        className="hidden"
        onChange={(e) => {
          if (e.target.files) {
            openFilesInStudio(e.target.files);
            e.target.value = '';
          }
        }}
      />
      <input
        ref={multiOpenRef}
        type="file"
        multiple
        accept=".pdf,.pdfedu,application/pdf"
        className="hidden"
        onChange={(e) => {
          if (e.target.files) {
            openFilesInStudio(e.target.files);
            e.target.value = '';
          }
        }}
      />
    </div>
  );
};
