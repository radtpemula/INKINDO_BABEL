import { PartnerItem } from "@/data/landing";
import { Building2, Handshake } from "lucide-react";

interface PartnersProps {
  title?: string;
  subtitle?: string;
  partners: PartnerItem[];
  bgColor?: "white" | "gray";
  id?: string;
}

export default function Partners({
  title = "Mitra Strategis & Afiliasi Industri",
  subtitle = "MITRA STRATEGIS",
  partners,
  bgColor = "gray",
  id = "partners",
}: PartnersProps) {
  const bgClass = bgColor === "white" ? "bg-white" : "bg-[#F8FAFC]";

  return (
    <section
      id={id}
      className={`relative w-full ${bgClass} py-14 sm:py-18 border-b border-[#E2E8F0] overflow-hidden`}
    >
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-[#0F172A] text-xs font-bold tracking-wider uppercase mb-2.5">
            <Handshake className="w-3.5 h-3.5 text-[#D97706]" aria-hidden="true" />
            <span>{subtitle}</span>
          </div>

          <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-[#0F172A] tracking-tight">
            {title}
          </h2>

          <p className="text-xs sm:text-sm text-[#64748B] mt-2 max-w-lg mx-auto leading-relaxed">
            Terhubung dengan kementerian teknis, lembaga sertifikasi, dan asosiasi profesi dalam ekosistem jasa konsultansi nasional.
          </p>

          <div className="w-10 h-0.5 bg-[#D97706] mx-auto mt-3 rounded-full" />
        </div>

        <div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 items-stretch">
            {partners.map((partner) => (
              <div
                key={partner.shortName}
                className="group relative bg-white rounded-lg p-4 sm:p-5 border border-[#E2E8F0] hover:border-[#D97706]/60 shadow-xs hover:shadow-sm flex flex-col items-center justify-between text-center min-h-[120px] transition-all duration-200 ease-out"
              >
                <div className="w-9 h-9 rounded-lg bg-[#F8FAFC] group-hover:bg-[#0F172A] text-[#0F172A] group-hover:text-white flex items-center justify-center transition-colors duration-200 mb-2 border border-[#E2E8F0] shrink-0">
                  <Building2 className="w-4 h-4 transition-transform duration-200 group-hover:scale-105 text-[#D97706]" aria-hidden="true" />
                </div>

                <div className="flex-grow flex flex-col justify-center w-full">
                  <span className="text-xs font-extrabold text-[#0F172A] group-hover:text-[#D97706] transition-colors leading-snug line-clamp-1 block">
                    {partner.shortName}
                  </span>
                  <span className="text-[10px] text-[#64748B] leading-tight line-clamp-2 mt-1 block">
                    {partner.name}
                  </span>
                </div>

                <span
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-[#D97706] group-hover:w-10 transition-all duration-300 rounded-full"
                  aria-hidden="true"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
