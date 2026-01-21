package com.sassfnb.adapters.rest.dto.auth;

import jakarta.validation.constraints.NotBlank;

public class MfaDtos {

    public record SetupResponse(String secret, String otpauthUrl /* client tự render QR */) {
    }

    public record EnableRequest(@NotBlank String code) {
    }

    public record DisableRequest(@NotBlank String code) {
    }

    public record MfaResponse(String message) {
    }
}
