package com.sassfnb.adapters.persistence.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.Builder;
import lombok.AllArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "outlets", indexes = {
        @Index(name = "idx_outlet_restaurant", columnList = "restaurant_id"),
        @Index(name = "ux_outlet_restaurant_code", columnList = "restaurant_id,code", unique = true)
})
public class OutletEntity {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "restaurant_id", nullable = false, columnDefinition = "uuid")
    private UUID restaurantId;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(nullable = false, length = 64)
    private String code;

    @Column(length = 32)
    private String phone;

    @Column(length = 255)
    private String address;

    @Column(length = 80)
    private String city;

    @Column(length = 2)
    private String country;

    @Column(length = 64)
    private String timezone;

    @Column(name = "open_hours")
    private String openHours;

    @Column(name = "photo_url")
    private String photoUrl;

    @Column(name = "is_default", nullable = false)
    private Boolean defaultOutlet = false;

    @Column(nullable = false, length = 16)
    private String status = "ACTIVE";

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    // ========================================================
    // Alias để service cũ vẫn chạy
    // ========================================================
    public boolean isDefault() {
        return Boolean.TRUE.equals(defaultOutlet);
    }

    public void setDefault(boolean v) {
        this.defaultOutlet = v;
    }

    public String getOpenHoursJson() {
        return this.openHours;
    }

    public void setOpenHoursJson(String s) {
        this.openHours = s;
    }
}
