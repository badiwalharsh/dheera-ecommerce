-- DHEERA — Phase 8.2: Authoritative Notification Queue & Worker Lease Migration
-- Enforces durable message storage, unique idempotency constraints, and safe multi-worker lease locks.

-- 1. NOTIFICATION QUEUE TABLE
CREATE TABLE IF NOT EXISTS public.notification_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key TEXT NOT NULL,
  type TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  recipient_masked TEXT NOT NULL,
  subject TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'sent', 'failed')),
  attempts INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 3,
  last_error TEXT,
  locked_at TIMESTAMPTZ,
  locked_by TEXT,
  lease_expires_at TIMESTAMPTZ,
  next_retry_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_notification_queue_idempotency UNIQUE (idempotency_key)
);

-- 2. INDEXES FOR HIGH-THROUGHPUT QUEUE POLLING & LEASE RECOVERY
CREATE INDEX IF NOT EXISTS idx_notification_queue_status_retry
  ON public.notification_queue(status, next_retry_at)
  WHERE status IN ('queued', 'failed');

CREATE INDEX IF NOT EXISTS idx_notification_queue_lease
  ON public.notification_queue(locked_by, lease_expires_at)
  WHERE status = 'processing';

-- 3. ROW-LEVEL SECURITY: STRICTLY INTERNAL SERVICE-ROLE ISOLATION
ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY;

-- Revoke all access from public, anonymous, and standard authenticated users
REVOKE ALL ON public.notification_queue FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.notification_queue TO service_role;

-- 4. ATOMIC WORKER CLAIM & LEASE FUNCTION (FOR UPDATE SKIP LOCKED)
-- Claims up to p_batch_size messages for p_worker_id for p_lease_seconds.
-- Recovers stale leases automatically where lease_expires_at < NOW().
CREATE OR REPLACE FUNCTION public.claim_queued_notifications(
  p_worker_id TEXT,
  p_batch_size INT DEFAULT 10,
  p_lease_seconds INT DEFAULT 60
)
RETURNS SETOF public.notification_queue
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  UPDATE public.notification_queue
  SET 
    status = 'processing',
    locked_by = p_worker_id,
    locked_at = NOW(),
    lease_expires_at = NOW() + (p_lease_seconds || ' seconds')::INTERVAL,
    updated_at = NOW()
  WHERE id IN (
    SELECT q.id
    FROM public.notification_queue q
    WHERE (
      (q.status = 'queued' AND q.next_retry_at <= NOW())
      OR
      (q.status = 'processing' AND q.lease_expires_at < NOW()) -- auto-recover crashed worker locks
    )
    AND q.attempts < q.max_attempts
    ORDER BY q.created_at ASC
    FOR UPDATE SKIP LOCKED
    LIMIT p_batch_size
  )
  RETURNING *;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.claim_queued_notifications(TEXT, INT, INT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_queued_notifications(TEXT, INT, INT) TO service_role;
