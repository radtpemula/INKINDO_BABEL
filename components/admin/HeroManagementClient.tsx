"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Plus,
  ArrowUp,
  ArrowDown,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  SlidersHorizontal,
  Loader2,
  X,
  Eye,
  EyeOff,
  ImageIcon,
  Upload,
  RotateCcw,
  Save,
  ExternalLink,
  Layers,
  FileText,
  Compass,
  ShieldCheck,
  Award,
  HardHat,
  FileCheck2,
} from "lucide-react";
import { AdminDashboardShell } from "./AdminDashboardShell";
import type { AdminProfile } from "./types";
import type { HeroSlideItem } from "@/lib/admin/hero-actions";
import {
  getHeroSlidesAction,
  createHeroSlideAction,
  updateHeroSlideAction,
  toggleHeroSlideActiveAction,
  moveHeroSlideOrderAction,
  deleteHeroSlideAction,
} from "@/lib/admin/hero-actions";
import {
  DEFAULT_HERO_SETTINGS,
  type PublicHeroSettings,
  type HeroCardSettings,
} from "@/lib/public/hero";
import {
  updateHeroCardImageAction,
  restoreHeroCardImageDefaultAction,
  updateHeroContentAction,
  restoreHeroContentDefaultAction,
  updateHeroCardsAction,
  restoreHeroCardsDefaultAction,
} from "@/lib/admin/hero-settings-actions";

interface HeroManagementClientProps {
  profile: AdminProfile;
  initialSlides: HeroSlideItem[];
  initialSettings?: PublicHeroSettings;
}

export function HeroManagementClient({
  profile,
  initialSlides,
  initialSettings,
}: HeroManagementClientProps): React.JSX.Element {
  const safeSettings = initialSettings ?? DEFAULT_HERO_SETTINGS;

  // Active Tab: slideshow (Background & Slideshow), content (Konten Utama), cards (Konten Kartu)
  const [activeTab, setActiveTab] = useState<"slideshow" | "content" | "cards">("slideshow");

  // Notifications state
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification((prev) => (prev?.message === message ? null : prev));
    }, 6000);
  };

  // ----------------------------------------------------
  // SECTION A: SLIDESHOW STATE & HANDLERS
  // ----------------------------------------------------
  const [slides, setSlides] = useState<HeroSlideItem[]>(initialSlides);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingSlide, setEditingSlide] = useState<HeroSlideItem | null>(null);

  const [formImageAlt, setFormImageAlt] = useState("");
  const [currentImagePath, setCurrentImagePath] = useState("");
  const [selectedSlideFile, setSelectedSlideFile] = useState<File | null>(null);
  const [previewSlideUrl, setPreviewSlideUrl] = useState<string | null>(null);

  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<HeroSlideItem | null>(null);
  const [isUploadingSlide, setIsUploadingSlide] = useState(false);
  const [isSubmittingSlide, setIsSubmittingSlide] = useState(false);

  const slideFileInputRef = useRef<HTMLInputElement | null>(null);

  const handleOpenCreateModal = () => {
    setModalMode("create");
    setEditingSlide(null);
    setFormImageAlt("");
    setCurrentImagePath("");
    setSelectedSlideFile(null);
    setPreviewSlideUrl(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (slide: HeroSlideItem) => {
    setModalMode("edit");
    setEditingSlide(slide);
    setFormImageAlt(slide.imageAlt);
    setCurrentImagePath(slide.imagePath);
    setSelectedSlideFile(null);
    setPreviewSlideUrl(null);
    setIsModalOpen(true);
  };

  const handleSlideFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showNotification("error", "Ukuran berkas melebihi batas maksimum 5 MB.");
      return;
    }

    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      showNotification("error", "Format berkas harus JPEG, PNG, atau WebP.");
      return;
    }

    setSelectedSlideFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewSlideUrl(objectUrl);
  };

  const handleSubmitSlideForm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (modalMode === "create" && !selectedSlideFile) {
      showNotification("error", "Pilih berkas gambar terlebih dahulu dari komputer.");
      return;
    }

    if (modalMode === "edit" && !selectedSlideFile && !currentImagePath) {
      showNotification("error", "Berkas gambar belum dipilih.");
      return;
    }

    setIsSubmittingSlide(true);
    let uploadedPath = currentImagePath;

    if (selectedSlideFile) {
      setIsUploadingSlide(true);
      try {
        const formData = new FormData();
        formData.append("file", selectedSlideFile);

        const uploadRes = await fetch("/api/admin/hero-upload", {
          method: "POST",
          body: formData,
        });

        const uploadJson = await uploadRes.json();
        if (!uploadRes.ok || !uploadJson.success) {
          showNotification(
            "error",
            uploadJson.error || "Gagal mengunggah berkas gambar ke server."
          );
          setIsSubmittingSlide(false);
          setIsUploadingSlide(false);
          return;
        }

        uploadedPath = uploadJson.data.publicPath;
      } catch {
        showNotification("error", "Terjadi kegagalan jaringan saat mengunggah gambar.");
        setIsSubmittingSlide(false);
        setIsUploadingSlide(false);
        return;
      } finally {
        setIsUploadingSlide(false);
      }
    }

    const finalAlt = formImageAlt.trim() || "Dokumentasi Hero INKINDO BABEL";

    try {
      if (modalMode === "create") {
        const res = await createHeroSlideAction({
          imagePath: uploadedPath,
          imageAlt: finalAlt,
          isActive: true,
          order: slides.length,
        });

        if (res.success && res.data) {
          setSlides((prev) => [...prev, res.data!].sort((a, b) => a.order - b.order));
          setIsModalOpen(false);
          showNotification("success", "Slide baru berhasil disimpan dan ditambahkan ke slideshow.");
        } else {
          showNotification("error", res.error || "Gagal menyimpan slide baru.");
        }
      } else if (modalMode === "edit" && editingSlide) {
        const res = await updateHeroSlideAction({
          id: editingSlide.id,
          imagePath: uploadedPath,
          imageAlt: finalAlt,
        });

        if (res.success && res.data) {
          setSlides((prev) =>
            prev.map((s) => (s.id === editingSlide.id ? res.data! : s)).sort((a, b) => a.order - b.order)
          );
          setIsModalOpen(false);
          showNotification("success", "Gambar slide berhasil diperbarui.");
        } else {
          showNotification("error", res.error || "Gagal memperbarui slide.");
        }
      }
    } catch {
      showNotification("error", "Terjadi kesalahan tidak terduga saat menyimpan slide.");
    } finally {
      setIsSubmittingSlide(false);
    }
  };

  const handleToggleActive = async (slide: HeroSlideItem) => {
    try {
      const res = await toggleHeroSlideActiveAction(slide.id);
      if (res.success && res.data) {
        setSlides((prev) =>
          prev.map((s) => (s.id === slide.id ? { ...s, isActive: res.data!.isActive } : s))
        );
        showNotification(
          "success",
          res.data.isActive ? "Slide diaktifkan untuk slideshow." : "Slide dinonaktifkan."
        );
      } else {
        showNotification("error", res.error || "Gagal mengubah status slide.");
      }
    } catch {
      showNotification("error", "Gagal memperbarui status aktif slide.");
    }
  };

  const handleMoveOrder = async (slideId: string, direction: "up" | "down") => {
    try {
      const res = await moveHeroSlideOrderAction(slideId, direction);
      if (res.success) {
        const refreshed = await getHeroSlidesAction();
        if (refreshed.success && refreshed.data) {
          setSlides(refreshed.data);
        }
        showNotification("success", "Urutan slide berhasil diperbarui.");
      } else {
        showNotification("error", res.error || "Gagal mengubah urutan slide.");
      }
    } catch {
      showNotification("error", "Gagal mengubah urutan slide.");
    }
  };

  const handleDeleteSlide = async () => {
    if (!deleteConfirmTarget) return;

    try {
      const res = await deleteHeroSlideAction(deleteConfirmTarget.id);
      if (res.success) {
        setSlides((prev) => prev.filter((s) => s.id !== deleteConfirmTarget.id));
        setDeleteConfirmTarget(null);
        showNotification("success", "Slide berhasil dihapus dari sistem.");
      } else {
        showNotification("error", res.error || "Gagal menghapus slide.");
      }
    } catch {
      showNotification("error", "Terjadi kesalahan saat menghapus slide.");
    }
  };

  const [cardImage, setCardImage] = useState<string>(
    safeSettings.cards.cardImagePath || ""
  );
  const [selectedCardFile, setSelectedCardFile] = useState<File | null>(null);
  const [previewCardUrl, setPreviewCardUrl] = useState<string | null>(null);
  const [isUploadingCard, setIsUploadingCard] = useState(false);
  const [isRestoringCard, setIsRestoringCard] = useState(false);
  const cardFileInputRef = useRef<HTMLInputElement | null>(null);

  const handleCardFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showNotification("error", "Ukuran berkas melebihi batas maksimum 5 MB.");
      return;
    }

    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      showNotification("error", "Format berkas harus JPEG, PNG, atau WebP.");
      return;
    }

    setSelectedCardFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewCardUrl(objectUrl);
  };

  const handleSaveCardImage = async () => {
    if (!selectedCardFile) {
      showNotification("error", "Pilih berkas gambar kartu terlebih dahulu untuk disimpan.");
      return;
    }

    setIsUploadingCard(true);

    try {
      const formData = new FormData();
      formData.append("file", selectedCardFile);

      const uploadRes = await fetch("/api/admin/hero-upload", {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadRes.json();
      if (!uploadRes.ok || !uploadData.success) {
        throw new Error(uploadData.error || "Gagal mengunggah berkas gambar.");
      }

      const uploadedPath: string = uploadData.data.publicPath;

      const actionRes = await updateHeroCardImageAction({
        cardImagePath: uploadedPath,
      });

      if (!actionRes.success) {
        throw new Error(actionRes.error || "Gagal menyimpan gambar kartu.");
      }

      setCardImage(uploadedPath);
      setSelectedCardFile(null);
      if (previewCardUrl) {
        URL.revokeObjectURL(previewCardUrl);
        setPreviewCardUrl(null);
      }
      if (cardFileInputRef.current) {
        cardFileInputRef.current.value = "";
      }

      showNotification("success", actionRes.message || "Gambar kartu Hero berhasil diperbarui.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat menyimpan gambar kartu.";
      showNotification("error", msg);
    } finally {
      setIsUploadingCard(false);
    }
  };

  const handleRestoreCardImage = async () => {
    if (!confirm("Kembalikan ilustrasi kartu Hero ke tampilan bawaan (vektor skematik teknik CAD)?")) {
      return;
    }

    setIsRestoringCard(true);

    try {
      const res = await restoreHeroCardImageDefaultAction();
      if (!res.success) {
        throw new Error(res.error || "Gagal memulihkan ilustrasi kartu.");
      }

      setCardImage("");
      setSelectedCardFile(null);
      if (previewCardUrl) {
        URL.revokeObjectURL(previewCardUrl);
        setPreviewCardUrl(null);
      }
      if (cardFileInputRef.current) {
        cardFileInputRef.current.value = "";
      }

      showNotification("success", res.message || "Ilustrasi kartu bawaan berhasil dipulihkan.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat memulihkan ilustrasi kartu.";
      showNotification("error", msg);
    } finally {
      setIsRestoringCard(false);
    }
  };

  // ----------------------------------------------------
  // SECTION B: MAIN CONTENT STATE & HANDLERS
  // ----------------------------------------------------
  const [content, setContent] = useState(safeSettings.content);
  const [isSavingContent, setIsSavingContent] = useState(false);
  const [isRestoringContent, setIsRestoringContent] = useState(false);

  const handleSaveContent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingContent(true);

    try {
      const res = await updateHeroContentAction(content);
      if (!res.success) {
        throw new Error(res.error || "Gagal memperbarui konten Hero.");
      }

      if (res.data) {
        setContent(res.data);
      }

      showNotification("success", res.message || "Konten teks Hero berhasil disimpan.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat menyimpan konten.";
      showNotification("error", msg);
    } finally {
      setIsSavingContent(false);
    }
  };

  const handleRestoreContent = async () => {
    if (!confirm("Pulihkan seluruh teks Hero ke konfigurasi teks bawaan?")) {
      return;
    }

    setIsRestoringContent(true);

    try {
      const res = await restoreHeroContentDefaultAction();
      if (!res.success) {
        throw new Error(res.error || "Gagal memulihkan konten teks.");
      }

      setContent(DEFAULT_HERO_SETTINGS.content);
      showNotification("success", res.message || "Konten teks Hero berhasil dipulihkan.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat memulihkan konten.";
      showNotification("error", msg);
    } finally {
      setIsRestoringContent(false);
    }
  };

  // ----------------------------------------------------
  // SECTION C: HERO CARDS STATE & HANDLERS
  // ----------------------------------------------------
  const [cards, setCards] = useState<HeroCardSettings>(
    safeSettings.cards ?? DEFAULT_HERO_SETTINGS.cards
  );
  const [isSavingCards, setIsSavingCards] = useState(false);
  const [isRestoringCards, setIsRestoringCards] = useState(false);

  const handleSaveCards = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingCards(true);

    try {
      const res = await updateHeroCardsAction(cards);
      if (!res.success) {
        throw new Error(res.error || "Gagal memperbarui konten kartu.");
      }

      if (res.data) {
        setCards(res.data);
      }

      showNotification("success", res.message || "Konten kartu Hero berhasil disimpan.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat menyimpan konten kartu.";
      showNotification("error", msg);
    } finally {
      setIsSavingCards(false);
    }
  };

  const handleRestoreCards = async () => {
    if (!confirm("Pulihkan seluruh teks kartu Hero ke konfigurasi teks bawaan?")) {
      return;
    }

    setIsRestoringCards(true);

    try {
      const res = await restoreHeroCardsDefaultAction();
      if (!res.success) {
        throw new Error(res.error || "Gagal memulihkan konten kartu.");
      }

      setCards(DEFAULT_HERO_SETTINGS.cards);
      showNotification("success", res.message || "Konten kartu Hero berhasil dipulihkan.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat memulihkan konten kartu.";
      showNotification("error", msg);
    } finally {
      setIsRestoringCards(false);
    }
  };

  return (
    <AdminDashboardShell
      profile={profile}
      activeItemId="hero"
      pageTitle="Pengelolaan Hero"
      pageSubtitle="Kelola slideshow latar belakang, background fallback, dan seluruh teks Hero dalam satu tempat"
      headerActions={
        <div className="flex items-center gap-2">
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700 transition-colors"
          >
            <span>Lihat Website</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      }
    >
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Global Notification Banner */}
        {notification && (
          <div
            role="status"
            className={`p-4 rounded-xl border flex items-start gap-3 transition-all duration-200 ${
              notification.type === "success"
                ? "bg-emerald-950/40 border-emerald-800/60 text-emerald-200"
                : "bg-rose-950/40 border-rose-800/60 text-rose-200"
            }`}
          >
            {notification.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 text-xs sm:text-sm font-medium leading-relaxed">
              {notification.message}
            </div>
            <button
              type="button"
              onClick={() => setNotification(null)}
              className="p-1 rounded text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Unified Tab Switcher */}
        <div className="flex flex-wrap items-center gap-2 p-1.5 bg-[#0F172A] border border-slate-800 rounded-xl shadow-xs">
          <button
            type="button"
            onClick={() => setActiveTab("slideshow")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "slideshow"
                ? "bg-[#1E293B] text-amber-400 shadow-xs border border-slate-700 font-bold"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4 shrink-0" />
            <span>Background &amp; Slideshow</span>
            <span className="ml-1 px-1.5 py-0.5 text-[10px] rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              {slides.length} Slide
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("content")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "content"
                ? "bg-[#1E293B] text-amber-400 shadow-xs border border-slate-700 font-bold"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent"
            }`}
          >
            <FileText className="w-4 h-4 shrink-0" />
            <span>Konten Hero Utama</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("cards")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "cards"
                ? "bg-[#1E293B] text-amber-400 shadow-xs border border-slate-700 font-bold"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent"
            }`}
          >
            <Compass className="w-4 h-4 shrink-0" />
            <span>Konten Kartu Hero</span>
          </button>
        </div>

        {/* ==================================================== */}
        {/* TAB 1: BACKGROUND & SLIDESHOW                        */}
        {/* ==================================================== */}
        {activeTab === "slideshow" && (
          <div className="space-y-8">
            {/* SUB-SECTION 1: HERO SLIDESHOW */}
            <div className="bg-[#1E293B] border border-slate-700 rounded-xl p-5 sm:p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-700/80 mb-6">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    <SlidersHorizontal className="w-5 h-5 text-amber-400" />
                    <span>Slideshow Background Utama</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
                    Gambar aktif akan berganti otomatis setiap 5 detik sebagai latar belakang (background) besar halaman beranda.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleOpenCreateModal}
                  className="inline-flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-500 text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-lg transition-all shadow-xs shrink-0 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Slide Baru</span>
                </button>
              </div>

              {/* Grid Daftar Slide */}
              {slides.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-slate-700 rounded-xl bg-slate-900/40">
                  <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-200">Belum Ada Slide Gambar</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                    Hero saat ini menggunakan background fallback atau ilustrasi CAD blueprint bawaan. Klik tombol di atas untuk menambahkan slide pertama.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {slides.map((slide, index) => (
                    <div
                      key={slide.id}
                      className="bg-[#0F172A] border border-slate-800 hover:border-slate-700 rounded-xl overflow-hidden transition-all flex flex-col group shadow-xs"
                    >
                      {/* Image Thumbnail Preview */}
                      <div className="relative aspect-video w-full bg-slate-950 overflow-hidden">
                        <Image
                          src={slide.imagePath}
                          alt={slide.imageAlt || "Preview Slide"}
                          fill
                          className="object-cover group-hover:scale-102 transition-transform duration-300"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />

                        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-900/90 text-amber-400 border border-slate-700">
                            Urutan #{slide.order + 1}
                          </span>
                        </div>

                        <div className="absolute top-2.5 right-2.5">
                          <button
                            type="button"
                            onClick={() => handleToggleActive(slide)}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer border ${
                              slide.isActive
                                ? "bg-emerald-950/90 text-emerald-300 border-emerald-700 hover:bg-emerald-900"
                                : "bg-slate-900/90 text-slate-400 border-slate-700 hover:bg-slate-800"
                            }`}
                          >
                            {slide.isActive ? (
                              <>
                                <Eye className="w-3 h-3 text-emerald-400" />
                                <span>Aktif</span>
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-3 h-3 text-slate-400" />
                                <span>Nonaktif</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Card Content & Action Controls */}
                      <div className="p-3.5 flex flex-col flex-1 justify-between gap-3">
                        <div>
                          <p className="text-xs text-slate-300 truncate font-medium" title={slide.imageAlt}>
                            {slide.imageAlt || "Dokumentasi Hero INKINDO BABEL"}
                          </p>
                          <p className="text-[10px] font-mono text-slate-400 truncate mt-0.5">
                            {slide.imagePath}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                          {/* Reorder Buttons */}
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              disabled={index === 0}
                              onClick={() => handleMoveOrder(slide.id, "up")}
                              aria-label="Pindah slide ke atas"
                              title="Pindah ke atas"
                              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={index === slides.length - 1}
                              onClick={() => handleMoveOrder(slide.id, "down")}
                              aria-label="Pindah slide ke bawah"
                              title="Pindah ke bawah"
                              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Edit & Delete Buttons */}
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(slide)}
                              aria-label="Ganti gambar slide"
                              title="Ganti gambar"
                              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmTarget(slide)}
                              aria-label="Hapus slide"
                              title="Hapus slide"
                              className="p-1.5 rounded bg-slate-800 hover:bg-rose-950/70 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 2: KONTEN HERO UTAMA                            */}
        {/* ==================================================== */}
        {activeTab === "content" && (
          <form
            onSubmit={handleSaveContent}
            className="bg-[#1E293B] border border-slate-700 rounded-xl p-5 sm:p-6 shadow-sm space-y-6"
          >
            <div className="border-b border-slate-700/80 pb-4">
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-400" />
                <span>Pengaturan Konten Teks Hero Utama</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 leading-relaxed">
                Kelola label atas, judul utama, bagian aksen amber, deskripsi, tautan tombol aksi, dan trust marker.
              </p>
            </div>

            {/* Bagian Identitas & Judul */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 border-b border-slate-800 pb-1.5">
                1. Label &amp; Judul Utama
              </h3>

              <div>
                <label htmlFor="hero-badge" className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Label Atas (Badge)
                </label>
                <input
                  id="hero-badge"
                  type="text"
                  value={content.badge}
                  onChange={(e) => setContent({ ...content, badge: e.target.value })}
                  placeholder="Contoh: Ikatan Nasional Konsultan Indonesia"
                  className="w-full bg-[#0F172A] border border-slate-700 focus:border-amber-500 rounded-lg px-3.5 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="hero-title-prefix" className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Judul Utama (Prefix Putih)
                  </label>
                  <input
                    id="hero-title-prefix"
                    type="text"
                    value={content.titlePrefix}
                    onChange={(e) => setContent({ ...content, titlePrefix: e.target.value })}
                    placeholder="Contoh: DPP INKINDO"
                    className="w-full bg-[#0F172A] border border-slate-700 focus:border-amber-500 rounded-lg px-3.5 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label htmlFor="hero-title-accent" className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Bagian Aksen (Warna Amber)
                  </label>
                  <input
                    id="hero-title-accent"
                    type="text"
                    value={content.titleAccent}
                    onChange={(e) => setContent({ ...content, titleAccent: e.target.value })}
                    placeholder="Contoh: BABEL"
                    className="w-full bg-[#0F172A] border border-slate-700 focus:border-amber-500 rounded-lg px-3.5 py-2 text-xs sm:text-sm text-amber-400 font-bold placeholder-slate-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="p-3 bg-[#0F172A] border border-slate-800 rounded-lg text-xs text-slate-300">
                <span className="text-slate-400 block text-[11px] mb-1">Pratinjau Gabungan Judul:</span>
                <span className="font-extrabold text-white text-base">
                  {content.titlePrefix}{" "}
                  <span className="text-amber-500">{content.titleAccent}</span>
                </span>
              </div>
            </div>

            {/* Bagian Narasi & Deskripsi */}
            <div className="space-y-4 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 border-b border-slate-800 pb-1.5">
                2. Narasi &amp; Deskripsi
              </h3>

              <div>
                <label htmlFor="hero-description" className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Deskripsi Lengkap Hero
                </label>
                <textarea
                  id="hero-description"
                  rows={3}
                  value={content.description}
                  onChange={(e) => setContent({ ...content, description: e.target.value })}
                  placeholder="Deskripsi singkat mengenai peran dan komitmen organisasi..."
                  className="w-full bg-[#0F172A] border border-slate-700 focus:border-amber-500 rounded-lg p-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Bagian Tombol Aksi (CTA) */}
            <div className="space-y-4 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 border-b border-slate-800 pb-1.5">
                3. Tombol Aksi (Call To Action)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-[#0F172A] border border-slate-800 rounded-xl space-y-3">
                  <span className="text-xs font-bold text-amber-400 block">
                    Tombol Utama (Solid Amber)
                  </span>
                  <div>
                    <label htmlFor="cta-primary-text" className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Label Tombol
                    </label>
                    <input
                      id="cta-primary-text"
                      type="text"
                      value={content.primaryCtaText}
                      onChange={(e) => setContent({ ...content, primaryCtaText: e.target.value })}
                      placeholder="Daftar Anggota Baru"
                      className="w-full bg-[#1E293B] border border-slate-700 focus:border-amber-500 rounded-lg px-3 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label htmlFor="cta-primary-href" className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Tautan URL Tujuan
                    </label>
                    <input
                      id="cta-primary-href"
                      type="text"
                      value={content.primaryCtaHref}
                      onChange={(e) => setContent({ ...content, primaryCtaHref: e.target.value })}
                      placeholder="#membership-steps atau /anggota/pendaftaran"
                      className="w-full bg-[#1E293B] border border-slate-700 focus:border-amber-500 rounded-lg px-3 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="p-4 bg-[#0F172A] border border-slate-800 rounded-xl space-y-3">
                  <span className="text-xs font-bold text-slate-300 block">
                    Tombol Sekunder (Garis Tepi)
                  </span>
                  <div>
                    <label htmlFor="cta-sec-text" className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Label Tombol
                    </label>
                    <input
                      id="cta-sec-text"
                      type="text"
                      value={content.secondaryCtaText}
                      onChange={(e) => setContent({ ...content, secondaryCtaText: e.target.value })}
                      placeholder="Layanan SBU Online"
                      className="w-full bg-[#1E293B] border border-slate-700 focus:border-amber-500 rounded-lg px-3 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label htmlFor="cta-sec-href" className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Tautan URL Tujuan
                    </label>
                    <input
                      id="cta-sec-href"
                      type="text"
                      value={content.secondaryCtaHref}
                      onChange={(e) => setContent({ ...content, secondaryCtaHref: e.target.value })}
                      placeholder="#sbu-steps atau /layanan"
                      className="w-full bg-[#1E293B] border border-slate-700 focus:border-amber-500 rounded-lg px-3 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Bagian Pita Sub-Banner / Trust Marker */}
            <div className="space-y-4 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 border-b border-slate-800 pb-1.5">
                4. Pita Sub-Banner (Trust Marker)
              </h3>

              <div className="p-4 bg-[#0F172A] border border-slate-800 rounded-xl space-y-3">
                <div>
                  <label htmlFor="subbanner-text" className="block text-xs font-semibold text-slate-300 mb-1">
                    Teks Pernyataan Strategis
                  </label>
                  <input
                    id="subbanner-text"
                    type="text"
                    value={content.subBannerText}
                    onChange={(e) => setContent({ ...content, subBannerText: e.target.value })}
                    placeholder="Menjadi Mitra Strategis Pemerintah dan Masyarakat dalam Pembangunan"
                    className="w-full bg-[#1E293B] border border-slate-700 focus:border-amber-500 rounded-lg px-3 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label htmlFor="subbanner-cta-text" className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Label Tombol Sub-Banner
                    </label>
                    <input
                      id="subbanner-cta-text"
                      type="text"
                      value={content.subBannerCtaText}
                      onChange={(e) => setContent({ ...content, subBannerCtaText: e.target.value })}
                      placeholder="Daftar Sekarang"
                      className="w-full bg-[#1E293B] border border-slate-700 focus:border-amber-500 rounded-lg px-3 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label htmlFor="subbanner-cta-href" className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Tautan URL Sub-Banner
                    </label>
                    <input
                      id="subbanner-cta-href"
                      type="text"
                      value={content.subBannerCtaHref}
                      onChange={(e) => setContent({ ...content, subBannerCtaHref: e.target.value })}
                      placeholder="#membership-steps"
                      className="w-full bg-[#1E293B] border border-slate-700 focus:border-amber-500 rounded-lg px-3 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Tombol Aksi Simpan & Pulihkan */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-700/80">
              <button
                type="submit"
                disabled={isSavingContent}
                className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs sm:text-sm font-semibold px-5 py-2.5 rounded-lg transition-all shadow-xs cursor-pointer"
              >
                {isSavingContent ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menyimpan Konten...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Simpan Konten Hero Utama</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleRestoreContent}
                disabled={isRestoringContent}
                className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 hover:text-white text-xs sm:text-sm font-medium px-4 py-2.5 rounded-lg border border-slate-700 transition-colors cursor-pointer"
              >
                {isRestoringContent ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Memulihkan...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4" />
                    <span>Pulihkan Teks Bawaan</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* ==================================================== */}
        {/* TAB 3: KONTEN KARTU HERO                             */}
        {/* ==================================================== */}
        {activeTab === "cards" && (
          <div className="space-y-6">
            <div className="bg-[#1E293B] border border-slate-700 rounded-xl p-5 sm:p-6 shadow-sm space-y-5">
              <div className="border-b border-slate-700/80 pb-4">
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-amber-400" />
                  <span>Gambar Visual Kartu Kanan</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1 leading-relaxed">
                  Unggah gambar kustom untuk area ilustrasi kartu teknik di sebelah kanan. Jika tidak diunggah atau dipulihkan, sistem secara otomatis menampilkan ilustrasi SVG skematik blueprint bawaan.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-5 space-y-2">
                  <span className="block text-xs font-semibold text-slate-300">
                    Pratinjau Visual Kartu Saat Ini
                  </span>
                  <div className="relative w-full aspect-16/10 rounded-lg overflow-hidden border border-slate-700 bg-[#0F172A] flex items-center justify-center">
                    {previewCardUrl || cardImage ? (
                      <Image
                        src={previewCardUrl || cardImage}
                        alt="Pratinjau Gambar Kartu Hero"
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    ) : (
                      <div className="text-center p-4 space-y-2">
                        <Compass className="w-10 h-10 text-slate-600 mx-auto" />
                        <div className="text-xs text-slate-400 font-medium">
                          Ilustrasi Skematik CAD Bawaan Aktif
                        </div>
                        <div className="text-[11px] text-slate-500">
                          (Tidak ada gambar kustom yang diunggah)
                        </div>
                      </div>
                    )}
                  </div>
                  {(previewCardUrl || cardImage) && (
                    <div className="text-[11px] text-emerald-400 font-medium flex items-center gap-1.5 pt-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{previewCardUrl ? "Gambar baru siap disimpan" : "Gambar kustom aktif"}</span>
                    </div>
                  )}
                </div>

                <div className="lg:col-span-7 space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-300">
                      Pilih Berkas Gambar Baru
                    </label>
                    <input
                      type="file"
                      ref={cardFileInputRef}
                      onChange={handleCardFileSelect}
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                    />
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => cardFileInputRef.current?.click()}
                        className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs sm:text-sm font-medium px-4 py-2.5 rounded-lg border border-slate-700 transition-colors cursor-pointer"
                      >
                        <Upload className="w-4 h-4 text-amber-400" />
                        <span>Pilih Gambar dari Komputer</span>
                      </button>
                      {selectedCardFile && (
                        <span className="text-xs text-amber-400 font-medium truncate max-w-[200px] sm:max-w-[280px]">
                          {selectedCardFile.name}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
                      Format yang didukung: JPEG, PNG, WebP. Ukuran maksimal: 5 MB.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={handleSaveCardImage}
                      disabled={isUploadingCard || !selectedCardFile}
                      className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs sm:text-sm font-semibold px-4 py-2 rounded-lg transition-all shadow-xs cursor-pointer"
                    >
                      {isUploadingCard ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Menyimpan...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          <span>Simpan Gambar Kartu</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleRestoreCardImage}
                      disabled={isRestoringCard || (!cardImage && !previewCardUrl)}
                      className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 hover:text-white text-xs sm:text-sm font-medium px-4 py-2 rounded-lg border border-slate-700 transition-colors cursor-pointer"
                    >
                      {isRestoringCard ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Memulihkan...</span>
                        </>
                      ) : (
                        <>
                          <RotateCcw className="w-4 h-4" />
                          <span>Pulihkan Ilustrasi Bawaan</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <form
              onSubmit={handleSaveCards}
              className="bg-[#1E293B] border border-slate-700 rounded-xl p-5 sm:p-6 shadow-sm space-y-6"
            >
              <div className="border-b border-slate-700/80 pb-4">
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <Compass className="w-5 h-5 text-amber-400" />
                  <span>Pengaturan Konten Teks Kartu Hero</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1 leading-relaxed">
                  Ubah teks informasi kartu skematik sebelah kanan dan 3 highlight teknis di bawah tombol aksi.
                </p>
              </div>

            {/* Bagian 1: Tiga Highlight Teknis */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 border-b border-slate-800 pb-1.5 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                <span>1. Tiga Highlight Teknis (Bawah Tombol CTA)</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="card-hl-1" className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                    <span>Highlight 1</span>
                  </label>
                  <input
                    id="card-hl-1"
                    type="text"
                    value={cards.highlight1Text}
                    onChange={(e) => setCards({ ...cards, highlight1Text: e.target.value })}
                    placeholder="Asosiasi Resmi Terdaftar"
                    className="w-full bg-[#0F172A] border border-slate-700 focus:border-amber-500 rounded-lg px-3.5 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label htmlFor="card-hl-2" className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <FileCheck2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Highlight 2</span>
                  </label>
                  <input
                    id="card-hl-2"
                    type="text"
                    value={cards.highlight2Text}
                    onChange={(e) => setCards({ ...cards, highlight2Text: e.target.value })}
                    placeholder="Sertifikasi Standar LPJK"
                    className="w-full bg-[#0F172A] border border-slate-700 focus:border-amber-500 rounded-lg px-3.5 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label htmlFor="card-hl-3" className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <HardHat className="w-3.5 h-3.5 text-amber-400" />
                    <span>Highlight 3</span>
                  </label>
                  <input
                    id="card-hl-3"
                    type="text"
                    value={cards.highlight3Text}
                    onChange={(e) => setCards({ ...cards, highlight3Text: e.target.value })}
                    placeholder="120+ Konsultan Babel"
                    className="w-full bg-[#0F172A] border border-slate-700 focus:border-amber-500 rounded-lg px-3.5 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* Bagian 2: Informasi Kartu Visual Kanan */}
            <div className="space-y-4 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 border-b border-slate-800 pb-1.5 flex items-center gap-2">
                <Compass className="w-4 h-4" />
                <span>2. Header Visual Kartu Kanan</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="card-title" className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Judul Kartu
                  </label>
                  <input
                    id="card-title"
                    type="text"
                    value={cards.cardTitle}
                    onChange={(e) => setCards({ ...cards, cardTitle: e.target.value })}
                    placeholder="Rekayasa & Desain Konsultansi"
                    className="w-full bg-[#0F172A] border border-slate-700 focus:border-amber-500 rounded-lg px-3.5 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label htmlFor="card-subtitle" className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Subjudul / Wilayah
                  </label>
                  <input
                    id="card-subtitle"
                    type="text"
                    value={cards.cardSubtitle}
                    onChange={(e) => setCards({ ...cards, cardSubtitle: e.target.value })}
                    placeholder="Wilayah Kepulauan Bangka Belitung"
                    className="w-full bg-[#0F172A] border border-slate-700 focus:border-amber-500 rounded-lg px-3.5 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label htmlFor="card-badge" className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Badge / Tag Kartu
                  </label>
                  <input
                    id="card-badge"
                    type="text"
                    value={cards.cardBadge}
                    onChange={(e) => setCards({ ...cards, cardBadge: e.target.value })}
                    placeholder="SERUMPUN SEBALAI"
                    className="w-full bg-[#0F172A] border border-slate-700 focus:border-amber-500 rounded-lg px-3.5 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* Bagian 3: Tag Ilustrasi Skematik */}
            <div className="space-y-4 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 border-b border-slate-800 pb-1.5 flex items-center gap-2">
                <Layers className="w-4 h-4" />
                <span>3. Tag Ilustrasi Skematik Teknik</span>
              </h3>

              <div>
                <label htmlFor="card-fallback-tag" className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Label Tag Ilustrasi Skematik
                </label>
                <input
                  id="card-fallback-tag"
                  type="text"
                  value={cards.cardFallbackTag}
                  onChange={(e) => setCards({ ...cards, cardFallbackTag: e.target.value })}
                  placeholder="STRUKTUR MARITIM & SIPIL"
                  className="w-full bg-[#0F172A] border border-slate-700 focus:border-amber-500 rounded-lg px-3.5 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Bagian 4: Dua Kotak Fitur Bawah */}
            <div className="space-y-4 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 border-b border-slate-800 pb-1.5 flex items-center gap-2">
                <Award className="w-4 h-4" />
                <span>4. Kotak Fitur Bawah</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-[#0F172A] border border-slate-800 rounded-xl space-y-3">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-amber-400" />
                    <span>Fitur 1</span>
                  </span>
                  <div>
                    <label htmlFor="card-feat-1-title" className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Judul Fitur 1
                    </label>
                    <input
                      id="card-feat-1-title"
                      type="text"
                      value={cards.cardFeature1Title}
                      onChange={(e) => setCards({ ...cards, cardFeature1Title: e.target.value })}
                      placeholder="Terakreditasi"
                      className="w-full bg-[#1E293B] border border-slate-700 focus:border-amber-500 rounded-lg px-3 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label htmlFor="card-feat-1-desc" className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Deskripsi Fitur 1
                    </label>
                    <input
                      id="card-feat-1-desc"
                      type="text"
                      value={cards.cardFeature1Desc}
                      onChange={(e) => setCards({ ...cards, cardFeature1Desc: e.target.value })}
                      placeholder="Standar Asosiasi Konsultan Nasional"
                      className="w-full bg-[#1E293B] border border-slate-700 focus:border-amber-500 rounded-lg px-3 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="p-4 bg-[#0F172A] border border-slate-800 rounded-xl space-y-3">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-amber-400" />
                    <span>Fitur 2</span>
                  </span>
                  <div>
                    <label htmlFor="card-feat-2-title" className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Judul Fitur 2
                    </label>
                    <input
                      id="card-feat-2-title"
                      type="text"
                      value={cards.cardFeature2Title}
                      onChange={(e) => setCards({ ...cards, cardFeature2Title: e.target.value })}
                      placeholder="Multi Disiplin"
                      className="w-full bg-[#1E293B] border border-slate-700 focus:border-amber-500 rounded-lg px-3 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label htmlFor="card-feat-2-desc" className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Deskripsi Fitur 2
                    </label>
                    <input
                      id="card-feat-2-desc"
                      type="text"
                      value={cards.cardFeature2Desc}
                      onChange={(e) => setCards({ ...cards, cardFeature2Desc: e.target.value })}
                      placeholder="Konstruksi, Maritim, & Lingkungan"
                      className="w-full bg-[#1E293B] border border-slate-700 focus:border-amber-500 rounded-lg px-3 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Tombol Simpan & Pulihkan Kartu */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-700/80">
              <button
                type="submit"
                disabled={isSavingCards}
                className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs sm:text-sm font-semibold px-5 py-2.5 rounded-lg transition-all shadow-xs cursor-pointer"
              >
                {isSavingCards ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menyimpan Konten Kartu...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Simpan Konten Kartu</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleRestoreCards}
                disabled={isRestoringCards}
                className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 hover:text-white text-xs sm:text-sm font-medium px-4 py-2.5 rounded-lg border border-slate-700 transition-colors cursor-pointer"
              >
                {isRestoringCards ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Memulihkan...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4" />
                    <span>Pulihkan Teks Bawaan</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: TAMBAH / EDIT SLIDE GAMBAR                   */}
        {/* ==================================================== */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
            <div className="bg-[#1E293B] border border-slate-700 rounded-xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
              {/* Modal Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
                <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-amber-400" />
                  <span>{modalMode === "create" ? "Tambah Slide Baru" : "Ganti Gambar Slide"}</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleSubmitSlideForm} className="p-5 overflow-y-auto space-y-4">
                {/* File Upload Area */}
                <div>
                  <label htmlFor="slide-upload-file" className="block text-xs font-semibold text-slate-200 mb-1.5">
                    Pilih Berkas Gambar dari Komputer <span className="text-amber-500">*</span>
                  </label>
                  <input
                    id="slide-upload-file"
                    type="file"
                    ref={slideFileInputRef}
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleSlideFileChange}
                    className="w-full text-xs text-slate-300 file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700 cursor-pointer bg-[#0F172A] border border-slate-700 rounded-lg p-2"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Format: JPEG, PNG, WebP (Maks. 5 MB). Rasio 16:9 disarankan untuk tampilan background.
                  </p>
                </div>

                {/* Preview Box */}
                {(previewSlideUrl || currentImagePath) && (
                  <div>
                    <span className="block text-[11px] font-semibold text-slate-300 mb-1.5">
                      Pratinjau Gambar:
                    </span>
                    <div className="relative aspect-video w-full rounded-lg bg-slate-950 border border-slate-700 overflow-hidden">
                      <Image
                        src={previewSlideUrl || currentImagePath}
                        alt="Preview"
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                )}

                {/* Alt Text Input */}
                <div>
                  <label htmlFor="slide-alt-text" className="block text-xs font-semibold text-slate-200 mb-1.5">
                    Teks Keterangan Alternatif (Alt Text)
                  </label>
                  <input
                    id="slide-alt-text"
                    type="text"
                    value={formImageAlt}
                    onChange={(e) => setFormImageAlt(e.target.value)}
                    placeholder="Dokumentasi Hero INKINDO BABEL"
                    className="w-full bg-[#0F172A] border border-slate-700 focus:border-amber-500 rounded-lg px-3 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-hidden"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Digunakan untuk aksesibilitas dan SEO gambar background.
                  </p>
                </div>

                {/* Modal Footer Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-700">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingSlide || isUploadingSlide}
                    className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-all shadow-xs cursor-pointer"
                  >
                    {isSubmittingSlide || isUploadingSlide ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Menyimpan...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        <span>Simpan Gambar Slide</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* MODAL: KONFIRMASI HAPUS SLIDE                        */}
        {/* ==================================================== */}
        {deleteConfirmTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
            <div className="bg-[#1E293B] border border-rose-900/60 rounded-xl w-full max-w-md overflow-hidden shadow-2xl p-5 space-y-4">
              <div className="flex items-center gap-3 text-rose-400">
                <AlertCircle className="w-6 h-6 shrink-0" />
                <h3 className="text-sm font-bold text-white">Konfirmasi Hapus Slide</h3>
              </div>

              <div className="relative aspect-video w-full rounded-lg bg-slate-950 border border-slate-800 overflow-hidden">
                <Image
                  src={deleteConfirmTarget.imagePath}
                  alt="Slide yang akan dihapus"
                  fill
                  className="object-cover opacity-80"
                />
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Apakah Anda yakin ingin menghapus slide ini dari slideshow? Berkas gambar fisik yang tidak digunakan oleh slide lain juga akan dibersihkan dari server.
              </p>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmTarget(null)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleDeleteSlide}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition-colors cursor-pointer shadow-xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Slide</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminDashboardShell>
  );
}
