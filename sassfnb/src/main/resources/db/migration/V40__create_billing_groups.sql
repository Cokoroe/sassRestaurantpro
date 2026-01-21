-- billing_groups: gom nhiều orders để thanh toán 1 lần

CREATE TABLE IF NOT EXISTS billing_groups (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL REFERENCES tenants(id),
    outlet_id   UUID NOT NULL REFERENCES outlets(id),
    name        VARCHAR(150),
    note        TEXT,
    status      VARCHAR(20) NOT NULL DEFAULT 'OPEN', -- OPEN/PAID/CLOSED/VOIDED
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    closed_at   TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_billing_groups_outlet
    ON billing_groups(outlet_id);

CREATE INDEX IF NOT EXISTS idx_billing_groups_status
    ON billing_groups(status);

CREATE TABLE IF NOT EXISTS billing_group_orders (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL REFERENCES tenants(id),
    group_id    UUID NOT NULL REFERENCES billing_groups(id) ON DELETE CASCADE,
    order_id    UUID NOT NULL REFERENCES orders(id),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_billing_group_orders
    ON billing_group_orders(group_id, order_id);

CREATE INDEX IF NOT EXISTS idx_billing_group_orders_group
    ON billing_group_orders(group_id);

CREATE INDEX IF NOT EXISTS idx_billing_group_orders_order
    ON billing_group_orders(order_id);
