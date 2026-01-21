package com.sassfnb.adapters.persistence.repository;

import com.sassfnb.adapters.persistence.entity.StaffEntity;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface StaffRepository extends JpaRepository<StaffEntity, UUID>, JpaSpecificationExecutor<StaffEntity> {

        Optional<StaffEntity> findByTenantIdAndId(UUID tenantId, UUID id);

        List<StaffEntity> findByTenantIdAndOutletIdAndStatus(UUID tenantId, UUID outletId, String status);

        @Query("""
                            select case when count(s)>0 then true else false end
                            from StaffEntity s
                            where s.tenantId = :tenantId and s.userId = :userId
                        """)
        boolean existsByTenantAndUser(@Param("tenantId") UUID tenantId, @Param("userId") UUID userId);

        Optional<StaffEntity> findByTenantIdAndUserId(UUID tenantId, UUID userId);

        Optional<StaffEntity> findFirstByUserId(UUID userId);

        Optional<StaffEntity> findFirstByTenantIdAndUserId(UUID tenantId, UUID userId);

        List<StaffEntity> findByTenantIdAndIdIn(UUID tenantId, Collection<UUID> ids);

        // NEW: check trùng code theo tenant + restaurant
        boolean existsByTenantIdAndRestaurantIdAndCodeIgnoreCase(UUID tenantId, UUID restaurantId, String code);
}
