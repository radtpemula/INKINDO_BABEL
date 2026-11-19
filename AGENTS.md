# AGENTS.md — Pedoman Kerja AI Coding Agent Proyek INKINDO BABEL

## 1. Status & Tujuan Proyek
- **Status Proyek:** **Prototype / Development Lokal (Belum Production)**.
- **Tujuan Proyek:** Membangun dan mengembangkan website resmi organisasi Ikatan Nasional Konsultan Indonesia (INKINDO) Provinsi Kepulauan Bangka Belitung sebagai aplikasi **Full-Stack Content Management System (CMS)** yang profesional, responsif, aman, dan mudah dikelola menggunakan Next.js App Router, Prisma ORM, MySQL 8.4 Docker, dan Tailwind CSS.

---

## 2. Aturan Kerja & Batasan Pengembang (Working Rules)

### A. Kebijakan Full-Stack & Lingkup Pekerjaan
- **Pengembangan Full-Stack:** Agen **diperbolehkan** mengembangkan fitur backend, basis data, autentikasi, API route, Server Actions, dan antarmuka dashboard administrasi apabila fitur tersebut termasuk dalam ruang lingkup tugas yang secara eksplisit diminta atau disetujui pengguna.
- **Audit Sebelum Bertindak:** Wajib memeriksa kode, modul helper, dan skema yang telah ada sebelum melakukan perubahan apa pun. Jangan berasumsi bahwa dokumentasi lama selalu akurat tanpa verifikasi kode aktual.
- **Pemanfaatan Helper Eksisting:** Gunakan modul helper yang sudah terstandarisasi di dalam proyek (seperti `lib/storage/` untuk penyimpanan dan pemrosesan gambar via Sharp, `lib/security/` untuk verifikasi path, referensi, token kepemilikan, dan per-path lock, `lib/auth/` untuk verifikasi sesi, `lib/admin/` untuk Server Actions, dan `components/admin/` untuk UI dashboard). Dilarang membuat modul atau pola duplikat.
- **Isolasi Fitur:** Fokus hanya pada ruang lingkup tugas yang sedang dikerjakan. Dilarang memodifikasi atau merombak fitur lain yang tidak terkait.
- **Penundaan Tahap 8.3:** Wajib menghormati keputusan pengguna bahwa **Tahap 8.3 (Manajemen Konten Beranda)** berstatus **DITUNDA (ON HOLD)**. Dilarang menginisiasi dinamisasi urutan seksi beranda tanpa instruksi eksplisit.

### B. Keamanan Basis Data, Docker, & Lingkungan Kerja
- **Basis Data Aktif:** Database aktif aplikasi saat ini adalah **MySQL 8.4 Docker** (`inkindo-babel-mysql` pada port `127.0.0.1:3306`, database `inkindo_babel_db`).
- **Arsip SQLite:** Berkas SQLite lokal `prisma/dev.db` dan seluruh berkas cadangannya di `~/Documents/inkindo_sqlite_backups/` berstatus **arsip historis** hasil migrasi (M1–M3C). Dilarang keras memodifikasi, menghapus, atau mereset berkas ini.
- **Proteksi Data MySQL Aktif:** Dilarang keras menjalankan perintah destruktif seperti `prisma migrate reset`, `prisma db push --force-reset`, `DROP DATABASE`, `TRUNCATE`, atau penghapusan container/volume MySQL (`inkindo_mysql_data`) yang menyebabkan hilangnya data aktif pengguna.
- **Isolasi Pengujian DB:** Seluruh skrip pengujian basis data (`scripts/test-*.ts`) **wajib** menggunakan helper isolasi `scripts/test-db-helper.ts` yang mengarah ke database uji terpisah `inkindo_test_db`. Dilarang keras menulis data uji ke `inkindo_babel_db`.
- **Konsistensi Skema:** Dilarang mengubah berkas `prisma/schema.prisma` tanpa persetujuan eksplisit pengguna.
- **Kerahasiaan Data & CC Safety Net:** Dilarang mengekspos kredensial rahasia, nilai variabel lingkungan `.env`, connection string, atau hash password ke dalam log, teks publik, maupun respons client. Patuhi aturan CC Safety Net terhadap berkas `.env`.

### C. Disiplin Berkas Upload & Manajemen Orphan
- **Proteksi Berkas Upload Fisik:** Seluruh berkas biner pada `public/uploads/` (termasuk 5 kandidat orphan lama Fase 4–5A) dilarang dihapus secara massal atau manual tanpa verifikasi referensi menyeluruh.
- **Arsitektur Upload Gambar:** Seluruh modul CMS (Mitra, Karya Anggota, Hero Slide, Hero Card, Hero Background, dan Sampul Berita) menerapkan pola **Upload-on-Submit** terpadu (`components/admin/deferred-image-upload.ts` dan `use-deferred-image-upload.ts`) dengan pemrosesan aman via **Sharp** (`lib/storage/image-processor.ts`).
- **Kebijakan Gambar Inline Tiptap:** Gambar inline diunggah saat disisipkan ke editor. Node gambar yang dibuang dari editor **TIDAK LANGSUNG** dihapus fisiknya untuk melindungi operasi undo/redo/drafting. Pembersihan hanya dilakukan pasca-simpan artikel (terhadap gambar yang tak lagi dipakai dan bebas referensi) atau saat draft dibatalkan (jika terbukti aman melalui `rollbackDraftInlineUploadsAction`).
- **Pembersihan Bersyarat & Fail-Safe:** Penghapusan berkas fisik hanya diizinkan melalui mekanisme **Reference-Aware Deletion** (`lib/security/image-reference.ts`), pelacakan token kepemilikan (`upload-receipt.ts`), receipt kegagalan server (`rollbackToken`), dan per-path mutex (`withImagePathLock`). Jika status simpan tidak pasti (*unknown/timeout*), berkas **wajib dipertahankan** dan dicatat sebagai `[orphan-candidate]` non-destruktif.
- **Keterbatasan Single-Instance:** Mekanisme anti-replay JTI dan per-path mutex (`lib/security/upload-coordinator.ts`) saat ini berbasis in-memory pada satu proses Node.js. Pahami bahwa pada lingkungan multi-instance/serverless di masa depan, koordinasi ini memerlukan backend terdistribusi (Redis).

### D. Disiplin Git & Manajemen Repositori
- **Izin Commit & Push:** Dilarang melakukan `git commit` atau `git push` kecuali atas permintaan eksplisit dari pengguna.
- **Staging Selektif:** Dilarang keras menggunakan perintah global seperti `git add .`, `git add -A`, atau `git add --all`. Gunakan `git add <file>` dengan menyebutkan daftar file secara eksplisit jika diminta.
- **Pengecualian Berkas:** Pastikan berkas berikut **tidak pernah** masuk ke dalam staging atau commit Git:
  - Berkas runtime agent (misalnya `.omo/`).
  - Basis data SQLite lokal (`prisma/dev.db`, `*.db`).
  - Berkas cadangan basis data (`*.db.bak`, `*.db-backup*`, `*.sql`).
  - Berkas variabel lingkungan lokal (`.env`, `.env.local`, `.env.mysql`).
  - Berkas biner upload pengguna fisik pada `public/uploads/` (hanya berkas `.gitkeep` yang boleh ter-track).
  - Berkas sementara hasil pengujian (*test scripts / scratch files / temp DB dumps*).

### E. Standar Kode & Kualitas Teknis
- **TypeScript Strict:** Gunakan TypeScript ketat (`strict: true`). Dilarang mematikan typecheck atau menyembunyikan galat menggunakan `as any`, `@ts-ignore`, atau `@ts-expect-error`.
- **Modularitas & Batas Ukuran File:** Pertahankan batas wajar ukuran berkas baru/pecahan (pedoman <= 250 pure LOC).
- **Styling & Ikonografi:** Pertahankan tema desain aktif **Engineering Slate + Burnt Amber**. Dilarang keras menggunakan emoji sebagai ikon UI; gunakan icon library resmi `lucide-react`.
- **Aksesibilitas & Semantik:** Gunakan elemen HTML semantik, atribut `aria-*`, penanda keyboard focus yang jelas, serta dukungan `prefers-reduced-motion` pada komponen beranimasi.
- **Responsivitas Mutlak:** Setiap seksi dan halaman harus responsif pada seluruh ukuran layar (ponsel 375px/390px, tablet 768px/1024px, dan desktop 1280px–1567px+). Bebas dari overflow horizontal (`scrollWidth <= innerWidth`).
- **Verifikasi Faktual:** Sebelum melaporkan tugas selesai, jalankan perintah validasi relevan (`npx tsc --noEmit`, `npm run lint`, `npm run build --webpack`, dan suite pengujian). Dilarang mengklaim pengujian yang belum benar-benar dijalankan dan lolos verifikasi.

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
