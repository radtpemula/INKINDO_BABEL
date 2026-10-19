import { NextResponse, type NextRequest } from "next/server";
import { getCurrentAdmin } from "@/lib/auth/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { saveHeroImage, MAX_HERO_IMAGE_SIZE_BYTES } from "@/lib/storage/hero";

export async function POST(request: NextRequest | Request) {
  try {
    let tokenFromCookie: string | null = null;
    if ("cookies" in request && typeof request.cookies?.get === "function") {
      tokenFromCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value ?? null;
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

    if (file.size > MAX_HERO_IMAGE_SIZE_BYTES) {
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

    const saveResult = await saveHeroImage(buffer);
    if (!saveResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: saveResult.error || "Gagal memproses dan menyimpan berkas gambar.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Gambar berhasil diunggah.",
        data: {
          publicPath: saveResult.publicPath,
          filename: saveResult.filename,
          sizeBytes: saveResult.sizeBytes,
          mimeType: saveResult.mimeType,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    const errorMsg =
      err instanceof Error ? err.message : "Terjadi kesalahan internal pada server.";
    return NextResponse.json(
      {
        success: false,
        error: errorMsg,
      },
      { status: 500 }
    );
  }
}
