package com.sassfnb.application.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties({
        AppUrlsProperties.class,
        NuulsProperties.class
})
public class UploadConfig {
    // ✅ KHÔNG tạo @Bean UploadGateway ở đây nữa
}
