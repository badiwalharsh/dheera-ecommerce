import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { CATEGORIES } from "@/constants";

export function CategoryGrid() {
  return (
    <section className="py-16">
      <Container size="default">
        <div className="text-center max-w-xl mx-auto mb-12">
          <span className="text-[10px] uppercase tracking-luxury text-dheera-dark-green font-medium">
            Curated Wardrobe
          </span>
          <h2 className="text-3xl md:text-4xl font-serif text-dheera-forest-green mt-2 mb-3">
            Explore Collections
          </h2>
          <p className="text-sm text-dheera-secondary-text">
            Pieces that honour tradition while finding their place in modern life.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.id}
              href={cat.href}
              className="group relative overflow-hidden bg-dheera-cream aspect-[3/4] block border border-dheera-line"
            >
              <Image
                src={cat.image}
                alt={cat.name}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-70 group-hover:opacity-85 transition-opacity" />
              <div className="absolute bottom-6 left-6 right-6 text-white">
                <span className="text-[9px] uppercase tracking-luxury text-dheera-cream/80 block mb-1">
                  {cat.subtitle}
                </span>
                <h3 className="text-2xl font-serif text-white group-hover:text-dheera-cream transition-colors">
                  {cat.name}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}

