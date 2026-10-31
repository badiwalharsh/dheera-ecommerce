/**
 * DHEERA — Brand Constants & Design Tokens
 * 
 * Brand identity:
 * - Brand name: DHEERA
 * - Brand descriptor: APPAREL & LIFESTYLE
 * - Tagline: Indian Heritage, Contemporary Soul.
 * - Philosophy: Made in India | For the World
 * - Instagram: @dheera_india
 */

export const BRAND = {
  name: "DHEERA",
  descriptor: "APPAREL & LIFESTYLE",
  tagline: "Indian Heritage, Contemporary Soul.",
  philosophy: "Made in India | For the World",
  instagram: "@dheera_india",
  instagramUrl: "https://www.instagram.com/dheera_india/",
  contactEmail: "care@dheera.in",
  officialLogoPath: "/images/brand/dheera-logo.png",
  announcementText: "Thoughtfully made · Handcrafted in India · Made for you",
} as const;

export const DESIGN_TOKENS = {
  colors: {
    forestGreen: "#176B45",
    darkGreen: "#315039",
    warmIvory: "#EEEAE0",
    cream: "#FAF9F5",
    mutedGold: "#AA9160",
    primaryText: "#252A25",
    secondaryText: "#74786F",
    line: "#E2DFD6",
  },
} as const;

export const NAV_LINKS = [
  { label: "Shop All", href: "/shop" },
  { label: "Collections", href: "/collections" },
  { label: "Kurta Sets", href: "/collections/kurta-sets" },
  { label: "Sarees", href: "/collections/sarees" },
  { label: "Suits", href: "/collections/suits" },
  { label: "Dupattas", href: "/collections/dupattas" },
  { label: "Custom Outfits", href: "/product/custom" },
  { label: "Our Story", href: "/about" },
  { label: "Contact", href: "/contact" },
] as const;

export const CATEGORIES = [
  {
    id: "kurta-sets",
    name: "Kurta Sets",
    subtitle: "Timeless silhouettes",
    image: "/images/banners/category-kurta.jpg",
    href: "/collections/kurta-sets",
  },
  {
    id: "sarees",
    name: "Sarees",
    subtitle: "Drapes of heritage",
    image: "/images/banners/category-saree.jpg",
    href: "/collections/sarees",
  },
  {
    id: "suits",
    name: "Suits",
    subtitle: "Festive elegance",
    image: "/images/banners/category-suit.jpg",
    href: "/collections/suits",
  },
  {
    id: "dupattas",
    name: "Dupattas",
    subtitle: "Artful layers",
    image: "/images/banners/category-dupatta.jpg",
    href: "/collections/dupattas",
  },
] as const;

export const SAMPLE_PRODUCTS = [
  {
    id: "prod-1",
    name: "Gulab Embroidered Kurta Set",
    category: "Kurta Sets",
    price: 2999,
    originalPrice: 3499,
    tag: "Signature",
    image: "/images/products/product-1.jpg",
    description: "A vibrant pink embroidered kurta set concept, inspired by festive Indian occasion wear.",
  },
  {
    id: "prod-2",
    name: "Ivory Chanderi Saree",
    category: "Sarees",
    price: 4299,
    originalPrice: 4999,
    tag: "Timeless",
    image: "/images/products/product-2.jpg",
    description: "An ivory saree concept with delicate traditional zari detailing and subtle festive finish.",
  },
  {
    id: "prod-3",
    name: "Emerald Anarkali Set",
    category: "Suits",
    price: 3899,
    originalPrice: 4599,
    tag: "DHEERA Favourite",
    image: "/images/products/product-3.jpg",
    description: "A deep emerald occasionwear concept with intricate antique-gold thread embellishment.",
  },
] as const;
