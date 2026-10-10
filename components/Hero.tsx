"use client";

import Link from "next/link";
import { ArrowRight, ShieldCheck, Compass, HardHat, FileCheck2, ChevronRight, Layers, Award } from "lucide-react";
import { heroData } from "@/data/landing";

export default function Hero() {
  return (
    <section id="hero" className="relative w-full bg-[#0F172A] text-white overflow-hidden">
      {/* Background Layer: Engineering Blueprint + Bangka Belitung Archipelago Linework */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden" aria-hidden="true">
        {/* Subtle Engineering Cad Grid Pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.06]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="cad-grid-major" width="120" height="120" patternUnits="userSpaceOnUse">
              <path d="M 120 0 L 0 0 0 120" fill="none" stroke="#FFFFFF" strokeWidth="1" />
              {/* Minor grid subdivisions */}
              <path d="M 40 0 L 40 120 M 80 0 L 80 120 M 0 40 L 120 40 M 0 80 L 120 80" fill="none" stroke="#FFFFFF" strokeWidth="0.4" strokeDasharray="2 3" opacity="0.6" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#cad-grid-major)" />
        </svg>

        {/* Technical Blueprint Linework & Dimension Lines */}
        <svg
          className="absolute inset-0 w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
        >
          {/* Engineering Horizon & Baseline Guides */}
          <line x1="0" y1="28%" x2="100%" y2="28%" stroke="#334155" strokeWidth="0.75" strokeDasharray="8 6" opacity="0.25" />
          <line x1="0" y1="74%" x2="100%" y2="74%" stroke="#334155" strokeWidth="0.75" strokeDasharray="12 8" opacity="0.2" />

          {/* Coordinate Crosshairs (Subtle CAD Markers) */}
          <g opacity="0.45">
            {/* Top Left crosshair */}
            <path d="M 48 36 L 48 48 M 42 42 L 54 42" stroke="#94A3B8" strokeWidth="1" />
            <circle cx="48" cy="42" r="1.5" fill="#D97706" />

            {/* Mid Center crosshair */}
            <path d="M 50% 28% L 50% calc(28% + 12px) M calc(50% - 6px) calc(28% + 6px) L calc(50% + 6px) calc(28% + 6px)" stroke="#94A3B8" strokeWidth="1" />
            <circle cx="50%" cy="calc(28% + 6px)" r="1.5" fill="#94A3B8" />

            {/* Bottom Right crosshair */}
            <path d="M calc(100% - 72px) 74% L calc(100% - 72px) calc(74% + 12px) M calc(100% - 78px) calc(74% + 6px) L calc(100% - 66px) calc(74% + 6px)" stroke="#94A3B8" strokeWidth="1" />
            <circle cx="calc(100% - 72px)" cy="calc(74% + 6px)" r="1.5" fill="#D97706" />
          </g>

          {/* Technical Dimension Callouts (Monospace CAD style) */}
          <g opacity="0.3" className="hidden sm:block">
            {/* Top right coordinate label */}
            <text x="calc(100% - 180px)" y="38" fill="#94A3B8" fontSize="9" fontFamily="monospace" letterSpacing="0.1em">
              SEC:BB-ENG-01
            </text>
            <text x="calc(100% - 180px)" y="50" fill="#64748B" fontSize="8" fontFamily="monospace">
              COORD 2°08&apos;S 106°07&apos;E
            </text>

            {/* Vertical tick marks on right side */}
            <line x1="calc(100% - 32px)" y1="120" x2="calc(100% - 20px)" y2="120" stroke="#334155" strokeWidth="1" />
            <line x1="calc(100% - 28px)" y1="140" x2="calc(100% - 20px)" y2="140" stroke="#334155" strokeWidth="1" />
            <line x1="calc(100% - 32px)" y1="160" x2="calc(100% - 20px)" y2="160" stroke="#334155" strokeWidth="1" />
          </g>
        </svg>

        {/* Bangka Belitung Islands Watermark Linework (Pulau Bangka & Pulau Belitung) */}
        {/* Rendered as architectural contours with low opacity to preserve reading clarity */}
        <div className="absolute right-[-4%] top-[6%] w-[720px] lg:w-[860px] h-[580px] lg:h-[640px] opacity-[0.14] pointer-events-none">
          <svg viewBox="0 0 600 500" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            {/* Marine Depth / Territorial Baseline Contour */}
            <path
              d="M 60 120 C 120 60, 260 50, 340 100 C 420 150, 520 140, 560 220 C 580 270, 520 380, 420 410 C 320 440, 160 410, 80 340 C 20 280, 20 180, 60 120 Z"
              stroke="#334155"
              strokeWidth="1"
              strokeDasharray="6 8"
            />
            <path
              d="M 100 150 C 150 100, 240 90, 310 130 C 380 170, 480 170, 510 240 C 530 280, 470 360, 390 380 C 310 400, 180 370, 120 310 C 70 260, 70 190, 100 150 Z"
              stroke="#475569"
              strokeWidth="0.75"
              strokeDasharray="3 5"
              opacity="0.6"
            />

            {/* PULAU BANGKA (Western & Central Archipelago Contour) */}
            <g>
              {/* Outer geological outline */}
              <path
                d="M 130 90 
                   C 160 85, 190 105, 205 130 
                   C 220 155, 215 185, 235 210 
                   C 250 230, 275 240, 280 265 
                   C 285 295, 265 325, 245 350 
                   C 225 375, 195 390, 170 380 
                   C 145 370, 135 345, 125 320 
                   C 115 295, 120 275, 110 250 
                   C 100 225, 80 210, 85 180 
                   C 90 150, 110 120, 130 90 Z"
                stroke="#64748B"
                strokeWidth="1.5"
                fill="none"
              />
              {/* Inner engineering terrain hatch */}
              <path
                d="M 140 120 
                   C 165 115, 185 130, 195 150 
                   C 205 170, 200 195, 215 215 
                   C 230 235, 245 250, 245 270 
                   C 245 290, 230 315, 215 335 
                   C 200 355, 175 365, 155 355 
                   C 135 345, 128 325, 120 305 
                   C 112 285, 115 265, 108 245 
                   C 100 225, 88 210, 92 185 
                   C 96 160, 120 135, 140 120 Z"
                stroke="#94A3B8"
                strokeWidth="0.75"
                strokeDasharray="2 3"
                opacity="0.5"
              />
              {/* Pangkalpinang Node (Capital Marker) */}
              <circle cx="215" cy="215" r="3.5" fill="#0F172A" stroke="#D97706" strokeWidth="1.5" />
              <circle cx="215" cy="215" r="1.5" fill="#D97706" />
              <text x="225" y="218" fill="#94A3B8" fontSize="8" fontFamily="monospace" letterSpacing="0.08em">
                PANGKALPINANG
              </text>
              {/* Muntok & Toboali Coastal Survey Anchors */}
              <circle cx="100" cy="165" r="1.75" fill="#64748B" />
              <circle cx="185" cy="370" r="1.75" fill="#64748B" />
            </g>

            {/* SELAT GASPAR (Hydrographic Axis Line connecting Bangka & Belitung) */}
            <path
              d="M 270 240 L 380 270"
              stroke="#D97706"
              strokeWidth="1"
              strokeDasharray="4 4"
              opacity="0.5"
            />
            {/* Axis midpoint cross */}
            <path d="M 325 250 L 325 260 M 320 255 L 330 255" stroke="#D97706" strokeWidth="1" opacity="0.6" />

            {/* PULAU BELITUNG (Eastern Maritime Hub Contour) */}
            <g>
              {/* Outer geological outline */}
              <path
                d="M 410 230 
                   C 435 220, 465 225, 485 240 
                   C 505 255, 515 280, 505 305 
                   C 495 330, 475 350, 450 355 
                   C 425 360, 395 345, 385 320 
                   C 375 295, 385 265, 395 245 
                   C 400 238, 405 233, 410 230 Z"
                stroke="#64748B"
                strokeWidth="1.5"
                fill="none"
              />
              {/* Inner contour */}
              <path
                d="M 420 245 
                   C 438 238, 458 242, 472 254 
                   C 486 266, 494 284, 486 302 
                   C 478 320, 462 334, 444 338 
                   C 426 342, 404 330, 396 312 
                   C 388 294, 396 272, 404 258 
                   C 410 252, 414 247, 420 245 Z"
                stroke="#94A3B8"
                strokeWidth="0.75"
                strokeDasharray="2 3"
                opacity="0.5"
              />
              {/* Tanjung Pandan Survey Node */}
              <circle cx="410" cy="265" r="3" fill="#0F172A" stroke="#D97706" strokeWidth="1.25" />
              <circle cx="410" cy="265" r="1.25" fill="#D97706" />
              <text x="420" y="268" fill="#94A3B8" fontSize="8" fontFamily="monospace" letterSpacing="0.08em">
                TG. PANDAN
              </text>
              {/* Manggar Anchor */}
              <circle cx="485" cy="285" r="1.75" fill="#64748B" />
            </g>

            {/* Kepulauan Lepar & Mendanau Satellites */}
            <circle cx="230" cy="380" r="3.5" stroke="#64748B" strokeWidth="1" fill="none" />
            <circle cx="365" cy="290" r="4" stroke="#64748B" strokeWidth="1" fill="none" />

            {/* Geodetic Legend Annotation */}
            <text x="120" y="430" fill="#64748B" fontSize="8" fontFamily="monospace" letterSpacing="0.12em" opacity="0.8">
              P. BANGKA & P. BELITUNG (PROV. KEP. BANGKA BELITUNG)
            </text>
          </svg>
        </div>
      </div>

      {/* Main 2-Column Hero Content */}
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-14 md:pt-20 md:pb-16 lg:pt-24 lg:pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          
          {/* Left Column: Headline, Narrative & CTAs (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            
            {/* Official Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#1E293B] text-slate-300 text-xs font-semibold tracking-wider uppercase mb-6 border border-slate-700">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]" aria-hidden="true" />
              <span>{heroData.badge}</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-[52px] font-black tracking-tight leading-[1.12] text-white mb-6">
              DPP INKINDO <span className="text-[#D97706]">BABEL</span>
            </h1>

            {/* Subtitle / Description */}
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed mb-8 max-w-xl font-normal">
              {heroData.subtitle}
            </p>

            {/* Action Buttons with Micro-interactions */}
            <div className="flex flex-wrap items-center gap-3.5 sm:gap-4 mb-10 w-full sm:w-auto">
              <Link
                href={heroData.primaryCtaHref}
                className="group relative inline-flex items-center justify-center gap-2 bg-[#D97706] hover:bg-[#B45309] text-white text-sm font-bold tracking-wide uppercase px-6 py-3.5 rounded-md transition-all duration-200 shadow-sm active:translate-y-0 focus:outline-hidden focus:ring-2 focus:ring-[#D97706]"
              >
                <span>{heroData.primaryCtaText}</span>
                <ArrowRight className="w-4 h-4 text-white transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
              </Link>

              <Link
                href={heroData.secondaryCtaHref}
                className="group inline-flex items-center justify-center gap-2 bg-transparent hover:bg-slate-800 text-white text-sm font-semibold tracking-wide uppercase px-6 py-3.5 rounded-md border border-slate-600 hover:border-slate-500 transition-all duration-200 active:translate-y-0 focus:outline-hidden focus:ring-2 focus:ring-slate-400"
              >
                <span>{heroData.secondaryCtaText}</span>
              </Link>
            </div>

            {/* Trust Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-6 border-t border-slate-800 w-full text-xs text-slate-300">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#D97706] shrink-0" aria-hidden="true" />
                <span>Asosiasi Resmi Terdaftar</span>
              </div>
              <div className="flex items-center gap-2.5">
                <FileCheck2 className="w-4 h-4 text-[#D97706] shrink-0" aria-hidden="true" />
                <span>Sertifikasi Standar LPJK</span>
              </div>
              <div className="flex items-center gap-2.5">
                <HardHat className="w-4 h-4 text-[#D97706] shrink-0" aria-hidden="true" />
                <span>120+ Konsultan Babel</span>
              </div>
            </div>

          </div>

          {/* Right Column: Architectural & Engineering Visual Showcase (5 Cols) */}
          <div className="lg:col-span-5 w-full">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              
              {/* Engineering Schematic Card */}
              <div className="relative rounded-xl bg-[#1E293B] p-6 sm:p-7 border border-slate-700 shadow-sm">
                
                {/* Visual Header */}
                <div className="flex items-center justify-between border-b border-slate-700 pb-4 mb-5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
                      <Compass className="w-4 h-4" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white uppercase tracking-wider">Rekayasa & Desain Konsultansi</p>
                      <p className="text-[10px] text-slate-400">Wilayah Kepulauan Bangka Belitung</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-300 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded">
                    SERUMPUN SEBALAI
                  </span>
                </div>

                {/* Technical Isometric Blueprint SVG Illustration */}
                <div className="relative h-44 sm:h-52 w-full rounded-lg bg-[#0F172A] border border-slate-800 overflow-hidden flex items-center justify-center p-3 mb-5">
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
                      stroke="#334155"
                      strokeWidth="1.5"
                      strokeDasharray="4 4"
                    />
                    <path
                      d="M10 185 Q 90 170, 180 185 T 350 180"
                      stroke="#334155"
                      strokeWidth="1"
                    />

                    {/* Coastal / Island contour geometry */}
                    <polygon
                      points="40,160 110,135 170,145 220,130 310,150 280,180 70,185"
                      fill="#1E293B"
                      stroke="#334155"
                      strokeWidth="1"
                    />

                    {/* Structural Cable Stayed Bridge / Maritime Infrastructure Frame */}
                    {/* Tower 1 */}
                    <line x1="120" y1="140" x2="120" y2="40" stroke="#D97706" strokeWidth="2.5" />
                    <line x1="125" y1="140" x2="125" y2="40" stroke="#FFFFFF" strokeWidth="1.5" />
                    <polygon points="115,40 130,40 122.5,30" fill="#D97706" />

                    {/* Tower 2 */}
                    <line x1="230" y1="135" x2="230" y2="45" stroke="#D97706" strokeWidth="2.5" />
                    <line x1="235" y1="135" x2="235" y2="45" stroke="#FFFFFF" strokeWidth="1.5" />
                    <polygon points="225,45 240,45 232.5,35" fill="#D97706" />

                    {/* Deck Girder */}
                    <line x1="40" y1="120" x2="320" y2="120" stroke="#FFFFFF" strokeWidth="2.5" />
                    <line x1="40" y1="124" x2="320" y2="124" stroke="#475569" strokeWidth="1.5" />

                    {/* Stay Cables Left Tower */}
                    <line x1="122" y1="50" x2="60" y2="120" stroke="#94A3B8" strokeWidth="1" strokeDasharray="3 2" opacity="0.7" />
                    <line x1="122" y1="65" x2="80" y2="120" stroke="#94A3B8" strokeWidth="1" opacity="0.7" />
                    <line x1="122" y1="80" x2="100" y2="120" stroke="#94A3B8" strokeWidth="1" opacity="0.7" />
                    <line x1="122" y1="50" x2="175" y2="120" stroke="#94A3B8" strokeWidth="1" strokeDasharray="3 2" opacity="0.7" />
                    <line x1="122" y1="65" x2="155" y2="120" stroke="#94A3B8" strokeWidth="1" opacity="0.7" />
                    <line x1="122" y1="80" x2="135" y2="120" stroke="#94A3B8" strokeWidth="1" opacity="0.7" />

                    {/* Stay Cables Right Tower */}
                    <line x1="232" y1="55" x2="175" y2="120" stroke="#94A3B8" strokeWidth="1" strokeDasharray="3 2" opacity="0.7" />
                    <line x1="232" y1="70" x2="195" y2="120" stroke="#94A3B8" strokeWidth="1" opacity="0.7" />
                    <line x1="232" y1="85" x2="215" y2="120" stroke="#94A3B8" strokeWidth="1" opacity="0.7" />
                    <line x1="232" y1="55" x2="300" y2="120" stroke="#94A3B8" strokeWidth="1" strokeDasharray="3 2" opacity="0.7" />
                    <line x1="232" y1="70" x2="275" y2="120" stroke="#94A3B8" strokeWidth="1" opacity="0.7" />
                    <line x1="232" y1="85" x2="250" y2="120" stroke="#94A3B8" strokeWidth="1" opacity="0.7" />

                    {/* Cad Coordinates & Dimension Lines */}
                    <circle cx="122" cy="40" r="2.5" fill="#D97706" />
                    <circle cx="232" cy="45" r="2.5" fill="#D97706" />
                    <text x="50" y="25" fill="#94A3B8" fontSize="8" fontFamily="monospace">GRID-REF: BB-106.14°E</text>
                    <text x="210" y="25" fill="#94A3B8" fontSize="8" fontFamily="monospace">INFRASTRUCTURE SPEC</text>
                  </svg>

                  {/* Micro badge overlay */}
                  <div className="absolute bottom-2.5 right-2.5 bg-[#1E293B] border border-slate-700 rounded px-2 py-1 flex items-center gap-1.5 shadow-xs">
                    <Layers className="w-3 h-3 text-slate-400" aria-hidden="true" />
                    <span className="text-[10px] font-mono text-slate-300">STRUKTUR MARITIM & SIPIL</span>
                  </div>
                </div>

                {/* Engineering Highlights Mini Grid */}
                <div className="grid grid-cols-2 gap-2.5 text-left">
                  <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/80">
                    <div className="flex items-center gap-1.5 text-slate-200 mb-0.5">
                      <Award className="w-3.5 h-3.5 text-[#D97706]" aria-hidden="true" />
                      <span className="text-xs font-bold">Terakreditasi</span>
                    </div>
                    <p className="text-[11px] text-slate-400">Standar Asosiasi Konsultan Nasional</p>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/80">
                    <div className="flex items-center gap-1.5 text-slate-200 mb-0.5">
                      <HardHat className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                      <span className="text-xs font-bold text-white">Multi Disiplin</span>
                    </div>
                    <p className="text-[11px] text-slate-400">Konstruksi, Maritim, & Lingkungan</p>
                  </div>
                </div>

              </div>

            </div>
          </div>

        </div>
      </div>

      {/* Slate Sub-Banner: Strategic Partner Statement */}
      <div className="relative w-full bg-[#1E293B] border-t border-slate-800 py-4 sm:py-5 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm sm:text-base font-semibold text-white tracking-wide text-center md:text-left">
            Menjadi Mitra Strategis Pemerintah dan Masyarakat dalam Pembangunan
          </p>
          <Link
            href="#membership-steps"
            className="group inline-flex items-center gap-1.5 border border-[#D97706] hover:bg-[#D97706] text-white text-xs font-bold tracking-wider uppercase px-4 py-2 rounded transition-all duration-200 shrink-0"
          >
            <span>Daftar Sekarang</span>
            <ChevronRight className="w-4 h-4 text-white transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
