-- V37__public_qr_and_public_orders.sql
-- Purpose:
-- 1) Normalize dynamic QR (table_qr) + qr_sessions for Public QR flow
-- 2) Add fields for Public Draft Order (cart): orders.qr_session_id, orders.people, order_items.price_id, statuses

BEGIN;

-- =========================================================
-- 1) TABLE_QR (Dynamic QR) - normalize columns
-- =========================================================

-- Ensure table_qr exists (if not, create minimal structure)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name='table_qr'
  ) THEN
    CREATE TABLE public.table_qr (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      table_id    UUID NOT NULL REFERENCES public.tables(id),
      token       VARCHAR(255) NOT NULL,
      qr_code     TEXT NOT NULL,
      qr_url      TEXT NOT NULL,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
      expires_at  TIMESTAMPTZ,
      disabled_at TIMESTAMPTZ
    );
  END IF;
END $$;

-- Add missing columns (your DB may already have some)
ALTER TABLE public.table_qr
  ADD COLUMN IF NOT EXISTS token        VARCHAR(255),
  ADD COLUMN IF NOT EXISTS disabled_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS expires_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_at   TIMESTAMPTZ;

-- Backfill created_at if null
UPDATE public.table_qr
SET created_at = now()
WHERE created_at IS NULL;

-- Handle legacy column name: expired_at -> expires_at (if exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='table_qr' AND column_name='expired_at'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='table_qr' AND column_name='expires_at'
  ) THEN
    ALTER TABLE public.table_qr RENAME COLUMN expired_at TO expires_at;
  END IF;
END $$;

-- Ensure token is NOT NULL for dynamic QR rows (if you already stored token)
-- Only enforce if token column exists.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='table_qr' AND column_name='token'
  ) THEN
    -- If some old rows have null token, set token = qr_code as fallback
    UPDATE public.table_qr
    SET token = qr_code
    WHERE token IS NULL AND qr_code IS NOT NULL;

    -- Now enforce not null if safe (only if no null left)
    IF NOT EXISTS (SELECT 1 FROM public.table_qr WHERE token IS NULL) THEN
      ALTER TABLE public.table_qr ALTER COLUMN token SET NOT NULL;
    END IF;
  END IF;
END $$;

-- Indexes for table_qr
CREATE INDEX IF NOT EXISTS idx_tqr_table_id ON public.table_qr(table_id);
CREATE INDEX IF NOT EXISTS idx_tqr_token ON public.table_qr(token);

-- Optional but recommended: prevent duplicate active tokens
-- (unique only for rows not disabled)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname='public' AND indexname='ux_tqr_active_token'
  ) THEN
    EXECUTE 'CREATE UNIQUE INDEX ux_tqr_active_token ON public.table_qr(token) WHERE disabled_at IS NULL';
  END IF;
END $$;


-- =========================================================
-- 2) QR_SESSIONS - session created on public resolve
-- =========================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name='qr_sessions'
  ) THEN
    CREATE TABLE public.qr_sessions (
      id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id           UUID NOT NULL REFERENCES public.tenants(id),
      outlet_id           UUID NOT NULL REFERENCES public.outlets(id),
      table_id            UUID NOT NULL REFERENCES public.tables(id),
      device_fingerprint  VARCHAR(128),
      ip_address          VARCHAR(64),
      status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
      created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
      last_seen_at        TIMESTAMPTZ,
      expired_at          TIMESTAMPTZ,
      closed_at           TIMESTAMPTZ
    );
  END IF;
END $$;

-- Add missing columns if qr_sessions existed
ALTER TABLE public.qr_sessions
  ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS closed_at    TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_qrs_tenant ON public.qr_sessions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_qrs_outlet ON public.qr_sessions(outlet_id);
CREATE INDEX IF NOT EXISTS idx_qrs_table ON public.qr_sessions(table_id);

-- Suggested index for finding "alive session by table + fingerprint"
CREATE INDEX IF NOT EXISTS idx_qrs_table_fingerprint_alive
ON public.qr_sessions(table_id, device_fingerprint)
WHERE closed_at IS NULL;


-- =========================================================
-- 3) ORDERS - add public cart fields
-- =========================================================

-- Add qr_session_id link + people
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS qr_session_id UUID REFERENCES public.qr_sessions(id),
  ADD COLUMN IF NOT EXISTS people        INT;

-- Helpful index for lookup by session/table
CREATE INDEX IF NOT EXISTS idx_orders_qr_session ON public.orders(qr_session_id);
CREATE INDEX IF NOT EXISTS idx_orders_outlet_table_status ON public.orders(outlet_id, table_id, status);

-- Expand order status set (keep varchar, add check constraint)
-- If you already have a check constraint, you may need to drop it manually.
DO $$
DECLARE
  c_name text;
BEGIN
  SELECT conname INTO c_name
  FROM pg_constraint
  WHERE conrelid = 'public.orders'::regclass
    AND contype = 'c'
    AND conname = 'ck_orders_status';

  IF c_name IS NULL THEN
    EXECUTE $SQL$
      ALTER TABLE public.orders
      ADD CONSTRAINT ck_orders_status
      CHECK (status IN ('DRAFT','OPEN','CLOSED','CANCELLED','PAID'))
    $SQL$;
  END IF;
END $$;


-- =========================================================
-- 4) ORDER_ITEMS - support price snapshot + cart statuses
-- =========================================================

-- Add optional price_id (variant) reference
ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS price_id UUID REFERENCES public.menu_item_prices(id);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_menu_item_id ON public.order_items(menu_item_id);

-- Expand item status set for cart flow:
-- NEW (in cart), ORDERED (confirmed), FIRED (sent to kitchen), IN_KITCHEN, SERVED, CANCELLED
DO $$
DECLARE
  c_name text;
BEGIN
  SELECT conname INTO c_name
  FROM pg_constraint
  WHERE conrelid = 'public.order_items'::regclass
    AND contype = 'c'
    AND conname = 'ck_order_items_status';

  IF c_name IS NULL THEN
    EXECUTE $SQL$
      ALTER TABLE public.order_items
      ADD CONSTRAINT ck_order_items_status
      CHECK (status IN ('NEW','ORDERED','FIRED','IN_KITCHEN','SERVED','CANCELLED'))
    $SQL$;
  END IF;
END $$;

COMMIT;
