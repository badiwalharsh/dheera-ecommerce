"use client";

import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/admin-layout";
import { StatusBadge } from "@/components/admin/status-badge";
import { InventoryMovement, InventoryVariantRow } from "@/types/admin";

export default function AdminInventoryPage() {
  const [variants, setVariants] = useState<InventoryVariantRow[]>([]);
  const [recentMovements, setRecentMovements] = useState<InventoryMovement[]>([]);
  const [stats, setStats] = useState({ totalVariants: 0, lowStockCount: 0, outOfStockCount: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Adjustment Modal State
  const [selectedVariant, setSelectedVariant] = useState<InventoryVariantRow | null>(null);
  const [changeAmount, setChangeAmount] = useState<number>(5);
  const [adjustmentType, setAdjustmentType] = useState<"increase" | "decrease" | "correct">("increase");
  const [reason, setReason] = useState("Restock arrival from handloom atelier");
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchInventory = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/inventory");
      if (res.ok) {
        const data = await res.json();
        setVariants(data.variants || []);
        setRecentMovements(data.recentMovements || []);
        setStats({
          totalVariants: data.totalVariants || 0,
          lowStockCount: data.lowStockCount || 0,
          outOfStockCount: data.outOfStockCount || 0,
        });
      }
    } catch {
      // Error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleOpenAdjust = (v: InventoryVariantRow) => {
    setSelectedVariant(v);
    setChangeAmount(5);
    setAdjustmentType("increase");
    setReason("Restock arrival from handloom atelier");
    setStatusMessage(null);
  };

  const handleSaveAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVariant) return;

    setIsSubmitting(true);
    setStatusMessage(null);

    let delta = changeAmount;
    if (adjustmentType === "decrease") {
      delta = -Math.abs(changeAmount);
    } else if (adjustmentType === "correct") {
      delta = changeAmount - selectedVariant.quantityAvailable;
    }

    try {
      const res = await fetch("/api/admin/inventory/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variantId: selectedVariant.variantId,
          productId: selectedVariant.productId,
          size: selectedVariant.size,
          colour: selectedVariant.colour,
          changeAmount: delta,
          reason,
          movementType: delta > 0 ? "restock" : "correction",
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMessage({ type: "success", text: data.message });
        setSelectedVariant(null);
        fetchInventory();
      } else {
        setStatusMessage({ type: "error", text: data.error || "Adjustment failed." });
      }
    } catch {
      setStatusMessage({ type: "error", text: "Network error adjusting stock." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredVariants = variants.filter((v) => {
    const matchesSearch =
      v.productName.toLowerCase().includes(search.toLowerCase()) ||
      v.sku.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || v.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E2DFD6] gap-4">
          <div>
            <span className="text-[10px] uppercase tracking-luxury text-[#AA9160] font-semibold block">
              STOCK & FULFILLMENT AUDIT
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl text-[#176B45]">
              Inventory & Garment Units
            </h1>
            <p className="text-xs text-[#74786F] mt-0.5">
              Atomic inventory adjustments, variant SKU tracking, and complete movement logs.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#FAF9F5] border border-[#E2DFD6] rounded-sm text-center">
              <span className="text-[9px] uppercase tracking-luxury text-[#74786F] block">Total Variants</span>
              <span className="font-serif text-lg text-[#176B45] font-semibold">{stats.totalVariants}</span>
            </div>
            <div className="p-2.5 bg-[#FFF9E6] border border-[#B8860B]/30 rounded-sm text-center">
              <span className="text-[9px] uppercase tracking-luxury text-[#B8860B] block">Low Stock</span>
              <span className="font-serif text-lg text-[#B8860B] font-semibold">{stats.lowStockCount}</span>
            </div>
            <div className="p-2.5 bg-[#FDF2F2] border border-[#991B1B]/30 rounded-sm text-center">
              <span className="text-[9px] uppercase tracking-luxury text-[#991B1B] block">Out of Stock</span>
              <span className="font-serif text-lg text-[#991B1B] font-semibold">{stats.outOfStockCount}</span>
            </div>
          </div>
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

        {/* Filter Controls */}
        <div className="bg-[#FAF9F5] border border-[#E2DFD6] p-4 rounded-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
          <div className="flex-1 max-w-sm">
            <input
              type="text"
              placeholder="Search by garment name or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#E2DFD6] rounded-sm text-xs text-[#252A25] focus:outline-none focus:border-[#176B45]"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] uppercase tracking-luxury text-[#74786F]">Filter Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-[#E2DFD6] rounded-sm text-xs text-[#252A25] focus:outline-none focus:border-[#176B45]"
            >
              <option value="all">All Inventory States</option>
              <option value="in_stock">In Stock (&gt;3 units)</option>
              <option value="low_stock">Low Stock (≤3 units)</option>
              <option value="out_of_stock">Out of Stock (0 units)</option>
            </select>
          </div>
        </div>

        {/* Inventory Variant Table */}
        <div className="bg-[#FAF9F5] border border-[#E2DFD6] rounded-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#EEEAE0]/70 border-b border-[#E2DFD6] text-[10px] uppercase tracking-luxury text-[#74786F]">
                <tr>
                  <th className="py-3 px-4">Garment</th>
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4">Size</th>
                  <th className="py-3 px-4">Colour</th>
                  <th className="py-3 px-4">Available</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Adjustment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2DFD6]/60">
                {filteredVariants.length > 0 ? (
                  filteredVariants.map((v) => (
                    <tr key={v.variantId} className="hover:bg-white/80 transition-colors">
                      <td className="py-3 px-4 font-medium text-[#176B45]">
                        {v.productName}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-[#74786F]">
                        {v.sku}
                      </td>
                      <td className="py-3 px-4 text-[#252A25] font-medium">{v.size}</td>
                      <td className="py-3 px-4 text-[#74786F]">{v.colour || "Standard"}</td>
                      <td className="py-3 px-4 font-semibold text-[#252A25]">
                        {v.quantityAvailable} units
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={v.status} size="sm" />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleOpenAdjust(v)}
                          className="px-3 py-1.5 bg-[#EEEAE0] hover:bg-[#176B45] hover:text-white rounded-sm text-[11px] text-[#315039] font-medium transition-colors"
                        >
                          Adjust Stock ⚙️
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[#74786F]">
                      {isLoading ? "Loading inventory records..." : "No inventory records found."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stock Movement History Table */}
        <div className="bg-[#FAF9F5] border border-[#E2DFD6] p-5 rounded-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E2DFD6]">
            <div>
              <h3 className="font-serif text-base text-[#176B45]">Stock Movement Audit Trail</h3>
              <p className="text-[11px] text-[#74786F]">
                Immutable server log of all stock increases, deductions, and corrections
              </p>
            </div>
            <span className="text-[10px] text-[#AA9160] uppercase tracking-luxury">
              {recentMovements.length} Logged Entries
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#E2DFD6] text-[10px] uppercase tracking-luxury text-[#74786F]">
                <tr>
                  <th className="pb-2">Timestamp</th>
                  <th className="pb-2">Garment</th>
                  <th className="pb-2">SKU</th>
                  <th className="pb-2">Previous</th>
                  <th className="pb-2">Change</th>
                  <th className="pb-2">New Stock</th>
                  <th className="pb-2">Reason</th>
                  <th className="pb-2 text-right">Adjusted By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2DFD6]/60">
                {recentMovements.map((m) => (
                  <tr key={m.id} className="hover:bg-white/60">
                    <td className="py-2.5 text-[#74786F] whitespace-nowrap">
                      {new Date(m.createdAt).toLocaleString("en-IN", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-2.5 font-medium text-[#176B45]">{m.productName}</td>
                    <td className="py-2.5 font-mono text-[11px] text-[#74786F]">{m.sku}</td>
                    <td className="py-2.5 text-[#74786F]">{m.previousQuantity}</td>
                    <td className="py-2.5 font-medium">
                      <span className={m.changeAmount > 0 ? "text-emerald-700" : "text-rose-700"}>
                        {m.changeAmount > 0 ? `+${m.changeAmount}` : m.changeAmount}
                      </span>
                    </td>
                    <td className="py-2.5 font-semibold text-[#252A25]">{m.newQuantity}</td>
                    <td className="py-2.5 text-[#74786F] max-w-xs truncate">{m.reason}</td>
                    <td className="py-2.5 text-right font-mono text-[10px] text-[#AA9160]">
                      {m.adjustedByEmail}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: Atomic Stock Adjustment */}
        {selectedVariant && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-[#FAF9F5] border border-[#E2DFD6] rounded-sm max-w-md w-full p-6 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-[#E2DFD6] mb-4">
                <div>
                  <h3 className="font-serif text-lg text-[#176B45]">Adjust Inventory</h3>
                  <p className="text-xs text-[#74786F] font-mono mt-0.5">
                    {selectedVariant.sku} ({selectedVariant.size})
                  </p>
                </div>
                <button
                  onClick={() => setSelectedVariant(null)}
                  className="text-[#74786F] hover:text-[#252A25]"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveAdjustment} className="space-y-4 text-xs">
                <div className="p-3 bg-[#EEEAE0]/70 border border-[#E2DFD6] rounded-sm flex justify-between items-center">
                  <span className="text-[#315039]">Current Available Stock:</span>
                  <span className="font-serif text-base text-[#176B45] font-semibold">
                    {selectedVariant.quantityAvailable} units
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-luxury text-[#315039] font-medium mb-1">
                    Adjustment Type
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "increase", label: "Increase (+)" },
                      { id: "decrease", label: "Decrease (-)" },
                      { id: "correct", label: "Set Exact" },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setAdjustmentType(opt.id as any)}
                        className={`py-2 px-1 text-center rounded-sm font-medium border transition-colors ${
                          adjustmentType === opt.id
                            ? "bg-[#176B45] text-white border-[#176B45]"
                            : "bg-white text-[#74786F] border-[#E2DFD6] hover:border-[#176B45]"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-luxury text-[#315039] font-medium mb-1">
                    {adjustmentType === "correct" ? "New Total Count *" : "Units to Adjust *"}
                  </label>
                  <input
                    type="number"
                    min={adjustmentType === "correct" ? 0 : 1}
                    required
                    value={changeAmount}
                    onChange={(e) => setChangeAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-[#E2DFD6] rounded-sm text-[#252A25] focus:outline-none focus:border-[#176B45]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-luxury text-[#315039] font-medium mb-1">
                    Mandatory Reason (Audit Log) *
                  </label>
                  <input
                    type="text"
                    required
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="e.g. Received shipment from weaving atelier"
                    className="w-full px-3 py-2 bg-white border border-[#E2DFD6] rounded-sm text-[#252A25] focus:outline-none focus:border-[#176B45]"
                  />
                </div>

                <div className="pt-4 border-t border-[#E2DFD6] flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedVariant(null)}
                    className="px-4 py-2 border border-[#E2DFD6] text-[#74786F] rounded-sm hover:bg-[#EEEAE0]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-[#176B45] text-white rounded-sm hover:bg-[#125837] uppercase tracking-luxury font-medium disabled:opacity-50"
                  >
                    {isSubmitting ? "Adjusting..." : "Apply Adjustment →"}
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

