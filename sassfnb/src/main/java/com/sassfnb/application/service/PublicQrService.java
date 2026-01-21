package com.sassfnb.application.service;

import com.sassfnb.adapters.rest.dto.publicqr.PublicQrDtos.HeartbeatResponse;
import com.sassfnb.adapters.rest.dto.publicqr.PublicQrDtos.ResolveResponse;

import java.util.UUID;

public interface PublicQrService {

    /** Resolve QR ĐỘNG (token) */
    ResolveResponse resolve(String token, String deviceFingerprint, String ipAddress);

    /** Resolve QR TĨNH (static code) */
    ResolveResponse resolveStatic(String code, String deviceFingerprint, String ipAddress);

    /** Heartbeat giữ session sống */
    HeartbeatResponse heartbeat(UUID qrSessionId, String ipAddress);
}
