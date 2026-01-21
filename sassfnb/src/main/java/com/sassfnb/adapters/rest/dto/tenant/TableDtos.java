// src/main/java/com/sassfnb/adapters/rest/dto/tenant/TableDtos.java
package com.sassfnb.adapters.rest.dto.tenant;

import java.time.Instant;
import java.util.UUID;

public class TableDtos {

        // Dùng cho list / detail
        public record TableResponse(
                        UUID id,
                        String code,
                        String name,
                        Integer capacity,
                        String groupCode,
                        String status,
                        UUID outletId,
                        boolean deleted,
                        Instant createdAt,
                        Instant updatedAt,
                        // extra cho QR hiện tại nếu có
                        String currentQrToken,
                        Instant currentQrExpiresAt,
                        String currentSessionStatus) {
        }

        // ====== CREATE TABLE ======
        public record TableCreateRequest(
                        UUID outletId,
                        String code,
                        String name,
                        Integer capacity,
                        String groupCode,
                        String status) {
        }

        // ====== UPDATE TABLE ======
        public record TableUpdateRequest(
                        String name,
                        Integer capacity,
                        String groupCode,
                        String status) {
        }

        // Patch trạng thái
        public record TableStatusPatchRequest(String status) {
        }

        /**
         * QR động: CHỈ trả token + expiresAt (+ qrUrl nếu FE muốn dùng luôn).
         * KHÔNG dùng "imageUrl" vì QR động không lưu ảnh.
         */
        public record TableQrResponse(
                        String token,
                        Instant expiresAt,
                        String qrUrl) {
        }

        // Request rotate qr – TTL phút
        public record TableQrRotateRequest(Integer ttlMinutes) {
        }

        // Resolve token/qr ra bàn
        public record TableResolveResponse(
                        UUID tableId,
                        UUID outletId,
                        String tableStatus,
                        boolean tokenActive) {
        }
}
