package com.sassfnb.adapters.rest.dto.report;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public class ReportDtos {

        // ===== Summary =====
        public record SummaryResponse(
                        UUID outletId,
                        LocalDate fromDate,
                        LocalDate toDate,
                        BigDecimal grossRevenue,
                        BigDecimal tipsTotal,
                        BigDecimal netRevenue,
                        long ordersCount,
                        BigDecimal aovNet) {
        }

        // ===== Top Items =====
        public record TopItemRow(
                        UUID menuItemId,
                        String itemName,
                        UUID categoryId,
                        String categoryName,
                        long qtySold,
                        BigDecimal grossAmount) {
        }

        public record TopItemsResponse(
                        UUID outletId,
                        LocalDate fromDate,
                        LocalDate toDate,
                        int limit,
                        List<TopItemRow> items) {
        }

        // ===== Top Categories =====
        public record TopCategoryRow(
                        UUID categoryId,
                        String categoryName,
                        long qtySold,
                        BigDecimal grossAmount) {
        }

        public record TopCategoriesResponse(
                        UUID outletId,
                        LocalDate fromDate,
                        LocalDate toDate,
                        int limit,
                        List<TopCategoryRow> categories) {
        }

        // ===== Peak Hours =====
        public record PeakHourRow(
                        int hourOfDay,
                        long ordersCount,
                        BigDecimal grossRevenue,
                        BigDecimal tipsTotal,
                        BigDecimal netRevenue) {
        }

        public record PeakHoursResponse(
                        UUID outletId,
                        LocalDate fromDate,
                        LocalDate toDate,
                        List<PeakHourRow> hours) {
        }

        // ===== Table Turnover =====
        public record TableTurnoverRow(
                        UUID tableId,
                        String tableCode,
                        String tableName,
                        String groupCode,
                        long ordersCount,
                        BigDecimal grossRevenue,
                        BigDecimal netRevenue,
                        BigDecimal avgOccupancyMinutes) {
        }

        public record TableTurnoverResponse(
                        UUID outletId,
                        LocalDate fromDate,
                        LocalDate toDate,
                        List<TableTurnoverRow> tables) {
        }

        // ===== Staff Performance =====
        public record StaffPerformanceRow(
                        UUID staffId,
                        UUID userId,
                        String staffCode,
                        String position,
                        String status,
                        long ordersHandled,
                        BigDecimal tipsTotal,
                        BigDecimal hoursWorked) {
        }

        public record StaffPerformanceResponse(
                        UUID outletId,
                        LocalDate fromDate,
                        LocalDate toDate,
                        List<StaffPerformanceRow> staffs) {
        }

        // ✅ NEW: Payroll Summary (tổng lương)
        public record PayrollSummaryResponse(
                        UUID outletId,
                        LocalDate fromDate,
                        LocalDate toDate,
                        BigDecimal totalHours,
                        BigDecimal grossPay,
                        BigDecimal tipsAmount,
                        BigDecimal netPay) {
        }

        // ===== internal =====
        public record TimeWindow(Instant fromTs, Instant toTs) {
        }
}
