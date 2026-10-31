import React from "react";
import { BRAND } from "@/constants";

export function AnnouncementBar() {
  return (
    <div className="bg-dheera-forest-green text-dheera-cream py-2 px-4 text-center text-[10px] md:text-[11px] tracking-luxury uppercase font-medium border-b border-black/10">
      <div className="flex items-center justify-center gap-2">
        <span>✦</span>
        <span>{BRAND.announcementText}</span>
        <span>✦</span>
      </div>
    </div>
  );
}
