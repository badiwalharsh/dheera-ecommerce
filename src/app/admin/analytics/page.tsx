"use client";

import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/admin-layout";
import { MetricCard } from "@/components/admin/metric-card";
import { SalesChart } from "@/components/admin/sales-chart";

interface AnalyticsState {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  salesPerformance: Array<{ date: string; label: string; revenue: number; orders: number }>;
  bestSellingProducts: Array<{ name: string; category: string; unitsSold: number; revenue: number }>;
  categoryPerformance: Array<{ category: string; revenue: number; unitsSold: number }>;
  customerRetention: {
    newCustomers: number;
    returningCustomers: number;
    repeatRate: number;
  };
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsState | null>(null);
  const [timeframe, setTimeframe] = useState<"today" | "7d" | "30d" | "90d" | "all">("30d");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/admin/analytics?timeframe=${timeframe}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.analytics) {
            setData(json.analytics);
          }
        }
      } catch {
        // Error
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [timeframe]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E2DFD6] gap-4">
          <div>
            <span className="text-[10px] uppercase tracking-luxury text-[#AA9160] font-semibold block">
              BUSINESS INTELLIGENCE
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl text-[#176B45]">
              Sales & Growth Analytics
            </h1>
            <p className="text-xs text-[#74786F] mt-0.5">
              Empirical store turnover, category performance distribution, and customer cohort retention.
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

        {/* 1. Core Revenue & Order Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <MetricCard
            title="Total Period Revenue"
            value={`₹${(data?.totalRevenue || 0).toLocaleString("en-IN")}`}
            subtitle="Derived from completed orders"
            highlight
          />
          <MetricCard
            title="Orders Completed"
            value={data?.totalOrders || 0}
            subtitle="Captured & verified transactions"
          />
          <MetricCard
            title="Average Order Value (AOV)"
            value={`₹${(data?.averageOrderValue || 0).toLocaleString("en-IN")}`}
            subtitle="Net revenue divided by transactions"
          />
        </div>

        {/* 2. Revenue Over Time Chart */}
        <SalesChart
          data={data?.salesPerformance || []}
          title="Revenue & Daily Order Velocity"
          subtitle={`Aggregated daily metrics for ${timeframe}`}
        />

        {/* 3. Category Breakdown & Cohort Retention */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category Performance Breakdown */}
          <div className="bg-[#FAF9F5] border border-[#E2DFD6] p-6 rounded-sm space-y-4">
            <div className="border-b border-[#E2DFD6] pb-3">
              <h3 className="font-serif text-base text-[#176B45]">Category Performance</h3>
              <p className="text-xs text-[#74786F]">Turnover distribution across apparel lines</p>
            </div>

            <div className="space-y-3">
              {data?.categoryPerformance && data.categoryPerformance.length > 0 ? (
                data.categoryPerformance.map((c, i) => {
                  const maxCatRev = Math.max(...data.categoryPerformance.map((item) => item.revenue), 1);
                  const percentage = Math.round((c.revenue / maxCatRev) * 100);

                  return (
                    <div key={i} className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium text-[#252A25]">{c.category}</span>
                        <span className="font-medium text-[#176B45]">
                          ₹{c.revenue.toLocaleString("en-IN")} ({c.unitsSold} units)
                        </span>
                      </div>
                      <div className="w-full bg-[#EEEAE0] h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-[#176B45] h-full rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-center py-8 text-xs text-[#74786F]">
                  No category sales recorded for this period.
                </p>
              )}
            </div>
          </div>

          {/* New vs. Returning Patrons */}
          <div className="bg-[#FAF9F5] border border-[#E2DFD6] p-6 rounded-sm space-y-4 flex flex-col justify-between">
            <div>
              <div className="border-b border-[#E2DFD6] pb-3 mb-4">
                <h3 className="font-serif text-base text-[#176B45]">Patron Retention & Loyalty</h3>
                <p className="text-xs text-[#74786F]">Repeat customer conversion analysis</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-center my-4">
                <div className="p-4 bg-white border border-[#E2DFD6] rounded-sm">
                  <span className="text-[10px] text-[#74786F] uppercase block">First-Time Patrons</span>
                  <span className="font-serif text-2xl text-[#176B45] font-semibold mt-1 block">
                    {data?.customerRetention.newCustomers || 0}
                  </span>
                </div>

                <div className="p-4 bg-white border border-[#E2DFD6] rounded-sm">
                  <span className="text-[10px] text-[#74786F] uppercase block">Returning Patrons</span>
                  <span className="font-serif text-2xl text-[#AA9160] font-semibold mt-1 block">
                    {data?.customerRetention.returningCustomers || 0}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-[#EAF5EF] border border-[#176B45]/20 rounded-sm flex items-center justify-between text-xs">
              <div>
                <span className="font-medium text-[#176B45] block">Repeat Patron Rate</span>
                <span className="text-[11px] text-[#74786F]">Ratio of clients ordering more than once</span>
              </div>
              <span className="font-serif text-xl font-bold text-[#176B45]">
                {data?.customerRetention.repeatRate || 0}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

