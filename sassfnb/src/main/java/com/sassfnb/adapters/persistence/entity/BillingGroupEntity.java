package com.sassfnb.adapters.persistence.entity;

import com.sassfnb.application.domain.billing.BillingGroupStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "billing_groups", indexes = {
        @Index(name = "idx_billing_groups_outlet", columnList = "outlet_id"),
        @Index(name = "idx_billing_groups_status", columnList = "status"),
        @Index(name = "idx_billing_groups_tenant", columnList = "tenant_id")
})
public class BillingGroupEntity {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "tenant_id", nullable = false, columnDefinition = "uuid")
    private UUID tenantId;

    @Column(name = "outlet_id", nullable = false, columnDefinition = "uuid")
    private UUID outletId;

    @Column(name = "name", length = 150)
    private String name;

    @Column(name = "note", columnDefinition = "text")
    private String note;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private BillingGroupStatus status = BillingGroupStatus.OPEN;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "closed_at")
    private Instant closedAt;
}
