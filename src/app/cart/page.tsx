import React from "react";
import type { Metadata } from "next";
import { CartPageView } from "@/components/cart/cart-page-view";

export const metadata: Metadata = {
  title: "Shopping Bag | DHEERA",
  description: "Review your selected handcrafted Indian ensembles, kurta sets, and artisanal sarees.",
};

export default function CartPage() {
  return <CartPageView />;
}
