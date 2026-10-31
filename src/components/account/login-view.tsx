"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Lock, Mail, ArrowRight, ShieldCheck } from "lucide-react";

export function LoginView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/account";

  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage("Please enter both your email address and password.");
      return;
    }

    setSubmitting(true);
    const res = await login(email, password);
    setSubmitting(false);

    if (res.success) {
      router.push(redirect);
    } else {
      setErrorMessage(res.error || "Invalid email or password. Please try again.");
    }
  };

  return (
    <div className="py-12 sm:py-20 bg-[#EEEAE0]/50">
      <Container size="narrow">
        <div className="bg-[#FAF9F5] border border-[#E2DFD6] shadow-sm p-6 sm:p-10 rounded-sm">
          {/* Header */}
          <div className="text-center max-w-sm mx-auto mb-8 space-y-2">
            <span className="text-[10px] uppercase tracking-luxury text-[#176B45] font-semibold">
              Patron Portal
            </span>
            <h1 className="text-3xl sm:text-4xl font-serif text-[#176B45]">
              Welcome Back
            </h1>
            <p className="text-xs sm:text-sm text-[#555E55]">
              Sign in to view your orders, saved atelier addresses, and personal wishlist.
            </p>
          </div>

          {/* Quick Demo Helper */}
          <div className="mb-6 p-3 bg-[#EEEAE0]/70 border border-[#D5CFBF] text-[11px] text-[#315039] rounded-sm flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 mt-0.5 text-[#176B45] flex-shrink-0" />
            <div>
              <span className="font-semibold">Demo Evaluation Credentials:</span>
              <div className="mt-0.5 text-[#252A25]">
                Email: <button type="button" onClick={() => { setEmail("patron@dheera.in"); setPassword("Patron@123"); }} className="underline hover:text-[#176B45]">patron@dheera.in</button> &nbsp;|&nbsp; Password: <code className="bg-white/70 px-1 py-0.5 rounded">Patron@123</code>
              </div>
            </div>
          </div>

          {/* Error Notification */}
          {errorMessage && (
            <div className="mb-6 p-3.5 bg-red-50/80 border border-red-200 text-red-700 text-xs rounded-sm">
              {errorMessage}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs uppercase tracking-wider font-medium text-[#252A25] mb-1.5">
                Email Address <span className="text-red-500">*</span>
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

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs uppercase tracking-wider font-medium text-[#252A25]">
                  Password <span className="text-red-500">*</span>
                </label>
                <Link
                  href="/account/forgot-password"
                  className="text-xs text-[#176B45] hover:text-[#AA9160] transition-colors underline"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
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

            <Button
              type="submit"
              disabled={submitting || isLoading}
              className="w-full h-11 bg-[#176B45] hover:bg-[#315039] text-[#FAF9F5] font-medium tracking-wide text-xs uppercase transition-colors"
            >
              {submitting ? "Signing In..." : "Sign In to Account"}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </form>

          {/* Social login divider */}
          <div className="mt-8 relative text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#E2DFD6]" />
            </div>
            <div className="relative inline-block px-3 bg-[#FAF9F5] text-[11px] uppercase tracking-wider text-[#8C9388]">
              Or Continue With
            </div>
          </div>

          <div className="mt-4">
            <button
              type="button"
              onClick={() => {
                setErrorMessage("Google OAuth is enabled in production when Supabase Google provider keys are configured.");
              }}
              className="w-full h-11 border border-[#D5CFBF] hover:bg-white text-xs font-medium text-[#252A25] flex items-center justify-center gap-2 rounded-sm transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              Sign In with Google
            </button>
          </div>

          {/* Footer Register Link */}
          <div className="mt-8 text-center pt-6 border-t border-[#E2DFD6] text-xs text-[#555E55]">
            New to DHEERA?{" "}
            <Link
              href={`/account/register${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ""}`}
              className="text-[#176B45] font-semibold hover:text-[#AA9160] transition-colors underline ml-1"
            >
              Create a Patron Account
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
}
