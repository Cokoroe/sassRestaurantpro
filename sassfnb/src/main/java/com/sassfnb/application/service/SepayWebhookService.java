package com.sassfnb.application.service;

import com.sassfnb.adapters.rest.dto.billing.SepayWebhookDtos.*;

import java.util.UUID;

public interface SepayWebhookService {
    SepayWebhookResponse handleWebhook(UUID outletId, String secret, SepayWebhookRequest request);

    SepayQrResponse getQrForOrder(UUID outletId, UUID orderId);
}
