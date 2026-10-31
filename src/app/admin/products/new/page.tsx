"use client";

import React from "react";
import Link from "next/link";
import { AdminLayout } from "@/components/admin/admin-layout";
import { ProductForm } from "@/components/admin/product-form";

export default function NewProductPage() {
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
            NEW COLLECTION ITEM
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl text-[#176B45]">
            Add New Designer Garment
          </h1>
          <p className="text-xs text-[#74786F] mt-0.5">
            Create an editorial product profile with fabrics, variants, prices, and high-resolution imagery.
          </p>
        </div>

        <ProductForm />
      </div>
    </AdminLayout>
  );
}

