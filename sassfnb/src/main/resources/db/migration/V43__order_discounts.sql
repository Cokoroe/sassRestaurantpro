CREATE TABLE IF NOT EXISTS order_discounts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  outlet_id   UUID NOT NULL REFERENCES outlets(id),
  order_id    UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,

  type        VARCHAR(20) NOT NULL, -- PERCENT | AMOUNT
  value       NUMERIC(12,2) NOT NULL,
  note        TEXT,

  created_by  UUID, -- staffId
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_order_discounts_order
  ON order_discounts(order_id);

CREATE INDEX IF NOT EXISTS idx_order_discounts_tenant
  ON order_discounts(tenant_id);

CREATE INDEX IF NOT EXISTS idx_order_discounts_outlet
  ON order_discounts(outlet_id);
