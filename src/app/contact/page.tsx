"use client";

import React, { useState } from "react";
import { Container } from "@/components/ui/container";
import { BRAND } from "@/constants";
import { Mail, Clock, Phone, MapPin, Send, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    subject: "General Inquiry",
    message: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus("idle");
    setErrorMessage("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setStatus("success");
        setFormData({
          fullName: "",
          email: "",
          phone: "",
          subject: "General Inquiry",
          message: "",
        });
      } else {
        setStatus("error");
        setErrorMessage(data.error || "Failed to submit inquiry. Please try again.");
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
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <span className="text-[10px] uppercase tracking-luxury text-[#AA9160] font-semibold block mb-2">
            Client Concierge & Inquiries
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif text-[#176B45]">
            Connect with DHEERA
          </h1>
          <p className="text-xs sm:text-sm text-[#74786F] leading-relaxed mt-3">
            Whether inquiring about order timelines, bespoke measurements, bridal edits, or artisanal styling consultations, our team is here to assist you.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start">
          {/* Left Column: Direct Contact Information */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-[#EEEAE0]/70 p-6 sm:p-8 border border-[#E2DFD6] space-y-6">
              <h2 className="font-serif text-xl sm:text-2xl text-[#176B45]">
                Concierge Desk
              </h2>
              <p className="text-xs text-[#74786F] leading-relaxed">
                Dedicated support for all patron orders, custom tailoring consultations, and general business correspondence.
              </p>

              <div className="space-y-4 pt-2">
                {/* Email */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#FAF9F5] flex items-center justify-center text-[#176B45] flex-shrink-0 border border-[#E2DFD6]">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs uppercase tracking-luxury font-medium text-[#252A25]">
                      Email Inquiries
                    </h3>
                    <a
                      href={`mailto:${BRAND.contactEmail}`}
                      className="text-xs text-[#176B45] hover:text-[#AA9160] transition-colors font-medium"
                    >
                      {BRAND.contactEmail}
                    </a>
                    <p className="text-[10px] text-[#74786F] mt-0.5">Inquiries attended to during concierge business hours</p>
                  </div>
                </div>

                {/* Operating Hours */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#FAF9F5] flex items-center justify-center text-[#176B45] flex-shrink-0 border border-[#E2DFD6]">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs uppercase tracking-luxury font-medium text-[#252A25]">
                      Concierge Hours
                    </h3>
                    <p className="text-xs text-[#74786F]">{BRAND.contactHours}</p>
                    <p className="text-[10px] text-[#74786F] mt-0.5">Closed on National Public Holidays</p>
                  </div>
                </div>

                {/* Phone Consultation */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#FAF9F5] flex items-center justify-center text-[#176B45] flex-shrink-0 border border-[#E2DFD6]">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs uppercase tracking-luxury font-medium text-[#252A25]">
                      Telephone & WhatsApp
                    </h3>
                    <p className="text-xs font-mono text-[#74786F]">{BRAND.contactPhone}</p>
                    <p className="text-[10px] text-[#AA9160] italic mt-0.5">
                      * Direct voice & WhatsApp lines pending business owner allocation
                    </p>
                  </div>
                </div>
              </div>

              {/* Verified Location & Corporate Status Notice */}
              <div className="pt-4 border-t border-[#E2DFD6] space-y-2">
                <div className="flex items-start gap-2 text-xs text-[#74786F]">
                  <MapPin className="w-4 h-4 text-[#AA9160] flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-[#252A25]">Showroom Coordinates: </strong>
                    <span className="font-mono text-[11px] text-[#74786F] block mt-0.5">
                      [Pending Business Owner Input — Registered office & showroom location to be confirmed]
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bespoke Prompt */}
            <div className="p-5 bg-[#176B45] text-[#FAF9F5] flex items-center justify-between gap-4">
              <div>
                <span className="text-[9px] uppercase tracking-luxury text-[#AA9160] font-semibold block">
                  Bespoke Atelier
                </span>
                <h3 className="font-serif text-sm">Need Custom Sizing or Tailoring?</h3>
              </div>
              <a
                href="/product/custom"
                className="px-4 py-2 bg-[#FAF9F5] text-[#176B45] text-[10px] uppercase tracking-luxury font-semibold hover:bg-[#EEEAE0] transition-colors whitespace-nowrap"
              >
                Customise →
              </a>
            </div>
          </div>

          {/* Right Column: Contact Inquiry Form */}
          <div className="lg:col-span-7 bg-[#FAF9F5] p-6 sm:p-8 lg:p-10 border border-[#E2DFD6] shadow-sm">
            <h2 className="font-serif text-xl sm:text-2xl text-[#176B45] mb-2">
              Send a Direct Message
            </h2>
            <p className="text-xs text-[#74786F] mb-6">
              Fill in your details below and an atelier stylist will get in touch with you.
            </p>

            {status === "success" ? (
              <div className="p-6 bg-[#EEEAE0] border border-[#176B45] text-center space-y-3 animate-fade-in">
                <CheckCircle2 className="w-8 h-8 text-[#176B45] mx-auto" />
                <h3 className="font-serif text-lg text-[#176B45]">
                  Message Received
                </h3>
                <p className="text-xs text-[#74786F] max-w-md mx-auto">
                  Thank you for reaching out to DHEERA. Your inquiry has been routed to our concierge team, and we will contact you shortly.
                </p>
                <button
                  type="button"
                  onClick={() => setStatus("idle")}
                  className="mt-3 px-5 py-2 bg-[#176B45] text-white text-xs uppercase tracking-luxury hover:bg-[#315039]"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {status === "error" && (
                  <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] uppercase tracking-luxury text-[#252A25] font-semibold mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="e.g. Priyanka Sharma"
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
                      placeholder="e.g. priyanka@example.com"
                      className="w-full px-3.5 py-2.5 bg-[#FAF9F5] border border-[#E2DFD6] text-xs text-[#252A25] focus:outline-none focus:border-[#176B45]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] uppercase tracking-luxury text-[#252A25] font-semibold mb-1">
                      Contact Phone (Optional)
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="10-digit mobile number"
                      className="w-full px-3.5 py-2.5 bg-[#FAF9F5] border border-[#E2DFD6] text-xs text-[#252A25] focus:outline-none focus:border-[#176B45]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase tracking-luxury text-[#252A25] font-semibold mb-1">
                      Inquiry Nature
                    </label>
                    <select
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-[#FAF9F5] border border-[#E2DFD6] text-xs text-[#252A25] focus:outline-none focus:border-[#176B45]"
                    >
                      <option value="General Inquiry">General Inquiry</option>
                      <option value="Order Tracking & Status">Order Tracking & Status</option>
                      <option value="Bespoke Tailoring & Measurements">Bespoke Tailoring & Measurements</option>
                      <option value="Bridal & Festive Curation">Bridal & Festive Curation</option>
                      <option value="Returns & Size Exchanges">Returns & Size Exchanges</option>
                      <option value="Press & Collaborations">Press & Collaborations</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-luxury text-[#252A25] font-semibold mb-1">
                    Your Message *
                  </label>
                  <textarea
                    rows={5}
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Please describe how we can assist you..."
                    className="w-full px-3.5 py-2.5 bg-[#FAF9F5] border border-[#E2DFD6] text-xs text-[#252A25] focus:outline-none focus:border-[#176B45]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-8 py-3 bg-[#176B45] hover:bg-[#315039] text-[#FAF9F5] text-xs uppercase tracking-luxury font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? "Sending..." : "Submit Inquiry"}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
}
