"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/auth-context";
import { CustomerAddress, AddressInput } from "@/types/account";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MapPin,
  Plus,
  Edit2,
  Trash2,
  Check,
  CheckCircle2,
  X,
  Home,
  Briefcase,
  Building,
} from "lucide-react";

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Delhi",
];

export function AddressesView() {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<CustomerAddress | null>(null);

  // Form states
  const [recipientName, setRecipientName] = useState("");
  const [phone, setPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [landmark, setLandmark] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("Karnataka");
  const [postalCode, setPostalCode] = useState("");
  const [addressType, setAddressType] = useState<"home" | "work" | "other">("home");
  const [isDefault, setIsDefault] = useState(false);

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const loadAddresses = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/account/addresses?userId=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setAddresses(Array.isArray(data) ? data : []);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  const openAddModal = () => {
    setEditingAddress(null);
    setRecipientName(user?.fullName || "");
    setPhone(user?.phone || "");
    setAddressLine1("");
    setAddressLine2("");
    setLandmark("");
    setCity("");
    setState("Karnataka");
    setPostalCode("");
    setAddressType("home");
    setIsDefault(addresses.length === 0);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (addr: CustomerAddress) => {
    setEditingAddress(addr);
    setRecipientName(addr.recipientName);
    setPhone(addr.phone);
    setAddressLine1(addr.addressLine1);
    setAddressLine2(addr.addressLine2 || "");
    setLandmark(addr.landmark || "");
    setCity(addr.city);
    setState(addr.state);
    setPostalCode(addr.postalCode);
    setAddressType(addr.addressType as any);
    setIsDefault(addr.isDefault);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!recipientName.trim() || !phone.trim() || !addressLine1.trim() || !city.trim() || !postalCode.trim()) {
      setFormError("Please fill in all required fields marked with *.");
      return;
    }

    if (!/^[6-9]\d{9}$/.test(phone.trim())) {
      setFormError("Please enter a valid 10-digit Indian phone number.");
      return;
    }

    if (!/^\d{6}$/.test(postalCode.trim())) {
      setFormError("Please enter a valid 6-digit Indian PIN code.");
      return;
    }

    setSaving(true);
    try {
      if (editingAddress) {
        // Edit existing
        const res = await fetch("/api/account/addresses", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingAddress.id,
            userId: user?.id,
            recipientName,
            phone,
            addressLine1,
            addressLine2,
            landmark,
            city,
            state,
            postalCode,
            country: "India",
            addressType,
            isDefault,
          }),
        });

        if (res.ok) {
          setIsModalOpen(false);
          setNotification("Address updated successfully.");
          await loadAddresses();
        } else {
          const data = await res.json();
          setFormError(data.error || "Failed to update address.");
        }
      } else {
        // Add new
        const res = await fetch("/api/account/addresses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user?.id,
            recipientName,
            phone,
            addressLine1,
            addressLine2,
            landmark,
            city,
            state,
            postalCode,
            country: "India",
            addressType,
            isDefault,
          }),
        });

        if (res.ok) {
          setIsModalOpen(false);
          setNotification("New address saved to your address book.");
          await loadAddresses();
        } else {
          const data = await res.json();
          setFormError(data.error || "Failed to add address.");
        }
      }
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setSaving(false);
      setTimeout(() => setNotification(null), 4000);
    }
  };

  const handleDelete = async (addrId: string) => {
    if (!confirm("Are you sure you want to remove this delivery address?")) return;
    try {
      const res = await fetch(`/api/account/addresses?id=${addrId}&userId=${user?.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setNotification("Address removed from your address book.");
        await loadAddresses();
      }
    } catch {
      // Ignore
    } finally {
      setTimeout(() => setNotification(null), 4000);
    }
  };

  const handleSetDefault = async (addr: CustomerAddress) => {
    try {
      const res = await fetch("/api/account/addresses", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: addr.id,
          userId: user?.id,
          isDefault: true,
        }),
      });
      if (res.ok) {
        setNotification(`"${addr.recipientName}" set as default delivery address.`);
        await loadAddresses();
      }
    } catch {
      // Ignore
    } finally {
      setTimeout(() => setNotification(null), 4000);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "work":
        return <Briefcase className="w-3.5 h-3.5" />;
      case "other":
        return <Building className="w-3.5 h-3.5" />;
      case "home":
      default:
        return <Home className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#FAF9F5] border border-[#E2DFD6] p-6 rounded-sm">
        <div>
          <h3 className="text-lg font-serif text-[#176B45]">Saved Delivery Addresses</h3>
          <p className="text-xs text-[#555E55]">
            Save multiple addresses for express 1-click delivery at checkout.
          </p>
        </div>
        <Button
          onClick={openAddModal}
          className="self-start sm:self-auto bg-[#176B45] hover:bg-[#315039] text-white text-xs uppercase tracking-wide h-10 px-5 flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Add New Address
        </Button>
      </div>

      {notification && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Address Cards Grid */}
      {loading ? (
        <div className="py-12 text-center text-xs text-[#8C9388] animate-pulse">
          Loading addresses...
        </div>
      ) : addresses.length === 0 ? (
        <div className="bg-[#FAF9F5] border border-[#E2DFD6] rounded-sm p-12 text-center space-y-3">
          <MapPin className="w-10 h-10 text-[#8C9388] mx-auto stroke-[1.2]" />
          <h4 className="font-serif text-base text-[#252A25]">No Saved Addresses</h4>
          <p className="text-xs text-[#555E55] max-w-sm mx-auto">
            Add your primary residence or atelier destination so you can breeze through checkout.
          </p>
          <div className="pt-2">
            <Button
              onClick={openAddModal}
              className="bg-[#176B45] hover:bg-[#315039] text-white text-xs uppercase tracking-wide"
            >
              Add First Address
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`bg-[#FAF9F5] border rounded-sm p-5 flex flex-col justify-between transition-all ${
                addr.isDefault ? "border-[#176B45] shadow-sm ring-1 ring-[#176B45]/20" : "border-[#E2DFD6]"
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 uppercase tracking-wider text-[9px] font-bold bg-[#176B45]/10 text-[#176B45] rounded-full">
                      {getTypeIcon(addr.addressType)}
                      {addr.addressType}
                    </span>
                    {addr.isDefault && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold bg-[#AA9160]/20 text-[#554622] rounded-full">
                        <Check className="w-2.5 h-2.5" /> Default
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(addr)}
                      className="p-1.5 text-[#555E55] hover:text-[#176B45] transition-colors"
                      title="Edit Address"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(addr.id)}
                      className="p-1.5 text-[#555E55] hover:text-red-600 transition-colors"
                      title="Delete Address"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1 text-xs text-[#252A25]">
                  <p className="font-semibold text-sm text-[#176B45]">{addr.recipientName}</p>
                  <p className="text-[#555E55]">{addr.addressLine1}</p>
                  {addr.addressLine2 && <p className="text-[#555E55]">{addr.addressLine2}</p>}
                  {addr.landmark && (
                    <p className="text-[#8C9388] text-[11px]">Landmark: {addr.landmark}</p>
                  )}
                  <p className="text-[#555E55] font-medium">
                    {addr.city}, {addr.state} – {addr.postalCode}
                  </p>
                  <p className="text-[#555E55]">Phone: +91 {addr.phone}</p>
                </div>
              </div>

              {!addr.isDefault && (
                <div className="mt-4 pt-3 border-t border-[#E2DFD6] flex justify-end">
                  <button
                    onClick={() => handleSetDefault(addr)}
                    className="text-xs text-[#176B45] hover:text-[#AA9160] font-medium underline"
                  >
                    Set as default address
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal for Add / Edit Address */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#FAF9F5] border border-[#E2DFD6] rounded-sm shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2DFD6]">
              <h3 className="text-xl font-serif text-[#176B45]">
                {editingAddress ? "Edit Delivery Address" : "Add Delivery Address"}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-[#8C9388] hover:text-[#252A25]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-sm">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider font-medium text-[#252A25] mb-1">
                    Recipient Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    required
                    placeholder="e.g. Ananya Sharma"
                    className="h-10 text-xs bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider font-medium text-[#252A25] mb-1">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    maxLength={10}
                    placeholder="10-digit mobile"
                    className="h-10 text-xs bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider font-medium text-[#252A25] mb-1">
                  Address Line 1 (House/Flat, Building) <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  required
                  placeholder="e.g. Flat 402, Lotus Grandeur"
                  className="h-10 text-xs bg-white"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider font-medium text-[#252A25] mb-1">
                  Address Line 2 (Street, Area)
                </label>
                <Input
                  type="text"
                  value={addressLine2}
                  onChange={(e) => setAddressLine2(e.target.value)}
                  placeholder="e.g. 18th Cross, Indiranagar"
                  className="h-10 text-xs bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider font-medium text-[#252A25] mb-1">
                    Landmark (Optional)
                  </label>
                  <Input
                    type="text"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    placeholder="e.g. Near Defense Club"
                    className="h-10 text-xs bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider font-medium text-[#252A25] mb-1">
                    PIN Code <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    required
                    maxLength={6}
                    placeholder="6-digit PIN code"
                    className="h-10 text-xs bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider font-medium text-[#252A25] mb-1">
                    City <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                    placeholder="e.g. Bengaluru"
                    className="h-10 text-xs bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider font-medium text-[#252A25] mb-1">
                    State <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full h-10 px-3 bg-white border border-[#D5CFBF] text-xs rounded-sm focus:border-[#176B45] focus:outline-none"
                  >
                    {INDIAN_STATES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Address Type radio */}
              <div>
                <label className="block text-xs uppercase tracking-wider font-medium text-[#252A25] mb-2">
                  Address Type
                </label>
                <div className="flex gap-4">
                  {(["home", "work", "other"] as const).map((type) => (
                    <label key={type} className="flex items-center gap-1.5 cursor-pointer text-xs capitalize">
                      <input
                        type="radio"
                        name="addressType"
                        value={type}
                        checked={addressType === type}
                        onChange={() => setAddressType(type)}
                        className="text-[#176B45] focus:ring-[#176B45]"
                      />
                      <span>{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Set default toggle */}
              <label className="flex items-center gap-2 cursor-pointer pt-2">
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="rounded text-[#176B45] focus:ring-[#176B45]"
                />
                <span className="text-xs text-[#252A25]">
                  Set this address as my default delivery destination
                </span>
              </label>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E2DFD6]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-[#D5CFBF] text-xs rounded-sm hover:bg-white"
                >
                  Cancel
                </button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-[#176B45] hover:bg-[#315039] text-white text-xs uppercase tracking-wide h-10 px-6"
                >
                  {saving ? "Saving..." : editingAddress ? "Save Address" : "Add Address"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
