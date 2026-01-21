package com.sassfnb.adapters.rest.dto.attendance;

import com.sassfnb.application.domain.attendance.AttendanceStatus;
import lombok.*;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

public class AttendanceDtos {

    // =========================
    // CLOCK IN/OUT
    // =========================
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AttendanceClockInRequest {
        private UUID shiftAssignmentId;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AttendanceClockOutRequest {
        private UUID shiftAssignmentId;
    }

    // =========================
    // SEARCH
    // =========================
    @Getter
    @Setter
    @NoArgsConstructor
    public static class AttendanceSearchCriteria {
        private UUID outletId;
        private LocalDate dateFrom;
        private LocalDate dateTo;

        // FE có thể gửi 'self' => BE sẽ resolve ra staffId thật
        private String staffId; // UUID string hoặc "self"

        private AttendanceStatus status;
        private Integer page = 0;
        private Integer size = 20;
    }

    // =========================
    // RESPONSE
    // =========================
    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AttendanceResponse {
        private UUID id;

        private UUID tenantId;
        private UUID restaurantId;
        private UUID outletId;

        private UUID staffId;
        private String staffName;

        private UUID shiftAssignmentId;

        private LocalDate workDate;

        private OffsetDateTime clockInTime;
        private OffsetDateTime clockOutTime;
        private Integer totalWorkMinutes;

        private AttendanceStatus status;
        private boolean hasPendingAdjust;

        // Nếu có adjustment pending thì FE có thể show luôn
        private OffsetDateTime requestedClockInTime;
        private OffsetDateTime requestedClockOutTime;
        private AttendanceStatus requestedStatus;
        private String requestedReason;
    }

    // =========================
    // ADJUST REQUEST
    // =========================
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AttendanceAdjustRequest {
        private OffsetDateTime requestedClockInTime;
        private OffsetDateTime requestedClockOutTime;
        private AttendanceStatus requestedStatus;
        private String reason;
    }

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AttendanceAdjustmentResponse {
        private UUID adjustmentId;
        private UUID attendanceId;

        private UUID requestedByUserId;
        private OffsetDateTime requestedAt;

        private OffsetDateTime originalClockInTime;
        private OffsetDateTime originalClockOutTime;
        private AttendanceStatus originalStatus;

        private OffsetDateTime requestedClockInTime;
        private OffsetDateTime requestedClockOutTime;
        private AttendanceStatus requestedStatus;

        private String reason;

        private String approveStatus; // PENDING/APPROVED/REJECTED
        private UUID approvedByUserId;
        private OffsetDateTime approvedAt;
        private String approveNote;
    }

    // =========================
    // APPROVE REQUEST
    // =========================
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AttendanceApproveRequest {
        private boolean approve;
        private String note;
    }
}
