"use client";

import React, { useState, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Container } from "@/components/ui/container";
import { Scissors, Ruler, Sparkles, Send, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck } from "lucide-react";
import { BRAND } from "@/constants";

function BespokeCustomForm() {
  const searchParams = useSearchParams();
  const refProduct = searchParams.get("ref") || "";

  const [formData, setFormData] = useState({
    customerName: "",
    email: "",
    phone: "",
    category: refProduct ? `Customisation for: ${refProduct}` : "Kurta Sets",
    preferredColour: "",
    preferredFabric: "Authentic Chanderi Silk",
    occasion: "Festive Celebration",
    designNotes: "",
    bust: "",
    waist: "",
    hip: "",
    shoulder: "",
    length: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [createdRefNumber, setCreatedRefNumber] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus("idle");
    setErrorMessage("");

    try {
      const payload = {
        customerName: formData.customerName,
        email: formData.email,
        phone: formData.phone,
        category: formData.category,
        preferredColour: formData.preferredColour,
        preferredFabric: formData.preferredFabric,
        occasion: formData.occasion,
        designNotes: formData.designNotes,
        measurements: {
          bust: formData.bust ? `${formData.bust} inches` : "Standard",
          waist: formData.waist ? `${formData.waist} inches` : "Standard",
          hip: formData.hip ? `${formData.hip} inches` : "Standard",
          shoulder: formData.shoulder ? `${formData.shoulder} inches` : "Standard",
          length: formData.length ? `${formData.length} inches` : "Standard",
        },
      };

      const res = await fetch("/api/customizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setStatus("success");
        setCreatedRefNumber(data.requestNumber);
      } else {
        setStatus("error");
        setErrorMessage(data.error || "Unable to submit bespoke inquiry. Please try again.");
      }
    } catch {
      setStatus("error");
      setErrorMessage("Network error occurred. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#FAF9F5] text-[#252A25] py-14 sm:py-20 md:py-28 overflow-x-hidden">
      <Container size="default">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 text-[10px] sm:text-[11px] uppercase tracking-luxury text-[#176B45] font-semibold bg-[#EEEAE0] px-3.5 py-1 rounded-full border border-[#E2DFD6] mb-3">
            <Sparkles className="w-3.5 h-3.5 text-[#AA9160]" />
            <span>The DHEERA Bespoke Atelier</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif text-[#176B45] leading-tight">
            Made Personal, Just for You.
          </h1>

          <p className="text-xs sm:text-sm md:text-base text-[#74786F] leading-relaxed mt-4 max-w-xl mx-auto">
            Your vision, our generational craft. Discover Indian silhouettes tailored to your bespoke measurements, necklines, sleeve lengths, and handloom textile preferences.
          </p>
        </div>

        {/* 4-Step Atelier Process */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-14 sm:mb-20">
          <div className="p-5 sm:p-6 bg-[#EEEAE0]/60 border border-[#E2DFD6] space-y-2">
            <span className="text-xs font-serif text-[#AA9160] font-bold">01</span>
            <h3 className="font-serif text-base text-[#176B45]">Design Consultation</h3>
            <p className="text-xs text-[#74786F]">
              Submit your silhouette inspirations, preferred colourways, and bespoke measurements.
            </p>
          </div>

          <div className="p-5 sm:p-6 bg-[#EEEAE0]/60 border border-[#E2DFD6] space-y-2">
            <span className="text-xs font-serif text-[#AA9160] font-bold">02</span>
            <h3 className="font-serif text-base text-[#176B45]">Fabric & Palette Curation</h3>
            <p className="text-xs text-[#74786F]">
              Select from authentic Chanderi silks, handwoven mulmul, or organza drapes.
            </p>
          </div>

          <div className="p-5 sm:p-6 bg-[#EEEAE0]/60 border border-[#E2DFD6] space-y-2">
            <span className="text-xs font-serif text-[#AA9160] font-bold">03</span>
            <h3 className="font-serif text-base text-[#176B45]">Artisanal Handcrafting</h3>
            <p className="text-xs text-[#74786F]">
              Tailored and hand-finished with care (target timeline: approximately 7–10 business days).
            </p>
          </div>

          <div className="p-5 sm:p-6 bg-[#EEEAE0]/60 border border-[#E2DFD6] space-y-2">
            <span className="text-xs font-serif text-[#AA9160] font-bold">04</span>
            <h3 className="font-serif text-base text-[#176B45]">Atelier Quality & Delivery</h3>
            <p className="text-xs text-[#74786F]">
              Inspected, carefully packaged in DHEERA heirloom boxes, and delivered via express courier.
            </p>
          </div>
        </div>

        {/* Consultation Form & Visual Showcase Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start">
          {/* Visual Showcase Panel */}
          <div className="lg:col-span-5 space-y-6">
            <div className="relative aspect-[3/4] bg-[#EEEAE0] border border-[#E2DFD6] overflow-hidden shadow-lg w-full">
              <Image
                src="/images/banners/category-kurta.jpg"
                alt="DHEERA Bespoke Atelier Tailoring"
                fill
                priority
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 40vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 right-4 sm:right-6 p-4 bg-[#FAF9F5]/95 backdrop-blur-sm border border-[#AA9160]/40">
                <span className="text-[9px] uppercase tracking-luxury text-[#176B45] font-semibold block mb-0.5">
                  Handcrafted with Intention
                </span>
                <p className="font-serif text-xs sm:text-sm text-[#252A25]">
                  Every seam, border, and zari piping tailored to your personal aesthetic.
                </p>
              </div>
            </div>

            <div className="p-6 bg-[#EEEAE0]/70 border border-[#E2DFD6] space-y-3">
              <h3 className="font-serif text-base text-[#176B45] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#AA9160]" />
                <span>Complimentary Alteration Guarantee</span>
              </h3>
              <p className="text-xs text-[#74786F] leading-relaxed">
                If your bespoke ensemble requires minor adjustments to drape flawlessly, DHEERA provides complimentary atelier alterations within 14 days of delivery.
              </p>
            </div>
          </div>

          {/* Consultation Form */}
          <div className="lg:col-span-7 bg-[#FAF9F5] p-6 sm:p-8 lg:p-10 border border-[#E2DFD6] shadow-sm">
            <h2 className="font-serif text-xl sm:text-2xl text-[#176B45] mb-2">
              Request a Bespoke Consultation
            </h2>
            <p className="text-xs text-[#74786F] mb-6">
              Complete the form below. An atelier stylist will review your measurements and reach out with a personalized quotation and textile swatch options.
            </p>

            {status === "success" ? (
              <div className="p-6 sm:p-8 bg-[#EEEAE0] border border-[#176B45] text-center space-y-3 animate-fade-in">
                <CheckCircle2 className="w-10 h-10 text-[#176B45] mx-auto" />
                <h3 className="font-serif text-xl text-[#176B45]">
                  Consultation Request Received
                </h3>
                <p className="text-xs text-[#252A25] font-medium">
                  Reference ID: <span className="font-mono text-[#176B45]">{createdRefNumber}</span>
                </p>
                <p className="text-xs text-[#74786F] max-w-md mx-auto">
                  Thank you, {formData.customerName || "Patron"}. Our atelier master will examine your tailoring notes and connect with you within 24–48 hours via email or WhatsApp.
                </p>
                <div className="pt-2">
                  <Link
                    href="/shop"
                    className="inline-block px-6 py-2.5 bg-[#176B45] text-white text-xs uppercase tracking-luxury hover:bg-[#315039]"
                  >
                    Return to Catalogue
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {status === "error" && (
                  <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Section A: Contact Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] uppercase tracking-luxury text-[#252A25] font-semibold mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.customerName}
                      onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                      placeholder="e.g. Ananya Sharma"
                      className="w-full px-3.5 py-2.5 bg-[#FAF9F5] border border-[#E2DFD6] text-xs text-[#252A25] focus:outline-none focus:border-[#176B45]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase tracking-luxury text-[#252A25] font-semibold mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="e.g. ananya@example.com"
                      className="w-full px-3.5 py-2.5 bg-[#FAF9F5] border border-[#E2DFD6] text-xs text-[#252A25] focus:outline-none focus:border-[#176B45]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] uppercase tracking-luxury text-[#252A25] font-semibold mb-1">
                      Phone Number (WhatsApp Preferred) *
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+91 98765 43210"
                      className="w-full px-3.5 py-2.5 bg-[#FAF9F5] border border-[#E2DFD6] text-xs text-[#252A25] focus:outline-none focus:border-[#176B45]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase tracking-luxury text-[#252A25] font-semibold mb-1">
                      Silhouette Style
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-[#FAF9F5] border border-[#E2DFD6] text-xs text-[#252A25] focus:outline-none focus:border-[#176B45]"
                    >
                      <option value="Kurta Sets">Handcrafted Kurta Set</option>
                      <option value="Sarees">Pure Handloom Saree & Blouse</option>
                      <option value="Suits">Flared Anarkali Suit</option>
                      <option value="Dupattas">Artisanal Heirloom Dupatta</option>
                      <option value="Bridal/Festive">Bridal & Festive Bespoke Ensemble</option>
                    </select>
                  </div>
                </div>

                {/* Section B: Sizing Measurements (Inches) */}
                <div className="pt-2 border-t border-[#E2DFD6]">
                  <span className="block text-[11px] uppercase tracking-luxury text-[#AA9160] font-semibold mb-2">
                    Custom Body Measurements (Inches)
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                    <div>
                      <label className="block text-[10px] text-[#74786F] mb-1">Bust</label>
                      <input
                        type="text"
                        placeholder="e.g. 36"
                        value={formData.bust}
                        onChange={(e) => setFormData({ ...formData, bust: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-[#FAF9F5] border border-[#E2DFD6] text-xs text-center"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-[#74786F] mb-1">Waist</label>
                      <input
                        type="text"
                        placeholder="e.g. 30"
                        value={formData.waist}
                        onChange={(e) => setFormData({ ...formData, waist: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-[#FAF9F5] border border-[#E2DFD6] text-xs text-center"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-[#74786F] mb-1">Hip</label>
                      <input
                        type="text"
                        placeholder="e.g. 40"
                        value={formData.hip}
                        onChange={(e) => setFormData({ ...formData, hip: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-[#FAF9F5] border border-[#E2DFD6] text-xs text-center"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-[#74786F] mb-1">Shoulder</label>
                      <input
                        type="text"
                        placeholder="e.g. 14.5"
                        value={formData.shoulder}
                        onChange={(e) => setFormData({ ...formData, shoulder: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-[#FAF9F5] border border-[#E2DFD6] text-xs text-center"
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-[10px] text-[#74786F] mb-1">Length</label>
                      <input
                        type="text"
                        placeholder="e.g. 44"
                        value={formData.length}
                        onChange={(e) => setFormData({ ...formData, length: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-[#FAF9F5] border border-[#E2DFD6] text-xs text-center"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-[#74786F] mt-1.5">
                    * If you prefer standard sizing, you can leave these blank and specify your standard size in the notes below.
                  </p>
                </div>

                {/* Section C: Styling Notes */}
                <div>
                  <label className="block text-[11px] uppercase tracking-luxury text-[#252A25] font-semibold mb-1">
                    Custom Styling & Fit Notes *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={formData.designNotes}
                    onChange={(e) => setFormData({ ...formData, designNotes: e.target.value })}
                    placeholder="Specify preferred neckline (e.g. V-neck, keyhole, boat neck), sleeve cut (3/4, full, sleeveless), trouser style (cigarette, palazzo, churidar), or occasion details..."
                    className="w-full px-3.5 py-2.5 bg-[#FAF9F5] border border-[#E2DFD6] text-xs text-[#252A25] focus:outline-none focus:border-[#176B45]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-8 py-3 bg-[#176B45] hover:bg-[#315039] text-[#FAF9F5] text-xs uppercase tracking-luxury font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? "Submitting Inquiry..." : "Submit Bespoke Request"}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
}

export default function BespokeCustomPage() {
  return (
    <Suspense
      fallback={
        <div className="py-24 text-center">
          <p className="text-xs uppercase tracking-luxury text-[#176B45] font-semibold">
            Loading Bespoke Atelier...
          </p>
        </div>
      }
    >
      <BespokeCustomForm />
    </Suspense>
  );
}


