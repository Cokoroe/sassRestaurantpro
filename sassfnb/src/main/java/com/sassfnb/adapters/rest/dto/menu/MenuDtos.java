package com.sassfnb.adapters.rest.dto.menu;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public class MenuDtos {

        // ===== CATEGORY =====
        public record CategoryListRequest(
                        UUID outletId,
                        String q,
                        String status) {
        }

        public record CategoryResponse(
                        UUID id,
                        String name,
                        Integer sortOrder,
                        String status,
                        Instant createdAt,
                        Instant updatedAt) {
        }

        public record CategoryCreateRequest(
                        UUID outletId,
                        String name,
                        Integer sortOrder,
                        String status) {
        }

        public record CategoryUpdateRequest(
                        String name,
                        Integer sortOrder,
                        String status) {
        }

        public record CategoryReorderRequest(Integer sortOrder) {
        }

        // (Nếu bạn vẫn cần tree thì giữ, nhưng hiện DB phẳng)
        public record CategoryTreeNode(
                        UUID id, String name, Integer sortOrder, String status,
                        List<CategoryTreeNode> children) {
        }

        // ===== ITEM =====
        public record ItemListRequest(
                        String q, UUID categoryId, String status, Boolean isFeatured, UUID outletId,
                        Boolean hasOptions) {
        }

        public record ItemCreateRequest(
                        UUID outletId,
                        String name,
                        String code, // optional
                        UUID categoryId,
                        String description,
                        String imageUrl,
                        String status, // ACTIVE/INACTIVE
                        BigDecimal basePrice,
                        List<String> tags // optional
        ) {
        }

        public record ItemUpdateRequest(
                        String name,
                        UUID categoryId,
                        String description,
                        String imageUrl,
                        String status,
                        List<String> tags) {
        }

        public record ItemPublishPatchRequest(String status) {
        } // ACTIVE/INACTIVE

        public record ItemResponse(
                        UUID id,
                        String name,
                        String code,
                        UUID categoryId,
                        String description,
                        String imageUrl,
                        String status,
                        List<String> tags,
                        Instant createdAt,
                        Instant updatedAt) {
        }

        public record ItemDetailResponse(
                        ItemResponse item,
                        List<OptionResponse> options,
                        List<OptionValueGrouped> optionValues,
                        PriceResponse effectivePrice // nullable, khi có outletId & at
        ) {
        }

        public record DuplicateItemResponse(UUID newItemId) {
        }

        // ===== PRICE =====
        public record PriceCreateRequest(
                        UUID outletId, // nullable => áp dụng tenant-wide
                        String currency, // "VND"
                        BigDecimal basePrice,
                        BigDecimal takeawayPrice,
                        Instant startAt, // nullable
                        Instant endAt, // nullable
                        Boolean isActive) {
        }

        public record PriceUpdateRequest(
                        String currency,
                        BigDecimal basePrice,
                        BigDecimal takeawayPrice,
                        Instant startAt,
                        Instant endAt,
                        Boolean isActive) {
        }

        public record PriceActivatePatchRequest(Boolean isActive) {
        }

        public record PriceResponse(
                        UUID id,
                        UUID itemId,
                        UUID outletId,
                        String currency,
                        BigDecimal basePrice,
                        BigDecimal takeawayPrice,
                        Instant startAt,
                        Instant endAt,
                        Boolean isActive,
                        Instant createdAt,
                        Instant updatedAt) {
        }

        // ===== OPTIONS / MODIFIERS =====
        public record OptionCreateRequest(
                        String name,
                        Boolean required,
                        Boolean multiSelect,
                        Integer minSelect, // optional
                        Integer maxSelect // optional
        ) {
        }

        public record OptionUpdateRequest(
                        String name,
                        Boolean required,
                        Boolean multiSelect,
                        Integer minSelect,
                        Integer maxSelect) {
        }

        public record OptionResponse(
                        UUID id,
                        UUID itemId,
                        String name,
                        Boolean required,
                        Boolean multiSelect,
                        Integer minSelect,
                        Integer maxSelect) {
        }

        public record OptionValueCreateRequest(
                        String name,
                        BigDecimal extraPrice,
                        Integer sortOrder) {
        }

        public record OptionValueUpdateRequest(
                        String name,
                        BigDecimal extraPrice,
                        Integer sortOrder) {
        }

        public record OptionValueResponse(
                        UUID id,
                        UUID optionId,
                        String name,
                        BigDecimal extraPrice,
                        Integer sortOrder) {
        }

        public record OptionValueGrouped(
                        UUID optionId, String optionName, List<OptionValueResponse> values) {
        }
}
