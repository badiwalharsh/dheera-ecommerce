import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bespoke Atelier & Custom Tailoring | DHEERA — Apparel & Lifestyle",
  description:
    "Commission a bespoke Indian designer ensemble tailored to your exact measurements, neckline, sleeve preferences, and festive color adaptations.",
  alternates: {
    canonical: "/product/custom",
  },
};

export default function CustomLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

