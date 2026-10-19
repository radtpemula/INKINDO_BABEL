// app/babel-and-adt/(protected)/layout.tsx
// Server Component Layout for Protected Admin Routes
// Target Routes: /babel-and-adt, /babel-and-adt/* (except /babel-and-adt/login)
// Validates active admin session on the server.
// If unauthenticated or inactive, redirects immediately to /babel-and-adt/login.

import React from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth/server";

export const metadata: Metadata = {
  title: "Dashboard Administrator - INKINDO BABEL",
  description: "Panel Kontrol dan Administrasi Resmi INKINDO BABEL",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}): Promise<React.JSX.Element> {
  const auth = await getCurrentAdmin();

  // If session is absent, expired, invalid, or account is inactive, enforce server-side redirect to login
  if (!auth.success) {
    redirect("/babel-and-adt/login");
  }

  return <>{children}</>;
}
