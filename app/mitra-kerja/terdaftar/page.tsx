import { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PartnerDirectoryClient from "@/components/PartnerDirectoryClient";
import { ChevronRight } from "lucide-react";
import { getPublicPartnersForDirectory } from "@/lib/public/partner";
import { getSiteSettings } from "@/lib/public/settings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mitra Kerja Terdaftar - DPP INKINDO Kepulauan Bangka Belitung",
  description:
    "Direktori resmi mitra kerja, asosiasi industri, dan kementerian/lembaga mitra strategis DPP INKINDO Provinsi Kepulauan Bangka Belitung.",
};

export default async function MitraTerdaftarPage() {
  const [directoryData, siteSettings] = await Promise.all([
    getPublicPartnersForDirectory(),
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
                    href="/mitra-kerja/ketentuan"
                    className="hover:text-white transition-colors focus:outline-hidden focus-visible:underline"
                  >
                    Mitra Kerja
                  </Link>
                </li>
                <li className="flex items-center gap-1.5">
                  <ChevronRight className="w-3.5 h-3.5 text-[#D97706]" aria-hidden="true" />
                  <span className="text-white font-medium">Mitra Kerja Terdaftar</span>
                </li>
              </ol>
            </nav>

            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
              <span className="inline-block px-2.5 py-0.5 rounded bg-slate-800 text-[#D97706] text-xs font-semibold tracking-wider uppercase border border-slate-700">
                Kemitraan & Afiliasi
              </span>
              <h1 className="text-xl sm:text-2xl md:text-[28px] font-bold text-white tracking-tight">
                Mitra Kerja Terdaftar
              </h1>
            </div>

            <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-2xl leading-relaxed">
              Daftar mitra kerja strategis, lembaga perbankan, asosiasi profesi, dan pemangku kepentingan jasa konsultansi di Provinsi Kepulauan Bangka Belitung.
            </p>
          </div>
        </section>

        <div className="max-w-[1280px] 2xl:max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <PartnerDirectoryClient
            initialPartners={directoryData.partners}
            categories={directoryData.categories}
          />
        </div>
      </main>
      <Footer settings={siteSettings} />
    </div>
  );
}
