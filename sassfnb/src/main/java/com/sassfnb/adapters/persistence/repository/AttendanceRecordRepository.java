// src/main/java/com/sassfnb/adapters/persistence/repository/AttendanceRecordRepository.java
package com.sassfnb.adapters.persistence.repository;

import com.sassfnb.adapters.persistence.entity.AttendanceRecordEntity;
import com.sassfnb.application.domain.attendance.AttendanceStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AttendanceRecordRepository extends JpaRepository<AttendanceRecordEntity, UUID> {

        Optional<AttendanceRecordEntity> findByShiftAssignmentId(UUID shiftAssignmentId);

        Page<AttendanceRecordEntity> findByTenantIdAndOutletIdAndWorkDateBetween(
                        UUID tenantId, UUID outletId, LocalDate from, LocalDate to, Pageable pageable);

        Page<AttendanceRecordEntity> findByTenantIdAndOutletIdAndStaffIdAndWorkDateBetween(
                        UUID tenantId, UUID outletId, UUID staffId, LocalDate from, LocalDate to, Pageable pageable);

        // ✅ NEW: filter by status
        Page<AttendanceRecordEntity> findByTenantIdAndOutletIdAndStatusAndWorkDateBetween(
                        UUID tenantId, UUID outletId, AttendanceStatus status, LocalDate from, LocalDate to,
                        Pageable pageable);

        // ✅ NEW: filter by staff + status
        Page<AttendanceRecordEntity> findByTenantIdAndOutletIdAndStaffIdAndStatusAndWorkDateBetween(
                        UUID tenantId, UUID outletId, UUID staffId, AttendanceStatus status, LocalDate from,
                        LocalDate to, Pageable pageable);

        Optional<AttendanceRecordEntity> findFirstByTenantIdAndOutletIdAndStaffIdAndWorkDate(
                        UUID tenantId, UUID outletId, UUID staffId, LocalDate workDate);

        Optional<AttendanceRecordEntity> findByTenantIdAndOutletIdAndId(
                        UUID tenantId, UUID outletId, UUID id);

        List<AttendanceRecordEntity> findByTenantIdAndOutletIdAndWorkDateBetween(
                        UUID tenantId,
                        UUID outletId,
                        LocalDate from,
                        LocalDate to);
}
