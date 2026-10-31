import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { CategoryGrid } from "@/components/homepage/category-grid";

export const metadata: Metadata = {
  title: "Curated Collections & Silhouettes | DHEERA",
  description:
    "Explore our signature Indian collections: Kurta Sets, Sarees, Suits, and Dupattas. Handcrafted with reverence for age-old traditions and contemporary elegance.",
  alternates: {
    canonical: "/collections",
  },
};

export default function CollectionsPage() {
  return (
    <div className="py-10 sm:py-16">
      <Container size="default">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="mb-6 text-xs text-[#74786F]">
          <ol className="flex items-center space-x-2">
            <li>
              <Link href="/" className="hover:text-[#176B45] transition-colors">
                Home
              </Link>
            </li>
            <li className="text-[#AA9160]">/</li>
            <li className="text-[#176B45] font-medium">Collections</li>
          </ol>
        </nav>
      </Container>

      {/* Categories Grid */}
      <CategoryGrid />
    </div>
  );
}
