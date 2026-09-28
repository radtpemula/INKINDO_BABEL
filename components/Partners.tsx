import { PartnerItem } from "@/data/landing";
import { Building } from "lucide-react";

interface PartnersProps {
  title?: string;
  subtitle?: string;
  partners: PartnerItem[];
  bgColor?: "white" | "gray";
  id?: string;
}

export default function Partners({
  title = "Mitra Strategis & Afiliasi",
  subtitle = "KEMITRAAN",
  partners,
  bgColor = "gray",
  id = "partners",
}: PartnersProps) {
  const bgClass = bgColor === "white" ? "bg-white" : "bg-[#F6F8F7]";

  return (
    <section id={id} className={`w-full ${bgClass} py-16 border-b border-gray-200`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-xl mx-auto mb-10">
          <span className="text-xs uppercase tracking-widest text-[#24735A] font-bold block mb-1">
            {subtitle}
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-[#153448]">
            {title}
          </h2>
          <div className="w-10 h-0.5 bg-[#D6A84F] mx-auto mt-3" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6 items-center">
          {partners.map((partner) => (
            <div
              key={partner.shortName}
              className="bg-white p-4 sm:p-5 rounded-lg border border-gray-200/90 flex flex-col items-center justify-center text-center h-28 hover:border-[#24735A] hover:shadow-xs transition duration-200 group"
            >
              <div className="w-8 h-8 rounded-full bg-[#EAF5EF] flex items-center justify-center text-[#24735A] group-hover:text-white group-hover:bg-[#24735A] transition mb-2">
                <Building className="w-4 h-4" aria-hidden="true" />
              </div>
              <span className="text-xs font-bold text-[#153448] line-clamp-1">
                {partner.shortName}
              </span>
              <span className="text-[10px] text-[#52606D] line-clamp-2 mt-0.5">
                {partner.category || partner.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
