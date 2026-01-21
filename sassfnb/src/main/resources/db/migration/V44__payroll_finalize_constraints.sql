-- =====================================================================
-- V44__payroll_finalize_constraints.sql
-- FIX: no invalid DEFAULT; fix DO block quoting; totals & triggers
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1) order_items
ALTER TABLE IF EXISTS public.order_items
  ADD COLUMN IF NOT EXISTS discount_amount numeric(19,2) NOT NULL DEFAULT 0;

ALTER TABLE IF EXISTS public.order_items
  ADD COLUMN IF NOT EXISTS total_amount numeric(19,2) NOT NULL DEFAULT 0;

ALTER TABLE IF EXISTS public.order_items
  ALTER COLUMN unit_price TYPE numeric(19,2)
  USING unit_price::numeric(19,2);

ALTER TABLE IF EXISTS public.order_items
  ALTER COLUMN discount_amount TYPE numeric(19,2)
  USING discount_amount::numeric(19,2);

ALTER TABLE IF EXISTS public.order_items
  ALTER COLUMN total_amount TYPE numeric(19,2)
  USING total_amount::numeric(19,2);

ALTER TABLE IF EXISTS public.order_items
  ALTER COLUMN created_at SET DEFAULT now();

ALTER TABLE IF EXISTS public.order_items
  ALTER COLUMN updated_at SET DEFAULT now();

UPDATE public.order_items SET created_at = now() WHERE created_at IS NULL;
UPDATE public.order_items SET updated_at = now() WHERE updated_at IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ck_order_items_quantity_nonneg') THEN
    EXECUTE 'ALTER TABLE public.order_items ADD CONSTRAINT ck_order_items_quantity_nonneg CHECK (quantity >= 0)';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ck_order_items_unit_price_nonneg') THEN
    EXECUTE 'ALTER TABLE public.order_items ADD CONSTRAINT ck_order_items_unit_price_nonneg CHECK (unit_price >= 0)';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ck_order_items_discount_nonneg') THEN
    EXECUTE 'ALTER TABLE public.order_items ADD CONSTRAINT ck_order_items_discount_nonneg CHECK (discount_amount >= 0)';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ck_order_items_total_nonneg') THEN
    EXECUTE 'ALTER TABLE public.order_items ADD CONSTRAINT ck_order_items_total_nonneg CHECK (total_amount >= 0)';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'ix_order_items_order_id') THEN
    EXECUTE 'CREATE INDEX ix_order_items_order_id ON public.order_items(order_id)';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'ix_order_items_tenant_id') THEN
    EXECUTE 'CREATE INDEX ix_order_items_tenant_id ON public.order_items(tenant_id)';
  END IF;
END $$;

-- 2) order_discounts
ALTER TABLE IF EXISTS public.order_discounts
  ADD COLUMN IF NOT EXISTS type varchar(50);

ALTER TABLE IF EXISTS public.order_discounts
  ADD COLUMN IF NOT EXISTS value numeric(19,2);

ALTER TABLE IF EXISTS public.order_discounts
  ALTER COLUMN value TYPE numeric(19,2)
  USING value::numeric(19,2);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ck_order_discounts_value_nonneg') THEN
    EXECUTE 'ALTER TABLE public.order_discounts ADD CONSTRAINT ck_order_discounts_value_nonneg CHECK (COALESCE(value,0) >= 0)';
  END IF;

  -- ✅ FIX QUOTING HERE
  IF NOT EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'ux_order_discounts_order'
  ) THEN
    EXECUTE 'CREATE UNIQUE INDEX ux_order_discounts_order ON public.order_discounts(order_id, type)';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'ix_order_discounts_order_id') THEN
    EXECUTE 'CREATE INDEX ix_order_discounts_order_id ON public.order_discounts(order_id)';
  END IF;
END $$;

-- 3) payments
ALTER TABLE IF EXISTS public.payments
  ADD COLUMN IF NOT EXISTS tenant_id uuid,
  ADD COLUMN IF NOT EXISTS outlet_id uuid,
  ADD COLUMN IF NOT EXISTS scope varchar(50),
  ADD COLUMN IF NOT EXISTS order_id uuid,
  ADD COLUMN IF NOT EXISTS group_id uuid,
  ADD COLUMN IF NOT EXISTS method varchar(50),
  ADD COLUMN IF NOT EXISTS status varchar(50),
  ADD COLUMN IF NOT EXISTS amount numeric(19,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS received_at timestamptz,
  ADD COLUMN IF NOT EXISTS confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE IF EXISTS public.payments
  ALTER COLUMN amount TYPE numeric(19,2)
  USING amount::numeric(19,2);

UPDATE public.payments SET created_at = now() WHERE created_at IS NULL;
UPDATE public.payments SET updated_at = now() WHERE updated_at IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ck_payments_amount_nonneg') THEN
    EXECUTE 'ALTER TABLE public.payments ADD CONSTRAINT ck_payments_amount_nonneg CHECK (amount >= 0)';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'ix_payments_order_id') THEN
    EXECUTE 'CREATE INDEX ix_payments_order_id ON public.payments(order_id)';
  END IF;
END $$;

-- 4) orders totals columns
ALTER TABLE IF EXISTS public.orders
  ADD COLUMN IF NOT EXISTS subtotal_amount numeric(19,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_amount numeric(19,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_amount numeric(19,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS paid_amount numeric(19,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS balance_amount numeric(19,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

UPDATE public.orders SET updated_at = now() WHERE updated_at IS NULL;

-- 5) BEFORE trigger calc order_items.total_amount
CREATE OR REPLACE FUNCTION public.fn_order_items_calc_total_amount()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.quantity := COALESCE(NEW.quantity, 0);
  NEW.unit_price := COALESCE(NEW.unit_price, 0);
  NEW.discount_amount := COALESCE(NEW.discount_amount, 0);

  NEW.total_amount := (NEW.quantity * NEW.unit_price) - NEW.discount_amount;
  IF NEW.total_amount < 0 THEN
    NEW.total_amount := 0;
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_order_items_calc_total_amount ON public.order_items;
CREATE TRIGGER trg_order_items_calc_total_amount
BEFORE INSERT OR UPDATE OF quantity, unit_price, discount_amount
ON public.order_items
FOR EACH ROW
EXECUTE FUNCTION public.fn_order_items_calc_total_amount();

-- 6) recalc order totals
CREATE OR REPLACE FUNCTION public.fn_recalc_order_totals(p_order_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_subtotal numeric(19,2);
  v_disc     numeric(19,2);
  v_total    numeric(19,2);
  v_paid     numeric(19,2);
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

  UPDATE public.orders
  SET
    subtotal_amount = v_subtotal,
    discount_amount = v_disc,
    total_amount    = v_total,
    paid_amount     = v_paid,
    balance_amount  = GREATEST(v_total - v_paid, 0),
    updated_at      = now()
  WHERE id = p_order_id;
END $$;

-- 7) AFTER triggers refresh totals
CREATE OR REPLACE FUNCTION public.fn_trg_refresh_order_totals()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM public.fn_recalc_order_totals(COALESCE(NEW.order_id, OLD.order_id));
  RETURN NULL;
END $$;

DROP TRIGGER IF EXISTS trg_order_items_refresh_totals ON public.order_items;
CREATE TRIGGER trg_order_items_refresh_totals
AFTER INSERT OR UPDATE OR DELETE
ON public.order_items
FOR EACH ROW
EXECUTE FUNCTION public.fn_trg_refresh_order_totals();

DROP TRIGGER IF EXISTS trg_order_discounts_refresh_totals ON public.order_discounts;
CREATE TRIGGER trg_order_discounts_refresh_totals
AFTER INSERT OR UPDATE OR DELETE
ON public.order_discounts
FOR EACH ROW
EXECUTE FUNCTION public.fn_trg_refresh_order_totals();

DROP TRIGGER IF EXISTS trg_payments_refresh_totals ON public.payments;
CREATE TRIGGER trg_payments_refresh_totals
AFTER INSERT OR UPDATE OR DELETE
ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.fn_trg_refresh_order_totals();
