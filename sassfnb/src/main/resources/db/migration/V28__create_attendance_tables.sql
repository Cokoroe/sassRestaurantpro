-- V28__create_attendance_tables.sql

create table if not exists attendance_records (
    id                  uuid primary key,
    tenant_id           uuid not null,
    restaurant_id       uuid not null,
    outlet_id           uuid not null,
    staff_id            uuid not null,
    shift_assignment_id uuid not null,
    work_date           date not null,

    clock_in_time       timestamptz,
    clock_out_time      timestamptz,

    total_work_minutes  int default 0,

    status              varchar(32) not null,
    -- ON_TIME | LATE | ABSENT | LEFT_EARLY

    has_pending_adjust  boolean default false,

    created_at          timestamptz not null,
    updated_at          timestamptz not null,

    constraint fk_attendance_shift
        foreign key (shift_assignment_id) references shift_assignments(id),

    constraint uq_attendance_unique_per_shift
        unique (shift_assignment_id),

    constraint chk_attendance_status
        check (status in ('ON_TIME', 'LATE', 'ABSENT', 'LEFT_EARLY'))
);

create table if not exists attendance_adjustments (
    id                          uuid primary key,
    attendance_id               uuid not null,

    requested_by_user_id        uuid not null,
    requested_at                timestamptz not null,

    original_clock_in_time      timestamptz,
    original_clock_out_time     timestamptz,
    original_status             varchar(32),

    requested_clock_in_time     timestamptz,
    requested_clock_out_time    timestamptz,
    requested_status            varchar(32),
    reason                      text,

    approve_status              varchar(16) not null,
    -- PENDING | APPROVED | REJECTED

    approved_by_user_id         uuid,
    approved_at                 timestamptz,
    approve_note                text,

    created_at                  timestamptz not null,
    updated_at                  timestamptz not null,

    constraint fk_adj_attendance
        foreign key (attendance_id) references attendance_records(id),

    constraint chk_adj_approve_status
        check (approve_status in ('PENDING', 'APPROVED', 'REJECTED'))
);

ALTER TABLE work_shifts
    ADD COLUMN IF NOT EXISTS status VARCHAR(32),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

UPDATE work_shifts SET status = 'OPEN' WHERE status IS NULL;
