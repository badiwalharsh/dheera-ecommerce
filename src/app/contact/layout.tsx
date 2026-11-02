import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Client Concierge & Atelier Inquiries | DHEERA — Apparel & Lifestyle",
  description:
    "Connect with the DHEERA concierge desk for styling advice, order status, bridal consultations, and bespoke atelier appointments.",
  alternates: {
    canonical: "/contact",
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

