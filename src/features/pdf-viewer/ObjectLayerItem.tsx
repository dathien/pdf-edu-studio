import React, { useState } from 'react';
import { Lock, RotateCw } from 'lucide-react';
import type { GradingSession, StudioObject } from '../../types/studio';
import { computeGradingSummary, formatScoreVi } from '../../engines/grading/gradingEngine';
import { sanitizeSvgMarkup } from '../../engines/pdf/pdfEngine';
import { useStudioStore } from '../../stores/useStudioStore';

interface ObjectLayerItemProps {
  obj: StudioObject;
  zoom: number;
  selected: boolean;
  grading: GradingSession;
  onSelect: (e: React.MouseEvent, id: string) => void;
  onEraserHit: (id: string) => void;
  isEraserActive: boolean;
}

export const ObjectLayerItem: React.FC<ObjectLayerItemProps> = ({
  obj,
  zoom,
  selected,
  grading,
  onSelect,
  onEraserHit,
  isEraserActive,
}) => {
  const updateObject = useStudioStore((s) => s.updateObject);
  const setEditingFormulaObjectId = useStudioStore((s) => s.setEditingFormulaObjectId);
  const [isInlineEditing, setIsInlineEditing] = useState(false);

  const startDrag = (e: React.PointerEvent) => {
    if (isEraserActive) {
      e.stopPropagation();
      onEraserHit(obj.id);
      return;
    }
    if (isInlineEditing) return;
    e.stopPropagation();
    onSelect(e as unknown as React.MouseEvent, obj.id);
    if (obj.locked) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const origX = obj.x;
    const origY = obj.y;
    let moved = false;

    const onMove = (ev: PointerEvent) => {
      const dx = (ev.clientX - startX) / zoom;
      const dy = (ev.clientY - startY) / zoom;
      if (Math.abs(dx) > 1.5 || Math.abs(dy) > 1.5) moved = true;
      updateObject(obj.id, { x: Math.round(origX + dx), y: Math.round(origY + dy) }, false);
    };
    const onUp = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      if (moved) {
        const dx = (ev.clientX - startX) / zoom;
        const dy = (ev.clientY - startY) / zoom;
        updateObject(obj.id, { x: Math.round(origX + dx), y: Math.round(origY + dy) }, true);
      }
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const startResize = (
    e: React.PointerEvent,
    handle: 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'
  ) => {
    e.stopPropagation();
    if (obj.locked) return;
    const startX = e.clientX;
    const startY = e.clientY;
    const { x: ox, y: oy, width: ow, height: oh } = obj;
    const keepAspect = obj.type === 'image' && obj.keepAspect;
    const ratio = ow / Math.max(oh, 1);

    const calc = (ev: PointerEvent) => {
      const dx = (ev.clientX - startX) / zoom;
      const dy = (ev.clientY - startY) / zoom;
      let nx = ox;
      let ny = oy;
      let nw = ow;
      let nh = oh;

      if (handle.includes('e')) nw = Math.max(18, ow + dx);
      if (handle.includes('s')) nh = Math.max(14, oh + dy);
      if (handle.includes('w')) {
        nw = Math.max(18, ow - dx);
        nx = ox + (ow - nw);
      }
      if (handle.includes('n')) {
        nh = Math.max(14, oh - dy);
        ny = oy + (oh - nh);
      }
      if (keepAspect && handle.length === 2) {
        nh = Math.max(14, nw / ratio);
      }
      return { x: Math.round(nx), y: Math.round(ny), width: Math.round(nw), height: Math.round(nh) };
    };

    const onMove = (ev: PointerEvent) => updateObject(obj.id, calc(ev), false);
    const onUp = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      updateObject(obj.id, calc(ev), true);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const startRotate = (e: React.PointerEvent) => {
    e.stopPropagation();
    if (obj.locked) return;
    const el = (e.currentTarget as HTMLElement).parentElement;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    const calcAngle = (ev: PointerEvent) => {
      const rad = Math.atan2(ev.clientY - cy, ev.clientX - cx);
      return Math.round(((rad * 180) / Math.PI + 90 + 360) % 360);
    };
    const onMove = (ev: PointerEvent) => updateObject(obj.id, { rotation: calcAngle(ev) }, false);
    const onUp = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      updateObject(obj.id, { rotation: calcAngle(ev) }, true);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (obj.locked) return;
    if (obj.type === 'formula') {
      setEditingFormulaObjectId(obj.id);
    } else if (
      obj.type === 'text' ||
      obj.type === 'grading-comment' ||
      (obj.type === 'annotation' && obj.kind === 'note') ||
      (obj.type === 'shape' && obj.shapeKind === 'callout')
    ) {
      setIsInlineEditing(true);
    }
  };

  const summary = obj.type === 'grading-total' ? computeGradingSummary(grading) : null;

  const renderContent = () => {
    switch (obj.type) {
      case 'text': {
        const fontFamily =
          obj.fontFamily === 'DejaVuSerif' ? 'Georgia, "Times New Roman", serif' : '"Be Vietnam Pro", sans-serif';
        const isOverflowing =
          obj.replacesOriginalRect &&
          obj.content.length > obj.replacesOriginalRect.originalText.length * 1.45;
        return (
          <div
            className="w-full h-full relative"
            style={{
              backgroundColor: obj.replacesOriginalRect
                ? '#FFFFFF'
                : obj.backgroundColor || 'transparent',
            }}
          >
            {isInlineEditing ? (
              <textarea
                autoFocus
                value={obj.content}
                onChange={(e) => updateObject(obj.id, { content: e.target.value }, false)}
                onBlur={() => {
                  setIsInlineEditing(false);
                  updateObject(obj.id, { content: obj.content }, true);
                }}
                className="w-full h-full resize-none outline-none bg-white/95 p-0.5 border border-[#087F70]"
                style={{
                  fontFamily,
                  fontSize: obj.fontSize * zoom,
                  fontWeight: obj.bold ? 700 : 400,
                  fontStyle: obj.italic ? 'italic' : 'normal',
                  color: obj.color,
                  textAlign: obj.align,
                  lineHeight: obj.lineHeight,
                  letterSpacing: obj.letterSpacing,
                }}
              />
            ) : (
              <div
                className="w-full h-full whitespace-pre-wrap break-words overflow-hidden"
                style={{
                  fontFamily,
                  fontSize: obj.fontSize * zoom,
                  fontWeight: obj.bold ? 700 : 400,
                  fontStyle: obj.italic ? 'italic' : 'normal',
                  textDecoration: `${obj.underline ? 'underline ' : ''}${obj.strikethrough ? 'line-through' : ''}`,
                  color: obj.color,
                  textAlign: obj.align,
                  lineHeight: obj.lineHeight,
                  letterSpacing: obj.letterSpacing,
                }}
              >
                {obj.content}
              </div>
            )}
            {isOverflowing && (
              <div
                className="no-print absolute -top-5 left-0 bg-amber-100 border border-amber-400 text-amber-900 text-[11px] px-1.5 py-0.5 rounded whitespace-nowrap"
                title="Đoạn chữ mới dài hơn khung gốc — thầy/cô có thể kéo rộng khung hoặc giảm cỡ chữ."
              >
                Chữ dài hơn khung gốc
              </div>
            )}
          </div>
        );
      }

      case 'formula':
        return (
          <div
            className="w-full h-full flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
            dangerouslySetInnerHTML={{ __html: sanitizeSvgMarkup(obj.svgMarkup) }}
          />
        );

      case 'diagram':
        return (
          <div
            className="w-full h-full [&>svg]:w-full [&>svg]:h-full"
            dangerouslySetInnerHTML={{ __html: sanitizeSvgMarkup(obj.svgMarkup) }}
          />
        );

      case 'image':
        return (
          <img
            src={obj.dataUrl}
            alt="Hình ảnh chèn"
            draggable={false}
            className="w-full h-full object-contain pointer-events-none"
          />
        );

      case 'signature':
        return (
          <img
            src={obj.dataUrl}
            alt={obj.signerLabel}
            draggable={false}
            className="w-full h-full object-contain pointer-events-none"
          />
        );

      case 'shape': {
        const dash = obj.strokeStyle === 'dashed' || obj.shapeKind === 'dashed' ? '6 4' : undefined;
        if (obj.shapeKind === 'table') {
          const rows = obj.tableRows || [
            ['Tiêu đề 1', 'Tiêu đề 2', 'Tiêu đề 3'],
            ['Nội dung', 'Nội dung', 'Nội dung'],
          ];
          return (
            <table className="w-full h-full border-collapse bg-white/95 text-slate-900" style={{ fontSize: 11 * zoom }}>
              <tbody>
                {rows.map((row, rIdx) => (
                  <tr key={rIdx}>
                    {row.map((cell, cIdx) => (
                      <td
                        key={cIdx}
                        contentEditable={!obj.locked}
                        suppressContentEditableWarning
                        onBlur={(e) => {
                          const nextRows = rows.map((r, ri) =>
                            ri === rIdx
                              ? r.map((c, ci) => (ci === cIdx ? e.currentTarget.textContent || '' : c))
                              : r
                          );
                          updateObject(obj.id, { tableRows: nextRows }, true);
                        }}
                        className="border px-1.5 py-0.5 align-middle outline-none focus:bg-teal-50"
                        style={{ borderColor: obj.strokeColor }}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          );
        }

        if (obj.shapeKind === 'callout') {
          return (
            <div
              className="w-full h-full rounded-lg p-2 flex items-center"
              style={{
                border: `${obj.strokeWidth}px solid ${obj.strokeColor}`,
                backgroundColor: obj.fillColor === 'transparent' ? '#FEF9C3' : obj.fillColor,
                fontSize: 12 * zoom,
              }}
            >
              {isInlineEditing ? (
                <textarea
                  autoFocus
                  value={obj.text || ''}
                  onChange={(e) => updateObject(obj.id, { text: e.target.value }, false)}
                  onBlur={() => {
                    setIsInlineEditing(false);
                    updateObject(obj.id, { text: obj.text }, true);
                  }}
                  className="w-full h-full resize-none bg-transparent outline-none"
                />
              ) : (
                <div className="w-full break-words">{obj.text || 'Nháy đúp để nhập chú thích'}</div>
              )}
            </div>
          );
        }

        return (
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
            {(obj.shapeKind === 'rect' || obj.shapeKind === 'square') && (
              <rect
                x="2"
                y="2"
                width="96"
                height="96"
                fill={obj.fillColor}
                stroke={obj.strokeColor}
                strokeWidth={obj.strokeWidth * 1.4}
                strokeDasharray={dash}
                vectorEffect="non-scaling-stroke"
              />
            )}
            {(obj.shapeKind === 'circle' || obj.shapeKind === 'ellipse') && (
              <ellipse
                cx="50"
                cy="50"
                rx="47"
                ry="47"
                fill={obj.fillColor}
                stroke={obj.strokeColor}
                strokeWidth={obj.strokeWidth * 1.4}
                strokeDasharray={dash}
                vectorEffect="non-scaling-stroke"
              />
            )}
            {(obj.shapeKind === 'line' || obj.shapeKind === 'dashed') && (
              <line
                x1="2"
                y1="50"
                x2="98"
                y2="50"
                stroke={obj.strokeColor}
                strokeWidth={obj.strokeWidth * 1.5}
                strokeDasharray={dash}
                vectorEffect="non-scaling-stroke"
              />
            )}
            {obj.shapeKind === 'arrow' && (
              <>
                <line
                  x1="2"
                  y1="50"
                  x2="92"
                  y2="50"
                  stroke={obj.strokeColor}
                  strokeWidth={obj.strokeWidth * 1.5}
                  vectorEffect="non-scaling-stroke"
                />
                <polygon points="100,50 86,40 86,60" fill={obj.strokeColor} />
              </>
            )}
          </svg>
        );
      }

      case 'ink': {
        if (obj.points.length < 2) return null;
        const d = obj.points
          .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`)
          .join(' ');
        return (
          <svg
            viewBox={`0 0 ${Math.max(1, obj.width)} ${Math.max(1, obj.height)}`}
            className="w-full h-full overflow-visible"
          >
            <path
              d={d}
              fill="none"
              stroke={obj.color}
              strokeWidth={obj.strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeOpacity={obj.tool === 'highlighter' ? 0.38 : obj.opacity}
            />
          </svg>
        );
      }

      case 'annotation': {
        if (obj.kind === 'highlight') {
          return (
            <div
              className="w-full h-full rounded-xs"
              style={{ backgroundColor: obj.color, opacity: 0.34 }}
            />
          );
        }
        if (obj.kind === 'underline') {
          return (
            <div className="w-full h-full flex items-end">
              <div className="w-full" style={{ height: Math.max(2, 2.2 * zoom), backgroundColor: obj.color }} />
            </div>
          );
        }
        if (obj.kind === 'strikethrough') {
          return (
            <div className="w-full h-full flex items-center">
              <div className="w-full" style={{ height: Math.max(2, 2.2 * zoom), backgroundColor: obj.color }} />
            </div>
          );
        }
        return (
          <div
            className="w-full h-full rounded-md border border-amber-400 bg-amber-100/95 p-1.5 text-slate-900 shadow-xs overflow-hidden"
            style={{ fontSize: 11.5 * zoom }}
          >
            {isInlineEditing ? (
              <textarea
                autoFocus
                value={obj.noteText || ''}
                onChange={(e) => updateObject(obj.id, { noteText: e.target.value }, false)}
                onBlur={() => {
                  setIsInlineEditing(false);
                  updateObject(obj.id, { noteText: obj.noteText }, true);
                }}
                className="w-full h-full bg-transparent resize-none outline-none"
              />
            ) : (
              <div className="w-full h-full whitespace-pre-wrap">{obj.noteText || 'Ghi chú'}</div>
            )}
          </div>
        );
      }

      case 'grading-stamp':
        return (
          <div
            className="w-full h-full rounded-md border-2 bg-white/90 flex items-center justify-center font-bold px-1.5 whitespace-nowrap"
            style={{
              borderColor: obj.color,
              color: obj.color,
              fontSize: obj.fontSize * zoom,
            }}
          >
            {obj.label}
          </div>
        );

      case 'grading-score':
        return (
          <div
            className="w-full h-full rounded-md border-2 bg-white/95 flex items-center justify-center font-bold px-1.5 tabular-nums whitespace-nowrap shadow-2xs"
            style={{
              borderColor: obj.color,
              color: obj.color,
              fontSize: 12 * zoom,
            }}
            title={`Điểm đồng bộ với ${obj.questionLabel}`}
          >
            {obj.questionLabel}: +{formatScoreVi(obj.score)} / {formatScoreVi(obj.maxScore)}
          </div>
        );

      case 'grading-comment':
        return (
          <div
            className="w-full h-full rounded-md border border-red-300 bg-red-50/90 px-2 py-1 font-medium"
            style={{ color: obj.color, fontSize: obj.fontSize * zoom }}
          >
            {isInlineEditing ? (
              <textarea
                autoFocus
                value={obj.text}
                onChange={(e) => updateObject(obj.id, { text: e.target.value }, false)}
                onBlur={() => {
                  setIsInlineEditing(false);
                  updateObject(obj.id, { text: obj.text }, true);
                }}
                className="w-full h-full bg-transparent resize-none outline-none"
              />
            ) : (
              <div className="w-full h-full whitespace-pre-wrap break-words">{obj.text}</div>
            )}
          </div>
        );

      case 'grading-total': {
        const finalStr = formatScoreVi(summary?.finalScore ?? 0);
        const maxStr = formatScoreVi(summary?.scaleMax ?? 10);
        return (
          <div
            className="w-full h-full rounded-lg border-2 bg-transparent p-2 flex flex-col justify-center"
            style={{ borderColor: obj.color, color: obj.color }}
          >
            <div className="font-extrabold tabular-nums leading-tight" style={{ fontSize: 15 * zoom }}>
              {obj.template === 'short' ? `${finalStr}/${maxStr}` : `Tổng điểm: ${finalStr} / ${maxStr}`}
            </div>
            {(obj.template === 'full' || obj.template === 'with-comment') && grading.studentName && (
              <div className="text-slate-700 font-medium truncate" style={{ fontSize: 10.5 * zoom }}>
                HS: {grading.studentName} {grading.className ? `(${grading.className})` : ''}
              </div>
            )}
            {obj.template === 'with-comment' && grading.teacherComment && (
              <div className="text-slate-700 italic line-clamp-2 mt-0.5" style={{ fontSize: 10 * zoom }}>
                NX: {grading.teacherComment}
              </div>
            )}
          </div>
        );
      }

      case 'redaction':
        return (
          <div
            className="w-full h-full flex items-center justify-center font-bold text-white text-center px-1 select-none"
            style={{
              backgroundColor: obj.applied ? obj.fillColor : 'rgba(220, 38, 38, 0.78)',
              border: obj.applied ? 'none' : '2px dashed #991B1B',
              fontSize: Math.max(9, 10.5 * zoom),
            }}
          >
            {obj.applied ? '' : 'VÙNG XÓA VĨNH VIỄN'}
          </div>
        );
    }
  };

  return (
    <div
      onPointerDown={startDrag}
      onDoubleClick={handleDoubleClick}
      style={{
        position: 'absolute',
        left: obj.x * zoom,
        top: obj.y * zoom,
        width: obj.width * zoom,
        height: obj.height * zoom,
        transform: obj.rotation ? `rotate(${obj.rotation}deg)` : undefined,
        zIndex: obj.zIndex,
        opacity: obj.type === 'ink' ? 1 : obj.opacity,
        cursor: isEraserActive ? 'crosshair' : obj.locked ? 'not-allowed' : 'move',
      }}
      className={`group select-none ${
        selected ? 'ring-2 ring-[#087F70] ring-offset-1' : 'hover:ring-1 hover:ring-[#087F70]/50'
      }`}
    >
      {renderContent()}

      {/* Lock badge */}
      {obj.locked && selected && (
        <div className="no-print absolute -top-5 right-0 bg-slate-800 text-white rounded px-1.5 py-0.5 text-[10px] flex items-center gap-1">
          <Lock className="w-2.5 h-2.5" />
          <span>Đã khóa</span>
        </div>
      )}

      {/* Resize & Rotate Handles when selected and unlocked */}
      {selected && !obj.locked && !isInlineEditing && (
        <div className="no-print">
          {(
            [
              ['nw', '-top-1.5 -left-1.5 cursor-nwse-resize'],
              ['n', '-top-1.5 left-1/2 -translate-x-1/2 cursor-ns-resize'],
              ['ne', '-top-1.5 -right-1.5 cursor-nesw-resize'],
              ['e', 'top-1/2 -right-1.5 -translate-y-1/2 cursor-ew-resize'],
              ['se', '-bottom-1.5 -right-1.5 cursor-nwse-resize'],
              ['s', '-bottom-1.5 left-1/2 -translate-x-1/2 cursor-ns-resize'],
              ['sw', '-bottom-1.5 -left-1.5 cursor-nesw-resize'],
              ['w', 'top-1/2 -left-1.5 -translate-y-1/2 cursor-ew-resize'],
            ] as const
          ).map(([handle, posClass]) => (
            <div
              key={handle}
              onPointerDown={(e) => startResize(e, handle)}
              className={`absolute w-3 h-3 bg-white border-2 border-[#087F70] rounded-xs shadow-xs ${posClass}`}
            />
          ))}

          {/* Rotation knob */}
          <div
            onPointerDown={startRotate}
            title="Xoay đối tượng"
            className="absolute -top-7 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-[#087F70] text-white flex items-center justify-center cursor-grab shadow-sm"
          >
            <RotateCw className="w-3 h-3" />
          </div>
        </div>
      )}
    </div>
  );
};
