"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AdminProvider, useAdmin } from "@/context/admin-context";
import { AdminSidebar } from "./admin-sidebar";
import { AdminHeader } from "./admin-header";

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const { admin, isLoading } = useAdmin();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Skip protection on the login page itself
  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (!isLoading && !admin && !isLoginPage) {
      router.push("/admin/login");
    }
  }, [admin, isLoading, isLoginPage, router]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#EEEAE0] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-[#176B45] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="font-serif text-[#176B45] tracking-wide text-sm">
            Verifying Atelier Security Credentials...
          </p>
        </div>
      </div>
    );
  }

  if (!admin) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-[#EEEAE0] flex flex-col lg:flex-row antialiased">
      {/* Sidebar (Desktop + Mobile Drawer) */}
      <AdminSidebar isOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader onOpenMobileNav={() => setMobileNavOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminProvider>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </AdminProvider>
  );
}

