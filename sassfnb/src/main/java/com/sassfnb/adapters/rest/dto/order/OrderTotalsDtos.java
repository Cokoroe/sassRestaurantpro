package com.sassfnb.adapters.rest.dto.order;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

public class OrderTotalsDtos {

        public record OrderTotalsResponse(
                        UUID orderId,
                        UUID outletId,
                        UUID tenantId,
                        String currency,

                        BigDecimal itemsSubtotal, // sum(order_items.total_amount)
                        BigDecimal discountTotal, // sum(discounts)
                        BigDecimal surchargeTotal, // sum(surcharges) (nếu bạn có)
                        BigDecimal taxTotal, // (nếu có)
                        BigDecimal grandTotal, // subtotal - discount + surcharge + tax

                        BigDecimal paidTotal, // sum(payments CONFIRMED)
                        BigDecimal dueTotal, // grandTotal - paidTotal (>=0)

                        String orderStatus,
                        OffsetDateTime closedAt,
                        OffsetDateTime updatedAt) {
        }

        // Optional: close request
        public record OrderCloseRequest(
                        String method, // CASH/CARD/...
                        BigDecimal amount, // nếu null -> mặc định = dueTotal
                        OffsetDateTime receivedAt) {
        }

        public record OrderCloseResponse(
                        UUID orderId,
                        String orderStatus,
                        OffsetDateTime closedAt,
                        BigDecimal grandTotal,
                        BigDecimal paidTotal,
                        BigDecimal dueTotal,
                        UUID paymentId) {
        }
}
