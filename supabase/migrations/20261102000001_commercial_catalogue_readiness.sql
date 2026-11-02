-- ==============================================================================
-- DHEERA — Migration: Commercial Catalogue Readiness & Product Lifecycle
-- Date: 2026-11-02
-- Purpose:
--   1. Add publication status ('draft', 'published', 'archived') to products
--   2. Add commercial attributes: tax_rate_percent, availability_status, garment_type,
--      craftsmanship, fit_info, size_guide, and is_prototype flag
--   3. Enforce public catalogue isolation: customers can only view 'published' items
-- ==============================================================================

-- 1. ADD COLUMNS WITH SAFE DEFAULTS TO PRODUCTS TABLE
ALTER TABLE public.products 
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  ADD COLUMN IF NOT EXISTS availability_status TEXT NOT NULL DEFAULT 'in_stock' CHECK (availability_status IN ('in_stock', 'made_to_order', 'pre_order', 'out_of_stock')),
  ADD COLUMN IF NOT EXISTS tax_rate_percent NUMERIC(5, 2) DEFAULT 12.00 CHECK (tax_rate_percent >= 0),
  ADD COLUMN IF NOT EXISTS garment_type TEXT,
  ADD COLUMN IF NOT EXISTS craftsmanship TEXT,
  ADD COLUMN IF NOT EXISTS fit_info TEXT,
  ADD COLUMN IF NOT EXISTS size_guide TEXT,
  ADD COLUMN IF NOT EXISTS is_prototype BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. CREATE PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_products_status_active ON public.products(status, is_active);
CREATE INDEX IF NOT EXISTS idx_products_availability ON public.products(availability_status);
CREATE INDEX IF NOT EXISTS idx_products_prototype ON public.products(is_prototype);

-- 3. UPDATE ROW LEVEL SECURITY (RLS) FOR PUBLIC ACCESS
-- Public users (anon & customer) may ONLY select published and active garments
DROP POLICY IF EXISTS "Public can view active products" ON public.products;
CREATE POLICY "Public can view published active products" 
  ON public.products 
  FOR SELECT 
  TO anon, authenticated
  USING (
    status = 'published' AND is_active = TRUE
  );

-- Admins retain full visibility and management across draft, published, and archived garments
DROP POLICY IF EXISTS "Admins have full access to products" ON public.products;
CREATE POLICY "Admins have full access to products"
  ON public.products
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'staff')
    )
  );

COMMENT ON COLUMN public.products.status IS 'Lifecycle status: draft (private), published (storefront live), archived (hidden historical)';
COMMENT ON COLUMN public.products.is_prototype IS 'Flag indicating developmental prototype concept versus authenticated commercial inventory';

