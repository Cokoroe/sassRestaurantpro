package com.sassfnb.adapters.persistence.repository;

import com.sassfnb.adapters.persistence.entity.RestaurantEntity;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;
import java.util.UUID;

public interface RestaurantRepository extends JpaRepository<RestaurantEntity, UUID> {

        Page<RestaurantEntity> findByOwnerUserIdAndStatusContainingIgnoreCaseAndNameContainingIgnoreCase(
                        UUID ownerUserId, String status, String name, Pageable pageable);

        // Lấy nhà hàng đầu tiên của owner trong tenant (dùng cho /restaurants/me)
        Optional<RestaurantEntity> findFirstByTenantIdAndOwnerUserIdOrderByCreatedAtAsc(
                        UUID tenantId, UUID ownerUserId);

        Optional<RestaurantEntity> findByTenantId(UUID tenantId);

        @Query("select r.tenantId from RestaurantEntity r where r.id = :restaurantId")
        Optional<UUID> findTenantIdById(UUID restaurantId);

}
