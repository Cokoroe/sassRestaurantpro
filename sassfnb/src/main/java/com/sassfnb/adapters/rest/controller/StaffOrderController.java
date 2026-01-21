// src/main/java/com/sassfnb/adapters/rest/controller/StaffOrderController.java
package com.sassfnb.adapters.rest.controller;

import com.sassfnb.adapters.rest.dto.order.OrderDtos.*;
import com.sassfnb.application.service.OrderWorkflowService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/staff/orders") // ✅ đổi path để không đụng /api/v1/orders của OrderWorkflowController
@RequiredArgsConstructor
@PreAuthorize("hasAnyAuthority('ROOT','OWNER','ADMIN','MANAGER','STAFF')")
public class StaffOrderController {

    private final OrderWorkflowService service;

    // GET /api/v1/staff/orders?outletId=&status=&tableId=&q=&page=&size=
    @GetMapping
    public Page<OrderResponse> list(
            @RequestParam UUID outletId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) UUID tableId,
            @RequestParam(required = false) String q,
            Pageable pageable) {

        var req = new StaffOrderListRequest(outletId, status, tableId, q);
        return service.staffList(req, pageable);
    }

    // GET /api/v1/staff/orders/{orderId}
    @GetMapping("/{orderId}")
    public OrderResponse get(@PathVariable UUID orderId) {
        return service.staffGet(orderId);
    }

    // POST /api/v1/staff/orders/{orderId}/fire
    @PostMapping("/{orderId}/fire")
    public OrderResponse fire(@PathVariable UUID orderId, @RequestBody(required = false) FireOrderRequest req) {
        return service.fire(orderId, req);
    }

    // POST /api/v1/staff/orders/{orderId}/items/{itemId}/void
    @PostMapping("/{orderId}/items/{itemId}/void")
    public OrderResponse voidItem(
            @PathVariable UUID orderId,
            @PathVariable UUID itemId,
            @RequestBody(required = false) VoidItemRequest req) {
        return service.voidItem(orderId, itemId, req);
    }

    // POST /api/v1/staff/orders/{orderId}/void
    @PostMapping("/{orderId}/void")
    public OrderResponse voidOrder(
            @PathVariable UUID orderId,
            @RequestBody(required = false) VoidOrderRequest req) {
        return service.voidOrder(orderId, req);
    }

    // PATCH /api/v1/staff/orders/{orderId}/note
    @PatchMapping("/{orderId}/note")
    public OrderResponse patchNote(@PathVariable UUID orderId, @RequestBody PatchOrderNoteRequest req) {
        return service.patchNote(orderId, req);
    }
}
