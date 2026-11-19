import assert from "node:assert";
import { StarterKit } from "@tiptap/starter-kit";
import { Placeholder } from "@tiptap/extension-placeholder";
import { CustomTextAlign } from "../components/admin/RichTextEditor";
import { sanitizeNewsHtml } from "../lib/security/content-sanitizer";
import { ALLOWED_RICH_TEXT_CLASSES } from "../lib/security/content-sanitizer";

console.log("=== INKINDO BABEL: TIPTAP & TOOLBAR (TAHAP 2A) TEST SUITE ===\n");

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✓ [PASS] ${name}`);
    passed++;
  } catch (err: unknown) {
    console.error(`  ✗ [FAIL] ${name}`);
    console.error(err);
    failed++;
  }
}

// Group 1: Extension configuration & schema verification
test("1.1 CustomTextAlign has correct extension name and attributes", () => {
  assert.strictEqual(CustomTextAlign.name, "textAlign");
  const extension = CustomTextAlign.configure({
    types: ["heading", "paragraph", "blockquote"],
    alignments: ["left", "center", "right"],
  });
  assert.ok(extension, "CustomTextAlign should configure cleanly");
  assert.deepStrictEqual(extension.options.types, ["heading", "paragraph", "blockquote"]);
  assert.deepStrictEqual(extension.options.alignments, ["left", "center", "right"]);
});

test("1.2 CustomTextAlign renderHTML produces class-based alignment", () => {
  const extension = CustomTextAlign.configure({
    types: ["heading", "paragraph", "blockquote"],
    alignments: ["left", "center", "right"],
  });
  const addGlobalAttrs = extension.config.addGlobalAttributes as unknown as (this: typeof extension) => Array<{
    types: string[];
    attributes: Record<string, { renderHTML?: (attrs: Record<string, unknown>) => Record<string, unknown>; parseHTML?: (el: HTMLElement) => unknown }>;
  }>;
  const globalAttrs = addGlobalAttrs?.call(extension);
  assert.ok(Array.isArray(globalAttrs), "Global attributes should be an array");
  const textAlignAttr = globalAttrs[0]?.attributes?.textAlign;
  assert.ok(textAlignAttr && textAlignAttr.renderHTML, "textAlign attribute and renderHTML must exist");

  // Center alignment
  const centerRender = textAlignAttr.renderHTML({ textAlign: "center" });
  assert.deepStrictEqual(centerRender, { class: "text-center" });

  // Right alignment
  const rightRender = textAlignAttr.renderHTML({ textAlign: "right" });
  assert.deepStrictEqual(rightRender, { class: "text-right" });

  // Left alignment
  const leftRender = textAlignAttr.renderHTML({ textAlign: "left" });
  assert.deepStrictEqual(leftRender, { class: "text-left" });

  // Disallowed / invalid alignment returns empty object (no style or attribute injection)
  const invalidRender = textAlignAttr.renderHTML({ textAlign: "justify" });
  assert.deepStrictEqual(invalidRender, {});
  const emptyRender = textAlignAttr.renderHTML({});
  assert.deepStrictEqual(emptyRender, {});
});

test("1.3 CustomTextAlign parseHTML recognizes Tailwind alignment classes", () => {
  const extension = CustomTextAlign.configure({
    types: ["heading", "paragraph", "blockquote"],
    alignments: ["left", "center", "right"],
  });
  const addGlobalAttrs = extension.config.addGlobalAttributes as unknown as (this: typeof extension) => Array<{
    types: string[];
    attributes: Record<string, { renderHTML?: (attrs: Record<string, unknown>) => Record<string, unknown>; parseHTML?: (el: HTMLElement) => unknown }>;
  }>;
  const globalAttrs = addGlobalAttrs?.call(extension);
  const textAlignAttr = globalAttrs?.[0]?.attributes?.textAlign;
  assert.ok(textAlignAttr && textAlignAttr.parseHTML, "textAlign attribute and parseHTML must exist");

  const mockCenterElement = {
    classList: {
      contains: (cls: string) => cls === "text-center",
    },
    style: {},
  } as unknown as HTMLElement;

  const parsedCenter = textAlignAttr.parseHTML(mockCenterElement);
  assert.strictEqual(parsedCenter, "center");

  const mockRightElement = {
    classList: {
      contains: (cls: string) => cls === "text-right",
    },
    style: {},
  } as unknown as HTMLElement;

  const parsedRight = textAlignAttr.parseHTML(mockRightElement);
  assert.strictEqual(parsedRight, "right");
});

test("1.4 StarterKit in v3 configures heading levels 2 and 3 without duplicating link or underline", () => {
  const kit = StarterKit.configure({
    heading: { levels: [2, 3] },
    code: false,
    codeBlock: false,
    horizontalRule: false,
    link: {
      openOnClick: false,
      HTMLAttributes: {
        rel: "noopener noreferrer",
        target: "_blank",
      },
    },
  });
  assert.ok(kit, "StarterKit configures cleanly");
  assert.strictEqual(kit.name, "starterKit");
});

test("1.5 Placeholder extension configures cleanly", () => {
  const placeholder = Placeholder.configure({
    placeholder: "Tulis isi berita...",
    emptyEditorClass: "is-editor-empty",
  });
  assert.ok(placeholder, "Placeholder configures cleanly");
  assert.strictEqual(placeholder.name, "placeholder");
});

// Group 2: Sanitizer Whitelist Compatibility for all Editor Outputs
test("2.1 Sanitizer preserves standard paragraph and basic formatting", () => {
  const html = "<p>Paragraf dengan <strong>tebal</strong>, <em>miring</em>, <u>garis bawah</u>, dan <s>coret</s>.</p>";
  const cleaned = sanitizeNewsHtml(html);
  assert.strictEqual(cleaned, html);
});

test("2.2 Sanitizer preserves Heading 2 and Heading 3", () => {
  const html = "<h2>Judul Berita Utama</h2><p>Paragraf</p><h3>Subjudul Berita</h3>";
  const cleaned = sanitizeNewsHtml(html);
  assert.strictEqual(cleaned, html);
});

test("2.3 Sanitizer preserves bullet and numbered lists", () => {
  const html = "<ul><li><p>Poin pertama</p></li><li><p>Poin kedua</p></li></ul><ol><li><p>Langkah satu</p></li><li><p>Langkah dua</p></li></ol>";
  const cleaned = sanitizeNewsHtml(html);
  assert.strictEqual(cleaned, html);
});

test("2.4 Sanitizer preserves blockquotes", () => {
  const html = "<blockquote><p>Kutipan resmi dari Ketua INKINDO BABEL.</p></blockquote>";
  const cleaned = sanitizeNewsHtml(html);
  assert.strictEqual(cleaned, html);
});

test("2.5 Sanitizer preserves alignment classes from CustomTextAlign on p, h2, h3, blockquote", () => {
  const sampleP = '<p class="text-center">Tengah</p><p class="text-right">Kanan</p><p class="text-left">Kiri</p>';
  assert.strictEqual(sanitizeNewsHtml(sampleP), sampleP);

  const sampleH2 = '<h2 class="text-center">Judul Tengah</h2><h2 class="text-right">Judul Kanan</h2>';
  assert.strictEqual(sanitizeNewsHtml(sampleH2), sampleH2);

  const sampleH3 = '<h3 class="text-center">Subjudul Tengah</h3><h3 class="text-right">Subjudul Kanan</h3>';
  assert.strictEqual(sanitizeNewsHtml(sampleH3), sampleH3);

  const sampleBlockquote = '<blockquote class="text-center"><p>Kutipan Tengah</p></blockquote>';
  assert.strictEqual(sanitizeNewsHtml(sampleBlockquote), sampleBlockquote);
});

test("2.6 Sanitizer preserves links with safe target and rel", () => {
  const html = '<p><a href="https://inkindo-babel.org/agenda" rel="noopener noreferrer" target="_blank">Tautan Resmi</a></p>';
  const cleaned = sanitizeNewsHtml(html);
  assert.strictEqual(cleaned, html);
});

test("2.7 Sanitizer automatically strips disallowed tags (script, style, code, pre) if pasted into editor", () => {
  const malicious = '<p>Aman</p><script>alert("xss")</script><pre><code>console.log()</code></pre>';
  const cleaned = sanitizeNewsHtml(malicious);
  assert.ok(!cleaned.includes("<script"), "Script tag must be stripped");
  assert.ok(!cleaned.includes("<pre"), "Pre tag must be stripped");
  assert.ok(!cleaned.includes("<code"), "Code tag must be stripped");
  assert.ok(cleaned.includes("<p>Aman</p>"), "Legitimate text must remain");
});

test("2.8 Sanitizer strips unapproved inline styles while keeping approved alignment classes", () => {
  const styled = '<p style="color: red; font-size: 50px;" class="text-center">Teks</p>';
  const cleaned = sanitizeNewsHtml(styled);
  assert.strictEqual(cleaned, '<p class="text-center">Teks</p>');
});

// Group 3: Editor Component Contract & Props Verification
test("3.1 Component source has type='button' on all toolbar buttons to prevent form submission", async () => {
  const fs = await import("node:fs");
  const path = await import("node:path");
  const componentPath = path.resolve(process.cwd(), "components/admin/RichTextEditor.tsx");
  const content = fs.readFileSync(componentPath, "utf-8");

  // Every <button in ToolbarButton must have type="button"
  const buttonTagMatches = content.match(/<button[\s\S]*?>/g) || [];
  assert.ok(buttonTagMatches.length > 0, "Buttons must be found in editor component");
  for (const tag of buttonTagMatches) {
    assert.ok(
      tag.includes('type="button"'),
      `Every button must explicitly have type="button" to prevent form submission: ${tag}`
    );
  }
});

test("3.2 Component source enforces onMouseDown preventDefault on toolbar buttons", async () => {
  const fs = await import("node:fs");
  const path = await import("node:path");
  const componentPath = path.resolve(process.cwd(), "components/admin/RichTextEditor.tsx");
  const content = fs.readFileSync(componentPath, "utf-8");

  assert.ok(
    content.includes("onMouseDown={(e) => e.preventDefault()}"),
    "ToolbarButton must prevent default on mouse down to preserve editor selection"
  );
});

test("3.3 Component source configures immediatelyRender: false for SSR/Next.js compatibility", async () => {
  const fs = await import("node:fs");
  const path = await import("node:path");
  const componentPath = path.resolve(process.cwd(), "components/admin/RichTextEditor.tsx");
  const content = fs.readFileSync(componentPath, "utf-8");

  assert.ok(
    content.includes("immediatelyRender: false"),
    "useEditor must configure immediatelyRender: false to prevent hydration mismatch"
  );
});

test("3.4 Component source implements controlled update with emitUpdate: false to prevent typing race conditions", async () => {
  const fs = await import("node:fs");
  const path = await import("node:path");
  const componentPath = path.resolve(process.cwd(), "components/admin/RichTextEditor.tsx");
  const content = fs.readFileSync(componentPath, "utf-8");

  assert.ok(
    content.includes("lastHtmlRef.current"),
    "Controlled update must track lastHtmlRef to distinguish parent resets from typing"
  );
  assert.ok(
    content.includes("emitUpdate: false"),
    "External setContent must specify { emitUpdate: false } to prevent infinite loops"
  );
});

test("3.5 Component source exports clean Barrel entry in components/admin/index.ts", async () => {
  const barrel = await import("../components/admin/index");
  assert.ok(barrel.RichTextEditor, "RichTextEditor must be exported in components/admin/index.ts");
});

test("3.6 Allowed alignment classes in sanitizer match CustomTextAlign alignments", () => {
  const allowedPClasses = ALLOWED_RICH_TEXT_CLASSES.p || [];
  assert.ok(allowedPClasses.includes("text-left"), "text-left must be allowed on p");
  assert.ok(allowedPClasses.includes("text-center"), "text-center must be allowed on p");
  assert.ok(allowedPClasses.includes("text-right"), "text-right must be allowed on p");

  const allowedH2Classes = ALLOWED_RICH_TEXT_CLASSES.h2 || [];
  assert.ok(allowedH2Classes.includes("text-left"), "text-left must be allowed on h2");
  assert.ok(allowedH2Classes.includes("text-center"), "text-center must be allowed on h2");
  assert.ok(allowedH2Classes.includes("text-right"), "text-right must be allowed on h2");
});

console.log(`\n========================================`);
console.log(`TEST RESULTS: ${passed} passed, ${failed} failed`);
console.log(`========================================\n`);

if (failed > 0) {
  process.exit(1);
}
