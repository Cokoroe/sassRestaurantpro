// src/main/java/com/sassfnb/application/service/AttendanceService.java
package com.sassfnb.application.service;

import com.sassfnb.adapters.rest.dto.attendance.AttendanceDtos.*;
import org.springframework.data.domain.Page;

import java.util.UUID;

public interface AttendanceService {

    AttendanceResponse clockIn(AttendanceClockInRequest request);

    AttendanceResponse clockOut(AttendanceClockOutRequest request);

    Page<AttendanceResponse> search(AttendanceSearchCriteria criteria);

    AttendanceAdjustmentResponse requestAdjustment(UUID attendanceId, AttendanceAdjustRequest request);

    AttendanceAdjustmentResponse approveAdjustment(UUID attendanceId, AttendanceApproveRequest request);

    /**
     * Được gọi khi chốt 1 shift assignment (PATCH /shifts/{shiftId}/status =
     * CLOSED)
     * để auto tạo bản ghi ABSENT nếu staff không clock-in.
     */
    void handleShiftAssignmentClosed(UUID shiftAssignmentId);
}
