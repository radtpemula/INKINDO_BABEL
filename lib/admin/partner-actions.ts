"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin, type AuthenticatedAdmin } from "@/lib/auth/server";
import { deletePartnerLogoFile } from "@/lib/storage/partner";
import {
  isValidPartnerLogoPath as validatePartnerLogoPath,
  isPartnerLogoReferenced,
} from "@/lib/security";
import {
  runLockedUploadCommit,
  safeDeleteUnreferencedImage,
} from "./action-upload-guard";

export interface ActionResult<T = unknown> {
  success: boolean;
  message?: string;
  error?: string;
  data?: T;
  rollbackToken?: string;
}

export interface PartnerItem {
  id: string;
  name: string;
  shortName: string;
  category: string | null;
  logoPath: string | null;
  websiteUrl: string | null;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GetPartnersOptions {
  search?: string;
  category?: string;
  status?: "all" | "active" | "inactive";
}

export interface CreatePartnerInput {
  name: string;
  shortName: string;
  category?: string | null;
  logoPath?: string | null;
  uploadToken?: string;
  websiteUrl?: string | null;
  order?: number;
  isActive?: boolean;
}

export interface UpdatePartnerInput {
  id: string;
  name?: string;
  shortName?: string;
  category?: string | null;
  logoPath?: string | null;
  uploadToken?: string;
  websiteUrl?: string | null;
  order?: number;
  isActive?: boolean;
}

export interface ReorderPartnerItemInput {
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

function isValidHttpUrl(val: string): boolean {
  if (!val) return true;
  try {
    const parsed = new URL(val);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function isValidPartnerLogoPath(val: unknown): boolean {
  if (val === null || val === undefined) return true;
  if (typeof val !== "string") return false;
  return validatePartnerLogoPath(val, { optional: true });
}

function safeRevalidate(): void {
  try {
    revalidatePath("/");
    revalidatePath("/mitra-kerja/terdaftar");
    revalidatePath("/mitra-kerja/daftar");
    revalidatePath("/babel-and-adt/partners");
  } catch {
    // Revalidation errors ignored during test/script execution
  }
}

function mapPartnerToItem(p: {
  id: string;
  name: string;
  shortName: string;
  category: string | null;
  logoPath: string | null;
  websiteUrl: string | null;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}): PartnerItem {
  return {
    id: p.id,
    name: p.name,
    shortName: p.shortName,
    category: p.category,
    logoPath: p.logoPath,
    websiteUrl: p.websiteUrl,
    order: p.order,
    isActive: p.isActive,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

export async function getPartnersAction(
  options?: GetPartnersOptions
): Promise<ActionResult<PartnerItem[]>> {
  try {
    await verifyActiveAdmin();

    const search = sanitizeInput(options?.search);
    const category = sanitizeInput(options?.category);
    const status = options?.status ?? "all";

    const where: {
      AND?: Array<Record<string, unknown>>;
      isActive?: boolean;
    } = {};

    const andConditions: Array<Record<string, unknown>> = [];

    if (search) {
      andConditions.push({
        OR: [
          { name: { contains: search } },
          { shortName: { contains: search } },
          { category: { contains: search } },
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

    const partners = await prisma.partner.findMany({
      where,
      orderBy: [{ order: "asc" }, { createdAt: "asc" }, { id: "asc" }],
    });

    return {
      success: true,
      message: "Data mitra berhasil dimuat.",
      data: partners.map(mapPartnerToItem),
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Gagal memuat data mitra.",
    };
  }
}

export async function createPartnerAction(
  input: CreatePartnerInput
): Promise<ActionResult<PartnerItem>> {
  try {
    const admin = await verifyActiveAdmin();
    const candidateLogoPath =
      typeof input.logoPath === "string" ? input.logoPath.trim() || null : null;

    const result = await runLockedUploadCommit<PartnerItem>({
      adminId: admin.id,
      module: "partners",
      publicPath: candidateLogoPath,
      uploadToken: input.uploadToken,
      fallbackError: "Gagal menambahkan data mitra kerja.",
      operation: async () => {
        const name = sanitizeInput(input.name);
        const shortName = sanitizeInput(input.shortName);
        const category = sanitizeInput(input.category) || null;
        const websiteUrl = sanitizeInput(input.websiteUrl) || null;
        const logoPath = candidateLogoPath;

        if (!name) {
          return { success: false, definiteFailure: true, error: "Nama lengkap mitra kerja wajib diisi." };
        }
        if (name.length > 150) {
          return { success: false, definiteFailure: true, error: "Nama mitra kerja maksimal 150 karakter." };
        }

        if (!shortName) {
          return { success: false, definiteFailure: true, error: "Singkatan/nama pendek mitra kerja wajib diisi." };
        }
        if (shortName.length > 50) {
          return { success: false, definiteFailure: true, error: "Singkatan nama mitra maksimal 50 karakter." };
        }

        if (category && category.length > 50) {
          return { success: false, definiteFailure: true, error: "Kategori mitra maksimal 50 karakter." };
        }

        if (websiteUrl) {
          if (websiteUrl.length > 255) {
            return { success: false, definiteFailure: true, error: "URL website mitra maksimal 255 karakter." };
          }
          if (!isValidHttpUrl(websiteUrl)) {
            return {
              success: false,
              definiteFailure: true,
              error: "Format URL website tidak valid. Gunakan http:// atau https://.",
            };
          }
        }

        if (logoPath !== null && !isValidPartnerLogoPath(logoPath)) {
          return {
            success: false,
            definiteFailure: true,
            error: "Jalur berkas logo tidak valid. Gunakan gambar dari direktori /uploads/partners/.",
          };
        }

        let order = input.order;
        if (typeof order !== "number" || isNaN(order) || order < 0) {
          const maxOrder = await prisma.partner.findFirst({
            orderBy: { order: "desc" },
            select: { order: true },
          });
          order = (maxOrder?.order ?? -1) + 1;
        }

        const isActive = input.isActive !== undefined ? Boolean(input.isActive) : true;

        const created = await prisma.partner.create({
          data: {
            name,
            shortName,
            category,
            logoPath,
            websiteUrl,
            order,
            isActive,
          },
        });

        safeRevalidate();

        return {
          success: true,
          message: "Data mitra kerja berhasil ditambahkan.",
          data: mapPartnerToItem(created),
        };
      },
    });

    return result;
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Gagal menambahkan data mitra kerja.",
    };
  }
}

export async function updatePartnerAction(
  input: UpdatePartnerInput
): Promise<ActionResult<PartnerItem>> {
  try {
    const admin = await verifyActiveAdmin();
    const candidateLogoPath =
      typeof input.logoPath === "string" ? input.logoPath.trim() || null : null;

    let oldLogoToDelete: string | null = null;
    let updatedId = "";

    const result = await runLockedUploadCommit<PartnerItem>({
      adminId: admin.id,
      module: "partners",
      publicPath: candidateLogoPath,
      uploadToken: input.uploadToken,
      fallbackError: "Gagal memperbarui data mitra kerja.",
      operation: async () => {
        const id = sanitizeInput(input.id);
        if (!id) {
          return { success: false, definiteFailure: true, error: "ID mitra kerja tidak valid." };
        }

        const existing = await prisma.partner.findUnique({
          where: { id },
        });

        if (!existing) {
          return { success: false, definiteFailure: true, error: "Data mitra kerja tidak ditemukan." };
        }

        const updateData: {
          name?: string;
          shortName?: string;
          category?: string | null;
          websiteUrl?: string | null;
          logoPath?: string | null;
          order?: number;
          isActive?: boolean;
        } = {};

        if (input.name !== undefined) {
          const name = sanitizeInput(input.name);
          if (!name) {
            return { success: false, definiteFailure: true, error: "Nama lengkap mitra kerja tidak boleh kosong." };
          }
          if (name.length > 150) {
            return { success: false, definiteFailure: true, error: "Nama mitra kerja maksimal 150 karakter." };
          }
          updateData.name = name;
        }

        if (input.shortName !== undefined) {
          const shortName = sanitizeInput(input.shortName);
          if (!shortName) {
            return { success: false, definiteFailure: true, error: "Singkatan nama mitra kerja tidak boleh kosong." };
          }
          if (shortName.length > 50) {
            return { success: false, definiteFailure: true, error: "Singkatan nama mitra maksimal 50 karakter." };
          }
          updateData.shortName = shortName;
        }

        if (input.category !== undefined) {
          const category = sanitizeInput(input.category) || null;
          if (category && category.length > 50) {
            return { success: false, definiteFailure: true, error: "Kategori mitra maksimal 50 karakter." };
          }
          updateData.category = category;
        }

        if (input.websiteUrl !== undefined) {
          const websiteUrl = sanitizeInput(input.websiteUrl) || null;
          if (websiteUrl) {
            if (websiteUrl.length > 255) {
              return { success: false, definiteFailure: true, error: "URL website mitra maksimal 255 karakter." };
            }
            if (!isValidHttpUrl(websiteUrl)) {
              return {
                success: false,
                definiteFailure: true,
                error: "Format URL website tidak valid. Gunakan http:// atau https://.",
              };
            }
          }
          updateData.websiteUrl = websiteUrl;
        }

        if (input.logoPath !== undefined) {
          const logoPath = candidateLogoPath;
          if (logoPath !== null && !isValidPartnerLogoPath(logoPath)) {
            return {
              success: false,
              definiteFailure: true,
              error: "Jalur berkas logo tidak valid. Gunakan gambar dari direktori /uploads/partners/.",
            };
          }
          updateData.logoPath = logoPath;
          if (existing.logoPath && existing.logoPath !== logoPath) {
            oldLogoToDelete = existing.logoPath;
          }
        }

        if (input.order !== undefined) {
          if (typeof input.order !== "number" || isNaN(input.order) || input.order < 0) {
            return { success: false, definiteFailure: true, error: "Urutan harus berupa angka positif." };
          }
          updateData.order = Math.floor(input.order);
        }

        if (input.isActive !== undefined) {
          updateData.isActive = Boolean(input.isActive);
        }

        const updated = await prisma.partner.update({
          where: { id },
          data: updateData,
        });

        updatedId = id;
        return {
          success: true,
          message: "Data mitra kerja berhasil diperbarui.",
          data: mapPartnerToItem(updated),
        };
      },
    });

    if (!result.success) {
      return result;
    }

    if (oldLogoToDelete) {
      await safeDeleteUnreferencedImage({
        publicPath: oldLogoToDelete,
        isReferenced: (p) =>
          isPartnerLogoReferenced(p, { prisma, excludePartnerId: updatedId }),
        deleteFile: deletePartnerLogoFile,
        logLabel: "Gagal membersihkan berkas logo lama:",
      });
    }

    safeRevalidate();
    return result;
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Gagal memperbarui data mitra kerja.",
    };
  }
}

export async function deletePartnerAction(
  partnerId: string
): Promise<ActionResult<boolean>> {
  try {
    await verifyActiveAdmin();

    const id = sanitizeInput(partnerId);
    if (!id) {
      return { success: false, error: "ID mitra kerja tidak valid." };
    }

    const existing = await prisma.partner.findUnique({
      where: { id },
      select: { id: true, logoPath: true },
    });

    if (!existing) {
      return { success: false, error: "Data mitra kerja tidak ditemukan." };
    }

    await prisma.partner.delete({
      where: { id },
    });

    if (existing.logoPath) {
      await safeDeleteUnreferencedImage({
        publicPath: existing.logoPath,
        isReferenced: (p) => isPartnerLogoReferenced(p, { prisma }),
        deleteFile: deletePartnerLogoFile,
        logLabel: "Gagal membersihkan berkas logo setelah penghapusan record:",
      });
    }

    safeRevalidate();

    return {
      success: true,
      message: "Data mitra kerja berhasil dihapus.",
      data: true,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Gagal menghapus data mitra kerja.",
    };
  }
}

export async function togglePartnerActiveAction(
  partnerId: string,
  explicitStatus?: boolean
): Promise<ActionResult<{ id: string; isActive: boolean }>> {
  try {
    await verifyActiveAdmin();

    const id = sanitizeInput(partnerId);
    if (!id) {
      return { success: false, error: "ID mitra kerja tidak valid." };
    }

    const existing = await prisma.partner.findUnique({
      where: { id },
      select: { id: true, isActive: true },
    });

    if (!existing) {
      return { success: false, error: "Data mitra kerja tidak ditemukan." };
    }

    const nextStatus =
      explicitStatus !== undefined ? Boolean(explicitStatus) : !existing.isActive;

    const updated = await prisma.partner.update({
      where: { id },
      data: { isActive: nextStatus },
      select: { id: true, isActive: true },
    });

    safeRevalidate();

    return {
      success: true,
      message: `Mitra kerja berhasil ${updated.isActive ? "diaktifkan" : "dinonaktifkan"}.`,
      data: updated,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Gagal mengubah status mitra kerja.",
    };
  }
}

export async function reorderPartnersAction(
  orderedItems: string[] | ReorderPartnerItemInput[]
): Promise<ActionResult<boolean>> {
  try {
    await verifyActiveAdmin();

    if (!Array.isArray(orderedItems) || orderedItems.length === 0) {
      return { success: false, error: "Daftar urutan mitra kerja tidak boleh kosong." };
    }

    const itemsToUpdate: Array<{ id: string; order: number }> = [];

    if (typeof orderedItems[0] === "string") {
      const stringIds = orderedItems as string[];
      const seen = new Set<string>();
      for (let i = 0; i < stringIds.length; i++) {
        const cleanId = sanitizeInput(stringIds[i]);
        if (!cleanId) {
          return { success: false, error: "Terdapat ID mitra yang kosong dalam daftar urutan." };
        }
        if (seen.has(cleanId)) {
          return { success: false, error: `ID mitra duplikat terdeteksi: ${cleanId}` };
        }
        seen.add(cleanId);
        itemsToUpdate.push({ id: cleanId, order: i });
      }
    } else {
      const objItems = orderedItems as ReorderPartnerItemInput[];
      const seen = new Set<string>();
      for (const item of objItems) {
        if (!item || typeof item !== "object") {
          return { success: false, error: "Format data urutan tidak valid." };
        }
        const cleanId = sanitizeInput(item.id);
        if (!cleanId) {
          return { success: false, error: "ID mitra tidak boleh kosong." };
        }
        if (seen.has(cleanId)) {
          return { success: false, error: `ID mitra duplikat terdeteksi: ${cleanId}` };
        }
        if (typeof item.order !== "number" || isNaN(item.order) || item.order < 0) {
          return { success: false, error: `Nilai urutan untuk ID ${cleanId} tidak valid.` };
        }
        seen.add(cleanId);
        itemsToUpdate.push({ id: cleanId, order: Math.floor(item.order) });
      }
    }

    const idsToCheck = itemsToUpdate.map((it) => it.id);
    const existingRecords = await prisma.partner.findMany({
      where: { id: { in: idsToCheck } },
      select: { id: true },
    });

    if (existingRecords.length !== idsToCheck.length) {
      const foundIds = new Set(existingRecords.map((r) => r.id));
      const missingId = idsToCheck.find((id) => !foundIds.has(id));
      return {
        success: false,
        error: `Satu atau lebih data mitra tidak ditemukan di database (ID: ${missingId}).`,
      };
    }

    await prisma.$transaction(
      itemsToUpdate.map((item) =>
        prisma.partner.update({
          where: { id: item.id },
          data: { order: item.order },
        })
      )
    );

    safeRevalidate();

    return {
      success: true,
      message: "Urutan mitra kerja berhasil diperbarui.",
      data: true,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Gagal memperbarui urutan mitra kerja.",
    };
  }
}
