package com.sassfnb.adapters.persistence.repository;

import com.sassfnb.adapters.persistence.entity.OrderItemEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface OrderItemRepository extends JpaRepository<OrderItemEntity, UUID> {

        List<OrderItemEntity> findByOrderIdOrderByCreatedAtAsc(UUID orderId);

        Optional<OrderItemEntity> findByIdAndOrderId(UUID id, UUID orderId);

        /**
         * KDS query (MVP): lọc theo tenant + outlet, since, statuses.
         * statuses phải là list không rỗng.
         */
        @Query("""
                            select oi
                            from OrderItemEntity oi
                            join OrderEntity o on o.id = oi.orderId
                            where o.tenantId = :tenantId
                              and o.outletId = :outletId
                              and oi.createdAt >= :since
                              and upper(oi.status) in :statuses
                            order by oi.createdAt
                        """)
        List<OrderItemEntity> findKdsItems(
                        @Param("tenantId") UUID tenantId,
                        @Param("outletId") UUID outletId,
                        @Param("since") Instant since,
                        @Param("statuses") List<String> statuses);

        @Query("""
                            select coalesce(sum(i.totalAmount), 0)
                            from OrderItemEntity i
                            where i.orderId = :orderId
                              and lower(i.status) <> lower(:excludedStatus)
                        """)
        BigDecimal sumTotalByOrderIdExcludeStatus(
                        @Param("orderId") UUID orderId,
                        @Param("excludedStatus") String excludedStatus);

        @Query("""
                            select coalesce(sum(coalesce(i.discountAmount, 0)), 0)
                            from OrderItemEntity i
                            where i.orderId = :orderId
                              and lower(i.status) <> lower(:excludedStatus)
                        """)
        BigDecimal sumDiscountByOrderIdExcludeStatus(
                        @Param("orderId") UUID orderId,
                        @Param("excludedStatus") String excludedStatus);

        List<OrderItemEntity> findByTenantIdAndOrderIdIn(UUID tenantId, List<UUID> orderIds);

        // =========================
        // ✅ BULK UPDATE: NEW -> FIRED khi submit
        // =========================
        @Modifying(clearAutomatically = true, flushAutomatically = true)
        @Query("""
                            update OrderItemEntity i
                            set i.status = :toStatus,
                                i.updatedAt = :now
                            where i.orderId = :orderId
                              and upper(i.status) = upper(:fromStatus)
                        """)
        int bulkUpdateStatusByOrderIdAndStatus(
                        @Param("orderId") UUID orderId,
                        @Param("fromStatus") String fromStatus,
                        @Param("toStatus") String toStatus,
                        @Param("now") Instant now);
}
