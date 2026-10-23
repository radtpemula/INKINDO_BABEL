"use client";

import React, { useState, useRef, useMemo } from "react";
import Image from "next/image";
import {
  AdminDashboardShell,
  type AdminProfile,
} from "@/components/admin";
import { logoutAdminAction } from "@/lib/auth/actions";
import {
  type PartnerItem,
  getPartnersAction,
  createPartnerAction,
  updatePartnerAction,
  deletePartnerAction,
  togglePartnerActiveAction,
  reorderPartnersAction,
} from "@/lib/admin/partner-actions";
import {
  Handshake,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Globe,
  X,
  Upload,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ChevronUp,
  ChevronDown,
  Building2,
  RefreshCw,
  ExternalLink,
} from "lucide-react";

interface PartnerManagementClientProps {
  profile: AdminProfile;
  initialPartners: PartnerItem[];
}

const COMMON_PARTNER_CATEGORIES = [
  "Kementerian & Lembaga Negara",
  "Pemerintah Daerah",
  "Mitra Perbankan & Finansial",
  "Lembaga Sertifikasi Profesi",
  "Asosiasi Profesi & Industri",
  "Instansi BUMN / BUMD",
  "Mitra Strategis Lainnya",
];

interface FormState {
  name: string;
  shortName: string;
  category: string;
  customCategory: string;
  websiteUrl: string;
  logoPath: string | null;
  isActive: boolean;
}

const INITIAL_FORM_STATE: FormState = {
  name: "",
  shortName: "",
  category: "Kementerian & Lembaga Negara",
  customCategory: "",
  websiteUrl: "",
  logoPath: null,
  isActive: true,
};

export function PartnerManagementClient({
  profile,
  initialPartners,
}: PartnerManagementClientProps): React.JSX.Element {
  const [partners, setPartners] = useState<PartnerItem[]>(initialPartners);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [isFetchingList, setIsFetchingList] = useState(false);
  const [isReordering, setIsReordering] = useState(false);

  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingPartner, setEditingPartner] = useState<PartnerItem | null>(null);

  const [formState, setFormState] = useState<FormState>(INITIAL_FORM_STATE);
  const [initialSnapshot, setInitialSnapshot] = useState<string>("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<PartnerItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [togglingId, setTogglingId] = useState<string | null>(null);

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
    partners.forEach((p) => {
      if (p.category && p.category.trim()) {
        categoriesSet.add(p.category.trim());
      }
    });
    return Array.from(categoriesSet).sort();
  }, [partners]);

  const filteredPartners = useMemo(() => {
    return partners
      .filter((p) => {
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = p.name.toLowerCase().includes(q);
          const matchShort = p.shortName.toLowerCase().includes(q);
          const matchCat = (p.category || "").toLowerCase().includes(q);
          if (!matchName && !matchShort && !matchCat) return false;
        }

        if (categoryFilter !== "all") {
          if ((p.category || "").trim() !== categoryFilter) return false;
        }

        if (statusFilter === "active" && !p.isActive) return false;
        if (statusFilter === "inactive" && p.isActive) return false;

        return true;
      })
      .sort((a, b) => a.order - b.order);
  }, [partners, searchQuery, categoryFilter, statusFilter]);

  const totalPartnersCount = partners.length;
  const activePartnersCount = partners.filter((p) => p.isActive).length;
  const withLogoCount = partners.filter((p) => p.logoPath && p.logoPath.trim()).length;

  const handleRefresh = async () => {
    setIsFetchingList(true);
    try {
      const res = await getPartnersAction();
      if (res.success && res.data) {
        setPartners(res.data);
        showNotification("success", "Daftar mitra kerja berhasil dimuat ulang.");
      } else {
        showNotification("error", res.error || "Gagal memuat daftar mitra kerja.");
      }
    } catch {
      showNotification("error", "Terjadi kesalahan saat memuat ulang data.");
    } finally {
      setIsFetchingList(false);
    }
  };

  const handleOpenCreateModal = () => {
    setModalMode("create");
    setEditingPartner(null);
    const freshState: FormState = {
      ...INITIAL_FORM_STATE,
      category: COMMON_PARTNER_CATEGORIES[0],
    };
    setFormState(freshState);
    setInitialSnapshot(JSON.stringify(freshState));
    setFormErrors({});
    setIsModalOpen(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleOpenEditModal = (partner: PartnerItem) => {
    setModalMode("edit");
    setEditingPartner(partner);

    const isCommon = COMMON_PARTNER_CATEGORIES.includes(partner.category || "");
    const selectedCategory = isCommon
      ? partner.category || COMMON_PARTNER_CATEGORIES[0]
      : partner.category
      ? "__custom__"
      : COMMON_PARTNER_CATEGORIES[0];
    const customCat = isCommon ? "" : partner.category || "";

    const freshState: FormState = {
      name: partner.name,
      shortName: partner.shortName,
      category: selectedCategory,
      customCategory: customCat,
      websiteUrl: partner.websiteUrl || "",
      logoPath: partner.logoPath || null,
      isActive: partner.isActive,
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
    setEditingPartner(null);
    setFormErrors({});
  };

  const handleLogoFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showNotification("error", "Ukuran logo melebihi batas maksimum 5 MiB.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const validMimes = ["image/jpeg", "image/png", "image/webp"];
    if (!validMimes.includes(file.type)) {
      showNotification("error", "Format berkas harus JPEG, PNG, atau WebP.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setIsUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/partner-upload", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        showNotification("error", json.error || "Gagal mengunggah berkas logo.");
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      const uploadedPath = json.path || json.data?.publicPath;
      setFormState((prev) => ({
        ...prev,
        logoPath: uploadedPath,
      }));
      showNotification("success", "Logo berhasil diunggah.");
    } catch {
      showNotification("error", "Terjadi kesalahan jaringan saat mengunggah logo.");
    } finally {
      setIsUploadingLogo(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveLogo = () => {
    setFormState((prev) => ({
      ...prev,
      logoPath: null,
    }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formState.name.trim()) {
      errors.name = "Nama lengkap mitra wajib diisi.";
    } else if (formState.name.trim().length > 150) {
      errors.name = "Nama mitra maksimal 150 karakter.";
    }

    if (!formState.shortName.trim()) {
      errors.shortName = "Singkatan / nama pendek wajib diisi.";
    } else if (formState.shortName.trim().length > 50) {
      errors.shortName = "Singkatan maksimal 50 karakter.";
    }

    const finalCategory =
      formState.category === "__custom__"
        ? formState.customCategory.trim()
        : formState.category.trim();

    if (finalCategory && finalCategory.length > 50) {
      errors.category = "Kategori maksimal 50 karakter.";
    }

    if (formState.websiteUrl.trim()) {
      const url = formState.websiteUrl.trim();
      if (url.length > 255) {
        errors.websiteUrl = "URL website maksimal 255 karakter.";
      } else if (!/^https?:\/\//i.test(url)) {
        errors.websiteUrl = "URL website harus dimulai dengan http:// atau https://";
      }
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
        const res = await createPartnerAction({
          name: formState.name.trim(),
          shortName: formState.shortName.trim(),
          category: finalCategory || null,
          websiteUrl: formState.websiteUrl.trim() || null,
          logoPath: formState.logoPath,
          isActive: formState.isActive,
        });

        if (res.success && res.data) {
          setPartners((prev) => [...prev, res.data!].sort((a, b) => a.order - b.order));
          setIsModalOpen(false);
          showNotification("success", `Mitra "${res.data.shortName}" berhasil ditambahkan.`);
        } else {
          showNotification("error", res.error || "Gagal menambahkan mitra kerja.");
        }
      } else if (modalMode === "edit" && editingPartner) {
        const res = await updatePartnerAction({
          id: editingPartner.id,
          name: formState.name.trim(),
          shortName: formState.shortName.trim(),
          category: finalCategory || null,
          websiteUrl: formState.websiteUrl.trim() || null,
          logoPath: formState.logoPath,
          isActive: formState.isActive,
        });

        if (res.success && res.data) {
          setPartners((prev) =>
            prev.map((p) => (p.id === editingPartner.id ? res.data! : p)).sort((a, b) => a.order - b.order)
          );
          setIsModalOpen(false);
          showNotification("success", `Mitra "${res.data.shortName}" berhasil diperbarui.`);
        } else {
          showNotification("error", res.error || "Gagal memperbarui mitra kerja.");
        }
      }
    } catch {
      showNotification("error", "Terjadi kesalahan tidak terduga saat menyimpan data.");
    } finally {
      setIsSubmittingForm(false);
    }
  };

  const handleToggleActive = async (partner: PartnerItem) => {
    setTogglingId(partner.id);
    try {
      const res = await togglePartnerActiveAction(partner.id);
      if (res.success && res.data) {
        setPartners((prev) =>
          prev.map((p) => (p.id === partner.id ? { ...p, isActive: res.data!.isActive } : p))
        );
        showNotification(
          "success",
          res.data.isActive
            ? `Mitra "${partner.shortName}" diaktifkan.`
            : `Mitra "${partner.shortName}" dinonaktifkan.`
        );
      } else {
        showNotification("error", res.error || "Gagal mengubah status mitra.");
      }
    } catch {
      showNotification("error", "Gagal memperbarui status aktif mitra.");
    } finally {
      setTogglingId(null);
    }
  };

  const handleMoveOrder = async (partnerId: string, direction: "up" | "down") => {
    const currentIndex = partners.findIndex((p) => p.id === partnerId);
    if (currentIndex === -1) return;

    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= partners.length) return;

    const reordered = [...partners];
    const [movedItem] = reordered.splice(currentIndex, 1);
    reordered.splice(targetIndex, 0, movedItem);

    const reorderedWithNumbers = reordered.map((item, idx) => ({
      ...item,
      order: idx + 1,
    }));

    setPartners(reorderedWithNumbers);
    setIsReordering(true);

    try {
      const orderedIds = reorderedWithNumbers.map((p) => p.id);
      const res = await reorderPartnersAction(orderedIds);
      if (res.success) {
        showNotification("success", "Urutan mitra kerja berhasil diperbarui.");
      } else {
        showNotification("error", res.error || "Gagal menyimpan urutan baru.");
        const refresh = await getPartnersAction();
        if (refresh.success && refresh.data) {
          setPartners(refresh.data);
        }
      }
    } catch {
      showNotification("error", "Terjadi kegagalan koneksi saat mengurutkan mitra.");
      const refresh = await getPartnersAction();
      if (refresh.success && refresh.data) {
        setPartners(refresh.data);
      }
    } finally {
      setIsReordering(false);
    }
  };

  const handleDeletePartner = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      const res = await deletePartnerAction(deleteTarget.id);
      if (res.success) {
        setPartners((prev) => prev.filter((p) => p.id !== deleteTarget.id));
        showNotification("success", `Mitra "${deleteTarget.shortName}" berhasil dihapus.`);
        setDeleteTarget(null);
      } else {
        showNotification("error", res.error || "Gagal menghapus data mitra.");
      }
    } catch {
      showNotification("error", "Terjadi kesalahan saat menghapus mitra.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AdminDashboardShell
      profile={profile}
      activeItemId="partners"
      pageTitle="Mitra Kerja & Afiliasi"
      pageSubtitle="Pengelolaan Lembaga Mitra, Asosiasi Industri, Perbankan, dan Instansi Pemerintah Afiliasi INKINDO BABEL"
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
              <span className="text-xs font-semibold uppercase tracking-wider">Total Mitra</span>
              <Handshake className="w-4 h-4 text-[#D97706]" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-white">
              {totalPartnersCount}
            </div>
            <p className="text-xs text-slate-400 mt-1">Lembaga & instansi mitra</p>
          </div>

          <div className="bg-[#1E293B] border border-slate-700/60 p-4 sm:p-5 rounded-xl shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Mitra Aktif</span>
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-emerald-400">
              {activePartnersCount}
            </div>
            <p className="text-xs text-slate-400 mt-1">Ditampilkan di beranda</p>
          </div>

          <div className="bg-[#1E293B] border border-slate-700/60 p-4 sm:p-5 rounded-xl shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Kategori</span>
              <Building2 className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-slate-200">
              {uniqueCategories.length}
            </div>
            <p className="text-xs text-slate-400 mt-1">Klasifikasi mitra</p>
          </div>

          <div className="bg-[#1E293B] border border-slate-700/60 p-4 sm:p-5 rounded-xl shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Memiliki Logo</span>
              <Upload className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-slate-200">
              {withLogoCount}
            </div>
            <p className="text-xs text-slate-400 mt-1">Logo resmi tersimpan</p>
          </div>
        </div>

        <div className="bg-[#1E293B] border border-slate-700/60 rounded-xl p-4 sm:p-5 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row gap-3 md:items-center justify-between">
            <div className="flex-1 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari nama mitra atau singkatan..."
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

              <div className="flex gap-2">
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
                <span>Tambah Mitra</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-700/80">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-[#0F172A] text-xs uppercase font-semibold text-slate-400 border-b border-slate-700">
                <tr>
                  <th scope="col" className="py-3 px-3 w-16 text-center">Urutan</th>
                  <th scope="col" className="py-3 px-4 w-20 text-center">Logo</th>
                  <th scope="col" className="py-3 px-4">Nama & Singkatan</th>
                  <th scope="col" className="py-3 px-4 hidden md:table-cell">Kategori</th>
                  <th scope="col" className="py-3 px-4 hidden lg:table-cell">Website</th>
                  <th scope="col" className="py-3 px-4 text-center w-28">Status</th>
                  <th scope="col" className="py-3 px-4 text-right w-28">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredPartners.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <Handshake className="w-10 h-10 mx-auto mb-2 text-slate-600 opacity-60" />
                      <p className="font-medium text-base text-slate-300">Tidak ada data mitra kerja.</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {searchQuery || categoryFilter !== "all" || statusFilter !== "all"
                          ? "Coba sesuaikan kata kunci atau filter pencarian Anda."
                          : "Klik tombol 'Tambah Mitra' untuk menambahkan lembaga mitra pertama."}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredPartners.map((partner, index) => {
                    const isFirst = index === 0;
                    const isLast = index === filteredPartners.length - 1;

                    return (
                      <tr
                        key={partner.id}
                        className="hover:bg-slate-800/50 transition-colors group"
                      >
                        <td className="py-3 px-3 text-center">
                          <div className="flex flex-col items-center justify-center gap-0.5">
                            <span className="font-mono text-xs font-semibold text-slate-400 mb-0.5">
                              #{partner.order}
                            </span>
                            <div className="flex items-center gap-0.5">
                              <button
                                type="button"
                                onClick={() => handleMoveOrder(partner.id, "up")}
                                disabled={isFirst || isReordering}
                                className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white disabled:opacity-20 disabled:hover:bg-transparent"
                                title="Geser Naik"
                              >
                                <ChevronUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMoveOrder(partner.id, "down")}
                                disabled={isLast || isReordering}
                                className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white disabled:opacity-20 disabled:hover:bg-transparent"
                                title="Geser Turun"
                              >
                                <ChevronDown className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-center">
                          <div className="w-14 h-12 mx-auto rounded-lg bg-[#0F172A] border border-slate-700/80 flex items-center justify-center overflow-hidden p-1.5">
                            {partner.logoPath ? (
                              <Image
                                src={partner.logoPath}
                                alt={partner.name}
                                width={56}
                                height={48}
                                className="max-h-full max-w-full object-contain"
                              />
                            ) : (
                              <div className="flex flex-col items-center justify-center text-[10px] font-bold text-slate-400">
                                <Building2 className="w-4 h-4 mb-0.5 text-slate-500" />
                                <span>{partner.shortName.slice(0, 3)}</span>
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-semibold text-white group-hover:text-[#D97706] transition-colors">
                            {partner.name}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="inline-block px-1.5 py-0.5 bg-slate-800 text-slate-300 font-mono text-[11px] rounded border border-slate-700">
                              {partner.shortName}
                            </span>
                            <span className="text-xs text-slate-400 md:hidden">
                              • {partner.category || "Tanpa Kategori"}
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-4 hidden md:table-cell">
                          {partner.category ? (
                            <span className="inline-block px-2.5 py-1 bg-slate-800/80 border border-slate-700/60 rounded-full text-xs text-slate-300">
                              {partner.category}
                            </span>
                          ) : (
                            <span className="text-slate-500 italic text-xs">Belum dikategorikan</span>
                          )}
                        </td>

                        <td className="py-3 px-4 hidden lg:table-cell">
                          {partner.websiteUrl ? (
                            <a
                              href={partner.websiteUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs text-[#D97706] hover:underline max-w-[200px] truncate"
                              title={partner.websiteUrl}
                            >
                              <Globe className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">{partner.websiteUrl.replace(/^https?:\/\//i, "")}</span>
                              <ExternalLink className="w-3 h-3 shrink-0 opacity-70" />
                            </a>
                          ) : (
                            <span className="text-slate-600 text-xs">-</span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleActive(partner)}
                            disabled={togglingId === partner.id}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
                              partner.isActive
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                                : "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700"
                            }`}
                          >
                            {togglingId === partner.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  partner.isActive ? "bg-emerald-400" : "bg-slate-500"
                                }`}
                              />
                            )}
                            <span>{partner.isActive ? "Aktif" : "Nonaktif"}</span>
                          </button>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(partner)}
                              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                              title="Edit Mitra"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(partner)}
                              className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors"
                              title="Hapus Mitra"
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
              Menampilkan <span className="text-white font-medium">{filteredPartners.length}</span> dari{" "}
              <span className="text-white font-medium">{totalPartnersCount}</span> mitra
            </span>
            <span className="italic text-slate-500">
              Gunakan tombol naik/turun untuk mengatur posisi tampilan di website
            </span>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#1E293B] border border-slate-700 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-slate-700 sticky top-0 bg-[#1E293B] z-10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#D97706]/10 text-[#D97706] rounded-lg">
                  <Handshake className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {modalMode === "create" ? "Tambah Mitra Baru" : `Edit Mitra: ${editingPartner?.shortName}`}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {modalMode === "create"
                      ? "Isi informasi lembaga/instansi mitra untuk ditampilkan pada jaringan kemitraan"
                      : "Perbarui informasi dan logo mitra kerja"}
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
                  Nama Lengkap Mitra <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Kementerian Pekerjaan Umum dan Perumahan Rakyat"
                  value={formState.name}
                  onChange={(e) => setFormState((prev) => ({ ...prev, name: e.target.value }))}
                  className={`w-full bg-[#0F172A] border rounded-lg px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#D97706] ${
                    formErrors.name ? "border-rose-500" : "border-slate-700"
                  }`}
                />
                {formErrors.name && (
                  <p className="text-xs text-rose-400 mt-1">{formErrors.name}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Singkatan / Nama Pendek <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: KEMENTERIAN PUPR"
                    value={formState.shortName}
                    onChange={(e) => setFormState((prev) => ({ ...prev, shortName: e.target.value }))}
                    className={`w-full bg-[#0F172A] border rounded-lg px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#D97706] ${
                      formErrors.shortName ? "border-rose-500" : "border-slate-700"
                    }`}
                  />
                  {formErrors.shortName && (
                    <p className="text-xs text-rose-400 mt-1">{formErrors.shortName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Kategori Mitra
                  </label>
                  <select
                    value={formState.category}
                    onChange={(e) => setFormState((prev) => ({ ...prev, category: e.target.value }))}
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#D97706] cursor-pointer"
                  >
                    {COMMON_PARTNER_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                    <option value="__custom__">+ Kategori Kustom</option>
                  </select>
                </div>
              </div>

              {formState.category === "__custom__" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Nama Kategori Kustom
                  </label>
                  <input
                    type="text"
                    placeholder="Masukkan nama kategori baru..."
                    value={formState.customCategory}
                    onChange={(e) => setFormState((prev) => ({ ...prev, customCategory: e.target.value }))}
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#D97706]"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  URL Website Resmi (Opsional)
                </label>
                <div className="relative">
                  <Globe className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    placeholder="https://pu.go.id"
                    value={formState.websiteUrl}
                    onChange={(e) => setFormState((prev) => ({ ...prev, websiteUrl: e.target.value }))}
                    className={`w-full bg-[#0F172A] border rounded-lg pl-10 pr-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#D97706] ${
                      formErrors.websiteUrl ? "border-rose-500" : "border-slate-700"
                    }`}
                  />
                </div>
                {formErrors.websiteUrl && (
                  <p className="text-xs text-rose-400 mt-1">{formErrors.websiteUrl}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Logo Mitra (Opsional)
                </label>
                <div className="border border-slate-700/80 rounded-xl p-4 bg-[#0F172A] space-y-3">
                  {formState.logoPath ? (
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-16 rounded-lg bg-[#1E293B] border border-slate-700 flex items-center justify-center p-2 overflow-hidden shrink-0">
                        <Image
                          src={formState.logoPath}
                          alt="Preview logo"
                          width={80}
                          height={64}
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-300 truncate">
                          {formState.logoPath}
                        </p>
                        <p className="text-[11px] text-emerald-400 mt-0.5">Logo siap disimpan</p>
                        <div className="flex gap-2 mt-2">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploadingLogo}
                            className="text-xs text-[#D97706] hover:underline disabled:opacity-50"
                          >
                            Ganti Logo
                          </button>
                          <span className="text-slate-600">•</span>
                          <button
                            type="button"
                            onClick={handleRemoveLogo}
                            disabled={isUploadingLogo}
                            className="text-xs text-rose-400 hover:underline disabled:opacity-50"
                          >
                            Hapus Logo
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <Upload className="w-8 h-8 mx-auto text-slate-500 mb-2 opacity-70" />
                      <p className="text-xs text-slate-300 font-medium">Unggah logo mitra dari komputer</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">Format JPEG, PNG, atau WebP (maks. 5 MiB)</p>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingLogo}
                        className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg text-xs font-semibold text-slate-200 transition-colors disabled:opacity-50"
                      >
                        {isUploadingLogo ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Mengunggah...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-3.5 h-3.5" />
                            <span>Pilih Berkas Logo</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleLogoFileSelect}
                    className="hidden"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-3 p-3 bg-[#0F172A] border border-slate-700 rounded-xl cursor-pointer hover:bg-slate-900 transition-colors">
                  <input
                    type="checkbox"
                    checked={formState.isActive}
                    onChange={(e) => setFormState((prev) => ({ ...prev, isActive: e.target.checked }))}
                    className="w-4 h-4 rounded border-slate-700 text-[#D97706] focus:ring-[#D97706] focus:ring-offset-0 bg-[#1E293B]"
                  />
                  <div>
                    <span className="text-sm font-semibold text-white block">Status Aktif</span>
                    <span className="text-xs text-slate-400 block">
                      Tampilkan mitra ini pada seksi Mitra Strategis di halaman website
                    </span>
                  </div>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-700 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isSubmittingForm || isUploadingLogo}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-300 hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingForm || isUploadingLogo}
                  className="inline-flex items-center gap-2 bg-[#D97706] hover:bg-[#B45309] text-white px-5 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 shadow-sm"
                >
                  {isSubmittingForm ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>{modalMode === "create" ? "Simpan Mitra" : "Simpan Perubahan"}</span>
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
              <h4 className="text-lg font-bold text-white">Hapus Mitra Kerja?</h4>
              <p className="text-sm text-slate-300">
                Apakah Anda yakin ingin menghapus data mitra{" "}
                <span className="font-semibold text-white">&ldquo;{deleteTarget.name}&rdquo;</span> (
                {deleteTarget.shortName})?
              </p>
              <p className="text-xs text-slate-400">
                Tindakan ini permanen dan berkas logo terkait akan dibersihkan secara aman jika tidak dipakai oleh mitra lain.
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
                onClick={handleDeletePartner}
                disabled={isDeleting}
                className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <span>Ya, Hapus Mitra</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminDashboardShell>
  );
}
