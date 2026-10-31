"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Lock, CheckCircle2 } from "lucide-react";

export function ResetPasswordView() {
  const router = useRouter();
  const { resetPassword, isLoading } = useAuth();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!newPassword || newPassword.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    const res = await resetPassword(newPassword);
    setSubmitting(false);

    if (res.success) {
      setSuccess(true);
    } else {
      setErrorMessage(res.error || "Password reset failed. The reset token may have expired.");
    }
  };

  return (
    <div className="py-12 sm:py-20 bg-[#EEEAE0]/50">
      <Container size="narrow">
        <div className="bg-[#FAF9F5] border border-[#E2DFD6] shadow-sm p-6 sm:p-10 rounded-sm">
          <div className="text-center max-w-sm mx-auto mb-8 space-y-2">
            <span className="text-[10px] uppercase tracking-luxury text-[#176B45] font-semibold">
              Security
            </span>
            <h1 className="text-3xl sm:text-4xl font-serif text-[#176B45]">
              Set New Password
            </h1>
            <p className="text-xs sm:text-sm text-[#555E55]">
              Please choose a new, secure password for your DHEERA account.
            </p>
          </div>

          {success ? (
            <div className="p-6 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-sm space-y-4 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <h3 className="font-serif text-xl font-medium">Password Updated</h3>
              <p className="text-xs text-emerald-800">
                Your password has been securely updated. You can now sign in with your new credentials.
              </p>
              <div className="pt-2">
                <Button
                  onClick={() => router.push("/account/login")}
                  className="bg-[#176B45] hover:bg-[#315039] text-white text-xs uppercase tracking-wide px-8"
                >
                  Sign In Now
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && (
                <div className="p-3.5 bg-red-50/80 border border-red-200 text-red-700 text-xs rounded-sm">
                  {errorMessage}
                </div>
              )}

              <div>
                <label className="block text-xs uppercase tracking-wider font-medium text-[#252A25] mb-1.5">
                  New Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    required
                    minLength={6}
                    className="pl-10 pr-10 h-11 bg-white border-[#D5CFBF] focus:border-[#176B45] text-sm"
                  />
                  <Lock className="w-4 h-4 text-[#8C9388] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8C9388] hover:text-[#252A25] p-1"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider font-medium text-[#252A25] mb-1.5">
                  Confirm New Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    required
                    minLength={6}
                    className="pl-10 pr-10 h-11 bg-white border-[#D5CFBF] focus:border-[#176B45] text-sm"
                  />
                  <Lock className="w-4 h-4 text-[#8C9388] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <Button
                type="submit"
                disabled={submitting || isLoading}
                className="w-full h-11 bg-[#176B45] hover:bg-[#315039] text-[#FAF9F5] font-medium tracking-wide text-xs uppercase transition-colors"
              >
                {submitting ? "Updating Password..." : "Update Password"}
              </Button>

              <div className="pt-2 text-center">
                <Link
                  href="/account/login"
                  className="text-xs text-[#555E55] hover:text-[#176B45] underline"
                >
                  Return to Sign In
                </Link>
              </div>
            </form>
          )}
        </div>
      </Container>
    </div>
  );
}
