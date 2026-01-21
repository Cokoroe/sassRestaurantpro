package com.sassfnb.application.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Data
@ConfigurationProperties(prefix = "app.nuuls")
public class NuulsProperties {
    private String apiBase = "https://i.nuuls.com/v1";
    private String apiKey;
}
