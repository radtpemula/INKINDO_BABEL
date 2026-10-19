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

