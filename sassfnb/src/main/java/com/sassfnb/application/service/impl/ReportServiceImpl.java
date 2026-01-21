package com.sassfnb.application.service.impl;

import com.sassfnb.adapters.persistence.repository.ReportRepository;
import com.sassfnb.adapters.rest.dto.report.ReportDtos.*;
import com.sassfnb.application.ports.TenantResolver;
import com.sassfnb.application.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.*;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ReportServiceImpl implements ReportService {

    private static final ZoneId BIZ_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final TenantResolver tenant;
    private final ReportRepository repo;

    @Override
    public SummaryResponse summary(UUID outletId, LocalDate fromDate, LocalDate toDate) {
        UUID tenantId = tenant.currentTenantId();
        UUID outId = resolveOutlet(outletId);

        TimeWindow w = toWindow(fromDate, toDate);

        var row = repo.fetchSummary(tenantId, outId, w.fromTs(), w.toTs());

        BigDecimal gross = nz(row.grossRevenue());
        BigDecimal tips = nz(row.tipsTotal());
        BigDecimal net = gross.subtract(tips);

        BigDecimal aov = BigDecimal.ZERO;
        if (row.ordersCount() > 0) {
            aov = net.divide(BigDecimal.valueOf(row.ordersCount()), 2, RoundingMode.HALF_UP);
        }

        return new SummaryResponse(outId, fromDate, toDate, gross, tips, net, row.ordersCount(), aov);
    }

    @Override
    public TopItemsResponse topItems(UUID outletId, LocalDate fromDate, LocalDate toDate, int limit) {
        UUID tenantId = tenant.currentTenantId();
        UUID outId = resolveOutlet(outletId);

        TimeWindow w = toWindow(fromDate, toDate);
        int lim = normalizeLimit(limit);

        List<ReportRepository.TopItemRow> rows = repo.fetchTopItems(tenantId, outId, w.fromTs(), w.toTs(), lim);

        List<TopItemRow> items = rows.stream()
                .map(r -> new TopItemRow(
                        r.menuItemId(), r.itemName(),
                        r.categoryId(), r.categoryName(),
                        r.qtySold(), nz(r.grossAmount())))
                .toList();

        return new TopItemsResponse(outId, fromDate, toDate, lim, items);
    }

    @Override
    public TopCategoriesResponse topCategories(UUID outletId, LocalDate fromDate, LocalDate toDate, int limit) {
        UUID tenantId = tenant.currentTenantId();
        UUID outId = resolveOutlet(outletId);

        TimeWindow w = toWindow(fromDate, toDate);
        int lim = normalizeLimit(limit);

        List<ReportRepository.TopCategoryRow> rows = repo.fetchTopCategories(tenantId, outId, w.fromTs(), w.toTs(),
                lim);

        List<TopCategoryRow> categories = rows.stream()
                .map(r -> new TopCategoryRow(
                        r.categoryId(), r.categoryName(),
                        r.qtySold(), nz(r.grossAmount())))
                .toList();

        return new TopCategoriesResponse(outId, fromDate, toDate, lim, categories);
    }

    @Override
    public PeakHoursResponse peakHours(UUID outletId, LocalDate fromDate, LocalDate toDate) {
        UUID tenantId = tenant.currentTenantId();
        UUID outId = resolveOutlet(outletId);

        TimeWindow w = toWindow(fromDate, toDate);

        // ✅ FIX: khai báo rows trước
        List<ReportRepository.PeakHourRow> rows = repo.fetchPeakHours(tenantId, outId, w.fromTs(), w.toTs());

        List<PeakHourRow> hours = rows.stream()
                .map(r -> {
                    BigDecimal gross = nz(r.grossRevenue());
                    BigDecimal tips = nz(r.tipsTotal());
                    BigDecimal net = gross.subtract(tips);
                    return new PeakHourRow(r.hourOfDay(), r.ordersCount(), gross, tips, net);
                })
                .toList();

        return new PeakHoursResponse(outId, fromDate, toDate, hours);
    }

    @Override
    public TableTurnoverResponse tableTurnover(UUID outletId, LocalDate fromDate, LocalDate toDate) {
        UUID tenantId = tenant.currentTenantId();
        UUID outId = resolveOutlet(outletId);

        TimeWindow w = toWindow(fromDate, toDate);

        List<TableTurnoverRow> tables = repo.fetchTableTurnover(tenantId, outId, w.fromTs(), w.toTs())
                .stream()
                .map(r -> new TableTurnoverRow(
                        r.tableId(), r.tableCode(), r.tableName(), r.groupCode(),
                        r.ordersCount(),
                        nz(r.grossRevenue()),
                        nz(r.netRevenue()),
                        nz(r.avgOccupancyMinutes())))
                .toList();

        return new TableTurnoverResponse(outId, fromDate, toDate, tables);
    }

    @Override
    public StaffPerformanceResponse staffPerformance(UUID outletId, LocalDate fromDate, LocalDate toDate) {
        UUID tenantId = tenant.currentTenantId();
        UUID outId = resolveOutlet(outletId);

        TimeWindow w = toWindow(fromDate, toDate);

        List<StaffPerformanceRow> staffs = repo
                .fetchStaffPerformance(tenantId, outId, w.fromTs(), w.toTs(), fromDate, toDate)
                .stream()
                .map(r -> new StaffPerformanceRow(
                        r.staffId(), r.userId(),
                        r.staffCode(), r.position(), r.status(),
                        r.ordersHandled(),
                        nz(r.tipsTotal()),
                        nz(r.hoursWorked())))
                .toList();

        return new StaffPerformanceResponse(outId, fromDate, toDate, staffs);
    }

    @Override
    public PayrollSummaryResponse payrollSummary(UUID outletId, LocalDate fromDate, LocalDate toDate) {
        UUID tenantId = tenant.currentTenantId();
        UUID outId = resolveOutlet(outletId);

        var row = repo.fetchPayrollSummary(tenantId, outId, fromDate, toDate);

        return new PayrollSummaryResponse(
                outId, fromDate, toDate,
                nz(row.totalHours()),
                nz(row.grossPay()),
                nz(row.tipsAmount()),
                nz(row.netPay()));
    }

    // ===== helpers =====

    private UUID resolveOutlet(UUID outletId) {
        return outletId != null ? outletId : tenant.currentOutletId();
    }

    private static int normalizeLimit(int limit) {
        if (limit <= 0)
            return 10;
        return Math.min(limit, 100);
    }

    private static TimeWindow toWindow(LocalDate fromDate, LocalDate toDate) {
        if (fromDate == null || toDate == null)
            throw new IllegalArgumentException("fromDate and toDate are required");
        if (fromDate.isAfter(toDate))
            throw new IllegalArgumentException("fromDate must be <= toDate");

        Instant fromTs = fromDate.atStartOfDay(BIZ_ZONE).toInstant();
        Instant toTs = toDate.plusDays(1).atStartOfDay(BIZ_ZONE).toInstant(); // exclusive
        return new TimeWindow(fromTs, toTs);
    }

    private static BigDecimal nz(BigDecimal v) {
        return v == null ? BigDecimal.ZERO : v;
    }
}
