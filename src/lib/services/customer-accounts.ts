import {
  UserProfile,
  CustomerAddress,
  AddressInput,
  ProfileUpdateInput,
  OrderTrackingTimelineStep,
  WishlistItem,
} from "@/types/account";
import { ConfirmedOrderDetails, OrderStatus } from "@/types/cart";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClientServer } from "@/lib/supabase/server";
import { SAMPLE_PRODUCTS } from "@/constants";
import crypto from "crypto";

// Fallback in-memory stores for addresses, profiles, and wishlists
const MEMORY_PROFILES = new Map<string, UserProfile>();
const MEMORY_ADDRESSES = new Map<string, CustomerAddress>();
const MEMORY_WISHLISTS = new Map<string, Set<string>>(); // userId -> Set of productIds

// Pre-populate demo user for seamless local evaluation
const DEMO_USER_ID = "00000000-0000-0000-0000-000000000001";
const DEMO_EMAIL = "patron@dheera.in";

MEMORY_PROFILES.set(DEMO_USER_ID, {
  id: DEMO_USER_ID,
  email: DEMO_EMAIL,
  fullName: "Ananya Sharma",
  phone: "9876543210",
  role: "customer",
  createdAt: "2026-01-15T10:00:00.000Z",
  updatedAt: "2026-10-31T10:00:00.000Z",
});

MEMORY_ADDRESSES.set("addr_demo_1", {
  id: "addr_demo_1",
  userId: DEMO_USER_ID,
  recipientName: "Ananya Sharma",
  phone: "9876543210",
  addressLine1: "Flat 402, Lotus Grandeur",
  addressLine2: "18th Cross, 5th Main, Indiranagar",
  landmark: "Near Defense Colony Club",
  city: "Bengaluru",
  state: "Karnataka",
  postalCode: "560038",
  country: "India",
  isDefault: true,
  addressType: "home",
  createdAt: "2026-02-01T12:00:00.000Z",
});

MEMORY_ADDRESSES.set("addr_demo_2", {
  id: "addr_demo_2",
  userId: DEMO_USER_ID,
  recipientName: "Ananya Sharma (Studio)",
  phone: "9876543210",
  addressLine1: "Studio 12, Heritage Enclave",
  addressLine2: "MG Road Commercial Area",
  landmark: "Opposite Metro Station",
  city: "Bengaluru",
  state: "Karnataka",
  postalCode: "560001",
  country: "India",
  isDefault: false,
  addressType: "work",
  createdAt: "2026-03-10T14:30:00.000Z",
});

MEMORY_WISHLISTS.set(DEMO_USER_ID, new Set(["prod-1", "prod-3"]));

// ==============================================================================
// 1. PROFILE SERVICES
// ==============================================================================

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClientServer();
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (!error && data) {
        return {
          id: data.id,
          email: data.email,
          fullName: data.full_name,
          phone: data.phone || undefined,
          role: data.role || "customer",
          avatarUrl: data.avatar_url || undefined,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
      }
    } catch {
      // Fallback
    }
  }

  // Memory fallback
  return MEMORY_PROFILES.get(userId) || null;
}

export async function updateUserProfile(
  userId: string,
  input: ProfileUpdateInput
): Promise<UserProfile | null> {
  const updatedAt = new Date().toISOString();

  if (isSupabaseConfigured()) {
    try {
      const supabase = createClientServer();
      const { data, error } = await supabase
        .from("profiles")
        .update({
          full_name: input.fullName.trim(),
          phone: input.phone?.trim() || null,
          updated_at: updatedAt,
        })
        .eq("id", userId)
        .select()
        .single();

      if (!error && data) {
        return {
          id: data.id,
          email: data.email,
          fullName: data.full_name,
          phone: data.phone || undefined,
          role: data.role || "customer",
          avatarUrl: data.avatar_url || undefined,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
      }
    } catch {
      // Fallback
    }
  }

  // Memory store fallback
  const existing = MEMORY_PROFILES.get(userId);
  const updated: UserProfile = {
    id: userId,
    email: existing?.email || input.email || `${userId}@dheera.in`,
    fullName: input.fullName.trim(),
    phone: input.phone ? input.phone.trim() : existing?.phone,
    role: existing?.role || "customer",
    createdAt: existing?.createdAt || updatedAt,
    updatedAt,
  };
  MEMORY_PROFILES.set(userId, updated);
  return updated;
}

export async function upsertMemoryProfile(profile: UserProfile): Promise<void> {
  MEMORY_PROFILES.set(profile.id, profile);
}

// ==============================================================================
// 2. ADDRESS SERVICES
// ==============================================================================

export async function getCustomerAddresses(userId: string): Promise<CustomerAddress[]> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClientServer();
      const { data, error } = await supabase
        .from("addresses")
        .select("*")
        .eq("user_id", userId)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false });

      if (!error && Array.isArray(data)) {
        return data.map((d: any) => ({
          id: d.id,
          userId: d.user_id,
          recipientName: d.recipient_name,
          phone: d.phone,
          addressLine1: d.address_line1,
          addressLine2: d.address_line2 || undefined,
          landmark: d.landmark || undefined,
          city: d.city,
          state: d.state,
          postalCode: d.postal_code,
          country: d.country || "India",
          isDefault: !!d.is_default,
          addressType: (d.address_type as any) || "home",
          createdAt: d.created_at,
          updatedAt: d.updated_at,
        }));
      }
    } catch {
      // Fallback
    }
  }

  // Memory fallback
  const list: CustomerAddress[] = [];
  MEMORY_ADDRESSES.forEach((addr) => {
    if (addr.userId === userId) {
      list.push(addr);
    }
  });

  return list.sort((a, b) => {
    if (a.isDefault && !b.isDefault) return -1;
    if (!a.isDefault && b.isDefault) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export async function addCustomerAddress(
  userId: string,
  input: AddressInput
): Promise<CustomerAddress> {
  const addressId = crypto.randomUUID();
  const nowIso = new Date().toISOString();

  // If this address is set as default, unset other defaults
  if (input.isDefault) {
    await unsetOtherDefaultAddresses(userId);
  }

  const record: CustomerAddress = {
    id: addressId,
    userId,
    recipientName: input.recipientName.trim(),
    phone: input.phone.trim(),
    addressLine1: input.addressLine1.trim(),
    addressLine2: input.addressLine2?.trim() || undefined,
    landmark: input.landmark?.trim() || undefined,
    city: input.city.trim(),
    state: input.state.trim(),
    postalCode: input.postalCode.trim(),
    country: input.country || "India",
    isDefault: !!input.isDefault,
    addressType: input.addressType || "home",
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  if (isSupabaseConfigured()) {
    try {
      const supabase = createClientServer();
      const { data, error } = await supabase
        .from("addresses")
        .insert({
          id: addressId,
          user_id: userId,
          recipient_name: record.recipientName,
          phone: record.phone,
          address_line1: record.addressLine1,
          address_line2: record.addressLine2 || null,
          landmark: record.landmark || null,
          city: record.city,
          state: record.state,
          postal_code: record.postalCode,
          country: record.country,
          is_default: record.isDefault,
          address_type: record.addressType,
        })
        .select()
        .single();

      if (!error && data) {
        return {
          id: data.id,
          userId: data.user_id,
          recipientName: data.recipient_name,
          phone: data.phone,
          addressLine1: data.address_line1,
          addressLine2: data.address_line2 || undefined,
          landmark: data.landmark || undefined,
          city: data.city,
          state: data.state,
          postalCode: data.postal_code,
          country: data.country || "India",
          isDefault: !!data.is_default,
          addressType: data.address_type,
          createdAt: data.created_at,
        };
      }
    } catch {
      // Fallback
    }
  }

  MEMORY_ADDRESSES.set(addressId, record);
  return record;
}

export async function updateCustomerAddress(
  userId: string,
  addressId: string,
  input: Partial<AddressInput>
): Promise<CustomerAddress | null> {
  const nowIso = new Date().toISOString();

  if (input.isDefault) {
    await unsetOtherDefaultAddresses(userId, addressId);
  }

  if (isSupabaseConfigured()) {
    try {
      const supabase = createClientServer();
      const updatePayload: Record<string, any> = {
        updated_at: nowIso,
      };

      if (input.recipientName !== undefined) updatePayload.recipient_name = input.recipientName.trim();
      if (input.phone !== undefined) updatePayload.phone = input.phone.trim();
      if (input.addressLine1 !== undefined) updatePayload.address_line1 = input.addressLine1.trim();
      if (input.addressLine2 !== undefined) updatePayload.address_line2 = input.addressLine2?.trim() || null;
      if (input.landmark !== undefined) updatePayload.landmark = input.landmark?.trim() || null;
      if (input.city !== undefined) updatePayload.city = input.city.trim();
      if (input.state !== undefined) updatePayload.state = input.state.trim();
      if (input.postalCode !== undefined) updatePayload.postal_code = input.postalCode.trim();
      if (input.country !== undefined) updatePayload.country = input.country;
      if (input.isDefault !== undefined) updatePayload.is_default = input.isDefault;
      if (input.addressType !== undefined) updatePayload.address_type = input.addressType;

      const { data, error } = await supabase
        .from("addresses")
        .update(updatePayload)
        .eq("id", addressId)
        .eq("user_id", userId)
        .select()
        .single();

      if (!error && data) {
        return {
          id: data.id,
          userId: data.user_id,
          recipientName: data.recipient_name,
          phone: data.phone,
          addressLine1: data.address_line1,
          addressLine2: data.address_line2 || undefined,
          landmark: data.landmark || undefined,
          city: data.city,
          state: data.state,
          postalCode: data.postal_code,
          country: data.country || "India",
          isDefault: !!data.is_default,
          addressType: data.address_type,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
      }
    } catch {
      // Fallback
    }
  }

  const existing = MEMORY_ADDRESSES.get(addressId);
  if (existing && existing.userId === userId) {
    const updated: CustomerAddress = {
      ...existing,
      recipientName: input.recipientName !== undefined ? input.recipientName.trim() : existing.recipientName,
      phone: input.phone !== undefined ? input.phone.trim() : existing.phone,
      addressLine1: input.addressLine1 !== undefined ? input.addressLine1.trim() : existing.addressLine1,
      addressLine2: input.addressLine2 !== undefined ? input.addressLine2.trim() : existing.addressLine2,
      landmark: input.landmark !== undefined ? input.landmark.trim() : existing.landmark,
      city: input.city !== undefined ? input.city.trim() : existing.city,
      state: input.state !== undefined ? input.state.trim() : existing.state,
      postalCode: input.postalCode !== undefined ? input.postalCode.trim() : existing.postalCode,
      country: input.country !== undefined ? input.country : existing.country,
      isDefault: input.isDefault !== undefined ? !!input.isDefault : existing.isDefault,
      addressType: input.addressType !== undefined ? input.addressType : existing.addressType,
      updatedAt: nowIso,
    };
    MEMORY_ADDRESSES.set(addressId, updated);
    return updated;
  }

  return null;
}

export async function deleteCustomerAddress(
  userId: string,
  addressId: string
): Promise<boolean> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClientServer();
      const { error } = await supabase
        .from("addresses")
        .delete()
        .eq("id", addressId)
        .eq("user_id", userId);

      if (!error) return true;
    } catch {
      // Fallback
    }
  }

  const existing = MEMORY_ADDRESSES.get(addressId);
  if (existing && existing.userId === userId) {
    MEMORY_ADDRESSES.delete(addressId);
    return true;
  }

  return false;
}

async function unsetOtherDefaultAddresses(userId: string, excludeId?: string) {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClientServer();
      let query = supabase
        .from("addresses")
        .update({ is_default: false })
        .eq("user_id", userId);

      if (excludeId) {
        query = query.neq("id", excludeId);
      }
      await query;
    } catch {
      // Fallback
    }
  }

  MEMORY_ADDRESSES.forEach((addr) => {
    if (addr.userId === userId && (!excludeId || addr.id !== excludeId)) {
      addr.isDefault = false;
    }
  });
}

// ==============================================================================
// 3. ORDER TRACKING TIMELINE GENERATOR
// ==============================================================================

export function generateTrackingTimeline(
  order: ConfirmedOrderDetails
): OrderTrackingTimelineStep[] {
  const status = order.status;
  const isPaid = order.paymentStatus === "captured" || order.status === "confirmed";
  const createdDate = new Date(order.createdAt);

  const formatStepDate = (daysToAdd: number) => {
    const d = new Date(createdDate);
    d.setDate(d.getDate() + daysToAdd);
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Determine stage index 0-5
  let currentStageIndex = 0;
  const statusStr = String(status);
  if (statusStr === "cancelled" || statusStr === "refunded") {
    currentStageIndex = 0;
  } else if (statusStr === "delivered") {
    currentStageIndex = 5;
  } else if (statusStr === "out_for_delivery" || statusStr === "in_transit") {
    currentStageIndex = 4;
  } else if (statusStr === "dispatched") {
    currentStageIndex = 3;
  } else if (statusStr === "processing") {
    currentStageIndex = 2;
  } else if (isPaid || statusStr === "confirmed") {
    currentStageIndex = 1;
  } else {
    currentStageIndex = 0; // placed
  }

  const stepsDef: Array<{
    step: OrderTrackingTimelineStep["step"];
    label: string;
    description: string;
    daysOffset: number;
  }> = [
    {
      step: "placed",
      label: "Order Placed",
      description: "Order received and queued at our atelier.",
      daysOffset: 0,
    },
    {
      step: "confirmed",
      label: "Payment Confirmed",
      description: "Transaction verified via Razorpay secure gateway.",
      daysOffset: 0,
    },
    {
      step: "processing",
      label: "Handcrafting & Quality Inspection",
      description: "Garment handcrafted with artisan precision and inspected.",
      daysOffset: 2,
    },
    {
      step: "dispatched",
      label: "Dispatched from Atelier",
      description: "Secured in luxury packaging and handed to courier.",
      daysOffset: 4,
    },
    {
      step: "in_transit",
      label: "In Transit",
      description: "Package en route to destination delivery hub.",
      daysOffset: 6,
    },
    {
      step: "delivered",
      label: "Delivered",
      description: "Safely delivered to patron address.",
      daysOffset: 7,
    },
  ];

  return stepsDef.map((s, idx) => {
    let stepStatus: "completed" | "current" | "upcoming" = "upcoming";
    if (idx < currentStageIndex) {
      stepStatus = "completed";
    } else if (idx === currentStageIndex) {
      stepStatus = "current";
    }

    return {
      step: s.step,
      label: s.label,
      description: s.description,
      status: stepStatus,
      timestamp: idx <= currentStageIndex ? formatStepDate(s.daysOffset) : undefined,
      estimatedDate: idx > currentStageIndex ? formatStepDate(s.daysOffset) : undefined,
    };
  });
}

// ==============================================================================
// 4. WISHLIST SERVICES
// ==============================================================================

export async function getCustomerWishlist(userId: string): Promise<WishlistItem[]> {
  const productIds = MEMORY_WISHLISTS.get(userId) || new Set<string>();

  // Map product IDs to full WishlistItem
  const items: WishlistItem[] = [];
  productIds.forEach((pid) => {
    const p = SAMPLE_PRODUCTS.find((item) => item.id === pid);
    if (p) {
      items.push({
        id: `wish_${userId}_${p.id}`,
        productId: p.id,
        name: p.name,
        slug: p.slug,
        category: p.category,
        price: p.price,
        originalPrice: p.originalPrice,
        image: p.image,
        inStock: p.inStock,
        addedAt: new Date().toISOString(),
      });
    }
  });

  return items;
}

export async function addCustomerWishlistItem(
  userId: string,
  productId: string
): Promise<boolean> {
  let list = MEMORY_WISHLISTS.get(userId);
  if (!list) {
    list = new Set<string>();
    MEMORY_WISHLISTS.set(userId, list);
  }
  list.add(productId);
  return true;
}

export async function removeCustomerWishlistItem(
  userId: string,
  productId: string
): Promise<boolean> {
  const list = MEMORY_WISHLISTS.get(userId);
  if (list) {
    list.delete(productId);
    return true;
  }
  return false;
}

export async function syncGuestWishlistToCustomer(
  userId: string,
  guestProductIds: string[]
): Promise<number> {
  let list = MEMORY_WISHLISTS.get(userId);
  if (!list) {
    list = new Set<string>();
    MEMORY_WISHLISTS.set(userId, list);
  }

  let added = 0;
  for (const pid of guestProductIds) {
    if (!list.has(pid)) {
      list.add(pid);
      added++;
    }
  }

  return added;
}
