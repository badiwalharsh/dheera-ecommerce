import { Product, ProductImage, Category, ProductVariant } from "./database";

export interface HydratedProduct extends Product {
  category: Category;
  images: ProductImage[];
  variants: ProductVariant[];
}

export interface ClientCartItem {
  id: string;
  productId: string;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  image: string;
  size: string;
  colour?: string;
  quantity: number;
}
