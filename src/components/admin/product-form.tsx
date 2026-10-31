"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ProductFormData } from "@/types/admin";
import { CatalogProduct } from "@/types/ecommerce";

interface ProductFormProps {
  initialData?: CatalogProduct;
  isEditing?: boolean;
}

export function ProductForm({ initialData, isEditing = false }: ProductFormProps) {
  const router = useRouter();

  const [formData, setFormData] = useState<ProductFormData>({
    name: initialData?.name || "",
    slug: initialData?.slug || "",
    sku: initialData?.sku || "",
    category: initialData?.category || "Kurta Sets",
    categorySlug: initialData?.categorySlug || "kurta-sets",
    shortDescription: initialData?.shortDescription || "",
    description: initialData?.description || "",
    price: initialData?.price || 12000,
    originalPrice: initialData?.originalPrice || undefined,
    fabric: initialData?.fabric || "Handloom Chanderi Silk",
    colour: initialData?.colors?.[0] || "Natural Cream",
    colors: initialData?.colors || ["Natural Cream"],
    sizes: initialData?.sizes || ["XS", "S", "M", "L", "XL"],
    care: initialData?.care || "Dry clean only. Store wrapped in muslin cloth.",
    details: initialData?.details || [
      "Handcrafted with artisanal zari embroidery",
      "Features delicate scalloped edges along sleeves and hemline",
      "Includes matching silk inner slip for breathable comfort",
    ],
    tag: initialData?.tag || "",
    isReadyToShip: initialData?.isReadyToShip !== false,
    isMadeToOrder: !!initialData?.isMadeToOrder,
    isCustomizable: !!initialData?.isCustomizable,
    isFeatured: !!initialData?.isFeatured,
    isNewArrival: initialData?.isNewArrival !== false,
    inStock: initialData?.inStock !== false,
    image: initialData?.image || "/images/products/product-1.jpg",
    gallery: initialData?.gallery || ["/images/products/product-1.jpg"],
  });

  const [newDetail, setNewDetail] = useState("");
  const [newColor, setNewColor] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const availableCategories = [
    { name: "Kurta Sets", slug: "kurta-sets" },
    { name: "Sarees", slug: "sarees" },
    { name: "Suits", slug: "suits" },
    { name: "Dupattas", slug: "dupattas" },
  ];

  const standardSizes = ["XS", "S", "M", "L", "XL", "XXL", "Free Size"];

  const handleCategoryChange = (slug: string) => {
    const matched = availableCategories.find((c) => c.slug === slug);
    setFormData((prev) => ({
      ...prev,
      categorySlug: slug,
      category: matched?.name || "Curated",
    }));
  };

  const handleSizeToggle = (size: string) => {
    setFormData((prev) => {
      const exists = prev.sizes.includes(size);
      const updated = exists ? prev.sizes.filter((s) => s !== size) : [...prev.sizes, size];
      return { ...prev, sizes: updated.length > 0 ? updated : [size] };
    });
  };

  const handleAddColor = () => {
    if (newColor.trim() && !formData.colors.includes(newColor.trim())) {
      setFormData((prev) => ({
        ...prev,
        colors: [...prev.colors, newColor.trim()],
        colour: prev.colour || newColor.trim(),
      }));
      setNewColor("");
    }
  };

  const handleRemoveColor = (col: string) => {
    setFormData((prev) => ({
      ...prev,
      colors: prev.colors.filter((c) => c !== col),
    }));
  };

  const handleAddDetail = () => {
    if (newDetail.trim()) {
      setFormData((prev) => ({
        ...prev,
        details: [...prev.details, newDetail.trim()],
      }));
      setNewDetail("");
    }
  };

  const handleRemoveDetail = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      details: prev.details.filter((_, i) => i !== index),
    }));
  };

  // Image upload handling with type and size validation
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setUploadError(null);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);
      uploadFormData.append("folder", "products");

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: uploadFormData,
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setFormData((prev) => ({
          ...prev,
          image: prev.image || data.url,
          gallery: [...prev.gallery, data.url],
        }));
      } else {
        setUploadError(data.error || "Failed to upload image.");
      }
    } catch {
      setUploadError("Image upload network error. Please try again.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = (urlToRemove: string) => {
    setFormData((prev) => {
      const updatedGallery = prev.gallery.filter((u) => u !== urlToRemove);
      const newPrimary = prev.image === urlToRemove ? updatedGallery[0] || "" : prev.image;
      return { ...prev, gallery: updatedGallery, image: newPrimary };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      const url = isEditing && initialData ? `/api/admin/products/${initialData.id}` : "/api/admin/products";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMessage(data.message || "Garment saved successfully!");
        setTimeout(() => {
          router.push("/admin/products");
        }, 1000);
      } else {
        setStatusMessage(data.error || "Failed to save product.");
      }
    } catch {
      setStatusMessage("Network error saving product.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {statusMessage && (
        <div className="p-4 bg-[#EAF5EF] border border-[#176B45]/20 text-[#176B45] text-xs rounded-sm">
          {statusMessage}
        </div>
      )}

      {/* Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Core Fields */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Basic Info */}
          <div className="bg-[#FAF9F5] border border-[#E2DFD6] p-6 rounded-sm space-y-4">
            <h3 className="font-serif text-base text-[#176B45] border-b border-[#E2DFD6] pb-2">
              Basic Garment Information
            </h3>

            <div>
              <label className="block text-[11px] uppercase tracking-luxury text-[#315039] font-medium mb-1">
                Garment Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => {
                  const name = e.target.value;
                  const autoSlug = name
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/(^-|-$)/g, "");
                  setFormData((prev) => ({
                    ...prev,
                    name,
                    slug: isEditing ? prev.slug : autoSlug,
                  }));
                }}
                placeholder="e.g. Gulab Embroidered Kurta Set"
                className="w-full px-3 py-2 bg-white border border-[#E2DFD6] rounded-sm text-xs text-[#252A25] focus:outline-none focus:border-[#176B45]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] uppercase tracking-luxury text-[#315039] font-medium mb-1">
                  SKU (Stock Keeping Unit) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                  placeholder="DHR-KRT-001"
                  className="w-full px-3 py-2 bg-white border border-[#E2DFD6] rounded-sm text-xs text-[#252A25] font-mono focus:outline-none focus:border-[#176B45]"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-luxury text-[#315039] font-medium mb-1">
                  URL Slug *
                </label>
                <input
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="gulab-embroidered-kurta-set"
                  className="w-full px-3 py-2 bg-white border border-[#E2DFD6] rounded-sm text-xs text-[#252A25] font-mono focus:outline-none focus:border-[#176B45]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-luxury text-[#315039] font-medium mb-1">
                Category *
              </label>
              <select
                value={formData.categorySlug}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#E2DFD6] rounded-sm text-xs text-[#252A25] focus:outline-none focus:border-[#176B45]"
              >
                {availableCategories.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-luxury text-[#315039] font-medium mb-1">
                Short Description
              </label>
              <input
                type="text"
                value={formData.shortDescription}
                onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                placeholder="Intricately embroidered Chanderi silk with matching dupatta."
                className="w-full px-3 py-2 bg-white border border-[#E2DFD6] rounded-sm text-xs text-[#252A25] focus:outline-none focus:border-[#176B45]"
              />
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-luxury text-[#315039] font-medium mb-1">
                Full Editorial Description *
              </label>
              <textarea
                rows={4}
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Crafted from pure handloom Chanderi silk..."
                className="w-full px-3 py-2 bg-white border border-[#E2DFD6] rounded-sm text-xs text-[#252A25] focus:outline-none focus:border-[#176B45]"
              />
            </div>
          </div>

          {/* 2. Pricing & Attributes */}
          <div className="bg-[#FAF9F5] border border-[#E2DFD6] p-6 rounded-sm space-y-4">
            <h3 className="font-serif text-base text-[#176B45] border-b border-[#E2DFD6] pb-2">
              Pricing & Textile Specifications
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] uppercase tracking-luxury text-[#315039] font-medium mb-1">
                  Selling Price (INR) *
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-white border border-[#E2DFD6] rounded-sm text-xs text-[#252A25] focus:outline-none focus:border-[#176B45]"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-luxury text-[#315039] font-medium mb-1">
                  Compare At / Original Price (INR)
                </label>
                <input
                  type="number"
                  min={1}
                  value={formData.originalPrice || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      originalPrice: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  placeholder="Optional crossed-out price"
                  className="w-full px-3 py-2 bg-white border border-[#E2DFD6] rounded-sm text-xs text-[#252A25] focus:outline-none focus:border-[#176B45]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] uppercase tracking-luxury text-[#315039] font-medium mb-1">
                  Fabric Composition *
                </label>
                <input
                  type="text"
                  required
                  value={formData.fabric}
                  onChange={(e) => setFormData({ ...formData, fabric: e.target.value })}
                  placeholder="Pure Handloom Chanderi & Mulmul"
                  className="w-full px-3 py-2 bg-white border border-[#E2DFD6] rounded-sm text-xs text-[#252A25] focus:outline-none focus:border-[#176B45]"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-luxury text-[#315039] font-medium mb-1">
                  Care Instructions *
                </label>
                <input
                  type="text"
                  required
                  value={formData.care}
                  onChange={(e) => setFormData({ ...formData, care: e.target.value })}
                  placeholder="Dry Clean Only"
                  className="w-full px-3 py-2 bg-white border border-[#E2DFD6] rounded-sm text-xs text-[#252A25] focus:outline-none focus:border-[#176B45]"
                />
              </div>
            </div>

            {/* Sizes Multi-Select */}
            <div>
              <label className="block text-[11px] uppercase tracking-luxury text-[#315039] font-medium mb-2">
                Available Sizes
              </label>
              <div className="flex flex-wrap gap-2">
                {standardSizes.map((s) => {
                  const selected = formData.sizes.includes(s);
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleSizeToggle(s)}
                      className={`px-3 py-1.5 rounded-sm text-xs font-medium border transition-colors ${
                        selected
                          ? "bg-[#176B45] text-white border-[#176B45]"
                          : "bg-white text-[#74786F] border-[#E2DFD6] hover:border-[#176B45]"
                      }`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Colors */}
            <div>
              <label className="block text-[11px] uppercase tracking-luxury text-[#315039] font-medium mb-1">
                Colors
              </label>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {formData.colors.map((c) => (
                  <span
                    key={c}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-[#E2DFD6] rounded-sm text-xs text-[#315039]"
                  >
                    <span>{c}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveColor(c)}
                      className="text-[#74786F] hover:text-rose-600"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  placeholder="Add color variant (e.g. Rani Pink)"
                  className="flex-1 px-3 py-1.5 bg-white border border-[#E2DFD6] rounded-sm text-xs text-[#252A25]"
                />
                <button
                  type="button"
                  onClick={handleAddColor}
                  className="px-3 py-1.5 bg-[#EEEAE0] text-[#176B45] text-xs font-medium rounded-sm hover:bg-[#176B45] hover:text-white transition-colors"
                >
                  + Add
                </button>
              </div>
            </div>

            {/* Bullet Details */}
            <div>
              <label className="block text-[11px] uppercase tracking-luxury text-[#315039] font-medium mb-1">
                Key Product Highlights (Bullet Points)
              </label>
              <ul className="space-y-1.5 mb-2">
                {formData.details.map((d, idx) => (
                  <li
                    key={idx}
                    className="flex items-center justify-between p-2 bg-white border border-[#E2DFD6] rounded-sm text-xs text-[#252A25]"
                  >
                    <span>✦ {d}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveDetail(idx)}
                      className="text-rose-600 hover:underline text-[10px]"
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newDetail}
                  onChange={(e) => setNewDetail(e.target.value)}
                  placeholder="Add detail (e.g. Scalloped organza dupatta border)"
                  className="flex-1 px-3 py-1.5 bg-white border border-[#E2DFD6] rounded-sm text-xs text-[#252A25]"
                />
                <button
                  type="button"
                  onClick={handleAddDetail}
                  className="px-3 py-1.5 bg-[#EEEAE0] text-[#176B45] text-xs font-medium rounded-sm hover:bg-[#176B45] hover:text-white transition-colors"
                >
                  + Add
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Imagery & Flags */}
        <div className="space-y-6">
          {/* 3. Product Imagery */}
          <div className="bg-[#FAF9F5] border border-[#E2DFD6] p-6 rounded-sm space-y-4">
            <h3 className="font-serif text-base text-[#176B45] border-b border-[#E2DFD6] pb-2">
              Photographs & Gallery
            </h3>

            {/* Gallery Previews */}
            <div className="grid grid-cols-2 gap-2">
              {formData.gallery.map((img, i) => (
                <div
                  key={i}
                  className={`relative aspect-[3/4] bg-[#EEEAE0] rounded-sm overflow-hidden border ${
                    formData.image === img ? "border-2 border-[#176B45]" : "border-[#E2DFD6]"
                  }`}
                >
                  <Image src={img} alt={`Preview ${i}`} fill className="object-cover" sizes="120px" />
                  <div className="absolute top-1 right-1 flex gap-1">
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(img)}
                      className="p-1 bg-black/60 text-white rounded-full text-[10px] hover:bg-rose-600"
                      title="Delete photo"
                    >
                      ✕
                    </button>
                  </div>
                  {formData.image === img && (
                    <span className="absolute bottom-1 left-1 bg-[#176B45] text-white text-[9px] px-1.5 py-0.5 rounded-sm font-medium uppercase">
                      Primary
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Upload Button */}
            <div>
              <label className="block text-[11px] uppercase tracking-luxury text-[#315039] font-medium mb-1">
                Upload Photograph (JPG, PNG, WebP)
              </label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/jpg"
                onChange={handleFileUpload}
                disabled={uploadingImage}
                className="w-full text-xs text-[#74786F] file:mr-2 file:py-1.5 file:px-3 file:rounded-sm file:border-0 file:text-xs file:bg-[#176B45] file:text-white hover:file:bg-[#125837]"
              />
              {uploadingImage && (
                <p className="text-[11px] text-[#AA9160] mt-1">Uploading and validating photograph...</p>
              )}
              {uploadError && (
                <p className="text-[11px] text-rose-600 mt-1">{uploadError}</p>
              )}
            </div>
          </div>

          {/* 4. Publication & Fulfillment Flags */}
          <div className="bg-[#FAF9F5] border border-[#E2DFD6] p-6 rounded-sm space-y-3">
            <h3 className="font-serif text-base text-[#176B45] border-b border-[#E2DFD6] pb-2">
              Fulfilment & Storefront Placement
            </h3>

            <label className="flex items-center gap-2.5 text-xs text-[#252A25] cursor-pointer">
              <input
                type="checkbox"
                checked={formData.inStock}
                onChange={(e) => setFormData({ ...formData, inStock: e.target.checked })}
                className="w-4 h-4 text-[#176B45] rounded"
              />
              <span>Published on Storefront (Active)</span>
            </label>

            <label className="flex items-center gap-2.5 text-xs text-[#252A25] cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isFeatured}
                onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                className="w-4 h-4 text-[#176B45] rounded"
              />
              <span>Featured Collection (&apos;Our Favourites&apos;)</span>
            </label>

            <label className="flex items-center gap-2.5 text-xs text-[#252A25] cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isNewArrival}
                onChange={(e) => setFormData({ ...formData, isNewArrival: e.target.checked })}
                className="w-4 h-4 text-[#176B45] rounded"
              />
              <span>Mark as New Arrival</span>
            </label>

            <label className="flex items-center gap-2.5 text-xs text-[#252A25] cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isReadyToShip}
                onChange={(e) => setFormData({ ...formData, isReadyToShip: e.target.checked })}
                className="w-4 h-4 text-[#176B45] rounded"
              />
              <span>Ready to Ship (Express Pan-India Delivery)</span>
            </label>

            <label className="flex items-center gap-2.5 text-xs text-[#252A25] cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isCustomizable}
                onChange={(e) => setFormData({ ...formData, isCustomizable: e.target.checked })}
                className="w-4 h-4 text-[#176B45] rounded"
              />
              <span>Custom Tailoring / Atelier Available</span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 bg-[#176B45] text-white text-xs uppercase tracking-luxury font-medium hover:bg-[#125837] transition-colors rounded-sm disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : isEditing ? "Update Garment →" : "Publish Garment →"}
            </button>
            <Link
              href="/admin/products"
              className="px-4 py-3 bg-[#FAF9F5] border border-[#E2DFD6] text-[#74786F] hover:text-[#176B45] text-xs uppercase tracking-luxury rounded-sm"
            >
              Cancel
            </Link>
          </div>
        </div>
      </div>
    </form>
  );
}

