-- V39__update_order_items_status_check.sql
ALTER TABLE order_items DROP CONSTRAINT IF EXISTS ck_order_items_status;

ALTER TABLE order_items
ADD CONSTRAINT ck_order_items_status
CHECK (status IN ('NEW','FIRED','IN_PROGRESS','READY','SERVED','VOIDED'));
