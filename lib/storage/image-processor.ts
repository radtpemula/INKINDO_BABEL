import sharp, { type Metadata, type Sharp } from "sharp";
import {
  MAX_IMAGE_SIZE_BYTES,
  validateImageBuffer,
  validateImageMagicBytes,
  type SupportedImageType,
  type SupportedImageExtension,
} from "./image-validation";

export const MAX_IMAGE_WIDTH = 8192;
export const MAX_IMAGE_HEIGHT = 8192;
export const MAX_IMAGE_PIXELS = 33_554_432; // 32 Megapixels

export interface ProcessedImageResult {
  readonly success: boolean;
  readonly buffer?: Buffer;
  readonly mimeType?: SupportedImageType;
  readonly extension?: SupportedImageExtension;
  readonly width?: number;
  readonly height?: number;
  readonly sizeBytes?: number;
  readonly error?: string;
}

function hasWebpAnimationFlag(buffer: Buffer): boolean {
  if (buffer.length < 21) return false;
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
  if (!isRiff || !isWebp) return false;

  const isVp8x =
    buffer[12] === 0x56 &&
    buffer[13] === 0x50 &&
    buffer[14] === 0x38 &&
    buffer[15] === 0x58;

  if (isVp8x) {
    return (buffer[20] & 0x02) !== 0;
  }

  return false;
}

export async function processAndValidateImageBuffer(
  rawBuffer: Buffer,
  maxSizeBytes: number = MAX_IMAGE_SIZE_BYTES
): Promise<ProcessedImageResult> {
  const initialCheck = validateImageBuffer(rawBuffer, maxSizeBytes);
  if (!initialCheck.isValid || !initialCheck.mimeType || !initialCheck.extension) {
    return {
      success: false,
      error: initialCheck.error || "Validasi format berkas gagal.",
    };
  }

  if (hasWebpAnimationFlag(rawBuffer)) {
    return {
      success: false,
      error: "Gambar animasi atau multi-frame tidak didukung.",
    };
  }

  let metadata: Metadata;
  let pipeline: Sharp;

  try {
    pipeline = sharp(rawBuffer, {
      failOn: "warning",
      limitInputPixels: MAX_IMAGE_PIXELS,
      animated: true,
    });
    metadata = await pipeline.metadata();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message.toLowerCase() : "";
    if (message.includes("pixel limit") || message.includes("exceeds pixel")) {
      return {
        success: false,
        error: "Jumlah piksel gambar melebihi batas keamanan yang diizinkan.",
      };
    }
    return {
      success: false,
      error: "Berkas gambar rusak atau tidak dapat didekode.",
    };
  }

  if (metadata.pages && metadata.pages > 1) {
    return {
      success: false,
      error: "Gambar animasi atau multi-frame tidak didukung.",
    };
  }

  if (metadata.delay && metadata.delay.length > 1) {
    return {
      success: false,
      error: "Gambar animasi atau multi-frame tidak didukung.",
    };
  }

  const { width, height, format } = metadata;

  if (!width || !height || width <= 0 || height <= 0) {
    return {
      success: false,
      error: "Dimensi gambar tidak valid atau tidak terbaca.",
    };
  }

  if (width > MAX_IMAGE_WIDTH || height > MAX_IMAGE_HEIGHT) {
    return {
      success: false,
      error: `Dimensi gambar melebihi batas maksimum ${MAX_IMAGE_WIDTH}x${MAX_IMAGE_HEIGHT} piksel.`,
    };
  }

  if (width * height > MAX_IMAGE_PIXELS) {
    return {
      success: false,
      error: "Jumlah piksel gambar melebihi batas keamanan yang diizinkan.",
    };
  }

  const expectedMime = initialCheck.mimeType;
  let reEncodedBuffer: Buffer;
  let finalMimeType: SupportedImageType;
  let finalExtension: SupportedImageExtension;

  try {
    const baseTransformer = sharp(rawBuffer, {
      failOn: "warning",
      limitInputPixels: MAX_IMAGE_PIXELS,
    }).rotate();

    if (expectedMime === "image/jpeg" || format === "jpeg") {
      reEncodedBuffer = await baseTransformer
        .jpeg({ quality: 85, mozjpeg: true })
        .toBuffer();
      finalMimeType = "image/jpeg";
      finalExtension = "jpg";
    } else if (expectedMime === "image/png" || format === "png") {
      reEncodedBuffer = await baseTransformer
        .png({ compressionLevel: 9, effort: 7 })
        .toBuffer();
      finalMimeType = "image/png";
      finalExtension = "png";
    } else if (expectedMime === "image/webp" || format === "webp") {
      reEncodedBuffer = await baseTransformer
        .webp({ quality: 85, effort: 4 })
        .toBuffer();
      finalMimeType = "image/webp";
      finalExtension = "webp";
    } else {
      return {
        success: false,
        error: "Format gambar tidak didukung untuk re-encode.",
      };
    }
  } catch {
    return {
      success: false,
      error: "Gagal memproses dan menyandikan ulang berkas gambar.",
    };
  }

  if (reEncodedBuffer.length === 0) {
    return {
      success: false,
      error: "Hasil pemrosesan gambar kosong.",
    };
  }

  if (reEncodedBuffer.length > maxSizeBytes) {
    return {
      success: false,
      error: "Ukuran berkas hasil pemrosesan melebihi batas maksimum 5 MB.",
    };
  }

  const outputMagic = validateImageMagicBytes(reEncodedBuffer);
  if (!outputMagic.isValid || outputMagic.mimeType !== finalMimeType) {
    return {
      success: false,
      error: "Format berkas hasil pemrosesan tidak valid.",
    };
  }

  return {
    success: true,
    buffer: reEncodedBuffer,
    mimeType: finalMimeType,
    extension: finalExtension,
    width,
    height,
    sizeBytes: reEncodedBuffer.length,
  };
}
