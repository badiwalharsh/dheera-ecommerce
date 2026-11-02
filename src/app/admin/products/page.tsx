"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { AdminLayout } from "@/components/admin/admin-layout";
import { StatusBadge } from "@/components/admin/status-badge";
import { CatalogProduct } from "@/types/ecommerce";
import { CsvImportReport } from "@/lib/services/product-import";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // CSV Import Modal State
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isValidatingCsv, setIsValidatingCsv] = useState(false);
  const [isImportingCsv, setIsImportingCsv] = useState(false);
  const [csvReport, setCsvReport] = useState<CsvImportReport | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      let url = "/api/admin/products";
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (selectedCategory !== "all") params.append("category", selectedCategory);
      if (selectedStatus !== "all") params.append("status", selectedStatus);
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
  }, [search, selectedCategory, selectedStatus]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleDuplicate = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/products/${id}/duplicate`, { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionMessage({ text: `Garment cloned: ${data.product.name}`, type: "success" });
        fetchProducts();
      }
    } catch {
      setActionMessage({ text: "Failed to duplicate product.", type: "error" });
    }
  };

  const handleArchive = async (id: string, name: string) => {
    if (!confirm(`Are you sure you wish to archive "${name}" from the active storefront?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
      if (res.ok) {
        setActionMessage({ text: `Garment "${name}" archived successfully.`, type: "success" });
        fetchProducts();
      }
    } catch {
      setActionMessage({ text: "Failed to archive product.", type: "error" });
    }
  };

  const handleArchiveAllPrototypes = async () => {
    const confirmed = confirm(
      "CONFIRM PROTOTYPE ARCHIVING:\n\nAre you sure you wish to archive all development prototype products?\n\nThey will be safely hidden from the storefront while keeping historical orders intact. This action ensures only approved commercial inventory is visible to customers."
    );
    if (!confirmed) return;

    try {
      const res = await fetch("/api/admin/products/archive-prototypes", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionMessage({ text: data.message, type: "success" });
        fetchProducts();
      } else {
        setActionMessage({ text: data.error || "Failed to archive prototypes.", type: "error" });
      }
    } catch {
      setActionMessage({ text: "Network error archiving prototypes.", type: "error" });
    }
  };

  // CSV File Selection & Validation
  const handleCsvFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFile(file);
    setImportError(null);
    setIsValidatingCsv(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("mode", "validate");

      const res = await fetch("/api/admin/products/import", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setCsvReport(data.report);
      } else {
        setImportError(data.error || "Failed to validate CSV file.");
        setCsvReport(null);
      }
    } catch {
      setImportError("Error communicating with CSV validation service.");
      setCsvReport(null);
    } finally {
      setIsValidatingCsv(false);
    }
  };

  // Confirm CSV Import Execution
  const handleConfirmCsvImport = async () => {
    if (!importFile) return;

    setIsImportingCsv(true);
    setImportError(null);

    try {
      const formData = new FormData();
      formData.append("file", importFile);
      formData.append("mode", "confirm");

      const res = await fetch("/api/admin/products/import", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setActionMessage({ text: data.message, type: "success" });
        setShowImportModal(false);
        setImportFile(null);
        setCsvReport(null);
        fetchProducts();
      } else {
        setImportError(data.error || "Failed to complete CSV import.");
      }
    } catch {
      setImportError("Network error during product import.");
    } finally {
      setIsImportingCsv(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E2DFD6] gap-4">
          <div>
            <span className="text-[10px] uppercase tracking-luxury text-[#AA9160] font-semibold block">
              COMMERCIAL CATALOGUE MANAGEMENT
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl text-[#176B45]">
              Garments & Collections
            </h1>
            <p className="text-xs text-[#74786F] mt-0.5">
              Manage commercial product listings, photography assets, pricing, publication lifecycle, and bulk imports.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
            <button
              onClick={() => setShowImportModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-sm bg-[#FAF9F5] border border-[#176B45] text-[#176B45] hover:bg-[#176B45] hover:text-white text-xs uppercase tracking-luxury font-medium transition-colors"
            >
              <span>📥</span>
              <span>Import via CSV</span>
            </button>

            <button
              onClick={handleArchiveAllPrototypes}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-sm bg-[#FAF9F5] border border-[#AA9160] text-[#AA9160] hover:bg-[#AA9160] hover:text-white text-xs uppercase tracking-luxury font-medium transition-colors"
              title="Deactivates development prototypes so only real products are visible"
            >
              <span>📦</span>
              <span>Archive Prototypes</span>
            </button>

            <Link
              href="/admin/products/new"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-sm bg-[#176B45] text-white text-xs uppercase tracking-luxury font-medium hover:bg-[#125837] transition-colors"
            >
              <span>+</span>
              <span>Create New Garment</span>
            </Link>
          </div>
        </div>

        {actionMessage && (
          <div
            className={`p-3 text-xs rounded-sm flex items-center justify-between border ${
              actionMessage.type === "success"
                ? "bg-[#EAF5EF] border-[#176B45]/20 text-[#176B45]"
                : "bg-rose-50 border-rose-200 text-rose-700"
            }`}
          >
            <span>{actionMessage.text}</span>
            <button onClick={() => setActionMessage(null)} className="text-xs font-bold px-2">
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

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
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

            <div className="flex items-center gap-1.5">
              <span className="text-[11px] uppercase tracking-luxury text-[#74786F]">Status:</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 bg-white border border-[#E2DFD6] rounded-sm text-xs text-[#252A25] focus:outline-none focus:border-[#176B45]"
              >
                <option value="all">All Statuses</option>
                <option value="published">Published (Live)</option>
                <option value="draft">Draft (Private)</option>
                <option value="archived">Archived (Hidden)</option>
                <option value="prototype">Prototypes Only</option>
              </select>
            </div>
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
                  <th className="py-3 px-4">Price / MRP</th>
                  <th className="py-3 px-4">Sizes</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2DFD6]/60">
                {products.length > 0 ? (
                  products.map((p) => {
                    const statusKey = p.status || (p.inStock ? "published" : "archived");
                    return (
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
                              <div className="flex items-center gap-1.5">
                                <p className="font-medium text-[#176B45] text-xs">{p.name}</p>
                                {p.isPrototype && (
                                  <span className="text-[8px] px-1 py-0.5 rounded bg-amber-100 text-amber-800 font-bold uppercase tracking-wider">
                                    Prototype
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-[#74786F]">{p.fabric || "Handloom Textile"}</p>
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
                          <StatusBadge status={statusKey as any} size="sm" />
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            {statusKey === "published" && (
                              <Link
                                href={`/product/${p.slug}`}
                                target="_blank"
                                className="p-1 text-[#74786F] hover:text-[#176B45]"
                                title="View on storefront"
                              >
                                👁️
                              </Link>
                            )}
                            <Link
                              href={`/admin/products/${p.id}/edit`}
                              className="px-2 py-1 bg-[#EEEAE0] hover:bg-[#176B45] hover:text-white rounded-sm text-[11px] text-[#315039] font-medium transition-colors"
                            >
                              Edit
                            </Link>
                            <button
                              onClick={() => handleDuplicate(p.id)}
                              className="p-1 text-[#74786F] hover:text-[#AA9160]"
                              title="Duplicate garment"
                            >
                              📋
                            </button>
                            <button
                              onClick={() => handleArchive(p.id, p.name)}
                              className="p-1 text-[#74786F] hover:text-rose-600"
                              title="Archive garment"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
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

        {/* CSV Import Modal */}
        {showImportModal && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <div className="bg-[#FAF9F5] rounded-sm max-w-2xl w-full border border-[#E2DFD6] p-6 space-y-5 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-[#E2DFD6] pb-3">
                <div>
                  <span className="text-[10px] uppercase tracking-luxury text-[#AA9160] font-semibold block">
                    BULK PRODUCT ONBOARDING
                  </span>
                  <h3 className="font-serif text-xl text-[#176B45]">
                    Import Commercial Products via CSV
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowImportModal(false);
                    setCsvReport(null);
                    setImportFile(null);
                  }}
                  className="text-sm text-[#74786F] hover:text-[#176B45]"
                >
                  ✕
                </button>
              </div>

              {/* Step 1: Download Template */}
              <div className="p-4 bg-white border border-[#E2DFD6] rounded-sm space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-xs text-[#176B45]">
                    Step 1: Download Standard CSV Template
                  </h4>
                  <a
                    href="/templates/DHEERA_PRODUCT_CATALOGUE_TEMPLATE.csv"
                    download="DHEERA_PRODUCT_CATALOGUE_TEMPLATE.csv"
                    className="px-3 py-1.5 bg-[#EEEAE0] hover:bg-[#176B45] hover:text-white rounded-sm text-xs text-[#315039] font-medium transition-colors"
                  >
                    ⬇ Download Template (.csv)
                  </a>
                </div>
                <p className="text-[11px] text-[#74786F]">
                  Use our standardized template containing all mandatory columns (Name, SKU, Category, Price, Description) and optional attributes (Fabric, Care, Fit, Origin).
                </p>
              </div>

              {/* Step 2: Upload CSV File */}
              <div className="p-4 bg-white border border-[#E2DFD6] rounded-sm space-y-3">
                <h4 className="font-medium text-xs text-[#176B45]">
                  Step 2: Choose Prepared CSV File
                </h4>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  ref={fileInputRef}
                  onChange={handleCsvFileChange}
                  className="w-full text-xs text-[#74786F] file:mr-2 file:py-1.5 file:px-3 file:rounded-sm file:border-0 file:text-xs file:bg-[#176B45] file:text-white hover:file:bg-[#125837] cursor-pointer"
                />
                {isValidatingCsv && (
                  <p className="text-xs text-[#AA9160]">Validating rows and checking duplicate SKUs...</p>
                )}
                {importError && (
                  <p className="text-xs text-rose-600 bg-rose-50 p-2 rounded-sm border border-rose-200">
                    {importError}
                  </p>
                )}
              </div>

              {/* Step 3: Validation Report & Preview */}
              {csvReport && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-3 bg-white border border-[#E2DFD6] rounded-sm">
                      <div className="text-base font-bold text-[#252A25]">{csvReport.totalRows}</div>
                      <div className="text-[10px] uppercase tracking-luxury text-[#74786F]">Total Rows</div>
                    </div>
                    <div className="p-3 bg-white border border-[#176B45]/20 rounded-sm">
                      <div className="text-base font-bold text-[#176B45]">{csvReport.validCount}</div>
                      <div className="text-[10px] uppercase tracking-luxury text-[#176B45]">Valid for Import</div>
                    </div>
                    <div className="p-3 bg-white border border-rose-200 rounded-sm">
                      <div className="text-base font-bold text-rose-600">{csvReport.invalidCount}</div>
                      <div className="text-[10px] uppercase tracking-luxury text-rose-600">Rows with Errors</div>
                    </div>
                  </div>

                  {/* Errors Table if any */}
                  {csvReport.errors.length > 0 && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-sm space-y-2">
                      <h5 className="font-semibold text-xs text-rose-800">Validation Errors:</h5>
                      <ul className="text-[11px] text-rose-700 space-y-1 max-h-32 overflow-y-auto">
                        {csvReport.errors.map((err, i) => (
                          <li key={i}>
                            <strong>Row {err.rowNumber}</strong> ({err.field}): {err.message}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Preview Table */}
                  <div className="border border-[#E2DFD6] rounded-sm overflow-hidden bg-white max-h-44 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#EEEAE0]/70 border-b border-[#E2DFD6] text-[10px] uppercase tracking-luxury text-[#74786F]">
                        <tr>
                          <th className="py-2 px-3">Row</th>
                          <th className="py-2 px-3">Garment</th>
                          <th className="py-2 px-3">SKU</th>
                          <th className="py-2 px-3">Category</th>
                          <th className="py-2 px-3">Price</th>
                          <th className="py-2 px-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E2DFD6]/60 text-[11px]">
                        {csvReport.previewRows.map((r, i) => (
                          <tr key={i} className={r.isValid ? "bg-white" : "bg-rose-50/50"}>
                            <td className="py-1.5 px-3">{r.rowNumber}</td>
                            <td className="py-1.5 px-3 font-medium">{r.name}</td>
                            <td className="py-1.5 px-3 font-mono text-[10px]">{r.sku}</td>
                            <td className="py-1.5 px-3">{r.category}</td>
                            <td className="py-1.5 px-3">₹{r.price.toLocaleString("en-IN")}</td>
                            <td className="py-1.5 px-3">
                              {r.isValid ? (
                                <span className="text-emerald-700 font-semibold">✔ Valid (Draft)</span>
                              ) : (
                                <span className="text-rose-600 font-semibold">✖ Invalid</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <p className="text-[10px] text-[#74786F]">
                    Strict Guardrail: All valid products will be imported as <strong>DRAFT</strong>. They will remain completely private until you attach original photography and explicitly publish them.
                  </p>
                </div>
              )}

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E2DFD6]">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 border border-[#E2DFD6] text-xs text-[#74786F] hover:text-[#176B45] rounded-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCsvImport}
                  disabled={!csvReport || csvReport.validCount === 0 || isImportingCsv}
                  className="px-5 py-2 bg-[#176B45] text-white text-xs uppercase tracking-luxury font-medium rounded-sm hover:bg-[#125837] disabled:opacity-40 transition-colors"
                >
                  {isImportingCsv
                    ? "Importing..."
                    : `Confirm Import (${csvReport?.validCount || 0} Drafts) →`}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
