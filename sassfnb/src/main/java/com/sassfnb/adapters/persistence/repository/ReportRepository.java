package com.sassfnb.adapters.persistence.repository;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.*;
import java.util.*;

@Repository
@RequiredArgsConstructor
public class ReportRepository {

    private final NamedParameterJdbcTemplate jdbc;

    // NOTE: status payments của bạn: PENDING | CONFIRMED | VOIDED
    private static final String PAID_STATUS = "CONFIRMED";

    // ✅ FIX: JDBC đôi khi không infer được Instant -> timestamptz
    // Chuyển sang OffsetDateTime (UTC) trước khi bind param
    private static OffsetDateTime toOdt(Instant instant) {
        if (instant == null)
            return null;
        return OffsetDateTime.ofInstant(instant, ZoneOffset.UTC);
    }

    // ========= SUMMARY =========
    public SummaryRow fetchSummary(UUID tenantId, UUID outletId, Instant fromTs, Instant toTs) {
        String sql = """
                    select
                        coalesce(sum(p.amount), 0) as gross_revenue,
                        coalesce(sum(p.tips_total), 0) as tips_total,
                        count(distinct p.order_id) as orders_count
                    from payments p
                    where p.tenant_id = :tenantId
                      and p.outlet_id = :outletId
                      and p.paid_at >= :fromTs
                      and p.paid_at < :toTs
                      and p.status = :paidStatus
                """;

        Map<String, Object> params = new HashMap<>();
        params.put("tenantId", tenantId);
        params.put("outletId", outletId);
        params.put("fromTs", toOdt(fromTs)); // ✅ FIX
        params.put("toTs", toOdt(toTs)); // ✅ FIX
        params.put("paidStatus", PAID_STATUS);

        return jdbc.queryForObject(sql, params, (rs, i) -> new SummaryRow(
                nvl(rs.getBigDecimal("gross_revenue")),
                nvl(rs.getBigDecimal("tips_total")),
                rs.getLong("orders_count")));
    }

    public record SummaryRow(BigDecimal grossRevenue, BigDecimal tipsTotal, long ordersCount) {
    }

    // ========= TOP ITEMS =========
    public List<TopItemRow> fetchTopItems(UUID tenantId, UUID outletId, Instant fromTs, Instant toTs, int limit) {
        String sql = """
                    with paid_orders as (
                        select distinct p.order_id
                        from payments p
                        where p.tenant_id = :tenantId
                          and p.outlet_id = :outletId
                          and p.paid_at >= :fromTs
                          and p.paid_at < :toTs
                          and p.status = :paidStatus
                          and p.order_id is not null
                    )
                    select
                        oi.menu_item_id,
                        mi.name as item_name,
                        mi.category_id,
                        mc.name as category_name,
                        coalesce(sum(oi.quantity), 0) as qty_sold,
                        coalesce(sum(oi.total_amount), 0) as gross_amount
                    from order_items oi
                    join paid_orders po on po.order_id = oi.order_id
                    join menu_items mi on mi.id = oi.menu_item_id
                    left join menu_categories mc on mc.id = mi.category_id
                    where oi.tenant_id = :tenantId
                    group by oi.menu_item_id, mi.name, mi.category_id, mc.name
                    order by qty_sold desc, gross_amount desc
                    limit :limit
                """;

        Map<String, Object> params = new HashMap<>();
        params.put("tenantId", tenantId);
        params.put("outletId", outletId);
        params.put("fromTs", toOdt(fromTs)); // ✅ FIX
        params.put("toTs", toOdt(toTs)); // ✅ FIX
        params.put("paidStatus", PAID_STATUS);
        params.put("limit", limit);

        return jdbc.query(sql, params, new TopItemRowMapper());
    }

    public record TopItemRow(
            UUID menuItemId,
            String itemName,
            UUID categoryId,
            String categoryName,
            long qtySold,
            BigDecimal grossAmount) {
    }

    static class TopItemRowMapper implements RowMapper<TopItemRow> {
        @Override
        public TopItemRow mapRow(ResultSet rs, int rowNum) throws SQLException {
            return new TopItemRow(
                    (UUID) rs.getObject("menu_item_id"),
                    rs.getString("item_name"),
                    (UUID) rs.getObject("category_id"),
                    rs.getString("category_name"),
                    rs.getLong("qty_sold"),
                    nvl(rs.getBigDecimal("gross_amount")));
        }
    }

    // ========= TOP CATEGORIES =========
    public List<TopCategoryRow> fetchTopCategories(UUID tenantId, UUID outletId, Instant fromTs, Instant toTs,
            int limit) {
        String sql = """
                    with paid_orders as (
                        select distinct p.order_id
                        from payments p
                        where p.tenant_id = :tenantId
                          and p.outlet_id = :outletId
                          and p.paid_at >= :fromTs
                          and p.paid_at < :toTs
                          and p.status = :paidStatus
                          and p.order_id is not null
                    )
                    select
                        mc.id as category_id,
                        mc.name as category_name,
                        coalesce(sum(oi.quantity), 0) as qty_sold,
                        coalesce(sum(oi.total_amount), 0) as gross_amount
                    from order_items oi
                    join paid_orders po on po.order_id = oi.order_id
                    join menu_items mi on mi.id = oi.menu_item_id
                    join menu_categories mc on mc.id = mi.category_id
                    where oi.tenant_id = :tenantId
                    group by mc.id, mc.name
                    order by qty_sold desc, gross_amount desc
                    limit :limit
                """;

        Map<String, Object> params = new HashMap<>();
        params.put("tenantId", tenantId);
        params.put("outletId", outletId);
        params.put("fromTs", toOdt(fromTs)); // ✅ FIX
        params.put("toTs", toOdt(toTs)); // ✅ FIX
        params.put("paidStatus", PAID_STATUS);
        params.put("limit", limit);

        return jdbc.query(sql, params, (rs, i) -> new TopCategoryRow(
                (UUID) rs.getObject("category_id"),
                rs.getString("category_name"),
                rs.getLong("qty_sold"),
                nvl(rs.getBigDecimal("gross_amount"))));
    }

    public record TopCategoryRow(UUID categoryId, String categoryName, long qtySold, BigDecimal grossAmount) {
    }

    // ========= PEAK HOURS =========
    public List<PeakHourRow> fetchPeakHours(UUID tenantId, UUID outletId, Instant fromTs, Instant toTs) {
        String sql = """
                    select
                        extract(hour from p.paid_at) as hour_of_day,
                        count(distinct p.order_id) as orders_count,
                        coalesce(sum(p.amount), 0) as gross_revenue,
                        coalesce(sum(p.tips_total), 0) as tips_total
                    from payments p
                    where p.tenant_id = :tenantId
                      and p.outlet_id = :outletId
                      and p.paid_at >= :fromTs
                      and p.paid_at < :toTs
                      and p.status = :paidStatus
                      and p.order_id is not null
                    group by extract(hour from p.paid_at)
                    order by hour_of_day asc
                """;

        Map<String, Object> params = new HashMap<>();
        params.put("tenantId", tenantId);
        params.put("outletId", outletId);
        params.put("fromTs", toOdt(fromTs)); // ✅ FIX
        params.put("toTs", toOdt(toTs)); // ✅ FIX
        params.put("paidStatus", PAID_STATUS);

        return jdbc.query(sql, params, (rs, i) -> {
            int hour = rs.getInt("hour_of_day");
            BigDecimal gross = nvl(rs.getBigDecimal("gross_revenue"));
            BigDecimal tips = nvl(rs.getBigDecimal("tips_total"));
            BigDecimal net = gross.subtract(tips);
            return new PeakHourRow(hour, rs.getLong("orders_count"), gross, tips, net);
        });
    }

    public record PeakHourRow(
            int hourOfDay,
            long ordersCount,
            BigDecimal grossRevenue,
            BigDecimal tipsTotal,
            BigDecimal netRevenue) {
    }

    // ========= TABLE TURNOVER =========
    public List<TableTurnoverRow> fetchTableTurnover(UUID tenantId, UUID outletId, Instant fromTs, Instant toTs) {
        String sql = """
                    with paid_orders as (
                        select
                            p.order_id,
                            sum(p.amount) as gross_revenue,
                            sum(coalesce(p.tips_total,0)) as tips_total
                        from payments p
                        where p.tenant_id = :tenantId
                          and p.outlet_id = :outletId
                          and p.paid_at >= :fromTs
                          and p.paid_at < :toTs
                          and p.status = :paidStatus
                          and p.order_id is not null
                        group by p.order_id
                    )
                    select
                        t.id as table_id,
                        t.code as table_code,
                        t.name as table_name,
                        t.group_code as group_code,
                        count(distinct o.id) as orders_count,
                        coalesce(sum(po.gross_revenue), 0) as gross_revenue,
                        coalesce(sum(po.gross_revenue - po.tips_total), 0) as net_revenue,
                        avg(extract(epoch from (o.closed_at - o.opened_at)) / 60.0) as avg_occupancy_minutes
                    from paid_orders po
                    join orders o on o.id = po.order_id
                    join tables t on t.id = o.table_id
                    where o.tenant_id = :tenantId
                      and o.outlet_id = :outletId
                      and o.opened_at is not null
                      and o.closed_at is not null
                    group by t.id, t.code, t.name, t.group_code
                    order by orders_count desc, net_revenue desc
                """;

        Map<String, Object> params = new HashMap<>();
        params.put("tenantId", tenantId);
        params.put("outletId", outletId);
        params.put("fromTs", toOdt(fromTs)); // ✅ FIX
        params.put("toTs", toOdt(toTs)); // ✅ FIX
        params.put("paidStatus", PAID_STATUS);

        return jdbc.query(sql, params, (rs, i) -> new TableTurnoverRow(
                (UUID) rs.getObject("table_id"),
                rs.getString("table_code"),
                rs.getString("table_name"),
                rs.getString("group_code"),
                rs.getLong("orders_count"),
                nvl(rs.getBigDecimal("gross_revenue")),
                nvl(rs.getBigDecimal("net_revenue")),
                nvl(rs.getBigDecimal("avg_occupancy_minutes"))));
    }

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

    // ========= STAFF PERFORMANCE =========
    public List<StaffPerfRow> fetchStaffPerformance(
            UUID tenantId, UUID outletId, Instant fromTs, Instant toTs,
            LocalDate fromDate, LocalDate toDate) {
        String sql = """
                    with paid_orders as (
                        select distinct p.order_id
                        from payments p
                        where p.tenant_id = :tenantId
                          and p.outlet_id = :outletId
                          and p.paid_at >= :fromTs
                          and p.paid_at < :toTs
                          and p.status = :paidStatus
                          and p.order_id is not null
                    ),
                    orders_handled as (
                        select s.id as staff_id, count(distinct o.id) as orders_handled
                        from orders o
                        join paid_orders po on po.order_id = o.id
                        join staffs s on s.user_id = o.opened_by
                        where o.tenant_id = :tenantId
                          and o.outlet_id = :outletId
                        group by s.id
                    ),
                    tips_by_staff as (
                        select p.staff_id, coalesce(sum(p.tips_total), 0) as tips_total
                        from payments p
                        where p.tenant_id = :tenantId
                          and p.outlet_id = :outletId
                          and p.paid_at >= :fromTs
                          and p.paid_at < :toTs
                          and p.status = :paidStatus
                          and p.staff_id is not null
                        group by p.staff_id
                    ),
                    hours_by_staff as (
                        select ar.staff_id,
                               round(coalesce(sum(ar.total_work_minutes),0) / 60.0, 2) as hours_worked
                        from attendance_records ar
                        where ar.tenant_id = :tenantId
                          and ar.outlet_id = :outletId
                          and ar.work_date >= :fromDate
                          and ar.work_date <= :toDate
                        group by ar.staff_id
                    )
                    select
                        s.id as staff_id,
                        s.user_id,
                        s.code as staff_code,
                        s.position,
                        s.status,
                        coalesce(oh.orders_handled, 0) as orders_handled,
                        coalesce(tb.tips_total, 0) as tips_total,
                        coalesce(hb.hours_worked, 0) as hours_worked
                    from staffs s
                    left join orders_handled oh on oh.staff_id = s.id
                    left join tips_by_staff tb on tb.staff_id = s.id
                    left join hours_by_staff hb on hb.staff_id = s.id
                    where s.tenant_id = :tenantId
                      and s.outlet_id = :outletId
                    order by orders_handled desc, tips_total desc, hours_worked desc
                """;

        Map<String, Object> params = new HashMap<>();
        params.put("tenantId", tenantId);
        params.put("outletId", outletId);
        params.put("fromTs", toOdt(fromTs)); // ✅ FIX
        params.put("toTs", toOdt(toTs)); // ✅ FIX
        params.put("fromDate", fromDate);
        params.put("toDate", toDate);
        params.put("paidStatus", PAID_STATUS);

        return jdbc.query(sql, params, (rs, i) -> new StaffPerfRow(
                (UUID) rs.getObject("staff_id"),
                (UUID) rs.getObject("user_id"),
                rs.getString("staff_code"),
                rs.getString("position"),
                rs.getString("status"),
                rs.getLong("orders_handled"),
                nvl(rs.getBigDecimal("tips_total")),
                nvl(rs.getBigDecimal("hours_worked"))));
    }

    public record StaffPerfRow(
            UUID staffId,
            UUID userId,
            String staffCode,
            String position,
            String status,
            long ordersHandled,
            BigDecimal tipsTotal,
            BigDecimal hoursWorked) {
    }

    // ========= PAYROLL SUMMARY =========
    public PayrollSummaryRow fetchPayrollSummary(UUID tenantId, UUID outletId, LocalDate fromDate, LocalDate toDate) {
        String sql = """
                    select
                        coalesce(sum(d.total_hours), 0) as total_hours,
                        coalesce(sum(d.gross_pay), 0) as gross_pay,
                        coalesce(sum(d.tips_amount), 0) as tips_amount,
                        coalesce(sum(d.net_pay), 0) as net_pay
                    from payroll_details d
                    join payroll_periods p on p.id = d.payroll_period_id
                    where d.tenant_id = :tenantId
                      and d.outlet_id = :outletId
                      and p.start_date <= :toDate
                      and p.end_date >= :fromDate
                """;

        Map<String, Object> params = new HashMap<>();
        params.put("tenantId", tenantId);
        params.put("outletId", outletId);
        params.put("fromDate", fromDate);
        params.put("toDate", toDate);

        return jdbc.queryForObject(sql, params, (rs, i) -> new PayrollSummaryRow(
                nvl(rs.getBigDecimal("total_hours")),
                nvl(rs.getBigDecimal("gross_pay")),
                nvl(rs.getBigDecimal("tips_amount")),
                nvl(rs.getBigDecimal("net_pay"))));
    }

    public record PayrollSummaryRow(
            BigDecimal totalHours,
            BigDecimal grossPay,
            BigDecimal tipsAmount,
            BigDecimal netPay) {
    }

    private static BigDecimal nvl(BigDecimal v) {
        return v == null ? BigDecimal.ZERO : v;
    }
}
