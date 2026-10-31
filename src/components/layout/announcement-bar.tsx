import React from "react";
import { BRAND } from "@/constants";
import { getStoreContent } from "@/lib/services/admin";

export function AnnouncementBar() {
  const content = getStoreContent();

  if (!content.promotionalBannerActive) {
    return null;
  }

  const rawText = content.promotionalBannerText || BRAND.announcementText;
  const parts = rawText.split("|").map((p) => p.trim());
  const leftPart = parts[0] || rawText;
  const rightPart = parts[1] || "";

  return (
    <aside
      aria-label="Brand Announcement"
      className="bg-[#176B45] text-[#FAF9F5] py-2 px-3 sm:px-4 text-center text-[9px] sm:text-[10px] md:text-[11px] tracking-luxury uppercase font-medium border-b border-black/10"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap text-center leading-normal">
        <span className="text-[#AA9160] text-[8px] sm:text-[9px]">✦</span>
        <span className="inline-block">{leftPart}</span>
        {rightPart && (
          <>
            <span className="text-[#AA9160] mx-0.5 sm:mx-1 font-light">|</span>
            <span className="inline-block text-[#FAF9F5]/90">{rightPart}</span>
          </>
        )}
        <span className="text-[#AA9160] text-[8px] sm:text-[9px]">✦</span>
      </div>
    </aside>
  );
}
