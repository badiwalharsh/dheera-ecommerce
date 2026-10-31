import { Metadata } from "next";
import { AccountLayout } from "@/components/account/account-layout";
import { WishlistView } from "@/components/account/wishlist-view";

export const metadata: Metadata = {
  title: "Personal Wishlist — DHEERA",
  description: "View and manage your saved couture garments, sarees, and ensembles.",
};

export default function WishlistPage() {
  return (
    <AccountLayout
      title="Personal Wishlist"
      subtitle="Curate and preserve your preferred artisanal ensembles."
      breadcrumb="Wishlist"
    >
      <WishlistView />
    </AccountLayout>
  );
}

