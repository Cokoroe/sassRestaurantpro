package com.sassfnb.adapters.persistence.repository;

import com.sassfnb.adapters.persistence.entity.UserCredentialEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface UserCredentialRepository extends JpaRepository<UserCredentialEntity, UUID> {
    Optional<UserCredentialEntity> findByUserId(UUID userId);
}
