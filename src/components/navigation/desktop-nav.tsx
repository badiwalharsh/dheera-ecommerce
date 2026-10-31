import React from "react";
import Link from "next/link";
import { NAV_LINKS } from "@/constants";

interface DesktopNavProps {
  position?: "left" | "right";
}

export function DesktopNav({ position = "left" }: DesktopNavProps) {
  const links =
    position === "left" ? NAV_LINKS.slice(0, 3) : NAV_LINKS.slice(3, 6);

  return (
    <nav className="hidden lg:flex items-center gap-7 text-[11px] tracking-luxury uppercase font-medium">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="editorial-hover text-dheera-primary-text hover:text-dheera-forest-green transition-colors"
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}

