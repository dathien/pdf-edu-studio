import React, { useRef, useState } from 'react';
import { Check, Eraser, Trash2, Upload, X } from 'lucide-react';
import { useStudioStore } from '../../stores/useStudioStore';

interface SignatureModalProps {
  onClose: () => void;
}

export const SignatureModal: React.FC<SignatureModalProps> = ({ onClose }) => {
  const documents = useStudioStore((s) => s.documents);
  const activeDocId = useStudioStore((s) => s.activeDocId);
  const savedSignatures = useStudioStore((s) => s.savedSignatures);
  const addSavedSignature = useStudioStore((s) => s.addSavedSignature);
  const removeSavedSignature = useStudioStore((s) => s.removeSavedSignature);
  const addObject = useStudioStore((s) => s.addObject);
  const notify = useStudioStore((s) => s.notify);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const [inkColor, setInkColor] = useState('#164E63');
  const [signerName, setSignerName] = useState('Chữ ký giáo viên');

  const getPos = (e: React.PointerEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * 460,
      y: ((e.clientY - rect.top) / rect.height) * 160,
    };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    drawingRef.current = true;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.strokeStyle = inkColor;
    ctx.lineWidth = 2.8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drawingRef.current) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const clearCanvas = () => {
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, 460, 160);
  };

  const insertSignatureToDoc = (dataUrl: string, label: string) => {
    const doc = documents.find((d) => d.id === activeDocId);
    if (!doc) return;
    const page = doc.pages[doc.currentPageIndex];
    if (!page) return;
    addObject({
      id: `sig-${Date.now()}`,
      type: 'signature',
      pageId: page.id,
      x: Math.max(40, page.width - 200),
      y: Math.max(60, page.height - 150),
      width: 150,
      height: 55,
      rotation: 0,
      zIndex: 35,
      opacity: 1,
      dataUrl,
      signerLabel: label,
    });
    notify('Đã chèn chữ ký hình ảnh vào trang PDF', 'success');
    onClose();
  };

  const handleSaveAndInsert = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    await addSavedSignature({
      id: `sig-saved-${Date.now()}`,
      name: signerName.trim() || 'Chữ ký',
      dataUrl,
      createdAt: Date.now(),
    });
    insertSignatureToDoc(dataUrl, signerName.trim() || 'Chữ ký');
  };

  const handleUploadImage = (files: FileList | null) => {
    const f = files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = String(reader.result);
      await addSavedSignature({
        id: `sig-up-${Date.now()}`,
        name: f.name.replace(/\.[^.]+$/, ''),
        dataUrl,
        createdAt: Date.now(),
      });
      notify('Đã thêm ảnh chữ ký vào bộ sưu tập cục bộ', 'success');
    };
    reader.readAsDataURL(f);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200">
        <div className="bg-[#164E63] text-white px-5 py-3.5 flex items-center justify-between">
          <h2 className="text-[19px] font-bold">Chữ ký hình ảnh (Lưu cục bộ trên thiết bị)</h2>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/15 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-[14.5px] text-slate-800">
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[13.5px]">
            <strong>Lưu ý minh bạch:</strong> Đây là <strong>chữ ký hình ảnh</strong> dùng cho ký duyệt học liệu, bài chấm và phiếu nhận xét — không thay thế chữ ký số chứng thư mật mã (CA/USB Token).
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <input
                type="text"
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                placeholder="Tên gợi nhớ (VD: Chữ ký Thầy Thiện)"
                className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5"
              />
              <div className="flex items-center gap-1.5">
                {['#164E63', '#1D4ED8', '#1F2937', '#DC2626'].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setInkColor(c)}
                    style={{ backgroundColor: c }}
                    className={`w-6 h-6 rounded-full border-2 cursor-pointer ${
                      inkColor === c ? 'border-slate-900 scale-110' : 'border-white'
                    }`}
                  />
                ))}
              </div>
            </div>

            <canvas
              ref={canvasRef}
              width={460}
              height={160}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={() => (drawingRef.current = false)}
              onPointerLeave={() => (drawingRef.current = false)}
              className="w-full h-40 bg-[#FAFCFB] border-2 border-dashed border-slate-300 rounded-xl cursor-crosshair touch-none"
            />

            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={clearCanvas}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-[14px] cursor-pointer"
                >
                  <Eraser className="w-4 h-4" /> Xóa vẽ lại
                </button>
                <label className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-[14px] cursor-pointer">
                  <Upload className="w-4 h-4" /> Tải ảnh chữ ký PNG
                  <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={(e) => handleUploadImage(e.target.files)} />
                </label>
              </div>
              <button
                type="button"
                onClick={handleSaveAndInsert}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#087F70] hover:bg-[#06695d] text-white font-semibold cursor-pointer"
              >
                <Check className="w-4 h-4" /> Lưu & Chèn vào PDF
              </button>
            </div>
          </div>

          {savedSignatures.length > 0 && (
            <div className="pt-3 border-t border-slate-200 space-y-2">
              <div className="font-bold text-[#164E63]">Chữ ký đã lưu trên thiết bị</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-44 overflow-y-auto">
                {savedSignatures.map((sig) => (
                  <div key={sig.id} className="rounded-xl border border-slate-200 p-2 bg-white flex flex-col gap-1.5">
                    <img
                      src={sig.dataUrl}
                      alt={sig.name}
                      onClick={() => insertSignatureToDoc(sig.dataUrl, sig.name)}
                      className="h-14 w-full object-contain bg-slate-50 rounded cursor-pointer"
                    />
                    <div className="flex items-center justify-between gap-1 text-[12.5px]">
                      <span className="truncate font-medium">{sig.name}</span>
                      <button
                        type="button"
                        onClick={() => removeSavedSignature(sig.id)}
                        className="p-1 text-slate-400 hover:text-[#DC2626] cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
