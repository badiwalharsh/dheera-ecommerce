import React from "react";
import type { Metadata } from "next";
import { CheckoutView } from "@/components/checkout/checkout-view";

export const metadata: Metadata = {
  title: "Secure Checkout | DHEERA",
  description: "Complete your order with 256-bit SSL encrypted checkout and Razorpay Test Mode.",
};

export default function CheckoutPage() {
  return <CheckoutView />;
}
