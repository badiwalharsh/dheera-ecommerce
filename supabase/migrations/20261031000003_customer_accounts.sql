-- ==============================================================================
-- DHEERA — Migration: Customer Accounts, Address Book & Guest Order Association
-- Phase 5: Customer Accounts & Personal Dashboard
-- ==============================================================================

-- 1. SECURE GUEST-TO-CUSTOMER ORDER ASSOCIATION FUNCTION
-- Atomically associates historical guest orders matching verified customer email
CREATE OR REPLACE FUNCTION public.associate_guest_orders(
  p_user_id UUID,
  p_email TEXT
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_count INT;
BEGIN
  -- Only associate orders where user_id is currently NULL and email matches exactly
  UPDATE public.orders
  SET user_id = p_user_id,
      updated_at = NOW()
  WHERE LOWER(email) = LOWER(p_email)
    AND user_id IS NULL;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- 2. ENSURE RLS POLICIES FOR CUSTOMER ADDRESSES
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Addresses viewable by owner" ON public.addresses;
  CREATE POLICY "Addresses viewable by owner" ON public.addresses
    FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

  DROP POLICY IF EXISTS "Addresses insertable by owner" ON public.addresses;
  CREATE POLICY "Addresses insertable by owner" ON public.addresses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

  DROP POLICY IF EXISTS "Addresses updatable by owner" ON public.addresses;
  CREATE POLICY "Addresses updatable by owner" ON public.addresses
    FOR UPDATE USING (auth.uid() = user_id);

  DROP POLICY IF EXISTS "Addresses deletable by owner" ON public.addresses;
  CREATE POLICY "Addresses deletable by owner" ON public.addresses
    FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 3. ENSURE RLS POLICIES FOR CUSTOMER WISHLISTS
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Wishlists accessible by owner" ON public.wishlists;
  CREATE POLICY "Wishlists accessible by owner" ON public.wishlists
    FOR ALL USING (auth.uid() = user_id OR public.is_admin());

  DROP POLICY IF EXISTS "Wishlist items accessible by owner" ON public.wishlist_items;
  CREATE POLICY "Wishlist items accessible by owner" ON public.wishlist_items
    FOR ALL USING (
      EXISTS (
        SELECT 1 FROM public.wishlists
        WHERE wishlists.id = wishlist_items.wishlist_id
          AND (wishlists.user_id = auth.uid() OR public.is_admin())
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

