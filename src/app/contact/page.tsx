import React from "react";
import { Container } from "@/components/ui/container";
import { BRAND } from "@/constants";

export default function ContactPage() {
  return (
    <div className="py-20">
      <Container size="narrow">
        <div className="text-center space-y-4">
          <span className="text-[10px] uppercase tracking-luxury text-dheera-dark-green font-medium">
            Get in Touch
          </span>
          <h1 className="text-4xl md:text-5xl font-serif text-dheera-forest-green">
            Client Inquiries
          </h1>
          <p className="text-sm text-dheera-secondary-text leading-relaxed pt-2">
            For bespoke styling, order inquiries, or personal consultations, reach out to our concierge team.
          </p>
          <div className="pt-6">
            <a
              href={`mailto:${BRAND.contactEmail}`}
              className="text-lg font-serif text-dheera-forest-green hover:underline"
            >
              {BRAND.contactEmail}
            </a>
          </div>
        </div>
      </Container>
    </div>
  );
}

