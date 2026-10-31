import { CatalogProduct, ProductVariantInfo } from "./ecommerce";
import { ConfirmedOrderDetails, OrderStatus, PaymentStatus } from "./cart";
import { UserProfile } from "./account";

export type AdminRole = "super_admin" | "store_manager";

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: "admin";
  adminRole: AdminRole;
}

export interface AuditLogEntry {
  id: string;
  adminId: string;
  adminEmail: string;
  adminRole: string;
  action: string;
  targetType: string;
  targetId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: string;
}

export interface InventoryMovement {
  id: string;
  variantId: string;
  productName: string;
  sku: string;
  size: string;
  colour?: string;
  previousQuantity: number;
  newQuantity: number;
  changeAmount: number;
  movementType: "restock" | "correction" | "order_deduction" | "order_cancellation" | "damage";
  reason: string;
  adjustedByEmail: string;
  createdAt: string;
}

export interface InventoryVariantRow {
  variantId: string;
  productId: string;
  productName: string;
  productSlug: string;
  category: string;
  sku: string;
  size: string;
  colour?: string;
  quantityAvailable: number;
  quantityReserved: number;
  lowStockThreshold: number;
  status: "in_stock" | "low_stock" | "out_of_stock";
  price: number;
}

export interface StoreContent {
  id: string;
  heroHeading: string;
  heroDescription: string;
  heroImageUrl: string;
  heroCtaText: string;
  heroCtaLink: string;
  promotionalBannerActive: boolean;
  promotionalBannerText: string;
  brandStoryHeading: string;
  brandStoryBody: string;
  newsletterHeading: string;
  newsletterText: string;
  featuredProductIds: string[];
  categoryCards: Array<{
    title: string;
    slug: string;
    subtitle: string;
    imageUrl: string;
  }>;
  updatedAt: string;
}

export interface StoreSettings {
  id: string;
  storeName: string;
  logoUrl: string;
  businessEmail: string;
  contactNumber: string;
  instagramUrl: string;
  currency: string;
  currencySymbol: string;
  shippingBaseFee: number;
  freeShippingThreshold: number;
  taxPercentage: number;
  returnPolicy: string;
  privacyPolicy: string;
  termsConditions: string;
  updatedAt: string;
}

export interface AdminDashboardStats {
  totalRevenue: number;
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  totalCustomers: number;
  averageOrderValue: number;
  recentOrders: ConfirmedOrderDetails[];
  recentCustomers: UserProfile[];
  bestSellingProducts: Array<{
    productId: string;
    name: string;
    slug: string;
    category: string;
    image: string;
    unitsSold: number;
    revenue: number;
  }>;
  salesPerformance: Array<{
    date: string;
    label: string;
    revenue: number;
    orders: number;
  }>;
}

export interface CustomizationRequestItem {
  id: string;
  requestNumber: string;
  userId?: string;
  customerName: string;
  email: string;
  phone: string;
  category: string;
  preferredColour?: string;
  preferredFabric?: string;
  occasion?: string;
  measurements: Record<string, string>;
  designNotes: string;
  referenceImages: string[];
  status:
    | "new_enquiry"
    | "under_review"
    | "awaiting_clarification"
    | "quotation_prepared"
    | "awaiting_customer_approval"
    | "approved"
    | "in_production"
    | "completed"
    | "declined";
  adminNotes?: string;
  estimatedQuote?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductFormData {
  name: string;
  slug: string;
  sku: string;
  category: string;
  categorySlug: string;
  shortDescription: string;
  description: string;
  price: number;
  originalPrice?: number;
  fabric: string;
  colour: string;
  colors: string[];
  sizes: string[];
  care: string;
  details: string[];
  tag?: string;
  isReadyToShip: boolean;
  isMadeToOrder: boolean;
  isCustomizable: boolean;
  isFeatured: boolean;
  isNewArrival: boolean;
  inStock: boolean;
  image: string;
  gallery: string[];
  variants?: ProductVariantInfo[];
}

