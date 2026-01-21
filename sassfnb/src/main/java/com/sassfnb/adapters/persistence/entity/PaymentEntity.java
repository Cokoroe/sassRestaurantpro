package com.sassfnb.adapters.persistence.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.UuidGenerator;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "payments", indexes = {
        @Index(name = "idx_pay_tenant", columnList = "tenant_id"),
        @Index(name = "idx_pay_outlet", columnList = "outlet_id"),
        @Index(name = "idx_pay_status", columnList = "status"),
        @Index(name = "idx_pay_order", columnList = "order_id"),
        @Index(name = "idx_pay_group", columnList = "group_id"),
        @Index(name = "idx_pay_provider_txn", columnList = "provider,provider_txn_id")
})
public class PaymentEntity {

    @Id
    @UuidGenerator
    @Column(name = "id", columnDefinition = "uuid", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "tenant_id", nullable = false, columnDefinition = "uuid")
    private UUID tenantId;

    @Column(name = "outlet_id", nullable = false, columnDefinition = "uuid")
    private UUID outletId;

    // ORDER | GROUP
    @Column(name = "scope", length = 20, nullable = false)
    private String scope;

    // GROUP payment vẫn có thể cần order_id (tuỳ flow closeOrder của bạn)
    @Column(name = "order_id", columnDefinition = "uuid")
    private UUID orderId;

    @Column(name = "group_id", columnDefinition = "uuid")
    private UUID groupId;

    // CASH | TRANSFER | SEPAY
    @Column(name = "method", length = 30, nullable = false)
    private String method;

    // PENDING | CONFIRMED | VOIDED
    @Column(name = "status", length = 30, nullable = false)
    private String status;

    @Column(name = "amount", precision = 12, scale = 2, nullable = false)
    private BigDecimal amount;

    @Column(name = "note", columnDefinition = "text")
    private String note;

    @Column(name = "staff_id", columnDefinition = "uuid")
    private UUID staffId;

    @Column(name = "received_at")
    private Instant receivedAt;

    // ===== SePay fields =====
    @Column(name = "payment_code", length = 40)
    private String paymentCode;

    @Column(name = "provider", length = 30)
    private String provider;

    @Column(name = "provider_txn_id", length = 80)
    private String providerTxnId;

    @Column(name = "raw_payload", columnDefinition = "text")
    private String rawPayload;

    @Column(name = "confirmed_at")
    private Instant confirmedAt;

    @Column(name = "expires_at")
    private Instant expiresAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}
