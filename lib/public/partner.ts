import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { strategicPartners } from "@/data/landing";

export interface PublicPartner {
  id: string;
  name: string;
  shortName: string;
  category: string | null;
  logoPath: string | null;
  websiteUrl: string | null;
  order: number;
  isFallback: boolean;
}

export interface PublicPartnerDirectoryOptions {
  search?: string;
  category?: string;
}

export interface PublicPartnerDirectoryResult {
  partners: PublicPartner[];
  categories: string[];
  total: number;
  isFallback: boolean;
}

function getStaticPartnersFallback(): PublicPartner[] {
  return strategicPartners.map((p, idx) => ({
    id: `fallback-${idx}`,
    name: p.name,
    shortName: p.shortName,
    category: p.category ?? "Mitra Strategis",
    logoPath: null,
    websiteUrl: null,
    order: idx,
    isFallback: true,
  }));
}

export async function getPublicPartnersForHome(): Promise<PublicPartner[]> {
  try {
    const totalCount = await prisma.partner.count();
    if (totalCount === 0) {
      return getStaticPartnersFallback();
    }

    const rows = await prisma.partner.findMany({
      where: { isActive: true },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }, { id: "asc" }],
      select: {
        id: true,
        name: true,
        shortName: true,
        category: true,
        logoPath: true,
        websiteUrl: true,
        order: true,
      },
    });

    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      shortName: r.shortName,
      category: r.category,
      logoPath: r.logoPath,
      websiteUrl: r.websiteUrl,
      order: r.order,
      isFallback: false,
    }));
  } catch (error) {
    console.error("Gagal mengambil data mitra beranda:", error);
    return getStaticPartnersFallback();
  }
}

export async function getPublicPartnersForDirectory(
  options: PublicPartnerDirectoryOptions = {}
): Promise<PublicPartnerDirectoryResult> {
  const search = options.search?.trim() || "";
  const category = options.category?.trim() || "Semua";

  try {
    const totalCount = await prisma.partner.count();
    if (totalCount === 0) {
      const allStatic = getStaticPartnersFallback();
      const distinctCats = Array.from(
        new Set(allStatic.map((p) => p.category).filter((c): c is string => Boolean(c)))
      );
      const categories = ["Semua", ...distinctCats];

      let filtered = allStatic;
      if (category !== "Semua") {
        filtered = filtered.filter((p) => p.category === category);
      }
      if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter(
          (p) => p.name.toLowerCase().includes(q) || p.shortName.toLowerCase().includes(q)
        );
      }

      return {
        partners: filtered,
        categories,
        total: filtered.length,
        isFallback: true,
      };
    }

    const where: Prisma.PartnerWhereInput = {
      isActive: true,
    };

    if (category !== "Semua") {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { shortName: { contains: search } },
      ];
    }

    const [rows, categoryRows] = await Promise.all([
      prisma.partner.findMany({
        where,
        orderBy: [{ order: "asc" }, { createdAt: "asc" }, { id: "asc" }],
        select: {
          id: true,
          name: true,
          shortName: true,
          category: true,
          logoPath: true,
          websiteUrl: true,
          order: true,
        },
      }),
      prisma.partner.findMany({
        where: { isActive: true, category: { not: null } },
        select: { category: true },
        distinct: ["category"],
        orderBy: { category: "asc" },
      }),
    ]);

    const distinctCats = categoryRows
      .map((c) => c.category)
      .filter((c): c is string => Boolean(c));
    const categories = ["Semua", ...Array.from(new Set(distinctCats))];

    const partners: PublicPartner[] = rows.map((r) => ({
      id: r.id,
      name: r.name,
      shortName: r.shortName,
      category: r.category,
      logoPath: r.logoPath,
      websiteUrl: r.websiteUrl,
      order: r.order,
      isFallback: false,
    }));

    return {
      partners,
      categories,
      total: partners.length,
      isFallback: false,
    };
  } catch (error) {
    console.error("Gagal mengambil direktori mitra:", error);
    const allStatic = getStaticPartnersFallback();
    return {
      partners: allStatic,
      categories: ["Semua", "Mitra Strategis"],
      total: allStatic.length,
      isFallback: true,
    };
  }
}
