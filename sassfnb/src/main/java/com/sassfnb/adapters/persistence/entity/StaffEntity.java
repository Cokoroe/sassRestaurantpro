package com.sassfnb.adapters.persistence.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "staffs", indexes = {
        @Index(name = "idx_staffs_tenant", columnList = "tenant_id"),
        @Index(name = "idx_staffs_rest", columnList = "restaurant_id"),
        @Index(name = "idx_staffs_outlet", columnList = "outlet_id"),
        @Index(name = "idx_staffs_user", columnList = "user_id"),
        @Index(name = "idx_staffs_status", columnList = "status")
})
public class StaffEntity {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "tenant_id", nullable = false, columnDefinition = "uuid")
    private UUID tenantId;

    @Column(name = "user_id", nullable = false, columnDefinition = "uuid")
    private UUID userId;

    @Column(name = "restaurant_id", columnDefinition = "uuid")
    private UUID restaurantId;

    @Column(name = "outlet_id", columnDefinition = "uuid")
    private UUID outletId;

    @Column(length = 50)
    private String code; // mã nhân sự nội bộ

    @Column(length = 50)
    private String position; // WAITER, CASHIER,...

    @Column(name = "avatar_url", length = 255)
    private String avatarUrl;

    @Column(name = "status", length = 20, nullable = false)
    private String status; // ACTIVE / INACTIVE

    @Column(name = "hired_date", nullable = false)
    private LocalDate hiredDate;

    @Column(name = "terminated_date")
    private LocalDate terminatedDate;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}
