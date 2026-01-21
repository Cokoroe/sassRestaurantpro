-- ensure extension exists
create extension if not exists pgcrypto;

-- set default uuid generator for payments.id
alter table payments
alter column id set default gen_random_uuid();
