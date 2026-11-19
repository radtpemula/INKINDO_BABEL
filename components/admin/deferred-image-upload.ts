export const MAX_DEFERRED_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_DEFERRED_IMAGE_MIME_TYPES: readonly string[] = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

export interface DeferredImageSelection {
  readonly file: File | null;
  readonly previewUrl: string | null;
}

export const EMPTY_DEFERRED_IMAGE_SELECTION: DeferredImageSelection = {
  file: null,
  previewUrl: null,
};

export interface ObjectUrlApi {
  readonly createObjectURL: (file: File) => string;
  readonly revokeObjectURL: (url: string) => void;
}

export const defaultObjectUrlApi: ObjectUrlApi = {
  createObjectURL: (file: File): string => {
    if (typeof URL !== "undefined" && typeof URL.createObjectURL === "function") {
      return URL.createObjectURL(file);
    }
    return "";
  },
  revokeObjectURL: (url: string): void => {
    if (url && typeof URL !== "undefined" && typeof URL.revokeObjectURL === "function") {
      URL.revokeObjectURL(url);
    }
  },
};

export interface ClientImageValidationMessages {
  readonly emptyFile: string;
  readonly oversizeFile: string;
  readonly invalidType: string;
}

export function validateClientImageFile(
  file: File,
  messages: ClientImageValidationMessages
): string | null {
  if (file.size <= 0) {
    return messages.emptyFile;
  }
  if (file.size > MAX_DEFERRED_IMAGE_SIZE_BYTES) {
    return messages.oversizeFile;
  }
  if (!ALLOWED_DEFERRED_IMAGE_MIME_TYPES.includes(file.type)) {
    return messages.invalidType;
  }
  return null;
}

export function selectDeferredImage(
  current: DeferredImageSelection,
  nextFile: File,
  urlApi: ObjectUrlApi = defaultObjectUrlApi
): DeferredImageSelection {
  if (current.previewUrl) {
    urlApi.revokeObjectURL(current.previewUrl);
  }
  return {
    file: nextFile,
    previewUrl: urlApi.createObjectURL(nextFile),
  };
}

export function clearDeferredImage(
  current: DeferredImageSelection,
  urlApi: ObjectUrlApi = defaultObjectUrlApi
): DeferredImageSelection {
  if (current.previewUrl) {
    urlApi.revokeObjectURL(current.previewUrl);
  }
  return EMPTY_DEFERRED_IMAGE_SELECTION;
}

export interface UploadRequestConfig {
  readonly endpoint: string;
  readonly defaultError: string;
  readonly networkError: string;
  readonly fetchFn?: typeof fetch;
}

export type UploadImageResult =
  | { readonly ok: true; readonly publicPath: string; readonly uploadToken?: string }
  | { readonly ok: false; readonly error: string };

interface ParsedUploadResponse {
  readonly success?: boolean;
  readonly publicPath?: string;
  readonly uploadToken?: string;
  readonly error?: string;
}

function parseUploadResponse(raw: unknown): ParsedUploadResponse {
  if (typeof raw !== "object" || raw === null) {
    return {};
  }
  const success =
    "success" in raw && typeof raw.success === "boolean" ? raw.success : undefined;
  const error =
    "error" in raw && typeof raw.error === "string" ? raw.error : undefined;
  const directPath =
    "path" in raw && typeof raw.path === "string" ? raw.path : undefined;
  const nestedPath =
    "data" in raw &&
    typeof raw.data === "object" &&
    raw.data !== null &&
    "publicPath" in raw.data &&
    typeof raw.data.publicPath === "string"
      ? raw.data.publicPath
      : undefined;
  const uploadToken =
    "data" in raw &&
    typeof raw.data === "object" &&
    raw.data !== null &&
    "uploadToken" in raw.data &&
    typeof raw.data.uploadToken === "string"
      ? raw.data.uploadToken
      : undefined;

  return {
    success,
    error,
    publicPath: directPath || nestedPath,
    uploadToken,
  };
}

export async function uploadDeferredImageFile(
  file: File,
  config: UploadRequestConfig
): Promise<UploadImageResult> {
  const fetcher = config.fetchFn ?? fetch;
  try {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetcher(config.endpoint, {
      method: "POST",
      body: formData,
    });

    const parsed = parseUploadResponse(await res.json());
    if (!res.ok || !parsed.success || !parsed.publicPath) {
      return {
        ok: false,
        error: parsed.error || config.defaultError,
      };
    }

    return {
      ok: true,
      publicPath: parsed.publicPath,
      uploadToken: parsed.uploadToken,
    };
  } catch {
    return { ok: false, error: config.networkError };
  }
}

export interface SaveRecordResult<TData> {
  readonly success: boolean;
  readonly data?: TData;
  readonly error?: string;
  readonly rollbackToken?: string;
}

export interface DeferredSubmitDeps<TData> {
  readonly lockRef: { current: boolean };
  readonly selection: DeferredImageSelection;
  readonly persistedImagePath: string | null;
  readonly pendingUploadToken?: string | null;
  readonly validateForm: () => boolean;
  readonly uploadConfig: UploadRequestConfig;
  readonly saveRecord: (
    resolvedImagePath: string | null,
    uploadToken?: string
  ) => Promise<SaveRecordResult<TData>>;
  readonly onUploadPhaseChange?: (uploading: boolean) => void;
  readonly onSubmitPhaseChange?: (submitting: boolean) => void;
  readonly onImageUploaded: (publicPath: string, uploadToken?: string) => void;
  readonly onSaveAttemptStart?: () => void;
}

export type DeferredSubmitOutcome<TData> =
  | { readonly status: "locked" }
  | { readonly status: "validation_failed" }
  | { readonly status: "upload_failed"; readonly error: string }
  | {
      readonly status: "save_failed";
      readonly error?: string;
      readonly resolvedImagePath: string | null;
      readonly uploadToken?: string;
      readonly rollbackToken?: string;
    }
  | {
      readonly status: "unexpected_error";
      readonly resolvedImagePath: string | null;
      readonly saveAttempted: boolean;
    }
  | { readonly status: "succeeded"; readonly data: TData; readonly resolvedImagePath: string | null };

export async function executeDeferredSubmit<TData>(
  deps: DeferredSubmitDeps<TData>
): Promise<DeferredSubmitOutcome<TData>> {
  if (deps.lockRef.current) {
    return { status: "locked" };
  }
  if (!deps.validateForm()) {
    return { status: "validation_failed" };
  }

  deps.lockRef.current = true;
  deps.onSubmitPhaseChange?.(true);

  let resolvedPath = deps.persistedImagePath;
  let resolvedUploadToken: string | undefined =
    deps.pendingUploadToken && deps.pendingUploadToken.trim()
      ? deps.pendingUploadToken
      : undefined;
  let saveAttempted = false;

  try {
    if (deps.selection.file !== null) {
      deps.onUploadPhaseChange?.(true);
      const uploadResult = await uploadDeferredImageFile(
        deps.selection.file,
        deps.uploadConfig
      );
      deps.onUploadPhaseChange?.(false);

      if (!uploadResult.ok) {
        return { status: "upload_failed", error: uploadResult.error };
      }

      resolvedPath = uploadResult.publicPath;
      resolvedUploadToken = uploadResult.uploadToken;
      deps.onImageUploaded(uploadResult.publicPath, uploadResult.uploadToken);
    }

    deps.onSaveAttemptStart?.();
    saveAttempted = true;
    const saveResult = await deps.saveRecord(resolvedPath, resolvedUploadToken);
    if (!saveResult.success || saveResult.data === undefined) {
      return {
        status: "save_failed",
        error: saveResult.error,
        resolvedImagePath: resolvedPath,
        uploadToken: resolvedUploadToken,
        rollbackToken: saveResult.rollbackToken,
      };
    }

    return {
      status: "succeeded",
      data: saveResult.data,
      resolvedImagePath: resolvedPath,
    };
  } catch {
    return {
      status: "unexpected_error",
      resolvedImagePath: saveAttempted ? resolvedPath : deps.persistedImagePath,
      saveAttempted,
    };
  } finally {
    deps.onUploadPhaseChange?.(false);
    deps.onSubmitPhaseChange?.(false);
    deps.lockRef.current = false;
  }
}
