"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  EMPTY_DEFERRED_IMAGE_SELECTION,
  defaultObjectUrlApi,
  selectDeferredImage,
  validateClientImageFile,
  type ClientImageValidationMessages,
  type DeferredImageSelection,
  type ObjectUrlApi,
} from "./deferred-image-upload";

export function revokePreviewRef(
  previewUrlRef: { current: string | null },
  urlApi: ObjectUrlApi
): void {
  if (previewUrlRef.current) {
    urlApi.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = null;
  }
}

export function useDeferredImageUpload(
  urlApi: ObjectUrlApi = defaultObjectUrlApi
) {
  const [selection, setSelection] = useState<DeferredImageSelection>(
    EMPTY_DEFERRED_IMAGE_SELECTION
  );
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const latestPreviewUrlRef = useRef<string | null>(null);
  const submitLockRef = useRef(false);

  const selectFile = useCallback(
    (file: File, messages: ClientImageValidationMessages): string | null => {
      const validationError = validateClientImageFile(file, messages);
      if (validationError) {
        return validationError;
      }
      const next = selectDeferredImage(
        { file: null, previewUrl: latestPreviewUrlRef.current },
        file,
        urlApi
      );
      latestPreviewUrlRef.current = next.previewUrl;
      setSelection(next);
      return null;
    },
    [urlApi]
  );

  const clearSelection = useCallback(() => {
    revokePreviewRef(latestPreviewUrlRef, urlApi);
    setSelection(EMPTY_DEFERRED_IMAGE_SELECTION);
  }, [urlApi]);

  const acquireLock = useCallback((): boolean => {
    if (submitLockRef.current) return false;
    submitLockRef.current = true;
    return true;
  }, []);

  const releaseLock = useCallback((): void => {
    submitLockRef.current = false;
  }, []);

  useEffect(() => {
    return () => {
      revokePreviewRef(latestPreviewUrlRef, urlApi);
    };
  }, [urlApi]);

  return {
    selectedFile: selection.file,
    previewUrl: selection.previewUrl,
    selection,
    isUploading,
    isSubmitting,
    isBusy: isUploading || isSubmitting,
    setIsUploading,
    setIsSubmitting,
    submitLockRef,
    acquireLock,
    releaseLock,
    selectFile,
    clearSelection,
  };
}
