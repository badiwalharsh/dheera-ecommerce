-- ==============================================================================
-- DHEERA — Migration: Admin Security & Database Boundary Hardening
-- Phase 6.1: Admin Security, Database Integrity & Storefront Integration Audit
-- ==============================================================================

-- 1. HARDEN STORE SETTINGS: Strictly restrict mutations to Super Admins only
DO $$ BEGIN
  DROP POLICY IF EXISTS "Admins manage store settings" ON public.store_settings;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

CREATE POLICY "Super Admins manage store settings" ON public.store_settings
  FOR ALL
  TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- 2. HARDEN AUDIT LOGS: Enforce strictly append-only ledger (No updates or deletes)
REVOKE UPDATE, DELETE, TRUNCATE ON public.audit_logs FROM PUBLIC, anon, authenticated;

-- Ensure audit logs can only be inserted by authenticated admins
DO $$ BEGIN
  DROP POLICY IF EXISTS "Admins can insert audit logs" ON public.audit_logs;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

CREATE POLICY "Admins can insert audit logs" ON public.audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- 3. FUNCTION PRIVILEGE REVOCATIONS (Defense-in-depth)
REVOKE EXECUTE ON FUNCTION public.adjust_inventory_atomic(UUID, INT, TEXT, TEXT, UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.adjust_inventory_atomic(UUID, INT, TEXT, TEXT, UUID, TEXT) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.is_super_admin() FROM anon;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;

-- 4. STORAGE BUCKET RLS POLICIES FOR PRODUCTS AND CUSTOMIZATIONS
-- Products bucket: Public read, Admin write
DO $$ BEGIN
  CREATE POLICY "Public read product images" ON storage.objects
    FOR SELECT
    USING (bucket_id = 'products');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admins upload product images" ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'products' AND public.is_admin());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admins delete product images" ON storage.objects
    FOR DELETE
    TO authenticated
    USING (bucket_id = 'products' AND public.is_admin());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Customizations bucket: Private (Patron owner or Admin only)
DO $$ BEGIN
  CREATE POLICY "Patron or admin read customizations" ON storage.objects
    FOR SELECT
    TO authenticated
    USING (
      bucket_id = 'customizations' AND
      (auth.uid() = owner OR public.is_admin())
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Patron or admin upload customizations" ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'customizations' AND
      (auth.uid() = owner OR public.is_admin())
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

