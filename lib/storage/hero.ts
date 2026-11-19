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

export const MAX_HERO_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_BYTES;

export type { SupportedImageType, ImageValidationResult };
export { validateImageMagicBytes };

export interface SaveHeroImageResult {
  readonly success: boolean;
  readonly publicPath?: string;
  readonly filename?: string;
  readonly sizeBytes?: number;
  readonly mimeType?: SupportedImageType;
  readonly error?: string;
}

export async function saveHeroImage(buffer: Buffer): Promise<SaveHeroImageResult> {
  const processed = await processAndValidateImageBuffer(buffer, MAX_HERO_IMAGE_SIZE_BYTES);
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
  const safeFilename = `hero-${timestamp}-${uniqueId}.${processed.extension}`;

  const uploadsDir = path.join(process.cwd(), "public", "uploads", "hero");
  const tempPath = path.join(uploadsDir, `.tmp-${safeFilename}`);
  const finalPath = path.join(uploadsDir, safeFilename);

  const relative = path.relative(uploadsDir, finalPath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    return {
      success: false,
      error: "Jalur berkas tidak aman.",
    };
  }

  try {
    await fs.mkdir(uploadsDir, { recursive: true });

    await fs.writeFile(tempPath, processed.buffer);
    await fs.rename(tempPath, finalPath);

    return {
      success: true,
      publicPath: `/uploads/hero/${safeFilename}`,
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

export async function deleteHeroImageFile(publicPath: string): Promise<boolean> {
  if (!publicPath || typeof publicPath !== "string") return false;

  const normalized = path.normalize(publicPath).replace(/^(\.\.[\/\\])+/, "");
  if (!normalized.startsWith("/uploads/hero/") && !normalized.startsWith("uploads/hero/")) {
    return false;
  }

  const prefix = normalized.startsWith("/uploads/hero/")
    ? "/uploads/hero/"
    : "uploads/hero/";
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

  const uploadsDir = path.join(process.cwd(), "public", "uploads", "hero");
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

