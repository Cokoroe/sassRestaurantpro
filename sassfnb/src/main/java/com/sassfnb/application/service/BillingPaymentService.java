package com.sassfnb.application.service;

import com.sassfnb.adapters.rest.dto.billing.PaymentDtos.*;

import java.util.UUID;

public interface BillingPaymentService {

    // 3A) manual pay for order
    ManualPaymentResponse manualPayOrder(UUID orderId, ManualPaymentRequest request);

    // 3B) manual pay for group
    ManualPaymentResponse manualPayGroup(UUID groupId, ManualPaymentRequest request);

    // 4A) init sepay for order
    SepayInitResponse initSepayForOrder(UUID orderId);

    // 4A) init sepay for group
    SepayInitResponse initSepayForGroup(UUID groupId);
}
