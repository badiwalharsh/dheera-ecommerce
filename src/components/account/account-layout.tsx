"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Container } from "@/components/ui/container";
import {
  User,
  Package,
  MapPin,
  Heart,
  Settings,
  LogOut,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";

interface AccountLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  breadcrumb?: string;
}

export function AccountLayout({
  children,
  title,
  subtitle,
  breadcrumb,
}: AccountLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  // Route protection
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(`/account/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, isAuthenticated, pathname, router]);

  const navItems = [
    {
      label: "Account Overview",
      href: "/account",
      icon: User,
      active: pathname === "/account",
    },
    {
      label: "My Orders & Tracking",
      href: "/account/orders",
      icon: Package,
      active: pathname.startsWith("/account/orders"),
    },
    {
      label: "Saved Addresses",
      href: "/account/addresses",
      icon: MapPin,
      active: pathname.startsWith("/account/addresses"),
    },
    {
      label: "Personal Wishlist",
      href: "/account/wishlist",
      icon: Heart,
      active: pathname.startsWith("/account/wishlist"),
    },
    {
      label: "Profile Settings",
      href: "/account/profile",
      icon: Settings,
      active: pathname.startsWith("/account/profile"),
    },
  ];

  if (isLoading) {
    return (
      <div className="py-24 text-center">
        <Container size="default">
          <div className="inline-block animate-pulse space-y-3">
            <div className="w-12 h-12 bg-[#176B45]/20 rounded-full mx-auto" />
            <p className="text-sm font-serif text-[#176B45]">Loading your patron atelier...</p>
          </div>
        </Container>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  const patronInitials = user?.fullName
    ? user.fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "DP";

  return (
    <div className="py-8 sm:py-12 bg-[#EEEAE0]/40 min-h-[calc(100vh-140px)]">
      <Container size="default">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-1.5 text-xs text-[#555E55] mb-6">
          <Link href="/" className="hover:text-[#176B45] transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-[#8C9388]" />
          <Link href="/account" className="hover:text-[#176B45] transition-colors">
            Account
          </Link>
          {breadcrumb && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-[#8C9388]" />
              <span className="text-[#176B45] font-medium">{breadcrumb}</span>
            </>
          )}
        </nav>

        {/* Patron Banner */}
        <div className="bg-[#FAF9F5] border border-[#E2DFD6] rounded-sm p-6 sm:p-8 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#176B45] text-[#FAF9F5] flex items-center justify-center font-serif text-xl sm:text-2xl font-semibold shadow-inner flex-shrink-0">
              {patronInitials}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-luxury text-[#176B45] font-semibold">
                  Patron Portal
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#176B45]/10 text-[#176B45] text-[10px] rounded-full font-medium">
                  <ShieldCheck className="w-3 h-3" /> Verified
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-serif text-[#176B45] mt-0.5">
                Namaste, {user?.fullName || "Valued Patron"}
              </h1>
              <p className="text-xs text-[#555E55] mt-1">
                {user?.email} {user?.phone ? `• +91 ${user.phone}` : ""}
              </p>
            </div>
          </div>

          <button
            onClick={() => logout()}
            className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2 border border-[#D5CFBF] hover:bg-[#EEEAE0]/60 text-xs text-[#252A25] rounded-sm transition-colors"
          >
            <LogOut className="w-3.5 h-3.5 text-[#555E55]" />
            Sign Out
          </button>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <aside className="lg:col-span-1">
            <div className="bg-[#FAF9F5] border border-[#E2DFD6] rounded-sm overflow-hidden sticky top-28">
              <div className="p-4 border-b border-[#E2DFD6] bg-[#EEEAE0]/30">
                <span className="text-[10px] uppercase tracking-wider text-[#555E55] font-semibold">
                  Account Navigation
                </span>
              </div>
              <nav className="divide-y divide-[#E2DFD6]/60">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center justify-between px-4 py-3.5 text-xs transition-colors ${
                        item.active
                          ? "bg-[#176B45] text-[#FAF9F5] font-medium"
                          : "text-[#252A25] hover:bg-[#EEEAE0]/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${item.active ? "text-[#FAF9F5]" : "text-[#176B45]"}`} />
                        <span>{item.label}</span>
                      </div>
                      <ChevronRight
                        className={`w-3.5 h-3.5 ${
                          item.active ? "text-[#FAF9F5]/70" : "text-[#8C9388]"
                        }`}
                      />
                    </Link>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="lg:col-span-3">
            {(title || subtitle) && (
              <div className="mb-6 space-y-1">
                {title && <h2 className="text-2xl font-serif text-[#176B45]">{title}</h2>}
                {subtitle && <p className="text-xs sm:text-sm text-[#555E55]">{subtitle}</p>}
              </div>
            )}
            {children}
          </main>
        </div>
      </Container>
    </div>
  );
}

