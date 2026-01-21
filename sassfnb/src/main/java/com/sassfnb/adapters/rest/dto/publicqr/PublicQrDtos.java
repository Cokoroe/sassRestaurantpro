package com.sassfnb.adapters.rest.dto.publicqr;

import java.time.Instant;
import java.util.UUID;

public class PublicQrDtos {

    public record TableInfo(
            UUID tableId,
            String code,
            String name,
            Integer capacity,
            String groupCode,
            String status) {
    }

    public record ResolveResponse(
            UUID tenantId,
            UUID outletId,
            UUID tableId,
            TableInfo tableInfo,
            UUID qrSessionId,
            Instant sessionExpiresAt) {
    }

    public record HeartbeatResponse(
            UUID qrSessionId,
            Instant lastSeenAt,
            String status) {
    }

    public record PublicQrResolveResponse(
            UUID tenantId,
            UUID outletId,
            UUID tableId,
            UUID qrSessionId,
            String tableStatus,
            Instant sessionExpiresAt) {
    }
}
