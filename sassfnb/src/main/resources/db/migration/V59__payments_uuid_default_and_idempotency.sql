-- V58__payments_uuid_default_and_idempotency.sql

-- 1) ensure pgcrypto (gen_random_uuid)
create extension if not exists pgcrypto;

-- 2) default uuid for payments.id (an toàn, không phá Hibernate @UuidGenerator)
alter table if exists payments
    alter column id set default gen_random_uuid();

-- 3) Idempotency at DB-level: 1 tenant + provider + provider_txn_id chỉ được 1 row
-- (partial index để tránh null case)
create unique index if not exists uq_payments_tenant_provider_txn
    on payments (tenant_id, provider, provider_txn_id)
    where provider is not null and provider_txn_id is not null;
