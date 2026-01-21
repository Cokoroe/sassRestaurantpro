package com.sassfnb.adapters.rest.controller;

import com.sassfnb.adapters.rest.dto.billing.PaymentSettingsDtos.*;
import com.sassfnb.application.service.PaymentSettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/settings/payments")
public class PaymentSettingsController {

    private final PaymentSettingsService paymentSettingsService;

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROOT','OWNER','ADMIN','MANAGER')")
    public PaymentSettingsResponse get(@RequestParam(required = false) UUID outletId) {
        return paymentSettingsService.get(outletId);
    }

    @PutMapping
    @PreAuthorize("hasAnyAuthority('ROOT','OWNER','ADMIN','MANAGER')")
    public PaymentSettingsResponse update(
            @RequestParam(required = false) UUID outletId,
            @RequestBody UpdatePaymentSettingsRequest request) {
        return paymentSettingsService.update(outletId, request);
    }
}
