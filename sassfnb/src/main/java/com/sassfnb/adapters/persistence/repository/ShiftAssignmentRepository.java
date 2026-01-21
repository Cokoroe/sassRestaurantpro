// src/main/java/com/sassfnb/adapters/persistence/repository/ShiftAssignmentRepository.java
package com.sassfnb.adapters.persistence.repository;

import com.sassfnb.adapters.persistence.entity.ShiftAssignmentEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface ShiftAssignmentRepository extends JpaRepository<ShiftAssignmentEntity, UUID> {

    List<ShiftAssignmentEntity> findByTenantIdAndStaffIdAndWorkDate(UUID tenantId, UUID staffId, LocalDate workDate);

    List<ShiftAssignmentEntity> findByTenantIdAndOutletIdAndWorkDateBetween(
            UUID tenantId, UUID outletId, LocalDate dateFrom, LocalDate dateTo);

    List<ShiftAssignmentEntity> findByTenantIdAndOutletIdAndStaffIdAndWorkDateBetween(
            UUID tenantId, UUID outletId, UUID staffId, LocalDate dateFrom, LocalDate dateTo);

    // nếu cần thao tác theo template
    List<ShiftAssignmentEntity> findByTenantIdAndWorkShiftId(UUID tenantId, UUID workShiftId);
}
