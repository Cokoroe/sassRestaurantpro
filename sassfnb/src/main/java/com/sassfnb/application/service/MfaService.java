package com.sassfnb.application.service;

import com.sassfnb.adapters.persistence.entity.AuditLogEntity;
import com.sassfnb.adapters.persistence.repository.AuditLogRepository;
import com.sassfnb.adapters.persistence.repository.UserCredentialRepository;
import com.sassfnb.adapters.persistence.repository.UserRepository;
import com.sassfnb.adapters.rest.dto.auth.MfaDtos.*;
import lombok.RequiredArgsConstructor;
import org.apache.commons.codec.binary.Base32;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLEncoder;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
import java.util.Random;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MfaService {

    private final UserRepository users;
    private final UserCredentialRepository creds;
    private final AuditLogRepository audits;

    @Value("${app.mfa.issuer:SassFnb}")
    private String issuer;

    private String randomBase32Secret(int length) {
        byte[] bytes = new byte[length];
        new Random().nextBytes(bytes);
        return new Base32().encodeToString(bytes).replace("=", "");
    }

    public SetupResponse setup(UUID userId) {
        var user = users.findById(userId).orElseThrow();
        String secret = randomBase32Secret(20);

        String label = URLEncoder.encode(issuer + ":" + user.getEmail(), StandardCharsets.UTF_8);
        String iss = URLEncoder.encode(issuer, StandardCharsets.UTF_8);
        String otpauth = "otpauth://totp/" + label + "?secret=" + secret + "&issuer=" + iss + "&digits=6&period=30";

        // Lưu tạm secret vào credentials (chưa bật), để enable bước sau
        var cred = creds.findByUserId(userId).orElseThrow();
        cred.setMfaSecret(secret); // enable/disable sẽ dựa vào secret có tồn tại hay không
        creds.save(cred);

        return new SetupResponse(secret, otpauth);
    }

    @Transactional
    public MfaResponse enable(UUID userId, String code) {
        var cred = creds.findByUserId(userId).orElseThrow();
        String secret = cred.getMfaSecret();
        if (secret == null || secret.isBlank()) {
            throw new IllegalStateException("Chưa setup MFA");
        }
        if (!verifyTotp(secret, code)) {
            throw new IllegalArgumentException("Mã không đúng");
        }
        // coi như "bật" khi có secret; bạn có thể thêm cờ mfa_enabled nếu muốn.
        var log = new AuditLogEntity();
        log.setAction("MFA_ENABLED");
        log.setEntity("USER");
        log.setEntityId(userId);
        log.setActorUserId(userId);
        log.setCreatedAt(OffsetDateTime.now());
        audits.save(log);

        return new MfaResponse("Đã bật MFA.");
    }

    @Transactional
    public MfaResponse disable(UUID userId, String code) {
        var cred = creds.findByUserId(userId).orElseThrow();
        String secret = cred.getMfaSecret();
        if (secret == null || secret.isBlank()) {
            return new MfaResponse("MFA đã tắt.");
        }
        if (!verifyTotp(secret, code)) {
            throw new IllegalArgumentException("Mã không đúng");
        }
        cred.setMfaSecret(null);
        creds.save(cred);

        var log = new AuditLogEntity();
        log.setAction("MFA_DISABLED");
        log.setEntity("USER");
        log.setEntityId(userId);
        log.setActorUserId(userId);
        audits.save(log);

        return new MfaResponse("Đã tắt MFA.");
    }

    /** Verify 6-digit TOTP (SHA1, 30s period, window ±1) */
    public boolean verifyTotp(String base32Secret, String code) {
        if (code == null || code.length() != 6)
            return false;
        long timeWindow = System.currentTimeMillis() / 1000L / 30L;
        for (long w = -1; w <= 1; w++) {
            String expected = totpAt(base32Secret, timeWindow + w);
            if (expected.equals(code))
                return true;
        }
        return false;
    }

    private String totpAt(String base32Secret, long timeWindow) {
        Base32 base32 = new Base32();
        byte[] key = base32.decode(base32Secret);
        try {
            byte[] counter = ByteBuffer.allocate(8).putLong(timeWindow).array();
            Mac mac = Mac.getInstance("HmacSHA1");
            mac.init(new SecretKeySpec(key, "HmacSHA1"));
            byte[] hash = mac.doFinal(counter);
            int offset = hash[hash.length - 1] & 0x0F;
            int binary = ((hash[offset] & 0x7F) << 24) |
                    ((hash[offset + 1] & 0xFF) << 16) |
                    ((hash[offset + 2] & 0xFF) << 8) |
                    (hash[offset + 3] & 0xFF);
            int otp = binary % 1_000_000;
            return String.format("%06d", otp);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
