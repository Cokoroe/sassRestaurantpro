// src/main/java/com/sassfnb/adapters/persistence/entity/MenuOptionEntity.java
package com.sassfnb.adapters.persistence.entity;

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
@Table(name = "menu_options", indexes = {
        @Index(name = "idx_mopt_tenant", columnList = "tenant_id")
})
public class MenuOptionEntity {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "tenant_id", nullable = false, columnDefinition = "uuid")
    private UUID tenantId;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(name = "item_id", columnDefinition = "uuid")
    private UUID itemId;

    // SINGLE / MULTI
    @Column(name = "selection_type", nullable = false, length = 16)
    private String selectionType = "SINGLE";

    @Column(name = "is_required", nullable = false)
    private Boolean required = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}
