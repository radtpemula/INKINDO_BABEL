# ARCHITECTURE.md

## Overview
The landing page should be component-based, responsive, and easy to maintain.

Suggested structure:

```text
app/
  page.tsx
  globals.css

components/
  Header.tsx
  Hero.tsx
  MembershipSteps.tsx
  AboutSection.tsx
  RenewalSteps.tsx
  Partners.tsx
  NewsSection.tsx
  SbuRegistration.tsx
  MemberWorks.tsx
  Footer.tsx

data/
  landing.ts

public/
  images/
```

Adapt this structure to the existing project rather than forcing a new architecture.

## Component Responsibilities

### Header
Navigation, logo, primary navigation links, and mobile menu.

### Hero
Large visual/banner area, headline, CTA, and any secondary navigation/search element visible in the reference.

### MembershipSteps
Reusable four-step process:
- Registrasi
- Terima Notifikasi
- Pembayaran
- Berhasil

### AboutSection
Organization description, Vision, Mission, and supporting illustration.

### RenewalSteps
Four-step membership renewal process:
- Login
- Edit Data
- Pembayaran
- Berhasil

### Partners
Reusable partner/sponsor logo grid.

### NewsSection
Three-column desktop news cards containing date, image, category/title, description, and metadata.

### SbuRegistration
Four-step SBU registration process:
- Anggota INKINDO BABEL
- Pengisian Formulir Online
- Pembayaran
- Berhasil

### MemberWorks
Member work/article gallery.

### Footer
Dark navy footer with organization information, contact details, social links, and copyright.

## Data-Driven Content
Repeated content should come from arrays/objects instead of duplicated JSX.

Example:

```ts
export const registrationSteps = [
  {
    title: "Registrasi",
    description: "...",
    icon: "..."
  },
  // ...
];
```

Keep content separate from presentation where practical.

## Responsive Layout
Desktop:
- Full-width hero
- Horizontal process steps
- Two-column About section
- Three-column news
- Multi-column member works

Tablet:
- Reduce container width and spacing
- Allow grids to wrap

Mobile:
- Collapsible navigation
- Single-column content where appropriate
- Process steps stack or use a compact two-column grid
- News and member works become single-column
- Partner logos wrap cleanly
- Footer stacks vertically

## Styling Principles
- Use a centered max-width container around 1100–1200px.
- Use generous section spacing.
- Alternate white and light-gray sections as shown in the reference.
- Navy is the primary structural color.
- Orange is used mainly for accents, icons, and CTAs.
- Avoid excessive rounded cards when the reference uses flatter sections.
- Preserve whitespace and visual hierarchy.

## Reusability
If multiple sections use the same visual process-step pattern, create a reusable component rather than duplicating markup.

If multiple sections use the same card pattern, create a reusable card component where it improves consistency without over-engineering.

## Accessibility
- Semantic headings in correct order.
- Meaningful alt text.
- Keyboard-accessible controls.
- Visible focus states.
- Sufficient color contrast.
- Mobile menu must be keyboard usable.

## Database & Backend Architecture (Admin Foundation)

### Database Engine & ORM
- **Engine:** SQLite (`dev.db`) untuk pengembangan lokal, tanpa keterikatan fitur vendor unik agar mudah dimigrasikan ke PostgreSQL di masa depan.
- **ORM:** Prisma ORM `v6.19.3` dengan generator client standar `@prisma/client`.
- **Runtime:** Node.js runtime terisolasi pada Server Components & Server Actions.
- **Client Singleton:** `lib/prisma.ts` mencegah kebocoran connection pool saat fast-refresh development.

### Core Models (Minimal Foundation)
1. `AdminUser`: Identitas pengelola, role, dan hash kredensial (tanpa password hardcoded).
2. `SiteSetting`: Pengaturan key-value terkelola untuk logo, kontak, jam kerja, dan footer.
3. `NavigationItem`: Hierarki menu dan submenu (self-relation parent/child) dengan sortOrder dan icon name.
4. `HomeSection`: Kontrol urutan dan visibilitas section beranda.
5. `HeroSlide`: Data slide gambar, judul, deskripsi, tautan, urutan display, dan status aktif untuk banner hero slideshow.
6. `NewsArticle`: Data artikel berita dan publikasi (judul, slug unik, kategori, ringkasan, konten, gambar sampul, penulis, estimasi waktu baca, status publikasi, tanggal rilis, view count).
7. `Partner`: Data mitra kerja dan afiliasi strategis (nama lengkap, singkatan, kategori mitra, logo, tautan website resmi, urutan display, status aktif).
8. `MemberWork`: Data karya dan portofolio proyek anggota (judul proyek, slug unik, kategori keahlian, nama perusahaan anggota, tahun proyek, deskripsi, foto dokumentasi, status unggulan/featured, urutan display, status aktif).

### Data Safety & Fallback Contract
- `data/landing.ts` tetap dipertahankan sebagai fallback utama konten publik selama masa transisi.
- Database lokal (`*.db`), journal, dan file rahasia (`.env*`) dikecualikan dari Git melalui `.gitignore`, dengan `.env.example` sebagai referensi konfigurasi aman.

### Inisialisasi Akun Admin (CLI)
- **Script:** `scripts/init-admin.ts` dijalankan secara manual melalui perintah `npm run admin:create`.
- **Keamanan Kredensial:** Password diinput secara interaktif dengan masking terminal (karakter asterisk `*`), di-hash menggunakan `bcryptjs` (12 salt rounds), dan tidak pernah dicetak dalam log atau teks biasa.
- **Pencegahan Duplikasi:** Script melakukan pra-pemeriksaan keunikan `username` dan `email` sebelum pembuatan akun, serta menangani error unique constraint P2002 dari Prisma secara atomik tanpa menimpa atau memodifikasi data akun yang telah ada.
- **Isolasi Endpoint:** Tidak ada endpoint HTTP publik untuk registrasi akun admin. Inisialisasi hanya dapat dilakukan dari sesi shell/terminal lokal.

### Sistem Penyimpanan Berkas & Hero Image Upload (Tahap 4.2)
- **Direktori Penyimpanan:** `public/uploads/hero/` untuk pengembangan lokal.
- **Penamaan Berkas:** Server-generated UUID acak `hero-[timestamp]-[uuid].[ext]` via `crypto.randomUUID()`. Nama asli dari client tidak pernah digunakan untuk mencegah path traversal.
- **Format yang Didukung:** JPEG (`jpg`), PNG (`png`), dan WebP (`webp`). Format lain (termasuk SVG, HTML, binary/executable) ditolak secara tegas.
- **Validasi Berkas:** Menggunakan pemeriksaan *magic bytes* buffer asli (misal `0xFF 0xD8 0xFF` untuk JPEG, `89 50 4E 47` untuk PNG, `RIFF...WEBP` untuk WebP) bukan sekadar MIME type atau ekstensi nama file.
- **Batas Ukuran:** Maksimum 5 MB per berkas.
- **Operasi Atomik:** Penulisan menggunakan berkas sementara `.tmp-[filename]` lalu di-rename ke nama akhir, dengan pembersihan otomatis jika terjadi kegagalan sistem guna mencegah berkas sampah parsial.
- **Endpoint:** `POST /api/admin/hero-upload` dilindungi guard autentikasi server (`getCurrentAdmin()`). Hanya admin aktif yang diizinkan mengunggah berkas.
- **Keterbatasan Deployment:** Pada lingkungan serverless/ephemeral (seperti Vercel), penyimpanan filesystem lokal di `public/uploads/` bersifat read-only/ephemeral setelah build. Untuk deployment produksi skala penuh, layer helper `lib/storage/hero.ts` dirancang modular agar mudah dihubungkan ke Object Storage eksternal (seperti Cloudflare R2, AWS S3, atau Supabase Storage) tanpa perlu mengubah kontrak antarmuka API.

### Sistem Penyimpanan Berkas & News Image Upload (Tahap 7.2)
- **Direktori Penyimpanan:** `public/uploads/news/` untuk pengembangan lokal.
- **Penamaan Berkas:** Server-generated UUID acak `news-[timestamp]-[uuid].[ext]` via `crypto.randomUUID()`. Nama asli dan ekstensi dari client tidak dipercaya untuk mencegah path traversal dan ekstensi palsu.
- **Format yang Didukung:** JPEG (`jpg`), PNG (`png`), dan WebP (`webp`). Format lain (SVG, HTML, berkas eksekusi) ditolak secara tegas.
- **Validasi Berkas:** Verifikasi signature *magic bytes* biner asli buffer gambar (`0xFF 0xD8 0xFF` untuk JPEG, `89 50 4E 47` untuk PNG, `RIFF...WEBP` untuk WebP).
- **Batas Ukuran:** Maksimum 5 MB (`MAX_NEWS_IMAGE_SIZE_BYTES`).
- **Operasi Atomik:** Penulisan berkas sementara `.tmp-[filename]` lalu di-rename ke berkas target dengan penghapusan otomatis berkas sementara jika gagal.
- **Pembersihan Berkas:** Helper `deleteNewsImageFile(publicPath)` membersihkan berkas fisik lama secara aman dengan validasi batasan direktori `/uploads/news/` guna mencegah path traversal.
- **Endpoint:** `POST /api/admin/news-upload` terproteksi sesi administrator aktif via `getCurrentAdmin()`. Mengembalikan respons JSON dengan status HTTP semantik (201, 400, 401, 403, 500) tanpa mengekspos detail internal server.

### Sistem Penyimpanan Berkas & Upload Mitra Kerja dan Karya Anggota (Tahap 8.4.3)
- **Modul Penyimpanan Bersama:**
  - `lib/storage/image-validation.ts`: Helper terpusat validasi signature magic bytes biner asli (JPEG `0xFF 0xD8 0xFF`, PNG `89 50 4E 47`, WebP `RIFF...WEBP`) dan konstanta batas ukuran 5 MB (`MAX_IMAGE_SIZE_BYTES`).
  - `lib/storage/upload-image.ts`: Helper penulisan atomik umum (`saveImageToDirectory`) dengan proteksi path traversal, pembuatan berkas sementara `.tmp-[filename]`, rename atomik, dan cleanup otomatis jika terjadi error.
  - `lib/storage/partner.ts`: Spesialisasi penyimpanan logo mitra (`savePartnerLogo`) ke direktori `public/uploads/partners/` dengan prefiks berkas `partner-`.
  - `lib/storage/member-work.ts`: Spesialisasi penyimpanan gambar karya anggota (`saveMemberWorkImage`) ke direktori `public/uploads/member-works/` dengan prefiks berkas `work-`.
- **Direktori Penyimpanan:**
  - Logo mitra: `public/uploads/partners/` (dibuat otomatis jika belum ada, dilengkapi `.gitkeep`).
  - Gambar karya: `public/uploads/member-works/` (dibuat otomatis jika belum ada, dilengkapi `.gitkeep`).
- **Format & Batas Ukuran:** JPEG (`jpg`), PNG (`png`), dan WebP (`webp`). Maksimum 5 MB per berkas. Format SVG, HTML, teks bertopeng ekstensi, berkas executable, dan berkas kosong ditolak secara ketat.
- **Endpoints Upload:**
  - `POST /api/admin/partner-upload`: Endpoint upload logo mitra (field multipart: `file`).
  - `POST /api/admin/member-work-upload`: Endpoint upload gambar karya anggota (field multipart: `file`).
- **Autentikasi & Otorisasi:**
  - Kedua endpoint dilindungi oleh `getCurrentAdmin(tokenFromCookie)` dari `lib/auth/server.ts`.
  - Mengembalikan HTTP 401 jika sesi tidak ada atau kedaluwarsa.
  - Mengembalikan HTTP 403 jika akun admin berstatus nonaktif (`isActive: false`).
- **Format Path Publik:**
  - Mengembalikan path relatif publik: `/uploads/partners/partner-[timestamp]-[uuid].[ext]` atau `/uploads/member-works/work-[timestamp]-[uuid].[ext]`.
  - Tidak mengembalikan path absolut server demi keamanan.
- **Isolasi Database:**
  - Endpoint upload pada Tahap 8.4.3 ini **TIDAK** memperbarui maupun membuat record pada tabel database (`Partner` maupun `MemberWork`).
  - Path publik yang dikembalikan disimpan sementara di client untuk kemudian dimasukkan ke kolom `logoPath` atau `imagePath` saat form CRUD disimpan pada Tahap 8.4.4.
- **Ketentuan Backup & Git Hygiene:**
  - File unggahan fisik pada `public/uploads/` diabaikan oleh Git via `.gitignore` (`public/uploads/**` dan `!public/uploads/**/.gitkeep`).
  - Berkas gambar yang diunggah tidak tersimpan di repositori Git dan harus dikelola melalui strategi backup volume disk atau Object Storage eksternal saat deployment produksi.

### Server Actions & Logika CRUD Mitra Kerja dan Karya Anggota (Tahap 8.4.4)
- **Modul Server Actions:**
  - `lib/admin/partner-actions.ts`:
    - `getPartnersAction(options)`: Mengambil daftar mitra kerja dengan filter pencarian (`name`, `shortName`, `category`), filter kategori, dan status (`all`, `active`, `inactive`). Terurut deterministik berdasarkan `order: asc`, `createdAt: asc`, `id: asc`.
    - `createPartnerAction(input)`: Menambahkan mitra kerja baru dengan validasi nama (maks 150), shortName (maks 50), category (maks 50), websiteUrl (valid HTTP/HTTPS, maks 255), logoPath (harus dalam `/uploads/partners/`), penentuan auto-order berbasis max order, dan revalidasi cache publik.
    - `updatePartnerAction(input)`: Memperbarui mitra kerja secara selektif dengan validasi field, safe logo replacement (hanya menghapus logo lama jika tidak digunakan oleh record lain), dan revalidasi cache.
    - `deletePartnerAction(partnerId)`: Menghapus data mitra kerja dari basis data terlebih dahulu, kemudian membersihkan file logo fisik jika tidak dipakai record lain.
    - `togglePartnerActiveAction(partnerId, explicitStatus?)`: Mengubah status aktif/nonaktif mitra kerja secara instan.
    - `reorderPartnersAction(orderedItems)`: Mengatur ulang urutan mitra kerja secara atomik dalam transaksi `prisma.$transaction`. Mendukung array string ID maupun objek `{ id, order }`.
  - `lib/admin/member-work-actions.ts`:
    - `getMemberWorksAction(options)`: Mengambil daftar karya anggota dengan filter pencarian (`title`, `slug`, `company`, `category`, `client`, `year`), kategori, status aktif, dan status unggulan (`all`, `featured`, `standard`). Terurut berdasarkan `order: asc`.
    - `createMemberWorkAction(input)`: Menambahkan karya anggota baru dengan validasi judul (maks 150), kategori (maks 50), perusahaan (maks 100), tahun (maks 20), deskripsi (maks 1000), klien (maks 100), teks alt gambar (maks 200), dan imagePath (harus dalam `/uploads/member-works/`). Dilengkapi slug generator otomatis dari judul dengan auto-resolusi tabrakan slug (suffix `-1`, `-2`, dst.).
    - `updateMemberWorkAction(input)`: Memperbarui karya anggota. **Kaidah Integritas Slug**: jika judul diperbarui tanpa menyertakan input slug eksplisit, slug lama dipertahankan secara ketat untuk mencegah tautan publik rusak. Jika slug eksplisit diberikan, divalidasi keunikan dan formatnya.
    - `deleteMemberWorkAction(memberWorkId)`: Menghapus karya anggota dari basis data dan membersihkan file gambar jika tidak dipakai record lain.
    - `toggleMemberWorkActiveAction(memberWorkId, explicitStatus?)`: Mengubah status aktif/nonaktif karya anggota.
    - `toggleMemberWorkFeaturedAction(memberWorkId, explicitStatus?)`: Mengubah status unggulan (`isFeatured`) karya anggota.
    - `reorderMemberWorksAction(orderedItems)`: Mengatur ulang urutan karya anggota secara atomik dalam transaksi `prisma.$transaction`.
- **Aturan Pembersihan Berkas Aman (Safe Image Cleanup):**
  - Menggunakan helper `deleteImageFromDirectory` dari `lib/storage/upload-image.ts` dengan sanitasi path traversal ketat.
  - Berkas fisik lama **TIDAK AKAN** dihapus apabila masih digunakan oleh record lain (shared image protection).
  - Berkas fisik **TIDAK AKAN** dihapus jika transaksi database gagal (database failure safety).
- **Keamanan & Otorisasi:**
  - Seluruh Server Actions dilindungi oleh `verifyActiveAdmin()` yang memeriksa sesi administrator aktif dari cookie via `getCurrentAdmin()`. Sesi tidak valid atau administrator nonaktif akan ditolak seketika sebelum menyentuh data.
- **Strategi Revalidasi Cache:**
  - `safeRevalidate()` memanggil `revalidatePath("/")`, `revalidatePath("/mitra-kerja/terdaftar")`, `revalidatePath("/mitra-kerja/daftar")`, `revalidatePath("/berita-informasi/karya-anggota")`, serta rute admin terkait setiap kali terjadi mutasi data.

### Antarmuka Dashboard Admin Mitra Kerja dan Karya Anggota (Tahap 8.4.4 Bagian B)
- **Rute Dashboard Baru:**
  - `/babel-and-adt/partners` (`app/babel-and-adt/(protected)/partners/page.tsx`): Halaman server terproteksi untuk pengelolaan data mitra kerja dan afiliasi.
  - `/babel-and-adt/member-works` (`app/babel-and-adt/(protected)/member-works/page.tsx`): Halaman server terproteksi untuk pengelolaan data karya dan portofolio anggota.
- **Client Components:**
  - `components/admin/PartnerManagementClient.tsx`:
    - Komponen client interaktif untuk tabel daftar mitra kerja, metrik ringkasan (Total, Aktif, Kategori, Dengan Logo), pencarian nama/singkatan/kategori, filter kategori dan status, tombol geser urutan (Naik/Turun), toggle status aktif/nonaktif instan, modal tambah/edit mitra, form validasi lengkap, live logo upload ke `/api/admin/partner-upload` dengan preview logo, dan modal konfirmasi hapus permanen.
  - `components/admin/MemberWorkManagementClient.tsx`:
    - Komponen client interaktif untuk tabel daftar karya anggota, metrik ringkasan (Total, Unggulan, Aktif, Dengan Foto), pencarian multi-bidang, filter kategori, status aktif, dan status unggulan, tombol geser urutan (Naik/Turun), toggle status unggulan (`isFeatured`) instan, toggle status aktif (`isActive`) instan, modal tambah/edit karya, form validasi lengkap dengan input opsional slug kustom (tetap mempertahankan slug lama saat judul diupdate tanpa perubahan slug), live image upload ke `/api/admin/member-work-upload` dengan preview gambar, dan modal konfirmasi hapus permanen.
- **Integrasi Navigasi Sidebar:**
  - `components/admin/types.ts`: Menambahkan ikon `Briefcase` ke `AdminIconName`. Mengaktifkan tautan `href: "/babel-and-adt/partners"` pada item `partners`. Menambahkan item baru `member-works` (`label: "Karya Anggota"`, `iconName: "Briefcase"`, `href: "/babel-and-adt/member-works"`) di bawah `news` pada seksi PENGELOLAAN KONTEN.
  - `components/admin/AdminIcon.tsx`: Menambahkan resolusi ikon `Briefcase` dari `lucide-react`.
  - `components/admin/index.ts`: Mengekspor `PartnerManagementClient` dan `MemberWorkManagementClient`.
- **Integrasi Upload & Keamanan Gambar:**
  - Logo mitra diunggah langsung melalui `POST /api/admin/partner-upload` berbasis `multipart/form-data` dengan field `file`. Path publik `/uploads/partners/partner-...` yang dikembalikan disimpan ke dalam state formulir dan diteruskan saat form di-submit via Server Actions.
  - Foto dokumentasi karya diunggah langsung melalui `POST /api/admin/member-work-upload`. Path publik `/uploads/member-works/work-...` yang dikembalikan disimpan ke dalam state formulir dan diteruskan saat form di-submit via Server Actions.
  - Client component tidak pernah memanggil penghapusan berkas fisik langsung; penghapusan dan penggantian gambar dikelola secara aman di backend oleh Server Actions dengan proteksi *shared image* dan sanitasi *path traversal*.

### Tahap 8.4.5: Integrasi Database Mitra Kerja & Karya Anggota ke Website Publik

- **Modul Public Data Helpers (`lib/public/`):**
  - `lib/public/partner.ts`:
    - `getPublicPartnersForHome()`: Mengambil mitra `isActive: true` dengan pengurutan deterministik `[{ order: "asc" }, { createdAt: "asc" }, { id: "asc" }]`.
    - `getPublicPartnersForDirectory(options)`: Mengambil mitra aktif untuk halaman direktori publik dengan filter pencarian (nama, singkatan, kategori) dan kategori spesifik, serta daftar kategori unik aktif.
  - `lib/public/member-work.ts`:
    - `getFeaturedMemberWorksForHome(limit)`: Mengambil karya anggota `isActive: true` dan `isFeatured: true` terurut deterministik untuk etalase beranda.
    - `getPublicMemberWorksArchive(options)`: Mengambil seluruh karya aktif dengan pencarian multi-bidang (judul, perusahaan, kategori, tahun, klien) dan filter kategori.
    - `getPublicMemberWorkBySlug(slug)`: Mengambil data karya tunggal aktif berdasarkan slug. Mengembalikan `null` jika tidak ditemukan atau karya berstatus nonaktif.
    - `getRelatedMemberWorks(category, currentWorkId, limit)`: Mengambil rekomendasi karya terkait dari kategori yang sama dengan mengecualikan karya yang sedang dibuka.
- **Aturan Fallback Statis:**
  - Fallback ke data statis `data/landing.ts` hanya dieksekusi apabila total record tabel di basis data adalah 0 (`count === 0`), menjamin ketahanan saat instalasi awal.
  - Jika tabel memiliki record tetapi seluruhnya berstatus nonaktif (`isActive: false` atau `isFeatured: false`), helper mengembalikan array kosong `[]`, bukan fallback statis. Hal ini mencegah data lama yang sengaja dinonaktifkan admin muncul kembali ke publik.
- **Halaman dan Komponen Publik:**
  - `app/page.tsx`: Memuat data `getPublicPartnersForHome()` dan `getFeaturedMemberWorksForHome(4)` via `Promise.all` di server dan meneruskannya ke `<MemberWorks initialWorks={featuredWorks} />` dan `<Partners partners={partners} />`.
  - `components/Partners.tsx`: Mendukung logo berkas dari `logoPath` atau inisial fallback `Building2`, serta tautan eksternal ke situs resmi mitra jika `websiteUrl` valid.
  - `components/MemberWorks.tsx`: Mendukung foto dokumentasi dari `imagePath` atau placeholder skematik teknis `imageAlt`, serta menghubungkan setiap kartu ke detail `/berita-informasi/karya-anggota/${slug}`.
  - `app/mitra-kerja/terdaftar/page.tsx` & `components/PartnerDirectoryClient.tsx`: Halaman direktori publik mitra kerja dengan pencarian interaktif nama/singkatan, pill filter kategori dinamis, dan kartu responsif.
  - `app/berita-informasi/karya-anggota/page.tsx` & `components/MemberWorkArchiveClient.tsx`: Halaman galeri arsip karya anggota dengan pencarian interaktif, filter kategori, badge portofolio unggulan, dan tautan detail.
  - `app/berita-informasi/karya-anggota/[slug]/page.tsx`: Halaman detail karya anggota dengan guard `notFound()` (HTTP 404), SEO dinamis `generateMetadata`, breadcrumbs, visual foto/skematik, uraian ruang lingkup, lembar spesifikasi teknis, dan portofolio terkait.
- **Revalidasi Cache Sisi Server:**
  - Mutasi mitra kerja me-revalidate: `/`, `/mitra-kerja/terdaftar`, `/mitra-kerja/daftar`, `/babel-and-adt/partners`.
  - Mutasi karya anggota me-revalidate: `/`, `/berita-informasi/karya-anggota`, `/berita-informasi/karya-anggota/${slug}`, `/babel-and-adt/member-works`.