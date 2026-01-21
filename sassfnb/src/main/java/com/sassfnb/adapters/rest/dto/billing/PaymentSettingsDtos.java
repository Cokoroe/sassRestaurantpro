package com.sassfnb.adapters.rest.dto.billing;

import lombok.Builder;

import java.util.Map;
import java.util.UUID;

public class PaymentSettingsDtos {

    @Builder
    public record PaymentSettingsResponse(
            UUID tenantId,
            UUID outletId,
            boolean sepayEnabled,
            String sepayMode, // ALWAYS | PEAK_ONLY | OFF
            String peakHours, // "10:00-14:00,18:00-21:00" (string đơn giản)
            String manualBankInfo // text
    ) {
    }

    public record UpdatePaymentSettingsRequest(
            Boolean sepayEnabled,
            String sepayMode,
            String peakHours,
            String manualBankInfo) {
    }
}
