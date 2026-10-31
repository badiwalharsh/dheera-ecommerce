import React from "react";
import { Container } from "@/components/ui/container";
import { CategoryGrid } from "@/components/homepage/category-grid";

export default function CollectionsPage() {
  return (
    <div className="py-12">
      <Container size="default">
        <CategoryGrid />
      </Container>
    </div>
  );
}
