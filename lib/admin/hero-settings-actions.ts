"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin, type AuthenticatedAdmin } from "@/lib/auth/server";
import {
  DEFAULT_HERO_SETTINGS,
  type PublicHeroSettings,
  type HeroCardSettings,
} from "@/lib/public/hero";

export interface ActionResult<T = unknown> {
  success: boolean;
  message?: string;
  error?: string;
  data?: T;
}

export interface UpdateHeroBackgroundInput {
  backgroundImagePath: string;
}

export interface UpdateHeroContentInput {
  badge: string;
  titlePrefix: string;
  titleAccent: string;
  description: string;
  primaryCtaText: string;
  primaryCtaHref: string;
  secondaryCtaText: string;
  secondaryCtaHref: string;
  subBannerText: string;
  subBannerCtaText: string;
  subBannerCtaHref: string;
}

export type UpdateHeroCardsInput = HeroCardSettings;

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

function safeRevalidate() {
  try {
    revalidatePath("/");
    revalidatePath("/babel-and-adt/hero-settings");
    revalidatePath("/babel-and-adt/hero");
  } catch {
    return;
  }
}

/**
 * Mengambil pengaturan Hero saat ini dari database (SiteSetting)
 * dengan fallback ke DEFAULT_HERO_SETTINGS jika belum ada di database.
 */
export async function getHeroSettingsAction(): Promise<ActionResult<PublicHeroSettings>> {
  try {
    await verifyActiveAdmin();

    const settings = await prisma.siteSetting.findMany({
      where: { group: "hero" },
    });

    const map = new Map<string, string>();
    for (const s of settings) {
      map.set(s.key, s.value);
    }

    const result: PublicHeroSettings = {
      background: {
        backgroundImagePath: map.get("hero_bg_image") ?? DEFAULT_HERO_SETTINGS.background.backgroundImagePath,
      },
      content: {
        badge: map.get("hero_badge") ?? DEFAULT_HERO_SETTINGS.content.badge,
        titlePrefix: map.get("hero_title_prefix") ?? DEFAULT_HERO_SETTINGS.content.titlePrefix,
        titleAccent: map.get("hero_title_accent") ?? DEFAULT_HERO_SETTINGS.content.titleAccent,
        description: map.get("hero_description") ?? DEFAULT_HERO_SETTINGS.content.description,
        primaryCtaText: map.get("hero_cta1_text") ?? DEFAULT_HERO_SETTINGS.content.primaryCtaText,
        primaryCtaHref: map.get("hero_cta1_url") ?? DEFAULT_HERO_SETTINGS.content.primaryCtaHref,
        secondaryCtaText: map.get("hero_cta2_text") ?? DEFAULT_HERO_SETTINGS.content.secondaryCtaText,
        secondaryCtaHref: map.get("hero_cta2_url") ?? DEFAULT_HERO_SETTINGS.content.secondaryCtaHref,
        subBannerText: map.get("hero_subbanner_text") ?? DEFAULT_HERO_SETTINGS.content.subBannerText,
        subBannerCtaText: map.get("hero_subbanner_cta_text") ?? DEFAULT_HERO_SETTINGS.content.subBannerCtaText,
        subBannerCtaHref: map.get("hero_subbanner_cta_url") ?? DEFAULT_HERO_SETTINGS.content.subBannerCtaHref,
      },
      cards: {
        cardTitle: map.get("hero_card_title") ?? DEFAULT_HERO_SETTINGS.cards.cardTitle,
        cardSubtitle: map.get("hero_card_subtitle") ?? DEFAULT_HERO_SETTINGS.cards.cardSubtitle,
        cardBadge: map.get("hero_card_badge") ?? DEFAULT_HERO_SETTINGS.cards.cardBadge,
        cardFallbackTag:
          map.get("hero_card_fallback_tag") ?? DEFAULT_HERO_SETTINGS.cards.cardFallbackTag,
        cardFeature1Title:
          map.get("hero_card_feature1_title") ?? DEFAULT_HERO_SETTINGS.cards.cardFeature1Title,
        cardFeature1Desc:
          map.get("hero_card_feature1_desc") ?? DEFAULT_HERO_SETTINGS.cards.cardFeature1Desc,
        cardFeature2Title:
          map.get("hero_card_feature2_title") ?? DEFAULT_HERO_SETTINGS.cards.cardFeature2Title,
        cardFeature2Desc:
          map.get("hero_card_feature2_desc") ?? DEFAULT_HERO_SETTINGS.cards.cardFeature2Desc,
        highlight1Text:
          map.get("hero_highlight1_text") ?? DEFAULT_HERO_SETTINGS.cards.highlight1Text,
        highlight2Text:
          map.get("hero_highlight2_text") ?? DEFAULT_HERO_SETTINGS.cards.highlight2Text,
        highlight3Text:
          map.get("hero_highlight3_text") ?? DEFAULT_HERO_SETTINGS.cards.highlight3Text,
        cardImagePath:
          map.get("hero_card_image") ?? DEFAULT_HERO_SETTINGS.cards.cardImagePath,
      },
    };

    return {
      success: true,
      data: result,
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Gagal mengambil data pengaturan Hero.";
    return {
      success: false,
      error: errorMsg,
    };
  }
}

/**
 * Memperbarui background Hero tanpa menyentuh konten teks.
 */
export async function updateHeroBackgroundAction(
  input: UpdateHeroBackgroundInput
): Promise<ActionResult<{ backgroundImagePath: string }>> {
  try {
    await verifyActiveAdmin();

    const rawPath = sanitizeInput(input.backgroundImagePath);
    if (!rawPath) {
      return {
        success: false,
        error: "Jalur gambar background tidak boleh kosong. Gunakan 'Pulihkan Bawaan' untuk menghapus background.",
      };
    }

    // Validasi jalur gambar (harus relatif aman atau URL valid)
    if (!rawPath.startsWith("/uploads/hero/") && !rawPath.startsWith("/images/")) {
      return {
        success: false,
        error: "Jalur gambar tidak valid. Gunakan gambar hasil unggahan sistem.",
      };
    }

    await prisma.siteSetting.upsert({
      where: { key: "hero_bg_image" },
      update: {
        value: rawPath,
        updatedAt: new Date(),
      },
      create: {
        group: "hero",
        key: "hero_bg_image",
        value: rawPath,
        label: "Gambar Background Hero",
        type: "image_url",
      },
    });

    safeRevalidate();

    return {
      success: true,
      message: "Gambar background Hero berhasil diperbarui.",
      data: {
        backgroundImagePath: rawPath,
      },
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Gagal memperbarui background Hero.";
    return {
      success: false,
      error: errorMsg,
    };
  }
}

/**
 * Memulihkan background Hero ke bawaan (blueprint vektor) tanpa menyentuh konten teks.
 */
export async function restoreHeroBackgroundDefaultAction(): Promise<ActionResult> {
  try {
    await verifyActiveAdmin();

    await prisma.siteSetting.deleteMany({
      where: {
        group: "hero",
        key: "hero_bg_image",
      },
    });

    safeRevalidate();

    return {
      success: true,
      message: "Background Hero berhasil dikembalikan ke tampilan bawaan.",
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Gagal memulihkan background Hero.";
    return {
      success: false,
      error: errorMsg,
    };
  }
}

/**
 * Memperbarui konten teks Hero tanpa menyentuh background.
 */
export async function updateHeroContentAction(
  input: UpdateHeroContentInput
): Promise<ActionResult<UpdateHeroContentInput>> {
  try {
    await verifyActiveAdmin();

    const badge = sanitizeInput(input.badge) || DEFAULT_HERO_SETTINGS.content.badge;
    const titlePrefix = sanitizeInput(input.titlePrefix) || DEFAULT_HERO_SETTINGS.content.titlePrefix;
    const titleAccent = sanitizeInput(input.titleAccent) || DEFAULT_HERO_SETTINGS.content.titleAccent;
    const description = sanitizeInput(input.description) || DEFAULT_HERO_SETTINGS.content.description;
    const primaryCtaText = sanitizeInput(input.primaryCtaText) || DEFAULT_HERO_SETTINGS.content.primaryCtaText;
    const primaryCtaHref = sanitizeInput(input.primaryCtaHref) || DEFAULT_HERO_SETTINGS.content.primaryCtaHref;
    const secondaryCtaText = sanitizeInput(input.secondaryCtaText) || DEFAULT_HERO_SETTINGS.content.secondaryCtaText;
    const secondaryCtaHref = sanitizeInput(input.secondaryCtaHref) || DEFAULT_HERO_SETTINGS.content.secondaryCtaHref;
    const subBannerText = sanitizeInput(input.subBannerText) || DEFAULT_HERO_SETTINGS.content.subBannerText;
    const subBannerCtaText = sanitizeInput(input.subBannerCtaText) || DEFAULT_HERO_SETTINGS.content.subBannerCtaText;
    const subBannerCtaHref = sanitizeInput(input.subBannerCtaHref) || DEFAULT_HERO_SETTINGS.content.subBannerCtaHref;

    // Batasan panjang karakter
    if (badge.length > 100) throw new Error("Label badge maksimal 100 karakter.");
    if (titlePrefix.length > 100) throw new Error("Judul utama maksimal 100 karakter.");
    if (titleAccent.length > 50) throw new Error("Aksen judul maksimal 50 karakter.");
    if (description.length > 600) throw new Error("Deskripsi maksimal 600 karakter.");
    if (primaryCtaText.length > 60) throw new Error("Label tombol CTA 1 maksimal 60 karakter.");
    if (primaryCtaHref.length > 255) throw new Error("URL tombol CTA 1 maksimal 255 karakter.");
    if (secondaryCtaText.length > 60) throw new Error("Label tombol CTA 2 maksimal 60 karakter.");
    if (secondaryCtaHref.length > 255) throw new Error("URL tombol CTA 2 maksimal 255 karakter.");
    if (subBannerText.length > 300) throw new Error("Teks trust marker sub-banner maksimal 300 karakter.");
    if (subBannerCtaText.length > 60) throw new Error("Label tombol sub-banner maksimal 60 karakter.");
    if (subBannerCtaHref.length > 255) throw new Error("URL tombol sub-banner maksimal 255 karakter.");

    const itemsToUpsert = [
      { key: "hero_badge", value: badge, label: "Badge Label Hero" },
      { key: "hero_title_prefix", value: titlePrefix, label: "Judul Utama Hero" },
      { key: "hero_title_accent", value: titleAccent, label: "Aksen Judul Hero" },
      { key: "hero_description", value: description, label: "Deskripsi Hero" },
      { key: "hero_cta1_text", value: primaryCtaText, label: "Label Tombol Utama Hero" },
      { key: "hero_cta1_url", value: primaryCtaHref, label: "URL Tombol Utama Hero" },
      { key: "hero_cta2_text", value: secondaryCtaText, label: "Label Tombol Sekunder Hero" },
      { key: "hero_cta2_url", value: secondaryCtaHref, label: "URL Tombol Sekunder Hero" },
      { key: "hero_subbanner_text", value: subBannerText, label: "Teks Sub-banner Hero" },
      { key: "hero_subbanner_cta_text", value: subBannerCtaText, label: "Label Tombol Sub-banner Hero" },
      { key: "hero_subbanner_cta_url", value: subBannerCtaHref, label: "URL Tombol Sub-banner Hero" },
    ];

    await prisma.$transaction(
      itemsToUpsert.map((item) =>
        prisma.siteSetting.upsert({
          where: { key: item.key },
          update: {
            value: item.value,
            updatedAt: new Date(),
          },
          create: {
            group: "hero",
            key: item.key,
            value: item.value,
            label: item.label,
            type: "text",
          },
        })
      )
    );

    safeRevalidate();

    const sanitizedData: UpdateHeroContentInput = {
      badge,
      titlePrefix,
      titleAccent,
      description,
      primaryCtaText,
      primaryCtaHref,
      secondaryCtaText,
      secondaryCtaHref,
      subBannerText,
      subBannerCtaText,
      subBannerCtaHref,
    };

    return {
      success: true,
      message: "Konten teks Hero berhasil diperbarui.",
      data: sanitizedData,
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Gagal memperbarui konten teks Hero.";
    return {
      success: false,
      error: errorMsg,
    };
  }
}

/**
 * Memulihkan konten teks Hero ke pengaturan bawaan tanpa menyentuh background.
 */
export async function restoreHeroContentDefaultAction(): Promise<ActionResult> {
  try {
    await verifyActiveAdmin();

    const contentKeys = [
      "hero_badge",
      "hero_title_prefix",
      "hero_title_accent",
      "hero_description",
      "hero_cta1_text",
      "hero_cta1_url",
      "hero_cta2_text",
      "hero_cta2_url",
      "hero_subbanner_text",
      "hero_subbanner_cta_text",
      "hero_subbanner_cta_url",
    ];

    await prisma.siteSetting.deleteMany({
      where: {
        group: "hero",
        key: { in: contentKeys },
      },
    });

    safeRevalidate();

    return {
      success: true,
      message: "Konten teks Hero berhasil dikembalikan ke pengaturan bawaan.",
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Gagal memulihkan konten teks Hero.";
    return {
      success: false,
      error: errorMsg,
    };
  }
}

export async function updateHeroCardsAction(
  input: UpdateHeroCardsInput
): Promise<ActionResult<UpdateHeroCardsInput>> {
  try {
    await verifyActiveAdmin();

    const cardTitle = sanitizeInput(input.cardTitle) || DEFAULT_HERO_SETTINGS.cards.cardTitle;
    const cardSubtitle = sanitizeInput(input.cardSubtitle) || DEFAULT_HERO_SETTINGS.cards.cardSubtitle;
    const cardBadge = sanitizeInput(input.cardBadge) || DEFAULT_HERO_SETTINGS.cards.cardBadge;
    const cardFallbackTag =
      sanitizeInput(input.cardFallbackTag) || DEFAULT_HERO_SETTINGS.cards.cardFallbackTag;
    const cardFeature1Title =
      sanitizeInput(input.cardFeature1Title) || DEFAULT_HERO_SETTINGS.cards.cardFeature1Title;
    const cardFeature1Desc =
      sanitizeInput(input.cardFeature1Desc) || DEFAULT_HERO_SETTINGS.cards.cardFeature1Desc;
    const cardFeature2Title =
      sanitizeInput(input.cardFeature2Title) || DEFAULT_HERO_SETTINGS.cards.cardFeature2Title;
    const cardFeature2Desc =
      sanitizeInput(input.cardFeature2Desc) || DEFAULT_HERO_SETTINGS.cards.cardFeature2Desc;
    const highlight1Text =
      sanitizeInput(input.highlight1Text) || DEFAULT_HERO_SETTINGS.cards.highlight1Text;
    const highlight2Text =
      sanitizeInput(input.highlight2Text) || DEFAULT_HERO_SETTINGS.cards.highlight2Text;
    const highlight3Text =
      sanitizeInput(input.highlight3Text) || DEFAULT_HERO_SETTINGS.cards.highlight3Text;

    if (cardTitle.length > 100) throw new Error("Judul kartu visual maksimal 100 karakter.");
    if (cardSubtitle.length > 150) throw new Error("Subjudul kartu visual maksimal 150 karakter.");
    if (cardBadge.length > 50) throw new Error("Badge kartu visual maksimal 50 karakter.");
    if (cardFallbackTag.length > 80) throw new Error("Tag fallback visual maksimal 80 karakter.");
    if (cardFeature1Title.length > 80) throw new Error("Judul fitur 1 kartu maksimal 80 karakter.");
    if (cardFeature1Desc.length > 150) throw new Error("Deskripsi fitur 1 kartu maksimal 150 karakter.");
    if (cardFeature2Title.length > 80) throw new Error("Judul fitur 2 kartu maksimal 80 karakter.");
    if (cardFeature2Desc.length > 150) throw new Error("Deskripsi fitur 2 kartu maksimal 150 karakter.");
    if (highlight1Text.length > 80) throw new Error("Teks keunggulan 1 maksimal 80 karakter.");
    if (highlight2Text.length > 80) throw new Error("Teks keunggulan 2 maksimal 80 karakter.");
    if (highlight3Text.length > 80) throw new Error("Teks keunggulan 3 maksimal 80 karakter.");

    const itemsToUpsert = [
      { key: "hero_card_title", value: cardTitle, label: "Judul Kartu Visual Hero" },
      { key: "hero_card_subtitle", value: cardSubtitle, label: "Subjudul Kartu Visual Hero" },
      { key: "hero_card_badge", value: cardBadge, label: "Badge Kartu Visual Hero" },
      { key: "hero_card_fallback_tag", value: cardFallbackTag, label: "Tag Fallback Visual Hero" },
      { key: "hero_card_feature1_title", value: cardFeature1Title, label: "Judul Fitur 1 Kartu Hero" },
      { key: "hero_card_feature1_desc", value: cardFeature1Desc, label: "Deskripsi Fitur 1 Kartu Hero" },
      { key: "hero_card_feature2_title", value: cardFeature2Title, label: "Judul Fitur 2 Kartu Hero" },
      { key: "hero_card_feature2_desc", value: cardFeature2Desc, label: "Deskripsi Fitur 2 Kartu Hero" },
      { key: "hero_highlight1_text", value: highlight1Text, label: "Teks Keunggulan 1 Hero" },
      { key: "hero_highlight2_text", value: highlight2Text, label: "Teks Keunggulan 2 Hero" },
      { key: "hero_highlight3_text", value: highlight3Text, label: "Teks Keunggulan 3 Hero" },
    ];

    await prisma.$transaction(
      itemsToUpsert.map((item) =>
        prisma.siteSetting.upsert({
          where: { key: item.key },
          update: {
            value: item.value,
            updatedAt: new Date(),
          },
          create: {
            group: "hero",
            key: item.key,
            value: item.value,
            label: item.label,
            type: "text",
          },
        })
      )
    );

    safeRevalidate();

    const sanitizedData: UpdateHeroCardsInput = {
      cardImagePath: sanitizeInput(input.cardImagePath),
      cardTitle,
      cardSubtitle,
      cardBadge,
      cardFallbackTag,
      cardFeature1Title,
      cardFeature1Desc,
      cardFeature2Title,
      cardFeature2Desc,
      highlight1Text,
      highlight2Text,
      highlight3Text,
    };

    return {
      success: true,
      message: "Konten kartu Hero berhasil diperbarui.",
      data: sanitizedData,
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Gagal memperbarui konten kartu Hero.";
    return {
      success: false,
      error: errorMsg,
    };
  }
}

export async function updateHeroCardImageAction(
  input: { cardImagePath: string }
): Promise<ActionResult<{ cardImagePath: string }>> {
  try {
    await verifyActiveAdmin();

    const rawPath = sanitizeInput(input.cardImagePath);
    if (!rawPath) {
      return {
        success: false,
        error: "Jalur gambar kartu tidak boleh kosong. Gunakan 'Pulihkan Ilustrasi Bawaan' untuk menghapus.",
      };
    }

    if (!rawPath.startsWith("/uploads/hero/") && !rawPath.startsWith("/images/")) {
      return {
        success: false,
        error: "Jalur gambar tidak valid. Gunakan gambar hasil unggahan sistem.",
      };
    }

    const existing = await prisma.siteSetting.findUnique({
      where: { key: "hero_card_image" },
    });

    await prisma.siteSetting.upsert({
      where: { key: "hero_card_image" },
      update: {
        value: rawPath,
        updatedAt: new Date(),
      },
      create: {
        group: "hero",
        key: "hero_card_image",
        value: rawPath,
        label: "Gambar Kartu Visual Hero",
        type: "image_url",
      },
    });

    if (existing && existing.value && existing.value !== rawPath) {
      const { deleteHeroImageFile } = await import("@/lib/storage/hero");
      const isUsedBySlide = await prisma.heroSlide.findFirst({
        where: { imagePath: existing.value },
      });
      const isUsedAsBg = await prisma.siteSetting.findFirst({
        where: { key: "hero_bg_image", value: existing.value },
      });
      if (!isUsedBySlide && !isUsedAsBg) {
        await deleteHeroImageFile(existing.value);
      }
    }

    safeRevalidate();

    return {
      success: true,
      message: "Gambar kartu Hero berhasil diperbarui.",
      data: { cardImagePath: rawPath },
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Gagal memperbarui gambar kartu Hero.";
    return { success: false, error: errorMsg };
  }
}

export async function restoreHeroCardImageDefaultAction(): Promise<ActionResult> {
  try {
    await verifyActiveAdmin();

    const existing = await prisma.siteSetting.findUnique({
      where: { key: "hero_card_image" },
    });

    await prisma.siteSetting.deleteMany({
      where: { group: "hero", key: "hero_card_image" },
    });

    if (existing && existing.value) {
      const { deleteHeroImageFile } = await import("@/lib/storage/hero");
      const isUsedBySlide = await prisma.heroSlide.findFirst({
        where: { imagePath: existing.value },
      });
      const isUsedAsBg = await prisma.siteSetting.findFirst({
        where: { key: "hero_bg_image", value: existing.value },
      });
      if (!isUsedBySlide && !isUsedAsBg) {
        await deleteHeroImageFile(existing.value);
      }
    }

    safeRevalidate();

    return {
      success: true,
      message: "Gambar kartu Hero berhasil dikembalikan ke ilustrasi bawaan.",
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Gagal memulihkan gambar kartu Hero.";
    return { success: false, error: errorMsg };
  }
}

export async function restoreHeroCardsDefaultAction(): Promise<ActionResult> {
  try {
    await verifyActiveAdmin();

    const cardKeys = [
      "hero_card_title",
      "hero_card_subtitle",
      "hero_card_badge",
      "hero_card_fallback_tag",
      "hero_card_feature1_title",
      "hero_card_feature1_desc",
      "hero_card_feature2_title",
      "hero_card_feature2_desc",
      "hero_highlight1_text",
      "hero_highlight2_text",
      "hero_highlight3_text",
    ];

    await prisma.siteSetting.deleteMany({
      where: {
        group: "hero",
        key: { in: cardKeys },
      },
    });

    safeRevalidate();

    return {
      success: true,
      message: "Konten kartu Hero berhasil dikembalikan ke pengaturan bawaan.",
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Gagal memulihkan konten kartu Hero.";
    return {
      success: false,
      error: errorMsg,
    };
  }
}
