import assert from "node:assert";
import type { ObjectUrlApi } from "../components/admin/deferred-image-upload";

export const VALID_1X1_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAADElEQVQImWP4z8AAAAMBAQCc479ZAAAAAElFTkSuQmCC",
  "base64"
);

export const VALID_1X1_WEBP = Buffer.from(
  "UklGRjwAAABXRUJQVlA4IDAAAADQAQCdASoBAAEAAUAmJaACdLoB+AADsAD+8ut//NgVzXPv9//S4P0uD9Lg/9KQAAA=",
  "base64"
);

export const CLIENT_IMAGE_MESSAGES = {
  emptyFile: "Ukuran berkas gambar tidak boleh kosong.",
  oversizeFile: "Ukuran berkas maksimal 5 MB.",
  invalidType: "Format berkas harus JPG, PNG, atau WebP.",
} as const;

export function makeImageFile(buf: Buffer, name: string, type: string): File {
  return new File([new Uint8Array(buf)], name, { type });
}

export function requireString(value: string | null | undefined, label: string): string {
  assert.ok(typeof value === "string" && value.length > 0, label);
  return value;
}

export function createUrlSpy(): { api: ObjectUrlApi; created: string[]; revoked: string[] } {
  const created: string[] = [];
  const revoked: string[] = [];
  let seq = 0;

  return {
    created,
    revoked,
    api: {
      createObjectURL: () => {
        seq += 1;
        const url = `blob:mock-${seq}`;
        created.push(url);
        return url;
      },
      revokeObjectURL: (url: string) => {
        revoked.push(url);
      },
    },
  };
}

export type RouteHandler = (req: Request) => Promise<Response>;

export function createTrackedFetcher(
  handler: RouteHandler,
  cookieHeader: string,
  onUpload?: () => void
): typeof fetch {
  return async (_input, init) => {
    onUpload?.();
    const request = new Request("http://localhost/api/test-upload", {
      method: init?.method ?? "POST",
      headers: { cookie: cookieHeader },
      body: init?.body,
    });
    return handler(request);
  };
}

export interface CheckCounter {
  passed: number;
  failed: number;
}

export async function runCheck(
  counter: CheckCounter,
  name: string,
  fn: () => void | Promise<void>
): Promise<void> {
  try {
    await fn();
    counter.passed += 1;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    counter.failed += 1;
    console.error(`  ✗ ${name}`);
    console.error(err);
  }
}
