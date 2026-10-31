"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useShop } from "@/context/shop-context";
import { SAMPLE_PRODUCTS, CATEGORIES } from "@/constants";
import { formatCurrencyINR } from "@/lib/utils";
import { Search, X, ArrowRight, Sparkles } from "lucide-react";

export function SearchModal() {
  const { searchOpen, setSearchOpen } = useShop();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery("");
    }
  }, [searchOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && searchOpen) {
        setSearchOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [searchOpen, setSearchOpen]);

  if (!searchOpen) return null;

  const normalizedQuery = query.toLowerCase().trim();

  // Multi-attribute search across name, category, colour, fabric, description, details
  const filteredProducts = normalizedQuery
    ? SAMPLE_PRODUCTS.filter((p) => {
        const inName = p.name.toLowerCase().includes(normalizedQuery);
        const inCategory = p.category.toLowerCase().includes(normalizedQuery);
        const inDesc = p.description.toLowerCase().includes(normalizedQuery);
        const inFabric = p.fabric.toLowerCase().includes(normalizedQuery);
        const inColors = p.colors.some((c) => c.toLowerCase().includes(normalizedQuery));
        const inDetails = p.details ? p.details.some((d) => d.toLowerCase().includes(normalizedQuery)) : false;
        return inName || inCategory || inDesc || inFabric || inColors || inDetails;
      })
    : [];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col justify-start items-center p-4 sm:p-8 animate-fade-in">
      <div className="bg-[#FAF9F5] w-full max-w-3xl border border-[#E2DFD6] shadow-2xl p-6 sm:p-8 relative mt-12 sm:mt-16">
        {/* Close Button */}
        <button
          onClick={() => setSearchOpen(false)}
          className="absolute top-6 right-6 p-2 text-[#74786F] hover:text-[#176B45] transition-colors"
          aria-label="Close search"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Search Header */}
        <div className="mb-6">
          <span className="text-[10px] uppercase tracking-luxury text-[#AA9160] font-medium block mb-2">
            Explore Handcrafted Edits & Silhouettes
          </span>
          <div className="relative border-b-2 border-[#176B45] pb-2 flex items-center">
            <Search className="w-5 h-5 text-[#176B45] mr-3 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by attire, weave, fabric or colour (e.g. Chanderi, Rani Pink, Kurta, Silk)..."
              className="w-full bg-transparent text-lg sm:text-xl font-serif text-[#252A25] placeholder:text-[#74786F]/50 focus:outline-none"
            />
          </div>
        </div>

        {/* Suggested Queries */}
        {!query.trim() && (
          <div className="space-y-4">
            <div className="text-[11px] uppercase tracking-luxury text-[#74786F] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#AA9160]" />
              <span>Suggested Searches</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {["Kurta Sets", "Chanderi Saree", "Emerald Anarkali", "Mulmul Cotton", "Rani Pink", "Made to Order", "Bespoke"].map(
                (term) => (
                  <button
                    key={term}
                    onClick={() => setQuery(term)}
                    className="text-xs px-3.5 py-1.5 bg-[#EEEAE0]/70 hover:bg-[#176B45] hover:text-[#FAF9F5] text-[#252A25] transition-colors border border-[#E2DFD6]"
                  >
                    {term}
                  </button>
                )
              )}
            </div>

            <div className="pt-6 border-t border-[#E2DFD6] grid grid-cols-2 sm:grid-cols-4 gap-3">
              {CATEGORIES.map((cat) => (
                <Link
                  key={cat.id}
                  href={cat.href}
                  onClick={() => setSearchOpen(false)}
                  className="group block p-3 bg-[#EEEAE0]/40 border border-[#E2DFD6] hover:border-[#176B45] transition-colors text-center"
                >
                  <span className="text-[10px] uppercase tracking-luxury text-[#AA9160] block mb-1">
                    Explore
                  </span>
                  <span className="text-sm font-serif text-[#252A25] group-hover:text-[#176B45]">
                    {cat.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Search Results */}
        {query.trim() && (
          <div className="mt-4 max-h-[60vh] overflow-y-auto space-y-4 pr-1">
            <div className="text-xs uppercase tracking-luxury text-[#74786F] pb-2 border-b border-[#E2DFD6] flex justify-between items-center">
              <span>
                {filteredProducts.length} {filteredProducts.length === 1 ? "Result" : "Results"} for &ldquo;{query}&rdquo;
              </span>
              <button
                onClick={() => setQuery("")}
                className="text-[10px] uppercase tracking-luxury text-[#AA9160] hover:text-[#176B45]"
              >
                Clear
              </button>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="text-center py-12 px-4 bg-[#EEEAE0]/40 border border-[#E2DFD6]">
                <p className="font-serif text-lg text-[#252A25] mb-2">No matching pieces found</p>
                <p className="text-xs text-[#74786F] max-w-sm mx-auto mb-4">
                  We couldn&apos;t find any designs matching &ldquo;{query}&rdquo;. Try searching for &ldquo;Kurta&rdquo;, &ldquo;Saree&rdquo;, or contact our custom atelier.
                </p>
                <Link
                  href="/product/custom"
                  onClick={() => setSearchOpen(false)}
                  className="inline-block text-xs uppercase tracking-luxury bg-[#176B45] text-white px-5 py-2.5 hover:bg-[#315039] transition-colors"
                >
                  Explore Bespoke Customisation
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredProducts.map((product) => {
                  const productSlug = (product as { slug?: string; id: string }).slug || product.id;
                  return (
                    <Link
                      key={product.id}
                      href={`/product/${productSlug}`}
                      onClick={() => setSearchOpen(false)}
                      className="group flex gap-4 p-3 bg-[#EEEAE0]/40 border border-[#E2DFD6] hover:border-[#176B45] transition-colors"
                    >
                      <div className="relative w-20 h-24 flex-shrink-0 bg-[#FAF9F5] overflow-hidden">
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform"
                          sizes="80px"
                        />
                      </div>
                      <div className="flex flex-col justify-between py-1 flex-1">
                        <div>
                          <span className="text-[9px] uppercase tracking-luxury text-[#AA9160] block">
                            {product.category}
                          </span>
                          <h4 className="font-serif text-sm text-[#252A25] group-hover:text-[#176B45] line-clamp-1">
                            {product.name}
                          </h4>
                          <span className="text-xs font-medium text-[#176B45]">
                            {formatCurrencyINR(product.price)}
                          </span>
                        </div>
                        <span className="text-[10px] uppercase tracking-luxury text-[#74786F] flex items-center gap-1">
                          View Piece <ArrowRight className="w-2.5 h-2.5" />
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
