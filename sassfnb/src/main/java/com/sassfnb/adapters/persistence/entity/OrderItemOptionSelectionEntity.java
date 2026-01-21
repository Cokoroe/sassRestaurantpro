package com.sassfnb.adapters.persistence.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "order_item_option_selections", indexes = {
        @Index(name = "idx_oios_tenant", columnList = "tenant_id"),
        @Index(name = "idx_oios_order", columnList = "order_id"),
        @Index(name = "idx_oios_item", columnList = "order_item_id")
})
public class OrderItemOptionSelectionEntity {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "tenant_id", nullable = false, columnDefinition = "uuid")
    private UUID tenantId;

    @Column(name = "order_id", nullable = false, columnDefinition = "uuid")
    private UUID orderId;

    @Column(name = "order_item_id", nullable = false, columnDefinition = "uuid")
    private UUID orderItemId;

    @Column(name = "menu_item_id", nullable = false, columnDefinition = "uuid")
    private UUID menuItemId;

    @Column(name = "menu_option_id", nullable = false, columnDefinition = "uuid")
    private UUID menuOptionId;

    @Column(name = "menu_option_value_id", nullable = false, columnDefinition = "uuid")
    private UUID menuOptionValueId;

    @Column(name = "option_name", length = 150)
    private String optionName;

    @Column(name = "value_name", length = 150)
    private String valueName;

    @Column(name = "extra_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal extraPrice = BigDecimal.ZERO;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
