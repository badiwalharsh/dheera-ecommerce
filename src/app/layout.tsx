import type { Metadata, Viewport } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ShopProvider } from "@/context/shop-context";
import { AuthProvider } from "@/context/auth-context";
import { SearchModal } from "@/components/navigation/search-modal";
import { QuickViewModal } from "@/components/products/quick-view-modal";
import { CartDrawer } from "@/components/cart/cart-drawer";
import "./globals.css";

const serifFont = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-serif",
  display: "swap",
});

const sansFont = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

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
    <html lang="en" className={`${serifFont.variable} ${sansFont.variable}`}>
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
