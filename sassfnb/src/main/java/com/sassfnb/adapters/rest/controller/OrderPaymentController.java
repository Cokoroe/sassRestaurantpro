// src/main/java/com/sassfnb/adapters/rest/controller/OrderPaymentController.java
package com.sassfnb.adapters.rest.controller;

import com.sassfnb.adapters.rest.dto.order.OrderDtos.*;
import com.sassfnb.application.service.OrderWorkflowService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
public class OrderPaymentController {

    private final OrderWorkflowService workflow;

    @GetMapping("/{orderId}/totals")
    @PreAuthorize("hasAnyAuthority('ROOT','OWNER','ADMIN','MANAGER','STAFF')")
    public OrderTotalsResponse totals(@PathVariable UUID orderId) {
        return workflow.totals(orderId);
    }

    /**
     * NOTE:
     * /close đã được dùng bởi BillingCloseController để chốt đơn theo rule dueTotal
     * = 0.
     * Đổi endpoint ở đây để tránh Ambiguous mapping.
     */
    @PostMapping("/{orderId}/finalize")
    @PreAuthorize("hasAnyAuthority('ROOT','OWNER','ADMIN','MANAGER','STAFF')")
    public CloseOrderResponse finalizeOrder(
            @PathVariable UUID orderId,
            @RequestBody(required = false) CloseOrderRequest req) {
        return workflow.close(orderId, req);
    }
}
