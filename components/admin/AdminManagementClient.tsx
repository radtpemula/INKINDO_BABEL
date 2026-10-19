// components/admin/AdminManagementClient.tsx
// Comprehensive client component for /babel-and-adt/admin
// Features: List with search/filter, Add admin modal, Edit admin modal, Reset password modal,
// and Confirm toggle active modal.
// Full responsive design in institutional slate palette (#0F172A, #1E293B, #D97706).

"use client";

import React, { useState, useTransition } from "react";
import {
  AdminDashboardShell,
  type AdminProfile,
} from "@/components/admin";
import { logoutAdminAction } from "@/lib/auth/actions";
import {
  type AdminUserListItem,
  createAdminUserAction,
  updateAdminUserAction,
  toggleAdminActiveAction,
  resetAdminPasswordAction,
} from "@/lib/admin/actions";
import {
  Users,
  UserPlus,
  Shield,
  ShieldCheck,
  Search,
  CheckCircle2,
  KeyRound,
  Edit,
  Power,
  AlertTriangle,
  X,
  Loader2,
  Lock,
  User,
  Mail,
  Calendar,
  Clock,
  Eye,
  EyeOff,
} from "lucide-react";

interface AdminManagementClientProps {
  profile: AdminProfile;
  initialAdminList: AdminUserListItem[];
}

export function AdminManagementClient({
  profile,
  initialAdminList,
}: AdminManagementClientProps): React.JSX.Element {
  const [adminList, setAdminList] = useState<AdminUserListItem[]>(initialAdminList);
  const [searchQuery, setSearchQuery] = useState("");
  const [, startTransition] = useTransition();

  // Notification feedback state
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AdminUserListItem | null>(null);
  const [resetTarget, setResetTarget] = useState<AdminUserListItem | null>(null);
  const [toggleTarget, setToggleTarget] = useState<AdminUserListItem | null>(null);

  // Form loading states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Password visibility states
  const [showAddPassword, setShowAddPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);

  // Helper notification dispatcher
  const showNotice = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification((prev) => (prev?.message === message ? null : prev));
    }, 5000);
  };

  // Filter list by searchQuery
  const filteredList = adminList.filter((admin) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      admin.name.toLowerCase().includes(q) ||
      admin.username.toLowerCase().includes(q) ||
      admin.email.toLowerCase().includes(q)
    );
  });

  const activeCount = adminList.filter((a) => a.isActive).length;
  const superAdminCount = adminList.filter((a) => a.role === "SUPER_ADMIN" && a.isActive).length;

  const handleLogout = () => {
    startTransition(async () => {
      await logoutAdminAction();
    });
  };

  // ================= 1. ADD ADMIN HANDLER =================
  const handleAddSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    const formData = new FormData(e.currentTarget);
    const result = await createAdminUserAction(formData);

    setIsSubmitting(false);
    if (!result.success) {
      setFormError(result.error || "Gagal menambahkan akun admin.");
    } else {
      setIsAddOpen(false);
      showNotice("success", result.message || "Admin baru berhasil ditambahkan.");
      const created = result.data as AdminUserListItem | undefined;
      if (created) {
        setAdminList((prev) => [created, ...prev]);
      } else {
        const username = formData.get("username")?.toString().trim() || "";
        const name = formData.get("name")?.toString().trim() || "";
        const email = formData.get("email")?.toString().trim().toLowerCase() || "";
        const role = (formData.get("role")?.toString().trim() || "ADMIN") as "SUPER_ADMIN" | "ADMIN";
        
        const fallbackAdminItem: AdminUserListItem = {
          id: `temp-${Date.now()}`,
          name,
          username,
          email,
          role,
          isActive: true,
          lastLoginAt: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setAdminList((prev) => [fallbackAdminItem, ...prev]);
      }
    }
  };

  // ================= 2. EDIT ADMIN HANDLER =================
  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editTarget) return;

    setIsSubmitting(true);
    setFormError(null);

    const formData = new FormData(e.currentTarget);
    formData.set("id", editTarget.id);

    const result = await updateAdminUserAction(formData);

    setIsSubmitting(false);
    if (!result.success) {
      setFormError(result.error || "Gagal memperbarui data admin.");
    } else {
      const updatedName = formData.get("name")?.toString().trim() || editTarget.name;
      const updatedUsername = formData.get("username")?.toString().trim() || editTarget.username;
      const updatedEmail = formData.get("email")?.toString().trim().toLowerCase() || editTarget.email;
      const updatedRole = (formData.get("role")?.toString().trim() || editTarget.role) as "SUPER_ADMIN" | "ADMIN";

      setAdminList((prev) =>
        prev.map((item) =>
          item.id === editTarget.id
            ? {
                ...item,
                name: updatedName,
                username: updatedUsername,
                email: updatedEmail,
                role: updatedRole,
                updatedAt: new Date().toISOString(),
              }
            : item
        )
      );

      setEditTarget(null);
      showNotice("success", result.message || "Data admin berhasil diperbarui.");
    }
  };

  // ================= 3. RESET PASSWORD HANDLER =================
  const handleResetSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!resetTarget) return;

    setIsSubmitting(true);
    setFormError(null);

    const formData = new FormData(e.currentTarget);
    formData.set("userId", resetTarget.id);

    const result = await resetAdminPasswordAction(formData);

    setIsSubmitting(false);
    if (!result.success) {
      setFormError(result.error || "Gagal mereset kata sandi.");
    } else {
      setResetTarget(null);
      showNotice("success", result.message || "Kata sandi berhasil direset.");
    }
  };

  // ================= 4. TOGGLE ACTIVE HANDLER =================
  const handleConfirmToggle = async () => {
    if (!toggleTarget) return;

    setIsSubmitting(true);
    const result = await toggleAdminActiveAction(toggleTarget.id);
    setIsSubmitting(false);

    if (!result.success) {
      showNotice("error", result.error || "Gagal mengubah status aktif akun.");
    } else {
      setAdminList((prev) =>
        prev.map((item) =>
          item.id === toggleTarget.id
            ? { ...item, isActive: !item.isActive, updatedAt: new Date().toISOString() }
            : item
        )
      );
      showNotice("success", result.message || "Status akun berhasil diperbarui.");
    }

    setToggleTarget(null);
  };

  return (
    <AdminDashboardShell
      profile={profile}
      activeItemId="admins"
      onLogout={handleLogout}
      pageTitle="Manajemen Admin"
      pageSubtitle="Kelola kredensial, peran, dan hak akses administrator INKINDO BABEL"
    >
      {/* Toast Notification Banner */}
      {notification && (
        <div
          role="status"
          className={`mb-6 p-4 rounded-xl border flex items-center justify-between text-xs animate-in fade-in duration-200 ${
            notification.type === "success"
              ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-300"
              : "bg-red-950/40 border-red-500/30 text-red-300"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {notification.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            )}
            <span className="font-medium">{notification.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-slate-200 p-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Akun Admin</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-100">{adminList.length}</span>
            <span className="text-xs text-slate-400 ml-1.5">Terdaftar</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>{activeCount} akun berstatus aktif</span>
          </p>
        </div>

        <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Super Administrator</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-100">{superAdminCount}</span>
            <span className="text-xs text-slate-400 ml-1.5">Akun Aktif</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-400">
            Penjaga hak akses penuh sistem
          </p>
        </div>

        <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Tingkat Keamanan</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Shield className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-sm font-bold text-slate-100">Bcrypt 12 + JWT</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-400">
            Proteksi lockout SUPER_ADMIN aktif
          </p>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-xl shadow-xs overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari berdasarkan nama, username, atau email..."
              className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700/80 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Add Admin CTA Button */}
          <button
            type="button"
            onClick={() => {
              setFormError(null);
              setIsAddOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-900 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 transition-colors cursor-pointer select-none shadow-xs shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tambah Administrator</span>
          </button>
        </div>

        {/* Admin User Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 font-semibold tracking-wider uppercase text-[10px]">
                <th className="py-3.5 px-4 sm:px-6">Administrator</th>
                <th className="py-3.5 px-4">Kontak / Email</th>
                <th className="py-3.5 px-4">Peran (Role)</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 hidden md:table-cell">Terakhir Masuk</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Users className="w-8 h-8 text-slate-600" />
                      <p className="text-xs font-medium">
                        {searchQuery
                          ? `Tidak ditemukan akun admin yang cocok dengan "${searchQuery}".`
                          : "Belum ada administrator terdaftar."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredList.map((admin) => {
                  const isCurrentSelf = admin.id === profile.id;
                  const isSuperAdmin = admin.role === "SUPER_ADMIN";

                  return (
                    <tr
                      key={admin.id}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        !admin.isActive ? "opacity-60 bg-slate-950/20" : ""
                      }`}
                    >
                      {/* Name & Username */}
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs uppercase shrink-0 ${
                              isSuperAdmin
                                ? "bg-amber-500/10 border border-amber-500/30 text-amber-400"
                                : "bg-slate-800 border border-slate-700 text-slate-300"
                            }`}
                          >
                            {admin.name.slice(0, 2)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-100 truncate">
                                {admin.name}
                              </span>
                              {isCurrentSelf && (
                                <span className="px-1.5 py-0.2 text-[9px] font-semibold bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-sm">
                                  Anda
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400 block truncate">
                              @{admin.username}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-4 px-4 text-slate-300">
                        <span className="truncate block max-w-xs">{admin.email}</span>
                      </td>

                      {/* Role Badge */}
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                            isSuperAdmin
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              : "bg-slate-800 text-slate-300 border border-slate-700"
                          }`}
                        >
                          {isSuperAdmin ? (
                            <ShieldCheck className="w-3 h-3 text-amber-400" />
                          ) : (
                            <Shield className="w-3 h-3 text-slate-400" />
                          )}
                          <span>{admin.role}</span>
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            admin.isActive
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-red-500/10 text-red-400 border border-red-500/20"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              admin.isActive ? "bg-emerald-400" : "bg-red-400"
                            }`}
                          />
                          <span>{admin.isActive ? "Aktif" : "Nonaktif"}</span>
                        </span>
                      </td>

                      {/* Last Login & Date Created */}
                      <td className="py-4 px-4 hidden md:table-cell text-slate-400 text-[11px]">
                        <div>
                          {admin.lastLoginAt ? (
                            <div className="flex items-center gap-1 text-slate-300">
                              <Clock className="w-3 h-3 text-slate-500" />
                              <span>{new Date(admin.lastLoginAt).toLocaleDateString("id-ID")}</span>
                            </div>
                          ) : (
                            <span className="text-slate-600">Belum pernah masuk</span>
                          )}
                          <div className="flex items-center gap-1 text-slate-500 text-[10px] mt-0.5">
                            <Calendar className="w-2.5 h-2.5" />
                            <span>Dibuat: {new Date(admin.createdAt).toLocaleDateString("id-ID")}</span>
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right">
                        <div className="inline-flex items-center justify-end gap-1">
                          {/* Edit Details */}
                          <button
                            type="button"
                            onClick={() => {
                              setFormError(null);
                              setEditTarget(admin);
                            }}
                            title="Ubah data administrator"
                            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {/* Reset Password */}
                          <button
                            type="button"
                            onClick={() => {
                              setFormError(null);
                              setResetTarget(admin);
                            }}
                            title="Reset kata sandi"
                            className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>

                          {/* Toggle Active / Deactivate */}
                          <button
                            type="button"
                            onClick={() => setToggleTarget(admin)}
                            disabled={isCurrentSelf}
                            title={
                              isCurrentSelf
                                ? "Anda tidak dapat menonaktifkan akun Anda sendiri"
                                : admin.isActive
                                  ? "Nonaktifkan akun"
                                  : "Aktifkan kembali akun"
                            }
                            className={`p-1.5 rounded-md transition-colors ${
                              isCurrentSelf
                                ? "text-slate-700 cursor-not-allowed opacity-40"
                                : admin.isActive
                                  ? "text-slate-400 hover:text-red-400 hover:bg-red-500/10 cursor-pointer"
                                  : "text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 cursor-pointer"
                            }`}
                          >
                            <Power className="w-3.5 h-3.5" />
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
      </div>

      {/* ================= MODAL 1: TAMBAH ADMINISTRATOR ================= */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-[#0F172A] border border-slate-800 rounded-xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">Tambah Administrator Baru</h3>
                  <p className="text-[11px] text-slate-400">Buat kredensial admin sistem resmi</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-md hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleAddSubmit} className="p-4 sm:p-5 space-y-4">
              {formError && (
                <div className="p-3 rounded-lg bg-red-950/40 border border-red-500/30 text-red-300 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Nama Lengkap</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    name="name"
                    type="text"
                    required
                    placeholder="Contoh: Radithya Pratama"
                    className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Username */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Username</label>
                <input
                  name="username"
                  type="text"
                  required
                  pattern="^[a-zA-Z0-9_-]{3,30}$"
                  title="3-30 karakter alfanumerik, underscore, atau minus"
                  placeholder="Contoh: radith_admin"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-amber-500"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Email Resmi</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    name="email"
                    type="email"
                    required
                    placeholder="Contoh: pengelola@inkindo-babel.org"
                    className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Kata Sandi Awal</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    name="password"
                    type={showAddPassword ? "text" : "password"}
                    required
                    minLength={8}
                    placeholder="Minimal 8 karakter"
                    className="w-full pl-9 pr-10 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAddPassword(!showAddPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer"
                  >
                    {showAddPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Role */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Tingkat Peran (Role)</label>
                <select
                  name="role"
                  defaultValue="ADMIN"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-hidden focus:border-amber-500 cursor-pointer"
                >
                  <option value="ADMIN">ADMIN - Pengelola Konten & Layanan</option>
                  <option value="SUPER_ADMIN">SUPER_ADMIN - Hak Akses Penuh & Manajemen Pengguna</option>
                </select>
              </div>

              {/* Footer Actions */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-slate-900 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Simpan Administrator</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: UBAH DATA ADMINISTRATOR ================= */}
      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-[#0F172A] border border-slate-800 rounded-xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <Edit className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">Ubah Data Administrator</h3>
                  <p className="text-[11px] text-slate-400">@{editTarget.username}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditTarget(null)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-md hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-4 sm:p-5 space-y-4">
              <input type="hidden" name="id" value={editTarget.id} />
              {formError && (
                <div className="p-3 rounded-lg bg-red-950/40 border border-red-500/30 text-red-300 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Nama Lengkap</label>
                <input
                  name="name"
                  type="text"
                  required
                  defaultValue={editTarget.name}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Username</label>
                <input
                  name="username"
                  type="text"
                  required
                  defaultValue={editTarget.username}
                  pattern="^[a-zA-Z0-9_-]{3,30}$"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Email</label>
                <input
                  name="email"
                  type="email"
                  required
                  defaultValue={editTarget.email}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Tingkat Peran (Role)</label>
                <select
                  name="role"
                  defaultValue={editTarget.role}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-hidden focus:border-amber-500 cursor-pointer"
                >
                  <option value="ADMIN">ADMIN - Pengelola Konten & Layanan</option>
                  <option value="SUPER_ADMIN">SUPER_ADMIN - Hak Akses Penuh & Manajemen Pengguna</option>
                </select>
                {editTarget.role === "SUPER_ADMIN" && superAdminCount <= 1 && (
                  <p className="text-[10px] text-amber-400 mt-1">
                    * Peran tidak dapat diturunkan jika akun ini adalah SUPER_ADMIN aktif satu-satunya.
                  </p>
                )}
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditTarget(null)}
                  className="px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-slate-900 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Perbarui Data</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: RESET PASSWORD ================= */}
      {resetTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-[#0F172A] border border-slate-800 rounded-xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">Reset Kata Sandi</h3>
                  <p className="text-[11px] text-slate-400">Untuk akun: @{resetTarget.username}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setResetTarget(null)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-md hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleResetSubmit} className="p-4 sm:p-5 space-y-4">
              <input type="hidden" name="userId" value={resetTarget.id} />
              {formError && (
                <div className="p-3 rounded-lg bg-red-950/40 border border-red-500/30 text-red-300 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Kata Sandi Baru</label>
                <div className="relative">
                  <input
                    name="newPassword"
                    type={showResetPassword ? "text" : "password"}
                    required
                    minLength={8}
                    placeholder="Minimal 8 karakter"
                    className="w-full pl-3 pr-10 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-hidden focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPassword(!showResetPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer"
                  >
                    {showResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Konfirmasi Kata Sandi Baru</label>
                <input
                  name="confirmPassword"
                  type={showResetPassword ? "text" : "password"}
                  required
                  minLength={8}
                  placeholder="Ulangi kata sandi baru"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setResetTarget(null)}
                  className="px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-slate-900 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Reset Kata Sandi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 4: KONFIRMASI STATUS AKTIF ================= */}
      {toggleTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-[#0F172A] border border-slate-800 rounded-xl w-full max-w-sm shadow-2xl p-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-4">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  toggleTarget.isActive
                    ? "bg-red-500/10 border border-red-500/20 text-red-400"
                    : "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                }`}
              >
                <Power className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100">
                  {toggleTarget.isActive ? "Nonaktifkan Akun?" : "Aktifkan Akun Kembali?"}
                </h3>
                <p className="text-xs text-slate-400">@{toggleTarget.username}</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-5">
              {toggleTarget.isActive ? (
                <>
                  Akun <strong className="text-slate-100">{toggleTarget.name}</strong> tidak akan dapat
                  masuk lagi ke sistem dashboard sampai diaktifkan kembali.
                </>
              ) : (
                <>
                  Akun <strong className="text-slate-100">{toggleTarget.name}</strong> akan dapat masuk
                  dan mengelola sistem kembali.
                </>
              )}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setToggleTarget(null)}
                className="px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmToggle}
                disabled={isSubmitting}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  toggleTarget.isActive
                    ? "bg-red-600 hover:bg-red-500 text-white"
                    : "bg-emerald-600 hover:bg-emerald-500 text-white"
                }`}
              >
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>
                  {toggleTarget.isActive ? "Ya, Nonaktifkan" : "Ya, Aktifkan Kembali"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminDashboardShell>
  );
}
