import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  Calendar,
  Clock,
  ArrowRight,
  Newspaper,
  Search,
  ChevronRight,
  ChevronLeft,
  X,
  Sparkles,
  ArrowLeft,
  Filter,
} from "lucide-react";
import { getPublicNewsArchive } from "@/lib/public/news";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Rilis Berita - DPP INKINDO Kepulauan Bangka Belitung",
  description:
    "Siaran pers resmi, kabar regulasi jasa konsultansi, dan warta strategis DPP INKINDO Provinsi Kepulauan Bangka Belitung.",
};

interface RilisBeritaPageProps {
  searchParams: Promise<{
    page?: string;
    kategori?: string;
    q?: string;
  }>;
}

function buildArchiveUrl(params: {
  page?: number;
  kategori?: string;
  q?: string;
}): string {
  const sp = new URLSearchParams();
  if (params.q && params.q.trim()) sp.set("q", params.q.trim());
  if (params.kategori && params.kategori !== "Semua") sp.set("kategori", params.kategori);
  if (params.page && params.page > 1) sp.set("page", params.page.toString());
  const queryStr = sp.toString();
  return queryStr ? `/berita-informasi/rilis-berita?${queryStr}` : "/berita-informasi/rilis-berita";
}

export default async function RilisBeritaPage({ searchParams }: RilisBeritaPageProps) {
  const resolvedParams = await searchParams;
  const rawPage = parseInt(resolvedParams.page || "1", 10);
  const page = isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;
  const category = (resolvedParams.kategori || "Semua").trim();
  const search = (resolvedParams.q || "").trim();

  const archiveData = await getPublicNewsArchive({
    page,
    limit: 9,
    search,
    category,
  });

  const { articles, total, totalPages, categories } = archiveData;

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />

      <main className="flex-grow">
        {/* Banner Header Halaman Arsip */}
        <section className="bg-[#0F172A] text-white py-8 sm:py-10 border-b border-slate-800">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <nav aria-label="Breadcrumb" className="mb-3">
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
                  <span className="text-white font-medium">Rilis Berita</span>
                </li>
              </ol>
            </nav>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 text-[#D97706] text-[11px] font-bold tracking-wider uppercase mb-2 border border-slate-700">
                  <Sparkles className="w-3 h-3" aria-hidden="true" />
                  <span>Publikasi Resmi</span>
                </div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight">
                  Rilis Berita & Warta Organisasi
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
                  Informasi berkala kegiatan keprofesian, sosialisasi regulasi, dan siaran pers resmi DPP INKINDO Provinsi Kepulauan Bangka Belitung.
                </p>
              </div>

              <Link
                href="/"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition self-start sm:self-auto shrink-0"
              >
                <ArrowLeft className="w-4 h-4 text-[#D97706]" aria-hidden="true" />
                <span>Kembali ke Beranda</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Konten Arsip Berita */}
        <section className="py-10 sm:py-14 bg-[#F8FAFC]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            {/* Filter & Search Bar */}
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 sm:p-6 mb-8 sm:mb-10 shadow-xs">
              <form
                method="GET"
                action="/berita-informasi/rilis-berita"
                className="space-y-4"
              >
                {category !== "Semua" && (
                  <input type="hidden" name="kategori" value={category} />
                )}

                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-grow">
                    <Search
                      className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                      aria-hidden="true"
                    />
                    <input
                      type="text"
                      name="q"
                      defaultValue={search}
                      placeholder="Cari berita berdasarkan kata kunci..."
                      className="w-full h-11 pl-10 pr-10 text-xs sm:text-sm bg-white text-[#1E293B] rounded-lg border border-[#E2E8F0] focus:border-[#D97706] focus:outline-hidden focus:ring-2 focus:ring-[#D97706]/20 transition"
                    />
                    {search && (
                      <Link
                        href={buildArchiveUrl({ kategori: category, q: "" })}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                        title="Hapus pencarian"
                      >
                        <X className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="h-11 px-6 bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-bold uppercase tracking-wider rounded-lg transition shrink-0 cursor-pointer shadow-xs"
                  >
                    Cari Berita
                  </button>
                </div>

                {/* Kategori Pills */}
                <div className="pt-2 border-t border-[#E2E8F0] flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-[#64748B] flex items-center gap-1.5 mr-1">
                    <Filter className="w-3.5 h-3.5 text-[#D97706]" aria-hidden="true" />
                    <span>Kategori:</span>
                  </span>

                  {categories.map((cat) => {
                    const isActive = category === cat;
                    const catUrl = buildArchiveUrl({
                      kategori: cat === "Semua" ? undefined : cat,
                      q: search,
                      page: 1,
                    });

                    return (
                      <Link
                        key={cat}
                        href={catUrl}
                        className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-150 ${
                          isActive
                            ? "bg-[#0F172A] text-white shadow-xs"
                            : "bg-[#F8FAFC] text-[#1E293B] hover:bg-slate-200 hover:text-[#0F172A] border border-[#E2E8F0]"
                        }`}
                      >
                        {cat}
                      </Link>
                    );
                  })}
                </div>

                {/* Indikator Filter Aktif */}
                {(search || category !== "Semua") && (
                  <div className="flex items-center justify-between text-xs text-[#64748B] pt-2 border-t border-slate-100">
                    <p>
                      Menampilkan hasil untuk:{" "}
                      {category !== "Semua" && (
                        <span className="font-semibold text-[#0F172A] mr-1.5">
                          [{category}]
                        </span>
                      )}
                      {search && (
                        <span>
                          &ldquo;<span className="font-semibold text-[#0F172A]">{search}</span>&rdquo;
                        </span>
                      )}{" "}
                      ({total} artikel ditemukan)
                    </p>

                    <Link
                      href="/berita-informasi/rilis-berita"
                      className="text-xs font-semibold text-[#D97706] hover:underline"
                    >
                      Reset Filter
                    </Link>
                  </div>
                )}
              </form>
            </div>

            {/* Grid Berita */}
            {articles.length > 0 ? (
              <div className="space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {articles.map((article) => {
                    const articleHref = article.slug
                      ? `/berita-informasi/rilis-berita/${article.slug}`
                      : "/berita-informasi/rilis-berita";

                    return (
                      <article
                        key={article.id}
                        className="group bg-white rounded-xl border border-[#E2E8F0] overflow-hidden flex flex-col justify-between hover:shadow-md hover:-translate-y-1 transition-all duration-200"
                      >
                        <div className="h-48 relative bg-[#0F172A] overflow-hidden">
                          {article.coverImagePath ? (
                            <>
                              <Image
                                src={article.coverImagePath}
                                alt={article.coverImageAlt || article.title}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A]/80 via-transparent to-transparent" />
                            </>
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
                              <div className="w-12 h-12 rounded-xl bg-slate-800 text-white flex items-center justify-center shadow-xs mb-2 border border-slate-700 group-hover:scale-105 transition-transform">
                                <Newspaper className="w-6 h-6 text-[#D97706]" aria-hidden="true" />
                              </div>
                              <span className="text-xs text-slate-300 font-medium line-clamp-1">
                                {article.coverImageAlt || "Dokumentasi Resmi"}
                              </span>
                            </div>
                          )}

                          <span className="absolute top-3 left-3 z-10 bg-[#0F172A] text-slate-200 text-[10px] font-bold px-2.5 py-1 rounded shadow-xs border border-slate-700">
                            {article.category}
                          </span>
                        </div>

                        <div className="p-5 sm:p-6 flex-grow flex flex-col justify-between space-y-4">
                          <div>
                            <div className="flex items-center gap-3 text-xs text-[#64748B] mb-2.5">
                              <span className="flex items-center gap-1.5 font-medium">
                                <Calendar className="w-3.5 h-3.5 text-[#D97706]" aria-hidden="true" />
                                <span>{article.publishedAt}</span>
                              </span>
                              <span className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                                <span>{article.readTime}</span>
                              </span>
                            </div>

                            <Link href={articleHref} className="block group-hover:text-[#D97706] transition-colors">
                              <h2 className="text-base sm:text-lg font-bold text-[#0F172A] group-hover:text-[#D97706] transition-colors leading-snug line-clamp-2">
                                {article.title}
                              </h2>
                            </Link>

                            <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed mt-2.5 line-clamp-3">
                              {article.excerpt}
                            </p>
                          </div>

                          <div className="pt-4 border-t border-[#E2E8F0] flex items-center justify-between">
                            <Link
                              href={articleHref}
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#D97706] hover:text-[#B45309] transition"
                            >
                              <span>Baca Selengkapnya</span>
                              <ArrowRight className="w-3.5 h-3.5 text-[#D97706] transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
                            </Link>
                            <span className="text-[11px] font-mono text-slate-400">
                              {article.authorName}
                            </span>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>

                {/* Kontrol Pagination */}
                {totalPages > 1 && (
                  <nav aria-label="Pagination Berita" className="pt-8 border-t border-[#E2E8F0]">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <p className="text-xs text-[#64748B]">
                        Halaman <span className="font-semibold text-[#0F172A]">{page}</span> dari{" "}
                        <span className="font-semibold text-[#0F172A]">{totalPages}</span> (Total {total} Berita)
                      </p>

                      <div className="flex items-center gap-1.5">
                        {page > 1 ? (
                          <Link
                            href={buildArchiveUrl({ page: page - 1, kategori: category, q: search })}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#E2E8F0] bg-white text-xs font-semibold text-[#1E293B] hover:bg-slate-50 transition"
                          >
                            <ChevronLeft className="w-4 h-4" />
                            <span>Sebelumnya</span>
                          </Link>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-100 text-xs font-semibold text-slate-400 cursor-not-allowed">
                            <ChevronLeft className="w-4 h-4" />
                            <span>Sebelumnya</span>
                          </span>
                        )}

                        <div className="hidden sm:flex items-center gap-1">
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                            const isCurrent = p === page;
                            return (
                              <Link
                                key={p}
                                href={buildArchiveUrl({ page: p, kategori: category, q: search })}
                                className={`w-8 h-8 rounded-lg text-xs font-bold flex items-center justify-center transition ${
                                  isCurrent
                                    ? "bg-[#0F172A] text-white shadow-xs"
                                    : "border border-[#E2E8F0] bg-white text-[#1E293B] hover:bg-slate-50"
                                }`}
                              >
                                {p}
                              </Link>
                            );
                          })}
                        </div>

                        {page < totalPages ? (
                          <Link
                            href={buildArchiveUrl({ page: page + 1, kategori: category, q: search })}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#E2E8F0] bg-white text-xs font-semibold text-[#1E293B] hover:bg-slate-50 transition"
                          >
                            <span>Berikutnya</span>
                            <ChevronRight className="w-4 h-4" />
                          </Link>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-100 text-xs font-semibold text-slate-400 cursor-not-allowed">
                            <span>Berikutnya</span>
                            <ChevronRight className="w-4 h-4" />
                          </span>
                        )}
                      </div>
                    </div>
                  </nav>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-[#E2E8F0] p-12 text-center shadow-xs">
                <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-3">
                  <Newspaper className="w-7 h-7" />
                </div>
                <h2 className="text-lg font-bold text-[#0F172A] mb-1">
                  Belum Ada Berita Ditemukan
                </h2>
                <p className="text-xs sm:text-sm text-[#64748B] max-w-md mx-auto mb-6">
                  {search || category !== "Semua"
                    ? "Tidak ditemukan warta atau rilis berita yang sesuai dengan filter atau kata kunci pencarian Anda."
                    : "Belum ada publikasi atau rilis berita yang diterbitkan saat ini. Silakan kunjungi kembali dalam waktu dekat."}
                </p>

                {(search || category !== "Semua") && (
                  <Link
                    href="/berita-informasi/rilis-berita"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-bold uppercase tracking-wider rounded-md transition shadow-xs"
                  >
                    <span>Reset Filter Pencarian</span>
                  </Link>
                )}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
