-- V56__fix_sepay_change_me_values.sql
-- Replace CHANGE_ME for SePay settings (safe defaults)

-- ACC
UPDATE settings
SET value = 'VQRQAFCWO4482', updated_at = now()
WHERE key = 'SEPAY_ACC'
  AND (value IS NULL OR value = '' OR value ILIKE 'CHANGE_ME%');

-- BANK
UPDATE settings
SET value = 'MBBank', updated_at = now()
WHERE key = 'SEPAY_BANK'
  AND (value IS NULL OR value = '' OR value ILIKE 'CHANGE_ME%');

-- WEBHOOK SECRET: để rỗng vẫn ok, nhưng không nên auto set thật
UPDATE settings
SET value = 'CHANGE_ME_SECRET', updated_at = now()
WHERE key = 'SEPAY_WEBHOOK_SECRET'
  AND (value IS NULL OR value = '');
