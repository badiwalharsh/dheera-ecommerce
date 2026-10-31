"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Lock, Mail, User, Phone, ArrowRight, CheckCircle2 } from "lucide-react";

export function RegisterView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/account";

  const { register, isLoading } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessInfo(null);

    if (!fullName.trim() || !email.trim() || !password) {
      setErrorMessage("Please complete all mandatory fields.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match. Please verify.");
      return;
    }

    if (phone.trim() && !/^[6-9]\d{9}$/.test(phone.trim())) {
      setErrorMessage("Please provide a valid 10-digit Indian phone number.");
      return;
    }

    setSubmitting(true);
    const res = await register(fullName, email, password, phone.trim() || undefined);
    setSubmitting(false);

    if (res.success) {
      if (res.requiresEmailVerification) {
        setSuccessInfo(
          "A verification link has been sent to your email. Please verify your email to complete activation."
        );
      } else {
        router.push(redirect);
      }
    } else {
      setErrorMessage(res.error || "Registration could not be completed. Please try again.");
    }
  };

  return (
    <div className="py-12 sm:py-20 bg-[#EEEAE0]/50">
      <Container size="narrow">
        <div className="bg-[#FAF9F5] border border-[#E2DFD6] shadow-sm p-6 sm:p-10 rounded-sm">
          {/* Header */}
          <div className="text-center max-w-sm mx-auto mb-8 space-y-2">
            <span className="text-[10px] uppercase tracking-luxury text-[#176B45] font-semibold">
              Patron Membership
            </span>
            <h1 className="text-3xl sm:text-4xl font-serif text-[#176B45]">
              Create an Account
            </h1>
            <p className="text-xs sm:text-sm text-[#555E55]">
              Experience handcrafted couture, express checkout, order tracking, and curated updates.
            </p>
          </div>

          {/* Verification Notification */}
          {successInfo && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-sm flex items-start gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Verification Email Sent</p>
                <p className="mt-1">{successInfo}</p>
                <div className="mt-3">
                  <Link
                    href={`/account/login${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ""}`}
                    className="underline font-semibold hover:text-emerald-950"
                  >
                    Proceed to Sign In
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Error Notification */}
          {errorMessage && (
            <div className="mb-6 p-3.5 bg-red-50/80 border border-red-200 text-red-700 text-xs rounded-sm">
              {errorMessage}
            </div>
          )}

          {/* Form */}
          {!successInfo && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider font-medium text-[#252A25] mb-1.5">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Ananya Sharma"
                    required
                    className="pl-10 h-11 bg-white border-[#D5CFBF] focus:border-[#176B45] text-sm"
                  />
                  <User className="w-4 h-4 text-[#8C9388] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider font-medium text-[#252A25] mb-1.5">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="patron@domain.com"
                    required
                    className="pl-10 h-11 bg-white border-[#D5CFBF] focus:border-[#176B45] text-sm"
                  />
                  <Mail className="w-4 h-4 text-[#8C9388] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider font-medium text-[#252A25] mb-1.5">
                  Mobile Number (Optional)
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
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider font-medium text-[#252A25] mb-1.5">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    required
                    minLength={6}
                    className="pl-10 pr-10 h-11 bg-white border-[#D5CFBF] focus:border-[#176B45] text-sm"
                  />
                  <Lock className="w-4 h-4 text-[#8C9388] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div className="pt-2 text-[11px] text-[#555E55] leading-relaxed">
                By creating an account, you agree to DHEERA’s Terms of Service and Privacy Policy. Any past guest orders placed with this email will be linked automatically.
              </div>

              <Button
                type="submit"
                disabled={submitting || isLoading}
                className="w-full h-11 bg-[#176B45] hover:bg-[#315039] text-[#FAF9F5] font-medium tracking-wide text-xs uppercase transition-colors"
              >
                {submitting ? "Creating Account..." : "Create Patron Account"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </form>
          )}

          {/* Footer Login Link */}
          <div className="mt-8 text-center pt-6 border-t border-[#E2DFD6] text-xs text-[#555E55]">
            Already have a patron account?{" "}
            <Link
              href={`/account/login${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ""}`}
              className="text-[#176B45] font-semibold hover:text-[#AA9160] transition-colors underline ml-1"
            >
              Sign In Here
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
}
