import React, { useMemo, useState } from 'react';
import { Box, Compass, FilePlus2, HelpCircle, LineChart, Plus, Search, Trash2 } from 'lucide-react';
import {
  getPrioritizedDiagrams,
  type ScientificDiagramItem,
} from '../../engines/geometry/diagramLibrary';
import { safeSanitizeSvgMarkup } from '../../utils/svgSanitizer';
import { useStudioStore } from '../../stores/useStudioStore';
import { createNewBlankDocument } from '../../services/documentActions';
import type { StudioDocument, SubjectCategory } from '../../types/studio';

interface DiagramLibraryPanelProps {
  doc?: StudioDocument | null;
}

function renderSafeThumbnail(
  item: ScientificDiagramItem,
  strokeColor: string,
  showLabels: boolean
): string {
  try {
    const labelOverrides = showLabels
      ? []
      : (item.defaultLabels || []).map((l) => ({ id: l.id, text: '', dx: 0, dy: 0 }));
    const raw = item.render({
      strokeColor,
      strokeWidth: 1.5,
      labels: labelOverrides,
    });
    return safeSanitizeSvgMarkup(raw);
  } catch {
    return safeSanitizeSvgMarkup('');
  }
}

export const DiagramLibraryPanel: React.FC<DiagramLibraryPanelProps> = ({ doc }) => {
  const addObject = useStudioStore((s) => s.addObject);
  const setActiveModal = useStudioStore((s) => s.setActiveModal);
  const openGuide = useStudioStore((s) => s.openGuide);
  const customShapes = useStudioStore((s) => s.customShapes);
  const removeCustomShape = useStudioStore((s) => s.removeCustomShape);
  const notify = useStudioStore((s) => s.notify);

  const [tab, setTab] = useState<'library' | 'personal'>('library');
  const [subjectFilter, setSubjectFilter] = useState<'all' | SubjectCategory>('all');
  const [query, setQuery] = useState('');
  const [strokeColor, setStrokeColor] = useState('#164E63');
  const [strokeWidth, setStrokeWidth] = useState(1.8);
  const [showLabels, setShowLabels] = useState(true);

  const prioritized = useMemo(
    () => getPrioritizedDiagrams(doc?.subjectHint || 'general'),
    [doc?.subjectHint]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return prioritized.filter((item) => {
      if (subjectFilter !== 'all' && item.subject !== subjectFilter) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.group.toLowerCase().includes(q)
      );
    });
  }, [prioritized, subjectFilter, query]);

  const buildLabelOverrides = (item: ScientificDiagramItem) =>
    showLabels ? [] : (item.defaultLabels || []).map((l) => ({ id: l.id, text: '', dx: 0, dy: 0 }));

  const insertDiagram = (item: ScientificDiagramItem) => {
    if (!doc) {
      notify('Vui lòng mở một tệp PDF hoặc nhấn "Tạo trang A4 trống" để chèn hình vẽ.', 'info');
      return;
    }
    const page = doc.pages[doc.currentPageIndex];
    if (!page) return;
    try {
      const svg = item.render({ strokeColor, strokeWidth, labels: buildLabelOverrides(item) });
      addObject({
        id: `diag-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        type: 'diagram',
        pageId: page.id,
        x: Math.round(Math.max(40, (page.width - 210) / 2)),
        y: 160,
        width: 210,
        height: 165,
        rotation: 0,
        zIndex: 22,
        opacity: 1,
        title: item.title,
        diagramKey: item.key,
        subject: item.subject,
        svgMarkup: safeSanitizeSvgMarkup(svg),
        strokeColor,
        strokeWidth,
        strokeStyle: 'solid',
        labels: [],
        sourceKind: 'library',
      });
      notify(`Đã chèn hình vector "${item.title}" vào trang PDF`, 'success');
    } catch {
      notify(`Không thể tạo hình "${item.title}". Vui lòng thử mẫu khác.`, 'error');
    }
  };

  const insertCustomSvg = (title: string, subject: SubjectCategory, svgMarkup: string) => {
    if (!doc) {
      notify('Vui lòng mở một tệp PDF hoặc tạo trang trắng trước khi chèn hình.', 'info');
      return;
    }
    const page = doc.pages[doc.currentPageIndex];
    if (!page) return;
    addObject({
      id: `custom-diag-${Date.now()}`,
      type: 'diagram',
      pageId: page.id,
      x: Math.round(Math.max(40, (page.width - 210) / 2)),
      y: 160,
      width: 210,
      height: 165,
      rotation: 0,
      zIndex: 22,
      opacity: 1,
      title,
      subject,
      svgMarkup: safeSanitizeSvgMarkup(svgMarkup),
      strokeColor,
      strokeWidth,
      strokeStyle: 'solid',
      labels: [],
      sourceKind: 'library',
    });
    notify(`Đã chèn "${title}" từ thư viện cá nhân`, 'success');
  };

  return (
    <div className="p-3.5 space-y-3.5 text-[15px] text-slate-800">
      {/* Header + Contextual Help */}
      <div className="flex items-center justify-between gap-2">
        <div className="font-bold text-[#164E63] text-[15.5px]">Thư viện hình vẽ khoa học</div>
        <button
          type="button"
          onClick={() => openGuide('diagrams-graphs', 'thu-vien-hinh')}
          title="Hướng dẫn sử dụng Thư viện hình vẽ"
          className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[#E6F1EF] hover:bg-[#087F70] text-[#164E63] hover:text-white text-[13.5px] font-semibold transition-colors cursor-pointer"
        >
          <HelpCircle className="w-4 h-4" />
          <span>Hướng dẫn</span>
        </button>
      </div>

      {/* Independent preview notice when no PDF is open */}
      {!doc && (
        <div className="rounded-xl bg-teal-50/80 border border-teal-200 p-3 text-[13.5px] text-[#164E63] space-y-2">
          <div>
            Thầy/cô đang xem trước <strong>{prioritized.length} hình khoa học</strong>. Mở tài liệu PDF hoặc tạo trang trắng để chèn trực tiếp.
          </div>
          <button
            type="button"
            onClick={() => createNewBlankDocument(1, 'Phiếu bài tập hình học')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#087F70] hover:bg-[#06695d] text-white font-semibold text-[13.5px] cursor-pointer"
          >
            <FilePlus2 className="w-4 h-4" />
            <span>Tạo trang A4 trống để chèn</span>
          </button>
        </div>
      )}

      {/* Studio Launchers */}
      <div className="grid grid-cols-3 gap-1.5">
        <button
          type="button"
          onClick={() => {
            if (!doc) {
              notify('Vui lòng mở hoặc tạo tài liệu PDF trước khi dựng hình 2D.', 'info');
              return;
            }
            setActiveModal('dynamic-2d');
          }}
          className="flex flex-col items-center gap-1 p-2.5 rounded-lg bg-[#E6F1EF] hover:bg-[#087F70] text-[#164E63] hover:text-white font-semibold text-[13px] transition-colors cursor-pointer"
        >
          <Compass className="w-5 h-5" />
          <span>Hình động 2D</span>
        </button>
        <button
          type="button"
          onClick={() => {
            if (!doc) {
              notify('Vui lòng mở hoặc tạo tài liệu PDF trước khi vẽ đồ thị.', 'info');
              return;
            }
            setActiveModal('function-graph');
          }}
          className="flex flex-col items-center gap-1 p-2.5 rounded-lg bg-[#E6F1EF] hover:bg-[#087F70] text-[#164E63] hover:text-white font-semibold text-[13px] transition-colors cursor-pointer"
        >
          <LineChart className="w-5 h-5" />
          <span>Đồ thị hàm</span>
        </button>
        <button
          type="button"
          onClick={() => {
            if (!doc) {
              notify('Vui lòng mở hoặc tạo tài liệu PDF trước khi mở hình 3D.', 'info');
              return;
            }
            setActiveModal('solid-3d');
          }}
          className="flex flex-col items-center gap-1 p-2.5 rounded-lg bg-[#E6F1EF] hover:bg-[#087F70] text-[#164E63] hover:text-white font-semibold text-[13px] transition-colors cursor-pointer"
        >
          <Box className="w-5 h-5" />
          <span>Hình 3D</span>
        </button>
      </div>

      {/* Library vs Personal Tabs */}
      <div className="flex rounded-lg border border-slate-200 overflow-hidden font-semibold text-[14px]">
        <button
          type="button"
          onClick={() => setTab('library')}
          className={`flex-1 py-1.5 cursor-pointer ${
            tab === 'library'
              ? 'bg-[#164E63] text-white'
              : 'bg-white text-slate-700 hover:bg-slate-50'
          }`}
        >
          Thư viện ({prioritized.length} mẫu)
        </button>
        <button
          type="button"
          onClick={() => setTab('personal')}
          className={`flex-1 py-1.5 cursor-pointer ${
            tab === 'personal'
              ? 'bg-[#164E63] text-white'
              : 'bg-white text-slate-700 hover:bg-slate-50'
          }`}
        >
          Cá nhân ({customShapes.length})
        </button>
      </div>

      {tab === 'library' ? (
        <>
          {/* Search & Style Config */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm tam giác, mạch điện, biểu đồ, dòng thời gian, rubric..."
              className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-300 text-[14.5px] focus:border-[#087F70] outline-none"
            />
          </div>

          <div className="flex gap-1 flex-wrap">
            {(
              [
                ['all', 'Tất cả'],
                ['math', 'Toán'],
                ['physics', 'Vật lí'],
                ['chemistry', 'Hóa học'],
                ['biology', 'Sinh học'],
                ['cs', 'Tin học'],
                ['geography', 'Địa lí'],
                ['history', 'Lịch sử'],
                ['english', 'Tiếng Anh'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setSubjectFilter(id)}
                className={`px-2.5 py-1 rounded-md text-[13.5px] font-semibold cursor-pointer ${
                  subjectFilter === id
                    ? 'bg-[#087F70] text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-[#E6F1EF]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between gap-2 bg-slate-50 px-2.5 py-2 rounded-lg border border-slate-200 text-[13.5px]">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={showLabels}
                onChange={(e) => setShowLabels(e.target.checked)}
                className="accent-[#087F70]"
              />
              <span>Hiện nhãn</span>
            </label>
            <div className="flex items-center gap-1.5">
              <span>Nét</span>
              <input
                type="number"
                min={1}
                max={4}
                step={0.2}
                value={strokeWidth}
                onChange={(e) => setStrokeWidth(Number(e.target.value))}
                className="w-12 border border-slate-300 rounded px-1 py-0.5 text-center tabular-nums"
              />
              <input
                type="color"
                value={strokeColor}
                onChange={(e) => setStrokeColor(e.target.value)}
                className="w-6 h-6 rounded border border-slate-300 cursor-pointer"
              />
            </div>
          </div>

          {/* Grid of Vector Diagrams — per-item guarded against any bad SVG */}
          <div className="grid grid-cols-2 gap-2">
            {filtered.map((item) => {
              const safeHtml = renderSafeThumbnail(item, strokeColor, showLabels);
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => insertDiagram(item)}
                  className="group rounded-xl border border-slate-200 hover:border-[#087F70] bg-white p-2 text-left transition-all cursor-pointer flex flex-col gap-1.5"
                >
                  <div
                    className="h-24 w-full bg-[#FAFCFB] rounded-lg flex items-center justify-center p-1 overflow-hidden [&>svg]:max-w-full [&>svg]:max-h-full"
                    dangerouslySetInnerHTML={{ __html: safeHtml }}
                  />
                  <div className="text-[13px] font-semibold text-slate-800 leading-tight line-clamp-2 group-hover:text-[#087F70]">
                    {item.title}
                  </div>
                </button>
              );
            })}
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-6 text-slate-500">Không tìm thấy hình phù hợp.</div>
          )}
        </>
      ) : (
        <div className="space-y-2.5">
          {customShapes.length === 0 ? (
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-slate-600 text-[14px] leading-relaxed">
              Chưa có hình tự vẽ nào được lưu. Thầy/cô có thể dựng hình trong{' '}
              <strong>Hình học động 2D</strong> hoặc <strong>Đồ thị hàm số</strong> rồi nhấn{' '}
              <em>Lưu vào thư viện cá nhân</em>.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {customShapes.map((cs) => (
                <div
                  key={cs.id}
                  className="rounded-xl border border-slate-200 bg-white p-2 flex flex-col gap-1.5"
                >
                  <div
                    onClick={() => insertCustomSvg(cs.title, cs.subject, cs.svgMarkup)}
                    className="h-24 w-full bg-[#FAFCFB] rounded flex items-center justify-center p-1 cursor-pointer [&>svg]:max-w-full [&>svg]:max-h-full"
                    dangerouslySetInnerHTML={{ __html: safeSanitizeSvgMarkup(cs.svgMarkup) }}
                  />
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[13px] font-semibold truncate">{cs.title}</span>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => insertCustomSvg(cs.title, cs.subject, cs.svgMarkup)}
                        className="p-1 rounded hover:bg-[#E6F1EF] text-[#087F70] cursor-pointer"
                        title="Chèn vào PDF"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeCustomShape(cs.id)}
                        className="p-1 rounded hover:bg-red-50 text-[#DC2626] cursor-pointer"
                        title="Xóa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
