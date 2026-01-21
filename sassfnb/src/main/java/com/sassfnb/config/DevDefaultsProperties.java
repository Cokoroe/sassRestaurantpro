// src/main/java/com/sassfnb/config/DevDefaultsProperties.java
package com.sassfnb.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Data
@ConfigurationProperties(prefix = "app.dev.defaults")
public class DevDefaultsProperties {
    private String tenantId;
    private String restaurantId;
    private String outletId;
}
