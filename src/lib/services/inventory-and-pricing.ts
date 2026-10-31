import { CartItem } from "@/types/cart";
import { SAMPLE_PRODUCTS } from "@/constants";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClientServer } from "@/lib/supabase/server";

export interface ValidatedItem {
  id: string;
  productId: string;
  productSlug: string;
  name: string;
  sku: string;
  image: string;
  size: string;
  colour: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  inStock: boolean;
  maxAvailable: number;
}

export interface ValidationSummary {
  isValid: boolean;
  items: ValidatedItem[];
  subtotal: number;
  errors: string[];
}

// In-memory stock repository for test & development concurrency integrity
const FIXTURE_INVENTORY = new Map<string, number>();

// Initialize stock from constants
SAMPLE_PRODUCTS.forEach((p) => {
  p.variants.forEach((v) => {
    const key = `${p.id}_${v.size}_${v.colour}`;
    FIXTURE_INVENTORY.set(key, v.quantityAvailable);
  });
});

/**
 * Returns current real-time stock for a variant
 */
export function getAvailableStock(productId: string, size: string, colour?: string): number {
  const key = `${productId}_${size}_${colour || "Standard"}`;
  if (FIXTURE_INVENTORY.has(key)) {
    return FIXTURE_INVENTORY.get(key)!;
  }
  // Check without colour
  const fallbackKey = `${productId}_${size}_Standard`;
  if (FIXTURE_INVENTORY.has(fallbackKey)) {
    return FIXTURE_INVENTORY.get(fallbackKey)!;
  }
  return 5;
}

/**
 * Atomically deducts inventory to prevent overselling and concurrency race conditions
 */
export async function deductInventoryAtomic(
  items: Array<{ productId: string; size: string; colour: string; quantity: number }>
): Promise<{ success: boolean; error?: string }> {
  // 1. Supabase Atomic DB procedure if configured
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClientServer();
      const payload = items.map((i) => ({
        variant_id: i.productId,
        quantity: i.quantity,
      }));
      const { data, error } = await supabase.rpc("deduct_inventory_atomic", { p_items: payload });
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: !!data };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  // 2. Atomic In-Memory Check & Deduct with Rollback Guard
  // Phase A: Pre-check all items
  for (const item of items) {
    const key = `${item.productId}_${item.size}_${item.colour}`;
    const current = FIXTURE_INVENTORY.get(key) ?? 5;
    if (current < item.quantity) {
      return {
        success: false,
        error: `Insufficient stock for ${item.productId} (${item.size}). Requested: ${item.quantity}, Available: ${current}`,
      };
    }
  }

  // Phase B: Atomic deduction
  for (const item of items) {
    const key = `${item.productId}_${item.size}_${item.colour}`;
    const current = FIXTURE_INVENTORY.get(key) ?? 5;
    FIXTURE_INVENTORY.set(key, current - item.quantity);
  }

  return { success: true };
}

/**
 * Resets or sets mock stock for a variant (used by tests)
 */
export function setMockStock(productId: string, size: string, colour: string, stock: number) {
  const key = `${productId}_${size}_${colour}`;
  FIXTURE_INVENTORY.set(key, stock);
}

/**
 * Server-authoritative validation of untrusted client cart items.
 * Fetches actual product prices, verifies variant validity, and enforces stock limits.
 */
export async function validateCartServer(rawItems: CartItem[]): Promise<ValidationSummary> {
  const errors: string[] = [];
  const validatedItems: ValidatedItem[] = [];
  let calculatedSubtotal = 0;

  if (!rawItems || !Array.isArray(rawItems) || rawItems.length === 0) {
    return {
      isValid: false,
      items: [],
      subtotal: 0,
      errors: ["Shopping bag is empty."],
    };
  }

  // 1. Load authoritative product catalog
  let dbProducts: any[] = [];
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClientServer();
      const productIds = rawItems.map((i) => i.productId).filter(Boolean);
      const { data } = await supabase
        .from("products")
        .select(`
          id, slug, name, base_price, is_active,
          product_variants (
            id, size, colour, sku, price_modifier,
            inventory ( quantity_available, allow_backorder )
          ),
          product_images ( image_url, is_primary )
        `)
        .in("id", productIds);
      if (data) dbProducts = data;
    } catch {
      // Fall through to fixtures
    }
  }

  // 2. Validate each item
  for (const clientItem of rawItems) {
    if (!clientItem.productId || typeof clientItem.quantity !== "number" || clientItem.quantity < 1) {
      errors.push(`Invalid product entry or quantity in cart.`);
      continue;
    }

    // Sanitize quantity (max 10 units per line item to prevent stock hoarding)
    const sanitizedQty = Math.min(Math.max(1, Math.floor(clientItem.quantity)), 10);

    // Look in DB products first
    const dbProduct = dbProducts.find((p) => p.id === clientItem.productId);

    if (dbProduct) {
      const variant = dbProduct.product_variants?.find(
        (v: any) => v.size === clientItem.size && (!clientItem.colour || v.colour === clientItem.colour)
      );

      const authoritativePrice = Number(dbProduct.base_price) + Number(variant?.price_modifier || 0);
      const stock = variant?.inventory?.[0]?.quantity_available ?? 10;
      const primaryImage =
        dbProduct.product_images?.find((img: any) => img.is_primary)?.image_url ||
        dbProduct.product_images?.[0]?.image_url ||
        clientItem.image;

      const itemTotal = authoritativePrice * sanitizedQty;
      calculatedSubtotal += itemTotal;

      validatedItems.push({
        id: clientItem.id || `${dbProduct.id}_${clientItem.size}_${clientItem.colour}`,
        productId: dbProduct.id,
        productSlug: dbProduct.slug,
        name: dbProduct.name,
        sku: variant?.sku || `DHR-${dbProduct.slug}-${clientItem.size}`,
        image: primaryImage,
        size: clientItem.size || "Standard",
        colour: clientItem.colour || "Standard",
        quantity: sanitizedQty,
        unitPrice: authoritativePrice,
        totalPrice: itemTotal,
        inStock: stock > 0,
        maxAvailable: stock,
      });
      continue;
    }

    // Fall back to SAMPLE_PRODUCTS
    const fixtureProduct = SAMPLE_PRODUCTS.find(
      (p) => p.id === clientItem.productId || p.slug === clientItem.productSlug
    );

    if (!fixtureProduct) {
      errors.push(`Product "${clientItem.name || clientItem.productId}" is not available in our active catalogue.`);
      continue;
    }

    const matchedVariant = fixtureProduct.variants.find(
      (v) => v.size === clientItem.size && (!clientItem.colour || v.colour === clientItem.colour)
    );

    const realTimeStock = getAvailableStock(
      fixtureProduct.id,
      clientItem.size || "Standard",
      clientItem.colour || "Standard"
    );

    const authoritativePrice = fixtureProduct.price; // Strict server-side price

    if (realTimeStock <= 0) {
      errors.push(`"${fixtureProduct.name}" in size ${clientItem.size} is currently out of stock.`);
    } else if (sanitizedQty > realTimeStock) {
      errors.push(
        `Only ${realTimeStock} unit(s) of "${fixtureProduct.name}" (${clientItem.size}) are currently available.`
      );
    }

    const itemTotal = authoritativePrice * sanitizedQty;
    calculatedSubtotal += itemTotal;

    validatedItems.push({
      id: clientItem.id || `${fixtureProduct.id}_${clientItem.size}_${clientItem.colour}`,
      productId: fixtureProduct.id,
      productSlug: fixtureProduct.slug,
      name: fixtureProduct.name,
      sku: matchedVariant?.sku || `${fixtureProduct.sku}-${clientItem.size}`,
      image: fixtureProduct.image,
      size: clientItem.size || fixtureProduct.sizes[0] || "Standard",
      colour: clientItem.colour || fixtureProduct.colors[0] || "Standard",
      quantity: sanitizedQty,
      unitPrice: authoritativePrice,
      totalPrice: itemTotal,
      inStock: realTimeStock > 0,
      maxAvailable: realTimeStock,
    });
  }

  return {
    isValid: errors.length === 0 && validatedItems.length > 0,
    items: validatedItems,
    subtotal: calculatedSubtotal,
    errors,
  };
}

/**
 * Updates stock directly in the in-memory repository
 */
export function setVariantStock(
  productId: string,
  size: string,
  colour: string = "Standard",
  newQty: number
): void {
  const key = `${productId}_${size}_${colour || "Standard"}`;
  FIXTURE_INVENTORY.set(key, Math.max(0, newQty));
}

/**
 * Atomically adjusts stock by delta preventing negative inventory
 */
export function adjustVariantStockAtomic(
  productId: string,
  size: string,
  colour: string = "Standard",
  delta: number
): { success: boolean; previous: number; current: number; error?: string } {
  const key = `${productId}_${size}_${colour || "Standard"}`;
  const previous = FIXTURE_INVENTORY.has(key) ? FIXTURE_INVENTORY.get(key)! : 5;
  const current = previous + delta;

  if (current < 0) {
    return {
      success: false,
      previous,
      current: previous,
      error: `Insufficient stock: Cannot reduce stock below zero (current: ${previous}, requested delta: ${delta})`,
    };
  }

  FIXTURE_INVENTORY.set(key, current);
  return { success: true, previous, current };
}

export function getAllStockEntries(): Map<string, number> {
  return FIXTURE_INVENTORY;
}
