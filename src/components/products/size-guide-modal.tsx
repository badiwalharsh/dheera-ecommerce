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
  { size: "XS", bust: "81–84", waist: "63–66", hip: "89–92", shoulder: "36", length: "114" },
  { size: "S",  bust: "86–89", waist: "68–71", hip: "94–97", shoulder: "37", length: "114" },
  { size: "M",  bust: "91–94", waist: "73–76", hip: "99–102", shoulder: "38", length: "117" },
  { size: "L",  bust: "96–101", waist: "78–83", hip: "104–109", shoulder: "39.5", length: "117" },
  { size: "XL", bust: "104–109", waist: "86–91", hip: "112–117", shoulder: "41", length: "120" },
  { size: "XXL", bust: "112–117", waist: "94–99", hip: "120–125", shoulder: "42.5", length: "120" },
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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fade-in">
      <div className="bg-[#FAF9F5] w-full max-w-2xl border border-[#E2DFD6] shadow-2xl relative max-h-[90vh] overflow-y-auto p-4 sm:p-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-5 sm:right-5 p-1.5 sm:p-2 text-[#74786F] hover:text-[#176B45] transition-colors"
          aria-label="Close size guide"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-4 sm:mb-6 pr-6">
          <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] uppercase tracking-luxury text-[#AA9160] font-semibold mb-1">
            <Ruler className="w-3.5 h-3.5 text-[#AA9160]" />
            <span>Fit & Measurements</span>
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-serif text-[#176B45]">
            DHEERA Size Guide
          </h2>
          <p className="text-xs text-[#74786F] mt-1">
            All body and garment measurements are presented in centimetres (cm).
          </p>
        </div>

        {/* Development Notice */}
        <div className="p-3 bg-[#EEEAE0]/70 border border-[#AA9160]/30 text-xs text-[#315039] mb-4 sm:mb-6 flex items-start gap-2">
          <Sparkles className="w-4 h-4 text-[#AA9160] flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold uppercase tracking-wider text-[9px] sm:text-[10px] block text-[#176B45]">
              Illustrative Sizing Chart (Sample Data)
            </span>
            <span className="text-[11px] sm:text-xs">
              Values shown are standard reference guidelines for development. Every DHEERA piece can be bespoke-tailored to your precise measurements via our custom atelier.
            </span>
          </div>
        </div>

        {/* Measurements Table */}
        <div className="overflow-x-auto border border-[#E2DFD6] mb-4 sm:mb-6 max-w-full">
          <table className="w-full text-left text-[11px] sm:text-xs min-w-[280px]">
            <thead className="bg-[#176B45] text-[#FAF9F5] uppercase tracking-luxury text-[9px] sm:text-[10px]">
              <tr>
                <th className="py-2.5 px-2.5 sm:px-3.5 font-medium">Size</th>
                <th className="py-2.5 px-2 sm:px-3.5 font-medium">Bust (cm)</th>
                <th className="py-2.5 px-2 sm:px-3.5 font-medium">Waist (cm)</th>
                <th className="py-2.5 px-2 sm:px-3.5 font-medium">Hip (cm)</th>
                <th className="py-2.5 px-2 sm:px-3.5 font-medium">Shoulder</th>
                <th className="py-2.5 px-2 sm:px-3.5 font-medium">Length</th>
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
                    <td className="py-2 px-2.5 sm:px-3.5 font-serif font-medium text-xs sm:text-sm flex items-center gap-1">
                      <span>{row.size}</span>
                      {isCurrent && <Check className="w-3 h-3 text-[#176B45]" />}
                    </td>
                    <td className="py-2 px-2 sm:px-3.5 whitespace-nowrap">{row.bust}</td>
                    <td className="py-2 px-2 sm:px-3.5 whitespace-nowrap">{row.waist}</td>
                    <td className="py-2 px-2 sm:px-3.5 whitespace-nowrap">{row.hip}</td>
                    <td className="py-2 px-2 sm:px-3.5 whitespace-nowrap">{row.shoulder}</td>
                    <td className="py-2 px-2 sm:px-3.5 whitespace-nowrap">{row.length}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Saree & Free Size Note */}
        <div className="border-t border-[#E2DFD6] pt-3 mb-4 sm:mb-6 text-xs text-[#74786F] space-y-1">
          <p className="font-serif italic text-sm text-[#176B45]">
            Looking at Sarees?
          </p>
          <p className="text-[11px] sm:text-xs">
            DHEERA sarees are free-size drapes of 5.5 metres, accompanied by an unstitched 0.8 metre coordinating blouse piece that can be tailored to any size.
          </p>
        </div>

        {/* How to Measure Guide */}
        <div className="bg-[#EEEAE0]/40 p-3.5 sm:p-4 border border-[#E2DFD6] space-y-2">
          <h4 className="text-[10px] sm:text-[11px] uppercase tracking-luxury text-[#176B45] font-semibold">
            How to Measure
          </h4>
          <ul className="text-[11px] sm:text-xs text-[#74786F] space-y-1 list-disc pl-4">
            <li><strong>Bust:</strong> Measure around fullest part of your bust.</li>
            <li><strong>Waist:</strong> Measure around your natural waistline above navel.</li>
            <li><strong>Hips:</strong> Measure around the widest part of your hips.</li>
            <li><strong>Shoulder:</strong> Measure straight across the back between shoulder bones.</li>
          </ul>
        </div>

        {/* Bespoke Inquiry Footer */}
        <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-[#E2DFD6] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-center sm:text-left">
          <span className="text-[#74786F] text-[11px] sm:text-xs">
            Need custom length, petite or plus sizing?
          </span>
          <a
            href="/product/custom"
            onClick={onClose}
            className="text-[#176B45] font-semibold uppercase tracking-luxury text-[10px] sm:text-[11px] hover:text-[#AA9160] transition-colors"
          >
            Request Bespoke Tailoring →
          </a>
        </div>
      </div>
    </div>
  );
}
