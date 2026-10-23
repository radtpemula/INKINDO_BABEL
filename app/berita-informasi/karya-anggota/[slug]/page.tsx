import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  Calendar,
  Building2,
  Briefcase,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  Star,
  UserCheck,
  CheckCircle2,
  Layers,
} from "lucide-react";
import {
  getPublicMemberWorkBySlug,
  getRelatedMemberWorks,
} from "@/lib/public/member-work";
import { getSiteSettings } from "@/lib/public/settings";

export const dynamic = "force-dynamic";

interface MemberWorkDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: MemberWorkDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const work = await getPublicMemberWorkBySlug(slug);

  if (!work) {
    return {
      title: "Karya Tidak Ditemukan - INKINDO BABEL",
      description: "Portofolio karya anggota yang Anda cari tidak ditemukan atau belum aktif.",
    };
  }

  const desc =
    work.description ||
    `Portofolio proyek ${work.title} yang dikerjakan oleh ${work.company} di wilayah Kepulauan Bangka Belitung.`;

  return {
    title: `${work.title} - Karya Anggota INKINDO BABEL`,
    description: desc,
    openGraph: {
      title: `${work.title} - ${work.company}`,
      description: desc,
      type: "article",
      images: work.imagePath ? [work.imagePath] : [],
    },
  };
}

export default async function MemberWorkDetailPage({ params }: MemberWorkDetailPageProps) {
  const { slug } = await params;
  const [work, siteSettings] = await Promise.all([
    getPublicMemberWorkBySlug(slug),
    getSiteSettings(),
  ]);

  if (!work) {
    notFound();
  }

  const relatedWorks = await getRelatedMemberWorks(work.category, work.id, 3);

  const paragraphs = (work.description || "")
    .split(/\r?\n\r?\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header settings={siteSettings} />

      <main className="flex-grow">
        {/* Banner Atas & Breadcrumb */}
        <section className="bg-[#0F172A] text-white py-8 sm:py-12 border-b border-slate-800">
          <div className="max-w-[1280px] 2xl:max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8">
            <nav aria-label="Breadcrumb" className="mb-4">
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
                  <span className="text-slate-400">Berita & Informasi</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <ChevronRight className="w-3.5 h-3.5 text-[#D97706]" aria-hidden="true" />
                  <Link
                    href="/berita-informasi/karya-anggota"
                    className="hover:text-white transition-colors focus:outline-hidden focus-visible:underline"
                  >
                    Karya Anggota
                  </Link>
                </li>
                <li className="flex items-center gap-1.5 truncate max-w-[200px] sm:max-w-xs md:max-w-md">
                  <ChevronRight className="w-3.5 h-3.5 text-[#D97706]" aria-hidden="true" />
                  <span className="text-slate-300 truncate" title={work.title}>
                    {work.title}
                  </span>
                </li>
              </ol>
            </nav>

            <div className="space-y-4 max-w-4xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#1E293B] border border-slate-700 text-[#D97706] text-xs font-bold uppercase tracking-wider">
                  <Layers className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{work.category}</span>
                </span>
                {work.isFeatured && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#D97706]/15 border border-[#D97706]/30 text-[#D97706] text-xs font-semibold">
                    <Star className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
                    <span>Portofolio Unggulan</span>
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-[42px] font-black text-white tracking-tight leading-tight">
                {work.title}
              </h1>

              {/* Ringkasan Meta Proyek */}
              <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-xs sm:text-sm text-slate-300 pt-3 border-t border-slate-800">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#D97706]" aria-hidden="true" />
                  <span className="font-semibold text-white">{work.company}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#D97706]" aria-hidden="true" />
                  <span>Tahun Pelaksanaan: {work.year}</span>
                </div>
                {work.client && (
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-[#D97706]" aria-hidden="true" />
                    <span>Klien: {work.client}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Konten Utama Karya */}
        <section className="py-10 sm:py-16 bg-white">
          <div className="max-w-[1280px] 2xl:max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
              {/* Kolom Kiri: Visual & Deskripsi Proyek */}
              <div className="lg:col-span-8 space-y-8">
                {/* Visual Dokumentasi Proyek */}
                <div className="relative w-full aspect-video sm:aspect-[16/9] rounded-2xl overflow-hidden bg-[#0F172A] border border-[#E2E8F0] shadow-sm">
                  {work.imagePath ? (
                    <Image
                      src={work.imagePath}
                      alt={work.imageAlt || work.title}
                      fill
                      priority
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 800px"
                    />
                  ) : (
                    /* Placeholder Blueprint CAD Arsitektural */
                    <div className="w-full h-full relative flex flex-col justify-between p-6 sm:p-8 bg-[#0F172A]">
                      <svg
                        className="absolute inset-0 w-full h-full opacity-15 pointer-events-none"
                        xmlns="http://www.w3.org/2000/svg"
                        aria-hidden="true"
                      >
                        <defs>
                          <pattern
                            id="detail-work-grid"
                            width="30"
                            height="30"
                            patternUnits="userSpaceOnUse"
                          >
                            <path
                              d="M 30 0 L 0 0 0 30"
                              fill="none"
                              stroke="#94A3B8"
                              strokeWidth="0.5"
                            />
                          </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#detail-work-grid)" />
                      </svg>

                      <div className="relative z-10 flex items-center justify-between">
                        <span className="text-[11px] font-mono tracking-widest text-[#D97706] uppercase bg-[#1E293B] px-3 py-1 rounded border border-slate-700">
                          {work.category}
                        </span>
                        <span className="text-xs font-mono text-slate-400">
                          DOC: {work.year}
                        </span>
                      </div>

                      <div className="relative z-10 my-auto text-center py-6 px-4">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-[#1E293B] border border-slate-700 flex items-center justify-center text-[#D97706] shadow-sm">
                          <Briefcase className="w-8 h-8" aria-hidden="true" />
                        </div>
                        <h3 className="text-lg sm:text-xl font-bold text-white max-w-lg mx-auto">
                          {work.imageAlt || work.title}
                        </h3>
                        <p className="text-xs text-slate-400 mt-2 font-mono">
                          DOKUMENTASI TEKNIK &middot; KONSULTANSI INKINDO BABEL
                        </p>
                      </div>

                      <div className="relative z-10 flex items-center justify-between text-[11px] text-slate-400 font-mono border-t border-slate-800 pt-3">
                        <span>PELAKSANA: {work.company}</span>
                        <span>STATUS: TERVERIFIKASI</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Deskripsi Proyek */}
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight">
                      Uraian & Ruang Lingkup Proyek
                    </h2>
                    <div className="w-12 h-1 bg-[#D97706] rounded-full mt-2" />
                  </div>

                  {paragraphs.length > 0 ? (
                    <div className="prose prose-slate max-w-none text-[#1E293B] leading-relaxed">
                      {paragraphs.map((para, index) => (
                        <p
                          key={index}
                          className="text-base sm:text-[17px] text-[#1E293B] leading-relaxed mb-5 whitespace-pre-line"
                        >
                          {para}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B] text-sm leading-relaxed space-y-3">
                      <p>
                        Proyek <strong className="text-[#0F172A]">{work.title}</strong> merupakan salah satu portofolio rekayasa dan layanan konsultansi unggulan yang dilaksanakan oleh badan usaha anggota resmi DPP INKINDO Kepulauan Bangka Belitung, <strong className="text-[#0F172A]">{work.company}</strong>.
                      </p>
                      <p>
                        Pekerjaan ini mencakup standar perencanaan teknis, telaah kelayakan, serta pengawasan berstandar profesional sesuai regulasi industri jasa konstruksi dan non-konstruksi di Indonesia.
                      </p>
                    </div>
                  )}
                </div>

                {/* Tombol Kembali */}
                <div className="pt-8 border-t border-[#E2E8F0]">
                  <Link
                    href="/berita-informasi/karya-anggota"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-[#E2E8F0] hover:bg-[#F8FAFC] text-sm font-semibold text-[#0F172A] transition"
                  >
                    <ArrowLeft className="w-4 h-4 text-[#D97706]" aria-hidden="true" />
                    <span>Kembali ke Galeri Karya Anggota</span>
                  </Link>
                </div>
              </div>

              {/* Kolom Kanan: Lembar Spesifikasi Teknis */}
              <div className="lg:col-span-4">
                <div className="sticky top-28 space-y-6">
                  <div className="bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] p-6 sm:p-7 shadow-xs">
                    <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-[#D97706] uppercase mb-4">
                      <Briefcase className="w-4 h-4" aria-hidden="true" />
                      <span>Spesifikasi Proyek</span>
                    </div>

                    <h3 className="text-lg font-black text-[#0F172A] leading-snug pb-4 border-b border-[#E2E8F0]">
                      {work.title}
                    </h3>

                    <dl className="divide-y divide-[#E2E8F0] text-xs sm:text-sm">
                      <div className="py-3.5 flex flex-col gap-1">
                        <dt className="text-[#64748B] font-medium">Perusahaan Pelaksana</dt>
                        <dd className="font-bold text-[#0F172A] flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-[#D97706] shrink-0" aria-hidden="true" />
                          <span>{work.company}</span>
                        </dd>
                      </div>

                      <div className="py-3.5 flex flex-col gap-1">
                        <dt className="text-[#64748B] font-medium">Kategori Layanan</dt>
                        <dd className="font-semibold text-[#0F172A]">{work.category}</dd>
                      </div>

                      <div className="py-3.5 flex flex-col gap-1">
                        <dt className="text-[#64748B] font-medium">Tahun Pengerjaan</dt>
                        <dd className="font-semibold text-[#0F172A]">{work.year}</dd>
                      </div>

                      {work.client && (
                        <div className="py-3.5 flex flex-col gap-1">
                          <dt className="text-[#64748B] font-medium">Klien / Pemilik Proyek</dt>
                          <dd className="font-semibold text-[#0F172A]">{work.client}</dd>
                        </div>
                      )}

                      <div className="py-3.5 flex flex-col gap-1">
                        <dt className="text-[#64748B] font-medium">Wilayah Kerja</dt>
                        <dd className="font-semibold text-[#0F172A]">Provinsi Kepulauan Bangka Belitung</dd>
                      </div>
                    </dl>

                    <div className="mt-6 pt-5 border-t border-[#E2E8F0] bg-white p-4 rounded-xl border border-slate-200">
                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
                        <span>Badan Usaha Terdaftar</span>
                      </div>
                      <p className="text-[11px] text-[#64748B] mt-1 leading-relaxed">
                        Perusahaan pelaksana berstatus badan usaha konsultan aktif dan terdaftar pada Dewan Pengurus Provinsi INKINDO Kepulauan Bangka Belitung.
                      </p>
                    </div>
                  </div>

                  {/* Banner CTA Hubungi Sekretariat */}
                  <div className="bg-[#0F172A] rounded-2xl p-6 text-white text-center space-y-3">
                    <h4 className="text-base font-bold text-white">Butuh Jasa Konsultansi Serupa?</h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Hubungi sekretariat DPP INKINDO BABEL untuk mendapatkan informasi dan rekomendasi badan usaha konsultan bersertifikasi.
                    </p>
                    <Link
                      href="/hubungi-kami"
                      className="inline-flex items-center justify-center w-full px-4 py-2.5 rounded-lg bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-bold transition shadow-xs"
                    >
                      Hubungi Sekretariat
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Rekomendasi Portofolio Lainnya */}
            {relatedWorks.length > 0 && (
              <aside className="mt-16 sm:mt-24 pt-12 border-t border-[#E2E8F0]">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight">
                      Karya Anggota Terkait
                    </h2>
                    <p className="text-xs sm:text-sm text-[#64748B] mt-1">
                      Portofolio rekayasa lainnya di kategori {work.category}
                    </p>
                  </div>
                  <Link
                    href="/berita-informasi/karya-anggota"
                    className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#D97706] hover:text-[#B45309] transition"
                  >
                    <span>Lihat Semua</span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {relatedWorks.map((rel) => (
                    <article
                      key={rel.id}
                      className="group bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] overflow-hidden flex flex-col justify-between hover:shadow-md hover:-translate-y-1 transition-all duration-200"
                    >
                      <div className="h-44 relative bg-[#0F172A] overflow-hidden">
                        {rel.imagePath ? (
                          <>
                            <Image
                              src={rel.imagePath}
                              alt={rel.imageAlt || rel.title}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-500"
                              sizes="(max-width: 768px) 100vw, 33vw"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A]/70 via-transparent to-transparent" />
                          </>
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
                            <Briefcase className="w-8 h-8 text-[#D97706] mb-2" aria-hidden="true" />
                            <span className="text-xs font-mono text-slate-300 line-clamp-2">
                              {rel.imageAlt || rel.title}
                            </span>
                          </div>
                        )}
                        <span className="absolute top-3 left-3 bg-[#0F172A] text-slate-200 text-[10px] font-bold px-2 py-0.5 rounded shadow-xs">
                          {rel.category}
                        </span>
                      </div>

                      <div className="p-5 flex-1 flex flex-col justify-between">
                        <div>
                          <p className="text-xs font-semibold text-[#D97706] mb-1">
                            {rel.year} &middot; {rel.company}
                          </p>
                          <h3 className="text-sm sm:text-base font-bold text-[#0F172A] group-hover:text-[#D97706] transition-colors line-clamp-2">
                            {rel.title}
                          </h3>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-200">
                          <Link
                            href={`/berita-informasi/karya-anggota/${rel.slug}`}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0F172A] group-hover:text-[#D97706] transition-colors"
                          >
                            <span>Lihat Detail Portofolio</span>
                            <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
                          </Link>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </aside>
            )}
          </div>
        </section>
      </main>

      <Footer settings={siteSettings} />
    </div>
  );
}
