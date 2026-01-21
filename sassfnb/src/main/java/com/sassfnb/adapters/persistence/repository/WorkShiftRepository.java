// src/main/java/com/sassfnb/adapters/persistence/repository/WorkShiftRepository.java
package com.sassfnb.adapters.persistence.repository;

import com.sassfnb.adapters.persistence.entity.WorkShiftEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WorkShiftRepository extends JpaRepository<WorkShiftEntity, UUID> {

    List<WorkShiftEntity> findByTenantIdAndOutletIdAndIsActiveTrue(UUID tenantId, UUID outletId);

    List<WorkShiftEntity> findByTenantIdAndOutletId(UUID tenantId, UUID outletId);

    Optional<WorkShiftEntity> findByIdAndTenantId(UUID id, UUID tenantId);
}
