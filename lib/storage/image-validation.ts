export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

export type SupportedImageType = "image/jpeg" | "image/png" | "image/webp";

export interface ImageValidationResult {
  isValid: boolean;
  mimeType?: SupportedImageType;
  extension?: "jpg" | "png" | "webp";
  error?: string;
}

export function validateImageMagicBytes(buffer: Buffer): ImageValidationResult {
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
