-- Allow GROUP payments (order_id must be nullable)
ALTER TABLE payments
    ALTER COLUMN order_id DROP NOT NULL;

-- group_id should also be nullable because ORDER scope won't have it
ALTER TABLE payments
    ALTER COLUMN group_id DROP NOT NULL;

-- Optional: normalize scope/method/status constraints (scope is the important one)
-- Drop old check if exists (avoid duplicate)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ck_payments_scope_ref'
    ) THEN
        ALTER TABLE payments DROP CONSTRAINT ck_payments_scope_ref;
    END IF;
END $$;

-- Enforce correct reference by scope
ALTER TABLE payments
    ADD CONSTRAINT ck_payments_scope_ref
    CHECK (
        (UPPER(scope) = 'ORDER' AND order_id IS NOT NULL AND group_id IS NULL)
        OR
        (UPPER(scope) = 'GROUP' AND group_id IS NOT NULL AND order_id IS NULL)
    );
