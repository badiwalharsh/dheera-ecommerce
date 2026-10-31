import { Metadata } from "next";
import { ResetPasswordView } from "@/components/account/reset-password-view";

export const metadata: Metadata = {
  title: "Set New Password — Customer Portal",
  description: "Set a new secure password for your DHEERA account.",
};

export default function ResetPasswordPage() {
  return <ResetPasswordView />;
}
