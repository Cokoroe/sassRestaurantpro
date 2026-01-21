ALTER TABLE user_credentials
    ADD COLUMN IF NOT EXISTS password_algo VARCHAR(100);
