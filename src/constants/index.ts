/**
 * DHEERA — Brand Constants & Design System Tokens
 * 
 * Brand: DHEERA
 * Descriptor: APPAREL & LIFESTYLE
 * Tagline: Indian Heritage, Contemporary Soul.
 * Philosophy: Made in India | For the World
 * Instagram: @dheera_india
 */

export const BRAND = {
  name: "DHEERA",
  descriptor: "APPAREL & LIFESTYLE",
  tagline: "Indian Heritage, Contemporary Soul.",
  philosophy: "Made in India | For the World",
  instagram: "@dheera_india",
  instagramUrl: "https://www.instagram.com/dheera_india/",
  contactEmail: "care@dheera.in",
  contactPhone: "+91 (0) 800-DHEERA",
  contactHours: "Monday to Saturday, 10:00 AM – 7:00 PM IST",
  officialLogoPath: "/images/brand/dheera-logo.png",
  announcementText: "FREE SHIPPING ON SELECTED ORDERS | MADE IN INDIA, FOR THE WORLD",
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
    border: "#E2DFD6",
  },
} as const;

export const NAV_LINKS_LEFT = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  {
    label: "Collections",
    href: "/collections",
    dropdown: [
      { label: "All Collections", href: "/collections" },
      { label: "Kurta Sets", href: "/collections/kurta-sets" },
      { label: "Sarees", href: "/collections/sarees" },
      { label: "Suits", href: "/collections/suits" },
      { label: "Dupattas", href: "/collections/dupattas" },
    ],
  },
  { label: "Customise", href: "/product/custom" },
  { label: "Our Story", href: "/about" },
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

export const BRAND_VALUES = [
  {
    id: "craft",
    title: "Handcrafted with Care",
    description: "Every ensemble is thoughtfully crafted by master Indian artisans with meticulous attention to detail.",
    symbol: "✦",
  },
  {
    id: "fabrics",
    title: "Premium Quality Fabrics",
    description: "Sourced from premier heritage textile clusters — pure Chanderi, handwoven silks, and breathable mulmul.",
    symbol: "✦",
  },
  {
    id: "custom",
    title: "Customisation Available",
    description: "Tailored to your bespoke measurements, necklines, and color preferences through our personal atelier.",
    symbol: "✦",
  },
  {
    id: "heritage",
    title: "Made in India",
    description: "Celebrating age-old traditional craftsmanship while thoughtfully designing for the global modern wardrobe.",
    symbol: "✦",
  },
] as const;

/**
 * Six Curated Concept Products for Development & Visual Presentation
 */
export const SAMPLE_PRODUCTS = [
  {
    id: "prod-1",
    name: "Gulab Embroidered Kurta Set",
    category: "Kurta Sets",
    price: 2999,
    originalPrice: 3499,
    tag: "Signature",
    image: "/images/products/product-1.jpg",
    description: "A vibrant rani pink embroidered kurta set concept, inspired by the festive artistry of Indian occasion wear. Features delicate zari edging and breathable cotton-silk lining.",
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: ["Rani Pink", "Warm Ivory"],
    fabric: "Cotton Silk Blend",
    care: "Dry Clean Only",
  },
  {
    id: "prod-2",
    name: "Ivory Chanderi Saree",
    category: "Sarees",
    price: 4299,
    originalPrice: 4999,
    tag: "Timeless",
    image: "/images/products/product-2.jpg",
    description: "An ivory saree concept woven with delicate traditional zari motifs and an understated festive luster. Drapes with fluid, regal ease.",
    sizes: ["Free Size"],
    colors: ["Warm Ivory", "Antique Gold"],
    fabric: "Authentic Chanderi Silk",
    care: "Dry Clean Recommended",
  },
  {
    id: "prod-3",
    name: "Emerald Anarkali Set",
    category: "Suits",
    price: 3899,
    originalPrice: 4599,
    tag: "DHEERA Favourite",
    image: "/images/products/product-3.jpg",
    description: "A deep emerald occasionwear concept with intricate antique-gold thread embellishment and a flared silhouette paired with a coordinating organza dupatta.",
    sizes: ["S", "M", "L", "XL"],
    colors: ["Forest Emerald"],
    fabric: "Georgette with Organza Dupatta",
    care: "Dry Clean Only",
  },
  {
    id: "prod-4",
    name: "Rust Embroidered Suit Set",
    category: "Suits",
    price: 3499,
    originalPrice: 3999,
    tag: "New Edit",
    image: "/images/products/product-4.jpg",
    description: "A warm rust-toned handcrafted suit concept featuring delicate neckline embroidery and a matching tone-on-tone dupatta with scalloped borders.",
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: ["Warm Rust"],
    fabric: "Handwoven Silk Linen",
    care: "Dry Clean Only",
  },
  {
    id: "prod-5",
    name: "Lavender Embroidered Kurta",
    category: "Kurta Sets",
    price: 2899,
    originalPrice: 3299,
    tag: "Soft Elegance",
    image: "/images/products/product-5.jpg",
    description: "A soft lavender kurta concept with delicate tone-on-tone floral embroidery and breezy breathable fabric. Perfect for intimate daytime celebrations.",
    sizes: ["S", "M", "L", "XL"],
    colors: ["Soft Lavender"],
    fabric: "Pure Mulmul Cotton",
    care: "Gentle Hand Wash or Dry Clean",
  },
  {
    id: "prod-6",
    name: "Mustard Occasion Kurta Set",
    category: "Kurta Sets",
    price: 2999,
    originalPrice: 3499,
    tag: "Customizable",
    image: "/images/products/product-6.jpg",
    description: "A rich mustard festive kurta concept with antique gold touches. Available for bespoke sizing and color adaptations through our custom design atelier.",
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: ["Mustard Gold"],
    fabric: "Silk Blend",
    care: "Dry Clean Only",
  },
] as const;

export type SampleProduct = typeof SAMPLE_PRODUCTS[number];
