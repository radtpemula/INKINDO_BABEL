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
        ├── /babel-and-adt/hero            -> Manajemen Hero Slideshow, Background, & Kartu
        ├── /babel-and-adt/news            -> Manajemen Berita & Publikasi (CRUD & Tiptap Editor)
        ├── /babel-and-adt/partners        -> Manajemen Mitra Kerja (CRUD, Reorder, & Upload-on-Submit)
        ├── /babel-and-adt/member-works    -> Manajemen Karya Anggota (CRUD, Reorder, Featured Toggle)
        ├── /babel-and-adt/settings        -> Pengaturan Website (Identitas, Kontak, Topbar, Footer, Medsos)
        └── /babel-and-adt/admin           -> Manajemen Akun Admin (Khusus SUPER_ADMIN)
```

---

## 4. Alur Upload-on-Submit Terpadu (Mitra, Karya Anggota, Hero, Berita Cover)

Seluruh modul formulir CMS menerapkan alur **Upload-on-Submit** terkoordinasi (`components/admin/deferred-image-upload.ts` dan `use-deferred-image-upload.ts`) untuk menjamin tidak ada berkas orphan yang tercipta saat pemilihan atau penggantian gambar:

```text
Admin Memilih Berkas Gambar (JPEG/PNG/WebP maks 5 MB) pada Modal
  ↓
1. Validasi Awal di Client:
   - Cek ukuran (0 < size <= 5 MB) & tipe MIME resmi
   - Tolak dan reset input jika tidak valid
  ↓
2. Penanganan State Lokal (Belum Ada Upload):
   - selectedFile disimpan di state lokal komponen
   - URL.createObjectURL(file) dibuat untuk pratinjau instan
   - URL object sebelumnya otomatis di-revoke (URL.revokeObjectURL)
  ↓
3. Administrator Mengisi Form & Menekan Tombol "Simpan":
   - Guard synchronous lock (useRef) memblokir klik ganda (double-submit)
   - Seluruh validasi data formulir dijalankan terlebih dahulu
   ├── Jika validasi form gagal:
   │     ↓
   │   Hentikan proses; TIDAK ADA request upload yang dikirim
   │
   └── Jika validasi form lolos:
         ↓
       Kirim request POST ke endpoint upload (/api/admin/*-upload) dengan FormData
         ↓
       Backend Pipeline (Sharp & Storage):
         a. Autentikasi sesi admin aktif (getCurrentAdmin)
         b. In-memory rate limiting (checkUploadRateLimit)
         c. Validasi magic bytes biner asli & ukuran buffer
         d. Sharp decode, validasi dimensi (maks 8192px / 32 MP), rotasi visual otomatis
         e. Stripping metadata sensitif total (EXIF, GPS kamera)
         f. Re-encode terpadu (JPEG mozjpeg, PNG compression 9, WebP q85)
         g. Penulisan atomik via .tmp-[filename] lalu rename
         h. Terbitkan token kepemilikan bertanda tangan: uploadToken (TTL 15 menit)
         i. Return HTTP 201: { success: true, path, data: { publicPath, uploadToken } }
         ↓
       Promosikan publicPath ke state dan kosongkan selectedFile (untuk retry safe)
         ↓
       Eksekusi Server Action Penyimpanan Database (create/update):
         ├── Jika Server Action BERHASIL:
         │     ↓
         │   Database ter-update, bersihkan berkas lama via safeDeleteUnreferencedImage
         │   (hanya jika berkas lama tidak lagi direferensikan record lain)
         │   Tutup modal dan perbarui tabel dashboard
         │
         ├── Jika Server Action GAGAL PASTI (definite_failure, misal slug duplikat):
         │     ↓
         │   Server menerbitkan failure receipt resmi: rollbackToken
         │   Formulir tetap terbuka; berkas baru dipertahankan di form state
         │   ├── Administrator Memperbaiki Form & Klik "Simpan" Ulang (Retry):
         │   │     ↓
         │   │   Langsung panggil Server Action TANPA mengunggah file baru
         │   │
         │   └── Administrator Membatalkan / Menutup Modal:
         │         ↓
         │       Kirim rollbackPendingUploadAction({ module, publicPath, uploadToken, rollbackToken })
         │       Server memverifikasi token & referensi sebelum menghapus berkas orphan
         │
         └── Jika Server Action MENGALAMI TIMEOUT / ERROR TIDAK DIKETAHUI (unknown):
               ↓
             Status dikunci menjadi "unknown" secara permanen (sticky unknown)
             Client DILARANG menghapus berkas; berkas dipertahankan aman
             Dicatat dalam log sebagai [orphan-candidate] non-destruktif
```

---

## 5. Alur Khusus Gambar Inline Editor Tiptap (Artikel Berita)

Gambar inline di dalam artikel berita dikelola dengan aturan draft-safety yang ketat untuk mencegah terhapusnya gambar yang sedang diedit:

```text
Admin Membuka Editor Berita -> Klik "Sisipkan Gambar" pada Toolbar
  ↓
Pilih berkas JPEG/PNG/WebP, isi Alt (wajib), Caption (opsional), Ukuran, & Alignment
  ↓
Klik "Unggah & Sisipkan" pada Dialog Inline:
  1. POST ke /api/admin/news-inline-upload (Sharp pipeline, max 5 MB, no EXIF)
  2. Endpoint mengembalikan HTTP 201 { publicPath, uploadToken }
  3. Node <figure><img><figcaption> disisipkan ke posisi kursor editor
  4. Sesi editor mencatat berkas pada sessionInlineUploadsRef (path -> uploadToken)
  ↓
Skenario Selama Penulisan & Penyuntingan:
  ├── Administrator Menghapus Node Gambar di Editor (Backspace / Delete):
  │     ↓
  │   File fisik TIDAK LANGSUNG DIHAPUS dari disk!
  │   File tetap utuh untuk mendukung Undo (Ctrl+Z), Redo, atau penyisipan ulang
  │
  ├── Administrator Membatalkan Naskah (Klik "Batal" atau Tutup Modal):
  │     ↓
  │   Panggil rollbackDraftInlineUploadsAction({ uploads, saveOutcome })
  │   HANYA berkas yang terbukti milik sesi draft tersebut dan bebas referensi
  │   yang akan dibersihkan. Jika status simpan tidak pasti, file tetap dipertahankan
  │
  └── Administrator Menekan "Simpan Artikel" (Submit):
        ↓
      Konten artikel disanitasi server (whitelist tag & attribute, isolasi path)
      Server Action create/update menyimpan artikel ke basis data MySQL
        ↓
      Pembersihan Pasca-Simpan (cleanupUnusedInlineImagesPostSave):
        1. Bandingkan gambar naskah lama dengan naskah baru
        2. Periksa gambar sesi baru yang diunggah tapi tidak disisipkan ke naskah final
        3. Verifikasi isNewsInlineImageReferenced (memindai seluruh artikel berita)
        4. Hapus hanya gambar yang benar-benar tidak lagi terpakai di mana pun
```

---

## 6. Alur Penghapusan Data & Reference-Aware Deletion

Ketika sebuah entitas (Mitra, Karya, Hero Slide, atau Berita) dihapus oleh administrator:

```text
Admin Mengonfirmasi Penghapusan pada Dialog Konfirmasi
  ↓
Client Component memanggil Server Action Penghapusan (delete*Action)
  ↓
1. Validasi Hak Akses: verifyActiveAdmin() memastikan sesi admin aktif
  ↓
2. Eksekusi Mutasi Basis Data:
   Baris data dihapus terlebih dahulu dari MySQL (prisma.*.delete)
  ↓
3. Koordinasi Reference-Aware Deletion (safeDeleteUnreferencedImage):
   - Ambil kunci mutex per-path: withImagePathLock(path)
   - Jalankan pemeriksaan referensi lintas tabel:
     * Hero Image: Cek HeroSlide lain dan SiteSetting (hero_bg_image, hero_card_image)
       (Proteksi mutlak: Berkas /images/* tidak boleh dihapus)
     * News Cover: Cek coverImagePath artikel lain dan pemindaian <img> pada seluruh NewsArticle.content
     * News Inline: Cek pemindaian <img> pada seluruh NewsArticle.content dan coverImagePath
     * Partner / Work: Cek duplikasi logo atau foto karya pada record lain
   ├── Jika berkas MASIH direferensikan record lain (Shared Image):
   │     ↓
   │   Pertahankan berkas fisik; JANGAN DIHAPUS
   │
   ├── Jika kueri basis data mengalami galat (Fail-Safe):
   │     ↓
   │   Kembalikan status true (dianggap masih dipakai); JANGAN DIHAPUS
   │
   └── Jika terbukti TIDAK ADA referensi lain yang menggunakan berkas tersebut:
         ↓
       Hapus berkas fisik secara aman dari public/uploads/
  ↓
4. Revalidasi Cache Publik & Dashboard (safeRevalidate)
```

---

## 7. Status & Tahapan Roadmap Proyek

- **Tahap Selesai (Completed):**
  - Phase 1–5: Prototipe landing page awal
  - Tahap 1–7: Fondasi database, autentikasi, manajemen admin, hero, visual, settings, rilis berita
  - Tahap 8.1: Audit komprehensif fondasi CMS
  - Tahap 8.2: Pengaturan website (identitas, kontak, medsos dual-handle)
  - Tahap 8.4: Manajemen Mitra Kerja & Karya Anggota (CRUD, reorder, direktori publik, infinite marquee)
  - RTE Tahap 1 / 1B: Fondasi format konten, marker versi v1:html, dan sanitizer HTML server-side
  - RTE Tahap 2A / 2B: Editor Tiptap admin, encoding marker v1, dan rendering publik aman
  - RTE Tahap 3: Node gambar inline artikel (upload terproteksi, figure/caption, ukuran responsif)
  - Fase 1–3 Media: Hardening upload terpusat, reference-aware deletion, dan Sharp decode/re-encode
  - Fase M1–M3C: Migrasi database dari SQLite ke MySQL 8.4 Docker (`inkindo_babel_db`), backup logic, dan verifikasi runtime
  - Fase 5C-1: Pola upload-on-submit terpadu untuk Mitra dan Karya Anggota
  - Fase 5C-2: Safe failed-save handling, upload receipt token, dan rollback failure receipt
  - Finalisasi Media: Standardisasi Hero, News Cover, mutex kunci per-path, dan anti-replay JTI
  - Tiptap Inline Lifecycle: Post-save inline cleanup, draft cancel rollback, proteksi shared inline, lolos 11 suite test (214/214)
- **Tahap Sengaja Ditunda (ON HOLD):**
  - **Tahap 8.3 — Manajemen Konten Beranda:** DITUNDA atas keputusan eksplisit pengguna karena kebutuhan klien terkait dinamisasi urutan seksi beranda belum jelas.
- **Tahap Belum Dikerjakan (Upcoming):**
  - **Tahap 8.5 — Manajemen Halaman Internal:** (Usulan prioritas berikutnya) Mengisi dan mengelola konten 23 sub-halaman publik yang saat ini masih menggunakan `PlaceholderLayout.tsx`.
  - **Tahap 8.6 — Manajemen Menu Navigasi Dinamis:** (Rencana masa depan) Memanfaatkan model `NavigationItem` untuk mengelola tautan menu secara dinamis dari dashboard.

---

## 8. Catatan Historis: Alur Awal Prototipe Frontend (Arsip)

*(Bagian ini dipertahankan sebagai referensi riwayat fase awal proyek)*

Pada tahap awal pembuatan prototipe, proyek berfokus murni pada keselarasan visual antarmuka terhadap tangkapan layar acuan:
- Alur awal menitikberatkan pada parsing visual 10 seksi linier dengan data statis dari `data/landing.ts`.
- Palet warna awal menggunakan Navy `#14245C` dan Orange `#FF6600`.
- Seiring evolusi proyek menjadi aplikasi resmi INKINDO BABEL, identitas visual diperbarui menjadi Engineering Slate + Burnt Amber, seksi mitra disatukan, database dimigrasikan ke MySQL 8.4 Docker, dan seluruh fondasi full-stack CMS dibangun secara bertahap hingga pengelolaan media terpadu saat ini.
