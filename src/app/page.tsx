import React from "react";
import { HeroBanner } from "@/components/homepage/hero-banner";
import { CategoryGrid } from "@/components/homepage/category-grid";
import { FeaturedProducts } from "@/components/homepage/featured-products";
import { BrandStory } from "@/components/homepage/brand-story";
import { CustomizationBanner } from "@/components/homepage/customization-banner";
import { BrandValues } from "@/components/homepage/brand-values";
import { Newsletter } from "@/components/homepage/newsletter";

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* 1. Hero Banner */}
      <HeroBanner />

      {/* 2. Category Collection Cards (Kurta Sets, Sarees, Suits, Dupattas) */}
      <CategoryGrid />

      {/* 3. Featured Collection ("Our Favourites" - 6 Curated Products) */}
      <FeaturedProducts />

      {/* 4. Brand Story ("Rooted in Heritage. Made for Today.") */}
      <BrandStory />

      {/* 5. Customization Section ("Made Personal, Just for You.") */}
      <CustomizationBanner />

      {/* 6. Brand Values (4 Pillars of Craft) */}
      <BrandValues />

      {/* 7. Newsletter ("A Little DHEERA in Your Inbox.") */}
      <Newsletter />
    </div>
  );
}
