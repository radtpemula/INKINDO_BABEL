import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import {
  MAX_IMAGE_SIZE_BYTES,
  type SupportedImageType,
} from "./image-validation";
import { processAndValidateImageBuffer } from "./image-processor";

export interface SaveImageOptions {
  readonly buffer: Buffer;
  readonly subdirectory: "partners" | "member-works";
  readonly filePrefix: "partner" | "work";
  readonly maxSizeBytes?: number;
}

export interface SaveImageResult {
  readonly success: boolean;
  readonly publicPath?: string;
  readonly filename?: string;
  readonly sizeBytes?: number;
  readonly mimeType?: SupportedImageType;
  readonly error?: string;
}

export async function saveImageToDirectory(
  options: SaveImageOptions
): Promise<SaveImageResult> {
  const { buffer, subdirectory, filePrefix, maxSizeBytes = MAX_IMAGE_SIZE_BYTES } =
    options;

  const processed = await processAndValidateImageBuffer(buffer, maxSizeBytes);
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
  const safeFilename = `${filePrefix}-${timestamp}-${uniqueId}.${processed.extension}`;

  const uploadsDir = path.join(process.cwd(), "public", "uploads", subdirectory);
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
      publicPath: `/uploads/${subdirectory}/${safeFilename}`,
      filename: safeFilename,
      sizeBytes: processed.sizeBytes,
      mimeType: processed.mimeType,
    };
  } catch {
    try {
      await fs.unlink(tempPath);
    } catch {
      // Temp file cleanup failure ignored
    }
    return {
      success: false,
      error: "Gagal menyimpan berkas ke direktori penyimpanan.",
    };
  }
}

export async function deleteImageFromDirectory(
  subdirectory: "partners" | "member-works",
  publicPath: string
): Promise<boolean> {
  if (!publicPath || typeof publicPath !== "string") return false;

  const normalized = path.normalize(publicPath).replace(/^(\.\.[\/\\])+/, "");
  const expectedPrefix = `/uploads/${subdirectory}/`;
  const altPrefix = `uploads/${subdirectory}/`;

  if (!normalized.startsWith(expectedPrefix) && !normalized.startsWith(altPrefix)) {
    return false;
  }

  const prefix = normalized.startsWith(expectedPrefix) ? expectedPrefix : altPrefix;
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

  const uploadsDir = path.join(process.cwd(), "public", "uploads", subdirectory);
  const targetPath = path.join(uploadsDir, filename);

  const relative = path.relative(uploadsDir, targetPath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    return false;
  }

  try {
    await fs.access(targetPath);
    await fs.unlink(targetPath);
    return true;
  } catch {
    return false;
  }
}
