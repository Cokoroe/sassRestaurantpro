package com.sassfnb.application.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sassfnb.adapters.persistence.entity.OrderEntity;
import com.sassfnb.adapters.persistence.entity.PaymentEntity;
import com.sassfnb.adapters.persistence.repository.OrderRepository;
import com.sassfnb.adapters.persistence.repository.PaymentRepository;
import com.sassfnb.adapters.persistence.repository.SettingsRepository;
import com.sassfnb.adapters.rest.dto.billing.SepayWebhookDtos.*;
import com.sassfnb.application.exception.BadRequestException;
import com.sassfnb.application.exception.NotFoundException;
import com.sassfnb.application.service.SepayWebhookService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SepayWebhookServiceImpl implements SepayWebhookService {

    private static final String PROVIDER_SEPAY = "SEPAY";

    private static final String KEY_SEPAY_WEBHOOK_SECRET = "SEPAY_WEBHOOK_SECRET";
    private static final String KEY_SEPAY_ACC = "SEPAY_ACC";
    private static final String KEY_SEPAY_BANK = "SEPAY_BANK";

    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;
    private final SettingsRepository settingsRepository;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public SepayWebhookResponse handleWebhook(UUID outletId, String secret, SepayWebhookRequest req) {
        if (outletId == null)
            throw new BadRequestException("outletId is required");
        if (secret == null || secret.isBlank())
            throw new BadRequestException("secret is required");
        if (req == null)
            throw new BadRequestException("body is required");

        // 1) verify secret by outlet setting
        var setting = settingsRepository.findFirstByOutletIdAndKey(outletId, KEY_SEPAY_WEBHOOK_SECRET)
                .orElseThrow(() -> new NotFoundException("Webhook secret not configured for outlet: " + outletId));

        UUID tenantId = setting.getTenantId();
        String expectedSecret = norm(setting.getValue());
        if (expectedSecret == null)
            throw new BadRequestException("Missing setting: " + KEY_SEPAY_WEBHOOK_SECRET);
        if (!expectedSecret.equals(secret))
            throw new BadRequestException("Invalid webhook secret");

        // 2) accept only transferType=in
        String transferType = norm(req.transferType());
        if (transferType == null)
            throw new BadRequestException("transferType is required");
        if (!"in".equalsIgnoreCase(transferType)) {
            return SepayWebhookResponse.builder()
                    .ok(true)
                    .message("Ignored (not IN)")
                    .paymentStatus("IGNORED_NOT_IN")
                    .build();
        }

        // 3) provider txn id (id or referenceCode)
        String providerTxnId = req.id() != null ? String.valueOf(req.id()) : norm(req.referenceCode());
        if (providerTxnId == null)
            throw new BadRequestException("providerTxnId is required (id/referenceCode)");

        BigDecimal amount = req.transferAmount();
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("transferAmount must be > 0");
        }

        // 4) extract payment code DHxxxx from code/content/description
        String paymentCode = extractPaymentCode(req);
        if (paymentCode == null) {
            throw new BadRequestException("Cannot extract paymentCode (DHxxxx) from content/description/code");
        }

        // 5) idempotency (app-level)
        if (paymentRepository.existsByTenantIdAndProviderAndProviderTxnId(tenantId, PROVIDER_SEPAY, providerTxnId)) {
            return SepayWebhookResponse.builder()
                    .ok(true)
                    .message("Already processed (idempotent)")
                    .paymentCode(paymentCode)
                    .amount(amount)
                    .paymentStatus("IGNORED_DUPLICATE")
                    .build();
        }

        // 6) find order by tenant+outlet+payment_code
        OrderEntity order = orderRepository.findByTenantIdAndOutletIdAndPaymentCode(tenantId, outletId, paymentCode)
                .orElseThrow(() -> new NotFoundException("Order not found for paymentCode=" + paymentCode));

        // 7) INSERT a CONFIRMED payment row
        PaymentEntity p = new PaymentEntity();
        // id sẽ tự sinh nhờ @UuidGenerator

        p.setTenantId(tenantId);
        p.setOutletId(outletId);

        p.setScope("ORDER");
        p.setOrderId(order.getId());
        p.setGroupId(null);

        p.setMethod("SEPAY");
        p.setStatus("CONFIRMED");
        p.setAmount(amount);
        p.setPaymentCode(paymentCode);

        p.setProvider(PROVIDER_SEPAY);
        p.setProviderTxnId(providerTxnId);

        p.setRawPayload(serializeSafe(req));
        p.setConfirmedAt(Instant.now());
        p.setReceivedAt(Instant.now());

        paymentRepository.save(p);

        // NOTE: DB trigger của bạn sẽ tự recalc totals & có thể set order PAID

        return SepayWebhookResponse.builder()
                .ok(true)
                .message("Recorded payment & confirmed")
                .paymentCode(paymentCode)
                .amount(amount)
                .orderStatus(order.getStatus())
                .paymentStatus("CONFIRMED")
                .build();
    }

    @Override
    @Transactional
    public SepayQrResponse getQrForOrder(UUID outletId, UUID orderId) {
        if (outletId == null)
            throw new BadRequestException("outletId is required");
        if (orderId == null)
            throw new BadRequestException("orderId is required");

        OrderEntity order = orderRepository.findByIdAndOutletId(orderId, outletId)
                .orElseThrow(() -> new NotFoundException("Order not found"));

        var sAcc = settingsRepository.findFirstByOutletIdAndKey(outletId, KEY_SEPAY_ACC)
                .orElseThrow(() -> new NotFoundException("Missing setting: " + KEY_SEPAY_ACC));
        var sBank = settingsRepository.findFirstByOutletIdAndKey(outletId, KEY_SEPAY_BANK)
                .orElseThrow(() -> new NotFoundException("Missing setting: " + KEY_SEPAY_BANK));

        String acc = norm(sAcc.getValue());
        String bank = norm(sBank.getValue());

        if (acc == null)
            throw new BadRequestException("SEPAY_ACC is empty");
        if (bank == null)
            throw new BadRequestException("SEPAY_BANK is empty");

        if (acc.toUpperCase(Locale.ROOT).contains("CHANGE_ME")) {
            throw new BadRequestException("SEPAY_ACC is not configured (still CHANGE_ME)");
        }
        if (bank.toUpperCase(Locale.ROOT).contains("CHANGE_ME")) {
            throw new BadRequestException("SEPAY_BANK is not configured (still CHANGE_ME)");
        }

        if (norm(order.getPaymentCode()) == null) {
            order.setPaymentCode(generateDhCode());
            orderRepository.save(order);
        }

        BigDecimal amount = order.getBalanceAmount() != null ? order.getBalanceAmount() : BigDecimal.ZERO;
        String amountInt = amount.max(BigDecimal.ZERO).toBigInteger().toString();

        String qrUrl = "https://qr.sepay.vn/img?acc=" + url(acc)
                + "&bank=" + url(bank)
                + "&amount=" + amountInt
                + "&des=" + url(order.getPaymentCode());

        return SepayQrResponse.builder()
                .ok(true)
                .paymentCode(order.getPaymentCode())
                .amount(amount)
                .bank(bank)
                .acc(acc)
                .qrImageUrl(qrUrl)
                .build();
    }

    private String extractPaymentCode(SepayWebhookRequest req) {
        String v = norm(req.code());
        if (v == null)
            v = norm(req.content());
        if (v == null)
            v = norm(req.description());
        if (v == null)
            return null;

        String upper = v.toUpperCase(Locale.ROOT);
        int idx = upper.indexOf("DH");
        if (idx < 0)
            return null;

        String tail = upper.substring(idx);
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < tail.length(); i++) {
            char c = tail.charAt(i);
            if (Character.isLetterOrDigit(c))
                sb.append(c);
            else
                break;
            if (sb.length() >= 20)
                break;
        }
        String code = sb.toString();
        return code.isBlank() ? null : code;
    }

    private String norm(String s) {
        if (s == null)
            return null;
        String t = s.trim();
        return t.isBlank() ? null : t;
    }

    private String url(String s) {
        String t = norm(s);
        if (t == null)
            return "";
        return URLEncoder.encode(t, StandardCharsets.UTF_8);
    }

    private String serializeSafe(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (JsonProcessingException e) {
            return "{\"error\":\"cannot_serialize\"}";
        }
    }

    private String generateDhCode() {
        int n = (int) (Math.random() * 900000) + 100000;
        return "DH" + n;
    }
}
