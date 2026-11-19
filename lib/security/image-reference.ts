import { Parser } from "htmlparser2";
import { prisma as defaultPrisma } from "@/lib/prisma";
import {
  isValidHeroImagePath,
  isValidNewsCoverImagePath,
  isValidNewsInlineImagePath,
  isValidPartnerLogoPath,
  isValidMemberWorkImagePath,
} from "./image-path";

type FindFirstFn = (args: { readonly where: Record<string, unknown>; readonly select?: Record<string, unknown> }) => Promise<unknown>;

export interface PrismaReferenceClient {
  readonly heroSlide?: { findFirst: FindFirstFn };
  readonly siteSetting?: { findFirst: FindFirstFn };
  readonly newsArticle?: {
    findFirst: FindFirstFn;
    findMany: (args: { readonly where: Record<string, unknown>; readonly select?: Record<string, unknown> }) => Promise<readonly { readonly id: string; readonly content: string }[]>;
  };
  readonly partner?: { findFirst: FindFirstFn };
  readonly memberWork?: { findFirst: FindFirstFn };
}

export function extractImageSourcesFromHtml(html: string): readonly string[] {
  if (!html || typeof html !== "string") return [];
  const sources: string[] = [];
  try {
    const parser = new Parser({
      onopentag(name, attribs) {
        if (name.toLowerCase() === "img" && attribs.src) {
          const cleanSrc = attribs.src.split("?")[0]?.split("#")[0]?.trim();
          if (cleanSrc) sources.push(cleanSrc);
        }
      },
    });
    parser.write(html);
    parser.end();
  } catch {
    return [];
  }
  return sources;
}

export function normalizePathVariants(path: string): { readonly withSlash: string; readonly withoutSlash: string } {
  const trimmed = (path || "").trim();
  const withSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  const withoutSlash = trimmed.replace(/^\/+/, "");
  return { withSlash, withoutSlash };
}

export async function isHeroImageReferenced(
  imagePath: string,
  options?: {
    readonly excludeSlideId?: string;
    readonly client?: PrismaReferenceClient;
    readonly prisma?: PrismaReferenceClient;
  }
): Promise<boolean> {
  try {
    if (!imagePath || !isValidHeroImagePath(imagePath, { allowDefaultImages: true })) return true;
    const { withSlash, withoutSlash } = normalizePathVariants(imagePath);
    if (withSlash.startsWith("/images/")) return true;

    const client = (options?.client ?? options?.prisma ?? defaultPrisma) as PrismaReferenceClient;
    if (!client.heroSlide || !client.siteSetting) return true;

    const slideWhere: Record<string, unknown> = { imagePath: { in: [withSlash, withoutSlash] } };
    if (options?.excludeSlideId) slideWhere.id = { not: options.excludeSlideId };

    const slideMatch = await client.heroSlide.findFirst({ where: slideWhere, select: { id: true } });
    if (slideMatch) return true;

    const settingMatch = await client.siteSetting.findFirst({
      where: { value: { in: [withSlash, withoutSlash] } },
      select: { key: true },
    });
    return Boolean(settingMatch);
  } catch {
    return true;
  }
}

export async function isNewsCoverImageReferenced(
  imagePath: string,
  options?: {
    readonly excludeArticleId?: string;
    readonly client?: PrismaReferenceClient;
    readonly prisma?: PrismaReferenceClient;
  }
): Promise<boolean> {
  try {
    if (!imagePath || !isValidNewsCoverImagePath(imagePath)) return true;
    const { withSlash, withoutSlash } = normalizePathVariants(imagePath);

    const client = (options?.client ?? options?.prisma ?? defaultPrisma) as PrismaReferenceClient;
    if (!client.newsArticle) return true;

    const articleWhere: Record<string, unknown> = { coverImagePath: { in: [withSlash, withoutSlash] } };
    if (options?.excludeArticleId) articleWhere.id = { not: options.excludeArticleId };

    const coverMatch = await client.newsArticle.findFirst({ where: articleWhere, select: { id: true } });
    if (coverMatch) return true;

    const candidates = await client.newsArticle.findMany({
      where: { OR: [{ content: { contains: withSlash } }, { content: { contains: withoutSlash } }] },
      select: { id: true, content: true },
    });

    for (const article of candidates) {
      for (const src of extractImageSourcesFromHtml(article.content)) {
        const { withSlash: sWith, withoutSlash: sWithout } = normalizePathVariants(src);
        if (sWith === withSlash || sWithout === withoutSlash || src === withSlash || src === withoutSlash) {
          return true;
        }
      }
    }
    return false;
  } catch {
    return true;
  }
}

export async function isNewsInlineImageReferenced(
  imagePath: string,
  options?: {
    readonly excludeArticleId?: string;
    readonly client?: PrismaReferenceClient;
    readonly prisma?: PrismaReferenceClient;
  }
): Promise<boolean> {
  try {
    if (!imagePath || !isValidNewsInlineImagePath(imagePath)) return true;
    const { withSlash, withoutSlash } = normalizePathVariants(imagePath);

    const client = (options?.client ?? options?.prisma ?? defaultPrisma) as PrismaReferenceClient;
    if (!client.newsArticle) return true;

    const coverWhere: Record<string, unknown> = { coverImagePath: { in: [withSlash, withoutSlash] } };
    if (options?.excludeArticleId) coverWhere.id = { not: options.excludeArticleId };
    const coverMatch = await client.newsArticle.findFirst({ where: coverWhere, select: { id: true } });
    if (coverMatch) return true;

    const contentWhere: Record<string, unknown> = {
      OR: [{ content: { contains: withSlash } }, { content: { contains: withoutSlash } }],
    };
    if (options?.excludeArticleId) contentWhere.id = { not: options.excludeArticleId };

    const candidates = await client.newsArticle.findMany({
      where: contentWhere,
      select: { id: true, content: true },
    });

    for (const article of candidates) {
      for (const src of extractImageSourcesFromHtml(article.content)) {
        const { withSlash: sWith, withoutSlash: sWithout } = normalizePathVariants(src);
        if (sWith === withSlash || sWithout === withoutSlash || src === withSlash || src === withoutSlash) {
          return true;
        }
      }
    }
    return false;
  } catch {
    return true;
  }
}

export async function isPartnerLogoReferenced(
  logoPath: string,
  options?: {
    readonly excludePartnerId?: string;
    readonly client?: PrismaReferenceClient;
    readonly prisma?: PrismaReferenceClient;
  }
): Promise<boolean> {
  try {
    if (!logoPath || !isValidPartnerLogoPath(logoPath)) return true;
    const { withSlash, withoutSlash } = normalizePathVariants(logoPath);

    const client = (options?.client ?? options?.prisma ?? defaultPrisma) as PrismaReferenceClient;
    if (!client.partner) return true;

    const where: Record<string, unknown> = { logoPath: { in: [withSlash, withoutSlash] } };
    if (options?.excludePartnerId) where.id = { not: options.excludePartnerId };

    const match = await client.partner.findFirst({ where, select: { id: true } });
    return Boolean(match);
  } catch {
    return true;
  }
}

export async function isMemberWorkImageReferenced(
  imagePath: string,
  options?: {
    readonly excludeWorkId?: string;
    readonly excludeMemberWorkId?: string;
    readonly client?: PrismaReferenceClient;
    readonly prisma?: PrismaReferenceClient;
  }
): Promise<boolean> {
  try {
    if (!imagePath || !isValidMemberWorkImagePath(imagePath)) return true;
    const { withSlash, withoutSlash } = normalizePathVariants(imagePath);

    const client = (options?.client ?? options?.prisma ?? defaultPrisma) as PrismaReferenceClient;
    if (!client.memberWork) return true;

    const excludeId = options?.excludeWorkId ?? options?.excludeMemberWorkId;
    const where: Record<string, unknown> = { imagePath: { in: [withSlash, withoutSlash] } };
    if (excludeId) where.id = { not: excludeId };

    const match = await client.memberWork.findFirst({ where, select: { id: true } });
    return Boolean(match);
  } catch {
    return true;
  }
}
