-- payments: add columns for sepay webhook & idempotency
ALTER TABLE payments
    ADD COLUMN IF NOT EXISTS provider           VARCHAR(30),
    ADD COLUMN IF NOT EXISTS provider_txn_id    VARCHAR(80),
    ADD COLUMN IF NOT EXISTS raw_payload        TEXT,
    ADD COLUMN IF NOT EXISTS confirmed_at       TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS expires_at         TIMESTAMPTZ;

-- Ensure payment_code exists (if bạn đã có rồi thì không sao)
ALTER TABLE payments
    ADD COLUMN IF NOT EXISTS payment_code       VARCHAR(40);

-- Unique payment_code per tenant (optional but recommended)
CREATE UNIQUE INDEX IF NOT EXISTS ux_payments_tenant_payment_code
    ON payments(tenant_id, payment_code)
    WHERE payment_code IS NOT NULL;

-- Idempotency: same provider txn should not confirm twice
CREATE UNIQUE INDEX IF NOT EXISTS ux_payments_provider_txn
    ON payments(tenant_id, provider, provider_txn_id)
    WHERE provider IS NOT NULL AND provider_txn_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_payments_scope_order
    ON payments(tenant_id, order_id);

CREATE INDEX IF NOT EXISTS idx_payments_scope_group
    ON payments(tenant_id, group_id);

CREATE INDEX IF NOT EXISTS idx_payments_status
    ON payments(status);
