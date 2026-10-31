import React from "react";
import { AdminProvider } from "@/context/admin-context";

export const metadata = {
  title: "Admin Portal | DHEERA – Apparel & Lifestyle",
  description: "Administrative console and business management system for DHEERA.",
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminProvider>{children}</AdminProvider>;
}

