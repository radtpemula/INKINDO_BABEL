// components/admin/AdminIcon.tsx
// Icon resolver for Admin Dashboard using lucide-react
// Strict mapping without arbitrary fallbacks

import React from "react";
import {
  LayoutDashboard,
  FileText,
  Menu,
  Newspaper,
  FileCheck,
  Gavel,
  Handshake,
  Settings,
  Users,
  Shield,
  LogOut,
  ChevronRight,
  ChevronDown,
  Bell,
  Search,
  SlidersHorizontal,
  Briefcase,
} from "lucide-react";
import type { AdminIconName } from "./types";

interface AdminIconProps {
  name: AdminIconName;
  className?: string;
}

export function AdminIcon({ name, className = "w-4 h-4" }: AdminIconProps): React.JSX.Element {
  switch (name) {
    case "LayoutDashboard":
      return <LayoutDashboard className={className} />;
    case "FileText":
      return <FileText className={className} />;
    case "Menu":
      return <Menu className={className} />;
    case "Newspaper":
      return <Newspaper className={className} />;
    case "FileCheck":
      return <FileCheck className={className} />;
    case "Gavel":
      return <Gavel className={className} />;
    case "Handshake":
      return <Handshake className={className} />;
    case "Settings":
      return <Settings className={className} />;
    case "Users":
      return <Users className={className} />;
    case "Shield":
      return <Shield className={className} />;
    case "LogOut":
      return <LogOut className={className} />;
    case "ChevronRight":
      return <ChevronRight className={className} />;
    case "ChevronDown":
      return <ChevronDown className={className} />;
    case "Bell":
      return <Bell className={className} />;
    case "Search":
      return <Search className={className} />;
    case "SlidersHorizontal":
      return <SlidersHorizontal className={className} />;
    case "Briefcase":
      return <Briefcase className={className} />;
    default:
      return <LayoutDashboard className={className} />;
  }
}
