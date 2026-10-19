// app/babel-and-adt/AdminDashboardClient.tsx
// Client Component wrapper for Admin Dashboard
// Integrates AdminDashboardShell, client-side logout handler, and section panels.

"use client";

import React, { useState, useTransition } from "react";
import {
  AdminDashboardShell,
  type AdminProfile,
} from "@/components/admin";
import { logoutAdminAction } from "@/lib/auth/actions";
import {
  Users,
  ShieldCheck,
  Clock,
  Database,
  ArrowUpRight,
  Info,
  CheckCircle2,
  Terminal,
} from "lucide-react";

interface AdminDashboardClientProps {
  profile: AdminProfile;
  totalAdminCount: number;
}

export function AdminDashboardClient({
  profile,
  totalAdminCount,
}: AdminDashboardClientProps): React.JSX.Element {
  const [activeItemId, setActiveItemId] = useState("overview");
  const [, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      await logoutAdminAction();
    });
  };

  const roleBadge =
    profile.role === "SUPER_ADMIN"
      ? "Super Administrator"
      : profile.role === "ADMIN"
        ? "Administrator"
        : "Editor Konten";

  return (
    <AdminDashboardShell
      profile={profile}
      activeItemId={activeItemId}
      onSelectItem={(id) => setActiveItemId(id)}
      onLogout={handleLogout}
      pageSubtitle={`Selamat datang kembali, ${profile.name}`}
    >
      {/* 1. Header Hero Welcome Card */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[#0F172A] to-[#1E293B] border border-slate-800 p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span>Sesi Terautentikasi Aktif</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-100">
            Halo, {profile.name}
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-400 leading-relaxed">
            Anda masuk ke sistem administrasi portal resmi INKINDO BABEL dengan hak akses{" "}
            <span className="text-amber-400 font-semibold">{roleBadge}</span>.
          </p>
        </div>

        {/* CAD Grid Decoration */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
      </div>

      {/* 2. Key Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Pengelola</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-100">{totalAdminCount}</span>
            <span className="text-xs text-slate-400 ml-1.5">Akun Aktif</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Tersinkronisasi SQLite</span>
          </p>
        </div>

        {/* Metric 2 */}
        <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Tingkat Hak Akses</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-sm font-bold text-slate-100 uppercase tracking-wide">
              {profile.role}
            </span>
          </div>
          <p className="mt-2 text-[11px] text-slate-400">
            Username: <span className="text-slate-300">@{profile.username}</span>
          </p>
        </div>

        {/* Metric 3 */}
        <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Engine Database</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-sm font-bold text-slate-100">Prisma 6.19 + SQLite</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-400">
            Status: <span className="text-emerald-400 font-medium">Terkoneksi</span>
          </p>
        </div>

        {/* Metric 4 */}
        <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Masa Berlaku Sesi</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-100">8</span>
            <span className="text-xs text-slate-400 ml-1.5">Jam (HttpOnly JWT)</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-400">
            Enkripsi: <span className="text-slate-300">HS256 Jose</span>
          </p>
        </div>
      </div>

      {/* 3. Panel Status & Navigasi Pengelolaan */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Information Card */}
        <div className="lg:col-span-2 bg-[#0F172A] border border-slate-800 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-slate-100 font-semibold text-sm">
              <Info className="w-4 h-4 text-amber-500" />
              <span>Status Pengelolaan Beranda & Konten</span>
            </div>
            <span className="text-[11px] font-medium text-slate-400">Sub-tahap 2.5</span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Autentikasi administrator telah terhubung secara penuh antara server action, basis data SQLite,
            dan antarmuka dashboard. Menu navigasi di sisi kiri telah terstruktur untuk tahap pengembangan berikutnya.
          </p>

          <div className="rounded-lg bg-slate-900/80 border border-slate-800 p-4 space-y-3">
            <h4 className="text-xs font-semibold text-slate-200">
              Catatan Arsitektur Pengelolaan:
            </h4>
            <ul className="text-xs text-slate-400 space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Halaman Login Publik:</strong> Rute <code className="text-amber-400 text-[11px]">/login</code> tetap dipertahankan untuk portal anggota.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Rute Terproteksi:</strong> Rute <code className="text-amber-400 text-[11px]">/babel-and-adt</code> diperiksa langsung di server (Server Components) dengan pengecekan database langsung.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Keamanan Kredensial:</strong> Sesi disimpan dalam cookie <code className="text-slate-300 text-[11px]">inkindo_admin_session</code> (HttpOnly, SameSite Lax, Secure di production).
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Right Column: Quick Info & Terminal Command Card */}
        <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-slate-100 font-semibold text-sm border-b border-slate-800 pb-3">
            <Terminal className="w-4 h-4 text-amber-500" />
            <span>Manajemen Kredensial</span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Untuk menambah akun administrator baru secara aman, jalankan script CLI dari terminal:
          </p>

          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] text-amber-400 flex items-center justify-between">
            <code>npm run admin:create</code>
          </div>

          <div className="text-[11px] text-slate-400 space-y-1">
            <p>• Masking password interaktif otomatis di terminal.</p>
            <p>• Pengecekan duplikasi unik tanpa menimpa data.</p>
            <p>• Enkripsi bcrypt 12 salt rounds di server lokal.</p>
          </div>

          <div className="pt-2 border-t border-slate-800">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-lg text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 hover:text-amber-400 transition-colors"
            >
              <span>Buka Website Publik</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </AdminDashboardShell>
  );
}
