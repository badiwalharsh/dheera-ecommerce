# DHEERA — Complete Commercial Product Onboarding Guide

**Brand:** DHEERA — Apparel & Lifestyle  
**Descriptor:** Indian Heritage, Contemporary Soul  
**Tagline:** Made in India | For the World.  
**Version:** Phase 8.7 Complete Storefront Edition  

---

## 1. Introduction

This guide documents the full lifecycle for onboarding, editing, publishing, and managing commercial garment inventory on the DHEERA digital commerce platform.

The system is designed to preserve artisan authenticity, protect data integrity, prevent accidental publication of incomplete inventory, and support both single-item manual creation and bulk CSV management.

---

## 2. Admin Catalogue Management Interface

Merchants and store administrators manage products at `/admin/products`.

### Core Capabilities:
- **Create New Garment (`/admin/products/new`):** Full editorial form with live 3:4 portrait storefront preview.
- **Edit Garment (`/admin/products/[id]/edit`):** Update prices, inventory, sizes, colors, photography, care, and craftsmanship notes.
- **Clone / Duplicate Garment:** Quickly replicate standard styles while generating unique SKUs and placing the copy in `draft` state.
- **Archive Garment:** Safely hide garments from customer view while preserving historical orders and customer order logs.
- **Archive Prototypes Button:** One-click action to retire all development prototypes into private archives before public onboarding.
- **Bulk Import via CSV (`/api/admin/products/import`):** Validate and upload dozens of garments simultaneously.
- **Catalogue Export (`/api/admin/products/export`):** Download the current live, draft, or out-of-stock inventory as a standardized UTF-8 CSV.
- **Status Filtering:** Instantly filter catalogue by `Published (Live)`, `Draft (Private)`, `Out of Stock`, `Archived`, or `Prototypes Only`.

---

## 3. Product Publication Readiness Rules

To protect customer trust and brand credibility, DHEERA enforces a **7-point Publication Readiness Checklist**. An item cannot be published live to the storefront unless all requirements are fulfilled:

1. **Garment Name:** Must not be blank.
2. **Unique SKU:** Must be unique across all active and draft garments (e.g., `DHR-KS-001`).
3. **Category Selected:** Must be assigned to one of the approved categories (`Kurta Sets`, `Sarees`, `Suits`, `Dupattas`).
4. **Selling Price:** Must be a valid positive number in INR (`> 0`).
5. **Editorial Narrative:** Must include high-quality narrative description detailing the garment's occasion, drape, and silhouette.
6. **Main Cover Photograph:** Must have at least one uploaded photograph assigned as the Primary Cover Image.
7. **Availability Status:** Must specify `in_stock`, `made_to_order`, `pre_order`, or `out_of_stock`.

> **Note:** If an administrator saves an incomplete product, the system automatically saves it as **`draft`** so work in progress is never exposed on the public storefront.

---

## 4. Multi-Image Photography & Angle Management

Every garment supports multiple high-resolution photographs in strict 3:4 portrait aspect ratio (1200×1600 px minimum; 2400×3200 px recommended).

### Upload Specifications:
- **Supported Formats:** JPEG (`.jpg`, `.jpeg`), PNG (`.png`), WebP (`.webp`), and AVIF (`.avif`).
- **File Size Limit:** 10 MB per image.
- **Storage:** Stored in the canonical Supabase Storage `product-images` bucket under the `products/` folder with secure UUID naming.
- **CDN Optimization:** Next.js automatically generates responsive AVIF/WebP variations at 85% quality with client device caching.

### Gallery Management Controls:
- **Cover Image Selection:** Click "Set Cover" on any thumbnail to designate the primary catalog image.
- **Reordering:** Click `◀` (Move Earlier) or `▶` (Move Later) to arrange the image display sequence.
- **Photography Angle Tags:** Tag each image with its angle:
  - `Front View` (Full-length hero)
  - `Back View` (Rear yoke, neck depth, and drape)
  - `Detail & Embroidery` (Neckline zardozi, gota, or threadwork)
  - `Border Work` (Hemline, dupatta border, or pallu)
  - `Fabric Texture` (Weave, handloom texture, and lining)
  - `Styling & Draping` (Lifestyle, movement, or paired jewelry)
- **Safe Deletion:** Click `✕` to delete an asset. The API validates admin permissions, sanitizes the path, removes the file from cloud storage, and records an audit log.

---

## 5. CSV Bulk Import & Export Operations

### Standard CSV Header Structure:
```csv
name,sku,category,price,originalPrice,mrp,taxRatePercent,stock,status,availabilityStatus,fabric,care,craftsmanship,fitInfo,garmentType,colour,colors,sizes,details,isFeatured,isNewArrival,isCustomizable,inStock,image,gallery
```

### Import Lifecycle:
1. **Validation Mode:** The CSV is uploaded and parsed in memory without touching the database. The system checks:
   - Duplicate SKUs within the CSV or existing database.
   - Required fields (Name, SKU, Category, Price).
   - Valid numeric price and non-negative stock counts.
   - Allowed categories.
2. **Review Report:** The admin is presented with an itemized summary showing valid garments ready for creation and specific line-number validation errors.
3. **Confirm Execution:** Once confirmed, products are created in `draft` status, ensuring an admin can review photos before making them public.

### Export Lifecycle:
- Navigate to `/admin/products` and click **"Export CSV"** (or use `/api/admin/products/export`).
- Supports query filtering by status (`?status=published`, `?status=out_of_stock`, `?status=draft`) and category (`?category=kurta-sets`).
- Generates a properly quoted, UTF-8 encoded `.csv` file with timestamped attachment header.
- Every export is logged in the administrative audit trail (`product_export`).

---

## 6. Out-of-Stock and Lifecycle Handling

- When inventory reaches `0` or `availabilityStatus` is set to `"out_of_stock"`:
  - The storefront displays a clear **"Out of Stock"** badge on product cards.
  - Direct hover add-to-bag shortcuts are disabled.
  - The Product Detail Page disables the "Add to Shopping Bag" button and replaces the label with "Out of Stock".
  - The admin products dashboard allows filtering specifically for out-of-stock items for replenishment tracking.
