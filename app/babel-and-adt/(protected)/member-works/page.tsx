import React from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth/server";
import { getMemberWorksAction, type MemberWorkItem } from "@/lib/admin/member-work-actions";
import { MemberWorkManagementClient } from "@/components/admin/MemberWorkManagementClient";
import type { AdminProfile, AdminRole } from "@/components/admin";

export const metadata: Metadata = {
  title: "Karya & Portofolio Anggota - Panel Pengelola INKINDO BABEL",
  description: "Pengelolaan Galeri Karya, Proyek Rekayasa, dan Portofolio Konsultansi Anggota INKINDO BABEL",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function MemberWorksManagementPage(): Promise<React.JSX.Element> {
  const auth = await getCurrentAdmin();

  if (!auth.success) {
    redirect("/babel-and-adt/login");
  }

  const listResult = await getMemberWorksAction();
  const initialWorks: MemberWorkItem[] =
    listResult.success && listResult.data ? listResult.data : [];

  const profile: AdminProfile = {
    id: auth.user.id,
    name: auth.user.name,
    username: auth.user.username,
    email: auth.user.email,
    role: (auth.user.role as AdminRole) || "ADMIN",
  };

  return (
    <MemberWorkManagementClient
      profile={profile}
      initialWorks={initialWorks}
    />
  );
}
