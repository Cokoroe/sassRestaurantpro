// src/main/java/com/sassfnb/application/service/impl/TableServiceImpl.java
package com.sassfnb.application.service.impl;

import com.sassfnb.adapters.persistence.entity.TableEntity;
import com.sassfnb.adapters.persistence.entity.TableQrEntity;
import com.sassfnb.adapters.persistence.repository.QrSessionRepository;
import com.sassfnb.adapters.persistence.repository.TableQrRepository;
import com.sassfnb.adapters.persistence.repository.TableRepository;
import com.sassfnb.adapters.rest.dto.tenant.TableDtos.*;
import com.sassfnb.application.config.AppUrlsProperties;
import com.sassfnb.application.service.TableService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TableServiceImpl implements TableService {

    private final TableRepository tableRepo;
    private final TableQrRepository qrRepo;
    private final QrSessionRepository sessionRepo;
    private final AppUrlsProperties urls;

    // =========================================================
    // Mapping Entity -> DTO
    // =========================================================
    private TableResponse map(TableEntity e) {
        var curQr = qrRepo
                .findTopByTableIdAndDisabledAtIsNullOrderByCreatedAtDesc(e.getId())
                .orElse(null);

        String sessionStatus = sessionRepo.countByTableIdAndClosedAtIsNull(e.getId()) > 0 ? "OPEN" : "NONE";

        return new TableResponse(
                e.getId(),
                e.getCode(),
                e.getName(),
                e.getCapacity(),
                e.getGroupCode(),
                e.getStatus(),
                e.getOutletId(),
                Boolean.TRUE.equals(e.getDeleted()),
                e.getCreatedAt(),
                e.getUpdatedAt(),
                curQr != null ? curQr.getToken() : null,
                curQr != null ? curQr.getExpiresAt() : null,
                sessionStatus);
    }

    // =========================================================
    // CRUD TABLE
    // =========================================================

    @Override
    @Transactional(readOnly = true)
    public Page<TableResponse> list(UUID outletId, String q, String status, String groupCode, Pageable pageable) {
        if (outletId == null)
            throw new IllegalArgumentException("outletId is required");
        if (q == null)
            q = "";
        if (status == null)
            status = "";
        if (groupCode == null)
            groupCode = "";

        return tableRepo
                .findByOutletIdAndDeletedFalseAndStatusContainingIgnoreCaseAndGroupCodeContainingIgnoreCaseAndCodeContainingIgnoreCase(
                        outletId, status, groupCode, q, pageable)
                .map(this::map);
    }

    @Override
    @Transactional
    public TableResponse create(TableCreateRequest req) {
        if (req.outletId() == null || req.code() == null) {
            throw new IllegalArgumentException("outletId & code are required");
        }

        String code = req.code().trim();
        if (code.isBlank())
            throw new IllegalArgumentException("code is required");

        if (tableRepo.existsByOutletIdAndCodeIgnoreCase(req.outletId(), code)) {
            throw new IllegalStateException("Table code already exists in this outlet");
        }

        TableEntity e = TableEntity.builder()
                .outletId(req.outletId())
                .code(code)
                .name(req.name())
                .capacity(req.capacity())
                .groupCode(req.groupCode())
                .status(req.status() == null ? "AVAILABLE" : req.status())
                .deleted(false)
                .build();

        e = tableRepo.save(e);
        return map(e);
    }

    @Override
    @Transactional(readOnly = true)
    public TableResponse get(UUID id) {
        return tableRepo.findById(id)
                .filter(t -> !Boolean.TRUE.equals(t.getDeleted()))
                .map(this::map)
                .orElseThrow();
    }

    @Override
    @Transactional
    public TableResponse update(UUID id, TableUpdateRequest req) {
        TableEntity e = tableRepo.findById(id).orElseThrow();
        if (Boolean.TRUE.equals(e.getDeleted()))
            throw new IllegalStateException("Table deleted");

        if (req.name() != null)
            e.setName(req.name());
        if (req.capacity() != null)
            e.setCapacity(req.capacity());
        if (req.groupCode() != null)
            e.setGroupCode(req.groupCode());
        if (req.status() != null)
            e.setStatus(req.status());

        return map(e);
    }

    @Override
    @Transactional
    public void patchStatus(UUID id, TableStatusPatchRequest req) {
        TableEntity e = tableRepo.findById(id).orElseThrow();
        if (Boolean.TRUE.equals(e.getDeleted()))
            throw new IllegalStateException("Table deleted");
        e.setStatus(req.status());
    }

    @Override
    @Transactional
    public void delete(UUID id) {
        if (sessionRepo.countByTableIdAndClosedAtIsNull(id) > 0) {
            throw new IllegalStateException("Cannot delete while session is open");
        }
        TableEntity e = tableRepo.findById(id).orElseThrow();
        e.setDeleted(true);
    }

    // =========================================================
    // QR động (table_qr)
    // =========================================================

    @Override
    @Transactional(readOnly = true)
    public TableQrResponse currentQr(UUID tableId) {
        var qr = qrRepo.findTopByTableIdAndDisabledAtIsNullOrderByCreatedAtDesc(tableId)
                .orElse(null);

        if (qr == null || !qr.isActive()) {
            return new TableQrResponse(null, null, null);
        }

        return new TableQrResponse(qr.getToken(), qr.getExpiresAt(), qr.getQrUrl());
    }

    @Override
    @Transactional
    public TableQrResponse rotateQr(UUID tableId, Integer ttlMinutes) {
        int ttl = (ttlMinutes == null || ttlMinutes <= 0) ? 60 : ttlMinutes;

        // Disable QR cũ (nếu có)
        qrRepo.findTopByTableIdAndDisabledAtIsNullOrderByCreatedAtDesc(tableId)
                .ifPresent(q -> q.setDisabledAt(Instant.now()));

        String token = generateToken();

        // ✅ NEW: qrUrl là FE link
        String frontendBase = trimTrailingSlash(urls.getFrontendBase());
        if (frontendBase == null || frontendBase.isBlank()) {
            throw new IllegalStateException("app.urls.frontendBase is missing");
        }
        String qrUrl = frontendBase + "/qr?token=" + token;

        TableQrEntity qr = TableQrEntity.builder()
                .tableId(tableId)
                .token(token)
                .qrCode(token) // nếu DB còn cột legacy thì giữ
                .qrUrl(qrUrl)
                .expiresAt(Instant.now().plus(ttl, ChronoUnit.MINUTES))
                .build();

        qrRepo.save(qr);

        return new TableQrResponse(token, qr.getExpiresAt(), qrUrl);
    }

    @Override
    @Transactional
    public void disableQr(UUID tableId) {
        qrRepo.findTopByTableIdAndDisabledAtIsNullOrderByCreatedAtDesc(tableId)
                .ifPresent(q -> q.setDisabledAt(Instant.now()));
    }

    // =========================================================
    // Helper
    // =========================================================
    private static String generateToken() {
        byte[] buf = new byte[32];
        new SecureRandom().nextBytes(buf);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(buf);
    }

    private static String trimTrailingSlash(String s) {
        if (s == null)
            return null;
        return s.endsWith("/") ? s.substring(0, s.length() - 1) : s;
    }
}
