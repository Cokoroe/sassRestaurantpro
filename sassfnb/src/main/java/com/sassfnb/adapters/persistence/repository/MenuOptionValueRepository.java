// src/main/java/com/sassfnb/adapters/persistence/repository/MenuOptionValueRepository.java
package com.sassfnb.adapters.persistence.repository;

import com.sassfnb.adapters.persistence.entity.MenuOptionValueEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MenuOptionValueRepository extends JpaRepository<MenuOptionValueEntity, UUID> {

    // ✅ list values theo option
    List<MenuOptionValueEntity> findByMenuOptionIdOrderBySortOrderAscNameAsc(UUID menuOptionId);

    // (tuỳ chọn) an toàn theo tenant
    Optional<MenuOptionValueEntity> findByIdAndTenantId(UUID id, UUID tenantId);

    void deleteByMenuOptionId(UUID menuOptionId);
}
