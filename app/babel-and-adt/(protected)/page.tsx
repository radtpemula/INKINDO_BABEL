// app/babel-and-adt/page.tsx
// Server Component for the Admin Dashboard Home
// Target URL: /babel-and-adt
// Fetches verified admin record from database and renders AdminDashboardClient

import React from "react";
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth/server";
import { prisma } from "@/lib/prisma";
import type {
  AdminProfile,
  AdminRole,
  DashboardOverviewData,
} from "@/components/admin";
import { AdminDashboardClient } from "./AdminDashboardClient";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage(): Promise<React.JSX.Element> {
  const auth = await getCurrentAdmin();

  if (!auth.success) {
    redirect("/babel-and-adt/login");
  }

  const profile: AdminProfile = {
    id: auth.user.id,
    name: auth.user.name,
    username: auth.user.username,
    email: auth.user.email,
    role: (auth.user.role as AdminRole) || "ADMIN",
  };

  const isSuperAdmin = profile.role === "SUPER_ADMIN";

  let overviewData: DashboardOverviewData | null = null;
  let dbError: string | null = null;

  try {
    const [
      heroTotal,
      heroActive,
      newsTotal,
      newsPublished,
      worksTotal,
      worksActive,
      worksFeatured,
      partnerTotal,
      partnerActive,
    ] = await Promise.all([
      prisma.heroSlide.count(),
      prisma.heroSlide.count({ where: { isActive: true } }),
      prisma.newsArticle.count(),
      prisma.newsArticle.count({ where: { isPublished: true } }),
      prisma.memberWork.count(),
      prisma.memberWork.count({ where: { isActive: true } }),
      prisma.memberWork.count({ where: { isFeatured: true } }),
      prisma.partner.count(),
      prisma.partner.count({ where: { isActive: true } }),
    ]);

    let adminsData: DashboardOverviewData["admins"] = null;

    if (isSuperAdmin) {
      const [adminTotal, adminActive, adminRoles] = await Promise.all([
        prisma.adminUser.count(),
        prisma.adminUser.count({ where: { isActive: true } }),
        prisma.adminUser.groupBy({
          by: ["role"],
          _count: { id: true },
        }),
      ]);

      const rolesMap: Record<string, number> = {};
      for (const r of adminRoles) {
        rolesMap[r.role] = r._count.id;
      }

      adminsData = {
        total: adminTotal,
        active: adminActive,
        inactive: Math.max(0, adminTotal - adminActive),
        roles: {
          superAdmin: rolesMap["SUPER_ADMIN"] ?? 0,
          admin: rolesMap["ADMIN"] ?? 0,
          editor: rolesMap["EDITOR"] ?? 0,
        },
      };
    }

    overviewData = {
      hero: {
        total: heroTotal,
        active: heroActive,
        inactive: Math.max(0, heroTotal - heroActive),
      },
      news: {
        total: newsTotal,
        published: newsPublished,
        draft: Math.max(0, newsTotal - newsPublished),
      },
      memberWorks: {
        total: worksTotal,
        active: worksActive,
        inactive: Math.max(0, worksTotal - worksActive),
        featured: worksFeatured,
      },
      partners: {
        total: partnerTotal,
        active: partnerActive,
        inactive: Math.max(0, partnerTotal - partnerActive),
      },
      settings: {
        totalGroups: 5,
        groups: [
          "Identitas Website",
          "Informasi Kontak",
          "Topbar Navigasi",
          "Footer & Legal",
          "Media Sosial",
        ],
      },
      admins: adminsData,
    };
  } catch (err) {
    dbError =
      err instanceof Error
        ? err.message
        : "Gagal memuat ringkasan konten dari basis data.";
  }

  return (
    <AdminDashboardClient
      profile={profile}
      overviewData={overviewData}
      dbError={dbError}
    />
  );
}
