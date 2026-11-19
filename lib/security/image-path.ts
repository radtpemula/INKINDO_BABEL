export function hasDangerousCharacters(path: string): boolean {
  return (
    path.includes("..") ||
    path.includes("\\") ||
    path.includes("//") ||
    path.includes("%") ||
    path.includes(":") ||
    path.includes("?") ||
    path.includes("#") ||
    path.includes("\0")
  );
}

export function normalizeLeadingSlash(path: string): string {
  const trimmed = path.trim();
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

export function isValidNewsUploadImagePath(src: string | null | undefined): boolean {
  if (!src || typeof src !== "string") return false;
  const trimmed = src.trim();
  if (hasDangerousCharacters(trimmed)) return false;
  const normalized = normalizeLeadingSlash(trimmed);
  return /^\/uploads\/news\/(?:inline\/)?[a-zA-Z0-9_-]+\.(?:jpg|jpeg|png|webp)$/i.test(
    normalized
  );
}

export function isValidNewsCoverImagePath(src: string | null | undefined): boolean {
  if (!src || typeof src !== "string") return false;
  const trimmed = src.trim();
  if (hasDangerousCharacters(trimmed)) return false;
  const normalized = normalizeLeadingSlash(trimmed);
  return /^\/uploads\/news\/[a-zA-Z0-9_-]+\.(?:jpg|jpeg|png|webp)$/i.test(
    normalized
  );
}

export function isValidNewsInlineImagePath(src: string | null | undefined): boolean {
  if (!src || typeof src !== "string") return false;
  const trimmed = src.trim();
  if (hasDangerousCharacters(trimmed)) return false;
  const normalized = normalizeLeadingSlash(trimmed);
  return /^\/uploads\/news\/inline\/[a-zA-Z0-9_-]+\.(?:jpg|jpeg|png|webp)$/i.test(
    normalized
  );
}

export function isValidHeroImagePath(
  src: string | null | undefined,
  options?: { readonly allowDefaultImages?: boolean }
): boolean {
  if (!src || typeof src !== "string") return false;
  const trimmed = src.trim();
  if (hasDangerousCharacters(trimmed)) return false;
  const normalized = normalizeLeadingSlash(trimmed);

  if (/^\/uploads\/hero\/[a-zA-Z0-9_-]+\.(?:jpg|jpeg|png|webp)$/i.test(normalized)) {
    return true;
  }

  if (
    options?.allowDefaultImages &&
    /^\/images\/[a-zA-Z0-9_-]+\.(?:jpg|jpeg|png|webp)$/i.test(normalized)
  ) {
    return true;
  }

  return false;
}

export function isValidPartnerLogoPath(
  src: string | null | undefined,
  options?: { readonly optional?: boolean }
): boolean {
  if (src === null || src === undefined) {
    return Boolean(options?.optional);
  }
  if (typeof src !== "string") return false;
  const trimmed = src.trim();
  if (trimmed === "") {
    return Boolean(options?.optional);
  }
  if (hasDangerousCharacters(trimmed)) return false;
  const normalized = normalizeLeadingSlash(trimmed);
  return /^\/uploads\/partners\/[a-zA-Z0-9_-]+\.(?:jpg|jpeg|png|webp)$/i.test(
    normalized
  );
}

export function isValidMemberWorkImagePath(
  src: string | null | undefined,
  options?: { readonly optional?: boolean }
): boolean {
  if (src === null || src === undefined) {
    return Boolean(options?.optional);
  }
  if (typeof src !== "string") return false;
  const trimmed = src.trim();
  if (trimmed === "") {
    return Boolean(options?.optional);
  }
  if (hasDangerousCharacters(trimmed)) return false;
  const normalized = normalizeLeadingSlash(trimmed);
  return /^\/uploads\/member-works\/[a-zA-Z0-9_-]+\.(?:jpg|jpeg|png|webp)$/i.test(
    normalized
  );
}
