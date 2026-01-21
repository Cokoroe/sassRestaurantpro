// src/main/java/com/sassfnb/adapters/rest/dto/mail/SendPlainEmailRequest.java
package com.sassfnb.adapters.rest.dto.mail;

import jakarta.validation.constraints.NotBlank;

public record SendPlainEmailRequest(
        String to, // nếu null sẽ gửi tới email của user đang đăng nhập
        @NotBlank String subject,
        @NotBlank String body,
        Boolean html // optional: true = gửi HTML, false/null = text/plain
) {
}
