package com.sassfnb.adapters.persistence.repository;

import com.sassfnb.adapters.persistence.entity.OrderTableEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface OrderTableRepository extends JpaRepository<OrderTableEntity, UUID> {

    // mapping theo table
    List<OrderTableEntity> findByTableId(UUID tableId);

    // mapping active (unlinked_at is null)
    Optional<OrderTableEntity> findTopByTableIdAndUnlinkedAtIsNullOrderByLinkedAtDesc(UUID tableId);

    // mapping theo order
    List<OrderTableEntity> findByOrderId(UUID orderId);

    boolean existsByOrderIdAndTableIdAndUnlinkedAtIsNull(UUID orderId, UUID tableId);

    void deleteByOrderId(UUID orderId);

    void deleteByTableId(UUID tableId);
}
