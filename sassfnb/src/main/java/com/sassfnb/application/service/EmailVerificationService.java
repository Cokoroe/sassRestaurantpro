package com.sassfnb.application.service;

import com.sassfnb.adapters.persistence.entity.AuditLogEntity;
import com.sassfnb.adapters.persistence.entity.EmailVerificationTokenEntity;
import com.sassfnb.adapters.persistence.entity.UserEntity;
import com.sassfnb.adapters.persistence.repository.AuditLogRepository;
import com.sassfnb.adapters.persistence.repository.EmailVerificationTokenRepository;
import com.sassfnb.adapters.persistence.repository.UserRepository;
import com.sassfnb.adapters.rest.dto.auth.EmailVerificationDtos.SendVerifyResponse;
import com.sassfnb.adapters.rest.dto.auth.EmailVerificationDtos.VerifyResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.OffsetDateTime;
import java.util.Base64;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class EmailVerificationService {

    private final UserRepository users;
    private final EmailVerificationTokenRepository tokens;
    private final AuditLogRepository audits;
    private final MailService mail;

    @Value("${app.email.verify-expire-minutes:30}")
    private int expireMinutes;

    @Value("${app.mail.verify-link-base}")
    private String verifyLinkBase;

    /** Sinh chuỗi token ngẫu nhiên an toàn (URL-safe) */
    private String newToken() {
        byte[] buf = new byte[32];
        new SecureRandom().nextBytes(buf);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(buf);
    }

    /** Body email */
    private String buildBody(String fullName, String link) {
        String name = (fullName == null) ? "" : fullName;
        return """
                Xin chào %s,

                Vui lòng nhấn vào liên kết dưới đây để xác minh email cho tài khoản của bạn:
                %s

                Liên kết sẽ hết hạn sau %d phút.

                Trân trọng,
                SassFnb
                """.formatted(name, link, expireMinutes);
    }

    /** Gửi email xác minh */
    @Transactional
    public SendVerifyResponse sendVerify(UUID currentUserId) {
        UserEntity user = users.findById(currentUserId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (user.getEmailVerifiedAt() != null) {
            return new SendVerifyResponse("Email đã được xác minh.");
        }

        // Dọn token hết hạn (nếu có)
        tokens.deleteExpiredByUserId(currentUserId, OffsetDateTime.now());

        // Tạo token mới
        String token = newToken();
        EmailVerificationTokenEntity evt = new EmailVerificationTokenEntity();
        evt.setUserId(currentUserId);
        evt.setToken(token);
        evt.setExpiresAt(OffsetDateTime.now().plusMinutes(expireMinutes));
        tokens.save(evt);

        // Gửi mail
        String link = verifyLinkBase + token;
        mail.sendEmail(user.getEmail(), "Xác minh email tài khoản", buildBody(user.getFullName(), link));

        // Audit (ghi JSONB đúng kiểu)
        AuditLogEntity log = new AuditLogEntity();
        log.setActorUserId(currentUserId);
        log.setAction("EMAIL_VERIFY_SENT");
        log.setEntity("USER");
        log.setEntityId(currentUserId);
        log.setDataJson(java.util.Map.of("email", user.getEmail()));
        audits.save(log);

        return new SendVerifyResponse("Đã gửi email xác minh.");
    }

    /** Xác minh token */
    @Transactional
    public VerifyResponse verify(String token) {
        EmailVerificationTokenEntity evt = tokens.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Token không tồn tại"));

        if (evt.getUsedAt() != null) {
            throw new IllegalArgumentException("Token đã được sử dụng");
        }
        if (evt.getExpiresAt().isBefore(OffsetDateTime.now())) {
            throw new IllegalArgumentException("Token đã hết hạn");
        }

        UserEntity user = users.findById(evt.getUserId())
                .orElseThrow(() -> new IllegalStateException("User không tồn tại"));

        // set cột email_verified_at
        user.setEmailVerifiedAt(OffsetDateTime.now());
        users.save(user);

        // đánh dấu token đã dùng
        evt.setUsedAt(OffsetDateTime.now());
        tokens.save(evt);

        // Audit (ghi JSONB đúng kiểu)
        AuditLogEntity log = new AuditLogEntity();
        log.setActorUserId(user.getId());
        log.setAction("EMAIL_VERIFIED");
        log.setEntity("USER");
        log.setEntityId(user.getId());
        log.setDataJson(Map.of("email", user.getEmail()));
        audits.save(log);

        return new VerifyResponse("Xác minh email thành công.");
    }
}
