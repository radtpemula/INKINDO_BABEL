// components/admin/AdminDashboardShell.tsx
// Comprehensive responsive shell composing Sidebar, Header, and MainContent
// URL-agnostic wrapper that can be mounted by any future dashboard route

"use client";

import React, { useState } from "react";
import type { AdminProfile, AdminNavSection } from "./types";
import { defaultAdminNavSections } from "./types";
import { AdminSidebar } from "./AdminSidebar";
import { AdminHeader } from "./AdminHeader";
import { AdminMainContent } from "./AdminMainContent";

interface AdminDashboardShellProps {
  children?: React.ReactNode;
  profile?: AdminProfile;
  sections?: AdminNavSection[];
  activeItemId?: string;
  onSelectItem?: (itemId: string) => void;
  pageTitle?: string;
  pageSubtitle?: string;
  headerActions?: React.ReactNode;
  onLogout?: () => void;
}

export function AdminDashboardShell({
  children,
  profile,
  sections = defaultAdminNavSections,
  activeItemId = "overview",
  onSelectItem,
  pageTitle,
  pageSubtitle,
  headerActions,
  onLogout,
}: AdminDashboardShellProps): React.JSX.Element {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // Derive title from active nav item if not explicitly supplied
  const resolvedTitle =
    pageTitle ??
    sections
      .flatMap((s) => s.items)
      .find((item) => item.id === activeItemId)?.label ??
    "Ringkasan Dashboard";

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-100 flex">
      {/* Sidebar Navigation */}
      <AdminSidebar
        sections={sections}
        activeItemId={activeItemId}
        onSelectItem={onSelectItem}
        profile={profile}
        onLogout={onLogout}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((prev) => !prev)}
      />

      {/* Main Body Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-200 ease-in-out ${
          collapsed ? "lg:pl-20" : "lg:pl-64"
        }`}
      >
        <AdminHeader
          title={resolvedTitle}
          subtitle={pageSubtitle}
          profile={profile}
          onOpenMobileSidebar={() => setIsMobileOpen(true)}
          actions={headerActions}
        />

        <AdminMainContent>{children}</AdminMainContent>
      </div>
    </div>
  );
}
