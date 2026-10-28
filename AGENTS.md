# AGENTS.md — Pedoman Kerja AI Coding Agent Proyek INKINDO BABEL

## 1. Tujuan Proyek
Membangun dan mengembangkan website resmi organisasi Ikatan Nasional Konsultan Indonesia (INKINDO) Provinsi Kepulauan Bangka Belitung sebagai aplikasi **Full-Stack Content Management System (CMS)** yang profesional, responsif, aman, dan mudah dikelola menggunakan Next.js App Router, Prisma ORM, dan Tailwind CSS.

---

## 2. Aturan Kerja & Batasan Pengembang (Working Rules)

### A. Kebijakan Full-Stack & Lingkup Pekerjaan
- **Pengembangan Full-Stack:** Agen **diperbolehkan** mengembangkan fitur backend, basis data, autentikasi, API route, Server Actions, dan antarmuka dashboard administrasi apabila fitur tersebut termasuk dalam ruang lingkup tugas yang secara eksplisit diminta atau disetujui pengguna.
- **Audit Sebelum Bertindak:** Wajib memeriksa kode, modul helper, dan skema yang telah ada sebelum melakukan perubahan apa pun.
- **Pemanfaatan Helper Eksisting:** Gunakan modul helper yang sudah terstandarisasi di dalam proyek (seperti `lib/storage/` untuk penyimpanan dan validasi gambar, `lib/auth/` untuk verifikasi sesi, `lib/admin/` untuk Server Actions, dan `components/admin/` untuk UI dashboard). Dilarang membuat modul atau pola duplikat.
- **Isolasi Fitur:** Fokus hanya pada ruang lingkup tugas yang sedang dikerjakan. Dilarang memodifikasi atau merombak fitur lain yang tidak terkait.
- **Penundaan Tahap 8.3:** Wajib menghormati keputusan pengguna bahwa **Tahap 8.3 (Manajemen Konten Beranda)** berstatus **DITUNDA (ON HOLD)**. Dilarang menginisiasi dinamisasi urutan seksi beranda tanpa instruksi eksplisit.

### B. Keamanan Basis Data & Lingkungan Kerja
- **Proteksi Data Lokal:** Dilarang keras menjalankan perintah reset database (`npx prisma migrate reset`, `prisma db push --force-reset`), penghapusan tabel, atau perintah destruktif yang menyebabkan hilangnya data pengguna lokal pada `prisma/dev.db`.
- **Konsistensi Skema:** Dilarang mengubah berkas `prisma/schema.prisma` tanpa persetujuan eksplisit pengguna.
- **Migrasi & Seed:** Dilarang menjalankan script seed atau migrasi skema tanpa kebutuhan nyata dan analisis dampak data.
- **Kerahasiaan Data:** Dilarang mengekspos kredensial rahasia, nilai variabel lingkungan `.env`, atau hash password ke dalam log, teks publik, maupun respons client.

### C. Disiplin Git & Manajemen Repositori
- **Izin Commit & Push:** Dilarang melakukan `git commit` atau `git push` kecuali atas permintaan eksplisit dari pengguna.
- **Staging Selektif:** Dilarang keras menggunakan perintah global seperti `git add .`, `git add -A`, atau `git add --all`. Gunakan `git add <file>` dengan menyebutkan daftar file secara eksplisit.
- **Pengecualian Berkas:** Pastikan berkas berikut **tidak pernah** masuk ke dalam staging atau commit Git:
  - Berkas runtime agent (misalnya `.omo/`).
  - Basis data SQLite lokal (`prisma/dev.db`, `*.db`).
  - Berkas cadangan basis data (`*.db.bak`, `*.db-backup*`).
  - Berkas variabel lingkungan lokal (`.env`, `.env.local`).
  - Berkas biner upload pengguna fisik pada `public/uploads/` (hanya berkas `.gitkeep` yang boleh ter-track).
  - Berkas sementara hasil pengujian (*test scripts / scratch files*).

### D. Standar Kode & Kualitas Teknis
- **TypeScript Strict:** Gunakan TypeScript ketat (`strict: true`). Dilarang mematikan typecheck atau menyembunyikan galat menggunakan `as any`, `@ts-ignore`, atau `@ts-expect-error`.
- **Styling & Ikonografi:** Pertahankan tema desain aktif **Engineering Slate + Burnt Amber**. Dilarang keras menggunakan emoji sebagai ikon UI; gunakan icon library resmi `lucide-react`.
- **Aksesibilitas & Semantik:** Gunakan elemen HTML semantik, atribut `aria-*`, penanda keyboard focus yang jelas, serta dukungan `prefers-reduced-motion` pada komponen beranimasi.
- **Responsivitas Mutlak:** Setiap seksi dan halaman harus responsif pada seluruh ukuran layar (ponsel 375px/390px, tablet 768px/1024px, dan desktop 1280px–1567px+). Bebas dari overflow horizontal (`scrollWidth <= innerWidth`).
- **Verifikasi Faktual:** Sebelum melaporkan tugas selesai, jalankan perintah validasi relevan (`npx tsc --noEmit`, `npm run lint`, `npm run build --webpack`). Dilarang mengklaim pengujian yang belum benar-benar dijalankan dan lolos verifikasi.

---

## 3. Identitas Visual Aktif (Visual Direction)
- **Primary Dark Slate:** `#0F172A`
- **Primary Slate Surface:** `#1E293B`
- **Muted Slate:** `#334155`
- **Accent Amber:** `#D97706` (*Burnt Amber*)
- **Accent Hover:** `#B45309`
- **Background & Card Surfaces:** `#FFFFFF` dan `#F8FAFC`
- **Border Neutral:** `#E2E8F0`

*(Catatan Historis: Palet Navy #14245C dan Orange #FF6600 merupakan palet draf awal yang sudah tidak aktif dan digantikan oleh palet di atas).*

---

## 4. Pelaporan Pasca-Implementasi (Communication)
Setelah menyelesaikan implementasi, selalu laporkan:
1. Ringkasan berkas yang dibuat atau dimodifikasi (`files created/changed`).
2. Perintah validasi teknis yang dijalankan beserta kodenya (`exit code 0`).
3. Hasil pengujian fungsional dan integritas basis data.
4. Keterbatasan teknis yang tersisa atau catatan khusus bagi pengguna.
