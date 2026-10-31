"use client";

import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/admin-layout";
import { StatusBadge } from "@/components/admin/status-badge";
import { Coupon } from "@/types/cart";

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  // Form State
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [discountValue, setDiscountValue] = useState(10);
  const [minOrderAmount, setMinOrderAmount] = useState(2000);
  const [maxDiscountAmount, setMaxDiscountAmount] = useState<number | undefined>(1500);
  const [description, setDescription] = useState("");
  const [usageLimit, setUsageLimit] = useState<number | undefined>(undefined);
  const [isActive, setIsActive] = useState(true);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchCoupons = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/coupons");
      if (res.ok) {
        const data = await res.json();
        setCoupons(data.coupons || []);
      }
    } catch {
      // Error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleOpenCreate = () => {
    setEditingCoupon(null);
    setCode("");
    setDiscountType("percentage");
    setDiscountValue(10);
    setMinOrderAmount(2000);
    setMaxDiscountAmount(1500);
    setDescription("10% off on artisanal orders above ₹2,000");
    setUsageLimit(undefined);
    setIsActive(true);
    setShowModal(true);
  };

  const handleOpenEdit = (c: Coupon) => {
    setEditingCoupon(c);
    setCode(c.code);
    setDiscountType(c.discountType);
    setDiscountValue(c.discountValue);
    setMinOrderAmount(c.minOrderAmount);
    setMaxDiscountAmount(c.maxDiscountAmount);
    setDescription(c.description || "");
    setUsageLimit(c.usageLimit);
    setIsActive(c.isActive);
    setShowModal(true);
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    try {
      const url = editingCoupon ? `/api/admin/coupons/${editingCoupon.id}` : "/api/admin/coupons";
      const method = editingCoupon ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          discountType,
          discountValue: Number(discountValue),
          minOrderAmount: Number(minOrderAmount),
          maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : undefined,
          description,
          usageLimit: usageLimit ? Number(usageLimit) : undefined,
          isActive,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMessage({ type: "success", text: data.message || "Coupon saved." });
        setShowModal(false);
        fetchCoupons();
      } else {
        setStatusMessage({ type: "error", text: data.error || "Failed to save coupon." });
      }
    } catch {
      setStatusMessage({ type: "error", text: "Network error saving coupon." });
    }
  };

  const handleToggleActive = async (c: Coupon) => {
    try {
      const res = await fetch(`/api/admin/coupons/${c.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !c.isActive }),
      });
      if (res.ok) {
        fetchCoupons();
      }
    } catch {
      // Error
    }
  };

  const handleDelete = async (c: Coupon) => {
    if (!confirm(`Are you sure you want to delete coupon code "${c.code}"?`)) return;

    try {
      const res = await fetch(`/api/admin/coupons/${c.id}`, { method: "DELETE" });
      if (res.ok) {
        setStatusMessage({ type: "success", text: `Coupon "${c.code}" deleted.` });
        fetchCoupons();
      }
    } catch {
      // Error
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E2DFD6] gap-4">
          <div>
            <span className="text-[10px] uppercase tracking-luxury text-[#AA9160] font-semibold block">
              PROMOTIONS & PRIVILEGES
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl text-[#176B45]">
              Coupons & Atelier Offers
            </h1>
            <p className="text-xs text-[#74786F] mt-0.5">
              Configure promotional codes, percentage discounts, minimum thresholds, and redemptions.
            </p>
          </div>

          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-sm bg-[#176B45] text-white text-xs uppercase tracking-luxury font-medium hover:bg-[#125837] transition-colors self-start sm:self-auto"
          >
            <span>+</span>
            <span>Create New Coupon</span>
          </button>
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

        {/* Coupons Table */}
        <div className="bg-[#FAF9F5] border border-[#E2DFD6] rounded-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#EEEAE0]/70 border-b border-[#E2DFD6] text-[10px] uppercase tracking-luxury text-[#74786F]">
                <tr>
                  <th className="py-3 px-4">Coupon Code</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Discount Value</th>
                  <th className="py-3 px-4">Min. Order</th>
                  <th className="py-3 px-4">Max. Discount</th>
                  <th className="py-3 px-4">Redemptions</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2DFD6]/60">
                {coupons.map((c) => (
                  <tr key={c.id} className="hover:bg-white/80 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-mono font-semibold text-[#176B45] text-xs">
                        {c.code}
                      </span>
                      {c.isDevelopmentFixture && (
                        <span className="ml-2 text-[9px] px-1.5 py-0.2 rounded bg-[#AA9160]/20 text-[#AA9160] font-medium">
                          Fixture
                        </span>
                      )}
                      <p className="text-[10px] text-[#74786F] mt-0.5">{c.description}</p>
                    </td>
                    <td className="py-3 px-4 text-[#252A25] capitalize">
                      {c.discountType}
                    </td>
                    <td className="py-3 px-4 font-semibold text-[#252A25]">
                      {c.discountType === "percentage" ? `${c.discountValue}%` : `₹${c.discountValue}`}
                    </td>
                    <td className="py-3 px-4 text-[#74786F]">
                      ₹{c.minOrderAmount.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-4 text-[#74786F]">
                      {c.maxDiscountAmount ? `₹${c.maxDiscountAmount.toLocaleString("en-IN")}` : "No Cap"}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-[#252A25]">
                      {c.timesUsed || 0} / {c.usageLimit || "∞"}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleToggleActive(c)}
                        title="Click to toggle active state"
                      >
                        <StatusBadge status={c.isActive ? "active" : "inactive"} size="sm" />
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => handleOpenEdit(c)}
                          className="px-2.5 py-1 bg-[#EEEAE0] hover:bg-[#176B45] hover:text-white rounded-sm text-[11px] text-[#315039] font-medium transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(c)}
                          className="p-1 text-[#74786F] hover:text-rose-600"
                          title="Delete coupon"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: Create/Edit Coupon */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-[#FAF9F5] border border-[#E2DFD6] rounded-sm max-w-md w-full p-6 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-[#E2DFD6] mb-4">
                <h3 className="font-serif text-lg text-[#176B45]">
                  {editingCoupon ? "Edit Coupon" : "Create New Coupon"}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-[#74786F] hover:text-[#252A25]"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveCoupon} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[11px] uppercase tracking-luxury text-[#315039] font-medium mb-1">
                    Coupon Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="e.g. DIWALI20"
                    className="w-full px-3 py-2 bg-white border border-[#E2DFD6] rounded-sm text-[#252A25] font-mono focus:outline-none focus:border-[#176B45]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] uppercase tracking-luxury text-[#315039] font-medium mb-1">
                      Discount Type *
                    </label>
                    <select
                      value={discountType}
                      onChange={(e) => setDiscountType(e.target.value as any)}
                      className="w-full px-3 py-2 bg-white border border-[#E2DFD6] rounded-sm text-[#252A25] focus:outline-none focus:border-[#176B45]"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount (₹)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase tracking-luxury text-[#315039] font-medium mb-1">
                      Value *
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={discountValue}
                      onChange={(e) => setDiscountValue(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-[#E2DFD6] rounded-sm text-[#252A25] focus:outline-none focus:border-[#176B45]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] uppercase tracking-luxury text-[#315039] font-medium mb-1">
                      Minimum Order (INR)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={minOrderAmount}
                      onChange={(e) => setMinOrderAmount(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-[#E2DFD6] rounded-sm text-[#252A25] focus:outline-none focus:border-[#176B45]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase tracking-luxury text-[#315039] font-medium mb-1">
                      Max Discount Cap (INR)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={maxDiscountAmount || ""}
                      onChange={(e) =>
                        setMaxDiscountAmount(e.target.value ? Number(e.target.value) : undefined)
                      }
                      placeholder="Optional"
                      className="w-full px-3 py-2 bg-white border border-[#E2DFD6] rounded-sm text-[#252A25] focus:outline-none focus:border-[#176B45]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-luxury text-[#315039] font-medium mb-1">
                    Editorial Description
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. 15% off festive wedding collection"
                    className="w-full px-3 py-2 bg-white border border-[#E2DFD6] rounded-sm text-[#252A25] focus:outline-none focus:border-[#176B45]"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="couponActive"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 text-[#176B45] rounded"
                  />
                  <label htmlFor="couponActive" className="text-xs text-[#252A25]">
                    Active for customer checkout
                  </label>
                </div>

                <div className="pt-4 border-t border-[#E2DFD6] flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-[#E2DFD6] text-[#74786F] rounded-sm hover:bg-[#EEEAE0]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#176B45] text-white rounded-sm hover:bg-[#125837] uppercase tracking-luxury font-medium"
                  >
                    Save Coupon →
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

