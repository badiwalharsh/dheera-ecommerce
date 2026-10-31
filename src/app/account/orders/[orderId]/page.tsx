import { Metadata } from "next";
import { AccountLayout } from "@/components/account/account-layout";
import { OrderDetailView } from "@/components/account/order-detail-view";

export const metadata: Metadata = {
  title: "Order Details & Tracking — DHEERA",
  description: "View real-time atelier crafting progression, delivery timeline, and order snapshot.",
};

export default function OrderDetailPage({
  params,
}: {
  params: { orderId: string };
}) {
  return (
    <AccountLayout
      title="Order Details"
      subtitle="Track your artisanal garment order from atelier to doorstep."
      breadcrumb="Order Details"
    >
      <OrderDetailView orderIdentifier={params.orderId} />
    </AccountLayout>
  );
}

