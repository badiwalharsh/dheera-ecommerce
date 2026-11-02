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
    price: initialData?.price || 4999,
    originalPrice: initialData?.originalPrice || undefined,
    mrp: initialData?.mrp || initialData?.originalPrice || undefined,
    taxRatePercent: initialData?.taxRatePercent !== undefined ? initialData.taxRatePercent : 12.0,
    stock: initialData?.stock !== undefined ? initialData.stock : 5,
    status: initialData?.status || "draft",
    availabilityStatus: initialData?.availabilityStatus || "in_stock",
    fabric: initialData?.fabric || "",
    care: initialData?.care || "Dry clean only. Store wrapped in muslin cloth.",
    craftsmanship: initialData?.craftsmanship || "",
    fitInfo: initialData?.fitInfo || "",
    sizeGuide: initialData?.sizeGuide || "",
    garmentType: initialData?.garmentType || "Kurta Set",
    colour: initialData?.colors?.[0] || "Natural Cream",
    colors: initialData?.colors || ["Natural Cream"],
    sizes: initialData?.sizes || ["XS", "S", "M", "L", "XL"],
    details: initialData?.details || [
      "Handcrafted with artisanal heritage precision",
      "Finished with hand-stitched borders and premium lining",
    ],
    tag: initialData?.tag || "",
    isReadyToShip: initialData?.isReadyToShip !== false,
    isMadeToOrder: !!initialData?.isMadeToOrder,
    isCustomizable: !!initialData?.isCustomizable,
    isFeatured: !!initialData?.isFeatured,
    isNewArrival: initialData?.isNewArrival !== false,
    inStock: initialData?.inStock !== false,
    isPrototype: !!initialData?.isPrototype,
    image: initialData?.image || "",
    gallery: initialData?.gallery || [],
  });

  const [imageAltTexts, setImageAltTexts] = useState<Record<string, string>>({});
  const [photoAngles, setPhotoAngles] = useState<Record<string, string>>({});
  const standardAngles = [
    "Front View",
    "Back View",
    "Detail & Embroidery",
    "Border Work",
    "Fabric Texture",
    "Styling & Draping",
  ];
  const [newDetail, setNewDetail] = useState("");
  const [newColor, setNewColor] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const availableCategories = [
    { name: "Kurta Sets", slug: "kurta-sets" },
    { name: "Sarees", slug: "sarees" },
    { name: "Suits", slug: "suits" },
    { name: "Dupattas", slug: "dupattas" },
  ];

  const standardSizes = ["XS", "S", "M", "L", "XL", "XXL", "3XL", "Free Size"];

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

  // Image Upload Handling
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
        setFormData((prev) => {
          const newGallery = prev.gallery.includes(data.url) ? prev.gallery : [...prev.gallery, data.url];
          return {
            ...prev,
            image: prev.image || data.url,
            gallery: newGallery,
          };
        });
      } else {
        setUploadError(data.error || "Failed to upload image.");
      }
    } catch {
      setUploadError("Image upload network error. Please try again.");
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  };

  const handleSetPrimaryImage = (url: string) => {
    setFormData((prev) => ({
      ...prev,
      image: url,
    }));
  };

  const handleMoveImage = (index: number, direction: "left" | "right") => {
    setFormData((prev) => {
      const newGallery = [...prev.gallery];
      const targetIndex = direction === "left" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= newGallery.length) return prev;
      const temp = newGallery[index];
      newGallery[index] = newGallery[targetIndex];
      newGallery[targetIndex] = temp;
      return { ...prev, gallery: newGallery };
    });
  };

  const handleRemoveImage = (urlToRemove: string) => {
    if (!confirm("Are you sure you want to remove this photograph from the gallery?")) {
      return;
    }
    setFormData((prev) => {
      const updatedGallery = prev.gallery.filter((u) => u !== urlToRemove);
      const newPrimary = prev.image === urlToRemove ? updatedGallery[0] || "" : prev.image;
      return { ...prev, gallery: updatedGallery, image: newPrimary };
    });
  };

  // Pre-flight Publication Validation Check
  const publicationChecks = [
    { label: "Garment Name", valid: !!formData.name.trim() },
    { label: "Unique SKU", valid: !!formData.sku.trim() },
    { label: "Category Selected", valid: !!formData.category.trim() },
    { label: "Selling Price (> 0)", valid: Number(formData.price) > 0 },
    { label: "Editorial Description", valid: !!formData.description.trim() },
    { label: "Main Cover Photograph", valid: !!formData.image.trim() },
    { label: "Valid Availability Status", valid: !!formData.availabilityStatus },
  ];
  const canPublish = publicationChecks.every((c) => c.valid);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.status === "published" && !canPublish) {
      const missing = publicationChecks.filter((c) => !c.valid).map((c) => c.label);
      setStatusMessage({
        text: `Cannot publish incomplete garment. Please complete required fields: ${missing.join(", ")}. Or save as Draft to continue later.`,
        type: "error",
      });
      return;
    }

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
        setStatusMessage({
          text: data.message || "Garment saved successfully!",
          type: "success",
        });
        setTimeout(() => {
          router.push("/admin/products");
        }, 1200);
      } else {
        setStatusMessage({
          text: data.error || "Failed to save product.",
          type: "error",
        });
      }
    } catch {
      setStatusMessage({
        text: "Network error saving product.",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {statusMessage && (
        <div
          className={`p-4 text-xs rounded-sm border ${
            statusMessage.type === "success"
              ? "bg-[#EAF5EF] border-[#176B45]/20 text-[#176B45]"
              : "bg-rose-50 border-rose-200 text-rose-700"
          }`}
        >
          {statusMessage.text}
        </div>
      )}

      {/* Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Core Fields */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Basic Information */}
          <div className="bg-[#FAF9F5] border border-[#E2DFD6] p-6 rounded-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2DFD6] pb-2">
              <h3 className="font-serif text-base text-[#176B45]">
                1. Basic Garment Information
              </h3>
              <span className="text-[10px] uppercase tracking-luxury text-[#AA9160] font-semibold">
                * Required for Publication
              </span>
            </div>

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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] uppercase tracking-luxury text-[#315039] font-medium mb-1">
                  SKU (Stock Keeping Unit) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                  placeholder="DHR-KRT-101"
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
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-luxury text-[#315039] font-medium mb-1">
                Short Description (Summary)
              </label>
              <input
                type="text"
                value={formData.shortDescription}
                onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                placeholder="Handcrafted pure silk kurta set with delicate antique zardozi embroidery."
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
                placeholder="Intricately crafted by master Indian artisans with meticulous attention to detail..."
                className="w-full px-3 py-2 bg-white border border-[#E2DFD6] rounded-sm text-xs text-[#252A25] focus:outline-none focus:border-[#176B45]"
              />
            </div>
          </div>

          {/* 2. Commercial & Pricing Information */}
          <div className="bg-[#FAF9F5] border border-[#E2DFD6] p-6 rounded-sm space-y-4">
            <h3 className="font-serif text-base text-[#176B45] border-b border-[#E2DFD6] pb-2">
              2. Commercial Pricing, Tax & Inventory
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-[11px] uppercase tracking-luxury text-[#315039] font-medium mb-1">
                  Selling Price (₹) *
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
                  Compare At / MRP (₹)
                </label>
                <input
                  type="number"
                  min={1}
                  value={formData.originalPrice || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      originalPrice: e.target.value ? Number(e.target.value) : undefined,
                      mrp: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  placeholder="Optional crossed-out price"
                  className="w-full px-3 py-2 bg-white border border-[#E2DFD6] rounded-sm text-xs text-[#252A25] focus:outline-none focus:border-[#176B45]"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-luxury text-[#315039] font-medium mb-1">
                  GST Tax Rate (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={formData.taxRatePercent !== undefined ? formData.taxRatePercent : 12.0}
                  onChange={(e) => setFormData({ ...formData, taxRatePercent: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-white border border-[#E2DFD6] rounded-sm text-xs text-[#252A25] focus:outline-none focus:border-[#176B45]"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-luxury text-[#315039] font-medium mb-1">
                  Available Stock
                </label>
                <input
                  type="number"
                  min={0}
                  value={formData.stock !== undefined ? formData.stock : 5}
                  onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-white border border-[#E2DFD6] rounded-sm text-xs text-[#252A25] focus:outline-none focus:border-[#176B45]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] uppercase tracking-luxury text-[#315039] font-medium mb-1">
                  Availability Status
                </label>
                <select
                  value={formData.availabilityStatus || "in_stock"}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      availabilityStatus: e.target.value as any,
                      isMadeToOrder: e.target.value === "made_to_order",
                      isReadyToShip: e.target.value === "in_stock",
                    })
                  }
                  className="w-full px-3 py-2 bg-white border border-[#E2DFD6] rounded-sm text-xs text-[#252A25] focus:outline-none focus:border-[#176B45]"
                >
                  <option value="in_stock">In Stock (Ready to Ship)</option>
                  <option value="made_to_order">Made to Order (Bespoke Tailoring)</option>
                  <option value="pre_order">Pre-Order (Upcoming Artisanal Batch)</option>
                  <option value="out_of_stock">Out of Stock</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-luxury text-[#315039] font-medium mb-1">
                  Garment Type
                </label>
                <input
                  type="text"
                  value={formData.garmentType || ""}
                  onChange={(e) => setFormData({ ...formData, garmentType: e.target.value })}
                  placeholder="e.g. Kurta Set, Anarkali, Saree, Leheriya Dupatta"
                  className="w-full px-3 py-2 bg-white border border-[#E2DFD6] rounded-sm text-xs text-[#252A25] focus:outline-none focus:border-[#176B45]"
                />
              </div>
            </div>
          </div>

          {/* 3. Textile Attributes & Verification */}
          <div className="bg-[#FAF9F5] border border-[#E2DFD6] p-6 rounded-sm space-y-4">
            <h3 className="font-serif text-base text-[#176B45] border-b border-[#E2DFD6] pb-2">
              3. Textile Attributes & Verified Provenance
            </h3>
            <p className="text-[11px] text-[#74786F]">
              Notice: Provide actual fabric composition and craft origin only when verified by the artisan or supplier. Do not invent details.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] uppercase tracking-luxury text-[#315039] font-medium mb-1">
                  Fabric Composition (Verified)
                </label>
                <input
                  type="text"
                  value={formData.fabric}
                  onChange={(e) => setFormData({ ...formData, fabric: e.target.value })}
                  placeholder="e.g. 100% Handloom Chanderi Silk"
                  className="w-full px-3 py-2 bg-white border border-[#E2DFD6] rounded-sm text-xs text-[#252A25] focus:outline-none focus:border-[#176B45]"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-luxury text-[#315039] font-medium mb-1">
                  Care Instructions
                </label>
                <input
                  type="text"
                  value={formData.care}
                  onChange={(e) => setFormData({ ...formData, care: e.target.value })}
                  placeholder="e.g. Dry Clean Only. Store wrapped in cotton muslin."
                  className="w-full px-3 py-2 bg-white border border-[#E2DFD6] rounded-sm text-xs text-[#252A25] focus:outline-none focus:border-[#176B45]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] uppercase tracking-luxury text-[#315039] font-medium mb-1">
                  Artisan Origin / Craftsmanship (Verified)
                </label>
                <input
                  type="text"
                  value={formData.craftsmanship || ""}
                  onChange={(e) => setFormData({ ...formData, craftsmanship: e.target.value })}
                  placeholder="e.g. Handcrafted in Chanderi, Madhya Pradesh"
                  className="w-full px-3 py-2 bg-white border border-[#E2DFD6] rounded-sm text-xs text-[#252A25] focus:outline-none focus:border-[#176B45]"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-luxury text-[#315039] font-medium mb-1">
                  Fit & Cut Information
                </label>
                <input
                  type="text"
                  value={formData.fitInfo || ""}
                  onChange={(e) => setFormData({ ...formData, fitInfo: e.target.value })}
                  placeholder="e.g. Straight relaxed silhouette with side slits"
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

            {/* Highlights */}
            <div>
              <label className="block text-[11px] uppercase tracking-luxury text-[#315039] font-medium mb-1">
                Key Product Highlights
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
                  placeholder="Add highlight (e.g. Hand-finished scalloped border)"
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

        {/* Right Column: Photography, Status & Actions */}
        <div className="space-y-6">
          {/* Publication Lifecycle Status Card */}
          <div className="bg-[#FAF9F5] border border-[#E2DFD6] p-6 rounded-sm space-y-4">
            <h3 className="font-serif text-base text-[#176B45] border-b border-[#E2DFD6] pb-2">
              Publication Status
            </h3>

            <div>
              <label className="block text-[11px] uppercase tracking-luxury text-[#315039] font-medium mb-1">
                Garment State
              </label>
              <select
                value={formData.status || "draft"}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3 py-2 bg-white border border-[#E2DFD6] rounded-sm text-xs text-[#252A25] font-medium focus:outline-none focus:border-[#176B45]"
              >
                <option value="draft">Draft (Private, not visible on storefront)</option>
                <option value="published">Published (Live on public storefront)</option>
                <option value="archived">Archived (Deactivated from storefront)</option>
              </select>
            </div>

            {/* Publication Pre-Flight Checklist */}
            <div className="p-3 bg-white border border-[#E2DFD6] rounded-sm space-y-2">
              <span className="text-[10px] uppercase tracking-luxury text-[#74786F] font-semibold block">
                Publication Readiness Checklist:
              </span>
              <ul className="space-y-1 text-[11px]">
                {publicationChecks.map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className={item.valid ? "text-[#176B45] font-bold" : "text-amber-600 font-bold"}>
                      {item.valid ? "✔" : "○"}
                    </span>
                    <span className={item.valid ? "text-[#252A25]" : "text-[#74786F]"}>
                      {item.label}
                    </span>
                  </li>
                ))}
              </ul>
              {!canPublish && formData.status === "published" && (
                <p className="text-[10px] text-amber-700 bg-amber-50 p-2 rounded-sm border border-amber-200">
                  Note: Incomplete items will be saved as Draft until required fields are completed.
                </p>
              )}
            </div>

            <div className="pt-2 border-t border-[#E2DFD6] space-y-2.5">
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
                  checked={formData.isCustomizable}
                  onChange={(e) => setFormData({ ...formData, isCustomizable: e.target.checked })}
                  className="w-4 h-4 text-[#176B45] rounded"
                />
                <span>Atelier Custom Tailoring Available</span>
              </label>
            </div>
          </div>

          {/* Product Photography Management Card */}
          <div className="bg-[#FAF9F5] border border-[#E2DFD6] p-6 rounded-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2DFD6] pb-2">
              <h3 className="font-serif text-base text-[#176B45]">
                Photography & Gallery
              </h3>
              <button
                type="button"
                onClick={() => setShowPreviewModal(true)}
                className="text-[10px] text-[#176B45] underline font-medium"
              >
                3:4 Preview
              </button>
            </div>

            <p className="text-[10px] text-[#74786F]">
              Recommended: 2400 × 3200 px (3:4 portrait). Min 2000 × 2500 px. Max 10 MB per file.
            </p>

            {/* Gallery Previews with Reordering and Cover Selection */}
            {formData.gallery.length === 0 ? (
              <div className="p-6 bg-white border border-dashed border-[#E2DFD6] rounded-sm text-center text-xs text-[#74786F]">
                No photographs uploaded yet. Upload at least 1 image to publish.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {formData.gallery.map((img, i) => {
                  const isPrimary = formData.image === img;
                  const currentAngle = photoAngles[img] || standardAngles[i] || `Angle #${i + 1}`;
                  return (
                    <div key={i} className="flex flex-col gap-1">
                      <div
                        className={`relative aspect-[3/4] bg-[#EEEAE0] rounded-sm overflow-hidden border ${
                          isPrimary ? "border-2 border-[#176B45] shadow-sm" : "border-[#E2DFD6]"
                        }`}
                      >
                        <Image src={img} alt={`Preview ${i}`} fill className="object-cover" sizes="150px" />

                        {/* Angle tag */}
                        <div className="absolute top-1 left-1">
                          <span className="text-[8px] bg-black/70 text-[#E2DFD6] font-medium px-1.5 py-0.5 rounded-sm uppercase tracking-wider backdrop-blur-xs">
                            {currentAngle}
                          </span>
                        </div>
                        
                        {/* Action overlay */}
                        <div className="absolute top-1 right-1 flex gap-1 bg-black/60 p-1 rounded-sm">
                          <button
                            type="button"
                            onClick={() => handleMoveImage(i, "left")}
                            disabled={i === 0}
                            className="text-white hover:text-amber-300 disabled:opacity-30 text-[10px]"
                            title="Move earlier"
                          >
                            ◀
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveImage(i, "right")}
                            disabled={i === formData.gallery.length - 1}
                            className="text-white hover:text-amber-300 disabled:opacity-30 text-[10px]"
                            title="Move later"
                          >
                            ▶
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(img)}
                            className="text-white hover:text-rose-400 text-[10px] ml-1"
                            title="Delete photograph"
                          >
                            ✕
                          </button>
                        </div>

                        <div className="absolute bottom-1 left-1 right-1 flex items-center justify-between">
                          {isPrimary ? (
                            <span className="bg-[#176B45] text-white text-[9px] px-1.5 py-0.5 rounded-sm font-medium uppercase tracking-luxury">
                              Cover Image
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSetPrimaryImage(img)}
                              className="bg-white/90 hover:bg-[#176B45] hover:text-white text-[#252A25] text-[9px] px-1.5 py-0.5 rounded-sm font-medium uppercase transition-colors"
                            >
                              Set Cover
                            </button>
                          )}
                          <span className="text-[9px] text-white/80 bg-black/40 px-1 rounded">
                            #{i + 1}
                          </span>
                        </div>
                      </div>

                      {/* Angle Selector */}
                      <select
                        value={photoAngles[img] || standardAngles[i] || "Front View"}
                        onChange={(e) => setPhotoAngles((prev) => ({ ...prev, [img]: e.target.value }))}
                        className="w-full text-[9px] bg-white border border-[#E2DFD6] rounded px-1.5 py-0.5 text-[#315039] focus:outline-none focus:border-[#176B45]"
                        title="Photography angle category"
                      >
                        {standardAngles.map((ang) => (
                          <option key={ang} value={ang}>
                            {ang}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Upload Button */}
            <div>
              <label className="block text-[11px] uppercase tracking-luxury text-[#315039] font-medium mb-1">
                Upload New Photograph (JPG, PNG, WebP, AVIF)
              </label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/jpg,image/avif"
                onChange={handleFileUpload}
                disabled={uploadingImage}
                className="w-full text-xs text-[#74786F] file:mr-2 file:py-1.5 file:px-3 file:rounded-sm file:border-0 file:text-xs file:bg-[#176B45] file:text-white hover:file:bg-[#125837] cursor-pointer"
              />
              {uploadingImage && (
                <p className="text-[11px] text-[#AA9160] mt-1 font-medium">
                  Uploading photograph to Supabase Storage CDN...
                </p>
              )}
              {uploadError && <p className="text-[11px] text-rose-600 mt-1">{uploadError}</p>}
            </div>

            <div className="pt-2 border-t border-[#E2DFD6]">
              <a
                href="/DHEERA_PRODUCT_PHOTOGRAPHY_GUIDE.md"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-[#AA9160] hover:underline flex items-center gap-1"
              >
                <span>📖 View DHEERA Photography Guide (Angles & Specs)</span>
              </a>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 bg-[#176B45] text-white text-xs uppercase tracking-luxury font-medium hover:bg-[#125837] transition-colors rounded-sm disabled:opacity-50"
            >
              {isSubmitting
                ? "Saving..."
                : formData.status === "published"
                ? "Save & Publish Garment →"
                : "Save Garment as Draft →"}
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

      {/* 3:4 Portrait Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-[#FAF9F5] rounded-sm max-w-md w-full border border-[#E2DFD6] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2DFD6] pb-2">
              <h4 className="font-serif text-base text-[#176B45]">
                Storefront 3:4 Portrait Preview
              </h4>
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="text-xs text-[#74786F] hover:text-[#176B45]"
              >
                ✕ Close
              </button>
            </div>

            <div className="flex gap-2 justify-center pb-2">
              <button
                type="button"
                onClick={() => setPreviewDevice("desktop")}
                className={`px-3 py-1 text-xs rounded-sm ${
                  previewDevice === "desktop"
                    ? "bg-[#176B45] text-white"
                    : "bg-white border text-[#74786F]"
                }`}
              >
                Desktop Card
              </button>
              <button
                type="button"
                onClick={() => setPreviewDevice("mobile")}
                className={`px-3 py-1 text-xs rounded-sm ${
                  previewDevice === "mobile"
                    ? "bg-[#176B45] text-white"
                    : "bg-white border text-[#74786F]"
                }`}
              >
                Mobile Card (390px)
              </button>
            </div>

            {/* Simulated Card */}
            <div className={`mx-auto bg-white p-3 border border-[#E2DFD6] rounded-sm ${previewDevice === "mobile" ? "max-w-[200px]" : "max-w-[260px]"}`}>
              <div className="relative aspect-[3/4] bg-[#EEEAE0] rounded-sm overflow-hidden mb-2">
                {formData.image ? (
                  <Image src={formData.image} alt={formData.name || "Preview"} fill className="object-cover" sizes="260px" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] text-[#74786F]">
                    No cover photograph
                  </div>
                )}
                {formData.tag && (
                  <span className="absolute top-2 left-2 bg-white/90 text-[#176B45] text-[9px] font-medium px-1.5 py-0.5 rounded-sm">
                    {formData.tag}
                  </span>
                )}
              </div>
              <h5 className="font-serif text-xs text-[#252A25] line-clamp-1">{formData.name || "Garment Name"}</h5>
              <p className="text-[10px] text-[#74786F] mb-1">{formData.category}</p>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-[#176B45]">₹{formData.price.toLocaleString("en-IN")}</span>
                {formData.originalPrice && formData.originalPrice > formData.price && (
                  <span className="text-[10px] text-[#74786F] line-through">
                    ₹{formData.originalPrice.toLocaleString("en-IN")}
                  </span>
                )}
              </div>
            </div>

            <p className="text-[11px] text-center text-[#74786F]">
              Aspect ratio is strictly maintained at 3:4 portrait without distortion.
            </p>
          </div>
        </div>
      )}
    </form>
  );
}
