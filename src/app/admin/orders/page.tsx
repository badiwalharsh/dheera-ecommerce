"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { AdminLayout } from "@/components/admin/admin-layout";
import { StatusBadge } from "@/components/admin/status-badge";
import { ConfirmedOrderDetails } from "@/types/cart";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<ConfirmedOrderDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      let url = "/api/admin/orders";
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (search) params.append("search", search);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch {
      // Error
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const totalValue = orders.reduce((sum, o) => sum + (o.pricing.total || 0), 0);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E2DFD6] gap-4">
          <div>
            <span className="text-[10px] uppercase tracking-luxury text-[#AA9160] font-semibold block">
              FULFILLMENT & LOGISTICS
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl text-[#176B45]">
              Orders & Dispatch Queue
            </h1>
            <p className="text-xs text-[#74786F] mt-0.5">
              Authoritative order tracking, payment records, courier assignations, and customer deliveries.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#FAF9F5] border border-[#E2DFD6] rounded-sm text-center">
              <span className="text-[9px] uppercase tracking-luxury text-[#74786F] block">Filtered Orders</span>
              <span className="font-serif text-lg text-[#176B45] font-semibold">{orders.length}</span>
            </div>
            <div className="p-2.5 bg-[#EAF5EF] border border-[#176B45]/20 rounded-sm text-center">
              <span className="text-[9px] uppercase tracking-luxury text-[#176B45] block">Order Volume</span>
              <span className="font-serif text-lg text-[#176B45] font-semibold">
                ₹{totalValue.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="bg-[#FAF9F5] border border-[#E2DFD6] p-4 rounded-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
          <div className="flex-1 max-w-sm">
            <input
              type="text"
              placeholder="Search by Order #, customer name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#E2DFD6] rounded-sm text-xs text-[#252A25] focus:outline-none focus:border-[#176B45]"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto">
            <span className="text-[11px] uppercase tracking-luxury text-[#74786F] shrink-0">Stage:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-[#E2DFD6] rounded-sm text-xs text-[#252A25] focus:outline-none focus:border-[#176B45]"
            >
              <option value="all">All Stages</option>
              <option value="pending_payment">Pending Payment</option>
              <option value="confirmed">Confirmed (Paid)</option>
              <option value="processing">In Tailoring / Processing</option>
              <option value="dispatched">Dispatched</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-[#FAF9F5] border border-[#E2DFD6] rounded-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#EEEAE0]/70 border-b border-[#E2DFD6] text-[10px] uppercase tracking-luxury text-[#74786F]">
                <tr>
                  <th className="py-3 px-4">Order #</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Items</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Total</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4">Fulfillment</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2DFD6]/60">
                {orders.length > 0 ? (
                  orders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-white/80 transition-colors">
                      <td className="py-3 px-4 font-medium text-[#176B45]">
                        <Link href={`/admin/orders/${ord.orderNumber}`} className="hover:underline">
                          {ord.orderNumber}
                        </Link>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-medium text-[#252A25]">{ord.customerInfo.fullName}</p>
                        <p className="text-[10px] text-[#74786F]">{ord.customerInfo.email}</p>
                      </td>
                      <td className="py-3 px-4 text-[#74786F]">
                        <span className="font-medium text-[#252A25]">{ord.items.length} garment(s)</span>
                        <p className="text-[10px] truncate max-w-[160px]">
                          {ord.items.map((i) => i.name).join(", ")}
                        </p>
                      </td>
                      <td className="py-3 px-4 text-[#74786F] whitespace-nowrap">
                        {new Date(ord.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-3 px-4 font-semibold text-[#252A25]">
                        ₹{(ord.pricing.total || 0).toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={ord.paymentStatus} size="sm" />
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={ord.status} size="sm" />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/admin/orders/${ord.orderNumber}`}
                          className="px-3 py-1.5 bg-[#EEEAE0] hover:bg-[#176B45] hover:text-white rounded-sm text-[11px] text-[#315039] font-medium transition-colors"
                        >
                          View Order →
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-[#74786F]">
                      {isLoading ? "Loading orders queue..." : "No orders found matching filters."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

