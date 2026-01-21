package com.sassfnb.application.service.impl;

import com.sassfnb.adapters.persistence.entity.SettingsEntity;
import com.sassfnb.adapters.persistence.repository.SettingsRepository;
import com.sassfnb.adapters.rest.dto.billing.PaymentSettingsDtos.*;
import com.sassfnb.application.exception.BadRequestException;
import com.sassfnb.application.ports.TenantResolver;
import com.sassfnb.application.service.PaymentSettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PaymentSettingsServiceImpl implements PaymentSettingsService {

    private static final String KEY_SEPAY_ENABLED = "PAY_SEPAY_ENABLED";
    private static final String KEY_SEPAY_MODE = "PAY_SEPAY_MODE";
    private static final String KEY_SEPAY_PEAK = "PAY_SEPAY_PEAK_HOURS";
    private static final String KEY_MANUAL_BANKINFO = "PAY_MANUAL_BANK_INFO";

    private static final String MODE_ALWAYS = "ALWAYS";
    private static final String MODE_PEAK_ONLY = "PEAK_ONLY";
    private static final String MODE_OFF = "OFF";

    private final TenantResolver tenantResolver;
    private final SettingsRepository settingsRepository;

    @Override
    @Transactional(readOnly = true)
    public PaymentSettingsResponse get(UUID outletId) {
        UUID tenantId = tenantResolver.currentTenantId();
        if (outletId == null)
            outletId = tenantResolver.currentOutletId();

        boolean enabled = getBool(tenantId, outletId, KEY_SEPAY_ENABLED, false);
        String mode = getStr(tenantId, outletId, KEY_SEPAY_MODE, MODE_OFF);
        String peak = getStr(tenantId, outletId, KEY_SEPAY_PEAK, null);
        String bank = getStr(tenantId, outletId, KEY_MANUAL_BANKINFO, null);

        return PaymentSettingsResponse.builder()
                .tenantId(tenantId)
                .outletId(outletId)
                .sepayEnabled(enabled)
                .sepayMode(mode)
                .peakHours(peak)
                .manualBankInfo(bank)
                .build();
    }

    @Override
    @Transactional
    public PaymentSettingsResponse update(UUID outletId, UpdatePaymentSettingsRequest request) {
        UUID tenantId = tenantResolver.currentTenantId();
        if (outletId == null)
            outletId = tenantResolver.currentOutletId();
        if (request == null)
            throw new BadRequestException("Body is required");

        if (request.sepayEnabled() != null) {
            upsert(tenantId, outletId, KEY_SEPAY_ENABLED, request.sepayEnabled().toString());
        }
        if (request.sepayMode() != null) {
            String m = request.sepayMode().toUpperCase(Locale.ROOT);
            if (!MODE_ALWAYS.equals(m) && !MODE_PEAK_ONLY.equals(m) && !MODE_OFF.equals(m)) {
                throw new BadRequestException("sepayMode must be ALWAYS|PEAK_ONLY|OFF");
            }
            upsert(tenantId, outletId, KEY_SEPAY_MODE, m);
        }
        if (request.peakHours() != null) {
            upsert(tenantId, outletId, KEY_SEPAY_PEAK, request.peakHours());
        }
        if (request.manualBankInfo() != null) {
            upsert(tenantId, outletId, KEY_MANUAL_BANKINFO, request.manualBankInfo());
        }

        return get(outletId);
    }

    private void upsert(UUID tenantId, UUID outletId, String key, String value) {
        SettingsEntity s = settingsRepository.findByTenantIdAndOutletIdAndKey(tenantId, outletId, key)
                .orElseGet(SettingsEntity::new);

        s.setTenantId(tenantId);
        s.setOutletId(outletId);
        s.setKey(key);
        s.setValue(value);

        settingsRepository.save(s);
    }

    private String getStr(UUID tenantId, UUID outletId, String key, String def) {
        return settingsRepository.findByTenantIdAndOutletIdAndKey(tenantId, outletId, key)
                .map(SettingsEntity::getValue)
                .filter(v -> v != null && !v.isBlank())
                .orElse(def);
    }

    private boolean getBool(UUID tenantId, UUID outletId, String key, boolean def) {
        String v = getStr(tenantId, outletId, key, null);
        if (v == null)
            return def;
        return "true".equalsIgnoreCase(v) || "1".equals(v);
    }
}
