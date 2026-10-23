import path from "node:path";
import fs from "node:fs";
import { PrismaClient } from "@prisma/client";
import { strategicPartners, memberWorks } from "../data/landing";

function ensureEnvironment(): void {
  const envPath = path.resolve(process.cwd(), ".env");
  if (fs.existsSync(envPath) && typeof process.loadEnvFile === "function") {
    try {
      process.loadEnvFile(envPath);
    } catch {
      // Ignore if loadEnvFile encounters parse quirks
    }
  }

  if (!process.env.DATABASE_URL) {
    const defaultDbPath = path.resolve(process.cwd(), "prisma/dev.db");
    process.env.DATABASE_URL = `file:${defaultDbPath}`;
  }
}

ensureEnvironment();

const prisma = new PrismaClient();

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function main(): Promise<void> {
  console.log("=== Memulai Migrasi Data Awal Mitra Kerja & Karya Anggota ===");

  let partnersInserted = 0;
  let partnersSkipped = 0;

  for (let i = 0; i < strategicPartners.length; i++) {
    const p = strategicPartners[i];
    const existing = await prisma.partner.findFirst({
      where: {
        OR: [{ shortName: p.shortName }, { name: p.name }],
      },
    });

    if (existing) {
      partnersSkipped++;
    } else {
      await prisma.partner.create({
        data: {
          name: p.name,
          shortName: p.shortName,
          category: p.category ?? null,
          logoPath: null,
          websiteUrl: null,
          order: i,
          isActive: true,
        },
      });
      partnersInserted++;
    }
  }

  console.log(`Mitra Kerja: ${partnersInserted} dimasukkan, ${partnersSkipped} sudah ada.`);

  let worksInserted = 0;
  let worksSkipped = 0;

  for (let i = 0; i < memberWorks.length; i++) {
    const w = memberWorks[i];
    const baseSlug = slugify(w.title);

    const existing = await prisma.memberWork.findFirst({
      where: {
        OR: [{ slug: baseSlug }, { title: w.title }],
      },
    });

    if (existing) {
      worksSkipped++;
    } else {
      await prisma.memberWork.create({
        data: {
          title: w.title,
          slug: baseSlug,
          category: w.category,
          company: w.company,
          year: w.year,
          description: null,
          imagePath: null,
          imageAlt: w.imagePlaceholderText ?? w.title,
          client: null,
          order: i,
          isFeatured: true,
          isActive: true,
        },
      });
      worksInserted++;
    }
  }

  console.log(`Karya Anggota: ${worksInserted} dimasukkan, ${worksSkipped} sudah ada.`);

  const totalPartners = await prisma.partner.count();
  const totalWorks = await prisma.memberWork.count();

  console.log(`\nStatus Akhir Basis Data:`);
  console.log(`- Total Partner di DB: ${totalPartners}`);
  console.log(`- Total MemberWork di DB: ${totalWorks}`);
  console.log("=== Migrasi Selesai ===");
}

main()
  .catch((err) => {
    console.error("Gagal menjalankan migrasi:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
