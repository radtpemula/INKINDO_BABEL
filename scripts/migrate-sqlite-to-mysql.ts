// scripts/migrate-sqlite-to-mysql.ts
// INKINDO BABEL — M2C: Safe Data Transfer from SQLite to MySQL Docker
//
// Constraints:
// - Read-only from SQLite snapshot: /home/radith/Documents/inkindo_sqlite_backups/dev.db-backup-20261110-m2c.db
// - Write only to MySQL target: inkindo_babel_db on 127.0.0.1:3306
// - Strict preflight: fail if target tables are not empty
// - Transactional execution: any failure rolls back all changes
// - Zero password or secret logging

import { execSync } from "child_process";
import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";
import { PrismaClient as SQLiteClient } from "@prisma/client";
import { PrismaClient as MySQLClient } from "@prisma/client-mysql";

const SNAPSHOT_DB_PATH = "/home/radith/Documents/inkindo_sqlite_backups/dev.db-backup-20261110-m2c.db";

function getMySQLPassword(): string {
  if (process.env.MYSQL_PASSWORD) {
    return process.env.MYSQL_PASSWORD;
  }
  try {
    const pwd = execSync("sg docker -c 'docker exec inkindo-babel-mysql printenv MYSQL_PASSWORD'", {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "ignore"],
    }).trim();
    if (pwd) return pwd;
  } catch {
    // Fall through
  }
  throw new Error("Unable to obtain MYSQL_PASSWORD securely from container or environment.");
}

function sha256(val: string): string {
  return crypto.createHash("sha256").update(val, "utf8").digest("hex");
}

async function main() {
  console.log("=== INKINDO BABEL: M2C SQLITE -> MYSQL DATA TRANSFER ===\n");

  // 1. Verify snapshot file existence
  if (!fs.existsSync(SNAPSHOT_DB_PATH)) {
    throw new Error(`Snapshot source file not found: ${SNAPSHOT_DB_PATH}`);
  }
  console.log(`[1/5] Source snapshot verified: ${SNAPSHOT_DB_PATH}`);

  // 2. Initialize Prisma clients
  const sqlite = new SQLiteClient({
    datasources: {
      db: { url: `file:${SNAPSHOT_DB_PATH}` },
    },
  });

  const mysqlPassword = getMySQLPassword();
  const mysqlUrl = `mysql://inkindo_user:${encodeURIComponent(mysqlPassword)}@127.0.0.1:3306/inkindo_babel_db`;
  const mysql = new MySQLClient({
    datasources: {
      db: { url: mysqlUrl },
    },
  });

  try {
    // 3. Preflight check on MySQL target
    console.log("[2/5] Running preflight check on MySQL target (inkindo_babel_db)...");
    const preCounts = {
      AdminUser: await mysql.adminUser.count(),
      HeroSlide: await mysql.heroSlide.count(),
      HomeSection: await mysql.homeSection.count(),
      MemberWork: await mysql.memberWork.count(),
      NavigationItem: await mysql.navigationItem.count(),
      NewsArticle: await mysql.newsArticle.count(),
      Partner: await mysql.partner.count(),
      SiteSetting: await mysql.siteSetting.count(),
    };

    const totalExisting = Object.values(preCounts).reduce((a: number, b: number) => a + b, 0);
    if (totalExisting > 0) {
      throw new Error(
        `PREFLIGHT FAILED: Target MySQL database is not empty! Found existing records: ${JSON.stringify(preCounts)}`
      );
    }
    console.log("      All 8 target MySQL tables are empty (0 rows). Preflight PASSED.");

    // 4. Fetch all data from SQLite snapshot
    console.log("[3/5] Reading all records from SQLite snapshot in topological order...");
    const adminUsers = await sqlite.adminUser.findMany({ orderBy: { createdAt: "asc" } });
    const siteSettings = await sqlite.siteSetting.findMany({ orderBy: { key: "asc" } });
    const homeSections = await sqlite.homeSection.findMany({ orderBy: { sortOrder: "asc" } });
    const heroSlides = await sqlite.heroSlide.findMany({ orderBy: { order: "asc" } });
    const newsArticles = await sqlite.newsArticle.findMany({ orderBy: { createdAt: "asc" } });
    const partners = await sqlite.partner.findMany({ orderBy: { order: "asc" } });
    const memberWorks = await sqlite.memberWork.findMany({ orderBy: { order: "asc" } });
    const navigationItems = await sqlite.navigationItem.findMany({ orderBy: { sortOrder: "asc" } });

    const totalSource =
      adminUsers.length +
      siteSettings.length +
      homeSections.length +
      heroSlides.length +
      newsArticles.length +
      partners.length +
      memberWorks.length +
      navigationItems.length;

    console.log(`      Found ${totalSource} total records across 8 models:`);
    console.log(`      - AdminUser: ${adminUsers.length}`);
    console.log(`      - SiteSetting: ${siteSettings.length}`);
    console.log(`      - HomeSection: ${homeSections.length}`);
    console.log(`      - HeroSlide: ${heroSlides.length}`);
    console.log(`      - NewsArticle: ${newsArticles.length}`);
    console.log(`      - Partner: ${partners.length}`);
    console.log(`      - MemberWork: ${memberWorks.length}`);
    console.log(`      - NavigationItem: ${navigationItems.length}`);

    // 5. Transfer to MySQL inside a single transaction
    console.log("\n[4/5] Executing transactional data transfer to MySQL...");
    const transferStartTime = Date.now();

    await mysql.$transaction(
      async (tx) => {
        // A. AdminUser
        for (const u of adminUsers) {
          await tx.adminUser.create({
            data: {
              id: u.id,
              username: u.username,
              email: u.email,
              passwordHash: u.passwordHash,
              name: u.name,
              role: u.role,
              isActive: u.isActive,
              lastLoginAt: u.lastLoginAt,
              createdAt: u.createdAt,
              updatedAt: u.updatedAt,
            },
          });
        }

        // B. SiteSetting
        for (const s of siteSettings) {
          await tx.siteSetting.create({
            data: {
              id: s.id,
              group: s.group,
              key: s.key,
              value: s.value,
              label: s.label,
              type: s.type,
              updatedAt: s.updatedAt,
            },
          });
        }

        // C. HomeSection
        for (const h of homeSections) {
          await tx.homeSection.create({
            data: {
              id: h.id,
              key: h.key,
              name: h.name,
              title: h.title,
              subtitle: h.subtitle,
              sortOrder: h.sortOrder,
              isVisible: h.isVisible,
              customData: h.customData,
              updatedAt: h.updatedAt,
            },
          });
        }

        // D. HeroSlide
        for (const hs of heroSlides) {
          await tx.heroSlide.create({
            data: {
              id: hs.id,
              title: hs.title,
              description: hs.description,
              imagePath: hs.imagePath,
              imageAlt: hs.imageAlt,
              linkUrl: hs.linkUrl,
              linkLabel: hs.linkLabel,
              order: hs.order,
              isActive: hs.isActive,
              createdAt: hs.createdAt,
              updatedAt: hs.updatedAt,
            },
          });
        }

        // E. NewsArticle
        for (const n of newsArticles) {
          await tx.newsArticle.create({
            data: {
              id: n.id,
              title: n.title,
              slug: n.slug,
              category: n.category,
              excerpt: n.excerpt,
              content: n.content,
              coverImagePath: n.coverImagePath,
              coverImageAlt: n.coverImageAlt,
              authorName: n.authorName,
              readTime: n.readTime,
              isPublished: n.isPublished,
              publishedAt: n.publishedAt,
              views: n.views,
              createdAt: n.createdAt,
              updatedAt: n.updatedAt,
            },
          });
        }

        // F. Partner
        for (const p of partners) {
          await tx.partner.create({
            data: {
              id: p.id,
              name: p.name,
              shortName: p.shortName,
              category: p.category,
              logoPath: p.logoPath,
              websiteUrl: p.websiteUrl,
              order: p.order,
              isActive: p.isActive,
              createdAt: p.createdAt,
              updatedAt: p.updatedAt,
            },
          });
        }

        // G. MemberWork
        for (const m of memberWorks) {
          await tx.memberWork.create({
            data: {
              id: m.id,
              title: m.title,
              slug: m.slug,
              category: m.category,
              company: m.company,
              year: m.year,
              description: m.description,
              imagePath: m.imagePath,
              imageAlt: m.imageAlt,
              client: m.client,
              order: m.order,
              isFeatured: m.isFeatured,
              isActive: m.isActive,
              createdAt: m.createdAt,
              updatedAt: m.updatedAt,
            },
          });
        }

        // H. NavigationItem (Topological level-by-level insertion)
        if (navigationItems.length > 0) {
          const insertedNavIds = new Set<string>();
          let remaining = [...navigationItems];

          // 1. Insert root items (parentId === null)
          const roots = remaining.filter((item) => item.parentId === null);
          for (const r of roots) {
            await tx.navigationItem.create({
              data: {
                id: r.id,
                title: r.title,
                path: r.path,
                iconName: r.iconName,
                target: r.target,
                sortOrder: r.sortOrder,
                isActive: r.isActive,
                parentId: null,
                createdAt: r.createdAt,
                updatedAt: r.updatedAt,
              },
            });
            insertedNavIds.add(r.id);
          }
          remaining = remaining.filter((item) => item.parentId !== null);

          // 2. Iteratively insert child items whose parents are already inserted
          while (remaining.length > 0) {
            const batch = remaining.filter((item) => item.parentId && insertedNavIds.has(item.parentId));
            if (batch.length === 0) {
              throw new Error("Cyclic or dangling parentId detected in NavigationItem records!");
            }
            for (const child of batch) {
              await tx.navigationItem.create({
                data: {
                  id: child.id,
                  title: child.title,
                  path: child.path,
                  iconName: child.iconName,
                  target: child.target,
                  sortOrder: child.sortOrder,
                  isActive: child.isActive,
                  parentId: child.parentId,
                  createdAt: child.createdAt,
                  updatedAt: child.updatedAt,
                },
              });
              insertedNavIds.add(child.id);
            }
            remaining = remaining.filter((item) => !insertedNavIds.has(item.id));
          }
        }
      },
      { timeout: 60000 }
    );

    const elapsed = Date.now() - transferStartTime;
    console.log(`      Transfer transaction committed successfully in ${elapsed}ms.`);

    // 6. Comprehensive Bidirectional Verification
    console.log("\n[5/5] Performing comprehensive bidirectional verification...");

    // A. Row counts
    const mysqlCounts = {
      AdminUser: await mysql.adminUser.count(),
      HeroSlide: await mysql.heroSlide.count(),
      HomeSection: await mysql.homeSection.count(),
      MemberWork: await mysql.memberWork.count(),
      NavigationItem: await mysql.navigationItem.count(),
      NewsArticle: await mysql.newsArticle.count(),
      Partner: await mysql.partner.count(),
      SiteSetting: await mysql.siteSetting.count(),
    };

    console.log("      A. Comparing table row counts:");
    for (const [table, mCount] of Object.entries(mysqlCounts)) {
      const sCount = {
        AdminUser: adminUsers.length,
        HeroSlide: heroSlides.length,
        HomeSection: homeSections.length,
        MemberWork: memberWorks.length,
        NavigationItem: navigationItems.length,
        NewsArticle: newsArticles.length,
        Partner: partners.length,
        SiteSetting: siteSettings.length,
      }[table];

      if (mCount !== sCount) {
        throw new Error(`VERIFICATION FAILED: Row count mismatch in ${table}: SQLite=${sCount}, MySQL=${mCount}`);
      }
      console.log(`         ✓ ${table.padEnd(16)}: ${mCount} rows (Exact Match)`);
    }

    // B. Primary key set verification
    console.log("\n      B. Comparing Primary Key ID sets:");
    const mysqlAdmins = await mysql.adminUser.findMany({ select: { id: true, email: true, passwordHash: true } });
    const mysqlSettings = await mysql.siteSetting.findMany({ select: { id: true, key: true, value: true } });
    const mysqlSlides = await mysql.heroSlide.findMany({ select: { id: true, imagePath: true } });
    const mysqlNews = await mysql.newsArticle.findMany({ select: { id: true, slug: true, content: true, coverImagePath: true } });
    const mysqlPartners = await mysql.partner.findMany({ select: { id: true, logoPath: true } });
    const mysqlWorks = await mysql.memberWork.findMany({ select: { id: true, imagePath: true } });

    function assertIdSetEqual(name: string, sourceList: { id: string }[], targetList: { id: string }[]) {
      const sSet = new Set(sourceList.map((x) => x.id));
      const tSet = new Set(targetList.map((x) => x.id));
      if (sSet.size !== tSet.size) {
        throw new Error(`ID set size mismatch for ${name}: ${sSet.size} vs ${tSet.size}`);
      }
      for (const id of sSet) {
        if (!tSet.has(id)) {
          throw new Error(`Missing ID in MySQL for ${name}: ${id}`);
        }
      }
      console.log(`         ✓ ${name.padEnd(16)}: ${sSet.size} IDs 100% Identical`);
    }

    assertIdSetEqual("AdminUser", adminUsers, mysqlAdmins);
    assertIdSetEqual("SiteSetting", siteSettings, mysqlSettings);
    assertIdSetEqual("HeroSlide", heroSlides, mysqlSlides);
    assertIdSetEqual("NewsArticle", newsArticles, mysqlNews);
    assertIdSetEqual("Partner", partners, mysqlPartners);
    assertIdSetEqual("MemberWork", memberWorks, mysqlWorks);

    // C. Checksum verification of sensitive/critical payloads
    console.log("\n      C. Verifying SHA-256 Checksums of Critical Content:");

    // 1. AdminUser passwordHash verification
    const sAdminMap = new Map(adminUsers.map((u) => [u.id, u.passwordHash]));
    for (const u of mysqlAdmins) {
      const sHash = sAdminMap.get(u.id);
      if (!sHash || sHash !== u.passwordHash) {
        throw new Error(`VERIFICATION FAILED: passwordHash mismatch for admin id ${u.id}`);
      }
    }
    console.log(`         ✓ AdminUser passwordHash: ${mysqlAdmins.length} hash verbatim verified`);

    // 2. NewsArticle Tiptap HTML & Content Markers
    const sNewsMap = new Map(newsArticles.map((n) => [n.id, n]));
    for (const n of mysqlNews) {
      const sNews = sNewsMap.get(n.id);
      if (!sNews) throw new Error(`News article ${n.id} not found in source`);
      if (sNews.content !== n.content) {
        throw new Error(`VERIFICATION FAILED: News content mismatch for article ${n.slug}`);
      }
      if (sNews.slug !== n.slug) {
        throw new Error(`VERIFICATION FAILED: News slug mismatch for article ${n.id}`);
      }
      if (sNews.coverImagePath !== n.coverImagePath) {
        throw new Error(`VERIFICATION FAILED: Cover image path mismatch for article ${n.slug}`);
      }
      const contentSha = sha256(n.content);
      const sourceSha = sha256(sNews.content);
      if (contentSha !== sourceSha) {
        throw new Error(`VERIFICATION FAILED: News SHA-256 mismatch for ${n.slug}`);
      }
      console.log(`         ✓ NewsArticle [${n.slug}]: Content length ${n.content.length} chars, SHA-256 matches (${contentSha.slice(0, 16)}...)`);
    }

    // 3. SiteSetting values
    const sSettingMap = new Map(siteSettings.map((s) => [s.key, s.value]));
    for (const s of mysqlSettings) {
      const sVal = sSettingMap.get(s.key);
      if (sVal === undefined || sVal !== s.value) {
        throw new Error(`VERIFICATION FAILED: SiteSetting value mismatch for key ${s.key}`);
      }
    }
    console.log(`         ✓ SiteSetting values: ${mysqlSettings.length} configuration values verified 100%`);

    // D. Image paths verification against physical files
    console.log("\n      D. Verifying Image Paths Against Filesystem:");
    const publicDir = path.resolve(process.cwd(), "public");
    const imagePathsToCheck: string[] = [];

    for (const hs of mysqlSlides) {
      if (hs.imagePath) imagePathsToCheck.push(hs.imagePath);
    }
    for (const na of mysqlNews) {
      if (na.coverImagePath) imagePathsToCheck.push(na.coverImagePath);
    }
    for (const p of mysqlPartners) {
      if (p.logoPath) imagePathsToCheck.push(p.logoPath);
    }
    for (const mw of mysqlWorks) {
      if (mw.imagePath) imagePathsToCheck.push(mw.imagePath);
    }
    for (const st of mysqlSettings) {
      if (typeof st.value === "string" && st.value.startsWith("/uploads/")) {
        imagePathsToCheck.push(st.value);
      }
    }

    let validImageCount = 0;
    for (const imgPath of imagePathsToCheck) {
      const relPath = imgPath.startsWith("/") ? imgPath.slice(1) : imgPath;
      const fullPath = path.join(publicDir, relPath);
      if (!fs.existsSync(fullPath)) {
        throw new Error(`VERIFICATION FAILED: Image file referenced in database does not exist: ${imgPath} -> ${fullPath}`);
      }
      validImageCount++;
    }
    console.log(`         ✓ All ${validImageCount} referenced image paths exist on filesystem (100% verified)`);

    console.log("\n=== ALL M2C DATA TRANSFER & VERIFICATION CHECKS PASSED (100%) ===\n");
  } finally {
    await sqlite.$disconnect();
    await mysql.$disconnect();
  }
}

main().catch((err) => {
  console.error("\n❌ FATAL ERROR DURING M2C MIGRATION:", err.message);
  process.exit(1);
});
