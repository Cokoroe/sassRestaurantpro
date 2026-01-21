package com.sassfnb.adapters.persistence.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.*;

@Entity
@Table(name = "user_credentials")
@Getter
@Setter
@NoArgsConstructor
public class UserCredentialEntity {
    @Id
    @Column(name = "user_id")
    private UUID userId;
    @MapsId
    @OneToOne
    @JoinColumn(name = "user_id")
    private UserEntity user;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;
    @Column(name = "password_algo", nullable = false)
    private String passwordAlgo; // e.g. BCRYPT
    @Column(name = "mfa_secret")
    private String mfaSecret;
    @Column(name = "last_pw_change_at")
    private OffsetDateTime lastPwChangeAt = OffsetDateTime.now();
}
