import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { memberWorks } from "@/data/landing";

export interface PublicMemberWork {
  id: string;
  title: string;
  slug: string;
  category: string;
  company: string;
  year: string;
  description: string | null;
  imagePath: string | null;
  imageAlt: string | null;
  client: string | null;
  order: number;
  isFeatured: boolean;
  isFallback: boolean;
}

export interface PublicMemberWorkArchiveOptions {
  search?: string;
  category?: string;
  page?: number;
  limit?: number;
}

export interface PublicMemberWorkArchiveResult {
  works: PublicMemberWork[];
  categories: string[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  isFallback: boolean;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getStaticMemberWorksFallback(): PublicMemberWork[] {
  return memberWorks.map((w, idx) => ({
    id: w.id,
    title: w.title,
    slug: slugify(w.title),
    category: w.category,
    company: w.company,
    year: w.year,
    description: null,
    imagePath: null,
    imageAlt: w.imagePlaceholderText ?? w.title,
    client: null,
    order: idx,
    isFeatured: true,
    isFallback: true,
  }));
}

export async function getFeaturedMemberWorksForHome(limit = 4): Promise<PublicMemberWork[]> {
  try {
    const totalCount = await prisma.memberWork.count();
    if (totalCount === 0) {
      return getStaticMemberWorksFallback().slice(0, limit);
    }

    const rows = await prisma.memberWork.findMany({
      where: {
        isActive: true,
        isFeatured: true,
      },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }, { id: "asc" }],
      take: limit,
      select: {
        id: true,
        title: true,
        slug: true,
        category: true,
        company: true,
        year: true,
        description: true,
        imagePath: true,
        imageAlt: true,
        client: true,
        order: true,
        isFeatured: true,
      },
    });

    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      slug: r.slug,
      category: r.category,
      company: r.company,
      year: r.year,
      description: r.description,
      imagePath: r.imagePath,
      imageAlt: r.imageAlt || r.title,
      client: r.client,
      order: r.order,
      isFeatured: r.isFeatured,
      isFallback: false,
    }));
  } catch (error) {
    console.error("Gagal mengambil karya unggulan beranda:", error);
    return getStaticMemberWorksFallback().slice(0, limit);
  }
}

export async function getPublicMemberWorksArchive(
  options: PublicMemberWorkArchiveOptions = {}
): Promise<PublicMemberWorkArchiveResult> {
  const page = Math.max(1, options.page || 1);
  const limit = Math.min(50, Math.max(1, options.limit || 12));
  const search = options.search?.trim() || "";
  const category = options.category?.trim() || "Semua";

  try {
    const totalCount = await prisma.memberWork.count();
    if (totalCount === 0) {
      const allStatic = getStaticMemberWorksFallback();
      const distinctCats = Array.from(new Set(allStatic.map((w) => w.category)));
      const categories = ["Semua", ...distinctCats];

      let filtered = allStatic;
      if (category !== "Semua") {
        filtered = filtered.filter((w) => w.category === category);
      }
      if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter(
          (w) =>
            w.title.toLowerCase().includes(q) ||
            w.company.toLowerCase().includes(q) ||
            w.category.toLowerCase().includes(q) ||
            w.year.toLowerCase().includes(q)
        );
      }

      const total = filtered.length;
      const totalPages = Math.ceil(total / limit) || 1;
      const paginated = filtered.slice((page - 1) * limit, page * limit);

      return {
        works: paginated,
        categories,
        total,
        page,
        limit,
        totalPages,
        isFallback: true,
      };
    }

    const where: Prisma.MemberWorkWhereInput = {
      isActive: true,
    };

    if (category !== "Semua") {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { company: { contains: search } },
        { category: { contains: search } },
        { year: { contains: search } },
        { client: { contains: search } },
      ];
    }

    const [rows, total, categoryRows] = await Promise.all([
      prisma.memberWork.findMany({
        where,
        orderBy: [{ order: "asc" }, { createdAt: "asc" }, { id: "asc" }],
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          title: true,
          slug: true,
          category: true,
          company: true,
          year: true,
          description: true,
          imagePath: true,
          imageAlt: true,
          client: true,
          order: true,
          isFeatured: true,
        },
      }),
      prisma.memberWork.count({ where }),
      prisma.memberWork.findMany({
        where: { isActive: true },
        select: { category: true },
        distinct: ["category"],
        orderBy: { category: "asc" },
      }),
    ]);

    const categories = ["Semua", ...categoryRows.map((c) => c.category)];
    const totalPages = Math.ceil(total / limit) || 1;

    const works: PublicMemberWork[] = rows.map((r) => ({
      id: r.id,
      title: r.title,
      slug: r.slug,
      category: r.category,
      company: r.company,
      year: r.year,
      description: r.description,
      imagePath: r.imagePath,
      imageAlt: r.imageAlt || r.title,
      client: r.client,
      order: r.order,
      isFeatured: r.isFeatured,
      isFallback: false,
    }));

    return {
      works,
      categories,
      total,
      page,
      limit,
      totalPages,
      isFallback: false,
    };
  } catch (error) {
    console.error("Gagal mengambil arsip karya anggota:", error);
    const allStatic = getStaticMemberWorksFallback();
    return {
      works: allStatic.slice(0, limit),
      categories: ["Semua", ...new Set(allStatic.map((w) => w.category))],
      total: allStatic.length,
      page: 1,
      limit,
      totalPages: 1,
      isFallback: true,
    };
  }
}

export async function getPublicMemberWorkBySlug(slug: string): Promise<PublicMemberWork | null> {
  const cleanSlug = slug.trim();
  if (!cleanSlug) return null;

  try {
    const totalCount = await prisma.memberWork.count();

    const row = await prisma.memberWork.findFirst({
      where: {
        slug: cleanSlug,
        isActive: true,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        category: true,
        company: true,
        year: true,
        description: true,
        imagePath: true,
        imageAlt: true,
        client: true,
        order: true,
        isFeatured: true,
      },
    });

    if (row) {
      return {
        id: row.id,
        title: row.title,
        slug: row.slug,
        category: row.category,
        company: row.company,
        year: row.year,
        description: row.description,
        imagePath: row.imagePath,
        imageAlt: row.imageAlt || row.title,
        client: row.client,
        order: row.order,
        isFeatured: row.isFeatured,
        isFallback: false,
      };
    }

    if (totalCount === 0) {
      const allStatic = getStaticMemberWorksFallback();
      const match = allStatic.find((w) => w.slug === cleanSlug);
      return match || null;
    }

    return null;
  } catch (error) {
    console.error("Gagal mengambil detail karya anggota:", error);
    return null;
  }
}

export async function getRelatedMemberWorks(
  category: string,
  currentWorkId: string,
  limit = 3
): Promise<PublicMemberWork[]> {
  try {
    const totalCount = await prisma.memberWork.count();
    if (totalCount === 0) {
      return getStaticMemberWorksFallback()
        .filter((w) => w.id !== currentWorkId)
        .slice(0, limit);
    }

    const rows = await prisma.memberWork.findMany({
      where: {
        isActive: true,
        id: { not: currentWorkId },
        category,
      },
      orderBy: [{ isFeatured: "desc" }, { order: "asc" }, { createdAt: "desc" }],
      take: limit,
      select: {
        id: true,
        title: true,
        slug: true,
        category: true,
        company: true,
        year: true,
        description: true,
        imagePath: true,
        imageAlt: true,
        client: true,
        order: true,
        isFeatured: true,
      },
    });

    if (rows.length < limit) {
      const fallbackRows = await prisma.memberWork.findMany({
        where: {
          isActive: true,
          id: { notIn: [currentWorkId, ...rows.map((r) => r.id)] },
        },
        orderBy: [{ isFeatured: "desc" }, { order: "asc" }, { createdAt: "desc" }],
        take: limit - rows.length,
        select: {
          id: true,
          title: true,
          slug: true,
          category: true,
          company: true,
          year: true,
          description: true,
          imagePath: true,
          imageAlt: true,
          client: true,
          order: true,
          isFeatured: true,
        },
      });
      rows.push(...fallbackRows);
    }

    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      slug: r.slug,
      category: r.category,
      company: r.company,
      year: r.year,
      description: r.description,
      imagePath: r.imagePath,
      imageAlt: r.imageAlt || r.title,
      client: r.client,
      order: r.order,
      isFeatured: r.isFeatured,
      isFallback: false,
    }));
  } catch (error) {
    console.error("Gagal mengambil karya terkait:", error);
    return [];
  }
}
