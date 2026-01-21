// src/main/java/com/sassfnb/application/service/impl/BillingCloseServiceImpl.java
package com.sassfnb.application.service.impl;

import com.sassfnb.adapters.persistence.entity.PaymentEntity;
import com.sassfnb.adapters.persistence.repository.BillingGroupOrderRepository;
import com.sassfnb.adapters.persistence.repository.BillingGroupRepository;
import com.sassfnb.adapters.persistence.repository.OrderRepository;
import com.sassfnb.adapters.persistence.repository.PaymentRepository;
import com.sassfnb.adapters.rest.dto.billing.BillingDtos.BillingScope;
import com.sassfnb.adapters.rest.dto.billing.CloseDtos;
import com.sassfnb.application.domain.billing.BillingGroupStatus;
import com.sassfnb.application.exception.BadRequestException;
import com.sassfnb.application.exception.NotFoundException;
import com.sassfnb.application.ports.TenantResolver;
import com.sassfnb.application.service.BillingCloseService;
import com.sassfnb.application.service.BillingService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BillingCloseServiceImpl implements BillingCloseService {

    private static final String PAY_STATUS_CONFIRMED = "CONFIRMED";
    private static final String PAY_STATUS_VOIDED = "VOIDED";

    // PaymentEntity.scope: "ORDER" | "GROUP"
    private static final String PAY_SCOPE_GROUP = "GROUP";

    // Order.status in DB is varchar -> set PAID
    private static final String ORDER_STATUS_PAID = "PAID";

    private static final String GROUP_STATUS_CLOSED_TEXT = "CLOSED";
    private static final String ORDER_STATUS_CLOSED_TEXT = "PAID";

    private final TenantResolver tenantResolver;

    private final BillingGroupRepository billingGroupRepository;
    private final BillingGroupOrderRepository billingGroupOrderRepository;
    private final OrderRepository orderRepository;

    private final PaymentRepository paymentRepository;
    private final BillingService billingService;

    @Override
    @Transactional
    public CloseDtos.CloseResponse closeOrder(UUID orderId) {
        UUID tenantId = tenantResolver.currentTenantId();
        UUID outletId = tenantResolver.currentOutletId();

        var order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NotFoundException("Order not found: " + orderId));

        if (!tenantId.equals(order.getTenantId())) {
            throw new BadRequestException("Order does not belong to current tenant");
        }
        if (!outletId.equals(order.getOutletId())) {
            throw new BadRequestException("Order does not belong to current outlet");
        }

        var totals = billingService.getTotals(BillingScope.ORDER, orderId, null);
        BigDecimal due = nvl(totals.dueTotal());
        if (due.compareTo(BigDecimal.ZERO) > 0) {
            throw new BadRequestException("Order is not fully paid. due=" + due);
        }

        Instant closedAt = Instant.now();
        order.setStatus(ORDER_STATUS_PAID);
        order.setClosedAt(closedAt);
        orderRepository.save(order);

        return CloseDtos.CloseResponse.builder()
                .id(orderId)
                .status(ORDER_STATUS_CLOSED_TEXT)
                .closedAt(closedAt)
                .build();
    }

    @Override
    @Transactional
    public CloseDtos.CloseResponse closeGroup(UUID groupId) {
        UUID tenantId = tenantResolver.currentTenantId();
        UUID outletId = tenantResolver.currentOutletId();
        UUID staffId = tenantResolver.currentUserId();

        var group = billingGroupRepository.findByIdAndTenantId(groupId, tenantId)
                .orElseThrow(() -> new NotFoundException("Billing group not found: " + groupId));

        if (!outletId.equals(group.getOutletId())) {
            throw new BadRequestException("Group does not belong to current outlet");
        }

        // ✅ KEY FIX:
        // nếu có payment GROUP (order_id null) thì phân bổ xuống từng order trước khi
        // close
        allocateConfirmedGroupPaymentsIfNeeded(tenantId, outletId, staffId, groupId);

        // ✅ Check group totals sau allocate
        var groupTotals = billingService.getTotals(BillingScope.GROUP, null, groupId);
        BigDecimal groupDue = nvl(groupTotals.dueTotal());
        if (groupDue.compareTo(BigDecimal.ZERO) > 0) {
            throw new BadRequestException("Group is not fully paid. due=" + groupDue);
        }

        // ✅ Check từng order trong group đều due=0
        List<UUID> orderIds = billingGroupOrderRepository.findByTenantIdAndGroupId(tenantId, groupId)
                .stream()
                .map(x -> x.getOrderId())
                .toList();

        for (UUID oid : orderIds) {
            var ot = billingService.getTotals(BillingScope.ORDER, oid, null);
            BigDecimal odue = nvl(ot.dueTotal());
            if (odue.compareTo(BigDecimal.ZERO) > 0) {
                throw new BadRequestException("Order in group not fully paid: " + oid + ", due=" + odue);
            }
        }

        // ✅ Close group
        Instant closedAt = Instant.now();
        group.setStatus(BillingGroupStatus.CLOSED);
        group.setClosedAt(closedAt);
        billingGroupRepository.save(group);

        // ✅ Close orders
        for (UUID oid : orderIds) {
            var order = orderRepository.findById(oid)
                    .orElseThrow(() -> new NotFoundException("Order not found: " + oid));
            order.setStatus(ORDER_STATUS_PAID);
            order.setClosedAt(closedAt);
            orderRepository.save(order);
        }

        return CloseDtos.CloseResponse.builder()
                .id(groupId)
                .status(GROUP_STATUS_CLOSED_TEXT)
                .closedAt(closedAt)
                .build();
    }

    /**
     * Nếu có payment group CONFIRMED nhưng order_id = null (payment kiểu "trả cho
     * cả group"),
     * thì:
     * - Group due có thể = 0
     * - Nhưng từng order due vẫn > 0 (vì sumPaidByOrder không thấy payment)
     *
     * Fix: "waterfall allocate" số tiền group payment xuống từng order còn due,
     * tạo các PaymentEntity mới (group_id + order_id), rồi VOID payment gốc để
     * tránh double-count.
     */
    private void allocateConfirmedGroupPaymentsIfNeeded(UUID tenantId, UUID outletId, UUID staffId, UUID groupId) {
        List<PaymentEntity> unassigned = paymentRepository
                .findByTenantIdAndGroupIdAndOrderIdIsNullAndStatusIgnoreCase(tenantId, groupId, PAY_STATUS_CONFIRMED);

        if (unassigned == null || unassigned.isEmpty())
            return;

        List<UUID> orderIds = billingGroupOrderRepository.findByTenantIdAndGroupId(tenantId, groupId)
                .stream()
                .map(x -> x.getOrderId())
                .toList();

        if (orderIds.isEmpty()) {
            throw new BadRequestException("Group has no orders to allocate payment");
        }

        for (PaymentEntity src : unassigned) {
            BigDecimal remain = nvl(src.getAmount());
            if (remain.compareTo(BigDecimal.ZERO) <= 0) {
                src.setStatus(PAY_STATUS_VOIDED);
                src.setNote(appendNote(src.getNote(), "AUTO-VOID: zero amount"));
                continue;
            }

            for (UUID orderId : orderIds) {
                if (remain.compareTo(BigDecimal.ZERO) <= 0)
                    break;

                var ot = billingService.getTotals(BillingScope.ORDER, orderId, null);
                BigDecimal odue = nvl(ot.dueTotal());
                if (odue.compareTo(BigDecimal.ZERO) <= 0)
                    continue;

                BigDecimal alloc = remain.min(odue);
                if (alloc.compareTo(BigDecimal.ZERO) <= 0)
                    continue;

                PaymentEntity p = new PaymentEntity();
                p.setTenantId(tenantId);
                p.setOutletId(outletId);

                p.setScope(PAY_SCOPE_GROUP);
                p.setGroupId(groupId);
                p.setOrderId(orderId);

                p.setMethod(src.getMethod() == null ? "CASH" : src.getMethod().toUpperCase(Locale.ROOT));
                p.setStatus(PAY_STATUS_CONFIRMED);
                p.setAmount(alloc);

                p.setStaffId(src.getStaffId() != null ? src.getStaffId() : staffId);
                p.setReceivedAt(src.getReceivedAt() != null ? src.getReceivedAt() : Instant.now());
                p.setNote(appendNote(src.getNote(), "AUTO-ALLOC from " + src.getId()));

                paymentRepository.save(p);

                remain = remain.subtract(alloc);
            }

            // void payment gốc để group sum không bị double
            src.setStatus(PAY_STATUS_VOIDED);
            src.setNote(appendNote(src.getNote(), "AUTO-ALLOCATED -> VOIDED"));
        }

        paymentRepository.saveAll(unassigned);
    }

    private String appendNote(String note, String extra) {
        if (extra == null || extra.isBlank())
            return note;
        if (note == null || note.isBlank())
            return extra;
        return note + " | " + extra;
    }

    private BigDecimal nvl(BigDecimal v) {
        return v == null ? BigDecimal.ZERO : v;
    }
}
