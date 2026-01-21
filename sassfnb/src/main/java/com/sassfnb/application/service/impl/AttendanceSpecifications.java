package com.sassfnb.application.service.impl;

import com.sassfnb.adapters.persistence.entity.AttendanceRecordEntity;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;
import java.util.UUID;

public class AttendanceSpecifications {

    public static Specification<AttendanceRecordEntity> byScope(UUID tenantId, UUID outletId) {
        return (root, query, cb) -> cb.and(
                cb.equal(root.get("tenantId"), tenantId),
                cb.equal(root.get("outletId"), outletId));
    }

    public static Specification<AttendanceRecordEntity> staffId(UUID staffId) {
        return (root, query, cb) -> cb.equal(root.get("staffId"), staffId);
    }

    public static Specification<AttendanceRecordEntity> workDate(LocalDate date) {
        return (root, query, cb) -> cb.equal(root.get("workDate"), date);
    }

    public static Specification<AttendanceRecordEntity> dateRange(LocalDate from, LocalDate to) {
        return (root, query, cb) -> cb.between(root.get("workDate"), from, to);
    }

    public static Specification<AttendanceRecordEntity> shiftAssignmentId(UUID shiftAssignmentId) {
        return (root, query, cb) -> cb.equal(root.get("shiftAssignmentId"), shiftAssignmentId);
    }
}
