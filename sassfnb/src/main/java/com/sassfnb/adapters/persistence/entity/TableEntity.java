// src/main/java/com/sassfnb/adapters/persistence/entity/TableEntity.java
package com.sassfnb.adapters.persistence.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
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
@Builder
@AllArgsConstructor
@Entity
@Table(name = "tables", indexes = {
        @Index(name = "idx_table_outlet", columnList = "outlet_id"),
        @Index(name = "ux_table_outlet_code", columnList = "outlet_id,code", unique = true)
})
public class TableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID) // ✅ Để Hibernate tự generate UUID
    @Column(columnDefinition = "uuid")
    private UUID id;

    @Column(name = "outlet_id", nullable = false, columnDefinition = "uuid")
    private UUID outletId;

    @Column(nullable = false, length = 64)
    private String code;

    @Column(length = 128)
    private String name;

    private Integer capacity;

    @Column(name = "group_code", length = 32)
    private String groupCode;

    @Column(nullable = false, length = 16)
    private String status = "AVAILABLE";

    @Column(name = "is_deleted", nullable = false)
    private Boolean deleted = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    @Column(name = "static_qr_code", length = 24)
    private String staticQrCode;

    @Column(name = "static_qr_image_url")
    private String staticQrImageUrl;
}
