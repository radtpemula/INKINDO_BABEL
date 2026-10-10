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
          ? "shadow-xs border-b border-[#E2E8F0] py-0"
          : "border-b border-[#E2E8F0]/80"
      }`}
    >
      {/* Top bar info */}
      <div
        className={`bg-[#0F172A] text-white text-xs px-4 sm:px-6 xl:px-8 hidden md:block overflow-hidden transition-all duration-300 ${
          isScrolled ? "max-h-0 py-0 opacity-0 pointer-events-none" : "max-h-12 py-2 opacity-100"
        }`}
      >
        <div className="max-w-[1600px] mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-6">
            <span className="flex items-center gap-1.5 text-slate-300">
              <Phone className="w-3.5 h-3.5 text-[#D97706] shrink-0" aria-hidden="true" />
              <span>{topBarData.phone}</span>
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <Mail className="w-3.5 h-3.5 text-[#D97706] shrink-0" aria-hidden="true" />
              <span>{topBarData.email}</span>
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <MapPin className="w-3.5 h-3.5 text-[#D97706] shrink-0" aria-hidden="true" />
              <span>Pangkalpinang</span>
            </span>
          </div>
          <div className="text-slate-400">
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
          className="flex items-center gap-3 shrink-0 rounded-md py-1 transition-transform duration-200 hover:opacity-95 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#D97706] focus-visible:ring-offset-2"
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
              <div className="w-10 h-10 rounded-lg bg-[#0F172A] flex items-center justify-center text-white font-extrabold text-base border border-[#334155] shadow-xs">
                <span className="font-serif italic font-black text-lg">I</span>
              </div>
              <div className="flex flex-col">
                <span className="text-base sm:text-lg font-extrabold tracking-tight text-[#0F172A] leading-none">
                  INKINDO
                </span>
                <span className="text-[10px] font-bold tracking-wider text-[#D97706] uppercase mt-0.5 leading-tight">
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
                    className={`group relative flex flex-col items-center justify-center text-center px-2 2xl:px-2.5 py-1 transition-colors duration-200 rounded-md select-none caret-transparent cursor-pointer whitespace-nowrap shrink-0 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#D97706] focus-visible:ring-offset-2 ${
                      isActive || isOpen
                        ? "text-[#D97706]"
                        : "text-[#1E293B] hover:text-[#D97706]"
                    }`}
                    aria-expanded={isOpen}
                    aria-haspopup="true"
                  >
                    {IconComponent && (
                      <IconComponent
                        className={`w-4 h-4 2xl:w-[18px] 2xl:h-[18px] mb-1 shrink-0 pointer-events-none transition-transform duration-200 group-hover:scale-105 ${
                          isActive || isOpen
                            ? "text-[#D97706]"
                            : "text-slate-500 group-hover:text-[#D97706]"
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
                      className={`absolute -bottom-1 left-2 right-2 h-0.5 bg-[#D97706] rounded-full transition-all duration-300 pointer-events-none ${
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
                      <div className="bg-white rounded-lg shadow-sm border border-[#E2E8F0] py-1 overflow-hidden">
                        {link.subItems?.map((sub) => {
                          const isSubActive = pathname === sub.href;
                          return (
                            <Link
                              key={sub.label}
                              href={sub.href}
                              role="menuitem"
                              className={`block px-3.5 py-1.5 text-xs 2xl:text-[13px] transition-colors duration-150 select-none caret-transparent cursor-pointer ${
                                isSubActive
                                  ? "bg-[#F8FAFC] text-[#D97706] font-semibold"
                                  : "text-[#1E293B] hover:bg-[#F8FAFC] hover:text-[#D97706]"
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
                className={`group relative flex flex-col items-center justify-center text-center px-2 2xl:px-2.5 py-1 transition-colors duration-200 rounded-md select-none caret-transparent cursor-pointer whitespace-nowrap shrink-0 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#D97706] focus-visible:ring-offset-2 ${
                  isActive ? "text-[#D97706]" : "text-[#1E293B] hover:text-[#D97706]"
                }`}
              >
                {IconComponent && (
                  <IconComponent
                    className={`w-4 h-4 2xl:w-[18px] 2xl:h-[18px] mb-1 shrink-0 pointer-events-none transition-transform duration-200 group-hover:scale-105 ${
                      isActive
                        ? "text-[#D97706]"
                        : "text-slate-500 group-hover:text-[#D97706]"
                    }`}
                    aria-hidden="true"
                  />
                )}
                <span className="text-xs 2xl:text-[13px] font-medium leading-tight select-none pointer-events-none whitespace-nowrap">
                  <span className={isActive ? "font-semibold" : ""}>{link.label}</span>
                </span>

                <span
                  className={`absolute -bottom-1 left-2 right-2 h-0.5 bg-[#D97706] rounded-full transition-all duration-300 pointer-events-none ${
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
            className="group relative inline-flex items-center gap-1.5 text-[#1E293B] hover:text-[#D97706] hover:bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#D97706] text-xs xl:text-[13px] 2xl:text-sm font-semibold px-3 xl:px-3.5 py-2 rounded-md transition-all duration-200 select-none caret-transparent cursor-pointer whitespace-nowrap shrink-0 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#D97706]"
          >
            <LogIn
              className="w-3.5 h-3.5 shrink-0 transition-transform duration-200 group-hover:scale-110 pointer-events-none"
              aria-hidden="true"
            />
            <span className="leading-none pointer-events-none whitespace-nowrap">Login</span>
          </Link>

          <Link
            href="/anggota/pendaftaran"
            className="group relative inline-flex items-center gap-1.5 bg-[#D97706] hover:bg-[#B45309] text-white text-xs xl:text-[13px] 2xl:text-sm font-semibold px-3.5 xl:px-4 py-2 rounded-md transition-all duration-200 shadow-xs active:translate-y-0 select-none caret-transparent cursor-pointer whitespace-nowrap shrink-0 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#D97706]"
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
          className="xl:hidden p-2 rounded-md text-[#1E293B] hover:bg-[#F8FAFC] hover:text-[#D97706] transition-colors duration-200 shrink-0 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#D97706] cursor-pointer"
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
        className={`xl:hidden overflow-y-auto max-h-[80vh] transition-all duration-300 ease-in-out border-t border-[#E2E8F0] bg-white ${
          mobileMenuOpen ? "block opacity-100 shadow-lg" : "hidden opacity-0 pointer-events-none"
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
                  <div key={link.label} className="border-b border-[#E2E8F0] last:border-b-0 pb-1">
                    <button
                      type="button"
                      onClick={() => toggleMobileSubmenu(link.label)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-md transition-all duration-200 select-none caret-transparent cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#D97706] ${
                        isActive
                          ? "bg-[#F8FAFC] text-[#D97706] font-semibold"
                          : "text-[#1E293B] hover:bg-[#F8FAFC] hover:text-[#D97706]"
                      }`}
                      aria-expanded={isExpanded}
                    >
                      <span className="flex items-center gap-3 pointer-events-none select-none">
                        {IconComponent && (
                          <IconComponent
                            className={`w-[19px] h-[19px] shrink-0 ${
                              isActive ? "text-[#D97706]" : "text-slate-500"
                            }`}
                            aria-hidden="true"
                          />
                        )}
                        <span className="leading-none">{link.label}</span>
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${
                          isExpanded ? "rotate-180 text-[#D97706]" : "text-slate-400"
                        }`}
                        aria-hidden="true"
                      />
                    </button>

                    {/* Collapsible Mobile Submenu (Strictly Single Level) */}
                    {isExpanded && (
                      <div className="pl-9 pr-3 py-1 space-y-1 bg-[#F8FAFC] rounded-md mt-1 border border-[#E2E8F0]">
                        {link.subItems?.map((sub) => {
                          const isSubActive = pathname === sub.href;
                          return (
                            <Link
                              key={sub.label}
                              href={sub.href}
                              onClick={() => setMobileMenuOpen(false)}
                              className={`flex items-center justify-between py-2 px-2 text-xs font-medium rounded transition-colors duration-150 ${
                                isSubActive
                                  ? "text-[#D97706] font-semibold bg-white"
                                  : "text-slate-600 hover:text-[#D97706] hover:bg-white"
                              }`}
                            >
                              <span>{sub.label}</span>
                              <ChevronRight className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
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
                  className={`flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-md transition-all duration-200 select-none caret-transparent cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#D97706] ${
                    isActive
                      ? "bg-[#F8FAFC] text-[#D97706] font-semibold border-l-4 border-[#D97706]"
                      : "text-[#1E293B] hover:bg-[#F8FAFC] hover:text-[#D97706]"
                  }`}
                >
                  <span className="flex items-center gap-3 pointer-events-none select-none">
                    {IconComponent && (
                      <IconComponent
                        className={`w-[19px] h-[19px] shrink-0 ${
                          isActive ? "text-[#D97706]" : "text-slate-500"
                        }`}
                        aria-hidden="true"
                      />
                    )}
                    <span className="leading-none">{link.label}</span>
                  </span>
                  <ChevronRight
                    className={`w-4 h-4 transition-transform pointer-events-none ${
                      isActive ? "text-[#D97706] translate-x-0.5" : "text-slate-400"
                    }`}
                    aria-hidden="true"
                  />
                </Link>
              );
            })}
          </nav>

          {/* Mobile CTA Actions */}
          <div className="pt-3 border-t border-[#E2E8F0] flex flex-col gap-2 select-none">
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full inline-flex items-center justify-center gap-2 text-[#1E293B] hover:text-[#D97706] hover:bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#D97706] text-sm font-semibold py-2.5 rounded-md transition-all duration-200 select-none caret-transparent cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#D97706]"
            >
              <LogIn className="w-4 h-4 shrink-0 pointer-events-none" aria-hidden="true" />
              <span className="leading-none pointer-events-none">Login</span>
            </Link>

            <Link
              href="/anggota/pendaftaran"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full inline-flex items-center justify-center gap-2 bg-[#D97706] hover:bg-[#B45309] text-white text-sm font-semibold py-2.5 rounded-md transition-all duration-200 shadow-xs active:translate-y-0.5 select-none caret-transparent cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#D97706]"
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
