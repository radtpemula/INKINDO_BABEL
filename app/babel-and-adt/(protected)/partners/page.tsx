import React from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth/server";
import { getPartnersAction, type PartnerItem } from "@/lib/admin/partner-actions";
import { PartnerManagementClient } from "@/components/admin/PartnerManagementClient";
import type { AdminProfile, AdminRole } from "@/components/admin";

export const metadata: Metadata = {
  title: "Mitra Kerja & Afiliasi - Panel Pengelola INKINDO BABEL",
  description: "Pengelolaan Data Lembaga Mitra, Asosiasi Industri, Perbankan, dan Instansi Pemerintah INKINDO BABEL",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function PartnersManagementPage(): Promise<React.JSX.Element> {
  const auth = await getCurrentAdmin();

  if (!auth.success) {
    redirect("/babel-and-adt/login");
  }

  const listResult = await getPartnersAction();
  const initialPartners: PartnerItem[] =
    listResult.success && listResult.data ? listResult.data : [];

  const profile: AdminProfile = {
    id: auth.user.id,
    name: auth.user.name,
    username: auth.user.username,
    email: auth.user.email,
    role: (auth.user.role as AdminRole) || "ADMIN",
  };

  return (
    <PartnerManagementClient
      profile={profile}
      initialPartners={initialPartners}
    />
  );
}
