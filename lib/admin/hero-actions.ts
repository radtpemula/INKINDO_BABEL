"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin, type AuthenticatedAdmin } from "@/lib/auth/server";
import { deleteHeroImageFile } from "@/lib/storage/hero";

export interface ActionResult<T = unknown> {
  success: boolean;
  message?: string;
  error?: string;
  data?: T;
}

export interface HeroSlideItem {
  id: string;
  title: string;
  description: string;
  imagePath: string;
  imageAlt: string;
  linkUrl: string | null;
  linkLabel: string | null;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateHeroSlideInput {
  imagePath: string;
  imageAlt?: string;
  title?: string;
  description?: string;
  linkUrl?: string | null;
  linkLabel?: string | null;
  order?: number;
  isActive?: boolean;
}

export interface UpdateHeroSlideInput {
  id: string;
  imagePath?: string;
  imageAlt?: string;
  title?: string;
  description?: string;
  linkUrl?: string | null;
  linkLabel?: string | null;
  order?: number;
  isActive?: boolean;
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

function safeRevalidatePath(targetPath: string) {
  try {
    revalidatePath(targetPath);
  } catch {
    return;
  }
}

export async function getHeroSlidesAction(): Promise<ActionResult<HeroSlideItem[]>> {
  try {
    await verifyActiveAdmin();

    const slides = await prisma.heroSlide.findMany({
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    });

    const formatted: HeroSlideItem[] = slides.map((s) => ({
      id: s.id,
      title: s.title,
      description: s.description,
      imagePath: s.imagePath,
      imageAlt: s.imageAlt,
      linkUrl: s.linkUrl,
      linkLabel: s.linkLabel,
      order: s.order,
      isActive: s.isActive,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    }));

    return {
      success: true,
      data: formatted,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Gagal memuat data Hero Slide.",
    };
  }
}

export async function createHeroSlideAction(
  input: CreateHeroSlideInput
): Promise<ActionResult<HeroSlideItem>> {
  try {
    await verifyActiveAdmin();

    const imagePath = sanitizeInput(input.imagePath);
    if (!imagePath || !imagePath.startsWith("/uploads/hero/")) {
      if (imagePath) await deleteHeroImageFile(imagePath);
      return { success: false, error: "Gambar slide wajib diunggah." };
    }

    const title = input.title ? sanitizeInput(input.title) : "Dokumentasi Hero";
    const description = input.description ? sanitizeInput(input.description) : "Dokumentasi Kegiatan INKINDO BABEL";
    const imageAlt = input.imageAlt ? sanitizeInput(input.imageAlt) : "Dokumentasi Hero INKINDO BABEL";
    const linkUrl = input.linkUrl ? sanitizeInput(input.linkUrl) : null;
    const linkLabel = input.linkLabel ? sanitizeInput(input.linkLabel) : null;
    const isActive = input.isActive !== undefined ? Boolean(input.isActive) : true;

    let slideOrder = input.order;
    if (slideOrder === undefined || Number.isNaN(slideOrder)) {
      const maxOrderSlide = await prisma.heroSlide.findFirst({
        orderBy: { order: "desc" },
        select: { order: true },
      });
      slideOrder = (maxOrderSlide?.order ?? -1) + 1;
    }

    const created = await prisma.heroSlide.create({
      data: {
        title,
        description,
        imagePath,
        imageAlt,
        linkUrl,
        linkLabel,
        order: slideOrder,
        isActive,
      },
    });

    safeRevalidatePath("/babel-and-adt/hero");

    return {
      success: true,
      message: "Hero slide berhasil ditambahkan.",
      data: {
        id: created.id,
        title: created.title,
        description: created.description,
        imagePath: created.imagePath,
        imageAlt: created.imageAlt,
        linkUrl: created.linkUrl,
        linkLabel: created.linkLabel,
        order: created.order,
        isActive: created.isActive,
        createdAt: created.createdAt.toISOString(),
        updatedAt: created.updatedAt.toISOString(),
      },
    };
  } catch (err) {
    if (input.imagePath) {
      await deleteHeroImageFile(input.imagePath);
    }
    return {
      success: false,
      error: err instanceof Error ? err.message : "Gagal menambahkan slide baru.",
    };
  }
}

export async function updateHeroSlideAction(
  input: UpdateHeroSlideInput
): Promise<ActionResult<HeroSlideItem>> {
  try {
    await verifyActiveAdmin();

    const slideId = sanitizeInput(input.id);
    if (!slideId) {
      return { success: false, error: "ID slide tidak valid." };
    }

    const existing = await prisma.heroSlide.findUnique({
      where: { id: slideId },
    });
    if (!existing) {
      if (input.imagePath) {
        await deleteHeroImageFile(input.imagePath);
      }
      return { success: false, error: "Slide tidak ditemukan." };
    }

    const title = input.title !== undefined ? (input.title ? sanitizeInput(input.title) : "") : existing.title;
    const description = input.description !== undefined ? (input.description ? sanitizeInput(input.description) : "") : existing.description;
    const imageAlt = input.imageAlt !== undefined ? (input.imageAlt ? sanitizeInput(input.imageAlt) : existing.imageAlt) : existing.imageAlt;
    const linkUrl = input.linkUrl !== undefined ? (input.linkUrl ? sanitizeInput(input.linkUrl) : null) : existing.linkUrl;
    const linkLabel = input.linkLabel !== undefined ? (input.linkLabel ? sanitizeInput(input.linkLabel) : null) : existing.linkLabel;
    const isActive = input.isActive !== undefined ? Boolean(input.isActive) : existing.isActive;
    const order = input.order !== undefined && !Number.isNaN(input.order) ? Number(input.order) : existing.order;

    let newImagePath = existing.imagePath;
    let oldImagePathToDelete: string | null = null;

    if (input.imagePath && input.imagePath !== existing.imagePath) {
      if (!input.imagePath.startsWith("/uploads/hero/")) {
        return { success: false, error: "Path gambar tidak valid." };
      }
      newImagePath = input.imagePath;
      oldImagePathToDelete = existing.imagePath;
    }

    const updated = await prisma.heroSlide.update({
      where: { id: slideId },
      data: {
        title,
        description,
        imagePath: newImagePath,
        imageAlt,
        linkUrl,
        linkLabel,
        isActive,
        order,
      },
    });

    if (oldImagePathToDelete) {
      const isShared = await prisma.heroSlide.findFirst({
        where: {
          imagePath: oldImagePathToDelete,
          id: { not: slideId },
        },
      });
      if (!isShared) {
        await deleteHeroImageFile(oldImagePathToDelete);
      }
    }

    safeRevalidatePath("/babel-and-adt/hero");

    return {
      success: true,
      message: "Data slide berhasil diperbarui.",
      data: {
        id: updated.id,
        title: updated.title,
        description: updated.description,
        imagePath: updated.imagePath,
        imageAlt: updated.imageAlt,
        linkUrl: updated.linkUrl,
        linkLabel: updated.linkLabel,
        order: updated.order,
        isActive: updated.isActive,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      },
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Gagal memperbarui data slide.",
    };
  }
}

export async function toggleHeroSlideActiveAction(
  slideId: string
): Promise<ActionResult<{ id: string; isActive: boolean }>> {
  try {
    await verifyActiveAdmin();

    const id = sanitizeInput(slideId);
    if (!id) return { success: false, error: "ID slide tidak valid." };

    const existing = await prisma.heroSlide.findUnique({
      where: { id },
      select: { id: true, isActive: true },
    });
    if (!existing) return { success: false, error: "Slide tidak ditemukan." };

    const updated = await prisma.heroSlide.update({
      where: { id },
      data: { isActive: !existing.isActive },
      select: { id: true, isActive: true },
    });

    safeRevalidatePath("/babel-and-adt/hero");

    return {
      success: true,
      message: `Slide berhasil ${updated.isActive ? "diaktifkan" : "dinonaktifkan"}.`,
      data: updated,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Gagal mengubah status slide.",
    };
  }
}

export async function moveHeroSlideOrderAction(
  slideId: string,
  direction: "up" | "down"
): Promise<ActionResult<boolean>> {
  try {
    await verifyActiveAdmin();

    const id = sanitizeInput(slideId);
    if (!id) return { success: false, error: "ID slide tidak valid." };

    const currentSlide = await prisma.heroSlide.findUnique({ where: { id } });
    if (!currentSlide) return { success: false, error: "Slide tidak ditemukan." };

    const targetSlide = await prisma.heroSlide.findFirst({
      where: direction === "up" ? { order: { lt: currentSlide.order } } : { order: { gt: currentSlide.order } },
      orderBy: { order: direction === "up" ? "desc" : "asc" },
    });

    if (!targetSlide) {
      return { success: true, message: "Slide sudah berada pada posisi batas.", data: true };
    }

    const currentOrder = currentSlide.order;
    const targetOrder = targetSlide.order;

    await prisma.$transaction([
      prisma.heroSlide.update({
        where: { id: currentSlide.id },
        data: { order: -999999 },
      }),
      prisma.heroSlide.update({
        where: { id: targetSlide.id },
        data: { order: currentOrder },
      }),
      prisma.heroSlide.update({
        where: { id: currentSlide.id },
        data: { order: targetOrder },
      }),
    ]);

    safeRevalidatePath("/babel-and-adt/hero");

    return {
      success: true,
      message: "Urutan slide berhasil diperbarui.",
      data: true,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Gagal memindahkan urutan slide.",
    };
  }
}

export async function deleteHeroSlideAction(slideId: string): Promise<ActionResult<boolean>> {
  try {
    await verifyActiveAdmin();

    const id = sanitizeInput(slideId);
    if (!id) return { success: false, error: "ID slide tidak valid." };

    const existing = await prisma.heroSlide.findUnique({ where: { id } });
    if (!existing) return { success: false, error: "Slide tidak ditemukan." };

    await prisma.heroSlide.delete({ where: { id } });

    const isShared = await prisma.heroSlide.findFirst({
      where: { imagePath: existing.imagePath },
    });
    if (!isShared) {
      await deleteHeroImageFile(existing.imagePath);
    }

    const remainingSlides = await prisma.heroSlide.findMany({
      orderBy: { order: "asc" },
      select: { id: true },
    });

    if (remainingSlides.length > 0) {
      await prisma.$transaction(
        remainingSlides.map((s, idx) =>
          prisma.heroSlide.update({
            where: { id: s.id },
            data: { order: idx },
          })
        )
      );
    }

    safeRevalidatePath("/babel-and-adt/hero");

    return {
      success: true,
      message: "Slide berhasil dihapus.",
      data: true,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Gagal menghapus slide.",
    };
  }
}
