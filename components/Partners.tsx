import Image from "next/image";
import { Building2, Handshake, ExternalLink, ChevronRight } from "lucide-react";
import { PublicPartner } from "@/lib/public/partner";
import { PartnerItem } from "@/data/landing";

export type PartnerDisplayItem = PublicPartner | PartnerItem;

interface PartnersProps {
  title?: string;
  subtitle?: string;
  partners: PartnerDisplayItem[];
  bgColor?: "white" | "gray";
  id?: string;
}

interface PartnerCardProps {
  partner: PartnerDisplayItem;
  isDuplicate?: boolean;
}

function PartnerCard({ partner, isDuplicate = false }: PartnerCardProps) {
  const logoPath = "logoPath" in partner ? partner.logoPath : null;
  const websiteUrl = "websiteUrl" in partner ? partner.websiteUrl : null;
  const isValidUrl = Boolean(
    websiteUrl &&
      (websiteUrl.startsWith("http://") || websiteUrl.startsWith("https://"))
  );

  const cardInner = (
    <>
      <div className="w-full h-[115px] sm:h-[120px] flex items-center justify-center p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]/80 group-hover:border-[#D97706]/40 transition-colors shrink-0">
        {logoPath ? (
          <div className="relative w-full h-full max-w-[160px] max-h-[100px] flex items-center justify-center">
            <Image
              src={logoPath}
              alt={isDuplicate ? "" : partner.name}
              width={160}
              height={100}
              className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        ) : (
          <div className="w-14 h-14 rounded-xl bg-white border border-[#E2E8F0] shadow-2xs flex items-center justify-center text-[#D97706] group-hover:bg-[#0F172A] group-hover:text-white transition-colors duration-200 shrink-0">
            <Building2
              className="w-7 h-7 transition-transform duration-200 group-hover:scale-105"
              aria-hidden="true"
            />
          </div>
        )}
      </div>

      <div className="flex-grow flex flex-col justify-center items-center w-full px-1 py-1">
        {partner.category && (
          <span className="text-[10px] sm:text-[11px] font-bold text-[#D97706] tracking-wider uppercase bg-amber-50/80 border border-amber-200/50 px-2 py-0.5 rounded line-clamp-1 mb-1">
            {partner.category}
          </span>
        )}
        <h3 className="text-sm sm:text-[15px] font-extrabold text-[#0F172A] group-hover:text-[#D97706] transition-colors leading-snug line-clamp-1 block text-center">
          {partner.shortName}
        </h3>
        <p className="text-xs text-[#64748B] leading-relaxed line-clamp-2 mt-1 block text-center">
          {partner.name}
        </p>
      </div>

      {isValidUrl && websiteUrl && (
        <div className="w-full pt-2 border-t border-slate-100 flex items-center justify-center gap-1 text-[11px] font-semibold text-[#D97706] opacity-90 group-hover:opacity-100 transition-opacity">
          <span>Kunjungi Website</span>
          <ExternalLink className="w-3 h-3 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          <span className="sr-only">resmi {partner.name} (buka di tab baru)</span>
        </div>
      )}

      <span
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-[#D97706] group-hover:w-16 transition-all duration-300 rounded-full"
        aria-hidden="true"
      />
    </>
  );

  const baseClasses =
    "group relative bg-white rounded-2xl p-4 sm:p-5 border border-[#E2E8F0] hover:border-[#D97706]/60 shadow-xs hover:shadow-md flex flex-col items-center justify-between text-center w-[260px] sm:w-[275px] xl:w-[285px] h-[250px] sm:h-[260px] shrink-0 transition-all duration-200 ease-out select-none overflow-hidden focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#D97706]";

  if (isValidUrl && websiteUrl) {
    return (
      <a
        href={websiteUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={baseClasses}
        tabIndex={isDuplicate ? -1 : 0}
        aria-hidden={isDuplicate ? "true" : undefined}
      >
        {cardInner}
      </a>
    );
  }

  return (
    <div
      className={baseClasses}
      aria-hidden={isDuplicate ? "true" : undefined}
    >
      {cardInner}
    </div>
  );
}

export default function Partners({
  title = "Mitra Strategis & Afiliasi Industri",
  subtitle = "MITRA STRATEGIS",
  partners,
  bgColor = "gray",
  id = "partners",
}: PartnersProps) {
  const bgClass = bgColor === "white" ? "bg-white" : "bg-[#F8FAFC]";
  const fadeBg = bgColor === "white" ? "from-white" : "from-[#F8FAFC]";

  const isMarquee = partners.length >= 4;
  const displayList = partners.length < 8 ? [...partners, ...partners] : partners;
  const durationSeconds = Math.max(30, displayList.length * 3.2);

  return (
    <section
      id={id}
      className={`relative w-full ${bgClass} py-16 sm:py-20 xl:py-24 border-b border-[#E2E8F0] overflow-hidden`}
    >
      <div className="relative max-w-[1280px] 2xl:max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 text-[#0F172A] text-xs sm:text-[13px] font-bold tracking-wider uppercase mb-2.5">
            <Handshake className="w-4 h-4 text-[#D97706]" aria-hidden="true" />
            <span>{subtitle}</span>
          </div>

          <h2 className="text-xl sm:text-2xl lg:text-3xl xl:text-[34px] font-black text-[#0F172A] tracking-tight">
            {title}
          </h2>

          <p className="text-xs sm:text-sm lg:text-base text-[#64748B] mt-2 max-w-lg mx-auto leading-relaxed">
            Terhubung dengan kementerian teknis, lembaga sertifikasi, dan asosiasi profesi dalam ekosistem jasa konsultansi nasional.
          </p>

          <div className="w-12 h-1 bg-[#D97706] mx-auto mt-3.5 rounded-full" />
        </div>

        {partners.length === 0 ? (
          <div className="py-12 text-center text-sm text-[#64748B] bg-white rounded-xl border border-[#E2E8F0] max-w-md mx-auto">
            Belum ada mitra kerja aktif yang ditampilkan saat ini.
          </div>
        ) : isMarquee ? (
          <div
            className="marquee-container group relative w-full overflow-hidden py-3"
            style={{ "--marquee-duration": `${durationSeconds}s` } as React.CSSProperties}
          >
            <div
              className={`pointer-events-none absolute inset-y-0 left-0 w-8 sm:w-16 lg:w-24 bg-gradient-to-r ${fadeBg} to-transparent z-10`}
              aria-hidden="true"
            />
            <div
              className={`pointer-events-none absolute inset-y-0 right-0 w-8 sm:w-16 lg:w-24 bg-gradient-to-l ${fadeBg} to-transparent z-10`}
              aria-hidden="true"
            />

            <div className="marquee-viewport flex w-full overflow-hidden">
              <div className="marquee-track animate-marquee-scroll flex shrink-0 items-stretch gap-5 sm:gap-6 pr-5 sm:pr-6">
                {displayList.map((partner, idx) => {
                  const partnerKey = "id" in partner ? partner.id : partner.shortName;
                  return (
                    <PartnerCard
                      key={`partner-${partnerKey}-${idx}`}
                      partner={partner}
                      isDuplicate={false}
                    />
                  );
                })}
              </div>

              <div
                className="marquee-track marquee-duplicate-track animate-marquee-scroll flex shrink-0 items-stretch gap-5 sm:gap-6 pr-5 sm:pr-6"
                aria-hidden="true"
              >
                {displayList.map((partner, idx) => {
                  const partnerKey = "id" in partner ? partner.id : partner.shortName;
                  return (
                    <PartnerCard
                      key={`dup-partner-${partnerKey}-${idx}`}
                      partner={partner}
                      isDuplicate={true}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap justify-center items-stretch gap-5 sm:gap-6">
            {partners.map((partner, idx) => {
              const partnerKey = "id" in partner ? partner.id : partner.shortName;
              return (
                <PartnerCard
                  key={`static-partner-${partnerKey}-${idx}`}
                  partner={partner}
                  isDuplicate={false}
                />
              );
            })}
          </div>
        )}

        <div className="text-center mt-10 sm:mt-12">
          <a
            href="/mitra-kerja/terdaftar"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs sm:text-sm font-semibold text-[#1E293B] hover:text-[#D97706] bg-white border border-[#E2E8F0] hover:border-[#D97706]/50 shadow-2xs hover:shadow-xs transition-all"
          >
            <span>Lihat Seluruh Direktori Mitra Terdaftar</span>
            <ChevronRight className="w-4 h-4 text-[#D97706]" aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
}
