// components/admin/AdminHeader.tsx
// Top navigation bar for the INKINDO BABEL Admin Dashboard
// Provides mobile drawer trigger, page title, quick search indicator, and profile action

"use client";

import React from "react";
import { Menu, Bell, ExternalLink } from "lucide-react";
import type { AdminProfile } from "./types";
import { AdminUserBadge } from "./AdminUserBadge";

interface AdminHeaderProps {
  title?: string;
  subtitle?: string;
  profile?: AdminProfile;
  onOpenMobileSidebar?: () => void;
  actions?: React.ReactNode;
}

export function AdminHeader({
  title = "Ringkasan Dashboard",
  subtitle = "Panel Administrasi dan Pengelolaan Website Resmi",
  profile,
  onOpenMobileSidebar,
  actions,
}: AdminHeaderProps): React.JSX.Element {
  const fallbackProfile: AdminProfile = profile ?? {
    id: "admin-default",
    name: "Administrator",
    username: "admin",
    email: "admin@inkindo-babel.org",
    role: "SUPER_ADMIN",
  };

  return (
    <header className="h-16 bg-[#0F172A] border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shrink-0">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          aria-label="Buka menu navigasi"
          className="lg:hidden p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <h1 className="text-sm sm:text-base font-bold text-slate-100 truncate">
            {title}
          </h1>
          <p className="text-[11px] text-slate-400 truncate hidden sm:block">
            {subtitle}
          </p>
        </div>
      </div>

      {/* Right: Quick Actions & Profile */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {/* Custom Actions Slot (if any) */}
        {actions}

        {/* View Public Website Link */}
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          title="Buka website publik di tab baru"
          className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-amber-400 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-md transition-colors select-none"
        >
          <span>Lihat Website</span>
          <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
        </a>

        {/* Notification Bell (UI Presentation) */}
        <button
          type="button"
          aria-label="Pemberitahuan sistem"
          className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer relative"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-amber-500 rounded-full" />
        </button>

        {/* User Badge on Header (Desktop) */}
        <div className="hidden sm:block pl-2 border-l border-slate-800">
          <AdminUserBadge profile={fallbackProfile} />
        </div>
      </div>
    </header>
  );
}
