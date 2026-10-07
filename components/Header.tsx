"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  House,
  Building2,
  Users,
  BriefcaseBusiness,
  Newspaper,
  Phone,
  Scale,
  Gavel,
  Handshake,
  CircleHelp,
  LogIn,
  UserPlus,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Mail,
  MapPin,
} from "lucide-react";
import { topBarData, navigationLinks, NavItem } from "@/data/landing";

const navIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  House,
  Home: House,
  Building2,
  Users,
  BriefcaseBusiness,
  Newspaper,
  Phone,
  Scale,
  Gavel,
  Handshake,
  CircleHelp,
  HelpCircle: CircleHelp,
};

export default function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [expandedMobileMenus, setExpandedMobileMenus] = useState<Record<string, boolean>>({});
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setMobileMenuOpen(false);
    setActiveDropdown(null);
  }

  const handleMouseEnter = (label: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setActiveDropdown(label);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 150);
  };

  const toggleMobileSubmenu = (label: string) => {
    setExpandedMobileMenus((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  const isItemActive = useCallback(
    (item: NavItem) => {
      if (item.href === "/" && pathname === "/") return true;
      if (item.href !== "/" && pathname === item.href) return true;
      if (item.subItems) {
        return item.subItems.some((sub) => pathname === sub.href);
      }
      return false;
    },
    [pathname]
  );

  return (
    <header
      className={`w-full sticky top-0 z-50 bg-white transition-all duration-300 ${
        isScrolled
          ? "shadow-sm border-b border-gray-100 py-0"
          : "border-b border-gray-100/80"
      }`}
    >
      {/* Top bar info */}
      <div
        className={`bg-[#153448] text-white text-xs px-4 sm:px-6 xl:px-8 hidden md:block overflow-hidden transition-all duration-300 ${
          isScrolled ? "max-h-0 py-0 opacity-0 pointer-events-none" : "max-h-12 py-2 opacity-100"
        }`}
      >
        <div className="max-w-[1600px] mx-auto flex justify-between items-center">
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

      {/* Main navigation container */}
      <div
        className={`max-w-[1600px] mx-auto px-4 sm:px-6 xl:px-8 flex items-center justify-between gap-3 xl:gap-4 2xl:gap-8 transition-all duration-300 ${
          isScrolled ? "py-2 sm:py-2.5" : "py-2.5 sm:py-3.5"
        }`}
      >
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-3 shrink-0 rounded-md py-1 transition-transform duration-200 hover:opacity-95 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#24735A] focus-visible:ring-offset-2"
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
              className="w-auto h-10 sm:h-11 2xl:h-11.5 object-contain transition-all duration-300"
            />
          ) : (
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-lg bg-[#153448] flex items-center justify-center text-white font-extrabold text-base border-2 border-[#D6A84F] shadow-xs">
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

        {/* Desktop Navigation Links with Single-Level Dropdowns */}
        <nav
          className="hidden xl:flex items-center gap-1 xl:gap-1.5 2xl:gap-3 select-none shrink-0"
          aria-label="Navigasi Utama"
        >
          {navigationLinks.map((link) => {
            const IconComponent = link.iconName ? navIconMap[link.iconName] : null;
            const hasSubmenu = Boolean(link.subItems && link.subItems.length > 0);
            const isActive = isItemActive(link);
            const isOpen = activeDropdown === link.label;

            if (hasSubmenu) {
              return (
                <div
                  key={link.label}
                  className="relative"
                  onMouseEnter={() => handleMouseEnter(link.label)}
                  onMouseLeave={handleMouseLeave}
                >
                  <button
                    type="button"
                    onClick={() => setActiveDropdown(isOpen ? null : link.label)}
                    className={`group relative flex flex-col items-center justify-center text-center px-2 2xl:px-2.5 py-1 transition-colors duration-200 rounded-md select-none caret-transparent cursor-pointer whitespace-nowrap shrink-0 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#24735A] focus-visible:ring-offset-2 ${
                      isActive || isOpen
                        ? "text-[#24735A]"
                        : "text-[#1F2933] hover:text-[#24735A]"
                    }`}
                    aria-expanded={isOpen}
                    aria-haspopup="true"
                  >
                    {IconComponent && (
                      <IconComponent
                        className={`w-4 h-4 2xl:w-[18px] 2xl:h-[18px] mb-1 shrink-0 pointer-events-none transition-transform duration-200 group-hover:scale-105 ${
                          isActive || isOpen
                            ? "text-[#24735A]"
                            : "text-[#1F2933] group-hover:text-[#24735A]"
                        }`}
                        aria-hidden="true"
                      />
                    )}
                    <span className="text-xs 2xl:text-[13px] font-medium leading-tight select-none pointer-events-none whitespace-nowrap">
                      <span className={isActive || isOpen ? "font-semibold" : ""}>
                        {link.label}
                      </span>
                    </span>

                    {/* Active underline indicator */}
                    <span
                      className={`absolute -bottom-1 left-2 right-2 h-0.5 bg-[#24735A] rounded-full transition-all duration-300 pointer-events-none ${
                        isActive
                          ? "opacity-100 scale-x-100"
                          : "opacity-0 scale-x-0 group-hover:opacity-60 group-hover:scale-x-100"
                      }`}
                      aria-hidden="true"
                    />
                  </button>

                  {/* Dropdown Menu (Strictly Single Level - Compact) */}
                  {isOpen && (
                    <div
                      className="absolute left-1/2 -translate-x-1/2 top-full pt-1.5 z-50 w-56 sm:w-60 animate-in fade-in slide-in-from-top-1 duration-150"
                      role="menu"
                      aria-orientation="vertical"
                      aria-labelledby={link.label}
                    >
                      <div className="bg-white rounded-lg shadow-md border border-gray-100/90 py-1 overflow-hidden">
                        {link.subItems?.map((sub) => {
                          const isSubActive = pathname === sub.href;
                          return (
                            <Link
                              key={sub.label}
                              href={sub.href}
                              role="menuitem"
                              className={`block px-3.5 py-1.5 text-xs 2xl:text-[13px] transition-colors duration-150 select-none caret-transparent cursor-pointer ${
                                isSubActive
                                  ? "bg-[#EAF5EF] text-[#24735A] font-semibold"
                                  : "text-[#1F2933] hover:bg-[#F6F8F7] hover:text-[#24735A]"
                              }`}
                            >
                              <span>{sub.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            }

            // Direct link (no submenu: Beranda, Klinik Konsultasi, Hubungi Kami)
            return (
              <Link
                key={link.label}
                href={link.href}
                className={`group relative flex flex-col items-center justify-center text-center px-2 2xl:px-2.5 py-1 transition-colors duration-200 rounded-md select-none caret-transparent cursor-pointer whitespace-nowrap shrink-0 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#24735A] focus-visible:ring-offset-2 ${
                  isActive ? "text-[#24735A]" : "text-[#1F2933] hover:text-[#24735A]"
                }`}
              >
                {IconComponent && (
                  <IconComponent
                    className={`w-4 h-4 2xl:w-[18px] 2xl:h-[18px] mb-1 shrink-0 pointer-events-none transition-transform duration-200 group-hover:scale-105 ${
                      isActive
                        ? "text-[#24735A]"
                        : "text-[#1F2933] group-hover:text-[#24735A]"
                    }`}
                    aria-hidden="true"
                  />
                )}
                <span className="text-xs 2xl:text-[13px] font-medium leading-tight select-none pointer-events-none whitespace-nowrap">
                  <span className={isActive ? "font-semibold" : ""}>{link.label}</span>
                </span>

                <span
                  className={`absolute -bottom-1 left-2 right-2 h-0.5 bg-[#24735A] rounded-full transition-all duration-300 pointer-events-none ${
                    isActive
                      ? "opacity-100 scale-x-100"
                      : "opacity-0 scale-x-0 group-hover:opacity-60 group-hover:scale-x-100"
                  }`}
                  aria-hidden="true"
                />
              </Link>
            );
          })}
        </nav>

        {/* Right CTA Actions: Login & Registrasi */}
        <div className="hidden sm:flex items-center gap-2 xl:gap-2.5 shrink-0 select-none">
          <Link
            href="/login"
            className="group relative inline-flex items-center gap-1.5 text-[#153448] hover:text-[#24735A] hover:bg-[#EAF5EF] border border-[#153448]/30 hover:border-[#24735A] text-xs xl:text-[13px] 2xl:text-sm font-semibold px-3 xl:px-3.5 py-2 rounded-md transition-all duration-200 select-none caret-transparent cursor-pointer whitespace-nowrap shrink-0 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#24735A]"
          >
            <LogIn
              className="w-3.5 h-3.5 shrink-0 transition-transform duration-200 group-hover:scale-110 pointer-events-none"
              aria-hidden="true"
            />
            <span className="leading-none pointer-events-none whitespace-nowrap">Login</span>
          </Link>

          <Link
            href="/anggota/pendaftaran"
            className="group relative inline-flex items-center gap-1.5 bg-[#24735A] hover:bg-[#1e5f4b] text-white text-xs xl:text-[13px] 2xl:text-sm font-semibold px-3.5 xl:px-4 py-2 rounded-md transition-all duration-200 shadow-xs hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 select-none caret-transparent cursor-pointer whitespace-nowrap shrink-0 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#24735A]"
          >
            <UserPlus
              className="w-3.5 h-3.5 shrink-0 transition-transform duration-200 group-hover:scale-110 pointer-events-none"
              aria-hidden="true"
            />
            <span className="leading-none pointer-events-none whitespace-nowrap">Registrasi</span>
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="xl:hidden p-2 rounded-md text-[#153448] hover:bg-[#EAF5EF] hover:text-[#24735A] transition-colors duration-200 shrink-0 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#24735A] cursor-pointer"
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

      {/* Mobile Menu Accordion Drawer */}
      <div
        className={`xl:hidden overflow-y-auto max-h-[80vh] transition-all duration-300 ease-in-out border-t border-gray-100 bg-white ${
          mobileMenuOpen ? "block opacity-100 shadow-xl" : "hidden opacity-0 pointer-events-none"
        }`}
      >
        <div className="px-4 pt-3 pb-6 space-y-3">
          <nav className="flex flex-col space-y-1 select-none" aria-label="Navigasi Seluler">
            {navigationLinks.map((link) => {
              const IconComponent = link.iconName ? navIconMap[link.iconName] : null;
              const hasSubmenu = Boolean(link.subItems && link.subItems.length > 0);
              const isActive = isItemActive(link);
              const isExpanded = expandedMobileMenus[link.label] ?? false;

              if (hasSubmenu) {
                return (
                  <div key={link.label} className="border-b border-gray-50 last:border-b-0 pb-1">
                    <button
                      type="button"
                      onClick={() => toggleMobileSubmenu(link.label)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-md transition-all duration-200 select-none caret-transparent cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#24735A] ${
                        isActive
                          ? "bg-[#EAF5EF] text-[#24735A] font-semibold"
                          : "text-[#1F2933] hover:bg-[#EAF5EF]/60 hover:text-[#24735A]"
                      }`}
                      aria-expanded={isExpanded}
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
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${
                          isExpanded ? "rotate-180 text-[#24735A]" : "text-gray-400"
                        }`}
                        aria-hidden="true"
                      />
                    </button>

                    {/* Collapsible Mobile Submenu (Strictly Single Level) */}
                    {isExpanded && (
                      <div className="pl-9 pr-3 py-1 space-y-1 bg-gray-50/60 rounded-md mt-1">
                        {link.subItems?.map((sub) => {
                          const isSubActive = pathname === sub.href;
                          return (
                            <Link
                              key={sub.label}
                              href={sub.href}
                              onClick={() => setMobileMenuOpen(false)}
                              className={`flex items-center justify-between py-2 px-2 text-xs font-medium rounded transition-colors duration-150 ${
                                isSubActive
                                  ? "text-[#24735A] font-semibold bg-[#EAF5EF]"
                                  : "text-gray-600 hover:text-[#24735A] hover:bg-gray-100"
                              }`}
                            >
                              <span>{sub.label}</span>
                              <ChevronRight className="w-3.5 h-3.5 text-gray-400" aria-hidden="true" />
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              // Direct link in mobile menu
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
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

          {/* Mobile CTA Actions */}
          <div className="pt-3 border-t border-gray-100 flex flex-col gap-2 select-none">
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full inline-flex items-center justify-center gap-2 text-[#153448] hover:text-[#24735A] hover:bg-[#EAF5EF] border border-[#153448]/30 hover:border-[#24735A] text-sm font-semibold py-2.5 rounded-md transition-all duration-200 select-none caret-transparent cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#24735A]"
            >
              <LogIn className="w-4 h-4 shrink-0 pointer-events-none" aria-hidden="true" />
              <span className="leading-none pointer-events-none">Login</span>
            </Link>

            <Link
              href="/anggota/pendaftaran"
              onClick={() => setMobileMenuOpen(false)}
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
