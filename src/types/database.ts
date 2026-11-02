/**
 * DHEERA — Database Schema Strong Types
 * Matches the Supabase PostgreSQL relational schema.
 */

export type UserRole = "customer" | "admin" | "staff";

export type OrderStatus =
  | "pending"
  | "payment_pending"
  | "confirmed"
  | "processing"
  | "dispatched"
  | "out_for_delivery"
  | "delivered"
  | "cancelled"
  | "refunded";

export type PaymentStatus =
  | "created"
  | "authorized"
  | "captured"
  | "failed"
  | "refunded";

export type PaymentMethod = "razorpay" | "cod" | "upi" | "card" | "netbanking";

export type CustomizationStatus =
  | "submitted"
  | "under_review"
  | "consultation_scheduled"
  | "fabric_sourced"
  | "in_tailoring"
  | "ready"
  | "dispatched"
  | "closed";

export interface Profile {
  id: string; // references auth.users.id
  email: string;
  fullName: string;
  phone?: string;
  role: UserRole;
  avatarUrl?: string;
  defaultShippingAddressId?: string;
  defaultBillingAddressId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  shortDescription?: string;
  description: string;
  fabricCare?: string;
  details?: string[];
  basePrice: number;
  compareAtPrice?: number;
  taxRatePercent?: number;
  isFeatured: boolean;
  isNewArrival: boolean;
  isCustomizable: boolean;
  isActive: boolean;
  status?: "draft" | "published" | "archived";
  availabilityStatus?: "in_stock" | "made_to_order" | "pre_order" | "out_of_stock";
  isPrototype?: boolean;
  garmentType?: string;
  craftsmanship?: string;
  fitInfo?: string;
  sizeGuide?: string;
  tag?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductImage {
  id: string;
  productId: string;
  imageUrl: string;
  altText: string;
  displayOrder: number;
  isPrimary: boolean;
  createdAt: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  size: string; // e.g. "XS", "S", "M", "L", "XL", "Free Size"
  colour?: string; // e.g. "Rani Pink", "Warm Ivory"
  sku: string;
  priceModifier: number;
  createdAt: string;
  updatedAt: string;
}

export interface Inventory {
  id: string;
  variantId: string;
  quantityAvailable: number;
  quantityReserved: number;
  lowStockThreshold: number;
  allowBackorder: boolean;
  updatedAt: string;
}

export interface Address {
  id: string;
  userId: string;
  recipientName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  addressType: "shipping" | "billing";
  createdAt: string;
  updatedAt: string;
}

export interface Cart {
  id: string;
  userId?: string;
  sessionToken?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  id: string;
  cartId: string;
  variantId: string;
  quantity: number;
  unitPrice: number;
  createdAt: string;
  updatedAt: string;
}

export interface Wishlist {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface WishlistItem {
  id: string;
  wishlistId: string;
  productId: string;
  createdAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId?: string;
  email: string;
  phone: string;
  shippingAddressSnapshot: Address;
  status: OrderStatus;
  subtotal: number;
  discountAmount: number;
  shippingFee: number;
  taxAmount: number;
  totalAmount: number;
  notes?: string;
  trackingNumber?: string;
  shippingCarrier?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  variantId?: string;
  productId: string;
  productName: string;
  sku: string;
  sizeLabel: string;
  colourLabel?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Payment {
  id: string;
  orderId: string;
  paymentMethod: PaymentMethod;
  paymentGateway: "razorpay";
  gatewayOrderId: string;
  gatewayPaymentId?: string;
  gatewaySignature?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  failureReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomizationRequest {
  id: string;
  requestNumber: string;
  userId?: string;
  fullName: string;
  email: string;
  phone: string;
  outfitCategory: string;
  preferredColour?: string;
  preferredFabric?: string;
  occasion?: string;
  measurements?: Record<string, string | number>;
  designNotes: string;
  referenceImageUrls?: string[];
  status: CustomizationStatus;
  adminNotes?: string;
  estimatedQuote?: number;
  createdAt: string;
  updatedAt: string;
}

