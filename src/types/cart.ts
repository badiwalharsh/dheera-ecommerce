export interface CartItem {
  id: string; // Composite unique key: `${productId}_${size}_${colour}`
  productId: string;
  productSlug: string;
  name: string;
  sku: string;
  price: number;
  originalPrice?: number;
  image: string;
  size: string;
  colour: string;
  quantity: number;
  inStock?: boolean;
  maxQuantity?: number;
}

export type DiscountType = "percentage" | "fixed";

export interface Coupon {
  id: string;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount?: number;
  description?: string;
  isActive: boolean;
  isDevelopmentFixture: boolean;
}

export interface CustomerInfo {
  fullName: string;
  email: string;
  phone: string;
}

export interface ShippingAddress {
  fullName: string;
  phone: string;
  pincode: string;
  houseNumber: string;
  street: string;
  landmark?: string;
  city: string;
  state: string;
  country: string;
  saveAddress?: boolean;
}

export interface OrderPricingSummary {
  subtotal: number;
  discountAmount: number;
  shippingFee: number;
  taxAmount: number; // Inclusive in India GST standard
  totalAmount: number;
  appliedCoupon?: {
    code: string;
    discountType: DiscountType;
    discountValue: number;
    discountAmount: number;
    description?: string;
    isDevelopmentFixture: boolean;
  };
}

export interface ShippingValidationResult {
  isServiceable: boolean;
  shippingFee: number;
  isFreeShipping: boolean;
  freeShippingThreshold: number;
  remainingForFreeShipping: number;
  estimatedDays: string;
  city?: string;
  state?: string;
  message?: string;
}

export interface CreateOrderPayload {
  items: CartItem[];
  customerInfo: CustomerInfo;
  shippingAddress: ShippingAddress;
  couponCode?: string;
  notes?: string;
}

export interface RazorpayOrderResponse {
  orderId: string; // Internal DHEERA order UUID
  orderNumber: string; // Human-friendly order identifier (e.g. DHR-20261031-1001)
  razorpayOrderId: string;
  amount: number; // in paise (e.g. ₹2999 -> 299900)
  currency: string;
  keyId: string;
  customer: {
    name: string;
    email: string;
    contact: string;
  };
  pricing: OrderPricingSummary;
  isSimulatedTest: boolean;
}

export interface VerifyPaymentPayload {
  orderId: string;
  orderNumber: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export type OrderStatus =
  | "pending"
  | "payment_pending"
  | "pending_payment"
  | "confirmed"
  | "processing"
  | "dispatched"
  | "out_for_delivery"
  | "delivered"
  | "cancelled"
  | "refunded";

export type PaymentStatus =
  | "created"
  | "pending"
  | "authorized"
  | "captured"
  | "failed"
  | "refunded";

export interface ConfirmedOrderDetails {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  createdAt: string;
  customerInfo: CustomerInfo;
  shippingAddress: ShippingAddress;
  items: Array<{
    id: string;
    productId: string;
    productSlug?: string;
    name: string;
    sku: string;
    size: string;
    colour: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    image: string;
  }>;
  pricing: OrderPricingSummary;
  payment: {
    gateway: string;
    gatewayOrderId: string;
    gatewayPaymentId?: string;
    status: PaymentStatus;
    currency: string;
    isTestMode: boolean;
  };
}
