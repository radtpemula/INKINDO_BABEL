# ARCHITECTURE.md — Arsitektur Teknis & Roadmap Proyek INKINDO BABEL

## 1. Overview & Identitas Proyek

Website resmi Ikatan Nasional Konsultan Indonesia (INKINDO) Provinsi Kepulauan Bangka Belitung. Proyek ini telah berkembang dari prototipe frontend landing page menjadi aplikasi **Full-Stack Content Management System (CMS)** berbasis Next.js App Router dengan panel administrasi terproteksi dan integrasi basis data dinamis.

### Stack Teknologi Aktual
- **Framework:** Next.js `16.3.6` (App Router)
- **Library UI & Runtime:** React `19.2.8`, React DOM `19.2.8`
- **Bahasa:** TypeScript `5.x` (`strict: true`)
- **Styling:** Tailwind CSS `v4.x` via `@tailwindcss/postcss`, CSS `@theme` tokens di `app/globals.css`
- **Ikonografi:** Lucide React (`^1.48.0`)
- **Engine Build/Dev:** Webpack (`next dev --webpack` dan `next build --webpack` untuk stabilitas symlink lingkungan kerja)
- **Database Engine:** SQLite (`prisma/dev.db`) untuk lingkungan pengembangan lokal
- **ORM & Data Layer:** Prisma ORM `v6.19.3` (`@prisma/client`) dengan singleton client auto-recovery di `lib/prisma.ts`
- **Autentikasi:** Stateless JWT ditandatangani via `jose` (`^6.2.12`, algoritma HS256), disimpan pada Cookie HttpOnly (`inkindo_admin_session`, SameSite: Lax)
- **Kriptografi Password:** `bcryptjs` (`^3.0.3`, salt rounds: 12)
- **Eksekusi Script CLI:** `tsx` (`^4.23.15`) untuk inisialisasi akun administrator dan seed data

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
    karya-anggota/                           # Arsip galeri karya anggota (/berita-informasi/karya-anggota)
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
      hero/                                  # Pengaturan Hero & Slideshow (/babel-and-adt/hero)
      hero-settings/                         # Redirect page ke /babel-and-adt/hero
      news/                                  # Manajemen Berita & Publikasi (/babel-and-adt/news)
      partners/                              # Manajemen Mitra Kerja (/babel-and-adt/partners)
      member-works/                          # Manajemen Karya Anggota (/babel-and-adt/member-works)
      settings/                              # Pengaturan Website / Site Settings (/babel-and-adt/settings)
  api/admin/                                 # API Route Handlers Upload Terproteksi
    hero-upload/                             # POST /api/admin/hero-upload
    news-upload/                             # POST /api/admin/news-upload
    partner-upload/                          # POST /api/admin/partner-upload
    member-work-upload/                      # POST /api/admin/member-work-upload

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
  AdminManagementClient.tsx                  # Client UI manajemen user admin
  HeroManagementClient.tsx                   # Client UI manajemen hero slideshow & konten
  NewsManagementClient.tsx                   # Client UI manajemen artikel berita
  PartnerManagementClient.tsx                # Client UI manajemen mitra kerja
  MemberWorkManagementClient.tsx             # Client UI manajemen karya anggota
  SiteSettingsClient.tsx                     # Client UI pengaturan umum website

lib/                                         # Logika Bisnis, Autentikasi, Storage, & Server Actions
  prisma.ts                                  # Singleton PrismaClient dengan proxy pemulihan otomatis
  auth/                                      # Modul autentikasi (password, session JWT, server guards, actions)
  storage/                                   # Modul penyimpanan berkas (validasi magic bytes, safe delete)
  admin/                                     # Server Actions CRUD dashboard admin (admin, hero, news, partner, dll.)
  public/                                    # Helper query data publik sisi server dengan kaidah fallback statis

prisma/
  schema.prisma                              # Definisi skema basis data Prisma ORM
  dev.db                                     # Berkas basis data SQLite lokal (dikecualikan dari Git)

public/
  images/                                    # Aset gambar statis bawaan (logo inkindo placeholder)
  uploads/                                   # Direktori penyimpanan unggahan fisik lokal (hero, news, partners, works)

data/
  landing.ts                                 # Sumber data statis awal dan fallback publik
scripts/
  init-admin.ts                              # CLI inisialisasi akun administrator pertama (npm run admin:create)
  seed-partners-and-works.ts                 # Script seed idempoten mitra & karya (npm run db:seed:partners-works)
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
- **Text Palette:**
  - Teks Utama: `#1E293B` (Body text, judul seksi)
  - Teks Redup: `#64748B` (Keterangan, subjudul, metadata)
  - Teks Halus: `#94A3B8` (Label teknis, penanda koordinat CAD)

### Catatan Historis Warna
Palet awal prototipe (Navy `#14245C` dan Orange `#FF6600`) dari draf referensi DKI Jakarta telah sepenuhnya ditinggalkan sejak rebranding INKINDO BABEL dan pelaksanaan Redesign Tahap 5. Seluruh komponen aktif saat ini menerapkan palet Engineering Slate + Burnt Amber. Perubahan visual di masa mendatang harus terfokus dan dilarang melakukan redesign luas tanpa instruksi eksplisit pengguna.

### Layout & Responsivitas
- **Container Utama:** `max-w-[1280px] 2xl:max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8`
- **Header & Navbar:** Topbar `min-h-[34px]`, navbar utama `min-h-[88px]` hingga `94px` (condensed `70px` saat scroll). Seluruh 9 item menu tertata dalam 1 baris tanpa wrapping pada breakpoint desktop didukung (`xl` / `2xl`).
- **Hero Section:** Tinggi proporsional `~720px` desktop dengan kisi blueprint CAD SVG, coordinate crosshairs, dan watermark Pulau Bangka Belitung.
- **Prinsip Overflow:** Seluruh breakpoint (375px, 768px, 1024px, 1366px, 1440px, 1567px) wajib mempertahankan `scrollWidth <= innerWidth` (zero horizontal overflow).

---

## 4. Basis Data & Model Prisma

Basis data dikelola melalui Prisma ORM dengan SQLite pada file `prisma/dev.db`.

### Status Model Skema

| Nama Model | Status Implementasi | Deskripsi & Cakupan Data |
| :--- | :--- | :--- |
| `AdminUser` | **Aktif Digunakan** | Data kredensial administrator, role (`SUPER_ADMIN`, `ADMIN`, `EDITOR`), status aktif (`isActive`), riwayat login terakhir. |
| `SiteSetting` | **Aktif Digunakan** | Tabel key-value (48 key terdaftar) untuk identitas website, topbar, kontak, footer, 8 key media sosial (URL & label), dan 23 key pengaturan hero. |
| `HeroSlide` | **Aktif Digunakan** | Data slide gambar latar belakang hero beranda, urutan display (`order`), dan status publikasi (`isActive`). |
| `NewsArticle` | **Aktif Digunakan** | Artikel warta dan rilis berita, slug unik, kategori, ringkasan, konten, gambar sampul, status publikasi (`isPublished`), dan view counter. |
| `Partner` | **Aktif Digunakan** | Mitra strategis & afiliasi industri, singkatan, kategori, berkas logo, tautan website resmi, urutan display (`order`), status aktif (`isActive`). |
| `MemberWork` | **Aktif Digunakan** | Portofolio proyek anggota, slug unik, kategori, perusahaan, tahun, deskripsi, foto dokumentasi, status unggulan (`isFeatured`), urutan display, status aktif. |
| `NavigationItem` | **Belum Digunakan (Dead/Unused)** | Model hierarki navigasi tersimpan di `schema.prisma` tetapi belum terhubung ke kode aplikasi (navigasi masih membaca `data/landing.ts`). |
| `HomeSection` | **Belum Digunakan (Dead/Unused)** | Model pengaturan urutan/visibilitas seksi beranda tersimpan di `schema.prisma` tetapi belum terhubung ke kode aplikasi (urutan beranda statis di `app/page.tsx`). |

*Catatan: Jumlah baris data lokal dapat bertambah/berkurang selama operasional dan pengujian. Arsitektur tidak mengikat jumlah baris data lokal sebagai ketentuan permanen.*

---

## 5. Arsitektur CMS, Autentikasi, & Keamanan

### A. Autentikasi & Proteksi Dashboard
- **Alur Login:** Permintaan masuk ke `POST /babel-and-adt/login` ditangani Server Action `loginAdminAction`. Mencari user aktif berdasarkan `username` atau `email`.
- **Verifikasi Kredensial:** Password diverifikasi menggunakan `bcrypt.compare`. Sesi dibuat dalam bentuk JWT bertanda tangan (`jose` HS256) dengan masa berlaku 7 hari.
- **Penyimpanan Token:** Token disimpan pada HttpOnly Cookie bernama `inkindo_admin_session` (`path: "/"`, `sameSite: "lax"`, `secure: process.env.NODE_ENV === "production"`).
- **Proteksi Halaman:** Route Group `app/babel-and-adt/(protected)/layout.tsx` memverifikasi sesi via `getCurrentAdmin()` pada setiap navigasi server. Jika sesi tidak ada, kedaluwarsa, atau akun berstatus `isActive: false`, pengguna seketika dialihkan (HTTP 307) ke `/babel-and-adt/login`.
- **Otorisasi Khusus:** Modul Manajemen Admin (`/babel-and-adt/admin`) mewajibkan role `SUPER_ADMIN`. Admin biasa ditolak di level server. Deaktivasi akun sendiri dan akun `SUPER_ADMIN` terakhir dicegah secara ketat.

### B. Keamanan Server Actions & Revalidasi Cache
- **Otorisasi Server:** Seluruh mutasi data dilindungi oleh helper `verifyActiveAdmin()` di awal fungsi. Tidak ada mutasi yang dapat dijalankan tanpa sesi admin aktif yang sah.
- **Validasi Input:** Sanitasi teks, pembatasan panjang karakter, validasi protokol URL (hanya HTTP/HTTPS diizinkan), dan validasi integritas slug unik.
- **Pembaruan Atomik:** Operasi penyusunan urutan (*reordering*) dieksekusi dalam transaksi basis data `prisma.$transaction`.
- **Revalidasi Cache Publik:** Mutasi Server Action memanggil `revalidatePath()` secara terarah ke halaman publik dan dashboard admin terkait untuk memastikan data terbaru tampil seketika tanpa menunggu siklus build ulang.

### C. Sistem Penyimpanan Berkas & Upload Gambar
- **Endpoints Upload Terproteksi:**
  - `POST /api/admin/hero-upload` -> `public/uploads/hero/`
  - `POST /api/admin/news-upload` -> `public/uploads/news/`
  - `POST /api/admin/partner-upload` -> `public/uploads/partners/`
  - `POST /api/admin/member-work-upload` -> `public/uploads/member-works/`
- **Validasi Signature Magic Bytes:** Memeriksa byte awal biner buffer berkas asli:
  - JPEG: `0xFF 0xD8 0xFF`
  - PNG: `0x89 0x50 0x4E 0x47`
  - WebP: `0x52 0x49 0x46 0x46` (RIFF) ... `0x57 0x45 0x42 0x50` (WEBP)
  - Berkas SVG, HTML, PDF, executable, teks bertopeng ekstensi, dan berkas kosong ditolak dengan HTTP 400.
  - *Catatan Keterbatasan Teknis:* Validasi magic bytes hanya memverifikasi kecocokan header/signature biner berkas dan menolak tipe MIME palsu. Pemeriksaan ini tidak melakukan proses decoding atau parsing seluruh struktur piksel gambar (tidak mendeteksi polyglot payload tersembunyi di dalam struktur data gambar).
- **Batas Ukuran:** Maksimum 5 MB per berkas (`MAX_IMAGE_SIZE_BYTES`).
- **Penamaan Berkas Unik:** Nama asli berkas dari client dibuang. Nama dihasilkan server menggunakan pola `[prefix]-[timestamp]-[uuid].[ext]` via `crypto.randomUUID()`.
- **Penulisan Atomik:** Berkas ditulis sementara sebagai `.tmp-[filename]` kemudian di-rename ke nama target untuk mencegah berkas korup jika terjadi pemutusan proses.
- **Pembersihan Berkas Aman (Safe Image Cleanup):**
  - Path dibatasi secara ketat di dalam sub-direktori upload masing-masing dengan normalisasi path untuk mencegah serangan *path traversal*.
  - Berkas fisik lama **TIDAK AKAN** dihapus jika masih digunakan oleh record lain (*shared image protection*).
  - Berkas fisik lama **TIDAK AKAN** dihapus jika transaksi database pembaruan mengalami kegagalan (*database failure safety*).

### D. Kontrak Sumber Data & Kaidah Fallback Statis
- Server Components publik membaca data dinamis melalui modul `lib/public/*.ts`.
- **Kaidah Fallback Nol:** Data statis dari `data/landing.ts` **hanya** digunakan sebagai fallback jika total baris data pada tabel basis data bernilai 0 (`count === 0`).
- **Kaidah Isolasi Data Nonaktif:** Apabila tabel di basis data memiliki baris data tetapi seluruhnya disetel nonaktif (`isActive: false` atau `isFeatured: false`), helper mengembalikan array kosong `[]` (bukan fallback statis). Hal ini memastikan data yang sengaja dinonaktifkan oleh administrator tidak memicu kemunculan kembali data bawaan lama ke hadapan publik.

---

## 6. Detail Implementasi Tahap 8.4 (Mitra Kerja & Karya Anggota)

Tahap 8.4 telah selesai secara penuh dan lolos pengujian Final QA:

1. **Penyatuan Seksi Mitra di Beranda:**
   - Menghapus duplikasi seksi mitra kerja di beranda (sebelumnya terbagi dua: di tengah halaman dan sebelum footer).
   - Menjadi satu seksi terpadu `Partners` berlatar abu-abu `#F8FAFC` yang ditempatkan secara harmonis setelah seksi `MemberWorks` dan sebelum `Footer`.
2. **Model Basis Data & Migrasi Data Idempoten:**
   - Menambahkan model `Partner` dan `MemberWork` pada `prisma/schema.prisma`.
   - Script `scripts/seed-partners-and-works.ts` (`npm run db:seed:partners-works`) memindahkan data bawaan secara aman tanpa duplikasi.
3. **Penyimpanan & Upload Terisolasi:**
   - Endpoint upload `/api/admin/partner-upload` dan `/api/admin/member-work-upload` murni mengembalikan path relatif publik tanpa memanipulasi basis data.
4. **Server Actions CRUD & Dashboard Admin:**
   - Modul `lib/admin/partner-actions.ts` dan `lib/admin/member-work-actions.ts` menyediakan operasi CRUD lengkap.
   - Dilengkapi fungsi pengurutan atomik (`reorder`), *slug generator* dengan resolusi tabrakan (suffix `-1`, `-2`), dan retensi slug lama saat judul diupdate.
   - Halaman dashboard aktif di `/babel-and-adt/partners` dan `/babel-and-adt/member-works` dengan ikon `Briefcase` pada sidebar.
5. **Halaman Publik Direktori, Arsip, & Detail:**
   - Direktori Mitra Publik: `/mitra-kerja/terdaftar` dengan pencarian dan filter kategori.
   - Arsip Karya Anggota: `/berita-informasi/karya-anggota` dengan pencarian multi-bidang dan filter kategori.
   - Detail Karya Anggota: `/berita-informasi/karya-anggota/[slug]` dengan SEO dinamis `generateMetadata`, breadcrumbs, uraian proyek, lembar spesifikasi teknis, karya terkait, dan guard `notFound()` (HTTP 404).
6. **Perbaikan Skala Logo Mitra:**
   - Mengganti kontainer logo lama (44×44px) menjadi area fleksibel hingga `160×100px` berlatar `#F8FAFC`. Logo landscape tampil proporsional tanpa distorsi aspek rasio.
7. **Infinite Marquee Auto-Carousel:**
   - Komponen `components/Partners.tsx` menerapkan carousel horizontal kontinu dual-track otomatis menggunakan animasi GPU-accelerated `@keyframes marquee-scroll`.
   - Sekitar 4 kartu terlihat bersamaan pada layar desktop, 2 kartu pada tablet, dan 1 kartu pada mobile.
   - Animasi otomatis berhenti sementara saat kursor mouse berada di atas seksi (*pause on hover*) atau saat elemen menerima fokus keyboard (*pause on focus*).
   - Track duplikat dilengkapi `aria-hidden="true"` dan `tabIndex={-1}` untuk mencegah tab-stop ganda bagi pembaca layar (screen reader).
   - Dilengkapi dukungan aksesibilitas `prefers-reduced-motion: reduce` yang mematikan animasi otomatis dan beralih ke container scroll horizontal manual.
   - Dilengkapi tautan penjelajahan direktori lengkap ke `/mitra-kerja/terdaftar`.

---

## 7. Roadmap Pengembangan Proyek

Kronologi pengembangan proyek disusun berdasarkan fitur yang dapat diverifikasi pada basis kode:

| No. Tahap | Nama & Deskripsi Tahap | Status Aktual | Keterangan & Bukti Verifikasi |
| :--- | :--- | :--- | :--- |
| **Phase 1–5** | Prototipe Landing Page Frontend (10 seksi berbasis referensi) | **SELESAI** | Selesai pada awal pengembangan; seluruh seksi dasar terbangun. |
| **Tahap 1** | Fondasi Database & ORM (Prisma, SQLite `dev.db`, Singleton) | **SELESAI** | Model skema dasar disiapkan di `prisma/schema.prisma`. |
| **Tahap 2** | Autentikasi Admin & Sesi (JWT, bcrypt, CLI init, login page) | **SELESAI** | `lib/auth/*`, `app/babel-and-adt/login/`, layout guard server. |
| **Tahap 3** | Manajemen Admin (`/babel-and-adt/admin`, proteksi `SUPER_ADMIN`) | **SELESAI** | `lib/admin/actions.ts`, dashboard admin management aktif. |
| **Tahap 4** | Hero Slideshow (Model `HeroSlide`, Upload API, Dashboard, Integrasi Publik) | **SELESAI** | `prisma.heroSlide`, rotasi gambar latar belakang hero. |
| **Tahap 5** | Redesign Visual Slate/Amber & CAD Blueprint SVG | **SELESAI** | Palet Engineering Slate + Burnt Amber diterapkan menyeluruh. |
| **Tahap 6** | Pengaturan Hero Terpadu (Background, Teks Utama, 11 Kartu, Gambar Kartu) | **SELESAI** | Disatukan di `/babel-and-adt/hero`, 23 key `SiteSetting`. |
| **Tahap 7** | Manajemen Berita (Model `NewsArticle`, Upload API, CRUD, Dashboard, Detail Slug) | **SELESAI** | `/babel-and-adt/news`, `/berita-informasi/rilis-berita`, `/[slug]`. |
| **Tahap 8.1** | Audit Fondasi CMS & Analisis Roadmap Lanjutan | **SELESAI** | Audit menyeluruh terhadap skema, route, dan konten hardcoded. |
| **Tahap 8.2** | Pengaturan Website (Identitas, Kontak, Topbar, Footer, Media Sosial dual-handle) | **SELESAI** | `/babel-and-adt/settings`, 25 key `SiteSetting`, footer links. |
| **Tahap 8.3** | Manajemen Konten Beranda (Dinamisasi urutan/visibilitas seksi via `HomeSection`) | **DITUNDA (ON HOLD)** | **Keputusan eksplisit pengguna:** Kebutuhan klien belum jelas; urutan seksi beranda saat ini dipertahankan statis. |
| **Tahap 8.4** | Manajemen Mitra Kerja & Karya Anggota (Database, Upload, CRUD, Publik, Marquee) | **SELESAI** | Sub-tahap 8.4.1 s.d. 8.4.5 selesai penuh, lolos Final QA, commit `ab973f7`. |
| **Tahap 8.5** | Manajemen Halaman Internal / Halaman Statis Organisasi | **USULAN (BELUM DIKERJAKAN)** | Usulan tahap berikutnya untuk mengisi 23 sub-halaman publik yang saat ini masih berstatus `PlaceholderLayout.tsx`. |
| **Tahap 8.6** | Manajemen Menu Navigasi Dinamis via `NavigationItem` | **RENCANA (BELUM DIKERJAKAN)** | Rencana masa depan untuk mendinamisasi menu navbar/footer dari basis data. |

---

## 8. Deployment, Data Lokal, & Batasan Operasional

1. **Isolasi Lingkungan Lokal:**
   - Basis data SQLite lokal (`prisma/dev.db`) dan berkas cadangan (`*.db.bak`) sengaja **dikecualikan** dari repositori Git melalui `.gitignore`.
   - Seluruh berkas upload fisik pada `public/uploads/` tidak tersimpan di repositori Git (hanya berkas `.gitkeep` yang ter-track).
   - Pengujian atau build sukses pada lingkungan lokal **tidak berarti** sistem otomatis siap pakai di server produksi (*production-ready*).
2. **Strategi Produksi:**
   - Pada deployment serverless (seperti Vercel), direktori `public/uploads/` bersifat read-only/ephemeral. Produksi memerlukan integrasi Object Storage eksternal (Cloudflare R2, S3, atau Supabase Storage) dan migrasi basis data ke PostgreSQL.
3. **Kaidah Sinkronisasi Skema:**
   - Proyek saat ini menggunakan sinkronisasi skema via `npx prisma db push` dan generator client `npx prisma generate`.
   - Dilarang keras menjalankan `npx prisma migrate reset` atau perintah destruktif yang menghapus data SQLite lokal.
   - Migrasi baseline Prisma formal (`prisma migrate diff` + `resolve --applied`) memerlukan perencanaan dan persetujuan khusus sebelum diterapkan.
