// src/main/java/com/sassfnb/adapters/persistence/repository/OrderRepositoryCustom.java
package com.sassfnb.adapters.persistence.repository;

import com.sassfnb.adapters.persistence.entity.OrderEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface OrderRepositoryCustom {
    Page<OrderEntity> search(UUID outletId, String status, UUID tableId, String q, Pageable pageable);
}
