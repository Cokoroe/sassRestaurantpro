package com.sassfnb.adapters.persistence.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.*;

@Entity
@Table(name = "user_roles")
@Getter
@Setter
@NoArgsConstructor
public class UserRoleEntity {
    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;
    @Column(name = "role_id", nullable = false)
    private UUID roleId;
    @Column(name = "restaurant_id", nullable = false)
    private UUID restaurantId;
    @Column(name = "outlet_id")
    private UUID outletId;

    @Column(name = "assigned_by")
    private UUID assignedBy;
    @Column(name = "assigned_at")
    private OffsetDateTime assignedAt = OffsetDateTime.now();
}
