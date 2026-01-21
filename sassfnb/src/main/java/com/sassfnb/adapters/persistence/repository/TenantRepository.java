package com.sassfnb.adapters.persistence.repository;

import com.sassfnb.adapters.persistence.entity.TenantEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface TenantRepository extends JpaRepository<TenantEntity, UUID> {

    Optional<TenantEntity> findByCodeIgnoreCase(String code);

    Page<TenantEntity> findByNameContainingIgnoreCaseAndStatusContainingIgnoreCase(
            String name, String status, Pageable pageable);

    // 👇 NEW: tìm tenant theo owner
    Optional<TenantEntity> findByOwnerUserId(UUID ownerUserId);
}
