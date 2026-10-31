import { NextResponse } from "next/server";
import { CreateOrderPayload, OrderPricingSummary } from "@/types/cart";
import { validateCartServer } from "@/lib/services/inventory-and-pricing";
import { calculateShipping, validateIndianPincode } from "@/lib/services/shipping";
import { validateCoupon } from "@/lib/services/coupons";
import { RazorpayService } from "@/lib/services/razorpay";
import { generateOrderNumber, savePendingOrder } from "@/lib/services/orders";
import { checkRateLimit } from "@/lib/security/rate-limit";

export async function POST(req: Request) {
  try {
    // 1. Rate Limiting Check (Max 15 order creation requests per minute per IP)
    const rateLimit = checkRateLimit(req, "create-order", 15, 60000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: "Too many checkout requests. Please wait a moment before trying again.",
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil(rateLimit.resetMs / 1000)),
          },
        }
      );
    }

    const payload: CreateOrderPayload = await req.json();
    const { items, customerInfo, shippingAddress, couponCode } = payload;

    // 2. Validate Customer Info
    if (!customerInfo?.fullName?.trim() || !customerInfo?.email?.trim() || !customerInfo?.phone?.trim()) {
      return NextResponse.json(
        { success: false, message: "Please provide complete contact information (Full name, email, and phone)." },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerInfo.email.trim())) {
      return NextResponse.json(
        { success: false, message: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    const phoneRegex = /^(?:\+91|91)?[6-9]\d{9}$/;
    const cleanPhone = customerInfo.phone.replace(/[\s-]/g, "");
    if (!phoneRegex.test(cleanPhone)) {
      return NextResponse.json(
        { success: false, message: "Please provide a valid 10-digit Indian mobile number." },
        { status: 400 }
      );
    }

    // 3. Validate Shipping Address
    if (
      !shippingAddress?.houseNumber?.trim() ||
      !shippingAddress?.street?.trim() ||
      !shippingAddress?.city?.trim() ||
      !shippingAddress?.state?.trim() ||
      !shippingAddress?.pincode?.trim()
    ) {
      return NextResponse.json(
        { success: false, message: "Please provide complete delivery address details." },
        { status: 400 }
      );
    }

    const pinCheck = validateIndianPincode(shippingAddress.pincode);
    if (!pinCheck.isValid) {
      return NextResponse.json(
        { success: false, message: pinCheck.message || "Invalid delivery PIN code." },
        { status: 400 }
      );
    }

    // 4. Server-side Authoritative Cart Validation
    const cartValidation = await validateCartServer(items);
    if (!cartValidation.isValid || cartValidation.items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: cartValidation.errors[0] || "Invalid items in cart.",
          errors: cartValidation.errors,
        },
        { status: 400 }
      );
    }

    const verifiedSubtotal = cartValidation.subtotal;

    // 5. Validate Coupon on verified subtotal
    let discountAmount = 0;
    let appliedCouponInfo: OrderPricingSummary["appliedCoupon"] = undefined;

    if (couponCode) {
      const couponRes = await validateCoupon(couponCode, verifiedSubtotal);
      if (couponRes.isValid && couponRes.coupon) {
        discountAmount = couponRes.discountAmount;
        appliedCouponInfo = {
          code: couponRes.coupon.code,
          discountType: couponRes.coupon.discountType,
          discountValue: couponRes.coupon.discountValue,
          discountAmount,
          description: couponRes.coupon.description,
          isDevelopmentFixture: couponRes.coupon.isDevelopmentFixture,
        };
      }
    }

    // 6. Calculate Shipping on verified subtotal after discount
    const shippingRes = calculateShipping(verifiedSubtotal, shippingAddress.pincode, shippingAddress.country);
    if (!shippingRes.isServiceable) {
      return NextResponse.json(
        { success: false, message: shippingRes.message || "Delivery to this address is currently unavailable." },
        { status: 400 }
      );
    }

    const shippingFee = shippingRes.shippingFee;
    const finalAmount = Math.max(0, verifiedSubtotal - discountAmount + shippingFee);
    const taxAmount = 0; // Inclusive in India GST standard

    const pricingSummary: OrderPricingSummary = {
      subtotal: verifiedSubtotal,
      discountAmount,
      shippingFee,
      taxAmount,
      totalAmount: finalAmount,
      appliedCoupon: appliedCouponInfo,
    };

    // 7. Generate Order Number
    const orderNumber = generateOrderNumber();

    // 8. Create Razorpay Order in paise
    const amountInPaise = Math.round(finalAmount * 100);
    const rzpOrder = await RazorpayService.createOrder({
      amount: amountInPaise,
      currency: "INR",
      receipt: orderNumber,
      notes: {
        orderNumber,
        customerEmail: customerInfo.email,
        customerPhone: customerInfo.phone,
      },
    });

    // 9. Persist Pending Order in Database
    const savedOrder = await savePendingOrder({
      orderNumber,
      payload,
      validatedItems: cartValidation.items,
      pricing: pricingSummary,
      razorpayOrderId: rzpOrder.id,
    });

    return NextResponse.json({
      success: true,
      orderId: savedOrder.id,
      orderNumber: savedOrder.orderNumber,
      accessToken: savedOrder.accessToken,
      razorpayOrderId: rzpOrder.id,
      amount: amountInPaise,
      currency: "INR",
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_placeholder",
      customer: {
        name: customerInfo.fullName,
        email: customerInfo.email,
        contact: customerInfo.phone,
      },
      pricing: pricingSummary,
      isSimulatedTest: rzpOrder.isSimulated,
    });
  } catch (err: any) {
    // Sanitized error logging (no sensitive secrets or PII)
    console.error("Order creation processing error:", err.message);
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred while preparing your order. Please try again." },
      { status: 500 }
    );
  }
}
