// app/babel-and-adt/layout.tsx
// Root Layout for /babel-and-adt section (both login and protected sub-routes)
// Passes children through cleanly without blocking login page.

import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Administrator - INKINDO BABEL",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return <>{children}</>;
}
