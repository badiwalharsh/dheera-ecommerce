import React from "react";
import { Container } from "@/components/ui/container";

export default function CheckoutPage() {
  return (
    <div className="py-20">
      <Container size="default">
        <div className="text-center max-w-xl mx-auto space-y-3">
          <span className="text-[10px] uppercase tracking-luxury text-dheera-dark-green font-medium">
            Checkout
          </span>
          <h1 className="text-4xl font-serif text-dheera-forest-green">
            Order & Delivery
          </h1>
          <p className="text-sm text-dheera-secondary-text">
            Razorpay payment gateway, address entry, and order placement to be implemented in Phase 7.
          </p>
        </div>
      </Container>
    </div>
  );
}
