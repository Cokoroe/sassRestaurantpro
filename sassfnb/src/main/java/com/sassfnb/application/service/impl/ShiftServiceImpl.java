// src/main/java/com/sassfnb/application/service/impl/ShiftServiceImpl.java
package com.sassfnb.application.service.impl;

import com.sassfnb.adapters.persistence.entity.ShiftAssignmentEntity;
import com.sassfnb.adapters.persistence.entity.StaffEntity;
import com.sassfnb.adapters.persistence.entity.WorkShiftEntity;
import com.sassfnb.adapters.persistence.repository.ShiftAssignmentRepository;
import com.sassfnb.adapters.persistence.repository.StaffRepository;
import com.sassfnb.adapters.persistence.repository.WorkShiftRepository;
import com.sassfnb.adapters.rest.dto.shift.ShiftDtos.*;
import com.sassfnb.application.ports.TenantResolver;
import com.sassfnb.application.service.ShiftService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

import com.sassfnb.application.service.AttendanceService;

@Service
@RequiredArgsConstructor
public class ShiftServiceImpl implements ShiftService {

    private final TenantResolver tenantResolver;
    private final WorkShiftRepository workShiftRepo;
    private final ShiftAssignmentRepository assignmentRepo;
    private final StaffRepository staffRepo;

    // ✅ NEW
    private final AttendanceService attendanceService;

    // =========================
    // TEMPLATE
    // =========================

    @Override
    @Transactional(readOnly = true)
    public List<ShiftTemplateResponse> listTemplates(UUID outletId) {
        UUID tenantId = tenantResolver.currentTenantId();
        UUID resolvedOutletId = (outletId != null) ? outletId : tenantResolver.currentOutletId();

        // FE: thường muốn xem cả active/inactive để quản trị -> dùng
        // findByTenantIdAndOutletId
        return workShiftRepo.findByTenantIdAndOutletId(tenantId, resolvedOutletId)
                .stream()
                .map(this::toTemplateResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ShiftTemplateResponse createTemplate(ShiftTemplateRequest req) {
        UUID tenantId = tenantResolver.currentTenantId();
        UUID outletId = (req.getOutletId() != null) ? req.getOutletId() : tenantResolver.currentOutletId();

        validateTime(req.getStartTime(), req.getEndTime());

        WorkShiftEntity e = new WorkShiftEntity();
        e.setTenantId(tenantId);
        e.setOutletId(outletId);
        e.setName(requireText(req.getName(), "name"));
        e.setStartTime(req.getStartTime());
        e.setEndTime(req.getEndTime());
        e.setBreakMinutes(Optional.ofNullable(req.getBreakMinutes()).orElse(0));
        e.setRoleRequired(req.getRoleRequired());
        e.setActive(req.getIsActive() == null || req.getIsActive());
        e.setStatus(req.getStatus()); // nullable OK

        return toTemplateResponse(workShiftRepo.save(e));
    }

    @Override
    @Transactional
    public ShiftTemplateResponse updateTemplate(UUID templateId, ShiftTemplateUpdateRequest req) {
        UUID tenantId = tenantResolver.currentTenantId();

        WorkShiftEntity e = workShiftRepo.findByIdAndTenantId(templateId, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Shift template not found"));

        if (req.getStartTime() != null || req.getEndTime() != null) {
            LocalTime start = (req.getStartTime() != null) ? req.getStartTime() : e.getStartTime();
            LocalTime end = (req.getEndTime() != null) ? req.getEndTime() : e.getEndTime();
            validateTime(start, end);
            e.setStartTime(start);
            e.setEndTime(end);
        }

        if (req.getName() != null)
            e.setName(req.getName());
        if (req.getBreakMinutes() != null)
            e.setBreakMinutes(req.getBreakMinutes());
        if (req.getRoleRequired() != null)
            e.setRoleRequired(req.getRoleRequired());
        if (req.getIsActive() != null)
            e.setActive(req.getIsActive());
        if (req.getStatus() != null)
            e.setStatus(req.getStatus());

        return toTemplateResponse(workShiftRepo.save(e));
    }

    @Override
    @Transactional
    public void deleteTemplate(UUID templateId) {
        UUID tenantId = tenantResolver.currentTenantId();

        WorkShiftEntity e = workShiftRepo.findByIdAndTenantId(templateId, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Shift template not found"));

        // soft delete: set is_active=false (khớp entity bạn đang có)
        e.setActive(false);
        workShiftRepo.save(e);
    }

    // =========================
    // SCHEDULE
    // =========================

    @Override
    @Transactional
    public List<ShiftAssignmentResponse> schedule(ShiftScheduleRequest req) {
        UUID tenantId = tenantResolver.currentTenantId();
        UUID outletId = (req.getOutletId() != null) ? req.getOutletId() : tenantResolver.currentOutletId();

        if (req.getItems() == null || req.getItems().isEmpty())
            return List.of();

        // load templates referenced
        Set<UUID> templateIds = req.getItems().stream()
                .map(ShiftScheduleItem::getWorkShiftId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        Map<UUID, WorkShiftEntity> templateMap = new HashMap<>();
        if (!templateIds.isEmpty()) {
            // load by id (and tenant check)
            List<WorkShiftEntity> all = workShiftRepo.findAllById(templateIds);
            for (WorkShiftEntity t : all) {
                if (!tenantId.equals(t.getTenantId()))
                    continue;
                templateMap.put(t.getId(), t);
            }
        }

        // pre-load staff names for enrich
        Set<UUID> staffIds = req.getItems().stream().map(ShiftScheduleItem::getStaffId).collect(Collectors.toSet());
        Map<UUID, StaffEntity> staffMap = staffRepo.findAllById(staffIds).stream()
                .filter(s -> tenantId.equals(s.getTenantId()))
                .collect(Collectors.toMap(StaffEntity::getId, s -> s, (a, b) -> a));

        // create assignments
        List<ShiftAssignmentEntity> toSave = new ArrayList<>();

        for (ShiftScheduleItem it : req.getItems()) {
            if (it.getStaffId() == null)
                throw new IllegalArgumentException("staffId is required");
            if (it.getWorkDate() == null)
                throw new IllegalArgumentException("workDate is required");

            StaffEntity staff = staffMap.get(it.getStaffId());
            if (staff == null)
                throw new IllegalArgumentException("Invalid staffId (not in tenant)");

            // time resolve: override > template > required
            LocalTime start;
            LocalTime end;
            Integer breakMin = Optional.ofNullable(it.getBreakMinutes()).orElse(0);

            WorkShiftEntity template = null;
            if (it.getWorkShiftId() != null) {
                template = templateMap.get(it.getWorkShiftId());
                if (template == null)
                    throw new IllegalArgumentException("Invalid workShiftId (template) or not in tenant");
            }

            if (it.getStartTime() != null && it.getEndTime() != null) {
                start = it.getStartTime();
                end = it.getEndTime();
            } else if (template != null) {
                start = template.getStartTime();
                end = template.getEndTime();
                if (it.getBreakMinutes() == null) {
                    breakMin = Optional.ofNullable(template.getBreakMinutes()).orElse(0);
                }
            } else {
                throw new IllegalArgumentException("startTime/endTime required if workShiftId is null");
            }

            validateTime(start, end);

            // optional: chặn overlap trong cùng ngày cho 1 staff
            assertNoOverlap(tenantId, it.getStaffId(), it.getWorkDate(), start, end);

            ShiftAssignmentEntity a = new ShiftAssignmentEntity();
            a.setTenantId(tenantId);
            a.setOutletId(outletId);
            a.setStaffId(it.getStaffId());
            a.setWorkShiftId(it.getWorkShiftId());
            a.setWorkDate(it.getWorkDate());
            a.setStartTime(start);
            a.setEndTime(end);
            a.setBreakMinutes(breakMin);
            a.setNote(it.getNote());
            a.setStatus(it.getStatus() != null ? it.getStatus() : "ASSIGNED");

            toSave.add(a);
        }

        List<ShiftAssignmentEntity> saved = assignmentRepo.saveAll(toSave);

        // enrich template + staff
        Map<UUID, WorkShiftEntity> templateMapFull = new HashMap<>(templateMap);
        Set<UUID> missingTemplateIds = saved.stream()
                .map(ShiftAssignmentEntity::getWorkShiftId)
                .filter(Objects::nonNull)
                .filter(id -> !templateMapFull.containsKey(id))
                .collect(Collectors.toSet());
        if (!missingTemplateIds.isEmpty()) {
            for (WorkShiftEntity t : workShiftRepo.findAllById(missingTemplateIds)) {
                if (tenantId.equals(t.getTenantId()))
                    templateMapFull.put(t.getId(), t);
            }
        }

        return saved.stream()
                .map(a -> toAssignmentResponse(a, staffMap.get(a.getStaffId()),
                        templateMapFull.get(a.getWorkShiftId())))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ShiftAssignmentResponse> search(UUID outletId, LocalDate dateFrom, LocalDate dateTo, UUID staffId,
            String status) {
        UUID tenantId = tenantResolver.currentTenantId();
        UUID resolvedOutletId = (outletId != null) ? outletId : tenantResolver.currentOutletId();

        if (dateFrom == null || dateTo == null)
            throw new IllegalArgumentException("dateFrom/dateTo required");

        List<ShiftAssignmentEntity> list = (staffId == null)
                ? assignmentRepo.findByTenantIdAndOutletIdAndWorkDateBetween(tenantId, resolvedOutletId, dateFrom,
                        dateTo)
                : assignmentRepo.findByTenantIdAndOutletIdAndStaffIdAndWorkDateBetween(tenantId, resolvedOutletId,
                        staffId, dateFrom, dateTo);

        if (status != null && !status.isBlank()) {
            list = list.stream().filter(a -> status.equalsIgnoreCase(a.getStatus())).toList();
        }

        // enrich
        Set<UUID> staffIds = list.stream().map(ShiftAssignmentEntity::getStaffId).collect(Collectors.toSet());
        Map<UUID, StaffEntity> staffMap = staffRepo.findAllById(staffIds).stream()
                .filter(s -> tenantId.equals(s.getTenantId()))
                .collect(Collectors.toMap(StaffEntity::getId, s -> s, (a, b) -> a));

        Set<UUID> templateIds = list.stream().map(ShiftAssignmentEntity::getWorkShiftId).filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Map<UUID, WorkShiftEntity> templateMap = workShiftRepo.findAllById(templateIds).stream()
                .filter(t -> tenantId.equals(t.getTenantId()))
                .collect(Collectors.toMap(WorkShiftEntity::getId, t -> t, (a, b) -> a));

        return list.stream()
                .map(a -> toAssignmentResponse(a, staffMap.get(a.getStaffId()), templateMap.get(a.getWorkShiftId())))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ShiftAssignmentResponse update(UUID shiftId, ShiftUpdateRequest req) {
        UUID tenantId = tenantResolver.currentTenantId();

        ShiftAssignmentEntity a = assignmentRepo.findById(shiftId)
                .orElseThrow(() -> new IllegalArgumentException("Shift assignment not found"));

        if (!tenantId.equals(a.getTenantId())) {
            throw new IllegalArgumentException("Forbidden (tenant mismatch)");
        }

        // allow change staff
        if (req.getStaffId() != null)
            a.setStaffId(req.getStaffId());
        if (req.getWorkShiftId() != null)
            a.setWorkShiftId(req.getWorkShiftId());
        if (req.getStartTime() != null)
            a.setStartTime(req.getStartTime());
        if (req.getEndTime() != null)
            a.setEndTime(req.getEndTime());
        if (req.getBreakMinutes() != null)
            a.setBreakMinutes(req.getBreakMinutes());
        if (req.getNote() != null)
            a.setNote(req.getNote());
        if (req.getStatus() != null)
            a.setStatus(req.getStatus());

        validateTime(a.getStartTime(), a.getEndTime());
        assertNoOverlap(tenantId, a.getStaffId(), a.getWorkDate(), a.getStartTime(), a.getEndTime(), a.getId());

        ShiftAssignmentEntity saved = assignmentRepo.save(a);

        StaffEntity staff = staffRepo.findById(saved.getStaffId()).orElse(null);
        WorkShiftEntity template = (saved.getWorkShiftId() != null)
                ? workShiftRepo.findById(saved.getWorkShiftId()).orElse(null)
                : null;

        return toAssignmentResponse(saved,
                (staff != null && tenantId.equals(staff.getTenantId())) ? staff : null,
                (template != null && tenantId.equals(template.getTenantId())) ? template : null);
    }

    @Override
    @Transactional
    public void updateShiftStatus(UUID shiftId, String status) {
        UUID tenantId = tenantResolver.currentTenantId();

        ShiftAssignmentEntity a = assignmentRepo.findById(shiftId)
                .orElseThrow(() -> new IllegalArgumentException("Shift assignment not found"));

        if (!tenantId.equals(a.getTenantId()))
            throw new IllegalArgumentException("Forbidden (tenant mismatch)");

        String newStatus = requireText(status, "status").trim().toUpperCase();
        a.setStatus(newStatus);
        assignmentRepo.save(a);

        // ✅ FIX A: nếu chốt ca -> tạo ABSENT nếu chưa có record
        if ("CLOSED".equals(newStatus) || "DONE".equals(newStatus)) {
            attendanceService.handleShiftAssignmentClosed(a.getId());
        }
    }
    // =========================
    // MY SHIFTS (STAFF)
    // =========================

    @Override
    @Transactional(readOnly = true)
    public List<ShiftAssignmentResponse> myShifts(MyShiftSearchCriteria criteria) {
        UUID tenantId = tenantResolver.currentTenantId();
        UUID outletId = tenantResolver.currentOutletId();
        UUID userId = tenantResolver.currentUserId();

        StaffEntity staff = staffRepo.findFirstByTenantIdAndUserId(tenantId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Staff profile not found for current user"));

        LocalDate from = criteria.getDateFrom() != null ? criteria.getDateFrom() : LocalDate.now();
        LocalDate to = criteria.getDateTo() != null ? criteria.getDateTo() : from.plusDays(14);

        List<ShiftAssignmentEntity> list = assignmentRepo.findByTenantIdAndOutletIdAndStaffIdAndWorkDateBetween(
                tenantId, outletId, staff.getId(), from, to);

        if (criteria.getStatus() != null && !criteria.getStatus().isBlank()) {
            list = list.stream().filter(a -> criteria.getStatus().equalsIgnoreCase(a.getStatus())).toList();
        }

        Set<UUID> templateIds = list.stream().map(ShiftAssignmentEntity::getWorkShiftId).filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Map<UUID, WorkShiftEntity> templateMap = workShiftRepo.findAllById(templateIds).stream()
                .filter(t -> tenantId.equals(t.getTenantId()))
                .collect(Collectors.toMap(WorkShiftEntity::getId, t -> t, (a, b) -> a));

        return list.stream()
                .map(a -> toAssignmentResponse(a, staff, templateMap.get(a.getWorkShiftId())))
                .collect(Collectors.toList());
    }

    // =========================
    // MAPPERS + VALIDATION
    // =========================

    private ShiftTemplateResponse toTemplateResponse(WorkShiftEntity e) {
        return ShiftTemplateResponse.builder()
                .id(e.getId())
                .outletId(e.getOutletId())
                .name(e.getName())
                .startTime(e.getStartTime())
                .endTime(e.getEndTime())
                .breakMinutes(e.getBreakMinutes())
                .roleRequired(e.getRoleRequired())
                .isActive(e.isActive())
                .status(e.getStatus())
                .createdAt(e.getCreatedAt())
                .updatedAt(e.getUpdatedAt())
                .build();
    }

    private ShiftAssignmentResponse toAssignmentResponse(ShiftAssignmentEntity a, StaffEntity staff,
            WorkShiftEntity template) {
        String staffName = null;
        if (staff != null) {
            // bạn có thể đổi sang fullName nếu có, ở đây tạm dùng code/position
            staffName = (staff.getCode() != null && !staff.getCode().isBlank()) ? staff.getCode()
                    : staff.getId().toString();
        }

        return ShiftAssignmentResponse.builder()
                .id(a.getId())
                .outletId(a.getOutletId())
                .staffId(a.getStaffId())
                .staffName(staffName)
                .workShiftId(a.getWorkShiftId())
                .workShiftName(template != null ? template.getName() : null)
                .workDate(a.getWorkDate())
                .startTime(a.getStartTime())
                .endTime(a.getEndTime())
                .breakMinutes(a.getBreakMinutes())
                .note(a.getNote())
                .status(a.getStatus())
                .createdAt(a.getCreatedAt())
                .updatedAt(a.getUpdatedAt())
                .build();
    }

    private void validateTime(LocalTime start, LocalTime end) {
        if (start == null || end == null)
            throw new IllegalArgumentException("startTime/endTime required");
        if (!end.isAfter(start))
            throw new IllegalArgumentException("endTime must be after startTime");
    }

    private String requireText(String s, String field) {
        if (s == null || s.isBlank())
            throw new IllegalArgumentException(field + " is required");
        return s.trim();
    }

    // overlap check: same day for staff
    private void assertNoOverlap(UUID tenantId, UUID staffId, LocalDate date, LocalTime start, LocalTime end) {
        assertNoOverlap(tenantId, staffId, date, start, end, null);
    }

    private void assertNoOverlap(UUID tenantId, UUID staffId, LocalDate date, LocalTime start, LocalTime end,
            UUID excludeAssignmentId) {
        List<ShiftAssignmentEntity> existing = assignmentRepo.findByTenantIdAndStaffIdAndWorkDate(tenantId, staffId,
                date);
        for (ShiftAssignmentEntity e : existing) {
            if (excludeAssignmentId != null && excludeAssignmentId.equals(e.getId()))
                continue;
            if (overlap(start, end, e.getStartTime(), e.getEndTime())) {
                throw new IllegalArgumentException("Shift time overlaps existing assignment for staff on " + date);
            }
        }
    }

    private boolean overlap(LocalTime s1, LocalTime e1, LocalTime s2, LocalTime e2) {
        // overlap if s1 < e2 && s2 < e1
        return s1.isBefore(e2) && s2.isBefore(e1);
    }
}
