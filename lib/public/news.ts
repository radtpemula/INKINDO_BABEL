import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { newsArticles } from "@/data/landing";

export interface PublicNewsArticle {
  id: string;
  title: string;
  slug: string | null;
  category: string;
  excerpt: string;
  content?: string;
  coverImagePath: string | null;
  coverImageAlt: string | null;
  authorName: string;
  readTime: string;
  publishedAt: string;
  publishedDateIso?: string;
  views?: number;
  isFallback: boolean;
}

export interface PublicNewsArchiveOptions {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
}

export interface PublicNewsArchiveResult {
  articles: PublicNewsArticle[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  categories: string[];
  isFallback: boolean;
}

function formatIndonesianDate(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

function getStaticNewsFallback(): PublicNewsArticle[] {
  // ponytail: static data used only when 0 published news in DB
  return newsArticles.map((item) => ({
    id: item.id,
    title: item.title,
    slug: null,
    category: item.category,
    excerpt: item.description,
    content: item.description,
    coverImagePath: null,
    coverImageAlt: item.imagePlaceholderText,
    authorName: "Sekretariat INKINDO BABEL",
    readTime: item.readTime,
    publishedAt: item.date,
    isFallback: true,
  }));
}

export async function getPublicLatestNews(limit = 6): Promise<PublicNewsArticle[]> {
  try {
    const publishedCount = await prisma.newsArticle.count({
      where: { isPublished: true },
    });

    if (publishedCount === 0) {
      return getStaticNewsFallback().slice(0, limit);
    }

    const rows = await prisma.newsArticle.findMany({
      where: { isPublished: true },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take: limit,
      select: {
        id: true,
        title: true,
        slug: true,
        category: true,
        excerpt: true,
        coverImagePath: true,
        coverImageAlt: true,
        authorName: true,
        readTime: true,
        publishedAt: true,
        createdAt: true,
      },
    });

    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      slug: r.slug,
      category: r.category,
      excerpt: r.excerpt,
      coverImagePath: r.coverImagePath,
      coverImageAlt: r.coverImageAlt || r.title,
      authorName: r.authorName,
      readTime: r.readTime || "3 menit baca",
      publishedAt: formatIndonesianDate(r.publishedAt || r.createdAt),
      publishedDateIso: (r.publishedAt || r.createdAt).toISOString(),
      isFallback: false,
    }));
  } catch {
    return getStaticNewsFallback().slice(0, limit);
  }
}

export async function getPublicNewsArchive(
  options: PublicNewsArchiveOptions = {}
): Promise<PublicNewsArchiveResult> {
  const page = Math.max(1, options.page || 1);
  const limit = Math.min(50, Math.max(1, options.limit || 9));
  const search = options.search?.trim() || "";
  const category = options.category?.trim() || "Semua";

  try {
    const totalPublished = await prisma.newsArticle.count({
      where: { isPublished: true },
    });

    if (totalPublished === 0) {
      const allStatic = getStaticNewsFallback();
      const distinctCats = Array.from(new Set(allStatic.map((a) => a.category)));
      const categories = ["Semua", ...distinctCats];

      let filtered = allStatic;
      if (category !== "Semua") {
        filtered = filtered.filter((a) => a.category === category);
      }
      if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter(
          (a) =>
            a.title.toLowerCase().includes(q) ||
            a.excerpt.toLowerCase().includes(q) ||
            a.category.toLowerCase().includes(q)
        );
      }

      const total = filtered.length;
      const totalPages = Math.ceil(total / limit) || 1;
      const paginated = filtered.slice((page - 1) * limit, page * limit);

      return {
        articles: paginated,
        total,
        page,
        limit,
        totalPages,
        categories,
        isFallback: true,
      };
    }

    const where: Prisma.NewsArticleWhereInput = {
      isPublished: true,
    };

    if (category !== "Semua") {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { excerpt: { contains: search } },
        { content: { contains: search } },
      ];
    }

    const [rows, total, categoryRows] = await Promise.all([
      prisma.newsArticle.findMany({
        where,
        orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          title: true,
          slug: true,
          category: true,
          excerpt: true,
          coverImagePath: true,
          coverImageAlt: true,
          authorName: true,
          readTime: true,
          publishedAt: true,
          createdAt: true,
        },
      }),
      prisma.newsArticle.count({ where }),
      prisma.newsArticle.findMany({
        where: { isPublished: true },
        select: { category: true },
        distinct: ["category"],
        orderBy: { category: "asc" },
      }),
    ]);

    const categories = ["Semua", ...categoryRows.map((c) => c.category)];
    const totalPages = Math.ceil(total / limit) || 1;

    const articles: PublicNewsArticle[] = rows.map((r) => ({
      id: r.id,
      title: r.title,
      slug: r.slug,
      category: r.category,
      excerpt: r.excerpt,
      coverImagePath: r.coverImagePath,
      coverImageAlt: r.coverImageAlt || r.title,
      authorName: r.authorName,
      readTime: r.readTime || "3 menit baca",
      publishedAt: formatIndonesianDate(r.publishedAt || r.createdAt),
      publishedDateIso: (r.publishedAt || r.createdAt).toISOString(),
      isFallback: false,
    }));

    return {
      articles,
      total,
      page,
      limit,
      totalPages,
      categories,
      isFallback: false,
    };
  } catch {
    const allStatic = getStaticNewsFallback();
    return {
      articles: allStatic.slice(0, limit),
      total: allStatic.length,
      page: 1,
      limit,
      totalPages: 1,
      categories: ["Semua", ...new Set(allStatic.map((a) => a.category))],
      isFallback: true,
    };
  }
}

export async function getPublicNewsBySlug(
  slug: string,
  options?: { incrementViews?: boolean }
): Promise<PublicNewsArticle | null> {
  const cleanSlug = slug.trim();
  if (!cleanSlug) return null;
  const shouldIncrement = options?.incrementViews ?? true;

  try {
    const article = await prisma.newsArticle.findFirst({
      where: {
        slug: cleanSlug,
        isPublished: true,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        category: true,
        excerpt: true,
        content: true,
        coverImagePath: true,
        coverImageAlt: true,
        authorName: true,
        readTime: true,
        publishedAt: true,
        createdAt: true,
        views: true,
      },
    });

    if (!article) return null;

    if (shouldIncrement) {
      prisma.newsArticle
        .update({
          where: { id: article.id },
          data: { views: { increment: 1 } },
        })
        .catch(() => {});
    }

    return {
      id: article.id,
      title: article.title,
      slug: article.slug,
      category: article.category,
      excerpt: article.excerpt,
      content: article.content,
      coverImagePath: article.coverImagePath,
      coverImageAlt: article.coverImageAlt || article.title,
      authorName: article.authorName,
      readTime: article.readTime || "3 menit baca",
      publishedAt: formatIndonesianDate(article.publishedAt || article.createdAt),
      publishedDateIso: (article.publishedAt || article.createdAt).toISOString(),
      views: article.views,
      isFallback: false,
    };
  } catch {
    return null;
  }
}

export async function getRelatedNews(
  category: string,
  currentArticleId: string,
  limit = 3
): Promise<PublicNewsArticle[]> {
  try {
    const rows = await prisma.newsArticle.findMany({
      where: {
        isPublished: true,
        id: { not: currentArticleId },
        category,
      },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take: limit,
      select: {
        id: true,
        title: true,
        slug: true,
        category: true,
        excerpt: true,
        coverImagePath: true,
        coverImageAlt: true,
        authorName: true,
        readTime: true,
        publishedAt: true,
        createdAt: true,
      },
    });

    if (rows.length < limit) {
      const remainingLimit = limit - rows.length;
      const existingIds = [currentArticleId, ...rows.map((r) => r.id)];
      const backfill = await prisma.newsArticle.findMany({
        where: {
          isPublished: true,
          id: { notIn: existingIds },
        },
        orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
        take: remainingLimit,
        select: {
          id: true,
          title: true,
          slug: true,
          category: true,
          excerpt: true,
          coverImagePath: true,
          coverImageAlt: true,
          authorName: true,
          readTime: true,
          publishedAt: true,
          createdAt: true,
        },
      });
      rows.push(...backfill);
    }

    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      slug: r.slug,
      category: r.category,
      excerpt: r.excerpt,
      coverImagePath: r.coverImagePath,
      coverImageAlt: r.coverImageAlt || r.title,
      authorName: r.authorName,
      readTime: r.readTime || "3 menit baca",
      publishedAt: formatIndonesianDate(r.publishedAt || r.createdAt),
      publishedDateIso: (r.publishedAt || r.createdAt).toISOString(),
      isFallback: false,
    }));
  } catch {
    return [];
  }
}
