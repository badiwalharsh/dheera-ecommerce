"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAdmin } from "@/context/admin-context";
import { BrandLogo } from "@/components/ui/brand-logo";

interface NavItem {
  label: string;
  href: string;
  icon: string;
  exact?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: "✦", exact: true },
  { label: "Products", href: "/admin/products", icon: "👗" },
  { label: "Categories", href: "/admin/categories", icon: "📁" },
  { label: "Inventory", href: "/admin/inventory", icon: "📦" },
  { label: "Orders", href: "/admin/orders", icon: "📜" },
  { label: "Customers", href: "/admin/customers", icon: "👥" },
  { label: "Atelier Custom", href: "/admin/customizations", icon: "✂️" },
  { label: "Coupons", href: "/admin/coupons", icon: "🏷️" },
  { label: "Content CMS", href: "/admin/content", icon: "📝" },
  { label: "Analytics", href: "/admin/analytics", icon: "📊" },
  { label: "Store Settings", href: "/admin/settings", icon: "⚙️" },
];

interface AdminSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function AdminSidebar({ isOpen = false, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const { admin, logout } = useAdmin();

  const isActive = (item: NavItem) => {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  };

  const content = (
    <div className="flex flex-col h-full bg-[#315039] text-[#EEEAE0] border-r border-[#176B45]/40 select-none">
      {/* Brand & Atelier Badge */}
      <div className="p-6 border-b border-[#176B45]/40">
        <div className="flex items-center justify-between">
          <Link href="/admin" className="block">
            <h1 className="font-serif text-2xl tracking-widest text-[#FAF9F5] font-semibold">
              DHEERA
            </h1>
            <p className="text-[9px] uppercase tracking-luxury text-[#AA9160] mt-0.5 font-medium">
              Atelier Business Management
            </p>
          </Link>
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden text-[#FAF9F5]/70 hover:text-white text-lg p-1"
              aria-label="Close menu"
            >
              ✕
            </button>
          )}
        </div>

        {/* Current Admin Badge */}
        {admin && (
          <div className="mt-4 pt-3 border-t border-[#176B45]/30 flex items-center justify-between">
            <div>
              <p className="text-xs text-[#FAF9F5] font-medium truncate max-w-[140px]">
                {admin.name}
              </p>
              <span className="inline-block text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#176B45] text-[#EEEAE0] border border-[#AA9160]/40 mt-1">
                {admin.adminRole === "super_admin" ? "Super Admin" : "Store Manager"}
              </span>
            </div>
            <Link
              href="/"
              target="_blank"
              className="text-[10px] text-[#AA9160] hover:text-[#FAF9F5] uppercase tracking-wider underline"
            >
              Store ↗
            </Link>
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-sm text-xs transition-colors ${
                active
                  ? "bg-[#176B45] text-white font-medium border-l-2 border-[#AA9160]"
                  : "text-[#EEEAE0]/80 hover:text-white hover:bg-[#176B45]/40"
              }`}
            >
              <span className="text-sm opacity-90">{item.icon}</span>
              <span className="tracking-wide">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer / Logout */}
      <div className="p-4 border-t border-[#176B45]/40">
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs text-[#EEEAE0]/70 hover:text-white hover:bg-[#176B45]/30 rounded-sm transition-colors border border-transparent hover:border-[#176B45]"
        >
          <span>🚪</span>
          <span className="uppercase tracking-luxury text-[10px]">Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop static sidebar */}
      <aside className="hidden lg:block w-64 h-screen sticky top-0 shrink-0">
        {content}
      </aside>

      {/* Mobile drawer */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <div className="relative w-64 max-w-[80vw] h-full z-10 animate-in slide-in-from-left duration-200">
            {content}
          </div>
        </div>
      )}
    </>
  );
}

