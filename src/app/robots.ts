import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://dheera.in";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/account",
        "/account/*",
        "/checkout",
        "/checkout/*",
        "/admin",
        "/admin/*",
        "/api/*",
        "/order-confirmation",
        "/order-confirmation/*",
        "/cart",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

