"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/auth-context";
import { CustomerOrderDetail } from "@/types/account";
import { OrderTrackingTimeline } from "./order-tracking-timeline";
import { formatCurrency } from "@/lib/utils";
import {
  ArrowLeft,
  Package,
  MapPin,
  CreditCard,
  ShieldCheck,
  AlertCircle,
  Clock,
  CheckCircle,
  Truck,
} from "lucide-react";

interface OrderDetailViewProps {
  orderIdentifier: string;
}

export function OrderDetailView({ orderIdentifier }: OrderDetailViewProps) {
  const { user } = useAuth();
  const [order, setOrder] = useState<CustomerOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrderDetail() {
      if (!user) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/account/orders/${orderIdentifier}?userId=${user.id}`);
        if (res.ok) {
          const data = await res.json();
          setOrder(data.order);
        } else {
          const errData = await res.json();
          setError(errData.error || "Order not found or unauthorized.");
        }
      } catch {
        setError("Network error while retrieving order details.");
      } finally {
        setLoading(false);
      }
    }

    fetchOrderDetail();
  }, [orderIdentifier, user]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
            <CheckCircle className="w-3.5 h-3.5" /> Confirmed
          </span>
        );
      case "processing":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
            <Clock className="w-3.5 h-3.5" /> Handcrafting in Atelier
          </span>
        );
      case "dispatched":
      case "in_transit":
      case "out_for_delivery":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <Truck className="w-3.5 h-3.5" /> In Transit
          </span>
        );
      case "delivered":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
            <CheckCircle className="w-3.5 h-3.5" /> Delivered
          </span>
        );
      case "pending_payment":
      case "pending":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-3.5 h-3.5" /> Pending Payment
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-xs text-[#8C9388] animate-pulse">
        Retrieving order snapshot and tracking timeline...
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="bg-[#FAF9F5] border border-[#E2DFD6] rounded-sm p-12 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-amber-600 mx-auto" />
        <h3 className="font-serif text-lg text-[#252A25]">Unable to Load Order</h3>
        <p className="text-xs text-[#555E55] max-w-sm mx-auto">
          {error || "The order identifier requested could not be found or you do not have permission to view it."}
        </p>
        <div className="pt-2">
          <Link
            href="/account/orders"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#176B45] text-white text-xs uppercase tracking-wide hover:bg-[#315039] rounded-sm transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to My Orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-[#FAF9F5] border border-[#E2DFD6] rounded-sm p-6 sm:p-8 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/account/orders"
            className="inline-flex items-center gap-1.5 text-xs text-[#555E55] hover:text-[#176B45] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to All Orders
          </Link>
          <div className="flex items-center gap-2">
            {getStatusBadge(order.status)}
            <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-[#176B45]/10 text-[#176B45]">
              {order.paymentStatus === "captured" ? "Paid" : "Unpaid"}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-4 pt-2">
          <div>
            <span className="text-[10px] uppercase tracking-luxury text-[#8C9388] font-mono">
              Order Reference
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif text-[#176B45] font-semibold mt-0.5">
              {order.orderNumber}
            </h2>
            <p className="text-xs text-[#555E55] mt-1">
              Placed on{" "}
              {new Date(order.createdAt).toLocaleDateString("en-IN", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          <div className="text-right">
            <span className="text-[10px] uppercase tracking-wider text-[#8C9388]">
              Total Investment
            </span>
            <p className="text-2xl font-serif font-bold text-[#176B45]">
              {formatCurrency(order.pricing.totalAmount)}
            </p>
          </div>
        </div>
      </div>

      {/* Real-time Order Tracking Timeline */}
      <div className="bg-[#FAF9F5] border border-[#E2DFD6] rounded-sm p-6 sm:p-8">
        <div className="flex items-center justify-between pb-4 border-b border-[#E2DFD6] mb-2">
          <div>
            <h3 className="text-lg font-serif text-[#176B45]">Atelier Crafting & Delivery Timeline</h3>
            <p className="text-xs text-[#555E55]">
              Real-time progression from artisan atelier to your doorstep.
            </p>
          </div>
          {order.trackingNumber && (
            <span className="text-xs font-mono text-[#176B45] bg-[#176B45]/10 px-2.5 py-1 rounded">
              AWB: {order.trackingNumber}
            </span>
          )}
        </div>

        <OrderTrackingTimeline steps={order.trackingTimeline || []} />
      </div>

      {/* 2-Column Detail Grid: Items on left, Details on right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Items Card (2 cols) */}
        <div className="lg:col-span-2 bg-[#FAF9F5] border border-[#E2DFD6] rounded-sm p-6 sm:p-8">
          <div className="flex items-center gap-2 pb-4 border-b border-[#E2DFD6] mb-4">
            <Package className="w-4 h-4 text-[#176B45]" />
            <h3 className="font-serif text-base text-[#176B45]">
              Purchased Garments ({order.items.reduce((s, i) => s + i.quantity, 0)})
            </h3>
          </div>

          <div className="divide-y divide-[#E2DFD6]/70">
            {order.items.map((item) => (
              <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex items-start gap-4">
                <div className="relative w-16 aspect-[3/4] sm:w-20 bg-[#EEEAE0] border border-[#E2DFD6] rounded-sm overflow-hidden flex-shrink-0">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <h4 className="font-serif text-sm sm:text-base text-[#252A25] font-medium">
                    {item.name}
                  </h4>
                  <p className="text-xs text-[#555E55]">
                    Size: <span className="font-medium text-[#252A25]">{item.size}</span> &nbsp;|&nbsp; Colour:{" "}
                    <span className="font-medium text-[#252A25]">{item.colour}</span>
                  </p>
                  <p className="text-[11px] font-mono text-[#8C9388]">SKU: {item.sku}</p>
                  <p className="text-xs text-[#555E55] pt-1">
                    Qty: {item.quantity} × {formatCurrency(item.unitPrice)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-serif text-sm sm:text-base font-semibold text-[#176B45]">
                    {formatCurrency(item.totalPrice)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing Summary & Details (1 col) */}
        <div className="space-y-6">
          {/* Price Breakdown */}
          <div className="bg-[#FAF9F5] border border-[#E2DFD6] rounded-sm p-6 space-y-3">
            <h4 className="font-serif text-sm font-semibold text-[#176B45] pb-2 border-b border-[#E2DFD6]">
              Order Pricing Summary
            </h4>
            <div className="space-y-2 text-xs text-[#555E55]">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-medium text-[#252A25]">
                  {formatCurrency(order.pricing.subtotal)}
                </span>
              </div>

              {order.pricing.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>
                    Discount {order.pricing.appliedCoupon ? `(${order.pricing.appliedCoupon.code})` : ""}
                  </span>
                  <span>- {formatCurrency(order.pricing.discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Atelier Shipping</span>
                <span className="font-medium text-[#252A25]">
                  {order.pricing.shippingFee === 0 ? "Complimentary" : formatCurrency(order.pricing.shippingFee)}
                </span>
              </div>

              <div className="flex justify-between">
                <span>Applicable GST (Taxes)</span>
                <span className="font-medium text-[#252A25]">
                  {order.pricing.taxAmount === 0 ? "Included" : formatCurrency(order.pricing.taxAmount)}
                </span>
              </div>

              <div className="pt-2 border-t border-[#E2DFD6] flex justify-between font-serif text-sm font-bold text-[#176B45]">
                <span>Total Paid</span>
                <span>{formatCurrency(order.pricing.totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Delivery Address */}
          <div className="bg-[#FAF9F5] border border-[#E2DFD6] rounded-sm p-6 space-y-2">
            <div className="flex items-center gap-2 pb-2 border-b border-[#E2DFD6]">
              <MapPin className="w-4 h-4 text-[#176B45]" />
              <h4 className="font-serif text-sm font-semibold text-[#176B45]">
                Delivery Destination
              </h4>
            </div>
            <div className="text-xs text-[#252A25] space-y-0.5">
              <p className="font-semibold">{order.shippingAddress.fullName}</p>
              <p className="text-[#555E55]">{order.shippingAddress.houseNumber}, {order.shippingAddress.street}</p>
              {order.shippingAddress.landmark && (
                <p className="text-[#8C9388] text-[11px]">Near: {order.shippingAddress.landmark}</p>
              )}
              <p className="text-[#555E55]">
                {order.shippingAddress.city}, {order.shippingAddress.state} – {order.shippingAddress.pincode}
              </p>
              <p className="text-[#555E55] pt-1">Phone: +91 {order.shippingAddress.phone}</p>
            </div>
          </div>

          {/* Payment Snapshot */}
          <div className="bg-[#FAF9F5] border border-[#E2DFD6] rounded-sm p-6 space-y-2">
            <div className="flex items-center gap-2 pb-2 border-b border-[#E2DFD6]">
              <CreditCard className="w-4 h-4 text-[#176B45]" />
              <h4 className="font-serif text-sm font-semibold text-[#176B45]">
                Payment Information
              </h4>
            </div>
            <div className="text-xs text-[#555E55] space-y-1">
              <p>
                Gateway: <span className="font-medium capitalize text-[#252A25]">{order.payment.gateway}</span>
              </p>
              {order.payment.gatewayOrderId && (
                <p className="font-mono text-[11px]">
                  Order ID: {order.payment.gatewayOrderId}
                </p>
              )}
              {order.payment.gatewayPaymentId && (
                <p className="font-mono text-[11px]">
                  Payment ID: {order.payment.gatewayPaymentId}
                </p>
              )}
              <div className="pt-1 flex items-center gap-1.5 text-[11px] text-[#176B45]">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>256-bit encrypted transaction</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

