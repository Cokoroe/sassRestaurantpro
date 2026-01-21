package com.sassfnb.adapters.rest.dto.billing;

import com.sassfnb.application.domain.billing.BillingGroupStatus;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public class BillingDtos {

        public enum BillingScope {
                ORDER, GROUP
        }

        @Builder
        public record BillingTotalsResponse(
                        BigDecimal subTotal,
                        BigDecimal discountTotal,
                        BigDecimal serviceCharge,
                        BigDecimal tax,
                        BigDecimal grandTotal,
                        BigDecimal paidTotal,
                        BigDecimal dueTotal) {
        }

        // ===== Groups =====

        /**
         * hỗ trợ tạo group bằng tableIds (UX chuẩn)
         * - FE có thể gửi tableIds
         * - hoặc gửi orderIds (backward compatible)
         * - outletId optional (fallback current outlet)
         */
        public record CreateGroupRequest(
                        UUID outletId,
                        String name,
                        String note,
                        List<UUID> orderIds,
                        List<UUID> tableIds) {
        }

        public record UpdateGroupRequest(
                        String name,
                        String note,
                        List<UUID> addOrderIds,
                        List<UUID> removeOrderIds) {
        }

        @Builder
        public record BillingGroupSummary(
                        UUID id,
                        String name,
                        String note,
                        BillingGroupStatus status,
                        OffsetDateTime createdAt) {
        }

        // ===== Prepare (helper cho FE chọn bàn) =====

        @Builder
        public record BillingGroupPrepareItem(
                        UUID tableId,
                        String tableCode,
                        String tableName,
                        UUID activeOrderId,
                        String activeOrderStatus,
                        OffsetDateTime openedAt) {
        }

        @Builder
        public record BillingGroupPrepareResponse(
                        UUID outletId,
                        List<BillingGroupPrepareItem> tables) {
        }

        @Builder
        public record OrderInfo(
                        UUID id,
                        UUID tableId,
                        String status,
                        OffsetDateTime openedAt) {
        }

        @Builder
        public record OrderItemInfo(
                        UUID id,
                        UUID orderId,
                        UUID menuItemId,
                        Integer quantity,
                        BigDecimal unitPrice,
                        BigDecimal discountAmount,
                        BigDecimal totalAmount,
                        String status) {
        }

        @Builder
        public record BillingGroupDetailResponse(
                        UUID id,
                        UUID outletId,
                        String name,
                        String note,
                        BillingGroupStatus status,
                        OffsetDateTime createdAt,
                        List<OrderInfo> orders,
                        List<OrderItemInfo> items,
                        BillingTotalsResponse totals) {
        }
}
