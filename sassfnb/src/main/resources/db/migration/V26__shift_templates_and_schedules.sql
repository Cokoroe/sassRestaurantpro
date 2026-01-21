-- ================================
-- SHIFT TEMPLATES + ASSIGNMENTS
-- ================================

-- Bổ sung vào work_shifts (template)
ALTER TABLE work_shifts
    ADD COLUMN IF NOT EXISTS break_minutes INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS role_required VARCHAR(50);

-- Bổ sung vào shift_assignments (schedule)
ALTER TABLE shift_assignments
    ADD COLUMN IF NOT EXISTS start_time TIME NOT NULL DEFAULT '00:00',
    ADD COLUMN IF NOT EXISTS end_time TIME NOT NULL DEFAULT '00:00',
    ADD COLUMN IF NOT EXISTS break_minutes INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS note TEXT;
