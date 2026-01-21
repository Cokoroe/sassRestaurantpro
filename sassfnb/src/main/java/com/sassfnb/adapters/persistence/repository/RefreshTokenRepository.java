package com.sassfnb.adapters.persistence.repository;

import com.sassfnb.adapters.persistence.entity.RefreshTokenEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RefreshTokenRepository extends JpaRepository<RefreshTokenEntity, UUID> {
    Optional<RefreshTokenEntity> findByJti(String jti);

    void deleteByUserId(UUID userId);

    List<RefreshTokenEntity> findByUserIdOrderByCreatedAtDesc(UUID userId);

    Optional<RefreshTokenEntity> findByJtiAndUserId(String jti, UUID userId);
}
