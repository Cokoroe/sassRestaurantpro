package com.sassfnb.application.service;

import com.sassfnb.adapters.rest.dto.billing.PaymentSettingsDtos.*;

import java.util.UUID;

public interface PaymentSettingsService {
    PaymentSettingsResponse get(UUID outletId);

    PaymentSettingsResponse update(UUID outletId, UpdatePaymentSettingsRequest request);
}
