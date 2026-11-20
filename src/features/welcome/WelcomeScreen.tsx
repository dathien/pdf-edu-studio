import React, { useRef, useState } from 'react';
import {
  BookOpen,
  Clock,
  FileImage,
  FilePlus2,
  FileText,
  FolderOpen,
  GraduationCap,
  HelpCircle,
  Merge,
  ScanText,
  Trash2,
  Upload,
} from 'lucide-react';
import { SAMPLE_DOCUMENTS } from '../../samples/sampleCatalog';
import { useStudioStore } from '../../stores/useStudioStore';
import {
  createNewBlankDocument,
  openDraftById,
  openFilesInStudio,
  openSampleInStudio,
} from '../../services/documentActions';
import type { SubjectCategory } from '../../types/studio';

const SUBJECT_FILTERS: Array<{ id: 'all' | SubjectCategory; label: string }> = [
  { id: 'all', label: 'Tất cả' },
  { id: 'math', label: 'Toán học' },
  { id: 'physics', label: 'Vật lí' },
  { id: 'chemistry', label: 'Hóa học' },
  { id: 'biology', label: 'Sinh học' },
  { id: 'cs', label: 'Tin học' },
  { id: 'general', label: 'OCR & Khác' },
];

export const WelcomeScreen: React.FC = () => {
  const recentDocs = useStudioStore((s) => s.recentDocs);
  const removeRecentDoc = useStudioStore((s) => s.removeRecentDoc);
  const setActiveModal = useStudioStore((s) => s.setActiveModal);
  const openGuide = useStudioStore((s) => s.openGuide);

  const [subjectFilter, setSubjectFilter] = useState<'all' | SubjectCategory>('all');
  const [isDragging, setIsDragging] = useState(false);

  const singleOpenRef = useRef<HTMLInputElement>(null);
  const multiOpenRef = useRef<HTMLInputElement>(null);

  const filteredSamples =
    subjectFilter === 'all'
      ? SAMPLE_DOCUMENTS
      : SAMPLE_DOCUMENTS.filter((s) => s.subject === subjectFilter);

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
                Xử lý tệp PDF trực tiếp trên thiết bị của thầy/cô. Soạn công thức Toán – Lí – Hóa – Sinh – Tin sắc nét, vẽ 120+ hình khoa học, chấm bài tự luận & trắc nghiệm xuất Excel và sử dụng ngoại tuyến không cần đăng nhập.
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
              <p className="text-[14px] text-slate-600 mt-1">
                Hỗ trợ tệp <strong>.pdf</strong> và dự án <strong>.pdfedu</strong>
              </p>
              <button
                type="button"
                className="mt-3 px-4 py-2 rounded-lg bg-[#087F70] hover:bg-[#06695d] text-white font-semibold text-[14.5px] cursor-pointer"
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
                <div className="text-[13px] text-slate-500">Chỉnh sửa ngay</div>
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
                <div className="text-[13px] text-slate-500">Trang A4 trống</div>
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
                <div className="text-[13px] text-slate-500">Làm việc đa tab</div>
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
                <div className="text-[13px] text-slate-500">Tách, ghép, nén</div>
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
                <div className="text-[13px] text-slate-500">Mở bài làm mẫu</div>
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
                <div className="text-[13.5px] text-slate-600">Tra cứu theo công việc</div>
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
                      <div className="text-[13.5px] text-slate-500">
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

        {/* 12 Built-In Sample Documents */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div className="space-y-1">
              <h2 className="text-[19px] font-bold text-[#164E63] flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#087F70]" />
                <span>Thư viện tài liệu mẫu</span>
              </h2>
              <p className="text-[15px] text-slate-600">
                Chọn tài liệu mẫu để xem, chỉnh sửa, chèn công thức, hình vẽ hoặc chấm bài.
              </p>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {SUBJECT_FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setSubjectFilter(f.id)}
                  className={`px-3 py-1.5 rounded-lg text-[14px] font-medium whitespace-nowrap cursor-pointer transition-colors ${
                    subjectFilter === f.id
                      ? 'bg-[#087F70] text-white'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-[#E6F1EF]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSamples.map((sample) => (
              <div
                key={sample.id}
                className="bg-white rounded-xl border border-slate-200 hover:border-[#087F70] p-4 flex flex-col justify-between gap-3 shadow-2xs transition-all"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[13px] font-semibold text-[#087F70]">
                      {sample.categoryLabel}
                    </span>
                    {sample.isGradingSample && (
                      <GraduationCap className="w-4 h-4 text-[#DC2626] shrink-0" />
                    )}
                    {sample.isScannedSample && (
                      <ScanText className="w-4 h-4 text-[#164E63] shrink-0" />
                    )}
                  </div>
                  <h3 className="text-[16px] font-bold text-slate-900 leading-snug">
                    {sample.title}
                  </h3>
                  <p className="text-[14.5px] text-slate-600 leading-relaxed">
                    {sample.subtitle}
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-100 flex justify-end">
                  <button
                    type="button"
                    onClick={() => openSampleInStudio(sample.id)}
                    className="px-3.5 py-1.5 rounded-lg bg-[#E6F1EF] hover:bg-[#087F70] text-[#164E63] hover:text-white font-semibold text-[14.5px] transition-colors cursor-pointer"
                  >
                    Mở tài liệu
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Bottom Copyright */}
        <div className="pt-4 pb-6 border-t border-slate-200/80 text-center text-[14px] text-slate-500">
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
