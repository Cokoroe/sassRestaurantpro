package com.sassfnb.application.service;

import com.sassfnb.adapters.persistence.entity.TableEntity;
import com.sassfnb.adapters.persistence.repository.TableRepository;
import com.sassfnb.application.config.AppUrlsProperties;
import com.sassfnb.application.ports.UploadGateway;
import com.sassfnb.common.qr.StaticQrKit;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TableStaticQrAppService {

    private final TableRepository tableRepo;
    private final UploadGateway upload;
    private final AppUrlsProperties urls;

    public record QrStaticDto(String code, String imageUrl) {
    }

    @Transactional
    public QrStaticDto generate(UUID tableId, Integer size, boolean forceNewCode) throws Exception {
        TableEntity t = tableRepo.findById(tableId).orElseThrow();

        if (Boolean.TRUE.equals(t.getDeleted())) {
            throw new IllegalStateException("Table deleted");
        }

        if (t.getStaticQrCode() == null || forceNewCode) {
            t.setStaticQrCode(StaticQrKit.makeCode(tableId, 12));
        }

        return regenerateImageKeepCodeInternal(t, size);
    }

    @Transactional
    public QrStaticDto refreshImage(UUID tableId, Integer size) throws Exception {
        TableEntity t = tableRepo.findById(tableId).orElseThrow();

        if (Boolean.TRUE.equals(t.getDeleted())) {
            throw new IllegalStateException("Table deleted");
        }

        if (t.getStaticQrCode() == null) {
            t.setStaticQrCode(StaticQrKit.makeCode(tableId, 12));
        }

        return regenerateImageKeepCodeInternal(t, size);
    }

    @Transactional(readOnly = true)
    public QrStaticDto current(UUID tableId) {
        TableEntity t = tableRepo.findById(tableId).orElseThrow();
        return new QrStaticDto(t.getStaticQrCode(), t.getStaticQrImageUrl());
    }

    // =========================
    // Internal helper
    // =========================
    private QrStaticDto regenerateImageKeepCodeInternal(TableEntity t, Integer size) throws Exception {
        int dim = (size == null) ? 512 : Math.max(256, Math.min(size, 1024));

        // ✅ NEW: QR tĩnh encode FE link
        String frontendBase = trimTrailingSlash(urls.getFrontendBase());
        if (frontendBase == null || frontendBase.isBlank()) {
            throw new IllegalStateException("app.urls.frontendBase is missing");
        }

        String codeEncoded = URLEncoder.encode(t.getStaticQrCode(), StandardCharsets.UTF_8);
        String url = frontendBase + "/qr/t/" + codeEncoded;

        byte[] png = StaticQrKit.pngOf(url, dim);

        String objectKey = "qr/tables/" + t.getStaticQrCode() + ".png"; // giữ nguyên
        String publicUrl = upload.upload(objectKey, png, "image/png");

        t.setStaticQrImageUrl(publicUrl);
        tableRepo.save(t);

        return new QrStaticDto(t.getStaticQrCode(), publicUrl);
    }

    private static String trimTrailingSlash(String s) {
        if (s == null)
            return null;
        return s.endsWith("/") ? s.substring(0, s.length() - 1) : s;
    }
}
