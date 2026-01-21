-- V48__index_order_tables.sql

CREATE INDEX IF NOT EXISTS idx_order_tables_table_added_at
ON order_tables (table_id, added_at DESC);

CREATE INDEX IF NOT EXISTS idx_order_tables_order_id
ON order_tables (order_id);
