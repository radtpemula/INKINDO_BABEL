import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { prisma } from "../lib/prisma";
import { makeImageFile, runCheck, VALID_1X1_PNG, VALID_1X1_WEBP, type CheckCounter, type RouteHandler } from "./test-upload-on-submit-harness";
import { createNewsArticleAction, updateNewsArticleAction, deleteNewsArticleAction } from "../lib/admin/news-actions";
import { rollbackDraftInlineUploadsAction } from "../lib/admin/news-inline-cleanup";
import { isNewsInlineImageReferenced } from "../lib/security/image-reference";
import { verifyUploadReceiptToken } from "../lib/security/upload-receipt";
import { withImagePathLock } from "../lib/security/upload-coordinator";

interface UploadResponseData {
  readonly publicPath: string;
  readonly uploadToken: string;
}

async function uploadInlineImage(
  handler: RouteHandler,
  cookieHeader: string,
  buffer: Buffer,
  filename: string,
  mimeType: string
): Promise<UploadResponseData> {
  const file = makeImageFile(buffer, filename, mimeType);
  const formData = new FormData();
  formData.append("file", file);

  const req = new Request("http://localhost/api/admin/news-inline-upload", {
    method: "POST",
    headers: { cookie: cookieHeader },
    body: formData,
  });

  const res = await handler(req);
  assert.strictEqual(res.status, 201, `Upload inline image harus 201, didapat ${res.status}`);
  const json = (await res.json()) as { data?: { publicPath?: string; uploadToken?: string } };
  assert.ok(json.data?.publicPath, "Respons harus menyertakan data.publicPath");
  assert.ok(json.data?.uploadToken, "Respons harus menyertakan data.uploadToken");
  return { publicPath: json.data.publicPath, uploadToken: json.data.uploadToken };
}

export async function runTiptapInlineChecks(deps: {
  readonly counter: CheckCounter;
  readonly tempRoot: string;
  readonly cookieHeader: string;
  readonly adminId: string;
  readonly inlineUploadPost: RouteHandler;
  readonly createdArticleIds: string[];
}): Promise<void> {
  const { counter, tempRoot, cookieHeader, adminId, inlineUploadPost, createdArticleIds } = deps;

  let test1Path = "";
  let test1Token = "";

  await runCheck(counter, "1. Insert inline image menerbitkan data.uploadToken dan menyimpan fisik", async () => {
    const res = await uploadInlineImage(inlineUploadPost, cookieHeader, VALID_1X1_PNG, "inline-1.png", "image/png");
    test1Path = res.publicPath;
    test1Token = res.uploadToken;

    assert.ok(test1Path.startsWith("/uploads/news/inline/inline-"), "Path harus di direktori inline");
    const verified = await verifyUploadReceiptToken(test1Token, {
      adminId,
      module: "news-inline",
      publicPath: test1Path,
    });
    assert.ok(verified, "Upload token harus valid untuk admin dan module news-inline");

    const diskPath = path.join(tempRoot, "public", test1Path.replace(/^\//, ""));
    assert.ok(fs.existsSync(diskPath), "File fisik inline harus ada di disk");
  });

  await runCheck(counter, "2. Node gambar dibuang dari editor tidak langsung menghapus file fisik", () => {
    // Simulasi node dibuang dari editor state: tidak ada action hapus fisik yang dipanggil
    const diskPath = path.join(tempRoot, "public", test1Path.replace(/^\//, ""));
    assert.ok(fs.existsSync(diskPath), "File fisik harus tetap ada saat hanya node editor yang dibuang");
  });

  await runCheck(counter, "3. Batal naskah membersihkan gambar sesi yang belum tersimpan via rollback", async () => {
    const res = await rollbackDraftInlineUploadsAction({
      uploads: [{ publicPath: test1Path, uploadToken: test1Token }],
    });
    assert.strictEqual(res.success, true, "Rollback draft harus sukses");
    assert.strictEqual(res.deletedCount, 1, "Tepat 1 file harus terhapus");

    const diskPath = path.join(tempRoot, "public", test1Path.replace(/^\//, ""));
    assert.strictEqual(fs.existsSync(diskPath), false, "File fisik harus sudah terhapus setelah rollback");
  });

  let savedInlinePath = "";
  let articleAId = "";

  await runCheck(counter, "4. Simpan artikel baru dengan inline image mengikat referensi di database", async () => {
    const res = await uploadInlineImage(inlineUploadPost, cookieHeader, VALID_1X1_WEBP, "inline-saved.webp", "image/webp");
    savedInlinePath = res.publicPath;

    const createRes = await createNewsArticleAction({
      title: "Artikel Uji Tiptap A",
      content: `<!--inkindo-content:v1:html--><p>Paragraf pembuka</p><figure class="my-6"><img src="${savedInlinePath}" alt="Gambar A" class="block rounded-lg w-full"></figure>`,
      category: "Kegiatan",
      excerpt: "Ringkasan artikel uji Tiptap A",
      inlineUploads: [{ publicPath: savedInlinePath, uploadToken: res.uploadToken }],
    });

    assert.strictEqual(createRes.success, true, "Artikel harus berhasil dibuat");
    assert.ok(createRes.data?.id, "ID artikel harus tersedia");
    articleAId = createRes.data.id;
    createdArticleIds.push(articleAId);

    const isRef = await isNewsInlineImageReferenced(savedInlinePath, { prisma });
    assert.strictEqual(isRef, true, "Gambar inline harus terdeteksi direferensikan");

    const diskPath = path.join(tempRoot, "public", savedInlinePath.replace(/^\//, ""));
    assert.ok(fs.existsSync(diskPath), "File fisik harus tetap ada di disk");
  });

  await runCheck(counter, "5. Edit artikel membuang inline image membersihkan file lama yang tidak terpakai", async () => {
    const updateRes = await updateNewsArticleAction({
      id: articleAId,
      content: `<!--inkindo-content:v1:html--><p>Konten baru tanpa gambar inline</p>`,
    });
    assert.strictEqual(updateRes.success, true, "Artikel harus berhasil diperbarui");

    const isRef = await isNewsInlineImageReferenced(savedInlinePath, { prisma });
    assert.strictEqual(isRef, false, "Gambar inline lama tidak lagi direferensikan");

    const diskPath = path.join(tempRoot, "public", savedInlinePath.replace(/^\//, ""));
    assert.strictEqual(fs.existsSync(diskPath), false, "File fisik lama harus terhapus post-save");
  });

  let sharedPath = "";
  let articleB1Id = "";
  let articleB2Id = "";

  await runCheck(counter, "6. Gambar inline bersama (shared) terlindungi saat salah satu artikel membuangnya", async () => {
    const uploadRes = await uploadInlineImage(inlineUploadPost, cookieHeader, VALID_1X1_PNG, "inline-shared.png", "image/png");
    sharedPath = uploadRes.publicPath;

    const art1 = await createNewsArticleAction({
      title: "Artikel Bersama 1",
      content: `<!--inkindo-content:v1:html--><p>Konten artikel bersama satu panjang</p><figure><img src="${sharedPath}" alt="Shared"></figure>`,
      category: "Rilis Pers",
      excerpt: "Ringkasan bersama 1",
    });
    assert.ok(art1.data?.id);
    articleB1Id = art1.data.id;
    createdArticleIds.push(articleB1Id);

    const art2 = await createNewsArticleAction({
      title: "Artikel Bersama 2",
      content: `<!--inkindo-content:v1:html--><p>Konten artikel bersama dua panjang</p><figure><img src="${sharedPath}" alt="Shared"></figure>`,
      category: "Rilis Pers",
      excerpt: "Ringkasan bersama 2",
    });
    assert.ok(art2.data?.id);
    articleB2Id = art2.data.id;
    createdArticleIds.push(articleB2Id);

    // Edit Artikel 1 membuang sharedPath: Artikel 2 masih pakai -> JANGAN HAPUS!
    await updateNewsArticleAction({
      id: articleB1Id,
      content: `<!--inkindo-content:v1:html--><p>Artikel 1 konten baru tanpa gambar</p>`,
    });

    const diskPath = path.join(tempRoot, "public", sharedPath.replace(/^\//, ""));
    assert.ok(fs.existsSync(diskPath), "Gambar bersama harus tetap ada karena Artikel 2 masih memakai");

    // Hapus Artikel 1: Artikel 2 masih pakai -> JANGAN HAPUS!
    await deleteNewsArticleAction(articleB1Id);
    assert.ok(fs.existsSync(diskPath), "Gambar bersama harus tetap ada setelah Artikel 1 dihapus");

    // Hapus Artikel 2: Tidak ada yang pakai lagi -> SEKARANG HAPUS!
    await deleteNewsArticleAction(articleB2Id);
    assert.strictEqual(fs.existsSync(diskPath), false, "Gambar harus terhapus setelah seluruh artikel penghubung dihapus");
  });

  await runCheck(counter, "7. Gagal simpan mempertahankan gambar untuk retry tanpa upload ulang", async () => {
    const res = await uploadInlineImage(inlineUploadPost, cookieHeader, VALID_1X1_PNG, "inline-retry.png", "image/png");
    const retryPath = res.publicPath;

    // Gagal: judul kosong
    const failRes = await createNewsArticleAction({
      title: "",
      content: `<!--inkindo-content:v1:html--><p>Isi retry panjang minimal sepuluh</p><figure><img src="${retryPath}" alt="R"></figure>`,
      category: "Kegiatan",
      excerpt: "Ringkasan",
      inlineUploads: [{ publicPath: retryPath, uploadToken: res.uploadToken }],
    });
    assert.strictEqual(failRes.success, false, "Harus gagal karena judul kosong");

    const diskPath = path.join(tempRoot, "public", retryPath.replace(/^\//, ""));
    assert.ok(fs.existsSync(diskPath), "File fisik harus dipertahankan saat save gagal untuk retry");

    // Retry dengan judul valid: berhasil tanpa upload ulang
    const okRes = await createNewsArticleAction({
      title: "Artikel Berhasil Retry",
      content: `<!--inkindo-content:v1:html--><p>Isi retry panjang minimal sepuluh</p><figure><img src="${retryPath}" alt="R"></figure>`,
      category: "Kegiatan",
      excerpt: "Ringkasan berhasil",
      inlineUploads: [{ publicPath: retryPath, uploadToken: res.uploadToken }],
    });
    assert.strictEqual(okRes.success, true, "Retry harus berhasil");
    assert.ok(okRes.data?.id);
    createdArticleIds.push(okRes.data.id);
    assert.ok(fs.existsSync(diskPath), "File fisik harus tetap ada setelah retry berhasil");
  });

  await runCheck(counter, "8. Status tidak pasti (unknown/timeout) mempertahankan gambar dan mencatat orphan", async () => {
    const res = await uploadInlineImage(inlineUploadPost, cookieHeader, VALID_1X1_PNG, "inline-timeout.png", "image/png");
    const timeoutPath = res.publicPath;

    // Rollback dengan status tidak pasti -> retain
    const rbRes = await rollbackDraftInlineUploadsAction({
      uploads: [{ publicPath: timeoutPath, uploadToken: res.uploadToken }],
      saveOutcome: "unknown",
    });
    assert.strictEqual(rbRes.deletedCount, 0, "Tidak boleh menghapus saat saveOutcome unknown");
    assert.strictEqual(rbRes.retainedCount, 1, "Harus dipertahankan sebagai orphan candidate");

    const diskPath = path.join(tempRoot, "public", timeoutPath.replace(/^\//, ""));
    assert.ok(fs.existsSync(diskPath), "File fisik harus dipertahankan demi keselamatan");
  });

  await runCheck(counter, "9. Double-submit lock dan per-path coordination mencegah balapan operasi", async () => {
    const res = await uploadInlineImage(inlineUploadPost, cookieHeader, VALID_1X1_PNG, "inline-lock.png", "image/png");
    let lock1Done = false;
    let lock2StartedAfterLock1 = false;

    const p1 = withImagePathLock(res.publicPath, async () => {
      await new Promise((r) => setTimeout(r, 30));
      lock1Done = true;
    });

    const p2 = withImagePathLock(res.publicPath, async () => {
      lock2StartedAfterLock1 = lock1Done;
    });

    await Promise.all([p1, p2]);
    assert.strictEqual(lock2StartedAfterLock1, true, "Operasi kedua harus menunggu lock pertama selesai");
  });

  await runCheck(counter, "10. Gambar sesi yang tidak dimasukkan ke naskah dibersihkan pasca-simpan", async () => {
    const resKept = await uploadInlineImage(inlineUploadPost, cookieHeader, VALID_1X1_PNG, "inline-kept.png", "image/png");
    const resDropped = await uploadInlineImage(inlineUploadPost, cookieHeader, VALID_1X1_PNG, "inline-dropped.png", "image/png");

    // Artikel hanya memasukkan resKept, tapi session inlineUploads membawa keduanya
    const art = await createNewsArticleAction({
      title: "Artikel Seleksi Gambar Sesi",
      content: `<!--inkindo-content:v1:html--><p>Konten teks panjang sepuluh</p><figure><img src="${resKept.publicPath}" alt="Kept"></figure>`,
      category: "Kegiatan",
      excerpt: "Ringkasan seleksi",
      inlineUploads: [
        { publicPath: resKept.publicPath, uploadToken: resKept.uploadToken },
        { publicPath: resDropped.publicPath, uploadToken: resDropped.uploadToken },
      ],
    });
    assert.strictEqual(art.success, true);
    assert.ok(art.data?.id);
    createdArticleIds.push(art.data.id);

    const keptDisk = path.join(tempRoot, "public", resKept.publicPath.replace(/^\//, ""));
    const droppedDisk = path.join(tempRoot, "public", resDropped.publicPath.replace(/^\//, ""));

    assert.ok(fs.existsSync(keptDisk), "Gambar yang disisipkan harus tetap ada");
    assert.strictEqual(fs.existsSync(droppedDisk), false, "Gambar yang di-drop harus dibersihkan post-save");
  });
}
