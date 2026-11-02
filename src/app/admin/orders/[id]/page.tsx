"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { AdminLayout } from "@/components/admin/admin-layout";
import { StatusBadge } from "@/components/admin/status-badge";
import { ConfirmedOrderDetails, OrderStatus } from "@/types/cart";

export default function AdminOrderDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [order, setOrder] = useState<ConfirmedOrderDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [courierName, setCourierName] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchOrder = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.order) {
          setOrder(data.order);
          setCourierName(data.order.shippingCarrier || "Blue Dart Express");
          setTrackingNumber(data.order.trackingNumber || "");
          setAdminNotes(data.order.notes || "");
        }
      }
    } catch {
      // Error
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const handleUpdateStatus = async (newStatus: OrderStatus) => {
    setIsUpdating(true);
    setStatusMessage(null);

    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          courierName: courierName || undefined,
          trackingNumber: trackingNumber || undefined,
          notes: adminNotes || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMessage({ type: "success", text: data.message });
        setOrder(data.order);
      } else {
        setStatusMessage({ type: "error", text: data.error || "Failed to update order status." });
      }
    } catch {
      setStatusMessage({ type: "error", text: "Network error updating order." });
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="p-12 text-center text-[#74786F] text-xs">
          Loading authoritative order details...
        </div>
      </AdminLayout>
    );
  }

  if (!order) {
    return (
      <AdminLayout>
        <div className="p-12 bg-[#FAF9F5] border border-[#E2DFD6] text-center text-xs text-[#74786F]">
          Order #{id} not found in store records.
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E2DFD6] gap-4">
          <div>
            <Link
              href="/admin/orders"
              className="text-xs text-[#74786F] hover:text-[#176B45] mb-1 inline-block"
            >
              ← Back to Orders Queue
            </Link>
            <div className="flex items-center gap-3">
              <h1 className="font-serif text-2xl sm:text-3xl text-[#176B45]">
                Order {order.orderNumber}
              </h1>
              <StatusBadge status={order.status} />
              <StatusBadge status={order.paymentStatus} />
            </div>
            <p className="text-xs text-[#74786F] mt-0.5">
              Placed on {new Date(order.createdAt).toLocaleString("en-IN", { dateStyle: "long", timeStyle: "short" })}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/account/orders/${order.orderNumber}`}
              target="_blank"
              className="px-3 py-2 bg-[#FAF9F5] border border-[#E2DFD6] rounded-sm text-xs text-[#315039] hover:bg-[#EEEAE0]"
            >
              Customer View ↗
            </Link>
          </div>
        </div>

        {statusMessage && (
          <div
            className={`p-3 text-xs rounded-sm flex items-center justify-between ${
              statusMessage.type === "success"
                ? "bg-[#EAF5EF] border border-[#176B45]/20 text-[#176B45]"
                : "bg-[#FDF2F2] border border-[#991B1B]/20 text-[#991B1B]"
            }`}
          >
            <span>{statusMessage.text}</span>
            <button onClick={() => setStatusMessage(null)}>✕</button>
          </div>
        )}

        {/* 2 Columns: Order Details & Fulfillment Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Items & Customer Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* 1. Line Items Table */}
            <div className="bg-[#FAF9F5] border border-[#E2DFD6] p-5 rounded-sm space-y-4">
              <h3 className="font-serif text-base text-[#176B45] border-b border-[#E2DFD6] pb-2">
                Garment Items Snapshot
              </h3>

              <div className="divide-y divide-[#E2DFD6]/60">
                {order.items.map((item, i) => (
                  <div key={item.id || i} className="py-3 flex items-center justify-between gap-4 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-12 aspect-[3/4] relative bg-[#EEEAE0] border border-[#E2DFD6] rounded-sm overflow-hidden shrink-0">
                        <Image
                          src={item.image || "/images/products/product-1.jpg"}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      </div>
                      <div>
                        <p className="font-medium text-[#176B45]">{item.name}</p>
                        <p className="text-[10px] text-[#74786F] font-mono">{item.sku}</p>
                        <p className="text-[11px] text-[#252A25] mt-0.5">
                          Size: <span className="font-medium">{item.size}</span> | Colour:{" "}
                          <span className="font-medium">{item.colour || "Standard"}</span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-[#252A25]">
                        ₹{(((item.unitPrice ?? item.price ?? 0)) * item.quantity).toLocaleString("en-IN")}
                      </p>
                      <p className="text-[10px] text-[#74786F]">
                        {item.quantity} × ₹{((item.unitPrice ?? item.price ?? 0)).toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pricing Totals */}
              <div className="pt-3 border-t border-[#E2DFD6] space-y-1.5 text-xs text-[#74786F]">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-[#252A25]">₹{order.pricing.subtotal.toLocaleString("en-IN")}</span>
                </div>
                {order.pricing.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Promotional Discount</span>
                    <span>-₹{order.pricing.discountAmount.toLocaleString("en-IN")}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Pan-India Shipping</span>
                  <span className="text-[#252A25]">
                    {order.pricing.isFreeShipping ? "FREE" : `₹${order.pricing.shippingFee}`}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-[#E2DFD6] font-medium text-sm text-[#176B45]">
                  <span>Total Amount</span>
                  <span>₹{(order.pricing.totalAmount ?? order.pricing.total ?? 0).toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>

            {/* 2. Customer & Delivery Address */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-[#FAF9F5] border border-[#E2DFD6] p-5 rounded-sm">
                <h4 className="font-serif text-sm text-[#176B45] border-b border-[#E2DFD6] pb-2 mb-3">
                  Customer Profile
                </h4>
                <div className="text-xs space-y-1 text-[#252A25]">
                  <p className="font-medium">{order.customerInfo.fullName}</p>
                  <p className="text-[#74786F]">{order.customerInfo.email}</p>
                  <p className="text-[#74786F]">{order.customerInfo.phone}</p>
                  {order.userId && (
                    <span className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded-full bg-[#176B45]/10 text-[#176B45]">
                      Registered Patron Account
                    </span>
                  )}
                </div>
              </div>

              <div className="bg-[#FAF9F5] border border-[#E2DFD6] p-5 rounded-sm">
                <h4 className="font-serif text-sm text-[#176B45] border-b border-[#E2DFD6] pb-2 mb-3">
                  Delivery Destination
                </h4>
                <div className="text-xs space-y-1 text-[#74786F]">
                  <p className="font-medium text-[#252A25]">{order.shippingAddress.recipientName}</p>
                  <p>{order.shippingAddress.addressLine1}</p>
                  {order.shippingAddress.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
                  <p>
                    {order.shippingAddress.city}, {order.shippingAddress.state} –{" "}
                    <span className="font-mono">{order.shippingAddress.postalCode}</span>
                  </p>
                  <p>{order.shippingAddress.country || "India"}</p>
                </div>
              </div>
            </div>

            {/* 3. Payment Gateway Reference */}
            <div className="bg-[#FAF9F5] border border-[#E2DFD6] p-5 rounded-sm">
              <h4 className="font-serif text-sm text-[#176B45] border-b border-[#E2DFD6] pb-2 mb-3">
                Payment Verification
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-[10px] text-[#74786F] uppercase block">Gateway</span>
                  <span className="font-medium text-[#252A25]">Razorpay</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#74786F] uppercase block">Payment Status</span>
                  <StatusBadge status={order.paymentStatus} size="sm" />
                </div>
                <div className="truncate">
                  <span className="text-[10px] text-[#74786F] uppercase block">Order ID</span>
                  <span className="font-mono text-[11px] text-[#252A25] truncate">
                    {order.payment?.razorpayOrderId || "N/A"}
                  </span>
                </div>
                <div className="truncate">
                  <span className="text-[10px] text-[#74786F] uppercase block">Payment ID</span>
                  <span className="font-mono text-[11px] text-[#176B45] truncate">
                    {order.payment?.razorpayPaymentId || "N/A"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Fulfillment Workflow & Actions */}
          <div className="space-y-6">
            <div className="bg-[#FAF9F5] border border-[#E2DFD6] p-6 rounded-sm space-y-4">
              <h3 className="font-serif text-base text-[#176B45] border-b border-[#E2DFD6] pb-2">
                Fulfillment Controls
              </h3>

              <div>
                <label className="block text-[11px] uppercase tracking-luxury text-[#315039] font-medium mb-1">
                  Courier Carrier
                </label>
                <input
                  type="text"
                  value={courierName}
                  onChange={(e) => setCourierName(e.target.value)}
                  placeholder="e.g. Blue Dart Express"
                  className="w-full px-3 py-2 bg-white border border-[#E2DFD6] rounded-sm text-xs text-[#252A25] focus:outline-none focus:border-[#176B45]"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-luxury text-[#315039] font-medium mb-1">
                  Courier AWB / Tracking #
                </label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="e.g. BD887766554IN"
                  className="w-full px-3 py-2 bg-white border border-[#E2DFD6] rounded-sm text-xs text-[#252A25] font-mono focus:outline-none focus:border-[#176B45]"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-luxury text-[#315039] font-medium mb-1">
                  Internal Atelier Notes
                </label>
                <textarea
                  rows={2}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Notes for packing atelier or logistics team..."
                  className="w-full px-3 py-2 bg-white border border-[#E2DFD6] rounded-sm text-xs text-[#252A25] focus:outline-none focus:border-[#176B45]"
                />
              </div>

              {/* Action Buttons based on current status */}
              <div className="pt-4 border-t border-[#E2DFD6] space-y-2">
                <span className="text-[10px] uppercase tracking-luxury text-[#74786F] block">
                  Advance Fulfillment Stage
                </span>

                {order.status === "confirmed" && (
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() => handleUpdateStatus("processing")}
                    className="w-full py-2.5 bg-[#AA9160] text-white text-xs uppercase tracking-luxury font-medium hover:bg-[#8e784e] transition-colors rounded-sm"
                  >
                    Start Processing (Atelier Tailoring) →
                  </button>
                )}

                {(order.status === "processing" || order.status === "confirmed") && (
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() => handleUpdateStatus("dispatched")}
                    className="w-full py-2.5 bg-[#176B45] text-white text-xs uppercase tracking-luxury font-medium hover:bg-[#125837] transition-colors rounded-sm"
                  >
                    Mark Dispatched (Assign Courier) →
                  </button>
                )}

                {order.status === "dispatched" && (
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() => handleUpdateStatus("delivered")}
                    className="w-full py-2.5 bg-emerald-700 text-white text-xs uppercase tracking-luxury font-medium hover:bg-emerald-800 transition-colors rounded-sm"
                  >
                    Mark Delivered to Patron ✓
                  </button>
                )}

                {order.status !== "delivered" && order.status !== "cancelled" && (
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() => {
                      if (confirm("Are you sure you want to cancel this order?")) {
                        handleUpdateStatus("cancelled");
                      }
                    }}
                    className="w-full py-2 bg-[#FAF9F5] border border-rose-200 text-rose-700 text-xs uppercase tracking-luxury font-medium hover:bg-rose-50 transition-colors rounded-sm"
                  >
                    Cancel Order
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

