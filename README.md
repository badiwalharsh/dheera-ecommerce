# DHEERA — Apparel & Lifestyle

> **Indian Heritage, Contemporary Soul**  
> *Made in India | For the World*  
> Official Instagram: [@dheera_india](https://www.instagram.com/dheera_india/)

DHEERA is a luxury Indian designer apparel storefront built with Next.js App Router, TypeScript, Tailwind CSS, Supabase PostgreSQL, and Razorpay payment integration.

---

## 🎨 Visual Identity & Design System

The application strictly implements DHEERA's brand aesthetic:

- **Primary Colour:** Deep Forest Green (`#176B45`)
- **Secondary Colour:** Dark Olive Green (`#315039`)
- **Main Background:** Warm Ivory (`#EEEAE0`)
- **Secondary Background:** Soft Cream (`#FAF9F5`)
- **Accent:** Muted Antique Gold (`#C5A059`)
- **Typography:**
  - **Headings:** Luxury Serif (`Playfair Display`)
  - **Body:** Modern Clean Sans-Serif (`DM Sans`)
- **Aesthetic:** Minimalistic, spacious, editorial luxury, quiet femininity and sophistication.

---

## 🏗️ Architecture & Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript 5 (Strict typing enabled)
- **Styling:** Tailwind CSS + PostCSS + CSS Variables
- **Database:** Supabase PostgreSQL with Row Level Security (RLS)
- **Authentication:** Supabase Auth (Email/Password, Magic Link, OAuth)
- **Storage:** Supabase Storage (Product imagery & custom design uploads)
- **Payments:** Razorpay Indian Payment Gateway (Test Mode configured)
- **Deployment:** Vercel

---

## 📁 Scalable Folder Structure

```text
dheera/
├── app/                      # Next.js App Router
│   ├── globals.css           # Global CSS variables & luxury design tokens
│   ├── layout.tsx            # Root layout with fonts, header, announcement bar, footer
│   └── page.tsx              # Phase 1 foundational homepage showcase
├── components/
│   ├── common/               # Shared branding components
│   │   └── brand-logo.tsx    # Official DHEERA emblem with mix-blend-multiply
│   ├── layout/               # Global shell components
│   │   ├── announcement-bar.tsx # Top brand announcement banner
│   │   ├── header.tsx        # Responsive sticky header & mobile drawer
│   │   └── footer.tsx        # Editorial multi-column footer
│   └── ui/                   # Reusable atomic UI elements
│       ├── badge.tsx         # Tag and badge components
│       ├── button.tsx        # Luxury styled button variants
│       ├── container.tsx     # Responsive layout container
│       └── input.tsx         # Clean input fields
├── lib/
│   ├── constants.ts          # Brand constants, links, sample catalog
│   ├── utils.ts              # Styling helpers (cn) and INR currency formatting
│   └── supabase/             # Supabase clients
│       ├── admin.ts          # Privileged server-side service-role client
│       ├── client.ts         # Browser client for client components
│       └── server.ts         # Server component & action client with cookies
├── public/
│   ├── assets/               # Curated editorial fashion photography
│   └── brand/                # Official brand logo asset (DHEERA.png)
├── supabase/
│   ├── schema.sql            # Complete PostgreSQL schema (18 entities, RLS, indexes)
│   └── README.md             # Detailed database architecture documentation
├── types/
│   ├── database.ts           # Strongly typed database entity interfaces
│   └── ecommerce.ts          # Frontend e-commerce, cart, filters, and checkout types
├── .env.example              # Environment variables template
├── package.json              # Dependency manifest
├── tailwind.config.ts        # Design token configuration
└── tsconfig.json             # TypeScript compiler settings
```

---

## 💾 Database Entities (Supabase PostgreSQL)

Full schema is defined in `supabase/schema.sql` covering 18 entities:

1. `customer_profiles` (1:1 with `auth.users`)
2. `product_categories`
3. `products`
4. `product_images`
5. `sizes`
6. `colours`
7. `product_variants`
8. `inventory`
9. `carts`
10. `cart_items`
11. `wishlists`
12. `addresses`
13. `orders`
14. `order_items`
15. `payments`
16. `coupons`
17. `customization_requests`

All tables have **Row Level Security (RLS)** enabled to guarantee customer data privacy and protect admin operations.

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18.17+ or 20+ installed
- npm or pnpm

### 2. Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Production Build & Typecheck
```bash
npm run typecheck
npm run build
```

