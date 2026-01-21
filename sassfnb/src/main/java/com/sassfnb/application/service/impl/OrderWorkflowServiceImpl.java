package com.sassfnb.application.service.impl;

import com.sassfnb.adapters.persistence.entity.OrderDiscountEntity;
import com.sassfnb.adapters.persistence.entity.OrderEntity;
import com.sassfnb.adapters.persistence.entity.OrderItemEntity;
import com.sassfnb.adapters.persistence.repository.OrderItemRepository;
import com.sassfnb.adapters.persistence.repository.OrderRepository;
import com.sassfnb.adapters.rest.dto.order.OrderDtos.*;
import com.sassfnb.application.ports.TenantResolver;
import com.sassfnb.application.service.OrderTableService;
import com.sassfnb.application.service.OrderWorkflowService;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.TypedQuery;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.*;

@Service
@RequiredArgsConstructor
@Transactional
public class OrderWorkflowServiceImpl implements OrderWorkflowService {

    private final OrderRepository orderRepo;
    private final OrderItemRepository itemRepo;
    private final TenantResolver tenantResolver;

    // ✅ ADD: detach mapping khi close/void nếu bạn muốn
    private final OrderTableService orderTableService;

    @PersistenceContext
    private EntityManager em;

    // =========================
    // Order status (String in DB)
    // =========================
    private static final String DRAFT = "DRAFT";
    private static final String OPEN = "OPEN";
    private static final String PAID = "PAID";
    private static final String SUBMITTED = "SUBMITTED"; // backward compat
    private static final String CLOSED = "CLOSED";
    private static final String VOIDED = "VOIDED";

    // Item status (KDS flow)
    private static final String NEW = "NEW";
    private static final String FIRED = "FIRED";
    private static final String IN_PROGRESS = "IN_PROGRESS";
    private static final String READY = "READY";
    private static final String SERVED = "SERVED";

    // Order-level discount type (from order_discounts)
    private static final String DISCOUNT_AMOUNT = "AMOUNT";
    private static final String DISCOUNT_PERCENT = "PERCENT";

    private UUID tenantId() {
        return tenantResolver.currentTenantId();
    }

    private boolean isFinalStatus(String s) {
        return PAID.equalsIgnoreCase(s) || CLOSED.equalsIgnoreCase(s) || VOIDED.equalsIgnoreCase(s);
    }

    private BigDecimal safe(BigDecimal x) {
        return x == null ? BigDecimal.ZERO : x;
    }

    private BigDecimal clamp(BigDecimal x, BigDecimal min, BigDecimal max) {
        if (x == null)
            return BigDecimal.ZERO;
        if (x.compareTo(min) < 0)
            return min;
        if (x.compareTo(max) > 0)
            return max;
        return x;
    }

    // =========================
    // ✅ SUBMIT (staff)
    // =========================
    @Override
    public SubmitOrderResponse submit(UUID orderId) {
        OrderEntity o = findOrderStaff(orderId);

        if (isFinalStatus(o.getStatus())) {
            throw new IllegalStateException("Cannot submit a PAID/CLOSED/VOIDED order");
        }

        var items = itemRepo.findByOrderIdOrderByCreatedAtAsc(orderId);
        if (items.isEmpty()) {
            throw new IllegalStateException("Cannot submit empty order");
        }

        boolean hasNew = items.stream().anyMatch(i -> NEW.equalsIgnoreCase(i.getStatus()));
        if (!hasNew) {
            throw new IllegalStateException("No NEW items to submit");
        }

        if (DRAFT.equalsIgnoreCase(o.getStatus())) {
            o.setStatus(OPEN);
        } else if (!OPEN.equalsIgnoreCase(o.getStatus())) {
            throw new IllegalStateException("Only DRAFT/OPEN order can be submitted");
        }

        Instant now = Instant.now();

        int firedCount = itemRepo.bulkUpdateStatusByOrderIdAndStatus(orderId, NEW, FIRED, now);
        if (firedCount <= 0) {
            throw new IllegalStateException("No NEW items were fired (unexpected)");
        }

        o = orderRepo.save(o);
        return new SubmitOrderResponse(o.getId(), o.getStatus(), o.getUpdatedAt());
    }

    // =========================
    // ✅ SUBMIT (public)
    // =========================
    @Override
    public SubmitOrderResponse submitPublic(UUID orderId, UUID outletId) {
        if (outletId == null)
            throw new IllegalArgumentException("outletId is required");

        OrderEntity o = findOrderPublic(orderId, outletId);

        if (isFinalStatus(o.getStatus())) {
            throw new IllegalStateException("Cannot submit a PAID/CLOSED/VOIDED order");
        }

        var items = itemRepo.findByOrderIdOrderByCreatedAtAsc(orderId);
        if (items.isEmpty()) {
            throw new IllegalStateException("Cannot submit empty order");
        }

        boolean hasNew = items.stream().anyMatch(i -> NEW.equalsIgnoreCase(i.getStatus()));
        if (!hasNew) {
            throw new IllegalStateException("No NEW items to submit");
        }

        if (DRAFT.equalsIgnoreCase(o.getStatus())) {
            o.setStatus(OPEN);
        } else if (!OPEN.equalsIgnoreCase(o.getStatus())) {
            throw new IllegalStateException("Only DRAFT/OPEN order can be submitted");
        }

        Instant now = Instant.now();

        int firedCount = itemRepo.bulkUpdateStatusByOrderIdAndStatus(orderId, NEW, FIRED, now);
        if (firedCount <= 0) {
            throw new IllegalStateException("No NEW items were fired (unexpected)");
        }

        o = orderRepo.save(o);
        return new SubmitOrderResponse(o.getId(), o.getStatus(), o.getUpdatedAt());
    }

    // =========================
    // REOPEN
    // =========================
    @Override
    public ReopenOrderResponse reopen(UUID orderId, ReopenOrderRequest req) {
        OrderEntity o = findOrderStaff(orderId);

        if (!OPEN.equalsIgnoreCase(o.getStatus())) {
            throw new IllegalStateException("Only OPEN order can be reopened to DRAFT");
        }

        var items = itemRepo.findByOrderIdOrderByCreatedAtAsc(orderId);
        boolean hasCookFlow = items.stream().anyMatch(i -> FIRED.equalsIgnoreCase(i.getStatus())
                || IN_PROGRESS.equalsIgnoreCase(i.getStatus())
                || READY.equalsIgnoreCase(i.getStatus())
                || SERVED.equalsIgnoreCase(i.getStatus()));
        if (hasCookFlow) {
            throw new IllegalStateException("Cannot reopen: some items already FIRED/IN_PROGRESS/READY/SERVED");
        }

        o.setStatus(DRAFT);

        if (req != null && req.reason() != null && !req.reason().isBlank()) {
            String extra = "[REOPEN] " + req.reason().trim();
            o.setNote(o.getNote() == null ? extra : (o.getNote() + "\n" + extra));
        }

        o = orderRepo.save(o);
        return new ReopenOrderResponse(o.getId(), o.getStatus(), o.getUpdatedAt());
    }

    @Override
    public ReopenOrderResponse reopenPublic(UUID orderId, UUID outletId, ReopenOrderRequest req) {
        if (outletId == null)
            throw new IllegalArgumentException("outletId is required");

        OrderEntity o = findOrderPublic(orderId, outletId);

        if (!OPEN.equalsIgnoreCase(o.getStatus())) {
            throw new IllegalStateException("Only OPEN order can be reopened to DRAFT");
        }

        var items = itemRepo.findByOrderIdOrderByCreatedAtAsc(orderId);
        boolean hasCookFlow = items.stream().anyMatch(i -> FIRED.equalsIgnoreCase(i.getStatus())
                || IN_PROGRESS.equalsIgnoreCase(i.getStatus())
                || READY.equalsIgnoreCase(i.getStatus())
                || SERVED.equalsIgnoreCase(i.getStatus()));
        if (hasCookFlow) {
            throw new IllegalStateException("Cannot reopen: some items already FIRED/IN_PROGRESS/READY/SERVED");
        }

        o.setStatus(DRAFT);

        if (req != null && req.reason() != null && !req.reason().isBlank()) {
            String extra = "[REOPEN] " + req.reason().trim();
            o.setNote(o.getNote() == null ? extra : (o.getNote() + "\n" + extra));
        }

        o = orderRepo.save(o);
        return new ReopenOrderResponse(o.getId(), o.getStatus(), o.getUpdatedAt());
    }

    // =========================
    // LIST/GET
    // =========================
    @Override
    @Transactional(readOnly = true)
    public Page<OrderResponse> staffList(StaffOrderListRequest req, Pageable pageable) {
        Page<OrderEntity> page = searchOrders(req, pageable);
        return page.map(this::toOrderResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponse staffGet(UUID orderId) {
        return toOrderResponse(findOrderStaff(orderId));
    }

    // =========================
    // FIRE
    // =========================
    @Override
    public OrderResponse fire(UUID orderId, FireOrderRequest req) {
        OrderEntity o = findOrderStaff(orderId);

        if (!OPEN.equalsIgnoreCase(o.getStatus())) {
            throw new IllegalStateException("Only OPEN order can be fired");
        }

        var items = itemRepo.findByOrderIdOrderByCreatedAtAsc(orderId);

        boolean fireAll = req != null && Boolean.TRUE.equals(req.all());
        Set<UUID> targetIds = new HashSet<>(
                Optional.ofNullable(req).map(FireOrderRequest::itemIds).orElse(List.of()));

        Instant now = Instant.now();

        for (var it : items) {
            boolean shouldFire = fireAll || targetIds.contains(it.getId());
            if (!shouldFire)
                continue;

            if (NEW.equalsIgnoreCase(it.getStatus())) {
                it.setStatus(FIRED);
                it.setUpdatedAt(now);
                itemRepo.save(it);
            }
        }

        return toOrderResponse(findOrderStaff(orderId));
    }

    // =========================
    // VOID
    // =========================
    @Override
    public OrderResponse voidItem(UUID orderId, UUID itemId, VoidItemRequest req) {
        findOrderStaff(orderId);

        OrderItemEntity it = itemRepo.findByIdAndOrderId(itemId, orderId)
                .orElseThrow(() -> new NoSuchElementException("Order item not found"));

        if (SERVED.equalsIgnoreCase(it.getStatus())) {
            throw new IllegalStateException("Cannot void SERVED item");
        }

        it.setStatus(VOIDED);

        if (req != null && req.reason() != null && !req.reason().isBlank()) {
            String extra = "[VOID] " + req.reason().trim();
            it.setNote(it.getNote() == null ? extra : (it.getNote() + "\n" + extra));
        }

        itemRepo.save(it);
        return toOrderResponse(findOrderStaff(orderId));
    }

    @Override
    public OrderResponse voidOrder(UUID orderId, VoidOrderRequest req) {
        OrderEntity o = findOrderStaff(orderId);

        if (PAID.equalsIgnoreCase(o.getStatus()) || CLOSED.equalsIgnoreCase(o.getStatus())) {
            throw new IllegalStateException("Cannot void PAID/CLOSED order");
        }

        o.setStatus(VOIDED);

        if (req != null && req.reason() != null && !req.reason().isBlank()) {
            String extra = "[VOID ORDER] " + req.reason().trim();
            o.setNote(o.getNote() == null ? extra : (o.getNote() + "\n" + extra));
        }

        orderRepo.save(o);

        var items = itemRepo.findByOrderIdOrderByCreatedAtAsc(orderId);
        for (var it : items) {
            if (!SERVED.equalsIgnoreCase(it.getStatus())) {
                it.setStatus(VOIDED);
                itemRepo.save(it);
            }
        }

        // ✅ OPTIONAL: void xong cũng detach table để tránh quét QR ra order lỗi
        orderTableService.detachByOrder(orderId);

        return toOrderResponse(findOrderStaff(orderId));
    }

    @Override
    public OrderResponse patchNote(UUID orderId, PatchOrderNoteRequest req) {
        OrderEntity o = findOrderStaff(orderId);
        o.setNote(req == null ? null : req.note());
        orderRepo.save(o);
        return toOrderResponse(findOrderStaff(orderId));
    }

    private OrderEntity findOrderStaff(UUID orderId) {
        OrderEntity o = orderRepo.findById(orderId)
                .orElseThrow(() -> new NoSuchElementException("Order not found"));

        if (!Objects.equals(o.getTenantId(), tenantId())) {
            throw new SecurityException("Forbidden");
        }
        return o;
    }

    @Override
    @Transactional(readOnly = true)
    public OrderTotalsResponse totals(UUID orderId) {
        OrderEntity o = findOrderStaff(orderId);

        BigDecimal subTotal = safe(itemRepo.sumTotalByOrderIdExcludeStatus(orderId, VOIDED));
        BigDecimal itemDiscountTotal = safe(itemRepo.sumDiscountByOrderIdExcludeStatus(orderId, VOIDED));

        BigDecimal orderDiscount = resolveOrderLevelDiscount(o.getId(), subTotal);

        BigDecimal discountTotal = itemDiscountTotal.add(orderDiscount);

        BigDecimal surchargeTotal = BigDecimal.ZERO; // MVP
        BigDecimal grandTotal = subTotal.subtract(discountTotal).add(surchargeTotal);
        grandTotal = clamp(grandTotal, BigDecimal.ZERO, subTotal.add(surchargeTotal));

        return new OrderTotalsResponse(
                o.getId(),
                safe(subTotal),
                safe(discountTotal),
                safe(surchargeTotal),
                safe(grandTotal),
                Instant.now());
    }

    private BigDecimal resolveOrderLevelDiscount(UUID orderId, BigDecimal subTotal) {
        if (subTotal == null || subTotal.compareTo(BigDecimal.ZERO) <= 0)
            return BigDecimal.ZERO;

        try {
            TypedQuery<OrderDiscountEntity> q = em.createQuery(
                    "select d from OrderDiscountEntity d " +
                            "where d.tenantId = :tenantId and d.orderId = :orderId " +
                            "order by d.createdAt desc",
                    OrderDiscountEntity.class);
            q.setParameter("tenantId", tenantId());
            q.setParameter("orderId", orderId);
            q.setMaxResults(1);

            List<OrderDiscountEntity> rows = q.getResultList();
            if (rows.isEmpty())
                return BigDecimal.ZERO;

            OrderDiscountEntity d = rows.get(0);
            if (d == null)
                return BigDecimal.ZERO;

            String type = d.getType();
            BigDecimal value = safe(d.getValue());

            BigDecimal result;
            if (DISCOUNT_PERCENT.equalsIgnoreCase(type)) {
                result = subTotal.multiply(value)
                        .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            } else if (DISCOUNT_AMOUNT.equalsIgnoreCase(type)) {
                result = value;
            } else {
                return BigDecimal.ZERO;
            }

            return clamp(result, BigDecimal.ZERO, subTotal);

        } catch (Exception ex) {
            return BigDecimal.ZERO;
        }
    }

    // =========================
    // ✅ CLOSE = PAID + detach order_tables
    // =========================
    @Override
    public CloseOrderResponse close(UUID orderId, CloseOrderRequest req) {
        OrderEntity o = findOrderStaff(orderId);

        if (!OPEN.equalsIgnoreCase(o.getStatus()) && !SUBMITTED.equalsIgnoreCase(o.getStatus())) {
            throw new IllegalStateException("Only OPEN/SUBMITTED order can be closed");
        }

        var items = itemRepo.findByOrderIdOrderByCreatedAtAsc(orderId);
        if (items.isEmpty()) {
            throw new IllegalStateException("Cannot close empty order");
        }

        if (req != null && req.note() != null && !req.note().isBlank()) {
            String extra = "[CLOSE] " + req.note().trim();
            o.setNote(o.getNote() == null ? extra : (o.getNote() + "\n" + extra));
        }

        Instant now = Instant.now();

        o.setStatus(PAID);
        o.setClosedAt(now);

        o = orderRepo.save(o);

        // ✅ detach table mapping để bàn rảnh, quét QR tạo order mới
        orderTableService.detachByOrder(orderId);

        return new CloseOrderResponse(o.getId(), o.getStatus(), o.getClosedAt(), o.getUpdatedAt());
    }

    private OrderEntity findOrderPublic(UUID orderId, UUID outletId) {
        OrderEntity o = orderRepo.findById(orderId)
                .orElseThrow(() -> new NoSuchElementException("Order not found"));

        if (!Objects.equals(o.getOutletId(), outletId)) {
            throw new SecurityException("Forbidden");
        }
        return o;
    }

    private OrderResponse toOrderResponse(OrderEntity o) {
        var items = itemRepo.findByOrderIdOrderByCreatedAtAsc(o.getId());

        BigDecimal grandTotal = items.stream()
                .filter(i -> !VOIDED.equalsIgnoreCase(i.getStatus()))
                .map(i -> i.getTotalAmount() == null ? BigDecimal.ZERO : i.getTotalAmount())
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        var itemDtos = items.stream().map(this::toItemResponse).toList();

        return new OrderResponse(
                o.getId(),
                o.getTenantId(),
                o.getOutletId(),
                o.getTableId(),
                o.getReservationId(),
                o.getOpenedBy(),
                o.getQrSessionId(),
                o.getPeople(),
                o.getOpenedAt(),
                o.getClosedAt(),
                o.getStatus(),
                o.getNote(),
                grandTotal,
                itemDtos,
                o.getCreatedAt(),
                o.getUpdatedAt());
    }

    private OrderItemResponse toItemResponse(OrderItemEntity it) {
        return new OrderItemResponse(
                it.getId(),
                it.getMenuItemId(),
                it.getPriceId(),
                it.getQuantity(),
                it.getUnitPrice(),
                it.getDiscountAmount(),
                it.getTotalAmount(),
                it.getStatus(),
                it.getNote(),
                it.getCreatedAt(),
                it.getUpdatedAt());
    }

    private Page<OrderEntity> searchOrders(StaffOrderListRequest req, Pageable pageable) {
        if (req == null || req.outletId() == null) {
            throw new IllegalArgumentException("outletId is required");
        }

        StringBuilder jpql = new StringBuilder(
                "select o from OrderEntity o where o.tenantId = :tenantId and o.outletId = :outletId");
        StringBuilder countJpql = new StringBuilder(
                "select count(o) from OrderEntity o where o.tenantId = :tenantId and o.outletId = :outletId");

        Map<String, Object> params = new HashMap<>();
        params.put("tenantId", tenantId());
        params.put("outletId", req.outletId());

        if (req.status() != null && !req.status().isBlank()) {
            jpql.append(" and lower(o.status) = lower(:status)");
            countJpql.append(" and lower(o.status) = lower(:status)");
            params.put("status", req.status().trim());
        }

        if (req.tableId() != null) {
            jpql.append(" and o.tableId = :tableId");
            countJpql.append(" and o.tableId = :tableId");
            params.put("tableId", req.tableId());
        }

        if (req.q() != null && !req.q().isBlank()) {
            jpql.append(" and (o.note is not null and lower(o.note) like lower(:q))");
            countJpql.append(" and (o.note is not null and lower(o.note) like lower(:q))");
            params.put("q", "%" + req.q().trim() + "%");
        }

        jpql.append(" order by o.createdAt desc");

        var query = em.createQuery(jpql.toString(), OrderEntity.class);
        var countQuery = em.createQuery(countJpql.toString(), Long.class);

        params.forEach((k, v) -> {
            query.setParameter(k, v);
            countQuery.setParameter(k, v);
        });

        query.setFirstResult((int) pageable.getOffset());
        query.setMaxResults(pageable.getPageSize());

        List<OrderEntity> content = query.getResultList();
        long total = countQuery.getSingleResult();

        return new PageImpl<>(content, pageable, total);
    }
}
