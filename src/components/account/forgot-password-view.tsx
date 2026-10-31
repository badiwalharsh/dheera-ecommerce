"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";

export function ForgotPasswordView() {
  const { requestPasswordReset, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim()) {
      setErrorMessage("Please enter your registered email address.");
      return;
    }

    setSubmitting(true);
    const res = await requestPasswordReset(email);
    setSubmitting(false);

    if (res.success) {
      setSent(true);
    } else {
      setErrorMessage(res.error || "Unable to send password reset email. Please try again.");
    }
  };

  return (
    <div className="py-12 sm:py-20 bg-[#EEEAE0]/50">
      <Container size="narrow">
        <div className="bg-[#FAF9F5] border border-[#E2DFD6] shadow-sm p-6 sm:p-10 rounded-sm">
          <div className="text-center max-w-sm mx-auto mb-8 space-y-2">
            <span className="text-[10px] uppercase tracking-luxury text-[#176B45] font-semibold">
              Security Assistance
            </span>
            <h1 className="text-3xl sm:text-4xl font-serif text-[#176B45]">
              Reset Password
            </h1>
            <p className="text-xs sm:text-sm text-[#555E55]">
              Enter the email associated with your DHEERA account and we will send you a secure link to reset your password.
            </p>
          </div>

          {sent ? (
            <div className="p-6 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-sm space-y-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
                <h3 className="font-serif text-lg font-medium">Reset Link Dispatched</h3>
              </div>
              <p className="text-xs leading-relaxed text-emerald-800">
                If an account exists for <strong className="font-semibold">{email}</strong>, you will receive an email shortly with instructions on how to create a new password.
              </p>
              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setSent(false)}
                  className="text-xs text-emerald-900 underline hover:text-emerald-700"
                >
                  Didn&apos;t receive email? Try again
                </button>
                <Link
                  href="/account/login"
                  className="text-xs text-[#176B45] font-semibold hover:underline"
                >
                  Return to Sign In
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {errorMessage && (
                <div className="p-3.5 bg-red-50/80 border border-red-200 text-red-700 text-xs rounded-sm">
                  {errorMessage}
                </div>
              )}

              <div>
                <label className="block text-xs uppercase tracking-wider font-medium text-[#252A25] mb-1.5">
                  Registered Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="patron@dheera.in"
                    required
                    className="pl-10 h-11 bg-white border-[#D5CFBF] focus:border-[#176B45] text-sm"
                  />
                  <Mail className="w-4 h-4 text-[#8C9388] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <Button
                type="submit"
                disabled={submitting || isLoading}
                className="w-full h-11 bg-[#176B45] hover:bg-[#315039] text-[#FAF9F5] font-medium tracking-wide text-xs uppercase transition-colors"
              >
                {submitting ? "Sending Link..." : "Send Reset Link"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>

              <div className="pt-4 text-center">
                <Link
                  href="/account/login"
                  className="inline-flex items-center text-xs text-[#555E55] hover:text-[#176B45] transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                  Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </div>
      </Container>
    </div>
  );
}
