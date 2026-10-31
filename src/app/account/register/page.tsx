import { Metadata } from "next";
import { Suspense } from "react";
import { RegisterView } from "@/components/account/register-view";

export const metadata: Metadata = {
  title: "Create an Account — Patron Membership",
  description: "Register for a DHEERA account to enjoy bespoke sizing, order tracking, and wishlist preservation.",
};

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="py-24 text-center font-serif text-[#176B45]">
          Loading Patron Registration...
        </div>
      }
    >
      <RegisterView />
    </Suspense>
  );
}
