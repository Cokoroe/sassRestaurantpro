package com.sassfnb.application.service;

import com.sassfnb.adapters.persistence.repository.AuditLogRepository;
import com.sassfnb.adapters.persistence.repository.RefreshTokenRepository;
import com.sassfnb.adapters.rest.dto.auth.SessionDtos.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SessionService {

    private final RefreshTokenRepository refreshTokens;
    private final AuditLogRepository audits;

    public SessionsResponse listSessions(UUID userId) {
        var items = refreshTokens.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(rt -> new SessionItem(
                        rt.getJti(), rt.getIp(), rt.getUserAgent(),
                        rt.getCreatedAt(), rt.getExpiresAt(), rt.getRevokedAt()))
                .toList();
        return new SessionsResponse(items);
    }

    @Transactional
    public RevokeResponse revoke(UUID userId, String jti) {
        var rt = refreshTokens.findByJtiAndUserId(jti, userId)
                .orElseThrow(() -> new IllegalArgumentException("Phiên không tồn tại"));

        if (rt.getRevokedAt() == null) {
            rt.setRevokedAt(java.time.OffsetDateTime.now());
            refreshTokens.save(rt);

            var log = new com.sassfnb.adapters.persistence.entity.AuditLogEntity();
            log.setAction("SESSION_REVOKED");
            log.setEntity("REFRESH_TOKEN");
            log.setEntityId(rt.getId());
            log.setActorUserId(userId);

            var data = new java.util.HashMap<String, Object>();
            data.put("jti", rt.getJti());
            if (rt.getIp() != null)
                data.put("ip", rt.getIp());
            if (rt.getUserAgent() != null)
                data.put("ua", rt.getUserAgent());
            log.setDataJson(data);

            audits.save(log);
        }
        return new RevokeResponse("Đã thu hồi phiên.");
    }

}
