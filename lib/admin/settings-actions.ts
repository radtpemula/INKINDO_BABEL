"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin, type AuthenticatedAdmin } from "@/lib/auth/server";
import {
  getSiteSettings,
  type PublicSiteSettings,
  type SiteIdentitySettings,
  type SiteContactSettings,
  type SiteTopbarSettings,
  type SiteFooterSettings,
  type SiteSocialSettings,
} from "@/lib/public/settings";

export interface ActionResult<T = unknown> {
  success: boolean;
  message?: string;
  error?: string;
  data?: T;
}

async function verifyActiveAdmin(): Promise<AuthenticatedAdmin> {
  const auth = await getCurrentAdmin();
  if (!auth.success) {
    throw new Error("Akses ditolak: Sesi administrator tidak valid atau telah berakhir.");
  }
  if (!auth.user.isActive) {
    throw new Error("Akses ditolak: Akun administrator Anda telah dinonaktifkan.");
  }
  return auth.user;
}

function sanitizeInput(val: unknown): string {
  if (typeof val !== "string") return "";
  return val.trim();
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidUrlOrEmpty(url: string): boolean {
  if (!url) return true;
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return false;
  }
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function safeRevalidate() {
  try {
    revalidatePath("/");
    revalidatePath("/babel-and-adt/settings");
    revalidatePath("/berita-informasi/rilis-berita");
  } catch {
    return;
  }
}

export async function getSiteSettingsAction(): Promise<ActionResult<PublicSiteSettings>> {
  try {
    await verifyActiveAdmin();
    const settings = await getSiteSettings();
    return {
      success: true,
      data: settings,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Gagal memuat pengaturan website.",
    };
  }
}

export async function updateSiteIdentityAction(
  input: SiteIdentitySettings
): Promise<ActionResult<SiteIdentitySettings>> {
  try {
    await verifyActiveAdmin();

    const orgName = sanitizeInput(input.orgName);
    const tagline = sanitizeInput(input.tagline);
    const region = sanitizeInput(input.region);
    const description = sanitizeInput(input.description);

    if (!orgName) {
      return { success: false, error: "Nama organisasi tidak boleh kosong." };
    }
    if (orgName.length > 100) {
      return { success: false, error: "Nama organisasi maksimal 100 karakter." };
    }
    if (!tagline) {
      return { success: false, error: "Tagline organisasi tidak boleh kosong." };
    }
    if (tagline.length > 250) {
      return { success: false, error: "Tagline organisasi maksimal 250 karakter." };
    }
    if (!region) {
      return { success: false, error: "Nama wilayah tidak boleh kosong." };
    }
    if (region.length > 100) {
      return { success: false, error: "Nama wilayah maksimal 100 karakter." };
    }
    if (!description) {
      return { success: false, error: "Deskripsi singkat organisasi tidak boleh kosong." };
    }
    if (description.length > 500) {
      return { success: false, error: "Deskripsi singkat organisasi maksimal 500 karakter." };
    }

    const payload = [
      { key: "site_org_name", value: orgName, label: "Nama Organisasi", group: "general" },
      { key: "site_tagline", value: tagline, label: "Tagline Organisasi", group: "general" },
      { key: "site_region", value: region, label: "Wilayah Organisasi", group: "general" },
      { key: "site_description", value: description, label: "Deskripsi Profil Organisasi", group: "general" },
    ];

    await prisma.$transaction(
      payload.map((item) =>
        prisma.siteSetting.upsert({
          where: { key: item.key },
          update: { value: item.value, label: item.label, group: item.group },
          create: {
            group: item.group,
            key: item.key,
            value: item.value,
            label: item.label,
            type: "text",
          },
        })
      )
    );

    safeRevalidate();

    return {
      success: true,
      message: "Identitas website berhasil disimpan.",
      data: { orgName, tagline, region, description },
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Gagal menyimpan identitas website.",
    };
  }
}

export async function updateSiteContactAction(
  input: SiteContactSettings
): Promise<ActionResult<SiteContactSettings>> {
  try {
    await verifyActiveAdmin();

    const phone = sanitizeInput(input.phone);
    const email = sanitizeInput(input.email);
    const address = sanitizeInput(input.address);
    const workingHours = sanitizeInput(input.workingHours);
    const fax = sanitizeInput(input.fax);

    if (!phone) {
      return { success: false, error: "Nomor telepon sekretariat tidak boleh kosong." };
    }
    if (phone.length > 100) {
      return { success: false, error: "Nomor telepon sekretariat maksimal 100 karakter." };
    }
    if (!email) {
      return { success: false, error: "Alamat email sekretariat tidak boleh kosong." };
    }
    if (!isValidEmail(email)) {
      return { success: false, error: "Format alamat email sekretariat tidak valid." };
    }
    if (email.length > 100) {
      return { success: false, error: "Alamat email sekretariat maksimal 100 karakter." };
    }
    if (!address) {
      return { success: false, error: "Alamat kantor sekretariat tidak boleh kosong." };
    }
    if (address.length > 300) {
      return { success: false, error: "Alamat kantor sekretariat maksimal 300 karakter." };
    }
    if (!workingHours) {
      return { success: false, error: "Jam operasional tidak boleh kosong." };
    }
    if (workingHours.length > 100) {
      return { success: false, error: "Jam operasional maksimal 100 karakter." };
    }
    if (fax.length > 100) {
      return { success: false, error: "Nomor fax maksimal 100 karakter." };
    }

    const payload = [
      { key: "contact_phone", value: phone, label: "Telepon Sekretariat", group: "contact" },
      { key: "contact_email", value: email, label: "Email Sekretariat", group: "contact" },
      { key: "contact_address", value: address, label: "Alamat Kantor", group: "contact" },
      { key: "contact_working_hours", value: workingHours, label: "Jam Operasional", group: "contact" },
      { key: "contact_fax", value: fax, label: "Nomor Fax", group: "contact" },
    ];

    await prisma.$transaction(
      payload.map((item) =>
        prisma.siteSetting.upsert({
          where: { key: item.key },
          update: { value: item.value, label: item.label, group: item.group },
          create: {
            group: item.group,
            key: item.key,
            value: item.value,
            label: item.label,
            type: "text",
          },
        })
      )
    );

    safeRevalidate();

    return {
      success: true,
      message: "Informasi kontak berhasil disimpan.",
      data: { phone, email, address, workingHours, fax },
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Gagal menyimpan informasi kontak.",
    };
  }
}

export async function updateSiteTopbarAction(
  input: SiteTopbarSettings
): Promise<ActionResult<SiteTopbarSettings>> {
  try {
    await verifyActiveAdmin();

    const phone = sanitizeInput(input.phone);
    const email = sanitizeInput(input.email);
    const location = sanitizeInput(input.location);
    const workingHours = sanitizeInput(input.workingHours);

    if (!phone) {
      return { success: false, error: "Nomor telepon topbar tidak boleh kosong." };
    }
    if (phone.length > 100) {
      return { success: false, error: "Nomor telepon topbar maksimal 100 karakter." };
    }
    if (!email) {
      return { success: false, error: "Alamat email topbar tidak boleh kosong." };
    }
    if (!isValidEmail(email)) {
      return { success: false, error: "Format email topbar tidak valid." };
    }
    if (email.length > 100) {
      return { success: false, error: "Alamat email topbar maksimal 100 karakter." };
    }
    if (!location) {
      return { success: false, error: "Lokasi wilayah topbar tidak boleh kosong." };
    }
    if (location.length > 100) {
      return { success: false, error: "Lokasi wilayah topbar maksimal 100 karakter." };
    }
    if (!workingHours) {
      return { success: false, error: "Jam operasional topbar tidak boleh kosong." };
    }
    if (workingHours.length > 100) {
      return { success: false, error: "Jam operasional topbar maksimal 100 karakter." };
    }

    const payload = [
      { key: "topbar_phone", value: phone, label: "Telepon Topbar", group: "topbar" },
      { key: "topbar_email", value: email, label: "Email Topbar", group: "topbar" },
      { key: "topbar_location", value: location, label: "Lokasi Wilayah Topbar", group: "topbar" },
      { key: "topbar_working_hours", value: workingHours, label: "Jam Operasional Topbar", group: "topbar" },
    ];

    await prisma.$transaction(
      payload.map((item) =>
        prisma.siteSetting.upsert({
          where: { key: item.key },
          update: { value: item.value, label: item.label, group: item.group },
          create: {
            group: item.group,
            key: item.key,
            value: item.value,
            label: item.label,
            type: "text",
          },
        })
      )
    );

    safeRevalidate();

    return {
      success: true,
      message: "Pengaturan topbar berhasil disimpan.",
      data: { phone, email, location, workingHours },
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Gagal menyimpan pengaturan topbar.",
    };
  }
}

export async function updateSiteFooterAction(
  input: SiteFooterSettings
): Promise<ActionResult<SiteFooterSettings>> {
  try {
    await verifyActiveAdmin();

    const description = sanitizeInput(input.description);
    const address = sanitizeInput(input.address);
    const legal = sanitizeInput(input.legal);
    const copyright = sanitizeInput(input.copyright);

    if (!description) {
      return { success: false, error: "Deskripsi footer tidak boleh kosong." };
    }
    if (description.length > 500) {
      return { success: false, error: "Deskripsi footer maksimal 500 karakter." };
    }
    if (!address) {
      return { success: false, error: "Alamat kantor footer tidak boleh kosong." };
    }
    if (address.length > 300) {
      return { success: false, error: "Alamat kantor footer maksimal 300 karakter." };
    }
    if (!legal) {
      return { success: false, error: "Informasi legalitas tidak boleh kosong." };
    }
    if (legal.length > 300) {
      return { success: false, error: "Informasi legalitas maksimal 300 karakter." };
    }
    if (!copyright) {
      return { success: false, error: "Teks hak cipta footer tidak boleh kosong." };
    }
    if (copyright.length > 200) {
      return { success: false, error: "Teks hak cipta footer maksimal 200 karakter." };
    }

    const payload = [
      { key: "footer_description", value: description, label: "Deskripsi Footer", group: "footer" },
      { key: "footer_address", value: address, label: "Alamat Kantor Footer", group: "footer" },
      { key: "footer_legal", value: legal, label: "Legalitas Organisasi", group: "footer" },
      { key: "footer_copyright", value: copyright, label: "Teks Hak Cipta", group: "footer" },
    ];

    await prisma.$transaction(
      payload.map((item) =>
        prisma.siteSetting.upsert({
          where: { key: item.key },
          update: { value: item.value, label: item.label, group: item.group },
          create: {
            group: item.group,
            key: item.key,
            value: item.value,
            label: item.label,
            type: "text",
          },
        })
      )
    );

    safeRevalidate();

    return {
      success: true,
      message: "Pengaturan footer berhasil disimpan.",
      data: { description, address, legal, copyright },
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Gagal menyimpan pengaturan footer.",
    };
  }
}

export async function updateSiteSocialAction(
  input: SiteSocialSettings
): Promise<ActionResult<SiteSocialSettings>> {
  try {
    await verifyActiveAdmin();

    const instagram = sanitizeInput(input.instagram);
    const instagramLabel = sanitizeInput(input.instagramLabel);
    const facebook = sanitizeInput(input.facebook);
    const facebookLabel = sanitizeInput(input.facebookLabel);
    const youtube = sanitizeInput(input.youtube);
    const youtubeLabel = sanitizeInput(input.youtubeLabel);
    const linkedin = sanitizeInput(input.linkedin);
    const linkedinLabel = sanitizeInput(input.linkedinLabel);

    if (instagram) {
      if (!isValidUrlOrEmpty(instagram)) {
        return { success: false, error: "Format URL Instagram tidak valid (harus diawali http:// atau https://)." };
      }
      if (instagram.length > 255) {
        return { success: false, error: "URL Instagram maksimal 255 karakter." };
      }
      if (!instagramLabel) {
        return { success: false, error: "Nama akun Instagram wajib diisi jika URL diisi." };
      }
    }
    if (instagramLabel.length > 60) {
      return { success: false, error: "Nama akun Instagram maksimal 60 karakter." };
    }

    if (facebook) {
      if (!isValidUrlOrEmpty(facebook)) {
        return { success: false, error: "Format URL Facebook tidak valid (harus diawali http:// atau https://)." };
      }
      if (facebook.length > 255) {
        return { success: false, error: "URL Facebook maksimal 255 karakter." };
      }
      if (!facebookLabel) {
        return { success: false, error: "Nama akun Facebook wajib diisi jika URL diisi." };
      }
    }
    if (facebookLabel.length > 60) {
      return { success: false, error: "Nama akun Facebook maksimal 60 karakter." };
    }

    if (youtube) {
      if (!isValidUrlOrEmpty(youtube)) {
        return { success: false, error: "Format URL YouTube tidak valid (harus diawali http:// atau https://)." };
      }
      if (youtube.length > 255) {
        return { success: false, error: "URL YouTube maksimal 255 karakter." };
      }
      if (!youtubeLabel) {
        return { success: false, error: "Nama akun YouTube wajib diisi jika URL diisi." };
      }
    }
    if (youtubeLabel.length > 60) {
      return { success: false, error: "Nama akun YouTube maksimal 60 karakter." };
    }

    if (linkedin) {
      if (!isValidUrlOrEmpty(linkedin)) {
        return { success: false, error: "Format URL LinkedIn tidak valid (harus diawali http:// atau https://)." };
      }
      if (linkedin.length > 255) {
        return { success: false, error: "URL LinkedIn maksimal 255 karakter." };
      }
      if (!linkedinLabel) {
        return { success: false, error: "Nama akun LinkedIn wajib diisi jika URL diisi." };
      }
    }
    if (linkedinLabel.length > 60) {
      return { success: false, error: "Nama akun LinkedIn maksimal 60 karakter." };
    }

    const payload = [
      { key: "social_instagram", value: instagram, label: "Tautan Instagram", group: "social" },
      { key: "social_instagram_label", value: instagramLabel, label: "Nama Akun Instagram", group: "social" },
      { key: "social_facebook", value: facebook, label: "Tautan Facebook", group: "social" },
      { key: "social_facebook_label", value: facebookLabel, label: "Nama Akun Facebook", group: "social" },
      { key: "social_youtube", value: youtube, label: "Tautan YouTube", group: "social" },
      { key: "social_youtube_label", value: youtubeLabel, label: "Nama Akun YouTube", group: "social" },
      { key: "social_linkedin", value: linkedin, label: "Tautan LinkedIn", group: "social" },
      { key: "social_linkedin_label", value: linkedinLabel, label: "Nama Akun LinkedIn", group: "social" },
    ];

    await prisma.$transaction(
      payload.map((item) =>
        prisma.siteSetting.upsert({
          where: { key: item.key },
          update: { value: item.value, label: item.label, group: item.group },
          create: {
            group: item.group,
            key: item.key,
            value: item.value,
            label: item.label,
            type: "text",
          },
        })
      )
    );

    safeRevalidate();

    return {
      success: true,
      message: "Tautan dan akun media sosial berhasil disimpan.",
      data: {
        instagram,
        instagramLabel,
        facebook,
        facebookLabel,
        youtube,
        youtubeLabel,
        linkedin,
        linkedinLabel,
      },
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Gagal menyimpan tautan media sosial.",
    };
  }
}

export async function restoreSiteSectionDefaultAction(
  section: "identity" | "contact" | "topbar" | "footer" | "social"
): Promise<ActionResult> {
  try {
    await verifyActiveAdmin();

    const sectionKeyMap: Record<string, string[]> = {
      identity: ["site_org_name", "site_tagline", "site_region", "site_description"],
      contact: ["contact_phone", "contact_email", "contact_address", "contact_working_hours", "contact_fax"],
      topbar: ["topbar_phone", "topbar_email", "topbar_location", "topbar_working_hours"],
      footer: ["footer_description", "footer_address", "footer_legal", "footer_copyright"],
      social: [
        "social_instagram",
        "social_instagram_label",
        "social_facebook",
        "social_facebook_label",
        "social_youtube",
        "social_youtube_label",
        "social_linkedin",
        "social_linkedin_label",
      ],
    };

    const targetKeys = sectionKeyMap[section];
    if (!targetKeys || targetKeys.length === 0) {
      return { success: false, error: "Bagian pengaturan tidak dikenali." };
    }

    await prisma.siteSetting.deleteMany({
      where: {
        key: {
          in: targetKeys,
        },
      },
    });

    safeRevalidate();

    const sectionLabels: Record<string, string> = {
      identity: "Identitas Website",
      contact: "Informasi Kontak",
      topbar: "Topbar",
      footer: "Footer",
      social: "Media Sosial",
    };

    return {
      success: true,
      message: `Pengaturan ${sectionLabels[section] ?? section} berhasil dikembalikan ke nilai bawaan.`,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Gagal memulihkan pengaturan default.",
    };
  }
}
