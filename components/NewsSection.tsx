import Link from "next/link";
import { Calendar, Clock, ArrowRight, Newspaper } from "lucide-react";
import { newsArticles } from "@/data/landing";

export default function NewsSection() {
  return (
    <section id="news" className="w-full bg-white py-20 border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div>
            <span className="text-xs uppercase tracking-widest text-[#24735A] font-bold block mb-2">
              Kabar Terkini
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#153448] tracking-tight">
              Berita & Informasi Organisasi
            </h2>
            <div className="w-12 h-1 bg-[#D6A84F] mt-4 rounded-full" />
          </div>

          <Link
            href="#news"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#153448] hover:text-[#24735A] transition mt-4 md:mt-0"
          >
            <span>Lihat Semua Berita</span>
            <ArrowRight className="w-4 h-4 text-[#24735A]" aria-hidden="true" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {newsArticles.map((article) => (
            <article
              key={article.id}
              className="bg-white rounded-lg border border-gray-200 overflow-hidden flex flex-col hover:shadow-md transition duration-200 group"
            >
              <div className="h-48 bg-[#EAF5EF] border-b border-gray-100 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden group-hover:bg-[#EAF5EF]/80 transition">
                <div className="w-12 h-12 rounded-full bg-white text-[#24735A] flex items-center justify-center shadow-xs mb-2 border border-[#24735A]/20">
                  <Newspaper className="w-6 h-6" aria-hidden="true" />
                </div>
                <span className="text-xs font-medium text-[#52606D] max-w-xs">
                  {article.imagePlaceholderText}
                </span>
                <span className="absolute top-3 left-3 bg-[#153448] text-[#D6A84F] text-[10px] font-bold px-2.5 py-1 rounded">
                  {article.category}
                </span>
              </div>

              <div className="p-6 flex-grow flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center gap-4 text-[11px] text-[#52606D] mb-2.5">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-[#24735A]" aria-hidden="true" />
                      <span>{article.date}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-gray-400" aria-hidden="true" />
                      <span>{article.readTime}</span>
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-[#153448] group-hover:text-[#24735A] transition-colors leading-snug line-clamp-2">
                    {article.title}
                  </h3>

                  <p className="text-xs text-[#52606D] leading-relaxed mt-2.5 line-clamp-3">
                    {article.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-gray-100">
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#153448] group-hover:text-[#24735A] transition">
                    <span>Baca Selengkapnya</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#24735A]" aria-hidden="true" />
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
