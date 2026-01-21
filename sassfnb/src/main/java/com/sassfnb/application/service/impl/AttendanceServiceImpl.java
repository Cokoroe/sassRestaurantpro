// src/main/java/com/sassfnb/application/service/impl/AttendanceServiceImpl.java
package com.sassfnb.application.service.impl;

import com.sassfnb.adapters.persistence.entity.*;
import com.sassfnb.adapters.persistence.repository.*;
import com.sassfnb.adapters.rest.dto.attendance.AttendanceDtos.*;
import com.sassfnb.application.domain.attendance.AttendanceAdjustmentStatus;
import com.sassfnb.application.domain.attendance.AttendanceStatus;
import com.sassfnb.application.ports.TenantResolver;
import com.sassfnb.application.service.AttendanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class AttendanceServiceImpl implements AttendanceService {

    private final TenantResolver tenantResolver;

    private final AttendanceRecordRepository attendanceRecordRepo;
    private final AttendanceAdjustmentRepository adjustmentRepo;
    private final ShiftAssignmentRepository shiftAssignmentRepo;
    private final StaffRepository staffRepo;

    // ✅ NEW: để lấy fullName/email
    private final UserRepository userRepository;

    // =========================
    // CLOCK IN
    // =========================
    @Override
    @Transactional
    public AttendanceResponse clockIn(AttendanceClockInRequest request) {
        UUID tenantId = tenantResolver.currentTenantId();
        UUID outletId = requireOutletId();
        UUID restaurantId = tenantResolver.currentRestaurantId();
        UUID userId = tenantResolver.currentUserId();

        if (request.getShiftAssignmentId() == null) {
            throw new IllegalArgumentException("shiftAssignmentId is required");
        }

        ShiftAssignmentEntity assignment = shiftAssignmentRepo.findById(request.getShiftAssignmentId())
                .orElseThrow(() -> new IllegalArgumentException("ShiftAssignment not found"));

        if (!tenantId.equals(assignment.getTenantId())) {
            throw new IllegalArgumentException("ShiftAssignment not in current tenant");
        }
        if (!outletId.equals(assignment.getOutletId())) {
            throw new IllegalArgumentException("ShiftAssignment not in current outlet");
        }

        // staff self check (optional)
        staffRepo.findFirstByTenantIdAndUserId(tenantId, userId)
                .ifPresent(st -> {
                    if (!Objects.equals(st.getId(), assignment.getStaffId())) {
                        // tùy nghiệp vụ: có thể throw nếu muốn chặt
                    }
                });

        AttendanceRecordEntity record = attendanceRecordRepo.findByShiftAssignmentId(assignment.getId())
                .orElseGet(() -> {
                    AttendanceRecordEntity r = new AttendanceRecordEntity();
                    r.setId(UUID.randomUUID());
                    r.setTenantId(tenantId);
                    r.setRestaurantId(restaurantId);
                    r.setOutletId(outletId);
                    r.setStaffId(assignment.getStaffId());
                    r.setShiftAssignmentId(assignment.getId());
                    r.setWorkDate(assignment.getWorkDate());
                    r.setHasPendingAdjust(false);
                    // ✅ không cần set createdAt/updatedAt vì @CreationTimestamp/@UpdateTimestamp
                    return r;
                });

        if (record.getClockInTime() != null) {
            return toResponse(record, null, null);
        }

        record.setClockInTime(OffsetDateTime.now());
        record.setStatus(AttendanceStatus.PRESENT);

        AttendanceRecordEntity saved = attendanceRecordRepo.save(record);
        return toResponse(saved, null, null);
    }

    // =========================
    // CLOCK OUT
    // =========================
    @Override
    @Transactional
    public AttendanceResponse clockOut(AttendanceClockOutRequest request) {
        UUID tenantId = tenantResolver.currentTenantId();
        UUID outletId = requireOutletId();

        if (request.getShiftAssignmentId() == null) {
            throw new IllegalArgumentException("shiftAssignmentId is required");
        }

        AttendanceRecordEntity record = attendanceRecordRepo.findByShiftAssignmentId(request.getShiftAssignmentId())
                .orElseThrow(() -> new IllegalArgumentException("Attendance record not found. Please clock-in first."));

        if (!tenantId.equals(record.getTenantId())) {
            throw new IllegalArgumentException("Attendance not in current tenant");
        }
        if (!outletId.equals(record.getOutletId())) {
            throw new IllegalArgumentException("Attendance not in current outlet");
        }
        if (record.getClockInTime() == null) {
            throw new IllegalArgumentException("No clock-in time");
        }
        if (record.getClockOutTime() != null) {
            return toResponse(record, null, null);
        }

        OffsetDateTime out = OffsetDateTime.now();
        record.setClockOutTime(out);

        long minutes = Duration.between(record.getClockInTime(), out).toMinutes();
        record.setTotalWorkMinutes((int) Math.max(0, minutes));
        record.setStatus(AttendanceStatus.PRESENT);

        AttendanceRecordEntity saved = attendanceRecordRepo.save(record);
        return toResponse(saved, null, null);
    }

    // =========================
    // SEARCH (✅ FIX B: filter status)
    // =========================
    @Override
    @Transactional(readOnly = true)
    public Page<AttendanceResponse> search(AttendanceSearchCriteria criteria) {
        UUID tenantId = tenantResolver.currentTenantId();

        UUID outletId = (criteria.getOutletId() != null) ? criteria.getOutletId() : tenantResolver.currentOutletId();
        if (outletId == null) {
            throw new IllegalArgumentException("outletId is required (query param or X-Outlet-Id header)");
        }

        LocalDate from = (criteria.getDateFrom() != null) ? criteria.getDateFrom() : LocalDate.now();
        LocalDate to = (criteria.getDateTo() != null) ? criteria.getDateTo() : from;

        int page = (criteria.getPage() != null) ? criteria.getPage() : 0;
        int size = (criteria.getSize() != null) ? criteria.getSize() : 20;
        Pageable pageable = PageRequest.of(page, size, Sort.by("workDate").descending());

        UUID staffId = resolveStaffId(criteria.getStaffId(), tenantId);
        AttendanceStatus status = criteria.getStatus();

        Page<AttendanceRecordEntity> records;

        if (staffId != null) {
            if (status != null) {
                records = attendanceRecordRepo.findByTenantIdAndOutletIdAndStaffIdAndStatusAndWorkDateBetween(
                        tenantId, outletId, staffId, status, from, to, pageable);
            } else {
                records = attendanceRecordRepo.findByTenantIdAndOutletIdAndStaffIdAndWorkDateBetween(
                        tenantId, outletId, staffId, from, to, pageable);
            }
        } else {
            if (status != null) {
                records = attendanceRecordRepo.findByTenantIdAndOutletIdAndStatusAndWorkDateBetween(
                        tenantId, outletId, status, from, to, pageable);
            } else {
                records = attendanceRecordRepo.findByTenantIdAndOutletIdAndWorkDateBetween(
                        tenantId, outletId, from, to, pageable);
            }
        }

        // ✅ FIX C: load staff fullName (via user)
        Map<UUID, String> staffNameMap = loadStaffNames(tenantId, records.getContent());

        Map<UUID, AttendanceAdjustmentEntity> pendingAdjustByAttendanceId = loadPendingAdjustments(tenantId, outletId,
                records.getContent());

        return records.map(r -> {
            AttendanceAdjustmentEntity adj = pendingAdjustByAttendanceId.get(r.getId());
            return toResponse(r, staffNameMap.get(r.getStaffId()), adj);
        });
    }

    // =========================
    // REQUEST ADJUSTMENT
    // =========================
    @Override
    @Transactional
    public AttendanceAdjustmentResponse requestAdjustment(UUID attendanceId, AttendanceAdjustRequest request) {
        UUID tenantId = tenantResolver.currentTenantId();
        UUID outletId = requireOutletId();
        UUID userId = tenantResolver.currentUserId();

        AttendanceRecordEntity record = attendanceRecordRepo.findById(attendanceId)
                .orElseThrow(() -> new IllegalArgumentException("Attendance not found"));

        if (!tenantId.equals(record.getTenantId()) || !outletId.equals(record.getOutletId())) {
            throw new IllegalArgumentException("Attendance not in current context");
        }
        if (record.isHasPendingAdjust()) {
            throw new IllegalStateException("This attendance already has a pending adjustment");
        }

        AttendanceAdjustmentEntity adj = new AttendanceAdjustmentEntity();
        adj.setId(UUID.randomUUID());
        adj.setTenantId(tenantId);
        adj.setOutletId(outletId);
        adj.setStaffId(record.getStaffId());
        adj.setWorkDate(record.getWorkDate());

        adj.setAttendanceId(record.getId());
        adj.setRequestedByUserId(userId);
        adj.setRequestedAt(OffsetDateTime.now());

        adj.setOriginalClockInTime(record.getClockInTime());
        adj.setOriginalClockOutTime(record.getClockOutTime());
        adj.setOriginalStatus(record.getStatus());

        adj.setRequestedClockInTime(request.getRequestedClockInTime());
        adj.setRequestedClockOutTime(request.getRequestedClockOutTime());
        adj.setRequestedStatus(
                request.getRequestedStatus() != null ? request.getRequestedStatus() : record.getStatus());
        adj.setReason(request.getReason());

        adj.setApproveStatus(AttendanceAdjustmentStatus.PENDING);

        adjustmentRepo.save(adj);

        record.setHasPendingAdjust(true);
        attendanceRecordRepo.save(record);

        return toAdjustmentResponse(adj);
    }

    // =========================
    // APPROVE / REJECT ADJUSTMENT
    // =========================
    @Override
    @Transactional
    public AttendanceAdjustmentResponse approveAdjustment(UUID attendanceId, AttendanceApproveRequest request) {
        UUID tenantId = tenantResolver.currentTenantId();
        UUID outletId = requireOutletId();
        UUID approverUserId = tenantResolver.currentUserId();

        AttendanceRecordEntity record = attendanceRecordRepo.findById(attendanceId)
                .orElseThrow(() -> new IllegalArgumentException("Attendance not found"));

        if (!tenantId.equals(record.getTenantId()) || !outletId.equals(record.getOutletId())) {
            throw new IllegalArgumentException("Attendance not in current context");
        }

        AttendanceAdjustmentEntity adj = adjustmentRepo.findFirstByTenantIdAndOutletIdAndAttendanceIdAndApproveStatus(
                tenantId, outletId, attendanceId, AttendanceAdjustmentStatus.PENDING)
                .orElseThrow(() -> new IllegalArgumentException("No pending adjustment found"));

        boolean approve = request.isApprove();

        if (approve) {
            record.setClockInTime(adj.getRequestedClockInTime());
            record.setClockOutTime(adj.getRequestedClockOutTime());
            record.setStatus(adj.getRequestedStatus() != null ? adj.getRequestedStatus() : record.getStatus());

            if (record.getClockInTime() != null && record.getClockOutTime() != null) {
                long minutes = Duration.between(record.getClockInTime(), record.getClockOutTime()).toMinutes();
                record.setTotalWorkMinutes((int) Math.max(0, minutes));
            }
            adj.setApproveStatus(AttendanceAdjustmentStatus.APPROVED);
        } else {
            adj.setApproveStatus(AttendanceAdjustmentStatus.REJECTED);
        }

        adj.setApprovedByUserId(approverUserId);
        adj.setApprovedAt(OffsetDateTime.now());
        adj.setApproveNote(request.getNote());

        adjustmentRepo.save(adj);

        record.setHasPendingAdjust(false);
        attendanceRecordRepo.save(record);

        return toAdjustmentResponse(adj);
    }

    // =========================
    // ✅ FIX A: HANDLE SHIFT ASSIGNMENT CLOSED
    // =========================
    @Override
    @Transactional
    public void handleShiftAssignmentClosed(UUID shiftAssignmentId) {
        if (shiftAssignmentId == null)
            return;

        UUID tenantId = tenantResolver.currentTenantId();
        UUID outletId = requireOutletId();
        UUID restaurantId = tenantResolver.currentRestaurantId();

        ShiftAssignmentEntity a = shiftAssignmentRepo.findById(shiftAssignmentId)
                .orElseThrow(() -> new IllegalArgumentException("ShiftAssignment not found"));

        if (!tenantId.equals(a.getTenantId())) {
            throw new IllegalArgumentException("ShiftAssignment not in current tenant");
        }
        if (!outletId.equals(a.getOutletId())) {
            throw new IllegalArgumentException("ShiftAssignment not in current outlet");
        }

        attendanceRecordRepo.findByShiftAssignmentId(a.getId())
                .orElseGet(() -> {
                    AttendanceRecordEntity r = new AttendanceRecordEntity();
                    r.setId(UUID.randomUUID());
                    r.setTenantId(tenantId);
                    r.setRestaurantId(restaurantId);
                    r.setOutletId(outletId);
                    r.setStaffId(a.getStaffId());
                    r.setShiftAssignmentId(a.getId());
                    r.setWorkDate(a.getWorkDate());
                    r.setStatus(AttendanceStatus.ABSENT);
                    r.setHasPendingAdjust(false);
                    return attendanceRecordRepo.save(r);
                });
    }

    // =========================
    // HELPERS
    // =========================
    private UUID requireOutletId() {
        UUID outletId = tenantResolver.currentOutletId();
        if (outletId == null)
            throw new IllegalArgumentException("Outlet is required (X-Outlet-Id or query outletId)");
        return outletId;
    }

    private UUID resolveStaffId(String staffIdRaw, UUID tenantId) {
        if (staffIdRaw == null || staffIdRaw.isBlank())
            return null;

        if ("self".equalsIgnoreCase(staffIdRaw)) {
            UUID userId = tenantResolver.currentUserId();
            return staffRepo.findFirstByTenantIdAndUserId(tenantId, userId)
                    .map(StaffEntity::getId)
                    .orElseThrow(() -> new IllegalArgumentException("Current user is not a staff"));
        }

        try {
            return UUID.fromString(staffIdRaw);
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid staffId. Use UUID or 'self'");
        }
    }

    // ✅ FIX C: staffName = fullName (fallback code/email)
    private Map<UUID, String> loadStaffNames(UUID tenantId, List<AttendanceRecordEntity> records) {
        if (records == null || records.isEmpty())
            return Map.of();

        Set<UUID> staffIds = new HashSet<>();
        for (AttendanceRecordEntity r : records)
            staffIds.add(r.getStaffId());

        List<StaffEntity> staffs = staffRepo.findByTenantIdAndIdIn(tenantId, staffIds);

        // map staffId -> userId
        Map<UUID, UUID> staffToUser = new HashMap<>();
        Set<UUID> userIds = new HashSet<>();
        for (StaffEntity s : staffs) {
            staffToUser.put(s.getId(), s.getUserId());
            if (s.getUserId() != null)
                userIds.add(s.getUserId());
        }

        Map<UUID, UserEntity> users = userIds.isEmpty()
                ? Map.of()
                : userRepository.findAllById(userIds).stream()
                        .collect(java.util.stream.Collectors.toMap(UserEntity::getId, u -> u));

        Map<UUID, String> map = new HashMap<>();
        for (StaffEntity s : staffs) {
            UserEntity u = users.get(s.getUserId());

            String fullName = (u != null ? u.getFullName() : null);
            String email = (u != null ? u.getEmail() : null);
            String code = (s.getCode() != null && !s.getCode().isBlank()) ? s.getCode() : null;

            String label;
            if (fullName != null && !fullName.isBlank())
                label = fullName;
            else if (code != null)
                label = code;
            else if (email != null)
                label = email;
            else
                label = s.getId().toString();

            map.put(s.getId(), label);
        }
        return map;
    }

    private Map<UUID, AttendanceAdjustmentEntity> loadPendingAdjustments(UUID tenantId, UUID outletId,
            List<AttendanceRecordEntity> records) {
        if (records == null || records.isEmpty())
            return Map.of();

        List<UUID> attendanceIds = records.stream().map(AttendanceRecordEntity::getId).toList();
        List<AttendanceAdjustmentEntity> pending = adjustmentRepo
                .findByTenantIdAndOutletIdAndAttendanceIdInAndApproveStatus(
                        tenantId, outletId, attendanceIds, AttendanceAdjustmentStatus.PENDING);

        Map<UUID, AttendanceAdjustmentEntity> map = new HashMap<>();
        for (AttendanceAdjustmentEntity a : pending)
            map.put(a.getAttendanceId(), a);
        return map;
    }

    private AttendanceResponse toResponse(AttendanceRecordEntity r, String staffName,
            AttendanceAdjustmentEntity pendingAdj) {
        AttendanceResponse.AttendanceResponseBuilder b = AttendanceResponse.builder()
                .id(r.getId())
                .tenantId(r.getTenantId())
                .restaurantId(r.getRestaurantId())
                .outletId(r.getOutletId())
                .staffId(r.getStaffId())
                .staffName(staffName)
                .shiftAssignmentId(r.getShiftAssignmentId())
                .workDate(r.getWorkDate())
                .clockInTime(r.getClockInTime())
                .clockOutTime(r.getClockOutTime())
                .totalWorkMinutes(r.getTotalWorkMinutes())
                .status(r.getStatus())
                .hasPendingAdjust(r.isHasPendingAdjust());

        if (pendingAdj != null) {
            b.requestedClockInTime(pendingAdj.getRequestedClockInTime());
            b.requestedClockOutTime(pendingAdj.getRequestedClockOutTime());
            b.requestedStatus(pendingAdj.getRequestedStatus());
            b.requestedReason(pendingAdj.getReason());
        }
        return b.build();
    }

    private AttendanceAdjustmentResponse toAdjustmentResponse(AttendanceAdjustmentEntity a) {
        return AttendanceAdjustmentResponse.builder()
                .adjustmentId(a.getId())
                .attendanceId(a.getAttendanceId())
                .requestedByUserId(a.getRequestedByUserId())
                .requestedAt(a.getRequestedAt())
                .originalClockInTime(a.getOriginalClockInTime())
                .originalClockOutTime(a.getOriginalClockOutTime())
                .originalStatus(a.getOriginalStatus())
                .requestedClockInTime(a.getRequestedClockInTime())
                .requestedClockOutTime(a.getRequestedClockOutTime())
                .requestedStatus(a.getRequestedStatus())
                .reason(a.getReason())
                .approveStatus(a.getApproveStatus().name())
                .approvedByUserId(a.getApprovedByUserId())
                .approvedAt(a.getApprovedAt())
                .approveNote(a.getApproveNote())
                .build();
    }
}
