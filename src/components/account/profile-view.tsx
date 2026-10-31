"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Phone, Mail, Lock, CheckCircle2, ShieldCheck } from "lucide-react";

export function ProfileView() {
  const { user, updateProfile, changePassword } = useAuth();

  // Profile fields
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Password fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess(null);
    setProfileError(null);

    if (!fullName.trim()) {
      setProfileError("Full name is required.");
      return;
    }

    if (phone.trim() && !/^[6-9]\d{9}$/.test(phone.trim())) {
      setProfileError("Please enter a valid 10-digit Indian mobile number.");
      return;
    }

    setProfileSaving(true);
    const res = await updateProfile(fullName, phone.trim() || undefined);
    setProfileSaving(false);

    if (res.success) {
      setProfileSuccess("Your profile details have been updated successfully.");
      setTimeout(() => setProfileSuccess(null), 4000);
    } else {
      setProfileError(res.error || "Failed to update profile.");
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccess(null);
    setPasswordError(null);

    if (!newPassword || newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    setPasswordSaving(true);
    const res = await changePassword(currentPassword, newPassword);
    setPasswordSaving(false);

    if (res.success) {
      setPasswordSuccess("Your password has been changed securely.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordSuccess(null), 4000);
    } else {
      setPasswordError(res.error || "Failed to change password.");
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. Personal Information Card */}
      <div className="bg-[#FAF9F5] border border-[#E2DFD6] rounded-sm p-6 sm:p-8">
        <div className="mb-6 pb-4 border-b border-[#E2DFD6]">
          <h3 className="text-lg font-serif text-[#176B45]">Personal Information</h3>
          <p className="text-xs text-[#555E55]">
            Manage your personal profile details and contact information.
          </p>
        </div>

        {profileSuccess && (
          <div className="mb-6 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{profileSuccess}</span>
          </div>
        )}

        {profileError && (
          <div className="mb-6 p-3.5 bg-red-50/80 border border-red-200 text-red-700 text-xs rounded-sm">
            {profileError}
          </div>
        )}

        <form onSubmit={handleProfileSubmit} className="space-y-5 max-w-lg">
          <div>
            <label className="block text-xs uppercase tracking-wider font-medium text-[#252A25] mb-1.5">
              Full Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Patron Name"
                required
                className="pl-10 h-11 bg-white border-[#D5CFBF] focus:border-[#176B45] text-sm"
              />
              <User className="w-4 h-4 text-[#8C9388] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs uppercase tracking-wider font-medium text-[#252A25]">
                Email Address
              </label>
              <span className="inline-flex items-center gap-1 text-[10px] text-[#176B45] font-semibold">
                <ShieldCheck className="w-3 h-3" /> Verified Patron
              </span>
            </div>
            <div className="relative">
              <Input
                type="email"
                value={user?.email || ""}
                disabled
                className="pl-10 h-11 bg-[#EEEAE0]/50 border-[#D5CFBF] text-[#555E55] text-sm cursor-not-allowed"
              />
              <Mail className="w-4 h-4 text-[#8C9388] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <span className="text-[10px] text-[#8C9388] mt-1 block">
              Email changes must be requested through patron support to ensure order integrity.
            </span>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider font-medium text-[#252A25] mb-1.5">
              Mobile Number
            </label>
            <div className="relative">
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="10-digit mobile number"
                maxLength={10}
                className="pl-10 h-11 bg-white border-[#D5CFBF] focus:border-[#176B45] text-sm"
              />
              <Phone className="w-4 h-4 text-[#8C9388] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <span className="text-[10px] text-[#8C9388] mt-1 block">
              Used for delivery coordination and courier tracking alerts via SMS / WhatsApp.
            </span>
          </div>

          <Button
            type="submit"
            disabled={profileSaving}
            className="h-10 bg-[#176B45] hover:bg-[#315039] text-white text-xs uppercase tracking-wide px-6"
          >
            {profileSaving ? "Saving..." : "Save Profile Details"}
          </Button>
        </form>
      </div>

      {/* 2. Security & Password Update Card */}
      <div className="bg-[#FAF9F5] border border-[#E2DFD6] rounded-sm p-6 sm:p-8">
        <div className="mb-6 pb-4 border-b border-[#E2DFD6]">
          <h3 className="text-lg font-serif text-[#176B45]">Security & Password</h3>
          <p className="text-xs text-[#555E55]">
            Keep your account secure by using a strong, unique password.
          </p>
        </div>

        {passwordSuccess && (
          <div className="mb-6 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{passwordSuccess}</span>
          </div>
        )}

        {passwordError && (
          <div className="mb-6 p-3.5 bg-red-50/80 border border-red-200 text-red-700 text-xs rounded-sm">
            {passwordError}
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-lg">
          <div>
            <label className="block text-xs uppercase tracking-wider font-medium text-[#252A25] mb-1.5">
              Current Password (Optional)
            </label>
            <div className="relative">
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="pl-10 h-11 bg-white border-[#D5CFBF] focus:border-[#176B45] text-sm"
              />
              <Lock className="w-4 h-4 text-[#8C9388] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider font-medium text-[#252A25] mb-1.5">
              New Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                required
                minLength={6}
                className="pl-10 h-11 bg-white border-[#D5CFBF] focus:border-[#176B45] text-sm"
              />
              <Lock className="w-4 h-4 text-[#8C9388] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider font-medium text-[#252A25] mb-1.5">
              Confirm New Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                required
                minLength={6}
                className="pl-10 h-11 bg-white border-[#D5CFBF] focus:border-[#176B45] text-sm"
              />
              <Lock className="w-4 h-4 text-[#8C9388] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <Button
            type="submit"
            disabled={passwordSaving}
            className="h-10 bg-[#176B45] hover:bg-[#315039] text-white text-xs uppercase tracking-wide px-6"
          >
            {passwordSaving ? "Updating Password..." : "Update Password"}
          </Button>
        </form>
      </div>
    </div>
  );
}

