"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Building2,
  Phone,
  LayoutDashboard,
  FileText,
  Share2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RotateCcw,
  Save,
  ExternalLink,
  Shield,
  Mail,
  MapPin,
  Clock,
  Printer,
  Globe,
  Info,
  X,
} from "lucide-react";

function InstagramIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function FacebookIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z" />
    </svg>
  );
}

function YouTubeIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M21.58 7.19a2.76 2.76 0 0 0-1.95-1.96C17.9 4.75 12 4.75 12 4.75s-5.9 0-7.63.48a2.76 2.76 0 0 0-1.95 1.96C2 8.93 2 12 2 12s0 3.07.42 4.81c.24.9.95 1.6 1.85 1.85 1.73.48 7.73.48 7.73.48s5.9 0 7.63-.48c.9-.24 1.61-.95 1.85-1.85.42-1.74.42-4.81.42-4.81s0-3.07-.42-4.81zM9.75 15.02V8.98L15.5 12l-5.75 3.02z" />
    </svg>
  );
}

function LinkedInIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76A1.66 1.66 0 0 0 8.12 7.1 1.66 1.66 0 0 0 6.46 5.44a1.66 1.66 0 0 0-1.66 1.66 1.66 1.66 0 0 0 1.66 1.66m1.39 9.74v-8.37H5.07v8.37h2.78z" />
    </svg>
  );
}
import { AdminDashboardShell } from "./AdminDashboardShell";
import type { AdminProfile } from "./types";
import {
  DEFAULT_SITE_SETTINGS,
  type PublicSiteSettings,
  type SiteIdentitySettings,
  type SiteContactSettings,
  type SiteTopbarSettings,
  type SiteFooterSettings,
  type SiteSocialSettings,
} from "@/lib/public/settings";
import {
  updateSiteIdentityAction,
  updateSiteContactAction,
  updateSiteTopbarAction,
  updateSiteFooterAction,
  updateSiteSocialAction,
  restoreSiteSectionDefaultAction,
} from "@/lib/admin/settings-actions";

interface SiteSettingsClientProps {
  profile: AdminProfile;
  initialSettings: PublicSiteSettings;
}

type SettingsTab = "identity" | "contact" | "topbar" | "footer" | "social";

export function SiteSettingsClient({
  profile,
  initialSettings,
}: SiteSettingsClientProps): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<SettingsTab>("identity");

  const [identityForm, setIdentityForm] = useState<SiteIdentitySettings>(initialSettings.identity);
  const [contactForm, setContactForm] = useState<SiteContactSettings>(initialSettings.contact);
  const [topbarForm, setTopbarForm] = useState<SiteTopbarSettings>(initialSettings.topbar);
  const [footerForm, setFooterForm] = useState<SiteFooterSettings>(initialSettings.footer);
  const [socialForm, setSocialForm] = useState<SiteSocialSettings>(initialSettings.social);

  const [isSaving, setIsSaving] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [confirmRestore, setConfirmRestore] = useState<SettingsTab | null>(null);

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification((prev) => (prev?.message === message ? null : prev));
    }, 5000);
  };

  const handleSaveIdentity = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const res = await updateSiteIdentityAction(identityForm);
    setIsSaving(false);

    if (res.success && res.data) {
      setIdentityForm(res.data);
      showNotification("success", res.message ?? "Identitas website berhasil disimpan.");
    } else {
      showNotification("error", res.error ?? "Gagal menyimpan identitas website.");
    }
  };

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const res = await updateSiteContactAction(contactForm);
    setIsSaving(false);

    if (res.success && res.data) {
      setContactForm(res.data);
      showNotification("success", res.message ?? "Informasi kontak berhasil disimpan.");
    } else {
      showNotification("error", res.error ?? "Gagal menyimpan informasi kontak.");
    }
  };

  const handleSaveTopbar = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const res = await updateSiteTopbarAction(topbarForm);
    setIsSaving(false);

    if (res.success && res.data) {
      setTopbarForm(res.data);
      showNotification("success", res.message ?? "Pengaturan topbar berhasil disimpan.");
    } else {
      showNotification("error", res.error ?? "Gagal menyimpan pengaturan topbar.");
    }
  };

  const handleSaveFooter = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const res = await updateSiteFooterAction(footerForm);
    setIsSaving(false);

    if (res.success && res.data) {
      setFooterForm(res.data);
      showNotification("success", res.message ?? "Pengaturan footer berhasil disimpan.");
    } else {
      showNotification("error", res.error ?? "Gagal menyimpan pengaturan footer.");
    }
  };

  const handleSaveSocial = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const res = await updateSiteSocialAction(socialForm);
    setIsSaving(false);

    if (res.success && res.data) {
      setSocialForm(res.data);
      showNotification("success", res.message ?? "Tautan media sosial berhasil disimpan.");
    } else {
      showNotification("error", res.error ?? "Gagal menyimpan tautan media sosial.");
    }
  };

  const handleExecuteRestore = async () => {
    if (!confirmRestore) return;
    const targetSection = confirmRestore;
    setIsRestoring(true);

    const res = await restoreSiteSectionDefaultAction(targetSection);
    setIsRestoring(false);
    setConfirmRestore(null);

    if (res.success) {
      if (targetSection === "identity") {
        setIdentityForm(DEFAULT_SITE_SETTINGS.identity);
      } else if (targetSection === "contact") {
        setContactForm(DEFAULT_SITE_SETTINGS.contact);
      } else if (targetSection === "topbar") {
        setTopbarForm(DEFAULT_SITE_SETTINGS.topbar);
      } else if (targetSection === "footer") {
        setFooterForm(DEFAULT_SITE_SETTINGS.footer);
      } else if (targetSection === "social") {
        setSocialForm(DEFAULT_SITE_SETTINGS.social);
      }
      showNotification("success", res.message ?? "Pengaturan berhasil dikembalikan ke bawaan.");
    } else {
      showNotification("error", res.error ?? "Gagal memulihkan pengaturan bawaan.");
    }
  };

  const tabsConfig: { id: SettingsTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "identity", label: "Identitas Website", icon: Building2 },
    { id: "contact", label: "Informasi Kontak", icon: Phone },
    { id: "topbar", label: "Topbar", icon: LayoutDashboard },
    { id: "footer", label: "Footer", icon: FileText },
    { id: "social", label: "Media Sosial", icon: Share2 },
  ];

  return (
    <AdminDashboardShell
      profile={profile}
      activeItemId="settings"
      pageTitle="Pengaturan Website"
      pageSubtitle="Kelola identitas organisasi, kontak sekretariat, topbar, footer, dan tautan media sosial"
      headerActions={
        <Link
          href="/"
          target="_blank"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors"
        >
          <span>Lihat Website</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      }
    >
      <div className="space-y-6">
        {notification && (
          <div
            className={`p-4 rounded-xl border flex items-start justify-between gap-3 transition-all ${
              notification.type === "success"
                ? "bg-emerald-950/40 border-emerald-800/80 text-emerald-200"
                : "bg-rose-950/40 border-rose-800/80 text-rose-200"
            }`}
          >
            <div className="flex items-center gap-2.5">
              {notification.type === "success" ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              )}
              <span className="text-sm font-medium">{notification.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setNotification(null)}
              className="p-1 hover:bg-slate-800/60 rounded text-slate-400 hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="border-b border-slate-800 flex items-center gap-2 overflow-x-auto pb-px">
          {tabsConfig.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-semibold whitespace-nowrap border-b-2 transition-all ${
                  isActive
                    ? "border-amber-500 text-amber-400 bg-slate-800/40"
                    : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-850/40"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-amber-400" : "text-slate-500"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {activeTab === "identity" && (
          <div className="space-y-6">
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 sm:p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-amber-500" />
                    <span>Identitas Resmi Organisasi</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Nama institusi, tagline resmi, wilayah provinsi, dan narasi profil singkat
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setConfirmRestore("identity")}
                  disabled={isSaving || isRestoring}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700/80 transition-colors self-start sm:self-auto"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
                  <span>Pulihkan Bawaan</span>
                </button>
              </div>

              <form onSubmit={handleSaveIdentity} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-300">
                      Nama Organisasi <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={identityForm.orgName}
                      onChange={(e) => setIdentityForm((prev) => ({ ...prev, orgName: e.target.value }))}
                      maxLength={100}
                      required
                      placeholder="INKINDO BABEL"
                      className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-amber-500/40"
                    />
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Ditampilkan di header, footer, dan dokumen resmi</span>
                      <span>{identityForm.orgName.length}/100</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-300">
                      Wilayah Organisasi <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={identityForm.region}
                      onChange={(e) => setIdentityForm((prev) => ({ ...prev, region: e.target.value }))}
                      maxLength={100}
                      required
                      placeholder="Provinsi Kepulauan Bangka Belitung"
                      className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-amber-500/40"
                    />
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Label yurisdiksi kepengurusan provinsi</span>
                      <span>{identityForm.region.length}/100</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Tagline Organisasi <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={identityForm.tagline}
                    onChange={(e) => setIdentityForm((prev) => ({ ...prev, tagline: e.target.value }))}
                    maxLength={250}
                    required
                    placeholder="Dewan Pengurus Provinsi Ikatan Nasional Konsultan Indonesia Kepulauan Bangka Belitung"
                    className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-amber-500/40"
                  />
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Nama lengkap badan kepengurusan asosiasi</span>
                    <span>{identityForm.tagline.length}/250</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Deskripsi Profil Singkat <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={identityForm.description}
                    onChange={(e) => setIdentityForm((prev) => ({ ...prev, description: e.target.value }))}
                    maxLength={500}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-amber-500/40"
                  />
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Ringkasan visi dan peran lembaga konsultan</span>
                    <span>{identityForm.description.length}/500</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold text-slate-900 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 transition-colors shadow-xs"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>Simpan Identitas Website</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {activeTab === "contact" && (
          <div className="space-y-6">
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 sm:p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Phone className="w-4 h-4 text-amber-500" />
                    <span>Informasi Kontak Sekretariat DPP</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Kontak resmi kantor untuk komunikasi anggota, lembaga kemitraan, dan masyarakat umum
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setConfirmRestore("contact")}
                  disabled={isSaving || isRestoring}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700/80 transition-colors self-start sm:self-auto"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
                  <span>Pulihkan Bawaan</span>
                </button>
              </div>

              <form onSubmit={handleSaveContact} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-300">
                      Nomor Telepon Sekretariat <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                      <input
                        type="text"
                        value={contactForm.phone}
                        onChange={(e) => setContactForm((prev) => ({ ...prev, phone: e.target.value }))}
                        maxLength={100}
                        required
                        placeholder="(0717) 910-1234 / 910-1235"
                        className="w-full pl-9 pr-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-amber-500/40"
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Ditampilkan di footer & halaman kontak</span>
                      <span>{contactForm.phone.length}/100</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-300">
                      Alamat Email Resmi <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                      <input
                        type="email"
                        value={contactForm.email}
                        onChange={(e) => setContactForm((prev) => ({ ...prev, email: e.target.value }))}
                        maxLength={100}
                        required
                        placeholder="sekretariat@inkindo-babel.org"
                        className="w-full pl-9 pr-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-amber-500/40"
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Format email resmi yang valid</span>
                      <span>{contactForm.email.length}/100</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-300">
                      Nomor Fax Sekretariat (Opsional)
                    </label>
                    <div className="relative">
                      <Printer className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                      <input
                        type="text"
                        value={contactForm.fax}
                        onChange={(e) => setContactForm((prev) => ({ ...prev, fax: e.target.value }))}
                        maxLength={100}
                        placeholder="(0717) 910-1236"
                        className="w-full pl-9 pr-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-amber-500/40"
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Nomor faksimile kantor</span>
                      <span>{contactForm.fax.length}/100</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-300">
                      Jam Operasional Kantor <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <Clock className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                      <input
                        type="text"
                        value={contactForm.workingHours}
                        onChange={(e) => setContactForm((prev) => ({ ...prev, workingHours: e.target.value }))}
                        maxLength={100}
                        required
                        placeholder="Senin - Jumat: 08.30 - 16.30 WIB"
                        className="w-full pl-9 pr-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-amber-500/40"
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Jadwal pelayanan sekretariat</span>
                      <span>{contactForm.workingHours.length}/100</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Alamat Lengkap Kantor Sekretariat <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={contactForm.address}
                    onChange={(e) => setContactForm((prev) => ({ ...prev, address: e.target.value }))}
                    maxLength={300}
                    required
                    placeholder="Jl. Jenderal Sudirman No. 45, Gabek, Pangkalpinang, Kepulauan Bangka Belitung 33114"
                    className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-amber-500/40"
                  />
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Alamat fisik sekretariat DPP</span>
                    <span>{contactForm.address.length}/300</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold text-slate-900 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 transition-colors shadow-xs"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>Simpan Informasi Kontak</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {activeTab === "topbar" && (
          <div className="space-y-6">
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 sm:p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <LayoutDashboard className="w-4 h-4 text-amber-500" />
                    <span>Pengaturan Topbar Website</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Informasi kontak ringkas dan status jam kerja yang ditampilkan di pita atas (topbar)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setConfirmRestore("topbar")}
                  disabled={isSaving || isRestoring}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700/80 transition-colors self-start sm:self-auto"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
                  <span>Pulihkan Bawaan</span>
                </button>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-800/50 border border-slate-700 text-xs text-slate-300 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span>
                  Topbar ditampilkan di perangkat desktop pada bagian paling atas website, dan otomatis tersembunyi
                  saat pengunjung melakukan scroll ke bawah.
                </span>
              </div>

              <form onSubmit={handleSaveTopbar} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-300">
                      Nomor Telepon Topbar <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                      <input
                        type="text"
                        value={topbarForm.phone}
                        onChange={(e) => setTopbarForm((prev) => ({ ...prev, phone: e.target.value }))}
                        maxLength={100}
                        required
                        placeholder="(0717) 910-1234"
                        className="w-full pl-9 pr-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-amber-500/40"
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Nomor ringkas di topbar</span>
                      <span>{topbarForm.phone.length}/100</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-300">
                      Alamat Email Topbar <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                      <input
                        type="email"
                        value={topbarForm.email}
                        onChange={(e) => setTopbarForm((prev) => ({ ...prev, email: e.target.value }))}
                        maxLength={100}
                        required
                        placeholder="sekretariat@inkindo-babel.org"
                        className="w-full pl-9 pr-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-amber-500/40"
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Email ringkas di topbar</span>
                      <span>{topbarForm.email.length}/100</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-300">
                      Lokasi / Wilayah Topbar <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                      <input
                        type="text"
                        value={topbarForm.location}
                        onChange={(e) => setTopbarForm((prev) => ({ ...prev, location: e.target.value }))}
                        maxLength={100}
                        required
                        placeholder="Pangkalpinang"
                        className="w-full pl-9 pr-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-amber-500/40"
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Teks lokasi kantor di topbar</span>
                      <span>{topbarForm.location.length}/100</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-300">
                      Jam Kerja Topbar <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <Clock className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                      <input
                        type="text"
                        value={topbarForm.workingHours}
                        onChange={(e) => setTopbarForm((prev) => ({ ...prev, workingHours: e.target.value }))}
                        maxLength={100}
                        required
                        placeholder="Senin - Jumat: 08.30 - 16.30 WIB"
                        className="w-full pl-9 pr-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-amber-500/40"
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Teks jam layanan di sisi kanan topbar</span>
                      <span>{topbarForm.workingHours.length}/100</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold text-slate-900 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 transition-colors shadow-xs"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>Simpan Pengaturan Topbar</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {activeTab === "footer" && (
          <div className="space-y-6">
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 sm:p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-amber-500" />
                    <span>Pengaturan Footer Website</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Konten narasi organisasi, legalitas resmi, dan hak cipta di bagian bawah halaman
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setConfirmRestore("footer")}
                  disabled={isSaving || isRestoring}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700/80 transition-colors self-start sm:self-auto"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
                  <span>Pulihkan Bawaan</span>
                </button>
              </div>

              <form onSubmit={handleSaveFooter} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Deskripsi Ringkas Footer <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={footerForm.description}
                    onChange={(e) => setFooterForm((prev) => ({ ...prev, description: e.target.value }))}
                    maxLength={500}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-amber-500/40"
                  />
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Ditampilkan di bawah logo footer</span>
                    <span>{footerForm.description.length}/500</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Alamat Lengkap Kantor di Footer <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    rows={2}
                    value={footerForm.address}
                    onChange={(e) => setFooterForm((prev) => ({ ...prev, address: e.target.value }))}
                    maxLength={300}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-amber-500/40"
                  />
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Alamat fisik pada kolom Sekretariat DPP di footer</span>
                    <span>{footerForm.address.length}/300</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Informasi Legalitas Organisasi <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Shield className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                    <input
                      type="text"
                      value={footerForm.legal}
                      onChange={(e) => setFooterForm((prev) => ({ ...prev, legal: e.target.value }))}
                      maxLength={300}
                      required
                      className="w-full pl-9 pr-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-amber-500/40"
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Teks akreditasi Kemenkumham & LPJK di kartu legalitas footer</span>
                    <span>{footerForm.legal.length}/300</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Teks Hak Cipta (Copyright) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={footerForm.copyright}
                    onChange={(e) => setFooterForm((prev) => ({ ...prev, copyright: e.target.value }))}
                    maxLength={200}
                    required
                    placeholder="© {year} DPP INKINDO BABEL. Seluruh Hak Cipta Dilindungi Undang-Undang."
                    className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-amber-500/40"
                  />
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Gunakan &#123;year&#125; untuk tahun otomatis dinamis</span>
                    <span>{footerForm.copyright.length}/200</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold text-slate-900 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 transition-colors shadow-xs"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>Simpan Pengaturan Footer</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {activeTab === "social" && (
          <div className="space-y-6">
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 sm:p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-amber-500" />
                    <span>Tautan Media Sosial Resmi</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Tautan akun media sosial organisasi yang ditampilkan pada footer publik
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setConfirmRestore("social")}
                  disabled={isSaving || isRestoring}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700/80 transition-colors self-start sm:self-auto"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
                  <span>Pulihkan Bawaan</span>
                </button>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-800/50 border border-slate-700 text-xs text-slate-300 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span>
                  Masukkan nama akun dan tautan URL resmi organisasi untuk setiap platform. Ikon media sosial di footer publik
                  akan menampilkan nama akun dan menuju ke URL yang sama. Kosongkan field jika akun belum tersedia.
                </span>
              </div>

              <form onSubmit={handleSaveSocial} className="space-y-6">
                <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/80 space-y-3">
                  <div className="flex items-center gap-2 text-white font-semibold text-xs border-b border-slate-700/60 pb-2">
                    <InstagramIcon className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>Instagram</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-300">
                        Nama Akun {socialForm.instagram.trim() && <span className="text-rose-400">*</span>}
                      </label>
                      <input
                        type="text"
                        value={socialForm.instagramLabel}
                        onChange={(e) => setSocialForm((prev) => ({ ...prev, instagramLabel: e.target.value }))}
                        maxLength={60}
                        required={Boolean(socialForm.instagram.trim())}
                        placeholder="@akuninkindo"
                        className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-amber-500/40"
                      />
                      <div className="flex justify-between text-[11px] text-slate-400">
                        <span>Contoh: @akuninkindo</span>
                        <span>{socialForm.instagramLabel.length}/60</span>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-300">
                        URL Akun
                      </label>
                      <div className="relative">
                        <Globe className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                        <input
                          type="url"
                          value={socialForm.instagram}
                          onChange={(e) => setSocialForm((prev) => ({ ...prev, instagram: e.target.value }))}
                          maxLength={255}
                          placeholder="https://instagram.com/akuninkindo"
                          className="w-full pl-9 pr-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-amber-500/40"
                        />
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-400">
                        <span>Contoh: https://instagram.com/akuninkindo</span>
                        <span>{socialForm.instagram.length}/255</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/80 space-y-3">
                  <div className="flex items-center gap-2 text-white font-semibold text-xs border-b border-slate-700/60 pb-2">
                    <FacebookIcon className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>Facebook</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-300">
                        Nama Akun {socialForm.facebook.trim() && <span className="text-rose-400">*</span>}
                      </label>
                      <input
                        type="text"
                        value={socialForm.facebookLabel}
                        onChange={(e) => setSocialForm((prev) => ({ ...prev, facebookLabel: e.target.value }))}
                        maxLength={60}
                        required={Boolean(socialForm.facebook.trim())}
                        placeholder="INKINDO BABEL"
                        className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-amber-500/40"
                      />
                      <div className="flex justify-between text-[11px] text-slate-400">
                        <span>Contoh: INKINDO BABEL</span>
                        <span>{socialForm.facebookLabel.length}/60</span>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-300">
                        URL Akun
                      </label>
                      <div className="relative">
                        <Globe className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                        <input
                          type="url"
                          value={socialForm.facebook}
                          onChange={(e) => setSocialForm((prev) => ({ ...prev, facebook: e.target.value }))}
                          maxLength={255}
                          placeholder="https://facebook.com/inkindobabel"
                          className="w-full pl-9 pr-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-amber-500/40"
                        />
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-400">
                        <span>Contoh: https://facebook.com/inkindobabel</span>
                        <span>{socialForm.facebook.length}/255</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/80 space-y-3">
                  <div className="flex items-center gap-2 text-white font-semibold text-xs border-b border-slate-700/60 pb-2">
                    <YouTubeIcon className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>YouTube</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-300">
                        Nama Akun {socialForm.youtube.trim() && <span className="text-rose-400">*</span>}
                      </label>
                      <input
                        type="text"
                        value={socialForm.youtubeLabel}
                        onChange={(e) => setSocialForm((prev) => ({ ...prev, youtubeLabel: e.target.value }))}
                        maxLength={60}
                        required={Boolean(socialForm.youtube.trim())}
                        placeholder="INKINDO BABEL"
                        className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-amber-500/40"
                      />
                      <div className="flex justify-between text-[11px] text-slate-400">
                        <span>Contoh: INKINDO BABEL</span>
                        <span>{socialForm.youtubeLabel.length}/60</span>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-300">
                        URL Akun
                      </label>
                      <div className="relative">
                        <Globe className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                        <input
                          type="url"
                          value={socialForm.youtube}
                          onChange={(e) => setSocialForm((prev) => ({ ...prev, youtube: e.target.value }))}
                          maxLength={255}
                          placeholder="https://youtube.com/@inkindobabel"
                          className="w-full pl-9 pr-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-amber-500/40"
                        />
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-400">
                        <span>Contoh: https://youtube.com/@inkindobabel</span>
                        <span>{socialForm.youtube.length}/255</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/80 space-y-3">
                  <div className="flex items-center gap-2 text-white font-semibold text-xs border-b border-slate-700/60 pb-2">
                    <LinkedInIcon className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>LinkedIn</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-300">
                        Nama Akun {socialForm.linkedin.trim() && <span className="text-rose-400">*</span>}
                      </label>
                      <input
                        type="text"
                        value={socialForm.linkedinLabel}
                        onChange={(e) => setSocialForm((prev) => ({ ...prev, linkedinLabel: e.target.value }))}
                        maxLength={60}
                        required={Boolean(socialForm.linkedin.trim())}
                        placeholder="INKINDO BABEL"
                        className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-amber-500/40"
                      />
                      <div className="flex justify-between text-[11px] text-slate-400">
                        <span>Contoh: INKINDO BABEL</span>
                        <span>{socialForm.linkedinLabel.length}/60</span>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-300">
                        URL Akun
                      </label>
                      <div className="relative">
                        <Globe className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                        <input
                          type="url"
                          value={socialForm.linkedin}
                          onChange={(e) => setSocialForm((prev) => ({ ...prev, linkedin: e.target.value }))}
                          maxLength={255}
                          placeholder="https://linkedin.com/company/inkindobabel"
                          className="w-full pl-9 pr-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-amber-500/40"
                        />
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-400">
                        <span>Contoh: https://linkedin.com/company/inkindobabel</span>
                        <span>{socialForm.linkedin.length}/255</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold text-slate-900 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 transition-colors shadow-xs"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>Simpan Pengaturan Media Sosial</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {confirmRestore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
              <RotateCcw className="w-6 h-6" />
            </div>

            <div>
              <h4 className="text-base font-bold text-white">
                Konfirmasi Pemulihan Nilai Bawaan
              </h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Apakah Anda yakin ingin mengembalikan pengaturan pada bagian ini ke nilai standar bawaan sistem?
                Pengaturan yang saat ini tersimpan di database akan dihapus.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setConfirmRestore(null)}
                disabled={isRestoring}
                className="px-4 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteRestore}
                disabled={isRestoring}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 disabled:opacity-50 transition-colors"
              >
                {isRestoring && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Ya, Pulihkan Bawaan</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminDashboardShell>
  );
}
