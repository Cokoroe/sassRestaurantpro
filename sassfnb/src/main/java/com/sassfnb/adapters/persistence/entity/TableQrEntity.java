// src/main/java/com/sassfnb/adapters/persistence/entity/TableQrEntity.java
package com.sassfnb.adapters.persistence.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "table_qr", indexes = {
        @Index(name = "idx_tqr_table", columnList = "table_id"),
        @Index(name = "idx_tqr_token", columnList = "token")
})
public class TableQrEntity {

    @Id
    @Column(nullable = false, updatable = false)
    private UUID id; // tự sinh trong @PrePersist

    @Column(name = "table_id", nullable = false, columnDefinition = "uuid")
    private UUID tableId;

    @Column(name = "token", nullable = false, length = 255)
    private String token;

    // Chuỗi nội dung để encode vào mã QR
    @Column(name = "qr_code", nullable = false)
    private String qrCode;

    // URL (hoặc path) trỏ tới trang mà QR dẫn tới
    @Column(name = "qr_url", nullable = false, length = 500)
    private String qrUrl;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "expires_at")
    private Instant expiresAt;

    @Column(name = "disabled_at")
    private Instant disabledAt;

    public boolean isActive() {
        boolean notExpired = (expiresAt == null) || expiresAt.isAfter(Instant.now());
        return disabledAt == null && notExpired;
    }

    @PrePersist
    public void pre() {
        if (id == null) {
            id = UUID.randomUUID();
        }
    }
}
