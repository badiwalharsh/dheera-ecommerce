import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { RefreshCw, ShieldAlert, Sparkles, CheckCircle2, ArrowRight } from "lucide-react";
import { BRAND } from "@/constants";

export const metadata: Metadata = {
  title: "Returns & Exchanges Policy | DHEERA — Apparel & Lifestyle",
  description:
    "Learn about DHEERA size exchanges, eligibility criteria for handcrafted garments, and bespoke tailoring alteration support.",
  alternates: {
    canonical: "/returns",
  },
};

export default function ReturnsPage() {
  return (
    <div className="bg-[#FAF9F5] text-[#252A25] py-14 sm:py-20 md:py-28 overflow-x-hidden">
      <Container size="default">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <span className="text-[10px] uppercase tracking-luxury text-[#AA9160] font-semibold block mb-2">
            Patron Assurance
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif text-[#176B45]">
            Returns & Exchanges Policy
          </h1>
          <p className="text-xs sm:text-sm text-[#74786F] leading-relaxed mt-3">
            Every DHEERA garment is made with devotion. We want you to feel extraordinary in your ensemble and are pleased to assist with size exchanges.
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-8">
          {/* Key Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 bg-[#EEEAE0]/70 border border-[#E2DFD6] space-y-2 text-center">
              <RefreshCw className="w-6 h-6 text-[#176B45] mx-auto" />
              <h3 className="font-serif text-base text-[#176B45]">7-Day Size Exchange*</h3>
              <p className="text-xs text-[#74786F]">Provisional policy from parcel delivery date</p>
            </div>

            <div className="p-5 bg-[#EEEAE0]/70 border border-[#E2DFD6] space-y-2 text-center">
              <CheckCircle2 className="w-6 h-6 text-[#176B45] mx-auto" />
              <h3 className="font-serif text-base text-[#176B45]">Unworn Condition</h3>
              <p className="text-xs text-[#74786F]">With original tags & packaging intact</p>
            </div>

            <div className="p-5 bg-[#EEEAE0]/70 border border-[#E2DFD6] space-y-2 text-center">
              <Sparkles className="w-6 h-6 text-[#176B45] mx-auto" />
              <h3 className="font-serif text-base text-[#176B45]">Alteration Support</h3>
              <p className="text-xs text-[#74786F]">Bespoke atelier fit consultation</p>
            </div>
          </div>

          {/* Section 1: Standard Catalog Garment Size Exchange */}
          <div className="p-6 sm:p-8 bg-[#FAF9F5] border border-[#E2DFD6] space-y-4">
            <h2 className="font-serif text-xl sm:text-2xl text-[#176B45]">
              1. Size Exchange Eligibility (Provisional Guidelines)
            </h2>
            <p className="text-xs sm:text-sm text-[#74786F] leading-relaxed">
              Standard catalog garments ordered from DHEERA (such as standard XS through XXL kurta sets and suits) are provisionally planned for a one-time complimentary size exchange within <strong>7 calendar days</strong> of parcel delivery (subject to final merchant policy confirmation upon commercial launch), provided:
            </p>
            <ul className="space-y-2 text-xs text-[#74786F] pl-4 list-disc">
              <li>The garment is completely unworn, unwashed, unaltered, and free of perfume or stains.</li>
              <li>All original designer fabric security tags, branding labels, and garment tags remain firmly attached.</li>
              <li>The ensemble is returned in its original DHEERA luxury box with any accompanying dupatta and trousers.</li>
            </ul>
          </div>

          {/* Section 2: Bespoke & Custom Orders Policy */}
          <div className="p-6 sm:p-8 bg-[#FAF9F5] border border-[#E2DFD6] space-y-4">
            <h2 className="font-serif text-xl sm:text-2xl text-[#176B45]">
              2. Custom-Tailored & Bespoke Pieces
            </h2>
            <p className="text-xs sm:text-sm text-[#74786F] leading-relaxed">
              Ensembles crafted to personal measurements, customized neckline depths, bespoke sleeve cuts, or made-to-order colourways are cut and embroidered exclusively for you.
            </p>
            <div className="p-4 bg-[#EEEAE0]/60 border-l-2 border-[#AA9160] text-xs text-[#74786F] space-y-1">
              <p className="font-medium text-[#252A25]">Bespoke Final Sale & Alteration Guarantee:</p>
              <p>
                Bespoke garments are final sale and cannot be returned for cash refunds. However, if your bespoke garment requires minor tailoring adjustments to achieve the ideal fit, DHEERA provides complimentary atelier alteration support within 14 days of delivery.
              </p>
            </div>
          </div>

          {/* Section 3: Damaged or Defective Deliveries */}
          <div className="p-6 sm:p-8 bg-[#FAF9F5] border border-[#E2DFD6] space-y-4">
            <h2 className="font-serif text-xl sm:text-2xl text-[#176B45] flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-[#AA9160]" />
              <span>3. Damaged or Incorrect Garments</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#74786F] leading-relaxed">
              Every garment undergoes three-stage quality inspection prior to dispatch. In the rare event that a package arrives damaged in transit or differs from your order, please notify us within <strong>48 hours</strong> of receipt by sending high-resolution photographs to <a href={`mailto:${BRAND.contactEmail}`} className="text-[#176B45] underline font-medium">{BRAND.contactEmail}</a>.
            </p>
            <p className="text-xs text-[#74786F] leading-relaxed">
              Upon visual verification, our concierge will immediately schedule a priority reverse pick-up and fast-track an expedited replacement piece at no additional expense.
            </p>
          </div>

          {/* Section 4: How to Initiate an Exchange */}
          <div className="p-6 sm:p-8 bg-[#FAF9F5] border border-[#E2DFD6] space-y-4">
            <h2 className="font-serif text-xl sm:text-2xl text-[#176B45]">
              4. How to Initiate a Size Exchange
            </h2>
            <ol className="space-y-3 text-xs text-[#74786F] list-decimal pl-4">
              <li>
                <strong>Submit Your Request: </strong>
                Email our concierge at <a href={`mailto:${BRAND.contactEmail}`} className="text-[#176B45] font-medium">{BRAND.contactEmail}</a> with your Order ID (e.g. <code>DHR-20261031-1001</code>) and desired replacement size.
              </li>
              <li>
                <strong>Reverse Courier Pick-Up: </strong>
                Our team will schedule a secure doorstep courier pickup from your delivery address.
              </li>
              <li>
                <strong>Quality Inspection & Re-Dispatch: </strong>
                Once received at our facility and verified, your replacement size will be hand-tailored or dispatched within 3–5 business days.
              </li>
            </ol>
          </div>

          {/* Launch Notice */}
          <div className="p-6 bg-[#EEEAE0] border border-[#AA9160]/40 text-center space-y-2">
            <div className="flex items-center justify-center gap-1.5 text-[#176B45] text-xs font-semibold uppercase tracking-luxury">
              <Sparkles className="w-3.5 h-3.5 text-[#AA9160]" />
              <span>Commercial Launch Policy Note</span>
            </div>
            <p className="text-xs text-[#74786F] max-w-xl mx-auto">
              Reverse courier pick-up PIN code coverage, refund processing windows, and regional exchange transit times reflect pre-launch specifications subject to final business sign-off prior to commercial store opening.
            </p>
          </div>
        </div>
      </Container>
    </div>
  );
}

