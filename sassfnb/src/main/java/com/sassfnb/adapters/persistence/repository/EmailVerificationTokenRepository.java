package com.sassfnb.adapters.persistence.repository;

import com.sassfnb.adapters.persistence.entity.EmailVerificationTokenEntity;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;

public interface EmailVerificationTokenRepository extends JpaRepository<EmailVerificationTokenEntity, UUID> {

    @Transactional
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("delete from EmailVerificationTokenEntity t " +
            "where t.userId = :userId and t.expiresAt < :time")
    int deleteExpiredByUserId(@Param("userId") UUID userId,
            @Param("time") OffsetDateTime time);

    Optional<EmailVerificationTokenEntity> findByToken(String token);
}
