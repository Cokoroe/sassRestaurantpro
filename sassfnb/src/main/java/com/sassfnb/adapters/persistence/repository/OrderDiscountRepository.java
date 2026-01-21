package com.sassfnb.adapters.persistence.repository;

import com.sassfnb.adapters.persistence.entity.OrderDiscountEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface OrderDiscountRepository extends JpaRepository<OrderDiscountEntity, UUID> {

    Optional<OrderDiscountEntity> findByTenantIdAndOrderId(UUID tenantId, UUID orderId);

    void deleteByTenantIdAndOrderId(UUID tenantId, UUID orderId);

    boolean existsByTenantIdAndOrderId(UUID tenantId, UUID orderId);
}
