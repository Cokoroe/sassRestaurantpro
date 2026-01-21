package com.sassfnb.adapters.rest.dto.auth;

import jakarta.validation.constraints.*;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public class AuthDtos {

        public record RegisterOwnerRequest(
                        @Email @NotBlank String email,
                        @NotBlank @Size(min = 6) String password,
                        @NotBlank String fullName,
                        @NotBlank String restaurantName) {
        }

        // bên trong class AuthDtos
        public record MeResponse(
                        UUID id,
                        String email,
                        String fullName,
                        String status,
                        OffsetDateTime createdAt,

                        // Tenant
                        UUID tenantId,
                        String tenantCode,
                        String tenantName,

                        // Nếu là staff thì có thêm
                        UUID staffId,
                        UUID restaurantId,
                        String restaurantName,
                        UUID outletId,
                        String outletName,

                        // Roles
                        List<String> roles) {
        }

        public record LoginRequest(@NotBlank String username, @NotBlank String password) {
        }

        public record TokenResponse(String accessToken, String refreshToken, long expiresInSeconds) {
        }

        public record RefreshRequest(@NotBlank String refreshToken) {
        }

        public record LogoutRequest(@NotBlank String refreshToken, boolean allDevices) {
        }
}
