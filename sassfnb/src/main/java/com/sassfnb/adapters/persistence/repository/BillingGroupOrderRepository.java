package com.sassfnb.adapters.persistence.repository;

import com.sassfnb.adapters.persistence.entity.BillingGroupOrderEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BillingGroupOrderRepository extends JpaRepository<BillingGroupOrderEntity, UUID> {

    List<BillingGroupOrderEntity> findByTenantIdAndGroupId(UUID tenantId, UUID groupId);

    List<BillingGroupOrderEntity> findByTenantIdAndOrderIdIn(UUID tenantId, List<UUID> orderIds);

    Optional<BillingGroupOrderEntity> findByTenantIdAndGroupIdAndOrderId(UUID tenantId, UUID groupId, UUID orderId);

    void deleteByTenantIdAndGroupIdAndOrderIdIn(UUID tenantId, UUID groupId, List<UUID> orderIds);

    void deleteByTenantIdAndGroupId(UUID tenantId, UUID groupId);

    long countByTenantIdAndGroupId(UUID tenantId, UUID groupId);
}
