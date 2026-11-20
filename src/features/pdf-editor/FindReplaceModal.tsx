import React, { useState } from 'react';
import { Replace, Search, X } from 'lucide-react';
import { extractPageTextBlocks, openPdfDocument } from '../../engines/pdf/pdfEngine';
import { useStudioStore } from '../../stores/useStudioStore';
import type { ExtractedTextBlock, StudioObject } from '../../types/studio';

interface FindReplaceModalProps {
  onClose: () => void;
}

interface SearchHit {
  id: string;
  pageIndex: number;
  pageId: string;
  source: 'object' | 'pdf-base';
  text: string;
  objectId?: string;
  block?: ExtractedTextBlock;
}

export const FindReplaceModal: React.FC<FindReplaceModalProps> = ({ onClose }) => {
  const documents = useStudioStore((s) => s.documents);
  const activeDocId = useStudioStore((s) => s.activeDocId);
  const setCurrentPageIndex = useStudioStore((s) => s.setCurrentPageIndex);
  const updateObject = useStudioStore((s) => s.updateObject);
  const addObject = useStudioStore((s) => s.addObject);
  const selectObjects = useStudioStore((s) => s.selectObjects);
  const notify = useStudioStore((s) => s.notify);

  const doc = documents.find((d) => d.id === activeDocId) || null;
  const [query, setQuery] = useState('');
  const [replacement, setReplacement] = useState('');
  const [matchCase, setMatchCase] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [scope, setScope] = useState<'all' | 'current'>('all');
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [searching, setSearching] = useState(false);

  const buildRegex = () => {
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = wholeWord ? `\\b${escaped}\\b` : escaped;
    return new RegExp(pattern, matchCase ? 'g' : 'gi');
  };

  const handleSearch = async () => {
    if (!doc || !query.trim()) return;
    setSearching(true);
    try {
      const rx = buildRegex();
      const found: SearchHit[] = [];
      const pageIndices =
        scope === 'current'
          ? [doc.currentPageIndex]
          : doc.pages.map((_, idx) => idx);

      // 1. Search editable text objects
      for (const pIdx of pageIndices) {
        const pg = doc.pages[pIdx];
        if (!pg) continue;
        const txtObjs = doc.objects.filter(
          (o): o is Extract<StudioObject, { type: 'text' }> =>
            o.type === 'text' && o.pageId === pg.id
        );
        for (const o of txtObjs) {
          if (rx.test(o.content)) {
            found.push({
              id: `hit-obj-${o.id}`,
              pageIndex: pIdx,
              pageId: pg.id,
              source: 'object',
              text: o.content,
              objectId: o.id,
            });
          }
          rx.lastIndex = 0;
        }
      }

      // 2. Search original PDF text layer
      const handle = await openPdfDocument(doc.currentPdfBytes);
      try {
        for (const pIdx of pageIndices) {
          const pg = doc.pages[pIdx];
          if (!pg || pg.sourcePageIndex < 0) continue;
          const blocks = await extractPageTextBlocks(handle.proxy, pg.sourcePageIndex);
          for (const blk of blocks) {
            if (rx.test(blk.text)) {
              found.push({
                id: `hit-blk-${blk.id}`,
                pageIndex: pIdx,
                pageId: pg.id,
                source: 'pdf-base',
                text: blk.text,
                block: blk,
              });
            }
            rx.lastIndex = 0;
          }
        }
      } finally {
        await handle.destroy();
      }
      setHits(found);
    } finally {
      setSearching(false);
    }
  };

  const replaceHit = (hit: SearchHit) => {
    const rx = buildRegex();
    const newText = hit.text.replace(rx, replacement);
    if (hit.source === 'object' && hit.objectId) {
      updateObject(hit.objectId, { content: newText }, true);
    } else if (hit.source === 'pdf-base' && hit.block) {
      addObject({
        id: `rep-txt-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        type: 'text',
        pageId: hit.pageId,
        x: Math.round(hit.block.x),
        y: Math.round(hit.block.y),
        width: Math.max(90, Math.round(hit.block.width + 24)),
        height: Math.max(18, Math.round(hit.block.height + 6)),
        rotation: 0,
        zIndex: 26,
        opacity: 1,
        content: newText,
        fontFamily: 'DejaVuSans',
        fontSize: Math.max(8, Math.round(hit.block.fontSize)),
        bold: false,
        italic: false,
        underline: false,
        strikethrough: false,
        color: '#1F2937',
        align: 'left',
        lineHeight: 1.25,
        letterSpacing: 0,
        replacesOriginalRect: {
          x: hit.block.x,
          y: hit.block.y,
          width: hit.block.width,
          height: hit.block.height,
          originalText: hit.block.text,
        },
      });
    }
    setHits((prev) => prev.filter((h) => h.id !== hit.id));
  };

  const handleReplaceAll = () => {
    if (hits.length === 0) return;
    hits.forEach((h) => replaceHit(h));
    notify(`Đã thay thế ${hits.length} vị trí (có thể nhấn Ctrl+Z để hoàn tác).`, 'success');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200">
        <div className="bg-[#164E63] text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            <h2 className="text-[18.5px] font-bold">Tìm kiếm & Thay thế văn bản</h2>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/15 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-[14.5px] text-slate-800">
          <div className="space-y-2.5">
            <div className="flex gap-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Nhập từ hoặc cụm từ cần tìm..."
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 focus:border-[#087F70] outline-none"
              />
              <button
                type="button"
                onClick={handleSearch}
                disabled={searching || !query.trim()}
                className="px-4 py-2 rounded-lg bg-[#087F70] hover:bg-[#06695d] text-white font-semibold cursor-pointer disabled:opacity-40"
              >
                {searching ? 'Đang tìm...' : 'Tìm'}
              </button>
            </div>
            <input
              type="text"
              value={replacement}
              onChange={(e) => setReplacement(e.target.value)}
              placeholder="Thay thế bằng..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-[#087F70] outline-none"
            />
            <div className="flex items-center gap-4 flex-wrap text-[13.5px]">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={matchCase} onChange={(e) => setMatchCase(e.target.checked)} className="accent-[#087F70]" />
                <span>Phân biệt HOA/thường</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={wholeWord} onChange={(e) => setWholeWord(e.target.checked)} className="accent-[#087F70]" />
                <span>Khớp nguyên từ</span>
              </label>
              <select
                value={scope}
                onChange={(e) => setScope(e.target.value as 'all' | 'current')}
                className="rounded border border-slate-300 px-2 py-1 text-[13px]"
              >
                <option value="all">Toàn tài liệu</option>
                <option value="current">Chỉ trang hiện tại</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-slate-200 pt-3">
            <span className="font-semibold text-[#164E63]">
              Kết quả tìm thấy: {hits.length} vị trí
            </span>
            <button
              type="button"
              disabled={hits.length === 0}
              onClick={handleReplaceAll}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#E6F1EF] hover:bg-[#087F70] text-[#164E63] hover:text-white font-semibold text-[13.5px] disabled:opacity-40 cursor-pointer"
            >
              <Replace className="w-4 h-4" /> Thay thế tất cả
            </button>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {hits.map((hit) => (
              <div
                key={hit.id}
                onClick={() => {
                  setCurrentPageIndex(hit.pageIndex);
                  if (hit.objectId) selectObjects([hit.objectId]);
                }}
                className="p-2.5 rounded-lg border border-slate-200 hover:border-[#087F70] bg-slate-50/70 flex items-center justify-between gap-2 cursor-pointer"
              >
                <div className="min-w-0">
                  <div className="text-[12px] font-bold text-[#087F70]">
                    Trang {hit.pageIndex + 1} · {hit.source === 'object' ? 'Lớp chữ đã thêm' : 'Văn bản gốc PDF'}
                  </div>
                  <div className="text-[13.5px] text-slate-800 truncate">{hit.text}</div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    replaceHit(hit);
                    notify('Đã thay thế 1 vị trí', 'success');
                  }}
                  className="px-2.5 py-1 rounded bg-white border border-slate-300 hover:bg-[#087F70] hover:text-white text-[12.5px] font-semibold shrink-0 cursor-pointer"
                >
                  Thay
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
