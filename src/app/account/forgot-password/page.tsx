import { Metadata } from "next";
import { ForgotPasswordView } from "@/components/account/forgot-password-view";

export const metadata: Metadata = {
  title: "Forgot Password — Customer Portal",
  description: "Request a password reset link for your DHEERA account.",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordView />;
}
