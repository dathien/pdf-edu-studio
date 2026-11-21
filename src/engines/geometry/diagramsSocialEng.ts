import type { DiagramRenderConfig, ScientificDiagramItem } from './diagramHelpers';

const FONT = 'DejaVu Sans, Arial, sans-serif';

export const GEOGRAPHY_DIAGRAMS: ScientificDiagramItem[] = [
  {
    key: 'geo-bar-chart-gdp',
    title: 'Biểu đồ cột (Số liệu giả định)',
    subject: 'geography',
    group: 'Biểu đồ địa lí',
    defaultLabels: [],
    render: (cfg: DiagramRenderConfig = {}) => {
      const c = cfg.strokeColor || '#164E63';
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 440 270">
        <rect width="440" height="270" rx="8" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1"/>
        <text x="220" y="24" text-anchor="middle" font-family="${FONT}" font-size="12.5" font-weight="700" fill="#0F172A">BIỂU ĐỒ SẢN LƯỢNG LƯƠNG THỰC VÙNG A (2020 – 2024)</text>
        <text x="220" y="40" text-anchor="middle" font-family="${FONT}" font-size="10" font-style="italic" fill="#475569">(Số liệu giả định phục vụ thực hành phân tích biểu đồ — Đơn vị: nghìn tấn)</text>
        <!-- Axes -->
        <line x1="60" y1="210" x2="405" y2="210" stroke="${c}" stroke-width="1.6"/>
        <line x1="60" y1="62" x2="60" y2="210" stroke="${c}" stroke-width="1.6"/>
        <polygon points="60,56 56,64 64,64" fill="${c}"/>
        <polygon points="410,210 402,206 402,214" fill="${c}"/>
        <text x="16" y="64" font-family="${FONT}" font-size="9.5" font-weight="600" fill="#334155">Nghìn tấn</text>
        <text x="392" y="226" font-family="${FONT}" font-size="9.5" font-weight="600" fill="#334155">Năm</text>
        <!-- Y Grid & Ticks (0, 200, 400, 600) -->
        <line x1="56" y1="165" x2="395" y2="165" stroke="#E2E8F0" stroke-dasharray="3 3"/>
        <text x="52" y="168" text-anchor="end" font-family="${FONT}" font-size="9.5" fill="#475569">200</text>
        <line x1="56" y1="120" x2="395" y2="120" stroke="#E2E8F0" stroke-dasharray="3 3"/>
        <text x="52" y="123" text-anchor="end" font-family="${FONT}" font-size="9.5" fill="#475569">400</text>
        <line x1="56" y1="75" x2="395" y2="75" stroke="#E2E8F0" stroke-dasharray="3 3"/>
        <text x="52" y="78" text-anchor="end" font-family="${FONT}" font-size="9.5" fill="#475569">600</text>
        <text x="52" y="213" text-anchor="end" font-family="${FONT}" font-size="9.5" fill="#475569">0</text>
        <!-- Bars (scale: 200 units = 45px -> 0.225 px/unit) -->
        <rect x="86" y="115.5" width="38" height="94.5" fill="#087F70" rx="2"/>
        <text x="105" y="110" text-anchor="middle" font-family="${FONT}" font-size="9.5" font-weight="700" fill="#0F172A">420</text>
        <text x="105" y="225" text-anchor="middle" font-family="${FONT}" font-size="10" fill="#334155">2020</text>

        <rect x="156" y="106.5" width="38" height="103.5" fill="#087F70" rx="2"/>
        <text x="175" y="101" text-anchor="middle" font-family="${FONT}" font-size="9.5" font-weight="700" fill="#0F172A">460</text>
        <text x="175" y="225" text-anchor="middle" font-family="${FONT}" font-size="10" fill="#334155">2021</text>

        <rect x="226" y="99.75" width="38" height="110.25" fill="#087F70" rx="2"/>
        <text x="245" y="94" text-anchor="middle" font-family="${FONT}" font-size="9.5" font-weight="700" fill="#0F172A">490</text>
        <text x="245" y="225" text-anchor="middle" font-family="${FONT}" font-size="10" fill="#334155">2022</text>

        <rect x="296" y="88.5" width="38" height="121.5" fill="#087F70" rx="2"/>
        <text x="315" y="83" text-anchor="middle" font-family="${FONT}" font-size="9.5" font-weight="700" fill="#0F172A">540</text>
        <text x="315" y="225" text-anchor="middle" font-family="${FONT}" font-size="10" fill="#334155">2023</text>

        <rect x="352" y="79.5" width="38" height="130.5" fill="#087F70" rx="2"/>
        <text x="371" y="74" text-anchor="middle" font-family="${FONT}" font-size="9.5" font-weight="700" fill="#0F172A">580</text>
        <text x="371" y="225" text-anchor="middle" font-family="${FONT}" font-size="10" fill="#334155">2024</text>

        <!-- Legend -->
        <rect x="74" y="242" width="14" height="10" fill="#087F70" rx="2"/>
        <text x="94" y="251" font-family="${FONT}" font-size="10" fill="#334155">Sản lượng lương thực (nghìn tấn) — Nguồn: Số liệu giả định</text>
      </svg>`;
    },
  },
  {
    key: 'geo-combo-climate',
    title: 'Biểu đồ khí hậu Nhiệt độ – Lượng mưa',
    subject: 'geography',
    group: 'Biểu đồ địa lí',
    defaultLabels: [],
    render: (cfg: DiagramRenderConfig = {}) => {
      const c = cfg.strokeColor || '#164E63';
      const rain = [25, 30, 45, 90, 185, 240, 290, 310, 220, 130, 55, 28];
      const temp = [17, 18, 21, 24, 27, 29, 29.5, 28.5, 27, 24.5, 21.5, 18.5];
      const bars = rain
        .map((r, i) => {
          const h = (r / 350) * 125;
          const x = 62 + i * 26;
          return `<rect x="${x}" y="${(198 - h).toFixed(1)}" width="16" height="${h.toFixed(1)}" fill="#38BDF8" rx="1.5"/>
                  <text x="${x + 8}" y="213" text-anchor="middle" font-family="${FONT}" font-size="8.5" fill="#334155">T${i + 1}</text>`;
        })
        .join('');
      const pts = temp
        .map((t, i) => `${(70 + i * 26).toFixed(1)},${(198 - (t / 35) * 125).toFixed(1)}`)
        .join(' ');
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 440 270">
        <rect width="440" height="270" rx="8" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1"/>
        <text x="220" y="23" text-anchor="middle" font-family="${FONT}" font-size="12" font-weight="700" fill="#0F172A">BIỂU ĐỒ NHIỆT ĐỘ VÀ LƯỢNG MƯA TRẠM MẪU</text>
        <text x="220" y="38" text-anchor="middle" font-family="${FONT}" font-size="9.5" font-style="italic" fill="#475569">(Số liệu giả định minh họa khí hậu nhiệt đới ẩm gió mùa)</text>
        <line x1="54" y1="198" x2="384" y2="198" stroke="${c}" stroke-width="1.5"/>
        <line x1="54" y1="68" x2="54" y2="198" stroke="#0284C7" stroke-width="1.5"/>
        <line x1="384" y1="68" x2="384" y2="198" stroke="#DC2626" stroke-width="1.5"/>
        <text x="48" y="64" text-anchor="end" font-family="${FONT}" font-size="9" font-weight="700" fill="#0284C7">mm</text>
        <text x="390" y="64" font-family="${FONT}" font-size="9" font-weight="700" fill="#DC2626">°C</text>
        <text x="48" y="198" text-anchor="end" font-family="${FONT}" font-size="8.5" fill="#475569">0</text>
        <text x="48" y="136" text-anchor="end" font-family="${FONT}" font-size="8.5" fill="#475569">175</text>
        <text x="48" y="75" text-anchor="end" font-family="${FONT}" font-size="8.5" fill="#475569">350</text>
        <text x="390" y="198" font-family="${FONT}" font-size="8.5" fill="#DC2626">0</text>
        <text x="390" y="136" font-family="${FONT}" font-size="8.5" fill="#DC2626">17,5</text>
        <text x="390" y="75" font-family="${FONT}" font-size="8.5" fill="#DC2626">35</text>
        ${bars}
        <polyline points="${pts}" fill="none" stroke="#DC2626" stroke-width="2.2"/>
        <!-- Legend -->
        <rect x="64" y="236" width="14" height="10" fill="#38BDF8" rx="1.5"/>
        <text x="84" y="245" font-family="${FONT}" font-size="9.5" fill="#334155">Lượng mưa (mm)</text>
        <line x1="196" y1="241" x2="218" y2="241" stroke="#DC2626" stroke-width="2.4"/>
        <text x="224" y="245" font-family="${FONT}" font-size="9.5" fill="#334155">Nhiệt độ (°C) — Số liệu giả định</text>
      </svg>`;
    },
  },
  {
    key: 'geo-pie-structure',
    title: 'Biểu đồ tròn cơ cấu (%)',
    subject: 'geography',
    group: 'Biểu đồ địa lí',
    defaultLabels: [],
    render: () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 250">
      <rect width="420" height="250" rx="8" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1"/>
      <text x="210" y="24" text-anchor="middle" font-family="${FONT}" font-size="12" font-weight="700" fill="#0F172A">CƠ CẤU GDP THEO KHU VỰC KINH TẾ (SỐ LIỆU GIẢ ĐỊNH)</text>
      <!-- Pie centered at (130, 130), r=70: 15% (54deg), 38% (136.8deg), 47% (169.2deg) -->
      <path d="M 130 130 L 130 60 A 70 70 0 0 1 186.6 88.9 Z" fill="#087F70" stroke="#FFF" stroke-width="1.5"/>
      <path d="M 130 130 L 186.6 88.9 A 70 70 0 0 1 116.9 198.8 Z" fill="#164E63" stroke="#FFF" stroke-width="1.5"/>
      <path d="M 130 130 L 116.9 198.8 A 70 70 0 0 1 130 60 Z" fill="#F59E0B" stroke="#FFF" stroke-width="1.5"/>
      <text x="150" y="92" font-family="${FONT}" font-size="10.5" font-weight="700" fill="#FFF">15%</text>
      <text x="162" y="154" font-family="${FONT}" font-size="10.5" font-weight="700" fill="#FFF">38%</text>
      <text x="86" y="136" font-family="${FONT}" font-size="10.5" font-weight="700" fill="#0F172A">47%</text>
      <!-- Legend -->
      <rect x="236" y="88" width="14" height="12" rx="2" fill="#087F70"/>
      <text x="256" y="98" font-family="${FONT}" font-size="10.5" fill="#1E293B">Nông – Lâm – Thủy sản (15%)</text>
      <rect x="236" y="116" width="14" height="12" rx="2" fill="#164E63"/>
      <text x="256" y="126" font-family="${FONT}" font-size="10.5" fill="#1E293B">Công nghiệp – Xây dựng (38%)</text>
      <rect x="236" y="144" width="14" height="12" rx="2" fill="#F59E0B"/>
      <text x="256" y="154" font-family="${FONT}" font-size="10.5" fill="#1E293B">Dịch vụ (47%)</text>
      <text x="236" y="186" font-family="${FONT}" font-size="9.5" font-style="italic" fill="#64748B">Đơn vị: % · Tổng: 100%</text>
      <text x="236" y="201" font-family="${FONT}" font-size="9.5" font-style="italic" fill="#64748B">Nguồn: Số liệu giả định</text>
    </svg>`,
  },
  {
    key: 'geo-map-legend-compass',
    title: 'Lược đồ sơ phác & Chú giải địa lí',
    subject: 'geography',
    group: 'Bản đồ & Chú giải',
    defaultLabels: [],
    render: (cfg: DiagramRenderConfig = {}) => {
      const c = cfg.strokeColor || '#164E63';
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 440 260">
        <rect width="440" height="260" rx="8" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.2"/>
        <text x="220" y="22" text-anchor="middle" font-family="${FONT}" font-size="11.5" font-weight="700" fill="#0F172A">LƯỢC ĐỒ SƠ PHÁC MINH HỌA KỸ NĂNG ĐỌC KÝ HIỆU BẢN ĐỒ</text>
        <text x="220" y="36" text-anchor="middle" font-family="${FONT}" font-size="9" font-style="italic" fill="#475569">(Sơ đồ học tập ký hiệu, phương hướng & tỉ lệ — không thay thế bản đồ hành chính chính thức)</text>
        <!-- Schematic terrain & river frame -->
        <rect x="18" y="48" width="248" height="194" rx="6" fill="#ECFEFF" stroke="${c}" stroke-width="1.3"/>
        <path d="M 38 118 Q 112 72 195 96 Q 238 112 246 164 Q 214 218 118 220 Q 48 214 38 118 Z" fill="#ECFDF5" stroke="#087F70" stroke-width="1.5"/>
        <!-- River -->
        <path d="M 74 96 Q 124 134 148 158 T 232 184" fill="none" stroke="#0284C7" stroke-width="2.6"/>
        <!-- Mountain peaks -->
        <polygon points="88,128 98,110 108,128" fill="#B45309"/>
        <polygon points="108,132 117,116 126,132" fill="#B45309"/>
        <!-- City & Port symbols -->
        <circle cx="164" cy="152" r="5" fill="#DC2626" stroke="#FFF" stroke-width="1.2"/>
        <text x="174" y="155" font-family="${FONT}" font-size="9.5" font-weight="700" fill="#991B1B">Đô thị A</text>
        <rect x="206" y="176" width="10" height="10" fill="#164E63"/>
        <text x="172" y="198" font-family="${FONT}" font-size="9" font-weight="600" fill="#164E63">Cảng biển B</text>
        <!-- Compass Rose -->
        <g transform="translate(234,76)">
          <line x1="0" y1="-14" x2="0" y2="14" stroke="${c}" stroke-width="1.4"/>
          <line x1="-14" y1="0" x2="14" y2="0" stroke="${c}" stroke-width="1.4"/>
          <polygon points="0,-18 -4,-10 4,-10" fill="#DC2626"/>
          <text x="0" y="-20" text-anchor="middle" font-family="${FONT}" font-size="9" font-weight="700" fill="#DC2626">B</text>
          <text x="0" y="24" text-anchor="middle" font-family="${FONT}" font-size="8.5" fill="${c}">N</text>
          <text x="-20" y="3" text-anchor="middle" font-family="${FONT}" font-size="8.5" fill="${c}">T</text>
          <text x="20" y="3" text-anchor="middle" font-family="${FONT}" font-size="8.5" fill="${c}">Đ</text>
        </g>
        <!-- Scale Bar -->
        <line x1="30" y1="230" x2="90" y2="230" stroke="#0F172A" stroke-width="2"/>
        <line x1="30" y1="226" x2="30" y2="234" stroke="#0F172A" stroke-width="1.5"/>
        <line x1="90" y1="226" x2="90" y2="234" stroke="#0F172A" stroke-width="1.5"/>
        <text x="60" y="224" text-anchor="middle" font-family="${FONT}" font-size="8.5" fill="#0F172A">0      50 km (1:1.000.000)</text>
        <!-- Legend Box -->
        <rect x="278" y="48" width="144" height="194" rx="6" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.2"/>
        <text x="350" y="68" text-anchor="middle" font-family="${FONT}" font-size="11" font-weight="700" fill="#164E63">CHÚ GIẢI</text>
        <line x1="290" y1="76" x2="410" y2="76" stroke="#E2E8F0"/>
        <polygon points="296,102 303,90 310,102" fill="#B45309"/>
        <text x="318" y="100" font-family="${FONT}" font-size="10" fill="#334155">Đỉnh núi / địa hình cao</text>
        <line x1="294" y1="126" x2="312" y2="126" stroke="#0284C7" stroke-width="2.6"/>
        <text x="318" y="129" font-family="${FONT}" font-size="10" fill="#334155">Hệ thống sông</text>
        <circle cx="303" cy="154" r="4.5" fill="#DC2626"/>
        <text x="318" y="157" font-family="${FONT}" font-size="10" fill="#334155">Trung tâm đô thị</text>
        <rect x="298" y="177" width="10" height="10" fill="#164E63"/>
        <text x="318" y="186" font-family="${FONT}" font-size="10" fill="#334155">Cảng biển / đầu mối</text>
        <rect x="296" y="204" width="14" height="10" fill="#ECFDF5" stroke="#087F70"/>
        <text x="318" y="213" font-family="${FONT}" font-size="10" fill="#334155">Vùng đồng bằng</text>
      </svg>`;
    },
  },
  {
    key: 'geo-blank-chart-grid',
    title: 'Khung lưới tọa độ vẽ biểu đồ',
    subject: 'geography',
    group: 'Biểu đồ địa lí',
    defaultLabels: [],
    render: (cfg: DiagramRenderConfig = {}) => {
      const c = cfg.strokeColor || '#164E63';
      let grid = '';
      for (let x = 70; x <= 390; x += 32) {
        grid += `<line x1="${x}" y1="54" x2="${x}" y2="206" stroke="#E2E8F0" stroke-width="1"/>`;
      }
      for (let y = 54; y <= 206; y += 25.33) {
        grid += `<line x1="70" y1="${y.toFixed(1)}" x2="390" y2="${y.toFixed(1)}" stroke="#E2E8F0" stroke-width="1"/>`;
      }
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 430 250">
        <rect width="430" height="250" rx="8" fill="#FFFFFF" stroke="#CBD5E1"/>
        <text x="215" y="24" text-anchor="middle" font-family="${FONT}" font-size="11.5" font-weight="700" fill="#0F172A">KHUNG THỰC HÀNH VẼ BIỂU ĐỒ (GHI TÊN BIỂU ĐỒ, ĐƠN VỊ & CHÚ GIẢI)</text>
        ${grid}
        <line x1="70" y1="206" x2="398" y2="206" stroke="${c}" stroke-width="1.8"/>
        <line x1="70" y1="48" x2="70" y2="206" stroke="${c}" stroke-width="1.8"/>
        <polygon points="70,42 66,50 74,50" fill="${c}"/>
        <polygon points="404,206 396,202 396,210" fill="${c}"/>
        <text x="16" y="54" font-family="${FONT}" font-size="9.5" fill="#475569">(Đơn vị)</text>
        <text x="386" y="224" font-family="${FONT}" font-size="9.5" fill="#475569">Năm</text>
        <text x="70" y="236" font-family="${FONT}" font-size="10" fill="#475569">Chú giải: [   ] ................................................    [   ] ................................................</text>
      </svg>`;
    },
  },
];

export const HISTORY_DIAGRAMS: ScientificDiagramItem[] = [
  {
    key: 'his-timeline-horizontal',
    title: 'Dòng thời gian lịch sử (5 mốc)',
    subject: 'history',
    group: 'Dòng thời gian & Sơ đồ',
    defaultLabels: [],
    render: (cfg: DiagramRenderConfig = {}) => {
      const c = cfg.strokeColor || '#164E63';
      const nodes = [
        { x: 58, year: '1930', label: 'Đảng CSVN ra đời', top: true },
        { x: 140, year: '1945', label: 'CM tháng Tám', top: false },
        { x: 222, year: '1954', label: 'Điện Biên Phủ', top: true },
        { x: 304, year: '1975', label: 'Thống nhất đất nước', top: false },
        { x: 386, year: '1986', label: 'Công cuộc Đổi mới', top: true },
      ];
      const marks = nodes
        .map((n) => {
          const yCard = n.top ? 52 : 162;
          const yLineEnd = n.top ? 94 : 162;
          return `<line x1="${n.x}" y1="128" x2="${n.x}" y2="${yLineEnd}" stroke="${c}" stroke-width="1.6" stroke-dasharray="3 2"/>
            <circle cx="${n.x}" cy="128" r="7" fill="#087F70" stroke="#FFFFFF" stroke-width="2"/>
            <rect x="${n.x - 44}" y="${yCard}" width="88" height="42" rx="6" fill="#F4F8F7" stroke="#087F70" stroke-width="1.2"/>
            <text x="${n.x}" y="${yCard + 16}" text-anchor="middle" font-family="${FONT}" font-size="11" font-weight="700" fill="#087F70">${n.year}</text>
            <text x="${n.x}" y="${yCard + 32}" text-anchor="middle" font-family="${FONT}" font-size="8.5" fill="#1E293B">${n.label}</text>`;
        })
        .join('');
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 444 225">
        <rect width="444" height="225" rx="8" fill="#FFFFFF" stroke="#CBD5E1"/>
        <text x="222" y="24" text-anchor="middle" font-family="${FONT}" font-size="12" font-weight="700" fill="#164E63">TRỤC THỜI GIAN CÁC MỐC LỊCH SỬ TIÊU BIỂU (1930 – 1986)</text>
        <line x1="24" y1="128" x2="418" y2="128" stroke="${c}" stroke-width="3"/>
        <polygon points="426,128 415,122 415,134" fill="${c}"/>
        ${marks}
      </svg>`;
    },
  },
  {
    key: 'his-cause-effect-flow',
    title: 'Sơ đồ Nguyên nhân – Diễn biến – Kết quả – Ý nghĩa',
    subject: 'history',
    group: 'Dòng thời gian & Sơ đồ',
    defaultLabels: [],
    render: () => {
      const boxes = [
        { x: 16, title: '1. NGUYÊN NHÂN', sub1: 'Bối cảnh lịch sử', sub2: 'Mâu thuẫn & yêu cầu', fill: '#E6F1EF', stroke: '#087F70' },
        { x: 122, title: '2. DIỄN BIẾN', sub1: 'Các mốc chính', sub2: 'Sự kiện tiêu biểu', fill: '#EFF6FF', stroke: '#164E63' },
        { x: 228, title: '3. KẾT QUẢ', sub1: 'Thành tựu đạt được', sub2: 'Tác động trực tiếp', fill: '#FEF3C7', stroke: '#D97706' },
        { x: 334, title: '4. Ý NGHĨA', sub1: 'Giá trị lịch sử', sub2: 'Bài học kinh nghiệm', fill: '#FEE2E2', stroke: '#DC2626' },
      ];
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 440 165">
        <rect width="440" height="165" rx="8" fill="#FFFFFF" stroke="#CBD5E1"/>
        <text x="220" y="24" text-anchor="middle" font-family="${FONT}" font-size="12" font-weight="700" fill="#164E63">SƠ ĐỒ PHÂN TÍCH SỰ KIỆN LỊCH SỬ</text>
        ${boxes
          .map(
            (b, i) => `
          <rect x="${b.x}" y="44" width="90" height="98" rx="8" fill="${b.fill}" stroke="${b.stroke}" stroke-width="1.6"/>
          <text x="${b.x + 45}" y="68" text-anchor="middle" font-family="${FONT}" font-size="9.5" font-weight="700" fill="#0F172A">${b.title}</text>
          <line x1="${b.x + 10}" y1="76" x2="${b.x + 80}" y2="76" stroke="${b.stroke}" stroke-opacity="0.4"/>
          <text x="${b.x + 45}" y="98" text-anchor="middle" font-family="${FONT}" font-size="8.5" fill="#334155">${b.sub1}</text>
          <text x="${b.x + 45}" y="118" text-anchor="middle" font-family="${FONT}" font-size="8.5" fill="#334155">${b.sub2}</text>
          ${i < 3 ? `<line x1="${b.x + 92}" y1="93" x2="${b.x + 103}" y2="93" stroke="#475569" stroke-width="2"/><polygon points="${b.x + 105},93 ${b.x + 99},89 ${b.x + 99},97" fill="#475569"/>` : ''}
        `
          )
          .join('')}
      </svg>`;
    },
  },
  {
    key: 'his-source-box',
    title: 'Khung trích dẫn tư liệu lịch sử có nguồn',
    subject: 'history',
    group: 'Tư liệu & So sánh',
    defaultLabels: [],
    render: () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 150">
      <rect width="420" height="150" rx="8" fill="#FFFBEB" stroke="#D97706" stroke-width="1.6"/>
      <rect x="0" y="0" width="8" height="150" rx="2" fill="#B45309"/>
      <text x="24" y="26" font-family="${FONT}" font-size="11.5" font-weight="700" fill="#92400E">TƯ LIỆU LỊCH SỬ</text>
      <text x="24" y="54" font-family="${FONT}" font-size="10.5" font-style="italic" fill="#1E293B">“Nhập đoạn trích tư liệu lịch sử xác thực tại đây...”</text>
      <line x1="24" y1="76" x2="394" y2="76" stroke="#FDE68A" stroke-dasharray="4 3"/>
      <line x1="24" y1="100" x2="394" y2="100" stroke="#FDE68A" stroke-dasharray="4 3"/>
      <text x="394" y="132" text-anchor="end" font-family="${FONT}" font-size="10" font-weight="600" fill="#78350F">Nguồn: [Ghi rõ văn kiện / tác giả / năm xuất bản]</text>
    </svg>`,
  },
];

export const ENGLISH_DIAGRAMS: ScientificDiagramItem[] = [
  {
    key: 'eng-writing-rubric',
    title: 'English Writing / Speaking Rubric Box',
    subject: 'english',
    group: 'English Assessment',
    defaultLabels: [],
    render: () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 430 185">
      <rect width="430" height="185" rx="8" fill="#FFFFFF" stroke="#164E63" stroke-width="1.5"/>
      <rect x="0" y="0" width="430" height="32" rx="8" fill="#164E63"/>
      <text x="215" y="21" text-anchor="middle" font-family="${FONT}" font-size="11.5" font-weight="700" fill="#FFFFFF">ASSESSMENT CRITERIA (TEACHER MANUAL SCORING)</text>
      <text x="16" y="54" font-family="${FONT}" font-size="10" font-weight="700" fill="#0F172A">Criterion</text>
      <text x="275" y="54" font-family="${FONT}" font-size="10" font-weight="700" fill="#0F172A">Max</text>
      <text x="345" y="54" font-family="${FONT}" font-size="10" font-weight="700" fill="#DC2626">Score</text>
      <line x1="12" y1="62" x2="418" y2="62" stroke="#CBD5E1"/>
      <text x="16" y="84" font-family="${FONT}" font-size="10" fill="#334155">1. Task Response / Content</text>
      <text x="278" y="84" font-family="${FONT}" font-size="10" fill="#334155">2.5</text>
      <text x="348" y="84" font-family="${FONT}" font-size="10" fill="#94A3B8">____</text>
      <line x1="12" y1="93" x2="418" y2="93" stroke="#E2E8F0"/>
      <text x="16" y="114" font-family="${FONT}" font-size="10" fill="#334155">2. Coherence &amp; Cohesion</text>
      <text x="278" y="114" font-family="${FONT}" font-size="10" fill="#334155">2.5</text>
      <text x="348" y="114" font-family="${FONT}" font-size="10" fill="#94A3B8">____</text>
      <line x1="12" y1="123" x2="418" y2="123" stroke="#E2E8F0"/>
      <text x="16" y="144" font-family="${FONT}" font-size="10" fill="#334155">3. Lexical Resource (Vocabulary)</text>
      <text x="278" y="144" font-family="${FONT}" font-size="10" fill="#334155">2.5</text>
      <text x="348" y="144" font-family="${FONT}" font-size="10" fill="#94A3B8">____</text>
      <line x1="12" y1="153" x2="418" y2="153" stroke="#E2E8F0"/>
      <text x="16" y="174" font-family="${FONT}" font-size="10" fill="#334155">4. Grammatical Range &amp; Accuracy</text>
      <text x="278" y="174" font-family="${FONT}" font-size="10" fill="#334155">2.5</text>
      <text x="348" y="174" font-family="${FONT}" font-size="10" fill="#94A3B8">____</text>
    </svg>`,
  },
  {
    key: 'eng-teacher-feedback',
    title: 'Teacher Feedback Box (English)',
    subject: 'english',
    group: 'English Assessment',
    defaultLabels: [],
    render: () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 135">
      <rect width="420" height="135" rx="8" fill="#FEF2F2" stroke="#DC2626" stroke-width="1.5"/>
      <text x="16" y="24" font-family="${FONT}" font-size="11.5" font-weight="700" fill="#B91C1C">TEACHER'S FEEDBACK &amp; COMMENTS</text>
      <text x="16" y="48" font-family="${FONT}" font-size="10" fill="#334155">Strengths: _______________________________________________________</text>
      <text x="16" y="76" font-family="${FONT}" font-size="10" fill="#334155">Areas to improve: _______________________________________________</text>
      <text x="16" y="106" font-family="${FONT}" font-size="10" fill="#334155">Total Score: _______ / 10      Signature: ________________________</text>
    </svg>`,
  },
  {
    key: 'eng-answer-frame',
    title: 'Question & Answer Lines Box',
    subject: 'english',
    group: 'English Worksheet',
    defaultLabels: [],
    render: () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 140">
      <rect width="420" height="140" rx="8" fill="#FFFFFF" stroke="#087F70" stroke-width="1.4"/>
      <text x="16" y="24" font-family="${FONT}" font-size="11" font-weight="700" fill="#087F70">STUDENT ANSWER BOX</text>
      <line x1="16" y1="50" x2="404" y2="50" stroke="#CBD5E1" stroke-dasharray="4 3"/>
      <line x1="16" y1="76" x2="404" y2="76" stroke="#CBD5E1" stroke-dasharray="4 3"/>
      <line x1="16" y1="102" x2="404" y2="102" stroke="#CBD5E1" stroke-dasharray="4 3"/>
      <line x1="16" y1="126" x2="404" y2="126" stroke="#CBD5E1" stroke-dasharray="4 3"/>
    </svg>`,
  },
];

export const SOCIAL_ENGLISH_DIAGRAMS: ScientificDiagramItem[] = [
  ...GEOGRAPHY_DIAGRAMS,
  ...HISTORY_DIAGRAMS,
  ...ENGLISH_DIAGRAMS,
];
