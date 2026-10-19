// components/admin/AdminMainContent.tsx
// Main layout container for admin dashboard content
// Clean surface, responsive margins, zero horizontal overflow

import React from "react";

interface AdminMainContentProps {
  children?: React.ReactNode;
  className?: string;
}

export function AdminMainContent({
  children,
  className = "",
}: AdminMainContentProps): React.JSX.Element {
  return (
    <main
      className={`flex-1 p-4 sm:p-6 lg:p-8 bg-[#0B1120] text-slate-100 overflow-y-auto ${className}`}
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {children}
      </div>
    </main>
  );
}
