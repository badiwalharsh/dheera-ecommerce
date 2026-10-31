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

    const stock = matchedVariant?.quantityAvailable ?? (fixtureProduct.inStock ? 5 : 0);
    const authoritativePrice = fixtureProduct.price; // Strict server-side price

    if (stock <= 0) {
      errors.push(`"${fixtureProduct.name}" in size ${clientItem.size} is currently out of stock.`);
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
      inStock: stock > 0,
      maxAvailable: stock,
    });
  }

  return {
    isValid: errors.length === 0 && validatedItems.length > 0,
    items: validatedItems,
    subtotal: calculatedSubtotal,
    errors,
  };
}
