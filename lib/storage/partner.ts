import {
  saveImageToDirectory,
  deleteImageFromDirectory,
  type SaveImageResult,
} from "./upload-image";
import { MAX_IMAGE_SIZE_BYTES } from "./image-validation";

export const MAX_PARTNER_LOGO_SIZE_BYTES = MAX_IMAGE_SIZE_BYTES;

export async function savePartnerLogo(buffer: Buffer): Promise<SaveImageResult> {
  return saveImageToDirectory({
    buffer,
    subdirectory: "partners",
    filePrefix: "partner",
    maxSizeBytes: MAX_PARTNER_LOGO_SIZE_BYTES,
  });
}

export async function deletePartnerLogoFile(publicPath: string): Promise<boolean> {
  return deleteImageFromDirectory("partners", publicPath);
}
