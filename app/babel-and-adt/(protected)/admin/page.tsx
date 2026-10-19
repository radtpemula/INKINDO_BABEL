// app/babel-and-adt/(protected)/admin/page.tsx
// Server Component for Administrator Management
// Target URL: /babel-and-adt/admin
// Security Gate: Strictly restricted to SUPER_ADMIN only.
// If an ordinary ADMIN or unauthorized user opens this page, they are denied access (redirected or notFound).

import React from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth/server";
import { getAdminUsersAction } from "@/lib/admin/actions";
import { AdminManagementClient } from "@/components/admin/AdminManagementClient";
import type { AdminProfile, AdminRole } from "@/components/admin";

export const metadata: Metadata = {
  title: "Manajemen Admin - INKINDO BABEL",
  description: "Pengelolaan Akun dan Hak Akses Administrator INKINDO BABEL",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminManagementPage(): Promise<React.JSX.Element> {
  const auth = await getCurrentAdmin();

  // 1. Session & Active guard
  if (!auth.success) {
    redirect("/babel-and-adt/login");
  }

  // 2. Strict Role Security: Only SUPER_ADMIN is allowed to access /babel-and-adt/admin
  if (auth.user.role !== "SUPER_ADMIN") {
    // Non-superadmin is rejected back to dashboard overview
    redirect("/babel-and-adt");
  }

  // 3. Fetch verified database list via Server Action
  const listResult = await getAdminUsersAction();
  const initialAdminList = listResult.success && listResult.data ? listResult.data : [];

  const profile: AdminProfile = {
    id: auth.user.id,
    name: auth.user.name,
    username: auth.user.username,
    email: auth.user.email,
    role: (auth.user.role as AdminRole) || "SUPER_ADMIN",
  };

  return (
    <AdminManagementClient
      profile={profile}
      initialAdminList={initialAdminList}
    />
  );
}
