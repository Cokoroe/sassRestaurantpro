// src/main/java/com/sassfnb/adapters/persistence/repository/TableQrRepository.java
package com.sassfnb.adapters.persistence.repository;

import com.sassfnb.adapters.persistence.entity.TableQrEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface TableQrRepository extends JpaRepository<TableQrEntity, UUID> {
    Optional<TableQrEntity> findTopByTableIdAndDisabledAtIsNullOrderByCreatedAtDesc(UUID tableId);

    Optional<TableQrEntity> findByTokenAndDisabledAtIsNull(String token);
}
