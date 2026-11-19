"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin, type AuthenticatedAdmin } from "@/lib/auth/server";
import { deleteNewsImageFile } from "@/lib/storage/news";
import {
  CONTENT_MARKER_V1_HTML,
  encodeArticleContent,
  parseArticleContent,
  extractPlainText,
  stripHtmlTags,
  sanitizeNewsHtml,
  isValidNewsCoverImagePath,
  isNewsCoverImageReferenced,
} from "@/lib/security";
import {
  runLockedUploadCommit,
  safeDeleteUnreferencedImage,
} from "./action-upload-guard";
import {
  cleanupArticleInlineImagesOnDelete,
  cleanupUnusedInlineImagesPostSave,
  type SessionInlineUploadItem,
} from "./news-inline-cleanup";

export interface ActionResult<T = unknown> {
  success: boolean;
  message?: string;
  error?: string;
  data?: T;
  rollbackToken?: string;
}

export interface NewsArticleItem {
  id: string;
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  content: string;
  coverImagePath: string | null;
  coverImageAlt: string | null;
  authorName: string;
  readTime: string | null;
  isPublished: boolean;
  publishedAt: string | null;
  views: number;
  createdAt: string;
  updatedAt: string;
}

export interface GetNewsArticlesOptions {
  search?: string;
  category?: string;
  status?: "all" | "published" | "draft";
  page?: number;
  limit?: number;
}

export interface NewsArticlesListResult {
  articles: NewsArticleItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateNewsArticleInput {
  title: string;
  category: string;
  excerpt: string;
  content: string;
  authorName?: string;
  slug?: string;
  coverImagePath?: string | null;
  uploadToken?: string;
  inlineUploads?: readonly SessionInlineUploadItem[];
  coverImageAlt?: string | null;
  readTime?: string | null;
  isPublished?: boolean;
  publishedAt?: string | null;
}

export interface UpdateNewsArticleInput {
  id: string;
  title?: string;
  category?: string;
  excerpt?: string;
  content?: string;
  authorName?: string;
  slug?: string;
  coverImagePath?: string | null;
  uploadToken?: string;
  inlineUploads?: readonly SessionInlineUploadItem[];
  coverImageAlt?: string | null;
  readTime?: string | null;
  isPublished?: boolean;
  publishedAt?: string | null;
}

async function verifyActiveAdmin(): Promise<AuthenticatedAdmin> {
  const auth = await getCurrentAdmin();
  if (!auth.success) {
    throw new Error("Akses ditolak: Sesi administrator tidak valid atau telah berakhir.");
  }
  if (!auth.user.isActive) {
    throw new Error("Akses ditolak: Akun administrator Anda telah dinonaktifkan.");
  }
  return auth.user;
}

function sanitizeInput(val: unknown): string {
  if (typeof val !== "string") return "";
  return val.trim();
}

function slugify(text: string): string {
  const slug = text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

  return slug || `berita-${Date.now()}`;
}

async function resolveUniqueSlug(baseSlug: string, excludeId?: string): Promise<string> {
  let candidate = baseSlug;
  let counter = 1;

  while (counter < 1000) {
    const existing = await prisma.newsArticle.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });

    if (!existing || (excludeId && existing.id === excludeId)) {
      return candidate;
    }

    candidate = `${baseSlug}-${counter}`;
    counter++;
  }

  return `${baseSlug}-${Date.now()}`;
}

function isValidNewsImagePath(imagePath: string): boolean {
  return isValidNewsCoverImagePath(imagePath);
}

function calculateReadTime(text: string): string {
  try {
    const plain = extractPlainText(text);
    const words = plain.trim().split(/\s+/).filter(Boolean).length;
    const minutes = Math.max(1, Math.ceil(words / 200));
    return `${minutes} menit baca`;
  } catch {
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    const minutes = Math.max(1, Math.ceil(words / 200));
    return `${minutes} menit baca`;
  }
}

function safeRevalidate() {
  try {
    revalidatePath("/babel-and-adt/news");
    revalidatePath("/berita-informasi/rilis-berita");
    revalidatePath("/");
  } catch {
    // Ignore outside request context
  }
}

export async function getNewsArticlesAction(
  options?: GetNewsArticlesOptions
): Promise<ActionResult<NewsArticlesListResult>> {
  try {
    await verifyActiveAdmin();

    const search = sanitizeInput(options?.search);
    const category = sanitizeInput(options?.category);
    const status = options?.status ?? "all";
    const page = Math.max(1, Number(options?.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(options?.limit) || 10));
    const skip = (page - 1) * limit;

    const where: Prisma.NewsArticleWhereInput = {};

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { slug: { contains: search } },
      ];
    }

    if (category && category !== "all") {
      where.category = category;
    }

    if (status === "published") {
      where.isPublished = true;
    } else if (status === "draft") {
      where.isPublished = false;
    }

    const [total, articles] = await Promise.all([
      prisma.newsArticle.count({ where }),
      prisma.newsArticle.findMany({
        where,
        orderBy: [{ createdAt: "desc" }],
        skip,
        take: limit,
      }),
    ]);

    const formatted: NewsArticleItem[] = articles.map((a) => ({
      id: a.id,
      title: a.title,
      slug: a.slug,
      category: a.category,
      excerpt: a.excerpt,
      content: a.content,
      coverImagePath: a.coverImagePath,
      coverImageAlt: a.coverImageAlt,
      authorName: a.authorName,
      readTime: a.readTime,
      isPublished: a.isPublished,
      publishedAt: a.publishedAt ? a.publishedAt.toISOString() : null,
      views: a.views,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
    }));

    return {
      success: true,
      data: {
        articles: formatted,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Gagal memuat daftar berita.",
    };
  }
}

export async function createNewsArticleAction(
  input: CreateNewsArticleInput
): Promise<ActionResult<NewsArticleItem>> {
  try {
    const admin = await verifyActiveAdmin();
    const rawCoverCandidate = sanitizeInput(input.coverImagePath);
    const candidateCoverPath = rawCoverCandidate
      ? rawCoverCandidate.startsWith("/")
        ? rawCoverCandidate
        : `/${rawCoverCandidate}`
      : null;

    return await runLockedUploadCommit<NewsArticleItem>({
      adminId: admin.id,
      module: "news-cover",
      publicPath: candidateCoverPath,
      uploadToken: input.uploadToken,
      fallbackError: "Gagal membuat artikel berita.",
      uniqueConstraintError:
        "Slug berita sudah digunakan. Silakan gunakan slug lain.",
      operation: async () => {
        const title = sanitizeInput(input.title);
        if (!title || title.length < 3) {
          return {
            success: false,
            definiteFailure: true,
            error: "Judul berita wajib diisi minimal 3 karakter.",
          };
        }
        if (title.length > 200) {
          return {
            success: false,
            definiteFailure: true,
            error: "Judul berita maksimal 200 karakter.",
          };
        }

        const category = sanitizeInput(input.category);
        if (!category || category.length < 2) {
          return {
            success: false,
            definiteFailure: true,
            error: "Kategori berita wajib dipilih atau diisi.",
          };
        }
        if (category.length > 100) {
          return {
            success: false,
            definiteFailure: true,
            error: "Kategori berita maksimal 100 karakter.",
          };
        }

        const excerpt = sanitizeInput(input.excerpt);
        if (!excerpt || excerpt.length < 5) {
          return {
            success: false,
            definiteFailure: true,
            error: "Ringkasan berita wajib diisi minimal 5 karakter.",
          };
        }
        if (excerpt.length > 500) {
          return {
            success: false,
            definiteFailure: true,
            error: "Ringkasan berita maksimal 500 karakter.",
          };
        }

        if (typeof input.content !== "string") {
          return {
            success: false,
            definiteFailure: true,
            error: "Isi artikel berita wajib diisi.",
          };
        }
        if (input.content.length > 500000) {
          return {
            success: false,
            definiteFailure: true,
            error: "Isi artikel melebihi batas maksimum 500.000 karakter.",
          };
        }

        const parsedContent = parseArticleContent(input.content);
        if (parsedContent.isRichText && !parsedContent.isSupported) {
          return {
            success: false,
            definiteFailure: true,
            error:
              parsedContent.error ||
              `Format konten tidak didukung: v${parsedContent.version}:${parsedContent.formatIdentifier || "unknown"}.`,
          };
        }

        let finalContent: string;
        let meaningfulText: string;

        if (parsedContent.isRichText && parsedContent.format === "html") {
          const cleanHtml = sanitizeNewsHtml(parsedContent.body);
          meaningfulText = stripHtmlTags(cleanHtml);
          if (!meaningfulText) {
            return {
              success: false,
              definiteFailure: true,
              error: "Isi artikel berita wajib diisi.",
            };
          }
          if (meaningfulText.length < 10) {
            return {
              success: false,
              definiteFailure: true,
              error: "Isi artikel berita minimal 10 karakter teks.",
            };
          }
          finalContent = encodeArticleContent(cleanHtml, CONTENT_MARKER_V1_HTML);
        } else {
          meaningfulText = stripHtmlTags(input.content);
          if (!meaningfulText) {
            return {
              success: false,
              definiteFailure: true,
              error: "Isi artikel berita wajib diisi.",
            };
          }
          if (meaningfulText.length < 10) {
            return {
              success: false,
              definiteFailure: true,
              error: "Isi artikel berita minimal 10 karakter teks.",
            };
          }
          finalContent = input.content.trim();
        }

        const authorName =
          sanitizeInput(input.authorName) || "Sekretariat INKINDO BABEL";
        if (authorName.length > 150) {
          return {
            success: false,
            definiteFailure: true,
            error: "Nama penulis maksimal 150 karakter.",
          };
        }

        let finalSlug: string;
        const customSlug = sanitizeInput(input.slug);
        if (customSlug) {
          finalSlug = slugify(customSlug);
          const exists = await prisma.newsArticle.findUnique({
            where: { slug: finalSlug },
            select: { id: true },
          });
          if (exists) {
            return {
              success: false,
              definiteFailure: true,
              error: "Slug berita sudah digunakan. Silakan gunakan slug lain.",
            };
          }
        } else {
          finalSlug = await resolveUniqueSlug(slugify(title));
        }

        let coverImagePath: string | null = null;
        if (rawCoverCandidate) {
          if (!isValidNewsImagePath(rawCoverCandidate)) {
            return {
              success: false,
              definiteFailure: true,
              error:
                "Jalur gambar sampul tidak valid. Gunakan gambar dari direktori /uploads/news/.",
            };
          }
          coverImagePath = candidateCoverPath;
        }

        const coverImageAlt = sanitizeInput(input.coverImageAlt) || title;
        const readTime =
          sanitizeInput(input.readTime) || calculateReadTime(meaningfulText);

        const isPublished = Boolean(input.isPublished);
        let publishedAt: Date | null = null;
        if (isPublished) {
          if (input.publishedAt) {
            const parsed = new Date(input.publishedAt);
            publishedAt = isNaN(parsed.getTime()) ? new Date() : parsed;
          } else {
            publishedAt = new Date();
          }
        }

        const created = await prisma.newsArticle.create({
          data: {
            title,
            slug: finalSlug,
            category,
            excerpt,
            content: finalContent,
            authorName,
            coverImagePath,
            coverImageAlt,
            readTime,
            isPublished,
            publishedAt,
          },
        });

        await cleanupUnusedInlineImagesPostSave({
          newHtml: finalContent,
          sessionUploads: input.inlineUploads,
          prisma,
        });

        safeRevalidate();

        return {
          success: true,
          message: "Artikel berita berhasil dibuat.",
          data: {
            id: created.id,
            title: created.title,
            slug: created.slug,
            category: created.category,
            excerpt: created.excerpt,
            content: created.content,
            coverImagePath: created.coverImagePath,
            coverImageAlt: created.coverImageAlt,
            authorName: created.authorName,
            readTime: created.readTime,
            isPublished: created.isPublished,
            publishedAt: created.publishedAt
              ? created.publishedAt.toISOString()
              : null,
            views: created.views,
            createdAt: created.createdAt.toISOString(),
            updatedAt: created.updatedAt.toISOString(),
          },
        };
      },
    });
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Gagal membuat artikel berita.",
    };
  }
}

export async function updateNewsArticleAction(
  input: UpdateNewsArticleInput
): Promise<ActionResult<NewsArticleItem>> {
  try {
    const admin = await verifyActiveAdmin();
    const rawCoverCandidate =
      input.coverImagePath !== undefined && input.coverImagePath !== null
        ? sanitizeInput(input.coverImagePath)
        : "";
    const candidateCoverPath = rawCoverCandidate
      ? rawCoverCandidate.startsWith("/")
        ? rawCoverCandidate
        : `/${rawCoverCandidate}`
      : null;

    let oldImageToDelete: string | null = null;
    let existingContent: string | null = null;

    const result = await runLockedUploadCommit<NewsArticleItem>({
      adminId: admin.id,
      module: "news-cover",
      publicPath: candidateCoverPath,
      uploadToken: input.uploadToken,
      fallbackError: "Gagal memperbarui artikel berita.",
      uniqueConstraintError: "Slug berita sudah digunakan oleh artikel lain.",
      operation: async () => {
        const id = sanitizeInput(input.id);
        if (!id) {
          return {
            success: false,
            definiteFailure: true,
            error: "ID artikel berita tidak valid.",
          };
        }

        const existing = await prisma.newsArticle.findUnique({ where: { id } });
        if (!existing) {
          return {
            success: false,
            definiteFailure: true,
            error: "Artikel berita tidak ditemukan.",
          };
        }
        existingContent = existing.content;

        const existingParsed = parseArticleContent(existing.content);
        if (existingParsed.isRichText && !existingParsed.isSupported) {
          return {
            success: false,
            definiteFailure: true,
            error:
              "Artikel ini memiliki format konten yang tidak didukung dan terkunci untuk mencegah kerusakan data.",
          };
        }

        const updateData: Prisma.NewsArticleUpdateInput = {};

        if (input.title !== undefined) {
          const title = sanitizeInput(input.title);
          if (!title || title.length < 3) {
            return {
              success: false,
              definiteFailure: true,
              error: "Judul berita wajib diisi minimal 3 karakter.",
            };
          }
          if (title.length > 200) {
            return {
              success: false,
              definiteFailure: true,
              error: "Judul berita maksimal 200 karakter.",
            };
          }
          updateData.title = title;
        }

        if (input.category !== undefined) {
          const category = sanitizeInput(input.category);
          if (!category || category.length < 2) {
            return {
              success: false,
              definiteFailure: true,
              error: "Kategori berita wajib dipilih atau diisi.",
            };
          }
          if (category.length > 100) {
            return {
              success: false,
              definiteFailure: true,
              error: "Kategori berita maksimal 100 karakter.",
            };
          }
          updateData.category = category;
        }

        if (input.excerpt !== undefined) {
          const excerpt = sanitizeInput(input.excerpt);
          if (!excerpt || excerpt.length < 5) {
            return {
              success: false,
              definiteFailure: true,
              error: "Ringkasan berita wajib diisi minimal 5 karakter.",
            };
          }
          if (excerpt.length > 500) {
            return {
              success: false,
              definiteFailure: true,
              error: "Ringkasan berita maksimal 500 karakter.",
            };
          }
          updateData.excerpt = excerpt;
        }

        if (input.content !== undefined) {
          if (typeof input.content !== "string") {
            return {
              success: false,
              definiteFailure: true,
              error: "Isi artikel berita tidak valid.",
            };
          }
          if (input.content.length > 500000) {
            return {
              success: false,
              definiteFailure: true,
              error: "Isi artikel melebihi batas maksimum 500.000 karakter.",
            };
          }

          const parsedInput = parseArticleContent(input.content);
          if (parsedInput.isRichText && !parsedInput.isSupported) {
            return {
              success: false,
              definiteFailure: true,
              error:
                parsedInput.error ||
                `Format konten tidak didukung: v${parsedInput.version}:${parsedInput.formatIdentifier || "unknown"}.`,
            };
          }

          let finalContent: string;
          let meaningfulText: string;

          if (parsedInput.isRichText && parsedInput.format === "html") {
            const cleanHtml = sanitizeNewsHtml(parsedInput.body);
            meaningfulText = stripHtmlTags(cleanHtml);
            if (!meaningfulText) {
              return {
                success: false,
                definiteFailure: true,
                error: "Isi artikel berita wajib diisi.",
              };
            }
            if (meaningfulText.length < 10) {
              return {
                success: false,
                definiteFailure: true,
                error: "Isi artikel berita minimal 10 karakter teks.",
              };
            }
            finalContent = encodeArticleContent(cleanHtml, CONTENT_MARKER_V1_HTML);
          } else {
            meaningfulText = stripHtmlTags(input.content);
            if (!meaningfulText) {
              return {
                success: false,
                definiteFailure: true,
                error: "Isi artikel berita wajib diisi.",
              };
            }
            if (meaningfulText.length < 10) {
              return {
                success: false,
                definiteFailure: true,
                error: "Isi artikel berita minimal 10 karakter teks.",
              };
            }
            finalContent = input.content.trim();
          }

          updateData.content = finalContent;
          if (input.readTime === undefined) {
            updateData.readTime = calculateReadTime(meaningfulText);
          }
        }

        if (input.authorName !== undefined) {
          const authorName =
            sanitizeInput(input.authorName) || "Sekretariat INKINDO BABEL";
          if (authorName.length > 150) {
            return {
              success: false,
              definiteFailure: true,
              error: "Nama penulis maksimal 150 karakter.",
            };
          }
          updateData.authorName = authorName;
        }

        if (input.slug !== undefined) {
          const requestedSlug = slugify(sanitizeInput(input.slug));
          if (!requestedSlug) {
            return {
              success: false,
              definiteFailure: true,
              error: "Slug berita tidak valid.",
            };
          }
          if (requestedSlug !== existing.slug) {
            const slugOwner = await prisma.newsArticle.findFirst({
              where: { slug: requestedSlug, id: { not: existing.id } },
              select: { id: true },
            });
            if (slugOwner) {
              return {
                success: false,
                definiteFailure: true,
                error: "Slug berita sudah digunakan oleh artikel lain.",
              };
            }
            updateData.slug = requestedSlug;
          }
        }

        if (input.coverImagePath !== undefined) {
          if (input.coverImagePath === null || rawCoverCandidate === "") {
            if (existing.coverImagePath) {
              oldImageToDelete = existing.coverImagePath;
            }
            updateData.coverImagePath = null;
          } else {
            if (!isValidNewsImagePath(rawCoverCandidate)) {
              return {
                success: false,
                definiteFailure: true,
                error:
                  "Jalur gambar sampul tidak valid. Gunakan gambar dari direktori /uploads/news/.",
              };
            }
            if (existing.coverImagePath && existing.coverImagePath !== candidateCoverPath) {
              oldImageToDelete = existing.coverImagePath;
            }
            updateData.coverImagePath = candidateCoverPath;
          }
        }

        if (input.coverImageAlt !== undefined) {
          updateData.coverImageAlt = sanitizeInput(input.coverImageAlt);
        }

        if (input.readTime !== undefined && input.readTime !== null) {
          updateData.readTime = sanitizeInput(input.readTime);
        }

        if (input.isPublished !== undefined) {
          const nextPublished = Boolean(input.isPublished);
          updateData.isPublished = nextPublished;

          if (nextPublished) {
            if (input.publishedAt) {
              const parsed = new Date(input.publishedAt);
              updateData.publishedAt = isNaN(parsed.getTime()) ? new Date() : parsed;
            } else if (!existing.publishedAt) {
              updateData.publishedAt = new Date();
            }
          }
        } else if (input.publishedAt !== undefined) {
          if (input.publishedAt) {
            const parsed = new Date(input.publishedAt);
            updateData.publishedAt = isNaN(parsed.getTime())
              ? existing.publishedAt
              : parsed;
          } else {
            updateData.publishedAt = null;
          }
        }

        const updated = await prisma.newsArticle.update({
          where: { id },
          data: updateData,
        });

        return {
          success: true,
          message: "Artikel berita berhasil diperbarui.",
          data: {
            id: updated.id,
            title: updated.title,
            slug: updated.slug,
            category: updated.category,
            excerpt: updated.excerpt,
            content: updated.content,
            coverImagePath: updated.coverImagePath,
            coverImageAlt: updated.coverImageAlt,
            authorName: updated.authorName,
            readTime: updated.readTime,
            isPublished: updated.isPublished,
            publishedAt: updated.publishedAt
              ? updated.publishedAt.toISOString()
              : null,
            views: updated.views,
            createdAt: updated.createdAt.toISOString(),
            updatedAt: updated.updatedAt.toISOString(),
          },
        };
      },
    });

    if (!result.success) {
      return result;
    }

    if (oldImageToDelete) {
      await safeDeleteUnreferencedImage({
        publicPath: oldImageToDelete,
        isReferenced: (p) => isNewsCoverImageReferenced(p, { prisma }),
        deleteFile: deleteNewsImageFile,
        logLabel: "Gagal membersihkan berkas sampul berita lama:",
      });
    }

    if (result.data) {
      await cleanupUnusedInlineImagesPostSave({
        oldHtml: existingContent,
        newHtml: result.data.content,
        sessionUploads: input.inlineUploads,
        prisma,
      });
    }

    safeRevalidate();
    return result;
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Gagal memperbarui artikel berita.",
    };
  }
}

export async function deleteNewsArticleAction(articleId: string): Promise<ActionResult<boolean>> {
  try {
    await verifyActiveAdmin();

    const id = sanitizeInput(articleId);
    if (!id) {
      return { success: false, error: "ID artikel berita tidak valid." };
    }

    const existing = await prisma.newsArticle.findUnique({
      where: { id },
      select: { id: true, coverImagePath: true, content: true },
    });

    if (!existing) {
      return { success: false, error: "Artikel berita tidak ditemukan." };
    }

    await prisma.newsArticle.delete({ where: { id } });

    if (existing.coverImagePath) {
      await safeDeleteUnreferencedImage({
        publicPath: existing.coverImagePath,
        isReferenced: (p) => isNewsCoverImageReferenced(p, { prisma }),
        deleteFile: deleteNewsImageFile,
        logLabel: "Gagal membersihkan berkas sampul berita setelah penghapusan record:",
      });
    }

    await cleanupArticleInlineImagesOnDelete(existing.content, prisma);

    safeRevalidate();

    return {
      success: true,
      message: "Artikel berita berhasil dihapus.",
      data: true,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Gagal menghapus artikel berita.",
    };
  }
}

export async function toggleNewsPublishAction(
  articleId: string
): Promise<ActionResult<{ id: string; isPublished: boolean; publishedAt: string | null }>> {
  try {
    await verifyActiveAdmin();

    const id = sanitizeInput(articleId);
    if (!id) {
      return { success: false, error: "ID artikel berita tidak valid." };
    }

    const existing = await prisma.newsArticle.findUnique({
      where: { id },
      select: { id: true, isPublished: true, publishedAt: true, content: true },
    });

    if (!existing) {
      return { success: false, error: "Artikel berita tidak ditemukan." };
    }

    const existingParsed = parseArticleContent(existing.content);
    if (existingParsed.isRichText && !existingParsed.isSupported) {
      return {
        success: false,
        error: "Artikel dengan format konten yang tidak didukung tidak dapat dipublikasikan.",
      };
    }

    const nextPublished = !existing.isPublished;
    let nextPublishedAt = existing.publishedAt;

    if (nextPublished && !existing.publishedAt) {
      nextPublishedAt = new Date();
    }

    const updated = await prisma.newsArticle.update({
      where: { id },
      data: {
        isPublished: nextPublished,
        publishedAt: nextPublishedAt,
      },
      select: {
        id: true,
        isPublished: true,
        publishedAt: true,
      },
    });

    safeRevalidate();

    return {
      success: true,
      message: `Artikel berita berhasil ${updated.isPublished ? "dipublikasikan" : "diubah menjadi draft"}.`,
      data: {
        id: updated.id,
        isPublished: updated.isPublished,
        publishedAt: updated.publishedAt ? updated.publishedAt.toISOString() : null,
      },
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Gagal mengubah status publikasi artikel berita.",
    };
  }
}
