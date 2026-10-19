import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

export const MAX_NEWS_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

export type SupportedNewsImageType = "image/jpeg" | "image/png" | "image/webp";

export interface NewsImageValidationResult {
  isValid: boolean;
  mimeType?: SupportedNewsImageType;
  extension?: "jpg" | "png" | "webp";
  error?: string;
}

export interface SaveNewsImageResult {
  success: boolean;
  publicPath?: string;
  filename?: string;
  sizeBytes?: number;
  mimeType?: SupportedNewsImageType;
  error?: string;
}

export function validateNewsImageMagicBytes(buffer: Buffer): NewsImageValidationResult {
  if (!buffer || buffer.length < 12) {
    return {
      isValid: false,
      error: "Ukuran berkas terlalu kecil atau berkas rusak.",
    };
  }

  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return {
      isValid: true,
      mimeType: "image/jpeg",
      extension: "jpg",
    };
  }

  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return {
      isValid: true,
      mimeType: "image/png",
      extension: "png",
    };
  }

  const isRiff =
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46;
  const isWebp =
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50;

  if (isRiff && isWebp) {
    return {
      isValid: true,
      mimeType: "image/webp",
      extension: "webp",
    };
  }

  return {
    isValid: false,
    error: "Format berkas tidak diizinkan. Hanya format JPEG, PNG, dan WebP yang diterima.",
  };
}

export async function saveNewsImage(buffer: Buffer): Promise<SaveNewsImageResult> {
  if (!buffer || buffer.length === 0) {
    return {
      success: false,
      error: "Berkas gambar kosong.",
    };
  }

  if (buffer.length > MAX_NEWS_IMAGE_SIZE_BYTES) {
    return {
      success: false,
      error: "Ukuran berkas melebihi batas maksimum 5 MB.",
    };
  }

  const validation = validateNewsImageMagicBytes(buffer);
  if (!validation.isValid || !validation.extension || !validation.mimeType) {
    return {
      success: false,
      error: validation.error || "Validasi format gambar gagal.",
    };
  }

  const uniqueId = crypto.randomUUID().replace(/-/g, "");
  const timestamp = Date.now();
  const safeFilename = `news-${timestamp}-${uniqueId}.${validation.extension}`;

  const uploadsDir = path.join(process.cwd(), "public", "uploads", "news");
  const tempPath = path.join(uploadsDir, `.tmp-${safeFilename}`);
  const finalPath = path.join(uploadsDir, safeFilename);

  try {
    await fs.mkdir(uploadsDir, { recursive: true });

    await fs.writeFile(tempPath, buffer);
    await fs.rename(tempPath, finalPath);

    return {
      success: true,
      publicPath: `/uploads/news/${safeFilename}`,
      filename: safeFilename,
      sizeBytes: buffer.length,
      mimeType: validation.mimeType,
    };
  } catch (err) {
    try {
      await fs.unlink(tempPath);
    } catch {
      // Ignore if temp file doesn't exist
    }
    const errorMsg =
      err instanceof Error ? err.message : "Gagal menyimpan berkas ke direktori penyimpanan.";
    return {
      success: false,
      error: errorMsg,
    };
  }
}

export async function deleteNewsImageFile(publicPath: string): Promise<boolean> {
  if (!publicPath || typeof publicPath !== "string") return false;

  const normalized = path.normalize(publicPath).replace(/^(\.\.[\/\\])+/, "");
  if (!normalized.startsWith("/uploads/news/") && !normalized.startsWith("uploads/news/")) {
    return false;
  }

  const filename = path.basename(normalized);
  if (!filename || filename === "." || filename === "..") return false;

  const uploadsDir = path.join(process.cwd(), "public", "uploads", "news");
  const targetPath = path.join(uploadsDir, filename);

  const relative = path.relative(uploadsDir, targetPath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    return false;
  }

  try {
    await fs.unlink(targetPath);
    return true;
  } catch {
    return false;
  }
}
