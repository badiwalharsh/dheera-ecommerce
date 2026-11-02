"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { AdminLayout } from "@/components/admin/admin-layout";
import { StatusBadge } from "@/components/admin/status-badge";
import { CatalogProduct } from "@/types/ecommerce";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      let url = "/api/admin/products";
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (selectedCategory !== "all") params.append("category", selectedCategory);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      }
    } catch {
      // Handle error
    } finally {
      setIsLoading(false);
    }
  }, [search, selectedCategory]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleDuplicate = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/products/${id}/duplicate`, { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionMessage(`Garment cloned: ${data.product.name}`);
        fetchProducts();
      }
    } catch {
      // Error
    }
  };

  const handleArchive = async (id: string, name: string) => {
    if (!confirm(`Are you sure you wish to archive "${name}" from the active storefront?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
      if (res.ok) {
        setActionMessage(`Garment "${name}" archived successfully.`);
        fetchProducts();
      }
    } catch {
      // Error
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E2DFD6] gap-4">
          <div>
            <span className="text-[10px] uppercase tracking-luxury text-[#AA9160] font-semibold block">
              CATALOGUE MANAGEMENT
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl text-[#176B45]">
              Garments & Collections
            </h1>
            <p className="text-xs text-[#74786F] mt-0.5">
              Manage product listings, pricing, variants, editorial imagery, and publication state.
            </p>
          </div>

          <Link
            href="/admin/products/new"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-sm bg-[#176B45] text-white text-xs uppercase tracking-luxury font-medium hover:bg-[#125837] transition-colors self-start sm:self-auto"
          >
            <span>+</span>
            <span>Create New Garment</span>
          </Link>
        </div>

        {actionMessage && (
          <div className="p-3 bg-[#EAF5EF] border border-[#176B45]/20 text-[#176B45] text-xs rounded-sm flex items-center justify-between">
            <span>{actionMessage}</span>
            <button onClick={() => setActionMessage(null)} className="text-xs text-[#176B45]">
              ✕
            </button>
          </div>
        )}

        {/* Filter Bar */}
        <div className="bg-[#FAF9F5] border border-[#E2DFD6] p-4 rounded-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
          <div className="flex-1 max-w-sm">
            <input
              type="text"
              placeholder="Search garments by name or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#E2DFD6] rounded-sm text-xs text-[#252A25] focus:outline-none focus:border-[#176B45]"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] uppercase tracking-luxury text-[#74786F]">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 bg-white border border-[#E2DFD6] rounded-sm text-xs text-[#252A25] focus:outline-none focus:border-[#176B45]"
            >
              <option value="all">All Categories</option>
              <option value="kurta-sets">Kurta Sets</option>
              <option value="sarees">Sarees</option>
              <option value="suits">Suits</option>
              <option value="dupattas">Dupattas</option>
            </select>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-[#FAF9F5] border border-[#E2DFD6] rounded-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#EEEAE0]/70 border-b border-[#E2DFD6] text-[10px] uppercase tracking-luxury text-[#74786F]">
                <tr>
                  <th className="py-3 px-4">Garment</th>
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4">Sizes</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2DFD6]/60">
                {products.length > 0 ? (
                  products.map((p) => (
                    <tr key={p.id} className="hover:bg-white/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 aspect-[3/4] relative bg-[#EEEAE0] shrink-0 border border-[#E2DFD6] overflow-hidden rounded-sm">
                            <Image
                              src={p.image || "/images/banners/hero-editorial.jpg"}
                              alt={p.name}
                              fill
                              className="object-cover"
                              sizes="48px"
                            />
                          </div>
                          <div>
                            <p className="font-medium text-[#176B45] text-xs">{p.name}</p>
                            <p className="text-[10px] text-[#74786F]">{p.fabric}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {p.isFeatured && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#AA9160]/20 text-[#AA9160] font-medium uppercase">
                                  Featured
                                </span>
                              )}
                              {p.isNewArrival && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#176B45]/15 text-[#176B45] font-medium uppercase">
                                  New
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-[#74786F]">
                        {p.sku}
                      </td>
                      <td className="py-3 px-4 text-[#252A25]">{p.category}</td>
                      <td className="py-3 px-4 font-medium text-[#252A25]">
                        <div>₹{p.price.toLocaleString("en-IN")}</div>
                        {p.originalPrice && (
                          <div className="text-[10px] text-[#74786F] line-through">
                            ₹{p.originalPrice.toLocaleString("en-IN")}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-[#74786F]">
                        <span className="text-[11px]">{p.sizes.join(", ")}</span>
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={p.inStock ? "published" : "archived"} size="sm" />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <Link
                            href={`/product/${p.slug}`}
                            target="_blank"
                            className="p-1 text-[#74786F] hover:text-[#176B45]"
                            title="Preview customer product page"
                          >
                            👁️
                          </Link>
                          <Link
                            href={`/admin/products/${p.id}/edit`}
                            className="px-2 py-1 bg-[#EEEAE0] hover:bg-[#176B45] hover:text-white rounded-sm text-[11px] text-[#315039] font-medium transition-colors"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => handleDuplicate(p.id)}
                            className="p-1 text-[#74786F] hover:text-[#AA9160]"
                            title="Duplicate product"
                          >
                            📋
                          </button>
                          <button
                            onClick={() => handleArchive(p.id, p.name)}
                            className="p-1 text-[#74786F] hover:text-rose-600"
                            title="Archive product"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[#74786F]">
                      {isLoading ? "Loading collection..." : "No garments found matching filters."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

