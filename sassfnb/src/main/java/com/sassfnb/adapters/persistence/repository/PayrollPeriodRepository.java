package com.sassfnb.adapters.persistence.repository;

import com.sassfnb.adapters.persistence.entity.PayrollPeriodEntity;
import com.sassfnb.application.domain.payroll.PayrollPeriodStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PayrollPeriodRepository extends JpaRepository<PayrollPeriodEntity, UUID> {

    List<PayrollPeriodEntity> findByTenantIdAndOutletIdOrderByStartDateDesc(UUID tenantId, UUID outletId);

    Optional<PayrollPeriodEntity> findByIdAndTenantId(UUID id, UUID tenantId);

    boolean existsByTenantIdAndOutletIdAndStatus(UUID tenantId, UUID outletId, PayrollPeriodStatus status);
}
