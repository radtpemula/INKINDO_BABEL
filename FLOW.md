# FLOW.md — Alur Pengembangan & Pengalaman Website INKINDO BABEL

## 1. Alur Tata Letak Beranda Aktual (Homepage Layout Flow)

Berdasarkan implementasi kode pada `app/page.tsx`, seksi beranda disusun dalam satu alur linier yang berkesinambungan dengan ritme latar belakang selang-seling (putih `#FFFFFF` dan abu-abu halus `#F8FAFC`):

```text
Pengunjung Membuka Beranda (/)
  ↓
1. Header / Navbar
   (Topbar kontak, logo INKINDO BABEL, 9 menu navigasi, tombol Login & Registrasi)
  ↓
2. Hero Section
   (Headline resmi, tombol CTA, kisi blueprint CAD SVG, slideshow background, kartu visual kanan, sub-banner kemitraan)
  ↓
3. StatisticsSection (Latar Putih)
   (4 kartu metrik statistik organisasi dengan animasi count-up berbasis viewport)
  ↓
4. MembershipSteps (Latar Putih)
   (4 langkah lingkaran pendaftaran anggota baru)
  ↓
5. AboutSection (Latar Abu-abu #F8FAFC)
   (Profil organisasi, visi & misi, kartu kredensial LPJK/BNSP)
  ↓
6. RenewalSteps (Latar Putih)
   (4 langkah lingkaran perpanjangan keanggotaan)
  ↓
7. NewsSection (Latar Putih)
   (Warta & rilis berita terkini dari basis data dengan tautan ke halaman detail artikel)
  ↓
8. SbuRegistration (Latar Abu-abu #F8FAFC)
   (4 langkah lingkaran sertifikasi SBU)
  ↓
9. MemberWorks (Latar Putih)
   (Etalase portofolio karya unggulan anggota dengan tautan ke rute detail slug)
  ↓
10. Partners / Mitra Strategis (Latar Abu-abu #F8FAFC)
    (Seksi TUNGGAL mitra strategis dengan continuous infinite marquee carousel, hover pause, & tombol direktori)
  ↓
11. Footer (Latar Slate Gelap #0F172A)
    (Identitas organisasi, navigasi, alamat lengkap, kontak resmi, tautan media sosial dual-handle, hak cipta)
```

*(Catatan Revisi: Duplikasi seksi mitra di tengah halaman telah dihapus secara permanen pada Tahap 8.4.1. Mitra Strategis kini tampil secara tunggal dan elegan tepat sebelum Footer).*

---

## 2. Alur Navigasi & Arsitektur Halaman Publik

```text
Halaman Publik:
├── Beranda (/)                                     -> Dynamic Server Component
├── Tentang Kami
│   ├── Profil INKINDO (/tentang-kami/profil)       -> Sub-halaman (PlaceholderLayout)
│   └── Struktur Organisasi (.../struktur-organisasi)-> Sub-halaman (PlaceholderLayout)
├── Regulasi
│   ├── Regulasi INKINDO (/regulasi/inkindo)        -> Sub-halaman (PlaceholderLayout)
│   ├── Jasa Konsultansi (/regulasi/jasa-konsultansi) -> Sub-halaman (PlaceholderLayout)
│   └── Regulasi Terkait (/regulasi/terkait)        -> Sub-halaman (PlaceholderLayout)
├── Berita & Informasi
│   ├── Rilis Berita (/berita-informasi/rilis-berita)     -> Arsip Berita Dinamis (Filter/Search/Pagination)
│   │   └── Detail Berita (.../rilis-berita/[slug])       -> Halaman Detail Dinamis (SEO Metadata, 404 Guard)
│   ├── Karya Anggota (/berita-informasi/karya-anggota)   -> Arsip Galeri Portofolio (Filter/Search/Cards)
│   │   └── Detail Karya (.../karya-anggota/[slug])       -> Halaman Detail Dinamis (Spesifikasi, 404 Guard)
│   └── Agenda, Galeri, Publikasi, dsb.             -> Sub-halaman (PlaceholderLayout)
├── Info Lelang (/info-lelang/lkpp & .../lainnya)   -> Sub-halaman (PlaceholderLayout)
├── Anggota (/anggota/pendaftaran, perpanjangan, terdaftar) -> Sub-halaman (PlaceholderLayout)
├── Mitra Kerja
│   ├── Mitra Terdaftar (/mitra-kerja/terdaftar)    -> Direktori Publik Mitra (Filter/Search/Cards)
│   └── Ketentuan, Daftar, Login                    -> Sub-halaman (PlaceholderLayout)
├── Klinik Konsultasi (/klinik-konsultasi)          -> Sub-halaman (PlaceholderLayout)
├── Hubungi Kami (/hubungi-kami)                    -> Sub-halaman (PlaceholderLayout)
└── Portal Login Anggota (/login)                   -> Halaman login anggota publik
```

---

## 3. Alur Panel Administrasi Terproteksi (Admin CMS Flow)

```text
Pengguna Mengakses /babel-and-adt atau Sub-rutenya
  ↓
Layout Guard Server (app/babel-and-adt/(protected)/layout.tsx)
Memeriksa cookie 'inkindo_admin_session' via getCurrentAdmin()
  ├── Sesi Tidak Valid / Admin Inaktif / Tanpa Cookie
  │     ↓
  │   Redirect HTTP 307 ke /babel-and-adt/login
  │     ↓
  │   Form Login Admin -> Server Action loginAdminAction() -> Set Cookie HttpOnly -> Redirect ke /babel-and-adt
  │
  └── Sesi Terverifikasi (Admin Aktif)
        ↓
      Render Dashboard Shell (Sidebar, Header, Main Content)
        ├── /babel-and-adt                 -> Ringkasan Metrik Sistem & Panduan CLI
        ├── /babel-and-adt/hero            -> Manajemen Hero Slideshow, Teks Utama, & Kartu
        ├── /babel-and-adt/news            -> Manajemen Berita & Publikasi (CRUD & Toggle Publish)
        ├── /babel-and-adt/partners        -> Manajemen Mitra Kerja (CRUD, Reorder, & Upload Logo)
        ├── /babel-and-adt/member-works    -> Manajemen Karya Anggota (CRUD, Reorder, Featured Toggle)
        ├── /babel-and-adt/settings        -> Pengaturan Website (Identitas, Kontak, Topbar, Footer, Medsos)
        └── /babel-and-adt/admin           -> Manajemen Akun Admin (Khusus SUPER_ADMIN)
```

---

## 4. Alur Upload Berkas & Pemrosesan Gambar

```text
Admin Memilih Berkas Gambar (JPEG/PNG/WebP maks 5 MB) pada Modal Form
  ↓
Client Component memanggil fetch("POST", "/api/admin/*-upload", formData)
  ↓
API Route Handler Upload Terproteksi (app/api/admin/*-upload/route.ts):
  1. Validasi autentikasi admin via getCurrentAdmin() -> Tolak 401/403 jika tidak sah
  2. Ekstraksi buffer biner berkas dari Request FormData
  3. Validasi batas ukuran berkas (<= 5 MB) -> Tolak 400 jika melebihi
  4. Validasi signature magic bytes biner asli buffer (lib/storage/image-validation.ts)
     (Hanya signature JPEG, PNG, dan WebP yang diizinkan; SVG/HTML/EXE ditolak)
  5. Pembuatan nama berkas acak unik: [prefix]-[timestamp]-[uuid].[ext]
  6. Penulisan berkas sementara (.tmp-[filename]) lalu rename atomik ke target
  7. Return JSON status 201: { publicPath: "/uploads/.../filename.webp" }
  ↓
Client menyimpan publicPath ke dalam state formulir
  ↓
Catatan: Upload API murni menangani penyimpanan berkas dan TIDAK mengubah basis data.
```

---

## 5. Alur CRUD & Revalidasi Cache Sisi Server

```text
Admin Menekan Tombol Simpan pada Formulir
  ↓
Client Component memanggil Server Action (lib/admin/*-actions.ts)
  ↓
Eksekusi Server Action:
  1. Validasi Otorisasi: verifyActiveAdmin() memeriksa sesi administrator aktif
  2. Validasi Input: Pemeriksaan batas karakter, sanitasi teks, format URL, & keunikan slug
  3. Mutasi Basis Data: Prisma Client mengeksekusi operasi (create/update/delete/transaction)
  4. Pembersihan Berkas Aman (Safe Image Cleanup):
     - Berkas gambar lama dihapus HANYA jika operasi basis data berhasil
     - Berkas gambar lama TIDAK AKAN dihapus jika masih digunakan oleh record lain (shared protection)
     - Pencegahan path traversal melalui sanitasi batas direktori
  5. Revalidasi Cache: safeRevalidate() memanggil revalidatePath() ke rute publik & admin terkait
  ↓
Respons JSON dikirim kembali ke Client -> Notifikasi sukses ditampilkan -> Tabel diperbarui
```

---

## 6. Alur Publikasi dari Basis Data ke Website

```text
Permintaan Pengunjung ke Halaman Publik (Beranda, Arsip, atau Detail Slug)
  ↓
Server Component mengeksekusi fetcher publik (lib/public/*.ts)
  ↓
Query Prisma menyaring record aktif (isActive: true, dan isFeatured: true untuk etalase)
  ├── Jika record ditemukan:
  │     ↓
  │   Kembalikan data dinamis terurut dari basis data SQLite
  │
  ├── Jika tabel kosong (count === 0):
  │     ↓
  │   Aktifkan kaidah fallback statis dari data/landing.ts (instalasi baru)
  │
  └── Jika record ada di tabel tetapi SEMUANYA nonaktif (isActive: false):
        ↓
      Kembalikan array kosong [] (Kaidah isolasi: data statis lama tidak boleh bocor kembali)
  ↓
Komponen me-render data ke HTML bersih tanpa kebocoran data draft/nonaktif
```

---

## 7. Status & Tahapan Roadmap Proyek

- **Tahap Selesai (Completed):**
  - Phase 1–5: Prototipe landing page awal
  - Tahap 1: Fondasi basis data SQLite & Prisma ORM
  - Tahap 2: Autentikasi sesi JWT, login page, & CLI init
  - Tahap 3: Manajemen administrator & proteksi SUPER_ADMIN
  - Tahap 4: Hero slideshow & upload gambar banner
  - Tahap 5: Redesign visual tema Engineering Slate + Burnt Amber
  - Tahap 6: Pengaturan konten hero terpadu & kartu teknis
  - Tahap 7: Manajemen CMS berita, arsip rilis berita, & halaman detail slug
  - Tahap 8.1: Audit komprehensif fondasi CMS
  - Tahap 8.2: Pengaturan website (kontak, topbar, footer, medsos dual-handle)
  - Tahap 8.4: Manajemen Mitra Kerja & Karya Anggota (8.4.1 s.d. 8.4.5) termasuk infinite marquee carousel
- **Tahap Sengaja Ditunda (ON HOLD):**
  - **Tahap 8.3 — Manajemen Konten Beranda:** DITUNDA atas keputusan eksplisit pengguna karena kebutuhan klien terkait dinamisasi urutan seksi beranda belum jelas.
- **Tahap Belum Dikerjakan (Upcoming):**
  - **Tahap 8.5 — Manajemen Halaman Internal:** (Usulan prioritas berikutnya) Mengisi dan mengelola konten 23 sub-halaman publik yang saat ini masih menggunakan `PlaceholderLayout.tsx`.
  - **Tahap 8.6 — Manajemen Menu Navigasi Dinamis:** (Rencana masa depan) Memanfaatkan model `NavigationItem` untuk mengelola tautan menu secara dinamis dari dashboard.

---

## 8. Catatan Historis: Alur Awal Prototipe Frontend (Arsip)

*(Bagian ini dipertahankan sebagai referensi riwayat fase awal proyek)*

Pada tahap awal pembuatan prototipe, proyek berfokus murni pada keselarasan visual antarmuka terhadap tangkapan layar acuan (DKI Jakarta):
- Alur awal menitikberatkan pada parsing visual 10 seksi linier dengan data statis dari `data/landing.ts`.
- Palet warna awal menggunakan Navy `#14245C` dan Orange `#FF6600`.
- Saat itu fitur backend, basis data, autentikasi, dan panel CMS memang sengaja belum dibangun.
- Seiring evolusi proyek menjadi aplikasi resmi INKINDO BABEL, identitas visual diperbarui menjadi Engineering Slate + Burnt Amber, seksi mitra disatukan, dan seluruh fondasi full-stack CMS dibangun secara bertahap hingga Tahap 8.4.
