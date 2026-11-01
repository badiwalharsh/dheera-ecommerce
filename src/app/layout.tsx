/* eslint-disable @next/next/no-page-custom-font */
import type { Metadata, Viewport } from "next";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ShopProvider } from "@/context/shop-context";
import { AuthProvider } from "@/context/auth-context";
import { SearchModal } from "@/components/navigation/search-modal";
import { QuickViewModal } from "@/components/products/quick-view-modal";
import { CartDrawer } from "@/components/cart/cart-drawer";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "DHEERA — APPAREL & LIFESTYLE | Indian Heritage, Contemporary Soul.",
    template: "%s | DHEERA",
  },
  description:
    "Handcrafted apparel inspired by Indian traditions, designed for the modern you. Made in India | For the World.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://dheera.in"),
  openGraph: {
    title: "DHEERA — APPAREL & LIFESTYLE",
    description: "Indian Heritage, Contemporary Soul.",
    siteName: "DHEERA",
    locale: "en_IN",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#176B45",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400..700;1,9..40,400..700&family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col bg-[#EEEAE0] text-[#252A25] selection:bg-[#AA9160] selection:text-white">
        <ShopProvider>
          <AuthProvider>
            <AnnouncementBar />
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
            <SearchModal />
            <QuickViewModal />
            <CartDrawer />
          </AuthProvider>
        </ShopProvider>
      </body>
    </html>
  );
}
