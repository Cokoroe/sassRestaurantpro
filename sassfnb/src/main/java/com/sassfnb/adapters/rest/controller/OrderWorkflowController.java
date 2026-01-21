package com.sassfnb.adapters.rest.controller;

import com.sassfnb.adapters.rest.dto.kds.KdsDtos.PatchKdsItemStatusResponse;
import com.sassfnb.adapters.rest.dto.order.OrderDtos.*;
import com.sassfnb.application.service.KdsService;
import com.sassfnb.application.service.OrderWorkflowService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
public class OrderWorkflowController {

    private final OrderWorkflowService workflowService;

    private final KdsService kdsService;

    // =========================
    // PART 4 — SUBMIT / REOPEN
    // =========================

    /**
     * Submit order (thường dùng cho staff/POS bấm gửi bếp)
     * Nếu bạn chỉ muốn public submit thì hãy dùng
     * /api/v1/public/orders/{orderId}/submit
     */
    @PostMapping("/{orderId}/submit")
    @PreAuthorize("hasAnyAuthority('ROOT','OWNER','ADMIN','MANAGER','STAFF')")
    public SubmitOrderResponse submit(@PathVariable UUID orderId) {
        return workflowService.submit(orderId);
    }

    /**
     * (Optional) Mở lại order nếu bếp chưa làm
     */
    @PostMapping("/{orderId}/reopen")
    @PreAuthorize("hasAnyAuthority('ROOT','OWNER','ADMIN','MANAGER','STAFF')")
    public ReopenOrderResponse reopen(
            @PathVariable UUID orderId,
            @RequestBody(required = false) ReopenOrderRequest req) {
        return workflowService.reopen(orderId, req);
    }

    // =========================
    // PART 5 — FIRE ITEMS
    // =========================

    /**
     * Fire món (ra bếp)
     * Body: { "all": true } hoặc { "itemIds": ["uuid1","uuid2"] }
     */
    @PostMapping("/{orderId}/fire")
    @PreAuthorize("hasAnyAuthority('ROOT','OWNER','ADMIN','MANAGER','STAFF')")
    public OrderResponse fire(
            @PathVariable UUID orderId,
            @RequestBody FireOrderRequest req) {
        return workflowService.fire(orderId, req);
    }

    // =========================
    // PART 5 — VOID ITEM / ORDER
    // =========================

    /**
     * Void 1 item (không dùng DELETE)
     */
    @PostMapping("/{orderId}/items/{itemId}/void")
    @PreAuthorize("hasAnyAuthority('ROOT','OWNER','ADMIN','MANAGER','STAFF')")
    public OrderResponse voidItem(
            @PathVariable UUID orderId,
            @PathVariable UUID itemId,
            @RequestBody(required = false) VoidItemRequest req) {
        return workflowService.voidItem(orderId, itemId, req);
    }

    /**
     * Void cả order (chưa paid)
     */
    @PostMapping("/{orderId}/void")
    @PreAuthorize("hasAnyAuthority('ROOT','OWNER','ADMIN','MANAGER')")
    public OrderResponse voidOrder(
            @PathVariable UUID orderId,
            @RequestBody(required = false) VoidOrderRequest req) {
        return workflowService.voidOrder(orderId, req);
    }

    // =========================
    // PART 5 — PATCH NOTE
    // =========================

    /**
     * Sửa ghi chú order
     */
    @PatchMapping("/{orderId}/note")
    @PreAuthorize("hasAnyAuthority('ROOT','OWNER','ADMIN','MANAGER','STAFF')")
    public OrderResponse patchNote(
            @PathVariable UUID orderId,
            @RequestBody PatchOrderNoteRequest req) {
        return workflowService.patchNote(orderId, req);
    }

    // kds
    @PatchMapping("/{orderId}/items/{itemId}/served")
    @PreAuthorize("hasAnyAuthority('ROOT','OWNER','ADMIN','MANAGER','STAFF')")
    public PatchKdsItemStatusResponse served(
            @PathVariable UUID orderId,
            @PathVariable UUID itemId) {
        return kdsService.markServed(orderId, itemId);
    }
}
