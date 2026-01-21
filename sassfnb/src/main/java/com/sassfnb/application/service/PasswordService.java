package com.sassfnb.application.service;

import com.sassfnb.adapters.persistence.entity.*;
import com.sassfnb.adapters.persistence.repository.*;
import com.sassfnb.adapters.rest.dto.auth.PasswordDtos.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.OffsetDateTime;
import java.util.Base64;

@Service
@RequiredArgsConstructor
public class PasswordService {

    private final UserRepository users;
    private final UserCredentialRepository credentials;
    private final PasswordResetTokenRepository resetTokens;
    private final AuditLogRepository audits;
    private final MailService mail;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.password.reset-expire-minutes:30}")
    private int expireMinutes;

    @Value("${app.mail.reset-link-base:http://localhost:8080/api/v1/auth/password/reset?token=}")
    private String resetLinkBase;

    private String newToken() {
        byte[] buf = new byte[32];
        new SecureRandom().nextBytes(buf);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(buf);
    }

    @Transactional
    public ForgotResponse forgot(ForgotRequest req) {
        var user = users.findByEmailIgnoreCase(req.email())
                .orElse(null); // không lộ tài khoản có tồn tại hay không

        if (user != null) {
            // cleanup old expired
            resetTokens.deleteExpiredByUserId(user.getId(), OffsetDateTime.now());

            // create token
            String token = newToken();
            var t = new PasswordResetTokenEntity();
            t.setUserId(user.getId());
            t.setToken(token);
            t.setExpiresAt(OffsetDateTime.now().plusMinutes(expireMinutes));
            resetTokens.save(t);

            String link = resetLinkBase + token;
            String body = """
                    Xin chào,

                    Bạn vừa yêu cầu đặt lại mật khẩu. Hãy dùng liên kết sau (hết hạn sau %d phút):
                    %s

                    Nếu không phải bạn thực hiện, hãy bỏ qua email này.
                    """.formatted(expireMinutes, link);

            mail.sendEmail(user.getEmail(), "Đặt lại mật khẩu", body);

            var log = new AuditLogEntity();
            log.setAction("PASSWORD_RESET_REQUESTED");
            log.setEntity("USER");
            log.setEntityId(user.getId());
            log.setActorUserId(user.getId());
            log.setDataJson(java.util.Map.of("email", user.getEmail()));
            audits.save(log);
        }

        return new ForgotResponse("Nếu email tồn tại, liên kết đặt lại đã được gửi.");
    }

    @Transactional
    public ResetResponse reset(ResetRequest req) {
        var token = resetTokens.findByToken(req.token())
                .orElseThrow(() -> new IllegalArgumentException("Token không hợp lệ"));

        if (token.getUsedAt() != null)
            throw new IllegalArgumentException("Token đã dùng");
        if (token.getExpiresAt().isBefore(OffsetDateTime.now()))
            throw new IllegalArgumentException("Token đã hết hạn");

        var cred = credentials.findByUserId(token.getUserId())
                .orElseThrow(() -> new IllegalStateException("Thông tin đăng nhập không tồn tại"));

        cred.setPasswordHash(passwordEncoder.encode(req.newPassword()));
        cred.setLastPwChangeAt(OffsetDateTime.now());
        credentials.save(cred);

        token.setUsedAt(OffsetDateTime.now());
        resetTokens.save(token);

        var log = new AuditLogEntity();
        log.setAction("PASSWORD_RESET_DONE");
        log.setEntity("USER");
        log.setEntityId(token.getUserId());
        log.setActorUserId(token.getUserId());
        log.setDataJson(java.util.Map.of("by", "password-reset"));
        audits.save(log);

        return new ResetResponse("Đã đặt lại mật khẩu.");
    }
}
