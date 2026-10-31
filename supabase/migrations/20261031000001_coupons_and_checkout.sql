-- ==============================================================================
-- DHEERA — Migration: Coupons, Order Snapshots & Checkout Security
-- Phase 4: Shopping Bag, Checkout & Payment Engine
-- ==============================================================================

-- 1. Create discount_type enum if not exists
DO $$ BEGIN
  CREATE TYPE discount_type AS ENUM ('percentage', 'fixed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. COUPONS TABLE
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  discount_type discount_type NOT NULL DEFAULT 'percentage',
  discount_value NUMERIC(10, 2) NOT NULL CHECK (discount_value > 0),
  min_order_amount NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (min_order_amount >= 0),
  max_discount_amount NUMERIC(10, 2) CHECK (max_discount_amount IS NULL OR max_discount_amount > 0),
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  usage_limit INT CHECK (usage_limit IS NULL OR usage_limit > 0),
  times_used INT NOT NULL DEFAULT 0 CHECK (times_used >= 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_development_fixture BOOLEAN NOT NULL DEFAULT FALSE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. COUPON REDEMPTIONS TABLE (Prevents duplicate misuse)
CREATE TABLE IF NOT EXISTS public.coupon_redemptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  discount_amount NUMERIC(10, 2) NOT NULL CHECK (discount_amount >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_order_coupon UNIQUE (order_id, coupon_id)
);

-- 4. ADD COUPON COLUMNS TO ORDERS TABLE
DO $$ BEGIN
  ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS coupon_code TEXT;
  ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS coupon_id UUID REFERENCES public.coupons(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- 5. INDEXES
CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_coupon ON public.coupon_redemptions(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_order ON public.coupon_redemptions(order_id);

-- 6. ROW LEVEL SECURITY (RLS) FOR COUPONS
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;

-- Public can inspect active coupons for validation during checkout
CREATE POLICY "Active coupons viewable by all" ON public.coupons
  FOR SELECT USING (is_active = TRUE OR public.is_admin());

-- Redemptions viewable by customer for own order or by admin
CREATE POLICY "Coupon redemptions viewable by order owner or admin" ON public.coupon_redemptions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = coupon_redemptions.order_id
        AND (orders.user_id = auth.uid() OR public.is_admin())
    )
  );

-- Only Admin can insert/update/delete coupons directly
CREATE POLICY "Admin manage coupons" ON public.coupons
  FOR ALL USING (public.is_admin());

CREATE POLICY "Admin manage coupon redemptions" ON public.coupon_redemptions
  FOR ALL USING (public.is_admin());

-- 7. SEED DEVELOPMENT FIXTURE COUPONS (Clearly marked as development fixtures)
INSERT INTO public.coupons (
  code,
  discount_type,
  discount_value,
  min_order_amount,
  max_discount_amount,
  starts_at,
  expires_at,
  usage_limit,
  is_active,
  is_development_fixture,
  description
) VALUES
  (
    'DHEERA10',
    'percentage',
    10.00,
    2000.00,
    1500.00,
    NOW() - INTERVAL '1 day',
    NOW() + INTERVAL '1 year',
    1000,
    TRUE,
    TRUE,
    'DEVELOPMENT TEST FIXTURE — 10% off on orders above ₹2,000 (Max discount ₹1,500)'
  ),
  (
    'HERITAGE500',
    'fixed',
    500.00,
    3500.00,
    500.00,
    NOW() - INTERVAL '1 day',
    NOW() + INTERVAL '1 year',
    500,
    TRUE,
    TRUE,
    'DEVELOPMENT TEST FIXTURE — Flat ₹500 off on artisanal orders above ₹3,500'
  )
ON CONFLICT (code) DO UPDATE SET
  discount_type = EXCLUDED.discount_type,
  discount_value = EXCLUDED.discount_value,
  min_order_amount = EXCLUDED.min_order_amount,
  max_discount_amount = EXCLUDED.max_discount_amount,
  is_active = TRUE,
  is_development_fixture = TRUE;
