"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/auth-context";
import { CustomerOrderSummary, CustomerAddress } from "@/types/account";
import { formatCurrency } from "@/lib/utils";
import {
  Package,
  MapPin,
  Heart,
  Settings,
  ArrowRight,
  Clock,
  CheckCircle,
  Truck,
  Sparkles,
} from "lucide-react";

export function DashboardOverview() {
  const { user } = useAuth();
  const [recentOrders, setRecentOrders] = useState<CustomerOrderSummary[]>([]);
  const [defaultAddress, setDefaultAddress] = useState<CustomerAddress | null>(null);
  const [wishlistCount, setWishlistCount] = useState<number>(0);
  const [totalOrdersCount, setTotalOrdersCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function loadDashboardData() {
      setLoading(true);
      try {
        // 1. Fetch orders
        const ordersRes = await fetch(`/api/account/orders?userId=${user?.id}&limit=3`);
        if (ordersRes.ok) {
          const data = await ordersRes.json();
          setRecentOrders(data.orders || []);
          setTotalOrdersCount(data.pagination?.totalOrders || 0);
        }

        // 2. Fetch addresses
        const addrRes = await fetch(`/api/account/addresses?userId=${user?.id}`);
        if (addrRes.ok) {
          const addrs: CustomerAddress[] = await addrRes.json();
          const def = addrs.find((a) => a.isDefault) || addrs[0] || null;
          setDefaultAddress(def);
        }

        // 3. Fetch wishlist count
        const wishRes = await fetch(`/api/account/wishlist?userId=${user?.id}`);
        if (wishRes.ok) {
          const items = await wishRes.json();
          setWishlistCount(Array.isArray(items) ? items.length : 0);
        }
      } catch {
        // Fallback
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [user]);

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
            <Clock className="w-3 h-3" /> Crafting
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
    <div className="space-y-8">
      {/* 4 Quick Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Link
          href="/account/orders"
          className="bg-[#FAF9F5] border border-[#E2DFD6] p-4 sm:p-5 rounded-sm hover:border-[#176B45] transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <Package className="w-5 h-5 text-[#176B45]" />
            <span className="text-xl sm:text-2xl font-serif font-semibold text-[#176B45]">
              {totalOrdersCount}
            </span>
          </div>
          <p className="text-xs font-medium text-[#252A25] group-hover:text-[#176B45]">
            My Orders
          </p>
          <span className="text-[10px] text-[#8C9388] flex items-center gap-1 mt-1">
            Track shipments <ArrowRight className="w-2.5 h-2.5" />
          </span>
        </Link>

        <Link
          href="/account/wishlist"
          className="bg-[#FAF9F5] border border-[#E2DFD6] p-4 sm:p-5 rounded-sm hover:border-[#176B45] transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <Heart className="w-5 h-5 text-[#176B45]" />
            <span className="text-xl sm:text-2xl font-serif font-semibold text-[#176B45]">
              {wishlistCount}
            </span>
          </div>
          <p className="text-xs font-medium text-[#252A25] group-hover:text-[#176B45]">
            Wishlist
          </p>
          <span className="text-[10px] text-[#8C9388] flex items-center gap-1 mt-1">
            Saved couture <ArrowRight className="w-2.5 h-2.5" />
          </span>
        </Link>

        <Link
          href="/account/addresses"
          className="bg-[#FAF9F5] border border-[#E2DFD6] p-4 sm:p-5 rounded-sm hover:border-[#176B45] transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <MapPin className="w-5 h-5 text-[#176B45]" />
            <span className="text-xs font-serif text-[#176B45] font-semibold">
              {defaultAddress ? "Active" : "Add"}
            </span>
          </div>
          <p className="text-xs font-medium text-[#252A25] group-hover:text-[#176B45]">
            Address Book
          </p>
          <span className="text-[10px] text-[#8C9388] flex items-center gap-1 mt-1">
            Express checkout <ArrowRight className="w-2.5 h-2.5" />
          </span>
        </Link>

        <Link
          href="/account/profile"
          className="bg-[#FAF9F5] border border-[#E2DFD6] p-4 sm:p-5 rounded-sm hover:border-[#176B45] transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <Settings className="w-5 h-5 text-[#176B45]" />
            <Sparkles className="w-4 h-4 text-[#AA9160]" />
          </div>
          <p className="text-xs font-medium text-[#252A25] group-hover:text-[#176B45]">
            Profile Settings
          </p>
          <span className="text-[10px] text-[#8C9388] flex items-center gap-1 mt-1">
            Update credentials <ArrowRight className="w-2.5 h-2.5" />
          </span>
        </Link>
      </div>

      {/* Recent Orders Section */}
      <div className="bg-[#FAF9F5] border border-[#E2DFD6] rounded-sm p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#E2DFD6]">
          <div>
            <h3 className="text-lg font-serif text-[#176B45]">Recent Atelier Orders</h3>
            <p className="text-xs text-[#555E55]">
              Real-time crafting progression and courier tracking.
            </p>
          </div>
          {recentOrders.length > 0 && (
            <Link
              href="/account/orders"
              className="text-xs font-medium text-[#176B45] hover:text-[#AA9160] transition-colors flex items-center gap-1"
            >
              View All Orders <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-[#8C9388] animate-pulse">
            Retrieving recent orders...
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <Package className="w-10 h-10 text-[#8C9388] mx-auto stroke-[1.2]" />
            <h4 className="font-serif text-base text-[#252A25]">No Orders Placed Yet</h4>
            <p className="text-xs text-[#555E55] max-w-sm mx-auto">
              You haven&apos;t placed an order yet. Discover our handcrafted kurta sets, silk sarees, and contemporary ensembles.
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
          <div className="divide-y divide-[#E2DFD6]/70">
            {recentOrders.map((ord) => (
              <div key={ord.id} className="py-5 first:pt-0 last:pb-0 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-[#8C9388] font-mono">
                      {ord.orderNumber}
                    </span>
                    <p className="text-xs text-[#555E55]">
                      Placed on{" "}
                      {new Date(ord.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(ord.status)}
                    <span className="font-serif text-sm font-semibold text-[#176B45]">
                      {formatCurrency(ord.totalAmount)}
                    </span>
                  </div>
                </div>

                {/* Items Thumbnails */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 overflow-x-auto py-1">
                    {ord.itemsPreview.slice(0, 4).map((item) => (
                      <div
                        key={item.id}
                        className="relative w-14 aspect-[3/4] sm:w-16 bg-[#EEEAE0] border border-[#E2DFD6] rounded-sm overflow-hidden flex-shrink-0"
                      >
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                        <span className="absolute bottom-0 right-0 bg-[#176B45] text-white text-[9px] px-1 font-bold">
                          ×{item.quantity}
                        </span>
                      </div>
                    ))}
                    {ord.itemsPreview.length > 4 && (
                      <span className="text-[11px] text-[#8C9388] font-medium">
                        +{ord.itemsPreview.length - 4} more
                      </span>
                    )}
                  </div>

                  <Link
                    href={`/account/orders/${ord.orderNumber}`}
                    className="inline-flex items-center justify-center px-4 py-2 border border-[#176B45] text-[#176B45] hover:bg-[#176B45] hover:text-white text-xs font-medium rounded-sm transition-colors whitespace-nowrap"
                  >
                    Track Order & Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Address Book Card */}
      <div className="bg-[#FAF9F5] border border-[#E2DFD6] rounded-sm p-6 sm:p-8">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#E2DFD6]">
          <div>
            <h3 className="text-lg font-serif text-[#176B45]">Default Delivery Address</h3>
            <p className="text-xs text-[#555E55]">
              Pre-filled at checkout for frictionless placement.
            </p>
          </div>
          <Link
            href="/account/addresses"
            className="text-xs font-medium text-[#176B45] hover:text-[#AA9160] transition-colors flex items-center gap-1"
          >
            Manage Addresses <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {defaultAddress ? (
          <div className="text-xs text-[#252A25] space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">{defaultAddress.recipientName}</span>
              <span className="px-2 py-0.5 uppercase tracking-wider text-[9px] font-bold bg-[#176B45]/10 text-[#176B45] rounded-full">
                {defaultAddress.addressType}
              </span>
            </div>
            <p className="text-[#555E55]">{defaultAddress.addressLine1}</p>
            {defaultAddress.addressLine2 && (
              <p className="text-[#555E55]">{defaultAddress.addressLine2}</p>
            )}
            <p className="text-[#555E55]">
              {defaultAddress.city}, {defaultAddress.state} – {defaultAddress.postalCode}
            </p>
            <p className="text-[#555E55] pt-1">Phone: +91 {defaultAddress.phone}</p>
          </div>
        ) : (
          <div className="text-xs text-[#555E55] py-2">
            No default delivery address configured.{" "}
            <Link href="/account/addresses" className="text-[#176B45] underline font-medium">
              Add your delivery address
            </Link>{" "}
            for instant 1-click checkout.
          </div>
        )}
      </div>
    </div>
  );
}
