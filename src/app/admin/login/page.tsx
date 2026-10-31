"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAdmin } from "@/context/admin-context";
import Link from "next/link";

export default function AdminLoginPage() {
  const { login } = useAdmin();
  const router = useRouter();

  const [email, setEmail] = useState("admin@dheera.in");
  const [password, setPassword] = useState("Admin@Dheera2026");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await login(email, password);
      if (res.success) {
        router.push("/admin");
      } else {
        setError(res.error || "Authentication failed. Please verify administrative credentials.");
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#EEEAE0] flex flex-col justify-center items-center px-4 py-12">
      <div className="max-w-md w-full bg-[#FAF9F5] border border-[#E2DFD6] p-8 sm:p-10 shadow-sm rounded-sm">
        {/* Brand Header */}
        <div className="text-center space-y-2 mb-8">
          <span className="text-[10px] uppercase tracking-luxury text-[#AA9160] font-semibold block">
            DHEERA ATELIER
          </span>
          <h1 className="font-serif text-3xl text-[#176B45] font-normal tracking-wide">
            Business Management
          </h1>
          <p className="text-xs text-[#74786F]">
            Secure portal for authorized store administrators & operations managers.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-[#FDF2F2] border border-[#991B1B]/20 text-[#991B1B] text-xs rounded-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[11px] uppercase tracking-luxury text-[#315039] font-medium mb-1.5">
              Administrative Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="admin@dheera.in"
              className="w-full px-3.5 py-2.5 bg-white border border-[#E2DFD6] rounded-sm text-xs text-[#252A25] focus:outline-none focus:border-[#176B45]"
            />
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-luxury text-[#315039] font-medium mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-white border border-[#E2DFD6] rounded-sm text-xs text-[#252A25] focus:outline-none focus:border-[#176B45]"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-[#176B45] text-white text-xs uppercase tracking-luxury font-medium hover:bg-[#125837] transition-colors rounded-sm disabled:opacity-50 mt-2"
          >
            {isLoading ? "Authenticating..." : "Authorize Access →"}
          </button>
        </form>

        {/* Quick Demo Credentials Assistant */}
        <div className="mt-8 pt-6 border-t border-[#E2DFD6] text-xs text-[#74786F]">
          <p className="font-medium text-[#315039] mb-2 uppercase tracking-luxury text-[10px]">
            Demo Administrative Roles
          </p>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <button
              type="button"
              onClick={() => {
                setEmail("admin@dheera.in");
                setPassword("Admin@Dheera2026");
              }}
              className="p-2 text-left bg-[#EEEAE0]/60 hover:bg-[#EEEAE0] rounded-sm border border-[#E2DFD6]"
            >
              <span className="font-medium text-[#176B45] block">Super Admin</span>
              <span className="text-[10px] text-[#74786F]">admin@dheera.in</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail("manager@dheera.in");
                setPassword("Manager@Dheera2026");
              }}
              className="p-2 text-left bg-[#EEEAE0]/60 hover:bg-[#EEEAE0] rounded-sm border border-[#E2DFD6]"
            >
              <span className="font-medium text-[#315039] block">Store Manager</span>
              <span className="text-[10px] text-[#74786F]">manager@dheera.in</span>
            </button>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link href="/" className="text-xs text-[#74786F] hover:text-[#176B45]">
            ← Return to DHEERA Customer Storefront
          </Link>
        </div>
      </div>
    </div>
  );
}

