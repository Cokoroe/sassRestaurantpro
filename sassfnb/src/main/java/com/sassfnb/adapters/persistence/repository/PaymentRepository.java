package com.sassfnb.adapters.persistence.repository;

import com.sassfnb.adapters.persistence.entity.PaymentEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PaymentRepository extends JpaRepository<PaymentEntity, UUID> {

    Optional<PaymentEntity> findByTenantIdAndPaymentCode(UUID tenantId, String paymentCode);

    boolean existsByTenantIdAndProviderAndProviderTxnId(UUID tenantId, String provider, String providerTxnId);

    @Query("""
                select coalesce(sum(p.amount), 0)
                from PaymentEntity p
                where p.tenantId = :tenantId
                  and p.orderId = :orderId
                  and p.status = 'CONFIRMED'
            """)
    BigDecimal sumPaidByOrder(UUID tenantId, UUID orderId);

    @Query("""
                select coalesce(sum(p.amount), 0)
                from PaymentEntity p
                where p.tenantId = :tenantId
                  and p.groupId = :groupId
                  and p.status = 'CONFIRMED'
            """)
    BigDecimal sumPaidByGroup(UUID tenantId, UUID groupId);

    List<PaymentEntity> findByTenantIdAndGroupIdAndOrderIdIsNullAndStatusIgnoreCase(
            UUID tenantId, UUID groupId, String status);
}
