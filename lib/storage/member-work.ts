import {
  saveImageToDirectory,
  deleteImageFromDirectory,
  type SaveImageResult,
} from "./upload-image";
import { MAX_IMAGE_SIZE_BYTES } from "./image-validation";

export const MAX_MEMBER_WORK_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_BYTES;

export async function saveMemberWorkImage(buffer: Buffer): Promise<SaveImageResult> {
  return saveImageToDirectory({
    buffer,
    subdirectory: "member-works",
    filePrefix: "work",
    maxSizeBytes: MAX_MEMBER_WORK_IMAGE_SIZE_BYTES,
  });
}

export async function deleteMemberWorkImageFile(publicPath: string): Promise<boolean> {
  return deleteImageFromDirectory("member-works", publicPath);
}
