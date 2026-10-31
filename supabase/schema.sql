-- ==============================================================================
-- DHEERA — Master Database Schema (Hardened)
-- Brand: DHEERA (Apparel & Lifestyle)
-- Relational Database: PostgreSQL (Supabase)
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 1. ENUMS
-- ==============================================================================

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('customer', 'admin', 'staff');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE order_status AS ENUM (
    'pending',
    'payment_pending',
    'confirmed',
    'processing',
    'dispatched',
    'out_for_delivery',
    'delivered',
    'cancelled',
    'refunded'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM (
    'created',
    'authorized',
    'captured',
    'failed',
    'refunded'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_method AS ENUM (
    'razorpay',
    'cod',
    'upi',
    'card',
    'netbanking'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE customization_status AS ENUM (
    'submitted',
    'under_review',
    'consultation_scheduled',
    'fabric_sourced',
    'in_tailoring',
    'ready',
    'dispatched',
    'closed'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ==============================================================================
-- 2. PROFILES (1:1 with auth.users)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'customer',
  avatar_url TEXT,
  default_shipping_address_id UUID,
  default_billing_address_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 3. CATEGORIES
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  display_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 4. PRODUCTS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  short_description TEXT,
  description TEXT NOT NULL,
  fabric_care TEXT,
  details JSONB DEFAULT '[]'::jsonb,
  base_price NUMERIC(10, 2) NOT NULL CHECK (base_price >= 0),
  compare_at_price NUMERIC(10, 2) CHECK (compare_at_price IS NULL OR compare_at_price >= base_price),
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  is_new_arrival BOOLEAN NOT NULL DEFAULT FALSE,
  is_customizable BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  tag TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 5. PRODUCT IMAGES
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.product_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  alt_text TEXT NOT NULL DEFAULT '',
  display_order INT NOT NULL DEFAULT 0,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 6. PRODUCT VARIANTS & INVENTORY
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  size TEXT NOT NULL,
  colour TEXT,
  sku TEXT NOT NULL UNIQUE,
  price_modifier NUMERIC(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_product_size_colour UNIQUE (product_id, size, colour)
);

CREATE TABLE IF NOT EXISTS public.inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  variant_id UUID NOT NULL UNIQUE REFERENCES public.product_variants(id) ON DELETE CASCADE,
  quantity_available INT NOT NULL DEFAULT 0 CHECK (quantity_available >= 0),
  quantity_reserved INT NOT NULL DEFAULT 0 CHECK (quantity_reserved >= 0),
  low_stock_threshold INT NOT NULL DEFAULT 3,
  allow_backorder BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 7. ADDRESSES
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  landmark TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'India',
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  address_type TEXT NOT NULL DEFAULT 'shipping',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 8. CARTS & CART ITEMS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.carts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_cart_user UNIQUE (user_id),
  CONSTRAINT chk_cart_owner CHECK (user_id IS NOT NULL OR session_token IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS public.cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cart_id UUID NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
  variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_cart_variant UNIQUE (cart_id, variant_id)
);

-- ==============================================================================
-- 9. WISHLISTS & WISHLIST ITEMS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.wishlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.wishlist_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wishlist_id UUID NOT NULL REFERENCES public.wishlists(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_wishlist_product UNIQUE (wishlist_id, product_id)
);

-- ==============================================================================
-- 10. ORDERS & ORDER ITEMS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  shipping_address_id UUID REFERENCES public.addresses(id) ON DELETE SET NULL,
  shipping_address_snapshot JSONB NOT NULL,
  status order_status NOT NULL DEFAULT 'pending',
  subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0),
  discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  shipping_fee NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (shipping_fee >= 0),
  tax_amount NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
  total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
  notes TEXT,
  tracking_number TEXT,
  shipping_carrier TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  product_name TEXT NOT NULL,
  sku TEXT NOT NULL,
  size_label TEXT NOT NULL,
  colour_label TEXT,
  quantity INT NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
  total_price NUMERIC(10, 2) NOT NULL CHECK (total_price >= 0)
);

-- ==============================================================================
-- 11. PAYMENTS (Razorpay)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  payment_method payment_method NOT NULL DEFAULT 'razorpay',
  payment_gateway TEXT NOT NULL DEFAULT 'razorpay',
  gateway_order_id TEXT NOT NULL,
  gateway_payment_id TEXT,
  gateway_signature TEXT,
  amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
  currency TEXT NOT NULL DEFAULT 'INR',
  status payment_status NOT NULL DEFAULT 'created',
  failure_reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 12. CUSTOMIZATION REQUESTS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.customization_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_number TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  outfit_category TEXT NOT NULL,
  preferred_colour TEXT,
  preferred_fabric TEXT,
  occasion TEXT,
  measurements JSONB DEFAULT '{}'::jsonb,
  design_notes TEXT NOT NULL,
  reference_image_urls JSONB DEFAULT '[]'::jsonb,
  status customization_status NOT NULL DEFAULT 'submitted',
  admin_notes TEXT,
  estimated_quote NUMERIC(10, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 13. INDEXES FOR QUERY OPTIMIZATION
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_product_variants_product ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_payments_order ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_gateway_order ON public.payments(gateway_order_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_cart ON public.cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_items_wishlist ON public.wishlist_items(wishlist_id);
CREATE INDEX IF NOT EXISTS idx_customization_user ON public.customization_requests(user_id);

-- ==============================================================================
-- 14. SECURITY FUNCTIONS (WITH EXPLICIT SEARCH_PATH)
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'SECURITY ERROR: Unauthorized attempt to modify user role.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_role_escalation ON public.profiles;
CREATE TRIGGER trg_prevent_role_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_role_escalation();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Valued Customer'),
    'customer'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 15. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customization_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public categories viewable" ON public.categories FOR SELECT USING (is_active = TRUE OR public.is_admin());
CREATE POLICY "Public active products viewable" ON public.products FOR SELECT USING (is_active = TRUE OR public.is_admin());
CREATE POLICY "Public product images viewable" ON public.product_images FOR SELECT USING (TRUE);
CREATE POLICY "Public product variants viewable" ON public.product_variants FOR SELECT USING (TRUE);
CREATE POLICY "Public inventory viewable" ON public.inventory FOR SELECT USING (TRUE);

CREATE POLICY "Profiles viewable by owner or admin" ON public.profiles FOR SELECT USING (auth.uid() = id OR public.is_admin());
CREATE POLICY "Profiles updatable by owner or admin" ON public.profiles FOR UPDATE USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Addresses viewable by owner or admin" ON public.addresses FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Addresses insertable by owner" ON public.addresses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Addresses updatable by owner" ON public.addresses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Addresses deletable by owner" ON public.addresses FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Carts accessible by owner" ON public.carts FOR ALL USING (
  (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR
  (user_id IS NULL AND session_token IS NOT NULL)
);

CREATE POLICY "Cart items accessible by cart owner" ON public.cart_items FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.carts 
    WHERE carts.id = cart_items.cart_id 
      AND (
        (auth.uid() IS NOT NULL AND carts.user_id = auth.uid()) OR
        (carts.user_id IS NULL AND carts.session_token IS NOT NULL)
      )
  )
);

CREATE POLICY "Wishlists accessible by owner" ON public.wishlists FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Wishlist items accessible by wishlist owner" ON public.wishlist_items FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.wishlists 
    WHERE wishlists.id = wishlist_items.wishlist_id AND wishlists.user_id = auth.uid()
  )
);

CREATE POLICY "Orders viewable by owner or admin" ON public.orders FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Orders insertable by customer" ON public.orders FOR INSERT WITH CHECK (
  (auth.uid() = user_id OR user_id IS NULL) AND status = 'pending'
);
CREATE POLICY "Order items viewable with order" ON public.order_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_items.order_id AND (orders.user_id = auth.uid() OR public.is_admin())
  )
);

CREATE POLICY "Payments viewable by order owner or admin" ON public.payments FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = payments.order_id AND (orders.user_id = auth.uid() OR public.is_admin())
  )
);

CREATE POLICY "Customizations viewable by owner or admin" ON public.customization_requests FOR SELECT USING (
  auth.uid() = user_id OR public.is_admin()
);
CREATE POLICY "Customizations insertable with submitted status" ON public.customization_requests FOR INSERT WITH CHECK (
  status = 'submitted' AND estimated_quote IS NULL AND admin_notes IS NULL
);

CREATE POLICY "Admin full categories" ON public.categories FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full products" ON public.products FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full product images" ON public.product_images FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full product variants" ON public.product_variants FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full inventory" ON public.inventory FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full orders" ON public.orders FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full order items" ON public.order_items FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full payments" ON public.payments FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full customizations" ON public.customization_requests FOR ALL USING (public.is_admin());
