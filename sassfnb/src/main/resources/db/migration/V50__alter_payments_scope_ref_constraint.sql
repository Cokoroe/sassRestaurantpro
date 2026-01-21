-- V50__alter_payments_scope_ref_constraint.sql

ALTER TABLE payments
DROP CONSTRAINT IF EXISTS ck_payments_scope_ref;

ALTER TABLE payments
ADD CONSTRAINT ck_payments_scope_ref
CHECK (
    (scope = 'ORDER' AND order_id IS NOT NULL AND group_id IS NULL)
 OR (scope = 'GROUP' AND group_id IS NOT NULL)
);
