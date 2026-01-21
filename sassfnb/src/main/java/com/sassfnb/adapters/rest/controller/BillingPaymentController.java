package com.sassfnb.adapters.rest.controller;

import com.sassfnb.adapters.rest.dto.billing.PaymentDtos.ManualPaymentRequest;
import com.sassfnb.adapters.rest.dto.billing.PaymentDtos.ManualPaymentResponse;
import com.sassfnb.adapters.rest.dto.billing.PaymentDtos.SepayInitResponse;
import com.sassfnb.application.service.BillingPaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class BillingPaymentController {

    private final BillingPaymentService billingPaymentService;

    // =========================
    // 3A) Manual pay for 1 order
    // =========================
    @PostMapping("/orders/{orderId}/payments/manual")
    @PreAuthorize("hasAnyAuthority('ROOT','OWNER','ADMIN','MANAGER','STAFF')")
    public ManualPaymentResponse manualPayOrder(
            @PathVariable UUID orderId,
            @RequestBody ManualPaymentRequest request) {
        return billingPaymentService.manualPayOrder(orderId, request);
    }

    // =========================
    // 3B) Manual pay for group
    // =========================
    @PostMapping("/billing/groups/{groupId}/payments/manual")
    @PreAuthorize("hasAnyAuthority('ROOT','OWNER','ADMIN','MANAGER','STAFF')")
    public ManualPaymentResponse manualPayGroup(
            @PathVariable UUID groupId,
            @RequestBody ManualPaymentRequest request) {
        return billingPaymentService.manualPayGroup(groupId, request);
    }

    // =========================
    // 4A) SePay init for order
    // =========================
    @PostMapping("/orders/{orderId}/payments/sepay/init")
    @PreAuthorize("hasAnyAuthority('ROOT','OWNER','ADMIN','MANAGER','STAFF')")
    public SepayInitResponse initSepayForOrder(@PathVariable UUID orderId) {
        return billingPaymentService.initSepayForOrder(orderId);
    }

    // =========================
    // 4B) SePay init for group
    // =========================
    @PostMapping("/billing/groups/{groupId}/payments/sepay/init")
    @PreAuthorize("hasAnyAuthority('ROOT','OWNER','ADMIN','MANAGER','STAFF')")
    public SepayInitResponse initSepayForGroup(@PathVariable UUID groupId) {
        return billingPaymentService.initSepayForGroup(groupId);
    }
}
