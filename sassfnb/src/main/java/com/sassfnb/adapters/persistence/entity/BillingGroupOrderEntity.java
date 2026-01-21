package com.sassfnb.adapters.persistence.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "billing_group_orders", indexes = {
        @Index(name = "idx_billing_group_orders_group", columnList = "group_id"),
        @Index(name = "idx_billing_group_orders_order", columnList = "order_id"),
        @Index(name = "idx_billing_group_orders_tenant", columnList = "tenant_id")
}, uniqueConstraints = {
        @UniqueConstraint(name = "ux_billing_group_orders", columnNames = { "group_id", "order_id" })
})
public class BillingGroupOrderEntity {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "tenant_id", nullable = false, columnDefinition = "uuid")
    private UUID tenantId;

    @Column(name = "group_id", nullable = false, columnDefinition = "uuid")
    private UUID groupId;

    @Column(name = "order_id", nullable = false, columnDefinition = "uuid")
    private UUID orderId;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
