package com.sassfnb.adapters.persistence.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.UuidGenerator;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "payroll_details", indexes = {
        @Index(name = "ix_payroll_details_tenant_period", columnList = "tenant_id,payroll_period_id"),
        @Index(name = "ix_payroll_details_tenant_staff", columnList = "tenant_id,staff_id"),
        @Index(name = "ix_payroll_details_tenant_outlet", columnList = "tenant_id,outlet_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PayrollDetailEntity {

    @Id
    @GeneratedValue
    @UuidGenerator
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "outlet_id", nullable = false)
    private UUID outletId;

    @Column(name = "payroll_period_id", nullable = false)
    private UUID payrollPeriodId;

    @Column(name = "staff_id", nullable = false)
    private UUID staffId;

    @Column(name = "total_hours", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal totalHours = BigDecimal.ZERO;

    @Column(name = "gross_pay", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal grossPay = BigDecimal.ZERO;

    @Column(name = "tips_amount", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal tipsAmount = BigDecimal.ZERO;

    @Column(name = "net_pay", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal netPay = BigDecimal.ZERO;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}
