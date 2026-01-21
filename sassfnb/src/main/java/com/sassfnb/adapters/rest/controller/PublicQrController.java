package com.sassfnb.adapters.rest.controller;

import com.sassfnb.adapters.rest.dto.publicqr.PublicQrDtos.HeartbeatResponse;
import com.sassfnb.adapters.rest.dto.publicqr.PublicQrDtos.ResolveResponse;
import com.sassfnb.application.service.PublicQrService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/public/qr")
@RequiredArgsConstructor
public class PublicQrController {

    private final PublicQrService service;

    /** QR động: /api/v1/public/qr/resolve?token=... */
    @GetMapping("/resolve")
    public ResolveResponse resolve(
            @RequestParam("token") String token,
            @RequestHeader(value = "X-Device-Fingerprint", required = false) String deviceFingerprint,
            @RequestHeader(value = "X-Forwarded-For", required = false) String xff,
            @RequestHeader(value = "X-Real-IP", required = false) String xRealIp) {
        String ip = pickIp(xff, xRealIp);
        return service.resolve(token, deviceFingerprint, ip);
    }

    /** QR tĩnh: /api/v1/public/qr/static/resolve?code=... */
    @GetMapping("/static/resolve")
    public ResolveResponse resolveStatic(
            @RequestParam("code") String code,
            @RequestHeader(value = "X-Device-Fingerprint", required = false) String deviceFingerprint,
            @RequestHeader(value = "X-Forwarded-For", required = false) String xff,
            @RequestHeader(value = "X-Real-IP", required = false) String xRealIp) {
        String ip = pickIp(xff, xRealIp);
        return service.resolveStatic(code, deviceFingerprint, ip);
    }

    /** Heartbeat: /api/v1/public/qr/sessions/{id}/heartbeat */
    @PostMapping("/sessions/{id}/heartbeat")
    public HeartbeatResponse heartbeat(
            @PathVariable("id") UUID qrSessionId,
            @RequestHeader(value = "X-Forwarded-For", required = false) String xff,
            @RequestHeader(value = "X-Real-IP", required = false) String xRealIp) {
        String ip = pickIp(xff, xRealIp);
        return service.heartbeat(qrSessionId, ip);
    }

    private static String pickIp(String xff, String xRealIp) {
        if (xff != null && !xff.isBlank())
            return xff.split(",")[0].trim();
        if (xRealIp != null && !xRealIp.isBlank())
            return xRealIp.trim();
        return null;
    }
}
