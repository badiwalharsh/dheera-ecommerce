"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AdminLayout } from "@/components/admin/admin-layout";
import { ConfirmedOrderDetails } from "@/types/cart";

interface CustomerRow {
  id: string;
  email: string;
  name: string;
  phone?: string;
  registeredAt: string;
  totalOrders: number;
  totalSpend: number;
  lastOrderDate?: string;
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRow | null>(null);
  const [customerOrders, setCustomerOrders] = useState<ConfirmedOrderDetails[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  useEffect(() => {
    const fetchCustomers = async () => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/admin/customers");
        if (res.ok) {
          const data = await res.json();
          setCustomers(data.customers || []);
        }
      } catch {
        // Error
      } finally {
        setIsLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  const handleSelectCustomer = async (cust: CustomerRow) => {
    setSelectedCustomer(cust);
    setLoadingOrders(true);
    try {
      const res = await fetch(`/api/admin/customers/${cust.id}`);
      if (res.ok) {
        const data = await res.json();
        setCustomerOrders(data.orders || []);
      }
    } catch {
      // Error
    } finally {
      setLoadingOrders(false);
    }
  };

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      (c.phone && c.phone.includes(search))
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E2DFD6] gap-4">
          <div>
            <span className="text-[10px] uppercase tracking-luxury text-[#AA9160] font-semibold block">
              PATRON DIRECTORY
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl text-[#176B45]">
              Customer Profiles & Order History
            </h1>
            <p className="text-xs text-[#74786F] mt-0.5">
              Secure customer relationships, verified purchase histories, and total spend analytics.
            </p>
          </div>

          <div className="p-2.5 bg-[#FAF9F5] border border-[#E2DFD6] rounded-sm text-center">
            <span className="text-[9px] uppercase tracking-luxury text-[#74786F] block">Registered Patrons</span>
            <span className="font-serif text-lg text-[#176B45] font-semibold">{customers.length}</span>
          </div>
        </div>

        {/* Search */}
        <div className="bg-[#FAF9F5] border border-[#E2DFD6] p-4 rounded-sm">
          <input
            type="text"
            placeholder="Search patrons by name, email, or telephone number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:max-w-md px-3 py-2 bg-white border border-[#E2DFD6] rounded-sm text-xs text-[#252A25] focus:outline-none focus:border-[#176B45]"
          />
        </div>

        {/* Customer Table */}
        <div className="bg-[#FAF9F5] border border-[#E2DFD6] rounded-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#EEEAE0]/70 border-b border-[#E2DFD6] text-[10px] uppercase tracking-luxury text-[#74786F]">
                <tr>
                  <th className="py-3 px-4">Patron Name</th>
                  <th className="py-3 px-4">Contact Details</th>
                  <th className="py-3 px-4">Member Since</th>
                  <th className="py-3 px-4">Total Orders</th>
                  <th className="py-3 px-4">Lifetime Spend</th>
                  <th className="py-3 px-4">Last Activity</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2DFD6]/60">
                {filtered.length > 0 ? (
                  filtered.map((c) => (
                    <tr key={c.id} className="hover:bg-white/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-[#176B45]/15 text-[#176B45] flex items-center justify-center font-serif text-xs font-semibold">
                            {c.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-[#176B45]">{c.name}</p>
                            <span className="text-[10px] text-[#AA9160] font-mono">ID: {c.id.slice(0, 8)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-[#252A25]">{c.email}</p>
                        <p className="text-[10px] text-[#74786F]">{c.phone || "No phone recorded"}</p>
                      </td>
                      <td className="py-3 px-4 text-[#74786F]">
                        {new Date(c.registeredAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-3 px-4 text-[#252A25] font-medium">
                        {c.totalOrders} order(s)
                      </td>
                      <td className="py-3 px-4 font-semibold text-[#176B45]">
                        ₹{c.totalSpend.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-4 text-[#74786F] text-[11px]">
                        {c.lastOrderDate
                          ? new Date(c.lastOrderDate).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                            })
                          : "None"}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleSelectCustomer(c)}
                          className="px-3 py-1.5 bg-[#EEEAE0] hover:bg-[#176B45] hover:text-white rounded-sm text-[11px] text-[#315039] font-medium transition-colors"
                        >
                          View History →
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[#74786F]">
                      {isLoading ? "Loading customer directory..." : "No patrons found."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: Customer Profile & Order History */}
        {selectedCustomer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-[#FAF9F5] border border-[#E2DFD6] rounded-sm max-w-2xl w-full p-6 shadow-xl max-h-[85vh] flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-[#E2DFD6] mb-4">
                <div>
                  <h3 className="font-serif text-lg text-[#176B45]">{selectedCustomer.name}</h3>
                  <p className="text-xs text-[#74786F]">{selectedCustomer.email}</p>
                </div>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="text-[#74786F] hover:text-[#252A25]"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 text-xs pr-1">
                {/* Stats Summary */}
                <div className="grid grid-cols-3 gap-3 p-3 bg-white border border-[#E2DFD6] rounded-sm text-center">
                  <div>
                    <span className="text-[10px] text-[#74786F] uppercase block">Lifetime Orders</span>
                    <span className="font-serif text-lg text-[#176B45] font-semibold">
                      {selectedCustomer.totalOrders}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#74786F] uppercase block">Total Spend</span>
                    <span className="font-serif text-lg text-[#176B45] font-semibold">
                      ₹{selectedCustomer.totalSpend.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#74786F] uppercase block">Phone</span>
                    <span className="text-xs text-[#252A25] font-medium block mt-1">
                      {selectedCustomer.phone || "—"}
                    </span>
                  </div>
                </div>

                {/* Orders List */}
                <div>
                  <h4 className="font-serif text-sm text-[#176B45] mb-2">Purchase History</h4>
                  {loadingOrders ? (
                    <p className="text-[#74786F] py-4 text-center">Loading customer purchases...</p>
                  ) : customerOrders.length > 0 ? (
                    <div className="space-y-2">
                      {customerOrders.map((ord) => (
                        <div
                          key={ord.id}
                          className="p-3 bg-white border border-[#E2DFD6] rounded-sm flex items-center justify-between"
                        >
                          <div>
                            <Link
                              href={`/admin/orders/${ord.orderNumber}`}
                              className="font-medium text-[#176B45] hover:underline"
                            >
                              {ord.orderNumber}
                            </Link>
                            <p className="text-[10px] text-[#74786F]">
                              {ord.items.map((i) => i.name).join(", ")}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="font-semibold text-[#252A25] block">
                              ₹{(ord.pricing.total || 0).toLocaleString("en-IN")}
                            </span>
                            <span className="text-[10px] text-[#AA9160] uppercase">
                              {ord.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[#74786F] py-4 text-center">No purchases recorded yet.</p>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-[#E2DFD6] flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedCustomer(null)}
                  className="px-4 py-2 bg-[#176B45] text-white rounded-sm text-xs uppercase tracking-luxury hover:bg-[#125837]"
                >
                  Close Window
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

