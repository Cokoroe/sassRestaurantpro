-- V11: add system_flag to roles

ALTER TABLE roles
    ADD COLUMN IF NOT EXISTS system_flag BOOLEAN DEFAULT FALSE;
