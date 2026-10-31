-- ==============================================================================
-- DHEERA — Migration: Admin Management, RBAC, Inventory Movements, CMS & Settings
-- Phase 6: Complete Admin Dashboard & Business Management System
-- ==============================================================================

-- 1. ADMIN ROLES ENUM
DO $$ BEGIN
  CREATE TYPE admin_role AS ENUM ('super_admin', 'store_manager');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. ADD ADMIN_ROLE TO PROFILES (Defaults to NULL for standard customers)
DO $$ BEGIN
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS admin_role admin_role;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- 3. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  admin_email TEXT NOT NULL,
  admin_role TEXT NOT NULL DEFAULT 'store_manager',
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_admin ON public.audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON public.audit_logs(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- 4. INVENTORY STOCK MOVEMENTS TABLE
CREATE TABLE IF NOT EXISTS public.inventory_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
  previous_quantity INT NOT NULL,
  new_quantity INT NOT NULL,
  change_amount INT NOT NULL,
  movement_type TEXT NOT NULL, -- 'restock', 'correction', 'order_deduction', 'order_cancellation', 'damage'
  reason TEXT NOT NULL,
  adjusted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  adjusted_by_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventory_movements_variant ON public.inventory_movements(variant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_created ON public.inventory_movements(created_at DESC);

-- 5. STORE CONTENT (CMS) TABLE
CREATE TABLE IF NOT EXISTS public.store_content (
  id TEXT PRIMARY KEY DEFAULT 'homepage',
  hero_heading TEXT NOT NULL DEFAULT 'Timeless Styles, Yours Truly.',
  hero_description TEXT NOT NULL DEFAULT 'Handcrafted apparel inspired by Indian traditions, designed for the modern you.',
  hero_image_url TEXT NOT NULL DEFAULT '/images/banners/hero-editorial.jpg',
  hero_cta_text TEXT NOT NULL DEFAULT 'EXPLORE COLLECTIONS',
  hero_cta_link TEXT NOT NULL DEFAULT '/collections',
  promotional_banner_active BOOLEAN NOT NULL DEFAULT TRUE,
  promotional_banner_text TEXT NOT NULL DEFAULT 'Complimentary Pan-India Express Shipping on Orders Above ₹5,000',
  brand_story_heading TEXT NOT NULL DEFAULT 'Rooted in Heritage. Made for Today.',
  brand_story_body TEXT NOT NULL DEFAULT 'At DHEERA, we celebrate the rich legacy of Indian handloom and artisanal craftsmanship.',
  newsletter_heading TEXT NOT NULL DEFAULT 'A Little DHEERA in Your Inbox.',
  newsletter_text TEXT NOT NULL DEFAULT 'Receive private invitations to new collection launches, artisanal stories, and bespoke previews.',
  featured_product_ids JSONB DEFAULT '[]'::jsonb,
  category_cards JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 6. STORE SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.store_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  store_name TEXT NOT NULL DEFAULT 'DHEERA — Apparel & Lifestyle',
  logo_url TEXT NOT NULL DEFAULT '/images/brand/logo.png',
  business_email TEXT NOT NULL DEFAULT 'contact@dheera.in',
  contact_number TEXT NOT NULL DEFAULT '+91 98765 43210',
  instagram_url TEXT NOT NULL DEFAULT 'https://instagram.com/dheera_india',
  currency TEXT NOT NULL DEFAULT 'INR',
  currency_symbol TEXT NOT NULL DEFAULT '₹',
  shipping_base_fee NUMERIC(10, 2) NOT NULL DEFAULT 150.00,
  free_shipping_threshold NUMERIC(10, 2) NOT NULL DEFAULT 5000.00,
  tax_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
  return_policy TEXT NOT NULL DEFAULT 'Handcrafted garments are eligible for size exchange within 7 days of delivery in unworn condition.',
  privacy_policy TEXT NOT NULL DEFAULT 'DHEERA respects your privacy. We never sell your personal contact information to third parties.',
  terms_conditions TEXT NOT NULL DEFAULT 'All designs and photographs are exclusive intellectual property of DHEERA — Apparel & Lifestyle.',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 7. INITIALIZE DEFAULT CMS & SETTINGS IF NOT EXIST
INSERT INTO public.store_content (id) VALUES ('homepage') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.store_settings (id) VALUES ('default') ON CONFLICT (id) DO NOTHING;

-- 8. SECURITY FUNCTIONS WITH FIXED SEARCH_PATH
-- Check if caller is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND (role = 'admin' AND admin_role = 'super_admin')
  );
END;
$$;

-- Check if caller is any admin (super_admin or store_manager)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND (role = 'admin' OR admin_role IS NOT NULL)
  );
END;
$$;

-- 9. ATOMIC INVENTORY ADJUSTMENT PROCEDURE
CREATE OR REPLACE FUNCTION public.adjust_inventory_atomic(
  p_variant_id UUID,
  p_change_amount INT,
  p_movement_type TEXT,
  p_reason TEXT,
  p_admin_id UUID,
  p_admin_email TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_current_stock INT;
  v_new_stock INT;
BEGIN
  -- Verify caller is authorized admin
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'UNAUTHORIZED: Only authorized administrators may adjust inventory.'
      USING ERRCODE = '42501';
  END IF;

  -- Lock row for update
  SELECT quantity_available INTO v_current_stock
  FROM public.inventory
  WHERE variant_id = p_variant_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'VARIANT_NOT_FOUND: Variant % does not exist in inventory.', p_variant_id;
  END IF;

  v_new_stock := v_current_stock + p_change_amount;

  IF v_new_stock < 0 THEN
    RAISE EXCEPTION 'NEGATIVE_STOCK_PREVENTED: Cannot adjust stock below zero (current: %, change: %).', v_current_stock, p_change_amount;
  END IF;

  UPDATE public.inventory
  SET quantity_available = v_new_stock,
      updated_at = NOW()
  WHERE variant_id = p_variant_id;

  -- Record in stock movements table
  INSERT INTO public.inventory_movements (
    variant_id,
    previous_quantity,
    new_quantity,
    change_amount,
    movement_type,
    reason,
    adjusted_by,
    adjusted_by_email
  ) VALUES (
    p_variant_id,
    v_current_stock,
    v_new_stock,
    p_change_amount,
    p_movement_type,
    p_reason,
    p_admin_id,
    p_admin_email
  );

  RETURN jsonb_build_object(
    'success', true,
    'variant_id', p_variant_id,
    'previous_quantity', v_current_stock,
    'new_quantity', v_new_stock,
    'change_amount', p_change_amount
  );
END;
$$;

-- 10. ROW LEVEL SECURITY (RLS) FOR NEW TABLES
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- Audit Logs: Admin Read Only
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can insert audit logs" ON public.audit_logs
  FOR INSERT WITH CHECK (public.is_admin());

-- Inventory Movements: Admin Read & Insert
CREATE POLICY "Admins view inventory movements" ON public.inventory_movements
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins insert inventory movements" ON public.inventory_movements
  FOR INSERT WITH CHECK (public.is_admin());

-- Store Content (CMS): Public can read, Admins can write
CREATE POLICY "Public read store content" ON public.store_content
  FOR SELECT USING (TRUE);

CREATE POLICY "Admins manage store content" ON public.store_content
  FOR ALL USING (public.is_admin());

-- Store Settings: Public can read, Admins can write
CREATE POLICY "Public read store settings" ON public.store_settings
  FOR SELECT USING (TRUE);

CREATE POLICY "Admins manage store settings" ON public.store_settings
  FOR ALL USING (public.is_admin());

-- 11. STORAGE BUCKET CONFIGURATION (Conditional)
DO $$ BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('products', 'products', true)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO storage.buckets (id, name, public)
  VALUES ('customizations', 'customizations', false)
  ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

