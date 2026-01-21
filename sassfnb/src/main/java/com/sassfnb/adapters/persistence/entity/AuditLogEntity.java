package com.sassfnb.adapters.persistence.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "audit_logs")
@Getter
@Setter
@NoArgsConstructor
public class AuditLogEntity {
    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "tenant_id")
    private UUID tenantId;

    @Column(name = "actor_user_id")
    private UUID actorUserId;

    @Column(nullable = false)
    private String action; // ví dụ: PASSWORD_RESET_REQUESTED

    @Column(nullable = false)
    private String entity; // USER / REFRESH_TOKEN ...

    @Column(name = "entity_id")
    private UUID entityId;

    // Map -> jsonb (hibernate tự serialize, không còn lỗi cast varchar->jsonb)
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "data_json")
    private Map<String, Object> dataJson;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();
}
