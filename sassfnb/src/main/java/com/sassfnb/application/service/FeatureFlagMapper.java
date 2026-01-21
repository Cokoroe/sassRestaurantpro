package com.sassfnb.application.service;

import com.sassfnb.adapters.persistence.entity.PermissionEntity;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Chuyển list PermissionEntity -> feature_flags (Map<String,Object>)
 * để FE dựa vào đó ẩn/hiện menu, trang, nút... mà không cần tự parse 100+
 * permission.
 */
@Component
public class FeatureFlagMapper {

    public Map<String, Object> fromPermissions(Collection<PermissionEntity> perms) {
        Set<String> codes = perms.stream()
                .map(PermissionEntity::getCode)
                .collect(Collectors.toSet());

        Map<String, Object> features = new LinkedHashMap<>();

        // ===== System & tenant =====
        features.put("system", Map.of(
                "canViewSettings", hasAny(codes, "system.settings.view"),
                "canUpdateSettings", hasAny(codes, "system.settings.update")));

        features.put("tenants", Map.of(
                "canView", hasAny(codes, "tenant.view"),
                "canManage", hasAny(codes, "tenant.create", "tenant.update", "tenant.delete"),
                "canChangePlan", hasAny(codes, "tenant.plan.change"),
                "canViewBilling", hasAny(codes, "tenant.billing.view")));

        // ===== Restaurant / Outlet =====
        features.put("restaurants", Map.of(
                "canView", hasAny(codes, "restaurant.view"),
                "canManage", hasAny(codes, "restaurant.create", "restaurant.update", "restaurant.delete")));

        features.put("outlets", Map.of(
                "canView", hasAny(codes, "outlet.view"),
                "canManage", hasAny(codes, "outlet.create", "outlet.update", "outlet.delete")));

        // ===== Tables & reservations =====
        features.put("tables", Map.of(
                "canViewAreas", hasAny(codes, "table_area.view"),
                "canManageAreas", hasAny(codes, "table_area.manage"),
                "canViewTables", hasAny(codes, "table.view"),
                "canManageTables", hasAny(codes, "table.create", "table.update", "table.delete"),
                "canMerge", hasAny(codes, "table.merge"),
                "canSplit", hasAny(codes, "table.split"),
                "canReserve", hasAny(codes, "table.reserve"),
                "canChangeStatus", hasAny(codes, "table.change_status")));

        features.put("reservations", Map.of(
                "canView", hasAny(codes, "reservation.view"),
                "canManage", hasAny(codes,
                        "reservation.create",
                        "reservation.update",
                        "reservation.cancel")));

        // ===== Menu & items =====
        features.put("menu", Map.of(
                "canViewMenu", hasAny(codes, "menu.view"),
                "canManageMenu", hasAny(codes, "menu.create", "menu.update", "menu.delete"),
                "canViewCategory", hasAny(codes, "menu_category.view"),
                "canManageCategory", hasAny(codes, "menu_category.manage"),
                "canViewItem", hasAny(codes, "menu_item.view"),
                "canManageItem", hasAny(codes,
                        "menu_item.create",
                        "menu_item.update",
                        "menu_item.delete"),
                "canToggleItem", hasAny(codes, "menu_item.change_status")));

        // ===== Inventory =====
        features.put("inventory", Map.of(
                "canView", hasAny(codes, "inventory.view"),
                "canAdjust", hasAny(codes, "inventory.adjust"),
                "canImport", hasAny(codes, "inventory.import"),
                "canExport", hasAny(codes, "inventory.export"),
                "canTransfer", hasAny(codes, "inventory.transfer")));

        // ===== Staff & HR =====
        features.put("staff", Map.of(
                "canView", hasAny(codes, "staff.view"),
                "canManage", hasAny(codes,
                        "staff.create",
                        "staff.update",
                        "staff.delete"),
                "canAssignRole", hasAny(codes, "staff.assign_role")));

        features.put("shifts", Map.of(
                "canView", hasAny(codes, "shift.view"),
                "canManage", hasAny(codes, "shift.manage"),
                "canRecordAttendance", hasAny(codes, "attendance.record"),
                "canApproveAttendance", hasAny(codes, "attendance.approve")));

        // ===== RBAC =====
        features.put("rbac", Map.of(
                "canViewRoles", hasAny(codes, "role.view"),
                "canManageRoles", hasAny(codes,
                        "role.create",
                        "role.update",
                        "role.delete"),
                "canAssignPermissions", hasAny(codes, "role.assign_permissions"),
                "canViewPermissions", hasAny(codes, "permission.view"),
                "canManagePermissions", hasAny(codes, "permission.manage")));

        // ===== Customers & loyalty =====
        features.put("customers", Map.of(
                "canView", hasAny(codes, "customer.view"),
                "canManage", hasAny(codes,
                        "customer.create",
                        "customer.update",
                        "customer.delete"),
                "canViewLoyalty", hasAny(codes, "customer.loyalty.view"),
                "canAdjustLoyalty", hasAny(codes, "customer.loyalty.adjust")));

        // ===== Orders / Kitchen / Payment =====
        features.put("orders", Map.of(
                "canView", hasAny(codes, "order.view"),
                "canCreate", hasAny(codes, "order.create"),
                "canUpdate", hasAny(codes, "order.update"),
                "canCancel", hasAny(codes, "order.cancel"),
                "canClose", hasAny(codes, "order.close"),
                "canDiscount", hasAny(codes, "order.discount"),
                "canReopen", hasAny(codes, "order.reopen")));

        features.put("kitchen", Map.of(
                "canViewTicket", hasAny(codes, "kitchen_ticket.view"),
                "canUpdateTicket", hasAny(codes, "kitchen_ticket.update_status")));

        features.put("payments", Map.of(
                "canView", hasAny(codes, "payment.view"),
                "canCreate", hasAny(codes, "payment.create"),
                "canRefund", hasAny(codes, "payment.refund"),
                "canPrintBill", hasAny(codes, "bill.print")));

        features.put("finance", Map.of(
                "canViewReport", hasAny(codes, "finance.report.view"),
                "canExportReport", hasAny(codes, "finance.export")));

        // ===== Promo / voucher =====
        features.put("promotions", Map.of(
                "canView", hasAny(codes, "promotion.view"),
                "canManage", hasAny(codes,
                        "promotion.create",
                        "promotion.update",
                        "promotion.delete")));

        features.put("vouchers", Map.of(
                "canView", hasAny(codes, "voucher.view"),
                "canManage", hasAny(codes,
                        "voucher.create",
                        "voucher.update",
                        "voucher.delete")));

        // ===== Reports =====
        features.put("reports", Map.of(
                "canViewSales", hasAny(codes, "report.sales.view"),
                "canViewOrders", hasAny(codes, "report.order.view"),
                "canViewStaffPerformance", hasAny(codes, "report.staff.view"),
                "canExport", hasAny(codes, "report.export")));

        // ===== QR & integrations =====
        features.put("qr", Map.of(
                "canViewConfig", hasAny(codes, "qr_config.view"),
                "canManageConfig", hasAny(codes, "qr_config.manage")));

        features.put("channels", Map.of(
                "canViewOnlineChannels", hasAny(codes, "channel_online.view"),
                "canManageOnlineChannels", hasAny(codes, "channel_online.manage")));

        features.put("integrations", Map.of(
                "canViewIntegrations", hasAny(codes, "integration.view"),
                "canManageIntegrations", hasAny(codes, "integration.manage")));

        // ===== Audit =====
        features.put("audit", Map.of(
                "canViewLogs", hasAny(codes, "audit_log.view"),
                "canExportLogs", hasAny(codes, "audit_log.export")));

        return features;
    }

    private boolean hasAny(Set<String> codes, String... keys) {
        for (String k : keys) {
            if (codes.contains(k))
                return true;
        }
        return false;
    }
}
