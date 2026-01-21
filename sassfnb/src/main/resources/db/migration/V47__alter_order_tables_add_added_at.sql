-- V47__alter_order_tables_add_added_at.sql
-- Fix schema validation: missing column added_at in order_tables

ALTER TABLE order_tables
ADD COLUMN IF NOT EXISTS added_at timestamptz NOT NULL DEFAULT now();

-- Nếu DB bạn cũng chưa có added_by thì mở thêm:
ALTER TABLE order_tables
ADD COLUMN IF NOT EXISTS added_by uuid NULL;
