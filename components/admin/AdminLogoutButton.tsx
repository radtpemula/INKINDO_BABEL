// components/admin/AdminLogoutButton.tsx
// Pure UI button component for admin logout
// Does not trigger unconfigured routes or faux redirects
// Supports onLogout callback when connected to actual auth handler

import React from "react";
import { LogOut } from "lucide-react";

interface AdminLogoutButtonProps {
  onLogout?: () => void;
  collapsed?: boolean;
  className?: string;
}

export function AdminLogoutButton({
  onLogout,
  collapsed = false,
  className = "",
}: AdminLogoutButtonProps): React.JSX.Element {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (onLogout) {
      onLogout();
    } else {
      // Standalone UI behavior: notifies that integration is pending
      console.info("[AdminLogoutButton] Mekanisme logout akan dihubungkan pada tahap integrasi sesi.");
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      title="Keluar dari sesi administrator"
      className={`group flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-colors duration-150 cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-red-500/40 select-none ${
        collapsed ? "justify-center w-full px-0" : "w-full"
      } ${className}`}
    >
      <LogOut className="w-4 h-4 shrink-0 transition-transform duration-150 group-hover:-translate-x-0.5" />
      {!collapsed && <span>Keluar</span>}
    </button>
  );
}
