package com.sassfnb.adapters.persistence.repository;

import com.sassfnb.adapters.persistence.entity.AttendanceRecordEntity;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface AttendanceAggRepository extends Repository<AttendanceRecordEntity, UUID> {

    interface StaffHoursRow {
        UUID getStaffId();

        BigDecimal getTotalHours();
    }

    /**
     * Sum total working hours by staff in a date range.
     *
     * Lưu ý: FROM table name phải đúng với DB của bạn.
     * - Nếu table của bạn là "attendance" thì giữ nguyên.
     * - Nếu table là "attendance_records" thì đổi lại.
     *
     * Mình để mặc định "attendance" theo query bạn đang viết.
     */
    @Query(value = """
            select
                a.staff_id as staffId,
                round(
                    sum(extract(epoch from (a.clock_out_at - a.clock_in_at)) / 3600.0)::numeric,
                    2
                ) as totalHours
            from attendance a
            where a.tenant_id = :tenantId
              and a.outlet_id = :outletId
              and a.clock_in_at is not null
              and a.clock_out_at is not null
              and (a.clock_in_at at time zone 'UTC')::date >= :startDate
              and (a.clock_in_at at time zone 'UTC')::date <= :endDate
            group by a.staff_id
            """, nativeQuery = true)
    List<StaffHoursRow> sumHoursByStaff(
            @Param("tenantId") UUID tenantId,
            @Param("outletId") UUID outletId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);
}
