import React, { useMemo, useState } from 'react';
import { Check, Download, Plus, Save, Trash2, X } from 'lucide-react';
import {
  buildFunctionGraphSvg,
  compileMathExpression,
  type GraphFunctionSpec,
} from '../../engines/geometry/safeMathParser';
import { sanitizeSvgMarkup, triggerDownload } from '../../engines/pdf/pdfEngine';
import { useStudioStore } from '../../stores/useStudioStore';

interface FunctionGraphModalProps {
  onClose: () => void;
}

const PRESET_COLORS = ['#087F70', '#DC2626', '#2563EB', '#D97706', '#7C3AED'];

export const FunctionGraphModal: React.FC<FunctionGraphModalProps> = ({ onClose }) => {
  const documents = useStudioStore((s) => s.documents);
  const activeDocId = useStudioStore((s) => s.activeDocId);
  const addObject = useStudioStore((s) => s.addObject);
  const addCustomShape = useStudioStore((s) => s.addCustomShape);
  const notify = useStudioStore((s) => s.notify);

  const [functions, setFunctions] = useState<GraphFunctionSpec[]>([
    { id: 'f1', expression: 'a*x^3 - 3*x + b', color: '#087F70', visible: true, inequality: 'none' },
    { id: 'f2', expression: '0.5*x + c', color: '#DC2626', visible: true, inequality: 'none' },
  ]);
  const [paramA, setParamA] = useState(1);
  const [paramB, setParamB] = useState(0);
  const [paramC, setParamC] = useState(1);
  const [xMin, setXMin] = useState(-5);
  const [xMax, setXMax] = useState(5);
  const [yMin, setYMin] = useState(-5);
  const [yMax, setYMax] = useState(5);
  const [showGrid, setShowGrid] = useState(true);
  const [showExtrema, setShowExtrema] = useState(true);
  const [showAsymptotes, setShowAsymptotes] = useState(true);
  const [showIntersections, setShowIntersections] = useState(true);

  const exprErrors = useMemo(() => {
    const errs: string[] = [];
    for (const fn of functions) {
      if (!fn.visible) continue;
      const compiled = compileMathExpression(fn.expression);
      if (compiled.error) errs.push(`"${fn.expression}": ${compiled.error}`);
    }
    return errs;
  }, [functions]);

  const graphResult = useMemo(
    () =>
      buildFunctionGraphSvg({
        functions,
        params: { a: paramA, b: paramB, c: paramC },
        xMin,
        xMax,
        yMin,
        yMax,
        width: 560,
        height: 400,
        showGrid,
        showExtrema,
        showAsymptotes,
        showIntersections,
      }),
    [functions, paramA, paramB, paramC, xMin, xMax, yMin, yMax, showGrid, showExtrema, showAsymptotes, showIntersections]
  );

  const addFn = () => {
    const idx = functions.length;
    setFunctions((prev) => [
      ...prev,
      {
        id: `f-${Date.now()}`,
        expression: 'sin(x)',
        color: PRESET_COLORS[idx % PRESET_COLORS.length],
        visible: true,
        inequality: 'none',
      },
    ]);
  };

  const handleInsertToPdf = () => {
    const doc = documents.find((d) => d.id === activeDocId);
    if (!doc) return;
    const page = doc.pages[doc.currentPageIndex];
    if (!page) return;
    addObject({
      id: `graph-${Date.now()}`,
      type: 'diagram',
      pageId: page.id,
      x: 110,
      y: 160,
      width: 280,
      height: 200,
      rotation: 0,
      zIndex: 25,
      opacity: 1,
      title: 'Đồ thị hàm số',
      subject: 'math',
      svgMarkup: graphResult.svgMarkup,
      strokeColor: '#087F70',
      strokeWidth: 2,
      strokeStyle: 'solid',
      labels: [],
      sourceKind: 'graph',
    });
    notify('Đã chèn đồ thị hàm số vector SVG vào trang PDF', 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        <div className="bg-[#164E63] text-white px-5 py-3.5 flex items-center justify-between">
          <h2 className="text-[19px] font-bold">Vẽ đồ thị hàm số toán học (An toàn – Không eval – Vector SVG)</h2>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/15 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-auto grid grid-cols-1 lg:grid-cols-12 min-h-0">
          {/* Left Controls */}
          <div className="lg:col-span-5 p-4 border-r border-slate-200 space-y-4 overflow-y-auto text-[14px]">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#164E63] text-[15px]">Danh sách hàm số y = f(x)</span>
              <button
                type="button"
                onClick={addFn}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#E6F1EF] hover:bg-[#087F70] text-[#164E63] hover:text-white font-semibold text-[13px] cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Thêm hàm
              </button>
            </div>

            <div className="space-y-2">
              {functions.map((fn) => (
                <div key={fn.id} className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={fn.color}
                      onChange={(e) =>
                        setFunctions((prev) =>
                          prev.map((f) => (f.id === fn.id ? { ...f, color: e.target.value } : f))
                        )
                      }
                      className="w-7 h-7 rounded border border-slate-300 cursor-pointer shrink-0"
                    />
                    <input
                      type="text"
                      value={fn.expression}
                      onChange={(e) =>
                        setFunctions((prev) =>
                          prev.map((f) => (f.id === fn.id ? { ...f, expression: e.target.value } : f))
                        )
                      }
                      placeholder="VD: (x^2 - 1)/(x - 2), sin(x), abs(x)"
                      className="flex-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-mono text-[13.5px]"
                    />
                    <button
                      type="button"
                      onClick={() => setFunctions((prev) => prev.filter((f) => f.id !== fn.id))}
                      className="p-1.5 text-slate-400 hover:text-[#DC2626] cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-[12.5px] text-slate-600">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={fn.visible}
                        onChange={(e) =>
                          setFunctions((prev) =>
                            prev.map((f) => (f.id === fn.id ? { ...f, visible: e.target.checked } : f))
                          )
                        }
                        className="accent-[#087F70]"
                      />
                      <span>Hiển thị</span>
                    </label>
                    <select
                      value={fn.inequality || 'none'}
                      onChange={(e) =>
                        setFunctions((prev) =>
                          prev.map((f) =>
                            f.id === fn.id
                              ? {
                                  ...f,
                                  inequality: e.target.value as 'none' | 'gt' | 'lt',
                                }
                              : f
                          )
                        )
                      }
                      className="rounded border border-slate-300 bg-white px-2 py-0.5 text-[12px]"
                    >
                      <option value="none">Không tô miền</option>
                      <option value="gt">Tô miền y ≥ f(x)</option>
                      <option value="lt">Tô miền y ≤ f(x)</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>

            {exprErrors.length > 0 && (
              <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-[#DC2626] text-[13px]">
                {exprErrors.join(' · ')}
              </div>
            )}

            {/* Dynamic Parameters a, b, c */}
            <div className="p-3 rounded-xl bg-[#F4F8F7] border border-teal-200/70 space-y-2">
              <div className="font-semibold text-[#164E63]">Thanh trượt tham số động (a, b, c)</div>
              {(
                [
                  ['a', paramA, setParamA],
                  ['b', paramB, setParamB],
                  ['c', paramC, setParamC],
                ] as const
              ).map(([name, val, setter]) => (
                <div key={name} className="flex items-center gap-2">
                  <span className="w-8 font-mono font-bold text-[#087F70]">{name} =</span>
                  <input
                    type="range"
                    min={-4}
                    max={4}
                    step={0.1}
                    value={val}
                    onChange={(e) => setter(Number(e.target.value))}
                    className="flex-1 accent-[#087F70]"
                  />
                  <span className="w-10 text-right font-mono tabular-nums">{val.toFixed(1)}</span>
                </div>
              ))}
            </div>

            {/* Domain & Range */}
            <div className="grid grid-cols-4 gap-2 text-[13px]">
              <label>
                <span className="text-slate-500">xMin</span>
                <input type="number" value={xMin} onChange={(e) => setXMin(Number(e.target.value))} className="w-full rounded border border-slate-300 px-1.5 py-1 tabular-nums" />
              </label>
              <label>
                <span className="text-slate-500">xMax</span>
                <input type="number" value={xMax} onChange={(e) => setXMax(Number(e.target.value))} className="w-full rounded border border-slate-300 px-1.5 py-1 tabular-nums" />
              </label>
              <label>
                <span className="text-slate-500">yMin</span>
                <input type="number" value={yMin} onChange={(e) => setYMin(Number(e.target.value))} className="w-full rounded border border-slate-300 px-1.5 py-1 tabular-nums" />
              </label>
              <label>
                <span className="text-slate-500">yMax</span>
                <input type="number" value={yMax} onChange={(e) => setYMax(Number(e.target.value))} className="w-full rounded border border-slate-300 px-1.5 py-1 tabular-nums" />
              </label>
            </div>

            <div className="flex flex-wrap gap-3 text-[13.5px]">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)} className="accent-[#087F70]" />
                <span>Lưới tọa độ</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={showExtrema} onChange={(e) => setShowExtrema(e.target.checked)} className="accent-[#087F70]" />
                <span>Điểm cực trị</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={showAsymptotes} onChange={(e) => setShowAsymptotes(e.target.checked)} className="accent-[#087F70]" />
                <span>Tiệm cận</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={showIntersections} onChange={(e) => setShowIntersections(e.target.checked)} className="accent-[#087F70]" />
                <span>Giao điểm</span>
              </label>
            </div>
          </div>

          {/* Right Live SVG Graph Preview */}
          <div className="lg:col-span-7 bg-[#F4F8F7] p-5 flex flex-col items-center justify-center">
            <div
              className="w-full max-w-[580px] bg-white rounded-xl border border-slate-300 shadow-sm p-2 [&>svg]:w-full [&>svg]:h-auto"
              dangerouslySetInnerHTML={{ __html: sanitizeSvgMarkup(graphResult.svgMarkup) }}
            />
            <p className="text-[13px] text-slate-500 mt-3 text-center">
              Hỗ trợ: <code>x^3, sqrt(x), abs(x), sin(x), cos(x), tan(x), ln(x), log(x), exp(x), pi, e</code>. Tự động ngắt nhánh tại tiệm cận đứng.
            </p>
          </div>
        </div>

        <div className="px-5 py-3.5 bg-white border-t border-slate-200 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() =>
              triggerDownload(
                new Blob([graphResult.svgMarkup], { type: 'image/svg+xml;charset=utf-8' }),
                'Do_thi_ham_so.svg'
              )
            }
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-[14px] font-semibold cursor-pointer"
          >
            <Download className="w-4 h-4" /> Xuất SVG
          </button>
          <button
            type="button"
            onClick={() =>
              addCustomShape({
                id: `graph-cs-${Date.now()}`,
                title: `Đồ thị ${functions[0]?.expression || 'f(x)'}`,
                subject: 'math',
                svgMarkup: graphResult.svgMarkup,
                createdAt: Date.now(),
              })
            }
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#E6F1EF] hover:bg-teal-100 text-[#164E63] text-[14px] font-semibold cursor-pointer"
          >
            <Save className="w-4 h-4" /> Lưu cá nhân
          </button>
          <button
            type="button"
            onClick={handleInsertToPdf}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#087F70] hover:bg-[#06695d] text-white text-[14.5px] font-semibold cursor-pointer"
          >
            <Check className="w-4 h-4" /> Chèn vector vào PDF
          </button>
        </div>
      </div>
    </div>
  );
};
