package com.sassfnb.adapters.persistence.repository;

import com.sassfnb.adapters.persistence.entity.OrderItemOptionSelectionEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface OrderItemOptionSelectionRepository extends JpaRepository<OrderItemOptionSelectionEntity, UUID> {

    List<OrderItemOptionSelectionEntity> findByOrderIdOrderByCreatedAtAsc(UUID orderId);

    List<OrderItemOptionSelectionEntity> findByOrderItemIdOrderByCreatedAtAsc(UUID orderItemId);

    void deleteByOrderItemId(UUID orderItemId);

    void deleteByOrderId(UUID orderId);
}
