-- V41__payments.sql

-- 1) Create table if not exists (mới)
CREATE TABLE IF NOT EXISTS payments (
  id           UUID PRIMARY KEY,
  tenant_id    UUID NOT NULL,
  outlet_id    UUID NOT NULL,

  scope        VARCHAR(20) NOT NULL,      -- ORDER | GROUP
  order_id     UUID NULL,
  group_id     UUID NULL,

  method       VARCHAR(20) NOT NULL,      -- CASH | TRANSFER | SEPAY
  status       VARCHAR(20) NOT NULL,      -- PENDING | CONFIRMED | FAILED | CANCELLED
  amount       NUMERIC(18,2) NOT NULL DEFAULT 0,

  payment_code VARCHAR(50) NULL,          -- DHxxxxxx (sepay init)
  note         TEXT NULL,

  staff_id     UUID NULL,
  received_at  TIMESTAMPTZ NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2) Ensure columns exist (table đã tồn tại từ trước thì vá schema)
ALTER TABLE payments ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS outlet_id UUID;

ALTER TABLE payments ADD COLUMN IF NOT EXISTS scope VARCHAR(20);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS order_id UUID;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS group_id UUID;

ALTER TABLE payments ADD COLUMN IF NOT EXISTS method VARCHAR(20);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS status VARCHAR(20);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS amount NUMERIC(18,2);

ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_code VARCHAR(50);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS note TEXT;

ALTER TABLE payments ADD COLUMN IF NOT EXISTS staff_id UUID;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS received_at TIMESTAMPTZ;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

-- 3) Optional defaults (nếu table cũ thiếu default)
ALTER TABLE payments ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE payments ALTER COLUMN updated_at SET DEFAULT now();

-- 4) Indexes (chỉ tạo khi chưa có)
CREATE INDEX IF NOT EXISTS idx_payments_tenant_order
  ON payments (tenant_id, order_id);

CREATE INDEX IF NOT EXISTS idx_payments_tenant_group
  ON payments (tenant_id, group_id);

CREATE INDEX IF NOT EXISTS idx_payments_tenant_outlet
  ON payments (tenant_id, outlet_id);

CREATE INDEX IF NOT EXISTS idx_payments_status
  ON payments (status);

-- 5) (Nếu bạn có orders / billing_groups table và muốn FK)
-- Lưu ý: FK IF NOT EXISTS không có native trong PG, nên làm kiểu DO block.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_payments_order'
  ) THEN
    ALTER TABLE payments
      ADD CONSTRAINT fk_payments_order
      FOREIGN KEY (order_id) REFERENCES orders(id)
      ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_payments_group'
  ) THEN
    ALTER TABLE payments
      ADD CONSTRAINT fk_payments_group
      FOREIGN KEY (group_id) REFERENCES billing_groups(id)
      ON DELETE SET NULL;
  END IF;
END $$;
