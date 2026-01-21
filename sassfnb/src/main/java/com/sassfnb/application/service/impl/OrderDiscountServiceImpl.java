package com.sassfnb.application.service.impl;

import com.sassfnb.adapters.persistence.entity.OrderDiscountEntity;
import com.sassfnb.adapters.persistence.repository.OrderDiscountRepository;
import com.sassfnb.adapters.persistence.repository.OrderRepository;
import com.sassfnb.adapters.rest.dto.billing.DiscountDtos.*;
import com.sassfnb.application.exception.BadRequestException;
import com.sassfnb.application.exception.NotFoundException;
import com.sassfnb.application.ports.TenantResolver;
import com.sassfnb.application.service.OrderDiscountService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class OrderDiscountServiceImpl implements OrderDiscountService {

    private static final String TYPE_PERCENT = "PERCENT";
    private static final String TYPE_AMOUNT = "AMOUNT";

    private static final String STATUS_CLOSED = "CLOSED";
    private static final String STATUS_PAID = "PAID";

    private final TenantResolver tenantResolver;
    private final OrderRepository orderRepository;
    private final OrderDiscountRepository orderDiscountRepository;

    @Override
    @Transactional
    public DiscountResponse apply(UUID orderId, ApplyDiscountRequest request) {
        UUID tenantId = tenantResolver.currentTenantId();
        UUID outletId = tenantResolver.currentOutletId();
        UUID staffId = tenantResolver.currentUserId();

        if (request == null)
            throw new BadRequestException("Body is required");
        if (request.type() == null)
            throw new BadRequestException("type is required");
        if (request.value() == null)
            throw new BadRequestException("value is required");

        String type = request.type().toUpperCase(Locale.ROOT);
        if (!TYPE_PERCENT.equals(type) && !TYPE_AMOUNT.equals(type)) {
            throw new BadRequestException("type must be PERCENT or AMOUNT");
        }
        if (request.value().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("value must be > 0");
        }
        if (TYPE_PERCENT.equals(type) && request.value().compareTo(new BigDecimal("100")) > 0) {
            throw new BadRequestException("PERCENT value cannot exceed 100");
        }

        var order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NotFoundException("Order not found: " + orderId));

        if (!tenantId.equals(order.getTenantId()))
            throw new BadRequestException("Order not belong to tenant");
        if (!outletId.equals(order.getOutletId()))
            throw new BadRequestException("Order not belong to outlet");

        String st = order.getStatus() == null ? "" : order.getStatus().toUpperCase(Locale.ROOT);
        if (STATUS_CLOSED.equals(st) || STATUS_PAID.equals(st)) {
            throw new BadRequestException("Cannot apply discount to PAID/CLOSED order");
        }

        OrderDiscountEntity e = orderDiscountRepository.findByTenantIdAndOrderId(tenantId, orderId)
                .orElseGet(OrderDiscountEntity::new);

        e.setTenantId(tenantId);
        e.setOutletId(outletId);
        e.setOrderId(orderId);
        e.setType(type);
        e.setValue(request.value());
        e.setNote(request.note());
        e.setCreatedBy(staffId);

        OrderDiscountEntity saved = orderDiscountRepository.save(e);

        return DiscountResponse.builder()
                .id(saved.getId())
                .orderId(saved.getOrderId())
                .type(saved.getType())
                .value(saved.getValue())
                .note(saved.getNote())
                .createdBy(saved.getCreatedBy())
                .createdAt(saved.getCreatedAt())
                .build();
    }

    @Override
    @Transactional
    public void remove(UUID orderId) {
        UUID tenantId = tenantResolver.currentTenantId();
        orderDiscountRepository.deleteByTenantIdAndOrderId(tenantId, orderId);
    }
}
