import { Metadata } from "next";
import { AccountLayout } from "@/components/account/account-layout";
import { OrderHistoryView } from "@/components/account/order-history-view";

export const metadata: Metadata = {
  title: "My Orders — DHEERA",
  description: "View your handcrafted garment orders, payment details, and live delivery status.",
};

export default function OrdersPage() {
  return (
    <AccountLayout
      title="My Orders & Tracking"
      subtitle="View your order history, atelier crafting milestones, and courier tracking."
      breadcrumb="My Orders"
    >
      <OrderHistoryView />
    </AccountLayout>
  );
}
