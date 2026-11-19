export const CONTENT_MARKER_V1_HTML = "<!--inkindo-content:v1:html-->";
export const SUPPORTED_CONTENT_VERSION = 1;
export const SUPPORTED_CONTENT_FORMAT = "html";

export const CONTENT_MARKER_REGEX = /^<!--inkindo-content:v(\d+):([a-z0-9_-]+)-->\r?\n?/;

export type ContentFormatType = "plain" | "html" | "unsupported";

export interface ParsedArticleContent {
  isRichText: boolean;
  isSupported: boolean;
  format: ContentFormatType;
  version: number;
  formatIdentifier?: string;
  raw: string;
  body: string;
  error?: string;
}

export class UnsupportedContentFormatError extends Error {
  public readonly version?: number;
  public readonly formatIdentifier?: string;

  constructor(message?: string, version?: number, formatIdentifier?: string) {
    const defaultMsg =
      version !== undefined && formatIdentifier !== undefined
        ? `Format konten tidak didukung: v${version}:${formatIdentifier}. Hanya v1:html atau plain text tanpa penanda yang didukung saat ini.`
        : "Format konten tidak didukung atau penanda format tidak valid.";
    super(message || defaultMsg);
    this.name = "UnsupportedContentFormatError";
    this.version = version;
    this.formatIdentifier = formatIdentifier;
  }
}

export function parseArticleContent(
  raw: string | null | undefined
): ParsedArticleContent {
  if (!raw || typeof raw !== "string") {
    return {
      isRichText: false,
      isSupported: true,
      format: "plain",
      version: 0,
      raw: "",
      body: "",
    };
  }

  const match = raw.match(CONTENT_MARKER_REGEX);
  if (!match) {
    return {
      isRichText: false,
      isSupported: true,
      format: "plain",
      version: 0,
      raw,
      body: raw,
    };
  }

  const version = parseInt(match[1], 10);
  const formatIdentifier = match[2];
  const body = raw.slice(match[0].length);

  if (CONTENT_MARKER_REGEX.test(body.trimStart())) {
    return {
      isRichText: true,
      isSupported: false,
      format: "unsupported",
      version,
      formatIdentifier,
      raw,
      body,
      error: "Penanda format ganda atau bertumpuk terdeteksi",
    };
  }

  if (version === 0) {
    return {
      isRichText: true,
      isSupported: false,
      format: "unsupported",
      version: 0,
      formatIdentifier,
      raw,
      body,
      error: "Versi 0 dengan penanda format tidak didukung",
    };
  }

  if (version === SUPPORTED_CONTENT_VERSION && formatIdentifier === SUPPORTED_CONTENT_FORMAT) {
    return {
      isRichText: true,
      isSupported: true,
      format: "html",
      version: 1,
      formatIdentifier: "html",
      raw,
      body,
    };
  }

  return {
    isRichText: true,
    isSupported: false,
    format: "unsupported",
    version,
    formatIdentifier,
    raw,
    body,
    error: `Format konten tidak didukung: v${version}:${formatIdentifier}`,
  };
}

export function encodeArticleContent(
  body: string,
  marker: string = CONTENT_MARKER_V1_HTML
): string {
  if (marker !== CONTENT_MARKER_V1_HTML) {
    throw new UnsupportedContentFormatError(`Penanda target encoding tidak didukung: ${marker}`);
  }

  const trimmed = body.trim();
  if (!trimmed) return "";

  const parsed = parseArticleContent(trimmed);

  if (parsed.isRichText) {
    if (!parsed.isSupported) {
      throw new UnsupportedContentFormatError(
        parsed.error || `Format konten tidak didukung: v${parsed.version}:${parsed.formatIdentifier}. Tidak dapat melakukan encoding ulang.`,
        parsed.version,
        parsed.formatIdentifier
      );
    }

    if (parsed.format === "html" && parsed.version === 1) {
      const cleanBody = parsed.body.trim();
      return `${CONTENT_MARKER_V1_HTML}\n${cleanBody}`;
    }

    throw new UnsupportedContentFormatError(
      `Format konten tidak didukung: v${parsed.version}:${parsed.formatIdentifier}`,
      parsed.version,
      parsed.formatIdentifier
    );
  }

  return `${marker}\n${trimmed}`;
}

export function isRichTextContent(raw: string | null | undefined): boolean {
  if (!raw || typeof raw !== "string") return false;
  return CONTENT_MARKER_REGEX.test(raw);
}

export function stripHtmlTags(html: string | null | undefined): string {
  if (!html || typeof html !== "string") return "";
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function extractPlainText(raw: string | null | undefined): string {
  if (!raw || typeof raw !== "string") return "";

  const parsed = parseArticleContent(raw);
  if (!parsed.isRichText) {
    return parsed.body.trim();
  }

  if (!parsed.isSupported) {
    throw new UnsupportedContentFormatError(
      parsed.error || `Format konten tidak didukung: v${parsed.version}:${parsed.formatIdentifier}`,
      parsed.version,
      parsed.formatIdentifier
    );
  }

  return stripHtmlTags(parsed.body);
}

export function escapeHtml(str: string): string {
  if (!str || typeof str !== "string") return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function convertPlainTextToEditorHtml(plainText: string): string {
  if (!plainText || typeof plainText !== "string") return "";

  const paragraphs = plainText.split(/\r?\n\r?\n/);
  const htmlParagraphs = paragraphs
    .map((p) => {
      const trimmed = p.trim();
      if (!trimmed) return "";
      const escaped = escapeHtml(trimmed);
      const withBr = escaped.replace(/\r?\n/g, "<br>");
      return `<p>${withBr}</p>`;
    })
    .filter(Boolean);

  return htmlParagraphs.join("");
}
