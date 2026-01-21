-- V2 - Add actor_user_id to audit_logs
--   and token/disabled_at/expires_at to table_qr

-- 1) Thêm cột actor_user_id vào audit_logs (nếu chưa có)
ALTER TABLE audit_logs
    ADD COLUMN IF NOT EXISTS actor_user_id UUID;

-- (tuỳ chọn) copy dữ liệu từ user_id sang actor_user_id để không bị null,
-- nếu em muốn giữ lại thông tin actor giống user cũ:
UPDATE audit_logs
SET actor_user_id = user_id
WHERE actor_user_id IS NULL
  AND user_id IS NOT NULL;


-- 2) Thêm các cột cho table_qr (nếu chưa có)
ALTER TABLE table_qr
    ADD COLUMN IF NOT EXISTS token        VARCHAR(255),
    ADD COLUMN IF NOT EXISTS disabled_at  TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS expires_at   TIMESTAMPTZ;
