"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Briefcase, Building, Calendar, Search, X, ArrowRight, UserCheck } from "lucide-react";
import { PublicMemberWork } from "@/lib/public/member-work";

interface MemberWorkArchiveClientProps {
  initialWorks: PublicMemberWork[];
  categories: string[];
}

export default function MemberWorkArchiveClient({
  initialWorks,
  categories,
}: MemberWorkArchiveClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");

  const filteredWorks = useMemo(() => {
    let result = initialWorks;

    if (selectedCategory !== "Semua") {
      result = result.filter((w) => w.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (w) =>
          w.title.toLowerCase().includes(q) ||
          w.company.toLowerCase().includes(q) ||
          w.category.toLowerCase().includes(q) ||
          w.year.toLowerCase().includes(q) ||
          (w.client && w.client.toLowerCase().includes(q))
      );
    }

    return result;
  }, [initialWorks, selectedCategory, searchQuery]);

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 sm:p-7 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="relative flex-grow max-w-lg">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" aria-hidden="true" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari judul proyek, perusahaan, atau tahun..."
              className="w-full pl-10 pr-10 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm text-[#0F172A] placeholder-slate-400 focus:outline-hidden focus:border-[#D97706] focus:ring-2 focus:ring-[#D97706]/20 transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-[#0F172A] cursor-pointer"
                title="Hapus pencarian"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
          </div>

          <div className="text-xs sm:text-sm text-[#64748B] font-medium">
            Menampilkan <span className="font-bold text-[#0F172A]">{filteredWorks.length}</span> dari {initialWorks.length} karya
          </div>
        </div>

        {categories.length > 1 && (
          <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-[#E2E8F0]">
            <span className="text-xs text-[#64748B] font-semibold mr-1">Kategori:</span>
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    isSelected
                      ? "bg-[#0F172A] text-white shadow-xs"
                      : "bg-[#F8FAFC] text-[#64748B] hover:text-[#0F172A] hover:bg-slate-200/60"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {filteredWorks.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredWorks.map((work) => {
            const href = `/berita-informasi/karya-anggota/${work.slug}`;

            return (
              <Link
                key={work.id}
                href={href}
                className="group bg-white rounded-xl border border-[#E2E8F0] overflow-hidden flex flex-col hover:shadow-md hover:border-[#D97706]/50 transition duration-200 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#D97706]"
              >
                <div className="h-48 sm:h-52 bg-[#F8FAFC] border-b border-[#E2E8F0] p-5 flex flex-col items-center justify-center text-center relative overflow-hidden group-hover:bg-slate-100 transition">
                  {work.imagePath ? (
                    <>
                      <Image
                        src={work.imagePath}
                        alt={work.imageAlt || work.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A]/70 via-[#0F172A]/20 to-transparent" />
                    </>
                  ) : (
                    <>
                      <div className="w-11 h-11 rounded-full bg-white text-[#0F172A] flex items-center justify-center shadow-xs mb-2.5 border border-[#E2E8F0] shrink-0">
                        <Briefcase className="w-5 h-5 text-[#D97706]" aria-hidden="true" />
                      </div>
                      <span className="text-xs font-medium text-[#64748B] line-clamp-2 px-2 z-10">
                        {work.imageAlt || work.title}
                      </span>
                    </>
                  )}

                  <span className="absolute bottom-2.5 left-2.5 bg-white/95 backdrop-blur-xs text-[#0F172A] text-[11px] font-bold px-2.5 py-0.5 rounded border border-[#E2E8F0] shadow-2xs z-10">
                    {work.category}
                  </span>

                  {work.isFeatured && (
                    <span className="absolute top-2.5 right-2.5 bg-[#D97706] text-white text-[10px] font-black px-2 py-0.5 rounded shadow-xs z-10 uppercase tracking-wider">
                      Unggulan
                    </span>
                  )}
                </div>

                <div className="p-5 flex-grow flex flex-col justify-between space-y-3.5">
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-[#0F172A] group-hover:text-[#D97706] transition-colors leading-snug line-clamp-2 mb-2">
                      {work.title}
                    </h3>
                  </div>

                  <div className="pt-2.5 border-t border-[#E2E8F0] text-xs text-[#64748B] space-y-1.5">
                    <div className="flex items-center gap-1.5 line-clamp-1">
                      <Building className="w-4 h-4 text-[#D97706] shrink-0" aria-hidden="true" />
                      <span className="font-medium text-[#0F172A]">{work.company}</span>
                    </div>

                    <div className="flex items-center justify-between text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
                        <span>Tahun: {work.year}</span>
                      </div>

                      {work.client && (
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 max-w-[120px] truncate" title={`Klien: ${work.client}`}>
                          <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                          <span className="truncate">{work.client}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-1 flex items-center justify-end text-xs font-semibold text-[#D97706] group-hover:text-[#B45309]">
                    <span className="inline-flex items-center gap-1">
                      Lihat Detail <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-12 text-center max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3.5">
            <Briefcase className="w-6 h-6" aria-hidden="true" />
          </div>
          <h3 className="text-base font-bold text-[#0F172A] mb-1">
            Tidak ada karya ditemukan
          </h3>
          <p className="text-xs text-[#64748B] mb-4">
            Tidak ditemukan karya yang sesuai dengan kata kunci &ldquo;{searchQuery}&rdquo; atau filter kategori yang dipilih.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("Semua");
            }}
            className="px-4 py-2 bg-[#0F172A] text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            Reset Pencarian
          </button>
        </div>
      )}
    </div>
  );
}
