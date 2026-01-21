ALTER TABLE roles
    ADD COLUMN IF NOT EXISTS feature_flags jsonb;

