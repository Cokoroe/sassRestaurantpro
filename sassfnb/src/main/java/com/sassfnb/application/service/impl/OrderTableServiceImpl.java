package com.sassfnb.application.service.impl;

import com.sassfnb.adapters.persistence.entity.OrderEntity;
import com.sassfnb.adapters.persistence.entity.OrderTableEntity;
import com.sassfnb.adapters.persistence.repository.OrderRepository;
import com.sassfnb.adapters.persistence.repository.OrderTableRepository;
import com.sassfnb.application.ports.TenantResolver;
import com.sassfnb.application.service.OrderTableService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class OrderTableServiceImpl implements OrderTableService {

    private final OrderTableRepository orderTableRepo;
    private final OrderRepository orderRepo;
    private final TenantResolver tenantResolver;

    private UUID tenantId() {
        return tenantResolver.currentTenantId();
    }

    @Override
    @Transactional
    public void attach(UUID orderId, UUID tableId, UUID addedBy) {
        if (orderId == null || tableId == null) {
            throw new IllegalArgumentException("orderId & tableId are required");
        }

        // lấy order để lấy tenantId và check permission
        OrderEntity o = orderRepo.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));

        if (!Objects.equals(o.getTenantId(), tenantId())) {
            throw new SecurityException("Forbidden");
        }

        // idempotent: nếu mapping active đã tồn tại thì thôi
        if (orderTableRepo.existsByOrderIdAndTableIdAndUnlinkedAtIsNull(orderId, tableId)) {
            return;
        }

        Instant now = Instant.now();

        OrderTableEntity e = OrderTableEntity.builder()
                .id(UUID.randomUUID())
                .tenantId(o.getTenantId()) // ✅ tenant_id NOT NULL
                .orderId(orderId)
                .tableId(tableId)
                .linkedAt(now) // ✅ linked_at NOT NULL
                .unlinkedAt(null)
                .addedBy(addedBy)
                .build();

        orderTableRepo.save(e);
    }

    @Override
    @Transactional
    public void detachByOrder(UUID orderId) {
        if (orderId == null)
            return;

        OrderEntity o = orderRepo.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));

        if (!Objects.equals(o.getTenantId(), tenantId())) {
            throw new SecurityException("Forbidden");
        }

        Instant now = Instant.now();

        // detach = set unlinked_at cho tất cả mapping của order đang active
        var mappings = orderTableRepo.findByOrderId(orderId);
        for (var m : mappings) {
            if (m.getUnlinkedAt() == null) {
                m.setUnlinkedAt(now);
                orderTableRepo.save(m);
            }
        }
    }

    @Override
    @Transactional(readOnly = true)
    public UUID findLatestOrderIdByTable(UUID tableId) {
        if (tableId == null)
            return null;

        return orderTableRepo
                .findTopByTableIdAndUnlinkedAtIsNullOrderByLinkedAtDesc(tableId)
                .map(OrderTableEntity::getOrderId)
                .orElse(null);
    }
}
