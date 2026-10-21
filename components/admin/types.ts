// components/admin/types.ts
// Strict TypeScript types for INKINDO BABEL Admin Dashboard components
// URL-agnostic design: does not bind to any specific route or prefix.

export type AdminRole = "SUPER_ADMIN" | "ADMIN" | "EDITOR";

export interface AdminProfile {
  id: string;
  name: string;
  username: string;
  email: string;
  role: AdminRole;
  avatarUrl?: string;
}

export type AdminIconName =
  | "LayoutDashboard"
  | "FileText"
  | "Menu"
  | "Newspaper"
  | "FileCheck"
  | "Gavel"
  | "Handshake"
  | "Settings"
  | "Users"
  | "Shield"
  | "LogOut"
  | "ChevronRight"
  | "ChevronDown"
  | "Bell"
  | "Search"
  | "SlidersHorizontal";

export interface AdminNavItem {
  id: string;
  label: string;
  iconName: AdminIconName;
  href?: string;
  badge?: string;
  children?: Omit<AdminNavItem, "children">[];
}

export interface AdminNavSection {
  title: string;
  items: AdminNavItem[];
}

/**
 * Rancangan navigasi pengelolaan website INKINDO BABEL
 * Terstruktur secara fungsional dalam bahasa Indonesia.
 */
export const defaultAdminNavSections: AdminNavSection[] = [
  {
    title: "UTAMA",
    items: [
      {
        id: "overview",
        label: "Ringkasan Dashboard",
        iconName: "LayoutDashboard",
        href: "/babel-and-adt",
      },
    ],
  },
  {
    title: "PENGELOLAAN KONTEN",
    items: [
      {
        id: "hero",
        label: "Hero",
        iconName: "SlidersHorizontal",
        href: "/babel-and-adt/hero",
      },
      {
        id: "pages",
        label: "Halaman Website",
        iconName: "FileText",
      },
      {
        id: "navigation",
        label: "Menu & Submenu",
        iconName: "Menu",
      },
      {
        id: "news",
        label: "Berita & Publikasi",
        iconName: "Newspaper",
        href: "/babel-and-adt/news",
      },
      {
        id: "regulations",
        label: "Dokumen & Peraturan",
        iconName: "FileCheck",
      },
      {
        id: "tenders",
        label: "Informasi Lelang / Tender",
        iconName: "Gavel",
      },
      {
        id: "partners",
        label: "Mitra Kerja",
        iconName: "Handshake",
      },
    ],
  },
  {
    title: "SISTEM",
    items: [
      {
        id: "settings",
        label: "Pengaturan Website",
        iconName: "Settings",
        href: "/babel-and-adt/settings",
      },
      {
        id: "admins",
        label: "Manajemen Admin",
        iconName: "Shield",
        href: "/babel-and-adt/admin",
      },
    ],
  },
];
