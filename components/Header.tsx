"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Home,
  Building2,
  Users,
  BriefcaseBusiness,
  Newspaper,
  Phone,
  User,
  Menu,
  X,
  ChevronRight,
  Mail,
  MapPin,
} from "lucide-react";
import { topBarData, navigationLinks } from "@/data/landing";

const navIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Home,
  Building2,
  Users,
  BriefcaseBusiness,
  Newspaper,
  Phone,
};

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);

  return (
    <header className="w-full sticky top-0 z-50 bg-white shadow-xs">
      {/* Top Bar for institutional contacts */}
      <div className="bg-[#153448] text-white text-xs py-2 px-4 hidden md:block">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-6">
            <span className="flex items-center gap-1.5 text-gray-200">
              <Phone className="w-3.5 h-3.5 text-[#D6A84F] shrink-0" aria-hidden="true" />
              <span>{topBarData.phone}</span>
            </span>
            <span className="flex items-center gap-1.5 text-gray-200">
              <Mail className="w-3.5 h-3.5 text-[#D6A84F] shrink-0" aria-hidden="true" />
              <span>{topBarData.email}</span>
            </span>
            <span className="flex items-center gap-1.5 text-gray-200">
              <MapPin className="w-3.5 h-3.5 text-[#D6A84F] shrink-0" aria-hidden="true" />
              <span>Pangkalpinang</span>
            </span>
          </div>
          <div className="text-gray-300">
            <span>{topBarData.workingHours}</span>
          </div>
        </div>
      </div>

      {/* Main Navbar: [ LOGO ] [ NAVIGATION LINKS ] [ CTA ] */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-3.5 flex items-center justify-between gap-4">
        {/* Logo Section (Left) */}
        <Link
          href="#hero"
          className="flex items-center gap-3 shrink-0 focus:outline-hidden focus:ring-2 focus:ring-[#153448] rounded-md py-1"
          aria-label="Beranda DPP INKINDO BABEL"
        >
          {!logoError ? (
            <Image
              src="/images/logo-inkindo.png"
              alt="Logo DPP INKINDO BABEL"
              width={220}
              height={46}
              priority
              onError={() => setLogoError(true)}
              className="h-10 sm:h-11 w-auto object-contain"
            />
          ) : (
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-lg bg-[#153448] flex items-center justify-center text-white font-extrabold text-lg border-2 border-[#D6A84F] shadow-xs">
                <span className="font-serif italic font-black text-xl">I</span>
              </div>
              <div className="flex flex-col">
                <span className="text-lg sm:text-xl font-extrabold tracking-tight text-[#153448] leading-none">
                  INKINDO
                </span>
                <span className="text-[11px] font-bold tracking-wider text-[#24735A] uppercase mt-0.5 leading-tight">
                  BABEL
                </span>
                <span className="text-[9px] text-[#52606D] font-medium leading-none hidden xl:block mt-0.5">
                  Kepulauan Bangka Belitung
                </span>
              </div>
            </div>
          )}
        </Link>

        {/* Desktop Navigation Links (Center) */}
        <nav className="hidden lg:flex items-center gap-6 xl:gap-7" aria-label="Navigasi Utama">
          {navigationLinks.map((link) => {
            const IconComponent = link.iconName ? navIconMap[link.iconName] : null;
            return (
              <Link
                key={link.label}
                href={link.href}
                className="group inline-flex items-center gap-2 text-sm font-medium text-[#1F2933] hover:text-[#24735A] transition-colors py-1.5 focus:outline-hidden focus:ring-1 focus:ring-[#24735A] rounded-sm"
              >
                {IconComponent && (
                  <IconComponent
                    className="w-[17px] h-[17px] text-[#153448] group-hover:text-[#24735A] transition-colors shrink-0"
                    aria-hidden="true"
                  />
                )}
                <span className="leading-none">{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Desktop CTA (Right) */}
        <div className="hidden sm:flex items-center shrink-0">
          <Link
            href="#membership-steps"
            className="inline-flex items-center gap-2 bg-[#24735A] hover:bg-[#1c5b47] text-white text-xs md:text-sm font-semibold px-4 py-2.5 rounded-md transition shadow-xs focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-[#24735A]"
          >
            <User className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span className="leading-none">Portal Anggota</span>
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 rounded-md text-[#153448] hover:bg-gray-100 focus:outline-hidden focus:ring-2 focus:ring-[#153448] transition shrink-0"
          aria-expanded={mobileMenuOpen}
          aria-label={mobileMenuOpen ? "Tutup menu navigasi" : "Buka menu navigasi"}
        >
          {mobileMenuOpen ? (
            <X className="w-6 h-6" aria-hidden="true" />
          ) : (
            <Menu className="w-6 h-6" aria-hidden="true" />
          )}
        </button>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-200 bg-white px-4 pt-3 pb-6 space-y-3 shadow-lg">
          <nav className="flex flex-col space-y-1" aria-label="Navigasi Seluler">
            {navigationLinks.map((link) => {
              const IconComponent = link.iconName ? navIconMap[link.iconName] : null;
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-3 py-2.5 text-sm font-medium text-[#1F2933] hover:bg-[#EAF5EF] hover:text-[#24735A] rounded-md transition"
                >
                  <div className="flex items-center gap-3">
                    {IconComponent && (
                      <IconComponent
                        className="w-[19px] h-[19px] text-[#24735A] shrink-0"
                        aria-hidden="true"
                      />
                    )}
                    <span className="leading-none">{link.label}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" aria-hidden="true" />
                </Link>
              );
            })}
          </nav>
          <div className="pt-3 border-t border-gray-100">
            <Link
              href="#membership-steps"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full inline-flex items-center justify-center gap-2 bg-[#24735A] hover:bg-[#1c5b47] text-white text-sm font-semibold py-2.5 rounded-md transition shadow-xs"
            >
              <User className="w-[19px] h-[19px] shrink-0" aria-hidden="true" />
              <span className="leading-none">Portal Anggota & Registrasi</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
