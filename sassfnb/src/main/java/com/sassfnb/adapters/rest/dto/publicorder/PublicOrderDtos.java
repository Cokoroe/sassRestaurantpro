package com.sassfnb.adapters.rest.dto.publicorder;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public class PublicOrderDtos {

        // POST /public/orders
        public record CreateOrderRequest(
                        UUID outletId,
                        UUID tableId,
                        UUID qrSessionId,
                        String note,
                        Integer people) {
        }

        // ✅ NEW: request chọn 1 value cho 1 option
        public record SelectedOptionRequest(
                        UUID optionId,
                        UUID valueId) {
        }

        // POST /public/orders/{orderId}/items
        public record AddItemRequest(
                        UUID menuItemId,
                        UUID priceId, // optional (variant)
                        Integer quantity,
                        String note,
                        List<SelectedOptionRequest> selectedOptions // ✅ NEW
        ) {
        }

        public record PatchItemRequest(
                        Integer quantity,
                        String note) {
        }

        // ✅ NEW: trả về selection để FE render lại
        public record SelectedOptionResponse(
                        UUID optionId,
                        UUID valueId,
                        String optionName,
                        String valueName,
                        BigDecimal extraPrice) {
        }

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
                        Instant updatedAt,
                        List<SelectedOptionResponse> selectedOptions // ✅ NEW
        ) {
        }

        public record OrderResponse(
                        UUID id,
                        UUID tenantId,
                        UUID outletId,
                        UUID tableId,
                        UUID qrSessionId,
                        String status,
                        String note,
                        Integer people,
                        Instant openedAt,
                        Instant createdAt,
                        Instant updatedAt,
                        BigDecimal grandTotal,
                        List<OrderItemResponse> items) {
        }
}
