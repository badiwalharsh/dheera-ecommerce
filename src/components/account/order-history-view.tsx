"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/auth-context";
import { CustomerOrderSummary } from "@/types/account";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Package,
  Clock,
  CheckCircle,
  Truck,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";

export function OrderHistoryView() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<CustomerOrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const loadOrders = useCallback(async (pageNum: number) => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/account/orders?userId=${user.id}&page=${pageNum}&limit=5`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
        setPage(data.pagination?.page || 1);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalOrders(data.pagination?.totalOrders || 0);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadOrders(page);
  }, [loadOrders, page]);

  const filteredOrders = orders.filter((ord) => {
    if (statusFilter === "all") return true;
    if (statusFilter === "in_progress") {
      return ["confirmed", "processing", "dispatched", "in_transit", "out_for_delivery"].includes(
        ord.status
      );
    }
    if (statusFilter === "delivered") return ord.status === "delivered";
    if (statusFilter === "pending") return ["pending", "pending_payment"].includes(ord.status);
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-100 text-emerald-800">
            <CheckCircle className="w-3 h-3" /> Confirmed
          </span>
        );
      case "processing":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-100 text-amber-800">
            <Clock className="w-3 h-3" /> Crafting in Atelier
          </span>
        );
      case "dispatched":
      case "in_transit":
      case "out_for_delivery":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-100 text-blue-800">
            <Truck className="w-3 h-3" /> In Transit
          </span>
        );
      case "delivered":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-teal-100 text-teal-800">
            <CheckCircle className="w-3 h-3" /> Delivered
          </span>
        );
      case "pending_payment":
      case "pending":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3" /> Pending Payment
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#FAF9F5] border border-[#E2DFD6] p-6 rounded-sm">
        <div>
          <h3 className="text-lg font-serif text-[#176B45]">Order History</h3>
          <p className="text-xs text-[#555E55]">
            Total {totalOrders} order{totalOrders === 1 ? "" : "s"} placed with DHEERA.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 bg-[#EEEAE0]/70 p-1 rounded-sm text-xs">
          {[
            { id: "all", label: "All" },
            { id: "in_progress", label: "In Progress" },
            { id: "delivered", label: "Delivered" },
            { id: "pending", label: "Pending" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-sm transition-colors text-[11px] font-medium ${
                statusFilter === tab.id
                  ? "bg-[#176B45] text-white shadow-sm"
                  : "text-[#555E55] hover:text-[#252A25]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="py-16 text-center text-xs text-[#8C9388] animate-pulse">
          Loading order history...
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-[#FAF9F5] border border-[#E2DFD6] rounded-sm p-12 text-center space-y-3">
          <Package className="w-10 h-10 text-[#8C9388] mx-auto stroke-[1.2]" />
          <h4 className="font-serif text-base text-[#252A25]">No Orders Found</h4>
          <p className="text-xs text-[#555E55] max-w-sm mx-auto">
            {statusFilter === "all"
              ? "You haven't placed an order yet. Begin your luxury wardrobe with our artisanal designs."
              : `No orders matching filter "${statusFilter}".`}
          </p>
          <div className="pt-2">
            <Link
              href="/shop"
              className="inline-flex items-center justify-center px-6 py-2.5 bg-[#176B45] text-white text-xs uppercase tracking-wide hover:bg-[#315039] transition-colors rounded-sm"
            >
              Discover Collection
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((ord) => (
            <div
              key={ord.id}
              className="bg-[#FAF9F5] border border-[#E2DFD6] rounded-sm p-6 space-y-5 hover:border-[#176B45]/40 transition-colors"
            >
              {/* Top Bar: Order Info & Status */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#E2DFD6]">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-[#176B45]">
                      {ord.orderNumber}
                    </span>
                    <span className="text-[#8C9388]">•</span>
                    <span className="text-xs text-[#555E55]">
                      {new Date(ord.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#8C9388]">
                    {ord.itemCount} item{ord.itemCount === 1 ? "" : "s"}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {getStatusBadge(ord.status)}
                  <span className="font-serif text-base font-semibold text-[#176B45]">
                    {formatCurrency(ord.totalAmount)}
                  </span>
                </div>
              </div>

              {/* Items Breakdown */}
              <div className="divide-y divide-[#E2DFD6]/50">
                {ord.itemsPreview.map((item) => (
                  <div key={item.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="relative w-14 h-16 sm:w-16 sm:h-20 bg-[#EEEAE0] border border-[#E2DFD6] rounded-sm overflow-hidden flex-shrink-0">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      </div>
                      <div className="text-xs space-y-0.5">
                        <p className="font-medium text-[#252A25]">{item.name}</p>
                        <p className="text-[11px] text-[#8C9388]">
                          Size: {item.size} • Colour: {item.colour} • Qty: {item.quantity}
                        </p>
                        <p className="text-[11px] font-mono text-[#555E55]">
                          SKU: {item.sku}
                        </p>
                      </div>
                    </div>

                    <div className="text-right text-xs">
                      <p className="font-medium text-[#252A25]">{formatCurrency(item.totalPrice)}</p>
                      <p className="text-[10px] text-[#8C9388]">
                        {formatCurrency(item.unitPrice)} each
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-[#E2DFD6] flex flex-wrap items-center justify-between gap-3">
                <span className="text-[11px] text-[#8C9388]">
                  {ord.paymentStatus === "captured" ? "Paid via Razorpay Secure" : "Payment Pending"}
                </span>

                <div className="flex items-center gap-3">
                  <Link
                    href={`/account/orders/${ord.orderNumber}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#176B45] hover:bg-[#315039] text-white text-xs font-medium rounded-sm transition-colors"
                  >
                    Track Order & Timeline <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="h-9 px-3 text-xs"
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Previous
              </Button>
              <span className="text-xs text-[#555E55] px-3">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="h-9 px-3 text-xs"
              >
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
