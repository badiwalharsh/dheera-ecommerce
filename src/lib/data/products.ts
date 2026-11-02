import { SAMPLE_PRODUCTS, CATEGORIES } from "@/constants";
import { CatalogProduct, CategoryInfo, ProductFilterState, SortOption } from "@/types/ecommerce";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClientServer } from "@/lib/supabase/server";

export type { CategoryInfo };

// Fallback high-fidelity development fixtures mapped to CatalogProduct interface
const FIXTURE_PRODUCTS: CatalogProduct[] = SAMPLE_PRODUCTS.map((p) => ({
  id: p.id,
  slug: p.slug,
  name: p.name,
  category: p.category,
  categorySlug: p.categorySlug,
  price: p.price,
  originalPrice: p.originalPrice,
  mrp: p.originalPrice,
  taxRatePercent: 12.0,
  tag: p.tag,
  image: p.image,
  gallery: [...p.gallery],
  sku: p.sku,
  description: p.description,
  shortDescription: p.shortDescription,
  fabric: p.fabric,
  care: p.care,
  details: [...p.details],
  sizes: [...p.sizes],
  colors: [...p.colors],
  inStock: p.inStock,
  availabilityStatus: p.isMadeToOrder ? "made_to_order" : "in_stock",
  isReadyToShip: p.isReadyToShip,
  isMadeToOrder: p.isMadeToOrder,
  isFeatured: p.isFeatured,
  isNewArrival: p.isNewArrival,
  isCustomizable: p.isCustomizable,
  status: "published",
  isPrototype: true,
  garmentType:
    p.categorySlug === "kurta-sets"
      ? "Kurta Set"
      : p.categorySlug === "sarees"
      ? "Saree"
      : p.categorySlug === "suits"
      ? "Suit"
      : "Dupatta",
  variants: p.variants.map((v) => ({ ...v })),
  isDevelopmentFixture: true,
}));

/**
 * Archives all prototype products so they cannot appear as active commercial inventory
 */
export function archiveAllPrototypeProducts(): { archivedCount: number; archivedIds: string[] } {
  const archivedIds: string[] = [];
  for (const p of FIXTURE_PRODUCTS) {
    if (p.isPrototype || p.isDevelopmentFixture) {
      p.status = "archived";
      p.inStock = false;
      p.isFeatured = false;
      archivedIds.push(p.id);
    }
  }
  return { archivedCount: archivedIds.length, archivedIds };
}

/**
 * Restores prototype products to published state (e.g. for development / testing reset)
 */
export function restorePrototypeProducts(): { restoredCount: number } {
  let count = 0;
  for (const p of FIXTURE_PRODUCTS) {
    if (p.isPrototype || p.isDevelopmentFixture) {
      p.status = "published";
      p.inStock = true;
      count++;
    }
  }
  return { restoredCount: count };
}



/**
 * Returns data source telemetry without exposing sensitive credentials
 */
export function getDataSourceStatus() {
  const configured = isSupabaseConfigured();
  return {
    isLiveDatabase: configured,
    sourceName: configured ? "Supabase PostgreSQL (Live)" : "Development Catalogue Fixtures (Offline)",
    note: configured
      ? "Connected to cloud PostgreSQL schema"
      : "Using development fixtures until production Supabase credentials are configured",
  };
}

/**
 * Fetches all categories
 */
export async function getCategories(): Promise<CategoryInfo[]> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClientServer();
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (!error && data && data.length > 0) {
        return (data as Array<{ id: string; name: string; slug: string; description?: string; image_url?: string }>).map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          subtitle: c.description || "",
          description: c.description || "",
          image: c.image_url || "/images/banners/hero-editorial.jpg",
          href: `/collections/${c.slug}`,
        }));
      }
    } catch {
      // Supabase connection failed, fall through to fixtures
    }
  }

  return DYNAMIC_CATEGORIES.map((c) => ({ ...c }));
}

/**
 * Fetches a single category by slug
 */
export async function getCategoryBySlug(slug: string): Promise<CategoryInfo | null> {
  const allCategories = await getCategories();
  return allCategories.find((c: CategoryInfo) => c.slug === slug) || null;
}

/**
 * Fetches a product by its URL slug
 */
export async function getProductBySlug(
  slug: string,
  options?: { includeUnpublished?: boolean }
): Promise<CatalogProduct | null> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClientServer();
      const query = supabase
        .from("products")
        .select(`
          id,
          name,
          slug,
          description,
          short_description,
          fabric_care,
          details,
          base_price,
          compare_at_price,
          is_featured,
          is_new_arrival,
          is_customizable,
          is_active,
          tag,
          categories ( id, name, slug ),
          product_images ( id, image_url, alt_text, display_order, is_primary ),
          product_variants ( id, size, colour, sku, price_modifier, inventory ( quantity_available ) )
        `)
        .eq("slug", slug);

      if (!options?.includeUnpublished) {
        query.eq("is_active", true);
      }

      const { data: p, error } = await query.single();

      if (!error && p) {
        const rawCategory = Array.isArray(p.categories) ? p.categories[0] : p.categories;
        const categoryName = (rawCategory as { name?: string })?.name || "Curated";
        const categorySlug = (rawCategory as { slug?: string })?.slug || "kurta-sets";

        const rawImages = (p.product_images || []) as Array<{ image_url: string; is_primary: boolean; display_order: number }>;
        const sortedImages = rawImages.sort((a, b) => a.display_order - b.display_order);
        const primaryImage = sortedImages.find((img) => img.is_primary)?.image_url || sortedImages[0]?.image_url || "/images/banners/hero-editorial.jpg";
        const gallery = sortedImages.map((img) => img.image_url);

        const rawVariants = (p.product_variants || []) as Array<{
          id: string;
          size: string;
          colour?: string;
          sku: string;
          price_modifier?: number;
          inventory?: Array<{ quantity_available: number }> | { quantity_available: number };
        }>;

        const variants = rawVariants.map((v) => {
          const inv = Array.isArray(v.inventory) ? v.inventory[0] : v.inventory;
          const qty = inv?.quantity_available ?? 5;
          return {
            id: v.id,
            size: v.size,
            colour: v.colour,
            sku: v.sku,
            priceModifier: v.price_modifier || 0,
            inStock: qty > 0,
            quantityAvailable: qty,
          };
        });

        const sizes = Array.from(new Set(variants.map((v) => v.size)));
        const colors = Array.from(new Set(variants.map((v) => v.colour).filter(Boolean))) as string[];

        return {
          id: p.id,
          slug: p.slug,
          name: p.name,
          category: categoryName,
          categorySlug,
          price: p.base_price,
          originalPrice: p.compare_at_price,
          tag: p.tag || undefined,
          image: primaryImage,
          gallery: gallery.length > 0 ? gallery : [primaryImage],
          sku: variants[0]?.sku || `DHR-${p.id.slice(0, 6)}`,
          description: p.description,
          shortDescription: p.short_description || undefined,
          fabric: p.fabric_care?.split(".")[0] || "Handcrafted Heritage Textile",
          care: p.fabric_care || "Dry Clean Recommended",
          details: p.details || [],
          sizes,
          colors: colors.length > 0 ? colors : ["Natural"],
          inStock: variants.some((v) => v.inStock),
          isReadyToShip: true,
          isMadeToOrder: false,
          isFeatured: p.is_featured,
          isNewArrival: p.is_new_arrival,
          isCustomizable: p.is_customizable,
          status: p.is_active ? "published" : "archived",
          variants,
          isDevelopmentFixture: false,
        };
      }
    } catch {
      // Supabase query failed, fall through to fixtures
    }
  }

  // Fallback to development fixtures
  const found = FIXTURE_PRODUCTS.find((p) => p.slug === slug || p.id === slug);
  if (!found) return null;

  if (!options?.includeUnpublished && found.status && found.status !== "published") {
    return null;
  }

  return found;
}

/**
 * Fetches a product by its ID
 */
export async function getProductById(
  id: string,
  options?: { includeUnpublished?: boolean }
): Promise<CatalogProduct | null> {
  const found = FIXTURE_PRODUCTS.find((p) => p.id === id);
  if (found) {
    if (!options?.includeUnpublished && found.status && found.status !== "published") {
      return null;
    }
    return found;
  }
  return getProductBySlug(id, options);
}

/**
 * Fetches all products with filtering and sorting
 */
export async function getAllProducts(
  filters?: ProductFilterState,
  sort: SortOption = "featured",
  options?: { includeUnpublished?: boolean }
): Promise<CatalogProduct[]> {
  let products = [...FIXTURE_PRODUCTS];

  // Try live database if configured
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClientServer();
      const query = supabase
        .from("products")
        .select(`
          id,
          name,
          slug,
          description,
          short_description,
          fabric_care,
          details,
          base_price,
          compare_at_price,
          is_featured,
          is_new_arrival,
          is_customizable,
          is_active,
          tag,
          categories ( id, name, slug ),
          product_images ( id, image_url, alt_text, display_order, is_primary ),
          product_variants ( id, size, colour, sku, price_modifier, inventory ( quantity_available ) )
        `);

      if (!options?.includeUnpublished) {
        query.eq("is_active", true);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        products = (data as any[]).map((p: any) => {
          const rawCategory = Array.isArray(p.categories) ? p.categories[0] : p.categories;
          const categoryName = rawCategory?.name || "Curated";
          const categorySlug = rawCategory?.slug || "kurta-sets";

          const rawImages = (p.product_images || []) as Array<{ image_url: string; is_primary: boolean; display_order: number }>;
          const sortedImages = rawImages.sort((a, b) => a.display_order - b.display_order);
          const primaryImage = sortedImages.find((img) => img.is_primary)?.image_url || sortedImages[0]?.image_url || "/images/banners/hero-editorial.jpg";
          const gallery = sortedImages.map((img) => img.image_url);

          const rawVariants = (p.product_variants || []) as Array<{
            id: string;
            size: string;
            colour?: string;
            sku: string;
            price_modifier?: number;
            inventory?: Array<{ quantity_available: number }> | { quantity_available: number };
          }>;

          const variants = rawVariants.map((v) => {
            const inv = Array.isArray(v.inventory) ? v.inventory[0] : v.inventory;
            const qty = inv?.quantity_available ?? 5;
            return {
              id: v.id,
              size: v.size,
              colour: v.colour,
              sku: v.sku,
              priceModifier: v.price_modifier || 0,
              inStock: qty > 0,
              quantityAvailable: qty,
            };
          });

          return {
            id: p.id,
            slug: p.slug,
            name: p.name,
            category: categoryName,
            categorySlug,
            price: p.base_price,
            originalPrice: p.compare_at_price,
            tag: p.tag || undefined,
            image: primaryImage,
            gallery: gallery.length > 0 ? gallery : [primaryImage],
            sku: variants[0]?.sku || `DHR-${p.id.slice(0, 6)}`,
            description: p.description,
            shortDescription: p.short_description || undefined,
            fabric: p.fabric_care?.split(".")[0] || "Handcrafted Heritage Textile",
            care: p.fabric_care || "Dry Clean Recommended",
            details: p.details || [],
            sizes: Array.from(new Set(variants.map((v) => v.size))),
            colors: Array.from(new Set(variants.map((v) => v.colour).filter(Boolean))) as string[],
            inStock: variants.some((v) => v.inStock),
            isReadyToShip: true,
            isMadeToOrder: false,
            isFeatured: p.is_featured,
            isNewArrival: p.is_new_arrival,
            isCustomizable: p.is_customizable,
            status: p.is_active ? "published" : "archived",
            variants,
            isDevelopmentFixture: false,
          };
        });
      }
    } catch {
      // Fall through to fixture products
    }
  }

  // Filter by publication status for public storefront unless includeUnpublished is true
  if (!options?.includeUnpublished) {
    products = products.filter((p) => (p.status ? p.status === "published" : p.inStock));
  }

  // Apply filters in memory
  if (filters) {
    if (filters.category && filters.category !== "all") {
      const catLower = filters.category.toLowerCase();
      products = products.filter(
        (p) =>
          p.categorySlug.toLowerCase() === catLower ||
          p.category.toLowerCase() === catLower
      );
    }

    if (filters.priceRange && filters.priceRange !== "all") {
      if (filters.priceRange === "under-3000") {
        products = products.filter((p) => p.price < 3000);
      } else if (filters.priceRange === "3000-4000") {
        products = products.filter((p) => p.price >= 3000 && p.price <= 4000);
      } else if (filters.priceRange === "above-4000") {
        products = products.filter((p) => p.price > 4000);
      }
    }

    if (filters.minPrice !== undefined) {
      products = products.filter((p) => p.price >= (filters.minPrice ?? 0));
    }
    if (filters.maxPrice !== undefined) {
      products = products.filter((p) => p.price <= (filters.maxPrice ?? Infinity));
    }

    if (filters.size && filters.size !== "all") {
      products = products.filter((p) => p.sizes.includes(filters.size as string));
    }

    if (filters.color && filters.color !== "all") {
      const colLower = filters.color.toLowerCase();
      products = products.filter((p) =>
        p.colors.some((c) => c.toLowerCase() === colLower)
      );
    }

    if (filters.inStockOnly) {
      products = products.filter((p) => p.inStock);
    }

    if (filters.readyToShipOnly) {
      products = products.filter((p) => p.isReadyToShip);
    }

    if (filters.madeToOrderOnly) {
      products = products.filter((p) => p.isMadeToOrder);
    }

    if (filters.searchQuery?.trim()) {
      const q = filters.searchQuery.toLowerCase().trim();
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.fabric.toLowerCase().includes(q) ||
          p.colors.some((c) => c.toLowerCase().includes(q)) ||
          p.details.some((d) => d.toLowerCase().includes(q))
      );
    }
  }

  // Apply sorting
  switch (sort) {
    case "price-asc":
      products.sort((a, b) => a.price - b.price);
      break;
    case "price-desc":
      products.sort((a, b) => b.price - a.price);
      break;
    case "newest":
      products.sort((a, b) => (b.isNewArrival ? 1 : 0) - (a.isNewArrival ? 1 : 0));
      break;
    case "alpha":
      products.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "featured":
    default:
      products.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
      break;
  }

  return products;
}

/**
 * Searches products across name, category, color, fabric, description, and keywords
 */
export async function searchProducts(query: string): Promise<CatalogProduct[]> {
  if (!query.trim()) return [];
  return getAllProducts({ searchQuery: query });
}

/**
 * Fetches related products from the same or complementary categories
 */
export async function getRelatedProducts(
  currentSlugOrId: string,
  categorySlug: string,
  limit: number = 4
): Promise<CatalogProduct[]> {
  const all = await getAllProducts();
  const others = all.filter((p) => p.slug !== currentSlugOrId && p.id !== currentSlugOrId);

  // Prioritize same category first, then remaining
  const sameCategory = others.filter((p) => p.categorySlug === categorySlug);
  const differentCategory = others.filter((p) => p.categorySlug !== categorySlug);

  return [...sameCategory, ...differentCategory].slice(0, limit);
}

// In-memory dynamic categories store
let DYNAMIC_CATEGORIES: CategoryInfo[] = CATEGORIES.map((c) => ({
  id: c.id,
  name: c.name,
  slug: c.slug,
  subtitle: c.description || "",
  description: c.description || "",
  image: c.image || "/images/banners/hero-editorial.jpg",
  href: `/collections/${c.slug}`,
}));

export function getMutableProducts(): CatalogProduct[] {
  return FIXTURE_PRODUCTS;
}

export function getMutableCategories(): CategoryInfo[] {
  return DYNAMIC_CATEGORIES;
}

export function addDynamicProduct(product: CatalogProduct): void {
  const existingIdx = FIXTURE_PRODUCTS.findIndex((p) => p.id === product.id || p.slug === product.slug);
  if (existingIdx >= 0) {
    FIXTURE_PRODUCTS[existingIdx] = product;
  } else {
    FIXTURE_PRODUCTS.unshift(product);
  }
}

export function updateDynamicProduct(id: string, updates: Partial<CatalogProduct>): boolean {
  const index = FIXTURE_PRODUCTS.findIndex((p) => p.id === id || p.slug === id);
  if (index >= 0) {
    FIXTURE_PRODUCTS[index] = { ...FIXTURE_PRODUCTS[index], ...updates };
    return true;
  }
  return false;
}

export function deleteDynamicProduct(id: string): boolean {
  const index = FIXTURE_PRODUCTS.findIndex((p) => p.id === id || p.slug === id);
  if (index >= 0) {
    FIXTURE_PRODUCTS.splice(index, 1);
    return true;
  }
  return false;
}

export function addDynamicCategory(cat: CategoryInfo): void {
  const existingIdx = DYNAMIC_CATEGORIES.findIndex((c) => c.id === cat.id || c.slug === cat.slug);
  if (existingIdx >= 0) {
    DYNAMIC_CATEGORIES[existingIdx] = cat;
  } else {
    DYNAMIC_CATEGORIES.push(cat);
  }
}

export function updateDynamicCategory(id: string, updates: Partial<CategoryInfo>): boolean {
  const index = DYNAMIC_CATEGORIES.findIndex((c) => c.id === id || c.slug === id);
  if (index >= 0) {
    DYNAMIC_CATEGORIES[index] = { ...DYNAMIC_CATEGORIES[index], ...updates };
    return true;
  }
  return false;
}

export function deleteDynamicCategory(id: string): boolean {
  const index = DYNAMIC_CATEGORIES.findIndex((c) => c.id === id || c.slug === id);
  if (index >= 0) {
    DYNAMIC_CATEGORIES.splice(index, 1);
    return true;
  }
  return false;
}
