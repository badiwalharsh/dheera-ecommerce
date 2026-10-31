import { OrderStatus, PaymentStatus, ShippingAddress, OrderPricingSummary } from "./cart";

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: "customer" | "admin";
  avatarUrl?: string;
  createdAt: string;
  updatedAt?: string;
  orderCount?: number;
}

export type AddressType = "home" | "work" | "other";

export interface CustomerAddress {
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
  addressType: AddressType;
  createdAt: string;
  updatedAt?: string;
}

export interface AddressInput {
  recipientName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  city: string;
  state: string;
  postalCode: string;
  country?: string;
  isDefault?: boolean;
  addressType?: AddressType;
}

export interface ProfileUpdateInput {
  fullName: string;
  phone?: string;
  email?: string;
}

export interface PasswordUpdateInput {
  currentPassword?: string;
  newPassword: string;
  confirmPassword: string;
}

export interface OrderItemPreview {
  id: string;
  productId: string;
  name: string;
  sku: string;
  size: string;
  colour: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  image: string;
}

export interface CustomerOrderSummary {
  id: string;
  orderNumber: string;
  createdAt: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  totalAmount: number;
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  taxAmount: number;
  itemCount: number;
  itemsPreview: OrderItemPreview[];
  trackingNumber?: string;
}

export interface OrderTrackingTimelineStep {
  step: "placed" | "confirmed" | "processing" | "dispatched" | "in_transit" | "delivered";
  label: string;
  description: string;
  status: "completed" | "current" | "upcoming";
  timestamp?: string;
  estimatedDate?: string;
}

export interface CustomerOrderDetail extends CustomerOrderSummary {
  accessToken: string;
  customerInfo: {
    fullName: string;
    email: string;
    phone: string;
  };
  shippingAddress: ShippingAddress;
  items: OrderItemPreview[];
  pricing: OrderPricingSummary;
  payment: {
    gateway: string;
    gatewayOrderId?: string;
    gatewayPaymentId?: string;
    status: PaymentStatus;
    currency: string;
    isTestMode?: boolean;
  };
  trackingTimeline: OrderTrackingTimelineStep[];
}

export interface WishlistItem {
  id: string;
  productId: string;
  name: string;
  slug: string;
  category: string;
  price: number;
  originalPrice?: number;
  image: string;
  inStock: boolean;
  addedAt: string;
}
