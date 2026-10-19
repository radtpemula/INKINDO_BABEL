import React from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth/server";
import { getHeroSlidesAction } from "@/lib/admin/hero-actions";
import { getHeroSettingsAction } from "@/lib/admin/hero-settings-actions";
import { DEFAULT_HERO_SETTINGS } from "@/lib/public/hero";
import { HeroManagementClient } from "@/components/admin/HeroManagementClient";
import type { AdminProfile, AdminRole } from "@/components/admin";

export const metadata: Metadata = {
  title: "Hero - Panel Pengelola INKINDO BABEL",
  description: "Pengelolaan Slideshow, Background, dan Konten Banner Beranda INKINDO BABEL",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function HeroManagementPage(): Promise<React.JSX.Element> {
  const auth = await getCurrentAdmin();

  if (!auth.success) {
    redirect("/babel-and-adt/login");
  }

  const [slidesResult, settingsResult] = await Promise.all([
    getHeroSlidesAction(),
    getHeroSettingsAction(),
  ]);

  const initialSlides = slidesResult.success && slidesResult.data ? slidesResult.data : [];
  const initialSettings =
    settingsResult.success && settingsResult.data
      ? settingsResult.data
      : DEFAULT_HERO_SETTINGS;

  const profile: AdminProfile = {
    id: auth.user.id,
    name: auth.user.name,
    username: auth.user.username,
    email: auth.user.email,
    role: (auth.user.role as AdminRole) || "ADMIN",
  };

  return (
    <HeroManagementClient
      profile={profile}
      initialSlides={initialSlides}
      initialSettings={initialSettings}
    />
  );
}
