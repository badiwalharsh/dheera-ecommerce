import { Product, ProductImage, Category, ProductVariant } from "./database";

export interface CategoryInfo {
  id: string;
  name: string;
  slug: string;
  subtitle: string;
  description: string;
  image: string;
  href: string;
}

export interface HydratedProduct extends Product {
  category: Category;
  images: ProductImage[];
  variants: ProductVariant[];
}

export interface ProductVariantInfo {
  id: string;
  size: string;
  colour?: string;
  sku: string;
  priceModifier?: number;
  inStock: boolean;
  quantityAvailable: number;
}

export type ProductPublicationStatus = "draft" | "published" | "archived";
export type ProductAvailabilityStatus = "in_stock" | "made_to_order" | "pre_order" | "out_of_stock";

export interface CatalogProduct {
  id: string;
  slug: string;
  name: string;
  category: string;
  categorySlug: "kurta-sets" | "sarees" | "suits" | "dupattas" | string;
  price: number;
  originalPrice?: number;
  mrp?: number;
  taxRatePercent?: number;
  tag?: string;
  image: string;
  gallery: string[];
  sku: string;
  description: string;
  shortDescription?: string;
  fabric: string;
  care: string;
  details: string[];
  sizes: string[];
  colors: string[];
  inStock: boolean;
  stock?: number;
  availabilityStatus?: ProductAvailabilityStatus;
  isReadyToShip: boolean;
  isMadeToOrder: boolean;
  isFeatured: boolean;
  isNewArrival: boolean;
  isCustomizable: boolean;
  status?: ProductPublicationStatus;
  isPrototype?: boolean;
  garmentType?: string;
  craftsmanship?: string;
  fitInfo?: string;
  sizeGuide?: string;
  variants: ProductVariantInfo[];
  isDevelopmentFixture?: boolean;
}

export interface ClientCartItem {
  id: string;
  productId: string;
  slug?: string;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  image: string;
  size: string;
  colour?: string;
  quantity: number;
}

export interface ProductFilterState {
  category?: string;
  priceRange?: string; // "all" | "under-3000" | "3000-4000" | "above-4000"
  minPrice?: number;
  maxPrice?: number;
  size?: string;
  color?: string;
  inStockOnly?: boolean;
  readyToShipOnly?: boolean;
  madeToOrderOnly?: boolean;
  searchQuery?: string;
}

export type SortOption =
  | "featured"
  | "newest"
  | "price-asc"
  | "price-desc"
  | "alpha";
