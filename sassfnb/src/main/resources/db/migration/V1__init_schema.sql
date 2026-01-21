-- =====================================================================
-- V1__init_schema.sql
-- Khởi tạo toàn bộ schema SassFnB mới (Tenant → Restaurant → Outlet → Table)
-- =====================================================================

-- Extension cho UUID (nếu dùng gen_random_uuid)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE SCHEMA IF NOT EXISTS public;
SET search_path TO public;


-- =====================================================================
-- 1. MULTI-TENANT & IDENTITY
-- =====================================================================

CREATE TABLE tenants (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(200) NOT NULL,
    code            VARCHAR(50)  NOT NULL,
    status          VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    timezone        VARCHAR(64)  DEFAULT 'Asia/Ho_Chi_Minh',
    currency        VARCHAR(8)   DEFAULT 'VND',
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ
);

CREATE UNIQUE INDEX ux_tenants_code ON tenants(code);

CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(150) UNIQUE NOT NULL,
    phone           VARCHAR(32),
    full_name       VARCHAR(150),
    status          VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ
);

CREATE TABLE roles (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code            VARCHAR(50) UNIQUE NOT NULL,   -- ROOT_OWNER, MANAGER, WAITER, KITCHEN, ...
    name            VARCHAR(100) NOT NULL,
    description     VARCHAR(255),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ
);

CREATE TABLE permissions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code            VARCHAR(100) UNIQUE NOT NULL,
    name            VARCHAR(150) NOT NULL,
    description     VARCHAR(255)
);

CREATE TABLE role_permissions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id         UUID NOT NULL REFERENCES roles(id),
    permission_id   UUID NOT NULL REFERENCES permissions(id)
);

CREATE UNIQUE INDEX ux_role_permissions ON role_permissions(role_id, permission_id);

CREATE TABLE user_roles (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id),
    role_id         UUID NOT NULL REFERENCES roles(id),
    restaurant_id   UUID NOT NULL,     -- FK restaurants(id) khai báo sau
    outlet_id       UUID,              -- FK outlets(id) khai báo sau
    assigned_by     UUID,
    assigned_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE user_credentials (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id),
    password_hash   VARCHAR(255) NOT NULL,
    provider        VARCHAR(20)  NOT NULL DEFAULT 'LOCAL',
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ
);

CREATE TABLE refresh_tokens (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id),
    token           VARCHAR(500) NOT NULL,
    expires_at      TIMESTAMPTZ  NOT NULL,
    revoked         BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE email_verification_tokens (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id),
    token           VARCHAR(255) NOT NULL,
    expires_at      TIMESTAMPTZ  NOT NULL,
    used_at         TIMESTAMPTZ
);

CREATE TABLE password_reset_tokens (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id),
    token           VARCHAR(255) NOT NULL,
    expires_at      TIMESTAMPTZ  NOT NULL,
    used_at         TIMESTAMPTZ
);

CREATE TABLE audit_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id),
    user_id         UUID,
    action          VARCHAR(100) NOT NULL,
    entity_type     VARCHAR(100),
    entity_id       UUID,
    payload         JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE outbox_events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id),
    aggregate_type  VARCHAR(100) NOT NULL,
    aggregate_id    UUID NOT NULL,
    event_type      VARCHAR(100) NOT NULL,
    payload         JSONB NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'NEW',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    processed_at    TIMESTAMPTZ
);

-- =====================================================================
-- 2. TENANT → RESTAURANT → OUTLET → TABLE
-- =====================================================================

CREATE TABLE restaurants (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL REFERENCES tenants(id),
    owner_user_id       UUID REFERENCES users(id),
    name                VARCHAR(150) NOT NULL,
    legal_name          VARCHAR(200),
    tax_id              VARCHAR(64),
    default_currency    VARCHAR(3)   NOT NULL DEFAULT 'VND',
    default_timezone    VARCHAR(64)  NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
    locale              VARCHAR(16)  NOT NULL DEFAULT 'vi-VN',
    logo_url            VARCHAR(255),
    cover_image_url     VARCHAR(255),
    status              VARCHAR(24)  NOT NULL DEFAULT 'ACTIVE',
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_restaurants_tenant ON restaurants(tenant_id);

CREATE TABLE outlets (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id   UUID NOT NULL REFERENCES restaurants(id),
    -- Có thể join ngược restaurant -> tenant nên không cần tenant_id riêng
    name            VARCHAR(150) NOT NULL,
    code            VARCHAR(64)  NOT NULL,
    phone           VARCHAR(32),
    address         VARCHAR(255),
    city            VARCHAR(80),
    country         VARCHAR(2),
    timezone        VARCHAR(64),
    open_hours      TEXT,
    photo_url       VARCHAR(255),
    is_default      BOOLEAN      NOT NULL DEFAULT FALSE,
    status          VARCHAR(16)  NOT NULL DEFAULT 'ACTIVE',
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX ux_outlets_restaurant_code ON outlets(restaurant_id, code);

CREATE TABLE tables (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    outlet_id           UUID NOT NULL REFERENCES outlets(id),
    code                VARCHAR(64) NOT NULL,
    name                VARCHAR(128),
    capacity            INT,
    group_code          VARCHAR(32),
    status              VARCHAR(16) NOT NULL DEFAULT 'AVAILABLE', -- AVAILABLE/OCCUPIED/RESERVED
    is_deleted          BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    static_qr_code      VARCHAR(24),
    static_qr_image_url TEXT
);

CREATE UNIQUE INDEX ux_tables_outlet_code ON tables(outlet_id, code);

CREATE TABLE table_qr (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_id        UUID NOT NULL REFERENCES tables(id),
    qr_code         VARCHAR(128) NOT NULL,
    qr_url          TEXT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    expired_at      TIMESTAMPTZ
);

CREATE TABLE table_sessions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL REFERENCES tenants(id),
    outlet_id           UUID NOT NULL REFERENCES outlets(id),
    table_id            UUID NOT NULL REFERENCES tables(id),
    join_code           VARCHAR(16)  NOT NULL,
    qr_token            VARCHAR(128),
    device_fingerprint  VARCHAR(128),
    verified            BOOLEAN      NOT NULL DEFAULT FALSE,
    status              VARCHAR(16)  NOT NULL DEFAULT 'ACTIVE',
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
    expires_at          TIMESTAMPTZ,
    closed_at           TIMESTAMPTZ
);

CREATE UNIQUE INDEX ux_table_sessions_join_code ON table_sessions(join_code);

CREATE TABLE table_session_logs (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_session_id    UUID NOT NULL REFERENCES table_sessions(id),
    action              VARCHAR(50) NOT NULL,
    data                JSONB,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by          UUID
);

CREATE TABLE customers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id),
    full_name       VARCHAR(150),
    phone           VARCHAR(30),
    email           VARCHAR(150),
    note            TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ
);

CREATE TABLE reservations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id),
    outlet_id       UUID NOT NULL REFERENCES outlets(id),
    table_id        UUID REFERENCES tables(id),
    customer_id     UUID REFERENCES customers(id),
    customer_name   VARCHAR(200),
    customer_phone  VARCHAR(30),
    reserved_from   TIMESTAMPTZ NOT NULL,
    reserved_to     TIMESTAMPTZ,
    status          VARCHAR(20) NOT NULL DEFAULT 'BOOKED', -- BOOKED/CONFIRMED/CANCELLED/NO_SHOW
    note            TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ
);

-- =====================================================================
-- 3. MENU, NGUYÊN LIỆU, CÔNG THỨC
-- =====================================================================

CREATE TABLE ingredients (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id),
    name            VARCHAR(150) NOT NULL,
    unit            VARCHAR(20),
    sku             VARCHAR(50),
    status          VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ
);

CREATE TABLE menu_categories (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id),
    outlet_id       UUID NOT NULL REFERENCES outlets(id),
    name            VARCHAR(150) NOT NULL,
    sort_order      INT DEFAULT 0,
    status          VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ
);

CREATE TABLE menu_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id),
    outlet_id       UUID NOT NULL REFERENCES outlets(id),
    category_id     UUID REFERENCES menu_categories(id),
    name            VARCHAR(150) NOT NULL,
    code            VARCHAR(50)  NOT NULL,
    description     TEXT,
    base_price      NUMERIC(12,2) NOT NULL,
    is_available    BOOLEAN NOT NULL DEFAULT TRUE,
    image_url       VARCHAR(255),
    thumbnail_url   VARCHAR(255),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ
);

CREATE UNIQUE INDEX ux_menu_items_outlet_code ON menu_items(outlet_id, code);

CREATE TABLE menu_item_prices (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id),
    menu_item_id    UUID NOT NULL REFERENCES menu_items(id),
    variant_name    VARCHAR(50),
    price           NUMERIC(12,2) NOT NULL,
    valid_from      TIMESTAMPTZ,
    valid_to        TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ
);

CREATE TABLE menu_options (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id),
    name            VARCHAR(150) NOT NULL,
    selection_type  VARCHAR(16) NOT NULL DEFAULT 'SINGLE', -- SINGLE/MULTI
    is_required     BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ
);

CREATE TABLE menu_option_values (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id),
    menu_option_id  UUID NOT NULL REFERENCES menu_options(id),
    name            VARCHAR(150) NOT NULL,
    extra_price     NUMERIC(12,2) NOT NULL DEFAULT 0,
    sort_order      INT DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ
);

CREATE TABLE recipes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id),
    menu_item_id    UUID NOT NULL REFERENCES menu_items(id),
    name            VARCHAR(150),
    instructions    TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ
);

CREATE TABLE recipe_ingredients (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id),
    recipe_id       UUID NOT NULL REFERENCES recipes(id),
    ingredient_id   UUID NOT NULL REFERENCES ingredients(id),
    quantity        NUMERIC(12,3),
    unit            VARCHAR(20),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ
);

-- =====================================================================
-- 4. ORDERS & ORDER ITEMS
-- =====================================================================

CREATE TABLE orders (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id),
    outlet_id       UUID NOT NULL REFERENCES outlets(id),
    table_id        UUID REFERENCES tables(id),
    reservation_id  UUID REFERENCES reservations(id),
    opened_by       UUID REFERENCES users(id),
    status          VARCHAR(24) NOT NULL DEFAULT 'OPEN', -- OPEN/CLOSED/CANCELLED/PAID
    note            TEXT,
    opened_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    closed_at       TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ
);

CREATE TABLE order_tables (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id),
    order_id        UUID NOT NULL REFERENCES orders(id),
    table_id        UUID NOT NULL REFERENCES tables(id),
    linked_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    unlinked_at     TIMESTAMPTZ
);

CREATE TABLE order_participants (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id),
    order_id        UUID NOT NULL REFERENCES orders(id),
    customer_id     UUID REFERENCES customers(id),
    guest_name      VARCHAR(150),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE order_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id),
    order_id        UUID NOT NULL REFERENCES orders(id),
    menu_item_id    UUID NOT NULL REFERENCES menu_items(id),
    quantity        INT NOT NULL,
    unit_price      NUMERIC(12,2) NOT NULL,
    discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    total_amount    NUMERIC(12,2) NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'ORDERED', -- ORDERED/IN_KITCHEN/SERVED/CANCELLED
    note            TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ
);

CREATE TABLE order_item_status_history (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id),
    order_item_id   UUID NOT NULL REFERENCES order_items(id),
    status          VARCHAR(20) NOT NULL,
    changed_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    changed_by      UUID,
    note            TEXT
);

CREATE TABLE order_item_participants (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id               UUID NOT NULL REFERENCES tenants(id),
    order_item_id           UUID NOT NULL REFERENCES order_items(id),
    order_participant_id    UUID NOT NULL REFERENCES order_participants(id),
    share_amount            NUMERIC(12,2) NOT NULL DEFAULT 0
);

CREATE TABLE order_join_requests (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id),
    from_order_id   UUID NOT NULL REFERENCES orders(id),
    to_order_id     UUID NOT NULL REFERENCES orders(id),
    status          VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING/APPROVED/REJECTED
    created_by      UUID,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    processed_by    UUID,
    processed_at    TIMESTAMPTZ
);

CREATE TABLE order_merge_history (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id),
    source_order_id UUID NOT NULL REFERENCES orders(id),
    target_order_id UUID NOT NULL REFERENCES orders(id),
    action          VARCHAR(20) NOT NULL, -- MERGE/SPLIT
    details         JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by      UUID
);

-- =====================================================================
-- 5. PAYMENTS & TIPS
-- =====================================================================

CREATE TABLE payments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id),
    outlet_id       UUID NOT NULL REFERENCES outlets(id),
    order_id        UUID NOT NULL REFERENCES orders(id),
    amount          NUMERIC(12,2) NOT NULL,
    tips_total      NUMERIC(12,2) NOT NULL DEFAULT 0,
    method          VARCHAR(20) NOT NULL, -- CASH/CARD/ONLINE
    ref_code        VARCHAR(100),
    paid_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by      UUID,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE tips (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id),
    outlet_id       UUID NOT NULL REFERENCES outlets(id),
    order_id        UUID NOT NULL REFERENCES orders(id),
    total_tip       NUMERIC(12,2) NOT NULL DEFAULT 0,
    tip_type        VARCHAR(20) NOT NULL DEFAULT 'DIRECT', -- DIRECT/SHARED
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by      UUID
);

CREATE TABLE tip_shares (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id),
    tip_id          UUID NOT NULL REFERENCES tips(id),
    staff_id        UUID NOT NULL,
    amount          NUMERIC(12,2) NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================================
-- 6. STAFF, CA LÀM, CHẤM CÔNG, PAYROLL
-- =====================================================================

CREATE TABLE staffs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id),
    user_id         UUID NOT NULL REFERENCES users(id),
    restaurant_id   UUID NOT NULL REFERENCES restaurants(id),
    outlet_id       UUID NOT NULL REFERENCES outlets(id),
    code            VARCHAR(50),
    position        VARCHAR(50),
    avatar_url      VARCHAR(255),
    status          VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    hired_date      DATE,
    terminated_date DATE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ
);

CREATE TABLE work_shifts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id),
    outlet_id       UUID NOT NULL REFERENCES outlets(id),
    name            VARCHAR(100) NOT NULL,
    start_time      TIME NOT NULL,
    end_time        TIME NOT NULL,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ
);

CREATE TABLE shift_assignments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id),
    staff_id        UUID NOT NULL REFERENCES staffs(id),
    work_shift_id   UUID NOT NULL REFERENCES work_shifts(id),
    outlet_id       UUID NOT NULL REFERENCES outlets(id),
    work_date       DATE NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'ASSIGNED',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ
);

CREATE TABLE attendance_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id),
    staff_id        UUID NOT NULL REFERENCES staffs(id),
    outlet_id       UUID NOT NULL REFERENCES outlets(id),
    check_in_at     TIMESTAMPTZ NOT NULL,
    check_out_at    TIMESTAMPTZ,
    source          VARCHAR(20) NOT NULL DEFAULT 'MANUAL', -- MANUAL/QR
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE pay_rates (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id),
    staff_id        UUID NOT NULL REFERENCES staffs(id),
    outlet_id       UUID NOT NULL REFERENCES outlets(id),
    hourly_rate     NUMERIC(12,2) NOT NULL,
    effective_from  DATE NOT NULL,
    effective_to    DATE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ
);

CREATE TABLE payroll_periods (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id),
    outlet_id       UUID NOT NULL REFERENCES outlets(id),
    start_date      DATE NOT NULL,
    end_date        DATE NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    closed_at       TIMESTAMPTZ
);

CREATE TABLE payroll_details (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id),
    payroll_period_id   UUID NOT NULL REFERENCES payroll_periods(id),
    staff_id        UUID NOT NULL REFERENCES staffs(id),
    total_hours     NUMERIC(12,2) NOT NULL DEFAULT 0,
    gross_pay       NUMERIC(12,2) NOT NULL DEFAULT 0,
    tips_amount     NUMERIC(12,2) NOT NULL DEFAULT 0,
    net_pay         NUMERIC(12,2) NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ
);

-- =====================================================================
-- 7. INVENTORY & PURCHASING
-- =====================================================================

CREATE TABLE suppliers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id),
    name            VARCHAR(200) NOT NULL,
    contact_name    VARCHAR(150),
    phone           VARCHAR(30),
    email           VARCHAR(150),
    address         VARCHAR(255),
    status          VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ
);

CREATE TABLE stocks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id),
    outlet_id       UUID NOT NULL REFERENCES outlets(id),
    ingredient_id   UUID NOT NULL REFERENCES ingredients(id),
    on_hand         NUMERIC(12,3) NOT NULL DEFAULT 0,
    safety_stock    NUMERIC(12,3) NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ
);

CREATE TABLE stock_txns (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id),
    outlet_id       UUID NOT NULL REFERENCES outlets(id),
    ingredient_id   UUID NOT NULL REFERENCES ingredients(id),
    quantity        NUMERIC(12,3) NOT NULL,
    txn_type        VARCHAR(10) NOT NULL, -- IN/OUT/ADJUST
    ref_type        VARCHAR(50),
    ref_id          UUID,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by      UUID
);

CREATE TABLE purchase_orders (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id),
    outlet_id       UUID NOT NULL REFERENCES outlets(id),
    supplier_id     UUID NOT NULL REFERENCES suppliers(id),
    status          VARCHAR(20) NOT NULL DEFAULT 'DRAFT', -- DRAFT/SENT/RECEIVED/CANCELLED
    order_date      DATE NOT NULL,
    expected_date   DATE,
    total_amount    NUMERIC(12,2) NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ
);

CREATE TABLE purchase_order_lines (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL REFERENCES tenants(id),
    purchase_order_id   UUID NOT NULL REFERENCES purchase_orders(id),
    ingredient_id       UUID NOT NULL REFERENCES ingredients(id),
    quantity            NUMERIC(12,3) NOT NULL,
    unit_price          NUMERIC(12,2) NOT NULL,
    total_amount        NUMERIC(12,2) NOT NULL,
    received_quantity   NUMERIC(12,3) NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ
);

-- =====================================================================
-- 8. LOYALTY, SETTINGS, QR SESSIONS
-- =====================================================================

CREATE TABLE loyalty_accounts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id),
    customer_id     UUID NOT NULL REFERENCES customers(id),
    points_balance  NUMERIC(12,2) NOT NULL DEFAULT 0,
    tier            VARCHAR(20),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ
);

CREATE UNIQUE INDEX ux_loyalty_tenant_customer ON loyalty_accounts(tenant_id, customer_id);

CREATE TABLE loyalty_point_txns (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL REFERENCES tenants(id),
    loyalty_account_id  UUID NOT NULL REFERENCES loyalty_accounts(id),
    order_id            UUID REFERENCES orders(id),
    points_change       NUMERIC(12,2) NOT NULL,
    reason              VARCHAR(255),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by          UUID
);

CREATE TABLE settings (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id),
    outlet_id       UUID NOT NULL REFERENCES outlets(id),
    key             VARCHAR(100) NOT NULL,
    value           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ
);

CREATE UNIQUE INDEX ux_settings_outlet_key ON settings(outlet_id, key);

CREATE TABLE restaurant_settings (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id),
    restaurant_id   UUID NOT NULL REFERENCES restaurants(id),
    key             VARCHAR(100) NOT NULL,
    value           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ
);

CREATE UNIQUE INDEX ux_restaurant_settings ON restaurant_settings(restaurant_id, key);

CREATE TABLE import_jobs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id),
    job_type        VARCHAR(50) NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    file_path       VARCHAR(255),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    finished_at     TIMESTAMPTZ,
    error_message   TEXT
);

CREATE TABLE qr_sessions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL REFERENCES tenants(id),
    table_id            UUID NOT NULL REFERENCES tables(id),
    outlet_id           UUID NOT NULL REFERENCES outlets(id),
    device_fingerprint  VARCHAR(128),
    ip_address          VARCHAR(64),
    status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    expired_at          TIMESTAMPTZ
);

-- =====================================================================
-- 9. RÀNG BUỘC BỔ SUNG / FK CHÉO
-- =====================================================================

-- Bổ sung FK cho user_roles sau khi restaurants/outlets đã tạo
ALTER TABLE user_roles
    ADD CONSTRAINT fk_user_roles_restaurant
        FOREIGN KEY (restaurant_id) REFERENCES restaurants(id);

ALTER TABLE user_roles
    ADD CONSTRAINT fk_user_roles_outlet
        FOREIGN KEY (outlet_id) REFERENCES outlets(id);

-- Bạn có thể thêm các INDEX phụ trợ nữa nếu cần hiệu năng

-- =====================================================================
-- KẾT THÚC V1
-- =====================================================================
