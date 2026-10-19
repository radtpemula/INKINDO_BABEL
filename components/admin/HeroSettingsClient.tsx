"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Upload,
  RotateCcw,
  Save,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Layers,
  FileText,
  Loader2,
  ImageIcon,
  Compass,
  ShieldCheck,
  Award,
  HardHat,
  FileCheck2,
} from "lucide-react";
import { AdminDashboardShell } from "./AdminDashboardShell";
import type { AdminProfile } from "./types";
import {
  DEFAULT_HERO_SETTINGS,
  type PublicHeroSettings,
  type HeroCardSettings,
} from "@/lib/public/hero";
import {
  updateHeroBackgroundAction,
  restoreHeroBackgroundDefaultAction,
  updateHeroContentAction,
  restoreHeroContentDefaultAction,
  updateHeroCardsAction,
  restoreHeroCardsDefaultAction,
} from "@/lib/admin/hero-settings-actions";

interface HeroSettingsClientProps {
  profile: AdminProfile;
  initialSettings: PublicHeroSettings;
}

export function HeroSettingsClient({
  profile,
  initialSettings,
}: HeroSettingsClientProps): React.JSX.Element {
  // 1. State Background
  const [bgImage, setBgImage] = useState<string>(
    initialSettings.background.backgroundImagePath || ""
  );
  const [selectedBgFile, setSelectedBgFile] = useState<File | null>(null);
  const [previewBgUrl, setPreviewBgUrl] = useState<string | null>(null);
  const [isUploadingBg, setIsUploadingBg] = useState(false);
  const [isRestoringBg, setIsRestoringBg] = useState(false);
  const bgFileInputRef = useRef<HTMLInputElement | null>(null);

  // 2. State Content
  const [content, setContent] = useState(initialSettings.content);
  const [isSavingContent, setIsSavingContent] = useState(false);
  const [isRestoringContent, setIsRestoringContent] = useState(false);

  const [cards, setCards] = useState<HeroCardSettings>(
    initialSettings.cards ?? DEFAULT_HERO_SETTINGS.cards
  );
  const [isSavingCards, setIsSavingCards] = useState(false);
  const [isRestoringCards, setIsRestoringCards] = useState(false);

  // 3. Status Alerts
  const [alert, setAlert] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const showAlert = (type: "success" | "error", message: string) => {
    setAlert({ type, message });
    setTimeout(() => {
      setAlert((curr) => (curr?.message === message ? null : curr));
    }, 6000);
  };

  // Handler Ganti Berkas Background
  const handleBgFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showAlert("error", "Ukuran berkas melebihi batas maksimum 5 MB.");
      return;
    }

    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      showAlert("error", "Format berkas harus JPEG, PNG, atau WebP.");
      return;
    }

    setSelectedBgFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewBgUrl(objectUrl);
  };

  // Handler Simpan Background
  const handleSaveBackground = async () => {
    if (!selectedBgFile) {
      showAlert("error", "Pilih berkas gambar baru terlebih dahulu untuk disimpan.");
      return;
    }

    setIsUploadingBg(true);
    setAlert(null);

    try {
      // 1. Upload file ke endpoint /api/admin/hero-upload
      const formData = new FormData();
      formData.append("file", selectedBgFile);

      const uploadRes = await fetch("/api/admin/hero-upload", {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadRes.json();
      if (!uploadRes.ok || !uploadData.success) {
        throw new Error(uploadData.error || "Gagal mengunggah berkas gambar.");
      }

      const uploadedPath: string = uploadData.data.publicPath;

      // 2. Simpan jalur background ke database via Server Action
      const actionRes = await updateHeroBackgroundAction({
        backgroundImagePath: uploadedPath,
      });

      if (!actionRes.success) {
        throw new Error(actionRes.error || "Gagal menyimpan pengaturan background.");
      }

      setBgImage(uploadedPath);
      setSelectedBgFile(null);
      if (previewBgUrl) {
        URL.revokeObjectURL(previewBgUrl);
        setPreviewBgUrl(null);
      }
      if (bgFileInputRef.current) {
        bgFileInputRef.current.value = "";
      }

      showAlert("success", actionRes.message || "Background Hero berhasil diperbarui.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat menyimpan background.";
      showAlert("error", msg);
    } finally {
      setIsUploadingBg(false);
    }
  };

  // Handler Pulihkan Background Bawaan
  const handleRestoreBackground = async () => {
    if (!confirm("Kembalikan background Hero ke tampilan bawaan (vektor blueprint)?")) {
      return;
    }

    setIsRestoringBg(true);
    setAlert(null);

    try {
      const res = await restoreHeroBackgroundDefaultAction();
      if (!res.success) {
        throw new Error(res.error || "Gagal memulihkan background.");
      }

      setBgImage("");
      setSelectedBgFile(null);
      if (previewBgUrl) {
        URL.revokeObjectURL(previewBgUrl);
        setPreviewBgUrl(null);
      }
      if (bgFileInputRef.current) {
        bgFileInputRef.current.value = "";
      }

      showAlert("success", res.message || "Background bawaan berhasil dipulihkan.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat memulihkan background.";
      showAlert("error", msg);
    } finally {
      setIsRestoringBg(false);
    }
  };

  // Handler Simpan Konten Teks
  const handleSaveContent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingContent(true);
    setAlert(null);

    try {
      const res = await updateHeroContentAction(content);
      if (!res.success) {
        throw new Error(res.error || "Gagal memperbarui konten Hero.");
      }

      if (res.data) {
        setContent(res.data);
      }

      showAlert("success", res.message || "Konten teks Hero berhasil disimpan.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat menyimpan konten.";
      showAlert("error", msg);
    } finally {
      setIsSavingContent(false);
    }
  };

  // Handler Pulihkan Konten Bawaan
  const handleRestoreContent = async () => {
    if (!confirm("Pulihkan seluruh teks Hero ke konfigurasi teks bawaan?")) {
      return;
    }

    setIsRestoringContent(true);
    setAlert(null);

    try {
      const res = await restoreHeroContentDefaultAction();
      if (!res.success) {
        throw new Error(res.error || "Gagal memulihkan konten teks.");
      }

      // Reset state ke default bawaan
      setContent({
        badge: "Ikatan Nasional Konsultan Indonesia",
        titlePrefix: "DPP INKINDO",
        titleAccent: "BABEL",
        description:
          "Wadah Perusahaan Jasa Konsultansi Profesional, Berintegritas, dan Berdaya Saing Unggul di Provinsi Kepulauan Bangka Belitung.",
        primaryCtaText: "Daftar Anggota Baru",
        primaryCtaHref: "#membership-steps",
        secondaryCtaText: "Layanan SBU Online",
        secondaryCtaHref: "#sbu-steps",
        subBannerText:
          "Menjadi Mitra Strategis Pemerintah dan Masyarakat dalam Pembangunan",
        subBannerCtaText: "Daftar Sekarang",
        subBannerCtaHref: "#membership-steps",
      });

      showAlert("success", res.message || "Konten teks Hero berhasil dipulihkan.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat memulihkan konten.";
      showAlert("error", msg);
    } finally {
      setIsRestoringContent(false);
    }
  };

  const handleSaveCards = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingCards(true);
    setAlert(null);

    try {
      const res = await updateHeroCardsAction(cards);
      if (!res.success) {
        throw new Error(res.error || "Gagal memperbarui konten kartu.");
      }

      if (res.data) {
        setCards(res.data);
      }

      showAlert("success", res.message || "Konten kartu Hero berhasil disimpan.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat menyimpan konten kartu.";
      showAlert("error", msg);
    } finally {
      setIsSavingCards(false);
    }
  };

  const handleRestoreCards = async () => {
    if (!confirm("Pulihkan seluruh teks kartu Hero ke konfigurasi teks bawaan?")) {
      return;
    }

    setIsRestoringCards(true);
    setAlert(null);

    try {
      const res = await restoreHeroCardsDefaultAction();
      if (!res.success) {
        throw new Error(res.error || "Gagal memulihkan konten kartu.");
      }

      setCards(DEFAULT_HERO_SETTINGS.cards);
      showAlert("success", res.message || "Konten kartu Hero berhasil dipulihkan.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat memulihkan konten kartu.";
      showAlert("error", msg);
    } finally {
      setIsRestoringCards(false);
    }
  };

  const activeDisplayBg = previewBgUrl || bgImage;

  return (
    <AdminDashboardShell
      profile={profile}
      activeItemId="hero-settings"
      pageTitle="Pengaturan Hero"
    >
      <div className="space-y-8">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mb-1">
              <span>BERANDA</span>
              <span>/</span>
              <span className="text-amber-500">HERO SETTINGS</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Pengaturan Background & Konten Hero
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Kelola gambar background dan narasi banner utama secara independen.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              <span>Lihat Halaman Publik</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Status Alert */}
        {alert && (
          <div
            className={`p-4 rounded-xl border flex items-start gap-3 transition-all ${
              alert.type === "success"
                ? "bg-emerald-950/40 border-emerald-800/80 text-emerald-200"
                : "bg-rose-950/40 border-rose-800/80 text-rose-200"
            }`}
          >
            {alert.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 text-xs leading-relaxed font-medium">
              {alert.message}
            </div>
          </div>
        )}

        {/* SECTION 1: PENGATURAN BACKGROUND HERO */}
        <section className="rounded-xl bg-slate-900/80 border border-slate-800 p-6 sm:p-7 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <ImageIcon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white tracking-wide">
                  Background Hero Utama
                </h2>
                <p className="text-xs text-slate-400">
                  Pratinjau, unggah gambar kustom, atau pulihkan ke vektor blueprint bawaan.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-slate-300">
                STATUS: {bgImage ? "GAMBAR KUSTOM AKTIF" : "BLUEPRINT BAWAAN"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Box Pratinjau Background */}
            <div className="lg:col-span-7 space-y-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Pratinjau Tampilan Background
              </label>

              <div className="relative w-full h-56 sm:h-64 rounded-xl overflow-hidden border border-slate-700 bg-[#0F172A] shadow-inner flex items-center justify-center">
                {activeDisplayBg ? (
                  <>
                    <Image
                      src={activeDisplayBg}
                      alt="Pratinjau Background Hero"
                      fill
                      className="object-cover object-center"
                      sizes="(max-width: 1024px) 100vw, 640px"
                    />
                    <div className="absolute inset-0 bg-[#0F172A]/85 backdrop-blur-[1px]" />
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-[#0F172A]">
                    {/* Mockup Blueprint CAD Grid */}
                    <svg className="absolute inset-0 w-full h-full opacity-15" xmlns="http://www.w3.org/2000/svg">
                      <pattern id="admin-cad-preview" width="40" height="40" patternUnits="userSpaceOnUse">
                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#FFFFFF" strokeWidth="0.5" />
                      </pattern>
                      <rect width="100%" height="100%" fill="url(#admin-cad-preview)" />
                    </svg>
                    <Layers className="w-10 h-10 text-amber-500/60 mb-2 z-10" />
                    <p className="text-xs font-bold text-slate-200 z-10 uppercase tracking-wider">
                      Vektor Blueprint CAD Bawaan (#0F172A)
                    </p>
                    <p className="text-[11px] text-slate-400 max-w-sm mt-1 z-10">
                      Tampilan default institusional dengan koordinat geografis Bangka Belitung.
                    </p>
                  </div>
                )}

                {/* Overlay Badge Status */}
                <div className="absolute top-3 right-3 z-20">
                  <span className="px-2.5 py-1 text-[10px] font-mono font-semibold rounded bg-slate-950/80 border border-slate-700 text-slate-200 backdrop-blur-xs">
                    {previewBgUrl
                      ? "PRATINJAU FILE BARU"
                      : bgImage
                      ? "GAMBAR AKTIF"
                      : "BLUEPRINT DEFAULT"}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-slate-500">
                {bgImage ? (
                  <>Lokasi berkas: <code className="text-slate-400 font-mono">{bgImage}</code></>
                ) : (
                  "Tidak ada berkas kustom. Sistem merender blueprint geometri SVG secara native."
                )}
              </p>
            </div>

            {/* Kontrol Upload & Tombol */}
            <div className="lg:col-span-5 space-y-4">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Unggah Berkas Background
              </label>

              <div className="p-4 rounded-xl border border-dashed border-slate-700 bg-slate-950/40 space-y-3">
                <input
                  ref={bgFileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleBgFileSelect}
                  className="hidden"
                  id="hero-bg-file-input"
                />

                <label
                  htmlFor="hero-bg-file-input"
                  className="flex flex-col items-center justify-center p-5 rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-slate-800/60 cursor-pointer transition-colors text-center group"
                >
                  <Upload className="w-6 h-6 text-amber-400 group-hover:scale-110 transition-transform mb-2" />
                  <span className="text-xs font-semibold text-slate-200">
                    Pilih Gambar dari Komputer
                  </span>
                  <span className="text-[10px] text-slate-400 mt-1">
                    Format: JPEG, PNG, atau WebP (Maksimum 5 MB)
                  </span>
                </label>

                {selectedBgFile && (
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-700/80 flex items-center justify-between">
                    <div className="min-w-0 pr-2">
                      <p className="text-xs font-medium text-slate-200 truncate">
                        {selectedBgFile.name}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {(selectedBgFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedBgFile(null);
                        if (previewBgUrl) URL.revokeObjectURL(previewBgUrl);
                        setPreviewBgUrl(null);
                        if (bgFileInputRef.current) bgFileInputRef.current.value = "";
                      }}
                      className="text-xs text-rose-400 hover:text-rose-300 underline shrink-0 cursor-pointer"
                    >
                      Batal
                    </button>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleSaveBackground}
                  disabled={!selectedBgFile || isUploadingBg}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 transition-all cursor-pointer shadow-sm"
                >
                  {isUploadingBg ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Mengunggah...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Simpan Background</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleRestoreBackground}
                  disabled={isRestoringBg || (!bgImage && !selectedBgFile)}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-700 transition-colors cursor-pointer"
                >
                  {isRestoringBg ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <RotateCcw className="w-3.5 h-3.5" />
                  )}
                  <span>Pulihkan Bawaan</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: PENGATURAN KONTEN HERO UTAMA */}
        <section className="rounded-xl bg-slate-900/80 border border-slate-800 p-6 sm:p-7 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white tracking-wide">
                  Konten & Narasi Hero Utama
                </h2>
                <p className="text-xs text-slate-400">
                  Ubah badge, judul aksen, deskripsi narasi, dan tombol aksi tanpa menyentuh background.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRestoreContent}
                disabled={isRestoringContent}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors cursor-pointer disabled:opacity-50"
              >
                {isRestoringContent ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RotateCcw className="w-3.5 h-3.5" />
                )}
                <span>Pulihkan Teks Bawaan</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSaveContent} className="space-y-6">
            {/* 1. Badge & Judul */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
              <div className="md:col-span-12">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Badge Label Atas
                </label>
                <input
                  type="text"
                  value={content.badge}
                  onChange={(e) => setContent({ ...content, badge: e.target.value })}
                  placeholder="Contoh: Ikatan Nasional Konsultan Indonesia"
                  className="w-full px-4 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-500/50"
                  required
                />
              </div>

              <div className="md:col-span-8">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Judul Utama
                </label>
                <input
                  type="text"
                  value={content.titlePrefix}
                  onChange={(e) => setContent({ ...content, titlePrefix: e.target.value })}
                  placeholder="Contoh: DPP INKINDO"
                  className="w-full px-4 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-500/50"
                  required
                />
              </div>

              <div className="md:col-span-4">
                <label className="block text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">
                  Aksen Judul (Warna Emas)
                </label>
                <input
                  type="text"
                  value={content.titleAccent}
                  onChange={(e) => setContent({ ...content, titleAccent: e.target.value })}
                  placeholder="Contoh: BABEL"
                  className="w-full px-4 py-2.5 rounded-lg bg-slate-950 border border-amber-500/40 text-amber-400 text-xs font-bold focus:outline-hidden focus:ring-2 focus:ring-amber-500/50"
                  required
                />
              </div>
            </div>

            {/* 2. Deskripsi */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Deskripsi Narasi Hero
              </label>
              <textarea
                rows={3}
                value={content.description}
                onChange={(e) => setContent({ ...content, description: e.target.value })}
                placeholder="Tuliskan deskripsi ringkas organisasi..."
                className="w-full px-4 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs leading-relaxed focus:outline-hidden focus:ring-2 focus:ring-amber-500/50"
                required
              />
            </div>

            {/* 3. Tombol CTA */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-4">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Tombol Aksi Utama (CTA)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* CTA 1 */}
                <div className="space-y-3 p-3.5 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-[11px] font-semibold text-amber-400 block uppercase">
                    Tombol 1 (Solid Emas)
                  </span>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Label Tombol</label>
                    <input
                      type="text"
                      value={content.primaryCtaText}
                      onChange={(e) => setContent({ ...content, primaryCtaText: e.target.value })}
                      placeholder="Daftar Anggota Baru"
                      className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:ring-1 focus:ring-amber-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Tautan / URL Anchor</label>
                    <input
                      type="text"
                      value={content.primaryCtaHref}
                      onChange={(e) => setContent({ ...content, primaryCtaHref: e.target.value })}
                      placeholder="#membership-steps"
                      className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono focus:ring-1 focus:ring-amber-500"
                      required
                    />
                  </div>
                </div>

                {/* CTA 2 */}
                <div className="space-y-3 p-3.5 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-[11px] font-semibold text-slate-300 block uppercase">
                    Tombol 2 (Outline Abu-abu)
                  </span>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Label Tombol</label>
                    <input
                      type="text"
                      value={content.secondaryCtaText}
                      onChange={(e) => setContent({ ...content, secondaryCtaText: e.target.value })}
                      placeholder="Layanan SBU Online"
                      className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:ring-1 focus:ring-amber-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Tautan / URL Anchor</label>
                    <input
                      type="text"
                      value={content.secondaryCtaHref}
                      onChange={(e) => setContent({ ...content, secondaryCtaHref: e.target.value })}
                      placeholder="#sbu-steps"
                      className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono focus:ring-1 focus:ring-amber-500"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Sub-banner Bawah */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-4">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Sub-banner Bawah (Trust Ribbon)
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    Teks Pernyataan Strategis
                  </label>
                  <input
                    type="text"
                    value={content.subBannerText}
                    onChange={(e) => setContent({ ...content, subBannerText: e.target.value })}
                    placeholder="Menjadi Mitra Strategis Pemerintah dan Masyarakat dalam Pembangunan"
                    className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:ring-1 focus:ring-amber-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      Label Tombol Sub-banner
                    </label>
                    <input
                      type="text"
                      value={content.subBannerCtaText}
                      onChange={(e) => setContent({ ...content, subBannerCtaText: e.target.value })}
                      placeholder="Daftar Sekarang"
                      className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:ring-1 focus:ring-amber-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      URL Tombol Sub-banner
                    </label>
                    <input
                      type="text"
                      value={content.subBannerCtaHref}
                      onChange={(e) => setContent({ ...content, subBannerCtaHref: e.target.value })}
                      placeholder="#membership-steps"
                      className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono focus:ring-1 focus:ring-amber-500"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Tombol Simpan Form Konten */}
            <div className="pt-2 flex items-center justify-end">
              <button
                type="submit"
                disabled={isSavingContent}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 transition-all cursor-pointer shadow-sm"
              >
                {isSavingContent ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Simpan Konten Hero</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-xl bg-[#1E293B] border border-slate-800 p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white tracking-tight">
                  Konten Kartu Hero
                </h2>
                <p className="text-xs text-slate-400">
                  Kelola teks pada kartu visual sebelah kanan dan tiga kartu keunggulan teknis.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleRestoreCards}
              disabled={isRestoringCards}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 border border-slate-700 transition-colors cursor-pointer self-start sm:self-auto"
            >
              {isRestoringCards ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Memulihkan...</span>
                </>
              ) : (
                <>
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Pulihkan Teks Kartu Bawaan</span>
                </>
              )}
            </button>
          </div>

          <form onSubmit={handleSaveCards} className="space-y-6">
            <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-amber-500" />
                <span>Tiga Kartu Keunggulan Teknis (Di Bawah CTA Hero)</span>
              </div>
              <p className="text-xs text-slate-400">
                Tiga butir keunggulan kredibilitas yang tampil berjajar di kolom kiri di bawah tombol CTA.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                    <span>Keunggulan 1</span>
                  </label>
                  <input
                    type="text"
                    value={cards.highlight1Text}
                    onChange={(e) => setCards({ ...cards, highlight1Text: e.target.value })}
                    placeholder="Asosiasi Resmi Terdaftar"
                    className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:ring-1 focus:ring-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1 flex items-center gap-1.5">
                    <FileCheck2 className="w-3.5 h-3.5 text-amber-500" />
                    <span>Keunggulan 2</span>
                  </label>
                  <input
                    type="text"
                    value={cards.highlight2Text}
                    onChange={(e) => setCards({ ...cards, highlight2Text: e.target.value })}
                    placeholder="Sertifikasi Standar LPJK"
                    className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:ring-1 focus:ring-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1 flex items-center gap-1.5">
                    <HardHat className="w-3.5 h-3.5 text-amber-500" />
                    <span>Keunggulan 3</span>
                  </label>
                  <input
                    type="text"
                    value={cards.highlight3Text}
                    onChange={(e) => setCards({ ...cards, highlight3Text: e.target.value })}
                    placeholder="120+ Konsultan Babel"
                    className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:ring-1 focus:ring-amber-500"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
                <Compass className="w-4 h-4 text-amber-500" />
                <span>Kartu Visual Sebelah Kanan (Header & Fitur)</span>
              </div>
              <p className="text-xs text-slate-400">
                Informasi judul, wilayah, badge, dan dua kotak fitur pada kartu visual utama.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    Judul Header Kartu
                  </label>
                  <input
                    type="text"
                    value={cards.cardTitle}
                    onChange={(e) => setCards({ ...cards, cardTitle: e.target.value })}
                    placeholder="Rekayasa & Desain Konsultansi"
                    className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:ring-1 focus:ring-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    Subjudul / Wilayah Kartu
                  </label>
                  <input
                    type="text"
                    value={cards.cardSubtitle}
                    onChange={(e) => setCards({ ...cards, cardSubtitle: e.target.value })}
                    placeholder="Wilayah Kepulauan Bangka Belitung"
                    className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:ring-1 focus:ring-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    Badge Slogan Kartu
                  </label>
                  <input
                    type="text"
                    value={cards.cardBadge}
                    onChange={(e) => setCards({ ...cards, cardBadge: e.target.value })}
                    placeholder="SERUMPUN SEBALAI"
                    className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono focus:ring-1 focus:ring-amber-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  Tag Fallback Ilustrasi (Saat Tanpa Slide Gambar)
                </label>
                <input
                  type="text"
                  value={cards.cardFallbackTag}
                  onChange={(e) => setCards({ ...cards, cardFallbackTag: e.target.value })}
                  placeholder="STRUKTUR MARITIM & SIPIL"
                  className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono focus:ring-1 focus:ring-amber-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-800/80">
                <div className="p-3 rounded bg-slate-950/60 border border-slate-800 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                    <Award className="w-3.5 h-3.5 text-amber-500" />
                    <span>Kotak Fitur 1 (Kiri)</span>
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Judul Fitur 1</label>
                    <input
                      type="text"
                      value={cards.cardFeature1Title}
                      onChange={(e) => setCards({ ...cards, cardFeature1Title: e.target.value })}
                      placeholder="Terakreditasi"
                      className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:ring-1 focus:ring-amber-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Deskripsi Fitur 1</label>
                    <input
                      type="text"
                      value={cards.cardFeature1Desc}
                      onChange={(e) => setCards({ ...cards, cardFeature1Desc: e.target.value })}
                      placeholder="Standar Asosiasi Konsultan Nasional"
                      className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:ring-1 focus:ring-amber-500"
                      required
                    />
                  </div>
                </div>

                <div className="p-3 rounded bg-slate-950/60 border border-slate-800 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                    <HardHat className="w-3.5 h-3.5 text-slate-400" />
                    <span>Kotak Fitur 2 (Kanan)</span>
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Judul Fitur 2</label>
                    <input
                      type="text"
                      value={cards.cardFeature2Title}
                      onChange={(e) => setCards({ ...cards, cardFeature2Title: e.target.value })}
                      placeholder="Multi Disiplin"
                      className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:ring-1 focus:ring-amber-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Deskripsi Fitur 2</label>
                    <input
                      type="text"
                      value={cards.cardFeature2Desc}
                      onChange={(e) => setCards({ ...cards, cardFeature2Desc: e.target.value })}
                      placeholder="Konstruksi, Maritim, & Lingkungan"
                      className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:ring-1 focus:ring-amber-500"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end">
              <button
                type="submit"
                disabled={isSavingCards}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 transition-all cursor-pointer shadow-sm"
              >
                {isSavingCards ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Simpan Konten Kartu</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </section>
      </div>
    </AdminDashboardShell>
  );
}
