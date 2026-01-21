package com.sassfnb.adapters.persistence.repository;

import com.sassfnb.adapters.persistence.entity.QrSessionEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

public interface QrSessionRepository extends JpaRepository<QrSessionEntity, UUID> {

    long countByTableIdAndClosedAtIsNull(UUID tableId);

    Optional<QrSessionEntity> findTopByTableIdAndDeviceFingerprintAndClosedAtIsNullOrderByCreatedAtDesc(
            UUID tableId, String deviceFingerprint);

    // Option: tìm session còn sống theo table, không cần fingerprint
    Optional<QrSessionEntity> findTopByTableIdAndClosedAtIsNullOrderByCreatedAtDesc(UUID tableId);
}
