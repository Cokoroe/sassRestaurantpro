-- =====================================================================
-- V51__payroll_details_add_outlet_id.sql
-- Add outlet_id to payroll_details for easier querying & unique constraint
-- =====================================================================

ALTER TABLE IF EXISTS public.payroll_details
  ADD COLUMN IF NOT EXISTS outlet_id uuid;

-- Backfill outlet_id from payroll_periods
UPDATE public.payroll_details d
SET outlet_id = p.outlet_id
FROM public.payroll_periods p
WHERE d.payroll_period_id = p.id
  AND d.outlet_id IS NULL;

-- Make it NOT NULL after backfill (safe if periods exist)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public'
      AND table_name='payroll_details'
      AND column_name='outlet_id'
  ) THEN
    -- only set NOT NULL if no nulls remain
    IF NOT EXISTS (SELECT 1 FROM public.payroll_details WHERE outlet_id IS NULL) THEN
      EXECUTE 'ALTER TABLE public.payroll_details ALTER COLUMN outlet_id SET NOT NULL';
    END IF;
  END IF;
END $$;

-- Helpful indexes
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'ix_payroll_details_period') THEN
    EXECUTE 'CREATE INDEX ix_payroll_details_period ON public.payroll_details(payroll_period_id)';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'ix_payroll_details_staff') THEN
    EXECUTE 'CREATE INDEX ix_payroll_details_staff ON public.payroll_details(staff_id)';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'ix_payroll_details_outlet') THEN
    EXECUTE 'CREATE INDEX ix_payroll_details_outlet ON public.payroll_details(outlet_id)';
  END IF;
END $$;

-- Unique: one staff has one detail per period (per tenant)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname='public'
      AND c.relname='ux_payroll_details_period_staff'
  ) THEN
    EXECUTE 'CREATE UNIQUE INDEX ux_payroll_details_period_staff
             ON public.payroll_details(tenant_id, payroll_period_id, staff_id)';
  END IF;
END $$;
