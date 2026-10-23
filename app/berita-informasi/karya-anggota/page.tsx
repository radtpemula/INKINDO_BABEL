import { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MemberWorkArchiveClient from "@/components/MemberWorkArchiveClient";
import { ChevronRight } from "lucide-react";
import { getPublicMemberWorksArchive } from "@/lib/public/member-work";
import { getSiteSettings } from "@/lib/public/settings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Karya Anggota - DPP INKINDO Kepulauan Bangka Belitung",
  description:
    "Portofolio dokumentasi proyek dan kontribusi nyata konsultan anggota INKINDO Provinsi Kepulauan Bangka Belitung dalam rekayasa pembangunan berkelanjutan.",
};

export default async function KaryaAnggotaPage() {
  const [archiveData, siteSettings] = await Promise.all([
    getPublicMemberWorksArchive({ limit: 50 }),
    getSiteSettings(),
  ]);

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC]">
      <Header settings={siteSettings} />
      <main className="flex-grow">
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
                  <Link
                    href="/berita-informasi/agenda-kegiatan"
                    className="hover:text-white transition-colors focus:outline-hidden focus-visible:underline"
                  >
                    Berita & Informasi
                  </Link>
                </li>
                <li className="flex items-center gap-1.5">
                  <ChevronRight className="w-3.5 h-3.5 text-[#D97706]" aria-hidden="true" />
                  <span className="text-white font-medium">Karya Anggota</span>
                </li>
              </ol>
            </nav>

            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
              <span className="inline-block px-2.5 py-0.5 rounded bg-slate-800 text-[#D97706] text-xs font-semibold tracking-wider uppercase border border-slate-700">
                Portofolio & Rekayasa
              </span>
              <h1 className="text-xl sm:text-2xl md:text-[28px] font-bold text-white tracking-tight">
                Karya & Proyek Anggota
              </h1>
            </div>

            <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-2xl leading-relaxed">
              Dokumentasi rekayasa proyek, masterplan kawasan, kajian lingkungan, dan pengawasan konstruksi yang dilaksanakan oleh badan usaha konsultan anggota INKINDO BABEL.
            </p>
          </div>
        </section>

        <div className="max-w-[1280px] 2xl:max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <MemberWorkArchiveClient
            initialWorks={archiveData.works}
            categories={archiveData.categories}
          />
        </div>
      </main>
      <Footer settings={siteSettings} />
    </div>
  );
}
