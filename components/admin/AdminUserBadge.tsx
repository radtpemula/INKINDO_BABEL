// components/admin/AdminUserBadge.tsx
// Presentation component for displaying administrator profile information
// Clean institutional styling matching INKINDO BABEL design tokens

import React from "react";
import type { AdminProfile } from "./types";

interface AdminUserBadgeProps {
  profile: AdminProfile;
  collapsed?: boolean;
}

export function AdminUserBadge({ profile, collapsed = false }: AdminUserBadgeProps): React.JSX.Element {
  const initials = profile.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const roleLabel =
    profile.role === "SUPER_ADMIN"
      ? "Super Admin"
      : profile.role === "ADMIN"
        ? "Administrator"
        : "Editor Konten";

  return (
    <div className="flex items-center gap-3">
      {/* Avatar Circle */}
      <div className="relative shrink-0 w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-500 font-semibold text-xs tracking-wider select-none shadow-xs">
        {initials || "AD"}
      </div>

      {/* Profile Details (hidden when collapsed) */}
      {!collapsed && (
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-100 truncate block">
              {profile.name}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[10px] font-medium tracking-wide uppercase px-1.5 py-0.5 rounded-sm bg-slate-800 text-amber-400 border border-slate-700">
              {roleLabel}
            </span>
            <span className="text-[11px] text-slate-400 truncate hidden xl:inline">
              @{profile.username}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
