import React from "react";
import type { Metadata } from "next";
import { OrderConfirmationView } from "@/components/checkout/order-confirmation-view";

export const metadata: Metadata = {
  title: "Order Confirmation | DHEERA",
  description: "Your order receipt and payment confirmation details.",
};

export default function OrderConfirmationPage({
  params,
  searchParams,
}: {
  params: { orderId: string };
  searchParams?: { token?: string };
}) {
  return (
    <OrderConfirmationView
      orderIdentifier={params.orderId}
      accessToken={searchParams?.token || null}
    />
  );
}
