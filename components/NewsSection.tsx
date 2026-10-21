"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Calendar,
  Clock,
  ArrowRight,
  Newspaper,
  Search,
  X,
  Sparkles,
  ChevronRight,
  Bookmark,
} from "lucide-react";
import { newsArticles } from "@/data/landing";
import type { PublicNewsArticle } from "@/lib/public/news";

interface NewsSectionProps {
  initialArticles?: PublicNewsArticle[];
}

export default function NewsSection({ initialArticles }: NewsSectionProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");

  const articles = useMemo(() => {
    if (initialArticles && initialArticles.length > 0) {
      return initialArticles;
    }
    // ponytail: fallback to landing static articles when no DB news
    return newsArticles.map((item) => ({
      id: item.id,
      title: item.title,
      slug: null,
      category: item.category,
      excerpt: item.description,
      coverImagePath: null,
      coverImageAlt: item.imagePlaceholderText,
      authorName: "Sekretariat INKINDO BABEL",
      readTime: item.readTime,
      publishedAt: item.date,
      isFallback: true,
    }));
  }, [initialArticles]);

  const categories = useMemo(() => {
    const unique = Array.from(new Set(articles.map((a) => a.category)));
    return ["Semua", ...unique];
  }, [articles]);

  const filteredArticles = useMemo(() => {
    return articles.filter((article) => {
      const matchesCategory =
        selectedCategory === "Semua" || article.category === selectedCategory;

      if (!matchesCategory) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        article.title.toLowerCase().includes(q) ||
        article.excerpt.toLowerCase().includes(q) ||
        article.category.toLowerCase().includes(q)
      );
    });
  }, [articles, searchQuery, selectedCategory]);

  const featuredArticle = filteredArticles[0];
  const secondaryArticles = filteredArticles.slice(1);

  return (
    <section
      id="news"
      className="relative w-full bg-white py-18 sm:py-22 lg:py-26 xl:py-28 border-b border-[#E2E8F0] overflow-hidden"
    >
      <div className="relative max-w-[1280px] 2xl:max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 sm:mb-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 text-[#0F172A] text-xs sm:text-[13px] font-bold tracking-wider uppercase mb-3.5">
              <Sparkles className="w-4 h-4 text-[#D97706]" aria-hidden="true" />
              <span>Kabar Terkini & Publikasi</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-[42px] font-black text-[#0F172A] tracking-tight">
              Berita & Informasi Organisasi
            </h2>
            <p className="text-xs sm:text-sm lg:text-base text-[#64748B] mt-2.5 max-w-2xl leading-relaxed">
              Ikuti perkembangan regulasi, kegiatan musyawarah keprofesian, dan warta strategis jasa konsultansi di Kepulauan Bangka Belitung.
            </p>
            <div className="w-14 h-1 bg-[#D97706] mt-4 rounded-full" />
          </div>

          <Link
            href="/berita-informasi/rilis-berita"
            className="group inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-[#0F172A] hover:text-[#D97706] transition-colors shrink-0 self-start md:self-auto py-1"
          >
            <span>Lihat Semua Berita</span>
            <ArrowRight className="w-4 h-4 text-[#D97706] transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
          </Link>
        </div>

        <div className="mb-10 sm:mb-12 space-y-4">
          <form
            onSubmit={(e) => e.preventDefault()}
            className="relative flex items-center w-full max-w-3xl"
            role="search"
            aria-label="Pencarian berita dan artikel"
          >
            <div className="relative w-full flex items-center">
              <Search
                className="w-5 h-5 text-slate-400 absolute left-4 pointer-events-none transition-colors"
                aria-hidden="true"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari berita, artikel, atau informasi..."
                className="w-full h-12 sm:h-13 bg-white text-[#1E293B] placeholder:text-slate-400 text-xs sm:text-sm pl-12 pr-28 rounded-lg border border-[#E2E8F0] shadow-xs hover:border-slate-400 focus:border-[#D97706] focus:outline-hidden focus:ring-2 focus:ring-[#D97706]/20 transition-all duration-200"
                aria-label="Cari artikel berita"
              />

              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-24 p-1 text-slate-400 hover:text-slate-600 transition"
                  aria-label="Hapus kata kunci"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              <button
                type="submit"
                className="absolute right-1.5 h-9 sm:h-10 px-4 sm:px-5 bg-[#D97706] hover:bg-[#B45309] text-white text-xs sm:text-sm font-bold tracking-wide uppercase rounded-md transition-all duration-200 flex items-center justify-center gap-1.5 shadow-xs hover:shadow-md active:translate-y-0.5 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-[#D97706]"
              >
                <span>Cari</span>
              </button>
            </div>
          </form>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-md tracking-wide transition-all duration-200 whitespace-nowrap cursor-pointer ${
                    isActive
                      ? "bg-[#0F172A] text-white shadow-xs"
                      : "bg-[#F8FAFC] text-[#1E293B] hover:bg-slate-200 hover:text-[#0F172A] border border-[#E2E8F0]"
                  }`}
                >
                  {cat === "Semua" ? "Semua Kategori" : cat}
                </button>
              );
            })}
          </div>

          {(searchQuery || selectedCategory !== "Semua") && (
            <div className="flex items-center justify-between text-xs text-[#64748B] pt-1">
              <p>
                Menampilkan hasil untuk:{" "}
                {selectedCategory !== "Semua" && (
                  <span className="font-semibold text-[#0F172A] mr-1">
                    [{selectedCategory}]
                  </span>
                )}
                {searchQuery && (
                  <span>
                    &ldquo;<span className="font-semibold text-[#0F172A]">{searchQuery}</span>&rdquo;
                  </span>
                )}{" "}
                ({filteredArticles.length} artikel ditemukan)
              </p>

              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("Semua");
                }}
                className="text-xs font-semibold text-[#D97706] hover:underline cursor-pointer"
              >
                Reset Filter
              </button>
            </div>
          )}
        </div>

        {filteredArticles.length > 0 ? (
          <div className="space-y-8 sm:space-y-10">
            {featuredArticle && (() => {
              const featuredHref = featuredArticle.slug
                ? `/berita-informasi/rilis-berita/${featuredArticle.slug}`
                : "/berita-informasi/rilis-berita";

              return (
                <article className="group relative bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] overflow-hidden hover:shadow-lg transition-all duration-300">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 items-stretch">
                    <div className="lg:col-span-7 relative min-h-[240px] sm:min-h-[320px] lg:min-h-[380px] xl:min-h-[420px] bg-[#0F172A] flex flex-col items-center justify-center p-8 sm:p-10 text-center overflow-hidden">
                      {featuredArticle.coverImagePath ? (
                        <>
                          <Image
                            src={featuredArticle.coverImagePath}
                            alt={featuredArticle.coverImageAlt || featuredArticle.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                            sizes="(max-width: 1024px) 100vw, 60vw"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A]/90 via-[#0F172A]/40 to-transparent" />
                        </>
                      ) : (
                        <>
                          <div className="absolute inset-0 opacity-10 pointer-events-none">
                            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                              <defs>
                                <pattern id="featured-grid" width="32" height="32" patternUnits="userSpaceOnUse">
                                  <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#FFFFFF" strokeWidth="0.75" />
                                </pattern>
                              </defs>
                              <rect width="100%" height="100%" fill="url(#featured-grid)" />
                            </svg>
                          </div>

                          <div className="relative z-10 w-18 h-18 rounded-2xl bg-slate-800 text-white border border-slate-700 flex items-center justify-center mb-3.5 shadow-md group-hover:scale-105 transition-transform duration-300">
                            <Newspaper className="w-9 h-9 text-[#D97706]" aria-hidden="true" />
                          </div>

                          <p className="relative z-10 text-xs sm:text-sm lg:text-base font-semibold text-slate-200 max-w-md">
                            {featuredArticle.coverImageAlt || "Dokumentasi Publikasi INKINDO BABEL"}
                          </p>
                        </>
                      )}

                      <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 bg-[#D97706] text-white text-[11px] sm:text-xs font-black tracking-wider uppercase px-3 py-1 rounded-md shadow-xs">
                        <Bookmark className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
                        <span>ARTIKEL UTAMA</span>
                      </div>

                      <div className="absolute bottom-4 left-4 z-10 bg-slate-900/80 backdrop-blur-xs text-slate-300 text-xs px-3 py-1 rounded border border-slate-700">
                        {featuredArticle.category}
                      </div>
                    </div>

                    <div className="lg:col-span-5 p-7 sm:p-9 lg:p-11 flex flex-col justify-between bg-white">
                      <div>
                        <div className="flex items-center gap-4 text-xs sm:text-[13px] text-[#64748B] mb-3.5">
                          <span className="flex items-center gap-1.5 font-medium">
                            <Calendar className="w-4 h-4 text-[#D97706]" aria-hidden="true" />
                            <span>{featuredArticle.publishedAt}</span>
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-slate-400" aria-hidden="true" />
                            <span>{featuredArticle.readTime}</span>
                          </span>
                        </div>

                        <Link href={featuredHref} className="block group-hover:text-[#D97706] transition-colors">
                          <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-[#0F172A] group-hover:text-[#D97706] transition-colors leading-snug mb-4">
                            {featuredArticle.title}
                          </h3>
                        </Link>

                        <p className="text-xs sm:text-sm lg:text-base text-[#64748B] leading-relaxed line-clamp-4">
                          {featuredArticle.excerpt}
                        </p>
                      </div>

                      <div className="pt-6 mt-6 border-t border-[#E2E8F0] flex items-center justify-between">
                        <Link
                          href={featuredHref}
                          className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-[#D97706] hover:text-[#B45309] transition-colors"
                        >
                          <span>Baca Selengkapnya</span>
                          <ChevronRight className="w-4 h-4 text-[#D97706] transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
                        </Link>
                        <span className="text-[11px] sm:text-xs font-mono text-slate-400 uppercase">
                          {featuredArticle.authorName}
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })()}

            {secondaryArticles.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4 pt-4 border-t border-[#E2E8F0]">
                  <h4 className="text-sm font-bold text-[#0F172A] tracking-tight uppercase">
                    Warta Terkait Lainnya
                  </h4>
                  <span className="text-xs text-[#64748B]">
                    {secondaryArticles.length} Berita
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                  {secondaryArticles.map((article) => {
                    const articleHref = article.slug
                      ? `/berita-informasi/rilis-berita/${article.slug}`
                      : "/berita-informasi/rilis-berita";

                    return (
                      <article
                        key={article.id}
                        className="group bg-white rounded-xl border border-[#E2E8F0] overflow-hidden flex flex-col justify-between hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                      >
                        <div className="h-48 sm:h-54 xl:h-60 bg-[#F8FAFC] border-b border-[#E2E8F0] flex flex-col items-center justify-center p-5 text-center relative overflow-hidden group-hover:bg-slate-100 transition-colors">
                          {article.coverImagePath ? (
                            <>
                              <Image
                                src={article.coverImagePath}
                                alt={article.coverImageAlt || article.title}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                                sizes="(max-width: 768px) 100vw, 50vw"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A]/80 via-transparent to-transparent" />
                            </>
                          ) : (
                            <>
                              <div className="w-12 h-12 rounded-xl bg-white text-[#0F172A] flex items-center justify-center shadow-xs mb-2 border border-[#E2E8F0] group-hover:scale-105 transition-transform duration-200">
                                <Newspaper className="w-6 h-6 text-[#D97706]" aria-hidden="true" />
                              </div>
                              <span className="text-xs sm:text-[13px] font-medium text-[#64748B] max-w-xs line-clamp-1">
                                {article.coverImageAlt || "Dokumentasi Publikasi"}
                              </span>
                            </>
                          )}
                          <span className="absolute top-3.5 left-3.5 z-10 bg-[#0F172A] text-slate-200 text-[11px] font-bold px-2.5 py-1 rounded shadow-xs">
                            {article.category}
                          </span>
                        </div>

                        <div className="p-6 sm:p-7 flex-grow flex flex-col justify-between space-y-3.5">
                          <div>
                            <div className="flex items-center gap-3 text-xs text-[#64748B] mb-2.5">
                              <span className="flex items-center gap-1.5 font-medium">
                                <Calendar className="w-4 h-4 text-[#D97706]" aria-hidden="true" />
                                <span>{article.publishedAt}</span>
                              </span>
                              <span className="flex items-center gap-1.5">
                                <Clock className="w-4 h-4 text-slate-400" aria-hidden="true" />
                                <span>{article.readTime}</span>
                              </span>
                            </div>

                            <Link href={articleHref} className="block group-hover:text-[#D97706] transition-colors">
                              <h3 className="text-base sm:text-lg font-bold text-[#0F172A] group-hover:text-[#D97706] transition-colors leading-snug line-clamp-2">
                                {article.title}
                              </h3>
                            </Link>

                            <p className="text-xs sm:text-[13.5px] text-[#64748B] leading-relaxed mt-2 line-clamp-2">
                              {article.excerpt}
                            </p>
                          </div>

                          <div className="pt-3.5 border-t border-[#E2E8F0] flex items-center justify-between">
                            <Link
                              href={articleHref}
                              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#0F172A] hover:text-[#D97706] transition"
                            >
                              <span>Baca Selengkapnya</span>
                              <ArrowRight className="w-3.5 h-3.5 text-[#D97706] transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
                            </Link>
                            <span className="text-[11px] sm:text-xs font-mono text-slate-400">
                              {article.authorName}
                            </span>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="w-full bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] p-12 text-center my-6">
            <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center text-slate-400 mx-auto mb-3 shadow-xs border border-[#E2E8F0]">
              <Newspaper className="w-7 h-7" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-[#0F172A] mb-1">
              Artikel tidak ditemukan
            </h3>
            <p className="text-xs sm:text-sm text-[#64748B] max-w-md mx-auto mb-5">
              Tidak ditemukan artikel atau informasi yang cocok dengan kriteria pencarian Anda. Silakan ubah kata kunci atau pilih kategori lain.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("Semua");
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-bold uppercase tracking-wider rounded-md transition-all duration-200 shadow-xs cursor-pointer"
            >
              <span>Reset Pencarian</span>
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
