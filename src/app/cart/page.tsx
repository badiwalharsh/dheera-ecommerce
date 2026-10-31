import React from "react";
import { Container } from "@/components/ui/container";

export default function CartPage() {
  return (
    <div className="py-20">
      <Container size="default">
        <div className="text-center max-w-xl mx-auto space-y-3">
          <span className="text-[10px] uppercase tracking-luxury text-dheera-dark-green font-medium">
            Shopping Bag
          </span>
          <h1 className="text-4xl font-serif text-dheera-forest-green">
            Your Selection
          </h1>
          <p className="text-sm text-dheera-secondary-text">
            Cart persistence, subtotal calculation, and bag management to be implemented in Phase 5.
          </p>
        </div>
      </Container>
    </div>
  );
}
