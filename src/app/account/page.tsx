import React from "react";
import { Container } from "@/components/ui/container";

export default function AccountPage() {
  return (
    <div className="py-20">
      <Container size="default">
        <div className="text-center max-w-xl mx-auto space-y-3">
          <span className="text-[10px] uppercase tracking-luxury text-dheera-dark-green font-medium">
            Customer Portal
          </span>
          <h1 className="text-4xl font-serif text-dheera-forest-green">
            Your Profile & Orders
          </h1>
          <p className="text-sm text-dheera-secondary-text">
            Customer authentication, address book, and order history to be implemented in Phase 6.
          </p>
        </div>
      </Container>
    </div>
  );
}
