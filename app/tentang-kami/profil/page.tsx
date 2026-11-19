import { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ChevronRight, ArrowRight, MapPin, Phone, Mail, Clock } from "lucide-react";
import { getSiteSettings } from "@/lib/public/settings";
import { aboutData } from "@/data/landing";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Profil INKINDO - DPP INKINDO Kepulauan Bangka Belitung",
  description:
    "Profil organisasi Dewan Pengurus Provinsi Ikatan Nasional Konsultan Indonesia (INKINDO) Kepulauan Bangka Belitung.",
};

export default async function ProfilPage() {
  const siteSettings = await getSiteSettings();

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC]">
      <Header settings={siteSettings} />

      <main className="flex-grow">
        {/* Banner Halaman Internal */}
        <section className="bg-[#0F172A] text-white py-6 sm:py-8 border-b border-slate-800">
          <div className="max-w-[1280px] 2xl:max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8">
            <nav aria-label="Breadcrumb" className="mb-2.5">
              <ol className="flex flex-wrap items-center gap-1.5 text-xs text-slate-300">
                <li>
                  <Link
                    href="/"
                    className="hover:text-white transition-colors focus:outline-hidden focus-visible:underline"
                  >
                    Beranda
                  </Link>
                </li>
                <li className="flex items-center gap-1.5">
                  <ChevronRight className="w-3.5 h-3.5 text-[#D97706]" aria-hidden="true" />
                  <span className="text-slate-400">Tentang Kami</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <ChevronRight className="w-3.5 h-3.5 text-[#D97706]" aria-hidden="true" />
                  <span className="text-white font-medium">Profil INKINDO</span>
                </li>
              </ol>
            </nav>

            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
              <span className="inline-block px-2.5 py-0.5 rounded bg-slate-800 text-[#D97706] text-xs font-semibold tracking-wider uppercase border border-slate-700">
                Tentang Kami
              </span>
              <h1 className="text-xl sm:text-2xl md:text-[28px] font-bold text-white tracking-tight">
                Profil INKINDO
              </h1>
            </div>

            <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-2xl leading-relaxed">
              Dewan Pengurus Provinsi Ikatan Nasional Konsultan Indonesia (DPP INKINDO) Kepulauan Bangka Belitung.
            </p>
          </div>
        </section>

        {/* Layout Editorial 2 Kolom (70% Konten Utama, 30% Sidebar) */}
        <div className="max-w-[1280px] 2xl:max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
            {/* Area Konten Utama (~70% / 8 Kolom) */}
            <article className="lg:col-span-8 bg-white rounded-xl border border-[#E2E8F0] p-6 sm:p-10 shadow-xs">
              <header className="border-b border-slate-100 pb-6 mb-7">
                <span className="text-xs font-bold text-[#D97706] uppercase tracking-wider block mb-1.5">
                  PROFIL ORGANISASI
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold text-[#0F172A] tracking-tight leading-snug">
                  Ikatan Nasional Konsultan Indonesia Provinsi Kepulauan Bangka Belitung
                </h2>
                <div className="w-12 h-1 bg-[#D97706] mt-4 rounded-full" />
              </header>

              <div className="space-y-6 text-slate-700 text-sm sm:text-base leading-relaxed">
                {/* Bagian 1: Pengantar Organisasi */}
                <section aria-labelledby="pengantar-heading">
                  <h3 id="pengantar-heading" className="sr-only">
                    Pengantar Organisasi
                  </h3>
                  <p className="font-medium text-[#1E293B] leading-relaxed">
                    {aboutData.description1}
                  </p>
                  <p className="mt-4 text-slate-600 leading-relaxed">
                    {aboutData.description2}
                  </p>
                </section>

                {/* Bagian 2: Latar Belakang & Sejarah */}
                <section aria-labelledby="sejarah-heading" className="pt-6 border-t border-slate-100">
                  <h3 id="sejarah-heading" className="text-lg sm:text-xl font-bold text-[#0F172A] mb-3">
                    Latar Belakang & Perjalanan Organisasi
                  </h3>
                  <p className="text-slate-600 leading-relaxed">
                    Sebagai asosiasi independen yang menaungi badan usaha jasa konsultansi di Serumpun Sebalai, DPP INKINDO Kepulauan Bangka Belitung berfokus mengokohkan peran strategis konsultan lokal dalam merancang dan mengawasi proyek-proyek infrastruktur strategis daerah, penataan tata ruang wilayah, serta pengelolaan sumber daya alam kepulauan.
                  </p>

                  {/* Keterangan Editorial Transparan */}
                  <div className="mt-4 bg-slate-50 border-l-3 border-[#D97706] p-4 rounded-r-lg text-xs sm:text-sm text-slate-600 leading-relaxed">
                    <span className="font-semibold text-slate-800 block mb-1">
                      Catatan Dokumentasi Organisasi
                    </span>
                    Naskah lengkap riwayat pendirian cabang, kronologi kepengurusan antar-periode, dan arsip legalitas organisasi sedang dalam proses inventarisasi dan verifikasi dokumen oleh Sekretariat DPP INKINDO Kepulauan Bangka Belitung untuk dipublikasikan secara komprehensif.
                  </div>
                </section>

                {/* Bagian 3: Peran & Komitmen Kelembagaan */}
                <section aria-labelledby="peran-heading" className="pt-6 border-t border-slate-100">
                  <h3 id="peran-heading" className="text-lg sm:text-xl font-bold text-[#0F172A] mb-3">
                    Peran dan Komitmen Kelembagaan
                  </h3>
                  <p className="text-slate-600 leading-relaxed mb-4">
                    DPP INKINDO Kepulauan Bangka Belitung mengemban fungsi pembinaan profesi, perlindungan hak usaha, dan peningkatan kapasitas mutu badan usaha anggota. Komitmen ini diwujudkan melalui:
                  </p>
                  <ul className="list-disc pl-5 space-y-2 text-slate-600 text-xs sm:text-sm leading-relaxed">
                    <li>
                      Fasilitasi pemenuhan standar kualifikasi badan usaha (SBU) dan sertifikasi kompetensi tenaga kerja konstruksi.
                    </li>
                    <li>
                      Advokasi regulasi pengadaan barang dan jasa konsultansi agar tercipta iklim usaha yang adil, transparan, dan berdaya saing sehat.
                    </li>
                    <li>
                      Kolaborasi kemitraan strategis dengan pemerintah daerah, BUMN/BUMD, perbankan, dan asosiasi profesi terkait.
                    </li>
                    <li>
                      Penegakan etika profesi konsultansi demi menjaga integritas, mutu rekayasa, dan tanggung jawab terhadap keselamatan masyarakat.
                    </li>
                  </ul>
                </section>

                {/* Bagian 4: Navigasi Terkait */}
                <section aria-labelledby="navigasi-heading" className="pt-6 border-t border-slate-100">
                  <h3 id="navigasi-heading" className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                    INFORMASI TERKAIT
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Untuk mengetahui haluan strategis organisasi, Anda dapat membaca halaman{" "}
                    <Link
                      href="/tentang-kami/visi-misi"
                      className="font-semibold text-[#0F172A] hover:text-[#D97706] underline underline-offset-2 transition-colors focus:outline-hidden focus-visible:ring-1 focus-visible:ring-[#D97706]"
                    >
                      Visi & Misi
                    </Link>
                    . Susunan kepengurusan dewan pengurus provinsi dapat diakses melalui halaman{" "}
                    <Link
                      href="/tentang-kami/struktur-organisasi"
                      className="font-semibold text-[#0F172A] hover:text-[#D97706] underline underline-offset-2 transition-colors focus:outline-hidden focus-visible:ring-1 focus-visible:ring-[#D97706]"
                    >
                      Struktur Organisasi
                    </Link>
                    , atau hubungi langsung{" "}
                    <Link
                      href="/hubungi-kami"
                      className="font-semibold text-[#0F172A] hover:text-[#D97706] underline underline-offset-2 transition-colors focus:outline-hidden focus-visible:ring-1 focus-visible:ring-[#D97706]"
                    >
                      Sekretariat INKINDO BABEL
                    </Link>
                    .
                  </p>
                </section>
              </div>
            </article>

            {/* Sidebar Kanan (~30% / 4 Kolom) */}
            <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
              {/* Menu Navigasi Sub-Halaman Tentang Kami */}
              <nav
                aria-label="Navigasi Tentang Kami"
                className="bg-white rounded-xl border border-[#E2E8F0] shadow-xs overflow-hidden"
              >
                <div className="bg-[#0F172A] text-white px-5 py-3.5 border-b border-slate-800">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    TENTANG KAMI
                  </span>
                </div>

                <ul className="divide-y divide-slate-100 text-xs sm:text-sm">
                  <li>
                    <Link
                      href="/tentang-kami/profil"
                      aria-current="page"
                      className="flex items-center justify-between px-5 py-3.5 font-bold text-[#0F172A] bg-slate-50 border-l-4 border-l-[#D97706] transition-colors focus:outline-hidden focus-visible:underline"
                    >
                      <span>Profil INKINDO</span>
                      <ChevronRight className="w-4 h-4 text-[#D97706]" aria-hidden="true" />
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/tentang-kami/visi-misi"
                      className="flex items-center justify-between px-5 py-3.5 font-medium text-slate-600 hover:text-[#0F172A] hover:bg-slate-50 transition-colors focus:outline-hidden focus-visible:underline"
                    >
                      <span>Visi & Misi</span>
                      <ChevronRight className="w-4 h-4 text-slate-300" aria-hidden="true" />
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/tentang-kami/struktur-organisasi"
                      className="flex items-center justify-between px-5 py-3.5 font-medium text-slate-600 hover:text-[#0F172A] hover:bg-slate-50 transition-colors focus:outline-hidden focus-visible:underline"
                    >
                      <span>Struktur Organisasi</span>
                      <ChevronRight className="w-4 h-4 text-slate-300" aria-hidden="true" />
                    </Link>
                  </li>
                </ul>
              </nav>

              {/* Widget Informasi Sekretariat */}
              <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 sm:p-6 shadow-xs">
                <span className="text-xs font-bold text-[#0F172A] uppercase tracking-wider block pb-3 mb-4 border-b border-slate-100">
                  SEKRETARIAT
                </span>

                <ul className="space-y-3.5 text-xs sm:text-sm text-slate-600">
                  <li className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" aria-hidden="true" />
                    <span className="leading-relaxed">
                      {siteSettings.contact.address || "Pangkalpinang, Kepulauan Bangka Belitung"}
                    </span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Phone className="w-4 h-4 text-[#D97706] shrink-0" aria-hidden="true" />
                    <span>{siteSettings.contact.phone || "(0717) 910-1234"}</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Mail className="w-4 h-4 text-[#D97706] shrink-0" aria-hidden="true" />
                    <span className="truncate">{siteSettings.contact.email || "sekretariat@inkindo-babel.org"}</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                    <Clock className="w-3.5 h-3.5 text-[#D97706] shrink-0" aria-hidden="true" />
                    <span>{siteSettings.contact.workingHours || "Senin - Jumat: 08:30 - 16:30 WIB"}</span>
                  </li>
                </ul>

                <div className="mt-4 pt-3 border-t border-slate-100">
                  <Link
                    href="/hubungi-kami"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0F172A] hover:text-[#D97706] transition-colors focus:outline-hidden focus-visible:underline"
                  >
                    <span>Hubungi Sekretariat</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#D97706]" aria-hidden="true" />
                  </Link>
                </div>
              </div>

            </aside>
          </div>
        </div>
      </main>

      <Footer settings={siteSettings} />
    </div>
  );
}
