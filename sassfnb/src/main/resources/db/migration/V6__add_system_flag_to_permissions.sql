-- V6 - add system_flag column to permissions

ALTER TABLE permissions
    ADD COLUMN IF NOT EXISTS system_flag BOOLEAN NOT NULL DEFAULT FALSE;
