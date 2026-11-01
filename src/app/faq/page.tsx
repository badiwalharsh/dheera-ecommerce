"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { ChevronDown, ChevronUp, Sparkles, HelpCircle, Mail, ArrowRight } from "lucide-react";
import { BRAND } from "@/constants";

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSection {
  category: string;
  items: FAQItem[];
}

const FAQ_SECTIONS: FAQSection[] = [
  {
    category: "Ordering & Sizing",
    items: [
      {
        question: "How do I choose the correct size for DHEERA garments?",
        answer:
          "Our designs follow standard Indian designer proportions tailored for fluid comfort. We provide an interactive Size Guide on every product page detailing bust, waist, hip, and length measurements in inches. If you are between two sizes, we recommend selecting the larger size for a relaxed, graceful silhouette.",
      },
      {
        question: "Can I customize the sizing, sleeves, or neckline of a garment?",
        answer:
          "Yes. DHEERA offers bespoke customization through our Bespoke Atelier on eligible made-to-order garments. You can share your custom bust, waist, hip, and length measurements, or request sleeve length and neckline depth adaptations by submitting our Bespoke Atelier Consultation form.",
      },
      {
        question: "Can I make changes to my order after placing it?",
        answer:
          "Because every piece is tailored with care, order changes or address updates must be requested within 12 hours of order placement by contacting our concierge at care@dheera.in.",
      },
    ],
  },
  {
    category: "Shipping & Delivery",
    items: [
      {
        question: "What are the shipping charges across India?",
        answer:
          "We offer complimentary express shipping on all domestic orders above ₹5,000. For orders below this threshold, a flat nominal shipping fee of ₹150 applies at checkout.",
      },
      {
        question: "What is the expected delivery timeline?",
        answer:
          "Ready-to-Ship garments are typically dispatched within 2–3 business days. Made-to-Order and custom-tailored ensembles require 7–10 business days for bespoke craftsmanship before dispatch. Once dispatched, domestic express transit takes 2–4 business days.",
      },
      {
        question: "How can I track my order?",
        answer:
          "Once your order is processed, you will receive real-time tracking updates via email. Registered patrons can also track their orders through the 6-stage atelier timeline directly in their Patron Account portal.",
      },
      {
        question: "Do you ship internationally?",
        answer:
          "International delivery arrangements can be coordinated via our concierge at care@dheera.in. Standard duties and regional customs clearance fees are the responsibility of the recipient.",
      },
    ],
  },
  {
    category: "Payments & Security",
    items: [
      {
        question: "What payment methods do you accept?",
        answer:
          "We accept all major domestic and international debit and credit cards (Visa, MasterCard, RuPay, American Express), UPI (Google Pay, PhonePe, Paytm), Net Banking across 50+ Indian banks, and secure digital wallets.",
      },
      {
        question: "Is my payment secure on DHEERA?",
        answer:
          "Yes. All payment transactions are encrypted and processed through our PCI-DSS Level 1 certified payment gateway (Razorpay). DHEERA never stores your complete credit/debit card numbers or UPI PINs.",
      },
      {
        question: "Why does my checkout indicate Test Mode?",
        answer:
          "During our structured pre-launch testing, checkout runs securely in verified Razorpay Test Mode. Simulated test payments confirm transaction flows without debiting real bank accounts.",
      },
    ],
  },
  {
    category: "Fabric Care & Handloom Craft",
    items: [
      {
        question: "How should I care for my handcrafted DHEERA garments?",
        answer:
          "Because our pieces are crafted from pure handwoven silks, gossamer Chanderis, and delicate zari threadwork, we strictly recommend professional dry cleaning. Store your garments in breathable cotton muslin bags away from direct sunlight to preserve the richness of the weave.",
      },
      {
        question: "Are slight variations in the fabric normal?",
        answer:
          "Yes. Authentic handloom textiles celebrated by DHEERA are woven by hand on traditional wooden looms. Subtle variations in texture, slubs, and zari alignment are natural hallmarks of genuine artisanal heritage rather than flaws.",
      },
    ],
  },
  {
    category: "Returns & Exchanges",
    items: [
      {
        question: "What is DHEERA's return and size exchange policy?",
        answer:
          "We offer complimentary size exchanges within 7 days of delivery for standard catalog garments in unworn, unwashed condition with all original security tags intact. Please contact care@dheera.in to initiate an exchange.",
      },
      {
        question: "Are custom-tailored or bespoke orders returnable?",
        answer:
          "Custom-made ensembles tailored to personal measurements or bespoke colourways are handcrafted uniquely for you and are non-returnable. However, we provide complimentary alteration support should any adjustment be needed.",
      },
    ],
  },
];

export default function FAQPage() {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({
    "0-0": true,
    "1-0": true,
  });

  const toggleItem = (key: string) => {
    setOpenItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="bg-[#FAF9F5] text-[#252A25] py-14 sm:py-20 md:py-28 overflow-x-hidden">
      <Container size="default">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <span className="text-[10px] uppercase tracking-luxury text-[#AA9160] font-semibold block mb-2">
            Frequently Asked Questions
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif text-[#176B45]">
            Client Guidance & Policies
          </h1>
          <p className="text-xs sm:text-sm text-[#74786F] leading-relaxed mt-3">
            Everything you need to know about purchasing, bespoke sizing, care instructions, and patron care at DHEERA.
          </p>
        </div>

        {/* FAQ Accordion Groups */}
        <div className="max-w-3xl mx-auto space-y-10 sm:space-y-12">
          {FAQ_SECTIONS.map((section, sIdx) => (
            <div key={section.category} className="space-y-4">
              <h2 className="font-serif text-xl sm:text-2xl text-[#176B45] border-b border-[#E2DFD6] pb-2 flex items-center gap-2">
                <span className="text-[#AA9160] text-sm">✦</span>
                <span>{section.category}</span>
              </h2>

              <div className="divide-y divide-[#E2DFD6] border border-[#E2DFD6] bg-[#FAF9F5]">
                {section.items.map((item, iIdx) => {
                  const key = `${sIdx}-${iIdx}`;
                  const isOpen = !!openItems[key];
                  return (
                    <div key={item.question} className="p-4 sm:p-5">
                      <button
                        type="button"
                        onClick={() => toggleItem(key)}
                        className="w-full flex items-center justify-between text-left font-serif text-sm sm:text-base text-[#176B45] hover:text-[#AA9160] transition-colors focus:outline-none"
                        aria-expanded={isOpen}
                      >
                        <span className="pr-4">{item.question}</span>
                        {isOpen ? (
                          <ChevronUp className="w-4 h-4 text-[#AA9160] flex-shrink-0" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-[#AA9160] flex-shrink-0" />
                        )}
                      </button>

                      {isOpen && (
                        <div className="pt-3 text-xs sm:text-sm text-[#74786F] leading-relaxed animate-fade-in">
                          <p>{item.answer}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Concierge Help Box */}
        <div className="max-w-3xl mx-auto mt-14 p-6 sm:p-8 bg-[#EEEAE0] border border-[#E2DFD6] text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-[#FAF9F5] flex items-center justify-center text-[#176B45] mx-auto border border-[#E2DFD6]">
            <HelpCircle className="w-5 h-5 text-[#AA9160]" />
          </div>
          <h3 className="font-serif text-lg sm:text-xl text-[#176B45]">
            Have an unanswered question?
          </h3>
          <p className="text-xs text-[#74786F] max-w-md mx-auto">
            Our atelier concierge is pleased to assist with custom measurements, bridal inquiries, or specific styling questions.
          </p>
          <div className="pt-2">
            <Link
              href="/contact"
              className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-[#176B45] text-[#FAF9F5] text-xs uppercase tracking-luxury hover:bg-[#315039] transition-colors font-medium"
            >
              <span>Contact Atelier Concierge</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
}

