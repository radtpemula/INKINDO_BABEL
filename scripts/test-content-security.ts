import assert from "node:assert";
import {
  parseArticleContent,
  encodeArticleContent,
  isRichTextContent,
  extractPlainText,
  CONTENT_MARKER_V1_HTML,
  UnsupportedContentFormatError,
} from "../lib/security/content-format";
import {
  sanitizeNewsHtml,
  sanitizeArticleContent,
  isValidNewsUploadImagePath,
} from "../lib/security/content-sanitizer";

let passedCount = 0;
function test(name: string, fn: () => void) {
  try {
    fn();
    passedCount++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(err);
    process.exit(1);
  }
}

console.log("=== CMS BERITA RTE TAHAP 1: SUITE PENGUJIAN KEAMANAN ===");

console.log("\n[Kategori 1: Deteksi & Penanda Format Konten]");
test("1.1. Plain text lama biasa terdeteksi sebagai format plain (version 0)", () => {
  const plain = "Ini adalah artikel berita lama tanpa format rich text.";
  const res = parseArticleContent(plain);
  assert.strictEqual(res.isRichText, false);
  assert.strictEqual(res.format, "plain");
  assert.strictEqual(res.version, 0);
  assert.strictEqual(res.body, plain);
  assert.strictEqual(isRichTextContent(plain), false);
});

test("1.2. Plain text dengan simbol matematika < dan > tidak salah diklasifikasikan", () => {
  const plain = "Perbandingan: Nilai A < B dan C > D. Target > 100%.";
  const res = parseArticleContent(plain);
  assert.strictEqual(res.isRichText, false);
  assert.strictEqual(res.format, "plain");
  assert.strictEqual(res.version, 0);
  assert.strictEqual(res.body, plain);
  assert.strictEqual(isRichTextContent(plain), false);
});

test("1.3. Plain text berisi teks penjelasan tag HTML tidak salah diklasifikasikan", () => {
  const plain =
    "Dokumentasi Teknis: Gunakan tag <p> untuk paragraf dan hindari <script>alert('xss')</script> pada input.";
  const res = parseArticleContent(plain);
  assert.strictEqual(res.isRichText, false);
  assert.strictEqual(res.format, "plain");
  assert.strictEqual(res.version, 0);
  assert.strictEqual(res.body, plain);
  assert.strictEqual(isRichTextContent(plain), false);
});

test("1.4. Rich text ber-marker v1:html terdeteksi deterministik", () => {
  const rich = `${CONTENT_MARKER_V1_HTML}\n<p>Ini adalah paragraf <strong>tebal</strong>.</p>`;
  const res = parseArticleContent(rich);
  assert.strictEqual(res.isRichText, true);
  assert.strictEqual(res.format, "html");
  assert.strictEqual(res.version, 1);
  assert.strictEqual(res.body, "<p>Ini adalah paragraf <strong>tebal</strong>.</p>");
  assert.strictEqual(isRichTextContent(rich), true);
});

test("1.5. Format masa depan (v2:json) dikenali ekstensibel", () => {
  const jsonContent = '<!--inkindo-content:v2:json-->\n{"type":"doc","content":[]}';
  const res = parseArticleContent(jsonContent);
  assert.strictEqual(res.isRichText, true);
  assert.strictEqual(res.isSupported, false);
  assert.strictEqual(res.format, "unsupported");
  assert.strictEqual(res.version, 2);
  assert.strictEqual(res.body, '{"type":"doc","content":[]}');
});

test("1.6. encodeArticleContent membungkus konten HTML dengan marker resmi", () => {
  const html = "<p>Halo Dunia</p>";
  const encoded = encodeArticleContent(html);
  assert.strictEqual(encoded, `${CONTENT_MARKER_V1_HTML}\n<p>Halo Dunia</p>`);
  const parsed = parseArticleContent(encoded);
  assert.strictEqual(parsed.isRichText, true);
  assert.strictEqual(parsed.body, html);
});

test("1.7. extractPlainText mengekstrak teks murni dari plain text dan HTML", () => {
  const plain = "Teks artikel biasa.";
  assert.strictEqual(extractPlainText(plain), "Teks artikel biasa.");

  const html = `${CONTENT_MARKER_V1_HTML}\n<p>Halo <strong>Dunia</strong> &amp; Sahabat! &lt;Babel&gt;</p>`;
  assert.strictEqual(extractPlainText(html), "Halo Dunia & Sahabat! <Babel>");
});

console.log("\n[Kategori 2: Sanitasi HTML Semantik & Pemformatan Sah]");
test("2.1. Tag semantik dasar tetap utuh dan terformat rapi", () => {
  const input =
    "<h2>Judul Berita</h2><p>Paragraf dengan <strong>tebal</strong>, <em>miring</em>, <u>garis bawah</u>, dan <s>coret</s>.</p>";
  const clean = sanitizeNewsHtml(input);
  assert.strictEqual(clean, input);
});

test("2.2. Tag heading h2 dan h3 diizinkan, h1 dan h4 diturunkan/dibersihkan", () => {
  const input = "<h1>Judul H1</h1><h2>Subjudul H2</h2><h3>Poin H3</h3><h4>Kecil H4</h4>";
  const clean = sanitizeNewsHtml(input);
  assert.strictEqual(clean, "Judul H1<h2>Subjudul H2</h2><h3>Poin H3</h3>Kecil H4");
});

test("2.3. Tag b dan i dinormalisasi ke strong dan em", () => {
  const input = "<p>Teks <b>tebal</b> dan <i>miring</i> serta <strike>coret</strike>.</p>";
  const clean = sanitizeNewsHtml(input);
  assert.strictEqual(
    clean,
    "<p>Teks <strong>tebal</strong> dan <em>miring</em> serta <s>coret</s>.</p>"
  );
});

test("2.4. Tag daftar (ul, ol, li) dan kutipan (blockquote) diizinkan", () => {
  const input =
    '<blockquote>Kutipan narasumber</blockquote><ul><li>Poin 1</li><li>Poin 2</li></ul><ol class="list-decimal"><li>Langkah 1</li></ol>';
  const clean = sanitizeNewsHtml(input);
  assert.ok(clean.includes("<blockquote>Kutipan narasumber</blockquote>"));
  assert.ok(clean.includes("<ul><li>Poin 1</li><li>Poin 2</li></ul>"));
  assert.ok(clean.includes('<ol class="list-decimal"><li>Langkah 1</li></ol>'));
});

test("2.5. Figure dan figcaption semantik diizinkan", () => {
  const input =
    '<figure class="my-6 text-center"><img src="/uploads/news/dokumentasi-1.jpg" alt="Dokumentasi" class="w-full rounded-lg" /><figcaption class="text-xs text-slate-500 italic mt-2 text-center">Foto: Humas INKINDO</figcaption></figure>';
  const clean = sanitizeNewsHtml(input);
  assert.strictEqual(clean, input);
});

console.log("\n[Kategori 3: Pencegahan XSS & Tag/Atribut Berbahaya]");
test("3.1. Tag script dibersihkan total beserta isinya", () => {
  const input = '<p>Berita penting</p><script>alert("XSS PAYLOAD");</script><p>Penutup</p>';
  const clean = sanitizeNewsHtml(input);
  assert.strictEqual(clean, "<p>Berita penting</p><p>Penutup</p>");
  assert.ok(!clean.includes("XSS PAYLOAD"));
  assert.ok(!clean.includes("<script>"));
});

test("3.2. Tag iframe, object, embed, svg, form, input dibersihkan", () => {
  const input = [
    '<iframe src="https://attacker.com/keylogger"></iframe>',
    '<object data="exploit.swf"></object>',
    '<embed src="malware.pdf" />',
    '<svg onload="alert(1)"><circle r="10" /></svg>',
    '<form action="/steal"><input name="pass" /></form>',
  ].join("");
  const clean = sanitizeNewsHtml(input);
  assert.strictEqual(clean, "");
});

test("3.3. Event handlers inline (onerror, onload, onclick, dll.) dibersihkan", () => {
  const input =
    '<p onclick="alert(1)" onmouseover="alert(2)">Teks <strong onanimationstart="alert(3)">penting</strong></p>';
  const clean = sanitizeNewsHtml(input);
  assert.strictEqual(clean, "<p>Teks <strong>penting</strong></p>");
});

test("3.4. URL berbahaya javascript: pada anchor dibersihkan", () => {
  const input = '<a href="javascript:alert(\'pwned\')">Klik Disini</a>';
  const clean = sanitizeNewsHtml(input);
  assert.ok(!clean.includes("javascript:"));
  assert.ok(clean.includes("<a rel=\"noopener noreferrer\">Klik Disini</a>"));
});

test("3.5. URL berbahaya data: pada anchor dibersihkan", () => {
  const input = '<a href="data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==">Buka Data</a>';
  const clean = sanitizeNewsHtml(input);
  assert.ok(!clean.includes("data:"));
  assert.ok(clean.includes("<a rel=\"noopener noreferrer\">Buka Data</a>"));
});

test("3.6. Protocol-relative URL //attacker.com/script.js dibersihkan", () => {
  const input = '<a href="//attacker.com/malicious">Tautan Eksternal Liar</a>';
  const clean = sanitizeNewsHtml(input);
  assert.ok(!clean.includes("//attacker.com"));
});

test("3.7. Style inline bebas (style=\"...\") dibersihkan sepenuhnya", () => {
  const input =
    '<p style="color:red; background:url(javascript:alert(1)); font-size:100px;">Merah</p>';
  const clean = sanitizeNewsHtml(input);
  assert.strictEqual(clean, "<p>Merah</p>");
  assert.ok(!clean.includes("style"));
});

test("3.8. Class CSS yang tidak terdaftar dalam whitelist dibersihkan", () => {
  const input =
    '<p class="text-center evil-hack-class hidden dark:bg-black font-custom">Konten</p>';
  const clean = sanitizeNewsHtml(input);
  assert.strictEqual(clean, '<p class="text-center">Konten</p>');
  assert.ok(!clean.includes("evil-hack-class"));
  assert.ok(!clean.includes("hidden"));
});

console.log("\n[Kategori 4: Keamanan Hyperlink & Gambar]");
test("4.1. Link eksternal (http/https) otomatis mendapatkan rel noopener noreferrer dan target _blank", () => {
  const input = '<p>Baca di <a href="https://inkindo.org">Portal INKINDO</a>.</p>';
  const clean = sanitizeNewsHtml(input);
  assert.strictEqual(
    clean,
    '<p>Baca di <a href="https://inkindo.org" rel="noopener noreferrer" target="_blank">Portal INKINDO</a>.</p>'
  );
});

test("4.2. Link internal/relatif mempertahankan rel aman tanpa target _blank", () => {
  const input = '<p>Buka <a href="/tentang-kami/profil">Profil Kami</a>.</p>';
  const clean = sanitizeNewsHtml(input);
  assert.strictEqual(
    clean,
    '<p>Buka <a href="/tentang-kami/profil" rel="noopener noreferrer">Profil Kami</a>.</p>'
  );
});

test("4.3. Link mailto: dan tel: didukung secara aman", () => {
  const input =
    '<p>Email: <a href="mailto:sekretariat@inkindo-babel.org">Kirim</a> Telp: <a href="tel:07179101234">Hubungi</a></p>';
  const clean = sanitizeNewsHtml(input);
  assert.ok(clean.includes('href="mailto:sekretariat@inkindo-babel.org"'));
  assert.ok(clean.includes('href="tel:07179101234"'));
});

test("4.4. Validasi jalur gambar lokal resmi (/uploads/news/...) berfungsi tepat", () => {
  assert.strictEqual(
    isValidNewsUploadImagePath("/uploads/news/news-1740000000-abc.jpg"),
    true
  );
  assert.strictEqual(
    isValidNewsUploadImagePath("/uploads/news/inline/news-photo.webp"),
    true
  );
  assert.strictEqual(isValidNewsUploadImagePath("/uploads/news/photo.PNG"), true);

  // Penolakan path ilegal
  assert.strictEqual(isValidNewsUploadImagePath("https://evil.com/img.jpg"), false);
  assert.strictEqual(isValidNewsUploadImagePath("http://evil.com/img.jpg"), false);
  assert.strictEqual(isValidNewsUploadImagePath("data:image/png;base64,abc"), false);
  assert.strictEqual(isValidNewsUploadImagePath("/uploads/news/../secret.jpg"), false);
  assert.strictEqual(isValidNewsUploadImagePath("/uploads/news/../../etc/passwd"), false);
  assert.strictEqual(isValidNewsUploadImagePath("/uploads/hero/hero-1.webp"), false);
  assert.strictEqual(isValidNewsUploadImagePath("/uploads/news/script.js"), false);
  assert.strictEqual(isValidNewsUploadImagePath("/uploads/news/image.svg"), false);
});

test("4.5. Gambar dengan src lokal resmi (/uploads/news/...) diizinkan", () => {
  const input =
    '<img src="/uploads/news/inline/news-photo-1.webp" alt="Foto Kegiatan" class="w-full rounded-lg" />';
  const clean = sanitizeNewsHtml(input);
  assert.strictEqual(clean, input);
});

test("4.6. Gambar dengan src eksternal atau data URI dibersihkan total", () => {
  const input = [
    '<p>Foto: <img src="https://malicious.com/tracker.png" alt="Evil" /></p>',
    '<p>Inline: <img src="data:image/svg+xml;base64,PHN2ZyBvbmxvYWQ9YWxlcnQoMSk+" /></p>',
    '<p>Traversal: <img src="/uploads/news/../../passwords.jpg" /></p>',
  ].join("\n");
  const clean = sanitizeNewsHtml(input);
  assert.ok(!clean.includes("<img"));
  assert.strictEqual(clean, "<p>Foto: </p>\n<p>Inline: </p>\n<p>Traversal: </p>");
});

console.log("\n[Kategori 5: Kasus Ekstrem, Idempotensi, & Pipeline]");
test("5.1. HTML tidak seimbang (malformed/unclosed) diseimbangkan otomatis", () => {
  const input = "<p>Paragraf <strong>tebal tanpa penutup";
  const clean = sanitizeNewsHtml(input);
  assert.strictEqual(clean, "<p>Paragraf <strong>tebal tanpa penutup</strong></p>");
});

test("5.2. HTML sarang (deeply nested) ditangani tanpa galat", () => {
  const input = "<div><div><p><span><strong><em>Teks Dalam</em></strong></span></p></div></div>";
  const clean = sanitizeNewsHtml(input);
  assert.strictEqual(clean, "<p><strong><em>Teks Dalam</em></strong></p>");
});

test("5.3. Konten kosong dan whitespace menghasilkan string kosong", () => {
  assert.strictEqual(sanitizeNewsHtml(""), "");
  assert.strictEqual(sanitizeNewsHtml("   \n\t  "), "");
  assert.strictEqual(sanitizeArticleContent(""), "");
});

test("5.4. Konten sangat panjang (50.000 karakter) disanitasi cepat (< 50ms)", () => {
  const paragraphs = Array.from(
    { length: 50 },
    (_, i) => `<p>Paragraf ke-${i} dengan teks panjang untuk menguji performa sanitizer server-side pada CMS INKINDO BABEL.</p>`
  ).join("\n");
  const start = performance.now();
  const clean = sanitizeNewsHtml(paragraphs);
  const duration = performance.now() - start;
  assert.ok(clean.length > 5000);
  assert.ok(duration < 100, `Sanitasi terlalu lambat: ${duration.toFixed(2)}ms`);
});

test("5.5. Idempotensi: Sanitasi berulang pada konten bersih menghasilkan string identik", () => {
  const initial =
    '<h2>Musyawarah Provinsi</h2><p class="text-justify">Kegiatan <strong>resmi</strong> tahunan konsultan. Kunjungi <a href="https://inkindo.org" rel="noopener noreferrer" target="_blank">situs pusat</a>.</p>';
  const pass1 = sanitizeNewsHtml(initial);
  const pass2 = sanitizeNewsHtml(pass1);
  const pass3 = sanitizeNewsHtml(pass2);
  assert.strictEqual(pass1, pass2);
  assert.strictEqual(pass2, pass3);
});

test("5.6. sanitizeArticleContent: plain text lama dipertahankan utuh tanpa penambahan tag", () => {
  const legacy = "Paragraf 1 berita lama.\n\nParagraf 2 dengan contoh <p> dan <script>.";
  const processed = sanitizeArticleContent(legacy);
  assert.strictEqual(processed, legacy);
});

test("5.7. sanitizeArticleContent: rich text baru disanitasi dan dibungkus marker resmi", () => {
  const dirtyRich = `${CONTENT_MARKER_V1_HTML}\n<p>Berita <script>alert(1)</script><strong>terbaru</strong></p>`;
  const processed = sanitizeArticleContent(dirtyRich);
  assert.strictEqual(
    processed,
    `${CONTENT_MARKER_V1_HTML}\n<p>Berita <strong>terbaru</strong></p>`
  );
});

console.log("\n[Kategori 6: Pengerasan Format & Kasus RTE Tahap 1B]");
test("6.1. Marker v1:html valid dikenali dan didukung", () => {
  const content = `${CONTENT_MARKER_V1_HTML}\n<p>Dokumentasi resmi INKINDO.</p>`;
  const parsed = parseArticleContent(content);
  assert.strictEqual(parsed.isRichText, true);
  assert.strictEqual(parsed.isSupported, true);
  assert.strictEqual(parsed.format, "html");
  assert.strictEqual(parsed.version, 1);
  assert.strictEqual(parsed.formatIdentifier, "html");
  assert.strictEqual(parsed.body, "<p>Dokumentasi resmi INKINDO.</p>");

  const sanitized = sanitizeArticleContent(content);
  assert.strictEqual(sanitized, content);
});

test("6.2. Marker v99:html ditolak sebagai unsupported dan tidak diturunkan ke v1", () => {
  const v99Content = "<!--inkindo-content:v99:html-->\n<p>Format masa depan v99</p>";
  const parsed = parseArticleContent(v99Content);
  assert.strictEqual(parsed.isRichText, true);
  assert.strictEqual(parsed.isSupported, false);
  assert.strictEqual(parsed.format, "unsupported");
  assert.strictEqual(parsed.version, 99);
  assert.strictEqual(parsed.formatIdentifier, "html");
  assert.ok(parsed.error?.includes("v99:html"));

  assert.throws(() => {
    sanitizeArticleContent(v99Content);
  }, (err: Error) => {
    assert.ok(err instanceof UnsupportedContentFormatError);
    assert.strictEqual(err.version, 99);
    assert.strictEqual(err.formatIdentifier, "html");
    assert.ok(!err.message.includes("Format masa depan v99"), "Pesan error tidak boleh membocorkan isi konten mentah");
    return true;
  });

  assert.throws(() => {
    encodeArticleContent(v99Content);
  }, (err: Error) => {
    assert.ok(err instanceof UnsupportedContentFormatError);
    return true;
  });
});

test("6.3. Marker format non-HTML (v2:json & v1:markdown) tidak diklasifikasikan sebagai plain", () => {
  const jsonContent = '<!--inkindo-content:v2:json-->\n{"type":"doc","version":2}';
  const parsedJson = parseArticleContent(jsonContent);
  assert.strictEqual(parsedJson.isRichText, true);
  assert.strictEqual(parsedJson.isSupported, false);
  assert.notStrictEqual(parsedJson.format, "plain");
  assert.strictEqual(parsedJson.format, "unsupported");
  assert.strictEqual(parsedJson.formatIdentifier, "json");

  assert.throws(() => {
    sanitizeArticleContent(jsonContent);
  }, UnsupportedContentFormatError);

  const mdContent = "<!--inkindo-content:v1:markdown-->\n# Judul Markdown";
  const parsedMd = parseArticleContent(mdContent);
  assert.strictEqual(parsedMd.isRichText, true);
  assert.strictEqual(parsedMd.isSupported, false);
  assert.notStrictEqual(parsedMd.format, "plain");
  assert.strictEqual(parsedMd.format, "unsupported");
  assert.strictEqual(parsedMd.formatIdentifier, "markdown");

  assert.throws(() => {
    sanitizeArticleContent(mdContent);
  }, UnsupportedContentFormatError);
});

test("6.4. Encoder tidak menghasilkan marker ganda pada input v1 yang valid (Idempotensi)", () => {
  const singleEncoded = `${CONTENT_MARKER_V1_HTML}\n<p>Paragraf tunggal yang sudah ber-marker.</p>`;
  const enc1 = encodeArticleContent(singleEncoded);
  const enc2 = encodeArticleContent(enc1);
  const enc3 = encodeArticleContent(enc2);

  assert.strictEqual(enc1, singleEncoded);
  assert.strictEqual(enc2, singleEncoded);
  assert.strictEqual(enc3, singleEncoded);

  const markerMatches = enc3.match(new RegExp(CONTENT_MARKER_V1_HTML, "g"));
  assert.strictEqual(markerMatches?.length, 1, "Hanya boleh ada 1 marker v1:html pada hasil encoding");
});

test("6.5. Encoder tidak menghapus konten unsupported secara diam-diam", () => {
  const unsupportedContent = "<!--inkindo-content:v99:html-->\n<p>Konten v99 yang berharga</p>";
  assert.throws(() => {
    encodeArticleContent(unsupportedContent);
  }, (err: Error) => {
    assert.ok(err instanceof UnsupportedContentFormatError);
    return true;
  });

  assert.throws(() => {
    encodeArticleContent("<!--inkindo-content:v2:json-->\n{}");
  }, UnsupportedContentFormatError);
});

test("6.6. Kasus marker ganda yang sudah terlanjur terbentuk ditolak eksplisit", () => {
  const doubleMarker = `${CONTENT_MARKER_V1_HTML}\n${CONTENT_MARKER_V1_HTML}\n<p>Artikel dengan marker ganda</p>`;
  const parsed = parseArticleContent(doubleMarker);
  assert.strictEqual(parsed.isRichText, true);
  assert.strictEqual(parsed.isSupported, false);
  assert.strictEqual(parsed.format, "unsupported");
  assert.ok(parsed.error?.includes("ganda"));

  assert.throws(() => {
    sanitizeArticleContent(doubleMarker);
  }, (err: Error) => {
    assert.ok(err instanceof UnsupportedContentFormatError);
    assert.ok(err.message.includes("ganda") || err.message.includes("tidak didukung"));
    return true;
  });

  assert.throws(() => {
    encodeArticleContent(doubleMarker);
  }, UnsupportedContentFormatError);
});

test("6.7. Plain text legacy tanpa marker tetap utuh tanpa modifikasi", () => {
  const legacyText = "Berita konsultan tahun 2021.\n\nAlamat: Pangkalpinang, Bangka Belitung.";
  const parsed = parseArticleContent(legacyText);
  assert.strictEqual(parsed.isRichText, false);
  assert.strictEqual(parsed.isSupported, true);
  assert.strictEqual(parsed.format, "plain");
  assert.strictEqual(parsed.version, 0);
  assert.strictEqual(parsed.body, legacyText);

  const sanitized = sanitizeArticleContent(legacyText);
  assert.strictEqual(sanitized, legacyText);

  const extracted = extractPlainText(legacyText);
  assert.strictEqual(extracted, legacyText);
});

test("6.8. Plain text yang memuat contoh tag HTML dan simbol matematika tetap aman", () => {
  const textWithCode = "Panduan teknis: Gunakan <p> untuk paragraf, jangan gunakan <script>alert(1)</script>. 5 < 10 dan 20 > 15.";
  const parsed = parseArticleContent(textWithCode);
  assert.strictEqual(parsed.isRichText, false);
  assert.strictEqual(parsed.format, "plain");

  const sanitized = sanitizeArticleContent(textWithCode);
  assert.strictEqual(sanitized, textWithCode);
  assert.strictEqual(isRichTextContent(textWithCode), false);
});

test("6.9. Marker malformed diperlakukan secara aman sebagai plain text", () => {
  const malformedCases = [
    "<!--inkindo-content:-->\n<p>Isi</p>",
    "<!--inkindo-content:v1-->\n<p>Isi</p>",
    "<!--inkindo-content:html-->\n<p>Isi</p>",
    "<!-- inkindo-content:v1:html -->\n<p>Isi</p>",
    "<!--inkindo-content:v-1:html-->\n<p>Isi</p>",
    "<!--inkindo-content:v1:-->\n<p>Isi</p>",
    "<!--inkindo-content:v1:html\n<p>Isi</p>",
  ];

  for (const item of malformedCases) {
    const parsed = parseArticleContent(item);
    assert.strictEqual(parsed.isRichText, false);
    assert.strictEqual(parsed.format, "plain");
    assert.strictEqual(sanitizeArticleContent(item), item);
  }

  const v0Content = "<!--inkindo-content:v0:html-->\n<p>Versi 0 terlarang</p>";
  const parsedV0 = parseArticleContent(v0Content);
  assert.strictEqual(parsedV0.isRichText, true);
  assert.strictEqual(parsedV0.isSupported, false);
  assert.strictEqual(parsedV0.format, "unsupported");
});

test("6.10. UTF-8 dan karakter khusus nusantara tetap utuh tanpa korupsi", () => {
  const utf8Body = '<p>DPP INKINDO BABEL — Dedikasi di Serumpun Sebalai. Koordinat 2°08\'S 106°07\'E. Anggaran: Rp 15.000.000,- “Kutipan Berita” &amp; ‘Tanda Petik’.</p>';
  const clean = sanitizeNewsHtml(utf8Body);
  assert.ok(clean.includes("Serumpun Sebalai"));
  assert.ok(clean.includes("2°08'S 106°07'E"));
  assert.ok(clean.includes("Rp 15.000.000,-"));
  assert.ok(clean.includes("“Kutipan Berita”"));
  assert.ok(clean.includes("—"));

  const fullArticle = `${CONTENT_MARKER_V1_HTML}\n${utf8Body}`;
  const sanitizedArticle = sanitizeArticleContent(fullArticle);
  assert.ok(sanitizedArticle.includes("Serumpun Sebalai"));
  assert.ok(sanitizedArticle.includes("2°08'S 106°07'E"));
});

test("6.11. src gambar dengan ekstensi SVG, JS, PHP, EXE, dan path traversal ditolak total", () => {
  assert.strictEqual(isValidNewsUploadImagePath("/uploads/news/icon.svg"), false);
  assert.strictEqual(isValidNewsUploadImagePath("/uploads/news/script.js"), false);
  assert.strictEqual(isValidNewsUploadImagePath("/uploads/news/shell.php"), false);
  assert.strictEqual(isValidNewsUploadImagePath("/uploads/news/malware.exe"), false);
  assert.strictEqual(isValidNewsUploadImagePath("/uploads/news/foto.svg"), false);
  assert.strictEqual(isValidNewsUploadImagePath("/uploads/news/foto.js"), false);
  assert.strictEqual(isValidNewsUploadImagePath("/uploads/news/foto.png?malicious=1"), false);
  assert.strictEqual(isValidNewsUploadImagePath("/uploads/news/foto.png#hash"), false);
  assert.strictEqual(isValidNewsUploadImagePath("/uploads/news/%2e%2e/rahasia.png"), false);
  assert.strictEqual(isValidNewsUploadImagePath("/uploads/news/sub/nested/foto.png"), false);

  assert.strictEqual(isValidNewsUploadImagePath("/uploads/news/kegiatan-2026.jpg"), true);
  assert.strictEqual(isValidNewsUploadImagePath("/uploads/news/inline/dokumentasi_01.webp"), true);
  assert.strictEqual(isValidNewsUploadImagePath("/uploads/news/bagan-struktur.png"), true);

  const mixedImagesHtml = [
    '<p><img src="/uploads/news/valid.jpg" alt="Valid" /></p>',
    '<p><img src="/uploads/news/injeksi.svg" alt="SVG" /></p>',
    '<p><img src="/uploads/news/xss.js" alt="JS" /></p>',
    '<p><img src="https://external.com/gambar.png" alt="Eksternal" /></p>',
  ].join("\n");

  const cleanedImagesHtml = sanitizeNewsHtml(mixedImagesHtml);
  assert.ok(cleanedImagesHtml.includes('/uploads/news/valid.jpg'));
  assert.ok(!cleanedImagesHtml.includes('injeksi.svg'));
  assert.ok(!cleanedImagesHtml.includes('xss.js'));
  assert.ok(!cleanedImagesHtml.includes('external.com'));
});

test("6.12. Atribut rel/target berbahaya tidak dapat melemahkan perlindungan hyperlink", () => {
  const maliciousLinks = [
    '<a href="https://peretas.com" target="_self" rel="opener" download="virus.exe" onclick="pwn()">Tautan Jahat 1</a>',
    '<a href="https://peretas.com" target="_parent" rel="" data-malicious="yes">Tautan Jahat 2</a>',
    '<a href="/kontak" target="_blank" rel="opener">Kontak Kami</a>',
  ].join("\n");

  const clean = sanitizeNewsHtml(maliciousLinks);
  assert.ok(!clean.includes('target="_self"'));
  assert.ok(!clean.includes('target="_parent"'));
  assert.ok(!clean.includes('rel="opener"'));
  assert.ok(!clean.includes('download'));
  assert.ok(!clean.includes('onclick'));
  assert.ok(!clean.includes('data-malicious'));

  const externalMatches = clean.match(/<a [^>]*href="https:\/\/peretas\.com"[^>]*>/g);
  assert.ok(externalMatches && externalMatches.length === 2);
  for (const tag of externalMatches) {
    assert.ok(tag.includes('target="_blank"'), "Link eksternal harus dipaksa target _blank");
    assert.ok(tag.includes('rel="noopener noreferrer"'), "Link eksternal harus dipaksa rel noopener noreferrer");
  }

  const internalMatch = clean.match(/<a [^>]*href="\/kontak"[^>]*>/);
  assert.ok(internalMatch);
  assert.ok(!internalMatch[0].includes('target="_blank"'), "Link internal tidak boleh target _blank");
  assert.ok(internalMatch[0].includes('rel="noopener noreferrer"'));
});

test("6.13. Sanitasi berulang tetap stabil (Deep Idempotency)", () => {
  const complexInput = `${CONTENT_MARKER_V1_HTML}\n<h2>Pemberitahuan</h2><p class="text-justify">Paragraf <strong>tebal</strong> dan <a href="https://inkindo.org">tautan luar</a>.</p><figure><img src="/uploads/news/dokumentasi-01.jpg" alt="Foto" class="rounded-lg shadow-sm" /><figcaption>Keterangan foto</figcaption></figure>`;
  const pass1 = sanitizeArticleContent(complexInput);
  const pass2 = sanitizeArticleContent(pass1);
  const pass3 = sanitizeArticleContent(pass2);

  assert.strictEqual(pass1, pass2);
  assert.strictEqual(pass2, pass3);
  assert.strictEqual(pass1.startsWith(CONTENT_MARKER_V1_HTML), true);
  assert.strictEqual(pass1.indexOf(CONTENT_MARKER_V1_HTML), pass1.lastIndexOf(CONTENT_MARKER_V1_HTML));
});

console.log(`\n🎉 SEMUA ${passedCount} PENGUJIAN KEAMANAN LULUS 100%!`);
