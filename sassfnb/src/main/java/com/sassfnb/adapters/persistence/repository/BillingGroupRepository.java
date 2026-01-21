package com.sassfnb.adapters.persistence.repository;

import com.sassfnb.adapters.persistence.entity.BillingGroupEntity;
import com.sassfnb.application.domain.billing.BillingGroupStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface BillingGroupRepository extends JpaRepository<BillingGroupEntity, UUID> {

    Optional<BillingGroupEntity> findByIdAndTenantId(UUID id, UUID tenantId);

    Page<BillingGroupEntity> findByTenantIdAndOutletId(UUID tenantId, UUID outletId, Pageable pageable);

    Page<BillingGroupEntity> findByTenantIdAndOutletIdAndStatus(UUID tenantId, UUID outletId, BillingGroupStatus status,
            Pageable pageable);

    Page<BillingGroupEntity> findByTenantIdAndOutletIdAndNameContainingIgnoreCase(UUID tenantId, UUID outletId,
            String q, Pageable pageable);

    Page<BillingGroupEntity> findByTenantIdAndOutletIdAndStatusAndNameContainingIgnoreCase(
            UUID tenantId, UUID outletId, BillingGroupStatus status, String q, Pageable pageable);
}
