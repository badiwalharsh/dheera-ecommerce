# DHEERA — Database Architecture & Entity Relationship Diagram (ERD)

This document details the PostgreSQL relational schema implemented for **DHEERA — Apparel & Lifestyle** on **Supabase**.

---

## 1. Entity-Relationship Diagram (ERD)

```mermaid
erDiagram
    PROFILES ||--o{ ADDRESSES : "has many"
    PROFILES ||--o| CARTS : "owns"
    PROFILES ||--o| WISHLISTS : "owns"
    PROFILES ||--o{ ORDERS : "places"
    PROFILES ||--o{ CUSTOMIZATION_REQUESTS : "submits"

    CATEGORIES ||--o{ PRODUCTS : "contains"
    PRODUCTS ||--o{ PRODUCT_IMAGES : "has gallery"
    PRODUCTS ||--o{ PRODUCT_VARIANTS : "has variants"
    PRODUCTS ||--o{ WISHLIST_ITEMS : "saved in"

    PRODUCT_VARIANTS ||--|| INVENTORY : "tracked by"
    PRODUCT_VARIANTS ||--o{ CART_ITEMS : "added to"
    PRODUCT_VARIANTS ||--o{ ORDER_ITEMS : "ordered in"

    CARTS ||--o{ CART_ITEMS : "contains"
    WISHLISTS ||--o{ WISHLIST_ITEMS : "contains"

    ORDERS ||--o{ ORDER_ITEMS : "consists of"
    ORDERS ||--o{ PAYMENTS : "paid via"
    ORDERS }o--|| ADDRESSES : "delivered to"

    PROFILES {
        uuid id PK "references auth.users.id"
        text email UK
        text full_name
        text phone
        user_role role
        timestamptz created_at
    }

    CATEGORIES {
        uuid id PK
        text name
        text slug UK
        text image_url
        boolean is_active
    }

    PRODUCTS {
        uuid id PK
        uuid category_id FK
        text name
        text slug UK
        numeric base_price
        boolean is_featured
        boolean is_active
    }

    PRODUCT_IMAGES {
        uuid id PK
        uuid product_id FK
        text image_url
        int display_order
        boolean is_primary
    }

    PRODUCT_VARIANTS {
        uuid id PK
        uuid product_id FK
        text size
        text colour
        text sku UK
        numeric price_modifier
    }

    INVENTORY {
        uuid id PK
        uuid variant_id FK,UK
        int quantity_available
        int quantity_reserved
        int low_stock_threshold
    }

    ADDRESSES {
        uuid id PK
        uuid user_id FK
        text recipient_name
        text phone
        text address_line1
        text city
        text state
        text postal_code
    }

    CARTS {
        uuid id PK
        uuid user_id FK,UK
        text session_token
    }

    CART_ITEMS {
        uuid id PK
        uuid cart_id FK
        uuid variant_id FK
        int quantity
        numeric unit_price
    }

    WISHLISTS {
        uuid id PK
        uuid user_id FK,UK
    }

    WISHLIST_ITEMS {
        uuid id PK
        uuid wishlist_id FK
        uuid product_id FK
    }

    ORDERS {
        uuid id PK
        text order_number UK
        uuid user_id FK
        order_status status
        numeric subtotal
        numeric total_amount
    }

    ORDER_ITEMS {
        uuid id PK
        uuid order_id FK
        uuid product_id FK
        text product_name
        text size_label
        int quantity
        numeric unit_price
    }

    PAYMENTS {
        uuid id PK
        uuid order_id FK
        text gateway_order_id
        payment_status status
        numeric amount
    }

    CUSTOMIZATION_REQUESTS {
        uuid id PK
        text request_number UK
        uuid user_id FK
        text outfit_category
        customization_status status
        text design_notes
    }
```

---

## 2. Table Specifications

### 2.1 Identity & Customer
- **`profiles`**: Linked 1:1 with Supabase `auth.users`. Contains customer role (`customer`, `admin`, `staff`), contact numbers, and default address references.
- **`addresses`**: Indian postal shipping & billing addresses with recipient details, PIN code, and default selection flags.

### 2.2 Catalogue & Merchandise
- **`categories`**: Top-level collections (Kurta Sets, Sarees, Suits, Dupattas).
- **`products`**: Master product catalogue entity with base price, compare price, descriptions, care details, and SEO metadata.
- **`product_images`**: Multi-image editorial gallery for each product supporting primary flags and display ordering.
- **`product_variants`**: Specific SKU combinations for size and colour.
- **`inventory`**: Stock tracking with reserved quantity protection and low stock alerts.

### 2.3 Shopping & Ordering
- **`carts` & `cart_items`**: Dual-mode cart supporting authenticated customer accounts and guest sessions via tokens.
- **`wishlists` & `wishlist_items`**: Dedicated customer wishlist entities.
- **`orders` & `order_items`**: Immutable records of placed orders with financial subtotal, taxes, shipping fees, and address snapshots.
- **`payments`**: Razorpay transaction lifecycle tracking (`created`, `authorized`, `captured`, `failed`).

### 2.4 Bespoke Atelier
- **`customization_requests`**: Dedicated workflow for bespoke Indian outfits, measurements, reference imagery, quotes, and artisan consultation tracking.
