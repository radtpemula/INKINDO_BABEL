import { Check, Target, Compass, Building2 } from "lucide-react";
import { aboutData } from "@/data/landing";

export default function AboutSection() {
  return (
    <section id="about" className="w-full bg-[#F6F8F7] py-20 border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div>
              <span className="text-xs uppercase tracking-widest text-[#24735A] font-bold block mb-2">
                {aboutData.subtitle}
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#153448] tracking-tight leading-tight">
                {aboutData.title}
              </h2>
              <div className="w-12 h-1 bg-[#D6A84F] mt-4 rounded-full" />
            </div>

            <p className="text-sm text-[#1F2933] leading-relaxed">
              {aboutData.description1}
            </p>

            <p className="text-sm text-[#52606D] leading-relaxed">
              {aboutData.description2}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-2xs">
                <div className="flex items-center gap-2.5 text-[#153448] font-bold text-sm mb-2">
                  <div className="w-8 h-8 rounded-full bg-[#EAF5EF] flex items-center justify-center text-[#24735A]">
                    <Target className="w-4 h-4" aria-hidden="true" />
                  </div>
                  <span>Visi Kami</span>
                </div>
                <p className="text-xs text-[#52606D] leading-relaxed">
                  {aboutData.vision}
                </p>
              </div>

              <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-2xs">
                <div className="flex items-center gap-2.5 text-[#153448] font-bold text-sm mb-2">
                  <div className="w-8 h-8 rounded-full bg-[#EAF5EF] flex items-center justify-center text-[#24735A]">
                    <Compass className="w-4 h-4" aria-hidden="true" />
                  </div>
                  <span>Misi Strategis</span>
                </div>
                <ul className="text-xs text-[#52606D] space-y-1.5 leading-relaxed">
                  {aboutData.missions.slice(0, 2).map((m, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <Check className="w-3.5 h-3.5 text-[#24735A] shrink-0 mt-0.5" aria-hidden="true" />
                      <span>{m}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <div className="relative rounded-lg overflow-hidden bg-[#153448] text-white p-8 border-4 border-white shadow-md">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-lg bg-[#24735A] flex items-center justify-center text-white border border-[#D6A84F]/40">
                  <Building2 className="w-6 h-6 text-white" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-base font-bold">INKINDO BABEL</h3>
                  <p className="text-xs text-[#D6A84F]">Dedikasi Untuk Negeri di Serumpun Sebalai</p>
                </div>
              </div>

              <p className="text-xs text-gray-200 leading-relaxed mb-6">
                Mengintegrasikan seluruh kompetensi keinsinyuran, arsitektur, manajemen, dan studi strategis demi pembangunan Kepulauan Bangka Belitung dan Indonesia yang berkesinambungan.
              </p>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/20">
                {aboutData.stats.map((stat) => (
                  <div key={stat.label} className="bg-white/10 rounded-md p-3.5 border border-white/10">
                    <span className="text-xl font-extrabold text-[#D6A84F] block leading-tight">
                      {stat.value}
                    </span>
                    <span className="text-[11px] text-gray-200 mt-1 block">
                      {stat.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
