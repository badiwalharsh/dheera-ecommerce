-- ==============================================================================
-- DHEERA — Migration: Phase 5.1 Customer Account Security Hardening
-- ==============================================================================

-- 1. CRITICAL GUEST-ORDER ASSOCIATION FUNCTION HARDENING
-- Drop vulnerable parameter-based functions that accept client-supplied user ID or email
DROP FUNCTION IF EXISTS public.associate_guest_orders(UUID, TEXT);
DROP FUNCTION IF EXISTS public.associate_guest_orders();
DROP FUNCTION IF EXISTS public.associate_guest_orders_admin(UUID);

-- Hardened parameterless function deriving identity strictly from auth.uid() and verified email
CREATE OR REPLACE FUNCTION public.associate_guest_orders()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_user_id UUID;
  v_email TEXT;
  v_confirmed_at TIMESTAMPTZ;
  v_count INT := 0;
BEGIN
  -- 1. Derive authenticated caller identity
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Caller must be an authenticated patron'
      USING ERRCODE = '28000';
  END IF;

  -- 2. Obtain verified email and confirmation timestamp directly from auth.users
  SELECT LOWER(email), email_confirmed_at
  INTO v_email, v_confirmed_at
  FROM auth.users
  WHERE id = v_user_id;

  IF v_email IS NULL THEN
    RAISE EXCEPTION 'Invalid patron account: No email found'
      USING ERRCODE = 'P0002';
  END IF;

  -- 3. Verify email is confirmed before associating any guest orders
  IF v_confirmed_at IS NULL THEN
    RAISE EXCEPTION 'Unverified email: Customer email must be confirmed before claiming guest orders'
      USING ERRCODE = '42501';
  END IF;

  -- 4. Atomically claim guest orders belonging to this verified email
  -- Only update orders where user_id IS NULL (never re-associate another user's order)
  UPDATE public.orders
  SET user_id = v_user_id,
      updated_at = NOW()
  WHERE LOWER(email) = v_email
    AND user_id IS NULL;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- Secure administrative overload allowing admin/service_role workflows
CREATE OR REPLACE FUNCTION public.associate_guest_orders_admin(
  p_target_user_id UUID
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_email TEXT;
  v_confirmed_at TIMESTAMPTZ;
  v_count INT := 0;
BEGIN
  -- Only admins can execute this administrative workflow
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Forbidden: Administrator privileges required'
      USING ERRCODE = '42501';
  END IF;

  -- Verify target user exists and has confirmed email
  SELECT LOWER(email), email_confirmed_at
  INTO v_email, v_confirmed_at
  FROM auth.users
  WHERE id = p_target_user_id;

  IF v_email IS NULL OR v_confirmed_at IS NULL THEN
    RAISE EXCEPTION 'Invalid target user: user does not exist or email is unconfirmed'
      USING ERRCODE = 'P0002';
  END IF;

  UPDATE public.orders
  SET user_id = p_target_user_id,
      updated_at = NOW()
  WHERE LOWER(email) = v_email
    AND user_id IS NULL;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- Enforce strict function execution permissions
REVOKE ALL ON FUNCTION public.associate_guest_orders() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.associate_guest_orders() FROM anon;
GRANT EXECUTE ON FUNCTION public.associate_guest_orders() TO authenticated;
GRANT EXECUTE ON FUNCTION public.associate_guest_orders() TO service_role;

REVOKE ALL ON FUNCTION public.associate_guest_orders_admin(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.associate_guest_orders_admin(UUID) FROM anon;
REVOKE ALL ON FUNCTION public.associate_guest_orders_admin(UUID) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.associate_guest_orders_admin(UUID) TO service_role;

-- 2. ADDRESS SECURITY & ATOMIC DEFAULT SWITCHING
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Addresses viewable by owner" ON public.addresses;
  DROP POLICY IF EXISTS "Addresses viewable by owner or admin" ON public.addresses;
  CREATE POLICY "Addresses viewable by owner or admin" ON public.addresses
    FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

  DROP POLICY IF EXISTS "Addresses insertable by owner" ON public.addresses;
  CREATE POLICY "Addresses insertable by owner" ON public.addresses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

  DROP POLICY IF EXISTS "Addresses updatable by owner" ON public.addresses;
  CREATE POLICY "Addresses updatable by owner" ON public.addresses
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

  DROP POLICY IF EXISTS "Addresses deletable by owner" ON public.addresses;
  CREATE POLICY "Addresses deletable by owner" ON public.addresses
    FOR DELETE USING (auth.uid() = user_id OR public.is_admin());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Atomic default address trigger: unsets all other defaults for the user
CREATE OR REPLACE FUNCTION public.handle_address_default_atomicity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.is_default = TRUE THEN
    UPDATE public.addresses
    SET is_default = FALSE,
        updated_at = NOW()
    WHERE user_id = NEW.user_id
      AND id != NEW.id
      AND is_default = TRUE;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_address_default_atomicity ON public.addresses;
CREATE TRIGGER trg_address_default_atomicity
  BEFORE INSERT OR UPDATE OF is_default
  ON public.addresses
  FOR EACH ROW
  WHEN (NEW.is_default = TRUE)
  EXECUTE FUNCTION public.handle_address_default_atomicity();

-- 3. WISHLIST RLS POLICIES (OWNERSHIP & CASCADE INTEGRITY)
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  -- Wishlists
  DROP POLICY IF EXISTS "Wishlists accessible by owner" ON public.wishlists;
  DROP POLICY IF EXISTS "Wishlists select owner" ON public.wishlists;
  CREATE POLICY "Wishlists select owner" ON public.wishlists
    FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

  DROP POLICY IF EXISTS "Wishlists insert owner" ON public.wishlists;
  CREATE POLICY "Wishlists insert owner" ON public.wishlists
    FOR INSERT WITH CHECK (auth.uid() = user_id);

  DROP POLICY IF EXISTS "Wishlists update owner" ON public.wishlists;
  CREATE POLICY "Wishlists update owner" ON public.wishlists
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

  DROP POLICY IF EXISTS "Wishlists delete owner" ON public.wishlists;
  CREATE POLICY "Wishlists delete owner" ON public.wishlists
    FOR DELETE USING (auth.uid() = user_id OR public.is_admin());

  -- Wishlist Items
  DROP POLICY IF EXISTS "Wishlist items accessible by owner" ON public.wishlist_items;
  DROP POLICY IF EXISTS "Wishlist items accessible by wishlist owner" ON public.wishlist_items;
  DROP POLICY IF EXISTS "Wishlist items select owner" ON public.wishlist_items;
  CREATE POLICY "Wishlist items select owner" ON public.wishlist_items
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM public.wishlists w
        WHERE w.id = wishlist_items.wishlist_id
          AND (w.user_id = auth.uid() OR public.is_admin())
      )
    );

  DROP POLICY IF EXISTS "Wishlist items insert owner" ON public.wishlist_items;
  CREATE POLICY "Wishlist items insert owner" ON public.wishlist_items
    FOR INSERT WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.wishlists w
        WHERE w.id = wishlist_items.wishlist_id
          AND w.user_id = auth.uid()
      )
    );

  DROP POLICY IF EXISTS "Wishlist items update owner" ON public.wishlist_items;
  CREATE POLICY "Wishlist items update owner" ON public.wishlist_items
    FOR UPDATE USING (
      EXISTS (
        SELECT 1 FROM public.wishlists w
        WHERE w.id = wishlist_items.wishlist_id
          AND w.user_id = auth.uid()
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.wishlists w
        WHERE w.id = wishlist_items.wishlist_id
          AND w.user_id = auth.uid()
      )
    );

  DROP POLICY IF EXISTS "Wishlist items delete owner" ON public.wishlist_items;
  CREATE POLICY "Wishlist items delete owner" ON public.wishlist_items
    FOR DELETE USING (
      EXISTS (
        SELECT 1 FROM public.wishlists w
        WHERE w.id = wishlist_items.wishlist_id
          AND (w.user_id = auth.uid() OR public.is_admin())
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 4. ORDERS IMMUTABILITY FOR CUSTOMERS
-- Verify customers cannot update orders or tamper with order status
DO $$ BEGIN
  DROP POLICY IF EXISTS "Customers cannot update orders" ON public.orders;
  -- Notice: No UPDATE policy is granted to customers on public.orders.
  -- Only public.is_admin() has UPDATE privileges on public.orders.
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
