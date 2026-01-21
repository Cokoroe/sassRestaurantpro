// src/main/java/com/sassfnb/adapters/rest/dto/order/OrderDtos.java
package com.sassfnb.adapters.rest.dto.order;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public class OrderDtos {

        // =======================
        // Enums (string values)
        // =======================
        public static final class OrderStatus {
                public static final String DRAFT = "DRAFT";
                public static final String SUBMITTED = "SUBMITTED";
                public static final String VOIDED = "VOIDED";
                public static final String CLOSED = "CLOSED"; // nếu bạn có
                public static final String PAID = "PAID"; // nếu bạn có
        }

        public static final class OrderItemStatus {
                public static final String NEW = "NEW";
                public static final String FIRED = "FIRED";
                public static final String SERVED = "SERVED"; // nếu bạn có
                public static final String VOIDED = "VOIDED";
        }

        // =======================
        // Requests
        // =======================
        public record SubmitOrderResponse(
                        UUID id,
                        String status,
                        Instant updatedAt) {
        }

        public record ReopenOrderRequest(String reason) {
        }

        public record ReopenOrderResponse(UUID id, String status, Instant updatedAt) {
        }

        public record StaffOrderListRequest(
                        UUID outletId,
                        String status,
                        UUID tableId,
                        String q) {
        }

        public record FireOrderRequest(
                        Boolean all,
                        List<UUID> itemIds) {
        }

        public record VoidItemRequest(String reason) {
        }

        public record VoidOrderRequest(String reason) {
        }

        public record PatchOrderNoteRequest(String note) {
        }

        // =======================
        // Responses
        // =======================
        public record OrderItemResponse(
                        UUID id,
                        UUID menuItemId,
                        UUID priceId,
                        Integer quantity,
                        BigDecimal unitPrice,
                        BigDecimal discountAmount,
                        BigDecimal totalAmount,
                        String status,
                        String note,
                        Instant createdAt,
                        Instant updatedAt) {
        }

        public record OrderResponse(
                        UUID id,
                        UUID tenantId,
                        UUID outletId,
                        UUID tableId,
                        UUID reservationId,
                        UUID openedBy,
                        UUID qrSessionId,
                        Integer people,
                        Instant openedAt,
                        Instant closedAt,
                        String status,
                        String note,
                        BigDecimal grandTotal,
                        List<OrderItemResponse> items,
                        Instant createdAt,
                        Instant updatedAt) {
        }

        // =======================
        // Part 7: Totals & Close
        // =======================
        public record OrderTotalsResponse(
                        UUID orderId,
                        BigDecimal subTotal,
                        BigDecimal discountTotal,
                        BigDecimal surchargeTotal,
                        BigDecimal grandTotal,
                        Instant calculatedAt) {
        }

        /** optional: note/receiptNo... MVP để trống vẫn OK */
        public record CloseOrderRequest(
                        String note) {
        }

        public record CloseOrderResponse(
                        UUID id,
                        String status,
                        Instant closedAt,
                        Instant updatedAt) {
        }
}
