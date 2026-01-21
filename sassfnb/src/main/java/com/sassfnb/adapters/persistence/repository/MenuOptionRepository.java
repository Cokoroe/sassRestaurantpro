// src/main/java/com/sassfnb/adapters/persistence/repository/MenuOptionRepository.java
package com.sassfnb.adapters.persistence.repository;

import com.sassfnb.adapters.persistence.entity.MenuOptionEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MenuOptionRepository extends JpaRepository<MenuOptionEntity, UUID> {

    // ✅ List options theo item (và tenant)
    List<MenuOptionEntity> findByTenantIdAndItemIdOrderByNameAsc(UUID tenantId, UUID itemId);

    // (tuỳ chọn) để validate/update/delete an toàn theo tenant
    Optional<MenuOptionEntity> findByIdAndTenantId(UUID id, UUID tenantId);

    boolean existsByTenantIdAndItemIdAndNameIgnoreCase(UUID tenantId, UUID itemId, String name);

    List<MenuOptionEntity> findByItemIdOrderByNameAsc(UUID itemId);
}
