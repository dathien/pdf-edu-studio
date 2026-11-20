import React from 'react';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowDownToLine,
  ArrowUpToLine,
  Bold,
  Copy,
  Group,
  Italic,
  Lock,
  Plus,
  Strikethrough,
  Trash2,
  Underline,
  Ungroup,
  Unlock,
} from 'lucide-react';
import { useStudioStore } from '../../stores/useStudioStore';
import type { StudioDocument } from '../../types/studio';

interface PropertiesPanelProps {
  doc: StudioDocument;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ doc }) => {
  const selectedObjectIds = useStudioStore((s) => s.selectedObjectIds);
  const updateObject = useStudioStore((s) => s.updateObject);
  const deleteObjects = useStudioStore((s) => s.deleteObjects);
  const duplicateSelected = useStudioStore((s) => s.duplicateSelected);
  const bringToFront = useStudioStore((s) => s.bringToFront);
  const sendToBack = useStudioStore((s) => s.sendToBack);
  const alignSelected = useStudioStore((s) => s.alignSelected);
  const groupSelected = useStudioStore((s) => s.groupSelected);
  const ungroupSelected = useStudioStore((s) => s.ungroupSelected);
  const setEditingFormulaObjectId = useStudioStore((s) => s.setEditingFormulaObjectId);
  const activeTool = useStudioStore((s) => s.activeTool);
  const penColor = useStudioStore((s) => s.penColor);
  const penWidth = useStudioStore((s) => s.penWidth);
  const penOpacity = useStudioStore((s) => s.penOpacity);
  const setPenConfig = useStudioStore((s) => s.setPenConfig);

  const selectedObjs = doc.objects.filter((o) => selectedObjectIds.includes(o.id));
  const single = selectedObjs.length === 1 ? selectedObjs[0] : null;

  return (
    <div className="p-4 space-y-5 text-[14.5px] text-slate-800">
      {/* Freehand Pen / Highlighter Settings when drawing tool active */}
      {(activeTool === 'pen' || activeTool === 'highlighter') && (
        <div className="p-3.5 rounded-xl bg-[#F4F8F7] border border-teal-200/80 space-y-3">
          <div className="font-bold text-[#164E63] text-[15px]">
            {activeTool === 'pen' ? 'Thiết lập Bút vẽ tay' : 'Thiết lập Bút dạ quang'}
          </div>
          <div className="flex items-center justify-between gap-2">
            <span>Màu nét</span>
            <div className="flex items-center gap-1.5">
              {['#DC2626', '#087F70', '#1D4ED8', '#1F2937', '#D97706'].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setPenConfig({ penColor: c })}
                  style={{ backgroundColor: c }}
                  className={`w-6 h-6 rounded-full border-2 cursor-pointer ${
                    penColor === c ? 'border-slate-900 scale-110' : 'border-white'
                  }`}
                />
              ))}
              <input
                type="color"
                value={penColor}
                onChange={(e) => setPenConfig({ penColor: e.target.value })}
                className="w-7 h-7 rounded cursor-pointer border border-slate-300"
              />
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span>Độ dày nét</span>
              <span className="font-semibold tabular-nums">{penWidth} pt</span>
            </div>
            <input
              type="range"
              min={1}
              max={10}
              step={0.5}
              value={penWidth}
              onChange={(e) => setPenConfig({ penWidth: Number(e.target.value) })}
              className="w-full accent-[#087F70]"
            />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span>Độ mờ (Opacity)</span>
              <span className="font-semibold tabular-nums">{Math.round(penOpacity * 100)}%</span>
            </div>
            <input
              type="range"
              min={0.2}
              max={1}
              step={0.05}
              value={penOpacity}
              onChange={(e) => setPenConfig({ penOpacity: Number(e.target.value) })}
              className="w-full accent-[#087F70]"
            />
          </div>
        </div>
      )}

      {/* Multi-select actions */}
      {selectedObjs.length > 1 && (
        <div className="space-y-3">
          <div className="font-bold text-[#164E63] text-[15.5px]">
            Đang chọn {selectedObjs.length} đối tượng
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => alignSelected('left')}
              className="px-2 py-1.5 rounded border border-slate-200 hover:bg-slate-50 text-[13.5px] cursor-pointer"
            >
              Căn trái
            </button>
            <button
              type="button"
              onClick={() => alignSelected('center')}
              className="px-2 py-1.5 rounded border border-slate-200 hover:bg-slate-50 text-[13.5px] cursor-pointer"
            >
              Căn giữa
            </button>
            <button
              type="button"
              onClick={() => alignSelected('right')}
              className="px-2 py-1.5 rounded border border-slate-200 hover:bg-slate-50 text-[13.5px] cursor-pointer"
            >
              Căn phải
            </button>
            <button
              type="button"
              onClick={() => alignSelected('top')}
              className="px-2 py-1.5 rounded border border-slate-200 hover:bg-slate-50 text-[13.5px] cursor-pointer"
            >
              Căn trên
            </button>
            <button
              type="button"
              onClick={() => alignSelected('bottom')}
              className="px-2 py-1.5 rounded border border-slate-200 hover:bg-slate-50 text-[13.5px] cursor-pointer"
            >
              Căn dưới
            </button>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={groupSelected}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[#E6F1EF] hover:bg-[#087F70] hover:text-white text-[#164E63] font-semibold cursor-pointer"
            >
              <Group className="w-4 h-4" />
              <span>Nhóm</span>
            </button>
            <button
              type="button"
              onClick={ungroupSelected}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-slate-200 hover:bg-slate-100 font-semibold cursor-pointer"
            >
              <Ungroup className="w-4 h-4" />
              <span>Bỏ nhóm</span>
            </button>
          </div>
          <button
            type="button"
            onClick={() => deleteObjects(selectedObjectIds)}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-[#DC2626] font-semibold cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Xóa {selectedObjs.length} đối tượng</span>
          </button>
        </div>
      )}

      {/* No selection state */}
      {selectedObjs.length === 0 && (
        <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-2 text-slate-600">
          <div className="font-semibold text-slate-800">Chưa chọn đối tượng nào</div>
          <p className="text-[14px] leading-relaxed">
            Nhấn vào một khung chữ, công thức, hình vẽ, hình ảnh hoặc dấu chấm trên trang PDF để chỉnh sửa kích thước, màu sắc, vị trí và thứ tự lớp.
          </p>
          <p className="text-[13.5px] text-slate-500">
            Mẹo: Giữ <strong>Shift</strong> khi nhấn để chọn nhiều đối tượng cùng lúc.
          </p>
        </div>
      )}

      {/* Single Selected Object Inspector */}
      {single && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
            <span className="font-bold text-[#164E63] text-[15.5px]">Thuộc tính đối tượng</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => updateObject(single.id, { locked: !single.locked }, true)}
                title={single.locked ? 'Mở khóa vị trí' : 'Khóa vị trí'}
                className={`p-1.5 rounded-md cursor-pointer ${
                  single.locked ? 'bg-amber-100 text-amber-800' : 'hover:bg-slate-100 text-slate-600'
                }`}
              >
                {single.locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={duplicateSelected}
                title="Nhân bản"
                className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600 cursor-pointer"
              >
                <Copy className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => deleteObjects([single.id])}
                title="Xóa (Delete)"
                className="p-1.5 rounded-md hover:bg-red-50 text-[#DC2626] cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Text specific formatting */}
          {single.type === 'text' && (
            <div className="space-y-3">
              <label className="block space-y-1">
                <span className="text-[13.5px] font-medium text-slate-600">Nội dung văn bản</span>
                <textarea
                  rows={3}
                  value={single.content}
                  onChange={(e) => updateObject(single.id, { content: e.target.value }, false)}
                  onBlur={() => updateObject(single.id, { content: single.content }, true)}
                  className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-[14.5px] focus:border-[#087F70] outline-none"
                />
              </label>

              <div className="grid grid-cols-2 gap-2">
                <label className="space-y-1">
                  <span className="text-[13px] text-slate-600">Phông chữ</span>
                  <select
                    value={single.fontFamily}
                    onChange={(e) =>
                      updateObject(single.id, { fontFamily: e.target.value as 'DejaVuSans' | 'DejaVuSerif' }, true)
                    }
                    className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-[14px]"
                  >
                    <option value="DejaVuSans">Không chân (Sans)</option>
                    <option value="DejaVuSerif">Có chân (Serif)</option>
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="text-[13px] text-slate-600">Cỡ chữ (pt)</span>
                  <input
                    type="number"
                    min={7}
                    max={72}
                    value={single.fontSize}
                    onChange={(e) => updateObject(single.id, { fontSize: Math.max(7, Number(e.target.value)) }, true)}
                    className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-[14px] tabular-nums"
                  />
                </label>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => updateObject(single.id, { bold: !single.bold }, true)}
                  className={`p-2 rounded-lg border cursor-pointer ${
                    single.bold ? 'bg-[#087F70] text-white border-[#087F70]' : 'border-slate-200 hover:bg-slate-50'
                  }`}
                  title="In đậm"
                >
                  <Bold className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => updateObject(single.id, { italic: !single.italic }, true)}
                  className={`p-2 rounded-lg border cursor-pointer ${
                    single.italic ? 'bg-[#087F70] text-white border-[#087F70]' : 'border-slate-200 hover:bg-slate-50'
                  }`}
                  title="In nghiêng"
                >
                  <Italic className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => updateObject(single.id, { underline: !single.underline }, true)}
                  className={`p-2 rounded-lg border cursor-pointer ${
                    single.underline ? 'bg-[#087F70] text-white border-[#087F70]' : 'border-slate-200 hover:bg-slate-50'
                  }`}
                  title="Gạch chân"
                >
                  <Underline className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => updateObject(single.id, { strikethrough: !single.strikethrough }, true)}
                  className={`p-2 rounded-lg border cursor-pointer ${
                    single.strikethrough ? 'bg-[#087F70] text-white border-[#087F70]' : 'border-slate-200 hover:bg-slate-50'
                  }`}
                  title="Gạch ngang"
                >
                  <Strikethrough className="w-4 h-4" />
                </button>
                <div className="w-px h-6 bg-slate-200 mx-0.5" />
                <button
                  type="button"
                  onClick={() => updateObject(single.id, { align: 'left' }, true)}
                  className={`p-2 rounded-lg border cursor-pointer ${
                    single.align === 'left' ? 'bg-[#E6F1EF] text-[#087F70] border-[#087F70]' : 'border-slate-200'
                  }`}
                >
                  <AlignLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => updateObject(single.id, { align: 'center' }, true)}
                  className={`p-2 rounded-lg border cursor-pointer ${
                    single.align === 'center' ? 'bg-[#E6F1EF] text-[#087F70] border-[#087F70]' : 'border-slate-200'
                  }`}
                >
                  <AlignCenter className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => updateObject(single.id, { align: 'right' }, true)}
                  className={`p-2 rounded-lg border cursor-pointer ${
                    single.align === 'right' ? 'bg-[#E6F1EF] text-[#087F70] border-[#087F70]' : 'border-slate-200'
                  }`}
                >
                  <AlignRight className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span>Màu chữ</span>
                <input
                  type="color"
                  value={single.color}
                  onChange={(e) => updateObject(single.id, { color: e.target.value }, true)}
                  className="w-9 h-7 rounded cursor-pointer border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <label className="space-y-1">
                  <span className="text-[13px] text-slate-600">Giãn dòng</span>
                  <input
                    type="number"
                    step={0.1}
                    min={1}
                    max={2.5}
                    value={single.lineHeight}
                    onChange={(e) => updateObject(single.id, { lineHeight: Number(e.target.value) }, true)}
                    className="w-full rounded-lg border border-slate-300 px-2 py-1 text-[14px] tabular-nums"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-[13px] text-slate-600">Giãn chữ</span>
                  <input
                    type="number"
                    step={0.5}
                    min={-1}
                    max={8}
                    value={single.letterSpacing}
                    onChange={(e) => updateObject(single.id, { letterSpacing: Number(e.target.value) }, true)}
                    className="w-full rounded-lg border border-slate-300 px-2 py-1 text-[14px] tabular-nums"
                  />
                </label>
              </div>
            </div>
          )}

          {/* Formula quick edit button */}
          {single.type === 'formula' && (
            <div className="space-y-2.5 p-3 rounded-xl bg-[#F4F8F7] border border-teal-200">
              <div className="text-[14px] font-semibold text-[#164E63]">Công thức vector MathLive</div>
              <button
                type="button"
                onClick={() => setEditingFormulaObjectId(single.id)}
                className="w-full py-2 rounded-lg bg-[#087F70] hover:bg-[#06695d] text-white font-semibold cursor-pointer"
              >
                Mở lại trong Trình soạn công thức
              </button>
            </div>
          )}

          {/* Shape formatting */}
          {single.type === 'shape' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span>Màu viền</span>
                <input
                  type="color"
                  value={single.strokeColor}
                  onChange={(e) => updateObject(single.id, { strokeColor: e.target.value }, true)}
                  className="w-9 h-7 rounded border border-slate-300 cursor-pointer"
                />
              </div>
              <div className="flex items-center justify-between">
                <span>Màu nền</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateObject(single.id, { fillColor: 'transparent' }, true)}
                    className="px-2 py-1 rounded border border-slate-200 text-[12.5px] hover:bg-slate-50 cursor-pointer"
                  >
                    Trong suốt
                  </button>
                  <input
                    type="color"
                    value={single.fillColor === 'transparent' ? '#FEF9C3' : single.fillColor}
                    onChange={(e) => updateObject(single.id, { fillColor: e.target.value }, true)}
                    className="w-9 h-7 rounded border border-slate-300 cursor-pointer"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Độ dày viền</span>
                  <span className="tabular-nums font-semibold">{single.strokeWidth} pt</span>
                </div>
                <input
                  type="range"
                  min={0.5}
                  max={8}
                  step={0.5}
                  value={single.strokeWidth}
                  onChange={(e) => updateObject(single.id, { strokeWidth: Number(e.target.value) }, true)}
                  className="w-full accent-[#087F70]"
                />
              </div>
              {single.shapeKind === 'table' && single.tableRows && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const cols = single.tableRows![0]?.length || 3;
                      updateObject(
                        single.id,
                        {
                          tableRows: [...single.tableRows!, Array(cols).fill('Mới')],
                          height: single.height + 24,
                        },
                        true
                      );
                    }}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded border border-slate-300 hover:bg-slate-50 text-[13px] cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Thêm hàng
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      updateObject(
                        single.id,
                        {
                          tableRows: single.tableRows!.map((r) => [...r, 'Cột']),
                          width: single.width + 55,
                        },
                        true
                      );
                    }}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded border border-slate-300 hover:bg-slate-50 text-[13px] cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Thêm cột
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Image keep aspect */}
          {single.type === 'image' && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={single.keepAspect}
                onChange={(e) => updateObject(single.id, { keepAspect: e.target.checked }, true)}
                className="accent-[#087F70] w-4 h-4"
              />
              <span>Giữ đúng tỷ lệ khung hình khi co giãn</span>
            </label>
          )}

          {/* Grading total template */}
          {single.type === 'grading-total' && (
            <div className="space-y-2">
              <span className="text-[13.5px] font-medium text-slate-600">Kiểu khung tổng điểm</span>
              <select
                value={single.template}
                onChange={(e) =>
                  updateObject(
                    single.id,
                    { template: e.target.value as 'full' | 'short' | 'box' | 'with-comment' },
                    true
                  )
                }
                className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5"
              >
                <option value="with-comment">Tổng điểm + Tên HS + Nhận xét</option>
                <option value="full">Tổng điểm + Họ tên học sinh</option>
                <option value="box">Khung Tổng điểm gọn</option>
                <option value="short">Chỉ hiển thị điểm số (VD: 8,5/10)</option>
              </select>
            </div>
          )}

          {/* Common geometry & layer controls */}
          <div className="pt-3 border-t border-slate-200 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <label className="space-y-0.5">
                <span className="text-[12.5px] text-slate-500">X (pt)</span>
                <input
                  type="number"
                  value={Math.round(single.x)}
                  onChange={(e) => updateObject(single.id, { x: Number(e.target.value) }, true)}
                  className="w-full rounded border border-slate-300 px-2 py-1 text-[13.5px] tabular-nums"
                />
              </label>
              <label className="space-y-0.5">
                <span className="text-[12.5px] text-slate-500">Y (pt)</span>
                <input
                  type="number"
                  value={Math.round(single.y)}
                  onChange={(e) => updateObject(single.id, { y: Number(e.target.value) }, true)}
                  className="w-full rounded border border-slate-300 px-2 py-1 text-[13.5px] tabular-nums"
                />
              </label>
              <label className="space-y-0.5">
                <span className="text-[12.5px] text-slate-500">Rộng (pt)</span>
                <input
                  type="number"
                  value={Math.round(single.width)}
                  onChange={(e) => updateObject(single.id, { width: Math.max(16, Number(e.target.value)) }, true)}
                  className="w-full rounded border border-slate-300 px-2 py-1 text-[13.5px] tabular-nums"
                />
              </label>
              <label className="space-y-0.5">
                <span className="text-[12.5px] text-slate-500">Cao (pt)</span>
                <input
                  type="number"
                  value={Math.round(single.height)}
                  onChange={(e) => updateObject(single.id, { height: Math.max(12, Number(e.target.value)) }, true)}
                  className="w-full rounded border border-slate-300 px-2 py-1 text-[13.5px] tabular-nums"
                />
              </label>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[13.5px]">
                <span>Góc xoay</span>
                <span className="tabular-nums font-semibold">{single.rotation}°</span>
              </div>
              <input
                type="range"
                min={0}
                max={360}
                value={single.rotation}
                onChange={(e) => updateObject(single.id, { rotation: Number(e.target.value) }, true)}
                className="w-full accent-[#087F70]"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[13.5px]">
                <span>Độ mờ</span>
                <span className="tabular-nums font-semibold">{Math.round(single.opacity * 100)}%</span>
              </div>
              <input
                type="range"
                min={0.15}
                max={1}
                step={0.05}
                value={single.opacity}
                onChange={(e) => updateObject(single.id, { opacity: Number(e.target.value) }, true)}
                className="w-full accent-[#087F70]"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => bringToFront(single.id)}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-[13.5px] cursor-pointer"
              >
                <ArrowUpToLine className="w-4 h-4" />
                <span>Lên trên</span>
              </button>
              <button
                type="button"
                onClick={() => sendToBack(single.id)}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-[13.5px] cursor-pointer"
              >
                <ArrowDownToLine className="w-4 h-4" />
                <span>Xuống dưới</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
