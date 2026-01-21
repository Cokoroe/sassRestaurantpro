package com.sassfnb.adapters.persistence.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.*;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
public class UserEntity {
    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false, unique = true)
    private String email;
    @Column(unique = true)
    private String phone;
    @Column(name = "full_name")
    private String fullName;
    @Column(nullable = false)
    private String status; // ACTIVE/LOCKED/INACTIVE

    @Column(name = "email_verified_at") // <--- NEW
    private OffsetDateTime emailVerifiedAt; // null = chưa xác minh

    @Column(name = "created_at")
    private OffsetDateTime createdAt = OffsetDateTime.now();
}