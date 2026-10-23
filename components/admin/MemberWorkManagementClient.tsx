"use client";

import React, { useState, useRef, useMemo } from "react";
import Image from "next/image";
import {
  AdminDashboardShell,
  type AdminProfile,
} from "@/components/admin";
import { logoutAdminAction } from "@/lib/auth/actions";
import {
  type MemberWorkItem,
  getMemberWorksAction,
  createMemberWorkAction,
  updateMemberWorkAction,
  deleteMemberWorkAction,
  toggleMemberWorkActiveAction,
  toggleMemberWorkFeaturedAction,
  reorderMemberWorksAction,
} from "@/lib/admin/member-work-actions";
import {
  Briefcase,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  X,
  Upload,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ChevronUp,
  ChevronDown,
  Building2,
  RefreshCw,
  Star,
} from "lucide-react";

interface MemberWorkManagementClientProps {
  profile: AdminProfile;
  initialWorks: MemberWorkItem[];
}

const COMMON_WORK_CATEGORIES = [
  "Perencanaan Wilayah & Maritim",
  "Rekayasa Struktur Bangunan",
  "Studi Lingkungan & Sumber Daya Air",
  "Manajemen Konstruksi & Utilitas",
  "Transportasi & Infrastruktur Jalan",
  "Ketenagalistrikan & Energi Terbarukan",
  "Teknologi Informasi & Geospasial",
];

interface FormState {
  title: string;
  slug: string;
  category: string;
  customCategory: string;
  company: string;
  year: string;
  client: string;
  description: string;
  imagePath: string | null;
  imageAlt: string;
  isFeatured: boolean;
  isActive: boolean;
}

const INITIAL_FORM_STATE: FormState = {
  title: "",
  slug: "",
  category: "Perencanaan Wilayah & Maritim",
  customCategory: "",
  company: "",
  year: new Date().getFullYear().toString(),
  client: "",
  description: "",
  imagePath: null,
  imageAlt: "",
  isFeatured: true,
  isActive: true,
};

export function MemberWorkManagementClient({
  profile,
  initialWorks,
}: MemberWorkManagementClientProps): React.JSX.Element {
  const [works, setWorks] = useState<MemberWorkItem[]>(initialWorks);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [featuredFilter, setFeaturedFilter] = useState<"all" | "featured" | "standard">("all");
  const [isFetchingList, setIsFetchingList] = useState(false);
  const [isReordering, setIsReordering] = useState(false);

  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingWork, setEditingWork] = useState<MemberWorkItem | null>(null);

  const [formState, setFormState] = useState<FormState>(INITIAL_FORM_STATE);
  const [initialSnapshot, setInitialSnapshot] = useState<string>("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<MemberWorkItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [togglingActiveId, setTogglingActiveId] = useState<string | null>(null);
  const [togglingFeaturedId, setTogglingFeaturedId] = useState<string | null>(null);

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification((curr) => (curr?.message === message ? null : curr));
    }, 5000);
  };

  const handleLogout = async () => {
    await logoutAdminAction();
  };

  const uniqueCategories = useMemo(() => {
    const categoriesSet = new Set<string>();
    works.forEach((w) => {
      if (w.category && w.category.trim()) {
        categoriesSet.add(w.category.trim());
      }
    });
    return Array.from(categoriesSet).sort();
  }, [works]);

  const filteredWorks = useMemo(() => {
    return works
      .filter((w) => {
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchTitle = w.title.toLowerCase().includes(q);
          const matchCompany = w.company.toLowerCase().includes(q);
          const matchCat = w.category.toLowerCase().includes(q);
          const matchYear = w.year.toLowerCase().includes(q);
          const matchClient = (w.client || "").toLowerCase().includes(q);
          if (!matchTitle && !matchCompany && !matchCat && !matchYear && !matchClient) {
            return false;
          }
        }

        if (categoryFilter !== "all") {
          if (w.category.trim() !== categoryFilter) return false;
        }

        if (statusFilter === "active" && !w.isActive) return false;
        if (statusFilter === "inactive" && w.isActive) return false;

        if (featuredFilter === "featured" && !w.isFeatured) return false;
        if (featuredFilter === "standard" && w.isFeatured) return false;

        return true;
      })
      .sort((a, b) => a.order - b.order);
  }, [works, searchQuery, categoryFilter, statusFilter, featuredFilter]);

  const totalWorksCount = works.length;
  const activeWorksCount = works.filter((w) => w.isActive).length;
  const featuredWorksCount = works.filter((w) => w.isFeatured).length;
  const withImageCount = works.filter((w) => w.imagePath && w.imagePath.trim()).length;

  const handleRefresh = async () => {
    setIsFetchingList(true);
    try {
      const res = await getMemberWorksAction();
      if (res.success && res.data) {
        setWorks(res.data);
        showNotification("success", "Daftar karya anggota berhasil dimuat ulang.");
      } else {
        showNotification("error", res.error || "Gagal memuat daftar karya anggota.");
      }
    } catch {
      showNotification("error", "Terjadi kesalahan saat memuat ulang data.");
    } finally {
      setIsFetchingList(false);
    }
  };

  const handleOpenCreateModal = () => {
    setModalMode("create");
    setEditingWork(null);
    const freshState: FormState = {
      ...INITIAL_FORM_STATE,
      category: COMMON_WORK_CATEGORIES[0],
    };
    setFormState(freshState);
    setInitialSnapshot(JSON.stringify(freshState));
    setFormErrors({});
    setIsModalOpen(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleOpenEditModal = (work: MemberWorkItem) => {
    setModalMode("edit");
    setEditingWork(work);

    const isCommon = COMMON_WORK_CATEGORIES.includes(work.category || "");
    const selectedCategory = isCommon
      ? work.category
      : work.category
      ? "__custom__"
      : COMMON_WORK_CATEGORIES[0];
    const customCat = isCommon ? "" : work.category || "";

    const freshState: FormState = {
      title: work.title,
      slug: work.slug,
      category: selectedCategory,
      customCategory: customCat,
      company: work.company,
      year: work.year,
      client: work.client || "",
      description: work.description || "",
      imagePath: work.imagePath || null,
      imageAlt: work.imageAlt || "",
      isFeatured: work.isFeatured,
      isActive: work.isActive,
    };

    setFormState(freshState);
    setInitialSnapshot(JSON.stringify(freshState));
    setFormErrors({});
    setIsModalOpen(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCloseModal = () => {
    const isDirty = JSON.stringify(formState) !== initialSnapshot;
    if (isDirty) {
      if (!window.confirm("Perubahan formulir belum disimpan. Tutup jendela?")) {
        return;
      }
    }
    setIsModalOpen(false);
    setEditingWork(null);
    setFormErrors({});
  };

  const handleImageFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showNotification("error", "Ukuran gambar melebihi batas maksimum 5 MiB.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const validMimes = ["image/jpeg", "image/png", "image/webp"];
    if (!validMimes.includes(file.type)) {
      showNotification("error", "Format berkas harus JPEG, PNG, atau WebP.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/member-work-upload", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        showNotification("error", json.error || "Gagal mengunggah berkas gambar.");
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      const uploadedPath = json.path || json.data?.publicPath;
      setFormState((prev) => ({
        ...prev,
        imagePath: uploadedPath,
      }));
      showNotification("success", "Gambar karya anggota berhasil diunggah.");
    } catch {
      showNotification("error", "Terjadi kesalahan jaringan saat mengunggah gambar.");
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveImage = () => {
    setFormState((prev) => ({
      ...prev,
      imagePath: null,
    }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formState.title.trim()) {
      errors.title = "Judul karya / proyek wajib diisi.";
    } else if (formState.title.trim().length > 150) {
      errors.title = "Judul karya maksimal 150 karakter.";
    }

    const finalCategory =
      formState.category === "__custom__"
        ? formState.customCategory.trim()
        : formState.category.trim();

    if (!finalCategory) {
      errors.category = "Kategori bidang keahlian wajib dipilih atau diisi.";
    } else if (finalCategory.length > 50) {
      errors.category = "Kategori maksimal 50 karakter.";
    }

    if (!formState.company.trim()) {
      errors.company = "Nama badan usaha / perusahaan anggota wajib diisi.";
    } else if (formState.company.trim().length > 100) {
      errors.company = "Nama perusahaan maksimal 100 karakter.";
    }

    if (!formState.year.trim()) {
      errors.year = "Tahun pelaksanaan proyek wajib diisi.";
    } else if (formState.year.trim().length > 20) {
      errors.year = "Tahun proyek maksimal 20 karakter.";
    }

    if (formState.client.trim().length > 100) {
      errors.client = "Nama klien maksimal 100 karakter.";
    }

    if (formState.description.trim().length > 1000) {
      errors.description = "Deskripsi proyek maksimal 1000 karakter.";
    }

    if (formState.imageAlt.trim().length > 200) {
      errors.imageAlt = "Teks alternatif maksimal 200 karakter.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      showNotification("error", "Periksa kembali isian formulir yang ditandai merah.");
      return;
    }

    setIsSubmittingForm(true);

    const finalCategory =
      formState.category === "__custom__"
        ? formState.customCategory.trim()
        : formState.category.trim();

    try {
      if (modalMode === "create") {
        const res = await createMemberWorkAction({
          title: formState.title.trim(),
          slug: formState.slug.trim() || undefined,
          category: finalCategory,
          company: formState.company.trim(),
          year: formState.year.trim(),
          client: formState.client.trim() || null,
          description: formState.description.trim() || null,
          imagePath: formState.imagePath,
          imageAlt: formState.imageAlt.trim() || null,
          isFeatured: formState.isFeatured,
          isActive: formState.isActive,
        });

        if (res.success && res.data) {
          setWorks((prev) => [...prev, res.data!].sort((a, b) => a.order - b.order));
          setIsModalOpen(false);
          showNotification("success", `Karya "${res.data.title}" berhasil ditambahkan.`);
        } else {
          showNotification("error", res.error || "Gagal menambahkan karya anggota.");
        }
      } else if (modalMode === "edit" && editingWork) {
        const res = await updateMemberWorkAction({
          id: editingWork.id,
          title: formState.title.trim(),
          slug: formState.slug.trim() || undefined,
          category: finalCategory,
          company: formState.company.trim(),
          year: formState.year.trim(),
          client: formState.client.trim() || null,
          description: formState.description.trim() || null,
          imagePath: formState.imagePath,
          imageAlt: formState.imageAlt.trim() || null,
          isFeatured: formState.isFeatured,
          isActive: formState.isActive,
        });

        if (res.success && res.data) {
          setWorks((prev) =>
            prev.map((w) => (w.id === editingWork.id ? res.data! : w)).sort((a, b) => a.order - b.order)
          );
          setIsModalOpen(false);
          showNotification("success", `Karya "${res.data.title}" berhasil diperbarui.`);
        } else {
          showNotification("error", res.error || "Gagal memperbarui karya anggota.");
        }
      }
    } catch {
      showNotification("error", "Terjadi kesalahan tidak terduga saat menyimpan data.");
    } finally {
      setIsSubmittingForm(false);
    }
  };

  const handleToggleActive = async (work: MemberWorkItem) => {
    setTogglingActiveId(work.id);
    try {
      const res = await toggleMemberWorkActiveAction(work.id);
      if (res.success && res.data) {
        setWorks((prev) =>
          prev.map((w) => (w.id === work.id ? { ...w, isActive: res.data!.isActive } : w))
        );
        showNotification(
          "success",
          res.data.isActive
            ? `Karya "${work.title}" diaktifkan.`
            : `Karya "${work.title}" dinonaktifkan.`
        );
      } else {
        showNotification("error", res.error || "Gagal mengubah status aktif karya.");
      }
    } catch {
      showNotification("error", "Gagal memperbarui status aktif karya.");
    } finally {
      setTogglingActiveId(null);
    }
  };

  const handleToggleFeatured = async (work: MemberWorkItem) => {
    setTogglingFeaturedId(work.id);
    try {
      const res = await toggleMemberWorkFeaturedAction(work.id);
      if (res.success && res.data) {
        setWorks((prev) =>
          prev.map((w) => (w.id === work.id ? { ...w, isFeatured: res.data!.isFeatured } : w))
        );
        showNotification(
          "success",
          res.data.isFeatured
            ? `Karya "${work.title}" ditandai sebagai Portofolio Unggulan.`
            : `Karya "${work.title}" dijadikan portofolio standar.`
        );
      } else {
        showNotification("error", res.error || "Gagal mengubah status unggulan.");
      }
    } catch {
      showNotification("error", "Gagal memperbarui status unggulan karya.");
    } finally {
      setTogglingFeaturedId(null);
    }
  };

  const handleMoveOrder = async (workId: string, direction: "up" | "down") => {
    const currentIndex = works.findIndex((w) => w.id === workId);
    if (currentIndex === -1) return;

    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= works.length) return;

    const reordered = [...works];
    const [movedItem] = reordered.splice(currentIndex, 1);
    reordered.splice(targetIndex, 0, movedItem);

    const reorderedWithNumbers = reordered.map((item, idx) => ({
      ...item,
      order: idx + 1,
    }));

    setWorks(reorderedWithNumbers);
    setIsReordering(true);

    try {
      const orderedIds = reorderedWithNumbers.map((w) => w.id);
      const res = await reorderMemberWorksAction(orderedIds);
      if (res.success) {
        showNotification("success", "Urutan karya anggota berhasil diperbarui.");
      } else {
        showNotification("error", res.error || "Gagal menyimpan urutan baru.");
        const refresh = await getMemberWorksAction();
        if (refresh.success && refresh.data) {
          setWorks(refresh.data);
        }
      }
    } catch {
      showNotification("error", "Terjadi kegagalan koneksi saat mengurutkan karya.");
      const refresh = await getMemberWorksAction();
      if (refresh.success && refresh.data) {
        setWorks(refresh.data);
      }
    } finally {
      setIsReordering(false);
    }
  };

  const handleDeleteWork = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      const res = await deleteMemberWorkAction(deleteTarget.id);
      if (res.success) {
        setWorks((prev) => prev.filter((w) => w.id !== deleteTarget.id));
        showNotification("success", `Karya "${deleteTarget.title}" berhasil dihapus.`);
        setDeleteTarget(null);
      } else {
        showNotification("error", res.error || "Gagal menghapus karya anggota.");
      }
    } catch {
      showNotification("error", "Terjadi kesalahan saat menghapus karya anggota.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AdminDashboardShell
      profile={profile}
      activeItemId="member-works"
      pageTitle="Karya & Portofolio Anggota"
      pageSubtitle="Pengelolaan Galeri Portofolio Proyek Rekayasa, Konsultansi, dan Dedikasi Anggota INKINDO BABEL"
      onLogout={handleLogout}
    >
      <div className="space-y-6">
        {notification && (
          <div
            className={`flex items-start gap-3 p-4 rounded-xl border text-sm shadow-sm transition-all ${
              notification.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                : "bg-rose-500/10 border-rose-500/20 text-rose-400"
            }`}
          >
            {notification.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            )}
            <p className="flex-1 font-medium">{notification.message}</p>
            <button
              type="button"
              onClick={() => setNotification(null)}
              className="text-slate-400 hover:text-white p-0.5 rounded transition-colors"
              aria-label="Tutup notifikasi"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#1E293B] border border-slate-700/60 p-4 sm:p-5 rounded-xl shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Karya</span>
              <Briefcase className="w-4 h-4 text-[#D97706]" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-white">
              {totalWorksCount}
            </div>
            <p className="text-xs text-slate-400 mt-1">Portofolio terdaftar</p>
          </div>

          <div className="bg-[#1E293B] border border-slate-700/60 p-4 sm:p-5 rounded-xl shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Unggulan</span>
              <Star className="w-4 h-4 text-amber-400 fill-amber-400/30" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-amber-400">
              {featuredWorksCount}
            </div>
            <p className="text-xs text-slate-400 mt-1">Portofolio prioritas beranda</p>
          </div>

          <div className="bg-[#1E293B] border border-slate-700/60 p-4 sm:p-5 rounded-xl shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Karya Aktif</span>
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-emerald-400">
              {activeWorksCount}
            </div>
            <p className="text-xs text-slate-400 mt-1">Tayang di halaman website</p>
          </div>

          <div className="bg-[#1E293B] border border-slate-700/60 p-4 sm:p-5 rounded-xl shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Dengan Foto</span>
              <Upload className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-slate-200">
              {withImageCount}
            </div>
            <p className="text-xs text-slate-400 mt-1">Foto dokumentasi riil</p>
          </div>
        </div>

        <div className="bg-[#1E293B] border border-slate-700/60 rounded-xl p-4 sm:p-5 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row gap-3 md:items-center justify-between">
            <div className="flex-1 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari judul proyek, perusahaan, atau kategori..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#0F172A] border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-[#D97706]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <div className="relative">
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="bg-[#0F172A] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-[#D97706] appearance-none pr-8 cursor-pointer"
                  >
                    <option value="all">Semua Kategori</option>
                    {uniqueCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  <Filter className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "inactive")}
                  className="bg-[#0F172A] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-[#D97706] cursor-pointer"
                >
                  <option value="all">Semua Status</option>
                  <option value="active">Aktif</option>
                  <option value="inactive">Nonaktif</option>
                </select>

                <select
                  value={featuredFilter}
                  onChange={(e) => setFeaturedFilter(e.target.value as "all" | "featured" | "standard")}
                  className="bg-[#0F172A] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-[#D97706] cursor-pointer"
                >
                  <option value="all">Semua Sorotan</option>
                  <option value="featured">Hanya Unggulan</option>
                  <option value="standard">Standar</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end md:self-auto">
              <button
                type="button"
                onClick={handleRefresh}
                disabled={isFetchingList}
                className="p-2 border border-slate-700 hover:bg-slate-800 text-slate-300 rounded-lg transition-colors disabled:opacity-50"
                title="Muat ulang data"
              >
                <RefreshCw className={`w-4 h-4 ${isFetchingList ? "animate-spin text-[#D97706]" : ""}`} />
              </button>
              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="inline-flex items-center gap-2 bg-[#D97706] hover:bg-[#B45309] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Karya</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-700/80">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-[#0F172A] text-xs uppercase font-semibold text-slate-400 border-b border-slate-700">
                <tr>
                  <th scope="col" className="py-3 px-3 w-16 text-center">Urutan</th>
                  <th scope="col" className="py-3 px-3 w-24 text-center">Gambar</th>
                  <th scope="col" className="py-3 px-4">Judul Karya & Identitas</th>
                  <th scope="col" className="py-3 px-4 hidden md:table-cell">Kategori</th>
                  <th scope="col" className="py-3 px-3 hidden lg:table-cell text-center w-20">Tahun</th>
                  <th scope="col" className="py-3 px-3 text-center w-24">Unggulan</th>
                  <th scope="col" className="py-3 px-3 text-center w-24">Status</th>
                  <th scope="col" className="py-3 px-4 text-right w-24">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredWorks.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <Briefcase className="w-10 h-10 mx-auto mb-2 text-slate-600 opacity-60" />
                      <p className="font-medium text-base text-slate-300">Tidak ada data karya anggota.</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {searchQuery || categoryFilter !== "all" || statusFilter !== "all" || featuredFilter !== "all"
                          ? "Coba sesuaikan kata kunci atau filter pencarian Anda."
                          : "Klik tombol 'Tambah Karya' untuk mencatat portofolio proyek anggota pertama."}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredWorks.map((work, index) => {
                    const isFirst = index === 0;
                    const isLast = index === filteredWorks.length - 1;

                    return (
                      <tr
                        key={work.id}
                        className="hover:bg-slate-800/50 transition-colors group"
                      >
                        <td className="py-3 px-3 text-center">
                          <div className="flex flex-col items-center justify-center gap-0.5">
                            <span className="font-mono text-xs font-semibold text-slate-400 mb-0.5">
                              #{work.order}
                            </span>
                            <div className="flex items-center gap-0.5">
                              <button
                                type="button"
                                onClick={() => handleMoveOrder(work.id, "up")}
                                disabled={isFirst || isReordering}
                                className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white disabled:opacity-20 disabled:hover:bg-transparent"
                                title="Geser Naik"
                              >
                                <ChevronUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMoveOrder(work.id, "down")}
                                disabled={isLast || isReordering}
                                className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white disabled:opacity-20 disabled:hover:bg-transparent"
                                title="Geser Turun"
                              >
                                <ChevronDown className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3 text-center">
                          <div className="w-20 h-14 mx-auto rounded-lg bg-[#0F172A] border border-slate-700/80 flex items-center justify-center overflow-hidden relative">
                            {work.imagePath ? (
                              <Image
                                src={work.imagePath}
                                alt={work.imageAlt || work.title}
                                width={80}
                                height={56}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-[#152238] flex flex-col items-center justify-center p-1 text-center">
                                <Building2 className="w-4 h-4 text-[#D97706] mb-0.5" />
                                <span className="text-[9px] font-mono text-slate-400 leading-tight truncate max-w-[70px]">
                                  {work.imageAlt || "SKEMATIK"}
                                </span>
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-semibold text-white group-hover:text-[#D97706] transition-colors leading-snug">
                            {work.title}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-400">
                            <span className="inline-flex items-center gap-1 font-medium text-slate-300">
                              <Building2 className="w-3 h-3 text-slate-400" />
                              <span>{work.company}</span>
                            </span>
                            {work.client && (
                              <span className="hidden sm:inline text-slate-400">
                                • Klien: {work.client}
                              </span>
                            )}
                            <span className="font-mono text-[11px] text-slate-500">
                              /{work.slug}
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-4 hidden md:table-cell">
                          <span className="inline-block px-2.5 py-1 bg-slate-800/80 border border-slate-700/60 rounded-full text-xs text-slate-300">
                            {work.category}
                          </span>
                        </td>

                        <td className="py-3 px-3 hidden lg:table-cell text-center">
                          <span className="font-mono text-xs text-slate-300 px-2 py-0.5 bg-[#0F172A] rounded border border-slate-700">
                            {work.year}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleFeatured(work)}
                            disabled={togglingFeaturedId === work.id}
                            className={`p-1.5 rounded-lg border transition-all ${
                              work.isFeatured
                                ? "bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20"
                                : "bg-slate-800/60 text-slate-500 border-slate-700 hover:text-slate-300 hover:bg-slate-700"
                            }`}
                            title={work.isFeatured ? "Klik untuk jadikan standar" : "Klik untuk jadikan unggulan"}
                          >
                            {togglingFeaturedId === work.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Star className={`w-4 h-4 ${work.isFeatured ? "fill-amber-400" : ""}`} />
                            )}
                          </button>
                        </td>

                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleActive(work)}
                            disabled={togglingActiveId === work.id}
                            className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold border transition-all ${
                              work.isActive
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                                : "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700"
                            }`}
                          >
                            {togglingActiveId === work.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  work.isActive ? "bg-emerald-400" : "bg-slate-500"
                                }`}
                              />
                            )}
                            <span>{work.isActive ? "Aktif" : "Nonaktif"}</span>
                          </button>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(work)}
                              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                              title="Edit Karya"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(work)}
                              className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors"
                              title="Hapus Karya"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
            <span>
              Menampilkan <span className="text-white font-medium">{filteredWorks.length}</span> dari{" "}
              <span className="text-white font-medium">{totalWorksCount}</span> karya portofolio
            </span>
            <span className="italic text-slate-500">
              Gunakan tombol naik/turun untuk mengatur posisi tampilan di galeri
            </span>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#1E293B] border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-slate-700 sticky top-0 bg-[#1E293B] z-10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#D97706]/10 text-[#D97706] rounded-lg">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {modalMode === "create" ? "Tambah Karya Anggota" : `Edit Karya: ${editingWork?.title}`}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {modalMode === "create"
                      ? "Isi portofolio proyek konsultansi untuk ditampilkan pada galeri karya anggota"
                      : "Perbarui informasi dan dokumentasi karya anggota"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-5 space-y-4 flex-1">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Judul Proyek / Karya <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Perencanaan Kawasan Pelabuhan Terpadu Sadai"
                  value={formState.title}
                  onChange={(e) => setFormState((prev) => ({ ...prev, title: e.target.value }))}
                  className={`w-full bg-[#0F172A] border rounded-lg px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#D97706] ${
                    formErrors.title ? "border-rose-500" : "border-slate-700"
                  }`}
                />
                {formErrors.title && (
                  <p className="text-xs text-rose-400 mt-1">{formErrors.title}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Kategori Bidang Keahlian <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={formState.category}
                    onChange={(e) => setFormState((prev) => ({ ...prev, category: e.target.value }))}
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#D97706] cursor-pointer"
                  >
                    {COMMON_WORK_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                    <option value="__custom__">+ Kategori Kustom</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Tahun Pelaksanaan <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 2025 atau 2024 - 2025"
                    value={formState.year}
                    onChange={(e) => setFormState((prev) => ({ ...prev, year: e.target.value }))}
                    className={`w-full bg-[#0F172A] border rounded-lg px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#D97706] ${
                      formErrors.year ? "border-rose-500" : "border-slate-700"
                    }`}
                  />
                  {formErrors.year && (
                    <p className="text-xs text-rose-400 mt-1">{formErrors.year}</p>
                  )}
                </div>
              </div>

              {formState.category === "__custom__" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Nama Kategori Kustom <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Masukkan nama bidang keahlian baru..."
                    value={formState.customCategory}
                    onChange={(e) => setFormState((prev) => ({ ...prev, customCategory: e.target.value }))}
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#D97706]"
                  />
                  {formErrors.category && (
                    <p className="text-xs text-rose-400 mt-1">{formErrors.category}</p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Perusahaan Anggota Pelaksana <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: PT. Timah Rekayasa Konsultan"
                    value={formState.company}
                    onChange={(e) => setFormState((prev) => ({ ...prev, company: e.target.value }))}
                    className={`w-full bg-[#0F172A] border rounded-lg px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#D97706] ${
                      formErrors.company ? "border-rose-500" : "border-slate-700"
                    }`}
                  />
                  {formErrors.company && (
                    <p className="text-xs text-rose-400 mt-1">{formErrors.company}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Klien / Pemberi Tugas (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Dinas PUPR Prov. Kep. Babel"
                    value={formState.client}
                    onChange={(e) => setFormState((prev) => ({ ...prev, client: e.target.value }))}
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#D97706]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Kustom Slug URL (Opsional)
                </label>
                <div className="flex items-center">
                  <span className="px-3 py-2.5 bg-[#0F172A] border border-r-0 border-slate-700 rounded-l-lg text-xs text-slate-400 font-mono">
                    /karya/
                  </span>
                  <input
                    type="text"
                    placeholder={modalMode === "create" ? "otomatis dari judul jika dikosongkan" : editingWork?.slug}
                    value={formState.slug}
                    onChange={(e) => setFormState((prev) => ({ ...prev, slug: e.target.value }))}
                    className="flex-1 bg-[#0F172A] border border-slate-700 rounded-r-lg px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#D97706] font-mono text-xs"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Biarkan kosong untuk membuat slug otomatis dari judul proyek.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Deskripsi Proyek (Opsional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Ringkasan ruang lingkup pekerjaan, metodologi studi, atau capaian rekayasa..."
                  value={formState.description}
                  onChange={(e) => setFormState((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-[#0F172A] border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#D97706]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Foto / Gambar Dokumentasi Proyek (Opsional)
                </label>
                <div className="border border-slate-700/80 rounded-xl p-4 bg-[#0F172A] space-y-3">
                  {formState.imagePath ? (
                    <div className="flex items-center gap-4">
                      <div className="w-24 h-16 rounded-lg bg-[#1E293B] border border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                        <Image
                          src={formState.imagePath}
                          alt="Preview gambar karya"
                          width={96}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-300 truncate">
                          {formState.imagePath}
                        </p>
                        <p className="text-[11px] text-emerald-400 mt-0.5">Gambar siap disimpan</p>
                        <div className="flex gap-2 mt-2">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploadingImage}
                            className="text-xs text-[#D97706] hover:underline disabled:opacity-50"
                          >
                            Ganti Gambar
                          </button>
                          <span className="text-slate-600">•</span>
                          <button
                            type="button"
                            onClick={handleRemoveImage}
                            disabled={isUploadingImage}
                            className="text-xs text-rose-400 hover:underline disabled:opacity-50"
                          >
                            Hapus Gambar
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <Upload className="w-8 h-8 mx-auto text-slate-500 mb-2 opacity-70" />
                      <p className="text-xs text-slate-300 font-medium">Unggah foto dokumentasi proyek</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">Format JPEG, PNG, atau WebP (maks. 5 MiB)</p>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingImage}
                        className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg text-xs font-semibold text-slate-200 transition-colors disabled:opacity-50"
                      >
                        {isUploadingImage ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Mengunggah...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-3.5 h-3.5" />
                            <span>Pilih Berkas Gambar</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageFileSelect}
                    className="hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Teks Alternatif / Teks Placeholder
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Masterplan Kawasan Pelabuhan Sadai"
                  value={formState.imageAlt}
                  onChange={(e) => setFormState((prev) => ({ ...prev, imageAlt: e.target.value }))}
                  className="w-full bg-[#0F172A] border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#D97706]"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Saat gambar belum diunggah, teks ini akan ditampilkan pada bingkai skematik karya.
                </p>
              </div>

              <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex items-center gap-3 p-3 bg-[#0F172A] border border-slate-700 rounded-xl cursor-pointer hover:bg-slate-900 transition-colors">
                  <input
                    type="checkbox"
                    checked={formState.isFeatured}
                    onChange={(e) => setFormState((prev) => ({ ...prev, isFeatured: e.target.checked }))}
                    className="w-4 h-4 rounded border-slate-700 text-[#D97706] focus:ring-[#D97706] focus:ring-offset-0 bg-[#1E293B]"
                  />
                  <div>
                    <span className="text-sm font-semibold text-white flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <span>Portofolio Unggulan</span>
                    </span>
                    <span className="text-xs text-slate-400 block mt-0.5">
                      Prioritaskan di seksi Portofolio Beranda
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 bg-[#0F172A] border border-slate-700 rounded-xl cursor-pointer hover:bg-slate-900 transition-colors">
                  <input
                    type="checkbox"
                    checked={formState.isActive}
                    onChange={(e) => setFormState((prev) => ({ ...prev, isActive: e.target.checked }))}
                    className="w-4 h-4 rounded border-slate-700 text-[#D97706] focus:ring-[#D97706] focus:ring-offset-0 bg-[#1E293B]"
                  />
                  <div>
                    <span className="text-sm font-semibold text-white block">Status Aktif</span>
                    <span className="text-xs text-slate-400 block mt-0.5">
                      Tampilkan di galeri publik website
                    </span>
                  </div>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-700 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isSubmittingForm || isUploadingImage}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-300 hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingForm || isUploadingImage}
                  className="inline-flex items-center gap-2 bg-[#D97706] hover:bg-[#B45309] text-white px-5 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 shadow-sm"
                >
                  {isSubmittingForm ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>{modalMode === "create" ? "Simpan Karya" : "Simpan Perubahan"}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-[#1E293B] border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h4 className="text-lg font-bold text-white">Hapus Karya Anggota?</h4>
              <p className="text-sm text-slate-300">
                Apakah Anda yakin ingin menghapus portofolio{" "}
                <span className="font-semibold text-white">&ldquo;{deleteTarget.title}&rdquo;</span> oleh{" "}
                <span className="font-semibold text-white">{deleteTarget.company}</span>?
              </p>
              <p className="text-xs text-slate-400">
                Tindakan ini permanen dan berkas gambar dokumentasi terkait akan dibersihkan secara aman jika tidak dipakai oleh karya lain.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-300 hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteWork}
                disabled={isDeleting}
                className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <span>Ya, Hapus Karya</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminDashboardShell>
  );
}
