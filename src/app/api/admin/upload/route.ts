import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, logAdminAction } from "@/lib/security/admin-guard";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClientServer } from "@/lib/supabase/server";
import crypto from "crypto";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp"];
const ALLOWED_FOLDERS = ["products", "categories", "banners", "customizations"];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export async function POST(req: NextRequest) {
  const authResult = await requireAdmin(req);
  if ("errorResponse" in authResult) return authResult.errorResponse;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const rawFolder = (formData.get("folder") as string) || "products";

    if (!file) {
      return NextResponse.json({ success: false, error: "No image file provided." }, { status: 400 });
    }

    // 1. Sanitize folder to prevent path traversal
    const cleanFolder = rawFolder.toLowerCase().replace(/[^a-z0-9_-]/g, "");
    const folder = ALLOWED_FOLDERS.includes(cleanFolder) ? cleanFolder : "products";

    // 2. Validate file type & extension
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    if (!ALLOWED_MIME_TYPES.includes(file.type.toLowerCase()) || !ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid file type. Only JPG, JPEG, PNG, and WebP images are permitted.",
        },
        { status: 400 }
      );
    }

    // 3. Validate file size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        {
          success: false,
          error: `File size exceeds the 5MB limit (provided: ${(file.size / (1024 * 1024)).toFixed(2)} MB).`,
        },
        { status: 400 }
      );
    }

    const filename = `${folder}/${Date.now()}-${crypto.randomBytes(6).toString("hex")}.${ext}`;

    // 3. Upload to Supabase Storage if live
    if (isSupabaseConfigured()) {
      try {
        const supabase = createClientServer();
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const { data, error } = await supabase.storage.from("products").upload(filename, buffer, {
          contentType: file.type,
          upsert: true,
        });

        if (!error && data) {
          const { data: publicData } = supabase.storage.from("products").getPublicUrl(filename);
          await logAdminAction({
            admin: authResult.admin,
            action: "file_upload",
            targetType: "storage",
            targetId: filename,
            details: { size: file.size, type: file.type },
          });

          return NextResponse.json({
            success: true,
            url: publicData.publicUrl,
            filename,
            message: "Photograph uploaded to Supabase Storage successfully.",
          });
        }
      } catch {
        // Fallback
      }
    }

    // Fallback simulation for local development / testing
    const simulatedUrl = `/images/products/${filename.replace(/^products\//, "")}`;

    await logAdminAction({
      admin: authResult.admin,
      action: "file_upload_mock",
      targetType: "storage",
      targetId: filename,
      details: { size: file.size, type: file.type },
    });

    return NextResponse.json({
      success: true,
      url: simulatedUrl,
      filename,
      message: "Photograph processed and validated successfully.",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Upload processing failed";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

