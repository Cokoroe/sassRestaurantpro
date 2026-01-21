package com.sassfnb.adapters.persistence.repository;

import com.sassfnb.adapters.persistence.entity.OutletEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;
import java.util.UUID;

public interface OutletRepository extends JpaRepository<OutletEntity, UUID> {

    Page<OutletEntity> findByRestaurantId(UUID restaurantId, Pageable pageable);

    Page<OutletEntity> findByRestaurantIdAndCityContainingIgnoreCaseAndNameContainingIgnoreCase(
            UUID restaurantId, String city, String q, Pageable pageable);

    long countByRestaurantIdAndDefaultOutletTrue(UUID restaurantId);

    @Query("select o.restaurantId from OutletEntity o where o.id = :outletId")
    Optional<UUID> findRestaurantIdById(UUID outletId);
}
