// src/main/java/com/sassfnb/config/AppConfig.java
package com.sassfnb.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(DevDefaultsProperties.class)
public class AppConfig {
}
