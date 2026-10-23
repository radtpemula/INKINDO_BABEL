import Link from "next/link";
import Image from "next/image";
import { Briefcase, Building, Calendar, ArrowRight } from "lucide-react";
import { PublicMemberWork } from "@/lib/public/member-work";
import { MemberWorkItem } from "@/data/landing";

export type MemberWorkDisplayItem = PublicMemberWork | MemberWorkItem;

interface MemberWorksProps {
  initialWorks?: MemberWorkDisplayItem[];
}

export default function MemberWorks({ initialWorks }: MemberWorksProps) {
  const works = initialWorks || [];

  return (
    <section id="member-works" className="w-full bg-white py-20 sm:py-24 xl:py-28 border-b border-[#E2E8F0]">
      <div className="max-w-[1280px] 2xl:max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 sm:mb-14">
          <div>
            <span className="text-xs sm:text-[13px] uppercase tracking-widest text-[#D97706] font-bold block mb-2.5">
              Portofolio Unggulan
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-[36px] font-extrabold text-[#0F172A] tracking-tight">
              Karya & Proyek Anggota INKINDO
            </h2>
            <div className="w-14 h-1 bg-[#D97706] mt-4 rounded-full" />
          </div>

          <span className="text-xs sm:text-sm text-[#64748B] mt-3 md:mt-0 max-w-md leading-relaxed">
            Kontribusi nyata konsultan anggota INKINDO BABEL dalam merekayasa infrastruktur, maritim, dan pembangunan kepulauan berkelanjutan.
          </span>
        </div>

        {works.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-7">
            {works.map((work) => {
              const imagePath = "imagePath" in work ? work.imagePath : null;
              const imageAlt = "imageAlt" in work ? work.imageAlt : work.imagePlaceholderText;
              const slug = "slug" in work ? work.slug : null;
              const href = slug
                ? `/berita-informasi/karya-anggota/${slug}`
                : "/berita-informasi/karya-anggota";

              return (
                <Link
                  key={work.id}
                  href={href}
                  className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden flex flex-col hover:shadow-md hover:border-[#D97706]/50 transition duration-200 group focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#D97706]"
                >
                  <div className="h-48 sm:h-52 bg-[#F8FAFC] border-b border-[#E2E8F0] p-5 flex flex-col items-center justify-center text-center relative overflow-hidden group-hover:bg-slate-100 transition">
                    {imagePath ? (
                      <>
                        <Image
                          src={imagePath}
                          alt={imageAlt || work.title}
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
                          {imageAlt}
                        </span>
                      </>
                    )}

                    <span className="absolute bottom-2.5 left-2.5 bg-white/95 backdrop-blur-xs text-[#0F172A] text-[11px] font-bold px-2.5 py-0.5 rounded border border-[#E2E8F0] shadow-2xs z-10">
                      {work.category}
                    </span>
                  </div>

                  <div className="p-5 sm:p-5.5 flex-grow flex flex-col justify-between space-y-3.5">
                    <h3 className="text-sm sm:text-base font-bold text-[#0F172A] group-hover:text-[#D97706] transition-colors leading-snug line-clamp-2">
                      {work.title}
                    </h3>

                    <div className="pt-2.5 border-t border-[#E2E8F0] text-xs text-[#64748B] space-y-1.5">
                      <div className="flex items-center gap-1.5 line-clamp-1">
                        <Building className="w-4 h-4 text-[#D97706] shrink-0" aria-hidden="true" />
                        <span>{work.company}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
                        <span>Tahun Proyek: {work.year}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center text-sm text-[#64748B] bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] max-w-md mx-auto">
            Belum ada karya anggota unggulan yang ditampilkan saat ini.
          </div>
        )}

        <div className="mt-12 text-center">
          <Link
            href="/berita-informasi/karya-anggota"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#0F172A] hover:text-[#D97706] transition"
          >
            <span>Jelajahi Direktori Portofolio Lengkap</span>
            <ArrowRight className="w-4 h-4 text-[#D97706]" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
