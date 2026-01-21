package com.sassfnb.adapters.rest.controller;

import com.sassfnb.adapters.rest.dto.billing.SepayWebhookDtos.*;
import com.sassfnb.application.service.SepayWebhookService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/payments/sepay")
@RequiredArgsConstructor
public class SepayWebhookController {

    private final SepayWebhookService sepayWebhookService;

    // SePay -> webhook
    // POST /api/v1/payments/sepay/webhook/{outletId}/{secret}
    @PostMapping("/webhook/{outletId}/{secret}")
    public SepayWebhookResponse webhook(
            @PathVariable UUID outletId,
            @PathVariable String secret,
            @RequestBody SepayWebhookRequest request) {
        return sepayWebhookService.handleWebhook(outletId, secret, request);
    }

    // FE -> get QR for order
    // GET /api/v1/payments/sepay/qr/order/{orderId}?outletId=...
    @GetMapping("/qr/order/{orderId}")
    public SepayQrResponse getQrForOrder(
            @PathVariable UUID orderId,
            @RequestParam UUID outletId) {
        return sepayWebhookService.getQrForOrder(outletId, orderId);
    }
}
