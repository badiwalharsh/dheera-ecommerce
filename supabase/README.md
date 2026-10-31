# DHEERA — Database Architecture & Schema Guide

This document specifies the PostgreSQL database architecture implemented on **Supabase** for the **DHEERA** designer e-commerce application.

---

## Brand Context

- **Brand:** DHEERA (Apparel & Lifestyle)
- **Positioning:** Indian Heritage, Contemporary Soul
- **E-Commerce Scope:** Handcrafted kurta sets, sarees, suits, dupattas, and bespoke customized outfits.

---

## Architectural Entities Overview

The database comprises 18 core relational tables:

| Entity | Table Name | Purpose | Key Relationships |
|---|---|---|---|
| **Users & Profiles** | `auth.users` & `public.customer_profiles` | User authentication & customer identity | 1:1 with `auth.users` |
| **Categories** | `public.product_categories` | Product hierarchy (Kurta Sets, Sarees, Suits, Dupattas) | 1:N with `products` |
| **Products** | `public.products` | Master product catalog record | N:1 with `product_categories` |
| **Product Images** | `public.product_images` | Multi-image editorial gallery for each product | N:1 with `products` |
| **Sizes** | `public.sizes` | Standard sizes (XS, S, M, L, XL, XXL, Free Size, Custom) | N:1 with `product_variants` |
| **Colours** | `public.colours` | Standard color shades & hex swatches | N:1 with `product_variants` |
| **Variants** | `public.product_variants` | SKU level combinations (Product + Size + Colour) | N:1 with `products`, `sizes`, `colours` |
| **Inventory** | `public.inventory` | Stock level tracking (available, reserved, threshold) | 1:1 with `product_variants` |
| **Carts** | `public.carts` | Persistent shopping bag per user or guest session | 1:N with `cart_items` |
| **Cart Items** | `public.cart_items` | Line items in a cart | N:1 with `carts`, `product_variants` |
| **Wishlists** | `public.wishlists` | Saved favorite products per user | N:1 with `users`, `products` |
| **Addresses** | `public.addresses` | Indian shipping & billing addresses | N:1 with `users` |
| **Orders** | `public.orders` | Placed customer orders with financial breakdown | 1:N with `order_items`, `payments` |
| **Order Items** | `public.order_items` | Immutable line items in an order | N:1 with `orders`, `products` |
| **Payments** | `public.payments` | Razorpay transactions, order IDs, signatures | N:1 with `orders` |
| **Coupons** | `public.coupons` | Promo codes, discount rules, usage limits | Optional link with `orders`, `carts` |
| **Customization** | `public.customization_requests` | Bespoke tailoring requests, measurements, reference images | N:1 with `users` (optional for guests) |

---

## Security & Row Level Security (RLS)

1. **Strict Customer Isolation:**
   - Customers can only query and mutate their own profile, addresses, orders, cart, wishlist, and customization requests.
   - Guest carts are partitioned using cryptographic `session_token` UUIDs.

2. **Role-Based Access Control:**
   - Evaluated via `public.is_admin()` security definer function checking `customer_profiles.role = 'admin'`.
   - Admin routes and database mutations are prevented for normal customer roles even if directly queried.

3. **Public Read-Only Catalog:**
   - Active products, published categories, sizes, colours, and product images have public read permission.
   - Deactivated or draft products are only visible to administrators.

4. **Payments & Inventory Integrity:**
   - Only backend service role (`SUPABASE_SERVICE_ROLE_KEY`) or admin functions can confirm payments and adjust finalized order statuses.

---

## Migration & Deployment

To apply the schema in your Supabase project:
1. Navigate to the **Supabase Dashboard** → **SQL Editor**.
2. Paste the contents of `supabase/schema.sql`.
3. Click **Run**.

