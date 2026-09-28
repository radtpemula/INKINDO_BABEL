"use client";

import Link from "next/link";
import { Search, ArrowRight, ShieldCheck, FileText, CheckCircle2, ChevronRight } from "lucide-react";
import { heroData } from "@/data/landing";

export default function Hero() {
  return (
    <section id="hero" className="relative w-full bg-[#153448] text-white">
      {/* Background Graphic & Texture */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0f2534] via-[#153448] to-[#1c5b47] pointer-events-none" />
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid-pattern" width="48" height="48" patternUnits="userSpaceOnUse">
              <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#FFFFFF" strokeWidth="0.75" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-pattern)" />
        </svg>
      </div>

      {/* Main Hero Content */}
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-16 md:pt-24 md:pb-20">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-white text-xs font-semibold tracking-wider uppercase mb-5 border border-white/20">
            <span className="w-2 h-2 rounded-full bg-[#D6A84F]" aria-hidden="true" />
            <span>{heroData.badge}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight text-white mb-6">
            {heroData.title}
          </h1>

          <p className="text-base sm:text-lg text-gray-200 leading-relaxed mb-8 max-w-2xl font-light">
            {heroData.subtitle}
          </p>

          <div className="flex flex-wrap items-center gap-4 mb-10">
            <Link
              href={heroData.primaryCtaHref}
              className="inline-flex items-center gap-2 bg-[#24735A] hover:bg-[#1c5b47] text-white text-sm font-bold tracking-wide uppercase px-6 py-3.5 rounded-md transition shadow-lg shadow-black/20 focus:outline-hidden focus:ring-2 focus:ring-[#D6A84F]"
            >
              <span>{heroData.primaryCtaText}</span>
              <ArrowRight className="w-4 h-4 text-[#D6A84F]" aria-hidden="true" />
            </Link>

            <Link
              href={heroData.secondaryCtaHref}
              className="inline-flex items-center gap-2 bg-transparent hover:bg-white/10 text-white text-sm font-semibold tracking-wide uppercase px-6 py-3.5 rounded-md border-2 border-white/40 transition focus:outline-hidden focus:ring-2 focus:ring-white"
            >
              <span>{heroData.secondaryCtaText}</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-white/15 text-xs text-gray-200">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-[#D6A84F] shrink-0" aria-hidden="true" />
              <span>Asosiasi Resmi Terdaftar</span>
            </div>
            <div className="flex items-center gap-2.5">
              <FileText className="w-4 h-4 text-[#D6A84F] shrink-0" aria-hidden="true" />
              <span>Sertifikasi Standar LPJK</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#D6A84F] shrink-0" aria-hidden="true" />
              <span>120+ Badan Usaha Anggota</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navy Sub-Banner: Strategic Partner Statement */}
      <div className="relative w-full bg-[#0f2534] border-t border-white/10 py-4 sm:py-5 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm sm:text-base font-semibold text-white tracking-wide text-center md:text-left">
            Menjadi Mitra Strategis Pemerintah dan Masyarakat dalam Pembangunan
          </p>
          <Link
            href="#membership-steps"
            className="inline-flex items-center gap-1.5 border border-[#D6A84F]/60 hover:border-[#D6A84F] text-white text-xs font-bold tracking-wider uppercase px-4 py-2 rounded transition hover:bg-white/10 shrink-0"
          >
            <span>Daftar Sekarang</span>
            <ChevronRight className="w-4 h-4 text-[#D6A84F]" aria-hidden="true" />
          </Link>
        </div>
      </div>

      {/* Full-Width Search Ribbon */}
      <div className="w-full bg-[#EAF5EF] border-b border-gray-200 py-4 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <form
            onSubmit={(e) => e.preventDefault()}
            className="w-full flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
            role="search"
            aria-label="Pencarian keanggotaan"
          >
            <div className="relative flex-grow">
              <Search className="w-4 h-4 text-[#52606D] absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
              <input
                type="text"
                placeholder={heroData.searchPlaceholder}
                className="w-full bg-white text-[#1F2933] placeholder:text-[#52606D] text-xs sm:text-sm pl-10 pr-4 py-2.5 sm:py-3 rounded border border-gray-300 focus:outline-hidden focus:ring-2 focus:ring-[#24735A] transition"
                aria-label="Cari nomor anggota atau nama perusahaan"
              />
            </div>
            <button
              type="submit"
              className="bg-[#24735A] hover:bg-[#1c5b47] text-white text-xs font-bold tracking-wider uppercase px-6 py-2.5 sm:py-3 rounded transition shrink-0 flex items-center justify-center gap-2 shadow-xs cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-[#D6A84F]"
            >
              <Search className="w-3.5 h-3.5 text-[#D6A84F]" aria-hidden="true" />
              <span>{heroData.searchButtonText}</span>
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
