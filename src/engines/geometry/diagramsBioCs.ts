import type { DiagramRenderConfig, ScientificDiagramItem } from './diagramHelpers';

const FONT = 'DejaVu Sans, Arial, sans-serif';

export const BIOLOGY_DIAGRAMS: ScientificDiagramItem[] = [
  {
    key: 'bio-eukaryotic-cell',
    title: 'Sơ đồ tế bào nhân thực (có đánh số chú thích)',
    subject: 'biology',
    group: 'Sinh học tế bào',
    defaultLabels: [],
    render: (cfg: DiagramRenderConfig = {}) => {
      const c = cfg.strokeColor || '#087F70';
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 440 250">
        <rect width="440" height="250" rx="8" fill="#FFFFFF" stroke="#CBD5E1"/>
        <text x="220" y="22" text-anchor="middle" font-family="${FONT}" font-size="11.5" font-weight="700" fill="#164E63">SƠ ĐỒ CẤU TẠO TẾ BÀO NHÂN THỰC (CHÚ THÍCH BÀO QUAN 1–6)</text>
        <!-- Outer Cell Membrane -->
        <ellipse cx="185" cy="138" rx="126" ry="86" fill="#F0FDFA" stroke="${c}" stroke-width="2.4"/>
        <!-- Nucleus -->
        <circle cx="176" cy="132" r="34" fill="#DBEAFE" stroke="#1D4ED8" stroke-width="2"/>
        <circle cx="180" cy="130" r="11" fill="#1D4ED8" fill-opacity="0.35"/>
        <!-- ER -->
        <path d="M 135 122 Q 116 135 136 150 Q 120 162 145 170" fill="none" stroke="#7C3AED" stroke-width="2.4"/>
        <!-- Mitochondrion -->
        <g transform="translate(248,108) rotate(22)">
          <ellipse cx="0" cy="0" rx="22" ry="11" fill="#FEF3C7" stroke="#D97706" stroke-width="1.8"/>
          <path d="M -14 0 Q -8 -6 -2 0 Q 4 6 10 0 Q 14 -5 16 0" fill="none" stroke="#B45309" stroke-width="1.3"/>
        </g>
        <!-- Golgi -->
        <g transform="translate(232,174)">
          <path d="M -18 -8 Q 0 -14 18 -8 M -20 0 Q 0 -6 20 0 M -16 8 Q 0 2 16 8" fill="none" stroke="#059669" stroke-width="2.2" stroke-linecap="round"/>
        </g>
        <!-- Ribosomes -->
        <circle cx="122" cy="108" r="2.6" fill="#0F172A"/>
        <circle cx="130" cy="102" r="2.6" fill="#0F172A"/>
        <circle cx="116" cy="116" r="2.6" fill="#0F172A"/>
        <!-- Callout Lines & Numbers 1..6 -->
        <line x1="298" y1="90" x2="334" y2="62" stroke="#475569" stroke-width="1.1"/>
        <text x="340" y="66" font-family="${FONT}" font-size="10.5" font-weight="700" fill="#0F172A">[1] .........................</text>
        <line x1="204" y1="112" x2="334" y2="92" stroke="#475569" stroke-width="1.1"/>
        <text x="340" y="96" font-family="${FONT}" font-size="10.5" font-weight="700" fill="#0F172A">[2] .........................</text>
        <line x1="268" y1="116" x2="334" y2="122" stroke="#475569" stroke-width="1.1"/>
        <text x="340" y="126" font-family="${FONT}" font-size="10.5" font-weight="700" fill="#0F172A">[3] .........................</text>
        <line x1="252" y1="174" x2="334" y2="154" stroke="#475569" stroke-width="1.1"/>
        <text x="340" y="158" font-family="${FONT}" font-size="10.5" font-weight="700" fill="#0F172A">[4] .........................</text>
        <line x1="138" y1="166" x2="334" y2="186" stroke="#475569" stroke-width="1.1"/>
        <text x="340" y="190" font-family="${FONT}" font-size="10.5" font-weight="700" fill="#0F172A">[5] .........................</text>
        <line x1="122" y1="108" x2="334" y2="216" stroke="#475569" stroke-width="1.1" stroke-dasharray="3 2"/>
        <text x="340" y="220" font-family="${FONT}" font-size="10.5" font-weight="700" fill="#0F172A">[6] .........................</text>
      </svg>`;
    },
  },
  {
    key: 'bio-food-web',
    title: 'Lưới thức ăn & Tháp sinh thái hệ sinh thái đồng cỏ',
    subject: 'biology',
    group: 'Sinh thái học',
    defaultLabels: [],
    render: () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 440 220">
      <rect width="440" height="220" rx="8" fill="#FFFFFF" stroke="#CBD5E1"/>
      <text x="220" y="22" text-anchor="middle" font-family="${FONT}" font-size="11.5" font-weight="700" fill="#164E63">LƯỚI THỨC ĂN MINH HỌA (HỆ SINH THÁI ĐỒNG CỎ)</text>
      <!-- Nodes -->
      <rect x="24" y="102" width="70" height="32" rx="6" fill="#DCFCE7" stroke="#15803D" stroke-width="1.5"/>
      <text x="59" y="122" text-anchor="middle" font-family="${FONT}" font-size="10" font-weight="700" fill="#14532D">Cỏ (SVSX)</text>
      <rect x="136" y="54" width="76" height="30" rx="6" fill="#FEF9C3" stroke="#CA8A04" stroke-width="1.4"/>
      <text x="174" y="73" text-anchor="middle" font-family="${FONT}" font-size="10" font-weight="600" fill="#713F12">Châu chấu</text>
      <rect x="136" y="148" width="76" height="30" rx="6" fill="#FEF9C3" stroke="#CA8A04" stroke-width="1.4"/>
      <text x="174" y="167" text-anchor="middle" font-family="${FONT}" font-size="10" font-weight="600" fill="#713F12">Chuột đồng</text>
      <rect x="252" y="54" width="70" height="30" rx="6" fill="#FFEDD5" stroke="#EA580C" stroke-width="1.4"/>
      <text x="287" y="73" text-anchor="middle" font-family="${FONT}" font-size="10" font-weight="600" fill="#7C2D12">Ếch</text>
      <rect x="252" y="148" width="70" height="30" rx="6" fill="#FFEDD5" stroke="#EA580C" stroke-width="1.4"/>
      <text x="287" y="167" text-anchor="middle" font-family="${FONT}" font-size="10" font-weight="600" fill="#7C2D12">Rắn</text>
      <rect x="352" y="102" width="70" height="32" rx="6" fill="#FEE2E2" stroke="#DC2626" stroke-width="1.5"/>
      <text x="387" y="122" text-anchor="middle" font-family="${FONT}" font-size="10" font-weight="700" fill="#991B1B">Diều hâu</text>
      <!-- Arrows -->
      <line x1="94" y1="110" x2="134" y2="74" stroke="#334155" stroke-width="1.5"/>
      <line x1="94" y1="126" x2="134" y2="160" stroke="#334155" stroke-width="1.5"/>
      <line x1="212" y1="69" x2="250" y2="69" stroke="#334155" stroke-width="1.5"/>
      <line x1="212" y1="163" x2="250" y2="163" stroke="#334155" stroke-width="1.5"/>
      <line x1="287" y1="84" x2="287" y2="146" stroke="#334155" stroke-width="1.5"/>
      <line x1="322" y1="69" x2="352" y2="108" stroke="#334155" stroke-width="1.5"/>
      <line x1="322" y1="163" x2="352" y2="128" stroke="#334155" stroke-width="1.5"/>
      <line x1="212" y1="154" x2="350" y2="122" stroke="#334155" stroke-width="1.3" stroke-dasharray="4 3"/>
      <text x="220" y="206" text-anchor="middle" font-family="${FONT}" font-size="9.5" fill="#475569">Mũi tên hướng từ sinh vật bị ăn → sinh vật tiêu thụ (chiều truyền năng lượng)</text>
    </svg>`,
  },
  {
    key: 'bio-photosynthesis-graph',
    title: 'Đồ thị cường độ quang hợp theo ánh sáng (Số liệu giả định)',
    subject: 'biology',
    group: 'Sinh lí thực vật',
    defaultLabels: [],
    render: (cfg: DiagramRenderConfig = {}) => {
      const c = cfg.strokeColor || '#164E63';
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 430 230">
        <rect width="430" height="230" rx="8" fill="#FFFFFF" stroke="#CBD5E1"/>
        <text x="215" y="22" text-anchor="middle" font-family="${FONT}" font-size="11.5" font-weight="700" fill="#164E63">ẢNH HƯỞNG CỦA ÁNH SÁNG ĐẾN CƯỜNG ĐỘ QUANG HỢP (MẪU GIẢ ĐỊNH)</text>
        <line x1="60" y1="184" x2="395" y2="184" stroke="${c}" stroke-width="1.6"/>
        <line x1="60" y1="48" x2="60" y2="184" stroke="${c}" stroke-width="1.6"/>
        <text x="14" y="54" font-family="${FONT}" font-size="9" font-weight="600" fill="#334155">mg CO₂</text>
        <text x="330" y="202" font-family="${FONT}" font-size="9" font-weight="600" fill="#334155">Ánh sáng (klux)</text>
        <!-- C4 curve -->
        <path d="M 60 184 Q 150 96 260 66 T 380 58" fill="none" stroke="#087F70" stroke-width="2.4"/>
        <text x="318" y="54" font-family="${FONT}" font-size="9.5" font-weight="700" fill="#087F70">Thực vật C4</text>
        <!-- C3 curve -->
        <path d="M 60 184 Q 145 126 230 112 T 380 110" fill="none" stroke="#D97706" stroke-width="2.4" stroke-dasharray="5 3"/>
        <text x="318" y="104" font-family="${FONT}" font-size="9.5" font-weight="700" fill="#D97706">Thực vật C3</text>
        <!-- Light compensation & saturation markers -->
        <circle cx="94" cy="160" r="3.5" fill="#DC2626"/>
        <text x="98" y="172" font-family="${FONT}" font-size="8.5" fill="#DC2626">Điểm bù ánh sáng</text>
        <circle cx="230" cy="112" r="3.5" fill="#1D4ED8"/>
        <text x="206" y="132" font-family="${FONT}" font-size="8.5" fill="#1D4ED8">Điểm bão hòa (C3)</text>
        <text x="60" y="216" font-family="${FONT}" font-size="9" font-style="italic" fill="#64748B">Đồ thị minh họa xu hướng sinh lí thực vật — số liệu bảng kèm theo là số liệu giả định.</text>
      </svg>`;
    },
  },
];

export const CS_DIAGRAMS: ScientificDiagramItem[] = [
  {
    key: 'cs-flowchart-max',
    title: 'Lưu đồ thuật toán tìm giá trị lớn nhất trong dãy số',
    subject: 'cs',
    group: 'Thuật toán & Lưu đồ',
    defaultLabels: [],
    render: (cfg: DiagramRenderConfig = {}) => {
      const c = cfg.strokeColor || '#164E63';
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 440 230">
        <rect width="440" height="230" rx="8" fill="#FFFFFF" stroke="#CBD5E1"/>
        <text x="220" y="21" text-anchor="middle" font-family="${FONT}" font-size="11.5" font-weight="700" fill="#164E63">LƯU ĐỒ THUẬT TOÁN TÌM MAX TRONG DÃY A[0..n-1]</text>
        <!-- Start -->
        <rect x="20" y="42" width="76" height="28" rx="14" fill="#DCFCE7" stroke="#15803D" stroke-width="1.5"/>
        <text x="58" y="60" text-anchor="middle" font-family="${FONT}" font-size="9.5" font-weight="700" fill="#14532D">Bắt đầu</text>
        <line x1="96" y1="56" x2="122" y2="56" stroke="${c}" stroke-width="1.5"/>
        <!-- Input -->
        <polygon points="128,42 232,42 222,70 118,70" fill="#EFF6FF" stroke="#1D4ED8" stroke-width="1.5"/>
        <text x="175" y="60" text-anchor="middle" font-family="${FONT}" font-size="9.5" fill="#1E3A8A">Nhập n, dãy A</text>
        <line x1="227" y1="56" x2="254" y2="56" stroke="${c}" stroke-width="1.5"/>
        <!-- Init -->
        <rect x="254" y="40" width="164" height="32" rx="4" fill="#F8FAFC" stroke="${c}" stroke-width="1.5"/>
        <text x="336" y="60" text-anchor="middle" font-family="${FONT}" font-size="9.5" font-weight="600" fill="#0F172A">maxVal ← A[0]; i ← 1</text>
        <line x1="336" y1="72" x2="336" y2="96" stroke="${c}" stroke-width="1.5"/>
        <!-- Loop Condition Diamond -->
        <polygon points="336,96 392,122 336,148 280,122" fill="#FEF3C7" stroke="#D97706" stroke-width="1.5"/>
        <text x="336" y="125" text-anchor="middle" font-family="${FONT}" font-size="9.5" font-weight="700" fill="#92400E">i &lt; n ?</text>
        <!-- Yes Branch -->
        <line x1="280" y1="122" x2="226" y2="122" stroke="#059669" stroke-width="1.5"/>
        <text x="256" y="116" font-family="${FONT}" font-size="8.5" font-weight="700" fill="#059669">Đúng</text>
        <polygon points="172,96 226,122 172,148 118,122" fill="#FEF3C7" stroke="#D97706" stroke-width="1.5"/>
        <text x="172" y="125" text-anchor="middle" font-family="${FONT}" font-size="9" font-weight="700" fill="#92400E">A[i] &gt; max?</text>
        <!-- Update -->
        <line x1="118" y1="122" x2="96" y2="122" stroke="#059669" stroke-width="1.5"/>
        <rect x="16" y="106" width="80" height="32" rx="4" fill="#E6F1EF" stroke="#087F70" stroke-width="1.5"/>
        <text x="56" y="126" text-anchor="middle" font-family="${FONT}" font-size="9" font-weight="600" fill="#0F172A">max ← A[i]</text>
        <line x1="56" y1="138" x2="56" y2="180" stroke="${c}" stroke-width="1.4"/>
        <line x1="172" y1="148" x2="172" y2="180" stroke="#DC2626" stroke-width="1.4"/>
        <rect x="116" y="180" width="112" height="28" rx="4" fill="#F8FAFC" stroke="${c}" stroke-width="1.5"/>
        <text x="172" y="198" text-anchor="middle" font-family="${FONT}" font-size="9.5" font-weight="600" fill="#0F172A">i ← i + 1</text>
        <line x1="56" y1="180" x2="116" y2="194" stroke="${c}" stroke-width="1.3"/>
        <path d="M 228 194 L 254 194 L 254 136 L 288 136" fill="none" stroke="${c}" stroke-width="1.3" stroke-dasharray="3 2"/>
        <!-- No Branch -> Output -> End -->
        <line x1="336" y1="148" x2="336" y2="176" stroke="#DC2626" stroke-width="1.5"/>
        <text x="342" y="166" font-family="${FONT}" font-size="8.5" font-weight="700" fill="#DC2626">Sai</text>
        <rect x="272" y="176" width="146" height="32" rx="14" fill="#FEE2E2" stroke="#DC2626" stroke-width="1.5"/>
        <text x="345" y="196" text-anchor="middle" font-family="${FONT}" font-size="9.5" font-weight="700" fill="#991B1B">Xuất maxVal · Kết thúc</text>
      </svg>`;
    },
  },
  {
    key: 'cs-er-diagram',
    title: 'Sơ đồ quan hệ Cơ sở dữ liệu (LOP – HOCSINH – DIEM)',
    subject: 'cs',
    group: 'Cơ sở dữ liệu',
    defaultLabels: [],
    render: () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 440 165">
      <rect width="440" height="165" rx="8" fill="#FFFFFF" stroke="#CBD5E1"/>
      <text x="220" y="22" text-anchor="middle" font-family="${FONT}" font-size="11.5" font-weight="700" fill="#164E63">LƯỢC ĐỒ QUAN HỆ CƠ SỞ DỮ LIỆU QUẢN LÍ HỌC SINH</text>
      <!-- Table LOP -->
      <rect x="16" y="42" width="116" height="96" rx="6" fill="#F8FAFC" stroke="#164E63" stroke-width="1.5"/>
      <rect x="16" y="42" width="116" height="24" rx="6" fill="#164E63"/>
      <text x="74" y="58" text-anchor="middle" font-family="${FONT}" font-size="10" font-weight="700" fill="#FFF">LOP</text>
      <text x="24" y="84" font-family="${FONT}" font-size="9.5" font-weight="700" fill="#087F70">PK MaLop</text>
      <text x="24" y="102" font-family="${FONT}" font-size="9.5" fill="#334155">TenLop</text>
      <text x="24" y="120" font-family="${FONT}" font-size="9.5" fill="#334155">Khoi (10,11,12)</text>
      <!-- Table HOCSINH -->
      <rect x="162" y="42" width="122" height="96" rx="6" fill="#F8FAFC" stroke="#087F70" stroke-width="1.5"/>
      <rect x="162" y="42" width="122" height="24" rx="6" fill="#087F70"/>
      <text x="223" y="58" text-anchor="middle" font-family="${FONT}" font-size="10" font-weight="700" fill="#FFF">HOCSINH</text>
      <text x="170" y="84" font-family="${FONT}" font-size="9.5" font-weight="700" fill="#087F70">PK MaHS</text>
      <text x="170" y="102" font-family="${FONT}" font-size="9.5" fill="#334155">HoTen</text>
      <text x="170" y="120" font-family="${FONT}" font-size="9.5" font-weight="600" fill="#B45309">FK MaLop</text>
      <!-- Table DIEM -->
      <rect x="314" y="42" width="112" height="96" rx="6" fill="#F8FAFC" stroke="#1D4ED8" stroke-width="1.5"/>
      <rect x="314" y="42" width="112" height="24" rx="6" fill="#1D4ED8"/>
      <text x="370" y="58" text-anchor="middle" font-family="${FONT}" font-size="10" font-weight="700" fill="#FFF">DIEM</text>
      <text x="322" y="84" font-family="${FONT}" font-size="9.5" font-weight="700" fill="#087F70">PK MaDiem</text>
      <text x="322" y="102" font-family="${FONT}" font-size="9.5" font-weight="600" fill="#B45309">FK MaHS</text>
      <text x="322" y="120" font-family="${FONT}" font-size="9.5" fill="#334155">MonHoc · DiemSo</text>
      <!-- 1-N Lines -->
      <line x1="132" y1="90" x2="162" y2="90" stroke="#475569" stroke-width="1.8"/>
      <text x="136" y="84" font-family="${FONT}" font-size="8.5" font-weight="700" fill="#164E63">1</text>
      <text x="150" y="84" font-family="${FONT}" font-size="8.5" font-weight="700" fill="#164E63">N</text>
      <line x1="284" y1="90" x2="314" y2="90" stroke="#475569" stroke-width="1.8"/>
      <text x="288" y="84" font-family="${FONT}" font-size="8.5" font-weight="700" fill="#164E63">1</text>
      <text x="302" y="84" font-family="${FONT}" font-size="8.5" font-weight="700" fill="#164E63">N</text>
      <text x="220" y="154" text-anchor="middle" font-family="${FONT}" font-size="9" fill="#64748B">PK: Khóa chính (Primary Key)  ·  FK: Khóa ngoại (Foreign Key)</text>
    </svg>`,
  },
];

export const EXTRA_SCIENCE_DIAGRAMS: ScientificDiagramItem[] = [
  {
    key: 'phys-vt-graph',
    title: 'Đồ thị vận tốc – thời gian (v–t) chuyển động thẳng',
    subject: 'physics',
    group: 'Đồ thị Vật lí',
    defaultLabels: [],
    render: (cfg: DiagramRenderConfig = {}) => {
      const c = cfg.strokeColor || '#164E63';
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 430 220">
        <rect width="430" height="220" rx="8" fill="#FFFFFF" stroke="#CBD5E1"/>
        <text x="215" y="22" text-anchor="middle" font-family="${FONT}" font-size="11.5" font-weight="700" fill="#164E63">ĐỒ THỊ VẬN TỐC – THỜI GIAN v(t) CỦA XE CHUYỂN ĐỘNG THẲNG</text>
        <line x1="60" y1="176" x2="390" y2="176" stroke="${c}" stroke-width="1.6"/>
        <line x1="60" y1="46" x2="60" y2="176" stroke="${c}" stroke-width="1.6"/>
        <text x="16" y="54" font-family="${FONT}" font-size="9.5" font-weight="700" fill="#164E63">v (m/s)</text>
        <text x="372" y="194" font-family="${FONT}" font-size="9.5" font-weight="700" fill="#164E63">t (s)</text>
        <!-- Grid lines -->
        <line x1="60" y1="76" x2="360" y2="76" stroke="#E2E8F0" stroke-dasharray="3 3"/>
        <line x1="160" y1="76" x2="160" y2="176" stroke="#E2E8F0" stroke-dasharray="3 3"/>
        <line x1="280" y1="76" x2="280" y2="176" stroke="#E2E8F0" stroke-dasharray="3 3"/>
        <text x="52" y="80" text-anchor="end" font-family="${FONT}" font-size="9.5" fill="#334155">20</text>
        <text x="52" y="179" text-anchor="end" font-family="${FONT}" font-size="9.5" fill="#334155">0</text>
        <text x="160" y="191" text-anchor="middle" font-family="${FONT}" font-size="9.5" fill="#334155">10</text>
        <text x="280" y="191" text-anchor="middle" font-family="${FONT}" font-size="9.5" fill="#334155">25</text>
        <text x="340" y="191" text-anchor="middle" font-family="${FONT}" font-size="9.5" fill="#334155">30</text>
        <!-- Shaded Area (displacement) -->
        <polygon points="60,176 160,76 280,76 340,176" fill="#E6F1EF" fill-opacity="0.7"/>
        <!-- Curve O-A-B-C -->
        <polyline points="60,176 160,76 280,76 340,176" fill="none" stroke="#087F70" stroke-width="2.6"/>
        <circle cx="160" cy="76" r="4" fill="#DC2626"/>
        <text x="155" y="66" font-family="${FONT}" font-size="9.5" font-weight="700" fill="#DC2626">A</text>
        <circle cx="280" cy="76" r="4" fill="#DC2626"/>
        <text x="284" y="66" font-family="${FONT}" font-size="9.5" font-weight="700" fill="#DC2626">B</text>
        <circle cx="340" cy="176" r="4" fill="#DC2626"/>
        <text x="344" y="168" font-family="${FONT}" font-size="9.5" font-weight="700" fill="#DC2626">C</text>
        <text x="215" y="210" text-anchor="middle" font-family="${FONT}" font-size="9" fill="#475569">OA: Nhanh dần đều · AB: Thẳng đều · BC: Chậm dần đều (d = diện tích hình thang OABC)</text>
      </svg>`;
    },
  },
  {
    key: 'chem-energy-profile',
    title: 'Đồ thị biến thiên Enthalpy & Năng lượng hoạt hóa',
    subject: 'chemistry',
    group: 'Đồ thị Hóa học',
    defaultLabels: [],
    render: (cfg: DiagramRenderConfig = {}) => {
      const c = cfg.strokeColor || '#164E63';
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 430 220">
        <rect width="430" height="220" rx="8" fill="#FFFFFF" stroke="#CBD5E1"/>
        <text x="215" y="22" text-anchor="middle" font-family="${FONT}" font-size="11.5" font-weight="700" fill="#164E63">BIỂU ĐỒ NĂNG LƯỢNG PHẢN ỨNG TỎA NHIỆT (CÓ &amp; KHÔNG XÚC TÁC)</text>
        <line x1="56" y1="184" x2="395" y2="184" stroke="${c}" stroke-width="1.6"/>
        <line x1="56" y1="44" x2="56" y2="184" stroke="${c}" stroke-width="1.6"/>
        <text x="12" y="52" font-family="${FONT}" font-size="9.5" font-weight="700" fill="#164E63">E (kJ)</text>
        <text x="322" y="200" font-family="${FONT}" font-size="9.5" font-weight="700" fill="#164E63">Tiến trình phản ứng</text>
        <!-- Uncatalyzed curve -->
        <path d="M 74 114 L 132 114 C 175 114 195 48 232 48 C 270 48 292 158 332 158 L 382 158" fill="none" stroke="#DC2626" stroke-width="2.2"/>
        <!-- Catalyzed curve -->
        <path d="M 132 114 C 175 114 196 82 232 82 C 268 82 290 158 332 158" fill="none" stroke="#087F70" stroke-width="2.2" stroke-dasharray="5 3"/>
        <!-- Labels -->
        <text x="80" y="106" font-family="${FONT}" font-size="9.5" font-weight="700" fill="#0F172A">Chất đầu</text>
        <text x="334" y="150" font-family="${FONT}" font-size="9.5" font-weight="700" fill="#0F172A">Sản phẩm</text>
        <text x="232" y="42" text-anchor="middle" font-family="${FONT}" font-size="9" font-weight="700" fill="#DC2626">Không xúc tác (Ea cao)</text>
        <text x="232" y="76" text-anchor="middle" font-family="${FONT}" font-size="9" font-weight="700" fill="#087F70">Có xúc tác (Ea thấp hơn)</text>
        <line x1="132" y1="114" x2="332" y2="114" stroke="#94A3B8" stroke-dasharray="3 3"/>
        <line x1="306" y1="114" x2="306" y2="158" stroke="#1D4ED8" stroke-width="1.8"/>
        <text x="262" y="140" font-family="${FONT}" font-size="9.5" font-weight="700" fill="#1D4ED8">ΔrH° &lt; 0</text>
        <text x="215" y="212" text-anchor="middle" font-family="${FONT}" font-size="9" fill="#475569">Chất xúc tác làm giảm năng lượng hoạt hóa Ea nhưng không làm thay đổi ΔrH° của phản ứng.</text>
      </svg>`;
    },
  },
];

export const BIO_CS_EXTRA_DIAGRAMS: ScientificDiagramItem[] = [
  ...BIOLOGY_DIAGRAMS,
  ...CS_DIAGRAMS,
  ...EXTRA_SCIENCE_DIAGRAMS,
];
