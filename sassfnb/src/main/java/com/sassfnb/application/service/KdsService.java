// src/main/java/com/sassfnb/application/service/KdsService.java
package com.sassfnb.application.service;

import com.sassfnb.adapters.rest.dto.kds.KdsDtos.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface KdsService {

    KdsBoardsResponse getBoards(UUID tenantId, UUID outletId, Instant since, List<String> statuses);

    PatchKdsItemStatusResponse patchItemStatus(UUID itemId, PatchKdsItemStatusRequest req);

    // phục vụ: READY -> SERVED
    PatchKdsItemStatusResponse markServed(UUID orderId, UUID itemId);
}
