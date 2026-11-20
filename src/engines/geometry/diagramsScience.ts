import { makeItem, plotCurvePath, regularPolygonPoints, type ScientificDiagramItem } from './diagramHelpers';

export const PHYSICS_DIAGRAMS: ScientificDiagramItem[] = [
  makeItem('phys-circuit-series', 'Mạch điện mắc nối tiếp (R₁ nt R₂)', 'physics', 'Điện học', () => ({
    lines: [
      { x1: 34, y1: 48, x2: 64, y2: 48 },
      { x1: 104, y1: 48, x2: 122, y2: 48 },
      { x1: 162, y1: 48, x2: 186, y2: 48 },
      { x1: 186, y1: 48, x2: 186, y2: 126 },
      { x1: 34, y1: 48, x2: 34, y2: 126 },
      { x1: 34, y1: 126, x2: 98, y2: 126 },
      { x1: 114, y1: 126, x2: 186, y2: 126 },
      { x1: 98, y1: 110, x2: 98, y2: 142, width: 2 },
      { x1: 114, y1: 118, x2: 114, y2: 134, width: 3.4 },
    ],
    rects: [
      { x: 64, y: 38, w: 40, h: 20, fill: '#FFFFFF' },
      { x: 122, y: 38, w: 40, h: 20, fill: '#FFFFFF' },
    ],
    circles: [],
    anchors: [
      { id: 'r1', text: 'R₁', x: 84, y: 26, italic: false },
      { id: 'r2', text: 'R₂', x: 142, y: 26, italic: false },
      { id: 'e', text: 'E, r', x: 106, y: 154 },
    ],
  })),
  makeItem('phys-circuit-parallel', 'Mạch điện mắc song song (R₁ ∥ R₂)', 'physics', 'Điện học', () => ({
    lines: [
      { x1: 34, y1: 86, x2: 62, y2: 86 },
      { x1: 62, y1: 44, x2: 62, y2: 110 },
      { x1: 158, y1: 44, x2: 158, y2: 110 },
      { x1: 62, y1: 44, x2: 88, y2: 44 },
      { x1: 132, y1: 44, x2: 158, y2: 44 },
      { x1: 62, y1: 110, x2: 88, y2: 110 },
      { x1: 132, y1: 110, x2: 158, y2: 110 },
      { x1: 158, y1: 86, x2: 186, y2: 86 },
      { x1: 34, y1: 86, x2: 34, y2: 142 },
      { x1: 186, y1: 86, x2: 186, y2: 142 },
      { x1: 34, y1: 142, x2: 102, y2: 142 },
      { x1: 116, y1: 142, x2: 186, y2: 142 },
      { x1: 102, y1: 130, x2: 102, y2: 154, width: 2 },
      { x1: 116, y1: 135, x2: 116, y2: 149, width: 3.4 },
    ],
    rects: [
      { x: 88, y: 34, w: 44, h: 20, fill: '#FFFFFF' },
      { x: 88, y: 100, w: 44, h: 20, fill: '#FFFFFF' },
    ],
    circles: [],
    points: [{ x: 62, y: 86 }, { x: 158, y: 86 }],
    anchors: [
      { id: 'r1', text: 'R₁', x: 110, y: 24, italic: false },
      { id: 'r2', text: 'R₂', x: 110, y: 90, italic: false },
    ],
  })),
  makeItem('phys-resistor', 'Điện trở R', 'physics', 'Điện học', () => ({
    lines: [{ x1: 28, y1: 86, x2: 72, y2: 86 }, { x1: 148, y1: 86, x2: 192, y2: 86 }],
    rects: [{ x: 72, y: 70, w: 76, h: 32, fill: '#FFFFFF' }],
    circles: [],
    anchors: [{ id: 'r', text: 'R', x: 110, y: 54, italic: false }],
  })),
  makeItem('phys-ammeter-voltmeter', 'Ampe kế (A) và Vôn kế (V)', 'physics', 'Điện học', () => ({
    lines: [
      { x1: 24, y1: 86, x2: 56, y2: 86 },
      { x1: 96, y1: 86, x2: 124, y2: 86 },
      { x1: 164, y1: 86, x2: 196, y2: 86 },
    ],
    circles: [
      { cx: 76, cy: 86, r: 20, fill: '#FFFFFF', color: '#087F70' },
      { cx: 144, cy: 86, r: 20, fill: '#FFFFFF', color: '#164E63' },
    ],
    anchors: [
      { id: 'a', text: 'A', x: 76, y: 86, centroidX: 76, centroidY: 160, italic: false, color: '#087F70' },
      { id: 'v', text: 'V', x: 144, y: 86, centroidX: 144, centroidY: 160, italic: false, color: '#164E63' },
    ],
  })),
  makeItem('phys-switch-battery', 'Nguồn điện và Khóa K', 'physics', 'Điện học', () => ({
    lines: [
      { x1: 26, y1: 86, x2: 70, y2: 86 },
      { x1: 70, y1: 62, x2: 70, y2: 110, width: 2 },
      { x1: 84, y1: 72, x2: 84, y2: 100, width: 3.6 },
      { x1: 84, y1: 86, x2: 126, y2: 86 },
      { x1: 126, y1: 86, x2: 160, y2: 64, color: '#087F70', width: 2.2 },
      { x1: 164, y1: 86, x2: 194, y2: 86 },
    ],
    circles: [{ cx: 126, cy: 86, r: 3.2, fill: '#FFFFFF' }, { cx: 164, cy: 86, r: 3.2, fill: '#FFFFFF' }],
    anchors: [
      { id: 'plus', text: '+', x: 60, y: 66, italic: false },
      { id: 'minus', text: '−', x: 92, y: 66, italic: false },
      { id: 'k', text: 'K', x: 145, y: 54, italic: false },
    ],
  })),
  makeItem('phys-rheostat', 'Biến trở con chạy', 'physics', 'Điện học', () => ({
    lines: [
      { x1: 28, y1: 96, x2: 68, y2: 96 },
      { x1: 152, y1: 96, x2: 192, y2: 96 },
      { x1: 110, y1: 42, x2: 110, y2: 80, color: '#087F70', arrow: true },
      { x1: 110, y1: 42, x2: 186, y2: 42, color: '#087F70' },
    ],
    rects: [{ x: 68, y: 82, w: 84, h: 28, fill: '#FFFFFF' }],
    circles: [],
    anchors: [{ id: 'c', text: 'C', x: 136, y: 30, italic: false }],
  })),
  makeItem('phys-rlc', 'Mạch xoay chiều R – L – C nối tiếp', 'physics', 'Điện học', () => ({
    lines: [
      { x1: 18, y1: 86, x2: 36, y2: 86 },
      { x1: 76, y1: 86, x2: 92, y2: 86 },
      { x1: 138, y1: 86, x2: 158, y2: 86 },
      { x1: 158, y1: 68, x2: 158, y2: 104, width: 2.4 },
      { x1: 168, y1: 68, x2: 168, y2: 104, width: 2.4 },
      { x1: 168, y1: 86, x2: 202, y2: 86 },
    ],
    rects: [{ x: 36, y: 76, w: 40, h: 20, fill: '#FFFFFF' }],
    paths: [{ d: 'M 92,86 C 95,68 103,68 106,86 C 109,68 117,68 120,86 C 123,68 131,68 138,86', width: 2 }],
    circles: [],
    anchors: [
      { id: 'r', text: 'R', x: 56, y: 64, italic: false },
      { id: 'l', text: 'L', x: 115, y: 64, italic: false },
      { id: 'c', text: 'C', x: 163, y: 58, italic: false },
    ],
  })),
  makeItem('phys-fbd-forces', 'Sơ đồ phân tích lực trên vật', 'physics', 'Cơ học', () => ({
    lines: [
      { x1: 24, y1: 118, x2: 196, y2: 118, color: '#64748B' },
      { x1: 110, y1: 94, x2: 110, y2: 34, color: '#087F70', width: 2.2, arrow: true },
      { x1: 110, y1: 94, x2: 110, y2: 154, color: '#DC2626', width: 2.2, arrow: true },
      { x1: 110, y1: 94, x2: 182, y2: 94, color: '#164E63', width: 2.2, arrow: true },
      { x1: 110, y1: 94, x2: 52, y2: 94, color: '#D97706', width: 2, arrow: true },
    ],
    rects: [{ x: 84, y: 70, w: 52, h: 48, fill: '#F1F5F9' }],
    circles: [],
    anchors: [
      { id: 'n', text: 'N⃗', x: 122, y: 38, color: '#087F70' },
      { id: 'p', text: 'P⃗', x: 122, y: 150, color: '#DC2626' },
      { id: 'f', text: 'F⃗', x: 184, y: 84 },
      { id: 'fms', text: 'Fₘₛ', x: 46, y: 84, color: '#D97706', fontSize: 11 },
    ],
  })),
  makeItem('phys-inclined-plane', 'Mặt phẳng nghiêng góc α', 'physics', 'Cơ học', () => ({
    lines: [
      { x1: 30, y1: 138, x2: 190, y2: 138 },
      { x1: 30, y1: 138, x2: 172, y2: 46 },
      { x1: 172, y1: 46, x2: 172, y2: 138 },
      { x1: 108, y1: 86, x2: 108, y2: 132, color: '#DC2626', width: 2, arrow: true },
      { x1: 108, y1: 86, x2: 86, y2: 52, color: '#087F70', width: 2, arrow: true },
    ],
    polygons: [{ points: '90,82 118,64 130,82 102,100', fill: '#E2E8F0' }],
    circles: [],
    anchors: [
      { id: 'alpha', text: 'α', x: 64, y: 126 },
      { id: 'p', text: 'P⃗', x: 120, y: 128, color: '#DC2626' },
      { id: 'n', text: 'N⃗', x: 80, y: 46, color: '#087F70' },
    ],
  })),
  makeItem('phys-pulley', 'Hệ ròng rọc cố định', 'physics', 'Cơ học', () => ({
    lines: [
      { x1: 82, y1: 20, x2: 138, y2: 20, width: 3 },
      { x1: 110, y1: 20, x2: 110, y2: 56 },
      { x1: 86, y1: 56, x2: 86, y2: 104 },
      { x1: 134, y1: 56, x2: 134, y2: 116 },
    ],
    circles: [{ cx: 110, cy: 56, r: 24, fill: '#F8FAFC' }],
    rects: [
      { x: 70, y: 104, w: 32, h: 28, fill: '#E0F2FE' },
      { x: 118, y: 116, w: 32, h: 32, fill: '#CCFBF1' },
    ],
    anchors: [
      { id: 'm1', text: 'm₁', x: 86, y: 118, centroidX: 86, centroidY: 165 },
      { id: 'm2', text: 'm₂', x: 134, y: 132, centroidX: 134, centroidY: 170 },
    ],
  })),
  makeItem('phys-lever', 'Đòn bẩy cân bằng', 'physics', 'Cơ học', () => ({
    lines: [
      { x1: 36, y1: 86, x2: 184, y2: 86, width: 3 },
      { x1: 52, y1: 86, x2: 52, y2: 132, color: '#DC2626', width: 2.2, arrow: true },
      { x1: 170, y1: 86, x2: 170, y2: 122, color: '#087F70', width: 2.2, arrow: true },
    ],
    polygons: [{ points: '96,122 124,122 110,88', fill: '#CBD5E1' }],
    circles: [],
    anchors: [
      { id: 'o', text: 'O', x: 110, y: 74 },
      { id: 'f1', text: 'F₁', x: 42, y: 132, color: '#DC2626' },
      { id: 'f2', text: 'F₂', x: 182, y: 122, color: '#087F70' },
    ],
  })),
  makeItem('phys-projectile', 'Chuyển động ném xiên', 'physics', 'Cơ học', () => ({
    lines: [
      { x1: 30, y1: 136, x2: 196, y2: 136, arrow: true, color: '#64748B' },
      { x1: 30, y1: 136, x2: 30, y2: 24, arrow: true, color: '#64748B' },
      { x1: 30, y1: 136, x2: 72, y2: 74, color: '#DC2626', width: 2, arrow: true },
    ],
    paths: [{ d: 'M 30,136 Q 108,16 184,136', color: '#087F70', width: 2.2, dashed: true }],
    circles: [],
    anchors: [
      { id: 'v0', text: 'v₀', x: 64, y: 66, color: '#DC2626' },
      { id: 'h', text: 'Hₘₐₓ', x: 108, y: 68, fontSize: 10, color: '#087F70' },
      { id: 'l', text: 'L', x: 184, y: 148 },
    ],
  })),
  makeItem('phys-pendulum', 'Con lắc đơn', 'physics', 'Dao động & Sóng', () => ({
    lines: [
      { x1: 72, y1: 24, x2: 148, y2: 24, width: 3 },
      { x1: 110, y1: 24, x2: 110, y2: 138, dashed: true, color: '#94A3B8' },
      { x1: 110, y1: 24, x2: 152, y2: 126, color: '#164E63', width: 2 },
    ],
    paths: [{ d: 'M 110,62 A 38,38 0 0,0 125,58', color: '#087F70' }],
    circles: [{ cx: 152, cy: 126, r: 11, fill: '#087F70' }],
    anchors: [
      { id: 'l', text: 'l', x: 142, y: 74 },
      { id: 'a', text: 'α', x: 118, y: 72, color: '#087F70' },
      { id: 'm', text: 'm', x: 170, y: 134 },
    ],
  })),
  makeItem('phys-spring-mass', 'Con lắc lò xo', 'physics', 'Dao động & Sóng', () => ({
    lines: [
      { x1: 30, y1: 48, x2: 30, y2: 124, width: 3 },
      { x1: 26, y1: 124, x2: 196, y2: 124, color: '#64748B' },
    ],
    paths: [
      { d: 'M 30,96 L 44,96 L 52,82 L 64,110 L 76,82 L 88,110 L 100,82 L 112,110 L 120,96 L 132,96', color: '#087F70', width: 2 },
    ],
    rects: [{ x: 132, y: 76, w: 44, h: 48, fill: '#E0F2FE' }],
    circles: [],
    anchors: [{ id: 'k', text: 'k', x: 82, y: 66, color: '#087F70' }, { id: 'm', text: 'm', x: 154, y: 64 }],
  })),
  makeItem('phys-wave', 'Sóng cơ (bước sóng λ)', 'physics', 'Dao động & Sóng', () => ({
    lines: [
      { x1: 20, y1: 88, x2: 200, y2: 88, arrow: true, color: '#64748B' },
      { x1: 68, y1: 42, x2: 158, y2: 42, color: '#DC2626', arrow: true },
      { x1: 158, y1: 42, x2: 68, y2: 42, color: '#DC2626', arrow: true },
    ],
    paths: [{ d: plotCurvePath((x) => Math.sin(x * 1.4) * 1.9, -4.5, 4.5, -3, 3, 110, 88, 20, 18), color: '#087F70', width: 2.2 }],
    circles: [],
    anchors: [{ id: 'lam', text: 'λ', x: 113, y: 30, color: '#DC2626' }, { id: 'a', text: 'A', x: 34, y: 54 }],
  })),
  makeItem('phys-light-reflection', 'Tia sáng phản xạ trên gương', 'physics', 'Quang học', () => ({
    lines: [
      { x1: 30, y1: 122, x2: 190, y2: 122, width: 2.6 },
      { x1: 110, y1: 30, x2: 110, y2: 122, dashed: true, color: '#64748B' },
      { x1: 46, y1: 44, x2: 110, y2: 122, color: '#DC2626', width: 2, arrow: true },
      { x1: 110, y1: 122, x2: 174, y2: 44, color: '#087F70', width: 2, arrow: true },
    ],
    circles: [],
    anchors: [
      { id: 's', text: 'S', x: 42, y: 40, color: '#DC2626' },
      { id: 'i', text: 'I', x: 110, y: 136 },
      { id: 'n', text: 'N', x: 110, y: 24 },
      { id: 'r', text: 'R', x: 178, y: 40, color: '#087F70' },
    ],
  })),
  makeItem('phys-plane-mirror', 'Gương phẳng tạo ảnh ảo', 'physics', 'Quang học', () => ({
    lines: [
      { x1: 110, y1: 24, x2: 110, y2: 146, width: 2.6 },
      { x1: 58, y1: 124, x2: 58, y2: 58, color: '#164E63', width: 2.4, arrow: true },
      { x1: 162, y1: 124, x2: 162, y2: 58, color: '#087F70', width: 2.2, dashed: true, arrow: true },
      { x1: 58, y1: 58, x2: 162, y2: 58, dashed: true, color: '#94A3B8' },
    ],
    circles: [],
    anchors: [
      { id: 'a', text: 'A', x: 58, y: 136 },
      { id: 'b', text: 'B', x: 58, y: 46 },
      { id: 'a1', text: "A'", x: 162, y: 136, color: '#087F70' },
      { id: 'b1', text: "B'", x: 162, y: 46, color: '#087F70' },
    ],
  })),
  makeItem('phys-lens-converging', 'Thấu kính hội tụ', 'physics', 'Quang học', () => ({
    lines: [
      { x1: 18, y1: 88, x2: 202, y2: 88, color: '#64748B' },
      { x1: 110, y1: 26, x2: 110, y2: 150, color: '#087F70', width: 2.4, arrow: true },
      { x1: 110, y1: 150, x2: 110, y2: 26, color: '#087F70', width: 2.4, arrow: true },
      { x1: 42, y1: 88, x2: 42, y2: 54, color: '#164E63', width: 2.2, arrow: true },
      { x1: 42, y1: 54, x2: 110, y2: 54, color: '#DC2626', width: 1.4 },
      { x1: 110, y1: 54, x2: 184, y2: 126, color: '#DC2626', width: 1.4 },
      { x1: 42, y1: 54, x2: 184, y2: 126, color: '#087F70', width: 1.4 },
      { x1: 178, y1: 88, x2: 178, y2: 122, color: '#DC2626', width: 2.2, arrow: true },
    ],
    points: [{ x: 76, y: 88 }, { x: 144, y: 88 }],
    circles: [],
    anchors: [
      { id: 'f', text: 'F', x: 76, y: 102 },
      { id: 'f1', text: "F'", x: 144, y: 102 },
      { id: 'b', text: 'B', x: 42, y: 44 },
      { id: 'b1', text: "B'", x: 178, y: 136, color: '#DC2626' },
    ],
  })),
  makeItem('phys-lens-diverging', 'Thấu kính phân kỳ', 'physics', 'Quang học', () => ({
    lines: [
      { x1: 18, y1: 88, x2: 202, y2: 88, color: '#64748B' },
      { x1: 110, y1: 28, x2: 110, y2: 148, color: '#087F70', width: 2.4 },
      { x1: 102, y1: 22, x2: 110, y2: 32, color: '#087F70', width: 2 },
      { x1: 118, y1: 22, x2: 110, y2: 32, color: '#087F70', width: 2 },
      { x1: 102, y1: 154, x2: 110, y2: 144, color: '#087F70', width: 2 },
      { x1: 118, y1: 154, x2: 110, y2: 144, color: '#087F70', width: 2 },
      { x1: 42, y1: 58, x2: 110, y2: 58, color: '#DC2626', width: 1.5, arrow: true },
      { x1: 110, y1: 58, x2: 176, y2: 32, color: '#DC2626', width: 1.5, arrow: true },
      { x1: 76, y1: 88, x2: 110, y2: 58, dashed: true, color: '#DC2626', width: 1.2 },
    ],
    points: [{ x: 76, y: 88 }, { x: 144, y: 88 }],
    circles: [],
    anchors: [
      { id: 'f', text: "F'", x: 76, y: 102 },
      { id: 'o', text: 'O', x: 118, y: 100 },
      { id: 'f2', text: 'F', x: 144, y: 102 },
    ],
  })),
  makeItem('phys-prism', 'Lăng kính tán sắc ánh sáng', 'physics', 'Quang học', () => ({
    lines: [
      { x1: 24, y1: 96, x2: 88, y2: 76, color: '#1F2937', width: 2, arrow: true },
      { x1: 88, y1: 76, x2: 134, y2: 78, color: '#DC2626', width: 1.6 },
      { x1: 134, y1: 78, x2: 194, y2: 96, color: '#DC2626', width: 1.8, arrow: true },
      { x1: 88, y1: 76, x2: 138, y2: 92, color: '#087F70', width: 1.6 },
      { x1: 138, y1: 92, x2: 194, y2: 124, color: '#2563EB', width: 1.8, arrow: true },
    ],
    polygons: [{ points: '110,32 62,132 158,132', fill: '#E0F2FE', fillOpacity: 0.45 }],
    circles: [],
    anchors: [
      { id: 'a', text: 'A', x: 110, y: 24 },
      { id: 'r', text: 'Đỏ', x: 192, y: 84, italic: false, fontSize: 10, color: '#DC2626' },
      { id: 'v', text: 'Tím', x: 192, y: 136, italic: false, fontSize: 10, color: '#2563EB' },
    ],
  })),
  makeItem('phys-electric-field', 'Đường sức điện trường (+q, −q)', 'physics', 'Điện & Từ trường', () => ({
    lines: [{ x1: 72, y1: 86, x2: 148, y2: 86, color: '#087F70', arrow: true }],
    paths: [
      { d: 'M 72,82 Q 110,30 148,82', color: '#087F70', width: 1.5 },
      { d: 'M 72,90 Q 110,142 148,90', color: '#087F70', width: 1.5 },
      { d: 'M 68,78 Q 110,6 152,78', color: '#087F70', width: 1.3 },
      { d: 'M 68,94 Q 110,166 152,94', color: '#087F70', width: 1.3 },
    ],
    circles: [
      { cx: 64, cy: 86, r: 12, fill: '#FEE2E2', color: '#DC2626' },
      { cx: 156, cy: 86, r: 12, fill: '#E0F2FE', color: '#164E63' },
    ],
    anchors: [
      { id: 'pos', text: '+q', x: 64, y: 86, centroidX: 64, centroidY: 160, color: '#DC2626', italic: false, fontSize: 11 },
      { id: 'neg', text: '−q', x: 156, y: 86, centroidX: 156, centroidY: 160, color: '#164E63', italic: false, fontSize: 11 },
    ],
  })),
  makeItem('phys-magnetic-field', 'Từ trường nam châm thẳng (N – S)', 'physics', 'Điện & Từ trường', () => ({
    lines: [],
    rects: [
      { x: 60, y: 74, w: 50, h: 24, fill: '#FECACA', color: '#DC2626' },
      { x: 110, y: 74, w: 50, h: 24, fill: '#BFDBFE', color: '#164E63' },
    ],
    paths: [
      { d: 'M 60,74 C 30,22 190,22 160,74', color: '#087F70', width: 1.5 },
      { d: 'M 60,98 C 30,150 190,150 160,98', color: '#087F70', width: 1.5 },
      { d: 'M 60,80 C 12,4 208,4 160,80', color: '#087F70', width: 1.2 },
    ],
    circles: [],
    anchors: [
      { id: 'n', text: 'N', x: 85, y: 86, centroidX: 85, centroidY: 150, italic: false, color: '#DC2626' },
      { id: 's', text: 'S', x: 135, y: 86, centroidX: 135, centroidY: 150, italic: false, color: '#164E63' },
    ],
  })),
];

export const CHEMISTRY_DIAGRAMS: ScientificDiagramItem[] = [
  makeItem('chem-test-tube', 'Ống nghiệm', 'chemistry', 'Dụng cụ thủy tinh', () => ({
    lines: [],
    paths: [
      { d: 'M 94,28 L 94,122 A 16,16 0 0,0 126,122 L 126,28', width: 2.2 },
      { d: 'M 90,28 L 130,28', width: 2.4 },
      { d: 'M 95,86 L 125,86 L 125,122 A 15,15 0 0,1 95,122 Z', fill: '#087F70', fillOpacity: 0.25, color: 'none' },
    ],
    circles: [],
    anchors: [{ id: 'lbl', text: 'Dung dịch', x: 158, y: 108, italic: false, fontSize: 11 }],
  })),
  makeItem('chem-test-tube-rack', 'Giá đỡ ống nghiệm', 'chemistry', 'Dụng cụ thí nghiệm', () => ({
    lines: [
      { x1: 34, y1: 68, x2: 186, y2: 68, width: 2.4 },
      { x1: 34, y1: 136, x2: 186, y2: 136, width: 3 },
      { x1: 42, y1: 68, x2: 42, y2: 136, width: 2.4 },
      { x1: 178, y1: 68, x2: 178, y2: 136, width: 2.4 },
    ],
    paths: [
      { d: 'M 64,34 L 64,120 A 10,10 0 0,0 84,120 L 84,34', fill: '#CCFBF1', fillOpacity: 0.45 },
      { d: 'M 100,34 L 100,120 A 10,10 0 0,0 120,120 L 120,34', fill: '#E0F2FE', fillOpacity: 0.45 },
      { d: 'M 136,34 L 136,120 A 10,10 0 0,0 156,120 L 156,34', fill: '#FEF3C7', fillOpacity: 0.45 },
    ],
    circles: [],
    anchors: [{ id: 't', text: 'Giá ống nghiệm', x: 110, y: 152, italic: false, fontSize: 11 }],
  })),
  makeItem('chem-beaker', 'Cốc thủy tinh', 'chemistry', 'Dụng cụ thủy tinh', () => ({
    lines: [
      { x1: 80, y1: 72, x2: 96, y2: 72, width: 1.2 },
      { x1: 80, y1: 92, x2: 92, y2: 92, width: 1.2 },
      { x1: 80, y1: 112, x2: 96, y2: 112, width: 1.2 },
    ],
    paths: [
      { d: 'M 64,36 L 72,44 L 72,134 Q 72,140 80,140 L 140,140 Q 148,140 148,134 L 148,36', width: 2.2 },
      { d: 'M 73,82 L 147,82 L 147,134 Q 147,139 140,139 L 80,139 Q 73,139 73,134 Z', fill: '#087F70', fillOpacity: 0.2, color: 'none' },
    ],
    circles: [],
    anchors: [{ id: 'v', text: '250 mL', x: 122, y: 72, italic: false, fontSize: 10 }],
  })),
  makeItem('chem-erlenmeyer', 'Bình tam giác (Erlenmeyer)', 'chemistry', 'Dụng cụ thủy tinh', () => ({
    lines: [],
    paths: [
      { d: 'M 94,28 L 126,28 M 98,28 L 98,64 L 62,134 Q 58,142 68,142 L 152,142 Q 162,142 158,134 L 122,64 L 122,28', width: 2.2 },
      { d: 'M 76,108 L 144,108 L 157,134 Q 160,141 151,141 L 69,141 Q 60,141 63,134 Z', fill: '#087F70', fillOpacity: 0.22, color: 'none' },
    ],
    circles: [],
    anchors: [{ id: 'l', text: 'Bình tam giác', x: 110, y: 156, italic: false, fontSize: 11 }],
  })),
  makeItem('chem-round-flask', 'Bình cầu đáy tròn', 'chemistry', 'Dụng cụ thủy tinh', () => ({
    lines: [],
    paths: [
      { d: 'M 94,26 L 126,26 M 98,26 L 98,66 A 38,38 0 1,0 122,66 L 122,26', width: 2.2 },
      { d: 'M 73,106 A 37,37 0 0,0 147,106 Z', fill: '#087F70', fillOpacity: 0.22, color: 'none' },
    ],
    circles: [],
    anchors: [{ id: 'l', text: 'Bình cầu', x: 110, y: 154, italic: false, fontSize: 11 }],
  })),
  makeItem('chem-volumetric-flask', 'Bình định mức', 'chemistry', 'Dụng cụ thủy tinh', () => ({
    lines: [{ x1: 99, y1: 54, x2: 121, y2: 54, color: '#DC2626', width: 1.8 }],
    paths: [
      { d: 'M 98,22 L 122,22 M 102,22 L 102,82 L 72,134 Q 68,142 78,142 L 142,142 Q 152,142 148,134 L 118,82 L 118,22', width: 2.2 },
    ],
    circles: [],
    anchors: [{ id: 'm', text: 'Vạch định mức', x: 162, y: 54, italic: false, fontSize: 10, color: '#DC2626' }],
  })),
  makeItem('chem-graduated-cylinder', 'Ống đong chia vạch', 'chemistry', 'Dụng cụ thủy tinh', () => ({
    lines: [
      { x1: 76, y1: 142, x2: 144, y2: 142, width: 3 },
      { x1: 96, y1: 48, x2: 110, y2: 48, width: 1.2 },
      { x1: 96, y1: 68, x2: 106, y2: 68, width: 1.2 },
      { x1: 96, y1: 88, x2: 110, y2: 88, width: 1.2 },
      { x1: 96, y1: 108, x2: 106, y2: 108, width: 1.2 },
    ],
    rects: [{ x: 94, y: 26, w: 32, h: 116, fill: 'rgba(8,127,112,0.12)' }],
    circles: [],
    anchors: [{ id: 'u', text: 'mL', x: 140, y: 36, italic: false, fontSize: 10 }],
  })),
  makeItem('chem-burette', 'Buret chuẩn độ', 'chemistry', 'Dụng cụ thí nghiệm', () => ({
    lines: [
      { x1: 102, y1: 20, x2: 102, y2: 114, width: 2 },
      { x1: 118, y1: 20, x2: 118, y2: 114, width: 2 },
      { x1: 102, y1: 114, x2: 110, y2: 146, width: 2 },
      { x1: 118, y1: 114, x2: 110, y2: 146, width: 2 },
      { x1: 94, y1: 122, x2: 128, y2: 122, color: '#DC2626', width: 3 },
      { x1: 102, y1: 42, x2: 112, y2: 42, width: 1.1 },
      { x1: 102, y1: 62, x2: 112, y2: 62, width: 1.1 },
      { x1: 102, y1: 82, x2: 112, y2: 82, width: 1.1 },
    ],
    circles: [],
    anchors: [{ id: 'k', text: 'Khóa', x: 148, y: 122, italic: false, fontSize: 10, color: '#DC2626' }],
  })),
  makeItem('chem-pipette', 'Pipet bầu', 'chemistry', 'Dụng cụ thí nghiệm', () => ({
    lines: [
      { x1: 106, y1: 18, x2: 106, y2: 58, width: 1.8 },
      { x1: 114, y1: 18, x2: 114, y2: 58, width: 1.8 },
      { x1: 106, y1: 104, x2: 110, y2: 148, width: 1.8 },
      { x1: 114, y1: 104, x2: 110, y2: 148, width: 1.8 },
    ],
    ellipses: [{ cx: 110, cy: 81, rx: 14, ry: 24, fill: 'rgba(8,127,112,0.16)' }],
    circles: [],
    anchors: [{ id: 'p', text: 'Pipet', x: 146, y: 81, italic: false, fontSize: 11 }],
  })),
  makeItem('chem-filter-funnel', 'Phễu lọc', 'chemistry', 'Dụng cụ thí nghiệm', () => ({
    lines: [
      { x1: 64, y1: 40, x2: 156, y2: 40, width: 2 },
      { x1: 64, y1: 40, x2: 104, y2: 96, width: 2 },
      { x1: 156, y1: 40, x2: 116, y2: 96, width: 2 },
      { x1: 104, y1: 96, x2: 104, y2: 144, width: 2 },
      { x1: 116, y1: 96, x2: 116, y2: 138, width: 2 },
      { x1: 104, y1: 144, x2: 116, y2: 138, width: 2 },
      { x1: 74, y1: 46, x2: 110, y2: 90, dashed: true, color: '#087F70' },
      { x1: 146, y1: 46, x2: 110, y2: 90, dashed: true, color: '#087F70' },
    ],
    circles: [],
    anchors: [{ id: 'g', text: 'Giấy lọc', x: 162, y: 60, italic: false, fontSize: 10, color: '#087F70' }],
  })),
  makeItem('chem-sep-funnel', 'Phễu chiết', 'chemistry', 'Dụng cụ thí nghiệm', () => ({
    lines: [
      { x1: 96, y1: 116, x2: 126, y2: 116, color: '#DC2626', width: 2.8 },
      { x1: 106, y1: 110, x2: 106, y2: 146, width: 1.8 },
      { x1: 114, y1: 110, x2: 114, y2: 146, width: 1.8 },
      { x1: 82, y1: 76, x2: 138, y2: 76, color: '#087F70', width: 1.4 },
    ],
    paths: [
      { d: 'M 98,26 L 122,26 M 102,26 L 102,38 Q 76,58 84,82 L 106,110 L 114,110 L 136,82 Q 144,58 118,38 L 118,26', width: 2 },
    ],
    circles: [],
    anchors: [
      { id: 'l1', text: 'Lớp trên', x: 166, y: 62, italic: false, fontSize: 10 },
      { id: 'l2', text: 'Lớp dưới', x: 166, y: 92, italic: false, fontSize: 10 },
    ],
  })),
  makeItem('chem-alcohol-lamp', 'Đèn cồn', 'chemistry', 'Dụng cụ thí nghiệm', () => ({
    lines: [{ x1: 110, y1: 62, x2: 110, y2: 88, width: 2.6 }],
    paths: [
      { d: 'M 110,32 Q 124,52 110,64 Q 96,52 110,32 Z', fill: '#F97316', fillOpacity: 0.7, color: '#DC2626' },
      { d: 'M 96,80 L 124,80 L 146,136 Q 148,144 138,144 L 82,144 Q 72,144 74,136 Z', fill: '#E0F2FE', fillOpacity: 0.45 },
    ],
    circles: [],
    anchors: [{ id: 'f', text: 'Ngọn lửa', x: 152, y: 48, italic: false, fontSize: 10, color: '#DC2626' }],
  })),
  makeItem('chem-gas-collection', 'Bộ thu khí (đẩy nước)', 'chemistry', 'Bộ thí nghiệm', () => ({
    lines: [
      { x1: 30, y1: 42, x2: 72, y2: 78, width: 2 },
      { x1: 20, y1: 54, x2: 62, y2: 90, width: 2 },
      { x1: 104, y1: 108, x2: 196, y2: 108, color: '#0284C7', width: 1.5 },
    ],
    paths: [{ d: 'M 66,76 Q 94,54 118,122 L 136,122 L 136,96', width: 1.8, color: '#087F70' }],
    rects: [
      { x: 102, y: 96, w: 96, h: 48, fill: 'rgba(2,132,199,0.12)' },
      { x: 124, y: 42, w: 42, h: 86, fill: 'rgba(8,127,112,0.12)' },
    ],
    circles: [],
    anchors: [
      { id: 'g', text: 'Khí thu', x: 145, y: 64, italic: false, fontSize: 10, color: '#087F70' },
      { id: 'w', text: 'Nước', x: 178, y: 128, italic: false, fontSize: 10 },
    ],
  })),
  makeItem('chem-distillation', 'Bộ chưng cất', 'chemistry', 'Bộ thí nghiệm', () => ({
    lines: [
      { x1: 68, y1: 52, x2: 148, y2: 88, width: 2 },
      { x1: 84, y1: 52, x2: 136, y2: 76, color: '#0284C7', width: 1.5 },
      { x1: 76, y1: 66, x2: 128, y2: 90, color: '#0284C7', width: 1.5 },
      { x1: 148, y1: 88, x2: 158, y2: 104, width: 1.8 },
    ],
    circles: [{ cx: 56, cy: 104, r: 24, fill: 'rgba(8,127,112,0.18)' }],
    paths: [
      { d: 'M 48,46 L 48,82 M 64,46 L 64,82', width: 2 },
      { d: 'M 150,104 L 136,140 L 180,140 L 166,104', fill: 'rgba(2,132,199,0.14)' },
    ],
    anchors: [
      { id: 'c', text: 'Sinh hàn', x: 122, y: 44, italic: false, fontSize: 10, color: '#0284C7' },
      { id: 'd', text: 'Dịch cất', x: 162, y: 154, italic: false, fontSize: 10 },
    ],
  })),
  makeItem('chem-titration', 'Bộ chuẩn độ axit – bazơ', 'chemistry', 'Bộ thí nghiệm', () => ({
    lines: [
      { x1: 48, y1: 24, x2: 48, y2: 146, width: 2.6 },
      { x1: 30, y1: 146, x2: 150, y2: 146, width: 3 },
      { x1: 48, y1: 54, x2: 108, y2: 54, width: 2 },
      { x1: 108, y1: 22, x2: 108, y2: 88, width: 2 },
      { x1: 118, y1: 22, x2: 118, y2: 88, width: 2 },
      { x1: 100, y1: 84, x2: 126, y2: 84, color: '#DC2626', width: 2.4 },
    ],
    paths: [{ d: 'M 106,102 L 90,144 L 136,144 L 120,102', fill: 'rgba(8,127,112,0.2)', width: 2 }],
    circles: [],
    anchors: [
      { id: 'b', text: 'Buret', x: 148, y: 46, italic: false, fontSize: 10 },
      { id: 'e', text: 'Erlen', x: 160, y: 126, italic: false, fontSize: 10 },
    ],
  })),
  makeItem('chem-benzene', 'Vòng benzen (C₆H₆)', 'chemistry', 'Cấu tạo phân tử', () => {
    const pts = regularPolygonPoints(110, 86, 48, 6);
    return {
      lines: pts.map((p, i) => ({ x1: p.x, y1: p.y, x2: pts[(i + 1) % 6].x, y2: pts[(i + 1) % 6].y })),
      circles: [{ cx: 110, cy: 86, r: 28, color: '#087F70' }],
      anchors: [{ id: 'f', text: 'C₆H₆', x: 110, y: 150, italic: false }],
    };
  }),
];
