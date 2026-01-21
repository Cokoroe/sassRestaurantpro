-- V52__sepay_order_payment_code_and_auto_paid.sql
-- Mục tiêu:
-- 1) orders.payment_code: map DHxxxx -> order
-- 2) auto set orders.status=PAID when balance_amount = 0 (after totals recalculated)

-- 1) Add payment_code to orders (for sepay QR & webhook mapping)
ALTER TABLE IF EXISTS public.orders
  ADD COLUMN IF NOT EXISTS payment_code varchar(40);

-- Unique per tenant (DHxxxx should be unique within tenant)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'ux_orders_tenant_payment_code'
  ) THEN
    EXECUTE '
      CREATE UNIQUE INDEX ux_orders_tenant_payment_code
      ON public.orders(tenant_id, payment_code)
      WHERE payment_code IS NOT NULL
    ';
  END IF;
END $$;

-- Helpful lookup index by outlet + code (webhook path contains outletId)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'ix_orders_outlet_payment_code'
  ) THEN
    EXECUTE '
      CREATE INDEX ix_orders_outlet_payment_code
      ON public.orders(outlet_id, payment_code)
      WHERE payment_code IS NOT NULL
    ';
  END IF;
END $$;

-- 2) Patch fn_recalc_order_totals to auto mark PAID when balance becomes 0
-- Keep your existing logic, just add status/closed_at auto update safely.
CREATE OR REPLACE FUNCTION public.fn_recalc_order_totals(p_order_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_subtotal numeric(19,2);
  v_disc     numeric(19,2);
  v_total    numeric(19,2);
  v_paid     numeric(19,2);
  v_balance  numeric(19,2);
BEGIN
  IF p_order_id IS NULL THEN
    RETURN;
  END IF;

  SELECT COALESCE(SUM(oi.total_amount), 0)
    INTO v_subtotal
  FROM public.order_items oi
  WHERE oi.order_id = p_order_id;

  SELECT COALESCE(SUM(od.value), 0)
    INTO v_disc
  FROM public.order_discounts od
  WHERE od.order_id = p_order_id;

  SELECT COALESCE(SUM(p.amount), 0)
    INTO v_paid
  FROM public.payments p
  WHERE p.order_id = p_order_id
    AND COALESCE(p.status, '') IN ('CONFIRMED','PAID','SUCCESS');

  v_total := GREATEST(v_subtotal - v_disc, 0);
  v_balance := GREATEST(v_total - v_paid, 0);

  UPDATE public.orders
  SET
    subtotal_amount = v_subtotal,
    discount_amount = v_disc,
    total_amount    = v_total,
    paid_amount     = v_paid,
    balance_amount  = v_balance,

    -- Auto mark PAID when fully paid
    status = CASE
      WHEN v_balance <= 0
           AND COALESCE(status, '') NOT IN ('CANCELLED') THEN 'PAID'
      ELSE status
    END,

    -- Auto set closed_at the first time it becomes PAID
    closed_at = CASE
      WHEN v_balance <= 0
           AND COALESCE(status, '') NOT IN ('CANCELLED')
           THEN COALESCE(closed_at, now())
      ELSE closed_at
    END,

    updated_at      = now()
  WHERE id = p_order_id;
END $$;

-- NOTE:
-- triggers already call fn_recalc_order_totals after payments insert/update/delete
-- so once webhook inserts a CONFIRMED payment -> paid/balance/status will update automatically.
