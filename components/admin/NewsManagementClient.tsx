"use client";

import React, { useState, useTransition, useRef, useMemo } from "react";
import Image from "next/image";
import {
  AdminDashboardShell,
  type AdminProfile,
} from "@/components/admin";
import { logoutAdminAction } from "@/lib/auth/actions";
import {
  type NewsArticleItem,
  type NewsArticlesListResult,
  getNewsArticlesAction,
  createNewsArticleAction,
  updateNewsArticleAction,
  deleteNewsArticleAction,
  toggleNewsPublishAction,
} from "@/lib/admin/news-actions";
import {
  Newspaper,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Globe,
  FileText,
  X,
  Calendar,
  User,
  ImageIcon,
  Upload,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  RefreshCw,
} from "lucide-react";

interface NewsManagementClientProps {
  profile: AdminProfile;
  initialData: NewsArticlesListResult;
}

const DEFAULT_CATEGORIES = [
  "AGENDA RESMI",
  "REGULASI & KEBIJAKAN",
  "WORKSHOP & TEKNIS",
  "PUBLIKASI & RILIS",
  "UMUM",
];

interface FormState {
  title: string;
  slug: string;
  category: string;
  customCategory: string;
  excerpt: string;
  content: string;
  authorName: string;
  coverImagePath: string | null;
  coverImageAlt: string;
  isPublished: boolean;
}

const INITIAL_FORM_STATE: FormState = {
  title: "",
  slug: "",
  category: "AGENDA RESMI",
  customCategory: "",
  excerpt: "",
  content: "",
  authorName: "Sekretariat INKINDO BABEL",
  coverImagePath: null,
  coverImageAlt: "",
  isPublished: false,
};

export function NewsManagementClient({
  profile,
  initialData,
}: NewsManagementClientProps): React.JSX.Element {
  const [, startTransition] = useTransition();

  const [articles, setArticles] = useState<NewsArticleItem[]>(initialData.articles);
  const [totalArticles, setTotalArticles] = useState<number>(initialData.total);
  const [currentPage, setCurrentPage] = useState<number>(initialData.page);
  const [totalPages, setTotalPages] = useState<number>(initialData.totalPages);
  const pageSize = initialData.limit || 10;

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");
  const [isFetchingList, setIsFetchingList] = useState(false);

  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingArticle, setEditingArticle] = useState<NewsArticleItem | null>(null);

  const [formState, setFormState] = useState<FormState>(INITIAL_FORM_STATE);
  const [initialSnapshot, setInitialSnapshot] = useState<string>("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<NewsArticleItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [togglePublishId, setTogglePublishId] = useState<string | null>(null);

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification((prev) => (prev?.message === message ? null : prev));
    }, 5000);
  };

  const handleLogout = () => {
    startTransition(async () => {
      await logoutAdminAction();
    });
  };

  const availableCategories = useMemo(() => {
    const set = new Set<string>(DEFAULT_CATEGORIES);
    articles.forEach((a) => {
      if (a.category) set.add(a.category);
    });
    return Array.from(set);
  }, [articles]);

  const fetchArticlesList = async (
    page = currentPage,
    search = searchQuery,
    category = categoryFilter,
    status = statusFilter
  ) => {
    setIsFetchingList(true);
    try {
      const res = await getNewsArticlesAction({
        page,
        limit: pageSize,
        search: search.trim() || undefined,
        category: category !== "all" ? category : undefined,
        status,
      });

      if (res.success && res.data) {
        setArticles(res.data.articles);
        setTotalArticles(res.data.total);
        setCurrentPage(res.data.page);
        setTotalPages(res.data.totalPages);
      } else {
        showNotification("error", res.error || "Gagal memuat daftar berita.");
      }
    } catch {
      showNotification("error", "Terjadi kesalahan jaringan saat memuat daftar berita.");
    } finally {
      setIsFetchingList(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchArticlesList(1, searchQuery, categoryFilter, statusFilter);
  };

  const handleCategoryFilterChange = (cat: string) => {
    setCategoryFilter(cat);
    fetchArticlesList(1, searchQuery, cat, statusFilter);
  };

  const handleStatusFilterChange = (stat: "all" | "published" | "draft") => {
    setStatusFilter(stat);
    fetchArticlesList(1, searchQuery, categoryFilter, stat);
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setCategoryFilter("all");
    setStatusFilter("all");
    fetchArticlesList(1, "", "all", "all");
  };

  const handleOpenCreateModal = () => {
    setModalMode("create");
    setEditingArticle(null);
    const newForm: FormState = {
      ...INITIAL_FORM_STATE,
      authorName: profile.name || "Sekretariat INKINDO BABEL",
    };
    setFormState(newForm);
    setInitialSnapshot(JSON.stringify(newForm));
    setFormErrors({});
    setSelectedFile(null);
    setPreviewUrl(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (article: NewsArticleItem) => {
    setModalMode("edit");
    setEditingArticle(article);

    const isCustomCat = !DEFAULT_CATEGORIES.includes(article.category);
    const editForm: FormState = {
      title: article.title,
      slug: article.slug,
      category: isCustomCat ? "__custom__" : article.category,
      customCategory: isCustomCat ? article.category : "",
      excerpt: article.excerpt,
      content: article.content,
      authorName: article.authorName,
      coverImagePath: article.coverImagePath,
      coverImageAlt: article.coverImageAlt || "",
      isPublished: article.isPublished,
    };

    setFormState(editForm);
    setInitialSnapshot(JSON.stringify(editForm));
    setFormErrors({});
    setSelectedFile(null);
    setPreviewUrl(article.coverImagePath);
    setIsModalOpen(true);
  };

  const hasUnsavedChanges = useMemo(() => {
    if (!isModalOpen) return false;
    if (selectedFile !== null) return true;
    return JSON.stringify(formState) !== initialSnapshot;
  }, [isModalOpen, formState, initialSnapshot, selectedFile]);

  const handleCloseModal = () => {
    if (hasUnsavedChanges) {
      const confirmDiscard = window.confirm(
        "Terdapat perubahan yang belum disimpan pada formulir. Yakin ingin membatalkan dan keluar?"
      );
      if (!confirmDiscard) return;
    }
    setIsModalOpen(false);
    setSelectedFile(null);
    setPreviewUrl(null);
    setFormErrors({});
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showNotification("error", "Ukuran gambar melebihi batas maksimum 5 MB.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      showNotification("error", "Format berkas harus JPEG, PNG, atau WebP.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleRemoveCover = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setFormState((prev) => ({
      ...prev,
      coverImagePath: null,
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formState.title.trim()) {
      errors.title = "Judul berita wajib diisi.";
    } else if (formState.title.trim().length > 200) {
      errors.title = "Judul berita maksimal 200 karakter.";
    }

    const finalCategory =
      formState.category === "__custom__"
        ? formState.customCategory.trim()
        : formState.category.trim();

    if (!finalCategory) {
      errors.category = "Kategori berita wajib dipilih atau diisi.";
    }

    if (!formState.excerpt.trim()) {
      errors.excerpt = "Ringkasan berita wajib diisi.";
    } else if (formState.excerpt.trim().length > 500) {
      errors.excerpt = "Ringkasan maksimal 500 karakter.";
    }

    if (!formState.content.trim()) {
      errors.content = "Isi artikel berita wajib diisi.";
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
    let resolvedCoverPath = formState.coverImagePath;

    if (selectedFile) {
      setIsUploadingImage(true);
      try {
        const formData = new FormData();
        formData.append("file", selectedFile);

        const uploadRes = await fetch("/api/admin/news-upload", {
          method: "POST",
          body: formData,
        });

        const uploadJson = await uploadRes.json();
        if (!uploadRes.ok || !uploadJson.success) {
          showNotification("error", uploadJson.error || "Gagal mengunggah berkas gambar.");
          setIsSubmittingForm(false);
          setIsUploadingImage(false);
          return;
        }

        resolvedCoverPath = uploadJson.data.publicPath;
      } catch {
        showNotification("error", "Kegagalan koneksi jaringan saat mengunggah gambar.");
        setIsSubmittingForm(false);
        setIsUploadingImage(false);
        return;
      } finally {
        setIsUploadingImage(false);
      }
    }

    const finalCategory =
      formState.category === "__custom__"
        ? formState.customCategory.trim().toUpperCase()
        : formState.category.trim().toUpperCase();

    try {
      if (modalMode === "create") {
        const res = await createNewsArticleAction({
          title: formState.title.trim(),
          slug: formState.slug.trim() || undefined,
          category: finalCategory,
          excerpt: formState.excerpt.trim(),
          content: formState.content.trim(),
          authorName: formState.authorName.trim() || profile.name || "Sekretariat INKINDO BABEL",
          coverImagePath: resolvedCoverPath,
          coverImageAlt: formState.coverImageAlt.trim() || undefined,
          isPublished: formState.isPublished,
        });

        if (res.success && res.data) {
          showNotification("success", "Berita baru berhasil ditambahkan!");
          setIsModalOpen(false);
          fetchArticlesList(1, searchQuery, categoryFilter, statusFilter);
        } else {
          showNotification("error", res.error || "Gagal menyimpan artikel berita.");
        }
      } else if (modalMode === "edit" && editingArticle) {
        const res = await updateNewsArticleAction({
          id: editingArticle.id,
          title: formState.title.trim(),
          slug: formState.slug.trim() || undefined,
          category: finalCategory,
          excerpt: formState.excerpt.trim(),
          content: formState.content.trim(),
          authorName: formState.authorName.trim() || profile.name,
          coverImagePath: resolvedCoverPath,
          coverImageAlt: formState.coverImageAlt.trim() || undefined,
          isPublished: formState.isPublished,
        });

        if (res.success && res.data) {
          showNotification("success", "Artikel berita berhasil diperbarui!");
          setIsModalOpen(false);
          fetchArticlesList(currentPage, searchQuery, categoryFilter, statusFilter);
        } else {
          showNotification("error", res.error || "Gagal memperbarui artikel berita.");
        }
      }
    } catch {
      showNotification("error", "Terjadi kesalahan internal saat menyimpan artikel.");
    } finally {
      setIsSubmittingForm(false);
    }
  };

  const handleTogglePublish = async (article: NewsArticleItem) => {
    setTogglePublishId(article.id);
    try {
      const res = await toggleNewsPublishAction(article.id);
      if (res.success && res.data) {
        const updated = res.data;
        setArticles((prev) =>
          prev.map((a) => (a.id === updated.id ? { ...a, ...updated } : a))
        );
        showNotification(
          "success",
          updated.isPublished
            ? `Berita '${article.title}' berhasil dipublikasikan!`
            : `Berita '${article.title}' kini disimpan sebagai draft.`
        );
      } else {
        showNotification("error", res.error || "Gagal mengubah status publikasi.");
      }
    } catch {
      showNotification("error", "Terjadi kesalahan koneksi saat mengubah status publikasi.");
    } finally {
      setTogglePublishId(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      const res = await deleteNewsArticleAction(deleteTarget.id);
      if (res.success) {
        showNotification("success", `Berita '${deleteTarget.title}' berhasil dihapus.`);
        setDeleteTarget(null);
        fetchArticlesList(currentPage, searchQuery, categoryFilter, statusFilter);
      } else {
        showNotification("error", res.error || "Gagal menghapus berita.");
      }
    } catch {
      showNotification("error", "Terjadi kesalahan saat menghapus berita.");
    } finally {
      setIsDeleting(false);
    }
  };

  const publishedCount = useMemo(
    () => articles.filter((a) => a.isPublished).length,
    [articles]
  );
  const draftCount = useMemo(
    () => articles.filter((a) => !a.isPublished).length,
    [articles]
  );

  return (
    <AdminDashboardShell
      profile={profile}
      activeItemId="news"
      pageTitle="Berita & Publikasi"
      pageSubtitle="Kelola berita, agenda kegiatan, siaran pers, dan publikasi resmi INKINDO BABEL"
      onLogout={handleLogout}
      headerActions={
        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#D97706] hover:bg-[#B45309] text-white shadow-xs transition-colors cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500"
        >
          <Plus className="w-4 h-4" />
          <span>Tulis Berita Baru</span>
        </button>
      }
    >
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {notification && (
          <div
            className={`p-4 rounded-xl border flex items-start gap-3 transition-all ${
              notification.type === "success"
                ? "bg-emerald-950/40 border-emerald-800 text-emerald-200"
                : "bg-red-950/40 border-red-800 text-red-200"
            }`}
          >
            {notification.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 text-xs font-medium leading-relaxed">
              {notification.message}
            </div>
            <button
              type="button"
              onClick={() => setNotification(null)}
              className="p-1 rounded-md hover:bg-slate-800/60 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-[#1E293B] border border-slate-700/80 rounded-xl p-4 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-medium tracking-wide uppercase">Total Berita</span>
              <Newspaper className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-bold text-slate-100">{totalArticles}</div>
            <div className="text-[11px] text-slate-400 mt-1">Keseluruhan artikel di sistem</div>
          </div>

          <div className="bg-[#1E293B] border border-slate-700/80 rounded-xl p-4 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-medium tracking-wide uppercase">Diterbitkan</span>
              <Globe className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-emerald-400">
              {statusFilter === "all" ? publishedCount : statusFilter === "published" ? totalArticles : 0}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Tayang di portal publik</div>
          </div>

          <div className="bg-[#1E293B] border border-slate-700/80 rounded-xl p-4 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-medium tracking-wide uppercase">Draft</span>
              <FileText className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-amber-400">
              {statusFilter === "all" ? draftCount : statusFilter === "draft" ? totalArticles : 0}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Belum dipublikasikan</div>
          </div>

          <div className="bg-[#1E293B] border border-slate-700/80 rounded-xl p-4 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-medium tracking-wide uppercase">Kategori</span>
              <Filter className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-bold text-slate-100">{availableCategories.length}</div>
            <div className="text-[11px] text-slate-400 mt-1">Kanal topik aktif</div>
          </div>
        </div>

        <div className="bg-[#1E293B] border border-slate-700/80 rounded-xl p-4 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari judul atau slug berita..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#0F172A] border border-slate-700 text-slate-200 text-xs rounded-lg pl-9 pr-8 py-2 placeholder-slate-500 focus:outline-hidden focus:border-[#D97706] focus:ring-1 focus:ring-[#D97706] transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    fetchArticlesList(1, "", categoryFilter, statusFilter);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </form>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <select
                  value={categoryFilter}
                  onChange={(e) => handleCategoryFilterChange(e.target.value)}
                  className="bg-[#0F172A] border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 pr-8 focus:outline-hidden focus:border-[#D97706] cursor-pointer appearance-none"
                >
                  <option value="all">Semua Kategori</option>
                  {availableCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <Filter className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              <div className="inline-flex rounded-lg bg-[#0F172A] p-0.5 border border-slate-700">
                <button
                  type="button"
                  onClick={() => handleStatusFilterChange("all")}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    statusFilter === "all"
                      ? "bg-[#D97706] text-white shadow-xs"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Semua
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusFilterChange("published")}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    statusFilter === "published"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Published
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusFilterChange("draft")}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    statusFilter === "draft"
                      ? "bg-amber-600 text-white shadow-xs"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Draft
                </button>
              </div>

              <button
                type="button"
                onClick={handleResetFilters}
                title="Muat ulang dan reset filter"
                className="p-2 rounded-lg border border-slate-700 bg-[#0F172A] text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isFetchingList ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-800 bg-[#0F172A]">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#14213d]/60 text-slate-400 font-semibold border-b border-slate-800 uppercase text-[10px] tracking-wider">
                <tr>
                  <th scope="col" className="px-4 py-3 w-16">
                    Sampul
                  </th>
                  <th scope="col" className="px-4 py-3 min-w-[280px]">
                    Judul & Slug Berita
                  </th>
                  <th scope="col" className="px-4 py-3 w-40">
                    Kategori
                  </th>
                  <th scope="col" className="px-4 py-3 w-36">
                    Penulis
                  </th>
                  <th scope="col" className="px-4 py-3 w-32">
                    Tanggal
                  </th>
                  <th scope="col" className="px-4 py-3 w-28 text-center">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-3 w-36 text-right">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {isFetchingList ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 className="w-6 h-6 animate-spin text-[#D97706]" />
                        <span>Memuat data artikel berita...</span>
                      </div>
                    </td>
                  </tr>
                ) : articles.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-3 max-w-sm mx-auto">
                        <div className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center text-slate-500">
                          <Newspaper className="w-6 h-6" />
                        </div>
                        <div className="font-semibold text-slate-200">Tidak ada berita ditemukan</div>
                        <div className="text-[11px] text-slate-400">
                          {searchQuery || categoryFilter !== "all" || statusFilter !== "all"
                            ? "Coba ubah kata kunci atau setelan filter pencarian Anda."
                            : "Belum ada berita yang ditambahkan ke sistem database."}
                        </div>
                        {searchQuery || categoryFilter !== "all" || statusFilter !== "all" ? (
                          <button
                            type="button"
                            onClick={handleResetFilters}
                            className="text-xs px-3 py-1.5 rounded-md bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors"
                          >
                            Reset Filter
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={handleOpenCreateModal}
                            className="text-xs px-3.5 py-1.5 rounded-md bg-[#D97706] text-white hover:bg-[#B45309] transition-colors"
                          >
                            Tulis Berita Pertama
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  articles.map((item) => {
                    const isToggling = togglePublishId === item.id;
                    const dateFormatted = item.publishedAt
                      ? new Date(item.publishedAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : new Date(item.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        });

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-800/40 transition-colors group"
                      >
                        <td className="px-4 py-3 align-middle">
                          <div className="w-12 h-10 rounded-md bg-slate-800 border border-slate-700/80 overflow-hidden relative shrink-0 flex items-center justify-center">
                            {item.coverImagePath ? (
                              <Image
                                src={item.coverImagePath}
                                alt={item.coverImageAlt || item.title}
                                fill
                                className="object-cover"
                                sizes="48px"
                              />
                            ) : (
                              <ImageIcon className="w-4 h-4 text-slate-500" />
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-3 align-middle">
                          <div className="font-semibold text-slate-100 group-hover:text-amber-400 transition-colors line-clamp-1">
                            {item.title}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono line-clamp-1 mt-0.5">
                            /{item.slug}
                          </div>
                        </td>

                        <td className="px-4 py-3 align-middle">
                          <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold tracking-wide bg-slate-800 text-amber-400 border border-slate-700">
                            {item.category}
                          </span>
                        </td>

                        <td className="px-4 py-3 align-middle text-slate-300">
                          <div className="flex items-center gap-1.5 truncate max-w-[130px]" title={item.authorName}>
                            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{item.authorName}</span>
                          </div>
                        </td>

                        <td className="px-4 py-3 align-middle text-slate-300">
                          <div className="flex items-center gap-1.5 text-[11px]">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{dateFormatted}</span>
                          </div>
                        </td>

                        <td className="px-4 py-3 align-middle text-center">
                          {item.isPublished ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/80">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                              Published
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-950/60 text-amber-400 border border-amber-800/80">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                              Draft
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3 align-middle text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleTogglePublish(item)}
                              disabled={isToggling}
                              title={item.isPublished ? "Tarik ke status Draft" : "Publikasikan ke Website"}
                              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                                item.isPublished
                                  ? "text-emerald-400 hover:bg-emerald-950/50 hover:text-emerald-300"
                                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                              } ${isToggling ? "opacity-50 cursor-not-allowed" : ""}`}
                            >
                              {isToggling ? (
                                <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                              ) : item.isPublished ? (
                                <Eye className="w-4 h-4" />
                              ) : (
                                <EyeOff className="w-4 h-4" />
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(item)}
                              title="Edit rincian berita"
                              className="p-1.5 rounded-md text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors cursor-pointer"
                            >
                              <Edit className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => setDeleteTarget(item)}
                              title="Hapus artikel berita"
                              className="p-1.5 rounded-md text-slate-400 hover:text-red-400 hover:bg-red-950/40 transition-colors cursor-pointer"
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

          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-slate-400">
              <div>
                Menampilkan halaman <span className="font-semibold text-slate-200">{currentPage}</span> dari{" "}
                <span className="font-semibold text-slate-200">{totalPages}</span> (Total {totalArticles} berita)
              </div>
              <div className="inline-flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={currentPage <= 1 || isFetchingList}
                  onClick={() => fetchArticlesList(currentPage - 1, searchQuery, categoryFilter, statusFilter)}
                  className="px-2.5 py-1.5 rounded-md border border-slate-700 bg-[#0F172A] text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    type="button"
                    disabled={isFetchingList}
                    onClick={() => fetchArticlesList(p, searchQuery, categoryFilter, statusFilter)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      currentPage === p
                        ? "bg-[#D97706] text-white font-semibold"
                        : "border border-slate-700 bg-[#0F172A] text-slate-300 hover:text-white hover:bg-slate-800"
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={currentPage >= totalPages || isFetchingList}
                  onClick={() => fetchArticlesList(currentPage + 1, searchQuery, categoryFilter, statusFilter)}
                  className="px-2.5 py-1.5 rounded-md border border-slate-700 bg-[#0F172A] text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
          <div className="bg-[#1E293B] border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-700/80 flex items-center justify-between shrink-0 bg-[#0F172A]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-[#D97706]">
                  {modalMode === "create" ? <Plus className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">
                    {modalMode === "create" ? "Tambah Artikel Berita Baru" : "Edit Rincian Artikel Berita"}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {modalMode === "create"
                      ? "Isi formulir lengkap untuk mempublikasikan artikel ke portal berita"
                      : "Perbarui informasi, konten, atau gambar sampul berita"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={isSubmittingForm}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="flex-1 overflow-y-auto p-6 space-y-5">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="news-title" className="text-xs font-semibold text-slate-200">
                    Judul Berita <span className="text-red-400">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400">
                    {formState.title.length}/200 karakter
                  </span>
                </div>
                <input
                  id="news-title"
                  type="text"
                  maxLength={200}
                  placeholder="Contoh: Musyawarah Provinsi INKINDO BABEL 2026..."
                  value={formState.title}
                  onChange={(e) => {
                    setFormState((prev) => ({ ...prev, title: e.target.value }));
                    if (formErrors.title) {
                      setFormErrors((prev) => ({ ...prev, title: "" }));
                    }
                  }}
                  className={`w-full bg-[#0F172A] border ${
                    formErrors.title ? "border-red-500 ring-1 ring-red-500" : "border-slate-700"
                  } text-slate-100 text-xs rounded-lg px-3.5 py-2.5 placeholder-slate-500 focus:outline-hidden focus:border-[#D97706] focus:ring-1 focus:ring-[#D97706] transition-colors`}
                />
                {formErrors.title && (
                  <p className="text-[11px] text-red-400 font-medium">{formErrors.title}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="news-slug" className="text-xs font-semibold text-slate-200">
                    Slug URL <span className="text-slate-400 font-normal">(Opsional)</span>
                  </label>
                  <input
                    id="news-slug"
                    type="text"
                    placeholder="otomatis-dari-judul-jika-kosong"
                    value={formState.slug}
                    onChange={(e) =>
                      setFormState((prev) => ({
                        ...prev,
                        slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
                      }))
                    }
                    className="w-full bg-[#0F172A] border border-slate-700 text-slate-100 text-xs rounded-lg px-3.5 py-2.5 placeholder-slate-500 focus:outline-hidden focus:border-[#D97706] font-mono transition-colors"
                  />
                  <p className="text-[10px] text-slate-400">
                    Dikosongkan agar otomatis dibuat unik dari judul.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="news-category" className="text-xs font-semibold text-slate-200">
                    Kategori Berita <span className="text-red-400">*</span>
                  </label>
                  <select
                    id="news-category"
                    value={formState.category}
                    onChange={(e) => {
                      setFormState((prev) => ({ ...prev, category: e.target.value }));
                      if (formErrors.category) {
                        setFormErrors((prev) => ({ ...prev, category: "" }));
                      }
                    }}
                    className={`w-full bg-[#0F172A] border ${
                      formErrors.category ? "border-red-500" : "border-slate-700"
                    } text-slate-100 text-xs rounded-lg px-3.5 py-2.5 focus:outline-hidden focus:border-[#D97706] cursor-pointer`}
                  >
                    {DEFAULT_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                    <option value="__custom__">+ Kategori Kustom / Baru</option>
                  </select>

                  {formState.category === "__custom__" && (
                    <input
                      type="text"
                      placeholder="Ketik nama kategori baru..."
                      value={formState.customCategory}
                      onChange={(e) =>
                        setFormState((prev) => ({
                          ...prev,
                          customCategory: e.target.value,
                        }))
                      }
                      className="w-full mt-2 bg-[#0F172A] border border-slate-700 text-slate-100 text-xs rounded-lg px-3.5 py-2 placeholder-slate-500 focus:outline-hidden focus:border-[#D97706]"
                    />
                  )}
                  {formErrors.category && (
                    <p className="text-[11px] text-red-400 font-medium">{formErrors.category}</p>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="news-excerpt" className="text-xs font-semibold text-slate-200">
                    Ringkasan Berita (Excerpt) <span className="text-red-400">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400">
                    {formState.excerpt.length}/500 karakter
                  </span>
                </div>
                <textarea
                  id="news-excerpt"
                  rows={3}
                  maxLength={500}
                  placeholder="Ringkasan singkat yang akan ditampilkan pada daftar berita dan preview kartu..."
                  value={formState.excerpt}
                  onChange={(e) => {
                    setFormState((prev) => ({ ...prev, excerpt: e.target.value }));
                    if (formErrors.excerpt) {
                      setFormErrors((prev) => ({ ...prev, excerpt: "" }));
                    }
                  }}
                  className={`w-full bg-[#0F172A] border ${
                    formErrors.excerpt ? "border-red-500 ring-1 ring-red-500" : "border-slate-700"
                  } text-slate-100 text-xs rounded-lg px-3.5 py-2.5 placeholder-slate-500 focus:outline-hidden focus:border-[#D97706] focus:ring-1 focus:ring-[#D97706] transition-colors resize-y`}
                />
                {formErrors.excerpt && (
                  <p className="text-[11px] text-red-400 font-medium">{formErrors.excerpt}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="news-content" className="text-xs font-semibold text-slate-200">
                  Isi Artikel Lengkap <span className="text-red-400">*</span>
                </label>
                <textarea
                  id="news-content"
                  rows={8}
                  placeholder="Tuliskan isi naskah berita secara lengkap di sini. Mendukung pemisahan paragraf bertingkat..."
                  value={formState.content}
                  onChange={(e) => {
                    setFormState((prev) => ({ ...prev, content: e.target.value }));
                    if (formErrors.content) {
                      setFormErrors((prev) => ({ ...prev, content: "" }));
                    }
                  }}
                  className={`w-full bg-[#0F172A] border ${
                    formErrors.content ? "border-red-500 ring-1 ring-red-500" : "border-slate-700"
                  } text-slate-100 text-xs rounded-lg px-3.5 py-2.5 placeholder-slate-500 focus:outline-hidden focus:border-[#D97706] focus:ring-1 focus:ring-[#D97706] transition-colors resize-y leading-relaxed font-sans`}
                />
                {formErrors.content && (
                  <p className="text-[11px] text-red-400 font-medium">{formErrors.content}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="news-author" className="text-xs font-semibold text-slate-200">
                    Nama Penulis / Redaksi
                  </label>
                  <input
                    id="news-author"
                    type="text"
                    placeholder="Sekretariat INKINDO BABEL"
                    value={formState.authorName}
                    onChange={(e) =>
                      setFormState((prev) => ({ ...prev, authorName: e.target.value }))
                    }
                    className="w-full bg-[#0F172A] border border-slate-700 text-slate-100 text-xs rounded-lg px-3.5 py-2.5 placeholder-slate-500 focus:outline-hidden focus:border-[#D97706]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="news-image-alt" className="text-xs font-semibold text-slate-200">
                    Teks Alternatif Gambar (Alt)
                  </label>
                  <input
                    id="news-image-alt"
                    type="text"
                    placeholder="Deskripsi foto untuk aksesibilitas..."
                    value={formState.coverImageAlt}
                    onChange={(e) =>
                      setFormState((prev) => ({ ...prev, coverImageAlt: e.target.value }))
                    }
                    className="w-full bg-[#0F172A] border border-slate-700 text-slate-100 text-xs rounded-lg px-3.5 py-2.5 placeholder-slate-500 focus:outline-hidden focus:border-[#D97706]"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-1 border-t border-slate-800">
                <label className="text-xs font-semibold text-slate-200 block">
                  Gambar Sampul (Thumbnail & Header)
                </label>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-[#0F172A] border border-slate-700/80 rounded-xl p-3.5">
                  <div className="w-24 h-20 rounded-lg bg-slate-800 border border-slate-700 overflow-hidden relative shrink-0 flex items-center justify-center">
                    {previewUrl ? (
                      <Image
                        src={previewUrl}
                        alt="Preview Sampul"
                        fill
                        className="object-cover"
                        sizes="96px"
                      />
                    ) : (
                      <ImageIcon className="w-7 h-7 text-slate-500" />
                    )}
                  </div>

                  <div className="flex-1 space-y-2 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleFileChange}
                        className="hidden"
                        id="news-file-input"
                      />
                      <label
                        htmlFor="news-file-input"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 cursor-pointer transition-colors"
                      >
                        <Upload className="w-3.5 h-3.5 text-amber-400" />
                        <span>{previewUrl ? "Ganti Gambar" : "Pilih Gambar"}</span>
                      </label>

                      {previewUrl && (
                        <button
                          type="button"
                          onClick={handleRemoveCover}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-950/40 border border-red-900/60 transition-colors"
                        >
                          Hapus Gambar
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Format: JPEG, PNG, atau WebP. Maksimal ukuran 5 MB. Resolusi rekomendasi 1200x630 px.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formState.isPublished}
                    onChange={(e) =>
                      setFormState((prev) => ({ ...prev, isPublished: e.target.checked }))
                    }
                    className="w-4 h-4 rounded-sm border-slate-700 bg-[#0F172A] text-[#D97706] focus:ring-[#D97706] cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-semibold text-slate-200 block">
                      Publikasikan Berita Sekarang
                    </span>
                    <span className="text-[11px] text-slate-400 block">
                      Jika dicentang, berita akan langsung tayang di portal publik INKINDO BABEL. Jika tidak, akan disimpan sebagai Draft.
                    </span>
                  </div>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isSubmittingForm}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingForm || isUploadingImage}
                  className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold rounded-lg bg-[#D97706] hover:bg-[#B45309] text-white shadow-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmittingForm ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{isUploadingImage ? "Mengunggah Gambar..." : "Menyimpan Artikel..."}</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{modalMode === "create" ? "Simpan Berita" : "Perbarui Berita"}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-[#1E293B] border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-950/60 border border-red-800/80 flex items-center justify-center text-red-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100">Konfirmasi Hapus Berita</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Tindakan ini permanen dan tidak dapat dibatalkan.
                </p>
              </div>
            </div>

            <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-3.5 space-y-1.5">
              <div className="text-[11px] text-slate-400">Judul Artikel:</div>
              <div className="text-xs font-semibold text-slate-200 line-clamp-2">
                {deleteTarget.title}
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                Slug: /{deleteTarget.slug}
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Seluruh data berita dan file gambar sampul terkait akan dibersihkan dari server jika tidak digunakan oleh artikel lain.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-red-600 hover:bg-red-700 text-white shadow-xs transition-colors disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Ya, Hapus Berita</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminDashboardShell>
  );
}
