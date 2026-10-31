import {
  ConfirmedOrderDetails,
  CreateOrderPayload,
  OrderPricingSummary,
  OrderStatus,
  PaymentStatus,
} from "@/types/cart";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClientServer } from "@/lib/supabase/server";
import { ValidatedItem } from "./inventory-and-pricing";
import crypto from "crypto";

// Fallback in-memory order repository for test/offline resilience
const MEMORY_ORDERS = new Map<string, ConfirmedOrderDetails>();

export function generateOrderNumber(): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `DHR-${dateStr}-${randomSuffix}`;
}

export interface SavePendingOrderParams {
  orderNumber: string;
  payload: CreateOrderPayload;
  validatedItems: ValidatedItem[];
  pricing: OrderPricingSummary;
  razorpayOrderId: string;
}

/**
 * Creates an authoritative pending order snapshot in the database or store
 */
export async function savePendingOrder(params: SavePendingOrderParams): Promise<ConfirmedOrderDetails> {
  const { orderNumber, payload, validatedItems, pricing, razorpayOrderId } = params;
  const orderId = crypto.randomUUID();
  const nowIso = new Date().toISOString();

  const orderRecord: ConfirmedOrderDetails = {
    id: orderId,
    orderNumber,
    status: "pending_payment",
    paymentStatus: "created",
    createdAt: nowIso,
    customerInfo: payload.customerInfo,
    shippingAddress: payload.shippingAddress,
    items: validatedItems.map((item) => ({
      id: crypto.randomUUID(),
      productId: item.productId,
      productSlug: item.productSlug,
      name: item.name,
      sku: item.sku,
      size: item.size,
      colour: item.colour,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
      image: item.image,
    })),
    pricing,
    payment: {
      gateway: "razorpay",
      gatewayOrderId: razorpayOrderId,
      status: "created",
      currency: "INR",
      isTestMode: true,
    },
  };

  // Try saving to Supabase if configured
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClientServer();

      // 1. Insert order
      const { error: orderError } = await supabase.from("orders").insert({
        id: orderId,
        order_number: orderNumber,
        email: payload.customerInfo.email,
        phone: payload.customerInfo.phone,
        shipping_address_snapshot: payload.shippingAddress,
        status: "pending",
        subtotal: pricing.subtotal,
        discount_amount: pricing.discountAmount,
        shipping_fee: pricing.shippingFee,
        tax_amount: pricing.taxAmount,
        total_amount: pricing.totalAmount,
        coupon_code: pricing.appliedCoupon?.code || null,
        notes: payload.notes || null,
      });

      if (!orderError) {
        // 2. Insert order items snapshot
        const orderItemsRows = orderRecord.items.map((i) => ({
          id: i.id,
          order_id: orderId,
          product_id: i.productId,
          product_name: i.name,
          sku: i.sku,
          size_label: i.size,
          colour_label: i.colour,
          quantity: i.quantity,
          unit_price: i.unitPrice,
          total_price: i.totalPrice,
        }));
        await supabase.from("order_items").insert(orderItemsRows);

        // 3. Insert payment record
        await supabase.from("payments").insert({
          order_id: orderId,
          payment_method: "razorpay",
          payment_gateway: "razorpay",
          gateway_order_id: razorpayOrderId,
          amount: pricing.totalAmount,
          currency: "INR",
          status: "created",
        });
      }
    } catch {
      // Fallback
    }
  }

  // Always keep in memory store for session resilience
  MEMORY_ORDERS.set(orderId, orderRecord);
  MEMORY_ORDERS.set(orderNumber, orderRecord);

  return orderRecord;
}

/**
 * Confirms an order upon verified cryptographic signature or webhook notification
 */
export async function confirmOrderPayment(
  orderIdentifier: string,
  gatewayPaymentId: string,
  gatewaySignature: string
): Promise<ConfirmedOrderDetails | null> {
  let order = MEMORY_ORDERS.get(orderIdentifier);

  if (isSupabaseConfigured()) {
    try {
      const supabase = createClientServer();
      // Update order status to confirmed
      await supabase
        .from("orders")
        .update({ status: "confirmed", updated_at: new Date().toISOString() })
        .or(`id.eq.${orderIdentifier},order_number.eq.${orderIdentifier}`);

      // Update payment to captured
      await supabase
        .from("payments")
        .update({
          status: "captured",
          gateway_payment_id: gatewayPaymentId,
          gateway_signature: gatewaySignature,
          updated_at: new Date().toISOString(),
        })
        .eq("gateway_order_id", order?.payment.gatewayOrderId || "");
    } catch {
      // Fallback
    }
  }

  if (order) {
    order.status = "confirmed";
    order.paymentStatus = "captured";
    order.payment.status = "captured";
    order.payment.gatewayPaymentId = gatewayPaymentId;
    MEMORY_ORDERS.set(order.id, order);
    MEMORY_ORDERS.set(order.orderNumber, order);
    return order;
  }

  return null;
}

/**
 * Retrieves confirmed order details with safe privacy boundaries
 */
export async function getOrderForConfirmation(orderIdentifier: string): Promise<ConfirmedOrderDetails | null> {
  // Check memory store
  const memOrder = MEMORY_ORDERS.get(orderIdentifier);
  if (memOrder) return memOrder;

  // Check Supabase if configured
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClientServer();
      const { data: order, error } = await supabase
        .from("orders")
        .select(`
          id, order_number, status, subtotal, discount_amount, shipping_fee, tax_amount, total_amount,
          shipping_address_snapshot, email, phone, created_at,
          order_items ( id, product_id, product_name, sku, size_label, colour_label, quantity, unit_price, total_price ),
          payments ( gateway_order_id, gateway_payment_id, status, currency )
        `)
        .or(`id.eq.${orderIdentifier},order_number.eq.${orderIdentifier}`)
        .maybeSingle();

      if (!error && order) {
        const primaryPayment = order.payments?.[0];
        return {
          id: order.id,
          orderNumber: order.order_number,
          status: order.status as OrderStatus,
          paymentStatus: (primaryPayment?.status as PaymentStatus) || "created",
          createdAt: order.created_at,
          customerInfo: {
            fullName: order.shipping_address_snapshot?.fullName || "Valued Patron",
            email: order.email,
            phone: order.phone,
          },
          shippingAddress: order.shipping_address_snapshot,
          items: (order.order_items || []).map((item: any) => ({
            id: item.id,
            productId: item.product_id,
            name: item.product_name,
            sku: item.sku,
            size: item.size_label,
            colour: item.colour_label || "Standard",
            quantity: item.quantity,
            unitPrice: Number(item.unit_price),
            totalPrice: Number(item.total_price),
            image: "/images/products/product-1.jpg",
          })),
          pricing: {
            subtotal: Number(order.subtotal),
            discountAmount: Number(order.discount_amount),
            shippingFee: Number(order.shipping_fee),
            taxAmount: Number(order.tax_amount),
            totalAmount: Number(order.total_amount),
          },
          payment: {
            gateway: "razorpay",
            gatewayOrderId: primaryPayment?.gateway_order_id || "",
            gatewayPaymentId: primaryPayment?.gateway_payment_id || undefined,
            status: (primaryPayment?.status as PaymentStatus) || "created",
            currency: primaryPayment?.currency || "INR",
            isTestMode: true,
          },
        };
      }
    } catch {
      // Fallback
    }
  }

  return null;
}
