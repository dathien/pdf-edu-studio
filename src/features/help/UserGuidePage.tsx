import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  CheckSquare,
  Compass,
  Edit3,
  FileStack,
  FolderOpen,
  Info,
  MapPin,
  PenTool,
  Search,
  ShieldCheck,
  Sigma,
  X,
} from 'lucide-react';
import {
  GUIDE_GROUPS,
  findGuideFeature,
  findGuideGroup,
  searchGuideFeatures,
  type GuideFeature,
  type GuideGroupId,
} from './guideData';
import { GuideIllustration } from './GuideIllustration';
import { useStudioStore } from '../../stores/useStudioStore';

const GROUP_ICONS: Record<GuideGroupId, React.ReactNode> = {
  'open-save-print': <FolderOpen className="w-5 h-5" />,
  'edit-content': <Edit3 className="w-5 h-5" />,
  formulas: <Sigma className="w-5 h-5" />,
  'diagrams-graphs': <Compass className="w-5 h-5" />,
  grading: <CheckSquare className="w-5 h-5" />,
  'annotate-sign': <PenTool className="w-5 h-5" />,
  'page-tools': <FileStack className="w-5 h-5" />,
  'security-offline': <ShieldCheck className="w-5 h-5" />,
};

export const UserGuidePage: React.FC = () => {
  const guideView = useStudioStore((s) => s.guideView);
  const openGuide = useStudioStore((s) => s.openGuide);
  const closeGuide = useStudioStore((s) => s.closeGuide);
  const documents = useStudioStore((s) => s.documents);
  const activeDocId = useStudioStore((s) => s.activeDocId);

  const [searchQuery, setSearchQuery] = useState('');

  const activeDoc = documents.find((d) => d.id === activeDocId) || null;
  const trimmedQuery = searchQuery.trim();

  const searchMatches = useMemo(
    () => (trimmedQuery ? searchGuideFeatures(trimmedQuery) : []),
    [trimmedQuery]
  );

  const currentGroup = useMemo(
    () => findGuideGroup(guideView.groupId),
    [guideView.groupId]
  );

  const currentFeature: GuideFeature = useMemo(() => {
    const byId = findGuideFeature(guideView.featureId);
    if (byId && byId.groupId === currentGroup.id) return byId;
    return currentGroup.features[0];
  }, [guideView.featureId, currentGroup]);

  const handleSelectGroup = (groupId: GuideGroupId) => {
    setSearchQuery('');
    const grp = findGuideGroup(groupId);
    openGuide(groupId, grp.features[0]?.id);
  };

  const handleSelectFeature = (feat: GuideFeature) => {
    setSearchQuery('');
    openGuide(feat.groupId, feat.id);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#F4F8F7] text-[#1F2937] overflow-hidden">
      {/* Top Bar: Title, Subtitle & Return to Document Button */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-4 shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-[24px] font-bold text-[#164E63] tracking-tight leading-tight">
              HƯỚNG DẪN SỬ DỤNG
            </h1>
            <p className="text-[16px] text-slate-600 mt-0.5">
              Chọn công việc thầy cô muốn thực hiện.
            </p>
          </div>

          <button
            type="button"
            onClick={closeGuide}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#087F70] hover:bg-[#06695d] text-white font-semibold text-[15.5px] transition-colors shrink-0 cursor-pointer self-start sm:self-center"
          >
            <ArrowLeft className="w-5 h-5 shrink-0" />
            <span>{activeDoc ? 'Quay lại tài liệu' : 'Quay lại trang chủ'}</span>
          </button>
        </div>
      </div>

      {/* Scrollable Main Content */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
        <div className="max-w-7xl mx-auto space-y-6 pb-10">
          {/* Search Input */}
          <div className="relative max-w-2xl">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm chức năng: sửa chữ, công thức, vẽ đồ thị, chấm bài, ghép PDF, OCR..."
              className="w-full pl-11 pr-10 py-3 rounded-xl border border-slate-300 bg-white text-[16px] text-slate-800 placeholder:text-slate-400 focus:border-[#087F70] outline-none shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                title="Xóa từ khóa"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Search Results Panel (when user types a query) */}
          {trimmedQuery ? (
            <section className="space-y-4">
              <div className="text-[16px] font-semibold text-slate-700">
                Kết quả tìm kiếm cho &ldquo;{trimmedQuery}&rdquo;
              </div>
              {searchMatches.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-6 text-[16px] text-slate-600">
                  Không tìm thấy chức năng phù hợp. Thầy cô hãy thử từ khóa ngắn hơn như{' '}
                  <strong>sửa chữ</strong>, <strong>công thức</strong>, <strong>hình vẽ</strong>,{' '}
                  <strong>chấm bài</strong>, <strong>ghép PDF</strong> hoặc chọn trực tiếp một nhóm bên dưới.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {searchMatches.map((feat) => {
                    const grp = findGuideGroup(feat.groupId);
                    return (
                      <button
                        key={feat.id}
                        type="button"
                        onClick={() => handleSelectFeature(feat)}
                        className="bg-white rounded-xl border border-slate-200 hover:border-[#087F70] p-4 text-left transition-colors cursor-pointer space-y-1.5"
                      >
                        <div className="text-[14px] font-semibold text-[#087F70]">
                          {grp.title}
                        </div>
                        <div className="text-[17px] font-bold text-[#164E63] leading-snug">
                          {feat.title}
                        </div>
                        <p className="text-[15.5px] text-slate-600 leading-relaxed">
                          {feat.purpose}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
          ) : null}

          {/* 8 Task Groups Grid */}
          <section aria-label="Tám nhóm công việc" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {GUIDE_GROUPS.map((group) => {
              const isSelected = group.id === currentGroup.id && !trimmedQuery;
              return (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => handleSelectGroup(group.id)}
                  className={`rounded-xl border p-4 text-left transition-colors cursor-pointer flex flex-col gap-1.5 min-w-0 ${
                    isSelected
                      ? 'bg-white border-[#087F70] ring-2 ring-[#087F70]/20'
                      : 'bg-white border-slate-200 hover:border-[#087F70]/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-[#087F70] text-white'
                          : 'bg-[#E6F1EF] text-[#164E63]'
                      }`}
                    >
                      {GROUP_ICONS[group.id]}
                    </span>
                    <span className="text-[18px] font-bold text-[#164E63] leading-snug break-words">
                      {group.title}
                    </span>
                  </div>
                  <p className="text-[14.5px] text-slate-600 leading-relaxed">
                    {group.summary}
                  </p>
                </button>
              );
            })}
          </section>

          {/* Guide Reading Workspace: Left Feature Selector + Right Step-by-Step Content */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Features inside Active Group */}
            <aside className="lg:col-span-4 bg-white rounded-xl border border-slate-200 p-4 space-y-2.5">
              <h2 className="text-[19px] font-bold text-[#164E63] pb-2 border-b border-slate-100">
                {currentGroup.title}
              </h2>
              <div className="flex flex-col gap-1.5">
                {currentGroup.features.map((feat) => {
                  const active = feat.id === currentFeature.id;
                  return (
                    <button
                      key={feat.id}
                      type="button"
                      onClick={() => openGuide(currentGroup.id, feat.id)}
                      className={`w-full text-left px-3.5 py-2.5 rounded-lg text-[15.5px] leading-snug transition-colors cursor-pointer ${
                        active
                          ? 'bg-[#087F70] text-white font-semibold'
                          : 'text-slate-700 hover:bg-[#E6F1EF] hover:text-[#164E63] font-medium'
                      }`}
                    >
                      {feat.title}
                    </button>
                  );
                })}
              </div>
            </aside>

            {/* Detailed Feature Instructions */}
            <article className="lg:col-span-8 bg-white rounded-xl border border-slate-200 p-5 sm:p-7 space-y-5 min-w-0">
              {/* Feature Title & Purpose */}
              <div className="space-y-2 pb-4 border-b border-slate-200">
                <h2 className="text-[20px] sm:text-[22px] font-bold text-[#164E63] leading-snug">
                  {currentFeature.title}
                </h2>
                <p className="text-[16.5px] text-slate-700 leading-relaxed">
                  <strong className="text-slate-900">Công dụng:</strong> {currentFeature.purpose}
                </p>
              </div>

              {/* Tool Location */}
              <div className="rounded-xl bg-[#F4F8F7] border border-teal-200/80 p-4 flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[#087F70] shrink-0 mt-0.5" />
                <div className="text-[16px] text-slate-800 leading-relaxed min-w-0">
                  <strong className="text-[#164E63]">Vị trí công cụ:</strong>{' '}
                  {currentFeature.toolLocation}
                </div>
              </div>

              {/* Numbered Steps */}
              <div className="space-y-3">
                <h3 className="text-[18.5px] font-bold text-[#164E63]">Cách thực hiện</h3>
                <ol className="space-y-2.5">
                  {currentFeature.steps.map((step, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2.5 text-[16.5px] text-slate-800 leading-relaxed"
                    >
                      <span className="font-bold text-[#087F70] shrink-0 whitespace-nowrap">
                        Bước {idx + 1}.
                      </span>
                      <span className="min-w-0">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Visual Illustration */}
              <div className="space-y-2 pt-1">
                <h3 className="text-[18.5px] font-bold text-[#164E63]">Hình minh họa</h3>
                <GuideIllustration
                  illustrationKey={currentFeature.illustrationKey}
                  caption={currentFeature.illustrationCaption}
                />
              </div>

              {/* Optional Short Note */}
              {currentFeature.note && (
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 flex items-start gap-3">
                  <Info className="w-5 h-5 text-[#164E63] shrink-0 mt-0.5" />
                  <p className="text-[16px] text-slate-700 leading-relaxed">
                    <strong className="text-slate-900">Lưu ý:</strong> {currentFeature.note}
                  </p>
                </div>
              )}
            </article>
          </section>
        </div>
      </div>
    </div>
  );
};
