import React from "react";
import { HeroBanner } from "@/components/homepage/hero-banner";
import { CategoryGrid } from "@/components/homepage/category-grid";
import { FeaturedProducts } from "@/components/homepage/featured-products";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { BrandLogo } from "@/components/ui/brand-logo";
import { BRAND } from "@/constants";
import { Palette, Database, Layers, ShieldCheck } from "lucide-react";

export default function HomePage() {
  return (
    <div className="space-y-16 md:space-y-24">
      {/* Editorial Hero Banner */}
      <HeroBanner />

      {/* Trust Banner */}
      <section className="border-y border-dheera-line py-5 bg-dheera-cream/50">
        <Container size="default">
          <div className="flex flex-wrap items-center justify-around gap-6 text-[10px] md:text-xs uppercase tracking-luxury text-dheera-forest-green font-medium text-center">
            <div className="flex items-center gap-2">
              <span className="text-dheera-muted-gold">✦</span>
              <span>Authentic Artisanal Weaves</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-dheera-muted-gold">✦</span>
              <span>Bespoke Tailoring & Sizing</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-dheera-muted-gold">✦</span>
              <span>Pan-India & Global Delivery</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-dheera-muted-gold">✦</span>
              <span>{BRAND.philosophy}</span>
            </div>
          </div>
        </Container>
      </section>

      {/* Curated Categories */}
      <CategoryGrid />

      {/* Featured Pieces Edit */}
      <FeaturedProducts />

      {/* Phase 1 Setup & Verification Banner */}
      <section className="py-12">
        <Container size="default">
          <div className="bg-[#FAF9F5] border border-dheera-line p-8 md:p-12 text-center max-w-4xl mx-auto shadow-sm">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Badge variant="gold">Phase 1: Project Setup & Architecture</Badge>
            </div>

            <div className="my-6 flex justify-center">
              <BrandLogo size="lg" showTagline={true} />
            </div>

            <p className="font-serif text-2xl md:text-3xl text-dheera-forest-green italic my-3">
              &ldquo;{BRAND.tagline}&rdquo;
            </p>

            <p className="text-xs uppercase tracking-luxury text-dheera-muted-gold font-medium mb-8">
              {BRAND.philosophy}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left pt-6 border-t border-dheera-line">
              <div className="p-4 bg-dheera-warm-ivory/50 border border-dheera-line">
                <Palette className="w-4 h-4 text-dheera-forest-green mb-2" />
                <h4 className="text-[10px] font-semibold uppercase tracking-luxury text-dheera-forest-green">
                  Design Tokens
                </h4>
                <p className="text-[11px] text-dheera-secondary-text mt-1">
                  Forest Green, Dark Green, Warm Ivory, Cream, Muted Gold.
                </p>
              </div>

              <div className="p-4 bg-dheera-warm-ivory/50 border border-dheera-line">
                <Database className="w-4 h-4 text-dheera-forest-green mb-2" />
                <h4 className="text-[10px] font-semibold uppercase tracking-luxury text-dheera-forest-green">
                  Database Schema
                </h4>
                <p className="text-[11px] text-dheera-secondary-text mt-1">
                  15 core relational entities, RLS isolation, indexes, triggers.
                </p>
              </div>

              <div className="p-4 bg-dheera-warm-ivory/50 border border-dheera-line">
                <Layers className="w-4 h-4 text-dheera-forest-green mb-2" />
                <h4 className="text-[10px] font-semibold uppercase tracking-luxury text-dheera-forest-green">
                  Folder Structure
                </h4>
                <p className="text-[11px] text-dheera-secondary-text mt-1">
                  Clean src/app, components, lib, hooks, types, constants.
                </p>
              </div>

              <div className="p-4 bg-dheera-warm-ivory/50 border border-dheera-line">
                <ShieldCheck className="w-4 h-4 text-dheera-forest-green mb-2" />
                <h4 className="text-[10px] font-semibold uppercase tracking-luxury text-dheera-forest-green">
                  Clean Architecture
                </h4>
                <p className="text-[11px] text-dheera-secondary-text mt-1">
                  Zero secrets exposed, TypeScript strict, verified build.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
