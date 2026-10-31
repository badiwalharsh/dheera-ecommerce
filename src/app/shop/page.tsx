import React, { Suspense } from "react";
import type { Metadata } from "next";
import { getAllProducts } from "@/lib/data/products";
import { ShopView } from "@/components/shop/shop-view";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Shop All Handcrafted Pieces | DHEERA — Apparel & Lifestyle",
  description:
    "Explore our complete collection of handcrafted Indian designer apparel. Pure Chanderi sarees, embroidered kurta sets, and bespoke festive occasionwear.",
  alternates: {
    canonical: "/shop",
  },
  openGraph: {
    title: "Shop Handcrafted Pieces | DHEERA",
    description: "Handcrafted Indian apparel inspired by heritage, designed for the modern you.",
    images: [{ url: "/images/banners/hero-editorial.jpg" }],
  },
};

function ShopFallback() {
  return (
    <div className="py-20">
      <Container size="default">
        <div className="text-center space-y-3">
          <span className="text-[#AA9160] text-xl font-serif">✦</span>
          <p className="text-xs uppercase tracking-luxury text-[#176B45] font-semibold">
            Loading Handcrafted Pieces...
          </p>
        </div>
      </Container>
    </div>
  );
}

export default async function ShopPage() {
  const products = await getAllProducts();

  return (
    <Suspense fallback={<ShopFallback />}>
      <ShopView initialProducts={products} />
    </Suspense>
  );
}
