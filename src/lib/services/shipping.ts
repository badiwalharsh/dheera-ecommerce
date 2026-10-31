import { ShippingValidationResult } from "@/types/cart";

/**
 * DHEERA Shipping Calculation & Serviceability Engine
 *
 * NOTE: The rates and timelines below are development prototype configurations
 * clearly marked as fixtures until official commercial logistics partner
 * agreements are finalized.
 */
export const SHIPPING_CONFIG = {
  isDevelopmentFixture: true,
  currency: "INR",
  // Standard shipping fee for domestic orders below the threshold
  standardDomesticShippingFee: 150,
  // Free shipping threshold (matches announcement bar "FREE SHIPPING ON SELECTED ORDERS")
  freeShippingThreshold: 5000,
  // Standard estimated transit window in business days
  standardEstimatedDeliveryDays: "3–5 business days",
  expressEstimatedDeliveryDays: "2–3 business days",
  // Pincode prefix region map (India Post standard postal circle prefixes)
  postalCircles: {
    1: { region: "Northern", state: "Delhi, Haryana, Punjab, Himachal Pradesh, J&K" },
    2: { region: "Northern", state: "Uttar Pradesh, Uttarakhand" },
    3: { region: "Western", state: "Rajasthan, Gujarat" },
    4: { region: "Western & Central", state: "Maharashtra, Goa, Madhya Pradesh, Chhattisgarh" },
    5: { region: "Southern", state: "Andhra Pradesh, Telangana, Karnataka" },
    6: { region: "Southern", state: "Tamil Nadu, Kerala" },
    7: { region: "Eastern & North Eastern", state: "West Bengal, Odisha, Assam, North East" },
    8: { region: "Eastern", state: "Bihar, Jharkhand" },
  } as Record<number, { region: string; state: string }>,
};

/**
 * Validates an Indian postal PIN code
 * Rule: Exactly 6 digits, first digit between 1 and 8 (standard Indian civilian PIN code).
 */
export function validateIndianPincode(pincode: string): {
  isValid: boolean;
  message?: string;
  region?: string;
  state?: string;
} {
  const sanitized = (pincode || "").trim();

  if (!sanitized) {
    return { isValid: false, message: "Please enter your 6-digit postal PIN code." };
  }

  const pinRegex = /^[1-8][0-9]{5}$/;
  if (!pinRegex.test(sanitized)) {
    return {
      isValid: false,
      message: "Please enter a valid 6-digit Indian PIN code (e.g. 110001, 400001, 560001).",
    };
  }

  const firstDigit = parseInt(sanitized.charAt(0), 10);
  const circle = SHIPPING_CONFIG.postalCircles[firstDigit];

  return {
    isValid: true,
    region: circle ? circle.region : "Pan-India",
    state: circle ? circle.state : "India",
  };
}

/**
 * Calculates authoritative server-side shipping charges based on verified subtotal
 */
export function calculateShipping(
  subtotal: number,
  pincode?: string,
  country: string = "India"
): ShippingValidationResult {
  // If not India, future international shipping
  if (country.toLowerCase() !== "india") {
    return {
      isServiceable: false,
      shippingFee: 0,
      isFreeShipping: false,
      freeShippingThreshold: SHIPPING_CONFIG.freeShippingThreshold,
      remainingForFreeShipping: 0,
      estimatedDays: "N/A",
      message: "International shipping is currently handled via bespoke concierge request. Please select India for online orders.",
    };
  }

  // If pincode provided, validate serviceability
  if (pincode) {
    const pinCheck = validateIndianPincode(pincode);
    if (!pinCheck.isValid) {
      return {
        isServiceable: false,
        shippingFee: SHIPPING_CONFIG.standardDomesticShippingFee,
        isFreeShipping: false,
        freeShippingThreshold: SHIPPING_CONFIG.freeShippingThreshold,
        remainingForFreeShipping: Math.max(0, SHIPPING_CONFIG.freeShippingThreshold - subtotal),
        estimatedDays: SHIPPING_CONFIG.standardEstimatedDeliveryDays,
        message: pinCheck.message,
      };
    }
  }

  const isFree = subtotal >= SHIPPING_CONFIG.freeShippingThreshold;
  const shippingFee = isFree ? 0 : SHIPPING_CONFIG.standardDomesticShippingFee;
  const remainingForFreeShipping = Math.max(0, SHIPPING_CONFIG.freeShippingThreshold - subtotal);

  return {
    isServiceable: true,
    shippingFee,
    isFreeShipping: isFree,
    freeShippingThreshold: SHIPPING_CONFIG.freeShippingThreshold,
    remainingForFreeShipping,
    estimatedDays: SHIPPING_CONFIG.standardEstimatedDeliveryDays,
    message: isFree
      ? "Complimentary insured delivery unlocked!"
      : `Add ₹${remainingForFreeShipping.toLocaleString("en-IN")} more for complimentary shipping.`,
  };
}
