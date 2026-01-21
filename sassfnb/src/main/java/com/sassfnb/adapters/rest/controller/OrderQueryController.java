package com.sassfnb.adapters.rest.controller;

import com.sassfnb.adapters.rest.dto.order.OrderDtos.OrderResponse;
import com.sassfnb.adapters.rest.dto.order.OrderDtos.StaffOrderListRequest;
import com.sassfnb.application.service.OrderWorkflowService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
public class OrderQueryController {

    private final OrderWorkflowService workflowService;

    /**
     * FE đang gọi:
     * GET
     * /api/v1/orders?outletId=...&page=0&size=50&sort=updatedAt,desc&status=&tableId=&q=
     */
    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROOT','OWNER','ADMIN','MANAGER','STAFF')")
    public Page<OrderResponse> list(
            @RequestParam UUID outletId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) UUID tableId,
            @RequestParam(required = false) String q,
            Pageable pageable) {
        return workflowService.staffList(
                new StaffOrderListRequest(outletId, status, tableId, q),
                pageable);
    }

    @GetMapping("/{orderId}")
    @PreAuthorize("hasAnyAuthority('ROOT','OWNER','ADMIN','MANAGER','STAFF')")
    public OrderResponse get(@PathVariable UUID orderId) {
        return workflowService.staffGet(orderId);
    }
}
