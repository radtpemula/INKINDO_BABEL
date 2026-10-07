export interface SubNavItem {
  label: string;
  href: string;
}

export interface NavItem {
  label: string;
  href: string;
  iconName?: "House" | "Building2" | "Scale" | "Newspaper" | "Gavel" | "Users" | "Handshake" | "CircleHelp" | "Phone" | "Home" | "HelpCircle";
  subItems?: SubNavItem[];
}

export interface StepItem {
  number: string;
  title: string;
  description: string;
  iconName: string;
}

export interface NewsItem {
  id: string;
  title: string;
  category: string;
  date: string;
  readTime: string;
  description: string;
  imagePlaceholderText: string;
}

export interface MemberWorkItem {
  id: string;
  title: string;
  category: string;
  company: string;
  year: string;
  imagePlaceholderText: string;
}

export interface PartnerItem {
  name: string;
  shortName: string;
  category?: string;
}

export interface StatisticItem {
  id: string;
  value: number;
  suffix: string;
  label: string;
  description: string;
  iconName: "Building2" | "Calendar" | "Award" | "CheckCircle2";
}

export const topBarData = {
  phone: "(0717) 910-1234",
  email: "sekretariat@inkindo-babel.org",
  address: "Pangkalpinang, Kepulauan Bangka Belitung",
  workingHours: "Senin - Jumat: 08.30 - 16.30 WIB",
};

export const navigationLinks: NavItem[] = [
  {
    label: "Beranda",
    href: "/",
    iconName: "House",
  },
  {
    label: "Tentang Kami",
    href: "/tentang-kami/profil",
    iconName: "Building2",
    subItems: [
      { label: "Profil INKINDO", href: "/tentang-kami/profil" },
      { label: "Visi & Misi", href: "/tentang-kami/visi-misi" },
      { label: "Struktur Organisasi", href: "/tentang-kami/struktur-organisasi" },
    ],
  },
  {
    label: "Regulasi",
    href: "/regulasi/inkindo",
    iconName: "Scale",
    subItems: [
      { label: "Regulasi INKINDO", href: "/regulasi/inkindo" },
      { label: "Regulasi Jasa Konsultansi", href: "/regulasi/jasa-konsultansi" },
      { label: "Regulasi Terkait", href: "/regulasi/terkait" },
    ],
  },
  {
    label: "Berita & Informasi",
    href: "/berita-informasi/agenda-kegiatan",
    iconName: "Newspaper",
    subItems: [
      { label: "Agenda Kegiatan", href: "/berita-informasi/agenda-kegiatan" },
      { label: "Rilis Berita", href: "/berita-informasi/rilis-berita" },
      { label: "Live Streaming", href: "/berita-informasi/live-streaming" },
      { label: "Publikasi", href: "/berita-informasi/publikasi" },
      { label: "Galeri", href: "/berita-informasi/galeri" },
      { label: "e-Magazine", href: "/berita-informasi/e-magazine" },
      { label: "Digital Library", href: "/berita-informasi/digital-library" },
      { label: "Karya Anggota", href: "/berita-informasi/karya-anggota" },
      { label: "DPN INKINDO", href: "/berita-informasi/dpn-inkindo" },
    ],
  },
  {
    label: "Info Lelang",
    href: "/info-lelang/lkpp",
    iconName: "Gavel",
    subItems: [
      { label: "LKPP", href: "/info-lelang/lkpp" },
      { label: "Lainnya", href: "/info-lelang/lainnya" },
    ],
  },
  {
    label: "Anggota",
    href: "/anggota/pendaftaran",
    iconName: "Users",
    subItems: [
      { label: "Pendaftaran Anggota Baru", href: "/anggota/pendaftaran" },
      { label: "Perpanjangan Anggota", href: "/anggota/perpanjangan" },
      { label: "Anggota Terdaftar", href: "/anggota/terdaftar" },
    ],
  },
  {
    label: "Mitra Kerja",
    href: "/mitra-kerja/ketentuan",
    iconName: "Handshake",
    subItems: [
      { label: "Ketentuan Mitra Kerja", href: "/mitra-kerja/ketentuan" },
      { label: "Daftar Mitra Kerja", href: "/mitra-kerja/daftar" },
      { label: "Mitra Kerja Terdaftar", href: "/mitra-kerja/terdaftar" },
      { label: "Login Mitra Kerja", href: "/mitra-kerja/login" },
    ],
  },
  {
    label: "Klinik Konsultasi",
    href: "/klinik-konsultasi",
    iconName: "CircleHelp",
  },
  {
    label: "Hubungi Kami",
    href: "/hubungi-kami",
    iconName: "Phone",
  },
];

export const heroData = {
  badge: "Ikatan Nasional Konsultan Indonesia",
  title: "DPP INKINDO BABEL",
  subtitle: "Wadah Perusahaan Jasa Konsultansi Profesional, Berintegritas, dan Berdaya Saing Unggul di Provinsi Kepulauan Bangka Belitung.",
  primaryCtaText: "Daftar Anggota Baru",
  primaryCtaHref: "#membership-steps",
  secondaryCtaText: "Layanan SBU Online",
  secondaryCtaHref: "#sbu-steps",
  searchPlaceholder: "Masukkan No. Anggota / Nama Perusahaan Konsultan...",
  searchButtonText: "Cek Status",
};

export const statisticsData: StatisticItem[] = [
  {
    id: "members",
    value: 120,
    suffix: "+",
    label: "Badan Usaha Anggota",
    description: "Perusahaan jasa konsultansi resmi terdaftar di Bangka Belitung",
    iconName: "Building2",
  },
  {
    id: "experience",
    value: 20,
    suffix: "+",
    label: "Tahun Dedikasi",
    description: "Mengawal pembangunan infrastruktur Serumpun Sebalai",
    iconName: "Calendar",
  },
  {
    id: "experts",
    value: 650,
    suffix: "+",
    label: "Tenaga Ahli Tersertifikasi",
    description: "Insinyur & konsultan profesional lintas disiplin ilmu",
    iconName: "Award",
  },
  {
    id: "digital",
    value: 100,
    suffix: "%",
    label: "Layanan Digital Terintegrasi",
    description: "Registrasi, verifikasi KTA, dan administrasi SBU online",
    iconName: "CheckCircle2",
  },
];

export const membershipSteps: StepItem[] = [
  {
    number: "01",
    title: "Registrasi",
    description: "Mengisi data badan usaha dan mengunggah dokumen legalitas awal melalui portal digital resmi INKINDO BABEL.",
    iconName: "UserPlus",
  },
  {
    number: "02",
    title: "Terima Notifikasi",
    description: "Menerima konfirmasi dan hasil verifikasi kelengkapan berkas administratif serta teknis melalui sistem dan email.",
    iconName: "FileCheck",
  },
  {
    number: "03",
    title: "Pembayaran",
    description: "Melakukan pembayaran iuran keanggotaan dan uang pangkal melalui rekening resmi organisasi yang terverifikasi.",
    iconName: "CreditCard",
  },
  {
    number: "04",
    title: "Berhasil",
    description: "Kartu Tanda Anggota (KTA) digital dan Surat Keterangan Terdaftar resmi diterbitkan dan siap diunduh.",
    iconName: "Award",
  },
];

export const aboutData = {
  subtitle: "PROFIL ORGANISASI",
  title: "Membangun Industri Konsultansi Bangka Belitung yang Kredibel dan Berkelanjutan",
  description1: "Ikatan Nasional Konsultan Indonesia (INKINDO) Provinsi Kepulauan Bangka Belitung (INKINDO BABEL) merupakan wadah asosiasi perusahaan jasa konsultansi konstruksi dan non-konstruksi di wilayah Provinsi Kepulauan Bangka Belitung. Berdiri dengan komitmen kokoh mengawal pembangunan nasional dan daerah yang berkualitas, beretika, serta adaptif terhadap kemajuan teknologi rekayasa dan manajemen modern.",
  description2: "Dengan anggota aktif dari berbagai bidang keahlian, INKINDO BABEL senantiasa mendorong anggotanya untuk meningkatkan standar keprofesian, perlindungan hukum, fasilitasi sertifikasi badan usaha, serta advokasi regulasi iklim usaha jasa konsultansi yang sehat dan transparan.",
  vision: "Menjadi wadah perusahaan jasa konsultansi terdepan yang profesional, inovatif, mandiri, dan berdaya saing global untuk mendukung pembangunan berkelanjutan di Kepulauan Bangka Belitung.",
  missions: [
    "Meningkatkan kompetensi, integritas, dan profesionalisme perusahaan jasa konsultansi anggota.",
    "Mengembangkan kolaborasi kemitraan strategis dengan pemerintah daerah, BUMN/BUMD, serta sektor swasta.",
    "Melindungi hak dan kepentingan usaha anggota dalam menciptakan iklim persaingan yang sehat dan berkeadilan.",
    "Mendorong adopsi teknologi ramah lingkungan dan transformasi digital dalam praktik konsultansi rekayasa.",
  ],
  stats: [
    { value: "120+", label: "Perusahaan Anggota Aktif" },
    { value: "20+", label: "Tahun Dedikasi Profesi" },
    { value: "650+", label: "Tenaga Ahli Bersertifikat" },
    { value: "100%", label: "Layanan Berbasis Digital" },
  ],
};

export const renewalSteps: StepItem[] = [
  {
    number: "01",
    title: "Login",
    description: "Masuk ke portal keanggotaan menggunakan akun resmi dan nomor registrasi badan usaha konsultan Anda.",
    iconName: "LogIn",
  },
  {
    number: "02",
    title: "Edit Data",
    description: "Memperbarui data pengurus, tenaga ahli tetap, dan neraca laporan keuangan berkala perusahaan.",
    iconName: "Edit3",
  },
  {
    number: "03",
    title: "Pembayaran",
    description: "Membayar tagihan iuran tahunan sesuai invoice elektronik resmi yang diterbitkan sekretariat.",
    iconName: "Receipt",
  },
  {
    number: "04",
    title: "Berhasil",
    description: "Masa berlaku keanggotaan diperpanjang otomatis dan sertifikat KTA digital langsung aktif.",
    iconName: "CheckCircle",
  },
];

export const mainPartners: PartnerItem[] = [
  { name: "Lembaga Pengembangan Jasa Konstruksi", shortName: "LPJK PUPR" },
  { name: "Kementerian Pekerjaan Umum dan Perumahan Rakyat", shortName: "KEMEN PUPR" },
  { name: "Pemerintah Provinsi Kepulauan Bangka Belitung", shortName: "PEMPROV BABEL" },
  { name: "Kamar Dagang dan Industri Kepulauan Bangka Belitung", shortName: "KADIN BABEL" },
  { name: "Badan Nasional Sertifikasi Profesi", shortName: "BNSP" },
  { name: "DPP INKINDO Nasional", shortName: "DPP INKINDO" },
];

export const newsArticles: NewsItem[] = [
  {
    id: "news-1",
    title: "Musyawarah Provinsi INKINDO BABEL: Memperkuat Peran Konsultan dalam Pembangunan Berkelanjutan",
    category: "AGENDA RESMI",
    date: "24 September 2026",
    readTime: "4 menit baca",
    description: "Perwakilan konsultan hadir dalam Musyawarah Provinsi untuk merumuskan arah kebijakan strategis organisasi menghadapi percepatan pembangunan infrastruktur daerah dan potensi maritim.",
    imagePlaceholderText: "Dokumentasi Musyawarah Provinsi",
  },
  {
    id: "news-2",
    title: "Sosialisasi Regulasi Terbaru Perizinan Berusaha dan Sertifikasi Badan Usaha Konstruksi",
    category: "REGULASI & KEBIJAKAN",
    date: "18 September 2026",
    readTime: "5 menit baca",
    description: "INKINDO BABEL memfasilitasi dialog interaktif bersama pemangku kebijakan daerah dan kementerian terkait perihal percepatan proses permohonan sertifikasi dan integrasi OSS-RBA.",
    imagePlaceholderText: "Sosialisasi Regulasi Jasa Konstruksi",
  },
  {
    id: "news-3",
    title: "Peningkatan Kapasitas Tenaga Ahli Menghadapi Standar BIM dan Efisiensi Energi Bangunan Hijau",
    category: "WORKSHOP & TEKNIS",
    date: "10 September 2026",
    readTime: "3 menit baca",
    description: "Pelatihan komprehensif implementasi Building Information Modelling (BIM) Level 2 untuk memastikan kesiapan konsultan daerah dalam proyek bertaraf nasional.",
    imagePlaceholderText: "Workshop BIM & Bangunan Hijau",
  },
];

export const sbuSteps: StepItem[] = [
  {
    number: "01",
    title: "Anggota INKINDO BABEL",
    description: "Perusahaan telah terdaftar sah dan berstatus sebagai anggota aktif DPP INKINDO BABEL.",
    iconName: "ShieldCheck",
  },
  {
    number: "02",
    title: "Pengisian Formulir Online",
    description: "Mengisi klasifikasi dan kualifikasi bidang jasa konsultansi serta mengunggah kelengkapan dokumen teknis.",
    iconName: "FileSpreadsheet",
  },
  {
    number: "03",
    title: "Pembayaran",
    description: "Melakukan konfirmasi pembayaran biaya sertifikasi sesuai ketentuan LSBU yang berlaku.",
    iconName: "CreditCard",
  },
  {
    number: "04",
    title: "Berhasil",
    description: "Sertifikat Badan Usaha (SBU) resmi terbit dan tercatat secara sah di sistem LPJK nasional.",
    iconName: "Award",
  },
];

export const memberWorks: MemberWorkItem[] = [
  {
    id: "work-1",
    title: "Kajian Masterplan Kawasan Pelabuhan & Logistik Maritim Terpadu Bangka Belitung",
    category: "Perencanaan Wilayah & Maritim",
    company: "PT Bina Serumpun Rekayasa",
    year: "2025",
    imagePlaceholderText: "Studi Masterplan Kawasan Pelabuhan Terpadu",
  },
  {
    id: "work-2",
    title: "Desain Rekayasa Struktur Gedung Pusat Layanan Publik Ramah Lingkungan",
    category: "Rekayasa Struktur Bangunan",
    company: "PT Timah Karya Engineering",
    year: "2025",
    imagePlaceholderText: "Desain Struktur Gedung Pusat Layanan Publik",
  },
  {
    id: "work-3",
    title: "Audit Lingkungan dan Pengelolaan Wilayah Pesisir Terpadu Daerah Aliran Sungai",
    category: "Studi Lingkungan & Sumber Daya Air",
    company: "PT Mitra Pesisir Konsultindo",
    year: "2026",
    imagePlaceholderText: "Kajian Pengelolaan Wilayah Pesisir & Sungai",
  },
  {
    id: "work-4",
    title: "Manajemen Konstruksi Revitalisasi Jaringan Infrastruktur Air Bersih & Sanitasi",
    category: "Manajemen Konstruksi & Utilitas",
    company: "PT Belitung Prima Konsultan",
    year: "2026",
    imagePlaceholderText: "Pengawasan Manajemen Proyek Utilitas Terpadu",
  },
];

export const additionalPartners: PartnerItem[] = [
  { name: "Bank Sumsel Babel", shortName: "Bank Sumsel Babel", category: "Mitra Perbankan" },
  { name: "Bank Mandiri", shortName: "Mandiri", category: "Mitra Perbankan" },
  { name: "Lembaga Sertifikasi Profesi Asosiasi", shortName: "LSP Astekindo", category: "Sertifikasi Profesi" },
  { name: "Persatuan Insinyur Indonesia", shortName: "PII Babel", category: "Asosiasi Profesi" },
  { name: "Ikatan Arsitek Indonesia", shortName: "IAI Babel", category: "Asosiasi Profesi" },
  { name: "Himpunan Ahli Manajemen Konstruksi", shortName: "HAMKI", category: "Asosiasi Profesi" },
];

export const footerData = {
  orgName: "INKINDO BABEL",
  tagline: "Dewan Pengurus Provinsi Ikatan Nasional Konsultan Indonesia Kepulauan Bangka Belitung",
  description: "Organisasi independen yang menghimpun perusahaan jasa konsultansi di wilayah Provinsi Kepulauan Bangka Belitung guna meningkatkan kapasitas, daya saing, dan integritas tata kelola rekayasa kepulauan yang berkelanjutan.",
  address: "Jl. Jenderal Sudirman No. 45, Gabek, Pangkalpinang, Kepulauan Bangka Belitung 33114",
  phone: "(0717) 910-1234 / 910-1235",
  fax: "(0717) 910-1236",
  email: "sekretariat@inkindo-babel.org",
  legal: "Terdaftar Resmi di Kementerian Hukum dan HAM Republik Indonesia & Lembaga Jasa Konstruksi.",
  quickLinks: [
    { label: "Profil & Struktur Organisasi", href: "#about" },
    { label: "Alur Pendaftaran Anggota", href: "#membership-steps" },
    { label: "Perpanjangan Masa Keanggotaan", href: "#renewal-steps" },
    { label: "Layanan Sertifikasi SBU", href: "#sbu-steps" },
    { label: "Berita & Pengumuman Resmi", href: "#news" },
    { label: "Galeri Karya & Riset Anggota", href: "#member-works" },
  ],
  services: [
    { label: "Registrasi Keanggotaan Baru", href: "#membership-steps" },
    { label: "Verifikasi SBU Konstruksi", href: "#sbu-steps" },
    { label: "Konsultasi Bantuan Hukum Usaha", href: "#" },
    { label: "Pusat Pelatihan & Uji Kompetensi", href: "#" },
    { label: "Direktori Perusahaan Anggota", href: "#" },
    { label: "Unduh Dokumen & Regulasi", href: "#" },
  ],
  copyright: `© ${new Date().getFullYear()} DPP INKINDO BABEL. Seluruh Hak Cipta Dilindungi Undang-Undang.`,
};
