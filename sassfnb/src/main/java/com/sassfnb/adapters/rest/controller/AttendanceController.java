package com.sassfnb.adapters.rest.controller;

import com.sassfnb.adapters.rest.dto.attendance.AttendanceDtos.*;
import com.sassfnb.application.domain.attendance.AttendanceStatus;
import com.sassfnb.application.service.AttendanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/attendance")
@RequiredArgsConstructor
public class AttendanceController {

    private final AttendanceService attendanceService;

    /** Staff tự chấm công */
    @PostMapping("/clock-in")
    @PreAuthorize("hasAnyAuthority('ROOT','OWNER','ADMIN','MANAGER','STAFF')")
    public AttendanceResponse clockIn(@RequestBody AttendanceClockInRequest request) {
        return attendanceService.clockIn(request);
    }

    @PostMapping("/clock-out")
    @PreAuthorize("hasAnyAuthority('ROOT','OWNER','ADMIN','MANAGER','STAFF')")
    public AttendanceResponse clockOut(@RequestBody AttendanceClockOutRequest request) {
        return attendanceService.clockOut(request);
    }

    /**
     * Search report (Manager) hoặc MyAttendance (Staff) tuỳ staffId:
     * - staffId = "self" => trả công của user hiện tại
     * - staffId = UUID => filter theo staff cụ thể
     * - staffId null => report all (theo outlet + date range)
     */
    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROOT','OWNER','ADMIN','MANAGER','STAFF')")
    public Page<AttendanceResponse> search(
            @RequestParam(required = false) UUID outletId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo,
            @RequestParam(required = false) String staffId, // <== IMPORTANT: support "self"
            @RequestParam(required = false) AttendanceStatus status,
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "20") Integer size) {
        AttendanceSearchCriteria criteria = new AttendanceSearchCriteria();
        criteria.setOutletId(outletId);
        criteria.setDateFrom(dateFrom);
        criteria.setDateTo(dateTo);
        criteria.setStaffId(staffId);
        criteria.setStatus(status);
        criteria.setPage(page);
        criteria.setSize(size);
        return attendanceService.search(criteria);
    }

    /** Staff xin điều chỉnh */
    @PostMapping("/{attendanceId}/adjust")
    @PreAuthorize("hasAnyAuthority('ROOT','OWNER','ADMIN','MANAGER','STAFF')")
    public AttendanceAdjustmentResponse requestAdjustment(
            @PathVariable UUID attendanceId,
            @RequestBody AttendanceAdjustRequest request) {
        return attendanceService.requestAdjustment(attendanceId, request);
    }

    /** Manager duyệt điều chỉnh */
    @PostMapping("/{attendanceId}/approve")
    @PreAuthorize("hasAnyAuthority('ROOT','OWNER','ADMIN','MANAGER')")
    public AttendanceAdjustmentResponse approveAdjustment(
            @PathVariable UUID attendanceId,
            @RequestBody AttendanceApproveRequest request) {
        return attendanceService.approveAdjustment(attendanceId, request);
    }
}
