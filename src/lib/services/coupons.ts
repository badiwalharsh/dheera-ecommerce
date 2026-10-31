import { Coupon, DiscountType } from "@/types/cart";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClientServer } from "@/lib/supabase/server";

export const FIXTURE_COUPONS: Coupon[] = [
  {
    id: "coupon-dheera10",
    code: "DHEERA10",
    discountType: "percentage",
    discountValue: 10,
    minOrderAmount: 2000,
    maxDiscountAmount: 1500,
    description: "10% off on artisanal orders above ₹2,000 (Max discount ₹1,500)",
    isActive: true,
    isDevelopmentFixture: true,
  },
  {
    id: "coupon-heritage500",
    code: "HERITAGE500",
    discountType: "fixed",
    discountValue: 500,
    minOrderAmount: 3500,
    maxDiscountAmount: 500,
    description: "Flat ₹500 off on heritage orders above ₹3,500",
    isActive: true,
    isDevelopmentFixture: true,
  },
];

export interface CouponValidationResult {
  isValid: boolean;
  coupon?: Coupon;
  discountAmount: number;
  message?: string;
}

/**
 * Validates a coupon code against a verified subtotal on the server.
 * Never trust client calculations!
 */
export async function validateCoupon(
  rawCode: string,
  verifiedSubtotal: number
): Promise<CouponValidationResult> {
  const code = (rawCode || "").trim().toUpperCase();

  if (!code) {
    return { isValid: false, discountAmount: 0, message: "Please provide a coupon code." };
  }

  let matchedCoupon: Coupon | undefined;

  // 1. Try Supabase if live
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClientServer();
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", code)
        .eq("is_active", true)
        .maybeSingle();

      if (!error && data) {
        // Check date validity
        const now = new Date();
        if (data.starts_at && new Date(data.starts_at) > now) {
          return {
            isValid: false,
            discountAmount: 0,
            message: `Coupon code "${code}" is not yet active.`,
          };
        }
        if (data.expires_at && new Date(data.expires_at) < now) {
          return {
            isValid: false,
            discountAmount: 0,
            message: `Coupon code "${code}" has expired.`,
          };
        }
        if (data.usage_limit && data.times_used >= data.usage_limit) {
          return {
            isValid: false,
            discountAmount: 0,
            message: `Coupon code "${code}" has reached its maximum usage limit.`,
          };
        }

        matchedCoupon = {
          id: data.id,
          code: data.code,
          discountType: data.discount_type as DiscountType,
          discountValue: Number(data.discount_value),
          minOrderAmount: Number(data.min_order_amount || 0),
          maxDiscountAmount: data.max_discount_amount ? Number(data.max_discount_amount) : undefined,
          description: data.description,
          isActive: data.is_active,
          isDevelopmentFixture: !!data.is_development_fixture,
        };
      }
    } catch {
      // Fall through to fixtures
    }
  }

  // 2. Fall back to authoritative development fixtures if not found in DB
  if (!matchedCoupon) {
    matchedCoupon = FIXTURE_COUPONS.find((c) => c.code === code && c.isActive);
  }

  if (!matchedCoupon) {
    return {
      isValid: false,
      discountAmount: 0,
      message: `Invalid coupon code "${code}". Try test code DHEERA10.`,
    };
  }

  // 3. Validate minimum order requirement
  if (verifiedSubtotal < matchedCoupon.minOrderAmount) {
    const deficit = matchedCoupon.minOrderAmount - verifiedSubtotal;
    return {
      isValid: false,
      coupon: matchedCoupon,
      discountAmount: 0,
      message: `Coupon "${code}" requires a minimum order of ₹${matchedCoupon.minOrderAmount.toLocaleString(
        "en-IN"
      )}. Add ₹${deficit.toLocaleString("en-IN")} more to apply.`,
    };
  }

  // 4. Calculate discount amount
  let discount = 0;
  if (matchedCoupon.discountType === "percentage") {
    discount = Math.round((verifiedSubtotal * matchedCoupon.discountValue) / 100);
    if (matchedCoupon.maxDiscountAmount && discount > matchedCoupon.maxDiscountAmount) {
      discount = matchedCoupon.maxDiscountAmount;
    }
  } else {
    discount = Math.min(matchedCoupon.discountValue, verifiedSubtotal);
  }

  return {
    isValid: true,
    coupon: matchedCoupon,
    discountAmount: discount,
    message: matchedCoupon.isDevelopmentFixture
      ? `Fixture coupon applied: -₹${discount.toLocaleString("en-IN")}`
      : `Promotional code applied: -₹${discount.toLocaleString("en-IN")}`,
  };
}
