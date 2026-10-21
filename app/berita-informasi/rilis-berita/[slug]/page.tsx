import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  Calendar,
  Clock,
  User,
  Eye,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  Bookmark,
  Newspaper,
} from "lucide-react";
import { getPublicNewsBySlug, getRelatedNews } from "@/lib/public/news";
import { getSiteSettings } from "@/lib/public/settings";

export const dynamic = "force-dynamic";

interface ArticleDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: ArticleDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getPublicNewsBySlug(slug, { incrementViews: false });

  if (!article) {
    return {
      title: "Berita Tidak Ditemukan - INKINDO BABEL",
      description: "Artikel berita yang Anda cari tidak ditemukan atau belum dipublikasikan.",
    };
  }

  return {
    title: `${article.title} - DPP INKINDO Kepulauan Bangka Belitung`,
    description: article.excerpt,
    openGraph: {
      title: article.title,
      description: article.excerpt,
      type: "article",
      publishedTime: article.publishedDateIso,
      authors: [article.authorName],
      images: article.coverImagePath ? [article.coverImagePath] : [],
    },
  };
}

export default async function ArticleDetailPage({ params }: ArticleDetailPageProps) {
  const { slug } = await params;
  const [article, siteSettings] = await Promise.all([
    getPublicNewsBySlug(slug, { incrementViews: true }),
    getSiteSettings(),
  ]);

  if (!article) {
    notFound();
  }

  const relatedArticles = await getRelatedNews(article.category, article.id, 3);

  const rawContent = article.content || article.excerpt;
  const paragraphs = rawContent
    .split(/\r?\n\r?\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header settings={siteSettings} />

      <main className="flex-grow">
        {/* Header Artikel & Breadcrumbs */}
        <section className="bg-[#0F172A] text-white py-8 sm:py-12 border-b border-slate-800">
          <div className="max-w-4xl lg:max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
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
                    href="/berita-informasi/rilis-berita"
                    className="hover:text-white transition-colors focus:outline-hidden focus-visible:underline"
                  >
                    Rilis Berita
                  </Link>
                </li>
                <li className="flex items-center gap-1.5 truncate max-w-[200px] sm:max-w-xs">
                  <ChevronRight className="w-3.5 h-3.5 text-[#D97706]" aria-hidden="true" />
                  <span className="text-slate-300 truncate" title={article.title}>
                    {article.title}
                  </span>
                </li>
              </ol>
            </nav>

            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 text-[#D97706] text-xs font-bold tracking-wider uppercase border border-slate-700">
                <Bookmark className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
                <span>{article.category}</span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight">
                {article.title}
              </h1>

              {/* Metadata Penulis & Waktu */}
              <div className="flex flex-wrap items-center gap-y-2 gap-x-5 text-xs text-slate-300 pt-2 border-t border-slate-800">
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#D97706]" aria-hidden="true" />
                  <span>{article.authorName}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#D97706]" aria-hidden="true" />
                  <span>{article.publishedAt}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                  <span>{article.readTime}</span>
                </div>
                {typeof article.views === "number" && (
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{article.views} kali dibaca</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Konten Utama Artikel */}
        <section className="py-10 sm:py-14 bg-white">
          <div className="max-w-4xl lg:max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <article className="space-y-8">
              {/* Gambar Sampul */}
              {article.coverImagePath ? (
                <figure className="space-y-2">
                  <div className="relative w-full aspect-video sm:aspect-[21/9] rounded-xl overflow-hidden bg-[#0F172A] border border-[#E2E8F0] shadow-sm">
                    <Image
                      src={article.coverImagePath}
                      alt={article.coverImageAlt || article.title}
                      fill
                      priority
                      className="object-cover"
                      sizes="(max-width: 896px) 100vw, 896px"
                    />
                  </div>
                  {article.coverImageAlt && (
                    <figcaption className="text-xs text-[#64748B] italic text-center">
                      {article.coverImageAlt}
                    </figcaption>
                  )}
                </figure>
              ) : null}

              {/* Ringkasan / Lead Paragraph */}
              <div className="p-5 sm:p-6 rounded-r-xl bg-[#F8FAFC] border-l-4 border-[#D97706] border-y border-r border-[#E2E8F0]">
                <p className="text-sm sm:text-base font-medium text-[#1E293B] leading-relaxed italic">
                  &ldquo;{article.excerpt}&rdquo;
                </p>
              </div>

              {/* Badan Teks Artikel (XSS-Safe, Preserving Paragraphs) */}
              <div className="prose prose-slate max-w-none text-[#1E293B] leading-relaxed pt-2">
                {paragraphs.map((para, index) => (
                  <p
                    key={index}
                    className="text-base sm:text-[17px] text-[#1E293B] leading-relaxed mb-6 whitespace-pre-line"
                  >
                    {para}
                  </p>
                ))}
              </div>

              {/* Bagian Bawah Artikel: Penulis & Tombol Navigasi */}
              <div className="pt-8 border-t border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#0F172A] text-white flex items-center justify-center font-bold text-sm shadow-xs border border-slate-700">
                    <Newspaper className="w-5 h-5 text-[#D97706]" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#0F172A] uppercase tracking-wide">
                      Dipublikasikan Oleh
                    </p>
                    <p className="text-sm text-[#64748B]">{article.authorName}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    href="/berita-informasi/rilis-berita"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#E2E8F0] hover:bg-[#F8FAFC] text-xs font-semibold text-[#0F172A] transition"
                  >
                    <ArrowLeft className="w-4 h-4 text-[#D97706]" aria-hidden="true" />
                    <span>Kembali ke Arsip</span>
                  </Link>
                </div>
              </div>
            </article>

            {/* Rekomendasi Warta Terkait */}
            {relatedArticles.length > 0 && (
              <aside className="mt-14 sm:mt-18 pt-10 border-t border-[#E2E8F0]">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg sm:text-xl font-black text-[#0F172A] tracking-tight">
                      Warta & Berita Terkait
                    </h2>
                    <p className="text-xs text-[#64748B] mt-0.5">
                      Publikasi seputar kategori {article.category}
                    </p>
                  </div>
                  <Link
                    href="/berita-informasi/rilis-berita"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#D97706] hover:text-[#B45309] transition"
                  >
                    <span>Lihat Semua</span>
                    <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {relatedArticles.map((rel) => {
                    const relHref = rel.slug
                      ? `/berita-informasi/rilis-berita/${rel.slug}`
                      : "/berita-informasi/rilis-berita";

                    return (
                      <article
                        key={rel.id}
                        className="group bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] overflow-hidden flex flex-col justify-between hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                      >
                        <div className="h-36 relative bg-[#0F172A] overflow-hidden">
                          {rel.coverImagePath ? (
                            <>
                              <Image
                                src={rel.coverImagePath}
                                alt={rel.coverImageAlt || rel.title}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                                sizes="(max-width: 768px) 100vw, 33vw"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A]/70 via-transparent to-transparent" />
                            </>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Newspaper className="w-8 h-8 text-[#D97706]" aria-hidden="true" />
                            </div>
                          )}
                          <span className="absolute top-2.5 left-2.5 bg-[#0F172A] text-slate-200 text-[10px] font-bold px-2 py-0.5 rounded shadow-xs">
                            {rel.category}
                          </span>
                        </div>

                        <div className="p-4 flex-grow flex flex-col justify-between space-y-2.5">
                          <div>
                            <div className="flex items-center gap-2 text-[11px] text-[#64748B] mb-1.5">
                              <Calendar className="w-3 h-3 text-[#D97706]" aria-hidden="true" />
                              <span>{rel.publishedAt}</span>
                            </div>
                            <Link href={relHref} className="block group-hover:text-[#D97706] transition-colors">
                              <h3 className="text-xs sm:text-sm font-bold text-[#0F172A] group-hover:text-[#D97706] transition-colors leading-snug line-clamp-2">
                                {rel.title}
                              </h3>
                            </Link>
                          </div>

                          <div className="pt-2 border-t border-[#E2E8F0]">
                            <Link
                              href={relHref}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-[#D97706] hover:text-[#B45309] transition"
                            >
                              <span>Baca Artikel</span>
                              <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
                            </Link>
                          </div>
                        </div>
                      </article>
                    );
                  })}
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
