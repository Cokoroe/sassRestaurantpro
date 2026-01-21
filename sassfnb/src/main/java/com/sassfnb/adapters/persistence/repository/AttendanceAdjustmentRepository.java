// src/main/java/com/sassfnb/adapters/persistence/repository/AttendanceAdjustmentRepository.java
package com.sassfnb.adapters.persistence.repository;

import com.sassfnb.adapters.persistence.entity.AttendanceAdjustmentEntity;
import com.sassfnb.application.domain.attendance.AttendanceAdjustmentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AttendanceAdjustmentRepository extends JpaRepository<AttendanceAdjustmentEntity, UUID> {

        // ===== SEARCH (by scope + approveStatus + date range) =====
        Page<AttendanceAdjustmentEntity> findByTenantIdAndOutletIdAndApproveStatusAndWorkDateBetween(
                        UUID tenantId,
                        UUID outletId,
                        AttendanceAdjustmentStatus approveStatus,
                        LocalDate from,
                        LocalDate to,
                        Pageable pageable);

        // ===== SEARCH (by scope + staff + approveStatus + date range) =====
        Page<AttendanceAdjustmentEntity> findByTenantIdAndOutletIdAndStaffIdAndApproveStatusAndWorkDateBetween(
                        UUID tenantId,
                        UUID outletId,
                        UUID staffId,
                        AttendanceAdjustmentStatus approveStatus,
                        LocalDate from,
                        LocalDate to,
                        Pageable pageable);

        // ===== EXIST CHECK (by attendanceId + approveStatus) =====
        boolean existsByAttendanceIdAndApproveStatus(UUID attendanceId, AttendanceAdjustmentStatus approveStatus);

        // ===== FIND FIRST (by scope + attendanceId + approveStatus) =====
        Optional<AttendanceAdjustmentEntity> findFirstByTenantIdAndOutletIdAndAttendanceIdAndApproveStatus(
                        UUID tenantId,
                        UUID outletId,
                        UUID attendanceId,
                        AttendanceAdjustmentStatus approveStatus);

        // ===== FIND LIST (by scope + attendanceIds + approveStatus) =====
        List<AttendanceAdjustmentEntity> findByTenantIdAndOutletIdAndAttendanceIdInAndApproveStatus(
                        UUID tenantId,
                        UUID outletId,
                        List<UUID> attendanceIds,
                        AttendanceAdjustmentStatus approveStatus);

        // ===== SEARCH (by scope + workDate) =====
        Page<AttendanceAdjustmentEntity> findByTenantIdAndOutletIdAndWorkDate(
                        UUID tenantId,
                        UUID outletId,
                        LocalDate workDate,
                        Pageable pageable);
}
