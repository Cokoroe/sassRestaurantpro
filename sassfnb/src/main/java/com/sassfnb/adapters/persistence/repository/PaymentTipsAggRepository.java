package com.sassfnb.adapters.persistence.repository;

import com.sassfnb.adapters.persistence.entity.PaymentEntity;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface PaymentTipsAggRepository extends Repository<PaymentEntity, UUID> {

    interface StaffTipsRow {
        UUID getStaffId();

        BigDecimal getTipsAmount();
    }

    @Query(value = """
            select
                p.staff_id as staffId,
                coalesce(sum(p.tips_total), 0)::numeric as tipsAmount
            from payments p
            where p.tenant_id = :tenantId
              and p.outlet_id = :outletId
              and p.received_at >= :fromTs
              and p.received_at < :toTs
              and p.staff_id is not null
              and lower(p.status) = 'confirmed'
            group by p.staff_id
            """, nativeQuery = true)
    List<StaffTipsRow> sumTipsByStaff(
            @Param("tenantId") UUID tenantId,
            @Param("outletId") UUID outletId,
            @Param("fromTs") Instant fromTs,
            @Param("toTs") Instant toTs);
}
