// src/main/java/com/sassfnb/repository/RestaurantSettingsRepository.java
package com.sassfnb.adapters.persistence.repository;

import com.sassfnb.adapters.persistence.entity.RestaurantSettingsEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface RestaurantSettingsRepository extends JpaRepository<RestaurantSettingsEntity, UUID> {
    Optional<RestaurantSettingsEntity> findByRestaurantId(UUID restaurantId);

    Optional<RestaurantSettingsEntity> findByTenantIdAndRestaurantIdAndKey(UUID tenantId, UUID restaurantId,
            String key);
}
