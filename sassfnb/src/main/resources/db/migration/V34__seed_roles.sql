-- V34__seed_roles.sql
-- Seed baseline roles (templates) and map them to existing permissions.
-- Strategy: UPSERT by role.code so you can re-run safely.
-- Notes:
-- 1) We KEEP existing IDs for ROOT and OWNER automatically because we update by code.
-- 2) If your roles table doesn't have UNIQUE(code), add it first, otherwise ON CONFLICT won't work.

-- Optional: ensure uuid generator (Postgres)
-- CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =========================
-- 1) Baseline Roles (Templates)
-- =========================
INSERT INTO roles (id, code, name, description, created_at, updated_at, system_flag, feature_flags)
VALUES
    (gen_random_uuid(), 'ROOT',    'System Root',        'Full system owner / platform admin', now(), now(), TRUE,  NULL),
    (gen_random_uuid(), 'OWNER',   'Tenant Owner',       'Chủ sở hữu tenant/nhà hàng, toàn quyền trong phạm vi tenant', now(), now(), TRUE, NULL),

    -- Restaurant-level templates
    (gen_random_uuid(), 'MANAGER', 'Restaurant Manager', 'Quản lý vận hành nhà hàng/chi nhánh', now(), now(), TRUE, NULL),
    (gen_random_uuid(), 'CASHIER', 'Cashier',            'Thu ngân: chốt đơn, thanh toán, in hoá đơn', now(), now(), TRUE, NULL),
    (gen_random_uuid(), 'WAITER',  'Waiter/Service',     'Phục vụ: nhận order, quản lý bàn, booking cơ bản', now(), now(), TRUE, NULL),
    (gen_random_uuid(), 'KITCHEN', 'Kitchen Staff',      'Bếp: xử lý ticket món, cập nhật trạng thái', now(), now(), TRUE, NULL),
    (gen_random_uuid(), 'INVENTORY','Inventory Staff',   'Kho: nhập/xuất/chuyển/điều chỉnh tồn kho', now(), now(), TRUE, NULL),
    (gen_random_uuid(), 'HR',      'HR/Staff Admin',     'Nhân sự: quản lý staff, phân quyền, chấm công', now(), now(), TRUE, NULL),
    (gen_random_uuid(), 'REPORT_VIEWER','Report Viewer', 'Chỉ xem báo cáo / dữ liệu (read-only)', now(), now(), TRUE, NULL)
ON CONFLICT (code) DO UPDATE
SET name        = EXCLUDED.name,
    description = EXCLUDED.description,
    system_flag = EXCLUDED.system_flag,
    feature_flags = EXCLUDED.feature_flags,
    updated_at  = now();

-- =========================
-- 2) Role -> Permission mapping
--    We insert via permission.code to be stable.
-- =========================

-- Helper CTE to fetch role ids by code
WITH r AS (
    SELECT code, id
    FROM roles
    WHERE code IN ('ROOT','OWNER','MANAGER','CASHIER','WAITER','KITCHEN','INVENTORY','HR','REPORT_VIEWER')
),
p AS (
    SELECT code, id
    FROM permissions
),
pairs AS (
    -- ROOT: everything (all permissions)
    SELECT r.id AS role_id, p.id AS permission_id
    FROM r
    JOIN p ON TRUE
    WHERE r.code = 'ROOT'

    UNION ALL

    -- OWNER: everything in tenant scope (exclude tenant.* / system.* if you want platform-only for ROOT)
    SELECT r.id, p.id
    FROM r
    JOIN p ON TRUE
    WHERE r.code = 'OWNER'
      AND p.code NOT LIKE 'tenant.%'
      AND p.code NOT LIKE 'system.%'

    UNION ALL

    -- MANAGER: broad operational permissions
    SELECT r.id, p.id
    FROM r JOIN p ON p.code IN (
        'restaurant.view','outlet.view',
        'table_area.view','table_area.manage',
        'table.view','table.create','table.update','table.delete','table.merge','table.split','table.reserve','table.change_status',
        'menu.view','menu.create','menu.update','menu.delete',
        'menu_category.view','menu_category.manage',
        'menu_item.view','menu_item.create','menu_item.update','menu_item.delete','menu_item.change_status',
        'order.view','order.create','order.update','order.cancel','order.close','order.discount','order.reopen',
        'reservation.view','reservation.create','reservation.update','reservation.cancel',
        'customer.view','customer.create','customer.update','customer.delete','customer.loyalty.view','customer.loyalty.adjust',
        'kitchen_ticket.view','kitchen_ticket.update_status',
        'payment.view','payment.create','payment.refund','bill.print',
        'inventory.view','inventory.adjust','inventory.import','inventory.export','inventory.transfer',
        'shift.view','shift.manage','attendance.record','attendance.approve',
        'staff.view','staff.create','staff.update','staff.delete','staff.assign_role',
        'report.sales.view','report.order.view','report.staff.view','report.export',
        'finance.report.view','finance.export',
        'audit_log.view'
    )
    WHERE r.code = 'MANAGER'

    UNION ALL

    -- CASHIER: orders + payment + printing + customer basic
    SELECT r.id, p.id
    FROM r JOIN p ON p.code IN (
        'table.view','table.change_status','table.reserve',
        'order.view','order.create','order.update','order.close','order.discount','order.reopen',
        'payment.view','payment.create','payment.refund','bill.print',
        'customer.view','customer.create','customer.update','customer.loyalty.view','customer.loyalty.adjust',
        'reservation.view','reservation.create','reservation.update','reservation.cancel'
    )
    WHERE r.code = 'CASHIER'

    UNION ALL

    -- WAITER: tables + take orders + basic customer/reservation (no payment/refund)
    SELECT r.id, p.id
    FROM r JOIN p ON p.code IN (
        'table_area.view',
        'table.view','table.change_status','table.reserve','table.merge','table.split',
        'order.view','order.create','order.update','order.cancel',
        'reservation.view','reservation.create','reservation.update','reservation.cancel',
        'customer.view','customer.create','customer.update'
    )
    WHERE r.code = 'WAITER'

    UNION ALL

    -- KITCHEN: kitchen tickets only (and maybe view orders)
    SELECT r.id, p.id
    FROM r JOIN p ON p.code IN (
        'kitchen_ticket.view','kitchen_ticket.update_status',
        'order.view'
    )
    WHERE r.code = 'KITCHEN'

    UNION ALL

    -- INVENTORY: inventory + view menu items (optional)
    SELECT r.id, p.id
    FROM r JOIN p ON p.code IN (
        'inventory.view','inventory.adjust','inventory.import','inventory.export','inventory.transfer',
        'menu_item.view'
    )
    WHERE r.code = 'INVENTORY'

    UNION ALL

    -- HR: staff + attendance + shifts (often HR needs approve attendance, optional)
    SELECT r.id, p.id
    FROM r JOIN p ON p.code IN (
        'staff.view','staff.create','staff.update','staff.delete','staff.assign_role',
        'shift.view','shift.manage',
        'attendance.record','attendance.approve'
    )
    WHERE r.code = 'HR'

    UNION ALL

    -- REPORT_VIEWER: read-only reports + view orders/customers, no write
    SELECT r.id, p.id
    FROM r JOIN p ON p.code IN (
        'report.sales.view','report.order.view','report.staff.view','report.export',
        'finance.report.view','finance.export',
        'audit_log.view',
        'order.view','customer.view','reservation.view','payment.view',
        'inventory.view','menu.view','menu_item.view'
    )
    WHERE r.code = 'REPORT_VIEWER'
)
INSERT INTO role_permissions (id, role_id, permission_id)
SELECT gen_random_uuid(), role_id, permission_id
FROM pairs
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- =========================
-- 3) Optional cleanup for accidental/invalid role codes
--    (Uncomment if you want. This deletes roles that have no users assigned.)
-- =========================
-- DELETE FROM roles r
-- WHERE r.code ~ '.*\s+.*'  -- contains spaces
--   AND NOT EXISTS (SELECT 1 FROM user_roles ur WHERE ur.role_id = r.id)
--   AND r.system_flag = FALSE;
