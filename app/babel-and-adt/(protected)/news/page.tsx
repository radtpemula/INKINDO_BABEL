import React from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth/server";
import { getNewsArticlesAction, type NewsArticlesListResult } from "@/lib/admin/news-actions";
import { NewsManagementClient } from "@/components/admin/NewsManagementClient";
import type { AdminProfile, AdminRole } from "@/components/admin";

export const metadata: Metadata = {
  title: "Berita & Publikasi - Panel Pengelola INKINDO BABEL",
  description: "Pengelolaan Artikel Berita, Rilis Informasi, dan Publikasi Resmi INKINDO BABEL",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function NewsManagementPage(): Promise<React.JSX.Element> {
  const auth = await getCurrentAdmin();

  if (!auth.success) {
    redirect("/babel-and-adt/login");
  }

  const listResult = await getNewsArticlesAction({ page: 1, limit: 10 });
  const initialData: NewsArticlesListResult =
    listResult.success && listResult.data
      ? listResult.data
      : { articles: [], total: 0, page: 1, limit: 10, totalPages: 1 };

  const profile: AdminProfile = {
    id: auth.user.id,
    name: auth.user.name,
    username: auth.user.username,
    email: auth.user.email,
    role: (auth.user.role as AdminRole) || "ADMIN",
  };

  return (
    <NewsManagementClient
      profile={profile}
      initialData={initialData}
    />
  );
}
