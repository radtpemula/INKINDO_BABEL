import { Briefcase, Building, Calendar, ArrowRight } from "lucide-react";
import { memberWorks } from "@/data/landing";

export default function MemberWorks() {
  return (
    <section id="member-works" className="w-full bg-white py-20 border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div>
            <span className="text-xs uppercase tracking-widest text-[#24735A] font-bold block mb-2">
              Portofolio Unggulan
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#153448] tracking-tight">
              Karya & Proyek Anggota INKINDO
            </h2>
            <div className="w-12 h-1 bg-[#D6A84F] mt-4 rounded-full" />
          </div>

          <span className="text-xs text-[#52606D] mt-2 md:mt-0 max-w-sm">
            Kontribusi nyata konsultan anggota INKINDO BABEL dalam merekayasa infrastruktur, maritim, dan pembangunan kepulauan berkelanjutan.
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {memberWorks.map((work) => (
            <div
              key={work.id}
              className="bg-white rounded-lg border border-gray-200 overflow-hidden flex flex-col hover:shadow-md transition duration-200 group"
            >
              <div className="h-44 bg-[#EAF5EF] border-b border-gray-100 p-4 flex flex-col items-center justify-center text-center relative group-hover:bg-[#EAF5EF]/80 transition">
                <div className="w-10 h-10 rounded-full bg-white text-[#24735A] flex items-center justify-center shadow-xs mb-2 border border-[#24735A]/20">
                  <Briefcase className="w-5 h-5" aria-hidden="true" />
                </div>
                <span className="text-[11px] font-medium text-[#52606D] line-clamp-2 px-2">
                  {work.imagePlaceholderText}
                </span>
                <span className="absolute bottom-2 left-2 bg-white/95 backdrop-blur-xs text-[#153448] text-[10px] font-bold px-2 py-0.5 rounded border border-gray-200 shadow-2xs">
                  {work.category}
                </span>
              </div>

              <div className="p-4 flex-grow flex flex-col justify-between space-y-3">
                <h3 className="text-xs font-bold text-[#153448] group-hover:text-[#24735A] transition-colors leading-snug line-clamp-2">
                  {work.title}
                </h3>

                <div className="pt-2 border-t border-gray-100 text-[11px] text-[#52606D] space-y-1">
                  <div className="flex items-center gap-1.5 line-clamp-1">
                    <Building className="w-3.5 h-3.5 text-[#24735A] shrink-0" aria-hidden="true" />
                    <span>{work.company}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" aria-hidden="true" />
                    <span>Tahun Proyek: {work.year}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <button
            type="button"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#153448] hover:text-[#24735A] transition"
          >
            <span>Jelajahi Direktori Portofolio Lengkap</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#24735A]" aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}
