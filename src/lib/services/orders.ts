import {
  ConfirmedOrderDetails,
  CreateOrderPayload,
  OrderPricingSummary,
  OrderStatus,
  PaymentStatus,
} from "@/types/cart";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClientServer } from "@/lib/supabase/server";
import { ValidatedItem, deductInventoryAtomic } from "./inventory-and-pricing";
import crypto from "crypto";

// Fallback in-memory order repository for test/offline resilience
const MEMORY_ORDERS = new Map<string, ConfirmedOrderDetails>();
const PROCESSED_WEBHOOKS_MEMORY = new Set<string>();

export function generateOrderNumber(): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `DHR-${dateStr}-${randomSuffix}`;
}

export function generateAccessToken(): string {
  return crypto.randomBytes(32).toString("hex");
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
  const accessToken = generateAccessToken();
  const nowIso = new Date().toISOString();

  const orderRecord: ConfirmedOrderDetails = {
    id: orderId,
    orderNumber,
    accessToken,
    userId: payload.userId,
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
    const supabase = createClientServer();

    // 1. Insert order
    const { error: orderError } = await supabase.from("orders").insert({
      id: orderId,
      order_number: orderNumber,
      access_token: accessToken,
      user_id: payload.userId || null,
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

    if (orderError) {
      if (process.env.NODE_ENV === "production") {
        throw new Error(`Database error: Failed to safely persist order snapshot. [${orderError.code}]`);
      }
    } else {
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
  }

  // Keep in memory store for session resilience & test fallback
  MEMORY_ORDERS.set(orderId, orderRecord);
  MEMORY_ORDERS.set(orderNumber, orderRecord);

  return orderRecord;
}

/**
 * Internal server lookup (bypasses customer authorization check)
 */
export async function getInternalOrder(orderIdentifier: string): Promise<ConfirmedOrderDetails | null> {
  const memOrder = MEMORY_ORDERS.get(orderIdentifier);
  if (memOrder) return memOrder;

  if (isSupabaseConfigured()) {
    try {
      const supabase = createClientServer();
      const { data: dbOrder, error } = await supabase
        .from("orders")
        .select(`
          id, order_number, access_token, user_id, status, subtotal, discount_amount, shipping_fee, tax_amount, total_amount,
          shipping_address_snapshot, email, phone, created_at,
          order_items ( id, product_id, product_name, sku, size_label, colour_label, quantity, unit_price, total_price ),
          payments ( gateway_order_id, gateway_payment_id, status, currency )
        `)
        .or(`id.eq.${orderIdentifier},order_number.eq.${orderIdentifier}`)
        .maybeSingle();

      if (!error && dbOrder) {
        const primaryPayment = dbOrder.payments?.[0];
        const record: ConfirmedOrderDetails = {
          id: dbOrder.id,
          orderNumber: dbOrder.order_number,
          accessToken: dbOrder.access_token || "",
          userId: dbOrder.user_id || undefined,
          status: dbOrder.status as OrderStatus,
          paymentStatus: (primaryPayment?.status as PaymentStatus) || "created",
          createdAt: dbOrder.created_at,
          customerInfo: {
            fullName: dbOrder.shipping_address_snapshot?.fullName || "Valued Patron",
            email: dbOrder.email,
            phone: dbOrder.phone,
          },
          shippingAddress: dbOrder.shipping_address_snapshot,
          items: (dbOrder.order_items || []).map((item: any) => ({
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
            subtotal: Number(dbOrder.subtotal),
            discountAmount: Number(dbOrder.discount_amount),
            shippingFee: Number(dbOrder.shipping_fee),
            taxAmount: Number(dbOrder.tax_amount),
            totalAmount: Number(dbOrder.total_amount),
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
        MEMORY_ORDERS.set(dbOrder.id, record);
        MEMORY_ORDERS.set(dbOrder.order_number, record);
        return record;
      }
    } catch {
      // Fallback
    }
  }

  return null;
}

/**
 * Confirms an order upon verified cryptographic signature or webhook notification
 * Validates order status, prevents duplicate confirmation, and atomically deducts stock.
 */
export async function confirmOrderPayment(
  orderIdentifier: string,
  gatewayPaymentId: string,
  gatewaySignature: string
): Promise<ConfirmedOrderDetails | null> {
  const order = await getInternalOrder(orderIdentifier);

  if (isSupabaseConfigured()) {
    try {
      const supabase = createClientServer();

      // Check current order status
      const { data: existingOrder } = await supabase
        .from("orders")
        .select("id, status, inventory_deducted")
        .or(`id.eq.${orderIdentifier},order_number.eq.${orderIdentifier}`)
        .maybeSingle();

      if (existingOrder && existingOrder.status === "confirmed") {
        return order; // Already confirmed idempotently
      }

      // Update order status to confirmed
      await supabase
        .from("orders")
        .update({
          status: "confirmed",
          payment_verified_at: new Date().toISOString(),
          inventory_deducted: true,
          updated_at: new Date().toISOString(),
        })
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
    if (order.status === "confirmed") {
      return order; // Idempotent return
    }

    // Atomically deduct inventory
    const deductionItems = order.items.map((i) => ({
      productId: i.productId,
      size: i.size,
      colour: i.colour,
      quantity: i.quantity,
    }));
    await deductInventoryAtomic(deductionItems);

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
 * Persists webhook event ID in Supabase to enforce database-level unique constraint
 * Prevents replay attacks and duplicate payment processing.
 */
export async function recordWebhookEvent(
  eventId: string,
  eventType: string,
  payload: Record<string, any>
): Promise<{ alreadyProcessed: boolean }> {
  // 1. Supabase database-level unique constraint
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClientServer();
      const { error } = await supabase.from("webhook_events").insert({
        event_id: eventId,
        event_type: eventType,
        gateway: "razorpay",
        payload,
      });

      if (error) {
        // Postgres error 23505 = unique_violation
        if (error.code === "23505") {
          return { alreadyProcessed: true };
        }
      }
    } catch {
      // Fall through to memory check
    }
  }

  // 2. Memory Set fallback
  if (PROCESSED_WEBHOOKS_MEMORY.has(eventId)) {
    return { alreadyProcessed: true };
  }
  PROCESSED_WEBHOOKS_MEMORY.add(eventId);

  return { alreadyProcessed: false };
}

/**
 * Retrieves confirmed order details with secure access validation
 * Prevents Insecure Direct Object Reference (IDOR) attacks:
 * - Requires matching access_token OR authenticated user ownership.
 */
export async function getOrderForConfirmation(
  orderIdentifier: string,
  providedToken?: string | null,
  userId?: string | null
): Promise<{ order: ConfirmedOrderDetails | null; authorized: boolean }> {
  const order = await getInternalOrder(orderIdentifier);

  if (!order) {
    return { order: null, authorized: false };
  }

  // AUTHORIZATION CHECK (IDOR Protection)
  // 1. Authenticated customer ownership
  if (userId && (order.userId === userId || (order as any).user_id === userId)) {
    return { order, authorized: true };
  }

  // 2. Cryptographic Access Token validation
  if (providedToken && order.accessToken && order.accessToken === providedToken) {
    return { order, authorized: true };
  }

  // Unauthorized access attempt
  return { order: null, authorized: false };
}

/**
 * Retrieves all orders belonging to a customer
 */
export async function getCustomerOrders(
  userId: string,
  email?: string
): Promise<ConfirmedOrderDetails[]> {
  const results: ConfirmedOrderDetails[] = [];
  const seenIds = new Set<string>();

  if (isSupabaseConfigured()) {
    try {
      const supabase = createClientServer();
      const { data: dbOrders, error } = await supabase
        .from("orders")
        .select(`
          id, order_number, access_token, user_id, status, subtotal, discount_amount, shipping_fee, tax_amount, total_amount,
          shipping_address_snapshot, email, phone, created_at, tracking_number,
          order_items ( id, product_id, product_name, sku, size_label, colour_label, quantity, unit_price, total_price ),
          payments ( gateway_order_id, gateway_payment_id, status, currency )
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (!error && Array.isArray(dbOrders)) {
        for (const dbOrder of dbOrders) {
          const primaryPayment = dbOrder.payments?.[0];
          const record: ConfirmedOrderDetails = {
            id: dbOrder.id,
            orderNumber: dbOrder.order_number,
            accessToken: dbOrder.access_token || "",
            userId: dbOrder.user_id,
            status: dbOrder.status as OrderStatus,
            paymentStatus: (primaryPayment?.status as PaymentStatus) || "created",
            createdAt: dbOrder.created_at,
            customerInfo: {
              fullName: dbOrder.shipping_address_snapshot?.fullName || "Valued Patron",
              email: dbOrder.email,
              phone: dbOrder.phone,
            },
            shippingAddress: dbOrder.shipping_address_snapshot,
            items: (dbOrder.order_items || []).map((item: any) => ({
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
              subtotal: Number(dbOrder.subtotal),
              discountAmount: Number(dbOrder.discount_amount),
              shippingFee: Number(dbOrder.shipping_fee),
              taxAmount: Number(dbOrder.tax_amount),
              totalAmount: Number(dbOrder.total_amount),
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
          seenIds.add(record.id);
          results.push(record);
        }
      }
    } catch {
      // Fallback
    }
  }

  // Also include in-memory orders belonging to this user or email
  MEMORY_ORDERS.forEach((ord) => {
    if (!seenIds.has(ord.id)) {
      const matchesUser = ord.userId === userId;
      const matchesEmail = email && ord.customerInfo.email.toLowerCase() === email.toLowerCase();
      if (matchesUser || (matchesEmail && !ord.userId)) {
        seenIds.add(ord.id);
        results.push(ord);
      }
    }
  });

  return results.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/**
 * Associates past guest orders with customer's authenticated user_id
 * Parameterless RPC in Supabase strictly derives caller identity from auth.uid()
 * and validates email confirmation.
 */
export async function associateGuestOrdersForUser(
  userId: string,
  email: string,
  isAdmin: boolean = false
): Promise<number> {
  let count = 0;
  const cleanEmail = email.trim().toLowerCase();

  if (isSupabaseConfigured()) {
    try {
      const supabase = createClientServer();
      if (isAdmin) {
        const { data, error } = await supabase.rpc("associate_guest_orders_admin", {
          p_target_user_id: userId,
        });
        if (!error && typeof data === "number") count = data;
      } else {
        // Parameterless call deriving user from auth.uid() and verified email
        const { data, error } = await supabase.rpc("associate_guest_orders");
        if (!error && typeof data === "number") count = data;
      }
    } catch {
      // Fallback
    }
  }

  // Update in-memory orders (only guest orders where userId is null)
  MEMORY_ORDERS.forEach((ord) => {
    if (ord.customerInfo.email.toLowerCase() === cleanEmail && !ord.userId) {
      ord.userId = userId;
      count++;
    }
  });

  return count;
}
