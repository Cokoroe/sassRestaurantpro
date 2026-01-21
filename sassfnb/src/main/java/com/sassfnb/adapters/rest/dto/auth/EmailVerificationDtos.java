package com.sassfnb.adapters.rest.dto.auth;

import jakarta.validation.constraints.NotBlank;

public class EmailVerificationDtos {
    public record SendVerifyResponse(String message) {
    }

    public record VerifyRequest(@NotBlank String token) {
    }

    public record VerifyResponse(String message) {
    }
}
