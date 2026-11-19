"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import {
  AdminDashboardShell,
  type AdminProfile,
  type DashboardOverviewData,
} from "@/components/admin";
import { logoutAdminAction } from "@/lib/auth/actions";
import {
  SlidersHorizontal,
  Newspaper,
  Briefcase,
  Handshake,
  Settings,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  Star,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";

interface AdminDashboardClientProps {
  profile: AdminProfile;
  overviewData: DashboardOverviewData | null;
  dbError?: string | null;
}

export function AdminDashboardClient({
  profile,
  overviewData,
  dbError,
}: AdminDashboardClientProps): React.JSX.Element {
  const [activeItemId, setActiveItemId] = useState("overview");
  const [, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      await logoutAdminAction();
    });
  };

  const roleLabel =
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
      pageTitle="Ringkasan Dashboard"
      pageSubtitle="Pantau dan kelola seluruh konten website INKINDO BABEL dari satu tempat."
    >
      <div className="space-y-6 sm:space-y-8">
        {/* Header Title & Intro Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span>Panel Pengelola Konten</span>
              </span>
              <span className="text-xs text-slate-400">
                Masuk sebagai <strong className="text-slate-200">{profile.name}</strong> ({roleLabel})
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-100">
              Ringkasan Dashboard
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-400">
              Pantau dan kelola seluruh konten website INKINDO BABEL dari satu tempat.
            </p>
          </div>
        </div>

        {/* Database Error Banner (if any) */}
        {dbError && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-200 text-xs flex items-start gap-3 shadow-xs">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-semibold text-red-100">Gagal Mengambil Data Real-Time</p>
              <p className="text-red-300 leading-relaxed">{dbError}</p>
            </div>
          </div>
        )}

        {/* Content Management Overview Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 xl:gap-6">
          {/* 1. Hero Beranda */}
          <div className="bg-[#0F172A] border border-slate-800 hover:border-slate-700/80 rounded-xl p-5 sm:p-6 shadow-xs flex flex-col justify-between transition-colors">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-[#D97706] shrink-0">
                    <SlidersHorizontal className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-bold text-slate-100">
                      Hero Beranda
                    </h2>
                    <span className="text-[11px] text-slate-400">
                      Slideshow Banner
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-slate-100 font-mono tracking-tight tabular-nums">
                    {overviewData?.hero.total ?? 0}
                  </span>
                  <span className="text-xs font-medium text-slate-400">
                    Total Slide
                  </span>
                </div>
              </div>

              {/* Status Breakdown */}
              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800/80 text-xs">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Aktif: {overviewData?.hero.active ?? 0}</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700/60 text-slate-400 font-medium">
                  <XCircle className="w-3.5 h-3.5 text-slate-500" />
                  <span>Nonaktif: {overviewData?.hero.inactive ?? 0}</span>
                </span>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Banner visual utama dan rotasi gambar slideshow pada beranda publik.
              </p>
            </div>

            <div className="pt-5 mt-4 border-t border-slate-800/80">
              <Link
                href="/babel-and-adt/hero"
                className="inline-flex items-center justify-between w-full px-3.5 py-2.5 rounded-lg text-xs font-semibold text-slate-200 bg-slate-900 hover:bg-[#D97706] hover:text-slate-950 border border-slate-800 hover:border-[#D97706] transition-all duration-150 group/btn focus:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500/50"
              >
                <span>Kelola Hero</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform duration-150 group-hover/btn:translate-x-0.5" />
              </Link>
            </div>
          </div>

          {/* 2. Berita & Publikasi */}
          <div className="bg-[#0F172A] border border-slate-800 hover:border-slate-700/80 rounded-xl p-5 sm:p-6 shadow-xs flex flex-col justify-between transition-colors">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-[#D97706] shrink-0">
                    <Newspaper className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-bold text-slate-100">
                      Berita & Publikasi
                    </h2>
                    <span className="text-[11px] text-slate-400">
                      Artikel & Agenda
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-slate-100 font-mono tracking-tight tabular-nums">
                    {overviewData?.news.total ?? 0}
                  </span>
                  <span className="text-xs font-medium text-slate-400">
                    Total Artikel
                  </span>
                </div>
              </div>

              {/* Status Breakdown */}
              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800/80 text-xs">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Diterbitkan: {overviewData?.news.published ?? 0}</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 font-medium">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Draft: {overviewData?.news.draft ?? 0}</span>
                </span>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Artikel rilis berita resmi, publikasi kebijakan, dan agenda kegiatan organisasi.
              </p>
            </div>

            <div className="pt-5 mt-4 border-t border-slate-800/80">
              <Link
                href="/babel-and-adt/news"
                className="inline-flex items-center justify-between w-full px-3.5 py-2.5 rounded-lg text-xs font-semibold text-slate-200 bg-slate-900 hover:bg-[#D97706] hover:text-slate-950 border border-slate-800 hover:border-[#D97706] transition-all duration-150 group/btn focus:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500/50"
              >
                <span>Kelola Berita</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform duration-150 group-hover/btn:translate-x-0.5" />
              </Link>
            </div>
          </div>

          {/* 3. Karya Anggota */}
          <div className="bg-[#0F172A] border border-slate-800 hover:border-slate-700/80 rounded-xl p-5 sm:p-6 shadow-xs flex flex-col justify-between transition-colors">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-[#D97706] shrink-0">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-bold text-slate-100">
                      Karya Anggota
                    </h2>
                    <span className="text-[11px] text-slate-400">
                      Portofolio Konsultansi
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-slate-100 font-mono tracking-tight tabular-nums">
                    {overviewData?.memberWorks.total ?? 0}
                  </span>
                  <span className="text-xs font-medium text-slate-400">
                    Total Portofolio
                  </span>
                </div>
              </div>

              {/* Status Breakdown */}
              <div className="space-y-2 pt-1 border-t border-slate-800/80 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Aktif: {overviewData?.memberWorks.active ?? 0}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700/60 text-slate-400 font-medium">
                    <XCircle className="w-3.5 h-3.5 text-slate-500" />
                    <span>Nonaktif: {overviewData?.memberWorks.inactive ?? 0}</span>
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-300 font-medium text-[11px]">
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    <span>Unggulan Beranda: {overviewData?.memberWorks.featured ?? 0}</span>
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Dokumentasi proyek rekayasa konsultansi dan karya badan usaha anggota.
              </p>
            </div>

            <div className="pt-5 mt-4 border-t border-slate-800/80">
              <Link
                href="/babel-and-adt/member-works"
                className="inline-flex items-center justify-between w-full px-3.5 py-2.5 rounded-lg text-xs font-semibold text-slate-200 bg-slate-900 hover:bg-[#D97706] hover:text-slate-950 border border-slate-800 hover:border-[#D97706] transition-all duration-150 group/btn focus:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500/50"
              >
                <span>Kelola Karya Anggota</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform duration-150 group-hover/btn:translate-x-0.5" />
              </Link>
            </div>
          </div>

          {/* 4. Mitra Kerja */}
          <div className="bg-[#0F172A] border border-slate-800 hover:border-slate-700/80 rounded-xl p-5 sm:p-6 shadow-xs flex flex-col justify-between transition-colors">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-[#D97706] shrink-0">
                    <Handshake className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-bold text-slate-100">
                      Mitra Kerja
                    </h2>
                    <span className="text-[11px] text-slate-400">
                      Afiliasi & Jaringan
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-slate-100 font-mono tracking-tight tabular-nums">
                    {overviewData?.partners.total ?? 0}
                  </span>
                  <span className="text-xs font-medium text-slate-400">
                    Total Mitra
                  </span>
                </div>
              </div>

              {/* Status Breakdown */}
              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800/80 text-xs">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Aktif: {overviewData?.partners.active ?? 0}</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700/60 text-slate-400 font-medium">
                  <XCircle className="w-3.5 h-3.5 text-slate-500" />
                  <span>Nonaktif: {overviewData?.partners.inactive ?? 0}</span>
                </span>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Jaringan kemitraan instansi pemerintah, perbankan, dan asosiasi industri.
              </p>
            </div>

            <div className="pt-5 mt-4 border-t border-slate-800/80">
              <Link
                href="/babel-and-adt/partners"
                className="inline-flex items-center justify-between w-full px-3.5 py-2.5 rounded-lg text-xs font-semibold text-slate-200 bg-slate-900 hover:bg-[#D97706] hover:text-slate-950 border border-slate-800 hover:border-[#D97706] transition-all duration-150 group/btn focus:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500/50"
              >
                <span>Kelola Mitra Kerja</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform duration-150 group-hover/btn:translate-x-0.5" />
              </Link>
            </div>
          </div>

          {/* 5. Pengaturan Website */}
          <div className="bg-[#0F172A] border border-slate-800 hover:border-slate-700/80 rounded-xl p-5 sm:p-6 shadow-xs flex flex-col justify-between transition-colors">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-[#D97706] shrink-0">
                    <Settings className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-bold text-slate-100">
                      Pengaturan Website
                    </h2>
                    <span className="text-[11px] text-slate-400">
                      Konfigurasi Global
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-slate-100 font-mono tracking-tight tabular-nums">
                    5
                  </span>
                  <span className="text-xs font-medium text-slate-400">
                    Kelompok Konfigurasi
                  </span>
                </div>
              </div>

              {/* Setting Groups Breakdown */}
              <div className="space-y-1.5 pt-1 border-t border-slate-800/80 text-xs">
                <div className="flex flex-wrap gap-1.5">
                  <span className="px-2 py-0.5 rounded-md bg-slate-800/90 border border-slate-700/70 text-[11px] text-slate-300">
                    Identitas Website
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-800/90 border border-slate-700/70 text-[11px] text-slate-300">
                    Informasi Kontak
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-800/90 border border-slate-700/70 text-[11px] text-slate-300">
                    Topbar Navigasi
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-800/90 border border-slate-700/70 text-[11px] text-slate-300">
                    Footer & Legal
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-800/90 border border-slate-700/70 text-[11px] text-slate-300">
                    Media Sosial
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Profil resmi asosiasi, kontak sekretariat, teks navigasi, dan tautan media sosial.
              </p>
            </div>

            <div className="pt-5 mt-4 border-t border-slate-800/80">
              <Link
                href="/babel-and-adt/settings"
                className="inline-flex items-center justify-between w-full px-3.5 py-2.5 rounded-lg text-xs font-semibold text-slate-200 bg-slate-900 hover:bg-[#D97706] hover:text-slate-950 border border-slate-800 hover:border-[#D97706] transition-all duration-150 group/btn focus:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500/50"
              >
                <span>Buka Pengaturan</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform duration-150 group-hover/btn:translate-x-0.5" />
              </Link>
            </div>
          </div>

          {/* 6. Manajemen Admin (SUPER_ADMIN Only) */}
          {overviewData?.admins && (
            <div className="bg-[#0F172A] border border-slate-800 hover:border-slate-700/80 rounded-xl p-5 sm:p-6 shadow-xs flex flex-col justify-between transition-colors">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-[#D97706] shrink-0">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-sm sm:text-base font-bold text-slate-100">
                        Manajemen Admin
                      </h2>
                      <span className="text-[11px] text-slate-400">
                        Hak Akses Sistem
                      </span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold">
                    SUPER ADMIN
                  </span>
                </div>

                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-slate-100 font-mono tracking-tight tabular-nums">
                      {overviewData.admins.total}
                    </span>
                    <span className="text-xs font-medium text-slate-400">
                      Total Akun Pengelola
                    </span>
                  </div>
                </div>

                {/* Status Breakdown & Roles */}
                <div className="space-y-2 pt-1 border-t border-slate-800/80 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Aktif: {overviewData.admins.active}</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700/60 text-slate-400 font-medium">
                      <XCircle className="w-3.5 h-3.5 text-slate-500" />
                      <span>Nonaktif: {overviewData.admins.inactive}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <span>Role:</span>
                    <span className="text-slate-300 font-medium">
                      {overviewData.admins.roles.superAdmin} Super Admin
                    </span>
                    <span>•</span>
                    <span className="text-slate-300 font-medium">
                      {overviewData.admins.roles.admin} Admin
                    </span>
                    {overviewData.admins.roles.editor > 0 && (
                      <>
                        <span>•</span>
                        <span className="text-slate-300 font-medium">
                          {overviewData.admins.roles.editor} Editor
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  Pengelolaan akun administrator terverifikasi dan pembagian hak akses sistem.
                </p>
              </div>

              <div className="pt-5 mt-4 border-t border-slate-800/80">
                <Link
                  href="/babel-and-adt/admin"
                  className="inline-flex items-center justify-between w-full px-3.5 py-2.5 rounded-lg text-xs font-semibold text-slate-200 bg-slate-900 hover:bg-[#D97706] hover:text-slate-950 border border-slate-800 hover:border-[#D97706] transition-all duration-150 group/btn focus:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500/50"
                >
                  <span>Kelola Admin</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform duration-150 group-hover/btn:translate-x-0.5" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminDashboardShell>
  );
}
