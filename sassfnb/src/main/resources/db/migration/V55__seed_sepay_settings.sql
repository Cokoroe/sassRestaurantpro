-- V55__seed_sepay_settings.sql
-- Seed SePay settings per outlet (if missing)
-- tenant_id is derived from restaurants (outlets usually don't have tenant_id)

-- NOTE:
-- gen_random_uuid() needs extension pgcrypto.
-- If your DB doesn't have it, replace gen_random_uuid() by uuid_generate_v4() (uuid-ossp).

-- ========= 1) SEPAY_ACC =========
INSERT INTO settings (id, tenant_id, outlet_id, key, value, created_at, updated_at)
SELECT
    gen_random_uuid(),
    r.tenant_id,
    o.id,
    'SEPAY_ACC',
    'CHANGE_ME_ACC',
    now(),
    now()
FROM outlets o
JOIN restaurants r ON r.id = o.restaurant_id
WHERE NOT EXISTS (
    SELECT 1
    FROM settings s
    WHERE s.outlet_id = o.id
      AND s.key = 'SEPAY_ACC'
);

-- ========= 2) SEPAY_BANK =========
INSERT INTO settings (id, tenant_id, outlet_id, key, value, created_at, updated_at)
SELECT
    gen_random_uuid(),
    r.tenant_id,
    o.id,
    'SEPAY_BANK',
    'MBBank',
    now(),
    now()
FROM outlets o
JOIN restaurants r ON r.id = o.restaurant_id
WHERE NOT EXISTS (
    SELECT 1
    FROM settings s
    WHERE s.outlet_id = o.id
      AND s.key = 'SEPAY_BANK'
);

-- ========= 3) SEPAY_WEBHOOK_SECRET =========
INSERT INTO settings (id, tenant_id, outlet_id, key, value, created_at, updated_at)
SELECT
    gen_random_uuid(),
    r.tenant_id,
    o.id,
    'SEPAY_WEBHOOK_SECRET',
    'CHANGE_ME_SECRET',
    now(),
    now()
FROM outlets o
JOIN restaurants r ON r.id = o.restaurant_id
WHERE NOT EXISTS (
    SELECT 1
    FROM settings s
    WHERE s.outlet_id = o.id
      AND s.key = 'SEPAY_WEBHOOK_SECRET'
);
