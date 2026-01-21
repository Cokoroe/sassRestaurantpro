-- V10 - add user_agent to refresh_tokens

ALTER TABLE refresh_tokens
    ADD COLUMN IF NOT EXISTS user_agent TEXT;
