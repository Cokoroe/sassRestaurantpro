-- V25__create_or_adjust_staffs.sql
CREATE TABLE IF NOT EXISTS staffs (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       uuid      NOT NULL,
    user_id         uuid      NOT NULL,
    restaurant_id   uuid      NOT NULL,
    outlet_id       uuid,
    code            varchar(50),
    position        varchar(50),
    avatar_url      varchar(255),
    status          varchar(20) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE / INACTIVE
    hired_date      date       NOT NULL,
    terminated_date date,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

-- indexes
CREATE INDEX IF NOT EXISTS idx_staffs_tenant  ON staffs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_staffs_rest    ON staffs(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_staffs_outlet  ON staffs(outlet_id);
CREATE INDEX IF NOT EXISTS idx_staffs_user    ON staffs(user_id);
