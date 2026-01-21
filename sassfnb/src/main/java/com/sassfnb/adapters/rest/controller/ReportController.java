package com.sassfnb.adapters.rest.controller;

import com.sassfnb.adapters.rest.dto.report.ReportDtos.*;
import com.sassfnb.application.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/summary")
    @PreAuthorize("hasAnyAuthority('ROOT','OWNER','ADMIN','MANAGER')")
    public SummaryResponse summary(
            @RequestParam(required = false) UUID outletId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {
        return reportService.summary(outletId, fromDate, toDate);
    }

    @GetMapping("/top-items")
    @PreAuthorize("hasAnyAuthority('ROOT','OWNER','ADMIN','MANAGER')")
    public TopItemsResponse topItems(
            @RequestParam(required = false) UUID outletId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(defaultValue = "10") int limit) {
        return reportService.topItems(outletId, fromDate, toDate, limit);
    }

    @GetMapping("/top-categories")
    @PreAuthorize("hasAnyAuthority('ROOT','OWNER','ADMIN','MANAGER')")
    public TopCategoriesResponse topCategories(
            @RequestParam(required = false) UUID outletId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(defaultValue = "10") int limit) {
        return reportService.topCategories(outletId, fromDate, toDate, limit);
    }

    @GetMapping("/peak-hours")
    @PreAuthorize("hasAnyAuthority('ROOT','OWNER','ADMIN','MANAGER')")
    public PeakHoursResponse peakHours(
            @RequestParam(required = false) UUID outletId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {
        return reportService.peakHours(outletId, fromDate, toDate);
    }

    @GetMapping("/table-turnover")
    @PreAuthorize("hasAnyAuthority('ROOT','OWNER','ADMIN','MANAGER')")
    public TableTurnoverResponse tableTurnover(
            @RequestParam(required = false) UUID outletId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {
        return reportService.tableTurnover(outletId, fromDate, toDate);
    }

    @GetMapping("/staff-performance")
    @PreAuthorize("hasAnyAuthority('ROOT','OWNER','ADMIN','MANAGER')")
    public StaffPerformanceResponse staffPerformance(
            @RequestParam(required = false) UUID outletId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {
        return reportService.staffPerformance(outletId, fromDate, toDate);
    }

    // ✅ NEW (cơ bản nhưng rất cần): tổng lương trong khoảng ngày
    @GetMapping("/payroll-summary")
    @PreAuthorize("hasAnyAuthority('ROOT','OWNER','ADMIN','MANAGER')")
    public PayrollSummaryResponse payrollSummary(
            @RequestParam(required = false) UUID outletId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {
        return reportService.payrollSummary(outletId, fromDate, toDate);
    }
}
