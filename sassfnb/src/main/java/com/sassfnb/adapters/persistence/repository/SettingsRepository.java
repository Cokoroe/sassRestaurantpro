package com.sassfnb.adapters.persistence.repository;

import com.sassfnb.adapters.persistence.entity.SettingsEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface SettingsRepository extends JpaRepository<SettingsEntity, UUID> {
    Optional<SettingsEntity> findByTenantIdAndOutletIdAndKey(UUID tenantId, UUID outletId, String key);

    Optional<SettingsEntity> findFirstByOutletIdAndKey(UUID outletId, String key);
}
