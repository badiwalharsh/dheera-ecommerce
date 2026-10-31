"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_LINKS_LEFT } from "@/constants";
import { ChevronDown } from "lucide-react";

export function DesktopNav() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="hidden lg:flex items-center gap-7 text-[11px] tracking-luxury uppercase font-medium">
      {NAV_LINKS_LEFT.map((link) => {
        if ("dropdown" in link && link.dropdown) {
          const isCollectionsActive = pathname.startsWith("/collections");
          return (
            <div
              key={link.label}
              ref={dropdownRef}
              className="relative"
              onMouseEnter={() => setDropdownOpen(true)}
              onMouseLeave={() => setDropdownOpen(false)}
            >
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className={`editorial-hover flex items-center gap-1 transition-colors py-2 focus:outline-none ${
                  isCollectionsActive
                    ? "text-[#176B45] font-semibold"
                    : "text-[#252A25] hover:text-[#176B45]"
                }`}
                aria-expanded={dropdownOpen}
              >
                <span>{link.label}</span>
                <ChevronDown
                  className={`w-3 h-3 text-[#AA9160] transition-transform duration-200 ${
                    dropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Collections Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute top-full left-0 w-52 bg-[#FAF9F5] border border-[#E2DFD6] shadow-lg py-2.5 z-50 animate-fade-in">
                  <div className="px-4 py-1.5 text-[9px] uppercase tracking-luxury text-[#AA9160] font-semibold border-b border-[#E2DFD6]/60 mb-1">
                    Curation By Silhouette
                  </div>
                  {link.dropdown.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setDropdownOpen(false)}
                      className={`block px-4 py-2 text-[11px] uppercase tracking-luxury transition-colors ${
                        pathname === item.href
                          ? "bg-[#EEEAE0] text-[#176B45] font-semibold"
                          : "text-[#252A25] hover:bg-[#EEEAE0]/70 hover:text-[#176B45]"
                      }`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        }

        const isActive = pathname === link.href;

        return (
          <Link
            key={link.href}
            href={link.href}
            className={`editorial-hover transition-colors py-2 ${
              isActive
                ? "text-[#176B45] font-semibold"
                : "text-[#252A25] hover:text-[#176B45]"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
