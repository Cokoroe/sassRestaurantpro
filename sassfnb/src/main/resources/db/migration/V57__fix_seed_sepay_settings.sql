-- V57__fix_seed_sepay_settings.sql
-- Ensure unique (outlet_id, key) and seed SePay keys WITHOUT relying on outlets.tenant_id
-- Fix: do NOT use max(uuid)

-- 1) ensure unique index for upsert
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM   pg_indexes
        WHERE  schemaname = 'public'
        AND    indexname  = 'uq_settings_outlet_key'
    ) THEN
        CREATE UNIQUE INDEX uq_settings_outlet_key ON public.settings (outlet_id, key);
    END IF;
END$$;

-- 2) Pick 1 tenant_id per outlet from existing settings rows
-- Prefer newest row if created_at exists; otherwise any row.
WITH outlet_ctx AS (
    SELECT DISTINCT ON (s.outlet_id)
           s.outlet_id,
           s.tenant_id
    FROM public.settings s
    WHERE s.outlet_id IS NOT NULL
      AND s.tenant_id IS NOT NULL
    ORDER BY s.outlet_id, s.created_at DESC NULLS LAST
)

-- 3) Seed 3 keys per outlet, safe-upsert (do not override real values)
INSERT INTO public.settings (id, tenant_id, outlet_id, key, value, created_at, updated_at)
SELECT
    gen_random_uuid(),
    oc.tenant_id,
    oc.outlet_id,
    x.key,
    x.default_value,
    now(),
    now()
FROM outlet_ctx oc
CROSS JOIN (
    VALUES
      ('SEPAY_WEBHOOK_SECRET', 'CHANGE_ME_SECRET'),
      ('SEPAY_ACC',            'CHANGE_ME_ACC'),
      ('SEPAY_BANK',           'CHANGE_ME_BANK')
) AS x(key, default_value)
ON CONFLICT (outlet_id, key) DO UPDATE
SET
    tenant_id  = EXCLUDED.tenant_id,
    value      = CASE
                    WHEN public.settings.value IS NULL
                      OR btrim(public.settings.value) = ''
                      OR public.settings.value ILIKE '%CHANGE_ME%'
                    THEN EXCLUDED.value
                    ELSE public.settings.value
                 END,
    updated_at = now();
