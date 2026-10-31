import React from "react";
import { Container } from "@/components/ui/container";

export default function ProductIndexPage() {
  return (
    <div className="py-20">
      <Container size="default">
        <div className="text-center max-w-xl mx-auto space-y-3">
          <span className="text-[10px] uppercase tracking-luxury text-dheera-dark-green font-medium">
            Product Detail
          </span>
          <h1 className="text-4xl font-serif text-dheera-forest-green">
            Product Gallery
          </h1>
          <p className="text-sm text-dheera-secondary-text">
            Individual product viewing, size selection, and fabric care to be implemented in Phase 4.
          </p>
        </div>
      </Container>
    </div>
  );
}

