"use client";

import Link from "next/link";
import { ArrowRight, ShieldCheck, Compass, HardHat, FileCheck2, ChevronRight, Layers, Award } from "lucide-react";
import { heroData } from "@/data/landing";

export default function Hero() {
  return (
    <section id="hero" className="relative w-full bg-[#153448] text-white overflow-hidden">
      {/* Background Graphic & Texture */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0d2230] via-[#153448] to-[#164436] pointer-events-none" />

      {/* Subtle Blueprint Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.07] pointer-events-none">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="hero-blueprint-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#FFFFFF" strokeWidth="0.75" />
              <circle cx="0" cy="0" r="1.5" fill="#D6A84F" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hero-blueprint-grid)" />
        </svg>
      </div>

      {/* Glowing subtle ambient orbs */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#24735A]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-0 w-96 h-96 bg-[#D6A84F]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main 2-Column Hero Content */}
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-14 md:pt-20 md:pb-16 lg:pt-24 lg:pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          
          {/* Left Column: Headline, Narrative & CTAs (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            
            {/* Official Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-xs text-white text-xs font-semibold tracking-wider uppercase mb-6 border border-white/15 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#D6A84F] animate-pulse" aria-hidden="true" />
              <span className="text-gray-100">{heroData.badge}</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-[54px] font-black tracking-tight leading-[1.12] text-white mb-6">
              DPP INKINDO <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-[#EAF5EF] to-[#D6A84F]">BABEL</span>
            </h1>

            {/* Subtitle / Description */}
            <p className="text-base sm:text-lg text-gray-200/90 leading-relaxed mb-8 max-w-xl font-normal">
              {heroData.subtitle}
            </p>

            {/* Action Buttons with Micro-interactions */}
            <div className="flex flex-wrap items-center gap-3.5 sm:gap-4 mb-10 w-full sm:w-auto">
              <Link
                href={heroData.primaryCtaHref}
                className="group relative inline-flex items-center justify-center gap-2.5 bg-[#24735A] hover:bg-[#1e5f4b] text-white text-sm font-bold tracking-wide uppercase px-6 py-3.5 rounded-md transition-all duration-300 shadow-lg shadow-black/25 hover:shadow-xl hover:shadow-[#24735A]/30 hover:-translate-y-0.5 active:translate-y-0 focus:outline-hidden focus:ring-2 focus:ring-[#D6A84F]"
              >
                <span>{heroData.primaryCtaText}</span>
                <ArrowRight className="w-4 h-4 text-[#D6A84F] transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
              </Link>

              <Link
                href={heroData.secondaryCtaHref}
                className="group inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/12 text-white text-sm font-semibold tracking-wide uppercase px-6 py-3.5 rounded-md border border-white/30 hover:border-white/60 transition-all duration-300 backdrop-blur-xs hover:-translate-y-0.5 active:translate-y-0 focus:outline-hidden focus:ring-2 focus:ring-white"
              >
                <span>{heroData.secondaryCtaText}</span>
              </Link>
            </div>

            {/* Trust Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-6 border-t border-white/15 w-full text-xs text-gray-200">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#D6A84F] shrink-0" aria-hidden="true" />
                <span>Asosiasi Resmi Terdaftar</span>
              </div>
              <div className="flex items-center gap-2.5">
                <FileCheck2 className="w-4 h-4 text-[#D6A84F] shrink-0" aria-hidden="true" />
                <span>Sertifikasi Standar LPJK</span>
              </div>
              <div className="flex items-center gap-2.5">
                <HardHat className="w-4 h-4 text-[#D6A84F] shrink-0" aria-hidden="true" />
                <span>120+ Konsultan Babel</span>
              </div>
            </div>

          </div>

          {/* Right Column: Architectural & Engineering Visual Showcase (5 Cols) */}
          <div className="lg:col-span-5 w-full">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              
              {/* Decorative Blueprint Isometric Card */}
              <div className="relative rounded-2xl bg-gradient-to-b from-[#183d54]/90 to-[#122b3b]/95 p-6 sm:p-7 border border-white/15 shadow-2xl backdrop-blur-md">
                
                {/* Visual Header */}
                <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded bg-[#24735A]/30 border border-[#24735A] flex items-center justify-center text-[#D6A84F]">
                      <Compass className="w-4 h-4" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white uppercase tracking-wider">Rekayasa & Desain Konsultansi</p>
                      <p className="text-[10px] text-gray-300">Wilayah Kepulauan Bangka Belitung</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-[#D6A84F] bg-[#D6A84F]/10 border border-[#D6A84F]/30 px-2 py-0.5 rounded">
                    SERUMPUN SEBALAI
                  </span>
                </div>

                {/* Technical Isometric Blueprint SVG Illustration */}
                <div className="relative h-44 sm:h-52 w-full rounded-lg bg-[#0e212e]/70 border border-white/10 overflow-hidden flex items-center justify-center p-3 mb-5">
                  <svg
                    viewBox="0 0 360 200"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-full h-full text-white/80"
                    aria-label="Ilustrasi teknis struktur infrastruktur dan kepulauan"
                  >
                    {/* Ocean / Wave contours for Bangka Belitung archipelago context */}
                    <path
                      d="M10 170 Q 90 155, 180 170 T 350 165"
                      stroke="#24735A"
                      strokeWidth="1.5"
                      strokeDasharray="4 4"
                      opacity="0.6"
                    />
                    <path
                      d="M10 185 Q 90 170, 180 185 T 350 180"
                      stroke="#24735A"
                      strokeWidth="1"
                      opacity="0.4"
                    />

                    {/* Coastal / Island contour geometry */}
                    <polygon
                      points="40,160 110,135 170,145 220,130 310,150 280,180 70,185"
                      fill="#153448"
                      stroke="#24735A"
                      strokeWidth="1"
                      opacity="0.5"
                    />

                    {/* Structural Cable Stayed Bridge / Maritime Infrastructure Frame */}
                    {/* Tower 1 */}
                    <line x1="120" y1="140" x2="120" y2="40" stroke="#D6A84F" strokeWidth="2.5" />
                    <line x1="125" y1="140" x2="125" y2="40" stroke="#FFFFFF" strokeWidth="1.5" />
                    <polygon points="115,40 130,40 122.5,30" fill="#D6A84F" />

                    {/* Tower 2 */}
                    <line x1="230" y1="135" x2="230" y2="45" stroke="#D6A84F" strokeWidth="2.5" />
                    <line x1="235" y1="135" x2="235" y2="45" stroke="#FFFFFF" strokeWidth="1.5" />
                    <polygon points="225,45 240,45 232.5,35" fill="#D6A84F" />

                    {/* Deck Girder */}
                    <line x1="40" y1="120" x2="320" y2="120" stroke="#FFFFFF" strokeWidth="2.5" />
                    <line x1="40" y1="124" x2="320" y2="124" stroke="#24735A" strokeWidth="1.5" />

                    {/* Stay Cables Left Tower */}
                    <line x1="122" y1="50" x2="60" y2="120" stroke="#EAF5EF" strokeWidth="1" strokeDasharray="3 2" opacity="0.8" />
                    <line x1="122" y1="65" x2="80" y2="120" stroke="#EAF5EF" strokeWidth="1" opacity="0.8" />
                    <line x1="122" y1="80" x2="100" y2="120" stroke="#EAF5EF" strokeWidth="1" opacity="0.8" />
                    <line x1="122" y1="50" x2="175" y2="120" stroke="#EAF5EF" strokeWidth="1" strokeDasharray="3 2" opacity="0.8" />
                    <line x1="122" y1="65" x2="155" y2="120" stroke="#EAF5EF" strokeWidth="1" opacity="0.8" />
                    <line x1="122" y1="80" x2="135" y2="120" stroke="#EAF5EF" strokeWidth="1" opacity="0.8" />

                    {/* Stay Cables Right Tower */}
                    <line x1="232" y1="55" x2="175" y2="120" stroke="#EAF5EF" strokeWidth="1" strokeDasharray="3 2" opacity="0.8" />
                    <line x1="232" y1="70" x2="195" y2="120" stroke="#EAF5EF" strokeWidth="1" opacity="0.8" />
                    <line x1="232" y1="85" x2="215" y2="120" stroke="#EAF5EF" strokeWidth="1" opacity="0.8" />
                    <line x1="232" y1="55" x2="300" y2="120" stroke="#EAF5EF" strokeWidth="1" strokeDasharray="3 2" opacity="0.8" />
                    <line x1="232" y1="70" x2="275" y2="120" stroke="#EAF5EF" strokeWidth="1" opacity="0.8" />
                    <line x1="232" y1="85" x2="250" y2="120" stroke="#EAF5EF" strokeWidth="1" opacity="0.8" />

                    {/* Cad Coordinates & Dimension Lines */}
                    <circle cx="122" cy="40" r="3" fill="#D6A84F" />
                    <circle cx="232" cy="45" r="3" fill="#D6A84F" />
                    <text x="50" y="25" fill="#D6A84F" fontSize="8" fontFamily="monospace">GRID-REF: BB-106.14°E</text>
                    <text x="210" y="25" fill="#FFFFFF" fontSize="8" fontFamily="monospace" opacity="0.7">INFRASTRUCTURE SPEC</text>
                  </svg>

                  {/* Micro badge overlay */}
                  <div className="absolute bottom-2.5 right-2.5 bg-[#153448]/90 border border-white/20 rounded px-2 py-1 flex items-center gap-1.5 shadow-sm">
                    <Layers className="w-3 h-3 text-[#24735A]" aria-hidden="true" />
                    <span className="text-[10px] font-mono text-gray-200">STRUKTUR MARITIM & SIPIL</span>
                  </div>
                </div>

                {/* Engineering Highlights Mini Grid */}
                <div className="grid grid-cols-2 gap-2.5 text-left">
                  <div className="p-2.5 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-colors">
                    <div className="flex items-center gap-1.5 text-[#D6A84F] mb-0.5">
                      <Award className="w-3.5 h-3.5" aria-hidden="true" />
                      <span className="text-xs font-bold">Terakreditasi</span>
                    </div>
                    <p className="text-[11px] text-gray-300">Standar Asosiasi Konsultan Nasional</p>
                  </div>

                  <div className="p-2.5 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-colors">
                    <div className="flex items-center gap-1.5 text-[#24735A] mb-0.5">
                      <HardHat className="w-3.5 h-3.5 text-[#EAF5EF]" aria-hidden="true" />
                      <span className="text-xs font-bold text-white">Multi Disiplin</span>
                    </div>
                    <p className="text-[11px] text-gray-300">Konstruksi, Maritim, & Lingkungan</p>
                  </div>
                </div>

              </div>

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
            className="group inline-flex items-center gap-1.5 border border-[#D6A84F]/60 hover:border-[#D6A84F] text-white text-xs font-bold tracking-wider uppercase px-4 py-2 rounded transition-all duration-300 hover:bg-[#D6A84F]/10 shrink-0"
          >
            <span>Daftar Sekarang</span>
            <ChevronRight className="w-4 h-4 text-[#D6A84F] transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
