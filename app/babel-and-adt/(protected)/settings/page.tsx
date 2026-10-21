import React from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth/server";
import { getSiteSettingsAction } from "@/lib/admin/settings-actions";
import { DEFAULT_SITE_SETTINGS } from "@/lib/public/settings";
import { SiteSettingsClient } from "@/components/admin/SiteSettingsClient";
import type { AdminProfile, AdminRole } from "@/components/admin";

export const metadata: Metadata = {
  title: "Pengaturan Website - Panel Pengelola INKINDO BABEL",
  description: "Pengelolaan Identitas Organisasi, Informasi Kontak, Topbar, Footer, dan Media Sosial INKINDO BABEL",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function SettingsPage(): Promise<React.JSX.Element> {
  const auth = await getCurrentAdmin();

  if (!auth.success) {
    redirect("/babel-and-adt/login");
  }

  const settingsResult = await getSiteSettingsAction();
  const initialSettings =
    settingsResult.success && settingsResult.data
      ? settingsResult.data
      : DEFAULT_SITE_SETTINGS;

  const profile: AdminProfile = {
    id: auth.user.id,
    name: auth.user.name,
    username: auth.user.username,
    email: auth.user.email,
    role: (auth.user.role as AdminRole) || "ADMIN",
  };

  return (
    <SiteSettingsClient
      profile={profile}
      initialSettings={initialSettings}
    />
  );
}
