package com.sassfnb.adapters.persistence.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "permissions")
@Getter
@Setter
@NoArgsConstructor
public class PermissionEntity {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false, unique = true, length = 150)
    private String code; // ví dụ: USER_VIEW, ROLE_CREATE

    @Column(nullable = false, length = 200)
    private String name; // tên hiển thị

    @Column(columnDefinition = "text")
    private String description; // mô tả

    @Column(name = "system_flag", nullable = false)
    private boolean systemFlag = false; // quyền hệ thống (không cho xóa)

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    /**
     * Liên kết 1 chiều tới role_permissions bằng khóa ngoại permission_id.
     * Không dùng mappedBy vì RolePermissionEntity không có field PermissionEntity.
     * insertable/updatable = false để không cho JPA tự ghi bảng nối qua mối quan hệ
     * này.
     */
    @OneToMany(fetch = FetchType.LAZY)
    @JoinColumn(name = "permission_id", referencedColumnName = "id", insertable = false, updatable = false)
    private Set<RolePermissionEntity> rolePermissions = new LinkedHashSet<>();
}
