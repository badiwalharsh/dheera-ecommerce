"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { ConfirmedOrderDetails } from "@/types/cart";
import {
  CheckCircle2,
  Package,
  MapPin,
  Mail,
  Phone,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Printer,
  Clock,
  AlertTriangle,
} from "lucide-react";

interface OrderConfirmationViewProps {
  orderIdentifier: string;
  accessToken?: string | null;
}

export function OrderConfirmationView({ orderIdentifier, accessToken }: OrderConfirmationViewProps) {
  const [order, setOrder] = useState<ConfirmedOrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrder() {
      try {
        const tokenQuery = accessToken ? `?token=${encodeURIComponent(accessToken)}` : "";
        const res = await fetch(`/api/orders/${orderIdentifier}${tokenQuery}`);
        const data = await res.json();
        if (data.success && data.order) {
          setOrder(data.order);
        } else {
          setError(data.message || "Unable to locate order details or authorization is required.");
        }
      } catch {
        setError("Error fetching order confirmation.");
      } finally {
        setLoading(false);
      }
    }
    fetchOrder();
  }, [orderIdentifier, accessToken]);

  if (loading) {
    return (
      <div className="py-24 bg-[#FAF9F5] min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-[#176B45] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="font-serif text-lg text-[#176B45]">Loading your order confirmation...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="py-20 bg-[#FAF9F5] min-h-[60vh] flex items-center">
        <Container size="default">
          <div className="max-w-md mx-auto text-center space-y-4 p-8 border border-[#E2DFD6] bg-white shadow-sm">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-700 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h1 className="font-serif text-2xl text-[#176B45]">Order Access Restricted</h1>
            <p className="text-xs text-[#74786F] leading-relaxed">
              {error || "For customer privacy, order details can only be viewed with the verified access token issued at checkout."}
            </p>
            <Link
              href="/shop"
              className="inline-block mt-2 px-6 py-2.5 bg-[#176B45] text-white text-xs uppercase tracking-luxury hover:bg-[#315039] font-medium"
            >
              Return to Shop
            </Link>
          </div>
        </Container>
      </div>
    );
  }

  const { customerInfo, shippingAddress, items, pricing, payment, status, paymentStatus } = order;
  const isPaid = status === "confirmed" && paymentStatus === "captured";

  return (
    <div className="py-12 md:py-20 bg-[#FAF9F5]">
      <Container size="default">
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Header Banner */}
          <div className="text-center space-y-4 bg-white border border-[#E2DFD6] p-8 sm:p-12 shadow-sm">
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto border ${
                isPaid
                  ? "bg-[#176B45]/10 text-[#176B45] border-[#176B45]/20"
                  : "bg-amber-50 text-amber-700 border-amber-200"
              }`}
            >
              {isPaid ? <CheckCircle2 className="w-8 h-8" /> : <Clock className="w-8 h-8" />}
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] uppercase tracking-luxury text-[#AA9160] font-semibold block">
                {isPaid ? "Order Confirmed & Payment Verified" : "Payment Awaiting Verification"}
              </span>
              <h1 className="text-3xl sm:text-4xl font-serif text-[#176B45]">
                {isPaid ? `Thank You, ${customerInfo.fullName}` : `Order #${order.orderNumber} Pending`}
              </h1>
              <p className="text-xs sm:text-sm text-[#74786F] max-w-md mx-auto pt-1 leading-relaxed">
                {isPaid
                  ? "Your bespoke order has been registered. Our artisanal team has begun reviewing your ensemble specifications."
                  : "Your payment is currently being verified by the payment gateway. You will receive an email once confirmed."}
              </p>
            </div>

            {/* Order Badges */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3 text-xs">
              <span className="px-3.5 py-1.5 bg-[#EEEAE0] border border-[#E2DFD6] text-[#252A25] font-mono font-medium">
                Order #{order.orderNumber}
              </span>
              <span
                className={`px-3.5 py-1.5 uppercase tracking-luxury text-[10px] font-semibold ${
                  isPaid ? "bg-[#176B45] text-[#FAF9F5]" : "bg-amber-100 text-amber-800 border border-amber-200"
                }`}
              >
                Payment: {payment.status === "captured" ? "Verified (Captured)" : "Pending Verification"}
              </span>
            </div>

            {/* Test Mode Disclaimer */}
            <div className="mt-4 p-3 bg-[#EEEAE0]/50 border border-[#AA9160]/30 text-xs text-[#252A25] flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 text-[#AA9160] flex-shrink-0" />
              <span className="text-[11px]">
                <strong>Development Fixture:</strong> This is a Razorpay Test Mode confirmation. No real financial transaction was executed.
              </span>
            </div>
          </div>

          {/* Order Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Delivery Address Card */}
            <div className="bg-white border border-[#E2DFD6] p-6 space-y-3.5 shadow-sm">
              <div className="flex items-center gap-2 text-[#176B45] font-medium text-xs uppercase tracking-luxury border-b border-[#E2DFD6] pb-2.5">
                <MapPin className="w-4 h-4 text-[#AA9160]" />
                <span>Delivery Address</span>
              </div>
              <div className="text-xs text-[#252A25] space-y-1">
                <strong className="block text-sm font-medium">{shippingAddress.fullName || customerInfo.fullName}</strong>
                <p>{shippingAddress.houseNumber}, {shippingAddress.street}</p>
                {shippingAddress.landmark && <p className="text-[#74786F]">Landmark: {shippingAddress.landmark}</p>}
                <p>{shippingAddress.city}, {shippingAddress.state} – {shippingAddress.pincode}</p>
                <p className="text-[#74786F]">{shippingAddress.country}</p>
              </div>
            </div>

            {/* Contact & Dispatch Card */}
            <div className="bg-white border border-[#E2DFD6] p-6 space-y-3.5 shadow-sm">
              <div className="flex items-center gap-2 text-[#176B45] font-medium text-xs uppercase tracking-luxury border-b border-[#E2DFD6] pb-2.5">
                <Package className="w-4 h-4 text-[#AA9160]" />
                <span>Dispatch & Contact</span>
              </div>
              <div className="text-xs text-[#252A25] space-y-2">
                <div className="flex items-center gap-2 text-[#74786F]">
                  <Mail className="w-3.5 h-3.5 text-[#176B45]" />
                  <span>{customerInfo.email}</span>
                </div>
                <div className="flex items-center gap-2 text-[#74786F]">
                  <Phone className="w-3.5 h-3.5 text-[#176B45]" />
                  <span>+91 {customerInfo.phone}</span>
                </div>
                <div className="pt-2 border-t border-[#E2DFD6]/60 text-[11px] text-[#74786F]">
                  <span>Estimated Dispatch: </span>
                  <strong className="text-[#176B45]">2–3 business days (Sample)</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Items Summary Table */}
          <div className="bg-white border border-[#E2DFD6] p-6 sm:p-8 shadow-sm space-y-5">
            <h2 className="font-serif text-xl text-[#176B45] border-b border-[#E2DFD6] pb-3">
              Ensemble Summary ({items.length} {items.length === 1 ? "Item" : "Items"})
            </h2>

            <div className="divide-y divide-[#E2DFD6]">
              {items.map((item) => (
                <div key={item.id} className="py-4 flex gap-4 items-center">
                  <div className="relative w-16 aspect-[3/4] bg-[#EEEAE0] border border-[#E2DFD6] flex-shrink-0">
                    <Image src={item.image} alt={item.name} fill sizes="64px" className="object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-serif text-sm font-semibold text-[#176B45] truncate">{item.name}</h3>
                    <p className="text-[11px] text-[#74786F] mt-0.5">
                      Size: {item.size} • Colour: {item.colour} • SKU: {item.sku}
                    </p>
                    <p className="text-xs text-[#252A25] mt-1">
                      Qty: {item.quantity} × ₹{item.unitPrice.toLocaleString("en-IN")}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-serif text-sm font-semibold text-[#176B45]">
                      ₹{item.totalPrice.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Price Breakdown */}
            <div className="border-t border-[#E2DFD6] pt-4 space-y-2 text-xs text-[#74786F]">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-serif text-[#252A25]">₹{pricing.subtotal.toLocaleString("en-IN")}</span>
              </div>
              {pricing.discountAmount > 0 && (
                <div className="flex justify-between text-[#176B45]">
                  <span>Voucher Discount</span>
                  <span className="font-serif">-₹{pricing.discountAmount.toLocaleString("en-IN")}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Delivery Charge</span>
                <span className="font-serif text-[#252A25]">
                  {pricing.shippingFee === 0 ? "Complimentary" : `₹${pricing.shippingFee}`}
                </span>
              </div>
              <div className="flex justify-between pt-3 border-t border-[#E2DFD6] text-base text-[#252A25] font-serif font-bold">
                <span>Total Paid</span>
                <span className="text-xl text-[#176B45]">₹{pricing.totalAmount.toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <Link
              href="/shop"
              className="w-full sm:w-auto px-8 py-3.5 bg-[#176B45] text-white text-xs uppercase tracking-luxury hover:bg-[#315039] transition-colors flex items-center justify-center gap-2 font-medium"
            >
              <span>Continue Shopping</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <button
              type="button"
              onClick={() => window.print()}
              className="w-full sm:w-auto px-6 py-3.5 bg-white border border-[#E2DFD6] text-[#252A25] text-xs uppercase tracking-luxury hover:bg-[#EEEAE0] transition-colors flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>Print Order Receipt</span>
            </button>
          </div>
        </div>
      </Container>
    </div>
  );
}
