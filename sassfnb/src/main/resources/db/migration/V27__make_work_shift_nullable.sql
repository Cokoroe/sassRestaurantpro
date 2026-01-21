-- V26_make_work_shift_nullable.sql
-- Cho phép work_shift_id nullable để hỗ trợ ca ad-hoc

ALTER TABLE shift_assignments
    ALTER COLUMN work_shift_id DROP NOT NULL;
