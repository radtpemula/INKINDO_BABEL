// components/admin/AdminSidebar.tsx
// Responsive navigation sidebar for INKINDO BABEL Admin Dashboard
// Institutional dark engineering theme (#0F172A, #1E293B, #D97706)
// Client component for toggle states and tab selection

"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { AdminNavSection, AdminProfile } from "./types";
import { defaultAdminNavSections } from "./types";
import { AdminIcon } from "./AdminIcon";
import { AdminUserBadge } from "./AdminUserBadge";
import { AdminLogoutButton } from "./AdminLogoutButton";

interface AdminSidebarProps {
  sections?: AdminNavSection[];
  activeItemId?: string;
  onSelectItem?: (itemId: string) => void;
  profile?: AdminProfile;
  onLogout?: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function AdminSidebar({
  sections = defaultAdminNavSections,
  activeItemId = "overview",
  onSelectItem,
  profile,
  onLogout,
  isMobileOpen = false,
  onCloseMobile,
  collapsed = false,
  onToggleCollapse,
}: AdminSidebarProps): React.JSX.Element {
  const [logoError, setLogoError] = useState(false);

  const fallbackProfile: AdminProfile = profile ?? {
    id: "admin-default",
    name: "Administrator",
    username: "admin",
    email: "admin@inkindo-babel.org",
    role: "SUPER_ADMIN",
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Tutup menu navigasi"
          onClick={onCloseMobile}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") onCloseMobile?.();
          }}
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-xs lg:hidden transition-opacity cursor-pointer"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-[#0F172A] border-r border-slate-800 transition-all duration-200 ease-in-out ${
          /* Desktop Width */
          collapsed ? "lg:w-20" : "lg:w-64"
        } ${
          /* Mobile Slide Drawer */
          isMobileOpen
            ? "translate-x-0 w-72 shadow-2xl"
            : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Sidebar Header / Brand */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/80 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            {!logoError ? (
              <div className="relative h-8 w-8 shrink-0">
                <Image
                  src="/images/logo-inkindo.png"
                  alt="Logo INKINDO BABEL"
                  fill
                  className="object-contain"
                  onError={() => setLogoError(true)}
                  priority
                />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-md bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-amber-500">IB</span>
              </div>
            )}

            {!collapsed && (
              <div className="min-w-0">
                <span className="text-xs font-bold tracking-wider text-slate-100 block truncate">
                  INKINDO BABEL
                </span>
                <span className="text-[10px] text-amber-400 font-medium tracking-widest uppercase block truncate">
                  Panel Pengelola
                </span>
              </div>
            )}
          </div>

          {/* Mobile Close Button */}
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Tutup sidebar"
            className="lg:hidden p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Desktop Collapse Toggle */}
          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              title={collapsed ? "Perluas menu sidebar" : "Ciutkan menu sidebar"}
              className="hidden lg:flex p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-md transition-colors"
            >
              {collapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          )}
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-800">
          {sections.map((section, idx) => (
            <div key={`section-${idx}`}>
              {!collapsed && (
                <div className="px-3 mb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  {section.title}
                </div>
              )}

              <div className="space-y-1">
                {section.items.map((item) => {
                  const isActive = activeItemId === item.id;
                  const itemContent = (
                    <>
                      <span
                        className={`shrink-0 transition-colors ${
                          isActive
                            ? "text-amber-400"
                            : "text-slate-400 group-hover:text-slate-200"
                        }`}
                      >
                        <AdminIcon name={item.iconName} className="w-4 h-4" />
                      </span>

                      {!collapsed && (
                        <span className="flex-1 text-left truncate">
                          {item.label}
                        </span>
                      )}

                      {!collapsed && item.badge && (
                        <span className="shrink-0 px-1.5 py-0.5 text-[9px] font-semibold rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          {item.badge}
                        </span>
                      )}
                    </>
                  );

                  const commonClasses = `w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-150 select-none cursor-pointer group focus:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500/40 ${
                    collapsed ? "justify-center px-0" : ""
                  } ${
                    isActive
                      ? "bg-slate-800 text-amber-400 shadow-xs border border-slate-700/60 font-semibold"
                      : "text-slate-300 hover:text-slate-100 hover:bg-slate-800/60 border border-transparent"
                  }`;

                  if (item.href) {
                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        onClick={() => {
                          onSelectItem?.(item.id);
                          if (isMobileOpen && onCloseMobile) {
                            onCloseMobile();
                          }
                        }}
                        title={collapsed ? item.label : undefined}
                        className={commonClasses}
                      >
                        {itemContent}
                      </Link>
                    );
                  }

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        onSelectItem?.(item.id);
                        if (isMobileOpen && onCloseMobile) {
                          onCloseMobile();
                        }
                      }}
                      title={collapsed ? item.label : undefined}
                      className={commonClasses}
                    >
                      {itemContent}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar Footer (Profile + Logout) */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/40 space-y-2 shrink-0">
          <div className="px-1 py-1">
            <AdminUserBadge profile={fallbackProfile} collapsed={collapsed} />
          </div>
          <AdminLogoutButton
            onLogout={onLogout}
            collapsed={collapsed}
          />
        </div>
      </aside>
    </>
  );
}
