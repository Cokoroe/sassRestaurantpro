package com.sassfnb.adapters.rest.dto.kds;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public class KdsDtos {

        public static final class KdsItemStatus {
                public static final String FIRED = "FIRED";
                public static final String IN_PROGRESS = "IN_PROGRESS";
                public static final String READY = "READY";
                public static final String SERVED = "SERVED";
                public static final String VOIDED = "VOIDED";
                public static final String NEW = "NEW";
        }

        public record KdsBoardItemResponse(
                        UUID itemId,
                        String itemStatus,
                        Integer quantity,
                        String note,
                        UUID menuItemId,
                        String menuItemName,
                        UUID priceId,
                        BigDecimal unitPrice,
                        BigDecimal totalAmount,
                        Instant itemCreatedAt,

                        UUID orderId,
                        String orderStatus,
                        UUID tableId,
                        String tableName,
                        Integer people,
                        String orderNote,
                        Instant openedAt) {
        }

        public record KdsBoardsResponse(
                        UUID outletId,
                        Instant since,
                        List<String> statuses,
                        List<KdsBoardItemResponse> items) {
        }

        public record PatchKdsItemStatusRequest(String status) {
        }

        public record PatchKdsItemStatusResponse(
                        UUID itemId,
                        String oldStatus,
                        String newStatus,
                        Instant updatedAt) {
        }
}
