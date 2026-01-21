// src/main/java/com/sassfnb/application/config/AppUrlsProperties.java
package com.sassfnb.application.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Data
@ConfigurationProperties(prefix = "app.urls")
public class AppUrlsProperties {
    private String publicBase = "http://localhost:8080";

    // ✅ NEW: FE base để encode vào QR mới
    private String frontendBase = "http://localhost:5173";
}
