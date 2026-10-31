import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductBySlug, getRelatedProducts, getAllProducts } from "@/lib/data/products";
import { ProductDetailView } from "@/components/products/product-detail-view";
import { ProductCard } from "@/components/products/product-card";
import { Container } from "@/components/ui/container";

interface ProductPageProps {
  params: {
    slug: string;
  };
}

/**
 * Pre-generate static routes for all sample products for lightning-fast delivery
 */
export async function generateStaticParams() {
  const products = await getAllProducts();
  return products.map((p) => ({
    slug: p.slug,
  }));
}

/**
 * Dynamic SEO metadata generation
 */
export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const product = await getProductBySlug(params.slug);

  if (!product) {
    return {
      title: "Product Not Found | DHEERA",
    };
  }

  const title = `${product.name} | DHEERA — Apparel & Lifestyle`;
  const description = product.shortDescription || product.description;

  return {
    title,
    description,
    alternates: {
      canonical: `/product/${product.slug}`,
    },
    openGraph: {
      title,
      description,
      images: [
        {
          url: product.image,
          width: 1200,
          height: 1600,
          alt: product.name,
        },
      ],
      type: "website",
    },
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const product = await getProductBySlug(params.slug);

  if (!product) {
    notFound();
  }

  // Related products query (4 items)
  const relatedProducts = await getRelatedProducts(product.slug, product.categorySlug, 4);

  // Structured Data (JSON-LD Product Schema)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.gallery,
    description: product.description,
    sku: product.sku,
    category: product.category,
    offers: {
      "@type": "Offer",
      priceCurrency: "INR",
      price: product.price,
      availability: product.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
    brand: {
      "@type": "Brand",
      name: "DHEERA",
    },
  };

  return (
    <div className="py-8 sm:py-14">
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Container size="default">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="mb-8 text-xs text-[#74786F]">
          <ol className="flex flex-wrap items-center gap-2">
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
            <li className="text-[#AA9160]">/</li>
            <li>
              <Link
                href={`/collections/${product.categorySlug}`}
                className="hover:text-[#176B45] transition-colors"
              >
                {product.category}
              </Link>
            </li>
            <li className="text-[#AA9160]">/</li>
            <li className="text-[#176B45] font-medium truncate max-w-xs sm:max-w-md">
              {product.name}
            </li>
          </ol>
        </nav>

        {/* Main Product Detail View */}
        <ProductDetailView product={product} />

        {/* ================= RELATED PRODUCTS ("YOU MAY ALSO LIKE") ================= */}
        {relatedProducts.length > 0 && (
          <section className="mt-20 pt-16 border-t border-[#E2DFD6]">
            <div className="text-center max-w-xl mx-auto mb-10">
              <span className="text-[10px] uppercase tracking-luxury text-[#AA9160] font-semibold block mb-1">
                Complementary Silhouettes
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif text-[#176B45]">
                You May Also Like
              </h2>
              <p className="text-xs text-[#74786F] mt-1.5">
                Thoughtfully crafted pieces woven from the same dedication to Indian heritage and quiet luxury.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {relatedProducts.map((related) => (
                <ProductCard key={related.id} product={related} />
              ))}
            </div>
          </section>
        )}
      </Container>
    </div>
  );
}

