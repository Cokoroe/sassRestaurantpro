package com.sassfnb.adapters.rest.dto.auth;

import java.time.OffsetDateTime;
import java.util.List;

public class SessionDtos {

    public record SessionItem(
            String jti, String ip, String userAgent,
            OffsetDateTime createdAt, OffsetDateTime expiresAt, OffsetDateTime revokedAt) {
    }

    public record SessionsResponse(List<SessionItem> sessions) {
    }

    public record RevokeResponse(String message) {
    }
}
