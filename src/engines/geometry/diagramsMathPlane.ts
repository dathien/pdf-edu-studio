import { makeItem, oxyAxes, regularPolygonPoints, type ScientificDiagramItem } from './diagramHelpers';

export const MATH_PLANE_DIAGRAMS: ScientificDiagramItem[] = [
  makeItem('math-point', 'Điểm và vị trí tương đối', 'math', 'Cơ bản', () => ({
    lines: [],
    circles: [],
    points: [
      { x: 60, y: 85, r: 3.5 },
      { x: 112, y: 55, r: 3.5 },
      { x: 162, y: 105, r: 3.5 },
    ],
    anchors: [
      { id: 'a', text: 'A', x: 60, y: 85 },
      { id: 'b', text: 'B', x: 112, y: 55 },
      { id: 'c', text: 'C', x: 162, y: 105 },
    ],
  })),
  makeItem('math-segment', 'Đoạn thẳng AB', 'math', 'Cơ bản', () => ({
    lines: [{ x1: 42, y1: 95, x2: 178, y2: 75 }],
    circles: [],
    points: [{ x: 42, y: 95, r: 3.2 }, { x: 178, y: 75, r: 3.2 }],
    anchors: [{ id: 'a', text: 'A', x: 42, y: 95 }, { id: 'b', text: 'B', x: 178, y: 75 }],
  })),
  makeItem('math-ray', 'Tia Ox', 'math', 'Cơ bản', () => ({
    lines: [{ x1: 42, y1: 92, x2: 185, y2: 72, arrow: true }],
    circles: [],
    points: [{ x: 42, y: 92, r: 3.2 }],
    anchors: [{ id: 'o', text: 'O', x: 42, y: 92 }, { id: 'x', text: 'x', x: 185, y: 72 }],
  })),
  makeItem('math-line', 'Đường thẳng d', 'math', 'Cơ bản', () => ({
    lines: [{ x1: 28, y1: 110, x2: 192, y2: 58 }],
    circles: [],
    points: [{ x: 75, y: 95, r: 2.8 }, { x: 145, y: 73, r: 2.8 }],
    anchors: [
      { id: 'a', text: 'A', x: 75, y: 95 },
      { id: 'b', text: 'B', x: 145, y: 73 },
      { id: 'd', text: 'd', x: 188, y: 58 },
    ],
  })),
  makeItem('math-perp-bisector', 'Đường trung trực đoạn thẳng AB', 'math', 'Cơ bản', () => ({
    lines: [
      { x1: 42, y1: 88, x2: 178, y2: 88 },
      { x1: 110, y1: 22, x2: 110, y2: 152, color: '#087F70' },
    ],
    rects: [{ x: 110, y: 76, w: 12, h: 12, color: '#087F70' }],
    circles: [],
    points: [{ x: 42, y: 88 }, { x: 178, y: 88 }, { x: 110, y: 88, fill: '#087F70' }],
    anchors: [
      { id: 'a', text: 'A', x: 42, y: 88 },
      { id: 'b', text: 'B', x: 178, y: 88 },
      { id: 'm', text: 'M', x: 100, y: 102 },
      { id: 'd', text: 'd', x: 122, y: 28, color: '#087F70' },
    ],
  })),
  makeItem('math-angle-acute', 'Góc nhọn', 'math', 'Góc', () => ({
    lines: [
      { x1: 52, y1: 122, x2: 175, y2: 122 },
      { x1: 52, y1: 122, x2: 146, y2: 45 },
    ],
    circles: [],
    paths: [{ d: 'M 86,122 A 34,34 0 0,0 78,100', color: '#087F70', width: 1.4 }],
    points: [{ x: 52, y: 122 }],
    anchors: [
      { id: 'o', text: 'O', x: 52, y: 122 },
      { id: 'x', text: 'x', x: 175, y: 122 },
      { id: 'y', text: 'y', x: 146, y: 45 },
      { id: 'ang', text: 'α', x: 96, y: 106, centroidX: 52, centroidY: 122 },
    ],
  })),
  makeItem('math-angle-right', 'Góc vuông (90°)', 'math', 'Góc', () => ({
    lines: [
      { x1: 60, y1: 128, x2: 175, y2: 128 },
      { x1: 60, y1: 128, x2: 60, y2: 32 },
    ],
    circles: [],
    rects: [{ x: 60, y: 112, w: 16, h: 16, color: '#087F70' }],
    points: [{ x: 60, y: 128 }],
    anchors: [
      { id: 'o', text: 'O', x: 60, y: 128, centroidX: 110, centroidY: 80 },
      { id: 'x', text: 'x', x: 175, y: 128 },
      { id: 'y', text: 'y', x: 60, y: 32 },
    ],
  })),
  makeItem('math-angle-obtuse', 'Góc tù', 'math', 'Góc', () => ({
    lines: [
      { x1: 102, y1: 122, x2: 185, y2: 122 },
      { x1: 102, y1: 122, x2: 42, y2: 52 },
    ],
    circles: [],
    paths: [{ d: 'M 132,122 A 30,30 0 0,0 82,99', color: '#087F70', width: 1.4 }],
    points: [{ x: 102, y: 122 }],
    anchors: [
      { id: 'o', text: 'O', x: 102, y: 122, centroidX: 110, centroidY: 85 },
      { id: 'x', text: 'x', x: 185, y: 122 },
      { id: 'y', text: 'y', x: 42, y: 52 },
      { id: 'ang', text: 'β', x: 108, y: 84, centroidX: 102, centroidY: 122 },
    ],
  })),
  makeItem('math-parallel-transversal', 'Hai đường song song cắt bởi cát tuyến', 'math', 'Góc', () => ({
    lines: [
      { x1: 26, y1: 58, x2: 194, y2: 58 },
      { x1: 26, y1: 116, x2: 194, y2: 116 },
      { x1: 68, y1: 150, x2: 152, y2: 24, color: '#087F70' },
    ],
    circles: [],
    anchors: [
      { id: 'a', text: 'a', x: 194, y: 50 },
      { id: 'b', text: 'b', x: 194, y: 108 },
      { id: 'c', text: 'c', x: 156, y: 26, color: '#087F70' },
    ],
  })),
  makeItem('math-tri-scalene', 'Tam giác thường ABC', 'math', 'Tam giác', () => ({
    lines: [
      { x1: 42, y1: 132, x2: 180, y2: 132 },
      { x1: 42, y1: 132, x2: 88, y2: 34 },
      { x1: 88, y1: 34, x2: 180, y2: 132 },
    ],
    circles: [],
    points: [{ x: 88, y: 34 }, { x: 42, y: 132 }, { x: 180, y: 132 }],
    anchors: [
      { id: 'a', text: 'A', x: 88, y: 34 },
      { id: 'b', text: 'B', x: 42, y: 132 },
      { id: 'c', text: 'C', x: 180, y: 132 },
    ],
  })),
  makeItem('math-tri-isosceles', 'Tam giác cân ABC', 'math', 'Tam giác', () => ({
    lines: [
      { x1: 52, y1: 134, x2: 168, y2: 134 },
      { x1: 52, y1: 134, x2: 110, y2: 30 },
      { x1: 110, y1: 30, x2: 168, y2: 134 },
      { x1: 76, y1: 80, x2: 86, y2: 85, color: '#087F70', width: 1.4 },
      { x1: 144, y1: 80, x2: 134, y2: 85, color: '#087F70', width: 1.4 },
    ],
    circles: [],
    anchors: [
      { id: 'a', text: 'A', x: 110, y: 30 },
      { id: 'b', text: 'B', x: 52, y: 134 },
      { id: 'c', text: 'C', x: 168, y: 134 },
    ],
  })),
  makeItem('math-tri-equilateral', 'Tam giác đều ABC', 'math', 'Tam giác', () => ({
    lines: [
      { x1: 52, y1: 134, x2: 168, y2: 134 },
      { x1: 52, y1: 134, x2: 110, y2: 34 },
      { x1: 110, y1: 34, x2: 168, y2: 134 },
      { x1: 76, y1: 82, x2: 85, y2: 87, color: '#087F70' },
      { x1: 144, y1: 82, x2: 135, y2: 87, color: '#087F70' },
      { x1: 110, y1: 129, x2: 110, y2: 139, color: '#087F70' },
    ],
    circles: [],
    anchors: [
      { id: 'a', text: 'A', x: 110, y: 34 },
      { id: 'b', text: 'B', x: 52, y: 134 },
      { id: 'c', text: 'C', x: 168, y: 134 },
    ],
  })),
  makeItem('math-tri-right', 'Tam giác vuông ABC', 'math', 'Tam giác', () => ({
    lines: [
      { x1: 54, y1: 132, x2: 176, y2: 132 },
      { x1: 54, y1: 132, x2: 54, y2: 36 },
      { x1: 54, y1: 36, x2: 176, y2: 132 },
    ],
    rects: [{ x: 54, y: 118, w: 14, h: 14, color: '#087F70' }],
    circles: [],
    anchors: [
      { id: 'a', text: 'A', x: 54, y: 132, centroidX: 110, centroidY: 95 },
      { id: 'b', text: 'B', x: 54, y: 36 },
      { id: 'c', text: 'C', x: 176, y: 132 },
    ],
  })),
  makeItem('math-thales', 'Định lí Thalès (MN ∥ BC)', 'math', 'Tam giác', () => ({
    lines: [
      { x1: 106, y1: 28, x2: 42, y2: 136 },
      { x1: 106, y1: 28, x2: 176, y2: 136 },
      { x1: 42, y1: 136, x2: 176, y2: 136 },
      { x1: 76, y1: 78, x2: 138, y2: 78, color: '#087F70', width: 2 },
    ],
    circles: [],
    anchors: [
      { id: 'a', text: 'A', x: 106, y: 28 },
      { id: 'b', text: 'B', x: 42, y: 136 },
      { id: 'c', text: 'C', x: 176, y: 136 },
      { id: 'm', text: 'M', x: 70, y: 78, color: '#087F70' },
      { id: 'n', text: 'N', x: 146, y: 78, color: '#087F70' },
    ],
  })),
  makeItem('math-pythagoras', 'Định lí Pythagore (a² + b² = c²)', 'math', 'Tam giác', () => ({
    lines: [],
    polygons: [
      { points: '86,116 146,116 86,66', fill: '#087F70', fillOpacity: 0.16, color: '#164E63' },
      { points: '86,116 146,116 146,154 86,154', fill: '#087F70', fillOpacity: 0.08, color: '#087F70' },
      { points: '48,66 86,66 86,116 48,116', fill: '#164E63', fillOpacity: 0.08, color: '#164E63' },
    ],
    rects: [{ x: 86, y: 106, w: 10, h: 10, color: '#DC2626' }],
    circles: [],
    anchors: [
      { id: 'a', text: 'a', x: 76, y: 92 },
      { id: 'b', text: 'b', x: 116, y: 126 },
      { id: 'c', text: 'c', x: 122, y: 84 },
    ],
  })),
  makeItem('math-tri-median', 'Đường trung tuyến AM', 'math', 'Đường đặc biệt', () => ({
    lines: [
      { x1: 42, y1: 132, x2: 180, y2: 132 },
      { x1: 42, y1: 132, x2: 88, y2: 34 },
      { x1: 88, y1: 34, x2: 180, y2: 132 },
      { x1: 88, y1: 34, x2: 111, y2: 132, color: '#087F70' },
    ],
    circles: [],
    points: [{ x: 111, y: 132, fill: '#087F70' }],
    anchors: [
      { id: 'a', text: 'A', x: 88, y: 34 },
      { id: 'b', text: 'B', x: 42, y: 132 },
      { id: 'c', text: 'C', x: 180, y: 132 },
      { id: 'm', text: 'M', x: 111, y: 132 },
    ],
  })),
  makeItem('math-tri-altitude', 'Đường cao AH', 'math', 'Đường đặc biệt', () => ({
    lines: [
      { x1: 42, y1: 132, x2: 180, y2: 132 },
      { x1: 42, y1: 132, x2: 92, y2: 34 },
      { x1: 92, y1: 34, x2: 180, y2: 132 },
      { x1: 92, y1: 34, x2: 92, y2: 132, color: '#087F70' },
    ],
    rects: [{ x: 92, y: 120, w: 12, h: 12, color: '#087F70' }],
    circles: [],
    anchors: [
      { id: 'a', text: 'A', x: 92, y: 34 },
      { id: 'b', text: 'B', x: 42, y: 132 },
      { id: 'c', text: 'C', x: 180, y: 132 },
      { id: 'h', text: 'H', x: 92, y: 132 },
    ],
  })),
  makeItem('math-tri-bisector', 'Đường phân giác AD', 'math', 'Đường đặc biệt', () => ({
    lines: [
      { x1: 42, y1: 132, x2: 180, y2: 132 },
      { x1: 42, y1: 132, x2: 90, y2: 34 },
      { x1: 90, y1: 34, x2: 180, y2: 132 },
      { x1: 90, y1: 34, x2: 103, y2: 132, color: '#087F70' },
    ],
    paths: [
      { d: 'M 79,56 A 24,24 0 0,0 93,58', color: '#087F70', width: 1.3 },
      { d: 'M 94,61 A 27,27 0 0,0 108,54', color: '#087F70', width: 1.3 },
    ],
    circles: [],
    anchors: [
      { id: 'a', text: 'A', x: 90, y: 34 },
      { id: 'b', text: 'B', x: 42, y: 132 },
      { id: 'c', text: 'C', x: 180, y: 132 },
      { id: 'd', text: 'D', x: 103, y: 132 },
    ],
  })),
  makeItem('math-tri-centroid', 'Trọng tâm G của tam giác', 'math', 'Đường đặc biệt', () => ({
    lines: [
      { x1: 42, y1: 134, x2: 178, y2: 134 },
      { x1: 42, y1: 134, x2: 96, y2: 32 },
      { x1: 96, y1: 32, x2: 178, y2: 134 },
      { x1: 96, y1: 32, x2: 110, y2: 134, color: '#087F70', dashed: true },
      { x1: 42, y1: 134, x2: 137, y2: 83, color: '#087F70', dashed: true },
      { x1: 178, y1: 134, x2: 69, y2: 83, color: '#087F70', dashed: true },
    ],
    circles: [],
    points: [{ x: 105.3, y: 100, r: 3.6, fill: '#DC2626' }],
    anchors: [
      { id: 'a', text: 'A', x: 96, y: 32 },
      { id: 'b', text: 'B', x: 42, y: 134 },
      { id: 'c', text: 'C', x: 178, y: 134 },
      { id: 'g', text: 'G', x: 105.3, y: 100, color: '#DC2626' },
    ],
  })),
  makeItem('math-tri-orthocenter', 'Trực tâm H của tam giác', 'math', 'Đường đặc biệt', () => ({
    lines: [
      { x1: 42, y1: 134, x2: 178, y2: 134 },
      { x1: 42, y1: 134, x2: 100, y2: 32 },
      { x1: 100, y1: 32, x2: 178, y2: 134 },
      { x1: 100, y1: 32, x2: 100, y2: 134, color: '#087F70', dashed: true },
      { x1: 42, y1: 134, x2: 138, y2: 82, color: '#087F70', dashed: true },
      { x1: 178, y1: 134, x2: 72, y2: 81, color: '#087F70', dashed: true },
    ],
    circles: [],
    points: [{ x: 100, y: 97, r: 3.6, fill: '#DC2626' }],
    anchors: [
      { id: 'a', text: 'A', x: 100, y: 32 },
      { id: 'b', text: 'B', x: 42, y: 134 },
      { id: 'c', text: 'C', x: 178, y: 134 },
      { id: 'h', text: 'H', x: 100, y: 97, color: '#DC2626' },
    ],
  })),
  makeItem('math-tri-incenter', 'Tâm đường tròn nội tiếp I', 'math', 'Đường đặc biệt', () => ({
    lines: [
      { x1: 42, y1: 134, x2: 178, y2: 134 },
      { x1: 42, y1: 134, x2: 105, y2: 28 },
      { x1: 105, y1: 28, x2: 178, y2: 134 },
    ],
    circles: [{ cx: 107, cy: 101, r: 33, color: '#087F70' }],
    points: [{ x: 107, y: 101, r: 3.2, fill: '#DC2626' }],
    anchors: [
      { id: 'a', text: 'A', x: 105, y: 28 },
      { id: 'b', text: 'B', x: 42, y: 134 },
      { id: 'c', text: 'C', x: 178, y: 134 },
      { id: 'i', text: 'I', x: 107, y: 101, color: '#DC2626' },
    ],
  })),
  makeItem('math-tri-circumcenter', 'Tâm đường tròn ngoại tiếp O', 'math', 'Đường đặc biệt', () => ({
    lines: [
      { x1: 58, y1: 118, x2: 162, y2: 118 },
      { x1: 58, y1: 118, x2: 96, y2: 28 },
      { x1: 96, y1: 28, x2: 162, y2: 118 },
    ],
    circles: [{ cx: 110, cy: 86, r: 61, color: '#087F70' }],
    points: [{ x: 110, y: 86, r: 3.2, fill: '#DC2626' }],
    anchors: [
      { id: 'a', text: 'A', x: 96, y: 28 },
      { id: 'b', text: 'B', x: 58, y: 118 },
      { id: 'c', text: 'C', x: 162, y: 118 },
      { id: 'o', text: 'O', x: 110, y: 86, color: '#DC2626' },
    ],
  })),
  makeItem('math-square', 'Hình vuông ABCD', 'math', 'Tứ giác & Đa giác', () => ({
    lines: [
      { x1: 62, y1: 36, x2: 158, y2: 36 },
      { x1: 158, y1: 36, x2: 158, y2: 132 },
      { x1: 158, y1: 132, x2: 62, y2: 132 },
      { x1: 62, y1: 132, x2: 62, y2: 36 },
    ],
    rects: [{ x: 62, y: 120, w: 12, h: 12, color: '#087F70' }],
    circles: [],
    anchors: [
      { id: 'a', text: 'A', x: 62, y: 36 },
      { id: 'b', text: 'B', x: 158, y: 36 },
      { id: 'c', text: 'C', x: 158, y: 132 },
      { id: 'd', text: 'D', x: 62, y: 132 },
    ],
  })),
  makeItem('math-rectangle', 'Hình chữ nhật ABCD', 'math', 'Tứ giác & Đa giác', () => ({
    lines: [
      { x1: 42, y1: 44, x2: 178, y2: 44 },
      { x1: 178, y1: 44, x2: 178, y2: 126 },
      { x1: 178, y1: 126, x2: 42, y2: 126 },
      { x1: 42, y1: 126, x2: 42, y2: 44 },
    ],
    rects: [{ x: 42, y: 114, w: 12, h: 12, color: '#087F70' }],
    circles: [],
    anchors: [
      { id: 'a', text: 'A', x: 42, y: 44 },
      { id: 'b', text: 'B', x: 178, y: 44 },
      { id: 'c', text: 'C', x: 178, y: 126 },
      { id: 'd', text: 'D', x: 42, y: 126 },
    ],
  })),
  makeItem('math-parallelogram', 'Hình bình hành ABCD', 'math', 'Tứ giác & Đa giác', () => ({
    lines: [
      { x1: 68, y1: 44, x2: 184, y2: 44 },
      { x1: 184, y1: 44, x2: 152, y2: 128 },
      { x1: 152, y1: 128, x2: 36, y2: 128 },
      { x1: 36, y1: 128, x2: 68, y2: 44 },
    ],
    circles: [],
    anchors: [
      { id: 'a', text: 'A', x: 68, y: 44 },
      { id: 'b', text: 'B', x: 184, y: 44 },
      { id: 'c', text: 'C', x: 152, y: 128 },
      { id: 'd', text: 'D', x: 36, y: 128 },
    ],
  })),
  makeItem('math-rhombus', 'Hình thoi ABCD', 'math', 'Tứ giác & Đa giác', () => ({
    lines: [
      { x1: 110, y1: 28, x2: 176, y2: 85 },
      { x1: 176, y1: 85, x2: 110, y2: 142 },
      { x1: 110, y1: 142, x2: 44, y2: 85 },
      { x1: 44, y1: 85, x2: 110, y2: 28 },
      { x1: 110, y1: 28, x2: 110, y2: 142, dashed: true, color: '#087F70' },
      { x1: 44, y1: 85, x2: 176, y2: 85, dashed: true, color: '#087F70' },
    ],
    circles: [],
    anchors: [
      { id: 'a', text: 'A', x: 110, y: 28 },
      { id: 'b', text: 'B', x: 176, y: 85 },
      { id: 'c', text: 'C', x: 110, y: 142 },
      { id: 'd', text: 'D', x: 44, y: 85 },
    ],
  })),
  makeItem('math-trapezoid', 'Hình thang ABCD', 'math', 'Tứ giác & Đa giác', () => ({
    lines: [
      { x1: 72, y1: 42, x2: 148, y2: 42 },
      { x1: 148, y1: 42, x2: 182, y2: 128 },
      { x1: 182, y1: 128, x2: 38, y2: 128 },
      { x1: 38, y1: 128, x2: 72, y2: 42 },
    ],
    circles: [],
    anchors: [
      { id: 'a', text: 'A', x: 72, y: 42 },
      { id: 'b', text: 'B', x: 148, y: 42 },
      { id: 'c', text: 'C', x: 182, y: 128 },
      { id: 'd', text: 'D', x: 38, y: 128 },
    ],
  })),
  makeItem('math-isosceles-trapezoid', 'Hình thang cân ABCD', 'math', 'Tứ giác & Đa giác', () => ({
    lines: [
      { x1: 72, y1: 44, x2: 148, y2: 44 },
      { x1: 148, y1: 44, x2: 176, y2: 128 },
      { x1: 176, y1: 128, x2: 44, y2: 128 },
      { x1: 44, y1: 128, x2: 72, y2: 44 },
      { x1: 53, y1: 84, x2: 63, y2: 88, color: '#087F70' },
      { x1: 167, y1: 84, x2: 157, y2: 88, color: '#087F70' },
    ],
    circles: [],
    anchors: [
      { id: 'a', text: 'A', x: 72, y: 44 },
      { id: 'b', text: 'B', x: 148, y: 44 },
      { id: 'c', text: 'C', x: 176, y: 128 },
      { id: 'd', text: 'D', x: 44, y: 128 },
    ],
  })),
  makeItem('math-right-trapezoid', 'Hình thang vuông ABCD', 'math', 'Tứ giác & Đa giác', () => ({
    lines: [
      { x1: 54, y1: 44, x2: 138, y2: 44 },
      { x1: 138, y1: 44, x2: 176, y2: 128 },
      { x1: 176, y1: 128, x2: 54, y2: 128 },
      { x1: 54, y1: 128, x2: 54, y2: 44 },
    ],
    rects: [
      { x: 54, y: 44, w: 12, h: 12, color: '#087F70' },
      { x: 54, y: 116, w: 12, h: 12, color: '#087F70' },
    ],
    circles: [],
    anchors: [
      { id: 'a', text: 'A', x: 54, y: 44 },
      { id: 'b', text: 'B', x: 138, y: 44 },
      { id: 'c', text: 'C', x: 176, y: 128 },
      { id: 'd', text: 'D', x: 54, y: 128 },
    ],
  })),
  makeItem('math-pentagon', 'Ngũ giác đều ABCDE', 'math', 'Tứ giác & Đa giác', () => {
    const pts = regularPolygonPoints(110, 88, 56, 5);
    return {
      lines: pts.map((p, i) => ({ x1: p.x, y1: p.y, x2: pts[(i + 1) % 5].x, y2: pts[(i + 1) % 5].y })),
      circles: [],
      anchors: pts.map((p, i) => ({ id: `v${i}`, text: String.fromCharCode(65 + i), x: p.x, y: p.y })),
    };
  }),
  makeItem('math-hexagon', 'Lục giác đều ABCDEF', 'math', 'Tứ giác & Đa giác', () => {
    const pts = regularPolygonPoints(110, 86, 56, 6);
    return {
      lines: pts.map((p, i) => ({ x1: p.x, y1: p.y, x2: pts[(i + 1) % 6].x, y2: pts[(i + 1) % 6].y })),
      circles: [],
      anchors: pts.map((p, i) => ({ id: `v${i}`, text: String.fromCharCode(65 + i), x: p.x, y: p.y })),
    };
  }),
  makeItem('math-octagon', 'Bát giác đều', 'math', 'Tứ giác & Đa giác', () => {
    const pts = regularPolygonPoints(110, 86, 56, 8, -Math.PI / 8);
    return {
      lines: pts.map((p, i) => ({ x1: p.x, y1: p.y, x2: pts[(i + 1) % 8].x, y2: pts[(i + 1) % 8].y })),
      circles: [],
      points: [{ x: 110, y: 86 }],
      anchors: [{ id: 'o', text: 'O', x: 110, y: 86 }],
    };
  }),
  makeItem('math-circle', 'Đường tròn tâm O, bán kính R', 'math', 'Đường tròn', () => ({
    lines: [{ x1: 110, y1: 85, x2: 160, y2: 65, color: '#087F70' }],
    circles: [{ cx: 110, cy: 85, r: 54 }],
    points: [{ x: 110, y: 85 }, { x: 160, y: 65 }],
    anchors: [
      { id: 'o', text: 'O', x: 110, y: 85 },
      { id: 'r', text: 'R', x: 135, y: 74, centroidX: 110, centroidY: 110 },
      { id: 'm', text: 'M', x: 160, y: 65 },
    ],
  })),
  makeItem('math-tangent', 'Tiếp tuyến đường tròn tại M', 'math', 'Đường tròn', () => ({
    lines: [
      { x1: 95, y1: 86, x2: 143, y2: 86, color: '#087F70' },
      { x1: 143, y1: 22, x2: 143, y2: 150, color: '#DC2626' },
    ],
    rects: [{ x: 133, y: 76, w: 10, h: 10, color: '#087F70' }],
    circles: [{ cx: 95, cy: 86, r: 48 }],
    points: [{ x: 95, y: 86 }, { x: 143, y: 86, fill: '#DC2626' }],
    anchors: [
      { id: 'o', text: 'O', x: 95, y: 86 },
      { id: 'm', text: 'M', x: 143, y: 86 },
      { id: 'd', text: 'd', x: 143, y: 26 },
    ],
  })),
  makeItem('math-secant', 'Cát tuyến đường tròn', 'math', 'Đường tròn', () => ({
    lines: [{ x1: 30, y1: 120, x2: 188, y2: 42, color: '#087F70' }],
    circles: [{ cx: 110, cy: 88, r: 48 }],
    points: [{ x: 110, y: 88 }, { x: 68, y: 101 }, { x: 152, y: 60 }],
    anchors: [
      { id: 'o', text: 'O', x: 110, y: 88 },
      { id: 'a', text: 'A', x: 68, y: 101 },
      { id: 'b', text: 'B', x: 152, y: 60 },
      { id: 'd', text: 'd', x: 185, y: 44 },
    ],
  })),
  makeItem('math-two-tangents', 'Hai tiếp tuyến cắt nhau tại M', 'math', 'Đường tròn', () => ({
    lines: [
      { x1: 182, y1: 86, x2: 104, y2: 42 },
      { x1: 182, y1: 86, x2: 104, y2: 130 },
      { x1: 86, y1: 86, x2: 182, y2: 86, dashed: true, color: '#087F70' },
      { x1: 86, y1: 86, x2: 104, y2: 42, dashed: true, color: '#087F70' },
    ],
    circles: [{ cx: 86, cy: 86, r: 46 }],
    points: [{ x: 86, y: 86 }, { x: 182, y: 86 }, { x: 104, y: 42 }, { x: 104, y: 130 }],
    anchors: [
      { id: 'o', text: 'O', x: 86, y: 86 },
      { id: 'm', text: 'M', x: 182, y: 86 },
      { id: 'a', text: 'A', x: 104, y: 42 },
      { id: 'b', text: 'B', x: 104, y: 130 },
    ],
  })),
  makeItem('math-inscribed-angle', 'Góc nội tiếp và góc ở tâm', 'math', 'Đường tròn', () => ({
    lines: [
      { x1: 80, y1: 42, x2: 75, y2: 122 },
      { x1: 80, y1: 42, x2: 156, y2: 105 },
      { x1: 110, y1: 86, x2: 75, y2: 122, color: '#087F70' },
      { x1: 110, y1: 86, x2: 156, y2: 105, color: '#087F70' },
    ],
    circles: [{ cx: 110, cy: 86, r: 52 }],
    points: [{ x: 110, y: 86 }, { x: 80, y: 42 }, { x: 75, y: 122 }, { x: 156, y: 105 }],
    anchors: [
      { id: 'o', text: 'O', x: 110, y: 86 },
      { id: 'a', text: 'A', x: 80, y: 42 },
      { id: 'b', text: 'B', x: 75, y: 122 },
      { id: 'c', text: 'C', x: 156, y: 105 },
    ],
  })),
  makeItem('math-circle-sector', 'Hình quạt tròn bán kính R', 'math', 'Đường tròn', () => ({
    lines: [
      { x1: 105, y1: 124, x2: 162, y2: 92 },
      { x1: 105, y1: 124, x2: 72, y2: 64 },
    ],
    paths: [{ d: 'M 105,124 L 162,92 A 66,66 0 0,0 72,64 Z', fill: '#087F70', fillOpacity: 0.18, color: '#087F70' }],
    circles: [],
    anchors: [
      { id: 'o', text: 'O', x: 105, y: 136 },
      { id: 'a', text: 'A', x: 166, y: 92 },
      { id: 'b', text: 'B', x: 68, y: 58 },
      { id: 'r', text: 'R', x: 142, y: 116 },
    ],
  })),
  makeItem('math-two-circles', 'Hai đường tròn cắt nhau', 'math', 'Đường tròn', () => ({
    lines: [
      { x1: 82, y1: 86, x2: 144, y2: 86, dashed: true, color: '#087F70' },
      { x1: 116, y1: 46, x2: 116, y2: 126, color: '#DC2626' },
    ],
    circles: [{ cx: 82, cy: 86, r: 50 }, { cx: 144, cy: 86, r: 44 }],
    points: [{ x: 82, y: 86 }, { x: 144, y: 86 }, { x: 116, y: 49, fill: '#DC2626' }, { x: 116, y: 123, fill: '#DC2626' }],
    anchors: [
      { id: 'o1', text: 'O₁', x: 76, y: 98 },
      { id: 'o2', text: 'O₂', x: 150, y: 98 },
      { id: 'a', text: 'A', x: 118, y: 38, color: '#DC2626' },
      { id: 'b', text: 'B', x: 118, y: 136, color: '#DC2626' },
    ],
  })),
  makeItem('math-venn-2', 'Biểu đồ Venn 2 tập hợp', 'math', 'Tập hợp & Tọa độ', () => ({
    lines: [],
    circles: [
      { cx: 88, cy: 86, r: 46, fill: 'rgba(8,127,112,0.12)', color: '#087F70' },
      { cx: 132, cy: 86, r: 46, fill: 'rgba(22,78,99,0.12)', color: '#164E63' },
    ],
    anchors: [
      { id: 'a', text: 'A', x: 64, y: 86, centroidX: 110, centroidY: 86, italic: false },
      { id: 'b', text: 'B', x: 156, y: 86, centroidX: 110, centroidY: 86, italic: false },
      { id: 'ab', text: 'A∩B', x: 110, y: 86, centroidX: 110, centroidY: 140, italic: false, fontSize: 11 },
    ],
  })),
  makeItem('math-venn-3', 'Biểu đồ Venn 3 tập hợp', 'math', 'Tập hợp & Tọa độ', () => ({
    lines: [],
    circles: [
      { cx: 90, cy: 70, r: 38, fill: 'rgba(8,127,112,0.11)', color: '#087F70' },
      { cx: 130, cy: 70, r: 38, fill: 'rgba(22,78,99,0.11)', color: '#164E63' },
      { cx: 110, cy: 106, r: 38, fill: 'rgba(220,38,38,0.09)', color: '#DC2626' },
    ],
    anchors: [
      { id: 'a', text: 'A', x: 74, y: 58, italic: false },
      { id: 'b', text: 'B', x: 146, y: 58, italic: false },
      { id: 'c', text: 'C', x: 110, y: 128, italic: false },
    ],
  })),
  makeItem('math-number-line', 'Trục số thực và khoảng (a; b]', 'math', 'Tập hợp & Tọa độ', () => ({
    lines: [
      { x1: 20, y1: 86, x2: 200, y2: 86, arrow: true },
      { x1: 72, y1: 86, x2: 148, y2: 86, color: '#087F70', width: 3.5 },
      { x1: 110, y1: 80, x2: 110, y2: 92 },
    ],
    circles: [
      { cx: 72, cy: 86, r: 4, fill: '#FFFFFF', color: '#087F70' },
      { cx: 148, cy: 86, r: 4, fill: '#087F70', color: '#087F70' },
    ],
    anchors: [
      { id: 'a', text: 'a', x: 72, y: 102, centroidX: 72, centroidY: 86 },
      { id: 'o', text: '0', x: 110, y: 102, centroidX: 110, centroidY: 86, italic: false },
      { id: 'b', text: 'b', x: 148, y: 102, centroidX: 148, centroidY: 86 },
    ],
  })),
  makeItem('math-oxy', 'Hệ tọa độ Oxy', 'math', 'Tập hợp & Tọa độ', () => ({
    lines: [
      ...oxyAxes(),
      { x1: 150, y1: 88, x2: 150, y2: 46, dashed: true, color: '#087F70' },
      { x1: 110, y1: 46, x2: 150, y2: 46, dashed: true, color: '#087F70' },
    ],
    circles: [],
    points: [{ x: 150, y: 46, r: 3.4, fill: '#DC2626' }],
    anchors: [
      { id: 'o', text: 'O', x: 100, y: 99, centroidX: 110, centroidY: 88 },
      { id: 'x', text: 'x', x: 200, y: 98 },
      { id: 'y', text: 'y', x: 120, y: 16 },
      { id: 'm', text: 'M(x;y)', x: 156, y: 38, fontSize: 11 },
    ],
  })),
  makeItem('math-oxyz', 'Hệ tọa độ không gian Oxyz', 'math', 'Tập hợp & Tọa độ', () => ({
    lines: [
      { x1: 105, y1: 95, x2: 105, y2: 20, arrow: true },
      { x1: 105, y1: 95, x2: 192, y2: 95, arrow: true },
      { x1: 105, y1: 95, x2: 52, y2: 142, arrow: true },
    ],
    circles: [],
    points: [{ x: 105, y: 95 }],
    anchors: [
      { id: 'o', text: 'O', x: 96, y: 88 },
      { id: 'x', text: 'x', x: 46, y: 148 },
      { id: 'y', text: 'y', x: 196, y: 95 },
      { id: 'z', text: 'z', x: 105, y: 14 },
    ],
  })),
  makeItem('math-vector-sum', 'Quy tắc hình bình hành cộng vectơ', 'math', 'Tập hợp & Tọa độ', () => ({
    lines: [
      { x1: 48, y1: 125, x2: 138, y2: 125, arrow: true, color: '#164E63' },
      { x1: 48, y1: 125, x2: 86, y2: 48, arrow: true, color: '#164E63' },
      { x1: 48, y1: 125, x2: 176, y2: 48, arrow: true, color: '#DC2626', width: 2.2 },
      { x1: 138, y1: 125, x2: 176, y2: 48, dashed: true, color: '#94A3B8' },
      { x1: 86, y1: 48, x2: 176, y2: 48, dashed: true, color: '#94A3B8' },
    ],
    circles: [],
    anchors: [
      { id: 'o', text: 'O', x: 48, y: 125 },
      { id: 'a', text: 'a⃗', x: 96, y: 136 },
      { id: 'b', text: 'b⃗', x: 56, y: 78 },
      { id: 's', text: 'a⃗+b⃗', x: 178, y: 42, color: '#DC2626', fontSize: 11 },
    ],
  })),
  makeItem('math-vector-dot', 'Góc giữa hai vectơ', 'math', 'Tập hợp & Tọa độ', () => ({
    lines: [
      { x1: 54, y1: 124, x2: 176, y2: 124, arrow: true, color: '#164E63' },
      { x1: 54, y1: 124, x2: 140, y2: 42, arrow: true, color: '#087F70' },
    ],
    paths: [{ d: 'M 90,124 A 36,36 0 0,0 80,98', color: '#DC2626', width: 1.5 }],
    circles: [],
    anchors: [
      { id: 'o', text: 'O', x: 48, y: 132 },
      { id: 'u', text: 'u⃗', x: 106, y: 74, color: '#087F70' },
      { id: 'v', text: 'v⃗', x: 138, y: 136 },
      { id: 'a', text: 'α', x: 96, y: 108, color: '#DC2626' },
    ],
  })),
];
