package com.sassfnb.adapters.rest.dto.billing;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public class PaymentDtos {

        public record ManualPaymentRequest(
                        String method, // CASH | TRANSFER
                        BigDecimal amount,
                        String note,
                        Instant receivedAt) {
        }

        public record ManualPaymentResponse(
                        UUID paymentId,
                        BigDecimal paidTotal,
                        BigDecimal dueTotal) {
        }

        public record SepayInitResponse(
                        UUID paymentId,
                        String paymentCode,
                        BigDecimal amount,
                        String qrUrl,
                        Instant expiresAt) {
        }
}
