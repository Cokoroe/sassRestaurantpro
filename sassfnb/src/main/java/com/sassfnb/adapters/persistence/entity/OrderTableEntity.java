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
@Table(name = "order_tables", indexes = {
        @Index(name = "idx_order_tables_table_id", columnList = "table_id"),
        @Index(name = "idx_order_tables_order_id", columnList = "order_id"),
        @Index(name = "idx_order_tables_tenant_id", columnList = "tenant_id")
})
public class OrderTableEntity {

    @Id
    @Column(name = "id", nullable = false, columnDefinition = "uuid")
    private UUID id;

    @Column(name = "tenant_id", nullable = false, columnDefinition = "uuid")
    private UUID tenantId;

    @Column(name = "order_id", nullable = false, columnDefinition = "uuid")
    private UUID orderId;

    @Column(name = "table_id", nullable = false, columnDefinition = "uuid")
    private UUID tableId;

    @Column(name = "linked_at", nullable = false)
    private Instant linkedAt;

    @Column(name = "unlinked_at")
    private Instant unlinkedAt;

    @CreationTimestamp
    @Column(name = "added_at", nullable = false, updatable = false)
    private Instant addedAt;

    @Column(name = "added_by", columnDefinition = "uuid")
    private UUID addedBy;
}
