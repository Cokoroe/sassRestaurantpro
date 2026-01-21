package com.sassfnb.adapters.rest.dto.tenant;

import java.time.Instant;
import java.util.UUID;

public class RestaurantDtos {

    public record RestaurantResponse(
            UUID id,
            String name,
            String legalName,
            String taxId,
            String defaultCurrency,
            String defaultTimezone,
            String locale,
            String status,
            Instant createdAt,
            Instant updatedAt) {
    }

    public record RestaurantCreateRequest(
            String name,
            String legalName,
            String taxId,
            String defaultCurrency,
            String defaultTimezone,
            String locale) {
    }

    public record RestaurantUpdateRequest(
            String name,
            String legalName,
            String taxId,
            String defaultCurrency,
            String defaultTimezone,
            String locale) {
    }

    public record RestaurantStatusPatchRequest(String status) {
    }
}
