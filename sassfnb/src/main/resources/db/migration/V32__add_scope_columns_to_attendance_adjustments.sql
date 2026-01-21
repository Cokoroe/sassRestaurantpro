-- V32__add_scope_columns_to_attendance_adjustments.sql

ALTER TABLE attendance_adjustments
    ADD COLUMN IF NOT EXISTS tenant_id uuid,
    ADD COLUMN IF NOT EXISTS restaurant_id uuid,
    ADD COLUMN IF NOT EXISTS outlet_id uuid,
    ADD COLUMN IF NOT EXISTS staff_id uuid,
    ADD COLUMN IF NOT EXISTS work_date date;

-- tạo index theo approve_status (đúng schema hiện tại)
CREATE INDEX IF NOT EXISTS idx_att_adj_tenant_outlet
    ON attendance_adjustments(tenant_id, outlet_id);

CREATE INDEX IF NOT EXISTS idx_att_adj_staff
    ON attendance_adjustments(staff_id);

CREATE INDEX IF NOT EXISTS idx_att_adj_work_date
    ON attendance_adjustments(work_date);

CREATE INDEX IF NOT EXISTS idx_att_adj_approve_status
    ON attendance_adjustments(approve_status);
