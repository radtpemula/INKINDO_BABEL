import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import {
  MAX_IMAGE_SIZE_BYTES,
  validateImageMagicBytes,
  type SupportedImageType,
} from "./image-validation";

export interface SaveImageOptions {
  buffer: Buffer;
  subdirectory: "partners" | "member-works";
  filePrefix: "partner" | "work";
  maxSizeBytes?: number;
}

export interface SaveImageResult {
  success: boolean;
  publicPath?: string;
  filename?: string;
  sizeBytes?: number;
  mimeType?: SupportedImageType;
  error?: string;
}

export async function saveImageToDirectory(
  options: SaveImageOptions
): Promise<SaveImageResult> {
  const { buffer, subdirectory, filePrefix, maxSizeBytes = MAX_IMAGE_SIZE_BYTES } =
    options;

  if (!buffer || buffer.length === 0) {
    return {
      success: false,
      error: "Berkas gambar kosong.",
    };
  }

  if (buffer.length > maxSizeBytes) {
    return {
      success: false,
      error: "Ukuran berkas melebihi batas maksimum 5 MB.",
    };
  }

  const validation = validateImageMagicBytes(buffer);
  if (!validation.isValid || !validation.extension || !validation.mimeType) {
    return {
      success: false,
      error: validation.error || "Validasi format gambar gagal.",
    };
  }

  const uniqueId = crypto.randomUUID().replace(/-/g, "");
  const timestamp = Date.now();
  const safeFilename = `${filePrefix}-${timestamp}-${uniqueId}.${validation.extension}`;

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
    await fs.writeFile(tempPath, buffer);
    await fs.rename(tempPath, finalPath);

    return {
      success: true,
      publicPath: `/uploads/${subdirectory}/${safeFilename}`,
      filename: safeFilename,
      sizeBytes: buffer.length,
      mimeType: validation.mimeType,
    };
  } catch (err) {
    try {
      await fs.unlink(tempPath);
    } catch {
      // Temp file cleanup failure ignored
    }
    const errorMsg =
      err instanceof Error
        ? err.message
        : "Gagal menyimpan berkas ke direktori penyimpanan.";
    return {
      success: false,
      error: errorMsg,
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

  const filename = path.basename(normalized);
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
