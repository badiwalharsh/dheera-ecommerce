import React from "react";
import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { ShieldCheck, Lock, Eye, Database, Sparkles } from "lucide-react";
import { BRAND } from "@/constants";

export const metadata: Metadata = {
  title: "Privacy Policy | DHEERA — Apparel & Lifestyle",
  description:
    "Review DHEERA privacy policy, encryption standards, payment data isolation, and our commitment to safeguarding patron personal information.",
  alternates: {
    canonical: "/privacy",
  },
};

export default function PrivacyPage() {
  return (
    <div className="bg-[#FAF9F5] text-[#252A25] py-14 sm:py-20 md:py-28 overflow-x-hidden">
      <Container size="default">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <span className="text-[10px] uppercase tracking-luxury text-[#AA9160] font-semibold block mb-2">
            Patron Trust & Data Protection
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif text-[#176B45]">
            Privacy Policy
          </h1>
          <p className="text-xs sm:text-sm text-[#74786F] leading-relaxed mt-3">
            At DHEERA — Apparel & Lifestyle, we regard patron trust as our most sacred asset. Discover how your personal data is protected, isolated, and respected.
          </p>
          <p className="text-[11px] text-[#AA9160] font-mono mt-2">
            Last Updated: October 31, 2026
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-8">
          {/* Summary Guarantees */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 bg-[#EEEAE0]/70 border border-[#E2DFD6] space-y-2 text-center">
              <Lock className="w-6 h-6 text-[#176B45] mx-auto" />
              <h3 className="font-serif text-base text-[#176B45]">Payment Isolation</h3>
              <p className="text-xs text-[#74786F]">Card & UPI credentials never touch our servers</p>
            </div>

            <div className="p-5 bg-[#EEEAE0]/70 border border-[#E2DFD6] space-y-2 text-center">
              <Eye className="w-6 h-6 text-[#176B45] mx-auto" />
              <h3 className="font-serif text-base text-[#176B45]">No Data Selling</h3>
              <p className="text-xs text-[#74786F]">We never rent or sell patron data to advertisers</p>
            </div>

            <div className="p-5 bg-[#EEEAE0]/70 border border-[#E2DFD6] space-y-2 text-center">
              <ShieldCheck className="w-6 h-6 text-[#176B45] mx-auto" />
              <h3 className="font-serif text-base text-[#176B45]">Encrypted Sessions</h3>
              <p className="text-xs text-[#74786F]">HTTP-only cryptographic session cookies</p>
            </div>
          </div>

          {/* Section 1: Information We Collect */}
          <div className="p-6 sm:p-8 bg-[#FAF9F5] border border-[#E2DFD6] space-y-4">
            <h2 className="font-serif text-xl sm:text-2xl text-[#176B45]">
              1. Information We Collect
            </h2>
            <p className="text-xs sm:text-sm text-[#74786F] leading-relaxed">
              We collect information strictly necessary to provide tailored e-commerce services, fulfill couture orders, and communicate regarding shipments:
            </p>
            <ul className="space-y-2 text-xs text-[#74786F] pl-4 list-disc">
              <li>
                <strong className="text-[#252A25]">Patron Contact Details: </strong> Full name, verified email address, telephone contact, and delivery addresses.
              </li>
              <li>
                <strong className="text-[#252A25]">Order & Atelier History: </strong> Details of garments purchased, order totals, transaction references, bespoke sizing choices, and wishlist items.
              </li>
              <li>
                <strong className="text-[#252A25]">Device & Technical Telemetry: </strong> IP addresses, browser client type, and encrypted session cookies required for authentication and shopping bag persistence.
              </li>
            </ul>
          </div>

          {/* Section 2: Complete Payment Gateway Isolation */}
          <div className="p-6 sm:p-8 bg-[#FAF9F5] border border-[#E2DFD6] space-y-4">
            <h2 className="font-serif text-xl sm:text-2xl text-[#176B45] flex items-center gap-2">
              <Lock className="w-5 h-5 text-[#AA9160]" />
              <span>2. Payment Security & Zero Card Storage</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#74786F] leading-relaxed">
              DHEERA adheres to strict payment security separation. All payment transactions are handled through our PCI-DSS Level 1 compliant gateway provider (Razorpay):
            </p>
            <div className="p-4 bg-[#EEEAE0]/60 border-l-2 border-[#176B45] text-xs text-[#74786F] space-y-2">
              <p>
                <strong>We NEVER store or process complete debit/credit card numbers, CVVs, expiry dates, or UPI PINs on DHEERA web servers or databases.</strong>
              </p>
              <p>
                Payment callbacks are independently verified on our backend using cryptographic HMAC-SHA256 signatures before any order is marked confirmed.
              </p>
            </div>
          </div>

          {/* Section 3: How Your Data is Used */}
          <div className="p-6 sm:p-8 bg-[#FAF9F5] border border-[#E2DFD6] space-y-4">
            <h2 className="font-serif text-xl sm:text-2xl text-[#176B45]">
              3. Purpose & Use of Data
            </h2>
            <p className="text-xs sm:text-sm text-[#74786F] leading-relaxed">
              We use your information exclusively for the following lawful business purposes:
            </p>
            <ul className="space-y-2 text-xs text-[#74786F] pl-4 list-disc">
              <li>Processing, tailoring, packaging, and dispatching your garments.</li>
              <li>Sharing delivery coordinates with verified courier partners (Blue Dart, Delhivery) for doorstep delivery.</li>
              <li>Providing real-time dispatch updates, tracking notifications, and order confirmations.</li>
              <li>Delivering our curated seasonal newsletter (strictly when opted in, with one-click unsubscribe).</li>
            </ul>
          </div>

          {/* Section 4: Cookies & Session Security */}
          <div className="p-6 sm:p-8 bg-[#FAF9F5] border border-[#E2DFD6] space-y-4">
            <h2 className="font-serif text-xl sm:text-2xl text-[#176B45]">
              4. Cookies & Security Controls
            </h2>
            <p className="text-xs sm:text-sm text-[#74786F] leading-relaxed">
              We employ essential HTTP-only cookies and local storage tokens for shopping bag persistence, customer authentication sessions, and CSRF protection. We do not employ intrusive third-party cross-site behavioral tracking scripts.
            </p>
          </div>

          {/* Section 5: Patron Rights & Data Deletion */}
          <div className="p-6 sm:p-8 bg-[#FAF9F5] border border-[#E2DFD6] space-y-4">
            <h2 className="font-serif text-xl sm:text-2xl text-[#176B45]">
              5. Your Rights & Account Deletion
            </h2>
            <p className="text-xs sm:text-sm text-[#74786F] leading-relaxed">
              Under applicable Indian and international data protection principles, patrons have the right to access, rectify, download, or request the permanent deletion of their customer profile and address book. Inquiries may be addressed to our Data Privacy Officer at <a href={`mailto:${BRAND.contactEmail}`} className="text-[#176B45] underline font-medium">{BRAND.contactEmail}</a>.
            </p>
          </div>

          {/* Launch Status Notice */}
          <div className="p-6 bg-[#EEEAE0] border border-[#AA9160]/40 text-center space-y-2">
            <div className="flex items-center justify-center gap-1.5 text-[#176B45] text-xs font-semibold uppercase tracking-luxury">
              <Sparkles className="w-3.5 h-3.5 text-[#AA9160]" />
              <span>Corporate Registration & Governance Notice</span>
            </div>
            <p className="text-xs text-[#74786F] max-w-xl mx-auto">
              This Privacy Policy reflects DHEERA pre-launch operational security standards. Registered corporate entity name, registered office address, and jurisdiction details will be updated upon final company incorporation before commercial operations commence.
            </p>
          </div>
        </div>
      </Container>
    </div>
  );
}

