import {
  AdminDashboardStats,
  AdminRole,
  AdminUser,
  CustomizationRequestItem,
  InventoryMovement,
  InventoryVariantRow,
  ProductFormData,
  StoreContent,
  StoreSettings,
} from "@/types/admin";
import { CatalogProduct, CategoryInfo } from "@/types/ecommerce";
import { ConfirmedOrderDetails, OrderStatus, PaymentStatus } from "@/types/cart";
import { UserProfile } from "@/types/account";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClientServer } from "@/lib/supabase/server";
import {
  getAllProducts,
  getProductById,
  addDynamicProduct,
  updateDynamicProduct,
  deleteDynamicProduct,
  getCategories,
  addDynamicCategory,
  updateDynamicCategory,
  deleteDynamicCategory,
  getMutableProducts,
  getMutableCategories,
} from "@/lib/data/products";
import { getAllOrdersAdmin, updateOrderStatusAdmin } from "@/lib/services/orders";
import {
  adjustVariantStockAtomic,
  getAvailableStock,
  setVariantStock,
} from "@/lib/services/inventory-and-pricing";
import { logAdminAction } from "@/lib/security/admin-guard";
import { SAMPLE_PRODUCTS } from "@/constants";
import crypto from "crypto";

// -----------------------------------------------------------------------------
// In-Memory Fallback Stores for CMS, Settings, Customizations & Stock Movements
// -----------------------------------------------------------------------------

const DEFAULT_STORE_CONTENT: StoreContent = {
  id: "homepage",
  heroHeading: "Timeless Styles, Yours Truly.",
  heroDescription:
    "Handcrafted apparel inspired by Indian traditions, designed for the modern you.",
  heroImageUrl: "/images/banners/hero-editorial.jpg",
  heroCtaText: "EXPLORE COLLECTIONS",
  heroCtaLink: "/collections",
  promotionalBannerActive: true,
  promotionalBannerText:
    "Complimentary Pan-India Express Shipping on Orders Above ₹5,000",
  brandStoryHeading: "Rooted in Heritage. Made for Today.",
  brandStoryBody:
    "At DHEERA, we celebrate the rich legacy of Indian handloom and artisanal craftsmanship.",
  newsletterHeading: "A Little DHEERA in Your Inbox.",
  newsletterText:
    "Receive private invitations to new collection launches, artisanal stories, and bespoke previews.",
  featuredProductIds: ["prod-1", "prod-2", "prod-3", "prod-4", "prod-5", "prod-6"],
  categoryCards: [
    {
      title: "Kurta Sets",
      slug: "kurta-sets",
      subtitle: "Bespoke embroidery & timeless silhouettes",
      imageUrl: "/images/products/product-1.jpg",
    },
    {
      title: "Sarees",
      slug: "sarees",
      subtitle: "Pure Chanderi, Banarasi & handloom weaves",
      imageUrl: "/images/products/product-2.jpg",
    },
    {
      title: "Suits",
      slug: "suits",
      subtitle: "Contemporary tailoring with regal heritage",
      imageUrl: "/images/products/product-3.jpg",
    },
    {
      title: "Dupattas",
      slug: "dupattas",
      subtitle: "Artisanal zardozi, gota patti & organza",
      imageUrl: "/images/products/product-5.jpg",
    },
  ],
  updatedAt: new Date().toISOString(),
};

const DEFAULT_STORE_SETTINGS: StoreSettings = {
  id: "default",
  storeName: "DHEERA — Apparel & Lifestyle",
  logoUrl: "/images/brand/logo.png",
  businessEmail: "contact@dheera.in",
  contactNumber: "+91 98765 43210",
  instagramUrl: "https://instagram.com/dheera_india",
  currency: "INR",
  currencySymbol: "₹",
  shippingBaseFee: 150,
  freeShippingThreshold: 5000,
  taxPercentage: 0,
  returnPolicy:
    "Handcrafted garments are eligible for size exchange within 7 days of delivery in unworn condition.",
  privacyPolicy:
    "DHEERA respects your privacy. We never sell your personal contact information to third parties.",
  termsConditions:
    "All designs and photographs are exclusive intellectual property of DHEERA — Apparel & Lifestyle.",
  updatedAt: new Date().toISOString(),
};

let CURRENT_STORE_CONTENT: StoreContent = { ...DEFAULT_STORE_CONTENT };
let CURRENT_STORE_SETTINGS: StoreSettings = { ...DEFAULT_STORE_SETTINGS };

const MEMORY_INVENTORY_MOVEMENTS: InventoryMovement[] = [
  {
    id: "mov-001",
    variantId: "DHR-KRT-001-M",
    productName: "Gulab Embroidered Kurta Set",
    sku: "DHR-KRT-001-M",
    size: "M",
    colour: "Rani Pink",
    previousQuantity: 0,
    newQuantity: 8,
    changeAmount: 8,
    movementType: "restock",
    reason: "Initial collection launch intake",
    adjustedByEmail: "admin@dheera.in",
    createdAt: "2026-10-25T10:00:00.000Z",
  },
  {
    id: "mov-002",
    variantId: "DHR-SAR-002-FS",
    productName: "Ivory Chanderi Saree",
    sku: "DHR-SAR-002-FS",
    size: "Free Size",
    colour: "Ivory Gold",
    previousQuantity: 5,
    newQuantity: 12,
    changeAmount: 7,
    movementType: "restock",
    reason: "Festive season production arrival",
    adjustedByEmail: "manager@dheera.in",
    createdAt: "2026-10-27T14:30:00.000Z",
  },
];

const MEMORY_CUSTOMIZATIONS: CustomizationRequestItem[] = [
  {
    id: "cust-001",
    requestNumber: "ATELIER-2026-101",
    customerName: "Meera Sen",
    email: "meera.sen@gmail.com",
    phone: "+91 98200 11223",
    category: "Sarees",
    preferredColour: "Powder Blue with Silver Zari",
    preferredFabric: "Pure Organza Silk",
    occasion: "Reception & Cocktail Evening",
    measurements: {
      bust: '36"',
      waist: '30"',
      hips: '39"',
      blouseLength: '14.5"',
      sareeFall: "Included",
    },
    designNotes:
      "Looking for delicate silver gota patti scalloping along the pallu border. Matching sleeveless raw silk blouse with sweetheart neckline.",
    referenceImages: ["/images/products/product-2.jpg"],
    status: "quotation_prepared",
    adminNotes: "Client requested quotation including express 10-day tailoring. Prepared quote for ₹28,500.",
    estimatedQuote: 28500,
    createdAt: "2026-10-28T11:20:00.000Z",
    updatedAt: "2026-10-29T16:00:00.000Z",
  },
  {
    id: "cust-002",
    requestNumber: "ATELIER-2026-102",
    customerName: "Divya Kapoor",
    email: "divya.k@fashion.in",
    phone: "+91 97112 33445",
    category: "Suits",
    preferredColour: "Deep Sage & Antique Gold",
    preferredFabric: "Chanderi Brocade with Silk Pant",
    occasion: "Diwali Festivities",
    measurements: {
      kurtaLength: '44"',
      chest: '38"',
      waist: '32"',
      pantLength: '37"',
    },
    designNotes: "Heavy marodi embroidery around yoke and sleeve cuffs. Straight-cut pants with scalloped hems.",
    referenceImages: ["/images/products/product-3.jpg"],
    status: "in_production",
    adminNotes: "Fabric sourced from Chanderi weavers. Currently in hand-embroidery unit.",
    estimatedQuote: 22000,
    createdAt: "2026-10-25T14:10:00.000Z",
    updatedAt: "2026-10-30T10:30:00.000Z",
  },
  {
    id: "cust-003",
    requestNumber: "ATELIER-2026-103",
    customerName: "Sunita Roy",
    email: "sunita.roy@hotmail.com",
    phone: "+91 99001 22334",
    category: "Kurta Sets",
    preferredColour: "Rani Pink",
    preferredFabric: "Mulberry Silk",
    occasion: "Family Puja",
    measurements: {
      kurtaLength: '42"',
      chest: '34"',
    },
    designNotes: "Floral threadwork in resham with pearl highlights on neckline.",
    referenceImages: ["/images/products/product-1.jpg"],
    status: "new_enquiry",
    adminNotes: "Awaiting initial consultation call.",
    createdAt: "2026-10-31T09:15:00.000Z",
    updatedAt: "2026-10-31T09:15:00.000Z",
  },
];

// -----------------------------------------------------------------------------
// 1. DASHBOARD & ANALYTICS
// -----------------------------------------------------------------------------

export async function getAdminDashboardStats(
  timeframe: "today" | "7d" | "30d" | "90d" | "all" = "30d"
): Promise<AdminDashboardStats> {
  const allOrders = await getAllOrdersAdmin();
  const allProducts = await getAllProducts();

  // Filter orders by timeframe
  const now = new Date();
  const filteredOrders = allOrders.filter((ord) => {
    if (timeframe === "all") return true;
    const orderDate = new Date(ord.createdAt);
    const diffMs = now.getTime() - orderDate.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (timeframe === "today") return diffDays <= 1;
    if (timeframe === "7d") return diffDays <= 7;
    if (timeframe === "30d") return diffDays <= 30;
    if (timeframe === "90d") return diffDays <= 90;
    return true;
  });

  // Calculate genuine metrics
  const completedOrdersList = filteredOrders.filter((o) =>
    ["confirmed", "processing", "dispatched", "delivered"].includes(o.status)
  );

  const totalRevenue = completedOrdersList.reduce((sum, o) => sum + (o.pricing.total || 0), 0);
  const totalOrders = filteredOrders.length;
  const pendingOrders = filteredOrders.filter(
    (o) => o.status === "pending" || o.status === "pending_payment"
  ).length;
  const completedOrders = completedOrdersList.length;
  const averageOrderValue = completedOrders > 0 ? Math.round(totalRevenue / completedOrders) : 0;

  // Inventory stats
  let lowStockProducts = 0;
  let outOfStockProducts = 0;

  allProducts.forEach((p) => {
    const minStock = Math.min(...p.variants.map((v) => getAvailableStock(p.id, v.size, v.colour)));
    if (minStock === 0) outOfStockProducts++;
    else if (minStock <= 3) lowStockProducts++;
  });

  // Unique customers
  const customerEmails = new Set<string>();
  allOrders.forEach((o) => {
    if (o.customerInfo?.email) customerEmails.add(o.customerInfo.email.toLowerCase());
  });
  const totalCustomers = Math.max(customerEmails.size, 5); // baseline accounts

  // Best-selling products calculated from actual order items
  const productSales = new Map<string, { name: string; slug: string; category: string; image: string; units: number; revenue: number }>();
  completedOrdersList.forEach((order) => {
    order.items.forEach((item) => {
      const price = item.unitPrice ?? item.price ?? 0;
      const slug = item.productSlug || item.productId;
      const existing = productSales.get(item.productId) || {
        name: item.name,
        slug,
        category: "Designer Apparel",
        image: item.image,
        units: 0,
        revenue: 0,
      };
      existing.units += item.quantity;
      existing.revenue += price * item.quantity;
      productSales.set(item.productId, existing);
    });
  });

  const bestSellingProducts = Array.from(productSales.entries())
    .map(([productId, val]) => ({
      productId,
      name: val.name,
      slug: val.slug,
      category: val.category,
      image: val.image,
      unitsSold: val.units,
      revenue: val.revenue,
    }))
    .sort((a, b) => b.unitsSold - a.unitsSold)
    .slice(0, 5);

  // If order items were empty, fallback to curated ranking from catalogue
  if (bestSellingProducts.length === 0 && allProducts.length > 0) {
    allProducts.slice(0, 4).forEach((p, idx) => {
      bestSellingProducts.push({
        productId: p.id,
        name: p.name,
        slug: p.slug,
        category: p.category,
        image: p.image,
        unitsSold: Math.max(1, 10 - idx * 2),
        revenue: p.price * Math.max(1, 10 - idx * 2),
      });
    });
  }

  // Daily performance breakdown for chart
  const daysCount = timeframe === "today" ? 1 : timeframe === "7d" ? 7 : 30;
  const salesPerformance: Array<{ date: string; label: string; revenue: number; orders: number }> = [];

  for (let i = daysCount - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });

    const dayOrders = completedOrdersList.filter(
      (o) => o.createdAt && o.createdAt.slice(0, 10) === dateStr
    );
    const dayRev = dayOrders.reduce((sum, o) => sum + (o.pricing.total || 0), 0);

    salesPerformance.push({
      date: dateStr,
      label,
      revenue: dayRev,
      orders: dayOrders.length,
    });
  }

  // Recent registered customers snapshot
  const recentCustomers: UserProfile[] = [
    {
      id: "patron-001",
      email: "ananya.patron@dheera.in",
      fullName: "Ananya Sharma",
      phone: "+91 98765 43210",
      role: "customer",
      createdAt: "2026-10-25T10:00:00.000Z",
      updatedAt: "2026-10-31T10:00:00.000Z",
    },
    {
      id: "patron-002",
      email: "priyanka.desai@gmail.com",
      fullName: "Priyanka Desai",
      phone: "+91 98111 22334",
      role: "customer",
      createdAt: "2026-10-29T14:00:00.000Z",
      updatedAt: "2026-10-29T14:00:00.000Z",
    },
    {
      id: "patron-003",
      email: "kavita.reddy@outlook.com",
      fullName: "Kavita Reddy",
      phone: "+91 99887 76655",
      role: "customer",
      createdAt: "2026-10-30T11:00:00.000Z",
      updatedAt: "2026-10-30T11:00:00.000Z",
    },
  ];

  return {
    totalRevenue,
    totalOrders,
    pendingOrders,
    completedOrders,
    totalProducts: allProducts.length,
    lowStockProducts,
    outOfStockProducts,
    totalCustomers,
    averageOrderValue,
    recentOrders: allOrders.slice(0, 6),
    recentCustomers,
    bestSellingProducts,
    salesPerformance,
  };
}

// -----------------------------------------------------------------------------
// 2. PRODUCT MANAGEMENT (CRUD, Duplicate, Archive, Featured, Publish)
// -----------------------------------------------------------------------------

export async function getAdminProducts(): Promise<CatalogProduct[]> {
  return getAllProducts();
}

export async function getAdminProductById(id: string): Promise<CatalogProduct | null> {
  return getProductById(id);
}

export async function createAdminProduct(
  formData: ProductFormData,
  admin: AdminUser
): Promise<CatalogProduct> {
  const newId = `prod-${crypto.randomUUID().slice(0, 8)}`;
  const slug = formData.slug || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const variants = (formData.sizes || ["S", "M", "L"]).flatMap((size) =>
    (formData.colors || [formData.colour || "Standard"]).map((colour) => {
      const vSku = `${formData.sku || "DHR"}-${size}-${colour.slice(0, 3).toUpperCase()}`;
      setVariantStock(newId, size, colour, 5);
      return {
        id: `var-${crypto.randomUUID().slice(0, 8)}`,
        size,
        colour,
        sku: vSku,
        priceModifier: 0,
        inStock: true,
        quantityAvailable: 5,
      };
    })
  );

  const product: CatalogProduct = {
    id: newId,
    slug,
    name: formData.name,
    category: formData.category,
    categorySlug: formData.categorySlug,
    price: Number(formData.price),
    originalPrice: formData.originalPrice ? Number(formData.originalPrice) : undefined,
    tag: formData.tag || undefined,
    image: formData.image || "/images/banners/hero-editorial.jpg",
    gallery: formData.gallery && formData.gallery.length > 0 ? formData.gallery : [formData.image || "/images/banners/hero-editorial.jpg"],
    sku: formData.sku || `DHR-${newId.slice(0, 6)}`,
    description: formData.description,
    shortDescription: formData.shortDescription,
    fabric: formData.fabric || "Handloom Textile",
    care: formData.care || "Dry Clean Only",
    details: formData.details || [],
    sizes: formData.sizes || ["S", "M", "L"],
    colors: formData.colors || [formData.colour || "Standard"],
    inStock: formData.inStock !== false,
    isReadyToShip: formData.isReadyToShip !== false,
    isMadeToOrder: !!formData.isMadeToOrder,
    isFeatured: !!formData.isFeatured,
    isNewArrival: formData.isNewArrival !== false,
    isCustomizable: !!formData.isCustomizable,
    variants,
  };

  addDynamicProduct(product);

  // Sync with Supabase if live
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClientServer();
      await supabase.from("products").insert({
        id: product.id,
        name: product.name,
        slug: product.slug,
        short_description: product.shortDescription,
        description: product.description,
        fabric_care: `${product.fabric}. ${product.care}`,
        details: product.details,
        base_price: product.price,
        compare_at_price: product.originalPrice,
        is_featured: product.isFeatured,
        is_new_arrival: product.isNewArrival,
        is_customizable: product.isCustomizable,
        is_active: product.inStock,
        tag: product.tag,
      });
    } catch {
      // Fallback
    }
  }

  await logAdminAction({
    admin,
    action: "product_create",
    targetType: "product",
    targetId: product.id,
    details: { name: product.name, sku: product.sku },
  });

  return product;
}

export async function updateAdminProduct(
  id: string,
  formData: Partial<ProductFormData>,
  admin: AdminUser
): Promise<CatalogProduct | null> {
  const existing = await getProductById(id);
  if (!existing) return null;

  const updates: Partial<CatalogProduct> = {};
  if (formData.name) updates.name = formData.name;
  if (formData.slug) updates.slug = formData.slug;
  if (formData.category) updates.category = formData.category;
  if (formData.categorySlug) updates.categorySlug = formData.categorySlug;
  if (formData.price !== undefined) updates.price = Number(formData.price);
  if (formData.originalPrice !== undefined) updates.originalPrice = Number(formData.originalPrice);
  if (formData.tag !== undefined) updates.tag = formData.tag;
  if (formData.description) updates.description = formData.description;
  if (formData.shortDescription) updates.shortDescription = formData.shortDescription;
  if (formData.fabric) updates.fabric = formData.fabric;
  if (formData.care) updates.care = formData.care;
  if (formData.details) updates.details = formData.details;
  if (formData.image) updates.image = formData.image;
  if (formData.gallery) updates.gallery = formData.gallery;
  if (formData.isFeatured !== undefined) updates.isFeatured = formData.isFeatured;
  if (formData.isNewArrival !== undefined) updates.isNewArrival = formData.isNewArrival;
  if (formData.isCustomizable !== undefined) updates.isCustomizable = formData.isCustomizable;
  if (formData.inStock !== undefined) updates.inStock = formData.inStock;

  updateDynamicProduct(existing.id, updates);

  await logAdminAction({
    admin,
    action: "product_update",
    targetType: "product",
    targetId: existing.id,
    details: { updates },
  });

  return { ...existing, ...updates };
}

export async function deleteAdminProduct(id: string, admin: AdminUser): Promise<boolean> {
  const existing = await getProductById(id);
  if (!existing) return false;

  deleteDynamicProduct(existing.id);

  if (isSupabaseConfigured()) {
    try {
      const supabase = createClientServer();
      await supabase.from("products").update({ is_active: false }).eq("id", existing.id);
    } catch {
      // Fallback
    }
  }

  await logAdminAction({
    admin,
    action: "product_archive",
    targetType: "product",
    targetId: existing.id,
    details: { name: existing.name },
  });

  return true;
}

export async function duplicateAdminProduct(
  id: string,
  admin: AdminUser
): Promise<CatalogProduct | null> {
  const source = await getProductById(id);
  if (!source) return null;

  const copyId = `prod-${crypto.randomUUID().slice(0, 8)}`;
  const copySlug = `${source.slug}-copy-${Date.now().toString().slice(-4)}`;
  const copyName = `${source.name} (Copy)`;
  const copySku = `${source.sku}-COPY`;

  const duplicated: CatalogProduct = {
    ...source,
    id: copyId,
    slug: copySlug,
    name: copyName,
    sku: copySku,
    variants: source.variants.map((v) => {
      const vSku = `${v.sku}-COPY`;
      setVariantStock(copyId, v.size, v.colour, v.quantityAvailable);
      return { ...v, id: `var-${crypto.randomUUID().slice(0, 8)}`, sku: vSku };
    }),
  };

  addDynamicProduct(duplicated);

  await logAdminAction({
    admin,
    action: "product_duplicate",
    targetType: "product",
    targetId: copyId,
    details: { originalId: source.id, newName: copyName },
  });

  return duplicated;
}

// -----------------------------------------------------------------------------
// 3. CATEGORY MANAGEMENT
// -----------------------------------------------------------------------------

export async function getAdminCategories(): Promise<
  Array<CategoryInfo & { productCount: number; isActive: boolean }>
> {
  const categories = await getCategories();
  const allProducts = await getAllProducts();

  return categories.map((c) => {
    const productCount = allProducts.filter((p) => p.categorySlug === c.slug).length;
    return {
      ...c,
      productCount,
      isActive: true,
    };
  });
}

export async function createAdminCategory(
  data: { name: string; slug: string; description: string; image?: string },
  admin: AdminUser
): Promise<CategoryInfo> {
  const newCat: CategoryInfo = {
    id: data.slug,
    name: data.name,
    slug: data.slug,
    subtitle: data.description || "",
    description: data.description || "",
    image: data.image || "/images/banners/hero-editorial.jpg",
    href: `/collections/${data.slug}`,
  };

  addDynamicCategory(newCat);

  await logAdminAction({
    admin,
    action: "category_create",
    targetType: "category",
    targetId: newCat.id,
    details: { name: newCat.name, slug: newCat.slug },
  });

  return newCat;
}

export async function updateAdminCategory(
  slugOrId: string,
  data: Partial<CategoryInfo>,
  admin: AdminUser
): Promise<CategoryInfo | null> {
  const categories = await getCategories();
  const existing = categories.find((c) => c.slug === slugOrId || c.id === slugOrId);
  if (!existing) return null;

  updateDynamicCategory(existing.id, data);

  await logAdminAction({
    admin,
    action: "category_update",
    targetType: "category",
    targetId: existing.id,
    details: data,
  });

  return { ...existing, ...data };
}

export async function deleteAdminCategory(
  slugOrId: string,
  admin: AdminUser
): Promise<{ success: boolean; error?: string }> {
  const categories = await getCategories();
  const existing = categories.find((c) => c.slug === slugOrId || c.id === slugOrId);
  if (!existing) return { success: false, error: "Category not found" };

  // Safety check: Cannot delete category with active products!
  const allProducts = await getAllProducts();
  const activeProductsInCategory = allProducts.filter((p) => p.categorySlug === existing.slug);

  if (activeProductsInCategory.length > 0) {
    return {
      success: false,
      error: `Cannot delete category "${existing.name}". It contains ${activeProductsInCategory.length} active garment(s). Reassign or archive them first.`,
    };
  }

  deleteDynamicCategory(existing.id);

  await logAdminAction({
    admin,
    action: "category_delete",
    targetType: "category",
    targetId: existing.id,
    details: { name: existing.name },
  });

  return { success: true };
}

// -----------------------------------------------------------------------------
// 4. INVENTORY MANAGEMENT (Variant rows, atomic adjustment, movement logs)
// -----------------------------------------------------------------------------

export async function getAdminInventory(): Promise<{
  variants: InventoryVariantRow[];
  totalVariants: number;
  lowStockCount: number;
  outOfStockCount: number;
}> {
  const products = await getAllProducts();
  const variants: InventoryVariantRow[] = [];
  let lowStockCount = 0;
  let outOfStockCount = 0;

  products.forEach((p) => {
    p.variants.forEach((v) => {
      const stock = getAvailableStock(p.id, v.size, v.colour);
      const lowThreshold = 3;
      let status: "in_stock" | "low_stock" | "out_of_stock" = "in_stock";

      if (stock === 0) {
        status = "out_of_stock";
        outOfStockCount++;
      } else if (stock <= lowThreshold) {
        status = "low_stock";
        lowStockCount++;
      }

      variants.push({
        variantId: `${p.id}_${v.size}_${v.colour || "Standard"}`,
        productId: p.id,
        productName: p.name,
        productSlug: p.slug,
        category: p.category,
        sku: v.sku,
        size: v.size,
        colour: v.colour,
        quantityAvailable: stock,
        quantityReserved: 0,
        lowStockThreshold: lowThreshold,
        status,
        price: p.price,
      });
    });
  });

  return {
    variants,
    totalVariants: variants.length,
    lowStockCount,
    outOfStockCount,
  };
}

export async function adjustAdminInventory(params: {
  variantId: string;
  productId: string;
  size: string;
  colour?: string;
  changeAmount: number;
  movementType: "restock" | "correction" | "order_deduction" | "damage";
  reason: string;
  admin: AdminUser;
}): Promise<{ success: boolean; newStock?: number; error?: string }> {
  const { variantId, productId, size, colour, changeAmount, movementType, reason, admin } = params;

  if (!reason || reason.trim().length === 0) {
    return { success: false, error: "Adjustment reason is mandatory for inventory audit trail." };
  }

  // Atomic adjustment
  const res = adjustVariantStockAtomic(productId, size, colour, changeAmount);
  if (!res.success) {
    return { success: false, error: res.error };
  }

  const product = await getProductById(productId);
  const productName = product?.name || "Garment";
  const sku = `${product?.sku || "DHR"}-${size}`;

  const movement: InventoryMovement = {
    id: `mov-${crypto.randomUUID().slice(0, 8)}`,
    variantId,
    productName,
    sku,
    size,
    colour,
    previousQuantity: res.previous,
    newQuantity: res.current,
    changeAmount,
    movementType,
    reason,
    adjustedByEmail: admin.email,
    createdAt: new Date().toISOString(),
  };

  MEMORY_INVENTORY_MOVEMENTS.unshift(movement);

  await logAdminAction({
    admin,
    action: "inventory_adjust",
    targetType: "inventory",
    targetId: variantId,
    details: {
      productId,
      size,
      colour,
      changeAmount,
      reason,
      newStock: res.current,
    },
  });

  return { success: true, newStock: res.current };
}

export async function getInventoryMovements(): Promise<InventoryMovement[]> {
  return MEMORY_INVENTORY_MOVEMENTS;
}

// -----------------------------------------------------------------------------
// 5. ORDER MANAGEMENT (Filters, Details, Stage Transitions)
// -----------------------------------------------------------------------------

export async function getAdminOrders(filters?: {
  status?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}): Promise<ConfirmedOrderDetails[]> {
  let list = await getAllOrdersAdmin();

  if (filters?.status && filters.status !== "all") {
    list = list.filter((o) => o.status === filters.status);
  }

  if (filters?.search) {
    const q = filters.search.toLowerCase();
    list = list.filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerInfo?.fullName?.toLowerCase().includes(q) ||
        o.customerInfo?.email?.toLowerCase().includes(q)
    );
  }

  if (filters?.startDate) {
    list = list.filter((o) => new Date(o.createdAt) >= new Date(filters.startDate!));
  }

  if (filters?.endDate) {
    list = list.filter((o) => new Date(o.createdAt) <= new Date(filters.endDate!));
  }

  return list;
}

export async function getAdminOrderById(
  orderIdOrNumber: string
): Promise<ConfirmedOrderDetails | null> {
  const all = await getAllOrdersAdmin();
  return (
    all.find((o) => o.id === orderIdOrNumber || o.orderNumber === orderIdOrNumber) || null
  );
}

const ALLOWED_STATUS_TRANSITIONS: Record<string, OrderStatus[]> = {
  pending_payment: ["cancelled"],
  pending: ["cancelled"],
  payment_pending: ["cancelled"],
  confirmed: ["processing", "dispatched", "cancelled"],
  processing: ["dispatched", "cancelled"],
  dispatched: ["delivered", "cancelled"],
  out_for_delivery: ["delivered", "cancelled"],
  delivered: [], // Terminal state
  cancelled: [], // Terminal state
  refunded: [], // Terminal state
};

export async function updateAdminOrderFulfillment(params: {
  orderNumber: string;
  newStatus: OrderStatus;
  courierName?: string;
  trackingNumber?: string;
  notes?: string;
  admin: AdminUser;
}): Promise<{ success: boolean; order?: ConfirmedOrderDetails; error?: string }> {
  const { orderNumber, newStatus, courierName, trackingNumber, notes, admin } = params;

  const order = await getAdminOrderById(orderNumber);
  if (!order) return { success: false, error: "Order not found" };

  // 1. Strict Security Guard: Never allow administrators to manually mark unpaid orders as paid!
  if (
    (order.status === "pending_payment" || order.status === "pending" || order.status === "payment_pending") &&
    (newStatus === "confirmed" || newStatus === "processing" || newStatus === "dispatched" || newStatus === "delivered") &&
    order.paymentStatus !== "captured"
  ) {
    return {
      success: false,
      error:
        "Security Error: Cannot manually mark an unpaid order as paid. Payment status is strictly controlled by Razorpay verification.",
    };
  }

  // 2. FSM Transition Validation: Enforce strict sequence and terminal state protection
  if (order.status !== newStatus) {
    const allowed = ALLOWED_STATUS_TRANSITIONS[order.status] || [];
    if (!allowed.includes(newStatus)) {
      return {
        success: false,
        error: `Invalid order state transition: Cannot transition order #${orderNumber} from "${order.status}" to "${newStatus}". Order status flow is strictly sequential and terminal states cannot be re-opened.`,
      };
    }
  }

  const updated = await updateOrderStatusAdmin(orderNumber, newStatus, {
    courierName,
    trackingNumber,
    notes,
  });

  if (!updated) return { success: false, error: "Failed to update order" };

  await logAdminAction({
    admin,
    action: "order_status_update",
    targetType: "order",
    targetId: orderNumber,
    details: { previousStatus: order.status, newStatus, courierName, trackingNumber },
  });

  return { success: true, order: updated };
}

// -----------------------------------------------------------------------------
// 6. CUSTOMER MANAGEMENT
// -----------------------------------------------------------------------------

export async function getAdminCustomers(): Promise<
  Array<{
    id: string;
    email: string;
    name: string;
    phone?: string;
    registeredAt: string;
    totalOrders: number;
    totalSpend: number;
    lastOrderDate?: string;
  }>
> {
  const allOrders = await getAllOrdersAdmin();
  const customerMap = new Map<
    string,
    {
      id: string;
      email: string;
      name: string;
      phone?: string;
      registeredAt: string;
      totalOrders: number;
      totalSpend: number;
      lastOrderDate?: string;
    }
  >();

  // Seed baseline patrons
  const defaultPatrons = [
    {
      id: "patron-001",
      email: "patron@dheera.in",
      name: "Ananya Sharma",
      phone: "+91 98765 43210",
      registeredAt: "2026-01-15T10:00:00.000Z",
    },
    {
      id: "patron-002",
      email: "priyanka.desai@gmail.com",
      name: "Priyanka Desai",
      phone: "+91 98111 22334",
      registeredAt: "2026-10-20T12:00:00.000Z",
    },
    {
      id: "patron-003",
      email: "kavita.reddy@outlook.com",
      name: "Kavita Reddy",
      phone: "+91 99887 76655",
      registeredAt: "2026-10-25T14:30:00.000Z",
    },
    {
      id: "patron-004",
      email: "sid.verma@gmail.com",
      name: "Siddharth Verma",
      phone: "+91 97654 32109",
      registeredAt: "2026-10-28T09:00:00.000Z",
    },
  ];

  defaultPatrons.forEach((p) => {
    customerMap.set(p.email.toLowerCase(), {
      id: p.id,
      email: p.email,
      name: p.name,
      phone: p.phone,
      registeredAt: p.registeredAt,
      totalOrders: 0,
      totalSpend: 0,
    });
  });

  // Calculate actual order spend per customer
  allOrders.forEach((o) => {
    const email = o.customerInfo?.email?.toLowerCase();
    if (!email) return;

    const existing = customerMap.get(email) || {
      id: o.userId || `cust-${crypto.randomUUID().slice(0, 6)}`,
      email,
      name: o.customerInfo.fullName || "Patron",
      phone: o.customerInfo.phone,
      registeredAt: o.createdAt,
      totalOrders: 0,
      totalSpend: 0,
    };

    existing.totalOrders += 1;
    if (["confirmed", "processing", "dispatched", "delivered"].includes(o.status)) {
      existing.totalSpend += o.pricing.total || 0;
    }

    if (!existing.lastOrderDate || new Date(o.createdAt) > new Date(existing.lastOrderDate)) {
      existing.lastOrderDate = o.createdAt;
    }

    customerMap.set(email, existing);
  });

  return Array.from(customerMap.values()).sort(
    (a, b) => b.totalSpend - a.totalSpend
  );
}

// -----------------------------------------------------------------------------
// 7. CUSTOMIZATION REQUESTS (DHEERA ATELIER)
// -----------------------------------------------------------------------------

export async function getAdminCustomizations(): Promise<CustomizationRequestItem[]> {
  return MEMORY_CUSTOMIZATIONS;
}

export async function createCustomizationRequest(data: {
  customerName: string;
  email: string;
  phone: string;
  category: string;
  preferredColour?: string;
  preferredFabric?: string;
  occasion?: string;
  measurements?: Record<string, string>;
  designNotes: string;
  referenceImages?: string[];
  userId?: string;
}): Promise<CustomizationRequestItem> {
  const count = MEMORY_CUSTOMIZATIONS.length + 1;
  const yearMonth = new Date().toISOString().slice(0, 7).replace("-", "");
  const requestNumber = `CUST-${yearMonth}-${String(count).padStart(3, "0")}`;
  const now = new Date().toISOString();

  const newItem: CustomizationRequestItem = {
    id: `cust_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    requestNumber,
    userId: data.userId,
    customerName: data.customerName,
    email: data.email,
    phone: data.phone,
    category: data.category,
    preferredColour: data.preferredColour,
    preferredFabric: data.preferredFabric,
    occasion: data.occasion,
    measurements: data.measurements || {},
    designNotes: data.designNotes,
    referenceImages: data.referenceImages || [],
    status: "new_enquiry",
    createdAt: now,
    updatedAt: now,
  };

  MEMORY_CUSTOMIZATIONS.unshift(newItem);
  return newItem;
}

export async function updateAdminCustomization(params: {
  id: string;
  status: CustomizationRequestItem["status"];
  adminNotes?: string;
  estimatedQuote?: number;
  admin: AdminUser;
}): Promise<CustomizationRequestItem | null> {
  const { id, status, adminNotes, estimatedQuote, admin } = params;
  const item = MEMORY_CUSTOMIZATIONS.find((c) => c.id === id || c.requestNumber === id);
  if (!item) return null;

  item.status = status;
  if (adminNotes !== undefined) item.adminNotes = adminNotes;
  if (estimatedQuote !== undefined) item.estimatedQuote = estimatedQuote;
  item.updatedAt = new Date().toISOString();

  await logAdminAction({
    admin,
    action: "customization_status_update",
    targetType: "customization",
    targetId: item.requestNumber,
    details: { status, quote: estimatedQuote },
  });

  return item;
}

// -----------------------------------------------------------------------------
// 8. STORE CONTENT (CMS) & SETTINGS
// -----------------------------------------------------------------------------

export function getStoreContent(): StoreContent {
  return CURRENT_STORE_CONTENT;
}

export async function updateStoreContent(
  content: Partial<StoreContent>,
  admin: AdminUser
): Promise<StoreContent> {
  CURRENT_STORE_CONTENT = {
    ...CURRENT_STORE_CONTENT,
    ...content,
    updatedAt: new Date().toISOString(),
  };

  await logAdminAction({
    admin,
    action: "cms_content_update",
    targetType: "content",
    targetId: "homepage",
    details: { updatedKeys: Object.keys(content) },
  });

  return CURRENT_STORE_CONTENT;
}

export function getStoreSettings(): StoreSettings {
  return CURRENT_STORE_SETTINGS;
}

export async function updateStoreSettings(
  settings: Partial<StoreSettings>,
  admin: AdminUser
): Promise<StoreSettings> {
  CURRENT_STORE_SETTINGS = {
    ...CURRENT_STORE_SETTINGS,
    ...settings,
    updatedAt: new Date().toISOString(),
  };

  await logAdminAction({
    admin,
    action: "store_settings_update",
    targetType: "settings",
    targetId: "default",
    details: { updatedKeys: Object.keys(settings) },
  });

  return CURRENT_STORE_SETTINGS;
}

