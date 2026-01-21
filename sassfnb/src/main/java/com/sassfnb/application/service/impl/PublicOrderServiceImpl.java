package com.sassfnb.application.service.impl;

import com.sassfnb.adapters.persistence.entity.*;
import com.sassfnb.adapters.persistence.repository.*;
import com.sassfnb.adapters.rest.dto.publicorder.PublicOrderDtos.*;
import com.sassfnb.application.service.PublicOrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PublicOrderServiceImpl implements PublicOrderService {

    private final OrderRepository orderRepo;
    private final OrderItemRepository orderItemRepo;
    private final OrderItemOptionSelectionRepository selectionRepo;

    private final QrSessionRepository qrSessionRepo;

    private final MenuItemRepository menuItemRepo;
    private final MenuItemPriceRepository priceRepo;

    private final MenuOptionRepository optionRepo;
    private final MenuOptionValueRepository optionValueRepo;

    private final OrderTableRepository orderTableRepo;

    private static final String DRAFT = "DRAFT";
    private static final String OPEN = "OPEN";
    private static final String SUBMITTED = "SUBMITTED";
    private static final String PAID = "PAID";
    private static final String CLOSED = "CLOSED";
    private static final String VOIDED = "VOIDED";

    private static final Set<String> ACTIVE_STATUSES = Set.of(DRAFT, OPEN, SUBMITTED);

    @Override
    @Transactional
    public OrderResponse createOrder(CreateOrderRequest req) {
        if (req == null)
            throw new IllegalArgumentException("Request is required");

        if (req.outletId() == null || req.tableId() == null || req.qrSessionId() == null) {
            throw new IllegalArgumentException("outletId, tableId, qrSessionId are required");
        }

        Instant now = Instant.now();

        QrSessionEntity s = qrSessionRepo.findById(req.qrSessionId())
                .orElseThrow(() -> new IllegalArgumentException("qrSession not found"));

        if (!s.isAlive(now))
            throw new IllegalStateException("qrSession expired/closed");
        if (!req.tableId().equals(s.getTableId()))
            throw new IllegalStateException("qrSession table mismatch");
        if (!req.outletId().equals(s.getOutletId()))
            throw new IllegalStateException("qrSession outlet mismatch");

        // ✅ 1) reuse active order of this table (if exists)
        OrderEntity existing = findActiveOrderForTable(req.tableId());
        if (existing != null && req.outletId().equals(existing.getOutletId())) {
            attachOrderTableIfMissing(existing, req.tableId(), null, now);
            return buildOrderResponse(existing);
        }

        // ✅ 2) create new order
        OrderEntity o = new OrderEntity();
        o.setTenantId(s.getTenantId());
        o.setOutletId(req.outletId());
        o.setTableId(req.tableId());
        o.setQrSessionId(req.qrSessionId());
        o.setStatus(DRAFT);
        o.setBalanceAmount(BigDecimal.ZERO);
        o.setNote(req.note());
        o.setPeople(req.people());
        o.setOpenedAt(now);

        o = orderRepo.save(o);

        // ✅ 3) create order_tables mapping (MUST set tenant_id)
        attachOrderTableIfMissing(o, req.tableId(), null, now);

        return buildOrderResponse(o);
    }

    @Override
    @Transactional
    public OrderResponse addItems(UUID orderId, List<AddItemRequest> items) {
        OrderEntity o = mustGetOrder(orderId);
        ensureEditable(o);

        if (items == null || items.isEmpty())
            return buildOrderResponse(o);

        for (AddItemRequest it : items) {
            if (it == null)
                continue;

            if (it.menuItemId() == null || it.quantity() == null || it.quantity() <= 0) {
                throw new IllegalArgumentException("menuItemId & quantity>0 are required");
            }

            MenuItemEntity mi = menuItemRepo.findByIdAndOutletId(it.menuItemId(), o.getOutletId())
                    .orElseThrow(() -> new IllegalArgumentException("Menu item not found in outlet"));

            if (!Boolean.TRUE.equals(mi.getAvailable()))
                throw new IllegalStateException("Item not available");

            BigDecimal baseUnitPrice;
            UUID priceId = null;

            if (it.priceId() != null) {
                MenuItemPriceEntity p = priceRepo.findByIdAndMenuItemId(it.priceId(), mi.getId())
                        .orElseThrow(() -> new IllegalArgumentException("Invalid priceId for menu item"));
                baseUnitPrice = nvl(p.getPrice());
                priceId = p.getId();
            } else {
                baseUnitPrice = nvl(mi.getBasePrice());
            }

            SelectionValidationResult sel = validateSelectionsAndComputeExtra(
                    o.getTenantId(),
                    mi.getId(),
                    it.selectedOptions());

            BigDecimal unitPrice = baseUnitPrice.add(nvl(sel.extraPerUnit()));
            BigDecimal qty = BigDecimal.valueOf(it.quantity());
            BigDecimal discount = BigDecimal.ZERO;
            BigDecimal total = unitPrice.multiply(qty).subtract(discount);

            OrderItemEntity oi = new OrderItemEntity();
            oi.setTenantId(o.getTenantId());
            oi.setOrderId(o.getId());
            oi.setMenuItemId(mi.getId());
            oi.setPriceId(priceId);
            oi.setQuantity(it.quantity());
            oi.setUnitPrice(unitPrice);
            oi.setDiscountAmount(discount);
            oi.setTotalAmount(total);
            oi.setStatus("NEW");
            oi.setNote(it.note());

            oi = orderItemRepo.save(oi);

            for (SelectedOptionResolved r : sel.resolved()) {
                OrderItemOptionSelectionEntity e = new OrderItemOptionSelectionEntity();
                e.setTenantId(o.getTenantId());
                e.setOrderId(o.getId());
                e.setOrderItemId(oi.getId());
                e.setMenuItemId(mi.getId());
                e.setMenuOptionId(r.option().getId());
                e.setMenuOptionValueId(r.value().getId());
                e.setOptionName(r.option().getName());
                e.setValueName(r.value().getName());
                e.setExtraPrice(nvl(r.value().getExtraPrice()));
                selectionRepo.save(e);
            }
        }

        return buildOrderResponse(o);
    }

    @Override
    @Transactional
    public OrderResponse patchItem(UUID orderId, UUID itemId, PatchItemRequest req) {
        OrderEntity o = mustGetOrder(orderId);
        ensureEditable(o);

        OrderItemEntity item = orderItemRepo.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("Item not found"));

        if (!item.getOrderId().equals(orderId))
            throw new IllegalStateException("Item not in order");
        if (!"NEW".equalsIgnoreCase(item.getStatus()))
            throw new IllegalStateException("Only NEW item can be edited");

        if (req != null && req.quantity() != null) {
            if (req.quantity() <= 0)
                throw new IllegalArgumentException("quantity must be > 0");

            item.setQuantity(req.quantity());

            BigDecimal total = nvl(item.getUnitPrice())
                    .multiply(BigDecimal.valueOf(item.getQuantity()))
                    .subtract(nvl(item.getDiscountAmount()));

            item.setTotalAmount(total);
        }

        if (req != null && req.note() != null)
            item.setNote(req.note());

        orderItemRepo.save(item);
        return buildOrderResponse(o);
    }

    @Override
    @Transactional
    public OrderResponse deleteItem(UUID orderId, UUID itemId) {
        OrderEntity o = mustGetOrder(orderId);
        ensureEditable(o);

        OrderItemEntity item = orderItemRepo.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("Item not found"));

        if (!item.getOrderId().equals(orderId))
            throw new IllegalStateException("Item not in order");

        if ("FIRED".equalsIgnoreCase(item.getStatus()) || "SERVED".equalsIgnoreCase(item.getStatus())) {
            throw new IllegalStateException("Cannot delete FIRED/SERVED item");
        }

        selectionRepo.deleteByOrderItemId(item.getId());
        orderItemRepo.delete(item);

        return buildOrderResponse(o);
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponse getOrder(UUID orderId) {
        OrderEntity o = mustGetOrder(orderId);
        return buildOrderResponse(o);
    }

    // =========================
    // selection validation
    // =========================
    private SelectionValidationResult validateSelectionsAndComputeExtra(
            UUID tenantId,
            UUID menuItemId,
            List<SelectedOptionRequest> selectedOptions) {

        List<MenuOptionEntity> options = optionRepo.findByTenantIdAndItemIdOrderByNameAsc(tenantId, menuItemId);
        List<SelectedOptionRequest> reqList = (selectedOptions == null) ? List.of() : selectedOptions;

        Map<UUID, UUID> optToValue = new LinkedHashMap<>();
        for (SelectedOptionRequest r : reqList) {
            if (r == null)
                continue;

            if (r.optionId() == null || r.valueId() == null)
                throw new IllegalArgumentException("selectedOptions.optionId & selectedOptions.valueId are required");

            if (optToValue.containsKey(r.optionId()))
                throw new IllegalArgumentException(
                        "Each option can only choose 1 value. Duplicate optionId=" + r.optionId());

            optToValue.put(r.optionId(), r.valueId());
        }

        for (MenuOptionEntity opt : options) {
            boolean required = Boolean.TRUE.equals(opt.getRequired());
            if (required && !optToValue.containsKey(opt.getId()))
                throw new IllegalArgumentException("Missing required option: " + opt.getName());
        }

        BigDecimal extraPerUnit = BigDecimal.ZERO;
        List<SelectedOptionResolved> resolved = new ArrayList<>();

        Map<UUID, MenuOptionEntity> optionMap = options.stream()
                .collect(Collectors.toMap(MenuOptionEntity::getId, x -> x));

        for (var entry : optToValue.entrySet()) {
            UUID optionId = entry.getKey();
            UUID valueId = entry.getValue();

            MenuOptionEntity opt = optionMap.get(optionId);
            if (opt == null)
                throw new IllegalArgumentException("Invalid option for this item: optionId=" + optionId);

            MenuOptionValueEntity val = optionValueRepo.findByIdAndTenantId(valueId, tenantId)
                    .orElseThrow(() -> new IllegalArgumentException("Option value not found: valueId=" + valueId));

            if (!optionId.equals(val.getMenuOptionId()))
                throw new IllegalArgumentException(
                        "Value does not belong to option. optionId=" + optionId + " valueId=" + valueId);

            BigDecimal extra = nvl(val.getExtraPrice());
            extraPerUnit = extraPerUnit.add(extra);
            resolved.add(new SelectedOptionResolved(opt, val));
        }

        return new SelectionValidationResult(extraPerUnit, resolved);
    }

    private record SelectedOptionResolved(MenuOptionEntity option, MenuOptionValueEntity value) {
    }

    private record SelectionValidationResult(BigDecimal extraPerUnit, List<SelectedOptionResolved> resolved) {
    }

    // =========================
    // helpers
    // =========================
    private OrderEntity mustGetOrder(UUID orderId) {
        if (orderId == null)
            throw new IllegalArgumentException("Order not found");
        return orderRepo.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));
    }

    private void ensureEditable(OrderEntity o) {
        String st = safeUpper(o.getStatus());

        if (PAID.equals(st) || CLOSED.equals(st) || VOIDED.equals(st))
            throw new IllegalStateException("Order is not editable");

        if (!DRAFT.equals(st) && !OPEN.equals(st))
            throw new IllegalStateException("Order is not editable");
    }

    private OrderResponse buildOrderResponse(OrderEntity o) {
        List<OrderItemEntity> items = orderItemRepo.findByOrderIdOrderByCreatedAtAsc(o.getId());

        List<OrderItemOptionSelectionEntity> selections = selectionRepo.findByOrderIdOrderByCreatedAtAsc(o.getId());
        Map<UUID, List<OrderItemOptionSelectionEntity>> selectionsByItem = selections.stream()
                .collect(Collectors.groupingBy(OrderItemOptionSelectionEntity::getOrderItemId));

        BigDecimal grandTotal = items.stream()
                .map(i -> nvl(i.getTotalAmount()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<OrderItemResponse> itemResponses = items.stream()
                .map(i -> {
                    List<SelectedOptionResponse> sel = selectionsByItem.getOrDefault(i.getId(), List.of())
                            .stream()
                            .map(s -> new SelectedOptionResponse(
                                    s.getMenuOptionId(),
                                    s.getMenuOptionValueId(),
                                    s.getOptionName(),
                                    s.getValueName(),
                                    nvl(s.getExtraPrice())))
                            .toList();

                    return new OrderItemResponse(
                            i.getId(),
                            i.getMenuItemId(),
                            i.getPriceId(),
                            i.getQuantity(),
                            i.getUnitPrice(),
                            i.getDiscountAmount(),
                            i.getTotalAmount(),
                            i.getStatus(),
                            i.getNote(),
                            i.getCreatedAt(),
                            i.getUpdatedAt(),
                            sel);
                })
                .toList();

        return new OrderResponse(
                o.getId(),
                o.getTenantId(),
                o.getOutletId(),
                o.getTableId(),
                o.getQrSessionId(),
                o.getStatus(),
                o.getNote(),
                o.getPeople(),
                o.getOpenedAt(),
                o.getCreatedAt(),
                o.getUpdatedAt(),
                grandTotal,
                itemResponses);
    }

    // =========================
    // order_tables integration
    // =========================
    private OrderEntity findActiveOrderForTable(UUID tableId) {
        if (tableId == null)
            return null;

        UUID orderId = orderTableRepo.findTopByTableIdAndUnlinkedAtIsNullOrderByLinkedAtDesc(tableId)
                .map(OrderTableEntity::getOrderId)
                .orElse(null);

        if (orderId == null)
            return null;

        OrderEntity o = orderRepo.findById(orderId).orElse(null);
        if (o == null)
            return null;

        String st = safeUpper(o.getStatus());
        if (!ACTIVE_STATUSES.contains(st))
            return null;

        return o;
    }

    private void attachOrderTableIfMissing(OrderEntity order, UUID tableId, UUID addedBy, Instant now) {
        if (order == null || order.getId() == null || tableId == null)
            return;

        boolean exists = orderTableRepo.existsByOrderIdAndTableIdAndUnlinkedAtIsNull(order.getId(), tableId);
        if (exists)
            return;

        OrderTableEntity e = OrderTableEntity.builder()
                .id(UUID.randomUUID())
                .tenantId(order.getTenantId()) // ✅ FIX tenant_id NOT NULL
                .orderId(order.getId())
                .tableId(tableId)
                .linkedAt(now == null ? Instant.now() : now)
                .unlinkedAt(null)
                .addedBy(addedBy)
                .build();

        orderTableRepo.save(e);
    }

    private static BigDecimal nvl(BigDecimal v) {
        return v == null ? BigDecimal.ZERO : v;
    }

    private static String safeUpper(String s) {
        return s == null ? "" : s.trim().toUpperCase();
    }
}
