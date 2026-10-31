-- ==============================================================================
-- DHEERA — Migration: Payment Security, Webhook Idempotency & Inventory Integrity
-- Phase 4.1: Payment Security & Transaction Integrity Audit
-- ==============================================================================

-- 1. WEBHOOK EVENTS TABLE (With Unique Constraint for Idempotency)
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  gateway TEXT NOT NULL DEFAULT 'razorpay',
  payload JSONB NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_id ON public.webhook_events(event_id);

-- RLS on Webhook Events: Strictly internal / admin only
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin manage webhook events" ON public.webhook_events
  FOR ALL USING (public.is_admin());

-- 2. ADD ACCESS_TOKEN & INTEGRITY COLUMNS TO ORDERS TABLE
DO $$ BEGIN
  ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS access_token TEXT;
  ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_verified_at TIMESTAMPTZ;
  ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS inventory_deducted BOOLEAN NOT NULL DEFAULT FALSE;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_access_token ON public.orders(access_token) WHERE access_token IS NOT NULL;

-- 3. UNIQUE PAYMENT GATEWAY CONSTRAINT (Prevents duplicate payment records for same gateway payment)
DO $$ BEGIN
  ALTER TABLE public.payments ADD CONSTRAINT uq_payment_gateway_ids UNIQUE (gateway_order_id, gateway_payment_id);
EXCEPTION WHEN duplicate_object THEN NULL;
          WHEN duplicate_table THEN NULL;
END $$;

-- 4. ATOMIC INVENTORY DEDUCTION PROCEDURE
-- Locks rows with FOR UPDATE to prevent race conditions during concurrent checkouts
CREATE OR REPLACE FUNCTION public.deduct_inventory_atomic(p_items JSONB)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_item JSONB;
  v_variant_id UUID;
  v_qty INT;
  v_avail INT;
BEGIN
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_variant_id := (v_item->>'variant_id')::UUID;
    v_qty := (v_item->>'quantity')::INT;

    -- Lock row for update
    SELECT quantity_available INTO v_avail
    FROM public.inventory
    WHERE variant_id = v_variant_id
    FOR UPDATE;

    IF NOT FOUND THEN
      -- If variant record is absent, continue
      CONTINUE;
    END IF;

    IF v_avail < v_qty THEN
      RAISE EXCEPTION 'INSUFFICIENT_STOCK: Variant % has % units available, requested %', v_variant_id, v_avail, v_qty;
    END IF;

    UPDATE public.inventory
    SET quantity_available = quantity_available - v_qty,
        updated_at = NOW()
    WHERE variant_id = v_variant_id;
  END LOOP;

  RETURN TRUE;
END;
$$;

