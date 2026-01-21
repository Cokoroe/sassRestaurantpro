package com.sassfnb.application.service;

import com.sassfnb.adapters.rest.dto.report.ReportDtos.*;

import java.time.LocalDate;
import java.util.UUID;

public interface ReportService {

    SummaryResponse summary(UUID outletId, LocalDate fromDate, LocalDate toDate);

    TopItemsResponse topItems(UUID outletId, LocalDate fromDate, LocalDate toDate, int limit);

    TopCategoriesResponse topCategories(UUID outletId, LocalDate fromDate, LocalDate toDate, int limit);

    PeakHoursResponse peakHours(UUID outletId, LocalDate fromDate, LocalDate toDate);

    TableTurnoverResponse tableTurnover(UUID outletId, LocalDate fromDate, LocalDate toDate);

    StaffPerformanceResponse staffPerformance(UUID outletId, LocalDate fromDate, LocalDate toDate);

    // ✅ NEW
    PayrollSummaryResponse payrollSummary(UUID outletId, LocalDate fromDate, LocalDate toDate);
}
