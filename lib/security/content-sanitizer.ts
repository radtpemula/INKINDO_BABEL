import sanitizeHtml from "sanitize-html";
import {
  CONTENT_MARKER_V1_HTML,
  encodeArticleContent,
  parseArticleContent,
  UnsupportedContentFormatError,
} from "./content-format";
import { isValidNewsUploadImagePath } from "./image-path";

export { isValidNewsUploadImagePath } from "./image-path";

export const ALLOWED_RICH_TEXT_TAGS = [
  "p",
  "br",
  "h2",
  "h3",
  "strong",
  "em",
  "u",
  "s",
  "ul",
  "ol",
  "li",
  "blockquote",
  "a",
  "img",
  "figure",
  "figcaption",
] as const;

export const ALLOWED_RICH_TEXT_CLASSES: Record<string, string[]> = {
  p: ["text-left", "text-center", "text-right", "text-justify"],
  h2: ["text-left", "text-center", "text-right"],
  h3: ["text-left", "text-center", "text-right"],
  blockquote: ["text-left", "text-center", "text-right"],
  img: [
    "w-full",
    "w-3/4",
    "w-1/2",
    "mx-auto",
    "ml-auto",
    "block",
    "rounded-lg",
    "rounded-xl",
    "shadow-xs",
    "shadow-sm",
    "border",
    "border-slate-200",
  ],
  figure: ["my-6", "mx-auto", "text-center", "w-full", "max-w-2xl", "max-w-3xl"],
  figcaption: ["text-xs", "text-slate-500", "italic", "mt-2", "text-center"],
  ul: ["list-disc", "list-inside", "my-4", "space-y-1"],
  ol: ["list-decimal", "list-inside", "my-4", "space-y-1"],
};

export const SANITIZER_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [...ALLOWED_RICH_TEXT_TAGS],
  allowedAttributes: {
    a: ["href", "target", "rel", "title"],
    img: ["src", "alt", "title", "class"],
    p: ["class"],
    h2: ["class"],
    h3: ["class"],
    blockquote: ["class"],
    figure: ["class"],
    figcaption: ["class"],
    ul: ["class"],
    ol: ["class"],
    li: ["class"],
  },
  allowedClasses: ALLOWED_RICH_TEXT_CLASSES,
  allowedSchemes: ["http", "https", "mailto", "tel"],
  allowedSchemesByTag: {
    a: ["http", "https", "mailto", "tel"],
    img: [],
  },
  allowProtocolRelative: false,
  disallowedTagsMode: "discard",
  exclusiveFilter: (frame) => {
    if (frame.tag === "img") {
      const src = frame.attribs?.src;
      return !isValidNewsUploadImagePath(src);
    }
    return false;
  },
  transformTags: {
    b: "strong",
    i: "em",
    strike: "s",
    del: "s",
    a: (tagName, attribs) => {
      const href = attribs.href ? attribs.href.trim() : "";
      const isExternal = /^https?:\/\//i.test(href);
      const safeAttribs: Record<string, string> = {
        href,
        rel: "noopener noreferrer",
      };
      if (attribs.title) {
        safeAttribs.title = attribs.title.trim();
      }
      if (isExternal) {
        safeAttribs.target = "_blank";
      }
      return {
        tagName: "a",
        attribs: safeAttribs,
      };
    },
  },
};

export function sanitizeNewsHtml(dirtyHtml: string): string {
  if (!dirtyHtml || typeof dirtyHtml !== "string") {
    return "";
  }
  return sanitizeHtml(dirtyHtml, SANITIZER_OPTIONS).trim();
}

export function sanitizeArticleContent(input: string): string {
  if (!input || typeof input !== "string") {
    return "";
  }

  const parsed = parseArticleContent(input);
  if (!parsed.isRichText) {
    return input;
  }

  if (!parsed.isSupported) {
    throw new UnsupportedContentFormatError(
      parsed.error || `Format konten tidak didukung: v${parsed.version}:${parsed.formatIdentifier}`,
      parsed.version,
      parsed.formatIdentifier
    );
  }

  if (parsed.format === "html" && parsed.version === 1) {
    const cleanHtml = sanitizeNewsHtml(parsed.body);
    return encodeArticleContent(cleanHtml, CONTENT_MARKER_V1_HTML);
  }

  throw new UnsupportedContentFormatError(
    `Format konten tidak didukung: v${parsed.version}:${parsed.formatIdentifier}`,
    parsed.version,
    parsed.formatIdentifier
  );
}
