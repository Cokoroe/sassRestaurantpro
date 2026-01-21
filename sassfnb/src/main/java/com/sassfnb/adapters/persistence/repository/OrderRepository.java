// src/main/java/com/sassfnb/adapters/persistence/repository/OrderRepository.java
package com.sassfnb.adapters.persistence.repository;

import com.sassfnb.adapters.persistence.entity.OrderEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface OrderRepository extends JpaRepository<OrderEntity, UUID>, OrderRepositoryCustom {
    int countByTenantIdAndOutletIdAndIdIn(UUID tenantId, UUID outletId, List<UUID> ids);

    List<OrderEntity> findByTenantIdAndIdIn(UUID tenantId, List<UUID> ids);

    Optional<OrderEntity> findByTenantIdAndOutletIdAndId(UUID tenantId, UUID outletId, UUID id);

    // ✅ NEW: lấy order active mới nhất theo danh sách bàn
    @Query("""
                select o
                from OrderEntity o
                where o.tenantId = :tenantId
                  and o.outletId = :outletId
                  and o.tableId in :tableIds
                  and o.status not in ('PAID','CANCELLED','VOID','CLOSED')
                order by o.createdAt desc
            """)
    List<OrderEntity> findActiveOrdersByTableIds(
            @Param("tenantId") UUID tenantId,
            @Param("outletId") UUID outletId,
            @Param("tableIds") List<UUID> tableIds);

    Optional<OrderEntity> findByIdAndOutletId(UUID id, UUID outletId);

    Optional<OrderEntity> findByTenantIdAndOutletIdAndPaymentCode(UUID tenantId, UUID outletId, String paymentCode);

}
