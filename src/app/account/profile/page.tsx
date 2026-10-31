import { Metadata } from "next";
import { AccountLayout } from "@/components/account/account-layout";
import { ProfileView } from "@/components/account/profile-view";

export const metadata: Metadata = {
  title: "Profile Settings — DHEERA",
  description: "Update your personal details, contact number, and security password.",
};

export default function ProfilePage() {
  return (
    <AccountLayout
      title="Profile Settings"
      subtitle="Manage your personal details and account security."
      breadcrumb="Profile Settings"
    >
      <ProfileView />
    </AccountLayout>
  );
}
