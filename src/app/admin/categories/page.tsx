"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { AdminLayout } from "@/components/admin/admin-layout";
import { CategoryInfo } from "@/types/ecommerce";

interface AdminCategoryRow extends CategoryInfo {
  productCount: number;
  isActive: boolean;
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<AdminCategoryRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<AdminCategoryRow | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
      }
    } catch {
      // Error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setName("");
    setSlug("");
    setDescription("");
    setImageUrl("/images/banners/hero-editorial.jpg");
    setShowModal(true);
  };

  const handleOpenEdit = (cat: AdminCategoryRow) => {
    setEditingCategory(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description || "");
    setImageUrl(cat.image || "/images/banners/hero-editorial.jpg");
    setShowModal(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    try {
      const url = editingCategory ? `/api/admin/categories/${editingCategory.id}` : "/api/admin/categories";
      const method = editingCategory ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug, description, image: imageUrl }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMessage({ type: "success", text: data.message || "Category saved." });
        setShowModal(false);
        fetchCategories();
      } else {
        setStatusMessage({ type: "error", text: data.error || "Failed to save category." });
      }
    } catch {
      setStatusMessage({ type: "error", text: "Network error saving category." });
    }
  };

  const handleDelete = async (cat: AdminCategoryRow) => {
    if (cat.productCount > 0) {
      alert(`Cannot delete category "${cat.name}". It contains ${cat.productCount} active garments.`);
      return;
    }

    if (!confirm(`Are you sure you want to delete category "${cat.name}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/categories/${cat.id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMessage({ type: "success", text: "Category safely deleted." });
        fetchCategories();
      } else {
        setStatusMessage({ type: "error", text: data.error || "Failed to delete category." });
      }
    } catch {
      setStatusMessage({ type: "error", text: "Network error deleting category." });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E2DFD6] gap-4">
          <div>
            <span className="text-[10px] uppercase tracking-luxury text-[#AA9160] font-semibold block">
              CATALOGUE ARCHITECTURE
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl text-[#176B45]">
              Collection Categories
            </h1>
            <p className="text-xs text-[#74786F] mt-0.5">
              Organize Indian designer apparel lines, cover imagery, and navigation paths.
            </p>
          </div>

          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-sm bg-[#176B45] text-white text-xs uppercase tracking-luxury font-medium hover:bg-[#125837] transition-colors self-start sm:self-auto"
          >
            <span>+</span>
            <span>Create New Category</span>
          </button>
        </div>

        {statusMessage && (
          <div
            className={`p-3 text-xs rounded-sm flex items-center justify-between ${
              statusMessage.type === "success"
                ? "bg-[#EAF5EF] border border-[#176B45]/20 text-[#176B45]"
                : "bg-[#FDF2F2] border border-[#991B1B]/20 text-[#991B1B]"
            }`}
          >
            <span>{statusMessage.text}</span>
            <button onClick={() => setStatusMessage(null)}>✕</button>
          </div>
        )}

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="bg-[#FAF9F5] border border-[#E2DFD6] rounded-sm overflow-hidden flex flex-col group hover:border-[#176B45]/50 transition-colors"
            >
              <div className="relative aspect-[4/3] bg-[#EEEAE0]">
                <Image
                  src={cat.image || "/images/banners/hero-editorial.jpg"}
                  alt={cat.name}
                  fill
                  className="object-cover"
                  sizes="300px"
                />
                <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-white/90 text-[#176B45] text-[10px] font-medium">
                  {cat.productCount} Garments
                </span>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <h3 className="font-serif text-lg text-[#176B45] font-normal">{cat.name}</h3>
                  <p className="font-mono text-[10px] text-[#AA9160] mt-0.5">/{cat.slug}</p>
                  <p className="text-xs text-[#74786F] mt-1.5 line-clamp-2">{cat.description}</p>
                </div>

                <div className="pt-3 border-t border-[#E2DFD6] flex items-center justify-between text-xs">
                  <Link
                    href={`/collections/${cat.slug}`}
                    target="_blank"
                    className="text-[#315039] hover:text-[#176B45] text-[11px]"
                  >
                    View Storefront ↗
                  </Link>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEdit(cat)}
                      className="px-2.5 py-1 bg-[#EEEAE0] hover:bg-[#176B45] hover:text-white rounded-sm text-[11px] text-[#315039] font-medium transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(cat)}
                      disabled={cat.productCount > 0}
                      className="p-1 text-[#74786F] hover:text-rose-600 disabled:opacity-30 disabled:cursor-not-allowed"
                      title={
                        cat.productCount > 0
                          ? "Cannot delete category containing active garments"
                          : "Delete category"
                      }
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Modal for Create/Edit Category */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-[#FAF9F5] border border-[#E2DFD6] rounded-sm max-w-md w-full p-6 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-[#E2DFD6] mb-4">
                <h3 className="font-serif text-lg text-[#176B45]">
                  {editingCategory ? "Edit Category" : "Create New Category"}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-[#74786F] hover:text-[#252A25]"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveCategory} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[11px] uppercase tracking-luxury text-[#315039] font-medium mb-1">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => {
                      const n = e.target.value;
                      setName(n);
                      if (!editingCategory) {
                        setSlug(
                          n
                            .toLowerCase()
                            .replace(/[^a-z0-9]+/g, "-")
                            .replace(/(^-|-$)/g, "")
                        );
                      }
                    }}
                    placeholder="e.g. Anarkali Suits"
                    className="w-full px-3 py-2 bg-white border border-[#E2DFD6] rounded-sm text-[#252A25] focus:outline-none focus:border-[#176B45]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-luxury text-[#315039] font-medium mb-1">
                    Category Slug *
                  </label>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="anarkali-suits"
                    className="w-full px-3 py-2 bg-white border border-[#E2DFD6] rounded-sm text-[#252A25] font-mono focus:outline-none focus:border-[#176B45]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-luxury text-[#315039] font-medium mb-1">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Editorial overview of this collection category..."
                    className="w-full px-3 py-2 bg-white border border-[#E2DFD6] rounded-sm text-[#252A25] focus:outline-none focus:border-[#176B45]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-luxury text-[#315039] font-medium mb-1">
                    Cover Photograph URL
                  </label>
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="/images/products/product-1.jpg"
                    className="w-full px-3 py-2 bg-white border border-[#E2DFD6] rounded-sm text-[#252A25] focus:outline-none focus:border-[#176B45]"
                  />
                </div>

                <div className="pt-4 border-t border-[#E2DFD6] flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-[#E2DFD6] text-[#74786F] rounded-sm hover:bg-[#EEEAE0]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#176B45] text-white rounded-sm hover:bg-[#125837] uppercase tracking-luxury font-medium"
                  >
                    Save Category →
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

