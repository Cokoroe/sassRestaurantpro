// src/main/java/com/sassfnb/adapters/persistence/entity/MenuCategoryEntity.java
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
@Table(name = "menu_categories", indexes = {
                @Index(name = "idx_mcat_tenant", columnList = "tenant_id"),
                @Index(name = "idx_mcat_outlet", columnList = "outlet_id")
})
public class MenuCategoryEntity {

        @Id
        @GeneratedValue
        private UUID id;

        @Column(name = "tenant_id", nullable = false, columnDefinition = "uuid")
        private UUID tenantId;

        @Column(name = "outlet_id", nullable = false, columnDefinition = "uuid")
        private UUID outletId;

        @Column(nullable = false, length = 150)
        private String name;

        @Column(name = "sort_order")
        private Integer sortOrder;

        @Column(nullable = false, length = 20)
        private String status = "ACTIVE";

        @CreationTimestamp
        @Column(name = "created_at", nullable = false, updatable = false)
        private Instant createdAt;

        @UpdateTimestamp
        @Column(name = "updated_at")
        private Instant updatedAt;
}
