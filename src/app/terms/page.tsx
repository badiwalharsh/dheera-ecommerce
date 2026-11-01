import React from "react";
import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { FileText, Shield, AlertCircle, Sparkles } from "lucide-react";
import { BRAND } from "@/constants";

export const metadata: Metadata = {
  title: "Terms & Conditions | DHEERA — Apparel & Lifestyle",
  description:
    "Review legal terms, intellectual property protections, handloom craft characteristics, and ordering terms for DHEERA — Apparel & Lifestyle.",
  alternates: {
    canonical: "/terms",
  },
};

export default function TermsPage() {
  return (
    <div className="bg-[#FAF9F5] text-[#252A25] py-14 sm:py-20 md:py-28 overflow-x-hidden">
      <Container size="default">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <span className="text-[10px] uppercase tracking-luxury text-[#AA9160] font-semibold block mb-2">
            Legal & Storefront Terms
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif text-[#176B45]">
            Terms & Conditions
          </h1>
          <p className="text-xs sm:text-sm text-[#74786F] leading-relaxed mt-3">
            Please read these terms and conditions carefully before browsing or placing orders on DHEERA — Apparel & Lifestyle.
          </p>
          <p className="text-[11px] text-[#AA9160] font-mono mt-2">
            Effective Date: October 31, 2026
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-8">
          {/* Section 1: Intellectual Property & Brand Ownership */}
          <div className="p-6 sm:p-8 bg-[#FAF9F5] border border-[#E2DFD6] space-y-4">
            <h2 className="font-serif text-xl sm:text-2xl text-[#176B45] flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#AA9160]" />
              <span>1. Intellectual Property & Proprietary Rights</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#74786F] leading-relaxed">
              All garment designs, silhouette sketches, product photography, editorial copy, logos, trademarks, website layouts, and source code are the exclusive intellectual property of <strong>DHEERA — Apparel & Lifestyle</strong>.
            </p>
            <p className="text-xs sm:text-sm text-[#74786F] leading-relaxed">
              No portion of this website or our proprietary fashion designs may be reproduced, copied, reverse-engineered, distributed, or commercially exploited without prior written authorization from DHEERA.
            </p>
          </div>

          {/* Section 2: Handcrafted & Handloom Characteristics */}
          <div className="p-6 sm:p-8 bg-[#FAF9F5] border border-[#E2DFD6] space-y-4">
            <h2 className="font-serif text-xl sm:text-2xl text-[#176B45]">
              2. Handloom Weaves & Color Representation
            </h2>
            <p className="text-xs sm:text-sm text-[#74786F] leading-relaxed">
              Our ensembles are handcrafted using heritage Indian artisanal techniques including hand-spinning, pit-loom weaving, hand-block printing, and hand zari embroidery:
            </p>
            <div className="p-4 bg-[#EEEAE0]/60 border-l-2 border-[#AA9160] text-xs text-[#74786F] space-y-2">
              <p>
                <strong>Natural Artisanal Hallmarks: </strong>
                Subtle irregularities in weave density, slub yarns, natural dye variations, and motif alignment are the intrinsic characteristics of authentic Indian handloom textiles and are celebrated as marks of craftsmanship rather than defects.
              </p>
              <p>
                While we make every effort to display garment colours accurately, slight variations may arise due to individual monitor display calibrations and studio lighting conditions.
              </p>
            </div>
          </div>

          {/* Section 3: Orders, Pricing & Server Calculation */}
          <div className="p-6 sm:p-8 bg-[#FAF9F5] border border-[#E2DFD6] space-y-4">
            <h2 className="font-serif text-xl sm:text-2xl text-[#176B45]">
              3. Orders, Pricing & Payment Terms
            </h2>
            <p className="text-xs sm:text-sm text-[#74786F] leading-relaxed">
              All prices are displayed in Indian Rupees (₹ INR) and include applicable local taxes unless explicitly stated otherwise.
            </p>
            <ul className="space-y-2 text-xs text-[#74786F] pl-4 list-disc">
              <li>
                <strong>Server-Authoritative Pricing: </strong>
                All shopping bag prices, coupon eligibility, shipping tiers, and order totals are calculated independently on our secure backend. Any client-side price modification is strictly rejected by our payment validation engine.
              </li>
              <li>
                <strong>Order Confirmation: </strong>
                An order is confirmed only after our backend independently verifies successful payment capture through cryptographic gateway callbacks.
              </li>
              <li>
                <strong>Stock Reservation & Overselling Guard: </strong>
                Inventory deductions occur atomically upon payment verification. In the rare event of concurrent stock depletion, affected patrons will receive an immediate refund or made-to-order fulfillment option.
              </li>
            </ul>
          </div>

          {/* Section 4: User Accounts & Security */}
          <div className="p-6 sm:p-8 bg-[#FAF9F5] border border-[#E2DFD6] space-y-4">
            <h2 className="font-serif text-xl sm:text-2xl text-[#176B45]">
              4. Patron Accounts & Access
            </h2>
            <p className="text-xs sm:text-sm text-[#74786F] leading-relaxed">
              Patrons are responsible for maintaining the confidentiality of their account credentials. You agree to notify us immediately of any unauthorized account activity. DHEERA reserves the right to suspend or terminate accounts that violate website security or engage in fraudulent activities.
            </p>
          </div>

          {/* Section 5: Governing Law & Dispute Resolution */}
          <div className="p-6 sm:p-8 bg-[#FAF9F5] border border-[#E2DFD6] space-y-4">
            <h2 className="font-serif text-xl sm:text-2xl text-[#176B45]">
              5. Governing Law & Jurisdiction
            </h2>
            <p className="text-xs sm:text-sm text-[#74786F] leading-relaxed">
              These Terms & Conditions are governed by and construed in accordance with the laws of India. Any legal disputes arising out of the use of this website or orders placed through it shall be subject to the exclusive jurisdiction of the competent courts in India.
            </p>
            <div className="p-3 bg-[#EEEAE0]/60 border border-[#E2DFD6] text-[11px] font-mono text-[#74786F]">
              <p>Corporate Entity: [Pending Final Business Incorporation]</p>
              <p>GSTIN: [To be added upon GST registration]</p>
              <p>Grievance Officer: care@dheera.in</p>
            </div>
          </div>

          {/* Launch Status Notice */}
          <div className="p-6 bg-[#EEEAE0] border border-[#AA9160]/40 text-center space-y-2">
            <div className="flex items-center justify-center gap-1.5 text-[#176B45] text-xs font-semibold uppercase tracking-luxury">
              <Sparkles className="w-3.5 h-3.5 text-[#AA9160]" />
              <span>Pre-Launch Regulatory Notice</span>
            </div>
            <p className="text-xs text-[#74786F] max-w-xl mx-auto">
              These Terms & Conditions reflect our pre-launch operational architecture. Specific corporate registration details, GSTIN identification, and grievance officer coordinates will be finalized and published prior to commercial public launch.
            </p>
          </div>
        </div>
      </Container>
    </div>
  );
}

