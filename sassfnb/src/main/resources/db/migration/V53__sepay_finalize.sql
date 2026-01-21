-- V53__sepay_finalize.sql
-- Ensure indexes/uniques for SePay webhook mapping + seed settings keys

-- 1) Ensure orders.payment_code is indexed & unique (per tenant)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname='public'
      AND c.relname='ux_orders_tenant_payment_code'
  ) THEN
    EXECUTE '
      CREATE UNIQUE INDEX ux_orders_tenant_payment_code
      ON public.orders(tenant_id, payment_code)
      WHERE payment_code IS NOT NULL
    ';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname='public'
      AND c.relname='ix_orders_outlet_payment_code'
  ) THEN
    EXECUTE '
      CREATE INDEX ix_orders_outlet_payment_code
      ON public.orders(outlet_id, payment_code)
      WHERE payment_code IS NOT NULL
    ';
  END IF;
END $$;

-- 2) Ensure payments idempotency unique
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname='public'
      AND c.relname='ux_payments_provider_txn'
  ) THEN
    EXECUTE '
      CREATE UNIQUE INDEX ux_payments_provider_txn
      ON public.payments(tenant_id, provider, provider_txn_id)
      WHERE provider IS NOT NULL AND provider_txn_id IS NOT NULL
    ';
  END IF;
END $$;

-- 3) Seed settings keys for sepay (per outlet)
-- You can update values later in UI/admin.
INSERT INTO public.settings(id, tenant_id, outlet_id, key, value, created_at, updated_at)
SELECT gen_random_uuid(), s.tenant_id, s.outlet_id, 'SEPAY_WEBHOOK_SECRET', NULL, now(), now()
FROM public.settings s
WHERE NOT EXISTS (
  SELECT 1 FROM public.settings x
  WHERE x.outlet_id = s.outlet_id AND x.key = 'SEPAY_WEBHOOK_SECRET'
)
GROUP BY s.tenant_id, s.outlet_id;

INSERT INTO public.settings(id, tenant_id, outlet_id, key, value, created_at, updated_at)
SELECT gen_random_uuid(), s.tenant_id, s.outlet_id, 'SEPAY_ACC', NULL, now(), now()
FROM public.settings s
WHERE NOT EXISTS (
  SELECT 1 FROM public.settings x
  WHERE x.outlet_id = s.outlet_id AND x.key = 'SEPAY_ACC'
)
GROUP BY s.tenant_id, s.outlet_id;

INSERT INTO public.settings(id, tenant_id, outlet_id, key, value, created_at, updated_at)
SELECT gen_random_uuid(), s.tenant_id, s.outlet_id, 'SEPAY_BANK', 'MBBank', now(), now()
FROM public.settings s
WHERE NOT EXISTS (
  SELECT 1 FROM public.settings x
  WHERE x.outlet_id = s.outlet_id AND x.key = 'SEPAY_BANK'
)
GROUP BY s.tenant_id, s.outlet_id;
