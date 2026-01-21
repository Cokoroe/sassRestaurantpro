package com.sassfnb.adapters.persistence.repository;

import com.sassfnb.adapters.persistence.entity.PayRateEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PayRateRepository extends JpaRepository<PayRateEntity, UUID> {

  // for listing
  List<PayRateEntity> findByTenantIdAndOutletIdOrderByEffectiveFromDesc(UUID tenantId, UUID outletId);

  List<PayRateEntity> findByTenantIdAndOutletIdAndStaffIdOrderByEffectiveFromDesc(UUID tenantId, UUID outletId,
      UUID staffId);

  // compatibility methods to match your service calls (NO "OrderBy" needed)
  default List<PayRateEntity> findByTenantIdAndOutletId(UUID tenantId, UUID outletId) {
    return findByTenantIdAndOutletIdOrderByEffectiveFromDesc(tenantId, outletId);
  }

  default List<PayRateEntity> findByTenantIdAndOutletIdAndStaffId(UUID tenantId, UUID outletId, UUID staffId) {
    return findByTenantIdAndOutletIdAndStaffIdOrderByEffectiveFromDesc(tenantId, outletId, staffId);
  }

  // rate at a given date
  @Query("""
          select pr
          from PayRateEntity pr
          where pr.tenantId = :tenantId
            and pr.outletId = :outletId
            and pr.staffId = :staffId
            and pr.effectiveFrom <= :at
            and (pr.effectiveTo is null or pr.effectiveTo >= :at)
          order by pr.effectiveFrom desc
      """)
  Optional<PayRateEntity> findRateAt(
      @Param("tenantId") UUID tenantId,
      @Param("outletId") UUID outletId,
      @Param("staffId") UUID staffId,
      @Param("at") LocalDate at);

  // compatibility: your service uses findEffectiveRate(...)
  default Optional<PayRateEntity> findEffectiveRate(UUID tenantId, UUID outletId, UUID staffId, LocalDate at) {
    return findRateAt(tenantId, outletId, staffId, at);
  }
}
