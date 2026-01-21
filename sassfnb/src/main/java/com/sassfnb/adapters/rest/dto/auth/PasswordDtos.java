package com.sassfnb.adapters.rest.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class PasswordDtos {

    public record ForgotRequest(
            @NotBlank @Email String email) {
    }

    public record ForgotResponse(String message) {
    }

    public record ResetRequest(
            @NotBlank String token,
            @NotBlank String newPassword) {
    }

    public record ResetResponse(String message) {
    }
}
