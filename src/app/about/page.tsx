import React from "react";
import { Container } from "@/components/ui/container";
import { BRAND } from "@/constants";

export default function AboutPage() {
  return (
    <div className="py-20">
      <Container size="narrow">
        <div className="text-center space-y-4">
          <span className="text-[10px] uppercase tracking-luxury text-dheera-dark-green font-medium">
            Our Story
          </span>
          <h1 className="text-4xl md:text-5xl font-serif text-dheera-forest-green">
            Rooted in Heritage. Made for Today.
          </h1>
          <p className="text-sm md:text-base text-dheera-secondary-text leading-relaxed pt-4">
            DHEERA celebrates the beauty of Indian design through considered details, expressive craftsmanship and a contemporary sensibility. We believe what you wear should tell your story — with comfort, character and quiet confidence.
          </p>
          <p className="text-xs uppercase tracking-luxury text-dheera-muted-gold font-medium pt-4">
            {BRAND.philosophy}
          </p>
        </div>
      </Container>
    </div>
  );
}
