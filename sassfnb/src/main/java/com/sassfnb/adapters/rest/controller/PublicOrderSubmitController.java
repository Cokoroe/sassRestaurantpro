package com.sassfnb.adapters.rest.controller;

import com.sassfnb.adapters.rest.dto.order.OrderDtos.ReopenOrderRequest;
import com.sassfnb.adapters.rest.dto.order.OrderDtos.ReopenOrderResponse;
import com.sassfnb.adapters.rest.dto.order.OrderDtos.SubmitOrderResponse;
import com.sassfnb.application.service.OrderWorkflowService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/public/orders")
@RequiredArgsConstructor
public class PublicOrderSubmitController {

    private final OrderWorkflowService workflowService;

    @PostMapping("/{orderId}/submit")
    public SubmitOrderResponse submit(
            @PathVariable UUID orderId,
            @RequestParam UUID outletId) {
        return workflowService.submitPublic(orderId, outletId);
    }

    @PostMapping("/{orderId}/reopen")
    public ReopenOrderResponse reopen(
            @PathVariable UUID orderId,
            @RequestParam UUID outletId,
            @RequestBody(required = false) ReopenOrderRequest req) {
        return workflowService.reopenPublic(orderId, outletId, req);
    }
}
