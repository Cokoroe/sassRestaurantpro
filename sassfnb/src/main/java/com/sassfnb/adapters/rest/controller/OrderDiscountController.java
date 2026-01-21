package com.sassfnb.adapters.rest.controller;

import com.sassfnb.adapters.rest.dto.billing.DiscountDtos.*;
import com.sassfnb.application.service.OrderDiscountService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/orders")
public class OrderDiscountController {

    private final OrderDiscountService orderDiscountService;

    @PostMapping("/{orderId}/discount")
    @PreAuthorize("hasAnyAuthority('ROOT','OWNER','ADMIN','MANAGER','STAFF')")
    public DiscountResponse apply(@PathVariable UUID orderId, @RequestBody ApplyDiscountRequest request) {
        return orderDiscountService.apply(orderId, request);
    }

    @DeleteMapping("/{orderId}/discount")
    @PreAuthorize("hasAnyAuthority('ROOT','OWNER','ADMIN','MANAGER','STAFF')")
    public void remove(@PathVariable UUID orderId) {
        orderDiscountService.remove(orderId);
    }
}
