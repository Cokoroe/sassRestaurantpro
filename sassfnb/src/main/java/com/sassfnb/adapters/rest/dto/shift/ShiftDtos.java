// src/main/java/com/sassfnb/adapters/rest/dto/shift/ShiftDtos.java
package com.sassfnb.adapters.rest.dto.shift;

import lombok.*;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

public class ShiftDtos {

        // =========================
        // TEMPLATE (work_shifts)
        // =========================

        @Getter
        @Setter
        public static class ShiftTemplateRequest {
                private UUID outletId; // optional (fallback currentOutletId)
                private String name;
                private LocalTime startTime;
                private LocalTime endTime;
                private Integer breakMinutes; // nullable -> 0
                private String roleRequired; // nullable
                private Boolean isActive; // nullable -> true
                private String status; // optional: OPEN/CLOSED/... (nullable)
        }

        @Getter
        @Setter
        public static class ShiftTemplateUpdateRequest {
                private String name;
                private LocalTime startTime;
                private LocalTime endTime;
                private Integer breakMinutes;
                private String roleRequired;
                private Boolean isActive;
                private String status; // optional
        }

        @Getter
        @Setter
        @Builder
        @NoArgsConstructor
        @AllArgsConstructor
        public static class ShiftTemplateResponse {
                private UUID id;
                private UUID outletId;
                private String name;
                private LocalTime startTime;
                private LocalTime endTime;
                private Integer breakMinutes;
                private String roleRequired;
                private Boolean isActive;
                private String status;
                private Instant createdAt;
                private Instant updatedAt;
        }

        // =========================
        // ASSIGNMENT (shift_assignments)
        // =========================

        @Getter
        @Setter
        public static class ShiftScheduleRequest {
                private UUID outletId; // optional (fallback currentOutletId)
                private List<ShiftScheduleItem> items;
        }

        @Getter
        @Setter
        public static class ShiftScheduleItem {
                private UUID staffId;
                private LocalDate workDate;

                // chọn ca mẫu
                private UUID workShiftId; // template id (nullable)

                // override time (nếu user sửa 7:30-9:30 ...)
                private LocalTime startTime;
                private LocalTime endTime;

                private Integer breakMinutes;
                private String note;

                // ASSIGNED / CANCELED / ...
                private String status;
        }

        @Getter
        @Setter
        public static class ShiftUpdateRequest {
                private UUID staffId; // optional: cho phép đổi nhân viên
                private LocalTime startTime;
                private LocalTime endTime;
                private Integer breakMinutes;
                private String note;
                private String status; // ASSIGNED/CANCELED/...
                private UUID workShiftId; // optional: đổi template link
        }

        @Getter
        @Setter
        public static class ShiftStatusUpdateRequest {
                private String status;
        }

        @Getter
        @Setter
        @Builder
        @NoArgsConstructor
        @AllArgsConstructor
        public static class ShiftAssignmentResponse {
                private UUID id;
                private UUID outletId;
                private UUID staffId;
                private String staffName; // enrich for FE
                private UUID workShiftId; // template id
                private String workShiftName; // template name
                private LocalDate workDate;
                private LocalTime startTime;
                private LocalTime endTime;
                private Integer breakMinutes;
                private String note;
                private String status;
                private Instant createdAt;
                private Instant updatedAt;
        }

        // For "my shifts" query
        @Getter
        @Setter
        public static class MyShiftSearchCriteria {
                private LocalDate dateFrom;
                private LocalDate dateTo;
                private String status; // optional
        }
}
