import Link from "next/link";
import { Phone, Mail, MapPin, Printer, Shield, ChevronRight } from "lucide-react";
import { footerData } from "@/data/landing";
import type { PublicSiteSettings } from "@/lib/public/settings";

function InstagramIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function FacebookIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z" />
    </svg>
  );
}

function YouTubeIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M21.58 7.19a2.76 2.76 0 0 0-1.95-1.96C17.9 4.75 12 4.75 12 4.75s-5.9 0-7.63.48a2.76 2.76 0 0 0-1.95 1.96C2 8.93 2 12 2 12s0 3.07.42 4.81c.24.9.95 1.6 1.85 1.85 1.73.48 7.73.48 7.73.48s5.9 0 7.63-.48c.9-.24 1.61-.95 1.85-1.85.42-1.74.42-4.81.42-4.81s0-3.07-.42-4.81zM9.75 15.02V8.98L15.5 12l-5.75 3.02z" />
    </svg>
  );
}

function LinkedInIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76A1.66 1.66 0 0 0 8.12 7.1 1.66 1.66 0 0 0 6.46 5.44a1.66 1.66 0 0 0-1.66 1.66 1.66 1.66 0 0 0 1.66 1.66m1.39 9.74v-8.37H5.07v8.37h2.78z" />
    </svg>
  );
}

interface FooterProps {
  settings?: PublicSiteSettings;
}

export default function Footer({ settings }: FooterProps = {}) {
  const orgName = settings?.identity.orgName ?? footerData.orgName;
  const region = settings?.identity.region ?? "Provinsi Kepulauan Bangka Belitung";
  const description = settings?.footer.description ?? footerData.description;
  const legal = settings?.footer.legal ?? footerData.legal;
  const address = settings?.footer.address ?? footerData.address;
  const phone = settings?.contact.phone ?? footerData.phone;
  const fax = settings?.contact.fax ?? footerData.fax;
  const email = settings?.contact.email ?? footerData.email;
  const copyright = settings?.footer.copyright ?? footerData.copyright;
  const social = settings?.social;

  const hasSocial = Boolean(
    social?.instagram?.trim() ||
    social?.facebook?.trim() ||
    social?.youtube?.trim() ||
    social?.linkedin?.trim()
  );

  return (
    <footer id="footer" className="w-full bg-[#0F172A] text-slate-300 border-t border-slate-800">
      <div className="max-w-[1280px] 2xl:max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 pt-18 sm:pt-20 pb-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-12 xl:gap-14">
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-lg bg-[#1E293B] flex items-center justify-center text-white font-extrabold text-xl border border-slate-700">
                <span className="text-[#D97706]">I</span>
              </div>
              <div>
                <span className="text-xl font-bold text-white block leading-none">
                  {orgName}
                </span>
                <span className="text-xs text-[#D97706] font-semibold tracking-wider uppercase block mt-1">
                  {region}
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-[13px] text-slate-400 leading-relaxed">
              {description}
            </p>

            <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-start gap-2.5">
              <Shield className="w-4.5 h-4.5 text-[#D97706] shrink-0 mt-0.5" aria-hidden="true" />
              <span>{legal}</span>
            </div>

            {hasSocial && (
              <div className="pt-1 flex flex-wrap items-center gap-2">
                {social?.instagram?.trim() ? (
                  <a
                    href={social.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Instagram${social.instagramLabel?.trim() ? ` — ${social.instagramLabel.trim()}` : ""}`}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-[#D97706] hover:border-slate-700 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#D97706] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F172A] transition-colors group"
                  >
                    <InstagramIcon className="w-4 h-4 text-slate-400 group-hover:text-[#D97706] transition-colors shrink-0" />
                    <span className="font-medium">
                      {social.instagramLabel?.trim() ? `Instagram — ${social.instagramLabel.trim()}` : "Instagram"}
                    </span>
                  </a>
                ) : null}
                {social?.facebook?.trim() ? (
                  <a
                    href={social.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Facebook${social.facebookLabel?.trim() ? ` — ${social.facebookLabel.trim()}` : ""}`}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-[#D97706] hover:border-slate-700 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#D97706] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F172A] transition-colors group"
                  >
                    <FacebookIcon className="w-4 h-4 text-slate-400 group-hover:text-[#D97706] transition-colors shrink-0" />
                    <span className="font-medium">
                      {social.facebookLabel?.trim() ? `Facebook — ${social.facebookLabel.trim()}` : "Facebook"}
                    </span>
                  </a>
                ) : null}
                {social?.youtube?.trim() ? (
                  <a
                    href={social.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`YouTube${social.youtubeLabel?.trim() ? ` — ${social.youtubeLabel.trim()}` : ""}`}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-[#D97706] hover:border-slate-700 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#D97706] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F172A] transition-colors group"
                  >
                    <YouTubeIcon className="w-4 h-4 text-slate-400 group-hover:text-[#D97706] transition-colors shrink-0" />
                    <span className="font-medium">
                      {social.youtubeLabel?.trim() ? `YouTube — ${social.youtubeLabel.trim()}` : "YouTube"}
                    </span>
                  </a>
                ) : null}
                {social?.linkedin?.trim() ? (
                  <a
                    href={social.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`LinkedIn${social.linkedinLabel?.trim() ? ` — ${social.linkedinLabel.trim()}` : ""}`}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-[#D97706] hover:border-slate-700 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#D97706] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F172A] transition-colors group"
                  >
                    <LinkedInIcon className="w-4 h-4 text-slate-400 group-hover:text-[#D97706] transition-colors shrink-0" />
                    <span className="font-medium">
                      {social.linkedinLabel?.trim() ? `LinkedIn — ${social.linkedinLabel.trim()}` : "LinkedIn"}
                    </span>
                  </a>
                ) : null}
              </div>
            )}
          </div>

          <div className="lg:col-span-3 space-y-3.5">
            <h3 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider">
              Tautan Navigasi
            </h3>
            <div className="w-9 h-0.5 bg-[#D97706]" />
            <ul className="space-y-2.5 text-xs sm:text-[13px]">
              {footerData.quickLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="inline-flex items-center gap-1.5 text-slate-300 hover:text-[#D97706] transition"
                  >
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
                    <span>{link.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2 space-y-3.5">
            <h3 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider">
              Layanan Utama
            </h3>
            <div className="w-9 h-0.5 bg-[#D97706]" />
            <ul className="space-y-2.5 text-xs sm:text-[13px]">
              {footerData.services.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="inline-flex items-center gap-1.5 text-slate-300 hover:text-[#D97706] transition"
                  >
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-3 space-y-3.5">
            <h3 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider">
              Sekretariat DPP
            </h3>
            <div className="w-9 h-0.5 bg-[#D97706]" />
            <address className="not-italic space-y-3 text-xs sm:text-[13px] text-slate-300">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4.5 h-4.5 text-[#D97706] shrink-0 mt-0.5" aria-hidden="true" />
                <span className="leading-relaxed">{address}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4.5 h-4.5 text-[#D97706] shrink-0" aria-hidden="true" />
                <span>{phone}</span>
              </div>
              {fax ? (
                <div className="flex items-center gap-2.5">
                  <Printer className="w-4.5 h-4.5 text-[#D97706] shrink-0" aria-hidden="true" />
                  <span>{fax}</span>
                </div>
              ) : null}
              <div className="flex items-center gap-2.5">
                <Mail className="w-4.5 h-4.5 text-[#D97706] shrink-0" aria-hidden="true" />
                <span>{email}</span>
              </div>
            </address>
          </div>
        </div>

        <div className="mt-14 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs sm:text-[13px] text-slate-400">
          <p>{copyright}</p>
          <div className="flex items-center gap-4 text-xs">
            <Link href="/" className="hover:text-white transition">
              Ketentuan Layanan
            </Link>
            <span aria-hidden="true">•</span>
            <Link href="/" className="hover:text-white transition">
              Kebijakan Privasi
            </Link>
            <span aria-hidden="true">•</span>
            <Link href="/" className="hover:text-white transition">
              Aksesibilitas
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
