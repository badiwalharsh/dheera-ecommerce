"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useShop } from "@/context/shop-context";
import { Container } from "@/components/ui/container";
import { Trash2, Plus, Minus, ArrowRight, ShieldCheck, Sparkles, Tag, Check, AlertCircle } from "lucide-react";
import { SHIPPING_CONFIG, calculateShipping, validateIndianPincode } from "@/lib/services/shipping";
import { Coupon } from "@/types/cart";

export function CartPageView() {
  const { cart, cartSubtotal, cartCount, updateQuantity, removeFromBag, clearBag } = useShop();

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponMessage, setCouponMessage] = useState<{ text: string; isError: boolean } | null>(null);

  // Shipping estimation state
  const [pincode, setPincode] = useState("");
  const [shippingResult, setShippingResult] = useState<ReturnType<typeof calculateShipping> | null>(() =>
    calculateShipping(cartSubtotal)
  );
  const [pincodeError, setPincodeError] = useState<string | null>(null);

  // Recalculate shipping and coupon when subtotal changes
  React.useEffect(() => {
    const updatedShipping = calculateShipping(cartSubtotal, pincode ? pincode : undefined);
    setShippingResult(updatedShipping);

    // Revalidate coupon if applied
    if (appliedCoupon) {
      if (cartSubtotal < appliedCoupon.minOrderAmount) {
        setAppliedCoupon(null);
        setDiscountAmount(0);
        setCouponMessage({
          text: `Coupon ${appliedCoupon.code} removed: Subtotal fell below ₹${appliedCoupon.minOrderAmount.toLocaleString("en-IN")}.`,
          isError: true,
        });
      } else {
        let newDiscount = 0;
        if (appliedCoupon.discountType === "percentage") {
          newDiscount = Math.round((cartSubtotal * appliedCoupon.discountValue) / 100);
          if (appliedCoupon.maxDiscountAmount && newDiscount > appliedCoupon.maxDiscountAmount) {
            newDiscount = appliedCoupon.maxDiscountAmount;
          }
        } else {
          newDiscount = Math.min(appliedCoupon.discountValue, cartSubtotal);
        }
        setDiscountAmount(newDiscount);
      }
    }
  }, [cartSubtotal, pincode, appliedCoupon]);

  const handleApplyCoupon = async (codeToApply?: string) => {
    const targetCode = (codeToApply || couponCode).trim().toUpperCase();
    if (!targetCode) {
      setCouponMessage({ text: "Please enter a valid promotion code.", isError: true });
      return;
    }

    setCouponLoading(true);
    setCouponMessage(null);

    try {
      const res = await fetch("/api/checkout/validate-coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: targetCode, subtotal: cartSubtotal }),
      });

      const data = await res.json();

      if (data.success && data.isValid && data.coupon) {
        setAppliedCoupon(data.coupon);
        setDiscountAmount(data.discountAmount);
        setCouponCode("");
        setCouponMessage({ text: data.message || "Coupon applied successfully!", isError: false });
      } else {
        setCouponMessage({ text: data.message || "Invalid or ineligible promotion code.", isError: true });
      }
    } catch {
      setCouponMessage({ text: "Unable to validate coupon. Please try again.", isError: true });
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setDiscountAmount(0);
    setCouponMessage(null);
  };

  const handlePincodeCheck = () => {
    if (!pincode) {
      setPincodeError("Please enter your 6-digit PIN code.");
      return;
    }
    const check = validateIndianPincode(pincode);
    if (!check.isValid) {
      setPincodeError(check.message || "Invalid PIN code.");
      return;
    }
    setPincodeError(null);
    setShippingResult(calculateShipping(cartSubtotal, pincode));
  };

  const currentShippingFee = shippingResult?.shippingFee ?? 0;
  const grandTotal = Math.max(0, cartSubtotal - discountAmount + currentShippingFee);

  if (cart.length === 0) {
    return (
      <div className="py-20 md:py-28 bg-[#EEEAE0]/40 min-h-[65vh] flex items-center">
        <Container size="default">
          <div className="text-center max-w-lg mx-auto space-y-5 bg-[#FAF9F5] p-8 sm:p-12 border border-[#E2DFD6] shadow-sm">
            <span className="text-[10px] uppercase tracking-luxury text-[#AA9160] font-medium block">
              Curated Wardrobe
            </span>
            <h1 className="text-3xl sm:text-4xl font-serif text-[#176B45]">
              Your Bag is Empty
            </h1>
            <p className="text-xs sm:text-sm text-[#74786F] leading-relaxed">
              Your DHEERA shopping bag is waiting for its first bespoke ensemble. Explore our hand-embroidered kurta sets, fluid sarees, and celebratory edits.
            </p>
            <div className="pt-2">
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#176B45] text-[#FAF9F5] text-xs uppercase tracking-luxury hover:bg-[#315039] transition-colors shadow-sm font-medium"
              >
                <span>Discover Catalogue</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="py-10 md:py-16 bg-[#FAF9F5]">
      <Container size="default">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-6 text-xs text-[#74786F] tracking-wide">
          <Link href="/" className="hover:text-[#176B45] transition-colors">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-[#252A25] font-medium">Shopping Bag</span>
        </nav>

        {/* Page Heading */}
        <div className="border-b border-[#E2DFD6] pb-6 mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-[10px] uppercase tracking-luxury text-[#AA9160] font-medium block mb-1">
              Handcrafted Selection
            </span>
            <h1 className="text-3xl sm:text-4xl font-serif text-[#176B45]">
              Shopping Bag
            </h1>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="text-[#74786F]">
              {cartCount} {cartCount === 1 ? "piece" : "pieces"} selected
            </span>
            <button
              type="button"
              onClick={clearBag}
              className="text-[#74786F] hover:text-red-700 transition-colors uppercase tracking-luxury text-[10px]"
            >
              Clear Bag
            </button>
          </div>
        </div>

        {/* Development Fixture Notice */}
        <div className="mb-8 p-3.5 bg-[#EEEAE0]/60 border border-[#AA9160]/30 flex items-center gap-2.5 text-xs text-[#252A25]">
          <Sparkles className="w-4 h-4 text-[#AA9160] flex-shrink-0" />
          <p className="text-[11px] sm:text-xs">
            <strong>Development Storefront Preview:</strong> Product prices, discounts, and dispatch estimates are illustrative development fixtures. Payment runs in Razorpay Test Mode.
          </p>
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Column: Product List */}
          <div className="lg:col-span-8 space-y-6">
            <div className="border border-[#E2DFD6] bg-white divide-y divide-[#E2DFD6]">
              {cart.map((item) => (
                <div key={item.id} className="p-4 sm:p-6 flex flex-col sm:flex-row gap-5 items-start">
                  {/* Thumbnail */}
                  <div className="relative w-24 sm:w-28 aspect-[3/4] flex-shrink-0 bg-[#EEEAE0] border border-[#E2DFD6] overflow-hidden">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="(max-width: 640px) 96px, 112px"
                      className="object-cover"
                    />
                  </div>

                  {/* Information */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch">
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <Link
                            href={`/product/${item.productSlug}`}
                            className="font-serif text-lg text-[#176B45] hover:text-[#AA9160] transition-colors font-medium leading-snug"
                          >
                            {item.name}
                          </Link>
                          <p className="text-[11px] text-[#74786F] tracking-wide mt-0.5">
                            SKU: {item.sku}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeFromBag(item.id)}
                          className="text-[#74786F] hover:text-red-700 transition-colors p-1"
                          aria-label={`Remove ${item.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Variant Details */}
                      <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-[#74786F]">
                        <span className="px-2.5 py-0.5 bg-[#FAF9F5] border border-[#E2DFD6] text-[#252A25]">
                          Size: <strong>{item.size}</strong>
                        </span>
                        {item.colour && item.colour !== "Standard" && (
                          <span className="px-2.5 py-0.5 bg-[#FAF9F5] border border-[#E2DFD6] text-[#252A25]">
                            Colour: <strong>{item.colour}</strong>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quantity & Unit Price */}
                    <div className="flex flex-wrap items-center justify-between gap-4 mt-5 pt-3 border-t border-[#E2DFD6]/60">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-[#74786F]">Qty:</span>
                        <div className="flex items-center border border-[#E2DFD6] bg-[#FAF9F5]">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="p-1.5 sm:p-2 text-[#252A25] hover:bg-[#EEEAE0] transition-colors"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-8 text-center text-xs font-semibold text-[#252A25]">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            disabled={item.quantity >= 10}
                            className="p-1.5 sm:p-2 text-[#252A25] hover:bg-[#EEEAE0] transition-colors disabled:opacity-40"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-serif text-base sm:text-lg font-semibold text-[#176B45]">
                          ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                        </span>
                        {item.quantity > 1 && (
                          <div className="text-[11px] text-[#74786F]">
                            ₹{item.price.toLocaleString("en-IN")} each
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Back to Shopping */}
            <div className="pt-2">
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 text-xs uppercase tracking-luxury text-[#176B45] hover:text-[#AA9160] transition-colors font-medium"
              >
                <span>← Continue Discovering Collections</span>
              </Link>
            </div>
          </div>

          {/* Right Column: Order Summary */}
          <div className="lg:col-span-4 sticky top-28 space-y-6">
            <div className="bg-white border border-[#E2DFD6] p-6 shadow-sm space-y-5">
              <h2 className="font-serif text-xl text-[#176B45] tracking-wide border-b border-[#E2DFD6] pb-3">
                Order Summary
              </h2>

              {/* Subtotal */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#74786F]">Subtotal</span>
                <span className="font-serif text-base font-medium text-[#252A25]">
                  ₹{cartSubtotal.toLocaleString("en-IN")}
                </span>
              </div>

              {/* Coupon Section */}
              <div className="border-t border-b border-[#E2DFD6] py-4 space-y-3">
                <label htmlFor="couponInput" className="text-xs uppercase tracking-luxury text-[#252A25] font-medium block">
                  Promotional Voucher
                </label>

                {appliedCoupon ? (
                  <div className="p-3 bg-[#176B45]/5 border border-[#176B45]/20 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-[#176B45]" />
                      <div>
                        <strong className="text-[#176B45] font-semibold">{appliedCoupon.code}</strong>
                        <p className="text-[10px] text-[#74786F]">
                          -₹{discountAmount.toLocaleString("en-IN")} saved
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="text-[10px] uppercase tracking-luxury text-red-700 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="flex gap-2">
                      <input
                        id="couponInput"
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="ENTER CODE (e.g. DHEERA10)"
                        className="flex-1 min-w-0 px-3 py-2 text-xs bg-[#FAF9F5] border border-[#E2DFD6] uppercase focus:outline-none focus:border-[#176B45]"
                      />
                      <button
                        type="button"
                        onClick={() => handleApplyCoupon()}
                        disabled={couponLoading || !couponCode.trim()}
                        className="px-4 py-2 bg-[#176B45] text-[#FAF9F5] text-xs uppercase tracking-luxury hover:bg-[#315039] transition-colors disabled:opacity-40 font-medium"
                      >
                        {couponLoading ? "..." : "Apply"}
                      </button>
                    </div>

                    {/* Test Fixture Pill Suggestion */}
                    <div className="mt-2 flex items-center gap-1.5 text-[11px] text-[#74786F]">
                      <span>Test fixture:</span>
                      <button
                        type="button"
                        onClick={() => handleApplyCoupon("DHEERA10")}
                        className="text-[#176B45] font-medium underline underline-offset-2 hover:text-[#AA9160]"
                      >
                        DHEERA10 (10% off)
                      </button>
                    </div>
                  </div>
                )}

                {couponMessage && (
                  <div
                    className={`text-xs flex items-center gap-1.5 ${
                      couponMessage.isError ? "text-red-700" : "text-[#176B45]"
                    }`}
                  >
                    {couponMessage.isError ? (
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    ) : (
                      <Check className="w-3.5 h-3.5 flex-shrink-0" />
                    )}
                    <span>{couponMessage.text}</span>
                  </div>
                )}
              </div>

              {/* Discount Display */}
              {discountAmount > 0 && (
                <div className="flex items-center justify-between text-sm text-[#176B45]">
                  <span>Voucher Discount</span>
                  <span className="font-serif font-medium">
                    -₹{discountAmount.toLocaleString("en-IN")}
                  </span>
                </div>
              )}

              {/* Estimated Shipping Section */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#74786F]">Estimated Delivery</span>
                  <span className="font-serif text-sm font-medium text-[#252A25]">
                    {currentShippingFee === 0 ? "Complimentary" : `₹${currentShippingFee}`}
                  </span>
                </div>

                {/* Pincode Estimator */}
                <div className="pt-1">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
                      placeholder="Check PIN code (e.g. 110001)"
                      className="flex-1 min-w-0 px-3 py-1.5 text-xs bg-[#FAF9F5] border border-[#E2DFD6] focus:outline-none focus:border-[#176B45]"
                    />
                    <button
                      type="button"
                      onClick={handlePincodeCheck}
                      className="px-3 py-1.5 bg-[#EEEAE0] text-[#252A25] text-xs uppercase tracking-luxury hover:bg-[#E2DFD6] transition-colors"
                    >
                      Check
                    </button>
                  </div>
                  {pincodeError && <p className="text-[11px] text-red-600 mt-1">{pincodeError}</p>}
                  {shippingResult && !pincodeError && (
                    <p className="text-[11px] text-[#74786F] mt-1">
                      {shippingResult.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Total Amount */}
              <div className="border-t border-[#E2DFD6] pt-4 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-serif text-base text-[#252A25] font-semibold">Total Payable</span>
                  <span className="font-serif text-2xl font-bold text-[#176B45]">
                    ₹{grandTotal.toLocaleString("en-IN")}
                  </span>
                </div>
                <p className="text-[10px] text-[#74786F]">
                  Inclusive of all local taxes. Insured pan-India transit.
                </p>
              </div>

              {/* Proceed to Checkout Button */}
              <Link
                href="/checkout"
                className="w-full py-4 bg-[#176B45] text-[#FAF9F5] text-xs uppercase tracking-luxury hover:bg-[#315039] transition-colors flex items-center justify-center gap-2 shadow-sm font-semibold mt-4"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* DHEERA Brand Assurance */}
            <div className="bg-[#FAF9F5] border border-[#E2DFD6] p-4 space-y-3 text-xs text-[#74786F]">
              <div className="flex items-center gap-2.5 text-[#176B45] font-medium">
                <ShieldCheck className="w-4 h-4 text-[#AA9160]" />
                <span className="tracking-wide text-[11px] uppercase">DHEERA Trust Assurance</span>
              </div>
              <ul className="space-y-1.5 text-[11px] text-[#74786F]">
                <li>✦ 100% Authentic Handcrafted Indian Weaves</li>
                <li>✦ Complimentary Insured Delivery on orders over ₹5,000</li>
                <li>✦ Secure 256-Bit SSL Encrypted Razorpay Payments</li>
              </ul>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
