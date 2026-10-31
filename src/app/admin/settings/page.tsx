"use client";

import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/admin-layout";
import { useAdmin } from "@/context/admin-context";
import { StoreSettings } from "@/types/admin";

export default function AdminSettingsPage() {
  const { admin } = useAdmin();
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/admin/settings");
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.settings) {
            setSettings(data.settings);
          }
        }
      } catch {
        // Error
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    if (admin?.adminRole !== "super_admin") {
      setStatusMessage({
        type: "error",
        text: "Permission Denied: Only Super Administrators may modify global store settings.",
      });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMessage({ type: "success", text: data.message });
      } else {
        setStatusMessage({ type: "error", text: data.error || "Failed to update settings." });
      }
    } catch {
      setStatusMessage({ type: "error", text: "Network error saving settings." });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !settings) {
    return (
      <AdminLayout>
        <div className="p-12 text-center text-[#74786F] text-xs">
          Loading store configurations...
        </div>
      </AdminLayout>
    );
  }

  const isSuperAdmin = admin?.adminRole === "super_admin";

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E2DFD6] gap-4">
          <div>
            <span className="text-[10px] uppercase tracking-luxury text-[#AA9160] font-semibold block">
              ENTERPRISE CONFIGURATION
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl text-[#176B45]">
              Store & Operations Settings
            </h1>
            <p className="text-xs text-[#74786F] mt-0.5">
              Brand contact coordinates, Pan-India logistics thresholds, and customer legal policies.
            </p>
          </div>

          {!isSuperAdmin && (
            <span className="px-3 py-1 rounded-sm bg-[#FFF9E6] border border-[#B8860B]/30 text-[#B8860B] text-xs font-medium">
              View Only (Super Admin required to edit)
            </span>
          )}
        </div>

        {statusMessage && (
          <div
            className={`p-3 text-xs rounded-sm flex items-center justify-between ${
              statusMessage.type === "success"
                ? "bg-[#EAF5EF] border border-[#176B45]/20 text-[#176B45]"
                : "bg-[#FDF2F2] border border-[#991B1B]/20 text-[#991B1B]"
            }`}
          >
            <span>{statusMessage.text}</span>
            <button onClick={() => setStatusMessage(null)}>✕</button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 1. Brand Identity Coordinates */}
          <div className="bg-[#FAF9F5] border border-[#E2DFD6] p-6 rounded-sm space-y-4">
            <h3 className="font-serif text-base text-[#176B45] border-b border-[#E2DFD6] pb-2">
              Brand Identity & Contact Coordinates
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] uppercase tracking-luxury text-[#315039] font-medium mb-1">
                  Store Legal Name *
                </label>
                <input
                  type="text"
                  required
                  disabled={!isSuperAdmin}
                  value={settings.storeName}
                  onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-[#E2DFD6] rounded-sm text-xs text-[#252A25] focus:outline-none focus:border-[#176B45] disabled:bg-[#EEEAE0]/50"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-luxury text-[#315039] font-medium mb-1">
                  Brand Logo Path
                </label>
                <input
                  type="text"
                  disabled={!isSuperAdmin}
                  value={settings.logoUrl}
                  onChange={(e) => setSettings({ ...settings, logoUrl: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-[#E2DFD6] rounded-sm text-xs text-[#252A25] focus:outline-none focus:border-[#176B45] disabled:bg-[#EEEAE0]/50"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-luxury text-[#315039] font-medium mb-1">
                  Official Business Email *
                </label>
                <input
                  type="email"
                  required
                  disabled={!isSuperAdmin}
                  value={settings.businessEmail}
                  onChange={(e) => setSettings({ ...settings, businessEmail: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-[#E2DFD6] rounded-sm text-xs text-[#252A25] focus:outline-none focus:border-[#176B45] disabled:bg-[#EEEAE0]/50"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-luxury text-[#315039] font-medium mb-1">
                  Client Support Phone
                </label>
                <input
                  type="text"
                  disabled={!isSuperAdmin}
                  value={settings.contactNumber}
                  onChange={(e) => setSettings({ ...settings, contactNumber: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-[#E2DFD6] rounded-sm text-xs text-[#252A25] focus:outline-none focus:border-[#176B45] disabled:bg-[#EEEAE0]/50"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-luxury text-[#315039] font-medium mb-1">
                  Official Instagram Handle URL
                </label>
                <input
                  type="text"
                  disabled={!isSuperAdmin}
                  value={settings.instagramUrl}
                  onChange={(e) => setSettings({ ...settings, instagramUrl: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-[#E2DFD6] rounded-sm text-xs text-[#252A25] focus:outline-none focus:border-[#176B45] disabled:bg-[#EEEAE0]/50"
                />
              </div>
            </div>
          </div>

          {/* 2. Shipping & Logistics Configuration */}
          <div className="bg-[#FAF9F5] border border-[#E2DFD6] p-6 rounded-sm space-y-4">
            <h3 className="font-serif text-base text-[#176B45] border-b border-[#E2DFD6] pb-2">
              Pan-India Logistics & Checkout Parameters
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] uppercase tracking-luxury text-[#315039] font-medium mb-1">
                  Base Express Shipping Fee (INR)
                </label>
                <input
                  type="number"
                  min={0}
                  disabled={!isSuperAdmin}
                  value={settings.shippingBaseFee}
                  onChange={(e) =>
                    setSettings({ ...settings, shippingBaseFee: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 bg-white border border-[#E2DFD6] rounded-sm text-xs text-[#252A25] focus:outline-none focus:border-[#176B45] disabled:bg-[#EEEAE0]/50"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-luxury text-[#315039] font-medium mb-1">
                  Complimentary Shipping Threshold (INR)
                </label>
                <input
                  type="number"
                  min={0}
                  disabled={!isSuperAdmin}
                  value={settings.freeShippingThreshold}
                  onChange={(e) =>
                    setSettings({ ...settings, freeShippingThreshold: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 bg-white border border-[#E2DFD6] rounded-sm text-xs text-[#252A25] focus:outline-none focus:border-[#176B45] disabled:bg-[#EEEAE0]/50"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-luxury text-[#315039] font-medium mb-1">
                  Store Currency Symbol
                </label>
                <input
                  type="text"
                  disabled={!isSuperAdmin}
                  value={settings.currencySymbol}
                  onChange={(e) => setSettings({ ...settings, currencySymbol: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-[#E2DFD6] rounded-sm text-xs text-[#252A25] focus:outline-none focus:border-[#176B45] disabled:bg-[#EEEAE0]/50"
                />
              </div>
            </div>
          </div>

          {/* 3. Customer Legal Policies */}
          <div className="bg-[#FAF9F5] border border-[#E2DFD6] p-6 rounded-sm space-y-4">
            <h3 className="font-serif text-base text-[#176B45] border-b border-[#E2DFD6] pb-2">
              Atelier Policies & Legal Disclosures
            </h3>

            <div>
              <label className="block text-[11px] uppercase tracking-luxury text-[#315039] font-medium mb-1">
                Returns & Exchanges Policy
              </label>
              <textarea
                rows={2}
                disabled={!isSuperAdmin}
                value={settings.returnPolicy}
                onChange={(e) => setSettings({ ...settings, returnPolicy: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-[#E2DFD6] rounded-sm text-xs text-[#252A25] focus:outline-none focus:border-[#176B45] disabled:bg-[#EEEAE0]/50"
              />
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-luxury text-[#315039] font-medium mb-1">
                Privacy Policy Summary
              </label>
              <textarea
                rows={2}
                disabled={!isSuperAdmin}
                value={settings.privacyPolicy}
                onChange={(e) => setSettings({ ...settings, privacyPolicy: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-[#E2DFD6] rounded-sm text-xs text-[#252A25] focus:outline-none focus:border-[#176B45] disabled:bg-[#EEEAE0]/50"
              />
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-luxury text-[#315039] font-medium mb-1">
                Terms & Conditions
              </label>
              <textarea
                rows={2}
                disabled={!isSuperAdmin}
                value={settings.termsConditions}
                onChange={(e) => setSettings({ ...settings, termsConditions: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-[#E2DFD6] rounded-sm text-xs text-[#252A25] focus:outline-none focus:border-[#176B45] disabled:bg-[#EEEAE0]/50"
              />
            </div>
          </div>

          {/* Submit */}
          {isSuperAdmin && (
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 bg-[#176B45] text-white rounded-sm text-xs uppercase tracking-luxury font-medium hover:bg-[#125837] transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "Saving Configuration..." : "Save Store Settings →"}
              </button>
            </div>
          )}
        </form>
      </div>
    </AdminLayout>
  );
}

