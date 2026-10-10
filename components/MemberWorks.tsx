import Link from "next/link";
import { Briefcase, Building, Calendar, ArrowRight } from "lucide-react";
import { memberWorks } from "@/data/landing";

export default function MemberWorks() {
  return (
    <section id="member-works" className="w-full bg-white py-20 border-b border-[#E2E8F0]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div>
            <span className="text-xs uppercase tracking-widest text-[#D97706] font-bold block mb-2">
              Portofolio Unggulan
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0F172A] tracking-tight">
              Karya & Proyek Anggota INKINDO
            </h2>
            <div className="w-12 h-1 bg-[#D97706] mt-4 rounded-full" />
          </div>

          <span className="text-xs text-[#64748B] mt-2 md:mt-0 max-w-sm">
            Kontribusi nyata konsultan anggota INKINDO BABEL dalam merekayasa infrastruktur, maritim, dan pembangunan kepulauan berkelanjutan.
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {memberWorks.map((work) => (
            <div
              key={work.id}
              className="bg-white rounded-lg border border-[#E2E8F0] overflow-hidden flex flex-col hover:shadow-md transition duration-200 group"
            >
              <div className="h-44 bg-[#F8FAFC] border-b border-[#E2E8F0] p-4 flex flex-col items-center justify-center text-center relative group-hover:bg-slate-100 transition">
                <div className="w-10 h-10 rounded-full bg-white text-[#0F172A] flex items-center justify-center shadow-xs mb-2 border border-[#E2E8F0]">
                  <Briefcase className="w-5 h-5 text-[#D97706]" aria-hidden="true" />
                </div>
                <span className="text-[11px] font-medium text-[#64748B] line-clamp-2 px-2">
                  {work.imagePlaceholderText}
                </span>
                <span className="absolute bottom-2 left-2 bg-white/95 backdrop-blur-xs text-[#0F172A] text-[10px] font-bold px-2 py-0.5 rounded border border-[#E2E8F0] shadow-2xs">
                  {work.category}
                </span>
              </div>

              <div className="p-4 flex-grow flex flex-col justify-between space-y-3">
                <h3 className="text-xs font-bold text-[#0F172A] group-hover:text-[#D97706] transition-colors leading-snug line-clamp-2">
                  {work.title}
                </h3>

                <div className="pt-2 border-t border-[#E2E8F0] text-[11px] text-[#64748B] space-y-1">
                  <div className="flex items-center gap-1.5 line-clamp-1">
                    <Building className="w-3.5 h-3.5 text-[#D97706] shrink-0" aria-hidden="true" />
                    <span>{work.company}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                    <span>Tahun Proyek: {work.year}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/berita-informasi/karya-anggota"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#0F172A] hover:text-[#D97706] transition"
          >
            <span>Jelajahi Direktori Portofolio Lengkap</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#D97706]" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
