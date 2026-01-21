package com.sassfnb.adapters.rest.dto.publicmenu;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public class PublicMenuDtos {

    public record PublicMenuTreeResponse(
            UUID outletId,
            String currency,
            Instant at,
            List<CategoryNode> categories) {
    }

    public record CategoryNode(
            UUID id,
            String name,
            Integer sortOrder,
            List<ItemNode> items) {
    }

    public record ItemNode(
            UUID id,
            String name,
            String description,
            String imageUrl,
            BigDecimal basePrice, // giá effective (đã chốt)
            List<OptionNode> options) {
    }

    public record OptionNode(
            UUID id,
            String name,
            Boolean required,
            Boolean multiSelect,
            List<OptionValueNode> values) {
    }

    public record OptionValueNode(
            UUID id,
            String name,
            BigDecimal extraPrice,
            Integer sortOrder) {
    }
}
