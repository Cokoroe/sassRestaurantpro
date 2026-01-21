// src/main/java/com/sassfnb/adapters/rest/controller/KdsController.java
package com.sassfnb.adapters.rest.controller;

import com.sassfnb.adapters.rest.dto.kds.KdsDtos.*;
import com.sassfnb.application.ports.TenantResolver;
import com.sassfnb.application.service.KdsService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/kds")
@RequiredArgsConstructor
public class KdsController {

    private final KdsService kdsService;
    private final TenantResolver tenantResolver;

    /**
     * Bếp/bar xem items cần làm
     *
     * FE gọi:
     * GET /api/v1/kds/boards?since=...&status=FIRED&status=IN_PROGRESS
     *
     * Context:
     * - tenantId: lấy từ JWT (SecurityContext) qua TenantResolver.currentTenantId()
     * - outletId: ưu tiên query param nếu truyền, nếu không lấy từ header
     * X-Outlet-Id
     */
    @GetMapping("/boards")
    @PreAuthorize("hasAnyAuthority('ROOT','OWNER','ADMIN','MANAGER','STAFF')")
    public KdsBoardsResponse boards(
            @RequestParam(required = false) UUID outletId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant since,
            @RequestParam(required = false) List<String> status) {
        UUID tenantId = tenantResolver.currentTenantId();

        UUID resolvedOutletId = (outletId != null)
                ? outletId
                : tenantResolver.currentOutletId(); // sẽ throw nếu thiếu header

        // (Optional) nếu bạn muốn đảm bảo FE đang gửi restaurant/outlet hợp lệ:
        // UUID restaurantId = tenantResolver.currentRestaurantId();

        return kdsService.getBoards(tenantId, resolvedOutletId, since, status);
    }

    /**
     * Bếp cập nhật status item: FIRED/NEW -> IN_PROGRESS/READY...
     */
    @PatchMapping("/items/{itemId}/status")
    @PreAuthorize("hasAnyAuthority('ROOT','OWNER','ADMIN','MANAGER','STAFF')")
    public PatchKdsItemStatusResponse patchStatus(
            @PathVariable UUID itemId,
            @RequestBody PatchKdsItemStatusRequest req) {
        return kdsService.patchItemStatus(itemId, req);
    }

    // Nếu bạn có endpoint served:
    // @PostMapping("/orders/{orderId}/items/{itemId}/served")
    // ...
}
