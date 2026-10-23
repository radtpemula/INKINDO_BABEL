"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin, type AuthenticatedAdmin } from "@/lib/auth/server";
import { deleteMemberWorkImageFile } from "@/lib/storage/member-work";

export interface ActionResult<T = unknown> {
  success: boolean;
  message?: string;
  error?: string;
  data?: T;
}

export interface MemberWorkItem {
  id: string;
  title: string;
  slug: string;
  category: string;
  company: string;
  year: string;
  description: string | null;
  imagePath: string | null;
  imageAlt: string | null;
  client: string | null;
  order: number;
  isFeatured: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GetMemberWorksOptions {
  search?: string;
  category?: string;
  status?: "all" | "active" | "inactive";
  featured?: "all" | "featured" | "standard";
}

export interface CreateMemberWorkInput {
  title: string;
  slug?: string;
  category: string;
  company: string;
  year: string;
  description?: string | null;
  imagePath?: string | null;
  imageAlt?: string | null;
  client?: string | null;
  order?: number;
  isFeatured?: boolean;
  isActive?: boolean;
}

export interface UpdateMemberWorkInput {
  id: string;
  title?: string;
  slug?: string;
  category?: string;
  company?: string;
  year?: string;
  description?: string | null;
  imagePath?: string | null;
  imageAlt?: string | null;
  client?: string | null;
  order?: number;
  isFeatured?: boolean;
  isActive?: boolean;
}

export interface ReorderMemberWorkItemInput {
  id: string;
  order: number;
}

async function verifyActiveAdmin(): Promise<AuthenticatedAdmin> {
  const auth = await getCurrentAdmin();
  if (!auth.success) {
    if (auth.reason === "USER_INACTIVE") {
      throw new Error("Akses ditolak: Akun administrator Anda telah dinonaktifkan.");
    }
    throw new Error("Akses ditolak: Sesi administrator tidak valid atau telah berakhir.");
  }
  return auth.user;
}

function sanitizeInput(val: unknown): string {
  if (typeof val !== "string") return "";
  return val.trim();
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/--+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 160);
}

async function resolveUniqueMemberWorkSlug(
  baseSlug: string,
  currentId?: string
): Promise<string> {
  const slug = baseSlug || "karya";
  let count = 0;

  while (true) {
    const candidate = count === 0 ? slug : `${slug}-${count}`;
    const existing = await prisma.memberWork.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });

    if (!existing || existing.id === currentId) {
      return candidate;
    }
    count++;
  }
}

function isValidMemberWorkImagePath(val: unknown): boolean {
  if (val === null || val === undefined) return true;
  if (typeof val !== "string") return false;
  const trimmed = val.trim();
  if (trimmed === "") return true;

  if (trimmed.includes("..") || trimmed.includes("\\")) return false;
  if (!trimmed.startsWith("/uploads/member-works/") && !trimmed.startsWith("uploads/member-works/")) {
    return false;
  }

  const allowedExts = [".jpg", ".jpeg", ".png", ".webp"];
  const lower = trimmed.toLowerCase();
  return allowedExts.some((ext) => lower.endsWith(ext));
}

function safeRevalidate(slug?: string): void {
  try {
    revalidatePath("/");
    revalidatePath("/berita-informasi/karya-anggota");
    if (slug) {
      revalidatePath(`/berita-informasi/karya-anggota/${slug}`);
    }
    revalidatePath("/babel-and-adt/member-works");
  } catch {
    // Revalidation errors ignored during test/script execution
  }
}

function mapMemberWorkToItem(w: {
  id: string;
  title: string;
  slug: string;
  category: string;
  company: string;
  year: string;
  description: string | null;
  imagePath: string | null;
  imageAlt: string | null;
  client: string | null;
  order: number;
  isFeatured: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}): MemberWorkItem {
  return {
    id: w.id,
    title: w.title,
    slug: w.slug,
    category: w.category,
    company: w.company,
    year: w.year,
    description: w.description,
    imagePath: w.imagePath,
    imageAlt: w.imageAlt,
    client: w.client,
    order: w.order,
    isFeatured: w.isFeatured,
    isActive: w.isActive,
    createdAt: w.createdAt.toISOString(),
    updatedAt: w.updatedAt.toISOString(),
  };
}

export async function getMemberWorksAction(
  options?: GetMemberWorksOptions
): Promise<ActionResult<MemberWorkItem[]>> {
  try {
    await verifyActiveAdmin();

    const search = sanitizeInput(options?.search);
    const category = sanitizeInput(options?.category);
    const status = options?.status ?? "all";
    const featured = options?.featured ?? "all";

    const where: {
      AND?: Array<Record<string, unknown>>;
      isActive?: boolean;
      isFeatured?: boolean;
    } = {};

    const andConditions: Array<Record<string, unknown>> = [];

    if (search) {
      andConditions.push({
        OR: [
          { title: { contains: search } },
          { slug: { contains: search } },
          { company: { contains: search } },
          { category: { contains: search } },
          { client: { contains: search } },
          { year: { contains: search } },
        ],
      });
    }

    if (category) {
      andConditions.push({ category });
    }

    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    if (status === "active") {
      where.isActive = true;
    } else if (status === "inactive") {
      where.isActive = false;
    }

    if (featured === "featured") {
      where.isFeatured = true;
    } else if (featured === "standard") {
      where.isFeatured = false;
    }

    const works = await prisma.memberWork.findMany({
      where,
      orderBy: [{ order: "asc" }, { createdAt: "asc" }, { id: "asc" }],
    });

    return {
      success: true,
      message: "Data karya anggota berhasil dimuat.",
      data: works.map(mapMemberWorkToItem),
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Gagal memuat data karya anggota.",
    };
  }
}

export async function createMemberWorkAction(
  input: CreateMemberWorkInput
): Promise<ActionResult<MemberWorkItem>> {
  try {
    await verifyActiveAdmin();

    const title = sanitizeInput(input.title);
    const category = sanitizeInput(input.category);
    const company = sanitizeInput(input.company);
    const year = sanitizeInput(input.year);
    const description = sanitizeInput(input.description) || null;
    const client = sanitizeInput(input.client) || null;
    const imageAlt = sanitizeInput(input.imageAlt) || null;
    const imagePath = typeof input.imagePath === "string" ? input.imagePath.trim() || null : null;

    if (!title) {
      return { success: false, error: "Judul karya anggota wajib diisi." };
    }
    if (title.length > 150) {
      return { success: false, error: "Judul karya maksimal 150 karakter." };
    }

    if (!category) {
      return { success: false, error: "Kategori karya wajib diisi." };
    }
    if (category.length > 50) {
      return { success: false, error: "Kategori karya maksimal 50 karakter." };
    }

    if (!company) {
      return { success: false, error: "Nama perusahaan konsultan wajib diisi." };
    }
    if (company.length > 100) {
      return { success: false, error: "Nama perusahaan maksimal 100 karakter." };
    }

    if (!year) {
      return { success: false, error: "Tahun pengerjaan karya wajib diisi." };
    }
    if (year.length > 20) {
      return { success: false, error: "Tahun maksimal 20 karakter." };
    }

    if (description && description.length > 1000) {
      return { success: false, error: "Deskripsi karya maksimal 1000 karakter." };
    }

    if (client && client.length > 100) {
      return { success: false, error: "Nama pemberi kerja/klien maksimal 100 karakter." };
    }

    if (imageAlt && imageAlt.length > 200) {
      return { success: false, error: "Teks alternatif gambar maksimal 200 karakter." };
    }

    if (imagePath !== null && !isValidMemberWorkImagePath(imagePath)) {
      return {
        success: false,
        error: "Jalur berkas gambar tidak valid. Gunakan gambar dari direktori /uploads/member-works/.",
      };
    }

    const rawSlug = sanitizeInput(input.slug);
    const baseSlug = rawSlug ? slugify(rawSlug) : slugify(title);
    const finalSlug = await resolveUniqueMemberWorkSlug(baseSlug);

    let order = input.order;
    if (typeof order !== "number" || isNaN(order) || order < 0) {
      const maxOrder = await prisma.memberWork.findFirst({
        orderBy: { order: "desc" },
        select: { order: true },
      });
      order = (maxOrder?.order ?? -1) + 1;
    }

    const isFeatured = input.isFeatured !== undefined ? Boolean(input.isFeatured) : true;
    const isActive = input.isActive !== undefined ? Boolean(input.isActive) : true;

    const created = await prisma.memberWork.create({
      data: {
        title,
        slug: finalSlug,
        category,
        company,
        year,
        description,
        client,
        imagePath,
        imageAlt: imageAlt || title,
        order,
        isFeatured,
        isActive,
      },
    });

    safeRevalidate(created.slug);

    return {
      success: true,
      message: "Data karya anggota berhasil ditambahkan.",
      data: mapMemberWorkToItem(created),
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Gagal menambahkan data karya anggota.",
    };
  }
}

export async function updateMemberWorkAction(
  input: UpdateMemberWorkInput
): Promise<ActionResult<MemberWorkItem>> {
  try {
    await verifyActiveAdmin();

    const id = sanitizeInput(input.id);
    if (!id) {
      return { success: false, error: "ID karya anggota tidak valid." };
    }

    const existing = await prisma.memberWork.findUnique({
      where: { id },
    });

    if (!existing) {
      return { success: false, error: "Data karya anggota tidak ditemukan." };
    }

    const updateData: {
      title?: string;
      slug?: string;
      category?: string;
      company?: string;
      year?: string;
      description?: string | null;
      client?: string | null;
      imagePath?: string | null;
      imageAlt?: string | null;
      order?: number;
      isFeatured?: boolean;
      isActive?: boolean;
    } = {};

    let oldImageToDelete: string | null = null;

    if (input.title !== undefined) {
      const title = sanitizeInput(input.title);
      if (!title) {
        return { success: false, error: "Judul karya anggota tidak boleh kosong." };
      }
      if (title.length > 150) {
        return { success: false, error: "Judul karya maksimal 150 karakter." };
      }
      updateData.title = title;
    }

    if (input.slug !== undefined) {
      const cleanSlug = sanitizeInput(input.slug);
      if (cleanSlug) {
        const formattedSlug = slugify(cleanSlug);
        const resolvedSlug = await resolveUniqueMemberWorkSlug(formattedSlug, id);
        updateData.slug = resolvedSlug;
      }
    }

    if (input.category !== undefined) {
      const category = sanitizeInput(input.category);
      if (!category) {
        return { success: false, error: "Kategori karya anggota tidak boleh kosong." };
      }
      if (category.length > 50) {
        return { success: false, error: "Kategori karya maksimal 50 karakter." };
      }
      updateData.category = category;
    }

    if (input.company !== undefined) {
      const company = sanitizeInput(input.company);
      if (!company) {
        return { success: false, error: "Nama perusahaan konsultan tidak boleh kosong." };
      }
      if (company.length > 100) {
        return { success: false, error: "Nama perusahaan maksimal 100 karakter." };
      }
      updateData.company = company;
    }

    if (input.year !== undefined) {
      const year = sanitizeInput(input.year);
      if (!year) {
        return { success: false, error: "Tahun pengerjaan tidak boleh kosong." };
      }
      if (year.length > 20) {
        return { success: false, error: "Tahun maksimal 20 karakter." };
      }
      updateData.year = year;
    }

    if (input.description !== undefined) {
      const description = sanitizeInput(input.description) || null;
      if (description && description.length > 1000) {
        return { success: false, error: "Deskripsi karya maksimal 1000 karakter." };
      }
      updateData.description = description;
    }

    if (input.client !== undefined) {
      const client = sanitizeInput(input.client) || null;
      if (client && client.length > 100) {
        return { success: false, error: "Nama pemberi kerja/klien maksimal 100 karakter." };
      }
      updateData.client = client;
    }

    if (input.imageAlt !== undefined) {
      const imageAlt = sanitizeInput(input.imageAlt) || null;
      if (imageAlt && imageAlt.length > 200) {
        return { success: false, error: "Teks alternatif gambar maksimal 200 karakter." };
      }
      updateData.imageAlt = imageAlt;
    }

    if (input.imagePath !== undefined) {
      const imagePath = typeof input.imagePath === "string" ? input.imagePath.trim() || null : null;
      if (imagePath !== null && !isValidMemberWorkImagePath(imagePath)) {
        return {
          success: false,
          error: "Jalur berkas gambar tidak valid. Gunakan gambar dari direktori /uploads/member-works/.",
        };
      }
      updateData.imagePath = imagePath;
      if (existing.imagePath && existing.imagePath !== imagePath) {
        oldImageToDelete = existing.imagePath;
      }
    }

    if (input.order !== undefined) {
      if (typeof input.order !== "number" || isNaN(input.order) || input.order < 0) {
        return { success: false, error: "Urutan harus berupa angka positif." };
      }
      updateData.order = Math.floor(input.order);
    }

    if (input.isFeatured !== undefined) {
      updateData.isFeatured = Boolean(input.isFeatured);
    }

    if (input.isActive !== undefined) {
      updateData.isActive = Boolean(input.isActive);
    }

    const updated = await prisma.memberWork.update({
      where: { id },
      data: updateData,
    });

    if (oldImageToDelete) {
      try {
        const isShared = await prisma.memberWork.findFirst({
          where: { imagePath: oldImageToDelete, id: { not: id } },
          select: { id: true },
        });
        if (!isShared) {
          await deleteMemberWorkImageFile(oldImageToDelete);
        }
      } catch (cleanupErr) {
        console.error("Gagal membersihkan berkas gambar lama:", cleanupErr);
      }
    }

    safeRevalidate(existing.slug);
    if (existing.slug !== updated.slug) {
      safeRevalidate(updated.slug);
    }

    return {
      success: true,
      message: "Data karya anggota berhasil diperbarui.",
      data: mapMemberWorkToItem(updated),
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Gagal memperbarui data karya anggota.",
    };
  }
}

export async function deleteMemberWorkAction(
  memberWorkId: string
): Promise<ActionResult<boolean>> {
  try {
    await verifyActiveAdmin();

    const id = sanitizeInput(memberWorkId);
    if (!id) {
      return { success: false, error: "ID karya anggota tidak valid." };
    }

    const existing = await prisma.memberWork.findUnique({
      where: { id },
      select: { id: true, imagePath: true, slug: true },
    });

    if (!existing) {
      return { success: false, error: "Data karya anggota tidak ditemukan." };
    }

    await prisma.memberWork.delete({
      where: { id },
    });

    if (existing.imagePath) {
      try {
        const isShared = await prisma.memberWork.findFirst({
          where: { imagePath: existing.imagePath },
          select: { id: true },
        });
        if (!isShared) {
          await deleteMemberWorkImageFile(existing.imagePath);
        }
      } catch (cleanupErr) {
        console.error("Gagal membersihkan berkas gambar setelah penghapusan record:", cleanupErr);
      }
    }

    safeRevalidate(existing.slug);

    return {
      success: true,
      message: "Data karya anggota berhasil dihapus.",
      data: true,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Gagal menghapus data karya anggota.",
    };
  }
}

export async function toggleMemberWorkActiveAction(
  memberWorkId: string,
  explicitStatus?: boolean
): Promise<ActionResult<{ id: string; isActive: boolean }>> {
  try {
    await verifyActiveAdmin();

    const id = sanitizeInput(memberWorkId);
    if (!id) {
      return { success: false, error: "ID karya anggota tidak valid." };
    }

    const existing = await prisma.memberWork.findUnique({
      where: { id },
      select: { id: true, isActive: true, slug: true },
    });

    if (!existing) {
      return { success: false, error: "Data karya anggota tidak ditemukan." };
    }

    const nextStatus =
      explicitStatus !== undefined ? Boolean(explicitStatus) : !existing.isActive;

    const updated = await prisma.memberWork.update({
      where: { id },
      data: { isActive: nextStatus },
      select: { id: true, isActive: true },
    });

    safeRevalidate(existing.slug);

    return {
      success: true,
      message: `Karya anggota berhasil ${updated.isActive ? "diaktifkan" : "dinonaktifkan"}.`,
      data: updated,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Gagal mengubah status karya anggota.",
    };
  }
}

export async function toggleMemberWorkFeaturedAction(
  memberWorkId: string,
  explicitStatus?: boolean
): Promise<ActionResult<{ id: string; isFeatured: boolean }>> {
  try {
    await verifyActiveAdmin();

    const id = sanitizeInput(memberWorkId);
    if (!id) {
      return { success: false, error: "ID karya anggota tidak valid." };
    }

    const existing = await prisma.memberWork.findUnique({
      where: { id },
      select: { id: true, isFeatured: true, slug: true },
    });

    if (!existing) {
      return { success: false, error: "Data karya anggota tidak ditemukan." };
    }

    const nextStatus =
      explicitStatus !== undefined ? Boolean(explicitStatus) : !existing.isFeatured;

    const updated = await prisma.memberWork.update({
      where: { id },
      data: { isFeatured: nextStatus },
      select: { id: true, isFeatured: true },
    });

    safeRevalidate(existing.slug);

    return {
      success: true,
      message: `Karya anggota berhasil ${updated.isFeatured ? "dijadikan unggulan" : "dihapus dari unggulan"}.`,
      data: updated,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Gagal mengubah status unggulan karya anggota.",
    };
  }
}

export async function reorderMemberWorksAction(
  orderedItems: string[] | ReorderMemberWorkItemInput[]
): Promise<ActionResult<boolean>> {
  try {
    await verifyActiveAdmin();

    if (!Array.isArray(orderedItems) || orderedItems.length === 0) {
      return { success: false, error: "Daftar urutan karya anggota tidak boleh kosong." };
    }

    const itemsToUpdate: Array<{ id: string; order: number }> = [];

    if (typeof orderedItems[0] === "string") {
      const stringIds = orderedItems as string[];
      const seen = new Set<string>();
      for (let i = 0; i < stringIds.length; i++) {
        const cleanId = sanitizeInput(stringIds[i]);
        if (!cleanId) {
          return { success: false, error: "Terdapat ID karya yang kosong dalam daftar urutan." };
        }
        if (seen.has(cleanId)) {
          return { success: false, error: `ID karya duplikat terdeteksi: ${cleanId}` };
        }
        seen.add(cleanId);
        itemsToUpdate.push({ id: cleanId, order: i });
      }
    } else {
      const objItems = orderedItems as ReorderMemberWorkItemInput[];
      const seen = new Set<string>();
      for (const item of objItems) {
        if (!item || typeof item !== "object") {
          return { success: false, error: "Format data urutan tidak valid." };
        }
        const cleanId = sanitizeInput(item.id);
        if (!cleanId) {
          return { success: false, error: "ID karya tidak boleh kosong." };
        }
        if (seen.has(cleanId)) {
          return { success: false, error: `ID karya duplikat terdeteksi: ${cleanId}` };
        }
        if (typeof item.order !== "number" || isNaN(item.order) || item.order < 0) {
          return { success: false, error: `Nilai urutan untuk ID ${cleanId} tidak valid.` };
        }
        seen.add(cleanId);
        itemsToUpdate.push({ id: cleanId, order: Math.floor(item.order) });
      }
    }

    const idsToCheck = itemsToUpdate.map((it) => it.id);
    const existingRecords = await prisma.memberWork.findMany({
      where: { id: { in: idsToCheck } },
      select: { id: true },
    });

    if (existingRecords.length !== idsToCheck.length) {
      const foundIds = new Set(existingRecords.map((r) => r.id));
      const missingId = idsToCheck.find((id) => !foundIds.has(id));
      return {
        success: false,
        error: `Satu atau lebih data karya tidak ditemukan di database (ID: ${missingId}).`,
      };
    }

    await prisma.$transaction(
      itemsToUpdate.map((item) =>
        prisma.memberWork.update({
          where: { id: item.id },
          data: { order: item.order },
        })
      )
    );

    safeRevalidate();

    return {
      success: true,
      message: "Urutan karya anggota berhasil diperbarui.",
      data: true,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Gagal memperbarui urutan karya anggota.",
    };
  }
}
