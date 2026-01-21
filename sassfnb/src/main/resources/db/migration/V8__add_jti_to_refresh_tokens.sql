-- V8 - add jti column to refresh_tokens

ALTER TABLE refresh_tokens
    ADD COLUMN IF NOT EXISTS jti VARCHAR(255);
