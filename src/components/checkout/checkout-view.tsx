"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useShop } from "@/context/shop-context";
import { Container } from "@/components/ui/container";
import { BrandLogo } from "@/components/ui/brand-logo";
import {
  Lock,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Tag,
  CreditCard,
  Smartphone,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { validateIndianPincode, calculateShipping } from "@/lib/services/shipping";
import { CustomerInfo, ShippingAddress, Coupon } from "@/types/cart";

export function CheckoutView() {
  const router = useRouter();
  const { cart, cartSubtotal, cartCount, clearBag } = useShop();

  // Distraction-free mobile summary toggle
  const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false);

  // Form State: Section A (Contact)
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    fullName: "",
    email: "",
    phone: "",
  });

  // Form State: Section B (Shipping)
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    fullName: "",
    phone: "",
    pincode: "",
    houseNumber: "",
    street: "",
    landmark: "",
    city: "",
    state: "",
    country: "India",
    saveAddress: true,
  });

  // Validation Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Coupon State
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  // Payment Processing State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentErrorModal, setPaymentErrorModal] = useState<{
    open: boolean;
    title: string;
    message: string;
  }>({
    open: false,
    title: "",
    message: "",
  });

  // Load Razorpay Checkout.js script
  useEffect(() => {
    if (typeof window !== "undefined" && !(window as any).Razorpay) {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  // Shipping calculation
  const shippingCalculation = calculateShipping(
    cartSubtotal,
    shippingAddress.pincode || undefined,
    shippingAddress.country
  );
  const shippingFee = shippingCalculation.shippingFee;
  const grandTotal = Math.max(0, cartSubtotal - discountAmount + shippingFee);

  // PIN code auto-fill state
  const handlePincodeChange = (pin: string) => {
    const cleaned = pin.replace(/\D/g, "").slice(0, 6);
    setShippingAddress((prev) => ({ ...prev, pincode: cleaned }));

    if (cleaned.length === 6) {
      const pinCheck = validateIndianPincode(cleaned);
      if (pinCheck.isValid && pinCheck.state) {
        setShippingAddress((prev) => ({
          ...prev,
          state: prev.state || pinCheck.state || "",
        }));
        setErrors((prev) => {
          const next = { ...prev };
          delete next.pincode;
          return next;
        });
      } else {
        setErrors((prev) => ({ ...prev, pincode: pinCheck.message || "Invalid PIN code" }));
      }
    }
  };

  // Coupon Application
  const handleApplyCoupon = async (codeToTry?: string) => {
    const code = (codeToTry || couponCode).trim().toUpperCase();
    if (!code) {
      setCouponError("Please enter a voucher code.");
      return;
    }

    setCouponLoading(true);
    setCouponError(null);

    try {
      const res = await fetch("/api/checkout/validate-coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, subtotal: cartSubtotal }),
      });
      const data = await res.json();

      if (data.success && data.isValid && data.coupon) {
        setAppliedCoupon(data.coupon);
        setDiscountAmount(data.discountAmount);
        setCouponCode("");
      } else {
        setCouponError(data.message || "Invalid or inapplicable voucher code.");
      }
    } catch {
      setCouponError("Could not validate coupon. Please try again.");
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setDiscountAmount(0);
    setCouponError(null);
  };

  // Validation Form Checks
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Contact Validation
    if (!customerInfo.fullName.trim()) newErrors.fullName = "Full name is required.";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!customerInfo.email.trim() || !emailRegex.test(customerInfo.email)) {
      newErrors.email = "Please enter a valid email address for order confirmation.";
    }
    const phoneRegex = /^(?:\+91|91)?[6-9]\d{9}$/;
    if (!customerInfo.phone.trim() || !phoneRegex.test(customerInfo.phone.replace(/[\s-]/g, ""))) {
      newErrors.phone = "Please enter a valid 10-digit Indian mobile number.";
    }

    // Shipping Validation
    if (!shippingAddress.houseNumber.trim()) newErrors.houseNumber = "House / Flat number is required.";
    if (!shippingAddress.street.trim()) newErrors.street = "Street / Locality is required.";
    if (!shippingAddress.city.trim()) newErrors.city = "City is required.";
    if (!shippingAddress.state.trim()) newErrors.state = "State is required.";

    const pinCheck = validateIndianPincode(shippingAddress.pincode);
    if (!pinCheck.isValid) {
      newErrors.pincode = pinCheck.message || "Valid 6-digit Indian PIN code is required.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Checkout submission and Razorpay initiation
  const handleProceedToPayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      window.scrollTo({ top: 150, behavior: "smooth" });
      return;
    }

    if (cart.length === 0) {
      setPaymentErrorModal({
        open: true,
        title: "Your Bag is Empty",
        message: "Please add handcrafted items to your bag before proceeding to checkout.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Create Server-Side Order
      const createRes = await fetch("/api/checkout/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart,
          customerInfo,
          shippingAddress: {
            ...shippingAddress,
            fullName: shippingAddress.fullName || customerInfo.fullName,
            phone: shippingAddress.phone || customerInfo.phone,
          },
          couponCode: appliedCoupon?.code,
        }),
      });

      const orderData = await createRes.json();

      if (!orderData.success) {
        throw new Error(orderData.message || "Failed to initiate order. Please review your details.");
      }

      const { orderId, orderNumber, razorpayOrderId, amount, currency, keyId, isSimulatedTest } = orderData;

      // 2. Razorpay Verification Handler
      const handlePaymentVerification = async (paymentDetails: {
        razorpay_payment_id: string;
        razorpay_order_id: string;
        razorpay_signature: string;
      }) => {
        try {
          const verifyRes = await fetch("/api/checkout/verify-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId,
              orderNumber,
              razorpayOrderId: paymentDetails.razorpay_order_id,
              razorpayPaymentId: paymentDetails.razorpay_payment_id,
              razorpaySignature: paymentDetails.razorpay_signature,
            }),
          });

          const verifyData = await verifyRes.json();

          if (verifyData.success && verifyData.accessToken) {
            clearBag();
            router.push(`/order-confirmation/${orderNumber}?token=${verifyData.accessToken}`);
          } else {
            setPaymentErrorModal({
              open: true,
              title: "Payment Verification Failed",
              message:
                verifyData.message ||
                "Cryptographic payment verification failed on our server. If funds were debited, they will be auto-refunded within 48 hours.",
            });
            setIsSubmitting(false);
          }
        } catch {
          setPaymentErrorModal({
            open: true,
            title: "Network Verification Interrupted",
            message:
              "Your payment was received but our verification service timed out. Please contact concierge support before attempting to pay again.",
          });
          setIsSubmitting(false);
        }
      };

      // 3. Initiate Payment (Razorpay Modal or Test Simulator)
      const isLiveRazorpayKey =
        keyId &&
        keyId.startsWith("rzp_test_") &&
        keyId !== "rzp_test_placeholder" &&
        typeof (window as any).Razorpay !== "undefined";

      if (isLiveRazorpayKey) {
        // Real Razorpay Test Gateway Modal
        const options = {
          key: keyId,
          amount,
          currency,
          name: "DHEERA — Apparel & Lifestyle",
          description: `Order ${orderNumber}`,
          image: "/images/brand/dheera-logo.png",
          order_id: razorpayOrderId,
          handler: (response: any) => {
            handlePaymentVerification(response);
          },
          prefill: {
            name: customerInfo.fullName,
            email: customerInfo.email,
            contact: customerInfo.phone,
          },
          theme: {
            color: "#176B45",
          },
          modal: {
            ondismiss: () => {
              setIsSubmitting(false);
              setPaymentErrorModal({
                open: true,
                title: "Payment Cancelled",
                message:
                  "You cancelled the payment transaction. Your shopping bag and delivery details have been preserved so you can retry whenever you are ready.",
              });
            },
          },
        };

        const rzpInstance = new (window as any).Razorpay(options);
        rzpInstance.open();
      } else {
        // High-Fidelity Test Mode Simulator
        // Generates server-signed test credentials and routes strictly through /api/checkout/verify-payment
        await new Promise((r) => setTimeout(r, 1000));

        const simRes = await fetch("/api/checkout/simulate-test-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderNumber,
            razorpayOrderId,
          }),
        });

        const simData = await simRes.json();

        if (simData.success && simData.paymentId && simData.signature) {
          await handlePaymentVerification({
            razorpay_payment_id: simData.paymentId,
            razorpay_order_id: razorpayOrderId,
            razorpay_signature: simData.signature,
          });
        } else {
          setPaymentErrorModal({
            open: true,
            title: "Test Simulation Unavailable",
            message: "Could not generate verified test credentials for this simulated checkout.",
          });
          setIsSubmitting(false);
        }
      }
    } catch (err: any) {
      console.error("Checkout process error:", err);
      setPaymentErrorModal({
        open: true,
        title: "Order Submission Failed",
        message: err.message || "An unexpected error occurred while processing checkout. Please try again.",
      });
      setIsSubmitting(false);
    }
  };

  // Redirect if cart empty and not submitting
  if (cart.length === 0 && !isSubmitting) {
    return (
      <div className="py-20 md:py-28 bg-[#EEEAE0]/40 min-h-[65vh] flex items-center">
        <Container size="default">
          <div className="text-center max-w-lg mx-auto space-y-4 bg-[#FAF9F5] p-8 sm:p-12 border border-[#E2DFD6]">
            <h1 className="text-3xl font-serif text-[#176B45]">Your Bag is Empty</h1>
            <p className="text-xs sm:text-sm text-[#74786F]">
              There are no ensembles in your shopping bag to check out.
            </p>
            <div className="pt-2">
              <Link
                href="/shop"
                className="inline-block px-6 py-3 bg-[#176B45] text-[#FAF9F5] text-xs uppercase tracking-luxury hover:bg-[#315039]"
              >
                Return to Catalogue
              </Link>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="bg-[#FAF9F5] min-h-screen">
      {/* Distraction-Free Header */}
      <header className="border-b border-[#E2DFD6] bg-[#FAF9F5] sticky top-0 z-30 py-3 sm:py-4">
        <Container size="default">
          <div className="flex items-center justify-between">
            <Link
              href="/cart"
              className="text-xs uppercase tracking-luxury text-[#176B45] hover:text-[#AA9160] transition-colors flex items-center gap-1.5 font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Back to Bag</span>
            </Link>

            <div className="flex items-center justify-center">
              <BrandLogo size="md" />
            </div>

            <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-[#176B45] font-medium tracking-wide">
              <Lock className="w-3.5 h-3.5 text-[#AA9160]" />
              <span className="hidden sm:inline">256-Bit Encrypted Checkout</span>
            </div>
          </div>
        </Container>
      </header>

      {/* Main Checkout Viewport */}
      <main className="py-8 sm:py-12">
        <Container size="default">
          {/* Mobile Order Summary Accordion Dropdown */}
          <div className="lg:hidden mb-6 border border-[#E2DFD6] bg-white">
            <button
              type="button"
              onClick={() => setMobileSummaryOpen(!mobileSummaryOpen)}
              className="w-full px-4 py-3 flex items-center justify-between text-xs tracking-wide text-[#252A25] font-medium"
            >
              <span className="flex items-center gap-2 text-[#176B45]">
                <span>Order Summary ({cartCount} {cartCount === 1 ? "item" : "items"})</span>
                {mobileSummaryOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </span>
              <span className="font-serif text-sm font-bold text-[#176B45]">
                ₹{grandTotal.toLocaleString("en-IN")}
              </span>
            </button>

            {mobileSummaryOpen && (
              <div className="px-4 pb-4 pt-2 border-t border-[#E2DFD6] space-y-4">
                <div className="divide-y divide-[#E2DFD6] max-h-60 overflow-y-auto">
                  {cart.map((item) => (
                    <div key={item.id} className="py-2.5 flex items-center gap-3">
                      <div className="relative w-12 aspect-[3/4] bg-[#EEEAE0] flex-shrink-0">
                        <Image src={item.image} alt={item.name} fill sizes="48px" className="object-cover" />
                      </div>
                      <div className="flex-1 min-w-0 text-xs">
                        <p className="font-serif text-[#176B45] truncate font-medium">{item.name}</p>
                        <p className="text-[10px] text-[#74786F]">Size: {item.size} • Qty: {item.quantity}</p>
                      </div>
                      <span className="text-xs font-semibold text-[#252A25]">
                        ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="space-y-1 text-xs border-t border-[#E2DFD6] pt-3 text-[#74786F]">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="text-[#252A25]">₹{cartSubtotal.toLocaleString("en-IN")}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-[#176B45]">
                      <span>Discount</span>
                      <span>-₹{discountAmount.toLocaleString("en-IN")}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Delivery</span>
                    <span className="text-[#252A25]">{shippingFee === 0 ? "Complimentary" : `₹${shippingFee}`}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-[#E2DFD6] font-serif text-sm font-bold text-[#176B45]">
                    <span>Total</span>
                    <span>₹{grandTotal.toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Checkout Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* Form Column */}
            <form onSubmit={handleProceedToPayment} className="lg:col-span-7 space-y-8">
              {/* Test Mode Notification Banner */}
              <div className="p-3.5 bg-[#EEEAE0]/70 border border-[#AA9160]/40 flex items-start gap-3 text-xs text-[#252A25]">
                <Sparkles className="w-4 h-4 text-[#AA9160] flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#176B45] block font-semibold mb-0.5">
                    RAZORPAY TEST ENVIRONMENT (PHASE 4)
                  </strong>
                  <p className="text-[11px] text-[#74786F]">
                    Checkout transactions run in official Test Mode. No live payment will be captured. All prices, stock, and shipping calculations are authoritatively revalidated on the server.
                  </p>
                </div>
              </div>

              {/* Section A: Contact Information */}
              <div className="bg-white border border-[#E2DFD6] p-6 sm:p-8 space-y-5 shadow-sm">
                <div className="border-b border-[#E2DFD6] pb-3 flex items-center justify-between">
                  <h2 className="font-serif text-xl text-[#176B45] tracking-wide flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#176B45] text-white text-xs flex items-center justify-center font-sans">
                      1
                    </span>
                    <span>Contact Information</span>
                  </h2>
                  <span className="text-[11px] text-[#74786F] tracking-wide">For Dispatch & Tracking</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div className="sm:col-span-2">
                    <label className="block text-xs uppercase tracking-luxury text-[#252A25] font-medium mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={customerInfo.fullName}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, fullName: e.target.value })}
                      placeholder="e.g. Ananya Sharma"
                      className={`w-full px-3.5 py-2.5 text-xs bg-[#FAF9F5] border focus:outline-none transition-colors ${
                        errors.fullName ? "border-red-600 focus:border-red-600" : "border-[#E2DFD6] focus:border-[#176B45]"
                      }`}
                    />
                    {errors.fullName && <p className="text-[11px] text-red-600 mt-1">{errors.fullName}</p>}
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-luxury text-[#252A25] font-medium mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={customerInfo.email}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                      placeholder="ananya@example.com"
                      className={`w-full px-3.5 py-2.5 text-xs bg-[#FAF9F5] border focus:outline-none transition-colors ${
                        errors.email ? "border-red-600 focus:border-red-600" : "border-[#E2DFD6] focus:border-[#176B45]"
                      }`}
                    />
                    {errors.email && <p className="text-[11px] text-red-600 mt-1">{errors.email}</p>}
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-luxury text-[#252A25] font-medium mb-1">
                      Mobile Number (India) *
                    </label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 text-xs bg-[#EEEAE0] border border-r-0 border-[#E2DFD6] text-[#74786F]">
                        +91
                      </span>
                      <input
                        type="tel"
                        maxLength={10}
                        value={customerInfo.phone}
                        onChange={(e) =>
                          setCustomerInfo({
                            ...customerInfo,
                            phone: e.target.value.replace(/\D/g, "").slice(0, 10),
                          })
                        }
                        placeholder="9876543210"
                        className={`w-full px-3.5 py-2.5 text-xs bg-[#FAF9F5] border focus:outline-none transition-colors ${
                          errors.phone ? "border-red-600 focus:border-red-600" : "border-[#E2DFD6] focus:border-[#176B45]"
                        }`}
                      />
                    </div>
                    {errors.phone && <p className="text-[11px] text-red-600 mt-1">{errors.phone}</p>}
                  </div>
                </div>
              </div>

              {/* Section B: Delivery Address */}
              <div className="bg-white border border-[#E2DFD6] p-6 sm:p-8 space-y-5 shadow-sm">
                <div className="border-b border-[#E2DFD6] pb-3 flex items-center justify-between">
                  <h2 className="font-serif text-xl text-[#176B45] tracking-wide flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#176B45] text-white text-xs flex items-center justify-center font-sans">
                      2
                    </span>
                    <span>Delivery Address</span>
                  </h2>
                  <span className="text-[11px] text-[#74786F] tracking-wide">Pan-India Delivery</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="block text-xs uppercase tracking-luxury text-[#252A25] font-medium mb-1">
                      Postal PIN Code *
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={shippingAddress.pincode}
                      onChange={(e) => handlePincodeChange(e.target.value)}
                      placeholder="e.g. 110001 or 560001"
                      className={`w-full px-3.5 py-2.5 text-xs bg-[#FAF9F5] border focus:outline-none transition-colors ${
                        errors.pincode ? "border-red-600 focus:border-red-600" : "border-[#E2DFD6] focus:border-[#176B45]"
                      }`}
                    />
                    {errors.pincode && <p className="text-[11px] text-red-600 mt-1">{errors.pincode}</p>}
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-luxury text-[#252A25] font-medium mb-1">
                      Country
                    </label>
                    <input
                      type="text"
                      disabled
                      value="India (Domestic Insured)"
                      className="w-full px-3.5 py-2.5 text-xs bg-[#EEEAE0]/50 border border-[#E2DFD6] text-[#74786F] cursor-not-allowed"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs uppercase tracking-luxury text-[#252A25] font-medium mb-1">
                      House / Flat / Suite & Building Name *
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.houseNumber}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, houseNumber: e.target.value })}
                      placeholder="e.g. Apartment 402, Lotus Heritage Towers"
                      className={`w-full px-3.5 py-2.5 text-xs bg-[#FAF9F5] border focus:outline-none transition-colors ${
                        errors.houseNumber
                          ? "border-red-600 focus:border-red-600"
                          : "border-[#E2DFD6] focus:border-[#176B45]"
                      }`}
                    />
                    {errors.houseNumber && <p className="text-[11px] text-red-600 mt-1">{errors.houseNumber}</p>}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs uppercase tracking-luxury text-[#252A25] font-medium mb-1">
                      Street Address & Locality *
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.street}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, street: e.target.value })}
                      placeholder="e.g. Defence Colony, Main Market Road"
                      className={`w-full px-3.5 py-2.5 text-xs bg-[#FAF9F5] border focus:outline-none transition-colors ${
                        errors.street ? "border-red-600 focus:border-red-600" : "border-[#E2DFD6] focus:border-[#176B45]"
                      }`}
                    />
                    {errors.street && <p className="text-[11px] text-red-600 mt-1">{errors.street}</p>}
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-luxury text-[#252A25] font-medium mb-1">
                      City *
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.city}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                      placeholder="e.g. New Delhi"
                      className={`w-full px-3.5 py-2.5 text-xs bg-[#FAF9F5] border focus:outline-none transition-colors ${
                        errors.city ? "border-red-600 focus:border-red-600" : "border-[#E2DFD6] focus:border-[#176B45]"
                      }`}
                    />
                    {errors.city && <p className="text-[11px] text-red-600 mt-1">{errors.city}</p>}
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-luxury text-[#252A25] font-medium mb-1">
                      State *
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.state}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                      placeholder="e.g. Delhi"
                      className={`w-full px-3.5 py-2.5 text-xs bg-[#FAF9F5] border focus:outline-none transition-colors ${
                        errors.state ? "border-red-600 focus:border-red-600" : "border-[#E2DFD6] focus:border-[#176B45]"
                      }`}
                    />
                    {errors.state && <p className="text-[11px] text-red-600 mt-1">{errors.state}</p>}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs uppercase tracking-luxury text-[#252A25] font-medium mb-1">
                      Landmark (Optional)
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.landmark}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, landmark: e.target.value })}
                      placeholder="e.g. Near Heritage Park Gate 2"
                      className="w-full px-3.5 py-2.5 text-xs bg-[#FAF9F5] border border-[#E2DFD6] focus:outline-none focus:border-[#176B45]"
                    />
                  </div>

                  <div className="sm:col-span-2 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-[#74786F]">
                      <input
                        type="checkbox"
                        checked={shippingAddress.saveAddress}
                        onChange={(e) =>
                          setShippingAddress({ ...shippingAddress, saveAddress: e.target.checked })
                        }
                        className="rounded border-[#E2DFD6] text-[#176B45] focus:ring-[#176B45]"
                      />
                      <span>Save this delivery address to my account profile for future bespoke orders</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Section C: Payment Method */}
              <div className="bg-white border border-[#E2DFD6] p-6 sm:p-8 space-y-5 shadow-sm">
                <div className="border-b border-[#E2DFD6] pb-3 flex items-center justify-between">
                  <h2 className="font-serif text-xl text-[#176B45] tracking-wide flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#176B45] text-white text-xs flex items-center justify-center font-sans">
                      3
                    </span>
                    <span>Payment Selection</span>
                  </h2>
                  <span className="text-[11px] text-[#74786F] tracking-wide">Razorpay Test Gateway</span>
                </div>

                <div className="p-4 border-2 border-[#176B45] bg-[#FAF9F5] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-4 h-4 rounded-full border-4 border-[#176B45] bg-white flex-shrink-0" />
                      <div>
                        <span className="text-xs font-semibold text-[#176B45] uppercase tracking-luxury block">
                          Razorpay Secure Checkout (Test Mode)
                        </span>
                        <p className="text-[11px] text-[#74786F]">
                          UPI, Credit / Debit Cards, NetBanking, and Wallets
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-[#74786F]">
                      <Smartphone className="w-4 h-4" />
                      <CreditCard className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="text-[11px] text-[#74786F] pt-2 border-t border-[#E2DFD6] flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#AA9160] flex-shrink-0" />
                    <span>Card and banking data are never stored on our servers. Test simulation available.</span>
                  </div>
                </div>

                {/* Primary Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-[#176B45] text-[#FAF9F5] text-xs uppercase tracking-luxury hover:bg-[#315039] transition-all flex items-center justify-center gap-2.5 font-semibold shadow-md disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Verifying & Preparing Payment...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Pay ₹{grandTotal.toLocaleString("en-IN")} via Razorpay Test Mode</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Desktop Order Summary Column */}
            <div className="hidden lg:block lg:col-span-5 sticky top-24 space-y-6">
              <div className="bg-white border border-[#E2DFD6] p-6 shadow-sm space-y-5">
                <h2 className="font-serif text-xl text-[#176B45] tracking-wide border-b border-[#E2DFD6] pb-3">
                  Order Summary ({cartCount})
                </h2>

                {/* Items List */}
                <div className="divide-y divide-[#E2DFD6] max-h-80 overflow-y-auto pr-1">
                  {cart.map((item) => (
                    <div key={item.id} className="py-3.5 flex items-center gap-4">
                      <div className="relative w-16 aspect-[3/4] bg-[#EEEAE0] border border-[#E2DFD6] flex-shrink-0">
                        <Image src={item.image} alt={item.name} fill sizes="64px" className="object-cover" />
                        <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#176B45] text-white text-[10px] flex items-center justify-center font-bold">
                          {item.quantity}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-serif text-sm text-[#176B45] font-medium truncate">{item.name}</h3>
                        <p className="text-[11px] text-[#74786F]">
                          Size: {item.size} {item.colour && item.colour !== "Standard" ? `• ${item.colour}` : ""}
                        </p>
                        <p className="text-xs font-semibold text-[#252A25] mt-1">
                          ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Coupon Code Input */}
                <div className="border-t border-b border-[#E2DFD6] py-4 space-y-2.5">
                  <label className="text-[11px] uppercase tracking-luxury text-[#252A25] font-medium block">
                    Promotional Voucher
                  </label>
                  {appliedCoupon ? (
                    <div className="p-2.5 bg-[#176B45]/5 border border-[#176B45]/20 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Tag className="w-3.5 h-3.5 text-[#176B45]" />
                        <span className="font-semibold text-[#176B45]">{appliedCoupon.code}</span>
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
                          type="text"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          placeholder="CODE (e.g. DHEERA10)"
                          className="flex-1 min-w-0 px-3 py-2 text-xs bg-[#FAF9F5] border border-[#E2DFD6] uppercase focus:outline-none focus:border-[#176B45]"
                        />
                        <button
                          type="button"
                          onClick={() => handleApplyCoupon()}
                          disabled={couponLoading || !couponCode.trim()}
                          className="px-3.5 py-2 bg-[#176B45] text-[#FAF9F5] text-xs uppercase tracking-luxury hover:bg-[#315039] disabled:opacity-40"
                        >
                          {couponLoading ? "..." : "Apply"}
                        </button>
                      </div>
                      {/* One-click fixture suggestion */}
                      <button
                        type="button"
                        onClick={() => handleApplyCoupon("DHEERA10")}
                        className="mt-1.5 text-[10px] text-[#176B45] underline underline-offset-2 hover:text-[#AA9160] block"
                      >
                        Try test code: DHEERA10 (10% off)
                      </button>
                    </div>
                  )}
                  {couponError && <p className="text-[11px] text-red-600">{couponError}</p>}
                </div>

                {/* Pricing Line Items */}
                <div className="space-y-2 text-xs text-[#74786F]">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-serif text-[#252A25] font-medium">₹{cartSubtotal.toLocaleString("en-IN")}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-[#176B45]">
                      <span>Voucher Discount</span>
                      <span className="font-serif font-medium">-₹{discountAmount.toLocaleString("en-IN")}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Insured Domestic Delivery</span>
                    <span className="font-serif text-[#252A25] font-medium">
                      {shippingFee === 0 ? "Complimentary" : `₹${shippingFee}`}
                    </span>
                  </div>
                  <div className="flex justify-between pt-3 border-t border-[#E2DFD6] text-base text-[#252A25]">
                    <span className="font-serif font-semibold">Total Payable</span>
                    <span className="font-serif text-xl font-bold text-[#176B45]">
                      ₹{grandTotal.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#74786F]">
                    Inclusive of all taxes. Free 7-day concierge exchanges.
                  </p>
                </div>
              </div>

              {/* Security Assurances */}
              <div className="bg-[#FAF9F5] border border-[#E2DFD6] p-4 space-y-2 text-xs text-[#74786F]">
                <div className="flex items-center gap-2 text-[#176B45] font-semibold text-[11px] uppercase tracking-wide">
                  <ShieldCheck className="w-4 h-4 text-[#AA9160]" />
                  <span>DHEERA Concierge Assurance</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Every order is individually inspected by master tailors before being sealed in moisture-protected archival packaging.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </main>

      {/* Payment Failure / Cancellation Modal */}
      {paymentErrorModal.open && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#FAF9F5] border border-[#E2DFD6] max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-700 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="font-serif text-xl text-[#176B45]">{paymentErrorModal.title}</h3>
              <p className="text-xs text-[#74786F] leading-relaxed">{paymentErrorModal.message}</p>
            </div>

            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={() => setPaymentErrorModal({ open: false, title: "", message: "" })}
                className="w-full py-3 bg-[#176B45] text-[#FAF9F5] text-xs uppercase tracking-luxury hover:bg-[#315039] transition-colors font-semibold"
              >
                Retry Payment
              </button>
              <Link
                href="/cart"
                className="block text-center text-xs uppercase tracking-luxury text-[#74786F] hover:text-[#176B45] py-1"
              >
                Return to Bag
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

