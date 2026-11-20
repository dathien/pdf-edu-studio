import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { Check, ChevronDown, ChevronUp, Download, RotateCcw, X } from 'lucide-react';
import {
  renderSmartLabelsSvg,
  resolveSmartLabels,
  type SmartLabelAnchor,
  type SmartSegmentObstacle,
} from '../../engines/geometry/labelLayout';
import { triggerDownload } from '../../engines/pdf/pdfEngine';
import { useStudioStore } from '../../stores/useStudioStore';

type SolidKind =
  | 'cube'
  | 'cuboid'
  | 'square-pyramid'
  | 'tetrahedron'
  | 'frustum-pyramid'
  | 'tri-prism'
  | 'hex-prism'
  | 'cylinder'
  | 'cone'
  | 'sphere';

interface SolidDef {
  vertices: Array<{ label: string; pos: [number, number, number] }>;
  edges: Array<[number, number]>;
  buildGeometry: (r: number, h: number) => THREE.BufferGeometry;
}

const SOLID_LIST: Array<{ id: SolidKind; label: string }> = [
  { id: 'cube', label: 'Hình lập phương' },
  { id: 'cuboid', label: 'Hình hộp chữ nhật' },
  { id: 'square-pyramid', label: 'Chóp tứ giác S.ABCD' },
  { id: 'tetrahedron', label: 'Tứ diện S.ABC' },
  { id: 'frustum-pyramid', label: 'Hình chóp cụt' },
  { id: 'tri-prism', label: 'Lăng trụ tam giác' },
  { id: 'hex-prism', label: 'Lăng trụ lục giác' },
  { id: 'cylinder', label: 'Hình trụ' },
  { id: 'cone', label: 'Hình nón' },
  { id: 'sphere', label: 'Hình cầu' },
];

function getSolidDefinition(kind: SolidKind, r: number, h: number): SolidDef {
  const halfH = h / 2;
  switch (kind) {
    case 'cube': {
      const a = r;
      const v: SolidDef['vertices'] = [
        { label: 'A', pos: [-a, -a, a] },
        { label: 'B', pos: [a, -a, a] },
        { label: 'C', pos: [a, -a, -a] },
        { label: 'D', pos: [-a, -a, -a] },
        { label: "A'", pos: [-a, a, a] },
        { label: "B'", pos: [a, a, a] },
        { label: "C'", pos: [a, a, -a] },
        { label: "D'", pos: [-a, a, -a] },
      ];
      return {
        vertices: v,
        edges: [
          [0, 1], [1, 2], [2, 3], [3, 0],
          [4, 5], [5, 6], [6, 7], [7, 4],
          [0, 4], [1, 5], [2, 6], [3, 7],
        ],
        buildGeometry: () => new THREE.BoxGeometry(a * 2, a * 2, a * 2),
      };
    }
    case 'cuboid': {
      const w = r * 1.4;
      const d = r * 0.9;
      return {
        vertices: [
          { label: 'A', pos: [-w, -halfH, d] },
          { label: 'B', pos: [w, -halfH, d] },
          { label: 'C', pos: [w, -halfH, -d] },
          { label: 'D', pos: [-w, -halfH, -d] },
          { label: "A'", pos: [-w, halfH, d] },
          { label: "B'", pos: [w, halfH, d] },
          { label: "C'", pos: [w, halfH, -d] },
          { label: "D'", pos: [-w, halfH, -d] },
        ],
        edges: [
          [0, 1], [1, 2], [2, 3], [3, 0],
          [4, 5], [5, 6], [6, 7], [7, 4],
          [0, 4], [1, 5], [2, 6], [3, 7],
        ],
        buildGeometry: () => new THREE.BoxGeometry(w * 2, h, d * 2),
      };
    }
    case 'square-pyramid': {
      const a = r * 1.1;
      return {
        vertices: [
          { label: 'S', pos: [0, halfH, 0] },
          { label: 'A', pos: [-a, -halfH, a] },
          { label: 'B', pos: [a, -halfH, a] },
          { label: 'C', pos: [a, -halfH, -a] },
          { label: 'D', pos: [-a, -halfH, -a] },
        ],
        edges: [
          [1, 2], [2, 3], [3, 4], [4, 1],
          [0, 1], [0, 2], [0, 3], [0, 4],
        ],
        buildGeometry: () => {
          const g = new THREE.ConeGeometry(a * Math.SQRT2, h, 4);
          g.rotateY(Math.PI / 4);
          return g;
        },
      };
    }
    case 'tetrahedron': {
      const a = r * 1.2;
      const v0: [number, number, number] = [0, halfH, 0];
      const v1: [number, number, number] = [0, -halfH, a];
      const v2: [number, number, number] = [a * 0.866, -halfH, -a * 0.5];
      const v3: [number, number, number] = [-a * 0.866, -halfH, -a * 0.5];
      return {
        vertices: [
          { label: 'S', pos: v0 },
          { label: 'A', pos: v1 },
          { label: 'B', pos: v2 },
          { label: 'C', pos: v3 },
        ],
        edges: [[0, 1], [0, 2], [0, 3], [1, 2], [2, 3], [3, 1]],
        buildGeometry: () => new THREE.ConeGeometry(a, h, 3),
      };
    }
    case 'frustum-pyramid': {
      const rb = r * 1.25;
      const rt = r * 0.65;
      return {
        vertices: [
          { label: 'A', pos: [-rb, -halfH, rb] },
          { label: 'B', pos: [rb, -halfH, rb] },
          { label: 'C', pos: [rb, -halfH, -rb] },
          { label: 'D', pos: [-rb, -halfH, -rb] },
          { label: "A'", pos: [-rt, halfH, rt] },
          { label: "B'", pos: [rt, halfH, rt] },
          { label: "C'", pos: [rt, halfH, -rt] },
          { label: "D'", pos: [-rt, halfH, -rt] },
        ],
        edges: [
          [0, 1], [1, 2], [2, 3], [3, 0],
          [4, 5], [5, 6], [6, 7], [7, 4],
          [0, 4], [1, 5], [2, 6], [3, 7],
        ],
        buildGeometry: () => {
          const g = new THREE.CylinderGeometry(rt * Math.SQRT2, rb * Math.SQRT2, h, 4);
          g.rotateY(Math.PI / 4);
          return g;
        },
      };
    }
    case 'tri-prism': {
      const a = r * 1.2;
      const pts = [0, 1, 2].map((i) => {
        const ang = (i * 2 * Math.PI) / 3 + Math.PI / 6;
        return [Math.cos(ang) * a, Math.sin(ang) * a] as const;
      });
      return {
        vertices: [
          { label: 'A', pos: [pts[0][0], -halfH, pts[0][1]] },
          { label: 'B', pos: [pts[1][0], -halfH, pts[1][1]] },
          { label: 'C', pos: [pts[2][0], -halfH, pts[2][1]] },
          { label: "A'", pos: [pts[0][0], halfH, pts[0][1]] },
          { label: "B'", pos: [pts[1][0], halfH, pts[1][1]] },
          { label: "C'", pos: [pts[2][0], halfH, pts[2][1]] },
        ],
        edges: [
          [0, 1], [1, 2], [2, 0],
          [3, 4], [4, 5], [5, 3],
          [0, 3], [1, 4], [2, 5],
        ],
        buildGeometry: () => {
          const g = new THREE.CylinderGeometry(a, a, h, 3);
          g.rotateY(Math.PI / 3);
          return g;
        },
      };
    }
    case 'hex-prism': {
      const a = r * 1.15;
      const verts: SolidDef['vertices'] = [];
      const edges: Array<[number, number]> = [];
      for (let i = 0; i < 6; i++) {
        const ang = (i * Math.PI) / 3;
        verts.push({ label: String.fromCharCode(65 + i), pos: [Math.cos(ang) * a, -halfH, Math.sin(ang) * a] });
      }
      for (let i = 0; i < 6; i++) {
        const ang = (i * Math.PI) / 3;
        verts.push({ label: `${String.fromCharCode(65 + i)}'`, pos: [Math.cos(ang) * a, halfH, Math.sin(ang) * a] });
        edges.push([i, (i + 1) % 6], [6 + i, 6 + ((i + 1) % 6)], [i, 6 + i]);
      }
      return {
        vertices: verts,
        edges,
        buildGeometry: () => new THREE.CylinderGeometry(a, a, h, 6),
      };
    }
    case 'cylinder':
      return {
        vertices: [
          { label: 'O', pos: [0, -halfH, 0] },
          { label: "O'", pos: [0, halfH, 0] },
          { label: 'A', pos: [r, -halfH, 0] },
        ],
        edges: [[0, 1], [0, 2]],
        buildGeometry: () => new THREE.CylinderGeometry(r, r, h, 36),
      };
    case 'cone':
      return {
        vertices: [
          { label: 'S', pos: [0, halfH, 0] },
          { label: 'O', pos: [0, -halfH, 0] },
          { label: 'A', pos: [r, -halfH, 0] },
        ],
        edges: [[0, 1], [1, 2], [0, 2]],
        buildGeometry: () => new THREE.ConeGeometry(r, h, 36),
      };
    case 'sphere':
      return {
        vertices: [
          { label: 'O', pos: [0, 0, 0] },
          { label: 'A', pos: [r, 0, 0] },
        ],
        edges: [[0, 1]],
        buildGeometry: () => new THREE.SphereGeometry(r * 1.1, 32, 24),
      };
  }
}

interface Solid3DModalProps {
  onClose: () => void;
}

export const Solid3DModal: React.FC<Solid3DModalProps> = ({ onClose }) => {
  const documents = useStudioStore((s) => s.documents);
  const activeDocId = useStudioStore((s) => s.activeDocId);
  const addObject = useStudioStore((s) => s.addObject);
  const notify = useStudioStore((s) => s.notify);

  const [solidKind, setSolidKind] = useState<SolidKind>('square-pyramid');
  const [radius, setRadius] = useState(1.2);
  const [height, setHeight] = useState(2.2);
  const [showFaces, setShowFaces] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [showSectionPlane, setShowSectionPlane] = useState(false);
  const [sectionY, setSectionY] = useState(0);
  const [dockOpen, setDockOpen] = useState(true);

  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    controls: OrbitControls;
    group: THREE.Group;
    requestRender: () => void;
  } | null>(null);

  // Initialize Three.js once with on-demand rendering & RoomEnvironment
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    const gl = renderer.getContext();
    const dbg = gl.getExtension('WEBGL_debug_renderer_info');
    const gpuStr = dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)) : '';
    const isSoftwareGl = /SwiftShader|llvmpipe|Software/i.test(gpuStr);

    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth || 720, container.clientHeight || 440);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#F4F8F7');

    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;

    const camera = new THREE.PerspectiveCamera(
      40,
      (container.clientWidth || 720) / Math.max(1, container.clientHeight || 440),
      0.1,
      100
    );
    camera.position.set(4.2, 3.2, 4.6);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = false; // clean on-demand rendering without idle rAF spin
    controls.target.set(0, 0, 0);

    const hemi = new THREE.HemisphereLight('#ffffff', '#cbd5e1', 0.9);
    scene.add(hemi);
    const dir = new THREE.DirectionalLight('#ffffff', 1.1);
    dir.position.set(5, 8, 6);
    scene.add(dir);

    const grid = new THREE.GridHelper(8, 16, '#94a3b8', '#cbd5e1');
    grid.position.y = -1.6;
    scene.add(grid);

    const group = new THREE.Group();
    scene.add(group);

    let rafId = 0;
    const renderNow = () => {
      rafId = 0;
      renderer.render(scene, camera);
    };
    const requestRender = () => {
      if (!rafId) rafId = requestAnimationFrame(renderNow);
    };

    controls.addEventListener('change', requestRender);

    const ro = new ResizeObserver(() => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w > 0 && h > 0) {
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
        requestRender();
      }
    });
    ro.observe(container);

    sceneRef.current = { scene, camera, renderer, controls, group, requestRender };
    requestRender();

    return () => {
      ro.disconnect();
      if (rafId) cancelAnimationFrame(rafId);
      controls.dispose();
      pmrem.dispose();
      envTex.dispose();
      renderer.dispose();
      sceneRef.current = null;
    };
  }, []);

  // Rebuild 3D solid meshes whenever parameters change
  useEffect(() => {
    const ctx = sceneRef.current;
    if (!ctx) return;

    while (ctx.group.children.length > 0) {
      const child = ctx.group.children[0];
      ctx.group.remove(child);
      if ((child as THREE.Mesh).geometry) (child as THREE.Mesh).geometry.dispose();
    }

    const def = getSolidDefinition(solidKind, radius, height);
    const geom = def.buildGeometry(radius, height);

    if (showFaces) {
      const mat = new THREE.MeshStandardMaterial({
        color: '#087F70',
        transparent: true,
        opacity: 0.24,
        roughness: 0.35,
        metalness: 0.05,
        side: THREE.DoubleSide,
      });
      ctx.group.add(new THREE.Mesh(geom, mat));
    }

    const edgesGeom = new THREE.EdgesGeometry(geom, 18);
    const edgeMat = new THREE.LineBasicMaterial({ color: '#164E63' });
    ctx.group.add(new THREE.LineSegments(edgesGeom, edgeMat));

    // Axis / internal dashed helpers
    if (solidKind === 'cylinder' || solidKind === 'cone' || solidKind === 'sphere') {
      for (const [i, j] of def.edges) {
        const a = def.vertices[i].pos;
        const b = def.vertices[j].pos;
        const lineG = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(...a),
          new THREE.Vector3(...b),
        ]);
        const lineM = new THREE.LineDashedMaterial({ color: '#DC2626', dashSize: 0.14, gapSize: 0.08 });
        const line = new THREE.Line(lineG, lineM);
        line.computeLineDistances();
        ctx.group.add(line);
      }
    }

    // Optional cutting plane
    if (showSectionPlane) {
      const planeGeom = new THREE.PlaneGeometry(radius * 3.2, radius * 3.2);
      planeGeom.rotateX(-Math.PI / 2);
      const planeMat = new THREE.MeshBasicMaterial({
        color: '#DC2626',
        transparent: true,
        opacity: 0.22,
        side: THREE.DoubleSide,
      });
      const planeMesh = new THREE.Mesh(planeGeom, planeMat);
      planeMesh.position.y = sectionY;
      ctx.group.add(planeMesh);
    }

    ctx.requestRender();
  }, [solidKind, radius, height, showFaces, showSectionPlane, sectionY]);

  // Project live 3D camera viewpoint to crisp 2D Vector SVG with hidden dashed lines + smart labels
  const generateProjectedSvg = (): string => {
    const ctx = sceneRef.current;
    const W = 440;
    const H = 340;
    const def = getSolidDefinition(solidKind, radius, height);
    const cam = ctx?.camera;

    const project = (pos: [number, number, number]) => {
      if (!cam) return { x: W / 2, y: H / 2, z: 0 };
      const v = new THREE.Vector3(pos[0], pos[1], pos[2]).project(cam);
      return {
        x: ((v.x + 1) / 2) * W,
        y: ((1 - v.y) / 2) * H,
        z: v.z,
      };
    };

    const projVerts = def.vertices.map((v) => ({ label: v.label, ...project(v.pos) }));
    const avgZ = projVerts.reduce((s, p) => s + p.z, 0) / Math.max(1, projVerts.length);
    const obstacles: SmartSegmentObstacle[] = [];
    const lines: string[] = [];

    if (solidKind === 'cylinder' || solidKind === 'cone' || solidKind === 'sphere') {
      // Smooth curved solids projection
      const cx = W / 2;
      const cy = H / 2;
      const rx = radius * 68;
      const ry = radius * 22;
      const hh = height * 54;
      if (solidKind === 'sphere') {
        lines.push(`<circle cx="${cx}" cy="${cy}" r="${(radius * 72).toFixed(1)}" fill="#087F70" fill-opacity="0.08" stroke="#164E63" stroke-width="2"/>`);
        lines.push(`<ellipse cx="${cx}" cy="${cy}" rx="${(radius * 72).toFixed(1)}" ry="${(radius * 24).toFixed(1)}" fill="none" stroke="#164E63" stroke-width="1.3" stroke-dasharray="5 4"/>`);
      } else if (solidKind === 'cone') {
        lines.push(`<line x1="${cx}" y1="${cy - hh}" x2="${cx - rx}" y2="${cy + hh * 0.65}" stroke="#164E63" stroke-width="2"/>`);
        lines.push(`<line x1="${cx}" y1="${cy - hh}" x2="${cx + rx}" y2="${cy + hh * 0.65}" stroke="#164E63" stroke-width="2"/>`);
        lines.push(`<path d="M ${cx - rx} ${cy + hh * 0.65} A ${rx} ${ry} 0 0 0 ${cx + rx} ${cy + hh * 0.65}" fill="none" stroke="#164E63" stroke-width="2"/>`);
        lines.push(`<path d="M ${cx - rx} ${cy + hh * 0.65} A ${rx} ${ry} 0 0 1 ${cx + rx} ${cy + hh * 0.65}" fill="none" stroke="#164E63" stroke-width="1.5" stroke-dasharray="5 4"/>`);
        lines.push(`<line x1="${cx}" y1="${cy - hh}" x2="${cx}" y2="${cy + hh * 0.65}" stroke="#DC2626" stroke-width="1.4" stroke-dasharray="4 4"/>`);
      } else {
        lines.push(`<ellipse cx="${cx}" cy="${cy - hh * 0.6}" rx="${rx}" ry="${ry}" fill="#087F70" fill-opacity="0.08" stroke="#164E63" stroke-width="2"/>`);
        lines.push(`<line x1="${cx - rx}" y1="${cy - hh * 0.6}" x2="${cx - rx}" y2="${cy + hh * 0.6}" stroke="#164E63" stroke-width="2"/>`);
        lines.push(`<line x1="${cx + rx}" y1="${cy - hh * 0.6}" x2="${cx + rx}" y2="${cy + hh * 0.6}" stroke="#164E63" stroke-width="2"/>`);
        lines.push(`<path d="M ${cx - rx} ${cy + hh * 0.6} A ${rx} ${ry} 0 0 0 ${cx + rx} ${cy + hh * 0.6}" fill="none" stroke="#164E63" stroke-width="2"/>`);
        lines.push(`<path d="M ${cx - rx} ${cy + hh * 0.6} A ${rx} ${ry} 0 0 1 ${cx + rx} ${cy + hh * 0.6}" fill="none" stroke="#164E63" stroke-width="1.5" stroke-dasharray="5 4"/>`);
      }
    } else {
      for (const [i, j] of def.edges) {
        const a = projVerts[i];
        const b = projVerts[j];
        if (!a || !b) continue;
        obstacles.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y });
        const isBack = (a.z + b.z) / 2 > avgZ + 0.012;
        lines.push(
          `<line x1="${a.x.toFixed(1)}" y1="${a.y.toFixed(1)}" x2="${b.x.toFixed(1)}" y2="${b.y.toFixed(1)}" stroke="#164E63" stroke-width="${isBack ? '1.4' : '2'}"${isBack ? ' stroke-dasharray="6 4"' : ''}/>`
        );
      }
    }

    let labelSvg = '';
    if (showLabels) {
      const anchors: SmartLabelAnchor[] = projVerts.map((v, idx) => ({
        id: `v-${idx}`,
        text: v.label,
        x: v.x,
        y: v.y,
        fontSize: 14,
        color: '#164E63',
      }));
      const placed = resolveSmartLabels(anchors, obstacles, { width: W, height: H, padding: 14 });
      labelSvg = renderSmartLabelsSvg(placed);
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="#FFFFFF"/>${lines.join('')}${labelSvg}</svg>`;
  };

  const handleInsertVectorToPdf = () => {
    const doc = documents.find((d) => d.id === activeDocId);
    if (!doc) return;
    const page = doc.pages[doc.currentPageIndex];
    if (!page) return;
    const svg = generateProjectedSvg();
    const labelName = SOLID_LIST.find((s) => s.id === solidKind)?.label || 'Hình 3D';
    addObject({
      id: `solid3d-${Date.now()}`,
      type: 'diagram',
      pageId: page.id,
      x: 130,
      y: 150,
      width: 240,
      height: 185,
      rotation: 0,
      zIndex: 25,
      opacity: 1,
      title: labelName,
      subject: 'math',
      svgMarkup: svg,
      strokeColor: '#164E63',
      strokeWidth: 2,
      strokeStyle: 'solid',
      labels: [],
      sourceKind: 'solid-3d',
    });
    notify('Đã xuất hình chiếu vector 2D sắc nét từ góc nhìn 3D hiện tại vào trang PDF', 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/65 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[88vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Compact Top Header */}
        <div className="bg-[#164E63] text-white px-5 py-3 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-[18.5px] font-bold">Xưởng Hình học không gian 3D</h2>
            <p className="text-[13px] text-teal-100">
              Kéo chuột để xoay góc nhìn 3D — khi chèn vào PDF sẽ xuất thành hình chiếu vector 2D nét liền/nét đứt sắc nét.
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/15 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Full-bleed WebGL Stage (Zero opaque sidebars covering canvas, zero backdrop-filter over WebGL) */}
        <div className="flex-1 relative min-h-0 bg-[#F4F8F7]">
          <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
        </div>

        {/* Collapsible Bottom Control Dock */}
        <div className="bg-white border-t border-slate-200 shrink-0">
          <div className="px-4 py-2 flex items-center justify-between border-b border-slate-100">
            <button
              type="button"
              onClick={() => setDockOpen(!dockOpen)}
              className="flex items-center gap-1.5 text-[14px] font-bold text-[#164E63] cursor-pointer"
            >
              {dockOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              <span>Tùy chỉnh khối hình & mặt cắt</span>
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const c = sceneRef.current;
                  if (c) {
                    c.camera.position.set(4.2, 3.2, 4.6);
                    c.controls.target.set(0, 0, 0);
                    c.controls.update();
                    c.requestRender();
                  }
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-[13.5px] font-medium cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" /> Góc nhìn chuẩn
              </button>
              <button
                type="button"
                onClick={() =>
                  triggerDownload(
                    new Blob([generateProjectedSvg()], { type: 'image/svg+xml;charset=utf-8' }),
                    `Hinh_3D_${solidKind}.svg`
                  )
                }
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-[13.5px] font-semibold cursor-pointer"
              >
                <Download className="w-4 h-4" /> Xuất SVG
              </button>
              <button
                type="button"
                onClick={handleInsertVectorToPdf}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#087F70] hover:bg-[#06695d] text-white text-[14px] font-semibold cursor-pointer"
              >
                <Check className="w-4 h-4" /> Chèn hình chiếu vào PDF
              </button>
            </div>
          </div>

          {dockOpen && (
            <div className="p-3.5 space-y-3 text-[13.5px]">
              <div className="flex items-center gap-1.5 flex-wrap">
                {SOLID_LIST.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSolidKind(s.id)}
                    className={`px-2.5 py-1 rounded-lg font-semibold cursor-pointer ${
                      solidKind === s.id
                        ? 'bg-[#087F70] text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-[#E6F1EF]'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-5 flex-wrap">
                <label className="flex items-center gap-2">
                  <span>Bán kính / Đáy</span>
                  <input
                    type="range"
                    min={0.6}
                    max={2.0}
                    step={0.1}
                    value={radius}
                    onChange={(e) => setRadius(Number(e.target.value))}
                    className="w-24 accent-[#087F70]"
                  />
                </label>
                <label className="flex items-center gap-2">
                  <span>Chiều cao</span>
                  <input
                    type="range"
                    min={1.0}
                    max={3.2}
                    step={0.1}
                    value={height}
                    onChange={(e) => setHeight(Number(e.target.value))}
                    className="w-24 accent-[#087F70]"
                  />
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={showFaces} onChange={(e) => setShowFaces(e.target.checked)} className="accent-[#087F70]" />
                  <span>Mặt trong suốt</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={showLabels} onChange={(e) => setShowLabels(e.target.checked)} className="accent-[#087F70]" />
                  <span>Nhãn đỉnh</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showSectionPlane}
                    onChange={(e) => setShowSectionPlane(e.target.checked)}
                    className="accent-[#DC2626]"
                  />
                  <span>Mặt phẳng cắt</span>
                </label>
                {showSectionPlane && (
                  <input
                    type="range"
                    min={-1.2}
                    max={1.2}
                    step={0.05}
                    value={sectionY}
                    onChange={(e) => setSectionY(Number(e.target.value))}
                    className="w-24 accent-[#DC2626]"
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
