-- Thêm cột last_pw_change_at vào user_credentials để khớp với entity
ALTER TABLE user_credentials
    ADD COLUMN IF NOT EXISTS last_pw_change_at TIMESTAMPTZ;
