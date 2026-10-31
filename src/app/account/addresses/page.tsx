import { Metadata } from "next";
import { AccountLayout } from "@/components/account/account-layout";
import { AddressesView } from "@/components/account/addresses-view";

export const metadata: Metadata = {
  title: "Address Book — DHEERA",
  description: "Manage your saved delivery addresses for express checkout.",
};

export default function AddressesPage() {
  return (
    <AccountLayout
      title="Address Book"
      subtitle="Save and organize your residential and atelier delivery destinations."
      breadcrumb="Saved Addresses"
    >
      <AddressesView />
    </AccountLayout>
  );
}
