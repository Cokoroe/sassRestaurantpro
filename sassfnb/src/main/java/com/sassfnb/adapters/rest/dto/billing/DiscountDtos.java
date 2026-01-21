package com.sassfnb.adapters.rest.dto.billing;

import lombok.Builder;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public class DiscountDtos {

    public record ApplyDiscountRequest(
            String type, // PERCENT | AMOUNT
            BigDecimal value,
            String note) {
    }

    @Builder
    public record DiscountResponse(
            UUID id,
            UUID orderId,
            String type,
            BigDecimal value,
            String note,
            UUID createdBy,
            Instant createdAt) {
    }
}
