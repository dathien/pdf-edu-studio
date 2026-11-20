import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MathfieldElement } from 'mathlive';
import { Check, Code2, Eye, EyeOff, RotateCcw, Sigma } from 'lucide-react';
import {
  compileLatexToSvg,
  compileTypstToSvg,
  SUBJECT_SYMBOLS,
  SUBJECT_TEMPLATES,
} from '../../engines/mathematics/formulaEngine';
import { safeSanitizeSvgMarkup as sanitizeSvgMarkup } from '../../utils/svgSanitizer';
import { useStudioStore } from '../../stores/useStudioStore';
import type { FormulaStudioObject, StudioDocument, SubjectCategory } from '../../types/studio';

// Configure MathLive to load bundled local fonts (ZERO offline CDN requests!)
MathfieldElement.fontsDirectory = '/mathlive/fonts';
MathfieldElement.soundsDirectory = null;

interface FormulaPanelProps {
  doc: StudioDocument;
}

const SUBJECT_TABS: Array<{ id: Exclude<SubjectCategory, 'general'>; label: string }> = [
  { id: 'math', label: 'Toán' },
  { id: 'physics', label: 'Vật lí' },
  { id: 'chemistry', label: 'Hóa học' },
  { id: 'biology', label: 'Sinh học' },
  { id: 'cs', label: 'Tin học' },
];

export const FormulaPanel: React.FC<FormulaPanelProps> = ({ doc }) => {
  const editingFormulaObjectId = useStudioStore((s) => s.editingFormulaObjectId);
  const setEditingFormulaObjectId = useStudioStore((s) => s.setEditingFormulaObjectId);
  const addObject = useStudioStore((s) => s.addObject);
  const updateObject = useStudioStore((s) => s.updateObject);
  const notify = useStudioStore((s) => s.notify);

  const editingObj = useMemo(
    () =>
      doc.objects.find(
        (o): o is FormulaStudioObject => o.id === editingFormulaObjectId && o.type === 'formula'
      ) || null,
    [doc.objects, editingFormulaObjectId]
  );

  const [mode, setMode] = useState<'visual' | 'typst'>('visual');
  const [subjectTab, setSubjectTab] = useState<Exclude<SubjectCategory, 'general'>>(
    doc.subjectHint === 'general' ? 'math' : doc.subjectHint
  );
  const [latex, setLatex] = useState<string>(editingObj?.latex || 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}');
  const [typstCode, setTypstCode] = useState<string>(
    editingObj?.typst || 'integral_0^pi sin(x) dx = 2'
  );
  const [color, setColor] = useState<string>(editingObj?.color || '#164E63');
  const [fontSize, setFontSize] = useState<number>(editingObj?.fontSize || 16);
  const [showRawLatex, setShowRawLatex] = useState<boolean>(false);

  const hostRef = useRef<HTMLDivElement>(null);
  const mfRef = useRef<MathfieldElement | null>(null);

  // Sync state when clicking an existing formula object to edit
  useEffect(() => {
    if (editingObj) {
      setLatex(editingObj.latex);
      setColor(editingObj.color);
      setFontSize(editingObj.fontSize);
      if (editingObj.typst) {
        setTypstCode(editingObj.typst);
        setMode('typst');
      } else {
        setMode('visual');
      }
      if (mfRef.current) {
        mfRef.current.value = editingObj.latex;
      }
    }
  }, [editingObj]);

  // Mount MathLive web component imperatively for 100% React 19 compatibility
  useEffect(() => {
    if (mode !== 'visual') return;
    const host = hostRef.current;
    if (!host) return;
    host.innerHTML = '';
    const mf = new MathfieldElement();
    mf.value = latex;
    mf.mathVirtualKeyboardPolicy = 'manual';
    mf.style.width = '100%';
    mf.addEventListener('input', () => {
      setLatex(mf.value);
    });
    host.appendChild(mf);
    mfRef.current = mf;

    return () => {
      mfRef.current = null;
      host.innerHTML = '';
    };
    // Intentionally recreate only when switching to visual mode
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const compiled = useMemo(() => {
    if (mode === 'typst') {
      const res = compileTypstToSvg(typstCode, color, fontSize);
      return { latex: res.latex, svgMarkup: res.svg.svgMarkup, widthPx: res.svg.widthPx, heightPx: res.svg.heightPx };
    }
    const svg = compileLatexToSvg(latex || '\\text{ }', color, fontSize);
    return { latex, svgMarkup: svg.svgMarkup, widthPx: svg.widthPx, heightPx: svg.heightPx };
  }, [mode, latex, typstCode, color, fontSize]);

  const insertSymbol = (symLatex: string) => {
    if (mode === 'typst') {
      setTypstCode((prev) => `${prev} ${symLatex}`);
      return;
    }
    if (mfRef.current) {
      mfRef.current.executeCommand(['insert', symLatex]);
      mfRef.current.focus();
      setLatex(mfRef.current.value);
    } else {
      setLatex((prev) => `${prev}${symLatex}`);
    }
  };

  const applyTemplate = (tplLatex: string) => {
    setMode('visual');
    setLatex(tplLatex);
    if (mfRef.current) {
      mfRef.current.value = tplLatex;
      mfRef.current.focus();
    }
  };

  const handleApplyToPdf = () => {
    const page = doc.pages[doc.currentPageIndex];
    if (!page) return;
    const widthPt = Math.max(46, Math.min(page.width - 60, Math.round(compiled.widthPx * 0.85)));
    const heightPt = Math.max(22, Math.round(compiled.heightPx * 0.85));

    if (editingObj) {
      updateObject(
        editingObj.id,
        {
          latex: compiled.latex,
          typst: mode === 'typst' ? typstCode : undefined,
          svgMarkup: compiled.svgMarkup,
          color,
          fontSize,
          width: widthPt,
          height: heightPt,
        },
        true
      );
      setEditingFormulaObjectId(null);
      notify('Đã cập nhật công thức vector trên trang PDF', 'success');
    } else {
      addObject({
        id: `formula-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        type: 'formula',
        pageId: page.id,
        x: Math.round(Math.max(48, (page.width - widthPt) / 2)),
        y: 160,
        width: widthPt,
        height: heightPt,
        rotation: 0,
        zIndex: 25,
        opacity: 1,
        latex: compiled.latex,
        typst: mode === 'typst' ? typstCode : undefined,
        svgMarkup: compiled.svgMarkup,
        color,
        fontSize,
      });
      notify('Đã chèn công thức vector sắc nét vào trang hiện tại', 'success');
    }
  };

  return (
    <div className="p-4 space-y-4 text-[14.5px] text-slate-800">
      {/* Header & Mode Switch */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 font-bold text-[#164E63] text-[15.5px]">
          <Sigma className="w-5 h-5 text-[#087F70]" />
          <span>{editingObj ? 'Chỉnh sửa công thức' : 'Soạn công thức'}</span>
        </div>
        <div className="flex rounded-lg border border-slate-200 overflow-hidden text-[13px] font-semibold">
          <button
            type="button"
            onClick={() => setMode('visual')}
            className={`px-2.5 py-1 cursor-pointer ${
              mode === 'visual' ? 'bg-[#087F70] text-white' : 'bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            Trực quan
          </button>
          <button
            type="button"
            onClick={() => setMode('typst')}
            className={`px-2.5 py-1 cursor-pointer flex items-center gap-1 ${
              mode === 'typst' ? 'bg-[#087F70] text-white' : 'bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Typst</span>
          </button>
        </div>
      </div>

      {/* Visual MathLive Field or Typst Editor */}
      {mode === 'visual' ? (
        <div className="space-y-2">
          <div ref={hostRef} className="w-full" />
          <div className="flex items-center justify-between text-[13px] text-slate-500">
            <span>Gõ trực tiếp hoặc nhấn nút ký hiệu bên dưới</span>
            <button
              type="button"
              onClick={() => setShowRawLatex(!showRawLatex)}
              className="flex items-center gap-1 text-[#087F70] hover:underline cursor-pointer"
            >
              {showRawLatex ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{showRawLatex ? 'Ẩn mã LaTeX' : 'Hiện mã LaTeX'}</span>
            </button>
          </div>
          {showRawLatex && (
            <textarea
              rows={2}
              value={latex}
              onChange={(e) => {
                setLatex(e.target.value);
                if (mfRef.current) mfRef.current.value = e.target.value;
              }}
              className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 font-mono text-[13px] bg-slate-50"
            />
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <textarea
            rows={3}
            value={typstCode}
            onChange={(e) => setTypstCode(e.target.value)}
            placeholder="Ví dụ: frac(-b plus.minus sqrt(b^2 - 4 a c), 2a)"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-[13.5px] focus:border-[#087F70] outline-none"
          />
          <div className="text-[12.5px] text-slate-500">
            Hỗ trợ cú pháp toán Typst: <code>frac(a, b)</code>, <code>sqrt(x)</code>, <code>integral_a^b</code>, <code>sum_(i=1)^n</code>, <code>lim_(x -&gt; 0)</code>, <code>alpha</code>, <code>arrow.r</code>.
          </div>
        </div>
      )}

      {/* Live Pure Vector SVG Preview */}
      <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-1.5">
        <div className="text-[12.5px] font-semibold text-slate-500">Xem trước vector SVG (xuất nét ở mọi độ phóng)</div>
        <div
          className="min-h-[48px] flex items-center justify-center overflow-x-auto py-1"
          dangerouslySetInnerHTML={{ __html: sanitizeSvgMarkup(compiled.svgMarkup) }}
        />
      </div>

      {/* Size & Color */}
      <div className="grid grid-cols-2 gap-3">
        <label className="space-y-1">
          <span className="text-[13px] text-slate-600">Cỡ chữ ({fontSize} pt)</span>
          <input
            type="range"
            min={11}
            max={34}
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            className="w-full accent-[#087F70]"
          />
        </label>
        <div className="flex items-center justify-between">
          <span className="text-[13px] text-slate-600">Màu mực</span>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-9 h-7 rounded border border-slate-300 cursor-pointer"
          />
        </div>
      </div>

      {/* Apply / Cancel Actions */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleApplyToPdf}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-[#087F70] hover:bg-[#06695d] text-white font-semibold cursor-pointer shadow-xs"
        >
          <Check className="w-4 h-4" />
          <span>{editingObj ? 'Cập nhật công thức' : 'Chèn vào trang PDF'}</span>
        </button>
        {editingObj && (
          <button
            type="button"
            onClick={() => setEditingFormulaObjectId(null)}
            className="px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium cursor-pointer"
          >
            Hủy
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            setLatex('');
            setTypstCode('');
            if (mfRef.current) mfRef.current.value = '';
          }}
          title="Xóa trắng"
          className="p-2.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* 5-Subject Symbol Tabs */}
      <div className="pt-2 border-t border-slate-200 space-y-2.5">
        <div className="flex gap-1 overflow-x-auto pb-0.5">
          {SUBJECT_TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSubjectTab(t.id)}
              className={`px-2.5 py-1 rounded-md text-[13.5px] font-semibold whitespace-nowrap cursor-pointer ${
                subjectTab === t.id
                  ? 'bg-[#164E63] text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-[#E6F1EF]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Symbol Buttons Grid */}
        <div className="grid grid-cols-4 gap-1.5">
          {SUBJECT_SYMBOLS[subjectTab].map((sym) => (
            <button
              key={sym.label}
              type="button"
              onClick={() => insertSymbol(sym.latex)}
              title={sym.tooltip}
              className="py-1.5 px-1 rounded-lg border border-slate-200 bg-white hover:border-[#087F70] hover:bg-[#F4F8F7] text-[14px] font-semibold text-slate-800 cursor-pointer truncate"
            >
              {sym.label}
            </button>
          ))}
        </div>

        {/* Quick Formula Templates for Active Subject */}
        <div className="space-y-1.5 pt-1">
          <div className="text-[13px] font-semibold text-slate-500">Mẫu công thức thường dùng</div>
          <div className="space-y-1.5">
            {SUBJECT_TEMPLATES[subjectTab].map((tpl) => (
              <button
                key={tpl.name}
                type="button"
                onClick={() => applyTemplate(tpl.latex)}
                className="w-full text-left px-3 py-2 rounded-lg border border-slate-200 bg-white hover:border-[#087F70] hover:bg-[#F4F8F7] text-[13.5px] font-medium text-slate-800 cursor-pointer transition-colors"
              >
                {tpl.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
