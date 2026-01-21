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
@Table(name = "qr_sessions", indexes = {
        @Index(name = "idx_qrs_tenant", columnList = "tenant_id"),
        @Index(name = "idx_qrs_table", columnList = "table_id"),
        @Index(name = "idx_qrs_outlet", columnList = "outlet_id")
})
public class QrSessionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid")
    private UUID id;

    @Column(name = "tenant_id", nullable = false, columnDefinition = "uuid")
    private UUID tenantId;

    @Column(name = "outlet_id", nullable = false, columnDefinition = "uuid")
    private UUID outletId;

    @Column(name = "table_id", nullable = false, columnDefinition = "uuid")
    private UUID tableId;

    @Column(name = "device_fingerprint", length = 128)
    private String deviceFingerprint;

    @Column(name = "ip_address", length = 64)
    private String ipAddress;

    @Column(nullable = false, length = 20)
    private String status = "ACTIVE";

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "last_seen_at")
    private Instant lastSeenAt;

    @Column(name = "expired_at")
    private Instant expiredAt;

    @Column(name = "closed_at")
    private Instant closedAt;

    public boolean isAlive(Instant now) {
        boolean notClosed = closedAt == null;
        boolean notExpired = (expiredAt == null) || expiredAt.isAfter(now);
        return notClosed && notExpired;
    }
}
