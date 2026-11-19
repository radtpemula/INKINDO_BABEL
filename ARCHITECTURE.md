# ARCHITECTURE.md — Arsitektur Teknis & Roadmap Proyek INKINDO BABEL

## 1. Overview & Status Proyek

Website resmi Ikatan Nasional Konsultan Indonesia (INKINDO) Provinsi Kepulauan Bangka Belitung.
- **Status Proyek:** **Prototype / Development Lokal (Belum Production)**.
- **Karakteristik:** Aplikasi **Full-Stack Content Management System (CMS)** berbasis Next.js App Router dengan panel administrasi terproteksi, basis data relasional aktif, dan sistem penanganan media terstandarisasi.

### Stack Teknologi Aktual
- **Framework:** Next.js `16.3.6` (App Router)
- **Library UI & Runtime:** React `19.2.8`, React DOM `19.2.8`
- **Bahasa:** TypeScript `5.x` (`strict: true`, no `any`, no `@ts-ignore`)
- **Styling:** Tailwind CSS `v4.x` via `@tailwindcss/postcss`, CSS `@theme` tokens di `app/globals.css`
- **Ikonografi:** Lucide React (`^1.48.0`)
- **Engine Build/Dev:** Webpack (`next dev --webpack` dan `next build --webpack` untuk stabilitas symlink lingkungan kerja)
- **Database Engine Aktif:** **MySQL 8.4 Docker** (`mysql:8.4.8` via container `inkindo-babel-mysql` pada port `127.0.0.1:3306`, basis data `inkindo_babel_db`)
- **Arsip Basis Data:** SQLite (`prisma/dev.db` dan direktori `~/Documents/inkindo_sqlite_backups/`) berstatus **arsip historis** hasil migrasi M1–M3C
- **ORM & Data Layer:** Prisma ORM `v6.19.3` (`@prisma/client`) dengan koneksi pool dan singleton client di `lib/prisma.ts`
- **Pemrosesan Gambar:** **Sharp** (`0.35.5`, libvips `8.18.7`) untuk validasi dimensi, auto-orientasi EXIF, pembersihan metadata sensitif, dan re-encode terpadu (JPEG/PNG/WebP)
- **Rich Text Editor:** Tiptap `v3.32.2` (`@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-image`) dengan kustomisasi sanitasi HTML server-side (`sanitize-html` `2.18.1`)
- **Autentikasi Admin:** Stateless JWT via `jose` (`^6.2.12`, HS256), disimpan pada Cookie HttpOnly (`inkindo_admin_session`, SameSite: Lax)
- **Kriptografi Password:** `bcryptjs` (`^3.0.3`, salt rounds: 12)
- **Kriptografi Receipt:** HMAC-SHA256 (`jose`) dengan kunci domain terpisah untuk upload receipt dan failure receipt
- **Eksekusi Script CLI:** `tsx` (`^4.23.15`) untuk inisialisasi administrator dan penjalur pengujian mandiri

---

## 2. Struktur Direktori & Tanggung Jawab Modul

```text
app/
  page.tsx                                   # Homepage publik (Server Component dinamis force-dynamic)
  layout.tsx                                 # Root layout publik (metadata, font, viewport)
  globals.css                                # Tailwind theme tokens, keyframe marquee, CSS global
  login/                                     # Halaman login portal anggota publik (/login)
  berita-informasi/
    rilis-berita/                            # Arsip berita publik (/berita-informasi/rilis-berita)
      [slug]/                                # Detail berita publik dinamis (/berita-informasi/rilis-berita/[slug])
    karya-anggota/                           # Arsip galeri portofolio anggota (/berita-informasi/karya-anggota)
      [slug]/                                # Detail karya anggota dinamis (/berita-informasi/karya-anggota/[slug])
    ...                                      # Sub-halaman publik lainnya (dibungkus PlaceholderLayout)
  mitra-kerja/
    terdaftar/                               # Direktori mitra kerja publik (/mitra-kerja/terdaftar)
    ...                                      # Sub-halaman mitra lainnya
  babel-and-adt/                             # Panel Administrasi Terproteksi (CMS)
    layout.tsx                               # Passthrough layout admin root
    login/                                   # Halaman login administrator (/babel-and-adt/login)
    (protected)/                             # Route Group khusus admin terotentikasi
      layout.tsx                             # Auth guard layout (getCurrentAdmin -> redirect login)
      page.tsx                               # Ringkasan dashboard (/babel-and-adt)
      admin/                                 # Manajemen Admin (/babel-and-adt/admin, khusus SUPER_ADMIN)
      hero/                                  # Pengaturan Hero, Background, & Kartu (/babel-and-adt/hero)
      hero-settings/                         # Redirect page ke /babel-and-adt/hero
      news/                                  # Manajemen Berita & Publikasi (/babel-and-adt/news)
      partners/                              # Manajemen Mitra Kerja (/babel-and-adt/partners)
      member-works/                          # Manajemen Karya Anggota (/babel-and-adt/member-works)
      settings/                              # Pengaturan Website / Site Settings (/babel-and-adt/settings)
  api/admin/                                 # API Route Handlers Upload Terproteksi
    hero-upload/                             # POST /api/admin/hero-upload (terbit token "hero")
    news-upload/                             # POST /api/admin/news-upload (sampul, terbit token "news-cover")
    news-inline-upload/                      # POST /api/admin/news-inline-upload (inline, terbit token "news-inline")
    partner-upload/                          # POST /api/admin/partner-upload (terbit token "partners")
    member-work-upload/                      # POST /api/admin/member-work-upload (terbit token "member-works")

components/                                  # Komponen UI Halaman Publik
  Header.tsx                                 # Navbar sticky, topbar, logo, menu dropdown, mobile drawer
  Hero.tsx                                   # Banner hero, blueprint CAD, background slideshow, CTAs
  StatisticsSection.tsx                      # 4 kartu metrik statistik organisasi dengan count-up
  MembershipSteps.tsx                        # 4 langkah registrasi anggota
  AboutSection.tsx                           # Profil organisasi, visi & misi, kartu kredensial
  RenewalSteps.tsx                           # 4 langkah perpanjangan keanggotaan
  NewsSection.tsx                            # Seksi warta & berita publik di beranda
  SbuRegistration.tsx                        # 4 langkah pendaftaran sertifikasi SBU
  MemberWorks.tsx                            # Etalase portofolio karya unggulan anggota di beranda
  Partners.tsx                               # Seksi tunggal mitra strategis dengan infinite marquee carousel
  Footer.tsx                                 # Footer institucional, kontak, alamat, tautan media sosial
  PlaceholderLayout.tsx                      # Layout pembungkus sub-halaman publik non-aktif
  PartnerDirectoryClient.tsx                 # Client component direktori mitra publik (filter/search)
  MemberWorkArchiveClient.tsx                # Client component arsip karya publik (filter/search)

components/admin/                            # Komponen Modular Panel Administrasi
  AdminDashboardShell.tsx                    # Shell pembungkus tata letak admin
  AdminSidebar.tsx                           # Navigasi sidebar admin responsif (desktop & mobile drawer)
  AdminHeader.tsx                            # Bar navigasi atas admin (breadcrumb, profile, shortcut)
  AdminMainContent.tsx                       # Pembungkus area konten admin
  AdminUserBadge.tsx                         # Avatar & badge role admin
  AdminLogoutButton.tsx                      # Tombol logout admin via Server Action
  AdminIcon.tsx                              # Pemetaan ikon Lucide khusus modul admin
  types.ts                                   # Tipe TypeScript navigasi & role dashboard admin
  deferred-image-upload.ts                   # Logika murni upload-on-submit terpadu, guard submit, & upload fetcher
  use-deferred-image-upload.ts               # Hook React upload-on-submit dengan siklus revoke Object URL
  pending-upload-cleanup.ts                  # Pelacak status pending upload, transisi state, & trigger rollback aman
  AdminManagementClient.tsx                  # Client UI manajemen user admin
  HeroManagementClient.tsx                   # Client UI manajemen hero slideshow, background, & kartu
  NewsManagementClient.tsx                   # Client UI manajemen artikel berita & orkestrasi inline upload
  RichTextEditor.tsx                         # Editor Tiptap artikel (toolbar, link, gambar inline, sanitasi)
  article-image-extension.ts                 # Node Tiptap articleImage (figure, img, figcaption, alt, size, align)
  PartnerManagementClient.tsx                # Client UI manajemen mitra kerja (upload-on-submit & rollback)
  MemberWorkManagementClient.tsx             # Client UI manajemen karya anggota (upload-on-submit & rollback)
  SiteSettingsClient.tsx                     # Client UI pengaturan umum website (teks & medsos)

lib/                                         # Logika Bisnis, Autentikasi, Storage, & Server Actions
  prisma.ts                                  # Singleton PrismaClient MySQL
  auth/                                      # Modul autentikasi (password, session JWT, server guards, actions)
  storage/                                   # Modul penyimpanan berkas fisik & Sharp pipeline
    image-processor.ts                       # Pipeline Sharp: decode, dimension limit, rotate, strip EXIF, re-encode
    image-validation.ts                      # Validasi buffer terpusat (magic bytes, size <= 5 MB, format JPEG/PNG/WebP)
    upload-image.ts                          # Simpan/hapus direktori umum (partners, member-works)
    hero.ts                                  # Helper penyimpanan & penghapusan berkas hero
    news.ts                                  # Helper penyimpanan & penghapusan berkas sampul & inline berita
  security/                                  # Keamanan konten, referensi, & koordinasi upload
    content-format.ts                        # Deteksi format konten & penanda resmi (<!--inkindo-content:v1:html-->)
    content-sanitizer.ts                     # Sanitizer HTML sisi server (whitelist tag/attr/class Tailwind)
    image-path.ts                            # Validasi jalur gambar ketat per modul (anti-traversal, no nested subpaths)
    image-reference.ts                       # Reference-Aware Checker (is*ImageReferenced) lintas tabel & parsing HTML
    upload-receipt.ts                        # Token kepemilikan upload & failure receipt berbasis HMAC-SHA256
    upload-coordinator.ts                    # Mutex per-path (withImagePathLock), anti-replay JTI, tombstones
    rate-limit.ts                            # In-memory rate limiter per IP/admin
  admin/                                     # Server Actions CRUD dashboard admin
    action-upload-guard.ts                   # Wrapper runLockedUploadCommit & safeDeleteUnreferencedImage
    upload-rollback-core.ts                  # Logika verifikasi 6 lapis pembatalan unggahan gagal
    upload-rollback-action.ts                # Server Action rollback pending upload umum
    news-inline-cleanup.ts                   # Logika post-save inline cleanup & rollback draft inline
    news-inline-action.ts                    # Server Action pembatalan draft gambar inline Tiptap
    news-actions.ts                          # Server Actions CRUD berita & orkestrasi pembersihan inline
    hero-actions.ts                          # Server Actions CRUD hero slide
    hero-settings-actions.ts                 # Server Actions pengaturan background hero & kartu
    partner-actions.ts                       # Server Actions CRUD mitra kerja
    member-work-actions.ts                   # Server Actions CRUD karya anggota
    settings-actions.ts                      # Server Actions pengaturan website
  public/                                    # Helper query data publik sisi server dengan kaidah fallback statis

prisma/
  schema.prisma                              # Definisi skema basis data aktif (MySQL provider)
  schema.sqlite.prisma                       # Salinan arsip skema SQLite
  dev.db                                     # Berkas basis data SQLite lokal (arsip historis)

public/
  images/                                    # Aset gambar statis bawaan (logo inkindo placeholder)
  uploads/                                   # Direktori penyimpanan fisik lokal (hero, news, partners, member-works)
```

---

## 3. Sistem Desain Visual (Design System)

Proyek ini menggunakan bahasa visual formal, presisi, dan institusional bertema **Engineering Slate + Burnt Amber**.

### Palet Warna Aktif
- **Primary Dark Slate:** `#0F172A` (Latar header topbar, hero overlay, footer, kontainer gelap)
- **Primary Slate Surface:** `#1E293B` (Warna kartu skematik, teks utama gelap, border pekat)
- **Muted Slate:** `#334155` (Elemen garis teknis, border kontainer sekunder)
- **Accent Color:** `#D97706` (*Burnt Amber* — Tombol CTA registrasi, highlight teks, hover state, ikon aktif)
- **Accent Hover:** `#B45309` (State interaksi tombol aksen aktif)
- **Light Surface:** `#FFFFFF` (Latar kartu putih, kontras teks pada kontainer gelap)
- **Subtle Surface:** `#F8FAFC` (Latar seksi selang-seling, latar kartu mitra & placeholder)
- **Border Neutral:** `#E2E8F0` (Garis pemisah halus, border kartu standar)

---

## 4. Basis Data Aktif (MySQL 8.4 Docker) & Skema Prisma

Aplikasi menggunakan **MySQL 8.4 Docker** (`inkindo-babel-mysql`) pada port `127.0.0.1:3306` sebagai database aktif utama. Seluruh pembacaan dan penulisan CMS beroperasi pada database `inkindo_babel_db`.

### Karakteristik Tipe Native MySQL
- `NewsArticle.content`: `@db.MediumText` (menampung hingga 16 MB markup HTML v1 Tiptap dan figure inline).
- `SiteSetting.value`: `@db.MediumText` (menampung hingga 16 MB data konfigurasi teks dan JSON).
- Multi-sentence text (`excerpt`, `description`, `customData`): `@db.Text` (hingga 64 KB).
- Primary key CUID (`id`) dan kunci unik (`slug`, `key`, `email`): `@db.VarChar(191)` (aman untuk batas indeks unik UTF-8).
- `passwordHash`: `@db.VarChar(255)`.
- Collation: `utf8mb4_0900_ai_ci` (case-insensitive username/email matching dan dukungan karakter luas).

### Status Model Skema
| Nama Model | Status Implementasi | Deskripsi & Cakupan Data |
| :--- | :--- | :--- |
| `AdminUser` | **Aktif Digunakan** | Kredensial administrator, role (`SUPER_ADMIN`, `ADMIN`), status aktif (`isActive`), riwayat login. |
| `SiteSetting` | **Aktif Digunakan** | Konfigurasi website (48 key terdaftar: identitas, kontak, medsos, background hero, kartu hero). |
| `HeroSlide` | **Aktif Digunakan** | Slide rotasi hero beranda, urutan (`order`), status (`isActive`), tautan gambar latar. |
| `NewsArticle` | **Aktif Digunakan** | Artikel berita publik, slug, kategori, ringkasan, konten HTML v1, gambar sampul, status publikasi. |
| `Partner` | **Aktif Digunakan** | Direktori mitra resmi, kategori, logo, tautan website, urutan, status aktif. |
| `MemberWork` | **Aktif Digunakan** | Portofolio karya anggota, slug, perusahaan, foto dokumentasi, status unggulan (`isFeatured`), urutan. |
| `NavigationItem` | **Belum Digunakan (Arsip/Dead)** | Model hierarki navigasi di skema, saat ini navigasi masih membaca `data/landing.ts`. |
| `HomeSection` | **Belum Digunakan (Arsip/Dead)** | Model urutan seksi beranda di skema, saat ini beranda dipertahankan statis di `app/page.tsx`. |

---

## 5. Arsitektur Unggahan Gambar, Keamanan, & Siklus Hidup Media

### A. Pola Upload-on-Submit Terpadu
Untuk mencegah timbulnya file sampah (orphan) saat pemilihan berkas atau pembatalan dialog:
1. **Penyimpanan Lokal Sisi Client:** Ketika administrator memilih gambar pada modal (Mitra, Karya Anggota, Hero Slide, Hero Card, Hero Background, atau Sampul Berita), berkas disimpan sementara di state `selectedFile: File` lokal.
2. **Preview Berbasis Object URL:** Pratinjau langsung dibuat via `URL.createObjectURL(file)`. Siklus hidup object URL dikelola secara ketat (`URL.revokeObjectURL`) saat penggantian file, penghapusan, pembatalan form, submit berhasil, atau unmount komponen (`useDeferredImageUpload`).
3. **Unggah Hanya Saat Submit:** Berkas fisik HANYA diunggah ke server (`/api/admin/*-upload`) setelah administrator menekan tombol "Simpan" dan seluruh validasi form lokal lolos.
4. **Retry Tanpa Unggah Ulang:** Jika penyimpanan database gagal (misal validasi slug duplikat), path gambar yang sudah terunggah dipromosikan ke form state, sehingga penekanan tombol "Simpan" ulang langsung mengeksekusi Server Action tanpa mengunggah ulang file baru.

### B. Pipeline Pemrosesan Gambar (Sharp & Magic Bytes)
Seluruh 5 endpoint upload (`hero-upload`, `news-upload`, `news-inline-upload`, `partner-upload`, `member-work-upload`) melalui pipeline keamanan terpadu di `lib/storage/image-processor.ts`:
1. **Validasi Buffer Awal:** Memeriksa buffer tidak kosong, batas ukuran <= 5 MB (`MAX_IMAGE_SIZE_BYTES`), dan verifikasi signature magic bytes asli (JPEG `0xFF 0xD8 0xFF`, PNG signature 8 byte, WebP `RIFF` + `WEBP`). Menolak SVG, HTML, PDF, script, dan berkas palsu.
2. **Pemeriksaan Animasi:** WebP multi-frame atau animasi ditolak eksplisit untuk efisiensi dan keamanan.
3. **Sharp Decode & Resource Limit:** Memproses buffer melalui Sharp dengan batasan `limitInputPixels: 33.554.432` (32 MP), `MAX_IMAGE_WIDTH = 8192`, `MAX_IMAGE_HEIGHT = 8192`. Berkas gambar rusak atau polyglot payload ditolak saat decode.
4. **Auto-Orientasi & Stripping Metadata:** Gambar dirotasi otomatis sesuai orientasi visual kamera via `.rotate()`, dan seluruh metadata sensitif (EXIF, koordinat GPS kamera, perangkat lunak) dibersihkan sepenuhnya demi privasi.
5. **Re-Encoding Terstandarisasi:**
   - JPEG: Dikonversi via mozjpeg kualitas 85.
   - PNG: Kompresi level 9, alpha channel transparansi dipertahankan utuh.
   - WebP: Kualitas 85, alpha channel transparansi dipertahankan utuh.
6. **Penulisan Atomik:** Ditulis ke berkas sementara `.tmp-[filename]` lalu di-rename ke nama target `[prefix]-[timestamp]-[uuid].[ext]` untuk mencegah berkas terpotong akibat kegagalan proses.

### C. Sistem Token Kepemilikan & Rollback Terverifikasi
Untuk mencegah manipulasi penghapusan file oleh client yang tidak berhak:
1. **Upload Receipt Token (`uploadToken`):** Setiap keberhasilan upload (HTTP 201) menerbitkan token bertanda tangan HMAC-SHA256 yang mengikat identitas admin (`adminId`), modul tujuan (`module`), dan path berkas (`publicPath`) dengan masa berlaku 15 menit (900 detik).
2. **Server-Attested Failure Token (`rollbackToken`):** Client dilarang mengklaim kegagalan sepihak. Server Action yang mengalami kegagalan sebelum commit basis data menerbitkan `rollbackToken` resmi bertanda tangan server.
3. **Rollback Bersyarat:** Pembatalan berkas fisik (`rollbackPendingUploadAction` / `rollbackDraftInlineUploadsAction`) mewajibkan kombinasi `uploadToken` + `rollbackToken` sah, lolos pengecekan admin aktif, lolos single-use anti-replay JTI (`consumeReceiptJti`), tidak sedang berstatus `recentlyCommitted`, dan lolos verifikasi referensi basis data (`is*ImageReferenced`).

### D. Reference-Aware Image Deletion Lintas Modul
Sebelum berkas fisik dihapus pada operasi update atau delete, fungsi verifikasi memeriksa ketiadaan referensi aktif:
- **Hero Image (`isHeroImageReferenced`):** Memeriksa seluruh baris `HeroSlide` dan tabel `SiteSetting` (termasuk `hero_bg_image` dan `hero_card_image`). Seluruh berkas bawaan `/images/*` dilindungi secara mutlak agar tidak pernah terhapus.
- **News Cover (`isNewsCoverImageReferenced`):** Memeriksa kolom `coverImagePath` pada artikel lain DAN memindai seluruh tag `<img>` di dalam teks naskah HTML (`content`) semua artikel via `htmlparser2`.
- **News Inline (`isNewsInlineImageReferenced`):** Memindai tag `<img>` pada seluruh kolom `content` dan `coverImagePath` artikel berita.
- **Partner & Member Work (`isPartnerLogoReferenced`, `isMemberWorkImageReferenced`):** Memeriksa keunikan penggunaan logo dan foto portofolio.
- **Fail-Safe Principle:** Jika kueri basis data mengalami galat atau path tidak valid, helper mengembalikan nilai `true` (dianggap masih dipakai), sehingga berkas fisik **TIDAK AKAN DIHAPUS**.

### E. Siklus Hidup & Pembersihan Gambar Inline Tiptap
1. **Saat Penyisipan (Insert):** Gambar inline diunggah ke `/api/admin/news-inline-upload`, server menerbitkan `uploadToken` bertanda `news-inline`, dan node `<figure><img><figcaption>` disisipkan ke editor.
2. **Saat Node Dibuang di Editor:** File fisik **TIDAK LANGSUNG DIHAPUS**. Ini melindungi operasi Undo (`Ctrl+Z`), Redo, dan pengeditan teks.
3. **Pembersihan Pasca-Simpan (Post-Save Cleanup):** Ketika artikel berhasil disimpan, helper `cleanupUnusedInlineImagesPostSave` membandingkan daftar gambar naskah lama dengan naskah baru, serta memeriksa gambar sesi yang tidak dimasukkan ke naskah final. Gambar yang tidak lagi digunakan dan bebas dari referensi artikel lain otomatis dihapus aman.
4. **Pembatalan Draft (Cancel / Modal Close):** Jika administrator membatalkan penulisan draft, `rollbackDraftInlineUploadsAction` membersihkan gambar sesi yang belum terikat ke database, dengan syarat memiliki token kepemilikan yang sah dan lolos verifikasi referensi.
5. **Penghapusan Artikel (Delete Article):** Saat artikel berita dihapus, `cleanupArticleInlineImagesOnDelete` mengekstrak seluruh gambar inline di dalamnya dan menghapus berkas fisik yang tidak dipakai oleh artikel berita lain.
6. **Proteksi Status Tidak Pasti (*Unknown Outcome*):** Jika operasi simpan mengalami kegagalan tak terduga (*timeout* jaringan atau database crash), status dikunci menjadi `unknown`. Berkas fisik TIDAK diizinkan dihapus oleh client dan dicatat sebagai `[orphan-candidate]` non-destruktif.

### F. Keterbatasan Koordinasi In-Memory Single-Instance & Residu Orphan
- **In-Memory Mutex & JTI:** Koordinasi kunci per-path (`withImagePathLock`), pencatatan single-use JTI (`consumeReceiptJti`), dan pelacak commit tombstone (`markPathCommitted`) diimplementasikan menggunakan `Map` in-memory pada satu proses Node.js.
- **Keterbatasan Multi-Instance:** Pada lingkungan multi-server atau serverless masa depan, koordinasi ini tidak terdistribusi secara lintas proses. Migrasi ke backend terdistribusi (seperti Redis) akan diperlukan saat naik ke tahap produksi berskala besar.
- **Residu Orphan yang Dipertahankan:**
  - 5 kandidat orphan historis (hasil audit Fase 4–5A: 2 dummy WebP dev, 2 background hero lama, 1 inline Tiptap lama) sengaja dipertahankan di `public/uploads/` demi mematuhi aturan pelestarian berkas fisik pengguna.
  - Gambar dari transaksi yang berstatus *unknown/timeout* tetap dipertahankan untuk mencegah insiden hilangnya data aktif pengguna.

---

## 6. Roadmap Pengembangan Proyek

| No. Tahap | Nama & Deskripsi Fitur | Status Aktual | Keterangan & Bukti Verifikasi |
| :--- | :--- | :--- | :--- |
| **Phase 1–5** | Prototipe Landing Page Frontend | **SELESAI** | Selesai pada awal pengembangan; seluruh seksi dasar terbangun. |
| **Tahap 1–7** | Fondasi Database, Auth, Admin, Hero, Visual, Settings, Berita | **SELESAI** | `/babel-and-adt/*`, CRUD, proteksi role, layout guard server. |
| **Tahap 8.1** | Audit Fondasi CMS | **SELESAI** | Audit menyeluruh terhadap skema, route, dan konten hardcoded. |
| **Tahap 8.2** | Pengaturan Website | **SELESAI** | `/babel-and-adt/settings`, identitas, kontak, medsos dual-handle. |
| **Tahap 8.3** | Manajemen Konten Beranda (`HomeSection`) | **DITUNDA (ON HOLD)** | **Keputusan eksplisit pengguna:** Dinamisasi seksi beranda ditunda; beranda dipertahankan statis. |
| **Tahap 8.4** | Manajemen Mitra Kerja & Karya Anggota | **SELESAI** | CRUD, pengurutan atomik, direktori publik, dan infinite marquee carousel. |
| **RTE 1–3** | Rich Text Editor Tiptap & Format Keamanan Konten | **SELESAI** | `content-format`, `content-sanitizer`, `RichTextEditor.tsx`, gambar inline. |
| **Fase 1–3 Media** | Hardening Upload, Reference Deletion, & Sharp Pipeline | **SELESAI** | Validasi buffer, Sharp decode/re-encode, EXIF strip, Reference-Aware Deletion. |
| **Fase M1–M3C** | Migrasi Database ke MySQL 8.4 Docker & Backup Safety | **SELESAI** | Database aktif beralih 100% ke MySQL 8.4 Docker (`inkindo_babel_db`); verifikasi runtime sukses. |
| **Fase 5C-1** | Pola Upload-on-Submit Mitra & Karya Anggota | **SELESAI** | Deferred image upload hook, siklus object URL, double-submit guard. |
| **Fase 5C-2** | Safe Failed-Save Handling & Upload Ownership Receipt | **SELESAI** | Token kepemilikan upload, failure receipt, sticky unknown, dan safe rollback. |
| **Finalisasi Media**| Standardisasi Hero, News Cover, & Upload Coordinator | **SELESAI** | Pembersihan hero background, per-path lock mutex, anti-replay JTI, rate limit. |
| **Tiptap Inline Fix**| Pengelolaan Lengkap Siklus Hidup Gambar Inline Tiptap | **SELESAI** | Post-save cleanup, draft cancel rollback, proteksi shared image, 11 suite test lulus (214/214). |
| **Tahap 8.5** | Manajemen Halaman Internal / Halaman Statis | **USULAN (BELUM DIKERJAKAN)** | Mengisi 23 sub-halaman publik yang saat ini masih berstatus `PlaceholderLayout.tsx`. |
| **Tahap 8.6** | Manajemen Menu Navigasi Dinamis (`NavigationItem`) | **RENCANA (BELUM DIKERJAKAN)** | Mendinamisasi menu navigasi dari basis data. |