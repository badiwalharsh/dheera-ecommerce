"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { AdminLayout } from "@/components/admin/admin-layout";
import { StatusBadge } from "@/components/admin/status-badge";
import { CustomizationRequestItem } from "@/types/admin";

export default function AdminCustomizationsPage() {
  const [items, setItems] = useState<CustomizationRequestItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<CustomizationRequestItem | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [newStatus, setNewStatus] = useState<CustomizationRequestItem["status"]>("new_enquiry");
  const [adminNotes, setAdminNotes] = useState("");
  const [estimatedQuote, setEstimatedQuote] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchCustomizations = useCallback(async () => {
    setIsLoading(true);
    try {
      const url = statusFilter !== "all" ? `/api/admin/customizations?status=${statusFilter}` : "/api/admin/customizations";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setItems(data.customizations || []);
      }
    } catch {
      // Error
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchCustomizations();
  }, [fetchCustomizations]);

  const handleOpenDetail = (item: CustomizationRequestItem) => {
    setSelectedItem(item);
    setNewStatus(item.status);
    setAdminNotes(item.adminNotes || "");
    setEstimatedQuote(item.estimatedQuote ? String(item.estimatedQuote) : "");
    setStatusMessage(null);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    setIsUpdating(true);
    setStatusMessage(null);

    try {
      const res = await fetch(`/api/admin/customizations/${selectedItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          adminNotes,
          estimatedQuote: estimatedQuote ? Number(estimatedQuote) : undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMessage({ type: "success", text: data.message });
        setSelectedItem(null);
        fetchCustomizations();
      } else {
        setStatusMessage({ type: "error", text: data.error || "Update failed." });
      }
    } catch {
      setStatusMessage({ type: "error", text: "Network error updating customization." });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E2DFD6] gap-4">
          <div>
            <span className="text-[10px] uppercase tracking-luxury text-[#AA9160] font-semibold block">
              DHEERA ATELIER BESPOKE
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl text-[#176B45]">
              Custom Tailoring Enquiries
            </h1>
            <p className="text-xs text-[#74786F] mt-0.5">
              Manage custom luxury apparel requests, client measurements, design briefs, and tailored quotes.
            </p>
          </div>

          <div className="p-2.5 bg-[#FAF9F5] border border-[#E2DFD6] rounded-sm text-center">
            <span className="text-[9px] uppercase tracking-luxury text-[#74786F] block">Active Enquiries</span>
            <span className="font-serif text-lg text-[#176B45] font-semibold">{items.length}</span>
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
        <div className="bg-[#FAF9F5] border border-[#E2DFD6] p-4 rounded-sm flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[11px] uppercase tracking-luxury text-[#74786F]">Lifecycle Stage:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-[#E2DFD6] rounded-sm text-xs text-[#252A25] focus:outline-none focus:border-[#176B45]"
            >
              <option value="all">All Bespoke Stages</option>
              <option value="new_enquiry">New Enquiry</option>
              <option value="under_review">Under Review</option>
              <option value="quotation_prepared">Quotation Prepared</option>
              <option value="approved">Approved by Patron</option>
              <option value="in_production">In Atelier Production</option>
              <option value="completed">Completed & Dispatched</option>
              <option value="declined">Declined</option>
            </select>
          </div>
        </div>

        {/* Customization Enquiries Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-[#FAF9F5] border border-[#E2DFD6] rounded-sm p-5 flex flex-col justify-between space-y-4 hover:border-[#176B45]/40 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-[#E2DFD6] mb-3">
                  <span className="font-mono text-[11px] text-[#176B45] font-medium">
                    {item.requestNumber}
                  </span>
                  <StatusBadge status={item.status} size="sm" />
                </div>

                <h3 className="font-serif text-lg text-[#252A25]">{item.customerName}</h3>
                <p className="text-xs text-[#74786F]">{item.email} • {item.phone}</p>

                <div className="mt-3 space-y-1 text-xs">
                  <p>
                    <span className="text-[#74786F]">Category:</span>{" "}
                    <span className="font-medium text-[#176B45]">{item.category}</span>
                  </p>
                  <p>
                    <span className="text-[#74786F]">Preferred Palette:</span>{" "}
                    <span className="text-[#252A25]">{item.preferredColour || "Not specified"}</span>
                  </p>
                  <p>
                    <span className="text-[#74786F]">Textile:</span>{" "}
                    <span className="text-[#252A25]">{item.preferredFabric || "Not specified"}</span>
                  </p>
                  <p>
                    <span className="text-[#74786F]">Occasion:</span>{" "}
                    <span className="text-[#252A25]">{item.occasion || "Not specified"}</span>
                  </p>
                </div>

                <p className="mt-3 p-2.5 bg-white border border-[#E2DFD6] rounded-sm text-[11px] text-[#74786F] line-clamp-3 italic">
                  &ldquo;{item.designNotes}&rdquo;
                </p>
              </div>

              <div className="pt-3 border-t border-[#E2DFD6] flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-[#74786F] uppercase block">Quote</span>
                  <span className="font-medium text-[#176B45]">
                    {item.estimatedQuote ? `₹${item.estimatedQuote.toLocaleString("en-IN")}` : "Pending"}
                  </span>
                </div>

                <button
                  onClick={() => handleOpenDetail(item)}
                  className="px-3 py-1.5 bg-[#176B45] text-white rounded-sm text-[11px] uppercase tracking-luxury hover:bg-[#125837] transition-colors"
                >
                  Manage Enquiry →
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Modal: Customization Details & Status Updater */}
        {selectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-[#FAF9F5] border border-[#E2DFD6] rounded-sm max-w-2xl w-full p-6 shadow-xl max-h-[85vh] flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-[#E2DFD6] mb-4">
                <div>
                  <h3 className="font-serif text-lg text-[#176B45]">
                    Atelier Enquiry #{selectedItem.requestNumber}
                  </h3>
                  <p className="text-xs text-[#74786F]">
                    {selectedItem.customerName} ({selectedItem.email})
                  </p>
                </div>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="text-[#74786F] hover:text-[#252A25]"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleUpdate} className="flex-1 overflow-y-auto space-y-4 text-xs pr-1">
                {/* Reference Images */}
                {selectedItem.referenceImages && selectedItem.referenceImages.length > 0 && (
                  <div>
                    <label className="block text-[11px] uppercase tracking-luxury text-[#315039] font-medium mb-1.5">
                      Client Reference Imagery
                    </label>
                    <div className="flex gap-2">
                      {selectedItem.referenceImages.map((img, i) => (
                        <div
                          key={i}
                          className="w-20 h-24 relative bg-[#EEEAE0] border border-[#E2DFD6] rounded-sm overflow-hidden"
                        >
                          <Image src={img} alt="Reference" fill className="object-cover" sizes="80px" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Measurements Spec */}
                <div className="p-3 bg-white border border-[#E2DFD6] rounded-sm">
                  <h4 className="font-medium text-[#176B45] mb-2 uppercase tracking-luxury text-[10px]">
                    Client Measurements
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {Object.entries(selectedItem.measurements).map(([k, v]) => (
                      <div key={k} className="text-[11px]">
                        <span className="text-[#74786F] capitalize">{k}: </span>
                        <span className="font-medium text-[#252A25]">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Design Instructions */}
                <div>
                  <label className="block text-[11px] uppercase tracking-luxury text-[#315039] font-medium mb-1">
                    Design Instructions
                  </label>
                  <p className="p-3 bg-white border border-[#E2DFD6] rounded-sm text-xs text-[#252A25]">
                    {selectedItem.designNotes}
                  </p>
                </div>

                {/* Status Selector */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] uppercase tracking-luxury text-[#315039] font-medium mb-1">
                      Update Stage *
                    </label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value as any)}
                      className="w-full px-3 py-2 bg-white border border-[#E2DFD6] rounded-sm text-xs text-[#252A25] focus:outline-none focus:border-[#176B45]"
                    >
                      <option value="new_enquiry">New Enquiry</option>
                      <option value="under_review">Under Review</option>
                      <option value="awaiting_clarification">Awaiting Clarification</option>
                      <option value="quotation_prepared">Quotation Prepared</option>
                      <option value="awaiting_customer_approval">Awaiting Customer Approval</option>
                      <option value="approved">Approved</option>
                      <option value="in_production">In Production</option>
                      <option value="completed">Completed</option>
                      <option value="declined">Declined</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase tracking-luxury text-[#315039] font-medium mb-1">
                      Estimated Quote (INR)
                    </label>
                    <input
                      type="number"
                      value={estimatedQuote}
                      onChange={(e) => setEstimatedQuote(e.target.value)}
                      placeholder="e.g. 28500"
                      className="w-full px-3 py-2 bg-white border border-[#E2DFD6] rounded-sm text-xs text-[#252A25] focus:outline-none focus:border-[#176B45]"
                    />
                  </div>
                </div>

                {/* Internal Admin Notes */}
                <div>
                  <label className="block text-[11px] uppercase tracking-luxury text-[#315039] font-medium mb-1">
                    Internal Atelier Notes
                  </label>
                  <textarea
                    rows={3}
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Log tailoring progress, weaver notes, or consultation follow-ups..."
                    className="w-full px-3 py-2 bg-white border border-[#E2DFD6] rounded-sm text-xs text-[#252A25] focus:outline-none focus:border-[#176B45]"
                  />
                </div>

                <div className="pt-4 border-t border-[#E2DFD6] flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedItem(null)}
                    className="px-4 py-2 border border-[#E2DFD6] text-[#74786F] rounded-sm hover:bg-[#EEEAE0]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="px-4 py-2 bg-[#176B45] text-white rounded-sm hover:bg-[#125837] uppercase tracking-luxury font-medium disabled:opacity-50"
                  >
                    {isUpdating ? "Saving..." : "Save Atelier Updates →"}
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

