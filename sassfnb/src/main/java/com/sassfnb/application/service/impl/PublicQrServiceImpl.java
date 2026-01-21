package com.sassfnb.application.service.impl;

import com.sassfnb.adapters.persistence.entity.QrSessionEntity;
import com.sassfnb.adapters.persistence.entity.TableEntity;
import com.sassfnb.adapters.persistence.entity.TableQrEntity;
import com.sassfnb.adapters.persistence.repository.QrSessionRepository;
import com.sassfnb.adapters.persistence.repository.TableQrRepository;
import com.sassfnb.adapters.persistence.repository.TableRepository;
import com.sassfnb.adapters.persistence.repository.OutletRepository;
import com.sassfnb.adapters.persistence.repository.RestaurantRepository;
import com.sassfnb.adapters.rest.dto.publicqr.PublicQrDtos.HeartbeatResponse;
import com.sassfnb.adapters.rest.dto.publicqr.PublicQrDtos.ResolveResponse;
import com.sassfnb.adapters.rest.dto.publicqr.PublicQrDtos.TableInfo;
import com.sassfnb.application.service.PublicQrService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PublicQrServiceImpl implements PublicQrService {

    private final TableQrRepository tableQrRepo;
    private final TableRepository tableRepo;
    private final QrSessionRepository qrSessionRepo;

    // Outlet -> restaurantId, Restaurant -> tenantId
    private final OutletRepository outletRepo;
    private final RestaurantRepository restaurantRepo;

    @Override
    @Transactional
    public ResolveResponse resolve(String token, String deviceFingerprint, String ipAddress) {
        Instant now = Instant.now();

        String t = blankToNull(token);
        if (t == null)
            throw new IllegalArgumentException("Invalid QR token");

        TableQrEntity qr = tableQrRepo.findByTokenAndDisabledAtIsNull(t)
                .orElseThrow(() -> new IllegalArgumentException("Invalid QR token"));

        boolean tokenAlive = (qr.getExpiresAt() == null) || qr.getExpiresAt().isAfter(now);
        if (!tokenAlive)
            throw new IllegalStateException("QR token expired");

        TableEntity table = tableRepo.findById(qr.getTableId())
                .orElseThrow(() -> new IllegalArgumentException("Table not found"));

        ensureTableValid(table);

        UUID outletId = table.getOutletId();
        UUID tenantId = resolveTenantIdFromOutlet(outletId);

        QrSessionEntity session = reuseOrCreateSession(
                now, tenantId, outletId, table.getId(), deviceFingerprint, ipAddress);

        return new ResolveResponse(
                tenantId,
                outletId,
                table.getId(),
                mapTableInfo(table),
                session.getId(),
                session.getExpiredAt());
    }

    @Override
    @Transactional
    public ResolveResponse resolveStatic(String code, String deviceFingerprint, String ipAddress) {
        Instant now = Instant.now();

        String c = blankToNull(code);
        if (c == null)
            throw new IllegalArgumentException("Invalid static QR code");

        // IMPORTANT: TableRepository phải có method findByStaticQrCode(...)
        TableEntity table = tableRepo.findByStaticQrCode(c)
                .orElseThrow(() -> new IllegalArgumentException("Invalid static QR code"));

        ensureTableValid(table);

        UUID outletId = table.getOutletId();
        UUID tenantId = resolveTenantIdFromOutlet(outletId);

        QrSessionEntity session = reuseOrCreateSession(
                now, tenantId, outletId, table.getId(), deviceFingerprint, ipAddress);

        return new ResolveResponse(
                tenantId,
                outletId,
                table.getId(),
                mapTableInfo(table),
                session.getId(),
                session.getExpiredAt());
    }

    @Override
    @Transactional
    public HeartbeatResponse heartbeat(UUID qrSessionId, String ipAddress) {
        Instant now = Instant.now();
        if (qrSessionId == null)
            throw new IllegalArgumentException("Session not found");

        QrSessionEntity s = qrSessionRepo.findById(qrSessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found"));

        if (!s.isAlive(now))
            throw new IllegalStateException("Session expired/closed");

        s.setLastSeenAt(now);

        String ip = blankToNull(ipAddress);
        if (ip != null)
            s.setIpAddress(ip);

        s = qrSessionRepo.save(s);
        return new HeartbeatResponse(s.getId(), s.getLastSeenAt(), s.getStatus());
    }

    // ================== helpers ==================

    private void ensureTableValid(TableEntity table) {
        if (table == null)
            throw new IllegalArgumentException("Table not found");
        if (Boolean.TRUE.equals(table.getDeleted()))
            throw new IllegalStateException("Table deleted");
    }

    private UUID resolveTenantIdFromOutlet(UUID outletId) {
        UUID restaurantId = outletRepo.findById(outletId)
                .orElseThrow(() -> new IllegalArgumentException("Outlet not found"))
                .getRestaurantId();

        return restaurantRepo.findById(restaurantId)
                .orElseThrow(() -> new IllegalArgumentException("Restaurant not found"))
                .getTenantId();
    }

    private QrSessionEntity reuseOrCreateSession(
            Instant now,
            UUID tenantId,
            UUID outletId,
            UUID tableId,
            String deviceFingerprint,
            String ipAddress) {
        String fp = blankToNull(deviceFingerprint);
        String ip = blankToNull(ipAddress);

        QrSessionEntity session = null;

        if (fp != null) {
            session = qrSessionRepo
                    .findTopByTableIdAndDeviceFingerprintAndClosedAtIsNullOrderByCreatedAtDesc(tableId, fp)
                    .filter(s -> s.isAlive(now))
                    .orElse(null);
        }

        if (session == null) {
            session = qrSessionRepo
                    .findTopByTableIdAndClosedAtIsNullOrderByCreatedAtDesc(tableId)
                    .filter(s -> s.isAlive(now))
                    .orElse(null);
        }

        if (session == null) {
            session = QrSessionEntity.builder()
                    .tenantId(tenantId)
                    .outletId(outletId)
                    .tableId(tableId)
                    .deviceFingerprint(fp)
                    .ipAddress(ip)
                    .status("ACTIVE")
                    .lastSeenAt(now)
                    .expiredAt(now.plus(4, ChronoUnit.HOURS))
                    .build();
        } else {
            session.setLastSeenAt(now);
            if (ip != null)
                session.setIpAddress(ip);
        }

        return qrSessionRepo.save(session);
    }

    private TableInfo mapTableInfo(TableEntity table) {
        return new TableInfo(
                table.getId(),
                table.getCode(),
                table.getName(),
                table.getCapacity(),
                table.getGroupCode(),
                table.getStatus());
    }

    private static String blankToNull(String s) {
        if (s == null)
            return null;
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }
}
