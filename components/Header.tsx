"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Home,
  Building2,
  Users,
  BriefcaseBusiness,
  Newspaper,
  Phone,
  LogIn,
  UserPlus,
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
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("#hero");

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const sectionIds = ["hero", "about", "membership-steps", "sbu-steps", "news", "footer"];
    const sectionElements = sectionIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(`#${entry.target.id}`);
          }
        });
      },
      {
        rootMargin: "-25% 0px -65% 0px",
        threshold: 0,
      }
    );

    sectionElements.forEach((el) => observer.observe(el));
    return () => {
      sectionElements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  const handleNavClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
      if (href.startsWith("#")) {
        const targetId = href.substring(1);
        const targetElement = document.getElementById(targetId);

        if (targetElement) {
          e.preventDefault();
          targetElement.scrollIntoView({ behavior: "smooth", block: "start" });
          window.history.pushState(null, "", href);
          setActiveSection(href);
        }
      }

      if (mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    },
    [mobileMenuOpen]
  );

  return (
    <header
      className={`w-full sticky top-0 z-50 bg-white transition-all duration-300 ${
        isScrolled
          ? "shadow-sm border-b border-gray-100 py-0"
          : "border-b border-gray-100/80"
      }`}
    >
      <div
        className={`bg-[#153448] text-white text-xs px-4 hidden md:block overflow-hidden transition-all duration-300 ${
          isScrolled ? "max-h-0 py-0 opacity-0 pointer-events-none" : "max-h-12 py-2 opacity-100"
        }`}
      >
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

      <div
        className={`max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-4 transition-all duration-300 ${
          isScrolled ? "py-2 sm:py-2.5" : "py-3 sm:py-3.5"
        }`}
      >
        <Link
          href="#hero"
          onClick={(e) => handleNavClick(e, "#hero")}
          className="flex items-center gap-3 shrink-0 rounded-md py-1 transition-transform duration-200 hover:opacity-95 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#24735A] focus-visible:ring-offset-2"
          aria-label="Beranda DPP INKINDO BABEL"
        >
          {!logoError ? (
            <Image
              src="/images/logo-inkindo.png"
              alt="Logo DPP INKINDO BABEL"
              width={200}
              height={40}
              priority
              onError={() => setLogoError(true)}
              className="w-auto h-9 sm:h-9.5 object-contain transition-all duration-300"
            />
          ) : (
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-[#153448] flex items-center justify-center text-white font-extrabold text-base border-2 border-[#D6A84F] shadow-xs">
                <span className="font-serif italic font-black text-lg">I</span>
              </div>
              <div className="flex flex-col">
                <span className="text-base sm:text-lg font-extrabold tracking-tight text-[#153448] leading-none">
                  INKINDO
                </span>
                <span className="text-[10px] font-bold tracking-wider text-[#24735A] uppercase mt-0.5 leading-tight">
                  BABEL
                </span>
              </div>
            </div>
          )}
        </Link>

        <nav className="hidden lg:flex items-center gap-4 xl:gap-6 select-none shrink-0" aria-label="Navigasi Utama">
          {navigationLinks.map((link) => {
            const IconComponent = link.iconName ? navIconMap[link.iconName] : null;
            const isActive = activeSection === link.href;

            return (
              <Link
                key={link.label}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className={`group relative inline-flex items-center gap-1.5 xl:gap-2 text-sm font-medium py-1.5 transition-colors duration-200 rounded-xs select-none caret-transparent cursor-pointer whitespace-nowrap shrink-0 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#24735A] focus-visible:ring-offset-2 ${
                  isActive ? "text-[#24735A] font-semibold" : "text-[#1F2933] hover:text-[#24735A]"
                }`}
              >
                {IconComponent && (
                  <IconComponent
                    className={`w-[17px] h-[17px] transition-colors duration-200 shrink-0 pointer-events-none ${
                      isActive
                        ? "text-[#24735A]"
                        : "text-[#153448] group-hover:text-[#24735A]"
                    }`}
                    aria-hidden="true"
                  />
                )}
                <span className="leading-none select-none pointer-events-none whitespace-nowrap">{link.label}</span>

                <span
                  className={`absolute -bottom-1 left-0 right-0 h-0.5 bg-[#24735A] rounded-full transition-all duration-300 pointer-events-none ${
                    isActive ? "opacity-100 scale-x-100" : "opacity-0 scale-x-0 group-hover:opacity-60 group-hover:scale-x-100"
                  }`}
                  aria-hidden="true"
                />
              </Link>
            );
          })}
        </nav>

        <div className="hidden sm:flex items-center gap-2.5 shrink-0 select-none">
          <Link
            href="/login"
            className="group relative inline-flex items-center gap-1.5 text-[#153448] hover:text-[#24735A] hover:bg-[#EAF5EF] border border-[#153448]/30 hover:border-[#24735A] text-xs md:text-sm font-semibold px-3.5 py-2 rounded-md transition-all duration-200 select-none caret-transparent cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#24735A]"
          >
            <LogIn className="w-3.5 h-3.5 shrink-0 transition-transform duration-200 group-hover:scale-110 pointer-events-none" aria-hidden="true" />
            <span className="leading-none pointer-events-none">Login</span>
          </Link>

          <Link
            href="#membership-steps"
            onClick={(e) => handleNavClick(e, "#membership-steps")}
            className="group relative inline-flex items-center gap-1.5 bg-[#24735A] hover:bg-[#1e5f4b] text-white text-xs md:text-sm font-semibold px-3.5 py-2 rounded-md transition-all duration-200 shadow-xs hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 select-none caret-transparent cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#24735A]"
          >
            <UserPlus className="w-3.5 h-3.5 shrink-0 transition-transform duration-200 group-hover:scale-110 pointer-events-none" aria-hidden="true" />
            <span className="leading-none pointer-events-none">Registrasi</span>
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 rounded-md text-[#153448] hover:bg-[#EAF5EF] hover:text-[#24735A] transition-colors duration-200 shrink-0 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#24735A] cursor-pointer"
          aria-expanded={mobileMenuOpen}
          aria-label={mobileMenuOpen ? "Tutup menu navigasi" : "Buka menu navigasi"}
        >
          {mobileMenuOpen ? (
            <X className="w-6 h-6 transition-transform duration-200" aria-hidden="true" />
          ) : (
            <Menu className="w-6 h-6 transition-transform duration-200" aria-hidden="true" />
          )}
        </button>
      </div>

      <div
        className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out border-t border-gray-100 bg-white ${
          mobileMenuOpen ? "max-h-[420px] opacity-100 shadow-xl" : "max-h-0 opacity-0 pointer-events-none"
        }`}
      >
        <div className="px-4 pt-3 pb-6 space-y-3">
          <nav className="flex flex-col space-y-1 select-none" aria-label="Navigasi Seluler">
            {navigationLinks.map((link) => {
              const IconComponent = link.iconName ? navIconMap[link.iconName] : null;
              const isActive = activeSection === link.href;

              return (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className={`flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-md transition-all duration-200 select-none caret-transparent cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#24735A] ${
                    isActive
                      ? "bg-[#EAF5EF] text-[#24735A] font-semibold border-l-4 border-[#24735A]"
                      : "text-[#1F2933] hover:bg-[#EAF5EF]/60 hover:text-[#24735A]"
                  }`}
                >
                  <span className="flex items-center gap-3 pointer-events-none select-none">
                    {IconComponent && (
                      <IconComponent
                        className={`w-[19px] h-[19px] shrink-0 ${
                          isActive ? "text-[#24735A]" : "text-[#153448]"
                        }`}
                        aria-hidden="true"
                      />
                    )}
                    <span className="leading-none">{link.label}</span>
                  </span>
                  <ChevronRight
                    className={`w-4 h-4 transition-transform pointer-events-none ${
                      isActive ? "text-[#24735A] translate-x-0.5" : "text-gray-400"
                    }`}
                    aria-hidden="true"
                  />
                </Link>
              );
            })}
          </nav>
          <div className="pt-3 border-t border-gray-100 flex flex-col gap-2 select-none">
            <Link
              href="/login"
              className="w-full inline-flex items-center justify-center gap-2 text-[#153448] hover:text-[#24735A] hover:bg-[#EAF5EF] border border-[#153448]/30 hover:border-[#24735A] text-sm font-semibold py-2.5 rounded-md transition-all duration-200 select-none caret-transparent cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#24735A]"
            >
              <LogIn className="w-4 h-4 shrink-0 pointer-events-none" aria-hidden="true" />
              <span className="leading-none pointer-events-none">Login</span>
            </Link>

            <Link
              href="#membership-steps"
              onClick={(e) => handleNavClick(e, "#membership-steps")}
              className="w-full inline-flex items-center justify-center gap-2 bg-[#24735A] hover:bg-[#1e5f4b] text-white text-sm font-semibold py-2.5 rounded-md transition-all duration-200 shadow-xs active:translate-y-0.5 select-none caret-transparent cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#24735A]"
            >
              <UserPlus className="w-4 h-4 shrink-0 pointer-events-none" aria-hidden="true" />
              <span className="leading-none pointer-events-none">Registrasi</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
