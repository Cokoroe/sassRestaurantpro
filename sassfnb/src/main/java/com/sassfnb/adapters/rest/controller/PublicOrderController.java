package com.sassfnb.adapters.rest.controller;

import com.sassfnb.adapters.rest.dto.publicorder.PublicOrderDtos.*;
import com.sassfnb.application.service.PublicOrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/public/orders")
@RequiredArgsConstructor
public class PublicOrderController {

    private final PublicOrderService service;

    @PostMapping
    public OrderResponse create(@RequestBody CreateOrderRequest req) {
        return service.createOrder(req);
    }

    @PostMapping("/{orderId}/items")
    public OrderResponse addItems(@PathVariable UUID orderId, @RequestBody List<AddItemRequest> items) {
        return service.addItems(orderId, items);
    }

    @PatchMapping("/{orderId}/items/{itemId}")
    public OrderResponse patchItem(@PathVariable UUID orderId, @PathVariable UUID itemId,
            @RequestBody PatchItemRequest req) {
        return service.patchItem(orderId, itemId, req);
    }

    @DeleteMapping("/{orderId}/items/{itemId}")
    public OrderResponse deleteItem(@PathVariable UUID orderId, @PathVariable UUID itemId) {
        return service.deleteItem(orderId, itemId);
    }

    @GetMapping("/{orderId}")
    public OrderResponse get(@PathVariable UUID orderId) {
        return service.getOrder(orderId);
    }
}
