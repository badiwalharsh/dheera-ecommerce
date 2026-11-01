import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Truck, ShieldCheck, Clock, Globe, Sparkles, ArrowRight } from "lucide-react";
import { BRAND } from "@/constants";

export const metadata: Metadata = {
  title: "Shipping & Delivery Policy | DHEERA — Apparel & Lifestyle",
  description:
    "Review domestic and international shipping policies, dispatch timelines, and complimentary delivery thresholds for DHEERA handcrafted apparel.",
  alternates: {
    canonical: "/shipping",
  },
};

export default function ShippingPage() {
  return (
    <div className="bg-[#FAF9F5] text-[#252A25] py-14 sm:py-20 md:py-28 overflow-x-hidden">
      <Container size="default">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <span className="text-[10px] uppercase tracking-luxury text-[#AA9160] font-semibold block mb-2">
            Client Logistics
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif text-[#176B45]">
            Shipping & Delivery Policy
          </h1>
          <p className="text-xs sm:text-sm text-[#74786F] leading-relaxed mt-3">
            Handcrafted with patience, dispatched with care. Discover how we deliver DHEERA ensembles across India and worldwide.
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-8">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 bg-[#EEEAE0]/70 border border-[#E2DFD6] space-y-2 text-center">
              <Truck className="w-6 h-6 text-[#176B45] mx-auto" />
              <h3 className="font-serif text-base text-[#176B45]">Complimentary Shipping</h3>
              <p className="text-xs text-[#74786F]">Provisional on domestic orders above ₹5,000*</p>
            </div>

            <div className="p-5 bg-[#EEEAE0]/70 border border-[#E2DFD6] space-y-2 text-center">
              <Clock className="w-6 h-6 text-[#176B45] mx-auto" />
              <h3 className="font-serif text-base text-[#176B45]">Ready to Ship</h3>
              <p className="text-xs text-[#74786F]">Target dispatch in 2–3 business days*</p>
            </div>

            <div className="p-5 bg-[#EEEAE0]/70 border border-[#E2DFD6] space-y-2 text-center">
              <ShieldCheck className="w-6 h-6 text-[#176B45] mx-auto" />
              <h3 className="font-serif text-base text-[#176B45]">Insured Transit</h3>
              <p className="text-xs text-[#74786F]">Tamper-evident packaging standards</p>
            </div>
          </div>

          {/* Section 1: Pan-India Delivery Timelines */}
          <div className="p-6 sm:p-8 bg-[#FAF9F5] border border-[#E2DFD6] space-y-4">
            <h2 className="font-serif text-xl sm:text-2xl text-[#176B45]">
              1. Domestic Shipping Timelines
            </h2>
            <p className="text-xs sm:text-sm text-[#74786F] leading-relaxed">
              Every DHEERA piece is hand-finished, inspected for zari precision, and pressed before leaving our workshop. Dispatch and transit times vary based on whether your garment is ready-to-ship or tailored made-to-order:
            </p>
            <ul className="space-y-2.5 text-xs text-[#74786F] pl-4 list-disc">
              <li>
                <strong className="text-[#252A25]">Ready-to-Ship Pieces: </strong>
                Estimated dispatch within 2–3 business days following payment confirmation (subject to workshop volume).
              </li>
              <li>
                <strong className="text-[#252A25]">Made-to-Order & Customised Ensembles: </strong>
                Require approximately 7–10 working days of tailoring and hand-finishing before dispatch.
              </li>
              <li>
                <strong className="text-[#252A25]">Estimated Transit Time: </strong>
                Express courier transit typically takes 2–4 business days depending on destination PIN code.
              </li>
            </ul>
          </div>

          {/* Section 2: Shipping Rates & Thresholds */}
          <div className="p-6 sm:p-8 bg-[#FAF9F5] border border-[#E2DFD6] space-y-4">
            <h2 className="font-serif text-xl sm:text-2xl text-[#176B45]">
              2. Domestic Shipping Rates
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-[#E2DFD6]">
                <thead className="bg-[#EEEAE0] text-[#176B45] font-serif uppercase tracking-luxury text-[10px]">
                  <tr>
                    <th className="p-3 border-b border-[#E2DFD6]">Order Subtotal</th>
                    <th className="p-3 border-b border-[#E2DFD6]">Delivery Method</th>
                    <th className="p-3 border-b border-[#E2DFD6]">Shipping Fee</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2DFD6] text-[#74786F]">
                  <tr>
                    <td className="p-3 font-medium text-[#252A25]">Orders Above ₹5,000*</td>
                    <td className="p-3">Pan-India Express Air</td>
                    <td className="p-3 font-semibold text-[#176B45]">FREE (Provisional Complimentary)</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-[#252A25]">Orders Below ₹5,000*</td>
                    <td className="p-3">Pan-India Standard Air</td>
                    <td className="p-3 font-medium text-[#252A25]">₹150 Flat Fee (Provisional Baseline)</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-[10px] text-[#AA9160] italic">
              * Note: Free-shipping threshold and standard shipping rates represent pre-launch operational defaults subject to final merchant confirmation.
            </p>
          </div>

          {/* Section 3: Order Tracking & Courier Partners */}
          <div className="p-6 sm:p-8 bg-[#FAF9F5] border border-[#E2DFD6] space-y-4">
            <h2 className="font-serif text-xl sm:text-2xl text-[#176B45]">
              3. Courier Logistics & Order Tracking
            </h2>
            <p className="text-xs sm:text-sm text-[#74786F] leading-relaxed">
              We partner with recognized domestic courier carriers to ensure secure parcel delivery. As soon as your parcel is handed over to the courier partner, an email notification with an unguessable tracking link is issued. (Specific contracted carrier partner selections will be formally announced upon launch).
            </p>
            <p className="text-xs sm:text-sm text-[#74786F] leading-relaxed">
              Registered patrons can also follow their parcel across our 6-stage atelier timeline: <em>Placed ➔ Confirmed ➔ Processing ➔ Dispatched ➔ In Transit ➔ Delivered</em>.
            </p>
          </div>

          {/* Section 4: International Delivery */}
          <div className="p-6 sm:p-8 bg-[#FAF9F5] border border-[#E2DFD6] space-y-4">
            <h2 className="font-serif text-xl sm:text-2xl text-[#176B45] flex items-center gap-2">
              <Globe className="w-5 h-5 text-[#AA9160]" />
              <span>4. Worldwide International Shipping</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#74786F] leading-relaxed">
              We ship handcrafted Indian heritage ensembles to patrons globally. International consignments are arranged with premier express courier networks.
            </p>
            <p className="text-xs text-[#74786F] leading-relaxed">
              <strong className="text-[#252A25]">Customs & Import Duties: </strong>
              Any customs duties, import tariffs, or local VAT assessed by the destination country are the sole responsibility of the customer.
            </p>
          </div>

          {/* Launch Status Notice */}
          <div className="p-6 bg-[#EEEAE0] border border-[#AA9160]/40 text-center space-y-2">
            <div className="flex items-center justify-center gap-1.5 text-[#176B45] text-xs font-semibold uppercase tracking-luxury">
              <Sparkles className="w-3.5 h-3.5 text-[#AA9160]" />
              <span>Commercial Policy Notice</span>
            </div>
            <p className="text-xs text-[#74786F] max-w-xl mx-auto">
              Shipping fees, partner courier networks, and delivery transit timelines stated above reflect our active pre-launch operational parameters and will receive final formal business sign-off prior to commercial activation.
            </p>
          </div>
        </div>
      </Container>
    </div>
  );
}

