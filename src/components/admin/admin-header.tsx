"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAdmin } from "@/context/admin-context";

interface AdminHeaderProps {
  onOpenMobileNav: () => void;
}

export function AdminHeader({ onOpenMobileNav }: AdminHeaderProps) {
  const pathname = usePathname();
  const { admin, logout } = useAdmin();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Generate dynamic breadcrumbs
  const pathSegments = pathname.split("/").filter(Boolean);
  const breadcrumbItems = pathSegments.map((segment, index) => {
    const href = "/" + pathSegments.slice(0, index + 1).join("/");
    const label = segment
      .replace(/-/g, " ")
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
    return { href, label, isLast: index === pathSegments.length - 1 };
  });

  return (
    <header className="sticky top-0 z-40 bg-[#FAF9F5] border-b border-[#E2DFD6] px-4 sm:px-6 py-3 flex items-center justify-between">
      {/* Left: Mobile Toggle & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileNav}
          className="lg:hidden p-2 text-[#315039] hover:bg-[#EEEAE0] rounded-sm"
          aria-label="Open navigation menu"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <nav className="flex items-center space-x-1.5 text-xs text-[#74786F]">
          <Link href="/admin" className="hover:text-[#176B45]">
            Admin
          </Link>
          {breadcrumbItems.slice(1).map((b, i) => (
            <React.Fragment key={b.href}>
              <span className="text-[#AA9160]">/</span>
              {b.isLast ? (
                <span className="text-[#176B45] font-medium">{b.label}</span>
              ) : (
                <Link href={b.href} className="hover:text-[#176B45]">
                  {b.label}
                </Link>
              )}
            </React.Fragment>
          ))}
        </nav>
      </div>

      {/* Right: Quick Actions, Notifications & Profile */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Quick Add Product Button */}
        <Link
          href="/admin/products/new"
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-[#176B45] text-white text-[11px] uppercase tracking-luxury hover:bg-[#125837] transition-colors"
        >
          <span>+</span>
          <span>Add Product</span>
        </Link>

        {/* Storefront Link */}
        <Link
          href="/"
          target="_blank"
          className="hidden md:inline-flex items-center gap-1 text-xs text-[#315039] hover:text-[#176B45] font-medium px-2 py-1 rounded-sm hover:bg-[#EEEAE0]"
        >
          <span>Storefront</span>
          <span className="text-[10px]">↗</span>
        </Link>

        {/* Notifications Icon */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}
            className="p-2 text-[#315039] hover:bg-[#EEEAE0] rounded-full relative"
            aria-label="Notifications"
          >
            <span className="text-sm">🔔</span>
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#AA9160]" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-72 bg-[#FAF9F5] border border-[#E2DFD6] shadow-lg rounded-sm p-4 z-50 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-[#E2DFD6] mb-2">
                <span className="font-serif font-medium text-[#176B45]">Notifications</span>
                <span className="text-[10px] text-[#AA9160] uppercase">2 Active</span>
              </div>
              <div className="space-y-2">
                <div className="p-2 bg-[#EAF5EF] border border-[#176B45]/20 rounded-sm">
                  <p className="font-medium text-[#176B45]">Order Placed</p>
                  <p className="text-[11px] text-[#74786F]">New order #DHR-20261031-4004 requires processing.</p>
                </div>
                <div className="p-2 bg-[#F7F4EB] border border-[#AA9160]/30 rounded-sm">
                  <p className="font-medium text-[#AA9160]">Bespoke Atelier Request</p>
                  <p className="text-[11px] text-[#74786F]">New custom outfit enquiry #ATELIER-2026-103 submitted.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Profile Avatar / Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2 p-1 pl-2 rounded-sm hover:bg-[#EEEAE0] transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-[#176B45] text-white flex items-center justify-center font-serif text-xs font-semibold">
              {admin?.name?.charAt(0) || "D"}
            </div>
            <span className="hidden sm:inline text-xs font-medium text-[#252A25]">
              {admin?.name || "Admin"}
            </span>
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-[#FAF9F5] border border-[#E2DFD6] shadow-lg rounded-sm py-2 z-50 text-xs">
              <div className="px-4 py-2 border-b border-[#E2DFD6]">
                <p className="font-medium text-[#176B45] truncate">{admin?.name}</p>
                <p className="text-[10px] text-[#74786F] truncate">{admin?.email}</p>
                <span className="inline-block mt-1 text-[9px] uppercase px-2 py-0.5 rounded-full bg-[#176B45]/10 text-[#176B45] font-medium">
                  {admin?.adminRole === "super_admin" ? "Super Administrator" : "Store Manager"}
                </span>
              </div>
              <Link
                href="/admin/settings"
                onClick={() => setShowProfileMenu(false)}
                className="block px-4 py-2 text-[#315039] hover:bg-[#EEEAE0]"
              >
                Store Settings
              </Link>
              <Link
                href="/admin/analytics"
                onClick={() => setShowProfileMenu(false)}
                className="block px-4 py-2 text-[#315039] hover:bg-[#EEEAE0]"
              >
                Analytics & Reports
              </Link>
              <div className="border-t border-[#E2DFD6] my-1" />
              <button
                onClick={logout}
                className="w-full text-left px-4 py-2 text-rose-700 hover:bg-rose-50"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

