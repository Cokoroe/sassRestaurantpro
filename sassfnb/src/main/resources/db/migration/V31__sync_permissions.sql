-- V31__sync_permissions.sql
-- Đảm bảo các permission chuẩn đều tồn tại.
-- Nếu code đã tồn tại thì bỏ qua, không lỗi.

INSERT INTO permissions (id, code, name, description, created_at, updated_at, system_flag)
VALUES
    -- System & Tenant
    (gen_random_uuid(), 'system.settings.view', 'View system settings', 'Xem cấu hình hệ thống', now(), now(), TRUE),
    (gen_random_uuid(), 'system.settings.update', 'Update system settings', 'Cập nhật cấu hình hệ thống', now(), now(), TRUE),
    (gen_random_uuid(), 'tenant.view', 'View tenants', 'Xem danh sách tenant', now(), now(), TRUE),
    (gen_random_uuid(), 'tenant.create', 'Create tenant', 'Tạo tenant mới', now(), now(), TRUE),
    (gen_random_uuid(), 'tenant.update', 'Update tenant', 'Chỉnh sửa tenant', now(), now(), TRUE),
    (gen_random_uuid(), 'tenant.delete', 'Delete tenant', 'Xoá/khoá tenant', now(), now(), TRUE),
    (gen_random_uuid(), 'tenant.plan.change', 'Change subscription plan', 'Thay đổi gói dịch vụ tenant', now(), now(), TRUE),
    (gen_random_uuid(), 'tenant.billing.view', 'View tenant billing', 'Xem hoá đơn, thanh toán tenant', now(), now(), TRUE),

    -- Restaurant
    (gen_random_uuid(), 'restaurant.view', 'View restaurants', 'Xem danh sách nhà hàng', now(), now(), TRUE),
    (gen_random_uuid(), 'restaurant.create', 'Create restaurant', 'Tạo nhà hàng mới', now(), now(), TRUE),
    (gen_random_uuid(), 'restaurant.update', 'Update restaurant', 'Chỉnh sửa nhà hàng', now(), now(), TRUE),
    (gen_random_uuid(), 'restaurant.delete', 'Delete restaurant', 'Khoá/xoá nhà hàng', now(), now(), TRUE),

    -- Outlet
    (gen_random_uuid(), 'outlet.view', 'View outlets', 'Xem danh sách chi nhánh', now(), now(), TRUE),
    (gen_random_uuid(), 'outlet.create', 'Create outlet', 'Tạo chi nhánh mới', now(), now(), TRUE),
    (gen_random_uuid(), 'outlet.update', 'Update outlet', 'Chỉnh sửa chi nhánh', now(), now(), TRUE),
    (gen_random_uuid(), 'outlet.delete', 'Delete outlet', 'Xoá/khoá chi nhánh', now(), now(), TRUE),

    -- Table areas
    (gen_random_uuid(), 'table_area.view', 'View table areas', 'Xem khu vực bàn', now(), now(), TRUE),
    (gen_random_uuid(), 'table_area.manage', 'Manage table areas', 'Quản lý khu vực bàn', now(), now(), TRUE),

    -- Tables
    (gen_random_uuid(), 'table.view', 'View tables', 'Xem danh sách bàn', now(), now(), TRUE),
    (gen_random_uuid(), 'table.create', 'Create table', 'Tạo bàn mới', now(), now(), TRUE),
    (gen_random_uuid(), 'table.update', 'Update table', 'Chỉnh sửa bàn', now(), now(), TRUE),
    (gen_random_uuid(), 'table.delete', 'Delete table', 'Xoá bàn', now(), now(), TRUE),
    (gen_random_uuid(), 'table.merge', 'Merge tables', 'Gộp bàn', now(), now(), TRUE),
    (gen_random_uuid(), 'table.split', 'Split table', 'Tách bàn', now(), now(), TRUE),
    (gen_random_uuid(), 'table.reserve', 'Reserve table', 'Đặt trước bàn', now(), now(), TRUE),
    (gen_random_uuid(), 'table.change_status', 'Change table status', 'Cập nhật trạng thái bàn', now(), now(), TRUE),

    -- Menu
    (gen_random_uuid(), 'menu.view', 'View menus', 'Xem menu', now(), now(), TRUE),
    (gen_random_uuid(), 'menu.create', 'Create menu', 'Tạo menu', now(), now(), TRUE),
    (gen_random_uuid(), 'menu.update', 'Update menu', 'Chỉnh sửa menu', now(), now(), TRUE),
    (gen_random_uuid(), 'menu.delete', 'Delete menu', 'Xoá menu', now(), now(), TRUE),

    -- Menu category
    (gen_random_uuid(), 'menu_category.view', 'View menu categories', 'Xem danh mục món', now(), now(), TRUE),
    (gen_random_uuid(), 'menu_category.manage', 'Manage menu categories', 'Quản lý danh mục món', now(), now(), TRUE),

    -- Menu item
    (gen_random_uuid(), 'menu_item.view', 'View menu items', 'Xem món', now(), now(), TRUE),
    (gen_random_uuid(), 'menu_item.create', 'Create menu item', 'Tạo món mới', now(), now(), TRUE),
    (gen_random_uuid(), 'menu_item.update', 'Update menu item', 'Chỉnh sửa món', now(), now(), TRUE),
    (gen_random_uuid(), 'menu_item.delete', 'Delete menu item', 'Xoá món', now(), now(), TRUE),
    (gen_random_uuid(), 'menu_item.change_status', 'Change menu item status', 'Bật/tắt bán món', now(), now(), TRUE),

    -- Inventory
    (gen_random_uuid(), 'inventory.view', 'View inventory', 'Xem tồn kho', now(), now(), TRUE),
    (gen_random_uuid(), 'inventory.adjust', 'Adjust inventory', 'Điều chỉnh tồn kho', now(), now(), TRUE),
    (gen_random_uuid(), 'inventory.import', 'Import inventory', 'Nhập kho', now(), now(), TRUE),
    (gen_random_uuid(), 'inventory.export', 'Export inventory', 'Xuất kho', now(), now(), TRUE),
    (gen_random_uuid(), 'inventory.transfer', 'Transfer inventory', 'Chuyển kho', now(), now(), TRUE),

    -- Staff
    (gen_random_uuid(), 'staff.view', 'View staff', 'Xem danh sách nhân viên', now(), now(), TRUE),
    (gen_random_uuid(), 'staff.create', 'Create staff', 'Tạo nhân viên', now(), now(), TRUE),
    (gen_random_uuid(), 'staff.update', 'Update staff', 'Chỉnh sửa nhân viên', now(), now(), TRUE),
    (gen_random_uuid(), 'staff.delete', 'Delete staff', 'Khoá nhân viên', now(), now(), TRUE),
    (gen_random_uuid(), 'staff.assign_role', 'Assign roles', 'Gán quyền cho nhân viên', now(), now(), TRUE),

    -- Shifts
    (gen_random_uuid(), 'shift.view', 'View shifts', 'Xem ca làm', now(), now(), TRUE),
    (gen_random_uuid(), 'shift.manage', 'Manage shifts', 'Quản lý ca làm', now(), now(), TRUE),
    (gen_random_uuid(), 'attendance.record', 'Record attendance', 'Check-in / Check-out', now(), now(), TRUE),
    (gen_random_uuid(), 'attendance.approve', 'Approve attendance', 'Duyệt công', now(), now(), TRUE),

    -- RBAC
    (gen_random_uuid(), 'role.view', 'View roles', 'Xem vai trò', now(), now(), TRUE),
    (gen_random_uuid(), 'role.create', 'Create role', 'Tạo vai trò', now(), now(), TRUE),
    (gen_random_uuid(), 'role.update', 'Update role', 'Cập nhật vai trò', now(), now(), TRUE),
    (gen_random_uuid(), 'role.delete', 'Delete role', 'Xoá vai trò', now(), now(), TRUE),
    (gen_random_uuid(), 'role.assign_permissions', 'Assign permissions', 'Gán quyền cho vai trò', now(), now(), TRUE),

    (gen_random_uuid(), 'permission.view', 'View permissions', 'Xem danh sách quyền', now(), now(), TRUE),
    (gen_random_uuid(), 'permission.manage', 'Manage permissions', 'Quản lý quyền', now(), now(), TRUE),

    -- Customer
    (gen_random_uuid(), 'customer.view', 'View customers', 'Xem khách hàng', now(), now(), TRUE),
    (gen_random_uuid(), 'customer.create', 'Create customer', 'Tạo khách hàng', now(), now(), TRUE),
    (gen_random_uuid(), 'customer.update', 'Update customer', 'Chỉnh sửa khách hàng', now(), now(), TRUE),
    (gen_random_uuid(), 'customer.delete', 'Delete customer', 'Xoá khách hàng', now(), now(), TRUE),
    (gen_random_uuid(), 'customer.loyalty.view', 'View loyalty points', 'Xem điểm tích luỹ', now(), now(), TRUE),
    (gen_random_uuid(), 'customer.loyalty.adjust', 'Adjust loyalty', 'Điều chỉnh điểm', now(), now(), TRUE),

    -- Reservation
    (gen_random_uuid(), 'reservation.view', 'View reservations', 'Xem booking', now(), now(), TRUE),
    (gen_random_uuid(), 'reservation.create', 'Create reservation', 'Tạo booking', now(), now(), TRUE),
    (gen_random_uuid(), 'reservation.update', 'Update reservation', 'Chỉnh sửa booking', now(), now(), TRUE),
    (gen_random_uuid(), 'reservation.cancel', 'Cancel reservation', 'Huỷ booking', now(), now(), TRUE),

    -- Order
    (gen_random_uuid(), 'order.view', 'View orders', 'Xem đơn hàng', now(), now(), TRUE),
    (gen_random_uuid(), 'order.create', 'Create order', 'Tạo đơn hàng', now(), now(), TRUE),
    (gen_random_uuid(), 'order.update', 'Update order', 'Cập nhật đơn hàng', now(), now(), TRUE),
    (gen_random_uuid(), 'order.cancel', 'Cancel order', 'Huỷ đơn hàng', now(), now(), TRUE),
    (gen_random_uuid(), 'order.close', 'Close order', 'Chốt đơn hàng', now(), now(), TRUE),
    (gen_random_uuid(), 'order.discount', 'Apply discount', 'Giảm giá / voucher', now(), now(), TRUE),
    (gen_random_uuid(), 'order.reopen', 'Reopen order', 'Mở lại đơn đã chốt', now(), now(), TRUE),

    -- Kitchen
    (gen_random_uuid(), 'kitchen_ticket.view', 'View kitchen tickets', 'Xem phiếu chế biến', now(), now(), TRUE),
    (gen_random_uuid(), 'kitchen_ticket.update_status', 'Update ticket status', 'Cập nhật trạng thái món', now(), now(), TRUE),

    -- Payment & Finance
    (gen_random_uuid(), 'payment.view', 'View payments', 'Xem thanh toán', now(), now(), TRUE),
    (gen_random_uuid(), 'payment.create', 'Create payment', 'Ghi nhận thanh toán', now(), now(), TRUE),
    (gen_random_uuid(), 'payment.refund', 'Refund payment', 'Hoàn tiền', now(), now(), TRUE),
    (gen_random_uuid(), 'bill.print', 'Print bill', 'In hoá đơn', now(), now(), TRUE),

    (gen_random_uuid(), 'finance.report.view', 'View finance report', 'Xem báo cáo tài chính', now(), now(), TRUE),
    (gen_random_uuid(), 'finance.export', 'Export finance report', 'Xuất báo cáo', now(), now(), TRUE),

    -- Promotion
    (gen_random_uuid(), 'promotion.view', 'View promotions', 'Xem khuyến mãi', now(), now(), TRUE),
    (gen_random_uuid(), 'promotion.create', 'Create promotion', 'Tạo khuyến mãi', now(), now(), TRUE),
    (gen_random_uuid(), 'promotion.update', 'Update promotion', 'Cập nhật khuyến mãi', now(), now(), TRUE),
    (gen_random_uuid(), 'promotion.delete', 'Delete promotion', 'Xoá khuyến mãi', now(), now(), TRUE),

    (gen_random_uuid(), 'voucher.view', 'View vouchers', 'Xem voucher', now(), now(), TRUE),
    (gen_random_uuid(), 'voucher.create', 'Create voucher', 'Tạo voucher', now(), now(), TRUE),
    (gen_random_uuid(), 'voucher.update', 'Update voucher', 'Cập nhật voucher', now(), now(), TRUE),
    (gen_random_uuid(), 'voucher.delete', 'Delete voucher', 'Xoá voucher', now(), now(), TRUE),

    -- Reports
    (gen_random_uuid(), 'report.sales.view', 'View sales report', 'Xem báo cáo doanh thu', now(), now(), TRUE),
    (gen_random_uuid(), 'report.order.view', 'View order report', 'Xem báo cáo đơn hàng', now(), now(), TRUE),
    (gen_random_uuid(), 'report.staff.view', 'View staff performance', 'Xem hiệu suất nhân viên', now(), now(), TRUE),
    (gen_random_uuid(), 'report.export', 'Export reports', 'Xuất báo cáo', now(), now(), TRUE),

    -- QR & Integrations
    (gen_random_uuid(), 'qr_config.view', 'View QR config', 'Xem cấu hình QR', now(), now(), TRUE),
    (gen_random_uuid(), 'qr_config.manage', 'Manage QR config', 'Quản lý cấu hình QR', now(), now(), TRUE),

    (gen_random_uuid(), 'channel_online.view', 'View online channels', 'Xem kênh online', now(), now(), TRUE),
    (gen_random_uuid(), 'channel_online.manage', 'Manage online channels', 'Quản lý kênh online', now(), now(), TRUE),

    (gen_random_uuid(), 'integration.view', 'View integrations', 'Xem cấu hình tích hợp', now(), now(), TRUE),
    (gen_random_uuid(), 'integration.manage', 'Manage integrations', 'Quản lý tích hợp', now(), now(), TRUE),

    -- Audit log
    (gen_random_uuid(), 'audit_log.view', 'View audit logs', 'Xem nhật ký hệ thống', now(), now(), TRUE),
    (gen_random_uuid(), 'audit_log.export', 'Export audit logs', 'Xuất nhật ký', now(), now(), TRUE)
ON CONFLICT (code) DO NOTHING;
