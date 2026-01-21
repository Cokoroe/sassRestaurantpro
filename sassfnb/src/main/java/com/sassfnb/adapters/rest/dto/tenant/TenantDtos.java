package com.sassfnb.adapters.rest.dto.tenant;

import java.time.Instant;
import java.util.UUID;

public class TenantDtos {

    public record TenantResponse(
            UUID id,
            String name,
            String code,
            String status,
            String timezone,
            String currency,
            Instant createdAt,
            Instant updatedAt) {
    }

    public record TenantCreateRequest(
            String name,
            String code,
            String timezone,
            String currency) {
    }

    public record TenantUpdateRequest(
            String name,
            String timezone,
            String currency) {
    }

    public record TenantStatusPatchRequest(
            String status) {
    }
}
