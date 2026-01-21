-- V7 - add ip column to refresh_tokens

ALTER TABLE refresh_tokens
    ADD COLUMN IF NOT EXISTS ip VARCHAR(64);
