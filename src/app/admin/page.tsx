"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AdminLayout } from "@/components/admin/admin-layout";
import { MetricCard } from "@/components/admin/metric-card";
import { SalesChart } from "@/components/admin/sales-chart";
import { StatusBadge } from "@/components/admin/status-badge";
import { AdminDashboardStats } from "@/types/admin";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [timeframe, setTimeframe] = useState<"today" | "7d" | "30d" | "90d" | "all">("30d");
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = async (tf: typeof timeframe) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/dashboard?timeframe=${tf}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.stats) {
          setStats(data.stats);
        }
      }
    } catch {
      // Handle error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats(timeframe);
  }, [timeframe]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header & Filter Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E2DFD6] gap-4">
          <div>
            <span className="text-[10px] uppercase tracking-luxury text-[#AA9160] font-semibold block">
              OVERVIEW
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl text-[#176B45]">
              Business Performance
            </h1>
            <p className="text-xs text-[#74786F] mt-0.5">
              Live statistics and sales telemetry derived from verified store records.
            </p>
          </div>

          {/* Timeframe Filter Buttons */}
          <div className="flex items-center gap-1 p-1 bg-[#FAF9F5] border border-[#E2DFD6] rounded-sm self-start sm:self-auto overflow-x-auto">
            {(
              [
                { id: "today", label: "Today" },
                { id: "7d", label: "7 Days" },
                { id: "30d", label: "30 Days" },
                { id: "90d", label: "90 Days" },
                { id: "all", label: "All Time" },
              ] as const
            ).map((btn) => (
              <button
                key={btn.id}
                onClick={() => setTimeframe(btn.id)}
                className={`px-3 py-1.5 text-xs rounded-sm transition-colors uppercase tracking-wider ${
                  timeframe === btn.id
                    ? "bg-[#176B45] text-white font-medium"
                    : "text-[#74786F] hover:text-[#176B45]"
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* 1. Core Metric Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            title="Total Revenue"
            value={`₹${(stats?.totalRevenue || 0).toLocaleString("en-IN")}`}
            subtitle={`${stats?.completedOrders || 0} completed transactions`}
            highlight
            icon={<span>₹</span>}
          />
          <MetricCard
            title="Total Orders"
            value={stats?.totalOrders || 0}
            subtitle={`${stats?.pendingOrders || 0} pending fulfillment`}
            icon={<span>📜</span>}
          />
          <MetricCard
            title="Active Garments"
            value={stats?.totalProducts || 0}
            subtitle={`${stats?.lowStockProducts || 0} low stock, ${stats?.outOfStockProducts || 0} sold out`}
            icon={<span>👗</span>}
          />
          <MetricCard
            title="Registered Patrons"
            value={stats?.totalCustomers || 0}
            subtitle={`Average spend: ₹${(stats?.averageOrderValue || 0).toLocaleString("en-IN")}`}
            icon={<span>👥</span>}
          />
        </div>

        {/* 2. Sales Performance Chart & Best Sellers */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <SalesChart
              data={stats?.salesPerformance || []}
              title="Revenue Trajectory"
              subtitle={`Recorded turnover for ${
                timeframe === "today"
                  ? "today"
                  : timeframe === "7d"
                  ? "the last 7 days"
                  : "the past 30 days"
              }`}
            />
          </div>

          {/* Best Selling Products */}
          <div className="bg-[#FAF9F5] border border-[#E2DFD6] p-5 rounded-sm flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2DFD6] mb-4">
              <div>
                <h3 className="font-serif text-base text-[#176B45]">Best Sellers</h3>
                <p className="text-[11px] text-[#74786F]">Ranked by units ordered</p>
              </div>
              <Link
                href="/admin/products"
                className="text-[11px] text-[#AA9160] hover:text-[#176B45] font-medium uppercase tracking-wider"
              >
                Catalogue →
              </Link>
            </div>

            <div className="flex-1 space-y-3">
              {stats?.bestSellingProducts && stats.bestSellingProducts.length > 0 ? (
                stats.bestSellingProducts.map((p, idx) => (
                  <div
                    key={p.productId || idx}
                    className="flex items-center justify-between p-2.5 bg-white border border-[#E2DFD6] rounded-sm text-xs hover:border-[#176B45]/40 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span className="w-5 h-5 rounded-full bg-[#EEEAE0] text-[#176B45] flex items-center justify-center font-medium text-[10px] shrink-0">
                        {idx + 1}
                      </span>
                      <div className="truncate">
                        <p className="font-medium text-[#252A25] truncate">{p.name}</p>
                        <p className="text-[10px] text-[#74786F]">{p.category}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 pl-2">
                      <span className="font-medium text-[#176B45] block">
                        ₹{p.revenue.toLocaleString("en-IN")}
                      </span>
                      <span className="text-[10px] text-[#74786F]">
                        {p.unitsSold} sold
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-[#74786F] text-xs">
                  No sales recorded yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 3. Recent Orders & Recent Patrons */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Orders Table */}
          <div className="lg:col-span-2 bg-[#FAF9F5] border border-[#E2DFD6] p-5 rounded-sm">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2DFD6] mb-4">
              <div>
                <h3 className="font-serif text-base text-[#176B45]">Recent Orders</h3>
                <p className="text-[11px] text-[#74786F]">Latest customer purchases awaiting fulfillment</p>
              </div>
              <Link
                href="/admin/orders"
                className="text-[11px] text-[#AA9160] hover:text-[#176B45] font-medium uppercase tracking-wider"
              >
                All Orders →
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E2DFD6] text-[10px] uppercase tracking-luxury text-[#74786F]">
                    <th className="pb-2">Order #</th>
                    <th className="pb-2">Customer</th>
                    <th className="pb-2">Date</th>
                    <th className="pb-2">Total</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2DFD6]/60">
                  {stats?.recentOrders && stats.recentOrders.length > 0 ? (
                    stats.recentOrders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-white/60 transition-colors">
                        <td className="py-2.5 font-medium text-[#176B45]">
                          <Link href={`/admin/orders/${ord.orderNumber}`} className="hover:underline">
                            {ord.orderNumber}
                          </Link>
                        </td>
                        <td className="py-2.5 text-[#252A25]">
                          {ord.customerInfo.fullName}
                        </td>
                        <td className="py-2.5 text-[#74786F]">
                          {new Date(ord.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                          })}
                        </td>
                        <td className="py-2.5 font-medium text-[#252A25]">
                          ₹{(ord.pricing.total || 0).toLocaleString("en-IN")}
                        </td>
                        <td className="py-2.5">
                          <StatusBadge status={ord.status} size="sm" />
                        </td>
                        <td className="py-2.5 text-right">
                          <Link
                            href={`/admin/orders/${ord.orderNumber}`}
                            className="text-[#176B45] hover:underline text-[11px]"
                          >
                            Manage →
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center py-6 text-[#74786F]">
                        No recent orders.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Registrations */}
          <div className="bg-[#FAF9F5] border border-[#E2DFD6] p-5 rounded-sm">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2DFD6] mb-4">
              <div>
                <h3 className="font-serif text-base text-[#176B45]">Recent Patrons</h3>
                <p className="text-[11px] text-[#74786F]">New customer accounts</p>
              </div>
              <Link
                href="/admin/customers"
                className="text-[11px] text-[#AA9160] hover:text-[#176B45] font-medium uppercase tracking-wider"
              >
                All Patrons →
              </Link>
            </div>

            <div className="space-y-3">
              {stats?.recentCustomers && stats.recentCustomers.length > 0 ? (
                stats.recentCustomers.map((cust) => (
                  <div
                    key={cust.id}
                    className="p-3 bg-white border border-[#E2DFD6] rounded-sm flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-medium text-[#176B45]">{cust.fullName}</p>
                      <p className="text-[11px] text-[#74786F]">{cust.email}</p>
                    </div>
                    <span className="text-[10px] text-[#AA9160]">
                      {new Date(cust.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-[#74786F] text-xs">
                  No registered patrons yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
