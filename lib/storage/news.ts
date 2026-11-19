import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import {
  MAX_IMAGE_SIZE_BYTES,
  validateImageMagicBytes,
  type SupportedImageType,
  type ImageValidationResult,
} from "./image-validation";
import { processAndValidateImageBuffer } from "./image-processor";

export const MAX_NEWS_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_BYTES;

export type SupportedNewsImageType = SupportedImageType;
export type NewsImageValidationResult = ImageValidationResult;
export const validateNewsImageMagicBytes = validateImageMagicBytes;

export interface SaveNewsImageResult {
  readonly success: boolean;
  readonly publicPath?: string;
  readonly filename?: string;
  readonly sizeBytes?: number;
  readonly mimeType?: SupportedNewsImageType;
  readonly error?: string;
}

export async function saveNewsImage(buffer: Buffer): Promise<SaveNewsImageResult> {
  const processed = await processAndValidateImageBuffer(buffer, MAX_NEWS_IMAGE_SIZE_BYTES);
  if (
    !processed.success ||
    !processed.buffer ||
    !processed.extension ||
    !processed.mimeType
  ) {
    return {
      success: false,
      error: processed.error || "Validasi format gambar gagal.",
    };
  }

  const uniqueId = crypto.randomUUID().replace(/-/g, "");
  const timestamp = Date.now();
  const safeFilename = `news-${timestamp}-${uniqueId}.${processed.extension}`;

  const uploadsDir = path.join(process.cwd(), "public", "uploads", "news");
  const tempPath = path.join(uploadsDir, `.tmp-${safeFilename}`);
  const finalPath = path.join(uploadsDir, safeFilename);

  try {
    await fs.mkdir(uploadsDir, { recursive: true });

    await fs.writeFile(tempPath, processed.buffer);
    await fs.rename(tempPath, finalPath);

    return {
      success: true,
      publicPath: `/uploads/news/${safeFilename}`,
      filename: safeFilename,
      sizeBytes: processed.sizeBytes,
      mimeType: processed.mimeType,
    };
  } catch {
    try {
      await fs.unlink(tempPath);
    } catch {
      // Ignore if temp file doesn't exist
    }
    return {
      success: false,
      error: "Gagal menyimpan berkas ke direktori penyimpanan.",
    };
  }
}

export async function saveNewsInlineImage(buffer: Buffer): Promise<SaveNewsImageResult> {
  const processed = await processAndValidateImageBuffer(buffer, MAX_NEWS_IMAGE_SIZE_BYTES);
  if (
    !processed.success ||
    !processed.buffer ||
    !processed.extension ||
    !processed.mimeType
  ) {
    return {
      success: false,
      error: processed.error || "Validasi format gambar gagal.",
    };
  }

  const uniqueId = crypto.randomUUID().replace(/-/g, "");
  const timestamp = Date.now();
  const safeFilename = `inline-${timestamp}-${uniqueId}.${processed.extension}`;

  const uploadsDir = path.join(process.cwd(), "public", "uploads", "news", "inline");
  const tempPath = path.join(uploadsDir, `.tmp-${safeFilename}`);
  const finalPath = path.join(uploadsDir, safeFilename);

  try {
    await fs.mkdir(uploadsDir, { recursive: true });

    await fs.writeFile(tempPath, processed.buffer);
    await fs.rename(tempPath, finalPath);

    return {
      success: true,
      publicPath: `/uploads/news/inline/${safeFilename}`,
      filename: safeFilename,
      sizeBytes: processed.sizeBytes,
      mimeType: processed.mimeType,
    };
  } catch {
    try {
      await fs.unlink(tempPath);
    } catch {
      // Ignore if temp file doesn't exist
    }
    return {
      success: false,
      error: "Gagal menyimpan berkas inline.",
    };
  }
}

export async function deleteNewsInlineImageFile(publicPath: string): Promise<boolean> {
  if (!publicPath || typeof publicPath !== "string") return false;

  const normalized = path.normalize(publicPath).replace(/^(\.\.[\/\\])+/, "");
  if (!normalized.startsWith("/uploads/news/inline/") && !normalized.startsWith("uploads/news/inline/")) {
    return false;
  }

  const prefix = normalized.startsWith("/uploads/news/inline/")
    ? "/uploads/news/inline/"
    : "uploads/news/inline/";
  const relativeSuffix = normalized.slice(prefix.length);
  if (
    !relativeSuffix ||
    relativeSuffix.includes("/") ||
    relativeSuffix.includes("\\") ||
    relativeSuffix.includes("..")
  ) {
    return false;
  }

  const filename = path.basename(relativeSuffix);
  if (!filename || filename === "." || filename === "..") return false;

  const inlineDir = path.join(process.cwd(), "public", "uploads", "news", "inline");
  const targetPath = path.join(inlineDir, filename);

  const relative = path.relative(inlineDir, targetPath);
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

export async function deleteNewsImageFile(publicPath: string): Promise<boolean> {
  if (!publicPath || typeof publicPath !== "string") return false;

  const normalized = path.normalize(publicPath).replace(/^(\.\.[\/\\])+/, "");
  if (!normalized.startsWith("/uploads/news/") && !normalized.startsWith("uploads/news/")) {
    return false;
  }

  const prefix = normalized.startsWith("/uploads/news/")
    ? "/uploads/news/"
    : "uploads/news/";
  const relativeSuffix = normalized.slice(prefix.length);
  if (
    !relativeSuffix ||
    relativeSuffix.includes("/") ||
    relativeSuffix.includes("\\") ||
    relativeSuffix.includes("..")
  ) {
    return false;
  }

  const filename = path.basename(relativeSuffix);
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
