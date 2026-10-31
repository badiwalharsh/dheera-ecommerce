import { redirect } from "next/navigation";
import { getProductById, getProductBySlug } from "@/lib/data/products";

interface ProductLegacyPageProps {
  searchParams: {
    id?: string;
    slug?: string;
  };
}

export default async function ProductLegacyPage({ searchParams }: ProductLegacyPageProps) {
  const target = searchParams.slug || searchParams.id;

  if (target) {
    const product = (await getProductBySlug(target)) || (await getProductById(target));
    if (product) {
      redirect(`/product/${product.slug}`);
    }
  }

  // Fallback to catalogue
  redirect("/shop");
}
