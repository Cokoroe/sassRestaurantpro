package com.sassfnb.adapters.persistence.entity;

import com.sassfnb.application.domain.attendance.AttendanceStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "attendance_records", indexes = {
        @Index(name = "idx_att_rec_tenant_outlet_date", columnList = "tenant_id,outlet_id,work_date"),
        @Index(name = "idx_att_rec_staff_date", columnList = "staff_id,work_date"),
        @Index(name = "idx_att_rec_shift_assignment", columnList = "shift_assignment_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttendanceRecordEntity {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "restaurant_id", nullable = false)
    private UUID restaurantId;

    @Column(name = "outlet_id", nullable = false)
    private UUID outletId;

    @Column(name = "staff_id", nullable = false)
    private UUID staffId;

    @Column(name = "shift_assignment_id", nullable = false)
    private UUID shiftAssignmentId;

    @Column(name = "work_date", nullable = false)
    private LocalDate workDate;

    @Column(name = "clock_in_time")
    private OffsetDateTime clockInTime;

    @Column(name = "clock_out_time")
    private OffsetDateTime clockOutTime;

    @Column(name = "total_work_minutes", nullable = false)
    @Builder.Default
    private Integer totalWorkMinutes = 0;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 32)
    @Builder.Default
    private AttendanceStatus status = AttendanceStatus.PRESENT;

    @Column(name = "has_pending_adjust", nullable = false)
    @Builder.Default
    private boolean hasPendingAdjust = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;
}
