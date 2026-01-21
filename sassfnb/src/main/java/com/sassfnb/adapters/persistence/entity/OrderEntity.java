// src/main/java/com/sassfnb/adapters/persistence/entity/OrderEntity.java
package com.sassfnb.adapters.persistence.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "orders", indexes = {
        @Index(name = "idx_orders_tenant", columnList = "tenant_id"),
        @Index(name = "idx_orders_outlet", columnList = "outlet_id"),
        @Index(name = "idx_orders_table", columnList = "table_id"),
        @Index(name = "idx_orders_status", columnList = "status")
})
public class OrderEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid")
    private UUID id;

    @Column(name = "tenant_id", nullable = false, columnDefinition = "uuid")
    private UUID tenantId;

    @Column(name = "outlet_id", nullable = false, columnDefinition = "uuid")
    private UUID outletId;

    @Column(name = "table_id", columnDefinition = "uuid")
    private UUID tableId;

    @Column(name = "reservation_id", columnDefinition = "uuid")
    private UUID reservationId;

    @Column(name = "opened_by", columnDefinition = "uuid")
    private UUID openedBy;

    @Column(name = "qr_session_id", columnDefinition = "uuid")
    private UUID qrSessionId;

    @Column(name = "people")
    private Integer people;

    @Column(name = "opened_at")
    private Instant openedAt;

    @Column(name = "closed_at")
    private Instant closedAt;

    @Column(name = "status", length = 24, nullable = false)
    private String status; // e.g. OPEN, IN_PROGRESS, PAID, VOIDED...

    @Column(name = "note", columnDefinition = "text")
    private String note;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    @Column(name = "payment_code")
    private String paymentCode;

    @Column(name = "balance_amount", precision = 19, scale = 2, nullable = false)
    private BigDecimal balanceAmount = BigDecimal.ZERO; // ✅ default
}
