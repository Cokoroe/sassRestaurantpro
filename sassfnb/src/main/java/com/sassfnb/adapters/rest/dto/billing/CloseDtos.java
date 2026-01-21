package com.sassfnb.adapters.rest.dto.billing;

import lombok.Builder;

import java.time.Instant;
import java.util.UUID;

public class CloseDtos {

    @Builder
    public record CloseResponse(
            UUID id,
            String status,
            Instant closedAt) {
    }
}
