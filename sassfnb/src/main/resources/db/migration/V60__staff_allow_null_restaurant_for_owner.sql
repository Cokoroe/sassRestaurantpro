--V60__staff_allow_null_restaurant_for_owner.sql
-- 1) owner staff lúc đăng ký chưa có restaurant/outlet => cho phép restaurant_id null
ALTER TABLE staffs
  ALTER COLUMN restaurant_id DROP NOT NULL;

-- 2) tránh tạo trùng staff cho cùng 1 user trong 1 tenant
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'uk_staffs_tenant_user'
  ) THEN
    ALTER TABLE staffs
      ADD CONSTRAINT uk_staffs_tenant_user UNIQUE (tenant_id, user_id);
  END IF;
END $$;
