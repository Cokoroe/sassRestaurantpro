package com.sassfnb.adapters.rest.controller;

import com.sassfnb.adapters.rest.dto.billing.CloseDtos.*;
import com.sassfnb.application.service.BillingCloseService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class BillingCloseController {

    private final BillingCloseService billingCloseService;

    @PostMapping("/api/v1/orders/{orderId}/close")
    @PreAuthorize("hasAnyAuthority('ROOT','OWNER','ADMIN','MANAGER','STAFF')")
    public CloseResponse closeOrder(@PathVariable UUID orderId) {
        return billingCloseService.closeOrder(orderId);
    }

    @PostMapping("/api/v1/billing/groups/{groupId}/close")
    @PreAuthorize("hasAnyAuthority('ROOT','OWNER','ADMIN','MANAGER','STAFF')")
    public CloseResponse closeGroup(@PathVariable UUID groupId) {
        return billingCloseService.closeGroup(groupId);
    }
}
