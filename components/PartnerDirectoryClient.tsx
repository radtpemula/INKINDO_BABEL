"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { Building2, Search, ExternalLink, X, Handshake } from "lucide-react";
import { PublicPartner } from "@/lib/public/partner";

interface PartnerDirectoryClientProps {
  initialPartners: PublicPartner[];
  categories: string[];
}

export default function PartnerDirectoryClient({
  initialPartners,
  categories,
}: PartnerDirectoryClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");

  const filteredPartners = useMemo(() => {
    let result = initialPartners;

    if (selectedCategory !== "Semua") {
      result = result.filter((p) => p.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.shortName.toLowerCase().includes(q) ||
          (p.category && p.category.toLowerCase().includes(q))
      );
    }

    return result;
  }, [initialPartners, selectedCategory, searchQuery]);

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
              placeholder="Cari nama atau singkatan mitra..."
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
            Menampilkan <span className="font-bold text-[#0F172A]">{filteredPartners.length}</span> dari {initialPartners.length} mitra
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

      {filteredPartners.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredPartners.map((partner) => {
            const isValidUrl = Boolean(
              partner.websiteUrl &&
                (partner.websiteUrl.startsWith("http://") || partner.websiteUrl.startsWith("https://"))
            );

            return (
              <div
                key={partner.id}
                className="group relative bg-white rounded-xl p-5 border border-[#E2E8F0] hover:border-[#D97706]/60 shadow-xs hover:shadow-md flex flex-col justify-between transition-all duration-200"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4 min-h-[48px] sm:min-h-[56px]">
                    {partner.logoPath ? (
                      <div className="w-24 sm:w-28 h-14 sm:h-16 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] p-2 flex items-center justify-center shrink-0 overflow-hidden transition-colors group-hover:border-[#D97706]/40">
                        <Image
                          src={partner.logoPath}
                          alt={partner.name}
                          width={112}
                          height={64}
                          className="max-h-full max-w-full object-contain transition-transform duration-200 group-hover:scale-105"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] p-1.5 flex items-center justify-center shrink-0 group-hover:bg-[#0F172A] transition-colors">
                        <Building2 className="w-6 h-6 text-[#D97706]" aria-hidden="true" />
                      </div>
                    )}

                    {partner.category && (
                      <span className="text-[11px] font-semibold text-[#64748B] bg-slate-100 px-2 py-0.5 rounded-md line-clamp-1 border border-slate-200 shrink-0 max-w-[140px]">
                        {partner.category}
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-[#0F172A] group-hover:text-[#D97706] transition-colors leading-snug mb-1">
                    {partner.shortName}
                  </h3>

                  <p className="text-xs text-[#64748B] leading-relaxed line-clamp-2">
                    {partner.name}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-[#E2E8F0] flex items-center justify-between">
                  {isValidUrl && partner.websiteUrl ? (
                    <a
                      href={partner.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#D97706] hover:text-[#B45309] transition"
                    >
                      <span>Website Resmi</span>
                      <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                    </a>
                  ) : (
                    <span className="text-[11px] text-slate-400 font-medium">
                      Mitra Terverifikasi
                    </span>
                  )}

                  <span className="w-2 h-2 rounded-full bg-emerald-500" title="Status Aktif" />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-12 text-center max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3.5">
            <Handshake className="w-6 h-6" aria-hidden="true" />
          </div>
          <h3 className="text-base font-bold text-[#0F172A] mb-1">
            Tidak ada mitra kerja ditemukan
          </h3>
          <p className="text-xs text-[#64748B] mb-4">
            Tidak ditemukan mitra yang sesuai dengan kata kunci &ldquo;{searchQuery}&rdquo; atau filter yang dipilih.
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
