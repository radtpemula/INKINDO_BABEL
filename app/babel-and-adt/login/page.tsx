// app/babel-and-adt/login/page.tsx
// Dedicated Admin Login Page for INKINDO BABEL
// Target URL: /babel-and-adt/login
// Features server-side redirect if already authenticated, generic error handling, and clean engineering slate styling.

import React from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth/server";
import { AdminLoginForm } from "./AdminLoginForm";

export const metadata: Metadata = {
  title: "Login Administrator - INKINDO BABEL",
  description: "Portal Masuk Khusus Administrator INKINDO BABEL",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminLoginPage(): Promise<React.JSX.Element> {
  // If administrator is already logged in with valid active session, redirect directly to dashboard
  const auth = await getCurrentAdmin();
  if (auth.success) {
    redirect("/babel-and-adt");
  }

  return (
    <div className="min-h-screen bg-[#0B1120] flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-slate-100 selection:bg-amber-500/20 selection:text-amber-300">
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        {/* Brand & Emblem */}
        <div className="flex flex-col items-center text-center">
          <div className="relative w-12 h-12 mb-3">
            <Image
              src="/images/logo-inkindo.png"
              alt="Logo INKINDO BABEL"
              fill
              className="object-contain"
              priority
            />
          </div>
          <span className="text-[11px] font-semibold tracking-widest text-amber-500 uppercase">
            DPP INKINDO BABEL
          </span>
          <h1 className="text-xl font-bold tracking-tight text-slate-100 mt-1">
            Panel Pengelola Website
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xs">
            Masuk dengan kredensial administrator terdaftar untuk mengakses dashboard pengelolaan.
          </p>
        </div>

        {/* Login Card */}
        <div className="mt-6 bg-[#0F172A] py-8 px-6 sm:px-10 shadow-2xl border border-slate-800 rounded-xl">
          <AdminLoginForm />
        </div>

        {/* Footer info */}
        <div className="mt-8 text-center text-xs text-slate-400 flex items-center justify-center gap-4">
          <Link
            href="/"
            className="hover:text-slate-300 transition-colors text-slate-400"
          >
            ← Kembali ke Website Publik
          </Link>
          <span className="text-slate-600">•</span>
          <span>Sistem Terproteksi</span>
        </div>
      </div>
    </div>
  );
}
