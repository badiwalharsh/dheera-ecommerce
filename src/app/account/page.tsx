import { Metadata } from "next";
import { AccountLayout } from "@/components/account/account-layout";
import { DashboardOverview } from "@/components/account/dashboard-overview";

export const metadata: Metadata = {
  title: "Patron Dashboard — DHEERA",
  description: "View and manage your DHEERA account, orders, saved addresses, and wishlist.",
};

export default function AccountPage() {
  return (
    <AccountLayout
      title="Patron Overview"
      subtitle="Welcome to your personal atelier dashboard."
      breadcrumb="Dashboard"
    >
      <DashboardOverview />
    </AccountLayout>
  );
}
