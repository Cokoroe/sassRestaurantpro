package com.sassfnb.adapters.rest.dto.billing;

import com.fasterxml.jackson.annotation.JsonAlias;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;

public class SepayWebhookDtos {

        /**
         * Payload SePay (theo blog) ví dụ:
         * {
         * "id": 92704,
         * "gateway": "TPBank",
         * "transactionDate": "2023-03-25 14:02:37",
         * "accountNumber": "...",
         * "code": null,
         * "content": "chuyen tien mua iphone",
         * "transferType": "in",
         * "transferAmount": 2277000,
         * "accumulated": 19077000,
         * "subAccount": null,
         * "referenceCode": "208V009252001511",
         * "description": ""
         * }
         */
        public record SepayWebhookRequest(
                        @JsonAlias({
                                        "id" }) Long id, // sepay transaction id
                        @JsonAlias({ "gateway" }) String gateway,
                        @JsonAlias({ "transactionDate" }) String transactionDate, // keep raw string to avoid parse pain
                        @JsonAlias({ "accountNumber" }) String accountNumber,

                        @JsonAlias({ "code" }) String code,
                        @JsonAlias({ "content" }) String content,
                        @JsonAlias({ "description" }) String description,

                        @JsonAlias({ "transferType" }) String transferType, // in/out
                        @JsonAlias({ "transferAmount" }) BigDecimal transferAmount,

                        @JsonAlias({ "referenceCode" }) String referenceCode,
                        @JsonAlias({ "accumulated" }) BigDecimal accumulated) {
        }

        @Builder
        public record SepayWebhookResponse(
                        boolean ok,
                        String message,
                        String paymentCode,
                        BigDecimal amount,
                        String orderStatus,
                        String paymentStatus) {
        }

        @Builder
        public record SepayQrResponse(
                        boolean ok,
                        String paymentCode,
                        BigDecimal amount,
                        String bank,
                        String acc,
                        String qrImageUrl) {
        }
}
