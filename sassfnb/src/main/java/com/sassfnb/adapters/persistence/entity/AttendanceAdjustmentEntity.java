// src/main/java/com/sassfnb/adapters/persistence/entity/AttendanceAdjustmentEntity.java
package com.sassfnb.adapters.persistence.entity;

import com.sassfnb.application.domain.attendance.AttendanceAdjustmentStatus;
import com.sassfnb.application.domain.attendance.AttendanceStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "attendance_adjustments", indexes = {
        @Index(name = "idx_att_adj_tenant_outlet", columnList = "tenant_id,outlet_id"),
        @Index(name = "idx_att_adj_staff", columnList = "staff_id"),
        @Index(name = "idx_att_adj_work_date", columnList = "work_date"),
        @Index(name = "idx_att_adj_approve_status", columnList = "approve_status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttendanceAdjustmentEntity {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    // ===== Scope (mới thêm bằng migration) =====
    @Column(name = "tenant_id")
    private UUID tenantId;

    @Column(name = "restaurant_id")
    private UUID restaurantId;

    @Column(name = "outlet_id")
    private UUID outletId;

    @Column(name = "staff_id")
    private UUID staffId;

    @Column(name = "work_date")
    private LocalDate workDate;

    // ===== Link =====
    @Column(name = "attendance_id", nullable = false)
    private UUID attendanceId;

    @Column(name = "requested_by_user_id", nullable = false)
    private UUID requestedByUserId;

    @Column(name = "requested_at", nullable = false)
    private OffsetDateTime requestedAt;

    // ===== Original =====
    @Column(name = "original_clock_in_time")
    private OffsetDateTime originalClockInTime;

    @Column(name = "original_clock_out_time")
    private OffsetDateTime originalClockOutTime;

    @Enumerated(EnumType.STRING)
    @Column(name = "original_status", length = 32)
    private AttendanceStatus originalStatus;

    // ===== Requested =====
    @Column(name = "requested_clock_in_time")
    private OffsetDateTime requestedClockInTime;

    @Column(name = "requested_clock_out_time")
    private OffsetDateTime requestedClockOutTime;

    @Enumerated(EnumType.STRING)
    @Column(name = "requested_status", length = 32)
    private AttendanceStatus requestedStatus;

    @Column(name = "reason")
    private String reason;

    // ===== Approve workflow =====
    @Enumerated(EnumType.STRING)
    @Column(name = "approve_status", length = 16)
    private AttendanceAdjustmentStatus approveStatus; // PENDING / APPROVED / REJECTED

    @Column(name = "approved_by_user_id")
    private UUID approvedByUserId;

    @Column(name = "approved_at")
    private OffsetDateTime approvedAt;

    @Column(name = "approve_note")
    private String approveNote;

    @CreationTimestamp
    @Column(name = "created_at")
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;
}
