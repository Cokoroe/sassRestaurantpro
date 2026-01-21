-- V54__seed_sepay_settings.sql
-- Seed SePay settings per outlet (ACC/BANK/WEBHOOK_SECRET)
-- Assumption: outlets has restaurant_id; restaurants has tenant_id

-- 1) SEPAY_ACC
insert into public.settings (id, tenant_id, outlet_id, key, value, created_at, updated_at)
select
  gen_random_uuid(),
  r.tenant_id,
  o.id as outlet_id,
  'SEPAY_ACC' as key,
  'CHANGE_ME_ACC' as value,
  now(),
  now()
from public.outlets o
join public.restaurants r on r.id = o.restaurant_id
where not exists (
  select 1
  from public.settings s
  where s.outlet_id = o.id
    and s.key = 'SEPAY_ACC'
);

-- 2) SEPAY_BANK
insert into public.settings (id, tenant_id, outlet_id, key, value, created_at, updated_at)
select
  gen_random_uuid(),
  r.tenant_id,
  o.id as outlet_id,
  'SEPAY_BANK' as key,
  'CHANGE_ME_BANK' as value,
  now(),
  now()
from public.outlets o
join public.restaurants r on r.id = o.restaurant_id
where not exists (
  select 1
  from public.settings s
  where s.outlet_id = o.id
    and s.key = 'SEPAY_BANK'
);

-- 3) SEPAY_WEBHOOK_SECRET
insert into public.settings (id, tenant_id, outlet_id, key, value, created_at, updated_at)
select
  gen_random_uuid(),
  r.tenant_id,
  o.id as outlet_id,
  'SEPAY_WEBHOOK_SECRET' as key,
  'CHANGE_ME_SECRET' as value,
  now(),
  now()
from public.outlets o
join public.restaurants r on r.id = o.restaurant_id
where not exists (
  select 1
  from public.settings s
  where s.outlet_id = o.id
    and s.key = 'SEPAY_WEBHOOK_SECRET'
);
