import Link from "next/link";
import {
  Target,
  Compass,
  Building2,
  ShieldCheck,
  Award,
  ArrowRight,
  Sparkles,
  Layers,
} from "lucide-react";
import { aboutData } from "@/data/landing";

export default function AboutSection() {
  return (
    <section
      id="about"
      className="relative w-full bg-[#F8FAFC] py-18 sm:py-24 border-b border-[#E2E8F0] overflow-hidden"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
          
          <div className="lg:col-span-5">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              <div className="relative rounded-2xl bg-[#0F172A] text-white p-7 sm:p-9 shadow-xl border border-slate-700 overflow-hidden">
                <div className="absolute inset-0 opacity-10 pointer-events-none">
                  <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <pattern id="about-blueprint-grid" width="24" height="24" patternUnits="userSpaceOnUse">
                        <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#FFFFFF" strokeWidth="0.6" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#about-blueprint-grid)" />
                  </svg>
                </div>

                <div className="relative z-10 flex items-center justify-between pb-6 border-b border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-[#1E293B] flex items-center justify-center text-white border border-slate-700 shadow-sm">
                      <Building2 className="w-6 h-6 text-[#D97706]" aria-hidden="true" />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-[#D97706] uppercase tracking-wider block">
                        Badan Organisasi
                      </span>
                      <h3 className="text-base font-black text-white leading-tight">
                        DPP INKINDO BABEL
                      </h3>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 text-[10px] font-mono border border-slate-700 uppercase">
                    Kep. Babel
                  </span>
                </div>

                <div className="relative z-10 my-7 py-5 px-5 rounded-xl bg-slate-800/80 border border-slate-700">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#D97706] uppercase tracking-wider mb-2">
                    <Layers className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Integritas Profesi Jasa Konsultansi</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Mewadahi seluruh konsultan perencana, pengawas, manajemen proyek, dan studi kelayakan di Provinsi Kepulauan Bangka Belitung untuk karya konstruksi yang akuntabel.
                  </p>
                </div>

                <div className="relative z-10 grid grid-cols-2 gap-3 pt-2">
                  {aboutData.stats.slice(0, 4).map((stat) => (
                    <div
                      key={stat.label}
                      className="bg-slate-800/50 hover:bg-slate-800 transition-colors p-3.5 rounded-lg border border-slate-700"
                    >
                      <span className="text-xl sm:text-2xl font-black text-[#D97706] block leading-none mb-1">
                        {stat.value}
                      </span>
                      <span className="text-[11px] text-slate-300 leading-snug block font-medium">
                        {stat.label}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="relative z-10 mt-6 pt-4 border-t border-slate-700 flex items-center justify-between text-[11px] text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#D97706]" aria-hidden="true" />
                    <span>Terakreditasi LPJK PUPR</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-[#D97706]" aria-hidden="true" />
                    <span>Standar BNSP</span>
                  </span>
                </div>
              </div>

              <div className="absolute -bottom-4 -right-4 -z-10 w-full h-full rounded-2xl bg-slate-200/50 border border-slate-300 pointer-events-none" />
            </div>
          </div>

          <div className="lg:col-span-7 space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-200/70 text-[#0F172A] text-xs font-bold tracking-wider uppercase mb-3">
                <Sparkles className="w-3.5 h-3.5 text-[#D97706]" aria-hidden="true" />
                <span>{aboutData.subtitle}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#0F172A] tracking-tight leading-tight">
                {aboutData.title}
              </h2>
              <div className="w-12 h-1 bg-[#D97706] mt-4 rounded-full" />
            </div>

            <p className="text-sm sm:text-base text-[#1E293B] leading-relaxed font-medium">
              {aboutData.description1}
            </p>

            <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
              {aboutData.description2}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-xs hover:border-slate-400 transition-colors">
                <div className="flex items-center gap-2.5 text-[#0F172A] font-bold text-sm mb-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center text-[#D97706]">
                    <Target className="w-4 h-4" aria-hidden="true" />
                  </div>
                  <span>Visi Organisasi</span>
                </div>
                <p className="text-xs text-[#64748B] leading-relaxed">
                  {aboutData.vision}
                </p>
              </div>

              <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-xs hover:border-slate-400 transition-colors">
                <div className="flex items-center gap-2.5 text-[#0F172A] font-bold text-sm mb-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center text-[#D97706]">
                    <Compass className="w-4 h-4" aria-hidden="true" />
                  </div>
                  <span>Misi Strategis</span>
                </div>
                <ul className="text-xs text-[#64748B] space-y-1.5 leading-relaxed">
                  {aboutData.missions.slice(0, 2).map((m, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#D97706] shrink-0 mt-1.5" />
                      <span>{m}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <Link
                href="/tentang-kami/profil"
                className="group inline-flex items-center justify-center gap-2.5 bg-[#D97706] hover:bg-[#B45309] text-white text-xs sm:text-sm font-bold uppercase tracking-wider px-6 py-3.5 rounded-lg shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#D97706]"
              >
                <span>Kenali INKINDO BABEL</span>
                <ArrowRight className="w-4 h-4 text-white transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
              </Link>

              <Link
                href="/hubungi-kami"
                className="inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-[#0F172A] text-xs sm:text-sm font-bold uppercase tracking-wider px-6 py-3.5 rounded-lg border border-[#E2E8F0] transition-colors duration-200 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#D97706]"
              >
                <span>Hubungi Sekretariat</span>
              </Link>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
