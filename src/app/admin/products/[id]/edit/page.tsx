"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AdminLayout } from "@/components/admin/admin-layout";
import { ProductForm } from "@/components/admin/product-form";
import { CatalogProduct } from "@/types/ecommerce";

export default function EditProductPage() {
  const params = useParams();
  const id = params.id as string;
  const [product, setProduct] = useState<CatalogProduct | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/admin/products/${id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.product) {
            setProduct(data.product);
          }
        }
      } catch {
        // Handle error
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchProduct();
    }
  }, [id]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="pb-4 border-b border-[#E2DFD6]">
          <Link
            href="/admin/products"
            className="text-xs text-[#74786F] hover:text-[#176B45] mb-2 inline-block"
          >
            ← Back to Garments
          </Link>
          <span className="text-[10px] uppercase tracking-luxury text-[#AA9160] font-semibold block">
            EDIT GARMENT
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl text-[#176B45]">
            {product ? product.name : "Loading Garment Profile..."}
          </h1>
          <p className="text-xs text-[#74786F] mt-0.5">
            Modify pricing, specifications, sizes, photographs, and storefront status.
          </p>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-[#74786F] text-xs">
            Loading garment details...
          </div>
        ) : product ? (
          <ProductForm initialData={product} isEditing />
        ) : (
          <div className="p-12 bg-[#FAF9F5] border border-[#E2DFD6] text-center text-xs text-[#74786F]">
            Garment not found or may have been archived.
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

