package com.sassfnb.application.service;

import com.sassfnb.adapters.rest.dto.tenant.TableDtos.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface TableService {

    Page<TableResponse> list(UUID outletId,
            String q,
            String status,
            String groupCode,
            Pageable pageable);

    TableResponse create(TableCreateRequest req);

    TableResponse get(UUID id);

    TableResponse update(UUID id, TableUpdateRequest req);

    void patchStatus(UUID id, TableStatusPatchRequest req);

    void delete(UUID id);

    // ===== QR động (table_qr + qr_sessions) =====

    /**
     * Lấy QR hiện tại (token, expiresAt) của bàn, nếu hết hạn / disabled trả về
     * null
     */
    TableQrResponse currentQr(UUID tableId);

    /** Rotate QR mới, disable QR cũ, TTL mặc định 60 phút nếu null/<=0 */
    TableQrResponse rotateQr(UUID tableId, Integer ttlMinutes);

    /** Disable QR hiện tại của bàn */
    void disableQr(UUID tableId);

    /**
     * Resolve từ token QR -> thông tin bàn + trạng thái đang hoạt động hay không
     */
    // TableResolveResponse resolve(String token);
}
