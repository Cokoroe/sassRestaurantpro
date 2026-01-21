// src/main/java/com/sassfnb/adapters/persistence/repository/TableRepository.java
package com.sassfnb.adapters.persistence.repository;

import com.sassfnb.adapters.persistence.entity.TableEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TableRepository extends JpaRepository<TableEntity, UUID> {

    Page<TableEntity> findByOutletIdAndDeletedFalse(UUID outletId, Pageable pageable);

    Page<TableEntity> findByOutletIdAndDeletedFalseAndStatusContainingIgnoreCaseAndGroupCodeContainingIgnoreCaseAndCodeContainingIgnoreCase(
            UUID outletId, String status, String groupCode, String q, Pageable pageable);

    boolean existsByOutletIdAndCodeIgnoreCase(UUID outletId, String code);

    long countByIdAndDeletedFalseAndStatusIn(UUID id, List<String> statuses);

    Optional<TableEntity> findByStaticQrCode(String staticQrCode);

    // ✅ dùng cho Billing prepareGroup / pick tables
    List<TableEntity> findByOutletIdAndDeletedFalse(UUID outletId);
}
