import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { SAMPLE_PRODUCTS } from "@/constants";
import { formatCurrencyINR } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

export function FeaturedProducts() {
  return (
    <section className="bg-dheera-cream py-16 border-y border-dheera-line">
      <Container size="default">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <span className="text-[10px] uppercase tracking-luxury text-dheera-dark-green font-medium">
              The DHEERA Selection
            </span>
            <h2 className="text-3xl md:text-4xl font-serif text-dheera-forest-green mt-2">
              Pieces to Treasure
            </h2>
          </div>
          <Link
            href="/shop"
            className="inline-flex items-center gap-1 text-xs uppercase tracking-luxury text-dheera-forest-green hover:text-dheera-muted-gold font-medium"
          >
            <span>View All Pieces</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {SAMPLE_PRODUCTS.map((product) => (
            <div
              key={product.id}
              className="group bg-dheera-warm-ivory/60 border border-dheera-line flex flex-col"
            >
              <div className="relative aspect-[3/4] overflow-hidden bg-dheera-warm-ivory">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div className="absolute top-4 left-4">
                  <Badge variant="default">{product.tag}</Badge>
                </div>
              </div>

              <div className="p-6 flex flex-col flex-1 justify-between">
                <div>
                  <span className="text-[10px] uppercase tracking-luxury text-dheera-secondary-text block mb-1">
                    {product.category}
                  </span>
                  <h3 className="text-lg font-serif text-dheera-primary-text group-hover:text-dheera-forest-green transition-colors mb-2">
                    {product.name}
                  </h3>
                  <p className="text-xs text-dheera-secondary-text line-clamp-2 leading-relaxed">
                    {product.description}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-dheera-line flex items-center justify-between">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-medium text-dheera-forest-green">
                      {formatCurrencyINR(product.price)}
                    </span>
                    {product.originalPrice && (
                      <span className="text-xs text-dheera-secondary-text/60 line-through">
                        {formatCurrencyINR(product.originalPrice)}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] uppercase tracking-luxury text-dheera-muted-gold">
                    Concept
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

