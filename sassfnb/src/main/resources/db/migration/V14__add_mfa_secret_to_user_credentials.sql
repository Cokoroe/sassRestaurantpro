ALTER TABLE user_credentials
    ADD COLUMN IF NOT EXISTS mfa_secret VARCHAR(255);
