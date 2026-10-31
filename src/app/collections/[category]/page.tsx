import React, { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategories, getCategoryBySlug, getAllProducts, CategoryInfo } from "@/lib/data/products";
import { ShopView } from "@/components/shop/shop-view";
import { Container } from "@/components/ui/container";

interface CategoryPageProps {
  params: {
    category: string;
  };
}

export async function generateStaticParams() {
  const categories = await getCategories();
  return categories.map((c: CategoryInfo) => ({
    category: c.slug,
  }));
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const category = await getCategoryBySlug(params.category);

  if (!category) {
    return {
      title: "Collection Not Found | DHEERA",
    };
  }

  return {
    title: `${category.name} Collection | DHEERA — Apparel & Lifestyle`,
    description:
      category.description ||
      `Explore our curated edit of handcrafted Indian ${category.name}. Made with intention, heritage weaves, and contemporary soul.`,
    alternates: {
      canonical: `/collections/${category.slug}`,
    },
    openGraph: {
      title: `${category.name} | DHEERA`,
      description: category.description,
      images: [{ url: category.image }],
    },
  };
}

function CollectionFallback() {
  return (
    <div className="py-20">
      <Container size="default">
        <div className="text-center space-y-3">
          <span className="text-[#AA9160] text-xl font-serif">✦</span>
          <p className="text-xs uppercase tracking-luxury text-[#176B45] font-semibold">
            Loading Curated Collection...
          </p>
        </div>
      </Container>
    </div>
  );
}

export default async function CategoryCollectionPage({ params }: CategoryPageProps) {
  const category = await getCategoryBySlug(params.category);

  if (!category) {
    notFound();
  }

  const allProducts = await getAllProducts({ category: category.slug });

  return (
    <Suspense fallback={<CollectionFallback />}>
      <ShopView
        initialProducts={allProducts}
        categoryTitle={category.name}
        categorySubtitle={category.description}
        categorySlug={category.slug}
      />
    </Suspense>
  );
}
