import React from "react";
import { Container } from "@/components/ui/container";

export default function ShopPage() {
  return (
    <div className="py-20">
      <Container size="default">
        <div className="text-center max-w-xl mx-auto space-y-3">
          <span className="text-[10px] uppercase tracking-luxury text-dheera-dark-green font-medium">
            Catalogue
          </span>
          <h1 className="text-4xl font-serif text-dheera-forest-green">
            Shop All Pieces
          </h1>
          <p className="text-sm text-dheera-secondary-text">
            Full product catalog, filtering, and sorting to be implemented in Phase 4.
          </p>
        </div>
      </Container>
    </div>
  );
}

