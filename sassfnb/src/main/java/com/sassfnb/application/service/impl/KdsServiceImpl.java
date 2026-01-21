package com.sassfnb.application.service.impl;

import com.sassfnb.adapters.persistence.entity.OrderEntity;
import com.sassfnb.adapters.persistence.entity.OrderItemEntity;
import com.sassfnb.adapters.persistence.repository.OrderItemRepository;
import com.sassfnb.adapters.persistence.repository.OrderRepository;
import com.sassfnb.adapters.rest.dto.kds.KdsDtos.*;
import com.sassfnb.application.service.KdsService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

import static com.sassfnb.adapters.rest.dto.kds.KdsDtos.KdsItemStatus.*;

@Service
@RequiredArgsConstructor
@Transactional
public class KdsServiceImpl implements KdsService {

    private final OrderItemRepository itemRepo;
    private final OrderRepository orderRepo;

    @Override
    @Transactional(readOnly = true)
    public KdsBoardsResponse getBoards(UUID tenantId, UUID outletId, Instant since, List<String> statuses) {
        if (tenantId == null)
            throw new IllegalArgumentException("tenantId is required");
        if (outletId == null)
            throw new IllegalArgumentException("outletId is required");

        Instant sinceTs = (since != null) ? since : Instant.EPOCH;

        List<String> statusUpper = normalizeStatuses(statuses);

        // ✅ CHỐT LUỒNG: KDS mặc định chỉ quan tâm FIRED -> IN_PROGRESS -> READY
        if (statusUpper == null) {
            statusUpper = List.of(FIRED, IN_PROGRESS, READY);
        }

        List<OrderItemEntity> items = itemRepo.findKdsItems(tenantId, outletId, sinceTs, statusUpper);

        List<UUID> orderIds = items.stream().map(OrderItemEntity::getOrderId).distinct().toList();
        Map<UUID, OrderEntity> ordersById = orderRepo.findAllById(orderIds).stream()
                .collect(Collectors.toMap(OrderEntity::getId, o -> o));

        List<KdsBoardItemResponse> dtoItems = items.stream().map(oi -> {
            OrderEntity o = ordersById.get(oi.getOrderId());
            return new KdsBoardItemResponse(
                    oi.getId(),
                    oi.getStatus(),
                    oi.getQuantity(),
                    oi.getNote(),
                    oi.getMenuItemId(),
                    oi.getPriceId(),
                    oi.getUnitPrice(),
                    oi.getTotalAmount(),
                    oi.getCreatedAt(),

                    (o == null ? oi.getOrderId() : o.getId()),
                    (o == null ? null : o.getStatus()),
                    (o == null ? null : o.getTableId()),
                    (o == null ? null : o.getPeople()),
                    (o == null ? null : o.getNote()),
                    (o == null ? null : o.getOpenedAt()));
        }).toList();

        return new KdsBoardsResponse(outletId, sinceTs, statusUpper, dtoItems);
    }

    @Override
    public PatchKdsItemStatusResponse patchItemStatus(UUID itemId, PatchKdsItemStatusRequest req) {
        if (itemId == null)
            throw new IllegalArgumentException("itemId is required");
        if (req == null || req.status() == null || req.status().isBlank()) {
            throw new IllegalArgumentException("status is required");
        }

        String target = req.status().trim().toUpperCase();

        if (!Set.of(IN_PROGRESS, READY).contains(target)) {
            throw new IllegalArgumentException("status must be IN_PROGRESS or READY");
        }

        OrderItemEntity it = itemRepo.findById(itemId)
                .orElseThrow(() -> new NoSuchElementException("Order item not found"));

        String old = safeUpper(it.getStatus());

        if (Set.of(SERVED, VOIDED).contains(old)) {
            throw new IllegalStateException("Cannot update status of SERVED/VOIDED item");
        }

        // ✅ Transition đúng luồng:
        // FIRED -> IN_PROGRESS
        // FIRED/IN_PROGRESS -> READY
        if (IN_PROGRESS.equals(target) && !FIRED.equals(old)) {
            throw new IllegalStateException("Only FIRED item can become IN_PROGRESS");
        }

        if (READY.equals(target) && !(FIRED.equals(old) || IN_PROGRESS.equals(old))) {
            throw new IllegalStateException("Only FIRED/IN_PROGRESS item can become READY");
        }

        it.setStatus(target);
        itemRepo.save(it);

        return new PatchKdsItemStatusResponse(it.getId(), old, target, it.getUpdatedAt());
    }

    @Override
    public PatchKdsItemStatusResponse markServed(UUID orderId, UUID itemId) {
        if (orderId == null)
            throw new IllegalArgumentException("orderId is required");
        if (itemId == null)
            throw new IllegalArgumentException("itemId is required");

        OrderItemEntity it = itemRepo.findByIdAndOrderId(itemId, orderId)
                .orElseThrow(() -> new NoSuchElementException("Order item not found"));

        String old = safeUpper(it.getStatus());

        if (!READY.equals(old)) {
            throw new IllegalStateException("Only READY item can be served");
        }

        it.setStatus(SERVED);
        itemRepo.save(it);

        return new PatchKdsItemStatusResponse(it.getId(), old, SERVED, it.getUpdatedAt());
    }

    private String safeUpper(String s) {
        return s == null ? "" : s.trim().toUpperCase();
    }

    private List<String> normalizeStatuses(List<String> statuses) {
        if (statuses == null || statuses.isEmpty())
            return null;

        List<String> normalized = statuses.stream()
                .filter(Objects::nonNull)
                .map(s -> s.trim().toUpperCase())
                .filter(s -> !s.isBlank())
                .distinct()
                .toList();

        return normalized.isEmpty() ? null : normalized;
    }
}
