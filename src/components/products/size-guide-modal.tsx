"use client";

import React, { useEffect } from "react";
import { X, Ruler, Sparkles, Check } from "lucide-react";

export interface SizeMeasurement {
  size: string;
  bust: string;
  waist: string;
  hip: string;
  shoulder: string;
  length: string;
}

/**
 * Standard DHEERA Size Chart Table (Centimetres)
 * Easy for admin to update or expand.
 */
export const SIZE_CHART: SizeMeasurement[] = [
  { size: "XS", bust: "81 – 84 cm", waist: "63 – 66 cm", hip: "89 – 92 cm", shoulder: "36 cm", length: "114 cm" },
  { size: "S",  bust: "86 – 89 cm", waist: "68 – 71 cm", hip: "94 – 97 cm", shoulder: "37 cm", length: "114 cm" },
  { size: "M",  bust: "91 – 94 cm", waist: "73 – 76 cm", hip: "99 – 102 cm", shoulder: "38 cm", length: "117 cm" },
  { size: "L",  bust: "96 – 101 cm", waist: "78 – 83 cm", hip: "104 – 109 cm", shoulder: "39.5 cm", length: "117 cm" },
  { size: "XL", bust: "104 – 109 cm", waist: "86 – 91 cm", hip: "112 – 117 cm", shoulder: "41 cm", length: "120 cm" },
  { size: "XXL", bust: "112 – 117 cm", waist: "94 – 99 cm", hip: "120 – 125 cm", shoulder: "42.5 cm", length: "120 cm" },
];

interface SizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSize?: string;
}

export function SizeGuideModal({ isOpen, onClose, selectedSize }: SizeGuideModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      <div className="bg-[#FAF9F5] w-full max-w-2xl border border-[#E2DFD6] shadow-2xl relative max-h-[90vh] overflow-y-auto p-6 sm:p-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-[#74786F] hover:text-[#176B45] transition-colors"
          aria-label="Close size guide"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-luxury text-[#AA9160] font-semibold mb-1">
            <Ruler className="w-3.5 h-3.5 text-[#AA9160]" />
            <span>Fit & Measurements</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif text-[#176B45]">
            DHEERA Size Guide
          </h2>
          <p className="text-xs text-[#74786F] mt-1">
            All body and garment measurements are presented in centimetres (cm).
          </p>
        </div>

        {/* Development Notice */}
        <div className="p-3.5 bg-[#EEEAE0]/70 border border-[#AA9160]/30 text-xs text-[#315039] mb-6 flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-[#AA9160] flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold uppercase tracking-wider text-[10px] block text-[#176B45]">
              Illustrative Sizing Chart
            </span>
            <span>
              Values shown are standard reference guidelines for development. Every DHEERA piece can be bespoke-tailored to your precise measurements via our custom atelier.
            </span>
          </div>
        </div>

        {/* Measurements Table */}
        <div className="overflow-x-auto border border-[#E2DFD6] mb-6">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#176B45] text-[#FAF9F5] uppercase tracking-luxury text-[10px]">
              <tr>
                <th className="py-3 px-3.5 font-medium">Size</th>
                <th className="py-3 px-3.5 font-medium">Bust</th>
                <th className="py-3 px-3.5 font-medium">Waist</th>
                <th className="py-3 px-3.5 font-medium">Hip</th>
                <th className="py-3 px-3.5 font-medium">Shoulder</th>
                <th className="py-3 px-3.5 font-medium">Length</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2DFD6] bg-[#FAF9F5]">
              {SIZE_CHART.map((row) => {
                const isCurrent = selectedSize === row.size;
                return (
                  <tr
                    key={row.size}
                    className={`transition-colors ${
                      isCurrent
                        ? "bg-[#176B45]/10 font-semibold text-[#176B45]"
                        : "hover:bg-[#EEEAE0]/50 text-[#252A25]"
                    }`}
                  >
                    <td className="py-3 px-3.5 font-serif font-medium text-sm flex items-center gap-1.5">
                      <span>{row.size}</span>
                      {isCurrent && <Check className="w-3.5 h-3.5 text-[#176B45]" />}
                    </td>
                    <td className="py-3 px-3.5">{row.bust}</td>
                    <td className="py-3 px-3.5">{row.waist}</td>
                    <td className="py-3 px-3.5">{row.hip}</td>
                    <td className="py-3 px-3.5">{row.shoulder}</td>
                    <td className="py-3 px-3.5">{row.length}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Saree & Free Size Note */}
        <div className="border-t border-[#E2DFD6] pt-4 mb-6 text-xs text-[#74786F] space-y-1">
          <p className="font-serif italic text-sm text-[#176B45]">
            Looking at Sarees?
          </p>
          <p>
            DHEERA sarees are free-size drapes of 5.5 metres, accompanied by an unstitched 0.8 metre coordinating blouse piece that can be tailored to any size.
          </p>
        </div>

        {/* How to Measure Guide */}
        <div className="bg-[#EEEAE0]/40 p-4 border border-[#E2DFD6] space-y-3">
          <h4 className="text-[11px] uppercase tracking-luxury text-[#176B45] font-semibold">
            How to Measure
          </h4>
          <ul className="text-xs text-[#74786F] space-y-1.5 list-disc pl-4">
            <li><strong>Bust:</strong> Measure around the fullest part of your bust, keeping the measuring tape comfortably parallel to the floor.</li>
            <li><strong>Waist:</strong> Measure around your natural waistline, typically the narrowest point above your navel.</li>
            <li><strong>Hips:</strong> Measure around the widest part of your hips and seat.</li>
            <li><strong>Shoulder:</strong> Measure straight across the back from the edge of one shoulder bone to the other.</li>
          </ul>
        </div>

        {/* Bespoke Inquiry Footer */}
        <div className="mt-6 pt-4 border-t border-[#E2DFD6] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <span className="text-[#74786F]">
            Need a custom length, petite or plus sizing?
          </span>
          <a
            href="/product/custom"
            onClick={onClose}
            className="text-[#176B45] font-semibold uppercase tracking-luxury text-[11px] hover:text-[#AA9160] transition-colors"
          >
            Request Bespoke Tailoring →
          </a>
        </div>
      </div>
    </div>
  );
}
