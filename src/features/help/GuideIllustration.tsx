import React, { useState } from 'react';
import { Maximize2, X } from 'lucide-react';
import type { GuideIllustrationKey } from './guideData';

interface GuideIllustrationProps {
  illustrationKey: GuideIllustrationKey;
  caption: string;
}

const Callout: React.FC<{ cx: number; cy: number; n: string }> = ({ cx, cy, n }) => (
  <g>
    <circle cx={cx} cy={cy} r="13" fill="#DC2626" stroke="#FFFFFF" strokeWidth="2.5" />
    <text
      x={cx}
      y={cy + 4.5}
      textAnchor="middle"
      fontSize="12"
      fontWeight="700"
      fill="#FFFFFF"
      fontFamily="system-ui, sans-serif"
    >
      {n}
    </text>
  </g>
);

const AppChrome: React.FC<{ activeTab: string }> = ({ activeTab }) => {
  const tabs = ['Tệp', 'Chỉnh sửa', 'Công thức', 'Hình vẽ', 'Chú thích', 'Chấm bài', 'Trang PDF', 'Bảo mật', 'Hiển thị'];
  return (
    <g>
      <rect x="0" y="0" width="760" height="36" fill="#164E63" />
      <rect x="14" y="8" width="20" height="20" rx="4" fill="#087F70" />
      <text x="42" y="23" fontSize="13" fontWeight="700" fill="#FFFFFF" fontFamily="system-ui, sans-serif">
        PDF EDU STUDIO
      </text>
      <rect x="592" y="7" width="152" height="22" rx="5" fill="rgba(255,255,255,0.16)" />
      <text x="668" y="22" textAnchor="middle" fontSize="11" fontWeight="600" fill="#FFFFFF" fontFamily="system-ui, sans-serif">
        Hướng dẫn sử dụng
      </text>
      <rect x="0" y="36" width="760" height="32" fill="#FFFFFF" />
      <line x1="0" y1="68" x2="760" y2="68" stroke="#E2E8F0" />
      {tabs.map((t, i) => {
        const x = 12 + i * 74;
        const isActive = t === activeTab;
        return (
          <g key={t}>
            {isActive && (
              <>
                <rect x={x} y="40" width="70" height="28" rx="4" fill="#F4F8F7" />
                <rect x={x} y="65" width="70" height="3" fill="#087F70" />
              </>
            )}
            <text
              x={x + 35}
              y="57"
              textAnchor="middle"
              fontSize="11"
              fontWeight={isActive ? '700' : '500'}
              fill={isActive ? '#087F70' : '#475569'}
              fontFamily="system-ui, sans-serif"
            >
              {t}
            </text>
          </g>
        );
      })}
      <rect x="688" y="42" width="60" height="22" rx="5" fill="#087F70" />
      <text x="718" y="56.5" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#FFFFFF" fontFamily="system-ui, sans-serif">
        Lưu PDF
      </text>
    </g>
  );
};

function renderIllustrationSvg(key: GuideIllustrationKey): React.ReactNode {
  switch (key) {
    case 'edit-text-before-after':
      return (
        <svg viewBox="0 0 760 360" className="w-full h-auto block">
          <rect width="760" height="360" fill="#F4F8F7" />
          <AppChrome activeTab="Chỉnh sửa" />
          {/* Highlighted button */}
          <rect x="0" y="68" width="760" height="36" fill="#FAFCFB" />
          <rect x="112" y="73" width="120" height="26" rx="6" fill="#087F70" stroke="#F59E0B" strokeWidth="2.5" />
          <text x="172" y="90" textAnchor="middle" fontSize="11.5" fontWeight="700" fill="#FFFFFF">Sửa chữ gốc (E)</text>

          {/* Before card */}
          <rect x="34" y="124" width="310" height="210" rx="10" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.5" />
          <rect x="34" y="124" width="310" height="32" rx="10" fill="#FEF2F2" />
          <text x="189" y="145" textAnchor="middle" fontSize="12.5" fontWeight="700" fill="#DC2626">TRƯỚC KHI SỬA (Chữ PDF gốc)</text>
          <text x="58" y="184" fontSize="13" fontWeight="700" fill="#1E293B">ĐỀ KIỂM TRA GIỮA HỌC KỲ I</text>
          <rect x="54" y="198" width="236" height="30" rx="4" fill="#CCFBF1" fillOpacity="0.45" stroke="#087F70" strokeWidth="2" strokeDasharray="5 3" />
          <text x="64" y="218" fontSize="13.5" fontWeight="700" fill="#164E63">Môn Toán – Lớp: 10A1 (45 phút)</text>
          <text x="58" y="256" fontSize="12" fill="#475569">Câu 1 (2,0 điểm): Cho tập hợp A = ...</text>
          <text x="58" y="282" fontSize="11.5" fill="#087F70" fontWeight="600">↳ Nhấp vào khung nét đứt màu xanh</text>

          {/* Arrow */}
          <path d="M 358 228 L 402 228" stroke="#087F70" strokeWidth="4" strokeLinecap="round" />
          <polygon points="402,220 416,228 402,236" fill="#087F70" />

          {/* After card */}
          <rect x="424" y="124" width="302" height="210" rx="10" fill="#FFFFFF" stroke="#087F70" strokeWidth="2" />
          <rect x="424" y="124" width="302" height="32" rx="10" fill="#ECFDF5" />
          <text x="575" y="145" textAnchor="middle" fontSize="12.5" fontWeight="700" fill="#059669">SAU KHI SỬA (Thay thế sạch nét)</text>
          <text x="448" y="184" fontSize="13" fontWeight="700" fill="#1E293B">ĐỀ KIỂM TRA GIỮA HỌC KỲ I</text>
          <rect x="444" y="198" width="250" height="30" rx="4" fill="#FFFFFF" stroke="#087F70" strokeWidth="2" />
          <text x="454" y="218" fontSize="13.5" fontWeight="700" fill="#087F70">Môn Toán – Lớp: 10A2 (60 phút)</text>
          <text x="448" y="256" fontSize="12" fill="#475569">Câu 1 (2,0 điểm): Cho tập hợp A = ...</text>
          <text x="448" y="282" fontSize="11.5" fill="#059669" fontWeight="600">✓ Font tiếng Việt chuẩn, không lộ chữ cũ</text>

          <Callout cx={238} cy={84} n="1" />
          <Callout cx={292} cy={212} n="2" />
          <Callout cx={696} cy={212} n="3" />
        </svg>
      );

    case 'formula-mathlive':
    case 'formula-science':
      return (
        <svg viewBox="0 0 760 360" className="w-full h-auto block">
          <rect width="760" height="360" fill="#F4F8F7" />
          <AppChrome activeTab="Công thức" />
          {/* Left: PDF preview */}
          <rect x="26" y="92" width="376" height="248" rx="8" fill="#FFFFFF" stroke="#CBD5E1" />
          <text x="46" y="122" fontSize="13" fontWeight="700" fill="#1E293B">
            {key === 'formula-science' ? 'Câu 2 (Hóa học 11): Xét cân bằng hóa học:' : 'Câu 3 (Toán 12): Tính nghiệm và tích phân:'}
          </text>
          <rect x="64" y="146" width="298" height="74" rx="8" fill="#F0FDFA" stroke="#087F70" strokeWidth="2" />
          <text x="213" y="190" textAnchor="middle" fontSize="20" fontWeight="700" fill="#164E63" fontFamily="Georgia, serif">
            {key === 'formula-science' ? 'N₂(g) + 3H₂(g)  ⇌  2NH₃(g)' : 'x = (−b ± √(b² − 4ac)) / 2a'}
          </text>
          <text x="213" y="246" textAnchor="middle" fontSize="12" fill="#087F70" fontWeight="600">
            Nháy đúp trực tiếp vào công thức trên trang để sửa lại
          </text>

          {/* Right: MathLive Panel */}
          <rect x="424" y="88" width="314" height="254" rx="10" fill="#FFFFFF" stroke="#087F70" strokeWidth="2" />
          <text x="440" y="112" fontSize="13" fontWeight="700" fill="#164E63">Soạn thảo công thức MathLive</text>
          {/* Subject tabs */}
          {['Toán', 'Vật lí', 'Hóa học', 'Sinh học', 'Tin học'].map((s, idx) => (
            <g key={s}>
              <rect
                x={440 + idx * 57}
                y="122"
                width="53"
                height="22"
                rx="4"
                fill={(key === 'formula-science' ? idx === 2 : idx === 0) ? '#087F70' : '#F1F5F9'}
              />
              <text
                x={466.5 + idx * 57}
                y="136.5"
                textAnchor="middle"
                fontSize="10.5"
                fontWeight="600"
                fill={(key === 'formula-science' ? idx === 2 : idx === 0) ? '#FFFFFF' : '#475569'}
              >
                {s}
              </text>
            </g>
          ))}
          {/* MathLive input box */}
          <rect x="440" y="154" width="282" height="50" rx="6" fill="#F8FAFC" stroke="#087F70" strokeWidth="1.8" />
          <text x="581" y="185" textAnchor="middle" fontSize="15" fontWeight="700" fill="#164E63" fontFamily="Georgia, serif">
            {key === 'formula-science' ? 'N₂ + 3H₂ ⇌ 2NH₃' : '∫₀^π sin(x) dx = 2'}
          </text>
          {/* Symbol keypad */}
          {['a/b', '√x', 'xⁿ', '∫', '∑', '⇌', 'Δ', 'Ω'].map((sym, idx) => (
            <g key={sym}>
              <rect x={440 + (idx % 4) * 72} y={214 + Math.floor(idx / 4) * 32} width="64" height="26" rx="5" fill="#E6F1EF" />
              <text x={472 + (idx % 4) * 72} y={231 + Math.floor(idx / 4) * 32} textAnchor="middle" fontSize="12" fontWeight="700" fill="#164E63">
                {sym}
              </text>
            </g>
          ))}
          {/* Insert button */}
          <rect x="440" y="290" width="282" height="36" rx="8" fill="#087F70" />
          <text x="581" y="313" textAnchor="middle" fontSize="13" fontWeight="700" fill="#FFFFFF">
            Chèn vào trang PDF (Vector SVG)
          </text>

          {/* Arrow from panel to PDF */}
          <path d="M 434 306 Q 380 306 340 226" fill="none" stroke="#DC2626" strokeWidth="2.5" strokeDasharray="5 3" />

          <Callout cx={581} cy={132} n="1" />
          <Callout cx={712} cy={226} n="2" />
          <Callout cx={712} cy={308} n="3" />
        </svg>
      );

    case 'diagram-library':
      return (
        <svg viewBox="0 0 760 360" className="w-full h-auto block">
          <rect width="760" height="360" fill="#F4F8F7" />
          <AppChrome activeTab="Hình vẽ" />
          {/* Left PDF page with inserted circuit */}
          <rect x="28" y="88" width="388" height="254" rx="8" fill="#FFFFFF" stroke="#CBD5E1" />
          <text x="48" y="116" fontSize="13" fontWeight="700" fill="#1E293B">Phiếu bài tập Vật lí – Mạch RLC nối tiếp</text>
          <rect x="76" y="138" width="284" height="156" rx="8" fill="#FAFCFB" stroke="#087F70" strokeWidth="2" />
          {/* Crisp RLC circuit SVG */}
          <line x1="106" y1="205" x2="146" y2="205" stroke="#164E63" strokeWidth="2.2" />
          <rect x="146" y="195" width="44" height="20" fill="#FFFFFF" stroke="#164E63" strokeWidth="2" />
          <text x="168" y="188" textAnchor="middle" fontSize="12" fontWeight="700" fill="#164E63">R</text>
          <line x1="190" y1="205" x2="212" y2="205" stroke="#164E63" strokeWidth="2.2" />
          <path d="M212,205 Q219,190 226,205 Q233,190 240,205 Q247,190 254,205" fill="none" stroke="#164E63" strokeWidth="2.2" />
          <text x="233" y="188" textAnchor="middle" fontSize="12" fontWeight="700" fill="#164E63">L</text>
          <line x1="254" y1="205" x2="278" y2="205" stroke="#164E63" strokeWidth="2.2" />
          <line x1="278" y1="191" x2="278" y2="219" stroke="#164E63" strokeWidth="2.5" />
          <line x1="288" y1="191" x2="288" y2="219" stroke="#164E63" strokeWidth="2.5" />
          <text x="283" y="184" textAnchor="middle" fontSize="12" fontWeight="700" fill="#164E63">C</text>
          <line x1="288" y1="205" x2="326" y2="205" stroke="#164E63" strokeWidth="2.2" />
          <circle cx="106" cy="205" r="3.5" fill="#087F70" />
          <circle cx="326" cy="205" r="3.5" fill="#087F70" />
          <text x="106" y="226" textAnchor="middle" fontSize="12" fontWeight="700" fill="#087F70">A</text>
          <text x="326" y="226" textAnchor="middle" fontSize="12" fontWeight="700" fill="#087F70">B</text>

          {/* Right: 126 Diagram Library */}
          <rect x="436" y="88" width="302" height="254" rx="10" fill="#FFFFFF" stroke="#087F70" strokeWidth="2" />
          <text x="452" y="112" fontSize="13" fontWeight="700" fill="#164E63">Thư viện 126 hình khoa học</text>
          <rect x="452" y="122" width="270" height="28" rx="6" fill="#F8FAFC" stroke="#CBD5E1" />
          <text x="464" y="140" fontSize="11.5" fill="#64748B">Tìm: tam giác, chóp, mạch điện, buret...</text>
          {['Tất cả', 'Toán', 'Vật lí', 'Hóa học'].map((f, i) => (
            <g key={f}>
              <rect x={452 + i * 68} y="158" width="62" height="22" rx="5" fill={i === 2 ? '#087F70' : '#F1F5F9'} />
              <text x={483 + i * 68} y="172.5" textAnchor="middle" fontSize="11" fontWeight="600" fill={i === 2 ? '#FFF' : '#475569'}>{f}</text>
            </g>
          ))}
          {/* 4 cards */}
          {[
            { x: 452, y: 190, label: 'Mạch RLC nối tiếp', active: true },
            { x: 592, y: 190, label: 'Mặt phẳng nghiêng', active: false },
            { x: 452, y: 266, label: 'Tam giác ABC', active: false },
            { x: 592, y: 266, label: 'Bộ chuẩn độ Buret', active: false },
          ].map((card) => (
            <g key={card.label}>
              <rect
                x={card.x}
                y={card.y}
                width="130"
                height="66"
                rx="8"
                fill={card.active ? '#E6F1EF' : '#FAFCFB'}
                stroke={card.active ? '#087F70' : '#E2E8F0'}
                strokeWidth={card.active ? 2 : 1}
              />
              <text x={card.x + 65} y={card.y + 42} textAnchor="middle" fontSize="11" fontWeight="700" fill="#164E63">
                {card.label}
              </text>
            </g>
          ))}

          <Callout cx={712} cy={136} n="1" />
          <Callout cx={622} cy={168} n="2" />
          <Callout cx={517} cy={204} n="3" />
        </svg>
      );

    case 'dynamic-geometry-2d':
      return (
        <svg viewBox="0 0 760 360" className="w-full h-auto block">
          <rect width="760" height="360" fill="#F4F8F7" />
          <AppChrome activeTab="Hình vẽ" />
          <rect x="44" y="88" width="672" height="252" rx="12" fill="#FFFFFF" stroke="#087F70" strokeWidth="2" />
          <text x="66" y="114" fontSize="13.5" fontWeight="700" fill="#164E63">Phòng dựng Hình học động 2D — Tam giác ABC, trung tuyến AM & đường cao AH</text>
          {/* Coordinate grid */}
          <rect x="66" y="128" width="440" height="196" rx="8" fill="#FAFCFB" stroke="#CBD5E1" />
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <line key={`v${i}`} x1={66 + i * 55} y1="128" x2={66 + i * 55} y2="324" stroke="#E2E8F0" strokeWidth="1" />
          ))}
          {[1, 2, 3].map((i) => (
            <line key={`h${i}`} x1="66" y1={128 + i * 49} x2="506" y2={128 + i * 49} stroke="#E2E8F0" strokeWidth="1" />
          ))}
          {/* Triangle ABC */}
          <polygon points="240,154 134,296 426,296" fill="rgba(8,127,112,0.08)" stroke="#164E63" strokeWidth="2.5" />
          {/* Altitude AH */}
          <line x1="240" y1="154" x2="240" y2="296" stroke="#DC2626" strokeWidth="2" strokeDasharray="5 3" />
          <rect x="240" y="284" width="12" height="12" fill="none" stroke="#DC2626" strokeWidth="1.8" />
          {/* Median AM (M = midpoint of BC = 280,296) */}
          <line x1="240" y1="154" x2="280" y2="296" stroke="#087F70" strokeWidth="2.2" />
          {/* Vertices */}
          {[
            { x: 240, y: 154, t: 'A', dx: 0, dy: -10 },
            { x: 134, y: 296, t: 'B', dx: -14, dy: 4 },
            { x: 426, y: 296, t: 'C', dx: 14, dy: 4 },
            { x: 240, y: 296, t: 'H', dx: -10, dy: 16 },
            { x: 280, y: 296, t: 'M', dx: 8, dy: 16 },
          ].map((p) => (
            <g key={p.t}>
              <circle cx={p.x} cy={p.y} r="4.5" fill="#087F70" />
              <text x={p.x + p.dx} y={p.y + p.dy} textAnchor="middle" fontSize="13" fontWeight="700" fill="#164E63">{p.t}</text>
            </g>
          ))}
          {/* Right Controls */}
          <rect x="524" y="128" width="174" height="196" rx="8" fill="#F8FAFC" stroke="#E2E8F0" />
          <text x="538" y="152" fontSize="12" fontWeight="700" fill="#164E63">Công cụ dựng:</text>
          {['• Điểm / Đỉnh', '• Đoạn thẳng', '• Trung điểm M', '• Đường cao AH', '• Đường tròn'].map((item, idx) => (
            <text key={item} x="538" y={178 + idx * 22} fontSize="11.5" fill="#334155">{item}</text>
          ))}
          <rect x="536" y="282" width="150" height="30" rx="6" fill="#087F70" />
          <text x="611" y="301" textAnchor="middle" fontSize="12" fontWeight="700" fill="#FFFFFF">Chèn vào trang PDF</text>

          <Callout cx={240} cy={154} n="1" />
          <Callout cx={292} cy={240} n="2" />
          <Callout cx={611} cy={282} n="3" />
        </svg>
      );

    case 'function-graph':
      return (
        <svg viewBox="0 0 760 360" className="w-full h-auto block">
          <rect width="760" height="360" fill="#F4F8F7" />
          <AppChrome activeTab="Hình vẽ" />
          <rect x="44" y="88" width="672" height="252" rx="12" fill="#FFFFFF" stroke="#087F70" strokeWidth="2" />
          {/* Graph Canvas */}
          <rect x="66" y="106" width="386" height="218" rx="8" fill="#FAFCFB" stroke="#CBD5E1" />
          {/* Axes */}
          <line x1="86" y1="268" x2="436" y2="268" stroke="#334155" strokeWidth="1.8" />
          <polygon points="436,264 445,268 436,272" fill="#334155" />
          <text x="434" y="285" fontSize="12" fontWeight="700" fill="#334155">x</text>
          <line x1="216" y1="312" x2="216" y2="118" stroke="#334155" strokeWidth="1.8" />
          <polygon points="212,118 216,109 220,118" fill="#334155" />
          <text x="200" y="122" fontSize="12" fontWeight="700" fill="#334155">y</text>
          <text x="202" y="283" fontSize="11.5" fontWeight="700" fill="#334155">O</text>
          {/* Parabola y = (x-1)^2 with vertex at (260, 268) */}
          <path d="M 136 132 Q 260 404 384 132" fill="none" stroke="#087F70" strokeWidth="3" />
          <circle cx="260" cy="268" r="5" fill="#DC2626" />
          <text x="260" y="294" textAnchor="middle" fontSize="11.5" fontWeight="700" fill="#DC2626">Đỉnh I(1; 0)</text>
          <text x="360" y="150" fontSize="13" fontWeight="700" fill="#087F70">y = x² − 2x + 1</text>

          {/* Right Form */}
          <rect x="472" y="106" width="226" height="218" rx="8" fill="#F8FAFC" stroke="#E2E8F0" />
          <text x="488" y="132" fontSize="12.5" fontWeight="700" fill="#164E63">Nhập biểu thức hàm số:</text>
          <rect x="488" y="142" width="194" height="32" rx="6" fill="#FFFFFF" stroke="#087F70" strokeWidth="1.8" />
          <text x="500" y="162" fontSize="13" fontWeight="700" fill="#087F70" fontFamily="monospace">x^2 - 2*x + 1</text>
          <text x="488" y="198" fontSize="11.5" fill="#475569">Miền Ox: [-3 ; 5] · Miền Oy: [-2 ; 6]</text>
          <text x="488" y="220" fontSize="11.5" fill="#475569">✓ Hiện lưới ô vuông & tên trục</text>
          <rect x="488" y="274" width="194" height="34" rx="7" fill="#087F70" />
          <text x="585" y="295" textAnchor="middle" fontSize="12.5" fontWeight="700" fill="#FFFFFF">Chèn đồ thị vào PDF</text>

          <Callout cx={676} cy={156} n="1" />
          <Callout cx={326} cy={210} n="2" />
          <Callout cx={676} cy={290} n="3" />
        </svg>
      );

    case 'solid-3d':
      return (
        <svg viewBox="0 0 760 360" className="w-full h-auto block">
          <rect width="760" height="360" fill="#F4F8F7" />
          <AppChrome activeTab="Hình vẽ" />
          <rect x="44" y="88" width="672" height="252" rx="12" fill="#FFFFFF" stroke="#087F70" strokeWidth="2" />
          {/* Pyramid S.ABCD */}
          <rect x="66" y="106" width="386" height="218" rx="8" fill="#FAFCFB" stroke="#CBD5E1" />
          {/* Hidden edges dashed */}
          <line x1="210" y1="132" x2="210" y2="244" stroke="#164E63" strokeWidth="2" strokeDasharray="6 4" />
          <line x1="210" y1="244" x2="138" y2="292" stroke="#164E63" strokeWidth="2" strokeDasharray="6 4" />
          <line x1="210" y1="244" x2="368" y2="244" stroke="#164E63" strokeWidth="2" strokeDasharray="6 4" />
          {/* Visible edges solid */}
          <line x1="210" y1="132" x2="138" y2="292" stroke="#164E63" strokeWidth="2.5" />
          <line x1="210" y1="132" x2="296" y2="292" stroke="#164E63" strokeWidth="2.5" />
          <line x1="210" y1="132" x2="368" y2="244" stroke="#164E63" strokeWidth="2.5" />
          <line x1="138" y1="292" x2="296" y2="292" stroke="#164E63" strokeWidth="2.5" />
          <line x1="296" y1="292" x2="368" y2="244" stroke="#164E63" strokeWidth="2.5" />
          {[
            { x: 210, y: 122, t: 'S' },
            { x: 196, y: 242, t: 'A' },
            { x: 124, y: 300, t: 'B' },
            { x: 302, y: 306, t: 'C' },
            { x: 382, y: 246, t: 'D' },
          ].map((v) => (
            <text key={v.t} x={v.x} y={v.y} fontSize="14" fontWeight="700" fill="#087F70">{v.t}</text>
          ))}
          <text x="256" y="318" textAnchor="middle" fontSize="11.5" fill="#475569">Kéo chuột xoay góc nhìn · Tự phân biệt nét đứt cạnh khuất</text>

          <rect x="472" y="106" width="226" height="218" rx="8" fill="#F8FAFC" stroke="#E2E8F0" />
          <text x="488" y="132" fontSize="12.5" fontWeight="700" fill="#164E63">Chọn khối không gian 3D:</text>
          <rect x="488" y="142" width="194" height="28" rx="5" fill="#087F70" />
          <text x="585" y="160" textAnchor="middle" fontSize="12" fontWeight="700" fill="#FFFFFF">Hình chóp S.ABCD</text>
          <text x="488" y="194" fontSize="11.5" fill="#475569">Góc xoay ngang: 28°</text>
          <rect x="488" y="202" width="194" height="6" rx="3" fill="#CBD5E1" />
          <rect x="488" y="202" width="110" height="6" rx="3" fill="#087F70" />
          <text x="488" y="232" fontSize="11.5" fill="#475569">✓ Nét đứt cho cạnh khuất</text>
          <text x="488" y="252" fontSize="11.5" fill="#475569">✓ Hiện tên đỉnh S, A, B, C, D</text>
          <rect x="488" y="274" width="194" height="34" rx="7" fill="#087F70" />
          <text x="585" y="295" textAnchor="middle" fontSize="12.5" fontWeight="700" fill="#FFFFFF">Chèn hình chiếu vào PDF</text>

          <Callout cx={676} cy={156} n="1" />
          <Callout cx={260} cy={210} n="2" />
          <Callout cx={676} cy={290} n="3" />
        </svg>
      );

    case 'grading-essay':
    case 'grading-mcq':
    case 'grading-total-comment':
    case 'grading-export-excel':
      return (
        <svg viewBox="0 0 760 360" className="w-full h-auto block">
          <rect width="760" height="360" fill="#F4F8F7" />
          <AppChrome activeTab="Chấm bài" />
          {/* Left: Student paper with red marks + total box */}
          <rect x="26" y="88" width="388" height="254" rx="8" fill="#FFFFFF" stroke="#CBD5E1" />
          <text x="44" y="114" fontSize="12.5" fontWeight="700" fill="#1E293B">BÀI LÀM HỌC SINH: Nguyễn Minh Anh – 10A2</text>
          {/* Total Score Box */}
          <rect x="260" y="96" width="142" height="62" rx="8" fill="#FEF2F2" stroke="#DC2626" strokeWidth="2.2" />
          <text x="331" y="122" textAnchor="middle" fontSize="19" fontWeight="800" fill="#DC2626">8,25 / 10,0</text>
          <text x="331" y="146" textAnchor="middle" fontSize="10.5" fontWeight="600" fill="#991B1B">Lời phê: Làm bài cẩn thận!</text>

          {/* Question marks */}
          <text x="44" y="164" fontSize="12" fill="#334155">Câu 1: Tập xác định D = R \ &#123;1&#125; ...</text>
          <rect x="44" y="172" width="84" height="22" rx="4" fill="#ECFDF5" stroke="#059669" />
          <text x="86" y="187" textAnchor="middle" fontSize="11" fontWeight="700" fill="#059669">✓ Đúng</text>
          <rect x="138" y="172" width="102" height="22" rx="4" fill="#FEF2F2" stroke="#DC2626" />
          <text x="189" y="187" textAnchor="middle" fontSize="11" fontWeight="700" fill="#DC2626">Câu 1: 2,0/2,0</text>

          <text x="44" y="224" fontSize="12" fill="#334155">Câu 2: Phương trình có 2 nghiệm x = 3 ...</text>
          <path d="M 190 228 Q 220 218 250 228" fill="none" stroke="#DC2626" strokeWidth="2.4" />
          <rect x="44" y="238" width="124" height="22" rx="4" fill="#FEF2F2" stroke="#DC2626" />
          <text x="106" y="253" textAnchor="middle" fontSize="11" fontWeight="700" fill="#DC2626">Câu 2: 1,75/2,0</text>
          <rect x="178" y="238" width="128" height="22" rx="4" fill="#FFFBEB" stroke="#D97706" />
          <text x="242" y="253" textAnchor="middle" fontSize="11" fontWeight="700" fill="#B45309">⚠ Kiểm tra dấu cuối</text>

          <text x="44" y="294" fontSize="12" fill="#334155">Câu 3 → Câu 5: Tự động cộng đồng bộ</text>

          {/* Right: 5-question grading panel */}
          <rect x="434" y="88" width="304" height="254" rx="10" fill="#FFFFFF" stroke="#DC2626" strokeWidth="1.8" />
          <text x="450" y="112" fontSize="13" fontWeight="700" fill="#164E63">Bảng chấm bài (5 câu – Thang 10)</text>
          {[
            ['Câu 1', '2,0', '/ 2,0'],
            ['Câu 2', '1,75', '/ 2,0'],
            ['Câu 3', '1,5', '/ 2,0'],
            ['Câu 4', '2,0', '/ 2,0'],
            ['Câu 5', '1,0', '/ 2,0'],
          ].map(([q, sc, max], i) => (
            <g key={q}>
              <rect x="450" y={122 + i * 28} width="272" height="23" rx="4" fill={i % 2 === 0 ? '#F8FAFC' : '#FFFFFF'} stroke="#E2E8F0" />
              <text x="462" y={137 + i * 28} fontSize="11.5" fontWeight="700" fill="#1E293B">{q}</text>
              <text x="646" y={137 + i * 28} textAnchor="end" fontSize="12" fontWeight="700" fill="#DC2626">{sc}</text>
              <text x="654" y={137 + i * 28} fontSize="11.5" fill="#64748B">{max}</text>
            </g>
          ))}
          <rect x="450" y="266" width="272" height="28" rx="6" fill="#FEF2F2" />
          <text x="462" y="284" fontSize="12.5" fontWeight="700" fill="#991B1B">TỔNG ĐIỂM TỰ ĐỘNG:</text>
          <text x="710" y="285" textAnchor="end" fontSize="14" fontWeight="800" fill="#DC2626">8,25 / 10,0</text>
          <rect x="450" y="302" width="132" height="28" rx="6" fill="#087F70" />
          <text x="516" y="320" textAnchor="middle" fontSize="11.5" fontWeight="700" fill="#FFFFFF">Lưu vào sổ điểm</text>
          <rect x="590" y="302" width="132" height="28" rx="6" fill="#15803D" />
          <text x="656" y="320" textAnchor="middle" fontSize="11.5" fontWeight="700" fill="#FFFFFF">Xuất Excel (.xlsx)</text>

          <Callout cx={189} cy={182} n="1" />
          <Callout cx={398} cy={104} n="2" />
          <Callout cx={656} cy={304} n="3" />
        </svg>
      );

    case 'redaction-before-after':
      return (
        <svg viewBox="0 0 760 360" className="w-full h-auto block">
          <rect width="760" height="360" fill="#F4F8F7" />
          <AppChrome activeTab="Bảo mật" />
          <rect x="34" y="102" width="310" height="232" rx="10" fill="#FFFFFF" stroke="#CBD5E1" />
          <rect x="34" y="102" width="310" height="32" rx="10" fill="#FEF2F2" />
          <text x="189" y="123" textAnchor="middle" fontSize="12.5" fontWeight="700" fill="#DC2626">BƯỚC 1: Khoanh vùng cần xóa vĩnh viễn</text>
          <text x="56" y="168" fontSize="12.5" fill="#1E293B">Họ và tên: Trần Gia Huy</text>
          <rect x="120" y="150" width="150" height="24" rx="3" fill="rgba(220,38,38,0.22)" stroke="#DC2626" strokeWidth="2" strokeDasharray="5 3" />
          <text x="56" y="204" fontSize="12.5" fill="#1E293B">SĐT Phụ huynh: 0912 345 678</text>
          <rect x="150" y="186" width="152" height="24" rx="3" fill="rgba(220,38,38,0.22)" stroke="#DC2626" strokeWidth="2" strokeDasharray="5 3" />
          <text x="56" y="248" fontSize="12" fill="#475569">Bài làm phần tự luận (giữ nguyên)...</text>

          <path d="M 358 214 L 402 214" stroke="#DC2626" strokeWidth="4" strokeLinecap="round" />
          <polygon points="402,206 416,214 402,222" fill="#DC2626" />

          <rect x="424" y="102" width="302" height="232" rx="10" fill="#FFFFFF" stroke="#087F70" strokeWidth="2" />
          <rect x="424" y="102" width="302" height="32" rx="10" fill="#ECFDF5" />
          <text x="575" y="123" textAnchor="middle" fontSize="12.5" fontWeight="700" fill="#059669">BƯỚC 2: Sau khi Áp dụng xóa vĩnh viễn</text>
          <text x="446" y="168" fontSize="12.5" fill="#1E293B">Họ và tên:</text>
          <rect x="514" y="150" width="150" height="24" rx="2" fill="#0F172A" />
          <text x="446" y="204" fontSize="12.5" fill="#1E293B">SĐT Phụ huynh:</text>
          <rect x="548" y="186" width="152" height="24" rx="2" fill="#0F172A" />
          <text x="446" y="248" fontSize="12" fill="#475569">Bài làm phần tự luận (giữ nguyên)...</text>
          <rect x="446" y="274" width="258" height="42" rx="6" fill="#ECFDF5" stroke="#10B981" />
          <text x="575" y="292" textAnchor="middle" fontSize="11.5" fontWeight="700" fill="#047857">✓ Đã đốt phẳng trang & xóa lớp chữ bên dưới</text>
          <text x="575" y="308" textAnchor="middle" fontSize="11" fill="#065F46">Không thể bôi đen, copy hay Ctrl+F tìm lại</text>

          <Callout cx={278} cy={162} n="1" />
          <Callout cx={668} cy={162} n="2" />
        </svg>
      );

    case 'pwa-offline':
      return (
        <svg viewBox="0 0 760 360" className="w-full h-auto block">
          <rect width="760" height="360" fill="#F4F8F7" />
          {/* Browser address bar mockup */}
          <rect x="34" y="26" width="692" height="46" rx="10" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.5" />
          <circle cx="58" cy="49" r="6" fill="#F87171" />
          <circle cx="78" cy="49" r="6" fill="#FBBF24" />
          <circle cx="98" cy="49" r="6" fill="#34D399" />
          <rect x="122" y="36" width="440" height="26" rx="13" fill="#F1F5F9" />
          <text x="142" y="53" fontSize="12" fill="#334155">https://pdf-edu-studio... (Chrome / Edge / Cốc Cốc)</text>
          <rect x="574" y="35" width="136" height="28" rx="6" fill="#087F70" stroke="#F59E0B" strokeWidth="2" />
          <text x="642" y="53" textAnchor="middle" fontSize="11.5" fontWeight="700" fill="#FFFFFF">⬇ Cài app offline</text>

          {/* 4 honest offline states */}
          <rect x="34" y="96" width="692" height="238" rx="12" fill="#FFFFFF" stroke="#CBD5E1" />
          <text x="58" y="126" fontSize="14.5" fontWeight="700" fill="#164E63">4 trạng thái ngoại tuyến trung thực trên PDF EDU STUDIO:</text>
          {[
            { y: 146, bg: '#ECFDF5', border: '#10B981', text: '#047857', title: '1. Sẵn sàng offline', desc: 'Đã kiểm chứng có đủ tệp lõi, PDF Worker và bộ font tiếng Việt trong bộ nhớ.' },
            { y: 192, bg: '#F0FDFA', border: '#087F70', text: '#0F766E', title: '2. Đang chuẩn bị offline', desc: 'Trình duyệt đang tải và lưu tài nguyên ứng dụng vào bộ nhớ đệm.' },
            { y: 238, bg: '#FFFBEB', border: '#F59E0B', text: '#B45309', title: '3. Cần tải bổ sung tài nguyên', desc: 'Thiếu tệp cần thiết — bấm vào nhãn để tải bổ sung ngay.' },
            { y: 284, bg: '#F8FAFC', border: '#94A3B8', text: '#475569', title: '4. Chưa thể xác nhận offline', desc: 'Đang ở chế độ xem trước/phát triển hoặc trình duyệt chưa bật Service Worker.' },
          ].map((row) => (
            <g key={row.title}>
              <rect x="58" y={row.y} width="644" height="38" rx="8" fill={row.bg} stroke={row.border} />
              <text x="74" y={row.y + 23} fontSize="12.5" fontWeight="700" fill={row.text}>{row.title}:</text>
              <text x="278" y={row.y + 23} fontSize="12" fill="#334155">{row.desc}</text>
            </g>
          ))}

          <Callout cx={710} cy={48} n="1" />
          <Callout cx={686} cy={165} n="2" />
        </svg>
      );

    default: {
      // Tailored rich step-flow visual for all remaining lessons
      const metaMap: Record<string, { tab: string; badge1: string; badge2: string; badge3: string; centerTitle: string; centerSub: string }> = {
        'open-save-pdf': { tab: 'Tệp', badge1: '1. Mở PDF / Kéo thả', badge2: '2. Chỉnh sửa trực tiếp', badge3: '3. Lưu PDF mới / .pdfedu', centerTitle: 'Tệp gốc luôn an toàn · Xuất tệp PDF mới hoàn chỉnh', centerSub: 'Dùng .pdf để in & gửi học sinh · Dùng .pdfedu để hôm sau sửa tiếp' },
        'add-text-image': { tab: 'Chỉnh sửa', badge1: '1. Thêm văn bản (T)', badge2: '2. Chèn ảnh / Logo', badge3: '3. Căn chỉnh & Nhóm', centerTitle: 'Chèn chữ tiếng Việt, logo trường & căn thẳng hàng', centerSub: 'Giữ phím Shift chọn nhiều đối tượng → Căn trái / Căn giữa ở cột Thuộc tính' },
        'find-replace': { tab: 'Chỉnh sửa', badge1: '1. Mở Tìm & Thay thế', badge2: '2. Nhập từ cần tìm', badge3: '3. Thay thế hàng loạt', centerTitle: 'Tìm kiếm & Thay thế nhanh trên toàn bộ trang PDF', centerSub: 'Nhấn Ctrl + F hoặc Ctrl + H · Nhấp kết quả để nhảy tới đúng trang' },
        'annotate-pen-note': { tab: 'Chú thích', badge1: '1. Bút vẽ tay (P)', badge2: '2. Bút dạ quang / Tô sáng', badge3: '3. Ghi chú nổi / Tẩy', centerTitle: 'Đánh dấu bài giảng & ghi chú trực tiếp không hỏng PDF gốc', centerSub: 'Công cụ Tẩy chỉ xóa nét vẽ & chú thích, an toàn tuyệt đối cho đề thi' },
        'signature-insert': { tab: 'Chú thích', badge1: '1. Ký tay / Tải ảnh', badge2: '2. Lọc nền trong suốt', badge3: '3. Lưu & Chèn vào PDF', centerTitle: 'Chữ ký hình ảnh nền trong suốt lưu cục bộ', centerSub: 'Ký duyệt giáo án, bảng điểm chỉ với 1 cú nhấp chuột' },
        'page-organize': { tab: 'Trang PDF', badge1: '1. Xoay trang 90°', badge2: '2. Đổi thứ tự Lên/Xuống', badge3: '3. Xóa / Thêm trang A4', centerTitle: 'Quản lý & Sắp xếp lại cấu trúc trang PDF linh hoạt', centerSub: 'Hỗ trợ Hoàn tác (Ctrl + Z) nếu lỡ xóa hoặc đổi nhầm trang' },
        'page-merge-split': { tab: 'Trang PDF', badge1: '1. Chọn nhiều tệp PDF', badge2: '2. Sắp xếp hoặc chọn khoảng', badge3: '3. Ghép 1 tệp / Tách ZIP', centerTitle: 'Ghép nhiều đề thi thành 1 PDF hoặc Tách riêng Đề & Đáp án', centerSub: 'Nhập khoảng trang kiểu "1-2, 3-4" hoặc tách trang chẵn/lẻ' },
        'page-crop': { tab: 'Trang PDF', badge1: '1. Mở Cắt lề (Crop)', badge2: '2. Nhập lề Trên/Dưới/Trái/Phải', badge3: '3. Áp dụng 1 hoặc tất cả trang', centerTitle: 'Loại bỏ viền đen & lề trắng thừa cho bản in gọn đẹp', centerSub: 'Khung nét đứt hiển thị trực tiếp vùng cắt trước khi xuất PDF' },
        'page-compress': { tab: 'Trang PDF', badge1: '1. Mở Nén PDF', badge2: '2. Chọn mức Cân bằng', badge3: '3. So sánh Trước / Sau nén', centerTitle: 'Giảm dung lượng tệp PDF nặng để gửi Zalo / Email / LMS', centerSub: 'Thông báo rõ dung lượng Trước và Sau nén, không làm mờ chữ' },
        'images-to-pdf': { tab: 'Trang PDF', badge1: '1. Chọn các ảnh chụp', badge2: '2. Chọn khổ A4 / A5', badge3: '3. Tạo 1 tệp PDF chuẩn', centerTitle: 'Gom nhiều ảnh chụp bài làm học sinh thành 1 tệp PDF A4', centerSub: 'Xử lý 100% trên máy tính, mở ngay để chấm điểm bằng bút đỏ' },
        'ocr-scan': { tab: 'Chỉnh sửa', badge1: '1. Chỉnh thẳng trang', badge2: '2. Bật Đen trắng & Tương phản', badge3: '3. Chạy OCR Tiếng Việt', centerTitle: 'Nhận dạng chữ tiếng Việt từ tài liệu PDF scan cục bộ', centerSub: 'Sao chép chữ, tải .txt hoặc chèn trực tiếp lên trang PDF' },
        'watermark-pagenum': { tab: 'Bảo mật', badge1: '1. Bật Dấu chìm (Watermark)', badge2: '2. Chỉnh độ mờ 15%', badge3: '3. Bật Đánh số trang', centerTitle: 'Đóng dấu bản quyền "TÀI LIỆU GIẢNG DẠY" & Trang 1 / N', centerSub: 'Xem trước trực tiếp trên trang PDF và nhúng bền vững khi lưu' },
        'print-present': { tab: 'Hiển thị', badge1: '1. Xuất PDF / Ảnh PNG', badge2: '2. In tài liệu (Ctrl + P)', badge3: '3. Trình chiếu toàn màn hình', centerTitle: 'Chuẩn bị bản in A4 sắc nét & Trình chiếu giảng dạy trên lớp', centerSub: 'Nhấn phím Esc bất cứ lúc nào để thoát chế độ trình chiếu' },
        'backup-restore': { tab: 'Tệp', badge1: '1. Mở mục Cài đặt', badge2: '2. Xuất sao lưu (.json)', badge3: '3. Khôi phục / Xóa máy chung', centerTitle: 'Bảo vệ thư viện cá nhân & sổ điểm bằng tệp sao lưu JSON', centerSub: 'Dễ dàng mang sang máy tính mới hoặc dọn sạch trên máy dùng chung' },
      };
      const m = metaMap[key] || metaMap['open-save-pdf'];
      return (
        <svg viewBox="0 0 760 360" className="w-full h-auto block">
          <rect width="760" height="360" fill="#F4F8F7" />
          <AppChrome activeTab={m.tab} />
          {/* 3 Step Cards */}
          {[
            { x: 34, label: m.badge1, n: '1' },
            { x: 274, label: m.badge2, n: '2' },
            { x: 514, label: m.badge3, n: '3' },
          ].map((b, idx) => (
            <g key={b.n}>
              <rect x={b.x} y="102" width="212" height="74" rx="10" fill="#FFFFFF" stroke="#087F70" strokeWidth="2" />
              <text x={b.x + 106} y="145" textAnchor="middle" fontSize="13.5" fontWeight="700" fill="#164E63">{b.label}</text>
              <Callout cx={b.x + 18} cy={104} n={b.n} />
              {idx < 2 && (
                <>
                  <line x1={b.x + 216} y1="139" x2={b.x + 234} y2="139" stroke="#087F70" strokeWidth="3" />
                  <polygon points={`${b.x + 232},133 ${b.x + 240},139 ${b.x + 232},145`} fill="#087F70" />
                </>
              )}
            </g>
          ))}
          {/* Result visual card */}
          <rect x="34" y="202" width="692" height="132" rx="12" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.5" />
          <rect x="54" y="222" width="652" height="92" rx="8" fill="#E6F1EF" />
          <text x="380" y="260" textAnchor="middle" fontSize="16" fontWeight="700" fill="#164E63">{m.centerTitle}</text>
          <text x="380" y="290" textAnchor="middle" fontSize="13" fill="#0F766E">{m.centerSub}</text>
        </svg>
      );
    }
  }
}

export const GuideIllustration: React.FC<GuideIllustrationProps> = ({
  illustrationKey,
  caption,
}) => {
  const [zoomed, setZoomed] = useState(false);

  return (
    <>
      <figure className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
        <div
          onClick={() => setZoomed(true)}
          className="relative group cursor-zoom-in bg-[#F4F8F7]"
          title="Nhấp để phóng to hình minh họa"
        >
          {renderIllustrationSvg(illustrationKey)}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setZoomed(true);
            }}
            className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#164E63]/90 hover:bg-[#087F70] text-white text-[13.5px] font-semibold shadow-md transition-colors cursor-pointer"
          >
            <Maximize2 className="w-4 h-4" />
            <span>Phóng to hình</span>
          </button>
        </div>
        <figcaption className="px-4 py-2.5 bg-[#FAFCFB] border-t border-slate-200 text-[14.5px] text-slate-600 font-medium">
          Minh họa: {caption}
        </figcaption>
      </figure>

      {/* Lightbox Zoom Modal */}
      {zoomed && (
        <div
          onClick={() => setZoomed(false)}
          className="fixed inset-0 z-70 bg-slate-900/75 flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full overflow-hidden border border-slate-200"
          >
            <div className="bg-[#164E63] text-white px-5 py-3 flex items-center justify-between gap-3">
              <div className="text-[16.5px] font-bold">{caption}</div>
              <button
                type="button"
                onClick={() => setZoomed(false)}
                className="p-1.5 rounded-lg hover:bg-white/15 cursor-pointer"
                title="Đóng xem phóng to"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 bg-[#F4F8F7]">{renderIllustrationSvg(illustrationKey)}</div>
          </div>
        </div>
      )}
    </>
  );
};
