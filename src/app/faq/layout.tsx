import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Frequently Asked Questions & Care Guide | DHEERA — Apparel & Lifestyle",
  description:
    "Find answers to common inquiries regarding bespoke sizing, pure fabric care, payment methods, delivery timelines, and size exchanges.",
  alternates: {
    canonical: "/faq",
  },
};

export default function FAQLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

