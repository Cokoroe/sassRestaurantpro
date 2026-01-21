package com.sassfnb.adapters.persistence.repository;

import com.sassfnb.adapters.persistence.entity.PayrollDetailEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PayrollDetailRepository extends JpaRepository<PayrollDetailEntity, UUID> {

    List<PayrollDetailEntity> findByTenantIdAndPayrollPeriodIdOrderByCreatedAtAsc(UUID tenantId, UUID periodId);

    Optional<PayrollDetailEntity> findByTenantIdAndPayrollPeriodIdAndStaffId(UUID tenantId, UUID periodId,
            UUID staffId);

    void deleteByTenantIdAndPayrollPeriodId(UUID tenantId, UUID periodId);
}
