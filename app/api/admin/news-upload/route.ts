import { NextResponse, type NextRequest } from "next/server";
import { getCurrentAdmin } from "@/lib/auth/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { saveNewsImage, MAX_NEWS_IMAGE_SIZE_BYTES } from "@/lib/storage/news";
import { checkUploadRateLimit, getClientIdentifier } from "@/lib/security/rate-limit";
import { createUploadReceiptToken } from "@/lib/security/upload-receipt";

export async function POST(request: NextRequest | Request) {
  try {
    let tokenFromCookie: string | null = null;
    if ("cookies" in request && typeof request.cookies?.get === "function") {
      tokenFromCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value ?? null;
    }
    if (!tokenFromCookie && typeof request.headers?.get === "function") {
      const cookieHeader = request.headers.get("cookie") || "";
      const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE_NAME}=([^;]*)`));
      if (match) {
        tokenFromCookie = decodeURIComponent(match[1]);
      }
    }

    const auth = await getCurrentAdmin(tokenFromCookie);
    if (!auth.success) {
      if (auth.reason === "USER_INACTIVE") {
        return NextResponse.json(
          {
            success: false,
            error: "Akses ditolak: Akun administrator telah dinonaktifkan.",
          },
          { status: 403 }
        );
      }
      return NextResponse.json(
        {
          success: false,
          error: "Sesi tidak valid atau telah berakhir. Silakan login kembali.",
        },
        { status: 401 }
      );
    }

    const rateLimit = checkUploadRateLimit(
      getClientIdentifier(request, auth.user.id)
    );
    if (!rateLimit.isAllowed) {
      return NextResponse.json(
        {
          success: false,
          error: "Terlalu banyak permintaan unggah gambar. Silakan coba lagi nanti.",
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.retryAfterSeconds),
          },
        }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          error: "Berkas gambar wajib diunggah.",
        },
        { status: 400 }
      );
    }

    if (file.size === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Ukuran berkas gambar kosong.",
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_NEWS_IMAGE_SIZE_BYTES) {
      return NextResponse.json(
        {
          success: false,
          error: "Ukuran berkas melebihi batas maksimum 5 MB.",
        },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const saveResult = await saveNewsImage(buffer);
    if (!saveResult.success || !saveResult.publicPath) {
      return NextResponse.json(
        {
          success: false,
          error: saveResult.error || "Gagal memproses dan menyimpan berkas gambar.",
        },
        { status: 400 }
      );
    }

    const uploadToken = await createUploadReceiptToken({
      adminId: auth.user.id,
      module: "news-cover",
      publicPath: saveResult.publicPath,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Gambar berita berhasil diunggah.",
        data: {
          publicPath: saveResult.publicPath,
          filename: saveResult.filename,
          sizeBytes: saveResult.sizeBytes,
          mimeType: saveResult.mimeType,
          uploadToken,
        },
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "Terjadi kesalahan internal pada server.",
      },
      { status: 500 }
    );
  }
}
