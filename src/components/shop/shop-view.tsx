"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { CatalogProduct, SortOption } from "@/types/ecommerce";
import { ProductCard } from "@/components/products/product-card";
import { Container } from "@/components/ui/container";
import { SlidersHorizontal, X, RotateCcw, ChevronDown, Check, Sparkles } from "lucide-react";

interface ShopViewProps {
  initialProducts: CatalogProduct[];
  categoryTitle?: string;
  categorySubtitle?: string;
  categorySlug?: string;
}

const CATEGORIES_LIST = [
  { slug: "all", label: "All Silhouettes" },
  { slug: "kurta-sets", label: "Kurta Sets" },
  { slug: "sarees", label: "Sarees" },
  { slug: "suits", label: "Suits" },
  { slug: "dupattas", label: "Dupattas" },
];

const PRICE_RANGES = [
  { id: "all", label: "All Prices" },
  { id: "under-3000", label: "Under ₹3,000" },
  { id: "3000-4000", label: "₹3,000 – ₹4,000" },
  { id: "above-4000", label: "Above ₹4,000" },
];

const SIZES_LIST = ["All", "XS", "S", "M", "L", "XL", "XXL", "Free Size"];

const COLOURS_LIST = [
  { id: "all", label: "All Colours" },
  { id: "Rani Pink", label: "Rani Pink", hex: "#D62568" },
  { id: "Warm Ivory", label: "Warm Ivory", hex: "#EEEAE0" },
  { id: "Forest Emerald", label: "Forest Emerald", hex: "#176B45" },
  { id: "Warm Rust", label: "Warm Rust", hex: "#B85D38" },
  { id: "Soft Lavender", label: "Soft Lavender", hex: "#C8B9D6" },
  { id: "Mustard Gold", label: "Mustard Gold", hex: "#D4A017" },
];

export function ShopView({
  initialProducts,
  categoryTitle,
  categorySubtitle,
  categorySlug,
}: ShopViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // State from URL or props
  const initialCategory = searchParams.get("category") || categorySlug || "all";
  const initialSort = (searchParams.get("sort") as SortOption) || "featured";

  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>("all");
  const [selectedSize, setSelectedSize] = useState<string>("All");
  const [selectedColor, setSelectedColor] = useState<string>("all");
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [readyToShipOnly, setReadyToShipOnly] = useState<boolean>(false);
  const [madeToOrderOnly, setMadeToOrderOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<SortOption>(initialSort);

  // Mobile drawer state
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Sync category state when URL changes
  useEffect(() => {
    const urlCat = searchParams.get("category");
    if (urlCat) {
      setSelectedCategory(urlCat);
    } else if (categorySlug) {
      setSelectedCategory(categorySlug);
    }
  }, [searchParams, categorySlug]);

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedCategory !== "all" && !categorySlug) count++;
    if (selectedPriceRange !== "all") count++;
    if (selectedSize !== "All") count++;
    if (selectedColor !== "all") count++;
    if (inStockOnly) count++;
    if (readyToShipOnly) count++;
    if (madeToOrderOnly) count++;
    return count;
  }, [
    selectedCategory,
    categorySlug,
    selectedPriceRange,
    selectedSize,
    selectedColor,
    inStockOnly,
    readyToShipOnly,
    madeToOrderOnly,
  ]);

  // Reset all filters
  const handleResetFilters = () => {
    setSelectedCategory(categorySlug || "all");
    setSelectedPriceRange("all");
    setSelectedSize("All");
    setSelectedColor("all");
    setInStockOnly(false);
    setReadyToShipOnly(false);
    setMadeToOrderOnly(false);
    if (!categorySlug) {
      router.push("/shop");
    }
  };

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let list = [...initialProducts];

    // Filter by Category
    if (selectedCategory && selectedCategory !== "all") {
      const catLower = selectedCategory.toLowerCase();
      list = list.filter(
        (p) =>
          p.categorySlug.toLowerCase() === catLower ||
          p.category.toLowerCase() === catLower
      );
    }

    // Filter by Price Range
    if (selectedPriceRange === "under-3000") {
      list = list.filter((p) => p.price < 3000);
    } else if (selectedPriceRange === "3000-4000") {
      list = list.filter((p) => p.price >= 3000 && p.price <= 4000);
    } else if (selectedPriceRange === "above-4000") {
      list = list.filter((p) => p.price > 4000);
    }

    // Filter by Size
    if (selectedSize && selectedSize !== "All") {
      list = list.filter((p) => p.sizes.includes(selectedSize));
    }

    // Filter by Colour
    if (selectedColor && selectedColor !== "all") {
      const colLower = selectedColor.toLowerCase();
      list = list.filter((p) =>
        p.colors.some((c) => c.toLowerCase() === colLower)
      );
    }

    // Filter by In Stock
    if (inStockOnly) {
      list = list.filter((p) => p.inStock);
    }

    // Filter by Ready to Ship
    if (readyToShipOnly) {
      list = list.filter((p) => p.isReadyToShip);
    }

    // Filter by Made to Order
    if (madeToOrderOnly) {
      list = list.filter((p) => p.isMadeToOrder);
    }

    // Apply Sorting
    switch (sortBy) {
      case "price-asc":
        list.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        list.sort((a, b) => b.price - a.price);
        break;
      case "newest":
        list.sort((a, b) => (b.isNewArrival ? 1 : 0) - (a.isNewArrival ? 1 : 0));
        break;
      case "alpha":
        list.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "featured":
      default:
        list.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
        break;
    }

    return list;
  }, [
    initialProducts,
    selectedCategory,
    selectedPriceRange,
    selectedSize,
    selectedColor,
    inStockOnly,
    readyToShipOnly,
    madeToOrderOnly,
    sortBy,
  ]);

  // Heading texts
  const displayTitle = categoryTitle || "The DHEERA Collection";
  const displaySubtitle =
    categorySubtitle ||
    "Thoughtfully designed contemporary silhouettes woven with India's rich artisanal heritage. Explore hand-embroidered kurta sets, fluid Chanderi sarees, and festive occasionwear crafted for quiet luxury.";

  return (
    <div className="py-8 sm:py-14 w-full overflow-x-hidden">
      <Container size="default">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="mb-4 sm:mb-6 text-xs text-[#74786F]">
          <ol className="flex items-center space-x-1.5 sm:space-x-2 flex-wrap">
            <li>
              <Link href="/" className="hover:text-[#176B45] transition-colors">
                Home
              </Link>
            </li>
            <li className="text-[#AA9160]">/</li>
            <li>
              <Link href="/shop" className="hover:text-[#176B45] transition-colors">
                Shop
              </Link>
            </li>
            {categoryTitle && (
              <>
                <li className="text-[#AA9160]">/</li>
                <li className="text-[#176B45] font-medium truncate max-w-[150px] sm:max-w-none">
                  {categoryTitle}
                </li>
              </>
            )}
          </ol>
        </nav>

        {/* Editorial Header */}
        <div className="max-w-3xl mb-8 sm:mb-12">
          <span className="text-[9px] sm:text-[10px] uppercase tracking-luxury text-[#AA9160] font-semibold block mb-1.5 sm:mb-2">
            Artisanal Catalogue & Edits
          </span>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-serif text-[#176B45] mb-2 sm:mb-4 break-words">
            {displayTitle}
          </h1>
          <p className="text-xs sm:text-sm text-[#74786F] leading-relaxed break-words">
            {displaySubtitle}
          </p>

          {/* Development Notice */}
          <div className="mt-3 inline-flex items-center gap-1.5 text-[9px] sm:text-[10px] uppercase tracking-luxury text-[#315039] bg-[#176B45]/10 px-2.5 py-1 border border-[#176B45]/20">
            <Sparkles className="w-3 h-3 text-[#AA9160]" />
            <span>Development Preview — Illustrative Concept Products</span>
          </div>
        </div>

        {/* Control Toolbar */}
        <div className="pb-4 sm:pb-6 mb-6 sm:mb-8 border-b border-[#E2DFD6] flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center justify-between sm:justify-start gap-3 w-full sm:w-auto">
            <span className="text-xs uppercase tracking-luxury text-[#176B45] font-semibold">
              Showing {filteredProducts.length} {filteredProducts.length === 1 ? "Piece" : "Handcrafted Pieces"}
            </span>

            {/* Mobile Filter Trigger Button */}
            <button
              type="button"
              onClick={() => setMobileFilterOpen(true)}
              className="lg:hidden inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF9F5] border border-[#E2DFD6] text-xs uppercase tracking-luxury text-[#176B45] font-medium"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#AA9160]" />
              <span>Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}</span>
            </button>
          </div>

          {/* Sorting Selector */}
          <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 w-full sm:w-auto">
            <label htmlFor="shop-sort" className="text-xs uppercase tracking-luxury text-[#74786F] flex-shrink-0">
              Sort By:
            </label>
            <div className="relative flex-1 sm:flex-initial">
              <select
                id="shop-sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="w-full sm:w-auto appearance-none bg-[#FAF9F5] border border-[#E2DFD6] px-3 py-1.5 sm:py-2 pr-7 sm:pr-8 text-xs text-[#252A25] uppercase tracking-luxury font-medium focus:outline-none focus:border-[#176B45] transition-colors cursor-pointer"
              >
                <option value="featured">Featured Curations</option>
                <option value="newest">New Arrivals</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="alpha">Alphabetical (A – Z)</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#AA9160] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Active Filter Chips */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-6 sm:mb-8 p-3 bg-[#FAF9F5] border border-[#E2DFD6]">
            <span className="text-[10px] uppercase tracking-luxury text-[#74786F] font-semibold mr-1">
              Active Filters:
            </span>

            {selectedCategory !== "all" && !categorySlug && (
              <button
                onClick={() => setSelectedCategory("all")}
                className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] bg-[#EEEAE0] px-2.5 py-1 text-[#176B45] border border-[#E2DFD6] hover:bg-white transition-colors"
              >
                <span>Category: {selectedCategory}</span>
                <X className="w-3 h-3" />
              </button>
            )}

            {selectedPriceRange !== "all" && (
              <button
                onClick={() => setSelectedPriceRange("all")}
                className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] bg-[#EEEAE0] px-2.5 py-1 text-[#176B45] border border-[#E2DFD6] hover:bg-white transition-colors"
              >
                <span>Price: {PRICE_RANGES.find((p) => p.id === selectedPriceRange)?.label}</span>
                <X className="w-3 h-3" />
              </button>
            )}

            {selectedSize !== "All" && (
              <button
                onClick={() => setSelectedSize("All")}
                className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] bg-[#EEEAE0] px-2.5 py-1 text-[#176B45] border border-[#E2DFD6] hover:bg-white transition-colors"
              >
                <span>Size: {selectedSize}</span>
                <X className="w-3 h-3" />
              </button>
            )}

            {selectedColor !== "all" && (
              <button
                onClick={() => setSelectedColor("all")}
                className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] bg-[#EEEAE0] px-2.5 py-1 text-[#176B45] border border-[#E2DFD6] hover:bg-white transition-colors"
              >
                <span>Colour: {selectedColor}</span>
                <X className="w-3 h-3" />
              </button>
            )}

            {inStockOnly && (
              <button
                onClick={() => setInStockOnly(false)}
                className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] bg-[#EEEAE0] px-2.5 py-1 text-[#176B45] border border-[#E2DFD6] hover:bg-white transition-colors"
              >
                <span>In Stock Only</span>
                <X className="w-3 h-3" />
              </button>
            )}

            {readyToShipOnly && (
              <button
                onClick={() => setReadyToShipOnly(false)}
                className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] bg-[#EEEAE0] px-2.5 py-1 text-[#176B45] border border-[#E2DFD6] hover:bg-white transition-colors"
              >
                <span>Ready to Ship</span>
                <X className="w-3 h-3" />
              </button>
            )}

            {madeToOrderOnly && (
              <button
                onClick={() => setMadeToOrderOnly(false)}
                className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] bg-[#EEEAE0] px-2.5 py-1 text-[#176B45] border border-[#E2DFD6] hover:bg-white transition-colors"
              >
                <span>Made to Order</span>
                <X className="w-3 h-3" />
              </button>
            )}

            <button
              onClick={handleResetFilters}
              className="text-[10px] uppercase tracking-luxury text-[#AA9160] hover:text-[#176B45] font-semibold ml-auto flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset All</span>
            </button>
          </div>
        )}

        {/* Main Grid Section (Desktop Sidebar + Product Grid) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
          {/* Desktop Filter Sidebar */}
          <aside className="hidden lg:block lg:col-span-3 sticky top-28 space-y-6 p-6 bg-[#FAF9F5] border border-[#E2DFD6]">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2DFD6]">
              <span className="text-[11px] uppercase tracking-luxury text-[#176B45] font-semibold flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#AA9160]" />
                <span>Filter Collection</span>
              </span>
              {activeFiltersCount > 0 && (
                <button
                  onClick={handleResetFilters}
                  className="text-[10px] uppercase tracking-luxury text-[#AA9160] hover:text-[#176B45]"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Category Filter */}
            {!categorySlug && (
              <div className="space-y-2.5">
                <span className="text-[10px] uppercase tracking-luxury text-[#74786F] font-semibold block">
                  Category
                </span>
                <div className="space-y-1.5 text-xs">
                  {CATEGORIES_LIST.map((cat) => (
                    <button
                      key={cat.slug}
                      type="button"
                      onClick={() => setSelectedCategory(cat.slug)}
                      className={`w-full text-left py-1 px-2 flex items-center justify-between transition-colors ${
                        selectedCategory === cat.slug
                          ? "bg-[#176B45] text-white font-medium"
                          : "text-[#252A25] hover:bg-[#EEEAE0]/70"
                      }`}
                    >
                      <span>{cat.label}</span>
                      {selectedCategory === cat.slug && <Check className="w-3 h-3" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Price Range Filter */}
            <div className="space-y-2.5 pt-4 border-t border-[#E2DFD6]">
              <span className="text-[10px] uppercase tracking-luxury text-[#74786F] font-semibold block">
                Price Range
              </span>
              <div className="space-y-1.5 text-xs">
                {PRICE_RANGES.map((rng) => (
                  <button
                    key={rng.id}
                    type="button"
                    onClick={() => setSelectedPriceRange(rng.id)}
                    className={`w-full text-left py-1 px-2 flex items-center justify-between transition-colors ${
                      selectedPriceRange === rng.id
                        ? "bg-[#176B45] text-white font-medium"
                        : "text-[#252A25] hover:bg-[#EEEAE0]/70"
                    }`}
                  >
                    <span>{rng.label}</span>
                    {selectedPriceRange === rng.id && <Check className="w-3 h-3" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Size Filter */}
            <div className="space-y-2.5 pt-4 border-t border-[#E2DFD6]">
              <span className="text-[10px] uppercase tracking-luxury text-[#74786F] font-semibold block">
                Size
              </span>
              <div className="flex flex-wrap gap-1.5">
                {SIZES_LIST.map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setSelectedSize(sz)}
                    className={`text-xs px-2.5 py-1 border transition-all ${
                      selectedSize === sz
                        ? "border-[#176B45] bg-[#176B45] text-white font-medium"
                        : "border-[#E2DFD6] bg-white text-[#252A25] hover:border-[#176B45]"
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>

            {/* Colour Filter */}
            <div className="space-y-2.5 pt-4 border-t border-[#E2DFD6]">
              <span className="text-[10px] uppercase tracking-luxury text-[#74786F] font-semibold block">
                Colour
              </span>
              <div className="space-y-1.5 text-xs">
                {COLOURS_LIST.map((col) => (
                  <button
                    key={col.id}
                    type="button"
                    onClick={() => setSelectedColor(col.id)}
                    className={`w-full text-left py-1 px-2 flex items-center justify-between transition-colors ${
                      selectedColor === col.id
                        ? "bg-[#176B45] text-white font-medium"
                        : "text-[#252A25] hover:bg-[#EEEAE0]/70"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {col.hex && (
                        <span
                          className="w-3 h-3 rounded-full border border-black/10 inline-block"
                          style={{ backgroundColor: col.hex }}
                        />
                      )}
                      <span>{col.label}</span>
                    </div>
                    {selectedColor === col.id && <Check className="w-3 h-3" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Availability & Lead Time Toggles */}
            <div className="space-y-2.5 pt-4 border-t border-[#E2DFD6]">
              <span className="text-[10px] uppercase tracking-luxury text-[#74786F] font-semibold block">
                Availability & Delivery
              </span>
              <div className="space-y-2 text-xs text-[#252A25]">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={(e) => setInStockOnly(e.target.checked)}
                    className="accent-[#176B45] w-3.5 h-3.5"
                  />
                  <span>In Stock Only</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={readyToShipOnly}
                    onChange={(e) => setReadyToShipOnly(e.target.checked)}
                    className="accent-[#176B45] w-3.5 h-3.5"
                  />
                  <span>Ready to Ship</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={madeToOrderOnly}
                    onChange={(e) => setMadeToOrderOnly(e.target.checked)}
                    className="accent-[#176B45] w-3.5 h-3.5"
                  />
                  <span>Made to Order</span>
                </label>
              </div>
            </div>
          </aside>

          {/* Product Grid Area */}
          <main className="lg:col-span-9 w-full">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-16 px-4 bg-[#FAF9F5] border border-[#E2DFD6] space-y-4">
                <span className="text-2xl text-[#AA9160] font-serif">✦</span>
                <h3 className="font-serif text-xl sm:text-2xl text-[#176B45]">
                  No Pieces Match Your Selected Filters
                </h3>
                <p className="text-xs text-[#74786F] max-w-md mx-auto leading-relaxed">
                  We could not find any garments matching your exact combination of size, silhouette, and colour preferences. Try resetting your filters or exploring our custom tailoring atelier.
                </p>
                <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={handleResetFilters}
                    className="bg-[#176B45] hover:bg-[#315039] text-[#FAF9F5] text-xs uppercase tracking-luxury px-5 py-2.5 transition-colors"
                  >
                    Reset All Filters
                  </button>
                  <Link
                    href="/product/custom"
                    className="border border-[#176B45] text-[#176B45] hover:bg-[#176B45] hover:text-white text-xs uppercase tracking-luxury px-5 py-2.5 transition-colors"
                  >
                    Bespoke Custom Atelier
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                {filteredProducts.map((product, index) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    priority={index < 4}
                  />
                ))}
              </div>
            )}
          </main>
        </div>

        {/* Mobile Filter Drawer */}
        {mobileFilterOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden flex justify-end">
            <div className="bg-[#FAF9F5] w-full max-w-[300px] sm:max-w-xs h-full overflow-y-auto p-5 sm:p-6 flex flex-col justify-between animate-fade-in">
              <div className="space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-[#E2DFD6]">
                  <span className="text-xs uppercase tracking-luxury text-[#176B45] font-semibold">
                    Filter Catalogue
                  </span>
                  <button
                    onClick={() => setMobileFilterOpen(false)}
                    className="p-1 text-[#74786F]"
                    aria-label="Close filters"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Mobile Categories */}
                {!categorySlug && (
                  <div>
                    <span className="text-[10px] uppercase tracking-luxury text-[#74786F] font-semibold block mb-1.5">
                      Category
                    </span>
                    <div className="space-y-1 text-xs">
                      {CATEGORIES_LIST.map((cat) => (
                        <button
                          key={cat.slug}
                          onClick={() => setSelectedCategory(cat.slug)}
                          className={`w-full text-left py-1.5 px-2 flex justify-between ${
                            selectedCategory === cat.slug ? "bg-[#176B45] text-white" : "text-[#252A25]"
                          }`}
                        >
                          <span>{cat.label}</span>
                          {selectedCategory === cat.slug && <Check className="w-3.5 h-3.5" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Mobile Price */}
                <div>
                  <span className="text-[10px] uppercase tracking-luxury text-[#74786F] font-semibold block mb-1.5">
                    Price Range
                  </span>
                  <div className="space-y-1 text-xs">
                    {PRICE_RANGES.map((rng) => (
                      <button
                        key={rng.id}
                        onClick={() => setSelectedPriceRange(rng.id)}
                        className={`w-full text-left py-1.5 px-2 flex justify-between ${
                          selectedPriceRange === rng.id ? "bg-[#176B45] text-white" : "text-[#252A25]"
                        }`}
                      >
                        <span>{rng.label}</span>
                        {selectedPriceRange === rng.id && <Check className="w-3.5 h-3.5" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mobile Size */}
                <div>
                  <span className="text-[10px] uppercase tracking-luxury text-[#74786F] font-semibold block mb-1.5">
                    Size
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {SIZES_LIST.map((sz) => (
                      <button
                        key={sz}
                        onClick={() => setSelectedSize(sz)}
                        className={`text-xs px-2.5 py-1 border ${
                          selectedSize === sz
                            ? "border-[#176B45] bg-[#176B45] text-white"
                            : "border-[#E2DFD6] bg-white text-[#252A25]"
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mobile Colour */}
                <div>
                  <span className="text-[10px] uppercase tracking-luxury text-[#74786F] font-semibold block mb-1.5">
                    Colour
                  </span>
                  <div className="space-y-1 text-xs">
                    {COLOURS_LIST.map((col) => (
                      <button
                        key={col.id}
                        onClick={() => setSelectedColor(col.id)}
                        className={`w-full text-left py-1 px-2 flex justify-between ${
                          selectedColor === col.id ? "bg-[#176B45] text-white" : "text-[#252A25]"
                        }`}
                      >
                        <span>{col.label}</span>
                        {selectedColor === col.id && <Check className="w-3.5 h-3.5" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mobile Delivery */}
                <div className="space-y-2 text-xs text-[#252A25]">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={inStockOnly}
                      onChange={(e) => setInStockOnly(e.target.checked)}
                      className="accent-[#176B45]"
                    />
                    <span>In Stock Only</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={readyToShipOnly}
                      onChange={(e) => setReadyToShipOnly(e.target.checked)}
                      className="accent-[#176B45]"
                    />
                    <span>Ready to Ship</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={madeToOrderOnly}
                      onChange={(e) => setMadeToOrderOnly(e.target.checked)}
                      className="accent-[#176B45]"
                    />
                    <span>Made to Order</span>
                  </label>
                </div>
              </div>

              {/* Mobile Drawer Bottom Actions */}
              <div className="pt-4 border-t border-[#E2DFD6] space-y-2">
                <button
                  onClick={() => setMobileFilterOpen(false)}
                  className="w-full bg-[#176B45] text-white py-2.5 text-xs uppercase tracking-luxury font-medium"
                >
                  Apply Filters ({filteredProducts.length} Results)
                </button>
                <button
                  onClick={handleResetFilters}
                  className="w-full py-1.5 text-xs uppercase tracking-luxury text-[#74786F] hover:text-[#176B45]"
                >
                  Reset All Filters
                </button>
              </div>
            </div>
          </div>
        )}
      </Container>
    </div>
  );
}
