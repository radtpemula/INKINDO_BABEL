import Link from "next/link";
import { Phone, Mail, MapPin, Printer, Shield, ChevronRight } from "lucide-react";
import { footerData } from "@/data/landing";

export default function Footer() {
  return (
    <footer id="footer" className="w-full bg-[#0F172A] text-slate-300 border-t border-slate-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#1E293B] flex items-center justify-center text-white font-extrabold text-lg border border-slate-700">
                <span className="text-[#D97706]">I</span>
              </div>
              <div>
                <span className="text-lg font-bold text-white block leading-none">
                  {footerData.orgName}
                </span>
                <span className="text-[11px] text-[#D97706] font-semibold tracking-wider uppercase block mt-1">
                  Provinsi Kepulauan Bangka Belitung
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              {footerData.description}
            </p>

            <div className="p-3 rounded-md bg-slate-900 border border-slate-800 text-[11px] text-slate-300 flex items-start gap-2">
              <Shield className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" aria-hidden="true" />
              <span>{footerData.legal}</span>
            </div>
          </div>

          <div className="lg:col-span-3 space-y-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Tautan Navigasi
            </h3>
            <div className="w-8 h-0.5 bg-[#D97706]" />
            <ul className="space-y-2 text-xs">
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

          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Layanan Utama
            </h3>
            <div className="w-8 h-0.5 bg-[#D97706]" />
            <ul className="space-y-2 text-xs">
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

          <div className="lg:col-span-3 space-y-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Sekretariat DPP
            </h3>
            <div className="w-8 h-0.5 bg-[#D97706]" />
            <address className="not-italic space-y-2.5 text-xs text-slate-300">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" aria-hidden="true" />
                <span className="leading-relaxed">{footerData.address}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#D97706] shrink-0" aria-hidden="true" />
                <span>{footerData.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Printer className="w-4 h-4 text-[#D97706] shrink-0" aria-hidden="true" />
                <span>{footerData.fax}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#D97706] shrink-0" aria-hidden="true" />
                <span>{footerData.email}</span>
              </div>
            </address>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>{footerData.copyright}</p>
          <div className="flex items-center gap-4 text-[11px]">
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
