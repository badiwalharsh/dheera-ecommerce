import { Metadata } from "next";
import { Suspense } from "react";
import { LoginView } from "@/components/account/login-view";

export const metadata: Metadata = {
  title: "Sign In — Customer Portal",
  description: "Sign in to your DHEERA account to view orders, saved addresses and your wishlist.",
};

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="py-24 text-center font-serif text-[#176B45]">
          Loading Patron Portal...
        </div>
      }
    >
      <LoginView />
    </Suspense>
  );
}
