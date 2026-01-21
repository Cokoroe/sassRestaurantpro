-- V32__add_scope_columns_to_attendance_adjustments.sql

-- 1) Add scope columns (nếu chưa có)
ALTER TABLE attendance_adjustments
    ADD COLUMN IF NOT EXISTS tenant_id uuid,
    ADD COLUMN IF NOT EXISTS restaurant_id uuid,
    ADD COLUMN IF NOT EXISTS outlet_id uuid,
    ADD COLUMN IF NOT EXISTS staff_id uuid,
    ADD COLUMN IF NOT EXISTS work_date date;

-- 2) Backfill scope từ attendance_records (join qua attendance_id)
UPDATE attendance_adjustments a
SET
    tenant_id     = r.tenant_id,
    restaurant_id = r.restaurant_id,
    outlet_id     = r.outlet_id,
    staff_id      = r.staff_id,
    work_date     = r.work_date
FROM attendance_records r
WHERE a.attendance_id = r.id
  AND (a.tenant_id IS NULL OR a.outlet_id IS NULL OR a.staff_id IS NULL OR a.work_date IS NULL);

-- 3) Nếu muốn enforce NOT NULL thì chỉ bật sau khi chắc chắn data đủ
-- ALTER TABLE attendance_adjustments
--     ALTER COLUMN tenant_id SET NOT NULL,
--     ALTER COLUMN restaurant_id SET NOT NULL,
--     ALTER COLUMN outlet_id SET NOT NULL,
--     ALTER COLUMN staff_id SET NOT NULL,
--     ALTER COLUMN work_date SET NOT NULL;

-- 4) Index (nếu muốn)
CREATE INDEX IF NOT EXISTS idx_att_adj_tenant_outlet
    ON attendance_adjustments(tenant_id, outlet_id);

CREATE INDEX IF NOT EXISTS idx_att_adj_staff
    ON attendance_adjustments(staff_id);

CREATE INDEX IF NOT EXISTS idx_att_adj_work_date
    ON attendance_adjustments(work_date);

CREATE INDEX IF NOT EXISTS idx_att_adj_approve_status
    ON attendance_adjustments(approve_status);
