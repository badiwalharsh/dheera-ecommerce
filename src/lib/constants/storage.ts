/**
 * DHEERA — Supabase Storage Bucket Constants
 * 
 * Defines canonical storage buckets and backward-compatibility aliases.
 * - Product images: Publicly readable; uploads/modifications restricted to authorized admins.
 * - Customization attachments: Private; accessible only by the owning customer and authorized admins.
 */

export const STORAGE_BUCKETS = {
  // Canonical production bucket names
  PRODUCT_IMAGES: "product-images",
  CUSTOMIZATION_ATTACHMENTS: "customization-attachments",

  // Legacy development aliases (maintained for backward compatibility with existing uploads)
  LEGACY_PRODUCTS: "products",
  LEGACY_CUSTOMIZATIONS: "customizations",
} as const;

export type StorageBucketId = (typeof STORAGE_BUCKETS)[keyof typeof STORAGE_BUCKETS];

export const CANONICAL_PUBLIC_BUCKET = STORAGE_BUCKETS.PRODUCT_IMAGES;
export const CANONICAL_PRIVATE_BUCKET = STORAGE_BUCKETS.CUSTOMIZATION_ATTACHMENTS;
