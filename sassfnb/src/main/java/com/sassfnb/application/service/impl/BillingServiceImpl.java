package com.sassfnb.application.service.impl;

import com.sassfnb.adapters.persistence.entity.BillingGroupEntity;
import com.sassfnb.adapters.persistence.entity.BillingGroupOrderEntity;
import com.sassfnb.adapters.persistence.entity.OrderEntity;
import com.sassfnb.adapters.persistence.entity.OrderItemEntity;
import com.sassfnb.adapters.persistence.entity.TableEntity;
import com.sassfnb.adapters.persistence.repository.BillingCalcRepository;
import com.sassfnb.adapters.persistence.repository.BillingGroupOrderRepository;
import com.sassfnb.adapters.persistence.repository.BillingGroupRepository;
import com.sassfnb.adapters.persistence.repository.OrderItemRepository;
import com.sassfnb.adapters.persistence.repository.OrderRepository;
import com.sassfnb.adapters.persistence.repository.SettingsRepository;
import com.sassfnb.adapters.persistence.repository.TableRepository;
import com.sassfnb.adapters.rest.dto.billing.BillingDtos.*;
import com.sassfnb.application.domain.billing.BillingGroupStatus;
import com.sassfnb.application.exception.BadRequestException;
import com.sassfnb.application.exception.NotFoundException;
import com.sassfnb.application.ports.TenantResolver;
import com.sassfnb.application.service.BillingService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.*;

@Service
@RequiredArgsConstructor
public class BillingServiceImpl implements BillingService {

    private final TenantResolver tenantResolver;

    private final BillingCalcRepository billingCalcRepository; // EntityManager repo
    private final BillingGroupRepository billingGroupRepository;
    private final BillingGroupOrderRepository billingGroupOrderRepository;

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;

    private final TableRepository tableRepository; // ✅ uses outletId only (no tenantId in TableEntity)
    private final SettingsRepository settingsRepository;

    // Settings keys
    private static final String KEY_SERVICE_CHARGE_RATE = "SERVICE_CHARGE_RATE"; // "0.1"
    private static final String KEY_TAX_RATE = "TAX_RATE"; // "0.08"

    // =========================
    // 0) PREPARE GROUP (UX helper)
    // =========================
    @Override
    @Transactional(readOnly = true)
    public BillingGroupPrepareResponse prepareGroup(UUID outletId) {
        UUID tenantId = tenantResolver.currentTenantId();
        UUID resolvedOutletId = outletId != null ? outletId : tenantResolver.currentOutletId();

        // 1) load all tables of outlet (soft-delete excluded)
        List<TableEntity> tables = tableRepository.findByOutletIdAndDeletedFalse(resolvedOutletId);

        if (tables == null || tables.isEmpty()) {
            return BillingGroupPrepareResponse.builder()
                    .outletId(resolvedOutletId)
                    .tables(List.of())
                    .build();
        }

        List<UUID> tableIds = tables.stream()
                .map(TableEntity::getId)
                .filter(Objects::nonNull)
                .toList();

        // 2) find active orders for those tables (repo should sort latest first)
        List<OrderEntity> activeOrders = tableIds.isEmpty()
                ? List.of()
                : orderRepository.findActiveOrdersByTableIds(tenantId, resolvedOutletId, tableIds);

        // map tableId -> latest order (because list already ordered desc)
        Map<UUID, OrderEntity> latestByTable = new HashMap<>();
        if (activeOrders != null) {
            for (OrderEntity o : activeOrders) {
                if (o == null || o.getTableId() == null)
                    continue;
                latestByTable.putIfAbsent(o.getTableId(), o);
            }
        }

        // 3) build response for FE
        List<BillingGroupPrepareItem> items = tables.stream()
                .sorted(Comparator.comparing(t -> safeStr(t.getCode())))
                .map(t -> {
                    OrderEntity o = latestByTable.get(t.getId());
                    return BillingGroupPrepareItem.builder()
                            .tableId(t.getId())
                            .tableCode(t.getCode())
                            .tableName(t.getName())
                            .activeOrderId(o == null ? null : o.getId())
                            .activeOrderStatus(o == null ? null : o.getStatus())
                            // OrderEntity.openedAt is Instant in your project style -> convert to
                            // OffsetDateTime
                            .openedAt(o == null ? null : toOdt(o.getOpenedAt()))
                            .build();
                })
                .toList();

        return BillingGroupPrepareResponse.builder()
                .outletId(resolvedOutletId)
                .tables(items)
                .build();
    }

    // =========================
    // 1) TOTALS
    // =========================
    @Override
    @Transactional(readOnly = true)
    public BillingTotalsResponse getTotals(BillingScope scope, UUID orderId, UUID groupId) {
        UUID tenantId = tenantResolver.currentTenantId();
        UUID outletId = tenantResolver.currentOutletId();

        BigDecimal subTotal;
        BigDecimal discountTotal;
        BigDecimal paidTotal;

        if (scope == BillingScope.ORDER) {
            if (orderId == null)
                throw new BadRequestException("orderId is required when scope=ORDER");

            OrderEntity order = orderRepository.findById(orderId)
                    .orElseThrow(() -> new NotFoundException("Order not found: " + orderId));

            assertTenantAndOutlet(order.getTenantId(), order.getOutletId(), tenantId, outletId, "Order");

            var agg = billingCalcRepository.calcOrderAgg(tenantId, orderId);
            subTotal = nvl(agg.subTotal());
            discountTotal = nvl(agg.discountTotal());
            paidTotal = nvl(billingCalcRepository.sumPaidByOrder(tenantId, orderId));

        } else if (scope == BillingScope.GROUP) {
            if (groupId == null)
                throw new BadRequestException("groupId is required when scope=GROUP");

            BillingGroupEntity group = billingGroupRepository.findByIdAndTenantId(groupId, tenantId)
                    .orElseThrow(() -> new NotFoundException("Billing group not found: " + groupId));

            if (!outletId.equals(group.getOutletId())) {
                throw new BadRequestException("Group not in outlet scope");
            }

            var agg = billingCalcRepository.calcGroupAgg(tenantId, groupId);
            subTotal = nvl(agg.subTotal());
            discountTotal = nvl(agg.discountTotal());
            paidTotal = nvl(billingCalcRepository.sumPaidByGroup(tenantId, groupId));

        } else {
            throw new BadRequestException("Invalid scope: " + scope);
        }

        BigDecimal base = subTotal.subtract(discountTotal).max(BigDecimal.ZERO);

        BigDecimal serviceRate = getRateSetting(tenantId, outletId, KEY_SERVICE_CHARGE_RATE);
        BigDecimal taxRate = getRateSetting(tenantId, outletId, KEY_TAX_RATE);

        BigDecimal serviceCharge = base.multiply(serviceRate);
        BigDecimal tax = base.add(serviceCharge).multiply(taxRate);

        BigDecimal grandTotal = base.add(serviceCharge).add(tax).max(BigDecimal.ZERO);
        BigDecimal dueTotal = grandTotal.subtract(paidTotal).max(BigDecimal.ZERO);

        return BillingTotalsResponse.builder()
                .subTotal(subTotal)
                .discountTotal(discountTotal)
                .serviceCharge(serviceCharge)
                .tax(tax)
                .grandTotal(grandTotal)
                .paidTotal(paidTotal)
                .dueTotal(dueTotal)
                .build();
    }

    // =========================
    // 2) CREATE GROUP (orderIds OR tableIds)
    // =========================
    @Override
    @Transactional
    public UUID createGroup(CreateGroupRequest request) {
        if (request == null)
            throw new BadRequestException("Body is required");

        UUID tenantId = tenantResolver.currentTenantId();
        UUID outletId = request.outletId() != null ? request.outletId() : tenantResolver.currentOutletId();

        // Resolve orderIds
        List<UUID> resolvedOrderIds = resolveOrderIdsForCreateGroup(tenantId, outletId, request);

        // Validate all orders belong to tenant+outlet
        int ok = orderRepository.countByTenantIdAndOutletIdAndIdIn(tenantId, outletId, resolvedOrderIds);
        if (ok != resolvedOrderIds.size()) {
            throw new BadRequestException("Some orders not found / not in outlet scope");
        }

        BillingGroupEntity group = new BillingGroupEntity();
        group.setTenantId(tenantId);
        group.setOutletId(outletId);
        group.setName(blankToNull(request.name()));
        group.setNote(blankToNull(request.note()));
        group.setStatus(BillingGroupStatus.OPEN);

        group = billingGroupRepository.save(group);

        UUID groupId = group.getId();
        for (UUID oid : resolvedOrderIds) {
            billingGroupOrderRepository.save(link(tenantId, groupId, oid));
        }

        return groupId;
    }

    // =========================
    // 3) LIST GROUPS
    // =========================
    @Override
    @Transactional(readOnly = true)
    public Page<BillingGroupSummary> listGroups(UUID outletId, String status, String q, Pageable pageable) {
        UUID tenantId = tenantResolver.currentTenantId();
        UUID resolvedOutletId = outletId != null ? outletId : tenantResolver.currentOutletId();

        boolean hasQ = q != null && !q.isBlank();
        boolean hasStatus = status != null && !status.isBlank();

        Page<BillingGroupEntity> page;
        if (hasStatus && hasQ) {
            page = billingGroupRepository.findByTenantIdAndOutletIdAndStatusAndNameContainingIgnoreCase(
                    tenantId, resolvedOutletId, BillingGroupStatus.valueOf(status.toUpperCase()), q.trim(), pageable);
        } else if (hasStatus) {
            page = billingGroupRepository.findByTenantIdAndOutletIdAndStatus(
                    tenantId, resolvedOutletId, BillingGroupStatus.valueOf(status.toUpperCase()), pageable);
        } else if (hasQ) {
            page = billingGroupRepository.findByTenantIdAndOutletIdAndNameContainingIgnoreCase(
                    tenantId, resolvedOutletId, q.trim(), pageable);
        } else {
            page = billingGroupRepository.findByTenantIdAndOutletId(tenantId, resolvedOutletId, pageable);
        }

        return page.map(g -> BillingGroupSummary.builder()
                .id(g.getId())
                .name(g.getName())
                .note(g.getNote())
                .status(g.getStatus())
                .createdAt(toOdt(g.getCreatedAt()))
                .build());
    }

    // =========================
    // 4) GROUP DETAIL
    // =========================
    @Override
    @Transactional(readOnly = true)
    public BillingGroupDetailResponse getGroup(UUID groupId) {
        UUID tenantId = tenantResolver.currentTenantId();

        BillingGroupEntity group = billingGroupRepository.findByIdAndTenantId(groupId, tenantId)
                .orElseThrow(() -> new NotFoundException("Billing group not found: " + groupId));

        List<BillingGroupOrderEntity> links = billingGroupOrderRepository.findByTenantIdAndGroupId(tenantId, groupId);
        List<UUID> orderIds = links.stream().map(BillingGroupOrderEntity::getOrderId).toList();

        List<OrderEntity> orders = orderIds.isEmpty()
                ? List.of()
                : orderRepository.findByTenantIdAndIdIn(tenantId, orderIds);

        List<OrderItemEntity> items = orderIds.isEmpty()
                ? List.of()
                : orderItemRepository.findByTenantIdAndOrderIdIn(tenantId, orderIds);

        BillingTotalsResponse totals = getTotals(BillingScope.GROUP, null, groupId);

        List<OrderInfo> orderInfos = orders.stream()
                .sorted(Comparator.comparing(OrderEntity::getCreatedAt))
                .map(o -> OrderInfo.builder()
                        .id(o.getId())
                        .tableId(o.getTableId())
                        .status(o.getStatus())
                        .openedAt(toOdt(o.getOpenedAt()))
                        .build())
                .toList();

        List<OrderItemInfo> itemInfos = items.stream()
                .sorted(Comparator.comparing(OrderItemEntity::getCreatedAt))
                .map(i -> OrderItemInfo.builder()
                        .id(i.getId())
                        .orderId(i.getOrderId())
                        .menuItemId(i.getMenuItemId())
                        .quantity(i.getQuantity())
                        .unitPrice(nvl(i.getUnitPrice()))
                        .discountAmount(nvl(i.getDiscountAmount()))
                        .totalAmount(nvl(i.getTotalAmount()))
                        .status(i.getStatus())
                        .build())
                .toList();

        return BillingGroupDetailResponse.builder()
                .id(group.getId())
                .outletId(group.getOutletId())
                .name(group.getName())
                .note(group.getNote())
                .status(group.getStatus())
                .createdAt(toOdt(group.getCreatedAt()))
                .orders(orderInfos)
                .items(itemInfos)
                .totals(totals)
                .build();
    }

    // =========================
    // 5) UPDATE GROUP
    // =========================
    @Override
    @Transactional
    public void updateGroup(UUID groupId, UpdateGroupRequest request) {
        UUID tenantId = tenantResolver.currentTenantId();
        UUID outletId = tenantResolver.currentOutletId();

        BillingGroupEntity group = billingGroupRepository.findByIdAndTenantId(groupId, tenantId)
                .orElseThrow(() -> new NotFoundException("Billing group not found: " + groupId));

        if (group.getStatus() != BillingGroupStatus.OPEN) {
            throw new BadRequestException("Only OPEN group can be updated");
        }

        if (request != null) {
            if (request.name() != null)
                group.setName(blankToNull(request.name()));
            if (request.note() != null)
                group.setNote(blankToNull(request.note()));

            if (request.addOrderIds() != null && !request.addOrderIds().isEmpty()) {
                List<UUID> addIds = request.addOrderIds().stream().filter(Objects::nonNull).distinct().toList();
                int ok = orderRepository.countByTenantIdAndOutletIdAndIdIn(tenantId, outletId, addIds);
                if (ok != addIds.size()) {
                    throw new BadRequestException("Some addOrderIds not found / not in outlet scope");
                }
                for (UUID oid : addIds) {
                    billingGroupOrderRepository.findByTenantIdAndGroupIdAndOrderId(tenantId, groupId, oid)
                            .orElseGet(() -> billingGroupOrderRepository.save(link(tenantId, groupId, oid)));
                }
            }

            if (request.removeOrderIds() != null && !request.removeOrderIds().isEmpty()) {
                List<UUID> rmIds = request.removeOrderIds().stream().filter(Objects::nonNull).distinct().toList();
                billingGroupOrderRepository.deleteByTenantIdAndGroupIdAndOrderIdIn(tenantId, groupId, rmIds);
            }
        }

        billingGroupRepository.save(group);
    }

    // =========================
    // 6) DELETE GROUP
    // =========================
    @Override
    @Transactional
    public void deleteGroup(UUID groupId) {
        UUID tenantId = tenantResolver.currentTenantId();

        BillingGroupEntity group = billingGroupRepository.findByIdAndTenantId(groupId, tenantId)
                .orElseThrow(() -> new NotFoundException("Billing group not found: " + groupId));

        if (group.getStatus() != BillingGroupStatus.OPEN) {
            throw new BadRequestException("Only OPEN group can be deleted");
        }

        billingGroupRepository.delete(group);
    }

    // =========================
    // INTERNAL HELPERS
    // =========================

    private List<UUID> resolveOrderIdsForCreateGroup(UUID tenantId, UUID outletId, CreateGroupRequest request) {
        // 1) Use orderIds if provided
        if (request.orderIds() != null && !request.orderIds().isEmpty()) {
            return request.orderIds().stream().filter(Objects::nonNull).distinct().toList();
        }

        // 2) Otherwise resolve from tableIds (UX correct)
        if (request.tableIds() == null || request.tableIds().isEmpty()) {
            throw new BadRequestException("orderIds is required (or provide tableIds with active orders)");
        }

        List<UUID> tableIds = request.tableIds().stream().filter(Objects::nonNull).distinct().toList();
        if (tableIds.isEmpty()) {
            throw new BadRequestException("tableIds is required");
        }

        List<OrderEntity> activeOrders = orderRepository.findActiveOrdersByTableIds(tenantId, outletId, tableIds);

        Map<UUID, OrderEntity> latestByTable = new HashMap<>();
        if (activeOrders != null) {
            for (OrderEntity o : activeOrders) {
                if (o == null || o.getTableId() == null)
                    continue;
                latestByTable.putIfAbsent(o.getTableId(), o);
            }
        }

        List<UUID> resolved = new ArrayList<>();
        for (UUID tid : tableIds) {
            OrderEntity o = latestByTable.get(tid);
            if (o != null)
                resolved.add(o.getId());
        }

        if (resolved.isEmpty()) {
            throw new BadRequestException("No active orders found for provided tableIds");
        }

        return resolved.stream().distinct().toList();
    }

    private void assertTenantAndOutlet(UUID entityTenantId, UUID entityOutletId,
            UUID tenantId, UUID outletId,
            String entityName) {
        if (!tenantId.equals(entityTenantId)) {
            throw new BadRequestException(entityName + " not in tenant scope");
        }
        if (!outletId.equals(entityOutletId)) {
            throw new BadRequestException(entityName + " not in outlet scope");
        }
    }

    private BillingGroupOrderEntity link(UUID tenantId, UUID groupId, UUID orderId) {
        BillingGroupOrderEntity e = new BillingGroupOrderEntity();
        e.setTenantId(tenantId);
        e.setGroupId(groupId);
        e.setOrderId(orderId);
        return e;
    }

    private BigDecimal getRateSetting(UUID tenantId, UUID outletId, String key) {
        return settingsRepository.findByTenantIdAndOutletIdAndKey(tenantId, outletId, key)
                .map(s -> parseDecimal(s.getValue()))
                .orElse(BigDecimal.ZERO);
    }

    private static BigDecimal parseDecimal(String s) {
        if (s == null || s.isBlank())
            return BigDecimal.ZERO;
        try {
            return new BigDecimal(s.trim());
        } catch (Exception e) {
            return BigDecimal.ZERO;
        }
    }

    private static BigDecimal nvl(BigDecimal v) {
        return v == null ? BigDecimal.ZERO : v;
    }

    private static String blankToNull(String s) {
        if (s == null)
            return null;
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }

    private static OffsetDateTime toOdt(java.time.Instant instant) {
        return instant == null ? null : OffsetDateTime.ofInstant(instant, ZoneOffset.UTC);
    }

    private static String safeStr(String s) {
        return s == null ? "" : s.trim();
    }
}
