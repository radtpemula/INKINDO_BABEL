// app/babel-and-adt/page.tsx
// Server Component for the Admin Dashboard Home
// Target URL: /babel-and-adt
// Fetches verified admin record from database and renders AdminDashboardClient

import React from "react";
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth/server";
import { prisma } from "@/lib/prisma";
import type { AdminProfile, AdminRole } from "@/components/admin";
import { AdminDashboardClient } from "./AdminDashboardClient";

export default async function AdminDashboardPage(): Promise<React.JSX.Element> {
  const auth = await getCurrentAdmin();

  if (!auth.success) {
    redirect("/babel-and-adt/login");
  }

  // Count total active administrators in database for overview statistics
  let totalAdminCount = 1;
  try {
    totalAdminCount = await prisma.adminUser.count({
      where: { isActive: true },
    });
  } catch {
    totalAdminCount = 1;
  }

  const profile: AdminProfile = {
    id: auth.user.id,
    name: auth.user.name,
    username: auth.user.username,
    email: auth.user.email,
    role: (auth.user.role as AdminRole) || "ADMIN",
  };

  return (
    <AdminDashboardClient
      profile={profile}
      totalAdminCount={totalAdminCount}
    />
  );
}
