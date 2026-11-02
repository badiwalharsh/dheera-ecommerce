import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/security/admin-guard";
import { getAdminProducts } from "@/lib/services/admin";
import {
  parseCsvText,
  validateCsvProducts,
  executeCsvImport,
} from "@/lib/services/product-import";

export async function POST(req: NextRequest) {
  const authResult = await requireAdmin(req);
  if ("errorResponse" in authResult) return authResult.errorResponse;

  try {
    const contentType = req.headers.get("content-type") || "";
    let csvText = "";
    let mode: "validate" | "confirm" = "validate";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      mode = (formData.get("mode") as "validate" | "confirm") || "validate";

      if (!file) {
        return NextResponse.json({ success: false, error: "No CSV file uploaded." }, { status: 400 });
      }
      csvText = await file.text();
    } else {
      const body = await req.json();
      csvText = body.csvText || "";
      mode = body.mode || "validate";
    }

    if (!csvText.trim()) {
      return NextResponse.json({ success: false, error: "CSV content cannot be empty." }, { status: 400 });
    }

    const rows = parseCsvText(csvText);
    if (rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No product data rows found in CSV. Please ensure the template header row and at least one data row are provided.",
        },
        { status: 400 }
      );
    }

    const existingProducts = await getAdminProducts();
    const report = validateCsvProducts(rows, existingProducts);

    if (mode === "validate") {
      return NextResponse.json({
        success: true,
        mode: "validate",
        report,
      });
    }

    // mode === "confirm"
    if (report.validCount === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Cannot import. Zero valid rows detected in the provided CSV file. Please fix validation errors.",
          report,
        },
        { status: 400 }
      );
    }

    const result = await executeCsvImport(rows, authResult.admin);

    return NextResponse.json({
      success: true,
      mode: "confirm",
      importedCount: result.importedCount,
      report,
      message: `Successfully imported ${result.importedCount} garment(s) as DRAFTS. Review, upload photography, and publish each item individually from the admin dashboard.`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "CSV import failed";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

