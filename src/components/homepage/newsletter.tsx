"use client";

import React, { useState } from "react";
import { Container } from "@/components/ui/container";
import { BRAND } from "@/constants";
import { CheckCircle2, ArrowRight } from "lucide-react";

interface NewsletterProps {
  heading?: string;
  description?: string;
}

export function Newsletter({ heading, description }: NewsletterProps = {}) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email.trim() || !emailRegex.test(email)) {
      setStatus("error");
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    setStatus("success");
    setErrorMessage("");
    setEmail("");
  };

  return (
    <section className="py-14 sm:py-20 md:py-24 bg-[#EEEAE0] border-b border-[#E2DFD6] overflow-x-hidden">
      <Container size="default">
        <div className="max-w-2xl mx-auto text-center w-full">
          <span className="text-[9px] sm:text-[10px] uppercase tracking-luxury text-[#AA9160] font-semibold block mb-1.5 sm:mb-2">
            The Journal & Edits
          </span>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif text-[#176B45] mb-2 sm:mb-4 break-words">
            {heading || "A Little DHEERA in Your Inbox."}
          </h2>

          <p className="text-xs sm:text-sm text-[#74786F] leading-relaxed mb-6 sm:mb-8 max-w-lg mx-auto break-words">
            {description || "Receive intimate previews of upcoming collection drops, artisanal stories, and bespoke styling inspiration."}
          </p>

          {status === "success" ? (
            <div className="p-4 sm:p-6 bg-[#FAF9F5] border border-[#176B45] text-center animate-fade-in">
              <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-[#176B45] mx-auto mb-2" />
              <h4 className="font-serif text-base sm:text-lg text-[#176B45] mb-1">
                Welcome to DHEERA
              </h4>
              <p className="text-xs text-[#74786F]">
                Thank you for subscribing. We look forward to sharing our latest handcrafted edits with you.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3 w-full max-w-md mx-auto">
              <div className="flex flex-col sm:flex-row gap-2 w-full">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (status === "error") setStatus("idle");
                  }}
                  placeholder="Enter your email address..."
                  aria-label="Email address for newsletter"
                  className="w-full flex-1 min-w-0 bg-[#FAF9F5] border border-[#E2DFD6] px-3.5 sm:px-4 py-2.5 sm:py-3 text-xs text-[#252A25] placeholder:text-[#74786F]/60 focus:outline-none focus:border-[#176B45] transition-colors"
                />
                <button
                  type="submit"
                  className="w-full sm:w-auto bg-[#176B45] hover:bg-[#315039] text-[#FAF9F5] px-5 sm:px-6 py-2.5 sm:py-3 text-xs uppercase tracking-luxury font-medium transition-colors flex items-center justify-center gap-1.5 flex-shrink-0"
                >
                  <span>Subscribe</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {status === "error" && (
                <p className="text-xs text-red-700 text-center">{errorMessage}</p>
              )}

              <p className="text-[9px] sm:text-[10px] text-[#74786F]/80 uppercase tracking-luxury pt-1 sm:pt-2">
                Curated quarterly. No spam. Unsubscribe at any time.
              </p>
            </form>
          )}

          <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-[#E2DFD6] flex justify-center items-center gap-4 sm:gap-6 text-[9px] sm:text-[10px] uppercase tracking-luxury text-[#AA9160] flex-wrap">
            <span>{BRAND.philosophy}</span>
            <span>✦</span>
            <span>Instagram {BRAND.instagram}</span>
          </div>
        </div>
      </Container>
    </section>
  );
}
