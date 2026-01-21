// src/main/java/com/sassfnb/application/service/impl/ServiceDefaults.java
package com.sassfnb.application.service.impl;

import com.sassfnb.application.ports.TenantResolver;
import com.sassfnb.config.DevDefaultsProperties;
import lombok.RequiredArgsConstructor;

import java.util.Optional;
import java.util.UUID;

@RequiredArgsConstructor
public class ServiceDefaults {
    private final TenantResolver ctx;
    private final DevDefaultsProperties dev;

    public UUID outletId() {
        return Optional.ofNullable(ctx.currentOutletId())
                .orElse(UUID.fromString(dev.getOutletId()));
    }

    public UUID restaurantId() {
        return Optional.ofNullable(ctx.currentRestaurantId())
                .orElse(UUID.fromString(dev.getRestaurantId()));
    }

    public UUID tenantId() {
        return Optional.ofNullable(ctx.currentTenantId())
                .orElse(UUID.fromString(dev.getTenantId()));
    }
}
